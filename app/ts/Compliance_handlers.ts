// Handlers this page renders in data-click / data-change / data-input: the
// event dispatcher calls no other name (see _ctDeclareHandlers in
// cisotoolbox.js). tests/test_dispatch_allowlist.py fails on a missing one.
_ctDeclareHandlers([
    "_acceptAllPropositions", "_acceptProposition", "_addMesurePlan", "_addPreuveGlobal",
    "_bulkComplianceMesuresDelete", "_bulkComplianceMesuresDone", "_bulkCompliancePlanDelete",
    "_bulkCompliancePlanDone", "_bulkCompliancePreuvesDelete", "_cancelDraftMesure",
    "_closeMesureModal", "_closePreuveModal", "_closePropositionsModal", "_createAndLinkMesure",
    "_createAndLinkPreuve", "_createAndLinkPreuveInModal", "_declareNcExig", "_deleteMesureModal",
    "_deletePreuveModal", "_doImportEbiosRM", "_editMesureRow", "_editPreuveFromModal",
    "_editPreuveRow", "_filterExigences", "_filterMesures", "_filterPlan", "_filterPreuves",
    "_goEditMesure", "_goEditPreuveFromMesure", "_logout", "_proposerMesures", "_refreshMeasures",
    "_rejectProposition", "_requestDerogExig", "_setMeta", "_toggleApplicable", "_unlinkExigInModal",
    "_unlinkMesure", "_unlinkMesureFromEdit", "_unlinkPreuve", "_unlinkPreuveInModal", "_updateExig",
    "_updateMesure", "_updatePreuveField", "_validateDraftMesure", "aiGlobalAnalysis",
    "aiSuggestControls", "downloadCSVTemplate", "importCustomCSV", "importEbiosRM", "selectPanel",
    "toggleReferentiel"
]);
