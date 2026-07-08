/**
 * Remove pre-CSV seed remnants from rome_mobilites so the table contains EXACTLY
 * the open-data edge-list. rome_mobilites has no batch/source column, so legacy
 * edges are identified by difference: any (from_rome_code, to_rome_code) pair in
 * the table that the CSV does NOT contain is a seed remnant. Deletes those
 * precisely (not a blanket FK delete — every code is a valid job).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/cleanup-mobilites-legacy.ts mobilites-possibles-entre-deux-metiers-rome.csv
 */
import { readFile } from "node:fs/promises";
import { getSupabaseServiceClient } from "../src/lib/supabase";

function unquote(s: string): string {
  return s.trim().replace(/^"(.*)"$/, "$1").trim();
}

async function main() {
  const csvPath = process.argv[2] ?? "mobilites-possibles-entre-deux-metiers-rome.csv";
  const db = getSupabaseServiceClient();

  // 1. Distinct (from,to) pairs the CSV contains.
  const csv = (await readFile(csvPath, "utf8")).split(/\r?\n/).filter((l) => l.trim());
  const csvKeys = new Set<string>();
  for (let i = 1; i < csv.length; i++) {
    const c = csv[i].split(",").map(unquote);
    if (c[0] && c[1] && c[0] !== c[1]) csvKeys.add(`${c[0]}|${c[1]}`);
  }
  console.log(`CSV distinct edges: ${csvKeys.size}`);

  // 2. Pull every rome_mobilites edge.
  const all: { from_rome_code: string; to_rome_code: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("rome_mobilites")
      .select("from_rome_code, to_rome_code")
      .range(from, from + 999);
    if (error) throw new Error(`rome_mobilites scan failed: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as typeof all));
    if (data.length < 1000) break;
  }
  console.log(`rome_mobilites edges before: ${all.length}`);

  // 3. Legacy = present in DB, not in the CSV.
  const legacy = all.filter((r) => !csvKeys.has(`${r.from_rome_code}|${r.to_rome_code}`));
  console.log(`legacy edges to delete: ${legacy.length}`);
  if (legacy.length === 0) {
    console.log("Nothing to clean. Done.");
    return;
  }
  console.log("  " + legacy.map((r) => `${r.from_rome_code}->${r.to_rome_code}`).join(", "));

  // 4. Delete each exact pair.
  let deleted = 0;
  for (const r of legacy) {
    const { error } = await db
      .from("rome_mobilites")
      .delete()
      .eq("from_rome_code", r.from_rome_code)
      .eq("to_rome_code", r.to_rome_code);
    if (error) throw new Error(`delete failed (${r.from_rome_code}->${r.to_rome_code}): ${error.message}`);
    deleted++;
  }
  console.log(`deleted: ${deleted}`);

  // 5. Confirm final count equals the CSV's distinct-edge count.
  const { count, error } = await db
    .from("rome_mobilites")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`final count failed: ${error.message}`);
  const ok = count === csvKeys.size;
  console.log(`rome_mobilites edges after: ${count} (expected ${csvKeys.size}) ${ok ? "✓" : "✗ MISMATCH"}`);
  if (!ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error("CLEANUP FAILED:", err);
  process.exit(1);
});
