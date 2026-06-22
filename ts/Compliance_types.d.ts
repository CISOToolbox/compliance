/**
 * Compliance_types.d.ts — modèle de données de l'app Compliance.
 * Fichier de types pur (aucun emit). Déduit des usages de
 * Compliance_app.js / Compliance_data.js / Compliance_ref_*.js.
 */

/* ── Modèle D ───────────────────────────────────────────────────── */

interface ComplianceMeta {
    tool: string;
    version: string;
    societe: string;
    date_evaluation: string;
    evaluateur: string;
    perimetre: string;
    commentaires: string;
}

/** Entrée d'exigence d'un référentiel dans D.referentiels[fwId]. */
interface ComplianceExigence {
    ref: string;
    /** Id backend (présent en mode suite, absent en opensource pur). */
    id?: string;
    thematique?: string;
    thematique_en?: string;
    theme?: string;
    theme_en?: string;
    mesure?: string;
    mesure_en?: string;
    description?: string;
    description_en?: string;
    /** "" (oui par défaut) | "non" | booléen (checkbox). */
    applicable?: boolean | string;
    conformite?: string;
    ecart?: string;
    mesures_prevues?: string;
    mesures_ids?: string[];
    /** Ancien format (migration socle_anssi). */
    num?: string;
}

/** Statuts normalisés par _normStatut : planifie | en_cours | termine | preuve_manquante. */
interface ComplianceMesure {
    id: string;
    description: string;
    details?: string;
    statut: string;
    date_cible: string;
    responsable: string;
    recurrence: string;
    dernier_controle: string;
    preuves_ids: string[];
}

interface CompliancePreuve {
    id: string;
    label: string;
    url: string;
    date_obtention: string;
    date_expiration: string;
    commentaire: string;
}

/** Définition d'un contrôle dans un référentiel chargé (COMPLIANCE_REF / catalog). */
interface ComplianceRefMeasure {
    ref: string;
    theme?: string;
    theme_en?: string;
    mesure?: string;
    mesure_en?: string;
    description?: string;
    description_en?: string;
    linked_controls?: string[];
    type?: string;
    category?: string;
}

/** Contrôle de référence ISO (reference_controls de Compliance_ref_iso). */
interface ComplianceRefControl {
    ref: string;
    mesure?: string;
    mesure_en?: string;
    description?: string;
    description_en?: string;
    category?: string;
    type?: string;
}

/** Entrée de window.COMPLIANCE_REF (fichiers Compliance_ref_*.js + imports CSV). */
interface ComplianceRefEntry {
    id?: string;
    version?: string;
    label: string;
    description?: string;
    description_en?: string;
    color?: string;
    measures: ComplianceRefMeasure[];
    reference_controls?: ComplianceRefControl[];
    custom?: boolean;
}

/** Métadonnées d'un référentiel pour l'UI (REFERENTIELS_META / _BASE_FRAMEWORKS). */
interface ComplianceFwMeta {
    label: string;
    description?: string;
    description_en?: string;
    color?: string;
    custom?: boolean;
    measures?: ComplianceRefMeasure[];
}

interface ComplianceCustomFramework {
    label: string;
    color: string;
    measures: ComplianceRefMeasure[];
}

/** Mesure type du catalogue COMPLIANCE_MESURES_TYPES. */
interface ComplianceMesureType {
    id: string;
    categorie: string;
    categorie_en?: string;
    description: string;
    description_en?: string;
    details: string;
    details_en?: string;
    /** fwId → refs d'exigences couvertes. */
    exigences: Record<string, string[]>;
}

/** Données initiales (COMPLIANCE_INIT_DATA) et modèle D. */
interface ComplianceInitData {
    meta: ComplianceMeta;
    referentiels_actifs: string[];
    referentiels: Record<string, ComplianceExigence[]>;
    mesures: ComplianceMesure[];
    preuves: CompliancePreuve[];
}

interface ComplianceData extends ComplianceInitData {
    _custom_frameworks?: Record<string, ComplianceCustomFramework>;
    /* Ancien format, migré puis supprimé par ensureKeys() */
    socle_anssi?: ComplianceExigence[];
    socle_iso?: ComplianceExigence[];
    socle_complementaires?: Record<string, Record<string, Partial<ComplianceExigence>>>;
    socle_type?: unknown;
}

/* ── Suggestions / analyse IA (Compliance_ai_assistant) ─────────── */

interface ComplianceAiSuggestion {
    id?: string;
    description?: string;
    details?: string;
    responsable?: string;
    statut?: string;
    _accepted?: boolean;
}

interface ComplianceAiGlobalUpdate {
    ref?: string;
    status?: string;
    conformite?: string;
    ecart?: string;
    mesures?: ComplianceAiSuggestion[];
    _applied?: boolean;
}

/* ── Contexte des modales / propositions ────────────────────────── */

interface CompliancePropositionsCtx {
    fwId: string;
    idx: number;
    exigRef: string;
    entry: ComplianceExigence;
    available: ComplianceMesureType[];
    accepted: number;
}

interface CompliancePendingExigOp {
    fwId: string;
    idx: number;
    entryId?: string;
}

/** Client API backend (absent en opensource — chargé par compliance_api.js en mode suite). */
interface ComplianceAPIShape {
    get(projectId: string): Promise<{ data?: Record<string, unknown> }>;
    createMeasure(projectId: string | null, payload: Record<string, unknown>): Promise<ComplianceMesure>;
}

/* ── Globals window posés par l'app ─────────────────────────────── */

interface Window {
    COMPLIANCE_INIT_DATA?: ComplianceInitData;
    COMPLIANCE_REF?: Record<string, ComplianceRefEntry>;
    COMPLIANCE_DESCRIPTIONS?: Record<string, Record<string, string>>;
    COMPLIANCE_MESURES_TYPES?: ComplianceMesureType[];

    /* Mode suite (non chargés en opensource) */
    ComplianceAPI?: ComplianceAPIShape;
    _getActiveProjectId?: () => string | null;
    _appInitCallback?: () => void;

    /* État partagé des modales */
    _propositionsCtx?: CompliancePropositionsCtx | null;
    _pendingExigLinks?: CompliancePendingExigOp[];
    _pendingExigUnlinks?: CompliancePendingExigOp[];
    _pendingPreuveLinks?: string[];
    _pendingPreuveUnlinks?: string[];

    /* Handlers globaux exposés via window.X = … */
    _acceptProposition?: (i: number) => void;
    _rejectProposition?: (i: number) => void;
    _acceptAllPropositions?: () => void;
    _closePropositionsModal?: () => void;
    downloadCSVTemplate?: () => void;
    importCustomCSV?: () => void;
    _refreshMeasures?: () => void;
    _editMesureRow?: (row: { id: string; __fwId?: string | null }) => void;
    _createMesureUnified?: (fwId: string | null, linkIdx: number | null) => void;
    _linkExigInModal?: (mesureId: string, val: string) => void;
    _unlinkExigInModal?: (mesureId: string, fwId: string, idx: number) => void;
    _linkPreuveInModal?: (mesureId: string, preuveId: string) => void;
    _unlinkPreuveInModal?: (mesureId: string, preuveId: string) => void;
    _editPreuveFromModal?: (mesureId: string, preuveId: string) => void;
    _createAndLinkPreuveInModal?: (mesureId: string) => void;
    _bulkComplianceMesuresDone?: (scope: string) => void;
    _bulkComplianceMesuresDelete?: (scope: string) => void;
    _validateDraftMesure?: () => void;
    _cancelDraftMesure?: () => void;
    _closeMesureModal?: () => void;
    _deleteMesureModal?: (mesureId: string) => void;
    _linkMesureToExig?: (mesureId: string, currentFwId: string | null, val: string) => void;
    _unlinkMesureFromEdit?: (mesureId: string, fwId: string, idx: number, currentFwId: string | null) => void;
    _linkExistingPreuve?: (mesureId: string, fwId: string, preuveId: string) => void;
    _unlinkPreuve?: (mesureId: string, preuveId: string, fwId: string) => void;
    _createAndLinkPreuve?: (mesureId: string, fwId: string) => void;
    _goEditPreuveFromMesure?: (fwId: string, mesureId: string, preuveId: string) => void;
    _closePreuveModal?: () => void;
    _deletePreuveModal?: (preuveId: string) => void;
    _unlinkPreuvePlan?: (mesureId: string, preuveId: string) => void;
    _linkExistingPreuvePlan?: (mesureId: string, preuveId: string) => void;
    _createAndLinkPreuvePlan?: (mesureId: string) => void;
    _bulkCompliancePlanDone?: (scope: string) => void;
    _bulkCompliancePlanDelete?: (scope: string) => void;
    aiSuggestControls?: (fwId: string, idx: number) => void;
    aiGlobalAnalysis?: (fwId: string) => void;
    /** Réassigné par Compliance_ai_assistant pour injecter les boutons IA. */
    _renderFwExigences?: (fwId: string, label: string) => void;
}

/* ── Extensions d'interfaces partagées (declaration merging) ────── */

/** Frameworks custom importés par CSV. */
interface CtCatalogEntry {
    custom?: boolean;
}

/** Compliance_app passe un champ `data` aux actions ct_bulkbar (ignoré par la lib). */
interface CtBulkbarAction {
    data?: Record<string, unknown>;
}

/** Brouillon de mesure (pas encore d'id — généré à la validation). */
type ComplianceMesureDraft = Omit<ComplianceMesure, "id">;
