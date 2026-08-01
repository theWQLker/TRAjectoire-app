/**
 * REGRESSION DIAGNOSIS (measure only) — "my tech directions used to surface, now
 * generic-admin dominates." Traces WHERE the informatique (M18xx) directions fall,
 * and where generic-admin (M1607 Secrétariat / M1203 Comptabilité / D1408 Téléconseil)
 * RISE, across the four ranking-engine stages the git history identifies:
 *
 *   Stage 1  pre-weight-change   W_RARITY 0.7 · W_LEAN 0.5   (commit 7ef7840 era)
 *   Stage 2  post-weight-change  W_RARITY 0.4 · W_LEAN 1.1   (commit d7df830)
 *   Stage 3  + level-demote      sort by displayRank         (commit 34ee3a1)
 *   Stage 4  + coherence (HEAD)  sort by coherenceRank       (commits 6164400..24dc18a)
 *
 * FAITHFULNESS NOTE. The seed front-door (seed_families) did NOT exist at 7ef7840,
 * so we cannot check out that raw commit and feed it an informatique seed — the
 * input profile literally can't be built there. Instead we hold ONE informatique
 * inventory fixed and recompute each stage's ORDERING KNOB on the current surfaced
 * set. Every sub-score the ranking needs (leanScore, rarityScore, coverage,
 * interestScore, mobilityScore, primaryLeap, levelPenalty, coherenceRank) is
 * stamped by buildResults; stages 1-2 recompute the composite with the historic
 * weights, stages 3-4 read the already-stamped displayRank / coherenceRank. The
 * surfaced SET is identical across stages (none of these changes gate surfacing),
 * so this isolates each change's effect on ORDER — exactly the diagnosis asked.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live \
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/regression-tech-buried-proof.ts
 */
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { rankNormalisers } from "../src/lib/engine/graph-direction-proposer";

// The informatique-cognitive profile (systems / data / digital-tools leans) —
// identical to the DEV_BASE persona used by seed-proof-tech-code.ts — PLUS the
// informatique front-door seed.
const INFORMATIQUE: Answers = {
  f_order_improv: "plutot_a", f_surface_depth: "plutot_b", f_scale_task: "plutot_a",
  f_decide_wait: "plutot_a", f_leverage_completeness: "plutot_b", sf_numbers_people: "plutot_a",
  sf_data_files: "plutot_b", sf_digital_tools: "plutot_a", sf_client_issue: "plutot_a",
  g_lead_support: "plutot_b", c_departement: "75",
  seed_families: "tech:code",
};

// ---------------------------------------------------------------------------
// The exact per-stage weights, read straight from the git history (see header).
// leap-tier / coverage / interest / mobility never changed across these commits,
// so we keep them at the (constant) current values and vary only rarity + lean.
// ---------------------------------------------------------------------------
const W_LEAP_TIER = 0.6, W_COVERAGE = 0.8, W_INTEREST = 0.25, W_MOBILITY = 0.08;
const LEAP_TIER_SCORE: Record<string, number> = {
  direct: 1.0, skill_bridge: 0.75, mobilite: 0.45, interest: 0.25,
};

/** Recompute the composite ordering score with explicit rarity + lean weights. */
function composite(
  d: ResultDirection,
  wRarity: number,
  wLean: number,
  norm: { maxLean: number; maxInterest: number; maxRarity: number; maxCoverage: number },
): number {
  const leanNorm = d.leanScore / norm.maxLean;
  const interestNorm = d.interestScore / norm.maxInterest;
  const rarityNorm = d.rarityScore / norm.maxRarity;
  const coverageNorm = d.coverage / norm.maxCoverage;
  return (
    LEAP_TIER_SCORE[d.primaryLeap] * W_LEAP_TIER +
    coverageNorm * W_COVERAGE +
    rarityNorm * wRarity +
    leanNorm * wLean +
    interestNorm * W_INTEREST +
    d.mobilityScore * W_MOBILITY
  );
}

type Stage = { key: string; label: string; scoreOf: (d: ResultDirection) => number };

/** Rank the surfaced set by a stage's ordering score, strongest first. */
function rankBy(dirs: ResultDirection[], scoreOf: (d: ResultDirection) => number) {
  return [...dirs]
    .map((d) => ({ d, s: scoreOf(d) }))
    .sort((a, b) => b.s - a.s || a.d.romeCode.localeCompare(b.d.romeCode));
}

// Marker sets for the two families we're tracking.
const isTech = (code: string) => code.startsWith("M18");
// Generic-admin the user named: Secrétariat (M1607), Comptabilité (M1203),
// Téléconseil (D1408), plus Assistanat/Secrétariat siblings in M16.
const GENERIC_ADMIN = new Set(["M1607", "M1203", "D1408", "M1606", "M1608", "M1609", "C1201"]);
const isGenericAdmin = (code: string) => GENERIC_ADMIN.has(code) || code.startsWith("M16");

function fmtTech(dirs: ResultDirection[]) {
  return dirs.filter((d) => isTech(d.romeCode)).map((d) => d.romeCode).sort();
}

async function main() {
  console.log(
    `ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE}`,
  );

  const inv = buildInventory(INFORMATIQUE);
  const results = await buildResults(inv);
  const dirs = results.directions;
  const norm = rankNormalisers(dirs);

  const allTech = fmtTech(dirs);
  console.log(
    `\nInformatique inventory: ${inv.competenceCodes.length} codes ` +
      `(${inv.seededCodes?.length ?? 0} seeded) · surfaced ${dirs.length} directions`,
  );
  console.log(`Tech (M18xx) directions surfaced (${allTech.length}): ${allTech.join(", ")}`);
  console.log(`Normalisers: maxLean=${norm.maxLean.toFixed(2)} maxRarity=${norm.maxRarity.toFixed(2)} maxCoverage=${norm.maxCoverage.toFixed(4)} maxInterest=${norm.maxInterest.toFixed(2)}`);

  const stages: Stage[] = [
    { key: "S1", label: "Stage 1 — pre-weight-change (W_RARITY 0.7 · W_LEAN 0.5)",
      scoreOf: (d) => composite(d, 0.7, 0.5, norm) },
    { key: "S2", label: "Stage 2 — post-weight-change (W_RARITY 0.4 · W_LEAN 1.1)",
      scoreOf: (d) => composite(d, 0.4, 1.1, norm) },
    { key: "S3", label: "Stage 3 — + level-demote (sort by displayRank)",
      scoreOf: (d) => d.displayRank },
    { key: "S4", label: "Stage 4 — + coherence, HEAD (sort by coherenceRank)",
      scoreOf: (d) => d.coherenceRank },
  ];

  // Full top-15 per stage.
  const rankings = stages.map((st) => ({ st, ranked: rankBy(dirs, st.scoreOf) }));

  for (const { st, ranked } of rankings) {
    console.log("\n" + "=".repeat(92));
    console.log(st.label);
    console.log("=".repeat(92));
    ranked.slice(0, 15).forEach(({ d, s }, i) => {
      const tag = isTech(d.romeCode) ? " ◄ TECH" : isGenericAdmin(d.romeCode) ? " ◄ generic-admin" : "";
      console.log(
        `  ${String(i + 1).padStart(2)}. ${d.romeCode} ${d.title.slice(0, 46).padEnd(46)} ` +
          `score ${s.toFixed(3)} · ${d.primaryLeap} · cov ${(d.coverage * 100).toFixed(0)}% · idf ${d.rarityScore.toFixed(2)} · lean ${d.leanScore.toFixed(0)}${tag}`,
      );
    });
  }

  // ---- Tracking table: where does each tracked code land at each stage? -------
  const rankOf = (ranked: { d: ResultDirection }[], code: string) => {
    const i = ranked.findIndex((x) => x.d.romeCode === code);
    return i === -1 ? null : i + 1;
  };

  const trackCodes = [
    ...allTech.map((c) => ({ code: c, fam: "TECH" })),
    ...[...GENERIC_ADMIN].filter((c) => dirs.some((d) => d.romeCode === c)).map((c) => ({ code: c, fam: "admin" })),
  ];

  console.log("\n" + "=".repeat(92));
  console.log("RANK TRACKING — position of each tracked direction at each stage (— = below any shown)");
  console.log("=".repeat(92));
  console.log(`  ${"code".padEnd(7)} ${"fam".padEnd(6)} ${"title".padEnd(34)} S1    S2    S3    S4`);
  for (const { code, fam } of trackCodes) {
    const title = (dirs.find((d) => d.romeCode === code)?.title ?? "").slice(0, 33).padEnd(34);
    const cols = rankings
      .map(({ ranked }) => {
        const r = rankOf(ranked, code);
        return (r === null ? "—" : "#" + r).padEnd(6);
      })
      .join("");
    console.log(`  ${code.padEnd(7)} ${fam.padEnd(6)} ${title} ${cols}`);
  }

  // ---- Aggregate: best tech rank & top-15 counts per stage --------------------
  console.log("\n" + "=".repeat(92));
  console.log("AGGREGATE — best tech rank · #tech in top-15 · #generic-admin in top-15");
  console.log("=".repeat(92));
  for (const { st, ranked } of rankings) {
    const techRanks = allTech.map((c) => rankOf(ranked, c)).filter((r): r is number => r !== null);
    const bestTech = techRanks.length ? Math.min(...techRanks) : null;
    const techTop15 = techRanks.filter((r) => r <= 15).length;
    const top15codes = ranked.slice(0, 15).map((x) => x.d.romeCode);
    const adminTop15 = top15codes.filter((c) => isGenericAdmin(c)).length;
    console.log(
      `  ${st.key}  best-tech ${bestTech === null ? "—" : "#" + bestTech} · ` +
        `tech-in-top15 ${techTop15}/${allTech.length} · generic-admin-in-top15 ${adminTop15}`,
    );
  }

  // ---- Isolation: attribute the S1→S2 shift to the weight change alone --------
  // S2 differs from S1 ONLY in W_RARITY 0.7→0.4 and W_LEAN 0.5→1.1. Show each
  // effect separately to test the hypothesis (rarity-drop buried tech, not lean).
  console.log("\n" + "=".repeat(92));
  console.log("ISOLATION — decompose the S1→S2 weight change (best tech rank under each half)");
  console.log("=".repeat(92));
  const halves: { label: string; wR: number; wL: number }[] = [
    { label: "S1 baseline      (rarity 0.7, lean 0.5)", wR: 0.7, wL: 0.5 },
    { label: "rarity-drop only (rarity 0.4, lean 0.5)", wR: 0.4, wL: 0.5 },
    { label: "lean-raise only  (rarity 0.7, lean 1.1)", wR: 0.7, wL: 1.1 },
    { label: "S2 both          (rarity 0.4, lean 1.1)", wR: 0.4, wL: 1.1 },
  ];
  for (const h of halves) {
    const ranked = rankBy(dirs, (d) => composite(d, h.wR, h.wL, norm));
    const techRanks = allTech.map((c) => rankOf(ranked, c)).filter((r): r is number => r !== null);
    const bestTech = techRanks.length ? Math.min(...techRanks) : null;
    // tech-in-top15 is the metric that exposes the INTERACTION: best-tech stays
    // high under each half alone, but the top-15 count only collapses when BOTH
    // fire (lean-raise promotes the high-lean industrie bridges; rarity-drop
    // removes the counterweight that held distinctive tech above them).
    const techTop15 = techRanks.filter((r) => r <= 15).length;
    console.log(
      `  ${h.label}  →  best-tech ${bestTech === null ? "—" : "#" + bestTech} · tech-in-top15 ${techTop15}/15`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
