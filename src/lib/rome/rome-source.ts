import type { RomeMetier } from "./rome-metier";

/**
 * A mobilité neighbour plus the TYPE of the curated edge that reached it
 * (§6.2.C). 'Proche' = lateral/near-term move, 'Evolution' = step-up/longer-term;
 * null when the source doesn't label edges (fixtures). The proposer folds this
 * into ordering (light weight, never a filter) — P5.C.
 */
export type MobilityType = "Proche" | "Evolution" | null;
export type MobiliteEdge = { metier: RomeMetier; mobilityType: MobilityType };

/**
 * The ROME seam (PRD §3b). Same pattern as OfferSource. One interface, two
 * implementations:
 *   - FixtureRomeSource — small JSON sample from /fixtures/rome/. Used now.
 *   - LiveRomeSource    — ROME 4.0 Fiches API + RIASEC CSV. Dormant (build §11.6).
 *
 * The engine traverses the graph through this interface, never the API directly.
 * Switch via env ROME_SOURCE=fixture|live.
 *
 * Methods are shaped around the three leap mechanics (§6.2):
 *   - getMetier / allMetiers  → direct match + node lookup
 *   - metiersWithCompetence   → skill-bridge reverse index (§6.2.B)
 *   - getMobilites            → mobilité neighbours (§6.2.C)
 *   - allMetiers + riasec     → interest leap (§6.2.D)
 */
export interface RomeSource {
  /** Every métier in the referential. */
  allMetiers(): Promise<RomeMetier[]>;
  /** One métier by ROME code, or null if absent. */
  getMetier(romeCode: string): Promise<RomeMetier | null>;
  /** Skill-bridge index: every métier whose competences include `competenceCode`. */
  metiersWithCompetence(competenceCode: string): Promise<RomeMetier[]>;
  /**
   * Curated mobilité neighbours of `romeCode` (resolved to métiers), each tagged
   * with the edge's mobility type (Proche/Evolution/null). §6.2.C.
   */
  getMobilites(romeCode: string): Promise<MobiliteEdge[]>;
}
