"""Validation de sortie IA par FORME DE RÉPONSE (post-incident 2026-09-02).

Le `_CHAMPS` unique du module ne contenait pas `mesures` : le mode global
rendait des exigences sans aucune mesure — tout le volet FEAT-40 de l'analyse
documentaire était mort, en silence. Le module n'avait AUCUN test. Chaque
forme a désormais son nettoyeur, et chaque nettoyeur son test.
"""
from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.ai_prompts import MAX_ENTREES_GLOBAL, validate_output  # noqa: E402


# ── forme "suggest" ──────────────────────────────────────────────────────

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


# ── forme "global" ───────────────────────────────────────────────────────

def test_global_entries_keep_their_mesures():
    # LE bug : `mesures` absent du _CHAMPS unique, supprimé de chaque entrée.
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
    # Le frontend envoie des lots jusqu'à 50 refs ; le plafond « suggestions »
    # (25) tronquait la moitié du lot en silence.
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


# ── garde-fou transversal ────────────────────────────────────────────────

def test_the_routes_module_imports_what_it_raises():
    # Le bug d'origine : `raise HTTPException` sans import — NameError → 500
    # sur les 5 chemins d'erreur de la route, invisible du happy path.
    import importlib
    mod = importlib.import_module("src.routes.ai")
    assert hasattr(mod, "HTTPException")
