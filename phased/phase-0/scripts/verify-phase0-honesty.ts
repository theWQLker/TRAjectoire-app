/**
 * Phase 0 honesty invariants. Runs the full Phase-0 pipeline (skill-bridge
 * proposer → market → suppression → buckets) and asserts the Phase-0 honesty
 * contract ONLY (no rarity tiers, no surface-with-label).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/verify-phase0-honesty.ts
 */
import { buildResults } from "../src/lib/engine/results";
import { signalStrength } from "../src/lib/engine/coverage";
import type { Inventory } from "../src/lib/engine/inventory";
import { seedCodesFor } from "../config/families";

const INVENTORY: Inventory = {
  competenceCodes: seedCodesFor(["tech"]),
  seededCodes: seedCodesFor(["tech"]),
  riasec: [],
  clusterScores: {},
  riasecScores: {},
  constraints: { departement: "75", departements: ["75"] },
};

let failed = 0;
function check(cond: boolean, msg: string) {
  console.log(`  ${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failed++;
}

async function main() {
  const r = await buildResults(INVENTORY);
  console.log("=".repeat(72));
  console.log(`Phase 0 honesty — ROME_SOURCE=${process.env.ROME_SOURCE ?? "fixture"} OFFER_SOURCE=${process.env.OFFER_SOURCE ?? "fixture"}`);
  console.log("=".repeat(72));
  console.log(`directions surfaced: ${r.directions.length} · suppressed: ${r.suppressed.length}`);

  // 0. Non-vacuity guard: the pipeline must surface directions at all, so the
  //    .every()-based invariants below cannot pass on an empty set.
  check(r.directions.length > 0, `pipeline surfaced ≥1 direction (${r.directions.length}) — invariants below are non-vacuous`);

  // 1. No verdict / disqualifier / final_score JSON key.
  const json = JSON.stringify(r);
  check(!/"(verdict|disqualifiers?|final_score)"\s*:/i.test(json),
    "no verdict / disqualifier / final_score field in output");

  // 2. Every surfaced direction has a non-empty 'why'.
  check(r.directions.every((d) => typeof d.why === "string" && d.why.length > 0),
    "every surfaced direction has a 'why surfaced' explanation");

  // 3. The matched-code-count signal is DISCRIMINATING (not stuck on one tier):
  //    it must map counts to all three tiers at the calibrated thresholds
  //    (FORT ≥ 4, MOYEN ≥ 2, else faible). Asserted on known counts so the tier
  //    function itself is verified, independent of what this run happens to
  //    surface. The AS-IS DirectionCard reads the same signalStrength via
  //    matchRaritySum (= matched count).
  const tierOf = (n: number) => signalStrength(n);
  check(
    tierOf(6) === "strong" && tierOf(4) === "strong" &&
      tierOf(3) === "partial" && tierOf(2) === "partial" &&
      tierOf(1) === "exploratory" && tierOf(0) === "exploratory",
    `matched-count signal discriminates all three tiers (6/4→fort, 3/2→moyen, 1/0→faible)`,
  );
  // And the live set uses a valid tier for every direction.
  const liveTiers = new Set(r.directions.map((d) => signalStrength(d.matchedCompetenceCodes.length)));
  check(
    [...liveTiers].every((t) => t === "strong" || t === "partial" || t === "exploratory"),
    `every surfaced direction has a valid signal tier (${[...liveTiers].join(",")})`,
  );

  // 4. Weak results are not final recommendations: suppressed counted, listed.
  check(Array.isArray(r.suppressed), `suppressed list present and counted (${r.suppressed.length}), never silent`);

  // 5. Market receipts attach where offers exist.
  const withOffers = r.directions.filter((d) => d.market.marketDemand > 0);
  check(withOffers.every((d) => Array.isArray(d.market.offers)),
    `market receipts present on directions with demand (${withOffers.length})`);

  // 6. Coverage floor: every surfaced direction is skill-backed (Phase 0: all
  //    are skill_bridge with ≥1 matched code).
  check(r.directions.every((d) => d.matchedCompetenceCodes.length > 0),
    "coverage floor enforced — every surfaced direction shares ≥1 skill");

  // 7. Phase-0 leap purity: only skill_bridge surfaced.
  check(r.directions.every((d) => d.primaryLeap === "skill_bridge"),
    "only skill_bridge leap active (no direct/mobilité/interest)");

  console.log("\n" + (failed ? `FAILED (${failed})` : "PHASE 0 HONESTY INTACT — all invariants hold"));
  if (failed) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
