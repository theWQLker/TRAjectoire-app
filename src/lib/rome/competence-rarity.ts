import type { RomeMetier } from "./rome-metier";

/**
 * Competence rarity (inverse document frequency) over the ROME referential.
 *
 * The "feels generic" problem (BUILD_BRIEF §4.1): a generic shared skill
 * ("accueillir un public", "respecter les procédures") appears in hundreds of
 * métiers, so a skill-bridge on it surfaces hundreds of weak look-alikes — a
 * list, not discovery. A rare shared skill ("législation sociale") appears in a
 * handful of métiers and is real signal: sharing it actually says something.
 *
 * We measure rarity the TF-IDF way. For a competence code c carried by `df(c)`
 * of the graph's `N` métiers:
 *
 *     idf(c) = ln( (N + 1) / (df(c) + 1) )      // smoothed, always ≥ 0
 *
 * A code in 1 of 1,911 métiers scores ≈ ln(956) ≈ 6.86; a code in 1,200 of them
 * scores ≈ ln(1.59) ≈ 0.46; a code in every métier scores 0. The +1 smoothing
 * keeps it finite and non-negative for any df ≥ 0, so it composes cleanly into a
 * weighted sum (no NaN/Inf, no negative weights to invert the meaning).
 *
 * This is a pure RE-RANKING signal. It is computed once from the same graph the
 * proposer already loads (rome_job_competences gives df for free), exposed on
 * the RomeSource seam, and folded into the ordering score — it never changes
 * WHAT surfaces (the coverage floor / held-back gate own that, untouched).
 */
export type CompetenceRarity = ReadonlyMap<string, number>;

/**
 * Build the idf map from the full set of métiers. df(c) = how many métiers carry
 * c (a code is counted once per métier even if listed twice). Codes absent from
 * the map were never seen → callers treat them as maximally rare via the
 * fallback in {@link rarityOf}, but in practice every matched code is present.
 */
export function buildCompetenceRarity(metiers: RomeMetier[]): Map<string, number> {
  const n = metiers.length;
  const df = new Map<string, number>();
  for (const m of metiers) {
    // de-dupe codes within a métier so a doubly-listed skill counts once
    const seen = new Set<string>();
    for (const c of m.competences) {
      if (seen.has(c.code)) continue;
      seen.add(c.code);
      df.set(c.code, (df.get(c.code) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [code, freq] of df) {
    idf.set(code, Math.log((n + 1) / (freq + 1)));
  }
  return idf;
}

/**
 * idf for one code. Unknown codes (never carried by any métier in the graph)
 * are treated as maximally rare — `ln(N + 1)` — matching how the smoothed
 * formula behaves as df → 0. Defensive only; matched codes always come from a
 * métier and are therefore in the map.
 */
export function rarityOf(rarity: CompetenceRarity, code: string, metierCount: number): number {
  return rarity.get(code) ?? Math.log(metierCount + 1);
}
