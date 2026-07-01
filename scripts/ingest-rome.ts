/**
 * One-time ROME referential ingest (PRD §3b / build §11.6). DORMANT — run
 * manually when credentials + Supabase schema exist.
 *
 *   1. Ingest ROME métiers from the Fiches API (1 req/s, ~1911 fiches) →
 *      rome_jobs, rome_competences, rome_job_competences.
 *   2. Load RIASEC from the open-data CSV → rome_riasec (NOT an API call).
 *
 * Resume is ON by default: a re-run skips fiches already fully ingested (those
 * with a competence link), so an interrupted ingest only fetches what's missing.
 * Pass --no-resume to force a full refetch (e.g. on a ROME release).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/ingest-rome.ts [--no-resume] [path/to/referentiel_code_rome_riasec_v4.csv]
 */
import { readFile } from "node:fs/promises";
import { LiveRomeSource } from "../src/lib/rome/live-rome-source";

async function main() {
  const args = process.argv.slice(2);
  const resume = !args.includes("--no-resume");
  const csvPath = args.find((a) => !a.startsWith("--"));
  const src = new LiveRomeSource();

  console.log(
    `Ingesting ROME métiers from Fiches API (1 req/s, ~1911 fiches)… ` +
      `resume=${resume ? "on (skip done fiches)" : "off (full refetch)"}`,
  );
  const r = await src.ingestAll({ resume });
  console.log("Row counts written (ROME referential):");
  console.log(`  fiches in API list         : ${r.metiers}`);
  console.log(`  fiches fetched this run     : ${r.fetched}`);
  console.log(`  fiches skipped (resume)     : ${r.skipped}`);
  console.log(`  rome_competences (distinct) : ${r.competences} (this run's fetched fiches)`);
  console.log(`  rome_job_competences links  : ${r.competenceLinks} (this run)`);
  console.log(`  ingest_runs batch           : ${r.batchId}`);
  console.log("  (mobilités + appellations: not in Fiches API — open-data CSV, deferred)");

  if (csvPath) {
    console.log(`Loading RIASEC CSV: ${csvPath}`);
    const csv = await readFile(csvPath, "utf8");
    const res = await src.loadRiasecCsv(csv);
    console.log("RIASEC load (rome_riasec, major+minor):");
    console.log(`  rome_riasec rows inserted  : ${res.inserted}`);
    console.log(`  métiers covered            : ${res.metiers}`);
    console.log(`  empty minor (1 row only)   : ${res.emptyMinor}`);
    console.log(`  skipped — unknown rome_code: ${res.skippedUnknownRome.length}${res.skippedUnknownRome.length ? " → " + res.skippedUnknownRome.join(", ") : ""}`);
    console.log(`  skipped — invalid letter   : ${res.skippedInvalidLetter.length}${res.skippedInvalidLetter.length ? " → " + res.skippedInvalidLetter.map((s) => `${s.code}:"${s.value}"`).join(", ") : ""}`);
  } else {
    console.log("No RIASEC CSV path given — skipping (pass codification-riasec-des-metiers-rome.csv to load).");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("ROME INGEST FAILED:", err);
  process.exit(1);
});
