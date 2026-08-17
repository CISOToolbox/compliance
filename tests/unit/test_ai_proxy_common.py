"""Design regression (H4): the shared AI proxy is wired and behaves the same
after compliance's ai.py was reduced to its métier endpoint.

The provider plumbing moved to src/ai_proxy_common.py (a make_ai_router()
factory + call_llm + helpers). These tests prove the module still exposes every
common endpoint plus its own, and that the canonical lax parser handles arrays
and refusals (the behaviour that had drifted across the nine copies).
"""
import os
import sys

import pytest

os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import HTTPException  # noqa: E402

from src.ai_proxy_common import _parse_lax_or_refuse, _provider_complete, call_llm  # noqa: E402
from src.routes.ai import router  # noqa: E402


def test_router_exposes_common_and_domain_endpoints():
    paths = {r.path for r in router.routes}
    for p in (
        "/api/ai/complete", "/api/ai/runtime", "/api/ai/config",
        "/api/ai/keys", "/api/ai/validate-key",   # common (make_ai_router)
        "/api/ai/compliance/suggest",             # compliance métier
    ):
        assert p in paths, f"missing endpoint: {p}"


def test_call_llm_is_the_provider_complete_alias():
    assert call_llm is _provider_complete


def test_parse_lax_accepts_arrays_and_strips_fences():
    assert _parse_lax_or_refuse('```json\n[{"description": "x"}]\n```') == [{"description": "x"}]
    assert _parse_lax_or_refuse('  {"ref": "A.5"}  ') == {"ref": "A.5"}


def test_parse_lax_surfaces_refusals_as_422():
    with pytest.raises(HTTPException) as exc:
        _parse_lax_or_refuse('{"error": "off-topic"}')
    assert exc.value.status_code == 422


def test_parse_lax_rejects_non_json():
    with pytest.raises(HTTPException) as exc:
        _parse_lax_or_refuse("sorry, I cannot help with that")
    assert exc.value.status_code == 502
