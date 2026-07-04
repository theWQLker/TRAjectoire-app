/**
 * PROOF for the lean-order + apply_now-bucket fixes (live). Report only.
 *
 * Lean fix (W_RARITY 0.7→0.4, W_LEAN 0.5→1.1): the quiz answers now LEAD the order.
 * Bucket fix (apply_now coverage vs COGNITIVE inventory, seed excluded): apply_now
 * populates instead of everything dumping into bridge.
 *
 * Checks:
 *   - analytical Shape-B: top is analytically coherent (M-codes: chef de projet /
 *     analyste / ingénieur), NOT rarity-junk (Brocanteur).
 *   - two profiles diverge (analytical top ≠ santé top).
 *   - single-family seed: the seeded niche still surfaces + ranks (seed not washed out).
 *   - Shape-B merge: both seed and cognitive dimensions present in the top.
 *   - bucket counts: apply_now now non-empty for seeded profiles.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/lean-bucket-fix-proof.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";

const OUT = "scripts/_lean-bucket-fix-out.txt";
writeFileSync(OUT, "");
const out = (l = "") => { process.stdout.write(l + "\n"); appendFileSync(OUT, l + "\n"); };

const DEPT: Answers = { c_departement: "75" };
const DOM: Record<string, string> = {
  A: "agri", B: "artisanat", C: "banque", D: "commerce", E: "comm", F: "BTP",
  G: "hôtel", H: "industrie", I: "maint", J: "santé", K: "services", L: "spect",
  M: "admin/IT", N: "transport",
};

const PROFILES: { key: string; note: string; answers: Answers }[] = [
  {
    key: "analytical (Shape-B seed tech+commerce)",
    note: "top should be coherent M-codes, not Brocanteur",
    answers: { ...DEPT, seed_families: "tech:code,commerce:vente", f_surface_depth: "plutot_b", sf_data_files: "plutot_b", sf_numbers_people: "plutot_a" },
  },
  {
    key: "santé hands-on (Shape-A seed sante:soin)",
    note: "top should be santé/soin — different from analytical",
    answers: { ...DEPT, seed_families: "sante:soin", sf_hands_organise: "plutot_a", f_scale_task: "plutot_a" },
  },
  {
    key: "single-family seed (tech:code only, no cognitive)",
    note: "seed must still surface + rank its niche (not washed out)",
    answers: { ...DEPT, seed_families: "tech:code" },
  },
  {
    key: "Shape-B commercial (tech+commerce+cuisine)",
    note: "merge: both seed and cognitive dimensions present",
    answers: { ...DEPT, seed_families: "tech:code,commerce:vente,cuisine:cuisine", sf_sell_fix: "plutot_a", g_lead_support: "plutot_a", sf_commercial_signal: "plutot_a" },
  },
];

async function report(key: string, note: string, answers: Answers): Promise<string[]> {
  const r = await buildResults(buildInventory(answers));
  const dirs = r.directions;

  const byCat: Record<string, number> = { apply_now: 0, bridge: 0, long_term: 0, not_now: 0 };
  for (const d of dirs) byCat[d.bucketResult.category]++;

  const top = [...dirs].sort((a, b) => b.displayRank - a.displayRank || b.coverage - a.coverage).slice(0, 8);

  out("=".repeat(96));
  out(`${key}`);
  out(`  (${note})`);
  out(`  surfaced ${dirs.length} · buckets apply_now=${byCat.apply_now} bridge=${byCat.bridge} long_term=${byCat.long_term} not_now=${byCat.not_now}`);
  out("=".repeat(96));
  out("  rank rome   dom        bucket      lean  rar   disp   title");
  top.forEach((d, i) => {
    out(
      `  ${String(i + 1).padStart(2)}.  ${d.romeCode} ${(DOM[d.romeCode[0]] ?? "?").padEnd(10)} ` +
      `${d.bucketResult.category.padEnd(11)} ${d.leanScore.toFixed(1).padStart(4)} ${d.rarityScore.toFixed(2)} ` +
      `${d.displayRank.toFixed(2).padStart(5)}  ${d.title.slice(0, 34)}`,
    );
  });
  out("");
  return top.map((d) => d.romeCode);
}

async function main() {
  out("LEAN-ORDER + APPLY_NOW-BUCKET FIX PROOF — live graph");
  out(`ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE}`);
  out("");

  const tops: Record<string, string[]> = {};
  for (const p of PROFILES) tops[p.key] = await report(p.key, p.note, p.answers);

  // Divergence check: analytical vs santé top-5 overlap.
  const a = tops[PROFILES[0].key].slice(0, 5);
  const b = tops[PROFILES[1].key].slice(0, 5);
  const overlap = a.filter((x) => b.includes(x)).length;
  out("=".repeat(96));
  out("DIVERGENCE — analytical vs santé top-5");
  out(`  analytical: ${a.join(" ")}`);
  out(`  santé:      ${b.join(" ")}`);
  out(`  overlap: ${overlap}/5 (lower = more answer-driven; 0 = fully distinct)`);
  out("");
  out(`(full output → ${OUT})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
