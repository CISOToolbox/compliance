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
    // PROMPTS — system prompts (the compliance methodology) live server-side
    // in compliance/src/routes/ai.py (_compliance_system). The frontend
    // builds the per-feature user prompt and POSTs it with a `kind`
    // discriminator to POST /api/ai/compliance/suggest, which owns the
    // methodology. The opensource (browser-local) build keeps the system
    // prompts here instead.
    // ═══════════════════════════════════════════════════════════════════

    // Backend deployment: POST the per-feature user prompt to the business
    // endpoint. `kind` selects the server-side system prompt
    // (suggest / global / scope). Returns the parsed JSON result.
    // FEAT-41 — the server re-reads the project from the database and composes
    // the prompt (src/ai_prompts.py). The frontend only declares what it
    // wants. The dropped document is the only data still uploaded: it exists
    // nowhere else than in this browser.
    interface ComplianceAsk {
        kind: string;
        framework: string;
        index?: number;
        refs?: string[];
        custom_instruction?: string;
        include_existing_measures?: boolean;
        document?: string;
        batch_num?: number;
        total_batches?: number;
        instruction?: string;
    }

    async function _callComplianceAI(ask: ComplianceAsk): Promise<any> {
        var projectId = window._getActiveProjectId ? window._getActiveProjectId() : null;
        if (!projectId) throw new Error(t("ai.no_project"));
        var resp = await fetch("api/ai/compliance/suggest", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                kind: ask.kind,
                project_id: projectId,
                framework: ask.framework,
                language: _locale === "en" ? "en" : "fr",
                index: ask.index === undefined ? null : ask.index,
                refs: ask.refs || null,
                document: ask.document || null,
                batch_num: ask.batch_num || 1,
                total_batches: ask.total_batches || 1,
                instruction: ask.instruction || null,
                custom_instruction: ask.custom_instruction || null,
                include_existing_measures: ask.include_existing_measures !== false
            })
        });
        if (!resp.ok) {
            var errTxt = await resp.text();
            var detail = errTxt.substring(0, 300);
            try { var jj = JSON.parse(errTxt); if (jj && jj.detail) detail = jj.detail; } catch (_) {}
            throw new Error(detail);
        }
        var data = await resp.json();
        return data.result;
    }

    // FEAT-41 — _buildUserPrompt moved to src/ai_prompts.py::build_suggest.

    /** What _mergeDetails will actually add: "" if nothing changes. */
    function _detailsAddition(ancien: string, ajout: string): string {
        var a = (ancien || "").trim();
        var b = (ajout || "").trim();
        if (!b) return "";
        if (a && a.indexOf(b) !== -1) return "";
        return b;
    }

    /** FEAT-40 — preview of what accepting will write into the target measure.
     *  Without it, the card shows the proposed fragment and the user cannot
     *  tell whether it completes or overwrites, nor what the title becomes. */
    function _enrichPreviewHTML(s: ComplianceAiSuggestion): string {
        if (!s || !s.id || (s.action !== "enrich" && s.action !== "link")) return "";
        var cible = D.mesures.find(function(m) { return m.id === s.id; }) as any;
        if (!cible) return "";
        var h = '<div class="ai-diff ct-mb-2 ct-p-2 ct-r-md" style="background:var(--ct-bg-alt)">';
        h += '<div class="ct-text-label ct-strong ct-mb-1">'
           + esc(t(s.action === "link" ? "ai.preview.link" : "ai.preview.title")) + '</div>';
        h += '<div class="ct-text-label ct-muted">' + esc(cible.id + " — " + (cible.description || "")) + '</div>';
        if (s.action === "link") { return h + '</div>'; }

        var nouveau = (s.description || "").trim();
        if (nouveau && nouveau !== cible.description) {
            h += '<div class="ct-text-label ct-muted ct-mt-1">' + esc(t("ai.preview.name")) + '</div>';
            h += '<div class="ct-text-label"><s class="ct-muted">' + esc(cible.description || "") + '</s></div>';
            h += '<div class="ct-text-label ct-strong">' + esc(nouveau) + '</div>';
        } else {
            h += '<div class="ct-text-label ct-muted ct-mt-1">' + esc(t("ai.preview.name_kept")) + '</div>';
        }
        if (s.details) {
            var ajout = _detailsAddition(cible.details || "", s.details);
            h += '<div class="ct-text-label ct-muted ct-mt-2">' + esc(t("ai.preview.details")) + '</div>';
            if (cible.details) h += '<div class="ct-text-label ct-muted">' + esc(cible.details) + '</div>';
            h += ajout
                ? '<div class="ct-text-label ct-text-ok ct-strong">+ ' + esc(ajout) + '</div>'
                : '<div class="ct-text-label ct-muted"><em>' + esc(t("ai.preview.no_change")) + '</em></div>';
        }
        return h + '</div>';
    }

    /** FEAT-40 — extends a description without overwriting the existing one. */
    function _mergeDetails(ancien: string, ajout: string): string {
        var a = (ancien || "").trim();
        var b = (ajout || "").trim();
        if (!a) return b;
        if (!b || a.indexOf(b) !== -1) return a;
        return a + "\n\n" + b;
    }

    // ═══════════════════════════════════════════════════════════════════
    // MAIN ENTRY POINT
    // ═══════════════════════════════════════════════════════════════════

    window.aiSuggestControls = function(fwId: string, idx: number) {
        if (!window._aiIsEnabled!()) return;
        var exigs = _getExigences(fwId);
        var exig = exigs[idx] || {};
        var ref = _getExigRef(fwId, exig);
        var panelTitle = "✨ AI — " + ref;

        // Show prompt panel — user chooses between auto-suggest or custom instruction
        var pp = window._aiEnsurePanel!();
        // shared d.ts: _aiOpenPanel declared () => void but the impl accepts an optional title
        (window._aiOpenPanel as (title?: string) => void)(panelTitle);
        pp.body.innerHTML =
            '<p class="fs-sm ct-mb-4 ct-muted">' + t("ai.prompt_intro") + '</p>' +
            // FEAT-40 — checked by default: the normal case is not wanting a
            // duplicate. The option serves the exception.
            '<label class="ct-flex ct-items-start ct-gap-2 ct-mb-4 ct-clickable">'
              + '<input type="checkbox" id="ai-include-measures" class="ct-mt-1" checked>'
              + '<span class="fs-sm"><strong>' + esc(t("ai.include_measures")) + '</strong>'
              + '<br><span class="ct-muted">' + esc(t("ai.include_measures_help")) + '</span></span>'
              + '</label>' +
            '<button class="ct-btn ai-btn-accept ct-w-full ct-p-2 ct-text-data ct-mb-4" data-variant="primary" id="ai-auto-suggest">' + t("ai.auto_suggest") + '</button>' +
            '<div class="settings-label fs-sm ct-mb-1">' + t("ai.custom_instruction_label") + '</div>' +
            '<textarea id="ai-custom-instruction" class="w-full ct-bordered ct-r-md ct-p-2 ct-text-meta ct-resize-y" rows="4" placeholder="' + esc(t("ai.custom_instruction_placeholder")) + '"></textarea>' +
            '<button class="ct-btn ai-btn-accept ct-journal-body ct-p-2 ct-text-data ct-mt-2 ct-bg-accent" data-variant="primary" id="ai-send-custom">' + t("ai.send_instruction") + '</button>';
        pp.footer.innerHTML = '<button class="ct-btn ai-btn-close" id="ai-prompt-close">' + t("ai.close") + '</button>';

        document.getElementById("ai-prompt-close")!.onclick = window._aiClosePanel!;
        document.getElementById("ai-auto-suggest")!.onclick = function() {
            _runComplianceSuggest(fwId, idx, "", _includeMeasures());
        };
        document.getElementById("ai-send-custom")!.onclick = function() {
            var textarea = document.getElementById("ai-custom-instruction") as HTMLTextAreaElement | null;
            // The checkbox is read NOW: _aiShowLoading will clear the panel.
            _runComplianceSuggest(fwId, idx, textarea ? textarea.value.trim() : "", _includeMeasures());
        };
    };

    function _includeMeasures(): boolean {
        var el = document.getElementById("ai-include-measures") as HTMLInputElement | null;
        return el ? el.checked : true;
    }

    async function _runComplianceSuggest(fwId: string, idx: number, customInstruction: string,
                                         avecMesures?: boolean) {
        var exigs = _getExigences(fwId);
        var exig = exigs[idx] || {};
        var ref = _getExigRef(fwId, exig);

        window._aiShowLoading!("✨ AI — " + ref);

        try {
            var parsed = await _callComplianceAI({ kind: "suggest", framework: fwId, index: idx,
                custom_instruction: customInstruction || undefined,
                include_existing_measures: avecMesures !== false });
            var suggestions = Array.isArray(parsed) ? parsed : [parsed];
            window._aiRenderCards!({
                suggestions: suggestions,
                title: "✨ AI — " + ref,
                extraHTML: '<div class="ct-mt-2"><label class="settings-label fs-xs">' + t("ai.refine_label") + '</label>' +
                    '<div class="ct-flex ct-gap-2"><input type="text" id="ai-suggest-refine" class="settings-input ct-flex-1" placeholder="' + esc(t("ai.refine_placeholder")) + '" />' +
                    '<button class="ct-btn ai-btn-accept" data-variant="primary" id="ai-suggest-refine-run">' + t("ai.refine_run") + '</button></div></div>',
                onRendered: function() {
                    var rb = document.getElementById("ai-suggest-refine-run");
                    if (rb) rb.onclick = function() {
                        var rt = (document.getElementById("ai-suggest-refine") as HTMLInputElement).value.trim();
                        if (rt) _runComplianceSuggest(fwId, idx, rt);
                    };
                },
                renderCard: function(s: ComplianceAiSuggestion) {
                    return _enrichPreviewHTML(s) +
                        '<div class="ai-card-title">' + esc(s.description || "") + '</div>' +
                        (s.details ? '<div class="ai-card-details">' + esc(s.details) + '</div>' : '') +
                        '<div class="ai-card-meta">' +
                            (s.statut === "termine" ? '<span class="ct-text-low ct-strong">✓ ' + _statutLabel("termine") + '</span>' : '<span class="ct-text-high">○ ' + _statutLabel("planifie") + '</span>') +
                            (s.responsable ? ' · ' + t("ai.owner") + ': ' + esc(s.responsable) : '') +
                        '</div>';
                },
                onAccept: function(s: ComplianceAiSuggestion) {
                    _saveState();
                    var entry = _getExigEntry(fwId, idx);
                    var id!: string;
                    var isUpdate = false;

                    // FEAT-40 — three possible outcomes, and two of them create
                    // nothing:
                    //   link   : the existing measure already covers the
                    //            requirement, it just has to be attached to it;
                    //   enrich : it covers it partially — we EXTEND its
                    //            description without overwriting what is
                    //            already written;
                    //   new    : nothing existing fits.
                    // Overwriting `description` on an enrichment would lose the
                    // label under which the measure is known everywhere else.
                    if (s.id && (s.action === "link" || s.action === "enrich" || !s.action)) {
                        var existing = D.mesures.find(function(m) { return m.id === s.id; }) as any;
                        if (existing) {
                            isUpdate = true;
                            id = s.id;
                            if (s.action === "enrich") {
                                if (s.details) existing.details = _mergeDetails(existing.details || "", s.details);
                                // Title adjusted ONLY if the model proposes a
                                // different one: it is under this label that the
                                // measure appears on every requirement it covers.
                                var nt = (s.description || "").trim();
                                if (nt && nt !== existing.description) existing.description = nt;
                                if (!existing.responsable && s.responsable) existing.responsable = s.responsable;
                            } else if (!s.action) {
                                // Legacy format (no discriminant): previous behavior.
                                if (s.description) existing.description = s.description;
                                if (s.details) existing.details = s.details;
                                if (s.responsable) existing.responsable = s.responsable;
                            }
                            // `link` touches nothing: the attachment to the
                            // requirement is done below, for all three cases.
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
                        _persist("control", entry.id!, { mesures_ids: entry.mesures_ids });
                    } else {
                        // Attach the existing measure to the requirement being
                        // handled: that is the WHOLE point of `link` and
                        // `enrich`. Without that attachment, accepting the
                        // suggestion produces nothing visible and the user
                        // re-creates a measure by hand — the duplicate comes
                        // back through the back door.
                        if (!entry.mesures_ids) entry.mesures_ids = [];
                        if (entry.mesures_ids.indexOf(id) === -1) {
                            entry.mesures_ids.push(id);
                            _persist("control", entry.id!, { mesures_ids: entry.mesures_ids });
                        }
                        // We persist the MERGED value, not the fragment
                        // returned by the model.
                        var maj = D.mesures.find(function(m) { return m.id === id; }) as any;
                        if (maj) _persist("measure", id, { description: maj.description,
                                                          details: maj.details,
                                                          responsable: maj.responsable });
                    }

                    showStatus(isUpdate ? t("ai.control_updated", {id: id}) : t("ai.control_created", {id: id}));
                },
                onChange: function() {
                    // Refresh the exigences view behind the AI panel so the linked
                    // measure appears immediately when the panel is closed
                    if (typeof _renderFwView === "function") _renderFwView(fwId, "exigences");
                }
            });
        } catch (e: any) {
            var p = window._aiEnsurePanel!();
            p.title.textContent = "✨ AI — " + ref;
            p.body.innerHTML =
                '<div class="ai-error">' + esc(t("ai.error", { msg: e.message })) + '</div>';
            p.footer.innerHTML = '';
            window._aiOpenPanel!();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GLOBAL AI: BULK UPDATE FROM DOCUMENT / TEXT
    // ═══════════════════════════════════════════════════════════════════

    var _globalFwId = "";

    window.aiGlobalAnalysis = function(fwId: string) {
        if (!window._aiIsEnabled!()) { window.openSettings!(); return; }
        _globalFwId = fwId;
        _globalAbort = false;
        var p = window._aiEnsurePanel!();
        p.title.textContent = "✨ " + t("ai.global_title");
        var h = '<p class="fs-sm ct-mb-3">' + t("ai.global_desc") + '</p>';

        // Mode selection
        h += '<div class="ct-flex ct-gap-2 ct-mb-4">';
        h += '<button class="ct-btn ai-btn-accept ct-flex-1 ct-p-2" data-variant="primary" id="ai-mode-conformity">' + t("ai.mode_conformity") + '</button>';
        h += '<button class="ct-btn ai-btn-accept ct-flex-1 ct-p-2 ct-bg-accent" data-variant="primary" id="ai-mode-custom">' + t("ai.mode_custom") + '</button>';
        h += '</div>';

        // Conformity mode: file upload + text
        h += '<div id="ai-conformity-section" class="ct-hidden">';
        h += '<div class="ct-mb-3"><label class="settings-label">' + t("ai.global_file") + '</label>';
        h += '<input type="file" id="ai-global-file" accept=".docx,.xlsx,.xls,.txt,.csv,.md" class="settings-input ct-font-inherit"></div>';
        h += '<div id="ai-global-file-info" class="fs-xs text-muted ct-mb-2"></div>';
        h += '<label class="settings-label">' + t("ai.global_text") + '</label>';
        h += '<textarea id="ai-global-text" rows="6" class="settings-input ct-w-full ct-font-inherit ct-text-meta" placeholder="' + t("ai.global_text_placeholder") + '"></textarea>';
        h += '<div class="ct-flex ct-gap-2 ct-mt-2">';
        h += '<button class="ct-btn ai-btn-accept" data-variant="primary" id="ai-global-run">' + t("ai.global_run") + '</button>';
        h += '<button class="ct-btn ai-btn-close ct-hidden" id="ai-global-stop">' + t("ai.global_stop") + '</button>';
        h += '</div></div>';

        // Custom mode: instruction textarea
        h += '<div id="ai-custom-section" class="ct-hidden">';
        h += '<label class="settings-label">' + t("ai.custom_instruction_label") + '</label>';
        h += '<textarea id="ai-global-custom" rows="4" class="settings-input ct-w-full ct-font-inherit ct-text-meta" placeholder="' + esc(t("ai.global_custom_placeholder")) + '"></textarea>';
        h += '<div class="ct-flex ct-gap-2 ct-mt-2">';
        h += '<button class="ct-btn ai-btn-accept" data-variant="primary" id="ai-custom-run">' + t("ai.send_instruction") + '</button>';
        h += '<button class="ct-btn ai-btn-close ct-hidden" id="ai-custom-stop">' + t("ai.global_stop") + '</button>';
        h += '</div></div>';

        h += '<div id="ai-global-result"></div>';
        p.body.innerHTML = h;
        p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        window._aiOpenPanel!();

        // Mode toggle
        document.getElementById("ai-mode-conformity")!.onclick = function() {
            document.getElementById("ai-conformity-section")!.style.display = "";
            document.getElementById("ai-custom-section")!.style.display = "none";
            (this as HTMLElement).style.outline = "2px solid var(--ct-ink)";
            document.getElementById("ai-mode-custom")!.style.outline = "";
        };
        document.getElementById("ai-mode-custom")!.onclick = function() {
            document.getElementById("ai-conformity-section")!.style.display = "none";
            document.getElementById("ai-custom-section")!.style.display = "";
            (this as HTMLElement).style.outline = "2px solid var(--ct-ink)";
            document.getElementById("ai-mode-conformity")!.style.outline = "";
        };

        (document.getElementById("ai-global-file") as HTMLInputElement).onchange = function(e) {
            var file = (e.target as HTMLInputElement).files![0];
            if (!file) return;
            _parseGlobalFile(file);
        };
        document.getElementById("ai-global-run")!.onclick = function() { _runGlobalAnalysisBatched(); };
        document.getElementById("ai-custom-run")!.onclick = function() { _runGlobalCustom(); };
        document.getElementById("ai-global-stop")!.onclick = function() {
            _globalAbort = true;
            (this as HTMLButtonElement).disabled = true;
            (this as HTMLButtonElement).textContent = t("ai.stopped");
            var r = document.getElementById("ai-global-run") as HTMLButtonElement | null;
            if (r) r.disabled = false;
        };
        document.getElementById("ai-custom-stop")!.onclick = function() {
            _globalAbort = true;
            (this as HTMLButtonElement).disabled = true;
            (this as HTMLButtonElement).textContent = t("ai.stopped");
            var r = document.getElementById("ai-custom-run") as HTMLButtonElement | null;
            if (r) r.disabled = false;
        };
    };

    function _parseGlobalFile(file: File) {
        var info = document.getElementById("ai-global-file-info");
        var textarea = document.getElementById("ai-global-text") as HTMLTextAreaElement;
        var ext = file.name.split(".").pop()!.toLowerCase();

        if (ext === "txt" || ext === "md" || ext === "csv") {
            var reader = new FileReader();
            reader.onload = function() {
                textarea.value = (reader.result as string).substring(0, 50000);
                if (info) info.textContent = file.name + " (" + Math.round(file.size / 1024) + " Ko)";
            };
            reader.readAsText(file);
        } else if (ext === "docx") {
            var reader = new FileReader();
            reader.onload = function() {
                _extractDocxText(reader.result as ArrayBuffer).then(function(text) {
                    textarea.value = text.substring(0, 50000);
                    if (info) info.textContent = file.name + " (" + Math.round(text.length / 1024) + " Ko texte)";
                }).catch(function(err: any) {
                    if (info) info.textContent = "Erreur: " + err.message;
                });
            };
            reader.readAsArrayBuffer(file);
        } else if (ext === "xlsx" || ext === "xls") {
            var reader = new FileReader();
            reader.onload = function() {
                _extractExcelText(reader.result as ArrayBuffer).then(function(text) {
                    textarea.value = text.substring(0, 50000);
                    if (info) info.textContent = file.name + " (" + Math.round(text.length / 1024) + " Ko texte)";
                }).catch(function(err: any) {
                    if (info) info.textContent = "Erreur: " + err.message;
                });
            };
            reader.readAsArrayBuffer(file);
        } else {
            if (info) info.textContent = "Format non supporté: " + ext;
        }
    }

    async function _extractDocxText(buffer: ArrayBuffer) {
        if (typeof JSZip === "undefined") {
            // JSZip 3.10.1, vendored under js/vendor/ — same-origin, so the
            // module's CSP keeps script-src 'self' with no CDN entry.
            await _loadScript("js/vendor/jszip.min.js");
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

    async function _extractExcelText(buffer: ArrayBuffer) {
        if (typeof ExcelJS === "undefined") {
            // ExcelJS 4.4.0, vendored under js/vendor/ — same-origin (see above).
            await _loadScript("js/vendor/exceljs.min.js");
        }
        var wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        var lines: string[] = [];
        wb.eachSheet(function(ws) {
            ws.eachRow(function(row) {
                var cells: string[] = [];
                row.eachCell(function(cell) { cells.push(String(cell.value || "")); });
                lines.push(cells.join(" | "));
            });
        });
        return lines.join("\n");
    }

    function _loadScript(url: string, opts?: { integrity?: string; crossOrigin?: string }) {
        return new Promise<void>(function(resolve, reject) {
            if (document.querySelector('script[src="' + url + '"]')) { resolve(); return; }
            var s = document.createElement("script");
            s.src = url;
            // Subresource Integrity: a tampered/MITM'd CDN response fails the
            // hash check and is blocked (CDN-supplied libs must be pinned).
            if (opts && opts.integrity) { s.integrity = opts.integrity; s.crossOrigin = opts.crossOrigin || "anonymous"; }
            s.onload = function() { resolve(); };
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    var _globalAbort = false;
    var _BATCH_SIZE = 10;

    var _globalUpdates: ComplianceAiGlobalUpdate[] = [];

    async function _runGlobalAnalysisBatched() {
        var text = (document.getElementById("ai-global-text") as HTMLTextAreaElement).value.trim();
        if (!text) return;
        var fwId = _globalFwId;
        var exigs = _getExigences(fwId);
        if (!exigs || exigs.length === 0) return;

        _globalAbort = false;
        _globalUpdates = [];
        var stopBtn = document.getElementById("ai-global-stop");
        var runBtn = document.getElementById("ai-global-run") as HTMLButtonElement | null;
        if (stopBtn) stopBtn.style.display = "";
        if (runBtn) runBtn.disabled = true;

        var resultEl = document.getElementById("ai-global-result");
        if (resultEl) resultEl.innerHTML = '';

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
                    '<div class="ai-card ct-bg-info-tint ct-p-2 ct-mb-2"><span class="fs-sm">' +
                    t("ai.batch_progress", {n: batchNum, total: totalBatches}) + '</span></div>');
                resultEl.scrollTop = resultEl.scrollHeight;
            }


            try {
                var updates = await _callComplianceAI({ kind: "global", framework: fwId,
                    refs: batch.map(function(e) { return e.ref; }),
                    document: text, batch_num: batchNum, total_batches: totalBatches });
                if (!Array.isArray(updates)) continue;

                updates.forEach(function(u: ComplianceAiGlobalUpdate) {
                    var gIdx = updateIdx++;
                    _globalUpdates.push(u);
                    var isOK = (u.status || "").toUpperCase() === "OK";
                    // Tone as a CLASS, not a built style attribute. The value was already
                    // a choice between two literals — no AI data ever reached the
                    // attribute — but a scanner cannot see that through a
                    // concatenated style=, and the project styles with classes.
                    var toneCls = isOK ? "ct-text-low" : "ct-text-critical";

                    var cardH = '<div class="ai-card ct-p-2 ct-mb-1 ct-bordered ct-r-md" id="ai-global-card-' + gIdx + '">';
                    cardH += '<div class="ct-flex ct-gap-2 ct-items-center ct-mb-1">';
                    cardH += '<span class="ct-strong ct-minw-80">' + esc(u.ref || "") + '</span>';
                    cardH += '<span class="ct-strong ct-text-section ' + toneCls + '">' + esc(u.status || "") + '</span>';
                    cardH += '<span class="ct-flex-1"></span>';
                    cardH += '<button class="ct-btn ai-btn-accept ct-py-1 ct-px-2 ct-text-label" data-variant="primary" data-gidx="' + gIdx + '">' + t("ai.accept") + '</button>';
                    cardH += '<button class="ct-btn ai-btn-ignore ct-py-1 ct-px-2 ct-text-label" data-gidx="' + gIdx + '">' + t("ai.ignore") + '</button>';
                    cardH += '</div>';
                    if (u.ecart) cardH += '<div class="fs-xs ct-muted ct-mb-1">' + esc(u.ecart) + '</div>';
                    if (u.mesures && u.mesures.length) {
                        cardH += '<div class="fs-xs ct-mt-1">';
                        u.mesures.forEach(function(m) {
                            var mToneCls = m.statut === "termine" ? "ct-text-low" : "ct-text-high";
                            cardH += '<div class="ct-py-1 ct-flex ct-gap-1 ct-items-baseline"><span class="ct-strong ' + mToneCls + '">' + (m.statut === "termine" ? "✓" : "○") + '</span><span>' + esc(m.description || "") + '</span></div>';
                        });
                        cardH += '</div>';
                    }
                    cardH += '</div>';
                    if (resultEl) resultEl.insertAdjacentHTML("beforeend", cardH);
                });
                // Wire accept/ignore buttons for this batch
                if (resultEl) {
                    resultEl.querySelectorAll<HTMLButtonElement>(".ai-btn-accept[data-gidx]").forEach(function(btn) {
                        if ((btn as any)._wired) return;
                        (btn as any)._wired = true;
                        btn.onclick = function() { _acceptGlobalItem(fwId, parseInt(btn.getAttribute("data-gidx")!)); };
                    });
                    resultEl.querySelectorAll<HTMLButtonElement>(".ai-btn-ignore[data-gidx]").forEach(function(btn) {
                        if ((btn as any)._wired) return;
                        (btn as any)._wired = true;
                        btn.onclick = function() {
                            var card = document.getElementById("ai-global-card-" + btn.getAttribute("data-gidx"));
                            if (card) { card.style.opacity = "0.3"; card.style.pointerEvents = "none"; }
                        };
                    });
                    resultEl.scrollTop = resultEl.scrollHeight;
                }
            } catch (e: any) {
                if (resultEl) resultEl.insertAdjacentHTML("beforeend", '<p class="ai-error ct-text-meta ct-mt-2 ct-mb-2">' + esc(t("ai.error", { msg: "Batch " + batchNum + " — " + e.message })) + '</p>');
            }
        }

        if (stopBtn) stopBtn.style.display = "none";
        if (runBtn) runBtn.disabled = false;

        if (_globalUpdates.length > 0 && resultEl) {
            var footerH = '<div style="display:flex;gap:var(--ct-s2);justify-content:flex-end;margin-top:var(--ct-s3);padding-top:8px;border-top:1px solid var(--ct-line)">';
            footerH += '<span class="fs-sm text-muted ct-flex-1">' + t("ai.global_results", {n: _globalUpdates.length}) + (_globalAbort ? ' (' + t("ai.stopped") + ')' : '') + '</span>';
            footerH += '<button class="ct-btn ai-btn-accept" data-variant="primary" id="ai-global-accept-all">' + t("ai.accept_all") + '</button>';
            footerH += '<button class="ct-btn ai-btn-close" id="ai-global-cancel">' + t("ai.close") + '</button>';
            footerH += '</div>';
            resultEl.insertAdjacentHTML("beforeend", footerH);
            document.getElementById("ai-global-cancel")!.onclick = window._aiClosePanel!;
            document.getElementById("ai-global-accept-all")!.onclick = function() {
                _globalUpdates.forEach(function(u, i) { _acceptGlobalItem(fwId, i); });
            };
        }
    }

    function _acceptGlobalItem(fwId: string, gIdx: number) {
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
                // FEAT-40 — reuse before creating, here too: document analysis
                // proposed measures without ever looking at the plan, and
                // created one per requirement handled.
                if (m.action === "link" || m.action === "enrich") {
                    var dejaM = D.mesures.find(function(x) { return x.id === m.id; }) as any;
                    if (dejaM) {
                        if (m.action === "enrich" && m.details) {
                            dejaM.details = _mergeDetails(dejaM.details || "", m.details);
                            var ntg = (m.description || "").trim();
                            if (ntg && ntg !== dejaM.description) dejaM.description = ntg;
                            _persist("measure", dejaM.id, { description: dejaM.description,
                                                            details: dejaM.details });
                        }
                        if (entry.mesures_ids!.indexOf(dejaM.id) === -1) {
                            entry.mesures_ids!.push(dejaM.id);
                        }
                        return;
                    }
                }
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
                entry.mesures_ids!.push(id);
                _persistCreate("measure", newMesure);
            });
            if (mesures.length && entry.id) {
                _persist("control", entry.id!, { mesures_ids: entry.mesures_ids });
            }
            if (!entry.id) _autoSave();
        }

        var card = document.getElementById("ai-global-card-" + gIdx);
        if (card) {
            card.style.opacity = "0.4";
            card.querySelector<HTMLButtonElement>(".ai-btn-accept")!.textContent = "✓";
            card.querySelector<HTMLButtonElement>(".ai-btn-accept")!.disabled = true;
            card.querySelector<HTMLElement>(".ai-btn-ignore")!.style.display = "none";
        }
        if (typeof _renderFwView === "function") _renderFwView(fwId, "exigences");
    }

    async function _runGlobalCustom() {
        var instruction = (document.getElementById("ai-global-custom") as HTMLTextAreaElement).value.trim();
        if (!instruction) return;
        var fwId = _globalFwId;
        var exigs = _getExigences(fwId);
        if (!exigs || exigs.length === 0) return;

        _globalAbort = false;
        var stopBtn = document.getElementById("ai-custom-stop");
        var runBtn = document.getElementById("ai-custom-run") as HTMLButtonElement | null;
        if (stopBtn) stopBtn.style.display = "";
        if (runBtn) runBtn.disabled = true;

        var resultEl = document.getElementById("ai-global-result");
        if (resultEl) resultEl.innerHTML = '<p class="text-muted">' + t("ai.loading") + '</p>';

        // Step 1: ask the AI which exigences are affected by the instruction
        // Send all refs in a single lightweight call
        var exigSummary = exigs.map(function(e, i) {
            return { idx: i, ref: _getExigRef(fwId, e), theme: _rt(e, "thematique") || _rt(e, "theme") || "", mesure: (_rt(e, "mesure") || "").substring(0, 80), conformite: e.conformite || "", ecart: (e.ecart || "").substring(0, 60) };
        });


        var targetRefs: string[] | null = null;
        try {
            var scopeParsed = await _callComplianceAI({ kind: "scope", framework: fwId, instruction: instruction });
            if (Array.isArray(scopeParsed)) targetRefs = scopeParsed;
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
            var refSet: Record<string, boolean> = {};
            targetRefs.forEach(function(r) { refSet[String(r).trim()] = true; });
            filteredExigs = exigSummary.filter(function(e) { return refSet[e.ref]; });
            if (filteredExigs.length === 0) filteredExigs = exigSummary; // fallback
        }

        if (resultEl) resultEl.innerHTML = '<p class="fs-sm text-muted">' + t("ai.global_results", {n: filteredExigs.length}) + '</p>';

        // Step 2: process affected exigences — same OK/KO + measures pattern as conformity mode
        _globalUpdates = [];

        var batchSize = Math.max(_BATCH_SIZE, Math.min(filteredExigs.length, 50));
        var updateIdx = 0;
        for (var b = 0; b < filteredExigs.length; b += batchSize) {
            if (_globalAbort) break;
            var batch = filteredExigs.slice(b, b + batchSize);
            var batchNum = Math.floor(b / batchSize) + 1;
            var totalBatches = Math.ceil(filteredExigs.length / batchSize);

            if (totalBatches > 1 && resultEl) {
                resultEl.insertAdjacentHTML("beforeend",
                    '<div class="ai-card ct-bg-info-tint ct-p-2 ct-mb-2"><span class="fs-sm">' +
                    t("ai.batch_progress", {n: batchNum, total: totalBatches}) + '</span></div>');
                resultEl.scrollTop = resultEl.scrollHeight;
            }

            try {
                // Custom mode: free-form instruction confronted with the
                // current compliance state, not with a document
                // (build_global_custom).
                var updates = await _callComplianceAI({ kind: "global_custom", framework: fwId,
                    refs: batch.map(function(e) { return e.ref; }), instruction: instruction });
                if (!Array.isArray(updates)) continue;

                updates.forEach(function(u: ComplianceAiGlobalUpdate) {
                    var gIdx = updateIdx++;
                    _globalUpdates.push(u);
                    var isOK = (u.status || "").toUpperCase() === "OK";
                    // Tone as a CLASS, not a built style attribute. The value was already
                    // a choice between two literals — no AI data ever reached the
                    // attribute — but a scanner cannot see that through a
                    // concatenated style=, and the project styles with classes.
                    var toneCls = isOK ? "ct-text-low" : "ct-text-critical";

                    var cardH = '<div class="ai-card ct-p-2 ct-mb-1 ct-bordered ct-r-md" id="ai-global-card-' + gIdx + '">';
                    cardH += '<div class="ct-flex ct-gap-2 ct-items-center ct-mb-1">';
                    cardH += '<span class="ct-strong ct-minw-80">' + esc(u.ref || "") + '</span>';
                    cardH += '<span class="ct-strong ct-text-section ' + toneCls + '">' + esc(u.status || "") + '</span>';
                    cardH += '<span class="ct-flex-1"></span>';
                    cardH += '<button class="ct-btn ai-btn-accept ct-py-1 ct-px-2 ct-text-label" data-variant="primary" data-gidx="' + gIdx + '">' + t("ai.accept") + '</button>';
                    cardH += '<button class="ct-btn ai-btn-ignore ct-py-1 ct-px-2 ct-text-label" data-gidx="' + gIdx + '">' + t("ai.ignore") + '</button>';
                    cardH += '</div>';
                    if (u.ecart) cardH += '<div class="fs-xs ct-muted ct-mb-1">' + esc(u.ecart) + '</div>';
                    if (u.mesures && u.mesures.length) {
                        cardH += '<div class="fs-xs ct-mt-1">';
                        u.mesures.forEach(function(m) {
                            var mToneCls = m.statut === "termine" ? "ct-text-low" : "ct-text-high";
                            cardH += '<div class="ct-py-1 ct-flex ct-gap-1 ct-items-baseline"><span class="ct-strong ' + mToneCls + '">' + (m.statut === "termine" ? "✓" : "○") + '</span><span>' + esc(m.description || "") + '</span></div>';
                        });
                        cardH += '</div>';
                    }
                    cardH += '</div>';
                    if (resultEl) resultEl.insertAdjacentHTML("beforeend", cardH);
                });
                if (resultEl) {
                    resultEl.querySelectorAll<HTMLButtonElement>(".ai-btn-accept[data-gidx]").forEach(function(btn) {
                        if ((btn as any)._wired) return; (btn as any)._wired = true;
                        btn.onclick = function() { _acceptGlobalItem(fwId, parseInt(btn.getAttribute("data-gidx")!)); };
                    });
                    resultEl.querySelectorAll<HTMLButtonElement>(".ai-btn-ignore[data-gidx]").forEach(function(btn) {
                        if ((btn as any)._wired) return; (btn as any)._wired = true;
                        btn.onclick = function() {
                            var card = document.getElementById("ai-global-card-" + btn.getAttribute("data-gidx"));
                            if (card) { card.style.opacity = "0.3"; card.style.pointerEvents = "none"; }
                        };
                    });
                    resultEl.scrollTop = resultEl.scrollHeight;
                }
            } catch (e: any) {
                if (resultEl) resultEl.insertAdjacentHTML("beforeend", '<p class="ai-error ct-text-meta ct-mt-2 ct-mb-2">' + esc(t("ai.error", { msg: e.message })) + '</p>');
            }
        }

        if (stopBtn) stopBtn.style.display = "none";
        if (runBtn) runBtn.disabled = false;

        if (_globalUpdates.length > 0 && resultEl) {
            var footerH = '<div style="margin-top:var(--ct-s3);padding-top:8px;border-top:1px solid var(--ct-line)">';
            footerH += '<span class="fs-sm text-muted">' + t("ai.global_results", {n: _globalUpdates.length}) + (_globalAbort ? ' (' + t("ai.stopped") + ')' : '') + '</span>';
            footerH += '<div class="ct-mt-2"><label class="settings-label fs-xs">' + t("ai.refine_label") + '</label>';
            footerH += '<div class="ct-flex ct-gap-2"><input type="text" id="ai-refine-input" class="settings-input ct-flex-1" placeholder="' + esc(t("ai.refine_placeholder")) + '" />';
            footerH += '<button class="ct-btn ai-btn-accept" data-variant="primary" id="ai-refine-run">' + t("ai.refine_run") + '</button></div></div>';
            footerH += '<div class="ct-flex ct-gap-2 ct-justify-end ct-mt-3">';
            footerH += '<button class="ct-btn ai-btn-accept" data-variant="primary" id="ai-global-accept-all">' + t("ai.accept_all") + '</button>';
            footerH += '<button class="ct-btn ai-btn-close" id="ai-global-cancel">' + t("ai.close") + '</button>';
            footerH += '</div></div>';
            resultEl.insertAdjacentHTML("beforeend", footerH);
            document.getElementById("ai-global-cancel")!.onclick = window._aiClosePanel!;
            document.getElementById("ai-global-accept-all")!.onclick = function() {
                _globalUpdates.forEach(function(u, i) { _acceptGlobalItem(fwId, i); });
            };
            document.getElementById("ai-refine-run")!.onclick = function() {
                var refineText = (document.getElementById("ai-refine-input") as HTMLInputElement).value.trim();
                if (!refineText) return;
                (document.getElementById("ai-global-custom") as HTMLTextAreaElement).value = refineText;
                _runGlobalCustom();
            };
        }
    }

    function _applyGlobalUpdates(fwId: string, updates: ComplianceAiGlobalUpdate[]) {
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
        window._aiClosePanel!();
        if (typeof _renderFwView === "function") _renderFwView(fwId, "exigences");
        showStatus(t("ai.global_applied", {n: applied}));
    }

    // ═══════════════════════════════════════════════════════════════════
    // INJECT AI BUTTONS (only if AI enabled)
    // ═══════════════════════════════════════════════════════════════════

    var _origRenderFwExigences = _renderFwExigences;
    // Reassigning a global declared with `function` (TS2630): we go through
    // window — strictly identical at runtime (global binding).
    (window as any)._renderFwExigences = function(fwId: string, label: string) {
        _origRenderFwExigences(fwId, label);
        if (!window._aiIsEnabled!()) return;

        // Global AI button next to the h2 in #fw-content
        var container = document.getElementById("fw-content");
        if (container) {
            var h2 = container.querySelector("h2");
            if (h2 && !container.querySelector(".ai-btn-global")) {
                var wrapper = document.createElement("div");
                wrapper.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:16px";
                h2.parentNode!.insertBefore(wrapper, h2);
                wrapper.appendChild(h2);
                var globalBtn = document.createElement("button");
                globalBtn.className = "ct-btn btn-ai ai-btn-global";
                globalBtn.innerHTML = "✨ " + t("ai.global_btn");
                globalBtn.setAttribute("data-click", "aiGlobalAnalysis");
                globalBtn.setAttribute("data-args", JSON.stringify([fwId]));
                wrapper.appendChild(globalBtn);
            }
        }

        // Per-requirement AI buttons
        document.querySelectorAll('[data-click="_proposerMesures"]').forEach(function(btn) {
            if (btn.nextElementSibling && btn.nextElementSibling.classList.contains("ai-btn-suggest")) return;
            var args = JSON.parse(btn.getAttribute("data-args")!);
            var aiBtn = document.createElement("button");
            aiBtn.className = "ct-btn btn-ai";
            aiBtn.setAttribute("data-size", "xs");
            aiBtn.textContent = "✨ AI";
            aiBtn.setAttribute("data-click", "aiSuggestControls");
            aiBtn.setAttribute("data-args", JSON.stringify(args));
            btn.parentElement!.appendChild(aiBtn);
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
