"""FEAT-73 lot 1a — the daily loop: collect what is due, purge, alert.

On a fake clock: only the monitors due are collected, a connection already
being read is skipped, one failure does not stop the others; the purge
follows the retention tiers and keeps every change of result; a collection
in error for more than two days in a row is told once to whoever is in
charge of the measure."""
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

import pytest

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, _activate, _connections  # noqa: E402
from sqlalchemy import select  # noqa: E402

from src.collection import scheduler  # noqa: E402
from src.models import CollectionMonitor, CollectionVersion, ProjectControl, ProjectMeasure  # noqa: E402


async def _two_monitors(db):
    """AWS-02 on M-1 (non-compliant) and AWS-10 on M-2 (missing right: error)."""
    aws, _ = await _connections(db)
    db.add(ProjectControl(project_id=A, id=3, framework_id="iso", ref="A.8.13", applicable="", mesures_ids=["M-2"]))
    m2 = await db.get(ProjectMeasure, (A, "M-2"))
    m2.responsable = "it-lead@medsecure.example"
    await db.commit()
    a = await _activate(db, aws, "AWS-02", "M-1")
    b = await _activate(db, aws, "AWS-10", "M-2")
    return aws, uuid.UUID(a["id"]), uuid.UUID(b["id"])


async def _seqs(db, mid):
    db.expunge_all()
    return [v.seq for v in (await db.execute(select(CollectionVersion).where(CollectionVersion.monitor_id == mid)
                                             .order_by(CollectionVersion.seq))).scalars().all()]


@pytest.mark.asyncio
async def test_only_what_is_due_is_collected(monitored_db):
    db = monitored_db
    _, a, b = await _two_monitors(db)
    now = datetime.now(timezone.utc)
    assert (await scheduler.collect_due(db, now + timedelta(hours=1)))["collected"] == 0
    assert (await scheduler.collect_due(db, now + timedelta(hours=25)))["collected"] == 2
    assert await _seqs(db, a) == [1, 2] and await _seqs(db, b) == [1, 2]
    assert (await scheduler.collect_due(db, now + timedelta(hours=26)))["collected"] == 0


@pytest.mark.asyncio
async def test_a_connection_being_read_is_skipped(monitored_db):
    db = monitored_db
    aws, a, _ = await _two_monitors(db)
    async with scheduler.lock_for(aws):
        r = await scheduler.collect_due(db, datetime.now(timezone.utc) + timedelta(hours=25))
    assert r == {"collected": 0, "skipped": 2}


@pytest.mark.asyncio
async def test_one_failing_monitor_does_not_stop_the_others(monitored_db, monkeypatch):
    db = monitored_db
    _, a, b = await _two_monitors(db)
    real = scheduler.collect

    async def flaky(session, m, *args, **kw):
        if m.id == a:
            raise RuntimeError("database hiccup")
        return await real(session, m, *args, **kw)
    monkeypatch.setattr(scheduler, "collect", flaky)
    r = await scheduler.collect_due(db, datetime.now(timezone.utc) + timedelta(hours=25))
    assert r["collected"] == 1 and await _seqs(db, b) == [1, 2]


@pytest.mark.asyncio
async def test_the_purge_follows_the_tiers_and_keeps_the_changes(monitored_db):
    db = monitored_db
    _, a, _ = await _two_monitors(db)
    now = datetime.now(timezone.utc)
    first = (await db.execute(select(CollectionVersion).where(CollectionVersion.monitor_id == a))).scalars().one()
    # 30 days of history, one change of result 20 days ago.
    for i in range(30, 0, -1):
        db.add(CollectionVersion(monitor_id=a, project_id=A, seq=100 - i, collected_at=now - timedelta(days=i),
                                 collector_code="AWS-02", collector_version=1, result="non_conforme",
                                 raw={"x": i}, raw_sha256="h" * 64, findings=[{"resource": "j.martin"}],
                                 result_changed=(i == 20)))
    await db.commit()
    assert await scheduler.purge(db, now) > 0
    db.expunge_all()
    rows = {v.seq: v for v in (await db.execute(select(CollectionVersion).where(CollectionVersion.monitor_id == a))).scalars().all()}
    assert rows[80].purged_at is None and rows[80].raw == {"x": 20}          # the change of result
    assert all(rows[100 - i].purged_at is None for i in range(1, 8))         # the daily tier
    purged = [v for v in rows.values() if v.purged_at is not None]
    assert purged and all(v.raw is None and v.findings is None and v.raw_sha256 == "h" * 64 for v in purged)
    assert rows[first.seq].purged_at is None                                 # the current version


@pytest.mark.asyncio
async def test_two_days_of_errors_are_told_once_to_who_is_in_charge(monitored_db):
    db = monitored_db
    _, _, b = await _two_monitors(db)
    told = []

    def send(to, subject, body):
        told.append((to, subject))
        return True, ""
    now = datetime.now(timezone.utc)
    assert await scheduler.alert_failing(db, now + timedelta(days=1), send) == 0
    assert await scheduler.alert_failing(db, now + timedelta(days=2, hours=1), send) == 1
    assert told == [("it-lead@medsecure.example", "[CISO Toolbox] Automated monitoring failing: AWS-10 on M-2")]
    assert await scheduler.alert_failing(db, now + timedelta(days=3), send) == 0     # once per streak
    m = await db.get(CollectionMonitor, b)
    assert m.alerted_at is not None


@pytest.mark.asyncio
async def test_a_tick_collects_then_runs_the_daily_work_once(monitored_db, monkeypatch):
    db = monitored_db
    await _two_monitors(db)

    class Factory:
        def __call__(self):
            return self

        async def __aenter__(self):
            return db

        async def __aexit__(self, *a):
            return False
    calls = []

    async def fake_purge(session, now):
        calls.append("purge")
        return 0
    monkeypatch.setattr(scheduler, "purge", fake_purge)
    monkeypatch.setattr("src.mailer.send_smtp", lambda *a: (False, "smtp_not_configured"))
    now = datetime.now(timezone.utc) + timedelta(hours=25)
    await scheduler.tick(Factory(), now)
    await scheduler.tick(Factory(), now + timedelta(hours=1))
    assert calls == ["purge"]
