"""FEAT-73 lot 1a — one collection, from the source to the version.

On MedSecure's simulated sources: the version carries the result, the
findings, the exclusions in force, the fingerprint; the monitor remembers
the last result, since when it holds and since when the collection fails.
A failure is a version too. Only the reads the catalog declares happen, and
no socket is ever opened."""
import os
import socket
import sys
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@localhost/db")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
os.environ["ENCRYPTION_KEY"] = "a-test-encryption-key-of-enough-length-0123456789"
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import JSON, event  # noqa: E402
from sqlalchemy.dialects.postgresql import JSONB as _JSONB  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from src.collection.catalog import load_catalog  # noqa: E402
from src.collection.connections import apply_connection_input  # noqa: E402
from src.collection.engine import canonical_sha256  # noqa: E402
from src.collection.providers.simulated import SimulatedProvider  # noqa: E402
from src.collection.service import collect  # noqa: E402
from src.models import (Base, CollectionConnection, CollectionExclusion, CollectionMonitor,  # noqa: E402
                        Derogation, Project, ProjectControl)

for _t in Base.metadata.tables.values():
    for _c in _t.columns:
        if _c.server_default is not None:
            _sd = str(getattr(_c.server_default, "arg", "")).lower()
            if any(k in _sd for k in ("gen_random_uuid", "now(", "::jsonb")):
                _c.server_default = None
        if isinstance(_c.type, _JSONB):
            _c.type = JSON()
ProjectControl.__table__.c.id.autoincrement = False

PID = uuid.uuid4()
NOW = datetime(2026, 11, 17, 3, 0, tzinfo=timezone.utc)


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False},
                                 poolclass=StaticPool)
    event.listen(engine.sync_engine, "connect", lambda conn, _: conn.execute("PRAGMA foreign_keys=ON"))
    async with engine.begin() as c:
        await c.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        session.add(Project(id=PID, name="MedSecure"))
        await session.commit()
        yield session
    await engine.dispose()


async def _monitor(db, code, scenario=None):
    conn = CollectionConnection(id=uuid.uuid4(), project_id=PID, provider="aws" if code.startswith("AWS") else "github")
    settings = {"role_arn": "arn:aws:iam::111122223333:role/ciso-audit"} if conn.provider == "aws" else {"organization": "medsecure"}
    secrets = {"external_id": "x"} if conn.provider == "aws" else {"token": "x"}
    if scenario:
        settings["scenario"] = scenario
    apply_connection_input(conn, {"label": f"MedSecure {code}", "settings": settings, "secrets": secrets}, creating=True)
    db.add(conn)
    m = CollectionMonitor(id=uuid.uuid4(), project_id=PID, connection_id=conn.id, measure_id="M-1",
                          proof_id="P-9", collector_code=code)
    db.add(m)
    await db.commit()
    return conn, m


@pytest.mark.asyncio
async def test_a_collection_writes_a_dated_fingerprinted_version(db):
    _, m = await _monitor(db, "AWS-02")
    v = await collect(db, m, "activation", now=NOW)
    await db.commit()
    assert (v.seq, v.result, v.trigger) == (1, "non_conforme", "activation")
    assert [f["resource"] for f in v.findings] == ["j.martin", "break-glass"]
    assert v.collected_at == NOW and v.data_as_of is not None and v.data_as_of <= datetime.now(timezone.utc)
    assert v.raw_sha256 == canonical_sha256(v.raw) and v.collector_version == 1
    assert v.connection_label == "MedSecure AWS-02" and v.result_changed is True
    assert (m.last_result, m.last_collected_at, m.state_since, m.last_version_id) == ("non_conforme", NOW, NOW, v.id)


@pytest.mark.asyncio
async def test_the_next_collection_numbers_on_and_keeps_the_state_since(db):
    _, m = await _monitor(db, "AWS-02")
    await collect(db, m, "activation", now=NOW)
    v2 = await collect(db, m, "schedule", now=NOW + timedelta(days=1))
    assert v2.seq == 2 and v2.result_changed is False and m.state_since == NOW


@pytest.mark.asyncio
async def test_an_exclusion_in_force_sets_the_finding_aside(db):
    conn, m = await _monitor(db, "AWS-02")
    db.add(CollectionExclusion(project_id=PID, connection_id=conn.id, collector_code="AWS-02", resource="break-glass",
                               resource_hash=canonical_sha256("break-glass"),
                               justification="Emergency account, physical safe, reviewed every quarter",
                               created_by="ciso@medsecure.example"))
    await db.commit()
    v = await collect(db, m, "manual", now=NOW)
    assert [f["resource"] for f in v.findings] == ["j.martin"]
    assert v.excluded[0]["resource"] == "break-glass" and v.excluded[0]["by"] == "ciso@medsecure.example"


@pytest.mark.asyncio
async def test_a_temporary_exclusion_counts_only_once_its_derogation_is_approved(db):
    conn, m = await _monitor(db, "AWS-02")
    der = Derogation(id=uuid.uuid4(), reference="DER-2026-100", subject_type="collection_exclusion", subject_id="x",
                     project_id=str(PID), title="t", justification="j", risk_owner="o", approver="a",
                     valid_from=NOW.date(), valid_until=(NOW + timedelta(days=30)).date(), status="pending_approval")
    db.add(der)
    db.add(CollectionExclusion(project_id=PID, connection_id=conn.id, collector_code="AWS-02", resource="j.martin",
                               resource_hash=canonical_sha256("j.martin"), justification="Leaves on Friday, account closed then",
                               kind="temporary", derogation_id=der.id))
    await db.commit()
    assert [f["resource"] for f in (await collect(db, m, "manual", now=NOW)).findings] == ["j.martin", "break-glass"]
    der.status = "approved"
    await db.commit()
    assert [f["resource"] for f in (await collect(db, m, "manual", now=NOW)).findings] == ["break-glass"]


@pytest.mark.asyncio
async def test_a_missing_right_is_an_error_that_names_it_and_starts_a_streak(db):
    conn, m = await _monitor(db, "AWS-10")                     # MedSecure's role lacks the backup listing
    v = await collect(db, m, "activation", now=NOW)
    assert (v.result, v.missing_permission) == ("erreur", "backup:ListBackupJobs")
    assert m.error_since == NOW
    await collect(db, m, "schedule", now=NOW + timedelta(days=1))
    assert m.error_since == NOW                                # the streak goes on
    conn.settings = {**conn.settings, "scenario": "complete"}
    await db.commit()
    v = await collect(db, m, "schedule", now=NOW + timedelta(days=2))
    assert v.result == "conforme" and m.error_since is None


@pytest.mark.asyncio
async def test_a_crash_becomes_an_error_version(db):
    _, m = await _monitor(db, "AWS-04")

    class Broken:
        async def fetch(self, *a):
            raise RuntimeError("boom")
    v = await collect(db, m, "manual", now=NOW, provider=Broken())
    assert v.result == "erreur" and v.reason == "collection failed: RuntimeError"


@pytest.mark.asyncio
async def test_only_declared_reads_and_no_socket(db, monkeypatch):
    def no_socket(*a, **k):
        raise AssertionError("a collection opened a socket")
    monkeypatch.setattr(socket, "socket", no_socket)
    monkeypatch.setattr(socket, "create_connection", no_socket)
    cat = load_catalog()
    for c in cat.collectors():
        _, m = await _monitor(db, c["code"], scenario="complete")
        provider = SimulatedProvider()
        v = await collect(db, m, "manual", now=NOW, provider=provider)
        assert v.result != "erreur", (c["code"], v.reason)
        assert set(provider.calls) <= set(c["reads"]), c["code"]
