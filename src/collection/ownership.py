"""FEAT-73 — what the automated monitoring owns in the project's data.

An active monitor owns its collected proof and the recurrence of its
measure (daily, locked). The whole-project save deletes and re-inserts every
measure and proof from the browser's copy, which may be stale or edited:
`snapshot` reads what the server owns before, `restore` puts it back after.
A monitor whose measure is gone from the saved data is deactivated (its
proof and history stay).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import CollectionMonitor, ProjectMeasure, ProjectProof

MONITORED_RECURRENCE = "quotidienne"
_PROOF_FIELDS = ("label", "url", "date_obtention", "date_expiration", "commentaire", "kind", "file_ref",
                 "owner", "tags", "source")


async def active_monitors(db: AsyncSession, project_id: Any) -> list[CollectionMonitor]:
    return list((await db.execute(select(CollectionMonitor).where(
        CollectionMonitor.project_id == project_id, CollectionMonitor.active.is_(True)))).scalars().all())


async def snapshot(db: AsyncSession, project_id: Any) -> dict:
    """What the monitoring owns: the collected proofs it holds (an orphan is
    the people's) and the last check of its measures."""
    held = select(CollectionMonitor.proof_id).where(CollectionMonitor.project_id == project_id)
    proofs = (await db.execute(select(ProjectProof).where(
        ProjectProof.project_id == project_id, ProjectProof.source == "collected",
        ProjectProof.id.in_(held)))).scalars().all()
    checked = {}
    for m in await active_monitors(db, project_id):
        measure = await db.get(ProjectMeasure, (project_id, m.measure_id))
        if measure is not None:
            checked[m.measure_id] = measure.dernier_controle
    return {"proofs": {p.id: {f: getattr(p, f) for f in _PROOF_FIELDS} | {"sort_order": p.sort_order}
                       for p in proofs},
            "last_checked": checked}


async def restore(db: AsyncSession, project_id: Any, snap: dict, reason: str) -> list[str]:
    """Put back the collected proofs and the locked recurrences; return the
    ids of the monitors deactivated because their measure is gone."""
    await db.flush()
    for pid, fields in snap["proofs"].items():
        row = await db.get(ProjectProof, (project_id, pid))
        if row is None:
            db.add(ProjectProof(project_id=project_id, id=pid, **fields))
        else:
            for f, v in fields.items():
                setattr(row, f, v)
    deactivated = []
    now = datetime.now(timezone.utc)
    for m in await active_monitors(db, project_id):
        measure = await db.get(ProjectMeasure, (project_id, m.measure_id))
        if measure is None:
            m.active, m.deactivated_at, m.deactivation_reason = False, now, reason
            deactivated.append(str(m.id))
            continue
        measure.recurrence = MONITORED_RECURRENCE
        if m.measure_id in snap.get("last_checked", {}):       # the collection's date, not the browser's
            measure.dernier_controle = snap["last_checked"][m.measure_id]
        if m.proof_id not in (measure.preuves_ids or []):
            measure.preuves_ids = list(measure.preuves_ids or []) + [m.proof_id]
    return deactivated


async def recurrence_locked(db: AsyncSession, project_id: Any, measure_id: str) -> bool:
    return (await db.execute(select(CollectionMonitor.id).where(
        CollectionMonitor.project_id == project_id, CollectionMonitor.measure_id == measure_id,
        CollectionMonitor.active.is_(True)).limit(1))).first() is not None


async def is_collected_proof(db: AsyncSession, project_id: Any, proof_id: str) -> bool:
    row = await db.get(ProjectProof, (project_id, proof_id))
    return row is not None and row.source == "collected"


async def is_held_proof(db: AsyncSession, project_id: Any, proof_id: str) -> bool:
    """A collected proof a monitoring (active or stopped) writes or wrote: its
    history stands behind it. One restored without its monitoring is an
    orphan the people may edit or remove."""
    return (await db.execute(select(CollectionMonitor.id).where(
        CollectionMonitor.project_id == project_id, CollectionMonitor.proof_id == proof_id).limit(1))).first() is not None


async def stop_for_measure(db: AsyncSession, project_id: Any, measure_id: str, reason: str) -> None:
    """The measure is gone: its monitoring stops; the proof and history stay."""
    now = datetime.now(timezone.utc)
    for m in await active_monitors(db, project_id):
        if m.measure_id == measure_id:
            m.active, m.deactivated_at, m.deactivation_reason = False, now, reason
