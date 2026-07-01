/**
 * Inspect the ingested rome_competences vocabulary (data-curation pass for
 * filling empty clusters). Prints total row count + a sample, then writes the
 * full code/libellé/type list to fixtures/rome-competences-dump.json for the
 * matching pass. Read-only.
 *
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/query-rome-competences.ts
 */
import { writeFile } from "node:fs/promises";
import { getSupabaseServiceClient } from "../src/lib/supabase";

async function main() {
  const db = getSupabaseServiceClient();

  const { count, error: cErr } = await db
    .from("rome_competences")
    .select("*", { count: "exact", head: true });
  if (cErr) throw new Error(`count failed: ${cErr.message}`);
  console.log(`rome_competences row count: ${count ?? 0}`);

  if (!count) {
    console.log(
      "\n⚠ rome_competences is EMPTY. The ROME ingest has not been run against " +
        "this database (scripts/ingest-rome.ts). Cannot curate clusters from a " +
        "vocabulary that does not exist — STOP.",
    );
    return;
  }

  // Pull the full vocabulary (paged — Supabase caps at 1000 rows/request).
  const all: { code: string; libelle: string; type: string | null }[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("rome_competences")
      .select("code, libelle, type")
      .order("code")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`page ${from} failed: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as typeof all));
    if (data.length < pageSize) break;
  }

  console.log(`Pulled ${all.length} competence rows.`);
  console.log("\nSample (first 20):");
  for (const r of all.slice(0, 20)) {
    console.log(`  ${r.code}  [${r.type ?? "?"}]  ${r.libelle}`);
  }

  await writeFile(
    "fixtures/rome-competences-dump.json",
    JSON.stringify(all, null, 2),
    "utf8",
  );
  console.log("\nFull dump → fixtures/rome-competences-dump.json");
}

main().catch((err) => {
  console.error("QUERY FAILED:", err);
  process.exit(1);
});
