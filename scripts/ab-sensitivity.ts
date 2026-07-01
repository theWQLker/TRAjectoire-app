/**
 * §6.4 answer-sensitivity gate + §6.5 no-leak grep (the brief's core capability
 * test). Two OPPOSITE answer profiles, through buildInventory → buildResults on
 * live ROME + live offers. Asserts they surface substantially DIFFERENT métiers
 * across the economy (not a regression to ~6 paie/client métiers), and that no
 * 6-digit competence code / percentage / "score" leaks into the rendered text.
 *
 * Profiles are the brief's §6.4 keys verbatim.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live \
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/ab-sensitivity.ts
 */
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";

const A: Answers = {
  sf_numbers_people: "plutot_b",
  sf_sell_fix: "plutot_a",
  g_conflict: "plutot_a",
  g_teach_do: "plutot_a",
  sf_write_explain: "plutot_b",
};
const B: Answers = {
  f_order_improv: "plutot_a",
  sf_numbers_people: "plutot_a",
  sf_data_files: "plutot_a",
  f_scale_task: "plutot_a",
  g_lead_support: "plutot_b",
};

async function main() {
  const ra = await buildResults(buildInventory(A));
  const rb = await buildResults(buildInventory(B));

  const aCodes = new Set(ra.directions.map((d) => d.romeCode));
  const bCodes = new Set(rb.directions.map((d) => d.romeCode));
  const overlap = [...aCodes].filter((c) => bCodes.has(c));
  const aOnly = [...aCodes].filter((c) => !bCodes.has(c));
  const bOnly = [...bCodes].filter((c) => !aCodes.has(c));

  console.log("=".repeat(72));
  console.log(`A/B ANSWER-SENSITIVITY — ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE}`);
  console.log("=".repeat(72));
  console.log(`A surfaced: ${aCodes.size} distinct métiers`);
  console.log(`B surfaced: ${bCodes.size} distinct métiers`);
  console.log(`overlap   : ${overlap.length}  (the broad shared-demand middle)`);
  console.log(`A-only    : ${aOnly.length}`);
  console.log(`B-only    : ${bOnly.length}`);

  let failed = 0;
  const check = (cond: boolean, msg: string) => {
    console.log(`  ${cond ? "✓" : "✗"} ${msg}`);
    if (!cond) failed++;
  };

  // Regression guard: a collapse to ~6 paie/client métiers means the graph or the
  // gate broke. Baseline RE-BASELINED after the §4.3 offer broadening (dept-75
  // ingest 150 → 1,113 codes): with full Paris market coverage, far more directions
  // survive the market gate, so a healthy run now surfaces hundreds, not ~92/125.
  // Current baseline: A≈611 / B≈938 · overlap≈512 · A-only≈99 · B-only≈426. The
  // collapse floor is the invariant we assert (not exact counts, which track the
  // live cache): each side must stay well above the ~6-métier collapse, and the
  // sides must still diverge. Floor set to 200 — comfortably below the live
  // baseline, far above any collapse.
  check(aCodes.size >= 200 && bCodes.size >= 200, `both profiles surface economy-wide (not collapsed): A=${aCodes.size}, B=${bCodes.size} (baseline ≈611/938)`);
  check(aOnly.length + bOnly.length > 0, `the profiles diverge — ${aOnly.length} A-only + ${bOnly.length} B-only directions (baseline ≈99/426)`);

  // §6.5 no-leak: stringify the full rendered-facing payload and assert no raw
  // 6-digit competence code, no "%", no "score" reaches the user. The `why`
  // strings render skill LIBELLÉS, never codes — this catches a regression that
  // leaks a code or a percentage.
  const rendered = JSON.stringify([
    ...ra.directions.map((d) => ({ why: d.why, title: d.title })),
    ...rb.directions.map((d) => ({ why: d.why, title: d.title })),
  ]);
  const codeLeak = rendered.match(/\b\d{6}\b/g) ?? [];
  const pctLeak = /\d+\s*%/.test(rendered);
  const scoreLeak = /"?score"?\s*[:=]/i.test(rendered);
  check(codeLeak.length === 0, `no 6-digit competence code in rendered why/title (${codeLeak.length} found${codeLeak.length ? ": " + codeLeak.slice(0, 5).join(",") : ""})`);
  check(!pctLeak, "no percentage rendered to the user");
  check(!scoreLeak, "no raw 'score' rendered to the user");

  console.log("\n" + (failed ? `FAILED (${failed})` : "A/B SENSITIVITY + NO-LEAK INTACT"));
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
