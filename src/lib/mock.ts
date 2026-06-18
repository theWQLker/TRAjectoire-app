/**
 * Trajectoire UI mock layer (v1 — no live fetch).
 *
 * Typed to mirror the future France Travail integration so the live source can
 * drop in without touching screens. Field names follow the existing
 * `Offer` shape (src/lib/offers/offer.ts, which already mirrors the France
 * Travail Offres API v2) and the engine's signal vocabulary
 * (src/lib/engine/coverage.ts → strong/partial/exploratory).
 *
 * Locked product rules encoded here (DESIGN_SPEC.md):
 *  - Output unit is Signal fort / moyen / faible. NO percentages anywhere in
 *    the UI. The engine has a numeric `coverage`; the UI only ever shows the
 *    tier. This file exposes the tier, never the number.
 *  - Every market claim is backed by dated ads (receipts): each ad carries
 *    `datePubliee` and `verifieLe`.
 */

// ── Signal (the only "strength" unit the UI shows) ────────────────────────────
// Mirrors CoverageStrength in src/lib/engine/coverage.ts (strong/partial/exploratory).
export type Signal = "fort" | "moyen" | "faible";

export const SIGNAL_LABEL: Record<Signal, string> = {
  fort: "Signal fort",
  moyen: "Signal moyen",
  faible: "Signal faible",
};

// ── Buckets (mirror config/buckets.ts Category) ──────────────────────────────
export type Bucket = "apply_now" | "bridge" | "long_term" | "not_now";

export const BUCKET_LABEL: Record<Bucket, string> = {
  apply_now: "À tester maintenant",
  bridge: "Pont court",
  long_term: "Long terme",
  not_now: "Pas maintenant",
};

// ── Live-data stat panel (landing) ───────────────────────────────────────────
// Future: hydrated from a France Travail counts endpoint. Each stat is a value
// the UI renders verbatim — no derived percentages-as-scores.
export type LiveStat = {
  /** machine key, stable across renders */
  id: string;
  /** the figure as displayed, already formatted FR */
  value: string;
  /** what it counts */
  label: string;
};

export const LIVE_STATS: LiveStat[] = [
  { id: "offres", value: "812 000+", label: "offres analysées" },
  { id: "metiers", value: "250+", label: "métiers couverts (ROME)" },
  { id: "fraicheur", value: "95 %", label: "données vérifiées récemment" },
];

/** Last time the market snapshot was refreshed (receipts honesty). */
export const LIVE_DATA_REFRESHED = "12 juin 2026";

// ── Receipt ads (back every market claim) ────────────────────────────────────
// Extends the live Offer shape with the two dates the UI must always show.
// Dead-link safe: `cachedUrl` is the snapshot; `sourceUrl` may rot.
export type ReceiptAd = {
  id: string;
  intitule: string;
  romeCode: string;
  typeContrat: string; // CDI, CDD, MIS…
  lieu: string;
  /** date publiée (France Travail dateCreation) */
  datePubliee: string;
  /** "vérifiée le" — when we last confirmed the snapshot was live */
  verifieLe: string;
  competences: string[];
  /** why this ad counts toward the signal */
  pourquoi: string;
  cachedUrl: string;
  sourceUrl: string;
};

// ── Landing trust cards + two doors (static copy, kept here so screens stay dumb)
export type TrustCard = {
  id: string;
  title: string;
  body: string;
  /** lucide icon name, resolved by the component */
  icon: "FileText" | "TrendingUp" | "DoorOpen";
};

export const TRUST_CARDS: TrustCard[] = [
  {
    id: "preuves",
    title: "Vos preuves",
    body: "Ce que vous avez réellement fait — pas ce que vous aimeriez être. On part de l'expérience concrète.",
    icon: "FileText",
  },
  {
    id: "marche",
    title: "Le marché",
    body: "Les offres réelles, datées et vérifiées. Chaque signal s'appuie sur des annonces que vous pouvez ouvrir.",
    icon: "TrendingUp",
  },
  {
    id: "issues",
    title: "Les issues",
    body: "Salarié ou autonomie, à tester maintenant ou plus tard. Des directions, jamais un verdict.",
    icon: "DoorOpen",
  },
];

export type EntryDoor = {
  id: "domaine" | "experiences";
  title: string;
  body: string;
  microcopy: string;
  href: string;
};

export const ENTRY_DOORS: EntryDoor[] = [
  {
    id: "domaine",
    title: "J'ai déjà un domaine en tête",
    body: "Vous savez vers quoi vous penchez. On confronte cette envie au marché et à vos preuves.",
    microcopy: "Modifiable à tout moment.",
    href: "/domaines",
  },
  {
    id: "experiences",
    title: "J'ai plusieurs expériences, mais pas de direction claire",
    body: "Vous avez fait beaucoup de choses. On part de vos preuves pour faire émerger des directions.",
    microcopy: "Modifiable à tout moment.",
    href: "/quiz",
  },
];

/** The line that must appear on landing + results (DESIGN_SPEC locked decision). */
export const NOT_A_VERDICT =
  "Ce n'est pas un verdict. Vous gardez la décision.";
