/**
 * The data-source flags, read strictly (decision 2026-11-21): ROME_SOURCE and
 * OFFER_SOURCE must each be set to "live" or "fixture". Unset, empty or any
 * other value throws. Fixtures only when explicitly set: the old default to
 * "fixture" once ran production on the bundled test set without a sound.
 *
 * Also called from next.config.ts during a Vercel build (VERCEL=1), so a
 * deployment in any Vercel environment with a missing flag fails to build.
 * No imports: next.config.ts loads this file directly.
 */
export type DataSourceFlag = "ROME_SOURCE" | "OFFER_SOURCE";
export type DataSourceMode = "live" | "fixture";

export function dataSourceMode(flag: DataSourceFlag, env: Record<string, string | undefined> = process.env): DataSourceMode {
  const raw = (env[flag] ?? "").trim().toLowerCase();
  if (raw === "live" || raw === "fixture") return raw;
  throw new Error(
    raw
      ? `${flag}=${raw} is not a data source. Set it to "live" (or "fixture" for a test run).`
      : `${flag} is not set. Set it to "live" (or "fixture" for a test run); there is no default.`,
  );
}
