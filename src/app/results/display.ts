import { cache } from "react";
import { buildResults, P2_INVENTORY, type ResultDirection, type Results } from "@/lib/engine/results";
import type { Inventory } from "@/lib/engine/inventory";
import { getSessionStore } from "@/lib/quiz/session-store";
import type { Answers } from "@/lib/quiz/build-inventory";
import { computeDirections, type Directions } from "@/lib/engine/directions";
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
 * The "non vérifié" group (decision 2026-11-20): directions with no ad where a
 * chosen zone has no offer data. Not a bucket — buckets rest on offer evidence —
 * but listed, counted and paged the same way, after the buckets.
 */
export const UNVERIFIED = "non-verifie";
export type Group = Category | typeof UNVERIFIED;
export const UNVERIFIED_LABEL = "Non vérifié";
export const UNVERIFIED_HINT =
  "Ces pistes partagent des compétences avec vos réponses, mais nous n'avons pas de données d'annonces pour tout ou partie de votre zone. Classées par proximité de compétences, sans vérification par le marché.";

export function isGroup(v: string): v is Group {
  return v === UNVERIFIED || isCategory(v);
}

/** The directions of one group, in display order. */
export function groupDirections(results: Results, g: Group): ResultDirection[] {
  return g === UNVERIFIED ? sortForDisplay(results.unverified) : orderBucket(g, results.byCategory[g]);
}

/** A direction of this result set, verified or not. */
export function findDirection(results: Results, romeCode: string): ResultDirection | undefined {
  return (
    results.directions.find((d) => d.romeCode === romeCode) ??
    results.unverified.find((d) => d.romeCode === romeCode)
  );
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
 * "Pas maintenant". Each other non-empty group ("non vérifié" included) gets its
 * strongest direction;
 * the remaining slots go to the strongest left, by the page's existing display
 * order (coherenceRank, wildcard pinned). They are then shown inside their own
 * bucket and tier, in semantic order.
 */
export function firstViewCodes(
  directions: ResultDirection[],
  unverified: ResultDirection[] = [],
): Set<string> {
  const groupOf = (d: ResultDirection): Group => (d.marketUnverified ? UNVERIFIED : d.bucketResult.category);
  const ordered = sortForDisplay([
    ...directions.filter((d) => !FIRST_VIEW_EXCLUDED.includes(d.bucketResult.category)),
    ...unverified,
  ]);
  const picked = new Set<string>();
  // Every non-empty group gets its strongest direction, "non vérifié" included.
  for (const g of [...BUCKET_ORDER, UNVERIFIED] as Group[]) {
    const top = ordered.find((d) => groupOf(d) === g);
    if (top) picked.add(top.romeCode);
  }
  for (const d of ordered) {
    if (picked.size >= FIRST_VIEW_SIZE) break;
    picked.add(d.romeCode);
  }
  return picked;
}

// ---------------------------------------------------------------------------
// One computation per session (P0-A follow-up). /results, the direction page
// and the list pages all need the same result set; each used to recompute it
// (100-150 ms of CPU), which queued under load. A session's inventory never
// changes, so the result set is kept per process, keyed by the resolved
// session ("" = the demo profile, so unknown ids can't fill the cache).
// TTL matches the offers snapshot; LRU-bounded; concurrent requests share one
// in-flight computation; a failed computation is not kept.
// ---------------------------------------------------------------------------
const RESULTS_TTL_MS = 10 * 60_000;
// Measured ~3.8 MB per result set (live graph, tech-seed scale): 50 ≈ 190 MB
// on top of the ~80 MB graph + offers snapshot.
const RESULTS_MAX_ENTRIES = 50;
type LoadedResults = {
  results: Results;
  fromQuiz: boolean;
  /** The answers behind the result set ({} for the demo profile). */
  answers: Answers;
  /**
   * The directions layer for the same result set, computed once per session on
   * first use (it adds the seed-only counterfactual run) and kept with it.
   */
  directions: () => Promise<Directions>;
};
type Entry = { at: number; value: Promise<Results>; directions?: Promise<Directions> };
const resultsCache = new Map<string, Entry>();

function cachedEntry(key: string, inventory: Inventory): Entry {
  const hit = resultsCache.get(key);
  if (hit && Date.now() - hit.at < RESULTS_TTL_MS) {
    resultsCache.delete(key); // refresh LRU position
    resultsCache.set(key, hit);
    return hit;
  }
  const entry: Entry = { at: Date.now(), value: buildResults(inventory) };
  resultsCache.set(key, entry);
  entry.value.catch(() => {
    if (resultsCache.get(key) === entry) resultsCache.delete(key);
  });
  while (resultsCache.size > RESULTS_MAX_ENTRIES) {
    resultsCache.delete(resultsCache.keys().next().value as string);
  }
  return entry;
}

function directionsOf(entry: Entry, key: string, answers: Answers): () => Promise<Directions> {
  return () => {
    if (!entry.directions) {
      const value = entry.value.then((r) => computeDirections(r, answers));
      entry.directions = value;
      // A failed computation is not kept: the next request retries.
      value.catch(() => {
        if (entry.directions === value) entry.directions = undefined;
      });
    }
    return entry.directions;
  };
}

/**
 * Session → inventory → results (+ directions on demand). React cache dedupes
 * within a request (header status + body); the entry is reused across requests.
 */
export const loadResults = cache(async (sessionId: string | undefined): Promise<LoadedResults> => {
  if (sessionId) {
    const session = await getSessionStore().get(sessionId);
    if (session) {
      const entry = cachedEntry(sessionId, session.inventory);
      return {
        results: await entry.value,
        fromQuiz: true,
        answers: session.answers,
        directions: directionsOf(entry, sessionId, session.answers),
      };
    }
  }
  const entry = cachedEntry("", P2_INVENTORY);
  return { results: await entry.value, fromQuiz: false, answers: {}, directions: directionsOf(entry, "", {}) };
});

/** Detail-route href, preserving the session so the detail page re-derives it. */
export function directionHref(romeCode: string, sessionId: string | undefined): string {
  return sessionId
    ? `/results/direction/${romeCode}?session=${sessionId}`
    : `/results/direction/${romeCode}`;
}

/** The ads behind a direction, for the same session (so the same départements). */
export function offersHref(romeCode: string, sessionId: string | undefined): string {
  return sessionId
    ? `/results/offers/${romeCode}?session=${sessionId}`
    : `/results/offers/${romeCode}`;
}

/** The held-back list, same session. */
export function suppressedHref(sessionId: string | undefined): string {
  return sessionId ? `/results/pistes/ecartees?session=${sessionId}` : "/results/pistes/ecartees";
}

/**
 * Wording for the held-back directions: they share at least one skill but under
 * 40 % of the profile, and 0 ads were collected for them. Only ever applies when
 * every chosen zone has offer data; otherwise those directions are "non vérifié"
 * and shown (decision 2026-11-20).
 */
export function suppressedLabel(n: number): string {
  const s = n === 1 ? "" : "s";
  return `${n} piste${s} plus large${s}, sans annonce dans notre relevé`;
}

/** On-demand list href for one bucket. */
export function bucketHref(cat: Group, sessionId: string | undefined, page = 1): string {
  const params = new URLSearchParams();
  if (sessionId) params.set("session", sessionId);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/results/pistes/${cat}${qs ? `?${qs}` : ""}`;
}
