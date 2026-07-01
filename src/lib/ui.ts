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

export const SIGNAL_LABEL: Record<Signal, string> = {
  fort: "Signal fort",
  moyen: "Signal moyen",
  faible: "Signal faible",
};

// ── Bucket labels (French) — map config/buckets Category → display ───────────
export const BUCKET_LABEL: Record<Category, string> = {
  apply_now: "À tester maintenant",
  bridge: "Pont court",
  long_term: "Long terme",
  not_now: "Pas maintenant",
};

export const BUCKET_HINT: Record<Category, string> = {
  apply_now: "Vos preuves suffisent, des offres existent, les portes sont ouvertes.",
  bridge: "Proche — une ou deux compétences à ajouter sur 3 à 6 mois.",
  long_term: "Ça vous correspond, mais demande du temps, un diplôme ou de l'ancienneté.",
  not_now: "Bloqué par une exigence ou une demande trop fine — un signal, jamais un verdict.",
};

// ── The line that must appear on landing + results (locked) ──────────────────
export const NOT_A_VERDICT = "Ce n'est pas un verdict. Vous gardez la décision.";
