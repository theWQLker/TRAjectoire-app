/**
 * D1408 DIAGNOSIS (live, report only, no fix). Why does téléconseil (D1408) lead
 * the Master's-HR (bac+5) profile? Decomposes D1408's rankScore into its six
 * terms next to the directions around it, then traces every shared competence
 * code back to the cluster(s) that put it in the inventory and the quiz answers
 * that fed those clusters (or the seed, if any).
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/d1408-diagnosis.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { GraphDirectionProposer, rankNormalisers } from "../src/lib/engine/graph-direction-proposer";
import type { CandidateDirection } from "../src/lib/engine/direction-proposer";
import { getRomeSource, rarityOf } from "../src/lib/rome";
import { CLUSTERS } from "../config/clusters";
import { CATEGORIES, LEAN_WEIGHTS, type Lean } from "../config/quiz";

const OUT = "scripts/_d1408-diagnosis-out.txt";
writeFileSync(OUT, "");
const out = (l = "") => { process.stdout.write(l + "\n"); appendFileSync(OUT, l + "\n"); };

// Same profile as scripts/level-demote-proof.ts (MASTERS_HR).
const MASTERS_HR: Answers = {
  c_departement: "75",
  c_diploma: "bac5",
  sf_numbers_people: "plutot_b",
  sf_client_issue: "plutot_b",
  g_conflict: "plutot_a",
  g_teach_do: "plutot_a",
  sf_training_peer: "plutot_a",
  g_hidden_need: "plutot_a",
  ar_learning_investment: "plutot_b",
};

// Mirrors of the proposer's private constants, used only to split rankScore into
// its terms. The script checks that the terms add back up to the engine's
// rankScore, so a drift between these and the engine shows up as a mismatch.
const LEAP_TIER_SCORE = { direct: 1.0, skill_bridge: 0.75, mobilite: 0.45, interest: 0.25 } as const;
const W = { leap: 0.6, coverage: 0.8, rarity: 0.4, lean: 1.1, interest: 0.25, mobility: 0.08 };
const FLOOR = Number(process.env.RARITY_GENERIC_FLOOR ?? "3");

const COMPARE = ["D1408", "C1201", "K2128", "M1501", "M1502", "M1503", "K1801", "K2111"];

async function main() {
  const inv = buildInventory(MASTERS_HR);
  const rome = getRomeSource();
  const rarity = await rome.competenceRarity();
  const N = (await rome.allMetiers()).length;

  // --- 1. Where the inventory comes from --------------------------------------
  out("D1408 DIAGNOSIS — Master's-HR (bac+5), live graph + live offers");
  out(`ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE}`);
  out(`inventory: ${inv.competenceCodes.length} codes · seeded: ${inv.seededCodes?.length ?? 0} · riasec: ${inv.riasec.join("")}`);
  out("");
  out("ANSWERS → CLUSTERS (score = cluster weight × lean weight)");
  const clusterFeeds = new Map<string, string[]>();
  for (const cat of CATEGORIES) {
    for (const scene of cat.scenes) {
      const raw = MASTERS_HR[scene.id];
      if (!raw || !(raw in LEAN_WEIGHTS)) continue;
      const w = LEAN_WEIGHTS[raw as Lean];
      for (const [side, opt, weight] of [["A", scene.optionA, w.a], ["B", scene.optionB, w.b]] as const) {
        if (weight <= 0) continue;
        const cl = (opt.maps.clusters ?? []).map((c) => `${c.id}×${c.weight * weight}`);
        out(`  ${scene.id} = ${raw} → side ${side} "${opt.label}"`);
        out(`      clusters: ${cl.join(", ") || "(none)"} · riasec: ${(opt.maps.riasec ?? []).join("") || "—"}`);
        for (const c of opt.maps.clusters ?? []) {
          const arr = clusterFeeds.get(c.id) ?? [];
          arr.push(scene.id);
          clusterFeeds.set(c.id, arr);
        }
      }
    }
  }
  out("");
  out("CLUSTER SCORES (inventory.clusterScores) and how many codes each adds:");
  const clusterById = new Map(CLUSTERS.map((c) => [c.id, c]));
  for (const [id, score] of Object.entries(inv.clusterScores).sort((a, b) => b[1] - a[1])) {
    out(`  ${id.padEnd(20)} score=${String(score).padEnd(5)} codes=${clusterById.get(id)?.competenceCodes.length ?? 0} ← ${clusterFeeds.get(id)?.join(", ") ?? "?"}`);
  }

  // --- 2. rankScore decomposition ------------------------------------------------
  const proposer = new GraphDirectionProposer(rome);
  const { surfaced } = await proposer.reach(inv);
  const norm = rankNormalisers(surfaced);
  const results = await buildResults(inv);
  const byDisplay = [...results.directions].sort((a, b) => b.displayRank - a.displayRank);
  const posOf = (code: string) => byDisplay.findIndex((d) => d.romeCode === code) + 1;
  const byBase = [...surfaced].sort((a, b) => b.rankScore - a.rankScore);
  const basePos = (code: string) => byBase.findIndex((d) => d.romeCode === code) + 1;

  const terms = (c: CandidateDirection) => ({
    leap: LEAP_TIER_SCORE[c.primaryLeap] * W.leap,
    coverage: (c.coverage / norm.maxCoverage) * W.coverage,
    rarity: (c.rarityScore / norm.maxRarity) * W.rarity,
    lean: (c.leanScore / norm.maxLean) * W.lean,
    interest: (c.interestScore / norm.maxInterest) * W.interest,
    mobility: c.mobilityScore * W.mobility,
  });

  out("");
  out(`NORMALISERS over ${surfaced.length} surfaced: maxLean=${norm.maxLean} maxInterest=${norm.maxInterest} maxRarity=${norm.maxRarity.toFixed(3)} maxCoverage=${norm.maxCoverage.toFixed(3)}`);
  out("");
  out("RANKSCORE TERMS (base rank / display rank)");
  out("  code   title                                  leap  cover rarit lean  inter mobil = base  | lean cov  shared  base# disp#");
  let drift = false;
  for (const code of COMPARE) {
    const c = surfaced.find((d) => d.romeCode === code);
    if (!c) { out(`  ${code}  (not surfaced)`); continue; }
    const t = terms(c);
    const sum = Object.values(t).reduce((s, v) => s + v, 0);
    if (Math.abs(sum - c.rankScore) > 1e-9) drift = true;
    const f = (v: number) => v.toFixed(2).padStart(5);
    out(
      `  ${code}  ${c.title.slice(0, 38).padEnd(38)} ${f(t.leap)} ${f(t.coverage)} ${f(t.rarity)} ${f(t.lean)} ${f(t.interest)} ${f(t.mobility)} = ${c.rankScore.toFixed(2)} | ` +
        `${String(c.leanScore).padStart(4)} ${(c.coverage * 100).toFixed(0).padStart(3)}% ${String(c.matchedCompetenceCodes.length).padStart(3)} ` +
        `${c.primaryLeap.padEnd(12)} ${String(basePos(code)).padStart(4)} ${String(posOf(code) || "—").padStart(5)}`,
    );
  }
  out(drift ? "  ✗ term sum ≠ engine rankScore — mirrors above are stale" : "  ✓ terms sum to the engine's rankScore for every row");

  // --- 3. D1408's shared codes, traced -------------------------------------------
  const d = surfaced.find((x) => x.romeCode === "D1408")!;
  const metier = (await rome.allMetiers()).find((m) => m.romeCode === "D1408")!;
  const lib = new Map(metier.competences.map((c) => [c.code, c.libelle]));
  const codeClusters = (code: string) => CLUSTERS.filter((c) => c.competenceCodes.includes(code)).map((c) => c.id);
  out("");
  out(`D1408 SHARED CODES: ${d.matchedCompetenceCodes.length} of the fiche's ${metier.competences.length} · leaps ${d.leapTypes.join("/")} · riasec matched ${d.matchedRiasec.join("") || "—"}`);
  out("  code     idf   >floor  clusters (inventory score)             libellé");
  const rows = d.matchedCompetenceCodes.map((code) => {
    const idf = rarityOf(rarity, code, N);
    const cls = codeClusters(code).filter((id) => inv.clusterScores[id]);
    const lean = cls.reduce((s, id) => s + (inv.clusterScores[id] ?? 0), 0);
    return { code, idf, cls, lean };
  }).sort((a, b) => b.lean - a.lean || b.idf - a.idf);
  for (const r of rows) {
    const seeded = inv.seededCodes?.includes(r.code) ? " [seed]" : "";
    out(
      `  ${r.code.padEnd(8)} ${r.idf.toFixed(2)}  ${Math.max(0, r.idf - FLOOR).toFixed(2)}   ` +
        `${r.cls.map((id) => `${id}(${inv.clusterScores[id]})`).join(" + ").padEnd(38)} ${lib.get(r.code) ?? "?"}${seeded}`,
    );
  }
  const leanByCluster = new Map<string, number>();
  for (const r of rows) for (const id of r.cls) leanByCluster.set(id, (leanByCluster.get(id) ?? 0) + (inv.clusterScores[id] ?? 0));
  out("");
  out(`  leanScore ${d.leanScore} = Σ over shared codes of their clusters' scores, by cluster:`);
  for (const [id, v] of [...leanByCluster].sort((a, b) => b[1] - a[1])) {
    out(`    ${id.padEnd(20)} ${String(v).padStart(4)}  (${(v / d.leanScore * 100).toFixed(0)}%) ← ${clusterFeeds.get(id)?.join(", ")}`);
  }
  const generic = rows.filter((r) => r.idf <= FLOOR).length;
  out(`  ${generic} of ${rows.length} shared codes sit at or under the generic idf floor (${FLOOR}).`);
  out("");
  out(`(full output → ${OUT})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
