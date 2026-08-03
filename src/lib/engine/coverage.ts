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
// Signal tier (the USER-FACING fort/moyen/faible) — rarity-weighted, §4 fix.
//
// The bug: the front-door SEED injects ~200 niche codes, inflating
// inventory.size, so coverage = matched/inventory.size collapses — a perfect-fit
// dev (matched 57 distinctive coding skills) read 26% → faible. The tier
// under-read every seeded match.
//
// The fix: the tier reflects the TOTAL DISTINCTIVE skill shared, measured by the
// SUM of the matched codes' idf (matchRaritySum) — which is INDEPENDENT of
// inventory size. Sharing many rare skills earns a high tier even at low raw
// coverage; sharing one generic skill stays faible. This reuses the SAME rarity
// the ranking uses (no new unit, no second coverage denominator) and keeps the
// three tiers.
//
// Thresholds calibrated on the live graph (idf range 0..~6.9):
//   - seeded dev M1805/M1855 matchRaritySum ≈ 285 / 313  → FORT
//   - a normal profile's best genuine fits  ≈ 18..23      → MOYEN
//   - a generic 1–2 skill bridge (Commis cuisine ≈ 9, Contrôle-1-skill ≈ 5,
//     normal thin ≈ 2)                                    → FAIBLE
// So FORT at ≥ 50 (only a rich distinctive match clears it — never inflated to
// fort for a thin one), MOYEN at ≥ 15 (a few rare shared skills, the normal
// profile's real fits), else FAIBLE. Discriminates in BOTH directions.
// ---------------------------------------------------------------------------
export const SIGNAL_RARITY_TIERS = {
  FORT: 50,
  MOYEN: 15,
} as const;

export function signalStrength(matchRaritySum: number): CoverageStrength {
  if (matchRaritySum >= SIGNAL_RARITY_TIERS.FORT) return "strong";
  if (matchRaritySum >= SIGNAL_RARITY_TIERS.MOYEN) return "partial";
  return "exploratory";
}

// ---------------------------------------------------------------------------
// DISPLAY tiering for the bridge bucket (presentation hierarchy, editor-not-
// censor). The MOYEN (partial) band is wide — it holds most of a large seeded
// bucket — so a single "moyen" label reads as an undifferentiated dump. We split
// it at its own MIDPOINT so the display can lead with the stronger half.
//
// The boundary is THRESHOLD-DRIVEN, not a count: MOYEN_UPPER is the geometric
// midpoint of the existing [MOYEN, FORT] band ( √(15·50) ≈ 27.4 ), so it stays a
// STRENGTH cut derived from the same calibrated constants — never chosen to hit a
// target count. A match at matchRaritySum 30 is genuinely stronger than one at
// 16; this names that, it doesn't invent it. Counts per tier are EMERGENT: they
// fall out of wherever the real distribution crosses 50 / 27.4 / 15.
export const SIGNAL_RARITY_MOYEN_UPPER = Math.sqrt(
  SIGNAL_RARITY_TIERS.MOYEN * SIGNAL_RARITY_TIERS.FORT,
);

/** Four display strength bands over matchRaritySum, all threshold-derived. */
export type StrengthBand = "tres_forte" | "forte" | "pertinente" | "large";

/**
 * Map a direction's matchRaritySum to a display band. Wraps signalStrength (the
 * backed FORT/MOYEN/faible cuts) and splits MOYEN at its midpoint:
 *   ≥ 50    → tres_forte   (FORT — same band as the "Piste solide" badge)
 *   ≥ 27.4  → forte        (upper MOYEN)
 *   ≥ 15    → pertinente   (lower MOYEN)
 *   <  15   → large        (faible — the honest broad tail, shown behind "explorer tout")
 * A band label is a strength CLAIM; it is defined ONLY by these thresholds, so it
 * can never say "très forte" about a weak match (that would be the mis-labelled-
 * badge lie). Pure function of one strength number — no counts, no ordering input.
 */
export function strengthBand(matchRaritySum: number): StrengthBand {
  const s = signalStrength(matchRaritySum);
  if (s === "strong") return "tres_forte";
  if (s === "exploratory") return "large";
  // partial (MOYEN) — split at the midpoint threshold.
  return matchRaritySum >= SIGNAL_RARITY_MOYEN_UPPER ? "forte" : "pertinente";
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
