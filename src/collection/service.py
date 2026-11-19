"""FEAT-73 — one collection: read the source, evaluate, write the version.

`collect` is what the activation, the manual run and the daily loop call.
It never raises on a source or rule failure: an exception becomes an `erreur`
version, so the history says the collection did not happen and why.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.collection.catalog import load_catalog
from src.collection.connections import connection_secrets
from src.collection.engine import canonical_sha256, finalize
from src.collection.providers.base import provider_for
from src.models import CollectionConnection, CollectionExclusion, CollectionMonitor, CollectionVersion

logger = logging.getLogger(__name__)

# One collection at a time per connection: the daily loop and the manual run
# share these locks; a connection already being read is skipped, not queued.
_LOCKS: dict[str, asyncio.Lock] = {}


def lock_for(connection_id: Any) -> asyncio.Lock:
    return _LOCKS.setdefault(str(connection_id), asyncio.Lock())


def evaluators() -> dict:
    from src.collection.rules.aws import EVALUATORS as AWS
    from src.collection.rules.github import EVALUATORS as GITHUB
    return {**AWS, **GITHUB}


async def active_exclusions(db: AsyncSession, connection_id: Any, code: str) -> list[dict]:
    """The exclusions in force: not revoked; a temporary one only while its
    derogation is approved."""
    rows = (await db.execute(select(CollectionExclusion).where(
        CollectionExclusion.connection_id == connection_id, CollectionExclusion.collector_code == code,
        CollectionExclusion.revoked_at.is_(None)))).scalars().all()
    approved: set = set()
    temporary = [r.derogation_id for r in rows if r.kind == "temporary" and r.derogation_id]
    if temporary:
        from src.models import Derogation
        approved = set((await db.execute(select(Derogation.id).where(
            Derogation.id.in_(temporary), Derogation.status == "approved"))).scalars().all())
    out = []
    for r in rows:
        if r.kind == "temporary" and r.derogation_id not in approved:
            continue
        out.append({"id": str(r.id), "resource": r.resource, "justification": r.justification,
                    "by": r.created_by, "at": r.created_at.date().isoformat() if r.created_at else None,
                    "derogation": str(r.derogation_id) if r.derogation_id else None})
    return out


async def _people(db: AsyncSession) -> list[dict] | None:
    """The people of Access, for GH-04. Lot 1d asks Access; until then none."""
    return None


async def collect(db: AsyncSession, monitor: CollectionMonitor, trigger: str,
                  now: datetime | None = None, provider: Any = None) -> CollectionVersion:
    now = now or datetime.now(timezone.utc)
    conn = await db.get(CollectionConnection, monitor.connection_id)
    collector = load_catalog().describe(monitor.collector_code)
    params = {**{p["id"]: p["default"] for p in collector.get("params", [])}, **(monitor.params or {})}
    try:
        if collector.get("retired"):
            raise LookupError("collector no longer in the catalog")
        fetched = await (provider or provider_for(conn)).fetch(conn, connection_secrets(conn), collector, params, now)
        evaluation = {} if fetched.get("error") else evaluators()[collector["code"]](
            fetched["raw"], params, {"now": now, "people": await _people(db)})
        draft = finalize(evaluation, fetched, await active_exclusions(db, conn.id, collector["code"]))
    except Exception as exc:  # noqa: BLE001 — a failed collection is recorded, never lost
        logger.exception("collection %s failed", monitor.id)
        reason = str(exc) if isinstance(exc, LookupError) else f"collection failed: {type(exc).__name__}"
        draft = finalize({}, {"raw": None, "error": {"reason": reason}}, [])
    seq = ((await db.execute(select(func.max(CollectionVersion.seq))
                             .where(CollectionVersion.monitor_id == monitor.id))).scalar() or 0) + 1
    changed = monitor.last_result != draft["result"]
    version = CollectionVersion(
        monitor_id=monitor.id, project_id=monitor.project_id, seq=seq, collected_at=now,
        data_as_of=draft["data_as_of"], trigger=trigger, collector_code=collector["code"],
        collector_version=collector["version"], rule_text=collector["rule"]["en"], connection_label=conn.label,
        result=draft["result"], reason=draft["reason"], missing_permission=draft["missing_permission"],
        partial=draft["partial"], evaluated=draft["evaluated"], n_findings=len(draft["findings"]),
        n_excluded=len(draft["excluded"]), n_unreadable=len(draft["unreadable"]), scope=draft["scope"],
        findings=draft["findings"], excluded=draft["excluded"], unreadable=draft["unreadable"],
        raw=draft["raw"], raw_sha256=draft["raw_sha256"] or canonical_sha256(None), result_changed=changed)
    db.add(version)
    await db.flush()
    # The measure was checked, the proof obtained, today.
    from src.models import ProjectMeasure, ProjectProof
    measure = await db.get(ProjectMeasure, (monitor.project_id, monitor.measure_id))
    if measure is not None:
        measure.dernier_controle = now.date().isoformat()
    proof = await db.get(ProjectProof, (monitor.project_id, monitor.proof_id))
    if proof is not None:
        proof.date_obtention = now.date().isoformat()
    monitor.last_attempt_at = now
    monitor.last_version_id = version.id
    monitor.last_collected_at = now
    if changed:
        monitor.state_since = now
    monitor.last_result = draft["result"]
    if draft["result"] == "erreur":
        monitor.error_since = monitor.error_since or now
    else:
        monitor.error_since = None
        monitor.alerted_at = None
    return version
