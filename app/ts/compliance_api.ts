/**
 * Compliance — REST API Client Layer
 *
 * Single-project persistence via REST API.
 * Load BEFORE Compliance_app.js.
 */

/** _fetch options: restricted RequestInit, JSON object body tolerated. */
interface ComplianceFetchOpts {
    method?: string;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
    // A JSON array is a legitimate body too: PUT /frameworks/{id}/requirements
    // sends the definition as a list, not an object wrapping one.
    body?: BodyInit | Record<string, unknown> | unknown[] | null;
}

(function() {
"use strict";

var BASE = "api";
var _activeId: string | null = null;
var _saveTimer: ReturnType<typeof setTimeout> | null = null;
var _dataReady = false;

// Returns Promise<any>: untyped JSON responses at the network boundary;
// the typing is carried by ComplianceAPIShape (Compliance_types.d.ts).
async function _fetch(url: string, opts?: ComplianceFetchOpts): Promise<any> {
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.credentials = "same-origin";
    if (opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)) {
        opts.headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(opts.body);
    }
    var resp = await fetch(BASE + url, opts as RequestInit);
    if (resp.status === 401) { var _rp = window.location.pathname.replace(/[^/]*$/, ""); window.location.href = "/login.html?redirect=" + encodeURIComponent(_rp); throw new Error("Not authenticated"); }
    // The body is read once: a second read throws and loses the server's reason.
    var errBody = "";
    if (!resp.ok) { try { errBody = await resp.text(); } catch(e) {} }
    if (resp.status === 403 && errBody.indexOf("pending") >= 0) {
        window.location.href = "/login.html?error=pending";
        throw new Error("Account pending");
    }
    if (resp.status === 204) return null;
    // Status, server's reason and the FEAT-33 marker travel with the error.
    if (!resp.ok) throw ct_apiError(resp, errBody);
    return resp.json();
}

// The register belongs to the active project (the module is project-scoped).
function _pid(): string { return (typeof window._getActiveProjectId === "function" && window._getActiveProjectId()) || ""; }

window.ComplianceAPI = {
    list: function() { return _fetch("/projects"); },
    get: function(id: string) { return _fetch("/projects/" + id); },
    status: function(id: string) { return _fetch("/projects/" + id + "/status"); },
    create: function(data?: { name: string; data: Record<string, unknown> }) { return _fetch("/projects", { method: "POST", body: data || { name: "", data: {} } }); },
    update: function(id: string, data: { name: string; data: unknown }) { return _fetch("/projects/" + id, { method: "PUT", body: data }); },
    del: function(id: string) { return _fetch("/projects/" + id, { method: "DELETE" }); },
    importFile: function(file: File) { var fd = new FormData(); fd.append("file", file); return _fetch("/projects/import", { method: "POST", body: fd, headers: {} }); },
    exportUrl: function(id: string) { return BASE + "/projects/" + id + "/export"; },

    aiConfig: function() { return _fetch("/ai/config"); },
    aiGetKeys: function() { return _fetch("/ai/keys"); },
    aiSetKeys: function(d: Record<string, unknown>) { return _fetch("/ai/keys", { method: "PUT", body: d }); },

    authMe: function() { return fetch("auth/me", { credentials: "same-origin" }).then(function(r) { return r.ok ? r.json() : null; }); },
    authProviders: function() { return fetch("auth/providers").then(function(r) { return r.json(); }); },
    // Logout clears module cookie then redirects through Pilot's /auth/logout
    // which invalidates the shared pilot_token cookie.
    authLogout: function() { return fetch("auth/logout", { method: "POST", credentials: "same-origin" }).finally(function() { window.location.href = "/auth/logout"; }); },

    listUsers: function() { return _fetch("/users"); },
    updateUser: function(id: string, d: Record<string, unknown>) { return _fetch("/users/" + id, { method: "PUT", body: d }); },

    // ── Frameworks of the organisation (FEAT-51) ──
    createFramework: function(d: Record<string, unknown>) { return _fetch("/frameworks", { method: "POST", body: d }); },
    deleteFramework: function(fwId: string) { return _fetch("/frameworks/" + encodeURIComponent(fwId), { method: "DELETE" }); },
    putFrameworkRequirements: function(fwId: string, reqs: unknown[]) { return _fetch("/frameworks/" + encodeURIComponent(fwId) + "/requirements", { method: "PUT", body: reqs }); },

    // ── Granular PATCH ──
    patchControl: function(pid: string, cid: string | number, f: Record<string, unknown>) { return _fetch("/projects/" + pid + "/controls/" + cid, { method: "PATCH", body: f }); },
    createControl: function(pid: string, d: Record<string, unknown>) { return _fetch("/projects/" + pid + "/controls", { method: "POST", body: d }); },
    deleteControl: function(pid: string, cid: string | number) { return _fetch("/projects/" + pid + "/controls/" + cid, { method: "DELETE" }); },
    patchMeasure: function(pid: string, mid: string | number, f: Record<string, unknown>) { return _fetch("/projects/" + pid + "/measures/" + mid, { method: "PATCH", body: f }); },
    createMeasure: function(pid: string | null, d: Record<string, unknown>) { return _fetch("/projects/" + pid + "/measures", { method: "POST", body: d }); },
    deleteMeasure: function(pid: string, mid: string | number) { return _fetch("/projects/" + pid + "/measures/" + mid, { method: "DELETE" }); },
    patchProof: function(pid: string, rid: string | number, f: Record<string, unknown>) { return _fetch("/projects/" + pid + "/proofs/" + rid, { method: "PATCH", body: f }); },
    createProof: function(pid: string, d: Record<string, unknown>) { return _fetch("/projects/" + pid + "/proofs", { method: "POST", body: d }); },
    deleteProof: function(pid: string, rid: string | number) { return _fetch("/projects/" + pid + "/proofs/" + rid, { method: "DELETE" }); },

    // ── Automated monitoring (FEAT-73) ──
    collectors: function() { return _fetch("/collectors"); },
    listConnections: function() { return _fetch("/projects/" + _pid() + "/connections"); },
    createConnection: function(body: Record<string, unknown>) { return _fetch("/projects/" + _pid() + "/connections", { method: "POST", body: body }); },
    updateConnection: function(cid: string, body: Record<string, unknown>) { return _fetch("/projects/" + _pid() + "/connections/" + cid, { method: "PATCH", body: body }); },
    deleteConnection: function(cid: string) { return _fetch("/projects/" + _pid() + "/connections/" + cid, { method: "DELETE" }); },
    testConnection: function(cid: string) { return _fetch("/projects/" + _pid() + "/connections/" + cid + "/test", { method: "POST" }); },
    // ── The users of the project (FEAT-74) ──
    listSiUsers: function() { return _fetch("/projects/" + _pid() + "/si-users"); },
    createSiUser: function(body: Record<string, unknown>) { return _fetch("/projects/" + _pid() + "/si-users", { method: "POST", body: body }); },
    updateSiUser: function(id: string, body: Record<string, unknown>) { return _fetch("/projects/" + _pid() + "/si-users/" + id, { method: "PATCH", body: body }); },
    deleteSiUser: function(id: string) { return _fetch("/projects/" + _pid() + "/si-users/" + id, { method: "DELETE" }); },
    siUsersSource: function() { return _fetch("/projects/" + _pid() + "/si-users/source"); },
    setSiUsersSource: function(on: boolean) { return _fetch("/projects/" + _pid() + "/si-users/source", { method: "PUT", body: { pilot_sync: on } }); },
    syncSiUsers: function() { return _fetch("/projects/" + _pid() + "/si-users/sync", { method: "POST" }); },
    importSiUsers: function(csv: string) { return _fetch("/projects/" + _pid() + "/si-users/import", { method: "POST", body: { csv: csv } }); },
    measureMonitoring: function(mid: string) { return _fetch("/projects/" + _pid() + "/measures/" + encodeURIComponent(mid) + "/monitoring"); },
    activateMonitoring: function(mid: string, body: Record<string, unknown>) { return _fetch("/projects/" + _pid() + "/measures/" + encodeURIComponent(mid) + "/monitors", { method: "POST", body: body }); },
    listMonitors: function() { return _fetch("/projects/" + _pid() + "/monitors"); },
    runMonitoring: function(id: string) { return _fetch("/projects/" + _pid() + "/monitors/" + id + "/run", { method: "POST" }); },
    deactivateMonitoring: function(id: string, reason: string) { return _fetch("/projects/" + _pid() + "/monitors/" + id + "/deactivate", { method: "POST", body: { reason: reason } }); },
    listVersions: function(id: string) { return _fetch("/projects/" + _pid() + "/monitors/" + id + "/versions?limit=60"); },
    getVersion: function(vid: string) { return _fetch("/projects/" + _pid() + "/versions/" + vid); },
    versionRecordUrl: function(vid: string) { return BASE + "/projects/" + _pid() + "/versions/" + vid + "/record"; },
    createExclusion: function(id: string, body: Record<string, unknown>) { return _fetch("/projects/" + _pid() + "/monitors/" + id + "/exclusions", { method: "POST", body: body }); },
    listExclusions: function() { return _fetch("/projects/" + _pid() + "/exclusions"); },
    revokeExclusion: function(eid: string, reason: string) { return _fetch("/projects/" + _pid() + "/exclusions/" + eid + "/revoke", { method: "POST", body: { reason: reason } }); },
    coverage: function(fw: string) { return _fetch("/projects/" + _pid() + "/coverage?framework=" + encodeURIComponent(fw)); },
    decideSuggestion: function(body: Record<string, unknown>) { return _fetch("/projects/" + _pid() + "/coverage/decisions", { method: "POST", body: body }); },

    // ── Non-conformities and derogations (shared register served by this module) ──
    listNonconformities: function(status?: string) {
        var q = [];
        if (status) q.push("status=" + encodeURIComponent(status));
        if (_pid()) q.push("project_id=" + encodeURIComponent(_pid()));
        return _fetch("/nonconformities" + (q.length ? "?" + q.join("&") : ""));
    },
    createNonconformity: function(body: Record<string, unknown>) { return _fetch("/nonconformities", { method: "POST", body: Object.assign({ project_id: _pid() }, body) }); },
    qualifyNonconformity: function(id: string, body: Record<string, unknown>) { return _fetch("/nonconformities/" + id + "/qualify", { method: "POST", body: body }); },
    rejectNonconformity: function(id: string, note: string) { return _fetch("/nonconformities/" + id + "/reject", { method: "POST", body: { note: note } }); },
    closeNonconformity: function(id: string, evidence: string) { return _fetch("/nonconformities/" + id + "/close", { method: "POST", body: { closure_evidence: evidence } }); },
    listDerogations: function(filters?: Record<string, string>) {
        var parts: string[] = [];
        if (_pid()) parts.push("project_id=" + encodeURIComponent(_pid()));
        if (filters) for (var k in filters) if (filters[k]) parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(filters[k]));
        return _fetch("/derogations" + (parts.length ? "?" + parts.join("&") : ""));
    },
    createDerogation: function(body: Record<string, unknown>) { return _fetch("/derogations", { method: "POST", body: Object.assign({ project_id: _pid() }, body) }); },
    decideDerogation: function(id: string, approve: boolean, note: string) { return _fetch("/derogations/" + id + "/decision", { method: "POST", body: { approve: approve, note: note } }); },
    revokeDerogation: function(id: string, reason: string) { return _fetch("/derogations/" + id + "/revoke", { method: "POST", body: { reason: reason } }); },
    patchNonconformity: function(id: string, body: Record<string, unknown>) { return _fetch("/nonconformities/" + id, { method: "PATCH", body: body }); },
    nonconformitySettings: function() { return _fetch("/nonconformities-settings"); },
    saveNonconformitySettings: function(days: number) { return _fetch("/nonconformities-settings", { method: "PUT", body: { max_derogation_days: days } }); },
};

// Backward compat for ai_common.js
window.VendorAPI = window.ComplianceAPI;
window.RiskAPI = window.ComplianceAPI;

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE ADAPTER
// ═══════════════════════════════════════════════════════════════
// See cisotoolbox_local.js for the contract and
// the persistence adapter contract for the full specification.

window._setDataReady = function() { _dataReady = true; };
window._getActiveProjectId = function() { return _activeId; };



function _obj(k: string, v: any): Record<string, any> { var o: Record<string, any> = {}; o[k] = v; return o; }
// Exposed globally so Compliance_app.js (a separate script) can build persist
// deltas — mirrors the opensource cisotoolbox_local.js. Without this,
// _updatePreuveField et al. threw "ReferenceError: _obj is not defined".
(window as any)._obj = _obj;

var _dirty: Record<string, Record<string, any>> = {};
// FEAT-33 — server_rev seen at load; sent with the blob PUT (409 = a
// server-initiated write happened since: reload instead of overwrite).
var _serverRev = 0;
var _flushTimer: ReturnType<typeof setTimeout> | null = null;

// FEAT-73 — the status is the server's: reloaded once the writes in flight
// have landed, and shown if it changed.
var _statusTimer: ReturnType<typeof setTimeout> | null = null;
var _writesInFlight = 0;
// Only the answer to the latest request is shown: an older one, late, would
// put back a status that is no longer true.
var _statusSeq = 0;
// An unreachable status is asked again (2, 4, 8 s), then said: figures shown
// without it would pass for the real ones.
var _statusRetry = 0;
var STATUS_RETRIES = [2000, 4000, 8000];
function _loadStatus(id: string, render: boolean): Promise<void> {
    var seq = ++_statusSeq;
    // Only a failed request is retried: an error while showing the answer is
    // not an unreachable status.
    return ComplianceAPI.status(id).then(function(s) {
        if (seq !== _statusSeq) return;
        _statusRetry = 0;
        if (window._applyStatus) window._applyStatus(s, render);
    }, function() {
        if (seq !== _statusSeq) return;
        if (_statusRetry < STATUS_RETRIES.length) {
            setTimeout(function() { if (seq === _statusSeq) _loadStatus(id, true); }, STATUS_RETRIES[_statusRetry++]);
        } else {
            _statusRetry = 0;
            showStatus(t("comp.status.unreachable"), true);
        }
    });
}
function _refreshStatus(): void {
    if (_statusTimer) clearTimeout(_statusTimer);
    _statusTimer = setTimeout(function() {
        _statusTimer = null;
        if (!_activeId || _writesInFlight > 0) return;
        _loadStatus(_activeId, true);
    }, 150);
}
window._refreshStatus = _refreshStatus;
function _write<T>(p: Promise<T>): Promise<T> {
    _writesInFlight++;
    return p.finally(function() { _writesInFlight--; _refreshStatus(); });
}

// Mapping from D property names to API entity types
// D.referentiels → controls, D.mesures → measures, D.preuves → proofs
var _PATCH_FNS: Record<string, ((id: string | number, f: Record<string, unknown>) => Promise<unknown>) | undefined> = {
    control:  function(id, f) { return ComplianceAPI.patchControl(_activeId!, id, f); },
    measure:  function(id, f) { return ComplianceAPI.patchMeasure(_activeId!, id, f); },
    proof:    function(id, f) { return ComplianceAPI.patchProof(_activeId!, id, f); },
};

function _flushDirty(): void {
    if (_flushTimer) clearTimeout(_flushTimer);
    _flushTimer = setTimeout(function() {
        if (!_activeId || !_dataReady) return;
        var batch = _dirty;
        _dirty = {};
        for (var key in batch) {
            var parts = key.split(":");
            var type = parts[0]!, id = parts[1]!;
            var fn = _PATCH_FNS[type];
            if (fn) {
                _write(fn(id, batch[key]!)).catch(ct_changeFailed);
            }
        }
    }, 500);
}

window._persist = function(entityType, entityId, fields) {
    if (!_dataReady || !_activeId) return;
    var fn = _PATCH_FNS[entityType];
    if (fn && entityId) {
        var key = entityType + ":" + entityId;
        if (!_dirty[key]) _dirty[key] = {};
        Object.assign(_dirty[key]!, fields);
        _flushDirty();
    } else {
        _autoSave();
    }
};

window._persistCreate = function(entityType, data) {
    if (!_dataReady || !_activeId) return;
    var CREATE_FNS: Record<string, (d: Record<string, unknown>) => Promise<unknown>> = {
        control: function(d) { return ComplianceAPI.createControl(_activeId!, d); },
        measure: function(d) { return ComplianceAPI.createMeasure(_activeId, d); },
        proof:   function(d) { return ComplianceAPI.createProof(_activeId!, d); },
    };
    var fn = CREATE_FNS[entityType];
    if (fn) _write(fn(data)).catch(ct_changeFailed);
    else _autoSave();
};

window._persistDelete = function(entityType, entityId) {
    if (!_dataReady || !_activeId) return;
    var DELETE_FNS: Record<string, (id: string | number) => Promise<unknown>> = {
        control: function(id) { return ComplianceAPI.deleteControl(_activeId!, id); },
        measure: function(id) { return ComplianceAPI.deleteMeasure(_activeId!, id); },
        proof:   function(id) { return ComplianceAPI.deleteProof(_activeId!, id); },
    };
    var fn = DELETE_FNS[entityType];
    if (fn) _write(fn(entityId)).catch(ct_changeFailed);
    else _autoSave();
};

// Blob PUT fallback — used by bulk ops and unmigrated mutation sites
window._autoSave = function() {
    if (!_dataReady) return;
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function() {
        _saveTimer = null;  // FEAT-33: a fired timer must not keep blocking the focus refresh
        if (!_activeId) return;
        var name = (D.meta && D.meta.societe) || "";
        _write(ComplianceAPI.update(_activeId, { name: name, data: JSON.parse(JSON.stringify(D)),
                                                 expected_server_rev: _serverRev } as any))
            .catch(_onSaveError);
    }, 500);
};

// FEAT-33 — a stale blob PUT is refused (reload: the stale bulk change is
// lost by design); any other refusal says the server's reason. Both are told
// by ct_projectSaveFailed (shared).
function _onSaveError(err: any): void {
    if (ct_projectSaveFailed(err)) return;
    console.error("Autosave failed:", err);
}

// FEAT-73 — the server wrote in the project (a collected proof, a locked
// recurrence): reload its data and its status, then redraw — unless the
// caller redraws only what changed (`redraw: false`).
window._reloadData = function(opts?: { redraw?: boolean }): Promise<void> {
    if (!_activeId) return Promise.resolve();
    return ComplianceAPI.get(_activeId).then(function(project) {
        _serverRev = project.server_rev || 0;
        var pdata = typeof project.data === "string" ? JSON.parse(project.data) : (project.data || {});
        Object.keys(D).forEach(function(k) { delete (D as unknown as Record<string, unknown>)[k]; });
        Object.assign(D, pdata);
        return _loadStatus(_activeId!, false);
    }).then(function() { if ((!opts || opts.redraw !== false) && typeof renderAll === "function") renderAll(); });
};

// FEAT-33 — refresh on tab focus when a server-initiated write happened
// while the tab was hidden. Skipped while local edits are in flight.
document.addEventListener("visibilitychange", function() {
    if (document.visibilityState !== "visible" || !_activeId || !_dataReady) return;
    _refreshStatus();       // FEAT-73: a decision taken in Pilot meanwhile
    if (Object.keys(_dirty).length || _saveTimer) return;
    ComplianceAPI.get(_activeId).then(function(project) {
        if ((project.server_rev || 0) === _serverRev) return;
        _serverRev = project.server_rev || 0;
        var pdata = typeof project.data === "string" ? JSON.parse(project.data) : (project.data || {});
        Object.keys(D).forEach(function(k) { delete (D as unknown as Record<string, unknown>)[k]; });
        Object.assign(D, pdata);
        if (typeof renderAll === "function") renderAll();
        _refreshStatus();
        showStatus(t("chrome.stale_refreshed"));
    }).catch(function() { /* offline — ignore */ });
});

// Init: load project from API
window._appInitCallback = function() {
    function _loadAndRender(id: string): void {
        // The project decides what is shown; its status, asked at the same
        // time, never fails the load (it would create a project).
        var status = _loadStatus(id, false);
        Promise.all([ComplianceAPI.get(id), status]).then(function(r) {
            var project = r[0];
            _activeId = project.id;
            _serverRev = project.server_rev || 0;
            localStorage.setItem("compliance_active_project", _activeId);
            var pdata = typeof project.data === "string" ? JSON.parse(project.data) : (project.data || {});
            Object.keys(D).forEach(function(k) { delete (D as unknown as Record<string, unknown>)[k]; });
            Object.assign(D, pdata);
            if (typeof window._setDataReady === "function") window._setDataReady();
            if (typeof _initDataAndRender === "function") _initDataAndRender();
            else if (typeof renderAll === "function") renderAll();
            _handleMeasureDeepLink();
            _handleRequirementDeepLink();
        }).catch(function() { _createAndRender(); });
    }

    function _createAndRender(): void {
        var initData = typeof window.COMPLIANCE_INIT_DATA !== "undefined" ? JSON.parse(JSON.stringify(window.COMPLIANCE_INIT_DATA)) : {};
        ComplianceAPI.create({ name: "", data: initData }).then(function(project) {
            _activeId = project.id;
            _refreshStatus();
            localStorage.setItem("compliance_active_project", _activeId);
            Object.keys(D).forEach(function(k) { delete (D as unknown as Record<string, unknown>)[k]; });
            Object.assign(D, initData);
            if (typeof window._setDataReady === "function") window._setDataReady();
            if (typeof _initDataAndRender === "function") _initDataAndRender();
            else if (typeof renderAll === "function") renderAll();
            _handleMeasureDeepLink();
            _handleRequirementDeepLink();
        });
    }

    // FEAT-45 — a record's requirement (?req=fw:ref) opens its framework's
    // requirements view with the row targeted.
    function _handleRequirementDeepLink(): void {
        var key = "";
        try { key = new URLSearchParams(location.search).get("req") || ""; } catch (e) { return; }
        if (key && typeof _openRequirement === "function") _openRequirement(key);
    }

    // FEAT-13 — open the deep-linked measure (Pilot ?measure=M-xxx) in the
    // native edit modal, on the action-plan panel.
    function _handleMeasureDeepLink(): void {
        if (typeof window.ct_handleMeasureDeepLink !== "function") return;
        window.ct_handleMeasureDeepLink({ open: function(mid: string) {
            var mesures = (D && (D as { mesures?: Array<{ id: string }> }).mesures) || [];
            if (!mesures.some(function(m) { return m.id === mid; })) return false;
            if (typeof selectPanel === "function") selectPanel("plan");
            if (typeof window._editMesureRow === "function") window._editMesureRow({ id: mid });
            return true;
        } });
    }

    // Single-project model (docs/CHANTIER_PROJET_UNIQUE.md): always load the
    // canonical project from the API. A stale localStorage id would 404 after
    // the collapse migration and spuriously create an empty project.
    ComplianceAPI.list().then(function(items) {
        if (items.length > 0) _loadAndRender(items[0]!.id);
        else _createAndRender();
    }).catch(function() { _createAndRender(); });
};

// ─── Toolbar user pill (name + admin + logout) ──────────────────
function _initAuth(): void {
    fetch("auth/providers").then(function(r) { return r.json(); }).then(function(data) {
        // No auth = full access, the server's own contract: publish the role
        // the gates would read, so the UI offers what the API accepts.
        if (!data.auth_enabled) { window._moduleRole = "admin"; document.dispatchEvent(new CustomEvent("ct-role-ready")); return; }
        fetch("auth/me", { credentials: "same-origin" }).then(function(r) {
            if (!r.ok) { var _rp = window.location.pathname.replace(/[^/]*$/, ""); window.location.href = "/login.html?redirect=" + encodeURIComponent(_rp); return; }
            return r.json();
        }).then(function(user: ComplianceAuthUser | undefined) {
            if (!user) return;
            window._currentUser = user;
            var right = document.getElementById("toolbar-right");
            if (!right) return;
            var h = _userPillHTML(user);
            var container = document.createElement("span");
            container.className = "ct-toolbar-user";
            container.innerHTML = h;
            right.parentNode!.insertBefore(container, right);
            fetch("auth/role", { credentials: "same-origin" }).then(function(rr) {
                return rr.ok ? rr.json() : {};
            }).then(function(roleInfo: { role?: string }) {
                var role = roleInfo.role || "";
                window._moduleRole = role;
                document.dispatchEvent(new CustomEvent("ct-role-ready"));
                if (role) document.body.classList.add("ct-role-" + role);
                if (user.role === "admin") document.body.classList.add("ct-role-admin");
            }).catch(function() {});
        });
    }).catch(function() {});
}
window._logout = function() {
    fetch("auth/logout", { method: "POST", credentials: "same-origin" })
        .finally(function() { window.location.href = "/auth/logout"; });
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", _initAuth);
else _initAuth();

// ═══════════════════════════════════════════════════════════════
// FRAMEWORK LOADING — define _ensureFramework against the DB-backed API.
// REFERENTIELS_META / renderSidebar / D are file-scoped in Compliance_app.ts;
// reached here through the shared runtime global object (typed window view).
// Framework payloads are dynamic JSON from the API, hence the loose typing.
// ═══════════════════════════════════════════════════════════════
(function() {
    var _fwCache: Record<string, ComplianceRefEntry> = {};
    var _g = window as Window & {
        REFERENTIELS_META?: Record<string, unknown>;
        renderSidebar?: () => void;
        D?: { meta?: unknown };
    };

    window._ensureFramework = function(fwId: string, cb: () => void): void {
        if (_fwCache[fwId]) {
            if (_g.REFERENTIELS_META) _g.REFERENTIELS_META[fwId] = _fwCache[fwId];
            if (window.COMPLIANCE_REF) window.COMPLIANCE_REF[fwId] = _fwCache[fwId];
            cb(); return;
        }
        fetch(BASE + "/frameworks/" + fwId).then(function(r) {
            return r.ok ? r.json() : null;
        }).then(function(fw: ComplianceRefEntry | null) {
            if (fw) {
                _fwCache[fwId] = fw;
                if (_g.REFERENTIELS_META) _g.REFERENTIELS_META[fwId] = fw;
                if (!window.COMPLIANCE_REF) window.COMPLIANCE_REF = {};
                window.COMPLIANCE_REF[fwId] = fw;
            }
            cb();
        }).catch(function() { cb(); });
    };

    // Load the framework catalog from the API at startup (dynamic JSON payload).
    fetch(BASE + "/frameworks").then(function(r) { return r.json(); }).then(function(list: Array<{ id: string; label: string; description: string; description_en: string; color: string; origin?: string; requirement_count: number }>) {
        if (!window._REFERENTIELS_CATALOG) window._REFERENTIELS_CATALOG = {};
        list.forEach(function(fw) {
            window._REFERENTIELS_CATALOG[fw.id] = {
                label: fw.label,
                description: fw.description,
                description_en: fw.description_en,
                color: fw.color,
                // FEAT-51 — what the organisation created is what it may
                // delete; the screen needs to tell the two apart.
                custom: fw.origin === "custom",
                requirement_count: fw.requirement_count
            };
            if (_g.REFERENTIELS_META && !_g.REFERENTIELS_META[fw.id]) {
                _g.REFERENTIELS_META[fw.id] = window._REFERENTIELS_CATALOG[fw.id];
            }
        });
        if (typeof _g.renderSidebar === "function" && _g.D && _g.D.meta) _g.renderSidebar();
    }).catch(function(e: unknown) { console.warn("Failed to load framework catalog from API:", e); });
})();

})();
