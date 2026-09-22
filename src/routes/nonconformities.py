"""FEAT-45 — non-conformities and derogations, Compliance flavour.

The mechanics (states, validation, router, expiry) are shared; this file
says what a derogation covers here — a control, addressed by its business
key `<framework_id>:<ref>` because the exported blob carries no technical
id — and what "derogated" does to it: nothing persisted on the control, the
frontend derives the "under derogation" state from the approved derogations
of the project, so the exported data model is untouched.
"""
from __future__ import annotations

import uuid

from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Derogation, Nonconformity, Project, ProjectControl, ProjectMeasure
from src.nonconformity_common import make_internal_router, make_router
from src.auth import require_min_role

# Same ladder as the module's own write routes: an editor writes, a viewer does not.
_ROLES = ["viewer", "reader", "triager", "editor", "contributor", "manager", "admin", "control"]


def split_control_key(subject_id: str) -> tuple[str, str]:
    fw, _, ref = (subject_id or "").partition(":")
    return fw.strip(), ref.strip()


class ControlHook:
    async def exists(self, db: AsyncSession, subject_type: str, subject_id: str, project_id: str = "") -> Optional[str]:
        if subject_type != "control":
            return None
        fw, ref = split_control_key(subject_id)
        if not fw or not ref:
            return None
        # The same requirement key exists in every project: resolve it inside
        # the record's project, so a record never names another client's control.
        q = select(ProjectControl).where(ProjectControl.framework_id == fw, ProjectControl.ref == ref)
        if project_id:
            try:
                q = q.where(ProjectControl.project_id == uuid.UUID(str(project_id)))
            except ValueError:
                return None
        row = (await db.execute(q.limit(1))).scalar_one_or_none()
        if row is None:
            return None
        return f"{fw} {ref} — {(row.mesure or row.thematique or '')[:400]}"[:500]

    async def apply(self, db: AsyncSession, derogation: Any) -> None:
        return None          # derived on the frontend from the derogation list

    async def release(self, db: AsyncSession, derogation: Any, reason: str) -> None:
        return None


    async def missing_measures(self, db: AsyncSession, ids: list, project_id: str = "") -> list:
        # Single-evaluation model: a measure id is unique enough across projects.
        rows = (await db.execute(select(ProjectMeasure.id).where(ProjectMeasure.id.in_(ids)))).scalars().all()
        found = set(rows)
        return [i for i in ids if i not in found]


    async def measure_states(self, db: AsyncSession, ids: list, project_id: str = "") -> dict:
        rows = (await db.execute(select(ProjectMeasure.id, ProjectMeasure.statut)
                                 .where(ProjectMeasure.id.in_(ids)))).all()
        return {r[0]: r[1] for r in rows}


CONTROL_HOOK = ControlHook()
class ProjectScope:
    """The register is project-scoped here: a record belongs to the project it
    was declared in, and a user only ever sees or touches the projects the
    module already grants them. A record without a project came from the
    console: it is module-level and stays visible to everyone."""

    async def readable(self, db: AsyncSession, user: Any) -> list:
        from src.routes.projects import _user_permissions
        rows = (await db.execute(select(Project))).scalars().all()
        return [str(p.id) for p in rows if "read" in _user_permissions(p, user)]

    async def writable(self, db: AsyncSession, user: Any, project_id: str) -> None:
        from src.routes.auth_helpers import get_project_or_404
        try:
            pid = uuid.UUID(str(project_id))
        except ValueError:
            raise HTTPException(status_code=404, detail="Project not found")
        await get_project_or_404(pid, user, db, require_perm="edit")


PROJECT_SCOPE = ProjectScope()


router = make_router(Nonconformity, Derogation, CONTROL_HOOK, subject_types=("control",),
                     require_writer=lambda u: require_min_role(u, "editor", _ROLES),
                     project_scope=PROJECT_SCOPE)

# Pilot's view of the register (service token): the same operations, relayed
# with the Pilot user as actor. The token check is the module's own.
from src.routes.internal import _check_service_token  # noqa: E402

internal_router = make_internal_router(Nonconformity, Derogation, CONTROL_HOOK, subject_types=("control",),
                                       check_service_token=_check_service_token)
