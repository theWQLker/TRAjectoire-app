/**
 * Load the mobilité edge-list CSV into rome_mobilites. CSV ONLY — the Fiches API
 * carries no metiersProches (PRD §3b/§12). Two-pass FK-safe, skips self-edges +
 * unknown codes, stores Proche/Evolution as mobility_type.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/load-mobilites.ts mobilites-possibles-entre-deux-metiers-rome.csv
 */
import { readFile } from "node:fs/promises";
import { LiveRomeSource } from "../src/lib/rome/live-rome-source";

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) throw new Error("Usage: load-mobilites.ts <path/to/mobilites.csv>");

  const csv = await readFile(csvPath, "utf8");
  const res = await new LiveRomeSource().loadMobilitesCsv(csv);

  console.log(`Mobilités load from ${csvPath}:`);
  console.log(`  rome_mobilites edges inserted: ${res.inserted}`);
  console.log(`  by type                      : ${JSON.stringify(res.byType)}`);
  console.log(`  skipped — self-edge          : ${res.skippedSelfEdge}`);
  console.log(`  skipped — unknown rome_code  : ${res.skippedUnknownCode}`);
}

main().catch((err) => {
  console.error("MOBILITÉS LOAD FAILED:", err);
  process.exit(1);
});
