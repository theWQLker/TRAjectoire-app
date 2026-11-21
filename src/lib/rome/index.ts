import { dataSourceMode } from "../data-source";
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
 * Resolve the active RomeSource from env (PRD §3b). No default: ROME_SOURCE must be set.
 * The seam is the single swap point — nothing else knows which is active.
 * LiveRomeSource reads the ROME referential from Postgres (loaded once via its
 * ingest methods). Fixture only when ROME_SOURCE=fixture is set.
 */
// One live source per server process: its in-memory graph (5 tables, ~150k rows)
// is the expensive part, and a fresh instance per call reloaded it on every
// request. The instance refreshes itself after a TTL (see LiveRomeSource.load).
let liveRome: LiveRomeSource | null = null;

export function getRomeSource(): RomeSource {
  const mode = dataSourceMode("ROME_SOURCE"); // throws when unset: no silent fixture fallback
  switch (mode) {
    case "fixture":
      return new FixtureRomeSource();
    case "live":
      return (liveRome ??= new LiveRomeSource());
    default:
      throw new Error(
        `Unknown ROME_SOURCE=${mode}. Expected "fixture" or "live".`,
      );
  }
}
