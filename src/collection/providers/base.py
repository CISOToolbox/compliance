"""FEAT-73 — what a source provider does for the collection.

`test` checks a connection and names what it lacks; `fetch` reads the data
one collector evaluates. A provider only reads: every operation it performs
is one the catalog declares for the collector (`reads`).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol


class SourceProvider(Protocol):
    async def test(self, conn: Any, secrets: dict) -> dict:
        """{ok, partial, message, missing_permissions[]}"""

    async def fetch(self, conn: Any, secrets: dict, collector: dict, params: dict, now: datetime) -> dict:
        """{raw, data_as_of, unreadable[], error: None | {reason, missing_permission}};
        ``now`` is the time of the collection."""


def provider_for(conn: Any) -> SourceProvider:
    """The provider behind a connection. A live connection is read live or
    not at all: a failure is never answered with demonstration data."""
    if conn.mode == "demo":
        from src.collection.providers.simulated import SimulatedProvider
        return SimulatedProvider()
    if conn.mode == "live" and conn.provider == "aws":
        from src.collection.providers.aws import AwsProvider
        return AwsProvider()
    if conn.mode == "live" and conn.provider == "github":
        from src.collection.providers.github import GithubProvider
        return GithubProvider()
    raise RuntimeError(f"no {conn.mode} provider for {conn.provider}")
