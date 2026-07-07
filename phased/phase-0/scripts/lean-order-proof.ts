/**
 * Proof: the lean-discard fix. Same SEED + different COGNITIVE answers must now
 * produce a visibly different displayed top-10.
 *
 * BEFORE the fix the results page sorted each bucket by matchRaritySum (bare
 * rarity-sum), so cognitive answers changed WHAT surfaced but barely the ORDER.
 * AFTER the fix it sorts by displayRank = rankScore × (1 − 0.35·levelPenalty),
 * so the quiz's lean/interest personalisation reaches the DISPLAYED order.
 *
 * We reconstruct BOTH orderings from one run (every direction still carries
 * matchRaritySum AND the new rankScore), so the before/after is a clean, same-data
 * comparison — no git-stash needed.
 *
 * Usage: ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *   node_modules/tsx/dist/cli.mjs scripts/lean-order-proof.ts
 */
import { LiveRomeSource } from "../src/lib/rome";
import { LiveOfferSource } from "../src/lib/offers";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import type { Category } from "../config/buckets";

{ let S:any=null; const rp=LiveRomeSource.prototype as any; const o=rp.load;
  rp.load=async function(){ if(this.cache)return; if(S){Object.assign(this,S);return;} await o.call(this);
  S={cache:this.cache,byCode:this.byCode,byCompetence:this.byCompetence,mobilityEdges:this.mobilityEdges,rarity:this.rarity};};
  const op=LiveOfferSource.prototype as any; const of=op.fetchOffers; const m=new Map();
  op.fetchOffers=function(r:string,d:string){const k=r+'|'+d; let p=m.get(k); if(!p){p=of.call(this,r,d);m.set(k,p);} return p;}; }

const BUCKET_ORDER: Category[] = ["apply_now","bridge","long_term","not_now"];

// Order exactly as the UI does: bucket first, then by a key desc, tie-break coverage.
function uiOrder(dirs: ResultDirection[], key: (d: ResultDirection)=>number): ResultDirection[] {
  return [...dirs].sort((a,b) =>
    BUCKET_ORDER.indexOf(a.bucketResult.category) - BUCKET_ORDER.indexOf(b.bucketResult.category)
    || key(b) - key(a) || b.coverage - a.coverage);
}
const codes = (dirs: ResultDirection[], n=10) => dirs.slice(0,n).map(d=>d.romeCode);
function overlap(a: string[], b: string[]){ const s=new Set(b); return a.filter(x=>s.has(x)).length; }
function kendallish(a: string[], b: string[]){ // # positions with a different code
  const n=Math.min(a.length,b.length); let diff=0; for(let i=0;i<n;i++) if(a[i]!==b[i]) diff++; return diff;
}

async function show(name: string, seed: string, cogA: Answers, cogB: Answers){
  const base: Answers = { seed_families: seed, c_departement: "75" };
  const rA = await buildResults(buildInventory({ ...base, ...cogA }));
  const rB = await buildResults(buildInventory({ ...base, ...cogB }));

  // BEFORE fix = order by matchRaritySum (what the page used to sort by).
  const beforeA = codes(uiOrder(rA.directions, d=>d.matchRaritySum));
  const beforeB = codes(uiOrder(rB.directions, d=>d.matchRaritySum));
  // AFTER fix = order by displayRank (now rankScore-based).
  const afterA = codes(uiOrder(rA.directions, d=>d.displayRank));
  const afterB = codes(uiOrder(rB.directions, d=>d.displayRank));

  console.log(`\n${"=".repeat(94)}`);
  console.log(`${name}  — seed="${seed}"  (same seed, cognitive A vs cognitive B)`);
  console.log("=".repeat(94));
  console.log(`  BEFORE (matchRaritySum order):`);
  console.log(`    A: ${beforeA.join(" ")}`);
  console.log(`    B: ${beforeB.join(" ")}`);
  console.log(`    A-vs-B positional diff: ${kendallish(beforeA,beforeB)}/10   shared: ${overlap(beforeA,beforeB)}/10`);
  console.log(`  AFTER  (displayRank = rankScore × (1−0.35·penalty)):`);
  console.log(`    A: ${afterA.join(" ")}`);
  console.log(`    B: ${afterB.join(" ")}`);
  console.log(`    A-vs-B positional diff: ${kendallish(afterA,afterB)}/10   shared: ${overlap(afterA,afterB)}/10`);
  // Does the fix change the DISPLAYED list vs before, for profile A? (sanity: fix is active)
  console.log(`  fix moved A's displayed top-10 vs before: ${kendallish(beforeA,afterA)}/10 positions`);
}

async function main(){
  // Shape-A single-seed: dev seed, cognitive = analytical vs people-facing.
  await show("Shape-A single-seed (tech:code)", "tech:code",
    // cognitive A — analytical/systems lean
    { f_surface_depth:"plutot_b", sf_data_files:"plutot_b", f_scale_task:"plutot_a", f_repeat_problem:"plutot_a", sf_numbers_people:"plutot_a" },
    // cognitive B — people/communication lean
    { sf_write_explain:"plutot_b", g_conflict:"plutot_a", g_teach_do:"plutot_a", sf_client_issue:"plutot_b", g_group_energy:"plutot_a" });

  // Shape-A single-seed: care seed, cognitive = hands-on vs commercial.
  await show("Shape-A single-seed (sante:soin)", "sante:soin",
    { sf_hands_organise:"plutot_a", sf_sell_fix:"plutot_b", f_energy_context:"plutot_b", sf_client_issue:"plutot_a" },
    { sf_sell_fix:"plutot_a", g_lead_support:"plutot_a", g_status_authority:"plutot_a", sf_commercial_signal:"plutot_a" });

  // Shape-B MULTI-family seed: tech + commerce, cognitive = analytical vs commercial.
  await show("Shape-B multi-family (tech:code,commerce:vente)", "tech:code,commerce:vente",
    { f_surface_depth:"plutot_b", sf_data_files:"plutot_b", f_scale_task:"plutot_a", sf_numbers_people:"plutot_a", f_repeat_problem:"plutot_a" },
    { sf_sell_fix:"plutot_a", g_lead_support:"plutot_a", g_status_authority:"plutot_a", sf_commercial_signal:"plutot_a", g_group_energy:"plutot_a" });

  console.log("\nDONE");
}
main().catch((e)=>{console.error(e);process.exit(1);});
