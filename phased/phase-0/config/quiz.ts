/**
 * Phase 0 quiz stub. No cognitive scenes — the seed front door is the only input
 * beyond département. Kept: the Lean vocabulary (build-inventory references the
 * types) and a single c_departement quick-pick. Everything cognitive (scenes,
 * clusters, tensions, financial) is removed for Phase 0.
 */

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
export type SideMapping = { clusters?: ClusterWeight[]; riasec?: string[] };
export type SceneOption = { label: string; maps: SideMapping };
export type Scene = {
  id: string;
  prompt: string;
  optionA: SceneOption;
  optionB: SceneOption;
};

export type QuickPickTarget =
  | { kind: "constraint"; field: string }
  | { kind: "tension"; key: string }
  | { kind: "financial"; field: string };
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

/** The only captured input beyond the seed: département (multi-select). */
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

export const CATEGORIES: Category[] = [
  {
    id: "localisation",
    title: "Où cherchez-vous ?",
    intro: "Une dernière précision avant de voir vos directions.",
    scenes: [],
    quickPicks: [C_DEPARTEMENT],
  },
];
