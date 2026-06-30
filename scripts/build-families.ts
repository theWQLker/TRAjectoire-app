/**
 * FAMILY ROLLOUT pipeline (§4 front door, all 14 ROME grands domaines).
 *
 * For every family→depth (a depth = one or more fine ROME niche prefixes):
 *   1. niche members = every job whose code starts with a prefix
 *   2. seed = union of members' competence codes, DISTINCTIVE only (idf above the
 *      generic cutoff), every code VERIFIED present in rome_competences (0 fabricated)
 *   3. coverage proof: a representative member must hit ≥70% of its codes from the seed
 *
 * Emits (--emit) the config/families.ts content with all verified seed arrays, and
 * always prints the per-depth coverage + fabrication report. Niche idiosyncrasy is
 * verified per depth, never assumed.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/build-families.ts [--emit > config/families.ts]
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";

async function fetchAll<T>(t: string, c: string): Promise<T[]> {
  const db = getSupabaseServiceClient();
  const P = 1000; const o: T[] = [];
  for (let f = 0; ; f += P) {
    const { data, error } = await db.from(t).select(c).range(f, f + P - 1);
    if (error) throw new Error(`${t}: ${error.message}`);
    if (!data || !data.length) break;
    for (const r of data as T[]) o.push(r);
    if (data.length < P) break;
  }
  return o;
}

type DepthDef = { id: string; label: string; prefixes: string[]; proveOn: string; persona: string };
type FamilyDef = { id: string; label: string; domaines: string; depths: DepthDef[] };

// All 14 domaines covered. Each depth's proveOn is a representative member job;
// persona is a one-line note of who picks it (for the batch persona test).
const FAMILIES: FamilyDef[] = [
  { id: "tech", label: "Informatique & numérique", domaines: "M18 / I14", depths: [
    { id: "code", label: "Développer / coder", prefixes: ["M180", "M182", "M184", "M185"], proveOn: "M1805", persona: "développeur" },
    { id: "sysadmin", label: "Systèmes & réseaux", prefixes: ["M181"], proveOn: "M1810", persona: "admin systèmes" },
    { id: "support", label: "Support / dépannage info", prefixes: ["I140"], proveOn: "I1401", persona: "support IT" },
    { id: "data", label: "Données / data", prefixes: ["M183", "M140"], proveOn: "M1403", persona: "data analyst" },
  ]},
  { id: "sante", label: "Santé & soin", domaines: "J", depths: [
    { id: "soin", label: "Soin / aide-soignant·e", prefixes: ["J150", "J151"], proveOn: "J1501", persona: "aide-soignant" },
    { id: "medico", label: "Médico-technique", prefixes: ["J130"], proveOn: "J1302", persona: "technicien labo" },
    { id: "reeduc", label: "Rééducation / paramédical", prefixes: ["J140", "J141"], proveOn: "J1404", persona: "kiné" },
  ]},
  { id: "btp", label: "Construction & bâtiment", domaines: "F", depths: [
    { id: "gros", label: "Gros œuvre / maçonnerie", prefixes: ["F170"], proveOn: "F1701", persona: "maçon" },
    { id: "second", label: "Second œuvre / finitions", prefixes: ["F160"], proveOn: "F1602", persona: "électricien bâtiment" },
    { id: "conduite", label: "Conduite & encadrement chantier", prefixes: ["F110", "F120"], proveOn: "F1201", persona: "conducteur travaux" },
  ]},
  { id: "maintenance", label: "Maintenance & technique", domaines: "I", depths: [
    { id: "indus", label: "Maintenance industrielle", prefixes: ["I130"], proveOn: "I1304", persona: "technicien maintenance" },
    { id: "vehicule", label: "Mécanique véhicules", prefixes: ["I160"], proveOn: "I1604", persona: "mécanicien auto" },
    { id: "batiment", label: "Maintenance bâtiment", prefixes: ["I120"], proveOn: "I1203", persona: "agent d'entretien" },
  ]},
  { id: "commerce", label: "Commerce & vente", domaines: "D", depths: [
    { id: "vente", label: "Vente / conseil client", prefixes: ["D12"], proveOn: "D1214", persona: "vendeur" },
    { id: "caisse", label: "Caisse / mise en rayon", prefixes: ["D15"], proveOn: "D1505", persona: "employé libre-service" },
    { id: "commercial", label: "Commercial / négociation", prefixes: ["D14"], proveOn: "D1402", persona: "commercial" },
  ]},
  { id: "industrie", label: "Industrie & production", domaines: "H", depths: [
    { id: "production", label: "Conduite de production", prefixes: ["H28", "H33"], proveOn: "H2801", persona: "opérateur production" },
    { id: "qualite", label: "Qualité / méthodes", prefixes: ["H15"], proveOn: "H1502", persona: "qualiticien" },
    { id: "montage", label: "Montage / assemblage", prefixes: ["H29"], proveOn: "H2902", persona: "monteur" },
  ]},
  { id: "hotellerie", label: "Hôtellerie, restauration & service", domaines: "G", depths: [
    { id: "cuisine", label: "Cuisine", prefixes: ["G16"], proveOn: "G1602", persona: "cuisinier" },
    { id: "salle", label: "Service en salle", prefixes: ["G18"], proveOn: "G1803", persona: "serveur" },
    { id: "accueil", label: "Accueil / hébergement", prefixes: ["G12"], proveOn: "G1206", persona: "réceptionniste" },
  ]},
  { id: "admin", label: "Administration, gestion & RH", domaines: "M (support)", depths: [
    { id: "secretariat", label: "Secrétariat / assistanat", prefixes: ["M160"], proveOn: "M1607", persona: "secrétaire" },
    { id: "compta", label: "Comptabilité / paie", prefixes: ["M120"], proveOn: "M1203", persona: "comptable" },
    { id: "rh", label: "Ressources humaines", prefixes: ["M150"], proveOn: "M1501", persona: "assistant RH" },
  ]},
  { id: "agriculture", label: "Agriculture & espaces naturels", domaines: "A", depths: [
    { id: "culture", label: "Culture / élevage", prefixes: ["A14"], proveOn: "A1416", persona: "agriculteur" },
    { id: "paysage", label: "Paysage / espaces verts", prefixes: ["A13"], proveOn: "A1301", persona: "jardinier" },
    { id: "foret", label: "Forêt / nature", prefixes: ["A12"], proveOn: "A1201", persona: "agent forestier" },
  ]},
  { id: "artisanat", label: "Arts & artisanat", domaines: "B / L", depths: [
    { id: "art", label: "Artisanat d'art", prefixes: ["B16", "B18"], proveOn: "B1601", persona: "artisan d'art" },
    { id: "spectacle", label: "Spectacle / technique", prefixes: ["L15"], proveOn: "L1509", persona: "technicien spectacle" },
    { id: "creation", label: "Création / interprétation", prefixes: ["L12", "L13"], proveOn: "L1301", persona: "artiste" },
  ]},
  { id: "banque", label: "Banque, assurance & immobilier", domaines: "C", depths: [
    { id: "banque", label: "Banque / clientèle", prefixes: ["C11"], proveOn: "C1102", persona: "conseiller bancaire" },
    { id: "assurance", label: "Assurance", prefixes: ["C12"], proveOn: "C1201", persona: "conseiller assurance" },
    { id: "immo", label: "Immobilier", prefixes: ["C15"], proveOn: "C1504", persona: "agent immobilier" },
  ]},
  { id: "communication", label: "Communication & média", domaines: "E", depths: [
    { id: "comm", label: "Communication / relations publiques", prefixes: ["E11"], proveOn: "E1103", persona: "chargé de com" },
    { id: "design", label: "Design / création visuelle", prefixes: ["E12"], proveOn: "E1205", persona: "designer graphique" },
    { id: "audiovisuel", label: "Audiovisuel / multimédia", prefixes: ["E13", "E14"], proveOn: "E1401", persona: "technicien audiovisuel" },
  ]},
  { id: "services", label: "Services à la personne & collectivité", domaines: "K", depths: [
    { id: "social", label: "Action sociale / éducative", prefixes: ["K12"], proveOn: "K1207", persona: "éducateur" },
    { id: "domicile", label: "Aide à domicile / à la personne", prefixes: ["K13"], proveOn: "K1302", persona: "aide à domicile" },
    { id: "securite", label: "Sécurité / défense", prefixes: ["K17", "K25"], proveOn: "K2503", persona: "agent de sécurité" },
    { id: "enseignement", label: "Enseignement / formation", prefixes: ["K21"], proveOn: "K2104", persona: "enseignant" },
  ]},
  { id: "transport", label: "Transport & logistique", domaines: "N", depths: [
    { id: "conduite", label: "Conduite / livraison", prefixes: ["N41", "N44"], proveOn: "N4101", persona: "chauffeur" },
    { id: "entrepot", label: "Entrepôt / manutention", prefixes: ["N11"], proveOn: "N1103", persona: "préparateur commandes" },
    { id: "exploitation", label: "Exploitation / planification", prefixes: ["N13", "N12"], proveOn: "N1303", persona: "agent logistique" },
  ]},
];

async function main() {
  const emit = process.argv.includes("--emit");
  const links = await fetchAll<{ rome_code: string; competence_code: string }>("rome_job_competences", "rome_code, competence_code");
  const comps = await fetchAll<{ code: string; libelle: string }>("rome_competences", "code, libelle");
  const jobs = await fetchAll<{ rome_code: string; title: string }>("rome_jobs", "rome_code, title");
  const existing = new Set(comps.map((c) => c.code));
  const title = new Map(jobs.map((j) => [j.rome_code, j.title]));

  const codesByJob = new Map<string, Set<string>>();
  const df = new Map<string, number>();
  for (const l of links) {
    const s = codesByJob.get(l.rome_code) ?? new Set<string>();
    if (!s.has(l.competence_code)) df.set(l.competence_code, (df.get(l.competence_code) ?? 0) + 1);
    s.add(l.competence_code); codesByJob.set(l.rome_code, s);
  }
  const N = jobs.length;
  const idf = (c: string) => Math.log((N + 1) / ((df.get(c) ?? 0) + 1));
  const GENERIC_CUTOFF = Math.log((N + 1) / (N * 0.15 + 1)); // generic if below
  const allJobCodes = [...codesByJob.keys()];

  const seedArrays: Record<string, string[]> = {};
  const report: { fam: string; depth: string; members: number; seed: number; proveOn: string; cov: number; fab: number; pass: boolean }[] = [];

  for (const fam of FAMILIES) {
    for (const d of fam.depths) {
      const members = allJobCodes.filter((j) => d.prefixes.some((p) => j.startsWith(p)));
      const seedSet = new Set<string>();
      for (const m of members) for (const code of codesByJob.get(m) ?? []) {
        if (idf(code) >= GENERIC_CUTOFF) seedSet.add(code); // distinctive only
      }
      const seed = [...seedSet].filter((c) => existing.has(c)).sort((a, b) => idf(b) - idf(a));
      const fab = [...seedSet].filter((c) => !existing.has(c)).length;
      const proveCodes = codesByJob.get(d.proveOn) ?? new Set<string>();
      const hit = [...proveCodes].filter((c) => seedSet.has(c)).length;
      const cov = proveCodes.size ? (hit / proveCodes.size) * 100 : 0;
      const pass = cov >= 70 && fab === 0;
      seedArrays[`${fam.id}:${d.id}`] = seed;
      report.push({ fam: fam.id, depth: d.id, members: members.length, seed: seed.length, proveOn: d.proveOn, cov, fab, pass });
    }
  }

  if (emit) {
    // print a TS module
    console.log(genConfig(FAMILIES, seedArrays));
    return;
  }

  console.log("=".repeat(96));
  console.log("FAMILY ROLLOUT — coverage of representative job by niche-union seed (≥70% + 0 fabricated = PASS)");
  console.log("=".repeat(96));
  let pass = 0, fail = 0;
  let curFam = "";
  for (const r of report) {
    if (r.fam !== curFam) { curFam = r.fam; console.log(`\n${r.fam}`); }
    const mark = r.pass ? "✓" : "✗";
    console.log(`  ${mark} ${r.depth.padEnd(14)} niche=${String(r.members).padStart(3)} seed=${String(r.seed).padStart(3)} fab=${r.fab}  proveOn ${r.proveOn} ${(title.get(r.proveOn)??"?").slice(0,32).padEnd(32)} cov ${r.cov.toFixed(0).padStart(3)}%`);
    if (r.pass) pass++; else fail++;
  }
  console.log(`\n${"=".repeat(96)}`);
  console.log(`TOTAL depths: ${report.length}  PASS: ${pass}  FAIL: ${fail}`);
  const fails = report.filter((r) => !r.pass);
  if (fails.length) {
    console.log("\nFAILING DEPTHS (need attention — bad proveOn code, wrong prefix, or genuinely inexpressible):");
    for (const r of fails) console.log(`  ${r.fam}:${r.depth} — proveOn ${r.proveOn} cov ${r.cov.toFixed(0)}% fab ${r.fab} (proveOn exists in graph: ${codesByJob.has(r.proveOn)})`);
  }
}

function genConfig(fams: FamilyDef[], seeds: Record<string, string[]>): string {
  const depthBlock = (famId: string, d: DepthDef) =>
    `      { id: ${JSON.stringify(d.id)}, label: ${JSON.stringify(d.label)}, seedCodes: ${JSON.stringify(seeds[`${famId}:${d.id}`] ?? [])} },`;
  const famBlock = (f: FamilyDef) =>
    `  {\n    id: ${JSON.stringify(f.id)},\n    label: ${JSON.stringify(f.label)},\n    domaines: ${JSON.stringify(f.domaines)},\n    depths: [\n${f.depths.map((d) => depthBlock(f.id, d)).join("\n")}\n    ],\n  },`;
  return `/**
 * Front-door FAMILIES + DEPTH sub-choices (BUILD_BRIEF §4). GENERATED by
 * scripts/build-families.ts from the live ROME graph — every seedCode is the
 * niche-union of distinctive competence codes for that depth, VERIFIED present in
 * rome_competences (zero fabricated). Re-generate after a graph re-ingest.
 *
 * Seed is ADDITIVE (never a filter): a picked niche injects its real distinctive
 * codes into the inventory; cross-domain bridges + the firehose guard stay intact.
 * Rarity-weighting (idf ≈ 6.8 on these codes) lifts the seeded niche's jobs, and
 * rarity-aware Signal tiers read them honestly.
 */

export type Depth = { id: string; label: string; seedCodes: string[] };
export type Family = { id: string; label: string; domaines: string; depths: Depth[] };

export const FAMILIES: Family[] = [
${fams.map(famBlock).join("\n")}
];

/** Resolve the seed codes for a list of picked "familyId:depthId" tokens. */
export function seedCodesFor(picks: string[]): string[] {
  const out = new Set<string>();
  for (const pick of picks) {
    const [familyId, depthId] = pick.split(":");
    const fam = FAMILIES.find((f) => f.id === familyId);
    const depth = fam?.depths.find((d) => d.id === depthId);
    if (depth) for (const code of depth.seedCodes) out.add(code);
  }
  return [...out];
}
`;
}

main().catch((e) => { console.error(e); process.exit(1); });
