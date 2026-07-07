import type { RomeMetier, RomeSource } from "@/lib/rome";
import type { Inventory } from "./inventory";
import {
  type CandidateDirection,
  type DirectionProposer,
  type HeldBackDirection,
  type LeapType,
  type ProposalReach,
} from "./direction-proposer";

/**
 * Phase 0 GraphDirectionProposer — skill-bridge ONLY.
 *
 * Walks the ROME leap-graph via RomeSource and surfaces every métier that lists
 * an inventory competence (the reverse skill index). No direct/mobilité/interest
 * leaps, no rarity, no quiz lean. Coverage = fraction of the inventory's
 * competence codes the métier uses. Ranking is two terms: leap tier + coverage.
 */

// Coverage floor: a skill-bridge row needs ≥1 shared skill (guaranteed by the
// reverse index). Kept for parity with the honesty invariant.
export const MIN_LEAP_COVERAGE = 0;

const W_LEAP_TIER = 0.6;
const W_COVERAGE = 0.8;

// Only skill_bridge is active in Phase 0.
const LEAP_TIER_SCORE: Record<LeapType, number> = {
  direct: 1.0,
  skill_bridge: 0.75,
  mobilite: 0.45,
  interest: 0.25,
};

type Surface = {
  metier: RomeMetier;
  matchedCompetenceCodes: Set<string>;
};

export class GraphDirectionProposer implements DirectionProposer {
  constructor(private readonly rome: RomeSource) {}

  async propose(inventory: Inventory): Promise<CandidateDirection[]> {
    return (await this.reach(inventory)).surfaced;
  }

  async reach(inventory: Inventory): Promise<ProposalReach> {
    const invCodes = new Set(inventory.competenceCodes);
    const surfaced = new Map<string, Surface>();

    const ensure = (m: RomeMetier): Surface => {
      let s = surfaced.get(m.romeCode);
      if (!s) {
        s = { metier: m, matchedCompetenceCodes: new Set() };
        surfaced.set(m.romeCode, s);
      }
      return s;
    };

    const sharedCodes = (m: RomeMetier): string[] =>
      m.competences.map((c) => c.code).filter((code) => invCodes.has(code));

    // Skill-bridge: every métier that lists an inventory competence.
    const skillHit = new Map<string, RomeMetier>();
    for (const code of invCodes) {
      for (const m of await this.rome.metiersWithCompetence(code)) {
        skillHit.set(m.romeCode, m);
      }
    }
    for (const m of skillHit.values()) {
      const s = ensure(m);
      sharedCodes(m).forEach((c) => s.matchedCompetenceCodes.add(c));
    }

    // Every surfaced métier is skill-backed by construction → no held-back set.
    const heldBack: HeldBackDirection[] = [];

    const candidates = [...surfaced.values()].map((s) =>
      this.toCandidate(s, invCodes.size),
    );

    const maxCoverage = Math.max(
      ...candidates.map((c) => c.coverage),
      Number.MIN_VALUE,
    );
    for (const c of candidates) {
      c.rankScore =
        LEAP_TIER_SCORE.skill_bridge * W_LEAP_TIER +
        (c.coverage / maxCoverage) * W_COVERAGE;
    }

    const surfacedDirections = candidates.sort(
      (a, b) =>
        b.rankScore - a.rankScore || a.romeCode.localeCompare(b.romeCode),
    );
    return { surfaced: surfacedDirections, heldBack };
  }

  private toCandidate(s: Surface, invSize: number): CandidateDirection {
    const matchedCompetenceCodes = [...s.matchedCompetenceCodes].sort();
    const coverage = invSize > 0 ? matchedCompetenceCodes.length / invSize : 0;
    return {
      romeCode: s.metier.romeCode,
      title: s.metier.title,
      domain: s.metier.domain,
      leapTypes: ["skill_bridge"],
      primaryLeap: "skill_bridge",
      coverage,
      matchedCompetenceCodes,
      matchedRiasec: [],
      interestScore: 0,
      leanScore: 0,
      mobilityScore: 0,
      rarityScore: 0,
      // Phase 0: the signal tier reads matchRaritySum; feed it coverage so the
      // AS-IS DirectionCard renders coverage-based fort/moyen/faible.
      matchRaritySum: coverage,
      rankScore: 0, // stamped in reach() once maxCoverage exists
      why: buildWhy(s.metier, matchedCompetenceCodes),
    };
  }
}

function buildWhy(m: RomeMetier, codes: string[]): string {
  const skillLabels = m.competences
    .filter((c) => codes.includes(c.code))
    .map((c) => c.libelle);
  const n = codes.length;
  return `Skill-bridge — shares ${n} of your skills (${skillLabels.join(", ")}) in a field you wouldn't have searched.`;
}
