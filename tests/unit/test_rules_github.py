"""FEAT-73 lot 1a — the rules of the GitHub collectors.

Evaluated on MedSecure's demonstration organization, then on the cases each
rule must catch. A check the plan does not offer is "sans objet" with its
reason, never a silent success."""
import copy
import os
import sys
from datetime import datetime, timedelta, timezone

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.collection.catalog import load_catalog  # noqa: E402
from src.collection.engine import finalize  # noqa: E402
from src.collection.fixtures import demo_payload  # noqa: E402
from src.collection.rules.github import EVALUATORS  # noqa: E402

NOW = datetime(2026, 11, 17, 3, 0, tzinfo=timezone.utc)
PEOPLE = [{"name": "Anne Durand", "github": "a-durand", "active": True},
          {"name": "Paul Leroy", "github": "p-leroy", "active": True},
          {"name": "Jean Martin", "github": "j-martin", "active": False}]


def _run(code, raw=None, params=None, people=None):
    raw = raw if raw is not None else demo_payload(code, NOW)["raw"]
    defaults = {p["id"]: p["default"] for p in load_catalog().collector(code).get("params", [])}
    ev = EVALUATORS[code](raw, params or defaults, {"now": NOW, "people": people})
    return finalize(ev, {"raw": raw, "data_as_of": NOW, "unreadable": [], "error": None}, [])


def test_every_github_collector_has_a_rule_and_demonstration_data():
    codes = [c["code"] for c in load_catalog().collectors("github")]
    assert sorted(EVALUATORS) == codes
    for code in codes:
        assert demo_payload(code, NOW)["raw"], code


@pytest.mark.parametrize("code, result, resources", [
    ("GH-01", "non_conforme", ["medsecure/portail-patients", "medsecure/api-telesuivi"]),
    ("GH-02", "non_conforme", ["medsecure/api-telesuivi"]),
    ("GH-03", "conforme", []),
    ("GH-04", "sans_objet", []),                        # no directory of the people
    ("GH-05", "conforme", []),
    ("GH-06", "non_conforme", ["medsecure/portail-patients", "medsecure/api-telesuivi", "medsecure/infra",
                               "medsecure/sdk-patients-open"]),
    ("GH-07", "non_conforme", ["medsecure/sdk-patients-open"]),
])
def test_medsecure(code, result, resources):
    v = _run(code)
    assert v["result"] == result, v
    assert [f["resource"] for f in v["findings"]] == resources


def test_an_archived_repository_is_out_of_scope():
    assert "medsecure/archives-ancien-site" not in _run("GH-07")["scope"]["resources"]


def test_with_a_directory_of_the_people_a_member_who_left_or_unknown_is_caught():
    v = _run("GH-04", people=PEOPLE)
    assert v["result"] == "non_conforme"
    assert [(f["resource"], f["detail"]) for f in v["findings"]] == [
        ("j-martin", "member of a person who left (Jean Martin)"),
        ("c-bernard", "outside collaborator linked to no person")]


def test_without_branch_rules_on_the_plan_a_repository_is_not_compliant_with_the_reason():
    raw = copy.deepcopy(demo_payload("GH-01", NOW)["raw"])
    for r in raw["repos"]:
        r["rules_available"] = False
    v = _run("GH-01", raw)
    assert v["result"] == "non_conforme"
    assert len(v["findings"]) == v["evaluated"] == 4
    assert all("Team or Enterprise" in f["detail"] for f in v["findings"])


def test_without_advanced_security_the_private_repositories_are_findings():
    v = _run("GH-06")
    assert v["evaluated"] == 4
    unavailable = [f["resource"] for f in v["findings"] if "Advanced Security" in f["detail"]]
    assert unavailable == ["medsecure/portail-patients", "medsecure/api-telesuivi", "medsecure/infra"]


def test_two_factor_not_required_is_caught():
    assert _run("GH-03", {"organization": {"login": "medsecure", "two_factor_requirement_enabled": False}})["result"] == "non_conforme"


def test_too_many_owners_or_a_token_without_expiry_is_caught():
    raw = copy.deepcopy(demo_payload("GH-05", NOW)["raw"])
    assert _run("GH-05", raw, params={"max_owners": 1})["findings"][0]["detail"] == "2 owners for at most 1"
    raw["pat_grants"] = [
        {"owner": "j-martin", "token_name": "deploy", "token_expires_at": None, "access_granted_at": NOW.isoformat()},
        {"owner": "a-durand", "token_name": "ci", "access_granted_at": NOW.isoformat(),
         "token_expires_at": (NOW + timedelta(days=500)).isoformat()},
        {"owner": "p-leroy", "token_name": "audit", "access_granted_at": NOW.isoformat(),
         "token_expires_at": (NOW + timedelta(days=90)).isoformat()}]
    assert [f["detail"] for f in _run("GH-05", raw)["findings"]] == ["no expiry date", "valid for more than a year"]


def test_tokens_unreadable_without_an_app_are_said_in_the_scope():
    assert _run("GH-05")["scope"]["not_available"] == ["approved tokens are readable by a GitHub App only"]
