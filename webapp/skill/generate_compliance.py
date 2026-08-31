#!/usr/bin/env python3
"""
Génère un outil HTML interactif de suivi de conformité.

Modèle de données compatible avec l'application EBIOS RM :
- socle_anssi, socle_iso, socle_complementaires : mêmes champs de base
- Champs étendus : mesures_ids (liens vers mesures globales)
- Entités globales : mesures[] et preuves[] (partagées entre référentiels)

Usage :
    python3 generate_compliance.py
    python3 generate_compliance.py output.html
"""

import sys
import os
import json

_script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_script_dir, "..", "..", "risk-assessment", "skill"))
from socle_template import ANSSI_MEASURES, ANSSI_DESCRIPTIONS
from mesures_types import MESURES_TYPES
from create_template import ISO27001_MEASURES, ISO_DESCRIPTIONS
from referentiels_complementaires import REFERENTIELS


def generate_framework_js(fw_id, fw_data):
    fw_json = json.dumps(fw_data, ensure_ascii=True, default=str).replace("</", "<\\/")
    return (
        f"// Conformité — référentiel {fw_data.get('label', fw_id)}\n"
        "window.COMPLIANCE_REF = window.COMPLIANCE_REF || {};\n"
        f"window.COMPLIANCE_REF[{json.dumps(fw_id)}] = {fw_json};\n"
    )


def generate_mesures_types_js():
    mt_json = json.dumps(MESURES_TYPES, ensure_ascii=True, default=str).replace("</", "<\\/")
    return f"window.COMPLIANCE_MESURES_TYPES = {mt_json};\n"


def generate_descriptions_js():
    anssi_json = json.dumps({str(k): v for k, v in ANSSI_DESCRIPTIONS.items()}, ensure_ascii=True)
    iso_json = json.dumps(ISO_DESCRIPTIONS, ensure_ascii=True)
    return f"window.COMPLIANCE_DESCRIPTIONS = {{anssi: {anssi_json}, iso: {iso_json}}};\n"


def empty_data():
    socle_anssi = [
        {"num": str(num), "thematique": theme, "mesure": mesure,
         "applicable": "", "conformite": "", "ecart": "", "mesures_prevues": "",
         "mesures_ids": []}
        for num, theme, mesure in ANSSI_MEASURES
    ]
    socle_iso = [
        {"ref": ref, "theme": theme, "mesure": mesure,
         "applicable": "", "conformite": "", "ecart": "", "mesures_prevues": "",
         "mesures_ids": []}
        for ref, theme, mesure in ISO27001_MEASURES
    ]
    return {
        "meta": {
            "tool": "compliance", "version": "2.0",
            "societe": "", "date_evaluation": "", "evaluateur": "",
            "perimetre": "", "commentaires": "",
        },
        "referentiels_actifs": [],
        "socle_type": "",
        "socle_anssi": socle_anssi,
        "socle_iso": socle_iso,
        "socle_complementaires": {},
        "mesures": [],
        "preuves": [],
    }


def generate_compliance_html(data, asset_base="js/Compliance", css_base="css/Compliance"):
    data_json = json.dumps(data, ensure_ascii=True, default=str).replace("</", "<\\/")
    asset_base_js = json.dumps(asset_base)
    catalog = {fwId: {"label": fw["label"], "description": fw["description"], "color": fw["color"]}
               for fwId, fw in REFERENTIELS.items()}
    catalog_json = json.dumps(catalog, ensure_ascii=True, default=str)

    full = f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Suivi de Conformité</title>
<style>
:root {{
    --blue: #2c3e50; --light-blue: #3498db; --bg: #f8f9fa;
    --card-bg: #ffffff; --border: #dee2e6; --text: #212529;
    --text-muted: #6c757d; --red: #e74c3c; --orange: #f39c12;
    --yellow: #f1c40f; --green: #27ae60;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); overflow: hidden; height: 100vh; }}

.toolbar {{ display: flex; align-items: center; gap: 10px; background: var(--blue); color: white; padding: 0 16px; height: 40px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; }}
.toolbar .app-title {{ font-weight: 700; font-size: 1em; white-space: nowrap; }}
.toolbar .app-subtitle {{ color: rgba(255,255,255,0.7); font-size: 0.85em; margin-right: 16px; white-space: nowrap; }}
.btn-menu {{ padding: 5px 14px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8em; background: var(--light-blue); color: white; }}
.btn-menu:hover {{ opacity: 0.85; }}
.toolbar button {{ background: rgba(255,255,255,0.15); border: none; color: white; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8em; }}
.toolbar button:hover {{ background: rgba(255,255,255,0.25); }}
.status {{ font-size: 0.75em; opacity: 0.7; white-space: nowrap; margin-left: 8px; }}
.toolbar-menu {{ position: relative; }}
.toolbar-dropdown {{ display: none; position: absolute; top: 100%; left: 0; background: white; border: 1px solid var(--border); border-radius: 0 0 8px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 200; min-width: 180px; }}
.toolbar-dropdown.open {{ display: block; }}
.toolbar-dropdown-item {{ padding: 8px 16px; cursor: pointer; color: var(--text); font-size: 0.85em; white-space: nowrap; }}
.toolbar-dropdown-item:hover {{ background: #e8f4fd; }}
.toolbar-dropdown-sep {{ height: 1px; background: var(--border); margin: 4px 0; }}
.btn-hamburger {{ display: none; font-size: 1.2em; padding: 5px 8px !important; }}
@media (max-width: 768px) {{ .btn-hamburger {{ display: inline-block; }} }}

.app-layout {{ display: flex; position: fixed; top: 40px; left: 0; right: 0; bottom: 0; }}
.sidebar {{ width: 220px; min-width: 220px; background: var(--blue); color: white; overflow-y: auto; display: flex; flex-direction: column; position: relative; transition: width 0.2s, min-width 0.2s; }}
.sidebar.collapsed {{ width: 0; min-width: 0; padding: 0; overflow: hidden; }}
.sidebar-collapse {{ text-align: right; padding: 6px 10px; cursor: pointer; font-size: 0.9em; opacity: 0.5; }}
.sidebar-collapse:hover {{ opacity: 1; }}
.sidebar-item {{ padding: 9px 14px; cursor: pointer; font-size: 0.85em; border-left: 3px solid transparent; transition: background 0.15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
.sidebar-item:hover {{ background: rgba(255,255,255,0.1); }}
.sidebar-item.active {{ background: rgba(255,255,255,0.15); border-left-color: var(--light-blue); font-weight: 600; }}
.sidebar-sub {{ padding-left: 18px; font-size: 0.8em; padding-top: 5px; padding-bottom: 5px; opacity: 0.85; }}
.sidebar-section {{ font-size: 0.65em; text-transform: uppercase; letter-spacing: 1px; padding: 12px 14px 4px; color: rgba(255,255,255,0.5); font-weight: 600; }}
.sidebar-expand {{ display: none; position: fixed; top: 48px; left: 0; background: var(--blue); color: white; padding: 8px 6px; cursor: pointer; border-radius: 0 4px 4px 0; z-index: 50; }}
.sidebar.collapsed ~ .sidebar-expand {{ display: block; }}

.main-content {{ flex: 1; overflow-y: auto; }}
.container {{ padding: 16px 24px; max-width: 1400px; }}
.tab-panel {{ display: none; }}
.tab-panel.active {{ display: block; }}
.panel-desc {{ background: #e8f4fd; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; font-size: 0.85em; color: var(--blue); line-height: 1.5; }}

.meta {{ display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0; }}
.meta-item {{ background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 16px; flex: 1; min-width: 200px; }}
.meta-item .label {{ font-size: 0.75em; color: var(--text-muted); text-transform: uppercase; }}
.meta-item .value {{ margin-top: 2px; }}
.synth-card {{ background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 16px; }}
.synth-card h3 {{ font-size: 0.9em; color: var(--blue); margin-bottom: 8px; }}

table {{ width: 100%; border-collapse: collapse; font-size: 0.85em; }}
th {{ background: #eee; position: sticky; top: 0; z-index: 2; position: relative; }}
th, td {{ padding: 6px 10px; border: 1px solid var(--border); text-align: left; vertical-align: top; }}
th .col-hide {{ position: absolute; top: 2px; right: 2px; background: none; border: none; color: rgba(0,0,0,0.3); cursor: pointer; font-size: 0.9em; padding: 0 3px; line-height: 1; }}
th .col-hide:hover {{ color: var(--red); }}
.btn-show-cols {{ background: var(--light-blue); color: white; border: none; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8em; margin-bottom: 6px; }}
.cols-popup {{ display: none; position: absolute; background: white; border: 1px solid var(--border); border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 8px; z-index: 300; }}
.cols-popup.open {{ display: block; }}
.cols-popup label {{ display: block; padding: 3px 6px; font-size: 0.85em; cursor: pointer; }}

input, select, textarea {{ font-family: inherit; font-size: inherit; padding: 4px 6px; border: 1px solid var(--border); border-radius: 4px; background: white; }}
textarea {{ width: 100%; resize: vertical; }}
.btn-add {{ background: var(--green); color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.8em; font-weight: 600; }}
.btn-add:hover {{ opacity: 0.9; }}
.btn-del {{ background: var(--red); color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8em; }}
.badge {{ display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75em; font-weight: 600; color: white; }}
.ct-ref-chip {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: 600; cursor: pointer; margin: 3px 4px; border: 2px solid; transition: all 0.15s; user-select: none; }}

.indicators {{ display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }}
.indicator {{ background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; flex: 1; min-width: 140px; text-align: center; }}
.indicator .value {{ font-size: 1.8em; font-weight: 700; }}
.indicator .ind-label {{ font-size: 0.75em; color: var(--text-muted); margin-top: 2px; }}
.conf-bar {{ display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: #eee; margin-top: 4px; }}
.conf-bar-fill {{ height: 100%; transition: width 0.3s; }}

.measure-card {{ border: 1px solid var(--border); border-radius: 6px; padding: 6px 8px; margin-bottom: 4px; }}
.measure-card.compact {{ cursor: pointer; transition: background 0.15s; }}
.measure-card.compact:hover {{ background: #eef3f7; }}
.measure-card.editing {{ padding: 10px; }}
.measure-summary {{ font-size: 0.82em; line-height: 1.4; }}
.measure-tags {{ display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }}
.measure-tag {{ font-size: 0.7em; background: #e8e8e8; border-radius: 3px; padding: 1px 5px; color: var(--text-muted); }}
.evidence-row {{ display: flex; gap: 6px; align-items: center; margin-bottom: 4px; }}
.linked-tag {{ display: inline-flex; align-items: center; gap: 2px; background: #e8f4fd; border-radius: 4px; padding: 1px 6px; font-size: 0.75em; margin: 1px 2px; }}
.linked-tag .tag-x {{ cursor: pointer; color: var(--red); font-weight: bold; margin-left: 2px; }}

/* Search select (dropdown filtrable) */
.ss-wrap {{ position: relative; display: inline-block; }}
.ss-input {{ padding: 3px 6px; border: 1px solid var(--border); border-radius: 4px; font-size: 0.8em; width: 200px; }}
.ss-drop {{ display: none; position: absolute; top: 100%; left: 0; right: 0; z-index: 200; background: white; border: 1px solid var(--light-blue); border-radius: 0 0 6px 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 200px; overflow-y: auto; }}
.ss-drop.open {{ display: block; }}
.ss-opt {{ padding: 4px 8px; cursor: pointer; font-size: 0.8em; }}
.ss-opt:hover {{ background: #e8f4fd; }}

.slider-label {{ text-align: center; font-weight: 700; font-size: 0.85em; }}
.slider-input {{ width: 100%; cursor: pointer; }}
.section-heading {{ margin: 24px 0 8px; color: var(--blue); }}
.restore-banner {{ background: #fff3cd; border-bottom: 1px solid #ffc107; padding: 8px 16px; display: flex; align-items: center; gap: 12px; font-size: 0.85em; position: fixed; top: 40px; left: 0; right: 0; z-index: 99; }}
.app-layout.with-banner {{ top: 76px; }}
.restore-banner .btn-restore {{ background: var(--green); color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8em; }}
.restore-banner .btn-discard {{ background: var(--red); color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8em; }}

.hidden {{ display: none; }}
.text-muted {{ color: var(--text-muted); }}
.ta-c {{ text-align: center; }}
.fw-600 {{ font-weight: 600; }}
.fs-sm {{ font-size: 0.85em; }}
.fs-xs {{ font-size: 0.8em; }}
.w-full {{ width: 100%; }}
.mt-8 {{ margin-top: 8px; }}
.mb-8 {{ margin-bottom: 8px; }}
.mb-12 {{ margin-bottom: 12px; }}
.mb-16 {{ margin-bottom: 16px; }}
.flex-spacer {{ flex: 1; }}
.desc-text {{ font-size: 0.82em; color: var(--text-muted); line-height: 1.4; margin-top: 2px; }}

@media (max-width: 768px) {{
    .app-layout {{ flex-direction: column; }}
    .sidebar {{ width: 100%; min-width: 100%; height: auto; max-height: 0; overflow: hidden; flex-direction: row; flex-wrap: wrap; display: flex; }}
    .sidebar.open {{ max-height: 300px; overflow-y: auto; }}
    .sidebar-item {{ flex: 1; min-width: 120px; text-align: center; padding: 8px 6px; font-size: 0.75em; }}
    .sidebar-section, .sidebar-sub {{ display: none; }}
    .container {{ padding: 8px; }}
}}
@media print {{
    .toolbar, .sidebar, .btn-add, .btn-del {{ display: none !important; }}
    .app-layout {{ display: block; position: static; }}
    .main-content {{ overflow: visible; }}
    .tab-panel {{ display: block !important; page-break-inside: avoid; }}
    body {{ overflow: visible; height: auto; }}
}}

/* Undo/redo */
.btn-undo, .btn-redo {{ background: rgba(255,255,255,0.15); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 1.1em; }}
.btn-undo:hover, .btn-redo:hover {{ background: rgba(255,255,255,0.25); }}

/* Password dialog */
.pwd-overlay {{ display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; }}
.pwd-overlay.open {{ display: flex; }}
.pwd-panel {{ background: white; border-radius: 12px; padding: 24px; min-width: 320px; max-width: 400px; }}
.pwd-title {{ font-weight: 700; margin-bottom: 12px; color: var(--blue); }}
.pwd-input {{ width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid var(--border); border-radius: 6px; font-size: 1em; }}
.pwd-error {{ color: var(--red); font-size: 0.85em; margin-bottom: 4px; }}
.pwd-btn {{ padding: 6px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9em; }}
.pwd-ok {{ background: var(--light-blue); color: white; }}
.pwd-cancel {{ background: #eee; color: var(--text); }}
</style>
</head>
<body>

<div class="toolbar">
    <button class="btn-hamburger" data-click="_toggleSidebarMobile">&#9776;</button>
    <span class="app-title">Suivi de Conformité</span>
    <span class="flex-spacer"></span>
    <span class="app-subtitle" id="header-subtitle"></span>
    <div class="toolbar-menu">
        <button class="btn-menu" data-click="toggleMenu">Fichier</button>
        <div class="toolbar-dropdown" id="io-menu">
            <div class="toolbar-dropdown-item" data-click="_menuAction" data-args='["openFile"]'>Ouvrir</div>
            <div class="toolbar-dropdown-item" id="menu-item-save" data-click="_menuAction" data-args='["quickSaveJSON"]'>Enregistrer</div>
            <div class="toolbar-dropdown-item" data-click="_menuAction" data-args='["saveJSON"]'>Enregistrer sous</div>
            <div class="toolbar-dropdown-sep"></div>
            <div class="toolbar-dropdown-item" data-click="_menuAction" data-args='["importEbiosRM"]'>Import EBIOS RM</div>
            <div class="toolbar-dropdown-sep"></div>
            <div class="toolbar-dropdown-item" data-click="_menuAction" data-args='["newAnalysis"]'>Nouvelle évaluation</div>
        </div>
    </div>
    <input type="file" id="file-input" accept=".json,.enc" class="hidden" data-change="loadJSON" data-pass-event>
    <input type="file" id="ebios-input" accept=".json" class="hidden" data-change="_doImportEbiosRM" data-pass-event>
    <span class="status" id="status-msg"></span>
</div>

<div class="app-layout">
<nav class="sidebar">
    <div class="sidebar-collapse" data-click="toggleSidebar" title="Masquer le menu">&#10005;</div>
    <div class="sidebar-section">Suivi global</div>
    <div class="sidebar-item active" data-click="selectPanel" data-args='["context"]'>Contexte</div>
    <div class="sidebar-item" data-click="selectPanel" data-args='["dashboard"]'>Tableau de bord</div>
    <div class="sidebar-item" data-click="selectPanel" data-args='["plan"]'>Plan d'action</div>
    <div class="sidebar-item" data-click="selectPanel" data-args='["controles"]'>Contrôles</div>
    <div id="sidebar-frameworks"></div>
    <div class="sidebar-section">Historique</div>
    <div class="sidebar-item" data-click="selectPanel" data-args='["history"]'>Snapshots</div>
    <div style="display:flex;gap:6px;padding:6px 14px 8px">
        <button id="btn-undo" class="btn-undo" style="opacity:0.3" data-click="undo" title="Annuler (Ctrl+Z)">&#8630;</button>
        <button id="btn-redo" class="btn-redo" style="opacity:0.3" data-click="redo" title="Rétablir (Ctrl+Y)">&#8631;</button>
    </div>
    <div class="flex-spacer"></div>
</nav>

<div class="sidebar-expand" id="sidebar-expand" data-click="toggleSidebar" title="Afficher le menu">&#8250;</div>
<main class="main-content">
<div class="container">
<div class="tab-panel active" id="panel-dashboard"><div class="ct-panel-desc">Vue d'ensemble de la conformité.</div><div id="dashboard-content"></div></div>
<div class="tab-panel" id="panel-context"><div class="ct-panel-desc">Informations sur l'évaluation et sélection des référentiels.</div><div id="context-content"></div></div>
<div class="tab-panel" id="panel-fw"><div class="ct-panel-desc" id="fw-desc"></div><div id="fw-content"></div></div>
<div class="tab-panel" id="panel-plan"><div class="ct-panel-desc">Toutes les mesures non terminées, tous référentiels confondus.</div><div id="plan-content"></div></div>
<div class="tab-panel" id="panel-controles"><div class="ct-panel-desc">Suivi des contrôles récurrents et des preuves arrivant à expiration.</div><div id="controles-content"></div></div>
<div class="tab-panel" id="panel-history"><div class="ct-panel-desc">Points de sauvegarde et historique des modifications.</div><div id="history-content"></div></div>
</div>
</main>
</div>

<footer style="display:none">Suivi de Conformité — Données modifiables, sauvegarde JSON</footer>

<!-- Dialog mot de passe -->
<div class="ct-pwd-overlay" id="pwd-overlay">
<div class="ct-pwd-panel">
    <div class="ct-pwd-title" id="pwd-title">Mot de passe</div>
    <input type="password" class="ct-pwd-input" id="pwd-input" placeholder="Mot de passe" autocomplete="off">
    <input type="password" class="ct-pwd-input hidden" id="pwd-input2" placeholder="Confirmer le mot de passe" autocomplete="off">
    <div class="ct-pwd-error" id="pwd-error"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button class="ct-pwd-btn ct-pwd-cancel" id="pwd-cancel">Annuler</button>
        <button class="ct-pwd-btn ct-pwd-ok" id="pwd-ok">OK</button>
    </div>
</div>
</div>

<script>
// ═══════════════════════════════════════════════════════════════════════
// CONFIG & DONNÉES
// ═══════════════════════════════════════════════════════════════════════
window.CT_CONFIG = {{
    autosaveKey: "compliance_autosave_v2",
    initDataVar: "COMPLIANCE_INIT_DATA",
    refNamespace: "COMPLIANCE_REF",
    descNamespace: "COMPLIANCE_DESCRIPTIONS",
    label: "évaluation",
    filePrefix: "Conformite",
    getSociete: function(d) {{ return d && d.meta ? d.meta.societe : ""; }},
    getDate: function(d) {{ return d && d.meta ? d.meta.date_evaluation : ""; }}
}};

let D = /*__DATA__*/{data_json}/*__END__*/;
const _ASSET_BASE = {asset_base_js};
const _REFERENTIELS_CATALOG = {catalog_json};
let REFERENTIELS_META = Object.fromEntries(
    Object.entries(_REFERENTIELS_CATALOG).map(([k, v]) => [k, {{...v}}])
);
let _currentPanel = "dashboard";
let _currentFw = null;
let _currentSubview = null;
let _mesuresTypesLoaded = false;

function _ensureMesuresTypes(cb) {{
    if (_mesuresTypesLoaded) {{ cb(); return; }}
    _loadAsset(_ASSET_BASE + "_mesures_types.js", () => {{
        _mesuresTypesLoaded = true;
        cb();
    }});
}}

// Trouver les mesures types applicables à une exigence
function _getMesuresTypesFor(fwId, exigRef) {{
    const mt = window.COMPLIANCE_MESURES_TYPES || [];
    return mt.filter(m => {{
        const refs = m.exigences[fwId] || [];
        return refs.includes(exigRef);
    }});
}}

// Proposer des mesures pour une exigence
function _proposerMesures(fwId, idx) {{
    _ensureMesuresTypes(() => {{
        const entry = _getExigEntry(fwId, idx);
        // Récupérer la ref depuis les données ou les métadonnées du référentiel
        let exigRef;
        if (fwId === "anssi") exigRef = entry.num || D.socle_anssi[idx]?.num || "";
        else if (fwId === "iso") exigRef = entry.ref || D.socle_iso[idx]?.ref || "";
        else {{
            const meta = REFERENTIELS_META[fwId];
            exigRef = (meta && meta.measures && meta.measures[idx]) ? meta.measures[idx].ref : "";
        }}
        const types = _getMesuresTypesFor(fwId, exigRef);
        if (types.length === 0) {{
            alert("Aucune mesure type disponible pour cette exigence (" + exigRef + ").");
            return;
        }}
        // Séparer : déjà liées vs disponibles
        const linkedIds = new Set(entry.mesures_ids || []);
        const linkedDescs = new Set(D.mesures.filter(m => linkedIds.has(m.id)).map(m => m.description));
        const available = types.filter(t => !linkedDescs.has(t.description));
        if (available.length === 0) {{
            // Toutes déjà liées — proposer de voir les mesures liées
            alert("Les " + types.length + " mesure(s) proposée(s) pour " + exigRef + " sont déjà liées à cette exigence.");
            return;
        }}
        let nums;
        if (available.length === 1) {{
            nums = [0];
        }} else {{
            let msg = "Mesures proposées pour " + exigRef + " :\\n\\n";
            available.forEach((t, i) => {{
                msg += (i+1) + ". [" + t.id + "] " + t.description + "\\n";
            }});
            msg += "\\nEntrez le(s) numéro(s) à créer (ex: 1,3) ou * pour tout :";
            const choice = prompt(msg);
            if (!choice) return;
            if (choice.trim() === "*") {{
                nums = available.map((_, i) => i);
            }} else {{
                nums = choice.split(",").map(s => parseInt(s.trim()) - 1).filter(n => n >= 0 && n < available.length);
            }}
        }}
        _saveState();
        nums.forEach(n => {{
            const t = available[n];
            // Vérifier si une mesure identique existe déjà
            const existing = D.mesures.find(m => m.description === t.description);
            if (existing) {{
                // Lier la mesure existante
                if (!entry.mesures_ids) entry.mesures_ids = [];
                if (!entry.mesures_ids.includes(existing.id)) entry.mesures_ids.push(existing.id);
            }} else {{
                // Créer la mesure
                const id = _genMesureId();
                D.mesures.push({{ id, description: t.description, details: t.details || "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] }});
                if (!entry.mesures_ids) entry.mesures_ids = [];
                entry.mesures_ids.push(id);
                // Lier aussi aux autres exigences du même référentiel couvert par cette mesure type
                for (const [otherFwId, otherRefs] of Object.entries(t.exigences)) {{
                    if (!D.referentiels_actifs.includes(otherFwId)) continue;
                    for (const otherRef of otherRefs) {{
                        if (otherFwId === fwId && otherRef === exigRef) continue;
                        const otherExigs = _getExigences(otherFwId);
                        const otherIdx = otherExigs.findIndex(e => _getExigRef(otherFwId, e) === otherRef);
                        if (otherIdx >= 0) {{
                            const otherEntry = _getExigEntry(otherFwId, otherIdx);
                            if (!otherEntry.mesures_ids) otherEntry.mesures_ids = [];
                            if (!otherEntry.mesures_ids.includes(id)) otherEntry.mesures_ids.push(id);
                        }}
                    }}
                }}
            }}
        }});
        _renderFwView(fwId, "exigences");
        _autoSave();
        showStatus(nums.length + " mesure(s) créée(s)");
    }});
}}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
let _nextMesureId = 1;
let _nextPreuveId = 1;

function _genMesureId() {{
    while (D.mesures.some(m => m.id === "M-" + String(_nextMesureId).padStart(3,"0"))) _nextMesureId++;
    return "M-" + String(_nextMesureId++).padStart(3, "0");
}}
function _genPreuveId() {{
    while (D.preuves.some(p => p.id === "P-" + String(_nextPreuveId).padStart(3,"0"))) _nextPreuveId++;
    return "P-" + String(_nextPreuveId++).padStart(3, "0");
}}
function _getMesure(id) {{ return D.mesures.find(m => m.id === id); }}
function _getPreuve(id) {{ return D.preuves.find(p => p.id === id); }}

// ── Search Select : dropdown filtrable ────────────────────────────────
let _ssCounter = 0;

// Génère un dropdown filtrable. options = liste de {{value, label}}, callbackFn = nom de la fonction globale
function _searchSelect(placeholder, options, callbackFn, callbackArgs) {{
    const uid = "ss-" + (_ssCounter++);
    let h = `<div class="ss-wrap" id="${{uid}}">`;
    h += `<input class="ss-input" placeholder="${{esc(placeholder)}}" data-input="_ssFilter" data-args='${{_da(uid)}}' data-pass-value data-click="_ssOpen" data-args='${{_da(uid)}}' />`;
    h += `<div class="ss-drop" id="${{uid}}-drop">`;
    options.forEach(opt => {{
        h += `<div class="ss-opt" data-value="${{esc(opt.value)}}" data-click="_ssSelect" data-args='${{_da(uid,opt.value,callbackFn,JSON.stringify(callbackArgs||[]))}}'>${{esc(opt.label)}}</div>`;
    }});
    h += `</div></div>`;
    return h;
}}

function _ssOpen(uid) {{
    const drop = document.getElementById(uid + "-drop");
    if (drop) {{
        // Réafficher toutes les options
        drop.querySelectorAll(".ss-opt").forEach(o => o.style.display = "");
        drop.classList.add("open");
    }}
}}

function _ssFilter(uid, val) {{
    const drop = document.getElementById(uid + "-drop");
    if (!drop) return;
    const filter = val.toLowerCase();
    let any = false;
    drop.querySelectorAll(".ss-opt").forEach(o => {{
        const match = !filter || o.textContent.toLowerCase().includes(filter);
        o.style.display = match ? "" : "none";
        if (match) any = true;
    }});
    if (!drop.classList.contains("open")) drop.classList.add("open");
}}

function _ssSelect(uid, value, callbackFn, argsJson) {{
    const drop = document.getElementById(uid + "-drop");
    if (drop) drop.classList.remove("open");
    const wrap = document.getElementById(uid);
    if (wrap) {{
        const inp = wrap.querySelector(".ss-input");
        if (inp) inp.value = "";
    }}
    const args = JSON.parse(argsJson || "[]");
    args.push(value);
    if (typeof window[callbackFn] === "function") window[callbackFn].apply(null, args);
}}

// Fermer les dropdowns search-select au clic extérieur
document.addEventListener("click", function(e) {{
    if (!e.target.closest(".ss-wrap")) {{
        document.querySelectorAll(".ss-drop.open").forEach(d => d.classList.remove("open"));
    }}
}});

// Clé d'exigence : "anssi:1", "iso:A.5.1", "dora:DORA-G01"
function _exigKey(fwId, ref) {{ return fwId + ":" + ref; }}

// Récupérer toutes les exigences d'un référentiel comme tableau d'objets
function _getExigences(fwId) {{
    if (fwId === "anssi") return D.socle_anssi;
    if (fwId === "iso") return D.socle_iso;
    const meta = REFERENTIELS_META[fwId];
    if (!meta || !meta.measures) return [];
    const data = D.socle_complementaires[fwId] || {{}};
    return meta.measures.map(m => ({{
        ref: m.ref, theme: m.theme, mesure: m.mesure, description: m.description || "",
        ...(data[m.ref] || {{ applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: [] }})
    }}));
}}

function _getExigRef(fwId, entry) {{
    if (fwId === "anssi") return entry.num;
    return entry.ref;
}}

// Mesures liées à un référentiel (au moins une exigence de ce fw)
function _getMesuresForFw(fwId) {{
    const exigences = _getExigences(fwId);
    const allIds = new Set();
    exigences.forEach(e => (e.mesures_ids || []).forEach(id => allIds.add(id)));
    return D.mesures.filter(m => allIds.has(m.id));
}}

// Preuves liées à un référentiel (via les mesures)
function _getPreuvesForFw(fwId) {{
    const mesures = _getMesuresForFw(fwId);
    const pIds = new Set();
    mesures.forEach(m => (m.preuves_ids || []).forEach(id => pIds.add(id)));
    return D.preuves.filter(p => pIds.has(p.id));
}}

// Statut labels
const _statutLabels = {{planifie:"Planifié",en_cours:"En cours",termine:"Terminé",preuve_manquante:"Preuve manquante"}};
const _statutColors = {{planifie:"var(--orange)",en_cours:"var(--light-blue)",termine:"var(--green)",preuve_manquante:"var(--red)"}};

// ── Calcul automatique des statuts ───────────────────────────────────

// Statut effectif d'une mesure (tient compte de l'expiration des preuves)
function _mesureEffectiveStatut(m) {{
    if (m.statut !== "termine") return m.statut || "planifie";
    // Terminée : vérifier qu'il y a au moins une preuve valide (non expirée)
    const preuves = (m.preuves_ids || []).map(id => _getPreuve(id)).filter(Boolean);
    if (preuves.length === 0) return "preuve_manquante";
    const today = new Date();
    const hasValid = preuves.some(p => !p.date_expiration || new Date(p.date_expiration) >= today);
    return hasValid ? "termine" : "preuve_manquante";
}}

// Statut d'une exigence : OK si ≥1 mesure ET toutes terminées (avec preuves valides)
function _exigenceStatut(entry) {{
    if (entry.applicable === false || entry.applicable === "non") return "na";
    const ids = entry.mesures_ids || [];
    if (ids.length === 0) return "ko";
    const mesures = ids.map(id => _getMesure(id)).filter(Boolean);
    if (mesures.length === 0) return "ko";
    const allOk = mesures.every(m => _mesureEffectiveStatut(m) === "termine");
    return allOk ? "ok" : "ko";
}}

const _exigStatutLabels = {{ok: "OK", ko: "KO", na: "N/A"}};
const _exigStatutColors = {{ok: "var(--green)", ko: "var(--red)", na: "var(--text-muted)"}};

function _mesureBadge(m) {{
    const s = _mesureEffectiveStatut(m);
    return s ? badge(_statutLabels[s]||s, _statutColors[s]||"#999") : "—";
}}

const _recLabels = {{ponctuel:"Ponctuel",mensuelle:"Mensuelle",trimestrielle:"Trimestrielle",semestrielle:"Semestrielle",annuelle:"Annuelle"}};
const _recJours = {{ponctuel:0,mensuelle:30,trimestrielle:90,semestrielle:180,annuelle:365}};

// Référentiels de base (ANSSI, ISO) avec même structure que les complémentaires pour l'UI
const _BASE_FRAMEWORKS = {{
    anssi: {{ label: "ANSSI — Guide d'hygiène", description: "42 mesures", color: "#2c3e50" }},
    iso: {{ label: "ISO 27001", description: "120 exigences (27 clauses SMSI + 93 Annexe A)", color: "#1a5276" }}
}};

function _getAllFrameworks() {{
    return {{ ..._BASE_FRAMEWORKS, ...REFERENTIELS_META }};
}}

// ═══════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════
function selectPanel(panelId) {{
    _currentPanel = panelId;

    // Format: "fw:dora:exigences" ou "dashboard" ou "context"
    if (panelId.startsWith("fw:")) {{
        const parts = panelId.split(":");
        _currentFw = parts[1];
        _currentSubview = parts[2] || "dashboard";
        const fwId = _currentFw;

        const show = () => {{
            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
            document.getElementById("panel-fw").classList.add("active");
            _renderFwView(fwId, _currentSubview);
        }};

        if (fwId !== "anssi" && fwId !== "iso") {{
            _ensureFramework(fwId, show);
        }} else {{
            _ensureDescriptions(show);
        }}
    }} else {{
        _currentFw = null;
        _currentSubview = null;
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        const panel = document.getElementById("panel-" + panelId);
        if (panel) panel.classList.add("active");
        if (panelId === "dashboard") renderDashboard();
        else if (panelId === "context") renderContext();
        else if (panelId === "plan") renderPlan();
        else if (panelId === "controles") renderControles();
        else if (panelId === "history") renderHistory();
    }}

    // Re-rendre la sidebar (afficher/masquer les sous-menus du référentiel actif)
    renderSidebar();

    // Marquer l'item actif dans la sidebar statique (Suivi global, Historique)
    document.querySelectorAll(".sidebar-item").forEach(el => {{
        const args = el.getAttribute("data-args");
        if (!args) return;
        const val = JSON.parse(args)[0];
        if (val === panelId) el.classList.add("active");
        else if (!val.startsWith("fw:")) el.classList.remove("active");
    }});
}}

// ═══════════════════════════════════════════════════════════════════════
// ENSURE KEYS
// ═══════════════════════════════════════════════════════════════════════
function ensureKeys() {{
    if (!D.meta) D.meta = {{ tool: "compliance", version: "2.0", societe: "", date_evaluation: "", evaluateur: "", perimetre: "", commentaires: "" }};
    if (!Array.isArray(D.socle_anssi)) D.socle_anssi = [];
    if (!Array.isArray(D.socle_iso)) D.socle_iso = [];
    if (!Array.isArray(D.referentiels_actifs)) D.referentiels_actifs = [];
    if (typeof D.socle_complementaires !== "object" || Array.isArray(D.socle_complementaires)) D.socle_complementaires = {{}};
    if (!Array.isArray(D.mesures)) D.mesures = [];
    if (!Array.isArray(D.preuves)) D.preuves = [];

    // Compléter socle ANSSI/ISO avec les exigences manquantes (migration ancien format)
    const initData = window.COMPLIANCE_INIT_DATA || {{}};
    if (initData.socle_anssi) {{
        const existingNums = new Set(D.socle_anssi.map(e => e.num));
        initData.socle_anssi.forEach(ref => {{
            if (!existingNums.has(ref.num)) D.socle_anssi.push(JSON.parse(JSON.stringify(ref)));
        }});
    }}
    if (initData.socle_iso) {{
        const existingRefs = new Set(D.socle_iso.map(e => e.ref));
        initData.socle_iso.forEach(ref => {{
            if (!existingRefs.has(ref.ref)) D.socle_iso.push(JSON.parse(JSON.stringify(ref)));
        }});
    }}

    // Ajouter mesures_ids et applicable si manquant
    D.socle_anssi.forEach(e => {{ if (!Array.isArray(e.mesures_ids)) e.mesures_ids = []; }});
    D.socle_iso.forEach(e => {{ if (!Array.isArray(e.mesures_ids)) e.mesures_ids = []; }});

    for (const fwId of D.referentiels_actifs) {{
        if (fwId === "anssi" || fwId === "iso") continue;
        const meta = REFERENTIELS_META[fwId];
        if (!meta) continue;
        if (!D.socle_complementaires[fwId]) {{
            D.socle_complementaires[fwId] = Object.fromEntries(
                meta.measures.map(m => [m.ref, {{conformite:"",ecart:"",mesures_prevues:"",mesures_ids:[]}}])
            );
        }} else {{
            const data = D.socle_complementaires[fwId];
            for (const m of (meta.measures || [])) {{
                if (!data[m.ref]) data[m.ref] = {{conformite:"",ecart:"",mesures_prevues:"",mesures_ids:[]}};
                else if (!Array.isArray(data[m.ref].mesures_ids)) data[m.ref].mesures_ids = [];
            }}
        }}
    }}

    // Promotion automatique : mesure terminée = "en place"
    // (pas de migration nécessaire, c'est une logique d'affichage)

    // Mettre à jour les compteurs d'ID
    D.mesures.forEach(m => {{
        const n = parseInt((m.id || "").replace("M-",""));
        if (n >= _nextMesureId) _nextMesureId = n + 1;
    }});
    D.preuves.forEach(p => {{
        const n = parseInt((p.id || "").replace("P-",""));
        if (n >= _nextPreuveId) _nextPreuveId = n + 1;
    }});

    const sub = document.getElementById("header-subtitle");
    if (sub) sub.textContent = D.meta.societe || "";
}}

// ═══════════════════════════════════════════════════════════════════════
// RENDU
// ═══════════════════════════════════════════════════════════════════════
function renderAll() {{
    renderSidebar();
    if (_currentPanel === "dashboard") renderDashboard();
    else if (_currentPanel === "context") renderContext();
    else if (_currentPanel === "plan") renderPlan();
    else if (_currentPanel === "controles") renderControles();
    else if (_currentPanel === "history") renderHistory();
    else if (_currentPanel.startsWith("fw:") && _currentFw) _renderFwView(_currentFw, _currentSubview);
    // Mettre à jour les boutons undo/redo
    const btnU = document.getElementById("btn-undo");
    const btnR = document.getElementById("btn-redo");
    if (btnU) {{ btnU.style.opacity = _undoStack.length > 0 ? "1" : "0.3"; }}
    if (btnR) {{ btnR.style.opacity = _redoStack.length > 0 ? "1" : "0.3"; }}
}}

function renderSidebar() {{
    if (D.referentiels_actifs.length === 0) {{
        document.getElementById("sidebar-frameworks").innerHTML = "";
        return;
    }}
    let h = '<div class="sidebar-section">Référentiels</div>';
    const views = ["dashboard", "exigences", "mesures", "preuves"];
    const viewLabels = ["Dashboard", "Exigences", "Mesures", "Preuves"];

    for (const fwId of D.referentiels_actifs) {{
        const meta = _getAllFrameworks()[fwId];
        if (!meta) continue;
        const label = fwId === "anssi" ? "ANSSI" : fwId === "iso" ? "ISO 27001" : meta.label;
        const isActive = _currentFw === fwId;
        // Item du référentiel — cliquer dessus ouvre/ferme les sous-menus et va au dashboard
        h += `<div class="sidebar-item${{isActive?" active":""}}" data-click="selectPanel" data-args='${{_da("fw:"+fwId+":dashboard")}}'>${{esc(label)}}</div>`;
        // Sous-menus : affichés uniquement si c'est le référentiel sélectionné
        if (isActive) {{
            for (let vi = 0; vi < views.length; vi++) {{
                const pid = "fw:" + fwId + ":" + views[vi];
                const active = _currentSubview === views[vi];
                h += `<div class="sidebar-item sidebar-sub${{active?" active":""}}" data-click="selectPanel" data-args='${{_da(pid)}}'>${{viewLabels[vi]}}</div>`;
            }}
        }}
    }}
    document.getElementById("sidebar-frameworks").innerHTML = h;
}}

// ── Contexte ──────────────────────────────────────────────────────
function renderContext() {{
    const m = D.meta;
    let h = "<div class='meta'>";
    for (const [key, label] of [["societe","Organisation"],["date_evaluation","Date"],["evaluateur","Évaluateur"],["perimetre","Périmètre"]]) {{
        h += `<div class="ct-meta-item mb-12"><div class="label">${{label}}</div><div class="value">
            <input type="text" value="${{esc(m[key])}}" class="w-full" data-change="_setMeta" data-args='${{_da(key)}}' data-pass-value />
        </div></div>`;
    }}
    h += `<div class="ct-meta-item mb-12" style="min-width:100%"><div class="label">Commentaires</div><div class="value">
        <textarea rows="3" class="w-full" data-change="_setMeta" data-args='["commentaires"]' data-pass-value data-input="_autoHeight" data-pass-el>${{esc(m.commentaires||"")}}</textarea>
    </div></div></div>`;

    h += `<h3 class="section-heading">Référentiels de conformité</h3>`;
    h += `<div class="ct-meta-item mb-12"><div class="value" style="padding:4px 0;display:flex;flex-wrap:wrap;gap:4px">`;
    for (const [fwId, meta] of Object.entries(_getAllFrameworks())) {{
        const active = D.referentiels_actifs.includes(fwId);
        const chipStyle = `border-color:${{meta.color}};color:${{active?"white":meta.color}};background:${{active?meta.color:"white"}}`;
        h += `<span class="ct-ref-chip" style="${{chipStyle}}" data-click="toggleReferentiel" data-args='${{_da(fwId)}}' title="${{esc(meta.description)}}">${{active?"✓":"+"}} ${{esc(meta.label)}}</span>`;
    }}
    h += "</div></div>";
    document.getElementById("context-content").innerHTML = h;
}}

function _setMeta(key, val) {{
    _saveState(); D.meta[key] = val;
    if (key === "societe") {{ const s = document.getElementById("header-subtitle"); if (s) s.textContent = val; }}
    _autoSave();
}}

function toggleReferentiel(fwId) {{
    const doToggle = () => {{
        _saveState();
        const pos = D.referentiels_actifs.indexOf(fwId);
        if (pos >= 0) {{ D.referentiels_actifs.splice(pos, 1); }}
        else {{
            D.referentiels_actifs.push(fwId);
            if (fwId !== "anssi" && fwId !== "iso") {{
                const meta = REFERENTIELS_META[fwId];
                if (meta && !D.socle_complementaires[fwId]) {{
                    D.socle_complementaires[fwId] = Object.fromEntries(
                        meta.measures.map(m => [m.ref, {{conformite:"",ecart:"",mesures_prevues:"",mesures_ids:[]}}])
                    );
                }}
            }}
        }}
        renderContext(); renderSidebar(); _autoSave();
    }};
    if (fwId !== "anssi" && fwId !== "iso") _ensureFramework(fwId, doToggle);
    else doToggle();
}}

// ── Dashboard global ──────────────────────────────────────────────
function renderDashboard() {{
    let h = "";
    const frameworks = [];
    for (const fwId of D.referentiels_actifs) {{
        const exigences = _getExigences(fwId);
        const applicable = exigences.filter(e => e.applicable !== false && e.applicable !== "non");
        const ok = applicable.filter(e => _exigenceStatut(e) === "ok").length;
        const ko = applicable.length - ok;
        const pct = applicable.length > 0 ? Math.round(ok * 100 / applicable.length) : 0;
        const excluded = exigences.length - applicable.length;
        const meta = _getAllFrameworks()[fwId];
        frameworks.push({{ fwId, label: meta ? meta.label : fwId, total: applicable.length, ok, ko, pct, excluded }});
    }}
    if (frameworks.length === 0) {{
        h = '<div class="ct-synth-card"><p class="text-muted">Aucun référentiel sélectionné. Allez dans <strong>Contexte</strong> pour en choisir.</p></div>';
    }} else {{
        h += '<div class="indicators">';
        for (const fw of frameworks) {{
            const color = fw.pct >= 80 ? "var(--green)" : fw.pct > 0 ? "var(--orange)" : "var(--red)";
            h += `<div class="indicator" style="cursor:pointer" data-click="selectPanel" data-args='${{_da("fw:"+fw.fwId+":dashboard")}}'>
                <div class="value" style="color:${{color}}">${{fw.pct}}%</div>
                <div class="ind-label">${{esc(fw.label)}}</div>
                <div class="conf-bar"><div class="conf-bar-fill" style="width:${{fw.pct}}%;background:${{color}}"></div></div>
                <div class="fs-xs text-muted mt-8">${{fw.ok}} OK / ${{fw.ko}} KO${{fw.excluded?" ("+fw.excluded+" N/A)":""}}</div>
            </div>`;
        }}
        h += '</div>';

        // Plan d'action résumé
        const enCours = D.mesures.filter(m => m.statut === "en_cours").length;
        const planifie = D.mesures.filter(m => m.statut === "planifie").length;
        const termine = D.mesures.filter(m => m.statut === "termine").length;
        if (D.mesures.length > 0) {{
            h += `<div class="ct-synth-card"><h3>Mesures</h3><div class="indicators">
                <div class="indicator"><div class="value">${{D.mesures.length}}</div><div class="ind-label">Total</div></div>
                <div class="indicator"><div class="value" style="color:var(--green)">${{termine}}</div><div class="ind-label">Terminées</div></div>
                <div class="indicator"><div class="value" style="color:var(--light-blue)">${{enCours}}</div><div class="ind-label">En cours</div></div>
                <div class="indicator"><div class="value" style="color:var(--orange)">${{planifie}}</div><div class="ind-label">Planifiées</div></div>
            </div></div>`;
        }}
    }}
    document.getElementById("dashboard-content").innerHTML = h;
}}

// ── Vue par référentiel ───────────────────────────────────────────
function _renderFwView(fwId, subview) {{
    const meta = _getAllFrameworks()[fwId];
    const label = meta ? meta.label : fwId;
    if (subview === "dashboard") _renderFwDashboard(fwId, label);
    else if (subview === "exigences") _renderFwExigences(fwId, label);
    else if (subview === "mesures") _renderFwMesures(fwId, label);
    else if (subview === "preuves") _renderFwPreuves(fwId, label);
}}

function _renderFwDashboard(fwId, label) {{
    const exigences = _getExigences(fwId);
    const applicable = exigences.filter(e => e.applicable !== false && e.applicable !== "non");
    const ok = applicable.filter(e => _exigenceStatut(e) === "ok").length;
    const ko = applicable.length - ok;
    const pct = applicable.length > 0 ? Math.round(ok * 100 / applicable.length) : 0;
    const mesures = _getMesuresForFw(fwId);
    const preuves = _getPreuvesForFw(fwId);
    const today = new Date();

    let h = `<h2 style="color:var(--blue);margin-bottom:16px">${{esc(label)}}</h2>`;
    const color = pct >= 80 ? "var(--green)" : pct > 0 ? "var(--orange)" : "var(--red)";
    h += `<div class="indicators">
        <div class="indicator"><div class="value" style="color:${{color}}">${{pct}}%</div><div class="ind-label">Conformité (${{ok}} OK / ${{ko}} KO)</div></div>
        <div class="indicator"><div class="value">${{applicable.length}}</div><div class="ind-label">Exigences applicables</div></div>
        <div class="indicator"><div class="value">${{mesures.length}}</div><div class="ind-label">Mesures</div></div>
        <div class="indicator"><div class="value">${{preuves.length}}</div><div class="ind-label">Preuves</div></div>
    </div>`;

    // Actions en cours
    const actions = mesures.filter(m => m.statut !== "termine");
    if (actions.length > 0) {{
        h += `<div class="ct-synth-card"><h3>Actions en cours (${{actions.length}})</h3><table><thead><tr><th>ID</th><th>Description</th><th>Statut</th><th>Échéance</th></tr></thead><tbody>`;
        actions.forEach(m => {{
            h += `<tr style="cursor:pointer" data-click="_goEditMesure" data-args='${{_da(fwId,m.id)}}'><td class="fw-600">${{esc(m.id)}}</td><td>${{esc(m.description)}}</td><td>${{_mesureBadge(m)}}</td><td>${{esc(m.date_cible||"—")}}</td></tr>`;
        }});
        h += '</tbody></table></div>';
    }}

    // Preuves expirant bientôt (< 90 jours)
    const expiring = preuves.filter(p => {{
        if (!p.date_expiration) return false;
        const exp = new Date(p.date_expiration);
        return (exp - today) < 90 * 86400000;
    }});
    if (expiring.length > 0) {{
        h += `<div class="ct-synth-card" style="border-color:var(--orange)"><h3 style="color:var(--orange)">Preuves expirant sous 90 jours (${{expiring.length}})</h3><table><thead><tr><th>ID</th><th>Label</th><th>Expiration</th></tr></thead><tbody>`;
        expiring.forEach(p => {{
            const expired = new Date(p.date_expiration) < today;
            h += `<tr style="${{expired?"background:#fdf2f2":""}}"><td class="fw-600">${{esc(p.id)}}</td><td>${{esc(p.label)}}</td><td>${{expired?badge("Expirée","var(--red)"):esc(p.date_expiration)}}</td></tr>`;
        }});
        h += '</tbody></table></div>';
    }}

    document.getElementById("fw-desc").textContent = `Dashboard ${{label}}`;
    document.getElementById("fw-content").innerHTML = h;
}}

// ── Exigences ─────────────────────────────────────────────────────
let _exigFilter = "";

function _filterExigences(fwId, val) {{
    _exigFilter = val;
    _renderFwView(fwId, "exigences");
}}

function _renderFwExigences(fwId, label) {{
    const allExigences = _getExigences(fwId);
    const getDesc = fwId === "anssi" ? _getAnssDesc : fwId === "iso" ? _getIsoDesc : null;
    const filter = _exigFilter.toLowerCase();
    // Filtrer en conservant l'index original
    const exigences = [];
    allExigences.forEach((e, origIdx) => {{
        if (filter) {{
            const ref = _getExigRef(fwId, e);
            const theme = (e.thematique || e.theme || "").toLowerCase();
            const mesure = (e.mesure || "").toLowerCase();
            const ecart = (e.ecart || "").toLowerCase();
            if (!ref.toLowerCase().includes(filter) && !theme.includes(filter) && !mesure.includes(filter) && !ecart.includes(filter)) return;
        }}
        exigences.push({{ entry: e, origIdx }});
    }});

    let h = `<h2 style="color:var(--blue);margin-bottom:16px">Exigences — ${{esc(label)}}</h2>`;
    h += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <input type="text" placeholder="Rechercher..." value="${{esc(_exigFilter)}}" style="flex:1;max-width:300px" data-input="_filterExigences" data-args='${{_da(fwId)}}' data-pass-value />
        <span class="fs-xs text-muted">${{exigences.length}} / ${{allExigences.length}} exigences</span>
    </div>`;
    h += `<table id="exig-${{fwId}}-table"><thead><tr>`;
    h += `<th style="width:60px">Réf.</th>`;
    h += `<th${{hd("theme")}} style="min-width:100px">Thématique</th>`;
    h += `<th style="max-width:300px">Mesure</th>`;
    h += `<th style="width:50px" class="ta-c">Appl.</th>`;
    h += `<th style="width:70px" class="ta-c">Statut</th>`;
    h += `<th${{hd("ecart")}} style="min-width:250px">Commentaires</th>`;
    h += `<th${{hd("mes")}} style="min-width:200px">Mesures liées</th>`;
    h += `</tr></thead><tbody>`;

    exigences.forEach((item) => {{
        const e = item.entry;
        const i = item.origIdx;
        const ref = _getExigRef(fwId, e);
        const theme = e.thematique || e.theme;
        const notApplicable = e.applicable === false || e.applicable === "non";
        const desc = getDesc ? getDesc(ref) : (e.description || "");

        // Statut calculé
        const statut = _exigenceStatut(e);
        const statutColor = _exigStatutColors[statut] || "var(--text-muted)";

        // Mesures liées avec statut effectif
        const linkedMesures = (e.mesures_ids || []).map(id => _getMesure(id)).filter(Boolean);
        const enPlace = linkedMesures.filter(m => _mesureEffectiveStatut(m) === "termine");
        const prevues = linkedMesures.filter(m => _mesureEffectiveStatut(m) !== "termine");

        h += `<tr${{notApplicable?' style="background:#f5f5f5"':''}}>`;
        h += `<td class="fw-600">${{esc(ref)}}</td>`;
        h += `<td${{hd("theme")}} class="fs-sm">${{esc(theme)}}</td>`;
        h += `<td><div>${{esc(e.mesure)}}</div>${{desc?'<div class="desc-text">'+esc(desc)+'</div>':""}}</td>`;
        h += `<td class="ta-c"><input type="checkbox" ${{!notApplicable?"checked":""}} data-change="_toggleApplicable" data-args='${{_da(fwId,i)}}' data-pass-checked /></td>`;
        h += `<td class="ta-c">${{badge(_exigStatutLabels[statut], statutColor)}}</td>`;
        h += `<td${{hd("ecart")}}><textarea rows="3" class="w-full" placeholder="${{notApplicable?"Raison N/A...":"Commentaires..."}}" data-change="_updateExig" data-args='${{_da(fwId,i,"ecart")}}' data-pass-value data-input="_autoHeight" data-pass-el>${{esc(e.ecart||"")}}</textarea></td>`;

        // Colonne mesures liées
        h += `<td${{hd("mes")}}>`;
        if (enPlace.length > 0) {{
            h += '<div class="fs-xs fw-600 mb-8" style="color:var(--green)">En place</div>';
            enPlace.forEach(m => {{
                h += `<div class="linked-tag"><span style="cursor:pointer" data-click="_goEditMesure" data-args='${{_da(fwId,m.id)}}'>${{esc(m.id)}} ${{esc(m.description).substring(0,40)}}</span><span class="tag-x" data-click="_unlinkMesure" data-args='${{_da(fwId,i,m.id)}}' data-stop>×</span></div>`;
            }});
        }}
        if (prevues.length > 0) {{
            h += '<div class="fs-xs fw-600 mb-8 mt-8" style="color:var(--orange)">Prévues</div>';
            prevues.forEach(m => {{
                h += `<div class="linked-tag"><span style="cursor:pointer" data-click="_goEditMesure" data-args='${{_da(fwId,m.id)}}'>${{esc(m.id)}} ${{esc(m.description).substring(0,40)}}</span><span class="tag-x" data-click="_unlinkMesure" data-args='${{_da(fwId,i,m.id)}}' data-stop>×</span></div>`;
            }});
        }}
        // Sélecteur pour lier une mesure existante
        const mesOpts = D.mesures.filter(m => !(e.mesures_ids||[]).includes(m.id)).map(m => ({{value: m.id, label: m.id + " " + (m.description||"").substring(0,40)}}));
        h += `<div class="mt-8">${{_searchSelect("Lier une mesure...", mesOpts, "_linkExistingMesure", [fwId, i])}}
            <button class="ct-btn-add fs-xs" style="padding:2px 6px;margin-left:4px" data-click="_createAndLinkMesure" data-args='${{_da(fwId,i)}}'>+ Nouvelle</button>
            <button class="ct-btn-add fs-xs" style="padding:2px 6px;margin-left:4px;background:var(--light-blue)" data-click="_proposerMesures" data-args='${{_da(fwId,i)}}'>Proposer</button>
        </div></td>`;
        h += '</tr>';
    }});
    h += '</tbody></table>';

    document.getElementById("fw-desc").textContent = `Exigences — ${{label}}`;
    document.getElementById("fw-content").innerHTML = h;
    _setupTable("exig-" + fwId + "-table");
}}

// Handlers exigences
function _toggleApplicable(fwId, idx, checked) {{
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    entry.applicable = checked;
    if (!checked) entry.conformite = "";
    _renderFwView(fwId, "exigences");
    _autoSave();
}}

// Conformité calculée automatiquement (voir _exigenceStatut)

function _updateExig(fwId, idx, field, val) {{
    _getExigEntry(fwId, idx)[field] = val;
    _autoSave();
}}

function _getExigEntry(fwId, idx) {{
    if (fwId === "anssi") return D.socle_anssi[idx];
    if (fwId === "iso") return D.socle_iso[idx];
    // Complémentaire : idx = position dans meta.measures
    const meta = REFERENTIELS_META[fwId];
    if (!meta) return {{}};
    const refKey = meta.measures[idx].ref;
    if (!D.socle_complementaires[fwId]) D.socle_complementaires[fwId] = {{}};
    if (!D.socle_complementaires[fwId][refKey]) D.socle_complementaires[fwId][refKey] = {{conformite:"",ecart:"",mesures_prevues:"",mesures_ids:[]}};
    return D.socle_complementaires[fwId][refKey];
}}

function _linkExistingMesure(fwId, idx, mesureId) {{
    if (!mesureId) return;
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    if (!entry.mesures_ids) entry.mesures_ids = [];
    if (!entry.mesures_ids.includes(mesureId)) entry.mesures_ids.push(mesureId);
    _renderFwView(fwId, "exigences");
    _autoSave();
}}

function _createAndLinkMesure(fwId, idx) {{
    _saveState();
    const id = _genMesureId();
    D.mesures.push({{ id, description: "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] }});
    const entry = _getExigEntry(fwId, idx);
    if (!entry.mesures_ids) entry.mesures_ids = [];
    entry.mesures_ids.push(id);
    _editingMesure = id;
    _mesureEditReturnTo = "fw:" + fwId + ":exigences";
    selectPanel("fw:" + fwId + ":mesures");
    _autoSave();
}}

function _unlinkMesure(fwId, idx, mesureId) {{
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    entry.mesures_ids = (entry.mesures_ids || []).filter(id => id !== mesureId);
    _renderFwView(fwId, "exigences");
    _autoSave();
}}

// ── Mesures (par référentiel) ─────────────────────────────────────
let _editingMesure = null;
let _mesureEditReturnTo = null; // "fw:anssi:exigences" si on vient des exigences

let _mesureFilter = "";

function _renderFwMesures(fwId, label) {{
    // N'afficher que les mesures liées au référentiel courant
    const fwMesureIds = new Set();
    _getExigences(fwId).forEach(e => (e.mesures_ids||[]).forEach(id => fwMesureIds.add(id)));
    const filter = _mesureFilter.toLowerCase();
    const mesures = D.mesures.filter(m => {{
        if (!fwMesureIds.has(m.id)) return false;
        if (!filter) return true;
        return (m.id + " " + (m.description||"") + " " + (m.responsable||"")).toLowerCase().includes(filter);
    }});

    let h = `<h2 style="color:var(--blue);margin-bottom:16px">Mesures — ${{esc(label)}}</h2>`;
    h += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <button class="ct-btn-add" data-click="_addMesure" data-args='${{_da(fwId)}}'>+ Nouvelle mesure</button>
        <input type="text" placeholder="Rechercher..." value="${{esc(_mesureFilter)}}" style="flex:1;max-width:300px" data-input="_filterMesures" data-args='${{_da(fwId)}}' data-pass-value />
        <span class="fs-xs text-muted">${{mesures.length}} mesure(s)</span>
    </div>`;

    // Mesure en édition ?
    if (_editingMesure) {{
        const m = _getMesure(_editingMesure);
        if (m) {{
            h += `<div class="measure-card editing" style="background:#f8f9fa;margin-bottom:16px">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                    <strong>${{esc(m.id)}}</strong>
                    <span class="flex-spacer"></span>
                    <button class="btn-del" data-click="_deleteMesure" data-args='${{_da(m.id,fwId)}}'>Supprimer</button>
                    <button class="ct-btn-add fs-xs" data-click="_closeMesureEdit" data-args='${{_da(fwId)}}'>Valider</button>
                </div>
                <textarea rows="2" class="w-full mb-8" placeholder="Description..." data-change="_updateMesure" data-args='${{_da(m.id,"description")}}' data-pass-value data-input="_autoHeight" data-pass-el>${{esc(m.description||"")}}</textarea>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
                    <label class="fs-xs">Statut :
                        <select data-change="_updateMesure" data-args='${{_da(m.id,"statut")}}' data-pass-value>
                            <option value="">—</option>
                            ${{["planifie","en_cours","termine"].map(s => `<option value="${{s}}" ${{m.statut===s?"selected":""}}>${{_statutLabels[s]}}</option>`).join("")}}
                        </select>
                    </label>
                    <label class="fs-xs">Échéance : <input type="date" value="${{esc(m.date_cible||"")}}" data-change="_updateMesure" data-args='${{_da(m.id,"date_cible")}}' data-pass-value /></label>
                    <label class="fs-xs">Responsable : <input type="text" value="${{esc(m.responsable||"")}}" data-change="_updateMesure" data-args='${{_da(m.id,"responsable")}}' data-pass-value /></label>
                    <label class="fs-xs">Récurrence :
                        <select data-change="_updateMesure" data-args='${{_da(m.id,"recurrence")}}' data-pass-value>
                            <option value="">—</option>
                            ${{["ponctuel","mensuelle","trimestrielle","semestrielle","annuelle"].map(r => `<option value="${{r}}" ${{m.recurrence===r?"selected":""}}>${{_recLabels[r]}}</option>`).join("")}}
                        </select>
                    </label>
                    <label class="fs-xs">Dernier contrôle : <input type="date" value="${{esc(m.dernier_controle||"")}}" data-change="_updateMesure" data-args='${{_da(m.id,"dernier_controle")}}' data-pass-value /></label>
                </div>
                <div class="fs-xs fw-600 mb-8">Exigences liées</div>
                ${{_renderLinkedExigences(m.id, fwId)}}
                <div class="fs-xs fw-600 mb-8 mt-8">Preuves liées</div>
                ${{(m.preuves_ids||[]).map(pid => {{
                    const p = _getPreuve(pid);
                    return p ? `<div class="linked-tag"><span style="cursor:pointer" data-click="_goEditPreuveFromMesure" data-args='${{_da(fwId,m.id,pid)}}'>${{esc(p.id)}} ${{esc(p.label)}}</span><span class="tag-x" data-click="_unlinkPreuve" data-args='${{_da(m.id,pid,fwId)}}' data-stop>×</span></div>` : "";
                }}).join("")}}
                ${{_searchSelect("Lier une preuve...", D.preuves.filter(p => !(m.preuves_ids||[]).includes(p.id)).map(p => ({{value:p.id,label:p.id+" "+p.label}})), "_linkExistingPreuve", [m.id, fwId])}}
                <button class="ct-btn-add fs-xs" style="margin-left:4px" data-click="_createAndLinkPreuve" data-args='${{_da(m.id,fwId)}}'>+ Nouvelle preuve</button>
            </div>`;
        }}
    }}

    // Tableau des mesures
    if (mesures.length > 0) {{
        h += `<table id="mesures-${{fwId}}-table"><thead><tr>
            <th style="width:70px">ID</th>
            <th>Description</th>
            <th${{hd("statut")}} style="width:90px">Statut</th>
            <th${{hd("resp")}} style="width:100px">Responsable</th>
            <th${{hd("ech")}} style="width:90px">Échéance</th>
            <th${{hd("rec")}} style="width:90px">Récurrence</th>
            <th${{hd("prv")}} style="width:70px">Preuves</th>
            <th${{hd("exig")}} style="min-width:100px">Exigences</th>
            <th${{hd("refs")}} style="min-width:80px">Référentiels</th>
        </tr></thead><tbody>`;
        mesures.forEach(m => {{
            const linkedExigs = _findExigencesForMesure(m.id);
            const linkedFws = _findFwsForMesure(m.id);
            const isFw = fwMesureIds.has(m.id);
            h += `<tr style="cursor:pointer" data-click="_editMesure" data-args='${{_da(fwId,m.id)}}'>
                <td class="fw-600">${{esc(m.id)}}</td>
                <td>${{esc(m.description||"—")}}</td>
                <td${{hd("statut")}}>${{_mesureBadge(m)}}</td>
                <td${{hd("resp")}}>${{esc(m.responsable||"—")}}</td>
                <td${{hd("ech")}}>${{esc(m.date_cible||"—")}}</td>
                <td${{hd("rec")}}>${{m.recurrence?esc(_recLabels[m.recurrence]||m.recurrence):"—"}}</td>
                <td${{hd("prv")}} class="ta-c">${{(m.preuves_ids||[]).length||"—"}}</td>
                <td${{hd("exig")}} class="fs-xs">${{linkedExigs.join(", ")||"—"}}</td>
                <td${{hd("refs")}} class="fs-xs">${{linkedFws.join(", ")||"—"}}</td>
            </tr>`;
        }});
        h += '</tbody></table>';
    }}

    document.getElementById("fw-desc").textContent = `Mesures — ${{label}}`;
    document.getElementById("fw-content").innerHTML = h;
    _setupTable("mesures-" + fwId + "-table");
}}

function _filterMesures(fwId, val) {{
    _mesureFilter = val;
    _renderFwView(fwId, "mesures");
}}

function _findExigencesForMesure(mesureId) {{
    const result = [];
    const check = (items, fwId) => {{
        items.forEach(e => {{
            if ((e.mesures_ids||[]).includes(mesureId)) result.push(_getExigRef(fwId, e));
        }});
    }};
    for (const fwId of D.referentiels_actifs) {{
        if (fwId === "anssi") check(D.socle_anssi, "anssi");
        else if (fwId === "iso") check(D.socle_iso, "iso");
        else {{
            const data = D.socle_complementaires[fwId] || {{}};
            Object.entries(data).forEach(([ref, entry]) => {{
                if ((entry.mesures_ids||[]).includes(mesureId)) result.push(ref);
            }});
        }}
    }}
    return result;
}}

function _findFwsForMesure(mesureId) {{
    const fws = new Set();
    const check = (items, fwId) => {{
        items.forEach(e => {{
            if ((e.mesures_ids||[]).includes(mesureId)) fws.add(fwId);
        }});
    }};
    for (const fwId of D.referentiels_actifs) {{
        if (fwId === "anssi") check(D.socle_anssi, "anssi");
        else if (fwId === "iso") check(D.socle_iso, "iso");
        else {{
            const data = D.socle_complementaires[fwId] || {{}};
            Object.values(data).forEach(entry => {{
                if ((entry.mesures_ids||[]).includes(mesureId)) fws.add(fwId);
            }});
        }}
    }}
    return Array.from(fws).map(id => {{
        const meta = _getAllFrameworks()[id];
        return meta ? meta.label : id;
    }});
}}

function _addMesure(fwId) {{
    _saveState();
    const id = _genMesureId();
    D.mesures.push({{ id, description: "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] }});
    _editingMesure = id;
    _renderFwView(fwId, "mesures");
    _autoSave();
}}

function _editMesure(fwId, mesureId) {{
    _editingMesure = mesureId;
    _mesureEditReturnTo = null;
    _renderFwView(fwId, "mesures");
}}

function _goEditMesure(fwId, mesureId) {{
    _editingMesure = mesureId;
    _mesureEditReturnTo = _currentPanel || ("fw:" + fwId + ":exigences");
    selectPanel("fw:" + fwId + ":mesures");
}}

function _closeMesureEdit(fwId) {{
    _editingMesure = null;
    if (_mesureEditReturnTo) {{
        const ret = _mesureEditReturnTo;
        _mesureEditReturnTo = null;
        selectPanel(ret);
    }} else {{
        _renderFwView(fwId, "mesures");
    }}
}}

// Rendu des exigences liées à une mesure (dans la vue édition mesure)
function _renderLinkedExigences(mesureId, currentFwId) {{
    let h = "";
    // Afficher les exigences déjà liées (tous référentiels)
    const linked = [];
    for (const fwId of D.referentiels_actifs) {{
        const exigences = _getExigences(fwId);
        const meta = _getAllFrameworks()[fwId];
        const fwLabel = meta ? meta.label : fwId;
        exigences.forEach((e, i) => {{
            const ref = _getExigRef(fwId, e);
            if ((e.mesures_ids || []).includes(mesureId)) {{
                linked.push({{ fwId, idx: i, ref, fwLabel }});
            }}
        }});
    }}
    linked.forEach(l => {{
        h += `<div class="linked-tag">${{esc(l.fwLabel)}} — ${{esc(l.ref)}}<span class="tag-x" data-click="_unlinkMesureFromEdit" data-args='${{_da(mesureId,l.fwId,l.idx,currentFwId)}}' data-stop>×</span></div>`;
    }});

    // Sélecteur pour lier à une exigence (groupé par référentiel)
    const exigOpts = [];
    for (const fwId of D.referentiels_actifs) {{
        const exigences = _getExigences(fwId);
        const meta = _getAllFrameworks()[fwId];
        const fwLabel = meta ? meta.label : fwId;
        exigences.forEach((e, i) => {{
            const ref = _getExigRef(fwId, e);
            if (!(e.mesures_ids || []).includes(mesureId)) {{
                exigOpts.push({{value: fwId + ":" + i, label: fwLabel + " — " + ref + " " + (e.mesure||"").substring(0,40)}});
            }}
        }});
    }}
    h += _searchSelect("Lier à une exigence...", exigOpts, "_linkMesureToExig", [mesureId, currentFwId]);
    return h;
}}

function _linkMesureToExig(mesureId, currentFwId, val) {{
    if (!val) return;
    _saveState();
    const [fwId, idxStr] = val.split(":");
    const idx = parseInt(idxStr);
    const entry = _getExigEntry(fwId, idx);
    if (!entry.mesures_ids) entry.mesures_ids = [];
    if (!entry.mesures_ids.includes(mesureId)) entry.mesures_ids.push(mesureId);
    _editingMesure = mesureId;
    if (currentFwId && _currentPanel.startsWith("fw:")) {{
        _renderFwView(currentFwId, "mesures");
    }} else {{
        renderPlan();
    }}
    _autoSave();
}}

function _unlinkMesureFromEdit(mesureId, fwId, idx, currentFwId) {{
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    entry.mesures_ids = (entry.mesures_ids || []).filter(id => id !== mesureId);
    // Garder l'édition ouverte et re-rendre
    _editingMesure = mesureId;
    if (currentFwId && _currentPanel.startsWith("fw:")) {{
        _renderFwView(currentFwId, "mesures");
    }} else {{
        renderPlan();
    }}
    _autoSave();
}}

function _updateMesure(mesureId, field, val) {{
    const m = _getMesure(mesureId);
    if (m) {{ m[field] = val; _autoSave(); }}
}}

function _deleteMesure(mesureId, fwId) {{
    if (!confirm("Supprimer la mesure " + mesureId + " ?")) return;
    _saveState();
    D.mesures = D.mesures.filter(m => m.id !== mesureId);
    // Retirer des exigences
    const cleanup = items => items.forEach(e => {{ if (e.mesures_ids) e.mesures_ids = e.mesures_ids.filter(id => id !== mesureId); }});
    cleanup(D.socle_anssi); cleanup(D.socle_iso);
    Object.values(D.socle_complementaires).forEach(fw => Object.values(fw).forEach(e => {{ if (e.mesures_ids) e.mesures_ids = e.mesures_ids.filter(id => id !== mesureId); }}));
    _editingMesure = null;
    _renderFwView(fwId, "mesures");
    _autoSave();
}}

function _linkExistingPreuve(mesureId, fwId, preuveId) {{
    if (!preuveId) return;
    _saveState();
    const m = _getMesure(mesureId);
    if (m) {{
        if (!m.preuves_ids) m.preuves_ids = [];
        if (!m.preuves_ids.includes(preuveId)) m.preuves_ids.push(preuveId);
    }}
    _renderFwView(fwId, "mesures");
    _autoSave();
}}

function _unlinkPreuve(mesureId, preuveId, fwId) {{
    _saveState();
    const m = _getMesure(mesureId);
    if (m) m.preuves_ids = (m.preuves_ids||[]).filter(id => id !== preuveId);
    _renderFwView(fwId, "mesures");
    _autoSave();
}}

function _createAndLinkPreuve(mesureId, fwId) {{
    _saveState();
    const id = _genPreuveId();
    D.preuves.push({{ id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" }});
    const m = _getMesure(mesureId);
    if (m) {{
        if (!m.preuves_ids) m.preuves_ids = [];
        m.preuves_ids.push(id);
    }}
    _editingPreuve = id;
    _preuveEditReturnTo = "fw:" + fwId + ":mesures";
    selectPanel("fw:" + fwId + ":preuves");
    showStatus("Preuve " + id + " créée et liée");
    _autoSave();
}}

// ── Preuves (par référentiel) ─────────────────────────────────────
let _editingPreuve = null;
let _preuveEditReturnTo = null;

let _preuveFilter = "";

function _renderFwPreuves(fwId, label) {{
    const fwPreuveIds = new Set();
    _getMesuresForFw(fwId).forEach(m => (m.preuves_ids||[]).forEach(id => fwPreuveIds.add(id)));
    const filter = _preuveFilter.toLowerCase();
    const today = new Date();
    const preuves = D.preuves.filter(p => {{
        if (!filter) return true;
        return (p.id + " " + (p.label||"") + " " + (p.url||"") + " " + (p.commentaire||"")).toLowerCase().includes(filter);
    }});

    // Trouver les mesures liées à chaque preuve
    function _findMesuresForPreuve(preuveId) {{
        return D.mesures.filter(m => (m.preuves_ids||[]).includes(preuveId)).map(m => m.id);
    }}

    let h = `<h2 style="color:var(--blue);margin-bottom:16px">Preuves — ${{esc(label)}}</h2>`;
    h += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <button class="ct-btn-add" data-click="_addPreuveGlobal" data-args='${{_da(fwId)}}'>+ Nouvelle preuve</button>
        <input type="text" placeholder="Rechercher..." value="${{esc(_preuveFilter)}}" style="flex:1;max-width:300px" data-input="_filterPreuves" data-args='${{_da(fwId)}}' data-pass-value />
        <span class="fs-xs text-muted">${{preuves.length}} preuve(s)</span>
    </div>`;

    // Preuve en édition
    if (_editingPreuve) {{
        const p = _getPreuve(_editingPreuve);
        if (p) {{
            h += `<div class="measure-card editing" style="background:#f8f9fa;margin-bottom:16px">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                    <strong>${{esc(p.id)}}</strong><span class="flex-spacer"></span>
                    <button class="btn-del" data-click="_deletePreuve" data-args='${{_da(p.id,fwId)}}'>Supprimer</button>
                    <button class="ct-btn-add fs-xs" data-click="_closePreuveEdit" data-args='${{_da(fwId)}}'>Valider</button>
                </div>
                <input type="text" class="w-full mb-8" placeholder="Label..." value="${{esc(p.label||"")}}" data-change="_updatePreuveField" data-args='${{_da(p.id,"label")}}' data-pass-value />
                <input type="text" class="w-full mb-8" placeholder="URL..." value="${{esc(p.url||"")}}" data-change="_updatePreuveField" data-args='${{_da(p.id,"url")}}' data-pass-value />
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
                    <label class="fs-xs">Date d'obtention : <input type="date" value="${{esc(p.date_obtention||"")}}" data-change="_updatePreuveField" data-args='${{_da(p.id,"date_obtention")}}' data-pass-value /></label>
                    <label class="fs-xs">Date d'expiration : <input type="date" value="${{esc(p.date_expiration||"")}}" data-change="_updatePreuveField" data-args='${{_da(p.id,"date_expiration")}}' data-pass-value /></label>
                </div>
                <textarea rows="2" class="w-full mb-8" placeholder="Commentaire..." data-change="_updatePreuveField" data-args='${{_da(p.id,"commentaire")}}' data-pass-value data-input="_autoHeight" data-pass-el>${{esc(p.commentaire||"")}}</textarea>
                <div class="fs-xs fw-600 mb-8">Mesures liées</div>
                ${{_findMesuresForPreuve(p.id).map(mid => `<span class="linked-tag">${{esc(mid)}}</span>`).join("") || '<span class="text-muted fs-xs">Aucune</span>'}}
            </div>`;
        }}
    }}

    // Tableau
    if (preuves.length > 0) {{
        h += `<table id="preuves-${{fwId}}-table"><thead><tr>
            <th style="width:70px">ID</th>
            <th>Label</th>
            <th${{hd("url")}}>URL</th>
            <th${{hd("obt")}} style="width:100px">Obtention</th>
            <th${{hd("exp")}} style="width:100px">Expiration</th>
            <th${{hd("mes")}} style="width:100px">Mesures</th>
            <th${{hd("sts")}} style="width:80px">Statut</th>
        </tr></thead><tbody>`;
        preuves.forEach(p => {{
            const isFw = fwPreuveIds.has(p.id);
            const expired = p.date_expiration && new Date(p.date_expiration) < today;
            const soonDays = p.date_expiration ? Math.ceil((new Date(p.date_expiration) - today) / 86400000) : null;
            const linkedMesures = _findMesuresForPreuve(p.id);
            let statut = "—";
            if (expired) statut = badge("Expirée", "var(--red)");
            else if (soonDays !== null && soonDays < 90) statut = badge("Bientôt", "var(--orange)");
            else if (p.date_expiration) statut = badge("OK", "var(--green)");

            h += `<tr style="cursor:pointer${{!isFw?";opacity:0.5":""}}${{expired?";background:#fdf2f2":""}}" data-click="_editPreuve" data-args='${{_da(fwId,p.id)}}'>
                <td class="fw-600">${{esc(p.id)}}</td>
                <td>${{esc(p.label||"—")}}</td>
                <td${{hd("url")}} class="fs-xs">${{p.url ? '<a href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer" data-stop>'+esc(p.url).substring(0,40)+'</a>' : "—"}}</td>
                <td${{hd("obt")}}>${{esc(p.date_obtention||"—")}}</td>
                <td${{hd("exp")}}>${{esc(p.date_expiration||"—")}}</td>
                <td${{hd("mes")}} class="fs-xs">${{linkedMesures.join(", ")||"—"}}</td>
                <td${{hd("sts")}}>${{statut}}</td>
            </tr>`;
        }});
        h += '</tbody></table>';
    }}

    document.getElementById("fw-desc").textContent = `Preuves — ${{label}}`;
    document.getElementById("fw-content").innerHTML = h;
    _setupTable("preuves-" + fwId + "-table");
}}

function _filterPreuves(fwId, val) {{
    _preuveFilter = val;
    _renderFwView(fwId, "preuves");
}}

function _addPreuveGlobal(fwId) {{
    _saveState();
    const id = _genPreuveId();
    D.preuves.push({{ id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" }});
    _editingPreuve = id;
    _renderFwView(fwId, "preuves");
    _autoSave();
}}

function _editPreuve(fwId, preuveId) {{
    _editingPreuve = preuveId;
    _preuveEditReturnTo = null;
    _renderFwView(fwId, "preuves");
}}

// Depuis l'édition d'une mesure : éditer la preuve puis revenir à la mesure
let _returnToMesureId = null;
function _goEditPreuveFromMesure(fwId, mesureId, preuveId) {{
    _editingPreuve = preuveId;
    _returnToMesureId = mesureId;
    _preuveEditReturnTo = "fw:" + fwId + ":mesures";
    selectPanel("fw:" + fwId + ":preuves");
}}

function _closePreuveEdit(fwId) {{
    _editingPreuve = null;
    if (_preuveEditReturnTo) {{
        const ret = _preuveEditReturnTo;
        _preuveEditReturnTo = null;
        // Rouvrir l'édition de la mesure si on venait de là
        if (_returnToMesureId) {{
            _editingMesure = _returnToMesureId;
            _returnToMesureId = null;
        }}
        selectPanel(ret);
    }} else {{
        _renderFwView(fwId, "preuves");
    }}
}}

function _updatePreuveField(preuveId, field, val) {{
    const p = _getPreuve(preuveId);
    if (p) {{ p[field] = val; _autoSave(); }}
}}

function _deletePreuve(preuveId, fwId) {{
    if (!confirm("Supprimer la preuve " + preuveId + " ?")) return;
    _saveState();
    D.preuves = D.preuves.filter(p => p.id !== preuveId);
    D.mesures.forEach(m => {{ if (m.preuves_ids) m.preuves_ids = m.preuves_ids.filter(id => id !== preuveId); }});
    _editingPreuve = null;
    _renderFwView(fwId, "preuves");
    _autoSave();
}}

// ── Plan d'action global ──────────────────────────────────────────
let _planFilter = "";

function renderPlan() {{
    const filter = _planFilter.toLowerCase();
    const mesures = D.mesures.filter(m => {{
        if (!filter) return true;
        return (m.id + " " + (m.description||"") + " " + (m.responsable||"")).toLowerCase().includes(filter);
    }});

    let h = `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <button class="ct-btn-add" data-click="_addMesurePlan">+ Nouvelle mesure</button>
        <input type="text" placeholder="Rechercher..." value="${{esc(_planFilter)}}" style="flex:1;max-width:300px" data-input="_filterPlan" data-pass-value />
        <span class="fs-xs text-muted">${{mesures.length}} mesure(s)</span>
    </div>`;

    // Formulaire d'édition si ouvert
    if (_editingMesure) {{
        const m = _getMesure(_editingMesure);
        if (m) {{
            h += `<div class="measure-card editing" style="background:#f8f9fa;margin-bottom:16px">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                    <strong>${{esc(m.id)}}</strong>
                    <span class="flex-spacer"></span>
                    <button class="btn-del" data-click="_deleteMesurePlan" data-args='${{_da(m.id)}}'>Supprimer</button>
                    <button class="ct-btn-add fs-xs" data-click="_closePlanEdit">Valider</button>
                </div>
                <textarea rows="2" class="w-full mb-8" placeholder="Description..." data-change="_updateMesure" data-args='${{_da(m.id,"description")}}' data-pass-value data-input="_autoHeight" data-pass-el>${{esc(m.description||"")}}</textarea>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
                    <label class="fs-xs">Statut :
                        <select data-change="_updateMesure" data-args='${{_da(m.id,"statut")}}' data-pass-value>
                            <option value="">—</option>
                            ${{["planifie","en_cours","termine"].map(s => `<option value="${{s}}" ${{m.statut===s?"selected":""}}>${{_statutLabels[s]}}</option>`).join("")}}
                        </select>
                    </label>
                    <label class="fs-xs">Échéance : <input type="date" value="${{esc(m.date_cible||"")}}" data-change="_updateMesure" data-args='${{_da(m.id,"date_cible")}}' data-pass-value /></label>
                    <label class="fs-xs">Responsable : <input type="text" value="${{esc(m.responsable||"")}}" data-change="_updateMesure" data-args='${{_da(m.id,"responsable")}}' data-pass-value /></label>
                    <label class="fs-xs">Récurrence :
                        <select data-change="_updateMesure" data-args='${{_da(m.id,"recurrence")}}' data-pass-value>
                            <option value="">—</option>
                            ${{["ponctuel","mensuelle","trimestrielle","semestrielle","annuelle"].map(r => `<option value="${{r}}" ${{m.recurrence===r?"selected":""}}>${{_recLabels[r]}}</option>`).join("")}}
                        </select>
                    </label>
                    <label class="fs-xs">Dernier contrôle : <input type="date" value="${{esc(m.dernier_controle||"")}}" data-change="_updateMesure" data-args='${{_da(m.id,"dernier_controle")}}' data-pass-value /></label>
                </div>
                <div class="fs-xs fw-600 mb-8">Exigences liées</div>
                ${{_renderLinkedExigences(m.id, null)}}
                <div class="fs-xs fw-600 mb-8 mt-8">Preuves liées</div>
                ${{(m.preuves_ids||[]).map(pid => {{
                    const p = _getPreuve(pid);
                    return p ? `<div class="linked-tag"><span style="cursor:pointer" data-click="_goEditPreuveFromPlan" data-args='${{_da(m.id,pid)}}'>${{esc(p.id)}} ${{esc(p.label)}}</span><span class="tag-x" data-click="_unlinkPreuvePlan" data-args='${{_da(m.id,pid)}}' data-stop>×</span></div>` : "";
                }}).join("")}}
                ${{_searchSelect("Lier une preuve...", D.preuves.filter(p => !(m.preuves_ids||[]).includes(p.id)).map(p => ({{value:p.id,label:p.id+" "+p.label}})), "_linkExistingPreuvePlan", [m.id])}}
                <button class="ct-btn-add fs-xs" style="margin-left:4px" data-click="_createAndLinkPreuvePlan" data-args='${{_da(m.id)}}'>+ Nouvelle preuve</button>
            </div>`;
        }}
    }}

    // Tableau
    if (mesures.length === 0) {{
        h += '<div class="ct-synth-card"><p class="text-muted">Aucune mesure.</p></div>';
    }} else {{
        h += `<table id="plan-table"><thead><tr>
            <th style="width:70px">ID</th>
            <th>Description</th>
            <th${{hd("statut")}} style="width:90px">Statut</th>
            <th${{hd("resp")}} style="width:100px">Responsable</th>
            <th${{hd("ech")}} style="width:90px">Échéance</th>
            <th${{hd("rec")}} style="width:90px">Récurrence</th>
            <th${{hd("prv")}} style="width:70px">Preuves</th>
            <th${{hd("exig")}} style="min-width:100px">Exigences</th>
            <th${{hd("refs")}} style="min-width:80px">Référentiels</th>
        </tr></thead><tbody>`;
        mesures.forEach(m => {{
            const linkedExigs = _findExigencesForMesure(m.id);
            const linkedFws = _findFwsForMesure(m.id);
            h += `<tr style="cursor:pointer" data-click="_editMesurePlan" data-args='${{_da(m.id)}}'>
                <td class="fw-600">${{esc(m.id)}}</td>
                <td>${{esc(m.description||"—")}}</td>
                <td${{hd("statut")}}>${{_mesureBadge(m)}}</td>
                <td${{hd("resp")}}>${{esc(m.responsable||"—")}}</td>
                <td${{hd("ech")}}>${{esc(m.date_cible||"—")}}</td>
                <td${{hd("rec")}}>${{m.recurrence?esc(_recLabels[m.recurrence]||m.recurrence):"—"}}</td>
                <td${{hd("prv")}} class="ta-c">${{(m.preuves_ids||[]).length||"—"}}</td>
                <td${{hd("exig")}} class="fs-xs">${{linkedExigs.join(", ")||"—"}}</td>
                <td${{hd("refs")}} class="fs-xs">${{linkedFws.join(", ")||"—"}}</td>
            </tr>`;
        }});
        h += '</tbody></table>';
    }}

    document.getElementById("plan-content").innerHTML = h;
    _setupTable("plan-table");
}}

function _filterPlan(val) {{
    _planFilter = val;
    renderPlan();
}}

function _editMesurePlan(mesureId) {{
    _editingMesure = mesureId;
    _mesureEditReturnTo = null;
    renderPlan();
}}

function _closePlanEdit() {{
    _editingMesure = null;
    renderPlan();
}}

function _addMesurePlan() {{
    _saveState();
    const id = _genMesureId();
    D.mesures.push({{ id, description: "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] }});
    _editingMesure = id;
    renderPlan();
    _autoSave();
}}

function _deleteMesurePlan(mesureId) {{
    if (!confirm("Supprimer la mesure " + mesureId + " ?")) return;
    _saveState();
    D.mesures = D.mesures.filter(m => m.id !== mesureId);
    const cleanup = items => items.forEach(e => {{ if (e.mesures_ids) e.mesures_ids = e.mesures_ids.filter(id => id !== mesureId); }});
    cleanup(D.socle_anssi); cleanup(D.socle_iso);
    Object.values(D.socle_complementaires).forEach(fw => Object.values(fw).forEach(e => {{ if (e.mesures_ids) e.mesures_ids = e.mesures_ids.filter(id => id !== mesureId); }}));
    _editingMesure = null;
    renderPlan();
    _autoSave();
}}

function _unlinkPreuvePlan(mesureId, preuveId) {{
    _saveState();
    const m = _getMesure(mesureId);
    if (m) m.preuves_ids = (m.preuves_ids||[]).filter(id => id !== preuveId);
    renderPlan();
    _autoSave();
}}

function _linkExistingPreuvePlan(mesureId, preuveId) {{
    if (!preuveId) return;
    _saveState();
    const m = _getMesure(mesureId);
    if (m) {{
        if (!m.preuves_ids) m.preuves_ids = [];
        if (!m.preuves_ids.includes(preuveId)) m.preuves_ids.push(preuveId);
    }}
    renderPlan();
    _autoSave();
}}

function _createAndLinkPreuvePlan(mesureId) {{
    _saveState();
    const id = _genPreuveId();
    D.preuves.push({{ id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" }});
    const m = _getMesure(mesureId);
    if (m) {{
        if (!m.preuves_ids) m.preuves_ids = [];
        m.preuves_ids.push(id);
    }}
    _editingPreuve = id;
    _preuveEditReturnTo = "plan";
    _returnToMesureId = mesureId;
    selectPanel("plan");
    renderPlan();
    _autoSave();
}}

function _goEditPreuveFromPlan(mesureId, preuveId) {{
    _editingPreuve = preuveId;
    _returnToMesureId = mesureId;
    _preuveEditReturnTo = "plan";
    // Pour les preuves il faut aller sur un panel preuve — on utilise le premier fw actif
    const fwId = D.referentiels_actifs[0] || "anssi";
    selectPanel("fw:" + fwId + ":preuves");
}}

// ── Contrôles global ──────────────────────────────────────────────
function renderControles() {{
    const today = new Date();
    let rows = [];

    // Contrôles récurrents sur les mesures
    D.mesures.forEach(m => {{
        if (!m.recurrence || m.recurrence === "ponctuel") return;
        const jours = _recJours[m.recurrence] || 365;
        const dernier = m.dernier_controle ? new Date(m.dernier_controle) : null;
        const prochain = dernier ? new Date(dernier.getTime() + jours * 86400000) : null;
        const enRetard = prochain ? prochain < today : !!m.dernier_controle;
        rows.push({{ type: "controle", id: m.id, label: m.description, recurrence: m.recurrence, dernier: m.dernier_controle, prochain, enRetard }});
    }});

    // Preuves expirant
    D.preuves.forEach(p => {{
        if (!p.date_expiration) return;
        const exp = new Date(p.date_expiration);
        const expired = exp < today;
        const soonDays = Math.ceil((exp - today) / 86400000);
        if (soonDays < 90) {{
            rows.push({{ type: "preuve", id: p.id, label: p.label, expiration: p.date_expiration, expired, soonDays }});
        }}
    }});

    rows.sort((a,b) => (b.enRetard||b.expired||0) - (a.enRetard||a.expired||0));

    let h = "";
    if (rows.length === 0) {{
        h = '<div class="ct-synth-card"><p class="text-muted">Aucun contrôle récurrent ni preuve expirant prochainement.</p></div>';
    }} else {{
        const retards = rows.filter(r => r.enRetard || r.expired).length;
        if (retards > 0) h += `<div class="ct-synth-card mb-16" style="border-color:var(--red);background:#fdf2f2"><p style="color:var(--red);font-weight:600">${{retards}} alerte(s)</p></div>`;
        h += '<table><thead><tr><th>Type</th><th>ID</th><th>Description</th><th>Détails</th><th>Statut</th></tr></thead><tbody>';
        rows.forEach(r => {{
            h += `<tr style="${{(r.enRetard||r.expired)?"background:#fdf2f2":""}}">`;
            h += `<td>${{r.type==="controle"?"Contrôle":"Preuve"}}</td><td class="fw-600">${{esc(r.id)}}</td><td>${{esc(r.label)}}</td>`;
            if (r.type === "controle") {{
                h += `<td>${{_recLabels[r.recurrence]||r.recurrence}} — dernier: ${{esc(r.dernier||"jamais")}}</td>`;
                h += `<td>${{r.enRetard?badge("En retard","var(--red)"):badge("OK","var(--green)")}}</td>`;
            }} else {{
                h += `<td>Expire: ${{esc(r.expiration)}}</td>`;
                h += `<td>${{r.expired?badge("Expirée","var(--red)"):badge("Bientôt","var(--orange)")}}</td>`;
            }}
            h += '</tr>';
        }});
        h += '</tbody></table>';
    }}
    document.getElementById("controles-content").innerHTML = h;
}}

// ═══════════════════════════════════════════════════════════════════════
// HISTORIQUE / SNAPSHOTS
// ═══════════════════════════════════════════════════════════════════════
async function renderHistory() {{
    const snaps = await _getSnapshots();
    let h = '<button class="ct-btn-add" data-click="createSnapshot">+ Créer un point de sauvegarde</button>';
    if (_isSnapEncrypted()) {{
        h += ' <button class="ct-btn-add" style="background:#e74c3c;margin-left:8px" data-click="disableSnapEncryption">Déchiffrer les snapshots</button>';
    }} else {{
        h += ' <button class="ct-btn-add" style="background:var(--light-blue);margin-left:8px" data-click="enableSnapEncryption">Chiffrer les snapshots</button>';
    }}
    if (snaps.length === 0) {{
        h += '<p class="text-muted mt-8">Aucun snapshot.</p>';
    }} else {{
        h += '<table class="mt-8"><thead><tr><th>Nom</th><th>Date</th><th>Organisation</th><th>Actions</th></tr></thead><tbody>';
        snaps.forEach((s, i) => {{
            const d = new Date(s.date);
            const dateStr = d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", {{hour:"2-digit",minute:"2-digit"}});
            h += `<tr><td><strong>${{esc(s.name)}}</strong></td><td>${{dateStr}}</td><td class="fs-sm">${{esc(s.societe||"")}}</td>`;
            h += `<td><button class="ct-btn-add" style="margin:0 4px 0 0" data-click="restoreSnapshot" data-args='${{_da(i)}}'>Restaurer</button>`;
            h += `<button class="ct-btn-add" style="margin:0 4px 0 0;background:var(--light-blue)" data-click="exportSnapshot" data-args='${{_da(i)}}'>Exporter</button>`;
            h += `<button class="btn-del" data-click="deleteSnapshot" data-args='${{_da(i)}}'>X</button></td></tr>`;
        }});
        h += '</tbody></table>';
    }}
    h += '<p class="mt-8 text-muted fs-sm">Les snapshots sont stockés dans le navigateur (localStorage).</p>';
    document.getElementById("history-content").innerHTML = h;
}}

// ═══════════════════════════════════════════════════════════════════════
// IMPORT EBIOS RM
// ═══════════════════════════════════════════════════════════════════════
function importEbiosRM() {{
    document.getElementById("ebios-input").click();
}}

function _doImportEbiosRM(event) {{
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {{
        try {{
            const ebios = JSON.parse(new TextDecoder().decode(new Uint8Array(e.target.result)));
            if (!ebios.context && !ebios.meta) {{ alert("Ce fichier ne semble pas être un fichier EBIOS RM valide."); return; }}
            _saveState();

            // 1. Importer le contexte
            if (ebios.context) {{
                D.meta.societe = ebios.context.societe || D.meta.societe;
                D.meta.date_evaluation = ebios.context.date || D.meta.date_evaluation;
                D.meta.commentaires = ebios.context.commentaires || D.meta.commentaires;
            }}

            // 2. Importer les mesures de l'atelier 5 comme entités globales
            const mesureIdMap = {{}};  // ancien ID EBIOS → nouvel ID compliance
            if (Array.isArray(ebios.measures)) {{
                ebios.measures.forEach(em => {{
                    // Éviter les doublons (même description nettoyée)
                    const cleanedDesc = _cleanDesc(em.description || "");
                    const existing = D.mesures.find(m => m.description === cleanedDesc);
                    if (existing) {{
                        mesureIdMap[em.id] = existing.id;
                    }} else {{
                        const newId = _genMesureId();
                        mesureIdMap[em.id] = newId;
                        // Convertir le statut EBIOS RM → compliance
                        let statut = "planifie";
                        if (em.statut === "Terminé") statut = "termine";
                        else if (em.statut === "En cours") statut = "en_cours";
                        D.mesures.push({{
                            id: newId,
                            description: _cleanDesc(em.description || ""),
                            statut: statut,
                            date_cible: em.echeance || "",
                            responsable: em.responsable || "",
                            recurrence: "",
                            dernier_controle: "",
                            preuves_ids: [],
                        }});
                    }}
                }});
            }}

            // Nettoyer un préfixe d'ID EBIOS RM d'une description
            // "MES-001 - Politique de sécurité" → "Politique de sécurité"
            function _cleanDesc(text) {{
                return text.replace(/^MES-\d+\s*[-–—]\s*/, "").trim();
            }}

            // Parser le champ mesures_prevues (texte) pour retrouver et lier les mesures
            function _linkMesuresFromText(entry, mesuresPrevuesText) {{
                if (!mesuresPrevuesText) return;
                if (!entry.mesures_ids) entry.mesures_ids = [];
                // Format EBIOS RM : "MES-001 - Description, MES-002 - Description"
                const parts = mesuresPrevuesText.split(",").map(s => s.trim()).filter(Boolean);
                parts.forEach(part => {{
                    const idMatch = part.match(/^(MES-\d+)/);
                    if (idMatch && mesureIdMap[idMatch[1]]) {{
                        // Mesure connue de l'atelier 5 : lier par son nouvel ID
                        const newId = mesureIdMap[idMatch[1]];
                        if (!entry.mesures_ids.includes(newId)) entry.mesures_ids.push(newId);
                    }} else {{
                        // Pas d'ID reconnu : créer une mesure à partir du texte nettoyé
                        const desc = _cleanDesc(part);
                        if (!desc) return;
                        const existing = D.mesures.find(m => m.description === desc);
                        if (existing) {{
                            if (!entry.mesures_ids.includes(existing.id)) entry.mesures_ids.push(existing.id);
                        }} else {{
                            const newId = _genMesureId();
                            D.mesures.push({{
                                id: newId, description: desc,
                                statut: "planifie", date_cible: "", responsable: "",
                                recurrence: "", dernier_controle: "", preuves_ids: [],
                            }});
                            entry.mesures_ids.push(newId);
                        }}
                    }}
                }});
            }}

            // 3. Importer socle ANSSI
            if (Array.isArray(ebios.socle_anssi) && ebios.socle_anssi.length > 0) {{
                if (!D.referentiels_actifs.includes("anssi")) D.referentiels_actifs.push("anssi");
                ebios.socle_anssi.forEach((src, i) => {{
                    if (i < D.socle_anssi.length) {{
                        const dst = D.socle_anssi[i];
                        if (src.conformite !== "" && src.conformite !== null && src.conformite !== undefined) dst.conformite = src.conformite;
                        if (src.ecart) dst.ecart = src.ecart;
                        if (src.mesures_prevues) dst.mesures_prevues = src.mesures_prevues;
                        _linkMesuresFromText(dst, src.mesures_prevues);
                    }}
                }});
            }}

            // 4. Importer socle ISO
            if (Array.isArray(ebios.socle_iso) && ebios.socle_iso.length > 0) {{
                if (!D.referentiels_actifs.includes("iso")) D.referentiels_actifs.push("iso");
                ebios.socle_iso.forEach((src, i) => {{
                    if (i < D.socle_iso.length) {{
                        const dst = D.socle_iso[i];
                        if (src.conformite !== "" && src.conformite !== null && src.conformite !== undefined) dst.conformite = src.conformite;
                        if (src.ecart) dst.ecart = src.ecart;
                        if (src.mesures_prevues) dst.mesures_prevues = src.mesures_prevues;
                        if (src.applicable !== undefined) dst.applicable = src.applicable;
                        _linkMesuresFromText(dst, src.mesures_prevues);
                    }}
                }});
            }}

            // 5. Importer référentiels complémentaires
            if (ebios.socle_complementaires && typeof ebios.socle_complementaires === "object") {{
                for (const [fwId, fwData] of Object.entries(ebios.socle_complementaires)) {{
                    if (!D.referentiels_actifs.includes(fwId)) D.referentiels_actifs.push(fwId);
                    if (!D.socle_complementaires[fwId]) D.socle_complementaires[fwId] = {{}};
                    for (const [ref, entry] of Object.entries(fwData)) {{
                        if (!D.socle_complementaires[fwId][ref]) {{
                            D.socle_complementaires[fwId][ref] = {{ conformite: "", ecart: "", mesures_prevues: "", mesures_ids: [] }};
                        }}
                        const dst = D.socle_complementaires[fwId][ref];
                        if (entry.conformite !== "" && entry.conformite !== null && entry.conformite !== undefined) dst.conformite = entry.conformite;
                        if (entry.ecart) dst.ecart = entry.ecart;
                        if (entry.mesures_prevues) dst.mesures_prevues = entry.mesures_prevues;
                        _linkMesuresFromText(dst, entry.mesures_prevues);
                    }}
                }}
            }}

            const nbMesures = D.mesures.length;
            _initDataAndRender(function() {{
                _autoSave();
                showStatus("Import EBIOS RM réussi : " + file.name + " (" + nbMesures + " mesures)");
            }});
        }} catch(err) {{
            alert("Erreur d'import : " + err.message);
        }}
    }};
    reader.readAsArrayBuffer(file);
    event.target.value = "";
}}

// ═══════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════
try {{
    _checkAutoSaveBanner();
    _initDataAndRender();
}} catch(e) {{
    console.error("Erreur au rendu initial:", e);
    document.querySelector(".container").innerHTML = '<section><h2>Erreur</h2><pre>' + esc(e.message) + '\\n' + esc(e.stack||"") + '</pre></section>';
}}
</script>
</body>
</html>'''

    # ── Post-traitement ──────────────────────────────────────────────
    import re as _re

    style_match = _re.search(r'<style>\n(.*?)\n</style>', full, _re.DOTALL)
    css_content = style_match.group(1)
    full = full[:style_match.start()] + f'<link rel="stylesheet" href="{css_base}.css">' + full[style_match.end():]

    script_match = _re.search(r'<script>\n(.*?)\n</script>', full, _re.DOTALL)
    js_content = script_match.group(1)
    js_content = _re.sub(r'/\*__DATA__\*/.*?/\*__END__\*/', 'window.COMPLIANCE_INIT_DATA || {}', js_content, count=1, flags=_re.DOTALL)
    data_js = f'window.COMPLIANCE_INIT_DATA = {data_json};\n'

    js_prefix = asset_base.rsplit("/", 1)[0] + "/" if "/" in asset_base else ""
    html = (full[:script_match.start()]
            + f'<script src="{js_prefix}cisotoolbox.js"></script>\n'
            + f'<script src="{asset_base}_data.js"></script>\n'
            + f'<script src="{asset_base}_app.js"></script>\n'
            + full[script_match.end() + 1:])

    return html, css_content, js_content, data_js


# ── Point d'entrée ────────────────────────────────────────────────────────

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)

    if len(sys.argv) > 1:
        html_path = sys.argv[1]
        out_dir = os.path.dirname(os.path.abspath(html_path)) or "."
        js_dir = os.path.join(out_dir, "js")
        css_dir = os.path.join(out_dir, "css")
    else:
        out_dir = os.path.join(parent_dir, "app")
        html_path = os.path.join(out_dir, "Compliance.html")
        js_dir = os.path.join(out_dir, "js")
        css_dir = os.path.join(out_dir, "css")

    html_abs = os.path.abspath(html_path)
    html_dir = os.path.dirname(html_abs)
    html_name = os.path.splitext(os.path.basename(html_abs))[0]

    os.makedirs(html_dir, exist_ok=True)
    os.makedirs(js_dir, exist_ok=True)
    os.makedirs(css_dir, exist_ok=True)

    asset_base = os.path.relpath(os.path.join(js_dir, html_name), html_dir).replace(os.sep, "/")
    css_base = os.path.relpath(os.path.join(css_dir, html_name), html_dir).replace(os.sep, "/")

    html, css_content, app_js, data_js = generate_compliance_html(empty_data(), asset_base=asset_base, css_base=css_base)

    with open(html_abs, "w", encoding="utf-8") as f:
        f.write(html)
    with open(os.path.join(css_dir, html_name + ".css"), "w", encoding="utf-8") as f:
        f.write(css_content)
    with open(os.path.join(js_dir, html_name + "_app.js"), "w", encoding="utf-8") as f:
        f.write(app_js)
    with open(os.path.join(js_dir, html_name + "_data.js"), "w", encoding="utf-8") as f:
        f.write(data_js)

    # Bibliothèque commune
    import shutil
    shared_js = os.path.join(os.path.dirname(script_dir), "..", "shared", "js", "cisotoolbox.js")
    shutil.copy2(shared_js, os.path.join(js_dir, "cisotoolbox.js"))

    # Descriptions
    with open(os.path.join(js_dir, html_name + "_descriptions.js"), "w", encoding="utf-8") as f:
        f.write(generate_descriptions_js())

    # Mesures types (propositions)
    with open(os.path.join(js_dir, html_name + "_mesures_types.js"), "w", encoding="utf-8") as f:
        f.write(generate_mesures_types_js())

    # Référentiels complémentaires
    for fw_id, fw_data in REFERENTIELS.items():
        with open(os.path.join(js_dir, html_name + f"_ref_{fw_id}.js"), "w", encoding="utf-8") as f:
            f.write(generate_framework_js(fw_id, fw_data))

    html_kb = os.path.getsize(html_abs) // 1024
    print(f"Outil de conformité v2 généré :")
    print(f"  HTML : {os.path.basename(html_abs)} ({html_kb} KB)")
    print(f"  CSS  : {html_name}.css")
    print(f"  JS   : {html_name}_app.js + {html_name}_data.js + cisotoolbox.js")
    print(f"  + {len(REFERENTIELS)} référentiels + descriptions (lazy)")
