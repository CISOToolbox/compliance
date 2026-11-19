"""FEAT-73 lot 1a — coverage of a framework, and suggestions to confirm.

A requirement is covered when a linked measure is monitored, coverable when a
collector names it (or a confirmed suggestion links it), suggested when only
the mappings to ISO link it. The project confirms or rejects a suggestion; a
confirmed one is proposed on the measures of that requirement."""
import os
import sys

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, B, _activate, _connections, _req  # noqa: E402

from src.collection.coverage import links  # noqa: E402
from src.models import Framework, FrameworkMapping, ProjectControl  # noqa: E402
from src.routes import collection as r  # noqa: E402
from src.schemas import SuggestionDecision  # noqa: E402


def test_a_mapping_to_iso_suggests_in_both_directions_and_a_decision_settles_it():
    collectors = [{"code": "X-1", "requirement_keys": ["iso:A.8.5", "soc2:CC6.1.1"]}]
    maps = [("recyf", "R-1", "iso", "A.8.5"), ("iso", "A.8.5", "secnumcloud", "9.1.a"), ("soc2", "CC6.1.1", "iso", "A.8.5")]
    out = links(collectors, maps, {})
    assert out["iso:A.8.5"]["X-1"] == {"kind": "explicit"}
    assert out["soc2:CC6.1.1"]["X-1"] == {"kind": "explicit"}                # explicit beats suggested
    assert out["recyf:R-1"]["X-1"] == {"kind": "suggested", "via": "iso:A.8.5"}
    assert out["secnumcloud:9.1.a"]["X-1"]["kind"] == "suggested"
    out = links(collectors, maps, {("X-1", "recyf:R-1"): "confirmed", ("X-1", "secnumcloud:9.1.a"): "rejected"})
    assert out["recyf:R-1"]["X-1"]["kind"] == "confirmed" and "secnumcloud:9.1.a" not in out


async def _recyf(db):
    db.add_all([Framework(id="iso", label="ISO 27001"), Framework(id="recyf", label="ReCyF")])
    await db.flush()
    db.add(FrameworkMapping(source_framework="recyf", source_ref="R-1", target_framework="iso", target_ref="A.8.5"))
    db.add(ProjectControl(project_id=A, id=10, framework_id="recyf", ref="R-1", applicable="", mesures_ids=["M-2"]))
    await db.commit()


@pytest.mark.asyncio
async def test_the_coverage_of_a_framework(monitored_db):
    db = monitored_db
    await _recyf(db)
    aws, _ = await _connections(db)
    iso = await r.framework_coverage(A, "iso", user=None, db=db)
    assert {x["key"]: x["state"] for x in iso["requirements"]} == {"iso:A.8.5": "coverable", "iso:A.8.13": "coverable"}
    a85 = next(x for x in iso["requirements"] if x["key"] == "iso:A.8.5")
    assert [c["code"] for c in a85["collectors"]] == ["AWS-01", "AWS-02", "GH-03"]
    assert all(c["connection_available"] for c in a85["collectors"])
    await _activate(db, aws, "AWS-02", "M-1")
    iso = await r.framework_coverage(A, "iso", user=None, db=db)
    assert iso["totals"] == {"covered": 1, "coverable": 1, "suggested": 0, "none": 0}
    recyf = await r.framework_coverage(A, "recyf", user=None, db=db)
    r1 = recyf["requirements"][0]
    assert r1["state"] == "suggested" and {c["via"] for c in r1["collectors"]} == {"iso:A.8.5"}
    assert (await r.framework_coverage(B, "iso", user=None, db=db))["requirements"] == []


@pytest.mark.asyncio
async def test_a_confirmed_suggestion_is_proposed_and_a_rejected_one_is_gone(monitored_db):
    db = monitored_db
    await _recyf(db)
    await _connections(db)
    before = [p["collector_code"] for p in (await r.measure_monitoring(A, "M-2", user=None, db=db))["proposals"]]
    assert before == ["AWS-10"]                                   # A.8.13, named by the collector
    await r.decide_suggestion(A, SuggestionDecision(collector_code="AWS-02", requirement_key="recyf:R-1",
                                                    decision="confirmed"), _req(), user=None, db=db)
    await r.decide_suggestion(A, SuggestionDecision(collector_code="GH-03", requirement_key="recyf:R-1",
                                                    decision="rejected"), _req(), user=None, db=db)
    after = (await r.measure_monitoring(A, "M-2", user=None, db=db))["proposals"]
    aws02 = next(p for p in after if p["collector_code"] == "AWS-02")
    assert aws02["matches"] == [{"key": "recyf:R-1", "kind": "confirmed", "via": "iso:A.8.5"}]
    r1 = (await r.framework_coverage(A, "recyf", user=None, db=db))["requirements"][0]
    assert r1["state"] == "coverable" and "GH-03" not in [c["code"] for c in r1["collectors"]]


@pytest.mark.asyncio
async def test_only_a_suggestion_takes_a_decision(monitored_db):
    db = monitored_db
    await _recyf(db)
    for body in (SuggestionDecision(collector_code="AWS-02", requirement_key="iso:A.8.5", decision="rejected"),
                 SuggestionDecision(collector_code="AWS-02", requirement_key="recyf:R-1", decision="maybe")):
        with pytest.raises(HTTPException) as e:
            await r.decide_suggestion(A, body, _req(), user=None, db=db)
        assert e.value.status_code == 422
