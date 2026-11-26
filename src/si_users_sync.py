"""FEAT-74 — the users of a project follow Pilot's directory.

A project that turns `users_pilot_sync` on receives the changes Pilot
broadcasts (`POST /api/internal/personnel-sync`) and can read the whole
directory again on demand (`pull`), which also catches a change a broadcast
missed. A user Pilot sends is marked `sync_source = "pilot"`: its identity
(email, nom, prénom, statut, date de départ) is Pilot's and read-only here;
its accounts stay the module's own. A person deleted in Pilot is deleted
here; a departure is a status, sent as such.

Pilot's broadcasts carry no order nor retry: one can arrive after a later
one, or not at all, and a reading of the directory taken just before a
broadcast can be applied after it. Reading the directory again settles it.
"""
from __future__ import annotations

import logging
import os
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Project, SiUser
from src.si_users import IDENTITY, UserError, pilot_identity

logger = logging.getLogger(__name__)

PILOT = "pilot"
MAX_DIRECTORY_BYTES = 20_000_000
PILOT_URL = os.getenv("PILOT_URL", "")
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "")


def pilot_available() -> bool:
    """The module runs in the suite, beside a Pilot it can reach."""
    return bool(PILOT_URL and SERVICE_TOKEN)


async def lock_project(db: AsyncSession, project_id: uuid.UUID) -> None:
    """One write to a project's users at a time: an email and an account
    belong to one user, checked over the whole list before writing."""
    await db.execute(select(Project.id).where(Project.id == project_id).with_for_update())


async def synced_projects(db: AsyncSession) -> list[uuid.UUID]:
    # Always in the same order: two broadcasts lock the projects one after the other, never crosswise.
    return list((await db.execute(select(Project.id).where(Project.users_pilot_sync.is_(True))
                                  .order_by(Project.id))).scalars().all())


def _find(rows: list[SiUser], email: str, old_email: str = "") -> SiUser | None:
    by_email = {u.email: u for u in rows}
    return by_email.get(email) or (by_email.get(old_email) if old_email else None)


def _apply(rows: list[SiUser], project_id: uuid.UUID, identity: dict, old_email: str = "") -> tuple[str, SiUser | None]:
    """Write one person of Pilot on the project's users (`rows`, kept up to
    date): created, updated, unchanged, or skipped when its email is another
    user's (a rename onto an address already in the project)."""
    by_email = {u.email: u for u in rows}
    renamed = by_email.get(old_email) if old_email and old_email != identity["email"] else None
    if renamed is not None and identity["email"] in by_email:
        return "skipped", None                          # both addresses are users here: which one is it?
    user = renamed or by_email.get(identity["email"])
    if user is None:
        user = SiUser(id=uuid.uuid4(), project_id=project_id, comptes=[], sync_source=PILOT, **identity)
        rows.append(user)
        return "created", user
    changed = [k for k in IDENTITY if getattr(user, k) != identity[k]] + (["sync_source"] if user.sync_source != PILOT else [])
    if not changed:
        return "unchanged", user
    for k in IDENTITY:
        setattr(user, k, identity[k])
    user.sync_source = PILOT
    return "updated", user


async def _rows(db: AsyncSession, project_id: uuid.UUID) -> list[SiUser]:
    return list((await db.execute(select(SiUser).where(SiUser.project_id == project_id))).scalars().all())


async def apply_change(db: AsyncSession, body: dict) -> dict:
    """A change Pilot broadcast — `{action: upsert | delete, personnel,
    old_email?}` — applied to every project that follows Pilot. Raises
    UserError on a malformed body."""
    action = body.get("action", "upsert")
    if action not in ("upsert", "delete"):
        raise UserError("action must be upsert or delete")
    person = body.get("personnel") or {}
    old_email = str(body.get("old_email") or "").strip().lower()
    counts: dict[str, Any] = {"created": 0, "updated": 0, "deleted": 0, "unchanged": 0, "skipped": 0, "projects": []}
    if action == "delete":
        email = str(person.get("email") or "").strip().lower() if isinstance(person, dict) else ""
        if not email:
            raise UserError("personnel.email required")
    else:
        identity = pilot_identity(person)
    for project_id in await synced_projects(db):
        await lock_project(db, project_id)
        rows = await _rows(db, project_id)
        if action == "delete":
            user = _find(rows, email)
            if user is not None and user.sync_source == PILOT:      # one entered here stays
                await db.delete(user)
                counts["deleted"] += 1
                counts["projects"].append(str(project_id))
            continue
        outcome, user = _apply(rows, project_id, identity, old_email)
        if outcome == "created":
            db.add(user)
        if outcome == "skipped":
            logger.warning("personnel-sync: %s renamed to %s, already a user of project %s",
                           old_email, identity["email"], project_id)
        if outcome in ("created", "updated"):
            counts["projects"].append(str(project_id))
        counts[outcome] += 1
    return counts


async def fetch_directory() -> list[dict]:
    """Pilot's whole directory, the people who left included."""
    import httpx
    import json
    body = bytearray()
    async with httpx.AsyncClient(timeout=15.0) as client:
        async with client.stream("GET", PILOT_URL.rstrip("/") + "/api/internal/directory",
                                 params={"include_inactive": "true"}, headers={"X-Service-Token": SERVICE_TOKEN}) as resp:
            resp.raise_for_status()
            async for chunk in resp.aiter_bytes():          # read up to the cap, never past it
                body.extend(chunk)
                if len(body) > MAX_DIRECTORY_BYTES:
                    raise ValueError("Pilot's directory is larger than expected")
    data = json.loads(bytes(body))
    if not isinstance(data, list):
        raise ValueError("Pilot's directory is not a list")
    return data


async def pull(db: AsyncSession, project_id: uuid.UUID, directory: list[dict]) -> dict[str, Any]:
    """The project's users made to match `directory`: each person written,
    and a user Pilot sent before but no longer holds deleted. A person whose
    entry is not valid here is left out and counted. An empty directory
    removes nobody: a Pilot just restored or emptied is not a reason to
    lose every user and their accounts."""
    await lock_project(db, project_id)
    rows = await _rows(db, project_id)
    if not directory and any(u.sync_source == PILOT for u in rows):
        raise UserError("Pilot's directory is empty: nobody is removed")
    counts: dict[str, Any] = {"created": 0, "updated": 0, "deleted": 0, "unchanged": 0, "skipped": 0, "invalid": 0,
                              "deleted_emails": []}
    seen: set[str] = set()
    for person in directory:
        try:
            identity = pilot_identity(person)
        except UserError:
            counts["invalid"] += 1
            if isinstance(person, dict):                # kept as it is, not taken for a deletion
                seen.add(str(person.get("email") or "").strip().lower())
            continue
        if identity["email"] in seen:
            continue
        seen.add(identity["email"])
        outcome, user = _apply(rows, project_id, identity)
        if outcome == "created":
            db.add(user)
        counts[outcome] += 1
    for user in rows:
        if user.sync_source == PILOT and user.email not in seen:
            await db.delete(user)
            counts["deleted"] += 1
            counts["deleted_emails"].append(user.email)
    return counts
