"""FEAT-73 — the rules of the GitHub collectors, over the APIs' own answers.

Same contract as the AWS rules. A check the plan does not offer (branch
rules on private repositories without Team, code scanning without Advanced
Security) leaves the repository out of scope with the reason; when no
repository is left, the result is "sans objet", never a silent success.
GH-04 needs the people of Access: without them (standalone), "sans objet".
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
    """Evaluate the repositories on which the plan offers the check; the
    others are listed in the scope, not counted as compliant."""
    resources, findings, skipped = [], [], []
    for repo in _repos(raw):
        if not repo.get(available_key, True):
            skipped.append(repo["full_name"])
            continue
        resources.append(repo["full_name"])
        issue = check(repo)
        if issue:
            findings.append(finding(repo["full_name"], issue))
    if not resources and skipped:
        return evaluation([], [], outcome="feature_absent", reason=absent)
    ev = evaluation(resources, findings)
    ev["scope"]["not_available"] = skipped
    return ev


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
                     "branch rules on private repositories need the Team or Enterprise plan")


def gh_02(raw: dict, params: dict, ctx: dict) -> dict:
    def check(repo):
        rules = _branch_rules(repo)
        missing = [name for name, rule in (("pull requests only", "pull_request"),
                                           ("force push forbidden", "non_fast_forward"),
                                           ("deletion forbidden", "deletion")) if rule not in rules]
        return ("missing: " + ", ".join(missing)) if missing else None
    return _per_repo(raw, check, "rules_available",
                     "branch rules on private repositories need the Team or Enterprise plan")


def gh_03(raw: dict, params: dict, ctx: dict) -> dict:
    org = raw.get("organization") or {}
    login = org.get("login") or "organization"
    ok = org.get("two_factor_requirement_enabled") is True
    return evaluation([login], [] if ok else [finding(login, "two_factor_requirement_enabled=false")])


def _members(raw: dict) -> list[dict]:
    return [dict(m, kind="member") for m in raw.get("members") or []] + \
           [dict(m, kind="outside collaborator") for m in raw.get("outside_collaborators") or []]


def gh_04(raw: dict, params: dict, ctx: dict) -> dict:
    people = ctx.get("people")
    if people is None:
        return evaluation([], [], outcome="feature_absent",
                           reason="the people of Access are not available (standalone module)")
    by_login = {str(p.get("github") or "").lower(): p for p in people if p.get("github")}
    members = _members(raw)
    findings = []
    for m in members:
        person = by_login.get(m["login"].lower())
        if person is None:
            findings.append(finding(m["login"], f"{m['kind']} linked to no person"))
        elif not person.get("active"):
            findings.append(finding(m["login"], f"{m['kind']} of a person who left ({person.get('name', '')})"))
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
                     "secret and code scanning on private repositories need GitHub Advanced Security")


def gh_07(raw: dict, params: dict, ctx: dict) -> dict:
    repos = _repos(raw)
    return evaluation([r["full_name"] for r in repos],
                       [finding(r["full_name"], "public repository") for r in repos
                        if r.get("visibility") == "public"])


EVALUATORS: dict[str, Callable[[dict, dict, dict], dict]] = {
    "GH-01": gh_01, "GH-02": gh_02, "GH-03": gh_03, "GH-04": gh_04, "GH-05": gh_05, "GH-06": gh_06, "GH-07": gh_07,
}
