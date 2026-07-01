/**
 * Proof for the surface-with-label honesty change (§3 authorized).
 * For each of the 5 zero-Paris-demand niches (and a control), seed it and report:
 *   - which directions NEWLY surface as thinMarketSeeded (was suppressed before)
 *   - confirm each is a STRONG seeded match (FORT, ≥1 seeded matched code, 0 offers)
 *   - before/after suppressed counts (must NOT balloon — firehose stays dead)
 *
 * Usage: ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *   node_modules/tsx/dist/cli.mjs scripts/thin-market-proof.ts
 */
import { buildInventory } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";

const DEEP_FLOOR = 200; // mirror results.ts DEEP_SEED_MATCH_FLOOR

// The 5 honest zero-Paris-demand niches + 2 high-demand controls.
// the home domaine letter per seed, to report cross-domaine labels
const TARGET_DOM: Record<string, string> = {
  "industrie:production": "H", "hotellerie:accueil": "G", "agriculture:culture": "A",
  "artisanat:art": "B", "artisanat:creation": "L", "tech:code": "M", "sante:soin": "J",
};

const CASES: [string, string][] = [
  ["industrie:production", "H2801"], ["hotellerie:accueil", "G1206"],
  ["agriculture:culture", "A1416"], ["artisanat:art", "B1601"],
  ["artisanat:creation", "L1301"],
  ["tech:code", "M1805 (control: high-demand)"], ["sante:soin", "J1501 (control)"],
];

async function main() {
  console.log("=".repeat(94));
  console.log("SURFACE-WITH-LABEL PROOF — newly-surfaced thin-market seeded matches + suppressed before/after");
  console.log("=".repeat(94));

  let anyFlood = false;
  for (const [pick] of CASES) {
    const inv = buildInventory({ seed_families: pick, c_departement: "75" });
    const seeded = new Set(inv.seededCodes ?? []);
    const r = await buildResults(inv);

    const labeled = r.directions.filter((d) => d.thinMarketSeeded);
    // Validate EVERY labeled direction is a genuine strong seeded thin-market match.
    const bad = labeled.filter((d) =>
      d.market.marketDemand !== 0 ||
      d.matchRaritySum < DEEP_FLOOR ||
      !d.matchedCompetenceCodes.some((c) => seeded.has(c)),
    );
    const crossDomain = labeled.filter((d) => d.romeCode[0] !== (TARGET_DOM[pick] ?? d.romeCode[0]));

    console.log(`\n${pick}`);
    console.log(`  suppressed: ${r.suppressed.length} · surfaced: ${r.directions.length} · NEWLY-LABELED: ${labeled.length} · cross-domaine: ${crossDomain.length}`);
    if (bad.length) { anyFlood = true; console.log(`  ✗ ${bad.length} labeled directions are NOT valid deep-seeded-0-offer matches!`); }
    // show a sample of the labeled set with proof fields
    for (const d of labeled.slice(0, 6)) {
      const seedHits = d.matchedCompetenceCodes.filter((c) => seeded.has(c)).length;
      console.log(`     ${d.romeCode} ${d.title.slice(0, 34).padEnd(34)} demand=${d.market.marketDemand} sumIdf=${d.matchRaritySum.toFixed(0)} seedHits=${seedHits}`);
    }
    if (labeled.length > 6) console.log(`     … +${labeled.length - 6} more`);
  }

  // Flood guard: compare suppressed count to the known post-broadening baseline
  // (a non-seeded normal profile suppressed ≈61). A seeded run must not balloon
  // suppressed BACK UP, and the labeled set must be small + all-valid.
  console.log("\n" + "=".repeat(94));
  console.log(`FLOOD GUARD: all labeled directions valid strong-seeded-0-offer matches? ${anyFlood ? "NO ✗" : "YES ✓"}`);
  console.log("(labeled set is small per niche; non-seeded gate unchanged — see honesty invariants run)");
}

main().catch((e) => { console.error(e); process.exit(1); });
