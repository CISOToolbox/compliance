"""FEAT-73 lot 1a — the result of a collection, from what was read.

| Result        | When                                                         |
|---------------|--------------------------------------------------------------|
| erreur        | the source could not be read (missing right, expired token)  |
| sans_objet    | nothing in scope, or the feature does not exist on the plan  |
| non_conforme  | findings remain once the excluded resources are set aside    |
| conforme      | complete data, condition met                                 |

A partial read keeps its result and lists the resources it could not read.
The raw answer of the source is fingerprinted over a canonical form, so the
same data gives the same hash whatever the key order."""
import os
import sys
from datetime import datetime, timezone

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.collection.engine import canonical_sha256, finalize  # noqa: E402

AS_OF = datetime(2026, 11, 17, 2, 58, tzinfo=timezone.utc)
RAW = {"users": [{"user": "j.martin", "mfa_active": "false"}, {"user": "break-glass", "mfa_active": "false"}]}


def _fetched(**kw):
    return {"raw": RAW, "data_as_of": AS_OF, "unreadable": [], "error": None, **kw}


def _eval(findings=(), outcome="ok", reason=None, evaluated=2):
    return {"outcome": outcome, "reason": reason, "evaluated": evaluated,
            "findings": [{"resource": r, "detail": "mfa_active=false"} for r in findings],
            "scope": {"resources": ["j.martin", "break-glass"]}}


def test_findings_make_it_non_compliant():
    v = finalize(_eval(["j.martin", "break-glass"]), _fetched(), [])
    assert v["result"] == "non_conforme"
    assert [f["resource"] for f in v["findings"]] == ["j.martin", "break-glass"]
    assert v["data_as_of"] == AS_OF and v["evaluated"] == 2


def test_an_excluded_finding_is_set_aside_and_shown():
    excl = [{"id": "x1", "resource": "break-glass", "justification": "Emergency account, physical safe",
             "by": "ciso@medsecure.example", "at": "2026-09-02", "derogation": None}]
    v = finalize(_eval(["j.martin", "break-glass"]), _fetched(), excl)
    assert [f["resource"] for f in v["findings"]] == ["j.martin"]
    assert v["excluded"] == [{"resource": "break-glass", "detail": "mfa_active=false", "exclusion_id": "x1",
                              "justification": "Emergency account, physical safe",
                              "by": "ciso@medsecure.example", "at": "2026-09-02", "derogation": None}]
    assert v["result"] == "non_conforme"
    v = finalize(_eval(["break-glass"]), _fetched(), excl)
    assert v["result"] == "conforme" and v["findings"] == [] and len(v["excluded"]) == 1


def test_no_finding_is_compliant():
    assert finalize(_eval([]), _fetched(), [])["result"] == "conforme"


def test_an_unreadable_source_is_an_error_never_a_verdict():
    v = finalize(_eval([]), _fetched(raw=None, error={"reason": "AccessDenied", "missing_permission": "backup:ListProtectedResources"}), [])
    assert v["result"] == "erreur"
    assert v["reason"] == "AccessDenied" and v["missing_permission"] == "backup:ListProtectedResources"
    assert v["findings"] == [] and v["excluded"] == []


@pytest.mark.parametrize("outcome", ["no_resources", "feature_absent"])
def test_nothing_to_check_is_not_applicable_with_its_reason(outcome):
    v = finalize(_eval([], outcome=outcome, reason="no VPC in eu-west-3", evaluated=0), _fetched(), [])
    assert v["result"] == "sans_objet" and v["reason"] == "no VPC in eu-west-3"


def test_a_partial_read_keeps_its_result_and_says_what_was_not_read():
    unread = [{"resource": "medsecure/archives", "reason": "403"}]
    v = finalize(_eval([]), _fetched(unreadable=unread), [])
    assert v["result"] == "conforme" and v["unreadable"] == unread and v["partial"] is True


def test_the_fingerprint_does_not_depend_on_key_order():
    a = {"b": 1, "a": [1, {"y": "é", "x": None}]}
    b = {"a": [1, {"x": None, "y": "é"}], "b": 1}
    assert canonical_sha256(a) == canonical_sha256(b)
    assert canonical_sha256(a) != canonical_sha256({"a": [1], "b": 1})
    assert len(canonical_sha256(None)) == 64
    v = finalize(_eval([]), _fetched(), [])
    assert v["raw_sha256"] == canonical_sha256(RAW) and v["raw"] == RAW
