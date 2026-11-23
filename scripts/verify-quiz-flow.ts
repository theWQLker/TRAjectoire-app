/**
 * End-to-end verification: quiz answers → buildInventory → buildResults.
 * Exercises the weighted answer model, category gating (partial inventory),
 * and confirms financial inputs are captured but never reach the engine.
 * Run: npx tsx scripts/verify-quiz-flow.ts
 */
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { LEAN_WEIGHTS, getScene } from "../config/quiz";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`  ✗ ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

async function main() {
  console.log("=".repeat(70));
  console.log("QUIZ → INVENTORY → RESULTS — end-to-end verification");
  console.log("=".repeat(70));

  // --- 1. Weighted accumulation model ------------------------------------
  console.log("\n[1] Weighted answer model (plutôt/un-peu/les-deux/ni-l'un)");
  assert(LEAN_WEIGHTS.plutot_a.a === 1.0 && LEAN_WEIGHTS.plutot_a.b === 0, "plutôt = full weight, one side");
  assert(LEAN_WEIGHTS.un_peu_a.a === 0.5 && LEAN_WEIGHTS.un_peu_a.b === 0, "un peu = half weight, one side");
  assert(LEAN_WEIGHTS.les_deux.a === 0.5 && LEAN_WEIGHTS.les_deux.b === 0.5, "les deux = half to BOTH sides");
  assert(LEAN_WEIGHTS.ni_l_un.a === 0 && LEAN_WEIGHTS.ni_l_un.b === 0, "ni l'un = nothing");

  // --- 2. Full quiz: paie-leaning + relation-leaning profile -------------
  console.log("\n[2] Full inventory from a realistic answer set");
  const full: Answers = {
    // Cat 1 — order/structure leaning (systemes, rigueur)
    f_order_improv: "plutot_a", // systemes +2 (C/I)
    f_surface_depth: "plutot_b", // analyse +2, detection +2 (I)
    f_leverage_completeness: "plutot_b", // rigueur +2 (C)
    f_decide_wait: "un_peu_b", // besoin_clarte +1 (C) at half
    f_scale_task: "les_deux", // both sides at half
    // Cat 2 — numbers/rules + people (scores relation_client → real ROME codes)
    sf_numbers_people: "les_deux", // A: rigueur+gestion_donnees ×0.5; B: contact+relation_client ×0.5
    sf_hands_organise: "plutot_b", // organisation +2 (C/E)
    sf_sell_fix: "plutot_b", // resolution +2, support +1 (R/I)
    // Cat 3 — support
    g_conflict: "plutot_a", // contact +2, gestion_conflit +1 (S)
    g_lead_support: "plutot_b", // fiabilite +1 (C)
    g_teach_do: "ni_l_un", // nothing
    // Cut 2026-11-23 (nothing read them): stored answers still load, count for nothing.
    c_hours: "plutot_a",
    c_mobility: "plutot_b",
    c_timeline: "plutot_a",
    ar_security_upside: "plutot_a",
    ar_employee_own: "plutot_b",
    // Constraints (the quick-picks left, and the one money scene kept)
    c_departement: "93,94,75", // multi-select: comma-joined option ids (primary = first = 93)
    c_diploma: "bac2",
    ar_learning_investment: "plutot_b", // training_investment=open_if_return_clear
    ar_salaire_min: "1500_1800", // old salary band, carried over as c_accept_lower « oui »
    ar_situation: "chomage", // retired 2026-11-23: a stored value still loads, counts for nothing
  };

  const inv = buildInventory(full);
  console.log("  clusterScores:", JSON.stringify(inv.clusterScores));
  console.log("  riasecScores :", JSON.stringify(inv.riasecScores));

  // Weighting MECHANICS (config-derived, so this survives content tuning).
  // f_scale_task answered "les_deux": every cluster on BOTH sides gets weight×0.5.
  const scaleScene = getScene("f_scale_task");
  for (const cw of scaleScene.optionA.maps.clusters ?? []) {
    const got = inv.clusterScores[cw.id] ?? 0;
    assert(got >= cw.weight * 0.5 - 1e-9, `les_deux applies +${cw.weight}×0.5 to ${cw.id} (got ${got})`);
  }
  // plutôt_a on f_order_improv: side A applied at full weight (×1).
  const orderScene = getScene("f_order_improv");
  for (const cw of orderScene.optionA.maps.clusters ?? []) {
    const got = inv.clusterScores[cw.id] ?? 0;
    assert(got >= cw.weight - 1e-9, `plutôt_a applies full +${cw.weight} to ${cw.id} (got ${got})`);
  }
  // un_peu_b on f_decide_wait: side B at half weight, side A nothing.
  const decideScene = getScene("f_decide_wait");
  for (const cw of decideScene.optionB.maps.clusters ?? []) {
    const got = inv.clusterScores[cw.id] ?? 0;
    assert(got >= cw.weight * 0.5 - 1e-9, `un_peu_b applies +${cw.weight}×0.5 to ${cw.id} (got ${got})`);
  }
  // ni_l_un on g_teach_do: neither side contributes — none of its clusters added by this scene alone.
  const teachScene = getScene("g_teach_do");
  const teachClusters = [
    ...(teachScene.optionA.maps.clusters ?? []),
    ...(teachScene.optionB.maps.clusters ?? []),
  ].map((c) => c.id);
  console.log(`  (g_teach_do clusters, ni_l_un → no weight from this scene: ${teachClusters.join(", ") || "none"})`);
  assert(inv.riasec.includes("C") && inv.riasec.includes("I"), "RIASEC profile includes C and I");

  console.log("\n  Constraints + financial:");
  console.log("  constraints:", JSON.stringify(inv.constraints));
  console.log("  financial_inputs:", JSON.stringify(inv.financial_inputs));
  assert(inv.constraints.departement === "93", "primary département = 93 (first of multi-select)");
  assert(
    JSON.stringify(inv.constraints.departements) === JSON.stringify(["93", "94", "75"]),
    "multi-select stores all chosen départements [93,94,75]",
  );
  assert(inv.constraints.diploma === "bac+2", "quick-pick diplôme = bac+2");
  assert(
    inv.constraints.urgency === undefined && inv.constraints.tensions === undefined,
    "cut constraint scenes: load without error, nothing captured",
  );
  assert(
    inv.financial_inputs?.appetit_risque === undefined && inv.financial_inputs?.pull_autonomie === undefined,
    "cut money scenes: load without error, nothing captured",
  );
  assert(inv.financial_inputs?.training_investment === "open_if_return_clear", "kept scene ar_learning_investment captured");
  assert(
    inv.constraints.accept_lower === "yes" && inv.financial_inputs?.salaire_min === undefined,
    "old salary band 1500-1800 → accept_lower yes, no salary stored",
  );
  for (const [band, want] of [["lt1500", "yes"], ["1500_1800", "yes"], ["1800_2200", "no"], ["2200_2700", "no"], ["gt2700", "no"]]) {
    assert(buildInventory({ ar_salaire_min: band }).constraints.accept_lower === want, `old salary ${band} → accept_lower ${want}`);
  }
  assert(buildInventory({}).constraints.accept_lower === undefined, "no salary answer → accept_lower unanswered");
  assert(
    buildInventory({ ar_salaire_min: "lt1500", c_accept_lower: "non" }).constraints.accept_lower === "no",
    "an answer to the new question wins over an old salary",
  );
  assert(inv.financial_inputs?.situation_actuelle === undefined, "retired ar_situation: loads without error, not captured");

  // Codes: hard-skill clusters with real codes inject; transversal ([]) do not.
  assert(inv.competenceCodes.length > 0, "competenceCodes populated from scored hard-skill clusters (relation_client)");
  assert(inv.competenceCodes.includes("478215"), "real relation_client ROME code present (478215)");
  console.log(`  competenceCodes (${inv.competenceCodes.length}):`, inv.competenceCodes.join(", "));

  // --- 3. Engine does not CONSUME financial inputs (MVP) -----------------
  console.log("\n[3] Engine output is independent of financial inputs (MVP)");
  const results = await buildResults(inv);
  // Same inventory minus financial inputs must yield identical directions/buckets.
  const { financial_inputs: _omit, ...invNoFinancial } = inv;
  const resultsNoFin = await buildResults(invNoFinancial);
  const directionsKey = (r: typeof results) =>
    JSON.stringify(r.directions.map((d) => [d.romeCode, d.bucketResult.category]));
  assert(
    directionsKey(results) === directionsKey(resultsNoFin),
    "directions/buckets identical with vs without financial inputs (engine ignores them)",
  );
  assert(Array.isArray(results.directions), "results.directions produced");
  // Non-empty (2026-11-23): the equality above must compare real directions.
  assert(results.directions.length > 0, `results.directions non-empty (${results.directions.length})`);
  console.log(`  directions: ${results.directions.length}, suppressed: ${results.suppressed.length}`);

  // --- 4. Category gating: partial inventory (Cat 1 only) ----------------
  console.log("\n[4] Category gating — partial inventory (Cat 1 only)");
  const partial: Answers = {
    f_order_improv: "plutot_a",
    f_surface_depth: "plutot_b",
    f_leverage_completeness: "plutot_b",
    f_decide_wait: "plutot_a",
    f_scale_task: "plutot_a",
  };
  const pinv = buildInventory(partial);
  assert(pinv.constraints.departement === "75", "partial inventory defaults département to 75");
  assert(pinv.financial_inputs === undefined, "no financial inputs when Cat 5 skipped");
  assert(pinv.constraints.tensions === undefined, "no tensions when Cat 4 skipped");
  assert(Object.keys(pinv.clusterScores).length > 0, "partial inventory still has cluster scores");
  const presults = await buildResults(pinv);
  assert(Array.isArray(presults.directions), "partial inventory yields partial results without error");
  console.log(`  partial directions: ${presults.directions.length}`);

  console.log("\n" + "=".repeat(70));
  console.log(process.exitCode ? "FAILED" : "ALL CHECKS PASSED");
  console.log("=".repeat(70));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
