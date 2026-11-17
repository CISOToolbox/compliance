"""FEAT-73 lot 0 — the compliance status is computed by the server, once.

The screen and Pilot's posture used to disagree: the screen derived the status
of a requirement from its measures and their proofs, the posture read the old
0-100 `conformite` field. Both now read `src/compliance_status.py`. What is
tested here: the rules, the route the screen reads, and that the posture and
the project statistics give the same answer as that route."""
import os
import sys
import uuid
from datetime import date, timedelta
from pathlib import Path

import pytest
import pytest_asyncio

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@localhost/db")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
os.environ.setdefault("SERVICE_TOKEN", "svc-token-for-tests-0123456789abcdef")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import JSON  # noqa: E402
from sqlalchemy.dialects.postgresql import JSONB as _JSONB  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from starlette.requests import Request  # noqa: E402

from src.compliance_status import (measure_effective_status, project_status,  # noqa: E402
                                   requirement_status)
from src.models import (Base, Derogation, Project, ProjectControl, ProjectMeasure,  # noqa: E402
                        ProjectProof, ProjectSettings)

for _t in Base.metadata.tables.values():
    for _c in _t.columns:
        if _c.server_default is not None:
            _sd = str(getattr(_c.server_default, "arg", "")).lower()
            if any(k in _sd for k in ("gen_random_uuid", "now(", "::jsonb")):
                _c.server_default = None
        if isinstance(_c.type, _JSONB):
            _c.type = JSON()
ProjectControl.__table__.c.id.autoincrement = False

TODAY = date(2026, 11, 16)
YESTERDAY = (TODAY - timedelta(days=1)).isoformat()
TOMORROW = (TODAY + timedelta(days=1)).isoformat()


# ── The rules ────────────────────────────────────────────────────────────

@pytest.mark.parametrize("statut, expirations, expected", [
    ("planifie", [], "planifie"),
    ("", [], "planifie"),
    ("en_cours", [YESTERDAY], "en_cours"),
    ("En cours", [], "en_cours"),                   # a raw label is normalised
    ("termine", [], "preuve_manquante"),            # done, but nothing proves it
    ("termine", [YESTERDAY], "preuve_manquante"),   # its only proof has expired
    ("termine", [YESTERDAY, ""], "termine"),        # a proof without expiry keeps it
    ("termine", [TODAY.isoformat()], "termine"),    # valid through its last day
    ("termine", [TOMORROW], "termine"),
    ("termine", ["31/12/2099"], "preuve_manquante"),  # an unreadable date proves nothing
    ("Terminé", [TOMORROW], "termine"),             # the label Pilot writes back
    ("completed", [TOMORROW], "termine"),
])
def test_effective_status_of_a_measure(statut, expirations, expected):
    assert measure_effective_status(statut, expirations, TODAY) == expected


@pytest.mark.parametrize("applicable, derogated, statuses, expected", [
    ("non", False, ["termine"], "na"),
    ("false", False, ["termine"], "na"),
    ("non", True, [], "na"),                        # not applicable wins
    ("", True, [], "derogated"),
    ("", False, [], "ko"),                          # no measure: not compliant
    ("", False, ["termine", "en_cours"], "ko"),
    ("", False, ["termine", "preuve_manquante"], "ko"),
    ("", False, ["termine", "termine"], "ok"),
    ("oui", False, ["termine"], "ok"),
])
def test_status_of_a_requirement(applicable, derogated, statuses, expected):
    assert requirement_status(applicable, derogated, statuses) == expected


def _c(fw, ref, mesures_ids=(), applicable=""):
    return ProjectControl(framework_id=fw, ref=ref, applicable=applicable, mesures_ids=list(mesures_ids))


def test_project_status_resolves_links_and_counts_per_framework():
    controls = [
        _c("iso", "A.8.5", ["M-1"]),                  # ok
        _c("iso", "A.8.2", ["M-1", "M-2"]),           # ko: M-2 lacks a valid proof
        _c("iso", "A.5.1", ["M-gone"]),               # ko: the only link is dangling
        _c("iso", "A.5.2", [], applicable="non"),     # na
        _c("iso", "A.8.28"),                          # derogated
        _c("nis2", "21.2.j", ["M-1"]),                # ok
    ]
    measures = [ProjectMeasure(id="M-1", statut="termine", preuves_ids=["P-1", "P-gone"]),
                ProjectMeasure(id="M-2", statut="termine", preuves_ids=["P-2"])]
    proofs = [ProjectProof(id="P-1", date_expiration=""), ProjectProof(id="P-2", date_expiration=YESTERDAY)]

    s = project_status(controls, measures, proofs, {"iso:A.8.28"}, TODAY)

    assert s["measures"] == {"M-1": "termine", "M-2": "preuve_manquante"}
    assert s["requirements"] == {"iso:A.8.5": "ok", "iso:A.8.2": "ko", "iso:A.5.1": "ko",
                                 "iso:A.5.2": "na", "iso:A.8.28": "derogated", "nis2:21.2.j": "ok"}
    assert s["frameworks"]["iso"] == {"applicable": 4, "ok": 1, "ko": 2, "derogated": 1,
                                      "excluded": 1, "pct": 25}
    assert s["frameworks"]["nis2"] == {"applicable": 1, "ok": 1, "ko": 0, "derogated": 0,
                                       "excluded": 0, "pct": 100}
    assert s["as_of"] == TODAY.isoformat()


def test_a_percentage_rounds_half_up_like_the_screen_did():
    controls = [_c("iso", "A.%d" % i, ["M-1"] if i < 1 else []) for i in range(8)]
    s = project_status(controls, [ProjectMeasure(id="M-1", statut="termine", preuves_ids=["P-1"])],
                       [ProjectProof(id="P-1", date_expiration="")], set(), TODAY)
    assert s["frameworks"]["iso"]["pct"] == 13            # 12.5 → 13, as Math.round


# ── Against a database: the route, the posture, the project statistics ──

PID = uuid.uuid4()


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False},
                                 poolclass=StaticPool)
    async with engine.begin() as c:
        await c.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        session.add(Project(id=PID, name="MedSecure"))
        session.add(ProjectSettings(project_id=PID, referentiels_actifs=["iso"]))
        # The old field says compliant where the rules say not, and the reverse.
        session.add(ProjectControl(project_id=PID, id=1, framework_id="iso", ref="A.8.5",
                                   applicable="", conformite="0", mesures_ids=["M-1"]))
        session.add(ProjectControl(project_id=PID, id=2, framework_id="iso", ref="A.8.2",
                                   applicable="", conformite="100", mesures_ids=[]))
        session.add(ProjectControl(project_id=PID, id=3, framework_id="iso", ref="A.8.28",
                                   applicable="", conformite="", mesures_ids=[]))
        session.add(ProjectControl(project_id=PID, id=4, framework_id="nis2", ref="21.2.j",
                                   applicable="", conformite="100", mesures_ids=["M-1"]))
        session.add(ProjectMeasure(project_id=PID, id="M-1", statut="termine", preuves_ids=["P-1"]))
        session.add(ProjectProof(project_id=PID, id="P-1", date_expiration=""))
        session.add(Derogation(reference="DER-001", subject_type="control", subject_id="iso:A.8.28",
                               project_id=str(PID), status="approved", title="Accepted deviation",
                               justification="Legacy build chain", risk_owner="CISO", approver="CEO",
                               valid_from=TODAY, valid_until=TODAY + timedelta(days=90)))
        await session.commit()
        yield session
    await engine.dispose()


def _svc_req() -> Request:
    return Request({"type": "http", "method": "GET", "path": "/api/internal/stats", "query_string": b"",
                    "headers": [(b"x-service-token", os.environ["SERVICE_TOKEN"].encode())],
                    "client": ("127.0.0.1", 1)})


@pytest.mark.asyncio
async def test_the_route_serves_the_status_the_screen_shows(db):
    from src.routes.projects import get_project_status
    s = await get_project_status(PID, user=None, db=db)
    assert s["requirements"] == {"iso:A.8.5": "ok", "iso:A.8.2": "ko", "iso:A.8.28": "derogated",
                                 "nis2:21.2.j": "ok"}
    assert s["measures"] == {"M-1": "termine"}
    assert s["frameworks"]["iso"]["pct"] == 33


@pytest.mark.asyncio
async def test_the_posture_is_the_status_of_the_screen(db):
    """One applicable requirement out of three in the active framework is
    compliant: the posture says 33, whatever `conformite` says."""
    from src.routes.internal import internal_stats
    from src.routes.projects import get_project_status
    stats = await internal_stats(_svc_req(), db)
    screen = (await get_project_status(PID, user=None, db=db))["frameworks"]["iso"]
    assert stats["posture"]["score"] == screen["pct"] == 33
    assert stats["breakdown"]["data"]["buckets"] == [{"label": "ISO", "value": 33, "color": "red"}]
    assert stats["nonconformities"]["derogated"] == 1
    assert stats["nonconformities"]["detected_open"] == 1      # A.8.2


@pytest.mark.asyncio
async def test_only_an_approved_derogation_of_this_project_or_of_the_module_counts(db):
    """The scope the register lists derogations in: the project's and the
    module-level ones, approved only."""
    from src.routes.projects import get_project_status

    def der(ref, subject, project, status):
        return Derogation(reference=ref, subject_type="control", subject_id=subject, project_id=project,
                          status=status, title="t", justification="j", risk_owner="o", approver="a",
                          valid_from=TODAY, valid_until=TODAY + timedelta(days=9))
    db.add_all([der("DER-002", "iso:A.8.2", str(PID), "pending_approval"),
                der("DER-003", "iso:A.8.2", str(PID), "rejected"),
                der("DER-004", "iso:A.8.2", str(uuid.uuid4()), "approved"),      # another project
                der("DER-005", "nis2:21.2.j", "", "approved")])                  # module-level
    await db.commit()
    s = await get_project_status(PID, user=None, db=db)
    assert s["requirements"]["iso:A.8.2"] == "ko"
    assert s["requirements"]["nis2:21.2.j"] == "derogated"


@pytest.mark.asyncio
async def test_the_posture_rounds_half_up_like_the_screen(db):
    """1 compliant requirement out of 8: 13 on the screen, 13 in Pilot."""
    from src.routes.internal import internal_stats
    from src.routes.projects import get_project_status
    for i in range(4):
        db.add(ProjectControl(project_id=PID, id=10 + i, framework_id="iso", ref=f"B.{i}",
                              applicable="", mesures_ids=[]))
    await db.execute(Derogation.__table__.delete())
    await db.commit()
    db.expunge_all()
    screen = (await get_project_status(PID, user=None, db=db))["frameworks"]["iso"]
    assert (screen["ok"], screen["applicable"], screen["pct"]) == (1, 7, 14)
    db.add(ProjectControl(project_id=PID, id=20, framework_id="iso", ref="B.9", applicable="", mesures_ids=[]))
    await db.commit()
    stats = await internal_stats(_svc_req(), db)
    assert stats["posture"]["score"] == 13
    assert stats["breakdown"]["data"]["buckets"][0]["value"] == 13


@pytest.mark.asyncio
async def test_the_project_statistics_are_the_status_of_the_screen(db):
    """Every framework of the project, active or not: 2 compliant out of 4."""
    from src.routes.projects import get_project_stats
    stats = await get_project_stats(PID, user=None, db=db)
    assert stats["compliance_rate"] == 50.0


@pytest.mark.asyncio
async def test_the_exported_project_carries_no_computed_status(db):
    """The status is the server's reading of the data, not data: it is not
    exported, so an import can never bring a stale one back."""
    from src.routes.projects import _reconstruct_data
    data = await _reconstruct_data(db, PID)
    assert all("statut" not in c for cs in data["referentiels"].values() for c in cs)
    assert all("statut_effectif" not in m for m in data["mesures"])


# ── The screen computes nothing ──────────────────────────────────────────

def test_the_frontend_no_longer_computes_the_status():
    src = (Path(__file__).resolve().parents[2] / "app" / "ts" / "Compliance_app.ts").read_text()
    for name in ("_mesureEffectiveStatut", "_exigenceStatut"):
        assert "function " + name not in src, name
    assert "date_expiration) >=" not in src
