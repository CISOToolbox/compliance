"""FEAT-73 lot 1a — the history of a collected proof.

Newest first, paged; a version shows its findings, exclusions and the
resources it could not read; its raw data, which may list people, is for
editors only and gone once purged. Parameters and retention of a monitoring
can be changed, within the catalog's bounds."""
import os
import sys
import uuid
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, B, _activate, _connections, _req  # noqa: E402
from src.routes import collection as r  # noqa: E402
from src.schemas import MonitorUpdate  # noqa: E402


@pytest.mark.asyncio
async def test_the_history_is_newest_first_and_paged(monitored_db):
    aws, _ = await _connections(monitored_db)
    mid = uuid.UUID((await _activate(monitored_db, aws))["id"])
    for _ in range(3):
        await r.run_monitoring(A, mid, user=None, db=monitored_db)
    assert [v["seq"] for v in await r.list_versions(A, mid, user=None, db=monitored_db)] == [4, 3, 2, 1]
    assert [v["seq"] for v in await r.list_versions(A, mid, limit=2, before_seq=3, user=None, db=monitored_db)] == [2, 1]
    with pytest.raises(HTTPException) as e:
        await r.list_versions(B, mid, user=None, db=monitored_db)
    assert e.value.status_code == 404


@pytest.mark.asyncio
async def test_a_version_shows_its_detail_and_its_raw_data_until_purged(monitored_db):
    from src.models import CollectionVersion
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws)
    vid = uuid.UUID(view["last"]["id"])
    v = await r.get_version(A, vid, user=None, db=monitored_db)
    assert [f["resource"] for f in v["findings"]] == ["j.martin", "break-glass"]
    assert v["rule"].startswith("Every IAM user") and v["connection_label"] == "MedSecure production"
    raw = await r.get_version_raw(A, vid, user=None, db=monitored_db)
    assert raw["raw_sha256"] == view["last"]["raw_sha256"] and raw["raw"]["credential_report"]
    row = await monitored_db.get(CollectionVersion, vid)
    row.purged_at, row.raw = datetime.now(timezone.utc), None
    await monitored_db.commit()
    with pytest.raises(HTTPException) as e:
        await r.get_version_raw(A, vid, user=None, db=monitored_db)
    assert e.value.status_code == 410
    with pytest.raises(HTTPException) as e:
        await r.get_version(B, vid, user=None, db=monitored_db)
    assert e.value.status_code == 404


@pytest.mark.asyncio
async def test_parameters_and_retention_change_within_bounds(monitored_db):
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws, code="AWS-01")
    mid = uuid.UUID(view["id"])
    assert view["retention_default"] is True and view["retention"]["monthly_days"] == 396
    done = await r.update_monitoring(A, mid, MonitorUpdate(retention={"daily_days": 14, "weekly_days": 90, "monthly_days": 730}),
                                     _req(), user=None, db=monitored_db)
    assert done["retention"] == {"daily_days": 14, "weekly_days": 90, "monthly_days": 730} and not done["retention_default"]
    back = await r.update_monitoring(A, mid, MonitorUpdate(retention=None), _req(), user=None, db=monitored_db)
    assert back["retention_default"] is True
    with pytest.raises(HTTPException) as e:
        await r.update_monitoring(A, mid, MonitorUpdate(params={"max_owners": 2}), _req(), user=None, db=monitored_db)
    assert e.value.status_code == 422


@pytest.mark.asyncio
async def test_the_project_lists_its_monitorings_active_first(monitored_db):
    from src.schemas import MonitorDeactivate
    aws, _ = await _connections(monitored_db)
    a = await _activate(monitored_db, aws, code="AWS-01")
    await _activate(monitored_db, aws, code="AWS-02")
    await r.deactivate_monitoring(A, uuid.UUID(a["id"]), MonitorDeactivate(reason="Replaced"), _req(), user=None, db=monitored_db)
    listed = await r.list_monitors(A, user=None, db=monitored_db)
    assert [(m["collector_code"], m["active"]) for m in listed] == [("AWS-02", True), ("AWS-01", False)]
    assert await r.list_monitors(B, user=None, db=monitored_db) == []


@pytest.mark.asyncio
async def test_a_version_gives_each_resource_its_state_and_a_json_record(monitored_db):
    import json
    from src.models import CollectionVersion
    aws, _ = await _connections(monitored_db)
    view = await _activate(monitored_db, aws)
    vid = uuid.UUID(view["last"]["id"])
    v = await r.get_version(A, vid, user=None, db=monitored_db)
    states = {x["resource"]: x["state"] for x in v["resources"]}
    assert states["j.martin"] == states["break-glass"] == "non_conforme"
    assert "conforme" in states.values() and v["counts"]["non_conforme"] == 2
    assert v["counts"]["conforme"] == sum(1 for s in states.values() if s == "conforme")
    resp = await r.get_version_record(A, vid, user=None, db=monitored_db)
    assert resp.headers["content-disposition"] == 'attachment; filename="M-1-AWS-02-1.json"'
    record = json.loads(resp.body)
    assert record["schema"] == "cisotoolbox.compliance.collection-record" and record["schema_version"] == 1
    assert record["measure"] == "M-1" and record["proof"] == "P-002" and record["result"] == "non_conforme"
    assert record["collector"]["code"] == "AWS-02" and record["connection"] == {
        "label": "MedSecure production", "provider": "aws", "mode": "demo"}
    assert record["resources"] == v["resources"] and record["raw_sha256"] == view["last"]["raw_sha256"]
    assert "raw" not in record and record["purged_at"] is None
    row = await monitored_db.get(CollectionVersion, vid)
    row.purged_at = datetime.now(timezone.utc)
    row.raw = row.findings = row.excluded = row.unreadable = row.scope = None
    await monitored_db.commit()
    record = json.loads((await r.get_version_record(A, vid, user=None, db=monitored_db)).body)
    assert record["resources"] == [] and record["purged_at"] and record["counts"]["non_conforme"] == 2
    with pytest.raises(HTTPException) as e:
        await r.get_version_record(B, vid, user=None, db=monitored_db)
    assert e.value.status_code == 404
