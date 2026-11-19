"""FEAT-73 lot 1a — which versions of a collected proof are kept.

Rotation by tiers, as a backup plan: every version of the last `daily_days`,
the last version of each ISO week up to `weekly_days`, the last of each
calendar month up to `monthly_days`. Always kept besides: the first version,
the current one, and every version where the result changed — the date a
proof went red or green is never lost."""
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.collection.retention import retained_ids  # noqa: E402

NOW = datetime(2026, 11, 17, 3, 0, tzinfo=timezone.utc)
PROFILE = {"daily_days": 7, "weekly_days": 61, "monthly_days": 396}


def _daily(days: int, changed_on: tuple = ()) -> list[dict]:
    """One version a day, `days` back to yesterday, oldest first."""
    out = []
    for i in range(days, 0, -1):
        at = NOW - timedelta(days=i)
        out.append({"id": i, "collected_at": at, "result_changed": i in changed_on})
    return out


def _age(v) -> float:
    return (NOW - v["collected_at"]).total_seconds() / 86400


def test_every_version_of_the_daily_tier_is_kept():
    versions = _daily(30)
    kept = retained_ids(versions, PROFILE, NOW)
    assert {v["id"] for v in versions if _age(v) <= 7} <= kept


def test_one_version_a_week_then_one_a_month_then_none():
    versions = _daily(500)
    kept = retained_ids(versions, PROFILE, NOW)
    weekly = [v for v in versions if 7 < _age(v) <= 61 and v["id"] in kept]
    weeks = {v["collected_at"].isocalendar()[:2] for v in versions if 7 < _age(v) <= 61}
    assert len(weekly) <= len(weeks) + 1 and len(weekly) >= len(weeks) - 1
    monthly = [v for v in versions if 61 < _age(v) <= 396 and v["id"] in kept]
    assert 11 <= len(monthly) <= 13
    beyond = [v for v in versions if _age(v) > 396 and v["id"] in kept]
    assert [v["id"] for v in beyond] == [500]                 # the first version only


def test_the_kept_version_of_a_week_is_its_last_one():
    versions = _daily(60)
    kept = retained_ids(versions, PROFILE, NOW)
    by_week: dict = {}
    for v in versions:
        if 7 < _age(v) <= 61:
            by_week.setdefault(v["collected_at"].isocalendar()[:2], []).append(v)
    for week, vs in by_week.items():
        last = max(vs, key=lambda v: v["collected_at"])
        assert last["id"] in kept, week


def test_a_change_of_result_is_kept_whatever_its_age():
    versions = _daily(800, changed_on=(700, 450, 100, 20))
    kept = retained_ids(versions, PROFILE, NOW)
    assert {700, 450, 100, 20} <= kept


def test_the_first_and_the_current_versions_are_always_kept():
    versions = _daily(900)
    kept = retained_ids(versions, {"daily_days": 1, "weekly_days": 1, "monthly_days": 1}, NOW)
    assert kept == {900, 1}


def test_no_version_is_no_work():
    assert retained_ids([], PROFILE, NOW) == set()
