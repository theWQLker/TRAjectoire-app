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
    departement: string;
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
