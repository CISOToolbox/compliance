"""FEAT-73 lot 1c — the live AWS provider, without a network call.

The readers run on AWS's answers (canned here, in the shape boto3 returns
them) and must give the rules the data the demonstration gives them: the
same fields, nothing more. The guard on a real botocore client refuses an
operation the reader does not declare; a refusal names the IAM action;
missing keys never fall back to the server's own credentials.
"""
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@localhost/db")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
os.environ["ENCRYPTION_KEY"] = "a-test-encryption-key-of-enough-length-0123456789"
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from botocore.exceptions import ClientError  # noqa: E402

from src.collection.catalog import load_catalog  # noqa: E402
from src.collection.connections import ConnectionInputError, apply_connection_input, connection_view  # noqa: E402
from src.collection.engine import finalize  # noqa: E402
from src.collection.providers import aws  # noqa: E402
from src.collection.service import evaluators  # noqa: E402
from src.models import CollectionConnection  # noqa: E402

NOW = datetime(2026, 11, 20, 6, 0, tzinfo=timezone.utc)
ROLE = "arn:aws:iam::111122223333:role/ciso-audit"
# Split: a whole key-shaped literal trips the secret scan of the sources.
KEY_ID = "AKIA" + "ABCDEFGHIJKLMNOP"
KEYS = {"access_key_id": KEY_ID, "secret_access_key": "x" * 40}


def _conn(settings=None):
    return CollectionConnection(id=uuid.uuid4(), project_id=uuid.uuid4(), provider="aws", label="MedSecure", mode="live",
                                settings={"role_arn": ROLE, "external_id": "ciso-0123", **(settings or {})})


def _denied(operation):
    return ClientError({"Error": {"Code": "AccessDenied", "Message": "no"}}, operation)


def _absent(code, operation):
    return ClientError({"Error": {"Code": code, "Message": "none"}}, operation)


class FakeSession:
    """A Session whose AWS is a dict: (service, region, method) → answer,
    or an exception, or a callable of the call's arguments."""

    def __init__(self, answers, settings=None):
        self.answers, self.account, self.calls = answers, "111122223333", []
        self.settings = {"role_arn": ROLE, "external_id": "ciso-0123", "regions": ["eu-west-3"], **(settings or {})}
        self.home = aws.home_region(self.settings)

    def assume(self):
        pass

    def _answer(self, service, region, method, kwargs):
        self.calls.append((service, region, method))
        a = self.answers.get((service, region, method), self.answers.get((service, "*", method)))
        if a is None:
            raise AssertionError(f"unexpected call {service} {region} {method}")
        if callable(a):
            a = a(**kwargs)
        if isinstance(a, Exception):
            if isinstance(a, ClientError) and a.response["Error"]["Code"] == "AccessDenied":
                raise aws.Denied(aws.iam_action(service, a.operation_name))
            raise a
        return a

    def call(self, service, region, method, **kwargs):
        return self._answer(service, region, method, kwargs)

    def pages(self, service, region, method, key, **kwargs):
        return self._answer(service, region, method, kwargs).get(key) or []


REPORT = (b"user,arn,user_creation_time,password_enabled,password_last_used,mfa_active,access_key_1_active,"
          b"access_key_1_last_rotated,access_key_1_last_used_date,access_key_2_active,cert_1_active\n"
          b"<root_account>,arn:aws:iam::111122223333:root,2020-01-01T00:00:00+00:00,not_supported,"
          b"2026-05-01T00:00:00+00:00,true,false,N/A,N/A,false,false\n"
          b"j.martin,arn:aws:iam::111122223333:user/j.martin,2024-01-01T00:00:00+00:00,true,"
          b"2026-11-19T00:00:00+00:00,false,true,2026-10-31T00:00:00+00:00,2026-11-19T00:00:00+00:00,false,false\n")

MEDSECURE = {
    ("iam", "*", "generate_credential_report"): {"State": "COMPLETE"},
    ("iam", "*", "get_credential_report"): {"Content": REPORT, "GeneratedTime": NOW - timedelta(hours=2)},
    ("iam", "*", "get_account_password_policy"): {"PasswordPolicy": {
        "MinimumPasswordLength": 12, "PasswordReusePrevention": 24, "RequireSymbols": True, "MaxPasswordAge": 90}},
    ("iam", "*", "get_account_authorization_details"): {"Policies": [
        {"PolicyName": "LegacyAdmin", "Arn": "arn:aws:iam::111122223333:policy/LegacyAdmin", "AttachmentCount": 1,
         "PolicyId": "ANPA1", "Path": "/", "PolicyVersionList": [
             {"VersionId": "v1", "IsDefaultVersion": False, "Document": {"Statement": [{"Effect": "Deny", "Action": "*"}]}},
             {"VersionId": "v2", "IsDefaultVersion": True, "Document":
              "%7B%22Statement%22%3A%5B%7B%22Sid%22%3A%22all%22%2C%22Effect%22%3A%22Allow%22%2C%22Action%22%3A%22%2A%22%2C"
              "%22Resource%22%3A%22%2A%22%7D%5D%7D"}]}]},
    ("s3control", "*", "get_public_access_block"): _absent("NoSuchPublicAccessBlockConfiguration", "GetPublicAccessBlock"),
    ("s3", "*", "list_buckets"): {"Buckets": [{"Name": "medsecure-backups", "BucketRegion": "eu-west-3"},
                                                      {"Name": "medsecure-portal-assets", "BucketRegion": "eu-west-3"}],
                                          "Owner": {"DisplayName": "medsecure", "ID": "abc"}},
    ("s3", "eu-west-3", "get_bucket_policy_status"): lambda Bucket: (
        {"PolicyStatus": {"IsPublic": True}} if Bucket == "medsecure-portal-assets"
        else _absent("NoSuchBucketPolicy", "GetBucketPolicyStatus")),
    ("s3", "eu-west-3", "get_bucket_encryption"): lambda Bucket: {"ServerSideEncryptionConfiguration": {"Rules": [
        {"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}},
    ("ec2", "eu-west-3", "get_ebs_encryption_by_default"): {"EbsEncryptionByDefault": False},
    ("rds", "eu-west-3", "describe_db_instances"): {"DBInstances": [
        {"DBInstanceIdentifier": "telesuivi-db", "StorageEncrypted": True, "BackupRetentionPeriod": 14,
         "MasterUsername": "admin", "Endpoint": {"Address": "telesuivi-db.example"}}]},
    ("cloudtrail", "eu-west-3", "describe_trails"): {"trailList": [
        {"Name": "medsecure-org-trail", "TrailARN": "arn:aws:cloudtrail:eu-west-3:111122223333:trail/medsecure-org-trail",
         "HomeRegion": "eu-west-3", "IsMultiRegionTrail": True, "LogFileValidationEnabled": True, "S3BucketName": "logs"}]},
    ("cloudtrail", "eu-west-3", "get_trail_status"): {"IsLogging": True, "LatestDeliveryTime": NOW},
    ("ec2", "eu-west-3", "describe_security_groups"): {"SecurityGroups": [
        {"GroupId": "sg-0b2bastion", "GroupName": "bastion", "Description": "ssh", "IpPermissions": [
            {"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22, "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "x"}],
             "UserIdGroupPairs": []}]}]},
    ("backup", "eu-west-3", "list_protected_resources"): {"Results": [
        {"ResourceArn": "arn:aws:rds:eu-west-3:111122223333:db:telesuivi-db", "ResourceType": "RDS",
         "LastBackupTime": NOW - timedelta(hours=10)},
        {"ResourceArn": "arn:aws:s3:::medsecure-backups", "ResourceType": "S3", "LastBackupTime": NOW - timedelta(days=3)},
        # Its backups stopped two months ago: still listed, so still evaluated.
        {"ResourceArn": "arn:aws:ec2:eu-west-3:111122223333:volume/vol-0archive", "ResourceType": "EBS",
         "LastBackupTime": NOW - timedelta(days=60)}]},
    ("guardduty", "eu-west-3", "list_detectors"): {"DetectorIds": ["d1"]},
    ("guardduty", "eu-west-3", "get_detector"): {"Status": "ENABLED"},
    ("securityhub", "eu-west-3", "describe_hub"): _absent("InvalidAccessException", "DescribeHub"),
    ("ec2", "eu-west-3", "describe_vpcs"): {"Vpcs": [{"VpcId": "vpc-1", "CidrBlock": "10.0.0.0/16"}]},
    ("ec2", "eu-west-3", "describe_flow_logs"): {"FlowLogs": []},
    ("elbv2", "eu-west-3", "describe_load_balancers"): {"LoadBalancers": [{"LoadBalancerArn": "arn:lb/portail"}]},
    ("elbv2", "eu-west-3", "describe_listeners"): {"Listeners": [
        {"ListenerArn": "arn:lb/portail/http", "Protocol": "HTTP", "Port": 80,
         "DefaultActions": [{"Type": "forward", "TargetGroupArn": "arn:tg"}]}]},
    ("ec2", "eu-west-3", "describe_instances"): lambda Filters: {"Reservations": [{"Instances": [
        {"InstanceId": "i-0legacy02", "MetadataOptions": {"HttpTokens": "optional"}, "PrivateIpAddress": "10.0.0.4"}]}]},
}

# What each collector finds on MedSecure's account above.
EXPECTED = {
    "AWS-01": ("conforme", []),
    "AWS-02": ("non_conforme", ["j.martin"]),
    "AWS-03": ("conforme", []),
    "AWS-04": ("non_conforme", ["password-policy"]),
    "AWS-05": ("non_conforme", ["arn:aws:iam::111122223333:policy/LegacyAdmin"]),
    "AWS-06": ("non_conforme", ["account", "s3://medsecure-portal-assets"]),
    "AWS-07": ("non_conforme", ["ebs:eu-west-3"]),
    "AWS-08": ("conforme", []),
    "AWS-09": ("non_conforme", ["sg-0b2bastion"]),
    "AWS-10": ("non_conforme", ["arn:aws:s3:::medsecure-backups",
                                "arn:aws:ec2:eu-west-3:111122223333:volume/vol-0archive"]),
    "AWS-11": ("non_conforme", ["eu-west-3"]),
    "AWS-12": ("non_conforme", ["vpc-1"]),
    "AWS-13": ("non_conforme", ["arn:lb/portail/http"]),
    "AWS-14": ("non_conforme", ["i-0legacy02"]),
}


def _collect(code, answers=MEDSECURE, settings=None):
    session = FakeSession(answers, settings)
    provider = aws.AwsProvider(lambda conn, secrets, allowed: session)
    collector = load_catalog().describe(code)
    fetched = provider.fetch_sync(_conn(), KEYS, collector, NOW)
    evaluation = {} if fetched["error"] else evaluators()[code](fetched["raw"], {p["id"]: p["default"] for p in
                                                                                collector.get("params", [])},
                                                                {"now": NOW, "people": None})
    return finalize(evaluation, fetched, []), session


@pytest.mark.parametrize("code", sorted(EXPECTED))
def test_each_collector_reads_the_live_account_and_its_rule_decides(code):
    version, session = _collect(code)
    result, resources = EXPECTED[code]
    assert version["result"] == result, version
    assert sorted(f["resource"] for f in version["findings"]) == sorted(resources)
    # Only what the reader declares was called.
    assert {(s, m) for s, _, m in session.calls} <= {(s, _snake(o)) for s, o in aws.READS[code]}


def _snake(op):
    import re
    return re.sub(r"(?<!^)(?=[A-Z])", "_", op).lower().replace("d_b_", "db_")


def test_the_raw_data_keeps_only_what_the_rules_read():
    # Each collector of the credential report keeps the rows and the columns its rule reads.
    assert _collect("AWS-01")[0]["raw"]["credential_report"] == [
        {"user": "<root_account>", "mfa_active": "true", "password_last_used": "2026-05-01T00:00:00+00:00",
         "access_key_1_active": "false", "access_key_2_active": "false"}]
    assert _collect("AWS-02")[0]["raw"]["credential_report"] == [
        {"user": "j.martin", "password_enabled": "true", "mfa_active": "false"}]
    assert _collect("AWS-03")[0]["raw"]["credential_report"] == [
        {"user": "j.martin", "access_key_1_active": "true", "access_key_1_last_rotated": "2026-10-31T00:00:00+00:00",
         "access_key_1_last_used_date": "2026-11-19T00:00:00+00:00", "access_key_2_active": "false"}]
    policies = _collect("AWS-05")[0]["raw"]["Policies"]
    assert policies[0]["Document"] == {"Statement": [{"Effect": "Allow", "Action": "*", "Resource": "*"}]}
    assert "PolicyId" not in policies[0] and "PolicyVersionList" not in policies[0]
    assert _collect("AWS-04")[0]["raw"]["PasswordPolicy"] == {"MinimumPasswordLength": 12, "PasswordReusePrevention": 24}
    dbs = _collect("AWS-07")[0]["raw"]["DBInstances"]
    assert dbs == [{"DBInstanceIdentifier": "telesuivi-db", "StorageEncrypted": True}]
    assert "PrivateIpAddress" not in str(_collect("AWS-14")[0]["raw"])
    assert _collect("AWS-02")[0]["data_as_of"] == NOW - timedelta(hours=2)


def test_every_declared_operation_is_a_read_the_catalog_names():
    for code, ops in aws.READS.items():
        collector = load_catalog().describe(code)
        # The rights a collector asks for are exactly those of the operations its reader may call.
        assert set(collector["permissions"]) == {aws.iam_action(service, op) for service, op in ops}, code
        for service, op in ops:
            assert aws.iam_action(service, op) in collector["reads"] or f"{service}:{op}" in collector["reads"], (
                code, service, op)
            assert op.startswith(("Get", "List", "Describe")) or op == "GenerateCredentialReport", (code, op)


def _template_reads():
    import re
    path = os.path.join(os.path.dirname(__file__), "..", "..", "app", "collection", "aws-readonly-role.yaml")
    text = open(path, encoding="utf-8").read()
    block = text.split("PolicyName: collector-reads", 1)[1].split("Resource:", 1)[0]
    return text, re.findall(r"^\s+- ([a-z0-9-]+:[A-Za-z]+)$", block, re.M)


def test_the_role_template_grants_the_declared_reads_and_nothing_else():
    text, granted = _template_reads()
    provider = load_catalog().providers["aws"]["connection"]["permissions"]
    collectors = {p for c in load_catalog().collectors("aws") for p in c["permissions"]}
    assert sorted(granted) == sorted(collectors) == sorted(p for p in provider if p != "sts:AssumeRole")
    assert "ManagedPolicyArns" not in text and "*:" not in "".join(granted)
    assert {aws.iam_action(s, o) for s, o in aws._PROBES} <= set(granted)


def test_the_template_refuses_a_trusted_principal_that_is_not_one_user():
    import re
    text, _ = _template_reads()
    # CloudFormation matches AllowedPattern on the whole value, as fullmatch does.
    principal = re.search(r"TrustedPrincipalArn:.*?AllowedPattern: '([^']+)'", text, re.S).group(1)
    external = re.search(r"ExternalId:.*?AllowedPattern: '([^']+)'", text, re.S).group(1)
    for ok in ("", "arn:aws:iam::111122223333:user/ciso-collector"):
        assert re.fullmatch(principal, ok)
    for bad in ("*", "arn:aws:iam::111122223333:root", "arn:aws:iam::111122223333:role/x"):
        assert not re.fullmatch(principal, bad), bad
    assert re.fullmatch(external, aws.new_external_id()) and not re.fullmatch(external, "anything")


def test_a_refused_read_names_the_iam_action():
    version, _ = _collect("AWS-10", {**MEDSECURE, ("backup", "eu-west-3", "list_protected_resources"):
                                     _denied("ListProtectedResources")})
    assert version["result"] == "erreur" and version["missing_permission"] == "backup:ListProtectedResources"


def test_a_region_that_refuses_is_unreadable_while_the_others_are_read():
    answers = {**MEDSECURE, ("ec2", "eu-central-1", "describe_instances"): _denied("DescribeInstances")}
    version, _ = _collect("AWS-14", answers, {"regions": ["eu-west-3", "eu-central-1"]})
    assert version["result"] == "non_conforme" and version["partial"]
    assert version["unreadable"] == [{"resource": "eu-central-1", "reason": "access denied (ec2:DescribeInstances)"}]


def test_a_bucket_whose_region_is_unknown_is_unreadable_and_not_guessed():
    answers = {**MEDSECURE, ("s3", "*", "list_buckets"): {"Buckets": [
        {"Name": "medsecure-backups"}, {"Name": "medsecure-portal-assets", "BucketRegion": "eu-west-3"}]}}
    version, session = _collect("AWS-06", answers)
    assert version["unreadable"] == [{"resource": "s3://medsecure-backups", "reason": "its region is unknown"}]
    assert sum(m == "get_bucket_policy_status" for _, _, m in session.calls) == 1


def test_a_bucket_whose_policy_refuses_the_role_is_unreadable():
    def status(Bucket):
        return _denied("GetBucketPolicyStatus") if Bucket == "medsecure-backups" else {"PolicyStatus": {"IsPublic": False}}
    version, _ = _collect("AWS-06", {**MEDSECURE, ("s3", "eu-west-3", "get_bucket_policy_status"): status})
    assert [u["resource"] for u in version["unreadable"]] == ["s3://medsecure-backups"]


def test_without_regions_set_the_enabled_regions_are_read():
    answers = {**MEDSECURE, ("ec2", "us-east-1", "describe_regions"): {"Regions": [
        {"RegionName": "eu-west-3"}, {"RegionName": "evil.example.com/"}]}}
    version, session = _collect("AWS-14", answers, {"regions": []})
    assert ("ec2", "eu-west-3", "describe_instances") in session.calls
    assert not any(r.startswith("evil") for _, r, _ in session.calls)


def test_the_global_reads_go_to_the_first_region_set():
    _, session = _collect("AWS-04", settings={"regions": ["eu-west-3", "eu-central-1"]})
    assert session.calls == [("iam", "eu-west-3", "get_account_password_policy")]
    assert aws.home_region({}) == "us-east-1" and aws.home_region({"regions": "eu-west-3, eu-central-1"}) == "eu-west-3"


@pytest.mark.parametrize("region", ["cn-north-1", "us-gov-west-1", "us-iso-east-1", "us-isob-east-1", "eu-isoe-west-1"])
def test_another_partition_is_not_a_region(region):
    assert not aws.REGION_RE.match(region)


@pytest.mark.parametrize("code, reason", [
    ("ExpiredToken", "credentials expired"), ("Throttling", "throttled"), ("ReportInProgress", "still generating"),
    ("InternalFailure", "AWS answered InternalFailure"),
])
def test_an_aws_answer_that_is_not_a_refusal_is_said(code, reason):
    version, _ = _collect("AWS-04", {**MEDSECURE, ("iam", "*", "get_account_password_policy"):
                                     _absent(code, "GetAccountPasswordPolicy")})
    assert version["result"] == "erreur" and reason in version["reason"] and not version["missing_permission"]


def test_a_role_that_cannot_be_assumed_is_an_error_naming_sts():
    class Refusing(FakeSession):
        def assume(self):
            raise aws.Denied("sts:AssumeRole")
    provider = aws.AwsProvider(lambda conn, secrets, allowed: Refusing({}))
    fetched = provider.fetch_sync(_conn(), KEYS, load_catalog().describe("AWS-04"), NOW)
    assert fetched["error"]["missing_permission"] == "sts:AssumeRole"
    assert "RoleArn output" in fetched["error"]["reason"] and "ExternalId" in fetched["error"]["reason"]
    assert provider.test_sync(_conn(), KEYS)["missing_permissions"] == ["sts:AssumeRole"]


@pytest.mark.parametrize("exc, message", [
    (_absent("InvalidClientTokenId", "AssumeRole"), "refused the access keys"),
    (aws.Unreachable("timeout"), "could not be reached"),
])
def test_keys_aws_refuses_or_an_unreachable_aws_are_said_as_such(exc, message):
    class Failing(FakeSession):
        def assume(self):
            raise exc
    provider = aws.AwsProvider(lambda conn, secrets, allowed: Failing({}))
    assert message in provider.fetch_sync(_conn(), KEYS, load_catalog().describe("AWS-04"), NOW)["error"]["reason"]
    result = provider.test_sync(_conn(), KEYS)
    assert not result["ok"] and message in result["message"] and result["missing_permissions"] == []


def test_the_connection_test_names_each_missing_right():
    answers = {("iam", "*", "get_account_password_policy"): _absent("NoSuchEntity", "GetAccountPasswordPolicy"),
               ("ec2", "*", "describe_regions"): {"Regions": []},
               ("s3", "*", "list_buckets"): {"Buckets": []},
               ("backup", "*", "list_protected_resources"): _denied("ListProtectedResources")}
    provider = aws.AwsProvider(lambda conn, secrets, allowed: FakeSession(answers))
    result = provider.test_sync(_conn(), KEYS)
    assert result["ok"] and result["partial"] and result["missing_permissions"] == ["backup:ListProtectedResources"]
    nothing = {k: _denied("x") for k in answers}
    result = aws.AwsProvider(lambda conn, secrets, allowed: FakeSession(nothing)).test_sync(_conn(), KEYS)
    assert not result["ok"] and len(result["missing_permissions"]) == 4


# ── The real botocore session ───────────────────────────────────────────

def test_missing_keys_are_refused_without_falling_back_to_the_server_credentials(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "AKIA" + "SERVERSOWNKEY000")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "server-secret")
    fetched = aws.AwsProvider().fetch_sync(_conn(), {}, load_catalog().describe("AWS-04"), NOW)
    assert fetched["error"]["reason"].startswith("the connection lacks its access keys")
    assert aws.AwsProvider().test_sync(_conn(), {})["ok"] is False


_ASSUMED = {
    "Credentials": {"AccessKeyId": "ASIAEXAMPLE000000000", "SecretAccessKey": "s" * 40, "SessionToken": "t",
                    "Expiration": NOW + timedelta(hours=1)},
    "AssumedRoleUser": {"AssumedRoleId": "AROA:cisotoolbox-compliance",
                        "Arn": "arn:aws:sts::111122223333:assumed-role/ciso-audit/cisotoolbox-compliance"}}
_ASSUME_PARAMS = {"RoleArn": ROLE, "RoleSessionName": "cisotoolbox-compliance", "ExternalId": "ciso-0123",
                  "DurationSeconds": 3600}


def _session_with_role(allowed):
    from botocore.stub import Stubber
    s = aws.Session(_conn({"regions": ["eu-west-3"]}), KEYS, allowed)
    sts = s._user.client("sts", region_name="us-east-1")
    stub = Stubber(sts)
    stub.add_response("assume_role", _ASSUMED, _ASSUME_PARAMS)
    s._user.client = lambda *a, **k: sts
    with stub:
        s.assume()
    return s


def test_sts_falls_back_to_us_east_1_when_the_home_region_is_not_enabled():
    from botocore.stub import Stubber
    s = aws.Session(_conn({"regions": ["eu-south-2"]}), KEYS, aws.READS["AWS-04"])
    make = s._user.client
    sts = {r: make("sts", region_name=r) for r in ("eu-south-2", "us-east-1")}
    s._user.client = lambda service, region_name, config: sts[region_name]
    with Stubber(sts["eu-south-2"]) as off, Stubber(sts["us-east-1"]) as east:
        off.add_client_error("assume_role", service_error_code="InvalidClientTokenId", http_status_code=403)
        east.add_response("assume_role", _ASSUMED, _ASSUME_PARAMS)
        s.assume()
    assert s.account == "111122223333"
    # A refusal is not retried in us-east-1: asking for its client fails the test.
    s = aws.Session(_conn({"regions": ["eu-south-2"]}), KEYS, aws.READS["AWS-04"])

    def only_home(service, region_name, config):
        assert region_name == "eu-south-2", "a refusal was retried in us-east-1"
        return sts[region_name]
    s._user.client = only_home
    with Stubber(sts["eu-south-2"]) as off, pytest.raises(aws.Denied):
        off.add_client_error("assume_role", service_error_code="AccessDenied", http_status_code=403)
        s.assume()


def test_when_us_east_1_refuses_too_the_failure_names_both_regions():
    from botocore.stub import Stubber
    s = aws.Session(_conn({"regions": ["eu-south-2"]}), KEYS, aws.READS["AWS-04"])
    make = s._user.client
    sts = {r: make("sts", region_name=r) for r in ("eu-south-2", "us-east-1")}
    s._user.client = lambda service, region_name, config: sts[region_name]
    with Stubber(sts["eu-south-2"]) as off, Stubber(sts["us-east-1"]) as east:
        off.add_client_error("assume_role", service_error_code="InvalidClientTokenId", http_status_code=403)
        east.add_client_error("assume_role", service_error_code="InvalidClientTokenId", http_status_code=403)
        provider = aws.AwsProvider(lambda conn, secrets, allowed: s)
        fetched = provider.fetch_sync(_conn(), KEYS, load_catalog().describe("AWS-04"), NOW)
    reason = fetched["error"]["reason"]
    assert reason.startswith("AWS refused the access keys")
    assert reason.endswith("(STS was asked in eu-south-2, then in us-east-1)")
    # Asked in one region only: no list of regions.
    one = aws.Session(_conn({"regions": ["us-east-1"]}), KEYS, aws.READS["AWS-04"])
    one._user.client = lambda service, region_name, config: sts[region_name]
    with Stubber(sts["us-east-1"]) as east:
        east.add_client_error("assume_role", service_error_code="InvalidClientTokenId", http_status_code=403)
        tested = aws.AwsProvider(lambda conn, secrets, allowed: one).test_sync(_conn(), KEYS)
    assert tested["message"] == "AWS refused the access keys: check them, or create a new one for the stack's user."


def test_the_role_is_assumed_with_the_external_id_and_names_its_account():
    assert _session_with_role(aws.READS["AWS-04"]).account == "111122223333"


def test_the_guard_refuses_an_operation_the_reader_does_not_declare():
    from botocore.stub import Stubber
    s = _session_with_role(aws.READS["AWS-04"])
    iam = s.client("iam", s.home)
    with Stubber(iam) as stub:
        stub.add_response("get_account_password_policy", {"PasswordPolicy": {"MinimumPasswordLength": 14}})
        assert s.call("iam", s.home, "get_account_password_policy")["PasswordPolicy"]["MinimumPasswordLength"] == 14
        with pytest.raises(PermissionError, match="iam:DeleteAccountPasswordPolicy"):
            s.call("iam", s.home, "delete_account_password_policy")


def test_an_access_denied_answer_becomes_the_iam_action():
    from botocore.stub import Stubber
    s = _session_with_role(aws.READS["AWS-06"])
    with Stubber(s.client("s3", s.home)) as stub:
        stub.add_client_error("list_buckets", service_error_code="AccessDenied", http_status_code=403)
        with pytest.raises(aws.Denied) as err:
            s.call("s3", s.home, "list_buckets")
    assert err.value.action == "s3:ListAllMyBuckets"


def test_every_page_of_the_bucket_list_is_read():
    from botocore.stub import Stubber
    s = _session_with_role(aws.READS["AWS-06"])
    with Stubber(s.client("s3", s.home)) as stub:
        stub.add_response("list_buckets", {"Buckets": [{"Name": "a"}], "ContinuationToken": "next"}, {})
        stub.add_response("list_buckets", {"Buckets": [{"Name": "b"}]}, {"ContinuationToken": "next"})
        assert [b["Name"] for b in aws._buckets(s)] == ["a", "b"]


def test_a_credential_report_still_generating_is_said(monkeypatch):
    from botocore.stub import Stubber
    monkeypatch.setattr(aws, "_REPORT_WAIT", 0)
    s = _session_with_role(aws.READS["AWS-02"])
    s.assume = lambda: None
    provider = aws.AwsProvider(lambda conn, secrets, allowed: s)
    with Stubber(s.client("iam", s.home)) as stub:
        for _ in range(aws._REPORT_POLLS):
            stub.add_response("generate_credential_report", {"State": "STARTED"})
        stub.add_client_error("get_credential_report", service_error_code="ReportInProgress", http_status_code=404)
        fetched = provider.fetch_sync(_conn(), KEYS, load_catalog().describe("AWS-02"), NOW)
    assert "still generating the credential report" in fetched["error"]["reason"]


def test_a_region_name_never_builds_another_host():
    s = _session_with_role(aws.READS["AWS-14"])
    with pytest.raises(ValueError, match="region"):
        s.client("ec2", "x.attacker.example/")


# ── The connection ──────────────────────────────────────────────────────

LIVE = {"label": "MedSecure production", "mode": "live", "settings": {"role_arn": ROLE, "regions": ["eu-west-3"]},
        "secrets": dict(KEYS)}


def _new(payload, provider="aws"):
    c = CollectionConnection(id=uuid.uuid4(), project_id=uuid.uuid4(), provider=provider)
    apply_connection_input(c, payload, creating=True)
    return c


def test_a_live_aws_connection_gets_an_external_id_from_the_suite():
    c = _new(LIVE)
    view = connection_view(c)
    assert view["settings"]["external_id"].startswith("ciso-") and len(view["settings"]["external_id"]) > 20
    assert view["secrets"] == {"access_key_id": {"set": True}, "secret_access_key": {"set": True}}
    external_id = c.settings["external_id"]
    apply_connection_input(c, {"label": "renamed"}, creating=False)
    assert c.settings["external_id"] == external_id
    assert _new(LIVE).settings["external_id"] != external_id


@pytest.mark.parametrize("payload, message", [
    ({**LIVE, "settings": {**LIVE["settings"], "external_id": "mine"}}, "unknown setting external_id"),
    ({**LIVE, "settings": {"role_arn": "arn:aws:iam::111122223333:user/j.martin"}}, "ARN of an IAM role"),
    ({**LIVE, "settings": {"role_arn": ROLE, "regions": ["eu-west-3.attacker.example"]}}, "unknown region"),
    ({**LIVE, "secrets": {**KEYS, "access_key_id": "ASIATEMPORARYKEY0000"}}, "long-term access key"),
    ({**LIVE, "secrets": {"access_key_id": KEYS["access_key_id"]}}, "secret_access_key is required"),
    ({**LIVE, "settings": {"role_arn": True}}, "role_arn must be text"),
    ({**LIVE, "settings": {"role_arn": ROLE, "regions": True}}, "regions must be a list"),
])
def test_what_aws_would_not_accept_is_refused(payload, message):
    with pytest.raises(ConnectionInputError, match=message):
        _new(payload)


def test_a_secret_the_provider_no_longer_declares_is_dropped():
    import json
    from src.collection.connections import connection_secrets
    from src.settings_crypto import encrypt_setting
    c = _new(LIVE)
    c.secrets_enc = encrypt_setting(json.dumps({**connection_secrets(c), "external_id": "an-old-secret"}))
    apply_connection_input(c, {"label": "renamed"}, creating=False)
    assert set(connection_secrets(c)) == {"access_key_id", "secret_access_key"}


def test_live_github_waits_for_its_lot():
    with pytest.raises(ConnectionInputError, match="live github connections are not available yet"):
        _new({"label": "MedSecure", "mode": "live", "settings": {"organization": "medsecure"},
              "secrets": {"token": "ghp_x"}}, provider="github")


def test_a_demonstration_connection_needs_no_credential():
    c = _new({"label": "MedSecure demo", "mode": "demo"})
    assert c.mode == "demo" and connection_view(c)["secrets"]["access_key_id"] == {"set": False}
