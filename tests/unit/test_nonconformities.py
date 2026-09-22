"""FEAT-45 — non-conformities and derogations on controls (Compliance).

A derogation covers a control through its business key `<framework>:<ref>`;
nothing is persisted on the control, the frontend derives the state. What
is tested here: the hook resolves the key, the request/decision flow, the
expiry pass, and the guards."""
import os
import sys
import uuid
from datetime import date, timedelta

import pytest
import pytest_asyncio
from fastapi import HTTPException

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

from src.models import Base, Derogation, Nonconformity, Project, ProjectControl  # noqa: E402
from src.nonconformity_common import (DerogationCreate, DecisionBody, NonconformityCreate,  # noqa: E402
                                      expire_derogations)
from src.routes.nonconformities import CONTROL_HOOK, router, split_control_key  # noqa: E402

for _t in Base.metadata.tables.values():
    for _c in _t.columns:
        if _c.server_default is not None:
            _sd = str(getattr(_c.server_default, "arg", "")).lower()
            if any(k in _sd for k in ("gen_random_uuid", "now(", "::jsonb")):
                _c.server_default = None
        if isinstance(_c.type, _JSONB):
            _c.type = JSON()
# SQLite cannot autoincrement inside a composite primary key; the test sets ids.
ProjectControl.__table__.c.id.autoincrement = False


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False},
                                 poolclass=StaticPool)
    async with engine.begin() as c:
        await c.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        pid = uuid.uuid4()
        session.add(Project(id=pid, name="MedSecure"))
        session.add(ProjectControl(project_id=pid, id=1, framework_id="iso27001", ref="A.8.28",
                                   thematique="Secure coding", mesure="Secure coding principles are applied",
                                   applicable="", conformite="20"))
        await session.commit()
        yield session
    await engine.dispose()


def _req() -> Request:
    return Request({"type": "http", "method": "POST", "path": "/api/derogations", "headers": [],
                    "query_string": b"", "client": ("127.0.0.1", 1)})


def _endpoint(name: str):
    for r in router.routes:
        if r.endpoint.__name__ == name:
            return r.endpoint
    raise KeyError(name)


def _body(subject_id="iso27001:A.8.28", **over):
    body = {"subject_type": "control", "subject_id": subject_id, "title": "Legacy build chain",
            "justification": "The legacy pipeline is retired at the next release; reviews are enforced meanwhile.",
            "risk_owner": "cto@medsecure.example", "approver": "ciso@medsecure.example",
            "valid_until": (date.today() + timedelta(days=60)).isoformat()}
    body.update(over)
    return body


def test_control_key_is_framework_and_ref():
    assert split_control_key("iso27001:A.8.28") == ("iso27001", "A.8.28")
    assert split_control_key("bad") == ("bad", "")


@pytest.mark.asyncio
async def test_hook_resolves_a_control_by_its_business_key(db):
    assert (await CONTROL_HOOK.exists(db, "control", "iso27001:A.8.28")).startswith("iso27001 A.8.28")
    assert await CONTROL_HOOK.exists(db, "control", "iso27001:A.9.9") is None
    assert await CONTROL_HOOK.exists(db, "finding", "x") is None


@pytest.mark.asyncio
async def test_request_approve_and_expire_on_a_control(db):
    d = await _endpoint("request_derogation")(DerogationCreate(**_body()), _req(), user=None, db=db)
    assert d["status"] == "pending_approval" and d["subject_label"].startswith("iso27001 A.8.28")
    d = await _endpoint("decide_derogation")(d["id"], DecisionBody(approve=True), _req(), user=None, db=db)
    assert d["status"] == "approved" and d["days_left"] == 60
    listed = await _endpoint("list_derogations")(status="approved", subject_type="control",
                                                 subject_id="iso27001:A.8.28", user=None, db=db)
    assert listed["total"] == 1
    n = await expire_derogations(db, Derogation, CONTROL_HOOK, Nonconformity, today=date.today() + timedelta(days=61))
    assert n == 1
    assert (await db.get(Derogation, uuid.UUID(d["id"]))).status == "expired"


@pytest.mark.asyncio
async def test_unknown_control_is_404_and_bad_dates_422(db):
    with pytest.raises(HTTPException) as e:
        await _endpoint("request_derogation")(DerogationCreate(**_body(subject_id="iso27001:A.9.9")), _req(), user=None, db=db)
    assert e.value.status_code == 404
    with pytest.raises(HTTPException) as e:
        await _endpoint("request_derogation")(DerogationCreate(**_body(valid_until="")), _req(), user=None, db=db)
    assert e.value.status_code == 422


@pytest.mark.asyncio
async def test_declared_nonconformity_attached_to_a_control(db):
    nc = await _endpoint("declare_nonconformity")(
        NonconformityCreate(title="A developer bypasses code review", source="observation", severity="high",
                            domain="secure development", requirement_ref="iso27001:A.8.28",
                            subject_type="control", subject_id="iso27001:A.8.28"), _req(), user=None, db=db)
    assert nc["status"] == "to_qualify" and nc["subject_id"] == "iso27001:A.8.28"
    with pytest.raises(HTTPException) as e:                     # a constat needs an existing control
        await _endpoint("declare_nonconformity")(
            NonconformityCreate(title="Unknown control", subject_type="control", subject_id="iso27001:A.0.0"), _req(), user=None, db=db)
    assert e.value.status_code == 404


@pytest.mark.asyncio
async def test_remediation_links_existing_measures_only(db):
    """The corrective measures of a non-conformity are measures of the
    evaluation: an unknown id is refused, an existing one is linked."""
    from sqlalchemy import select
    from src.models import ProjectMeasure
    from src.nonconformity_common import QualifyBody, RemediationBody

    project_id = (await db.execute(select(ProjectControl.project_id))).scalars().first()
    db.add(ProjectMeasure(project_id=project_id, id="MES-001", description="Enforce mandatory reviews", statut="planifie"))
    await db.commit()

    nc = await _endpoint("declare_nonconformity")(
        NonconformityCreate(title="A developer bypasses code review", severity="high"), _req(), user=None, db=db)
    await _endpoint("qualify_nonconformity")(nc["id"], QualifyBody(), user=None, db=db)
    remediation = _endpoint("nonconformity_in_remediation")

    with pytest.raises(HTTPException) as e:
        await remediation(nc["id"], RemediationBody(measure_ids=["MES-999"]), user=None, db=db)
    assert e.value.status_code == 422 and "MES-999" in e.value.detail

    r = await remediation(nc["id"], RemediationBody(measure_ids=["MES-001"]), user=None, db=db)
    assert r["status"] == "in_remediation" and r["measure_ids"] == ["MES-001"]
    from src.nonconformity_common import CloseBody
    with pytest.raises(HTTPException) as e:                       # the measure is still planned
        await _endpoint("close_nonconformity")(nc["id"], CloseBody(closure_evidence="review log"), user=None, db=db)
    assert e.value.status_code == 409 and "MES-001" in e.value.detail


@pytest.mark.asyncio
async def test_stats_envelope_reports_derogated_requirements(db):
    """The requirement under an approved derogation leaves the KO count for
    its own category and never lifts the compliance rate."""
    from src.routes.internal import internal_stats
    d = await _endpoint("request_derogation")(DerogationCreate(**_body()), _req(), user=None, db=db)
    await _endpoint("decide_derogation")(d["id"], DecisionBody(approve=True), _req(), user=None, db=db)
    nc = await _endpoint("declare_nonconformity")(NonconformityCreate(title="Declared, then derogated"), _req(), user=None, db=db)
    d2 = await _endpoint("request_derogation")(DerogationCreate(**_body(subject_type="nonconformity", subject_id=nc["id"])), _req(), user=None, db=db)
    await _endpoint("decide_derogation")(d2["id"], DecisionBody(approve=True), _req(), user=None, db=db)
    db.expunge_all()
    sreq = Request({"type": "http", "method": "GET", "path": "/api/internal/stats", "query_string": b"",
                    "headers": [(b"x-service-token", os.environ["SERVICE_TOKEN"].encode())], "client": ("127.0.0.1", 1)})
    stats = await internal_stats(sreq, db)
    block = stats["nonconformities"]
    # the derogated requirement and the derogated record share the category
    assert block["derogated"] == 2 and block["detected_open"] == 0 and block["to_qualify"] == 0
    assert stats["posture"]["score"] == 0          # one applicable control, not compliant


@pytest.mark.asyncio
async def test_the_object_of_a_record_is_set_changed_or_removed_unless_a_derogation_covers_it(db):
    """The link to a requirement is an object handled like any association:
    picked among the module's controls (404 on an unknown one), changed or
    removed while the record moves freely — frozen once a derogation covers
    the record, since the derogation was granted on that subject."""
    from src.nonconformity_common import NonconformityPatch
    nc = await _endpoint("declare_nonconformity")(NonconformityCreate(title="Free-standing gap"), _req(), user=None, db=db)
    patch_nc = _endpoint("patch_nonconformity")
    with pytest.raises(HTTPException) as e:
        await patch_nc(nc["id"], NonconformityPatch(subject_type="control", subject_id="iso27001:A.9.9"), user=None, db=db)
    assert e.value.status_code == 404
    r = await patch_nc(nc["id"], NonconformityPatch(subject_type="control", subject_id="iso27001:A.8.28", requirement_ref="A.8.28"),
                       user=None, db=db)
    assert r["subject_type"] == "control" and r["subject_id"] == "iso27001:A.8.28" and r["requirement_ref"] == "A.8.28"
    with pytest.raises(HTTPException) as e:
        await patch_nc(nc["id"], NonconformityPatch(subject_type="control", subject_id=""), user=None, db=db)
    assert e.value.status_code == 422
    r = await patch_nc(nc["id"], NonconformityPatch(subject_type="", subject_id="", requirement_ref=""), user=None, db=db)
    assert r["subject_type"] == "" and r["subject_id"] == "" and r["requirement_ref"] == ""
    r = await patch_nc(nc["id"], NonconformityPatch(subject_type="control", subject_id="iso27001:A.8.28"), user=None, db=db)
    assert r["subject_id"] == "iso27001:A.8.28"
    # a derogation on the record freezes its subject; an unchanged subject still passes
    await _endpoint("request_derogation")(DerogationCreate(**_body(subject_type="nonconformity", subject_id=nc["id"])), _req(), user=None, db=db)
    r = await patch_nc(nc["id"], NonconformityPatch(subject_type="control", subject_id="iso27001:A.8.28", title="Free-standing gap, reworded"),
                       user=None, db=db)
    assert r["title"] == "Free-standing gap, reworded"
    with pytest.raises(HTTPException) as e:
        await patch_nc(nc["id"], NonconformityPatch(subject_type="", subject_id=""), user=None, db=db)
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_a_record_may_concern_several_requirements(db):
    """Requirements overlap across frameworks: one gap lists every requirement
    it breaches. The first one stays the primary pair; the reference follows
    the controls. The list is replaced as a whole, each new item validated."""
    from sqlalchemy import select
    from src.nonconformity_common import NonconformityPatch
    pid = (await db.execute(select(Project.id))).scalar()
    db.add(ProjectControl(project_id=pid, id=2, framework_id="anssi", ref="34", thematique="Développement",
                          mesure="Sécuriser les développements", applicable="", conformite="0"))
    await db.commit()
    nc = await _endpoint("declare_nonconformity")(
        NonconformityCreate(title="Unreviewed code reaches production", requirement_ref="A.8.28, 34",
                            subjects=[{"type": "control", "id": "iso27001:A.8.28"}, {"type": "control", "id": "anssi:34"},
                                      {"type": "control", "id": "iso27001:A.8.28"}]),
        _req(), user=None, db=db)
    assert nc["subjects"] == [{"type": "control", "id": "iso27001:A.8.28"}, {"type": "control", "id": "anssi:34"}]
    assert nc["subject_type"] == "control" and nc["subject_id"] == "iso27001:A.8.28"
    with pytest.raises(HTTPException) as e:
        await _endpoint("declare_nonconformity")(
            NonconformityCreate(title="Unknown among several", subjects=[{"type": "control", "id": "anssi:34"}, {"type": "control", "id": "iso27001:A.0.0"}]),
            _req(), user=None, db=db)
    assert e.value.status_code == 404
    with pytest.raises(HTTPException) as e:
        await _endpoint("declare_nonconformity")(NonconformityCreate(title="Wrong kind", subjects=[{"type": "nonconformity", "id": "x"}]),
                                                 _req(), user=None, db=db)
    assert e.value.status_code == 422
    patch_nc = _endpoint("patch_nonconformity")
    r = await patch_nc(nc["id"], NonconformityPatch(subjects=[{"type": "control", "id": "anssi:34"}], requirement_ref="34"), user=None, db=db)
    assert r["subjects"] == [{"type": "control", "id": "anssi:34"}] and r["subject_id"] == "anssi:34" and r["requirement_ref"] == "34"
    r = await patch_nc(nc["id"], NonconformityPatch(subjects=[]), user=None, db=db)
    assert r["subjects"] == [] and r["subject_id"] == "" and r["subject_type"] == ""
    # the legacy single pair is the one-item form
    r = await patch_nc(nc["id"], NonconformityPatch(subject_type="control", subject_id="iso27001:A.8.28"), user=None, db=db)
    assert r["subjects"] == [{"type": "control", "id": "iso27001:A.8.28"}]


@pytest.mark.asyncio
async def test_the_register_is_scoped_to_the_projects_the_user_may_read(db, monkeypatch):
    """The register follows the module's own project permissions: a record
    belongs to the project it was declared in, and an account without rights
    on that project neither sees it nor touches it. A record with no project
    came from the console: it stays module-level."""
    import src.auth_common as auth_common
    from types import SimpleNamespace
    from sqlalchemy import select as _select
    from src.models import Project
    from src.nonconformity_common import NonconformityPatch
    monkeypatch.setattr(auth_common, "auth_enabled", lambda: True)

    owner = uuid.uuid4()                     # both projects belong to someone else
    project = (await db.execute(_select(Project))).scalars().first()
    project.owner_id = owner
    pid = str(project.id)
    other = uuid.uuid4()
    db.add(Project(id=other, name="Another client", owner_id=owner))
    await db.commit()
    admin = SimpleNamespace(id=uuid.uuid4(), name="Ada Admin", email="ada@medsecure.example", role="user", _module_role="admin")
    outsider = SimpleNamespace(id=uuid.uuid4(), name="Otto Outsider", email="otto@medsecure.example", role="user", _module_role="")

    declare, listing = _endpoint("declare_nonconformity"), _endpoint("list_nonconformities")
    mine = await declare(NonconformityCreate(title="Gap of this project", project_id=pid), _req(), user=admin, db=db)
    assert mine["project_id"] == pid
    # the console's own declaration carries no project
    console = await _endpoint("declare_nonconformity")(NonconformityCreate(title="Declared from the console"), _req(), user=None, db=db)
    assert console["project_id"] == ""

    # an account with no right on any project sees neither, and cannot declare
    seen = await listing(user=outsider, db=db)
    assert [r["reference"] for r in seen["items"]] == [console["reference"]]
    with pytest.raises(HTTPException) as e:
        await _endpoint("get_nonconformity")(mine["id"], user=outsider, db=db)
    assert e.value.status_code == 404
    with pytest.raises(HTTPException) as e:
        await _endpoint("patch_nonconformity")(mine["id"], NonconformityPatch(title="Not yours"), user=outsider, db=db)
    assert e.value.status_code == 403
    with pytest.raises(HTTPException) as e:
        await declare(NonconformityCreate(title="In a project I cannot edit", project_id=str(other)), _req(), user=outsider, db=db)
    assert e.value.status_code == 403

    # the module administrator reads both, and a declaration needs a project
    assert len((await listing(user=admin, db=db))["items"]) == 2
    # a real account cannot mint a module-level record: only the console does
    with pytest.raises(HTTPException) as e:
        await declare(NonconformityCreate(title="No project given"), _req(), user=admin, db=db)
    assert e.value.status_code == 422
    # narrowed to one project, the register answers for that project only
    only = await listing(project_id=pid, user=admin, db=db)
    assert [r["reference"] for r in only["items"]] == [mine["reference"], console["reference"]] or \
           sorted(r["reference"] for r in only["items"]) == sorted([mine["reference"], console["reference"]])
