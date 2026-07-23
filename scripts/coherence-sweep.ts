/**
 * COHERENCE SWEEP (live graph) — the spec §7 proof. For each (K, formula), runs
 * the SAME flow the UI uses (buildInventory → buildResults) per persona and
 * reports, in the VISIBLE band (top-8 by coherenceRank, wildcard pinned):
 *   • santé wall count  — H-cluster rows + the wall's own J-cluster count (target 2–3)
 *   • dominant-cluster share (before = displayRank order, after = coherenceRank order)
 *   • single-family tech survival — genuine-range rows kept in the visible band
 *   • inversion check — top-quartile rankScore rows pushed BELOW the visible cap
 *   • wildcard — present/absent + which domain
 *
 * Because COHERENCE_K / COHERENCE_FORMULA are read at import time, each (K,
 * formula) runs in a CHILD process with those env vars set, and prints one block.
 * The parent loops the grid and concatenates.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/coherence-sweep.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { clusterKey, domainOf } from "../src/lib/engine/coherence";

const OUT = "scripts/_coherence-sweep-out.txt";
const CHILD = process.env.COHERENCE_CHILD === "1";

const DOM: Record<string, string> = {
  A: "agriculture", B: "artisanat", C: "banque", D: "commerce", E: "communication",
  F: "BTP", G: "hôtellerie", H: "industrie", I: "maintenance", J: "santé",
  K: "services-personne", L: "spectacle", M: "support/admin/IT", N: "transport",
};

// Personas: the 5 cognitive (coherence-audit.ts) + santé-seed merge (merge-coherence-sante.ts)
// + a concentrated single-family tech profile for the survival guard.
const PERSONAS: { name: string; ans: Answers; wall?: boolean; tech?: boolean }[] = [
  { name: "santé-seed + hands-on", wall: true, ans: {
    seed_families: "sante:soin", sf_hands_organise: "plutot_a", f_scale_task: "plutot_a", c_departement: "75",
  } },
  { name: "single-family tech (seed)", tech: true, ans: {
    seed_families: "tech:code", c_departement: "75",
  } },
  { name: "hands-on/technical", ans: {
    sf_hands_organise: "plutot_a", sf_sell_fix: "plutot_b", sf_digital_tools: "plutot_b",
    f_order_improv: "plutot_b", g_teach_do: "plutot_b", f_energy_context: "plutot_b",
    sf_client_issue: "plutot_a", c_departement: "75",
  } },
  { name: "people/care", ans: {
    sf_numbers_people: "plutot_b", g_conflict: "plutot_a", g_teach_do: "plutot_a",
    sf_client_issue: "plutot_b", g_boundaries: "plutot_b", sf_write_explain: "plutot_b",
    g_hidden_need: "plutot_a", c_departement: "75",
  } },
  { name: "analytical/systems", ans: {
    f_surface_depth: "plutot_b", sf_data_files: "plutot_b", f_order_improv: "plutot_a",
    f_scale_task: "plutot_a", sf_digital_tools: "plutot_a", f_repeat_problem: "plutot_a",
    sf_numbers_people: "plutot_a", c_departement: "75",
  } },
  { name: "commercial/leadership", ans: {
    sf_sell_fix: "plutot_a", g_lead_support: "plutot_a", g_status_authority: "plutot_a",
    sf_commercial_signal: "plutot_a", f_decide_wait: "plutot_a", g_group_energy: "plutot_a",
    c_departement: "75",
  } },
];

const VISIBLE = 8; // the visible band we measure (matches the hero/bridge caps' scale)

function visibleBand(dirs: ResultDirection[]): ResultDirection[] {
  return [...dirs]
    .sort(
      (a, b) =>
        Number(b.isWildcard ?? false) - Number(a.isWildcard ?? false) ||
        b.coherenceRank - a.coherenceRank ||
        b.coverage - a.coverage,
    )
    .slice(0, VISIBLE);
}

function domSpread(band: ResultDirection[]): string {
  const by: Record<string, number> = {};
  for (const d of band) by[domainOf(d.romeCode)] = (by[domainOf(d.romeCode)] ?? 0) + 1;
  return Object.entries(by).sort((a, b) => b[1] - a[1])
    .map(([L, n]) => `${DOM[L] ?? L}:${n}`).join("  ");
}

async function runChild(out: (l?: string) => void) {
  const K = process.env.COHERENCE_K ?? "0.15";
  const F = process.env.COHERENCE_FORMULA ?? "plain";
  out("#".repeat(100));
  out(`# K=${K}  FORMULA=${F}`);
  out("#".repeat(100));
  for (const p of PERSONAS) {
    const r = await buildResults(buildInventory(p.ans));
    const dirs = r.directions;
    // BEFORE band = displayRank order (pre-coherence). AFTER = coherenceRank order.
    const before = [...dirs].sort((a, b) => b.displayRank - a.displayRank || b.coverage - a.coverage).slice(0, VISIBLE);
    const after = visibleBand(dirs);

    out("");
    out(`── ${p.name} ─ surfaced=${dirs.length}`);
    out(`   BEFORE domains: ${domSpread(before)}`);
    out(`   AFTER  domains: ${domSpread(after)}`);

    if (p.wall) {
      const hBefore = before.filter((d) => domainOf(d.romeCode) === "H").length;
      const hAfter = after.filter((d) => domainOf(d.romeCode) === "H").length;
      const jAfter = after.filter((d) => domainOf(d.romeCode) === "J").length;
      out(`   WALL: H(industrie) ${hBefore}→${hAfter}  ·  J(santé) after=${jAfter}   [target H≤3]`);
    }
    if (p.tech) {
      // survival: how many of the dominant tech cluster remain in the visible band.
      const domClusterAfter = new Map<string, number>();
      for (const d of after) domClusterAfter.set(clusterKey(d.romeCode), (domClusterAfter.get(clusterKey(d.romeCode)) ?? 0) + 1);
      const topCluster = [...domClusterAfter.entries()].sort((a, b) => b[1] - a[1])[0];
      out(`   TECH SURVIVAL: largest cluster in visible band = ${topCluster?.[0]} ×${topCluster?.[1]}   [guard: stays high]`);
    }

    // inversion: top-quartile rankScore rows pushed below the visible cap.
    const byRank = [...dirs].sort((a, b) => b.rankScore - a.rankScore);
    const q = Math.max(1, Math.floor(byRank.length / 4));
    const topQuartile = new Set(byRank.slice(0, q).map((d) => d.romeCode));
    const visibleCodes = new Set(after.map((d) => d.romeCode));
    const buried = [...topQuartile].filter((c) => !visibleCodes.has(c) &&
      before.some((d) => d.romeCode === c)); // was visible before, now below cap
    out(`   INVERSION: ${buried.length} top-quartile row(s) dropped from visible band${buried.length ? " → " + buried.slice(0, 5).join(",") : ""}`);

    const w = dirs.find((d) => d.isWildcard);
    out(`   WILDCARD: ${w ? `${w.romeCode} (${DOM[domainOf(w.romeCode)]})` : "none"}`);
  }
}

async function main() {
  if (CHILD) {
    const out = (l = "") => { process.stdout.write(l + "\n"); };
    await runChild(out);
    return;
  }
  writeFileSync(OUT, "");
  const out = (l = "") => { process.stdout.write(l + "\n"); appendFileSync(OUT, l + "\n"); };
  out("COHERENCE SWEEP — live graph · spec §7 proof");
  out(`ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE}`);

  const KS = ["0.10", "0.15", "0.20", "0.30"];
  const FORMULAS = ["plain", "strength"];
  for (const F of FORMULAS) {
    for (const K of KS) {
      const res = spawnSync(
        process.execPath,
        ["node_modules/tsx/dist/cli.mjs", "scripts/coherence-sweep.ts"],
        {
          encoding: "utf8",
          env: { ...process.env, COHERENCE_CHILD: "1", COHERENCE_K: K, COHERENCE_FORMULA: F },
        },
      );
      if (res.status !== 0) { out(res.stderr); process.exit(1); }
      out(res.stdout.trimEnd());
    }
  }
  out(`\n(full output → ${OUT})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
