// ═══════════════════════════════════════════════════════════════════════
// TRADUCTIONS — Compliance (FR/EN)
// ═══════════════════════════════════════════════════════════════════════

_registerTranslations("fr", {
    // Label app
    "comp.label": "évaluation",

    // Titre
    "comp.title": "Suivi de Conformité",

    // Toolbar / Menu
    "comp.menu.import_ebios": "Import EBIOS RM",
    "comp.menu.new_assessment": "Nouvelle évaluation",

    // Sidebar — sections
    "comp.sidebar.global": "Suivi global",
    "comp.sidebar.context": "Contexte",
    "comp.sidebar.dashboard": "Tableau de bord",
    "comp.sidebar.plan": "Plan d'action",
    "comp.sidebar.controles": "Contrôles",
    "comp.sidebar.frameworks": "Référentiels",
    "comp.sidebar.history_section": "Historique",
    "comp.sidebar.snapshots": "Snapshots",

    // Sidebar — sub-views
    "comp.subview.dashboard": "Dashboard",
    "comp.subview.exigences": "Exigences",
    "comp.subview.mesures": "Mesures",
    "comp.subview.preuves": "Preuves",

    // Panel descriptions
    "comp.panel.dashboard_desc": "Vue d'ensemble de la conformité.",
    "comp.panel.context_desc": "Informations sur l'évaluation et sélection des référentiels.",
    "comp.panel.plan_desc": "Toutes les mesures non terminées, tous référentiels confondus.",
    "comp.panel.controles_desc": "Suivi des contrôles récurrents et des preuves arrivant à expiration.",
    "comp.panel.history_desc": "Points de sauvegarde et historique des modifications.",

    // Context form
    "comp.context.organisation": "Organisation",
    "comp.context.date": "Date",
    "comp.context.evaluateur": "Évaluateur",
    "comp.context.perimetre": "Périmètre",
    "comp.context.commentaires": "Commentaires",
    "comp.context.frameworks_heading": "Référentiels de conformité",

    // Statut labels
    "comp.statut.planifie": "Planifié",
    "comp.statut.en_cours": "En cours",
    "comp.statut.termine": "Terminé",
    "comp.statut.preuve_manquante": "Preuve manquante",

    // Exigence statut
    "comp.exig_statut.ok": "OK",
    "comp.exig_statut.ko": "KO",
    "comp.exig_statut.na": "N/A",

    // Recurrence labels
    "comp.rec.ponctuel": "Ponctuel",
    "comp.rec.mensuelle": "Mensuelle",
    "comp.rec.trimestrielle": "Trimestrielle",
    "comp.rec.semestrielle": "Semestrielle",
    "comp.rec.annuelle": "Annuelle",

    // Dashboard
    "comp.dash.no_framework": "Aucun référentiel sélectionné. Allez dans <strong>Contexte</strong> pour en choisir.",
    "comp.dash.mesures": "Mesures",
    "comp.dash.total": "Total",
    "comp.dash.terminees": "Terminées",
    "comp.dash.en_cours": "En cours",
    "comp.dash.planifiees": "Planifiées",

    // FW Dashboard
    "comp.fw_dash.conformite": "Conformité ({ok} OK / {ko} KO)",
    "comp.fw_dash.exigences_applicables": "Exigences applicables",
    "comp.fw_dash.mesures": "Mesures",
    "comp.fw_dash.preuves": "Preuves",
    "comp.fw_dash.actions_en_cours": "Actions en cours ({count})",
    "comp.fw_dash.preuves_expirant": "Preuves expirant sous 90 jours ({count})",

    // FW Dashboard table headers
    "comp.fw_dash.col_id": "ID",
    "comp.fw_dash.col_description": "Description",
    "comp.fw_dash.col_statut": "Statut",
    "comp.fw_dash.col_echeance": "Échéance",
    "comp.fw_dash.col_label": "Label",
    "comp.fw_dash.col_expiration": "Expiration",

    // Exigences
    "comp.exig.title": "Exigences — {label}",
    "comp.exig.search": "Rechercher...",
    "comp.exig.count": "{filtered} / {total} exigences",
    "comp.exig.col_ref": "Réf.",
    "comp.exig.col_theme": "Thématique",
    "comp.exig.col_mesure": "Mesure",
    "comp.exig.col_appl": "Appl.",
    "comp.exig.col_statut": "Statut",
    "comp.exig.col_commentaires": "Commentaires",
    "comp.exig.col_mesures_liees": "Mesures liées",
    "comp.exig.placeholder_na": "Raison N/A...",
    "comp.exig.placeholder_comments": "Commentaires...",
    "comp.exig.en_place": "En place",
    "comp.exig.prevues": "Prévues",
    "comp.exig.lier_mesure": "Lier une mesure...",
    "comp.exig.btn_nouvelle": "+ Nouvelle",
    "comp.exig.btn_proposer": "Proposer",
    "comp.exig.fw_desc": "Exigences — {label}",

    // Mesures
    "comp.mes.title": "Mesures — {label}",
    "comp.mes.btn_nouvelle": "+ Nouvelle mesure",
    "comp.mes.search": "Rechercher...",
    "comp.mes.count": "{count} mesure(s)",
    "comp.mes.btn_supprimer": "Supprimer",
    "comp.mes.btn_valider": "Valider",
    "comp.mes.placeholder_desc": "Description...",
    "comp.mes.placeholder_details": "Détails de mise en œuvre...",
    "comp.mes.label_statut": "Statut :",
    "comp.mes.label_echeance": "Échéance :",
    "comp.mes.label_responsable": "Responsable :",
    "comp.mes.label_recurrence": "Récurrence :",
    "comp.mes.label_dernier_controle": "Dernier contrôle :",
    "comp.mes.exigences_liees": "Exigences liées",
    "comp.mes.preuves_liees": "Preuves liées",
    "comp.mes.lier_preuve": "Lier une preuve...",
    "comp.mes.btn_nouvelle_preuve": "+ Nouvelle preuve",
    "comp.mes.lier_exigence": "Lier à une exigence...",
    "comp.mes.fw_desc": "Mesures — {label}",

    // Mesures table headers
    "comp.mes.col_id": "ID",
    "comp.mes.col_description": "Description",
    "comp.mes.col_statut": "Statut",
    "comp.mes.col_responsable": "Responsable",
    "comp.mes.col_echeance": "Échéance",
    "comp.mes.col_recurrence": "Récurrence",
    "comp.mes.col_preuves": "Preuves",
    "comp.mes.col_exigences": "Exigences",
    "comp.mes.col_referentiels": "Référentiels",

    // Preuves
    "comp.prv.title": "Preuves — {label}",
    "comp.prv.btn_nouvelle": "+ Nouvelle preuve",
    "comp.prv.search": "Rechercher...",
    "comp.prv.count": "{count} preuve(s)",
    "comp.prv.btn_supprimer": "Supprimer",
    "comp.prv.btn_valider": "Valider",
    "comp.prv.placeholder_label": "Label...",
    "comp.prv.placeholder_url": "URL...",
    "comp.prv.label_obtention": "Date d'obtention :",
    "comp.prv.label_expiration": "Date d'expiration :",
    "comp.prv.placeholder_comment": "Commentaire...",
    "comp.prv.mesures_liees": "Mesures liées",
    "comp.prv.aucune": "Aucune",
    "comp.prv.fw_desc": "Preuves — {label}",

    // Preuves table headers
    "comp.prv.col_id": "ID",
    "comp.prv.col_label": "Label",
    "comp.prv.col_url": "URL",
    "comp.prv.col_obtention": "Obtention",
    "comp.prv.col_expiration": "Expiration",
    "comp.prv.col_mesures": "Mesures",
    "comp.prv.col_statut": "Statut",

    // Preuves statut badges
    "comp.prv.expiree": "Expirée",
    "comp.prv.bientot": "Bientôt",
    "comp.prv.ok": "OK",

    // Plan d'action
    "comp.plan.btn_nouvelle": "+ Nouvelle mesure",
    "comp.plan.search": "Rechercher...",
    "comp.plan.count": "{count} mesure(s)",
    "comp.plan.aucune": "Aucune mesure.",

    // Contrôles
    "comp.ctrl.aucun": "Aucun contrôle récurrent ni preuve expirant prochainement.",
    "comp.ctrl.alertes": "{count} alerte(s)",
    "comp.ctrl.col_type": "Type",
    "comp.ctrl.col_id": "ID",
    "comp.ctrl.col_description": "Description",
    "comp.ctrl.col_details": "Détails",
    "comp.ctrl.col_statut": "Statut",
    "comp.ctrl.type_controle": "Contrôle",
    "comp.ctrl.type_preuve": "Preuve",
    "comp.ctrl.dernier": "dernier",
    "comp.ctrl.jamais": "jamais",
    "comp.ctrl.en_retard": "En retard",
    "comp.ctrl.ok": "OK",
    "comp.ctrl.expire": "Expire",

    // History
    "comp.hist.btn_creer": "+ Créer un point de sauvegarde",
    "comp.hist.btn_dechiffrer": "Déchiffrer les snapshots",
    "comp.hist.btn_chiffrer": "Chiffrer les snapshots",
    "comp.hist.aucun": "Aucun snapshot.",
    "comp.hist.col_nom": "Nom",
    "comp.hist.col_date": "Date",
    "comp.hist.col_org": "Organisation",
    "comp.hist.col_actions": "Actions",
    "comp.hist.btn_restaurer": "Restaurer",
    "comp.hist.btn_exporter": "Exporter",
    "comp.hist.note": "Les snapshots sont stockés dans le navigateur (localStorage).",

    // Confirm / Alert (app-specific)
    "comp.confirm.delete_mesure": "Supprimer la mesure {id} ?",
    "comp.confirm.delete_preuve": "Supprimer la preuve {id} ?",
    "comp.alert.no_mesure_type": "Aucune mesure type disponible pour cette exigence ({ref}).",
    "comp.alert.all_linked": "Les {count} mesure(s) proposée(s) pour {ref} sont déjà liées à cette exigence.",
    "comp.alert.mesures_prompt_title": "Mesures proposées pour {ref} :",
    "comp.alert.mesures_prompt_footer": "Entrez le(s) numéro(s) à créer (ex: 1,3) ou * pour tout :",
    "comp.status.mesures_created": "{count} mesure(s) créée(s)",
    "comp.status.preuve_created": "Preuve {id} créée et liée",

    // Import EBIOS
    "comp.import.invalid": "Ce fichier ne semble pas être un fichier EBIOS RM valide.",
    "comp.import.success": "Import EBIOS RM réussi : {name} ({count} mesures)",
    "comp.import.error": "Erreur d'import : {msg}",

    // Error
    "comp.error.title": "Erreur",

    // Base frameworks
    "comp.fw.anssi_desc": "42 mesures",
    "comp.fw.iso_desc": "120 exigences (27 clauses SMSI + 93 Annexe A)",

    // _REFERENTIELS_CATALOG descriptions
    "comp.ref.gamp_desc": "Good Automated Manufacturing Practice — exigences cybersécurité pour systèmes validés",
    "comp.ref.lpm_desc": "Loi de Programmation Militaire (France) — règles de sécurité des arrêtés sectoriels ANSSI pour OIV",
    "comp.ref.loi0520_desc": "Loi marocaine sur la cybersécurité — obligations des organismes soumis",
    "comp.ref.dora_desc": "Digital Operational Resilience Act (UE 2022/2554) — résilience numérique du secteur financier",
    "comp.ref.hds_desc": "Certification Hébergeur de Données de Santé (France) — exigences complémentaires ISO 27001",
    "comp.ref.secnumcloud_desc": "Référentiel de qualification ANSSI pour les prestataires de services Cloud (v3.2)",
    "comp.ref.recyf_desc": "Référentiel Cyber France v2.5 — transposition nationale NIS 2 (ANSSI, mars 2026)",
    "comp.ref.cra_desc": "Règlement UE sur la cyber-résilience (CRA 2024) — exigences pour produits comportant des éléments numériques",
    "comp.ref.soc2_desc": "Trust Services Criteria (AICPA) — sécurité, disponibilité, intégrité, confidentialité, vie privée",

    // Footer
    "comp.footer": "Suivi de Conformité — Données modifiables, sauvegarde JSON"
});

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

    // Footer
    "comp.footer": "Compliance Tracking — Editable data, JSON backup"
});
