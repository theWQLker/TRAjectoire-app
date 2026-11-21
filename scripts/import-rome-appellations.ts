/**
 * Import the ROME 4.0 appellations from France Travail open data into
 * rome_appellations, replacing the 34 legacy rows (decision 2026-11-21, item 6).
 *
 * Source: the ROME open-data CSV bundle (Licence Ouverte 2.0), extracted to a
 * folder: https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/csv
 * Needs migration 0010 applied (the script checks and stops if not).
 *
 * Dry run by default: validates the file and the table, prints the plan, writes
 * nothing. With --write (local runs share production's database):
 *   1. backs up every current row to <backup.json>,
 *   2. upserts all appellations on code_ogr (stamped with version + date),
 *   3. deletes rows of any other version, legacy rows included,
 *   4. verifies the row count and logs an ingest_runs row.
 * Writes go through the service role, server-side only.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/import-rome-appellations.ts <romeCsvDir> [--write <backup.json>]
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BATCH = 1000;

function readCsv(file: string): Record<string, string>[] {
  const lines = readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const head = lines[0].slice(1, -1).split('","');
  return lines.slice(1).map((l) => {
    const cells = l.slice(1, -1).split('","');
    if (cells.length !== head.length) throw new Error(`malformed row: ${l.slice(0, 80)}`);
    return Object.fromEntries(head.map((h, i) => [h, cells[i]]));
  });
}

function frToIso(d: string): string {
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) throw new Error(`unreadable publication date: ${d}`);
  return `${m[3]}-${m[2]}-${m[1]}`;
}

async function main() {
  const args = process.argv.slice(2);
  const dir = args[0];
  const wi = args.indexOf("--write");
  const write = wi >= 0;
  const backupFile = write ? args[wi + 1] : undefined;
  if (!dir || (write && !backupFile)) throw new Error("usage: import-rome-appellations.ts <romeCsvDir> [--write <backup.json>]");

  // ---- the file
  const version = readFileSync(path.join(dir, "version.txt"), "utf8");
  const romeVersion = version.match(/Numero de version : (\d+)/)?.[1];
  const pub = version.match(/Date de publication : ([\d/]+)/)?.[1];
  if (!romeVersion || !pub) throw new Error("version.txt: no version number or publication date");
  const publishedOn = frToIso(pub);
  const file = readdirSync(dir).find((f) => f.startsWith("unix_referentiel_appellation_"));
  if (!file) throw new Error(`no unix_referentiel_appellation_* in ${dir}`);
  const rows = readCsv(path.join(dir, file)).map((r) => ({
    code_ogr: r.code_ogr,
    rome_code: r.code_rome,
    label: r.libelle_appellation_long.trim(),
    label_short: r.libelle_appellation_court.trim() || null,
    classification: r.classification || null,
    peu_usite: r.peu_usite === "O",
    rome_version: romeVersion,
    published_on: publishedOn,
  }));

  const problems: string[] = [];
  if (new Set(rows.map((r) => r.code_ogr)).size !== rows.length) problems.push("duplicate code_ogr in the file");
  if (rows.some((r) => !r.code_ogr || !r.rome_code || !r.label)) problems.push("row with an empty code_ogr, code_rome or label");
  const codes = new Set(rows.map((r) => r.rome_code));
  const principal = new Map<string, number>();
  for (const r of rows) if (r.classification === "PRINCIPALE") principal.set(r.rome_code, (principal.get(r.rome_code) ?? 0) + 1);
  const notOne = [...codes].filter((c) => principal.get(c) !== 1);
  if (notOne.length) problems.push(`${notOne.length} ROME codes without exactly one PRINCIPALE (${notOne.slice(0, 5).join(", ")})`);

  // ---- the table
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing (use --env-file=.env.local)");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const probe = await db.from("rome_appellations").select("code_ogr,rome_version,published_on").limit(1);
  const migrated = !probe.error;
  const current = await db.from("rome_appellations").select("*", { count: "exact", head: true });
  if (current.error) throw new Error(`rome_appellations: ${current.error.message}`);
  const known = new Set<string>();
  for (let from = 0; ; from += BATCH) {
    const r = await db.from("rome_jobs").select("rome_code").range(from, from + BATCH - 1);
    if (r.error) throw new Error(`rome_jobs: ${r.error.message}`);
    for (const x of r.data) known.add(x.rome_code);
    if (r.data.length < BATCH) break;
  }
  const orphan = [...codes].filter((c) => !known.has(c));
  if (orphan.length) problems.push(`${orphan.length} ROME codes absent from rome_jobs (${orphan.slice(0, 5).join(", ")}); the foreign key would reject them`);

  console.log(`file        ${file}: ${rows.length} appellations, ${codes.size} ROME codes, version ${romeVersion}, published ${pub}`);
  console.log(`            ${rows.filter((r) => r.classification === "PRINCIPALE").length} PRINCIPALE, ${rows.filter((r) => r.peu_usite).length} peu usité`);
  console.log(`table now   ${current.count} rows; migration 0010 ${migrated ? "applied" : `NOT applied (${probe.error?.message})`}`);
  console.log(`rome_jobs   ${known.size} codes; every file code present: ${orphan.length === 0 ? "yes" : "no"}`);
  for (const p of problems) console.log(`✗ ${p}`);
  if (problems.length) process.exit(1);
  if (!migrated) {
    console.log("\nStop: apply supabase/migrations/0010_rome_appellations_opendata.sql first.");
    process.exit(write ? 1 : 0);
  }
  if (!write) {
    console.log(`\nDry run. With --write: back up ${current.count} rows, upsert ${rows.length}, delete every row not stamped version ${romeVersion}.`);
    return;
  }

  // ---- write
  const started = new Date().toISOString();
  const backup: unknown[] = [];
  for (let from = 0; ; from += BATCH) {
    const r = await db.from("rome_appellations").select("*").order("id").range(from, from + BATCH - 1);
    if (r.error) throw new Error(`backup: ${r.error.message}`);
    backup.push(...r.data);
    if (r.data.length < BATCH) break;
  }
  writeFileSync(backupFile!, JSON.stringify(backup, null, 1));
  console.log(`backed up ${backup.length} rows to ${backupFile}`);

  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await db.from("rome_appellations").upsert(rows.slice(i, i + BATCH), { onConflict: "code_ogr" });
    if (error) throw new Error(`upsert batch ${i / BATCH}: ${error.message}`);
  }
  const stale = await db.from("rome_appellations").delete({ count: "exact" }).or(`rome_version.is.null,rome_version.neq.${romeVersion}`);
  if (stale.error) throw new Error(`delete stale: ${stale.error.message}`);

  const after = await db.from("rome_appellations").select("*", { count: "exact", head: true }).eq("rome_version", romeVersion);
  const total = await db.from("rome_appellations").select("*", { count: "exact", head: true });
  const ok = after.count === rows.length && total.count === rows.length;
  await db.from("ingest_runs").insert({
    source: "rome-appellations",
    scope: { version: romeVersion, published_on: publishedOn, file, removed: stale.count ?? 0 },
    started_at: started,
    finished_at: new Date().toISOString(),
    ok,
    rows_written: rows.length,
    error: ok ? null : `count mismatch: ${total.count} rows, ${after.count} of version ${romeVersion}, expected ${rows.length}`,
  });
  console.log(`upserted ${rows.length}, removed ${stale.count ?? 0} stale rows; table now ${total.count} rows — ${ok ? "✓" : "✗ count mismatch"}`);
  if (!ok) process.exit(1);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
