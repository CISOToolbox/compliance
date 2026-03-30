/**
 * Compliance — AI Assistant Module
 *
 * - AI suggestions for requirements (only if key is set)
 *
 * Requires: ai_common.js loaded first (shared providers, storage, settings, panel UI, CSS).
 * Load AFTER Compliance_app.js and ai_common.js:
 *   <script src="js/ai_common.js"></script>
 *   <script src="js/Compliance_ai_assistant.js"></script>
 */

(function() {
    "use strict";

    // ═══════════════════════════════════════════════════════════════════
    // PROMPTS
    // ═══════════════════════════════════════════════════════════════════

    function _buildSystemPrompt() {
        var lang = _locale === "en" ? "English" : "French";
        return "You are a cybersecurity compliance expert. " +
            "You help organizations define security controls (mesures de sécurité) to meet regulatory requirements. " +
            "You must respond in " + lang + ". " +
            "You must respond ONLY with a valid JSON array of objects. No markdown, no explanation, no preamble. " +
            "Each object has: " +
            '{"description": "...", "details": "...", "responsable": "..."} ' +
            "where 'description' is a concise control title (max 100 chars), " +
            "'details' is the implementation guidance (2-3 sentences), " +
            "and 'responsable' is the suggested owner role (e.g. CISO, IT Manager, DPO). " +
            "Propose 2 to 5 controls. They must be specific, actionable, and proportionate. " +
            "Do not propose controls that are already in place (listed in the context).";
    }

    function _buildUserPrompt(fwId, idx) {
        var entry = _getExigEntry(fwId, idx);
        var exigs = _getExigences(fwId);
        var exig = exigs[idx] || {};

        var ref = _getExigRef(fwId, exig);
        var theme = _rt(exig, "thematique") || _rt(exig, "theme") || "";
        var mesure = _rt(exig, "mesure") || "";
        var description = _rt(exig, "description") || "";

        var org = D.meta ? D.meta.societe || "" : "";
        var scope = D.meta ? D.meta.perimetre || "" : "";

        var linkedIds = entry.mesures_ids || [];
        var existingControls = D.mesures
            .filter(function(m) { return linkedIds.indexOf(m.id) !== -1; })
            .map(function(m) { return m.description; })
            .join("; ");

        var lang = _locale === "en" ? "English" : "French";
        return "Organization: " + (org || "Not specified") + "\n" +
            "Scope: " + (scope || "Not specified") + "\n" +
            "Framework: " + fwId.toUpperCase() + "\n" +
            "Requirement ref: " + ref + "\n" +
            "Category: " + theme + "\n" +
            "Requirement: " + mesure + "\n" +
            (description ? "Description: " + description + "\n" : "") +
            (existingControls ? "Controls already in place: " + existingControls + "\n" : "") +
            "\nPropose security controls to address this requirement. Respond in " + lang + ".";
    }

    // ═══════════════════════════════════════════════════════════════════
    // UI: SUGGESTION PANEL
    // ═══════════════════════════════════════════════════════════════════

    function _renderSuggestions(fwId, idx, suggestions) {
        var ref = _getExigRef(fwId, _getExigences(fwId)[idx] || {});
        var title = "✨ AI — " + ref;

        if (!suggestions || suggestions.length === 0) {
            var p = _aiEnsurePanel();
            p.title.textContent = title;
            p.body.innerHTML = '<p style="padding:20px;color:var(--text-muted);text-align:center">' + t("ai.no_suggestions") + '</p>';
            p.footer.innerHTML = '';
            _aiOpenPanel();
            return;
        }

        var html = "";
        suggestions.forEach(function(s, i) {
            html += '<div class="ai-card" id="ai-card-' + i + '">' +
                '<div class="ai-card-title">' + esc(s.description) + '</div>' +
                (s.details ? '<div class="ai-card-details">' + esc(s.details) + '</div>' : '') +
                (s.responsable ? '<div class="ai-card-meta">' + t("ai.owner") + ': ' + esc(s.responsable) + '</div>' : '') +
                '<div class="ai-card-actions">' +
                    '<button class="ai-btn-accept" data-idx="' + i + '">' + t("ai.accept") + '</button>' +
                    '<button class="ai-btn-ignore" data-idx="' + i + '">' + t("ai.ignore") + '</button>' +
                '</div>' +
            '</div>';
        });

        html += '<div style="display:flex;gap:8px;justify-content:flex-end;padding:12px 0">' +
            '<button class="ai-btn-accept-all">' + t("ai.accept_all") + '</button>' +
            '<button class="ai-btn-close">' + t("ai.close") + '</button>' +
        '</div>';

        var p = _aiEnsurePanel();
        p.title.textContent = title;
        p.body.innerHTML = html;
        p.footer.innerHTML = '';
        _aiOpenPanel();

        _currentSuggestions = suggestions;
        _currentFwId = fwId;
        _currentIdx = idx;

        p.body.querySelectorAll(".ai-btn-accept").forEach(function(btn) {
            btn.onclick = function() { _acceptSuggestion(parseInt(btn.getAttribute("data-idx"))); };
        });
        p.body.querySelectorAll(".ai-btn-ignore").forEach(function(btn) {
            btn.onclick = function() {
                var card = document.getElementById("ai-card-" + btn.getAttribute("data-idx"));
                if (card) card.style.display = "none";
            };
        });
        var acceptAllBtn = p.body.querySelector(".ai-btn-accept-all");
        if (acceptAllBtn) acceptAllBtn.onclick = function() { _acceptAll(); };
        var closeBtn = p.body.querySelector(".ai-btn-close");
        if (closeBtn) closeBtn.onclick = _aiClosePanel;
    }

    var _currentSuggestions = [];
    var _currentFwId = "";
    var _currentIdx = 0;

    function _acceptSuggestion(sIdx) {
        var s = _currentSuggestions[sIdx];
        if (!s || s._accepted) return;
        s._accepted = true;

        _saveState();
        var entry = _getExigEntry(_currentFwId, _currentIdx);
        var id;
        var isUpdate = false;

        // Check if this is an update of an existing measure
        if (s.id) {
            var existing = D.mesures.find(function(m) { return m.id === s.id; });
            if (existing) {
                isUpdate = true;
                id = s.id;
                if (s.description) existing.description = s.description;
                if (s.details) existing.details = s.details;
                if (s.responsable) existing.responsable = s.responsable;
            }
        }

        if (!isUpdate) {
            id = _genMesureId();
            D.mesures.push({
                id: id,
                description: s.description || "",
                details: s.details || "",
                statut: "planifie",
                date_cible: "",
                responsable: s.responsable || "",
                recurrence: "",
                dernier_controle: "",
                preuves_ids: []
            });
            if (!entry.mesures_ids) entry.mesures_ids = [];
            if (entry.mesures_ids.indexOf(id) === -1) entry.mesures_ids.push(id);
        }
        _autoSave();

        var card = document.getElementById("ai-card-" + sIdx);
        if (card) {
            card.style.opacity = "0.5";
            card.querySelector(".ai-btn-accept").textContent = "✓ " + id;
            card.querySelector(".ai-btn-accept").disabled = true;
            card.querySelector(".ai-btn-ignore").style.display = "none";
        }
        showStatus(isUpdate ? t("ai.control_updated", {id: id}) : t("ai.control_created", {id: id}));
    }

    function _acceptAll() {
        _currentSuggestions.forEach(function(s, i) {
            if (!s._accepted) _acceptSuggestion(i);
        });
        if (typeof _renderFwView === "function") _renderFwView(_currentFwId, "exigences");
    }

    // ═══════════════════════════════════════════════════════════════════
    // MAIN ENTRY POINT
    // ═══════════════════════════════════════════════════════════════════

    window.aiSuggestControls = function(fwId, idx) {
        if (!_aiIsEnabled()) return;
        var exigs = _getExigences(fwId);
        var exig = exigs[idx] || {};
        var ref = _getExigRef(fwId, exig);
        var panelTitle = "✨ AI — " + ref;

        // Show prompt panel — user chooses between auto-suggest or custom instruction
        var pp = _aiEnsurePanel();
        _aiOpenPanel(panelTitle);
        pp.body.innerHTML =
            '<p class="fs-sm" style="margin-bottom:16px;color:var(--text-muted)">' + t("ai.prompt_intro") + '</p>' +
            '<button class="ai-btn-accept" style="width:100%;padding:10px;font-size:0.9em;margin-bottom:16px" id="ai-auto-suggest">' + t("ai.auto_suggest") + '</button>' +
            '<div class="settings-label fs-sm" style="margin-bottom:6px">' + t("ai.custom_instruction_label") + '</div>' +
            '<textarea id="ai-custom-instruction" class="w-full" rows="4" style="border:1px solid var(--border);border-radius:6px;padding:8px;font-size:0.85em;resize:vertical" placeholder="' + esc(t("ai.custom_instruction_placeholder")) + '"></textarea>' +
            '<button class="ai-btn-accept" style="width:100%;padding:10px;font-size:0.9em;margin-top:8px;background:var(--light-blue)" id="ai-send-custom">' + t("ai.send_instruction") + '</button>';
        pp.footer.innerHTML = '<button class="ai-btn-close" id="ai-prompt-close">' + t("ai.close") + '</button>';

        document.getElementById("ai-prompt-close").onclick = _aiClosePanel;
        document.getElementById("ai-auto-suggest").onclick = function() { _runComplianceSuggest(fwId, idx, ""); };
        document.getElementById("ai-send-custom").onclick = function() {
            var textarea = document.getElementById("ai-custom-instruction");
            _runComplianceSuggest(fwId, idx, textarea ? textarea.value.trim() : "");
        };
    };

    async function _runComplianceSuggest(fwId, idx, customInstruction) {
        var exigs = _getExigences(fwId);
        var exig = exigs[idx] || {};
        var ref = _getExigRef(fwId, exig);

        _aiShowLoading("✨ AI — " + ref);

        try {
            var sysPrompt = _buildSystemPrompt();
            var userPrompt;

            if (customInstruction) {
                // Custom mode: use the full auto prompt context but replace instruction with user's text
                var autoPrompt = _buildUserPrompt(fwId, idx);
                var contextEnd = autoPrompt.lastIndexOf("\n\nPropose ");
                if (contextEnd === -1) contextEnd = autoPrompt.lastIndexOf("\n\nRespond in ");
                var contextData = contextEnd > 0 ? autoPrompt.substring(0, contextEnd) : autoPrompt;

                userPrompt = contextData +
                    "\n\nIMPORTANT: You must ONLY propose security controls for this requirement. Do not propose anything else." +
                    "\n\nUser instruction: " + customInstruction +
                    "\n\nRespond in " + (_locale === "en" ? "English" : "French") + "." +
                    '\n\nRespond with valid JSON matching this schema: [{"description":"...","details":"...","responsable":"..."}]';
            } else {
                userPrompt = _buildUserPrompt(fwId, idx);
            }

            var raw = await _aiCallAPI(sysPrompt, userPrompt);
            if (!raw) { _aiClosePanel(); return; }

            var parsed = _aiParseJSON(raw);
            var suggestions = Array.isArray(parsed) ? parsed : [parsed];
            _renderSuggestions(fwId, idx, suggestions);
        } catch (e) {
            var p = _aiEnsurePanel();
            p.title.textContent = "✨ AI — " + ref;
            p.body.innerHTML =
                '<p style="padding:20px;color:var(--red)">' + t("ai.parse_error") + '</p>' +
                '<pre style="font-size:0.75em;white-space:pre-wrap;max-height:200px;overflow:auto">' + esc(e.message) + '</pre>';
            p.footer.innerHTML = '';
            _aiOpenPanel();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // INJECT AI BUTTONS (only if AI enabled)
    // ═══════════════════════════════════════════════════════════════════

    var _origRenderFwExigences = _renderFwExigences;
    _renderFwExigences = function(fwId, label) {
        _origRenderFwExigences(fwId, label);
        if (!_aiIsEnabled()) return;
        document.querySelectorAll('[data-click="_proposerMesures"]').forEach(function(btn) {
            if (btn.nextElementSibling && btn.nextElementSibling.classList.contains("ai-btn-suggest")) return;
            var args = JSON.parse(btn.getAttribute("data-args"));
            var aiBtn = document.createElement("button");
            aiBtn.className = "btn-add fs-xs ai-btn-suggest";
            aiBtn.textContent = "✨ AI";
            aiBtn.setAttribute("data-click", "aiSuggestControls");
            aiBtn.setAttribute("data-args", JSON.stringify(args));
            btn.parentElement.appendChild(aiBtn);
        });
    };

    // ═══════════════════════════════════════════════════════════════════
    // I18N — app-specific keys only
    // ═══════════════════════════════════════════════════════════════════

    _registerTranslations("fr", {
        "ai.owner": "Responsable",
        "ai.control_created": "Mesure {id} créée et liée",
        "ai.control_updated": "Mesure {id} mise à jour",
        "ai.prompt_intro": "Que souhaitez-vous demander à l'assistant IA ?",
        "ai.auto_suggest": "Proposer automatiquement des mesures",
        "ai.custom_instruction_label": "Ou donnez vos instructions :",
        "ai.custom_instruction_placeholder": "Décrivez ce que vous attendez de l'IA (ex : « propose des mesures techniques pour cette exigence »...)",
        "ai.send_instruction": "Envoyer mes instructions",
        "ai.key_cleared": "Clé API supprimée"
    });

    _registerTranslations("en", {
        "ai.owner": "Owner",
        "ai.control_created": "Control {id} created and linked",
        "ai.control_updated": "Control {id} updated",
        "ai.prompt_intro": "What would you like the AI assistant to do?",
        "ai.auto_suggest": "Automatically suggest controls",
        "ai.custom_instruction_label": "Or provide your instructions:",
        "ai.custom_instruction_placeholder": "Describe what you expect from the AI (e.g. \"suggest technical controls for this requirement\"...)",
        "ai.send_instruction": "Send my instructions",
        "ai.key_cleared": "API key cleared"
    });

})();
