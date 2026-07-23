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
 * Per-direction coherence penalty ∈ [0,1], keyed by object identity.
 *
 * Within each 3-char cluster, rows are sorted by rankScore desc; the intra-cluster
 * index i (0 = the cluster's best) drives the penalty. i=0 is ALWAYS 0 — a
 * cluster's best row is never touched. Two formulas (spec §4):
 *   plain:    1 − 1/(1 + K·i)
 *   strength: (1 − 1/(1 + K·i)) × (1 − rankScore_i/rankScore_head)
 * The strength variant spares a deep row that is nearly as strong as its head
 * (punishes low-QUALITY density, not density per se).
 */
export function coherencePenalties<T extends { romeCode: string; rankScore: number }>(
  dirs: T[],
  formula: CoherenceFormula,
  k: number = COHERENCE_K,
): Map<T, number> {
  const byCluster = new Map<string, T[]>();
  for (const d of dirs) {
    const key = clusterKey(d.romeCode);
    let group = byCluster.get(key);
    if (!group) { group = []; byCluster.set(key, group); }
    group.push(d);
  }
  const out = new Map<T, number>();
  for (const group of byCluster.values()) {
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
