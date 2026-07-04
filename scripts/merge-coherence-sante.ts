/**
 * MERGE-COHERENCE DIAGNOSTIC — santé:soin seed + hands-on cognitive (report only).
 *
 * Profile: seed_families="sante:soin", cognitive hands-on
 *   sf_hands_organise=a  → clusters terrain, manuel, execution  (RIASEC R)
 *   f_scale_task=a       → clusters systemes, scalabilite, standardisation (RIASEC C,I)
 *
 * Drives the SAME flow the UI uses (buildInventory → GraphDirectionProposer.reach
 * → buildResults) on the live graph, then prints four sections:
 *   1. cognitive "hands-on" injected codes: idf + distinct-ROME-job count, flag ≥100.
 *   2. coherent merge directions: 7 target ROME codes — surfaced? position?
 *      matchRaritySum? carries BOTH santé-seed AND hands-on-cognitive codes?
 *   3. Cisailleur (H2905) vs Cadre de santé (J1502): full rankScore components
 *      + displayRank, identify the inversion driver.
 *   4. top-20 override rate: how many have ZERO overlap with santé seed codes.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/merge-coherence-sante.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { getRomeSource } from "../src/lib/rome";
import { rarityOf } from "../src/lib/rome";
import {
  GraphDirectionProposer,
} from "../src/lib/engine/graph-direction-proposer";
import {
  rankScore,
  rankNormalisers,
  W_RARITY,
} from "../src/lib/engine/graph-direction-proposer";
import { userLevel, levelPenalty, displayRank } from "../src/lib/engine/level-demote";
import { signalStrength } from "../src/lib/engine/coverage";
import { CLUSTERS } from "../config/clusters";

const OUT = "scripts/_merge-coherence-sante-out.txt";
writeFileSync(OUT, "");
const out = (l = "") => {
  process.stdout.write(l + "\n");
  appendFileSync(OUT, l + "\n");
};

// The exact answer set for the audited profile.
const ANSWERS: Answers = {
  seed_families: "sante:soin",
  sf_hands_organise: "plutot_a",
  f_scale_task: "plutot_a",
  c_departement: "75",
};

// Clusters the two hands-on optionA sides map to (verified in config/quiz.ts).
const HANDSON_CLUSTERS = [
  "terrain",
  "manuel",
  "execution", // sf_hands_organise=a
  "systemes",
  "scalabilite",
  "standardisation", // f_scale_task=a
];

const TARGETS: { code: string; label: string }[] = [
  { code: "J1403", label: "ergothérapeute" },
  { code: "J1404", label: "kinésithérapeute" },
  { code: "J1405", label: "orthophoniste" },
  { code: "J1410", label: "prothésiste dentaire" },
  { code: "J1402", label: "diététicien" },
  { code: "J1502", label: "préparateur pharmacie (label per prompt)" },
  { code: "K1104", label: "psychomotricien" },
];

const SIG: Record<string, string> = {
  strong: "FORT",
  partial: "MOYEN",
  exploratory: "FAIBLE",
};

async function main() {
  out("MERGE-COHERENCE DIAGNOSTIC — santé:soin + hands-on cognitive");
  out(
    `ROME_SOURCE=${process.env.ROME_SOURCE ?? "fixture"} OFFER_SOURCE=${process.env.OFFER_SOURCE ?? "fixture"} · W_RARITY=${W_RARITY} · RARITY_GENERIC_FLOOR=${process.env.RARITY_GENERIC_FLOOR ?? "3"}`,
  );
  out("");

  const inv = buildInventory(ANSWERS);
  const seeded = new Set(inv.seededCodes ?? []);
  const cognitive = new Set(
    (inv.competenceCodes ?? []).filter((c) => !seeded.has(c)),
  );
  out(
    `inventory: seededCodes=${seeded.size} · cognitiveCodes=${cognitive.size} · total=${(inv.competenceCodes ?? []).length} · riasec=[${inv.riasec.join(",")}]`,
  );
  out(`clusterScores=${JSON.stringify(inv.clusterScores)}`);
  out("");

  const rome = getRomeSource();
  const rarity = await rome.competenceRarity();
  const allMetiers = await rome.allMetiers();
  const N = allMetiers.length;
  // recover df (distinct ROME jobs carrying the code) from idf:
  //   idf = ln((N+1)/(df+1))  →  df = (N+1)/exp(idf) - 1
  const dfOf = (idf: number) => Math.round((N + 1) / Math.exp(idf) - 1);

  // ---- SECTION 1: hands-on cognitive injected codes -----------------------
  out("=".repeat(100));
  out("1. HANDS-ON COGNITIVE INJECTED CODES  (clusters: " + HANDSON_CLUSTERS.join(", ") + ")");
  out(`   graph N = ${N} métiers · df recovered from idf · flag codes in 100+ jobs`);
  out("=".repeat(100));

  // The cognitive codes actually injected = inventory codes NOT from the seed.
  // Attribute each to its owning hands-on cluster(s) for readability.
  const clusterCodes = new Map<string, string[]>(
    CLUSTERS.map((c) => [c.id, c.competenceCodes]),
  );
  const codeToClusters = new Map<string, string[]>();
  for (const cid of HANDSON_CLUSTERS) {
    for (const code of clusterCodes.get(cid) ?? []) {
      const arr = codeToClusters.get(code) ?? [];
      arr.push(cid);
      codeToClusters.set(code, arr);
    }
  }

  const injected = [...cognitive].map((code) => {
    const idf = rarityOf(rarity, code, N);
    return { code, idf, df: dfOf(idf), clusters: codeToClusters.get(code) ?? [] };
  });
  injected.sort((a, b) => a.idf - b.idf); // most generic first (worst offenders on top)

  // label lookup: find a libellé for the code from any métier that carries it
  const labelOf = new Map<string, string>();
  for (const m of allMetiers) {
    for (const c of m.competences) {
      if (codeToClusters.has(c.code) && !labelOf.has(c.code)) labelOf.set(c.code, c.libelle);
    }
  }

  out("");
  out("  code    idf    #jobs  flag  clusters                         libellé");
  out("  " + "-".repeat(96));
  for (const r of injected) {
    const flag = r.df >= 100 ? "⚠100+" : "     ";
    out(
      `  ${r.code.padEnd(7)} ${r.idf.toFixed(2).padStart(5)} ${String(r.df).padStart(6)}  ${flag} ${r.clusters.join(",").padEnd(32)} ${(labelOf.get(r.code) ?? "").slice(0, 40)}`,
    );
  }
  const generic = injected.filter((r) => r.df >= 100);
  out("");
  out(
    `  → ${injected.length} cognitive codes injected · ${generic.length} appear in 100+ jobs (too generic to differentiate): ${generic.map((g) => g.code).join(", ") || "none"}`,
  );
  out("");

  // ---- Build the full ranked set once (engine order), with components -------
  const { surfaced } = await new GraphDirectionProposer(rome).reach(inv);
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(surfaced);
  // engine order = rankScore desc (same as reach() already sorted); attach index
  const ranked = [...surfaced].sort(
    (a, b) => b.rankScore - a.rankScore || a.romeCode.localeCompare(b.romeCode),
  );
  const posOf = new Map<string, number>();
  ranked.forEach((d, i) => posOf.set(d.romeCode, i + 1));

  // full results (with market + displayRank) for the displayed-order questions
  const results = await buildResults(inv);
  const user = userLevel(inv);
  const displayed = [...results.directions].sort(
    (a, b) => b.displayRank - a.displayRank || b.coverage - a.coverage,
  );
  const dispPos = new Map<string, number>();
  displayed.forEach((d, i) => dispPos.set(d.romeCode, i + 1));

  // ---- SECTION 2: coherent merge directions -------------------------------
  out("=".repeat(100));
  out("2. COHERENT MERGE DIRECTIONS  (7 target ROME codes)");
  out("   surfaced? · engine-rank position · matchRaritySum · tier · BOTH seed+cognitive in matched set?");
  out("=".repeat(100));
  out("");
  out("  code   label                          surf  engPos dispPos  matchRaritySum tier   seed×  cog×  BOTH?  inGraph?");
  out("  " + "-".repeat(112));
  const inGraph = new Set(allMetiers.map((m) => m.romeCode));
  for (const t of TARGETS) {
    const d = surfaced.find((x) => x.romeCode === t.code);
    if (!d) {
      out(
        `  ${t.code.padEnd(6)} ${t.label.slice(0, 30).padEnd(30)} NO    ${"—".padStart(6)} ${"—".padStart(7)}  ${"—".padStart(14)} ${"—".padEnd(6)} ${"—".padStart(5)} ${"—".padStart(5)}  ${"—".padEnd(5)}  ${inGraph.has(t.code) ? "yes" : "NOT-IN-GRAPH"}`,
      );
      continue;
    }
    const seedHits = d.matchedCompetenceCodes.filter((c) => seeded.has(c));
    const cogHits = d.matchedCompetenceCodes.filter((c) => cognitive.has(c));
    const both = seedHits.length > 0 && cogHits.length > 0;
    const tier = SIG[signalStrength(d.matchRaritySum)];
    out(
      `  ${t.code.padEnd(6)} ${t.label.slice(0, 30).padEnd(30)} yes   ${String(posOf.get(t.code)).padStart(6)} ${String(dispPos.get(t.code) ?? "—").padStart(7)}  ${d.matchRaritySum.toFixed(1).padStart(14)} ${tier.padEnd(6)} ${String(seedHits.length).padStart(5)} ${String(cogHits.length).padStart(5)}  ${(both ? "BOTH" : seedHits.length ? "seed" : "cog").padEnd(5)}  yes`,
    );
  }
  out("");

  // ---- SECTION 3: Cisailleur vs Cadre de santé component breakdown ---------
  out("=".repeat(100));
  out("3. INVERSION — Cisailleur (H2905) vs Cadre de santé (J1502)");
  out("   full rankScore components (weighted contributions) + displayRank");
  out("=".repeat(100));

  const W = {
    LEAP_TIER: 0.6,
    COVERAGE: 0.8,
    RARITY: 0.7,
    LEAN: 0.5,
    INTEREST: 0.25,
    MOBILITY: 0.08,
  };
  const LEAP_TIER_SCORE: Record<string, number> = {
    direct: 1.0,
    skill_bridge: 0.75,
    mobilite: 0.45,
    interest: 0.25,
  };

  const breakdown = (code: string) => {
    const d = surfaced.find((x) => x.romeCode === code);
    if (!d) {
      out(`  ${code}: NOT SURFACED`);
      return null;
    }
    const leanNorm = d.leanScore / maxLean;
    const interestNorm = d.interestScore / maxInterest;
    const rarityNorm = d.rarityScore / maxRarity;
    const contrib = {
      leapTier: LEAP_TIER_SCORE[d.primaryLeap] * W.LEAP_TIER,
      coverage: d.coverage * W.COVERAGE,
      rarity: rarityNorm * W.RARITY,
      lean: leanNorm * W.LEAN,
      interest: interestNorm * W.INTEREST,
      mobility: d.mobilityScore * W.MOBILITY,
    };
    const rs = rankScore(d, maxLean, maxInterest, maxRarity);
    const rd = results.directions.find((x) => x.romeCode === code);
    const pen = rd ? rd.levelPenalty : levelPenalty({ ...(d as any), market: { offers: [], experienceMix: [], marketDemand: 0, commonTitles: [] } } as any, user);
    const dr = rd ? rd.displayRank : displayRank(rs, pen);
    out("");
    out(`  ${code}  «${d.title}»`);
    out(`    primaryLeap=${d.primaryLeap} · leapTypes=[${d.leapTypes.join(",")}] · engPos=${posOf.get(code)} · dispPos=${dispPos.get(code) ?? "—(gated?)"}`);
    out(`    raw: coverage=${d.coverage.toFixed(4)} (matched ${d.matchedCompetenceCodes.length}/${(inv.competenceCodes ?? []).length}) · rarityScore=${d.rarityScore.toFixed(3)} · matchRaritySum=${d.matchRaritySum.toFixed(1)} · leanScore=${d.leanScore.toFixed(2)} · interestScore=${d.interestScore.toFixed(2)} · mobilityScore=${d.mobilityScore.toFixed(2)}`);
    out(`    norm: leanNorm=${leanNorm.toFixed(3)} interestNorm=${interestNorm.toFixed(3)} rarityNorm=${rarityNorm.toFixed(3)}   (maxLean=${maxLean.toFixed(2)} maxInterest=${maxInterest.toFixed(2)} maxRarity=${maxRarity.toFixed(3)})`);
    out(`    WEIGHTED CONTRIBUTIONS:`);
    out(`       leapTier  ${contrib.leapTier.toFixed(4)}   (${d.primaryLeap} ${LEAP_TIER_SCORE[d.primaryLeap]} × ${W.LEAP_TIER})`);
    out(`       coverage  ${contrib.coverage.toFixed(4)}`);
    out(`       rarity    ${contrib.rarity.toFixed(4)}`);
    out(`       lean      ${contrib.lean.toFixed(4)}`);
    out(`       interest  ${contrib.interest.toFixed(4)}`);
    out(`       mobility  ${contrib.mobility.toFixed(4)}`);
    out(`       ─────────`);
    out(`       rankScore ${rs.toFixed(4)}   levelPenalty=${pen.toFixed(3)}   displayRank=${dr.toFixed(4)}`);
    return { d, contrib, rs, dr, leanNorm, interestNorm, rarityNorm };
  };

  const cis = breakdown("H2905");
  const cad = breakdown("J1502");

  if (cis && cad) {
    out("");
    out("  DELTA (Cisailleur − Cadre de santé), per weighted component:");
    const keys = ["leapTier", "coverage", "rarity", "lean", "interest", "mobility"] as const;
    for (const k of keys) {
      const dlt = (cis.contrib as any)[k] - (cad.contrib as any)[k];
      out(`     ${k.padEnd(9)} ${dlt >= 0 ? "+" : ""}${dlt.toFixed(4)}${Math.abs(dlt) > 0.001 ? (dlt > 0 ? "   ← favours Cisailleur" : "   ← favours Cadre") : ""}`);
    }
    out(`     ${"rankScore".padEnd(9)} ${(cis.rs - cad.rs >= 0 ? "+" : "")}${(cis.rs - cad.rs).toFixed(4)}`);
    out(`     ${"displayRk".padEnd(9)} ${(cis.dr - cad.dr >= 0 ? "+" : "")}${(cis.dr - cad.dr).toFixed(4)}`);
    // biggest single driver
    const drivers = keys
      .map((k) => ({ k, v: (cis.contrib as any)[k] - (cad.contrib as any)[k] }))
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
    out("");
    out(`  → dominant inversion driver: ${drivers[0].k} (${drivers[0].v >= 0 ? "+" : ""}${drivers[0].v.toFixed(4)} toward the higher-ranked one)`);
  }
  out("");

  // ---- SECTION 4: top-20 override rate ------------------------------------
  out("=".repeat(100));
  out("4. TOP-20 OVERRIDE RATE  (displayed order · ZERO overlap with santé seed = pure cognitive-bridge)");
  out("=".repeat(100));
  out("");
  out("  # dispRank  rome   seed× cog×  origin       tier   title");
  out("  " + "-".repeat(96));
  const top20 = displayed.slice(0, 20);
  let overrideCount = 0;
  top20.forEach((d, i) => {
    const seedHits = d.matchedCompetenceCodes.filter((c) => seeded.has(c)).length;
    const cogHits = d.matchedCompetenceCodes.filter((c) => cognitive.has(c)).length;
    const origin = seedHits === 0 ? "COG-ONLY" : cogHits === 0 ? "SEED-ONLY" : "BOTH";
    if (seedHits === 0) overrideCount++;
    const tier = SIG[signalStrength(d.matchRaritySum)];
    out(
      `  ${String(i + 1).padStart(2)} ${d.displayRank.toFixed(3).padStart(7)}  ${d.romeCode.padEnd(6)} ${String(seedHits).padStart(4)} ${String(cogHits).padStart(4)}  ${origin.padEnd(9)}  ${tier.padEnd(6)} ${d.title.slice(0, 44)}`,
    );
  });
  out("");
  out(
    `  → OVERRIDE RATE: ${overrideCount}/20 top displayed directions have ZERO santé-seed overlap (pure cognitive-bridge).`,
  );
  out("");
  out(`(full output written to ${OUT})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
