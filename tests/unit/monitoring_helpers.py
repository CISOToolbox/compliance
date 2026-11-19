"""FEAT-73 lot 1a — MedSecure with monitoring, for the collection tests.

The project, its requirements and measures (fixture `monitored_db` in
conftest.py), its two connections, and the activation of a collector.
"""
import os
import sys
import uuid


os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@localhost/db")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
os.environ.setdefault("SERVICE_TOKEN", "svc-token-for-tests-0123456789abcdef")
os.environ["ENCRYPTION_KEY"] = "a-test-encryption-key-of-enough-length-0123456789"
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import JSON, event  # noqa: E402
from sqlalchemy.dialects.postgresql import JSONB as _JSONB  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from starlette.requests import Request  # noqa: E402

from src.models import Base, Project, ProjectControl, ProjectMeasure, ProjectProof  # noqa: E402
from src.routes import collection as r  # noqa: E402
from src.schemas import ConnectionCreate, MonitorCreate  # noqa: E402

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


def _req():
    return Request({"type": "http", "method": "POST", "path": "/api", "headers": [], "query_string": b"",
                    "client": ("127.0.0.1", 1)})


async def _connections(db, project=A):
    aws = await r.create_connection(project, ConnectionCreate(
        provider="aws", label="MedSecure production", settings={"role_arn": "arn:aws:iam::111122223333:role/ciso-audit"},
        secrets={"external_id": "x"}), _req(), user=None, db=db)
    gh = await r.create_connection(project, ConnectionCreate(
        provider="github", label="MedSecure", settings={"organization": "medsecure"}, secrets={"token": "x"}),
        _req(), user=None, db=db)
    return uuid.UUID(aws["id"]), uuid.UUID(gh["id"])


async def _activate(db, conn, code="AWS-02", measure="M-1"):
    return await r.activate_monitoring(A, measure, MonitorCreate(collector_code=code, connection_id=conn),
                                       _req(), user=None, db=db)


async def monitored_session():
    """The database of `monitored_db`: MedSecure (A) and another project (B)."""
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False},
                                 poolclass=StaticPool)
    event.listen(engine.sync_engine, "connect", lambda conn, _: conn.execute("PRAGMA foreign_keys=ON"))
    async with engine.begin() as c:
        await c.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as s:
        s.add_all([Project(id=A, name="MedSecure"), Project(id=B, name="Other")])
        s.add(ProjectControl(project_id=A, id=1, framework_id="iso", ref="A.8.5", applicable="", mesures_ids=["M-1"]))
        s.add(ProjectControl(project_id=A, id=2, framework_id="iso", ref="A.8.13", applicable="", mesures_ids=["M-2"]))
        s.add(ProjectMeasure(project_id=A, id="M-1", statut="termine", recurrence="annuelle", responsable="IT",
                             preuves_ids=["P-001"]))
        s.add(ProjectMeasure(project_id=A, id="M-2", statut="en_cours", preuves_ids=[]))
        s.add(ProjectProof(project_id=A, id="P-001", label="MFA policy", date_expiration=""))
        await s.commit()
        yield s
    await engine.dispose()
