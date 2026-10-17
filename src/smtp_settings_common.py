# -----------------------------------------------------------------------------
# Generated file - do not edit.
# It is overwritten at every release; a change made here is lost.
# See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""SMTP settings router shared by the backend modules that send mail.

Identical copy in the ``src/`` of every module that mounts it (no runtime
shared dependency); keep the copies identical — the next release overwrites
them.

In the suite, Pilot owns the SMTP server config and pushes it through
``PUT /api/internal/smtp``; this router then only reports it (``managed``)
and refuses writes with 409. In standalone (``AUTH_MODE != "pilot"``) it is
the module's own way to set it: it writes the same ``app_settings`` rows
``smtp.<field>`` the Pilot push mirrors into (password encrypted at rest),
and updates the module's in-memory config so the next mail uses it without a
restart. The fields follow the suite contract (``host, port, user, password,
from_addr, tls``). Saving an empty host removes the whole saved config: the
``SMTP_*`` environment then applies, if set.

Mount it with the dict the module's senders read::

    from src.routes.internal import _smtp_config
    router = make_smtp_router(state=_smtp_config, default_from="asset@cisotoolbox.local")

SMTP host check: the host goes through ``ssrf_guard.resolve_safe_target``
with ``allow_private=True`` — a standalone deployment typically relays
through an on-site server on a private address, while loopback, link-local
(cloud metadata), unspecified addresses and the suite's own services are
refused, whatever the notation (``127.1``, ``2130706433``…). It is checked
when saved and again right before the test mail connects. A host set in the
``SMTP_*`` environment is the operator's and is not checked, as for a Pilot
push. Credentials from the environment never go to a host saved here.
"""
from __future__ import annotations

import asyncio
import html
import ipaddress
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import get_current_user, require_admin
from src.auth_common import AUTH_MODE, MODULE_NAME
from src.database import get_db
from src.mailer_common import resolve_pushed_config, send_html_email
from src.models import AppSettings, User
from src.settings_crypto import decrypt_setting, encrypt_setting_or_plain
from src.ssrf_guard import resolve_safe_target

SMTP_FIELDS = ("host", "port", "user", "password", "from_addr", "tls")

_HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}\.?$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(?:\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.?$")
_EMAIL_RE = re.compile(r"^[^@\s<>,;\"']+@[^@\s<>,;\"']+\.[^@\s<>,;\"']+$")


class SmtpConfigIn(BaseModel):
    host: str = Field("", max_length=255)
    port: int = Field(587, ge=1, le=65535)
    user: str = Field("", max_length=320)
    password: str = Field("", max_length=1024)  # blank keeps the stored one
    from_addr: str = Field("", max_length=320)
    tls: bool = True


class SmtpTestIn(BaseModel):
    to: str = Field(..., max_length=320)


def _normalise_host(host: str) -> str:
    """Brackets and a trailing dot removed, an IP literal in canonical form —
    the shape the resolver and smtplib accept."""
    literal = host[1:-1] if host.startswith("[") and host.endswith("]") else host
    literal = literal.rstrip(".")
    try:
        return str(ipaddress.ip_address(literal))
    except ValueError:
        return literal


def _check_host(host: str) -> None:
    """Raise ValueError unless ``host`` is a well-formed, reachable-safe relay."""
    literal = _normalise_host(host)
    try:
        ipaddress.ip_address(literal)
    except ValueError:
        if not _HOSTNAME_RE.match(literal):
            raise ValueError("not a valid host name")
    resolve_safe_target(literal, allow_private=True)


def _clean_host(raw: str) -> str:
    host = (raw or "").strip()
    if not host:
        return ""
    try:
        _check_host(host)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"SMTP host refused: {e}")
    return _normalise_host(host)


def _clean_email(raw: str) -> str:
    value = (raw or "").strip()
    if not value or "\r" in value or "\n" in value or not _EMAIL_RE.match(value):
        raise HTTPException(status_code=400, detail="Invalid email address")
    return value


def _clean_line(raw: str, label: str) -> str:
    value = (raw or "").strip()
    if "\r" in value or "\n" in value:
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return value


def _tls_on(raw: str | None) -> bool:
    return str(raw if raw not in (None, "") else "true").strip().lower() not in ("0", "false", "no", "off")


def _port(raw: str | None) -> int:
    try:
        port = int(str(raw).strip())
    except (TypeError, ValueError):
        return 587
    return port if 1 <= port <= 65535 else 587


async def _rows(db: AsyncSession) -> dict:
    return {row.key: row for row in
            (await db.execute(select(AppSettings).where(AppSettings.key.like("smtp.%")))).scalars()}


def _field(rows: dict, field: str) -> str:
    row = rows.get(f"smtp.{field}")
    value = (row.value or "") if row is not None else ""
    return decrypt_setting(value) if field == "password" and value else value


def make_smtp_router(state: dict, default_from: str) -> APIRouter:
    """Router serving ``/api/smtp/{config,test}`` for one module.

    ``state`` is the module's in-memory SMTP dict (the one its senders read);
    ``default_from`` is the sender used when neither ``from_addr`` nor
    ``user`` is set, as the module's mailer already does.
    """
    router = APIRouter(prefix="/api/smtp", tags=["smtp"])

    @router.get("/config")
    async def smtp_get_config(user: User = Depends(get_current_user),
                              db: AsyncSession = Depends(get_db)):
        rows = await _rows(db)
        return {
            "host": _field(rows, "host"),
            "port": _port(_field(rows, "port")),
            "user": _field(rows, "user"),
            "from_addr": _field(rows, "from_addr"),
            "tls": _tls_on(_field(rows, "tls")),
            "password_set": bool(_field(rows, "password")),
            # Suite: the server config is Pilot's; the UI shows it read-only.
            "managed": AUTH_MODE == "pilot",
        }

    @router.put("/config")
    async def smtp_set_config(body: SmtpConfigIn, user: User = Depends(get_current_user),
                              db: AsyncSession = Depends(get_db)):
        require_admin(user)
        if AUTH_MODE == "pilot":
            raise HTTPException(status_code=409,
                                detail="SMTP is managed in Pilot (Settings) in suite mode.")
        host = await asyncio.to_thread(_clean_host, body.host)  # resolves the name
        if "\r" in body.password or "\n" in body.password:
            raise HTTPException(status_code=400, detail="Invalid SMTP password")
        rows = await _rows(db)
        if not host:
            # No host: no saved config at all, so the SMTP_* environment applies.
            for row in rows.values():
                await db.delete(row)
            await db.commit()
            state.clear()
            return {"ok": True}
        password = body.password or _field(rows, "password")
        fields = {
            "host": host,
            "port": str(body.port),
            "user": _clean_line(body.user, "SMTP user"),
            "from_addr": _clean_email(body.from_addr) if body.from_addr.strip() else "",
            "tls": "true" if body.tls else "false",
            "password": password,
        }
        for field, value in fields.items():
            stored = encrypt_setting_or_plain(value) if field == "password" else value
            row = rows.get(f"smtp.{field}")
            if row is None:
                db.add(AppSettings(key=f"smtp.{field}", value=stored))
            else:
                row.value = stored
        await db.commit()
        # The state is what was just committed — no second read that could fail.
        state.clear()
        state.update({k: v for k, v in fields.items() if v})
        return {"ok": True}

    @router.post("/test")
    async def smtp_test(body: SmtpTestIn, user: User = Depends(get_current_user)):
        require_admin(user)
        to = _clean_email(body.to)
        cfg = resolve_pushed_config(state, default_from)
        if not cfg.get("host"):
            raise HTTPException(status_code=409, detail="SMTP not configured")
        label = html.escape(MODULE_NAME or "module")
        ok, err = await asyncio.to_thread(
            send_html_email, cfg, to, f"CISO Toolbox — SMTP test ({MODULE_NAME or 'module'})",
            f"<p>Test message from the CISO Toolbox <strong>{label}</strong> module.</p>"
            "<p>If you received it, outgoing mail is configured.</p>",
            # Saved hosts are an admin's input and are checked; a host set in
            # the environment is the operator's, trusted like a Pilot push and
            # like every real send.
            host_validator=_check_host if state.get("host") else None)
        if not ok:
            raise HTTPException(status_code=502, detail=f"SMTP delivery failed: {err[:500]}")
        return {"ok": True}

    return router
