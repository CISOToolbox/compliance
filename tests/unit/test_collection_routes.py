"""FEAT-73 lot 1a — the connection routes.

A connection created in one project does not exist in another; its secrets
never come back; testing it names the rights it lacks."""
import os
import sys
import uuid

import pytest
import pytest_asyncio
from fastapi import HTTPException

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@localhost/db")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
os.environ["ENCRYPTION_KEY"] = "a-test-encryption-key-of-enough-length-0123456789"
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import JSON  # noqa: E402
from sqlalchemy.dialects.postgresql import JSONB as _JSONB  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from starlette.requests import Request  # noqa: E402

from src.models import Base, Project, ProjectControl  # noqa: E402
from src.routes import collection as r  # noqa: E402
from src.schemas import ConnectionCreate, ConnectionUpdate  # noqa: E402

for _t in Base.metadata.tables.values():
    for _c in _t.columns:
        if _c.server_default is not None:
            _sd = str(getattr(_c.server_default, "arg", "")).lower()
            if any(k in _sd for k in ("gen_random_uuid", "now(", "::jsonb")):
                _c.server_default = None
        if isinstance(_c.type, _JSONB):
            _c.type = JSON()
ProjectControl.__table__.c.id.autoincrement = False

A, B = uuid.uuid4(), uuid.uuid4()
AWS = ConnectionCreate(provider="aws", label="MedSecure production",
                       settings={"role_arn": "arn:aws:iam::111122223333:role/ciso-audit"},
                       secrets={"external_id": "s3cr3t-external-id"})


def _req():
    return Request({"type": "http", "method": "POST", "path": "/api", "headers": [], "query_string": b"",
                    "client": ("127.0.0.1", 1)})


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False},
                                 poolclass=StaticPool)
    async with engine.begin() as c:
        await c.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        session.add_all([Project(id=A, name="MedSecure"), Project(id=B, name="Other")])
        await session.commit()
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_a_connection_lives_in_its_project_only(db):
    c = await r.create_connection(A, AWS, _req(), user=None, db=db)
    assert [x["id"] for x in await r.list_connections(A, user=None, db=db)] == [c["id"]]
    assert await r.list_connections(B, user=None, db=db) == []
    for call in (lambda: r.update_connection(B, uuid.UUID(c["id"]), ConnectionUpdate(label="x"), _req(), user=None, db=db),
                 lambda: r.test_connection(B, uuid.UUID(c["id"]), user=None, db=db),
                 lambda: r.delete_connection(B, uuid.UUID(c["id"]), _req(), user=None, db=db)):
        with pytest.raises(HTTPException) as e:
            await call()
        assert e.value.status_code == 404


@pytest.mark.asyncio
async def test_no_route_serves_a_secret(db):
    c = await r.create_connection(A, AWS, _req(), user=None, db=db)
    listed = await r.list_connections(A, user=None, db=db)
    updated = await r.update_connection(A, uuid.UUID(c["id"]), ConnectionUpdate(label="prod"), _req(), user=None, db=db)
    for payload in (c, listed, updated):
        assert "s3cr3t" not in str(payload)
    assert updated["secrets"] == {"external_id": {"set": True}} and updated["label"] == "prod"


@pytest.mark.asyncio
async def test_testing_a_connection_names_the_rights_it_lacks(db):
    c = await r.create_connection(A, AWS, _req(), user=None, db=db)
    res = await r.test_connection(A, uuid.UUID(c["id"]), user=None, db=db)
    assert res["ok"] is True and res["partial"] is True
    assert res["missing_permissions"] == ["backup:ListBackupJobs"]
    shown = (await r.list_connections(A, user=None, db=db))[0]["last_test"]
    assert shown["ok"] is True and shown["missing_permissions"] == ["backup:ListBackupJobs"]


@pytest.mark.asyncio
async def test_a_connection_without_any_access_fails_its_test(db):
    body = AWS.model_copy(update={"settings": {**AWS.settings, "scenario": "no-access"}})
    c = await r.create_connection(A, body, _req(), user=None, db=db)
    assert (await r.test_connection(A, uuid.UUID(c["id"]), user=None, db=db))["ok"] is False


@pytest.mark.asyncio
@pytest.mark.parametrize("body, status", [
    (AWS.model_copy(update={"provider": "gitlab"}), 422),
    (AWS.model_copy(update={"mode": "live"}), 422),
    (AWS.model_copy(update={"secrets": {}}), 422),
])
async def test_a_bad_connection_is_refused(db, body, status):
    with pytest.raises(HTTPException) as e:
        await r.create_connection(A, body, _req(), user=None, db=db)
    assert e.value.status_code == status


@pytest.mark.asyncio
async def test_two_connections_of_a_provider_need_two_names(db):
    await r.create_connection(A, AWS, _req(), user=None, db=db)
    with pytest.raises(HTTPException) as e:
        await r.create_connection(A, AWS, _req(), user=None, db=db)
    assert e.value.status_code == 409
    await r.create_connection(B, AWS, _req(), user=None, db=db)        # another project: its own


@pytest.mark.asyncio
async def test_without_an_encryption_key_the_server_says_so(db, monkeypatch):
    import src.settings_crypto as crypto
    monkeypatch.delenv("ENCRYPTION_KEY")
    monkeypatch.setattr(crypto, "_KEY", None)
    with pytest.raises(HTTPException) as e:
        await r.create_connection(A, AWS, _req(), user=None, db=db)
    assert e.value.status_code == 503 and "ENCRYPTION_KEY" in e.value.detail


@pytest.mark.asyncio
async def test_the_catalog_route_lists_both_providers():
    cat = await r.list_collectors(user=None)
    assert {p["provider"] for p in cat["providers"]} == {"aws", "github"}
    assert len(cat["collectors"]) == 21 and "iso:A.8.5" in cat["collectors"][1]["requirement_keys"]
