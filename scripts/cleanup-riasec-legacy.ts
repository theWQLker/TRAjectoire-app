/**
 * Remove pre-CSV seed remnants from rome_riasec so the table contains EXACTLY
 * the codification CSV's data. rome_riasec has no batch/source column, so legacy
 * rows are identified by difference: any (rome_code, riasec_code, rank) row in
 * the table that the CSV load does NOT produce is a seed remnant. Deletes those
 * precisely (not a blanket FK delete — every code is a valid job).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/cleanup-riasec-legacy.ts codification-riasec-des-metiers-rome.csv
 */
import { readFile } from "node:fs/promises";
import { getSupabaseServiceClient } from "../src/lib/supabase";

function unquote(s: string): string {
  return s.trim().replace(/^"(.*)"$/, "$1").trim();
}

async function main() {
  const csvPath = process.argv[2] ?? "codification-riasec-des-metiers-rome.csv";
  const db = getSupabaseServiceClient();

  // 1. Rebuild the exact key set the CSV load produces.
  const csv = (await readFile(csvPath, "utf8")).split(/\r?\n/).filter((l) => l.trim());
  const csvKeys = new Set<string>();
  for (let i = 1; i < csv.length; i++) {
    const c = csv[i].split(",").map(unquote);
    if (!c[0]) continue;
    if (c[1]) csvKeys.add(`${c[0]}|${c[1]}|major`);
    if (c[2]) csvKeys.add(`${c[0]}|${c[2]}|minor`);
  }
  console.log(`CSV-derived keys: ${csvKeys.size}`);

  // 2. Pull every rome_riasec row.
  const all: { rome_code: string; riasec_code: string; rank: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("rome_riasec")
      .select("rome_code, riasec_code, rank")
      .range(from, from + 999);
    if (error) throw new Error(`rome_riasec scan failed: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as typeof all));
    if (data.length < 1000) break;
  }
  console.log(`rome_riasec rows before: ${all.length}`);

  // 3. Legacy = present in DB, not produced by the CSV.
  const legacy = all.filter((r) => !csvKeys.has(`${r.rome_code}|${r.riasec_code}|${r.rank}`));
  console.log(`legacy rows to delete: ${legacy.length}`);
  if (legacy.length === 0) {
    console.log("Nothing to clean. Done.");
    return;
  }
  console.log("  " + legacy.map((r) => `${r.rome_code}/${r.riasec_code}/${r.rank}`).join(", "));

  // 4. Delete each exact tuple (composite-keyed; no provenance column to filter on).
  let deleted = 0;
  for (const r of legacy) {
    const { error } = await db
      .from("rome_riasec")
      .delete()
      .eq("rome_code", r.rome_code)
      .eq("riasec_code", r.riasec_code)
      .eq("rank", r.rank);
    if (error) throw new Error(`delete failed (${r.rome_code}/${r.riasec_code}/${r.rank}): ${error.message}`);
    deleted++;
  }
  console.log(`deleted: ${deleted}`);

  // 5. Confirm final count.
  const { count, error } = await db
    .from("rome_riasec")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`final count failed: ${error.message}`);
  const ok = count === csvKeys.size;
  console.log(`rome_riasec rows after: ${count} (expected ${csvKeys.size}) ${ok ? "✓" : "✗ MISMATCH"}`);
  if (!ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error("CLEANUP FAILED:", err);
  process.exit(1);
});
