import type { Inventory } from "./inventory";
import type { DirectionWithMarket } from "./market-reality";
import { BUCKETS, type Category } from "../../../config/buckets";

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

  const strong = direction.coverage >= BUCKETS.STRONG_COVERAGE;

  if (strong && unmetGates.length === 0) {
    return {
      category: "apply_now",
      unmetGates,
      reason: `Uses ${Math.round(direction.coverage * 100)}% of your inventory and no high-frequency requirement is unmet.`,
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
