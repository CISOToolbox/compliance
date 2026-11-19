"""FEAT-73 — the rules of the AWS collectors, over the APIs' own answers.

Each evaluator takes the raw data its collector reads (shaped as the AWS
APIs return it), its parameters and the context (the clock), and returns the
evaluation `engine.finalize` turns into a version: the outcome, the
resources evaluated, the findings. Pure: no call, no clock of its own.
"""
from __future__ import annotations

from datetime import timedelta
from typing import Callable

from src.collection.rules.common import evaluation, finding, is_true, parse_date

ROOT = "<root_account>"


# ── IAM credential report (AWS-01, 02, 03) ──────────────────────────────

def _report(raw: dict) -> list[dict]:
    return list(raw.get("credential_report") or [])


def aws_01(raw: dict, params: dict, ctx: dict) -> dict:
    root = next((u for u in _report(raw) if u.get("user") == ROOT), None)
    if root is None:
        return evaluation([], [])
    issues = []
    if not is_true(root.get("mfa_active")):
        issues.append("mfa_active=false")
    for k in ("access_key_1_active", "access_key_2_active"):
        if is_true(root.get(k)):
            issues.append(f"{k}=true")
    used = parse_date(root.get("password_last_used"))
    if used and ctx["now"] - used < timedelta(days=30):
        issues.append(f"password_last_used={root['password_last_used']}")
    return evaluation([ROOT], [finding(ROOT, ", ".join(issues))] if issues else [])


def aws_02(raw: dict, params: dict, ctx: dict) -> dict:
    users = [u for u in _report(raw) if u.get("user") != ROOT and is_true(u.get("password_enabled"))]
    return evaluation([u["user"] for u in users],
                       [finding(u["user"], "password_enabled=true, mfa_active=false")
                        for u in users if not is_true(u.get("mfa_active"))])


def aws_03(raw: dict, params: dict, ctx: dict) -> dict:
    max_age, max_unused = params.get("max_age_days", 90), params.get("max_unused_days", 45)
    resources, findings = [], []
    for u in _report(raw):
        for n in (1, 2):
            if not is_true(u.get(f"access_key_{n}_active")):
                continue
            key = f"{u['user']}#key{n}"
            resources.append(key)
            rotated = parse_date(u.get(f"access_key_{n}_last_rotated"))
            used = parse_date(u.get(f"access_key_{n}_last_used_date")) or rotated
            if rotated and ctx["now"] - rotated > timedelta(days=max_age):
                findings.append(finding(key, f"older than {max_age} days (rotated {rotated.date()})"))
            elif used and ctx["now"] - used > timedelta(days=max_unused):
                findings.append(finding(key, f"unused for more than {max_unused} days"))
    return evaluation(resources, findings)


# ── Account settings and policies (AWS-04, 05) ──────────────────────────

def aws_04(raw: dict, params: dict, ctx: dict) -> dict:
    policy = raw.get("PasswordPolicy")
    if policy is None:
        return evaluation(["password-policy"], [finding("password-policy", "no password policy")])
    issues = []
    if int(policy.get("MinimumPasswordLength") or 0) < 14:
        issues.append(f"MinimumPasswordLength={policy.get('MinimumPasswordLength')}")
    if int(policy.get("PasswordReusePrevention") or 0) < 24:
        issues.append(f"PasswordReusePrevention={policy.get('PasswordReusePrevention')}")
    return evaluation(["password-policy"], [finding("password-policy", ", ".join(issues))] if issues else [])


def _grants_everything(document: dict) -> bool:
    statements = document.get("Statement") or []
    if isinstance(statements, dict):
        statements = [statements]
    for st in statements:
        if st.get("Effect") != "Allow":
            continue
        actions = st.get("Action") or []
        resources = st.get("Resource") or []
        actions = [actions] if isinstance(actions, str) else actions
        resources = [resources] if isinstance(resources, str) else resources
        if "*" in actions and "*" in resources:
            return True
    return False


def aws_05(raw: dict, params: dict, ctx: dict) -> dict:
    policies = [p for p in raw.get("Policies") or [] if int(p.get("AttachmentCount") or 0) > 0]
    return evaluation([p["Arn"] for p in policies],
                       [finding(p["Arn"], "Action:* on Resource:*, attached")
                        for p in policies if _grants_everything(p.get("Document") or {})])


# ── Storage (AWS-06, 07) ────────────────────────────────────────────────

_BLOCKS = ("BlockPublicAcls", "IgnorePublicAcls", "BlockPublicPolicy", "RestrictPublicBuckets")


def aws_06(raw: dict, params: dict, ctx: dict) -> dict:
    findings = []
    account = raw.get("AccountPublicAccessBlock") or {}
    off = [b for b in _BLOCKS if not account.get(b)]
    if off:
        findings.append(finding("account", "public access blocks off: " + ", ".join(off)))
    buckets = raw.get("Buckets") or []
    for b in buckets:
        if (b.get("PolicyStatus") or {}).get("IsPublic"):
            findings.append(finding(f"s3://{b['Name']}", "bucket policy makes it public"))
    return evaluation(["account"] + [f"s3://{b['Name']}" for b in buckets], findings)


def aws_07(raw: dict, params: dict, ctx: dict) -> dict:
    resources, findings = [], []
    for region, settings in (raw.get("Regions") or {}).items():
        resources.append(f"ebs:{region}")
        if not settings.get("EbsEncryptionByDefault"):
            findings.append(finding(f"ebs:{region}", "EBS encryption by default off"))
    for b in raw.get("Buckets") or []:
        resources.append(f"s3://{b['Name']}")
        if not b.get("Encryption"):
            findings.append(finding(f"s3://{b['Name']}", "no default encryption"))
    for db in raw.get("DBInstances") or []:
        resources.append(f"rds:{db['DBInstanceIdentifier']}")
        if not db.get("StorageEncrypted"):
            findings.append(finding(f"rds:{db['DBInstanceIdentifier']}", "StorageEncrypted=false"))
    return evaluation(resources, findings)


# ── Logging and detection (AWS-08, 11, 12) ──────────────────────────────

def aws_08(raw: dict, params: dict, ctx: dict) -> dict:
    trails = raw.get("Trails") or []
    good = [t for t in trails if t.get("IsMultiRegionTrail") and t.get("LogFileValidationEnabled")
            and (t.get("Status") or {}).get("IsLogging")]
    # One resource: the account's logging (an exclusion names it); the trails
    # read are listed beside it.
    ev = evaluation(["cloudtrail"], [] if good else
                    [finding("cloudtrail", "no active multi-region trail with log file validation")])
    ev["scope"]["trails"] = [t["Name"] for t in trails]
    return ev


def aws_11(raw: dict, params: dict, ctx: dict) -> dict:
    resources, findings = [], []
    for region, s in (raw.get("Regions") or {}).items():
        resources.append(region)
        off = [n for n in ("GuardDuty", "SecurityHub") if not s.get(n)]
        if off:
            findings.append(finding(region, " and ".join(off) + " off"))
    return evaluation(resources, findings)


def aws_12(raw: dict, params: dict, ctx: dict) -> dict:
    vpcs = raw.get("Vpcs") or []
    logged = {f["ResourceId"] for f in raw.get("FlowLogs") or [] if f.get("FlowLogStatus") == "ACTIVE"}
    if not vpcs:
        return evaluation([], [], reason="no VPC in the regions read")
    return evaluation([v["VpcId"] for v in vpcs],
                       [finding(v["VpcId"], f"no active flow log ({v.get('Region', '')})")
                        for v in vpcs if v["VpcId"] not in logged])


# ── Network (AWS-09, 13) and instances (AWS-14) ─────────────────────────

_ADMIN_PORTS = (22, 3389)


def _open_to_world(perm: dict) -> bool:
    cidrs = [r.get("CidrIp") for r in perm.get("IpRanges") or []] + \
            [r.get("CidrIpv6") for r in perm.get("Ipv6Ranges") or []]
    return "0.0.0.0/0" in cidrs or "::/0" in cidrs


def _covers(perm: dict, port: int) -> bool:
    if perm.get("IpProtocol") == "-1":
        return True
    lo, hi = perm.get("FromPort"), perm.get("ToPort")
    return lo is not None and hi is not None and lo <= port <= hi


def aws_09(raw: dict, params: dict, ctx: dict) -> dict:
    groups = raw.get("SecurityGroups") or []
    findings = []
    for g in groups:
        ports = sorted({p for perm in g.get("IpPermissions") or [] if _open_to_world(perm)
                        for p in _ADMIN_PORTS if _covers(perm, p)})
        if ports:
            findings.append(finding(g["GroupId"], "open to the Internet on " + ", ".join(map(str, ports))))
    return evaluation([g["GroupId"] for g in groups], findings)


_WEAK_TLS = ("ELBSecurityPolicy-2016-08", "ELBSecurityPolicy-TLS-1-0-2015-04", "ELBSecurityPolicy-TLS-1-1-2017-01",
             "ELBSecurityPolicy-2015-05")


def aws_13(raw: dict, params: dict, ctx: dict) -> dict:
    listeners = raw.get("Listeners") or []
    findings = []
    for li in listeners:
        if li.get("Protocol") == "HTTP":
            redirect = any(a.get("Type") == "redirect" and (a.get("RedirectConfig") or {}).get("Protocol") == "HTTPS"
                           for a in li.get("DefaultActions") or [])
            if not redirect:
                findings.append(finding(li["ListenerArn"], "HTTP not redirected to HTTPS"))
        elif li.get("Protocol") == "HTTPS" and li.get("SslPolicy") in _WEAK_TLS:
            findings.append(finding(li["ListenerArn"], f"TLS policy {li['SslPolicy']} allows TLS < 1.2"))
    return evaluation([li["ListenerArn"] for li in listeners], findings)


def aws_14(raw: dict, params: dict, ctx: dict) -> dict:
    instances = raw.get("Instances") or []
    return evaluation([i["InstanceId"] for i in instances],
                       [finding(i["InstanceId"], "IMDSv1 allowed (HttpTokens=optional)")
                        for i in instances if (i.get("MetadataOptions") or {}).get("HttpTokens") != "required"])


# ── Backups (AWS-10) ────────────────────────────────────────────────────

def aws_10(raw: dict, params: dict, ctx: dict) -> dict:
    resources, findings = [], []
    yesterday = ctx["now"] - timedelta(days=1, hours=12)
    for r in raw.get("ProtectedResources") or []:
        resources.append(r["ResourceArn"])
        last = parse_date(r.get("LastCompletedRecoveryPoint"))
        if last is None or last < yesterday:
            findings.append(finding(r["ResourceArn"], f"no recovery point since {last.date() if last else 'ever'}"))
    for db in raw.get("DBInstances") or []:
        rid = f"rds:{db['DBInstanceIdentifier']}"
        resources.append(rid)
        if int(db.get("BackupRetentionPeriod") or 0) < 7:
            findings.append(finding(rid, f"BackupRetentionPeriod={db.get('BackupRetentionPeriod')}"))
    return evaluation(resources, findings)


EVALUATORS: dict[str, Callable[[dict, dict, dict], dict]] = {
    "AWS-01": aws_01, "AWS-02": aws_02, "AWS-03": aws_03, "AWS-04": aws_04, "AWS-05": aws_05,
    "AWS-06": aws_06, "AWS-07": aws_07, "AWS-08": aws_08, "AWS-09": aws_09, "AWS-10": aws_10,
    "AWS-11": aws_11, "AWS-12": aws_12, "AWS-13": aws_13, "AWS-14": aws_14,
}
