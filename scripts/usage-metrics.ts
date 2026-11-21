/**
 * USAGE METRICS — quiz sessions and feedback, test sessions excluded.
 * Reads the real_quiz_sessions / real_feedback views (migration 0009), never
 * the base tables, so a session marked is_test (scripts/test-sessions.ts)
 * never counts. Read-only.
 *
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/usage-metrics.ts [--since=2026-11-01]
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";

const since = process.argv.find((a) => a.startsWith("--since="))?.split("=")[1];

async function count(view: "real_quiz_sessions" | "real_feedback"): Promise<number> {
  let q = getSupabaseServiceClient().from(view).select("id", { count: "exact", head: true });
  if (since) q = q.gte("created_at", since);
  // A HEAD on a missing view answers 404 with no body, and no error object.
  const { count: n, error, status } = await q;
  if (error || status >= 400 || n == null) {
    throw new Error(`${view}: ${error?.message ?? `HTTP ${status}`} (is migration 0009 applied?)`);
  }
  return n ?? 0;
}

async function main() {
  const [sessions, feedback] = await Promise.all([count("real_quiz_sessions"), count("real_feedback")]);
  console.log(`Real usage${since ? ` since ${since}` : ""} (test sessions excluded)`);
  console.log(`  quiz sessions: ${sessions}`);
  console.log(`  feedback:      ${feedback}${sessions ? ` (${((feedback / sessions) * 100).toFixed(1)}% of sessions)` : ""}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
