from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone
from typing import Optional

import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import ADMIN_MODULE_ROLES, VIEWER_MODULE_ROLES, auth_enabled, get_current_user, perms_for_module_role
from src.database import get_db
from src.models import (
    Project,
    ProjectControl,
    ProjectMeasure,
    ProjectMeta,
    ProjectProof,
    ProjectSettings,
    User,
)
from src.schemas import (
    ProjectCreate,
    ProjectListItem,
    ProjectResponse,
    ProjectStats,
    ProjectUpdate,
    ShareRequest,
)
from src.upload_common import read_json_upload

router = APIRouter(prefix="/api/projects", tags=["projects"])


# ── Helpers ────────────────────────────────────────────────────────

def _user_permissions(project: Project, user: Optional[User]) -> list[str]:
    if not auth_enabled() or user is None:
        return ["read", "edit", "delete", "share"]
    if user.role == "admin":
        return ["read", "edit", "delete", "share"]
    if project.owner_id == user.id:
        return ["read", "edit", "delete", "share"]
    if project.owner_id is None:
        # Unowned resource: rights follow the module role. Admins get full,
        # viewers stay read-only, everyone else read+edit — previously an
        # unowned project was a full-access free-for-all.
        mrole = getattr(user, "_module_role", "")
        if mrole in ADMIN_MODULE_ROLES:
            return ["read", "edit", "delete", "share"]
        if mrole in VIEWER_MODULE_ROLES:
            return ["read"]
        return ["read", "edit"]
    for share in (project.shared_with or []):
        if share.get("user_id") == str(user.id):
            return share.get("permissions", ["read"])
    # Fallback: if the user has a module role (they passed get_current_user),
    # grant access based on that role via the shared ladder. Without this,
    # contributors not explicitly in shared_with cannot see any project.
    return perms_for_module_role(getattr(user, "_module_role", ""))


def _can(perm: str, project: Project, user: Optional[User]) -> bool:
    return perm in _user_permissions(project, user)


# ── Reconstruct D object from relational tables ───────────────────

def _control_to_dict(c: ProjectControl) -> dict:
    conformite_val = c.conformite or ""
    try:
        conformite_val = int(conformite_val)
    except (ValueError, TypeError):
        pass
    return {
        "ref": c.ref or "",
        "thematique": c.thematique or "",
        "mesure": c.mesure or "",
        "applicable": c.applicable or "",
        "conformite": conformite_val,
        "ecart": c.ecart or "",
        "mesures_prevues": c.mesures_prevues or "",
        "mesures_ids": c.mesures_ids or [],
        "thematique_en": c.thematique_en or "",
        "mesure_en": c.mesure_en or "",
    }


def _measure_to_dict(m: ProjectMeasure) -> dict:
    return {
        "id": m.id,
        "description": m.description or "",
        "details": m.details or "",
        "statut": m.statut or "",
        "date_cible": m.date_cible or "",
        "responsable": m.responsable or "",
        "recurrence": m.recurrence or "",
        "dernier_controle": m.dernier_controle or "",
        "preuves_ids": m.preuves_ids or [],
        # FEAT-12 progress journal — written by Pilot; losing it on every
        # restore/blob PUT was FEAT-30 audit finding P1.7.
        "progress_log": m.progress_log or [],
        # Dedup key of auto-created proof-expiry measures — round-tripped so
        # blob saves don't strip it (else the daily tick would re-create).
        "auto_key": m.auto_key or None,
    }


def _proof_to_dict(p: ProjectProof) -> dict:
    return {
        "id": p.id,
        "label": p.label or "",
        "url": p.url or "",
        "date_obtention": p.date_obtention or "",
        "date_expiration": p.date_expiration or "",
        "commentaire": p.commentaire or "",
        # FEAT-08 evidence fields
        "kind": p.kind or "link",
        "file_ref": p.file_ref or "",
        "owner": p.owner or "",
        "tags": p.tags or [],
    }


async def _reconstruct_data(db: AsyncSession, project_id: uuid.UUID) -> dict:
    """Reconstruct the D object from relational tables."""
    meta_result = await db.execute(
        select(ProjectMeta).where(ProjectMeta.project_id == project_id)
    )
    meta = meta_result.scalar_one_or_none()

    settings_result = await db.execute(
        select(ProjectSettings).where(ProjectSettings.project_id == project_id)
    )
    settings = settings_result.scalar_one_or_none()

    controls_result = await db.execute(
        select(ProjectControl)
        .where(ProjectControl.project_id == project_id)
        .order_by(ProjectControl.sort_order)
    )
    controls = controls_result.scalars().all()

    measures_result = await db.execute(
        select(ProjectMeasure)
        .where(ProjectMeasure.project_id == project_id)
        .order_by(ProjectMeasure.sort_order)
    )
    measures = measures_result.scalars().all()

    proofs_result = await db.execute(
        select(ProjectProof)
        .where(ProjectProof.project_id == project_id)
        .order_by(ProjectProof.sort_order)
    )
    proofs = proofs_result.scalars().all()

    # Group controls by framework_id -> referentiels dict
    referentiels: dict[str, list] = {}
    for c in controls:
        referentiels.setdefault(c.framework_id, []).append(_control_to_dict(c))

    data = {
        "meta": {
            "societe": meta.societe or "" if meta else "",
            "date_evaluation": meta.date_evaluation or "" if meta else "",
            "evaluateur": meta.evaluateur or "" if meta else "",
            "perimetre": meta.perimetre or "" if meta else "",
            "commentaires": meta.commentaires or "" if meta else "",
        },
        "referentiels_actifs": settings.referentiels_actifs or [] if settings else [],
        "referentiels": referentiels,
        "mesures": [_measure_to_dict(m) for m in measures],
        "preuves": [_proof_to_dict(p) for p in proofs],
    }
    return data


# ── Decompose D object into relational tables ─────────────────────

async def _delete_children(db: AsyncSession, project_id: uuid.UUID):
    """Delete all child rows for a project."""
    await db.execute(delete(ProjectProof).where(ProjectProof.project_id == project_id))
    await db.execute(delete(ProjectMeasure).where(ProjectMeasure.project_id == project_id))
    await db.execute(delete(ProjectControl).where(ProjectControl.project_id == project_id))
    await db.execute(delete(ProjectSettings).where(ProjectSettings.project_id == project_id))
    await db.execute(delete(ProjectMeta).where(ProjectMeta.project_id == project_id))


async def _decompose_data(db: AsyncSession, project_id: uuid.UUID, data: dict):
    """Decompose a D object into relational child rows."""
    # Meta
    meta = data.get("meta") or {}
    db.add(ProjectMeta(
        project_id=project_id,
        societe=meta.get("societe", ""),
        date_evaluation=meta.get("date_evaluation", ""),
        evaluateur=meta.get("evaluateur", ""),
        perimetre=meta.get("perimetre", ""),
        commentaires=meta.get("commentaires", ""),
    ))

    # Settings
    ref_actifs = data.get("referentiels_actifs") or []
    db.add(ProjectSettings(
        project_id=project_id,
        referentiels_actifs=ref_actifs,
    ))

    # Controls (flatten referentiels dict)
    referentiels = data.get("referentiels") or {}
    sort_idx = 0
    for fw_id, controls in referentiels.items():
        if not isinstance(controls, list):
            continue
        for c in controls:
            db.add(ProjectControl(
                project_id=project_id,
                sort_order=sort_idx,
                framework_id=fw_id,
                ref=str(c.get("ref", "")),
                thematique=c.get("thematique", ""),
                mesure=c.get("mesure", ""),
                applicable=c.get("applicable", ""),
                conformite=str(c.get("conformite", "")) if c.get("conformite") is not None else "",
                ecart=c.get("ecart", ""),
                mesures_prevues=c.get("mesures_prevues", ""),
                mesures_ids=c.get("mesures_ids", []),
                thematique_en=c.get("thematique_en", ""),
                mesure_en=c.get("mesure_en", ""),
            ))
            sort_idx += 1

    # Measures
    for i, m in enumerate(data.get("mesures") or []):
        db.add(ProjectMeasure(
            project_id=project_id,
            id=m.get("id", ""),
            sort_order=i,
            description=m.get("description", ""),
            details=m.get("details", ""),
            statut=m.get("statut", ""),
            date_cible=m.get("date_cible", ""),
            responsable=m.get("responsable", ""),
            recurrence=m.get("recurrence", ""),
            dernier_controle=m.get("dernier_controle", ""),
            preuves_ids=m.get("preuves_ids", []),
            progress_log=m.get("progress_log") or [],
            auto_key=m.get("auto_key") or None,
        ))

    # Proofs (FEAT-08: now carry the richer evidence fields)
    for i, p in enumerate(data.get("preuves") or []):
        db.add(ProjectProof(
            project_id=project_id,
            id=p.get("id", ""),
            sort_order=i,
            label=p.get("label", ""),
            url=p.get("url", ""),
            date_obtention=p.get("date_obtention", ""),
            date_expiration=p.get("date_expiration", ""),
            commentaire=p.get("commentaire", ""),
            kind=p.get("kind", "link") or "link",
            file_ref=p.get("file_ref", ""),
            owner=p.get("owner", ""),
            tags=p.get("tags", []) or [],
        ))


# ── Routes ─────────────────────────────────────────────────────────

@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(
        name=body.name,
        organization=body.organization,
        owner_id=user.id if user else None,
    )
    db.add(project)
    await db.flush()

    if body.data:
        await _decompose_data(db, project.id, body.data)

    await db.commit()
    await db.refresh(project)

    data = await _reconstruct_data(db, project.id)
    return _project_response(project, data)


@router.get("", response_model=list[ProjectListItem])
async def list_projects(
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Single-project modules boot on list[0]: the canonical project must
    # come first even if a stray (e.g. resurrected by an old restore)
    # was updated more recently (FEAT-30 P1bis).
    from src.default_project import DEFAULT_PROJECT_ID
    result = await db.execute(
        select(Project).order_by(
            (Project.id == DEFAULT_PROJECT_ID).desc(),
            Project.updated_at.desc())
    )
    projects = result.scalars().all()
    if not auth_enabled() or user is None or user.role == "admin":
        return projects
    return [p for p in projects if _can("read", p, user)]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can("read", project, user):
        raise HTTPException(status_code=403, detail="Access denied")

    data = await _reconstruct_data(db, project.id)
    return _project_response(project, data)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # FEAT-33 stale-tab guard: refuse the whole-blob overwrite when a
    # server-initiated writer bumped server_rev since this tab loaded.
    if body.expected_server_rev is not None and (project.server_rev or 0) > body.expected_server_rev:
        raise HTTPException(status_code=409,
                            detail="Données modifiées côté serveur depuis le chargement (Pilot/scheduler) — rechargez avant une sauvegarde globale.")
    if not _can("edit", project, user):
        raise HTTPException(status_code=403, detail="Access denied")

    if body.name is not None:
        project.name = body.name
    if body.organization is not None:
        project.organization = body.organization

    if body.data is not None:
        await _delete_children(db, project.id)
        await _decompose_data(db, project.id, copy.deepcopy(body.data))

    project.updated_at = datetime.now(timezone.utc)
    from src.audit import log_write
    await log_write(db, user, None,
                    "project.blob_put" if body.data is not None else "project.update",
                    entity_type="project", entity_id=str(project.id), target=project.name or "")
    await db.commit()
    await db.refresh(project)

    data = await _reconstruct_data(db, project.id)
    return _project_response(project, data)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can("delete", project, user):
        raise HTTPException(status_code=403, detail="Access denied")
    from src.audit import log_write
    await log_write(db, user, None, "project.delete",
                    entity_type="project", entity_id=str(project.id), target=project.name or "")
    await db.delete(project)
    await db.commit()


@router.post("/{project_id}/duplicate", response_model=ProjectResponse, status_code=201)
async def duplicate_project(
    project_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    original = await db.get(Project, project_id)
    if not original:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can("read", original, user):
        raise HTTPException(status_code=403, detail="Access denied")

    original_data = await _reconstruct_data(db, original.id)

    duplicate = Project(
        name=original.name + " (copy)",
        organization=original.organization,
        owner_id=user.id if user else None,
    )
    db.add(duplicate)
    await db.flush()

    await _decompose_data(db, duplicate.id, original_data)
    await db.commit()
    await db.refresh(duplicate)

    data = await _reconstruct_data(db, duplicate.id)
    return _project_response(duplicate, data)


@router.post("/import", response_model=ProjectResponse, status_code=201)
async def import_project(
    file: UploadFile,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import json

    content = await read_json_upload(file, 10 * 1024 * 1024)
    try:
        data = json.loads(content)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    # FEAT-36 — refuse future revs, normalize + replay schema migrations.
    from src.schema_migrations import FutureRevError, migrate_blob
    try:
        data = migrate_blob("compliance", data)
    except FutureRevError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    name = ""
    if isinstance(data, dict):
        meta = data.get("meta", {})
        name = meta.get("societe", "") if isinstance(meta, dict) else ""

    project = Project(
        name=name,
        owner_id=user.id if user else None,
    )
    db.add(project)
    await db.flush()

    if isinstance(data, dict):
        await _decompose_data(db, project.id, data)

    from src.audit import log_write
    await log_write(db, user, None, "project.import",
                    entity_type="project", entity_id=str(project.id), target=project.name or "")
    await db.commit()
    await db.refresh(project)

    data_out = await _reconstruct_data(db, project.id)
    return _project_response(project, data_out)


@router.get("/{project_id}/export")
async def export_project(
    project_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can("read", project, user):
        raise HTTPException(status_code=403, detail="Access denied")

    data = await _reconstruct_data(db, project.id)
    filename = re.sub(r'[^a-zA-Z0-9_-]', '_', project.name or "export") + "_Compliance.json"
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{project_id}/recalculate", response_model=ProjectResponse)
async def recalculate_project(
    project_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can("edit", project, user):
        raise HTTPException(status_code=403, detail="Access denied")

    # No server-side recalculations for compliance (yet)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)

    data = await _reconstruct_data(db, project.id)
    return _project_response(project, data)


@router.get("/{project_id}/stats", response_model=ProjectStats)
async def get_project_stats(
    project_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can("read", project, user):
        raise HTTPException(status_code=403, detail="Access denied")

    data = await _reconstruct_data(db, project.id)
    return _compute_project_stats(data)


@router.post("/{project_id}/share", response_model=ProjectResponse)
async def share_project(
    project_id: uuid.UUID,
    body: ShareRequest,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can("share", project, user):
        raise HTTPException(status_code=403, detail="No share permission")

    valid = {"read", "edit", "delete", "share"}
    perms = [p for p in body.permissions if p in valid]
    if not perms:
        raise HTTPException(status_code=400, detail="At least one valid permission required")

    result = await db.execute(select(User).where(User.email == body.email))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found with this email")

    shared = list(project.shared_with or [])
    found = False
    for entry in shared:
        if entry.get("user_id") == str(target.id):
            entry["permissions"] = perms
            entry["name"] = target.name
            found = True
            break
    if not found:
        shared.append({"user_id": str(target.id), "email": target.email, "name": target.name, "permissions": perms})

    project.shared_with = shared
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)

    data = await _reconstruct_data(db, project.id)
    return _project_response(project, data)


@router.delete("/{project_id}/share/{user_email}", response_model=ProjectResponse)
async def revoke_share(
    project_id: uuid.UUID,
    user_email: str,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can("share", project, user):
        raise HTTPException(status_code=403, detail="No share permission")

    shared = [s for s in (project.shared_with or []) if s.get("email") != user_email]
    project.shared_with = shared
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)

    data = await _reconstruct_data(db, project.id)
    return _project_response(project, data)


# ── Response builder ───────────────────────────────────────────────

def _project_response(project: Project, data: dict) -> dict:
    return {
        "id": project.id,
        "name": project.name,
        "organization": project.organization,
        "owner_id": project.owner_id,
        "shared_with": project.shared_with or [],
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "server_rev": project.server_rev or 0,
        "data": data,
    }


def _compute_project_stats(data: dict) -> dict:
    total_controls = 0
    compliant_controls = 0
    for fw_key, controls in (data.get("referentiels") or {}).items():
        if not isinstance(controls, list):
            continue
        for c in controls:
            if c.get("applicable") == "non":
                continue
            total_controls += 1
            conf = c.get("conformite")
            if conf is not None and conf != "":
                try:
                    if int(conf) >= 80:
                        compliant_controls += 1
                except (ValueError, TypeError):
                    pass

    total_measures = len(data.get("mesures") or [])
    completed = sum(1 for m in (data.get("mesures") or []) if m.get("statut") in ("completed", "termine", "Terminé"))
    total_proofs = len(data.get("preuves") or [])

    return {
        "total_controls": total_controls,
        "total_measures": total_measures,
        "total_proofs": total_proofs,
        "compliance_rate": round(compliant_controls / total_controls * 100, 1) if total_controls else 0,
        "measures_progress": round(completed / total_measures * 100, 1) if total_measures else 0,
    }
