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
from src.routes.auth_helpers import get_project_or_404
from src.models import ProjectMeasure, User
from src.schemas import MeasureCreate, MeasureResponse, MeasureUpdate

router = APIRouter(prefix="/api/projects/{project_id}", tags=["measures"])




@router.get("/measures", response_model=list[MeasureResponse])
async def list_measures(
    project_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, user, db)
    result = await db.execute(
        select(ProjectMeasure)
        .where(ProjectMeasure.project_id == project_id)
        .order_by(ProjectMeasure.sort_order)
    )
    return result.scalars().all()


@router.post("/measures", response_model=MeasureResponse, status_code=201)
async def create_measure(
    project_id: uuid.UUID,
    body: MeasureCreate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_or_404(project_id, user, db, require_perm="edit")

    existing = await db.get(ProjectMeasure, (project_id, body.id))
    if existing:
        raise HTTPException(status_code=409, detail="Measure ID already exists")

    if body.sort_order == 0:
        max_order = await db.execute(
            select(func.coalesce(func.max(ProjectMeasure.sort_order), 0))
            .where(ProjectMeasure.project_id == project_id)
        )
        body.sort_order = max_order.scalar() + 1

    measure = ProjectMeasure(project_id=project_id, **body.model_dump())
    db.add(measure)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(measure)
    return measure


@router.get("/measures/{measure_id}", response_model=MeasureResponse)
async def get_measure(
    project_id: uuid.UUID,
    measure_id: str,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, user, db)
    measure = await db.get(ProjectMeasure, (project_id, measure_id))
    if not measure:
        raise HTTPException(status_code=404, detail="Measure not found")
    return measure


@router.patch("/measures/{measure_id}", response_model=MeasureResponse)
async def update_measure(
    project_id: uuid.UUID,
    measure_id: str,
    body: MeasureUpdate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_or_404(project_id, user, db, require_perm="edit")
    measure = await db.get(ProjectMeasure, (project_id, measure_id))
    if not measure:
        raise HTTPException(status_code=404, detail="Measure not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(measure, field, value)

    measure.updated_at = datetime.now(timezone.utc)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(measure)
    from src.pilot_notify import notify_pilot_measure
    from src.routes.internal import _normalize_status
    from src.models import ProjectMeta
    meta_row = await db.execute(select(ProjectMeta.societe).where(ProjectMeta.project_id == project_id))
    societe = meta_row.scalar_one_or_none() or project.name or ""
    asyncio.ensure_future(notify_pilot_measure({
        "source_id": measure_id,
        "entity_id": str(project_id),
        "entity_name": societe,
        "title": measure.description or "",
        "description": measure.details or "",
        "status": _normalize_status(measure.statut or ""),
        "assignee": measure.responsable or "",
        "due_date": measure.date_cible or "",
    }))
    return measure


@router.delete("/measures/{measure_id}", status_code=204)
async def delete_measure(
    project_id: uuid.UUID,
    measure_id: str,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_or_404(project_id, user, db, require_perm="delete")
    measure = await db.get(ProjectMeasure, (project_id, measure_id))
    if not measure:
        raise HTTPException(status_code=404, detail="Measure not found")

    deleted_id = measure.id
    await db.delete(measure)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    from src.pilot_notify import notify_pilot_measure_deleted
    asyncio.ensure_future(notify_pilot_measure_deleted(deleted_id))
