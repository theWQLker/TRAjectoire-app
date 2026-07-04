/**
 * MERGE-SCENARIOS harness (report only — builds nothing).
 *
 * Drives 5 fixed answer-sets through the REAL flow the UI uses — seed + cognitive
 * → buildInventory → buildResults → ranked tiers — on the live graph, and prints
 * one comparison table. buildInventory + buildResults ARE the full flow: the quiz
 * server action calls buildInventory(answers); the results page calls
 * buildResults(inventory). Nothing sits between them and the rendered tiers.
 *
 * THE 5 SCENARIOS
 *   1 BASELINE  cognitive-only, NO seed. Coherent tech/systems cognitive.
 *   2 ALIGNED   seed tech:code + tech/systems cognitive.
 *   3 MERGE-A   seed tech:code + HR/people cognitive.
 *   4 MERGE-B   seed admin:rh  + tech/systems cognitive (mirror of #3).
 *   5 SHAPE-B   seed 4 families (commerce:vente, admin:secretariat,
 *               communication:comm, transport:conduite) + commercial/admin
 *               cognitive (the real tester's case). The front door always emits
 *               one family:depth token per picked family (see SeedStep.serialize),
 *               so a "4 families" seed is 4 family:depth picks — never bare ids.
 *
 * WHAT #3/#4 MEASURE (north star, NOT "who wins"): does the engine MERGE both
 * dimensions into a coherent range that honours BOTH — surfacing intersection
 * directions neither dimension alone would produce? A direction is an
 * INTERSECTION role iff its matched skills draw from BOTH the seed provenance
 * (inventory.seededCodes) AND the cognitive provenance (the rest of
 * competenceCodes). That is exactly "it surfaced because the person is both".
 * Classify #3/#4:
 *   MERGED              both domains present in top-15 AND ≥1 intersection role.
 *   ONE-DIMENSION-ERASED top-15 ≥80% one domain; the other input near-absent.
 *   INCOHERENT-MUSH     both domains present but zero intersection roles.
 *
 * Tier FORT/MOYEN/FAIBLE = signalStrength(matchRaritySum) (rarity-weighted, §4),
 * NOT coverage %. Ranking = the engine's own rankScore/rankNormalisers.
 *
 * Usage (one command):
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/merge-scenarios.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import {
  buildResults,
  type ResultDirection,
  type Results,
} from "../src/lib/engine/results";
import {
  rankScore,
  rankNormalisers,
} from "../src/lib/engine/graph-direction-proposer";
import { signalStrength } from "../src/lib/engine/coverage";
import type { Inventory } from "../src/lib/engine/inventory";

const OUT = "scripts/_merge-scenarios-out.txt";
writeFileSync(OUT, "");
const out = (l = "") => {
  process.stdout.write(l + "\n");
  appendFileSync(OUT, l + "\n");
};

// ROME first letter → domain label (same map coherence-audit.ts uses).
const DOM: Record<string, string> = {
  A: "agriculture",
  B: "artisanat",
  C: "banque/assur/immo",
  D: "commerce",
  E: "communication",
  F: "BTP",
  G: "hôtellerie",
  H: "industrie",
  I: "maintenance",
  J: "santé",
  K: "services-personne",
  L: "spectacle",
  M: "support/admin/IT",
  N: "transport",
};
const domOf = (romeCode: string) => DOM[romeCode[0]] ?? romeCode[0];

const SIG: Record<string, string> = {
  strong: "FORT",
  partial: "MOYEN",
  exploratory: "FAIBLE",
};
const tierOf = (d: ResultDirection) => SIG[signalStrength(d.matchRaritySum)];

const DEPT = { c_departement: "75" };

// ---------------------------------------------------------------------------
// Coherent cognitive lean-sets, each lean drawn from the verified scene→cluster
// map in config/quiz.ts (so the set is internally coherent, not a random push).
// ---------------------------------------------------------------------------

// Tech / systems: analyse, systemes, numerique, gestion_donnees, diagnostic, rigueur.
const COG_TECH: Answers = {
  f_surface_depth: "plutot_b", // analyse+detection_incoherence+diagnostic (I)
  f_scale_task: "plutot_a", // systemes+scalabilite+standardisation (CI)
  f_repeat_problem: "plutot_a", // analyse+amelioration_continue+systemes (IC)
  sf_digital_tools: "plutot_a", // numerique+systemes+standardisation (CI)
  sf_data_files: "plutot_b", // analyse+reporting+synthese (I)
  sf_sell_fix: "plutot_b", // resolution+support+technique (RI)
  sf_numbers_people: "plutot_a", // rigueur+gestion_donnees+administration (C)
};

// HR / people: contact, relation_client, empathie, transmission, pedagogie,
// gestion_conflit, coordination.
const COG_HR: Answers = {
  sf_numbers_people: "plutot_b", // contact+relation_client+service (S)
  sf_client_issue: "plutot_b", // relation_client+empathie+service (S)
  g_conflict: "plutot_a", // contact+gestion_conflit+relation_client (SE)
  g_teach_do: "plutot_a", // transmission+pedagogie+service (S)
  sf_training_peer: "plutot_a", // formation+pedagogie+transmission (S)
  g_boundaries: "plutot_b", // empathie+service+besoin_harmonie (S)
  g_hidden_need: "plutot_a", // diagnostic+empathie+clarification (SI)
};

// Commercial / admin: vente, business_analysis, leadership, organisation,
// coordination, administration.
const COG_COMMERCIAL_ADMIN: Answers = {
  sf_sell_fix: "plutot_a", // vente+persuasion+influence (E)
  sf_commercial_signal: "plutot_a", // business_analysis+leverage+diagnostic (EI)
  g_lead_support: "plutot_a", // leadership+coordination+decision (E)
  sf_hands_organise: "plutot_b", // organisation+coordination+planification (CE)
  sf_project_followup: "plutot_a", // coordination+planification+organisation (CE)
  sf_numbers_people: "plutot_a", // rigueur+gestion_donnees+administration (C)
};

type Scenario = {
  n: number;
  name: string;
  seed: string | null; // seed_families value, or null (skipped)
  cognitive: Answers;
  /** measure the merge for this scenario (#3/#4). */
  measureMerge: boolean;
};

const SCENARIOS: Scenario[] = [
  { n: 1, name: "BASELINE", seed: null, cognitive: COG_TECH, measureMerge: false },
  { n: 2, name: "ALIGNED", seed: "tech:code", cognitive: COG_TECH, measureMerge: false },
  { n: 3, name: "MERGE-A", seed: "tech:code", cognitive: COG_HR, measureMerge: true },
  { n: 4, name: "MERGE-B", seed: "admin:rh", cognitive: COG_TECH, measureMerge: true },
  {
    n: 5,
    name: "SHAPE-B",
    // one representative depth per family — the front door never seeds a bare
    // family id (SeedStep emits familyId:depthId per picked family).
    seed: "commerce:vente,admin:secretariat,communication:comm,transport:conduite",
    cognitive: COG_COMMERCIAL_ADMIN,
    measureMerge: false,
  },
];

// ---------------------------------------------------------------------------
// Pipeline: answers → inventory → results → ranked directions (engine order).
// ---------------------------------------------------------------------------

function answersFor(s: Scenario): Answers {
  return {
    ...(s.seed ? { seed_families: s.seed } : {}),
    ...s.cognitive,
    ...DEPT,
  };
}

function ranked(r: Results): ResultDirection[] {
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(r.directions);
  return [...r.directions]
    .map((d) => ({ d, s: rankScore(d, maxLean, maxInterest, maxRarity) }))
    .sort((a, b) => b.s - a.s || a.d.romeCode.localeCompare(b.d.romeCode))
    .map((x) => x.d);
}

// Provenance split of a direction's matched skills (mechanical, no allow-list).
function provenance(d: ResultDirection, seeded: Set<string>, cognitive: Set<string>) {
  const seedHits = d.matchedCompetenceCodes.filter((c) => seeded.has(c));
  const cogHits = d.matchedCompetenceCodes.filter((c) => cognitive.has(c));
  const tag = seedHits.length && cogHits.length
    ? "BOTH"
    : seedHits.length
      ? "SEED"
      : cogHits.length
        ? "COG"
        : "—";
  return { seedHits, cogHits, tag, intersection: tag === "BOTH" };
}

type Snapshot = {
  s: Scenario;
  inv: Inventory;
  dirs: ResultDirection[]; // engine-ranked
  top15: ResultDirection[];
  tierDist: { FORT: number; MOYEN: number; FAIBLE: number };
  domSpread: [string, number][]; // over top-15
  seededN: number;
  invN: number;
  seeded: Set<string>;
  cognitive: Set<string>;
  intersectionRoles: {
    d: ResultDirection;
    seedHits: string[];
    cogHits: string[];
  }[];
  mergeVerdict: string | null;
};

function tierDistribution(dirs: ResultDirection[]) {
  const t = { FORT: 0, MOYEN: 0, FAIBLE: 0 };
  for (const d of dirs) t[tierOf(d) as keyof typeof t] += 1;
  return t;
}

function domainSpread(dirs: ResultDirection[]): [string, number][] {
  const by: Record<string, number> = {};
  for (const d of dirs) by[domOf(d.romeCode)] = (by[domOf(d.romeCode)] ?? 0) + 1;
  return Object.entries(by).sort((a, b) => b[1] - a[1]);
}

/**
 * MERGE classification over the top-15 (domain-bridge inference, no allow-list).
 * seedDom / cogDom = dominant domain of, respectively, the SEED-tagged and
 * COG-tagged directions in the top-15.
 */
function classifyMerge(
  top15: ResultDirection[],
  seeded: Set<string>,
  cognitive: Set<string>,
): { verdict: string; detail: string } {
  const rows = top15.map((d) => ({ d, ...provenance(d, seeded, cognitive) }));
  const intersections = rows.filter((r) => r.intersection);

  // domains present, split by which dimension put them there
  const seedDoms = new Set(
    rows.filter((r) => r.seedHits.length).map((r) => domOf(r.d.romeCode)),
  );
  const cogDoms = new Set(
    rows.filter((r) => r.cogHits.length).map((r) => domOf(r.d.romeCode)),
  );

  // domain concentration of the whole top-15 (for the erased test)
  const spread = domainSpread(top15);
  const topDomShare = spread.length ? spread[0][1] / top15.length : 0;

  const bothDimsPresent = seedDoms.size > 0 && cogDoms.size > 0;

  let verdict: string;
  if (bothDimsPresent && intersections.length > 0) {
    verdict = "MERGED";
  } else if (topDomShare >= 0.8 || !bothDimsPresent) {
    verdict = "ONE-DIMENSION-ERASED";
  } else {
    verdict = "INCOHERENT-MUSH";
  }

  const detail =
    `intersection roles: ${intersections.length}` +
    ` · seed-domains{${[...seedDoms].join(",") || "—"}}` +
    ` · cog-domains{${[...cogDoms].join(",") || "—"}}` +
    ` · top-domain share ${(topDomShare * 100).toFixed(0)}%`;
  return { verdict, detail };
}

async function run(s: Scenario): Promise<Snapshot> {
  const inv = buildInventory(answersFor(s));
  const seeded = new Set(inv.seededCodes ?? []);
  const cognitive = new Set(
    (inv.competenceCodes ?? []).filter((c) => !seeded.has(c)),
  );
  const r = await buildResults(inv);
  const dirs = ranked(r);
  const top15 = dirs.slice(0, 15);

  const intersectionRoles = dirs
    .map((d) => ({ d, ...provenance(d, seeded, cognitive) }))
    .filter((x) => x.intersection)
    .map((x) => ({ d: x.d, seedHits: x.seedHits, cogHits: x.cogHits }));

  let mergeVerdict: string | null = null;
  if (s.measureMerge) {
    mergeVerdict = classifyMerge(top15, seeded, cognitive).verdict;
  }

  return {
    s,
    inv,
    dirs,
    top15,
    tierDist: tierDistribution(dirs),
    domSpread: domainSpread(top15),
    seededN: seeded.size,
    invN: (inv.competenceCodes ?? []).length,
    seeded,
    cognitive,
    intersectionRoles,
    mergeVerdict,
  };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function reportScenario(snap: Snapshot) {
  const { s } = snap;
  out("=".repeat(100));
  out(
    `SCENARIO ${s.n} — ${s.name}   seed=[${s.seed ?? "none (skipped)"}]` +
      `   cognitive=${Object.keys(s.cognitive).length} scenes`,
  );
  out("=".repeat(100));

  out(
    `inventory: seededCodes=${snap.seededN} · total competenceCodes=${snap.invN}` +
      ` · surfaced directions=${snap.dirs.length}`,
  );
  out(
    `tiers (all surfaced): FORT ${snap.tierDist.FORT} · MOYEN ${snap.tierDist.MOYEN}` +
      ` · FAIBLE ${snap.tierDist.FAIBLE}`,
  );
  out(
    `domain spread (top-15): ` +
      snap.domSpread.map(([d, n]) => `${d}:${n}`).join("  "),
  );

  out("");
  out(
    "  # tier   rome   prov  domain              title",
  );
  out("  " + "-".repeat(94));
  snap.top15.forEach((d, i) => {
    const { tag } = provenance(d, snap.seeded, snap.cognitive);
    out(
      `  ${String(i + 1).padStart(2)} ${tierOf(d).padEnd(6)} ${d.romeCode.padEnd(6)} ` +
        `${tag.padEnd(5)} ${domOf(d.romeCode).padEnd(19)} ${d.title.slice(0, 46)}`,
    );
  });

  if (s.measureMerge) {
    const { verdict, detail } = classifyMerge(
      snap.top15,
      snap.seeded,
      snap.cognitive,
    );
    out("");
    out(`  MERGE VERDICT: ${verdict}`);
    out(`  ${detail}`);
    out(
      `  intersection roles (surfaced BECAUSE the person is both — top of ranking first):`,
    );
    if (snap.intersectionRoles.length === 0) {
      out("     NONE — no direction draws on both the seed and the cognitive lean.");
    } else {
      for (const r of snap.intersectionRoles.slice(0, 12)) {
        out(
          `     ${r.d.romeCode} ${domOf(r.d.romeCode).padEnd(17)} ${r.d.title.slice(0, 42)}` +
            `  (seed×${r.seedHits.length} cog×${r.cogHits.length})`,
        );
      }
      if (snap.intersectionRoles.length > 12) {
        out(`     … +${snap.intersectionRoles.length - 12} more intersection roles`);
      }
    }
  }
  out("");
}

function reportComparison(snaps: Snapshot[]) {
  out("=".repeat(100));
  out("COMPARISON — all 5 scenarios");
  out("=".repeat(100));
  out(
    "#  name       seed                                    inv(seed/tot)  FORT MOYEN FAIBLE  int  merge",
  );
  out("-".repeat(100));
  for (const s of snaps) {
    const seedLabel = (s.s.seed ?? "none").slice(0, 38);
    out(
      `${String(s.s.n)}  ${s.s.name.padEnd(9)} ${seedLabel.padEnd(39)} ` +
        `${String(s.seededN).padStart(4)}/${String(s.invN).padEnd(4)}    ` +
        `${String(s.tierDist.FORT).padStart(4)} ${String(s.tierDist.MOYEN).padStart(5)} ` +
        `${String(s.tierDist.FAIBLE).padStart(6)}  ${String(s.intersectionRoles.length).padStart(3)}  ` +
        `${s.mergeVerdict ?? "—"}`,
    );
  }
  out("-".repeat(100));
  out(
    "int = directions drawing on BOTH seed + cognitive provenance (intersection roles).",
  );
  out(
    "merge = #3/#4 classification (MERGED good · ONE-DIMENSION-ERASED fail · INCOHERENT-MUSH fail).",
  );
}

async function main() {
  out("MERGE-SCENARIOS — 5 fixed answer-sets through the live seed+cognitive flow");
  out(`ROME_SOURCE=${process.env.ROME_SOURCE ?? "fixture"} · OFFER_SOURCE=${process.env.OFFER_SOURCE ?? "fixture"}`);
  out("");

  const snaps: Snapshot[] = [];
  for (const s of SCENARIOS) snaps.push(await run(s));

  for (const snap of snaps) reportScenario(snap);
  reportComparison(snaps);

  out("");
  out(`(full output written to ${OUT})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
