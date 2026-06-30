/**
 * COMPREHENSIVE rollout report — one table covering every family→depth with:
 *   nicheCov% (proof) · seed size · target REAL rank · target SKILL-ONLY rank ·
 *   Signal tier · cached offers (dept 75) · cached offers (ANY dept) · why-missing
 *
 * Plus an offer-coverage summary: how many of the 44 targets have offers anywhere,
 * and the dept-75 vs national gap. Read-only diagnostic.
 *
 * Usage: ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *   node_modules/tsx/dist/cli.mjs scripts/rollout-full-report.ts
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { buildInventory } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { GraphDirectionProposer, rankScore, rankNormalisers } from "../src/lib/engine/graph-direction-proposer";
import { signalStrength } from "../src/lib/engine/coverage";
import { getRomeSource } from "../src/lib/rome";
import { FAMILIES } from "../config/families";

const SIG: Record<string, string> = { strong: "FORT", partial: "MOYEN", exploratory: "FAIBLE" };

const TARGET: Record<string, string> = {
  "tech:code":"M1805","tech:sysadmin":"M1810","tech:support":"I1401","tech:data":"M1403",
  "sante:soin":"J1501","sante:medico":"J1302","sante:reeduc":"J1404",
  "btp:gros":"F1701","btp:second":"F1602","btp:conduite":"F1201",
  "maintenance:indus":"I1304","maintenance:vehicule":"I1604","maintenance:batiment":"I1203",
  "commerce:vente":"D1214","commerce:caisse":"D1505","commerce:commercial":"D1402",
  "industrie:production":"H2801","industrie:qualite":"H1502","industrie:montage":"H2902",
  "hotellerie:cuisine":"G1602","hotellerie:salle":"G1803","hotellerie:accueil":"G1206",
  "admin:secretariat":"M1607","admin:compta":"M1203","admin:rh":"M1501",
  "agriculture:culture":"A1416","agriculture:paysage":"A1301","agriculture:foret":"A1201",
  "artisanat:art":"B1601","artisanat:spectacle":"L1509","artisanat:creation":"L1301",
  "banque:banque":"C1102","banque:assurance":"C1201","banque:immo":"C1504",
  "communication:comm":"E1103","communication:design":"E1205","communication:audiovisuel":"E1401",
  "services:social":"K1207","services:domicile":"K1302","services:securite":"K2503","services:enseignement":"K2104",
  "transport:conduite":"N4101","transport:entrepot":"N1103","transport:exploitation":"N1303",
};

function rankReal(dirs: any[]) {
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(dirs);
  return [...dirs].map((d) => ({ d, s: rankScore(d, maxLean, maxInterest, maxRarity) })).sort((a, b) => b.s - a.s);
}

async function main() {
  const db = getSupabaseServiceClient();
  const rome = getRomeSource();

  // offer counts per target: dept 75 and ANY dept
  const offers75 = new Map<string, number>(), offersAny = new Map<string, number>();
  for (const t of new Set(Object.values(TARGET))) {
    const { count: c75 } = await db.from("current_offers").select("offer_id", { count: "exact", head: true }).eq("rome_code", t).eq("departement", "75");
    const { count: cAny } = await db.from("current_offers").select("offer_id", { count: "exact", head: true }).eq("rome_code", t);
    offers75.set(t, c75 ?? 0); offersAny.set(t, cAny ?? 0);
  }

  console.log("=".repeat(132));
  console.log("COMPREHENSIVE ROLLOUT REPORT — 44 depths");
  console.log("pick                        target  seed  nicheCov  REALrank  SKILLrank  Signal   off75  offAny  status");
  console.log("=".repeat(132));

  let shipPass = 0, seedPass = 0;
  const rows: any[] = [];
  for (const fam of FAMILIES) {
    for (const depth of fam.depths) {
      const pick = `${fam.id}:${depth.id}`;
      const target = TARGET[pick];
      const inv = buildInventory({ seed_families: pick, c_departement: "75" });

      // skill-only rank (pre-market)
      const { surfaced } = await new GraphDirectionProposer(rome).reach(inv);
      const skRanked = rankReal(surfaced as any);
      const skIdx = skRanked.findIndex((x) => x.d.romeCode === target);
      const skDir: any = skIdx === -1 ? null : skRanked[skIdx].d;
      const tier = skDir ? SIG[signalStrength(skDir.matchRaritySum)] : "—";

      // real rank (post-market)
      const r = await buildResults(inv);
      const realRanked = rankReal(r.directions as any);
      const realIdx = realRanked.findIndex((x) => x.d.romeCode === target);
      const realRank = realIdx === -1 ? -1 : realIdx + 1;

      const held = r.heldBack.some((h) => h.romeCode === target);
      const supp = r.suppressed.some((s) => s.romeCode === target);
      const o75 = offers75.get(target) ?? 0, oAny = offersAny.get(target) ?? 0;

      const shipOk = realRank !== -1 && realRank <= 10 && tier !== "FAIBLE";
      const seedOk = skIdx !== -1 && skIdx < 10 && tier !== "FAIBLE"; // seed works on skill
      if (shipOk) shipPass++; if (seedOk) seedPass++;

      const status = shipOk ? "SHIP ✓"
        : supp ? "suppressed(0 offers)"
        : held ? "held-back"
        : realRank === -1 ? "not surfaced"
        : realRank > 10 ? `rank #${realRank}` : "tier";

      console.log(
        `${pick.padEnd(27)} ${target}  ${String(depth.seedCodes.length).padStart(4)}  ${"".padStart(2)}    ` +
        `${(realRank === -1 ? "—" : "#" + realRank).padStart(5)}    ${(skIdx === -1 ? "—" : "#" + (skIdx + 1)).padStart(5)}    ${tier.padEnd(6)}  ${String(o75).padStart(4)}  ${String(oAny).padStart(5)}   ${status}`
      );
      rows.push({ pick, target, realRank, skRank: skIdx === -1 ? -1 : skIdx + 1, tier, o75, oAny, shipOk, seedOk });
    }
  }

  console.log("=".repeat(132));
  console.log(`SEED MECHANISM (skill-only, target top-10 + tier≠faible): ${seedPass}/44`);
  console.log(`FULL SHIP BAR (real rank top-10 + tier≠faible):           ${shipPass}/44`);

  const zero75 = rows.filter((r) => r.o75 === 0).length;
  const zeroAny = rows.filter((r) => r.oAny === 0).length;
  console.log(`\nOFFER COVERAGE OF THE 44 TARGETS:`);
  console.log(`  0 offers in dept-75 snapshot : ${zero75}/44  (these get market-suppressed today)`);
  console.log(`  0 offers in ANY dept         : ${zeroAny}/44  (truly absent from the whole cache)`);
  console.log(`  blocked ONLY by dept-75 limit (have offers elsewhere): ${rows.filter((r)=>r.o75===0 && r.oAny>0).length}`);

  // total cache scope
  const { count: totalRome } = await db.from("current_offers").select("rome_code", { count: "exact", head: true });
  const distinctRome = await db.from("current_offers").select("rome_code");
  const codes = new Set((distinctRome.data ?? []).map((r: any) => r.rome_code));
  const distinctDept = await db.from("current_offers").select("departement");
  const depts = new Set((distinctDept.data ?? []).map((r: any) => r.departement));
  console.log(`\nCACHE SCOPE: ${totalRome ?? 0} offer rows · ${codes.size} distinct ROME codes · départements: ${[...depts].sort().join(",")}`);
  console.log(`(of 1911 ROME codes, the cache holds offers for ${codes.size} — ${((codes.size/1911)*100).toFixed(0)}%)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
