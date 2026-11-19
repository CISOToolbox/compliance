"""FEAT-73 — the simulated provider: MedSecure's AWS account and GitHub
organization, without a single network call.

It answers like the real APIs (the payloads in `fixtures/` have their shape),
so the rules evaluated on them are the ones the live collectors will run. The
connection's `scenario` setting picks what is missing: by default, the AWS
role of MedSecure lacks the right to list backup jobs. Every operation served
is recorded in `calls`, so a test can check that only declared reads happen.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from src.collection.catalog import load_catalog

# What each scenario's connection lacks, by provider.
SCENARIOS: dict[str, dict[str, list[str]]] = {
    "medsecure": {"aws": ["backup:ListBackupJobs"], "github": []},
    "complete": {"aws": [], "github": []},
    "no-access": {"aws": ["*"], "github": ["*"]},
}


def _scenario(conn: Any) -> dict[str, list[str]]:
    return SCENARIOS.get((conn.settings or {}).get("scenario") or "medsecure", SCENARIOS["medsecure"])


class SimulatedProvider:
    def __init__(self) -> None:
        self.calls: list[str] = []

    def missing(self, conn: Any) -> list[str]:
        declared = load_catalog().providers[conn.provider]["connection"]["permissions"]
        lacking = _scenario(conn).get(conn.provider, [])
        return list(declared) if "*" in lacking else [p for p in declared if p in lacking]

    async def test(self, conn: Any, secrets: dict) -> dict:
        missing = self.missing(conn)
        declared = load_catalog().providers[conn.provider]["connection"]["permissions"]
        if len(missing) == len(declared):
            return {"ok": False, "partial": False, "missing_permissions": missing,
                    "message": "The connection could not read anything: check the role or the token."}
        if missing:
            return {"ok": True, "partial": True, "missing_permissions": missing,
                    "message": "Connected; some collectors will fail until these rights are granted: " + ", ".join(missing)}
        return {"ok": True, "partial": False, "missing_permissions": [], "message": "Connected."}

    async def fetch(self, conn: Any, secrets: dict, collector: dict, params: dict,
                    now: datetime | None = None) -> dict:
        from src.collection.fixtures import demo_payload
        now = now or datetime.now(timezone.utc)
        perms = collector.get("permissions", [])
        lacking = (list(perms) if "*" in _scenario(conn).get(conn.provider, [])
                   else sorted(set(perms) & set(self.missing(conn))))
        if lacking:
            return {"raw": None, "data_as_of": None, "unreadable": [],
                    "error": {"reason": "AccessDenied", "missing_permission": lacking[0]}}
        self.calls.extend(collector["reads"])
        payload = demo_payload(collector["code"], now)
        return {"raw": payload["raw"], "data_as_of": now - timedelta(minutes=14),
                "unreadable": payload.get("unreadable", []), "error": None}
