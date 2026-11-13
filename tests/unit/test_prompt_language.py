"""The system prompt and the user prompt of an AI request name the same
language, whatever the spelling the browser sent (`FR`, `fr-FR`, `fr_FR`).

The user prompt read the language through ``_lang``; the system prompt and
the choice of the bilingual fields compared it to ``"fr"`` exactly. With
`fr-FR`, the model was told "Respond in English" by one and "Respond in
French" by the other, and was given the English wording of the framework.
"""
from __future__ import annotations

import os
import sys

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@127.0.0.1:5999/t")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "x" * 32)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src import ai_prompts  # noqa: E402
from src.ai_prompts import build_scope, build_suggest  # noqa: E402
from src.routes.ai import _compliance_system  # noqa: E402

FRENCH = ["fr", "FR", "fr-FR", "fr_FR", " fr "]
ENGLISH = ["en", "EN", "en-GB", "", None, "de"]
KINDS = ["suggest", "global", "scope"]

D = {
    "referentiels": {"iso27001": [
        {"ref": "A.5.1", "thematique": "Politiques", "thematique_en": "Policies",
         "mesure": "Politique de sécurité", "mesure_en": "Security policy",
         "description": "Une politique est définie.", "description_en": "A policy is defined."},
    ]},
    "mesures": [],
}


@pytest.mark.parametrize("kind", KINDS)
@pytest.mark.parametrize("language", FRENCH)
def test_the_system_prompt_asks_for_french(kind, language):
    system = _compliance_system(kind, language)
    assert "French" in system and "English" not in system


@pytest.mark.parametrize("kind", KINDS)
@pytest.mark.parametrize("language", ENGLISH)
def test_the_system_prompt_asks_for_english(kind, language):
    system = _compliance_system(kind, language)
    assert "English" in system and "French" not in system


@pytest.mark.parametrize("language", FRENCH)
def test_system_and_user_prompts_name_the_same_language(language):
    whole = _compliance_system("suggest", language) + build_suggest(D, "iso27001", 0, language)
    assert "French" in whole and "English" not in whole


@pytest.mark.parametrize("language", FRENCH)
def test_a_french_request_reads_the_french_wording(language):
    row = D["referentiels"]["iso27001"][0]
    assert ai_prompts._rt(row, "mesure", language) == "Politique de sécurité"
    assert "Politique de sécurité" in build_scope(D, "iso27001", "MFA", language)
    assert "Security policy" not in build_scope(D, "iso27001", "MFA", language)


@pytest.mark.parametrize("language", ENGLISH)
def test_another_language_reads_the_english_wording(language):
    row = D["referentiels"]["iso27001"][0]
    assert ai_prompts._rt(row, "mesure", language) == "Security policy"
