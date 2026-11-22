"""FEAT-73 — the collector catalog: what each collector checks and proves.

One file per provider in `catalog_files/`, versioned and shipped with the module
like the frameworks. Read-only: loaded once, validated, never stored in the
database. A collector names the requirements it brings evidence to, framework
by framework; a SOC 2 criterion (`CC6.1`) stands for its points of focus
(`CC6.1.1`…), the only SOC 2 requirements the shipped framework holds.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

CATALOG_DIR = Path(__file__).resolve().parent / "catalog_files"
FRAMEWORKS = ("iso", "anssi", "nis2", "soc2")
# What a collector may need besides its connection, and why it cannot run
# without it. The module holds no people directory: a collector that needs
# one is neither proposed nor activated.
NEEDS = {"people": "it needs a directory of the people, which this module does not hold"}
PROVIDED: frozenset[str] = frozenset()


class CatalogError(ValueError):
    pass


class Catalog:
    def __init__(self, providers: dict[str, dict], collectors: dict[str, dict]):
        self.providers = providers
        self._collectors = collectors

    def collectors(self, provider: str | None = None) -> list[dict]:
        return [c for c in self._collectors.values() if provider is None or c["provider"] == provider]

    def available(self) -> list[dict]:
        """The collectors whose needs the module meets: the ones it proposes."""
        return [c for c in self._collectors.values() if unavailable(c) is None]

    def collector(self, code: str) -> dict:
        try:
            return self._collectors[code]
        except KeyError:
            raise CatalogError(f"unknown collector {code}") from None

    def describe(self, code: str) -> dict:
        """A collector, or — for a code a later catalog retired, still named by
        a monitoring and its history — a stand-in that keeps every version
        (longest retention) and collects nothing."""
        if code in self._collectors:
            return self._collectors[code]
        return {"code": code, "provider": "", "version": 0, "retired": True, "reads": [], "permissions": [],
                "title": {"en": code, "fr": code}, "rule": {"en": "", "fr": ""}, "params": [],
                "retention": {"daily_days": 3650, "weekly_days": 3650, "monthly_days": 3650}, "requirement_keys": []}


def unavailable(collector: dict) -> str | None:
    """Why the module cannot run the collector, or None."""
    missing = [n for n in collector.get("needs", []) if n not in PROVIDED]
    return NEEDS[missing[0]] if missing else None


def _requirement_keys(code: str, requirements: dict, refs: dict[str, set[str]]) -> list[str]:
    keys: list[str] = []
    for fw in FRAMEWORKS:
        known = refs.get(fw, set())
        for ref in requirements.get(fw) or []:
            if fw == "soc2":
                focus = sorted((r for r in known if r.startswith(ref + ".")), key=_natural)
                if not focus:
                    raise CatalogError(f"{code}: soc2 criterion {ref} has no point of focus")
                keys += [f"soc2:{r}" for r in focus]
            elif ref in known:
                keys.append(f"{fw}:{ref}")
            else:
                raise CatalogError(f"{code}: {fw} requirement {ref} does not exist")
    return keys


def _natural(ref: str) -> list:
    return [int(p) if p.isdigit() else p for p in ref.replace(".", " ").split()]


def parse_catalog(files: list[dict], refs: dict[str, set[str]]) -> Catalog:
    providers: dict[str, dict] = {}
    collectors: dict[str, dict] = {}
    for data in files:
        name = data["provider"]
        fields = data["connection"]["fields"]
        if not any(f.get("secret") for f in fields):
            raise CatalogError(f"{name}: a connection needs a secret field")
        profiles = data["profiles"]
        providers[name] = {k: data[k] for k in ("provider", "version", "label", "connection", "profiles")}
        for c in data["collectors"]:
            code = c["code"]
            if code in collectors:
                raise CatalogError(f"duplicate collector {code}")
            needs = c.get("needs", [])
            if not isinstance(needs, list) or set(needs) - NEEDS.keys():
                raise CatalogError(f"{code}: unknown needs {needs}")
            if c["retention_profile"] not in profiles:
                raise CatalogError(f"{code}: unknown retention profile {c['retention_profile']}")
            collectors[code] = dict(c, provider=name, retention=dict(profiles[c["retention_profile"]]),
                                    requirement_keys=_requirement_keys(code, c["requirements"], refs))
    return Catalog(providers, collectors)


def _framework_refs(referentiels: Path) -> dict[str, set[str]]:
    refs: dict[str, set[str]] = {}
    for fw in FRAMEWORKS:
        path = referentiels / f"{fw}.json"
        if path.is_file():
            refs[fw] = {str(m.get("ref", "")) for m in json.loads(path.read_text(encoding="utf-8")).get("measures", [])}
    return refs


@lru_cache(maxsize=1)
def load_catalog() -> Catalog:
    from src.seed_frameworks import REFERENTIELS_DIR
    files: list[Any] = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(CATALOG_DIR.glob("*.json"))]
    return parse_catalog(files, _framework_refs(REFERENTIELS_DIR))
