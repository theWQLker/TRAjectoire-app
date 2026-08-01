/**
 * REAL SESSION — PAGE VIEW replay (measure only). Reproduces exactly what the
 * /results page renders for the submitted session: buckets (apply_now / bridge /
 * long_term / not_now), each sorted by the page's sortForDisplay (wildcard pinned,
 * then coherenceRank desc, coverage tiebreak), capped as the page caps. This is
 * the view the USER saw — not the global coherenceRank order.
 *
 * Compares against the screenshot: bridge bucket topped by D1408 / M1810 / M1607.
 * Reports where every M18xx tech direction is BUCKETED (why the seed's dev/analyst
 * jobs are absent from the visible bridge list).
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/real-session-page-view.ts <answers.json>
 */
import { readFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import type { Category } from "../config/buckets";

const isTech = (c: string) => c.startsWith("M18");
const CAP: Record<Category, number> = { apply_now: 6, bridge: 5, long_term: 4, not_now: 3 };

function sortForDisplay(group: ResultDirection[]): ResultDirection[] {
  return [...group].sort(
    (a, b) =>
      Number(b.isWildcard ?? false) - Number(a.isWildcard ?? false) ||
      b.coherenceRank - a.coherenceRank ||
      b.coverage - a.coverage,
  );
}

async function main() {
  const answers: Answers = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const inv = buildInventory(answers);
  const res = await buildResults(inv);

  console.log(`ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE}`);
  console.log(`seed=${answers.seed_families}`);
  console.log(`bucket counts: apply_now=${res.byCategory.apply_now.length} bridge=${res.byCategory.bridge.length} long_term=${res.byCategory.long_term.length} not_now=${res.byCategory.not_now.length} · suppressed=${res.suppressed.length}`);

  for (const cat of ["apply_now", "bridge", "long_term", "not_now"] as Category[]) {
    const sorted = sortForDisplay(res.byCategory[cat]);
    console.log(`\n=== ${cat.toUpperCase()} (${sorted.length}) — page order, cap ${CAP[cat]} ===`);
    sorted.slice(0, CAP[cat] + 3).forEach((d, i) => {
      const visible = i < CAP[cat] ? " " : "·"; // · = behind "voir les autres pistes"
      const tag = isTech(d.romeCode) ? " ◄TECH" : "";
      console.log(
        `  ${visible}${String(i + 1).padStart(2)}. ${d.romeCode} ${d.title.slice(0, 40).padEnd(40)} ` +
          `partage ${d.matchedCompetenceCodes.length} · cohRank ${d.coherenceRank.toFixed(3)} · gates ${d.bucketResult.unmetGates.length}${tag}`,
      );
    });
  }

  // Where is every tech direction bucketed?
  console.log("\n=== TECH (M18xx) — bucket + page-rank within bucket ===");
  const catOf = new Map<string, { cat: Category; rankInCat: number }>();
  for (const cat of ["apply_now", "bridge", "long_term", "not_now"] as Category[]) {
    sortForDisplay(res.byCategory[cat]).forEach((d, i) => catOf.set(d.romeCode, { cat, rankInCat: i + 1 }));
  }
  const tech = res.directions.filter((d) => isTech(d.romeCode));
  const byCat: Record<string, number> = {};
  for (const d of tech) {
    const info = catOf.get(d.romeCode);
    if (info) byCat[info.cat] = (byCat[info.cat] ?? 0) + 1;
  }
  console.log(`  tech bucket distribution: ${Object.entries(byCat).map(([c, n]) => `${c}:${n}`).join(" ")}`);
  // the strongest tech jobs by coherenceRank and where they landed
  const topTech = [...tech].sort((a, b) => b.coherenceRank - a.coherenceRank).slice(0, 10);
  console.log("  top-10 tech by coherenceRank → bucket:");
  for (const d of topTech) {
    const info = catOf.get(d.romeCode)!;
    console.log(`    ${d.romeCode} ${d.title.slice(0, 42).padEnd(42)} → ${info.cat} #${info.rankInCat} · partage ${d.matchedCompetenceCodes.length} · gates ${d.bucketResult.unmetGates.length} · demand ${d.market.marketDemand}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
