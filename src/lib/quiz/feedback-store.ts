import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * Feedback persistence (V1: capture + store). Same server-side, service-role
 * pattern as session-store.ts — every table is deny-by-default RLS and the
 * service-role key bypasses it. No anon write path.
 *
 *   - SupabaseFeedbackStore — inserts the real `feedback` row (session_id FK →
 *     quiz_sessions, answers jsonb) when Supabase env is configured.
 *   - MemoryFeedbackStore   — process-memory fallback so the app runs fixture-only
 *     before a Supabase project exists. Same return contract.
 *
 * Selected automatically by whether Supabase (url + service-role key) is set.
 */

/** The A1-A4 / B1-B6 questionnaire answers. Free-form so the questionnaire can
 *  evolve without a schema migration (stored as jsonb). */
export type FeedbackAnswers = Record<string, string | number | boolean | null>;

export interface FeedbackStore {
  /** Insert feedback for a session. Returns the new row id. */
  create(input: { sessionId: string; answers: FeedbackAnswers }): Promise<{ id: string }>;
}

// --- in-memory fallback ----------------------------------------------------
const memory: Array<{ id: string; sessionId: string; answers: FeedbackAnswers }> = [];

class MemoryFeedbackStore implements FeedbackStore {
  async create(input: { sessionId: string; answers: FeedbackAnswers }): Promise<{ id: string }> {
    const id = crypto.randomUUID();
    memory.push({ id, sessionId: input.sessionId, answers: input.answers });
    return { id };
  }
}

// --- Supabase-backed (service-role, bypasses RLS) --------------------------
class SupabaseFeedbackStore implements FeedbackStore {
  async create(input: { sessionId: string; answers: FeedbackAnswers }): Promise<{ id: string }> {
    const db = getSupabaseServiceClient();
    const { data, error } = await db
      .from("feedback")
      .insert({ session_id: input.sessionId, answers: input.answers })
      .select("id")
      .single();
    if (error) throw new Error(`feedback insert failed: ${error.message}`);
    return { id: data.id as string };
  }
}

let store: FeedbackStore | null = null;

export function getFeedbackStore(): FeedbackStore {
  if (store) return store;
  const supabaseReady =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  store = supabaseReady ? new SupabaseFeedbackStore() : new MemoryFeedbackStore();
  return store;
}
