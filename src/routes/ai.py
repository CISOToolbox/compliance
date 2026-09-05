"""Compliance AI endpoints.

The shared /api/ai proxy (provider registry, key/settings management,
/complete, /runtime, /config, /keys, /validate-key, the LLM dispatch) lives in
src/ai_proxy_common.py. Only the compliance métier system prompt and its
suggestion endpoint are here — the methodology stays server-side.
See docs/CHANTIER_IA_BACKEND.md §Phase 2.
"""
from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException
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
from src.models import Project, User
# _can / _reconstruct_data live in routes/projects.py: the assistant applies
# EXACTLY the same access control and the same reconstruction as a normal
# project read. Redefining them here would make the two paths diverge.
from src.routes.projects import _can, _reconstruct_data
from src.ai_prompts import (KINDS, build_global, build_global_custom,
                            build_scope, build_suggest, validate_output)

# Common /api/ai endpoints; the business endpoint below is appended to it.
router = make_ai_router(generic_complete=False)


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
            '"mesures": [{"action": "new|enrich|link", "id": "M-XX only when action is enrich or link", '
            '"description": "measure title", "details": "implementation details", "statut": "termine|planifie"}]} '
            # Without these two fields in the SYSTEM schema, the anti-duplicate
            # instruction of the user prompt contradicted the shape imposed
            # here — and the model followed the shape, hence created duplicates.
            "Before proposing a NEW measure, check the existing measure plan given in the user prompt: "
            "if an existing measure already covers the requirement, use action 'link' with its id; "
            "if it partially covers it, use action 'enrich' with its id and only the ADDED details. "
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
        '{"action": "new|enrich|link", "id": "M-XX only when action is enrich or link", '
        '"description": "...", "details": "...", "responsable": "...", "statut": "termine|planifie"} '
        "Before proposing a NEW control, check the existing measure plan given in the user prompt: "
        "if an existing measure already covers the requirement, use action 'link' with its id; "
        "if it partially covers it, use action 'enrich' with its id and only the ADDED details. "
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
    """FEAT-41 — the client declares WHAT to suggest, not what to send to the model.

    No field carries a pre-composed prompt, and none must reappear:
    `CLAUDE.md` §5.1 and the contract test
    `test_ai_requests_carry_no_precomposed_prompt`.

    `document` is the only data still coming up from the client: it has
    just been dropped in the browser and does not exist in the database.
    """
    kind: str = "suggest"
    project_id: uuid.UUID
    framework: str
    language: str = "fr"
    index: int | None = None                  # kind=suggest: rank of the requirement
    refs: list[str] | None = None             # kind=global: the batch of requirements
    document: str | None = None               # kind=global: the uploaded document
    batch_num: int = 1
    total_batches: int = 1
    instruction: str | None = None            # kind=scope: the free-form instruction
    custom_instruction: str | None = None     # kind=suggest: replaces the auto instruction
    # FEAT-40 — intent, not data: the server reads the plan from the DB.
    include_existing_measures: bool = True


@router.post("/compliance/suggest")
async def compliance_suggest(body: ComplianceSuggestRequest,
                             user: User = Depends(get_current_user),
                             db: AsyncSession = Depends(get_db)):
    """Entry point for Compliance suggestions.

    The server re-reads the project from the DB and composes the prompt
    (FEAT-41). Before, the browser sent the full string: the content actually
    submitted to the provider escaped the server, and **no access control on
    the project was possible** — the prompt arrived already filled with its data.
    """
    _check_ai_access(user)
    _check_rate_limit(str(user.id) if user else "anonymous")

    if body.kind not in KINDS:
        raise HTTPException(status_code=422, detail=f"unknown kind '{body.kind}'")

    project = await db.get(Project, body.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    # Reading someone else's project via the assistant would be disguised exfiltration.
    if not _can("read", project, user):
        raise HTTPException(status_code=403, detail="no access to this project")

    D = await _reconstruct_data(db, project.id)
    try:
        if body.kind == "suggest":
            user_prompt = build_suggest(D, body.framework, body.index or 0,
                                        body.language, body.custom_instruction,
                                        body.include_existing_measures)
        elif body.kind == "global_custom":
            user_prompt = build_global_custom(D, body.framework, body.refs or [],
                                              body.instruction or "", body.language,
                                              body.include_existing_measures)
        elif body.kind == "global":
            user_prompt = build_global(D, body.framework, body.refs or [],
                                       body.document or "", body.batch_num,
                                       body.total_batches, body.language,
                                       body.include_existing_measures)
        else:
            user_prompt = build_scope(D, body.framework, body.instruction or "",
                                      body.language)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    provider, model = await _runtime_provider_model(db)
    # `global_custom` has no system prompt of its own: it shares the one of
    # `global`, as was the case when the frontend posted kind="global".
    system_kind = "global" if body.kind == "global_custom" else body.kind
    system = _compliance_system(system_kind, body.language) + _REFUSAL_HINT
    raw = await call_llm(db, system, user_prompt, provider, model)
    parsed = _parse_lax_or_refuse(raw)
    # `scope` returns a list of requirement references, not suggestions.
    if body.kind == "scope":
        return {"result": [str(x)[:60] for x in parsed[:500]] if isinstance(parsed, list) else []}
    try:
        forme = "global" if body.kind in ("global", "global_custom") else "suggest"
        return {"result": validate_output(parsed, forme)}
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"unusable AI response: {e}")
