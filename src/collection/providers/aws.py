"""FEAT-73 lot 1c — the live AWS provider.

The connection carries the access keys of an IAM user whose only right is to
assume the read-only role, with the External ID the suite generated for the
connection. Every read goes through the role's temporary credentials.

- AWS's own endpoints only: a region name is validated before it builds a
  host name, configured endpoint URLs are ignored, and keys left empty are a
  refusal, never a fallback to the server's own credentials.
- Reads only: a guard on each botocore client refuses any operation the
  reader of the collector does not declare (`READS`), before it is signed.
- Data minimised: a reader keeps the fields its rule evaluates, in the shape
  of the demonstration data, and nothing else (the credential report lists
  people).
- A refusal names the IAM action that was refused. A region or a resource
  that cannot be read is listed as unreadable while the others are read; the
  collection fails only when nothing could be read.

boto3 is synchronous: a collection runs in a worker thread.
"""
from __future__ import annotations

import asyncio
import csv
import io
import json
import re
import secrets as _secrets
import time
import urllib.parse
from datetime import datetime, timezone
from typing import Any, Callable

ROLE_ARN_RE = re.compile(r"^arn:aws:iam::\d{12}:role/[\w+=,.@/-]{1,512}$")
ACCESS_KEY_RE = re.compile(r"^AKIA[A-Z0-9]{16}$")
# The commercial partition only, like ROLE_ARN_RE (no cn-, us-gov-, *-iso*).
REGION_RE = re.compile(r"^(?!cn-|us-gov-|[a-z]{2}-iso)[a-z]{2}(-[a-z]+)+-\d{1,2}$")
HOME_REGION = "us-east-1"                 # the global reads, when no region is set
SESSION_SECONDS = 3600
SESSION_NAME = "cisotoolbox-compliance"

# IAM actions whose name is not "<service>:<operation>".
_PREFIX = {"elbv2": "elasticloadbalancing", "s3control": "s3"}
_IAM_ACTION = {("s3", "ListBuckets"): "s3:ListAllMyBuckets",
               ("s3", "GetBucketEncryption"): "s3:GetEncryptionConfiguration",
               ("s3control", "GetPublicAccessBlock"): "s3:GetAccountPublicAccessBlock"}
_DENIED = {"AccessDenied", "AccessDeniedException", "UnauthorizedOperation", "AuthorizationError",
           "UnauthorizedAccess"}
_REFUSED_KEYS = {"InvalidClientTokenId", "SignatureDoesNotMatch", "UnrecognizedClientException"}
# What STS answers in a region the account has not enabled, or where STS is off.
_STS_REGION_OFF = {"RegionDisabledException", "InvalidClientTokenId"}
# Answers that are not a refusal but that a person can act on.
_EXPLAINED = {"ExpiredToken": "the role's credentials expired during the collection: run it again",
              "Throttling": "AWS throttled the reads: run the collection again later",
              "ThrottlingException": "AWS throttled the reads: run the collection again later",
              "RequestLimitExceeded": "AWS throttled the reads: run the collection again later",
              "ReportInProgress": "AWS is still generating the credential report: run the collection again "
                                  "in a few minutes"}


def iam_action(service: str, operation: str) -> str:
    return _IAM_ACTION.get((service, operation), f"{_PREFIX.get(service, service)}:{operation}")


def new_external_id() -> str:
    return "ciso-" + _secrets.token_hex(16)


def validate_settings(settings: dict, live: bool) -> None:
    """Raises ValueError on a role or a region AWS would not accept."""
    role = settings.get("role_arn")
    if role is not None and not isinstance(role, str):
        raise ValueError("role_arn must be text")
    regions = settings.get("regions")
    if regions is not None and not (isinstance(regions, str)
                                    or (isinstance(regions, list) and all(isinstance(r, str) for r in regions))):
        raise ValueError("regions must be a list of region names")
    if live and role and not ROLE_ARN_RE.match(role):
        raise ValueError("role_arn must be the ARN of an IAM role (arn:aws:iam::<account>:role/<name>)")
    for region in regions_setting(settings):
        if not REGION_RE.match(region):
            raise ValueError(f"unknown region name {region}")


def validate_secrets(secrets: dict) -> None:
    key = secrets.get("access_key_id")
    if key and not ACCESS_KEY_RE.match(key):
        raise ValueError("access_key_id must be the long-term access key of an IAM user (AKIA…)")


def regions_setting(settings: dict) -> list[str]:
    value = settings.get("regions") or []
    if isinstance(value, str):
        value = value.split(",")
    return [r.strip() for r in value if isinstance(r, str) and r.strip()]


def home_region(settings: dict) -> str:
    regions = [r for r in regions_setting(settings) if REGION_RE.match(r)]
    return regions[0] if regions else HOME_REGION


# ── What each reader may call: (service, operation) ─────────────────────

_REPORT = {("iam", "GenerateCredentialReport"), ("iam", "GetCredentialReport")}
_REGIONS = {("ec2", "DescribeRegions")}
_RDS = {("rds", "DescribeDBInstances")}
READS: dict[str, set[tuple[str, str]]] = {
    "AWS-01": _REPORT, "AWS-02": _REPORT, "AWS-03": _REPORT,
    "AWS-04": {("iam", "GetAccountPasswordPolicy")},
    "AWS-05": {("iam", "GetAccountAuthorizationDetails")},
    "AWS-06": {("s3control", "GetPublicAccessBlock"), ("s3", "ListBuckets"), ("s3", "GetBucketPolicyStatus")},
    "AWS-07": _REGIONS | _RDS | {("ec2", "GetEbsEncryptionByDefault"), ("s3", "ListBuckets"),
                                 ("s3", "GetBucketEncryption")},
    "AWS-08": {("cloudtrail", "DescribeTrails"), ("cloudtrail", "GetTrailStatus")},
    "AWS-09": _REGIONS | {("ec2", "DescribeSecurityGroups")},
    "AWS-10": _REGIONS | _RDS | {("backup", "ListProtectedResources")},
    "AWS-11": _REGIONS | {("guardduty", "ListDetectors"), ("guardduty", "GetDetector"),
                          ("securityhub", "DescribeHub")},
    "AWS-12": _REGIONS | {("ec2", "DescribeVpcs"), ("ec2", "DescribeFlowLogs")},
    "AWS-13": _REGIONS | {("elbv2", "DescribeLoadBalancers"), ("elbv2", "DescribeListeners")},
    "AWS-14": _REGIONS | {("ec2", "DescribeInstances")},
}
# The test of a connection: one cheap read per service the role is granted.
_PROBES = {("iam", "GetAccountPasswordPolicy"), ("ec2", "DescribeRegions"), ("s3", "ListBuckets"),
           ("backup", "ListProtectedResources")}


class Denied(Exception):
    def __init__(self, action: str):
        super().__init__(action)
        self.action = action


class Unreachable(Exception):
    pass


class Unreadable(Exception):
    """A resource the reader cannot address; its message says why."""


class Session:
    """The role's credentials, and clients that can only call ``allowed``."""

    def __init__(self, conn: Any, secrets: dict, allowed: set[tuple[str, str]]):
        import boto3
        from botocore.config import Config
        key, secret = secrets.get("access_key_id"), secrets.get("secret_access_key")
        settings = dict(conn.settings or {})
        if not key or not secret or not settings.get("role_arn") or not settings.get("external_id"):
            raise ValueError("the connection lacks its access keys, its role or its External ID")
        self.allowed = set(allowed)
        self.config = Config(connect_timeout=5, read_timeout=30, retries={"max_attempts": 5, "mode": "standard"},
                             ignore_configured_endpoint_urls=True, user_agent_appid=SESSION_NAME)
        self.settings = settings
        # The region of the global reads (IAM, STS, S3's bucket list): the first
        # one set, so that an organisation that denies the others still answers.
        self.home = home_region(settings)
        self._user = boto3.session.Session(aws_access_key_id=key, aws_secret_access_key=secret,
                                           region_name=self.home)
        self._role: Any = None
        self.account = ""
        self._clients: dict[tuple[str, str], Any] = {}

    def assume(self) -> None:
        import boto3
        # STS in the home region first; in us-east-1 when that region is not
        # enabled for the account (its credentials are valid in every region).
        for region in dict.fromkeys((self.home, HOME_REGION)):
            sts = self._guarded(self._user.client("sts", region_name=region, config=self.config),
                                {("sts", "AssumeRole")})
            try:
                out = self._call(sts, "assume_role", RoleArn=self.settings["role_arn"], RoleSessionName=SESSION_NAME,
                                 ExternalId=self.settings["external_id"], DurationSeconds=SESSION_SECONDS)
                break
            except Exception as exc:  # noqa: BLE001
                if region == HOME_REGION or _error_code(exc) not in _STS_REGION_OFF:
                    raise
        c = out["Credentials"]
        self._role = boto3.session.Session(aws_access_key_id=c["AccessKeyId"], aws_secret_access_key=c["SecretAccessKey"],
                                           aws_session_token=c["SessionToken"], region_name=self.home)
        self.account = out["AssumedRoleUser"]["Arn"].split(":")[4]

    def client(self, service: str, region: str) -> Any:
        if not REGION_RE.match(region):
            raise ValueError(f"unknown region name {region}")
        if (service, region) not in self._clients:
            self._clients[(service, region)] = self._guarded(
                self._role.client(service, region_name=region, config=self.config), self.allowed)
        return self._clients[(service, region)]

    @staticmethod
    def _guarded(client: Any, allowed: set[tuple[str, str]]) -> Any:
        service = client.meta.service_model.service_name

        def guard(model: Any = None, **_: Any) -> None:
            if (service, model.name) not in allowed:
                raise PermissionError(f"{service}:{model.name} is not a declared read")
        # The first event of a call: before its parameters are built or it is signed.
        client.meta.events.register("provide-client-params", guard)
        return client

    def call(self, service: str, region: str, method: str, **kwargs: Any) -> dict:
        return self._call(self.client(service, region), method, **kwargs)

    def pages(self, service: str, region: str, method: str, key: str, **kwargs: Any) -> list:
        client = self.client(service, region)
        out: list = []
        try:
            for page in client.get_paginator(method).paginate(**kwargs):
                out.extend(page.get(key) or [])
        except Exception as exc:  # noqa: BLE001 — classified below
            classified = _classify(client, exc)
            if classified is exc:
                raise
            raise classified from exc
        return out

    @staticmethod
    def _call(client: Any, method: str, **kwargs: Any) -> dict:
        try:
            return getattr(client, method)(**kwargs)
        except Exception as exc:  # noqa: BLE001 — classified below
            classified = _classify(client, exc)
            if classified is exc:
                raise
            raise classified from exc


def _error_code(exc: Exception) -> str:
    return str((getattr(exc, "response", None) or {}).get("Error", {}).get("Code", ""))


def _classify(client: Any, exc: Exception) -> Exception:
    from botocore.exceptions import ClientError, ConnectTimeoutError, EndpointConnectionError, ReadTimeoutError
    if isinstance(exc, ClientError) and _error_code(exc) in _DENIED:
        return Denied(iam_action(client.meta.service_model.service_name, exc.operation_name))
    if isinstance(exc, (EndpointConnectionError, ConnectTimeoutError, ReadTimeoutError)):
        return Unreachable(str(exc))
    return exc


def _each(items: list, read: Callable[[Any], Any], name: Callable[[Any], str]) -> tuple[list, list[dict]]:
    """Read every item; one that cannot be read is listed, the others are
    kept. Raises when none could be read and at least one was refused."""
    done, unreadable, denied = [], [], None
    for item in items:
        try:
            done.append(read(item))
        except PermissionError:                 # the guard: a reader bug, never an unreadable resource
            raise
        except Denied as exc:
            denied = denied or exc
            unreadable.append({"resource": name(item), "reason": f"access denied ({exc.action})"})
        except Unreachable:
            unreadable.append({"resource": name(item), "reason": "AWS could not be reached"})
        except Unreadable as exc:
            unreadable.append({"resource": name(item), "reason": str(exc)})
        except Exception as exc:  # noqa: BLE001 — one resource does not stop the others
            unreadable.append({"resource": name(item), "reason": _error_code(exc) or type(exc).__name__})
    if items and not done and denied is not None:
        raise denied
    return done, unreadable


# ── Readers: (session, regions, now) → (raw, data_as_of, unreadable) ────

ROOT = "<root_account>"
_KEYS = ("access_key_1_active", "access_key_2_active")
# Per collector: the rows its rule evaluates, and their columns.
_REPORT_ROWS: dict[str, tuple[Callable[[dict], bool], tuple[str, ...]]] = {
    "AWS-01": (lambda r: r.get("user") == ROOT,
               ("user", "mfa_active", "password_last_used") + _KEYS),
    "AWS-02": (lambda r: r.get("user") != ROOT and r.get("password_enabled") == "true",
               ("user", "password_enabled", "mfa_active")),
    "AWS-03": (lambda r: any(r.get(k) == "true" for k in _KEYS),
               ("user",) + tuple(f"access_key_{n}_{c}" for n in (1, 2) for c in ("active", "last_rotated",
                                                                                "last_used_date"))),
}
_REPORT_POLLS, _REPORT_WAIT = 10, 2


def _credential_report(code: str) -> Callable[[Session, list[str], datetime], tuple]:
    keep, columns = _REPORT_ROWS[code]

    def read(s: Session, regions: list[str], now: datetime):
        for _ in range(_REPORT_POLLS):
            if s.call("iam", s.home, "generate_credential_report").get("State") == "COMPLETE":
                break
            time.sleep(_REPORT_WAIT)
        out = s.call("iam", s.home, "get_credential_report")
        rows = csv.DictReader(io.StringIO(out["Content"].decode("utf-8")))
        report = [{k: r[k] for k in columns if r.get(k) not in (None, "")} for r in rows if keep(r)]
        return {"credential_report": report}, out.get("GeneratedTime") or now, []
    return read


def _password_policy(s: Session, regions: list[str], now: datetime):
    try:
        p = s.call("iam", s.home, "get_account_password_policy")["PasswordPolicy"]
    except Exception as exc:  # noqa: BLE001
        if _error_code(exc) != "NoSuchEntity":
            raise
        return {"PasswordPolicy": None}, now, []
    return {"PasswordPolicy": {k: p[k] for k in ("MinimumPasswordLength", "PasswordReusePrevention") if k in p}}, now, []


def _document(doc: Any) -> dict:
    if isinstance(doc, str):
        doc = json.loads(urllib.parse.unquote(doc))
    statements = doc.get("Statement") or []
    statements = [statements] if isinstance(statements, dict) else statements
    return {"Statement": [{k: st[k] for k in ("Effect", "Action", "Resource") if k in st} for st in statements]}


def _policies(s: Session, regions: list[str], now: datetime):
    policies = []
    for p in s.pages("iam", s.home, "get_account_authorization_details", "Policies", Filter=["LocalManagedPolicy"]):
        default = next((v for v in p.get("PolicyVersionList") or [] if v.get("IsDefaultVersion")), {})
        policies.append({"PolicyName": p["PolicyName"], "Arn": p["Arn"], "AttachmentCount": p.get("AttachmentCount", 0),
                         "Document": _document(default.get("Document") or {})})
    return {"Policies": policies}, now, []


def _buckets(s: Session) -> list[dict]:
    return s.pages("s3", s.home, "list_buckets", "Buckets")


def _bucket_region(b: dict) -> str:
    # Never guessed: a redirect would make botocore call an undeclared operation.
    region = b.get("BucketRegion") or ""
    if not REGION_RE.match(region):
        raise Unreadable("its region is unknown")
    return region


def _public_access(s: Session, regions: list[str], now: datetime):
    try:
        block = s.call("s3control", s.home, "get_public_access_block", AccountId=s.account)
        account = block.get("PublicAccessBlockConfiguration") or {}
    except Exception as exc:  # noqa: BLE001
        if _error_code(exc) != "NoSuchPublicAccessBlockConfiguration":
            raise
        account = {}

    def status(b: dict) -> dict:
        try:
            st = s.call("s3", _bucket_region(b), "get_bucket_policy_status", Bucket=b["Name"])["PolicyStatus"]
        except Exception as exc:  # noqa: BLE001
            if _error_code(exc) != "NoSuchBucketPolicy":
                raise
            st = {}
        return {"Name": b["Name"], "PolicyStatus": {"IsPublic": bool(st.get("IsPublic"))}}
    buckets, unreadable = _each(_buckets(s), status, lambda b: f"s3://{b['Name']}")
    blocks = {k: bool(account.get(k)) for k in ("BlockPublicAcls", "IgnorePublicAcls", "BlockPublicPolicy",
                                               "RestrictPublicBuckets")}
    return {"AccountPublicAccessBlock": blocks, "Buckets": buckets}, now, unreadable


def _per_region(regions: list[str], read: Callable[[str], Any]) -> tuple[list, list[dict]]:
    return _each(regions, read, lambda r: r)


def _db_instances(s: Session, regions: list[str], fields: tuple[str, ...]) -> tuple[list, list[dict]]:
    found, unreadable = _per_region(regions, lambda r: s.pages("rds", r, "describe_db_instances", "DBInstances"))
    return [{k: db.get(k) for k in fields} for dbs in found for db in dbs], unreadable


def _encryption(s: Session, regions: list[str], now: datetime):
    ebs, unreadable = _per_region(regions, lambda r: (r, bool(s.call("ec2", r, "get_ebs_encryption_by_default")
                                                              .get("EbsEncryptionByDefault"))))

    def encryption(b: dict) -> dict:
        try:
            rules = (s.call("s3", _bucket_region(b), "get_bucket_encryption", Bucket=b["Name"])
                     .get("ServerSideEncryptionConfiguration") or {}).get("Rules") or []
        except Exception as exc:  # noqa: BLE001
            if _error_code(exc) != "ServerSideEncryptionConfigurationNotFoundError":
                raise
            rules = []
        return {"Name": b["Name"], "Encryption": bool(rules)}
    buckets, more = _each(_buckets(s), encryption, lambda b: f"s3://{b['Name']}")
    dbs, rds_unreadable = _db_instances(s, regions, ("DBInstanceIdentifier", "StorageEncrypted"))
    return ({"Regions": {r: {"EbsEncryptionByDefault": on} for r, on in ebs}, "Buckets": buckets, "DBInstances": dbs},
            now, unreadable + more + [dict(u, resource=f"rds:{u['resource']}") for u in rds_unreadable])


def _trails(s: Session, regions: list[str], now: datetime):
    home = regions[0] if regions else s.home
    trails = s.call("cloudtrail", home, "describe_trails", includeShadowTrails=True).get("trailList") or []
    unique = list({t["TrailARN"]: t for t in trails}.values())

    def status(t: dict) -> dict:
        region = t.get("HomeRegion") if REGION_RE.match(t.get("HomeRegion") or "") else home
        st = s.call("cloudtrail", region, "get_trail_status", Name=t["TrailARN"])
        return {"Name": t["Name"], "IsMultiRegionTrail": bool(t.get("IsMultiRegionTrail")),
                "LogFileValidationEnabled": bool(t.get("LogFileValidationEnabled")),
                "Status": {"IsLogging": bool(st.get("IsLogging"))}}
    read, unreadable = _each(unique, status, lambda t: t["Name"])
    return {"Trails": read}, now, unreadable


def _security_groups(s: Session, regions: list[str], now: datetime):
    def ranges(perm: dict) -> dict:
        return {"IpProtocol": perm.get("IpProtocol"), "FromPort": perm.get("FromPort"), "ToPort": perm.get("ToPort"),
                "IpRanges": [{"CidrIp": r.get("CidrIp")} for r in perm.get("IpRanges") or []],
                "Ipv6Ranges": [{"CidrIpv6": r.get("CidrIpv6")} for r in perm.get("Ipv6Ranges") or []]}
    found, unreadable = _per_region(regions, lambda r: [
        {"GroupId": g["GroupId"], "Region": r, "IpPermissions": [ranges(p) for p in g.get("IpPermissions") or []]}
        for g in s.pages("ec2", r, "describe_security_groups", "SecurityGroups")])
    return {"SecurityGroups": [g for groups in found for g in groups]}, now, unreadable


def _backups(s: Session, regions: list[str], now: datetime):
    # Every resource AWS Backup protects, with its last backup, however long ago.
    found, unreadable = _per_region(regions, lambda r: s.pages("backup", r, "list_protected_resources", "Results"))
    last = {p["ResourceArn"]: p.get("LastBackupTime") for ps in found for p in ps if p.get("ResourceArn")}
    dbs, rds_unreadable = _db_instances(s, regions, ("DBInstanceIdentifier", "BackupRetentionPeriod"))
    protected = [{"ResourceArn": arn, "LastCompletedRecoveryPoint": d.isoformat() if isinstance(d, datetime) else d}
                 for arn, d in sorted(last.items())]
    return ({"ProtectedResources": protected, "DBInstances": dbs}, now,
            unreadable + [dict(u, resource=f"rds:{u['resource']}") for u in rds_unreadable])


def _detection(s: Session, regions: list[str], now: datetime):
    def region(r: str) -> tuple[str, dict]:
        detectors = s.call("guardduty", r, "list_detectors").get("DetectorIds") or []
        guardduty = any(s.call("guardduty", r, "get_detector", DetectorId=d).get("Status") == "ENABLED"
                        for d in detectors)
        try:
            s.call("securityhub", r, "describe_hub")
            hub = True
        except Exception as exc:  # noqa: BLE001 — not subscribed is an answer, not a failure
            if _error_code(exc) not in ("InvalidAccessException", "ResourceNotFoundException"):
                raise
            hub = False
        return r, {"GuardDuty": guardduty, "SecurityHub": hub}
    found, unreadable = _per_region(regions, region)
    return {"Regions": dict(found)}, now, unreadable


def _flow_logs(s: Session, regions: list[str], now: datetime):
    def region(r: str) -> tuple[list, list]:
        vpcs = [{"VpcId": v["VpcId"], "Region": r} for v in s.pages("ec2", r, "describe_vpcs", "Vpcs")]
        logs = [{"ResourceId": f.get("ResourceId"), "FlowLogStatus": f.get("FlowLogStatus")}
                for f in s.pages("ec2", r, "describe_flow_logs", "FlowLogs")]
        return vpcs, logs
    found, unreadable = _per_region(regions, region)
    return ({"Vpcs": [v for vs, _ in found for v in vs], "FlowLogs": [f for _, fs in found for f in fs]},
            now, unreadable)


def _listeners(s: Session, regions: list[str], now: datetime):
    def listener(li: dict) -> dict:
        return {"ListenerArn": li["ListenerArn"], "Protocol": li.get("Protocol"), "Port": li.get("Port"),
                "SslPolicy": li.get("SslPolicy"),
                "DefaultActions": [{"Type": a.get("Type"),
                                    "RedirectConfig": {"Protocol": (a.get("RedirectConfig") or {}).get("Protocol")}}
                                   for a in li.get("DefaultActions") or []]}

    def region(r: str) -> list:
        lbs = s.pages("elbv2", r, "describe_load_balancers", "LoadBalancers")
        return [listener(li) for lb in lbs
                for li in s.pages("elbv2", r, "describe_listeners", "Listeners", LoadBalancerArn=lb["LoadBalancerArn"])]
    found, unreadable = _per_region(regions, region)
    return {"Listeners": [li for lis in found for li in lis]}, now, unreadable


def _instances(s: Session, regions: list[str], now: datetime):
    def region(r: str) -> list:
        reservations = s.pages("ec2", r, "describe_instances", "Reservations", Filters=[
            {"Name": "instance-state-name", "Values": ["pending", "running", "stopping", "stopped"]}])
        return [{"InstanceId": i["InstanceId"], "Region": r,
                 "MetadataOptions": {"HttpTokens": (i.get("MetadataOptions") or {}).get("HttpTokens")}}
                for res in reservations for i in res.get("Instances") or []]
    found, unreadable = _per_region(regions, region)
    return {"Instances": [i for its in found for i in its]}, now, unreadable


READERS: dict[str, Callable[[Session, list[str], datetime], tuple]] = {
    "AWS-01": _credential_report("AWS-01"), "AWS-02": _credential_report("AWS-02"),
    "AWS-03": _credential_report("AWS-03"),
    "AWS-04": _password_policy, "AWS-05": _policies, "AWS-06": _public_access, "AWS-07": _encryption,
    "AWS-08": _trails, "AWS-09": _security_groups, "AWS-10": _backups, "AWS-11": _detection,
    "AWS-12": _flow_logs, "AWS-13": _listeners, "AWS-14": _instances,
}


def _regions(s: Session) -> list[str]:
    configured = regions_setting(s.settings)
    if configured:
        return configured
    found = s.call("ec2", s.home, "describe_regions").get("Regions") or []
    return sorted(r["RegionName"] for r in found if REGION_RE.match(r.get("RegionName") or ""))


def _error(reason: str, missing: str | None = None) -> dict:
    return {"raw": None, "data_as_of": None, "unreadable": [],
            "error": {"reason": reason, "missing_permission": missing}}


def _assume_failure(exc: Exception) -> dict:
    """The error of a role that could not be assumed."""
    if isinstance(exc, Denied):
        return _error("the IAM user cannot assume the role: check that the role ARN is the RoleArn output of the "
                      "stack, that the stack's ExternalId is the External ID shown on the connection, and that the "
                      "access key is that of the stack's user", "sts:AssumeRole")
    if _error_code(exc) in _REFUSED_KEYS:
        return _error("AWS refused the access keys: check them, or create a new one for the stack's user")
    return _failure(exc)


def _failure(exc: Exception) -> dict:
    """The error of a read that failed without a refusal: its AWS code, said
    in words when a person can act on it."""
    if isinstance(exc, Unreachable):
        return _error("AWS could not be reached")
    code = _error_code(exc)
    if code:
        return _error(_EXPLAINED.get(code, f"AWS answered {code}"))
    raise exc


class AwsProvider:
    def __init__(self, session_factory: Callable[..., Session] = Session):
        self.session_factory = session_factory

    async def fetch(self, conn: Any, secrets: dict, collector: dict, params: dict, now: datetime) -> dict:
        return await asyncio.to_thread(self.fetch_sync, conn, secrets, collector, now)

    def fetch_sync(self, conn: Any, secrets: dict, collector: dict, now: datetime) -> dict:
        code = collector["code"]
        try:
            s = self.session_factory(conn, secrets, READS[code])
        except ValueError as exc:
            return _error(str(exc))
        try:
            s.assume()
        except PermissionError:
            raise
        except Exception as exc:  # noqa: BLE001
            return _assume_failure(exc)
        try:
            regions = _regions(s) if ("ec2", "DescribeRegions") in READS[code] else regions_setting(s.settings)
            raw, as_of, unreadable = READERS[code](s, regions, now)
        except PermissionError:                 # the guard: a reader bug, never an AWS answer
            raise
        except Denied as exc:
            return _error("AccessDenied", exc.action)
        except Exception as exc:  # noqa: BLE001 — an AWS answer, or a bug re-raised
            return _failure(exc)
        as_of = as_of if isinstance(as_of, datetime) else now
        return {"raw": raw, "data_as_of": as_of.astimezone(timezone.utc), "unreadable": unreadable, "error": None}

    async def test(self, conn: Any, secrets: dict) -> dict:
        return await asyncio.to_thread(self.test_sync, conn, secrets)

    def test_sync(self, conn: Any, secrets: dict) -> dict:
        def refused(message: str, missing: list[str]) -> dict:
            return {"ok": False, "partial": False, "missing_permissions": missing, "message": message}
        try:
            s = self.session_factory(conn, secrets, _PROBES)
        except ValueError as exc:
            return refused(str(exc)[0].upper() + str(exc)[1:] + ".", [])
        try:
            s.assume()
        except Exception as exc:  # noqa: BLE001
            try:
                error = _assume_failure(exc)["error"]
            except Exception:  # noqa: BLE001 — not an AWS answer: said by its type, never its text
                return refused(f"The role could not be assumed ({type(exc).__name__}).", [])
            return refused(error["reason"][0].upper() + error["reason"][1:] + ".",
                           [error["missing_permission"]] if error["missing_permission"] else [])
        probes = [
            ("iam:GetAccountPasswordPolicy", lambda: s.call("iam", s.home, "get_account_password_policy")),
            ("ec2:DescribeRegions", lambda: s.call("ec2", s.home, "describe_regions")),
            ("s3:ListAllMyBuckets", lambda: s.call("s3", s.home, "list_buckets", MaxBuckets=1)),
            ("backup:ListProtectedResources", lambda: s.call("backup", s.home, "list_protected_resources",
                                                             MaxResults=1)),
        ]
        missing = []
        for right, probe in probes:
            try:
                probe()
            except Denied:
                missing.append(right)
            except Unreachable:
                return refused("AWS could not be reached.", [])
            except PermissionError:             # the guard: a probe not declared in _PROBES
                raise
            except Exception:  # noqa: BLE001 — any answer but a refusal means the right is there
                pass
        if len(missing) == len(probes):
            return refused("The role was assumed but can read nothing: update the stack with the role template.",
                           missing)
        if missing:
            return {"ok": True, "partial": True, "missing_permissions": missing,
                    "message": "Connected; some collectors will fail until these rights are granted: "
                               + ", ".join(missing)}
        return {"ok": True, "partial": False, "missing_permissions": [], "message": f"Connected to account {s.account}."}
