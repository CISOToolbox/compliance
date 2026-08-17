from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database import get_db
from src.auth import get_current_user
from src.models import Framework, FrameworkRequirement, FrameworkMapping, User

router = APIRouter(prefix="/api/frameworks", tags=["frameworks"])


@router.get("")
async def list_frameworks(
    _user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(
            Framework.id,
            Framework.version,
            Framework.label,
            Framework.description,
            Framework.description_en,
            Framework.color,
            func.count(FrameworkRequirement.ref).label("requirement_count"),
        )
        .outerjoin(FrameworkRequirement, Framework.id == FrameworkRequirement.framework_id)
        .where(Framework.is_active.is_(True))
        .group_by(Framework.id)
        .order_by(Framework.sort_order)
    )
    rows = (await db.execute(q)).all()
    return [
        {
            "id": r.id,
            "version": r.version,
            "label": r.label,
            "description": r.description or "",
            "description_en": r.description_en or "",
            "color": r.color or "",
            "requirement_count": r.requirement_count,
        }
        for r in rows
    ]


@router.get("/{fw_id}")
async def get_framework(
    fw_id: str,
    _user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fw = await db.get(Framework, fw_id, options=[selectinload(Framework.requirements)])
    if not fw or not fw.is_active:
        raise HTTPException(404, f"Framework '{fw_id}' not found")

    measures = []
    reference_controls = []
    for req in fw.requirements:
        item = {
            "ref": req.ref,
            "theme": req.theme or "",
            "theme_en": req.theme_en or "",
            "mesure": req.mesure or "",
            "mesure_en": req.mesure_en or "",
            "description": req.description or "",
            "description_en": req.description_en or "",
        }
        if req.type:
            item["type"] = req.type
        if req.category:
            item["category"] = req.category
        if req.linked_controls:
            item["linked_controls"] = req.linked_controls

        if req.category and req.ref.startswith("A."):
            reference_controls.append(item)
        else:
            measures.append(item)

    result = {
        "id": fw.id,
        "version": fw.version,
        "label": fw.label,
        "description": fw.description or "",
        "description_en": fw.description_en or "",
        "color": fw.color or "",
        "measures": measures,
    }
    if reference_controls:
        result["reference_controls"] = reference_controls

    return result


@router.get("/{fw_id}/mappings")
async def get_framework_mappings(
    fw_id: str,
    _user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fw = await db.get(Framework, fw_id)
    if not fw or not fw.is_active:
        raise HTTPException(404, f"Framework '{fw_id}' not found")

    q_out = select(FrameworkMapping).where(FrameworkMapping.source_framework == fw_id).limit(5000)
    q_in = select(FrameworkMapping).where(FrameworkMapping.target_framework == fw_id).limit(5000)

    outgoing = (await db.execute(q_out)).scalars().all()
    incoming = (await db.execute(q_in)).scalars().all()

    return {
        "framework_id": fw_id,
        "outgoing": [
            {
                "target_framework": m.target_framework,
                "source_ref": m.source_ref,
                "target_ref": m.target_ref,
                "relationship": m.relationship_type or "",
            }
            for m in outgoing
        ],
        "incoming": [
            {
                "source_framework": m.source_framework,
                "source_ref": m.source_ref,
                "target_ref": m.target_ref,
                "relationship": m.relationship_type or "",
            }
            for m in incoming
        ],
    }
