"""FEAT-73 lot 1a — the rules of the AWS collectors.

Evaluated on MedSecure's demonstration data (shaped as the AWS APIs answer),
then on the cases each rule must catch. The same functions will run on the
live answers (lot 1c)."""
import copy
import os
import sys
from datetime import datetime, timedelta, timezone

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.collection.catalog import load_catalog  # noqa: E402
from src.collection.engine import finalize  # noqa: E402
from src.collection.fixtures import demo_payload  # noqa: E402
from src.collection.rules.aws import EVALUATORS  # noqa: E402

NOW = datetime(2026, 11, 17, 3, 0, tzinfo=timezone.utc)


def _defaults(code):
    return {p["id"]: p["default"] for p in load_catalog().collector(code).get("params", [])}


def _run(code, raw=None, params=None):
    raw = raw if raw is not None else demo_payload(code, NOW)["raw"]
    ev = EVALUATORS[code](raw, params or _defaults(code), {"now": NOW})
    return finalize(ev, {"raw": raw, "data_as_of": NOW, "unreadable": [], "error": None}, [])


def test_every_aws_collector_has_a_rule_and_demonstration_data():
    codes = [c["code"] for c in load_catalog().collectors("aws")]
    assert sorted(EVALUATORS) == codes
    for code in codes:
        assert demo_payload(code, NOW)["raw"], code


@pytest.mark.parametrize("code, result, resources", [
    ("AWS-01", "conforme", []),
    ("AWS-02", "non_conforme", ["j.martin", "break-glass"]),
    ("AWS-03", "non_conforme", ["a.durand#key1", "ci-deployer#key1"]),
    ("AWS-04", "conforme", []),
    ("AWS-05", "conforme", []),                        # the all-powerful policy is attached to nobody
    ("AWS-06", "conforme", []),
    ("AWS-07", "non_conforme", ["rds:legacy-reporting"]),
    ("AWS-08", "conforme", []),
    ("AWS-09", "non_conforme", ["sg-0b2bastion"]),
    ("AWS-10", "conforme", []),
    ("AWS-11", "non_conforme", ["eu-central-1"]),
    ("AWS-12", "sans_objet", []),
    ("AWS-13", "conforme", []),
    ("AWS-14", "non_conforme", ["i-0legacy02"]),
])
def test_medsecure(code, result, resources):
    v = _run(code)
    assert v["result"] == result, v
    assert [f["resource"] for f in v["findings"]] == resources


def test_the_demonstration_ages_with_the_clock():
    later = NOW + timedelta(days=400)
    raw = demo_payload("AWS-10", later)["raw"]
    ev = EVALUATORS["AWS-10"](raw, {}, {"now": later})
    assert ev["findings"] == []                    # still last night's recovery point, a year on


def _report_with(**root):
    raw = demo_payload("AWS-01", NOW)["raw"]
    raw["credential_report"][0].update(root)
    return raw


def test_a_root_account_used_or_with_a_key_or_without_mfa_is_caught():
    assert _run("AWS-01", _report_with(password_last_used=(NOW - timedelta(days=3)).isoformat()))["result"] == "non_conforme"
    assert _run("AWS-01", _report_with(access_key_2_active="true"))["result"] == "non_conforme"
    assert _run("AWS-01", _report_with(mfa_active="false"))["findings"][0]["detail"].startswith("mfa_active=false")


def test_the_key_age_thresholds_are_parameters():
    v = _run("AWS-03", params={"max_age_days": 200, "max_unused_days": 90})
    assert v["result"] == "conforme"


def test_no_password_policy_is_a_finding():
    assert _run("AWS-04", {})["findings"] == [{"resource": "password-policy", "detail": "no password policy"}]
    weak = {"PasswordPolicy": {"MinimumPasswordLength": 8, "PasswordReusePrevention": 24}}
    assert _run("AWS-04", weak)["findings"][0]["detail"] == "MinimumPasswordLength=8"


def test_an_attached_all_powerful_policy_is_caught():
    raw = copy.deepcopy(demo_payload("AWS-05", NOW)["raw"])
    raw["Policies"][1]["AttachmentCount"] = 1
    assert [f["resource"] for f in _run("AWS-05", raw)["findings"]] == ["arn:aws:iam::111122223333:policy/LegacyAdmin"]


def test_a_public_bucket_or_a_block_off_is_caught():
    raw = copy.deepcopy(demo_payload("AWS-06", NOW)["raw"])
    raw["AccountPublicAccessBlock"]["BlockPublicPolicy"] = False
    raw["Buckets"][1]["PolicyStatus"]["IsPublic"] = True
    assert [f["resource"] for f in _run("AWS-06", raw)["findings"]] == ["account", "s3://medsecure-portal-assets"]


def test_any_protocol_open_to_the_world_counts_ipv6_too():
    raw = {"SecurityGroups": [{"GroupId": "sg-all", "IpPermissions": [{"IpProtocol": "-1", "IpRanges": [{"CidrIp": "0.0.0.0/0"}]}]},
                              {"GroupId": "sg-v6", "IpPermissions": [{"IpProtocol": "tcp", "FromPort": 3000, "ToPort": 4000,
                                                                       "Ipv6Ranges": [{"CidrIpv6": "::/0"}]}]}]}
    assert [f["detail"] for f in _run("AWS-09", raw)["findings"]] == ["open to the Internet on 22, 3389",
                                                                     "open to the Internet on 3389"]


def test_a_trail_that_is_not_logging_does_not_count():
    raw = copy.deepcopy(demo_payload("AWS-08", NOW)["raw"])
    raw["Trails"][0]["Status"]["IsLogging"] = False
    assert _run("AWS-08", raw)["result"] == "non_conforme"


def test_a_missed_backup_or_a_short_retention_is_caught():
    raw = copy.deepcopy(demo_payload("AWS-10", NOW)["raw"])
    raw["ProtectedResources"][0]["LastCompletedRecoveryPoint"] = (NOW - timedelta(days=3)).isoformat()
    raw["DBInstances"][0]["BackupRetentionPeriod"] = 3
    assert len(_run("AWS-10", raw)["findings"]) == 2


def test_a_vpc_without_flow_log_is_caught():
    raw = {"Vpcs": [{"VpcId": "vpc-1", "Region": "eu-west-3"}], "FlowLogs": [{"ResourceId": "vpc-2", "FlowLogStatus": "ACTIVE"}]}
    assert [f["resource"] for f in _run("AWS-12", raw)["findings"]] == ["vpc-1"]


def test_plain_http_or_old_tls_is_caught():
    raw = {"Listeners": [{"ListenerArn": "l-http", "Protocol": "HTTP", "DefaultActions": [{"Type": "forward"}]},
                         {"ListenerArn": "l-tls", "Protocol": "HTTPS", "SslPolicy": "ELBSecurityPolicy-2016-08"}]}
    assert [f["resource"] for f in _run("AWS-13", raw)["findings"]] == ["l-http", "l-tls"]
