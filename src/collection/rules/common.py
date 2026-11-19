"""FEAT-73 — what every collector rule returns, and the readings they share."""
from __future__ import annotations

from datetime import datetime
from typing import Any


def evaluation(resources: list[str], findings: list[dict], outcome: str = "ok", reason: str | None = None) -> dict:
    if outcome == "ok" and not resources:
        outcome, reason = "no_resources", reason or "nothing in scope"
    return {"outcome": outcome, "reason": reason, "evaluated": len(resources),
            "findings": findings, "scope": {"resources": resources}}


def finding(resource: str, detail: str) -> dict:
    return {"resource": resource, "detail": detail}


def parse_date(value: Any) -> datetime | None:
    if not value or value in ("N/A", "no_information", "not_supported"):
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def is_true(value: Any) -> bool:
    return value is True or str(value).lower() == "true"
