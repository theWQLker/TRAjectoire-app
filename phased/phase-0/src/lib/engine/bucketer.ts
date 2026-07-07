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

  // Coverage for BUCKETING is measured against the COGNITIVE inventory only —
  // competenceCodes MINUS the front-door seed (§apply-now fix). The seed injects
  // ~2500 niche codes, so direction.coverage (matched / full-inventory) collapses
  // to ~0.03 for any seeded profile and apply_now (coverage ≥ STRONG_COVERAGE) is
  // structurally unreachable — everything dumps into bridge. Same denominator-
  // inflation class as the old Signal-tier bug. Measuring against the cognitive
  // codes answers the real question apply_now asks: "do you already have most of
  // what THIS direction needs?" — where "you" is what the person demonstrated, not
  // the padded seed. Non-seeded profiles: seededCodes empty → identical to before.
  const seeded = new Set(inventory.seededCodes ?? []);
  const cognitiveCodes = inventory.competenceCodes.filter((c) => !seeded.has(c));
  const cognitiveMatched = direction.matchedCompetenceCodes.filter((c) => !seeded.has(c)).length;
  const bucketCoverage =
    cognitiveCodes.length > 0 ? cognitiveMatched / cognitiveCodes.length : direction.coverage;

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

  // Threshold env-overridable for the apply_now calibration sweep (§apply-now fix).
  // Locked to the swept value after George picks; default stays BUCKETS.STRONG_COVERAGE.
  const strongThreshold = Number(process.env.STRONG_COVERAGE ?? BUCKETS.STRONG_COVERAGE);
  const strong = bucketCoverage >= strongThreshold;

  if (strong && unmetGates.length === 0) {
    return {
      category: "apply_now",
      unmetGates,
      reason: `Uses ${Math.round(bucketCoverage * 100)}% of the skills you demonstrated and no high-frequency requirement is unmet.`,
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
