/**
 * Load just the RIASEC CSV into rome_riasec (major + minor rows). Separate from
 * the ROME fiche ingest so it can run on its own. CSV ONLY (PRD §3b/§12).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/load-riasec.ts codification-riasec-des-metiers-rome.csv
 */
import { readFile } from "node:fs/promises";
import { LiveRomeSource } from "../src/lib/rome/live-rome-source";

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) throw new Error("Usage: load-riasec.ts <path/to/riasec.csv>");

  const csv = await readFile(csvPath, "utf8");
  const res = await new LiveRomeSource().loadRiasecCsv(csv);

  console.log(`RIASEC load from ${csvPath}:`);
  console.log(`  rome_riasec rows inserted  : ${res.inserted}`);
  console.log(`  métiers covered            : ${res.metiers}`);
  console.log(`  empty minor (1 row only)   : ${res.emptyMinor}`);
  console.log(
    `  skipped — unknown rome_code: ${res.skippedUnknownRome.length}` +
      (res.skippedUnknownRome.length ? ` → ${res.skippedUnknownRome.join(", ")}` : ""),
  );
  console.log(
    `  skipped — invalid letter   : ${res.skippedInvalidLetter.length}` +
      (res.skippedInvalidLetter.length
        ? ` → ${res.skippedInvalidLetter.map((s) => `${s.code}:"${s.value}"`).join(", ")}`
        : ""),
  );
}

main().catch((err) => {
  console.error("RIASEC LOAD FAILED:", err);
  process.exit(1);
});
