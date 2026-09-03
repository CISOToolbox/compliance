/**
 * Compliance — REST API Client Layer
 *
 * Single-project persistence via REST API.
 * Load BEFORE Compliance_app.js.
 */

/** Options de _fetch : RequestInit restreint, body objet JSON toléré. */
interface ComplianceFetchOpts {
    method?: string;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
    body?: BodyInit | Record<string, unknown> | null;
}

(function() {
"use strict";

var BASE = "api";
var _activeId: string | null = null;
var _saveTimer: ReturnType<typeof setTimeout> | null = null;
var _dataReady = false;

// Retour Promise<any> : réponses JSON non typées à la frontière réseau ;
// le typage est porté par ComplianceAPIShape (Compliance_types.d.ts).
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
    if (resp.status === 403) {
        var errBody = ""; try { errBody = await resp.text(); } catch(e) {}
        if (errBody.indexOf("pending") >= 0) { window.location.href = "/login.html?error=pending"; throw new Error("Account pending"); }
    }
    if (resp.status === 204) return null;
    if (!resp.ok) { var t = ""; try { t = await resp.text(); } catch(e) {} throw new Error("API " + resp.status + ": " + t.substring(0,200)); }
    return resp.json();
}

window.ComplianceAPI = {
    list: function() { return _fetch("/projects"); },
    get: function(id: string) { return _fetch("/projects/" + id); },
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
};

// Backward compat for ai_common.js
window.VendorAPI = window.ComplianceAPI;
window.RiskAPI = window.ComplianceAPI;

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE ADAPTER
// ═══════════════════════════════════════════════════════════════
// See shared/js/cisotoolbox_local.js for the contract and
// CLAUDE.md § "Persistence adapter" for the full specification.

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
                fn(id, batch[key]!).catch(function(e) { console.error("PATCH " + type + " " + id + " failed:", e); });
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
    if (fn) fn(data).catch(function(e) { console.error("POST " + entityType + " failed:", e); });
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
    if (fn) fn(entityId).catch(function(e) { console.error("DELETE " + entityType + " " + entityId + " failed:", e); });
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
        ComplianceAPI.update(_activeId, { name: name, data: JSON.parse(JSON.stringify(D)),
                                          expected_server_rev: _serverRev } as any)
            .catch(function(err: any) {
                if (err && String(err.message || "").indexOf("API 409") === 0) { _staleConflict(); return; }
                console.error("Autosave failed:", err);
            });
    }, 500);
};

// FEAT-33 — a stale blob PUT was refused: warn (blocking) then reload the
// authoritative server state. The stale bulk change is lost by design.
function _staleConflict(): void {
    alert(t("chrome.stale_conflict"));
    window.location.reload();
}

// FEAT-33 — refresh on tab focus when a server-initiated write happened
// while the tab was hidden. Skipped while local edits are in flight.
document.addEventListener("visibilitychange", function() {
    if (document.visibilityState !== "visible" || !_activeId || !_dataReady) return;
    if (Object.keys(_dirty).length || _saveTimer) return;
    ComplianceAPI.get(_activeId).then(function(project) {
        if ((project.server_rev || 0) === _serverRev) return;
        _serverRev = project.server_rev || 0;
        var pdata = typeof project.data === "string" ? JSON.parse(project.data) : (project.data || {});
        Object.keys(D).forEach(function(k) { delete (D as unknown as Record<string, unknown>)[k]; });
        Object.assign(D, pdata);
        if (typeof renderAll === "function") renderAll();
        showStatus(t("chrome.stale_refreshed"));
    }).catch(function() { /* offline — ignore */ });
});

// Init: load project from API
window._appInitCallback = function() {
    function _loadAndRender(id: string): void {
        ComplianceAPI.get(id).then(function(project) {
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
        }).catch(function() { _createAndRender(); });
    }

    function _createAndRender(): void {
        var initData = typeof window.COMPLIANCE_INIT_DATA !== "undefined" ? JSON.parse(JSON.stringify(window.COMPLIANCE_INIT_DATA)) : {};
        ComplianceAPI.create({ name: "", data: initData }).then(function(project) {
            _activeId = project.id;
            localStorage.setItem("compliance_active_project", _activeId);
            Object.keys(D).forEach(function(k) { delete (D as unknown as Record<string, unknown>)[k]; });
            Object.assign(D, initData);
            if (typeof window._setDataReady === "function") window._setDataReady();
            if (typeof _initDataAndRender === "function") _initDataAndRender();
            else if (typeof renderAll === "function") renderAll();
            _handleMeasureDeepLink();
        });
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
        if (!data.auth_enabled) return;
        fetch("auth/me", { credentials: "same-origin" }).then(function(r) {
            if (!r.ok) { var _rp = window.location.pathname.replace(/[^/]*$/, ""); window.location.href = "/login.html?redirect=" + encodeURIComponent(_rp); return; }
            return r.json();
        }).then(function(user: ComplianceAuthUser | undefined) {
            if (!user) return;
            window._currentUser = user;
            var right = document.getElementById("toolbar-right");
            if (!right) return;
            var h = "";
            h += '<span style="color:var(--ct-ink-1);font-size:var(--ct-text-label);margin:0 var(--ct-s1)">' + esc(user.name || user.email) + '</span>';
            h += '<button class="ct-text-label ct-muted ct-bg-none ct-no-border ct-clickable ct-py-1 ct-px-2" data-click="_logout" title="Sign out">&#x23FB;</button>';
            var container = document.createElement("span");
            container.className = "ct-toolbar-right";
            container.style.cssText = "display:flex;align-items:center;gap:4px;margin-left:auto";
            container.innerHTML = h;
            right.parentNode!.insertBefore(container, right);
            fetch("auth/role", { credentials: "same-origin" }).then(function(rr) {
                return rr.ok ? rr.json() : {};
            }).then(function(roleInfo: { role?: string }) {
                var role = roleInfo.role || "";
                window._moduleRole = role;
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
    fetch(BASE + "/frameworks").then(function(r) { return r.json(); }).then(function(list: Array<{ id: string; label: string; description: string; description_en: string; color: string; requirement_count: number }>) {
        if (!window._REFERENTIELS_CATALOG) window._REFERENTIELS_CATALOG = {};
        list.forEach(function(fw) {
            window._REFERENTIELS_CATALOG[fw.id] = {
                label: fw.label,
                description: fw.description,
                description_en: fw.description_en,
                color: fw.color,
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
