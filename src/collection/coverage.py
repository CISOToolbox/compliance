"""FEAT-73 — which collectors can bring evidence to which requirement.

A collector names its requirements in the catalog (explicit). For the other
frameworks, the mappings to ISO 27001 deduce suggestions: a requirement mapped
to or from an ISO requirement the collector names. A suggestion counts once
the project confirms it, and is no longer proposed once rejected. Pure: the
caller passes the mapping rows and the project's decisions.
"""
from __future__ import annotations

from typing import Iterable


def links(collectors: Iterable[dict], mappings: Iterable[tuple[str, str, str, str]],
          decisions: dict[tuple[str, str], str]) -> dict[str, dict[str, dict]]:
    """{requirement key: {collector code: {kind, via?}}}, kind being
    explicit, confirmed or suggested. ``mappings``: (source framework, source
    ref, target framework, target ref); ``decisions``: (code, key) → decision."""
    to_iso: dict[str, set[str]] = {}
    for sfw, sref, tfw, tref in mappings:
        if tfw == "iso" and sfw != "iso":
            to_iso.setdefault(f"iso:{tref}", set()).add(f"{sfw}:{sref}")
        elif sfw == "iso" and tfw != "iso":
            to_iso.setdefault(f"iso:{sref}", set()).add(f"{tfw}:{tref}")
    out: dict[str, dict[str, dict]] = {}
    for c in collectors:
        explicit = set(c["requirement_keys"])
        for key in explicit:
            out.setdefault(key, {})[c["code"]] = {"kind": "explicit"}
        for iso_key in sorted(k for k in explicit if k.startswith("iso:")):
            for key in sorted(to_iso.get(iso_key, ())):
                if key in explicit or c["code"] in out.get(key, {}):
                    continue
                decision = decisions.get((c["code"], key))
                if decision == "rejected":
                    continue
                out.setdefault(key, {})[c["code"]] = {"kind": "confirmed" if decision == "confirmed" else "suggested",
                                                      "via": iso_key}
    return out
