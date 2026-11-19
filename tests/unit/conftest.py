"""Shared fixtures of the unit tests."""
import os
import sys

import pytest_asyncio

sys.path.insert(0, os.path.dirname(__file__))


@pytest_asyncio.fixture
async def monitored_db():
    """MedSecure with requirements, measures and a proof (FEAT-73 lot 1a)."""
    from monitoring_helpers import monitored_session
    async for session in monitored_session():
        yield session
