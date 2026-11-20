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
import { buildResults } from "../src/lib/engine/results";
import { BUCKET_ORDER, FIRST_VIEW_SIZE, firstViewCodes, orderBucket, sortForDisplay } from "../src/app/results/display";

const isTech = (c: string) => c.startsWith("M18");
// Rows printed per bucket beyond its first-view cards, for context.
const EXTRA = 3;

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

  // Same selection and order as /results (src/app/results/display.ts): the
  // first view holds FIRST_VIEW_SIZE cards, none from not_now, at least one per
  // other non-empty bucket. "*" = a first-view card, "·" = behind the bucket link.
  const shown = firstViewCodes(res.directions, res.unverified);
  console.log(`first view: ${shown.size} of ${FIRST_VIEW_SIZE} cards (* = on /results, · = behind "Voir les N autres pistes")`);
  for (const cat of BUCKET_ORDER) {
    const sorted = orderBucket(cat, res.byCategory[cat]);
    if (sorted.length === 0) { console.log(`\n=== ${cat.toUpperCase()} (0) ===`); continue; }
    const inView = sorted.filter((d) => shown.has(d.romeCode)).length;
    console.log(`\n=== ${cat.toUpperCase()} (${sorted.length}) — page order, ${inView} in the first view ===`);
    sorted.slice(0, inView + EXTRA).forEach((d, i) => {
      const vis = shown.has(d.romeCode) ? "*" : "·";
      const tag = isTech(d.romeCode) ? " ◄TECH" : "";
      console.log(`  ${vis}${String(i + 1).padStart(2)}. ${d.romeCode} ${d.title.slice(0, 42).padEnd(42)} partage ${d.matchedCompetenceCodes.length} · cohRank ${d.coherenceRank.toFixed(3)} · gates ${d.bucketResult.unmetGates.length} · demand ${d.market.marketDemand}${tag}`);
    });
  }

  // "Non vérifié": a chosen zone has no offer data; shown, by skill fit.
  if (res.unverified.length > 0) {
    const un = sortForDisplay(res.unverified);
    const inView = un.filter((d) => shown.has(d.romeCode)).length;
    console.log(`\n=== NON VÉRIFIÉ (${un.length}) — skill-fit order, ${inView} in the first view ===`);
    un.slice(0, inView + EXTRA).forEach((d, i) => {
      const vis = shown.has(d.romeCode) ? "*" : "·";
      console.log(`  ${vis}${String(i + 1).padStart(2)}. ${d.romeCode} ${d.title.slice(0, 42).padEnd(42)} partage ${d.matchedCompetenceCodes.length} · rank ${d.displayRank.toFixed(3)}`);
    });
  }

  console.log(`\n=== SUPPRESSED (${res.suppressed.length}) ===`);
  res.suppressed.slice(0, 12).forEach((s) => console.log(`  ${s.romeCode} ${s.title}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
