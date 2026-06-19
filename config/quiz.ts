/**
 * Quiz configuration (career-direction-engine, fuller spec).
 *
 * This file intentionally stays as pure configuration:
 *   - the UI renders categories, quick-picks and scenes from here;
 *   - answer buttons stay generic via LEAN_OPTIONS;
 *   - scoring lives in the hidden `maps` attached to each side;
 *   - constraint and financial side-effects stay in TENSION_MAP / FINANCIAL_MAP;
 *   - components should not hardcode question copy, cluster names or side mappings.
 *
 * Why this version is larger than the lean MVP:
 *   - the previous file had 16 scene questions;
 *   - this version has 40 scene questions;
 *   - the evidence layer is much stronger;
 *   - the same six-answer soft-lean model is preserved;
 *   - all original exports are preserved;
 *   - extra exports are additive and safe for future profile derivation.
 *
 * Question distribution:
 *   - 10 — Comment tu fonctionnes
 *   - 10 — Ce que tu sais déjà faire
 *   - 7  — Toi avec les gens
 *   - 7  — Tes contraintes réelles
 *   - 6  — Argent & autonomie
 *
 * The design rule is important: this quiz should not pretend to decide a job.
 * It should build a signal inventory that a results engine can intersect with
 * real market data, constraints, training gates and user evidence.
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

/** Lean → weight applied to side A and side B. */
export const LEAN_WEIGHTS: Record<Lean, { a: number; b: number }> = {
  plutot_a: { a: 1.0, b: 0.0 },
  un_peu_a: { a: 0.5, b: 0.0 },
  un_peu_b: { a: 0.0, b: 0.5 },
  plutot_b: { a: 0.0, b: 1.0 },
  les_deux: { a: 0.5, b: 0.5 },
  ni_l_un: { a: 0.0, b: 0.0 },
};

/** Display order + labels for the six leans. */
export const LEAN_OPTIONS: { id: Lean; label: string }[] = [
  { id: "plutot_a", label: "Plutôt A" },
  { id: "un_peu_a", label: "Un peu A" },
  { id: "un_peu_b", label: "Un peu B" },
  { id: "plutot_b", label: "Plutôt B" },
  { id: "les_deux", label: "Les deux" },
  { id: "ni_l_un", label: "Ni l'un ni l'autre" },
];

/** A weighted cluster contribution from one side of a scene. */
export type ClusterWeight = {
  id: string;
  weight: number;
};

/** What one relief-option maps to. */
export type SideMapping = {
  clusters?: ClusterWeight[];
  riasec?: RiasecCode[];
};

/** One relief-option of a scene. */
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
// Quick-picks
// ---------------------------------------------------------------------------

/** Where a quick-pick value lands on the Inventory. */
export type QuickPickTarget =
  | { kind: "constraint"; field: "departement" | "diploma" | "urgency" }
  | { kind: "tension"; key: "hours" | "mobility" }
  | { kind: "financial"; field: "salaire_min" | "situation_actuelle" };

export type QuickPickOption = {
  id: string;
  label: string;
  value: string;
};

/** A non-scene input. Single-select by default; `multi` allows several values. */
export type QuickPick = {
  id: string;
  prompt: string;
  help?: string;
  target: QuickPickTarget;
  options: QuickPickOption[];
  /**
   * When true, the user may pick several options (e.g. multiple départements).
   * The UI stores selected option ids comma-joined; the resolver splits them.
   */
  multi?: boolean;
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
  financialOnly?: boolean;
};

// ---------------------------------------------------------------------------
// Cluster catalogue
// ---------------------------------------------------------------------------

/**
 * Cluster catalogue used by the fuller quiz.
 *
 * Components do not need this to render the quiz. It exists so the result layer
 * can describe *why* a profile was detected instead of showing naked IDs.
 */
export type ClusterDefinition = {
  id: string;
  label: string;
  definition: string;
};

export const CLUSTER_CATALOG: ClusterDefinition[] = [
  {
    id: "adaptabilite",
    label: "adaptabilite",
    definition: "Aisance quand le contexte change et que la marche à suivre n'est pas totalement écrite.",
  },
  {
    id: "administration",
    label: "administration",
    definition: "Capacité à tenir des dossiers, formulaires, règles et documents sans perdre le fil.",
  },
  {
    id: "amelioration_continue",
    label: "amelioration continue",
    definition: "Réflexe de réduire les causes récurrentes plutôt que traiter uniquement les symptômes.",
  },
  {
    id: "analyse",
    label: "analyse",
    definition: "Capacité à décomposer une situation et comprendre les mécanismes sous la surface.",
  },
  {
    id: "apprentissage",
    label: "apprentissage",
    definition: "Capacité à entrer dans un sujet nouveau et à en extraire les principes utiles.",
  },
  {
    id: "assurance",
    label: "assurance",
    definition: "Capacité à porter un point de vue ou des faits devant un interlocuteur plus senior.",
  },
  {
    id: "autonomie",
    label: "autonomie",
    definition: "Capacité à avancer sans supervision constante ni validation permanente.",
  },
  {
    id: "besoin_calme",
    label: "besoin calme",
    definition: "Besoin d'un environnement qui limite le bruit relationnel ou l'urgence permanente.",
  },
  {
    id: "besoin_clarte",
    label: "besoin clarte",
    definition: "Besoin de consignes, périmètre ou critères explicites avant d'agir.",
  },
  {
    id: "besoin_harmonie",
    label: "besoin harmonie",
    definition: "Tendance à préserver la relation et éviter les tensions directes.",
  },
  {
    id: "business_analysis",
    label: "business analysis",
    definition: "Capacité à relier problème opérationnel, coût, revenu, risque ou décision business.",
  },
  {
    id: "cadre",
    label: "cadre",
    definition: "Besoin ou capacité à poser des règles, limites, procédures et périmètres.",
  },
  {
    id: "clarification",
    label: "clarification",
    definition: "Capacité à transformer une demande vague en problème compréhensible.",
  },
  {
    id: "collectif",
    label: "collectif",
    definition: "Aisance à fonctionner avec un groupe quand les interactions ont un objectif.",
  },
  {
    id: "contact",
    label: "contact",
    definition: "Aisance relationnelle de base dans un contexte professionnel.",
  },
  {
    id: "coordination",
    label: "coordination",
    definition: "Capacité à faire avancer plusieurs personnes, étapes ou dépendances.",
  },
  {
    id: "decision_incertitude",
    label: "decision incertitude",
    definition: "Capacité à décider avec information incomplète et à corriger ensuite.",
  },
  {
    id: "detection_incoherence",
    label: "detection incoherence",
    definition: "Réflexe de repérer ce qui ne colle pas dans un discours, un flux ou une donnée.",
  },
  {
    id: "diagnostic",
    label: "diagnostic",
    definition: "Capacité à remonter d'un symptôme à une cause probable.",
  },
  {
    id: "documentation",
    label: "documentation",
    definition: "Capacité à rendre une information réutilisable par écrit.",
  },
  {
    id: "ecriture",
    label: "ecriture",
    definition: "Capacité à écrire clairement pour transmettre, cadrer ou synthétiser.",
  },
  {
    id: "empathie",
    label: "empathie",
    definition: "Capacité à comprendre l'état ou la contrainte de l'autre sans perdre le cadre.",
  },
  {
    id: "execution",
    label: "execution",
    definition: "Capacité à produire le résultat demandé sans surcomplexifier.",
  },
  {
    id: "fiabilite",
    label: "fiabilite",
    definition: "Capacité à tenir son poste, respecter ses engagements et livrer proprement.",
  },
  {
    id: "formation",
    label: "formation",
    definition: "Capacité à rendre quelqu'un d'autre progressivement autonome.",
  },
  {
    id: "gestion_conflit",
    label: "gestion conflit",
    definition: "Capacité à traiter une tension ou une insatisfaction sans fuir le sujet.",
  },
  {
    id: "gestion_donnees",
    label: "gestion donnees",
    definition: "Capacité à nettoyer, vérifier, structurer ou exploiter des données.",
  },
  {
    id: "influence",
    label: "influence",
    definition: "Capacité à faire avancer une décision par la parole, le cadrage ou la persuasion.",
  },
  {
    id: "investigation",
    label: "investigation",
    definition: "Capacité à rechercher des indices, traces, preuves ou causes.",
  },
  {
    id: "iteration",
    label: "iteration",
    definition: "Capacité à tester rapidement puis améliorer sur retour réel.",
  },
  {
    id: "leadership",
    label: "leadership",
    definition: "Capacité à prendre l'initiative et à entraîner un groupe ou une décision.",
  },
  {
    id: "leverage",
    label: "leverage",
    definition: "Réflexe de chercher l'action qui produit l'effet disproportionné.",
  },
  {
    id: "manuel",
    label: "manuel",
    definition: "Aisance avec le concret, l'objet, le geste ou le service physique.",
  },
  {
    id: "numerique",
    label: "numerique",
    definition: "Aisance avec les outils numériques, configurations, statuts, droits ou flux.",
  },
  {
    id: "organisation",
    label: "organisation",
    definition: "Capacité à mettre de l'ordre dans des tâches, dossiers ou responsabilités.",
  },
  {
    id: "pedagogie",
    label: "pedagogie",
    definition: "Capacité à expliquer de manière compréhensible selon le niveau de l'autre.",
  },
  {
    id: "persuasion",
    label: "persuasion",
    definition: "Capacité à convaincre ou obtenir un accord.",
  },
  {
    id: "planification",
    label: "planification",
    definition: "Capacité à organiser le temps, les étapes et les dépendances.",
  },
  {
    id: "pragmatisme",
    label: "pragmatisme",
    definition: "Capacité à chercher une solution suffisante plutôt que parfaite.",
  },
  {
    id: "presentation",
    label: "presentation",
    definition: "Aisance à expliquer oralement, montrer ou défendre une idée.",
  },
  {
    id: "priorisation",
    label: "priorisation",
    definition: "Capacité à choisir ce qui doit passer avant le reste.",
  },
  {
    id: "procedure",
    label: "procedure",
    definition: "Capacité à suivre ou produire une marche à suivre claire.",
  },
  {
    id: "qualite",
    label: "qualite",
    definition: "Attention aux erreurs, écarts, contrôles et fiabilité du résultat.",
  },
  {
    id: "relation_client",
    label: "relation client",
    definition: "Capacité à recevoir, traiter et faire avancer une demande client ou usager.",
  },
  {
    id: "reporting",
    label: "reporting",
    definition: "Capacité à transformer des données ou faits en information lisible.",
  },
  {
    id: "resolution",
    label: "resolution",
    definition: "Capacité à régler un problème concret et à remettre quelque chose en marche.",
  },
  {
    id: "rigueur",
    label: "rigueur",
    definition: "Capacité à respecter une règle, un ordre, une précision ou une vérification.",
  },
  {
    id: "scalabilite",
    label: "scalabilite",
    definition: "Réflexe de penser à ce qui tiendra quand le volume augmente.",
  },
  {
    id: "service",
    label: "service",
    definition: "Orientation vers l'aide utile, le besoin traité et le résultat pour autrui.",
  },
  {
    id: "standardisation",
    label: "standardisation",
    definition: "Capacité à rendre un fonctionnement répétable et moins dépendant d'une personne.",
  },
  {
    id: "strategie",
    label: "strategie",
    definition: "Capacité à lire une situation en termes de choix, séquence et positionnement.",
  },
  {
    id: "support",
    label: "support",
    definition: "Capacité à aider un utilisateur, qualifier un incident ou débloquer une situation.",
  },
  {
    id: "synthese",
    label: "synthese",
    definition: "Capacité à réduire une masse d'information à l'essentiel exploitable.",
  },
  {
    id: "systemes",
    label: "systemes",
    definition: "Réflexe de relier entrées, étapes, responsabilités, sorties et boucles de retour.",
  },
  {
    id: "technique",
    label: "technique",
    definition: "Aisance avec la résolution technique, les outils ou le fonctionnement matériel/logique.",
  },
  {
    id: "terrain",
    label: "terrain",
    definition: "Aisance dans l'action concrète, les déplacements, l'environnement opérationnel.",
  },
  {
    id: "transmission",
    label: "transmission",
    definition: "Capacité à faire passer un savoir ou une méthode à quelqu'un d'autre.",
  },
  {
    id: "vente",
    label: "vente",
    definition: "Aisance avec prospection, découverte, argumentation ou négociation.",
  },
];

export const CLUSTER_DEFINITIONS_BY_ID: Record<string, ClusterDefinition> =
  Object.fromEntries(CLUSTER_CATALOG.map((cluster) => [cluster.id, cluster]));

// ===========================================================================
// Category — Comment tu fonctionnes
// ===========================================================================
const CAT_FONCTIONNES: Category = {
  id: "fonctionnes",
  title: "Comment tu fonctionnes",
  intro: "On commence par ton mode de fonctionnement. Pas les métiers, pas les titres. Ce qui compte ici : ce qui te soulage, ce qui te coûte, et la façon dont tu attaques un problème.",
  scenes: [
    {
      // Scene 01 — f_order_improv
      id: "f_order_improv",
      prompt: "Tu arrives sur un projet en bazar.",
      optionA: 
        {
          label: "Soulagement : un truc à remettre d'aplomb.",
          maps: {
            clusters: [
              { id: "systemes", weight: 2 },
              { id: "organisation", weight: 1 },
            ],
            riasec: ["C", "I"],
          },
        },
      optionB: 
        {
          label: "Avancer au feeling, structurer plus tard.",
          maps: {
            clusters: [
              { id: "adaptabilite", weight: 2 },
              { id: "execution", weight: 1 },
            ],
            riasec: ["R", "E"],
          },
        },
    },
    {
      // Scene 02 — f_surface_depth
      id: "f_surface_depth",
      prompt: "On te donne une explication plausible à un problème.",
      optionA: 
        {
          label: "Ça suffit, tu avances.",
          maps: {
            clusters: [
              { id: "execution", weight: 1 },
              { id: "pragmatisme", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
      optionB: 
        {
          label: "Ça te gratte, tu creuses le vrai mécanisme.",
          maps: {
            clusters: [
              { id: "analyse", weight: 2 },
              { id: "detection_incoherence", weight: 2 },
              { id: "diagnostic", weight: 1 },
            ],
            riasec: ["I"],
          },
        },
    },
    {
      // Scene 03 — f_leverage_completeness
      id: "f_leverage_completeness",
      prompt: "Dix tâches, pas le temps de toutes les faire.",
      optionA: 
        {
          label: "Tu choisis celle qui change le plus, tant pis pour le reste.",
          maps: {
            clusters: [
              { id: "leverage", weight: 2 },
              { id: "priorisation", weight: 2 },
              { id: "strategie", weight: 1 },
            ],
            riasec: ["E", "I"],
          },
        },
      optionB: 
        {
          label: "Tu fais tout proprement, dans l'ordre.",
          maps: {
            clusters: [
              { id: "rigueur", weight: 2 },
              { id: "fiabilite", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
    {
      // Scene 04 — f_decide_wait
      id: "f_decide_wait",
      prompt: "Il faut décider, l'information est incomplète.",
      optionA: 
        {
          label: "Tu tranches, tu ajustes après.",
          maps: {
            clusters: [
              { id: "decision_incertitude", weight: 2 },
              { id: "autonomie", weight: 1 },
              { id: "pragmatisme", weight: 1 },
            ],
            riasec: ["E"],
          },
        },
      optionB: 
        {
          label: "Tu attends d'y voir plus clair.",
          maps: {
            clusters: [
              { id: "besoin_clarte", weight: 2 },
              { id: "rigueur", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
    {
      // Scene 05 — f_scale_task
      id: "f_scale_task",
      prompt: "Une demande ponctuelle revient plusieurs fois.",
      optionA: 
        {
          label: "Tu construis un système réutilisable.",
          maps: {
            clusters: [
              { id: "systemes", weight: 2 },
              { id: "scalabilite", weight: 2 },
              { id: "standardisation", weight: 1 },
            ],
            riasec: ["C", "I"],
          },
        },
      optionB: 
        {
          label: "Tu traites le cas simplement et tu passes.",
          maps: {
            clusters: [
              { id: "execution", weight: 2 },
              { id: "pragmatisme", weight: 1 },
            ],
            riasec: ["R", "C"],
          },
        },
    },
    {
      // Scene 06 — f_ambiguous_instruction
      id: "f_ambiguous_instruction",
      prompt: "On te donne une consigne vague.",
      optionA: 
        {
          label: "Tu poses des questions pour cadrer avant d'agir.",
          maps: {
            clusters: [
              { id: "clarification", weight: 2 },
              { id: "documentation", weight: 1 },
              { id: "besoin_clarte", weight: 1 },
            ],
            riasec: ["C", "S"],
          },
        },
      optionB: 
        {
          label: "Tu testes une première version et tu corriges vite.",
          maps: {
            clusters: [
              { id: "iteration", weight: 2 },
              { id: "adaptabilite", weight: 1 },
              { id: "decision_incertitude", weight: 1 },
            ],
            riasec: ["R", "E"],
          },
        },
    },
    {
      // Scene 07 — f_repeat_problem
      id: "f_repeat_problem",
      prompt: "Le même problème revient chaque semaine.",
      optionA: 
        {
          label: "Tu veux comprendre pourquoi il revient.",
          maps: {
            clusters: [
              { id: "analyse", weight: 2 },
              { id: "amelioration_continue", weight: 2 },
              { id: "systemes", weight: 1 },
            ],
            riasec: ["I", "C"],
          },
        },
      optionB: 
        {
          label: "Tu le règles vite à chaque fois.",
          maps: {
            clusters: [
              { id: "execution", weight: 2 },
              { id: "service", weight: 1 },
              { id: "fiabilite", weight: 1 },
            ],
            riasec: ["R", "S"],
          },
        },
    },
    {
      // Scene 08 — f_new_domain
      id: "f_new_domain",
      prompt: "Tu dois apprendre un domaine nouveau.",
      optionA: 
        {
          label: "Tu cherches les principes, le vocabulaire, les règles du jeu.",
          maps: {
            clusters: [
              { id: "apprentissage", weight: 2 },
              { id: "synthese", weight: 2 },
              { id: "investigation", weight: 1 },
            ],
            riasec: ["I"],
          },
        },
      optionB: 
        {
          label: "Tu demandes la recette exacte pour être opérationnel vite.",
          maps: {
            clusters: [
              { id: "procedure", weight: 2 },
              { id: "execution", weight: 1 },
              { id: "besoin_clarte", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
    {
      // Scene 09 — f_detail_big_picture
      id: "f_detail_big_picture",
      prompt: "Tu regardes un processus compliqué.",
      optionA: 
        {
          label: "Tu vois d'abord les petits détails qui peuvent casser le flux.",
          maps: {
            clusters: [
              { id: "qualite", weight: 2 },
              { id: "rigueur", weight: 2 },
              { id: "detection_incoherence", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
      optionB: 
        {
          label: "Tu vois d'abord la structure générale et les leviers.",
          maps: {
            clusters: [
              { id: "strategie", weight: 2 },
              { id: "leverage", weight: 2 },
              { id: "systemes", weight: 1 },
            ],
            riasec: ["E", "I"],
          },
        },
    },
    {
      // Scene 10 — f_energy_context
      id: "f_energy_context",
      prompt: "Dans quel contexte tu penses le mieux ?",
      optionA: 
        {
          label: "Calme, profondeur, concentration longue.",
          maps: {
            clusters: [
              { id: "analyse", weight: 2 },
              { id: "besoin_calme", weight: 2 },
              { id: "autonomie", weight: 1 },
            ],
            riasec: ["I", "C"],
          },
        },
      optionB: 
        {
          label: "Mouvement, variété, interaction, action directe.",
          maps: {
            clusters: [
              { id: "adaptabilite", weight: 2 },
              { id: "terrain", weight: 1 },
              { id: "contact", weight: 1 },
            ],
            riasec: ["R", "E", "S"],
          },
        },
    },
  ],
  quickPicks: [],
};

// ===========================================================================
// Category — Ce que tu sais déjà faire
// ===========================================================================
const CAT_SAIS_FAIRE: Category = {
  id: "sais_faire",
  title: "Ce que tu sais déjà faire",
  intro: "Ici on cherche les preuves. Pas ce que tu aimerais être. Ce que tu as déjà fait, même dans un job alimentaire, une formation, une mission courte, une association ou un projet personnel.",
  scenes: [
    {
      // Scene 11 — sf_numbers_people
      id: "sf_numbers_people",
      prompt: "Quelle journée de travail te semble plus naturelle ?",
      optionA: 
        {
          label: "Vérifier, calculer, classer, respecter des règles précises.",
          maps: {
            clusters: [
              { id: "rigueur", weight: 2 },
              { id: "gestion_donnees", weight: 2 },
              { id: "administration", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
      optionB: 
        {
          label: "Parler aux gens, comprendre leurs demandes, gérer la relation.",
          maps: {
            clusters: [
              { id: "contact", weight: 2 },
              { id: "relation_client", weight: 2 },
              { id: "service", weight: 1 },
            ],
            riasec: ["S"],
          },
        },
    },
    {
      // Scene 12 — sf_hands_organise
      id: "sf_hands_organise",
      prompt: "Vers quoi tu te tournes spontanément ?",
      optionA: 
        {
          label: "Faire de tes mains, livrer un résultat concret.",
          maps: {
            clusters: [
              { id: "terrain", weight: 2 },
              { id: "manuel", weight: 2 },
              { id: "execution", weight: 1 },
            ],
            riasec: ["R"],
          },
        },
      optionB: 
        {
          label: "Organiser, planifier, coordonner les étapes.",
          maps: {
            clusters: [
              { id: "organisation", weight: 2 },
              { id: "coordination", weight: 2 },
              { id: "planification", weight: 1 },
            ],
            riasec: ["C", "E"],
          },
        },
    },
    {
      // Scene 13 — sf_sell_fix
      id: "sf_sell_fix",
      prompt: "Où tu as déjà senti une vraie aisance ?",
      optionA: 
        {
          label: "Convaincre, négocier, ouvrir une conversation.",
          maps: {
            clusters: [
              { id: "vente", weight: 2 },
              { id: "persuasion", weight: 2 },
              { id: "influence", weight: 1 },
            ],
            riasec: ["E"],
          },
        },
      optionB: 
        {
          label: "Réparer, faire tourner, résoudre un problème technique.",
          maps: {
            clusters: [
              { id: "resolution", weight: 2 },
              { id: "support", weight: 2 },
              { id: "technique", weight: 1 },
            ],
            riasec: ["R", "I"],
          },
        },
    },
    {
      // Scene 14 — sf_write_explain
      id: "sf_write_explain",
      prompt: "Quand il faut transmettre une information compliquée.",
      optionA: 
        {
          label: "Tu préfères écrire clair, structurer, résumer.",
          maps: {
            clusters: [
              { id: "ecriture", weight: 2 },
              { id: "synthese", weight: 2 },
              { id: "documentation", weight: 1 },
            ],
            riasec: ["C", "I"],
          },
        },
      optionB: 
        {
          label: "Tu préfères expliquer à l'oral, montrer, répondre aux questions.",
          maps: {
            clusters: [
              { id: "presentation", weight: 2 },
              { id: "pedagogie", weight: 2 },
              { id: "contact", weight: 1 },
            ],
            riasec: ["S", "E"],
          },
        },
    },
    {
      // Scene 15 — sf_data_files
      id: "sf_data_files",
      prompt: "Face à un fichier Excel ou une liste désordonnée.",
      optionA: 
        {
          label: "Tu nettoies, tu ranges, tu fiabilises.",
          maps: {
            clusters: [
              { id: "gestion_donnees", weight: 2 },
              { id: "qualite", weight: 2 },
              { id: "rigueur", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
      optionB: 
        {
          label: "Tu cherches ce que les données racontent.",
          maps: {
            clusters: [
              { id: "analyse", weight: 2 },
              { id: "reporting", weight: 2 },
              { id: "synthese", weight: 1 },
            ],
            riasec: ["I"],
          },
        },
    },
    {
      // Scene 16 — sf_digital_tools
      id: "sf_digital_tools",
      prompt: "Avec un nouvel outil numérique.",
      optionA: 
        {
          label: "Tu configures les étapes, les statuts, les droits, les champs.",
          maps: {
            clusters: [
              { id: "numerique", weight: 2 },
              { id: "systemes", weight: 2 },
              { id: "standardisation", weight: 1 },
            ],
            riasec: ["C", "I"],
          },
        },
      optionB: 
        {
          label: "Tu l'utilises vite pour produire le résultat demandé.",
          maps: {
            clusters: [
              { id: "execution", weight: 2 },
              { id: "adaptabilite", weight: 1 },
              { id: "pragmatisme", weight: 1 },
            ],
            riasec: ["R", "C"],
          },
        },
    },
    {
      // Scene 17 — sf_client_issue
      id: "sf_client_issue",
      prompt: "Un client signale un problème flou.",
      optionA: 
        {
          label: "Tu reconstruis le chemin : logs, captures, étapes, contexte.",
          maps: {
            clusters: [
              { id: "diagnostic", weight: 2 },
              { id: "support", weight: 2 },
              { id: "investigation", weight: 1 },
            ],
            riasec: ["I", "R"],
          },
        },
      optionB: 
        {
          label: "Tu rassures d'abord, puis tu fais avancer la demande.",
          maps: {
            clusters: [
              { id: "relation_client", weight: 2 },
              { id: "empathie", weight: 1 },
              { id: "service", weight: 1 },
            ],
            riasec: ["S"],
          },
        },
    },
    {
      // Scene 18 — sf_project_followup
      id: "sf_project_followup",
      prompt: "Un dossier implique plusieurs personnes.",
      optionA: 
        {
          label: "Tu suis les statuts, les relances, les blocages.",
          maps: {
            clusters: [
              { id: "coordination", weight: 2 },
              { id: "planification", weight: 2 },
              { id: "organisation", weight: 1 },
            ],
            riasec: ["C", "E"],
          },
        },
      optionB: 
        {
          label: "Tu tiens ta partie proprement et tu attends la suite.",
          maps: {
            clusters: [
              { id: "fiabilite", weight: 2 },
              { id: "execution", weight: 1 },
              { id: "cadre", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
    {
      // Scene 19 — sf_training_peer
      id: "sf_training_peer",
      prompt: "Quelqu'un arrive sur un sujet que tu connais.",
      optionA: 
        {
          label: "Tu lui expliques progressivement jusqu'à autonomie.",
          maps: {
            clusters: [
              { id: "formation", weight: 2 },
              { id: "pedagogie", weight: 2 },
              { id: "transmission", weight: 1 },
            ],
            riasec: ["S"],
          },
        },
      optionB: 
        {
          label: "Tu lui fais une procédure claire à suivre.",
          maps: {
            clusters: [
              { id: "documentation", weight: 2 },
              { id: "procedure", weight: 2 },
              { id: "rigueur", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
    {
      // Scene 20 — sf_commercial_signal
      id: "sf_commercial_signal",
      prompt: "Dans une conversation professionnelle.",
      optionA: 
        {
          label: "Tu repères vite le problème qui pourrait coûter de l'argent.",
          maps: {
            clusters: [
              { id: "business_analysis", weight: 2 },
              { id: "leverage", weight: 1 },
              { id: "diagnostic", weight: 1 },
            ],
            riasec: ["E", "I"],
          },
        },
      optionB: 
        {
          label: "Tu préfères qu'on te donne une mission précise à exécuter.",
          maps: {
            clusters: [
              { id: "execution", weight: 2 },
              { id: "besoin_clarte", weight: 1 },
              { id: "fiabilite", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
  ],
  quickPicks: [],
};

// ===========================================================================
// Category — Toi avec les gens
// ===========================================================================
const CAT_GENS: Category = {
  id: "gens",
  title: "Toi avec les gens",
  intro: "Cette partie ne mesure pas si tu es sociable. Elle mesure le type d'interaction professionnelle qui te coûte ou te donne de l'énergie.",
  scenes: [
    {
      // Scene 21 — g_conflict
      id: "g_conflict",
      prompt: "Trois clients mécontents à rappeler.",
      optionA: 
        {
          label: "Tu décroches, tu cadres, tu gères.",
          maps: {
            clusters: [
              { id: "contact", weight: 2 },
              { id: "gestion_conflit", weight: 2 },
              { id: "relation_client", weight: 1 },
            ],
            riasec: ["S", "E"],
          },
        },
      optionB: 
        {
          label: "Tu préfères préparer une réponse écrite ou passer par un cadre clair.",
          maps: {
            clusters: [
              { id: "besoin_calme", weight: 2 },
              { id: "documentation", weight: 1 },
              { id: "cadre", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
    {
      // Scene 22 — g_lead_support
      id: "g_lead_support",
      prompt: "Une équipe ou un service doit avancer.",
      optionA: 
        {
          label: "Tu prends le lead naturellement.",
          maps: {
            clusters: [
              { id: "leadership", weight: 2 },
              { id: "coordination", weight: 1 },
              { id: "decision_incertitude", weight: 1 },
            ],
            riasec: ["E"],
          },
        },
      optionB: 
        {
          label: "Tu préfères bien tenir ton poste.",
          maps: {
            clusters: [
              { id: "fiabilite", weight: 2 },
              { id: "rigueur", weight: 1 },
              { id: "cadre", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
    {
      // Scene 23 — g_teach_do
      id: "g_teach_do",
      prompt: "Quelqu'un ne comprend pas.",
      optionA: 
        {
          label: "Tu expliques, tu transmets, ça te plaît.",
          maps: {
            clusters: [
              { id: "transmission", weight: 2 },
              { id: "pedagogie", weight: 2 },
              { id: "service", weight: 1 },
            ],
            riasec: ["S"],
          },
        },
      optionB: 
        {
          label: "Tu fais à sa place, plus rapide.",
          maps: {
            clusters: [
              { id: "execution", weight: 2 },
              { id: "pragmatisme", weight: 1 },
            ],
            riasec: ["R", "C"],
          },
        },
    },
    {
      // Scene 24 — g_group_energy
      id: "g_group_energy",
      prompt: "Une journée entière avec beaucoup d'interactions.",
      optionA: 
        {
          label: "Ça te stimule si les échanges ont un but.",
          maps: {
            clusters: [
              { id: "contact", weight: 2 },
              { id: "collectif", weight: 1 },
              { id: "influence", weight: 1 },
            ],
            riasec: ["S", "E"],
          },
        },
      optionB: 
        {
          label: "Ça te vide, même si les gens sont corrects.",
          maps: {
            clusters: [
              { id: "besoin_calme", weight: 2 },
              { id: "autonomie", weight: 1 },
              { id: "analyse", weight: 1 },
            ],
            riasec: ["I", "C"],
          },
        },
    },
    {
      // Scene 25 — g_boundaries
      id: "g_boundaries",
      prompt: "Quelqu'un abuse de ta disponibilité.",
      optionA: 
        {
          label: "Tu poses une limite claire.",
          maps: {
            clusters: [
              { id: "cadre", weight: 2 },
              { id: "gestion_conflit", weight: 1 },
              { id: "leadership", weight: 1 },
            ],
            riasec: ["E", "C"],
          },
        },
      optionB: 
        {
          label: "Tu aides quand même pour éviter la tension.",
          maps: {
            clusters: [
              { id: "empathie", weight: 2 },
              { id: "service", weight: 1 },
              { id: "besoin_harmonie", weight: 1 },
            ],
            riasec: ["S"],
          },
        },
    },
    {
      // Scene 26 — g_status_authority
      id: "g_status_authority",
      prompt: "Tu dois parler à quelqu'un de plus senior.",
      optionA: 
        {
          label: "Tu vas au sujet avec des faits.",
          maps: {
            clusters: [
              { id: "assurance", weight: 2 },
              { id: "synthese", weight: 1 },
              { id: "business_analysis", weight: 1 },
            ],
            riasec: ["E", "I"],
          },
        },
      optionB: 
        {
          label: "Tu préfères avoir un script ou une validation avant.",
          maps: {
            clusters: [
              { id: "besoin_clarte", weight: 2 },
              { id: "cadre", weight: 1 },
              { id: "rigueur", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
    {
      // Scene 27 — g_hidden_need
      id: "g_hidden_need",
      prompt: "Une personne demande une chose, mais tu sens que le vrai besoin est ailleurs.",
      optionA: 
        {
          label: "Tu reformules et tu fais préciser le vrai problème.",
          maps: {
            clusters: [
              { id: "diagnostic", weight: 2 },
              { id: "empathie", weight: 1 },
              { id: "clarification", weight: 1 },
            ],
            riasec: ["S", "I"],
          },
        },
      optionB: 
        {
          label: "Tu réponds strictement à la demande formulée.",
          maps: {
            clusters: [
              { id: "execution", weight: 2 },
              { id: "cadre", weight: 1 },
              { id: "fiabilite", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
  ],
  quickPicks: [],
};

// ===========================================================================
// Category — Tes contraintes réelles
// ===========================================================================
const CAT_CONTRAINTES: Category = {
  id: "contraintes",
  title: "Tes contraintes réelles",
  intro: "Le réel maintenant. Ces réponses ne disent pas ce que tu vaux. Elles évitent de te proposer des pistes incompatibles avec ta vie actuelle.",
  scenes: [
    {
      // Scene 28 — c_hours
      id: "c_hours",
      prompt: "Tes horaires.",
      optionA: 
        {
          label: "Horaires fixes, prévisibles.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Je peux flexer, soirs ou week-ends.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 29 — c_mobility
      id: "c_mobility",
      prompt: "Ta mobilité géographique.",
      optionA: 
        {
          label: "Local uniquement ou très proche.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Je peux bouger, changer de zone, voire déménager.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 30 — c_timeline
      id: "c_timeline",
      prompt: "Ton timing.",
      optionA: 
        {
          label: "Il me faut du travail rapidement.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "J'explore, je peux construire sur plusieurs mois.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 31 — c_remote_presence
      id: "c_remote_presence",
      prompt: "Ton rapport au présentiel.",
      optionA: 
        {
          label: "Je préfère un lieu de travail clair, avec une équipe visible.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Je peux travailler à distance ou en hybride sans perdre le fil.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 32 — c_physical
      id: "c_physical",
      prompt: "Effort physique et terrain.",
      optionA: 
        {
          label: "Je veux limiter l'usure physique.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Bouger, porter, se déplacer ne me dérange pas.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 33 — c_social_energy
      id: "c_social_energy",
      prompt: "Contact imposé toute la journée.",
      optionA: 
        {
          label: "Je dois limiter les interactions continues.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Je peux gérer une forte densité relationnelle.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 34 — c_training_length
      id: "c_training_length",
      prompt: "Formation avant d'être opérationnel.",
      optionA: 
        {
          label: "Je vise une piste accessible vite.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Je peux investir dans une formation plus longue si le retour est clair.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
  ],
  quickPicks: [
    {
      id: "c_departement",
      prompt: "Où cherches-tu ? (plusieurs choix possibles)",
      help: "Sélectionne tous les départements qui te conviennent. Les signaux de marché couvriront chacun d'eux.",
      multi: true,
      target: { kind: "constraint", field: "departement" },
      options: [
        {
          id: "75",
          label: "75 — Paris",
          value: "75",
        },
        {
          id: "77",
          label: "77 — Seine-et-Marne",
          value: "77",
        },
        {
          id: "78",
          label: "78 — Yvelines",
          value: "78",
        },
        {
          id: "91",
          label: "91 — Essonne",
          value: "91",
        },
        {
          id: "92",
          label: "92 — Hauts-de-Seine",
          value: "92",
        },
        {
          id: "93",
          label: "93 — Seine-Saint-Denis",
          value: "93",
        },
        {
          id: "94",
          label: "94 — Val-de-Marne",
          value: "94",
        },
        {
          id: "95",
          label: "95 — Val-d'Oise",
          value: "95",
        },
        {
          id: "france",
          label: "France entière / mobilité ouverte",
          value: "france",
        },
      ],
    },
    {
      id: "c_diploma",
      prompt: "Diplôme le plus élevé validé ?",
      help: "On le demande parce que beaucoup d'offres filtrent encore officiellement par diplôme.",
      target: { kind: "constraint", field: "diploma" },
      options: [
        {
          id: "none",
          label: "Aucun diplôme validé",
          value: "aucun",
        },
        {
          id: "cap",
          label: "CAP / BEP",
          value: "cap",
        },
        {
          id: "bac",
          label: "Bac",
          value: "bac",
        },
        {
          id: "bac2",
          label: "Bac+2",
          value: "bac+2",
        },
        {
          id: "bac3",
          label: "Bac+3",
          value: "bac+3",
        },
        {
          id: "bac5",
          label: "Bac+5 ou plus",
          value: "bac+5",
        },
      ],
    },
    {
      id: "c_urgency",
      prompt: "À quelle vitesse dois-tu sécuriser une piste ?",
      help: "Ce choix aide à séparer piste immédiate, transition courte, et construction longue.",
      target: { kind: "constraint", field: "urgency" },
      options: [
        {
          id: "now",
          label: "Maintenant / moins d'un mois",
          value: "now",
        },
        {
          id: "soon",
          label: "1 à 3 mois",
          value: "soon",
        },
        {
          id: "quarter",
          label: "3 à 6 mois",
          value: "quarter",
        },
        {
          id: "exploring",
          label: "Exploration sans urgence immédiate",
          value: "exploring",
        },
      ],
    },
  ],
};

// ===========================================================================
// Category — Argent & autonomie
// ===========================================================================
const CAT_ARGENT: Category = {
  id: "argent",
  title: "Argent & autonomie",
  intro: "Dernier volet. Ces réponses ne changent pas tes preuves. Elles aident à séparer sécurité, potentiel, autonomie, et trajectoire financière.",
  financialOnly: true,
  scenes: [
    {
      // Scene 35 — ar_security_upside
      id: "ar_security_upside",
      prompt: "Deux offres existent.",
      optionA: 
        {
          label: "Stable, prévisible, je sais ce que je gagne.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Moins sûr, mais le plafond peut être plus haut.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 36 — ar_employee_own
      id: "ar_employee_own",
      prompt: "Projette-toi dans cinq ans.",
      optionA: 
        {
          label: "Un bon poste dans une organisation solide.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Mon propre truc, même si c'est plus dur.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 37 — ar_income_floor_growth
      id: "ar_income_floor_growth",
      prompt: "Tu choisis entre deux trajectoires.",
      optionA: 
        {
          label: "Revenu correct rapidement.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Départ plus lent, mais meilleure progression possible.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 38 — ar_commission_fixed
      id: "ar_commission_fixed",
      prompt: "Mode de rémunération.",
      optionA: 
        {
          label: "Fixe clair, peu de surprise.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Variable, commission, prime ou performance si je peux influencer le résultat.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 39 — ar_learning_investment
      id: "ar_learning_investment",
      prompt: "Pour accéder à une meilleure piste.",
      optionA: 
        {
          label: "Je ne peux pas investir longtemps sans revenu.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Je peux accepter un effort d'apprentissage si le retour est réaliste.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
    {
      // Scene 40 — ar_side_project
      id: "ar_side_project",
      prompt: "En dehors du travail principal.",
      optionA: 
        {
          label: "Je préfère séparer travail et vie personnelle.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Je peux construire un projet à côté si ça ouvre une porte.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
    },
  ],
  quickPicks: [
    {
      id: "ar_salaire_min",
      prompt: "Salaire minimum acceptable ?",
      help: "Capturé pour le modèle financier. Cette valeur ne doit jamais écraser les preuves de profil.",
      target: { kind: "financial", field: "salaire_min" },
      options: [
        {
          id: "lt1500",
          label: "Moins de 1 500 € net",
          value: "<1500",
        },
        {
          id: "1500_1800",
          label: "1 500 – 1 800 € net",
          value: "1500-1800",
        },
        {
          id: "1800_2200",
          label: "1 800 – 2 200 € net",
          value: "1800-2200",
        },
        {
          id: "2200_2700",
          label: "2 200 – 2 700 € net",
          value: "2200-2700",
        },
        {
          id: "gt2700",
          label: "Plus de 2 700 € net",
          value: ">2700",
        },
      ],
    },
    {
      id: "ar_situation",
      prompt: "Situation actuelle ?",
      help: "Sert à distinguer urgence réelle, transition, et exploration.",
      target: { kind: "financial", field: "situation_actuelle" },
      options: [
        {
          id: "en_poste",
          label: "En poste",
          value: "en_poste",
        },
        {
          id: "chomage",
          label: "Au chômage",
          value: "chomage",
        },
        {
          id: "etudiant",
          label: "Étudiant / formation",
          value: "etudiant",
        },
        {
          id: "independant",
          label: "Indépendant",
          value: "independant",
        },
        {
          id: "reconversion",
          label: "Reconversion / transition",
          value: "reconversion",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Cat-4 tension mapping + Cat-5 financial mapping
// ---------------------------------------------------------------------------

/** Cat-4 scene side → tension/constraint signal. Side picked by lean. */
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
  c_remote_presence: {
    a: { key: "tension:workplace", value: "onsite_preferred" },
    b: { key: "tension:workplace", value: "remote_ok" },
  },
  c_physical: {
    a: { key: "tension:physical", value: "limit_physical_load" },
    b: { key: "tension:physical", value: "physical_ok" },
  },
  c_social_energy: {
    a: { key: "tension:social_density", value: "low_density_needed" },
    b: { key: "tension:social_density", value: "high_density_ok" },
  },
  c_training_length: {
    a: { key: "tension:training", value: "short_path" },
    b: { key: "tension:training", value: "longer_path_ok" },
  },
};

/** Cat-5 scene side → financial input. Side picked by lean. */
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
  ar_income_floor_growth: {
    a: { field: "income_priority", value: "floor_now" },
    b: { field: "income_priority", value: "growth_later" },
  },
  ar_commission_fixed: {
    a: { field: "variable_pay", value: "avoid" },
    b: { field: "variable_pay", value: "open" },
  },
  ar_learning_investment: {
    a: { field: "training_investment", value: "limited" },
    b: { field: "training_investment", value: "open_if_return_clear" },
  },
  ar_side_project: {
    a: { field: "side_project", value: "no" },
    b: { field: "side_project", value: "yes" },
  },
};

// ---------------------------------------------------------------------------
// Profile lenses
// ---------------------------------------------------------------------------

export type ProfileSignalLens = {
  id: string;
  title: string;
  description: string;
  positiveClusters: string[];
  cautionSignals: string[];
  riasec: RiasecCode[];
};

/**
 * Additive profile lenses for the result engine.
 *
 * These are not final job recommendations. They are intermediate profile shapes.
 * A proper result page should still intersect them with:
 *   - labour-market evidence;
 *   - required diploma / certification;
 *   - geography;
 *   - salary floor;
 *   - user urgency;
 *   - proof from the user's real past experience.
 */
export const PROFILE_SIGNAL_LENSES: ProfileSignalLens[] = [
  {
    id: "profil_architecte_operationnel",
    title: "Structureur opérationnel",
    description: "Fort signal système + coordination + diagnostic. Intéressant quand la personne aime comprendre comment le travail circule réellement.",
    positiveClusters: [
      "systemes",
      "coordination",
      "diagnostic",
      "organisation",
      "leverage",
    ],
    cautionSignals: [
      "besoin_clarte",
      "execution",
    ],
    riasec: ["I", "C", "E"],
  },
  {
    id: "profil_support_technique",
    title: "Support technique / résolution",
    description: "Fort signal diagnostic + support + investigation. Convient mieux quand la relation client ne détruit pas l'énergie.",
    positiveClusters: [
      "support",
      "diagnostic",
      "investigation",
      "resolution",
      "technique",
    ],
    cautionSignals: [
      "besoin_calme",
      "gestion_conflit",
    ],
    riasec: ["I", "R", "S"],
  },
  {
    id: "profil_coordinateur_service",
    title: "Coordination de service",
    description: "Fort signal organisation + planification + relances. Peut aller vers opérations, planning, ADV, interventions ou dossiers.",
    positiveClusters: [
      "coordination",
      "planification",
      "organisation",
      "relation_client",
      "fiabilite",
    ],
    cautionSignals: [
      "contact",
      "besoin_calme",
    ],
    riasec: ["C", "E", "S"],
  },
  {
    id: "profil_data_admin_quality",
    title: "Données / administratif qualité",
    description: "Fort signal rigueur + données + contrôle. Utile pour back-office, conformité, reporting ou qualité opérationnelle.",
    positiveClusters: [
      "gestion_donnees",
      "rigueur",
      "qualite",
      "documentation",
      "reporting",
    ],
    cautionSignals: [
      "contact",
      "execution",
    ],
    riasec: ["C", "I"],
  },
  {
    id: "profil_commercial_consultatif",
    title: "Commercial consultatif",
    description: "Fort signal persuasion + business analysis + aisance senior. À distinguer d'un call-center pur.",
    positiveClusters: [
      "vente",
      "persuasion",
      "business_analysis",
      "assurance",
      "influence",
    ],
    cautionSignals: [
      "gestion_conflit",
      "besoin_calme",
    ],
    riasec: ["E", "S", "I"],
  },
  {
    id: "profil_formateur_enablement",
    title: "Transmission / formation",
    description: "Fort signal pédagogie + documentation + contact. Intéressant pour onboarding, formation interne ou accompagnement utilisateur.",
    positiveClusters: [
      "formation",
      "pedagogie",
      "transmission",
      "documentation",
      "service",
    ],
    cautionSignals: [
      "contact",
      "besoin_calme",
    ],
    riasec: ["S", "C"],
  },
  {
    id: "profil_terrain_service",
    title: "Terrain / service concret",
    description: "Fort signal terrain + manuel + exécution. À filtrer fortement par contraintes physiques, horaires et mobilité.",
    positiveClusters: [
      "terrain",
      "manuel",
      "execution",
      "service",
      "resolution",
    ],
    cautionSignals: [
      "c_physical",
      "mobility",
    ],
    riasec: ["R", "S"],
  },
  {
    id: "profil_builder_independant",
    title: "Constructeur indépendant",
    description: "Fort signal autonomie + systèmes + risque. À lire avec les réponses argent/autonomie, pas seulement avec les compétences.",
    positiveClusters: [
      "autonomie",
      "systemes",
      "scalabilite",
      "decision_incertitude",
      "strategie",
    ],
    cautionSignals: [
      "appetit_risque",
      "pull_autonomie",
    ],
    riasec: ["E", "I", "C"],
  },
];

// ---------------------------------------------------------------------------
// The full ordered quiz
// ---------------------------------------------------------------------------

export const CATEGORIES: Category[] = [
  CAT_FONCTIONNES,
  CAT_SAIS_FAIRE,
  CAT_GENS,
  CAT_CONTRAINTES,
  CAT_ARGENT,
];

export const QUIZ_VERSION = "fuller-40q-v1";

export const QUIZ_STATS = {
  version: QUIZ_VERSION,
  categoryCount: CATEGORIES.length,
  sceneCount: CATEGORIES.reduce((sum, category) => sum + category.scenes.length, 0),
  quickPickCount: CATEGORIES.reduce(
    (sum, category) => sum + category.quickPicks.length,
    0,
  ),
};

export const SCENES_BY_ID: Record<string, Scene> = Object.fromEntries(
  CATEGORIES.flatMap((category) => category.scenes).map((scene) => [scene.id, scene]),
);

export const QUICK_PICKS_BY_ID: Record<string, QuickPick> = Object.fromEntries(
  CATEGORIES.flatMap((category) => category.quickPicks).map((quickPick) => [
    quickPick.id,
    quickPick,
  ]),
);

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((candidate) => candidate.id === id);
  if (!category) throw new Error(`Unknown category id: ${id}`);
  return category;
}

export function getScene(id: string): Scene {
  const scene = SCENES_BY_ID[id];
  if (!scene) throw new Error(`Unknown scene id: ${id}`);
  return scene;
}

export function getQuickPick(id: string): QuickPick {
  const quickPick = QUICK_PICKS_BY_ID[id];
  if (!quickPick) throw new Error(`Unknown quick-pick id: ${id}`);
  return quickPick;
}

export function getAllScenes(): Scene[] {
  return CATEGORIES.flatMap((category) => category.scenes);
}

export function getAllQuickPicks(): QuickPick[] {
  return CATEGORIES.flatMap((category) => category.quickPicks);
}

export function getQuizStats(): typeof QUIZ_STATS {
  return QUIZ_STATS;
}

/**
 * Small config validation helper for development/tests.
 * It deliberately returns strings instead of throwing so it can be displayed in
 * a debug panel or unit test failure without breaking the app at import time.
 */
export function validateQuizConfig(): string[] {
  const errors: string[] = [];
  const sceneIds = new Set<string>();
  const quickPickIds = new Set<string>();
  const categoryIds = new Set<string>();

  for (const category of CATEGORIES) {
    if (categoryIds.has(category.id)) {
      errors.push(`Duplicate category id: ${category.id}`);
    }
    categoryIds.add(category.id);

    if (!category.scenes.length) {
      errors.push(`Category has no scenes: ${category.id}`);
    }

    for (const scene of category.scenes) {
      if (sceneIds.has(scene.id)) {
        errors.push(`Duplicate scene id: ${scene.id}`);
      }
      sceneIds.add(scene.id);

      if (!scene.prompt.trim()) {
        errors.push(`Scene has an empty prompt: ${scene.id}`);
      }

      if (!scene.optionA.label.trim()) {
        errors.push(`Scene has an empty optionA label: ${scene.id}`);
      }

      if (!scene.optionB.label.trim()) {
        errors.push(`Scene has an empty optionB label: ${scene.id}`);
      }
    }

    for (const quickPick of category.quickPicks) {
      if (quickPickIds.has(quickPick.id)) {
        errors.push(`Duplicate quick-pick id: ${quickPick.id}`);
      }
      quickPickIds.add(quickPick.id);

      if (!quickPick.options.length) {
        errors.push(`Quick-pick has no options: ${quickPick.id}`);
      }
    }
  }

  for (const sceneId of Object.keys(TENSION_MAP)) {
    if (!sceneIds.has(sceneId)) {
      errors.push(`TENSION_MAP references an unknown scene: ${sceneId}`);
    }
  }

  for (const sceneId of Object.keys(FINANCIAL_MAP)) {
    if (!sceneIds.has(sceneId)) {
      errors.push(`FINANCIAL_MAP references an unknown scene: ${sceneId}`);
    }
  }

  return errors;
}
