"""FEAT-73 — which versions of a collected proof the purge keeps.

Tiers, as in a backup plan: every version of the last `daily_days`, then the
last version of each ISO week up to `weekly_days`, then the last of each
calendar month up to `monthly_days`. Kept whatever their age: the first
version, the current one, and every version where the result changed.
Pure: the caller passes the versions and the clock, and purges the rest.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable


def _get(v: Any, key: str):
    value = v[key] if isinstance(v, dict) else getattr(v, key)
    if isinstance(value, datetime) and value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)       # stored in UTC
    return value


def retained_ids(versions: Iterable[Any], profile: dict, now: datetime) -> set:
    ordered = sorted(versions, key=lambda v: _get(v, "collected_at"))
    if not ordered:
        return set()
    kept = {_get(ordered[0], "id"), _get(ordered[-1], "id")}
    last_of_week: dict = {}
    last_of_month: dict = {}
    for v in ordered:
        at = _get(v, "collected_at")
        age = (now - at).total_seconds() / 86400
        if _get(v, "result_changed"):
            kept.add(_get(v, "id"))
        if age <= profile["daily_days"]:
            kept.add(_get(v, "id"))
        elif age <= profile["weekly_days"]:
            last_of_week[at.isocalendar()[:2]] = _get(v, "id")      # later ones overwrite
        elif age <= profile["monthly_days"]:
            last_of_month[(at.year, at.month)] = _get(v, "id")
    return kept | set(last_of_week.values()) | set(last_of_month.values())
