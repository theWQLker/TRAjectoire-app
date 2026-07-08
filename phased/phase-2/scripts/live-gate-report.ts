/**
 * Live gate report (P5.C) — full pipeline on the live four-leap graph.
 * Real inventory: paie + relation_client + Enterprising lean, dépt 75.
 * Runs buildResults (proposer → market reality → suppression → buckets) and
 * reports leap reach, coverage, multi-leap overlap, unique-leap survivors, and
 * obvious-vs-non-obvious split.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=<fixture|live> \
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/live-gate-report.ts
 */
import { buildResults } from "../src/lib/engine/results";
import { coverageStrength } from "../src/lib/engine/coverage";
import type { Inventory } from "../src/lib/engine/inventory";

const INVENTORY: Inventory = {
  competenceCodes: ["300306", "100343", "124607", "300361"],
  riasec: ["E", "C", "S"],
  clusterScores: { paie: 3, relation_client: 1 },
  riasecScores: { C: 3, E: 2, S: 1 },
  constraints: { departement: "75", departements: ["75"] },
};

// "Home" métiers = the obvious paie/RH + client/usager domains the inventory
// came from. Anything else reached by a leap is genuinely non-obvious.
const HOME_DOMAINS = /ressources humaines|paie|comptab|secr[ée]tariat|relation client|t[ée]l[ée]conseil|administ/i;

async function main() {
  const r = await buildResults(INVENTORY);
  const all = r.directions;

  console.log("=".repeat(80));
  console.log(`LIVE GATE REPORT — ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE}`);
  console.log("inventory: paie + relation_client + Enterprising lean · dépt 75");
  console.log("=".repeat(80));

  console.log(`\nSURFACED (post-suppression): ${all.length}   SUPPRESSED: ${r.suppressed.length}   HELD-BACK (coverage floor, no shared skill): ${r.heldBack.length}`);

  // --- by primary leap ----------------------------------------------------
  const byPrimary: Record<string, number> = { direct: 0, skill_bridge: 0, mobilite: 0, interest: 0 };
  for (const d of all) byPrimary[d.primaryLeap]++;
  console.log("\nSURFACED BY PRIMARY LEAP:");
  for (const k of ["direct", "skill_bridge", "mobilite", "interest"]) {
    console.log(`  ${k.padEnd(13)}: ${byPrimary[k]}`);
  }

  // --- per direction ------------------------------------------------------
  console.log("\nPER DIRECTION (primary leap · all leaps · coverage · multi-leap · category):");
  for (const d of all) {
    const multi = d.leapTypes.length > 1 ? "MULTI" : "single";
    console.log(
      `  ${d.romeCode}  ${d.primaryLeap.padEnd(12)} [${d.leapTypes.join("+")}] ` +
        `${(d.coverage * 100).toFixed(0).padStart(3)}% ${multi.padEnd(6)} ${d.bucketResult.category}`,
    );
    console.log(`        ${d.title}`);
    console.log(`        why: ${d.why}`);
  }

  // --- CRITICAL: unique-reach leaps (interest-alone / mobilité-alone) ------
  const uniqueInterest = all.filter((d) => d.leapTypes.length === 1 && d.leapTypes[0] === "interest");
  const uniqueMobilite = all.filter((d) => d.leapTypes.length === 1 && d.leapTypes[0] === "mobilite");
  console.log("\nUNIQUE-REACH LEAPS THAT SURVIVED THE MARKET GATE (proof each leap adds reach):");
  console.log(`  interest-ALONE survivors: ${uniqueInterest.length}`);
  for (const d of uniqueInterest) console.log(`     ${d.romeCode} ${d.title} (cov ${(d.coverage * 100).toFixed(0)}%, ${d.bucketResult.category})`);
  console.log(`  mobilité-ALONE survivors: ${uniqueMobilite.length}`);
  for (const d of uniqueMobilite) console.log(`     ${d.romeCode} ${d.title} (cov ${(d.coverage * 100).toFixed(0)}%, ${d.bucketResult.category})`);

  // --- obvious vs non-obvious --------------------------------------------
  const obvious = all.filter((d) => d.primaryLeap === "direct" && HOME_DOMAINS.test(d.title));
  const nonObvious = all.filter((d) => !(d.primaryLeap === "direct" && HOME_DOMAINS.test(d.title)));
  console.log("\nOBVIOUS vs NON-OBVIOUS:");
  console.log(`  obvious direct home matches : ${obvious.length}  (${obvious.map((d) => d.romeCode).join(", ")})`);
  console.log(`  genuinely NON-OBVIOUS       : ${nonObvious.length}  (${nonObvious.map((d) => d.romeCode).join(", ")})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
