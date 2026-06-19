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

/**
 * Results assembler (PRD §6.2 → §6.4 → §8 → §6.5). The single entry the
 * /results page calls. Reads ONLY through the seams (RomeSource, OfferSource).
 * Deterministic, no LLM, no feasibility score — buckets are labels over
 * visible signals.
 */

export type ResultDirection = DirectionWithMarket & { bucketResult: BucketResult };

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
  // are dropped but counted; everything else surfaces.
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
    honestFork: detectHonestFork(surviving, inventory),
    suppressed,
    heldBack,
  };
}
