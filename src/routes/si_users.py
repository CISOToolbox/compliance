"""FEAT-74 — the users of a project, entered by hand or imported from CSV.

Reading them takes read access to the project; adding, changing, importing
or deleting takes edit access. A deletion is for a mistake: a user who
leaves is marked `left`, and GH-04 then finds the access they still have.
"""
from __future__ import annotations

import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import get_current_user
from src.database import get_db
from src.models import Project, SiUser, User
from src.routes.auth_helpers import get_project_or_404
from src.schemas import SiUserCreate, SiUserUpdate, SiUsersImport
from src.si_users import UserError, account_conflict, checked_user, merge_accounts, parse_users_csv

router = APIRouter(prefix="/api", tags=["si-users"])

_FIELDS = ("email", "name", "status", "left_on", "accounts")


def _entry(u: SiUser) -> dict:
    return {k: getattr(u, k) if k != "accounts" else list(u.accounts or []) for k in _FIELDS}


def si_user_view(u: SiUser) -> dict:
    return {"id": str(u.id), **_entry(u), "updated_at": u.updated_at.isoformat() if u.updated_at else None}


async def _users(db: AsyncSession, project_id: uuid.UUID) -> list[SiUser]:
    return list((await db.execute(select(SiUser).where(SiUser.project_id == project_id)
                                  .order_by(SiUser.name, SiUser.email))).scalars().all())


def _checked(given: dict, current: Optional[dict] = None) -> dict:
    try:
        return checked_user(given, current)
    except UserError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


def _unique(final: list[dict]) -> None:
    """One email and one account per user of the project, once written."""
    counts = Counter(e["email"] for e in final)
    dup = next((e for e, n in counts.items() if n > 1), None)
    if dup:
        raise HTTPException(status_code=409, detail=f"{dup} is already a user of the project")
    clash = account_conflict(final)
    if clash:
        a, first, second = clash
        raise HTTPException(status_code=409, detail=f"the account {a['account']} on {a['perimeter']} "
                                                    f"cannot be both {first}'s and {second}'s")


async def _lock(db: AsyncSession, project_id: uuid.UUID) -> None:
    """One write to the project's users at a time: an email and an account
    belong to one user, checked over the whole list before writing."""
    await db.execute(select(Project.id).where(Project.id == project_id).with_for_update())


async def _flush(db: AsyncSession) -> None:
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="This email is already a user of the project")


def _write(user: SiUser, entry: dict) -> list[str]:
    changed = sorted(k for k in _FIELDS if _entry(user)[k] != entry[k])
    for k, v in entry.items():
        setattr(user, k, v)
    return changed


@router.get("/projects/{project_id}/si-users")
async def list_si_users(project_id: uuid.UUID, user: Optional[User] = Depends(get_current_user),
                        db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db)
    return [si_user_view(u) for u in await _users(db, project_id)]


@router.post("/projects/{project_id}/si-users", status_code=201)
async def create_si_user(project_id: uuid.UUID, body: SiUserCreate, request: Request,
                         user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db, require_perm="edit")
    entry = _checked(body.model_dump())
    await _lock(db, project_id)
    _unique([_entry(u) for u in await _users(db, project_id)] + [entry])
    si_user = SiUser(id=uuid.uuid4(), project_id=project_id, **entry)
    db.add(si_user)
    await _flush(db)
    from src.audit import log_write
    await log_write(db, user, request, "si_user.create", entity_type="si_user", entity_id=str(si_user.id),
                    target=si_user.email, details={"status": si_user.status, "accounts": len(si_user.accounts)})
    await db.commit()
    return si_user_view(si_user)


async def _si_user_or_404(db: AsyncSession, project_id: uuid.UUID, si_user_id: uuid.UUID) -> SiUser:
    si_user = await db.get(SiUser, si_user_id)
    if si_user is None or si_user.project_id != project_id:     # another project's: it does not exist here
        raise HTTPException(status_code=404, detail="User not found")
    return si_user


@router.patch("/projects/{project_id}/si-users/{si_user_id}")
async def update_si_user(project_id: uuid.UUID, si_user_id: uuid.UUID, body: SiUserUpdate, request: Request,
                         user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db, require_perm="edit")
    await _lock(db, project_id)
    si_user = await _si_user_or_404(db, project_id, si_user_id)
    # null means "not sent", except for the date of departure, which it clears
    given = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None or k == "left_on"}
    entry = _checked(given, _entry(si_user))
    _unique([_entry(u) for u in await _users(db, project_id) if u.id != si_user.id] + [entry])
    changed = _write(si_user, entry)
    si_user.updated_at = datetime.now(timezone.utc)
    await _flush(db)
    from src.audit import log_write
    await log_write(db, user, request, "si_user.update", entity_type="si_user", entity_id=str(si_user.id),
                    target=si_user.email, details={"fields": changed})
    await db.commit()
    return si_user_view(si_user)


@router.delete("/projects/{project_id}/si-users/{si_user_id}", status_code=204)
async def delete_si_user(project_id: uuid.UUID, si_user_id: uuid.UUID, request: Request,
                         user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await get_project_or_404(project_id, user, db, require_perm="edit")
    si_user = await _si_user_or_404(db, project_id, si_user_id)
    from src.audit import log_write
    await log_write(db, user, request, "si_user.delete", entity_type="si_user", entity_id=str(si_user.id),
                    target=si_user.email, details={})
    await db.delete(si_user)
    await db.commit()


@router.post("/projects/{project_id}/si-users/import")
async def import_si_users(project_id: uuid.UUID, body: SiUsersImport, request: Request,
                          user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Add the users of a CSV file, and update those already there (same
    email) with the columns the file holds; their accounts are added to
    theirs (an account already there takes the file's role). Nobody and no
    account is removed. All or nothing: one faulty line refuses the file."""
    await get_project_or_404(project_id, user, db, require_perm="edit")
    try:
        rows = parse_users_csv(body.csv)
    except UserError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    await _lock(db, project_id)
    existing = {u.email: u for u in await _users(db, project_id)}
    after = {e: _entry(u) for e, u in existing.items()}
    errors = []
    for row in rows:
        current = after.get(row["email"])
        given = {"email": row["email"], **row["given"],
                 "accounts": merge_accounts(current["accounts"] if current else [], row["accounts"])}
        try:
            after[row["email"]] = checked_user(given, current)
        except UserError as exc:
            errors.append(f"line {row['line']} ({row['email']}): {exc}")
    if errors:
        raise HTTPException(status_code=422, detail="; ".join(errors[:20]))
    _unique(list(after.values()))
    created = updated = 0
    now = datetime.now(timezone.utc)
    for row in rows:
        entry = after[row["email"]]
        si_user = existing.get(row["email"])
        if si_user is None:
            db.add(SiUser(id=uuid.uuid4(), project_id=project_id, **entry))
            created += 1
        elif _write(si_user, entry):
            si_user.updated_at = now
            updated += 1
    await _flush(db)
    from src.audit import log_write
    await log_write(db, user, request, "si_users.import", entity_type="si_user", entity_id="",
                    target=f"{len(rows)} users", details={"created": created, "updated": updated})
    await db.commit()
    return {"created": created, "updated": updated, "unchanged": len(rows) - created - updated}
