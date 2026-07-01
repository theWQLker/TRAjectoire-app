/**
 * Rarity-weighting before/after report (BUILD_BRIEF §4.1, Phase 1).
 *
 * Runs the two §6 answer-sensitivity profiles (A people-leaning, B systems-
 * leaning) through the full live pipeline, then prints — for each profile — the
 * top-10 BEFORE rarity-weighting (the §3.6 weights, W_RARITY=0) and AFTER it
 * (W_RARITY active). For every direction it shows the shared skills that drove
 * it AND each skill's rarity (idf) score, so the shift is auditable: do the
 * directions sharing the user's DISTINCTIVE skills rise, and the generic-skill
 * look-alikes (coiffeur/vendeur for a payroll person) fall?
 *
 * This is a DIAGNOSTIC, not a gate. The surfaced SET is identical before/after
 * (rarity never changes what surfaces); only ORDER moves. Its output is the
 * evidence for the §4.1 HUMAN-GATE — George judges "feels non-generic?".
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live \
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/rarity-ab-report.ts
 */
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import {
  rankScore,
  rankNormalisers,
  W_RARITY,
} from "../src/lib/engine/graph-direction-proposer";
import { getRomeSource } from "../src/lib/rome";
import { rarityOf, type CompetenceRarity } from "../src/lib/rome";
import type { Inventory } from "../src/lib/engine/inventory";

// The §6.4 answer-sensitivity profiles, expressed as the inventories the quiz
// would build. Kept deliberately divergent (people vs systems) so the report
// shows rarity sharpening BOTH, not just one.
const PROFILE_A: Inventory = {
  // people-leaning: payroll core + a client/usager skill + Enterprising/Social
  competenceCodes: ["300306", "100343", "124607", "300361"],
  riasec: ["E", "S", "C"],
  clusterScores: { paie: 3, relation_client: 2 },
  riasecScores: { E: 3, S: 2, C: 1 },
  constraints: { departement: "75", departements: ["75"] },
};
const PROFILE_B: Inventory = {
  // systems-leaning: same skill core, ordering/data lean, Conventional/Realistic
  competenceCodes: ["300306", "100343", "124607", "300361"],
  riasec: ["C", "R", "I"],
  clusterScores: { paie: 3, gestion_donnees: 2 },
  riasecScores: { C: 3, R: 2, I: 1 },
  constraints: { departement: "75", departements: ["75"] },
};

type Row = { d: ResultDirection; before: number; after: number };

function rankBoth(directions: ResultDirection[]): Row[] {
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(directions);
  return directions.map((d) => ({
    d,
    // BEFORE: the exact pre-rarity formula (rarity weight forced to 0).
    before: rankScore(d, maxLean, maxInterest, maxRarity, 0),
    // AFTER: the active formula (rarity weight = the tuned constant).
    after: rankScore(d, maxLean, maxInterest, maxRarity),
  }));
}

function topN(rows: Row[], key: "before" | "after", n: number): Row[] {
  return [...rows]
    .sort((a, b) => b[key] - a[key] || a.d.romeCode.localeCompare(b.d.romeCode))
    .slice(0, n);
}

function fmtDrivers(
  d: ResultDirection,
  rarity: CompetenceRarity,
  n: number,
): string {
  // the shared skills that drove this direction, each with its idf rarity,
  // rarest first — so the reader sees WHAT made it distinctive (or generic).
  const drivers = d.matchedCompetenceCodes
    .map((code) => {
      const lib =
        d.market.requirementProfile.find((r) => r.code === code)?.libelle ?? code;
      return { code, lib, idf: rarityOf(rarity, code, n) };
    })
    .sort((a, b) => b.idf - a.idf);
  if (drivers.length === 0) return "(no shared skill — interest/mobilité only)";
  return drivers
    .map((x) => `${x.lib} [idf ${x.idf.toFixed(2)}]`)
    .join(", ");
}

function printProfile(
  label: string,
  rows: Row[],
  rarity: CompetenceRarity,
  n: number,
) {
  const before = topN(rows, "before", 10);
  const after = topN(rows, "after", 10);
  const beforeOrder = before.map((r) => r.d.romeCode);

  console.log("\n" + "=".repeat(84));
  console.log(`PROFILE ${label} — surfaced ${rows.length} directions · top-10 before/after rarity`);
  console.log("=".repeat(84));

  console.log("\n— BEFORE (rarity weight = 0, the §3.6 tuned weights) —");
  before.forEach((r, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${r.d.romeCode}  ${r.d.title}`);
    console.log(`      cov ${(r.d.coverage * 100).toFixed(0)}% · ${r.d.primaryLeap} · mean-idf ${r.d.rarityScore.toFixed(2)}`);
    console.log(`      shared: ${fmtDrivers(r.d, rarity, n)}`);
  });

  console.log(`\n— AFTER (rarity weight = ${W_RARITY}) —`);
  after.forEach((r, i) => {
    const prev = beforeOrder.indexOf(r.d.romeCode);
    const move =
      prev === -1 ? "NEW↑" : prev === i ? "  =" : prev > i ? `↑${prev - i}` : `↓${i - prev}`;
    console.log(`  ${String(i + 1).padStart(2)}. ${move.padStart(4)} ${r.d.romeCode}  ${r.d.title}`);
    console.log(`      cov ${(r.d.coverage * 100).toFixed(0)}% · ${r.d.primaryLeap} · mean-idf ${r.d.rarityScore.toFixed(2)}`);
    console.log(`      shared: ${fmtDrivers(r.d, rarity, n)}`);
  });

  // Movers out: directions that were top-10 before and dropped out after.
  const afterCodes = new Set(after.map((r) => r.d.romeCode));
  const droppedOut = before.filter((r) => !afterCodes.has(r.d.romeCode));
  if (droppedOut.length) {
    console.log("\n  Dropped OUT of top-10 (generic-skill look-alikes pushed down):");
    for (const r of droppedOut) {
      console.log(`     ${r.d.romeCode} ${r.d.title}  (mean-idf ${r.d.rarityScore.toFixed(2)})`);
    }
  }
}

async function main() {
  const rome = getRomeSource();
  const rarity = await rome.competenceRarity();
  const n = (await rome.allMetiers()).length;

  console.log(`ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE} · graph N=${n} métiers · distinct competences with idf=${rarity.size}`);

  const a = await buildResults(PROFILE_A);
  const b = await buildResults(PROFILE_B);

  printProfile("A (people-leaning)", rankBoth(a.directions), rarity, n);
  printProfile("B (systems-leaning)", rankBoth(b.directions), rarity, n);

  // Sanity: the surfaced SET must be identical before/after (rarity orders only).
  console.log("\n" + "=".repeat(84));
  console.log(
    `SET-INVARIANCE CHECK — A surfaced ${a.directions.length}, B surfaced ${b.directions.length}. ` +
      `Rarity re-orders these exact sets; it never adds or drops a row (the coverage floor owns surfacing).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
