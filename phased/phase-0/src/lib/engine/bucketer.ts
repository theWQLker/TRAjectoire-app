import type { Inventory } from "./inventory";
import type { DirectionWithMarket } from "./market-reality";
import { BUCKETS, type Category } from "../../../config/buckets";
import { SIGNAL_COUNT_TIERS } from "./coverage";

/**
 * Bucket a surfaced direction into one of the 4 categories (PRD §8).
 *
 * Deterministic, rule-based, from VISIBLE signals only (PRD §6.4 constraint):
 *   - not_now    : thin/zero demand OR no inventory coverage at all
 *   - apply_now  : strong coverage AND demand exists AND ≤ no unmet high-freq gates
 *   - bridge     : demand exists, partial coverage, 1-2 unmet gates (skills to add)
 *   - long_term  : demand exists but many unmet gates (major upskilling/diploma)
 *
 * Returns the category PLUS the signals that produced it — the caller renders
 * both. Never a hidden score.
 */

export type BucketResult = {
  category: Category;
  /** the unmet "gate" requirements (high-frequency, not in inventory) */
  unmetGates: { libelle: string; listing: number; total: number }[];
  /** plain-language reason, built from the same signals shown to the user */
  reason: string;
};

export function bucket(
  direction: DirectionWithMarket,
  inventory: Inventory,
): BucketResult {
  const invCodes = new Set(inventory.competenceCodes);
  const { marketDemand, requirementProfile } = direction.market;

  // Phase 0: "strong" is measured by the COUNT of matched competence codes, not
  // the coverage ratio. The front-door seed injects ~1000-3800 codes, so the
  // ratio (matched / inventory size) collapses to <1% for every seeded profile
  // and apply_now (ratio ≥ STRONG_COVERAGE 0.3) is structurally unreachable —
  // everything dumps into bridge and the "intersections fortes" hero never
  // renders. The COUNT is seed-denominator-independent and matches the signal
  // tier: a direction sharing ≥ FORT (4) of the person's skills is a strong
  // match. apply_now still additionally requires 0 unmet gates (below).
  const matchedCount = direction.matchedCompetenceCodes.length;

  // Unmet gates: requirements listed by a strong fraction of offers that the
  // inventory does NOT cover.
  const unmetGates = requirementProfile
    .filter(
      (r) =>
        r.total > 0 &&
        r.listing / r.total >= BUCKETS.GATE_FRACTION &&
        !invCodes.has(r.code),
    )
    .map((r) => ({ libelle: r.libelle, listing: r.listing, total: r.total }));

  // Thin/zero demand → Not now (honest signal, §6.4).
  if (marketDemand <= BUCKETS.THIN_DEMAND_MAX) {
    return {
      category: "not_now",
      unmetGates,
      reason: `No offers cached for this ROME in your département — thin/zero demand signal, not a verdict.`,
    };
  }

  // No coverage at all (surfaced purely by interest/mobilité, no shared skill).
  if (direction.coverage <= 0) {
    return {
      category: "not_now",
      unmetGates,
      reason: `Surfaced by ${direction.primaryLeap}, but none of your current skills appear in these offers.`,
    };
  }

  // Strong = shares at least FORT (4) of the person's skills. Same threshold as
  // the fort signal tier, so a "Piste solide" card with no unmet gate lands in
  // apply_now (the intersections-fortes hero), which is what the user sees.
  const strong = matchedCount >= SIGNAL_COUNT_TIERS.FORT;

  if (strong && unmetGates.length === 0) {
    return {
      category: "apply_now",
      unmetGates,
      reason: `Uses ${matchedCount} of your skills and no high-frequency requirement is unmet.`,
    };
  }

  if (unmetGates.length <= BUCKETS.BRIDGE_MAX_GATES) {
    return {
      category: "bridge",
      unmetGates,
      reason: `${unmetGates.length} frequently-asked skill(s) you don't list yet — a 3–6 month bridge.`,
    };
  }

  return {
    category: "long_term",
    unmetGates,
    reason: `${unmetGates.length} frequently-asked skills you don't list yet — a longer build.`,
  };
}
