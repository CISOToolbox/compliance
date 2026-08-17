from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import get_current_user
from src.database import get_db
from src.routes.auth_helpers import get_project_or_404
from src.models import ProjectControl, User
from src.schemas import ControlCreate, ControlResponse, ControlUpdate

router = APIRouter(prefix="/api/projects/{project_id}", tags=["controls"])




@router.get("/controls", response_model=list[ControlResponse])
async def list_controls(
    project_id: uuid.UUID,
    framework_id: str | None = Query(None),
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, user, db)
    q = select(ProjectControl).where(ProjectControl.project_id == project_id)
    if framework_id:
        q = q.where(ProjectControl.framework_id == framework_id)
    q = q.order_by(ProjectControl.sort_order)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/controls", response_model=ControlResponse, status_code=201)
async def create_control(
    project_id: uuid.UUID,
    body: ControlCreate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_or_404(project_id, user, db, require_perm="edit")

    if body.sort_order == 0:
        max_order = await db.execute(
            select(func.coalesce(func.max(ProjectControl.sort_order), 0))
            .where(ProjectControl.project_id == project_id)
        )
        body.sort_order = max_order.scalar() + 1

    control = ProjectControl(project_id=project_id, **body.model_dump())
    db.add(control)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(control)
    return control


@router.get("/controls/{control_id}", response_model=ControlResponse)
async def get_control(
    project_id: uuid.UUID,
    control_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_404(project_id, user, db)
    control = await db.get(ProjectControl, (project_id, control_id))
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    return control


@router.patch("/controls/{control_id}", response_model=ControlResponse)
async def update_control(
    project_id: uuid.UUID,
    control_id: int,
    body: ControlUpdate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_or_404(project_id, user, db, require_perm="edit")
    control = await db.get(ProjectControl, (project_id, control_id))
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(control, field, value)

    control.updated_at = datetime.now(timezone.utc)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(control)
    return control


@router.delete("/controls/{control_id}", status_code=204)
async def delete_control(
    project_id: uuid.UUID,
    control_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_or_404(project_id, user, db, require_perm="delete")
    control = await db.get(ProjectControl, (project_id, control_id))
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")

    await db.delete(control)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
