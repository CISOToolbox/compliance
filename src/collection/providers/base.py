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
    """The provider behind a connection. Only the demonstration mode exists
    until the real collectors: a live connection is refused at creation, and
    a failure is never answered with demonstration data."""
    if conn.mode == "demo":
        from src.collection.providers.simulated import SimulatedProvider
        return SimulatedProvider()
    raise RuntimeError(f"no {conn.mode} provider for {conn.provider}")
