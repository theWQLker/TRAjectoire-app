import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client (PRD §9). The fixture-mode engine and smoke test do NOT touch
 * Supabase — the OfferSource seam (PRD §3) is the only data path the engine reads.
 * This client exists for the DB-backed work in later build steps (sessions,
 * recommendations, offers_cache). Constructed lazily so missing env in fixture
 * mode is not a hard failure.
 *
 * DATABASE TARGET GUARD (2026-11-22). Local runs and tests use the dev database,
 * a local Supabase stack (DEV_DB.md). A hosted project is reachable only from:
 *   - a Vercel deployment (VERCEL set, VERCEL_ENV not "development"), or
 *   - a deliberate production operation that opts in with TRAJECTOIRE_REMOTE_DB=allow.
 * Anything else pointing at a non-local URL is refused before a request is sent,
 * so production keys pasted back into .env.local (or a `vercel env pull` of the
 * development env) can't quietly put test sessions in production.
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

/** The opt-in value for TRAJECTOIRE_REMOTE_DB. */
export const REMOTE_DB_ALLOW = "allow";

export function isLocalDbUrl(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]" || host === "::1";
}

/** Throws unless this process may talk to the database at `url`. See the guard above. */
export function assertDbTargetAllowed(url: string, env: Record<string, string | undefined> = process.env): void {
  if (isLocalDbUrl(url)) return;
  if (env.VERCEL && env.VERCEL_ENV !== "development") return;
  if (env.TRAJECTOIRE_REMOTE_DB === REMOTE_DB_ALLOW) return;
  let host = "?";
  try {
    host = new URL(url).host;
  } catch {
    /* keep "?" */
  }
  throw new Error(
    `Refusing to connect to ${host}: local runs use the dev database (a local Supabase stack, see DEV_DB.md). ` +
      `For a deliberate production operation, run with TRAJECTOIRE_REMOTE_DB=${REMOTE_DB_ALLOW} and the production env file.`,
  );
}

function dbUrl(): string {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  assertDbTargetAllowed(url);
  return url;
}

/** Anon client for client/server components that read with RLS. */
export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createClient(
    dbUrl(),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
  return browserClient;
}

/** Service-role client for ingestion/server actions that bypass RLS. Server-only. */
export function getSupabaseServiceClient(): SupabaseClient {
  return createClient(
    dbUrl(),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
