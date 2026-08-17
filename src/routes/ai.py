"""Compliance AI endpoints.

The shared /api/ai proxy (provider registry, key/settings management,
/complete, /runtime, /config, /keys, /validate-key, the LLM dispatch) lives in
src/ai_proxy_common.py. Only the compliance métier system prompt and its
suggestion endpoint are here — the methodology stays server-side.
See docs/CHANTIER_IA_BACKEND.md §Phase 2.
"""
from __future__ import annotations

from fastapi import Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai_proxy_common import (
    _REFUSAL_HINT,
    _check_ai_access,
    _check_rate_limit,
    _parse_lax_or_refuse,
    _runtime_provider_model,
    call_llm,
    make_ai_router,
)
from src.auth import get_current_user
from src.database import get_db
from src.models import User

# Common /api/ai endpoints; the métier endpoint below is appended to it.
router = make_ai_router()


def _compliance_system(kind: str, language: str) -> str:
    """Build the system prompt for a compliance AI feature.

    kind:
      - "suggest" — propose security controls for one requirement
      - "global"  — analyze a document/instruction, return per-requirement
                    coverage + measures (conformity batch & custom modes)
      - "scope"   — identify which requirements a user instruction concerns
    """
    lang = "English" if language == "en" else "French"
    if kind == "scope":
        return (
            "You are a compliance assistant. The user gave an instruction that may affect some or all requirements. "
            "First, identify WHICH requirements are concerned by the instruction. "
            "Respond ONLY with a valid JSON array of the affected requirement refs (strings). "
            "If ALL are affected, return [\"*\"]. If none, return []. "
            "Respond in " + lang + "."
        )
    if kind == "global":
        return (
            "You are a cybersecurity compliance expert. "
            "You analyze a document or apply a user instruction to identify security measures already in place and gaps. "
            "For each requirement, propose concrete security measures (mesures). "
            "Respond ONLY with a valid JSON array. Each entry: "
            '{"ref": "requirement reference", "status": "OK|KO", "ecart": "brief comment on coverage", '
            '"mesures": [{"description": "measure title", "details": "implementation details", "statut": "termine|planifie"}]} '
            "OK = the requirement is covered → propose measures with statut 'termine' describing what IS already done. "
            "KO = gap identified → propose measures with statut 'planifie' describing what NEEDS to be done. "
            "Each requirement should have 1-3 measures. "
            "IMPORTANT: describe what IS done or NEEDS to be done, not what the document says. "
            "Only include requirements present in the user prompt. "
            "Respond in " + lang + "."
        )
    # default: "suggest"
    return (
        "You are a cybersecurity compliance expert. "
        "You help organizations define security controls (mesures de sécurité) to meet regulatory requirements. "
        "You must respond in " + lang + ". "
        "You must respond ONLY with a valid JSON array of objects. No markdown, no explanation, no preamble. "
        "Each object has: "
        '{"description": "...", "details": "...", "responsable": "...", "statut": "termine|planifie"} '
        "where 'description' is a concise control title (max 100 chars), "
        "'details' is the implementation guidance (2-3 sentences), "
        "'responsable' is the suggested owner role (e.g. CISO, IT Manager, DPO), "
        "and 'statut' indicates whether the control is already in place ('termine') or needs to be implemented ('planifie'). "
        "IMPORTANT: if the comments/gap analysis mention that something IS already done, "
        "propose a measure with statut 'termine' to formalize it. "
        "If something NEEDS to be done, propose with statut 'planifie'. "
        "Propose 2 to 5 controls. They must be specific, actionable, and proportionate."
    )


class ComplianceSuggestRequest(BaseModel):
    kind: str = "suggest"
    user: str
    language: str = "fr"


@router.post("/compliance/suggest")
async def compliance_suggest(body: ComplianceSuggestRequest,
                             user: User = Depends(get_current_user),
                             db: AsyncSession = Depends(get_db)):
    """Compliance suggestion endpoint. The frontend builds the per-feature user
    prompt from the live data and posts it with a `kind` discriminator
    (suggest / global / scope); the compliance methodology system prompts are
    owned here, server-side. Returns the lax-parsed JSON payload (an array for
    every current kind)."""
    _check_ai_access(user)
    _check_rate_limit(str(user.id) if user else "anonymous")
    provider, model = await _runtime_provider_model(db)
    system = _compliance_system(body.kind, body.language) + _REFUSAL_HINT
    raw = await call_llm(db, system, body.user, provider, model)
    return {"result": _parse_lax_or_refuse(raw)}
