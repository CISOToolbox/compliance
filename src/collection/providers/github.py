"""FEAT-73 lot 1d — the live GitHub provider: an organisation of github.com,
read with a read-only fine-grained token (or a GitHub App's token).

Same contract as the live AWS provider. Every call goes to api.github.com
only (a pagination link to another host is refused, the token never leaves
it), through the suite's proxy when one is set (httpx reads the environment
the proxy settings export). Each reader names the operations it performs
(`READS`); the client refuses any other before the request is sent, and a
refusal names the token permission it needs. A repository that cannot be
read is listed as unreadable, the others are still evaluated.

What the plan does not offer is said, not guessed: branch rules on a private
repository of a free organisation, code and secret scanning on a private
repository without Advanced Security. The approved tokens of the
organisation are readable by a GitHub App only.
"""
from __future__ import annotations

import asyncio
import re
import time
from datetime import datetime, timezone
from typing import Any, Callable, Iterator
from urllib.parse import quote

import httpx

API = "https://api.github.com"
API_HOST = "api.github.com"
ORG_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$")
# A fine-grained personal token, or a GitHub App installation token. A classic
# token carries scopes that write: it is refused.
TOKEN_RE = re.compile(r"^(github_pat_[A-Za-z0-9_]{20,255}|ghs_[A-Za-z0-9]{20,255})$")
USER_AGENT = "cisotoolbox-compliance"
PAGE_SIZE = 100
MAX_PAGES = 50                                  # 5,000 items per list
ATTEMPTS = 3

# The token permission behind each operation, as the fine-grained token form names it.
PERMISSION: dict[str, str] = {
    "repos:list": "metadata:read",
    "repos:get": "metadata:read",
    "repos:get_branch_rules": "metadata:read",
    "repos:get_branch_protection": "administration:read",
    "orgs:get": "organization_administration:read",
    "orgs:list_members": "members:read",
    "orgs:list_outside_collaborators": "members:read",
    "orgs:list_pat_grants": "organization_personal_access_tokens:read",
    "code_scanning:get_default_setup": "administration:read",
    "code_scanning:list_analyses": "security_events:read",
}

_REPOS = {"repos:list"}
_RULES = _REPOS | {"repos:get_branch_rules", "repos:get_branch_protection"}
READS: dict[str, set[str]] = {
    "GH-01": _RULES, "GH-02": _RULES,
    "GH-03": {"orgs:get"},
    "GH-04": {"orgs:list_members", "orgs:list_outside_collaborators"},
    "GH-05": {"orgs:list_members", "orgs:list_pat_grants"},
    "GH-06": _REPOS | {"repos:get", "code_scanning:get_default_setup", "code_scanning:list_analyses"},
    "GH-07": _REPOS,
}
# The connection test: one read per permission the collectors need.
_PROBES = {"orgs:get", "repos:list", "orgs:list_members", "repos:get_branch_protection", "code_scanning:list_analyses"}


def validate_settings(settings: dict, live: bool) -> None:
    org = settings.get("organization")
    if org is not None and not isinstance(org, str):
        raise ValueError("organization must be text")
    if live and org and not ORG_RE.match(org):
        raise ValueError("organization must be the login of a github.com organisation (letters, digits, dashes)")


def validate_secrets(secrets: dict) -> None:
    token = secrets.get("token")
    if token and token.startswith(("ghp_", "gho_", "ghu_")):
        raise ValueError("token must be a fine-grained token in read-only (github_pat_…), not a classic token")
    if token and not TOKEN_RE.match(token):
        raise ValueError("token must be a fine-grained token (github_pat_…) or a GitHub App token (ghs_…)")


class Denied(Exception):
    """GitHub refused the operation: the token lacks the permission, or the resource."""

    def __init__(self, operation: str, status: int, message: str = ""):
        super().__init__(operation)
        self.operation, self.status, self.message = operation, status, message
        self.permission = PERMISSION.get(operation, operation)


class Unreachable(Exception):
    pass


class Refused(Exception):
    """A failure a person acts on, said in words (bad token, rate limit)."""


class Client:
    """api.github.com, for the operations a reader declares and no other."""

    def __init__(self, conn: Any, secrets: dict, allowed: set[str], http: httpx.Client | None = None):
        token = secrets.get("token") or ""
        settings = dict(conn.settings or {})
        org = settings.get("organization") or ""
        if not token or not org:
            raise ValueError("the connection lacks its organization or its token")
        if not ORG_RE.match(org):
            raise ValueError("organization must be the login of a github.com organisation")
        self.org, self.allowed, self.settings = org, set(allowed), settings
        self.app_token = token.startswith("ghs_")
        self.http = http or httpx.Client(base_url=API, timeout=httpx.Timeout(30, connect=5), follow_redirects=False,
                                         trust_env=True)
        self.http.headers.update({"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
                                  "X-GitHub-Api-Version": "2022-11-28", "User-Agent": USER_AGENT})

    def _send(self, operation: str, url: str, params: dict | None = None) -> httpx.Response:
        if operation not in self.allowed:
            raise PermissionError(f"{operation} is not a read this collector declares")
        target = httpx.URL(url)
        if (target.scheme or target.host) and (target.scheme != "https" or target.host != API_HOST):
            raise PermissionError(f"{url} is not on {API}")
        for attempt in range(ATTEMPTS):
            try:
                r = self.http.get(url, params=params)
            except httpx.TransportError as exc:
                if attempt == ATTEMPTS - 1:
                    raise Unreachable(str(type(exc).__name__)) from None
            else:
                if r.status_code < 500:
                    return self._checked(operation, r)
                if attempt == ATTEMPTS - 1:
                    raise Unreachable(f"GitHub answered {r.status_code}")
            time.sleep(0.5 * 2 ** attempt)
        raise Unreachable("GitHub could not be reached")      # not reached

    @staticmethod
    def _checked(operation: str, r: httpx.Response) -> httpx.Response:
        if r.status_code < 300:
            return r
        message = ""
        try:
            message = str((r.json() or {}).get("message") or "")
        except ValueError:
            pass
        if r.status_code == 401:
            raise Refused("GitHub refused the token: check it, or create a new one (fine-grained, read-only)")
        if r.status_code == 429 or (r.status_code == 403 and r.headers.get("x-ratelimit-remaining") == "0"):
            reset = r.headers.get("x-ratelimit-reset")
            when = (datetime.fromtimestamp(int(reset), timezone.utc).strftime("%H:%M UTC")
                    if reset and reset.isdigit() else "later")
            raise Refused(f"GitHub's rate limit is reached for this token: it resets at {when}")
        if r.status_code == 403 and (r.headers.get("retry-after") or "secondary rate limit" in message.lower()):
            wait = r.headers.get("retry-after") or ""
            raise Refused("GitHub's secondary rate limit is reached for this token: the next collection will retry"
                          + (f" (GitHub asks to wait {wait} s)" if wait.isdigit() else ""))
        raise Denied(operation, r.status_code, message)

    def get(self, operation: str, path: str, **params: Any) -> Any:
        return self._send(operation, path, params or None).json()

    def pages(self, operation: str, path: str, **params: Any) -> list:
        items: list = []
        url, query = path, {"per_page": PAGE_SIZE, **params}
        for _ in range(MAX_PAGES):
            r = self._send(operation, url, query)
            items.extend(r.json())
            url = r.links.get("next", {}).get("url")
            if not url:
                return items
            query = None                        # the next link carries them
        raise Refused(f"more than {PAGE_SIZE * MAX_PAGES} items to read in {path}")


# ── Readers: what each collector's rule reads, in the demonstration's shape ──

def _repo_list(c: Client) -> list[dict]:
    return [r for r in c.pages("repos:list", f"/orgs/{c.org}/repos", type="all") if not r.get("archived")]


def _unreadable(repo: dict, exc: Denied, what: str) -> dict:
    """A 403 is a permission the token lacks; a 404 is a resource GitHub does
    not show (an empty repository has no branch yet)."""
    return {"resource": repo["full_name"],
            "reason": f"{what}: GitHub answered {exc.status}" + (f" ({exc.message})" if exc.message else "")
                      + (f", the token needs {exc.permission} on this repository" if exc.status == 403 else "")}


def _repo_path(repo: dict) -> str:
    owner, _, name = repo["full_name"].partition("/")
    return f"/repos/{quote(owner, safe='')}/{quote(name, safe='')}"


def _branch_path(repo: dict) -> str:
    return quote(repo.get("default_branch") or "main", safe="")


def _classic_rules(protection: dict) -> list[dict]:
    """The classic branch protection, said as the rules of a ruleset."""
    rules = []
    reviews = protection.get("required_pull_request_reviews")
    if reviews is not None:
        rules.append({"type": "pull_request", "parameters": {
            "required_approving_review_count": int(reviews.get("required_approving_review_count") or 0),
            "dismiss_stale_reviews_on_push": bool(reviews.get("dismiss_stale_reviews")),
            "require_last_push_approval": bool(reviews.get("require_last_push_approval"))}})
    if not (protection.get("allow_force_pushes") or {}).get("enabled"):
        rules.append({"type": "non_fast_forward"})
    if not (protection.get("allow_deletions") or {}).get("enabled"):
        rules.append({"type": "deletion"})
    return rules


def _merged_rules(rules: list[dict]) -> list[dict]:
    """Every rule that applies to the branch, the strictest of each kind: GitHub
    enforces them all (rulesets and classic protection together)."""
    kept: dict[str, dict] = {}
    for rule in rules:
        kind = rule.get("type")
        if kind not in ("pull_request", "non_fast_forward", "deletion"):
            continue
        p = rule.get("parameters") or {}
        if kind != "pull_request":
            kept[kind] = {"type": kind}
            continue
        prev = (kept.get(kind) or {}).get("parameters") or {}
        kept[kind] = {"type": kind, "parameters": {
            "required_approving_review_count": max(int(p.get("required_approving_review_count") or 0),
                                                   int(prev.get("required_approving_review_count") or 0)),
            "dismiss_stale_reviews_on_push": bool(p.get("dismiss_stale_reviews_on_push")
                                                  or prev.get("dismiss_stale_reviews_on_push")),
            "require_last_push_approval": bool(p.get("require_last_push_approval")
                                               or prev.get("require_last_push_approval"))}}
    return list(kept.values())


def _branch_rules(c: Client, now: datetime) -> tuple[dict, list]:
    repos, unreadable = [], []
    for repo in _repo_list(c):
        item = {"full_name": repo["full_name"], "visibility": repo.get("visibility"),
                "default_branch": repo.get("default_branch") or "main", "rules_available": True, "rules": []}
        base, branch = _repo_path(repo), _branch_path(repo)
        try:
            protection = c.get("repos:get_branch_protection", f"{base}/branches/{branch}/protection")
            item["rules"] += _classic_rules(protection)
        except Denied as exc:
            if exc.status == 403 and "upgrade" in exc.message.lower():
                item["rules_available"] = False          # a private repository of a free organisation
                repos.append(item)
                continue
            if not (exc.status == 404 and "not protected" in exc.message.lower()):
                unreadable.append(_unreadable(repo, exc, "branch protection"))
                continue
        try:
            item["rules"] += c.pages("repos:get_branch_rules", f"{base}/rules/branches/{branch}")
        except Denied as exc:
            unreadable.append(_unreadable(repo, exc, "branch rules"))
            continue
        item["rules"] = _merged_rules(item["rules"])
        repos.append(item)
    return {"repos": repos}, unreadable


def _organization(c: Client) -> dict:
    org = c.get("orgs:get", f"/orgs/{c.org}")
    if org.get("two_factor_requirement_enabled") is None:
        raise Denied("orgs:get", 403, "the organisation's settings are not visible to this token")
    return {"login": org.get("login") or c.org, "two_factor_requirement_enabled": org["two_factor_requirement_enabled"]}


def _two_factor(c: Client, now: datetime) -> tuple[dict, list]:
    return {"organization": _organization(c)}, []


def _members(c: Client) -> list[dict]:
    return [{"login": m["login"], "role": role}
            for role in ("admin", "member")
            for m in c.pages("orgs:list_members", f"/orgs/{c.org}/members", role=role)]


def _people(c: Client, now: datetime) -> tuple[dict, list]:
    outside = c.pages("orgs:list_outside_collaborators", f"/orgs/{c.org}/outside_collaborators")
    return {"members": _members(c), "outside_collaborators": [{"login": m["login"]} for m in outside]}, []


def _privileges(c: Client, now: datetime) -> tuple[dict, list]:
    grants = None                                   # a personal token cannot list them
    if c.app_token:
        grants = [{"id": g.get("id"), "owner": (g.get("owner") or {}).get("login"), "token_name": g.get("token_name"),
                   "token_expires_at": g.get("token_expires_at"), "access_granted_at": g.get("access_granted_at")}
                  for g in c.pages("orgs:list_pat_grants", f"/orgs/{c.org}/personal-access-tokens")]
    return {"organization": {"login": c.org}, "members": _members(c), "pat_grants": grants}, []


def _scanning(c: Client, now: datetime) -> tuple[dict, list]:
    repos, unreadable = [], []
    for repo in _repo_list(c):
        base = _repo_path(repo)
        try:
            detail = c.get("repos:get", base)
        except Denied as exc:
            unreadable.append(_unreadable(repo, exc, "repository"))
            continue
        sa = detail.get("security_and_analysis")
        public = detail.get("visibility") == "public"
        if sa is None:
            unreadable.append({"resource": repo["full_name"], "reason": "its security settings are not visible to "
                               "this token: it needs administration:read on this repository"})
            continue
        available = public or any((sa.get(k) or {}).get("status") == "enabled"
                                  for k in ("advanced_security", "code_security", "secret_protection"))
        item = {"full_name": repo["full_name"], "visibility": detail.get("visibility"),
                "advanced_security_available": available,
                "security_and_analysis": {k: {"status": (sa.get(k) or {}).get("status") or "disabled"}
                                          for k in ("secret_scanning", "secret_scanning_push_protection")}}
        if available:
            try:
                item["code_scanning_default_setup"] = {"state": _code_scanning_state(c, base)}
            except Denied as exc:
                unreadable.append(_unreadable(repo, exc, "code scanning"))
                continue
        repos.append(item)
    return {"repos": repos}, unreadable


def _code_scanning_state(c: Client, base: str) -> str:
    """"configured" by the default setup, or by a workflow of its own (the
    advanced setup), which the default setup reports as not configured."""
    try:
        if (c.get("code_scanning:get_default_setup", f"{base}/code-scanning/default-setup").get("state")
                == "configured"):
            return "configured"
        analyses = c.get("code_scanning:list_analyses", f"{base}/code-scanning/analyses", per_page=1)
    except Denied as exc:
        if _no_code_scanning(exc):          # e.g. Secret Protection alone: no code scanning on it
            return "not-configured"
        raise
    return "configured" if analyses else "not-configured"


def _no_code_scanning(exc: Denied) -> bool:
    """GitHub's answer for a repository without code scanning: no analysis
    yet (404), or the feature not enabled (403 saying so), not a refusal."""
    text = exc.message.lower()
    return exc.status == 404 or (exc.status == 403 and any(
        word in text for word in ("not enabled", "must be enabled", "advanced security", "code security")))


def _visibility(c: Client, now: datetime) -> tuple[dict, list]:
    return {"repos": [{"full_name": r["full_name"], "visibility": r.get("visibility")} for r in _repo_list(c)]}, []


READERS: dict[str, Callable[[Client, datetime], tuple[dict, list]]] = {
    "GH-01": _branch_rules, "GH-02": _branch_rules, "GH-03": _two_factor, "GH-04": _people,
    "GH-05": _privileges, "GH-06": _scanning, "GH-07": _visibility,
}


def _error(reason: str, missing: str | None = None) -> dict:
    return {"raw": None, "data_as_of": None, "unreadable": [],
            "error": {"reason": reason, "missing_permission": missing}}


def _failure(exc: Exception) -> dict:
    if isinstance(exc, Denied):
        if exc.operation == "orgs:get" and exc.status == 404:
            return _error("GitHub does not show this organisation to the token: check its name, and that the "
                          "token's resource owner is the organisation")
        if exc.status < 400:
            return _error(f"GitHub answered {exc.status}: the resource has moved (renamed or transferred)")
        return _error("GitHub refused the read" + (f" ({exc.message})" if exc.message else ""), exc.permission)
    if isinstance(exc, Refused):
        return _error(str(exc))
    if isinstance(exc, Unreachable):
        return _error("GitHub could not be reached")
    raise exc


class GithubProvider:
    def __init__(self, client_factory: Callable[..., Client] = Client):
        self.client_factory = client_factory

    async def fetch(self, conn: Any, secrets: dict, collector: dict, params: dict, now: datetime) -> dict:
        return await asyncio.to_thread(self.fetch_sync, conn, secrets, collector, now)

    def fetch_sync(self, conn: Any, secrets: dict, collector: dict, now: datetime) -> dict:
        code = collector["code"]
        try:
            c = self.client_factory(conn, secrets, READS[code])
        except ValueError as exc:
            return _error(str(exc))
        try:
            raw, unreadable = READERS[code](c, now)
        except PermissionError:                 # the guard: a reader bug, never a GitHub answer
            raise
        except (Denied, Refused, Unreachable) as exc:
            return _failure(exc)
        return {"raw": raw, "data_as_of": now.astimezone(timezone.utc), "unreadable": unreadable, "error": None}

    async def test(self, conn: Any, secrets: dict) -> dict:
        return await asyncio.to_thread(self.test_sync, conn, secrets)

    def test_sync(self, conn: Any, secrets: dict) -> dict:
        def refused(message: str, missing: list[str]) -> dict:
            return {"ok": False, "partial": False, "missing_permissions": missing, "message": message}
        try:
            c = self.client_factory(conn, secrets, _PROBES)
        except ValueError as exc:
            return refused(str(exc)[0].upper() + str(exc)[1:] + ".", [])
        missing: list[str] = []
        org: dict = {}
        try:
            org = c.get("orgs:get", f"/orgs/{c.org}")
            if org.get("two_factor_requirement_enabled") is None:      # its settings hidden from the token
                missing.append(PERMISSION["orgs:get"])
        except Denied as exc:
            if exc.status == 404:
                reason = _failure(exc)["error"]["reason"]
                return refused(reason[0].upper() + reason[1:] + ".", [])
            missing.append(exc.permission)
        except (Refused, Unreachable) as exc:
            reason = _failure(exc)["error"]["reason"]
            return refused(reason[0].upper() + reason[1:] + ".", [])
        repos: list[dict] = []
        try:
            for operation, probe in _probes(c, repos):
                try:
                    probe()
                except Denied as exc:
                    if exc.status == 403:
                        missing.append(exc.permission)
        except (Refused, Unreachable) as exc:
            return refused(str(exc)[0].upper() + str(exc)[1:] + ".", [])
        missing = sorted(set(missing))
        message = f"Connected to {c.org}: {len(repos)} repositor{'y' if len(repos) == 1 else 'ies'} read"
        # A token given selected repositories sees the others as if they did not exist.
        private, total = sum(1 for r in repos if r.get("visibility") != "public"), org.get("total_private_repos")
        unseen = isinstance(total, int) and private < total
        if unseen:
            message += (f"; the token sees {private} of the {total} private repositories: give it access to all "
                        "the organisation's repositories")
        if missing:
            message += "; some collectors will fail until the token has these permissions: " + ", ".join(missing)
        return {"ok": True, "partial": bool(missing) or unseen, "missing_permissions": missing,
                "message": message + "."}


def _probes(c: Client, repos: list[dict]) -> Iterator[tuple[str, Callable[[], Any]]]:
    """One read per permission; the repository reads go to a public
    repository when there is one, where the plan restricts nothing."""
    def repo_list():
        repos.extend(c.pages("repos:list", f"/orgs/{c.org}/repos", type="all"))
    yield "repos:list", repo_list
    yield "orgs:list_members", lambda: c._send("orgs:list_members", f"/orgs/{c.org}/members", {"per_page": 1})
    live = [r for r in repos if not r.get("archived")]
    repo = next((r for r in live if r.get("visibility") == "public"), live[0] if live else None)
    if repo is None:
        return
    base, branch = _repo_path(repo), _branch_path(repo)

    def protection():
        try:
            c.get("repos:get_branch_protection", f"{base}/branches/{branch}/protection")
        except Denied as exc:
            # Not protected (404), or a private repository of a free organisation: the right is there.
            if not (exc.status == 404 or "upgrade" in exc.message.lower()):
                raise
    yield "repos:get_branch_protection", protection

    def analyses():
        try:
            c.get("code_scanning:list_analyses", f"{base}/code-scanning/analyses", per_page=1)
        except Denied as exc:
            if not _no_code_scanning(exc):
                raise
    yield "code_scanning:list_analyses", analyses
