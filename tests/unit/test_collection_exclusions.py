"""FEAT-73 lot 1a — setting a finding aside.

An exclusion names a resource the last collection evaluated, says why, and
appears in the next versions; it is revocable. A temporary one is a
derogation of the FEAT-45 register and counts only once approved. Its state
is "sans objet" once the resource is gone."""
import os
import sys
import uuid
from datetime import date, timedelta

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, B, _activate, _connections, _req  # noqa: E402
from src.models import CollectionVersion  # noqa: E402
from src.routes import collection as r  # noqa: E402
from src.schemas import ExclusionCreate, ExclusionRevoke  # noqa: E402

WHY = "Emergency account, physical safe, reviewed every quarter"


async def _monitored(db):
    aws, _ = await _connections(db)
    return uuid.UUID((await _activate(db, aws))["id"])


async def _findings(db, mid):
    view = await r.run_monitoring(A, mid, user=None, db=db)
    v = await r.get_version(A, uuid.UUID(view["last"]["id"]), user=None, db=db)
    return [f["resource"] for f in v["findings"]], [x["resource"] for x in v["excluded"]]


@pytest.mark.asyncio
async def test_a_permanent_exclusion_shows_in_the_next_version_and_can_be_revoked(monitored_db):
    db = monitored_db
    mid = await _monitored(db)
    e = await r.create_exclusion(A, mid, ExclusionCreate(resource="break-glass", justification=WHY), _req(), user=None, db=db)
    assert e["state"] == "active" and e["kind"] == "permanent"
    assert await _findings(db, mid) == (["j.martin"], ["break-glass"])
    assert [x["resource"] for x in await r.list_exclusions(A, user=None, db=db)] == ["break-glass"]
    assert await r.list_exclusions(B, user=None, db=db) == []
    done = await r.revoke_exclusion(A, uuid.UUID(e["id"]), ExclusionRevoke(reason="Account deleted"), _req(), user=None, db=db)
    assert done["state"] == "revoked" and done["revoked_reason"] == "Account deleted"
    assert await _findings(db, mid) == (["j.martin", "break-glass"], [])


@pytest.mark.asyncio
@pytest.mark.parametrize("body, status", [
    (ExclusionCreate(resource="break-glass", justification="short"), 422),
    (ExclusionCreate(resource="nobody", justification=WHY), 422),
    (ExclusionCreate(resource="break-glass", justification=WHY, kind="forever"), 422),
])
async def test_an_exclusion_needs_a_reason_and_a_resource_of_the_last_collection(monitored_db, body, status):
    mid = await _monitored(monitored_db)
    with pytest.raises(HTTPException) as e:
        await r.create_exclusion(A, mid, body, _req(), user=None, db=monitored_db)
    assert e.value.status_code == status


@pytest.mark.asyncio
async def test_a_resource_is_excluded_once(monitored_db):
    mid = await _monitored(monitored_db)
    await r.create_exclusion(A, mid, ExclusionCreate(resource="break-glass", justification=WHY), _req(), user=None, db=monitored_db)
    with pytest.raises(HTTPException) as e:
        await r.create_exclusion(A, mid, ExclusionCreate(resource="break-glass", justification=WHY), _req(), user=None, db=monitored_db)
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_a_temporary_exclusion_counts_once_its_derogation_is_approved(monitored_db):
    db = monitored_db
    from src.nonconformity_common import DecisionBody
    from src.routes.nonconformities import router as register
    decide = next(rt.endpoint for rt in register.routes if rt.endpoint.__name__ == "decide_derogation")
    listed = next(rt.endpoint for rt in register.routes if rt.endpoint.__name__ == "list_derogations")
    mid = await _monitored(db)
    e = await r.create_exclusion(A, mid, ExclusionCreate(
        resource="j.martin", justification="Leaves on Friday; the account is closed then", kind="temporary",
        risk_owner="it@medsecure.example", approver="ciso@medsecure.example",
        valid_until=(date.today() + timedelta(days=10)).isoformat()), _req(), user=None, db=db)
    assert e["state"] == "pending_approval" and e["derogation"]["status"] == "pending_approval"
    assert await _findings(db, mid) == (["j.martin", "break-glass"], [])
    ders = (await listed(project_id=str(A), user=None, db=db))["items"]
    assert [(d["subject_type"], d["subject_label"]) for d in ders] == [("collection_exclusion", "AWS-02 — j.martin")]
    await decide(e["derogation"]["id"], DecisionBody(approve=True), _req(), user=None, db=db)
    assert (await r.list_exclusions(A, user=None, db=db))[0]["state"] == "active"
    assert await _findings(db, mid) == (["break-glass"], ["j.martin"])
    done = await r.revoke_exclusion(A, uuid.UUID(e["id"]), ExclusionRevoke(reason="Stays after all"), _req(), user=None, db=db)
    assert done["derogation"]["status"] == "revoked"


@pytest.mark.asyncio
async def test_an_exclusion_whose_resource_is_gone_is_not_applicable(monitored_db):
    db = monitored_db
    mid = await _monitored(db)
    e = await r.create_exclusion(A, mid, ExclusionCreate(resource="break-glass", justification=WHY), _req(), user=None, db=db)
    view = await r.run_monitoring(A, mid, user=None, db=db)
    v = await db.get(CollectionVersion, uuid.UUID(view["last"]["id"]))
    v.scope = {"resources": ["j.martin"]}                     # the account was deleted in AWS
    await db.commit()
    assert (await r.list_exclusions(A, user=None, db=db))[0]["state"] == "sans_objet"
    assert e["id"]
