"""FEAT-40 (Compliance) — the complete measure plan in the prompt.

This is where the flaw was most pronounced. ``D.mesures`` is a global pool
and ``control.mesures_ids`` attaches a measure to **several** requirements —
the normal case in compliance. Yet the prompt only showed the measures linked
to the current requirement: two neighbouring requirements mechanically
produced the same measure twice, and nothing signalled it.

The fixture descriptions are deliberately long: a short fixture would let a
truncation slip through, whereas the absence of truncation is the decision
made for this feature.
"""
from __future__ import annotations

import os
import sys

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@127.0.0.1:5999/t")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "x" * 32)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.ai_prompts import build_suggest, measure_context  # noqa: E402

DETAIL_1 = (
    "PSSI rédigée et revue par le RSSI, en attente de validation par le COMEX. "
    "Le volet télétravail et le volet sous-traitance sont encore absents, ce "
    "qui empêche de la publier en l'état auprès des collaborateurs. Une "
    "relecture juridique est programmée avant diffusion. FIN-M1"
)
DETAIL_2 = (
    "MFA déployée sur le VPN et la messagerie. Les applications métier "
    "hébergées chez le prestataire n'en bénéficient pas encore, faute de "
    "fédération d'identité. Le raccordement SAML est chiffré mais non "
    "planifié à ce jour. FIN-M2"
)

D = {
    "meta": {"societe": "MedSecure", "perimetre": "SI de production"},
    "referentiels": {
        "iso27001": [
            {"ref": "A.5.1", "thematique": "Politiques", "mesure": "Politique de sécurité",
             "ecart": "Non validée", "mesures_ids": ["M-1"], "conformite": "40"},
            {"ref": "A.8.2", "thematique": "Accès", "mesure": "Droits d'accès privilégiés",
             "ecart": "", "mesures_ids": ["M-1", "M-2"], "conformite": "60"},
        ]
    },
    "mesures": [
        {"id": "M-1", "description": "PSSI", "details": DETAIL_1, "statut": "planifie"},
        {"id": "M-2", "description": "MFA", "details": DETAIL_2, "statut": "planifie"},
    ],
}


def test_the_context_carries_the_whole_pool():
    ctx = measure_context(D)
    assert {m["id"] for m in ctx} == {"M-1", "M-2"}


def test_the_context_says_which_requirements_a_measure_already_covers():
    """Without this, the model cannot propose extending a measure to the
    requirement at hand — it creates a twin of it."""
    ctx = {m["id"]: m for m in measure_context(D)}
    assert ctx["M-1"]["exigences_couvertes"] == ["ISO27001 A.5.1", "ISO27001 A.8.2"]
    assert ctx["M-2"]["exigences_couvertes"] == ["ISO27001 A.8.2"]


def test_the_prompt_shows_measures_of_other_requirements():
    """THE test of the feature: when processing A.5.1, the model must see M-2,
    which is attached only to A.8.2. That is what it did not see."""
    prompt = build_suggest(D, "iso27001", 0, "fr")
    assert "M-2" in prompt, "les mesures des autres exigences restent invisibles"
    assert DETAIL_2 in prompt
    assert "FIN-M2" in prompt, "description tronquée"


def test_the_prompt_asks_for_the_action_discriminant():
    prompt = build_suggest(D, "iso27001", 0, "fr")
    for mot in ("new", "enrich", "link"):
        assert mot in prompt, f"action '{mot}' non proposée au modèle"


def test_unchecking_removes_the_block_entirely():
    sans = build_suggest(D, "iso27001", 0, "fr", None, False)
    assert "All existing measures" not in sans
    assert DETAIL_2 not in sans
    # …but the measures ALREADY linked to the requirement remain: they are
    # part of its state, not of the global plan.
    assert "PSSI" in sans


def test_the_default_is_to_include():
    assert "M-2" in build_suggest(D, "iso27001", 0, "fr")


def test_a_custom_instruction_keeps_the_plan():
    """The custom mode replaces the INSTRUCTION, not the data: without the
    plan, it would become a duplicate machine again."""
    perso = build_suggest(D, "iso27001", 0, "fr", "Cible les accès privilégiés")
    assert "Cible les accès privilégiés" in perso
    assert "M-2" in perso and DETAIL_2 in perso
