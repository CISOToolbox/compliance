"""FEAT-73 — the state of each resource of a collection, and their counts."""
import os
import sys
from types import SimpleNamespace

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.collection.engine import finalize  # noqa: E402
from src.collection.evidence import resource_states, state_counts  # noqa: E402


def _version(**kw):
    base = dict(findings=[], excluded=[], unreadable=[], scope={"resources": []}, purged_at=None,
                evaluated=0, n_findings=0, n_excluded=0, n_unreadable=0)
    return SimpleNamespace(**{**base, **kw})


def test_a_resource_with_several_issues_is_one_finding():
    ev = {"outcome": "ok", "evaluated": 2, "scope": {"resources": ["api", "web"]},
          "findings": [{"resource": "api", "detail": "no review"}, {"resource": "api", "detail": "force push"}]}
    v = finalize(ev, {"raw": {}, "unreadable": []}, [])
    assert v["findings"] == [{"resource": "api", "detail": "no review; force push"}]


def test_each_resource_has_one_state_its_worst_first():
    v = _version(scope={"resources": ["api", "web", "infra", "docs"]},
                 findings=[{"resource": "api", "detail": "no review; force push"}],
                 excluded=[{"resource": "docs", "detail": "public", "justification": "open source", "by": "IT",
                            "at": "2026-11-20", "derogation": None}],
                 unreadable=[{"resource": "legacy", "reason": "403"}],
                 evaluated=4, n_findings=1, n_excluded=1, n_unreadable=1)
    states = resource_states(v)
    assert [(s["resource"], s["state"]) for s in states] == [
        ("api", "non_conforme"), ("docs", "exclu"), ("legacy", "illisible"), ("web", "conforme"), ("infra", "conforme")]
    assert states[1]["exclusion"]["justification"] == "open source"
    assert state_counts(v) == {"conforme": 2, "non_conforme": 1, "exclu": 1, "illisible": 1}


def test_a_purged_version_keeps_the_same_counts():
    v = _version(scope={"resources": ["api", "web", "infra", "docs"]},
                 findings=[{"resource": "api", "detail": "no review"}],
                 excluded=[{"resource": "docs", "detail": "public", "justification": "open source"}],
                 evaluated=4, n_findings=1, n_excluded=1, n_unreadable=0)
    before = state_counts(v)
    v.purged_at, v.findings, v.excluded, v.unreadable, v.scope = "2026-11-23", None, None, None, None
    assert resource_states(v) == []
    assert state_counts(v) == before == {"conforme": 2, "non_conforme": 1, "exclu": 1, "illisible": 0}
