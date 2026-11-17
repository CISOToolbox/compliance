"""Compliance status — the single definition the screen and the posture read.

- The **effective status of a measure** is its own status, except that a
  completed measure is "preuve_manquante" (missing proof) until at least one
  of its proofs is valid: no expiration date, or an expiration not yet past
  (valid through its last day). A date that cannot be read proves nothing.
- The **status of a requirement** is "na" when it is not applicable,
  "derogated" under an approved derogation, "ok" when it has at least one
  linked measure and every linked measure is effectively completed, "ko"
  otherwise.

The frontend shows what this module returns and recomputes nothing. Pure
functions: no database and no clock, ``today`` is passed in.
"""
from __future__ import annotations

import math
import unicodedata
from datetime import date
from typing import Any, Iterable

# Every spelling a measure status arrives in: the screen's keys, the labels of
# an import or of Pilot's write-back, Pilot's normalised values.
_MEASURE_STATUS = {
    "planifie": "planifie", "planned": "planifie",
    "en cours": "en_cours", "en_cours": "en_cours", "in_progress": "en_cours",
    "termine": "termine", "terminee": "termine", "terminees": "termine", "completed": "termine",
    "preuve manquante": "preuve_manquante", "preuve_manquante": "preuve_manquante",
}


def normalize_measure_status(statut: str | None) -> str:
    key = unicodedata.normalize("NFD", str(statut or "")).encode("ascii", "ignore").decode()
    key = key.strip().lower()
    return _MEASURE_STATUS.get(key, key) or "planifie"


def _proof_valid(expiration: str | None, today: date) -> bool:
    if not expiration:
        return True
    try:
        return date.fromisoformat(str(expiration)[:10]) >= today
    except ValueError:
        return False


def pct(part: int, whole: int) -> int:
    """A rate in percent, rounded half up as the screen always did
    (Math.round), never to even: 1 out of 8 is 13."""
    return math.floor(part * 100 / whole + 0.5) if whole else 0


def measure_effective_status(statut: str | None, proof_expirations: Iterable[str | None],
                             today: date) -> str:
    """``proof_expirations``: the expiration dates of the measure's existing
    proofs ("" when a proof never expires)."""
    s = normalize_measure_status(statut)
    if s != "termine":
        return s
    valid = any(_proof_valid(e, today) for e in proof_expirations)
    return "termine" if valid else "preuve_manquante"


def is_applicable(applicable: Any) -> bool:
    return str(applicable if applicable is not None else "").strip().lower() not in ("non", "false")


def requirement_status(applicable: Any, derogated: bool, measure_statuses: list[str]) -> str:
    """``measure_statuses``: the effective statuses of the requirement's
    existing linked measures."""
    if not is_applicable(applicable):
        return "na"
    if derogated:
        return "derogated"
    if measure_statuses and all(s == "termine" for s in measure_statuses):
        return "ok"
    return "ko"


def requirement_key(framework_id: str | None, ref: str | None) -> str:
    """The business key of a requirement, the one derogations name."""
    return f"{framework_id or ''}:{ref or ''}"


def project_status(controls: Iterable[Any], measures: Iterable[Any], proofs: Iterable[Any],
                   derogated_keys: set[str], today: date) -> dict:
    """The status of every measure and requirement of one project, and the
    counts per framework. Rows are read by attribute (ORM rows)."""
    expirations = {str(p.id): (p.date_expiration or "") for p in proofs}
    measure_st = {
        str(m.id): measure_effective_status(
            m.statut, [expirations[str(i)] for i in (m.preuves_ids or []) if str(i) in expirations], today)
        for m in measures
    }
    requirements: dict[str, str] = {}
    frameworks: dict[str, dict] = {}
    for c in controls:
        key = requirement_key(c.framework_id, c.ref)
        linked = [measure_st[str(i)] for i in (c.mesures_ids or []) if str(i) in measure_st]
        st = requirement_status(c.applicable, key in derogated_keys, linked)
        requirements[key] = st
        fw = frameworks.setdefault(c.framework_id or "", {"applicable": 0, "ok": 0, "ko": 0,
                                                          "derogated": 0, "excluded": 0})
        if st == "na":
            fw["excluded"] += 1
            continue
        fw["applicable"] += 1
        fw[st] += 1
    for fw in frameworks.values():
        fw["pct"] = pct(fw["ok"], fw["applicable"])
    return {"as_of": today.isoformat(), "measures": measure_st, "requirements": requirements,
            "frameworks": frameworks}
