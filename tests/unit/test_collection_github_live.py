"""FEAT-73 lot 1d — the live GitHub provider, without a network call.

The real client runs on an httpx mock transport that answers like
api.github.com: the readers must give the rules the data the demonstration
gives them, the guard refuses a read the reader does not declare, a refusal
names the token permission, and what the plan does not offer is said.
"""
import os
import sys
import uuid
from datetime import datetime, timezone

import httpx
import pytest

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@localhost/db")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
os.environ["ENCRYPTION_KEY"] = "a-test-encryption-key-of-enough-length-0123456789"
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.collection.catalog import load_catalog  # noqa: E402
from src.collection.connections import ConnectionInputError, apply_connection_input  # noqa: E402
from src.collection.engine import finalize  # noqa: E402
from src.collection.providers import github  # noqa: E402
from src.collection.service import evaluators  # noqa: E402
from src.models import CollectionConnection  # noqa: E402

NOW = datetime(2026, 11, 21, 6, 0, tzinfo=timezone.utc)
# Split: a whole token-shaped literal trips the secret scan of the sources.
TOKEN = "github_pat_" + "A1" * 41
APP_TOKEN = "ghs_" + "B2" * 18
O = "/orgs/medsecure"

REPOS = [
    {"full_name": "medsecure/portail-patients", "visibility": "private", "default_branch": "main", "archived": False},
    {"full_name": "medsecure/sdk-open", "visibility": "public", "default_branch": "main", "archived": False},
    {"full_name": "medsecure/site", "visibility": "public", "default_branch": "main", "archived": False},
    {"full_name": "medsecure/old", "visibility": "private", "default_branch": "main", "archived": True},
]
UPGRADE = (403, {"message": "Upgrade to GitHub Pro or make this repository public to enable this feature."})
NOT_PROTECTED = (404, {"message": "Branch not protected"})


def _answers():
    """path → (status, body) or body; a list of bodies is a paginated answer."""
    return {
        O: {"login": "medsecure", "two_factor_requirement_enabled": False},
        f"{O}/repos": REPOS,
        f"{O}/members?role=admin": [{"login": "a-durand"}, {"login": "p-leroy"}],
        f"{O}/members?role=member": [{"login": "j-martin"}],
        f"{O}/members": [{"login": "a-durand"}],
        f"{O}/outside_collaborators": [{"login": "c-bernard"}],
        f"{O}/members?filter=2fa_disabled": [],
        f"{O}/outside_collaborators?filter=2fa_disabled": [{"login": "c-bernard"}],
        "/repos/medsecure/portail-patients/branches/main/protection": UPGRADE,
        "/repos/medsecure/portail-patients/rules/branches/main": [],
        # A ruleset asks one approval; the classic protection adds stale-review dismissal.
        "/repos/medsecure/sdk-open/branches/main/protection": {
            "required_pull_request_reviews": {"required_approving_review_count": 0, "dismiss_stale_reviews": True,
                                              "require_last_push_approval": False},
            "allow_force_pushes": {"enabled": False}, "allow_deletions": {"enabled": False}},
        "/repos/medsecure/sdk-open/rules/branches/main": [
            {"type": "pull_request", "parameters": {"required_approving_review_count": 1,
                                                    "dismiss_stale_reviews_on_push": False,
                                                    "require_last_push_approval": True}}],
        "/repos/medsecure/site/branches/main/protection": NOT_PROTECTED,
        "/repos/medsecure/site/rules/branches/main": [],
        "/repos/medsecure/portail-patients": {"visibility": "private", "security_and_analysis": {
            "advanced_security": {"status": "disabled"}, "secret_scanning": {"status": "disabled"}}},
        "/repos/medsecure/sdk-open": {"visibility": "public", "security_and_analysis": {
            "secret_scanning": {"status": "enabled"}, "secret_scanning_push_protection": {"status": "enabled"}}},
        "/repos/medsecure/site": {"visibility": "public", "security_and_analysis": {
            "secret_scanning": {"status": "enabled"}, "secret_scanning_push_protection": {"status": "disabled"}}},
        # sdk-open runs CodeQL from its own workflow (advanced setup); site has nothing.
        "/repos/medsecure/sdk-open/code-scanning/default-setup": {"state": "not-configured"},
        "/repos/medsecure/sdk-open/code-scanning/analyses": [{"id": 1}],
        "/repos/medsecure/site/code-scanning/default-setup": {"state": "not-configured"},
        "/repos/medsecure/site/code-scanning/analyses": (404, {"message": "no analysis found"}),
    }


class Api:
    """A mock api.github.com over a dict of answers; records the paths asked."""

    def __init__(self, answers=None, headers=None):
        self.answers, self.calls, self.headers = answers if answers is not None else _answers(), [], headers or {}

    def __call__(self, request: httpx.Request) -> httpx.Response:
        path = request.url.path
        role, only = request.url.params.get("role"), request.url.params.get("filter")
        key = f"{path}?role={role}" if role else f"{path}?filter={only}" if only else path
        self.calls.append((request.url.host, key, dict(request.headers)))
        answer = self.answers.get(key, (404, {"message": "Not Found"}))
        status, body = answer if isinstance(answer, tuple) else (200, answer)
        return httpx.Response(status, json=body, headers=self.headers)


def _conn(settings=None):
    return CollectionConnection(id=uuid.uuid4(), project_id=uuid.uuid4(), provider="github", label="MedSecure",
                                mode="live", settings={"organization": "medsecure", **(settings or {})})


def _provider(api, token=TOKEN):
    def factory(conn, secrets, allowed):
        http = httpx.Client(base_url=github.API, transport=httpx.MockTransport(api))
        return github.Client(conn, secrets, allowed, http=http)
    return github.GithubProvider(factory), {"token": token}


def _collect(code, api=None):
    api = api or Api()
    provider, secrets = _provider(api)
    collector = load_catalog().describe(code)
    fetched = provider.fetch_sync(_conn(), secrets, collector, NOW)
    if fetched["error"]:
        return fetched, api
    evaluation = evaluators()[code](fetched["raw"], {p["id"]: p["default"] for p in collector.get("params", [])},
                                    {"now": NOW, "people": None})
    return finalize(evaluation, fetched, []), api


EXPECTED = {
    "GH-01": ("non_conforme", ["medsecure/portail-patients", "medsecure/site"]),
    "GH-02": ("non_conforme", ["medsecure/portail-patients", "medsecure/site"]),
    "GH-03": ("non_conforme", ["medsecure", "c-bernard (outside collaborator)"]),
    "GH-04": ("sans_objet", []),
    "GH-05": ("conforme", []),
    "GH-06": ("non_conforme", ["medsecure/portail-patients", "medsecure/site"]),
    "GH-07": ("non_conforme", ["medsecure/sdk-open", "medsecure/site"]),
}


@pytest.mark.parametrize("code", sorted(EXPECTED))
def test_each_collector_reads_the_live_organisation_and_its_rule_decides(code):
    version, api = _collect(code)
    result, resources = EXPECTED[code]
    assert version["result"] == result, version
    assert sorted(f["resource"] for f in version["findings"]) == sorted(resources)
    assert {host for host, _, _ in api.calls} == {"api.github.com"}


def test_the_rules_of_a_branch_are_the_strictest_of_its_rulesets_and_its_protection():
    version, _ = _collect("GH-01")
    sdk = next(r for r in version["raw"]["repos"] if r["full_name"] == "medsecure/sdk-open")
    assert {"type": "pull_request", "parameters": {"required_approving_review_count": 1,
                                                   "dismiss_stale_reviews_on_push": True,
                                                   "require_last_push_approval": True}} in sdk["rules"]
    assert {r["type"] for r in sdk["rules"]} == {"pull_request", "non_fast_forward", "deletion"}


def test_a_private_repository_of_a_free_organisation_is_not_compliant_and_says_why():
    version, _ = _collect("GH-01")
    portail = next(f for f in version["findings"] if f["resource"] == "medsecure/portail-patients")
    assert "Team or Enterprise" in portail["detail"]
    assert "medsecure/old" not in str(version["raw"])            # archived
    scanning = next(f for f in _collect("GH-06")[0]["findings"] if f["resource"] == "medsecure/portail-patients")
    assert "Advanced Security" in scanning["detail"]


def test_code_scanning_run_by_a_workflow_counts_as_configured():
    version, _ = _collect("GH-06")
    sdk = next(r for r in version["raw"]["repos"] if r["full_name"] == "medsecure/sdk-open")
    assert sdk["code_scanning_default_setup"] == {"state": "configured"}


def test_a_repository_the_token_cannot_read_is_unreadable_the_others_are_evaluated():
    answers = _answers()
    answers["/repos/medsecure/sdk-open/branches/main/protection"] = (403, {"message": "Resource not accessible by "
                                                                                     "personal access token"})
    version, _ = _collect("GH-02", Api(answers))
    assert [u["resource"] for u in version["unreadable"]] == ["medsecure/sdk-open"]
    assert "administration:read" in version["unreadable"][0]["reason"]
    assert [f["resource"] for f in version["findings"]] == ["medsecure/portail-patients", "medsecure/site"]


def test_every_declared_read_is_one_the_catalog_names_with_its_permission():
    for code, ops in github.READS.items():
        collector = load_catalog().describe(code)
        assert set(collector["reads"]) == ops, code
        assert set(collector["permissions"]) == {github.PERMISSION[op] for op in ops}, code


def test_the_guard_refuses_a_read_the_reader_does_not_declare():
    provider, secrets = _provider(Api())
    c = provider.client_factory(_conn(), secrets, github.READS["GH-07"])
    with pytest.raises(PermissionError):
        c.get("orgs:get", O)
    for url in ("https://evil.example/orgs/medsecure/repos", "HTTPS://evil.example/orgs/medsecure/repos",
                "//evil.example/orgs/medsecure/repos", "http://api.github.com/orgs/medsecure/repos"):
        with pytest.raises(PermissionError):                     # a link to another host, or in clear
            c._send("repos:list", url)


def test_every_page_is_read_and_the_token_goes_to_github_only():
    pages = {1: [{"full_name": f"medsecure/r{i}", "visibility": "private", "archived": False} for i in range(100)],
             2: [{"full_name": "medsecure/last", "visibility": "public", "archived": False}]}
    seen = []

    def answer(request):
        seen.append(request.headers["authorization"])
        page = int(request.url.params.get("page", "1"))
        headers = {"link": f'<{github.API}{O}/repos?page=2&per_page=100>; rel="next"'} if page == 1 else {}
        return httpx.Response(200, json=pages[page], headers=headers)
    version, _ = _collect("GH-07", answer)
    assert len(version["raw"]["repos"]) == 101
    assert seen == [f"Bearer {TOKEN}"] * 2


@pytest.mark.parametrize("status,headers,message", [
    (401, {}, "GitHub refused the token"),
    (403, {"x-ratelimit-remaining": "0", "x-ratelimit-reset": "1795327200"}, "rate limit is reached"),
    (403, {"x-ratelimit-remaining": "4200", "retry-after": "60"}, "secondary rate limit is reached"),
])
def test_a_refused_token_or_the_rate_limit_is_said(status, headers, message):
    def answer(request):
        return httpx.Response(status, json={"message": "no"}, headers=headers)
    fetched, _ = _collect("GH-07", answer)
    assert message in fetched["error"]["reason"]


def test_an_organisation_the_token_does_not_see_is_said():
    answers = _answers()
    answers[O] = (404, {"message": "Not Found"})
    fetched, _ = _collect("GH-03", Api(answers))
    assert fetched["error"]["reason"].startswith("GitHub does not show this organisation to the token")


def test_a_hidden_two_factor_setting_names_the_permission_not_a_finding():
    answers = _answers()
    answers[O] = {"login": "medsecure"}
    fetched, _ = _collect("GH-03", Api(answers))
    assert fetched["error"]["missing_permission"] == "organization_administration:read"


def test_each_persons_two_factor_state_unseen_by_the_token_is_unreadable_not_compliant():
    answers = _answers()
    answers[f"{O}/members?filter=2fa_disabled"] = (422, {"message": "Only owners can use this filter."})
    version, _ = _collect("GH-03", Api(answers))
    assert version["evaluated"] == 1 and version["scope"]["resources"] == ["medsecure"]
    assert version["partial"] and version["unreadable"][0]["resource"] == "members"
    assert "Only owners can use this filter" in version["unreadable"][0]["reason"]
    assert version["unreadable"][0]["reason"].endswith("GitHub shows it to an organisation owner only")


def test_a_two_factor_filter_github_did_not_apply_is_unreadable_not_everyone_non_compliant():
    answers = _answers()
    answers[O]["two_factor_requirement_enabled"] = True
    answers[f"{O}/members?filter=2fa_disabled"] = answers[f"{O}/members"]
    answers[f"{O}/outside_collaborators?filter=2fa_disabled"] = answers[f"{O}/outside_collaborators"]
    version, _ = _collect("GH-03", Api(answers))
    assert version["result"] == "conforme" and version["scope"]["resources"] == ["medsecure"]
    assert "the filter was not applied" in version["unreadable"][0]["reason"]


def test_a_server_error_is_tried_again_then_said(monkeypatch):
    monkeypatch.setattr(github.time, "sleep", lambda s: None)
    statuses = [502, 200]

    def answer(request):
        return httpx.Response(statuses.pop(0), json=REPOS)
    assert len(_collect("GH-07", answer)[0]["raw"]["repos"]) == 3
    fetched, _ = _collect("GH-07", lambda request: httpx.Response(503, json={}))
    assert fetched["error"]["reason"] == "GitHub could not be reached"


def test_a_redirection_is_not_read_as_data():
    answers = _answers()
    answers[f"{O}/repos"] = (301, {"message": "Moved Permanently", "url": "https://api.github.com/x"})
    fetched, _ = _collect("GH-07", Api(answers))
    assert fetched["raw"] is None and fetched["error"]["missing_permission"] is None
    assert "has moved" in fetched["error"]["reason"]


def test_code_scanning_without_its_licence_is_off_not_unreadable():
    """Secret Protection alone: GitHub refuses the code scanning setup."""
    answers = _answers()
    answers["/repos/medsecure/portail-patients"] = {"visibility": "private", "security_and_analysis": {
        "secret_protection": {"status": "enabled"}, "secret_scanning": {"status": "enabled"},
        "secret_scanning_push_protection": {"status": "enabled"}}}
    answers["/repos/medsecure/portail-patients/code-scanning/default-setup"] = (
        403, {"message": "Code Security must be enabled for this repository to use code scanning."})
    version, _ = _collect("GH-06", Api(answers))
    assert version["unreadable"] == []
    assert any(f["resource"] == "medsecure/portail-patients" and "code scanning" in f["detail"]
               for f in version["findings"])


def test_a_branch_name_is_sent_encoded_and_an_empty_repository_is_not_a_permission():
    answers = _answers()
    answers[f"{O}/repos"] = [{"full_name": "medsecure/site", "visibility": "public", "default_branch": "release#1",
                              "archived": False}]
    api = Api(answers)
    version, _ = _collect("GH-01", api)
    assert ("api.github.com", "/repos/medsecure/site/branches/release#1/protection") in [c[:2] for c in api.calls]
    assert version["unreadable"] == [{"resource": "medsecure/site", "reason": "branch protection: GitHub answered "
                                                                              "404 (Not Found)"}]


def test_the_connection_test_says_when_the_token_sees_only_some_private_repositories():
    answers = _answers()
    answers[O] = {"login": "medsecure", "two_factor_requirement_enabled": True, "total_private_repos": 5}
    provider, secrets = _provider(Api(answers))
    result = provider.test_sync(_conn(), secrets)
    assert result["ok"] and result["partial"] and result["missing_permissions"] == []
    assert "the token sees 2 of the 5 private repositories" in result["message"]


def test_approved_tokens_are_read_with_a_github_app_token_only():
    api = Api()
    assert _collect("GH-05", api)[0]["scope"]["not_available"] == ["approved tokens are readable by a GitHub App only"]
    assert not any("personal-access-tokens" in path for _, path, _ in api.calls)
    answers = _answers()
    answers[f"{O}/personal-access-tokens"] = [{"id": 7, "owner": {"login": "j-martin"}, "token_name": "ci",
                                               "token_expires_at": None, "access_granted_at": "2026-01-01T00:00:00Z"}]
    provider, secrets = _provider(Api(answers), token=APP_TOKEN)
    collector = load_catalog().describe("GH-05")
    fetched = provider.fetch_sync(_conn(), secrets, collector, NOW)
    assert fetched["raw"]["pat_grants"][0] == {"id": 7, "owner": "j-martin", "token_name": "ci",
                                               "token_expires_at": None, "access_granted_at": "2026-01-01T00:00:00Z"}


def test_the_connection_test_names_each_missing_permission():
    provider, secrets = _provider(Api())
    assert provider.test_sync(_conn(), secrets) == {"ok": True, "partial": False, "missing_permissions": [],
                                                     "message": f"Connected to medsecure: {len(REPOS)} repositories read."}
    answers = _answers()
    answers[f"{O}/members"] = (403, {"message": "Resource not accessible by personal access token"})
    answers["/repos/medsecure/sdk-open/code-scanning/analyses"] = (403, {"message": "Resource not accessible by "
                                                                                   "personal access token"})
    provider, secrets = _provider(Api(answers))
    result = provider.test_sync(_conn(), secrets)
    assert result["ok"] and result["partial"]
    assert result["missing_permissions"] == ["members:read", "security_events:read"]
    answers[O] = {"login": "medsecure"}                          # its settings hidden: the rest is still tested
    provider, secrets = _provider(Api(answers))
    result = provider.test_sync(_conn(), secrets)
    assert result["ok"] and result["missing_permissions"] == ["members:read", "organization_administration:read",
                                                              "security_events:read"]


def _new(payload):
    c = CollectionConnection(project_id=uuid.uuid4(), provider="github")
    apply_connection_input(c, payload, creating=True)
    return c


def test_a_live_github_connection_takes_a_fine_grained_token():
    c = _new({"label": "MedSecure", "mode": "live", "settings": {"organization": "medsecure"},
              "secrets": {"token": TOKEN}})
    assert c.mode == "live"
    assert type(github.GithubProvider()).__name__ == "GithubProvider"


@pytest.mark.parametrize("payload,message", [
    ({"settings": {"organization": "medsecure"}, "secrets": {"token": "ghp_" + "C3" * 18}}, "not a classic token"),
    ({"settings": {"organization": "medsecure"}, "secrets": {"token": "not-a-token"}}, "fine-grained token"),
    ({"settings": {"organization": "https://github.com/medsecure"}, "secrets": {"token": TOKEN}},
     "login of a github.com organisation"),
    ({"settings": {"organization": "medsecure"}}, "token is required"),
])
def test_what_github_would_not_accept_is_refused(payload, message):
    with pytest.raises(ConnectionInputError, match=message):
        _new({"label": "MedSecure", "mode": "live", **payload})
