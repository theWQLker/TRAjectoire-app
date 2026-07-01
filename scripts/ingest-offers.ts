/**
 * Offers ingest (PRD §3 / §6.4 / build §11.6). DORMANT — run manually / on a
 * schedule once credentials + Supabase schema exist. APPENDS offers_cache rows
 * and inserts an offer_counts snapshot for each (ROME, département), throttled by
 * the offres limiter (10 req/s), slicing under the 1,150 cap, honoring 429
 * Retry-After. Each pull opens an ingest_runs row; rows carry its batch_id.
 *
 * FIRST INGEST IS SCOPED to Île-de-France (75/92/93/94) — do NOT pull all of
 * France yet (per build prompt). Pass explicit départements to override.
 *
 * Usage:
 *   # default IDF scope (75 92 93 94):
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/ingest-offers.ts <ROME...>
 *   # explicit départements:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/ingest-offers.ts --depts=75,92 <ROME...>
 */
import { LiveOfferSource } from "../src/lib/offers/live-offer-source";

// First-ingest scope: Île-de-France core départements (build prompt).
const DEFAULT_DEPTS = ["75", "92", "93", "94"];

async function main() {
  const args = process.argv.slice(2);
  const deptArg = args.find((a) => a.startsWith("--depts="));
  const depts = deptArg
    ? deptArg.slice("--depts=".length).split(",").map((d) => d.trim()).filter(Boolean)
    : DEFAULT_DEPTS;
  const romes = args.filter((a) => !a.startsWith("--"));

  if (romes.length === 0) {
    throw new Error(
      "Usage: ingest-offers.ts [--depts=75,92,93,94] <ROME...>\n" +
        "       (départements default to the IDF scope 75/92/93/94)",
    );
  }

  const src = new LiveOfferSource();
  let totalCached = 0;
  let snapshots = 0;

  console.log(`Offers ingest — départements: ${depts.join("/")} · ROME: ${romes.join(" ")}`);
  for (const dept of depts) {
    for (const rome of romes) {
      const { batchId, cached, total } = await src.ingest(rome, dept);
      totalCached += cached;
      snapshots += 1;
      console.log(
        `  ${rome} dépt ${dept}: cached=${cached} total(Content-Range)=${total} batch=${batchId}`,
      );
    }
  }

  console.log("\nRow counts written this run:");
  console.log(`  offers_cache rows appended : ${totalCached}`);
  console.log(`  offer_counts snapshots     : ${snapshots}`);
  console.log(`  ingest_runs rows           : ${snapshots} (one per ROME×dépt)`);
  console.log("Done.");
}

main().catch((err) => {
  console.error("OFFERS INGEST FAILED:", err);
  process.exit(1);
});
