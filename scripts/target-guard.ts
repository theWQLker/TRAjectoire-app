/**
 * Which site a script may hit. Scripts default to the local build; any other
 * host (production, a preview, anything remote) is refused unless the run
 * passes --allow-production explicitly. A smoke test aimed at production by a
 * forgotten env var once ran against the live site; this makes that a choice.
 *
 * Note: this guards the SITE a script talks to, not the database. Local runs
 * and production share one Supabase project, so a local session write lands in
 * the production database either way (see DEPLOY.md).
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
export const ALLOW_PRODUCTION_FLAG = "--allow-production";

export function resolveTarget(raw: string | undefined, fallback = "http://localhost:3100"): string {
  const base = (raw && raw.trim() ? raw.trim() : fallback).replace(/\/$/, "");
  let host: string;
  try {
    host = new URL(base).hostname;
  } catch {
    console.error(`Not a URL: ${base}`);
    process.exit(1);
  }
  if (!LOCAL_HOSTS.has(host) && !process.argv.includes(ALLOW_PRODUCTION_FLAG)) {
    console.error(
      `Refusing to run against ${base}: not a local URL.\n` +
        `Re-run with ${ALLOW_PRODUCTION_FLAG} if you mean to hit that site.`,
    );
    process.exit(1);
  }
  return base;
}
