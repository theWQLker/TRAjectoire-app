/**
 * Presentation constants for the Trajectoire visual layer (DESIGN_SPEC_LIGHT.md).
 *
 * NOT mock data — the results screen reads the REAL engine output. This file
 * only holds:
 *  - the engine→signal mapping (coverageStrength → fort/moyen/faible),
 *  - French labels for signals + buckets,
 *  - static landing copy (no invented stats).
 */
import type { CoverageStrength, StrengthBand } from "./engine/coverage";
import type { Category } from "../../config/buckets";
import { CATEGORIES } from "../../config/quiz";
import type { OfferCoverage } from "./offers";
import { OFFER_MODIFICATIONS } from "./offers/offer";

// ── Signal: the only "strength" unit the UI shows ────────────────────────────
// strong → fort, partial → moyen, exploratory → faible (LIGHT spec, locked).
export type Signal = "fort" | "moyen" | "faible";

export function signalFromCoverage(s: CoverageStrength): Signal {
  return s === "strong" ? "fort" : s === "partial" ? "moyen" : "faible";
}

// strong → "Piste solide", partial → "Piste à explorer". The exploratory tier
// (faible) shows NO badge — the SignalBadge renders null for it, so it needs no
// label here (kept as "" for the exhaustive Record type; never rendered).
export const SIGNAL_LABEL: Record<Signal, string> = {
  fort: "Piste solide",
  moyen: "Piste à explorer",
  faible: "",
};

// ── Strength-band labels (French) — the bridge-bucket presentation tiers ─────
// Each label is a STRENGTH claim backed by strengthBand()'s matchRaritySum
// thresholds — never a count. "Très forte" = the FORT band (same strength as a
// "Piste solide" badge); the two MOYEN halves get distinct honest wording; the
// faible tail is the honest broad set behind the "explorer tout" expander.
export const STRENGTH_BAND_LABEL: Record<StrengthBand, string> = {
  tres_forte: "Très forte correspondance",
  forte: "Correspondance forte",
  pertinente: "Correspondance pertinente",
  large: "Autres passerelles à explorer",
};

export const STRENGTH_BAND_HINT: Record<StrengthBand, string> = {
  tres_forte: "Ces métiers réutilisent le cœur distinctif de votre profil.",
  forte: "Un recoupement solide sur plusieurs de vos compétences distinctives.",
  pertinente: "Un recoupement réel, plus ciblé — quelques compétences en commun.",
  large:
    "Le champ complet des passerelles crédibles — plus large, rien de caché ni de coupé.",
};

// ── Bucket labels (French) — map config/buckets Category → display ───────────
export const BUCKET_LABEL: Record<Category, string> = {
  apply_now: "Accessible maintenant",
  bridge: "À portée — quelques mois",
  long_term: "Plus long terme",
  not_now: "Pas maintenant",
};

export const BUCKET_HINT: Record<Category, string> = {
  apply_now: "Vos preuves suffisent, des offres existent, les portes sont ouvertes.",
  bridge: "Proche — une ou deux compétences à ajouter sur 3 à 6 mois.",
  long_term: "Ça vous correspond, mais demande du temps, un diplôme ou de l'ancienneté.",
  not_now: "Bloqué par une contrainte ou un marché trop fin.",
};

// ── The line that must appear on landing + results (locked) ──────────────────
export const NOT_A_VERDICT = "Ce n'est pas un verdict. Vous gardez la décision.";

// ── What the offer data covers (P0-C) ─────────────────────────────────────────
// Every claim about the market states its real scope and date. Both come from
// the offers themselves (OfferSource.coverage()), never from a constant that an
// ingest can silently make wrong.

// Département names from the quiz's own options ("75 — Paris" → "Paris (75)").
const DEPT_LABEL: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    for (const qp of cat.quickPicks) {
      if (qp.id !== "c_departement") continue;
      for (const o of qp.options) {
        const m = o.label.match(/^(\w+)\s+—\s+(.+)$/);
        out[o.value] = m ? `${m[2]} (${m[1]})` : o.label;
      }
    }
  }
  out.france = "la France entière";
  return out;
})();

/** "Paris (75)", "la France entière", or "le département 13" for one not in the quiz. */
export function deptName(code: string): string {
  return DEPT_LABEL[code] ?? `le département ${code}`;
}

function joinFr(xs: string[]): string {
  return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`;
}

/** Calm French date: "30 juin 2026". */
export function frDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

function collected(c: OfferCoverage[number]): string {
  if (!c.fetchedFrom || !c.fetchedTo) return "annonces de démonstration";
  const from = frDate(c.fetchedFrom);
  const to = frDate(c.fetchedTo);
  return from === to ? `relevées le ${from}` : `relevées entre le ${from} et le ${to}`;
}

/**
 * The scope line shown wherever offer figures appear:
 * "Annonces France Travail : Paris (75), relevées le 30 juin 2026. Certaines
 * ont pu être pourvues depuis."
 */
export function marketScopeLine(coverage: OfferCoverage): string {
  if (coverage.length === 0) return "Aucune annonce en mémoire pour le moment.";
  const parts = coverage.map((c) => `${deptName(c.departement)}, ${collected(c)}`);
  return `Annonces France Travail : ${parts.join(" ; ")}. Certaines ont pu être pourvues depuis. Modification : ${OFFER_MODIFICATIONS}.`;
}

/** The chosen zones the offers don't cover. */
export function uncoveredDepts(selected: string[], coverage: OfferCoverage): string[] {
  const covered = new Set(coverage.map((c) => c.departement));
  return selected.filter((d) => !covered.has(d));
}

/**
 * Plain disclosure when the user chose zones we have no offers for; null when
 * every chosen zone is covered.
 */
export function coverageDisclosure(selected: string[], coverage: OfferCoverage): string | null {
  const missing = uncoveredDepts(selected, coverage);
  if (missing.length === 0) return null;
  const names = joinFr(missing.map(deptName));
  if (missing.length === selected.length) {
    return `Nous n'avons pas encore d'annonces pour ${names}. Sans annonces, nous ne pouvons pas vérifier quels métiers y recrutent.`;
  }
  const have = joinFr(selected.filter((d) => !missing.includes(d)).map(deptName));
  return `Nous n'avons pas encore d'annonces pour ${names} : les chiffres d'annonces ne concernent que ${have}.`;
}
