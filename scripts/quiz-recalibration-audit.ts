/**
 * QUIZ RECALIBRATION DIAGNOSTIC (Step 6 — measure only, build nothing).
 *
 * The cognitive quiz was designed to infer "what you've done" from "how you
 * think". The seed now does that directly. So: after the seed, does the cognitive
 * quiz still move results, and which scenes help vs hurt vs are dead weight?
 *
 * M1: per seeded persona, compare top-10 under 3 cognitive conditions —
 *     seed-only (no cognitive), cognitive-A (one extreme), cognitive-B (opposite).
 *     Movement = how many of the seed-only top-10 are displaced. Low movement ⇒
 *     the seed made the cognitive quiz largely inert.
 * M2: per scene, flip ONLY that scene (A vs B) on a seeded persona and measure its
 *     marginal top-10 movement + whether it pushes toward the persona's OWN niche
 *     (refining) or AWAY toward generic/management/other domaines (counterproductive)
 *     or does nothing (redundant).
 *
 * Live graph only. Deterministic.
 *
 * Usage: ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *   node_modules/tsx/dist/cli.mjs scripts/quiz-recalibration-audit.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { rankScore, rankNormalisers } from "../src/lib/engine/graph-direction-proposer";
import { CATEGORIES } from "../config/quiz";

const OUT = "scripts/_audit-out.txt";
writeFileSync(OUT, "");
function out(line: string) { process.stdout.write(line + "\n"); appendFileSync(OUT, line + "\n"); }

// 4 seeded personas + their home ROME domaine letter (for "toward/away from niche").
const PERSONAS: { name: string; seed: string; dom: string }[] = [
  { name: "dev", seed: "tech:code", dom: "M" },
  { name: "nurse", seed: "sante:soin", dom: "J" },
  { name: "cook", seed: "hotellerie:cuisine", dom: "G" },
  { name: "salesperson", seed: "commerce:vente", dom: "D" },
];

// Two opposite cognitive extremes (every cognitive scene set to A, then to B).
const COG_A: Answers = {}, COG_B: Answers = {};
const COGNITIVE_SCENES: string[] = [];
for (const cat of CATEGORIES as any[]) {
  for (const s of cat.scenes ?? []) {
    const mapsClusters = (s.optionA?.maps?.clusters?.length ?? 0) > 0;
    if (!mapsClusters) continue;
    COGNITIVE_SCENES.push(s.id);
    COG_A[s.id] = "plutot_a";
    COG_B[s.id] = "plutot_b";
  }
}

async function top10(seed: string, cog: Answers): Promise<ResultDirection[]> {
  const r = await buildResults(buildInventory({ seed_families: seed, c_departement: "75", ...cog }));
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(r.directions as any);
  return [...r.directions]
    .map((d) => ({ d, s: rankScore(d as any, maxLean, maxInterest, maxRarity) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 10)
    .map((x) => x.d);
}

function displaced(base: ResultDirection[], other: ResultDirection[]): number {
  const o = new Set(other.map((d) => d.romeCode));
  return base.filter((d) => !o.has(d.romeCode)).length; // of base top-10, how many fell out
}

async function main() {
  out("=".repeat(96));
  out(`QUIZ RECALIBRATION DIAGNOSTIC — ${COGNITIVE_SCENES.length} cognitive scenes`);
  out("=".repeat(96));

  // ---- M1: is the cognitive quiz inert after the seed? --------------------
  out("\nM1 — top-10 movement vs seed-only (out of 10):");
  out("persona       seedOnly→cogA   seedOnly→cogB   cogA→cogB   (higher = cognitive still pulls weight)");
  for (const p of PERSONAS) {
    const base = await top10(p.seed, {});
    const a = await top10(p.seed, COG_A);
    const b = await top10(p.seed, COG_B);
    out(`  ${p.name.padEnd(12)} ${String(displaced(base, a)).padStart(11)}   ${String(displaced(base, b)).padStart(13)}   ${String(displaced(a, b)).padStart(9)}`);
  }

  // ---- M2: per-scene marginal effect on the dev persona -------------------
  // Flip ONE scene at a time (A then B) against a seed-only baseline; measure
  // marginal top-10 movement and whether displaced-in rows are the persona's own
  // domaine (refining within niche) or other domaines (counterproductive).
  out("\nM2 — per-scene marginal effect (dev persona, tech:code, home=M):");
  out("scene                      |A-move|B-move| niche-share of moved (A/B) | class hint");
  const p = PERSONAS[0];
  const base = await top10(p.seed, {});
  const baseCodes = new Set(base.map((d) => d.romeCode));
  for (const scene of COGNITIVE_SCENES) {
    const a = await top10(p.seed, { [scene]: "plutot_a" });
    const b = await top10(p.seed, { [scene]: "plutot_b" });
    const moveA = displaced(base, a), moveB = displaced(base, b);
    // of the rows that NEWLY entered (in a/b but not base), how many are home-domaine?
    const newA = a.filter((d) => !baseCodes.has(d.romeCode));
    const newB = b.filter((d) => !baseCodes.has(d.romeCode));
    const nicheA = newA.filter((d) => d.romeCode[0] === p.dom).length;
    const nicheB = newB.filter((d) => d.romeCode[0] === p.dom).length;
    const totalMove = moveA + moveB;
    const totalNew = newA.length + newB.length;
    const nicheShare = totalNew ? (nicheA + nicheB) / totalNew : 1;
    const cls = totalMove === 0 ? "REDUNDANT (inert)"
      : nicheShare >= 0.6 ? "REFINING (toward niche)"
      : nicheShare <= 0.2 ? "COUNTERPRODUCTIVE (away)"
      : "MIXED";
    out(`  ${scene.padEnd(26)} |  ${String(moveA).padStart(2)}  |  ${String(moveB).padStart(2)}  |  ${nicheA}/${newA.length}  ${nicheB}/${newB.length}            | ${cls}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
