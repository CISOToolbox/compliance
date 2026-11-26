"""FEAT-74 — the users of a project, entered by hand, imported from CSV, or
following Pilot's directory.

Reading them takes read access to the project; adding, changing, importing,
deleting or setting the project to follow Pilot takes edit access. A
deletion is for a mistake: a user who leaves is marked `inactif`, and GH-04
then finds the access they still have. A user Pilot sent keeps Pilot's
identity: only its accounts change here, and it is deleted in Pilot.
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
from src.schemas import SiUserCreate, SiUsersImport, SiUsersSource, SiUserUpdate
from src.si_users import UserError, account_conflict, checked_user, identity_changes, merge_accounts, parse_users_csv
from src.si_users_sync import PILOT, fetch_directory, lock_project, pilot_available, pull

router = APIRouter(prefix="/api", tags=["si-users"])

_FIELDS = ("email", "nom", "prenom", "statut", "date_depart", "comptes")


def _entry(u: SiUser) -> dict:
    return {k: getattr(u, k) if k != "comptes" else list(u.comptes or []) for k in _FIELDS}


def si_user_view(u: SiUser) -> dict:
    return {"id": str(u.id), **_entry(u), "sync_source": u.sync_source or "",
            "updated_at": u.updated_at.isoformat() if u.updated_at else None}


async def _users(db: AsyncSession, project_id: uuid.UUID) -> list[SiUser]:
    return list((await db.execute(select(SiUser).where(SiUser.project_id == project_id)
                                  .order_by(SiUser.nom, SiUser.prenom, SiUser.email))).scalars().all())


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
        raise HTTPException(status_code=409, detail=f"the account {a['compte']} on {a['perimetre']} "
                                                    f"cannot be both {first}'s and {second}'s")


_FROM_PILOT = "this user comes from Pilot's directory: only its accounts change here"


async def _flush(db: AsyncSession) -> None:
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="This email is already a user of the project")


def _identity_changes(given: dict, current: dict) -> list[str]:
    try:
        return identity_changes(given, current)
    except UserError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


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
    await lock_project(db, project_id)
    _unique([_entry(u) for u in await _users(db, project_id)] + [entry])
    si_user = SiUser(id=uuid.uuid4(), project_id=project_id, **entry)
    db.add(si_user)
    await _flush(db)
    from src.audit import log_write
    await log_write(db, user, request, "si_user.create", entity_type="si_user", entity_id=str(si_user.id),
                    target=si_user.email, details={"statut": si_user.statut, "comptes": len(si_user.comptes)})
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
    await lock_project(db, project_id)
    si_user = await _si_user_or_404(db, project_id, si_user_id)
    # null means "not sent", except for the date of departure, which it clears
    given = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None or k == "date_depart"}
    if si_user.sync_source == PILOT and _identity_changes(given, _entry(si_user)):
        raise HTTPException(status_code=409, detail=_FROM_PILOT)
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
    await lock_project(db, project_id)
    si_user = await _si_user_or_404(db, project_id, si_user_id)
    if si_user.sync_source == PILOT:
        raise HTTPException(status_code=409, detail="this user comes from Pilot's directory: it is deleted there")
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
    await lock_project(db, project_id)
    existing = {u.email: u for u in await _users(db, project_id)}
    after = {e: _entry(u) for e, u in existing.items()}
    errors = []
    for row in rows:
        current = after.get(row["email"])
        given = {"email": row["email"], **row["given"],
                 "comptes": merge_accounts(current["comptes"] if current else [], row["comptes"])}
        try:
            if current and existing[row["email"]].sync_source == PILOT and identity_changes(given, current):
                raise UserError(_FROM_PILOT)
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


# ── Following Pilot's directory ─────────────────────────────────────────

def _source_view(project: Project) -> dict:
    return {"pilot_sync": bool(project.users_pilot_sync), "pilot_available": pilot_available()}


async def _pull(db: AsyncSession, project_id: uuid.UUID) -> dict:
    try:
        directory = await fetch_directory()
    except Exception as exc:  # noqa: BLE001 — Pilot unreachable or answering badly: said, nothing written
        raise HTTPException(status_code=502, detail=f"Pilot's directory could not be read ({type(exc).__name__})")
    try:
        return await pull(db, project_id, directory)
    except UserError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.get("/projects/{project_id}/si-users/source")
async def get_si_users_source(project_id: uuid.UUID, user: Optional[User] = Depends(get_current_user),
                              db: AsyncSession = Depends(get_db)):
    return _source_view(await get_project_or_404(project_id, user, db))


@router.put("/projects/{project_id}/si-users/source")
async def set_si_users_source(project_id: uuid.UUID, body: SiUsersSource, request: Request,
                              user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Turned on, the project reads Pilot's directory at once, then follows
    its changes. Turned off, the users Pilot sent stay, as the project's own."""
    project = await get_project_or_404(project_id, user, db, require_perm="edit")
    counts: dict = {}
    if body.pilot_sync:
        if not pilot_available():
            raise HTTPException(status_code=409, detail="Pilot is not configured for this module")
        counts = await _pull(db, project_id)
    else:
        await lock_project(db, project_id)
        for u in await _users(db, project_id):
            if u.sync_source == PILOT:
                u.sync_source = ""
    project.users_pilot_sync = body.pilot_sync
    await _flush(db)
    from src.audit import log_write
    await log_write(db, user, request, "si_users.source", entity_type="project", entity_id=str(project_id),
                    target="pilot" if body.pilot_sync else "local", details=counts)
    await db.commit()
    return {**_source_view(project), "counts": counts}


@router.post("/projects/{project_id}/si-users/sync")
async def sync_si_users(project_id: uuid.UUID, request: Request,
                        user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Read Pilot's directory again: catches a change a broadcast missed."""
    project = await get_project_or_404(project_id, user, db, require_perm="edit")
    if not project.users_pilot_sync:
        raise HTTPException(status_code=409, detail="This project's users do not follow Pilot")
    counts = await _pull(db, project_id)
    await _flush(db)
    from src.audit import log_write
    await log_write(db, user, request, "si_users.sync", entity_type="project", entity_id=str(project_id),
                    target="pilot", details=counts)
    await db.commit()
    return counts


@router.post("/internal/personnel-sync")
async def personnel_sync(request: Request, db: AsyncSession = Depends(get_db)):
    """A change of Pilot's directory, broadcast to the modules (service
    token), applied to the projects that follow Pilot."""
    from src.routes.internal import _check_service_token
    from src.si_users_sync import apply_change
    _check_service_token(request)
    try:
        body = await request.json()
    except ValueError:
        raise HTTPException(status_code=400, detail="JSON body expected")
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="JSON object expected")
    try:
        counts = await apply_change(db, body)
    except UserError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    await _flush(db)
    if counts["projects"]:                               # journaled when something changed
        from src.audit import log_write
        person = body.get("personnel") or {}
        await log_write(db, None, request, "personnel.sync", actor="pilot", entity_type="si_user",
                        target=str(person.get("email") or "")[:255],
                        details={"action": body.get("action", "upsert"), "old_email": str(body.get("old_email") or "")[:255] or None,
                                 **counts})
    await db.commit()
    return {"ok": True, **counts}
