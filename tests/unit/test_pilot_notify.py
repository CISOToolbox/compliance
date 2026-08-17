import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))


class TestPilotNotifyExists:
    def test_module_importable(self):
        from pilot_notify import notify_pilot_measure
        assert callable(notify_pilot_measure)

    def test_module_name_default(self):
        from pilot_notify import MODULE_NAME
        assert MODULE_NAME == "compliance"


@pytest.mark.asyncio
class TestPilotNotifyNoop:
    async def test_noop_when_pilot_url_empty(self, monkeypatch):
        monkeypatch.setenv("PILOT_URL", "")
        monkeypatch.setenv("SERVICE_TOKEN", "test-token")
        # Re-import to pick up env changes
        import importlib
        import pilot_notify
        importlib.reload(pilot_notify)
        # Should return immediately without error
        result = await pilot_notify.notify_pilot_measure({"source_id": "1", "title": "test"})
        assert result is None

    async def test_noop_when_service_token_empty(self, monkeypatch):
        monkeypatch.setenv("PILOT_URL", "http://pilot:8000")
        monkeypatch.setenv("SERVICE_TOKEN", "")
        import importlib
        import pilot_notify
        importlib.reload(pilot_notify)
        result = await pilot_notify.notify_pilot_measure({"source_id": "1", "title": "test"})
        assert result is None

    async def test_noop_when_both_empty(self, monkeypatch):
        monkeypatch.setenv("PILOT_URL", "")
        monkeypatch.setenv("SERVICE_TOKEN", "")
        import importlib
        import pilot_notify
        importlib.reload(pilot_notify)
        result = await pilot_notify.notify_pilot_measure({"source_id": "1", "title": "test"})
        assert result is None
