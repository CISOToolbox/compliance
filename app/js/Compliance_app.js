// ═══════════════════════════════════════════════════════════════════════
// CONFIG & DONNÉES
// ═══════════════════════════════════════════════════════════════════════
window.CT_CONFIG = {
    edition: "suite",
    module: "compliance",
    deployed: ["risk", "compliance", "audit", "vendor", "asset", "pilot", "appsec", "surface", "access", "watch"],
    autosaveKey: "compliance_autosave_v2",
    initDataVar: "COMPLIANCE_INIT_DATA",
    refNamespace: "COMPLIANCE_REF",
    descNamespace: "COMPLIANCE_DESCRIPTIONS",
    labelKey: "comp.label",
    filePrefix: "Conformite",
    getSociete: function (d) { return d && d.meta ? d.meta.societe : ""; },
    getDate: function (d) { return d && d.meta ? d.meta.date_evaluation : ""; },
    getScope: function (d) { return "Conformite"; }
};
// FEAT-36 — schema versioning (rev 1 = normalized baseline; bump + add a
// migration + archive a fixture whenever the exported data model changes).
window.SCHEMA_REV = 1;
let D = JSON.parse(JSON.stringify(window.COMPLIANCE_INIT_DATA || {}));
const _ASSET_BASE = "js/Compliance";
// _REFERENTIELS_CATALOG loaded from referentiels_catalog.js (shared)
const _REFERENTIELS_CATALOG = window._REFERENTIELS_CATALOG || { "anssi": { "label": "ANSSI Hygi\u00e8ne", "description": "Renforcer la s\u00e9curit\u00e9 de son syst\u00e8me d\u2019information en 42 mesures\n https://cyber.gouv.fr/sites/default/files/2017/01/guide_hygiene_informatique_anssi.pdf", "description_en": "Strengthen Information System Security in 42 Measures\nhttps://cyber.gouv.fr/sites/default/files/2013/01/guideline-for-a-healthy-information-system-in-42-measures_v2.pdf", "color": "#cf4520" }, "iso": { "label": "ISO 27001:2022", "description": "S\u00e9curit\u00e9 de l'information, cybers\u00e9curit\u00e9 et protection de la vie priv\u00e9e \u2014 Information syst\u00e8me de management de la s\u00e9curit\u00e9 \u2014 Exigences", "description_en": "Information security, cybersecurity and privacy protection \u2014 Information security management systems \u2014 Requirements", "color": "#2563eb" }, "soc2": { "label": "SOC 2", "description": "TSP Section 100\n2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy (with Revised Points of Focus \u2013 2022)\n\nTSC presents control criteria established by the AICPA\u2019s Assurance Services Executive Committee (ASEC) for use in attestation or consulting engagements to evaluate and report on controls over the security, availability, processing integrity, confidentiality, or privacy of information and systems used to provide products or services (a) across an entire entity; (b) at a subsidiary, division, or operating unit level; (c) within a function relevant to the entity\u2019s operational, reporting, or compliance objectives; and (d) for a particular type of information used by the entity. Link: https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022", "description_en": "TSP Section 100\n2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy (with Revised Points of Focus \u2013 2022)\n\nTSC presents control criteria established by the AICPA\u2019s Assurance Services Executive Committee (ASEC) for use in attestation or consulting engagements to evaluate and report on controls over the security, availability, processing integrity, confidentiality, or privacy of information and systems used to provide products or services (a) across an entire entity; (b) at a subsidiary, division, or operating unit level; (c) within a function relevant to the entity\u2019s operational, reporting, or compliance objectives; and (d) for a particular type of information used by the entity. Link: https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022", "color": "#0e7490" }, "secnumcloud": { "label": "SecNumCloud", "description": "Premier ministre\nAgence nationale de la s\u00e9curit\u00e9 des syst\u00e8mes d\u2019information\nPrestataires de services d\u2019informatique en nuage (SecNumCloud)\nr\u00e9f\u00e9rentiel d\u2019exigences\nVersion 3.2 du 8 mars 202", "description_en": "Premier ministre\nAgence nationale de la s\u00e9curit\u00e9 des syst\u00e8mes d\u2019information\nPrestataires de services d\u2019informatique en nuage (SecNumCloud)\nr\u00e9f\u00e9rentiel d\u2019exigences\nVersion 3.2 du 8 mars 202", "color": "#dc2626" }, "lpm": { "label": "LPM", "description": "R\u00c8GLES DE S\u00c9CURIT\u00c9 RELATIVES AU SECTEUR D'ACTIVIT\u00c9S D'IMPORTANCE VITALE \" ACTIVIT\u00c9S CIVILES DE L'\u00c9TAT \"\nArr\u00eat\u00e9 du 29 mai 2019 fixant les r\u00e8gles de s\u00e9curit\u00e9 et les modalit\u00e9s de d\u00e9claration des syst\u00e8mes d'information d'importance vitale et des incidents de s\u00e9curit\u00e9 relatives au secteur d'activit\u00e9s d'importance vitale \u00ab Activit\u00e9s civiles de l'Etat \u00bb et pris en application des articles R. 1332-41-1, R. 1332-41-2 et R. 1332-41-10 du code de la d\u00e9fense\nhttps://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038565011", "description_en": "R\u00c8GLES DE S\u00c9CURIT\u00c9 RELATIVES AU SECTEUR D'ACTIVIT\u00c9S D'IMPORTANCE VITALE \" ACTIVIT\u00c9S CIVILES DE L'\u00c9TAT \"\nArr\u00eat\u00e9 du 29 mai 2019 fixant les r\u00e8gles de s\u00e9curit\u00e9 et les modalit\u00e9s de d\u00e9claration des syst\u00e8mes d'information d'importance vitale et des incidents de s\u00e9curit\u00e9 relatives au secteur d'activit\u00e9s d'importance vitale \u00ab Activit\u00e9s civiles de l'Etat \u00bb et pris en application des articles R. 1332-41-1, R. 1332-41-2 et R. 1332-41-10 du code de la d\u00e9fense\nhttps://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038565011", "color": "#1e3a5f" }, "loi0520": { "label": "Loi 05-20 (Maroc)", "description": "Loi n\u00b0 05-20 fixant le cadre l\u00e9gislatif de la cybers\u00e9curit\u00e9 au Maroc", "description_en": "Loi n\u00b0 05-20 fixant le cadre l\u00e9gislatif de la cybers\u00e9curit\u00e9 au Maroc", "color": "#b45309" }, "hds": { "label": "HDS", "description": "R\u00e9f\u00e9rentiel de certification H\u00e9bergeur de donn\u00e9es de sant\u00e9 (HDS) - Exigences\nVersion publi\u00e9e par l\u2019arr\u00eat\u00e9 du 26 avril 2024 portant approbation du r\u00e9f\u00e9rentiel d'accr\u00e9ditation des organismes de certification et du r\u00e9f\u00e9rentiel de certification pour l'h\u00e9bergement de donn\u00e9es de sant\u00e9 \u00e0 caract\u00e8re personnel.", "description_en": "R\u00e9f\u00e9rentiel de certification H\u00e9bergeur de donn\u00e9es de sant\u00e9 (HDS) - Exigences\nVersion publi\u00e9e par l\u2019arr\u00eat\u00e9 du 26 avril 2024 portant approbation du r\u00e9f\u00e9rentiel d'accr\u00e9ditation des organismes de certification et du r\u00e9f\u00e9rentiel de certification pour l'h\u00e9bergement de donn\u00e9es de sant\u00e9 \u00e0 caract\u00e8re personnel.", "color": "#7c3aed" }, "nis2": { "label": "NIS 2", "description": "Article 21 de la directive (UE) 2022/2555 du Parlement europ\u00e9en et du Conseil du 14 d\u00e9cembre 2022 concernant des mesures destin\u00e9es \u00e0 assurer un niveau \u00e9lev\u00e9 commun de cybers\u00e9curit\u00e9 dans l\u2019ensemble de l\u2019Union, modifiant le r\u00e8glement (UE) no 910/2014 et la directive (UE) 2018/1972, et abrogeant la directive (UE) 2016/1148 (directive SRI 2) (Texte pr\u00e9sentant de l\u2019int\u00e9r\u00eat pour l\u2019EEE)", "description_en": "Requirements from article 21 of directive 2022/2555 of the european parliament and of the council of 14 December 2022 on measures for a high common level of cybersecurity across the Union.", "color": "#7c3aed" }, "recyf": { "label": "ReCyF (NIS2)", "description": "RECYF constitue le r\u00e9f\u00e9rentiel de cybers\u00e9curit\u00e9 mentionn\u00e9 au 6\u00e8me alin\u00e9a de l\u2019article 14 du projet de loi relatif \u00e0 la r\u00e9silience des infrastructures critiques et au renforcement de la cybers\u00e9curit\u00e9 (PJL). Il se compose d\u2019objectifs de s\u00e9curit\u00e9 et, pour chacun d\u2019eux, de moyens acceptables de conformit\u00e9.", "description_en": "RECYF constitue le r\u00e9f\u00e9rentiel de cybers\u00e9curit\u00e9 mentionn\u00e9 au 6\u00e8me alin\u00e9a de l\u2019article 14 du projet de loi relatif \u00e0 la r\u00e9silience des infrastructures critiques et au renforcement de la cybers\u00e9curit\u00e9 (PJL). Il se compose d\u2019objectifs de s\u00e9curit\u00e9 et, pour chacun d\u2019eux, de moyens acceptables de conformit\u00e9.", "color": "#047857" }, "cra": { "label": "Cyber Resilience Act", "description": "Annexes to the REGULATION (EU) 2024/2847 OF THE EUROPEAN PARLIAMENT AND OF THE COUNCIL of 23 October 2024 on horizontal cybersecurity requirements for products with digital elements and amending Regulations (EU) No 168/2013 and (EU) No 2019/1020 and Directive (EU) 2020/1828 (Cyber Resilience Act)", "description_en": "Annexes to the REGULATION (EU) 2024/2847 OF THE EUROPEAN PARLIAMENT AND OF THE COUNCIL of 23 October 2024 on horizontal cybersecurity requirements for products with digital elements and amending Regulations (EU) No 168/2013 and (EU) No 2019/1020 and Directive (EU) 2020/1828 (Cyber Resilience Act)", "color": "#c2410c" }, "dora": { "label": "DORA", "description": "Digital Operational Resilience Act (UE 2022/2554) \u2014 r\u00e9silience num\u00e9rique du secteur financier (39 exigences par article)", "description_en": "Digital Operational Resilience Act (EU 2022/2554) \u2014 digital resilience for the financial sector (39 article-level requirements)", "color": "#3a7ca5" }, "dora_detailed": { "label": "DORA (d\u00e9taill\u00e9)", "description": "Digital Operational Resilience Act (UE 2022/2554) \u2014 211 exigences au niveau paragraphe", "description_en": "Digital Operational Resilience Act (EU 2022/2554) \u2014 211 paragraph-level requirements", "color": "#3a7ca5" } };
let REFERENTIELS_META = Object.fromEntries(Object.entries(_REFERENTIELS_CATALOG).map(([k, v]) => [k, { ...v }]));
let _currentPanel = "dashboard";
let _currentFw = null;
let _currentSubview = null;
let _mesuresTypesLoaded = false;
// _getAnssDesc/_getIsoDesc defined in cisotoolbox.js (uses CT_CONFIG.descNamespace + locale)
function _ensureMesuresTypes(cb) {
    if (_mesuresTypesLoaded) {
        cb();
        return;
    }
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
// ── Catalogue de contrôles de référence (maison) ────────────────────────
let _referenceControlsLoaded = false;
function _ensureReferenceControls(cb) {
    if (_referenceControlsLoaded) {
        cb();
        return;
    }
    _loadAsset(_ASSET_BASE + "_reference_controls.js", () => { _referenceControlsLoaded = true; cb(); });
}
// Mesures de référence applicables à une exigence : refs explicites par
// référentiel (framework_refs[fwId]). Fonctionne pour tous les référentiels
// pour lesquels la mesure déclare des refs.
function _getReferenceControlsFor(fwId, exigRef) {
    const rcs = window.COMPLIANCE_REFERENCE_CONTROLS || [];
    if (!exigRef)
        return [];
    // Match exact, ou un ref catalogue plus fin que l'exigence (granularité :
    // une exigence « critère » CC1.1 propose les mesures des points de focus
    // CC1.1.x), ou l'inverse (exigence fine, ref catalogue plus large).
    const childPrefix = exigRef + ".";
    return rcs.filter(rc => {
        const refs = (rc.framework_refs && rc.framework_refs[fwId]) || [];
        return refs.some(r => r === exigRef || r.indexOf(childPrefix) === 0 || exigRef.indexOf(r + ".") === 0);
    });
}
// Convertit un contrôle de référence en « mesure type » consommable par la
// modale de proposition existante (mutualisation via exigences.iso).
function _refControlToMesureType(rc) {
    const evFr = rc.typical_evidence || [];
    const evEn = rc.typical_evidence_en || evFr;
    const detFr = rc.description + (evFr.length ? "\n\n" + t("comp.refctrl.evidence") + "\n" + evFr.map(e => "• " + e).join("\n") : "");
    const detEn = (rc.description_en || rc.description) + (evEn.length ? "\n\nTypical evidence:\n" + evEn.map(e => "• " + e).join("\n") : "");
    const catLabel = t("comp.refctrl.cat." + rc.category);
    return {
        id: rc.id, ref_id: rc.id, csf_function: rc.csf_function,
        categorie: catLabel, categorie_en: catLabel,
        description: rc.name, description_en: rc.name_en || rc.name,
        details: detFr, details_en: detEn,
        typical_evidence: rc.typical_evidence, typical_evidence_en: rc.typical_evidence_en,
        exigences: rc.framework_refs || {}
    };
}
// Filtre les mesures déjà liées puis ouvre la modale (ou message si rien à proposer).
function _openPropositions(fwId, idx, exigRef, entry, types) {
    const linkedIds = new Set(entry.mesures_ids || []);
    const linkedDescs = new Set(D.mesures.filter(m => linkedIds.has(m.id)).map(m => m.description));
    const available = types.filter(mt => !linkedDescs.has(mt.description) && !linkedDescs.has(_rt(mt, "description")));
    if (available.length === 0) {
        showStatus(t("comp.alert.all_linked", { count: types.length, ref: exigRef }), "info");
        return;
    }
    _showPropositionsModal(fwId, idx, exigRef, entry, available);
}
// Proposer des mesures pour une exigence.
// Priorité au catalogue de contrôles de référence (maison) ; repli sur l'ancien
// catalogue COMPLIANCE_MESURES_TYPES pour ce qu'il ne couvre pas encore.
function _proposerMesures(fwId, idx) {
    _ensureReferenceControls(() => {
        const entry = _getExigEntry(fwId, idx);
        const exigRef = entry.ref || "";
        const rcs = _getReferenceControlsFor(fwId, exigRef);
        if (rcs.length > 0) {
            _openPropositions(fwId, idx, exigRef, entry, rcs.map(_refControlToMesureType));
            return;
        }
        _ensureMesuresTypes(() => {
            const types = _getMesuresTypesFor(fwId, exigRef);
            if (types.length === 0) {
                showStatus(t("comp.alert.no_mesure_type", { ref: exigRef }), "warn");
                return;
            }
            _openPropositions(fwId, idx, exigRef, entry, types);
        });
    });
}
function _showPropositionsModal(fwId, idx, exigRef, entry, available) {
    var existing = document.getElementById("propositions-modal");
    if (existing)
        existing.remove();
    var overlay = document.createElement("div");
    overlay.id = "propositions-modal";
    overlay.style.cssText = "position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;padding:24px";
    var h = '<div style="background:var(--ct-surface);border-radius:var(--ct-r-xl);padding:var(--ct-s6);max-width:700px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)">';
    h += '<h3>' + esc(t("comp.propose.title", { ref: exigRef })) + '</h3>';
    h += '<p class="text-muted fs-sm">' + esc(t("comp.propose.subtitle", { count: available.length })) + '</p>';
    available.forEach(function (mt, i) {
        var idBadge = mt.ref_id ? '<span class="ct-badge ct-ml-1" data-tone="neutral" data-size="sm">' + esc(mt.ref_id) + '</span>' : '';
        var catBadge = mt.categorie ? '<span class="ct-badge ct-ml-1" data-tone="neutral" data-size="sm">' + esc(mt.categorie) + '</span>' : '';
        var csfBadge = mt.csf_function ? '<span class="ct-badge ct-ml-1" data-tone="info" data-size="sm">' + esc(t("comp.refctrl.csf." + mt.csf_function)) + '</span>' : '';
        h += '<div class="proposition-card">';
        h += '<div class="ct-flex ct-row-between ct-items-start">';
        h += '<div class="ct-flex-1">';
        h += '<div class="ct-strong ct-text-data">' + esc(_rt(mt, "description")) + idBadge + catBadge + csfBadge + '</div>';
        if (mt.details) {
            var _body = _rt(mt, "details");
            var _full = !!mt.ref_id;
            var _shown = _full ? _body : (_body.substring(0, 200) + (_body.length > 200 ? "…" : ""));
            h += '<div class="text-muted fs-xs ct-mt-1"' + (_full ? ' style="white-space:pre-line"' : '') + '>' + esc(_shown) + '</div>';
        }
        h += '</div>';
        h += '<div style="display:flex;gap:var(--ct-s1);margin-left:var(--ct-s3);flex-shrink:0">';
        h += '<button class="ct-btn" data-variant="primary" data-size="sm" data-click="_acceptProposition" data-args=\'' + _da(i) + '\'>✓</button>';
        h += '<button class="ct-btn ct-py-1 ct-px-3 ct-kpi-tone ct-text-onsolid ct-no-border ct-r-sm ct-clickable ct-text-meta" data-variant="danger" data-size="sm" data-click="_rejectProposition" data-args=\'' + _da(i) + '\'>✗</button>';
        h += '</div></div></div>';
    });
    h += '<div style="display:flex;gap:var(--ct-s2);justify-content:flex-end;margin-top:var(--ct-s4);padding-top:12px;border-top:1px solid var(--ct-line)">';
    h += '<button class="ct-btn" data-variant="primary" data-click="_acceptAllPropositions">' + esc(t("comp.propose.accept_all")) + '</button>';
    h += '<button class="ct-btn" data-click="_closePropositionsModal">' + esc(t("comp.propose.close")) + '</button>';
    h += '</div></div>';
    overlay.innerHTML = h;
    document.body.appendChild(overlay);
    window._propositionsCtx = { fwId: fwId, idx: idx, exigRef: exigRef, entry: entry, available: available, accepted: 0 };
}
window._acceptProposition = function (i) {
    var ctx = window._propositionsCtx;
    if (!ctx)
        return;
    var mt = ctx.available[i];
    if (!mt)
        return;
    _applyProposition(ctx, mt);
    var card = document.querySelectorAll("#propositions-modal .proposition-card")[i];
    if (card) {
        card.style.opacity = "0.4";
        card.style.pointerEvents = "none";
        card.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
        card.insertAdjacentHTML("beforeend", '<span class="ct-text-low ct-strong ct-text-label ct-ml-2">✓ ' + esc(t("comp.propose.accepted")) + '</span>');
    }
    ctx.accepted++;
};
window._rejectProposition = function (i) {
    var card = document.querySelectorAll("#propositions-modal .proposition-card")[i];
    if (card) {
        card.style.opacity = "0.3";
        card.style.pointerEvents = "none";
        card.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
        card.insertAdjacentHTML("beforeend", '<span class="ct-ink-2 ct-text-label ct-ml-2">✗ ' + esc(t("comp.propose.rejected")) + '</span>');
    }
};
window._acceptAllPropositions = function () {
    const ctx = window._propositionsCtx;
    if (!ctx)
        return;
    _saveState();
    var cards = document.querySelectorAll("#propositions-modal .proposition-card");
    ctx.available.forEach(function (mt, i) {
        if (cards[i] && cards[i].style.opacity !== "0.4" && cards[i].style.opacity !== "0.3") {
            _applyProposition(ctx, mt);
            ctx.accepted++;
            if (cards[i]) {
                cards[i].style.opacity = "0.4";
                cards[i].style.pointerEvents = "none";
            }
        }
    });
    window._closePropositionsModal();
};
window._closePropositionsModal = function () {
    var ctx = window._propositionsCtx;
    var el = document.getElementById("propositions-modal");
    if (el)
        el.remove();
    if (ctx && ctx.accepted > 0) {
        _renderFwView(ctx.fwId, "exigences");
        _autoSave();
        showStatus(t("comp.status.mesures_created", { count: ctx.accepted }));
    }
    window._propositionsCtx = null;
};
function _applyProposition(ctx, mt) {
    var entry = ctx.entry;
    var existing = D.mesures.find(function (m) { return m.description === mt.description; });
    if (existing) {
        if (!entry.mesures_ids)
            entry.mesures_ids = [];
        if (!entry.mesures_ids.includes(existing.id))
            entry.mesures_ids.push(existing.id);
        _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
    }
    else {
        var id = _genMesureId();
        var newM = { id: id, description: mt.description, details: mt.details || "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] };
        D.mesures.push(newM);
        _persistCreate("measure", newM);
        if (!entry.mesures_ids)
            entry.mesures_ids = [];
        entry.mesures_ids.push(id);
        _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
        for (var otherFwId in mt.exigences) {
            if (!D.referentiels_actifs || !D.referentiels_actifs.includes(otherFwId))
                continue;
            var otherRefs = mt.exigences[otherFwId];
            for (var ri = 0; ri < otherRefs.length; ri++) {
                if (otherFwId === ctx.fwId && otherRefs[ri] === ctx.exigRef)
                    continue;
                var otherExigs = _getExigences(otherFwId);
                var otherIdx = otherExigs.findIndex(function (e) { return _getExigRef(otherFwId, e) === otherRefs[ri]; });
                if (otherIdx >= 0) {
                    var otherEntry = _getExigEntry(otherFwId, otherIdx);
                    if (!otherEntry.mesures_ids)
                        otherEntry.mesures_ids = [];
                    if (!otherEntry.mesures_ids.includes(id)) {
                        otherEntry.mesures_ids.push(id);
                        _persist("control", otherEntry.id, { mesures_ids: otherEntry.mesures_ids });
                    }
                }
            }
        }
    }
}
// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
let _nextMesureId = 1;
let _nextPreuveId = 1;
function _genMesureId() {
    // FEAT-32 — new measures use the unified MES-NNN id; the counter must
    // clear BOTH legacy M-NNN ids and new MES-NNN ones.
    while (D.mesures.some(m => m.id === "M-" + String(_nextMesureId).padStart(3, "0")
        || m.id === "MES-" + String(_nextMesureId).padStart(3, "0")))
        _nextMesureId++;
    return "MES-" + String(_nextMesureId++).padStart(3, "0");
}
function _genPreuveId() {
    while (D.preuves.some(p => p.id === "P-" + String(_nextPreuveId).padStart(3, "0")))
        _nextPreuveId++;
    return "P-" + String(_nextPreuveId++).padStart(3, "0");
}
function _getMesure(id) { return D.mesures.find(m => m.id === id); }
function _getPreuve(id) { return D.preuves.find(p => p.id === id); }
function _findMesuresForPreuve(preuveId) { return D.mesures.filter(m => (m.preuves_ids || []).includes(preuveId)).map(m => m.id); }
// ── Search Select : dropdown filtrable ────────────────────────────────
let _ssCounter = 0;
// Génère un dropdown filtrable. options = liste de {value, label}, callbackFn = nom de la fonction globale
function _searchSelect(placeholder, options, callbackFn, callbackArgs) {
    const uid = "ss-" + (_ssCounter++);
    let h = `<div class="ss-wrap" id="${uid}">`;
    h += `<input class="ss-input" placeholder="${esc(placeholder)}" data-input="_ssFilterAndOpen" data-args='${_da(uid)}' data-pass-value />`;
    h += `<div class="ss-drop" id="${uid}-drop">`;
    options.forEach(opt => {
        h += `<div class="ss-opt" data-value="${esc(opt.value)}" data-click="_ssSelect" data-args='${_da(uid, opt.value, callbackFn, JSON.stringify(callbackArgs || []))}'>${esc(opt.label)}</div>`;
    });
    h += `</div></div>`;
    return h;
}
function _ssFilterAndOpen(uid, val) {
    _ssOpen(uid);
    if (val !== undefined)
        _ssFilter(uid, val);
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
    if (!drop)
        return;
    const filter = val.toLowerCase();
    let any = false;
    drop.querySelectorAll(".ss-opt").forEach(o => {
        const match = !filter || o.textContent.toLowerCase().includes(filter);
        o.style.display = match ? "" : "none";
        if (match)
            any = true;
    });
    if (!drop.classList.contains("open"))
        drop.classList.add("open");
}
function _ssSelect(uid, value, callbackFn, argsJson) {
    const drop = document.getElementById(uid + "-drop");
    if (drop)
        drop.classList.remove("open");
    const wrap = document.getElementById(uid);
    if (wrap) {
        const inp = wrap.querySelector(".ss-input");
        if (inp)
            inp.value = "";
    }
    const args = JSON.parse(argsJson || "[]");
    args.push(value);
    const fn = window[callbackFn];
    if (typeof fn === "function")
        fn.apply(null, args);
}
// Open search-select dropdown on focus (click into the input)
document.addEventListener("focusin", function (e) {
    var tgt = e.target;
    if (tgt.classList.contains("ss-input")) {
        var wrap = tgt.closest(".ss-wrap");
        if (wrap)
            _ssOpen(wrap.id);
    }
});
// Fermer les dropdowns search-select au clic extérieur
document.addEventListener("click", function (e) {
    if (!e.target.closest(".ss-wrap")) {
        document.querySelectorAll(".ss-drop.open").forEach(d => d.classList.remove("open"));
    }
});
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
function _normStatut(key) {
    var k = String(key || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    var map = { "planifie": "planifie", "en cours": "en_cours", "en_cours": "en_cours",
        "termine": "termine", "terminee": "termine", "terminees": "termine",
        "preuve manquante": "preuve_manquante", "preuve_manquante": "preuve_manquante" };
    return map[k] || key;
}
function _statutLabel(key) { return t("comp.statut." + _normStatut(key)) || key; }
const _statutColors = { planifie: "orange", en_cours: "blue", termine: "green", preuve_manquante: "red" };
// ── Calcul automatique des statuts ───────────────────────────────────
// Statut effectif d'une mesure (tient compte de l'expiration des preuves)
function _mesureEffectiveStatut(m) {
    if (m.statut !== "termine")
        return m.statut || "planifie";
    // Terminée : vérifier qu'il y a au moins une preuve valide (non expirée)
    const preuves = (m.preuves_ids || []).map(id => _getPreuve(id)).filter(Boolean);
    if (preuves.length === 0)
        return "preuve_manquante";
    const today = new Date();
    const hasValid = preuves.some(p => !p.date_expiration || new Date(p.date_expiration) >= today);
    return hasValid ? "termine" : "preuve_manquante";
}
// Statut d'une exigence : OK si ≥1 mesure ET toutes terminées (avec preuves valides)
function _exigenceStatut(entry) {
    if (entry.applicable === false || entry.applicable === "non")
        return "na";
    const ids = entry.mesures_ids || [];
    if (ids.length === 0)
        return "ko";
    const mesures = ids.map(id => _getMesure(id)).filter(Boolean);
    if (mesures.length === 0)
        return "ko";
    const allOk = mesures.every(m => _mesureEffectiveStatut(m) === "termine");
    return allOk ? "ok" : "ko";
}
function _exigStatutLabel(key) { return t("comp.exig_statut." + key) || key; }
const _exigStatutColors = { ok: "green", ko: "red", na: "gray" };
// ── Badges ──────────────────────────────────────────────────────────────
// _tBadge() (partagé) inline les pastels hérités de CT_COLORS, qui ne
// correspondaient au design system qu'une fois re-thémés en dark — le light
// gardait donc des couleurs qu'aucun autre module n'utilise. Même wrapper que
// Risk : émettre directement la paire -tint/-ink, dans les deux thèmes, et
// conserver data-tone pour que le CSS puisse encore cibler une famille.
const _CT_TONES = {
    red: "critical", redDark: "critical", redMax: "critical", orange: "high",
    yellow: "medium", green: "low", blue: "info", gray: "neutral",
};
function _tBadge(text, colorName) {
    if (!text)
        return "";
    // Le ton suffit : .ct-badge[data-tone] porte deja la paire -tint / -ink.
    return '<span class="ct-badge" data-tone="' + (_CT_TONES[colorName] || "neutral") + '">' + esc(text) + '</span>';
}
function _mesureBadge(m) {
    const s = _mesureEffectiveStatut(m);
    // Normaliser avant lookup : les mesures importées/synchronisées peuvent
    // porter un statut brut ("En cours") — sans normalisation le badge
    // retombait sur "gray" et deux styles coexistaient pour le même statut.
    return s ? _tBadge(_statutLabel(s), _statutColors[_normStatut(s)] || "gray") : "u2014";
}
function _recLabel(key) { return t("comp.rec." + key) || key; }
const _recJours = { ponctuel: 0, mensuelle: 30, trimestrielle: 90, semestrielle: 180, annuelle: 365 };
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
                all[fwId] = { label: cf.label, description: (cf.measures || []).length + " controles (custom)", color: cf.color, custom: true };
                REFERENTIELS_META[fwId] = all[fwId];
                REFERENTIELS_META[fwId].measures = cf.measures;
                if (!window.COMPLIANCE_REF)
                    window.COMPLIANCE_REF = {};
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
    if (_draftMesure)
        _discardDraft();
    _currentPanel = panelId;
    // Fermer la sidebar mobile
    document.querySelector(".ct-rail, .sidebar")?.classList.remove("open");
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
            // BUG-16: hydrate an active API framework's working-set now that
            // _ensureFramework has fetched its measures into REFERENTIELS_META,
            // so its exigences render without needing a re-toggle.
            _hydrateFwFromMeta(fwId);
            if (fwId === "anssi" || fwId === "iso")
                _ensureDescriptions(show);
            else
                show();
        };
        if (fwId !== "anssi" && fwId !== "iso")
            _ensureFramework(fwId, afterLoad);
        else
            afterLoad();
    }
    else {
        _currentFw = null;
        _currentSubview = null;
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        const panel = document.getElementById("panel-" + panelId);
        if (panel)
            panel.classList.add("active");
        if (panelId === "dashboard")
            renderDashboard();
        else if (panelId === "context")
            renderContext();
        else if (panelId === "plan")
            renderPlan();
        else if (panelId === "controles")
            renderControles();
    }
    renderSidebar();
    _updateSidebarAccordion(panelId);
}
// ═══════════════════════════════════════════════════════════════════════
// ENSURE KEYS
// ═══════════════════════════════════════════════════════════════════════
function ensureKeys() {
    if (!D.meta)
        D.meta = { tool: "compliance", version: "2.0", societe: "", date_evaluation: "", evaluateur: "", perimetre: "", commentaires: "" };
    if (!Array.isArray(D.referentiels_actifs))
        D.referentiels_actifs = [];
    if (typeof D.referentiels !== "object" || Array.isArray(D.referentiels))
        D.referentiels = {};
    if (!Array.isArray(D.mesures))
        D.mesures = [];
    if (!Array.isArray(D.preuves))
        D.preuves = [];
    // ── Migration ancien format (socle_anssi / socle_iso / socle_complementaires) ──
    if (Array.isArray(D.socle_anssi) && D.socle_anssi.length > 0 && !D.referentiels.anssi) {
        D.referentiels.anssi = D.socle_anssi.map(e => {
            const entry = Object.assign({}, e);
            if (entry.num !== undefined) {
                entry.ref = entry.num;
                delete entry.num;
            }
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
            if (D.referentiels[fwId])
                continue; // already migrated
            const meta = REFERENTIELS_META[fwId];
            if (meta && meta.measures) {
                D.referentiels[fwId] = meta.measures.map(m => ({
                    ref: m.ref,
                    theme: m.theme || "", theme_en: m.theme_en || "",
                    mesure: m.mesure || "", mesure_en: m.mesure_en || "",
                    description: m.description || "", description_en: m.description_en || "",
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
        if (!D.referentiels.anssi)
            D.referentiels.anssi = [];
        const existingRefs = new Set(D.referentiels.anssi.map(e => e.ref));
        initRefs.anssi.forEach(ref => {
            if (!existingRefs.has(ref.ref))
                D.referentiels.anssi.push(JSON.parse(JSON.stringify(ref)));
        });
    }
    // ISO: merge base entries
    if (initRefs.iso) {
        if (!D.referentiels.iso)
            D.referentiels.iso = [];
        const existingRefs = new Set(D.referentiels.iso.map(e => e.ref));
        initRefs.iso.forEach(ref => {
            if (!existingRefs.has(ref.ref))
                D.referentiels.iso.push(JSON.parse(JSON.stringify(ref)));
        });
    }
    // Ensure mesures_ids on all referentiel entries
    for (const fwId of Object.keys(D.referentiels)) {
        if (Array.isArray(D.referentiels[fwId])) {
            D.referentiels[fwId].forEach(e => { if (!Array.isArray(e.mesures_ids))
                e.mesures_ids = []; });
        }
    }
    // Initialize or enrich complementary frameworks from REFERENTIELS_META
    for (const fwId of D.referentiels_actifs) {
        if (fwId === "anssi" || fwId === "iso")
            continue;
        const meta = REFERENTIELS_META[fwId];
        if (!meta || !meta.measures)
            continue;
        if (!D.referentiels[fwId]) {
            D.referentiels[fwId] = meta.measures.map(m => ({
                ref: m.ref,
                theme: m.theme || "", theme_en: m.theme_en || "",
                mesure: m.mesure || "", mesure_en: m.mesure_en || "",
                description: m.description || "", description_en: m.description_en || "",
                applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: []
            }));
        }
        else {
            const existing = D.referentiels[fwId];
            const existingByRef = Object.fromEntries(existing.map(e => [e.ref, e]));
            const enriched = meta.measures.map(m => {
                const e = existingByRef[m.ref];
                if (e) {
                    if (!e.theme)
                        e.theme = m.theme || "";
                    if (!e.theme_en && m.theme_en)
                        e.theme_en = m.theme_en;
                    if (!e.mesure)
                        e.mesure = m.mesure || "";
                    if (!e.mesure_en && m.mesure_en)
                        e.mesure_en = m.mesure_en;
                    if (!e.description && m.description)
                        e.description = m.description;
                    if (!e.description_en && m.description_en)
                        e.description_en = m.description_en;
                    return e;
                }
                return {
                    ref: m.ref,
                    theme: m.theme || "", theme_en: m.theme_en || "",
                    mesure: m.mesure || "", mesure_en: m.mesure_en || "",
                    description: m.description || "", description_en: m.description_en || "",
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
        const n = parseInt((m.id || "").replace("M-", ""));
        if (n >= _nextMesureId)
            _nextMesureId = n + 1;
    });
    D.preuves.forEach(p => {
        const n = parseInt((p.id || "").replace("P-", ""));
        if (n >= _nextPreuveId)
            _nextPreuveId = n + 1;
    });
    const sub = document.getElementById("header-subtitle");
    if (sub)
        sub.textContent = D.meta.societe || "";
}
// ═══════════════════════════════════════════════════════════════════════
// RENDU
// ═══════════════════════════════════════════════════════════════════════
function renderAll() {
    renderSidebar();
    if (_currentPanel === "dashboard")
        renderDashboard();
    else if (_currentPanel === "context")
        renderContext();
    else if (_currentPanel === "plan")
        renderPlan();
    else if (_currentPanel === "controles")
        renderControles();
    else if (_currentPanel.startsWith("fw:") && _currentFw)
        _renderFwView(_currentFw, _currentSubview);
    // Mettre à jour les boutons undo/redo
    _updateUndoButtons();
    // Toolbar right — settings button (auth buttons preserved by _initAuth)
    var tr = document.getElementById("toolbar-right");
    if (tr && !tr.querySelector(".toolbar-settings")) {
        var _sh = _getSettingsButtonHTML();
        if (_sh)
            tr.insertAdjacentHTML("afterbegin", '<span class="toolbar-settings">' + _sh + '</span>');
    }
    _applyStaticTranslations();
}
function renderSidebar() {
    if (D.referentiels_actifs.length === 0) {
        document.getElementById("sidebar-frameworks").innerHTML = "";
        return;
    }
    let h = '<div class="ct-rail-section"><div class="ct-rail-group">' + esc(t("comp.sidebar.frameworks")) + '</div>';
    const views = ["dashboard", "exigences", "mesures", "preuves"];
    const viewLabels = [t("comp.subview.dashboard"), t("comp.subview.exigences"), t("comp.subview.mesures"), t("comp.subview.preuves")];
    for (const fwId of D.referentiels_actifs) {
        const meta = _getAllFrameworks()[fwId];
        if (!meta)
            continue;
        const label = fwId === "anssi" ? "ANSSI" : fwId === "iso" ? "ISO 27001" : meta.label;
        const isActive = _currentFw === fwId;
        // Item du référentiel — cliquer dessus ouvre/ferme les sous-menus et va au dashboard
        h += `<button class="ct-rail-item"${isActive ? ' aria-current="page"' : ""} data-click="selectPanel" data-args='${_da("fw:" + fwId + ":dashboard")}'><span class="ct-rail-item-label">${esc(label)}</span></button>`;
        // Sous-menus : affichés uniquement si c'est le référentiel sélectionné
        if (isActive) {
            for (let vi = 0; vi < views.length; vi++) {
                const pid = "fw:" + fwId + ":" + views[vi];
                const active = _currentSubview === views[vi];
                h += `<button class="ct-rail-item ct-rail-subitem"${active ? ' aria-current="page"' : ""} data-click="selectPanel" data-args='${_da(pid)}'><span class="ct-rail-item-label">${esc(viewLabels[vi])}</span></button>`;
            }
        }
    }
    h += '</div>';
    document.getElementById("sidebar-frameworks").innerHTML = h;
}
// ── Contexte ──────────────────────────────────────────────────────
function renderContext() {
    const m = D.meta;
    let h = "<div class='meta'>";
    for (const [key, tKey] of [["societe", "comp.context.organisation"], ["date_evaluation", "comp.context.date"], ["evaluateur", "comp.context.evaluateur"], ["perimetre", "comp.context.perimetre"]]) {
        const label = t(tKey);
        h += `<div class="meta-item mb-12"><div class="label">${label}</div><div class="value">
            <input type="text" value="${esc(m[key])}" class="w-full" data-change="_setMeta" data-args='${_da(key)}' data-pass-value />
        </div></div>`;
    }
    h += `<div class="meta-item mb-12" style="min-width:100%"><div class="label">${t("comp.context.commentaires")}</div><div class="value">
        <textarea rows="3" class="w-full" data-change="_setMeta" data-args='["commentaires"]' data-pass-value data-input="_autoHeight" data-pass-el>${esc(m.commentaires || "")}</textarea>
    </div></div></div>`;
    h += `<h3 class="section-heading">${t("comp.context.frameworks_heading")}</h3>`;
    h += `<div class="meta-item mb-12"><div class="value ct-py-1 ct-px-0 ct-flex ct-row-wrap ct-gap-1">`;
    for (const [fwId, meta] of Object.entries(_getAllFrameworks())) {
        const active = D.referentiels_actifs.includes(fwId);
        const chipStyle = `border-color:${meta.color};color:${active ? "white" : meta.color};background:${active ? meta.color : "white"}`;
        // La classe d'état (is-active / is-inactive) ne porte aucun style en
        // light ; elle sert d'ancre aux overrides dark de Compliance.css
        // (les couleurs inline par référentiel restent le rendu light).
        h += `<span class="ref-chip ${active ? "is-active" : "is-inactive"}" style="${chipStyle}" data-click="toggleReferentiel" data-args='${_da(fwId)}' title="${esc(meta.description)}">${active ? "✓" : "+"} ${esc(meta.label)}</span>`;
    }
    h += '</div>';
    h += '<button class="ct-btn mt-8 ct-mt-2 ct-text-label" data-write data-variant="primary" data-click="importCustomCSV">' + t("comp.csv.btn_import") + '</button>';
    h += ' <a href="#" class="ct-text-label ct-text-accent ct-ml-2" data-click="downloadCSVTemplate">' + t("comp.csv.download_template") + '</a>';
    h += '</div>';
    document.getElementById("context-content").innerHTML = h;
}
function _setMeta(key, val) {
    _saveState();
    D.meta[key] = val;
    if (key === "societe") {
        const s = document.getElementById("header-subtitle");
        if (s)
            s.textContent = val;
    }
    _autoSave();
}
// BUG-16: populate D.referentiels[fwId] (editable working-set) from the loaded
// framework metadata/catalog when it's an active framework whose exigences
// haven't been hydrated yet (API-backed frameworks load measures lazily via
// _ensureFramework). No-op for anssi/iso (merged elsewhere) and when already
// populated.
function _hydrateFwFromMeta(fwId) {
    if (!fwId || fwId === "anssi" || fwId === "iso")
        return;
    // API-backed frameworks land their measures in window.COMPLIANCE_REF[fwId]
    // (via _ensureFramework), not the module-scoped REFERENTIELS_META.
    const meta = REFERENTIELS_META[fwId];
    const ref = (window.COMPLIANCE_REF || {})[fwId];
    const measures = (meta && meta.measures) || (ref && ref.measures) || null;
    const existing = D.referentiels[fwId];
    if (Array.isArray(existing) && existing.length) {
        // Enrich saved rows that miss the catalog text (e.g. projects saved
        // before the framework's measures were available carry empty theme) —
        // BUG-16. Fill from the loaded measures, keyed by ref.
        if (!measures || !measures.length)
            return;
        const byRef = {};
        measures.forEach(m => { byRef[m.ref] = m; });
        existing.forEach(e => {
            const m = byRef[e.ref];
            if (!m)
                return;
            if (!e.theme && m.theme)
                e.theme = m.theme;
            if (!e.theme_en && m.theme_en)
                e.theme_en = m.theme_en;
            if (!e.mesure && m.mesure)
                e.mesure = m.mesure;
            if (!e.mesure_en && m.mesure_en)
                e.mesure_en = m.mesure_en;
            if (!e.description && m.description)
                e.description = m.description;
            if (!e.description_en && m.description_en)
                e.description_en = m.description_en;
        });
        return;
    }
    const initRefs = (window.COMPLIANCE_INIT_DATA || {}).referentiels || {};
    if (initRefs[fwId]) {
        D.referentiels[fwId] = JSON.parse(JSON.stringify(initRefs[fwId]));
        return;
    }
    if (measures && measures.length) {
        D.referentiels[fwId] = measures.map(m => ({
            ref: m.ref,
            theme: m.theme || "", theme_en: m.theme_en || "",
            mesure: m.mesure || "", mesure_en: m.mesure_en || "",
            description: m.description || "", description_en: m.description_en || "",
            applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: []
        }));
    }
}
function toggleReferentiel(fwId) {
    const doToggle = () => {
        _saveState();
        const pos = D.referentiels_actifs.indexOf(fwId);
        if (pos >= 0) {
            D.referentiels_actifs.splice(pos, 1);
        }
        else {
            D.referentiels_actifs.push(fwId);
            // Initialize entries if not yet present (handles API-backed
            // frameworks via window.COMPLIANCE_REF — see BUG-16).
            _hydrateFwFromMeta(fwId);
        }
        renderContext();
        renderSidebar();
        _autoSave();
    };
    if (fwId !== "anssi" && fwId !== "iso")
        _ensureFramework(fwId, doToggle);
    else
        doToggle();
}
// ── Import référentiel custom depuis CSV ──────────────────────────
function downloadCSVTemplate() {
    _downloadCSV("referentiel_template.csv", "ref;theme;mesure;description;theme_en;mesure_en;description_en", [
        "CUSTOM-01;Gouvernance;Politique de securite;Definir et maintenir une PSSI;Governance;Security Policy;Define and maintain a security policy",
        "CUSTOM-02;Acces;Gestion des identites;Controler les acces logiques;Access;Identity Management;Control logical access",
        "CUSTOM-03;Protection;Chiffrement des donnees;AES-256 au repos et en transit;Protection;Data Encryption;AES-256 at rest and in transit",
    ]);
}
window.downloadCSVTemplate = downloadCSVTemplate;
function importCustomCSV() {
    var fi = document.createElement("input");
    fi.type = "file";
    fi.accept = ".csv,.tsv,.txt";
    fi.onchange = function () {
        if (!fi.files || !fi.files[0])
            return;
        var file = fi.files[0];
        var reader = new FileReader();
        reader.onload = function () {
            _parseAndImportCSV(reader.result, file.name);
        };
        reader.readAsText(file);
    };
    fi.click();
}
window.importCustomCSV = importCustomCSV;
function _parseAndImportCSV(csvText, filename) {
    var parsed = _parseCSV(csvText);
    var headers = parsed.headers;
    var rows = parsed.rows;
    if (headers.length === 0 || rows.length === 0) {
        showStatus(t("comp.csv.error_empty"));
        return;
    }
    var refIdx = headers.indexOf("ref");
    var themeIdx = headers.indexOf("theme");
    var mesureIdx = headers.indexOf("mesure");
    if (mesureIdx < 0)
        mesureIdx = headers.indexOf("measure");
    if (mesureIdx < 0)
        mesureIdx = headers.indexOf("control");
    var descIdx = headers.indexOf("description");
    if (descIdx < 0)
        descIdx = headers.indexOf("details");
    var themeEnIdx = headers.indexOf("theme_en");
    var mesureEnIdx = headers.indexOf("mesure_en");
    if (mesureEnIdx < 0)
        mesureEnIdx = headers.indexOf("measure_en");
    var descEnIdx = headers.indexOf("description_en");
    if (refIdx < 0 || mesureIdx < 0) {
        showStatus(t("comp.csv.error_columns"));
        return;
    }
    // Parse rows
    var measures = [];
    for (var i = 0; i < rows.length; i++) {
        var cols = rows[i];
        if (cols.length <= mesureIdx)
            continue;
        var ref = (cols[refIdx] || "").trim();
        var mesure = (cols[mesureIdx] || "").trim();
        if (!ref || !mesure)
            continue;
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
    if (measures.length === 0) {
        showStatus(t("comp.csv.error_no_measures"));
        return;
    }
    // Prompt for framework name
    var label = prompt(t("comp.csv.prompt_name"), filename.replace(/\.(csv|tsv|txt)$/i, ""));
    if (!label)
        return;
    var fwId = "custom_" + label.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 30) + "_" + Date.now().toString(36);
    // Random color
    var colors = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#06b6d4", "#14b8a6", "#84cc16", "#f97316", "#78716c"];
    var color = colors[Math.floor(Math.random() * colors.length)];
    // Register in catalog
    if (!window._REFERENTIELS_CATALOG)
        window._REFERENTIELS_CATALOG = {};
    window._REFERENTIELS_CATALOG[fwId] = {
        label: label,
        description: t("comp.csv.custom_desc", { count: measures.length }),
        description_en: "Custom framework (" + measures.length + " controls)",
        color: color,
        custom: true,
    };
    REFERENTIELS_META[fwId] = window._REFERENTIELS_CATALOG[fwId];
    REFERENTIELS_META[fwId].measures = measures;
    // Register in COMPLIANCE_REF for lazy loading
    if (!window.COMPLIANCE_REF)
        window.COMPLIANCE_REF = {};
    window.COMPLIANCE_REF[fwId] = {
        label: label,
        description: window._REFERENTIELS_CATALOG[fwId].description,
        color: color,
        measures: measures,
    };
    // Activate and initialize entries
    _saveState();
    D.referentiels_actifs.push(fwId);
    D.referentiels[fwId] = measures.map(function (m) {
        return {
            ref: m.ref, theme: m.theme, mesure: m.mesure, description: m.description || "",
            applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: []
        };
    });
    // Store custom frameworks in D for persistence
    if (!D._custom_frameworks)
        D._custom_frameworks = {};
    D._custom_frameworks[fwId] = {
        label: label,
        color: color,
        measures: measures,
    };
    _autoSave();
    renderContext();
    renderSidebar();
    showStatus(t("comp.csv.imported", { label: label, count: measures.length }));
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
    }
    else {
        h += '<div class="ct-kpigrid ct-mb-4">';
        for (const fw of frameworks) {
            const tone = fw.pct >= 80 ? "low" : fw.pct >= 50 ? "medium" : fw.pct >= 25 ? "high" : "critical";
            h += `<div class="ct-kpi-adv ct-clickable" data-tone="${tone}" data-click="selectPanel" data-args='${_da("fw:" + fw.fwId + ":dashboard")}'>
                <div class="ct-kpi-tone"></div>
                <div class="ct-kpi-adv-body">
                    <div class="ct-kpi-adv-head"><div class="ct-kpi-adv-title">${esc(fw.label)}</div></div>
                    <div class="ct-kpi-adv-valrow"><span class="ct-kpi-adv-value">${fw.pct}<span class="ct-kpi-unit">%</span></span></div>
                    <div class="ct-kpi-adv-viz"><div class="ct-meter" data-tone="${tone}"><span style="width:${fw.pct}%"></span></div></div>
                    <div class="ct-kpi-adv-meta"><span>${fw.ok} <b>OK</b></span><span>${fw.ko} <b>KO</b></span>${fw.excluded ? `<span>${fw.excluded} <b>N/A</b></span>` : ""}</div>
                </div>
            </div>`;
        }
        h += '</div>';
        // Plan d'action résumé
        const enCours = D.mesures.filter(m => m.statut === "en_cours").length;
        const planifie = D.mesures.filter(m => m.statut === "planifie").length;
        const termine = D.mesures.filter(m => m.statut === "termine").length;
        if (D.mesures.length > 0) {
            h += `<div class="synth-card"><h3>${t("comp.dash.mesures")}</h3><div class="ct-kpigrid ct-mb-4">
                <div class="ct-kpi"><div class="ct-kpi-tone"></div><div class="ct-kpi-body"><div class="ct-kpi-label">${t("comp.dash.total")}</div><div class="ct-kpi-value">${D.mesures.length}</div></div></div>
                <div class="ct-kpi" data-emphasis="value"><div class="ct-kpi-tone"></div><div class="ct-kpi-body"><div class="ct-kpi-label">${t("comp.dash.terminees")}</div><div class="ct-kpi-value">${termine}</div></div></div>
                <div class="ct-kpi" data-emphasis="value"><div class="ct-kpi-tone"></div><div class="ct-kpi-body"><div class="ct-kpi-label">${t("comp.dash.en_cours")}</div><div class="ct-kpi-value">${enCours}</div></div></div>
                <div class="ct-kpi" data-emphasis="value"><div class="ct-kpi-tone"></div><div class="ct-kpi-body"><div class="ct-kpi-label">${t("comp.dash.planifiees")}</div><div class="ct-kpi-value">${planifie}</div></div></div>
            </div></div>`;
        }
    }
    document.getElementById("dashboard-content").innerHTML = h;
}
// ── Vue par référentiel ───────────────────────────────────────────
function _renderFwView(fwId, subview) {
    const meta = _getAllFrameworks()[fwId];
    const label = meta ? meta.label : fwId;
    if (subview === "dashboard")
        _renderFwDashboard(fwId, label);
    else if (subview === "exigences")
        _renderFwExigences(fwId, label);
    else if (subview === "mesures")
        _renderFwMesures(fwId, label);
    else if (subview === "preuves")
        _renderFwPreuves(fwId, label);
}
function _renderFwDashboard(fwId, label) {
    const exigences = _getExigences(fwId);
    const applicable = exigences.filter(e => e.applicable !== false && e.applicable !== "non");
    const ok = applicable.filter(e => _exigenceStatut(e) === "ok").length;
    const ko = applicable.length - ok;
    const pct = applicable.length > 0 ? Math.round(ok * 100 / applicable.length) : 0;
    const mesures = _getMesuresForFw(fwId);
    const preuves = _getPreuvesForFw(fwId);
    let h = `<h2 class="ct-ink ct-mb-4">${esc(label)}</h2>`;
    const tone = _kpiTone(pct, { dir: "up", amber: 90, red: 70 });
    h += `<div class="ct-kpigrid ct-mb-4">
        <div class="ct-kpi" data-emphasis="value" data-tone="${tone}"><div class="ct-kpi-tone"></div><div class="ct-kpi-body"><div class="ct-kpi-label">${t("comp.fw_dash.conformite", { ok: ok, ko: ko })}</div><div class="ct-kpi-value">${pct}<span class="ct-kpi-unit">%</span></div></div></div>
        <div class="ct-kpi"><div class="ct-kpi-tone"></div><div class="ct-kpi-body"><div class="ct-kpi-label">${t("comp.fw_dash.exigences_applicables")}</div><div class="ct-kpi-value">${applicable.length}</div></div></div>
        <div class="ct-kpi"><div class="ct-kpi-tone"></div><div class="ct-kpi-body"><div class="ct-kpi-label">${t("comp.fw_dash.mesures")}</div><div class="ct-kpi-value">${mesures.length}</div></div></div>
        <div class="ct-kpi"><div class="ct-kpi-tone"></div><div class="ct-kpi-body"><div class="ct-kpi-label">${t("comp.fw_dash.preuves")}</div><div class="ct-kpi-value">${preuves.length}</div></div></div>
    </div>`;
    // Actions en cours
    const actions = mesures.filter(m => m.statut !== "termine");
    if (actions.length > 0) {
        h += `<div class="synth-card"><h3>${t("comp.fw_dash.actions_en_cours", { count: actions.length })}</h3><table><thead><tr><th>${t("comp.fw_dash.col_id")}</th><th>${t("comp.fw_dash.col_description")}</th><th>${t("comp.fw_dash.col_statut")}</th><th>${t("comp.fw_dash.col_echeance")}</th></tr></thead><tbody>`;
        actions.forEach(m => {
            h += `<tr class="ct-clickable" data-click="_goEditMesure" data-args='${_da(fwId, m.id)}'><td class="fw-600">${esc(m.id)}</td><td>${esc(m.description)}</td><td>${_mesureBadge(m)}</td><td>${esc(m.date_cible || "—")}</td></tr>`;
        });
        h += '</tbody></table></div>';
    }
    // Preuves expirant bientôt (< 90 jours)
    const expiring = preuves.filter(p => {
        if (!p.date_expiration)
            return false;
        const dst = ctDateStatus(p.date_expiration, 90);
        return dst === "expired" || dst === "soon";
    });
    if (expiring.length > 0) {
        h += `<div class="synth-card" style="border-color:var(--ct-high)"><h3 class="ct-text-high">${t("comp.fw_dash.preuves_expirant", { count: expiring.length })}</h3><table><thead><tr><th>${t("comp.fw_dash.col_id")}</th><th>${t("comp.fw_dash.col_label")}</th><th>${t("comp.fw_dash.col_expiration")}</th></tr></thead><tbody>`;
        expiring.forEach(p => {
            const expired = ctDateStatus(p.date_expiration, 90) === "expired";
            h += `<tr style="${expired ? "background:var(--ct-critical-tint)" : ""}"><td class="fw-600">${esc(p.id)}</td><td>${esc(p.label)}</td><td>${expired ? _tBadge(t("comp.prv.expiree"), "red") : esc(p.date_expiration)}</td></tr>`;
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
            if (!ref.toLowerCase().includes(filter) && !theme.includes(filter) && !mesure.includes(filter) && !ecart.includes(filter))
                return;
        }
        exigences.push({ entry: e, origIdx });
    });
    let h = `<h2 class="ct-ink ct-mb-4">${t("comp.exig.title", { label: esc(label) })}</h2>`;
    h += `<div class="ct-flex ct-gap-2 ct-items-center ct-mb-3">
        <input type="text" placeholder="${t("comp.exig.search")}" value="${esc(_exigFilter)}" class="ct-flex-1 ct-maxw-300" data-input="_filterExigences" data-args='${_da(fwId)}' data-pass-value />
        <span class="fs-xs text-muted">${t("comp.exig.count", { filtered: exigences.length, total: allExigences.length })}</span>
    </div>`;
    h += `<table id="exig-${fwId}-table"><thead><tr>`;
    h += `<th${hd("ref")} class="ct-w-60">${t("comp.exig.col_ref")}</th>`;
    h += `<th${hd("theme")} style="min-width:100px">${t("comp.exig.col_theme")}</th>`;
    h += `<th${hd("mesure")} class="ct-maxw-300">${t("comp.exig.col_mesure")}</th>`;
    h += `<th${hd("appl")} class="ct-w-50 ta-c">${t("comp.exig.col_appl")}</th>`;
    h += `<th${hd("statut")} class="ct-w-70 ta-c">${t("comp.exig.col_statut")}</th>`;
    h += `<th${hd("ecart")} style="min-width:250px">${t("comp.exig.col_commentaires")}</th>`;
    h += `<th${hd("mes")} class="ct-minw-200">${t("comp.exig.col_mesures_liees")}</th>`;
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
        const statutColor = _exigStatutColors[statut] || "var(--ct-ink-2)";
        // Mesures liées avec statut effectif
        const linkedMesures = (e.mesures_ids || []).map(id => _getMesure(id)).filter(Boolean);
        const enPlace = linkedMesures.filter(m => _mesureEffectiveStatut(m) === "termine");
        const preuveManquante = linkedMesures.filter(m => _mesureEffectiveStatut(m) === "preuve_manquante");
        const prevues = linkedMesures.filter(m => { var s = _mesureEffectiveStatut(m); return s !== "termine" && s !== "preuve_manquante"; });
        h += `<tr${notApplicable ? ' class="ct-bg-alt"' : ''}>`;
        h += `<td${hd("ref")} class="fw-600">${esc(ref)}</td>`;
        h += `<td${hd("theme")} class="fs-sm">${esc(theme)}</td>`;
        h += `<td${hd("mesure")}><div>${esc(_rt(e, "mesure"))}</div>${desc ? '<div class="desc-text">' + esc(desc) + '</div>' : ""}</td>`;
        h += `<td${hd("appl")} class="ta-c"><input type="checkbox" ${!notApplicable ? "checked" : ""} data-change="_toggleApplicable" data-args='${_da(fwId, i)}' data-pass-checked /></td>`;
        h += `<td${hd("statut")} class="ta-c">${_tBadge(_exigStatutLabel(statut), statutColor)}</td>`;
        h += `<td${hd("ecart")}><textarea rows="3" class="w-full" placeholder="${notApplicable ? t("comp.exig.placeholder_na") : t("comp.exig.placeholder_comments")}" data-change="_updateExig" data-args='${_da(fwId, i, "ecart")}' data-pass-value data-input="_autoHeight" data-pass-el>${esc(e.ecart || "")}</textarea></td>`;
        // Colonne mesures liées
        h += `<td${hd("mes")}>`;
        if (enPlace.length > 0) {
            h += '<div class="fs-xs fw-600 mb-8 ct-text-low">' + t("comp.exig.en_place") + '</div>';
            enPlace.forEach(m => {
                h += `<div class="linked-tag"><span class="ct-clickable" data-click="_goEditMesure" data-args='${_da(fwId, m.id)}'>${esc(m.id)} ${esc(m.description).substring(0, 40)}</span><span class="tag-x" data-click="_unlinkMesure" data-args='${_da(fwId, i, m.id)}' data-stop>×</span></div>`;
            });
        }
        if (preuveManquante.length > 0) {
            h += '<div class="fs-xs fw-600 mb-8 mt-8 ct-text-critical">' + t("comp.exig.preuve_manquante") + '</div>';
            preuveManquante.forEach(m => {
                h += `<div class="linked-tag" style="border-color:var(--ct-critical)"><span class="ct-clickable" data-click="_goEditMesure" data-args='${_da(fwId, m.id)}'>${esc(m.id)} ${esc(m.description).substring(0, 40)}</span><span class="tag-x" data-click="_unlinkMesure" data-args='${_da(fwId, i, m.id)}' data-stop>×</span></div>`;
            });
        }
        if (prevues.length > 0) {
            h += '<div class="fs-xs fw-600 mb-8 mt-8 ct-text-high">' + t("comp.exig.prevues") + '</div>';
            prevues.forEach(m => {
                h += `<div class="linked-tag"><span class="ct-clickable" data-click="_goEditMesure" data-args='${_da(fwId, m.id)}'>${esc(m.id)} ${esc(m.description).substring(0, 40)}</span><span class="tag-x" data-click="_unlinkMesure" data-args='${_da(fwId, i, m.id)}' data-stop>×</span></div>`;
            });
        }
        // Sélecteur pour lier une mesure existante
        const mesOpts = D.mesures.filter(m => !(e.mesures_ids || []).includes(m.id)).map(m => ({ value: m.id, label: m.id + " " + (m.description || "").substring(0, 40) }));
        h += `<div class="mt-8">${_searchSelect(t("comp.exig.lier_mesure"), mesOpts, "_linkExistingMesure", [fwId, i])}
            <button class="ct-btn mt-8 ct-ml-1" data-write data-variant="primary" data-size="xs" data-click="_createAndLinkMesure" data-args='${_da(fwId, i)}'>${t("comp.exig.btn_nouvelle")}</button>
            <button class="ct-btn mt-8 ct-ml-1" data-write data-variant="primary" data-size="xs" data-click="_proposerMesures" data-args='${_da(fwId, i)}'>${t("comp.exig.btn_proposer")}</button>
        </div></td>`;
        h += '</tr>';
    });
    h += '</tbody></table>';
    h += colsButton("exig-" + fwId + "-table");
    document.getElementById("fw-desc").textContent = t("comp.exig.fw_desc", { label: label });
    document.getElementById("fw-content").innerHTML = h;
    _setupTable("exig-" + fwId + "-table");
    document.querySelectorAll("#fw-content textarea").forEach(function (ta) {
        if (ta.value) {
            ta.style.height = "auto";
            ta.style.height = ta.scrollHeight + "px";
        }
    });
}
// Handlers exigences
function _toggleApplicable(fwId, idx, checked) {
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    entry.applicable = checked;
    if (!checked)
        entry.conformite = "";
    _renderFwView(fwId, "exigences");
    _persist("control", entry.id, { applicable: entry.applicable, conformite: entry.conformite });
}
// Conformité calculée automatiquement (voir _exigenceStatut)
function _updateExig(fwId, idx, field, val) {
    var entry = _getExigEntry(fwId, idx);
    entry[field] = val;
    _persist("control", entry.id, _obj(field, val));
}
function _getExigEntry(fwId, idx) {
    return ((D.referentiels && D.referentiels[fwId]) || [])[idx] || {};
}
function _linkExistingMesure(fwId, idx, mesureId) {
    if (!mesureId)
        return;
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    if (!entry.mesures_ids)
        entry.mesures_ids = [];
    if (!entry.mesures_ids.includes(mesureId))
        entry.mesures_ids.push(mesureId);
    _renderFwView(fwId, "exigences");
    _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
}
function _createAndLinkMesure(fwId, idx) {
    // BUG-15: create+link through the unified ct_measure_modal (like
    // _addMesurePlan), not the legacy draft overlay. _createMesureUnified
    // handles both the creation and the exigence link.
    window._createMesureUnified(fwId, idx);
}
function _unlinkMesure(fwId, idx, mesureId) {
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    entry.mesures_ids = (entry.mesures_ids || []).filter(id => id !== mesureId);
    _renderFwView(fwId, "exigences");
    _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
}
// ── Mesures (par référentiel) ─────────────────────────────────────
let _editingMesure = null;
let _mesureEditReturnTo = null; // "fw:anssi:exigences" si on vient des exigences
let _mesureFilter = "";
function _renderFwMesures(fwId, label) {
    // N'afficher que les mesures liées au référentiel courant
    const fwMesureIds = new Set();
    _getExigences(fwId).forEach(e => (e.mesures_ids || []).forEach(id => fwMesureIds.add(id)));
    const filter = _mesureFilter.toLowerCase();
    const mesures = D.mesures.filter(m => {
        if (!fwMesureIds.has(m.id) && m.id !== _editingMesure)
            return false;
        if (!filter)
            return true;
        return (m.id + " " + (m.description || "") + " " + (m.responsable || "")).toLowerCase().includes(filter);
    });
    let h = `<h2 class="ct-ink ct-mb-4">${t("comp.mes.title", { label: esc(label) })}</h2>`;
    h += `<div class="ct-flex ct-gap-2 ct-items-center ct-mb-3">
        <button class="ct-btn mt-8" data-write data-variant="primary" data-size="xs" data-click="_refreshMeasures" title="Rafraîchir">&#x21bb;</button>
        <input type="text" placeholder="${t("comp.mes.search")}" value="${esc(_mesureFilter)}" class="ct-flex-1 ct-maxw-300" data-input="_filterMesures" data-args='${_da(fwId)}' data-pass-value />
        <span class="fs-xs text-muted">${t("comp.mes.count", { count: mesures.length })}</span>
    </div>`;
    const scope = "compliance-mesures-" + fwId;
    if (mesures.length > 0 && window.ct_table) {
        // Enrich rows with linked info so ct_table renderers can access it synchronously
        const rows = mesures.map(m => {
            return Object.assign({}, m, {
                __linkedExigs: _findExigencesForMesure(m.id),
                __linkedFws: _findFwsForMesure(m.id),
                __fwId: fwId
            });
        });
        h += window.ct_table.render({
            rows: rows,
            rowKey: "id",
            onRowClick: "_editMesureRow",
            bulk: { scope: scope },
            columns: [
                { key: "id", label: t("comp.mes.col_id"), width: "80px",
                    render: m => '<span class="fw-600">' + esc(m.id) + '</span>' },
                { key: "description", label: t("comp.mes.col_description"),
                    render: m => esc(m.description || "—") },
                { key: "statut", label: t("comp.mes.col_statut"), width: "100px",
                    render: m => _mesureBadge(m) },
                { key: "responsable", label: t("comp.mes.col_responsable"), width: "120px",
                    render: m => esc(m.responsable || "—") },
                { key: "date_cible", label: t("comp.mes.col_echeance"), width: "110px",
                    render: m => esc(m.date_cible || "—") },
                { key: "recurrence", label: t("comp.mes.col_recurrence"), width: "110px",
                    render: m => m.recurrence ? esc(_recLabel(m.recurrence)) : "—" },
                { key: "preuves", label: t("comp.mes.col_preuves"), width: "80px",
                    render: m => '<span class="ta-c">' + ((m.preuves_ids || []).length || "—") + '</span>' },
                { key: "exigences", label: t("comp.mes.col_exigences"),
                    render: m => '<span class="fs-xs">' + esc((m.__linkedExigs || []).join(", ") || "—") + '</span>' }
            ]
        });
    }
    else if (mesures.length > 0) {
        // Fallback (ct_table not loaded yet)
        h += '<div class="empty-state">' + t("comp.mes.count", { count: mesures.length }) + '</div>';
    }
    document.getElementById("fw-desc").textContent = t("comp.mes.fw_desc", { label: label });
    document.getElementById("fw-content").innerHTML = h;
    if (mesures.length > 0 && window.ct_bulkbar) {
        setTimeout(function () {
            window.ct_bulkbar.attach({
                scope: scope,
                label: t("measure.selected_n") || "{n} mesure(s) sélectionnée(s)",
                actions: [
                    { id: "done", icon: "check", label: "Terminé", variant: "success",
                        onClick: "_bulkComplianceMesuresDone", data: { fwId: fwId } },
                    { id: "delete", icon: "trash", label: t("btn_delete") || "Supprimer", danger: true,
                        onClick: "_bulkComplianceMesuresDelete", data: { fwId: fwId },
                        confirm: { title: "Supprimer {n} mesure(s) ?", message: "Cette action est irréversible." } }
                ]
            });
            window.ct_bulkbar.update(scope);
        }, 0);
    }
}
// Shim: ct_table passes the row object to onRowClick handlers.
// Opens the unified ct_measure_modal. The rich "exigences / preuves"
// management stays available via an "Avancé" extra button that opens
// the legacy _showMesureModal.
window._refreshMeasures = function () {
    var pid = (typeof window._getActiveProjectId === "function") ? window._getActiveProjectId() : null;
    if (pid && window.ComplianceAPI && window.ComplianceAPI.get) {
        window.ComplianceAPI.get(pid).then(function (proj) {
            if (proj && proj.data) {
                var data = proj.data;
                Object.keys(data).forEach(function (k) { D[k] = data[k]; });
            }
            showStatus("Données rafraîchies");
            renderAll();
        }).catch(function (e) { showStatus("Erreur : " + (e.message || e), true); });
    }
    else {
        window.location.reload();
    }
};
window._editMesureRow = function (row) {
    if (!row || !row.id)
        return;
    if (!window.ct_measure_modal) {
        _editMesure(row.__fwId || null, row.id);
        return;
    }
    const m = _getMesure(row.id);
    if (!m)
        return;
    var fwId = row.__fwId || null;
    // Les exigences d'un référentiel sont chargées paresseusement : ouvert
    // depuis un contexte référentiel dont les entrées ne sont pas en mémoire
    // (ex. panneau Mesures → création enchaînée), le sélecteur « Exigences
    // liées » serait vide et la liaison perdue. Charger d'abord, puis rouvrir.
    if (fwId && fwId !== "anssi" && fwId !== "iso" && !row.__fwEnsured
        && !_getExigences(fwId).length && typeof _ensureFramework === "function") {
        _ensureFramework(fwId, function () { row.__fwEnsured = true; window._editMesureRow(row); });
        return;
    }
    var statusOpts = [
        { value: "planifie", label: _statutLabel("planifie") },
        { value: "en_cours", label: _statutLabel("en_cours") },
        { value: "termine", label: _statutLabel("termine") }
    ];
    var recurrenceOpts = ["ponctuel", "mensuelle", "trimestrielle", "semestrielle", "annuelle"]
        .map(function (k) { return { value: k, label: _recLabel(k) }; });
    // Pending changes — applied only on save, discarded on cancel.
    // Never touch D directly during modal editing.
    window._pendingExigLinks = []; // [{fwId, idx, entryId}]
    window._pendingExigUnlinks = []; // [{fwId, idx, entryId}]
    window._pendingPreuveLinks = []; // [preuveId]
    window._pendingPreuveUnlinks = []; // [preuveId]
    // Inline exigences + preuves management (interactive).
    var extraHtml = '';
    extraHtml += '<div class="fs-xs fw-600 ct-mt-2 ct-mb-1">'
        + esc(t("comp.mes.exigences_liees") || "Exigences liées") + '</div>';
    extraHtml += '<div id="ct-mesure-exigs-wrap">' + _renderExigsForModal(m.id) + '</div>';
    extraHtml += '<div class="fs-xs fw-600 ct-mt-2 ct-mb-1">'
        + esc(t("comp.mes.preuves_liees") || "Preuves liées") + '</div>';
    extraHtml += '<div id="ct-mesure-preuves-wrap">' + _renderPreuvesForModal(m.id) + '</div>';
    window.ct_measure_modal.open(m, {
        title: m.id,
        fieldMap: { title: "description", description: "details", echeance: "date_cible" },
        hideFields: ["type"],
        statusOptions: statusOpts,
        defaultStatus: "planifie",
        ownerPicker: { pickerId: "compliance-measure-owner", directoryUrl: "api/directory" },
        onAddNote: function (_entry, fullLog) {
            m.progress_log = fullLog;
            if (typeof _persist === "function")
                _persist("measure", m.id, { progress_log: fullLog });
        },
        extraFields: [
            { key: "recurrence", label: t("comp.mes.label_recurrence") || "Récurrence", type: "select", options: recurrenceOpts, value: m.recurrence || "" },
            { key: "dernier_controle", label: t("comp.mes.label_dernier_controle") || "Dernier contrôle", type: "date", value: m.dernier_controle || "" }
        ],
        extraContent: extraHtml,
        extraButtons: [],
        onDelete: function () {
            if (!confirm(t("comp.confirm.delete_mesure", { id: m.id })))
                return;
            _saveState();
            _deleteMesure(m.id, fwId);
        }
    }).then(function (result) {
        if (!result || result.__deleted || result.__advanced)
            return;
        _saveState();
        // Apply measure field changes
        var patch = {};
        ["description", "details", "statut", "responsable", "date_cible", "recurrence", "dernier_controle", "progress_log"].forEach(function (k) {
            if (result[k] !== undefined && result[k] !== m[k]) {
                m[k] = result[k];
                patch[k] = result[k];
            }
        });
        // Apply pending exigence links/unlinks to D
        var dirtyControls = {};
        (window._pendingExigLinks || []).forEach(function (op) {
            var entry = _getExigEntry(op.fwId, op.idx);
            if (!entry)
                return;
            if (!entry.mesures_ids)
                entry.mesures_ids = [];
            if (entry.mesures_ids.indexOf(m.id) < 0)
                entry.mesures_ids.push(m.id);
            dirtyControls[String(entry.id)] = entry;
        });
        (window._pendingExigUnlinks || []).forEach(function (op) {
            var entry = _getExigEntry(op.fwId, op.idx);
            if (!entry)
                return;
            entry.mesures_ids = (entry.mesures_ids || []).filter(function (id) { return id !== m.id; });
            dirtyControls[String(entry.id)] = entry;
        });
        for (var cid in dirtyControls) {
            _persist("control", dirtyControls[cid].id, { mesures_ids: dirtyControls[cid].mesures_ids });
        }
        // Apply pending preuve links/unlinks
        var preuveDirty = false;
        (window._pendingPreuveLinks || []).forEach(function (pid) {
            if (!m.preuves_ids)
                m.preuves_ids = [];
            if (m.preuves_ids.indexOf(pid) < 0) {
                m.preuves_ids.push(pid);
                preuveDirty = true;
            }
        });
        (window._pendingPreuveUnlinks || []).forEach(function (pid) {
            m.preuves_ids = (m.preuves_ids || []).filter(function (id) { return id !== pid; });
            preuveDirty = true;
        });
        if (preuveDirty)
            patch.preuves_ids = m.preuves_ids;
        if (Object.keys(patch).length)
            _persist("measure", m.id, patch);
        renderAll();
    });
};
// Create a measure through the unified ct_measure_modal (BUG-15): same modal
// as edit (_editMesureRow), opened on a blank measure. Optionally links the new
// measure to an exigence (fwId + linkIdx). Replaces the legacy _showMesureModal
// draft overlay for the "+ Nouvelle mesure" entry points.
window._createMesureUnified = function (fwId, linkIdx) {
    if (!window.ct_measure_modal) {
        _draftMesure = { description: "", details: "", statut: "planifie", date_cible: "", responsable: "", recurrence: "", dernier_controle: "", preuves_ids: [] };
        _draftMesureFwId = fwId;
        _draftMesureLinkIdx = linkIdx;
        _editingMesure = "__draft__";
        _showMesureModal();
        return;
    }
    var statusOpts = [
        { value: "planifie", label: _statutLabel("planifie") },
        { value: "en_cours", label: _statutLabel("en_cours") },
        { value: "termine", label: _statutLabel("termine") }
    ];
    var recurrenceOpts = ["ponctuel", "mensuelle", "trimestrielle", "semestrielle", "annuelle"]
        .map(function (k) { return { value: k, label: _recLabel(k) }; });
    window.ct_measure_modal.open(null, {
        title: t("comp.mes.new_draft") || "Nouvelle mesure",
        saveLabel: t("comp.mes.btn_valider") || "Créer",
        fieldMap: { title: "description", description: "details", echeance: "date_cible" },
        hideFields: ["type"],
        statusOptions: statusOpts,
        defaultStatus: "planifie",
        ownerPicker: { pickerId: "compliance-new-measure-owner", directoryUrl: "api/directory" },
        extraFields: [
            { key: "recurrence", label: t("comp.mes.label_recurrence") || "Récurrence", type: "select", options: recurrenceOpts, value: "" },
            { key: "dernier_controle", label: t("comp.mes.label_dernier_controle") || "Dernier contrôle", type: "date", value: "" }
        ]
    }).then(function (result) {
        if (!result || result.__deleted || result.__advanced)
            return;
        _saveState();
        var id = _genMesureId();
        var payload = {
            id: id,
            description: result.description || "", details: result.details || "",
            statut: result.statut || "planifie", responsable: result.responsable || "",
            date_cible: result.date_cible || "", recurrence: result.recurrence || "",
            dernier_controle: result.dernier_controle || "", preuves_ids: []
        };
        var afterCreate = function (created) {
            D.mesures.push(created);
            if (linkIdx !== null && fwId) {
                var entry = _getExigEntry(fwId, linkIdx);
                if (entry) {
                    if (!entry.mesures_ids)
                        entry.mesures_ids = [];
                    entry.mesures_ids.push(created.id);
                    _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
                }
            }
            showStatus(t("comp.status.mesure_created") || ("Mesure créée : " + created.id));
            renderAll();
        };
        if (window.ComplianceAPI && typeof window._getActiveProjectId === "function") {
            window.ComplianceAPI.createMeasure(window._getActiveProjectId(), payload).then(afterCreate)
                .catch(function (e) { showStatus("Erreur création : " + (e.message || e), true); });
        }
        else {
            afterCreate(payload);
            _autoSave();
        }
    });
};
// Renders the interactive exigences section for the unified modal:
// a list of linked-exigence tags (with × to unlink) plus a searchable
// selector to link a new exigence. The output is injected into
// #ct-mesure-exigs-wrap and the handlers re-render just that wrapper
// after every mutation (so the ct_modal stays open).
function _isExigLinkedInModal(e, fwId, idx, mesureId) {
    // Real state from D
    var linked = (e.mesures_ids || []).indexOf(mesureId) >= 0;
    // Apply pending ops
    if (window._pendingExigUnlinks) {
        for (var u = 0; u < window._pendingExigUnlinks.length; u++) {
            if (window._pendingExigUnlinks[u].fwId === fwId && window._pendingExigUnlinks[u].idx === idx) {
                linked = false;
                break;
            }
        }
    }
    if (window._pendingExigLinks) {
        for (var l = 0; l < window._pendingExigLinks.length; l++) {
            if (window._pendingExigLinks[l].fwId === fwId && window._pendingExigLinks[l].idx === idx) {
                linked = true;
                break;
            }
        }
    }
    return linked;
}
function _renderExigsForModal(mesureId) {
    var h = "";
    var linked = [];
    for (var i = 0; i < D.referentiels_actifs.length; i++) {
        var fwId = D.referentiels_actifs[i];
        var exigences = _getExigences(fwId);
        var meta = _getAllFrameworks()[fwId];
        var fwLabel = meta ? meta.label : fwId;
        exigences.forEach(function (e, idx) {
            var ref = _getExigRef(fwId, e);
            if (_isExigLinkedInModal(e, fwId, idx, mesureId)) {
                linked.push({ fwId: fwId, idx: idx, ref: ref, fwLabel: fwLabel });
            }
        });
    }
    if (linked.length) {
        linked.forEach(function (l) {
            h += '<div class="linked-tag">' + esc(l.fwLabel) + ' — ' + esc(l.ref)
                + '<span class="tag-x" data-click="_unlinkExigInModal" data-args=\'' + _da(mesureId, l.fwId, l.idx) + '\' data-stop>×</span></div>';
        });
    }
    else {
        h += '<div class="text-muted fs-xs ct-mb-1">—</div>';
    }
    var exigOpts = [];
    for (var j = 0; j < D.referentiels_actifs.length; j++) {
        var fwId2 = D.referentiels_actifs[j];
        var exigences2 = _getExigences(fwId2);
        var meta2 = _getAllFrameworks()[fwId2];
        var fwLabel2 = meta2 ? meta2.label : fwId2;
        exigences2.forEach(function (e, idx) {
            var ref = _getExigRef(fwId2, e);
            if (!_isExigLinkedInModal(e, fwId2, idx, mesureId)) {
                exigOpts.push({
                    value: fwId2 + ":" + idx,
                    label: fwLabel2 + " — " + ref + " " + ((_rt(e, "mesure") || "").substring(0, 40))
                });
            }
        });
    }
    h += _searchSelect(t("comp.mes.lier_exigence") || "Lier une exigence…", exigOpts, "_linkExigInModal", [mesureId]);
    return h;
}
window._linkExigInModal = function (mesureId, val) {
    if (!val)
        return;
    var parts = val.split(":");
    var fwId = parts[0];
    var idx = parseInt(parts[1], 10);
    var entry = _getExigEntry(fwId, idx);
    if (!entry)
        return;
    window._pendingExigLinks.push({ fwId: fwId, idx: idx, entryId: entry.id });
    // Remove from unlinks if previously unlinked in this session
    window._pendingExigUnlinks = window._pendingExigUnlinks.filter(function (op) {
        return !(op.fwId === fwId && op.idx === idx);
    });
    var wrap = document.getElementById("ct-mesure-exigs-wrap");
    if (wrap)
        wrap.innerHTML = _renderExigsForModal(mesureId);
};
window._unlinkExigInModal = function (mesureId, fwId, idx) {
    var entry = _getExigEntry(fwId, idx);
    if (!entry)
        return;
    window._pendingExigUnlinks.push({ fwId: fwId, idx: idx, entryId: entry.id });
    // Remove from links if previously linked in this session
    window._pendingExigLinks = window._pendingExigLinks.filter(function (op) {
        return !(op.fwId === fwId && op.idx === idx);
    });
    var wrap = document.getElementById("ct-mesure-exigs-wrap");
    if (wrap)
        wrap.innerHTML = _renderExigsForModal(mesureId);
};
// Renders the interactive preuves section for the unified modal.
// Mirrors _renderExigsForModal: tags (name + ×) + search select + "+ New"
// button. All mutations re-render only #ct-mesure-preuves-wrap so the
// ct_modal stays open.
function _renderPreuvesForModal(mesureId) {
    var m = _getMesure(mesureId);
    if (!m)
        return "";
    var h = "";
    // Build effective linked list from D + pending ops
    var linked = (m.preuves_ids || []).slice();
    (window._pendingPreuveUnlinks || []).forEach(function (pid) {
        linked = linked.filter(function (id) { return id !== pid; });
    });
    (window._pendingPreuveLinks || []).forEach(function (pid) {
        if (linked.indexOf(pid) < 0)
            linked.push(pid);
    });
    if (linked.length) {
        linked.forEach(function (pid) {
            var p = _getPreuve(pid);
            if (!p)
                return;
            h += '<div class="linked-tag">'
                + '<span class="ct-clickable" data-click="_editPreuveFromModal" data-args=\'' + _da(mesureId, pid) + '\'>'
                + esc(p.id) + ' ' + esc(p.label || "") + '</span>'
                + '<span class="tag-x" data-click="_unlinkPreuveInModal" data-args=\'' + _da(mesureId, pid) + '\' data-stop>×</span></div>';
        });
    }
    else {
        h += '<div class="text-muted fs-xs ct-mb-1">—</div>';
    }
    var availOpts = D.preuves
        .filter(function (p) { return linked.indexOf(p.id) < 0; })
        .map(function (p) { return { value: p.id, label: p.id + " " + (p.label || "") }; });
    h += '<div class="ct-flex ct-gap-1 ct-items-center ct-mt-1">';
    h += '<div class="ct-flex-1">' + _searchSelect(t("comp.mes.lier_preuve") || "Lier une preuve…", availOpts, "_linkPreuveInModal", [mesureId]) + '</div>';
    h += '<button class="ct-btn mt-8" data-write data-variant="primary" data-size="sm" data-click="_createAndLinkPreuveInModal" data-args=\'' + _da(mesureId) + '\'>'
        + esc(t("comp.mes.btn_nouvelle_preuve") || "+ Nouvelle preuve") + '</button>';
    h += '</div>';
    return h;
}
window._linkPreuveInModal = function (mesureId, preuveId) {
    if (!preuveId)
        return;
    window._pendingPreuveLinks.push(preuveId);
    window._pendingPreuveUnlinks = window._pendingPreuveUnlinks.filter(function (id) { return id !== preuveId; });
    var wrap = document.getElementById("ct-mesure-preuves-wrap");
    if (wrap)
        wrap.innerHTML = _renderPreuvesForModal(mesureId);
};
window._unlinkPreuveInModal = function (mesureId, preuveId) {
    window._pendingPreuveUnlinks.push(preuveId);
    window._pendingPreuveLinks = window._pendingPreuveLinks.filter(function (id) { return id !== preuveId; });
    var wrap = document.getElementById("ct-mesure-preuves-wrap");
    if (wrap)
        wrap.innerHTML = _renderPreuvesForModal(mesureId);
};
// Markers used by _closePreuveModal / _deletePreuveModal to know they
// should reopen the unified ct_measure_modal (rather than the legacy
// _showMesureModal overlay) when the preuve overlay closes.
var _ctReturnToMesureId = null;
var _ctReturnToMesureFwId = null;
// Edit an existing preuve by closing the unified modal and opening
// the legacy preuve modal; reopens the unified modal on close.
window._editPreuveFromModal = function (mesureId, preuveId) {
    if (!_getPreuve(preuveId))
        return;
    _ctReturnToMesureId = mesureId;
    _ctReturnToMesureFwId = null;
    if (window.ct_modal && typeof window.ct_modal.close === "function")
        window.ct_modal.close();
    _editingPreuve = preuveId;
    setTimeout(function () { _showPreuveModal(); }, 0);
};
// Create a new preuve inline, then hand off to the existing preuve
// edit modal so the user can fill in label / URL / dates / comment.
// On close/delete of the preuve modal, the unified measure modal is
// reopened automatically (see _closePreuveModal + _deletePreuveModal).
window._createAndLinkPreuveInModal = function (mesureId) {
    var m = _getMesure(mesureId);
    if (!m)
        return;
    _saveState();
    var id = _genPreuveId();
    var newPreuve = { id: id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" };
    D.preuves.push(newPreuve);
    _persistCreate("proof", newPreuve);
    if (!m.preuves_ids)
        m.preuves_ids = [];
    m.preuves_ids.push(id);
    _persist("measure", m.id, { preuves_ids: m.preuves_ids });
    // Close the unified modal, remember we need to come back,
    // then open the legacy preuve edit overlay for full field editing.
    _ctReturnToMesureId = mesureId;
    _ctReturnToMesureFwId = null; // cross-fw when reopened
    if (window.ct_modal && typeof window.ct_modal.close === "function")
        window.ct_modal.close();
    _editingPreuve = id;
    _showPreuveModal();
};
window._bulkComplianceMesuresDone = function (scope) {
    var ids = Array.from(window.ct_bulkbar.getSelection(scope));
    if (!ids.length)
        return;
    _saveState();
    var count = 0;
    D.mesures.forEach(function (m) {
        if (ids.indexOf(m.id) >= 0) {
            m.statut = "Terminé";
            _persist("measure", m.id, { statut: "Terminé" });
            count++;
        }
    });
    window.ct_bulkbar.clear(scope);
    renderAll();
    showStatus(count + " mesure(s) marquée(s) terminée(s)");
};
window._bulkComplianceMesuresDelete = function (scope) {
    var ids = Array.from(window.ct_bulkbar.getSelection(scope));
    if (!ids.length)
        return;
    _saveState();
    // Remove from exigence links first
    for (const fwId of D.referentiels_actifs) {
        _getExigences(fwId).forEach(function (e) {
            if (!e.mesures_ids)
                return;
            var before = e.mesures_ids.length;
            e.mesures_ids = e.mesures_ids.filter(function (mid) { return ids.indexOf(mid) < 0; });
            if (e.mesures_ids.length !== before)
                _persist("control", e.id, { mesures_ids: e.mesures_ids });
        });
    }
    // Remove measures themselves
    ids.forEach(function (mid) { _persistDelete && _persistDelete("measure", mid); });
    D.mesures = D.mesures.filter(function (m) { return ids.indexOf(m.id) < 0; });
    window.ct_bulkbar.clear(scope);
    renderAll();
    showStatus(ids.length + " mesure(s) supprimée(s)");
};
function _filterMesures(fwId, val) {
    _mesureFilter = val;
    _renderFwView(fwId, "mesures");
}
function _findExigencesForMesure(mesureId) {
    const result = [];
    const multipleFws = D.referentiels_actifs.length > 1;
    for (const fwId of D.referentiels_actifs) {
        const exigences = _getExigences(fwId);
        const meta = _getAllFrameworks()[fwId];
        const prefix = multipleFws && meta ? meta.label + " " : "";
        exigences.forEach(e => {
            if ((e.mesures_ids || []).includes(mesureId))
                result.push(prefix + (e.ref || ""));
        });
    }
    return result;
}
function _findFwsForMesure(mesureId) {
    const fws = new Set();
    for (const fwId of D.referentiels_actifs) {
        const exigences = _getExigences(fwId);
        exigences.forEach(e => {
            if ((e.mesures_ids || []).includes(mesureId))
                fws.add(fwId);
        });
    }
    return Array.from(fws).map(id => {
        const meta = _getAllFrameworks()[id];
        return meta ? meta.label : id;
    });
}
// ── Measure creation: API-driven ──────────────────────────────
// The form is rendered as a standalone draft. On "Valider", we POST
// to the API. The server generates the ID. On success, we reload
// D.mesures from the response. No client-side ID generation, no
// pollution of D.mesures before the user validates.
var _draftMesure = null;
var _draftMesureFwId = null;
var _draftMesureLinkIdx = null;
function _discardDraft() {
    _draftMesure = null;
    _draftMesureFwId = null;
    _draftMesureLinkIdx = null;
    _editingMesure = null;
}
function _commitDraft() {
    if (!_draftMesure)
        return;
    var draft = _draftMesure;
    var fwId = _draftMesureFwId;
    var linkIdx = _draftMesureLinkIdx;
    _discardDraft();
    var id = _genMesureId();
    var payload = Object.assign({ id: id }, draft);
    var _afterCreate = function (created) {
        D.mesures.push(created);
        if (linkIdx !== null && fwId) {
            var entry = _getExigEntry(fwId, linkIdx);
            if (entry) {
                if (!entry.mesures_ids)
                    entry.mesures_ids = [];
                entry.mesures_ids.push(created.id);
                _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
            }
        }
        _discardDraft();
        _editingMesure = created.id;
        showStatus(t("comp.status.mesure_created") || "Mesure creee : " + created.id);
        _showMesureModal();
    };
    if (window.ComplianceAPI && typeof window._getActiveProjectId === "function") {
        window.ComplianceAPI.createMeasure(window._getActiveProjectId(), payload).then(_afterCreate)
            .catch(function (e) { showStatus("Erreur creation : " + (e.message || e), true); });
    }
    else {
        _afterCreate(payload);
        _autoSave();
    }
}
window._validateDraftMesure = function () {
    _commitDraft();
};
window._cancelDraftMesure = function () {
    _discardDraft();
    _closeMesureModal();
};
// ── Measure modal (shared between referential view + plan d'action) ──
function _showMesureModal() {
    var existing = document.getElementById("mesure-modal-overlay");
    if (existing)
        existing.remove();
    var isDraft = (_editingMesure === "__draft__");
    const m = isDraft ? _draftMesure : _getMesure(_editingMesure);
    if (!m)
        return;
    var mid = isDraft ? "__draft__" : m.id;
    var ov = document.createElement("div");
    ov.id = "mesure-modal-overlay";
    ov.style.cssText = "position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;padding:24px";
    var h = '<div style="background:var(--ct-surface);border-radius:var(--ct-r-xl);padding:var(--ct-s6);max-width:620px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)">';
    // Header
    h += '<div class="ct-flex ct-gap-2 ct-items-center ct-mb-4">';
    h += '<strong class="ct-flex-1 ct-text-body">' + (isDraft ? esc(t("comp.mes.new_draft")) : esc(mid)) + '</strong>';
    if (isDraft) {
        h += '<button class="ct-btn mt-8" data-write data-variant="primary" data-size="sm" data-click="_cancelDraftMesure">' + esc(t("comp.mes.btn_annuler")) + '</button>';
        h += '<button class="ct-btn mt-8" data-write data-variant="primary" data-size="sm" data-click="_validateDraftMesure">' + esc(t("comp.mes.btn_valider")) + '</button>';
    }
    else {
        h += '<button class="ct-btn mt-8 ct-kpi-tone" data-write data-variant="primary" data-size="sm" data-click="_deleteMesureModal" data-args=\'' + _da(mid) + '\'>' + esc(t("comp.mes.btn_supprimer")) + '</button>';
        h += '<button class="ct-btn mt-8" data-write data-variant="primary" data-size="sm" data-click="_closeMesureModal">' + esc(t("comp.mes.btn_valider")) + '</button>';
    }
    h += '</div>';
    // Fields
    h += '<textarea rows="2" class="w-full mb-4" placeholder="' + esc(t("comp.mes.placeholder_desc")) + '" data-change="_updateMesure" data-args=\'' + _da(mid, "description") + '\' data-pass-value data-input="_autoHeight" data-pass-el>' + esc(m.description || "") + '</textarea>';
    h += '<textarea rows="2" class="w-full mb-8 fs-sm ct-muted" placeholder="' + esc(t("comp.mes.placeholder_details")) + '" data-change="_updateMesure" data-args=\'' + _da(mid, "details") + '\' data-pass-value data-input="_autoHeight" data-pass-el>' + esc(m.details || "") + '</textarea>';
    h += '<div class="ct-flex ct-gap-2 ct-row-wrap ct-mb-3">';
    h += '<label class="fs-xs">' + esc(t("comp.mes.label_statut"));
    h += '<select data-change="_updateMesure" data-args=\'' + _da(mid, "statut") + '\' data-pass-value><option value="">—</option>';
    ["planifie", "en_cours", "termine"].forEach(function (s) { h += '<option value="' + s + '"' + (m.statut === s ? " selected" : "") + '>' + _statutLabel(s) + '</option>'; });
    h += '</select></label>';
    h += '<label class="fs-xs">' + esc(t("comp.mes.label_echeance")) + ' <input type="date" value="' + esc(m.date_cible || "") + '" data-change="_updateMesure" data-args=\'' + _da(mid, "date_cible") + '\' data-pass-value /></label>';
    h += '<label class="fs-xs">' + esc(t("comp.mes.label_responsable")) + ' ' + _dirPicker(m.responsable || "", "_updateMesure", _da(mid, "responsable")) + '</label>';
    h += '<label class="fs-xs">' + esc(t("comp.mes.label_recurrence"));
    h += '<select data-change="_updateMesure" data-args=\'' + _da(mid, "recurrence") + '\' data-pass-value><option value="">—</option>';
    ["ponctuel", "mensuelle", "trimestrielle", "semestrielle", "annuelle"].forEach(function (r) { h += '<option value="' + r + '"' + (m.recurrence === r ? " selected" : "") + '>' + _recLabel(r) + '</option>'; });
    h += '</select></label>';
    h += '<label class="fs-xs">' + esc(t("comp.mes.label_dernier_controle")) + ' <input type="date" value="' + esc(m.dernier_controle || "") + '" data-change="_updateMesure" data-args=\'' + _da(mid, "dernier_controle") + '\' data-pass-value /></label>';
    h += '</div>';
    // Linked exigences + preuves (only for saved measures)
    if (!isDraft) {
        h += '<div class="fs-xs fw-600 mb-8">' + esc(t("comp.mes.exigences_liees")) + '</div>';
        h += _renderLinkedExigences(mid, _draftMesureFwId || null);
        h += '<div class="fs-xs fw-600 mb-8 mt-8">' + esc(t("comp.mes.preuves_liees")) + '</div>';
        (m.preuves_ids || []).forEach(function (pid) {
            var p = _getPreuve(pid);
            if (p)
                h += '<div class="linked-tag"><span class="ct-clickable" data-click="_goEditPreuveFromMesure" data-args=\'' + _da(_draftMesureFwId || "", mid, pid) + '\'>' + esc(p.id) + ' ' + esc(p.label) + '</span><span class="tag-x" data-click="_unlinkPreuve" data-args=\'' + _da(mid, pid, _draftMesureFwId || "") + '\' data-stop>&times;</span></div>';
        });
        h += _searchSelect(t("comp.mes.lier_preuve"), D.preuves.filter(function (p) { return !(m.preuves_ids || []).includes(p.id); }).map(function (p) { return { value: p.id, label: p.id + " " + p.label }; }), "_linkExistingPreuve", [mid, _draftMesureFwId || ""]);
        h += '<button class="ct-btn mt-8 ct-ml-1" data-write data-variant="primary" data-size="sm" data-click="_createAndLinkPreuve" data-args=\'' + _da(mid, _draftMesureFwId || "") + '\'>' + esc(t("comp.mes.btn_nouvelle_preuve")) + '</button>';
    }
    else {
        h += '<div class="fs-xs text-muted mt-8">Validez pour pouvoir lier des exigences et preuves.</div>';
    }
    h += '</div>';
    ov.innerHTML = h;
    ov.addEventListener("click", function (e) { if (e.target === ov)
        _closeMesureModal(); });
    document.body.appendChild(ov);
    // Auto-size textareas to fit their content on open
    ov.querySelectorAll("textarea").forEach(function (ta) { _autoHeight(ta); });
}
function _closeMesureModal() {
    _editingMesure = null;
    var ov = document.getElementById("mesure-modal-overlay");
    if (ov)
        ov.remove();
    _autoSave();
    // Refresh whichever view is active
    if (_currentPanel === "plan")
        renderPlan();
    else if (_currentPanel.startsWith("fw:"))
        _renderFwView(_currentFw, _currentSubview);
}
window._closeMesureModal = _closeMesureModal;
window._deleteMesureModal = function (mesureId) {
    if (!confirm(t("comp.confirm.delete_mesure", { id: mesureId })))
        return;
    _saveState();
    D.mesures = D.mesures.filter(function (m) { return m.id !== mesureId; });
    for (var fwId in (D.referentiels || {})) {
        var fw = D.referentiels[fwId];
        if (Array.isArray(fw))
            fw.forEach(function (e) { if (e.mesures_ids)
                e.mesures_ids = e.mesures_ids.filter(function (id) { return id !== mesureId; }); });
    }
    _closeMesureModal();
    _persistDelete("measure", mesureId);
};
function _editMesure(fwId, mesureId) {
    if (_draftMesure)
        _discardDraft();
    _editingMesure = mesureId;
    _draftMesureFwId = fwId;
    _mesureEditReturnTo = null;
    _showMesureModal();
    var card = document.querySelector(".measure-card.editing");
    if (card)
        card.scrollIntoView({ behavior: "smooth", block: "start" });
}
function _goEditMesure(fwId, mesureId) {
    window._editMesureRow({ id: mesureId, __fwId: fwId });
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
        h += `<div class="linked-tag">${esc(l.fwLabel)} — ${esc(l.ref)}<span class="tag-x" data-click="_unlinkMesureFromEdit" data-args='${_da(mesureId, l.fwId, l.idx, currentFwId)}' data-stop>×</span></div>`;
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
                exigOpts.push({ value: fwId + ":" + i, label: fwLabel + " — " + ref + " " + (_rt(e, "mesure") || "").substring(0, 40) });
            }
        });
    }
    h += _searchSelect(t("comp.mes.lier_exigence"), exigOpts, "_linkMesureToExig", [mesureId, currentFwId]);
    return h;
}
window._linkMesureToExig = function (mesureId, currentFwId, val) {
    if (!val)
        return;
    _saveState();
    const [fwId, idxStr] = val.split(":");
    const idx = parseInt(idxStr);
    const entry = _getExigEntry(fwId, idx);
    if (!entry.mesures_ids)
        entry.mesures_ids = [];
    if (!entry.mesures_ids.includes(mesureId))
        entry.mesures_ids.push(mesureId);
    _editingMesure = mesureId;
    if (currentFwId && _currentPanel.startsWith("fw:")) {
        _renderFwView(currentFwId, "mesures");
    }
    else {
        renderPlan();
    }
    _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
};
window._unlinkMesureFromEdit = function (mesureId, fwId, idx, currentFwId) {
    _saveState();
    const entry = _getExigEntry(fwId, idx);
    entry.mesures_ids = (entry.mesures_ids || []).filter(id => id !== mesureId);
    // Garder l'édition ouverte et re-rendre
    _editingMesure = mesureId;
    if (currentFwId && _currentPanel.startsWith("fw:")) {
        _renderFwView(currentFwId, "mesures");
    }
    else {
        renderPlan();
    }
    _persist("control", entry.id, { mesures_ids: entry.mesures_ids });
};
function _updateMesure(mesureId, field, val) {
    if (mesureId === "__draft__" && _draftMesure) {
        _draftMesure[field] = val;
        return;
    }
    const m = _getMesure(mesureId);
    if (m) {
        m[field] = val;
        _persist("measure", m.id, _obj(field, val));
    }
}
function _deleteMesure(mesureId, fwId) {
    if (!confirm(t("comp.confirm.delete_mesure", { id: mesureId })))
        return;
    _saveState();
    D.mesures = D.mesures.filter(m => m.id !== mesureId);
    // Retirer des exigences de tous les référentiels
    const cleanup = (items) => items.forEach(e => { if (e.mesures_ids)
        e.mesures_ids = e.mesures_ids.filter(id => id !== mesureId); });
    for (const fw of Object.values(D.referentiels || {})) {
        if (Array.isArray(fw))
            cleanup(fw);
    }
    _editingMesure = null;
    _renderFwView(fwId, "mesures");
    _persistDelete("measure", mesureId);
}
window._linkExistingPreuve = function (mesureId, fwId, preuveId) {
    if (!preuveId)
        return;
    _saveState();
    const m = _getMesure(mesureId);
    if (m) {
        if (!m.preuves_ids)
            m.preuves_ids = [];
        if (!m.preuves_ids.includes(preuveId))
            m.preuves_ids.push(preuveId);
    }
    _renderFwView(fwId, "mesures");
    if (m)
        _persist("measure", m.id, { preuves_ids: m.preuves_ids });
};
window._unlinkPreuve = function (mesureId, preuveId, fwId) {
    _saveState();
    const m = _getMesure(mesureId);
    if (m) {
        m.preuves_ids = (m.preuves_ids || []).filter(id => id !== preuveId);
        _persist("measure", m.id, { preuves_ids: m.preuves_ids });
    }
    _renderFwView(fwId, "mesures");
};
window._createAndLinkPreuve = function (mesureId, fwId) {
    _saveState();
    var id = _genPreuveId();
    var newPreuve = { id: id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" };
    D.preuves.push(newPreuve);
    var m = _getMesure(mesureId);
    if (m) {
        if (!m.preuves_ids)
            m.preuves_ids = [];
        m.preuves_ids.push(id);
    }
    _persistCreate("proof", newPreuve);
    if (m)
        _persist("measure", m.id, { preuves_ids: m.preuves_ids });
    // Close measure modal, open proof modal, remember to return
    var mesureOv = document.getElementById("mesure-modal-overlay");
    if (mesureOv)
        mesureOv.remove();
    _editingPreuve = id;
    _returnToMesureId = mesureId;
    _showPreuveModal();
    showStatus(t("comp.status.preuve_created") || "Preuve creee : " + id);
};
// ── Preuves (par référentiel) ─────────────────────────────────────
let _editingPreuve = null;
let _preuveEditReturnTo = null;
let _preuveFilter = "";
function _renderFwPreuves(fwId, label) {
    const fwPreuveIds = new Set();
    _getMesuresForFw(fwId).forEach(m => (m.preuves_ids || []).forEach(id => fwPreuveIds.add(id)));
    const filter = _preuveFilter.toLowerCase();
    const preuves = D.preuves.filter(p => {
        if (!filter)
            return true;
        return (p.id + " " + (p.label || "") + " " + (p.url || "") + " " + (p.commentaire || "")).toLowerCase().includes(filter);
    });
    // (utilise _findMesuresForPreuve définie au top-level)
    let h = `<h2 class="ct-ink ct-mb-4">${t("comp.prv.title", { label: esc(label) })}</h2>`;
    h += `<div class="ct-flex ct-gap-2 ct-items-center ct-mb-3">
        <button class="ct-btn mt-8" data-write data-variant="primary" data-size="xs" data-click="_addPreuveGlobal" data-args='${_da(fwId)}'>${t("comp.prv.btn_nouvelle")}</button>
        <input type="text" placeholder="${t("comp.prv.search")}" value="${esc(_preuveFilter)}" class="ct-flex-1 ct-maxw-300" data-input="_filterPreuves" data-args='${_da(fwId)}' data-pass-value />
        <span class="fs-xs text-muted">${t("comp.prv.count", { count: preuves.length })}</span>
    </div>`;
    // Tableau — ct_table with bulk-select (checkbox column tied to ct_bulkbar).
    const scope = "compliance-preuves-" + fwId;
    if (preuves.length > 0 && window.ct_table) {
        const rows = preuves.map(p => Object.assign({}, p, {
            __isFw: fwPreuveIds.has(p.id),
            __linked: _findMesuresForPreuve(p.id),
            __dst: ctDateStatus(p.date_expiration || "", 90),
            __fwId: fwId,
        }));
        h += window.ct_table.render({
            rows: rows,
            rowKey: "id",
            onRowClick: "_editPreuveRow",
            bulk: { scope: scope },
            columns: [
                { key: "id", label: t("comp.prv.col_id"), width: "70px",
                    render: (p) => '<span class="fw-600">' + esc(p.id) + '</span>' },
                { key: "label", label: t("comp.prv.col_label"),
                    render: (p) => esc(p.label || "—") },
                { key: "url", label: t("comp.prv.col_url"),
                    render: (p) => p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer" data-stop>' + esc(String(p.url).substring(0, 40)) + '</a>' : "—" },
                { key: "date_obtention", label: t("comp.prv.col_obtention"), width: "100px",
                    render: (p) => esc(p.date_obtention || "—") },
                { key: "date_expiration", label: t("comp.prv.col_expiration"), width: "100px",
                    render: (p) => esc(p.date_expiration || "—") },
                { key: "mesures", label: t("comp.prv.col_mesures"), width: "100px",
                    render: (p) => '<span class="fs-xs">' + esc((p.__linked || []).join(", ") || "—") + '</span>' },
                { key: "statut", label: t("comp.prv.col_statut"), width: "80px",
                    render: (p) => p.__dst === "expired" ? badgeTone(t("comp.prv.expiree"), "critical")
                        : p.__dst === "soon" ? badgeTone(t("comp.prv.bientot"), "high")
                            : p.__dst === "valid" ? badgeTone(t("comp.prv.ok"), "low") : "—" }
            ]
        });
    }
    document.getElementById("fw-desc").textContent = t("comp.prv.fw_desc", { label: label });
    document.getElementById("fw-content").innerHTML = h;
    if (preuves.length > 0 && window.ct_bulkbar) {
        setTimeout(function () {
            window.ct_bulkbar.attach({
                scope: scope,
                label: "{n} preuve(s) sélectionnée(s)",
                actions: [
                    { id: "delete", icon: "trash", label: t("comp.prv.btn_supprimer") || "Supprimer", danger: true,
                        onClick: "_bulkCompliancePreuvesDelete", data: { fwId: fwId },
                        confirm: { title: "Supprimer {n} preuve(s) ?", message: "Cette action est irréversible." } }
                ]
            });
            window.ct_bulkbar.update(scope);
        }, 0);
    }
}
window._editPreuveRow = function (row) {
    if (!row || !row.id)
        return;
    _editPreuve(row.__fwId || _currentFw || "", row.id);
};
window._bulkCompliancePreuvesDelete = function (scope) {
    var ids = Array.from(window.ct_bulkbar.getSelection(scope));
    if (!ids.length)
        return;
    _saveState();
    D.mesures.forEach(function (m) {
        if (m.preuves_ids) {
            var before = m.preuves_ids.length;
            m.preuves_ids = m.preuves_ids.filter(function (pid) { return ids.indexOf(pid) < 0; });
            if (m.preuves_ids.length !== before)
                _persist("measure", m.id, { preuves_ids: m.preuves_ids });
        }
    });
    ids.forEach(function (pid) { _persistDelete && _persistDelete("proof", pid); });
    D.preuves = D.preuves.filter(function (p) { return ids.indexOf(p.id) < 0; });
    window.ct_bulkbar.clear(scope);
    if (_currentFw)
        _renderFwView(_currentFw, _currentSubview);
};
function _filterPreuves(fwId, val) {
    _preuveFilter = val;
    _renderFwView(fwId, "preuves");
}
function _addPreuveGlobal(fwId) {
    _saveState();
    const id = _genPreuveId();
    const newPreuve = { id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" };
    D.preuves.push(newPreuve);
    _editingPreuve = id;
    _renderFwView(fwId, "preuves");
    _persistCreate("proof", newPreuve);
    // Every other creation path opens the edit modal right away — this one
    // left the user to find and click the new empty row.
    _showPreuveModal();
}
function _editPreuve(fwId, preuveId) {
    _editingPreuve = preuveId;
    _returnToMesureId = null;
    _showPreuveModal();
}
let _returnToMesureId = null;
window._goEditPreuveFromMesure = function (fwId, mesureId, preuveId) {
    // Close the measure modal, open the proof modal, remember to return
    var mesureOv = document.getElementById("mesure-modal-overlay");
    if (mesureOv)
        mesureOv.remove();
    _editingPreuve = preuveId;
    _returnToMesureId = mesureId;
    _showPreuveModal();
};
// ── Preuve modal ──────────────────────────────────────────────
function _showPreuveModal() {
    var existing = document.getElementById("preuve-modal-overlay");
    if (existing)
        existing.remove();
    var p = _getPreuve(_editingPreuve);
    if (!p)
        return;
    var ov = document.createElement("div");
    ov.id = "preuve-modal-overlay";
    ov.style.cssText = "position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;padding:24px";
    // Layout aligné sur ct_measure_modal : titre en tête, champs en lignes
    // labellisées pleine largeur (grille 2 col. pour type/responsable et les
    // dates), boutons dans un pied de modale unique aligné à droite.
    var _row = function (label, inner) {
        return '<label class="ct-flex ct-col ct-gap-1 ct-text-meta">' + esc(label) + inner + '</label>';
    };
    var _pkind = p.kind || "link";
    var h = '<div style="background:var(--ct-surface);border-radius:var(--ct-r-xl);padding:var(--ct-s6);max-width:560px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)">';
    h += '<div class="ct-mb-4"><strong class="ct-text-body">' + esc(p.id) + '</strong></div>';
    h += '<div class="ct-flex ct-col ct-gap-2">';
    h += _row(t("comp.prv.placeholder_label"), '<input type="text" class="ct-w-full" value="' + esc(p.label || "") + '" data-change="_updatePreuveField" data-args=\'' + _da(p.id, "label") + '\' data-pass-value />');
    h += _row(t("comp.prv.placeholder_url"), '<input type="text" class="ct-w-full" value="' + esc(p.url || "") + '" data-change="_updatePreuveField" data-args=\'' + _da(p.id, "url") + '\' data-pass-value />');
    h += '<div class="ct-grid ct-grid-2 ct-gap-3">';
    h += _row(t("comp.prv.label_kind"), '<select class="ct-w-full" data-change="_updatePreuveField" data-args=\'' + _da(p.id, "kind") + '\' data-pass-value>'
        + ["link", "file", "observation"].map(function (k) { return '<option value="' + k + '"' + (_pkind === k ? " selected" : "") + '>' + esc(t("comp.prv.kind." + k)) + '</option>'; }).join("")
        + '</select>');
    h += _row(t("comp.prv.label_owner"), '<span id="preuve-owner-slot" class="ct-w-full" style="display:block"></span>');
    h += '</div>';
    h += '<div class="ct-grid ct-grid-2 ct-gap-3">';
    h += _row(t("comp.prv.label_obtention"), '<input type="date" class="ct-w-full" value="' + esc(p.date_obtention || "") + '" data-change="_updatePreuveField" data-args=\'' + _da(p.id, "date_obtention") + '\' data-pass-value />');
    h += _row(t("comp.prv.label_expiration"), '<input type="date" class="ct-w-full" value="' + esc(p.date_expiration || "") + '" data-change="_updatePreuveField" data-args=\'' + _da(p.id, "date_expiration") + '\' data-pass-value />');
    h += '</div>';
    h += _row(t("comp.prv.placeholder_comment"), '<textarea rows="2" class="ct-w-full" data-change="_updatePreuveField" data-args=\'' + _da(p.id, "commentaire") + '\' data-pass-value data-input="_autoHeight" data-pass-el>' + esc(p.commentaire || "") + '</textarea>');
    h += '</div>';
    h += '<div class="fs-xs fw-600 ct-mt-3 ct-mb-1">' + esc(t("comp.prv.mesures_liees")) + '</div>';
    var linked = _findMesuresForPreuve(p.id);
    h += linked.length ? linked.map(function (mid) { return '<span class="linked-tag">' + esc(mid) + '</span>'; }).join("") : '<span class="text-muted fs-xs">' + esc(t("comp.prv.aucune")) + '</span>';
    h += '<div class="ct-flex ct-gap-2 ct-mt-4" style="justify-content:flex-end;border-top:1px solid var(--ct-line);padding-top:var(--ct-s3)">';
    h += '<button class="ct-btn" data-write data-variant="danger" data-size="sm" data-click="_deletePreuveModal" data-args=\'' + _da(p.id) + '\'>' + esc(t("comp.prv.btn_supprimer")) + '</button>';
    h += '<button class="ct-btn" data-write data-variant="primary" data-size="sm" data-click="_closePreuveModal">' + esc(t("comp.prv.btn_valider")) + '</button>';
    h += '</div>';
    h += '</div>';
    ov.innerHTML = h;
    ov.addEventListener("click", function (e) { if (e.target === ov)
        window._closePreuveModal(); });
    document.body.appendChild(ov);
    ov.querySelectorAll("textarea").forEach(function (ta) { _autoHeight(ta); });
    // Responsable — shared ct_userpicker directory search (like measures/persons).
    // Value is read back on modal close (see _closePreuveModal) to cover both a
    // dropdown pick AND free text — onChange alone only fires on a pick.
    var _up = window.ct_userpicker;
    if (_up && _up.mount) {
        _up.mount({
            slotId: "preuve-owner-slot", pickerId: "preuve-owner",
            value: String(p.owner || ""),
            placeholder: "Rechercher...",
            directoryUrl: "api/directory", sourceUrl: null,
        });
    }
}
window._closePreuveModal = function () {
    // Capture the Responsable from the directory picker (pick or free text)
    // before tearing the modal down — persists via _updatePreuveField.
    var _up = window.ct_userpicker;
    if (_editingPreuve && _up && _up.getValue) {
        try {
            var _ownerVal = _up.getValue("preuve-owner");
            if (_ownerVal !== undefined && _ownerVal !== null) {
                _updatePreuveField(_editingPreuve, "owner", String(_ownerVal));
            }
        }
        catch (e) { /* never block the modal close on a picker read */ }
    }
    _editingPreuve = null;
    var ov = document.getElementById("preuve-modal-overlay");
    if (ov)
        ov.remove();
    _autoSave();
    // Prefer reopening the unified ct_measure_modal when we came from it.
    if (_ctReturnToMesureId) {
        var mid = _ctReturnToMesureId;
        var fwId = _ctReturnToMesureFwId;
        _ctReturnToMesureId = null;
        _ctReturnToMesureFwId = null;
        // Defer so this overlay is fully torn down before ct_modal reopens.
        setTimeout(function () { window._editMesureRow({ id: mid, __fwId: fwId }); }, 0);
        return;
    }
    // Legacy path: reopen the old measure modal
    if (_returnToMesureId) {
        _editingMesure = _returnToMesureId;
        _returnToMesureId = null;
        _showMesureModal();
        return;
    }
    // Edited from the proofs list — refresh so edits (dates, status…) show.
    if (_currentFw)
        _renderFwView(_currentFw, _currentSubview);
};
window._deletePreuveModal = function (preuveId) {
    if (!confirm(t("comp.confirm.delete_preuve", { id: preuveId })))
        return;
    _saveState();
    D.preuves = D.preuves.filter(function (p) { return p.id !== preuveId; });
    D.mesures.forEach(function (m) { if (m.preuves_ids)
        m.preuves_ids = m.preuves_ids.filter(function (id) { return id !== preuveId; }); });
    _editingPreuve = null;
    var ov = document.getElementById("preuve-modal-overlay");
    if (ov)
        ov.remove();
    _persistDelete("proof", preuveId);
    if (_ctReturnToMesureId) {
        var mid = _ctReturnToMesureId;
        var fwId = _ctReturnToMesureFwId;
        _ctReturnToMesureId = null;
        _ctReturnToMesureFwId = null;
        setTimeout(function () { window._editMesureRow({ id: mid, __fwId: fwId }); }, 0);
        return;
    }
    if (_returnToMesureId) {
        _editingMesure = _returnToMesureId;
        _returnToMesureId = null;
        _showMesureModal();
        return;
    }
    // Deleted from the proofs list — refresh it (was left stale before).
    if (_currentFw)
        _renderFwView(_currentFw, _currentSubview);
};
function _updatePreuveField(preuveId, field, val) {
    const p = _getPreuve(preuveId);
    if (p) {
        p[field] = val;
        _persist("proof", p.id, _obj(field, val));
    }
}
// ── Plan d'action global ──────────────────────────────────────────
let _planFilter = "";
function renderPlan() {
    const filter = _planFilter.toLowerCase();
    const mesures = D.mesures.filter(m => {
        if (!filter)
            return true;
        return (m.id + " " + (m.description || "") + " " + (m.responsable || "")).toLowerCase().includes(filter);
    });
    let h = `<div class="ct-flex ct-gap-2 ct-items-center ct-mb-3">
        <button class="ct-btn mt-8" data-write data-variant="primary" data-size="xs" data-click="_addMesurePlan">${t("comp.plan.btn_nouvelle")}</button>
        <button class="ct-btn mt-8" data-write data-variant="primary" data-size="xs" data-click="_refreshMeasures" title="Rafraîchir">&#x21bb;</button>
        <input type="text" placeholder="${t("comp.plan.search")}" value="${esc(_planFilter)}" class="ct-flex-1 ct-maxw-300" data-input="_filterPlan" data-pass-value />
        <span class="fs-xs text-muted">${t("comp.plan.count", { count: mesures.length })}</span>
    </div>`;
    const scope = "compliance-plan";
    if (mesures.length === 0) {
        h += '<div class="synth-card"><p class="text-muted">' + t("comp.plan.aucune") + '</p></div>';
    }
    else if (window.ct_table) {
        const rows = mesures.map(m => Object.assign({}, m, {
            __linkedExigs: _findExigencesForMesure(m.id),
            __linkedFws: _findFwsForMesure(m.id),
            __fwId: null // plan d'action is cross-framework
        }));
        h += window.ct_table.render({
            rows: rows,
            rowKey: "id",
            onRowClick: "_editMesureRow",
            bulk: { scope: scope },
            columns: [
                { key: "id", label: t("comp.mes.col_id"), width: "80px",
                    render: m => '<span class="fw-600">' + esc(m.id) + '</span>' },
                { key: "description", label: t("comp.mes.col_description"),
                    render: m => esc(m.description || "—") },
                { key: "statut", label: t("comp.mes.col_statut"), width: "100px",
                    render: m => _mesureBadge(m) },
                { key: "responsable", label: t("comp.mes.col_responsable"), width: "120px",
                    render: m => esc(m.responsable || "—") },
                { key: "date_cible", label: t("comp.mes.col_echeance"), width: "110px",
                    render: m => esc(m.date_cible || "—") },
                { key: "recurrence", label: t("comp.mes.col_recurrence"), width: "110px",
                    render: m => m.recurrence ? esc(_recLabel(m.recurrence)) : "—" },
                { key: "preuves", label: t("comp.mes.col_preuves"), width: "80px",
                    render: m => '<span class="ta-c">' + ((m.preuves_ids || []).length || "—") + '</span>' },
                { key: "exigences", label: t("comp.mes.col_exigences"),
                    render: m => '<span class="fs-xs">' + esc((m.__linkedExigs || []).join(", ") || "—") + '</span>' }
            ]
        });
    }
    document.getElementById("plan-content").innerHTML = h;
    if (mesures.length > 0 && window.ct_bulkbar) {
        setTimeout(function () {
            window.ct_bulkbar.attach({
                scope: scope,
                label: t("measure.selected_n") || "{n} mesure(s) sélectionnée(s)",
                actions: [
                    { id: "done", icon: "check", label: "Terminé", variant: "success",
                        onClick: "_bulkCompliancePlanDone" },
                    { id: "delete", icon: "trash", label: t("btn_delete") || "Supprimer", danger: true,
                        onClick: "_bulkCompliancePlanDelete",
                        confirm: { title: "Supprimer {n} mesure(s) ?", message: "Cette action est irréversible." } }
                ]
            });
            window.ct_bulkbar.update(scope);
        }, 0);
    }
}
window._bulkCompliancePlanDone = function (scope) {
    var ids = Array.from(window.ct_bulkbar.getSelection(scope));
    if (!ids.length)
        return;
    _saveState();
    var count = 0;
    D.mesures.forEach(function (m) {
        if (ids.indexOf(m.id) >= 0) {
            m.statut = "termine";
            _persist("measure", m.id, { statut: "termine" });
            count++;
        }
    });
    window.ct_bulkbar.clear(scope);
    renderPlan();
    showStatus(count + " mesure(s) marquée(s) terminée(s)");
};
window._bulkCompliancePlanDelete = function (scope) {
    var ids = Array.from(window.ct_bulkbar.getSelection(scope));
    if (!ids.length)
        return;
    _saveState();
    for (const fwId of D.referentiels_actifs) {
        _getExigences(fwId).forEach(function (e) {
            if (!e.mesures_ids)
                return;
            var before = e.mesures_ids.length;
            e.mesures_ids = e.mesures_ids.filter(function (mid) { return ids.indexOf(mid) < 0; });
            if (e.mesures_ids.length !== before)
                _persist("control", e.id, { mesures_ids: e.mesures_ids });
        });
    }
    ids.forEach(function (mid) { _persistDelete && _persistDelete("measure", mid); });
    D.mesures = D.mesures.filter(function (m) { return ids.indexOf(m.id) < 0; });
    window.ct_bulkbar.clear(scope);
    renderPlan();
    showStatus(ids.length + " mesure(s) supprimée(s)");
};
function _filterPlan(val) {
    _planFilter = val;
    renderPlan();
}
function _addMesurePlan() {
    window._createMesureUnified(null, null);
}
window._unlinkPreuvePlan = function (mesureId, preuveId) {
    _saveState();
    const m = _getMesure(mesureId);
    if (m) {
        m.preuves_ids = (m.preuves_ids || []).filter(id => id !== preuveId);
        _persist("measure", m.id, { preuves_ids: m.preuves_ids });
    }
    renderPlan();
};
window._linkExistingPreuvePlan = function (mesureId, preuveId) {
    if (!preuveId)
        return;
    _saveState();
    const m = _getMesure(mesureId);
    if (m) {
        if (!m.preuves_ids)
            m.preuves_ids = [];
        if (!m.preuves_ids.includes(preuveId))
            m.preuves_ids.push(preuveId);
    }
    renderPlan();
    if (m)
        _persist("measure", m.id, { preuves_ids: m.preuves_ids });
};
window._createAndLinkPreuvePlan = function (mesureId) {
    _saveState();
    const id = _genPreuveId();
    const newPreuve = { id, label: "", url: "", date_obtention: "", date_expiration: "", commentaire: "" };
    D.preuves.push(newPreuve);
    const m = _getMesure(mesureId);
    if (m) {
        if (!m.preuves_ids)
            m.preuves_ids = [];
        m.preuves_ids.push(id);
    }
    _editingPreuve = id;
    _preuveEditReturnTo = "plan";
    _returnToMesureId = mesureId;
    selectPanel("plan");
    renderPlan();
    _persistCreate("proof", newPreuve);
    if (m)
        _persist("measure", m.id, { preuves_ids: m.preuves_ids });
};
// ── Contrôles global ──────────────────────────────────────────────
function renderControles() {
    const today = new Date();
    let rows = [];
    // Contrôles récurrents sur les mesures
    D.mesures.forEach(m => {
        if (!m.recurrence || m.recurrence === "ponctuel")
            return;
        const jours = _recJours[m.recurrence] || 365;
        const dernier = m.dernier_controle ? new Date(m.dernier_controle) : null;
        const prochain = dernier ? new Date(dernier.getTime() + jours * 86400000) : null;
        const enRetard = prochain ? prochain < today : !!m.dernier_controle;
        rows.push({ type: "controle", id: m.id, label: m.description, recurrence: m.recurrence, dernier: m.dernier_controle, prochain, enRetard });
    });
    // Preuves expirant
    D.preuves.forEach(p => {
        if (!p.date_expiration)
            return;
        const exp = new Date(p.date_expiration);
        const expired = exp < today;
        const soonDays = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
        if (soonDays < 90) {
            rows.push({ type: "preuve", id: p.id, label: p.label, expiration: p.date_expiration, expired, soonDays });
        }
    });
    rows.sort((a, b) => Number(b.enRetard || b.expired || 0) - Number(a.enRetard || a.expired || 0));
    let h = "";
    if (rows.length === 0) {
        h = '<div class="synth-card"><p class="text-muted">' + t("comp.ctrl.aucun") + '</p></div>';
    }
    else {
        const retards = rows.filter(r => r.enRetard || r.expired).length;
        if (retards > 0)
            h += `<div class="ct-mb-3 ct-p-2 ct-r-sm" style="border:1px solid var(--ct-critical);background:var(--ct-critical-tint)"><p class="ct-text-critical ct-strong ct-m-0">${t("comp.ctrl.alertes", { count: retards })}</p></div>`;
        h += '<table id="ctrl-table"><thead><tr><th' + hd("type") + '>' + t("comp.ctrl.col_type") + '</th><th' + hd("cid") + '>' + t("comp.ctrl.col_id") + '</th><th' + hd("cdesc") + '>' + t("comp.ctrl.col_description") + '</th><th' + hd("det") + '>' + t("comp.ctrl.col_details") + '</th><th' + hd("csts") + '>' + t("comp.ctrl.col_statut") + '</th></tr></thead><tbody>';
        rows.forEach(r => {
            h += `<tr style="${(r.enRetard || r.expired) ? "background:var(--ct-critical-tint)" : ""}">`;
            h += `<td${hd("type")}>${r.type === "controle" ? t("comp.ctrl.type_controle") : t("comp.ctrl.type_preuve")}</td><td${hd("cid")} class="fw-600">${esc(r.id)}</td><td${hd("cdesc")}>${esc(r.label)}</td>`;
            if (r.type === "controle") {
                h += `<td${hd("det")}>${esc(_recLabel(r.recurrence))} — ${t("comp.ctrl.dernier")}: ${esc(r.dernier || t("comp.ctrl.jamais"))}</td>`;
                h += `<td${hd("csts")}>${r.enRetard ? _tBadge(t("comp.ctrl.en_retard"), "red") : _tBadge(t("comp.ctrl.ok"), "green")}</td>`;
            }
            else {
                h += `<td${hd("det")}>${t("comp.ctrl.expire")}: ${esc(r.expiration)}</td>`;
                h += `<td${hd("csts")}>${r.expired ? _tBadge(t("comp.prv.expiree"), "red") : _tBadge(t("comp.prv.bientot"), "orange")}</td>`;
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
// ═══════════════════════════════════════════════════════════════════════
// IMPORT EBIOS RM
// ═══════════════════════════════════════════════════════════════════════
function importEbiosRM() {
    document.getElementById("ebios-input").click();
}
function _doImportEbiosRM(event) {
    const file = event.target.files[0];
    if (!file)
        return;
    const reader = new FileReader();
    reader.onload = function () {
        try {
            const ebios = JSON.parse(new TextDecoder().decode(new Uint8Array(reader.result)));
            if (!ebios.context && !ebios.meta) {
                alert(t("comp.import.invalid"));
                return;
            }
            _saveState();
            // 1. Importer le contexte
            if (ebios.context) {
                D.meta.societe = ebios.context.societe || D.meta.societe;
                D.meta.date_evaluation = ebios.context.date || D.meta.date_evaluation;
                D.meta.commentaires = ebios.context.commentaires || D.meta.commentaires;
            }
            // 2. Importer les mesures de l'atelier 5 comme entités globales
            const mesureIdMap = {}; // ancien ID EBIOS → nouvel ID compliance
            if (Array.isArray(ebios.measures)) {
                ebios.measures.forEach((em) => {
                    // Éviter les doublons (même description nettoyée)
                    const cleanedDesc = _cleanDesc(em.description || "");
                    const existing = D.mesures.find(m => m.description === cleanedDesc);
                    if (existing) {
                        mesureIdMap[em.id] = existing.id;
                    }
                    else {
                        const newId = _genMesureId();
                        mesureIdMap[em.id] = newId;
                        // Convertir le statut EBIOS RM → compliance
                        let statut = "planifie";
                        if (em.statut === "Terminé")
                            statut = "termine";
                        else if (em.statut === "En cours")
                            statut = "en_cours";
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
                if (!mesuresPrevuesText)
                    return;
                if (!entry.mesures_ids)
                    entry.mesures_ids = [];
                // Format EBIOS RM : "MES-001 - Description, MES-002 - Description"
                const parts = mesuresPrevuesText.split(",").map(s => s.trim()).filter(Boolean);
                parts.forEach((part) => {
                    const idMatch = part.match(/^(MES-\d+)/);
                    if (idMatch && mesureIdMap[idMatch[1]]) {
                        // Mesure connue de l'atelier 5 : lier par son nouvel ID
                        const newId = mesureIdMap[idMatch[1]];
                        if (!entry.mesures_ids.includes(newId))
                            entry.mesures_ids.push(newId);
                    }
                    else {
                        // Pas d'ID reconnu : créer une mesure à partir du texte nettoyé
                        const desc = _cleanDesc(part);
                        if (!desc)
                            return;
                        const existing = D.mesures.find(m => m.description === desc);
                        if (existing) {
                            if (!entry.mesures_ids.includes(existing.id))
                                entry.mesures_ids.push(existing.id);
                        }
                        else {
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
                if (!D.referentiels_actifs.includes("anssi"))
                    D.referentiels_actifs.push("anssi");
                const anssiEntries = D.referentiels.anssi || [];
                ebios.socle_anssi.forEach((src, i) => {
                    if (i < anssiEntries.length) {
                        const dst = anssiEntries[i];
                        if (src.conformite !== "" && src.conformite !== null && src.conformite !== undefined)
                            dst.conformite = src.conformite;
                        if (src.ecart)
                            dst.ecart = src.ecart;
                        if (src.mesures_prevues)
                            dst.mesures_prevues = src.mesures_prevues;
                        _linkMesuresFromText(dst, src.mesures_prevues);
                    }
                });
            }
            // 4. Importer socle ISO (EBIOS RM uses old format with socle_iso)
            if (Array.isArray(ebios.socle_iso) && ebios.socle_iso.length > 0) {
                if (!D.referentiels_actifs.includes("iso"))
                    D.referentiels_actifs.push("iso");
                const isoEntries = D.referentiels.iso || [];
                ebios.socle_iso.forEach((src, i) => {
                    if (i < isoEntries.length) {
                        const dst = isoEntries[i];
                        if (src.conformite !== "" && src.conformite !== null && src.conformite !== undefined)
                            dst.conformite = src.conformite;
                        if (src.ecart)
                            dst.ecart = src.ecart;
                        if (src.mesures_prevues)
                            dst.mesures_prevues = src.mesures_prevues;
                        if (src.applicable !== undefined)
                            dst.applicable = src.applicable;
                        _linkMesuresFromText(dst, src.mesures_prevues);
                    }
                });
            }
            // 5. Importer référentiels complémentaires (EBIOS RM uses old format with socle_complementaires)
            if (ebios.socle_complementaires && typeof ebios.socle_complementaires === "object") {
                for (const [fwId, fwData] of Object.entries(ebios.socle_complementaires)) {
                    if (!D.referentiels_actifs.includes(fwId))
                        D.referentiels_actifs.push(fwId);
                    // Find or create entries in D.referentiels[fwId]
                    if (!D.referentiels[fwId])
                        D.referentiels[fwId] = [];
                    for (const [ref, entry] of Object.entries(fwData)) {
                        let dst = D.referentiels[fwId].find(e => e.ref === ref);
                        if (!dst) {
                            dst = { ref, theme: "", mesure: "", applicable: "", conformite: "", ecart: "", mesures_prevues: "", mesures_ids: [] };
                            D.referentiels[fwId].push(dst);
                        }
                        if (entry.conformite !== "" && entry.conformite !== null && entry.conformite !== undefined)
                            dst.conformite = entry.conformite;
                        if (entry.ecart)
                            dst.ecart = entry.ecart;
                        if (entry.mesures_prevues)
                            dst.mesures_prevues = entry.mesures_prevues;
                        _linkMesuresFromText(dst, entry.mesures_prevues);
                    }
                }
            }
            const nbMesures = D.mesures.length;
            _initDataAndRender(function () {
                _autoSave();
                showStatus(t("comp.import.success", { name: file.name, count: nbMesures }));
            });
        }
        catch (err) {
            alert(t("comp.import.error", { msg: err.message }));
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
    }
    else {
        _initDataAndRender();
    }
}
catch (e) {
    console.error("Erreur au rendu initial:", e);
    document.querySelector(".container").innerHTML = '<section><h2>' + t("comp.error.title") + '</h2><pre>' + esc(e.message) + '\n' + esc(e.stack || "") + '</pre></section>';
}
// AI module config (read by ai_common.js)
window.AI_APP_CONFIG = {
    storagePrefix: "compliance",
    settingsExtraHTML: function () { return typeof _demoSettingsHTML === "function" ? _demoSettingsHTML() : ""; },
    onSettingsRendered: function () { if (typeof _wireDemoSettings === "function")
        _wireDemoSettings(); }
};
