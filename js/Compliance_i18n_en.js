// Compliance — English translations
_registerTranslations("en", {
    // Label app
    "comp.label": "assessment",

    // Title
    "comp.title": "Compliance Tracking",

    // Toolbar / Menu
    "comp.menu.import_ebios": "Import EBIOS RM",
    "comp.menu.new_assessment": "New assessment",

    // Sidebar — sections
    "comp.sidebar.global": "Overview",
    "comp.sidebar.context": "Context",
    "comp.sidebar.dashboard": "Dashboard",
    "comp.sidebar.plan": "Action plan",
    "comp.sidebar.controles": "Controls",
    "comp.sidebar.frameworks": "Frameworks",
    "comp.sidebar.history_section": "History",
    "comp.sidebar.snapshots": "Snapshots",

    // Sidebar — sub-views
    "comp.subview.dashboard": "Dashboard",
    "comp.subview.exigences": "Requirements",
    "comp.subview.mesures": "Controls",
    "comp.subview.preuves": "Evidence",

    // Panel descriptions
    "comp.panel.dashboard_desc": "Compliance overview.",
    "comp.panel.context_desc": "Assessment information and framework selection.",
    "comp.panel.plan_desc": "All incomplete controls across all frameworks.",
    "comp.panel.controles_desc": "Recurring control tracking and expiring evidence.",
    "comp.panel.history_desc": "Snapshots and change history.",

    // Context form
    "comp.context.organisation": "Organization",
    "comp.context.date": "Date",
    "comp.context.evaluateur": "Assessor",
    "comp.context.perimetre": "Scope",
    "comp.context.commentaires": "Comments",
    "comp.context.frameworks_heading": "Compliance frameworks",

    // Statut labels
    "comp.statut.planifie": "Planned",
    "comp.statut.en_cours": "In progress",
    "comp.statut.termine": "Completed",
    "comp.statut.preuve_manquante": "Missing evidence",

    // Exigence statut
    "comp.exig_statut.ok": "OK",
    "comp.exig_statut.ko": "KO",
    "comp.exig_statut.na": "N/A",

    // Recurrence labels
    "comp.rec.ponctuel": "One-time",
    "comp.rec.mensuelle": "Monthly",
    "comp.rec.trimestrielle": "Quarterly",
    "comp.rec.semestrielle": "Semi-annual",
    "comp.rec.annuelle": "Annual",

    // Dashboard
    "comp.dash.no_framework": "No framework selected. Go to <strong>Context</strong> to choose one.",
    "comp.dash.mesures": "Controls",
    "comp.dash.total": "Total",
    "comp.dash.terminees": "Completed",
    "comp.dash.en_cours": "In progress",
    "comp.dash.planifiees": "Planned",

    // FW Dashboard
    "comp.fw_dash.conformite": "Compliance ({ok} OK / {ko} KO)",
    "comp.fw_dash.exigences_applicables": "Applicable requirements",
    "comp.fw_dash.mesures": "Controls",
    "comp.fw_dash.preuves": "Evidence",
    "comp.fw_dash.actions_en_cours": "Ongoing actions ({count})",
    "comp.fw_dash.preuves_expirant": "Evidence expiring within 90 days ({count})",

    // FW Dashboard table headers
    "comp.fw_dash.col_id": "ID",
    "comp.fw_dash.col_description": "Description",
    "comp.fw_dash.col_statut": "Status",
    "comp.fw_dash.col_echeance": "Deadline",
    "comp.fw_dash.col_label": "Label",
    "comp.fw_dash.col_expiration": "Expiration",

    // Exigences
    "comp.exig.title": "Requirements — {label}",
    "comp.exig.search": "Search...",
    "comp.exig.count": "{filtered} / {total} requirements",
    "comp.exig.col_ref": "Ref.",
    "comp.exig.col_theme": "Category",
    "comp.exig.col_mesure": "Requirement",
    "comp.exig.col_appl": "Appl.",
    "comp.exig.col_statut": "Status",
    "comp.exig.col_commentaires": "Comments",
    "comp.exig.col_mesures_liees": "Linked controls",
    "comp.exig.placeholder_na": "N/A reason...",
    "comp.exig.placeholder_comments": "Comments...",
    "comp.exig.en_place": "In place",
    "comp.exig.prevues": "Planned",
    "comp.exig.lier_mesure": "Link a control...",
    "comp.exig.btn_nouvelle": "+ New",
    "comp.exig.btn_proposer": "Suggest",
    "comp.exig.fw_desc": "Requirements — {label}",

    // Mesures
    "comp.mes.title": "Controls — {label}",
    "comp.mes.btn_nouvelle": "+ New control",
    "comp.mes.search": "Search...",
    "comp.mes.count": "{count} control(s)",
    "comp.mes.btn_supprimer": "Delete",
    "comp.mes.btn_valider": "Validate",
    "comp.mes.placeholder_desc": "Description...",
    "comp.mes.placeholder_details": "Implementation details...",
    "comp.mes.label_statut": "Status:",
    "comp.mes.label_echeance": "Deadline:",
    "comp.mes.label_responsable": "Owner:",
    "comp.mes.label_recurrence": "Recurrence:",
    "comp.mes.label_dernier_controle": "Last check:",
    "comp.mes.exigences_liees": "Linked requirements",
    "comp.mes.preuves_liees": "Linked evidence",
    "comp.mes.lier_preuve": "Link evidence...",
    "comp.mes.btn_nouvelle_preuve": "+ New evidence",
    "comp.mes.lier_exigence": "Link to a requirement...",
    "comp.mes.fw_desc": "Controls — {label}",

    // Mesures table headers
    "comp.mes.col_id": "ID",
    "comp.mes.col_description": "Description",
    "comp.mes.col_statut": "Status",
    "comp.mes.col_responsable": "Owner",
    "comp.mes.col_echeance": "Deadline",
    "comp.mes.col_recurrence": "Recurrence",
    "comp.mes.col_preuves": "Evidence",
    "comp.mes.col_exigences": "Requirements",
    "comp.mes.col_referentiels": "Frameworks",

    // Preuves
    "comp.prv.title": "Evidence — {label}",
    "comp.prv.btn_nouvelle": "+ New evidence",
    "comp.prv.search": "Search...",
    "comp.prv.count": "{count} evidence item(s)",
    "comp.prv.btn_supprimer": "Delete",
    "comp.prv.btn_valider": "Validate",
    "comp.prv.placeholder_label": "Label...",
    "comp.prv.placeholder_url": "URL...",
    "comp.prv.label_obtention": "Obtained:",
    "comp.prv.label_expiration": "Expires:",
    "comp.prv.placeholder_comment": "Comment...",
    "comp.prv.mesures_liees": "Linked controls",
    "comp.prv.aucune": "None",
    "comp.prv.fw_desc": "Evidence — {label}",

    // Preuves table headers
    "comp.prv.col_id": "ID",
    "comp.prv.col_label": "Label",
    "comp.prv.col_url": "URL",
    "comp.prv.col_obtention": "Obtained",
    "comp.prv.col_expiration": "Expiration",
    "comp.prv.col_mesures": "Controls",
    "comp.prv.col_statut": "Status",

    // Preuves statut badges
    "comp.prv.expiree": "Expired",
    "comp.prv.bientot": "Soon",
    "comp.prv.ok": "OK",

    // Plan d'action
    "comp.plan.btn_nouvelle": "+ New control",
    "comp.plan.search": "Search...",
    "comp.plan.count": "{count} control(s)",
    "comp.plan.aucune": "No controls.",

    // Contrôles
    "comp.ctrl.aucun": "No recurring controls or evidence expiring soon.",
    "comp.ctrl.alertes": "{count} alert(s)",
    "comp.ctrl.col_type": "Type",
    "comp.ctrl.col_id": "ID",
    "comp.ctrl.col_description": "Description",
    "comp.ctrl.col_details": "Details",
    "comp.ctrl.col_statut": "Status",
    "comp.ctrl.type_controle": "Control",
    "comp.ctrl.type_preuve": "Evidence",
    "comp.ctrl.dernier": "last",
    "comp.ctrl.jamais": "never",
    "comp.ctrl.en_retard": "Overdue",
    "comp.ctrl.ok": "OK",
    "comp.ctrl.expire": "Expires",

    // History
    "comp.hist.btn_creer": "+ Create snapshot",
    "comp.hist.btn_dechiffrer": "Decrypt snapshots",
    "comp.hist.btn_chiffrer": "Encrypt snapshots",
    "comp.hist.aucun": "No snapshots.",
    "comp.hist.col_nom": "Name",
    "comp.hist.col_date": "Date",
    "comp.hist.col_org": "Organization",
    "comp.hist.col_actions": "Actions",
    "comp.hist.btn_restaurer": "Restore",
    "comp.hist.btn_exporter": "Export",
    "comp.hist.note": "Snapshots are stored in the browser (localStorage).",

    // Confirm / Alert (app-specific)
    "comp.confirm.delete_mesure": "Delete control {id}?",
    "comp.confirm.delete_preuve": "Delete evidence {id}?",
    "comp.alert.no_mesure_type": "No control template available for this requirement ({ref}).",
    "comp.alert.all_linked": "All {count} suggested control(s) for {ref} are already linked to this requirement.",
    "comp.alert.mesures_prompt_title": "Suggested controls for {ref}:",
    "comp.alert.mesures_prompt_footer": "Enter number(s) to create (e.g. 1,3) or * for all:",
    "comp.status.mesures_created": "{count} control(s) created",
    "comp.status.preuve_created": "Evidence {id} created and linked",

    // Import EBIOS
    "comp.import.invalid": "This file does not appear to be a valid EBIOS RM file.",
    "comp.import.success": "EBIOS RM import successful: {name} ({count} controls)",
    "comp.import.error": "Import error: {msg}",

    // Error
    "comp.error.title": "Error",

    // Base frameworks
    "comp.fw.anssi_desc": "42 controls",
    "comp.fw.iso_desc": "120 requirements (27 ISMS clauses + 93 Annex A)",

    // _REFERENTIELS_CATALOG descriptions
    "comp.ref.gamp_desc": "Good Automated Manufacturing Practice — cybersecurity requirements for validated systems",
    "comp.ref.lpm_desc": "Military Programming Law (France) — ANSSI security rules for critical infrastructure operators",
    "comp.ref.loi0520_desc": "Moroccan cybersecurity law — obligations for regulated organizations",
    "comp.ref.dora_desc": "Digital Operational Resilience Act (EU 2022/2554) — digital resilience for the financial sector",
    "comp.ref.hds_desc": "Health Data Hosting Certification (France) — ISO 27001 complementary requirements",
    "comp.ref.secnumcloud_desc": "ANSSI qualification framework for Cloud service providers (v3.2)",
    "comp.ref.recyf_desc": "French Cyber Framework v2.5 — national transposition of NIS 2 Directive (ANSSI, March 2026)",
    "comp.ref.cra_desc": "EU Cyber Resilience Act (CRA 2024) — requirements for products with digital elements",
    "comp.ref.soc2_desc": "Trust Services Criteria (AICPA) — security, availability, integrity, confidentiality, privacy",

    // Sidebar — Help
    "comp.sidebar.section_aide": "Help",
    "comp.sidebar.methodo": "Methodology",
    "comp.sidebar.usage": "Usage",

    // Help tabs
    "comp.help.tab_methodo": "Compliance Methodology",
    "comp.help.tab_usage": "Application Usage",

    // ── Help content ──
    "comp.help.methodo": "<h1 class=\"heading-blue\">Methodology Guide — Compliance Tracking</h1>\n<p class=\"text-muted\">Multi-framework assessment, action plan and evidence</p>\n\n<h2>Introduction to Compliance</h2>\n<p><strong>Compliance tracking</strong> allows you to assess your organization's maturity against one or more <strong>security frameworks</strong> (standards, regulations, best practices). This is not a formal audit but a <strong>structured self-assessment</strong> that identifies gaps and drives corrective actions.</p>\n<p>The multi-framework approach is essential because organizations are typically subject to <strong>multiple simultaneous requirements</strong> (e.g., ISO 27001 + NIS 2 + HDS). The tool shares security controls across frameworks: a single control can address requirements from multiple frameworks.</p>\n\n<h2>Available Frameworks</h2>\n<p>The application offers <strong>11 built-in frameworks</strong> and the ability to import <strong>custom frameworks</strong> via CSV.</p>\n<table><thead><tr><th>Framework</th><th>Scope</th><th>Requirements</th></tr></thead><tbody>\n<tr><td><strong>ANSSI — Hygiene Guide</strong></td><td>42 essential cybersecurity measures published by ANSSI (France)</td><td>42</td></tr>\n<tr><td><strong>ISO 27001:2022</strong></td><td>Information Security Management System — 27 ISMS clauses + 93 Annex A controls</td><td>120</td></tr>\n<tr><td><strong>NIS 2</strong></td><td>EU Directive 2022/2555 — cybersecurity measures for essential and important entities</td><td>Variable</td></tr>\n<tr><td><strong>DORA</strong></td><td>Digital Operational Resilience Act (EU 2022/2554) — financial sector digital resilience</td><td>Variable</td></tr>\n<tr><td><strong>HDS</strong></td><td>Health Data Hosting Certification (France) — ISO 27001 complementary requirements</td><td>Variable</td></tr>\n<tr><td><strong>SecNumCloud</strong></td><td>ANSSI qualification for Cloud service providers (v3.2)</td><td>Variable</td></tr>\n<tr><td><strong>SOC 2</strong></td><td>Trust Services Criteria (AICPA) — security, availability, integrity, confidentiality, privacy</td><td>Variable</td></tr>\n<tr><td><strong>Cyber Resilience Act</strong></td><td>EU Cyber Resilience Act (CRA 2024) — products with digital elements</td><td>Variable</td></tr>\n<tr><td><strong>GAMP 5</strong></td><td>Good Automated Manufacturing Practice — cybersecurity for validated systems</td><td>Variable</td></tr>\n<tr><td><strong>LPM</strong></td><td>Military Programming Law (France) — ANSSI rules for critical infrastructure operators</td><td>Variable</td></tr>\n<tr><td><strong>Law 05-20 (Morocco)</strong></td><td>Moroccan cybersecurity law — obligations for regulated organizations</td><td>Variable</td></tr>\n</tbody></table>\n\n<h2>Custom Frameworks (CSV)</h2>\n<p>You can import your own frameworks in <strong>CSV</strong> format (separator <code>;</code>, <code>,</code> or tab). Expected columns:</p>\n<table><thead><tr><th>Column</th><th>Required</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>ref</strong></td><td>Yes</td><td>Unique requirement identifier (e.g., CUSTOM-01)</td></tr>\n<tr><td><strong>theme</strong></td><td>No</td><td>Category / theme</td></tr>\n<tr><td><strong>mesure</strong></td><td>Yes</td><td>Requirement label (or <code>measure</code>, <code>control</code>)</td></tr>\n<tr><td><strong>description</strong></td><td>No</td><td>Detailed description (or <code>details</code>)</td></tr>\n<tr><td><strong>theme_en</strong></td><td>No</td><td>English translation of the theme</td></tr>\n<tr><td><strong>mesure_en</strong></td><td>No</td><td>English translation of the requirement</td></tr>\n<tr><td><strong>description_en</strong></td><td>No</td><td>English translation of the description</td></tr>\n</tbody></table>\n<div class=\"help-tip\">A CSV template is available from the <strong>Context</strong> screen (\"Download CSV template\" link).</div>\n\n<h2>Compliance Assessment</h2>\n<p>For each <strong>requirement</strong> in a framework, you evaluate:</p>\n<table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>Applicable</strong></td><td>Does the requirement apply to your scope? (yes/no)</td></tr>\n<tr><td><strong>Status</strong></td><td>OK (all linked controls are completed with valid evidence) or KO</td></tr>\n<tr><td><strong>Comments</strong></td><td>Gap description or justification for non-applicability</td></tr>\n<tr><td><strong>Linked controls</strong></td><td>Security actions that address this requirement</td></tr>\n</tbody></table>\n<div class=\"help-tip\">A requirement's status is <strong>automatically calculated</strong>: it is OK if at least one control is linked AND all linked controls have a \"Completed\" status with at least one valid (non-expired) evidence item.</div>\n\n<h2>Compliance Rate Calculation</h2>\n<p>The <strong>compliance rate</strong> per framework is calculated as follows:</p>\n<ul>\n<li>Only <strong>applicable</strong> requirements are considered</li>\n<li>Rate = number of requirements with <strong>OK</strong> status / total applicable requirements &times; 100</li>\n<li>A requirement is OK when all its linked controls are completed with valid evidence</li>\n</ul>\n\n<h2>Action Plan</h2>\n<p><strong>Security controls</strong> are the concrete actions that address requirements. Each control has:</p>\n<table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>ID</strong></td><td>Auto-generated identifier (M-001, M-002...)</td></tr>\n<tr><td><strong>Description</strong></td><td>Control label</td></tr>\n<tr><td><strong>Details</strong></td><td>Detailed implementation description</td></tr>\n<tr><td><strong>Status</strong></td><td>Completed, In progress, Planned, Not started</td></tr>\n<tr><td><strong>Owner</strong></td><td>Person in charge</td></tr>\n<tr><td><strong>Deadline</strong></td><td>Target completion date</td></tr>\n<tr><td><strong>Recurrence</strong></td><td>One-time, Monthly, Quarterly, Semi-annual, Annual</td></tr>\n<tr><td><strong>Last check</strong></td><td>Date of last check for recurring controls</td></tr>\n<tr><td><strong>Linked evidence</strong></td><td>Documents or items attesting implementation</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Control templates</strong>: for some requirements, suggested controls are available. Click \"Suggest\" to see recommended controls and create them in one click. A single control can be linked to multiple requirements from different frameworks.</div>\n\n<h2>Evidence</h2>\n<p><strong>Evidence</strong> items document the effective implementation of controls. Each evidence item has:</p>\n<table><thead><tr><th>Field</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>ID</strong></td><td>Auto-generated identifier (P-001, P-002...)</td></tr>\n<tr><td><strong>Label</strong></td><td>Evidence name</td></tr>\n<tr><td><strong>URL</strong></td><td>Link to the document (SharePoint, DMS, etc.)</td></tr>\n<tr><td><strong>Obtained date</strong></td><td>When the evidence was collected</td></tr>\n<tr><td><strong>Expiration date</strong></td><td>When the evidence loses its validity</td></tr>\n</tbody></table>\n<div class=\"help-tip\">If all evidence items of a \"Completed\" control are expired, its status automatically changes to <strong>\"Missing evidence\"</strong>. This enables evidence renewal tracking.</div>\n\n<h2>Global Dashboard</h2>\n<p>The global dashboard displays:</p>\n<ul>\n<li><strong>One card per active framework</strong>: compliance rate (OK / KO), applicable requirements count, controls and evidence count</li>\n<li><strong>Ongoing actions</strong>: incomplete controls with their status and deadline</li>\n<li><strong>Expiring evidence</strong>: evidence expiring within the next 90 days</li>\n<li><strong>Global counters</strong>: total controls, completed, in progress, planned</li>\n</ul>\n\n<h2>Interoperability</h2>\n<h3>EBIOS RM Import</h3>\n<p>You can import a JSON file from the <strong>Risk</strong> module (EBIOS RM). The import retrieves:</p>\n<ul>\n<li>The <strong>context</strong> (organization, date, comments)</li>\n<li><strong>Workshop 5 controls</strong> (treatment plan), converted to compliance controls</li>\n<li><strong>Security baseline compliance</strong> (ANSSI or ISO), mapped to corresponding requirements</li>\n</ul>\n<div class=\"help-tip\">The EBIOS RM import is <strong>cumulative</strong>: existing controls are not deleted. Duplicates (same description) are automatically deduplicated.</div>",

    "comp.help.usage": "<h1 class=\"heading-blue\">Usage Guide</h1>\n<p class=\"text-muted\">How to use the compliance tracking application</p>\n\n<h2>Overview</h2>\n<p>The application is organized in <strong>3 areas</strong>: the <strong>toolbar</strong> at the top (File menu, settings), the <strong>sidebar</strong> on the left (navigation) and the <strong>work area</strong> in the center.</p>\n<div class=\"help-tip\">All data stays in your browser. No information is sent to a server (unless the AI assistant is active). Remember to save regularly as JSON.</div>\n\n<h2>Context</h2>\n<p>The <strong>Context</strong> screen allows you to:</p>\n<ul>\n<li>Enter assessment information: organization, date, assessor, scope, comments</li>\n<li><strong>Activate frameworks</strong>: click on the colored chips to enable/disable a framework. An activated framework appears in the sidebar.</li>\n<li><strong>Import a CSV framework</strong>: click \"Import framework (CSV)\" to load a custom framework</li>\n</ul>\n<div class=\"help-tip\">You can activate <strong>multiple frameworks simultaneously</strong>. Security controls are shared across frameworks: one control can cover ANSSI, ISO and NIS 2 requirements at once.</div>\n\n<h2>Dashboard</h2>\n<p>The global <strong>Dashboard</strong> displays a summary of all active frameworks. Each card shows the compliance rate, control count and alerts (soon-expiring evidence).</p>\n\n<h2>Framework View</h2>\n<p>Click on a framework in the sidebar to open its dedicated view with 4 sub-tabs:</p>\n<table><thead><tr><th>Sub-tab</th><th>Content</th></tr></thead><tbody>\n<tr><td><strong>Dashboard</strong></td><td>Framework summary: compliance, ongoing controls, expiring evidence</td></tr>\n<tr><td><strong>Requirements</strong></td><td>All requirements with status, applicability, linked controls</td></tr>\n<tr><td><strong>Controls</strong></td><td>Security controls linked to this framework</td></tr>\n<tr><td><strong>Evidence</strong></td><td>Evidence linked to this framework's controls</td></tr>\n</tbody></table>\n\n<h2>Evaluating Requirements</h2>\n<p>In the <strong>Requirements</strong> tab of each framework:</p>\n<ul>\n<li><strong>Applicable</strong>: check/uncheck to indicate if the requirement applies. If not applicable, a justification field appears.</li>\n<li><strong>Comments</strong>: describe the gap or observations</li>\n<li><strong>Linked controls</strong>: link existing controls via the searchable dropdown, or create a new control with \"+ New\"</li>\n<li><strong>Suggest</strong>: shows recommended control templates for this requirement and lets you create them in one click</li>\n</ul>\n\n<h2>Action Plan</h2>\n<p>The <strong>Action plan</strong> screen (sidebar) shows all incomplete controls across all frameworks. For each control:</p>\n<ul>\n<li>Edit description, status, owner, deadline</li>\n<li>Set a <strong>recurrence</strong> (monthly, quarterly, etc.) for regular checks</li>\n<li>Link existing <strong>evidence</strong> or create new ones</li>\n<li>View <strong>covered requirements</strong> for this control (multi-framework)</li>\n</ul>\n\n<h2>Evidence</h2>\n<p>Evidence is managed from the <strong>Evidence</strong> tab of a framework or from control detail views:</p>\n<ul>\n<li>Create evidence: label, URL, obtained date, expiration date</li>\n<li>Link to one or more controls</li>\n<li>Expired or soon-expiring evidence appears in dashboard alerts</li>\n</ul>\n\n<h2>Controls Monitoring</h2>\n<p>The <strong>Controls</strong> screen groups monitoring alerts:</p>\n<ul>\n<li><strong>Overdue recurring controls</strong>: controls with recurrence whose last check exceeds the deadline</li>\n<li><strong>Expiring evidence</strong>: evidence with expiration date approaching (90 days)</li>\n</ul>\n\n<h2>CSV Import</h2>\n<p>To import a custom framework:</p>\n<ul>\n<li>Go to <strong>Context</strong></li>\n<li>Click <strong>\"Import framework (CSV)\"</strong></li>\n<li>Select a CSV file with at least <code>ref</code> and <code>mesure</code> columns</li>\n<li>Name the framework when prompted</li>\n<li>The framework appears in the activatable chips</li>\n</ul>\n<div class=\"help-tip\">The separator is auto-detected (semicolon, comma or tab). Download the CSV template from the Context screen to see the expected format.</div>\n\n<h2>EBIOS RM Import</h2>\n<p>To import from the Risk module:</p>\n<ul>\n<li>Menu <strong>File → Import EBIOS RM</strong></li>\n<li>Select the JSON file exported from the EBIOS RM application</li>\n<li>Treatment controls and baseline compliance are imported automatically</li>\n</ul>\n\n<h2>AI Assistant</h2>\n<p>The AI assistant is an optional module (disabled by default) that provides contextual suggestions:</p>\n<ul>\n<li><strong>Gap analysis</strong>: identification of uncovered requirements</li>\n<li><strong>Control recommendations</strong>: security actions adapted to context</li>\n<li><strong>Evidence recommendations</strong>: expected evidence types for each control</li>\n</ul>\n<div class=\"help-tip\"><strong>Important</strong>: enabling the AI assistant means sending data to the chosen AI provider. Verify that your privacy policy allows this.</div>\n\n<h2>Settings</h2>\n<p>Click the <strong>gear icon</strong> (&#9881;) in the toolbar to access settings:</p>\n<ul>\n<li><strong>Language</strong>: switch between French and English</li>\n<li><strong>AI assistant</strong>: enable/disable, choose provider (Anthropic/OpenAI), model and API key</li>\n<li><strong>Demo data</strong>: load a test dataset (MedSecure)</li>\n</ul>\n\n<h2>File Management</h2>\n<p>The <strong>File</strong> menu provides:</p>\n<table><thead><tr><th>Action</th><th>Format</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>Open</strong></td><td>.json / .json.enc</td><td>Load a JSON (or encrypted) file and replace all data</td></tr>\n<tr><td><strong>Save</strong></td><td>.json</td><td>Quick save of the current file</td></tr>\n<tr><td><strong>Save as</strong></td><td>.json / .json.enc</td><td>Save with optional AES-256 password encryption</td></tr>\n<tr><td><strong>Import EBIOS RM</strong></td><td>.json</td><td>Import data from an EBIOS RM file</td></tr>\n<tr><td><strong>New assessment</strong></td><td>—</td><td>Start from scratch (current data is lost)</td></tr>\n</tbody></table>\n\n<h2>History and Undo</h2>\n<h3>Undo / Redo</h3>\n<p>Each change is recorded in history (50 levels maximum):</p>\n<ul>\n<li><strong>Ctrl+Z</strong> (or Cmd+Z on Mac): undo last change</li>\n<li><strong>Ctrl+Y</strong> (or Cmd+Y on Mac): redo undone change</li>\n</ul>\n<h3>Snapshots</h3>\n<p>Snapshots are named save points stored in the browser:</p>\n<ul>\n<li><strong>Create a snapshot</strong>: click \"+ Create snapshot\" in the Snapshots tab</li>\n<li><strong>Restore</strong>: return to the exact snapshot state</li>\n<li><strong>Export</strong>: download a snapshot as a JSON file</li>\n<li><strong>Encrypt</strong>: enable encryption of all browser snapshots</li>\n</ul>\n<div class=\"help-tip\"><strong>Warning</strong>: snapshots are stored in localStorage. If you clear browser data, they will be lost. Regularly export important snapshots.</div>\n\n<h2>Data Security</h2>\n<ul>\n<li><strong>No server transmission</strong>: all data stays in your browser (unless the AI assistant is active)</li>\n<li><strong>JSON encryption</strong>: AES-256-GCM with PBKDF2-derived key (250,000 iterations)</li>\n<li><strong>Snapshot encryption</strong>: option to encrypt localStorage data</li>\n<li><strong>Import validation</strong>: each imported JSON file is validated before loading</li>\n</ul>\n\n<h2>Keyboard Shortcuts</h2>\n<table><thead><tr><th>Shortcut</th><th>Action</th></tr></thead><tbody>\n<tr><td><strong>Ctrl+S</strong> / <strong>Cmd+S</strong></td><td>Save</td></tr>\n<tr><td><strong>Ctrl+Z</strong> / <strong>Cmd+Z</strong></td><td>Undo</td></tr>\n<tr><td><strong>Ctrl+Y</strong> / <strong>Cmd+Y</strong></td><td>Redo</td></tr>\n<tr><td><strong>Escape</strong></td><td>Close help panel</td></tr>\n</tbody></table>\n\n<h2>Best Practices</h2>\n<ul>\n<li><strong>Save often</strong>: File &rarr; Save regularly, especially before closing the browser</li>\n<li><strong>Activate the right frameworks</strong>: only enable frameworks relevant to your scope</li>\n<li><strong>Share controls</strong>: one control can address requirements from multiple frameworks</li>\n<li><strong>Document evidence</strong>: a control without evidence stays KO, even if marked \"Completed\"</li>\n<li><strong>Monitor controls</strong>: the Controls screen signals expired evidence and overdue checks</li>\n<li><strong>Use snapshots</strong>: create a snapshot before each important work session</li>\n</ul>",

    // Footer
    "comp.footer": "Compliance Tracking — Editable data, JSON backup",

    "matrix.low": "Low",
    "matrix.moderate": "Moderate",
    "matrix.significant": "Significant",
    "matrix.high": "High",
    "matrix.critical": "Critical",
    "matrix.extreme": "Extreme",
    "matrix.x": "Impact",
    "matrix.y": "Likelihood",
"comp.csv.btn_import": "Import framework (CSV)",
    "comp.csv.download_template": "Download CSV template",
    "comp.csv.prompt_name": "Framework name:",
    "comp.csv.custom_desc": "Custom framework ({count} controls)",
    "comp.csv.imported": "{label} imported ({count} controls)",
    "comp.csv.error_empty": "CSV file is empty or invalid",
    "comp.csv.error_columns": "Required columns missing: ref and mesure (or measure/control)",
    "comp.csv.error_no_measures": "No valid controls found in CSV",
});
