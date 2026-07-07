/**
 * Quiz configuration (quiz-full-spec, 5 categories). PURE DATA — no scenes,
 * options, leans, or mappings are hardcoded in components. The quiz UI renders
 * entirely from this file (PRD §5.4 constraint).
 *
 * Format (locked, quiz-full-spec):
 *   - Soft-lean relief-scenes: each scene presents two relief-options A / B.
 *   - Answer model on every scene: plutôt A / un peu A / un peu B / plutôt B,
 *     PLUS "les deux" and "ni l'un ni l'autre" — always open.
 *       plutôt   = full weight (1.0) to that side
 *       un peu   = half weight (0.5) to that side
 *       les deux = half weight (0.5) to BOTH sides
 *       ni l'un  = nothing (mild low-fit signal, tie-break only)
 *   - Hidden mapping: each side maps to weighted clusters + RIASEC letters.
 *     Mapping notation in spec: `cluster +N (RIASEC)`; here cluster weights are
 *     the +N, RIASEC letters ride on the side.
 *
 * Cat 4 (constraints) and Cat 5 (argent) also carry quick-picks — single-select
 * non-scene inputs (département, diplôme, salaire, situation). Cat-4 quick-picks
 * feed constraints; Cat-5 quick-picks + scenes feed financial_inputs, which the
 * MVP engine STORES but never consumes (Phase 2 premium hook, spec §5/§7).
 *
 * Category gating: the user may stop after any category. buildInventory reads
 * only the categories that have answers → partial inventory → partial /results.
 */
import type { RiasecCode } from "@/lib/rome";

// ---------------------------------------------------------------------------
// Answer model
// ---------------------------------------------------------------------------

/** The six fixed answers available on every relief-scene. */
export type Lean =
  | "plutot_a"
  | "un_peu_a"
  | "un_peu_b"
  | "plutot_b"
  | "les_deux"
  | "ni_l_un";

/** Lean → weight applied to side A and side B (quiz-full-spec answer model). */
export const LEAN_WEIGHTS: Record<Lean, { a: number; b: number }> = {
  plutot_a: { a: 1.0, b: 0.0 },
  un_peu_a: { a: 0.5, b: 0.0 },
  un_peu_b: { a: 0.0, b: 0.5 },
  plutot_b: { a: 0.0, b: 1.0 },
  les_deux: { a: 0.5, b: 0.5 },
  ni_l_un: { a: 0.0, b: 0.0 }, // mild low-fit signal, tie-break only
};

/** Display order + labels for the six leans (French-facing). */
export const LEAN_OPTIONS: { id: Lean; label: string }[] = [
  { id: "plutot_a", label: "Plutôt A" },
  { id: "un_peu_a", label: "Un peu A" },
  { id: "un_peu_b", label: "Un peu B" },
  { id: "plutot_b", label: "Plutôt B" },
  { id: "les_deux", label: "Les deux" },
  { id: "ni_l_un", label: "Ni l'un ni l'autre" },
];

/** A weighted cluster contribution from one side of a scene. */
export type ClusterWeight = { id: string; weight: number };

/** What one relief-option (a side of a scene) maps to (the hidden mapping). */
export type SideMapping = {
  /** weighted clusters this side contributes (`cluster +N`). */
  clusters?: ClusterWeight[];
  /** RIASEC letters this side leans toward. */
  riasec?: RiasecCode[];
};

/** One relief-option (a side) of a scene. */
export type SceneOption = {
  label: string;
  maps: SideMapping;
};

/** A soft-lean relief-scene: prompt + two sides, answered with a Lean. */
export type Scene = {
  id: string;
  prompt: string;
  optionA: SceneOption;
  optionB: SceneOption;
};

// ---------------------------------------------------------------------------
// Quick-picks (Cat 4 + Cat 5 non-scene inputs)
// ---------------------------------------------------------------------------

/** Where a quick-pick value lands on the Inventory. */
export type QuickPickTarget =
  // Cat-4 constraints / tensions (feed filtering + honest fork)
  | { kind: "constraint"; field: "departement" | "diploma" | "urgency" }
  | { kind: "tension"; key: "hours" | "mobility" }
  // Cat-5 financial inputs (STORED, consumed by nothing in the MVP)
  | { kind: "financial"; field: "salaire_min" | "situation_actuelle" };

export type QuickPickOption = { id: string; label: string; value: string };

/** A single-select non-scene input. */
export type QuickPick = {
  id: string;
  prompt: string;
  help?: string;
  target: QuickPickTarget;
  options: QuickPickOption[];
};

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export type CategoryId =
  | "fonctionnes"
  | "sais_faire"
  | "gens"
  | "contraintes"
  | "argent";

export type Category = {
  id: CategoryId;
  title: string;
  intro: string;
  scenes: Scene[];
  quickPicks: QuickPick[];
  /** Cat-5 financial scenes are captured but never consumed by the MVP engine. */
  financialOnly?: boolean;
};

// ===========================================================================
// Category 1 — « Comment tu fonctionnes » (5 scenes)
// ===========================================================================
const CAT_FONCTIONNES: Category = {
  id: "fonctionnes",
  title: "Comment tu fonctionnes",
  intro:
    "On commence par toi, pas par les métiers. Choisis ce qui te ressemble. Pas de bonne réponse.",
  scenes: [
    {
      id: "f_order_improv",
      prompt: "Tu arrives sur un projet en bazar.",
      optionA: {
        label: "Soulagement : un truc à remettre d'aplomb.",
        maps: { clusters: [{ id: "systemes", weight: 2 }], riasec: ["C", "I"] },
      },
      optionB: {
        label: "Avancer au feeling, structurer plus tard.",
        maps: { clusters: [{ id: "adaptabilite", weight: 2 }], riasec: ["R", "E"] },
      },
    },
    {
      id: "f_surface_depth",
      prompt: "On te donne une explication plausible à un problème.",
      optionA: {
        label: "Ça suffit, tu avances.",
        maps: { clusters: [{ id: "execution", weight: 1 }] },
      },
      optionB: {
        label: "Ça te gratte, tu creuses le vrai mécanisme.",
        maps: {
          clusters: [
            { id: "analyse", weight: 2 },
            { id: "detection_incoherence", weight: 2 },
          ],
          riasec: ["I"],
        },
      },
    },
    {
      id: "f_leverage_completeness",
      prompt: "Dix tâches, pas le temps de toutes les faire.",
      optionA: {
        label: "Celle qui change le plus, tant pis pour le reste.",
        maps: {
          clusters: [
            { id: "leverage", weight: 2 },
            { id: "priorisation", weight: 1 },
          ],
          riasec: ["E", "I"],
        },
      },
      optionB: {
        label: "Tout proprement, dans l'ordre.",
        maps: { clusters: [{ id: "rigueur", weight: 2 }], riasec: ["C"] },
      },
    },
    {
      id: "f_decide_wait",
      prompt: "Il faut décider, l'info est incomplète et floue.",
      optionA: {
        label: "Tu tranches, tu ajustes après.",
        maps: {
          clusters: [
            { id: "decision_incertitude", weight: 2 },
            { id: "autonomie", weight: 1 },
          ],
          riasec: ["E"],
        },
      },
      optionB: {
        label: "Tu attends d'y voir clair.",
        maps: { clusters: [{ id: "besoin_clarte", weight: 1 }], riasec: ["C"] },
      },
    },
    {
      id: "f_scale_task",
      prompt: "Une demande ponctuelle.",
      optionA: {
        label: "Tu construis un système réutilisable.",
        maps: {
          clusters: [
            { id: "systemes", weight: 2 },
            { id: "scalabilite", weight: 2 },
          ],
          riasec: ["C", "I"],
        },
      },
      optionB: {
        label: "Tu fais le truc simple et tu passes.",
        maps: {
          clusters: [
            { id: "execution", weight: 1 },
            { id: "pragmatisme", weight: 1 },
          ],
        },
      },
    },
  ],
  quickPicks: [],
};

// ===========================================================================
// Category 2 — « Ce que tu sais déjà faire » (3 scenes) — evidence layer
// ===========================================================================
const CAT_SAIS_FAIRE: Category = {
  id: "sais_faire",
  title: "Ce que tu sais déjà faire",
  intro:
    "Maintenant le concret. Ce que tu as vraiment fait, même si ça te paraît banal.",
  scenes: [
    {
      id: "sf_numbers_people",
      prompt: "Quelle journée de travail te semble facile ?",
      optionA: {
        label: "Vérifier, calculer, respecter des règles précises.",
        maps: {
          clusters: [
            { id: "rigueur", weight: 2 },
            { id: "gestion_donnees", weight: 2 },
          ],
          riasec: ["C"],
        },
      },
      optionB: {
        label: "Parler aux gens, gérer leurs demandes.",
        maps: {
          clusters: [
            { id: "contact", weight: 2 },
            { id: "relation_client", weight: 2 },
          ],
          riasec: ["S"],
        },
      },
    },
    {
      id: "sf_hands_organise",
      prompt: "Vers quoi tu te tournes naturellement ?",
      optionA: {
        label: "Faire de tes mains, un service rapide, un résultat concret.",
        maps: {
          clusters: [
            { id: "terrain", weight: 2 },
            { id: "food", weight: 1 },
          ],
          riasec: ["R"],
        },
      },
      optionB: {
        label: "Organiser, planifier, coordonner les autres.",
        maps: { clusters: [{ id: "organisation", weight: 2 }], riasec: ["C", "E"] },
      },
    },
    {
      id: "sf_sell_fix",
      prompt: "Où tu es à l'aise ?",
      optionA: {
        label: "Convaincre, négocier, ouvrir une conversation.",
        maps: {
          clusters: [
            { id: "vente", weight: 2 },
            { id: "persuasion", weight: 1 },
          ],
          riasec: ["E"],
        },
      },
      optionB: {
        label: "Réparer, faire tourner, résoudre un problème technique.",
        maps: {
          clusters: [
            { id: "resolution", weight: 2 },
            { id: "support", weight: 1 },
          ],
          riasec: ["R", "I"],
        },
      },
    },
  ],
  quickPicks: [],
};

// ===========================================================================
// Category 3 — « Toi avec les gens » (3 scenes)
// ===========================================================================
const CAT_GENS: Category = {
  id: "gens",
  title: "Toi avec les gens",
  intro:
    "Comment tu es avec les autres, au travail. Pas ta personnalité entière, juste au boulot.",
  scenes: [
    {
      id: "g_conflict",
      prompt: "Trois clients mécontents à rappeler.",
      optionA: {
        label: "Ça va, tu décroches, tu gères.",
        maps: {
          clusters: [
            { id: "contact", weight: 2 },
            { id: "gestion_conflit", weight: 1 },
          ],
          riasec: ["S"],
        },
      },
      optionB: {
        label: "Tu préfères éviter, ça te coûte.",
        maps: { clusters: [{ id: "besoin_calme", weight: 1 }] },
      },
    },
    {
      id: "g_lead_support",
      prompt: "Une équipe ou un service à faire tourner.",
      optionA: {
        label: "Tu prends le lead naturellement.",
        maps: { clusters: [{ id: "leadership", weight: 2 }], riasec: ["E"] },
      },
      optionB: {
        label: "Tu préfères bien tenir ton poste.",
        maps: { clusters: [{ id: "fiabilite", weight: 1 }], riasec: ["C"] },
      },
    },
    {
      id: "g_teach_do",
      prompt: "Quelqu'un ne comprend pas.",
      optionA: {
        label: "Tu expliques, tu transmets, ça te plaît.",
        maps: {
          clusters: [
            { id: "transmission", weight: 2 },
            { id: "pedagogie", weight: 1 },
          ],
          riasec: ["S"],
        },
      },
      optionB: {
        label: "Tu fais à leur place, plus rapide.",
        maps: { clusters: [{ id: "execution", weight: 1 }] },
      },
    },
  ],
  quickPicks: [],
};

// ===========================================================================
// Category 4 — « Tes contraintes réelles » (3 scenes + quick-picks)
// Maps to tension/constraint signals, not clusters — feeds filtering + fork.
// ===========================================================================
const CAT_CONTRAINTES: Category = {
  id: "contraintes",
  title: "Tes contraintes réelles",
  intro:
    "Le réel maintenant. Ce qui limite ou cadre ton choix. Sois honnête, c'est ce qui rend les résultats utiles.",
  scenes: [
    {
      id: "c_hours",
      prompt: "Tes horaires.",
      optionA: {
        label: "Horaires fixes, prévisibles.",
        maps: { clusters: [], riasec: [] }, // tension only, applied by the resolver below
      },
      optionB: {
        label: "Je peux flexer, soirs / week-ends.",
        maps: { clusters: [], riasec: [] },
      },
    },
    {
      id: "c_mobility",
      prompt: "Ta mobilité.",
      optionA: {
        label: "Local uniquement.",
        maps: { clusters: [], riasec: [] },
      },
      optionB: {
        label: "Je bouge / je déménage.",
        maps: { clusters: [], riasec: [] },
      },
    },
    {
      id: "c_timeline",
      prompt: "Ton timing.",
      optionA: {
        label: "Il me faut du boulot maintenant.",
        maps: { clusters: [], riasec: [] },
      },
      optionB: {
        label: "J'explore, j'ai le temps.",
        maps: { clusters: [], riasec: [] },
      },
    },
  ],
  quickPicks: [
    {
      id: "c_departement",
      prompt: "Où cherches-tu ? (département Île-de-France)",
      target: { kind: "constraint", field: "departement" },
      options: [
        { id: "75", label: "75 — Paris", value: "75" },
        { id: "92", label: "92 — Hauts-de-Seine", value: "92" },
        { id: "93", label: "93 — Seine-Saint-Denis", value: "93" },
        { id: "94", label: "94 — Val-de-Marne", value: "94" },
      ],
    },
    {
      id: "c_diploma",
      prompt: "Diplôme le plus élevé ?",
      target: { kind: "constraint", field: "diploma" },
      options: [
        { id: "none", label: "Aucun", value: "aucun" },
        { id: "cap", label: "CAP / BEP", value: "cap" },
        { id: "bac", label: "Bac", value: "bac" },
        { id: "bac2", label: "Bac+2", value: "bac+2" },
        { id: "bac3plus", label: "Bac+3 ou plus", value: "bac+3" },
      ],
    },
  ],
};

// ===========================================================================
// Category 5 — « Argent & autonomie » (2 scenes + quick-picks)
// PREMIUM HOOK: every answer here is captured and STORED now; the financial
// model that USES it is Phase 2 / paid. The MVP engine reads NONE of it.
// ===========================================================================
const CAT_ARGENT: Category = {
  id: "argent",
  title: "Argent & autonomie",
  intro:
    "Dernier volet. Ça ne change pas ce que tu sais faire, mais ça oriente vers ce qui te conviendrait vraiment.",
  financialOnly: true,
  scenes: [
    {
      id: "ar_security_upside",
      prompt: "Deux offres d'emploi.",
      optionA: {
        // appetit_risque = low — captured as financial input, not a cluster
        label: "Stable, prévisible, je sais ce que je gagne.",
        maps: { clusters: [], riasec: [] },
      },
      optionB: {
        // appetit_risque = high
        label: "Moins sûr mais ça peut monter plus haut.",
        maps: { clusters: [], riasec: [] },
      },
    },
    {
      id: "ar_employee_own",
      prompt: "Projette-toi dans cinq ans.",
      optionA: {
        // pull_autonomie = low
        label: "Un bon poste, dans une boîte solide.",
        maps: { clusters: [], riasec: [] },
      },
      optionB: {
        // pull_autonomie = high
        label: "Mon propre truc, même si c'est plus dur.",
        maps: { clusters: [], riasec: [] },
      },
    },
  ],
  quickPicks: [
    {
      id: "ar_salaire_min",
      prompt: "Salaire minimum acceptable ?",
      help: "Capturé pour le modèle financier (Phase 2). N'influence pas tes résultats aujourd'hui.",
      target: { kind: "financial", field: "salaire_min" },
      options: [
        { id: "lt1500", label: "Moins de 1 500 € net", value: "<1500" },
        { id: "1500_2000", label: "1 500 – 2 000 € net", value: "1500-2000" },
        { id: "2000_2500", label: "2 000 – 2 500 € net", value: "2000-2500" },
        { id: "gt2500", label: "Plus de 2 500 € net", value: ">2500" },
      ],
    },
    {
      id: "ar_situation",
      prompt: "Situation actuelle ?",
      help: "Capturé pour le modèle financier (Phase 2).",
      target: { kind: "financial", field: "situation_actuelle" },
      options: [
        { id: "en_poste", label: "En poste", value: "en_poste" },
        { id: "chomage", label: "Au chômage", value: "chomage" },
        { id: "etudiant", label: "Étudiant", value: "etudiant" },
        { id: "independant", label: "Indépendant", value: "independant" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Cat-4 tension mapping + Cat-5 financial mapping (per-scene, per-side).
// Kept here (config, not components/resolver) so all content lives in config.
// The resolver reads these to land tension/financial signals on the Inventory.
// ---------------------------------------------------------------------------

/** Cat-4 scene side → tension/constraint signal. Side picked by lean (A vs B). */
export const TENSION_MAP: Record<
  string,
  { a: { key: string; value: string }; b: { key: string; value: string } }
> = {
  c_hours: {
    a: { key: "tension:hours", value: "fixed" },
    b: { key: "tension:hours", value: "flexible" },
  },
  c_mobility: {
    a: { key: "tension:mobility", value: "local" },
    b: { key: "tension:mobility", value: "mobile" },
  },
  c_timeline: {
    a: { key: "urgency", value: "now" },
    b: { key: "urgency", value: "exploring" },
  },
};

/** Cat-5 scene side → financial input. Side picked by lean (A vs B). */
export const FINANCIAL_MAP: Record<
  string,
  { a: { field: string; value: string }; b: { field: string; value: string } }
> = {
  ar_security_upside: {
    a: { field: "appetit_risque", value: "low" },
    b: { field: "appetit_risque", value: "high" },
  },
  ar_employee_own: {
    a: { field: "pull_autonomie", value: "low" },
    b: { field: "pull_autonomie", value: "high" },
  },
};

// ---------------------------------------------------------------------------
// The full ordered quiz (all 5 categories, linear). No shape routing.
// ---------------------------------------------------------------------------
export const CATEGORIES: Category[] = [
  CAT_FONCTIONNES,
  CAT_SAIS_FAIRE,
  CAT_GENS,
  CAT_CONTRAINTES,
  CAT_ARGENT,
];

export function getCategory(id: CategoryId): Category {
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown category id: ${id}`);
  return c;
}
