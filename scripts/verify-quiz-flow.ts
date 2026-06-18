/**
 * End-to-end verification: quiz answers → buildInventory → buildResults.
 * Exercises the weighted answer model, category gating (partial inventory),
 * and confirms financial inputs are captured but never reach the engine.
 * Run: npx tsx scripts/verify-quiz-flow.ts
 */
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { LEAN_WEIGHTS } from "../config/quiz";

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
    // Cat 4 — constraints (scenes + quick-picks)
    c_hours: "plutot_a", // tension hours=fixed
    c_mobility: "plutot_b", // tension mobility=mobile
    c_timeline: "plutot_a", // urgency=now
    c_departement: "93",
    c_diploma: "bac2",
    // Cat 5 — financial (captured, never consumed)
    ar_security_upside: "plutot_a", // appetit_risque=low
    ar_employee_own: "plutot_b", // pull_autonomie=high
    ar_salaire_min: "1500_2000",
    ar_situation: "chomage",
  };

  const inv = buildInventory(full);
  console.log("  clusterScores:", JSON.stringify(inv.clusterScores));
  console.log("  riasecScores :", JSON.stringify(inv.riasecScores));

  assert(inv.clusterScores.systemes === 3, "systemes = 3 (plutôt A +2 on f_order_improv, les deux +1 on f_scale_task)");
  assert(inv.clusterScores.rigueur === 3, "rigueur = 2 (f_leverage B) + 1 (sf_numbers les deux → +2 × 0.5)");
  assert(inv.clusterScores.relation_client === 1, "relation_client = 1 (sf_numbers les deux → +2 × 0.5)");
  assert(inv.clusterScores.besoin_clarte === 0.5, "besoin_clarte = 0.5 (un peu B)");
  // les_deux on f_scale_task: execution(+1)*0.5 + pragmatisme(+1)*0.5 on B; systemes(+2)*0.5 + scalabilite(+2)*0.5 on A
  assert(inv.clusterScores.scalabilite === 1, "scalabilite = 1 (les deux → +2 × 0.5)");
  assert(inv.clusterScores.pragmatisme === 0.5, "pragmatisme = 0.5 (les deux → +1 × 0.5)");
  assert(!("g_teach_do" in inv.clusterScores), "ni l'un on g_teach_do contributes nothing");
  assert(inv.riasec.includes("C") && inv.riasec.includes("I"), "RIASEC profile includes C and I");

  console.log("\n  Constraints + financial:");
  console.log("  constraints:", JSON.stringify(inv.constraints));
  console.log("  financial_inputs:", JSON.stringify(inv.financial_inputs));
  assert(inv.constraints.departement === "93", "quick-pick département = 93");
  assert(inv.constraints.diploma === "bac+2", "quick-pick diplôme = bac+2");
  assert(inv.constraints.urgency === "now", "Cat-4 timeline → urgency=now");
  assert(inv.constraints.tensions?.hours === "fixed", "tension hours=fixed");
  assert(inv.constraints.tensions?.mobility === "mobile", "tension mobility=mobile");
  assert(inv.financial_inputs?.appetit_risque === "low", "financial appetit_risque=low captured");
  assert(inv.financial_inputs?.pull_autonomie === "high", "financial pull_autonomie=high captured");
  assert(inv.financial_inputs?.salaire_min === "1500-2000", "financial salaire_min captured");
  assert(inv.financial_inputs?.situation_actuelle === "chomage", "financial situation captured");

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
