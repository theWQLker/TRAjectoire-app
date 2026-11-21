import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * ROME appellations — the job titles France Travail lists for each ROME code
 * (open data, Licence Ouverte 2.0, loaded by scripts/import-rome-appellations.ts).
 * These are the copyable titles of a direction: never ad titles.
 *
 * Main title (PRINCIPALE) first, then the rest alphabetically; titles flagged
 * "peu usité" are dropped. Server-side only (service role).
 *
 * Any screen that shows them carries romeCredit(publishedOn) (src/lib/ui.ts).
 */
export type RomeTitles = {
  /** ROME code → titles, best first, at most `perCode`. */
  titles: Map<string, string[]>;
  /** Publication date (ISO) of the ROME version the titles come from. */
  publishedOn: string | null;
};

export async function romeTitles(romeCodes: string[], perCode = 4): Promise<RomeTitles> {
  const titles = new Map<string, string[]>();
  if (romeCodes.length === 0) return { titles, publishedOn: null };
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("rome_appellations")
    .select("rome_code,label,label_short,classification,published_on")
    .in("rome_code", romeCodes)
    .eq("peu_usite", false);
  if (error) throw new Error(`rome_appellations: ${error.message}`);
  type Row = { rome_code: string; label: string; label_short: string | null; classification: string | null; published_on: string | null };
  const rows = (data ?? []) as Row[];
  const byCode = new Map<string, Row[]>();
  for (const r of rows) byCode.set(r.rome_code, [...(byCode.get(r.rome_code) ?? []), r]);
  for (const [code, list] of byCode) {
    titles.set(
      code,
      list
        .sort(
          (a, b) =>
            Number(b.classification === "PRINCIPALE") - Number(a.classification === "PRINCIPALE") ||
            (a.label_short ?? a.label).localeCompare(b.label_short ?? b.label, "fr"),
        )
        .slice(0, perCode)
        .map((r) => r.label_short ?? r.label),
    );
  }
  const dates = rows.map((r) => r.published_on).filter((d): d is string => !!d).sort();
  return { titles, publishedOn: dates.at(-1) ?? null };
}
