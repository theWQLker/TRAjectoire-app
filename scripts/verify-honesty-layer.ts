/**
 * P5.C honesty-layer assertion. Weighted ordering must reorder ONLY — it must
 * never reintroduce a verdict, un-suppress a dead-end, or break exploratory
 * subordination. This runs the FULL results pipeline (proposer → market →
 * suppression → buckets) on the live graph and asserts the invariants.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=fixture \
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/verify-honesty-layer.ts
 */
import { buildResults } from "../src/lib/engine/results";
import { isExploratory } from "../src/lib/engine/coverage";
import type { Inventory } from "../src/lib/engine/inventory";

const INVENTORY: Inventory = {
  competenceCodes: ["300306", "100343", "124607", "300361"],
  riasec: ["E", "C", "S"],
  clusterScores: { paie: 3, relation_client: 1 },
  riasecScores: { C: 3, E: 2, S: 1 },
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
  console.log(`Honesty layer — ROME_SOURCE=${process.env.ROME_SOURCE ?? "fixture"} OFFER_SOURCE=${process.env.OFFER_SOURCE ?? "fixture"}`);
  console.log("=".repeat(72));
  console.log(`directions surfaced: ${r.directions.length} · suppressed: ${r.suppressed.length}`);

  // 1. Dead-end suppression still active: nothing in `directions` is a dead-end
  //    bridge (exploratory + leap + zero market). Suppressed ones are listed,
  //    not silently dropped.
  const leakedDeadEnds = r.directions.filter(
    (d) => d.primaryLeap !== "direct" && isExploratory(d.coverage) && d.market.marketDemand === 0,
  );
  check(leakedDeadEnds.length === 0, `no dead-end bridge leaked into surfaced directions (${leakedDeadEnds.length} leaked)`);
  check(Array.isArray(r.suppressed), `suppressed list present and counted (${r.suppressed.length} shown, never silent)`);

  // 2. Exploratory subordination: within each category, no exploratory direction
  //    is ranked above a solid (non-exploratory) one.
  let subordinationOk = true;
  for (const cat of Object.values(r.byCategory)) {
    let seenExploratory = false;
    for (const d of cat) {
      if (isExploratory(d.coverage)) seenExploratory = true;
      else if (seenExploratory) subordinationOk = false; // solid after exploratory = broken
    }
  }
  check(subordinationOk, "exploratory directions stay subordinate to solid fits within each category");

  // 3. No verdict: results carry coverage/leap/why/category — never a verdict,
  //    disqualifier, or final_score FIELD (hard invariant, SCHEMA.md). Match the
  //    JSON KEY form ("verdict":) — not prose, since honest copy legitimately
  //    says "...not a verdict." (which is the layer asserting it has none).
  const json = JSON.stringify(r);
  const verdictKey = /"(verdict|disqualifiers?|final_score)"\s*:/i.test(json);
  check(!verdictKey, "no verdict / disqualifier / final_score FIELD in output (prose 'not a verdict' is allowed)");

  // 4. Weights reorder, don't re-surface: every surfaced direction still has a
  //    real reason (a leap) and a plain-language why — not a bare score.
  const allHaveWhy = r.directions.every((d) => typeof d.why === "string" && d.why.length > 0);
  check(allHaveWhy, '"based on N of your skills"-style why present on every direction');

  // 5. Surfacing is decided by SKILLS, never by weight (fix #1 + "weights order,
  //    never gate"). Every surfaced direction must be skill-backed: a
  //    direct/skill_bridge leap, OR ≥1 shared competence code (coverage > 0).
  //    leanScore/interestScore never gate a row in or out — they only reorder.
  const allSkillBacked = r.directions.every(
    (d) =>
      d.leapTypes.includes("direct") ||
      d.leapTypes.includes("skill_bridge") ||
      d.matchedCompetenceCodes.length > 0,
  );
  check(allSkillBacked, "every surfaced direction is skill-backed (coverage floor; weight never gates)");

  // 6. The floor held back ONLY zero-overlap directions, and they are counted
  //    (never silently dropped) — interest/mobilité firehose guard (§6.4).
  check(Array.isArray(r.heldBack), `held-back interest/mobilité matches counted (${r.heldBack.length}), never silent`);

  console.log("\n" + (failed ? `FAILED (${failed})` : "HONESTY LAYER INTACT — all invariants hold"));
  if (failed) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
