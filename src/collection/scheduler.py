"""FEAT-73 — the daily loop of the automated monitoring.

Each tick collects the active monitors whose last attempt is older than the
interval, one connection at a time (a connection already being read is
skipped, not queued); a failure is an `erreur` version and never stops the
others. Once a day it purges the versions their retention no longer keeps,
and alerts the people in charge of a measure whose collection has been in
error for more than two days in a row, or whose collector a new catalog
retired (once: that monitoring stopped).

    COMPLIANCE_COLLECT_TICK_SECONDS     300
    COMPLIANCE_COLLECT_INTERVAL_HOURS   24
"""
from __future__ import annotations

import asyncio
import html
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.collection.catalog import load_catalog
from src.collection.retention import retained_ids
from src.collection.service import RETIRED_REASON, collect, lock_for
from src.models import CollectionMonitor, CollectionVersion, Project, ProjectMeasure, User

logger = logging.getLogger(__name__)

TICK_SECONDS = int(os.getenv("COMPLIANCE_COLLECT_TICK_SECONDS", "300"))
INTERVAL_HOURS = int(os.getenv("COMPLIANCE_COLLECT_INTERVAL_HOURS", "24"))
ALERT_AFTER = timedelta(days=2)
RETIRED_TOLD_WITHIN = timedelta(days=30)


async def collect_due(db: AsyncSession, now: datetime, provider: Any = None) -> dict:
    """Collect every active monitor due at ``now``."""
    due_before = now - timedelta(hours=INTERVAL_HOURS)
    monitors = (await db.execute(select(CollectionMonitor).where(
        CollectionMonitor.active.is_(True),
        or_(CollectionMonitor.last_attempt_at.is_(None), CollectionMonitor.last_attempt_at <= due_before))
        .order_by(CollectionMonitor.connection_id))).scalars().all()
    done = skipped = 0
    # Ids first: a failed collection rolls the session back, which expires
    # every row it had loaded.
    for mid, connection_id in [(m.id, m.connection_id) for m in monitors]:
        lock = lock_for(connection_id)
        if lock.locked():
            skipped += 1
            continue
        # Claim the run in the database: another process (a second worker)
        # that saw the same monitor due finds it taken.
        claimed = await db.execute(update(CollectionMonitor).where(
            CollectionMonitor.id == mid,
            or_(CollectionMonitor.last_attempt_at.is_(None), CollectionMonitor.last_attempt_at <= due_before))
            .values(last_attempt_at=now).execution_options(synchronize_session=False))
        await db.commit()
        if claimed.rowcount != 1:
            skipped += 1
            continue
        async with lock:
            try:
                m = await db.get(CollectionMonitor, mid, populate_existing=True)
                await collect(db, m, "schedule", now=now, provider=provider)
                await db.commit()
                done += 1
            except Exception:  # noqa: BLE001 — one monitor never stops the others
                await db.rollback()
                logger.exception("scheduled collection of %s failed", mid)
    return {"collected": done, "skipped": skipped}


def _empty(v: CollectionVersion, now: datetime) -> None:
    v.purged_at = now
    v.raw = v.findings = v.excluded = v.unreadable = v.scope = None


async def purge(db: AsyncSession, now: datetime) -> int:
    """Empty the versions their retention no longer keeps; their result,
    counts, dates and fingerprint stay in the history."""
    purged = 0
    cat = load_catalog()
    for m in (await db.execute(select(CollectionMonitor))).scalars().all():
        profile = m.retention or cat.describe(m.collector_code)["retention"]
        versions = (await db.execute(select(CollectionVersion).where(CollectionVersion.monitor_id == m.id))).scalars().all()
        keep = retained_ids(versions, profile, now)
        for v in versions:
            if v.id not in keep and v.purged_at is None:
                _empty(v, now)
                purged += 1
    await db.commit()
    return purged


async def _recipients(db: AsyncSession, m: CollectionMonitor) -> list[str]:
    """Who is told: the person in charge of the measure (an e-mail address),
    the project's owner, the module's configured recipients."""
    out = {r.strip() for r in os.getenv("COMPLIANCE_PROOF_RECIPIENTS", "").split(",") if r.strip()}
    measure = await db.get(ProjectMeasure, (m.project_id, m.measure_id))
    if measure is not None and "@" in (measure.responsable or ""):
        out.add(measure.responsable.strip())
    project = await db.get(Project, m.project_id)
    if project is not None and project.owner_id:
        owner = await db.get(User, project.owner_id)
        if owner is not None and owner.email:
            out.add(owner.email)
    return sorted(out)


def _alert_html(m: CollectionMonitor, title: str, since: datetime, reason: str) -> str:
    e = html.escape
    return (f"<p>The automated monitoring <b>{e(m.collector_code)} — {e(title)}</b> of measure "
            f"<b>{e(m.measure_id)}</b> has failed since {e(since.date().isoformat())}: {e(reason or 'unknown reason')}.</p>"
            "<p>Its proof cannot be assessed until the collection works again. Check the connection in Compliance.</p>")


async def alert_failing(db: AsyncSession, now: datetime, send: Callable[[str, str, str], tuple[bool, str]]) -> int:
    """Tell once per streak about a collection in error for more than two
    days in a row."""
    sent = 0
    rows = (await db.execute(select(CollectionMonitor).where(
        CollectionMonitor.active.is_(True), CollectionMonitor.error_since.is_not(None),
        CollectionMonitor.alerted_at.is_(None)))).scalars().all()
    for m in rows:
        since = m.error_since if m.error_since.tzinfo else m.error_since.replace(tzinfo=timezone.utc)
        if now - since <= ALERT_AFTER:
            continue
        last = await db.get(CollectionVersion, m.last_version_id) if m.last_version_id else None
        reason = (last.missing_permission and f"missing right {last.missing_permission}") or (last.reason if last else "")
        title = load_catalog().describe(m.collector_code)["title"]["en"]
        subject = f"[CISO Toolbox] Automated monitoring failing: {m.collector_code} on {m.measure_id}"
        told = False
        for to in await _recipients(db, m):
            ok, _ = await asyncio.to_thread(send, to, subject, _alert_html(m, title, since, reason))
            told = told or ok
        if told:
            m.alerted_at = now
            sent += 1
    await db.commit()
    return sent


def _retired_html(m: CollectionMonitor) -> str:
    e = html.escape
    return (f"<p>The automated monitoring <b>{e(m.collector_code)}</b> of measure <b>{e(m.measure_id)}</b> "
            "has stopped: this collector is no longer in the catalog.</p>"
            "<p>Its history is kept. Activate another collector on the measure, or check it manually.</p>")


async def alert_retired(db: AsyncSession, now: datetime, send: Callable[[str, str, str], tuple[bool, str]]) -> int:
    """Tell once about a monitoring the system stopped because its collector
    was retired — within a month: a recipient found later gets no stale news."""
    sent = 0
    rows = (await db.execute(select(CollectionMonitor).where(
        CollectionMonitor.active.is_(False), CollectionMonitor.deactivated_by == "system",
        CollectionMonitor.deactivation_reason == RETIRED_REASON, CollectionMonitor.alerted_at.is_(None),
        CollectionMonitor.deactivated_at > now - RETIRED_TOLD_WITHIN))).scalars().all()
    for m in rows:
        subject = f"[CISO Toolbox] Automated monitoring stopped, collector retired: {m.collector_code} on {m.measure_id}"
        told = False
        for to in await _recipients(db, m):
            ok, _ = await asyncio.to_thread(send, to, subject, _retired_html(m))
            told = told or ok
        if told:
            m.alerted_at = now
            sent += 1
    await db.commit()
    return sent


async def tick(db_factory: Any, now: datetime | None = None) -> None:
    from src.mailer import send_smtp
    from src.proof_notifier import _get_setting, _set_setting
    now = now or datetime.now(timezone.utc)
    async with db_factory() as db:
        result = await collect_due(db, now)
        if result["collected"]:
            logger.info("automated monitoring: %s", result)
    async with db_factory() as db:
        last = await _get_setting(db, "collect.last_daily")
        if last and now - datetime.fromisoformat(last) < timedelta(hours=23):
            return
        purged = await purge(db, now)
        alerted = await alert_failing(db, now, send_smtp) + await alert_retired(db, now, send_smtp)
        await _set_setting(db, "collect.last_daily", now.isoformat())
        await db.commit()
        if purged or alerted:
            logger.info("automated monitoring daily: %d version(s) purged, %d alert(s)", purged, alerted)


async def run_scheduler() -> None:
    from src.database import async_session
    await asyncio.sleep(20)  # let the DB warm up
    logger.info("automated monitoring scheduler started (tick=%ds, interval=%dh)", TICK_SECONDS, INTERVAL_HOURS)
    while True:
        try:
            await tick(async_session)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("automated monitoring tick failed")
        await asyncio.sleep(TICK_SECONDS)
