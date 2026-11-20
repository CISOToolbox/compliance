"""FEAT-73 — a connection's settings and secrets, read and written.

The fields come from the provider's catalog entry. A secret is stored
encrypted (settings_crypto: refused without ENCRYPTION_KEY) and never served:
the view says whether each secret is set, nothing more. On an update, a
secret left empty keeps its value and an explicit null clears it. Unknown
fields are refused, and so is a generated one (the AWS External ID, written
by the suite at creation). The required fields are required of a live
connection; a demonstration one reads nothing. Live AWS connections arrive
with lot 1c, live GitHub ones with lot 1d.
"""
from __future__ import annotations

import json
from typing import Any

from src.collection.catalog import load_catalog
from src.settings_crypto import decrypt_setting, encrypt_setting

MODES = ("demo", "live")
# Settings a demonstration connection may carry besides the catalog's fields:
# the scenario the simulated provider plays (tests, demo data).
DEMO_SETTINGS = ("scenario",)
LIVE_PROVIDERS = ("aws",)


class ConnectionInputError(ValueError):
    pass


def _fields(provider: str) -> list[dict]:
    try:
        return load_catalog().providers[provider]["connection"]["fields"]
    except KeyError:
        raise ConnectionInputError(f"unknown provider {provider}") from None


def _single_line(value: Any, name: str, limit: int = 500) -> str:
    if not isinstance(value, str):
        raise ConnectionInputError(f"{name} must be text")
    value = value.replace("\r", " ").replace("\n", " ").strip()
    if len(value) > limit:
        raise ConnectionInputError(f"{name} is too long")
    return value


def _setting(value: Any, name: str) -> Any:
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        return [_single_line(v, name, 200) for v in value][:100]
    return _single_line(value, name)


def connection_secrets(conn: Any) -> dict:
    return json.loads(decrypt_setting(conn.secrets_enc)) if conn.secrets_enc else {}


def apply_connection_input(conn: Any, payload: dict, creating: bool) -> None:
    """Validate ``payload`` (label, mode, settings, secrets) against the
    provider's fields and write it on ``conn``. Raises ConnectionInputError."""
    fields = {f["id"]: f for f in _fields(conn.provider)}
    if "label" in payload or creating:
        label = _single_line(payload.get("label") or "", "label", 255)
        if not label:
            raise ConnectionInputError("label is required")
        conn.label = label
    mode = payload.get("mode", conn.mode if not creating else "demo") or "demo"
    if mode not in MODES:
        raise ConnectionInputError(f"unknown mode {mode}")
    if mode == "live" and conn.provider not in LIVE_PROVIDERS:
        raise ConnectionInputError(f"live {conn.provider} connections are not available yet: use the demonstration mode")
    conn.mode = mode

    settings = dict(conn.settings or {}) if not creating else {}
    for key, value in (payload.get("settings") or {}).items():
        allowed = ((key in fields and not fields[key]["secret"] and not fields[key].get("generated"))
                   or (mode == "demo" and key in DEMO_SETTINGS))
        if not allowed:
            raise ConnectionInputError(f"unknown setting {key}")
        if value is None:
            settings.pop(key, None)
        else:
            settings[key] = _setting(value, key)
    # A secret the provider no longer declares is dropped, not kept encrypted.
    secrets = {k: v for k, v in (connection_secrets(conn) if not creating else {}).items()
               if k in fields and fields[k]["secret"]}
    for key, value in (payload.get("secrets") or {}).items():
        if key not in fields or not fields[key]["secret"]:
            raise ConnectionInputError(f"unknown secret {key}")
        if value is None:
            secrets.pop(key, None)
        elif value != "":                      # empty: keep what is stored
            secrets[key] = _single_line(value, key, 4000)
    if conn.provider == "aws":
        from src.collection.providers import aws
        settings.setdefault("external_id", aws.new_external_id())
        try:
            aws.validate_settings(settings, live=mode == "live")
            aws.validate_secrets(secrets)
        except ValueError as exc:
            raise ConnectionInputError(str(exc)) from None
    for key, f in fields.items():
        present = secrets.get(key) if f["secret"] else settings.get(key)
        if mode == "live" and f.get("required") and present in (None, "", []):
            raise ConnectionInputError(f"{key} is required")
    conn.settings = settings
    conn.secrets_enc = encrypt_setting(json.dumps(secrets)) if secrets else ""


def connection_view(conn: Any) -> dict:
    """What the API serves: never a secret value, only whether it is set."""
    secrets = connection_secrets(conn)
    return {
        "id": str(conn.id), "provider": conn.provider, "label": conn.label, "mode": conn.mode,
        "settings": dict(conn.settings or {}),
        "secrets": {f["id"]: {"set": bool(secrets.get(f["id"]))} for f in _fields(conn.provider) if f["secret"]},
        "last_test": {"at": conn.last_test_at.isoformat() if conn.last_test_at else None,
                      "ok": conn.last_test_ok, "message": conn.last_test_message or "",
                      "missing_permissions": list(conn.missing_permissions or [])},
        "created_by": conn.created_by or "",
    }
