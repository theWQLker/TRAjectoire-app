/**
 * Presentation constants for the Trajectoire visual layer (DESIGN_SPEC_LIGHT.md).
 *
 * NOT mock data — the results screen reads the REAL engine output. This file
 * only holds:
 *  - the engine→signal mapping (coverageStrength → fort/moyen/faible),
 *  - French labels for signals + buckets,
 *  - static landing copy (no invented stats).
 */
import type { CoverageStrength } from "./engine/coverage";
import type { Category } from "../../config/buckets";

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
