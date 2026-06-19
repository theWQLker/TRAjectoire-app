import type { RiasecCode } from "@/lib/rome";

/**
 * Inventory (PRD §6.1). What the quiz produces; what the engine traverses from.
 * Competence codes are ROME competence codes (mapped via /config/clusters.ts);
 * interests are a RIASEC profile; constraints carry département etc.
 *
 * The 5-category quiz (quiz-full-spec) accumulates WEIGHTED cluster + RIASEC
 * scores. Those weights live on the Inventory (clusterScores / riasecScores)
 * for later tuning, while `competenceCodes` and `riasec` stay populated exactly
 * as before so the engine (graph proposer, market reality) keeps reading the
 * same fields with no change:
 *   - competenceCodes = codes of every cluster scored > 0 (transversal clusters
 *     have empty code lists until P5, so they add scores but no codes).
 *   - riasec          = letters scored > 0, sorted.
 */
export type Inventory = {
  competenceCodes: string[];
  riasec: RiasecCode[];
  /** weighted cluster lean (clusterId → accumulated weight). Tuning signal. */
  clusterScores: Record<string, number>;
  /** weighted RIASEC lean (letter → accumulated weight). */
  riasecScores: Partial<Record<RiasecCode, number>>;
  constraints: {
    /**
     * Primary département (the first selected). Kept as a single string for the
     * per-département OfferSource seam and the many readers that show "dépt X".
     */
    departement: string;
    /**
     * All départements the user selected (multi-select). The engine queries
     * offers across EVERY entry and unions the market result, so results reflect
     * all chosen locations — not just the primary. Always contains `departement`
     * as its first element; defaults to ["75"] when none picked.
     */
    departements: string[];
    diploma?: string;
    urgency?: string;
    /** tension signals (hours/mobility/ceiling/physicality, §5.2) for reordering */
    tensions?: Record<string, string>;
  };
  /**
   * Cat-5 financial inputs (quiz-full-spec §5). CAPTURED and STORED now, but
   * consumed by NOTHING in the MVP engine — Phase 2 premium reads them.
   */
  financial_inputs?: {
    appetit_risque?: string;
    pull_autonomie?: string;
    salaire_min?: string;
    situation_actuelle?: string;
  };
};
