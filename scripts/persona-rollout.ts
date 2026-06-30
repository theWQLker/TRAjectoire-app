/**
 * BATCH PERSONA TEST (§4 ship bar) — for every family→depth, a seeded persona
 * (the picked niche) must land its representative target job in the TOP-10 at an
 * honest Signal tier (rarity-aware). No cognitive answers needed: seeding alone
 * must carry the niche. Reports per-depth: target rank + Signal tier + PASS/FAIL.
 *
 * Pass bar per depth: target job top-10 AND Signal fort/moyen (not faible).
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live \
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/persona-rollout.ts
 */
import { buildInventory } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { rankScore, rankNormalisers } from "../src/lib/engine/graph-direction-proposer";
import { signalStrength } from "../src/lib/engine/coverage";
import { FAMILIES } from "../config/families";

const SIG: Record<string, string> = { strong: "FORT", partial: "MOYEN", exploratory: "FAIBLE" };

// representative target job per depth (matches build-families.ts proveOn)
const TARGET: Record<string, string> = {
  "tech:code": "M1805", "tech:sysadmin": "M1810", "tech:support": "I1401", "tech:data": "M1403",
  "sante:soin": "J1501", "sante:medico": "J1302", "sante:reeduc": "J1404",
  "btp:gros": "F1701", "btp:second": "F1602", "btp:conduite": "F1201",
  "maintenance:indus": "I1304", "maintenance:vehicule": "I1604", "maintenance:batiment": "I1203",
  "commerce:vente": "D1214", "commerce:caisse": "D1505", "commerce:commercial": "D1402",
  "industrie:production": "H2801", "industrie:qualite": "H1502", "industrie:montage": "H2902",
  "hotellerie:cuisine": "G1602", "hotellerie:salle": "G1803", "hotellerie:accueil": "G1206",
  "admin:secretariat": "M1607", "admin:compta": "M1203", "admin:rh": "M1501",
  "agriculture:culture": "A1416", "agriculture:paysage": "A1301", "agriculture:foret": "A1201",
  "artisanat:art": "B1601", "artisanat:spectacle": "L1509", "artisanat:creation": "L1301",
  "banque:banque": "C1102", "banque:assurance": "C1201", "banque:immo": "C1504",
  "communication:comm": "E1103", "communication:design": "E1205", "communication:audiovisuel": "E1401",
  "services:social": "K1207", "services:domicile": "K1302", "services:securite": "K2503", "services:enseignement": "K2104",
  "transport:conduite": "N4101", "transport:entrepot": "N1103", "transport:exploitation": "N1303",
};

function rank(dirs: ResultDirection[]) {
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(dirs);
  return [...dirs].map((d) => ({ d, s: rankScore(d, maxLean, maxInterest, maxRarity) }))
    .sort((a, b) => b.s - a.s || a.d.romeCode.localeCompare(b.d.romeCode));
}

async function main() {
  console.log("=".repeat(92));
  console.log("BATCH PERSONA TEST — each seeded niche's target job: rank + Signal tier");
  console.log("pass = target TOP-10 AND Signal ≠ faible");
  console.log("=".repeat(92));

  let pass = 0; const fails: string[] = [];
  for (const fam of FAMILIES) {
    console.log(`\n${fam.label} [${fam.id}] — ${fam.domaines}`);
    for (const depth of fam.depths) {
      const pick = `${fam.id}:${depth.id}`;
      const target = TARGET[pick];
      const inv = buildInventory({ seed_families: pick, c_departement: "75" });
      const r = await buildResults(inv);
      const ranked = rank(r.directions);
      const idx = ranked.findIndex((x) => x.d.romeCode === target);
      const rk = idx === -1 ? -1 : idx + 1;
      const d = idx === -1 ? undefined : ranked[idx].d;
      const tier = d ? SIG[signalStrength(d.matchRaritySum)] : "—";
      const heldBack = r.heldBack.some((h) => h.romeCode === target);
      const ok = rk !== -1 && rk <= 10 && tier !== "FAIBLE";
      if (ok) pass++; else fails.push(`${pick} (target ${target}: rank ${rk === -1 ? (heldBack ? "HELD-BACK" : "not surfaced") : "#" + rk}, ${tier})`);
      console.log(`  ${ok ? "✓" : "✗"} ${depth.id.padEnd(13)} target ${target} ${(d?.title ?? "").slice(0, 30).padEnd(30)} rank ${rk === -1 ? "  —" : ("#" + rk).padStart(3)} · Signal ${tier} · seed=${depth.seedCodes.length}`);
    }
  }
  const total = Object.keys(TARGET).length;
  console.log(`\n${"=".repeat(92)}`);
  console.log(`SHIP BAR: ${pass}/${total} depths pass (target top-10 + honest tier)`);
  if (fails.length) {
    console.log("\nFAILS:");
    for (const f of fails) console.log(`  ✗ ${f}`);
    console.log("\n→ Seed front door NOT shippable until every depth passes.");
  } else {
    console.log("\n✓ ALL families pass — seed front door clears the ship bar.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
