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
    "comp.ref.nis2_desc": "NIS 2 Directive (EU 2022/2555) — cybersecurity requirements for essential and important entities",
    "comp.ref.cra_desc": "EU Cyber Resilience Act (CRA 2024) — requirements for products with digital elements",
    "comp.ref.soc2_desc": "Trust Services Criteria (AICPA) — security, availability, integrity, confidentiality, privacy",

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
