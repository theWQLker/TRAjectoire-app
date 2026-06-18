import type { MobilityType, RomeMetier, RomeSource } from "@/lib/rome";
import type { Inventory } from "./inventory";
import {
  type CandidateDirection,
  type DirectionProposer,
  type HeldBackDirection,
  type LeapType,
  type ProposalReach,
} from "./direction-proposer";
import { CLUSTERS } from "../../../config/clusters";

/**
 * GraphDirectionProposer (PRD §6.2 / §6.6) — the deterministic MVP engine.
 * No LLM. Walks the ROME leap-graph via RomeSource and unions four mechanics:
 *
 *   A. Direct      — métiers in the inventory's "home" domains whose
 *                    competences the inventory covers (the obvious directions).
 *   B. Skill-bridge— every OTHER métier that lists an inventory competence,
 *                    surfaced by the shared skill, not the job title (the leap).
 *   C. Mobilité    — metiersProches neighbours of anything A/B surfaced.
 *   D. Interest    — métiers whose RIASEC overlaps the inventory's interest
 *                    profile, even where hard skills don't point there.
 *
 * Union, dedupe by ROME code, tag every direction with the leaps that found it
 * + a plain "why surfaced". Coverage = fraction of inventory competence codes
 * the métier uses. Ranking lives downstream (this only proposes; §6.3).
 */

// A métier counts as a "direct" home for the inventory when it shares at least
// this fraction of the inventory's competence codes. Below it, a shared skill
// is a bridge into an unexpected domain, not the obvious home.
// Exported so the tuning harness reports the active value (P5.C).
//
// Re-tuned for the live 532/1911-métier graph (P5.C). At 0.4 on the real graph,
// a métier sharing 2 of a 4-code inventory was tagged "direct" — but with the
// full skill vocabulary a 50% overlap is a genuine home domain, while 25%
// (1 of 4) is clearly a bridge. 0.4 keeps 50% direct and 25% bridge, which the
// live before/after confirmed is the right split. Held at 0.4 (the fixture value
// happened to land right); documented here as deliberately re-validated, not
// inherited noise.
export const DIRECT_COVERAGE_THRESHOLD = 0.4;

// Coverage floor for the WEAK leaps (interest, mobilité) to surface a direction
// on their own (fix #1 — the RIASEC firehose guard). A weak leap may add a row
// ONLY if the métier shares ≥1 of the person's real skills (coverage > 0) OR it
// was already surfaced by direct/skill-bridge. Below the floor, interest/mobilité
// contribute ORDERING weight only (interestScore/mobilityScore on already-shown
// directions) — never a new row.
//
// Why >0 and not stricter: "shares ≥1 of your skills" is the product's honesty
// boundary — a defensible sentence to the user. It keeps the PRD's genuine
// interest-discovery case (kitchen skills + Enterprising → restaurant management,
// which DOES share kitchen skills, §6.2.D) while killing zero-overlap matches
// (payroll → welder). A true 0-coverage career-CHANGE belongs to the LLM
// discovery seam (§6.6), not this deterministic graph.
export const MIN_LEAP_COVERAGE = 0; // surface a weak-leap row only when coverage > this

// Leaps that can surface a direction WITHOUT a coverage floor (skill-backed).
const SKILL_BACKED_LEAPS: ReadonlySet<LeapType> = new Set(["direct", "skill_bridge"]);

// ---------------------------------------------------------------------------
// P5.C weighted ORDERING (order among surfaced; never WHAT surfaces, never a
// verdict). The composite below ranks within a leap tier only — the leap tier
// itself (direct > skill_bridge > mobilité > interest) is the primary sort and
// is never overridden, so the honesty ordering is preserved.
//
//   rankScore = coverage·W_COVERAGE + leanScore·W_LEAN + interestScore·W_INTEREST
//
// - coverage      : fraction of inventory the métier uses (0..1) — the strongest
//                   ordering signal; a fuller fit ranks higher.
// - leanScore     : Σ clusterScores over the clusters owning the matched codes —
//                   a stronger quiz lean on a cluster lifts that cluster's
//                   directions. Unbounded-ish (quiz weights), so weighted modestly.
// - interestScore : Σ RIASEC rank-weight (major 1.0 / minor 0.5), already wired.
// Weights chosen so coverage dominates, lean breaks ties within similar coverage,
// and interest is the lightest nudge (it's the weakest leap).
// ---------------------------------------------------------------------------
const W_COVERAGE = 1.0;
const W_LEAN = 0.15;
const W_INTEREST = 0.1;
// Mobility-type nudge (P5.C): Proche (lateral/near-term) vs Evolution
// (step-up/longer-term). The LIGHTEST signal — a tie-breaker among mobilité
// directions, never a filter, never changes the leap tier. Tied to the user's
// `ceiling` tension where present (stability → favour Proche, climb → Evolution).
const W_MOBILITY = 0.08;

/**
 * Per-direction mobility nudge from edge type + the user's ceiling tension.
 * Returns a small signed value folded into rankScore. No ceiling tension → a
 * mild default lean toward Proche (near-term moves are more actionable). The
 * magnitudes are < the interest weight so this never dominates ordering.
 */
const MOBILITY_NUDGE = {
  // ceiling = 'stable' → user wants stability now: strongly favour lateral
  stable: { Proche: 1.0, Evolution: -0.5 },
  // ceiling = 'climb' → user wants to climb: favour step-up moves
  climb: { Proche: -0.5, Evolution: 1.0 },
  // no ceiling signal → mild default toward near-term (Proche)
  none: { Proche: 0.4, Evolution: 0.0 },
} as const;

// RIASEC match weight by rank (§6.2.D): a major-interest match outweighs a minor.
const RIASEC_RANK_WEIGHT = { major: 1.0, minor: 0.5 } as const;

// code → cluster ids that contain it (built once). Lets a matched competence
// code contribute its cluster's quiz lean to leanScore (P5.C).
const CODE_TO_CLUSTERS: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  for (const c of CLUSTERS) {
    for (const code of c.competenceCodes) {
      const arr = m.get(code) ?? [];
      arr.push(c.id);
      m.set(code, arr);
    }
  }
  return m;
})();

type Surface = {
  metier: RomeMetier;
  leaps: Set<LeapType>;
  matchedCompetenceCodes: Set<string>;
  matchedRiasec: Set<string>;
  /** weighted RIASEC strength: Σ rank-weight over matched letters (§6.2.D) */
  interestScore: number;
  /** mobility edge types that reached this métier (Proche/Evolution), if any */
  mobilityTypes: Set<MobilityType>;
};

export class GraphDirectionProposer implements DirectionProposer {
  constructor(private readonly rome: RomeSource) {}

  /** Seam contract: directions to show (skill-backed, passes the coverage floor). */
  async propose(inventory: Inventory): Promise<CandidateDirection[]> {
    return (await this.reach(inventory)).surfaced;
  }

  async reach(inventory: Inventory): Promise<ProposalReach> {
    const invCodes = new Set(inventory.competenceCodes);
    const invRiasec = new Set<string>(inventory.riasec);
    const surfaced = new Map<string, Surface>();

    const ensure = (m: RomeMetier): Surface => {
      let s = surfaced.get(m.romeCode);
      if (!s) {
        s = {
          metier: m,
          leaps: new Set(),
          matchedCompetenceCodes: new Set(),
          matchedRiasec: new Set(),
          interestScore: 0,
          mobilityTypes: new Set(),
        };
        surfaced.set(m.romeCode, s);
      }
      return s;
    };

    const sharedCodes = (m: RomeMetier): string[] =>
      m.competences.map((c) => c.code).filter((code) => invCodes.has(code));

    // --- A + B: skill overlap across the whole referential -----------------
    // One pass over every métier that shares an inventory competence. The
    // skill-bridge reverse index gives us exactly those métiers.
    const skillHit = new Map<string, RomeMetier>();
    for (const code of invCodes) {
      for (const m of await this.rome.metiersWithCompetence(code)) {
        skillHit.set(m.romeCode, m);
      }
    }

    for (const m of skillHit.values()) {
      const shared = sharedCodes(m);
      const coverage = shared.length / invCodes.size;
      const s = ensure(m);
      shared.forEach((c) => s.matchedCompetenceCodes.add(c));
      // Direct = an obvious home domain (covers a real chunk of the inventory).
      // Otherwise the shared skill is a bridge into an unexpected métier.
      s.leaps.add(coverage >= DIRECT_COVERAGE_THRESHOLD ? "direct" : "skill_bridge");
    }

    // --- C: mobilité neighbours of everything surfaced by A/B --------------
    // Snapshot first — we mutate `surfaced` while iterating.
    const seedCodes = [...surfaced.keys()];
    for (const code of seedCodes) {
      for (const { metier: neighbour, mobilityType } of await this.rome.getMobilites(code)) {
        const s = ensure(neighbour);
        s.leaps.add("mobilite");
        if (mobilityType) s.mobilityTypes.add(mobilityType);
        // record any incidental skill overlap for the coverage line
        sharedCodes(neighbour).forEach((c) => s.matchedCompetenceCodes.add(c));
      }
    }

    // --- D: interest leap (RIASEC overlap), weighted by major/minor --------
    // A major-interest match on the métier weighs more than a minor one
    // (§6.2.D). Sources that carry ranks (LiveRomeSource.riasecRanked) drive the
    // weight; sources with only flat `riasec` (fixtures) fall back to major.
    if (invRiasec.size > 0) {
      for (const m of await this.rome.allMetiers()) {
        const ranked =
          m.riasecRanked && m.riasecRanked.length > 0
            ? m.riasecRanked
            : m.riasec.map((code) => ({ code, rank: "major" as const }));
        const matched = ranked.filter((r) => invRiasec.has(r.code));
        if (matched.length === 0) continue;
        const s = ensure(m);
        s.leaps.add("interest");
        for (const r of matched) {
          s.matchedRiasec.add(r.code);
          s.interestScore += RIASEC_RANK_WEIGHT[r.rank];
        }
        sharedCodes(m).forEach((c) => s.matchedCompetenceCodes.add(c));
      }
    }

    // ceiling tension drives the Proche/Evolution nudge (stable→Proche,
    // climb→Evolution, else a mild near-term default). Optional on the inventory.
    const ceiling = inventory.constraints.tensions?.ceiling;
    const nudge =
      ceiling === "stable"
        ? MOBILITY_NUDGE.stable
        : ceiling === "climb"
          ? MOBILITY_NUDGE.climb
          : MOBILITY_NUDGE.none;

    // --- Coverage floor (fix #1): partition into shown vs held-back ---------
    // A surface is SHOWN if a skill-backed leap (direct/skill_bridge) reached it,
    // OR it shares ≥1 real skill (coverage > MIN_LEAP_COVERAGE). Otherwise it was
    // reached ONLY by interest/mobilité with zero overlap → held back (counted,
    // not a row). Below-floor surfaces still contributed their interest/mobility
    // weight to ANY direction they co-surfaced (same Surface object), so ordering
    // signal is preserved; what's removed is the zero-overlap firehose of rows.
    const shown: Surface[] = [];
    const heldBack: HeldBackDirection[] = [];
    for (const s of surfaced.values()) {
      const skillBacked = [...s.leaps].some((l) => SKILL_BACKED_LEAPS.has(l));
      const sharesASkill = s.matchedCompetenceCodes.size > MIN_LEAP_COVERAGE;
      if (skillBacked || sharesASkill) {
        shown.push(s);
      } else {
        heldBack.push({
          romeCode: s.metier.romeCode,
          title: s.metier.title,
          leapTypes: [...s.leaps].sort(),
        });
      }
    }

    const surfacedDirections = shown
      .map((s) => this.toCandidate(s, invCodes.size, inventory.clusterScores, nudge))
      .sort(
        (a, b) =>
          // PRIMARY KEY — leap tier (honesty ordering: direct > skill_bridge >
          // mobilité > interest). Weights NEVER override this; they only reorder
          // WITHIN a tier (P5.C constraint).
          leapRank(a.primaryLeap) - leapRank(b.primaryLeap) ||
          // within a tier, the weighted composite (coverage + lean + interest)
          rankScore(b) - rankScore(a) ||
          a.romeCode.localeCompare(b.romeCode),
      );

    heldBack.sort((a, b) => a.romeCode.localeCompare(b.romeCode));
    return { surfaced: surfacedDirections, heldBack };
  }

  private toCandidate(
    s: Surface,
    invSize: number,
    clusterScores: Inventory["clusterScores"],
    nudge: (typeof MOBILITY_NUDGE)[keyof typeof MOBILITY_NUDGE],
  ): CandidateDirection {
    const matchedCompetenceCodes = [...s.matchedCompetenceCodes].sort();
    const matchedRiasec = [...s.matchedRiasec].sort();
    const coverage = matchedCompetenceCodes.length / invSize;
    const primaryLeap = primaryOf(s.leaps);
    // leanScore: Σ the quiz lean of every cluster owning a matched code (P5.C).
    // A code in two clusters contributes both leans; a stronger lean lifts order.
    let leanScore = 0;
    for (const code of matchedCompetenceCodes) {
      for (const clusterId of CODE_TO_CLUSTERS.get(code) ?? []) {
        leanScore += clusterScores[clusterId] ?? 0;
      }
    }
    // mobilityScore: ceiling-tied nudge from the edge type(s) that reached this
    // métier. If both Proche and Evolution edges reached it, take the stronger
    // (max) nudge — the métier is reachable the favoured way. 0 when no typed
    // mobilité edge reached it (non-mobilité directions, or null-typed edges).
    const typedNudges = [...s.mobilityTypes]
      .filter((t): t is "Proche" | "Evolution" => t !== null)
      .map((t) => nudge[t]);
    const mobilityScore = typedNudges.length ? Math.max(...typedNudges) : 0;
    return {
      romeCode: s.metier.romeCode,
      title: s.metier.title,
      domain: s.metier.domain,
      leapTypes: [...s.leaps].sort(),
      primaryLeap,
      coverage,
      matchedCompetenceCodes,
      matchedRiasec,
      interestScore: s.interestScore,
      leanScore,
      mobilityScore,
      why: buildWhy(s.metier, primaryLeap, matchedCompetenceCodes, matchedRiasec),
    };
  }
}

/**
 * Composite ordering score WITHIN a leap tier (P5.C). Higher = ranked first.
 * coverage dominates; lean breaks ties among similar-coverage directions;
 * interest is the lightest nudge. Pure ordering — not a verdict, not shown as a
 * number, never gates surfacing.
 */
function rankScore(d: CandidateDirection): number {
  return (
    d.coverage * W_COVERAGE +
    d.leanScore * W_LEAN +
    d.interestScore * W_INTEREST +
    d.mobilityScore * W_MOBILITY
  );
}

// Primary-leap precedence: the most "earned" reason a direction surfaced.
// direct (shares your home skills) > skill_bridge (shares a skill elsewhere)
// > mobilite (ROME's adjacency) > interest (only your RIASEC matches).
const LEAP_ORDER: LeapType[] = ["direct", "skill_bridge", "mobilite", "interest"];
function leapRank(l: LeapType): number {
  return LEAP_ORDER.indexOf(l);
}
function primaryOf(leaps: Set<LeapType>): LeapType {
  for (const l of LEAP_ORDER) if (leaps.has(l)) return l;
  return "interest";
}

function buildWhy(
  m: RomeMetier,
  primary: LeapType,
  codes: string[],
  riasec: string[],
): string {
  const skillLabels = m.competences
    .filter((c) => codes.includes(c.code))
    .map((c) => c.libelle);
  const n = codes.length;
  switch (primary) {
    case "direct":
      return `Direct fit — uses ${n} of your skills (${skillLabels.slice(0, 3).join(", ")}${skillLabels.length > 3 ? "…" : ""}).`;
    case "skill_bridge":
      return `Skill-bridge — shares ${n} of your skills (${skillLabels.join(", ")}) in a field you wouldn't have searched.`;
    case "mobilite":
      return `Mobilité — ROME lists this as an adjacent move${n ? `, and it reuses ${n} of your skills` : ""}.`;
    case "interest":
      return `Interest match — fits your ${riasec.join("/")} profile${n ? ` and uses ${n} of your skills` : " even though your hard skills don't point here"}.`;
  }
}
