/**
 * Bounded one-time offer ingest (issue ③). NOT a freshness pipeline — a snapshot.
 *
 *   1. List every ROME code from the live ROME graph (rome_jobs).
 *   2. Cheap count-only probe per ROME for dept 75 (range 0-0 → Content-Range
 *      total) to rank by national/dept offer volume. ~1911 calls @ 10 req/s.
 *   3. Ingest offers (bodies + offer_counts snapshot) for the TOP N codes with
 *      demand > 0, dept 75 only, via LiveOfferSource.ingest (respects the 1150
 *      cap, 10 req/s, 429 Retry-After, append-only + batch_id).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/ingest-offers-bounded.ts [topN=150] [dept=75]
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { LiveOfferSource } from "../src/lib/offers/live-offer-source";

async function allRomeCodes(): Promise<string[]> {
  const db = getSupabaseServiceClient();
  const codes: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("rome_jobs")
      .select("rome_code")
      .range(from, from + 999);
    if (error) throw new Error(`rome_jobs read failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data) codes.push(r.rome_code as string);
    if (data.length < 1000) break;
  }
  return codes;
}

async function main() {
  const topN = Number(process.argv[2] ?? "150");
  const dept = process.argv[3] ?? "75";
  const src = new LiveOfferSource();

  const codes = await allRomeCodes();
  console.log(`Probing ${codes.length} ROME codes for dept ${dept} demand (count-only, 10 req/s)…`);

  // --- pass 1: rank by volume via cheap count-only probes (range 0-0) --------
  const volumes: { rome: string; total: number }[] = [];
  let done = 0;
  for (const rome of codes) {
    let total = 0;
    try {
      total = (await src.fetchSlice(rome, dept, "0-0")).totalAvailable;
    } catch (e) {
      console.error(`  probe failed ${rome}: ${e instanceof Error ? e.message : e}`);
    }
    volumes.push({ rome, total });
    if (++done % 200 === 0) console.log(`  probed ${done}/${codes.length}`);
  }

  const ranked = volumes.filter((v) => v.total > 0).sort((a, b) => b.total - a.total);
  const top = ranked.slice(0, topN);
  console.log(`\n${ranked.length} ROME codes have demand in dept ${dept}. Ingesting top ${top.length}.`);
  console.log("Top 10 by volume:", top.slice(0, 10).map((v) => `${v.rome}:${v.total}`).join(", "));

  // --- pass 2: ingest bodies + counts for the top N -------------------------
  let cachedTotal = 0;
  done = 0;
  for (const { rome } of top) {
    try {
      const { cached, total } = await src.ingest(rome, dept);
      cachedTotal += cached;
      if (++done % 25 === 0) console.log(`  ingested ${done}/${top.length} (last ${rome}: ${cached} bodies / ${total} total)`);
    } catch (e) {
      console.error(`  ingest failed ${rome}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`\nDone. Ingested ${cachedTotal} offer bodies across ${top.length} ROME codes (dept ${dept}).`);
}

main().catch((e) => {
  console.error("BOUNDED INGEST FAILED:", e);
  process.exit(1);
});
