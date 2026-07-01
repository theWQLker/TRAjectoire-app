import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client (PRD §9). The fixture-mode engine and smoke test do NOT touch
 * Supabase — the OfferSource seam (PRD §3) is the only data path the engine reads.
 * This client exists for the DB-backed work in later build steps (sessions,
 * recommendations, offers_cache). Constructed lazily so missing env in fixture
 * mode is not a hard failure.
 */
let browserClient: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing env var ${name}. Set it in .env.local (see .env.local.example).`,
    );
  }
  return value;
}

/** Anon client for client/server components that read with RLS. */
export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
  return browserClient;
}

/** Service-role client for ingestion/server actions that bypass RLS. Server-only. */
export function getSupabaseServiceClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
