"""FEAT-73 — MedSecure's demonstration data, as the providers' APIs return it.

One file per provider. Dates are written relative to the collection
("@-3h", "@-120d") so the demonstration ages with the clock instead of
going stale; "$shared.<name>" reuses a block several collectors read (the
IAM credential report).
"""
from __future__ import annotations

import copy
import json
import re
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path

_DIR = Path(__file__).resolve().parent
_RELATIVE = re.compile(r"^@-(\d+)([hd])$")


@lru_cache(maxsize=None)
def _file(provider: str) -> dict:
    return json.loads((_DIR / f"{provider}_demo.json").read_text(encoding="utf-8"))


def _resolve(value, shared: dict, now: datetime):
    if isinstance(value, dict):
        return {k: _resolve(v, shared, now) for k, v in value.items()}
    if isinstance(value, list):
        return [_resolve(v, shared, now) for v in value]
    if isinstance(value, str):
        if value.startswith("$shared."):
            return _resolve(copy.deepcopy(shared[value[len("$shared."):]]), shared, now)
        m = _RELATIVE.match(value)
        if m:
            delta = timedelta(hours=int(m.group(1))) if m.group(2) == "h" else timedelta(days=int(m.group(1)))
            return (now - delta).isoformat()
    return value


def demo_payload(code: str, now: datetime | None = None) -> dict:
    """{raw, unreadable?} of one collector, dates resolved against ``now``."""
    data = _file("aws" if code.startswith("AWS-") else "github")
    return _resolve(copy.deepcopy(data["collectors"][code]), data.get("shared", {}), now or datetime.now(timezone.utc))
