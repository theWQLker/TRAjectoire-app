import { cache } from "react";
import { buildResults, P2_INVENTORY, type ResultDirection } from "@/lib/engine/results";
import { getSessionStore } from "@/lib/quiz/session-store";
import { strengthBand, type StrengthBand } from "@/lib/engine/coverage";
import { type Category } from "../../../config/buckets";

/**
 * Display helpers shared by /results (first view) and /results/pistes/[bucket]
 * (everything else, on demand). Display order only: nothing here changes the
 * engine's ranks, buckets or tiers.
 */

/** Semantic order of the buckets on the page. */
export const BUCKET_ORDER: Category[] = ["apply_now", "bridge", "long_term", "not_now"];

/** Strength tiers inside the bridge bucket, strongest first. */
export const BAND_ORDER: StrengthBand[] = ["tres_forte", "forte", "pertinente", "large"];

/** Directions in the first HTML of /results. Everything else is one link away. */
export const FIRST_VIEW_SIZE = 10;

/** Directions per page on the on-demand list. */
export const PAGE_SIZE = 20;

export function isCategory(v: string): v is Category {
  return (BUCKET_ORDER as string[]).includes(v);
}

/**
 * Visible-order sort (spec 2026-07-23): the wildcard (if present) is pinned
 * first; everything else by coherenceRank desc, coverage tiebreak.
 */
export function sortForDisplay(group: ResultDirection[]): ResultDirection[] {
  return [...group].sort(
    (a, b) =>
      Number(b.isWildcard ?? false) - Number(a.isWildcard ?? false) ||
      b.coherenceRank - a.coherenceRank ||
      b.coverage - a.coverage,
  );
}

/**
 * Full display order inside one bucket. The bridge bucket reads by strength
 * tier (strongest first), display-sorted within each tier; the others are
 * display-sorted as a whole. Same order the page has always used.
 */
export function orderBucket(cat: Category, group: ResultDirection[]): ResultDirection[] {
  if (cat !== "bridge") return sortForDisplay(group);
  return BAND_ORDER.flatMap((band) =>
    sortForDisplay(group.filter((d) => strengthBand(d.matchRaritySum) === band)),
  );
}

/** Per-tier counts for the bridge bucket, in tier order, empty tiers dropped. */
export function bandCounts(group: ResultDirection[]): { band: StrengthBand; count: number }[] {
  return BAND_ORDER.map((band) => ({
    band,
    count: group.filter((d) => strengthBand(d.matchRaritySum) === band).length,
  })).filter((b) => b.count > 0);
}

/** Buckets that never take a first-view slot (still counted and linked). */
const FIRST_VIEW_EXCLUDED: Category[] = ["not_now"];

/**
 * The first view (decision 2026-11-20): FIRST_VIEW_SIZE directions, never from
 * "Pas maintenant". Each other non-empty bucket gets its strongest direction;
 * the remaining slots go to the strongest left, by the page's existing display
 * order (coherenceRank, wildcard pinned). They are then shown inside their own
 * bucket and tier, in semantic order.
 */
export function firstViewCodes(directions: ResultDirection[]): Set<string> {
  const ordered = sortForDisplay(
    directions.filter((d) => !FIRST_VIEW_EXCLUDED.includes(d.bucketResult.category)),
  );
  const picked = new Set<string>();
  for (const cat of BUCKET_ORDER) {
    const top = ordered.find((d) => d.bucketResult.category === cat);
    if (top) picked.add(top.romeCode);
  }
  for (const d of ordered) {
    if (picked.size >= FIRST_VIEW_SIZE) break;
    picked.add(d.romeCode);
  }
  return picked;
}

/**
 * Session → inventory → results, once per request (React cache dedupes the
 * header status and the body, which both need it).
 */
export const loadResults = cache(async (sessionId: string | undefined) => {
  let inventory = P2_INVENTORY;
  let fromQuiz = false;
  if (sessionId) {
    const session = await getSessionStore().get(sessionId);
    if (session) {
      inventory = session.inventory;
      fromQuiz = true;
    }
  }
  const results = await buildResults(inventory);
  return { results, fromQuiz };
});

/** Detail-route href, preserving the session so the detail page re-derives it. */
export function directionHref(romeCode: string, sessionId: string | undefined): string {
  return sessionId
    ? `/results/direction/${romeCode}?session=${sessionId}`
    : `/results/direction/${romeCode}`;
}

/** On-demand list href for one bucket. */
export function bucketHref(cat: Category, sessionId: string | undefined, page = 1): string {
  const params = new URLSearchParams();
  if (sessionId) params.set("session", sessionId);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/results/pistes/${cat}${qs ? `?${qs}` : ""}`;
}
