/**
 * COHERENCE diagnostic (Step 6 re-framed — measure, build nothing).
 *
 * North star: a clarity-giving RANGE, not résumé matches. Question: when the
 * COGNITIVE quiz broadens a user, is the broadening COHERENT-AND-PERSONAL
 * (different people → different sensible ranges) or GENERIC-SAMENESS (everyone
 * collapses to the same admin/management bucket)?
 *
 * Cognitive-ONLY (no seed) — isolates what the cognitive quiz itself surfaces.
 *
 *   M2 cross-profile divergence: pairwise top-15 overlap across 5 profiles.
 *   M3 within-profile coherence: domaine spread of each range (concentrated
 *      neighbourhood vs economy-wide grab-bag) + the actual titles.
 *   M4 generic-bucket test: which ROME codes appear in EVERY profile's top-15
 *      (the universal sameness, if any).
 *
 * Live graph only. Deterministic.
 *
 * Usage: ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *   node_modules/tsx/dist/cli.mjs scripts/coherence-audit.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { rankScore, rankNormalisers } from "../src/lib/engine/graph-direction-proposer";

const OUT = "scripts/_coherence-out.txt";
writeFileSync(OUT, "");
const out = (l: string) => { process.stdout.write(l + "\n"); appendFileSync(OUT, l + "\n"); };

// 5 distinct cognitive profiles, each pushed hard toward one way-of-working,
// using the scene→cluster map. No seed — pure cognitive surfacing.
const PROFILES: { name: string; ans: Answers }[] = [
  { name: "hands-on/technical", ans: {
    sf_hands_organise: "plutot_a", sf_sell_fix: "plutot_b", sf_digital_tools: "plutot_b",
    f_order_improv: "plutot_b", g_teach_do: "plutot_b", f_energy_context: "plutot_b",
    sf_client_issue: "plutot_a", c_departement: "75",
  }},
  { name: "people/care", ans: {
    sf_numbers_people: "plutot_b", g_conflict: "plutot_a", g_teach_do: "plutot_a",
    sf_client_issue: "plutot_b", g_boundaries: "plutot_b", sf_write_explain: "plutot_b",
    g_hidden_need: "plutot_a", c_departement: "75",
  }},
  { name: "analytical/systems", ans: {
    f_surface_depth: "plutot_b", sf_data_files: "plutot_b", f_order_improv: "plutot_a",
    f_scale_task: "plutot_a", sf_digital_tools: "plutot_a", f_repeat_problem: "plutot_a",
    sf_numbers_people: "plutot_a", c_departement: "75",
  }},
  { name: "creative/expressive", ans: {
    sf_write_explain: "plutot_a", f_new_domain: "plutot_a", f_detail_big_picture: "plutot_b",
    f_leverage_completeness: "plutot_a", g_group_energy: "plutot_a", c_departement: "75",
  }},
  { name: "commercial/leadership", ans: {
    sf_sell_fix: "plutot_a", g_lead_support: "plutot_a", g_status_authority: "plutot_a",
    sf_commercial_signal: "plutot_a", f_decide_wait: "plutot_a", g_group_energy: "plutot_a",
    c_departement: "75",
  }},
];

const DOM: Record<string, string> = {
  A: "agriculture", B: "artisanat", C: "banque", D: "commerce", E: "communication",
  F: "BTP", G: "hôtellerie", H: "industrie", I: "maintenance", J: "santé",
  K: "services-personne", L: "spectacle", M: "support/admin/IT", N: "transport",
};

async function top15(ans: Answers): Promise<ResultDirection[]> {
  const r = await buildResults(buildInventory(ans));
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(r.directions as any);
  return [...r.directions]
    .map((d) => ({ d, s: rankScore(d as any, maxLean, maxInterest, maxRarity) }))
    .sort((a, b) => b.s - a.s).slice(0, 15).map((x) => x.d);
}

async function main() {
  const tops = new Map<string, ResultDirection[]>();
  for (const p of PROFILES) tops.set(p.name, await top15(p.ans));

  // ---- M3: within-profile coherence — domaine spread + titles --------------
  out("=".repeat(98));
  out("WITHIN-PROFILE RANGE (top-15 cognitive-only) — domaine spread + sample titles");
  out("=".repeat(98));
  for (const p of PROFILES) {
    const t = tops.get(p.name)!;
    const byDom: Record<string, number> = {};
    for (const d of t) byDom[d.romeCode[0]] = (byDom[d.romeCode[0]] ?? 0) + 1;
    const spread = Object.entries(byDom).sort((a, b) => b[1] - a[1])
      .map(([L, n]) => `${DOM[L] ?? L}:${n}`).join("  ");
    out(`\n${p.name}  — ${Object.keys(byDom).length} domaines · ${spread}`);
    for (const d of t.slice(0, 8)) out(`     ${d.romeCode} ${d.title.slice(0, 50)}`);
  }

  // ---- M2: cross-profile divergence — pairwise overlap ---------------------
  out("\n" + "=".repeat(98));
  out("CROSS-PROFILE DIVERGENCE — top-15 overlap (lower = more personalized)");
  out("=".repeat(98));
  const names = PROFILES.map((p) => p.name);
  out("                       " + names.map((n) => n.slice(0, 8).padStart(9)).join(""));
  for (const a of names) {
    const setA = new Set(tops.get(a)!.map((d) => d.romeCode));
    const row = names.map((b) => {
      if (a === b) return "    —".padStart(9);
      const setB = new Set(tops.get(b)!.map((d) => d.romeCode));
      const shared = [...setA].filter((c) => setB.has(c)).length;
      return String(shared).padStart(9);
    }).join("");
    out(a.slice(0, 22).padEnd(23) + row);
  }

  // ---- M4: generic-bucket test — codes in EVERY profile's top-15 -----------
  out("\n" + "=".repeat(98));
  out("GENERIC-BUCKET TEST — directions in EVERY profile's top-15 (the universal sameness)");
  out("=".repeat(98));
  const all = [...tops.values()];
  const everywhere = all[0].filter((d) => all.every((t) => t.some((x) => x.romeCode === d.romeCode)));
  if (everywhere.length === 0) out("  NONE — no direction is universal. Broadening is personal.");
  else {
    out(`  ${everywhere.length} universal direction(s):`);
    for (const d of everywhere) out(`     ${d.romeCode} ${DOM[d.romeCode[0]]} — ${d.title.slice(0, 46)}`);
  }
  // also near-universal (in ≥4 of 5)
  const union = new Set(all.flatMap((t) => t.map((d) => d.romeCode)));
  const freq = [...union].map((c) => ({ c, n: all.filter((t) => t.some((d) => d.romeCode === c)).length }))
    .filter((x) => x.n >= 4).sort((a, b) => b.n - a.n);
  out(`\n  Near-universal (in ≥4/5 profiles): ${freq.length}`);
  for (const x of freq.slice(0, 12)) {
    const title = all.flatMap((t) => t).find((d) => d.romeCode === x.c)?.title ?? "";
    out(`     ${x.c} (${x.n}/5) ${DOM[x.c[0]]} — ${title.slice(0, 40)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
