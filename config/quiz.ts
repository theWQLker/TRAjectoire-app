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
  /**
   * This answer's link to the cluster feeds the lean only, not the cluster's
   * competence codes (decision 2026-11-22): used when the answer leans toward a
   * cluster but evidences none of its skills. The weight is unchanged.
   */
  leanOnly?: true;
};

/** What one relief-option maps to. */
export type SideMapping = {
  clusters?: ClusterWeight[];
  riasec?: RiasecCode[];
  /**
   * The option states a work context or a preference, not a skill (decision
   * 2026-11-22). Its clusters still feed the lean (clusterScores) and its
   * letters the interest profile, but it never puts competence codes into the
   * inventory: a liking for « l'action » is not evidence of terrain skills.
   */
  contextOnly?: true;
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
  | { kind: "constraint"; field: "departement" | "diploma" | "accept_lower" }
  | { kind: "tension"; key: "hours" | "mobility" };

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
  | "contraintes";

export type Category = {
  id: CategoryId;
  title: string;
  /** Shown on the chapter's first page; none when there is nothing true to say. */
  intro?: string;
  scenes: Scene[];
  quickPicks: QuickPick[];
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
    id: "comptabilite",
    label: "comptabilite",
    definition: "Tenir les comptes d'une structure : factures, paiements, trésorerie.",
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
    id: "rh_admin",
    label: "rh admin",
    definition: "Gérer l'administration du personnel : embauches, contrats, absences, paie.",
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
  title: "Votre façon de fonctionner",
  intro: "On commence par votre façon de travailler. Pas par les métiers ni les titres. Ici, on regarde ce qui vous vient naturellement, ce qui vous fatigue, et comment vous réagissez face à un problème.",
  scenes: [
    {
      // Scene 01 — f_order_improv
      id: "f_order_improv",
      prompt: "Vous arrivez sur un projet désorganisé.",
      optionA: 
        {
          label: "Je commence par remettre de l'ordre.",
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
          label: "Je commence à avancer, puis je structure ensuite.",
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
      prompt: "On vous donne une explication qui semble logique.",
      optionA: 
        {
          label: "Ça me suffit pour avancer.",
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
          label: "J'ai besoin de comprendre ce qui se passe vraiment.",
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
      prompt: "Vous avez dix tâches à faire, mais pas assez de temps pour tout finir.",
      optionA: 
        {
          label: "Je fais d'abord celle qui aura le plus d'impact.",
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
          label: "J'essaie de tout traiter dans l'ordre.",
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
      prompt: "Vous devez décider alors qu'il manque des informations.",
      optionA: 
        {
          label: "Je décide, puis j'ajuste si besoin.",
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
          label: "J'attends d'avoir plus d'éléments.",
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
      prompt: "Une même demande revient plusieurs fois.",
      optionA: 
        {
          label: "Je cherche une solution réutilisable.",
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
          label: "Je traite la demande à chaque fois, simplement.",
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
      prompt: "On vous donne une consigne pas assez claire.",
      optionA: 
        {
          label: "Je pose des questions avant de commencer.",
          maps: {
            clusters: [
              { id: "clarification", weight: 2 },
              // leanOnly (decision 2026-11-22): asking questions is not writing, so
              // this answer no longer brings 489964 Rédaction d'écrits professionnels.
              { id: "documentation", weight: 1, leanOnly: true },
              { id: "besoin_clarte", weight: 1 },
            ],
            riasec: ["C", "S"],
          },
        },
      optionB: 
        {
          label: "Je fais une première version, puis je corrige vite.",
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
          label: "Je cherche pourquoi il revient.",
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
          label: "Je le règle vite et je passe à autre chose.",
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
      prompt: "Vous devez apprendre un sujet nouveau.",
      optionA: 
        {
          label: "Je cherche d'abord les bases, les mots et les règles.",
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
          label: "Je veux surtout savoir quoi faire pour être utile vite.",
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
      prompt: "Vous regardez un processus compliqué.",
      optionA: 
        {
          label: "Je repère d'abord les détails qui peuvent bloquer.",
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
          label: "Je repère d'abord la structure générale.",
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
      prompt: "Dans quel cadre réfléchissez-vous le mieux ?",
      optionA: 
        {
          label: "Au calme, avec du temps pour me concentrer.",
          maps: {
            clusters: [
              { id: "analyse", weight: 2 },
              { id: "besoin_calme", weight: 2 },
              { id: "autonomie", weight: 1 },
            ],
            riasec: ["I", "C"],
            contextOnly: true, // decision 2026-11-22: a work-context preference, not a skill
          },
        },
      optionB: 
        {
          label: "Dans l'action, avec du mouvement et des échanges.",
          maps: {
            clusters: [
              { id: "adaptabilite", weight: 2 },
              { id: "terrain", weight: 1 },
              { id: "contact", weight: 1 },
            ],
            riasec: ["R", "E", "S"],
            contextOnly: true, // decision 2026-11-22: a work-context preference, not a skill
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
  title: "Ce que vous savez déjà faire",
  intro: "Ici, on cherche des preuves concrètes. Pas le métier que vous aimeriez avoir, mais ce que vous avez déjà fait : job alimentaire, formation, mission courte, association ou projet personnel.",
  scenes: [
    {
      // Scene 11 — sf_numbers_people
      id: "sf_numbers_people",
      prompt: "Quelle journée de travail vous paraît la plus naturelle ?",
      optionA: 
        {
          label: "Vérifier, calculer, classer, appliquer des règles précises.",
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
          label: "Échanger avec des personnes, comprendre leurs demandes, gérer la relation.",
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
      prompt: "Quand vous devez aider concrètement, vous allez plutôt vers quoi ?",
      optionA: 
        {
          label: "Faire avec mes mains et livrer un résultat concret.",
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
          label: "Organiser les étapes et coordonner les personnes.",
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
      prompt: "Dans quoi vous êtes-vous déjà senti à l'aise ?",
      optionA: 
        {
          label: "Convaincre, négocier ou lancer une conversation.",
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
          label: "Réparer, faire fonctionner ou résoudre un problème technique.",
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
      prompt: "Quand vous devez transmettre une information compliquée.",
      optionA: 
        {
          label: "Je préfère écrire clairement : structurer, résumer, clarifier.",
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
          label: "Je préfère expliquer à l'oral, montrer et répondre aux questions.",
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
      // Scene — sf_create_express (creative-identifying question, BATCH 1).
      // The only scene-side that activates the `creation` cluster: it lets a
      // person DECLARE they shape something expressive, so creative profiles
      // surface their OWN communication/spectacle range instead of drifting to
      // generic accueil/service. The B-side is a non-creative deliver-to-spec
      // lean, so the scene discriminates (only A injects creative vocabulary).
      id: "sf_create_express",
      prompt: "Quand on vous confie un travail, qu'est-ce qui vous ressemble le plus ?",
      optionA:
        {
          label: "J'aime donner une forme claire à une idée.",
          maps: {
            clusters: [
              { id: "creation", weight: 2 },
              { id: "ecriture", weight: 1 },
            ],
            riasec: ["A"],
          },
        },
      optionB:
        {
          label: "Je préfère livrer ce qui est demandé.",
          maps: {
            clusters: [
              { id: "execution", weight: 1 },
              { id: "fiabilite", weight: 1 },
            ],
            riasec: ["C"],
          },
        },
    },
    {
      // Scene 15 — sf_data_files
      id: "sf_data_files",
      prompt: "Face à un fichier Excel ou une liste en désordre.",
      optionA: 
        {
          label: "Je nettoie, je range et je rends fiable.",
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
          label: "Je cherche ce que les données montrent.",
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
      prompt: "Quand vous découvrez un nouvel outil numérique.",
      optionA: 
        {
          label: "Je règle les étapes, les statuts, les accès et les champs.",
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
          label: "Je l'utilise vite pour produire ce qu'on me demande.",
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
      prompt: "Un client signale un problème pas clair.",
      optionA: 
        {
          label: "Je reconstruis le chemin : étapes, captures, logs, contexte.",
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
          label: "Je rassure d'abord, puis je fais avancer la demande.",
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
      prompt: "Un dossier passe par plusieurs personnes.",
      optionA: 
        {
          label: "Je suis les statuts, les relances et les blocages.",
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
          label: "Je fais bien ma partie et j'attends la suite.",
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
      prompt: "Quelqu'un arrive sur un sujet que vous connaissez.",
      optionA: 
        {
          label: "Je lui explique étape par étape jusqu'à ce qu'il soit autonome.",
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
          label: "Je lui prépare une procédure claire à suivre.",
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
      // Scene 20 — sf_people_accounts (decision 2026-11-21). Replaces
      // sf_commercial_signal (« Dans une conversation professionnelle. »), the
      // scored scene with the least vocabulary: its main clusters
      // (business_analysis, leverage, execution, besoin_clarte) carry no skill.
      // This one names the two office fields no other answer names: HR/payroll
      // (M15) and accounting (M12).
      id: "sf_people_accounts",
      prompt: "Deux dossiers attendent sur votre bureau.",
      optionA:
        {
          label: "Je prends celui du personnel : embauches, contrats, absences, paie.",
          maps: {
            clusters: [
              { id: "rh_admin", weight: 2 },
            ],
            riasec: ["C", "S"],
          },
        },
      optionB:
        {
          label: "Je prends celui des comptes : factures, paiements, trésorerie.",
          maps: {
            clusters: [
              { id: "comptabilite", weight: 2 },
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
  title: "Votre façon d'interagir",
  intro: "Cette partie ne juge pas si vous êtes sociable. Elle regarde quels échanges professionnels vous donnent de l'énergie et lesquels vous en prennent.",
  scenes: [
    {
      // Scene 21 — g_conflict
      id: "g_conflict",
      prompt: "Vous devez rappeler trois clients mécontents.",
      optionA: 
        {
          label: "J'appelle, je clarifie, je gère la tension.",
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
          label: "Je préfère préparer une réponse écrite ou un cadre clair.",
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
          label: "Je prends naturellement la responsabilité de faire avancer.",
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
          label: "Je préfère tenir mon rôle correctement.",
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
          label: "J'explique et je transmets, ça me plaît.",
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
          label: "Je fais à sa place si c'est plus rapide.",
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
      prompt: "Une journée avec beaucoup d'interactions.",
      optionA: 
        {
          label: "Ça me stimule si les échanges ont un objectif clair.",
          maps: {
            clusters: [
              { id: "contact", weight: 2 },
              { id: "collectif", weight: 1 },
              { id: "influence", weight: 1 },
            ],
            riasec: ["S", "E"],
            contextOnly: true, // decision 2026-11-22: what gives energy, not a skill
          },
        },
      optionB: 
        {
          label: "Ça me fatigue, même quand les gens sont corrects.",
          maps: {
            clusters: [
              { id: "besoin_calme", weight: 2 },
              { id: "autonomie", weight: 1 },
              { id: "analyse", weight: 1 },
            ],
            riasec: ["I", "C"],
            contextOnly: true, // decision 2026-11-22: what takes energy, not a skill
          },
        },
    },
    {
      // Scene 25 — g_boundaries
      id: "g_boundaries",
      prompt: "Quelqu'un prend trop de votre disponibilité.",
      optionA: 
        {
          label: "Je pose une limite claire.",
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
          label: "J'aide quand même pour éviter la tension.",
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
      prompt: "Vous devez parler à quelqu'un de plus expérimenté ou plus haut placé.",
      optionA: 
        {
          label: "Je vais droit au sujet avec des faits.",
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
          label: "Je préfère avoir un script ou une validation avant.",
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
      prompt: "Une personne demande quelque chose, mais vous sentez que le vrai besoin est ailleurs.",
      optionA: 
        {
          label: "Je reformule pour faire préciser le vrai problème.",
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
          label: "Je réponds à la demande telle qu'elle est formulée.",
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
// Category — Vos contraintes réelles
// ===========================================================================
// Round 4 (2026-11-23): the seven constraint scenes and five of the six money
// scenes were cut, because nothing in the engine read what they stored (data
// minimisation; text in docs/parked/2026-11-23_cut-quiz-scenes.md). The false
// intro went with them. ar_learning_investment (side A switches the level
// demote off) moved here from « Argent et autonomie », which is gone.
const CAT_CONTRAINTES: Category = {
  id: "contraintes",
  title: "Vos contraintes réelles",
  scenes: [
    {
      // Scene 39 — ar_learning_investment
      id: "ar_learning_investment",
      prompt: "Pour accéder à une meilleure option.",
      optionA: 
        {
          label: "Je ne peux pas rester longtemps sans revenu.",
          maps: {
            clusters: [],
            riasec: [],
          },
        },
      optionB: 
        {
          label: "Je peux fournir un effort d'apprentissage si le retour est réaliste.",
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
      prompt: "Où voulez-vous chercher ? (plusieurs choix possibles)",
      help: "Choisissez tous les départements qui vous conviennent. Les métiers proposés sont vérifiés sur les annonces de ces départements, avec un lien vers leurs offres en ligne. Sans réponse, on regarde Paris.",
      multi: true,
      target: { kind: "constraint", field: "departement" },
      options: [
        {
          id: "75",
          label: "Paris (75)",
          value: "75",
        },
        {
          id: "77",
          label: "Seine-et-Marne (77)",
          value: "77",
        },
        {
          id: "78",
          label: "Yvelines (78)",
          value: "78",
        },
        {
          id: "91",
          label: "Essonne (91)",
          value: "91",
        },
        {
          id: "92",
          label: "Hauts-de-Seine (92)",
          value: "92",
        },
        {
          id: "93",
          label: "Seine-Saint-Denis (93)",
          value: "93",
        },
        {
          id: "94",
          label: "Val-de-Marne (94)",
          value: "94",
        },
        {
          id: "95",
          label: "Val-d'Oise (95)",
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
      prompt: "Quel est votre diplôme validé le plus élevé ?",
      help: "Les métiers qui demandent nettement moins que votre diplôme passent plus bas dans la liste. Aucun n'est retiré.",
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
      // Replaces ar_salaire_min (round 4): asks what the answer did. Old salary
      // bands map through build-inventory (under 1 800 € → oui, others → non).
      id: "c_accept_lower",
      prompt: "Accepteriez-vous un métier qui demande moins que votre diplôme ?",
      help: "Si vous répondez oui, ces métiers gardent leur place dans la liste.",
      target: { kind: "constraint", field: "accept_lower" },
      options: [
        {
          id: "oui",
          label: "Oui",
          value: "yes",
        },
        {
          id: "non",
          label: "Non, je vise mon niveau",
          value: "no",
        },
      ],
    },
  ],
};


// ---------------------------------------------------------------------------
// Cat-4 tension mapping + Cat-5 financial mapping
// ---------------------------------------------------------------------------

/**
 * Cat-4 scene side → tension/constraint signal. Empty since round 4
 * (2026-11-23): the scenes that set tensions and urgency were cut because
 * nothing read them. The mechanism stays for a scene that gets a reader.
 */
export const TENSION_MAP: Record<
  string,
  { a: { key: string; value: string }; b: { key: string; value: string } }
> = {};

/**
 * Scene side → financial input. Only training_investment is left (round 4):
 * side A ("limited") switches the level demote off (level-demote.ts).
 */
export const FINANCIAL_MAP: Record<
  string,
  { a: { field: string; value: string }; b: { field: string; value: string } }
> = {
  ar_learning_investment: {
    a: { field: "training_investment", value: "limited" },
    b: { field: "training_investment", value: "open_if_return_clear" },
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
];

export const QUIZ_VERSION = "fuller-29q-v3"; // v3 2026-11-23: 12 scenes nothing read cut, ar_salaire_min → c_accept_lower. // v2 2026-11-21: sf_commercial_signal → sf_people_accounts

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
