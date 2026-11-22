"""FEAT-73 — automated monitoring: the catalog and the project's connections.

Connections belong to one project and are managed here, in Compliance, also
in suite mode: Pilot neither lists nor pushes them (they escape
CONNECTORS_MANAGED_BY_PILOT). Reading a project's connections takes read
access to it; creating, changing, testing or deleting one takes edit access
(editors and administrators). Secrets never leave the server.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from src.auth import get_current_user
from src.collection.catalog import load_catalog, unavailable
from src.collection.connections import ConnectionInputError, apply_connection_input, connection_secrets, connection_view
from src.collection.providers.base import provider_for
from src.database import get_db
from src.models import CollectionConnection, User
from src.routes.auth_helpers import get_project_or_404
from src.schemas import ConnectionCreate, ConnectionUpdate

router = APIRouter(prefix="/api", tags=["collection"])

_NO_KEY = "ENCRYPTION_KEY must be set on the server before a connection's secrets can be stored."


def _actor(user: Optional[User]) -> str:
    return (user.email if user else "") or ""


@router.get("/collectors")
async def list_collectors(user: Optional[User] = Depends(get_current_user)):
    """The catalog: what each collector checks, reads and proves."""
    cat = load_catalog()
    keep = ("code", "provider", "version", "title", "rule", "reads", "permissions", "retention_profile",
            "retention", "params", "requirements", "requirement_keys")
    from src.collection.connections import LIVE_PROVIDERS
    return {"providers": [dict(p, live=p["provider"] in LIVE_PROVIDERS) for p in cat.providers.values()],
            "collectors": [{**{k: c[k] for k in keep if k in c}, "unavailable": unavailable(c)} for c in cat.collectors()]}


async def _connection_or_404(db: AsyncSession, project_id: uuid.UUID, connection_id: uuid.UUID) -> CollectionConnection:
    conn = await db.get(CollectionConnection, connection_id)
    if conn is None or conn.project_id != project_id:          # another project's: it does not exist here
        raise HTTPException(status_code=404, detail="Connection not found")
    return conn


def _tested_as(conn: CollectionConnection) -> tuple:
    """What a test of the connection depends on."""
    try:
        return conn.mode, dict(conn.settings or {}), connection_secrets(conn)
    except RuntimeError:
        raise HTTPException(status_code=503, detail=_NO_KEY)


def _write(conn: CollectionConnection, payload: dict, creating: bool) -> None:
    try:
        apply_connection_input(conn, payload, creating)
    except ConnectionInputError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError:
        raise HTTPException(status_code=503, detail=_NO_KEY)


async def _flush(db: AsyncSession) -> None:
    """Write now, so that a duplicate name is a 409 before anything else
    (the audit line) is written in the same transaction."""
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A connection with this name already exists for this provider")


@router.get("/projects/{project_id}/connections")
async def list_connections(project_id: uuid.UUID, user: Optional[User] = Depends(get_current_user),
                           db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db)
    rows = (await db.execute(select(CollectionConnection).where(CollectionConnection.project_id == project_id)
                             .order_by(CollectionConnection.provider, CollectionConnection.label))).scalars().all()
    return [connection_view(c) for c in rows]


@router.post("/projects/{project_id}/connections", status_code=201)
async def create_connection(project_id: uuid.UUID, body: ConnectionCreate, request: Request,
                            user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db, require_perm="edit")
    if body.provider not in load_catalog().providers:
        raise HTTPException(status_code=422, detail=f"unknown provider {body.provider}")
    conn = CollectionConnection(id=uuid.uuid4(), project_id=project_id, provider=body.provider,
                                created_by=_actor(user))
    _write(conn, body.model_dump(), creating=True)
    db.add(conn)
    await _flush(db)
    from src.audit import log_write
    await log_write(db, user, request, "connection.create", entity_type="collection_connection",
                    entity_id=str(conn.id), target=conn.label, details={"provider": conn.provider, "mode": conn.mode})
    await db.commit()
    return connection_view(conn)


@router.patch("/projects/{project_id}/connections/{connection_id}")
async def update_connection(project_id: uuid.UUID, connection_id: uuid.UUID, body: ConnectionUpdate,
                            request: Request, user: Optional[User] = Depends(get_current_user),
                            db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db, require_perm="edit")
    conn = await _connection_or_404(db, project_id, connection_id)
    before = _tested_as(conn)
    _write(conn, body.model_dump(exclude_unset=True), creating=False)
    if _tested_as(conn) != before:
        # The last test was of another connection: it is not shown as this one's.
        conn.last_test_at, conn.last_test_ok, conn.last_test_message = None, None, ""
        conn.missing_permissions = []
        # Written even when already empty: a test committed meanwhile is overwritten, not kept.
        for column in ("last_test_at", "last_test_ok", "last_test_message", "missing_permissions"):
            flag_modified(conn, column)
    conn.updated_at = datetime.now(timezone.utc)
    await _flush(db)
    from src.audit import log_write
    await log_write(db, user, request, "connection.update", entity_type="collection_connection",
                    entity_id=str(conn.id), target=conn.label,
                    details={"fields": sorted(body.model_dump(exclude_unset=True))})
    await db.commit()
    return connection_view(conn)


@router.delete("/projects/{project_id}/connections/{connection_id}", status_code=204)
async def delete_connection(project_id: uuid.UUID, connection_id: uuid.UUID, request: Request,
                            user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db, require_perm="edit")
    conn = await _connection_or_404(db, project_id, connection_id)
    from src.models import CollectionMonitor
    held = (await db.execute(select(CollectionMonitor.id).where(CollectionMonitor.connection_id == conn.id))).scalars().all()
    if held:
        raise HTTPException(status_code=409, detail=f"This connection holds the history of {len(held)} monitoring(s): "
                                                    "it cannot be deleted")
    from src.audit import log_write
    await log_write(db, user, request, "connection.delete", entity_type="collection_connection",
                    entity_id=str(conn.id), target=conn.label)
    await db.delete(conn)
    await db.commit()


@router.post("/projects/{project_id}/connections/{connection_id}/test")
async def test_connection(project_id: uuid.UUID, connection_id: uuid.UUID,
                          user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db, require_perm="edit")
    conn = await _connection_or_404(db, project_id, connection_id)
    try:
        secrets = connection_secrets(conn)
    except RuntimeError:
        raise HTTPException(status_code=503, detail=_NO_KEY)
    tested = _tested_as(conn)
    result = await provider_for(conn).test(conn, secrets)
    await db.refresh(conn)
    if _tested_as(conn) != tested:          # changed while it ran: this test is not of the connection now
        return {**result, "at": None}
    conn.last_test_at = datetime.now(timezone.utc)
    conn.last_test_ok = bool(result["ok"])
    conn.last_test_message = result["message"]
    conn.missing_permissions = list(result["missing_permissions"])
    await db.commit()
    return {**result, "at": conn.last_test_at.isoformat()}


# ── Monitoring of a measure ─────────────────────────────────────────────

from src.collection import ownership  # noqa: E402
from src.collection.service import collect, lock_for  # noqa: E402
from src.models import CollectionMonitor, CollectionVersion, ProjectControl, ProjectMeasure, ProjectProof  # noqa: E402
from src.schemas import MonitorCreate, MonitorDeactivate  # noqa: E402


def _days(since: Optional[datetime], now: datetime) -> Optional[int]:
    if since is None:
        return None
    if since.tzinfo is None:
        since = since.replace(tzinfo=timezone.utc)
    return max(0, (now - since).days)


def version_summary(v: CollectionVersion) -> dict:
    return {"id": str(v.id), "seq": v.seq, "result": v.result, "reason": v.reason,
            "missing_permission": v.missing_permission, "collected_at": v.collected_at.isoformat(),
            "data_as_of": v.data_as_of.isoformat() if v.data_as_of else None, "trigger": v.trigger,
            "collector_version": v.collector_version, "evaluated": v.evaluated, "partial": v.partial,
            "n_findings": v.n_findings, "n_excluded": v.n_excluded, "n_unreadable": v.n_unreadable,
            "raw_sha256": v.raw_sha256, "result_changed": v.result_changed,
            "purged": v.purged_at is not None}


async def monitor_view(db: AsyncSession, m: CollectionMonitor, now: Optional[datetime] = None) -> dict:
    now = now or datetime.now(timezone.utc)
    collector = load_catalog().describe(m.collector_code)
    conn = await db.get(CollectionConnection, m.connection_id)
    last = await db.get(CollectionVersion, m.last_version_id) if m.last_version_id else None
    return {
        "id": str(m.id), "measure_id": m.measure_id, "proof_id": m.proof_id, "collector_code": m.collector_code,
        "title": collector["title"], "rule": collector["rule"], "provider": collector["provider"],
        "connection_id": str(m.connection_id), "connection_label": conn.label if conn else "",
        "active": m.active, "params": dict(m.params or {}),
        "retention": dict(m.retention or collector["retention"]), "retention_default": m.retention is None,
        "last": version_summary(last) if last else None,
        "state_since": m.state_since.isoformat() if m.state_since else None,
        "days_in_state": _days(m.state_since, now),
        "error_since": m.error_since.isoformat() if m.error_since else None,
        "activated_by": m.activated_by, "activated_at": m.activated_at.isoformat() if m.activated_at else None,
        "deactivated_at": m.deactivated_at.isoformat() if m.deactivated_at else None,
        "deactivated_by": m.deactivated_by or "",
        "deactivation_reason": m.deactivation_reason or "",
        "retired": bool(collector.get("retired")),        # its collector left the catalog
    }


async def _measure_or_404(db: AsyncSession, project_id: uuid.UUID, measure_id: str) -> ProjectMeasure:
    measure = await db.get(ProjectMeasure, (project_id, measure_id))
    if measure is None:
        raise HTTPException(status_code=404, detail="Measure not found")
    return measure


async def project_links(db: AsyncSession, project_id: uuid.UUID) -> dict[str, dict[str, dict]]:
    """Requirement key → collector → {kind: explicit | confirmed | suggested,
    via?}, with the project's decisions on the suggestions."""
    from src.collection.coverage import links
    from src.models import CollectionSuggestionDecision, FrameworkMapping
    mappings = (await db.execute(select(FrameworkMapping.source_framework, FrameworkMapping.source_ref,
                                        FrameworkMapping.target_framework, FrameworkMapping.target_ref))).all()
    decisions = {(d.collector_code, d.requirement_key): d.decision for d in (await db.execute(
        select(CollectionSuggestionDecision).where(CollectionSuggestionDecision.project_id == project_id))).scalars().all()}
    return links(load_catalog().available(), mappings, decisions)


async def proposals(db: AsyncSession, project_id: uuid.UUID, measure_id: str) -> list[dict]:
    """The collectors that bring evidence to a requirement the measure is
    linked to (named by the collector, or a suggestion the project confirmed),
    for each connection of the project to their provider."""
    controls = (await db.execute(select(ProjectControl).where(ProjectControl.project_id == project_id))).scalars().all()
    keys = {f"{c.framework_id}:{c.ref}" for c in controls if measure_id in (c.mesures_ids or [])}
    conns = (await db.execute(select(CollectionConnection).where(CollectionConnection.project_id == project_id)
                              .order_by(CollectionConnection.label))).scalars().all()
    active = {(m.collector_code, str(m.connection_id)) for m in await ownership.active_monitors(db, project_id)
              if m.measure_id == measure_id}
    linked = await project_links(db, project_id)
    out = []
    for c in load_catalog().collectors():
        matches = [{"key": k, **linked[k][c["code"]]} for k in sorted(keys)
                   if c["code"] in linked.get(k, {}) and linked[k][c["code"]]["kind"] != "suggested"]
        if not matches:
            continue
        for conn in conns:
            if conn.provider != c["provider"]:
                continue
            out.append({"collector_code": c["code"], "title": c["title"], "rule": c["rule"], "provider": c["provider"],
                        "connection_id": str(conn.id), "connection_label": conn.label,
                        "matches": matches,
                        "active": (c["code"], str(conn.id)) in active})
    return out


@router.get("/projects/{project_id}/measures/{measure_id}/monitoring")
async def measure_monitoring(project_id: uuid.UUID, measure_id: str, user: Optional[User] = Depends(get_current_user),
                             db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db)
    await _measure_or_404(db, project_id, measure_id)
    monitors = (await db.execute(select(CollectionMonitor).where(
        CollectionMonitor.project_id == project_id, CollectionMonitor.measure_id == measure_id)
        .order_by(CollectionMonitor.activated_at))).scalars().all()
    return {"measure_id": measure_id,
            "recurrence_locked": any(m.active for m in monitors),
            "monitors": [await monitor_view(db, m) for m in monitors],
            "proposals": [p for p in await proposals(db, project_id, measure_id) if not p["active"]]}


def _checked_params(collector: dict, given: dict) -> dict:
    spec = {p["id"]: p for p in collector.get("params", [])}
    out = {}
    for key, value in (given or {}).items():
        p = spec.get(key)
        if p is None:
            raise HTTPException(status_code=422, detail=f"unknown parameter {key}")
        if not isinstance(value, int) or isinstance(value, bool) or not p["min"] <= value <= p["max"]:
            raise HTTPException(status_code=422, detail=f"{key} must be a whole number from {p['min']} to {p['max']}")
        out[key] = value
    return out


def checked_retention(given: Optional[dict]) -> Optional[dict]:
    if given is None:
        return None
    try:
        r = {k: int(given[k]) for k in ("daily_days", "weekly_days", "monthly_days")}
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=422, detail="retention needs daily_days, weekly_days and monthly_days")
    if not 0 < r["daily_days"] <= r["weekly_days"] <= r["monthly_days"] <= 3650:
        raise HTTPException(status_code=422, detail="retention: 0 < daily ≤ weekly ≤ monthly ≤ 3650 days")
    return r


def _next_proof_id(existing: set) -> str:
    n = 1 + max([int(i[2:]) for i in existing if i.startswith("P-") and i[2:].isdigit()] or [0])
    return f"P-{n:03d}"


async def _stopped_monitor(db: AsyncSession, project_id: uuid.UUID, measure_id: str, code: str,
                          connection_id: uuid.UUID) -> Optional[CollectionMonitor]:
    """The last monitoring of this collector, through this connection, that
    a person stopped on this measure, whose collected proof is still there.
    One the server stopped is not resumed: a measure deleted and created again
    under its id is another measure, and must not inherit the history."""
    rows = (await db.execute(select(CollectionMonitor).where(
        CollectionMonitor.project_id == project_id, CollectionMonitor.measure_id == measure_id,
        CollectionMonitor.collector_code == code, CollectionMonitor.connection_id == connection_id,
        CollectionMonitor.active.is_(False), CollectionMonitor.deactivated_by != ownership.SYSTEM_ACTOR)
        .order_by(CollectionMonitor.deactivated_at.desc().nulls_last()))).scalars().all()
    for m in rows:
        proof = await db.get(ProjectProof, (project_id, m.proof_id))
        if proof is not None and proof.source == "collected":
            return m
    return None


@router.post("/projects/{project_id}/measures/{measure_id}/monitors", status_code=201)
async def activate_monitoring(project_id: uuid.UUID, measure_id: str, body: MonitorCreate, request: Request,
                              user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Activate a proposed collector on the measure: the server creates the
    collected proof (or resumes the monitoring stopped there, with its proof),
    sets the measure's recurrence to daily (locked) and collects at once."""
    project = await get_project_or_404(project_id, user, db, require_perm="edit")
    measure = await _measure_or_404(db, project_id, measure_id)
    conn = await _connection_or_404(db, project_id, body.connection_id)
    reason = unavailable(load_catalog().describe(body.collector_code))
    if reason:
        raise HTTPException(status_code=422, detail=f"This collector cannot be activated: {reason}")
    offered = {(p["collector_code"], p["connection_id"]): p for p in await proposals(db, project_id, measure_id)}
    proposal = offered.get((body.collector_code, str(conn.id)))
    if proposal is None:
        raise HTTPException(status_code=422, detail="This collector brings no evidence to the requirements of this measure "
                                                    "through this connection")
    if proposal["active"]:
        raise HTTPException(status_code=409, detail="This collector already monitors the measure through this connection")
    collector = load_catalog().collector(body.collector_code)
    params = _checked_params(collector, body.params)
    retention = checked_retention(body.retention)
    now = datetime.now(timezone.utc)
    monitor = await _stopped_monitor(db, project_id, measure_id, collector["code"], conn.id)
    resumed = None
    if monitor is not None:
        # The same collector through the same connection was stopped on this
        # measure: it resumes, writing on in the same proof and history, with
        # its own parameters and retention unless the request sets them (a
        # retention reset to the profile would purge what it kept).
        resumed = {"stopped_at": monitor.deactivated_at.isoformat() if monitor.deactivated_at else None,
                   "stopped_by": monitor.deactivated_by, "reason": monitor.deactivation_reason}
        changes = {"active": True, "activated_by": _actor(user), "activated_at": now,
                   "deactivated_by": "", "deactivated_at": None, "deactivation_reason": "",
                   # A new watch: its state and its error streak start again.
                   "error_since": None, "alerted_at": None, "last_result": None, "state_since": None}
        if "params" in body.model_fields_set:
            changes["params"] = params
        if "retention" in body.model_fields_set:
            changes["retention"] = retention
        # Resumed once: of two activations at the same time, the second finds it active.
        done = await db.execute(update(CollectionMonitor).where(
            CollectionMonitor.id == monitor.id, CollectionMonitor.active.is_(False)).values(**changes)
            .execution_options(synchronize_session=False))
        if done.rowcount != 1:
            await db.rollback()
            raise HTTPException(status_code=409, detail="Another activation ran at the same time; reload and try again")
        await db.refresh(monitor)
        if monitor.proof_id not in (measure.preuves_ids or []):
            measure.preuves_ids = list(measure.preuves_ids or []) + [monitor.proof_id]
    else:
        existing = set((await db.execute(select(ProjectProof.id).where(ProjectProof.project_id == project_id))).scalars().all())
        proof = ProjectProof(project_id=project_id, id=_next_proof_id(existing),
                             label=f"{collector['code']} — {collector['title']['en']}",
                             kind="observation", source="collected", owner=measure.responsable or "",
                             date_obtention=now.date().isoformat(), sort_order=len(existing) + 1,
                             commentaire=f"Automated monitoring through {conn.label}")
        db.add(proof)
        measure.preuves_ids = list(measure.preuves_ids or []) + [proof.id]
        monitor = CollectionMonitor(id=uuid.uuid4(), project_id=project_id, connection_id=conn.id, measure_id=measure_id,
                                    proof_id=proof.id, collector_code=collector["code"], params=params,
                                    retention=retention, activated_by=_actor(user), activated_at=now)
        db.add(monitor)
    measure.recurrence = ownership.MONITORED_RECURRENCE
    try:
        await db.flush()
    except IntegrityError:          # another activation (this collector, or the same proof id) won the race
        await db.rollback()
        raise HTTPException(status_code=409, detail="Another activation ran at the same time; reload and try again")
    async with lock_for(conn.id):
        await collect(db, monitor, "activation", now=now)
    project.updated_at = now
    from src.audit import log_write
    await log_write(db, user, request, "monitoring.reactivate" if resumed else "monitoring.activate",
                    entity_type="collection_monitor", entity_id=str(monitor.id),
                    target=f"{measure_id} {collector['code']}",
                    details={"connection": str(conn.id), "proof": monitor.proof_id,
                             **({"resumed_after": resumed} if resumed else {})})
    await db.commit()
    return await monitor_view(db, monitor, now)


@router.get("/projects/{project_id}/monitors")
async def list_monitors(project_id: uuid.UUID, user: Optional[User] = Depends(get_current_user),
                        db: AsyncSession = Depends(get_db)):
    """Every monitoring of the project, active first."""
    await get_project_or_404(project_id, user, db)
    rows = (await db.execute(select(CollectionMonitor).where(CollectionMonitor.project_id == project_id)
                             .order_by(CollectionMonitor.active.desc(), CollectionMonitor.measure_id,
                                       CollectionMonitor.collector_code))).scalars().all()
    return [await monitor_view(db, m) for m in rows]


async def _monitor_or_404(db: AsyncSession, project_id: uuid.UUID, monitor_id: uuid.UUID) -> CollectionMonitor:
    m = await db.get(CollectionMonitor, monitor_id)
    if m is None or m.project_id != project_id:
        raise HTTPException(status_code=404, detail="Monitoring not found")
    return m


@router.post("/projects/{project_id}/monitors/{monitor_id}/run")
async def run_monitoring(project_id: uuid.UUID, monitor_id: uuid.UUID, user: Optional[User] = Depends(get_current_user),
                         db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db, require_perm="edit")
    m = await _monitor_or_404(db, project_id, monitor_id)
    if not m.active:
        raise HTTPException(status_code=409, detail="This monitoring is no longer active")
    lock = lock_for(m.connection_id)
    if lock.locked():
        raise HTTPException(status_code=409, detail="A collection is already running on this connection")
    async with lock:
        await collect(db, m, "manual")
    await db.commit()
    return await monitor_view(db, m)


@router.post("/projects/{project_id}/monitors/{monitor_id}/deactivate")
async def deactivate_monitoring(project_id: uuid.UUID, monitor_id: uuid.UUID, body: MonitorDeactivate, request: Request,
                                user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Stop collecting. The proof and its history stay; the measure's
    recurrence is free again once no monitoring holds it."""
    await get_project_or_404(project_id, user, db, require_perm="edit")
    m = await _monitor_or_404(db, project_id, monitor_id)
    if not m.active:
        raise HTTPException(status_code=409, detail="This monitoring is no longer active")
    reason = (body.reason or "").replace("\r", " ").replace("\n", " ").strip()
    if not reason:
        raise HTTPException(status_code=422, detail="Say why the monitoring stops")
    m.active, m.deactivated_at, m.deactivated_by, m.deactivation_reason = False, datetime.now(timezone.utc), _actor(user), reason[:2000]
    from src.audit import log_write
    await log_write(db, user, request, "monitoring.deactivate", entity_type="collection_monitor",
                    entity_id=str(m.id), target=f"{m.measure_id} {m.collector_code}", details={"reason": m.deactivation_reason})
    await db.commit()
    return await monitor_view(db, m)


# ── Versions of a collected proof ───────────────────────────────────────

from src.schemas import MonitorUpdate  # noqa: E402


@router.patch("/projects/{project_id}/monitors/{monitor_id}")
async def update_monitoring(project_id: uuid.UUID, monitor_id: uuid.UUID, body: MonitorUpdate, request: Request,
                            user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Change a monitoring's parameters or its retention (null: back to the
    collector's profile)."""
    await get_project_or_404(project_id, user, db, require_perm="edit")
    m = await _monitor_or_404(db, project_id, monitor_id)
    changes = body.model_dump(exclude_unset=True)
    if "params" in changes:
        m.params = _checked_params(load_catalog().describe(m.collector_code), changes["params"] or {})
    if "retention" in changes:
        m.retention = checked_retention(changes["retention"])
    from src.audit import log_write
    await log_write(db, user, request, "monitoring.update", entity_type="collection_monitor", entity_id=str(m.id),
                    target=f"{m.measure_id} {m.collector_code}", details={"fields": sorted(changes)})
    await db.commit()
    return await monitor_view(db, m)


@router.get("/projects/{project_id}/monitors/{monitor_id}/versions")
async def list_versions(project_id: uuid.UUID, monitor_id: uuid.UUID, limit: int = 100,
                        before_seq: Optional[int] = None, user: Optional[User] = Depends(get_current_user),
                        db: AsyncSession = Depends(get_db)):
    """The history, newest first; purged versions keep their result and
    fingerprint."""
    await get_project_or_404(project_id, user, db)
    await _monitor_or_404(db, project_id, monitor_id)
    q = select(CollectionVersion).where(CollectionVersion.monitor_id == monitor_id)
    if before_seq is not None:
        q = q.where(CollectionVersion.seq < before_seq)
    rows = (await db.execute(q.order_by(CollectionVersion.seq.desc()).limit(max(1, min(limit, 500))))).scalars().all()
    return [version_summary(v) for v in rows]


async def _version_or_404(db: AsyncSession, project_id: uuid.UUID, version_id: uuid.UUID) -> CollectionVersion:
    v = await db.get(CollectionVersion, version_id)
    if v is None or v.project_id != project_id:
        raise HTTPException(status_code=404, detail="Version not found")
    return v


@router.get("/projects/{project_id}/versions/{version_id}")
async def get_version(project_id: uuid.UUID, version_id: uuid.UUID, user: Optional[User] = Depends(get_current_user),
                      db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db)
    v = await _version_or_404(db, project_id, version_id)
    return {**version_summary(v), "monitor_id": str(v.monitor_id), "collector_code": v.collector_code,
            "rule": v.rule_text, "connection_label": v.connection_label, "scope": v.scope,
            "findings": v.findings or [], "excluded": v.excluded or [], "unreadable": v.unreadable or []}


@router.get("/projects/{project_id}/versions/{version_id}/raw")
async def get_version_raw(project_id: uuid.UUID, version_id: uuid.UUID, user: Optional[User] = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    """The source's answer as collected, with its fingerprint. It can list
    people and accounts: editors and administrators only."""
    await get_project_or_404(project_id, user, db, require_perm="edit")
    v = await _version_or_404(db, project_id, version_id)
    if v.purged_at is not None:
        raise HTTPException(status_code=410, detail="The raw data of this version was purged by its retention")
    return {"raw": v.raw, "raw_sha256": v.raw_sha256, "collected_at": v.collected_at.isoformat()}


# ── Exclusions ──────────────────────────────────────────────────────────

from src.collection.engine import canonical_sha256  # noqa: E402
from src.models import CollectionExclusion, Derogation  # noqa: E402
from src.schemas import ExclusionCreate, ExclusionRevoke  # noqa: E402


async def exclusion_view(db: AsyncSession, e: CollectionExclusion) -> dict:
    """The exclusion and its state: active, pending_approval (temporary,
    derogation not approved yet), expired / rejected (its derogation),
    revoked, or sans_objet (the resource is gone from the last collection)."""
    state = "active"
    d = await db.get(Derogation, e.derogation_id) if e.derogation_id else None
    derogation = {"id": str(d.id), "reference": d.reference, "status": d.status,
                  "valid_until": d.valid_until.isoformat() if d.valid_until else None} if d else None
    if e.revoked_at is not None:
        state = "revoked"
    elif e.kind == "temporary":
        status = d.status if d else "pending_approval"
        state = {"approved": "active", "pending_approval": "pending_approval"}.get(status, status)
    if state == "active":
        last = (await db.execute(select(CollectionMonitor.last_version_id).where(
            CollectionMonitor.connection_id == e.connection_id, CollectionMonitor.collector_code == e.collector_code,
            CollectionMonitor.last_version_id.is_not(None)).order_by(CollectionMonitor.last_collected_at.desc()).limit(1))).scalar()
        v = await db.get(CollectionVersion, last) if last else None
        if v is not None and v.result != "erreur" and v.scope is not None \
                and e.resource not in (v.scope.get("resources") or []):
            state = "sans_objet"
    return {"id": str(e.id), "connection_id": str(e.connection_id), "collector_code": e.collector_code,
            "resource": e.resource, "justification": e.justification, "kind": e.kind, "state": state,
            "derogation": derogation, "created_by": e.created_by,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "revoked_by": e.revoked_by or "", "revoked_at": e.revoked_at.isoformat() if e.revoked_at else None,
            "revoked_reason": e.revoked_reason or ""}


@router.post("/projects/{project_id}/monitors/{monitor_id}/exclusions", status_code=201)
async def create_exclusion(project_id: uuid.UUID, monitor_id: uuid.UUID, body: ExclusionCreate, request: Request,
                           user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Set a resource of the monitoring aside, with a justification. A
    temporary exclusion is requested as a derogation of the register and
    counts once approved."""
    await get_project_or_404(project_id, user, db, require_perm="edit")
    m = await _monitor_or_404(db, project_id, monitor_id)
    justification = (body.justification or "").strip()
    if not 10 <= len(justification) <= 2000:
        raise HTTPException(status_code=422, detail="A justification of 10 to 2000 characters is required")
    if body.kind not in ("permanent", "temporary"):
        raise HTTPException(status_code=422, detail="kind is permanent or temporary")
    last = await db.get(CollectionVersion, m.last_version_id) if m.last_version_id else None
    if last is None or body.resource not in ((last.scope or {}).get("resources") or []):
        raise HTTPException(status_code=422, detail="This resource is not among the resources the last collection evaluated")
    e = CollectionExclusion(id=uuid.uuid4(), project_id=project_id, connection_id=m.connection_id,
                            collector_code=m.collector_code, resource=body.resource,
                            resource_hash=canonical_sha256(body.resource), justification=justification,
                            kind=body.kind, created_by=_actor(user))
    db.add(e)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="This resource is already excluded")
    if body.kind == "temporary":
        from src.nonconformity_common import DerogationCreate
        from src.routes.nonconformities import router as register
        request_derogation = next(rt.endpoint for rt in register.routes if rt.endpoint.__name__ == "request_derogation")
        der = await request_derogation(DerogationCreate(
            project_id=str(project_id), subject_type="collection_exclusion", subject_id=str(e.id),
            title=(body.title or f"Exclusion {m.collector_code} — {body.resource}")[:500], justification=justification,
            risk_owner=body.risk_owner or "", approver=body.approver or "", valid_until=body.valid_until,
            review_at=body.review_at), request, user=user, db=db)
        e = await db.get(CollectionExclusion, e.id)
        e.derogation_id = uuid.UUID(str(der["id"]))
    from src.audit import log_write
    await log_write(db, user, request, "exclusion.create", entity_type="collection_exclusion", entity_id=str(e.id),
                    target=f"{m.collector_code} {body.resource}"[:500], details={"kind": body.kind})
    await db.commit()
    return await exclusion_view(db, e)


@router.get("/projects/{project_id}/exclusions")
async def list_exclusions(project_id: uuid.UUID, user: Optional[User] = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db)
    rows = (await db.execute(select(CollectionExclusion).where(CollectionExclusion.project_id == project_id)
                             .order_by(CollectionExclusion.created_at.desc()))).scalars().all()
    return [await exclusion_view(db, e) for e in rows]


@router.post("/projects/{project_id}/exclusions/{exclusion_id}/revoke")
async def revoke_exclusion(project_id: uuid.UUID, exclusion_id: uuid.UUID, body: ExclusionRevoke, request: Request,
                           user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """The resource counts again from the next collection. A temporary
    exclusion's derogation is revoked with it."""
    await get_project_or_404(project_id, user, db, require_perm="edit")
    e = await db.get(CollectionExclusion, exclusion_id)
    if e is None or e.project_id != project_id:
        raise HTTPException(status_code=404, detail="Exclusion not found")
    if e.revoked_at is not None:
        raise HTTPException(status_code=409, detail="This exclusion is already revoked")
    reason = (body.reason or "").replace("\r", " ").replace("\n", " ").strip()
    if not reason:
        raise HTTPException(status_code=422, detail="Say why the exclusion ends")
    now = datetime.now(timezone.utc)
    e.revoked_at, e.revoked_by, e.revoked_reason = now, _actor(user), reason[:2000]
    # The register's own rule: an approved derogation is revoked, a pending
    # request on a subject that moved on is rejected.
    from src.nonconformity_common import revoke_for_subject
    await revoke_for_subject(db, Derogation, "collection_exclusion", str(e.id), f"Exclusion revoked: {reason}",
                             actor=_actor(user) or "compliance")
    from src.audit import log_write
    await log_write(db, user, request, "exclusion.revoke", entity_type="collection_exclusion", entity_id=str(e.id),
                    target=f"{e.collector_code} {e.resource}"[:500], details={"reason": e.revoked_reason})
    await db.commit()
    return await exclusion_view(db, e)


# ── Coverage of a framework ─────────────────────────────────────────────

from src.schemas import SuggestionDecision  # noqa: E402


@router.get("/projects/{project_id}/coverage")
async def framework_coverage(project_id: uuid.UUID, framework: str, user: Optional[User] = Depends(get_current_user),
                             db: AsyncSession = Depends(get_db)):
    """Per applicable requirement of the framework: covered (a linked measure
    is monitored), coverable (a collector names it or a confirmed suggestion
    links it, not activated), suggested (deduced from the mappings to ISO, to
    confirm), or none."""
    from src.compliance_status import is_applicable
    await get_project_or_404(project_id, user, db)
    controls = (await db.execute(select(ProjectControl).where(
        ProjectControl.project_id == project_id, ProjectControl.framework_id == framework)
        .order_by(ProjectControl.sort_order))).scalars().all()
    linked = await project_links(db, project_id)
    providers = set((await db.execute(select(CollectionConnection.provider).where(
        CollectionConnection.project_id == project_id))).scalars().all())
    monitors = await ownership.active_monitors(db, project_id)
    cat = load_catalog()
    rows, totals = [], {"covered": 0, "coverable": 0, "suggested": 0, "none": 0}
    for c in controls:
        if not is_applicable(c.applicable):
            continue
        key = f"{c.framework_id}:{c.ref}"
        mine = [m for m in monitors if m.measure_id in (c.mesures_ids or [])]
        collectors = [{"code": code, "title": cat.describe(code)["title"], **link,
                       "connection_available": cat.describe(code)["provider"] in providers}
                      for code, link in sorted(linked.get(key, {}).items())]
        if mine:
            state = "covered"
        elif any(x["kind"] != "suggested" for x in collectors):
            state = "coverable"
        elif collectors:
            state = "suggested"
        else:
            state = "none"
        totals[state] += 1
        rows.append({"key": key, "ref": c.ref, "title": c.mesure or c.thematique or "", "state": state,
                     "collectors": collectors,
                     "monitors": [{"id": str(m.id), "measure_id": m.measure_id, "collector_code": m.collector_code,
                                   "last_result": m.last_result,
                                   "since": m.state_since.isoformat() if m.state_since else None} for m in mine]})
    return {"framework": framework, "totals": totals, "requirements": rows}


@router.post("/projects/{project_id}/coverage/decisions")
async def decide_suggestion(project_id: uuid.UUID, body: SuggestionDecision, request: Request,
                            user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Confirm or reject a suggested link, for this project."""
    from src.models import CollectionSuggestionDecision
    await get_project_or_404(project_id, user, db, require_perm="edit")
    if body.decision not in ("confirmed", "rejected"):
        raise HTTPException(status_code=422, detail="decision is confirmed or rejected")
    linked = await project_links(db, project_id)
    current = linked.get(body.requirement_key, {}).get(body.collector_code)
    row = await db.get(CollectionSuggestionDecision, (project_id, body.collector_code, body.requirement_key))
    if (current is None or current["kind"] == "explicit") and row is None:
        raise HTTPException(status_code=422, detail="This link is not a suggestion")
    if row is None:
        row = CollectionSuggestionDecision(project_id=project_id, collector_code=body.collector_code,
                                           requirement_key=body.requirement_key, decision=body.decision)
        db.add(row)
    row.decision, row.decided_by, row.decided_at = body.decision, _actor(user), datetime.now(timezone.utc)
    from src.audit import log_write
    await log_write(db, user, request, "coverage.decision", entity_type="collection_suggestion",
                    entity_id=f"{body.collector_code}:{body.requirement_key}"[:64], details={"decision": body.decision})
    await db.commit()
    return {"collector_code": body.collector_code, "requirement_key": body.requirement_key, "decision": body.decision}
