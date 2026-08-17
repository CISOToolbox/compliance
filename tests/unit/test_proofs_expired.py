import os
import sys
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from routes.internal import _count_proofs_expired_10d

TODAY = date(2026, 6, 1)  # cutoff = 2026-05-22 (today - 10d)


def _measures(*pairs):
    """Helper: each pair is (proof_ids,...) for a single project 'p'."""
    return [("p", list(ids)) for ids in pairs]


class TestCountProofsExpired10d:
    def test_valid_future_proof_not_counted(self):
        measures = _measures(["e1"])
        proofs = {("p", "e1"): "2026-12-31"}
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 0

    def test_proof_without_expiration_never_expires(self):
        measures = _measures(["e1"])
        proofs = {("p", "e1"): ""}
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 0

    def test_expired_5_days_not_counted(self):
        measures = _measures(["e1"])
        proofs = {("p", "e1"): "2026-05-27"}  # 5 days ago
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 0

    def test_expired_exactly_10_days_not_counted(self):
        # "plus de 10 jours" is strict: exactly 10 days old is excluded
        measures = _measures(["e1"])
        proofs = {("p", "e1"): "2026-05-22"}  # == cutoff
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 0

    def test_expired_11_days_counted(self):
        measures = _measures(["e1"])
        proofs = {("p", "e1"): "2026-05-21"}  # 11 days ago, < cutoff
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 1

    def test_expired_15_days_counted(self):
        measures = _measures(["e1"])
        proofs = {("p", "e1"): "2026-05-17"}
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 1

    def test_measure_without_proof_excluded(self):
        measures = _measures([])
        assert _count_proofs_expired_10d(measures, {}, TODAY) == 0

    def test_measure_referencing_missing_proof_excluded(self):
        measures = _measures(["ghost"])
        proofs = {("p", "e1"): "2026-05-17"}
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 0

    def test_one_valid_among_expired_keeps_measure_valid(self):
        measures = _measures(["e1", "e2"])
        proofs = {("p", "e1"): "2026-05-17", ("p", "e2"): "2026-12-31"}
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 0

    def test_all_expired_latest_drives_decision(self):
        # two expired proofs, most recent 15 days ago → counted
        measures = _measures(["e1", "e2"])
        proofs = {("p", "e1"): "2026-04-01", ("p", "e2"): "2026-05-17"}
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 1

    def test_all_expired_but_latest_within_threshold_not_counted(self):
        # one old (15d) + one recent (5d) → latest is 5d ago → excluded
        measures = _measures(["e1", "e2"])
        proofs = {("p", "e1"): "2026-05-17", ("p", "e2"): "2026-05-27"}
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 0

    def test_multiple_measures_counted_independently(self):
        measures = _measures(["e1"], ["e2"], [])
        proofs = {("p", "e1"): "2026-05-17", ("p", "e2"): "2026-05-10"}
        assert _count_proofs_expired_10d(measures, proofs, TODAY) == 2
