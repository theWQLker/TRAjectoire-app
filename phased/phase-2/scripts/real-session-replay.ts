/**
 * REAL SESSION REPLAY (measure only). Replays the ACTUAL submitted quiz session
 * (id 576b285f…, seed=tech:code,tech:sysadmin,tech:support, cognitive answers as
 * captured) through the live engine and reports the true visible order — no
 * synthetic reconstruction. Answers the three diagnostic questions against the
 * REAL profile:
 *   Q1 seed carrying? (seededCodes count)
 *   Q2 why admin, not tech/industrie? (top results + the shared codes + idf; where tech lands)
 *   Q3 seed vs quiz? (does level-demote fire? did the quiz pull toward admin, or is it noise?)
 *
 * Reads the answers from a JSON file passed as argv[2] (the raw `answers` object
 * from the quiz_sessions row).
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/real-session-replay.ts <answers.json>
 */
import { readFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { getRomeSource, rarityOf, type CompetenceRarity } from "../src/lib/rome";

const isTech = (c: string) => c.startsWith("M18");
const ADMIN = new Set(["D1408", "M1607", "M1203", "M1606", "M1608", "M1609", "M1601", "M1602", "M1605", "C1201", "C1401"]);
const isAdmin = (c: string) => ADMIN.has(c);

function drivers(d: ResultDirection, rarity: CompetenceRarity, n: number) {
  return d.matchedCompetenceCodes
    .map((c) => ({ c, idf: rarityOf(rarity, c, n) }))
    .sort((a, b) => b.idf - a.idf);
}

async function main() {
  const answers: Answers = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const rome = getRomeSource();
  const rarity = await rome.competenceRarity();
  const n = (await rome.allMetiers()).length;

  const inv = buildInventory(answers);
  const res = await buildResults(inv);
  const ranked = [...res.directions].sort(
    (a, b) => b.coherenceRank - a.coherenceRank || a.romeCode.localeCompare(b.romeCode),
  );
  const rankOf = (code: string) => {
    const i = ranked.findIndex((d) => d.romeCode === code);
    return i === -1 ? null : i + 1;
  };

  console.log(`ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE} · graph N=${n}`);
  console.log("\n=== Q1: SEED CARRYING? ===");
  console.log(`  seed token: ${answers.seed_families}`);
  console.log(`  seededCodes=${inv.seededCodes?.length ?? 0} · total competenceCodes=${inv.competenceCodes.length}`);
  console.log(`  riasec=[${inv.riasec.join(",")}] · clusters=${Object.keys(inv.clusterScores).length} · surfaced=${res.directions.length}`);
  const levelFiring = res.directions.filter((d) => d.levelPenalty > 0);
  console.log(`  diploma=${inv.constraints.diploma} → level-demote firing on ${levelFiring.length}/${res.directions.length} directions`);

  console.log("\n=== Q2: TOP 20 VISIBLE ORDER (coherenceRank) ===");
  ranked.slice(0, 20).forEach((d, i) => {
    const tag = isTech(d.romeCode) ? " ◄TECH" : isAdmin(d.romeCode) ? " ◄ADMIN" : "";
    const drv = drivers(d, rarity, n);
    const drvStr = drv.slice(0, 4).map((x) => `${x.c}[${x.idf.toFixed(1)}]`).join(" ");
    console.log(
      `  ${String(i + 1).padStart(2)}. ${d.romeCode} ${d.title.slice(0, 42).padEnd(42)} ` +
        `${d.matchedCompetenceCodes.length}c cov${(d.coverage * 100).toFixed(0)}% idf${d.rarityScore.toFixed(2)} lean${String(d.leanScore).padStart(3)} lvl${d.levelPenalty.toFixed(2)} ${d.primaryLeap}${tag}`,
    );
    console.log(`        shared: ${drvStr}`);
  });

  console.log("\n=== Q2: named ADMIN directions (rank · shared codes + idf) ===");
  for (const code of ["D1408", "M1607", "M1203", "M1601", "C1201", "M1605"]) {
    const d = res.directions.find((x) => x.romeCode === code);
    if (!d) { console.log(`  ${code}: not surfaced`); continue; }
    const drv = drivers(d, rarity, n);
    console.log(
      `  ${code} ${d.title.slice(0, 30).padEnd(30)} #${rankOf(code)} · ${d.matchedCompetenceCodes.length} shared · lean ${d.leanScore} · lvl ${d.levelPenalty.toFixed(2)}`,
    );
    console.log(`        ${drv.map((x) => `${x.c}[${x.idf.toFixed(2)}]`).join(", ")}`);
  }

  console.log("\n=== Q2: where do M18xx TECH directions land ===");
  const techRanks = res.directions
    .filter((d) => isTech(d.romeCode))
    .map((d) => ({ code: d.romeCode, title: d.title, r: rankOf(d.romeCode)! }))
    .sort((a, b) => a.r - b.r);
  const bestTech = techRanks[0];
  const techTop15 = techRanks.filter((t) => t.r <= 15).length;
  const techTop30 = techRanks.filter((t) => t.r <= 30).length;
  console.log(`  best-tech: ${bestTech.code} ${bestTech.title.slice(0, 40)} #${bestTech.r}`);
  console.log(`  tech in top-15: ${techTop15} · top-30: ${techTop30} · total tech surfaced: ${techRanks.length}`);
  console.log(`  top 8 tech by rank:`);
  techRanks.slice(0, 8).forEach((t) => console.log(`    #${t.r} ${t.code} ${t.title.slice(0, 46)}`));

  console.log("\n=== Q3: SEED vs QUIZ — what the quiz lean did ===");
  // clusterScores sorted desc: what the cognitive answers actually emphasised.
  const cs = Object.entries(inv.clusterScores).sort((a, b) => b[1] - a[1]);
  console.log(`  top cluster leans: ${cs.slice(0, 12).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  console.log(`  riasecScores: ${Object.entries(inv.riasecScores).map(([k, v]) => `${k}:${v}`).join(" ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
