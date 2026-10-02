# Compliance Module -- Architecture

## 1. Overview

Multi-framework compliance tracking tool for CISOs and security teams. Enables organizations to assess their compliance posture across multiple security frameworks simultaneously, track remediation measures, manage evidence, and monitor recurring controls.

- **URL**: https://compliance.cisotoolbox.org
- **Stack**: 100% client-side HTML/CSS/JS, no framework. The module-specific code is written in TypeScript (`ts/`) and the compiled JavaScript (`js/`) is committed: there is nothing to compile to run the app
- **Data persistence**: Browser localStorage (autosave) + JSON file download
- **Built-in frameworks**: ANSSI Guide d'hygiene (42 measures), ISO 27001 (120 requirements), initial entries in `Compliance_data.js`
- **Catalog frameworks** (lazy-loaded): ReCyF (NIS2), NIS 2, DORA, DORA (detailed), HDS, SecNumCloud, SOC 2, Cyber Resilience Act, LPM, Loi 05-20 (Maroc)
- **Custom frameworks**: CSV import with bilingual support (FR/EN)
- **Encryption**: AES-256-GCM with PBKDF2 for encrypted files and snapshots

---

## 2. File Structure

### Core application files

| File | Purpose |
|------|---------|
| `index.html` | Single-page HTML shell: toolbar, navigation rail, panels, help overlay, password dialog |
| `css/Compliance.css` | App-specific styles |
| `css/cisotoolbox.css` | Shared styles (toolbar, rail, tables, buttons, layout, responsive) |
| `favicon.svg` | App icon |
| `logo.svg` | Logo asset |
| `demo-fr.json`, `demo-en.json` | Fictional demo assessment (MedSecure), loadable from the settings panel |

### JavaScript -- Application

| File | Purpose |
|------|---------|
| `js/Compliance_app.js` | Main application logic (3017 lines): navigation, rendering, CRUD, import/export |
| `js/Compliance_data.js` | Initial data structure (`COMPLIANCE_INIT_DATA`): ANSSI 42 measures + ISO 27001 120 requirements with FR/EN labels |
| `js/Compliance_descriptions.js` | Lazy-loaded detailed descriptions for ANSSI and ISO controls (FR/EN) |
| `js/Compliance_reference_controls.js` | Lazy-loaded catalog of reference measures (`COMPLIANCE_REFERENCE_CONTROLS`), each mapped to the requirements it covers per framework |
| `js/Compliance_mesures_types.js` | Lazy-loaded measure templates (`COMPLIANCE_MESURES_TYPES`) mapped to framework requirements, used as a fallback by measure proposals |
| `js/Compliance_ai_assistant.js` | AI suggestions for requirements (only when an API key is set) |

### JavaScript -- i18n

| File | Purpose |
|------|---------|
| `js/Compliance_i18n_fr.js` | French module translations (loaded at startup) |
| `js/Compliance_i18n_en.js` | English module translations (loaded at startup) |

### JavaScript -- Framework reference data (lazy-loaded)

| File | Framework |
|------|-----------|
| `js/Compliance_ref_anssi.js` | ANSSI Hygiene Guide |
| `js/Compliance_ref_iso.js` | ISO 27001:2022 |
| `js/Compliance_ref_recyf.js` | ReCyF (NIS2) |
| `js/Compliance_ref_nis2.js` | NIS 2 Directive (article 21) |
| `js/Compliance_ref_dora.js` | DORA (EU 2022/2554), article level |
| `js/Compliance_ref_dora_detailed.js` | DORA (EU 2022/2554), paragraph level |
| `js/Compliance_ref_hds.js` | HDS (Health Data Hosting, France) |
| `js/Compliance_ref_secnumcloud.js` | SecNumCloud (ANSSI v3.2) |
| `js/Compliance_ref_soc2.js` | SOC 2 (AICPA Trust Services Criteria) |
| `js/Compliance_ref_cra.js` | Cyber Resilience Act (EU 2024/2847) |
| `js/Compliance_ref_lpm.js` | LPM (France) |
| `js/Compliance_ref_loi0520.js` | Loi 05-20 (Morocco) |

### JavaScript -- Shared libraries

Shared files, identical across the CISO Toolbox apps, carry a "Generated file - do not edit" header and are rewritten at every release.

| File | Purpose |
|------|---------|
| `js/cisotoolbox.js` | Event delegation, HTML helpers, lazy asset loading, AES encryption, undo/redo, column management |
| `js/cisotoolbox_local.js` | Browser-only persistence layer: autosave, file open/save (with encryption), session restore banner, snapshots, demo loader |
| `js/ct_schema.js` | Versioned exports and schema migration on load |
| `js/i18n.js` | Bilingual system: `t()`, `_registerTranslations()`, `switchLang()` |
| `js/i18n_core_fr.js`, `js/i18n_core_en.js` | Shared core translations (FR / EN) |
| `js/ai_common.js` | AI provider abstraction (Anthropic, OpenAI in this browser app), API key management |
| `js/ct_settings.js` | Settings drawer (language, AI, app-specific extra sections) |
| `js/referentiels_catalog.js` | Framework catalog with labels, descriptions (FR/EN), colors |
| `js/ct_refselect.js` | Multi-select dropdown component with tags and search |
| `js/ct_modal.js` | Promise-based modal overlay |
| `js/ct_userpicker.js` | User assignment widget |
| `js/ct_measure_modal.js` | Unified add/edit measure modal |
| `js/ct_nonconformity.js` | Non-conformity and derogation UI |
| `js/ct_nonconformity_local.js` | Non-conformity and derogation rules without a server (records live in the saved file) |
| `js/ct_table.js` | Declarative HTML table with sort, row click and optional bulk-selection column |
| `js/ct_bulkbar.js` | Bulk-action bar for tables |

### Testing

| File | Purpose |
|------|---------|
| `e2e/compliance.spec.js` | Playwright end-to-end tests |

---

## 3. Architecture Diagram

```
index.html
  |
  +-- cisotoolbox.css          (shared styles)
  +-- Compliance.css           (app styles)
  |
  +-- i18n.js, i18n_core_en.js, i18n_core_fr.js   (translation engine + core strings)
  +-- cisotoolbox.js           (shared: events, crypto, undo/redo, lazy loading)
  +-- ct_schema.js             (schema versioning / migration)
  +-- cisotoolbox_local.js     (browser persistence: autosave, files, snapshots, demo)
  +-- referentiels_catalog.js  (framework catalog metadata)
  +-- Compliance_data.js       (COMPLIANCE_INIT_DATA: ANSSI + ISO base entries)
  +-- Compliance_i18n_fr.js    (French strings)
  +-- Compliance_i18n_en.js    (English strings)
  +-- ct_refselect.js, ct_modal.js, ct_userpicker.js, ct_measure_modal.js,
  |   ct_nonconformity.js, ct_nonconformity_local.js, ct_table.js, ct_bulkbar.js
  +-- Compliance_app.js        (main application)
  +-- ai_common.js             (AI provider abstraction)
  +-- ct_settings.js           (settings drawer)
  +-- Compliance_ai_assistant.js (AI assistant for compliance)
  |
  +-- [lazy-loaded on demand, injected as <script> tags by _loadAsset()]
       +-- Compliance_ref_*.js               (12 framework reference files)
       +-- Compliance_descriptions.js        (ANSSI/ISO detailed descriptions)
       +-- Compliance_reference_controls.js  (reference measure catalog)
       +-- Compliance_mesures_types.js       (measure templates)
```

### Data flow

```
                    +------------------+
                    |   localStorage   |
                    | (autosave_v2)    |
                    +--------+---------+
                             |
    .json file  <-->  D (global state)  <-->  renderAll()
    (save/open)              |                     |
                             v                     v
                    +------------------+    +------------------+
                    |  D.meta          |    |  DOM panels      |
                    |  D.referentiels  |    |  (dashboard,     |
                    |  D.mesures[]     |    |   context,       |
                    |  D.preuves[]     |    |   fw views,      |
                    |  D.referentiels_ |    |   plan,          |
                    |    actifs[]      |    |   controles,     |
                    |  D.nonconformi-  |    |   nonconformi-   |
                    |    ties[]        |    |   ties, history) |
                    |  D.derogations[] |    +------------------+
                    +------------------+
```

### Navigation routing

```
selectPanel(panelId)
  |
  +-- "dashboard"       --> renderDashboard()
  +-- "context"         --> renderContext()
  +-- "plan"            --> renderPlan()
  +-- "controles"       --> renderControles()
  +-- "nonconformities" --> renderNonconformities()
  +-- "history"         --> renderHistory()
  +-- "fw:<id>:<sub>"   --> _ensureFramework() / _ensureDescriptions() --> _renderFwView()
       |                                                                    |
       +-- fw:anssi:dashboard    --> _renderFwDashboard()
       +-- fw:anssi:exigences    --> _renderFwExigences()
       +-- fw:dora:mesures       --> _renderFwMesures()
       +-- fw:iso:preuves        --> _renderFwPreuves()
```

At startup, a `?req=<fw>:<ref>` query parameter opens that requirement in its framework's requirements view, and a `#nonconformities` hash opens the non-conformity register.

---

## 4. Data Model

### Global state object `D`

```javascript
D = {
  meta: {
    tool: "compliance",
    version: "2.0",
    societe: "",           // Organization name
    date_evaluation: "",   // Assessment date
    evaluateur: "",        // Assessor
    perimetre: "",         // Scope
    commentaires: ""       // Comments
  },

  referentiels_actifs: ["anssi", "iso", "dora", ...],  // Active framework IDs

  referentiels: {
    // Each framework has an array of requirement entries
    anssi: [
      {
        ref: "1",                // Requirement reference
        thematique: "...",       // Theme (FR)
        thematique_en: "...",    // Theme (EN)
        mesure: "...",           // Control name (FR)
        mesure_en: "...",        // Control name (EN)
        applicable: true|false,  // Applicability toggle
        conformite: "",          // Conformity level (computed, not stored)
        ecart: "",               // Gap / comments
        mesures_prevues: "",     // Legacy text field (migrated to mesures_ids)
        mesures_ids: ["M-001"]   // Linked measure IDs
      },
      ...
    ],
    iso: [...],
    dora: [...],
    // custom_xxx: [...]
  },

  mesures: [
    {
      id: "M-001",
      description: "...",
      details: "...",
      statut: "planifie"|"en_cours"|"termine",
      date_cible: "",            // Target date
      responsable: "",           // Owner
      recurrence: ""|"ponctuel"|"mensuelle"|"trimestrielle"|"semestrielle"|"annuelle",
      dernier_controle: "",      // Last control date
      preuves_ids: ["P-001"]     // Linked evidence IDs
    },
    ...
  ],

  preuves: [
    {
      id: "P-001",
      label: "...",
      url: "",
      date_obtention: "",
      date_expiration: "",
      commentaire: ""
    },
    ...
  ],

  nonconformities: [...],   // Non-conformity register
  derogations: [...],       // Derogations (approved ones mark a requirement "derogated")

  _custom_frameworks: {
    // Persisted custom CSV-imported frameworks
    custom_xxx: {
      label: "My Framework",
      color: "#6366f1",
      measures: [{ ref, theme, mesure, description, theme_en, mesure_en, description_en }]
    }
  }
}
```

### Framework metadata: `REFERENTIELS_META` and `_BASE_FRAMEWORKS`

```javascript
// Base frameworks (always available, data in Compliance_data.js)
_BASE_FRAMEWORKS = {
  anssi: { label: "ANSSI — Guide d'hygiène", description: ..., color: "#1e293b" },
  iso:   { label: "ISO 27001", description: ..., color: "#1e40af" }
}

// Catalog frameworks (from referentiels_catalog.js)
REFERENTIELS_META = {
  recyf: { label: "ReCyF (NIS2)", description: "...", color: "#047857" },
  dora:  { label: "DORA", ..., measures: [...] },  // measures populated after lazy-load
  ...
}
```

### `COMPLIANCE_REF` namespace

Lazy-loaded framework reference files register their data into `window.COMPLIANCE_REF[fwId]`:

```javascript
window.COMPLIANCE_REF = {
  dora: {
    label: "DORA",
    measures: [
      { ref: "...", theme: "...", mesure: "...", description: "..." }
    ]
  }
}
```

### Dynamic framework loading: `_ensureFramework(fwId, cb)`

1. Checks if `REFERENTIELS_META[fwId].measures` already exists
2. If not, loads `js/Compliance_ref_<fwId>.js` via `_loadAsset()`
3. The loaded script writes to `window.COMPLIANCE_REF[fwId]`
4. `_ensureFramework` sets `REFERENTIELS_META[fwId]` to `COMPLIANCE_REF[fwId]`
5. Calls `cb()` to proceed with rendering

### Status computation (no stored conformity)

Conformity status is computed dynamically, never stored:

- **Measure effective status** (`_mesureEffectiveStatut`): returns `statut` unless `termine` with no valid (non-expired) evidence, then returns `preuve_manquante`
- **Requirement status** (`_exigenceStatut`): `na` if not applicable, `derogated` if an approved derogation covers it, `ok` if it has linked measures and all are `termine` with valid evidence, `ko` otherwise

---

## 5. Navigation

### `selectPanel(panelId)`

The central router. Accepts:

- Simple panel IDs: `"dashboard"`, `"context"`, `"plan"`, `"controles"`, `"nonconformities"`, `"history"`
- Framework-prefixed IDs: `"fw:<fwId>:<subview>"` where subview is `dashboard|exigences|mesures|preuves`

Behavior:
1. Sets `_currentPanel`, `_currentFw`, `_currentSubview` globals
2. Closes mobile sidebar
3. For `fw:` panels: catalog and custom frameworks go through `_ensureFramework()`; ANSSI and ISO load their detailed descriptions through `_ensureDescriptions()`
4. Switches `.tab-panel.active` class
5. Calls the appropriate render function
6. Updates the rail via `renderSidebar()` + `_updateSidebarAccordion()`

### `renderSidebar()`

Builds the dynamic framework sub-navigation:

1. Iterates `D.referentiels_actifs`
2. For each active framework, renders a rail item
3. If the framework is currently selected (`_currentFw === fwId`), renders four sub-items: Dashboard, Exigences, Mesures, Preuves
4. Sub-items use the `ct-rail-subitem` CSS class for indentation

### Accordion system

`_updateSidebarAccordion(panelId)` (from `cisotoolbox.js`) sets `aria-current="page"` on the rail item matching the current panel and expands the rail section that contains it.

---

## 6. Functions Reference

Line numbers refer to `js/Compliance_app.js`.

### Navigation (4 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `selectPanel(panelId)` | 477 | Central router: switches panels, loads framework data lazily, triggers rendering |
| `renderSidebar()` | 710 | Builds dynamic rail with framework sub-menus based on active frameworks |
| `renderAll()` | 688 | Full re-render: rail + current panel + undo/redo buttons + toolbar + i18n |
| `_renderFwView(fwId, subview)` | 1037 | Dispatcher: routes to the correct framework sub-view renderer |

### Dashboard (2 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `renderDashboard()` | 984 | Global dashboard: compliance % per framework, action plan summary |
| `_renderFwDashboard(fwId, label)` | 1049 | Per-framework dashboard: conformity %, actions in progress, expiring evidence |

### Context (4 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `renderContext()` | 739 | Renders context form (org, date, assessor, scope, comments) + framework selector chips |
| `_setMeta(key, val)` | 767 | Updates a D.meta field and triggers autosave |
| `toggleReferentiel(fwId)` | 833 | Activates/deactivates a framework, initializes entries if needed, lazy-loads data |
| `_autoHeight(el)` | (shared) | Auto-grows textarea height (defined in cisotoolbox.js) |

### Framework Views -- Exigences (6 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_renderFwExigences(fwId, label)` | 1103 | Renders requirements table with applicability, status, comments, linked measures |
| `_filterExigences(fwId, val)` | 1099 | Filters requirements by text search |
| `_toggleApplicable(fwId, idx, checked)` | 1221 | Toggles requirement applicability checkbox |
| `_updateExig(fwId, idx, field, val)` | 1231 | Updates a field on a requirement entry |
| `_getExigEntry(fwId, idx)` | 1236 | Returns requirement entry by framework ID and index |
| `_proposerMesures(fwId, idx)` | 103 | Proposes measures for a requirement: reference measure catalog first, measure templates as fallback |

### Measures -- Per-framework (10 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_renderFwMesures(fwId, label)` | 1483 | Renders the measures table of a framework (row click opens the measure modal) |
| `_filterMesures(fwId, val)` | 2001 | Filters measures by text search |
| `_addMesure(fwId)` | 2181 | Creates a new measure through the unified measure modal |
| `_editMesure(fwId, mesureId)` | 2184 | Opens the measure modal for an existing measure |
| `_goEditMesure(fwId, mesureId)` | 2195 | Opens the measure modal for a measure from another view |
| `_updateMesure(mesureId, field, val)` | 2267 | Updates a field on a measure |
| `_deleteMesure(mesureId, fwId)` | 2278 | Deletes a measure and unlinks it from all requirements |
| `_linkExistingMesure(fwId, idx, mesureId)` | 1454 | Links an existing measure to a requirement |
| `_createAndLinkMesure(fwId, idx)` | 1466 | Creates a new measure linked to a requirement, through the unified measure modal |
| `_unlinkMesure(fwId, idx, mesureId)` | 1472 | Unlinks a measure from a requirement |

### Measures -- Cross-referencing (5 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_renderLinkedExigences(mesureId, currentFwId)` | 2199 | Renders linked requirements with unlink buttons + search-select to add more |
| `_linkMesureToExig(mesureId, currentFwId, val)` | 2233 | Links a measure to a requirement (from measure edit) |
| `_unlinkMesureFromEdit(mesureId, fwId, idx, currentFwId)` | 2253 | Unlinks a requirement from a measure (from measure edit) |
| `_findExigencesForMesure(mesureId)` | 2005 | Returns all requirement refs linked to a measure across all frameworks |
| `_findFwsForMesure(mesureId)` | 2019 | Returns all framework labels that have requirements linked to a measure |

### Evidence/Proofs -- Per-framework (9 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_renderFwPreuves(fwId, label)` | 2345 | Renders the evidence table of a framework (row click opens the evidence modal) |
| `_filterPreuves(fwId, val)` | 2436 | Filters evidence by text search |
| `_addPreuveGlobal(fwId)` | 2440 | Creates a new evidence entry |
| `_editPreuve(fwId, preuveId)` | 2449 | Opens the evidence modal for an evidence entry |
| `_goEditPreuveFromMesure(fwId, mesureId, preuveId)` | 2455 | Closes the measure modal and opens the evidence modal, remembering the measure to return to |
| `_updatePreuveField(preuveId, field, val)` | 2562 | Updates a field on an evidence entry |
| `_linkExistingPreuve(mesureId, fwId, preuveId)` | 2294 | Links existing evidence to a measure |
| `_createAndLinkPreuve(mesureId, fwId)` | 2318 | Creates new evidence, links it to a measure, opens the evidence modal |
| `_unlinkPreuve(mesureId, preuveId, fwId)` | 2309 | Unlinks evidence from a measure |

### Plan d'action global (6 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `renderPlan()` | 2571 | Renders the cross-framework action plan table with bulk actions |
| `_filterPlan(val)` | 2675 | Filters plan by text search |
| `_addMesurePlan()` | 2679 | Creates a new measure from plan view, through the unified measure modal |
| `_unlinkPreuvePlan(mesureId, preuveId)` | 2682 | Unlinks evidence from a measure in plan view |
| `_linkExistingPreuvePlan(mesureId, preuveId)` | 2691 | Links evidence to a measure in plan view |
| `_createAndLinkPreuvePlan(mesureId)` | 2706 | Creates evidence linked to a measure from plan view |

### Controls (1 function)

| Function | Line | Purpose |
|----------|------|---------|
| `renderControles()` | 2727 | Renders recurring control tracking + expiring evidence alerts |

### Import/Export -- CSV (3 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `importCustomCSV()` | 864 | Opens file picker for CSV framework import |
| `_parseAndImportCSV(csvText, filename)` | 881 | Parses CSV (separator detected by the shared `_parseCSV`), prompts for name, registers custom framework |
| `downloadCSVTemplate()` | 856 | Downloads a sample CSV template file |

### Import -- EBIOS RM (2 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `importEbiosRM()` | 2805 | Triggers file input for EBIOS RM JSON import |
| `_doImportEbiosRM(event)` | 2808 | Parses EBIOS RM JSON: imports context, workshop 5 measures, ANSSI/ISO/complementary assessments |

### History / Snapshots (1 function)

| Function | Line | Purpose |
|----------|------|---------|
| `renderHistory()` | 2783 | Renders the snapshot panel (create/restore/export/delete, encryption toggle) through the shared `_renderSnapshotsPanel` |

Note: `createSnapshot`, `restoreSnapshot`, `exportSnapshot`, `deleteSnapshot`, `enableSnapEncryption`, `disableSnapEncryption`, `_getSnapshots`, `_isSnapEncrypted` are provided by `cisotoolbox_local.js`.

### Data initialization (1 function)

| Function | Line | Purpose |
|----------|------|---------|
| `ensureKeys()` | 538 | Initializes/migrates D structure: creates missing fields (including `nonconformities` and `derogations`), migrates old format (`socle_anssi`/`socle_iso`/`socle_complementaires`), merges base entries, enriches framework data from metadata, updates ID counters |

### Helpers -- ID generation & lookup (4 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_genMesureId()` | 262 | Generates next available `M-NNN` ID |
| `_genPreuveId()` | 267 | Generates next available `P-NNN` ID |
| `_getMesure(id)` | 272 | Finds a measure by ID in `D.mesures` |
| `_getPreuve(id)` | 273 | Finds an evidence entry by ID in `D.preuves` |

### Helpers -- Framework data access (5 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_getExigences(fwId)` | 349 | Returns requirement array for a framework |
| `_getExigRef(fwId, entry)` | 352 | Extracts reference string from a requirement entry |
| `_getMesuresForFw(fwId)` | 356 | Returns all measures linked to any requirement of a framework |
| `_getPreuvesForFw(fwId)` | 363 | Returns all evidence linked to a framework (via measures) |
| `_getAllFrameworks()` | 447 | Merges `_BASE_FRAMEWORKS` + `REFERENTIELS_META` + `D._custom_frameworks` |

### Helpers -- Status computation (6 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_statutLabel(key)` | 377 | Translates measure status key to label |
| `_mesureEffectiveStatut(m)` | 381 | Computes effective status (accounts for expired evidence) |
| `_exigenceStatut(entry, fwId)` | 401 | Computes requirement status: `ok`/`ko`/`na`/`derogated` |
| `_exigStatutLabel(key)` | 415 | Translates requirement status key to label |
| `_mesureBadge(m)` | 433 | Returns HTML badge for measure status |
| `_recLabel(key)` | 440 | Translates recurrence key to label |

### Helpers -- Measure proposals (4 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_ensureMesuresTypes(cb)` | 28 | Lazy-loads `Compliance_mesures_types.js` |
| `_getMesuresTypesFor(fwId, exigRef)` | 39 | Finds measure templates applicable to a specific requirement |
| `_ensureReferenceControls(cb)` | 48 | Lazy-loads `Compliance_reference_controls.js` |
| `_getReferenceControlsFor(fwId, exigRef)` | 58 | Finds reference measures applicable to a specific requirement |

### Helpers -- Search-select widget (5 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_searchSelect(placeholder, options, callbackFn, callbackArgs)` | 278 | Generates filterable dropdown HTML |
| `_ssFilterAndOpen(uid, val)` | 289 | Opens dropdown and applies filter |
| `_ssOpen(uid)` | 294 | Opens a search-select dropdown |
| `_ssFilter(uid, val)` | 302 | Filters dropdown options by text |
| `_ssSelect(uid, value, callbackFn, argsJson)` | 317 | Handles option selection, calls callback |

### Settings / AI (1 variable)

| Symbol | Line | Purpose |
|--------|------|---------|
| `window.AI_APP_CONFIG` | 3012 | AI module config: `storagePrefix: "compliance"`, plus `settingsExtraHTML` / `onSettingsRendered` hooks that add the demo loader to the settings panel |

---

## 7. Framework System

### Architecture

The framework system is designed for extensibility. Frameworks fall into three tiers:

1. **Base frameworks** (ANSSI, ISO 27001) -- initial entries shipped in `Compliance_data.js`, always available
2. **Catalog frameworks** (10 frameworks) -- metadata in `referentiels_catalog.js`, full data lazy-loaded from `Compliance_ref_<id>.js`
3. **Custom frameworks** -- imported from CSV, stored in `D._custom_frameworks` for persistence

### `_BASE_FRAMEWORKS`

Constant object defining the two core frameworks with i18n-aware descriptions:

```javascript
const _BASE_FRAMEWORKS = {
    anssi: { label: "ANSSI — Guide d'hygiène", get description() { return t("comp.fw.anssi_desc"); }, color: "#1e293b" },
    iso:   { label: "ISO 27001", get description() { return t("comp.fw.iso_desc"); }, color: "#1e40af" }
};
```

### `_getAllFrameworks()`

Merges all framework sources into a single object:

1. Starts with `_BASE_FRAMEWORKS`
2. Adds `REFERENTIELS_META` (catalog frameworks)
3. Adds `D._custom_frameworks` (custom CSV imports), registering them into `REFERENTIELS_META` and `COMPLIANCE_REF` if not already present

### `_ensureFramework(fwId, cb)` (from cisotoolbox.js)

Lazy-loading mechanism:

1. If `REFERENTIELS_META[fwId].measures` already exists, calls `cb()` immediately
2. Otherwise, injects `<script src="js/Compliance_ref_<fwId>.js">` via `_loadAsset()`
3. The loaded script populates `window.COMPLIANCE_REF[fwId]`
4. Sets `REFERENTIELS_META[fwId]` to `COMPLIANCE_REF[fwId]`
5. `_loadAsset()` marks the script element with `data-loaded` to prevent duplicate loading

### Custom CSV import flow

1. `importCustomCSV()` -- opens file picker
2. `_parseAndImportCSV()`:
   - Parses the file with the shared `_parseCSV()`, which detects the separator (`;`, `,`, or `\t`)
   - Reads the header row (expects `ref`, `mesure`/`measure`/`control`, optional `theme`, `description`, `*_en` columns)
   - Generates a unique `fwId` from label + timestamp
   - Registers in `_REFERENTIELS_CATALOG`, `REFERENTIELS_META`, `COMPLIANCE_REF`
   - Creates entries in `D.referentiels[fwId]`
   - Persists in `D._custom_frameworks` for save/load

### Framework reference file format

Each `Compliance_ref_<id>.js` file follows this pattern:

```javascript
window.COMPLIANCE_REF = window.COMPLIANCE_REF || {};
window.COMPLIANCE_REF["dora"] = {
    label: "DORA",
    description: "...",
    color: "#3a7ca5",
    measures: [
        { ref: "...", theme: "...", theme_en: "...",
          mesure: "...", mesure_en: "...", description: "...", description_en: "..." },
        ...
    ]
};
```

### `_initDataAndRender(afterFn)` (from cisotoolbox.js)

Startup orchestration:

1. Runs the schema migration (`ctSchemaMigrate`, from `ct_schema.js`) on `D`
2. Collects all active framework IDs from `D.referentiels_actifs`
3. Calls `_ensureFramework()` for each in parallel
4. When all loaded, calls `ensureKeys()` then `renderAll()`
5. Calls `afterFn()` if provided

---

## 8. Shared Library, Event System, Security, i18n

### Shared library (`cisotoolbox.js`)

The app configures the shared library at load time via `window.CT_CONFIG`:

```javascript
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
```

Key shared functions used by the app:

| Function | Purpose |
|----------|---------|
| `esc(v)` | HTML entity escaping for XSS prevention |
| `_da(...)` | JSON-encodes `data-args` values with single-quote escaping |
| `badge(text, color)` / `ctBadge(text, color)` | Generates colored badge HTML |
| `_loadAsset(filename, cb)` | Injects `<script>` tags with dedup and load tracking |
| `_ensureFramework(fwId, cb)` | Lazy-loads framework reference data |
| `_ensureDescriptions(cb)` | Lazy-loads ANSSI/ISO detailed descriptions |
| `_initDataAndRender(afterFn)` | Startup: migrates the schema, loads all active frameworks, then renders |
| `_saveState()` | Pushes current D to undo stack |
| `_autoSave()` | Saves D to localStorage |
| `_checkAutoSaveBanner()` | Shows restore banner if autosave data exists |
| `_getSnapshots()` | Returns snapshot list from localStorage |
| `hd(colKey)` | Column hide/show data attribute for table headers |
| `colsButton(tableId)` | Generates column visibility toggle button |
| `_setupTable(tableId)` | Initializes column resize/hide on a table |
| `_applyStaticTranslations()` | Applies `data-i18n` attributes to DOM |
| `_getSettingsButtonHTML()` | Settings gear button HTML |
| `_getGithubLinkHTML(url)` | GitHub link button HTML |
| `_autoHeight(el)` | Auto-grows textarea height |
| `toggleHelp(tab)` | Opens/closes help overlay |
| `switchHelpTab(tab)` | Switches help overlay tab |
| `toggleMenu()` | Opens/closes toolbar dropdown menus |
| `_menuAction(fnName)` | Routes menu item clicks to named functions |
| `toggleSidebar()` | Collapses/expands sidebar |
| `_toggleSidebarMobile()` | Mobile sidebar toggle |
| `toggleGroup(el)` | Accordion open/close for sidebar groups |
| `_updateSidebarAccordion(panelId)` | Marks the active rail item and expands its section |
| `_rt(obj, field)` | Returns localized field (`field_en` in EN mode, `field` in FR mode) |

### Event system

All user interactions use `data-*` attributes dispatched by `cisotoolbox.js`:

| Attribute | Event | Behavior |
|-----------|-------|----------|
| `data-click="fnName"` | click | Calls `window[fnName]()` with args from `data-args` |
| `data-change="fnName"` | change | Calls on select/input change |
| `data-input="fnName"` | input | Calls on real-time input (keystrokes) |
| `data-pass-value` | - | Passes `element.value` as last argument |
| `data-pass-el` | - | Passes the DOM element as last argument |
| `data-pass-checked` | - | Passes `element.checked` as last argument |
| `data-pass-event` | - | Passes the raw event object |
| `data-stop` | - | Calls `event.stopPropagation()` |
| `data-click-self="fnName"` | click | Only fires if click target is the element itself (overlay dismiss) |

The dispatcher (`_safeDispatch` in cisotoolbox.js) includes a blocklist of dangerous function names (eval, fetch, open, etc.) for CSP compliance.

### Security

| Layer | Implementation |
|-------|----------------|
| **XSS prevention** | All user data escaped via `esc()` before `innerHTML`. No `onclick=` in generated HTML. |
| **CSP** | `.htaccess.example` and `nginx-security.conf.example` set `script-src 'self'` -- no inline scripts, no eval |
| **Encryption** | AES-256-GCM with PBKDF2 (250k iterations) for encrypted files and snapshots |
| **Event safety** | `_safeDispatch` blocklist prevents calling dangerous browser APIs via data attributes |
| **No inline handlers** | All events via `data-click`/`data-change`/`data-input` delegation |
| **API keys** | Stored in localStorage only, never in source or saved files |
| **Security headers** | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy (both example configs); HSTS in the nginx example |

### i18n

| Feature | Implementation |
|---------|----------------|
| **Languages** | French and English, both loaded at startup (`i18n_core_*.js` + `Compliance_i18n_*.js`) |
| **Initial language** | Stored preference (`localStorage["ct_lang"]`), else the browser language if available, else English |
| **Translation function** | `t("comp.section.key")` with interpolation: `t("key", {count: 5})` |
| **Static DOM** | `data-i18n="key"` attributes on HTML elements, applied by `_applyStaticTranslations()` |
| **HTML content** | `data-i18n-html="key"` for rich HTML translations (help content) |
| **Placeholders** | `data-i18n-placeholder="key"` for input placeholders |
| **Titles** | `data-i18n-title="key"` for element titles/tooltips |
| **Reference data** | `_rt(obj, "field")` returns `obj.field_en` in EN mode, `obj.field` in FR mode |
| **Key convention** | `comp.<section>.<item>` (e.g., `comp.exig.col_ref`, `comp.dash.no_framework`) |
