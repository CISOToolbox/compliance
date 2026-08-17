// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/gen/backend/referentiels_catalog.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — Référentiels complémentaires (catalogue)
 *
 * Source unique pour les deux apps (EBIOS RM + Compliance).
 * Chaque app copie ce fichier dans son répertoire js/.
 *
 * Label, description FR/EN, couleur pour chaque référentiel.
 * Les mesures détaillées sont chargées à la demande via _ensureFramework().
 */
interface CtCatalogEntry {
    label: string;
    description: string;
    description_en: string;
    color: string;
    /** DB-backed builds (compliance frameworks API) expose a count. */
    requirement_count?: number;
}
interface Window {
    _REFERENTIELS_CATALOG: Record<string, CtCatalogEntry>;
    /** Lazy framework loader — defined by compliance_api.ts on the DB-backed build. */
    _ensureFramework?: (fwId: string, cb: () => void) => void;
}
