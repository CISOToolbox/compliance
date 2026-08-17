"""Internal API endpoints for Pilot integration."""

from __future__ import annotations

import logging

import os
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.evidence_common import evidence_to_pilot_payload
from src.models import Project, ProjectControl, ProjectMeasure, ProjectMeta, ProjectProof, ProjectSettings
from src.settings_crypto import decrypt_setting, encrypt_setting_or_plain

router = APIRouter(prefix="/api", tags=["internal"])
logger = logging.getLogger("compliance-internal")

SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "")




def _validate_proxy_url(url: str) -> None:
    """Reject a proxy URL that points at an internal target.

    Delegates to the shared ssrf_guard rather than re-implementing the
    blocklist. The local version this replaces swallowed socket.gaierror, so a
    name that failed to resolve was ACCEPTED — the opposite of the shared
    guard's fail-closed contract — and it never knew about the Alibaba/Oracle
    metadata IPs, CGNAT, multicast or the reserved blocks.

    It matters more here than at a normal call site: the route below exports
    this value into the process-wide HTTP_PROXY, and httpx runs trust_env=True,
    so it redirects EVERY outbound request the module makes afterwards —
    including ones another guard had carefully pinned to a resolved IP.
    """
    from src.ssrf_guard import validate_public_url

    try:
        # allow_private stays False: the previous implementation already
        # refused RFC1918 proxies, so this is not a behaviour change.
        validate_public_url(url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Proxy endpoint not allowed: {e}")



def _check_service_token(request: Request) -> None:
    if not SERVICE_TOKEN:
        raise HTTPException(status_code=503, detail="Service token not configured")
    token = request.headers.get("X-Service-Token", "")
    import secrets as _secrets
    if not token or not _secrets.compare_digest(token, SERVICE_TOKEN):
        raise HTTPException(status_code=403, detail="Invalid service token")


@router.get("/internal/measures")
async def internal_measures(request: Request, db: AsyncSession = Depends(get_db)):
    """Export all measures across all projects in normalized format for Pilot."""
    _check_service_token(request)

    result = await db.execute(
        select(ProjectMeasure, ProjectMeta.societe, Project.name.label("project_name"))
        .join(Project, ProjectMeasure.project_id == Project.id)
        .outerjoin(ProjectMeta, ProjectMeasure.project_id == ProjectMeta.project_id)
        .order_by(ProjectMeasure.project_id, ProjectMeasure.sort_order)
    )
    rows = result.all()

    measures = []
    for row in rows:
        m = row[0]  # ProjectMeasure
        societe = row[1]
        project_name = row[2]

        entity_name = societe or project_name or ""

        measures.append({
            "source_id": m.id,
            "entity_id": str(m.project_id),
            "entity_name": entity_name,
            # In Compliance the short measure label is stored in
            # ProjectMeasure.description and the long remediation plan
            # in ProjectMeasure.details — map accordingly to Pilot's
            # (title, description) transverse pair.
            "title": m.description or "",
            "description": m.details or "",
            "status": _normalize_status(m.statut),
            "assignee": m.responsable or "",
            "due_date": m.date_cible or "",
            "type": "",
            "progress_log": m.progress_log or [],
            "source_module": "compliance",
        })

    return measures


def _count_proofs_expired_10d(measures, proof_exp, today, threshold_days: int = 10) -> int:
    """Count completed measures whose proof has expired more than
    `threshold_days` days ago — the server-side equivalent of the frontend
    "preuve_manquante par expiration" effective status (Compliance_app.js
    _mesureEffectiveStatut), restricted to expirations older than the
    threshold.

    Args:
        measures: iterable of (project_id, preuves_ids list) for measures
            already filtered to a completed status.
        proof_exp: dict {(project_id, proof_id_str): date_expiration_str}
            ("YYYY-MM-DD" or "" when the proof never expires).
        today: ``datetime.date`` reference.
        threshold_days: minimum age, in days, of the most recent expiration.

    A measure counts iff it references at least one existing proof, none of
    its proofs is still valid (a proof with no expiration date or an
    expiration >= today keeps the measure valid), and the most recent
    expiration is strictly older than ``today - threshold_days``. Measures
    with no proof at all are excluded — there is no reference date to age.
    ISO "YYYY-MM-DD" strings sort chronologically, so plain string
    comparison is used.
    """
    from datetime import timedelta

    today_iso = today.isoformat()
    cutoff = (today - timedelta(days=threshold_days)).isoformat()
    count = 0
    for project_id, ids in measures:
        if not ids:
            continue
        exps = [
            (proof_exp[(project_id, str(prid))] or "").strip()
            for prid in ids
            if (project_id, str(prid)) in proof_exp
        ]
        if not exps:
            continue
        if any(e == "" or e >= today_iso for e in exps):
            continue
        if max(exps) < cutoff:
            count += 1
    return count


@router.get("/internal/evidences")
async def internal_evidences(request: Request, db: AsyncSession = Depends(get_db)):
    """Export proofs as first-class evidences for Pilot's registry (FEAT-08)."""
    _check_service_token(request)
    rows = (await db.execute(
        select(ProjectProof, ProjectMeta.societe, Project.name.label("project_name"))
        .join(Project, ProjectProof.project_id == Project.id)
        .outerjoin(ProjectMeta, ProjectProof.project_id == ProjectMeta.project_id)
        .order_by(ProjectProof.project_id, ProjectProof.sort_order)
    )).all()
    # Resolve linked objects (measures referencing the proof via preuves_ids).
    measures = (await db.execute(select(ProjectMeasure))).scalars().all()
    links: dict = {}
    for m in measures:
        for pid in (m.preuves_ids or []):
            links.setdefault((str(m.project_id), pid), []).append({
                "object_type": "measure", "object_id": m.id,
                "label": (m.description or "")[:80],
            })
    out = []
    for p, societe, project_name in rows:
        ev = {
            "id": p.id, "project_id": p.project_id, "label": p.label or "",
            "kind": p.kind or "link", "url": p.url or "", "owner": p.owner or "",
            "date_obtention": p.date_obtention or "", "date_expiration": p.date_expiration or "",
            "tags": p.tags or [], "entity_name": societe or project_name or "",
        }
        out.append(evidence_to_pilot_payload(
            ev, "compliance", linked=links.get((str(p.project_id), p.id), [])))
    return out


class InternalEvidenceUpdate(BaseModel):
    """Fields Pilot may edit on a compliance proof via the consolidated
    registry (FEAT-08 / BUG-23). ``project_id`` locates the proof (composite
    PK ``(project_id, id)``); the rest mirror the user-facing ProofUpdate."""
    project_id: str
    label: str | None = None
    url: str | None = None
    owner: str | None = None
    date_obtention: str | None = None
    date_expiration: str | None = None
    commentaire: str | None = None
    tags: list | None = None


_EVIDENCE_EDITABLE = (
    "label", "url", "owner", "date_obtention", "date_expiration",
    "commentaire", "tags",
)


@router.patch("/internal/evidences/{source_id}")
async def internal_update_evidence(
    source_id: str,
    body: InternalEvidenceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Service-token edit of a compliance proof from Pilot's registry.
    Compliance stays the owner/validator; Pilot fans an edit out to here and
    refreshes its cache from the returned payload."""
    _check_service_token(request)
    try:
        pid = uuid.UUID(str(body.project_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="invalid project_id")
    proof = await db.get(ProjectProof, (pid, source_id))
    if not proof:
        raise HTTPException(status_code=404, detail="evidence not found")

    fields = body.model_dump(exclude_unset=True, exclude={"project_id"})
    for k, v in fields.items():
        if k in _EVIDENCE_EDITABLE and v is not None:
            setattr(proof, k, v)
    proof.updated_at = datetime.now(timezone.utc)
    # Service-token edit of a compliance PROOF — always journaled (FEAT-30).
    from src.audit import log_write
    await log_write(db, None, request, "proof.writeback_update", actor="pilot",
                    entity_type="proof", entity_id=str(source_id))
    await bump_server_rev(db, proof.project_id)
    await db.commit()
    await db.refresh(proof)

    # Rebuild the same Pilot payload as GET /internal/evidences (with linked).
    societe = (await db.execute(
        select(ProjectMeta.societe).where(ProjectMeta.project_id == pid)
    )).scalar_one_or_none()
    pname = (await db.execute(
        select(Project.name).where(Project.id == pid)
    )).scalar_one_or_none()
    measures = (await db.execute(
        select(ProjectMeasure).where(ProjectMeasure.project_id == pid)
    )).scalars().all()
    linked = [
        {"object_type": "measure", "object_id": m.id, "label": (m.description or "")[:80]}
        for m in measures if source_id in (m.preuves_ids or [])
    ]
    ev = {
        "id": proof.id, "project_id": proof.project_id, "label": proof.label or "",
        "kind": proof.kind or "link", "url": proof.url or "", "owner": proof.owner or "",
        "date_obtention": proof.date_obtention or "", "date_expiration": proof.date_expiration or "",
        "tags": proof.tags or [], "entity_name": societe or pname or "",
    }
    return evidence_to_pilot_payload(ev, "compliance", linked=linked)


@router.get("/internal/stats")
async def internal_stats(request: Request, db: AsyncSession = Depends(get_db)):
    """Stats v2 envelope — see shared/docs/pilot-dashboard-contract.md"""
    _check_service_token(request)
    from datetime import date as _date

    total_projects = await db.scalar(select(func.count()).select_from(Project)) or 0

    # ── Measures (aggregated via SQL) ──
    measure_rows = (await db.execute(
        select(ProjectMeasure.statut, func.count()).group_by(ProjectMeasure.statut)
    )).all()
    measure_counts = {s: c for s, c in measure_rows}
    total_measures = sum(measure_counts.values())
    completed = sum(measure_counts.get(s, 0) for s in ("completed", "termine", "Terminé"))
    in_progress = sum(measure_counts.get(s, 0) for s in ("in_progress", "en_cours", "En cours"))
    planned = total_measures - completed - in_progress

    today = _date.today().isoformat()
    overdue = (await db.scalar(
        select(func.count()).select_from(ProjectMeasure)
        .where(ProjectMeasure.date_cible < today)
        .where(ProjectMeasure.date_cible != "")
        .where(ProjectMeasure.date_cible.isnot(None))
        .where(ProjectMeasure.statut.notin_(["completed", "termine", "Terminé"]))
    )) or 0
    progress_pct = round(completed / total_measures * 100) if total_measures else 0

    # ── Controls by framework (stacked bar) ──
    # Only ACTIVE referentials count. Deselecting a referential in the UI keeps
    # its controls in the DB (so re-enabling restores the saved work) but they
    # must no longer be counted in the dashboard / posture. A control is
    # included iff its framework is in its project's referentiels_actifs. A
    # project with no ProjectSettings row (legacy / blob import) falls back to
    # counting all its controls.
    settings_rows = (await db.execute(
        select(ProjectSettings.project_id, ProjectSettings.referentiels_actifs)
    )).all()
    active_by_project = {pid: set(ra or []) for pid, ra in settings_rows}
    controls_result = await db.execute(
        select(ProjectControl.project_id, ProjectControl.framework_id,
               ProjectControl.conformite, ProjectControl.applicable)
    )
    per_framework = {}  # framework_id -> {conforme, partiel, non, total}
    total_controls = 0
    for (pid, fw, conf, appl) in controls_result.all():
        if appl == "non":
            continue
        active = active_by_project.get(pid)
        if active is not None and fw not in active:
            continue  # referential deselected for this project — do not count
        total_controls += 1
        fw_key = fw or "Autre"
        if fw_key not in per_framework:
            per_framework[fw_key] = {"conforme": 0, "partiel": 0, "non": 0, "total": 0}
        per_framework[fw_key]["total"] += 1
        try:
            c = int(conf) if conf not in ("", None) else None
        except (ValueError, TypeError):
            c = None
        if c is not None:
            if c >= 80:
                per_framework[fw_key]["conforme"] += 1
            elif c >= 30:
                per_framework[fw_key]["partiel"] += 1
            else:
                per_framework[fw_key]["non"] += 1
        else:
            per_framework[fw_key]["non"] += 1

    buckets = []
    for fw_key, d in sorted(per_framework.items(), key=lambda kv: -kv[1]["total"])[:6]:
        pct = round(d["conforme"] / d["total"] * 100) if d["total"] > 0 else 0
        color = "green" if pct >= 80 else "orange" if pct >= 50 else "red"
        buckets.append({
            "label": fw_key.upper(),
            "value": pct,
            "color": color,
        })
    scale = 100

    # ── Posture score: % of applicable controls that are conforme ──
    # Single, unified definition of the conformity rate — identical to the one
    # the user sees in the app (covered controls / applicable controls). We no
    # longer average the per-control conformite (0-100) field, to avoid two
    # competing "rates" (spec reconciliation, decision A).
    total_conforme = sum(d["conforme"] for d in per_framework.values())
    posture_score = round(total_conforme / total_controls * 100) if total_controls > 0 else 100

    # ── Proofs expired > 10 days on completed measures ──
    cm_rows = (await db.execute(
        select(ProjectMeasure.project_id, ProjectMeasure.preuves_ids)
        .where(ProjectMeasure.statut.in_(["completed", "termine", "Terminé"]))
    )).all()
    proof_rows = (await db.execute(
        select(ProjectProof.project_id, ProjectProof.id, ProjectProof.date_expiration)
    )).all()
    proof_exp = {(pid, str(prid)): (exp or "") for pid, prid, exp in proof_rows}
    proofs_expired_10d = _count_proofs_expired_10d(
        [(pid, ids or []) for pid, ids in cm_rows], proof_exp, _date.today()
    )

    # ── Alerts ──
    alerts = []
    if proofs_expired_10d > 0:
        alerts.append({
            "level": "critical" if proofs_expired_10d >= 5 else "warning",
            "text": f"{proofs_expired_10d} preuve(s) expirée(s) depuis plus de 10 jours",
            "url": "/compliance/",
        })
    if overdue > 0:
        alerts.append({
            "level": "critical" if overdue >= 5 else "warning",
            "text": f"{overdue} mesure(s) en retard",
            "url": "/compliance/",
        })
    # Frameworks with <50% compliance
    weak = [fw for fw, d in per_framework.items() if d["total"] >= 5 and (d["conforme"] / d["total"]) < 0.5]
    if weak:
        alerts.append({
            "level": "warning",
            "text": f"{len(weak)} référentiel(s) en dessous de 50 % de conformité",
            "url": "/compliance/",
        })

    return {
        "entity_count": total_projects,
        "entity_label": "Projets de conformité",
        "measures": {
            "total": total_measures,
            "completed": completed,
            "in_progress": in_progress,
            "planned": planned,
            "overdue": overdue,
            "progress_pct": progress_pct,
            "proofs_expired_10d": proofs_expired_10d,
        },
        "posture": {
            "score": posture_score,
            "score_label": _posture_label(posture_score),
        },
        "breakdown": {
            "type": "bar",
            "data": {
                "buckets": buckets,
                "scale": scale,
                "unit": "%",
            },
        },
        "top_items": [],
        "alerts": alerts,
        # Legacy
        "total_projects": total_projects,
        "total_measures": total_measures,
        "measures_progress": progress_pct,
        "total_controls": total_controls,
        "compliance_rate": posture_score,
    }


def _posture_label(score: int) -> str:
    if score is None:
        return ""
    if score < 40:
        return "Faible"
    if score < 60:
        return "Modéré"
    if score < 80:
        return "Bon"
    return "Excellent"


@router.get("/internal/activity")
async def internal_activity(request: Request, db: AsyncSession = Depends(get_db)):
    _check_service_token(request)
    events = []
    projects_result = await db.execute(
        select(Project).order_by(Project.updated_at.desc()).limit(10)
    )
    for p in projects_result.scalars().all():
        events.append({
            "date": (p.updated_at or p.created_at).isoformat(),
            "module": "compliance",
            "type": "project_updated",
            "label": f"Projet « {(p.name or '')[:50]} » mis à jour",
            "url": "/compliance/",
        })
    return events[:10]


async def bump_server_rev(db: AsyncSession, project_id) -> None:
    """FEAT-33 — mark a server-initiated write so stale tabs cannot blob-PUT
    over it (see routes/projects.update_project)."""
    from sqlalchemy import update as _upd
    await db.execute(_upd(Project).where(Project.id == project_id).values(server_rev=Project.server_rev + 1))


@router.patch("/internal/measures/{source_id}")
async def patch_measure(
    source_id: str,
    request: Request,
    entity_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Update a measure from Pilot (write-back).

    ProjectMeasure.id (e.g. "M-010") is unique only within a project, so
    Pilot passes entity_id (= project_id) to disambiguate; without it a
    shared id would match several rows.
    """
    _check_service_token(request)
    body = await request.json()

    query = select(ProjectMeasure).where(ProjectMeasure.id == source_id)
    if entity_id:
        query = query.where(ProjectMeasure.project_id == entity_id)
    result = await db.execute(query)
    measure = result.scalar_one_or_none()
    if not measure:
        raise HTTPException(status_code=404, detail="Measure not found")

    # Transverse Pilot ↔ Compliance mapping: title → description,
    # description → details (see GET endpoint for the same convention).
    if "title" in body:
        measure.description = body["title"]
    if "description" in body:
        measure.details = body["description"]
    if "status" in body:
        measure.statut = _denormalize_status(body["status"])
    if "assignee" in body:
        measure.responsable = body["assignee"]
    if "due_date" in body:
        measure.date_cible = body["due_date"]
    if "progress_log" in body:
        measure.progress_log = body["progress_log"]

    await bump_server_rev(db, measure.project_id)
    # Pilot write-back is a business write — journaled (FEAT-30 review).
    from src.audit import log_write
    await log_write(db, None, request, "measure.writeback_update", actor="pilot",
                    entity_type="measure", entity_id=str(source_id))
    await db.commit()
    import asyncio
    from src.pilot_notify import notify_pilot_measure
    asyncio.ensure_future(notify_pilot_measure({
        "source_id": source_id,
        "title": measure.description or "",
        "description": measure.details or "",
        "status": _normalize_status(measure.statut or ""),
        "assignee": measure.responsable or "",
        "due_date": measure.date_cible or "",
    }))
    return {"ok": True}


@router.delete("/internal/measures/{source_id}", status_code=204)
async def delete_measure_internal(source_id: str, request: Request,
                                  entity_id: str | None = None,
                                  db: AsyncSession = Depends(get_db)):
    """Delete a measure via Pilot write-back. Measure ids are unique only
    within a project, so Pilot passes entity_id (= project_id) to target the
    exact row (mirrors patch_measure)."""
    _check_service_token(request)
    query = select(ProjectMeasure).where(ProjectMeasure.id == source_id)
    if entity_id:
        query = query.where(ProjectMeasure.project_id == entity_id)
    measure = (await db.execute(query)).scalar_one_or_none()
    if not measure:
        raise HTTPException(status_code=404, detail="Measure not found")
    await bump_server_rev(db, measure.project_id)
    await db.delete(measure)
    # Pilot write-back is a business write — journaled (FEAT-30 review).
    from src.audit import log_write
    await log_write(db, None, request, "measure.writeback_delete", actor="pilot",
                    entity_type="measure", entity_id=str(source_id))
    await db.commit()


def _normalize_status(s: str) -> str:
    mapping = {
        "termine": "completed", "Termine": "completed", "Terminé": "completed", "completed": "completed",
        "en_cours": "in_progress", "En cours": "in_progress", "en cours": "in_progress",
        "planifie": "planned", "Planifie": "planned", "Planifié": "planned",
        "non_demarre": "not_started", "Non demarre": "not_started", "Non démarré": "not_started",
    }
    return mapping.get(s, s)


def _denormalize_status(s: str) -> str:
    mapping = {
        "completed": "Terminé", "in_progress": "En cours",
        "planned": "Planifié", "not_started": "Non démarré",
    }
    return mapping.get(s, s)


# ── Audit trail for Pilot-pushed config changes (SEC hardening) ──
# set_proxy / set_custom_llm are service-token endpoints (no user), yet they
# change egress routing and the LLM the module talks to. Record the source
# and what changed so a rogue/erroneous push is traceable. Secrets are NEVER
# logged: proxy URLs are stripped of any user:pass and the LLM key is reduced
# to a boolean. Rotate credentials after any unexpected change (runbook).
def _redact_url(url: str) -> str:
    if not url:
        return "(empty)"
    try:
        p = urlparse(url)
        host = p.hostname or ""
        if p.port:
            host += f":{p.port}"
        return f"{p.scheme}://{host}" if host else "(set)"
    except Exception:
        return "(set)"


def _audit_internal_change(request: Request, action: str, details: dict) -> None:
    ip = request.client.host if request and request.client else "?"
    rendered = " ".join(f"{k}={v}" for k, v in details.items())
    logger.warning("internal config change: action=%s src=%s %s", action, ip, rendered)


@router.put("/internal/proxy")
async def set_proxy(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive proxy config from Pilot."""
    _check_service_token(request)
    body = await request.json()
    for key in ("http_proxy", "https_proxy"):
        if key in body:
            _validate_proxy_url(body[key])
    if "http_proxy" in body:
        os.environ["HTTP_PROXY"] = body["http_proxy"]
        os.environ["http_proxy"] = body["http_proxy"]
    if "https_proxy" in body:
        os.environ["HTTPS_PROXY"] = body["https_proxy"]
        os.environ["https_proxy"] = body["https_proxy"]
    if "no_proxy" in body:
        os.environ["NO_PROXY"] = body["no_proxy"]
        os.environ["no_proxy"] = body["no_proxy"]
    changed = {k: _redact_url(body[k]) for k in ("http_proxy", "https_proxy") if k in body}
    if "no_proxy" in body:
        changed["no_proxy"] = body["no_proxy"]
    if changed:
        _audit_internal_change(request, "proxy.set", changed)
    return {"ok": True}


# In-memory custom LLM config (pushed by Pilot)
_custom_llm = {"endpoint": "", "model": "", "key": "", "label": "Custom LLM"}

@router.put("/internal/ai-custom")
async def set_custom_llm(request: Request):
    """Receive custom LLM config from Pilot (in-memory only, no DB persistence for key)."""
    _check_service_token(request)
    global _custom_llm
    body = await request.json()
    _custom_llm = {
        "endpoint": body.get("endpoint", ""),
        "model": body.get("model", ""),
        "key": body.get("key", ""),
        "label": body.get("label", "Custom LLM"),
    }
    _audit_internal_change(request, "ai_custom.set", {
        "endpoint": _redact_url(_custom_llm["endpoint"]) if _custom_llm["endpoint"] else "(cleared)",
        "model": _custom_llm["model"] or "(none)",
        "label": _custom_llm["label"],
        "key_set": bool(_custom_llm["key"]),
    })
    return {"ok": True}


@router.post("/internal/sync-user")
async def sync_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive user ai_enabled update from Pilot."""
    _check_service_token(request)
    body = await request.json()
    email = body.get("email", "")
    if not email:
        return {"ok": False, "error": "no email"}

    from src.models import User as LocalUser
    result = await db.execute(select(LocalUser).where(LocalUser.email == email))
    user = result.scalar_one_or_none()
    if user:
        changed = {}
        if "ai_enabled" in body and user.ai_enabled != body["ai_enabled"]:
            user.ai_enabled = body["ai_enabled"]
            changed["ai_enabled"] = bool(body["ai_enabled"])
        if "name" in body and body["name"] and user.name != body["name"]:
            user.name = body["name"]
            changed["name"] = True
        if changed:
            # Journal only when something actually changed (FEAT-30 P3).
            from src.audit import log_write
            await log_write(db, None, request, "user.sync", actor="pilot",
                            entity_type="user", entity_id=email, details=changed)
        await db.commit()
        return {"ok": True, "updated": True}
    return {"ok": True, "updated": False, "reason": "user not found in module"}



@router.post("/internal/delete-user")
async def delete_user(request: Request, db: AsyncSession = Depends(get_db)):
    """De-provision a user deleted in Pilot.

    Pilot owns the account directory, but each module keeps its own `users`
    row (that is where the module role lives). Without this route a deleted
    person kept a role here for ever: `/internal/sync-user` only creates and
    updates, so nothing ever removed anything.

    Objects the person owned are KEPT — `owner_id` is ON DELETE SET NULL —
    only the account row and the role go.
    """
    _check_service_token(request)
    from sqlalchemy import func as _func

    from src.models import User as LocalUser
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="email required")
    target = (await db.execute(
        select(LocalUser).where(_func.lower(LocalUser.email) == email)
    )).scalar_one_or_none()
    if target is None:
        return {"ok": True, "deleted": False}
    from src.audit import log_write
    await log_write(db, None, request, "user.delete", actor="pilot",
                    entity_type="user", entity_id=email,
                    details={"role": target.role or ""})
    await db.delete(target)
    await db.commit()
    return {"ok": True, "deleted": True}

@router.get("/internal/export")
async def internal_export_list(request: Request, db: AsyncSession = Depends(get_db)):
    """List all projects for Pilot backup."""
    _check_service_token(request)
    result = await db.execute(select(Project).order_by(Project.updated_at.desc()))
    projects = result.scalars().all()
    return [{"id": str(p.id), "name": p.name or "", "organization": p.organization or "", "updated_at": str(p.updated_at)} for p in projects]


@router.get("/internal/export/{item_id}")
async def internal_export_item(item_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Export full project data for Pilot backup."""
    _check_service_token(request)
    from src.routes.projects import _reconstruct_data
    project = await db.get(Project, item_id)
    if not project:
        raise HTTPException(status_code=404, detail="Not found")
    data = await _reconstruct_data(db, project.id)
    return {"id": str(project.id), "name": project.name, "organization": project.organization, "owner_id": str(project.owner_id) if project.owner_id else None, "shared_with": project.shared_with or [], "data": data}


@router.put("/internal/restore/{item_id}")
async def internal_restore_item(item_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Restore project data from Pilot backup."""
    _check_service_token(request)
    # Single-project module (CHANTIER_PROJET_UNIQUE): a restore must never
    # resurrect a non-canonical project id (FEAT-30 P1bis — pre-collapse
    # backups carry the old random id). Repoint onto the canonical project.
    from src.default_project import DEFAULT_PROJECT_ID_STR
    repointed_from = None
    if item_id != DEFAULT_PROJECT_ID_STR:
        repointed_from = item_id
        item_id = DEFAULT_PROJECT_ID_STR
    body = await request.json()
    data = body.get("data", {})
    # FEAT-36 — a restored backup can carry an old blob: migrate it too.
    from src.schema_migrations import FutureRevError, migrate_blob
    try:
        data = migrate_blob("compliance", data)
    except FutureRevError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    name = body.get("name", "")
    organization = body.get("organization", "")

    from src.routes.projects import _delete_children, _decompose_data

    project = await db.get(Project, item_id)
    if project:
        project.name = name or project.name
        project.organization = organization or project.organization
        from src.backup_common import restore_root_fields
        from src.models import User as _RootUser
        await restore_root_fields(db, project, body, _RootUser)
        from src.audit import log_write
        await log_write(db, None, request, "project.restore", actor="pilot",
                        entity_type="project", entity_id=str(project.id), target=project.name or "")
        await _delete_children(db, project.id)
        await _decompose_data(db, project.id, data)
        await bump_server_rev(db, project.id)
        await db.commit()
        return {"ok": True, "action": "updated", "repointed_from": repointed_from}
    else:
        project = Project(id=item_id, name=name, organization=organization)
        db.add(project)
        await db.flush()
        from src.backup_common import restore_root_fields
        from src.models import User as _RootUser
        await restore_root_fields(db, project, body, _RootUser)
        from src.audit import log_write
        await log_write(db, None, request, "project.restore", actor="pilot",
                        entity_type="project", entity_id=str(project.id), target=project.name or "")
        await _decompose_data(db, project.id, data)
        await db.commit()
        return {"ok": True, "action": "created", "repointed_from": repointed_from}


# ── Recovery reads (FEAT-30 phase 2) — state at instant T ───────────────
# The agent's scratch instance holds the database as it was at T. These
# endpoints re-run the exact same export code against it, so Pilot's diff
# compares two payloads of identical shape. The list call also brings the
# scratch schema to head (alembic) when T predates a migration.

@router.get("/internal/export-recovery")
async def internal_export_recovery_list(request: Request):
    _check_service_token(request)
    from src.backup_common import recovery_session, upgrade_recovery_schema
    upgrade_recovery_schema()
    async with recovery_session() as rdb:
        return await internal_export_list(request, rdb)


@router.get("/internal/export-recovery/{item_id}")
async def internal_export_recovery_item(item_id: str, request: Request):
    _check_service_token(request)
    from src.backup_common import recovery_session
    async with recovery_session() as rdb:
        return await internal_export_item(item_id, request, rdb)


# ── Journal reads (FEAT-30 phase 2) — event-anchored restore ────────────
# Pilot's restore UI shows WHO changed WHAT and WHEN so the admin picks an
# event instead of guessing a clock time. Modules whose audit_log predates
# the entity columns (surface/appsec/watch) still serve time+actor+action.

@router.get("/internal/journal")
async def internal_journal(request: Request, entity_id: str = "", limit: int = 30,
                           db: AsyncSession = Depends(get_db)):
    _check_service_token(request)
    from src.models import AuditLog
    cols = {c.name for c in AuditLog.__table__.columns}
    q = select(AuditLog).order_by(AuditLog.logged_at.desc()).limit(min(max(limit, 1), 100))
    if entity_id and "entity_id" in cols:
        q = q.where(AuditLog.entity_id == entity_id)
    rows = (await db.execute(q)).scalars().all()
    return [{
        "logged_at": r.logged_at.isoformat() if r.logged_at else None,
        "user_email": r.user_email or "",
        "action": r.action or "",
        "target": r.target or "",
        "entity_type": getattr(r, "entity_type", "") or "",
        "entity_id": getattr(r, "entity_id", "") or "",
        "details": (r.details or "")[:300],
    } for r in rows]


# SMTP config pushed by Pilot at PUT /internal/smtp, read by src/mailer.py
# through src.routes.internal._smtp_config. Mirrored to app_settings
# (rows smtp.<field>) so it survives a rebuild; hydrated at startup.
_smtp_config: dict = {}
_SMTP_FIELDS = ("host", "port", "user", "password", "from_addr", "tls")


async def _hydrate_smtp_from_db() -> None:
    """Prime _smtp_config from app_settings rows smtp.* (called at startup)."""
    from src.database import async_session
    from src.models import AppSettings
    try:
        async with async_session() as db:
            rows = (await db.execute(
                select(AppSettings).where(AppSettings.key.like("smtp.%"))
            )).scalars().all()
        loaded = {}
        for row in rows:
            field = row.key.split(".", 1)[1]
            if field in _SMTP_FIELDS and row.value not in (None, ""):
                loaded[field] = decrypt_setting(row.value) if field == "password" else row.value
        if loaded:
            _smtp_config.clear()
            _smtp_config.update(loaded)
            logger.info("smtp config hydrated from app_settings (host=%s)", loaded.get("host", ""))
    except Exception as exc:  # defensive: never block startup
        logger.warning("smtp hydrate skipped: %s", exc)


@router.put("/internal/smtp")
async def set_smtp(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive SMTP config pushed by Pilot. Consumed by src/mailer.py.

    Persists to app_settings (rows smtp.<field>) so the config survives a
    rebuild and is available on the next startup without a Pilot re-push.
    """
    _check_service_token(request)
    from src.models import AppSettings
    body = await request.json()
    _smtp_config.clear()
    incoming: dict = {}
    for k in _SMTP_FIELDS:
        if k in body and body[k] not in (None, ""):
            _smtp_config[k] = str(body[k])
            incoming[k] = str(body[k])
    existing = (await db.execute(
        select(AppSettings).where(AppSettings.key.like("smtp.%"))
    )).scalars().all()
    existing_by_key = {row.key: row for row in existing}
    for field in _SMTP_FIELDS:
        key = f"smtp.{field}"
        row = existing_by_key.get(key)
        if field in incoming:
            stored = encrypt_setting_or_plain(incoming[field]) if field == "password" else incoming[field]
            if row is None:
                db.add(AppSettings(key=key, value=stored))
            else:
                row.value = stored
        elif row is not None:
            await db.delete(row)
    await db.commit()
    logger.info("smtp config received from pilot (host=%s)", _smtp_config.get("host", ""))
    return {"ok": True}


@router.post("/internal/proof-notify-run")
async def proof_notify_run(request: Request, force: bool = False,
                           db: AsyncSession = Depends(get_db)):
    """Trigger an immediate proof-expiry check + email digest (bypasses the
    daily cadence gate; ?force=true also bypasses the anti-spam gate).
    Service-token protected — used by tests and manual on-demand sends."""
    _check_service_token(request)
    from src.proof_notifier import run_now
    result = await run_now(db, force=force)
    # Journal only when the digest actually went out or measures were
    # created — same signal/noise rule as the scheduler tick.
    if (result or {}).get("sent") or (result or {}).get("measures_created"):
        from src.audit import log_write
        await log_write(db, None, None, "proof.expiry_digest", actor="pilot",
                        entity_type="proof", details=result)
    await db.commit()
    return result
