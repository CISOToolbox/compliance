// FEAT-74 — the users of the project, on screen.
//
// A first-level tab of the module: who works on the project, whether they
// are still present, and their accounts — a perimeter (a GitHub
// organization, an application…), an account name and an optional role, as
// in Access. GH-04 matches the members of an organization to the accounts of
// the perimeter its connection names. Entered by hand or imported from a CSV
// file; the server checks every entry. A user who leaves is marked "left";
// deleting is for a mistake.
var _usr = { list: [], editing: null, adding: false, accounts: [] };
var _usrSeq = 0;
function _usrT(key, params) { return t("comp.users." + key, params); }
function renderUsers() {
    if (!document.getElementById("users-content") || !window.ComplianceAPI)
        return;
    const seq = ++_usrSeq;
    window.ComplianceAPI.listSiUsers().then(function (list) {
        if (seq !== _usrSeq)
            return;
        _usr.list = list;
        _usrDraw();
    }).catch(function (err) { if (seq === _usrSeq)
        _monFail(err); });
}
function _usrDraw() {
    const el = document.getElementById("users-content");
    if (el)
        el.innerHTML = _usrHtml();
}
function _usrAccountLabel(a) {
    return esc(a.perimeter) + ' · <span class="ct-mono">' + esc(a.account) + '</span>' + (a.role ? ' <span class="text-muted">(' + esc(a.role) + ')</span>' : '');
}
function _usrHtml() {
    let h = '<div class="ct-synth-card ct-mb-3">';
    if (_usr.list.length) {
        h += '<table><thead><tr><th>' + esc(_usrT("col_name")) + '</th><th>' + esc(_usrT("col_email")) + '</th><th>'
            + esc(_usrT("col_status")) + '</th><th>' + esc(_usrT("col_accounts")) + '</th><th></th></tr></thead><tbody>';
        _usr.list.forEach(function (u) {
            if (_usr.editing === u.id) {
                h += '<tr><td colspan="5">' + _usrFormHtml(u) + '</td></tr>';
                return;
            }
            const status = _tBadge(_usrT("status." + u.status), u.status === "present" ? "green" : "gray")
                + (u.left_on ? ' <span class="fs-xs text-muted">' + esc(_usrT("left_on_date", { date: u.left_on })) + '</span>' : '');
            const accounts = (u.accounts || []).map(function (a) { return '<div class="fs-xs">' + _usrAccountLabel(a) + '</div>'; }).join("") || "—";
            h += '<tr data-si-user="' + esc(u.email) + '"><td>' + esc(u.name || "—") + '</td><td>' + esc(u.email) + '</td><td>' + status
                + '</td><td>' + accounts + '</td><td class="ct-flex ct-gap-1">'
                + '<button class="ct-btn" data-write data-size="xs" data-click="_usrEdit" data-args=\'' + _da(u.id) + '\'>' + esc(_monT("btn_edit")) + '</button>'
                + '<button class="ct-btn" data-write data-variant="danger" data-size="xs" data-click="_usrDelete" data-args=\'' + _da(u.id) + '\'>' + esc(_monT("btn_delete")) + '</button></td></tr>';
        });
        h += '</tbody></table>';
    }
    else {
        h += '<p class="text-muted fs-xs">' + esc(_usrT("none")) + '</p>';
    }
    if (_usr.adding) {
        h += _usrFormHtml(null);
    }
    else if (!_usr.editing) {
        h += '<div class="ct-flex ct-gap-1 ct-mt-2">'
            + '<button class="ct-btn" data-write data-variant="primary" data-size="sm" data-click="_usrAdd">' + esc(_usrT("btn_add")) + '</button>'
            + '<button class="ct-btn" data-write data-size="sm" data-click="_usrImport">' + esc(_usrT("btn_import")) + '</button></div>'
            + '<p class="fs-xs text-muted ct-mt-1">' + esc(_usrT("csv_hint")) + '</p>' + _monErrorSlot("users-import-error");
    }
    return h + '</div>';
}
function _usrFormHtml(u) {
    const v = u || { email: "", name: "", status: "present", left_on: "" };
    return '<div class="ct-form-grid ct-mt-2">'
        + '<label class="fs-xs">' + esc(_usrT("col_email")) + ' *<input type="email" id="users-email" class="ct-w-full" value="' + esc(v.email) + '" autocomplete="off" /></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_name")) + '<input type="text" id="users-name" class="ct-w-full" value="' + esc(v.name) + '" /></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_status")) + '<select id="users-status" class="ct-w-full">'
        + ["present", "left"].map(function (s) { return '<option value="' + s + '"' + (s === v.status ? " selected" : "") + '>' + esc(_usrT("status." + s)) + '</option>'; }).join("")
        + '</select></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_left_on")) + '<input type="date" id="users-left-on" class="ct-w-full" value="' + esc(v.left_on || "") + '" /></label>'
        + '<div class="fs-xs ct-col-span-2">' + esc(_usrT("col_accounts")) + '<div id="users-accounts">' + _usrAccountsHtml() + '</div>'
        + '<button class="ct-btn ct-mt-1" data-write data-size="xs" data-click="_usrAccountAdd">' + esc(_usrT("btn_add_account")) + '</button></div>'
        + '</div>' + _monErrorSlot("users-form-error")
        + '<div class="ct-flex ct-gap-1 ct-mt-1"><button class="ct-btn" data-write data-variant="primary" data-size="sm" data-click="_usrSave">' + esc(_monT("btn_save")) + '</button>'
        + '<button class="ct-btn" data-size="sm" data-click="_usrCancel">' + esc(_monT("btn_cancel")) + '</button></div>';
}
/** The accounts of the user being entered, each with its removal. */
function _usrAccountsHtml() {
    if (!_usr.accounts.length)
        return '<div class="text-muted">' + esc(_usrT("no_account")) + '</div>';
    return _usr.accounts.map(function (a, i) {
        return '<div class="ct-flex ct-gap-1 ct-items-center ct-mt-1" data-account="' + esc(a.perimeter + "/" + a.account) + '"><span class="ct-flex-1">' + _usrAccountLabel(a) + '</span>'
            + '<button class="ct-btn" data-write data-variant="danger" data-size="xs" data-click="_usrAccountRemove" data-args=\'' + _da(i) + '\'>' + esc(_usrT("btn_remove_account")) + '</button></div>';
    }).join("");
}
function _usrRedrawAccounts() {
    const el = document.getElementById("users-accounts");
    if (el)
        el.innerHTML = _usrAccountsHtml();
}
/** The perimeters already given to an account of the project, to pick from. */
function _usrPerimeters() {
    const seen = {};
    _usr.list.concat([{ accounts: _usr.accounts }]).forEach(function (u) {
        (u.accounts || []).forEach(function (a) { if (!seen[a.perimeter.toLowerCase()])
            seen[a.perimeter.toLowerCase()] = a.perimeter; });
    });
    return Object.keys(seen).sort().map(function (k) { return seen[k]; });
}
function _usrAccountAdd() {
    if (!window.ct_modal)
        return;
    const body = '<div class="ct-form-grid">'
        + '<label class="fs-xs ct-col-span-2">' + esc(_usrT("col_perimeter")) + ' *<input type="text" id="users-acc-perimeter" class="ct-w-full" list="users-perimeters" autocomplete="off" />'
        + '<datalist id="users-perimeters">' + _usrPerimeters().map(function (p) { return '<option value="' + esc(p) + '"></option>'; }).join("") + '</datalist></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_account")) + ' *<input type="text" id="users-acc-account" class="ct-w-full ct-mono" autocomplete="off" autocapitalize="off" spellcheck="false" /></label>'
        + '<label class="fs-xs">' + esc(_usrT("col_role")) + '<input type="text" id="users-acc-role" class="ct-w-full" autocomplete="off" /></label>'
        + '</div><p class="fs-xs text-muted">' + esc(_usrT("perimeter_hint")) + '</p>' + _monErrorSlot("users-acc-error");
    window.ct_modal.open({
        title: _usrT("account_title"), body: body, size: "md",
        buttons: [
            { id: "cancel", label: _monT("btn_cancel") },
            { id: "add", primary: true, label: _usrT("btn_add_account"), result: function () {
                    const val = function (id) { return (document.getElementById(id)?.value || "").trim(); };
                    const acc = { perimeter: val("users-acc-perimeter"), account: val("users-acc-account"), role: val("users-acc-role") };
                    const slot = document.getElementById("users-acc-error");
                    if (!acc.perimeter || !acc.account) {
                        if (slot)
                            slot.textContent = _usrT("account_required");
                        return false;
                    }
                    const twice = _usr.accounts.some(function (a) {
                        return a.perimeter.toLowerCase() === acc.perimeter.toLowerCase() && a.account.toLowerCase() === acc.account.toLowerCase();
                    });
                    if (twice) {
                        if (slot)
                            slot.textContent = _usrT("account_twice");
                        return false;
                    }
                    return acc;
                } },
        ],
    }).then(function (acc) {
        if (!acc)
            return;
        _usr.accounts.push(acc);
        _usrRedrawAccounts();
    });
}
function _usrAccountRemove(i) { _usr.accounts.splice(i, 1); _usrRedrawAccounts(); }
function _usrValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}
function _usrAdd() { _usr.adding = true; _usr.editing = null; _usr.accounts = []; _usrDraw(); }
function _usrEdit(id) {
    const u = _usr.list.find(function (x) { return x.id === id; });
    _usr.editing = id;
    _usr.adding = false;
    _usr.accounts = ((u && u.accounts) || []).map(function (a) { return { perimeter: a.perimeter, account: a.account, role: a.role || "" }; });
    _usrDraw();
}
function _usrCancel() { _usr.adding = false; _usr.editing = null; _usr.accounts = []; _usrDraw(); }
function _usrSave() {
    const status = _usrValue("users-status");
    const body = { email: _usrValue("users-email"), name: _usrValue("users-name"), status: status,
        left_on: status === "left" ? (_usrValue("users-left-on") || null) : null,
        accounts: _usr.accounts };
    const api = window.ComplianceAPI;
    const done = _usr.editing ? api.updateSiUser(_usr.editing, body) : api.createSiUser(body);
    done.then(function () {
        _usr.adding = false;
        _usr.editing = null;
        _usr.accounts = [];
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
            window.ComplianceAPI.importSiUsers(String(reader.result || "")).then(function (res) {
                showStatus(_usrT("imported", { created: res.created, updated: res.updated, unchanged: res.unchanged }));
                renderUsers();
            }).catch(_monFormFail("users-import-error"));
        };
        reader.readAsText(fi.files[0]);
    };
    fi.click();
}
