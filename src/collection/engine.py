"""FEAT-73 — the result of one collection, from what the source returned.

`finalize` turns the evaluation of a collector's rule over the raw data, the
outcome of the read and the active exclusions into the content of a version:

- the source could not be read (missing right, expired token): `erreur`,
  never a verdict on the resources;
- nothing in scope, or the feature does not exist on the plan: `sans_objet`;
- a finding on an excluded resource moves to `excluded`, with the
  justification; findings left: `non_conforme`; none: `conforme`.

A partial read keeps its result and lists what it could not read. Pure.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any


def canonical_sha256(raw: Any) -> str:
    """The fingerprint of a raw answer: same data, same hash, whatever the
    key order (sorted keys, compact separators, UTF-8)."""
    blob = json.dumps(raw, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def finalize(evaluation: dict, fetched: dict, exclusions: list[dict]) -> dict:
    raw = fetched.get("raw")
    unreadable = list(fetched.get("unreadable") or [])
    version = {
        "data_as_of": fetched.get("data_as_of"),
        "raw": raw, "raw_sha256": canonical_sha256(raw),
        "unreadable": unreadable, "partial": bool(unreadable),
        "findings": [], "excluded": [], "reason": None, "missing_permission": None,
        "evaluated": 0, "scope": {},
    }
    error = fetched.get("error")
    if error:
        version.update(result="erreur", reason=error.get("reason"),
                       missing_permission=error.get("missing_permission"))
        return version
    version.update(evaluated=evaluation.get("evaluated", 0), scope=evaluation.get("scope") or {})
    if evaluation.get("outcome") in ("no_resources", "feature_absent"):
        version.update(result="sans_objet", reason=evaluation.get("reason"))
        return version
    by_resource = {e["resource"]: e for e in exclusions}
    for f in evaluation.get("findings") or []:
        e = by_resource.get(f["resource"])
        if e is None:
            version["findings"].append(f)
        else:
            version["excluded"].append(dict(f, exclusion_id=e["id"], justification=e["justification"],
                                            by=e.get("by"), at=e.get("at"), derogation=e.get("derogation")))
    version["result"] = "non_conforme" if version["findings"] else "conforme"
    return version
