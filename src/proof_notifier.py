"""Daily proof-expiry notifier for the Compliance module.

In-process asyncio loop (same pattern as Asset's renewal_scheduler): ticks
every COMPLIANCE_PROOF_TICK_SECONDS but only acts once per
COMPLIANCE_PROOF_INTERVAL_HOURS, gated by the ``proof_notify.last_run`` row in
app_settings so the cadence survives restarts. On each run it scans every
project proof whose ``date_expiration`` falls within the notice window
(COMPLIANCE_PROOF_LEAD_DAYS, default 90 — mirrors the frontend's
``ctDateStatus(p.date_expiration, 90)`` orange state) or is already past, and
emails a single digest.

Anti-spam: the digest is only (re)sent when the due set CHANGED since the last
send, or every COMPLIANCE_PROOF_REMIND_DAYS (default 7) as a reminder while
proofs stay due — not every day.

Recipients = proof.owner fields that look like an email, plus
COMPLIANCE_PROOF_RECIPIENTS (env, comma-separated), plus project owners.
"""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import date, datetime, timezone
from html import escape as h_esc

from sqlalchemy import select

from src.database import async_session
from src.mailer import send_smtp
from src.models import AppSettings, Project, ProjectMeasure, ProjectProof, User

logger = logging.getLogger("compliance-proof-notify")

TICK_SECONDS = int(os.getenv("COMPLIANCE_PROOF_TICK_SECONDS", "3600"))
INTERVAL_HOURS = int(os.getenv("COMPLIANCE_PROOF_INTERVAL_HOURS", "24"))
LEAD_DAYS = int(os.getenv("COMPLIANCE_PROOF_LEAD_DAYS", "90"))
REMIND_DAYS = int(os.getenv("COMPLIANCE_PROOF_REMIND_DAYS", "7"))


def _parse(d) -> date | None:
    if not d:
        return None
    try:
        return date.fromisoformat(str(d)[:10])
    except (TypeError, ValueError):
        return None


def compute_expiring_proofs(proofs, today: date, lead: int = LEAD_DAYS) -> list[dict]:
    """Proofs expired or expiring within the notice window.

    Pure function (no DB) so it can be unit-tested. Returns dicts with
    project_id, proof_id, label, owner, date (iso str), days (signed,
    <0 = expired), sorted soonest first.
    """
    out: list[dict] = []
    for p in proofs:
        d = _parse(p.date_expiration)
        if d is None:
            continue
        days = (d - today).days
        if days > lead:
            continue
        out.append({
            "project_id": p.project_id, "proof_id": p.id,
            "label": p.label or p.id, "owner": (p.owner or "").strip(),
            "date": d.isoformat(), "days": days,
        })
    out.sort(key=lambda e: e["days"])
    return out


def _days_label(days: int) -> str:
    if days == 0:
        return "expire aujourd'hui"
    if days < 0:
        return f"expirée depuis {-days} j"
    return f"expire dans {days} j"


def build_digest_html(due: list[dict], today: date, project_names: dict) -> str:
    rows = ""
    for e in due:
        color = "#dc2626" if e["days"] < 0 else ("#f97316" if e["days"] <= 30 else "#eab308")
        rows += (
            "<tr>"
            f"<td style='padding:6px 10px'>{h_esc(project_names.get(str(e['project_id']), ''))}</td>"
            f"<td style='padding:6px 10px;font-weight:600'>{h_esc(e['label'])}</td>"
            f"<td style='padding:6px 10px'>{h_esc(e['owner'])}</td>"
            f"<td style='padding:6px 10px'>{h_esc(e['date'])}</td>"
            f"<td style='padding:6px 10px;color:{color};font-weight:600'>{h_esc(_days_label(e['days']))}</td>"
            "</tr>"
        )
    return (
        "<div style='font-family:Arial,sans-serif;color:#1e293b'>"
        f"<h2 style='color:#0f172a'>Preuves de conformité à renouveler — {len(due)}</h2>"
        f"<p style='color:#64748b'>Au {today.isoformat()}, les preuves suivantes sont "
        "expirées ou arrivent à expiration. Une preuve expirée invalide le statut "
        "« appliqué » des mesures qui s'appuient dessus.</p>"
        "<table style='border-collapse:collapse;font-size:14px'>"
        "<thead><tr style='background:#f1f5f9;text-align:left'>"
        "<th style='padding:6px 10px'>Projet</th><th style='padding:6px 10px'>Preuve</th>"
        "<th style='padding:6px 10px'>Responsable</th><th style='padding:6px 10px'>Expiration</th>"
        "<th style='padding:6px 10px'>Échéance</th>"
        f"</tr></thead><tbody>{rows}</tbody></table>"
        "<p style='color:#94a3b8;font-size:12px;margin-top:16px'>CISO Toolbox · Compliance</p>"
        "</div>"
    )


async def _collect_recipients(db, due: list[dict]) -> list[str]:
    recips: set[str] = set()
    for r in os.getenv("COMPLIANCE_PROOF_RECIPIENTS", "").split(","):
        r = r.strip()
        if r:
            recips.add(r)
    for e in due:
        if "@" in e["owner"]:
            recips.add(e["owner"])
    owner_ids = (await db.execute(
        select(Project.owner_id).where(Project.owner_id.isnot(None))
    )).scalars().all()
    if owner_ids:
        emails = (await db.execute(
            select(User.email).where(User.id.in_(owner_ids))
        )).scalars().all()
        for e in emails:
            if e:
                recips.add(e)
    return sorted(recips)


def _fingerprint(due: list[dict]) -> str:
    return "|".join(sorted(f"{e['project_id']}:{e['proof_id']}:{e['date']}" for e in due))


def measure_auto_key(e: dict) -> str:
    """Dedup signature of the auto-created measure for one expired proof."""
    return f"{e['proof_id']}:{e['date']}"


def _next_measure_num(existing_ids) -> int:
    """Highest numeric suffix across existing measure ids (0 when none).

    Digit-based so it spans the legacy M-NNN ids and the unified MES-NNN
    ones (FEAT-32) without colliding with either."""
    import re as _re
    top = 0
    for mid in existing_ids:
        m = _re.search(r"(\d+)$", str(mid))
        if m:
            top = max(top, int(m.group(1)))
    return top


async def _ensure_measures(db, due: list[dict]) -> int:
    """Materialise one measure per EXPIRED proof, idempotently.

    Dedup key auto_key = "<proof_id>:<date_expiration>" with a unique index
    on (project_id, auto_key), so re-running the daily tick never duplicates
    a measure (same pattern as Asset FEAT-22). Only proofs already past
    their expiration date (days < 0) get a measure — the notice-window ones
    are covered by the email digest. Independent of the digest send. Does
    not commit — the caller owns the transaction.
    """
    expired = [e for e in due if e["days"] < 0]
    if not expired:
        return 0
    rows = await db.execute(
        select(ProjectMeasure.project_id, ProjectMeasure.id, ProjectMeasure.auto_key))
    existing_keys: set = set()
    ids_by_project: dict = {}
    for pid, mid, key in rows.all():
        ids_by_project.setdefault(str(pid), []).append(mid)
        if key:
            existing_keys.add((str(pid), key))
    next_num: dict = {}
    created = 0
    for e in expired:
        pid = e["project_id"]
        pid_s = str(pid)
        key = measure_auto_key(e)
        if (pid_s, key) in existing_keys:
            continue
        if pid_s not in next_num:
            next_num[pid_s] = _next_measure_num(ids_by_project.get(pid_s, []))
        next_num[pid_s] += 1
        note = {
            "at": datetime.now(timezone.utc).isoformat(),
            "by": "système",
            "text": f"Mesure générée automatiquement — preuve expirée le {e['date']}.",
        }
        db.add(ProjectMeasure(
            project_id=pid,
            id=f"MES-{next_num[pid_s]:03d}",
            sort_order=next_num[pid_s],
            description=f"Renouveler la preuve : {e['label']}",
            details=f"La preuve {e['proof_id']} ({e['label']}) a expiré le {e['date']}. "
                    "La renouveler puis mettre à jour sa date d'expiration.",
            statut="planifie",
            date_cible=e["date"],
            responsable=e["owner"],
            preuves_ids=[e["proof_id"]],
            progress_log=[note],
            auto_key=key,
        ))
        existing_keys.add((pid_s, key))
        created += 1
    if created:
        # FEAT-33 — scheduler measures are server-initiated writes.
        from src.routes.internal import bump_server_rev
        for pid_s2 in set(str(e["project_id"]) for e in expired):
            await bump_server_rev(db, pid_s2)
    return created


async def run_now(db, force: bool = False) -> dict:
    """Run a proof-expiry check immediately (no cadence gate). Returns a summary.

    Used by the scheduler tick and by POST /api/internal/proof-notify-run
    (tests / on-demand). Does not commit — the caller owns the transaction.
    ``force=True`` bypasses the set-changed/remind anti-spam gate.
    """
    today = datetime.now(timezone.utc).date()
    proofs = (await db.execute(select(ProjectProof))).scalars().all()
    due = compute_expiring_proofs(proofs, today)
    # Materialise measures regardless of whether a digest goes out (recipients
    # may be unconfigured) — the action plan must always be populated.
    measures_created = await _ensure_measures(db, due)
    if not due:
        return {"due_count": 0, "sent": False, "reason": "no_due",
                "measures_created": measures_created}

    if not force:
        last_set = await _get_setting(db, "proof_notify.last_set")
        last_sent = await _get_setting(db, "proof_notify.last_sent")
        unchanged = last_set == _fingerprint(due)
        recent = False
        if last_sent:
            try:
                recent = (datetime.now(timezone.utc) - datetime.fromisoformat(last_sent)) \
                    .total_seconds() < REMIND_DAYS * 86400
            except ValueError:
                pass
        if unchanged and recent:
            return {"due_count": len(due), "sent": False, "reason": "unchanged_recent",
                    "measures_created": measures_created}

    recipients = await _collect_recipients(db, due)
    if not recipients:
        return {"due_count": len(due), "sent": False, "reason": "no_recipients",
                "measures_created": measures_created}

    names = {str(p.id): (p.name or "") for p in
             (await db.execute(select(Project))).scalars().all()}
    html = build_digest_html(due, today, names)
    subject = f"[CISO Toolbox] {len(due)} preuve(s) de conformité à renouveler"
    sent_to, errors = [], []
    for r in recipients:
        ok, err = await asyncio.to_thread(send_smtp, r, subject, html)
        if ok:
            sent_to.append(r)
        else:
            errors.append({"to": r, "error": err})
    if sent_to:
        await _set_setting(db, "proof_notify.last_set", _fingerprint(due))
        await _set_setting(db, "proof_notify.last_sent", datetime.now(timezone.utc).isoformat())
    return {"due_count": len(due), "sent": bool(sent_to),
            "recipients": sent_to, "errors": errors,
            "measures_created": measures_created}


async def _get_setting(db, key: str) -> str | None:
    row = await db.get(AppSettings, key)
    return row.value if row else None


async def _set_setting(db, key: str, value: str) -> None:
    row = await db.get(AppSettings, key)
    if row is None:
        db.add(AppSettings(key=key, value=value))
    else:
        row.value = value


async def _maybe_run() -> None:
    async with async_session() as db:
        now = datetime.now(timezone.utc)
        last = await _get_setting(db, "proof_notify.last_run")
        if last:
            try:
                if (now - datetime.fromisoformat(last)).total_seconds() < INTERVAL_HOURS * 3600:
                    return
            except ValueError:
                pass
        result = await run_now(db)
        # Journal only when a digest actually went out or measures were
        # created — routine no-op ticks stay silent (same signal/noise rule
        # as measures.sync).
        if (result or {}).get("sent") or (result or {}).get("measures_created"):
            from src.audit import log_write
            await log_write(db, None, None, "proof.expiry_digest", actor="scheduler",
                            entity_type="proof", details=result)
        await _set_setting(db, "proof_notify.last_run", now.isoformat())
        await db.commit()
        logger.info("proof-expiry check: %s", result)


async def run_scheduler() -> None:
    await asyncio.sleep(15)  # let the DB warm up
    logger.info("proof-expiry scheduler started (tick=%ds, interval=%dh, lead=%dd, remind=%dd)",
                TICK_SECONDS, INTERVAL_HOURS, LEAD_DAYS, REMIND_DAYS)
    while True:
        try:
            await _maybe_run()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("proof-expiry tick failed")
        await asyncio.sleep(TICK_SECONDS)
