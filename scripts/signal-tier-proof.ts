/**
 * Signal-tier fix proof (§4): the user-facing fort/moyen/faible must reflect
 * rarity-weighted match strength, not matched/inventory.size — so the front-door
 * seed inflating inventory size no longer under-reads a genuine fit, while tiers
 * still DISCRIMINATE (a weak generic bridge stays faible; a normal profile stays
 * sane, not inflated to fort).
 *
 * Reports, for each case, the OLD tier (coverageStrength) vs the NEW tier
 * (signalStrength) so the shift is auditable.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live \
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/signal-tier-proof.ts
 */
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { coverageStrength, signalStrength } from "../src/lib/engine/coverage";

const SIG: Record<string, string> = { strong: "FORT", partial: "MOYEN", exploratory: "FAIBLE" };

const DEV: Answers = {
  f_order_improv:"plutot_a", f_surface_depth:"plutot_b", f_scale_task:"plutot_a", f_decide_wait:"plutot_a",
  f_leverage_completeness:"plutot_b", sf_numbers_people:"plutot_a", sf_data_files:"plutot_b",
  sf_digital_tools:"plutot_a", sf_client_issue:"plutot_a", g_lead_support:"plutot_b", c_departement:"75",
};
const A: Answers = { sf_numbers_people:"plutot_b", sf_sell_fix:"plutot_a", g_conflict:"plutot_a", g_teach_do:"plutot_a", sf_write_explain:"plutot_b", c_departement:"75" };
const B: Answers = { f_order_improv:"plutot_a", sf_numbers_people:"plutot_a", sf_data_files:"plutot_a", f_scale_task:"plutot_a", g_lead_support:"plutot_b", c_departement:"75" };

function row(d: ResultDirection | undefined, code: string): string {
  if (!d) return `  ${code}: not surfaced`;
  const oldT = SIG[coverageStrength(d.coverage)];
  const newT = SIG[signalStrength(d.matchRaritySum)];
  const flag = oldT !== newT ? `   ${oldT} → ${newT}` : `   (${newT}, unchanged)`;
  return `  ${code} ${d.title.slice(0, 38).padEnd(38)} matched=${String(d.matchedCompetenceCodes.length).padStart(2)} cov=${(d.coverage*100).toFixed(0).padStart(2)}% sumIdf=${d.matchRaritySum.toFixed(0).padStart(3)}${flag}`;
}

function tally(dirs: ResultDirection[], fn: (d: ResultDirection) => string) {
  const t: Record<string, number> = { strong: 0, partial: 0, exploratory: 0 };
  for (const d of dirs) t[fn(d)]++;
  return `FORT=${t.strong} MOYEN=${t.partial} FAIBLE=${t.exploratory}`;
}

async function main() {
  console.log("=".repeat(86));
  console.log("SIGNAL-TIER FIX PROOF — OLD (coverage) vs NEW (rarity-weighted)");
  console.log("=".repeat(86));

  // 1. SEEDED DEV — the dev jobs must rise OFF faible; a weak generic bridge must stay faible
  const seeded = await buildResults(buildInventory({ ...DEV, seed_families: "tech:code" }));
  const byCode = (c: string) => seeded.directions.find((d) => d.romeCode === c);
  console.log("\n[1] SEEDED DEV (tech:code) — perfect-fit dev jobs vs a weak generic bridge:");
  console.log(row(byCode("M1805"), "M1805")); // Développeur — must NOT be faible
  console.log(row(byCode("M1855"), "M1855")); // Développeur web — must NOT be faible
  console.log(row(byCode("G1602"), "G1602")); // Commis cuisine — weak generic, must stay FAIBLE
  console.log(row(byCode("M1204"), "M1204")); // Contrôle, 1 rare skill — must stay FAIBLE
  console.log(`  whole-set tiers — OLD ${tally(seeded.directions, (d)=>coverageStrength(d.coverage))}`);
  console.log(`                    NEW ${tally(seeded.directions, (d)=>signalStrength(d.matchRaritySum))}`);

  // 2. NORMAL A — must stay sane (not inflated to fort)
  const ra = await buildResults(buildInventory(A));
  console.log("\n[2] NORMAL A (people, no seed) — must stay sane, NOT inflate to fort:");
  console.log(`  OLD ${tally(ra.directions, (d)=>coverageStrength(d.coverage))}`);
  console.log(`  NEW ${tally(ra.directions, (d)=>signalStrength(d.matchRaritySum))}`);
  const topA = [...ra.directions].sort((a,b)=>b.matchRaritySum-a.matchRaritySum).slice(0,3);
  console.log("  A's 3 strongest (rarity) — reasonable to read MOYEN, never all-fort:");
  for (const d of topA) console.log(row(d, d.romeCode));

  // 3. NORMAL B — sanity
  const rb = await buildResults(buildInventory(B));
  console.log("\n[3] NORMAL B (systems, no seed):");
  console.log(`  OLD ${tally(rb.directions, (d)=>coverageStrength(d.coverage))}`);
  console.log(`  NEW ${tally(rb.directions, (d)=>signalStrength(d.matchRaritySum))}`);

  // Verdict
  const dev = byCode("M1805"), web = byCode("M1855"), commis = byCode("G1602");
  const devOk = dev && signalStrength(dev.matchRaritySum) !== "exploratory";
  const webOk = web && signalStrength(web.matchRaritySum) !== "exploratory";
  const weakOk = commis && signalStrength(commis.matchRaritySum) === "exploratory";
  const aSane = ra.directions.filter((d)=>signalStrength(d.matchRaritySum)==="strong").length <= ra.directions.length * 0.3;
  console.log("\n" + "=".repeat(86));
  console.log(`VERDICT — dev off-faible: ${devOk?"✓":"✗"}  web off-faible: ${webOk?"✓":"✗"}  weak-bridge stays faible: ${weakOk?"✓":"✗"}  normal-A not inflated: ${aSane?"✓":"✗"}`);
  console.log("=".repeat(86));
}

main().catch((e) => { console.error(e); process.exit(1); });
