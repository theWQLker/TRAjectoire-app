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
import { buildInventory } from "@/lib/quiz/build-inventory";
import { DEMO_ANSWERS } from "../../../config/demo-persona";

/**
 * Results assembler (PRD §6.2 → §6.4 → §8 → §6.5). The single entry the
 * /results page calls. Reads ONLY through the seams (RomeSource, OfferSource).
 * Deterministic, no LLM, no feasibility score — buckets are labels over
 * visible signals.
 */

/**
 * ZONE INDEPENDENCE (decision 2026-11-22). The zone the user chose changes no
 * role, no direction and no order; it changes display only (the dated ad line,
 * the France Travail links, the skill line). Ad demand never decides which roles
 * show while the data is the 30 June Paris snapshot: 0 cached ads is no proof of
 * a dead end (M1853: 27 cached vs 245 live). So:
 *   - `market`        = the user's zones. DISPLAY ONLY.
 *   - `bucketResult`, `levelPenalty`, the honest fork = the snapshot's covered
 *     départements, one reference for every zone (job properties: level mix,
 *     frequently-asked skills, snapshot demand).
 */
export type ResultDirection = DirectionWithMarket & {
  bucketResult: BucketResult;
  /**
   * The bridge skill line ("Ce qui manque souvent : X (demandé dans 24/42
   * annonces)") from the user's OWN zones, so its count describes ads there. Empty
   * when those zones have no ads. Display only: the category comes from the
   * snapshot reference (`bucketResult`).
   */
  skillGates: BucketResult["unmetGates"];
  /**
   * DISPLAY flag: a strong SEEDED skill match with 0 ads in the user's zones —
   * France Travail under-represents some sectors, so the UI says "vous avez les
   * compétences…" instead of any market claim. It no longer decides whether the
   * role shows: no role is suppressed for having no ads.
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
   * DISPLAY flag: 0 ads in the user's zones AND at least one of them has no offer
   * data at all (decision 2026-11-20), so the ad line reads "pas de données pour
   * votre zone. Non vérifié sur le marché." The role stays where the snapshot
   * reference puts it (decision 2026-11-22).
   */
  marketUnverified?: true;
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
  /**
   * Roles the surfacing gate dropped, counted (§6.4: never a silent filter).
   * Empty since 2026-11-22: the dead-end filter (0 cached ads) is gone, because 0
   * ads in the snapshot is no proof of a dead end. Kept so stored pages and the
   * /results/pistes/ecartees count keep their shape.
   */
  suppressed: SuppressedDirection[];
  /**
   * Directions the coverage floor held back: interest/mobilité matches with ZERO
   * shared skill (fix #1). Never shown as rows — surfaced as a collapsed honest
   * "+N broader interest matches (no skill overlap)" line. A 0-coverage career
   * CHANGE is the LLM seam's job (§6.6), not the deterministic graph's.
   */
  heldBack: HeldBackDirection[];
  /**
   * Empty since 2026-11-22. It held the roles with 0 ads when a chosen zone had
   * no data, which made the pool depend on the zone. Those roles now sit in
   * `directions` like everywhere else, flagged `marketUnverified` for display.
   * Kept until the `directions` branch (whose rolePool reads it) merges.
   */
  unverified: ResultDirection[];
};

/**
 * An EXPLORATORY leap (coverage < ~40%, surfaced by a leap not a direct fit)
 * with 0 ads. Until 2026-11-22 this was the dead-end filter and the role was
 * dropped. It no longer decides anything: 0 cached ads is no proof of a dead
 * end. It only picks which seeded matches get the "vous avez les compétences"
 * ad line (thinMarketSeeded), exactly the cards that got it before.
 */
function zeroAdBridge(d: DirectionWithMarket): boolean {
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
 *       floor (200). It sits BELOW the FORT badge (350), so such a card can read
 *       "moyen"; the floor only decides surfacing, never the label. A
 *       deep same-niche match shares ~40-110 distinctive codes (sumIdf 200-600+),
 *       while a TANGENTIAL cross-domain overlap shares only ~15-25 (sumIdf 50-85)
 *       and is excluded. Without this floor, seeding agriculture would surface
 *       ~100 jobs incl. cross-domain coincidences (négociant, matelot); the floor
 *       cuts it to ~39, ALL same-niche. AND
 *   (d) the market cache shows 0 offers.
 *
 * Such a direction gets an explicit honest ad line (it makes NO market claim).
 * Display only since 2026-11-22: membership no longer reads ads at all.
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

/**
 * The example inventory shown on /results without a session (decision
 * 2026-11-23): built from config/demo-persona.ts like any quiz session. The
 * former hand-written P2 inventory (four payroll/client codes) surfaces nothing
 * under the earned floor.
 */
export const P2_INVENTORY: Inventory = buildInventory(DEMO_ANSWERS);

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
  // Two market views (zone independence, decision 2026-11-22; see ResultDirection):
  // the snapshot REFERENCE (every département the offer cache covers, the same
  // for every user) decides bucket, level demote and the honest fork; the user's
  // ZONES only feed what the page displays about ads there.
  const chosen = inventory.constraints.departements ?? [inventory.constraints.departement];
  const coverage = await offers.coverage();
  const reference = [...new Set(coverage.map((c) => c.departement))].sort();
  const sameScope =
    reference.length === new Set(chosen).size && reference.every((d) => chosen.includes(d));
  const [zoneMarket, referenceMarket] = await Promise.all([
    checkMarketAll(offers, proposed, chosen),
    sameScope ? null : checkMarketAll(offers, proposed, reference),
  ]);
  const refOf = (i: number): DirectionWithMarket => (referenceMarket ?? zoneMarket)[i];

  const seeded = new Set(inventory.seededCodes ?? []);
  const covered = new Set(reference);
  const zoneWithoutData = chosen.some((dep) => !covered.has(dep));
  const excluded = new Set(inventory.excludedJobs ?? []);
  // Nothing is suppressed for its ads any more (0 cached ads is no proof of a
  // dead end); the list stays, empty, so the "écartées" count keeps its shape.
  const suppressed: SuppressedDirection[] = [];

  // Level demote (engine-only, presence-gated). Computed once from the captured
  // Cat-4/5 level profile; 0 for every direction when the user has no level or
  // accepts lower → order identical to pre-demote. Reads the snapshot reference.
  const user = userLevel(inventory);
  const directions: ResultDirection[] = zoneMarket.map((d, i) => {
    const ref = refOf(i);
    const penalty = levelPenalty(ref, user);
    const thinMarketSeeded = zeroAdBridge(d) && isSeededStrongThinMarket(d, seeded);
    return {
      ...d,
      bucketResult: bucket(ref, inventory),
      skillGates: bucket(d, inventory).unmetGates,
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
      ...(zoneWithoutData && d.market.marketDemand === 0 ? { marketUnverified: true as const } : {}),
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

  // Honest fork: "real demand" is read on the snapshot reference, like the
  // buckets, so the fork is the same in every zone; it returns the displayed
  // directions.
  const fork = detectHonestFork(
    directions.map((dir, i) => ({ ...dir, market: refOf(i).market })),
    inventory,
  );
  const byCode = new Map(directions.map((dir) => [dir.romeCode, dir]));
  const honestFork: HonestFork = {
    ...fork,
    forks: fork.forks.map((f) => ({ ...f, direction: byCode.get(f.direction.romeCode)! })),
  };

  return {
    inventory,
    directions,
    byCategory,
    honestFork,
    suppressed,
    heldBack,
    unverified: [],
  };
}
