"""FEAT-73 — the record of one collection, resource by resource.

What a version holds, laid out for an auditor: the rule and its version, the
connection, when the data was read, the result, and the state of every
resource — conforme (evaluated, no finding), non_conforme (a finding),
exclu (a finding on an excluded resource, with its justification) or
illisible (the source refused it). The raw answer is not repeated: its
fingerprint ties the record to it. Once the retention purged a version,
only its result and counts are left: the record says so. Pure.
"""
from __future__ import annotations

from typing import Any

SCHEMA = "cisotoolbox.compliance.collection-record"
SCHEMA_VERSION = 1


def resource_states(v: Any) -> list[dict]:
    """Every resource the collection saw, with its state: findings first,
    then exclusions, unreadable ones, and the compliant ones, each in the
    order the source gave them. A version holds one finding per resource
    (`engine.finalize`)."""
    findings, excluded, unreadable = v.findings or [], v.excluded or [], v.unreadable or []
    out = [{"resource": f["resource"], "state": "non_conforme", "detail": f.get("detail")} for f in findings]
    out += [{"resource": x["resource"], "state": "exclu", "detail": x.get("detail"),
             "exclusion": {"justification": x.get("justification"), "by": x.get("by"), "at": x.get("at"),
                           "derogation": x.get("derogation")}} for x in excluded]
    out += [{"resource": u["resource"], "state": "illisible", "detail": u.get("reason")} for u in unreadable]
    seen = {r["resource"] for r in out}
    for name in (v.scope or {}).get("resources") or []:
        if name not in seen:
            seen.add(name)
            out.append({"resource": name, "state": "conforme", "detail": None})
    return out


def state_counts(v: Any) -> dict:
    """How many resources in each state; once purged, from the version's
    own counts, which are per resource too (an unreadable resource is not
    in the evaluated scope)."""
    if v.purged_at is not None:
        return {"conforme": max(v.evaluated - v.n_findings - v.n_excluded, 0), "non_conforme": v.n_findings,
                "exclu": v.n_excluded, "illisible": v.n_unreadable}
    counts, seen = dict.fromkeys(("conforme", "non_conforme", "exclu", "illisible"), 0), set()
    for r in resource_states(v):                     # a resource's first state is its worst
        if r["resource"] not in seen:
            seen.add(r["resource"])
            counts[r["state"]] += 1
    return counts


def collection_record(v: Any, *, project: Any, monitor: Any, collector: dict, provider: str,
                      mode: str | None) -> dict:
    """The JSON record of the version ``v`` of ``monitor``."""
    return {
        "schema": SCHEMA, "schema_version": SCHEMA_VERSION,
        "project": {"id": str(project.id), "name": project.name},
        "measure": monitor.measure_id, "proof": monitor.proof_id,
        "collector": {"code": v.collector_code, "version": v.collector_version, "title": collector["title"],
                      "rule": v.rule_text},
        "connection": {"label": v.connection_label, "provider": provider, "mode": mode},
        "collection": {"id": str(v.id), "seq": v.seq, "trigger": v.trigger, "collected_at": v.collected_at.isoformat(),
                       "data_as_of": v.data_as_of.isoformat() if v.data_as_of else None},
        "result": v.result, "reason": v.reason, "missing_permission": v.missing_permission, "partial": v.partial,
        "evaluated": v.evaluated, "counts": state_counts(v), "resources": resource_states(v),
        "purged_at": v.purged_at.isoformat() if v.purged_at else None, "raw_sha256": v.raw_sha256,
    }
