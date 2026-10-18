// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — SMTP section of the settings drawer (FEAT-58).
 *
 * For the backend modules that send mail. In standalone the module sets its
 * own SMTP server through /api/smtp/config; in the suite the server config
 * is Pilot's and the section shows it read-only.
 *
 * Load after ct_settings.js:
 *   <script src="js/ct_settings.js"></script>
 *   <script src="js/ai_backend.js"></script>
 *   <script src="js/ct_smtp_settings.js"></script>
 *
 * A module opts in from its AI_APP_CONFIG:
 *   settingsExtraHTML:  … + _ctSmtpSettingsHTML()
 *   onSettingsRendered: … _ctSmtpSettingsLoad()
 */
interface CtSmtpConfig {
    host: string;
    port: number;
    user: string;
    from_addr: string;
    tls: boolean;
    password_set: boolean;
    managed: boolean;
}
interface Window {
    _ctSmtpSettingsHTML?: () => string;
    _ctSmtpSettingsLoad?: () => void;
    _ctSmtpTest?: () => void;
}
