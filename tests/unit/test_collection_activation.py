"""FEAT-73 lot 1a — activating the automated monitoring of a measure.

Proposed: the collectors that bring evidence to a requirement the measure is
linked to, through the project's connections. Activating one creates the
collected proof, sets the measure's recurrence to daily and locks it, and
collects at once. What the monitoring owns cannot be changed by the targeted
routes, and a whole-project save from a stale copy puts it back."""
import os
import sys
import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy import select

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, B, _activate, _connections, _req  # noqa: E402
from src.models import CollectionMonitor, ProjectControl, ProjectMeasure, ProjectProof  # noqa: E402
from src.routes import collection as r  # noqa: E402
from src.schemas import MeasureUpdate, MonitorCreate, MonitorDeactivate, ProjectUpdate, ProofUpdate  # noqa: E402


@pytest.mark.asyncio
async def test_the_collectors_of_the_linked_requirements_are_proposed(monitored_db):
    await _connections(monitored_db)
    m = await r.measure_monitoring(A, "M-1", user=None, db=monitored_db)
    assert sorted(p["collector_code"] for p in m["proposals"]) == ["AWS-01", "AWS-02", "GH-03"]
    assert m["recurrence_locked"] is False and m["monitors"] == []
    assert {x["key"] for p in m["proposals"] for x in p["matches"]} == {"iso:A.8.5"}


@pytest.mark.asyncio
async def test_activating_creates_the_collected_proof_locks_the_recurrence_and_collects(monitored_db):
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws)
    assert view["active"] is True and view["last"]["seq"] == 1 and view["last"]["result"] == "non_conforme"
    assert view["proof_id"] == "P-002"
    monitored_db.expunge_all()
    proof = await monitored_db.get(ProjectProof, (A, "P-002"))
    measure = await monitored_db.get(ProjectMeasure, (A, "M-1"))
    assert proof.source == "collected" and proof.owner == "IT" and proof.date_obtention
    assert measure.recurrence == "quotidienne" and measure.preuves_ids == ["P-001", "P-002"]
    assert measure.dernier_controle == proof.date_obtention
    m = await r.measure_monitoring(A, "M-1", user=None, db=monitored_db)
    assert m["recurrence_locked"] is True
    assert "AWS-02" not in [p["collector_code"] for p in m["proposals"]]


@pytest.mark.asyncio
async def test_only_a_proposed_collector_once_through_a_connection_of_the_project(monitored_db):
    aws, gh = await _connections(monitored_db)
    other, _ = await _connections(monitored_db, project=B)
    for code, conn, status in (("AWS-10", aws, 422),       # M-1 is not linked to a backup requirement
                               ("AWS-02", gh, 422),        # a GitHub connection cannot run an AWS collector
                               ("AWS-02", other, 404)):    # another project's connection
        with pytest.raises(HTTPException) as e:
            await _activate(monitored_db, conn, code)
        assert e.value.status_code == status, code
    await _activate(monitored_db, aws)
    with pytest.raises(HTTPException) as e:
        await _activate(monitored_db, aws)
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_a_collector_needing_the_users_is_neither_proposed_nor_activated_without_them(monitored_db):
    _, gh = await _connections(monitored_db)
    monitored_db.add(ProjectControl(project_id=A, id=3, framework_id="iso", ref="A.5.18", applicable="",
                                    mesures_ids=["M-1"]))
    await monitored_db.commit()
    m = await r.measure_monitoring(A, "M-1", user=None, db=monitored_db)
    assert "GH-04" not in [p["collector_code"] for p in m["proposals"]]
    with pytest.raises(HTTPException) as e:
        await _activate(monitored_db, gh, "GH-04")
    assert e.value.status_code == 422 and "users of the project" in e.value.detail
    coverage = await r.framework_coverage(A, "iso", user=None, db=monitored_db)
    row = next(x for x in coverage["requirements"] if x["ref"] == "A.5.18")
    assert "GH-04" not in [c["code"] for c in row["collectors"]]
    catalog = {c["code"]: c for c in (await r.list_collectors(user=None))["collectors"]}
    assert "users of the project" in catalog["GH-04"]["unavailable"] and catalog["GH-03"]["unavailable"] is None
    assert catalog["GH-04"]["needs"] == ["users"]           # the users' screen offers its provider as a perimeter


@pytest.mark.asyncio
async def test_parameters_and_retention_are_checked(monitored_db):
    aws, _ = await _connections(monitored_db)
    for body in (MonitorCreate(collector_code="AWS-02", connection_id=aws, params={"max_age_days": 10}),
                 MonitorCreate(collector_code="AWS-02", connection_id=aws,
                               retention={"daily_days": 30, "weekly_days": 7, "monthly_days": 90})):
        with pytest.raises(HTTPException) as e:
            await r.activate_monitoring(A, "M-1", body, _req(), user=None, db=monitored_db)
        assert e.value.status_code == 422


@pytest.mark.asyncio
async def test_what_the_monitoring_owns_cannot_be_changed_by_the_targeted_routes(monitored_db):
    from src.routes.measures import update_measure
    from src.routes.proofs import delete_proof, update_proof
    aws, _ = await _connections(monitored_db)
    await _activate(monitored_db, aws)
    attempts = (
        lambda: update_measure(A, "M-1", MeasureUpdate(recurrence="annuelle"), user=None, db=monitored_db),
        lambda: update_measure(A, "M-1", MeasureUpdate(preuves_ids=["P-001"]), user=None, db=monitored_db),
        lambda: update_proof(A, "P-002", ProofUpdate(label="forged"), user=None, db=monitored_db),
        lambda: delete_proof(A, "P-002", user=None, db=monitored_db),
    )
    for attempt in attempts:
        with pytest.raises(HTTPException) as e:
            await attempt()
        assert e.value.status_code == 409
    await update_measure(A, "M-1", MeasureUpdate(details="still editable"), user=None, db=monitored_db)


@pytest.mark.asyncio
async def test_a_stale_whole_project_save_cannot_drop_what_the_monitoring_owns(monitored_db):
    from src.routes.projects import _reconstruct_data, update_project
    aws, _ = await _connections(monitored_db)
    await _activate(monitored_db, aws)
    monitored_db.expunge_all()
    stale = await _reconstruct_data(monitored_db, A)
    stale["referentiels"] = {}         # SQLite cannot re-number the requirement rows; not what is tested
    stale["preuves"] = [p for p in stale["preuves"] if p["id"] != "P-002"]
    for m in stale["mesures"]:
        if m["id"] == "M-1":
            m["recurrence"], m["preuves_ids"] = "annuelle", ["P-001"]
    await update_project(A, ProjectUpdate(data=stale), user=None, db=monitored_db)
    monitored_db.expunge_all()
    measure = await monitored_db.get(ProjectMeasure, (A, "M-1"))
    assert measure.recurrence == "quotidienne" and "P-002" in measure.preuves_ids
    assert (await monitored_db.get(ProjectProof, (A, "P-002"))).source == "collected"
    monitor = (await monitored_db.execute(select(CollectionMonitor))).scalars().one()
    assert monitor.active is True


@pytest.mark.asyncio
async def test_a_save_without_the_measure_deactivates_its_monitoring_and_keeps_the_proof(monitored_db):
    from src.routes.projects import _reconstruct_data, update_project
    aws, _ = await _connections(monitored_db)
    await _activate(monitored_db, aws)
    monitored_db.expunge_all()
    data = await _reconstruct_data(monitored_db, A)
    data["referentiels"] = {}
    data["mesures"] = [m for m in data["mesures"] if m["id"] != "M-1"]
    await update_project(A, ProjectUpdate(data=data), user=None, db=monitored_db)
    monitored_db.expunge_all()
    monitor = (await monitored_db.execute(select(CollectionMonitor))).scalars().one()
    assert monitor.active is False and "whole-project save" in monitor.deactivation_reason
    assert (await monitored_db.get(ProjectProof, (A, "P-002"))) is not None


@pytest.mark.asyncio
async def test_a_manual_run_adds_a_version_and_deactivating_frees_the_recurrence(monitored_db):
    from src.routes.measures import update_measure
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws)
    mid = uuid.UUID(view["id"])
    assert (await r.run_monitoring(A, mid, user=None, db=monitored_db))["last"]["seq"] == 2
    with pytest.raises(HTTPException) as e:
        await r.deactivate_monitoring(A, mid, MonitorDeactivate(reason="  "), _req(), user=None, db=monitored_db)
    assert e.value.status_code == 422
    done = await r.deactivate_monitoring(A, mid, MonitorDeactivate(reason="Account closed"), _req(), user=None, db=monitored_db)
    assert done["active"] is False and done["deactivation_reason"] == "Account closed"
    await update_measure(A, "M-1", MeasureUpdate(recurrence="annuelle"), user=None, db=monitored_db)
    with pytest.raises(HTTPException) as e:
        await r.run_monitoring(A, mid, user=None, db=monitored_db)
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_reactivating_resumes_the_stopped_monitoring_and_its_proof(monitored_db):
    from src.models import AuditLog, CollectionVersion
    aws, _ = await _connections(monitored_db)
    first = await _activate(monitored_db, aws)
    mid = uuid.UUID(first["id"])
    await r.deactivate_monitoring(A, mid, MonitorDeactivate(reason="Paused"), _req(), user=None, db=monitored_db)
    again = await _activate(monitored_db, aws)
    # The same monitoring and the same proof: no second one on the measure.
    assert again["id"] == first["id"] and again["proof_id"] == first["proof_id"] and again["active"] is True
    assert again["last"]["seq"] == 2 and again["deactivation_reason"] == ""
    monitored_db.expunge_all()
    monitors = (await monitored_db.execute(select(CollectionMonitor).where(CollectionMonitor.project_id == A))).scalars().all()
    assert len(monitors) == 1
    measure = await monitored_db.get(ProjectMeasure, (A, "M-1"))
    assert measure.preuves_ids == ["P-001", first["proof_id"]] and measure.recurrence == "quotidienne"
    versions = (await monitored_db.execute(select(CollectionVersion.seq).where(CollectionVersion.monitor_id == mid))).scalars().all()
    assert sorted(versions) == [1, 2]
    journal = (await monitored_db.execute(select(AuditLog).where(AuditLog.entity_id == first["id"])
                                          .order_by(AuditLog.logged_at))).scalars().all()
    assert [j.action for j in journal] == ["monitoring.activate", "monitoring.deactivate", "monitoring.reactivate"]
    import json
    details = journal[-1].details
    assert (json.loads(details) if isinstance(details, str) else details)["resumed_after"]["reason"] == "Paused"


@pytest.mark.asyncio
async def test_a_resumed_monitoring_keeps_its_retention_and_parameters_and_starts_a_new_state(monitored_db):
    from src.schemas import MonitorUpdate
    aws, _ = await _connections(monitored_db)
    first = await _activate(monitored_db, aws, "AWS-02")
    mid = uuid.UUID(first["id"])
    kept = {"daily_days": 30, "weekly_days": 120, "monthly_days": 2000}
    await r.update_monitoring(A, mid, MonitorUpdate(retention=kept), _req(), user=None, db=monitored_db)
    await r.deactivate_monitoring(A, mid, MonitorDeactivate(reason="Paused"), _req(), user=None, db=monitored_db)
    # Parameters set earlier (AWS-02 has none in the catalog: written as stored).
    await monitored_db.execute(CollectionMonitor.__table__.update().where(CollectionMonitor.id == mid)
                               .values(params={"threshold": 3}))
    await monitored_db.commit()
    again = await _activate(monitored_db, aws, "AWS-02")         # the screen sends neither
    assert again["retention"] == kept and again["retention_default"] is False
    assert again["params"] == {"threshold": 3}
    monitored_db.expunge_all()
    m = await monitored_db.get(CollectionMonitor, mid)
    assert m.state_since is not None and m.state_since >= m.activated_at.replace(tzinfo=m.state_since.tzinfo)


@pytest.mark.asyncio
async def test_a_monitoring_the_server_stopped_is_not_resumed(monitored_db):
    from src.collection import ownership
    aws, _ = await _connections(monitored_db)
    first = await _activate(monitored_db, aws)
    # Its measure was deleted, and a measure is created again under the same id.
    await ownership.stop_for_measure(monitored_db, A, "M-1", "measure deleted")
    await monitored_db.commit()
    again = await _activate(monitored_db, aws)
    assert again["id"] != first["id"]
    old = await monitored_db.get(CollectionMonitor, uuid.UUID(first["id"]))
    assert old.active is False and old.deactivated_by == "system"


@pytest.mark.asyncio
async def test_of_two_stopped_monitorings_the_last_one_stopped_is_resumed(monitored_db):
    from datetime import datetime, timedelta, timezone
    aws, _ = await _connections(monitored_db)
    first = await _activate(monitored_db, aws)
    await r.deactivate_monitoring(A, uuid.UUID(first["id"]), MonitorDeactivate(reason="Paused"), _req(), user=None,
                                  db=monitored_db)
    # A duplicate made before the fix, stopped later.
    dup = CollectionMonitor(id=uuid.uuid4(), project_id=A, connection_id=aws, measure_id="M-1", proof_id="P-001",
                            collector_code="AWS-02", active=False, deactivated_by="j.martin",
                            deactivated_at=datetime.now(timezone.utc) + timedelta(minutes=1))
    monitored_db.add(dup)
    await monitored_db.commit()
    await monitored_db.execute(ProjectProof.__table__.update().where(
        ProjectProof.project_id == A, ProjectProof.id == "P-001").values(source="collected"))
    await monitored_db.commit()
    assert (await _activate(monitored_db, aws))["id"] == str(dup.id)


@pytest.mark.asyncio
async def test_a_monitoring_resumed_by_another_activation_meanwhile_is_a_conflict(monitored_db, monkeypatch):
    aws, _ = await _connections(monitored_db)
    first = await _activate(monitored_db, aws)
    await r.deactivate_monitoring(A, uuid.UUID(first["id"]), MonitorDeactivate(reason="Paused"), _req(), user=None,
                                  db=monitored_db)
    found = r._stopped_monitor

    async def raced(db, *args):
        m = await found(db, *args)
        await db.execute(CollectionMonitor.__table__.update().where(CollectionMonitor.id == m.id).values(active=True))
        return m
    monkeypatch.setattr(r, "_stopped_monitor", raced)
    with pytest.raises(HTTPException) as e:
        await _activate(monitored_db, aws)
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_a_stopped_monitoring_whose_proof_is_gone_is_not_resumed(monitored_db):
    aws, _ = await _connections(monitored_db)
    first = await _activate(monitored_db, aws)
    await r.deactivate_monitoring(A, uuid.UUID(first["id"]), MonitorDeactivate(reason="Paused"), _req(), user=None,
                                  db=monitored_db)
    await monitored_db.delete(await monitored_db.get(ProjectProof, (A, first["proof_id"])))
    await monitored_db.commit()
    again = await _activate(monitored_db, aws)
    # A new monitoring with a new proof; the stopped one stays as it was.
    assert again["id"] != first["id"] and again["last"]["seq"] == 1
    old = await monitored_db.get(CollectionMonitor, uuid.UUID(first["id"]))
    assert old.active is False and old.deactivation_reason == "Paused"


@pytest.mark.asyncio
async def test_a_connection_holding_a_history_cannot_be_deleted(monitored_db):
    aws, gh = await _connections(monitored_db)
    await _activate(monitored_db, aws)
    with pytest.raises(HTTPException) as e:
        await r.delete_connection(A, aws, _req(), user=None, db=monitored_db)
    assert e.value.status_code == 409
    await r.delete_connection(A, gh, _req(), user=None, db=monitored_db)


@pytest.mark.asyncio
async def test_deleting_a_monitored_measure_stops_its_monitoring_and_keeps_the_proof(monitored_db):
    from src.routes.measures import delete_measure
    aws, _ = await _connections(monitored_db)
    await _activate(monitored_db, aws)
    await delete_measure(A, "M-1", user=None, db=monitored_db)
    monitored_db.expunge_all()
    monitor = (await monitored_db.execute(select(CollectionMonitor))).scalars().one()
    assert monitor.active is False and monitor.deactivation_reason == "measure deleted"
    assert (await monitored_db.get(ProjectProof, (A, "P-002"))).source == "collected"
