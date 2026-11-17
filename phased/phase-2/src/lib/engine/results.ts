import { getOfferSource } from "@/lib/offers";
import { getRomeSource } from "@/lib/rome";
import type { Inventory } from "./inventory";
import { GraphDirectionProposer } from "./graph-direction-proposer";
import type { HeldBackDirection } from "./direction-proposer";
import { checkMarketAll, type DirectionWithMarket } from "./market-reality";
import { bucket, type BucketResult } from "./bucketer";
import { detectHonestFork, type HonestFork } from "./honest-fork";
import { isExploratory } from "./coverage";
import { userLevel, levelPenalty, displayRank } from "./level-demote";
import { applyCoherence, clusterKey } from "./coherence";
import type { Category } from "../../../config/buckets";

/**
 * Results assembler (PRD §6.2 → §6.4 → §8 → §6.5). The single entry the
 * /results page calls. Reads ONLY through the seams (RomeSource, OfferSource).
 * Deterministic, no LLM, no feasibility score — buckets are labels over
 * visible signals.
 */

export type ResultDirection = DirectionWithMarket & {
  bucketResult: BucketResult;
  /**
   * True when this direction would have been suppressed as a dead-end (0 cached
   * offers) but was KEPT because it's a strong SEEDED skill match — France Travail
   * under-represents some sectors, so 0 ads is a biased "no market" signal there.
   * The UI shows an explicit honest label ("vous avez les compétences, mais peu ou
   * pas d'annonces…") instead of any market claim. Never set for non-seeded or
   * non-strong matches — those keep the strict gate.
   */
  thinMarketSeeded?: boolean;
  /**
   * True when the user EXCLUDED this job at seed time ("pas pour moi") but it
   * STILL surfaces as a genuine match — the honesty break-through: exclusion shapes
   * the seed, it does NOT censor the engine. The UI flags it ("vous avez écarté X,
   * mais votre profil colle fort ici"). Never hides an honest fit.
   */
  excludedButSurfaced?: boolean;
  /**
   * ENGINE-ONLY level demote (LEVEL-ONLY build, salary dropped). `levelPenalty`
   * ∈ [0,1] is how far this direction's typical level sits BELOW the level the
   * user demonstrated (0 = no mismatch / no data / user accepts lower — presence-
   * gated). `displayRank` = the proposer's composite `rankScore` scaled down by
   * it: the value the results page SORTS by. Ordering by rankScore (not bare
   * matchRaritySum) means the quiz's lean / interest personalisation reaches the
   * DISPLAYED order, not just what surfaces; the level demote then sinks
   * level-mismatched directions on top of that. The demote is NOT part of
   * rankScore (proposer never sees it), so scaling here applies it exactly once —
   * no double-penalty. Never rendered; the Signal tier keeps reading raw
   * matchRaritySum, so tier honesty is untouched. displayRank == rankScore when
   * penalty is 0.
   */
  levelPenalty: number;
  displayRank: number;
  /**
   * COHERENCE layer (spec 2026-07-23, display-order only). The 3-char ROME
   * sub-domain cluster this direction belongs to.
   */
  coherenceCluster: string;
  /** Diminishing-returns down-weight ∈ [0,1] for over-represented cluster tails. */
  coherencePenalty: number;
  /**
   * displayRank × (1 − coherencePenalty) — the value the page sorts the VISIBLE
   * order by. Layered on top of displayRank (which keeps the level-demote); each
   * demote applied exactly once. Never gates, never a verdict, never shown.
   */
  coherenceRank: number;
  /**
   * True for the single cross-domain wildcard (spec §5), pinned first in its own
   * bucket and labelled honestly by the UI. Absent when no credible wildcard.
   */
  isWildcard?: boolean;
};

/** A direction the surfacing gate dropped, kept for an honest "we dropped N" line. */
export type SuppressedDirection = {
  romeCode: string;
  title: string;
  reason: string;
};

export type Results = {
  inventory: Inventory;
  directions: ResultDirection[];
  byCategory: Record<Category, ResultDirection[]>;
  honestFork: HonestFork;
  /** dead-end exploratory bridges with no market — suppressed, but counted (§6.4: never a silent filter) */
  suppressed: SuppressedDirection[];
  /**
   * Directions the coverage floor held back: interest/mobilité matches with ZERO
   * shared skill (fix #1). Never shown as rows — surfaced as a collapsed honest
   * "+N broader interest matches (no skill overlap)" line. A 0-coverage career
   * CHANGE is the LLM seam's job (§6.6), not the deterministic graph's.
   */
  heldBack: HeldBackDirection[];
};

/**
 * Surfacing gate. An EXPLORATORY leap (coverage < ~40%, surfaced by a leap not
 * a direct fit) with ZERO market demand is a dead end, not a discovery — drop
 * it. A high-coverage / direct direction with zero demand is NOT dropped: thin
 * demand for your core skill is an honest signal worth seeing (PRD §6.4).
 */
function isDeadEndBridge(d: DirectionWithMarket): boolean {
  return (
    d.primaryLeap !== "direct" &&
    isExploratory(d.coverage) &&
    d.market.marketDemand === 0
  );
}

/**
 * A direction that the user DEEPLY has the SKILLS for via the front-door SEED,
 * even though the cache shows 0 offers (AUTHORIZED honesty change). True iff:
 *   (a) it passed the coverage floor (≥1 shared skill — guaranteed for any
 *       surfaced direction), AND
 *   (b) ≥1 of the matched codes came from a SEED (a picked job niche), AND
 *   (c) the matched distinctive skill is DEEP — matchRaritySum ≥ the deep-niche
 *       floor. This is a HIGHER bar than the FORT badge (which fires at ~50): a
 *       deep same-niche match shares ~40-110 distinctive codes (sumIdf 200-600+),
 *       while a TANGENTIAL cross-domain overlap shares only ~15-25 (sumIdf 50-85)
 *       and is excluded. Without this floor, seeding agriculture would surface
 *       ~100 jobs incl. cross-domain coincidences (négociant, matelot); the floor
 *       cuts it to ~39, ALL same-niche. AND
 *   (d) the market cache shows 0 offers.
 *
 * Such a direction is NOT suppressed — it surfaces with an explicit honest label
 * (it makes NO market claim). The firehose guard is intact: a non-seeded match, a
 * shallow/tangential match, or a 0-coverage interest/mobilité junk row gets NONE
 * of this — they keep the strict gate. Earned ONLY by DEEP seeded skill strength.
 */
const DEEP_SEED_MATCH_FLOOR = 200; // matchRaritySum; ~40+ distinctive shared codes

function isSeededStrongThinMarket(
  d: DirectionWithMarket,
  seeded: ReadonlySet<string>,
): boolean {
  if (d.market.marketDemand !== 0) return false;
  if (seeded.size === 0) return false;
  if (d.matchRaritySum < DEEP_SEED_MATCH_FLOOR) return false;
  return d.matchedCompetenceCodes.some((c) => seeded.has(c));
}

/** Hardcoded P2 inventory: paie skills + a client/usager skill + Enterprising. */
export const P2_INVENTORY: Inventory = {
  competenceCodes: ["300306", "100343", "124607", "300361"],
  riasec: ["E"],
  clusterScores: { paie: 3, relation_client: 1 },
  riasecScores: { E: 2, C: 3, S: 1 },
  constraints: { departement: "75", departements: ["75"] },
};

export const INVENTORY_LABELS: Record<string, string> = {
  "300306": "Gérer la paie",
  "100343": "Législation sociale",
  "124607": "Réaliser des déclarations réglementaires",
  "300361": "Accueillir, orienter, renseigner un public",
};

export async function buildResults(inventory: Inventory): Promise<Results> {
  const rome = getRomeSource();
  const offers = getOfferSource();

  const { surfaced: proposed, heldBack } = await new GraphDirectionProposer(
    rome,
  ).reach(inventory);
  const withMarket = await checkMarketAll(
    offers,
    proposed,
    // every selected département (falls back to the primary for older inventories)
    inventory.constraints.departements ?? [inventory.constraints.departement],
  );

  // Surfacing gate: dead-end exploratory bridges (low coverage, leap, no market)
  // are dropped but counted; everything else surfaces. EXCEPTION (authorized §3
  // change): a strong SEEDED skill match with 0 cached offers is NOT a dead end —
  // France Travail under-represents some sectors, so 0 ads is a biased signal
  // there. It surfaces flagged (thinMarketSeeded) for an explicit honest label,
  // never suppressed. The firehose guard is unchanged for everything else.
  const seeded = new Set(inventory.seededCodes ?? []);
  const excluded = new Set(inventory.excludedJobs ?? []);
  const suppressed: SuppressedDirection[] = [];
  const surviving: { d: DirectionWithMarket; thinMarketSeeded: boolean }[] = [];
  for (const d of withMarket) {
    if (isDeadEndBridge(d)) {
      if (isSeededStrongThinMarket(d, seeded)) {
        // earned exception: keep it, label it — do NOT suppress
        surviving.push({ d, thinMarketSeeded: true });
      } else {
        suppressed.push({
          romeCode: d.romeCode,
          title: d.title,
          reason: `${Math.round(d.coverage * 100)}% skill overlap and no live offers — a coincidence, not a direction.`,
        });
      }
    } else {
      surviving.push({ d, thinMarketSeeded: false });
    }
  }

  // Level demote (engine-only, presence-gated). Computed once from the captured
  // Cat-4/5 level profile; 0 for every direction when the user has no level or
  // accepts lower → order identical to pre-demote.
  const user = userLevel(inventory);
  const directions: ResultDirection[] = surviving.map(({ d, thinMarketSeeded }) => {
    const penalty = levelPenalty(d, user);
    return {
      ...d,
      bucketResult: bucket(d, inventory),
      levelPenalty: penalty,
      // Order by the proposer's composite rankScore (so quiz lean/interest reach
      // the displayed order), scaled by the level demote. rankScore does NOT
      // include the demote, so this applies it exactly once.
      displayRank: displayRank(d.rankScore, penalty),
      // coherence fields stamped in the pass below; placeholders keep the type total
      coherenceCluster: clusterKey(d.romeCode),
      coherencePenalty: 0,
      coherenceRank: displayRank(d.rankScore, penalty),
      ...(thinMarketSeeded ? { thinMarketSeeded: true } : {}),
      // honesty break-through: an excluded job that STILL surfaces is flagged, not
      // hidden — exclusion shaped the seed, it did not censor the engine.
      ...(excluded.has(d.romeCode) ? { excludedButSurfaced: true } : {}),
    };
  });

  // COHERENCE pass (spec 2026-07-23) — display-order only. Runs over the full
  // surfaced+demoted set, stamps coherencePenalty / coherenceRank, flags the one
  // wildcard. rankScore, displayRank, buckets and tiers are all untouched.
  const { penalties, wildcard } = applyCoherence(directions);
  for (const dir of directions) {
    const p = penalties.get(dir) ?? 0;
    dir.coherencePenalty = p;
    dir.coherenceRank = dir.displayRank * (1 - p);
  }
  if (wildcard) wildcard.isWildcard = true;

  const byCategory: Record<Category, ResultDirection[]> = {
    apply_now: [],
    bridge: [],
    long_term: [],
    not_now: [],
  };
  for (const d of directions) byCategory[d.bucketResult.category].push(d);

  return {
    inventory,
    directions,
    byCategory,
    // honest fork considers only what survived the gate
    honestFork: detectHonestFork(directions, inventory),
    suppressed,
    heldBack,
  };
}
