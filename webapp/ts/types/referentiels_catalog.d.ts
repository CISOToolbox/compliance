// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — additional frameworks (catalog)
 *
 * Single source for both apps (EBIOS RM + Compliance).
 * Each app copies this file into its js/ directory.
 *
 * Label, FR/EN description and colour for each framework.
 * The detailed measures are lazy-loaded through _ensureFramework().
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
