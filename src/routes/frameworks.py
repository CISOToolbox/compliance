from __future__ import annotations

import json
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import Text, cast, delete, func, or_, select
from sqlalchemy import text as sa_text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database import get_db
from src.auth import get_current_user, require_min_role
from src.models import (Derogation, Framework, FrameworkMapping, FrameworkRequirement,
                        Nonconformity, ProjectControl, User)

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
            Framework.origin,
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
            "origin": r.origin or "catalogue",
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
        "origin": fw.origin or "catalogue",
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


# ── FEAT-51: a framework the user creates ────────────────────────────────
#
# `frameworks` used to be seeded and never written. A CSV import and the
# internal-controls framework had nowhere to declare themselves, so their
# label and colour lived in `D._custom_frameworks` — a key this module drops
# on save, since the project PUT decomposes `D` into rows and never reads it.

_ROLES = ["viewer", "reader", "triager", "editor", "contributor", "manager", "admin", "control"]
# A framework id travels in URLs and in a non-conformity subject key
# ("<framework>:<ref>"): no colon, no slash, nothing to parse wrongly later.
_ID_OK = re.compile(r"^[a-z0-9][a-z0-9_-]{0,49}$")
MAX_REQUIREMENTS = 2000
# The internal-controls framework is created BY the register, at the first
# requirement an analyst writes of their own — it is not an import, and the
# module leans on it. It is `custom` because its content belongs to the
# organisation, not because it is disposable.
FRAMEWORK_INTERNE = "own_controls"
# Segments the edge hides on every module (`location ~ /internal(/|$)` and the
# neighbouring guards). A framework taking one of these names would be both
# unreachable and undeletable through the proxy — which is the defect BUG-32
# was, recreated by hand.
RESERVES = frozenset({"internal", "api", "auth", "health", "static", "login"})


class RequirementIn(BaseModel):
    ref: str = Field(min_length=1, max_length=50)
    theme: str = ""
    theme_en: str = ""
    mesure: str = ""
    mesure_en: str = ""
    description: str = ""
    description_en: str = ""


class FrameworkIn(BaseModel):
    id: str = Field(min_length=1, max_length=50)
    label: str = Field(min_length=1, max_length=255)
    color: str = ""
    description: str = ""
    description_en: str = ""
    requirements: list[RequirementIn] = Field(default_factory=list, max_length=MAX_REQUIREMENTS)


@router.post("", status_code=201)
async def create_framework(
    body: FrameworkIn,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Declare a framework of the organisation: a CSV import, or the
    internal-controls one the register creates at first use.

    It is an organisation object, like a catalogue one — not a project one:
    the same imported standard serves every assessment, and re-importing the
    CSV per project is exactly what this replaces.
    """
    require_min_role(user, "editor", _ROLES)
    fw_id = body.id.strip().lower()
    if not _ID_OK.match(fw_id):
        raise HTTPException(422, "a framework id is lowercase letters, digits, - and _")
    if fw_id in RESERVES:
        raise HTTPException(
            422, f"'{fw_id}' is a reserved route segment: the edge would refuse every URL naming it")
    if await db.get(Framework, fw_id) is not None:
        raise HTTPException(409, f"Framework '{fw_id}' already exists")
    if not body.requirements:
        raise HTTPException(422, "a framework without requirements would be an empty screen")

    db.add(Framework(
        id=fw_id, version="", label=body.label.strip(),
        description=body.description[:2000], description_en=body.description_en[:2000],
        color=body.color[:20], is_active=True, sort_order=900, origin="custom",
    ))
    vus: set[str] = set()
    for i, req in enumerate(body.requirements):
        ref = req.ref.strip()
        if not ref or ref in vus:
            continue          # a duplicated ref would collide on the primary key
        vus.add(ref)
        db.add(FrameworkRequirement(
            framework_id=fw_id, ref=ref, sort_order=i,
            theme=req.theme[:500], theme_en=req.theme_en[:500],
            mesure=req.mesure, mesure_en=req.mesure_en,
            description=req.description, description_en=req.description_en,
        ))
    await db.commit()
    from src.audit import log_write
    await log_write(db, user, None, "framework.create", entity_type="framework",
                    entity_id=fw_id, target=body.label.strip())
    await db.commit()
    return {"id": fw_id, "label": body.label.strip(), "origin": "custom",
            "requirement_count": len(vus)}


@router.put("/{fw_id}/requirements")
async def replace_requirements(
    fw_id: str,
    body: list[RequirementIn],
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Replace the reference definition of a framework the organisation owns.

    Used when an internal control is added from the register, and when a CSV
    is re-imported over an existing framework. Refused on a catalogue one: its
    definition is what the migrations ship, and an assessment that no longer
    matches its own standard is worse than no standard.

    This touches the DEFINITION, never a project's assessment: the working-set
    rows carry the conformity and are not read here.
    """
    require_min_role(user, "editor", _ROLES)
    fw = await db.get(Framework, fw_id)
    if fw is None:
        raise HTTPException(404, f"Framework '{fw_id}' not found")
    if (fw.origin or "catalogue") != "custom":
        raise HTTPException(409, "the definition of a catalogue framework is not editable")
    if len(body) > MAX_REQUIREMENTS:
        raise HTTPException(422, f"at most {MAX_REQUIREMENTS} requirements")
    if not body:
        # `POST` refuses a framework with no requirement; emptying one through
        # this route would fabricate exactly that state.
        raise HTTPException(422, "a framework without requirements would be an empty screen")

    await db.execute(delete(FrameworkRequirement).where(FrameworkRequirement.framework_id == fw_id))
    vus: set[str] = set()
    for i, req in enumerate(body):
        ref = req.ref.strip()
        if not ref or ref in vus:
            continue
        vus.add(ref)
        db.add(FrameworkRequirement(
            framework_id=fw_id, ref=ref, sort_order=i,
            theme=req.theme[:500], theme_en=req.theme_en[:500],
            mesure=req.mesure, mesure_en=req.mesure_en,
            description=req.description, description_en=req.description_en,
        ))
    libelle = fw.label or ""      # read BEFORE the commit expires the instance
    await db.commit()
    from src.audit import log_write
    await log_write(db, user, None, "framework.requirements", entity_type="framework",
                    entity_id=fw_id, target=libelle)
    await db.commit()
    return {"id": fw_id, "requirement_count": len(vus)}


@router.delete("/{fw_id}", status_code=204)
async def delete_framework(
    fw_id: str,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a framework the organisation created, and its working set with it.

    Refused on a catalogue one — what the migrations ship is not the user's to
    remove — and refused as soon as one of its requirements carries actual
    work: a conformity, a gap, a planned measure, a linked measure. Deleting
    the framework must not silently destroy an assessment.

    An untouched working set goes with it. Activating a framework hydrates its
    requirements immediately, so refusing on their mere existence would have
    made deletion impossible for every framework anyone ever opened — a rule
    that protects nothing and forbids everything.
    """
    require_min_role(user, "editor", _ROLES)
    fw = await db.get(Framework, fw_id)
    if fw is None:
        raise HTTPException(404, f"Framework '{fw_id}' not found")
    if (fw.origin or "catalogue") != "custom":
        raise HTTPException(409, "a catalogue framework is not deletable")
    if fw_id == FRAMEWORK_INTERNE:
        raise HTTPException(409, "the internal-controls framework belongs to the module")

    evalues = (await db.execute(
        select(func.count()).select_from(ProjectControl).where(
            ProjectControl.framework_id == fw_id,
            or_(
                func.coalesce(ProjectControl.conformite, "") != "",
                func.coalesce(ProjectControl.ecart, "") != "",
                func.coalesce(ProjectControl.mesures_prevues, "") != "",
                func.coalesce(ProjectControl.applicable, "") != "",
                # Rendered as text rather than with a JSON function: the unit
                # suite runs on SQLite, and an empty array prints the same on
                # both — the check has to hold where it is tested.
                func.coalesce(cast(ProjectControl.mesures_ids, Text), "[]") != "[]",
            )))).scalar_one()
    if evalues:
        raise HTTPException(409, f"{evalues} requirement(s) of this framework carry an assessment")

    # A requirement also carries work that lives OUTSIDE its own columns: a
    # non-conformity or a derogation declared against it. Deleting the row
    # would leave that record naming a requirement nobody can resolve — the
    # register would point into the void.
    # `_` is a LIKE wildcard, and every imported id carries one
    # (`custom_<slug>_<stamp>`): without an escape the count — which the screen
    # shows — would name records belonging to another framework.
    prefixe = fw_id.replace("\\", "\\\\").replace("_", "\\_").replace("%", "\\%") + ":"
    for modele in (Nonconformity, Derogation):
        vises = (await db.execute(
            select(func.count()).select_from(modele).where(
                modele.subject_type == "control",
                modele.subject_id.like(prefixe + "%", escape="\\")))).scalar_one()
        if vises:
            raise HTTPException(
                409, f"{vises} record(s) of the register name a requirement of this framework")
    nommes = (await db.execute(
        select(func.count()).select_from(Nonconformity).where(
            # Not filtered on the subject type: the JSON key order is not
            # guaranteed, and a pattern that assumed it would MISS records —
            # over-blocking costs a refusal, under-detecting costs the work.
            cast(Nonconformity.subjects, Text).like(f'%"{prefixe}%', escape="\\")))).scalar_one()
    if nommes:
        raise HTTPException(
            409, f"{nommes} record(s) of the register name a requirement of this framework")

    await db.execute(delete(ProjectControl).where(ProjectControl.framework_id == fw_id))
    # A framework that is gone must stop being listed as active: the screen
    # would ask the API for it at every load and get a 404 — the very defect
    # this feature closes. The cleanup belongs here, not to whoever calls the
    # route: migration 013 already rewrites this same column.
    for pid, actifs in (await db.execute(sa_text(
            "SELECT project_id, referentiels_actifs FROM project_settings"))).fetchall():
        liste = actifs if isinstance(actifs, list) else json.loads(actifs or "[]")
        if fw_id not in liste:
            continue
        await db.execute(sa_text("UPDATE project_settings SET referentiels_actifs = CAST(:v AS "
                                 + ("jsonb" if db.bind.dialect.name == "postgresql" else "text")
                                 + ") WHERE project_id = :p"),
                         {"v": json.dumps([x for x in liste if x != fw_id]), "p": pid})
    libelle = fw.label or ""      # read BEFORE the commit expires the instance
    await db.delete(fw)          # its reference requirements cascade
    await db.commit()
    from src.audit import log_write
    await log_write(db, user, None, "framework.delete", entity_type="framework",
                    entity_id=fw_id, target=libelle)
    await db.commit()
    return None
