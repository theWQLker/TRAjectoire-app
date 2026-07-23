/**
 * Coherence layer (spec 2026-07-23) — DISPLAY-ORDER ONLY. Thins over-represented
 * ROME sub-domain clusters with a gentle diminishing-returns curve and selects
 * one honest cross-domain wildcard. Touches nothing that surfaces, is bucketed,
 * or is tier-labelled (see spec §2). This file is the pure math; results.ts wires
 * it in and the page renders the reshaped order.
 */

/** 3-char ROME sub-domain (e.g. "M1203" → "M12"). The coherence cluster key. */
export function clusterKey(romeCode: string): string {
  return romeCode.slice(0, 3);
}

/** 1-char ROME domain (e.g. "M1203" → "M"). One of the 14 domains A–N. */
export function domainOf(romeCode: string): string {
  return romeCode.slice(0, 1);
}

/** Which diminishing-returns formula (chosen by the sweep, spec §7). */
export type CoherenceFormula = "plain" | "strength";

/**
 * Diminishing-returns curve constant. Larger K = steeper thinning of a cluster's
 * tail. Env-overridable; locked by the per-persona sweep (spec §7), NOT silently
 * tuned — same human-gate as RARITY_GENERIC_FLOOR / W_RARITY.
 */
export const COHERENCE_K = Number(process.env.COHERENCE_K ?? "0.15");

/**
 * Single-level diminishing-returns penalty, keyed by object identity, grouping on
 * an arbitrary key function (§4). Rows are grouped, sorted by rankScore desc, and
 * the intra-group index i (0 = the group's best) drives the penalty. i=0 is ALWAYS
 * 0 — a group's best row is never touched. Two formulas:
 *   plain:    1 − 1/(1 + K·i)
 *   strength: (1 − 1/(1 + K·i)) × (1 − rankScore_i/rankScore_head)
 * The strength variant spares a deep row that is nearly as strong as its head
 * (punishes low-QUALITY density, not density per se). Used at BOTH the 3-char
 * sub-domain level and the 1-char domain level (§4a); coherencePenalties combines
 * them.
 */
function levelPenalties<T extends { romeCode: string; rankScore: number }>(
  dirs: T[],
  keyOf: (romeCode: string) => string,
  formula: CoherenceFormula,
  k: number,
): Map<T, number> {
  const byGroup = new Map<string, T[]>();
  for (const d of dirs) {
    const key = keyOf(d.romeCode);
    let group = byGroup.get(key);
    if (!group) { group = []; byGroup.set(key, group); }
    group.push(d);
  }
  const out = new Map<T, number>();
  for (const group of byGroup.values()) {
    // rankScore desc; deterministic tiebreak so index assignment is stable.
    const sorted = [...group].sort(
      (a, b) => b.rankScore - a.rankScore || a.romeCode.localeCompare(b.romeCode),
    );
    const head = sorted[0].rankScore;
    sorted.forEach((d, i) => {
      const index = 1 - 1 / (1 + k * i); // 0 at i=0, →1 as i grows
      let penalty = index;
      if (formula === "strength") {
        const strengthKeep = head > 0 ? d.rankScore / head : 1;
        penalty = index * (1 - strengthKeep);
      }
      // clamp for safety (rankScore is non-negative in practice; guard anyway)
      out.set(d, Math.min(1, Math.max(0, penalty)));
    });
  }
  return out;
}

/**
 * Per-direction coherence penalty ∈ [0,1], keyed by object identity. TWO-LEVEL
 * (§4a revision, 2026-07-24): the max of the 3-char sub-domain penalty and the
 * 1-char domain penalty.
 *
 *   p_sub = levelPenalties(clusterKey)   // rank-within-3-char-sub-domain
 *   p_dom = levelPenalties(domainOf)     // rank-within-1-char-domain
 *   penalty = max(p_sub, p_dom)
 *
 * Sub-domain decay alone was blind to the santé wall (6 industrie rows across 6
 * DIFFERENT sub-domain clusters, each i=0 → penalty 0). The domain level sees them
 * as one H domain of 6 and thins its weaker tail. `max` is bounded [0,1] by
 * construction, needs no new constant, and lets the strength-attenuation guard
 * act independently at each level — so a genuine concentrated domain (tech M18,
 * all rows near their head → p_dom≈0) survives while a weak wall thins.
 */
export function coherencePenalties<T extends { romeCode: string; rankScore: number }>(
  dirs: T[],
  formula: CoherenceFormula,
  k: number = COHERENCE_K,
): Map<T, number> {
  const pSub = levelPenalties(dirs, clusterKey, formula, k);
  const pDom = levelPenalties(dirs, domainOf, formula, k);
  const out = new Map<T, number>();
  for (const d of dirs) {
    out.set(d, Math.max(pSub.get(d) ?? 0, pDom.get(d) ?? 0));
  }
  return out;
}

/**
 * Wildcard credibility floor: the pick's rankScore must be ≥ this fraction of the
 * top overall rankScore, else no wildcard. rankScore is not normalised across
 * profiles, so a RELATIVE bar ("at least half as strong as your best match") is a
 * consistent, explainable honesty threshold. Env-overridable; locked by the sweep.
 */
export const WILDCARD_FLOOR_FRAC = Number(process.env.WILDCARD_FLOOR_FRAC ?? "0.5");

/**
 * The dominant domain = the 1-char domain of the cluster with the most surfaced
 * rows (tiebreak: the cluster whose head has the higher rankScore). null for an
 * empty set.
 */
function dominantDomain<T extends { romeCode: string; rankScore: number }>(
  dirs: T[],
): string | null {
  if (dirs.length === 0) return null;
  const byCluster = new Map<string, T[]>();
  for (const d of dirs) {
    const key = clusterKey(d.romeCode);
    let group = byCluster.get(key);
    if (!group) { group = []; byCluster.set(key, group); }
    group.push(d);
  }
  let best: { key: string; size: number; headScore: number } | null = null;
  for (const [key, group] of byCluster) {
    const headScore = Math.max(...group.map((g) => g.rankScore));
    if (
      !best ||
      group.length > best.size ||
      (group.length === best.size && headScore > best.headScore)
    ) {
      best = { key, size: group.length, headScore };
    }
  }
  return best ? domainOf(best.key + "0000") : null; // key is already a domain-leading string
}

/**
 * At most ONE cross-domain wildcard (spec §5). Highest-rankScore direction whose
 * domain differs from the dominant domain, provided its rankScore ≥ floorFrac ×
 * (top overall rankScore). Returns null when nothing qualifies — honesty over
 * always-filling the slot. NOT rarity-based; rankScore is the credibility axis.
 */
export function selectWildcard<T extends { romeCode: string; rankScore: number }>(
  dirs: T[],
  floorFrac: number = WILDCARD_FLOOR_FRAC,
): T | null {
  if (dirs.length === 0) return null;
  const dom = dominantDomain(dirs);
  if (dom == null) return null;
  const topOverall = Math.max(...dirs.map((d) => d.rankScore));
  const floor = floorFrac * topOverall;
  const candidates = dirs
    .filter((d) => domainOf(d.romeCode) !== dom && d.rankScore >= floor)
    .sort((a, b) => b.rankScore - a.rankScore || a.romeCode.localeCompare(b.romeCode));
  return candidates[0] ?? null;
}

/**
 * Which formula the engine uses. Default "strength" — EARNED by sweep-1 (2026-07-24,
 * spec §7): strength held inversions near-zero and flat across all K (1,1,1,1,0,0
 * per persona) and preserved tech M18 ×7, while plain buried 3–5 top-quartile rows
 * per persona and worsened as K rose, eroding M18 to ×3–5. Plain lost decisively, so
 * it is kept only as the sweep's comparison arm (env-overridable), not deleted.
 */
export const COHERENCE_FORMULA: CoherenceFormula =
  (process.env.COHERENCE_FORMULA as CoherenceFormula) === "plain" ? "plain" : "strength";

/**
 * Orchestrator: compute per-direction coherence penalties (COHERENCE_FORMULA) and
 * select the one cross-domain wildcard. Pure — the caller composes coherenceRank
 * and stamps fields. Kept separate from stamping so it stays unit-testable.
 */
export function applyCoherence<
  T extends { romeCode: string; rankScore: number; displayRank: number },
>(dirs: T[]): { penalties: Map<T, number>; wildcard: T | null } {
  return {
    penalties: coherencePenalties(dirs, COHERENCE_FORMULA),
    wildcard: selectWildcard(dirs),
  };
}
