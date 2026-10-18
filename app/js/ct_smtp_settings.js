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
(function () {
    "use strict";
    var HOLDER = "ct-smtp-settings";
    function _val(id) {
        var el = document.getElementById(id);
        return el ? el.value : "";
    }
    async function _detail(r, fallbackKey) {
        try {
            var body = await r.json();
            if (body && typeof body.detail === "string")
                return body.detail;
        }
        catch (e) { /* not a JSON error body */ }
        return t(fallbackKey);
    }
    function _field(id, labelKey, input, wide) {
        return '<div class="ct-field' + (wide ? ' ct-col-span-2' : '') + '">' +
            '<label class="ct-label" for="' + id + '">' + esc(t(labelKey)) + '</label>' + input + '</div>';
    }
    function _render(cfg) {
        if (cfg.managed) {
            return '<p class="ct-muted fs-sm">' + esc(t("settings.smtp.managed")) + '</p>' +
                '<p class="fs-sm">' + (cfg.host
                ? esc(cfg.host) + ':' + esc(String(cfg.port))
                : esc(t("settings.smtp.not_configured"))) + '</p>';
        }
        var pwPlaceholder = cfg.password_set ? t("settings.smtp.password_set") : "";
        return '<p class="ct-muted fs-xs">' + esc(t("settings.smtp.help")) + '</p>' +
            '<div class="ct-form-grid">' +
            _field("ct-smtp-host", "settings.smtp.host", '<input type="text" class="ct-input" id="ct-smtp-host" placeholder="smtp.example.com" value="' + esc(cfg.host) + '">', true) +
            _field("ct-smtp-port", "settings.smtp.port", '<input type="number" class="ct-input" id="ct-smtp-port" min="1" max="65535" value="' + esc(String(cfg.port || 587)) + '">') +
            _field("ct-smtp-from", "settings.smtp.from", '<input type="email" class="ct-input" id="ct-smtp-from" placeholder="noreply@example.com" value="' + esc(cfg.from_addr) + '">') +
            _field("ct-smtp-user", "settings.smtp.user", '<input type="text" class="ct-input" id="ct-smtp-user" autocomplete="off" value="' + esc(cfg.user) + '">') +
            _field("ct-smtp-pass", "settings.smtp.password", '<input type="password" class="ct-input" id="ct-smtp-pass" autocomplete="new-password" placeholder="' + esc(pwPlaceholder) + '">') +
            '<label class="ct-check ct-col-span-2"><input type="checkbox" id="ct-smtp-tls"' + (cfg.tls ? ' checked' : '') + '>' +
            '<span class="ct-check-box">' + _icon("check", 12) + '</span>' + esc(t("settings.smtp.tls")) + '</label>' +
            // The test recipient is not a setting: typing it saves nothing.
            '<div data-settings-immediate class="ct-col-span-2">' +
            _field("ct-smtp-test-to", "settings.smtp.test_to", '<input type="email" class="ct-input" id="ct-smtp-test-to" placeholder="ciso@example.com">', true) +
            '</div>' +
            '</div>' +
            '<div class="ct-actions mt-8">' +
            '<button class="ct-btn" data-write data-click="_ctSmtpTest">' + esc(t("settings.smtp.test")) + '</button>' +
            '</div>';
    }
    window._ctSmtpSettingsHTML = function () {
        // Saved by the panel's single Save button.
        if (window._ctSettingsRegister)
            window._ctSettingsRegister({ id: "smtp", holder: HOLDER, save: _smtpSave });
        return '<div class="settings-section">' +
            '<div class="settings-label">' + esc(t("settings.smtp.title")) + '</div>' +
            '<div id="' + HOLDER + '"><p class="ct-muted fs-sm">' + esc(t("settings.smtp.loading")) + '</p></div>' +
            '</div>';
    };
    window._ctSmtpSettingsLoad = async function () {
        var holder = document.getElementById(HOLDER);
        if (!holder)
            return;
        try {
            var r = await fetch("api/smtp/config", { credentials: "same-origin" });
            if (!r.ok)
                throw new Error(String(r.status));
            holder.innerHTML = _render(await r.json());
        }
        catch (e) {
            holder.innerHTML = '<p class="ct-muted fs-sm">' + esc(t("settings.smtp.load_error")) + '</p>';
        }
    };
    async function _smtpSave() {
        var tls = document.getElementById("ct-smtp-tls");
        var body = {
            host: _val("ct-smtp-host").trim(),
            port: parseInt(_val("ct-smtp-port"), 10) || 587,
            user: _val("ct-smtp-user").trim(),
            password: _val("ct-smtp-pass"),
            from_addr: _val("ct-smtp-from").trim(),
            tls: tls ? tls.checked : true
        };
        try {
            var r = await fetch("api/smtp/config", {
                method: "PUT", credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (r.ok) {
                window._ctSmtpSettingsLoad();
                return null;
            }
            if (r.status === 403)
                return t("settings.smtp.admin_only");
            return await _detail(r, "settings.smtp.save_error");
        }
        catch (e) {
            return t("settings.smtp.save_error");
        }
    }
    window._ctSmtpTest = async function () {
        var to = _val("ct-smtp-test-to").trim() || _val("ct-smtp-from").trim();
        if (!to) {
            showStatus(t("settings.smtp.test_to_missing"), true);
            return;
        }
        try {
            var r = await fetch("api/smtp/test", {
                method: "POST", credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to: to })
            });
            if (r.ok)
                showStatus(t("settings.smtp.test_sent", { to: to }));
            else if (r.status === 409)
                showStatus(t("settings.smtp.not_configured"), true);
            else if (r.status === 403)
                showStatus(t("settings.smtp.admin_only"), true);
            else
                showStatus(await _detail(r, "settings.smtp.test_error"), true);
        }
        catch (e) {
            showStatus(t("settings.smtp.test_error"), true);
        }
    };
    _registerTranslations("fr", {
        "settings.smtp.title": "Envoi d'e-mails (SMTP)",
        "settings.smtp.loading": "Chargement…",
        "settings.smtp.load_error": "Impossible de charger les réglages SMTP.",
        "settings.smtp.managed": "En mode suite, le serveur SMTP se règle dans Pilot (Paramètres).",
        "settings.smtp.not_configured": "SMTP non configuré",
        "settings.smtp.help": "Serveur utilisé par ce module pour envoyer ses e-mails. Les valeurs enregistrées ici priment sur les variables d'environnement SMTP_*, champ par champ (SMTP_USER et SMTP_PASSWORD ne servent qu'avec SMTP_HOST) ; sans hôte enregistré, ces variables s'appliquent si elles sont définies, sinon aucun e-mail n'est envoyé. Le test utilise la configuration en vigueur.",
        "settings.smtp.admin_only": "Réservé aux administrateurs du module",
        "settings.smtp.host": "Hôte",
        "settings.smtp.port": "Port",
        "settings.smtp.from": "Expéditeur",
        "settings.smtp.user": "Utilisateur",
        "settings.smtp.password": "Mot de passe",
        "settings.smtp.password_set": "Déjà défini — laisser vide pour le conserver",
        "settings.smtp.tls": "Chiffrer la connexion (STARTTLS ; TLS direct sur le port 465)",
        "settings.smtp.test_to": "Destinataire du test",
        "settings.smtp.test": "Envoyer un test",
        "settings.smtp.save_error": "Échec de l'enregistrement des réglages SMTP",
        "settings.smtp.test_sent": "Message de test envoyé à {to}",
        "settings.smtp.test_error": "Échec de l'envoi du message de test",
        "settings.smtp.test_to_missing": "Indiquez un destinataire pour le test"
    });
    _registerTranslations("en", {
        "settings.smtp.title": "Outgoing mail (SMTP)",
        "settings.smtp.loading": "Loading…",
        "settings.smtp.load_error": "Could not load the SMTP settings.",
        "settings.smtp.managed": "In the suite, the SMTP server is set in Pilot (Settings).",
        "settings.smtp.not_configured": "SMTP not configured",
        "settings.smtp.help": "Server this module uses to send its e-mails. Values saved here take precedence over the SMTP_* environment variables, field by field (SMTP_USER and SMTP_PASSWORD only go with SMTP_HOST); with no host saved, those variables apply if set, otherwise no mail is sent. The test uses the configuration in effect.",
        "settings.smtp.admin_only": "Reserved to the module's administrators",
        "settings.smtp.host": "Host",
        "settings.smtp.port": "Port",
        "settings.smtp.from": "Sender",
        "settings.smtp.user": "User",
        "settings.smtp.password": "Password",
        "settings.smtp.password_set": "Already set — leave blank to keep it",
        "settings.smtp.tls": "Encrypt the connection (STARTTLS; direct TLS on port 465)",
        "settings.smtp.test_to": "Test recipient",
        "settings.smtp.test": "Send a test",
        "settings.smtp.save_error": "Could not save the SMTP settings",
        "settings.smtp.test_sent": "Test message sent to {to}",
        "settings.smtp.test_error": "Could not send the test message",
        "settings.smtp.test_to_missing": "Enter a recipient for the test"
    });
})();
