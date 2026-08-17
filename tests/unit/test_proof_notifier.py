"""Unit tests for the proof-expiry selection logic.

compute_expiring_proofs() is the single source of truth for "what gets
alerted": it must mirror the frontend's ctDateStatus(p.date_expiration, 90)
orange/red states — a proof is selected only when it is expired or within
the 90-day notice window. Proofs with no expiration date never expire.
"""
import os
import sys
from datetime import date, timedelta
from types import SimpleNamespace

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from proof_notifier import compute_expiring_proofs, _fingerprint  # noqa: E402

TODAY = date(2026, 6, 8)


def _proof(pid, date_expiration="", label="", owner=""):
    return SimpleNamespace(project_id="P1", id=pid, label=label, owner=owner,
                           date_expiration=date_expiration)


def _iso(days_from_today):
    return (TODAY + timedelta(days=days_from_today)).isoformat()


def test_within_notice_window_is_selected():
    out = compute_expiring_proofs([_proof("PRV-1", _iso(45))], TODAY)
    assert len(out) == 1 and out[0]["days"] == 45


def test_expired_is_selected_with_negative_days():
    out = compute_expiring_proofs([_proof("PRV-1", _iso(-10))], TODAY)
    assert len(out) == 1 and out[0]["days"] == -10


def test_outside_window_is_not_selected():
    assert compute_expiring_proofs([_proof("PRV-1", _iso(91))], TODAY) == []


def test_boundary_day_is_selected():
    out = compute_expiring_proofs([_proof("PRV-1", _iso(90))], TODAY)
    assert len(out) == 1


def test_no_expiration_date_never_expires():
    assert compute_expiring_proofs([_proof("PRV-1", "")], TODAY) == []
    assert compute_expiring_proofs([_proof("PRV-1", None)], TODAY) == []
    assert compute_expiring_proofs([_proof("PRV-1", "n/a")], TODAY) == []


def test_sorted_soonest_first():
    out = compute_expiring_proofs(
        [_proof("A", _iso(30)), _proof("B", _iso(-5)), _proof("C", _iso(2))], TODAY)
    assert [e["proof_id"] for e in out] == ["B", "C", "A"]


def test_fingerprint_stable_and_order_independent():
    a = compute_expiring_proofs([_proof("A", _iso(3)), _proof("B", _iso(1))], TODAY)
    b = compute_expiring_proofs([_proof("B", _iso(1)), _proof("A", _iso(3))], TODAY)
    assert _fingerprint(a) == _fingerprint(b)
    c = compute_expiring_proofs([_proof("B", _iso(1))], TODAY)
    assert _fingerprint(a) != _fingerprint(c)


from proof_notifier import measure_auto_key, _next_measure_num  # noqa: E402


def test_measure_auto_key_only_for_expired_semantics():
    due = compute_expiring_proofs(
        [_proof("EXP", _iso(-3)), _proof("SOON", _iso(10))], TODAY)
    expired = [e for e in due if e["days"] < 0]
    assert [e["proof_id"] for e in expired] == ["EXP"]
    assert measure_auto_key(expired[0]) == f"EXP:{_iso(-3)}"


def test_next_measure_num_spans_legacy_and_unified_prefixes():
    # FEAT-32: the counter reads the numeric suffix whatever the prefix, so
    # new MES-NNN ids never collide with grandfathered M-NNN ones.
    assert _next_measure_num(["M-001", "M-007", "M-003"]) == 7
    assert _next_measure_num(["M-004", "MES-009"]) == 9
    assert _next_measure_num(["MES-002", "garbage"]) == 2
    assert _next_measure_num([]) == 0
