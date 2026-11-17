import { LiveRomeSource } from "@/lib/rome/live-rome-source";

/**
 * Daily rolling ROME check (vercel.json cron). Each run re-checks ~64 fiches
 * against the France Travail ROME API, so the full referential (~1911) is
 * re-checked about once a month; new and retired codes are caught every day.
 * See LiveRomeSource.checkSlice.
 *
 * Also keeps the free Supabase project awake: every run writes an ingest_runs
 * row, even when the API call fails.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Fails closed if
 * CRON_SECRET is unset. Reading request headers keeps the handler dynamic.
 */
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 240s budget for fiche fetches, leaving headroom under maxDuration.
    const r = await new LiveRomeSource().checkSlice({ batch: 64, deadlineMs: 240_000 });
    console.log(
      `[rome-check] listed=${r.listed} checked=${r.checked} added=${r.added.length} ` +
        `retired=${r.retired.length} revived=${r.revived.length} changed=${r.changed.length} failures=${r.failures.length}`,
    );
    return Response.json({ ok: r.failures.length === 0, ...r });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[rome-check] failed: ${message}`);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
