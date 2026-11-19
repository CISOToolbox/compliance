"""FEAT-73 lot 1a — the status and the posture read the collected proofs.

Through the API only: what /status, the project statistics and Pilot's
posture say once collectors run on MedSecure's simulated sources."""
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

import pytest

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, _activate, _connections, _req  # noqa: E402
from starlette.requests import Request  # noqa: E402

from src.models import CollectionConnection, CollectionMonitor, ProjectMeasure  # noqa: E402
from src.routes import collection as r  # noqa: E402
from src.routes.internal import internal_stats  # noqa: E402
from src.routes.projects import get_project_stats, get_project_status  # noqa: E402
from src.schemas import MonitorDeactivate  # noqa: E402



def _svc():
    return Request({"type": "http", "method": "GET", "path": "/api/internal/stats", "query_string": b"",
                    "headers": [(b"x-service-token", os.environ["SERVICE_TOKEN"].encode())], "client": ("127.0.0.1", 1)})


async def _done(db, mid):
    m = await db.get(ProjectMeasure, (A, mid))
    m.statut = "termine"
    await db.commit()


@pytest.mark.asyncio
async def test_a_failing_collection_wins_over_the_manual_proof(monitored_db):
    db = monitored_db
    aws, _ = await _connections(db)
    await _activate(db, aws, "AWS-02", "M-1")                   # j.martin and break-glass without MFA
    s = await get_project_status(A, user=None, db=db)
    assert s["proofs"]["P-001"] == {"source": "manual", "validity": "valid"}
    assert s["proofs"]["P-002"] == {"source": "collected", "validity": "invalid"}
    assert s["measures"]["M-1"] == "preuve_manquante" and s["requirements"]["iso:A.8.5"] == "ko"


@pytest.mark.asyncio
async def test_a_collection_in_error_is_unassessable_in_the_status_and_in_pilot(monitored_db):
    db = monitored_db
    aws, _ = await _connections(db)
    await _activate(db, aws, "AWS-10", "M-2")                   # the backup listing is not allowed
    await _done(db, "M-2")
    s = await get_project_status(A, user=None, db=db)
    assert s["measures"]["M-2"] == "non_evaluable" and s["requirements"]["iso:A.8.13"] == "unassessable"
    assert s["frameworks"]["iso"]["unassessable"] == 1
    stats = await internal_stats(_svc(), db)
    assert stats["posture"]["unassessable"] == 1
    assert s["requirements"]["iso:A.8.5"] == "ok"               # its manual proof, no monitoring there
    assert stats["nonconformities"]["detected_open"] == 0        # unassessable is not an open gap
    assert stats["posture"]["score"] == 50                       # 1 of 2: unassessable stays in the denominator
    assert (await get_project_stats(A, user=None, db=db))["compliance_rate"] == 50


@pytest.mark.asyncio
async def test_a_compliant_collection_proves_the_measure(monitored_db):
    db = monitored_db
    aws, _ = await _connections(db)
    conn = await db.get(CollectionConnection, aws)
    conn.settings = {**conn.settings, "scenario": "complete"}
    await db.commit()
    await _activate(db, aws, "AWS-10", "M-2")
    await _done(db, "M-2")
    s = await get_project_status(A, user=None, db=db)
    assert s["measures"]["M-2"] == "termine" and s["requirements"]["iso:A.8.13"] == "ok"


@pytest.mark.asyncio
async def test_a_stopped_monitoring_whose_last_collection_aged_out_proves_nothing(monitored_db):
    db = monitored_db
    aws, _ = await _connections(db)
    conn = await db.get(CollectionConnection, aws)
    conn.settings = {**conn.settings, "scenario": "complete"}
    await db.commit()
    view = await _activate(db, aws, "AWS-10", "M-2")
    await _done(db, "M-2")
    mid = uuid.UUID(view["id"])
    await r.deactivate_monitoring(A, mid, MonitorDeactivate(reason="Moved to another tool"), _req(), user=None, db=db)
    m = await db.get(CollectionMonitor, mid)
    m.last_collected_at = datetime.now(timezone.utc) - timedelta(days=5)
    await db.commit()
    s = await get_project_status(A, user=None, db=db)
    assert s["proofs"][view["proof_id"]]["validity"] == "expired"
    assert s["measures"]["M-2"] == "preuve_manquante"


@pytest.mark.asyncio
async def test_a_collected_proof_never_counts_as_an_expired_dated_proof(monitored_db):
    db = monitored_db
    aws, _ = await _connections(db)
    await _activate(db, aws, "AWS-10", "M-2")
    await _done(db, "M-2")
    assert (await internal_stats(_svc(), db))["measures"]["proofs_expired_10d"] == 0


@pytest.mark.asyncio
async def test_the_status_names_the_monitored_measures(monitored_db):
    db = monitored_db
    aws, _ = await _connections(db)
    view = await _activate(db, aws, "AWS-02", "M-1")
    assert (await get_project_status(A, user=None, db=db))["monitored_measures"] == ["M-1"]
    await r.deactivate_monitoring(A, uuid.UUID(view["id"]), MonitorDeactivate(reason="Replaced"), _req(), user=None, db=db)
    assert (await get_project_status(A, user=None, db=db))["monitored_measures"] == []
