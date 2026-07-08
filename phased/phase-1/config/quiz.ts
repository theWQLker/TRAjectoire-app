/**
 * Phase 1 quiz stub. Phase 1 is the full engine MINUS the cognitive quiz, so
 * there are NO cognitive scenes — the seed front door (+ département + diploma)
 * is the only input. Kept: the Lean vocabulary and the two constraint
 * quick-picks the engine still consumes (c_departement for the market seam,
 * c_diploma for level-demote). The full build-inventory.ts copies AS-IS against
 * this stub, so the stub must export every symbol it imports — including EMPTY
 * TENSION_MAP / FINANCIAL_MAP (there are no scenes to populate them).
 *
 * Types mirror HEAD exactly (RiasecCode[] for riasec, keyed QuickPickTarget) so
 * the AS-IS build-inventory type-checks under strict mode.
 */

import type { RiasecCode } from "@/lib/rome";

export type Lean =
  | "plutot_a"
  | "un_peu_a"
  | "les_deux"
  | "ni_l_un"
  | "un_peu_b"
  | "plutot_b";

export const LEAN_WEIGHTS: Record<Lean, { a: number; b: number }> = {
  plutot_a: { a: 1.0, b: 0 },
  un_peu_a: { a: 0.5, b: 0 },
  les_deux: { a: 0.5, b: 0.5 },
  ni_l_un: { a: 0, b: 0 },
  un_peu_b: { a: 0, b: 0.5 },
  plutot_b: { a: 0, b: 1.0 },
};

export const LEAN_OPTIONS: { id: Lean; label: string }[] = [
  { id: "plutot_a", label: "Plutôt A" },
  { id: "un_peu_a", label: "Un peu A" },
  { id: "un_peu_b", label: "Un peu B" },
  { id: "plutot_b", label: "Plutôt B" },
  { id: "les_deux", label: "Les deux" },
  { id: "ni_l_un", label: "Ni l'un ni l'autre" },
];

export type ClusterWeight = { id: string; weight: number };
export type SideMapping = { clusters?: ClusterWeight[]; riasec?: RiasecCode[] };
export type SceneOption = { label: string; maps: SideMapping };
export type Scene = {
  id: string;
  prompt: string;
  optionA: SceneOption;
  optionB: SceneOption;
};

export type QuickPickTarget =
  | { kind: "constraint"; field: "departement" | "diploma" | "urgency" }
  | { kind: "tension"; key: "hours" | "mobility" }
  | { kind: "financial"; field: "salaire_min" | "situation_actuelle" };
export type QuickPickOption = { id: string; label: string; value: string };
export type QuickPick = {
  id: string;
  prompt: string;
  help?: string;
  multi?: boolean;
  target: QuickPickTarget;
  options: QuickPickOption[];
};

export type Category = {
  id: string;
  title: string;
  intro: string;
  financialOnly?: boolean;
  scenes: Scene[];
  quickPicks: QuickPick[];
};

/** Cat-4 scene side → tension/constraint signal. EMPTY: no scenes in Phase 1. */
export const TENSION_MAP: Record<
  string,
  { a: { key: string; value: string }; b: { key: string; value: string } }
> = {};

/** Cat-5 scene side → financial input. EMPTY: no scenes in Phase 1. */
export const FINANCIAL_MAP: Record<
  string,
  { a: { field: string; value: string }; b: { field: string; value: string } }
> = {};

/** Département (market seam, multi-select). */
const C_DEPARTEMENT: QuickPick = {
  id: "c_departement",
  prompt: "Où veux-tu chercher ? (plusieurs choix possibles)",
  help: "Sélectionne tous les départements qui te conviennent. Les signaux du marché seront regardés pour chacun.",
  multi: true,
  target: { kind: "constraint", field: "departement" },
  options: [
    { id: "75", label: "75 — Paris", value: "75" },
    { id: "77", label: "77 — Seine-et-Marne", value: "77" },
    { id: "78", label: "78 — Yvelines", value: "78" },
    { id: "91", label: "91 — Essonne", value: "91" },
    { id: "92", label: "92 — Hauts-de-Seine", value: "92" },
    { id: "93", label: "93 — Seine-Saint-Denis", value: "93" },
    { id: "94", label: "94 — Val-de-Marne", value: "94" },
    { id: "95", label: "95 — Val-d'Oise", value: "95" },
    { id: "france", label: "France entière / mobilité ouverte", value: "france" },
  ],
};

/** Diplôme (level-demote reads constraints.diploma). */
const C_DIPLOMA: QuickPick = {
  id: "c_diploma",
  prompt: "Votre niveau de diplôme le plus élevé ?",
  target: { kind: "constraint", field: "diploma" },
  options: [
    { id: "aucun", label: "Aucun / Brevet", value: "aucun" },
    { id: "cap", label: "CAP / BEP", value: "cap" },
    { id: "bac", label: "Bac", value: "bac" },
    { id: "bac2", label: "Bac+2", value: "bac+2" },
    { id: "bac3", label: "Bac+3", value: "bac+3" },
    { id: "bac5", label: "Bac+5 et plus", value: "bac+5" },
  ],
};

export const CATEGORIES: Category[] = [
  {
    id: "localisation",
    title: "Où cherchez-vous ?",
    intro: "Une dernière précision avant de voir vos directions.",
    scenes: [],
    quickPicks: [C_DEPARTEMENT, C_DIPLOMA],
  },
];
