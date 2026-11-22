/**
 * FAMILY-PRESENCE bar (the real user goal): when a user picks a niche, does the
 * TOP-10 contain jobs FROM THAT NICHE at an honest tier — not necessarily the one
 * exact target ROME code. A salesperson wants sales jobs at the top, not code
 * D1214 specifically. Reports, per depth: how many of the top-10 are niche jobs +
 * their tiers, and whether the target itself appears anywhere. Exits 1 when any
 * configured depth misses its niche.
 *
 * Usage: ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *   node_modules/tsx/dist/cli.mjs scripts/family-presence.ts
 */
import { buildInventory } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { rankScore, rankNormalisers } from "../src/lib/engine/graph-direction-proposer";
import { signalStrength } from "../src/lib/engine/coverage";
import { FAMILIES } from "../config/families";

const SIG: Record<string, string> = { strong: "FORT", partial: "MOYEN", exploratory: "FAIBLE" };

// A top-10 job counts as "from the niche" when it is one of the depth's member
// jobs in config/families.ts (decision 2026-11-21: niches are explicit job lists,
// read from the config, never from a hand-kept copy). The denominator is every
// configured depth, and a single missing niche fails the gate (exit 1).

function rank(dirs: ResultDirection[]) {
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(dirs);
  return [...dirs].map((d) => ({ d, s: rankScore(d, maxLean, maxInterest, maxRarity) })).sort((a, b) => b.s - a.s);
}

async function main() {
  console.log("=".repeat(96));
  console.log("FAMILY-PRESENCE BAR — does the user's picked niche appear in the TOP-10 at FORT/MOYEN?");
  console.log("=".repeat(96));
  let pass = 0; const fails: string[] = [];
  const total = FAMILIES.reduce((n, f) => n + f.depths.length, 0);
  for (const fam of FAMILIES) {
    for (const depth of fam.depths) {
      const pick = `${fam.id}:${depth.id}`;
      const members = new Set(depth.members.map((m) => m.romeCode));
      if (members.size === 0 || depth.seedCodes.length === 0) {
        fails.push(pick);
        console.log(`  ✗ ${pick.padEnd(27)} has ${members.size} member jobs and ${depth.seedCodes.length} seed codes`);
        continue;
      }
      const r = await buildResults(buildInventory({ seed_families: pick, c_departement: "75" }));
      const ranked = rank(r.directions).slice(0, 10);
      const nicheInTop10 = ranked.filter((x) => members.has(x.d.romeCode));
      const strongNiche = nicheInTop10.filter((x) => signalStrength(x.d.matchRaritySum) !== "exploratory");
      const ok = strongNiche.length >= 1;
      if (ok) pass++; else fails.push(pick);
      const sample = nicheInTop10.slice(0, 3).map((x) => `${x.d.romeCode}(${SIG[signalStrength(x.d.matchRaritySum)][0]})`).join(",");
      console.log(`  ${ok ? "✓" : "✗"} ${pick.padEnd(27)} niche-in-top10: ${String(nicheInTop10.length).padStart(2)} (strong ${strongNiche.length})  ${sample}`);
    }
  }
  console.log(`\n${"=".repeat(96)}`);
  console.log(`FAMILY-PRESENCE BAR: ${pass}/${total} depths put the user's niche in the top-10 at an honest tier`);
  if (fails.length) {
    console.log(`\nStill missing niche from top-10: ${fails.join(", ")}`);
    process.exit(1);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
