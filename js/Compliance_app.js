// ═══════════════════════════════════════════════════════════════════════
// CONFIG & DONNÉES
// ═══════════════════════════════════════════════════════════════════════
window.CT_CONFIG = {
    autosaveKey: "compliance_autosave_v2",
    initDataVar: "COMPLIANCE_INIT_DATA",
    refNamespace: "COMPLIANCE_REF",
    descNamespace: "COMPLIANCE_DESCRIPTIONS",
    labelKey: "comp.label",
    filePrefix: "Conformite",
    getSociete: function(d) { return d && d.meta ? d.meta.societe : ""; },
    getDate: function(d) { return d && d.meta ? d.meta.date_evaluation : ""; },
    getScope: function(d) { return "Conformite"; }
};

let D = JSON.parse(JSON.stringify(window.COMPLIANCE_INIT_DATA || {}));
const _ASSET_BASE = "js/Compliance";
// _REFERENTIELS_CATALOG loaded from referentiels_catalog.js (shared)
const _REFERENTIELS_CATALOG = window._REFERENTIELS_CATALOG || {"gamp": {"label": "GAMP 5", "description": "Good Automated Manufacturing Practice \u2014 exigences cybers\u00e9curit\u00e9 pour syst\u00e8mes valid\u00e9s", "description_en": "Good Automated Manufacturing Practice \u2014 cybersecurity requirements for validated systems", "color": "#5b6abf"}, "lpm": {"label": "LPM", "description": "Loi de Programmation Militaire (France) \u2014 r\u00e8gles de s\u00e9curit\u00e9 des arr\u00eat\u00e9s sectoriels ANSSI pour OIV", "description_en": "Military Programming Law (France) \u2014 ANSSI sectoral security rules for Operators of Vital Importance", "color": "#8b5e3c"}, "loi0520": {"label": "Loi 05-20 (Maroc)", "description": "Loi marocaine sur la cybers\u00e9curit\u00e9 \u2014 obligations des organismes soumis", "description_en": "Moroccan Cybersecurity Law \u2014 obligations for subject organizations", "color": "#7a6830"}, "dora": {"label": "DORA", "description": "Digital Operational Resilience Act (UE 2022/2554) \u2014 r\u00e9silience num\u00e9rique du secteur financier", "description_en": "Digital Operational Resilience Act (EU 2022/2554) \u2014 digital resilience for the financial sector", "color": "#3a7ca5"}, "hds": {"label": "HDS", "description": "Certification H\u00e9bergeur de Donn\u00e9es de Sant\u00e9 (France) \u2014 exigences compl\u00e9mentaires ISO 27001", "description_en": "Health Data Hosting Certification (France) \u2014 ISO 27001 complementary requirements", "color": "#3a8a6e"}, "secnumcloud": {"label": "SecNumCloud", "description": "R\u00e9f\u00e9rentiel de qualification ANSSI pour les prestataires de services Cloud (v3.2)", "description_en": "ANSSI qualification framework for Cloud service providers (v3.2)", "color": "#5c6b99"}, "recyf": {"label": "ReCyF (NIS2)", "description": "R\u00e9f\u00e9rentiel Cyber France v2.5 \u2014 transposition nationale NIS 2 (ANSSI, mars 2026)", "description_en": "French Cyber Framework v2.5 \u2014 national transposition of NIS 2 Directive (ANSSI, March 2026)", "color": "#4a8fa8"}, "cra": {"label": "Cyber Resilience Act", "description": "R\u00e8glement UE sur la cyber-r\u00e9silience (CRA 2024) \u2014 exigences pour produits comportant des \u00e9l\u00e9ments num\u00e9riques", "description_en": "EU Cyber Resilience Act (CRA 2024) \u2014 requirements for products with digital elements", "color": "#96694a"}, "soc2": {"label": "SOC 2", "description": "Trust Services Criteria (AICPA) \u2014 s\u00e9curit\u00e9, disponibilit\u00e9, int\u00e9grit\u00e9, confidentialit\u00e9, vie priv\u00e9e", "description_en": "Trust Services Criteria (AICPA) \u2014 security, availability, processing integrity, confidentiality, privacy", "color": "#6b5b8a"}};
let REFERENTIELS_META = Object.fromEntries(
    Object.entries(_REFERENTIELS_CATALOG).map(([k, v]) => [k, {...v}])
);
let _currentPanel = "dashboard";
let _currentFw = null;
let _currentSubview = null;
let _mesuresTypesLoaded = false;

// _getAnssDesc/_getIsoDesc defined in cisotoolbox.js (uses CT_CONFIG.descNamespace + locale)

function _ensureMesuresTypes(cb) {
    if (_mesuresTypesLoaded) { cb(); return; }
    _loadAsset(_ASSET_BASE + "_mesures_types.js", () => {
        _mesuresTypesLoaded = true;
        cb();
    });
}

// Trouver les mesures types applicables à une exigence
function _getMesuresTypesFor(fwId, exigRef) {
    const mt = window.COMPLIANCE_MESURES_TYPES || [];
    return mt.filter(m => {
        const refs = m.exigences[fwId] || [];
        return refs.includes(exigRef);
    });
}

// Proposer des mesures pour une exigence
function _proposerMesures(fwId, idx) {
    _ensureMesuresTypes(() => {
        const entry = _getExigEntry(fwId, idx);
        // Récupérer la ref depuis les données ou les métadonnées du référentiel
        let exigRef;
        exigRef = entry.ref || "";
        const types = _getMesuresTypesFor(fwId, exigRef);
        if (types.length === 0) {
            alert(t("comp.alert.no_mesure_type", {ref: exigRef}));
            return;
        }
        // Séparer : déjà liées vs disponibles
        const linkedIds = new Set(entry.mesures_ids || []);
        const linkedDescs = new Set(D.mesures.filter(m => linkedIds.has(m.id)).map(m => m.description));
        const available = types.filter(t => !linkedDescs.has(t.description) && !linkedDescs.has(_rt(t, "description")));
        if (available.length === 0) {
            // Toutes déjà liées — proposer de voir les mesures liées
            alert(t("comp.alert.all_linked", {count: types.length, ref: exigRef}));
            return;
        }
        let nums;
        if (available.length === 1) {
            nums = [0];
        } else {
            let msg = t("comp.alert.mesures_prompt_title", {ref: exigRef}) + "\n\n";
            available.forEach((mt, i) => {
                msg += (i+1) + ". [" + mt.id + "] " + _rt(mt, "description") + "\n";
            });
            msg += "\n" + t("comp.alert.mesures_prompt_footer");
            const choice = prompt(msg);
            if (!choice) return;
            if (choice.trim() === "*") {
                nums = available.map((_, i) => i);
            } else {
                nums = choice.split(",").map(s => parseInt(s.trim()) - 1).filter(n => n >= 0 && n < available.length);
            }
        }
        _saveState();
        nums.forEach(n => {
            const t = available[n];
            // Vérifier si une mesure identique existe déjà
            const existing = D.mesures.find(m => m.description === t.description);
            if (existing) {
                // Lier la mesure existante
                if (!entry.mesures_ids) entry.mesures_ids = [];
                if (!entry.mesures_ids.includes(existing.id)) entry.mesures_ids.push(existing.id);
            } else {
                // Créer la mesure
                const id = _genMesureId();
                D.mesures.push({ id, description: t.description, details: t.details || "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] });
                if (!entry.mesures_ids) entry.mesures_ids = [];
                entry.mesures_ids.push(id);
                // Lier aussi aux autres exigences du même référentiel couvert par cette mesure type
                for (const [otherFwId, otherRefs] of Object.entries(t.exigences)) {
                    if (!D.referentiels_actifs.includes(otherFwId)) continue;
                    for (const otherRef of otherRefs) {
                        if (otherFwId === fwId && otherRef === exigRef) continue;
                        const otherExigs = _getExigences(otherFwId);
                        const otherIdx = otherExigs.findIndex(e => _getExigRef(otherFwId, e) === otherRef);
                        if (otherIdx >= 0) {
                            const otherEntry = _getExigEntry(otherFwId, otherIdx);
                            if (!otherEntry.mesures_ids) otherEntry.mesures_ids = [];
                            if (!otherEntry.mesures_ids.includes(id)) otherEntry.mesures_ids.push(id);
                        }
                    }
                }
            }
        });
        _renderFwView(fwId, "exigences");
        _autoSave();
        showStatus(t("comp.status.mesures_created", {count: nums.length}));
    });
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
let _nextMesureId = 1;
let _nextPreuveId = 1;

function _genMesureId() {
    while (D.mesures.some(m => m.id === "M-" + String(_nextMesureId).padStart(3,"0"))) _nextMesureId++;
    return "M-" + String(_nextMesureId++).padStart(3, "0");
}
function _genPreuveId() {
    while (D.preuves.some(p => p.id === "P-" + String(_nextPreuveId).padStart(3,"0"))) _nextPreuveId++;
    return "P-" + String(_nextPreuveId++).padStart(3, "0");
}
function _getMesure(id) { return D.mesures.find(m => m.id === id); }
function _getPreuve(id) { return D.preuves.find(p => p.id === id); }

// ── Search Select : dropdown filtrable ────────────────────────────────
let _ssCounter = 0;

// Génère un dropdown filtrable. options = liste de {value, label}, callbackFn = nom de la fonction globale
function _searchSelect(placeholder, options, callbackFn, callbackArgs) {
    const uid = "ss-" + (_ssCounter++);
    let h = `<div class="ss-wrap" id="${uid}">`;
    h += `<input class="ss-input" placeholder="${esc(placeholder)}" data-input="_ssFilterAndOpen" data-args='${_da(uid)}' data-pass-value />`;
    h += `<div class="ss-drop" id="${uid}-drop">`;
    options.forEach(opt => {
        h += `<div class="ss-opt" data-value="${esc(opt.value)}" data-click="_ssSelect" data-args='${_da(uid,opt.value,callbackFn,JSON.stringify(callbackArgs||[]))}'>${esc(opt.label)}</div>`;
    });
    h += `</div></div>`;
    return h;
}

function _ssFilterAndOpen(uid, val) {
    _ssOpen(uid);
    if (val !== undefined) _ssFilter(uid, val);
}

function _ssOpen(uid) {
    const drop = document.getElementById(uid + "-drop");
    if (drop) {
        // Réafficher toutes les options
        drop.querySelectorAll(".ss-opt").forEach(o => o.style.display = "");
        drop.classList.add("open");
    }
}

function _ssFilter(uid, val) {
    const drop = document.getElementById(uid + "-drop");
    if (!drop) return;
    const filter = val.toLowerCase();
    let any = false;
    drop.querySelectorAll(".ss-opt").forEach(o => {
        const match = !filter || o.textContent.toLowerCase().includes(filter);
        o.style.display = match ? "" : "none";
        if (match) any = true;
    });
    if (!drop.classList.contains("open")) drop.classList.add("open");
}

function _ssSelect(uid, value, callbackFn, argsJson) {
    const drop = document.getElementById(uid + "-drop");
    if (drop) drop.classList.remove("open");
    const wrap = document.getElementById(uid);
    if (wrap) {
        const inp = wrap.querySelector(".ss-input");
        if (inp) inp.value = "";
    }
    const args = JSON.parse(argsJson || "[]");
    args.push(value);
    if (typeof window[callbackFn] === "function") window[callbackFn].apply(null, args);
}

// Fermer les dropdowns search-select au clic extérieur
document.addEventListener("click", function(e) {
    if (!e.target.closest(".ss-wrap")) {
        document.querySelectorAll(".ss-drop.open").forEach(d => d.classList.remove("open"));
    }
});

// Clé d'exigence : "anssi:1", "iso:A.5.1", "dora:DORA-G01"
function _exigKey(fwId, ref) { return fwId + ":" + ref; }

// Récupérer toutes les exigences d'un référentiel comme tableau d'objets
function _getExigences(fwId) {
    return (D.referentiels && D.referentiels[fwId]) || [];
}

function _getExigRef(fwId, entry) {
    return entry.ref || "";
}

// Mesures liées à un référentiel (au moins une exigence de ce fw)
function _getMesuresForFw(fwId) {
    const exigences = _getExigences(fwId);
    const allIds = new Set();
    exigences.forEach(e => (e.mesures_ids || []).forEach(id => allIds.add(id)));
    return D.mesures.filter(m => allIds.has(m.id));
}

// Preuves liées à un référentiel (via les mesures)
function _getPreuvesForFw(fwId) {
    const mesures = _getMesuresForFw(fwId);
    const pIds = new Set();
    mesures.forEach(m => (m.preuves_ids || []).forEach(id => pIds.add(id)));
    return D.preuves.filter(p => pIds.has(p.id));
}

// Statut labels
function _statutLabel(key) { return t("comp.statut." + key) || key; }
const _statutColors = {planifie:"orange",en_cours:"blue",termine:"green",preuve_manquante:"red"};

// ── Calcul automatique des statuts ───────────────────────────────────

// Statut effectif d'une mesure (tient compte de l'expiration des preuves)
function _mesureEffectiveStatut(m) {
    if (m.statut !== "termine") return m.statut || "planifie";
    // Terminée : vérifier qu'il y a au moins une preuve valide (non expirée)
    const preuves = (m.preuves_ids || []).map(id => _getPreuve(id)).filter(Boolean);
    if (preuves.length === 0) return "preuve_manquante";
    const today = new Date();
    const hasValid = preuves.some(p => !p.date_expiration || new Date(p.date_expiration) >= today);
    return hasValid ? "termine" : "preuve_manquante";
}

// Statut d'une exigence : OK si ≥1 mesure ET toutes terminées (avec preuves valides)
function _exigenceStatut(entry) {
    if (entry.applicable === false || entry.applicable === "non") return "na";
    const ids = entry.mesures_ids || [];
    if (ids.length === 0) return "ko";
    const mesures = ids.map(id => _getMesure(id)).filter(Boolean);
    if (mesures.length === 0) return "ko";
    const allOk = mesures.every(m => _mesureEffectiveStatut(m) === "termine");
    return allOk ? "ok" : "ko";
}

function _exigStatutLabel(key) { return t("comp.exig_statut." + key) || key; }
const _exigStatutColors = {ok: "green", ko: "red", na: "gray"};

function _mesureBadge(m) {
    const s = _mesureEffectiveStatut(m);
    return s ? ctBadge(_statutLabel(s), _statutColors[s]||"gray") : "u2014";
}

function _recLabel(key) { return t("comp.rec." + key) || key; }
const _recJours = {ponctuel:0,mensuelle:30,trimestrielle:90,semestrielle:180,annuelle:365};

// Référentiels de base (ANSSI, ISO) avec même structure que les complémentaires pour l'UI
const _BASE_FRAMEWORKS = {
    anssi: { label: "ANSSI — Guide d'hygiène", get description() { return t("comp.fw.anssi_desc"); }, color: "#1e293b" },
    iso: { label: "ISO 27001", get description() { return t("comp.fw.iso_desc"); }, color: "#1e40af" }
};

function _getAllFrameworks() {
    var all = Object.assign({}, _BASE_FRAMEWORKS, REFERENTIELS_META);
    // Include custom frameworks stored in D
    if (D._custom_frameworks) {
        for (var fwId in D._custom_frameworks) {
            if (!all[fwId]) {
                var cf = D._custom_frameworks[fwId];
                all[fwId] = { label: cf.label, description: (cf.measures||[]).length + " controles (custom)", color: cf.color, custom: true };
                REFERENTIELS_META[fwId] = all[fwId];
                REFERENTIELS_META[fwId].measures = cf.measures;
                if (!window.COMPLIANCE_REF) window.COMPLIANCE_REF = {};
                window.COMPLIANCE_REF[fwId] = { label: cf.label, measures: cf.measures, color: cf.color };
            }
        }
    }
    return all;
}

// ═══════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════
function selectPanel(panelId) {
    _currentPanel = panelId;
    // Fermer la sidebar mobile
    document.querySelector(".sidebar").classList.remove("open");

    // Format: "fw:dora:exigences" ou "dashboard" ou "context"
    if (panelId.startsWith("fw:")) {
        const parts = panelId.split(":");
        _currentFw = parts[1];
        _currentSubview = parts[2] || "dashboard";
        const fwId = _currentFw;

        const show = () => {
            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
            document.getElementById("panel-fw").classList.add("active");
            _renderFwView(fwId, _currentSubview);
        };

        // For anssi/iso, load descriptions; for others, load framework measures metadata
        const afterLoad = () => {
            if (fwId === "anssi" || fwId === "iso") _ensureDescriptions(show);
            else show();
        };
        if (fwId !== "anssi" && fwId !== "iso") _ensureFramework(fwId, afterLoad);
        else afterLoad();
    } else {
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
    }

    renderSidebar();
    _updateSidebarAccordion(panelId);
}

// ═══════════════════════════════════════════════════════════════════════
// ENSURE KEYS
// ═══════════════════════════════════════════════════════════════════════
function ensureKeys() {
    if (!D.meta) D.meta = { tool: "compliance", version: "2.0", societe: "", date_evaluation: "", evaluateur: "", perimetre: "", commentaires: "" };
    if (!Array.isArray(D.referentiels_actifs)) D.referentiels_actifs = [];
    if (typeof D.referentiels !== "object" || Array.isArray(D.referentiels)) D.referentiels = {};
    if (!Array.isArray(D.mesures)) D.mesures = [];
    if (!Array.isArray(D.preuves)) D.preuves = [];

    // ── Migration ancien format (socle_anssi / socle_iso / socle_complementaires) ──
    if (Array.isArray(D.socle_anssi) && D.socle_anssi.length > 0 && !D.referentiels.anssi) {
        D.referentiels.anssi = D.socle_anssi.map(e => {
            const entry = Object.assign({}, e);
            if (entry.num !== undefined) { entry.ref = entry.num; delete entry.num; }
            return entry;
        });
    }
    delete D.socle_anssi;

    if (Array.isArray(D.socle_iso) && D.socle_iso.length > 0 && !D.referentiels.iso) {
        D.referentiels.iso = D.socle_iso.slice();
    }
    delete D.socle_iso;

    if (D.socle_complementaires && typeof D.socle_complementaires === "object") {
        for (const [fwId, fwData] of Object.entries(D.socle_complementaires)) {
            if (D.referentiels[fwId]) continue; // already migrated
            const meta = REFERENTIELS_META[fwId];
            if (meta && meta.measures) {
                D.referentiels[fwId] = meta.measures.map(m => ({
                    ref: m.ref, theme: _rt(m, "theme"), mesure: _rt(m, "mesure"), description: _rt(m, "description") || "",
                    ...(fwData[m.ref] || { applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: [] })
                }));
            }
        }
    }
    delete D.socle_complementaires;
    delete D.socle_type;

    // ── Compléter les référentiels avec les exigences de base manquantes ──
    const initData = window.COMPLIANCE_INIT_DATA || {};
    const initRefs = (initData.referentiels) || {};

    // ANSSI: merge base entries
    if (initRefs.anssi) {
        if (!D.referentiels.anssi) D.referentiels.anssi = [];
        const existingRefs = new Set(D.referentiels.anssi.map(e => e.ref));
        initRefs.anssi.forEach(ref => {
            if (!existingRefs.has(ref.ref)) D.referentiels.anssi.push(JSON.parse(JSON.stringify(ref)));
        });
    }
    // ISO: merge base entries
    if (initRefs.iso) {
        if (!D.referentiels.iso) D.referentiels.iso = [];
        const existingRefs = new Set(D.referentiels.iso.map(e => e.ref));
        initRefs.iso.forEach(ref => {
            if (!existingRefs.has(ref.ref)) D.referentiels.iso.push(JSON.parse(JSON.stringify(ref)));
        });
    }

    // Ensure mesures_ids on all referentiel entries
    for (const fwId of Object.keys(D.referentiels)) {
        if (Array.isArray(D.referentiels[fwId])) {
            D.referentiels[fwId].forEach(e => { if (!Array.isArray(e.mesures_ids)) e.mesures_ids = []; });
        }
    }

    // Initialize or enrich complementary frameworks from REFERENTIELS_META
    for (const fwId of D.referentiels_actifs) {
        if (fwId === "anssi" || fwId === "iso") continue;
        const meta = REFERENTIELS_META[fwId];
        if (!meta || !meta.measures) continue;
        if (!D.referentiels[fwId]) {
            // Create fresh entries from meta
            D.referentiels[fwId] = meta.measures.map(m => ({
                ref: m.ref, theme: _rt(m, "theme"), mesure: _rt(m, "mesure"), description: _rt(m, "description") || "",
                applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: []
            }));
        } else {
            // Enrich existing entries with meta data (theme, mesure, description) and add missing ones
            const existing = D.referentiels[fwId];
            const existingByRef = Object.fromEntries(existing.map(e => [e.ref, e]));
            const enriched = meta.measures.map(m => {
                const e = existingByRef[m.ref];
                if (e) {
                    // Fill in meta fields if missing
                    if (!e.theme) e.theme = _rt(m, "theme");
                    if (!e.mesure) e.mesure = _rt(m, "mesure");
                    if (!e.description && _rt(m, "description")) e.description = _rt(m, "description");
                    return e;
                }
                return {
                    ref: m.ref, theme: _rt(m, "theme"), mesure: _rt(m, "mesure"), description: _rt(m, "description") || "",
                    applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: []
                };
            });
            D.referentiels[fwId] = enriched;
        }
    }

    // Promotion automatique : mesure terminée = "en place"
    // (pas de migration nécessaire, c'est une logique d'affichage)

    // Mettre à jour les compteurs d'ID
    D.mesures.forEach(m => {
        const n = parseInt((m.id || "").replace("M-",""));
        if (n >= _nextMesureId) _nextMesureId = n + 1;
    });
    D.preuves.forEach(p => {
        const n = parseInt((p.id || "").replace("P-",""));
        if (n >= _nextPreuveId) _nextPreuveId = n + 1;
    });

    const sub = document.getElementById("header-subtitle");
    if (sub) sub.textContent = D.meta.societe || "";
}

// ═══════════════════════════════════════════════════════════════════════
// RENDU
// ═══════════════════════════════════════════════════════════════════════
function renderAll() {
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
    if (btnU) { btnU.style.opacity = _undoStack.length > 0 ? "1" : "0.3"; }
    if (btnR) { btnR.style.opacity = _redoStack.length > 0 ? "1" : "0.3"; }
    // i18n: toolbar right + static translations
    var tr = document.getElementById("toolbar-right");
    if (tr) tr.innerHTML = _getSettingsButtonHTML() + _getGithubLinkHTML("https://github.com/CollectiveMakers/compliance_webapp");
    _applyStaticTranslations();
}

function renderSidebar() {
    if (D.referentiels_actifs.length === 0) {
        document.getElementById("sidebar-frameworks").innerHTML = "";
        return;
    }
    let h = '<div class="sidebar-section">' + t("comp.sidebar.frameworks") + '</div>';
    const views = ["dashboard", "exigences", "mesures", "preuves"];
    const viewLabels = [t("comp.subview.dashboard"), t("comp.subview.exigences"), t("comp.subview.mesures"), t("comp.subview.preuves")];

    for (const fwId of D.referentiels_actifs) {
        const meta = _getAllFrameworks()[fwId];
        if (!meta) continue;
        const label = fwId === "anssi" ? "ANSSI" : fwId === "iso" ? "ISO 27001" : meta.label;
        const isActive = _currentFw === fwId;
        // Item du référentiel — cliquer dessus ouvre/ferme les sous-menus et va au dashboard
        h += `<div class="sidebar-item${isActive?" active":""}" data-click="selectPanel" data-args='${_da("fw:"+fwId+":dashboard")}'>${esc(label)}</div>`;
        // Sous-menus : affichés uniquement si c'est le référentiel sélectionné
        if (isActive) {
            for (let vi = 0; vi < views.length; vi++) {
                const pid = "fw:" + fwId + ":" + views[vi];
                const active = _currentSubview === views[vi];
                h += `<div class="sidebar-item sidebar-sub${active?" active":""}" data-click="selectPanel" data-args='${_da(pid)}'>${viewLabels[vi]}</div>`;
            }
        }
    }
    document.getElementById("sidebar-frameworks").innerHTML = h;
}

// ── Contexte ──────────────────────────────────────────────────────
function renderContext() {
    const m = D.meta;
    let h = "<div class='meta'>";
    for (const [key, tKey] of [["societe","comp.context.organisation"],["date_evaluation","comp.context.date"],["evaluateur","comp.context.evaluateur"],["perimetre","comp.context.perimetre"]]) {
        const label = t(tKey);
        h += `<div class="meta-item mb-12"><div class="label">${label}</div><div class="value">
            <input type="text" value="${esc(m[key])}" class="w-full" data-change="_setMeta" data-args='${_da(key)}' data-pass-value />
        </div></div>`;
    }
    h += `<div class="meta-item mb-12" style="min-width:100%"><div class="label">${t("comp.context.commentaires")}</div><div class="value">
        <textarea rows="3" class="w-full" data-change="_setMeta" data-args='["commentaires"]' data-pass-value data-input="_autoHeight" data-pass-el>${esc(m.commentaires||"")}</textarea>
    </div></div></div>`;

    h += `<h3 class="section-heading">${t("comp.context.frameworks_heading")}</h3>`;
    h += `<div class="meta-item mb-12"><div class="value" style="padding:4px 0;display:flex;flex-wrap:wrap;gap:4px">`;
    for (const [fwId, meta] of Object.entries(_getAllFrameworks())) {
        const active = D.referentiels_actifs.includes(fwId);
        const chipStyle = `border-color:${meta.color};color:${active?"white":meta.color};background:${active?meta.color:"white"}`;
        h += `<span class="ref-chip" style="${chipStyle}" data-click="toggleReferentiel" data-args='${_da(fwId)}' title="${esc(meta.description)}">${active?"✓":"+"} ${esc(meta.label)}</span>`;
    }
    h += '</div>';
    h += '<button class="btn-add" style="margin-top:8px;font-size:0.8em" data-click="importCustomCSV">' + t("comp.csv.btn_import") + '</button>';
    h += ' <a href="#" style="font-size:0.78em;color:var(--light-blue);margin-left:8px" data-click="downloadCSVTemplate">' + t("comp.csv.download_template") + '</a>';
    h += '</div>';
    document.getElementById("context-content").innerHTML = h;
}

function _setMeta(key, val) {
    _saveState(); D.meta[key] = val;
    if (key === "societe") { const s = document.getElementById("header-subtitle"); if (s) s.textContent = val; }
    _autoSave();
}

function toggleReferentiel(fwId) {
    const doToggle = () => {
        _saveState();
        const pos = D.referentiels_actifs.indexOf(fwId);
        if (pos >= 0) { D.referentiels_actifs.splice(pos, 1); }
        else {
            D.referentiels_actifs.push(fwId);
            // Initialize entries if not yet present
            if (!D.referentiels[fwId]) {
                const initRefs = (window.COMPLIANCE_INIT_DATA || {}).referentiels || {};
                if (initRefs[fwId]) {
                    D.referentiels[fwId] = JSON.parse(JSON.stringify(initRefs[fwId]));
                } else {
                    const meta = REFERENTIELS_META[fwId];
                    if (meta && meta.measures) {
                        D.referentiels[fwId] = meta.measures.map(m => ({
                            ref: m.ref, theme: _rt(m, "theme"), mesure: _rt(m, "mesure"), description: _rt(m, "description") || "",
                            applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: []
                        }));
                    }
                }
            }
        }
        renderContext(); renderSidebar(); _autoSave();
    };
    if (fwId !== "anssi" && fwId !== "iso") _ensureFramework(fwId, doToggle);
    else doToggle();
}

// ── Import référentiel custom depuis CSV ──────────────────────────

function downloadCSVTemplate() {
    var header = "ref;theme;mesure;description;theme_en;mesure_en;description_en";
    var example1 = "CUSTOM-01;Gouvernance;Politique de securite;Definir et maintenir une PSSI;Governance;Security Policy;Define and maintain a security policy";
    var example2 = "CUSTOM-02;Acces;Gestion des identites;Controler les acces logiques;Access;Identity Management;Control logical access";
    var example3 = "CUSTOM-03;Protection;Chiffrement des donnees;AES-256 au repos et en transit;Protection;Data Encryption;AES-256 at rest and in transit";
    var csv = header + "\n" + example1 + "\n" + example2 + "\n" + example3 + "\n";
    var blob = new Blob(["\uFEFF" + csv], {type: "text/csv;charset=utf-8"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "referentiel_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
}
window.downloadCSVTemplate = downloadCSVTemplate;

function importCustomCSV() {
    var fi = document.createElement("input");
    fi.type = "file";
    fi.accept = ".csv,.tsv,.txt";
    fi.onchange = function() {
        if (!fi.files[0]) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            _parseAndImportCSV(e.target.result, fi.files[0].name);
        };
        reader.readAsText(fi.files[0]);
    };
    fi.click();
}
window.importCustomCSV = importCustomCSV;

function _parseAndImportCSV(csvText, filename) {
    // Detect separator: ; or , or \t
    var firstLine = csvText.split("\n")[0];
    var sep = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

    var lines = csvText.split("\n").map(function(l) { return l.trim(); }).filter(Boolean);
    if (lines.length < 2) { showStatus(t("comp.csv.error_empty")); return; }

    // Parse header
    var headers = lines[0].split(sep).map(function(h) { return h.trim().toLowerCase().replace(/^["']|["']$/g, ""); });
    var refIdx = headers.indexOf("ref");
    var themeIdx = headers.indexOf("theme");
    var mesureIdx = headers.indexOf("mesure");
    if (mesureIdx < 0) mesureIdx = headers.indexOf("measure");
    if (mesureIdx < 0) mesureIdx = headers.indexOf("control");
    var descIdx = headers.indexOf("description");
    if (descIdx < 0) descIdx = headers.indexOf("details");
    var themeEnIdx = headers.indexOf("theme_en");
    var mesureEnIdx = headers.indexOf("mesure_en");
    if (mesureEnIdx < 0) mesureEnIdx = headers.indexOf("measure_en");
    var descEnIdx = headers.indexOf("description_en");

    if (refIdx < 0 || mesureIdx < 0) {
        showStatus(t("comp.csv.error_columns"));
        return;
    }

    // Parse rows
    var measures = [];
    for (var i = 1; i < lines.length; i++) {
        var cols = _splitCSVLine(lines[i], sep);
        if (cols.length <= mesureIdx) continue;
        var ref = (cols[refIdx] || "").trim();
        var mesure = (cols[mesureIdx] || "").trim();
        if (!ref || !mesure) continue;
        measures.push({
            ref: ref,
            theme: themeIdx >= 0 ? (cols[themeIdx] || "").trim() : "",
            theme_en: themeEnIdx >= 0 ? (cols[themeEnIdx] || "").trim() : "",
            mesure: mesure,
            mesure_en: mesureEnIdx >= 0 ? (cols[mesureEnIdx] || "").trim() : "",
            description: descIdx >= 0 ? (cols[descIdx] || "").trim() : "",
            description_en: descEnIdx >= 0 ? (cols[descEnIdx] || "").trim() : "",
        });
    }

    if (measures.length === 0) { showStatus(t("comp.csv.error_no_measures")); return; }

    // Prompt for framework name
    var label = prompt(t("comp.csv.prompt_name"), filename.replace(/\.(csv|tsv|txt)$/i, ""));
    if (!label) return;

    var fwId = "custom_" + label.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 30) + "_" + Date.now().toString(36);

    // Random color
    var colors = ["#6366f1","#8b5cf6","#a855f7","#ec4899","#06b6d4","#14b8a6","#84cc16","#f97316","#78716c"];
    var color = colors[Math.floor(Math.random() * colors.length)];

    // Register in catalog
    if (!window._REFERENTIELS_CATALOG) window._REFERENTIELS_CATALOG = {};
    window._REFERENTIELS_CATALOG[fwId] = {
        label: label,
        description: t("comp.csv.custom_desc", {count: measures.length}),
        description_en: "Custom framework (" + measures.length + " controls)",
        color: color,
        custom: true,
    };
    REFERENTIELS_META[fwId] = window._REFERENTIELS_CATALOG[fwId];
    REFERENTIELS_META[fwId].measures = measures;

    // Register in COMPLIANCE_REF for lazy loading
    if (!window.COMPLIANCE_REF) window.COMPLIANCE_REF = {};
    window.COMPLIANCE_REF[fwId] = {
        label: label,
        description: window._REFERENTIELS_CATALOG[fwId].description,
        color: color,
        measures: measures,
    };

    // Activate and initialize entries
    _saveState();
    D.referentiels_actifs.push(fwId);
    D.referentiels[fwId] = measures.map(function(m) {
        return {
            ref: m.ref, theme: m.theme, mesure: m.mesure, description: m.description || "",
            applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: []
        };
    });

    // Store custom frameworks in D for persistence
    if (!D._custom_frameworks) D._custom_frameworks = {};
    D._custom_frameworks[fwId] = {
        label: label,
        color: color,
        measures: measures,
    };

    _autoSave();
    renderContext();
    renderSidebar();
    showStatus(t("comp.csv.imported", {label: label, count: measures.length}));
}

function _splitCSVLine(line, sep) {
    // Handle quoted fields (e.g. "field with;semicolon")
    var result = [];
    var current = "";
    var inQuote = false;
    for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '"' && (i === 0 || line[i-1] !== '\\')) {
            inQuote = !inQuote;
        } else if (c === sep && !inQuote) {
            result.push(current);
            current = "";
        } else {
            current += c;
        }
    }
    result.push(current);
    return result;
}

// ── Dashboard global ──────────────────────────────────────────────
function renderDashboard() {
    let h = "";
    const frameworks = [];
    for (const fwId of D.referentiels_actifs) {
        const exigences = _getExigences(fwId);
        const applicable = exigences.filter(e => e.applicable !== false && e.applicable !== "non");
        const ok = applicable.filter(e => _exigenceStatut(e) === "ok").length;
        const ko = applicable.length - ok;
        const pct = applicable.length > 0 ? Math.round(ok * 100 / applicable.length) : 0;
        const excluded = exigences.length - applicable.length;
        const meta = _getAllFrameworks()[fwId];
        frameworks.push({ fwId, label: meta ? meta.label : fwId, total: applicable.length, ok, ko, pct, excluded });
    }
    if (frameworks.length === 0) {
        h = '<div class="synth-card"><p class="text-muted">' + t("comp.dash.no_framework") + '</p></div>';
    } else {
        h += '<div class="indicators">';
        for (const fw of frameworks) {
            const color = fw.pct >= 80 ? "var(--green)" : fw.pct > 0 ? "var(--orange)" : "var(--red)";
            h += `<div class="indicator" style="cursor:pointer" data-click="selectPanel" data-args='${_da("fw:"+fw.fwId+":dashboard")}'>
                <div class="value" style="color:${color}">${fw.pct}%</div>
                <div class="ind-label">${esc(fw.label)}</div>
                <div class="conf-bar"><div class="conf-bar-fill" style="width:${fw.pct}%;background:${color}"></div></div>
                <div class="fs-xs text-muted mt-8">${fw.ok} OK / ${fw.ko} KO${fw.excluded?" ("+fw.excluded+" N/A)":""}</div>
            </div>`;
        }
        h += '</div>';

        // Plan d'action résumé
        const enCours = D.mesures.filter(m => m.statut === "en_cours").length;
        const planifie = D.mesures.filter(m => m.statut === "planifie").length;
        const termine = D.mesures.filter(m => m.statut === "termine").length;
        if (D.mesures.length > 0) {
            h += `<div class="synth-card"><h3>${t("comp.dash.mesures")}</h3><div class="indicators">
                <div class="indicator"><div class="value">${D.mesures.length}</div><div class="ind-label">${t("comp.dash.total")}</div></div>
                <div class="indicator"><div class="value" style="color:var(--green)">${termine}</div><div class="ind-label">${t("comp.dash.terminees")}</div></div>
                <div class="indicator"><div class="value" style="color:var(--light-blue)">${enCours}</div><div class="ind-label">${t("comp.dash.en_cours")}</div></div>
                <div class="indicator"><div class="value" style="color:var(--orange)">${planifie}</div><div class="ind-label">${t("comp.dash.planifiees")}</div></div>
            </div></div>`;
        }
    }
    document.getElementById("dashboard-content").innerHTML = h;
}

// ── Vue par référentiel ───────────────────────────────────────────
function _renderFwView(fwId, subview) {
    const meta = _getAllFrameworks()[fwId];
    const label = meta ? meta.label : fwId;
    if (subview === "dashboard") _renderFwDashboard(fwId, label);
    else if (subview === "exigences") _renderFwExigences(fwId, label);
    else if (subview === "mesures") _renderFwMesures(fwId, label);
    else if (subview === "preuves") _renderFwPreuves(fwId, label);
}

function _renderFwDashboard(fwId, label) {
    const exigences = _getExigences(fwId);
    const applicable = exigences.filter(e => e.applicable !== false && e.applicable !== "non");
    const ok = applicable.filter(e => _exigenceStatut(e) === "ok").length;
    const ko = applicable.length - ok;
    const pct = applicable.length > 0 ? Math.round(ok * 100 / applicable.length) : 0;
    const mesures = _getMesuresForFw(fwId);
    const preuves = _getPreuvesForFw(fwId);
    const today = new Date();

    let h = `<h2 style="color:var(--blue);margin-bottom:16px">${esc(label)}</h2>`;
    const color = pct >= 80 ? "var(--green)" : pct > 0 ? "var(--orange)" : "var(--red)";
    h += `<div class="indicators">
        <div class="indicator"><div class="value" style="color:${color}">${pct}%</div><div class="ind-label">${t("comp.fw_dash.conformite", {ok: ok, ko: ko})}</div></div>
        <div class="indicator"><div class="value">${applicable.length}</div><div class="ind-label">${t("comp.fw_dash.exigences_applicables")}</div></div>
        <div class="indicator"><div class="value">${mesures.length}</div><div class="ind-label">${t("comp.fw_dash.mesures")}</div></div>
        <div class="indicator"><div class="value">${preuves.length}</div><div class="ind-label">${t("comp.fw_dash.preuves")}</div></div>
    </div>`;

    // Actions en cours
    const actions = mesures.filter(m => m.statut !== "termine");
    if (actions.length > 0) {
        h += `<div class="synth-card"><h3>${t("comp.fw_dash.actions_en_cours", {count: actions.length})}</h3><table><thead><tr><th>${t("comp.fw_dash.col_id")}</th><th>${t("comp.fw_dash.col_description")}</th><th>${t("comp.fw_dash.col_statut")}</th><th>${t("comp.fw_dash.col_echeance")}</th></tr></thead><tbody>`;
        actions.forEach(m => {
            h += `<tr style="cursor:pointer" data-click="_goEditMesure" data-args='${_da(fwId,m.id)}'><td class="fw-600">${esc(m.id)}</td><td>${esc(m.description)}</td><td>${_mesureBadge(m)}</td><td>${esc(m.date_cible||"—")}</td></tr>`;
        });
        h += '</tbody></table></div>';
    }

    // Preuves expirant bientôt (< 90 jours)
    const expiring = preuves.filter(p => {
        if (!p.date_expiration) return false;
        const exp = new Date(p.date_expiration);
        return (exp - today) < 90 * 86400000;
    });
    if (expiring.length > 0) {
        h += `<div class="synth-card" style="border-color:var(--orange)"><h3 style="color:var(--orange)">${t("comp.fw_dash.preuves_expirant", {count: expiring.length})}</h3><table><thead><tr><th>${t("comp.fw_dash.col_id")}</th><th>${t("comp.fw_dash.col_label")}</th><th>${t("comp.fw_dash.col_expiration")}</th></tr></thead><tbody>`;
        expiring.forEach(p => {
            const expired = new Date(p.date_expiration) < today;
            h += `<tr style="${expired?"background:#fef2f2":""}"><td class="fw-600">${esc(p.id)}</td><td>${esc(p.label)}</td><td>${expired?ctBadge(t("comp.prv.expiree"),"red"):esc(p.date_expiration)}</td></tr>`;
        });
        h += '</tbody></table></div>';
    }

    document.getElementById("fw-desc").textContent = "Dashboard " + label;
    document.getElementById("fw-content").innerHTML = h;
}

// ── Exigences ─────────────────────────────────────────────────────
let _exigFilter = "";

function _filterExigences(fwId, val) {
    _exigFilter = val;
    _renderFwView(fwId, "exigences");
}

function _renderFwExigences(fwId, label) {
    const allExigences = _getExigences(fwId);
    const getDesc = fwId === "anssi" ? _getAnssDesc : fwId === "iso" ? _getIsoDesc : null;
    const filter = _exigFilter.toLowerCase();
    // Filtrer en conservant l'index original
    const exigences = [];
    allExigences.forEach((e, origIdx) => {
        if (filter) {
            const ref = _getExigRef(fwId, e);
            const theme = (_rt(e, "thematique") || _rt(e, "theme") || "").toLowerCase();
            const mesure = (_rt(e, "mesure") || "").toLowerCase();
            const ecart = (e.ecart || "").toLowerCase();
            if (!ref.toLowerCase().includes(filter) && !theme.includes(filter) && !mesure.includes(filter) && !ecart.includes(filter)) return;
        }
        exigences.push({ entry: e, origIdx });
    });

    let h = `<h2 style="color:var(--blue);margin-bottom:16px">${t("comp.exig.title", {label: esc(label)})}</h2>`;
    h += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <input type="text" placeholder="${t("comp.exig.search")}" value="${esc(_exigFilter)}" style="flex:1;max-width:300px" data-input="_filterExigences" data-args='${_da(fwId)}' data-pass-value />
        <span class="fs-xs text-muted">${t("comp.exig.count", {filtered: exigences.length, total: allExigences.length})}</span>
    </div>`;
    h += `<table id="exig-${fwId}-table"><thead><tr>`;
    h += `<th${hd("ref")} style="width:60px">${t("comp.exig.col_ref")}</th>`;
    h += `<th${hd("theme")} style="min-width:100px">${t("comp.exig.col_theme")}</th>`;
    h += `<th${hd("mesure")} style="max-width:300px">${t("comp.exig.col_mesure")}</th>`;
    h += `<th${hd("appl")} style="width:50px" class="ta-c">${t("comp.exig.col_appl")}</th>`;
    h += `<th${hd("statut")} style="width:70px" class="ta-c">${t("comp.exig.col_statut")}</th>`;
    h += `<th${hd("ecart")} style="min-width:250px">${t("comp.exig.col_commentaires")}</th>`;
    h += `<th${hd("mes")} style="min-width:200px">${t("comp.exig.col_mesures_liees")}</th>`;
    h += `</tr></thead><tbody>`;

    exigences.forEach((item) => {
        const e = item.entry;
        const i = item.origIdx;
        const ref = _getExigRef(fwId, e);
        const theme = _rt(e, "thematique") || _rt(e, "theme");
        const notApplicable = e.applicable === false || e.applicable === "non";
        const desc = getDesc ? getDesc(ref) : (_rt(e, "description") || "");

        // Statut calculé
        const statut = _exigenceStatut(e);
        const statutColor = _exigStatutColors[statut] || "var(--text-muted)";

        // Mesures liées avec statut effectif
        const linkedMesures = (e.mesures_ids || []).map(id => _getMesure(id)).filter(Boolean);
        const enPlace = linkedMesures.filter(m => _mesureEffectiveStatut(m) === "termine");
        const prevues = linkedMesures.filter(m => _mesureEffectiveStatut(m) !== "termine");

        h += `<tr${notApplicable?' style="background:#f1f5f9"':''}>`;
        h += `<td${hd("ref")} class="fw-600">${esc(ref)}</td>`;
        h += `<td${hd("theme")} class="fs-sm">${esc(theme)}</td>`;
        h += `<td${hd("mesure")}><div>${esc(_rt(e, "mesure"))}</div>${desc?'<div class="desc-text">'+esc(desc)+'</div>':""}</td>`;
        h += `<td${hd("appl")} class="ta-c"><input type="checkbox" ${!notApplicable?"checked":""} data-change="_toggleApplicable" data-args='${_da(fwId,i)}' data-pass-checked /></td>`;
        h += `<td${hd("statut")} class="ta-c">${ctBadge(_exigStatutLabel(statut), statutColor)}</td>`;
        h += `<td${hd("ecart")}><textarea rows="3" class="w-full" placeholder="${notApplicable?t("comp.exig.placeholder_na"):t("comp.exig.placeholder_comments")}" data-change="_updateExig" data-args='${_da(fwId,i,"ecart")}' data-pass-value data-input="_autoHeight" data-pass-el>${esc(e.ecart||"")}</textarea></td>`;

        // Colonne mesures liées
        h += `<td${hd("mes")}>`;
        if (enPlace.length > 0) {
            h += '<div class="fs-xs fw-600 mb-8" style="color:var(--green)">' + t("comp.exig.en_place") + '</div>';
            enPlace.forEach(m => {
                h += `<div class="linked-tag"><span style="cursor:pointer" data-click="_goEditMesure" data-args='${_da(fwId,m.id)}'>${esc(m.id)} ${esc(m.description).substring(0,40)}</span><span class="tag-x" data-click="_unlinkMesure" data-args='${_da(fwId,i,m.id)}' data-stop>×</span></div>`;
            });
        }
        if (prevues.length > 0) {
            h += '<div class="fs-xs fw-600 mb-8 mt-8" style="color:var(--orange)">' + t("comp.exig.prevues") + '</div>';
            prevues.forEach(m => {
                h += `<div class="linked-tag"><span style="cursor:pointer" data-click="_goEditMesure" data-args='${_da(fwId,m.id)}'>${esc(m.id)} ${esc(m.description).substring(0,40)}</span><span class="tag-x" data-click="_unlinkMesure" data-args='${_da(fwId,i,m.id)}' data-stop>×</span></div>`;
            });
        }
        // Sélecteur pour lier une mesure existante
        const mesOpts = D.mesures.filter(m => !(e.mesures_ids||[]).includes(m.id)).map(m => ({value: m.id, label: m.id + " " + (m.description||"").substring(0,40)}));
        h += `<div class="mt-8">${_searchSelect(t("comp.exig.lier_mesure"), mesOpts, "_linkExistingMesure", [fwId, i])}
            <button class="btn-add fs-xs" style="padding:2px 6px;margin-left:4px" data-click="_createAndLinkMesure" data-args='${_da(fwId,i)}'>${t("comp.exig.btn_nouvelle")}</button>
            <button class="btn-add fs-xs" style="padding:2px 6px;margin-left:4px;background:var(--light-blue)" data-click="_proposerMesures" data-args='${_da(fwId,i)}'>${t("comp.exig.btn_proposer")}</button>
        </div></td>`;
        h += '</tr>';
    });
    h += '</tbody></table>';
    h += colsButton("exig-" + fwId + "-table");

    document.getElementById("fw-desc").textContent = t("comp.exig.fw_desc", {label: label});
    document.getElementById("fw-content").innerHTML = h;
    _setupTable("exig-" + fwId + "-table");
}

// Handlers exigences
function _toggleApplicable(fwId, idx, checked) {
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    entry.applicable = checked;
    if (!checked) entry.conformite = "";
    _renderFwView(fwId, "exigences");
    _autoSave();
}

// Conformité calculée automatiquement (voir _exigenceStatut)

function _updateExig(fwId, idx, field, val) {
    _getExigEntry(fwId, idx)[field] = val;
    _autoSave();
}

function _getExigEntry(fwId, idx) {
    return ((D.referentiels && D.referentiels[fwId]) || [])[idx] || {};
}

function _linkExistingMesure(fwId, idx, mesureId) {
    if (!mesureId) return;
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    if (!entry.mesures_ids) entry.mesures_ids = [];
    if (!entry.mesures_ids.includes(mesureId)) entry.mesures_ids.push(mesureId);
    _renderFwView(fwId, "exigences");
    _autoSave();
}

function _createAndLinkMesure(fwId, idx) {
    _saveState();
    const id = _genMesureId();
    D.mesures.push({ id, description: "", details: "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] });
    const entry = _getExigEntry(fwId, idx);
    if (!entry.mesures_ids) entry.mesures_ids = [];
    entry.mesures_ids.push(id);
    _editingMesure = id;
    _mesureEditReturnTo = "fw:" + fwId + ":exigences";
    selectPanel("fw:" + fwId + ":mesures");
    _autoSave();
}

function _unlinkMesure(fwId, idx, mesureId) {
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    entry.mesures_ids = (entry.mesures_ids || []).filter(id => id !== mesureId);
    _renderFwView(fwId, "exigences");
    _autoSave();
}

// ── Mesures (par référentiel) ─────────────────────────────────────
let _editingMesure = null;
let _mesureEditReturnTo = null; // "fw:anssi:exigences" si on vient des exigences

let _mesureFilter = "";

function _renderFwMesures(fwId, label) {
    // N'afficher que les mesures liées au référentiel courant
    const fwMesureIds = new Set();
    _getExigences(fwId).forEach(e => (e.mesures_ids||[]).forEach(id => fwMesureIds.add(id)));
    const filter = _mesureFilter.toLowerCase();
    const mesures = D.mesures.filter(m => {
        if (!fwMesureIds.has(m.id)) return false;
        if (!filter) return true;
        return (m.id + " " + (m.description||"") + " " + (m.responsable||"")).toLowerCase().includes(filter);
    });

    let h = `<h2 style="color:var(--blue);margin-bottom:16px">${t("comp.mes.title", {label: esc(label)})}</h2>`;
    h += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <button class="btn-add" data-click="_addMesure" data-args='${_da(fwId)}'>${t("comp.mes.btn_nouvelle")}</button>
        <input type="text" placeholder="${t("comp.mes.search")}" value="${esc(_mesureFilter)}" style="flex:1;max-width:300px" data-input="_filterMesures" data-args='${_da(fwId)}' data-pass-value />
        <span class="fs-xs text-muted">${t("comp.mes.count", {count: mesures.length})}</span>
    </div>`;

    // Mesure en édition ?
    if (_editingMesure) {
        const m = _getMesure(_editingMesure);
        if (m) {
            h += `<div class="measure-card editing" style="background:#f1f5f9;margin-bottom:16px">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                    <strong>${esc(m.id)}</strong>
                    <span class="flex-spacer"></span>
                    <button class="btn-del" data-click="_deleteMesure" data-args='${_da(m.id,fwId)}'>${t("comp.mes.btn_supprimer")}</button>
                    <button class="btn-add fs-xs" data-click="_closeMesureEdit" data-args='${_da(fwId)}'>${t("comp.mes.btn_valider")}</button>
                </div>
                <textarea rows="2" class="w-full mb-4" placeholder="${t("comp.mes.placeholder_desc")}" data-change="_updateMesure" data-args='${_da(m.id,"description")}' data-pass-value data-input="_autoHeight" data-pass-el>${esc(m.description||"")}</textarea>
                <textarea rows="2" class="w-full mb-8 fs-sm" style="color:var(--text-muted)" placeholder="${t("comp.mes.placeholder_details")}" data-change="_updateMesure" data-args='${_da(m.id,"details")}' data-pass-value data-input="_autoHeight" data-pass-el>${esc(m.details||"")}</textarea>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
                    <label class="fs-xs">${t("comp.mes.label_statut")}
                        <select data-change="_updateMesure" data-args='${_da(m.id,"statut")}' data-pass-value>
                            <option value="">—</option>
                            ${["planifie","en_cours","termine"].map(s => `<option value="${s}" ${m.statut===s?"selected":""}>${_statutLabel(s)}</option>`).join("")}
                        </select>
                    </label>
                    <label class="fs-xs">${t("comp.mes.label_echeance")} <input type="date" value="${esc(m.date_cible||"")}" data-change="_updateMesure" data-args='${_da(m.id,"date_cible")}' data-pass-value /></label>
                    <label class="fs-xs">${t("comp.mes.label_responsable")} <input type="text" value="${esc(m.responsable||"")}" data-change="_updateMesure" data-args='${_da(m.id,"responsable")}' data-pass-value /></label>
                    <label class="fs-xs">${t("comp.mes.label_recurrence")}
                        <select data-change="_updateMesure" data-args='${_da(m.id,"recurrence")}' data-pass-value>
                            <option value="">—</option>
                            ${["ponctuel","mensuelle","trimestrielle","semestrielle","annuelle"].map(r => `<option value="${r}" ${m.recurrence===r?"selected":""}>${_recLabel(r)}</option>`).join("")}
                        </select>
                    </label>
                    <label class="fs-xs">${t("comp.mes.label_dernier_controle")} <input type="date" value="${esc(m.dernier_controle||"")}" data-change="_updateMesure" data-args='${_da(m.id,"dernier_controle")}' data-pass-value /></label>
                </div>
                <div class="fs-xs fw-600 mb-8">${t("comp.mes.exigences_liees")}</div>
                ${_renderLinkedExigences(m.id, fwId)}
                <div class="fs-xs fw-600 mb-8 mt-8">${t("comp.mes.preuves_liees")}</div>
                ${(m.preuves_ids||[]).map(pid => {
                    const p = _getPreuve(pid);
                    return p ? `<div class="linked-tag"><span style="cursor:pointer" data-click="_goEditPreuveFromMesure" data-args='${_da(fwId,m.id,pid)}'>${esc(p.id)} ${esc(p.label)}</span><span class="tag-x" data-click="_unlinkPreuve" data-args='${_da(m.id,pid,fwId)}' data-stop>×</span></div>` : "";
                }).join("")}
                ${_searchSelect(t("comp.mes.lier_preuve"), D.preuves.filter(p => !(m.preuves_ids||[]).includes(p.id)).map(p => ({value:p.id,label:p.id+" "+p.label})), "_linkExistingPreuve", [m.id, fwId])}
                <button class="btn-add fs-xs" style="margin-left:4px" data-click="_createAndLinkPreuve" data-args='${_da(m.id,fwId)}'>${t("comp.mes.btn_nouvelle_preuve")}</button>
            </div>`;
        }
    }

    // Tableau des mesures
    if (mesures.length > 0) {
        h += `<table id="mesures-${fwId}-table"><thead><tr>
            <th${hd("mid")} style="width:70px">${t("comp.mes.col_id")}</th>
            <th${hd("desc")}>${t("comp.mes.col_description")}</th>
            <th${hd("statut")} style="width:90px">${t("comp.mes.col_statut")}</th>
            <th${hd("resp")} style="width:100px">${t("comp.mes.col_responsable")}</th>
            <th${hd("ech")} style="width:90px">${t("comp.mes.col_echeance")}</th>
            <th${hd("rec")} style="width:90px">${t("comp.mes.col_recurrence")}</th>
            <th${hd("prv")} style="width:70px">${t("comp.mes.col_preuves")}</th>
            <th${hd("exig")} style="min-width:100px">${t("comp.mes.col_exigences")}</th>
            <th${hd("refs")} style="min-width:80px">${t("comp.mes.col_referentiels")}</th>
        </tr></thead><tbody>`;
        mesures.forEach(m => {
            const linkedExigs = _findExigencesForMesure(m.id);
            const linkedFws = _findFwsForMesure(m.id);
            const isFw = fwMesureIds.has(m.id);
            h += `<tr style="cursor:pointer" data-click="_editMesure" data-args='${_da(fwId,m.id)}'>
                <td${hd("mid")} class="fw-600">${esc(m.id)}</td>
                <td${hd("desc")}>${esc(m.description||"—")}</td>
                <td${hd("statut")}>${_mesureBadge(m)}</td>
                <td${hd("resp")}>${esc(m.responsable||"—")}</td>
                <td${hd("ech")}>${esc(m.date_cible||"—")}</td>
                <td${hd("rec")}>${m.recurrence?esc(_recLabel(m.recurrence)):"—"}</td>
                <td${hd("prv")} class="ta-c">${(m.preuves_ids||[]).length||"—"}</td>
                <td${hd("exig")} class="fs-xs">${linkedExigs.join(", ")||"—"}</td>
                <td${hd("refs")} class="fs-xs">${linkedFws.join(", ")||"—"}</td>
            </tr>`;
        });
        h += '</tbody></table>';
        h += colsButton("mesures-" + fwId + "-table");
    }

    document.getElementById("fw-desc").textContent = t("comp.mes.fw_desc", {label: label});
    document.getElementById("fw-content").innerHTML = h;
    _setupTable("mesures-" + fwId + "-table");
}

function _filterMesures(fwId, val) {
    _mesureFilter = val;
    _renderFwView(fwId, "mesures");
}

function _findExigencesForMesure(mesureId) {
    const result = [];
    for (const fwId of D.referentiels_actifs) {
        const exigences = _getExigences(fwId);
        exigences.forEach(e => {
            if ((e.mesures_ids||[]).includes(mesureId)) result.push(e.ref || "");
        });
    }
    return result;
}

function _findFwsForMesure(mesureId) {
    const fws = new Set();
    for (const fwId of D.referentiels_actifs) {
        const exigences = _getExigences(fwId);
        exigences.forEach(e => {
            if ((e.mesures_ids||[]).includes(mesureId)) fws.add(fwId);
        });
    }
    return Array.from(fws).map(id => {
        const meta = _getAllFrameworks()[id];
        return meta ? meta.label : id;
    });
}

function _addMesure(fwId) {
    _saveState();
    const id = _genMesureId();
    D.mesures.push({ id, description: "", details: "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] });
    _editingMesure = id;
    _renderFwView(fwId, "mesures");
    _autoSave();
}

function _editMesure(fwId, mesureId) {
    _editingMesure = mesureId;
    _mesureEditReturnTo = null;
    _renderFwView(fwId, "mesures");
    var card = document.querySelector(".measure-card.editing");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function _goEditMesure(fwId, mesureId) {
    _editingMesure = mesureId;
    _mesureEditReturnTo = _currentPanel || ("fw:" + fwId + ":exigences");
    selectPanel("fw:" + fwId + ":mesures");
    _scrollToEditingCard();
}
function _scrollToEditingCard() {
    var card = document.querySelector(".measure-card.editing");
    if (card) { card.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    // Retry after async loading (script fetch for framework data)
    setTimeout(function() {
        var c = document.querySelector(".measure-card.editing");
        if (c) c.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
}

function _closeMesureEdit(fwId) {
    _editingMesure = null;
    if (_mesureEditReturnTo) {
        const ret = _mesureEditReturnTo;
        _mesureEditReturnTo = null;
        selectPanel(ret);
    } else {
        _renderFwView(fwId, "mesures");
    }
}

// Rendu des exigences liées à une mesure (dans la vue édition mesure)
function _renderLinkedExigences(mesureId, currentFwId) {
    let h = "";
    // Afficher les exigences déjà liées (tous référentiels)
    const linked = [];
    for (const fwId of D.referentiels_actifs) {
        const exigences = _getExigences(fwId);
        const meta = _getAllFrameworks()[fwId];
        const fwLabel = meta ? meta.label : fwId;
        exigences.forEach((e, i) => {
            const ref = _getExigRef(fwId, e);
            if ((e.mesures_ids || []).includes(mesureId)) {
                linked.push({ fwId, idx: i, ref, fwLabel });
            }
        });
    }
    linked.forEach(l => {
        h += `<div class="linked-tag">${esc(l.fwLabel)} — ${esc(l.ref)}<span class="tag-x" data-click="_unlinkMesureFromEdit" data-args='${_da(mesureId,l.fwId,l.idx,currentFwId)}' data-stop>×</span></div>`;
    });

    // Sélecteur pour lier à une exigence (groupé par référentiel)
    const exigOpts = [];
    for (const fwId of D.referentiels_actifs) {
        const exigences = _getExigences(fwId);
        const meta = _getAllFrameworks()[fwId];
        const fwLabel = meta ? meta.label : fwId;
        exigences.forEach((e, i) => {
            const ref = _getExigRef(fwId, e);
            if (!(e.mesures_ids || []).includes(mesureId)) {
                exigOpts.push({value: fwId + ":" + i, label: fwLabel + " — " + ref + " " + (_rt(e, "mesure")||"").substring(0,40)});
            }
        });
    }
    h += _searchSelect(t("comp.mes.lier_exigence"), exigOpts, "_linkMesureToExig", [mesureId, currentFwId]);
    return h;
}

function _linkMesureToExig(mesureId, currentFwId, val) {
    if (!val) return;
    _saveState();
    const [fwId, idxStr] = val.split(":");
    const idx = parseInt(idxStr);
    const entry = _getExigEntry(fwId, idx);
    if (!entry.mesures_ids) entry.mesures_ids = [];
    if (!entry.mesures_ids.includes(mesureId)) entry.mesures_ids.push(mesureId);
    _editingMesure = mesureId;
    if (currentFwId && _currentPanel.startsWith("fw:")) {
        _renderFwView(currentFwId, "mesures");
    } else {
        renderPlan();
    }
    _autoSave();
}

function _unlinkMesureFromEdit(mesureId, fwId, idx, currentFwId) {
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    entry.mesures_ids = (entry.mesures_ids || []).filter(id => id !== mesureId);
    // Garder l'édition ouverte et re-rendre
    _editingMesure = mesureId;
    if (currentFwId && _currentPanel.startsWith("fw:")) {
        _renderFwView(currentFwId, "mesures");
    } else {
        renderPlan();
    }
    _autoSave();
}

function _updateMesure(mesureId, field, val) {
    const m = _getMesure(mesureId);
    if (m) { m[field] = val; _autoSave(); }
}

function _deleteMesure(mesureId, fwId) {
    if (!confirm(t("comp.confirm.delete_mesure", {id: mesureId}))) return;
    _saveState();
    D.mesures = D.mesures.filter(m => m.id !== mesureId);
    // Retirer des exigences de tous les référentiels
    const cleanup = items => items.forEach(e => { if (e.mesures_ids) e.mesures_ids = e.mesures_ids.filter(id => id !== mesureId); });
    for (const fw of Object.values(D.referentiels || {})) {
        if (Array.isArray(fw)) cleanup(fw);
    }
    _editingMesure = null;
    _renderFwView(fwId, "mesures");
    _autoSave();
}

function _linkExistingPreuve(mesureId, fwId, preuveId) {
    if (!preuveId) return;
    _saveState();
    const m = _getMesure(mesureId);
    if (m) {
        if (!m.preuves_ids) m.preuves_ids = [];
        if (!m.preuves_ids.includes(preuveId)) m.preuves_ids.push(preuveId);
    }
    _renderFwView(fwId, "mesures");
    _autoSave();
}

function _unlinkPreuve(mesureId, preuveId, fwId) {
    _saveState();
    const m = _getMesure(mesureId);
    if (m) m.preuves_ids = (m.preuves_ids||[]).filter(id => id !== preuveId);
    _renderFwView(fwId, "mesures");
    _autoSave();
}

function _createAndLinkPreuve(mesureId, fwId) {
    _saveState();
    const id = _genPreuveId();
    D.preuves.push({ id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" });
    const m = _getMesure(mesureId);
    if (m) {
        if (!m.preuves_ids) m.preuves_ids = [];
        m.preuves_ids.push(id);
    }
    _editingPreuve = id;
    _preuveEditReturnTo = "fw:" + fwId + ":mesures";
    selectPanel("fw:" + fwId + ":preuves");
    showStatus(t("comp.status.preuve_created", {id: id}));
    _autoSave();
}

// ── Preuves (par référentiel) ─────────────────────────────────────
let _editingPreuve = null;
let _preuveEditReturnTo = null;

let _preuveFilter = "";

function _renderFwPreuves(fwId, label) {
    const fwPreuveIds = new Set();
    _getMesuresForFw(fwId).forEach(m => (m.preuves_ids||[]).forEach(id => fwPreuveIds.add(id)));
    const filter = _preuveFilter.toLowerCase();
    const today = new Date();
    const preuves = D.preuves.filter(p => {
        if (!filter) return true;
        return (p.id + " " + (p.label||"") + " " + (p.url||"") + " " + (p.commentaire||"")).toLowerCase().includes(filter);
    });

    // Trouver les mesures liées à chaque preuve
    function _findMesuresForPreuve(preuveId) {
        return D.mesures.filter(m => (m.preuves_ids||[]).includes(preuveId)).map(m => m.id);
    }

    let h = `<h2 style="color:var(--blue);margin-bottom:16px">${t("comp.prv.title", {label: esc(label)})}</h2>`;
    h += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <button class="btn-add" data-click="_addPreuveGlobal" data-args='${_da(fwId)}'>${t("comp.prv.btn_nouvelle")}</button>
        <input type="text" placeholder="${t("comp.prv.search")}" value="${esc(_preuveFilter)}" style="flex:1;max-width:300px" data-input="_filterPreuves" data-args='${_da(fwId)}' data-pass-value />
        <span class="fs-xs text-muted">${t("comp.prv.count", {count: preuves.length})}</span>
    </div>`;

    // Preuve en édition
    if (_editingPreuve) {
        const p = _getPreuve(_editingPreuve);
        if (p) {
            h += `<div class="measure-card editing" style="background:#f1f5f9;margin-bottom:16px">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                    <strong>${esc(p.id)}</strong><span class="flex-spacer"></span>
                    <button class="btn-del" data-click="_deletePreuve" data-args='${_da(p.id,fwId)}'>${t("comp.prv.btn_supprimer")}</button>
                    <button class="btn-add fs-xs" data-click="_closePreuveEdit" data-args='${_da(fwId)}'>${t("comp.prv.btn_valider")}</button>
                </div>
                <input type="text" class="w-full mb-8" placeholder="${t("comp.prv.placeholder_label")}" value="${esc(p.label||"")}" data-change="_updatePreuveField" data-args='${_da(p.id,"label")}' data-pass-value />
                <input type="text" class="w-full mb-8" placeholder="${t("comp.prv.placeholder_url")}" value="${esc(p.url||"")}" data-change="_updatePreuveField" data-args='${_da(p.id,"url")}' data-pass-value />
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
                    <label class="fs-xs">${t("comp.prv.label_obtention")} <input type="date" value="${esc(p.date_obtention||"")}" data-change="_updatePreuveField" data-args='${_da(p.id,"date_obtention")}' data-pass-value /></label>
                    <label class="fs-xs">${t("comp.prv.label_expiration")} <input type="date" value="${esc(p.date_expiration||"")}" data-change="_updatePreuveField" data-args='${_da(p.id,"date_expiration")}' data-pass-value /></label>
                </div>
                <textarea rows="2" class="w-full mb-8" placeholder="${t("comp.prv.placeholder_comment")}" data-change="_updatePreuveField" data-args='${_da(p.id,"commentaire")}' data-pass-value data-input="_autoHeight" data-pass-el>${esc(p.commentaire||"")}</textarea>
                <div class="fs-xs fw-600 mb-8">${t("comp.prv.mesures_liees")}</div>
                ${_findMesuresForPreuve(p.id).map(mid => `<span class="linked-tag">${esc(mid)}</span>`).join("") || '<span class="text-muted fs-xs">' + t("comp.prv.aucune") + '</span>'}
            </div>`;
        }
    }

    // Tableau
    if (preuves.length > 0) {
        h += `<table id="preuves-${fwId}-table"><thead><tr>
            <th${hd("pid")} style="width:70px">${t("comp.prv.col_id")}</th>
            <th${hd("label")}>${t("comp.prv.col_label")}</th>
            <th${hd("url")}>${t("comp.prv.col_url")}</th>
            <th${hd("obt")} style="width:100px">${t("comp.prv.col_obtention")}</th>
            <th${hd("exp")} style="width:100px">${t("comp.prv.col_expiration")}</th>
            <th${hd("mes")} style="width:100px">${t("comp.prv.col_mesures")}</th>
            <th${hd("sts")} style="width:80px">${t("comp.prv.col_statut")}</th>
        </tr></thead><tbody>`;
        preuves.forEach(p => {
            const isFw = fwPreuveIds.has(p.id);
            const expired = p.date_expiration && new Date(p.date_expiration) < today;
            const soonDays = p.date_expiration ? Math.ceil((new Date(p.date_expiration) - today) / 86400000) : null;
            const linkedMesures = _findMesuresForPreuve(p.id);
            let statut = "—";
            if (expired) statut = badge(t("comp.prv.expiree"), "var(--red)");
            else if (soonDays !== null && soonDays < 90) statut = badge(t("comp.prv.bientot"), "var(--orange)");
            else if (p.date_expiration) statut = badge(t("comp.prv.ok"), "var(--green)");

            h += `<tr style="cursor:pointer${!isFw?";opacity:0.5":""}${expired?";background:#fef2f2":""}" data-click="_editPreuve" data-args='${_da(fwId,p.id)}'>
                <td${hd("pid")} class="fw-600">${esc(p.id)}</td>
                <td${hd("label")}>${esc(p.label||"—")}</td>
                <td${hd("url")} class="fs-xs">${p.url ? '<a href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer" data-stop>'+esc(p.url).substring(0,40)+'</a>' : "—"}</td>
                <td${hd("obt")}>${esc(p.date_obtention||"—")}</td>
                <td${hd("exp")}>${esc(p.date_expiration||"—")}</td>
                <td${hd("mes")} class="fs-xs">${linkedMesures.join(", ")||"—"}</td>
                <td${hd("sts")}>${statut}</td>
            </tr>`;
        });
        h += '</tbody></table>';
        h += colsButton("preuves-" + fwId + "-table");
    }

    document.getElementById("fw-desc").textContent = t("comp.prv.fw_desc", {label: label});
    document.getElementById("fw-content").innerHTML = h;
    _setupTable("preuves-" + fwId + "-table");
}

function _filterPreuves(fwId, val) {
    _preuveFilter = val;
    _renderFwView(fwId, "preuves");
}

function _addPreuveGlobal(fwId) {
    _saveState();
    const id = _genPreuveId();
    D.preuves.push({ id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" });
    _editingPreuve = id;
    _renderFwView(fwId, "preuves");
    _autoSave();
}

function _editPreuve(fwId, preuveId) {
    _editingPreuve = preuveId;
    _preuveEditReturnTo = null;
    _renderFwView(fwId, "preuves");
}

// Depuis l'édition d'une mesure : éditer la preuve puis revenir à la mesure
let _returnToMesureId = null;
function _goEditPreuveFromMesure(fwId, mesureId, preuveId) {
    _editingPreuve = preuveId;
    _returnToMesureId = mesureId;
    _preuveEditReturnTo = "fw:" + fwId + ":mesures";
    selectPanel("fw:" + fwId + ":preuves");
}

function _closePreuveEdit(fwId) {
    _editingPreuve = null;
    if (_preuveEditReturnTo) {
        const ret = _preuveEditReturnTo;
        _preuveEditReturnTo = null;
        // Rouvrir l'édition de la mesure si on venait de là
        if (_returnToMesureId) {
            _editingMesure = _returnToMesureId;
            _returnToMesureId = null;
        }
        selectPanel(ret);
    } else {
        _renderFwView(fwId, "preuves");
    }
}

function _updatePreuveField(preuveId, field, val) {
    const p = _getPreuve(preuveId);
    if (p) { p[field] = val; _autoSave(); }
}

function _deletePreuve(preuveId, fwId) {
    if (!confirm(t("comp.confirm.delete_preuve", {id: preuveId}))) return;
    _saveState();
    D.preuves = D.preuves.filter(p => p.id !== preuveId);
    D.mesures.forEach(m => { if (m.preuves_ids) m.preuves_ids = m.preuves_ids.filter(id => id !== preuveId); });
    _editingPreuve = null;
    _renderFwView(fwId, "preuves");
    _autoSave();
}

// ── Plan d'action global ──────────────────────────────────────────
let _planFilter = "";

function renderPlan() {
    const filter = _planFilter.toLowerCase();
    const mesures = D.mesures.filter(m => {
        if (!filter) return true;
        return (m.id + " " + (m.description||"") + " " + (m.responsable||"")).toLowerCase().includes(filter);
    });

    let h = `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <button class="btn-add" data-click="_addMesurePlan">${t("comp.plan.btn_nouvelle")}</button>
        <input type="text" placeholder="${t("comp.plan.search")}" value="${esc(_planFilter)}" style="flex:1;max-width:300px" data-input="_filterPlan" data-pass-value />
        <span class="fs-xs text-muted">${t("comp.plan.count", {count: mesures.length})}</span>
    </div>`;

    // Formulaire d'édition si ouvert
    if (_editingMesure) {
        const m = _getMesure(_editingMesure);
        if (m) {
            h += `<div class="measure-card editing" style="background:#f1f5f9;margin-bottom:16px">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                    <strong>${esc(m.id)}</strong>
                    <span class="flex-spacer"></span>
                    <button class="btn-del" data-click="_deleteMesurePlan" data-args='${_da(m.id)}'>${t("comp.mes.btn_supprimer")}</button>
                    <button class="btn-add fs-xs" data-click="_closePlanEdit">${t("comp.mes.btn_valider")}</button>
                </div>
                <textarea rows="2" class="w-full mb-4" placeholder="${t("comp.mes.placeholder_desc")}" data-change="_updateMesure" data-args='${_da(m.id,"description")}' data-pass-value data-input="_autoHeight" data-pass-el>${esc(m.description||"")}</textarea>
                <textarea rows="2" class="w-full mb-8 fs-sm" style="color:var(--text-muted)" placeholder="${t("comp.mes.placeholder_details")}" data-change="_updateMesure" data-args='${_da(m.id,"details")}' data-pass-value data-input="_autoHeight" data-pass-el>${esc(m.details||"")}</textarea>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
                    <label class="fs-xs">${t("comp.mes.label_statut")}
                        <select data-change="_updateMesure" data-args='${_da(m.id,"statut")}' data-pass-value>
                            <option value="">—</option>
                            ${["planifie","en_cours","termine"].map(s => `<option value="${s}" ${m.statut===s?"selected":""}>${_statutLabel(s)}</option>`).join("")}
                        </select>
                    </label>
                    <label class="fs-xs">${t("comp.mes.label_echeance")} <input type="date" value="${esc(m.date_cible||"")}" data-change="_updateMesure" data-args='${_da(m.id,"date_cible")}' data-pass-value /></label>
                    <label class="fs-xs">${t("comp.mes.label_responsable")} <input type="text" value="${esc(m.responsable||"")}" data-change="_updateMesure" data-args='${_da(m.id,"responsable")}' data-pass-value /></label>
                    <label class="fs-xs">${t("comp.mes.label_recurrence")}
                        <select data-change="_updateMesure" data-args='${_da(m.id,"recurrence")}' data-pass-value>
                            <option value="">—</option>
                            ${["ponctuel","mensuelle","trimestrielle","semestrielle","annuelle"].map(r => `<option value="${r}" ${m.recurrence===r?"selected":""}>${_recLabel(r)}</option>`).join("")}
                        </select>
                    </label>
                    <label class="fs-xs">${t("comp.mes.label_dernier_controle")} <input type="date" value="${esc(m.dernier_controle||"")}" data-change="_updateMesure" data-args='${_da(m.id,"dernier_controle")}' data-pass-value /></label>
                </div>
                <div class="fs-xs fw-600 mb-8">${t("comp.mes.exigences_liees")}</div>
                ${_renderLinkedExigences(m.id, null)}
                <div class="fs-xs fw-600 mb-8 mt-8">${t("comp.mes.preuves_liees")}</div>
                ${(m.preuves_ids||[]).map(pid => {
                    const p = _getPreuve(pid);
                    return p ? `<div class="linked-tag"><span style="cursor:pointer" data-click="_goEditPreuveFromPlan" data-args='${_da(m.id,pid)}'>${esc(p.id)} ${esc(p.label)}</span><span class="tag-x" data-click="_unlinkPreuvePlan" data-args='${_da(m.id,pid)}' data-stop>×</span></div>` : "";
                }).join("")}
                ${_searchSelect(t("comp.mes.lier_preuve"), D.preuves.filter(p => !(m.preuves_ids||[]).includes(p.id)).map(p => ({value:p.id,label:p.id+" "+p.label})), "_linkExistingPreuvePlan", [m.id])}
                <button class="btn-add fs-xs" style="margin-left:4px" data-click="_createAndLinkPreuvePlan" data-args='${_da(m.id)}'>${t("comp.mes.btn_nouvelle_preuve")}</button>
            </div>`;
        }
    }

    // Tableau
    if (mesures.length === 0) {
        h += '<div class="synth-card"><p class="text-muted">' + t("comp.plan.aucune") + '</p></div>';
    } else {
        h += `<table id="plan-table"><thead><tr>
            <th${hd("mid")} style="width:70px">${t("comp.mes.col_id")}</th>
            <th${hd("desc")}>${t("comp.mes.col_description")}</th>
            <th${hd("statut")} style="width:90px">${t("comp.mes.col_statut")}</th>
            <th${hd("resp")} style="width:100px">${t("comp.mes.col_responsable")}</th>
            <th${hd("ech")} style="width:90px">${t("comp.mes.col_echeance")}</th>
            <th${hd("rec")} style="width:90px">${t("comp.mes.col_recurrence")}</th>
            <th${hd("prv")} style="width:70px">${t("comp.mes.col_preuves")}</th>
            <th${hd("exig")} style="min-width:100px">${t("comp.mes.col_exigences")}</th>
            <th${hd("refs")} style="min-width:80px">${t("comp.mes.col_referentiels")}</th>
        </tr></thead><tbody>`;
        mesures.forEach(m => {
            const linkedExigs = _findExigencesForMesure(m.id);
            const linkedFws = _findFwsForMesure(m.id);
            h += `<tr style="cursor:pointer" data-click="_editMesurePlan" data-args='${_da(m.id)}'>
                <td${hd("mid")} class="fw-600">${esc(m.id)}</td>
                <td${hd("desc")}>${esc(m.description||"—")}</td>
                <td${hd("statut")}>${_mesureBadge(m)}</td>
                <td${hd("resp")}>${esc(m.responsable||"—")}</td>
                <td${hd("ech")}>${esc(m.date_cible||"—")}</td>
                <td${hd("rec")}>${m.recurrence?esc(_recLabel(m.recurrence)):"—"}</td>
                <td${hd("prv")} class="ta-c">${(m.preuves_ids||[]).length||"—"}</td>
                <td${hd("exig")} class="fs-xs">${linkedExigs.join(", ")||"—"}</td>
                <td${hd("refs")} class="fs-xs">${linkedFws.join(", ")||"—"}</td>
            </tr>`;
        });
        h += '</tbody></table>';
        h += colsButton("plan-table");
    }

    document.getElementById("plan-content").innerHTML = h;
    _setupTable("plan-table");
}

function _filterPlan(val) {
    _planFilter = val;
    renderPlan();
}

function _editMesurePlan(mesureId) {
    _editingMesure = mesureId;
    _mesureEditReturnTo = null;
    renderPlan();
}

function _closePlanEdit() {
    _editingMesure = null;
    renderPlan();
}

function _addMesurePlan() {
    _saveState();
    const id = _genMesureId();
    D.mesures.push({ id, description: "", details: "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] });
    _editingMesure = id;
    renderPlan();
    _autoSave();
}

function _deleteMesurePlan(mesureId) {
    if (!confirm(t("comp.confirm.delete_mesure", {id: mesureId}))) return;
    _saveState();
    D.mesures = D.mesures.filter(m => m.id !== mesureId);
    const cleanup = items => items.forEach(e => { if (e.mesures_ids) e.mesures_ids = e.mesures_ids.filter(id => id !== mesureId); });
    for (const fw of Object.values(D.referentiels || {})) {
        if (Array.isArray(fw)) cleanup(fw);
    }
    _editingMesure = null;
    renderPlan();
    _autoSave();
}

function _unlinkPreuvePlan(mesureId, preuveId) {
    _saveState();
    const m = _getMesure(mesureId);
    if (m) m.preuves_ids = (m.preuves_ids||[]).filter(id => id !== preuveId);
    renderPlan();
    _autoSave();
}

function _linkExistingPreuvePlan(mesureId, preuveId) {
    if (!preuveId) return;
    _saveState();
    const m = _getMesure(mesureId);
    if (m) {
        if (!m.preuves_ids) m.preuves_ids = [];
        if (!m.preuves_ids.includes(preuveId)) m.preuves_ids.push(preuveId);
    }
    renderPlan();
    _autoSave();
}

function _createAndLinkPreuvePlan(mesureId) {
    _saveState();
    const id = _genPreuveId();
    D.preuves.push({ id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" });
    const m = _getMesure(mesureId);
    if (m) {
        if (!m.preuves_ids) m.preuves_ids = [];
        m.preuves_ids.push(id);
    }
    _editingPreuve = id;
    _preuveEditReturnTo = "plan";
    _returnToMesureId = mesureId;
    selectPanel("plan");
    renderPlan();
    _autoSave();
}

function _goEditPreuveFromPlan(mesureId, preuveId) {
    _editingPreuve = preuveId;
    _returnToMesureId = mesureId;
    _preuveEditReturnTo = "plan";
    // Pour les preuves il faut aller sur un panel preuve — on utilise le premier fw actif
    const fwId = D.referentiels_actifs[0] || "anssi";
    selectPanel("fw:" + fwId + ":preuves");
}

// ── Contrôles global ──────────────────────────────────────────────
function renderControles() {
    const today = new Date();
    let rows = [];

    // Contrôles récurrents sur les mesures
    D.mesures.forEach(m => {
        if (!m.recurrence || m.recurrence === "ponctuel") return;
        const jours = _recJours[m.recurrence] || 365;
        const dernier = m.dernier_controle ? new Date(m.dernier_controle) : null;
        const prochain = dernier ? new Date(dernier.getTime() + jours * 86400000) : null;
        const enRetard = prochain ? prochain < today : !!m.dernier_controle;
        rows.push({ type: "controle", id: m.id, label: m.description, recurrence: m.recurrence, dernier: m.dernier_controle, prochain, enRetard });
    });

    // Preuves expirant
    D.preuves.forEach(p => {
        if (!p.date_expiration) return;
        const exp = new Date(p.date_expiration);
        const expired = exp < today;
        const soonDays = Math.ceil((exp - today) / 86400000);
        if (soonDays < 90) {
            rows.push({ type: "preuve", id: p.id, label: p.label, expiration: p.date_expiration, expired, soonDays });
        }
    });

    rows.sort((a,b) => (b.enRetard||b.expired||0) - (a.enRetard||a.expired||0));

    let h = "";
    if (rows.length === 0) {
        h = '<div class="synth-card"><p class="text-muted">' + t("comp.ctrl.aucun") + '</p></div>';
    } else {
        const retards = rows.filter(r => r.enRetard || r.expired).length;
        if (retards > 0) h += `<div class="synth-card mb-16" style="border-color:var(--red);background:#fef2f2"><p style="color:var(--red);font-weight:600">${t("comp.ctrl.alertes", {count: retards})}</p></div>`;
        h += '<table id="ctrl-table"><thead><tr><th' + hd("type") + '>' + t("comp.ctrl.col_type") + '</th><th' + hd("cid") + '>' + t("comp.ctrl.col_id") + '</th><th' + hd("cdesc") + '>' + t("comp.ctrl.col_description") + '</th><th' + hd("det") + '>' + t("comp.ctrl.col_details") + '</th><th' + hd("csts") + '>' + t("comp.ctrl.col_statut") + '</th></tr></thead><tbody>';
        rows.forEach(r => {
            h += `<tr style="${(r.enRetard||r.expired)?"background:#fef2f2":""}">`;
            h += `<td${hd("type")}>${r.type==="controle"?t("comp.ctrl.type_controle"):t("comp.ctrl.type_preuve")}</td><td${hd("cid")} class="fw-600">${esc(r.id)}</td><td${hd("cdesc")}>${esc(r.label)}</td>`;
            if (r.type === "controle") {
                h += `<td${hd("det")}>${_recLabel(r.recurrence)} — ${t("comp.ctrl.dernier")}: ${esc(r.dernier||t("comp.ctrl.jamais"))}</td>`;
                h += `<td${hd("csts")}>${r.enRetard?ctBadge(t("comp.ctrl.en_retard"),"red"):ctBadge(t("comp.ctrl.ok"),"green")}</td>`;
            } else {
                h += `<td${hd("det")}>${t("comp.ctrl.expire")}: ${esc(r.expiration)}</td>`;
                h += `<td${hd("csts")}>${r.expired?ctBadge(t("comp.prv.expiree"),"red"):ctBadge(t("comp.prv.bientot"),"orange")}</td>`;
            }
            h += '</tr>';
        });
        h += '</tbody></table>';
        h += colsButton("ctrl-table");
    }
    document.getElementById("controles-content").innerHTML = h;
    _setupTable("ctrl-table");
}

// ═══════════════════════════════════════════════════════════════════════
// HISTORIQUE / SNAPSHOTS
// ═══════════════════════════════════════════════════════════════════════
async function renderHistory() {
    const snaps = await _getSnapshots();
    let h = '<button class="btn-add" data-click="createSnapshot">' + t("comp.hist.btn_creer") + '</button>';
    if (_isSnapEncrypted()) {
        h += ' <button class="btn-add" style="background:var(--red);margin-left:8px" data-click="disableSnapEncryption">' + t("comp.hist.btn_dechiffrer") + '</button>';
    } else {
        h += ' <button class="btn-add" style="background:var(--light-blue);margin-left:8px" data-click="enableSnapEncryption">' + t("comp.hist.btn_chiffrer") + '</button>';
    }
    if (snaps.length === 0) {
        h += '<p class="text-muted mt-8">' + t("comp.hist.aucun") + '</p>';
    } else {
        h += '<table class="mt-8"><thead><tr><th>' + t("comp.hist.col_nom") + '</th><th>' + t("comp.hist.col_date") + '</th><th>' + t("comp.hist.col_org") + '</th><th>' + t("comp.hist.col_actions") + '</th></tr></thead><tbody>';
        snaps.forEach((s, i) => {
            const d = new Date(s.date);
            const dateStr = d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", {hour:"2-digit",minute:"2-digit"});
            h += `<tr><td><strong>${esc(s.name)}</strong></td><td>${dateStr}</td><td class="fs-sm">${esc(s.societe||"")}</td>`;
            h += `<td><button class="btn-add" style="margin:0 4px 0 0" data-click="restoreSnapshot" data-args='${_da(i)}'>${t("comp.hist.btn_restaurer")}</button>`;
            h += `<button class="btn-add" style="margin:0 4px 0 0;background:var(--light-blue)" data-click="exportSnapshot" data-args='${_da(i)}'>${t("comp.hist.btn_exporter")}</button>`;
            h += `<button class="btn-del" data-click="deleteSnapshot" data-args='${_da(i)}'>X</button></td></tr>`;
        });
        h += '</tbody></table>';
    }
    h += '<p class="mt-8 text-muted fs-sm">' + t("comp.hist.note") + '</p>';
    document.getElementById("history-content").innerHTML = h;
}

// ═══════════════════════════════════════════════════════════════════════
// IMPORT EBIOS RM
// ═══════════════════════════════════════════════════════════════════════
function importEbiosRM() {
    document.getElementById("ebios-input").click();
}

function _doImportEbiosRM(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const ebios = JSON.parse(new TextDecoder().decode(new Uint8Array(e.target.result)));
            if (!ebios.context && !ebios.meta) { alert(t("comp.import.invalid")); return; }
            _saveState();

            // 1. Importer le contexte
            if (ebios.context) {
                D.meta.societe = ebios.context.societe || D.meta.societe;
                D.meta.date_evaluation = ebios.context.date || D.meta.date_evaluation;
                D.meta.commentaires = ebios.context.commentaires || D.meta.commentaires;
            }

            // 2. Importer les mesures de l'atelier 5 comme entités globales
            const mesureIdMap = {};  // ancien ID EBIOS → nouvel ID compliance
            if (Array.isArray(ebios.measures)) {
                ebios.measures.forEach(em => {
                    // Éviter les doublons (même description nettoyée)
                    const cleanedDesc = _cleanDesc(em.description || "");
                    const existing = D.mesures.find(m => m.description === cleanedDesc);
                    if (existing) {
                        mesureIdMap[em.id] = existing.id;
                    } else {
                        const newId = _genMesureId();
                        mesureIdMap[em.id] = newId;
                        // Convertir le statut EBIOS RM → compliance
                        let statut = "planifie";
                        if (em.statut === "Terminé") statut = "termine";
                        else if (em.statut === "En cours") statut = "en_cours";
                        D.mesures.push({
                            id: newId,
                            description: _cleanDesc(em.description || em.mesure || ""),
                            details: em.effet || "",
                            statut: statut,
                            date_cible: em.echeance || "",
                            responsable: em.responsable || "",
                            recurrence: "",
                            dernier_controle: "",
                            preuves_ids: [],
                        });
                    }
                });
            }

            // Nettoyer un préfixe d'ID EBIOS RM d'une description
            // "MES-001 - Politique de sécurité" → "Politique de sécurité"
            function _cleanDesc(text) {
                return text.replace(/^MES-\d+\s*[-–—]\s*/, "").trim();
            }

            // Parser le champ mesures_prevues (texte) pour retrouver et lier les mesures
            function _linkMesuresFromText(entry, mesuresPrevuesText) {
                if (!mesuresPrevuesText) return;
                if (!entry.mesures_ids) entry.mesures_ids = [];
                // Format EBIOS RM : "MES-001 - Description, MES-002 - Description"
                const parts = mesuresPrevuesText.split(",").map(s => s.trim()).filter(Boolean);
                parts.forEach(part => {
                    const idMatch = part.match(/^(MES-\d+)/);
                    if (idMatch && mesureIdMap[idMatch[1]]) {
                        // Mesure connue de l'atelier 5 : lier par son nouvel ID
                        const newId = mesureIdMap[idMatch[1]];
                        if (!entry.mesures_ids.includes(newId)) entry.mesures_ids.push(newId);
                    } else {
                        // Pas d'ID reconnu : créer une mesure à partir du texte nettoyé
                        const desc = _cleanDesc(part);
                        if (!desc) return;
                        const existing = D.mesures.find(m => m.description === desc);
                        if (existing) {
                            if (!entry.mesures_ids.includes(existing.id)) entry.mesures_ids.push(existing.id);
                        } else {
                            const newId = _genMesureId();
                            D.mesures.push({
                                id: newId, description: desc,
                                statut: "planifie", date_cible: "", responsable: "",
                                recurrence: "", dernier_controle: "", preuves_ids: [],
                            });
                            entry.mesures_ids.push(newId);
                        }
                    }
                });
            }

            // 3. Importer socle ANSSI (EBIOS RM uses old format with socle_anssi)
            if (Array.isArray(ebios.socle_anssi) && ebios.socle_anssi.length > 0) {
                if (!D.referentiels_actifs.includes("anssi")) D.referentiels_actifs.push("anssi");
                const anssiEntries = D.referentiels.anssi || [];
                ebios.socle_anssi.forEach((src, i) => {
                    if (i < anssiEntries.length) {
                        const dst = anssiEntries[i];
                        if (src.conformite !== "" && src.conformite !== null && src.conformite !== undefined) dst.conformite = src.conformite;
                        if (src.ecart) dst.ecart = src.ecart;
                        if (src.mesures_prevues) dst.mesures_prevues = src.mesures_prevues;
                        _linkMesuresFromText(dst, src.mesures_prevues);
                    }
                });
            }

            // 4. Importer socle ISO (EBIOS RM uses old format with socle_iso)
            if (Array.isArray(ebios.socle_iso) && ebios.socle_iso.length > 0) {
                if (!D.referentiels_actifs.includes("iso")) D.referentiels_actifs.push("iso");
                const isoEntries = D.referentiels.iso || [];
                ebios.socle_iso.forEach((src, i) => {
                    if (i < isoEntries.length) {
                        const dst = isoEntries[i];
                        if (src.conformite !== "" && src.conformite !== null && src.conformite !== undefined) dst.conformite = src.conformite;
                        if (src.ecart) dst.ecart = src.ecart;
                        if (src.mesures_prevues) dst.mesures_prevues = src.mesures_prevues;
                        if (src.applicable !== undefined) dst.applicable = src.applicable;
                        _linkMesuresFromText(dst, src.mesures_prevues);
                    }
                });
            }

            // 5. Importer référentiels complémentaires (EBIOS RM uses old format with socle_complementaires)
            if (ebios.socle_complementaires && typeof ebios.socle_complementaires === "object") {
                for (const [fwId, fwData] of Object.entries(ebios.socle_complementaires)) {
                    if (!D.referentiels_actifs.includes(fwId)) D.referentiels_actifs.push(fwId);
                    // Find or create entries in D.referentiels[fwId]
                    if (!D.referentiels[fwId]) D.referentiels[fwId] = [];
                    for (const [ref, entry] of Object.entries(fwData)) {
                        let dst = D.referentiels[fwId].find(e => e.ref === ref);
                        if (!dst) {
                            dst = { ref, theme: "", mesure: "", applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: [] };
                            D.referentiels[fwId].push(dst);
                        }
                        if (entry.conformite !== "" && entry.conformite !== null && entry.conformite !== undefined) dst.conformite = entry.conformite;
                        if (entry.ecart) dst.ecart = entry.ecart;
                        if (entry.mesures_prevues) dst.mesures_prevues = entry.mesures_prevues;
                        _linkMesuresFromText(dst, entry.mesures_prevues);
                    }
                }
            }

            const nbMesures = D.mesures.length;
            _initDataAndRender(function() {
                _autoSave();
                showStatus(t("comp.import.success", {name: file.name, count: nbMesures}));
            });
        } catch(err) {
            alert(t("comp.import.error", {msg: err.message}));
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
}

// ═══════════════════════════════════════════════════════════════════════
// AIDE
// ═══════════════════════════════════════════════════════════════════════
// toggleHelp / switchHelpTab → moved to cisotoolbox.js

// ═══════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════
try {
    _checkAutoSaveBanner();
    if (typeof window._appInitCallback === "function") {
        window._appInitCallback();
    } else {
        _initDataAndRender();
    }
} catch(e) {
    console.error("Erreur au rendu initial:", e);
    document.querySelector(".container").innerHTML = '<section><h2>' + t("comp.error.title") + '</h2><pre>' + esc(e.message) + '\n' + esc(e.stack||"") + '</pre></section>';
}

// AI module config (read by ai_common.js)
window.AI_APP_CONFIG = { storagePrefix: "compliance" };