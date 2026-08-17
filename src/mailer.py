"""SMTP sender for Compliance proof-expiry alerts.

Thin wrapper over the shared transport (``src.mailer_common``): config is
resolved from the Pilot in-memory push (``src.routes.internal._smtp_config``)
first, then environment variables (standalone mode) — identical to Asset/Watch.
"""
from __future__ import annotations

from src.mailer_common import resolve_pushed_config, send_html_email

_DEFAULT_FROM = "compliance@cisotoolbox.local"


def smtp_settings() -> dict:
    """Resolve SMTP config. Empty host means "not configured"."""
    try:
        from src.routes.internal import _smtp_config as pushed
    except Exception:
        pushed = {}
    return resolve_pushed_config(pushed, _DEFAULT_FROM)


def send_smtp(to: str, subject: str, html: str) -> tuple[bool, str]:
    """Return (ok, error_message). (False, "smtp_not_configured") when no host."""
    return send_html_email(smtp_settings(), to, subject, html)
