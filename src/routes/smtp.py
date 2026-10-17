"""SMTP settings: the module's own config in standalone, Pilot's in the suite (FEAT-58)."""
from src.mailer import _DEFAULT_FROM
from src.routes.internal import _smtp_config
from src.smtp_settings_common import make_smtp_router

router = make_smtp_router(state=_smtp_config, default_from=_DEFAULT_FROM)
