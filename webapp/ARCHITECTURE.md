# Compliance Module -- Architecture

## 1. Overview

Multi-framework compliance tracking tool for CISOs and security teams. Enables organizations to assess their compliance posture across multiple security frameworks simultaneously, track remediation measures, manage evidence, and monitor recurring controls.

- **URL**: https://compliance.cisotoolbox.org
- **Stack**: 100% client-side vanilla HTML/CSS/JS -- no framework, no build step
- **Data persistence**: Browser localStorage (autosave) + JSON file download
- **Built-in frameworks**: ANSSI Guide d'hygiene (42 measures), ISO 27001 (93 controls)
- **Catalog frameworks** (lazy-loaded): ReCyF/NIS2, DORA, HDS, SecNumCloud, SOC 2, CRA, GAMP 5, LPM, Loi 05-20 (Maroc)
- **Custom frameworks**: CSV import with bilingual support (FR/EN)
- **Encryption**: AES-256-GCM with PBKDF2 for snapshots

---

## 2. File Structure

### Core application files

| File | Purpose |
|------|---------|
| `app/index.html` | Single-page HTML shell: toolbar, sidebar, panels, help overlay, password dialog |
| `app/css/Compliance.css` | App-specific styles (indicators, measure cards, search-select, help overlay) |
| `app/css/cisotoolbox.css` | Shared styles (toolbar, sidebar, tables, buttons, layout, responsive) |
| `app/favicon.svg` | App icon |
| `app/logo.svg` | Logo asset |

### JavaScript -- Application

| File | Purpose |
|------|---------|
| `app/js/Compliance_app.js` | Main application logic (1865 lines): navigation, rendering, CRUD, import/export |
| `app/js/Compliance_data.js` | Initial data structure (`COMPLIANCE_INIT_DATA`): ANSSI 42 measures + ISO 93 controls with FR/EN labels |
| `app/js/Compliance_descriptions.js` | Lazy-loaded detailed descriptions for ANSSI and ISO controls (FR/EN) |
| `app/js/Compliance_mesures_types.js` | Lazy-loaded measure type templates mapped to framework requirements |
| `app/js/Compliance_ai_assistant.js` | AI assistant integration (Anthropic Claude / OpenAI) |

### JavaScript -- i18n

| File | Purpose |
|------|---------|
| `app/js/Compliance_i18n_fr.js` | French translations (loaded at startup) |
| `app/js/Compliance_i18n_en.js` | English translations (lazy-loaded on demand) |

### JavaScript -- Framework reference data (lazy-loaded)

| File | Framework |
|------|-----------|
| `app/js/Compliance_ref_recyf.js` | ReCyF / NIS2 (ANSSI, March 2026) |
| `app/js/Compliance_ref_dora.js` | DORA (EU 2022/2554) |
| `app/js/Compliance_ref_hds.js` | HDS (Health Data Hosting, France) |
| `app/js/Compliance_ref_secnumcloud.js` | SecNumCloud (ANSSI v3.2) |
| `app/js/Compliance_ref_soc2.js` | SOC 2 (AICPA Trust Services) |
| `app/js/Compliance_ref_cra.js` | Cyber Resilience Act (EU 2024) |
| `app/js/Compliance_ref_gamp.js` | GAMP 5 |
| `app/js/Compliance_ref_lpm.js` | LPM (France) |
| `app/js/Compliance_ref_loi0520.js` | Loi 05-20 (Morocco) |
| `app/js/Compliance_ref_nis2.js` | NIS2 Directive (legacy/alternate) |

### JavaScript -- Shared libraries (copied from `shared/`)

| File | Purpose |
|------|---------|
| `app/js/cisotoolbox.js` | Event delegation, HTML helpers, file I/O, AES encryption, undo/redo, autosave, column management |
| `app/js/cisotoolbox_local.js` | App-local overrides/extensions for shared library |
| `app/js/i18n.js` | Bilingual system: `t()`, `_registerTranslations()`, `switchLang()` |
| `app/js/ai_common.js` | AI provider abstraction (Anthropic, OpenAI), API key management |
| `app/js/referentiels_catalog.js` | Framework catalog with labels, descriptions (FR/EN), colors |
| `app/js/ct_refselect.js` | Multi-select dropdown component with tags and search |

### Testing

| File | Purpose |
|------|---------|
| `app/e2e/compliance.spec.js` | Playwright end-to-end tests |

---

## 3. Architecture Diagram

```
index.html
  |
  +-- cisotoolbox.css          (shared styles)
  +-- Compliance.css           (app styles)
  |
  +-- i18n.js                  (translation engine)
  +-- cisotoolbox.js           (shared: events, I/O, crypto, undo/redo, autosave)
  +-- cisotoolbox_local.js     (app-local extensions)
  +-- referentiels_catalog.js  (framework catalog metadata)
  +-- Compliance_data.js       (COMPLIANCE_INIT_DATA: ANSSI + ISO base entries)
  +-- Compliance_i18n_fr.js    (French strings -- loaded at startup)
  +-- Compliance_app.js        (main application -- 1865 lines)
  +-- ai_common.js             (AI provider abstraction)
  +-- Compliance_ai_assistant.js (AI assistant for compliance)
  |
  +-- [lazy-loaded on demand]
       +-- Compliance_i18n_en.js        (English strings)
       +-- Compliance_descriptions.js   (ANSSI/ISO detailed descriptions)
       +-- Compliance_mesures_types.js  (measure type templates)
       +-- Compliance_ref_*.js          (10 framework reference files)
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
                    +------------------+    |   history)       |
                                           +------------------+
```

### Navigation routing

```
selectPanel(panelId)
  |
  +-- "dashboard"     --> renderDashboard()
  +-- "context"       --> renderContext()
  +-- "plan"          --> renderPlan()
  +-- "controles"     --> renderControles()
  +-- "history"       --> renderHistory()
  +-- "fw:<id>:<sub>" --> _ensureFramework() --> _renderFwView()
       |                                           |
       +-- fw:anssi:dashboard    --> _renderFwDashboard()
       +-- fw:anssi:exigences    --> _renderFwExigences()
       +-- fw:dora:mesures       --> _renderFwMesures()
       +-- fw:iso:preuves        --> _renderFwPreuves()
```

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
  anssi: { label: "ANSSI -- Guide d'hygiene", description: ..., color: "#1e293b" },
  iso:   { label: "ISO 27001", description: ..., color: "#1e40af" }
}

// Catalog frameworks (from referentiels_catalog.js)
REFERENTIELS_META = {
  recyf: { label: "ReCyF (NIS2)", description: "...", color: "#4a8fa8" },
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
      { ref: "DORA-G01", theme: "...", mesure: "...", description: "..." }
    ]
  }
}
```

### Dynamic framework loading: `_ensureFramework(fwId, cb)`

1. Checks if `REFERENTIELS_META[fwId].measures` already exists
2. If not, loads `js/Compliance_ref_<fwId>.js` via `_loadAsset()`
3. The loaded script writes to `window.COMPLIANCE_REF[fwId]`
4. `_ensureFramework` copies data from `COMPLIANCE_REF[fwId]` into `REFERENTIELS_META[fwId]`
5. Calls `cb()` to proceed with rendering

### Status computation (no stored conformity)

Conformity status is computed dynamically, never stored:

- **Measure effective status** (`_mesureEffectiveStatut`): returns `statut` unless `termine` with no valid (non-expired) evidence, then returns `preuve_manquante`
- **Requirement status** (`_exigenceStatut`): `na` if not applicable, `ok` if all linked measures are `termine` with valid evidence, `ko` otherwise

---

## 5. Navigation

### `selectPanel(panelId)`

The central router. Accepts:

- Simple panel IDs: `"dashboard"`, `"context"`, `"plan"`, `"controles"`, `"history"`
- Framework-prefixed IDs: `"fw:<fwId>:<subview>"` where subview is `dashboard|exigences|mesures|preuves`

Behavior:
1. Sets `_currentPanel`, `_currentFw`, `_currentSubview` globals
2. Closes mobile sidebar
3. For `fw:` panels: calls `_ensureFramework()` (and `_ensureDescriptions()` for ANSSI/ISO) before rendering
4. Switches `.tab-panel.active` class
5. Calls the appropriate render function
6. Updates sidebar via `renderSidebar()` + `_updateSidebarAccordion()`

### `renderSidebar()`

Builds the dynamic framework sub-navigation:

1. Iterates `D.referentiels_actifs`
2. For each active framework, renders a sidebar item
3. If the framework is currently selected (`_currentFw === fwId`), renders four sub-items: Dashboard, Exigences, Mesures, Preuves
4. Sub-items use `sidebar-sub` CSS class for indentation

### Accordion system

The sidebar uses `_updateSidebarAccordion(panelId)` (from `cisotoolbox.js`) to open/close sidebar groups based on which `data-panels` attribute contains the current panel ID.

---

## 6. Functions Reference

### Navigation (4 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `selectPanel(panelId)` | 296 | Central router: switches panels, loads framework data lazily, triggers rendering |
| `renderSidebar()` | 478 | Builds dynamic sidebar with framework sub-menus based on active frameworks |
| `renderAll()` | 459 | Full re-render: sidebar + current panel + undo/redo buttons + toolbar + i18n |
| `_renderFwView(fwId, subview)` | 771 | Dispatcher: routes to the correct framework sub-view renderer |

### Dashboard (2 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `renderDashboard()` | 726 | Global dashboard: compliance % per framework, action plan summary |
| `_renderFwDashboard(fwId, label)` | 780 | Per-framework dashboard: conformity %, actions in progress, expiring evidence |

### Context (4 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `renderContext()` | 507 | Renders context form (org, date, assessor, scope, comments) + framework selector chips |
| `_setMeta(key, val)` | 534 | Updates a D.meta field and triggers autosave |
| `toggleReferentiel(fwId)` | 540 | Activates/deactivates a framework, initializes entries if needed, lazy-loads data |
| `_autoHeight(el)` | (shared) | Auto-grows textarea height (defined in cisotoolbox.js) |

### Framework Views -- Exigences (6 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_renderFwExigences(fwId, label)` | 836 | Renders requirements table with applicability, status, comments, linked measures |
| `_filterExigences(fwId, val)` | 831 | Filters requirements by text search |
| `_toggleApplicable(fwId, idx, checked)` | 924 | Toggles requirement applicability checkbox |
| `_updateExig(fwId, idx, field, val)` | 935 | Updates a field on a requirement entry |
| `_getExigEntry(fwId, idx)` | 940 | Returns requirement entry by framework ID and index |
| `_proposerMesures(fwId, idx)` | 48 | Proposes measure templates from mesures_types for a requirement |

### Measures -- Per-framework (12 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_renderFwMesures(fwId, label)` | 981 | Renders measures table + inline edit form for a framework |
| `_filterMesures(fwId, val)` | 1080 | Filters measures by text search |
| `_addMesure(fwId)` | 1110 | Creates a new measure and opens edit form |
| `_editMesure(fwId, mesureId)` | 1119 | Opens inline edit for a measure |
| `_goEditMesure(fwId, mesureId)` | 1127 | Navigates to mesures panel and opens edit (with return-to tracking) |
| `_scrollToEditingCard()` | 1133 | Scrolls to the editing card (with retry for async loading) |
| `_closeMesureEdit(fwId)` | 1143 | Closes measure edit form, navigates back if needed |
| `_updateMesure(mesureId, field, val)` | 1222 | Updates a field on a measure |
| `_deleteMesure(mesureId, fwId)` | 1227 | Deletes a measure and unlinks it from all requirements |
| `_linkExistingMesure(fwId, idx, mesureId)` | 944 | Links an existing measure to a requirement |
| `_createAndLinkMesure(fwId, idx)` | 954 | Creates a new measure, links it to a requirement, opens edit |
| `_unlinkMesure(fwId, idx, mesureId)` | 967 | Unlinks a measure from a requirement |

### Measures -- Cross-referencing (4 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_renderLinkedExigences(mesureId, currentFwId)` | 1155 | Renders linked requirements with unlink buttons + search-select to add more |
| `_linkMesureToExig(mesureId, currentFwId, val)` | 1191 | Links a measure to a requirement (from measure edit) |
| `_unlinkMesureFromEdit(mesureId, fwId, idx, currentFwId)` | 1208 | Unlinks a requirement from a measure (from measure edit) |
| `_findExigencesForMesure(mesureId)` | 1085 | Returns all requirement refs linked to a measure across all frameworks |
| `_findFwsForMesure(mesureId)` | 1096 | Returns all framework labels that have requirements linked to a measure |

### Evidence/Proofs -- Per-framework (10 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_renderFwPreuves(fwId, label)` | 1283 | Renders evidence table + inline edit form for a framework |
| `_filterPreuves(fwId, val)` | 1368 | Filters evidence by text search |
| `_addPreuveGlobal(fwId)` | 1373 | Creates a new evidence entry and opens edit |
| `_editPreuve(fwId, preuveId)` | 1382 | Opens inline edit for an evidence entry |
| `_goEditPreuveFromMesure(fwId, mesureId, preuveId)` | 1390 | Navigates from measure edit to evidence edit (with return-to tracking) |
| `_closePreuveEdit(fwId)` | 1397 | Closes evidence edit, navigates back if needed |
| `_updatePreuveField(preuveId, field, val)` | 1413 | Updates a field on an evidence entry |
| `_deletePreuve(preuveId, fwId)` | 1418 | Deletes an evidence entry and unlinks it from all measures |
| `_linkExistingPreuve(mesureId, fwId, preuveId)` | 1241 | Links existing evidence to a measure |
| `_createAndLinkPreuve(mesureId, fwId)` | 1261 | Creates new evidence, links to a measure, opens edit |
| `_unlinkPreuve(mesureId, preuveId, fwId)` | 1253 | Unlinks evidence from a measure |

### Plan d'action global (9 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `renderPlan()` | 1431 | Renders cross-framework action plan: all measures with edit form |
| `_filterPlan(val)` | 1525 | Filters plan by text search |
| `_editMesurePlan(mesureId)` | 1530 | Opens inline edit in plan view |
| `_closePlanEdit()` | 1536 | Closes plan edit form |
| `_addMesurePlan()` | 1541 | Creates a new measure from plan view |
| `_deleteMesurePlan(mesureId)` | 1550 | Deletes a measure from plan view |
| `_unlinkPreuvePlan(mesureId, preuveId)` | 1563 | Unlinks evidence from a measure in plan view |
| `_linkExistingPreuvePlan(mesureId, preuveId)` | 1571 | Links evidence to a measure in plan view |
| `_createAndLinkPreuvePlan(mesureId)` | 1583 | Creates evidence linked to a measure from plan view |
| `_goEditPreuveFromPlan(mesureId, preuveId)` | 1600 | Navigates from plan to evidence edit |

### Controls (1 function)

| Function | Line | Purpose |
|----------|------|---------|
| `renderControles()` | 1610 | Renders recurring control tracking + expiring evidence alerts |

### Import/Export -- CSV (4 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `importCustomCSV()` | 586 | Opens file picker for CSV framework import |
| `_parseAndImportCSV(csvText, filename)` | 602 | Parses CSV (auto-detects separator), prompts for name, registers custom framework |
| `_splitCSVLine(line, sep)` | 705 | CSV line parser with quoted field support |
| `downloadCSVTemplate()` | 571 | Downloads a sample CSV template file |

### Import -- EBIOS RM (2 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `importEbiosRM()` | 1695 | Triggers file input for EBIOS RM JSON import |
| `_doImportEbiosRM(event)` | 1699 | Parses EBIOS RM JSON: imports context, measures (atelier 5), ANSSI/ISO/complementary assessments, auto-links measures |

### History / Snapshots (1 function)

| Function | Line | Purpose |
|----------|------|---------|
| `renderHistory()` | 1666 | Renders snapshot list with create/restore/export/delete actions and encryption toggle |

Note: `createSnapshot`, `restoreSnapshot`, `exportSnapshot`, `deleteSnapshot`, `enableSnapEncryption`, `disableSnapEncryption`, `_getSnapshots`, `_isSnapEncrypted` are provided by `cisotoolbox.js`.

### Data initialization (1 function)

| Function | Line | Purpose |
|----------|------|---------|
| `ensureKeys()` | 341 | Initializes/migrates D structure: creates missing fields, migrates old format (`socle_anssi`/`socle_iso`/`socle_complementaires`), merges base entries, enriches framework data from metadata, updates ID counters |

### Helpers -- ID generation & lookup (4 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_genMesureId()` | 128 | Generates next available `M-NNN` ID |
| `_genPreuveId()` | 132 | Generates next available `P-NNN` ID |
| `_getMesure(id)` | 136 | Finds a measure by ID in `D.mesures` |
| `_getPreuve(id)` | 137 | Finds an evidence entry by ID in `D.preuves` |

### Helpers -- Framework data access (6 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_exigKey(fwId, ref)` | 203 | Builds composite key `"fwId:ref"` |
| `_getExigences(fwId)` | 206 | Returns requirement array for a framework |
| `_getExigRef(fwId, entry)` | 210 | Extracts reference string from a requirement entry |
| `_getMesuresForFw(fwId)` | 215 | Returns all measures linked to any requirement of a framework |
| `_getPreuvesForFw(fwId)` | 223 | Returns all evidence linked to a framework (via measures) |
| `_getAllFrameworks()` | 275 | Merges `_BASE_FRAMEWORKS` + `REFERENTIELS_META` + `D._custom_frameworks` |

### Helpers -- Status computation (6 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_statutLabel(key)` | 231 | Translates measure status key to label |
| `_mesureEffectiveStatut(m)` | 237 | Computes effective status (accounts for expired evidence) |
| `_exigenceStatut(entry)` | 248 | Computes requirement status: `ok`/`ko`/`na` |
| `_exigStatutLabel(key)` | 258 | Translates requirement status key to label |
| `_mesureBadge(m)` | 261 | Returns HTML badge for measure status |
| `_recLabel(key)` | 266 | Translates recurrence key to label |

### Helpers -- Measure type templates (2 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_ensureMesuresTypes(cb)` | 30 | Lazy-loads `Compliance_mesures_types.js` |
| `_getMesuresTypesFor(fwId, exigRef)` | 39 | Finds measure templates applicable to a specific requirement |

### Helpers -- Search-select widget (5 functions)

| Function | Line | Purpose |
|----------|------|---------|
| `_searchSelect(placeholder, options, callbackFn, callbackArgs)` | 143 | Generates filterable dropdown HTML |
| `_ssFilterAndOpen(uid, val)` | 155 | Opens dropdown and applies filter |
| `_ssOpen(uid)` | 160 | Opens a search-select dropdown |
| `_ssFilter(uid, val)` | 169 | Filters dropdown options by text |
| `_ssSelect(uid, value, callbackFn, argsJson)` | 182 | Handles option selection, calls callback |

### Settings / AI (1 variable)

| Symbol | Line | Purpose |
|--------|------|---------|
| `window.AI_APP_CONFIG` | 1865 | AI module config: `{ storagePrefix: "compliance" }` |

---

## 7. Framework System

### Architecture

The framework system is designed for extensibility. Frameworks fall into three tiers:

1. **Base frameworks** (ANSSI, ISO 27001) -- data shipped in `Compliance_data.js`, always available
2. **Catalog frameworks** (11 frameworks) -- metadata in `referentiels_catalog.js`, full data lazy-loaded from `Compliance_ref_<id>.js`
3. **Custom frameworks** -- imported from CSV, stored in `D._custom_frameworks` for persistence

### `_BASE_FRAMEWORKS`

Constant object defining the two core frameworks with i18n-aware descriptions:

```javascript
const _BASE_FRAMEWORKS = {
    anssi: { label: "ANSSI -- Guide d'hygiene", get description() { return t("comp.fw.anssi_desc"); }, color: "#1e293b" },
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
4. Copies data from `COMPLIANCE_REF[fwId]` into `REFERENTIELS_META[fwId]`
5. Marks the script element with `data-loaded="1"` to prevent duplicate loading

### Custom CSV import flow

1. `importCustomCSV()` -- opens file picker
2. `_parseAndImportCSV()`:
   - Auto-detects separator (`;`, `,`, or `\t`)
   - Parses header row (expects `ref`, `mesure`/`measure`/`control`, optional `theme`, `description`, `*_en` columns)
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
        { ref: "DORA-G01", theme: "Gouvernance", theme_en: "Governance",
          mesure: "...", mesure_en: "...", description: "...", description_en: "..." },
        ...
    ]
};
```

### `_initDataAndRender(afterFn)` (from cisotoolbox.js)

Startup orchestration:

1. Collects all active framework IDs from `D.referentiels_actifs`
2. Calls `_ensureFramework()` for each in parallel
3. When all loaded, calls `ensureKeys()` then `renderAll()`
4. Calls `afterFn()` if provided

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
| `_initDataAndRender(afterFn)` | Startup: loads all active frameworks then renders |
| `_saveState()` | Pushes current D to undo stack |
| `_autoSave()` | Debounced save to localStorage |
| `_checkAutoSaveBanner()` | Shows restore banner if autosave data exists |
| `_getSnapshots()` | Returns snapshot list from IndexedDB |
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
| `_updateSidebarAccordion(panelId)` | Auto-opens the sidebar group containing the active panel |
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
| **CSP** | `.htaccess` enforces `script-src 'self'` -- no inline scripts, no eval |
| **Encryption** | AES-256-GCM with PBKDF2 (250k iterations) for snapshot encryption |
| **Event safety** | `_safeDispatch` blocklist prevents calling dangerous browser APIs via data attributes |
| **No inline handlers** | All events via `data-click`/`data-change`/`data-input` delegation |
| **API keys** | Stored in localStorage only, never in source or saved files |
| **Security headers** | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS, Referrer-Policy |

### i18n

| Feature | Implementation |
|---------|----------------|
| **Default language** | French, loaded at startup via `Compliance_i18n_fr.js` |
| **English** | Lazy-loaded on demand via `Compliance_i18n_en.js` |
| **Translation function** | `t("comp.section.key")` with interpolation: `t("key", {count: 5})` |
| **Static DOM** | `data-i18n="key"` attributes on HTML elements, applied by `_applyStaticTranslations()` |
| **HTML content** | `data-i18n-html="key"` for rich HTML translations (help content) |
| **Placeholders** | `data-i18n-placeholder="key"` for input placeholders |
| **Titles** | `data-i18n-title="key"` for element titles/tooltips |
| **Reference data** | `_rt(obj, "field")` returns `obj.field_en` in EN mode, `obj.field` in FR mode |
| **Key convention** | `comp.<section>.<item>` (e.g., `comp.exig.col_ref`, `comp.dash.no_framework`) |
