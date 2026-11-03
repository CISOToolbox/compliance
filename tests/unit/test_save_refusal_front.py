"""Regression: a refused save says the server's reason.

The whole-project save read any 409 as "data changed server-side" (FEAT-33)
and reloaded: a change the server refuses never said why. A refused targeted
change was only logged, or shown without its reason. Now only the version
conflict, marked `X-CT-Conflict: stale` by the server, keeps the reload
message; any other refusal of the project save (400 / 409 / 422) says the
server's reason then reloads (a 403 is only said, in red); a refused targeted
change shows its reason in red (a 404 too: deleted meanwhile), any other
failure of it is said too. A validation error (422, list detail) is said as
"field: message", and the body of a refused answer is read only once.

Runs the **compiled** files the page is served
(`compliance_api.js`, `cisotoolbox_backend.js`), through the real entry points
(autosave, the targeted change), with `fetch`, `alert`, `showStatus`
and the page reload stubbed. Skipped without ``node``.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

from src.schemas import ProjectUpdate  # the real body model of the save (validation error)

JS = Path(__file__).resolve().parents[2] / "app" / "js"
# (file, function marker) — every function the scenarios run.
PIECES = (
    ("compliance_api.js", "function _fetch("),
    ("compliance_api.js", "function _onSaveError("),
    ("compliance_api.js", "window._autoSave = function"),
    ("cisotoolbox_backend.js", "*"),
    ("compliance_api.js", "function _flushDirty("),
)

pytestmark = pytest.mark.skipif(
    shutil.which("node") is None, reason="needs node to run the shipped frontend code"
)


def _extract(source: str, marker: str) -> str:
    """Return the full ``[async] <marker>...{...}`` by brace matching."""
    start = source.find(marker)
    assert start >= 0, f"{marker} is missing"
    if source[max(0, start - 6):start] == "async ":
        start -= 6
    i = source.index("{", start)
    depth = 0
    while True:
        if source[i] == "{":
            depth += 1
        elif source[i] == "}":
            depth -= 1
        i += 1
        if depth == 0:
            return source[start:i] + ";"


STUBS = r"""
var events = [];
var BASE = "api";
var window = { location: { pathname: "/compliance/", href: "", reload: function() { events.push("reload"); } } };
var localStorage = { setItem: function() {}, getItem: function() { return null; } };
function alert(m) { events.push("alert:" + m); }
function showStatus(m, isErr) { events.push("status:" + m + (isErr ? "|red" : "")); }
var console = { error: function() {} };
function t(key, p) { return key + (p && p.reason !== undefined ? "|" + p.reason : ""); }
var spec = JSON.parse(process.argv[1]);
// A Response body can be read once: a second read rejects, as in a browser.
function fetch() {
    var used = false;
    function read(v) {
        if (used) return Promise.reject(new TypeError("body stream already read"));
        used = true;
        return Promise.resolve(v);
    }
    return Promise.resolve({
        status: spec.status, ok: spec.status < 400,
        headers: { get: function(h) { return (spec.headers || {})[h] || null; } },
        text: function() { return read(spec.raw !== null ? spec.raw : JSON.stringify({ detail: spec.detail })); },
        json: function() { return read({}); }
    });
}
"""

DRIVERS = {
    "save": r"""
var _dataReady = true, _saveTimer = null, _activeId = "p", _serverRev = 0;
var D = { metadata: {}, meta: {} };
var ComplianceAPI = { update: function(id, b) { return _fetch("/projects/" + id, { method: "PUT", body: b }); } };
window._autoSave();
""",
    "control": r"""
var _activeId = "p", _dataReady = true, _flushTimer = null;
var _dirty = { "control:C-1": { conformite: 3 } };
var _PATCH_FNS = { control: function(id, f) { return _fetch("/projects/p/controls/" + id, { method: "PATCH", body: f }); } };
_flushDirty();
""",
}


def _run(driver: str, status: int, detail=None, headers: dict | None = None, raw: str | None = None) -> list[str]:
    code = []
    for name, marker in PIECES:
        source = (JS / name).read_text(encoding="utf-8")
        # "*": every shared refusal helper of the file (ct_… and _ct…).
        markers = ["function " + n + "(" for n in re.findall(r"^function ((?:ct_|_ct)\w+)\(", source, re.M)] \
            if marker == "*" else [marker]
        code += [_extract(source, m) for m in markers]
    done = "setTimeout(function() { process.stdout.write(JSON.stringify(events)); }, 1500);"
    script = STUBS + "\n".join(code) + DRIVERS[driver] + done
    spec = {"status": status, "detail": detail, "headers": headers or {}, "raw": raw}
    out = subprocess.run(["node", "-e", script, "--", json.dumps(spec)],
                         capture_output=True, text=True, timeout=30, check=True)
    return json.loads(out.stdout)


def _validation_error() -> list:
    """The body FastAPI really sends for an invalid project save (422)."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    app = FastAPI()

    @app.put("/p")
    def _put(body: ProjectUpdate):
        return {}

    resp = TestClient(app).put("/p", json={"expected_server_rev": "x"})
    assert resp.status_code == 422
    return resp.json()["detail"]


# ── the whole-project save (autosave) ────────────────────────────────

def test_stale_conflict_keeps_its_message():
    assert _run("save", 409, "Données modifiées côté serveur depuis le chargement",
                {"X-CT-Conflict": "stale"}) == ["alert:chrome.stale_conflict", "reload"]


def test_validation_error_is_said_field_by_field():
    events = _run("save", 422, _validation_error())
    assert events[0].startswith("alert:chrome.save_refused|expected_server_rev: Input should be a valid integer")
    assert "{" not in events[0] and "[" not in events[0]


# A proxy's own error page (HTML) carries no reason worth showing.
PROXY_400 = "<html><head><title>400 Bad Request</title></head><body><center><h1>400 Bad Request</h1></center></body></html>"


def test_proxy_refusal_says_no_reason_was_given():
    assert _run("save", 400, raw=PROXY_400) == ["alert:chrome.save_refused|chrome.no_reason", "reload"]


def test_save_refused_for_lack_of_rights_is_said_in_red_without_reload():
    assert _run("save", 403, "Access denied") == ["status:⚠ Access denied|red"]


def test_failed_save_is_not_taken_for_a_conflict():
    events = _run("save", 500, "Internal Server Error")
    assert not [e for e in events if e.startswith("alert:") or e == "reload"]


# ── a targeted change ────────────────────────────────────────────────

@pytest.mark.parametrize("driver,status,detail", [
    ('control', 404, 'Control not found'),
    ('control', 403, 'Access denied'),
])
def test_refused_change_shows_its_reason_in_red(driver, status, detail):
    assert "status:⚠ " + detail + "|red" in _run(driver, status, detail)


@pytest.mark.parametrize("driver", ['control'])
def test_change_refused_by_a_proxy_says_no_reason_was_given(driver):
    assert "status:⚠ chrome.no_reason|red" in _run(driver, 404, raw="")


@pytest.mark.parametrize("driver", ['control'])
def test_failed_change_is_said(driver):
    assert "status:chrome.save_failed|red" in _run(driver, 500, "Internal Server Error")
