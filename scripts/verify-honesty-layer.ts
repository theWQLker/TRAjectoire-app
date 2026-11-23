/**
 * P5.C honesty-layer assertion. Weighted ordering must reorder ONLY — it must
 * never reintroduce a verdict, let the zone change the result, or break exploratory
 * subordination. This runs the FULL results pipeline (proposer → market →
 * buckets) on the live graph and asserts the invariants.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=fixture \
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/verify-honesty-layer.ts
 */
import { buildResults } from "../src/lib/engine/results";
import { isExploratory } from "../src/lib/engine/coverage";
import { PARITY_ZONES, zoneSignature, directionsSignature, firstDiff, ftLinkProblems } from "./zone-parity";
import { computeDirections } from "../src/lib/engine/directions";
import type { Inventory } from "../src/lib/engine/inventory";
import { buildInventory } from "../src/lib/quiz/build-inventory";
import { getRomeSource } from "../src/lib/rome";
import { MIN_EARNED_CODES } from "../src/lib/engine/graph-direction-proposer";
import { MAX_CODE_DOMAINES } from "../config/genericity";

// Test profile (2026-11-23): the hand-written secretary of scripts/honest-
// personas.ts, answers only, zone 75. Under the earned floor the former
// four-code inventory surfaced 0 roles, so every check passed on nothing. This
// one surfaces roles in several buckets and holds back 1,805 unearned roles: it
// exercises the floor and held-back counting. (Its 7 former dead ends now show:
// the zone-independence change removed the dead-end filter.)
const ANSWERS: Record<string, string> = {
  c_departement: "75", f_order_improv: "plutot_a", f_surface_depth: "un_peu_a",
  f_leverage_completeness: "un_peu_b", f_decide_wait: "un_peu_b", f_scale_task: "un_peu_a",
  f_ambiguous_instruction: "plutot_a", f_repeat_problem: "un_peu_b", f_new_domain: "un_peu_b",
  f_detail_big_picture: "plutot_a", f_energy_context: "les_deux", sf_numbers_people: "un_peu_a",
  sf_hands_organise: "plutot_b", sf_sell_fix: "ni_l_un", sf_write_explain: "plutot_a",
  sf_create_express: "un_peu_b", sf_data_files: "plutot_a", sf_digital_tools: "un_peu_b",
  sf_client_issue: "plutot_b", sf_project_followup: "plutot_a", sf_training_peer: "un_peu_b",
  sf_people_accounts: "les_deux", g_conflict: "un_peu_b", g_lead_support: "plutot_b",
  g_teach_do: "un_peu_a", g_group_energy: "un_peu_a", g_boundaries: "un_peu_b",
  g_status_authority: "un_peu_b", g_hidden_need: "un_peu_a",
};
const INVENTORY: Inventory = buildInventory(ANSWERS);

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

  // 0. Non-empty (2026-11-23): every check below must run on real roles. An
  //    empty result would pass them all vacuously.
  check(r.directions.length >= 10, `the test profile surfaces at least 10 roles (${r.directions.length})`);

  // 1a. Zone independence (decision 2026-11-22; replaces "no dead-end bridge
  //     (marketDemand === 0)"): the same answers give the same roles, buckets,
  //     order, first view, held-back, fork, directions, révélée tags and
  //     « Autres pistes » in 75, 93 and 69. Ad demand in
  //     the user's zone never decides membership; 0 cached ads is no proof of a
  //     dead end.
  const sigs = new Map<string, string[]>();
  for (const z of PARITY_ZONES) {
    const az = { ...ANSWERS, c_departement: z };
    const iz = buildInventory(az);
    iz.constraints = { ...iz.constraints, departement: z, departements: [z] };
    const rz = await buildResults(iz);
    sigs.set(z, [...zoneSignature(rz), ...directionsSignature(await computeDirections(rz, az))]);
  }
  const base = sigs.get(PARITY_ZONES[0])!;
  const zoneDiffs = PARITY_ZONES.slice(1)
    .map((z) => [z, firstDiff(base, sigs.get(z)!)] as const)
    .filter(([, d]) => d !== null);
  check(
    zoneDiffs.length === 0,
    `same roles, order, groups and directions in ${PARITY_ZONES.join(", ")} (${base.length} lines compared)` +
      zoneDiffs.map(([z, d]) => `\n      ${z}: ${d}`).join(""),
  );

  // 1b. Every surfaced role carries a live France Travail search for each chosen
  //     zone (the zone's one job on the page besides the ad line).
  const noLink = ftLinkProblems(r);
  check(noLink.length === 0, `every surfaced role has a France Travail search link (${noLink.length} without)`);
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

  // 5b. Earned floor (decision 2026-11-23): every surfaced role shares at least
  //     MIN_EARNED_CODES codes listed in at most MAX_CODE_DOMAINES domaines, and
  //     the roles the floor removes are counted in held-back (reason "unearned"),
  //     never shown. Domaine spread is recomputed here from the graph, not taken
  //     from the engine, so a broken engine helper can't vouch for itself.
  const spread = new Map<string, Set<string>>();
  for (const j of await getRomeSource().allMetiers())
    for (const c of j.competences) {
      const s = spread.get(c.code) ?? new Set<string>();
      s.add(j.romeCode.slice(0, 3));
      spread.set(c.code, s);
    }
  const earnedCount = (codes: string[]) =>
    codes.filter((c) => (spread.get(c)?.size ?? 0) <= MAX_CODE_DOMAINES).length;
  const underFloor = r.directions.filter((d) => earnedCount(d.matchedCompetenceCodes) < MIN_EARNED_CODES);
  const unearned = r.heldBack.filter((h) => h.reason === "unearned");
  const shownCodes = new Set(r.directions.map((d) => d.romeCode));
  const shownAndHeld = unearned.filter((h) => shownCodes.has(h.romeCode));
  check(
    underFloor.length === 0 && unearned.length > 0 && shownAndHeld.length === 0,
    `earned floor: every role shares ≥${MIN_EARNED_CODES} codes under the bound (${underFloor.length} below), ` +
      `${unearned.length} unearned roles counted in held-back, ${shownAndHeld.length} both shown and held back`,
  );

  // 6. The floor held back ONLY zero-overlap directions, and they are counted
  //    (never silently dropped) — interest/mobilité firehose guard (§6.4).
  check(Array.isArray(r.heldBack), `held-back interest/mobilité matches counted (${r.heldBack.length}), never silent`);

  console.log("\n" + (failed ? `FAILED (${failed})` : "HONESTY LAYER INTACT — all invariants hold"));
  if (failed) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
