/**
 * tech→code SEED proof (BUILD_BRIEF §4 front-door, first family).
 *
 * Same developer persona as the dev-persona test, now WITH the front-door pick
 * seed_families="tech:code". Pass bar: M1805 Développeur lands in the top-10
 * (it was #82). Also reports M1805's coverage + Signal tier (fort/moyen/faible)
 * — if rank passes but Signal=faible, that's the 198-code seed inflating the
 * coverage denominator: FLAG it (the fix would be rarity-aware Signal tiers, not
 * built here). Finally checks the seed stayed ADDITIVE: the analyst bridges a dev
 * shares (M1201/M1202 etc.) must still surface.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live \
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/seed-proof-tech-code.ts
 */
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { rankScore, rankNormalisers, W_RARITY } from "../src/lib/engine/graph-direction-proposer";
import { coverageStrength } from "../src/lib/engine/coverage";

const SIGNAL: Record<string, string> = { strong: "FORT", partial: "MOYEN", exploratory: "FAIBLE" };

const DEV_BASE: Answers = {
  f_order_improv: "plutot_a", f_surface_depth: "plutot_b", f_scale_task: "plutot_a",
  f_decide_wait: "plutot_a", f_leverage_completeness: "plutot_b", sf_numbers_people: "plutot_a",
  sf_data_files: "plutot_b", sf_digital_tools: "plutot_a", sf_client_issue: "plutot_a",
  g_lead_support: "plutot_b", c_departement: "75",
};

function rank(dirs: ResultDirection[]) {
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(dirs);
  return [...dirs]
    .map((d) => ({ d, s: rankScore(d, maxLean, maxInterest, maxRarity) }))
    .sort((a, b) => b.s - a.s || a.d.romeCode.localeCompare(b.d.romeCode));
}

function findRank(ranked: { d: ResultDirection }[], code: string): number {
  const i = ranked.findIndex((x) => x.d.romeCode === code);
  return i === -1 ? -1 : i + 1;
}

async function main() {
  // BEFORE: no seed (today's behaviour)
  const before = await buildResults(buildInventory(DEV_BASE));
  // AFTER: with the front-door pick
  const after = await buildResults(buildInventory({ ...DEV_BASE, seed_families: "tech:code" }));

  const rb = rank(before.directions), ra = rank(after.directions);
  console.log(`inventory codes — before seed: ${before.inventory.competenceCodes.length} · after seed: ${after.inventory.competenceCodes.length}`);
  console.log(`surfaced — before: ${before.directions.length} · after: ${after.directions.length}\n`);

  const m1805Before = findRank(rb, "M1805");
  const m1805After = findRank(ra, "M1805");
  console.log(`M1805 Développeur informatique rank:  BEFORE=${m1805Before === -1 ? "not surfaced" : "#" + m1805Before}   AFTER=${m1805After === -1 ? "NOT SURFACED" : "#" + m1805After}`);

  console.log("\n=== TOP 10 AFTER SEED ===");
  ra.slice(0, 10).forEach((x, i) => {
    const isDev = x.d.romeCode === "M1805";
    const tier = SIGNAL[coverageStrength(x.d.coverage)];
    console.log(`  ${String(i + 1).padStart(2)}. ${x.d.romeCode} ${x.d.title}${isDev ? "  ◄── THE DEV JOB" : ""}`);
    console.log(`      ${x.d.primaryLeap} · cov ${(x.d.coverage * 100).toFixed(0)}% · Signal ${tier} · mean-idf ${x.d.rarityScore.toFixed(2)}`);
  });

  // M1805 signal tier detail
  const dev = ra.find((x) => x.d.romeCode === "M1805");
  if (dev) {
    const tier = coverageStrength(dev.d.coverage);
    console.log(`\nM1805 detail: coverage ${(dev.d.coverage * 100).toFixed(1)}% → Signal ${SIGNAL[tier]} · matched ${dev.d.matchedCompetenceCodes.length} of ${after.inventory.competenceCodes.length} inventory codes · idf ${dev.d.rarityScore.toFixed(2)}`);
    if (tier === "exploratory") {
      console.log("  ⚠ FLAG: rank may pass but Signal=FAIBLE — the 198-code seed inflated the coverage denominator.");
      console.log("    Fix would be RARITY-AWARE Signal tiers (not seed-aware coverage). NOT built here — surfacing the need.");
    }
  }

  // Additivity check: cross-domain bridges a dev shares must STILL surface.
  console.log("\n=== ADDITIVITY: cross-domain bridges still present after seed? ===");
  for (const code of ["M1201", "M1202", "M1204", "H1206"]) {
    const b = findRank(rb, code), a = findRank(ra, code);
    const stillThere = after.directions.some((d) => d.romeCode === code);
    console.log(`  ${code}: before ${b === -1 ? "—" : "#" + b} · after ${a === -1 ? "DROPPED ✗" : "#" + a + (stillThere ? " ✓" : "")}`);
  }
  const heldBackHasOverlapDrop = false;
  console.log(`\n  surfaced count before=${before.directions.length} after=${after.directions.length} (seed should ADD, not remove → after ≥ before for shared jobs)`);

  // Verdict
  const pass = m1805After !== -1 && m1805After <= 10;
  console.log("\n" + "=".repeat(80));
  console.log(`PASS BAR: M1805 top-10?  ${pass ? `YES ✓ (#${m1805After}, was #${m1805Before})` : `NO ✗ (#${m1805After})`}`);
  console.log("=".repeat(80));
}

main().catch((e) => { console.error(e); process.exit(1); });
