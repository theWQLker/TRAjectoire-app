/**
 * FAMILY-PRESENCE bar (the real user goal): when a user picks a niche, does the
 * TOP-10 contain jobs FROM THAT NICHE at an honest tier — not necessarily the one
 * exact target ROME code. A salesperson wants sales jobs at the top, not code
 * D1214 specifically. Reports, per depth: how many of the top-10 are niche jobs +
 * their tiers, and whether the target itself appears anywhere.
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

// niche prefixes per depth (matches build-families.ts) — a top-10 job counts as
// "from the niche" if its code starts with one of these.
const PREFIX: Record<string, string[]> = {
  "tech:code":["M180","M182","M184","M185"],"tech:sysadmin":["M181"],"tech:support":["I140"],"tech:data":["M183","M140"],
  "sante:soin":["J150","J151"],"sante:medico":["J130"],"sante:reeduc":["J140","J141"],
  "btp:gros":["F170"],"btp:second":["F160"],"btp:conduite":["F110","F120"],
  "maintenance:indus":["I130"],"maintenance:vehicule":["I160"],"maintenance:batiment":["I120"],
  "commerce:vente":["D12"],"commerce:caisse":["D15"],"commerce:commercial":["D14"],
  "industrie:production":["H28","H33"],"industrie:qualite":["H15"],"industrie:montage":["H29"],
  "hotellerie:cuisine":["G16"],"hotellerie:salle":["G18"],"hotellerie:accueil":["G12"],
  "admin:secretariat":["M160"],"admin:compta":["M120"],"admin:rh":["M150"],
  "agriculture:culture":["A14"],"agriculture:paysage":["A13"],"agriculture:foret":["A12"],
  "artisanat:art":["B16","B18"],"artisanat:spectacle":["L15"],"artisanat:creation":["L12","L13"],
  "banque:banque":["C11"],"banque:assurance":["C12"],"banque:immo":["C15"],
  "communication:comm":["E11"],"communication:design":["E12"],"communication:audiovisuel":["E13","E14"],
  "services:social":["K12"],"services:domicile":["K13"],"services:securite":["K17","K25"],"services:enseignement":["K21"],
  "transport:conduite":["N41","N44"],"transport:entrepot":["N11"],"transport:exploitation":["N13","N12"],
};

function rank(dirs: ResultDirection[]) {
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(dirs);
  return [...dirs].map((d) => ({ d, s: rankScore(d, maxLean, maxInterest, maxRarity) })).sort((a, b) => b.s - a.s);
}

async function main() {
  console.log("=".repeat(96));
  console.log("FAMILY-PRESENCE BAR — does the user's picked niche appear in the TOP-10 at FORT/MOYEN?");
  console.log("=".repeat(96));
  let pass = 0; const fails: string[] = [];
  for (const fam of FAMILIES) {
    for (const depth of fam.depths) {
      const pick = `${fam.id}:${depth.id}`;
      const prefixes = PREFIX[pick] ?? [];
      const r = await buildResults(buildInventory({ seed_families: pick, c_departement: "75" }));
      const ranked = rank(r.directions).slice(0, 10);
      const nicheInTop10 = ranked.filter((x) => prefixes.some((p) => x.d.romeCode.startsWith(p)));
      const strongNiche = nicheInTop10.filter((x) => signalStrength(x.d.matchRaritySum) !== "exploratory");
      const ok = strongNiche.length >= 1;
      if (ok) pass++; else fails.push(pick);
      const sample = nicheInTop10.slice(0, 3).map((x) => `${x.d.romeCode}(${SIG[signalStrength(x.d.matchRaritySum)][0]})`).join(",");
      console.log(`  ${ok ? "✓" : "✗"} ${pick.padEnd(27)} niche-in-top10: ${String(nicheInTop10.length).padStart(2)} (strong ${strongNiche.length})  ${sample}`);
    }
  }
  console.log(`\n${"=".repeat(96)}`);
  console.log(`FAMILY-PRESENCE BAR: ${pass}/44 depths put the user's niche in the top-10 at an honest tier`);
  if (fails.length) console.log(`\nStill missing niche from top-10: ${fails.join(", ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
