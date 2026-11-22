// FEAT-73 — automated monitoring, on screen.
//
// The server computes everything: proposals, results, validity, coverage,
// exclusion states, recurrence lock. This file shows what the API returns
// and sends the actions; it decides nothing. Two places:
//   - the measure window: its monitorings, what can be activated, run, stop;
//   - the "Automated monitoring" panel: connections, monitorings and their
//     history (findings, exclusions), exclusions, coverage of a framework.

type MonAny = any;

var _mon: {
    collectors: MonAny | null; connections: MonAny[]; monitors: MonAny[]; exclusions: MonAny[];
    newConnection: { provider: string; mode?: string; editing?: string } | null; openMonitor: string | null; openProof: string | null; versions: MonAny[];
    version: MonAny | null; excluding: string | null; excludeKind: string; coverageFw: string; coverage: MonAny | null;
    testResults: Record<string, MonAny>; testing: Record<string, boolean>; edits: Record<string, number>;
    error: string; running: Record<string, boolean>;
} = {
    collectors: null, connections: [], monitors: [], exclusions: [], newConnection: null, openMonitor: null, openProof: null,
    versions: [], version: null, excluding: null, excludeKind: "permanent", coverageFw: "", coverage: null,
    testResults: {}, testing: {}, edits: {}, error: "", running: {},
};

function _monT(key: string, params?: Record<string, string | number>) { return t("comp.mon." + key, params); }
function _monLang(): string { return _locale === "fr" ? "fr" : "en"; }
function _monText(obj: MonAny): string { return obj ? (obj[_monLang()] || obj.en || "") : ""; }

const _MON_RESULT_COLORS: Record<string, string> = { conforme: "green", non_conforme: "red", erreur: "yellow", sans_objet: "gray" };
function _monResultBadge(result: string | null | undefined): string {
    if (!result) return _tBadge(_monT("result.none"), "gray");
    return _tBadge(_monT("result." + result), _MON_RESULT_COLORS[result] || "gray");
}
function _monDate(iso: string | null | undefined): string { return iso ? esc(String(iso).replace("T", " ").substring(0, 16)) : "—"; }
function _monFail(err: MonAny) { if (typeof ct_changeFailed === "function") ct_changeFailed(err); }
/** A refused form says why, next to its fields, and keeps what was typed. */
function _monFormFail(slot: string) {
    return function(err: MonAny) {
        const el = document.getElementById(slot);
        if (el) el.textContent = String((err && err.detail) || t("chrome.save_failed")).substring(0, 300);
        else _monFail(err);
    };
}
function _monErrorSlot(id: string): string { return '<div id="' + id + '" class="fs-xs ct-text-critical" role="alert"></div>'; }

// ── The measure window ──────────────────────────────────────────────────

var _monMeasure: { mid: string; data: MonAny | null; stopping: string | null } = { mid: "", data: null, stopping: null };

/** Asked before the measure window opens: whether its recurrence is locked. */
function _monLoadMeasure(mid: string): Promise<MonAny | null> {
    if (!window.ComplianceAPI) return Promise.resolve(null);
    return window.ComplianceAPI.measureMonitoring(mid).then(function(d) {
        _monMeasure = { mid: mid, data: d, stopping: null };
        return d;
    }).catch(function() { _monMeasure = { mid: mid, data: null, stopping: null }; return null; });
}

function _monMeasureHtml(): string {
    const d = _monMeasure.data;
    if (!d) return '<div class="text-muted fs-xs">' + esc(_monT("unavailable")) + '</div>';
    let h = "";
    (d.monitors || []).filter(function(m: MonAny) { return m.active; }).forEach(function(m: MonAny) {
        h += '<div class="ct-synth-card ct-mb-1"><div class="ct-flex ct-gap-2 ct-items-center">'
           + '<span class="fw-600">' + esc(m.collector_code) + '</span><span class="ct-flex-1">' + esc(_monText(m.title)) + '</span>'
           + _monResultBadge(m.last && m.last.result) + '</div>'
           + '<div class="fs-xs text-muted ct-mt-1">' + esc(m.connection_label) + ' · '
           + (m.days_in_state == null ? "" : esc(_monT("since_days", { days: m.days_in_state })) + ' · ')
           + esc(_monT("last_collection")) + ' ' + _monDate(m.last && m.last.collected_at) + '</div>';
        if (m.last && m.last.missing_permission) {
            h += '<div class="fs-xs ct-text-critical ct-mt-1">' + esc(_monT("missing_permission", { permission: m.last.missing_permission })) + '</div>';
        }
        if (_monMeasure.stopping === m.id) {
            h += '<div class="ct-flex ct-gap-1 ct-items-center ct-mt-1"><input type="text" id="mon-stop-reason" class="ct-flex-1" placeholder="' + esc(_monT("stop_reason")) + '" aria-label="' + esc(_monT("stop_reason")) + '" />'
               + '<button class="ct-btn" data-write data-variant="danger" data-size="xs" data-click="_monStopSave" data-args=\'' + _da(m.id) + '\'>' + esc(_monT("btn_stop")) + '</button>'
               + '<button class="ct-btn" data-size="xs" data-click="_monStopCancel">' + esc(_monT("btn_cancel")) + '</button></div>' + _monErrorSlot("mon-stop-error");
        } else {
            h += '<div class="ct-flex ct-gap-1 ct-mt-1">'
               + '<button class="ct-btn" data-write data-size="xs" data-click="_monRunFromMeasure" data-args=\'' + _da(m.id) + '\'>' + esc(_monT("btn_run")) + '</button>'
               + '<button class="ct-btn" data-size="xs" data-click="_monOpenFromMeasure" data-args=\'' + _da(m.id) + '\'>' + esc(_monT("btn_history")) + '</button>'
               + '<button class="ct-btn" data-write data-size="xs" data-click="_monStopStart" data-args=\'' + _da(m.id) + '\'>' + esc(_monT("btn_stop")) + '</button></div>';
        }
        h += '</div>';
    });
    const seen: Record<string, number> = {};
    (d.proposals || []).forEach(function(p: MonAny) { seen[p.collector_code] = (seen[p.collector_code] || 0) + 1; });
    (d.proposals || []).forEach(function(p: MonAny) {
        const via = (p.matches || []).map(function(x: MonAny) { return _monRequirementLabel(x.key); }).join(" ; ");
        // The line names the collector; the connection and the requirement it
        // serves show on hover.
        h += '<div class="ct-flex ct-gap-2 ct-items-center ct-mb-1"><span class="ct-flex-1 fs-xs" title="'
           + esc(p.connection_label + " — " + via) + '">' + esc(p.collector_code + " — " + _monText(p.title))
           + (seen[p.collector_code] > 1 ? ' <span class="text-muted">(' + esc(p.connection_label) + ')</span>' : '') + '</span>'
           + '<button class="ct-btn" data-write data-variant="primary" data-size="xs" data-click="_monActivate" data-args=\''
           + _da(_monMeasure.mid, p.collector_code, p.connection_id) + '\'>' + esc(_monT("btn_activate")) + '</button></div>';
    });
    if (!h) h = '<div class="text-muted fs-xs">' + esc(_monT("none_for_measure")) + '</div>';
    return h;
}

/** "ISO 27001 A.8.5 — Secure authentication": why a collector is proposed,
 *  read from the requirement the project holds. */
function _monRequirementLabel(key: string): string {
    const i = key.indexOf(":");
    const fw = key.substring(0, i), ref = key.substring(i + 1);
    const meta = _getAllFrameworks()[fw];
    const entry = ((D.referentiels && D.referentiels[fw]) || []).find(function(e) { return (e.ref || "") === ref; });
    const title = entry ? (_rt(entry, "mesure") || _rt(entry, "thematique") || "") : "";
    return (meta ? meta.label : fw) + " " + ref + (title ? " — " + String(title).substring(0, 70) : "");
}

function _monRedrawMeasure() {
    const el = document.getElementById("ct-mesure-monitoring-wrap");
    if (el) el.innerHTML = _monMeasureHtml();
}

/** The server wrote the measure (a collected proof, a locked or freed
 *  recurrence): reload the data and reopen the window on what it is now —
 *  the window's own copy of the measure is stale. Whoever opened the first
 *  window (a non-conformity) waits for the reopened one (_monTakeReopened). */
var _monReopened: { mid: string; next: Promise<unknown> } | null = null;
function _monAfterServerWrite(mid: string): Promise<void> {
    return (window._reloadData ? window._reloadData() : Promise.resolve()).then(function() {
        // Closed meanwhile (the user cancelled, or another window took its place): nothing to reopen.
        if (_monMeasure.mid !== mid || !document.getElementById("ct-mesure-monitoring-wrap")) return undefined;
        const next = Promise.resolve().then(function() { return window._editMesureRow!({ id: mid }); });
        _monReopened = { mid: mid, next: next };
        if (window.ct_modal) window.ct_modal.close();
        return next;
    }).then(function() { return undefined; });
}
/** The reopened window of measure `mid`, for the window it replaced only. */
function _monTakeReopened(mid?: string): Promise<unknown> | null {
    const r = _monReopened;
    _monReopened = null;
    return r && (mid === undefined || r.mid === mid) ? r.next : null;
}

function _monActivate(mid: string, code: string, connectionId: string) {
    window.ComplianceAPI!.activateMonitoring(mid, { collector_code: code, connection_id: connectionId })
        .then(function() { showStatus(_monT("activated", { code: code })); return _monAfterServerWrite(mid); })
        .catch(_monFail);
}
function _monRunFromMeasure(id: string) {
    window.ComplianceAPI!.runMonitoring(id).then(function(res: MonAny) {
        // Its collector left the catalog: the run stopped the monitoring.
        if (res && res.retired && !res.active) showStatus(_monT("retired_stopped", { code: res.collector_code }), true);
        return _monAfterServerWrite(_monMeasure.mid);
    }).catch(_monFail);
}
/** The same manual collection as the measure's window, from the panel's list:
 *  the measure may change state, so the data reloads before the list redraws. */
function _monRunFromPanel(id: string) {
    if (_mon.running[id]) return;
    _mon.running[id] = true; _monRedrawRow(id);
    window.ComplianceAPI!.runMonitoring(id).then(function(res: MonAny) {
        if (res && res.retired && !res.active) showStatus(_monT("retired_stopped", { code: res.collector_code }), true);
        else showStatus(_monT("run_done", { code: (res && res.collector_code) || "",
                                             result: _monT("result." + ((res && res.last && res.last.result) || "none")) }));
        if (res && res.id === id) _mon.monitors = _mon.monitors.map(function(m: MonAny) { return m.id === id ? res : m; });
        return window._reloadData ? window._reloadData({ redraw: false }) : undefined;
    }).catch(_monFail).then(function() {
        delete _mon.running[id];
        // Elsewhere by now: that panel shows the reloaded data, as after any server write.
        if (_currentPanel !== "monitoring") { renderAll(); return; }
        renderSidebar();                                           // the measure's status may have changed
        // A run lasts long enough to start typing elsewhere on the panel: then
        // only its row changes, the rest redraws with the next action.
        if (_monFormInUse()) { _monRedrawRow(id); return; }
        if (_mon.openMonitor === id) _mon.version = null;          // its history gains a version
        renderMonitoring();
    });
}
function _monRedrawRow(id: string) {
    const row = document.getElementById("mon-row-" + id);
    const m = _mon.monitors.find(function(x: MonAny) { return x.id === id; });
    if (row && m) row.outerHTML = _monMonitorRowHtml(m);
}
/** A form of the panel holds what the user is typing: a connection, an
 *  exclusion, a revocation's reason. */
function _monFormInUse(): boolean {
    if (_mon.newConnection || _mon.excluding) return true;
    const el = document.getElementById("monitoring-content");
    return !!el && Array.prototype.some.call(el.querySelectorAll('input[id^="mon-revoke-"]'),
                                             function(i: HTMLInputElement) { return i.value.trim() !== ""; });
}
/** "stopped", and why: the collector left the catalog, or the reason given. */
function _monStoppedLabel(m: MonAny): string {
    // Stopped by the system for that: a person's own reason stays theirs.
    const why = m.retired && m.deactivated_by === "system" ? _monT("retired") : (m.deactivation_reason || "");
    return _monT("stopped") + (why ? " — " + why : "");
}
function _monStopStart(id: string) { _monMeasure.stopping = id; _monRedrawMeasure(); }
function _monStopCancel() { _monMeasure.stopping = null; _monRedrawMeasure(); }
function _monStopSave(id: string) {
    const input = document.getElementById("mon-stop-reason") as HTMLInputElement | null;
    const reason = input ? input.value : "";
    window.ComplianceAPI!.deactivateMonitoring(id, reason)
        .then(function() { return _monAfterServerWrite(_monMeasure.mid); }).catch(_monFormFail("mon-stop-error"));
}
function _monOpenFromMeasure(id: string) {
    if (window.ct_modal) window.ct_modal.close();             // the measure window
    _mon.openMonitor = id;
    selectPanel("monitoring");
}

/** A collected proof is written by its monitoring: opening it shows that. */
function _monShowProof(pid: string) {
    if (window.ct_modal) window.ct_modal.close();
    _mon.openProof = pid;
    _mon.version = null;
    selectPanel("monitoring");
}

// ── The panel ───────────────────────────────────────────────────────────

// Only the latest load is drawn: an older one, late, would put back a
// state that is no longer true.
var _monSeq = 0;

function renderMonitoring() {
    const el = document.getElementById("monitoring-content");
    if (!el || !window.ComplianceAPI) return;
    const api = window.ComplianceAPI;
    const seq = ++_monSeq;
    if (_mon.coverageFw && D.referentiels_actifs.indexOf(_mon.coverageFw) < 0) _mon.coverageFw = "";
    Promise.all([_mon.collectors ? Promise.resolve(_mon.collectors) : api.collectors(),
                 api.listConnections(), api.listMonitors(), api.listExclusions()])
        .then(function(r) {
            if (seq !== _monSeq) return null;
            _mon.collectors = r[0]; _mon.connections = r[1]; _mon.monitors = r[2]; _mon.exclusions = r[3];
            if (_mon.openProof) {          // a collected proof was opened: show its monitoring
                const held = _mon.monitors.find(function(m: MonAny) { return m.proof_id === _mon.openProof; });
                _mon.openMonitor = held ? held.id : null;
                _mon.openProof = null;
            }
            if (!_mon.coverageFw) _mon.coverageFw = D.referentiels_actifs[0] || "";
            const open = _mon.openMonitor;
            return Promise.all([
                open ? api.listVersions(open).catch(function() { return []; }) : Promise.resolve([]),
                _mon.coverageFw ? api.coverage(_mon.coverageFw).catch(function() { return null; }) : Promise.resolve(null),
            ]);
        })
        .then(function(r) {
            if (!r || seq !== _monSeq) return;
            _mon.versions = r[0]; _mon.coverage = r[1]; _monDraw();
        })
        .catch(function(err) { if (seq === _monSeq) _monFail(err); });
}

function _monDraw() {
    const el = document.getElementById("monitoring-content");
    if (!el) return;
    el.innerHTML = _monConnectionsHtml() + _monMonitorsHtml() + _monExclusionsHtml() + _monCoverageHtml();
    _monDrawDetail();
}

/** The open monitoring's history is shown in a window over the panel; it
 *  is redrawn in place, and closing the window closes the monitoring. */
var _monDetailSeq = 0;
function _monDrawDetail() {
    const m = _mon.monitors.find(function(x: MonAny) { return x.id === _mon.openMonitor; });
    const box = document.getElementById("mon-detail");
    if (box) {
        if (m) box.innerHTML = _monHistoryHtml(m);
        else if (window.ct_modal) window.ct_modal.close();          // gone from the list
        return;
    }
    // Asked from elsewhere, answered once the user has moved on: another window may be open there.
    if (_currentPanel !== "monitoring") { _mon.openMonitor = null; return; }
    if (!m || !window.ct_modal) return;
    const seq = ++_monDetailSeq;
    window.ct_modal.open({
        title: m.measure_id + " · " + m.collector_code + " — " + _monText(m.title),
        body: '<div id="mon-detail">' + _monHistoryHtml(m) + '</div>', size: "lg",
        buttons: [{ id: "close", label: _monT("btn_close") }],
    }).then(function() {
        if (seq !== _monDetailSeq) return;
        _mon.openMonitor = null; _mon.version = null; _mon.excluding = null;
    });
}

function _monProvider(name: string): MonAny {
    return ((_mon.collectors && _mon.collectors.providers) || []).find(function(p: MonAny) { return p.provider === name; });
}

function _monConnectionsHtml(): string {
    let h = '<div class="ct-synth-card ct-mb-3"><h3>' + esc(_monT("connections")) + '</h3>';
    if (_mon.connections.length) {
        h += '<table><thead><tr><th>' + esc(_monT("col_provider")) + '</th><th>' + esc(_monT("col_label")) + '</th><th>'
           + esc(_monT("col_mode")) + '</th><th>' + esc(_monT("col_test")) + '</th><th></th></tr></thead><tbody>';
        _mon.connections.forEach(function(c: MonAny) {
            const test = _mon.testResults[c.id] || c.last_test;
            let testHtml = "—";
            if (test && test.at !== null && test.ok !== null && test.ok !== undefined) {
                testHtml = _tBadge(test.ok ? (test.partial || (test.missing_permissions || []).length ? _monT("test_partial") : _monT("test_ok")) : _monT("test_failed"),
                                   test.ok ? ((test.missing_permissions || []).length ? "yellow" : "green") : "red");
                if ((test.missing_permissions || []).length) {
                    testHtml += '<div class="fs-xs text-muted">' + esc(_monT("missing_permissions", { list: test.missing_permissions.join(", ") })) + '</div>';
                } else if (test.message) {
                    testHtml += '<div class="fs-xs text-muted">' + esc(test.message) + '</div>';
                }
                testHtml += '<div class="fs-xs text-muted">' + esc(_monT("tested_at")) + ' ' + _monDate(test.at) + '</div>';
            }
            const testing = !!_mon.testing[c.id];
            h += '<tr><td>' + esc(_monText((_monProvider(c.provider) || {}).label) || c.provider) + '</td><td>' + esc(c.label) + '</td><td>'
               + esc(_monT("mode." + c.mode)) + '</td><td>' + testHtml + '</td><td class="ct-flex ct-gap-1">'
               + '<button class="ct-btn" data-write data-size="xs" data-click="_monTestConnection" data-args=\'' + _da(c.id) + '\'' + (testing ? " disabled" : "") + '>'
               + esc(testing ? _monT("testing") : _monT("btn_test")) + '</button>'
               + '<button class="ct-btn" data-write data-size="xs" data-click="_monEditConnection" data-args=\'' + _da(c.id) + '\'>' + esc(_monT("btn_edit")) + '</button>'
               + '<button class="ct-btn" data-write data-variant="danger" data-size="xs" data-click="_monDeleteConnection" data-args=\'' + _da(c.id) + '\'>' + esc(_monT("btn_delete")) + '</button></td></tr>';
        });
        h += '</tbody></table>';
    } else {
        h += '<p class="text-muted fs-xs">' + esc(_monT("no_connection")) + '</p>';
    }
    if (_mon.newConnection) {
        const prov = _monProvider(_mon.newConnection.provider);
        const editing = _mon.newConnection.editing
            ? _mon.connections.find(function(c: MonAny) { return c.id === _mon.newConnection!.editing; }) : null;
        h += '<div class="ct-form-grid ct-mt-2">';
        if (editing) {
            h += '<div class="fs-xs">' + esc(_monT("col_provider")) + '<div class="fw-600">' + esc(_monText(prov && prov.label)) + '</div></div>';
        } else {
            h += '<label class="fs-xs">' + esc(_monT("col_provider")) + '<select id="mon-new-provider" class="ct-w-full" data-change="_monPickProvider" data-pass-value>'
               + ((_mon.collectors && _mon.collectors.providers) || []).map(function(p: MonAny) {
                     return '<option value="' + esc(p.provider) + '"' + (p.provider === _mon.newConnection!.provider ? " selected" : "") + '>' + esc(_monText(p.label)) + '</option>';
                 }).join("") + '</select></label>';
        }
        const mode = _mon.newConnection.mode || (editing ? editing.mode : "demo");
        if (prov && prov.live) {
            h += '<label class="fs-xs">' + esc(_monT("col_mode")) + '<select id="mon-new-mode" class="ct-w-full" data-change="_monPickMode" data-pass-value>'
               + ["demo", "live"].map(function(m) {
                     return '<option value="' + m + '"' + (m === mode ? " selected" : "") + '>' + esc(_monT("mode." + m)) + '</option>';
                 }).join("") + '</select></label>';
        }
        h += '<label class="fs-xs">' + esc(_monT("col_label")) + '<input type="text" id="mon-new-label" class="ct-w-full" value="' + esc(editing ? editing.label : "") + '" /></label>';
        ((prov && prov.connection.fields) || []).forEach(function(f: MonAny) {
            if (f.generated) {                                  // written by the server, shown once it exists
                if (editing && editing.settings[f.id]) {
                    h += '<div class="fs-xs ct-col-span-2">' + esc(_monText(f.label)) + '<div class="fw-600 ct-mono">' + esc(String(editing.settings[f.id])) + '</div></div>';
                }
                return;
            }
            const current = editing && !f.secret ? editing.settings[f.id] : "";
            const shown = Array.isArray(current) ? current.join(", ") : (current == null ? "" : String(current));
            const keeps = editing && f.secret && editing.secrets[f.id] && editing.secrets[f.id].set;
            h += '<label class="fs-xs">' + esc(_monText(f.label)) + (f.required && mode === "live" ? " *" : "")
               + '<input type="' + (f.secret ? "password" : "text") + '" class="ct-w-full" data-mon-field="' + esc(f.id) + '" data-mon-secret="' + (f.secret ? "1" : "0")
               + '" value="' + esc(shown) + '"' + (keeps ? ' placeholder="' + esc(_monT("secret_kept")) + '"' : "") + ' autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" /></label>';
        });
        let hint = esc(_monT(mode === "live" ? "live_hint." + _mon.newConnection.provider : "demo_only"));
        if (mode === "live" && _mon.newConnection.provider === "aws") {
            hint += ' <a href="collection/aws-readonly-role.yaml" download>' + esc(_monT("aws_template")) + '</a>';
        }
        h += '</div>' + _monErrorSlot("mon-conn-error") + '<p class="fs-xs text-muted">' + hint + '</p>'
           + '<div class="ct-flex ct-gap-1"><button class="ct-btn" data-write data-variant="primary" data-size="sm" data-click="_monSaveConnection">' + esc(_monT("btn_save")) + '</button>'
           + '<button class="ct-btn" data-size="sm" data-click="_monCancelConnection">' + esc(_monT("btn_cancel")) + '</button></div>';
    } else {
        h += '<button class="ct-btn ct-mt-2" data-write data-variant="primary" data-size="sm" data-click="_monNewConnection">' + esc(_monT("btn_new_connection")) + '</button>';
    }
    return h + '</div>';
}

function _monNewConnection() { _mon.newConnection = { provider: "aws" }; _monDraw(); }
function _monCancelConnection() { _mon.newConnection = null; _monDraw(); }
function _monPickProvider(value: string) { _mon.newConnection = { provider: value }; _monDraw(); }
function _monPickMode(value: string) { if (_mon.newConnection) { _mon.newConnection.mode = value; _monDraw(); } }
function _monEditConnection(cid: string) {
    const c = _mon.connections.find(function(x: MonAny) { return x.id === cid; });
    if (!c) return;
    _mon.newConnection = { provider: c.provider, editing: cid };
    _monDraw();
}
function _monSaveConnection() {
    if (!_mon.newConnection) return;
    const editing = _mon.newConnection.editing;
    const mode = _mon.newConnection.mode;
    const settings: Record<string, unknown> = {}, secrets: Record<string, unknown> = {};
    document.querySelectorAll<HTMLInputElement>("[data-mon-field]").forEach(function(input) {
        const key = input.getAttribute("data-mon-field")!;
        const value = input.value.trim();
        if (input.getAttribute("data-mon-secret") === "1") {
            if (value) secrets[key] = value;               // empty: the stored secret is kept
        } else if (value) {
            settings[key] = key === "regions" ? value.split(",").map(function(s) { return s.trim(); }).filter(Boolean) : value;
        } else if (editing) {
            settings[key] = null;                          // emptied: cleared
        }
    });
    const label = (document.getElementById("mon-new-label") as HTMLInputElement | null)?.value || "";
    const api = window.ComplianceAPI!;
    const done = editing
        ? api.updateConnection(editing, Object.assign({ label: label, settings: settings, secrets: secrets }, mode ? { mode: mode } : {}))
        : api.createConnection({ provider: _mon.newConnection.provider, label: label, mode: mode || "demo", settings: settings, secrets: secrets });
    done.then(function() {
        if (editing) {                                     // the server's last test is the one to show now
            delete _mon.testResults[editing];
            _mon.edits[editing] = (_mon.edits[editing] || 0) + 1;
        }
        _mon.newConnection = null;
        renderMonitoring();
    }).catch(_monFormFail("mon-conn-error"));
}
function _monTestConnection(cid: string) {
    if (_mon.testing[cid]) return;
    _mon.testing[cid] = true;
    _monDraw();
    const edits = _mon.edits[cid] || 0;
    window.ComplianceAPI!.testConnection(cid).then(function(res) {
        // Saved while it ran: the result is of the connection as it was.
        if ((_mon.edits[cid] || 0) !== edits) return;
        if (res.at === null) {                             // changed elsewhere while it ran
            delete _mon.testResults[cid];
            showStatus(_monT("test_overtaken"), true);
            renderMonitoring();
            return;
        }
        _mon.testResults[cid] = Object.assign({ at: new Date().toISOString() }, res);
    }).catch(_monFail).then(function() {
        delete _mon.testing[cid];
        _monDraw();
    });
}
function _monDeleteConnection(cid: string) {
    if (!confirm(_monT("confirm_delete_connection"))) return;
    window.ComplianceAPI!.deleteConnection(cid).then(function() { renderMonitoring(); }).catch(_monFail);
}

function _monMonitorsHtml(): string {
    let h = '<div class="ct-synth-card ct-mb-3"><h3>' + esc(_monT("monitorings")) + '</h3>';
    if (!_mon.monitors.length) return h + '<p class="text-muted fs-xs">' + esc(_monT("no_monitoring")) + '</p></div>';
    h += '<table><thead><tr><th>' + esc(_monT("col_measure")) + '</th><th>' + esc(_monT("col_collector")) + '</th><th>'
       + esc(_monT("col_result")) + '</th><th>' + esc(_monT("col_since")) + '</th><th>' + esc(_monT("col_last")) + '</th><th></th></tr></thead><tbody>';
    _mon.monitors.forEach(function(m: MonAny) {
        h += _monMonitorRowHtml(m);
    });
    return h + '</tbody></table></div>';
}

function _monMonitorRowHtml(m: MonAny): string {
    return '<tr id="mon-row-' + esc(m.id) + '" class="ct-clickable' + (m.active ? "" : " ct-bg-alt") + '" data-click="_monOpenMonitor" data-args=\'' + _da(m.id) + '\'>'
           + '<td class="fw-600">' + esc(m.measure_id) + '</td><td>' + esc(m.collector_code) + ' — ' + esc(_monText(m.title))
           + (m.active ? "" : ' <span class="fs-xs text-muted">(' + esc(_monStoppedLabel(m)) + ')</span>') + '</td><td>'
           + _monResultBadge(m.last && m.last.result) + '</td><td>' + esc(m.days_in_state == null ? "—" : _monT("days", { days: m.days_in_state }))
           + '</td><td>' + _monDate(m.last && m.last.collected_at) + '</td><td>'
           + (m.active ? '<button class="ct-btn" data-write data-size="xs" data-click="_monRunFromPanel" data-args=\'' + _da(m.id) + '\' data-stop'
                         + (_mon.running[m.id] ? " disabled" : "") + '>' + esc(_monT(_mon.running[m.id] ? "running" : "btn_rerun")) + '</button>' : "")
           + '</td></tr>';
}

function _monHistoryHtml(m: MonAny): string {
    let h = '<div class="fs-xs text-muted ct-mb-1">' + esc(_monText(m.rule)) + '</div>';
    h += '<div class="fs-xs ct-mb-1">' + esc(_monT("retention", { daily: m.retention.daily_days, weekly: m.retention.weekly_days, monthly: m.retention.monthly_days })) + '</div>';
    h += '<table><thead><tr><th>#</th><th>' + esc(_monT("col_collected")) + '</th><th>' + esc(_monT("col_result")) + '</th><th>'
       + esc(_monT("col_findings")) + '</th><th>' + esc(_monT("col_fingerprint")) + '</th></tr></thead><tbody>';
    _mon.versions.forEach(function(v: MonAny) {
        h += '<tr class="ct-clickable" data-click="_monOpenVersion" data-args=\'' + _da(v.id) + '\'><td>' + esc(String(v.seq)) + '</td><td>'
           + _monDate(v.collected_at) + (v.purged ? ' <span class="text-muted">(' + esc(_monT("purged")) + ')</span>' : "") + '</td><td>'
           + _monResultBadge(v.result) + (v.partial ? ' <span class="fs-xs">' + esc(_monT("partial")) + '</span>' : "") + '</td><td>'
           + esc(_monT("counts", { findings: v.n_findings, excluded: v.n_excluded })) + '</td><td class="fs-xs">' + esc(String(v.raw_sha256).substring(0, 12)) + '…</td></tr>';
        if (_mon.version && _mon.version.id === v.id) h += '<tr><td colspan="5">' + _monVersionHtml(m, _mon.version) + '</td></tr>';
    });
    return h + '</tbody></table>';
}

function _monVersionHtml(m: MonAny, v: MonAny): string {
    let h = "";
    h += '<div class="fs-xs text-muted ct-mb-1">' + esc(_monT("data_as_of")) + ' ' + _monDate(v.data_as_of) + '</div>';
    if (v.reason) h += '<div class="fs-xs ct-mb-1">' + esc(v.reason) + (v.missing_permission ? " — " + esc(v.missing_permission) : "") + '</div>';
    h += '<div class="fs-xs fw-600">' + esc(_monT("findings")) + '</div>';
    if (!(v.findings || []).length) h += '<div class="fs-xs text-muted">—</div>';
    (v.findings || []).forEach(function(f: MonAny) {
        h += '<div class="ct-flex ct-gap-2 ct-items-center fs-xs ct-mb-1"><span class="fw-600">' + esc(f.resource) + '</span><span class="ct-flex-1">' + esc(f.detail) + '</span>';
        if (m.active && _mon.excluding !== f.resource) {
            h += '<button class="ct-btn" data-write data-size="xs" data-click="_monExcludeStart" data-args=\'' + _da(f.resource) + '\'>' + esc(_monT("btn_exclude")) + '</button>';
        }
        h += '</div>';
        if (_mon.excluding === f.resource) h += _monExcludeForm(m, f.resource);
    });
    if ((v.excluded || []).length) {
        h += '<div class="fs-xs fw-600 ct-mt-1">' + esc(_monT("excluded")) + '</div>';
        (v.excluded || []).forEach(function(x: MonAny) {
            h += '<div class="fs-xs ct-mb-1"><span class="fw-600">' + esc(x.resource) + '</span> — ' + esc(x.justification) + ' <span class="text-muted">(' + esc(x.by || "") + ')</span></div>';
        });
    }
    if ((v.unreadable || []).length) {
        h += '<div class="fs-xs fw-600 ct-mt-1">' + esc(_monT("unreadable")) + '</div>';
        (v.unreadable || []).forEach(function(u: MonAny) { h += '<div class="fs-xs">' + esc(u.resource) + ' — ' + esc(u.reason) + '</div>'; });
    }
    return h;
}

function _monExcludeForm(m: MonAny, resource: string): string {
    let h = '<div class="ct-form-grid ct-mb-2">'
          + '<label class="fs-xs ct-col-span-2">' + esc(_monT("justification_hint")) + '<textarea id="mon-ex-why" rows="2" class="ct-w-full"></textarea></label>'
          + '<label class="fs-xs">' + esc(_monT("kind")) + '<select class="ct-w-full" data-change="_monExcludeKind" data-pass-value>'
          + ["permanent", "temporary"].map(function(k) { return '<option value="' + k + '"' + (_mon.excludeKind === k ? " selected" : "") + '>' + esc(_monT("kind." + k)) + '</option>'; }).join("")
          + '</select></label>';
    if (_mon.excludeKind === "temporary") {
        h += '<label class="fs-xs">' + esc(_monT("valid_until")) + '<input type="date" id="mon-ex-until" class="ct-w-full" /></label>'
           + '<label class="fs-xs">' + esc(_monT("risk_owner")) + '<input type="text" id="mon-ex-owner" class="ct-w-full" /></label>'
           + '<label class="fs-xs">' + esc(_monT("approver")) + '<input type="text" id="mon-ex-approver" class="ct-w-full" /></label>';
    }
    h += '</div>' + _monErrorSlot("mon-ex-error") + '<div class="ct-flex ct-gap-1 ct-mb-2"><button class="ct-btn" data-write data-variant="primary" data-size="xs" data-click="_monExcludeSave" data-args=\''
       + _da(m.id, resource) + '\'>' + esc(_monT("btn_exclude")) + '</button><button class="ct-btn" data-size="xs" data-click="_monExcludeCancel">' + esc(_monT("btn_cancel")) + '</button></div>';
    return h;
}

function _monOpenMonitor(id: string) {
    _mon.openMonitor = id;
    _mon.version = null; _mon.excluding = null;
    window.ComplianceAPI!.listVersions(id).then(function(vs) {
        if (_mon.openMonitor === id) { _mon.versions = vs; _monDraw(); }          // still the one open
    }).catch(_monFail);
}
function _monOpenVersion(vid: string) {
    if (_mon.version && _mon.version.id === vid) { _mon.version = null; _monDraw(); return; }
    window.ComplianceAPI!.getVersion(vid).then(function(v) {
        if (_mon.versions.some(function(x: MonAny) { return x.id === vid; })) { _mon.version = v; _mon.excluding = null; _monDraw(); }
    }).catch(_monFail);
}
function _monExcludeStart(resource: string) { _mon.excluding = resource; _mon.excludeKind = "permanent"; _monDraw(); }
function _monExcludeCancel() { _mon.excluding = null; _monDraw(); }
function _monExcludeKind(value: string) { _mon.excludeKind = value; _monDraw(); }
function _monExcludeSave(monitorId: string, resource: string) {
    const val = function(id: string) { const el = document.getElementById(id) as HTMLInputElement | null; return el ? el.value : ""; };
    const body: Record<string, unknown> = { resource: resource, justification: val("mon-ex-why"), kind: _mon.excludeKind };
    if (_mon.excludeKind === "temporary") {
        body.valid_until = val("mon-ex-until"); body.risk_owner = val("mon-ex-owner"); body.approver = val("mon-ex-approver");
    }
    window.ComplianceAPI!.createExclusion(monitorId, body).then(function() {
        _mon.excluding = null; showStatus(_monT("excluded_saved")); renderMonitoring();
    }).catch(_monFormFail("mon-ex-error"));
}

function _monExclusionsHtml(): string {
    let h = '<div class="ct-synth-card ct-mb-3"><h3>' + esc(_monT("exclusions")) + '</h3>';
    if (!_mon.exclusions.length) return h + '<p class="text-muted fs-xs">' + esc(_monT("no_exclusion")) + '</p></div>';
    h += '<table><thead><tr><th>' + esc(_monT("col_collector")) + '</th><th>' + esc(_monT("col_resource")) + '</th><th>'
       + esc(_monT("justification")) + '</th><th>' + esc(_monT("col_state")) + '</th><th></th></tr></thead><tbody>';
    _mon.exclusions.forEach(function(e: MonAny) {
        const live = e.state !== "revoked";
        h += '<tr><td>' + esc(e.collector_code) + '</td><td class="fw-600">' + esc(e.resource) + '</td><td class="fs-xs">' + esc(e.justification)
           + (e.derogation ? ' <span class="text-muted">(' + esc(e.derogation.reference) + ')</span>' : "") + '</td><td>'
           + _tBadge(_monT("excl." + e.state), e.state === "active" ? "green" : e.state === "pending_approval" ? "yellow" : "gray") + '</td><td>'
           + (live ? '<div class="ct-flex ct-gap-1"><input type="text" id="mon-revoke-' + esc(e.id) + '" placeholder="' + esc(_monT("revoke_reason")) + '" aria-label="' + esc(_monT("revoke_reason")) + '" />'
                   + '<button class="ct-btn" data-write data-size="xs" data-click="_monRevokeExclusion" data-args=\'' + _da(e.id) + '\'>' + esc(_monT("btn_revoke")) + '</button></div>'
                   + _monErrorSlot("mon-revoke-error-" + esc(e.id)) : "")
           + '</td></tr>';
    });
    return h + '</tbody></table></div>';
}

function _monRevokeExclusion(eid: string) {
    const input = document.getElementById("mon-revoke-" + eid) as HTMLInputElement | null;
    window.ComplianceAPI!.revokeExclusion(eid, input ? input.value : "")
        .then(function() { renderMonitoring(); }).catch(_monFormFail("mon-revoke-error-" + eid));
}

const _MON_COVERAGE_COLORS: Record<string, string> = { covered: "green", coverable: "blue", suggested: "yellow", none: "gray" };

function _monCoverageHtml(): string {
    let h = '<div class="ct-synth-card ct-mb-3"><h3>' + esc(_monT("coverage")) + '</h3>';
    if (!D.referentiels_actifs.length) return h + '<p class="text-muted fs-xs">' + esc(t("comp.dash.no_framework")) + '</p></div>';
    h += '<select class="ct-mb-2" data-change="_monCoverageFw" data-pass-value aria-label="' + esc(_monT("coverage")) + '">' + D.referentiels_actifs.map(function(fw) {
        const meta = _getAllFrameworks()[fw];
        return '<option value="' + esc(fw) + '"' + (fw === _mon.coverageFw ? " selected" : "") + '>' + esc(meta ? meta.label : fw) + '</option>';
    }).join("") + '</select>';
    const cov = _mon.coverage;
    if (!cov) return h + '</div>';
    h += '<div class="fs-xs ct-mb-2">' + ["covered", "coverable", "suggested", "none"].map(function(k) {
        return _tBadge(_monT("cov." + k) + " " + cov.totals[k], _MON_COVERAGE_COLORS[k]);
    }).join(" ") + '</div>';
    const rows = (cov.requirements || []).filter(function(r: MonAny) { return r.state !== "none"; });
    if (!rows.length) return h + '<p class="text-muted fs-xs">' + esc(_monT("no_collector_for_fw")) + '</p></div>';
    h += '<table><thead><tr><th>' + esc(_monT("col_requirement")) + '</th><th>' + esc(_monT("col_state")) + '</th><th>' + esc(_monT("col_collectors")) + '</th></tr></thead><tbody>';
    rows.forEach(function(r: MonAny) {
        h += '<tr><td class="fw-600">' + esc(r.ref) + '<div class="fs-xs text-muted">' + esc(String(r.title).substring(0, 80)) + '</div></td><td>'
           + _tBadge(_monT("cov." + r.state), _MON_COVERAGE_COLORS[r.state] || "gray") + '</td><td class="fs-xs">';
        (r.collectors || []).forEach(function(c: MonAny) {
            h += '<div class="ct-flex ct-gap-1 ct-items-center"><span>' + esc(c.code) + ' — ' + esc(_monText(c.title)) + '</span>'
               + '<span class="text-muted">' + esc(_monT("link." + c.kind)) + (c.via ? " · " + esc(c.via) : "") + '</span>';
            if (c.kind === "suggested") {
                h += '<button class="ct-btn" data-write data-size="xs" data-click="_monSuggestion" data-args=\'' + _da(c.code, r.key, "confirmed") + '\'>' + esc(_monT("btn_confirm")) + '</button>'
                   + '<button class="ct-btn" data-write data-size="xs" data-click="_monSuggestion" data-args=\'' + _da(c.code, r.key, "rejected") + '\'>' + esc(_monT("btn_reject")) + '</button>';
            }
            h += '</div>';
        });
        h += '</td></tr>';
    });
    return h + '</tbody></table></div>';
}

function _monCoverageFw(fw: string) {
    _mon.coverageFw = fw;
    window.ComplianceAPI!.coverage(fw).then(function(c) { _mon.coverage = c; _monDraw(); }).catch(_monFail);
}
function _monSuggestion(code: string, key: string, decision: string) {
    window.ComplianceAPI!.decideSuggestion({ collector_code: code, requirement_key: key, decision: decision })
        .then(function() { return window.ComplianceAPI!.coverage(_mon.coverageFw); })
        .then(function(c) { _mon.coverage = c; _monDraw(); }).catch(_monFail);
}
