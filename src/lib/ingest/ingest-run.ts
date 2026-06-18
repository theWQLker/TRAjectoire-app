import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * ingest_runs audit helper (SCHEMA.md Zone 3). Every live ingest opens a run row
 * BEFORE writing data and closes it after, so a half-failed pull (rate limit,
 * partial fiche set) is attributable: which run, what scope, what broke.
 *
 * The run's id is the `batch_id` stamped on every offers_cache / offer_counts
 * row that pull produces (SCHEMA.md: "Each offers_cache batch references its run
 * via batch_id"). Server/Node-only.
 */

export type IngestSource = "offres" | "rome";

export type IngestRun = {
  /** the run id — use as batch_id on rows this run writes */
  id: string;
  finish(result: { ok: boolean; rowsWritten?: number; error?: string }): Promise<void>;
};

/**
 * Open an ingest_runs row and return its id (the batch_id) plus a finish()
 * to stamp the outcome. `scope` records what the run covers, e.g.
 * { romeCode, departement } for offres or { metiers: 532 } for rome.
 */
export async function startIngestRun(
  source: IngestSource,
  scope: Record<string, unknown>,
): Promise<IngestRun> {
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("ingest_runs")
    .insert({ source, scope })
    .select("id")
    .single();
  if (error) throw new Error(`ingest_runs insert failed: ${error.message}`);
  const id = data.id as string;

  return {
    id,
    async finish({ ok, rowsWritten, error: errMsg }) {
      const { error: upErr } = await db
        .from("ingest_runs")
        .update({
          finished_at: new Date().toISOString(),
          ok,
          rows_written: rowsWritten ?? null,
          error: errMsg ?? null,
        })
        .eq("id", id);
      if (upErr) {
        // Don't mask the original failure; the run row just stays open.
        console.error(`ingest_runs finish failed for ${id}: ${upErr.message}`);
      }
    },
  };
}
