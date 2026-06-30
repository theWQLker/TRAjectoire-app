import type { RomeSource } from "./rome-source";
import { FixtureRomeSource } from "./fixture-rome-source";
import { LiveRomeSource } from "./live-rome-source";

export type { RomeMetier, RomeCompetence, RiasecCode, RiasecRank, RankedRiasec } from "./rome-metier";
export type { RomeSource, MobiliteEdge, MobilityType } from "./rome-source";
export type { CompetenceRarity } from "./competence-rarity";
export { buildCompetenceRarity, rarityOf } from "./competence-rarity";
export { FixtureRomeSource } from "./fixture-rome-source";
export { LiveRomeSource } from "./live-rome-source";

/**
 * Resolve the active RomeSource from env (PRD §3b). Default: fixture.
 * The seam is the single swap point — nothing else knows which is active.
 * LiveRomeSource reads the ROME referential from Postgres (loaded once via its
 * ingest methods); fixture stays the default.
 */
export function getRomeSource(): RomeSource {
  const mode = (process.env.ROME_SOURCE ?? "fixture").toLowerCase();
  switch (mode) {
    case "fixture":
      return new FixtureRomeSource();
    case "live":
      return new LiveRomeSource();
    default:
      throw new Error(
        `Unknown ROME_SOURCE=${mode}. Expected "fixture" or "live".`,
      );
  }
}
