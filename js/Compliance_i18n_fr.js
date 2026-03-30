// Compliance — French translations
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
    "comp.ref.nis2_desc": "Directive NIS 2 (UE 2022/2555) — mesures de cybersécurité pour entités essentielles et importantes",
    "comp.ref.cra_desc": "Règlement UE sur la cyber-résilience (CRA 2024) — exigences pour produits comportant des éléments numériques",
    "comp.ref.soc2_desc": "Trust Services Criteria (AICPA) — sécurité, disponibilité, intégrité, confidentialité, vie privée",

    // Footer
    "comp.footer": "Suivi de Conformité — Données modifiables, sauvegarde JSON"
});
