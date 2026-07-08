import type { Inventory } from "./inventory";
import type { DirectionWithMarket } from "./market-reality";

/**
 * Level demote (LEVEL-ONLY, salary dropped — see spec 2026-07-02). A soft,
 * presence-gated, ENGINE-ONLY ordering adjustment: a direction whose typical
 * level clusters well BELOW the level the user demonstrated is demoted in the
 * DISPLAY order, so a master's / senior profile stops seeing Serveur / téléconseil
 * at the top. It is MISMATCH, never status — the penalty is a function of distance
 * below the USER'S OWN level, never an absolute "this job is low".
 *
 * Never mutates matchRaritySum (that feeds the honest Signal tier). Never removes
 * a direction (surfacing/coverage-floor/held-back are all upstream, untouched).
 * Never dislodges a genuinely stronger fit (bounded, scales the strength).
 */

// Diploma → ordinal level. The quiz c_diploma values (config/quiz.ts) and the FT
// niveauLibelle bands both fold onto this 0..5 scale so user and direction are
// compared on ONE axis.
const DIPLOMA_ORDINAL: Record<string, number> = {
  aucun: 0,
  cap: 1,
  bac: 2,
  "bac+2": 3,
  "bac+3": 4,
  "bac+5": 5,
};

/** FT niveauLibelle → the same 0..5 ordinal. Absent/unknown → null (no signal). */
export function niveauLibelleOrdinal(libelle: string | undefined): number | null {
  if (!libelle) return null;
  const s = libelle.toLowerCase();
  if (s.includes("bac+5") || s.includes("bac +5") || (s.includes("bac") && s.includes("+5")) || s.includes("bac+5 et plus")) return 5;
  if (s.includes("bac+3") || s.includes("bac+4") || s.includes("licence") || s.includes("master")) return 4;
  if (s.includes("bac+2") || s.includes("bts") || s.includes("dut")) return 3;
  if (s.includes("bac")) return 2; // "Bac ou équivalent", "Niveau Bac"
  if (s.includes("cap") || s.includes("bep")) return 1;
  if (s.includes("aucune") || s.includes("3ème") || s.includes("brevet") || s.includes("sans")) return 0;
  return null;
}

/**
 * The user's DEMONSTRATED level (0..5) from the captured-but-inert Cat-4/5 profile,
 * plus the opt-out flag. null level → no diploma captured → no level demote at all.
 */
export function userLevel(inv: Inventory): {
  ordinal: number | null;
  acceptsLower: boolean;
} {
  const diploma = inv.constraints.diploma;
  const ordinal = diploma != null ? DIPLOMA_ORDINAL[diploma] ?? null : null;

  // "Will accept lower" opt-out: the user explicitly signalled they'd step down —
  // limited training appetite OR the lowest salary bands. Then NO demote fires.
  const fin = inv.financial_inputs as Record<string, string> | undefined;
  const acceptsLower =
    fin?.training_investment === "limited" ||
    fin?.salaire_min === "<1500" ||
    fin?.salaire_min === "1500-1800";

  return { ordinal, acceptsLower };
}

/** Modal niveauLibelle ordinal for a direction's offers (the diploma band), or null. */
export function directionLevelOrdinal(d: DirectionWithMarket): number | null {
  const counts = new Map<number, number>();
  for (const o of d.market.offers) {
    for (const f of o.formations ?? []) {
      const ord = niveauLibelleOrdinal(f.niveauLibelle ?? f.niveau);
      if (ord != null) counts.set(ord, (counts.get(ord) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  // modal band (most-listed); tie → the lower band (more conservative).
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

/** Share of a direction's offers that are débutant-accepté (experienceExige "D"). */
function debutantShare(d: DirectionWithMarket): number | null {
  const mix = d.market.experienceMix;
  const total = mix.reduce((s, m) => s + m.count, 0);
  if (total === 0) return null;
  const dCount = mix.find((m) => m.code === "D")?.count ?? 0;
  return dCount / total;
}

/**
 * Per-direction levelPenalty ∈ [0,1], presence-gated. max of the present
 * sub-signals; 0 when neither is present or no mismatch. Only distance BELOW the
 * user's level penalises (directional).
 */
export function levelPenalty(
  d: DirectionWithMarket,
  user: { ordinal: number | null; acceptsLower: boolean },
): number {
  if (user.acceptsLower) return 0; // opt-out honoured
  if (user.ordinal == null) return 0; // no user level captured → neutral
  const u = user.ordinal;

  const penalties: number[] = [];

  // (a) diploma-band gap — only where the direction HAS a band (33% coverage).
  const dirOrd = directionLevelOrdinal(d);
  if (dirOrd != null) {
    const gap = u - dirOrd; // >0 means the direction sits below the user
    if (gap >= 2) penalties.push(Math.min(1, (gap - 1) / 3)); // gap 2→.33, 3→.67, 4→1
  }

  // (b) seniority gap — experienceMix is 100% present. A higher-level user
  // (bac+3-ish or above) vs an overwhelmingly débutant-accepté direction.
  if (u >= 4) {
    const dShare = debutantShare(d);
    if (dShare != null && dShare >= 0.7) {
      // .70→~.13 up to 1.0→.5; scaled so seniority alone is a gentle nudge and
      // the diploma-band gap (when present) is the stronger lever.
      penalties.push(Math.min(0.5, (dShare - 0.7) / 0.6));
    }
  }

  return penalties.length ? Math.max(...penalties) : 0;
}

/** Weight of the level demote in the display sort (spec: soft, bounded). */
export const W_LEVEL_DEMOTE = 0.35;

/**
 * displayRank = the ordering base score scaled DOWN by the level penalty. The
 * base is the proposer's composite `rankScore` (leap-tier + coverage + rarity +
 * quiz lean + interest + mobility), so the displayed order reflects the quiz's
 * personalisation, not bare rarity-sum. Because it SCALES the base (never a flat
 * subtraction), a strong fit stays high even with some penalty and a weak
 * direction can never leapfrog a stronger one. rankScore does NOT contain the
 * demote, so this applies it exactly once. With penalty 0 this is exactly the
 * base → order unchanged (presence-gated).
 */
export function displayRank(baseScore: number, penalty: number): number {
  return baseScore * (1 - W_LEVEL_DEMOTE * penalty);
}
