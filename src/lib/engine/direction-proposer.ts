import type { Inventory } from "./inventory";

/**
 * DirectionProposer seam (PRD §6.6). Defined now, implemented deterministically
 * now (GraphDirectionProposer). The LLM implementation (LlmDirectionProposer)
 * is Phase 2 and drops into this one place — env-switched, same pattern as the
 * offer/ROME seams. The MVP ships fully on the graph proposer.
 */

/** Which leap mechanic surfaced a direction (PRD §6.2). */
export type LeapType = "direct" | "skill_bridge" | "mobilite" | "interest";

export type CandidateDirection = {
  romeCode: string;
  title: string;
  domain: string;
  /** every leap that surfaced this métier (union/dedupe across mechanics, §6.2) */
  leapTypes: LeapType[];
  /** the strongest/primary leap, for grouping + the headline "why" */
  primaryLeap: LeapType;
  /** fraction of the inventory's competence codes this métier uses (§6.3) */
  coverage: number;
  /** inventory competence codes this métier shares */
  matchedCompetenceCodes: string[];
  /** inventory RIASEC codes this métier matches */
  matchedRiasec: string[];
  /**
   * Weighted strength of the RIASEC match (§6.2.D): a MAJOR-interest match on
   * the métier weighs more than a MINOR one. major=1.0, minor=0.5, summed over
   * matched letters. 0 when the interest leap didn't contribute. Used to rank a
   * major-interest match above a minor one; never a hidden verdict (§6.4).
   */
  interestScore: number;
  /**
   * Quiz-lean strength (P5.C): Σ of the inventory's clusterScores over the
   * clusters that own this métier's matched competence codes. A stronger lean on
   * a cluster lifts that cluster's directions in the ORDER among surfaced — it
   * never changes WHAT surfaces (codes do that) and is never a pass/fail verdict.
   */
  leanScore: number;
  /**
   * Mobility-type nudge (P5.C): signed ordering signal from the curated edge
   * type (Proche lateral / Evolution step-up) tied to the user's ceiling tension
   * (stability → favour Proche, climb → Evolution). The lightest signal; orders
   * mobilité directions only, never filters, never a verdict. 0 for non-mobilité
   * directions or when no typed edge reached the métier.
   */
  mobilityScore: number;
  /**
   * Rarity (distinctiveness) of the skills this direction shares with the user
   * (§4.1). The MEAN inverse-document-frequency of the matched competence codes:
   * high when the shared skills are rare across the ROME graph (real signal —
   * "législation sociale"), near-zero when they're generic ("accueillir un
   * public") and shared with hundreds of look-alike métiers. Folded into ordering
   * so directions sharing the user's DISTINCTIVE skills outrank those sharing
   * generic ones — the "feels generic" fix. Orders only; never gates, never a
   * verdict, never shown as a number. 0 when nothing is shared (interest/mobilité
   * with no overlap).
   */
  rarityScore: number;
  /**
   * SUM of the matched codes' idf (not the mean) — the total DISTINCTIVE skill
   * this direction shares with the user. Unlike `coverage` (matched/inventorySize),
   * this is INDEPENDENT of inventory size, so seeding 198 extra codes does not
   * deflate it. Drives the user-facing Signal tier (fort/moyen/faible) so a
   * perfect-fit seeded job reads strong even when raw coverage looks thin (§4
   * Signal-tier fix). Ordering still uses the normalised mean (rarityScore).
   */
  matchRaritySum: number;
  /** plain-language "why it surfaced" (§6.3) */
  why: string;
};

/**
 * A direction the coverage floor held back: surfaced ONLY by interest/mobilité
 * with zero shared skills (§6.2.D firehose guard). Not shown as a row — counted
 * and surfaced as a collapsed "broader interest matches" line so the cut is
 * honest, never silent (§6.4). A true 0-coverage career-CHANGE direction is the
 * LLM discovery step's job (§6.6 seam), not the deterministic graph's.
 */
export type HeldBackDirection = {
  romeCode: string;
  title: string;
  /** the leap(s) that reached it (interest and/or mobilite, never skill-backed) */
  leapTypes: LeapType[];
};

/** Proposer output split into shown directions + honestly-counted held-back set. */
export type ProposalReach = {
  surfaced: CandidateDirection[];
  heldBack: HeldBackDirection[];
};

export interface DirectionProposer {
  /** Directions to show (skill-backed; passes the coverage floor). */
  propose(inventory: Inventory): Promise<CandidateDirection[]>;
  /**
   * Optional richer output: shown directions PLUS the count/list the coverage
   * floor held back (for the honest "+N broader matches" line). The deterministic
   * graph implements this; the future LLM proposer (§6.6) need not.
   */
  reach?(inventory: Inventory): Promise<ProposalReach>;
}
