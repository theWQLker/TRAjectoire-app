/**
 * REPLAY STORED SESSION — reproduce the /results page code path EXACTLY.
 * page.tsx: session = getSessionStore().get(id); inventory = session.inventory;
 * results = buildResults(inventory). No regeneration from answers. This is the
 * ONE faithful replay of what production rendered.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/replay-stored-session.ts <sessionId>
 */
import { getSessionStore } from "../src/lib/quiz/session-store";
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
  const id = process.argv[2];
  const session = await getSessionStore().get(id);
  if (!session) { console.log(`SESSION ${id} NOT FOUND`); process.exit(1); }

  const inv = session.inventory;
  console.log(`=== STORED SESSION ${id} ===`);
  console.log(`store=${getSessionStore().constructor.name}`);
  console.log(`stored inventory: seededCodes=${inv.seededCodes?.length ?? 0} · competenceCodes=${inv.competenceCodes.length} · riasec=[${inv.riasec.join(",")}] · clusters=${Object.keys(inv.clusterScores ?? {}).length}`);
  console.log(`seed answer: ${(session.answers as Record<string,string>).seed_families}`);

  // EXACT page path.
  const res = await buildResults(inv);
  console.log(`\nbucket counts: apply_now=${res.byCategory.apply_now.length} bridge=${res.byCategory.bridge.length} long_term=${res.byCategory.long_term.length} not_now=${res.byCategory.not_now.length} · suppressed=${res.suppressed.length}`);

  for (const cat of ["apply_now", "bridge", "long_term", "not_now"] as Category[]) {
    const sorted = sortForDisplay(res.byCategory[cat]);
    if (sorted.length === 0) { console.log(`\n=== ${cat.toUpperCase()} (0) ===`); continue; }
    console.log(`\n=== ${cat.toUpperCase()} (${sorted.length}) — page order, cap ${CAP[cat]} ===`);
    sorted.slice(0, CAP[cat] + 3).forEach((d, i) => {
      const vis = i < CAP[cat] ? " " : "·";
      const tag = isTech(d.romeCode) ? " ◄TECH" : "";
      console.log(`  ${vis}${String(i + 1).padStart(2)}. ${d.romeCode} ${d.title.slice(0, 42).padEnd(42)} partage ${d.matchedCompetenceCodes.length} · cohRank ${d.coherenceRank.toFixed(3)} · gates ${d.bucketResult.unmetGates.length} · demand ${d.market.marketDemand}${tag}`);
    });
  }

  console.log(`\n=== SUPPRESSED (${res.suppressed.length}) ===`);
  res.suppressed.slice(0, 12).forEach((s) => console.log(`  ${s.romeCode} ${s.title}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
