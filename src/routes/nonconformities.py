"""FEAT-45 — non-conformities and derogations, Compliance flavour.

The mechanics (states, validation, router, expiry) are shared; this file
says what a derogation covers here — a control, addressed by its business
key `<framework_id>:<ref>` because the exported blob carries no technical
id — and what "derogated" does to it: nothing persisted on the control, the
frontend derives the "under derogation" state from the approved derogations
of the project, so the exported data model is untouched.
"""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import ProjectMeasure, Derogation, Nonconformity, ProjectControl
from src.nonconformity_common import make_internal_router, make_router


def split_control_key(subject_id: str) -> tuple[str, str]:
    fw, _, ref = (subject_id or "").partition(":")
    return fw.strip(), ref.strip()


class ControlHook:
    async def exists(self, db: AsyncSession, subject_type: str, subject_id: str) -> Optional[str]:
        if subject_type != "control":
            return None
        fw, ref = split_control_key(subject_id)
        if not fw or not ref:
            return None
        row = (await db.execute(select(ProjectControl).where(
            ProjectControl.framework_id == fw, ProjectControl.ref == ref).limit(1))).scalar_one_or_none()
        if row is None:
            return None
        return f"{fw} {ref} — {(row.mesure or row.thematique or '')[:400]}"[:500]

    async def apply(self, db: AsyncSession, derogation: Any) -> None:
        return None          # derived on the frontend from the derogation list

    async def release(self, db: AsyncSession, derogation: Any, reason: str) -> None:
        return None


    async def missing_measures(self, db: AsyncSession, ids: list) -> list:
        # Single-evaluation model: a measure id is unique enough across projects.
        rows = (await db.execute(select(ProjectMeasure.id).where(ProjectMeasure.id.in_(ids)))).scalars().all()
        found = set(rows)
        return [i for i in ids if i not in found]


    async def measure_states(self, db: AsyncSession, ids: list) -> dict:
        rows = (await db.execute(select(ProjectMeasure.id, ProjectMeasure.statut)
                                 .where(ProjectMeasure.id.in_(ids)))).all()
        return {r[0]: r[1] for r in rows}


CONTROL_HOOK = ControlHook()
router = make_router(Nonconformity, Derogation, CONTROL_HOOK, subject_types=("control",))

# Pilot's view of the register (service token): the same operations, relayed
# with the Pilot user as actor. The token check is the module's own.
from src.routes.internal import _check_service_token  # noqa: E402

internal_router = make_internal_router(Nonconformity, Derogation, CONTROL_HOOK, subject_types=("control",),
                                       check_service_token=_check_service_token)
