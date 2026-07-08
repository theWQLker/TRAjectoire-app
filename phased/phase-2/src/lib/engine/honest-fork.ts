import type { Inventory } from "./inventory";
import type { DirectionWithMarket } from "./market-reality";

/**
 * Honest fork (PRD §6.5). When NO single direction uses most of the inventory,
 * the output explicitly names the fork: "no one path uses most of you; here are
 * 2-3 real directions, each using a different part, and what each costs."
 *
 * Deterministic. Picks directions that (a) have real demand and (b) each cover
 * a DIFFERENT part of the inventory, so they are genuinely distinct choices,
 * not the same role reworded. No blending into mush.
 */

const MOST_OF_INVENTORY = 0.6; // a single direction "uses most of you" at/above this

export type HonestFork = {
  triggered: boolean;
  /** when triggered, 2-3 distinct directions each using a different part */
  forks: {
    direction: DirectionWithMarket;
    /** which inventory codes THIS fork leans on (its distinct part) */
    usesCodes: string[];
  }[];
  message: string;
};

export function detectHonestFork(
  directions: DirectionWithMarket[],
  inventory: Inventory,
): HonestFork {
  const best = Math.max(0, ...directions.map((d) => d.coverage));
  if (best >= MOST_OF_INVENTORY) {
    return { triggered: false, forks: [], message: "" };
  }

  // Candidates with real demand, richest coverage first.
  const candidates = directions
    .filter((d) => d.market.marketDemand > 0 && d.matchedCompetenceCodes.length > 0)
    .sort(
      (a, b) =>
        b.matchedCompetenceCodes.length - a.matchedCompetenceCodes.length ||
        b.market.marketDemand - a.market.marketDemand ||
        a.romeCode.localeCompare(b.romeCode),
    );

  // Greedily pick directions that each add a NEW part of the inventory.
  const covered = new Set<string>();
  const forks: HonestFork["forks"] = [];
  for (const d of candidates) {
    const fresh = d.matchedCompetenceCodes.filter((c) => !covered.has(c));
    if (fresh.length === 0) continue; // adds nothing new — would be mush
    forks.push({ direction: d, usesCodes: d.matchedCompetenceCodes });
    fresh.forEach((c) => covered.add(c));
    if (forks.length >= 3) break;
  }

  return {
    triggered: forks.length >= 2,
    forks,
    message:
      "No one path uses most of you. Here are real directions, each using a different part of your inventory — and what each costs. This is a choice, not a ranking.",
  };
}
