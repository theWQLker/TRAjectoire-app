/**
 * Result-category thresholds (PRD §8). Named constants, tuned on live data.
 *
 * IMPORTANT (PRD §6.4 / constraints): a category is a LABEL derived from
 * visible signals (coverage, demand, requirement gates), NOT a hidden 0-100
 * feasibility verdict. The signals that produce the label are always shown
 * alongside it. The label groups; it never hides or gates.
 */
export const BUCKETS = {
  /** Demand at/below this is "thin/zero" — an honest signal, not a filter. */
  THIN_DEMAND_MAX: 0,
  /**
   * Phase 0: coverage at/above this → apply_now. Compared against the direction's
   * SIMPLE coverage (matched / inventory size) — Phase 0 has no cognitive
   * denominator. STRONG_COVERAGE env override is not used in Phase 0.
   */
  STRONG_COVERAGE: 0.3,
  /**
   * A requirement is a "gate" when this fraction or more of offers list it
   * AND the inventory doesn't cover it. 1-2 such gates → Bridge; many → Long-term.
   */
  GATE_FRACTION: 0.6,
  /** Number of unmet gates up to which a direction is still "Bridge" (else Long-term). */
  BRIDGE_MAX_GATES: 2,
} as const;

export type Category = "apply_now" | "bridge" | "long_term" | "not_now";

export const CATEGORY_LABEL: Record<Category, string> = {
  apply_now: "Apply now",
  bridge: "Bridge 3–6 mo",
  long_term: "Long-term",
  not_now: "Not now",
};
