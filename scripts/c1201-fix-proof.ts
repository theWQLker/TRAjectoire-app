/**
 * C1201 coherence-fix proof (two-sided). Compares BEFORE (RARITY_GENERIC_FLOOR=0,
 * the plain-mean baseline) vs AFTER (the live default, floor 3) — top-10 for all 5
 * cognitive profiles + C1201's rank. Run twice with the env toggle:
 *   RARITY_GENERIC_FLOOR=0  → baseline
 *   (default)               → fix
 * and diff. This script prints one side; the caller runs both.
 */
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { rankScore, rankNormalisers } from "../src/lib/engine/graph-direction-proposer";

const DOM: Record<string, string> = { A:"agri",B:"artis",C:"banq",D:"comm",E:"média",F:"BTP",G:"hôtel",H:"indus",I:"maint",J:"santé",K:"servP",L:"spect",M:"admin/IT",N:"transp" };
const PROFILES: { name: string; ans: Answers }[] = [
  { name: "hands-on", ans: { sf_hands_organise:"plutot_a", sf_sell_fix:"plutot_b", sf_digital_tools:"plutot_b", f_order_improv:"plutot_b", g_teach_do:"plutot_b", f_energy_context:"plutot_b", sf_client_issue:"plutot_a", c_departement:"75" } },
  { name: "people", ans: { sf_numbers_people:"plutot_b", g_conflict:"plutot_a", g_teach_do:"plutot_a", sf_client_issue:"plutot_b", g_boundaries:"plutot_b", sf_write_explain:"plutot_b", g_hidden_need:"plutot_a", c_departement:"75" } },
  { name: "analytical", ans: { f_surface_depth:"plutot_b", sf_data_files:"plutot_b", f_order_improv:"plutot_a", f_scale_task:"plutot_a", sf_digital_tools:"plutot_a", f_repeat_problem:"plutot_a", sf_numbers_people:"plutot_a", c_departement:"75" } },
  { name: "creative", ans: { sf_write_explain:"plutot_a", f_new_domain:"plutot_a", f_detail_big_picture:"plutot_b", f_leverage_completeness:"plutot_a", g_group_energy:"plutot_a", c_departement:"75" } },
  { name: "commercial", ans: { sf_sell_fix:"plutot_a", g_lead_support:"plutot_a", g_status_authority:"plutot_a", sf_commercial_signal:"plutot_a", f_decide_wait:"plutot_a", g_group_energy:"plutot_a", c_departement:"75" } },
];

async function main() {
  console.log(`=== RARITY_GENERIC_FLOOR=${process.env.RARITY_GENERIC_FLOOR ?? "3 (default/fix)"} ===`);
  for (const p of PROFILES) {
    const r = await buildResults(buildInventory(p.ans));
    const { maxLean, maxInterest, maxRarity } = rankNormalisers(r.directions as any);
    const ranked = [...r.directions].map((d) => ({ d, s: rankScore(d as any, maxLean, maxInterest, maxRarity) })).sort((a, b) => b.s - a.s);
    const c1201 = ranked.findIndex((x) => x.d.romeCode === "C1201") + 1;
    const top10 = ranked.slice(0, 10);
    const doms = top10.map((x) => DOM[x.d.romeCode[0]]);
    const spread = [...new Set(doms)].map((dm) => `${dm}:${doms.filter((x) => x === dm).length}`).join(" ");
    console.log(`\n${p.name}  C1201 #${c1201}${c1201 <= 15 ? " (in15)" : " (OUT)"}  · domaines ${spread}`);
    for (const x of top10) console.log(`   ${x.d.romeCode} ${DOM[x.d.romeCode[0]]}  ${x.d.title.slice(0, 44)}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
