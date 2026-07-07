import { getOfferSource } from "@/lib/offers";
import { getRomeSource } from "@/lib/rome";
import type { Inventory } from "./inventory";
import { GraphDirectionProposer } from "./graph-direction-proposer";
import type { HeldBackDirection } from "./direction-proposer";
import { checkMarketAll, type DirectionWithMarket } from "./market-reality";
import { bucket, type BucketResult } from "./bucketer";
import { detectHonestFork, type HonestFork } from "./honest-fork";
import { isExploratory } from "./coverage";
import type { Category } from "../../../config/buckets";
import { seedCodesFor } from "../../../config/families";

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

/** Phase 0 demo inventory (no-session fallback): a seeded tech profile in dépt 75. */
export const P2_INVENTORY: Inventory = {
  competenceCodes: seedCodesFor(["tech"]),
  seededCodes: seedCodesFor(["tech"]),
  riasec: [],
  clusterScores: {},
  riasecScores: {},
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

  // Surfacing gate (Phase 0): dead-end exploratory bridges (low coverage, leap,
  // no market) are dropped but counted; everything else surfaces. The
  // surface-with-label exception (thinMarketSeeded) is a Phase-1+ behavior and is
  // not part of Phase 0.
  const suppressed: SuppressedDirection[] = [];
  const surviving: DirectionWithMarket[] = [];
  for (const d of withMarket) {
    if (isDeadEndBridge(d)) {
      suppressed.push({
        romeCode: d.romeCode,
        title: d.title,
        reason: `${Math.round(d.coverage * 100)}% skill overlap and no live offers — a coincidence, not a direction.`,
      });
    } else {
      surviving.push(d);
    }
  }

  const directions: ResultDirection[] = surviving.map((d) => ({
    ...d,
    bucketResult: bucket(d, inventory),
    levelPenalty: 0,
    displayRank: d.rankScore, // no demote in Phase 0
  }));

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
