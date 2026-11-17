"""FEAT-73 lot 0 — every proof has a source: `manual` or `collected`.

A collected proof will be written by the server alone, from a connector. The
source is therefore never taken from the client: neither the targeted routes
nor the whole-project save nor an imported file can set it. A save keeps the
source the proof had; a new proof is manual; a restore from a backup, which
the server itself produced, gives back the sources it holds. The exported
model carries the source (schema rev 2), and an older export migrates."""
import os
import sys
import uuid

import pytest
import pytest_asyncio

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@localhost/db")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
os.environ.setdefault("SERVICE_TOKEN", "svc-token-for-tests-0123456789abcdef")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import JSON, select  # noqa: E402
from sqlalchemy.dialects.postgresql import JSONB as _JSONB  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from src.models import Base, Project, ProjectControl, ProjectProof  # noqa: E402
from src.schemas import ProjectUpdate, ProofCreate, ProofUpdate  # noqa: E402

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


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False},
                                 poolclass=StaticPool)
    async with engine.begin() as c:
        await c.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        session.add(Project(id=PID, name="MedSecure"))
        session.add(ProjectProof(project_id=PID, id="P-1", label="IAM report", source="collected"))
        session.add(ProjectProof(project_id=PID, id="P-2", label="Backup policy"))
        await session.commit()
        yield session
    await engine.dispose()


async def _sources(db) -> dict:
    db.expunge_all()
    rows = (await db.execute(select(ProjectProof.id, ProjectProof.source)
                             .where(ProjectProof.project_id == PID))).all()
    return dict(rows)


def _blob(*proofs) -> dict:
    return {"meta": {"societe": "MedSecure"}, "referentiels_actifs": [], "referentiels": {},
            "mesures": [], "preuves": list(proofs)}


@pytest.mark.asyncio
async def test_a_proof_is_manual_unless_the_server_says_otherwise(db):
    assert (await _sources(db))["P-2"] == "manual"


@pytest.mark.asyncio
async def test_the_targeted_routes_never_set_the_source(db):
    from src.routes.proofs import create_proof, update_proof
    r = await create_proof(PID, ProofCreate.model_validate({"id": "P-3", "source": "collected"}),
                           user=None, db=db)
    assert r.source == "manual"
    await update_proof(PID, "P-1", ProofUpdate.model_validate({"label": "x", "source": "manual"}),
                       user=None, db=db)
    assert await _sources(db) == {"P-1": "collected", "P-2": "manual", "P-3": "manual"}


@pytest.mark.asyncio
async def test_a_whole_project_save_keeps_the_sources_it_cannot_set(db):
    from src.routes.projects import update_project
    body = ProjectUpdate(data=_blob({"id": "P-1", "source": "manual"},       # cannot demote
                                    {"id": "P-2", "source": "collected"},    # cannot promote
                                    {"id": "P-4", "source": "collected"}))   # new: manual
    await update_project(PID, body, user=None, db=db)
    assert await _sources(db) == {"P-1": "collected", "P-2": "manual", "P-4": "manual"}


@pytest.mark.asyncio
async def test_a_restored_backup_gives_back_its_sources(db):
    """What the restore route writes (internal_restore_item, service token)."""
    from src.routes.internal import _backup_sources
    from src.routes.projects import _decompose_data, _delete_children
    data = _blob({"id": "P-1", "source": "collected"}, {"id": "P-5", "source": "collected"},
                 {"id": "P-6", "source": "forged"}, {"id": "P-7"})
    await _delete_children(db, PID)
    await _decompose_data(db, PID, data, _backup_sources(data))
    await db.commit()
    assert await _sources(db) == {"P-1": "collected", "P-5": "collected", "P-6": "manual", "P-7": "manual"}


@pytest.mark.asyncio
async def test_a_duplicate_keeps_the_sources_of_the_original(db):
    from src.routes.projects import duplicate_project
    r = await duplicate_project(PID, user=None, db=db)
    rows = (await db.execute(select(ProjectProof.id, ProjectProof.source)
                             .where(ProjectProof.project_id == r["id"]))).all()
    assert dict(rows) == {"P-1": "collected", "P-2": "manual"}


@pytest.mark.asyncio
async def test_the_export_carries_the_source(db):
    from src.routes.projects import _reconstruct_data
    data = await _reconstruct_data(db, PID)
    assert {p["id"]: p["source"] for p in data["preuves"]} == {"P-1": "collected", "P-2": "manual"}


def test_an_export_of_rev_1_gets_manual_proofs():
    from src.schema_migrations import MODULE_REVS, migrate_blob
    assert MODULE_REVS["compliance"] == 2
    out = migrate_blob("compliance", {"meta": {"schema_rev": 1},
                                      "preuves": [{"id": "P-1"}, {"id": "P-2", "source": "collected"}]})
    assert [p["source"] for p in out["preuves"]] == ["manual", "collected"]
    assert out["meta"]["schema_rev"] == 2
