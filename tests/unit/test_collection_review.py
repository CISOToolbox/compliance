"""FEAT-73 lots 1a+1b — the cases the server review found.

Pilot's write-back cannot touch what the monitoring owns; the permission
levels hold (raw data and connections for editors); an exclusion is not "sans
objet" because a collection failed; every finding can be excluded; a code
gone from the catalog does not break the daily work; an orphan collected
proof can be removed; a stale whole-project save keeps the server's dates and
proof content; revoking a pending temporary exclusion goes through the
register's rules; the alert, its recipients and the grace day are as
decided; two activations at once give a 409."""
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, B, _activate, _connections, _req  # noqa: E402
from sqlalchemy import select  # noqa: E402
from starlette.requests import Request  # noqa: E402

from src.models import (CollectionConnection, CollectionMonitor, CollectionVersion, Derogation, Project,  # noqa: E402
                        ProjectMeasure, ProjectProof, User)
from src.routes import collection as r  # noqa: E402
from src.schemas import ConnectionCreate, ExclusionCreate, ExclusionRevoke, MonitorCreate, ProjectUpdate  # noqa: E402

WHY = "Emergency account, physical safe, reviewed every quarter"


def _svc(path="/api/internal/x"):
    return Request({"type": "http", "method": "PATCH", "path": path, "query_string": b"",
                    "headers": [(b"x-service-token", os.environ["SERVICE_TOKEN"].encode())], "client": ("127.0.0.1", 1)})


@pytest.mark.asyncio
async def test_pilot_cannot_edit_a_collected_proof(monitored_db):
    from src.routes.internal import InternalEvidenceUpdate, internal_update_evidence
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws)
    with pytest.raises(HTTPException) as e:
        await internal_update_evidence(view["proof_id"], InternalEvidenceUpdate(project_id=str(A), label="forged",
                                                                                date_expiration="2099-01-01"), _svc(), monitored_db)
    assert e.value.status_code == 409
    monitored_db.expunge_all()
    assert (await monitored_db.get(ProjectProof, (A, view["proof_id"]))).label.startswith("AWS-02")


@pytest.mark.asyncio
async def test_a_measure_deleted_from_pilot_stops_its_monitoring(monitored_db):
    from src.routes.internal import delete_measure_internal
    aws, _ = await _connections(monitored_db)
    await _activate(monitored_db, aws)
    await delete_measure_internal("M-1", _svc(), entity_id=None, db=monitored_db)   # SQLite: the id alone
    monitored_db.expunge_all()
    m = (await monitored_db.execute(select(CollectionMonitor))).scalars().one()
    assert m.active is False and m.deactivation_reason == "measure deleted"


async def _reader(db):
    """An account that may read the project and nothing more."""
    uid, oid = uuid.uuid4(), uuid.uuid4()
    user = User(id=uid, email="auditor@medsecure.example", provider="local", provider_id="x", role="user")
    db.add_all([user, User(id=oid, email="owner@medsecure.example", provider="local", provider_id="o")])
    await db.flush()
    project = await db.get(Project, A)
    project.owner_id = oid
    project.shared_with = [{"user_id": str(uid), "permissions": ["read"]}]
    await db.commit()
    return user


@pytest.mark.asyncio
async def test_a_reader_sees_but_neither_connects_nor_reads_raw_data(monitored_db, monkeypatch):
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws)
    reader = await _reader(monitored_db)
    monkeypatch.setattr("src.routes.auth_helpers.auth_enabled", lambda: True)
    monkeypatch.setattr("src.routes.projects.auth_enabled", lambda: True)
    assert await r.list_connections(A, user=reader, db=monitored_db)
    await r.get_version(A, uuid.UUID(view["last"]["id"]), user=reader, db=monitored_db)
    for call in (lambda: r.get_version_raw(A, uuid.UUID(view["last"]["id"]), user=reader, db=monitored_db),
                 lambda: r.create_connection(A, ConnectionCreate(provider="github", label="x", settings={"organization": "o"},
                                                                 secrets={"token": "t"}), _req(), user=reader, db=monitored_db),
                 lambda: r.run_monitoring(A, uuid.UUID(view["id"]), user=reader, db=monitored_db)):
        with pytest.raises(HTTPException) as e:
            await call()
        assert e.value.status_code == 403


@pytest.mark.asyncio
async def test_an_exclusion_is_not_without_object_because_a_collection_failed(monitored_db):
    aws, _ = await _connections(monitored_db)
    mid = uuid.UUID((await _activate(monitored_db, aws))["id"])
    await r.create_exclusion(A, mid, ExclusionCreate(resource="break-glass", justification=WHY), _req(), user=None, db=monitored_db)
    conn = await monitored_db.get(CollectionConnection, aws)
    conn.settings = {**conn.settings, "scenario": "no-access"}
    await monitored_db.commit()
    assert (await r.run_monitoring(A, mid, user=None, db=monitored_db))["last"]["result"] == "erreur"
    assert (await r.list_exclusions(A, user=None, db=monitored_db))[0]["state"] == "active"


def test_every_aws_finding_names_a_resource_of_its_scope():
    from src.collection.engine import finalize
    from src.collection.fixtures import demo_payload
    from src.collection.rules.aws import EVALUATORS
    now = datetime(2026, 11, 17, 3, 0, tzinfo=timezone.utc)
    broken = {"AWS-08": {"Trails": [{"Name": "t", "IsMultiRegionTrail": False}]}}
    for code, rule in EVALUATORS.items():
        raw = broken.get(code) or demo_payload(code, now)["raw"]
        ev = rule(raw, {}, {"now": now})
        assert {f["resource"] for f in ev["findings"]} <= set(ev["scope"]["resources"]), code
    assert finalize(EVALUATORS["AWS-08"](broken["AWS-08"], {}, {"now": now}),
                    {"raw": {}, "unreadable": [], "error": None}, [])["result"] == "non_conforme"


@pytest.mark.asyncio
async def test_a_code_gone_from_the_catalog_breaks_neither_the_purge_nor_the_views(monitored_db):
    from src.collection import scheduler
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws)
    m = await monitored_db.get(CollectionMonitor, uuid.UUID(view["id"]))
    m.collector_code = "AWS-99"                 # retired by a later catalog
    await monitored_db.commit()
    await scheduler.purge(monitored_db, datetime.now(timezone.utc))
    listed = await r.list_monitors(A, user=None, db=monitored_db)
    assert listed[0]["collector_code"] == "AWS-99"


@pytest.mark.asyncio
async def test_an_orphan_collected_proof_can_be_removed(monitored_db):
    from src.routes.proofs import delete_proof
    monitored_db.add(ProjectProof(project_id=A, id="P-777", label="restored without its monitoring", source="collected"))
    await monitored_db.commit()
    await delete_proof(A, "P-777", user=None, db=monitored_db)
    monitored_db.expunge_all()
    assert await monitored_db.get(ProjectProof, (A, "P-777")) is None


@pytest.mark.asyncio
async def test_a_stale_save_keeps_the_last_check_and_the_collected_proof_content(monitored_db):
    from src.routes.projects import _reconstruct_data, update_project
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws)
    monitored_db.expunge_all()
    stale = await _reconstruct_data(monitored_db, A)
    stale["referentiels"] = {}
    for m in stale["mesures"]:
        if m["id"] == "M-1":
            m["dernier_controle"] = "2020-01-01"
    for p in stale["preuves"]:
        if p["id"] == view["proof_id"]:
            p["label"], p["date_expiration"] = "forged", "2099-01-01"
    today = datetime.now(timezone.utc).date().isoformat()
    await update_project(A, ProjectUpdate(data=stale), user=None, db=monitored_db)
    monitored_db.expunge_all()
    assert (await monitored_db.get(ProjectMeasure, (A, "M-1"))).dernier_controle == today
    proof = await monitored_db.get(ProjectProof, (A, view["proof_id"]))
    assert proof.label.startswith("AWS-02") and proof.date_expiration == ""


@pytest.mark.asyncio
async def test_revoking_a_pending_temporary_exclusion_rejects_its_request(monitored_db):
    from datetime import date
    aws, _ = await _connections(monitored_db)
    mid = uuid.UUID((await _activate(monitored_db, aws))["id"])
    e = await r.create_exclusion(A, mid, ExclusionCreate(
        resource="j.martin", justification="Leaves on Friday; closed then", kind="temporary", risk_owner="it",
        approver="ciso", valid_until=(date.today() + timedelta(days=5)).isoformat()), _req(), user=None, db=monitored_db)
    await r.revoke_exclusion(A, uuid.UUID(e["id"]), ExclusionRevoke(reason="Stays"), _req(), user=None, db=monitored_db)
    monitored_db.expunge_all()
    d = await monitored_db.get(Derogation, uuid.UUID(e["derogation"]["id"]))
    assert d.status == "rejected" and d.decided_by and "Stays" in d.decision_note


@pytest.mark.asyncio
async def test_an_exclusion_of_another_project_cannot_be_revoked(monitored_db):
    aws, _ = await _connections(monitored_db)
    mid = uuid.UUID((await _activate(monitored_db, aws))["id"])
    e = await r.create_exclusion(A, mid, ExclusionCreate(resource="break-glass", justification=WHY), _req(), user=None, db=monitored_db)
    with pytest.raises(HTTPException) as err:
        await r.revoke_exclusion(B, uuid.UUID(e["id"]), ExclusionRevoke(reason="x"), _req(), user=None, db=monitored_db)
    assert err.value.status_code == 404


@pytest.mark.asyncio
async def test_two_activations_at_once_give_a_conflict_not_a_crash(monitored_db, monkeypatch):
    aws, _ = await _connections(monitored_db)
    await _activate(monitored_db, aws)
    # The second one passed the proposal check before the first committed.
    async def stale_proposals(db, pid, mid):
        return [{"collector_code": "AWS-02", "connection_id": str(aws), "active": False, "matches": []}]
    monkeypatch.setattr(r, "proposals", stale_proposals)
    with pytest.raises(HTTPException) as e:
        await r.activate_monitoring(A, "M-1", MonitorCreate(collector_code="AWS-02", connection_id=aws), _req(), user=None, db=monitored_db)
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_after_a_success_a_new_error_streak_alerts_again_and_the_owner_is_told(monitored_db):
    from src.collection import scheduler
    aws, _ = await _connections(monitored_db)
    owner = User(id=uuid.uuid4(), email="owner@medsecure.example", provider="local", provider_id="o")
    monitored_db.add(owner)
    (await monitored_db.get(Project, A)).owner_id = owner.id
    await monitored_db.commit()
    view = await _activate(monitored_db, aws, "AWS-10", "M-2")
    told = []
    now = datetime.now(timezone.utc)
    send = lambda to, s, b: (told.append(to), (True, ""))[1]   # noqa: E731
    assert await scheduler.alert_failing(monitored_db, now + timedelta(days=3), send) == 1
    assert "owner@medsecure.example" in told
    m = await monitored_db.get(CollectionMonitor, uuid.UUID(view["id"]))
    m.error_since, m.alerted_at = None, None                    # a success ended the streak (service.collect)
    m.last_result = "conforme"
    await monitored_db.commit()
    conn = await monitored_db.get(CollectionConnection, aws)
    await r.run_monitoring(A, m.id, user=None, db=monitored_db)   # the missing right again: a new streak
    assert m.error_since is not None and m.alerted_at is None
    assert await scheduler.alert_failing(monitored_db, now + timedelta(days=6), send) == 1
    assert conn


def test_a_daily_collection_stands_one_day_plus_one_of_grace():
    from src.compliance_status import collected_proof_validity
    now = datetime(2026, 11, 17, 12, 0, tzinfo=timezone.utc)
    state = {"last_result": "conforme", "active": True, "recurrence": "quotidienne"}
    assert collected_proof_validity({**state, "last_collected_at": now - timedelta(hours=47)}, now) == "valid"
    assert collected_proof_validity({**state, "last_collected_at": now - timedelta(hours=49)}, now) == "unassessable"


@pytest.mark.asyncio
async def test_a_version_of_a_purged_project_is_gone_with_it(monitored_db):
    aws, _ = await _connections(monitored_db)
    await _activate(monitored_db, aws)
    await monitored_db.delete(await monitored_db.get(Project, A))
    await monitored_db.commit()
    assert (await monitored_db.execute(select(CollectionVersion))).scalars().all() == []


@pytest.mark.asyncio
async def test_an_orphan_collected_proof_cancels_no_valid_manual_proof(monitored_db):
    from src.routes.projects import get_project_status
    m = await monitored_db.get(ProjectMeasure, (A, "M-1"))
    monitored_db.add_all([ProjectProof(project_id=A, id="P-777", label="restored without its monitoring", source="collected"),
                          ProjectProof(project_id=A, id="P-778", label="Signed IAM review")])
    m.statut, m.preuves_ids = "termine", ["P-777", "P-778"]
    await monitored_db.commit()
    s = await get_project_status(A, user=None, db=monitored_db)
    assert s["proofs"]["P-777"]["validity"] == "expired" and s["measures"]["M-1"] == "termine"
    assert "P-777" not in s["held_proofs"]


@pytest.mark.asyncio
async def test_a_whole_save_keeps_the_edit_and_the_deletion_of_an_orphan(monitored_db):
    from src.routes.projects import _reconstruct_data, update_project
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws)
    monitored_db.add_all([ProjectProof(project_id=A, id="P-777", label="orphan", source="collected"),
                          ProjectProof(project_id=A, id="P-778", label="orphan too", source="collected")])
    await monitored_db.commit()
    monitored_db.expunge_all()
    data = await _reconstruct_data(monitored_db, A)
    data["referentiels"] = {}
    data["preuves"] = [p for p in data["preuves"] if p["id"] != "P-778"]
    for p in data["preuves"]:
        if p["id"] == "P-777":
            p["label"] = "orphan, renamed"
    await update_project(A, ProjectUpdate(data=data), user=None, db=monitored_db)
    monitored_db.expunge_all()
    assert (await monitored_db.get(ProjectProof, (A, "P-777"))).label == "orphan, renamed"
    assert await monitored_db.get(ProjectProof, (A, "P-778")) is None
    assert (await monitored_db.get(ProjectProof, (A, view["proof_id"]))).label.startswith("AWS-02")   # the held one stays
