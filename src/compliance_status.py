"""Compliance status — the single definition the screen and the posture read.

- The **effective status of a measure** is its own status, except that a
  completed measure is "preuve_manquante" (missing proof) until at least one
  of its proofs is valid: no expiration date, or an expiration not yet past
  (valid through its last day). A date that cannot be read proves nothing.
  A collected proof (FEAT-73) is valid while its last collection is
  compliant and recent; a failing one makes the measure "preuve_manquante"
  whatever its other proofs, one that could not be evaluated (collection in
  error, stalled, not collected yet) makes it "non_evaluable"; "sans objet"
  proves nothing. A compliant collection never completes a measure.
- The **status of a requirement** is "na" when it is not applicable,
  "derogated" under an approved derogation, "ok" when it has at least one
  linked measure and every linked measure is effectively completed,
  "unassessable" when every linked measure is completed or could not be
  evaluated, at least one of them not evaluated, "ko" otherwise.

The frontend shows what this module returns and recomputes nothing. Pure
functions: no database and no clock, ``today`` is passed in.
"""
from __future__ import annotations

import math
import unicodedata
from datetime import date, datetime, timedelta, timezone
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


# How long a collection stands, by the recurrence of its measure (a monitored
# measure is daily), plus one day of grace for a late run.
RECURRENCE_DAYS = {"quotidienne": 1, "mensuelle": 30, "trimestrielle": 90, "semestrielle": 180, "annuelle": 365}
_RESULT_VALIDITY = {"conforme": "valid", "non_conforme": "invalid", "erreur": "unassessable",
                    "sans_objet": "not_applicable"}


def manual_proof_validity(expiration: str | None, today: date) -> str:
    return "valid" if _proof_valid(expiration, today) else "invalid"


def collected_proof_validity(state: dict | None, now: datetime) -> str:
    """``state``: the monitor behind the proof — ``last_result``,
    ``last_collected_at``, ``active``, ``recurrence``; None when the proof has
    no monitor any more. A stopped monitoring whose last collection aged out
    is "expired", like a manual proof past its date: it proves nothing more
    but, unlike a failing collection, cancels no valid proof. So is a
    collected proof no monitoring holds (an orphan). A stopped monitoring ages
    on the daily window: its measure's recurrence is free again."""
    if not state:
        return "expired"
    if not state.get("last_collected_at"):
        return "unassessable" if state.get("active") else "expired"
    recurrence = state.get("recurrence") if state.get("active") else "quotidienne"
    window = timedelta(days=RECURRENCE_DAYS.get(recurrence or "", 1) + 1)
    if now - state["last_collected_at"] > window:
        return "unassessable" if state.get("active") else "expired"
    return _RESULT_VALIDITY.get(state.get("last_result") or "", "unassessable")


def pct(part: int, whole: int) -> int:
    """A rate in percent, rounded half up as the screen always did
    (Math.round), never to even: 1 out of 8 is 13."""
    return math.floor(part * 100 / whole + 0.5) if whole else 0


def measure_status_from_proofs(statut: str | None, proofs: Iterable[tuple[str, str]]) -> str:
    """``proofs``: (source, validity) of the measure's existing proofs."""
    s = normalize_measure_status(statut)
    if s != "termine":
        return s
    proofs = list(proofs)
    if any(src == "collected" and v == "invalid" for src, v in proofs):
        return "preuve_manquante"
    if any(src == "collected" and v == "unassessable" for src, v in proofs):
        return "non_evaluable"
    return "termine" if any(v == "valid" for _, v in proofs) else "preuve_manquante"


def measure_effective_status(statut: str | None, proof_expirations: Iterable[str | None],
                             today: date) -> str:
    """A measure backed by manual proofs only: ``proof_expirations`` are their
    expiration dates ("" when a proof never expires)."""
    return measure_status_from_proofs(statut, [("manual", manual_proof_validity(e, today))
                                               for e in proof_expirations])


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
    if measure_statuses and all(s in ("termine", "non_evaluable") for s in measure_statuses):
        return "unassessable"
    return "ko"


def requirement_key(framework_id: str | None, ref: str | None) -> str:
    """The business key of a requirement, the one derogations name."""
    return f"{framework_id or ''}:{ref or ''}"


def project_status(controls: Iterable[Any], measures: Iterable[Any], proofs: Iterable[Any],
                   derogated_keys: set[str], today: date, collected: dict | None = None,
                   now: datetime | None = None) -> dict:
    """The status of every proof, measure and requirement of one project, and
    the counts per framework. Rows are read by attribute (ORM rows);
    ``collected`` maps a collected proof's id to the state of its monitor."""
    now = now or datetime.now(timezone.utc)
    collected = collected or {}
    proof_st: dict[str, dict] = {}
    for p in proofs:
        src = getattr(p, "source", None) or "manual"
        validity = (collected_proof_validity(collected.get(str(p.id)), now) if src == "collected"
                    else manual_proof_validity(p.date_expiration or "", today))
        proof_st[str(p.id)] = {"source": src, "validity": validity}
    measure_st = {
        str(m.id): measure_status_from_proofs(
            m.statut, [(proof_st[str(i)]["source"], proof_st[str(i)]["validity"])
                       for i in (m.preuves_ids or []) if str(i) in proof_st])
        for m in measures
    }
    requirements: dict[str, str] = {}
    frameworks: dict[str, dict] = {}
    for c in controls:
        key = requirement_key(c.framework_id, c.ref)
        linked = [measure_st[str(i)] for i in (c.mesures_ids or []) if str(i) in measure_st]
        st = requirement_status(c.applicable, key in derogated_keys, linked)
        requirements[key] = st
        fw = frameworks.setdefault(c.framework_id or "", {"applicable": 0, "ok": 0, "ko": 0, "unassessable": 0,
                                                          "derogated": 0, "excluded": 0})
        if st == "na":
            fw["excluded"] += 1
            continue
        fw["applicable"] += 1
        fw[st] += 1
    for fw in frameworks.values():
        fw["pct"] = pct(fw["ok"], fw["applicable"])
    return {"as_of": today.isoformat(), "proofs": proof_st, "measures": measure_st,
            "requirements": requirements, "frameworks": frameworks}
