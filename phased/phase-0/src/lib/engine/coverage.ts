import type { CandidateDirection } from "./direction-proposer";

/**
 * Coverage strength (presentation + surfacing honesty).
 *
 * A direction surfaced by the leap-graph must display HOW MUCH of the person it
 * actually uses, in plain language — "based on 1 of your skills" vs "uses most
 * of your profile" — never a bare number dressed up as a fit verdict.
 *
 * Tiers (single source of truth; the proposer's direct/skill_bridge split and
 * the bucketer's strong-coverage line both align to these):
 *   - strong       ≥ 0.60  uses most of your profile
 *   - partial      ≥ 0.40  uses a real chunk of your profile
 *   - exploratory  <  0.40  a thin link — one or few shared skills
 *
 * Exploratory directions are "worth knowing about", shown subordinate to direct
 * matches, and must clear the market-reality gate before surfacing at all
 * (see results assembler).
 *
 * P5.C — re-validated against the live 532/1911-métier graph (not noise-fitted to
 * fixtures). On the real graph a fixed paie+relation_client inventory produced a
 * clean split: 100% → strong, 50% → partial, 25%/0% → exploratory, which matches
 * the intended meaning of each tier. Held at 0.60/0.40; the values are deliberate,
 * confirmed by the before/after tuning run, not inherited from the fixture era.
 */
export const COVERAGE_TIERS = {
  STRONG: 0.6,
  PARTIAL: 0.4,
} as const;

export type CoverageStrength = "strong" | "partial" | "exploratory";

export function coverageStrength(coverage: number): CoverageStrength {
  if (coverage >= COVERAGE_TIERS.STRONG) return "strong";
  if (coverage >= COVERAGE_TIERS.PARTIAL) return "partial";
  return "exploratory";
}

// ---------------------------------------------------------------------------
// Signal tier (the USER-FACING fort/moyen/faible) — Phase 0: MATCHED-CODE-COUNT.
// Phase 0 has no rarity computation. The tier reads how many of the person's
// skills this direction actually uses — the COUNT of matched competence codes —
// NOT the coverage ratio. Coverage ratio is matched / inventory-size, which
// collapses to ~0 for a seeded profile (the front-door seed injects ~1000-3800
// codes), so ratio-based tiers read every seeded match as faible. The COUNT is
// seed-denominator-independent: "uses 5 of your skills" is honest whether the
// seed injected 800 codes or 3800.
//
// The shared DirectionCard reads this via matchRaritySum, which the Phase-0
// engine sets equal to matchedCompetenceCodes.length (see graph-direction-
// proposer). So passing the count here produces count-based fort/moyen/faible on
// the AS-IS card.
//
// Thresholds calibrated to the live Phase-0 skill-bridge distribution (matched
// counts run 1..6 across families; max 6 on admin, median 2): FORT at ≥4 (a rich
// multi-skill bridge), MOYEN at ≥2 (a couple of shared skills), else FAIBLE (a
// single-skill thin link). Produces genuine spread — admin/tech/commerce show
// all three tiers; a family whose matches are all single-code (santé) honestly
// stays all-faible rather than being inflated.
//   matchedCount ≥ SIGNAL_COUNT_TIERS.FORT (4)  → strong (fort)
//   matchedCount ≥ SIGNAL_COUNT_TIERS.MOYEN (2) → partial (moyen)
//   else                                        → exploratory (faible)
// ---------------------------------------------------------------------------
export const SIGNAL_COUNT_TIERS = {
  FORT: 4,
  MOYEN: 2,
} as const;

export function signalStrength(matchedCount: number): CoverageStrength {
  if (matchedCount >= SIGNAL_COUNT_TIERS.FORT) return "strong";
  if (matchedCount >= SIGNAL_COUNT_TIERS.MOYEN) return "partial";
  return "exploratory";
}

/** Plain-language coverage phrase, honest about how thin the link is. */
export function coveragePhrase(d: Pick<CandidateDirection, "matchedCompetenceCodes" | "coverage">): string {
  const n = d.matchedCompetenceCodes.length;
  switch (coverageStrength(d.coverage)) {
    case "strong":
      return "uses most of your profile";
    case "partial":
      return `uses ${n} of your skills — a real part of your profile`;
    case "exploratory":
      return n === 0
        ? "no direct skill overlap — a sideways link, not a fit"
        : `based on just ${n} of your skill${n === 1 ? "" : "s"} — a thin link`;
  }
}

/** True for directions that are exploratory leaps, not solid fits. */
export function isExploratory(coverage: number): boolean {
  return coverageStrength(coverage) === "exploratory";
}
