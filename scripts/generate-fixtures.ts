/**
 * Fixture generator (PRD build step 11.1 / §3 / §4).
 *
 * Produces 3 sector fixture sets shaped EXACTLY like the France Travail Offres
 * API v2 response (the Offer type, PRD §4):
 *   - paie                  → ROME M1203 (gestion paie / comptabilité), M1501 (assistanat RH)
 *   - support applicatif    → ROME M1810 (production/exploitation SI), M1801 (admin SI)
 *   - food / restauration   → ROME G1602 (personnel de cuisine), G1803 (service en restauration)
 *
 * ~30 offers per sector. Real ROME codes. competences arrays populated with
 * real-style ROME competency labels and stable codes. Île-de-France départements.
 *
 * Deterministic (seeded PRNG, no Date/Math.random at module load) so re-running
 * yields identical fixtures. Run: npx tsx scripts/generate-fixtures.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Offer } from "../src/lib/offers/offer";

// --- deterministic PRNG (mulberry32) -------------------------------------
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const IDF_DEPTS = ["75", "77", "78", "91", "92", "93", "94", "95"];
const CITY_BY_DEPT: Record<string, string[]> = {
  "75": ["Paris 1er", "Paris 9e", "Paris 12e", "Paris 15e", "Paris 17e"],
  "77": ["Meaux", "Melun", "Chelles", "Pontault-Combault"],
  "78": ["Versailles", "Saint-Quentin-en-Yvelines", "Mantes-la-Jolie", "Poissy"],
  "91": ["Évry-Courcouronnes", "Massy", "Palaiseau", "Corbeil-Essonnes"],
  "92": ["Nanterre", "Boulogne-Billancourt", "Courbevoie", "Issy-les-Moulineaux"],
  "93": ["Saint-Denis", "Montreuil", "Aubervilliers", "Bobigny"],
  "94": ["Créteil", "Vincennes", "Ivry-sur-Seine", "Vitry-sur-Seine"],
  "95": ["Cergy", "Argenteuil", "Sarcelles", "Pontoise"],
};

type Comp = { code: string; libelle: string };
type FormationTmpl = { niveau?: string; exigence?: string };

type SectorRome = {
  romeCode: string;
  titles: string[];
  // competence pool; each offer draws a subset
  competences: Comp[];
  contrats: string[]; // weighted by repetition
  formations: FormationTmpl[];
  qualites: string[];
  experiences: { libelle?: string; exige?: string }[];
  permis?: { libelle: string; exigence?: string }[];
};

type Sector = {
  file: string;
  count: number;
  romes: SectorRome[];
};

// --- competence pools (real ROME-style labels) ----------------------------

const SECTORS: Sector[] = [
  {
    file: "paie.json",
    count: 30,
    romes: [
      {
        romeCode: "M1203",
        titles: [
          "Gestionnaire de paie",
          "Gestionnaire de paie confirmé(e)",
          "Gestionnaire paie et administration du personnel",
          "Chargé(e) de paie",
          "Gestionnaire de paie multi-conventions",
          "Comptable paie",
        ],
        competences: [
          { code: "111501", libelle: "Établir un bulletin de paie" },
          { code: "111502", libelle: "Réaliser les déclarations sociales (DSN)" },
          { code: "111503", libelle: "Gérer les soldes de tout compte" },
          { code: "111504", libelle: "Logiciel de paie Silae" },
          { code: "111505", libelle: "Logiciel de paie ADP" },
          { code: "111506", libelle: "Calculer les charges sociales" },
          { code: "111507", libelle: "Gérer l'administration du personnel" },
          { code: "111508", libelle: "Maîtriser les conventions collectives" },
          { code: "111509", libelle: "Tableur Excel niveau avancé" },
          { code: "111510", libelle: "Gérer les absences et arrêts maladie" },
        ],
        contrats: ["CDI", "CDI", "CDI", "CDD", "MIS"],
        formations: [
          { niveau: "Bac+2 ou équivalents", exigence: "E" },
          { niveau: "Bac+3, Bac+4 ou équivalents", exigence: "S" },
          { niveau: "Bac+2 ou équivalents", exigence: "S" },
        ],
        qualites: [
          "Rigueur",
          "Sens de l'organisation",
          "Discrétion",
          "Capacité à respecter les délais",
        ],
        experiences: [
          { libelle: "2 ans", exige: "E" },
          { libelle: "1 an", exige: "S" },
          { libelle: "3 ans", exige: "E" },
          { libelle: "Débutant accepté", exige: "D" },
        ],
      },
      {
        romeCode: "M1501",
        titles: [
          "Assistant(e) ressources humaines",
          "Assistant(e) RH et paie",
          "Gestionnaire administration du personnel",
          "Chargé(e) de gestion administrative RH",
          "Assistant(e) RH généraliste",
        ],
        competences: [
          { code: "150101", libelle: "Gérer l'administration du personnel" },
          { code: "111501", libelle: "Établir un bulletin de paie" },
          { code: "150102", libelle: "Suivre les dossiers du personnel" },
          { code: "150103", libelle: "Rédiger les contrats de travail" },
          { code: "150104", libelle: "Gérer les formalités d'embauche (DPAE)" },
          { code: "111502", libelle: "Réaliser les déclarations sociales (DSN)" },
          { code: "150105", libelle: "Assurer la relation avec les salariés" },
          { code: "111509", libelle: "Tableur Excel niveau avancé" },
          { code: "150106", libelle: "Logiciel SIRH" },
        ],
        contrats: ["CDI", "CDI", "CDD", "CDD", "MIS"],
        formations: [
          { niveau: "Bac+2 ou équivalents", exigence: "E" },
          { niveau: "Bac+3, Bac+4 ou équivalents", exigence: "S" },
        ],
        qualites: [
          "Sens de la confidentialité",
          "Rigueur",
          "Aisance relationnelle",
          "Polyvalence",
        ],
        experiences: [
          { libelle: "1 an", exige: "S" },
          { libelle: "2 ans", exige: "E" },
          { libelle: "Débutant accepté", exige: "D" },
        ],
      },
    ],
  },
  {
    file: "support-applicatif.json",
    count: 30,
    romes: [
      {
        romeCode: "M1810",
        titles: [
          "Technicien(ne) support applicatif",
          "Analyste support applicatif",
          "Chargé(e) de support fonctionnel",
          "Technicien(ne) support N2",
          "Support applicatif métier",
          "Technicien(ne) helpdesk applicatif",
        ],
        competences: [
          { code: "181001", libelle: "Diagnostiquer un incident applicatif" },
          { code: "181002", libelle: "Assurer le support utilisateur N1/N2" },
          { code: "181003", libelle: "Utiliser un outil de ticketing (ServiceNow, GLPI)" },
          { code: "181004", libelle: "Rédiger une documentation technique" },
          { code: "181005", libelle: "Requêtage SQL" },
          { code: "181006", libelle: "Suivre les procédures ITIL" },
          { code: "181007", libelle: "Communiquer avec les utilisateurs métier" },
          { code: "181008", libelle: "Analyser des logs applicatifs" },
          { code: "181009", libelle: "Paramétrer une application métier" },
          { code: "181010", libelle: "Gérer les escalades fournisseurs" },
        ],
        contrats: ["CDI", "CDI", "CDI", "CDD", "MIS"],
        formations: [
          { niveau: "Bac+2 ou équivalents", exigence: "E" },
          { niveau: "Bac+3, Bac+4 ou équivalents", exigence: "S" },
          { niveau: "Bac ou équivalent", exigence: "S" },
        ],
        qualites: [
          "Sens du service client",
          "Capacité d'analyse",
          "Patience",
          "Esprit d'équipe",
        ],
        experiences: [
          { libelle: "2 ans", exige: "E" },
          { libelle: "1 an", exige: "S" },
          { libelle: "Débutant accepté", exige: "D" },
          { libelle: "3 ans", exige: "E" },
        ],
      },
      {
        romeCode: "M1801",
        titles: [
          "Administrateur(rice) systèmes et applicatifs",
          "Administrateur(rice) d'applications",
          "Ingénieur(e) support applicatif",
          "Administrateur(rice) systèmes d'information",
          "Référent(e) applicatif",
        ],
        competences: [
          { code: "180101", libelle: "Administrer une application métier" },
          { code: "181005", libelle: "Requêtage SQL" },
          { code: "180102", libelle: "Gérer les droits et habilitations" },
          { code: "180103", libelle: "Scripter en Shell / PowerShell" },
          { code: "181008", libelle: "Analyser des logs applicatifs" },
          { code: "180104", libelle: "Superviser la production applicative" },
          { code: "181006", libelle: "Suivre les procédures ITIL" },
          { code: "180105", libelle: "Gérer les mises en production" },
          { code: "181004", libelle: "Rédiger une documentation technique" },
        ],
        contrats: ["CDI", "CDI", "CDI", "CDD"],
        formations: [
          { niveau: "Bac+3, Bac+4 ou équivalents", exigence: "E" },
          { niveau: "Bac+5 et plus ou équivalents", exigence: "S" },
          { niveau: "Bac+2 ou équivalents", exigence: "S" },
        ],
        qualites: [
          "Rigueur",
          "Autonomie",
          "Capacité d'analyse",
          "Sens des responsabilités",
        ],
        experiences: [
          { libelle: "3 ans", exige: "E" },
          { libelle: "2 ans", exige: "E" },
          { libelle: "5 ans", exige: "S" },
        ],
      },
    ],
  },
  {
    file: "food-restauration.json",
    count: 30,
    romes: [
      {
        romeCode: "G1602",
        titles: [
          "Cuisinier(ère)",
          "Commis de cuisine",
          "Chef de partie",
          "Cuisinier(ère) de collectivité",
          "Second de cuisine",
          "Cuisinier(ère) traiteur",
        ],
        competences: [
          { code: "160201", libelle: "Préparer les plats chauds et froids" },
          { code: "160202", libelle: "Dresser des plats" },
          { code: "160203", libelle: "Respecter les règles d'hygiène HACCP" },
          { code: "160204", libelle: "Éplucher et découper des légumes" },
          { code: "160205", libelle: "Gérer les stocks et approvisionnements" },
          { code: "160206", libelle: "Cuisiner des sauces" },
          { code: "160207", libelle: "Entretenir le poste de travail" },
          { code: "160208", libelle: "Travailler en coupure / service rapide" },
          { code: "160209", libelle: "Élaborer des menus" },
        ],
        contrats: ["CDI", "CDI", "CDD", "CDD", "MIS", "MIS"],
        formations: [
          { niveau: "CAP, BEP ou équivalents", exigence: "S" },
          { niveau: "CAP, BEP ou équivalents", exigence: "E" },
          { niveau: "Bac ou équivalent", exigence: "S" },
        ],
        qualites: [
          "Résistance au stress",
          "Rapidité d'exécution",
          "Esprit d'équipe",
          "Sens de l'organisation",
        ],
        experiences: [
          { libelle: "1 an", exige: "S" },
          { libelle: "2 ans", exige: "E" },
          { libelle: "Débutant accepté", exige: "D" },
        ],
      },
      {
        romeCode: "G1803",
        titles: [
          "Serveur(se) de restaurant",
          "Employé(e) polyvalent(e) de restauration",
          "Chef de rang",
          "Serveur(se) limonadier",
          "Runner / Commis de salle",
          "Employé(e) de restauration rapide",
        ],
        competences: [
          { code: "180301", libelle: "Accueillir et placer les clients" },
          { code: "180302", libelle: "Prendre une commande client" },
          { code: "180303", libelle: "Réaliser le service en salle" },
          { code: "180304", libelle: "Encaisser un paiement" },
          { code: "180305", libelle: "Dresser les tables" },
          { code: "180306", libelle: "Respecter les règles d'hygiène HACCP" },
          { code: "180307", libelle: "Conseiller le client (carte, menus)" },
          { code: "180308", libelle: "Travailler en coupure / service rapide" },
          { code: "180309", libelle: "Gérer la relation client" },
        ],
        contrats: ["CDI", "CDD", "CDD", "MIS", "MIS"],
        formations: [
          { niveau: "CAP, BEP ou équivalents", exigence: "S" },
          { niveau: "Sans diplôme", exigence: "D" },
        ],
        qualites: [
          "Sens du contact client",
          "Dynamisme",
          "Résistance au stress",
          "Présentation soignée",
        ],
        experiences: [
          { libelle: "Débutant accepté", exige: "D" },
          { libelle: "1 an", exige: "S" },
          { libelle: "2 ans", exige: "E" },
        ],
      },
    ],
  },
];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// pick a subset of size between min..max
function subset<T>(rng: () => number, arr: T[], min: number, max: number): T[] {
  const n = min + Math.floor(rng() * (max - min + 1));
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

// deterministic date string offset from a fixed base (no real clock)
function dateCreation(rng: () => number): string {
  const base = Date.UTC(2026, 4, 1); // 2026-05-01, fixed reference
  const offsetDays = Math.floor(rng() * 45); // last ~6 weeks
  const d = new Date(base + offsetDays * 86400000);
  return d.toISOString();
}

function buildOffer(
  rng: () => number,
  sectorPrefix: string,
  seq: number,
  rome: SectorRome,
): Offer {
  const dept = pick(rng, IDF_DEPTS);
  const city = pick(rng, CITY_BY_DEPT[dept]);
  const exp = pick(rng, rome.experiences);
  const comps = subset(rng, rome.competences, 3, 6).map((c) => ({
    code: c.code,
    libelle: c.libelle,
    // ~60% of listed competences carry an "exigée" requirement marker
    ...(rng() < 0.6 ? { exigence: "E" } : {}),
  }));
  const qualites = subset(rng, rome.qualites, 1, 3).map((libelle) => ({
    libelle,
  }));
  const formations =
    rng() < 0.8 ? [pick(rng, rome.formations)] : [];

  const offer: Offer = {
    id: `${sectorPrefix}-${rome.romeCode}-${String(seq).padStart(3, "0")}`,
    intitule: pick(rng, rome.titles),
    romeCode: rome.romeCode,
    typeContrat: pick(rng, rome.contrats),
    lieuTravail: { libelle: `${city} (${dept})`, departement: dept },
    competences: comps,
    formations,
    qualitesProfessionnelles: qualites,
    experienceLibelle: exp.libelle,
    experienceExige: exp.exige,
    dateCreation: dateCreation(rng),
  };

  if (rome.permis && rng() < 0.3) {
    offer.permis = rome.permis;
  }
  return offer;
}

function main() {
  const outDir = path.join(process.cwd(), "fixtures", "offers");
  mkdirSync(outDir, { recursive: true });

  // one fixed seed per sector so output is stable across runs
  const seeds: Record<string, number> = {
    "paie.json": 1001,
    "support-applicatif.json": 2002,
    "food-restauration.json": 3003,
  };

  for (const sector of SECTORS) {
    const rng = makeRng(seeds[sector.file]);
    const prefix = sector.file.replace(".json", "");
    const offers: Offer[] = [];
    for (let i = 0; i < sector.count; i++) {
      // alternate ROMEs but let the rng skew the mix
      const rome = sector.romes[i % sector.romes.length];
      offers.push(buildOffer(rng, prefix, i + 1, rome));
    }
    const file = path.join(outDir, sector.file);
    writeFileSync(file, JSON.stringify(offers, null, 2) + "\n", "utf8");
    console.log(`wrote ${offers.length} offers → fixtures/offers/${sector.file}`);
  }
}

main();
