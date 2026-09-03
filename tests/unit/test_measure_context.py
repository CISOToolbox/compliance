"""FEAT-40 (Compliance) — le plan de mesures complet dans le prompt.

C'est ici que le défaut était le plus marqué. ``D.mesures`` est un pool global
et ``control.mesures_ids`` rattache une mesure à **plusieurs** exigences — le
cas normal en conformité. Or le prompt ne montrait que les mesures liées à
l'exigence courante : deux exigences voisines produisaient mécaniquement deux
fois la même mesure, et rien ne le signalait.

Les descriptions de la fixture sont longues à dessein : une fixture courte
laisserait passer une troncature, alors que l'absence de troncature est la
décision prise pour cette feature.
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
    """Sans cela, le modèle ne peut pas proposer d'étendre une mesure à
    l'exigence traitée — il en crée une jumelle."""
    ctx = {m["id"]: m for m in measure_context(D)}
    assert ctx["M-1"]["exigences_couvertes"] == ["ISO27001 A.5.1", "ISO27001 A.8.2"]
    assert ctx["M-2"]["exigences_couvertes"] == ["ISO27001 A.8.2"]


def test_the_prompt_shows_measures_of_other_requirements():
    """LE test de la feature : en traitant A.5.1, le modèle doit voir M-2, qui
    n'est rattachée qu'à A.8.2. C'est ce qu'il ne voyait pas."""
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
    # …mais les mesures DÉJÀ liées à l'exigence restent : elles font partie de
    # son état, pas du plan global.
    assert "PSSI" in sans


def test_the_default_is_to_include():
    assert "M-2" in build_suggest(D, "iso27001", 0, "fr")


def test_a_custom_instruction_keeps_the_plan():
    """Le mode personnalisé remplace l'INSTRUCTION, pas les données : sans le
    plan, il redeviendrait une machine à doublons."""
    perso = build_suggest(D, "iso27001", 0, "fr", "Cible les accès privilégiés")
    assert "Cible les accès privilégiés" in perso
    assert "M-2" in perso and DETAIL_2 in perso
