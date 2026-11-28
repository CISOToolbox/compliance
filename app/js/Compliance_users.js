// FEAT-74 — the users of the project, on screen.
//
// A first-level tab of the module: who works on the project, with the fields
// of Pilot's directory (nom, prénom, email, statut recrutement | actif |
// inactif, type de contrat interne | externe | alternant | stagiaire), and
// their accounts — a perimeter (GitHub, an application…), an
// account name and an optional role, as in Access. GH-04 matches the members
// of the connection's GitHub organization to the accounts on the GitHub
// perimeter. Entered by hand or imported from a CSV file; the server checks
// every entry. A user who leaves is marked "inactif"; deleting is for a
// mistake. In the suite, a project can follow Pilot's directory: the users
// Pilot sends keep its identity (read-only here) and only their accounts
// change in this tab.
// The user being entered in the window: its id when it exists, and its
// accounts as they stand in the window (saved with the user).
var _usr = { list: [], editing: null, accounts: [], source: null, syncing: false };
var _usrSeq = 0;
function _usrT(key, params) { return t("comp.users." + key, params); }
function renderUsers() {
    if (!document.getElementById("users-content") || !window.ComplianceAPI)
        return;
    const seq = ++_usrSeq;
    const api = window.ComplianceAPI;
    Promise.all([api.listSiUsers(), _mon.collectors ? Promise.resolve(_mon.collectors) : api.collectors(),
        api.siUsersSource().catch(function () { return null; })]).then(function (r) {
        if (seq !== _usrSeq)
            return;
        _usr.list = r[0];
        _mon.collectors = r[1];
        _usr.source = r[2];
        _usrDraw();
    }).catch(function (err) { if (seq === _usrSeq)
        _monFail(err); });
}
function _usrDraw() {
    const el = document.getElementById("users-content");
    if (el)
        el.innerHTML = _usrHtml();
}
/** One account in the list: its perimeter, then its name, then its role. */
function _usrAccountLabel(a) {
    return '<span class="fw-600">' + esc(a.perimetre) + '</span> <span class="ct-mono">' + esc(a.compte) + '</span>'
        + (a.role ? ' <span class="text-muted">· ' + esc(a.role) + '</span>' : '');
}
function _usrFromPilot(u) { return !!u && u.sync_source === "pilot"; }
/** In the suite: whether the project follows Pilot's directory, and the
 *  actions on it. Nothing in standalone. */
function _usrSourceHtml() {
    const src = _usr.source;
    if (!src || !src.pilot_available)
        return "";
    let h = '<div class="ct-synth-card ct-mb-3" id="users-source"><div class="ct-flex ct-gap-2 ct-items-center">'
        + '<span class="ct-flex-1">' + esc(_usrT(src.pilot_sync ? "pilot_on" : "pilot_off")) + '</span>';
    if (src.pilot_sync) {
        h += '<button class="ct-btn" data-write data-size="sm" data-click="_usrSyncNow"' + (_usr.syncing ? " disabled" : "") + '>'
            + esc(_usr.syncing ? _usrT("syncing") : _usrT("btn_sync_now")) + '</button>'
            + '<button class="ct-btn" data-write data-size="sm" data-click="_usrFollowPilot" data-args=\'' + _da(false) + '\'>' + esc(_usrT("btn_unfollow")) + '</button>';
    }
    else {
        h += '<button class="ct-btn" data-write data-variant="primary" data-size="sm" data-click="_usrFollowPilot" data-args=\'' + _da(true) + '\'>' + esc(_usrT("btn_follow")) + '</button>';
    }
    return h + '</div><p class="fs-xs text-muted ct-mt-1">' + esc(_usrT("pilot_hint")) + '</p>' + _monErrorSlot("users-source-error") + '</div>';
}
function _usrHtml() {
    let h = _usrSourceHtml() + '<div class="ct-synth-card ct-mb-3">';
    if (_usr.list.length) {
        h += '<table class="ct-w-full"><thead><tr><th>' + esc(_usrT("col_nom")) + '</th><th>' + esc(_usrT("col_prenom")) + '</th><th>' + esc(_usrT("col_email")) + '</th><th>'
            + esc(_usrT("col_status")) + '</th><th>' + esc(_usrT("col_contract")) + '</th><th>' + esc(_usrT("col_accounts")) + '</th><th></th></tr></thead><tbody>';
        _usr.list.forEach(function (u) {
            const status = _tBadge(_usrT("statut." + u.statut), u.statut === "inactif" ? "gray" : (u.statut === "recrutement" ? "blue" : "green"))
                + (u.date_depart ? ' <span class="fs-xs text-muted">' + esc(_usrT("left_on_date", { date: u.date_depart })) + '</span>' : '');
            const accounts = (u.comptes || []).map(function (a) { return '<div class="fs-xs">' + _usrAccountLabel(a) + '</div>'; }).join("") || "—";
            const pilot = _usrFromPilot(u);
            h += '<tr data-si-user="' + esc(u.email) + '"><td>' + esc(u.nom || "—") + '</td><td>' + esc(u.prenom || "—") + '</td><td>' + esc(u.email)
                + (pilot ? ' ' + _tBadge(_usrT("badge_pilot"), "blue") : '') + '</td><td>' + status
                + '</td><td>' + esc(_usrT("contrat." + (u.type_contrat || "interne"))) + '</td><td>' + accounts + '</td><td class="ct-ta-r ct-nowrap">'
                + '<button class="ct-btn" data-write data-size="xs" data-click="_usrEdit" data-args=\'' + _da(u.id) + '\'>' + esc(_monT("btn_edit")) + '</button>'
                + (pilot ? '' : ' <button class="ct-btn" data-write data-variant="danger" data-size="xs" data-click="_usrDelete" data-args=\'' + _da(u.id) + '\'>' + esc(_monT("btn_delete")) + '</button>')
                + '</td></tr>';
        });
        h += '</tbody></table>';
    }
    else {
        h += '<p class="text-muted fs-xs">' + esc(_usrT("none")) + '</p>';
    }
    h += '<div class="ct-flex ct-gap-1 ct-mt-2">'
        + '<button class="ct-btn" data-write data-variant="primary" data-size="sm" data-click="_usrAdd">' + esc(_usrT("btn_add")) + '</button>'
        + '<button class="ct-btn" data-write data-size="sm" data-click="_usrImport">' + esc(_usrT("btn_import")) + '</button></div>'
        + '<p class="fs-xs text-muted ct-mt-1">' + esc(_usrT("csv_hint")) + '</p>' + _monErrorSlot("users-import-error");
    return h + '</div>';
}
/** The window's body: the user's fields, their accounts, and a line to add one. */
function _usrFormHtml(u) {
    const v = u || { email: "", nom: "", prenom: "", statut: "actif", type_contrat: "interne", date_depart: "" };
    const ro = _usrFromPilot(u) ? " disabled" : ""; // Pilot's identity: read-only here
    return (ro ? '<p class="fs-xs text-muted">' + esc(_usrT("from_pilot_hint")) + '</p>' : '')
        + '<div class="ct-form-grid">'
        + '<label class="fs-xs ct-col-span-2">' + esc(_usrT("col_email")) + ' *<input type="email" id="users-email" class="ct-w-full" value="' + esc(v.email) + '" autocomplete="off"' + ro + ' /></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_nom")) + '<input type="text" id="users-nom" class="ct-w-full" value="' + esc(v.nom) + '"' + ro + ' /></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_prenom")) + '<input type="text" id="users-prenom" class="ct-w-full" value="' + esc(v.prenom) + '"' + ro + ' /></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_status")) + '<select id="users-statut" class="ct-w-full"' + ro + '>'
        + ["recrutement", "actif", "inactif"].map(function (s) { return '<option value="' + s + '"' + (s === v.statut ? " selected" : "") + '>' + esc(_usrT("statut." + s)) + '</option>'; }).join("")
        + '</select></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_contract")) + '<select id="users-type-contrat" class="ct-w-full"' + ro + '>'
        + ["interne", "externe", "alternant", "stagiaire"].map(function (c) { return '<option value="' + c + '"' + (c === (v.type_contrat || "interne") ? " selected" : "") + '>' + esc(_usrT("contrat." + c)) + '</option>'; }).join("")
        + '</select></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_left_on")) + '<input type="date" id="users-date-depart" class="ct-w-full" value="' + esc(v.date_depart || "") + '"' + ro + ' /></label>'
        + '</div>'
        + '<h4 class="ct-mt-3">' + esc(_usrT("col_accounts")) + '</h4>'
        + '<div id="users-accounts">' + _usrAccountsHtml() + '</div>'
        + '<div class="ct-form-grid ct-mt-2">'
        + '<div class="fs-xs ct-col-span-2">' + esc(_usrT("col_perimeter")) + '<div id="users-acc-perimeter-wrap">' + _usrPerimeterPicker() + '</div></div>'
        + '<label class="fs-xs">' + esc(_usrT("col_account")) + '<input type="text" id="users-acc-account" class="ct-w-full ct-mono" autocomplete="off" autocapitalize="off" spellcheck="false" /></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_role")) + '<input type="text" id="users-acc-role" class="ct-w-full" autocomplete="off" /></label>'
        + '<div class="ct-col-span-2 ct-flex ct-justify-end"><button class="ct-btn" data-write data-size="sm" data-click="_usrAccountAdd">' + esc(_usrT("btn_add_account")) + '</button></div>'
        + '</div>'
        + '<p class="fs-xs text-muted ct-mt-1">' + esc(_usrT("perimeter_hint")) + '</p>' + _monErrorSlot("users-acc-error")
        + _monErrorSlot("users-form-error");
}
/** The accounts of the user in the window: a small table, each line with its removal. */
function _usrAccountsHtml() {
    if (!_usr.accounts.length)
        return '<p class="text-muted fs-xs">' + esc(_usrT("no_account")) + '</p>';
    return '<table class="fs-xs"><thead><tr><th>' + esc(_usrT("col_perimeter")) + '</th><th>' + esc(_usrT("col_account")) + '</th><th>'
        + esc(_usrT("col_role")) + '</th><th></th></tr></thead><tbody>'
        + _usr.accounts.map(function (a, i) {
            return '<tr data-account="' + esc(a.perimetre + "/" + a.compte) + '"><td class="fw-600">' + esc(a.perimetre) + '</td><td class="ct-mono">' + esc(a.compte)
                + '</td><td>' + esc(a.role || "—") + '</td><td><button class="ct-btn" data-write data-variant="danger" data-size="xs" data-icon title="'
                + esc(_usrT("btn_remove_account")) + '" aria-label="' + esc(_usrT("btn_remove_account")) + '" data-click="_usrAccountRemove" data-args=\'' + _da(i) + '\'>'
                + _icon("trash", 14) + '</button></td></tr>';
        }).join("")
        + '</tbody></table>';
}
function _usrRedrawAccounts() {
    const el = document.getElementById("users-accounts");
    if (el)
        el.innerHTML = _usrAccountsHtml();
}
/** The perimeters to pick from: the providers whose collectors read the
 *  users' accounts (GitHub for GH-04), which look for them under that exact
 *  name, then those already given to an account of the project. */
function _usrPerimeters() {
    const seen = {};
    const cat = _mon.collectors || {};
    (cat.providers || []).forEach(function (p) {
        const reads = (cat.collectors || []).some(function (c) { return c.provider === p.provider && (c.needs || []).indexOf("users") >= 0; });
        const name = (p.label && p.label.en) || p.provider;
        if (reads && name)
            seen[name.toLowerCase()] = name;
    });
    _usr.list.concat([{ comptes: _usr.accounts }]).forEach(function (u) {
        (u.comptes || []).forEach(function (a) { if (!seen[a.perimetre.toLowerCase()])
            seen[a.perimetre.toLowerCase()] = a.perimetre; });
    });
    return Object.keys(seen).sort().map(function (k) { return seen[k]; });
}
/** The perimeter of the account being added: one already given to an account
 *  of the project, or a new one typed in the picker's search ("+ create" row
 *  of the socle ct_refselect). */
var _usrPerimeter = "";
const _USR_PERIMETER_PICKER = "users-acc-perimeter";
function _usrPerimeterPicker() {
    const known = _usrPerimeters();
    if (_usrPerimeter && known.indexOf(_usrPerimeter) < 0)
        known.push(_usrPerimeter);
    const options = known.map(function (p) { return { id: p, label: p }; });
    return window.ctRefSelect ? window.ctRefSelect(_USR_PERIMETER_PICKER, _usrPerimeter, options, {
        single: true, hideId: true, placeholder: _usrT("perimeter_search"), emptyText: _usrT("perimeter_pick"),
        createLabel: _usrT("perimeter_create"),
    }) : "";
}
function _usrRedrawPerimeter() {
    const wrap = document.getElementById("users-acc-perimeter-wrap");
    if (wrap)
        wrap.innerHTML = _usrPerimeterPicker();
}
function _usrRegisterPicker() {
    if (!window.ctRefRegister)
        return;
    window.ctRefRegister(_USR_PERIMETER_PICKER, {
        single: true, hideId: true, emptyText: _usrT("perimeter_pick"),
        labelFor: function (id) { return id; },
        onToggle: function (_u, ids) { _usrPerimeter = ids[0] || ""; },
        onRemove: function () { _usrPerimeter = ""; _usrRedrawPerimeter(); },
        onCreate: function (_u, query) {
            const typed = query.trim();
            if (!typed)
                return;
            const slot = document.getElementById("users-acc-error");
            if (typed.indexOf(",") >= 0 || typed.indexOf(" - ") >= 0) {
                if (slot)
                    slot.textContent = _usrT("perimeter_chars");
                return;
            }
            if (slot)
                slot.textContent = "";
            // the same name in another case is the existing perimeter
            const same = _usrPerimeters().find(function (p) { return p.toLowerCase() === typed.toLowerCase(); });
            _usrPerimeter = same || typed;
            _usrRedrawPerimeter();
        },
    });
}
/** What the add line holds: nothing, an account ready to join the list, or
 *  the reason it cannot. */
function _usrPendingAccount() {
    const acc = { perimetre: _usrPerimeter, compte: _usrValue("users-acc-account"), role: _usrValue("users-acc-role") };
    if (!acc.perimetre && !acc.compte && !acc.role)
        return {};
    if (!acc.perimetre || !acc.compte)
        return { error: _usrT("account_required") };
    const twice = _usr.accounts.some(function (a) {
        return a.perimetre.toLowerCase() === acc.perimetre.toLowerCase() && a.compte.toLowerCase() === acc.compte.toLowerCase();
    });
    if (twice)
        return { error: _usrT("account_twice") };
    return { account: acc };
}
/** The add line of the window: the account joins the list, the line empties.
 *  False when it holds a reason not to. */
function _usrAccountAdd() {
    const pending = _usrPendingAccount();
    const slot = document.getElementById("users-acc-error");
    if (pending.error) {
        if (slot)
            slot.textContent = pending.error;
        return false;
    }
    if (slot)
        slot.textContent = "";
    if (!pending.account)
        return true;
    _usr.accounts.push(pending.account);
    _usrPerimeter = "";
    _usrRedrawAccounts();
    _usrRedrawPerimeter();
    ["users-acc-account", "users-acc-role"].forEach(function (id) { const el = document.getElementById(id); if (el)
        el.value = ""; });
    return true;
}
function _usrAccountRemove(i) { _usr.accounts.splice(i, 1); _usrRedrawAccounts(); }
function _usrValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}
/** The standard window for a user, new (`u` null) or existing. */
function _usrOpen(u) {
    if (!window.ct_modal)
        return;
    _usr.editing = u ? u.id : null;
    _usr.accounts = ((u && u.comptes) || []).map(function (a) { return { perimetre: a.perimetre, compte: a.compte, role: a.role || "" }; });
    _usrPerimeter = "";
    _usrRegisterPicker();
    window.ct_modal.open({
        title: u ? _usrT("edit_title") : _usrT("btn_add"), body: _usrFormHtml(u),
        buttons: [
            { id: "cancel", label: _monT("btn_cancel") },
            { id: "save", primary: true, label: _monT("btn_save"), result: function () { _usrSave(); return false; } },
        ],
    }).then(function () { _usr.editing = null; _usr.accounts = []; });
}
function _usrAdd() { _usrOpen(null); }
function _usrEdit(id) {
    const u = _usr.list.find(function (x) { return x.id === id; });
    if (u)
        _usrOpen(u);
}
/** Saved from the window, which stays open with the reason when refused. An
 *  account left on the add line is saved with the user, not dropped. */
function _usrSave() {
    const formError = document.getElementById("users-form-error");
    if (formError)
        formError.textContent = ""; // the last refusal no longer stands
    if (!_usrAccountAdd())
        return;
    const statut = _usrValue("users-statut");
    const current = _usr.list.find(function (x) { return x.id === _usr.editing; });
    // A user from Pilot sends its accounts only: the rest is Pilot's.
    const body = _usrFromPilot(current) ? { comptes: _usr.accounts } : {
        email: _usrValue("users-email"), nom: _usrValue("users-nom"), prenom: _usrValue("users-prenom"), statut: statut,
        type_contrat: _usrValue("users-type-contrat"),
        date_depart: statut === "inactif" ? (_usrValue("users-date-depart") || null) : null, comptes: _usr.accounts
    };
    const api = window.ComplianceAPI;
    const done = _usr.editing ? api.updateSiUser(_usr.editing, body) : api.createSiUser(body);
    done.then(function () {
        if (window.ct_modal)
            window.ct_modal.close();
        renderUsers();
    }).catch(_monFormFail("users-form-error"));
}
function _usrDelete(id) {
    if (!confirm(_usrT("confirm_delete")))
        return;
    window.ComplianceAPI.deleteSiUser(id).then(function () { renderUsers(); }).catch(_monFail);
}
function _usrImport() {
    const fi = document.createElement("input");
    fi.type = "file";
    fi.accept = ".csv,.tsv,.txt";
    fi.onchange = function () {
        if (!fi.files || !fi.files[0])
            return;
        const reader = new FileReader();
        reader.onload = function () {
            const text = String(reader.result || "");
            if (text.length > 1000000) { // the server's limit, said before sending
                const slot = document.getElementById("users-import-error");
                if (slot)
                    slot.textContent = _usrT("csv_too_large");
                return;
            }
            window.ComplianceAPI.importSiUsers(text).then(function (res) {
                showStatus(_usrT("imported", { created: res.created, updated: res.updated, unchanged: res.unchanged }));
                renderUsers();
            }).catch(_monFormFail("users-import-error"));
        };
        reader.readAsText(fi.files[0]);
    };
    fi.click();
}
/** Follow Pilot's directory (read at once), or stop following it (its users
 *  stay, as the project's own). */
function _usrFollowPilot(on) {
    if (!confirm(_usrT(on ? "confirm_follow" : "confirm_unfollow")))
        return;
    window.ComplianceAPI.setSiUsersSource(on).then(function (res) {
        if (on && res.counts)
            showStatus(_usrT("synced", _usrCounts(res.counts)) + _usrRefused(res.counts));
        renderUsers();
    }).catch(_monFormFail("users-source-error"));
}
function _usrCounts(c) {
    return { created: c.created || 0, updated: c.updated || 0, deleted: c.deleted || 0 };
}
/** The people of Pilot the project could not take, said after the counts. */
function _usrRefused(c) {
    const n = (c.invalid || 0) + (c.skipped || 0);
    return n ? " — " + _usrT("sync_refused", { n: n }) : "";
}
function _usrSyncNow() {
    if (_usr.syncing)
        return;
    _usr.syncing = true;
    _usrDraw();
    window.ComplianceAPI.syncSiUsers().then(function (c) {
        _usr.syncing = false;
        showStatus(_usrT("synced", _usrCounts(c)) + _usrRefused(c));
        renderUsers();
    }).catch(function (err) {
        _usr.syncing = false;
        _usrDraw(); // redrawn first: the reason stays shown
        _monFormFail("users-source-error")(err);
    });
}
