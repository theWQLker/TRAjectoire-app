/**
 * DIRECTIONS LAYER: prototype on data, no UI (briefs 2026-11-20 and -21).
 *
 * A direction = a group of surfaced roles sharing the same main driving
 * capacity (ROME objectif). Deterministic; no LLM; engine output
 * (buildResults) is read, never changed.
 *
 * v7 (decisions 2026-11-21, "Directions: fix before UI"):
 *  1. Révélée = counterfactual: the same user is run with the seed only. A
 *     member role is brought by the answers when it entered the top roles or
 *     ranks higher with them AND shares, in the direction's capacity, a skill
 *     only the answers gave. Révélée when more than half the roles are; no
 *     seed, no tag. The rarity split (v6) is kept only for the before/after.
 *  2. Evidence bar: >= 3 distinct shared distinctive skills in the main
 *     capacity; révélée also needs answers from >= 2 different scenes. Applied
 *     before the 5 slots are filled; thin groups' roles go to Autres pistes.
 *  3. Genericity: roles in the top 40 for > 40 % of the wide set (and of the
 *     personas who answered), with the skills that carry them. Diagnosis only.
 *  4. Names and sector labels from docs/rome/naming-draft-2026-11-21.md; main
 *     capacity only, the second as a subline; anything missing is flagged.
 *  5. Copyable titles: main ROME title + up to 2 appellations sharing a key
 *     word with it; the rest counted ("Plus d'intitulés").
 *  6. Révélée directions first, then by strength.
 *  7. Autres pistes: role, sector, signal; faible only counted.
 *
 * Unchanged: capacity profile = distinctive idf per objectif, driving
 * capacities cover >= 60 % (at most 2), groups of 2+ roles among the top 40,
 * at most 5 directions, a left-out role joins through its second capacity.
 * Personas answer each scene with the option whose clusters overlap their
 * theme most (scripts/theme-personas.ts).
 *
 * Data: ROME open data CSV bundle (Licence Ouverte 2.0), extracted to a folder:
 *   https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/csv
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local  *     node_modules/tsx/dist/cli.mjs scripts/directions-prototype.ts <romeCsvDir> <out.md>
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { getRomeSource, rarityOf } from "../src/lib/rome";
import { signalStrength } from "../src/lib/engine/coverage";
import { sortForDisplay } from "../src/app/results/display";
import { CLUSTERS } from "../config/clusters";
import { CATEGORIES, LEAN_WEIGHTS, type Lean } from "../config/quiz";
import { FAMILIES } from "../config/families";
import { QUIZ_ONLY, THEMES, themeAnswers, type ThemePersona } from "./theme-personas";

// Method switches, so every variant in the report is reproducible:
//   DIRECTIONS_LEVEL   objectif (default, 84 ROME objectives) | enjeu (32)
//   DIRECTIONS_WEIGHT  distinctive (default: idf above the engine's generic
//                      floor, RARITY_GENERIC_FLOOR = 3) | idf
//   DIRECTIONS_SAVOIRS 1 lets savoir categories drive a direction (default off)
const LEVEL = process.env.DIRECTIONS_LEVEL === "enjeu" ? "enjeu" : "objectif";
const WEIGHT = process.env.DIRECTIONS_WEIGHT === "idf" ? "idf" : "distinctive";
const SAVOIRS_DRIVE = process.env.DIRECTIONS_SAVOIRS === "1";
const GENERIC_FLOOR = Number(process.env.RARITY_GENERIC_FLOOR ?? "3");
// v4 membership rules (see report): a role founds or joins a direction only
// when its signal is moyen or fort AND its main capacity carries at least
// MIN_PRIMARY_SHARE of its distinctive weight. Others stay roles, counted.
const MEMBERSHIP = process.env.DIRECTIONS_MEMBERSHIP !== "all";
const MIN_PRIMARY_SHARE = Number(process.env.DIRECTIONS_MIN_SHARE ?? "0");
const TOP_ROLES = 40;
const DRIVING_SHARE = 0.6;
const MAX_DRIVING = 2;
const MIN_DIRECTIONS = 3;
const MAX_DIRECTIONS = 5;

// ---------------------------------------------------------------------------
// ROME open data
// ---------------------------------------------------------------------------
function readCsv(file: string): string[][] {
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((l) => l.slice(1, -1).split('","'));
}
function romeFile(dir: string, prefix: string): string {
  const f = readdirSync(dir).find((x) => x.startsWith(prefix));
  if (!f) throw new Error(`ROME open data: no ${prefix}* in ${dir}`);
  return path.join(dir, f);
}

type Rome = {
  capacityOf: (code: string) => string;
  /** False for savoir categories unless DIRECTIONS_SAVOIRS=1. */
  drives: (code: string) => boolean;
  titles: (rome: string) => string[];
  /** ROME domaine professionnel label, e.g. "Force de vente". */
  sector: (rome: string) => string;
  mapped: (code: string) => "competence" | "savoir" | "none";
  /** Main title (PRINCIPALE appellation, short form) and the other usable appellations. */
  appellations: (rome: string) => { main: string | null; others: string[] };
  /** Label of a competence, macro-competence or savoir code. */
  label: (code: string) => string;
};

export function loadRome(dir: string): Rome {
  const enjeu = new Map<string, string>();
  for (const r of readCsv(romeFile(dir, "unix_arborescence_competences_"))) {
    // [.., code_enjeu 2, enjeu 3, code_objectif 4, objectif 5, .., code_ogr_macro 7, .., code_ogr_competence 9, ..]
    const label = (LEVEL === "enjeu" ? r[3] : r[5]).replace(/\s+/g, " ").replace(/oe/g, "œ").trim();
    enjeu.set(r[9], label);
    enjeu.set(r[7], label);
  }
  const savoir = new Map<string, string>();
  for (const r of readCsv(romeFile(dir, "unix_referentiel_savoir_"))) {
    // code_ogr_savoir, libelle, categorie, sous_categorie
    savoir.set(r[0], `Savoirs : ${r[3] || r[2]}`);
  }
  const apps = new Map<string, { label: string; principal: boolean }[]>();
  for (const r of readCsv(romeFile(dir, "unix_referentiel_appellation_"))) {
    // code_ogr, long, court, code_rome, .., classification 9, .., peu_usite 12
    if (r[12] === "O") continue;
    const list = apps.get(r[3]) ?? [];
    list.push({ label: r[2] || r[1], principal: r[9] === "PRINCIPALE" });
    apps.set(r[3], list);
  }
  const sectors = new Map<string, string>();
  for (const r of readCsv(romeFile(dir, "unix_domaine_professionnel_"))) sectors.set(r[0], r[1]);
  const labels = new Map<string, string>();
  for (const r of readCsv(romeFile(dir, "unix_referentiel_competence_"))) labels.set(r[0], r[2]);
  for (const r of readCsv(romeFile(dir, "unix_arborescence_competences_"))) {
    labels.set(r[7], r[8]);
    labels.set(r[9], r[10]);
  }
  for (const r of readCsv(romeFile(dir, "unix_referentiel_savoir_"))) if (!labels.has(r[0])) labels.set(r[0], r[1]);
  return {
    label: (c) => labels.get(c) ?? c,
    appellations: (rome) => {
      const list = apps.get(rome) ?? [];
      const main = list.find((a) => a.principal)?.label ?? null;
      return { main, others: list.filter((a) => a.label !== main).map((a) => a.label) };
    },
    sector: (rome) => sectors.get(rome.slice(0, 3)) ?? "?",
    capacityOf: (c) => enjeu.get(c) ?? savoir.get(c) ?? "Autres compétences",
    drives: (c) => enjeu.has(c) || SAVOIRS_DRIVE,
    mapped: (c) => (enjeu.has(c) ? "competence" : savoir.has(c) ? "savoir" : "none"),
    titles: (rome) =>
      [...(apps.get(rome) ?? [])]
        .sort((a, b) => Number(b.principal) - Number(a.principal) || a.label.localeCompare(b.label, "fr"))
        .map((a) => a.label),
  };
}

// ---------------------------------------------------------------------------
// Naming draft (docs/rome/naming-draft-2026-11-21.md, decision item 4)
// ---------------------------------------------------------------------------
type Flagged = { label: string; flag: string | null };
type Naming = { capacity: (objectif: string) => Flagged; sector: (rome: string, domainePro: string) => Flagged };

const loose = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/[’']/g, "'").replace(/\s+/g, " ").trim().toLowerCase();

function loadNaming(file: string): Naming {
  const sections = new Map<string, [string, string][]>();
  let current = "";
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const h = /^#{2,3}\s+(.*)$/.exec(line);
    if (h) current = h[1];
    const row = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/.exec(line);
    if (!row || /^-+$/.test(row[1]) || /^(ROME objectif|Grand domaine|Domaine professionnel)/.test(row[1])) continue;
    sections.set(current, [...(sections.get(current) ?? []), [row[1], row[2]]]);
  }
  const pick = (prefix: string) => [...sections].find(([k]) => k.startsWith(prefix))?.[1] ?? [];
  const caps = pick("1.");
  const exact = new Map(caps);
  const byLoose = new Map(caps.map(([k, v]) => [loose(k), v]));
  const gd = new Map(pick("By grand domaine"));
  const k = new Map(pick("K,"));
  const m = new Map(pick("M,"));
  const clean = (v: string) => v.replace(/\s*\(.*\)\s*$/, "");
  return {
    capacity: (objectif) => {
      const v = exact.get(objectif) ?? byLoose.get(loose(objectif));
      if (!v) return { label: objectif, flag: "absent du brouillon : libellé ROME gardé" };
      const vague = /too vague/.test(v);
      const label = clean(v);
      if (vague) return { label, flag: "trop vague (signalé dans le brouillon)" };
      return { label, flag: exact.has(objectif) ? null : "rapproché sans accents ni casse" };
    },
    sector: (rome, dp) => {
      const letter = rome[0];
      if (letter === "K" || letter === "M") {
        const v = (letter === "K" ? k : m).get(dp);
        if (v) return { label: v, flag: null };
        return letter === "K"
          ? { label: "Services publics", flag: `K hors liste (${dp}) : à revoir` }
          : { label: dp, flag: `M hors liste (${dp}) : à revoir` };
      }
      const v = gd.get(letter);
      return v ? { label: v, flag: null } : { label: dp, flag: `grand domaine ${letter} absent du brouillon` };
    },
  };
}

// ---------------------------------------------------------------------------
// Copyable titles (decision item 5): main title + up to 2 appellations sharing
// a key word with it; the rest behind "Plus d'intitulés".
// ---------------------------------------------------------------------------
const STOP = new Set(["des", "les", "aux", "pour", "sur", "dans", "par", "avec", "une", "the", "and"]);
const keyWords = (s: string) =>
  new Set(loose(s).split(/[^a-z]+/).filter((w) => w.length >= 3 && !STOP.has(w)));

function copyTitles(rome: Rome, code: string, fallback: string): { main: string; close: string[]; more: number } {
  const { main, others } = rome.appellations(code);
  const head = main ?? fallback;
  const kw = keyWords(head);
  const close = others
    .map((t) => ({ t, shared: [...keyWords(t)].filter((w) => kw.has(w)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || a.t.length - b.t.length || a.t.localeCompare(b.t, "fr"))
    .slice(0, 2)
    .map((x) => x.t);
  return { main: head, close, more: others.length - close.length };
}

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------
type Persona = ThemePersona;
export const PERSONAS: Persona[] = [
  { id: "P1", label: "Relation et transmission, sans seed", theme: "relation", diploma: "bac3" },
  { id: "P2", label: "Analyse et systèmes, sans seed", theme: "analyse", diploma: "bac5" },
  { id: "P3", label: "Terrain et technique, sans seed", theme: "terrain", diploma: "cap" },
  { id: "P4", label: "Seed tech:code + réponses analyse", theme: "analyse", seed: "tech:code", diploma: "bac5" },
  { id: "P5", label: "Seed tech:code + réponses relation", theme: "relation", seed: "tech:code", diploma: "bac5" },
  { id: "P6", label: "Seed santé:soin + réponses relation", theme: "relation", seed: "sante:soin", diploma: "bac3" },
  { id: "P7", label: "Seed admin:rh + réponses relation", theme: "relation", seed: "admin:rh", diploma: "bac5" },
  { id: "P8", label: "Seed hôtellerie:cuisine + réponses terrain", theme: "terrain", seed: "hotellerie:cuisine", diploma: "cap" },
  { id: "P9", label: "Seed commerce:vente + réponses vente", theme: "vente", seed: "commerce:vente", diploma: "bac2" },
  { id: "P10", label: "Seed btp:second + réponses organisation", theme: "organisation", seed: "btp:second", diploma: "bac2" },
];
const CONTRAST: [string, string] = ["P4", "P5"];

const answersFor = (p: Persona): Answers => themeAnswers(p);

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------
type AnswerSource = { scene: string; prompt: string; option: string; cluster: string };

function answerSources(ans: Answers): Map<string, AnswerSource[]> {
  const byCode = new Map<string, AnswerSource[]>();
  const clusterCodes = new Map(CLUSTERS.map((c) => [c.id, c.competenceCodes]));
  for (const cat of CATEGORIES) {
    for (const s of cat.scenes) {
      const raw = ans[s.id];
      if (!raw || !(raw in LEAN_WEIGHTS)) continue;
      const w = LEAN_WEIGHTS[raw as Lean];
      for (const [opt, weight] of [[s.optionA, w.a], [s.optionB, w.b]] as const) {
        // A context-only side (decision 2026-11-22) puts no codes in the inventory.
        if (weight <= 0 || opt.maps.contextOnly) continue;
        for (const c of opt.maps.clusters ?? []) {
          for (const code of clusterCodes.get(c.id) ?? []) {
            const list = byCode.get(code) ?? [];
            list.push({ scene: s.id, prompt: s.prompt, option: opt.label, cluster: c.id });
            byCode.set(code, list);
          }
        }
      }
    }
  }
  return byCode;
}

function seedSources(seed: string | undefined): Map<string, string> {
  const byCode = new Map<string, string>();
  if (!seed) return byCode;
  const [fam, dep] = seed.split(":");
  const f = FAMILIES.find((x) => x.id === fam);
  const d = f?.depths.find((x) => x.id === dep);
  if (!f || !d) return byCode;
  for (const c of d.seedCodes) byCode.set(c, `${f.label} : ${d.label}`);
  return byCode;
}

// ---------------------------------------------------------------------------
// Directions
// ---------------------------------------------------------------------------
type Role = {
  d: ResultDirection;
  profile: Map<string, number>;
  driving: string[];
  total: number;
};

type Kind = "révélée" | "continuité" | null;

/** Where a role stands without the answers (same user, seed only). */
type Counterfactual = {
  /** Display rank with the answers (0-based) and with the seed only (null = not surfaced). */
  rank: number;
  seedRank: number | null;
  /** Shared skills that only the answers brought (not in the seed). */
  answerOnly: number;
  /** Entered the top roles, or ranks higher, with the answers. */
  moved: boolean;
  status: string;
};

type Direction = {
  /** ROME objectif wording of the main and (optional) second capacity. */
  capacities: string[];
  roles: Role[];
  strength: number;
  answers: { src: AnswerSource; skills: number }[];
  /** Distinct scenes among the answers behind the direction. */
  answerScenes: number;
  /** Distinct shared distinctive skills (idf above the generic floor) in the main capacity. */
  evidence: number;
  seedNiche: string | null;
  /** v7: seed-only counterfactual (null without a seed). */
  kind: Kind;
  byAnswers: number;
  /** v6 split, kept for the before/after: rarity share from answers ≥ 50 %. */
  kindV6: "révélée" | "continuité";
  answerShare: number;
  attached: number;
  domains: Map<string, number>;
  meanJaccard: number;
  /** Why it fails the evidence bar (null = passes). */
  thin: string | null;
};

const NO_CAPACITY = "Sans capacité distinctive";
// Decision 2026-11-21 item 2 (evidence bar).
const MIN_EVIDENCE = 3;
const MIN_ANSWERS_REVEALED = 2;

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const inter = b.filter((x) => A.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni ? inter / uni : 0;
}

// Seed-only runs, shared across personas with the same seed and diploma.
const seedOnlyCache = new Map<string, Promise<string[]>>();
function seedOnlyOrder(seed: string, diploma: ThemePersona["diploma"]): Promise<string[]> {
  const key = `${seed}|${diploma}`;
  let hit = seedOnlyCache.get(key);
  if (!hit) {
    hit = (async () => {
      const inv = buildInventory(themeAnswers({ id: key, label: "seed only", theme: "none", seed, diploma }));
      const res = await buildResults(inv);
      return sortForDisplay(res.directions).map((d) => d.romeCode);
    })();
    seedOnlyCache.set(key, hit);
  }
  return hit;
}

export async function analyse(p: Persona, rome: Rome) {
  const ans = answersFor(p);
  const inv = buildInventory(ans);
  const res = await buildResults(inv);
  const source = getRomeSource();
  const rarity = await source.competenceRarity();
  const N = (await source.allMetiers()).length;
  const idf = (c: string) => rarityOf(rarity, c, N);
  // Weight that decides a role's driving capacities.
  const drive = (c: string) => (WEIGHT === "idf" ? idf(c) : Math.max(0, idf(c) - GENERIC_FLOOR));
  const fromAnswers = answerSources(ans);
  const fromSeed = seedSources(p.seed);
  const hasAnswers = fromAnswers.size > 0;

  const ordered = sortForDisplay(res.directions);
  const top = ordered.slice(0, TOP_ROLES);
  const roles: Role[] = top.map((d) => {
    const profile = new Map<string, number>();
    for (const c of d.matchedCompetenceCodes) {
      if (!rome.drives(c)) continue;
      const cap = rome.capacityOf(c);
      profile.set(cap, (profile.get(cap) ?? 0) + drive(c));
    }
    const total = [...profile.values()].reduce((s, v) => s + v, 0);
    const ranked = [...profile.entries()].sort((a, b) => b[1] - a[1]);
    const driving: string[] = [];
    let cum = 0;
    for (const [cap, v] of ranked) {
      if (driving.length >= MAX_DRIVING || v <= 0) break;
      driving.push(cap);
      cum += v;
      if (cum >= DRIVING_SHARE * total) break;
    }
    return { d, profile, driving, total };
  });

  // Counterfactual (decision item 1): the same user with the seed only.
  const cf = new Map<string, Counterfactual>();
  if (p.seed) {
    const seedOrder = hasAnswers ? await seedOnlyOrder(p.seed, p.diploma) : ordered.map((d) => d.romeCode);
    const seedRank = new Map(seedOrder.map((c, i) => [c, i]));
    for (const [i, r] of roles.entries()) {
      const sr = seedRank.get(r.d.romeCode) ?? null;
      const answerOnly = r.d.matchedCompetenceCodes.filter((c) => fromAnswers.has(c) && !fromSeed.has(c)).length;
      const entered = sr === null || sr >= TOP_ROLES;
      const rose = !entered && sr! > i;
      const status = sr === null ? "absente sans réponses" : entered ? `entrée (rang ${sr + 1} sans réponses)` : sr > i ? `+${sr - i}` : sr < i ? `−${i - sr}` : "=";
      cf.set(r.d.romeCode, { rank: i, seedRank: sr, answerOnly, moved: entered || rose, status });
    }
  }

  const eligible = (r: Role) => {
    if (!MEMBERSHIP) return true;
    if (signalStrength(r.d.matchRaritySum) === "exploratory") return false;
    const primary = r.driving[0] ? r.profile.get(r.driving[0]) ?? 0 : 0;
    const total = [...r.profile.values()].reduce((s, v) => s + v, 0);
    return total > 0 && primary / total >= MIN_PRIMARY_SHARE;
  };
  const groups = new Map<string, Role[]>();
  for (const r of roles.filter(eligible)) {
    const key = r.driving[0] ?? NO_CAPACITY;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const allGroups = [...groups.entries()].map(([cap, rs]) => ({
    cap,
    rs,
    strength: rs.reduce((s, r) => s + r.d.coherenceRank, 0),
  }));
  const multi = allGroups
    .filter((g) => g.cap !== NO_CAPACITY && g.rs.length >= 2)
    .sort((a, b) => b.strength - a.strength);

  const build = (cap: string, rs: Role[], strength: number, attached: number): Direction => {
    // Secondary capacity: the most common second driver among members.
    const second = new Map<string, number>();
    for (const r of rs) {
      const other = r.driving.find((c) => c !== cap);
      if (other) second.set(other, (second.get(other) ?? 0) + 1);
    }
    const sec = [...second.entries()].sort((a, b) => b[1] - a[1])[0];
    const capacities = sec && sec[1] * 2 >= rs.length ? [cap, sec[0]] : [cap];
    const capSet = new Set(capacities);

    let aW = 0;
    let sW = 0;
    const answerHits = new Map<string, { src: AnswerSource; skills: Set<string> }>();
    const evidence = new Set<string>();
    let seedNiche: string | null = null;
    for (const r of rs) {
      for (const c of r.d.matchedCompetenceCodes) {
        const capOf = rome.capacityOf(c);
        if (capOf === cap && idf(c) > GENERIC_FLOOR) evidence.add(c);
        if (!capSet.has(capOf)) continue;
        const A = fromAnswers.get(c) ?? [];
        const S = fromSeed.get(c);
        const w = idf(c);
        if (A.length && S) { aW += w / 2; sW += w / 2; }
        else if (A.length) aW += w;
        else if (S) sW += w;
        if (S) seedNiche = S;
        for (const src of A) {
          const k = `${src.scene}|${src.option}`;
          const hit = answerHits.get(k) ?? { src, skills: new Set<string>() };
          hit.skills.add(c);
          answerHits.set(k, hit);
        }
      }
    }
    const answers = [...answerHits.values()].map((h) => ({ src: h.src, skills: h.skills.size })).sort((a, b) => b.skills - a.skills);
    const answerScenes = new Set(answers.map((a) => a.src.scene)).size;
    const answerShare = aW + sW > 0 ? aW / (aW + sW) : 0;
    // A role is brought by the answers when it entered or rose with them AND
    // shares, in this direction's capacities, a skill only the answers gave.
    const broughtBy = (r: Role) =>
      !!cf.get(r.d.romeCode)?.moved &&
      r.d.matchedCompetenceCodes.some((c) => capSet.has(rome.capacityOf(c)) && fromAnswers.has(c) && !fromSeed.has(c));
    const byAnswers = rs.filter(broughtBy).length;
    // Révélée = most member roles entered or rose only because of the answers.
    const kind: Kind = p.seed ? (byAnswers * 2 > rs.length ? "révélée" : "continuité") : null;
    const thin =
      evidence.size < MIN_EVIDENCE
        ? `${evidence.size} compétence${evidence.size > 1 ? "s" : ""} distinctive${evidence.size > 1 ? "s" : ""} partagée${evidence.size > 1 ? "s" : ""} dans sa capacité (minimum ${MIN_EVIDENCE})`
        : kind === "révélée" && answerScenes < MIN_ANSWERS_REVEALED
          ? `révélée par ${answerScenes} réponse${answerScenes > 1 ? "s" : ""} seulement (minimum ${MIN_ANSWERS_REVEALED})`
          : null;
    const pairs: number[] = [];
    for (let i = 0; i < rs.length; i++)
      for (let j = i + 1; j < rs.length; j++) pairs.push(jaccard(rs[i].d.matchedCompetenceCodes, rs[j].d.matchedCompetenceCodes));
    const domains = new Map<string, number>();
    for (const r of rs) domains.set(r.d.romeCode[0], (domains.get(r.d.romeCode[0]) ?? 0) + 1);
    return {
      capacities,
      roles: rs,
      strength,
      answers,
      answerScenes,
      evidence: evidence.size,
      seedNiche,
      kind,
      byAnswers,
      kindV6: answerShare >= 0.5 ? "révélée" : "continuité",
      answerShare,
      attached,
      domains,
      meanJaccard: pairs.length ? pairs.reduce((s, v) => s + v, 0) / pairs.length : 1,
      thin,
    };
  };

  // A left-out role joins the strongest chosen direction whose capacity is its
  // second driver (unchanged from v6).
  const attach = (chosen: { cap: string; rs: Role[]; strength: number; attached: number }[]) => {
    const placed = new Set(chosen.flatMap((g) => g.rs.map((r) => r.d.romeCode)));
    for (const r of roles) {
      if (placed.has(r.d.romeCode) || r.driving.length < 2) continue;
      if (MEMBERSHIP && signalStrength(r.d.matchRaritySum) === "exploratory") continue;
      const home = chosen.find((g) => g.cap === r.driving[1]);
      if (!home) continue;
      home.rs.push(r);
      home.attached++;
      placed.add(r.d.romeCode);
    }
    return chosen;
  };

  // Before (v6): the 5 strongest multi-role groups, attachment, rarity split.
  const before = attach(multi.slice(0, MAX_DIRECTIONS).map((g) => ({ ...g, rs: [...g.rs], attached: 0 }))).map((g) =>
    build(g.cap, g.rs, g.strength, g.attached),
  );

  // After (v7): the evidence bar first, so a thin group never takes a slot.
  const candidates = multi.map((g) => build(g.cap, g.rs, g.strength, 0));
  const dropped = candidates.filter((d) => d.thin);
  const keptCaps = candidates.filter((d) => !d.thin).slice(0, MAX_DIRECTIONS).map((d) => d.capacities[0]);
  const chosen = attach(
    multi.filter((g) => keptCaps.includes(g.cap)).map((g) => ({ ...g, rs: [...g.rs], attached: 0 })),
  ).map((g) => build(g.cap, g.rs, g.strength, g.attached));
  // Attachment can flip a direction to révélée; re-check the bar.
  for (const d of chosen.filter((x) => x.thin)) dropped.push(d);
  const directions = chosen
    .filter((d) => !d.thin)
    // Decision item 6: révélée first, then by strength.
    .sort((a, b) => Number(b.kind === "révélée") - Number(a.kind === "révélée") || b.strength - a.strength);

  // Honesty invariants, per role and per direction.
  const surfaced = new Set(res.directions.map((d) => d.romeCode));
  const held = new Set(res.suppressed.map((s) => s.romeCode));
  const invCodes = new Set(inv.competenceCodes);
  const violations: string[] = [];
  for (const dir of directions) {
    for (const r of dir.roles) {
      if (!surfaced.has(r.d.romeCode) || held.has(r.d.romeCode)) violations.push(`${r.d.romeCode} not a surfaced role`);
      if (r.d.matchedCompetenceCodes.some((c) => !invCodes.has(c))) violations.push(`${r.d.romeCode} claims a skill outside the inventory`);
      if (r.d.matchedCompetenceCodes.length === 0) violations.push(`${r.d.romeCode} has no shared skill`);
    }
    const memberSkills = new Set(dir.roles.flatMap((r) => r.d.matchedCompetenceCodes));
    for (const a of dir.answers) {
      const clusterCodes = CLUSTERS.find((c) => c.id === a.src.cluster)?.competenceCodes ?? [];
      if (!clusterCodes.some((c) => memberSkills.has(c))) violations.push(`"${a.src.option}" traces to no shared skill in ${dir.capacities[0]}`);
    }
    if (dir.evidence < MIN_EVIDENCE) violations.push(`${dir.capacities[0]} shown under the evidence bar`);
  }

  const mappedCounts = { competence: 0, savoir: 0, none: 0 };
  for (const r of roles) for (const c of r.d.matchedCompetenceCodes) mappedCounts[rome.mapped(c)]++;

  // Autres pistes (decision item 7): role, sector, signal; faible only counted.
  const inDirection = new Set(directions.flatMap((d) => d.roles.map((r) => r.d.romeCode)));
  const others = roles.filter((r) => !inDirection.has(r.d.romeCode));
  const othersShown = others.filter((r) => signalStrength(r.d.matchRaritySum) !== "exploratory");
  const othersFaible = others.length - othersShown.length;

  return { p, ans, inv, res, roles, allGroups, before, directions, dropped, othersShown, othersFaible, cf, violations, mappedCounts, idf };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const SIG = { strong: "fort", partial: "moyen", exploratory: "faible" } as const;
const BUCKET = { apply_now: "Accessible maintenant", bridge: "À portée", long_term: "Plus long terme", not_now: "Pas maintenant" } as const;

async function main() {
  const [dir, outFile] = process.argv.slice(2);
  if (!dir || !outFile) throw new Error("usage: directions-prototype.ts <romeCsvDir> <out.md>");
  const rome = loadRome(dir);
  const naming = loadNaming(path.resolve("docs/rome/naming-draft-2026-11-21.md"));
  const capName = (cap: string) => naming.capacity(cap);
  const sectorOf = (code: string) => naming.sector(code, rome.sector(code));
  const L: string[] = [];
  const out = (s = "") => L.push(s);
  type Run = Awaited<ReturnType<typeof analyse>>;
  const runs: Run[] = [];
  for (const p of PERSONAS) runs.push(await analyse(p, rome));
  // Wider population: one quiz-only persona per theme and every seed depth with
  // no answers ("none" matches no cluster).
  const wide: Run[] = [...runs];
  for (const q of QUIZ_ONLY) wide.push(await analyse(q, rome));
  for (const f of FAMILIES)
    for (const d of f.depths)
      wide.push(await analyse({ id: `seed ${f.id}:${d.id}`, label: "seed seul", theme: "none", seed: `${f.id}:${d.id}`, diploma: "bac2" }, rome));

  const kindWord = (k: Kind) => (k === "révélée" ? "R" : k === "continuité" ? "C" : "–");
  const short = (d: Direction) => capName(d.capacities[0]).label;

  out("# Directions layer: prototype on data (v7)");
  out("");
  out("Generated by `scripts/directions-prototype.ts` on the live ROME graph and live offers (Paris). No UI, no engine weights changed.");
  out("");
  out("## Method");
  out("");
  out(`Capacity level **${LEVEL}**, weight **${WEIGHT}**${WEIGHT === "distinctive" ? ` (idf − ${GENERIC_FLOOR}, the engine's generic floor)` : ""}. Top ${TOP_ROLES} roles in page order, grouped by main driving capacity (≥ ${DRIVING_SHARE * 100} % of distinctive weight, at most ${MAX_DRIVING}); groups of 2+ roles only; at most ${MAX_DIRECTIONS} directions; a left-out role joins a chosen direction through its second capacity (unchanged since v6).`);
  out("");
  out("v7 decisions (2026-11-21):");
  out("1. **Révélée = counterfactual.** The same user is run again with the seed only. A member role is *brought by the answers* when it is not in the seed-only top " + TOP_ROLES + " (or ranks higher with the answers) **and** shares, in the direction's capacity, at least one skill only the answers gave. A direction is *révélée* when more than half its roles are brought by the answers, else *continuité*. No seed: no tag.");
  out(`2. **Evidence bar**: at least ${MIN_EVIDENCE} distinct shared distinctive skills (idf above ${GENERIC_FLOOR}) in the main capacity, across the member roles; a révélée direction also needs answers from at least ${MIN_ANSWERS_REVEALED} different quiz scenes. Applied before the ${MAX_DIRECTIONS} slots are filled; below the bar, the roles go to Autres pistes.`);
  out("3. **Genericity** of roles on the wide set: see the last section (diagnosis only, no fix).");
  out("4. **Names** from the naming draft (docs/rome/naming-draft-2026-11-21.md): main capacity only, the second as a subline. **Sectors** from the same draft (grand domaine; K and M by domaine professionnel).");
  out("5. **Copyable titles**: main ROME title (PRINCIPALE appellation) + up to 2 appellations sharing a key word with it; the rest counted as *Plus d'intitulés*.");
  out("6. **Order**: révélée directions first, then by strength.");
  out("7. **Autres pistes**: role, sector, signal; no reasons; *faible* roles only counted (behind a link in the UI).");
  out("");

  out("## Summary: before (v6) and after (v7)");
  out("");
  out("| Persona | Before (v6) | After (v7) | Removed by the evidence bar | Autres pistes shown / faible counted | Honesty |");
  out("|---|---|---|---|---|---|");
  for (const r of runs) {
    const b = r.before.map((d) => `${short(d)} (${d.kindV6 === "révélée" ? "R" : "C"})`).join("; ");
    const a = r.directions.map((d) => `${short(d)} (${kindWord(d.kind)})`).join("; ");
    const beforeCaps = new Set(r.before.map((d) => d.capacities[0]));
    const removed = r.dropped.filter((d) => beforeCaps.has(d.capacities[0])).map((d) => short(d));
    out(`| ${r.p.id} ${r.p.label} | ${b} | ${a || "aucune"} | ${removed.join("; ") || "–"} | ${r.othersShown.length} / ${r.othersFaible} | ${r.violations.length ? `✗ ${r.violations.length}` : "✓"} |`);
  }
  out("");
  out("R = révélée par vos réponses, C = dans la continuité de votre parcours, – = no tag (no seed). Before: v6 split (≥ 50 % of shared rarity from answers). After: counterfactual.");
  out("");

  for (const r of runs) {
    out(`## ${r.p.id}: ${r.p.label}`);
    out("");
    out(`Seed: ${r.p.seed ?? "aucun"}; diplôme ${r.p.diploma}; inventaire ${r.inv.competenceCodes.length} compétences (${r.inv.seededCodes?.length ?? 0} du seed); ${r.res.directions.length} pistes surfacées.`);
    out("");
    out(`**Before (v6):** ${r.before.map((d, i) => `${i + 1}. ${short(d)} (${d.kindV6}, ${d.roles.length} métiers, preuves ${d.evidence}, ${d.answerScenes} réponses)`).join("; ")}.`);
    out("");
    const beforeCaps = new Set(r.before.map((d) => d.capacities[0]));
    const removed = r.dropped.filter((d) => beforeCaps.has(d.capacities[0]));
    if (removed.length) {
      out("**Removed by the evidence bar:**");
      for (const d of removed) out(`- ${short(d)}: ${d.thin}. Ses ${d.roles.length} métiers vont dans Autres pistes.`);
      out("");
    }
    out(`**After (v7):** ${r.directions.length} direction${r.directions.length > 1 ? "s" : ""}.`);
    out("");
    for (const [i, d] of r.directions.entries()) {
      const nm = capName(d.capacities[0]);
      out(`### ${i + 1}. ${nm.label}`);
      out("");
      if (d.capacities[1]) out(`*Aussi : ${capName(d.capacities[1]).label}*`);
      if (d.capacities[1]) out("");
      const kindLine =
        d.kind === "révélée"
          ? `**Révélée par vos réponses**: ${d.byAnswers} des ${d.roles.length} métiers sont apportés par vos réponses.`
          : d.kind === "continuité"
            ? `**Dans la continuité de votre parcours**: ${d.byAnswers} des ${d.roles.length} métiers sont apportés par vos réponses.`
            : "Pas d'étiquette (pas de parcours renseigné).";
      out(`${kindLine} Preuves : ${d.evidence} compétences distinctives partagées dans « ${d.capacities[0]} »; ${d.answerScenes} réponse${d.answerScenes > 1 ? "s" : ""} différente${d.answerScenes > 1 ? "s" : ""}.${d.attached ? ` ${d.attached} métier${d.attached > 1 ? "s" : ""} rattaché${d.attached > 1 ? "s" : ""} par leur 2e capacité.` : ""}`);
      const flags = [nm.flag && `nom : ${nm.flag}`, d.capacities[1] && capName(d.capacities[1]).flag && `sous-titre : ${capName(d.capacities[1]).flag}`].filter(Boolean);
      if (flags.length) out(`⚑ ${flags.join("; ")}`);
      out("");
      if (d.answers.length) {
        out("Vos réponses derrière cette direction :");
        for (const a of d.answers.slice(0, 4)) out(`- « ${a.src.option} » (${a.src.scene}, ${a.skills} compétence${a.skills > 1 ? "s" : ""} partagée${a.skills > 1 ? "s" : ""})`);
      } else {
        out("Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.");
      }
      out("");
      const withCf = !!r.p.seed;
      out(`| Métier | Secteur | Signal |${withCf ? " Sans vos réponses |" : ""} Intitulés à copier | Plus d'intitulés |`);
      out(`|---|---|---|${withCf ? "---|" : ""}---|---|`);
      for (const role of d.roles) {
        const t = copyTitles(rome, role.d.romeCode, role.d.title);
        const s = sectorOf(role.d.romeCode);
        const c = r.cf.get(role.d.romeCode);
        const capSet = new Set(d.capacities);
        const brought = !!c?.moved && role.d.matchedCompetenceCodes.some((x) => capSet.has(rome.capacityOf(x)) && r.ans && answerSources(r.ans).has(x) && !seedSources(r.p.seed).has(x));
        const cfCell = withCf ? ` ${c ? `${c.status}${brought ? " ✔" : ""}` : "?"} |` : "";
        out(`| ${role.d.title} | ${s.label}${s.flag ? " ⚑" : ""} | ${SIG[signalStrength(role.d.matchRaritySum)]} |${cfCell} ${[t.main, ...t.close].join(" ; ")} | ${t.more ? `+${t.more}` : "–"} |`);
      }
      out("");
    }
    if (r.directions.length < MIN_DIRECTIONS) {
      out(`**${r.directions.length} direction${r.directions.length > 1 ? "s" : ""} only** (fewer than ${MIN_DIRECTIONS}).`);
      out("");
    }
    out(`### Autres pistes (${r.othersShown.length} affichées; ${r.othersFaible} au signal faible, derrière un lien)`);
    out("");
    out("| Métier | Secteur | Signal |");
    out("|---|---|---|");
    for (const o of r.othersShown) {
      const s = sectorOf(o.d.romeCode);
      out(`| ${o.d.title} | ${s.label}${s.flag ? " ⚑" : ""} | ${SIG[signalStrength(o.d.matchRaritySum)]} |`);
    }
    out("");
    if (r.violations.length) {
      out("Honesty violations:");
      for (const v of r.violations) out(`- ${v}`);
      out("");
    }
  }

  // Contrast
  const [a, b] = CONTRAST.map((id) => runs.find((r) => r.p.id === id)!);
  out(`## Contrast: ${a.p.id} vs ${b.p.id}, same seed (${a.p.seed}), different answers`);
  out("");
  out(`| | ${a.p.id} (${a.p.theme}) | ${b.p.id} (${b.p.theme}) |`);
  out("|---|---|---|");
  for (let i = 0; i < Math.max(a.directions.length, b.directions.length); i++) {
    const cell = (d?: Direction) =>
      d ? `**${short(d)}** (${d.kind ?? "–"})<br>${d.answers.slice(0, 2).map((x) => `« ${x.src.option} »`).join("<br>") || "(parcours)"}` : "";
    out(`| ${i + 1} | ${cell(a.directions[i])} | ${cell(b.directions[i])} |`);
  }
  out("");

  // Flags across every persona run (10 + wide)
  out("## Naming and sector flags");
  out("");
  const nameFlags = new Map<string, { flag: string; n: number }>();
  const sectorFlags = new Map<string, number>();
  for (const r of wide) {
    for (const d of r.directions)
      for (const cap of d.capacities) {
        const f = capName(cap).flag;
        if (f) nameFlags.set(cap, { flag: f, n: (nameFlags.get(cap)?.n ?? 0) + 1 });
      }
    for (const role of [...r.directions.flatMap((d) => d.roles.map((x) => x.d)), ...r.othersShown.map((o) => o.d)]) {
      const f = sectorOf(role.romeCode).flag;
      if (f) sectorFlags.set(f, (sectorFlags.get(f) ?? 0) + 1);
    }
  }
  out(`Capacities used as a name or subline whose name is flagged (all ${wide.length} personas):`);
  out("");
  if (nameFlags.size === 0) out("- none");
  for (const [cap, v] of [...nameFlags].sort((x, y) => y[1].n - x[1].n)) out(`- « ${cap} »: ${v.flag} (${v.n} direction${v.n > 1 ? "s" : ""})`);
  out("");
  out("Sector labels flagged (roles shown in directions or Autres pistes):");
  out("");
  if (sectorFlags.size === 0) out("- none");
  for (const [f, n] of [...sectorFlags].sort((x, y) => y[1] - x[1])) out(`- ${f} (${n} rows)`);
  out("");

  // Capacity frequency (v6's "too generic" check, kept with the new names)
  const capFreq = (set: Run[]) => {
    const n = new Map<string, number>();
    for (const r of set) for (const cap of new Set(r.directions.map((d) => short(d)))) n.set(cap, (n.get(cap) ?? 0) + 1);
    return [...n.entries()].sort((x, y) => y[1] - x[1]);
  };
  out("## Directions that appear for many personas");
  out("");
  for (const [label, set] of [["the 10 report personas", runs], [`the wide set of ${wide.length}`, wide]] as const) {
    out(`**${label}**: ${capFreq(set).slice(0, 6).map(([cap, k]) => `"${cap}" ${k}/${set.length}`).join(", ")}.`);
    out("");
  }
  const few = wide.filter((r) => r.directions.length < MIN_DIRECTIONS);
  out(`Personas with fewer than ${MIN_DIRECTIONS} directions after the evidence bar: ${few.length}/${wide.length}${few.length ? ` (${few.map((r) => `${r.p.id}: ${r.directions.length}`).join(", ")})` : ""}.`);
  out("");

  // Decision item 3: role genericity. The rule (> 40 % of the wide set) and,
  // because the wide set is mostly seed-only personas with no answers, the same
  // table on the personas who answered the quiz.
  const GENERIC_SHARE = 0.4;
  const clustersOf = (code: string) => CLUSTERS.filter((c) => c.competenceCodes.includes(code)).map((c) => c.id);
  const depthsOf = (code: string) => FAMILIES.reduce((s, f) => s + f.depths.filter((d) => d.seedCodes.includes(code)).length, 0);
  const metiers = await getRomeSource().allMetiers();
  const answered = wide.filter((r) => answerSources(r.ans).size > 0);
  const genericSummary: string[] = [];
  const diagnose = (set: Run[], label: string) => {
    out(`## Genericity: roles in the top ${TOP_ROLES} for more than ${GENERIC_SHARE * 100} % of ${label} (${set.length})`);
    out("");
    const presence = new Map<string, { title: string; ranks: number[]; personas: Run[] }>();
    for (const r of set)
      for (const [i, role] of r.roles.entries()) {
        const e = presence.get(role.d.romeCode) ?? { title: role.d.title, ranks: [], personas: [] };
        e.ranks.push(i + 1);
        e.personas.push(r);
        presence.set(role.d.romeCode, e);
      }
    const all = [...presence].sort((x, y) => y[1].personas.length - x[1].personas.length);
    const genericRoles = all.filter(([, e]) => e.personas.length > GENERIC_SHARE * set.length);
    genericSummary.push(`${label} (${set.length}): ${genericRoles.map(([c, e]) => `${c} ${e.personas.length}`).join(", ") || "none"}`);
    if (genericRoles.length === 0) {
      out(`None. Most frequent: ${all.slice(0, 5).map(([c, e]) => `${e.title} (${c}) ${e.personas.length}/${set.length}`).join("; ")}.`);
      out("");
      return;
    }
    out(`Carrying skills = the shared skills that contribute most rarity to the role across the personas where it is in the top ${TOP_ROLES}. *In inventories* = how many of these ${set.length} persona inventories hold the skill. *Comes from* = quiz clusters that contain it, and how many of the ${FAMILIES.reduce((s, f) => s + f.depths.length, 0)} seed depths inject it.`);
    out("");
    for (const [code, e] of genericRoles) {
      const median = [...e.ranks].sort((x, y) => x - y)[Math.floor(e.ranks.length / 2)];
      const contrib = new Map<string, number>();
      let total = 0;
      for (const r of e.personas) {
        const role = r.roles.find((x) => x.d.romeCode === code)!;
        for (const c of role.d.matchedCompetenceCodes) {
          const w = r.idf(c);
          contrib.set(c, (contrib.get(c) ?? 0) + w);
          total += w;
        }
      }
      const carriers = [...contrib].sort((x, y) => y[1] - x[1]).slice(0, 6);
      const kinds = { seed: 0, quiz: 0, both: 0 };
      for (const r of e.personas) kinds[r.p.seed ? (answerSources(r.ans).size > 0 ? "both" : "seed") : "quiz"]++;
      const s = sectorOf(code);
      out(`### ${e.title} (${code}, ${s.label})`);
      out("");
      out(`In the top ${TOP_ROLES} for **${e.personas.length}/${set.length}** (${Math.round((100 * e.personas.length) / set.length)} %): ${kinds.quiz} quiz only, ${kinds.both} seed and answers, ${kinds.seed} seed only. Median rank ${median}. ROME lists ${metiers.find((m) => m.romeCode === code)?.competences.length ?? "?"} skills for it. Personas: ${e.personas.map((r) => `${r.p.id}${r.p.theme !== "none" ? ` (${r.p.theme})` : ""}`).join(", ")}.`);
      out("");
      out("| Carrying skill | idf | Share of its rarity | In inventories | Comes from |");
      out("|---|---|---|---|---|");
      for (const [c, w] of carriers) {
        const cl = clustersOf(c);
        const dp = depthsOf(c);
        const has = set.filter((r) => r.inv.competenceCodes.includes(c)).length;
        out(`| ${rome.label(c)} (${c}) | ${set[0].idf(c).toFixed(1)} | ${Math.round((100 * w) / total)} % | ${has}/${set.length} | ${[cl.length ? `quiz: ${cl.join(", ")}` : "", dp ? `${dp} seed depths` : ""].filter(Boolean).join("; ") || "–"} |`);
      }
      out("");
    }
  };
  diagnose(wide, "the wide set");
  diagnose(answered, "the personas who answered the quiz");

  out("## Honesty");
  out("");
  const bad = wide.filter((r) => r.violations.length);
  out(`Violations across all ${wide.length} personas: ${bad.length ? bad.map((r) => `${r.p.id}: ${r.violations.join(", ")}`).join("; ") : "none"}.`);
  out("");

  writeFileSync(outFile, L.join("\n") + "\n");
  console.log(`wrote ${outFile}`);
  for (const r of runs) {
    console.log(`${r.p.id.padEnd(4)} ${r.directions.map((d) => `${short(d)} [${d.roles.length} ${kindWord(d.kind)} e${d.evidence} a${d.answerScenes}]`).join(" | ")}  ${r.violations.length ? "✗" + r.violations.length : "✓"}`);
  }
  for (const g of genericSummary) console.log(`generic roles (> ${GENERIC_SHARE * 100} %), ${g}`);
}

// Run only as a script (scripts/directions-parity.ts imports analyse).
if (/directions-prototype\.ts$/.test(process.argv[1] ?? "")) main().catch((e) => { console.error(e); process.exit(1); });
