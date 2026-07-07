import type { Inventory } from "@/lib/engine/inventory";
import type { Answers } from "./build-inventory";
import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * Session persistence (PRD §10 quiz_sessions). Same seam pattern as
 * OfferSource / RomeSource: one interface, two implementations, env-switched.
 *
 *   - SupabaseSessionStore — writes the real quiz_sessions row when Supabase
 *     env is configured (shape, answers jsonb, inventory jsonb, constraints jsonb).
 *   - MemorySessionStore   — process-memory fallback so the app runs fixture-only
 *     before a Supabase project exists. Same return contract.
 *
 * Selected automatically by whether NEXT_PUBLIC_SUPABASE_URL is set.
 */

export type QuizSession = {
  id: string;
  answers: Answers;
  inventory: Inventory;
  constraints: Inventory["constraints"];
};

export interface SessionStore {
  create(input: Omit<QuizSession, "id">): Promise<QuizSession>;
  get(id: string): Promise<QuizSession | null>;
}

// --- in-memory fallback ----------------------------------------------------
const memory = new Map<string, QuizSession>();

class MemorySessionStore implements SessionStore {
  async create(input: Omit<QuizSession, "id">): Promise<QuizSession> {
    // crypto.randomUUID is available in Node 24 / edge / browser.
    const id = crypto.randomUUID();
    const session: QuizSession = { id, ...input };
    memory.set(id, session);
    return session;
  }
  async get(id: string): Promise<QuizSession | null> {
    return memory.get(id) ?? null;
  }
}

// --- Supabase-backed -------------------------------------------------------
class SupabaseSessionStore implements SessionStore {
  async create(input: Omit<QuizSession, "id">): Promise<QuizSession> {
    const db = getSupabaseServiceClient();
    const { data, error } = await db
      .from("quiz_sessions")
      .insert({
        answers: input.answers,
        inventory: input.inventory,
        constraints: input.constraints,
        // Cat-5 premium-hook inputs also land in their dedicated column.
        // Consumed by NOTHING in the MVP (Phase-2 paid model reads them).
        financial_inputs: input.inventory.financial_inputs ?? {},
      })
      .select("id")
      .single();
    if (error) throw new Error(`quiz_sessions insert failed: ${error.message}`);
    return { id: data.id as string, ...input };
  }

  async get(id: string): Promise<QuizSession | null> {
    const db = getSupabaseServiceClient();
    const { data, error } = await db
      .from("quiz_sessions")
      .select("id, answers, inventory, constraints")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`quiz_sessions read failed: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id as string,
      answers: (data.answers ?? {}) as Answers,
      inventory: data.inventory as Inventory,
      constraints: data.constraints as Inventory["constraints"],
    };
  }
}

let store: SessionStore | null = null;

/**
 * Resolve the active session store. Use Supabase only when BOTH the URL and the
 * service-role key (which create/get need) are present; otherwise fall back to
 * in-memory so a half-configured env (e.g. anon key only) still runs.
 */
export function getSessionStore(): SessionStore {
  if (store) return store;
  const supabaseReady =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  store = supabaseReady
    ? new SupabaseSessionStore()
    : new MemorySessionStore();
  return store;
}
