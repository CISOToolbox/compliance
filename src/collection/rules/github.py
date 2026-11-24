"""FEAT-73 — the rules of the GitHub collectors, over the APIs' own answers.

Same contract as the AWS rules. A repository on which the plan does not
offer the check (branch rules on a private repository without Team, code
scanning without Advanced Security) is not protected: it is a finding that
says why, never left out of the count.
GH-04 needs the users of the project, through their accounts on the perimeter
its connection names: without users, "sans objet".
"""
from __future__ import annotations

from datetime import timedelta
from typing import Callable

from src.collection.rules.common import evaluation, finding, parse_date


def _repos(raw: dict) -> list[dict]:
    return [r for r in raw.get("repos") or [] if not r.get("archived")]


def _branch_rules(repo: dict) -> dict[str, dict]:
    return {r.get("type"): (r.get("parameters") or {}) for r in repo.get("rules") or []}


def _per_repo(raw: dict, check: Callable[[dict], str | None], available_key: str, absent: str) -> dict:
    """Evaluate every repository; one on which the plan does not offer the
    check cannot be protected, and is a finding saying so."""
    resources, findings = [], []
    for repo in _repos(raw):
        resources.append(repo["full_name"])
        issue = check(repo) if repo.get(available_key, True) else absent
        if issue:
            findings.append(finding(repo["full_name"], issue))
    return evaluation(resources, findings)


def gh_01(raw: dict, params: dict, ctx: dict) -> dict:
    def check(repo):
        pr = _branch_rules(repo).get("pull_request")
        if pr is None:
            return f"{repo.get('default_branch', 'default branch')}: no pull request rule"
        issues = []
        if int(pr.get("required_approving_review_count") or 0) < 1:
            issues.append(f"required_approving_review_count={pr.get('required_approving_review_count', 0)}")
        if not pr.get("dismiss_stale_reviews_on_push"):
            issues.append("dismiss_stale_reviews_on_push=false")
        if not pr.get("require_last_push_approval"):
            issues.append("require_last_push_approval=false")
        return ", ".join(issues) or None
    return _per_repo(raw, check, "rules_available",
                     "not available: branch rules on a private repository need the Team or Enterprise plan")


def gh_02(raw: dict, params: dict, ctx: dict) -> dict:
    def check(repo):
        rules = _branch_rules(repo)
        missing = [name for name, rule in (("pull requests only", "pull_request"),
                                           ("force push forbidden", "non_fast_forward"),
                                           ("deletion forbidden", "deletion")) if rule not in rules]
        return ("missing: " + ", ".join(missing)) if missing else None
    return _per_repo(raw, check, "rules_available",
                     "not available: branch rules on a private repository need the Team or Enterprise plan")


def gh_03(raw: dict, params: dict, ctx: dict) -> dict:
    """The organisation's requirement, then every member and outside
    collaborator; without the people's own state, the organisation alone."""
    org = raw.get("organization") or {}
    login = org.get("login") or "organization"
    resources = [login]
    findings = [] if org.get("two_factor_requirement_enabled") is True else \
        [finding(login, "two_factor_requirement_enabled=false")]
    for key, label in (("members", "{}"), ("outside_collaborators", "{} (outside collaborator)")):
        disabled = set(raw.get(f"{key}_2fa_disabled") or [])
        for person in raw.get(key) or []:
            resources.append(label.format(person))
            if person in disabled:
                findings.append(finding(label.format(person), "two-factor authentication disabled"))
    return evaluation(resources, findings)


def _members(raw: dict) -> list[dict]:
    return [dict(m, kind="member") for m in raw.get("members") or []] + \
           [dict(m, kind="outside collaborator") for m in raw.get("outside_collaborators") or []]


def gh_04(raw: dict, params: dict, ctx: dict) -> dict:
    accounts = ctx.get("users")
    if accounts is None:
        return evaluation([], [], outcome="feature_absent", reason="the project lists no users")
    by_login = {str(a.get("login") or "").lower(): a for a in accounts if a.get("login")}
    members = _members(raw)
    findings = []
    for m in members:
        account = by_login.get(m["login"].lower())
        if account is None:
            findings.append(finding(m["login"], f"{m['kind']} linked to no user"))
        elif not account.get("active"):
            findings.append(finding(m["login"], f"{m['kind']} of a user who left ({account.get('name', '')})"))
    return evaluation([m["login"] for m in members], findings)


def gh_05(raw: dict, params: dict, ctx: dict) -> dict:
    org = (raw.get("organization") or {}).get("login") or "organization"
    owners = [m for m in raw.get("members") or [] if m.get("role") == "admin"]
    resources, findings = [f"{org}:owners"], []
    limit = int(params.get("max_owners", 3))
    if len(owners) > limit:
        findings.append(finding(f"{org}:owners", f"{len(owners)} owners for at most {limit}"))
    grants = raw.get("pat_grants")
    scope_note = None
    if grants is None:
        scope_note = "approved tokens are readable by a GitHub App only"
    else:
        for g in grants:
            rid = f"token:{g.get('owner', '?')}:{g.get('token_name') or g.get('id')}"
            resources.append(rid)
            expires = parse_date(g.get("token_expires_at"))
            if expires is None:
                findings.append(finding(rid, "no expiry date"))
            elif expires - (parse_date(g.get("access_granted_at")) or ctx["now"]) > timedelta(days=366):
                findings.append(finding(rid, "valid for more than a year"))
    ev = evaluation(resources, findings)
    if scope_note:
        ev["scope"]["not_available"] = [scope_note]
    return ev


def gh_06(raw: dict, params: dict, ctx: dict) -> dict:
    def check(repo):
        sa = repo.get("security_and_analysis") or {}
        off = [label for label, key in (("secret scanning", "secret_scanning"),
                                        ("push protection", "secret_scanning_push_protection"))
               if (sa.get(key) or {}).get("status") != "enabled"]
        if (repo.get("code_scanning_default_setup") or {}).get("state") != "configured":
            off.append("code scanning")
        return ("off: " + ", ".join(off)) if off else None
    return _per_repo(raw, check, "advanced_security_available",
                     "not available: secret and code scanning on a private repository need GitHub Advanced Security")


def gh_07(raw: dict, params: dict, ctx: dict) -> dict:
    repos = _repos(raw)
    return evaluation([r["full_name"] for r in repos],
                       [finding(r["full_name"], "public repository") for r in repos
                        if r.get("visibility") == "public"])


EVALUATORS: dict[str, Callable[[dict, dict, dict], dict]] = {
    "GH-01": gh_01, "GH-02": gh_02, "GH-03": gh_03, "GH-04": gh_04, "GH-05": gh_05, "GH-06": gh_06, "GH-07": gh_07,
}
