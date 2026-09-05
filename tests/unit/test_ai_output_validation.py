"""AI output validation by RESPONSE SHAPE (post-incident 2026-09-02).

The module's single `_CHAMPS` did not contain `mesures`: the global mode
returned requirements without any measure — the whole FEAT-40 side of the
document analysis was dead, silently. The module had NO test. Each shape now
has its cleaner, and each cleaner its test.
"""
from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.ai_prompts import MAX_ENTREES_GLOBAL, validate_output  # noqa: E402


# ── "suggest" shape ──────────────────────────────────────────────────────

def test_suggest_keeps_the_fields_the_frontend_reads():
    out = validate_output([{
        "action": "enrich", "id": "M-01", "description": "MFA",
        "details": "Étendre aux VPN.", "responsable": "RSSI",
        "statut": "planifie", "inconnu": "dropped",
    }], "suggest")
    assert out == [{"action": "enrich", "id": "M-01", "description": "MFA",
                    "details": "Étendre aux VPN.", "responsable": "RSSI",
                    "statut": "planifie"}]


def test_an_invalid_action_takes_the_id_with_it():
    out = validate_output([{"action": "replace", "id": "M-01",
                            "description": "x"}], "suggest")
    assert out == [{"description": "x"}]


# ── "global" shape ───────────────────────────────────────────────────────

def test_global_entries_keep_their_mesures():
    # THE bug: `mesures` missing from the single _CHAMPS, stripped from every entry.
    out = validate_output([{
        "ref": "A.5.1", "status": "KO", "ecart": "Pas de politique formelle",
        "mesures": [{"action": "new", "description": "Rédiger la politique",
                     "statut": "planifie"}],
    }], "global")
    assert out[0]["mesures"] == [{"action": "new",
                                  "description": "Rédiger la politique",
                                  "statut": "planifie"}]


def test_nested_mesures_are_constrained_like_top_level_ones():
    out = validate_output([{
        "ref": "A.5.1", "status": "KO",
        "mesures": [{"action": "hijack", "id": "M-09", "description": "x"}],
    }], "global")
    assert out[0]["mesures"] == [{"description": "x"}]


def test_global_accepts_a_full_batch_of_requirements():
    # The frontend sends batches of up to 50 refs; the "suggestions" cap
    # (25) silently truncated half the batch.
    entrees = [{"ref": f"A.{i}", "status": "OK"} for i in range(50)]
    assert len(validate_output(entrees, "global")) == 50
    assert MAX_ENTREES_GLOBAL >= 50


def test_conformite_reaches_the_global_custom_accept_path():
    out = validate_output([{"ref": "A.5.1", "conformite": "partiel",
                            "ecart": "x"}], "global")
    assert out[0]["conformite"] == "partiel"


def test_an_unusable_response_raises():
    with pytest.raises(ValueError):
        validate_output(["rien", 42], "global")


# ── cross-cutting guard ──────────────────────────────────────────────────

def test_the_routes_module_imports_what_it_raises():
    # The original bug: `raise HTTPException` without the import — NameError
    # → 500 on the route's 5 error paths, invisible from the happy path.
    import importlib
    mod = importlib.import_module("src.routes.ai")
    assert hasattr(mod, "HTTPException")
