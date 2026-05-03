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
            '{"description": "...", "details": "...", "responsable": "...", "statut": "termine|planifie"} ' +
            "where 'description' is a concise control title (max 100 chars), " +
            "'details' is the implementation guidance (2-3 sentences), " +
            "'responsable' is the suggested owner role (e.g. CISO, IT Manager, DPO), " +
            "and 'statut' indicates whether the control is already in place ('termine') or needs to be implemented ('planifie'). " +
            "IMPORTANT: if the comments/gap analysis mention that something IS already done, " +
            "propose a measure with statut 'termine' to formalize it. " +
            "If something NEEDS to be done, propose with statut 'planifie'. " +
            "Propose 2 to 5 controls. They must be specific, actionable, and proportionate.";
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

        var ecart = entry.ecart || "";

        var lang = _locale === "en" ? "English" : "French";
        return "Organization: " + (org || "Not specified") + "\n" +
            "Scope: " + (scope || "Not specified") + "\n" +
            "Framework: " + fwId.toUpperCase() + "\n" +
            "Requirement ref: " + ref + "\n" +
            "Category: " + theme + "\n" +
            "Requirement: " + mesure + "\n" +
            (description ? "Description: " + description + "\n" : "") +
            (ecart ? "Current assessment / comments: " + ecart + "\n" : "") +
            (existingControls ? "Controls already linked: " + existingControls + "\n" : "") +
            "\nPropose security controls. If the comments describe things already in place, propose them as 'termine'. " +
            "If gaps are identified, propose measures as 'planifie'. Respond in " + lang + ".";
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
                '<div class="ai-card-meta">' +
                    (s.statut === "termine" ? '<span style="color:var(--green);font-weight:600">✓ ' + _statutLabel("termine") + '</span>' : '<span style="color:var(--orange)">○ ' + _statutLabel("planifie") + '</span>') +
                    (s.responsable ? ' · ' + t("ai.owner") + ': ' + esc(s.responsable) : '') +
                '</div>' +
                '<div class="ai-card-actions">' +
                    '<button class="ai-btn-accept" data-idx="' + i + '">' + t("ai.accept") + '</button>' +
                    '<button class="ai-btn-ignore" data-idx="' + i + '">' + t("ai.ignore") + '</button>' +
                '</div>' +
            '</div>';
        });

        html += '<div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border)">';
        html += '<label class="settings-label fs-xs">' + t("ai.refine_label") + '</label>';
        html += '<div style="display:flex;gap:8px"><input type="text" id="ai-suggest-refine" class="settings-input" style="flex:1" placeholder="' + esc(t("ai.refine_placeholder")) + '" />';
        html += '<button class="ai-btn-accept" id="ai-suggest-refine-run">' + t("ai.refine_run") + '</button></div></div>';

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
        var refineBtn = document.getElementById("ai-suggest-refine-run");
        if (refineBtn) refineBtn.onclick = function() {
            var refineText = document.getElementById("ai-suggest-refine").value.trim();
            if (refineText) _runComplianceSuggest(fwId, idx, refineText);
        };
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
            var newMesure = {
                id: id,
                description: s.description || "",
                details: s.details || "",
                statut: s.statut === "termine" ? "termine" : "planifie",
                date_cible: "",
                responsable: s.responsable || "",
                recurrence: "",
                dernier_controle: "",
                preuves_ids: []
            };
            D.mesures.push(newMesure);
            if (!entry.mesures_ids) entry.mesures_ids = [];
            if (entry.mesures_ids.indexOf(id) === -1) entry.mesures_ids.push(id);
            _persistCreate("measure", newMesure);
            _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
        } else {
            _persist("measure", id, { description: s.description, details: s.details, responsable: s.responsable });
        }

        var card = document.getElementById("ai-card-" + sIdx);
        if (card) {
            card.style.opacity = "0.5";
            card.querySelector(".ai-btn-accept").textContent = "✓ " + id;
            card.querySelector(".ai-btn-accept").disabled = true;
            card.querySelector(".ai-btn-ignore").style.display = "none";
        }
        showStatus(isUpdate ? t("ai.control_updated", {id: id}) : t("ai.control_created", {id: id}));
        // Refresh the exigences view behind the AI panel so the linked
        // measure appears immediately when the panel is closed
        if (typeof _renderFwView === "function") _renderFwView(_currentFwId, "exigences");
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
    // GLOBAL AI: BULK UPDATE FROM DOCUMENT / TEXT
    // ═══════════════════════════════════════════════════════════════════

    var _globalFwId = "";

    window.aiGlobalAnalysis = function(fwId) {
        if (!_aiIsEnabled()) { openSettings(); return; }
        _globalFwId = fwId;
        _globalAbort = false;
        var p = _aiEnsurePanel();
        p.title.textContent = "✨ " + t("ai.global_title");
        var h = '<p class="fs-sm" style="margin-bottom:12px">' + t("ai.global_desc") + '</p>';

        // Mode selection
        h += '<div style="display:flex;gap:8px;margin-bottom:16px">';
        h += '<button class="ai-btn-accept" style="flex:1;padding:10px" id="ai-mode-conformity">' + t("ai.mode_conformity") + '</button>';
        h += '<button class="ai-btn-accept" style="flex:1;padding:10px;background:var(--light-blue)" id="ai-mode-custom">' + t("ai.mode_custom") + '</button>';
        h += '</div>';

        // Conformity mode: file upload + text
        h += '<div id="ai-conformity-section" style="display:none">';
        h += '<div style="margin-bottom:12px"><label class="settings-label">' + t("ai.global_file") + '</label>';
        h += '<input type="file" id="ai-global-file" accept=".docx,.xlsx,.xls,.txt,.csv,.md" class="settings-input" style="font-family:inherit"></div>';
        h += '<div id="ai-global-file-info" class="fs-xs text-muted" style="margin-bottom:8px"></div>';
        h += '<label class="settings-label">' + t("ai.global_text") + '</label>';
        h += '<textarea id="ai-global-text" rows="6" class="settings-input" style="width:100%;font-family:inherit;font-size:0.88em" placeholder="' + t("ai.global_text_placeholder") + '"></textarea>';
        h += '<div style="display:flex;gap:8px;margin-top:8px">';
        h += '<button class="ai-btn-accept" id="ai-global-run">' + t("ai.global_run") + '</button>';
        h += '<button class="ai-btn-close" id="ai-global-stop" style="display:none">' + t("ai.global_stop") + '</button>';
        h += '</div></div>';

        // Custom mode: instruction textarea
        h += '<div id="ai-custom-section" style="display:none">';
        h += '<label class="settings-label">' + t("ai.custom_instruction_label") + '</label>';
        h += '<textarea id="ai-global-custom" rows="4" class="settings-input" style="width:100%;font-family:inherit;font-size:0.88em" placeholder="' + esc(t("ai.global_custom_placeholder")) + '"></textarea>';
        h += '<div style="display:flex;gap:8px;margin-top:8px">';
        h += '<button class="ai-btn-accept" id="ai-custom-run">' + t("ai.send_instruction") + '</button>';
        h += '<button class="ai-btn-close" id="ai-custom-stop" style="display:none">' + t("ai.global_stop") + '</button>';
        h += '</div></div>';

        h += '<div id="ai-global-result"></div>';
        p.body.innerHTML = h;
        p.footer.innerHTML = '<button class="ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        _aiOpenPanel();

        // Mode toggle
        document.getElementById("ai-mode-conformity").onclick = function() {
            document.getElementById("ai-conformity-section").style.display = "";
            document.getElementById("ai-custom-section").style.display = "none";
            this.style.outline = "2px solid var(--blue)";
            document.getElementById("ai-mode-custom").style.outline = "";
        };
        document.getElementById("ai-mode-custom").onclick = function() {
            document.getElementById("ai-conformity-section").style.display = "none";
            document.getElementById("ai-custom-section").style.display = "";
            this.style.outline = "2px solid var(--blue)";
            document.getElementById("ai-mode-conformity").style.outline = "";
        };

        document.getElementById("ai-global-file").onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            _parseGlobalFile(file);
        };
        document.getElementById("ai-global-run").onclick = function() { _runGlobalAnalysisBatched(); };
        document.getElementById("ai-custom-run").onclick = function() { _runGlobalCustom(); };
        document.getElementById("ai-global-stop").onclick = function() {
            _globalAbort = true;
            this.disabled = true;
            this.textContent = t("ai.stopped");
            var r = document.getElementById("ai-global-run");
            if (r) r.disabled = false;
        };
        document.getElementById("ai-custom-stop").onclick = function() {
            _globalAbort = true;
            this.disabled = true;
            this.textContent = t("ai.stopped");
            var r = document.getElementById("ai-custom-run");
            if (r) r.disabled = false;
        };
    };

    function _parseGlobalFile(file) {
        var info = document.getElementById("ai-global-file-info");
        var textarea = document.getElementById("ai-global-text");
        var ext = file.name.split(".").pop().toLowerCase();

        if (ext === "txt" || ext === "md" || ext === "csv") {
            var reader = new FileReader();
            reader.onload = function(ev) {
                textarea.value = ev.target.result.substring(0, 50000);
                if (info) info.textContent = file.name + " (" + Math.round(file.size / 1024) + " Ko)";
            };
            reader.readAsText(file);
        } else if (ext === "docx") {
            var reader = new FileReader();
            reader.onload = function(ev) {
                _extractDocxText(ev.target.result).then(function(text) {
                    textarea.value = text.substring(0, 50000);
                    if (info) info.textContent = file.name + " (" + Math.round(text.length / 1024) + " Ko texte)";
                }).catch(function(err) {
                    if (info) info.textContent = "Erreur: " + err.message;
                });
            };
            reader.readAsArrayBuffer(file);
        } else if (ext === "xlsx" || ext === "xls") {
            var reader = new FileReader();
            reader.onload = function(ev) {
                _extractExcelText(ev.target.result).then(function(text) {
                    textarea.value = text.substring(0, 50000);
                    if (info) info.textContent = file.name + " (" + Math.round(text.length / 1024) + " Ko texte)";
                }).catch(function(err) {
                    if (info) info.textContent = "Erreur: " + err.message;
                });
            };
            reader.readAsArrayBuffer(file);
        } else {
            if (info) info.textContent = "Format non supporté: " + ext;
        }
    }

    async function _extractDocxText(buffer) {
        if (typeof JSZip === "undefined") {
            await _loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js");
        }
        var zip = await JSZip.loadAsync(buffer);
        var docXml = await zip.file("word/document.xml").async("string");
        var text = docXml.replace(/<w:br[^>]*\/>/gi, "\n")
            .replace(/<\/w:p>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
            .replace(/\n{3,}/g, "\n\n").trim();
        return text;
    }

    async function _extractExcelText(buffer) {
        if (typeof ExcelJS === "undefined") {
            await _loadScript("https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js");
        }
        var wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        var lines = [];
        wb.eachSheet(function(ws) {
            ws.eachRow(function(row) {
                var cells = [];
                row.eachCell(function(cell) { cells.push(String(cell.value || "")); });
                lines.push(cells.join(" | "));
            });
        });
        return lines.join("\n");
    }

    function _loadScript(url) {
        return new Promise(function(resolve, reject) {
            if (document.querySelector('script[src="' + url + '"]')) { resolve(); return; }
            var s = document.createElement("script");
            s.src = url;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    var _globalAbort = false;
    var _BATCH_SIZE = 10;

    var _globalUpdates = [];

    async function _runGlobalAnalysisBatched() {
        var text = document.getElementById("ai-global-text").value.trim();
        if (!text) return;
        var fwId = _globalFwId;
        var exigs = _getExigences(fwId);
        if (!exigs || exigs.length === 0) return;

        _globalAbort = false;
        _globalUpdates = [];
        var stopBtn = document.getElementById("ai-global-stop");
        var runBtn = document.getElementById("ai-global-run");
        if (stopBtn) stopBtn.style.display = "";
        if (runBtn) runBtn.disabled = true;

        var resultEl = document.getElementById("ai-global-result");
        if (resultEl) resultEl.innerHTML = '';

        var lang = _locale === "en" ? "English" : "French";
        var systemPrompt =
            "You are a compliance auditor. You analyze a document to identify security measures already in place and gaps. " +
            "For each requirement, propose concrete security measures (mesures). " +
            "Respond ONLY with a valid JSON array. Each entry: " +
            '{"ref": "requirement reference", "status": "OK|KO", "ecart": "brief comment on coverage", "mesures": [{"description": "measure title", "details": "implementation details", "statut": "termine|planifie"}]} ' +
            "OK = the requirement is covered → propose measures with statut 'termine' describing what IS already done. " +
            "KO = gap identified → propose measures with statut 'planifie' describing what NEEDS to be done. " +
            "Each requirement should have 1-3 measures. " +
            "IMPORTANT: describe what IS done or NEEDS to be done, not what the document says. " +
            "Include ALL requirements from the batch. " +
            "Respond in " + lang + ".";

        var exigSummary = exigs.map(function(e, i) {
            return { idx: i, ref: _getExigRef(fwId, e), theme: _rt(e, "thematique") || _rt(e, "theme") || "", mesure: _rt(e, "mesure") || "" };
        });

        var updateIdx = 0;
        for (var b = 0; b < exigSummary.length; b += _BATCH_SIZE) {
            if (_globalAbort) break;
            var batch = exigSummary.slice(b, b + _BATCH_SIZE);
            var batchNum = Math.floor(b / _BATCH_SIZE) + 1;
            var totalBatches = Math.ceil(exigSummary.length / _BATCH_SIZE);

            if (resultEl) {
                resultEl.insertAdjacentHTML("beforeend",
                    '<div class="ai-card" style="background:#f0f4ff;padding:10px;margin-bottom:8px"><span class="fs-sm">' +
                    t("ai.batch_progress", {n: batchNum, total: totalBatches}) + '</span></div>');
                resultEl.scrollTop = resultEl.scrollHeight;
            }

            var userPrompt =
                "Organization: " + (D.meta ? D.meta.societe || "" : "") + "\n" +
                "Framework: " + fwId.toUpperCase() + "\n\n" +
                "Requirements (batch " + batchNum + "/" + totalBatches + "):\n" +
                batch.map(function(e) { return e.ref + " — " + e.theme + " — " + e.mesure; }).join("\n") + "\n\n" +
                "Document to analyze:\n" + text.substring(0, 30000);

            try {
                var raw = await _aiCallAPI(systemPrompt, userPrompt);
                if (!raw) continue;
                var updates = _aiParseJSON(raw);
                if (!Array.isArray(updates)) continue;

                updates.forEach(function(u) {
                    var gIdx = updateIdx++;
                    _globalUpdates.push(u);
                    var isOK = (u.status || "").toUpperCase() === "OK";
                    var color = isOK ? "var(--green)" : "var(--red)";

                    var cardH = '<div class="ai-card" id="ai-global-card-' + gIdx + '" style="padding:10px;margin-bottom:6px;border:1px solid var(--border);border-radius:6px">';
                    cardH += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">';
                    cardH += '<span style="font-weight:600;min-width:80px">' + esc(u.ref || "") + '</span>';
                    cardH += '<span style="color:' + color + ';font-weight:700;font-size:1.1em">' + esc(u.status || "") + '</span>';
                    cardH += '<span style="flex:1"></span>';
                    cardH += '<button class="ai-btn-accept" style="padding:3px 10px;font-size:0.8em" data-gidx="' + gIdx + '">' + t("ai.accept") + '</button>';
                    cardH += '<button class="ai-btn-ignore" style="padding:3px 10px;font-size:0.8em" data-gidx="' + gIdx + '">' + t("ai.ignore") + '</button>';
                    cardH += '</div>';
                    if (u.ecart) cardH += '<div class="fs-xs" style="color:var(--text-muted);margin-bottom:4px">' + esc(u.ecart) + '</div>';
                    if (u.mesures && u.mesures.length) {
                        cardH += '<div class="fs-xs" style="margin-top:4px">';
                        u.mesures.forEach(function(m) {
                            var mColor = m.statut === "termine" ? "var(--green)" : "var(--orange,#f97316)";
                            cardH += '<div style="padding:2px 0;display:flex;gap:6px;align-items:baseline"><span style="color:' + mColor + ';font-weight:600">' + (m.statut === "termine" ? "✓" : "○") + '</span><span>' + esc(m.description || "") + '</span></div>';
                        });
                        cardH += '</div>';
                    }
                    cardH += '</div>';
                    if (resultEl) resultEl.insertAdjacentHTML("beforeend", cardH);
                });
                // Wire accept/ignore buttons for this batch
                if (resultEl) {
                    resultEl.querySelectorAll(".ai-btn-accept[data-gidx]").forEach(function(btn) {
                        if (btn._wired) return;
                        btn._wired = true;
                        btn.onclick = function() { _acceptGlobalItem(fwId, parseInt(btn.getAttribute("data-gidx"))); };
                    });
                    resultEl.querySelectorAll(".ai-btn-ignore[data-gidx]").forEach(function(btn) {
                        if (btn._wired) return;
                        btn._wired = true;
                        btn.onclick = function() {
                            var card = document.getElementById("ai-global-card-" + btn.getAttribute("data-gidx"));
                            if (card) { card.style.opacity = "0.3"; card.style.pointerEvents = "none"; }
                        };
                    });
                    resultEl.scrollTop = resultEl.scrollHeight;
                }
            } catch (e) {
                if (resultEl) resultEl.insertAdjacentHTML("beforeend", '<p style="color:var(--red);font-size:0.85em">Batch ' + batchNum + ' error: ' + esc(e.message) + '</p>');
            }
        }

        if (stopBtn) stopBtn.style.display = "none";
        if (runBtn) runBtn.disabled = false;

        if (_globalUpdates.length > 0 && resultEl) {
            var footerH = '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;padding-top:8px;border-top:1px solid var(--border)">';
            footerH += '<span class="fs-sm text-muted" style="flex:1">' + t("ai.global_results", {n: _globalUpdates.length}) + (_globalAbort ? ' (' + t("ai.stopped") + ')' : '') + '</span>';
            footerH += '<button class="ai-btn-accept" id="ai-global-accept-all">' + t("ai.accept_all") + '</button>';
            footerH += '<button class="ai-btn-close" id="ai-global-cancel">' + t("ai.close") + '</button>';
            footerH += '</div>';
            resultEl.insertAdjacentHTML("beforeend", footerH);
            document.getElementById("ai-global-cancel").onclick = _aiClosePanel;
            document.getElementById("ai-global-accept-all").onclick = function() {
                _globalUpdates.forEach(function(u, i) { _acceptGlobalItem(fwId, i); });
            };
        }
    }

    function _acceptGlobalItem(fwId, gIdx) {
        var u = _globalUpdates[gIdx];
        if (!u || u._applied) return;
        u._applied = true;

        var exigs = _getExigences(fwId);
        var uRef = (u.ref || "").trim();
        var idx = exigs.findIndex(function(e) {
            var eRef = _getExigRef(fwId, e);
            return eRef === uRef || eRef.replace(/\.$/, "") === uRef.replace(/\.$/, "");
        });
        if (idx >= 0) {
            _saveState();
            var entry = _getExigEntry(fwId, idx);

            // Update ecart/comment
            if (u.ecart !== undefined) {
                entry.ecart = u.ecart;
                if (entry.id) _persist("control", entry.id, { ecart: entry.ecart });
            }

            // Create measures and link them to the exigence
            var mesures = u.mesures || [];
            if (!entry.mesures_ids) entry.mesures_ids = [];
            mesures.forEach(function(m) {
                var id = _genMesureId();
                var newMesure = {
                    id: id,
                    description: m.description || "",
                    details: m.details || "",
                    statut: m.statut === "termine" ? "termine" : "planifie",
                    date_cible: "",
                    responsable: m.responsable || "",
                    recurrence: "",
                    dernier_controle: "",
                    preuves_ids: []
                };
                D.mesures.push(newMesure);
                entry.mesures_ids.push(id);
                _persistCreate("measure", newMesure);
            });
            if (mesures.length && entry.id) {
                _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
            }
            if (!entry.id) _autoSave();
        }

        var card = document.getElementById("ai-global-card-" + gIdx);
        if (card) {
            card.style.opacity = "0.4";
            card.querySelector(".ai-btn-accept").textContent = "✓";
            card.querySelector(".ai-btn-accept").disabled = true;
            card.querySelector(".ai-btn-ignore").style.display = "none";
        }
        if (typeof _renderFwView === "function") _renderFwView(fwId, "exigences");
    }

    async function _runGlobalCustom() {
        var instruction = document.getElementById("ai-global-custom").value.trim();
        if (!instruction) return;
        var fwId = _globalFwId;
        var exigs = _getExigences(fwId);
        if (!exigs || exigs.length === 0) return;

        _globalAbort = false;
        var stopBtn = document.getElementById("ai-custom-stop");
        var runBtn = document.getElementById("ai-custom-run");
        if (stopBtn) stopBtn.style.display = "";
        if (runBtn) runBtn.disabled = true;

        var resultEl = document.getElementById("ai-global-result");
        if (resultEl) resultEl.innerHTML = '<p class="text-muted">' + t("ai.loading") + '</p>';

        var lang = _locale === "en" ? "English" : "French";

        // Step 1: ask the AI which exigences are affected by the instruction
        // Send all refs in a single lightweight call
        var exigSummary = exigs.map(function(e, i) {
            return { idx: i, ref: _getExigRef(fwId, e), theme: _rt(e, "thematique") || _rt(e, "theme") || "", mesure: (_rt(e, "mesure") || "").substring(0, 80), conformite: e.conformite || "", ecart: (e.ecart || "").substring(0, 60) };
        });

        var scopePrompt =
            "You are a compliance assistant. The user gave an instruction that may affect some or all requirements. " +
            "First, identify WHICH requirements are concerned by the instruction. " +
            "Respond ONLY with a valid JSON array of the affected requirement refs (strings). " +
            "If ALL are affected, return [\"*\"]. If none, return []. " +
            "Respond in " + lang + ".";

        var scopeUser =
            "Framework: " + fwId.toUpperCase() + "\n" +
            "Requirements:\n" + exigSummary.map(function(e) { return e.ref + " — " + e.mesure; }).join("\n") + "\n\n" +
            "User instruction: " + instruction;

        var targetRefs = null;
        try {
            var scopeRaw = await _aiCallAPI(scopePrompt, scopeUser);
            if (scopeRaw) {
                var scopeParsed = _aiParseJSON(scopeRaw);
                if (Array.isArray(scopeParsed)) targetRefs = scopeParsed;
            }
        } catch (e) { /* fall through to all */ }

        // Filter exigences to only those affected
        var filteredExigs;
        if (!targetRefs || (targetRefs.length === 1 && targetRefs[0] === "*")) {
            filteredExigs = exigSummary;
        } else if (targetRefs.length === 0) {
            if (resultEl) resultEl.innerHTML = '<p class="text-muted">' + t("ai.no_suggestions") + '</p>';
            if (stopBtn) stopBtn.style.display = "none";
            if (runBtn) runBtn.disabled = false;
            return;
        } else {
            var refSet = {};
            targetRefs.forEach(function(r) { refSet[String(r).trim()] = true; });
            filteredExigs = exigSummary.filter(function(e) { return refSet[e.ref]; });
            if (filteredExigs.length === 0) filteredExigs = exigSummary; // fallback
        }

        if (resultEl) resultEl.innerHTML = '<p class="fs-sm text-muted">' + t("ai.global_results", {n: filteredExigs.length}) + '</p>';

        // Step 2: process affected exigences — same OK/KO + measures pattern as conformity mode
        _globalUpdates = [];
        var systemPrompt =
            "You are a cybersecurity compliance expert. " +
            "You are given a list of regulatory requirements and a user instruction. " +
            "Apply the instruction and propose concrete security measures for each affected requirement. " +
            "Respond ONLY with a valid JSON array. Each entry: " +
            '{"ref": "requirement reference", "status": "OK|KO", "ecart": "brief comment", "mesures": [{"description": "measure title", "details": "implementation details", "statut": "termine|planifie"}]} ' +
            "OK = covered → propose measures with statut 'termine'. KO = gap → propose measures with statut 'planifie'. " +
            "IMPORTANT: describe what IS done or NEEDS to be done. " +
            "Only include requirements affected by the instruction. " +
            "Respond in " + lang + ".";

        var batchSize = Math.max(_BATCH_SIZE, Math.min(filteredExigs.length, 50));
        var updateIdx = 0;
        for (var b = 0; b < filteredExigs.length; b += batchSize) {
            if (_globalAbort) break;
            var batch = filteredExigs.slice(b, b + batchSize);
            var batchNum = Math.floor(b / batchSize) + 1;
            var totalBatches = Math.ceil(filteredExigs.length / batchSize);

            if (totalBatches > 1 && resultEl) {
                resultEl.insertAdjacentHTML("beforeend",
                    '<div class="ai-card" style="background:#f0f4ff;padding:10px;margin-bottom:8px"><span class="fs-sm">' +
                    t("ai.batch_progress", {n: batchNum, total: totalBatches}) + '</span></div>');
                resultEl.scrollTop = resultEl.scrollHeight;
            }

            var userPrompt =
                "Organization: " + (D.meta ? D.meta.societe || "" : "") + "\n" +
                "Framework: " + fwId.toUpperCase() + "\n\n" +
                "Requirements:\n" +
                batch.map(function(e) {
                    return e.ref + " — " + e.theme + " — " + e.mesure + " [current: " + (e.conformite || "not evaluated") + (e.ecart ? " / " + e.ecart : "") + "]";
                }).join("\n") + "\n\n" +
                "User instruction: " + instruction;

            try {
                var raw = await _aiCallAPI(systemPrompt, userPrompt);
                if (!raw) continue;
                var updates = _aiParseJSON(raw);
                if (!Array.isArray(updates)) continue;

                updates.forEach(function(u) {
                    var gIdx = updateIdx++;
                    _globalUpdates.push(u);
                    var isOK = (u.status || "").toUpperCase() === "OK";
                    var color = isOK ? "var(--green)" : "var(--red)";

                    var cardH = '<div class="ai-card" id="ai-global-card-' + gIdx + '" style="padding:10px;margin-bottom:6px;border:1px solid var(--border);border-radius:6px">';
                    cardH += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">';
                    cardH += '<span style="font-weight:600;min-width:80px">' + esc(u.ref || "") + '</span>';
                    cardH += '<span style="color:' + color + ';font-weight:700;font-size:1.1em">' + esc(u.status || "") + '</span>';
                    cardH += '<span style="flex:1"></span>';
                    cardH += '<button class="ai-btn-accept" style="padding:3px 10px;font-size:0.8em" data-gidx="' + gIdx + '">' + t("ai.accept") + '</button>';
                    cardH += '<button class="ai-btn-ignore" style="padding:3px 10px;font-size:0.8em" data-gidx="' + gIdx + '">' + t("ai.ignore") + '</button>';
                    cardH += '</div>';
                    if (u.ecart) cardH += '<div class="fs-xs" style="color:var(--text-muted);margin-bottom:4px">' + esc(u.ecart) + '</div>';
                    if (u.mesures && u.mesures.length) {
                        cardH += '<div class="fs-xs" style="margin-top:4px">';
                        u.mesures.forEach(function(m) {
                            var mColor = m.statut === "termine" ? "var(--green)" : "var(--orange,#f97316)";
                            cardH += '<div style="padding:2px 0;display:flex;gap:6px;align-items:baseline"><span style="color:' + mColor + ';font-weight:600">' + (m.statut === "termine" ? "✓" : "○") + '</span><span>' + esc(m.description || "") + '</span></div>';
                        });
                        cardH += '</div>';
                    }
                    cardH += '</div>';
                    if (resultEl) resultEl.insertAdjacentHTML("beforeend", cardH);
                });
                if (resultEl) {
                    resultEl.querySelectorAll(".ai-btn-accept[data-gidx]").forEach(function(btn) {
                        if (btn._wired) return; btn._wired = true;
                        btn.onclick = function() { _acceptGlobalItem(fwId, parseInt(btn.getAttribute("data-gidx"))); };
                    });
                    resultEl.querySelectorAll(".ai-btn-ignore[data-gidx]").forEach(function(btn) {
                        if (btn._wired) return; btn._wired = true;
                        btn.onclick = function() {
                            var card = document.getElementById("ai-global-card-" + btn.getAttribute("data-gidx"));
                            if (card) { card.style.opacity = "0.3"; card.style.pointerEvents = "none"; }
                        };
                    });
                    resultEl.scrollTop = resultEl.scrollHeight;
                }
            } catch (e) {
                if (resultEl) resultEl.insertAdjacentHTML("beforeend", '<p style="color:var(--red);font-size:0.85em">Error: ' + esc(e.message) + '</p>');
            }
        }

        if (stopBtn) stopBtn.style.display = "none";
        if (runBtn) runBtn.disabled = false;

        if (_globalUpdates.length > 0 && resultEl) {
            var footerH = '<div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border)">';
            footerH += '<span class="fs-sm text-muted">' + t("ai.global_results", {n: _globalUpdates.length}) + (_globalAbort ? ' (' + t("ai.stopped") + ')' : '') + '</span>';
            footerH += '<div style="margin-top:8px"><label class="settings-label fs-xs">' + t("ai.refine_label") + '</label>';
            footerH += '<div style="display:flex;gap:8px"><input type="text" id="ai-refine-input" class="settings-input" style="flex:1" placeholder="' + esc(t("ai.refine_placeholder")) + '" />';
            footerH += '<button class="ai-btn-accept" id="ai-refine-run">' + t("ai.refine_run") + '</button></div></div>';
            footerH += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">';
            footerH += '<button class="ai-btn-accept" id="ai-global-accept-all">' + t("ai.accept_all") + '</button>';
            footerH += '<button class="ai-btn-close" id="ai-global-cancel">' + t("ai.close") + '</button>';
            footerH += '</div></div>';
            resultEl.insertAdjacentHTML("beforeend", footerH);
            document.getElementById("ai-global-cancel").onclick = _aiClosePanel;
            document.getElementById("ai-global-accept-all").onclick = function() {
                _globalUpdates.forEach(function(u, i) { _acceptGlobalItem(fwId, i); });
            };
            document.getElementById("ai-refine-run").onclick = function() {
                var refineText = document.getElementById("ai-refine-input").value.trim();
                if (!refineText) return;
                document.getElementById("ai-global-custom").value = refineText;
                _runGlobalCustom();
            };
        }
    }

    function _applyGlobalUpdates(fwId, updates) {
        _saveState();
        var exigs = _getExigences(fwId);
        var applied = 0;
        updates.forEach(function(u) {
            if (!u.ref) return;
            var idx = exigs.findIndex(function(e) { return _getExigRef(fwId, e) === u.ref; });
            if (idx < 0) return;
            var entry = _getExigEntry(fwId, idx);
            if (u.conformite) entry.conformite = u.conformite;
            if (u.ecart !== undefined) entry.ecart = u.ecart;
            applied++;
        });
        _autoSave();
        _aiClosePanel();
        if (typeof _renderFwView === "function") _renderFwView(fwId, "exigences");
        showStatus(t("ai.global_applied", {n: applied}));
    }

    // ═══════════════════════════════════════════════════════════════════
    // INJECT AI BUTTONS (only if AI enabled)
    // ═══════════════════════════════════════════════════════════════════

    var _origRenderFwExigences = _renderFwExigences;
    _renderFwExigences = function(fwId, label) {
        _origRenderFwExigences(fwId, label);
        if (!_aiIsEnabled()) return;

        // Global AI button next to the h2 in #fw-content
        var container = document.getElementById("fw-content");
        if (container) {
            var h2 = container.querySelector("h2");
            if (h2 && !container.querySelector(".ai-btn-global")) {
                var wrapper = document.createElement("div");
                wrapper.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:16px";
                h2.parentNode.insertBefore(wrapper, h2);
                wrapper.appendChild(h2);
                var globalBtn = document.createElement("button");
                globalBtn.className = "btn-add fs-xs ai-btn-global";
                globalBtn.innerHTML = "✨ " + t("ai.global_btn");
                globalBtn.setAttribute("data-click", "aiGlobalAnalysis");
                globalBtn.setAttribute("data-args", JSON.stringify([fwId]));
                wrapper.appendChild(globalBtn);
            }
        }

        // Per-requirement AI buttons
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
        "ai.key_cleared": "Clé API supprimée",
        "ai.global_btn": "Analyse globale IA",
        "ai.global_title": "Analyse globale — Mise à jour des exigences",
        "ai.global_desc": "Collez du texte ou chargez un document (Word, Excel, TXT) décrivant vos pratiques de sécurité. L'assistant analysera le contenu et mettra à jour automatiquement la conformité des exigences du référentiel.",
        "ai.global_file": "Charger un document",
        "ai.global_text": "Ou collez le texte directement",
        "ai.global_text_placeholder": "Décrivez ici les pratiques de sécurité en place dans votre organisation (politiques, procédures, mesures techniques, organisationnelles...)...",
        "ai.global_run": "Analyser",
        "ai.global_results": "{n} exigences identifiées",
        "ai.global_apply": "Appliquer les {n} mises à jour",
        "ai.global_applied": "{n} exigences mises à jour",
        "ai.mode_conformity": "Évaluer la conformité",
        "ai.mode_custom": "Instruction personnalisée",
        "ai.global_stop": "Arrêter",
        "ai.stopped": "arrêté",
        "ai.batch_progress": "Analyse du lot {n}/{total}...",
        "ai.global_custom_placeholder": "Ex : « évalue la conformité par rapport à notre PSSI jointe » ou « propose des mesures pour toutes les exigences non conformes »",
        "ai.refine_label": "Ajuster les résultats :",
        "ai.refine_placeholder": "Ex : « sois plus strict » ou « ne propose que des mesures techniques »",
        "ai.refine_run": "Relancer"
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
        "ai.key_cleared": "API key cleared",
        "ai.global_btn": "Global AI Analysis",
        "ai.global_title": "Global Analysis — Requirements Update",
        "ai.global_desc": "Paste text or upload a document (Word, Excel, TXT) describing your security practices. The assistant will analyze the content and automatically update the compliance status of the framework requirements.",
        "ai.global_file": "Upload a document",
        "ai.global_text": "Or paste text directly",
        "ai.global_text_placeholder": "Describe your organization's security practices (policies, procedures, technical and organizational controls...)...",
        "ai.global_run": "Analyze",
        "ai.global_results": "{n} requirements identified",
        "ai.global_apply": "Apply {n} updates",
        "ai.global_applied": "{n} requirements updated",
        "ai.mode_conformity": "Evaluate compliance",
        "ai.mode_custom": "Custom instruction",
        "ai.global_stop": "Stop",
        "ai.stopped": "stopped",
        "ai.batch_progress": "Analyzing batch {n}/{total}...",
        "ai.global_custom_placeholder": "E.g. \"evaluate compliance against our attached security policy\" or \"suggest controls for all non-compliant requirements\"",
        "ai.refine_label": "Refine results:",
        "ai.refine_placeholder": "E.g. \"be more strict\" or \"only suggest technical controls\"",
        "ai.refine_run": "Rerun"
    });

})();
