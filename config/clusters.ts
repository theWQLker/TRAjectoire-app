/**
 * Competency clusters (PRD §6.1 + quiz-full-spec §6).
 *
 * A cluster = a named set of ROME competency codes/labels + the RIASEC letters
 * it leans toward. It maps quiz answers <-> ROME competency vocabulary. ROME is
 * the shared language only; clusters do not score the market — the engine
 * (PRD §6.2/§6.3) scores from offer data. The quiz DOES score clusters
 * (weighted accumulation, see build-inventory.ts) to know which clusters a user
 * leans into; that lean drives which competence codes enter the Inventory.
 *
 * Two kinds of cluster (quiz-full-spec §6):
 *   - Hard-skill clusters (paie, relation_client, food, …) bridge DIRECTLY to
 *     ROME métiers. Their competenceCodes are REAL France Travail codes verified
 *     against /fixtures/offers/*.json.
 *   - Transversal / meta clusters (systemes, analyse, leverage, …) capture a
 *     way-of-working signal. Their ROME-code mapping is a P5 task: until the
 *     live 532-métier graph is queried, they carry NO competence codes (an empty
 *     list injects nothing into the Inventory) and lean on RIASEC alone.
 *
 * A cluster with no real ROME codes surfaces nothing on its own — that is the
 * intended behaviour for transversal clusters in the MVP.
 */
import type { RiasecCode } from "@/lib/rome";

export type Cluster = {
  id: string;
  label: string;
  /** RIASEC letters this cluster leans toward (quiz-full-spec §6). */
  riasec: RiasecCode[];
  /** ROME competency codes that belong to this cluster (empty = P5 unverified). */
  competenceCodes: string[];
};

// ===========================================================================
// Hard-skill clusters — bridge directly to ROME métiers.
// Every code is a REAL France Travail competence code observed in the live
// dept-75 pull (scripts/pull-live-offers.ts) and present in /fixtures/offers.
// Re-verify with: node scripts/list-competence-codes.cjs after a fresh pull.
// ===========================================================================
const HARD_SKILL_CLUSTERS: Cluster[] = [
  {
    id: "paie",
    label: "Paie / administration du personnel",
    riasec: ["C"],
    competenceCodes: [
      "300306", // Gérer la paie (M1203)
      "489445", // Collecter les informations nécessaires à l'établissement des paies (M1203)
      "100343", // Législation sociale (M1501)
      "124607", // Réaliser des déclarations réglementaires (M1501)
      "300324", // Concevoir des supports de suivi et de gestion (M1501)
      "482249", // Assurer une veille réglementaire et législative (M1501)
      "105672", // Réaliser la gestion administrative du personnel (M1607)
      "522047", // Assistant de gestion et d'administration du personnel (M1607)
      "489769", // Contribuer à la gestion des ressources humaines (M1607)
    ],
  },
  {
    id: "relation_client",
    label: "Relation client / contact usager",
    riasec: ["S"],
    competenceCodes: [
      "478215", // Principes de la relation client (D1408)
      "121862", // Techniques de vente par téléphone (D1408)
      "100381", // Argumentation commerciale (D1408)
      "501073", // Proposer des solutions adaptées aux besoins clients (D1408)
      "122327", // Recueillir l'avis et les remarques d'un client (M1704)
      "124094", // Traiter les demandes de support technique (M1704)
      "100541", // Techniques de communication orales, écrites et numériques (M1704)
      "300184", // Apporter une assistance technique aux équipes (M1810)
      "109971", // Diagnostiquer la nature/origine des incidents... (M1810)
      "101901", // Accueillir le client et l'installer (G1803)
      "104324", // Prendre une commande client (G1803)
      "300556", // Conseiller le client dans ses choix... (G1803)
      "403015", // Garantir la satisfaction du client (G1803)
      "300361", // Accueillir, orienter, renseigner un public (M1607)
      "485132", // Répondre aux appels téléphoniques, mails... renseigner les clients (M1607)
      "518355", // Répondre aux demandes d'information internes et externes (M1607)
    ],
  },
  {
    id: "food",
    label: "Cuisine / restauration",
    riasec: ["R"],
    competenceCodes: [
      "124947", // Eplucher des légumes et des fruits (G1602)
      "124935", // Dresser des plats pour le service (G1602)
      "104207", // Préparer les viandes et les poissons (G1602)
      "124919", // Cuire des viandes, poissons ou légumes (G1602)
      "119439", // Cuisiner des sauces (G1602)
      "117933", // Effectuer le service des plats à table (G1803)
      "117932", // Réaliser la mise en place de la salle et de l'office (G1803)
      "104325", // Techniques du service en salle (G1803)
      "124961", // Préparer des boissons chaudes ou froides (G1803)
    ],
  },

  // --- New hard-skill clusters (quiz-full-spec §6, from Cat 2) -------------
  // These name a hard skill but their verified code lists are a P5 task. Some
  // overlap heavily with the verified clusters above; rather than duplicate
  // unverified codes, they carry [] and lean on RIASEC until P5 maps them.
  {
    id: "gestion_donnees",
    label: "Gestion de données / chiffres / règles",
    riasec: ["C"],
    competenceCodes: [
      "300067", // Analyser, exploiter, structurer des données
      "300452", // Collecter et analyser des données, des informations
      "300253", // Contrôler la conformité des données
      "300431", // Mettre à jour un dossier, une base de données
    ],
  },
  {
    id: "contact",
    label: "Contact / accueil / gestion des demandes",
    riasec: ["S"],
    competenceCodes: [
      "300361", // Accueillir, orienter, renseigner un public
      "300363", // Identifier, traiter une demande client
      "300364", // Répondre aux attentes d'un client
      "300366", // Recueillir et analyser les besoins client
    ],
  },
  {
    id: "terrain",
    label: "Travail manuel / terrain / service rapide",
    riasec: ["R"],
    competenceCodes: [
      "300232", // Fabriquer, façonner des produits
      "300210", // Transformer une matière première
      "300153", // Utiliser un outil, une machine, un équipement, une installation
      "300152", // Préparer du matériel en prévision d'un travail
    ],
  },
  {
    id: "organisation",
    label: "Organisation / planification / coordination",
    riasec: ["C", "E"],
    competenceCodes: [
      "300436", // Organiser le travail d'une équipe
      "300464", // Gérer un planning
      "300488", // Concevoir et gérer un projet
      "300261", // Organiser et contrôler un approvisionnement
    ],
  },
  {
    id: "vente",
    label: "Vente / négociation",
    riasec: ["E"],
    competenceCodes: [
      "300368", // Vendre ou louer des produits ou des services
      "300371", // Prospecter de nouveaux clients, de nouveaux marchés
      "300374", // Présenter et valoriser un produit ou un service
      "300377", // Elaborer, adapter une proposition commerciale
    ],
  },
  {
    id: "persuasion",
    label: "Persuasion / conviction",
    riasec: ["E"],
    competenceCodes: [
      "300415", // Convaincre, négocier
      "300418", // Promouvoir une proposition, un projet
      "300413", // Prendre la parole en public
    ],
  },
  {
    id: "resolution",
    label: "Résolution / réparation / dépannage technique",
    riasec: ["R", "I"],
    competenceCodes: [
      "300185", // Réaliser un diagnostic technique
      "300182", // Réparer un équipement, une machine, une installation
      "300179", // Effectuer les opérations de réparation
      "300183", // Réaliser une opération de maintenance
    ],
  },
  {
    id: "support",
    label: "Support / assistance technique",
    riasec: ["R", "I"],
    competenceCodes: [
      "300184", // Apporter une assistance technique aux équipes
      "300181", // Entretenir un équipement, une machine, une installation
      "300019", // Accompagner l'appropriation d'un outil par ses utilisateurs
    ],
  },
];

// ===========================================================================
// Transversal / meta clusters — way-of-working signals (quiz-full-spec §6,
// from Cat 1 & 3). RIASEC-only in the MVP; competenceCodes is a P5 task.
// Each comment names the kind of ROME code whose presence would indicate the
// meta-skill, so P5 can replace [] with verified codes from the live graph.
// ===========================================================================
const TRANSVERSAL_CLUSTERS: Cluster[] = [
  {
    id: "systemes",
    label: "Mettre en système / structurer / concevoir un process",
    riasec: ["C", "I"],
    competenceCodes: [
      "300324", // Concevoir des supports de suivi et de gestion
      "300321", // Concevoir des outils de pilotage, indicateurs, tableaux de bord
      "300457", // Définir et faire évoluer des procédés de traitement de l'information
      "300146", // Elaborer des processus et des modes opératoires techniques
    ],
  },
  {
    id: "analyse",
    label: "Analyser / creuser le vrai mécanisme",
    riasec: ["I"],
    competenceCodes: [
      "300456", // Analyser une situation et produire un diagnostic
      "300082", // Analyser, résoudre un problème courant ou complexe
      "300067", // Analyser, exploiter, structurer des données (shared with gestion_donnees)
    ],
  },
  {
    id: "leverage",
    label: "Effet de levier / faire ce qui change le plus",
    riasec: ["E", "I"],
    competenceCodes: [], // P5: no honest MACRO carrier — "high-impact prioritisation" is a trait, not a ROME skill (deterministic-vs-LLM boundary)
  },
  {
    id: "rigueur",
    label: "Rigueur / faire les choses proprement dans l'ordre",
    riasec: ["C"],
    competenceCodes: [
      "300490", // Faire preuve de rigueur et de précision
      "300448", // Respecter des règles, des consignes, normes et procédures opérationnelles
      "300446", // Respecter les règles de Qualité, Hygiène, Sécurité, Santé et Environnement (QHSSE)
    ],
  },
  {
    id: "adaptabilite",
    label: "Adaptabilité / avancer au feeling",
    riasec: ["R", "E"],
    competenceCodes: [
      "402000", // Faire preuve d'agilité dans son action selon les contextes
      "300473", // Faire preuve de réactivité
      "300479", // Etre ouvert aux changements
    ],
  },
  {
    id: "decision_incertitude",
    label: "Décider dans l'incertitude / trancher",
    riasec: ["E"],
    competenceCodes: [
      "300459", // Prendre une décision et l'expliquer
      "300353", // Evaluer une situation à risques
      "300474", // Alerter, demander un appui ou un arbitrage
    ],
  },
  {
    id: "autonomie",
    label: "Autonomie",
    riasec: ["E"],
    competenceCodes: [
      "300460", // Faire preuve d'autonomie
      "300483", // Organiser son travail selon les priorités et les objectifs
    ],
  },
  {
    id: "detection_incoherence",
    label: "Détection d'incohérence",
    riasec: ["I"],
    competenceCodes: [
      "300253", // Contrôler la conformité des données (shared with gestion_donnees)
      "300256", // Contrôler la qualité et la conformité d'un livrable
      "300322", // Contrôler des indicateurs de performance, analyser et corriger des écarts
    ],
  },
  {
    id: "scalabilite",
    label: "Scalabilité / construire du réutilisable",
    riasec: ["C", "I"],
    competenceCodes: [
      "300321", // Concevoir des outils de pilotage, indicateurs, tableaux de bord (shared with systemes)
      "300146", // Elaborer des processus et des modes opératoires techniques (shared with systemes)
      "300453", // Organiser le partage et la capitalisation de l'information
    ],
  },
  {
    id: "execution",
    label: "Exécution / faire le truc et avancer",
    riasec: ["R"],
    competenceCodes: [], // P5: no honest MACRO carrier — generic "execute a task" doesn't exist; every réaliser/exécuter code is domain-bound (deterministic-vs-LLM boundary)
  },
  {
    id: "priorisation",
    label: "Priorisation",
    riasec: ["C", "E"],
    competenceCodes: [
      "300483", // Organiser son travail selon les priorités et les objectifs (shared with autonomie)
      "300464", // Gérer un planning (shared with organisation)
      "300435", // Optimiser les effectifs, l'adéquation et l'allocation des ressources
    ],
  },
  {
    id: "pragmatisme",
    label: "Pragmatisme / le simple qui marche",
    riasec: ["R"],
    competenceCodes: [], // P5: no honest MACRO carrier — pragmatism is an attitude, not a ROME skill (deterministic-vs-LLM boundary)
  },
  {
    id: "besoin_clarte",
    label: "Besoin de clarté / attendre d'y voir clair",
    riasec: ["C"],
    competenceCodes: [], // P5: a need/preference, not a skill — no competence-code carrier; tie-break signal only (deterministic-vs-LLM boundary)
  },
  {
    id: "leadership",
    label: "Leadership / prendre le lead",
    riasec: ["E"],
    competenceCodes: [
      "300489", // Faire preuve de leadership
      "300440", // Animer, coordonner une équipe
      "300436", // Organiser le travail d'une équipe (shared with organisation)
      "300434", // Déléguer, responsabiliser
    ],
  },
  {
    id: "fiabilite",
    label: "Fiabilité / bien tenir son poste",
    riasec: ["C"],
    competenceCodes: [
      "300461", // Faire preuve de sens des responsabilités
      "300462", // Rendre compte de son activité
      "300448", // Respecter des règles, des consignes, normes et procédures opérationnelles (shared with rigueur)
    ],
  },
  {
    id: "transmission",
    label: "Transmission / expliquer, faire comprendre",
    riasec: ["S"],
    competenceCodes: [
      "300021", // Transmettre une technique, un savoir-faire
      "300020", // Transmettre une méthodologie, un procédé
      "300022", // Enseigner, développer des compétences (shared with pedagogie)
    ],
  },
  {
    id: "pedagogie",
    label: "Pédagogie",
    riasec: ["S"],
    competenceCodes: [
      "300022", // Enseigner, développer des compétences (shared with transmission)
      "300024", // Concevoir des supports de formation
      "300014", // Conseiller, accompagner une personne
    ],
  },
  {
    id: "gestion_conflit",
    label: "Gestion de conflit",
    riasec: ["S", "E"],
    competenceCodes: [
      "300441", // Prévenir et résoudre les conflits
      "300480", // Gérer une situation conflictuelle
      "300345", // Gérer des réclamations et litiges
    ],
  },
  {
    id: "besoin_calme",
    label: "Besoin de calme / éviter le conflit",
    riasec: ["C"],
    competenceCodes: [], // P5: a preference (low-fit signal), the inverse of a skill — nothing to map (deterministic-vs-LLM boundary)
  },

  // --- Type-A range-gap clusters, BATCH 1 (creative/expressive range) -------
  // Triage found these 4 were referenced by the quiz but undefined → they
  // injected ZERO vocabulary, so the creative profile drifted to generic
  // accueil/service (C1201) for lack of its OWN words. Each carries REAL ROME
  // MACRO codes (verified in rome_competences, scripts/_b1-confirm.ts), chosen
  // mid-idf and concept-specific to refine a range, never to classify a domain.
  // LEAK GUARD: none carries the accueil family 300361/300363/300366/300014
  // (the C1201 carriers) — verified zero. Coherence-increasing, range-widening.
  {
    id: "ecriture",
    label: "Ecriture / écrire clair pour transmettre, cadrer, synthétiser",
    riasec: ["C", "I"],
    competenceCodes: [
      "300408", // Rédiger un rapport, un compte rendu d'activité
      "300188", // Rédiger un cahier des charges, des spécifications techniques
      "102226", // Normes rédactionnelles
    ],
  },
  {
    id: "presentation",
    label: "Présentation / expliquer à l'oral, animer, défendre une idée",
    riasec: ["S", "E"],
    competenceCodes: [
      "300469", // Préparer et animer une réunion, un groupe de travail, un atelier
      "300374", // Présenter et valoriser un produit ou un service (shared with vente)
      "404536", // Représenter sa structure ou son service lors d'un événement
    ],
  },
  {
    id: "iteration",
    label: "Itération / tester vite puis améliorer sur retour réel",
    riasec: ["R", "E"],
    competenceCodes: [
      "300080", // Procéder à des tests, expérimentations
      "300073", // Concevoir et faire évoluer un modèle, un prototype
      "101315", // Analyse de données expérimentales
    ],
  },
  {
    id: "synthese",
    label: "Synthèse / réduire une masse d'information à l'essentiel",
    riasec: ["I", "C"],
    competenceCodes: [
      "300458", // Structurer, synthétiser des informations
    ],
  },

  // --- Creative-DISTINCTIVE cluster (the creative QUESTION gap, not a vocab
  // gap). The transversal clusters above (ecriture/synthese/presentation) carry
  // generic professional writing/synthesis vocab that lives in admin/industry,
  // so they de-drifted creative away from accueil but couldn't surface CREATIVE
  // roles. This cluster carries codes that are concentrated in communication (E)
  // + spectacle (L) and rare elsewhere (idf 4.6–5.2, verified
  // scripts/_b1-creation.ts) — graphic/visual, audiovisual, staging, promotion
  // of a work. It is referenced by ONE creative-identifying scene-side only
  // (sf_create_express/A), so it activates ONLY when a person declares they
  // shape something expressive — an analyst/hands-on profile never gets "mettre
  // en scène un spectacle". LEAK GUARD: zero accueil-family codes. Skills, not
  // diplomas (the "Licence pro…" credential codes are deliberately excluded).
  {
    id: "creation",
    label: "Création / façonner quelque chose d'expressif (visuel, scénique, audiovisuel)",
    riasec: ["A"],
    competenceCodes: [
      "300116", // Concevoir et réaliser des éléments graphiques et visuels
      "102531", // Techniques d'infographie
      "100518", // Techniques de montage audiovisuel
      "120869", // Logiciels de création vidéo
      "300095", // Mettre en scène un spectacle
      "108930", // Appropriation d'espace scénique
      "122452", // Promouvoir une oeuvre
    ],
  },
];

export const CLUSTERS: Cluster[] = [
  ...HARD_SKILL_CLUSTERS,
  ...TRANSVERSAL_CLUSTERS,
];

export function getCluster(id: string): Cluster {
  const c = CLUSTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown cluster id: ${id}`);
  return c;
}
