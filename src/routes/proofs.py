from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import get_current_user
from src.database import get_db
from src.evidence_common import evidence_to_pilot_payload
from src.pilot_notify import notify_pilot_evidence, notify_pilot_evidence_deleted
from src.routes.auth_helpers import get_project_or_404
from src.models import ProjectProof, User
from src.schemas import ProofCreate, ProofResponse, ProofUpdate

router = APIRouter(prefix="/api/projects/{project_id}", tags=["proofs"])


def _evidence_payload(p: ProjectProof) -> dict:
    """Build the Pilot evidence payload from a proof (linked objects are
    resolved on the next /internal/evidences sync — keep the push light)."""
    return evidence_to_pilot_payload({
        "id": p.id, "project_id": p.project_id, "label": p.label or "",
        "kind": p.kind or "link", "url": p.url or "", "owner": p.owner or "",
        "date_obtention": p.date_obtention or "", "date_expiration": p.date_expiration or "",
        "tags": p.tags or [],
    }, "compliance")


# Defensive cap on the client-supplied tags JSONB (bounded list of short strings).
_MAX_TAGS = 50
_MAX_TAG_LEN = 100


def _cap_tags(tags) -> list:
    if not isinstance(tags, list):
        return []
    return [str(t)[:_MAX_TAG_LEN] for t in tags[:_MAX_TAGS]]




@router.get("/proofs", response_model=list[ProofResponse])
async def list_proofs(
    project_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, user, db)
    result = await db.execute(
        select(ProjectProof)
        .where(ProjectProof.project_id == project_id)
        .order_by(ProjectProof.sort_order)
    )
    return result.scalars().all()


@router.post("/proofs", response_model=ProofResponse, status_code=201)
async def create_proof(
    project_id: uuid.UUID,
    body: ProofCreate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_or_404(project_id, user, db, require_perm="edit")

    existing = await db.get(ProjectProof, (project_id, body.id))
    if existing:
        raise HTTPException(status_code=409, detail="Proof ID already exists")

    if body.sort_order == 0:
        max_order = await db.execute(
            select(func.coalesce(func.max(ProjectProof.sort_order), 0))
            .where(ProjectProof.project_id == project_id)
        )
        body.sort_order = max_order.scalar() + 1

    proof = ProjectProof(project_id=project_id, **body.model_dump())
    proof.tags = _cap_tags(proof.tags)
    db.add(proof)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(proof)
    asyncio.ensure_future(notify_pilot_evidence(_evidence_payload(proof)))
    return proof


@router.get("/proofs/{proof_id}", response_model=ProofResponse)
async def get_proof(
    project_id: uuid.UUID,
    proof_id: str,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, user, db)
    proof = await db.get(ProjectProof, (project_id, proof_id))
    if not proof:
        raise HTTPException(status_code=404, detail="Proof not found")
    return proof


@router.patch("/proofs/{proof_id}", response_model=ProofResponse)
async def update_proof(
    project_id: uuid.UUID,
    proof_id: str,
    body: ProofUpdate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_or_404(project_id, user, db, require_perm="edit")
    proof = await db.get(ProjectProof, (project_id, proof_id))
    if not proof:
        raise HTTPException(status_code=404, detail="Proof not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(proof, field, value)
    if "tags" in body.model_dump(exclude_unset=True):
        proof.tags = _cap_tags(proof.tags)

    proof.updated_at = datetime.now(timezone.utc)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(proof)
    asyncio.ensure_future(notify_pilot_evidence(_evidence_payload(proof)))
    return proof


@router.delete("/proofs/{proof_id}", status_code=204)
async def delete_proof(
    project_id: uuid.UUID,
    proof_id: str,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_or_404(project_id, user, db, require_perm="delete")
    proof = await db.get(ProjectProof, (project_id, proof_id))
    if not proof:
        raise HTTPException(status_code=404, detail="Proof not found")

    # Compliance evidence is the most audit-sensitive delete of the module
    # (FEAT-30 P0 journal): who removed which proof, when.
    from src.audit import log_write
    await log_write(db, user, None, "proof.delete",
                    entity_type="proof", entity_id=str(proof_id),
                    target=getattr(proof, "titre", "") or getattr(proof, "name", "") or "")
    await db.delete(proof)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    asyncio.ensure_future(notify_pilot_evidence_deleted(proof_id))
