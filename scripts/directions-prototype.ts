/**
 * DIRECTIONS LAYER — prototype on data, no UI (brief 2026-11-20).
 *
 * A direction = a group of surfaced roles sharing the same driving capacities,
 * named in plain words. Everything below is deterministic; no LLM, no weights
 * touched. Engine output (buildResults) is read, never changed.
 *
 * Method
 *  1. Capacity of a shared skill = its ROME "enjeu" (32 plain-word domains of
 *     the official competence tree, e.g. "Relation client"). Savoirs, which sit
 *     outside that tree, fall back to their ROME savoir category.
 *  2. A role's capacity profile = Σ idf of its shared skills per capacity (the
 *     same rarity the engine ranks with). Driving capacities = the top ones
 *     covering ≥ 60 % of that weight, at most 2.
 *  3. Roles considered: the top 40 surfaced roles in page order. Grouped by
 *     their primary driving capacity; the 3 to 5 strongest groups (Σ display
 *     rank) are the directions, groups of 2+ first.
 *  4. Provenance of a shared skill: the quiz answers whose chosen option fed a
 *     cluster containing it, and/or the seed niche that injected it.
 *     "Révélée par vos réponses" when ≥ 50 % of the direction's shared-skill
 *     rarity comes from answers, else "Dans la continuité de votre parcours"
 *     (a skill from both counts half to each).
 *  5. Trait lines = the quoted answer options behind a direction, each traced
 *     to a skill a member role shares. No personality claim is generated.
 *  6. Copyable titles = ROME appellations (open data), PRINCIPALE first, "peu
 *     usité" dropped. Never ad titles.
 *
 * Personas are generated from a theme (a set of clusters): each quiz scene is
 * answered with the option whose clusters overlap the theme most, both when
 * tied, skipped when neither does. Same rule, different themes → the answers,
 * and so the trait lines, differ.
 *
 * Data: ROME open data CSV bundle (Licence Ouverte 2.0), extracted to a folder:
 *   https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/csv
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/directions-prototype.ts <romeCsvDir> <out.md>
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
  mapped: (code: string) => "competence" | "savoir" | "none";
};

function loadRome(dir: string): Rome {
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
  return {
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
// Personas
// ---------------------------------------------------------------------------
const THEMES: Record<string, string[]> = {
  relation: ["relation_client", "contact", "empathie", "pedagogie", "transmission", "gestion_conflit", "besoin_harmonie"],
  analyse: ["analyse", "systemes", "investigation", "diagnostic", "rigueur", "detection_incoherence", "synthese", "reporting", "gestion_donnees"],
  terrain: ["manuel", "technique", "terrain", "resolution", "execution", "pragmatisme", "fiabilite"],
  vente: ["vente", "persuasion", "relation_client", "contact", "assurance", "presentation"],
  organisation: ["organisation", "planification", "leadership", "priorisation", "decision_incertitude", "fiabilite", "terrain"],
};

type Persona = { id: string; label: string; theme: keyof typeof THEMES; seed?: string; diploma: string };
const PERSONAS: Persona[] = [
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

function answersFor(p: Persona): Answers {
  const theme = new Set(THEMES[p.theme]);
  const a: Answers = { c_departement: "75", c_diploma: p.diploma };
  if (p.seed) a[SEED_ANSWER_KEY] = p.seed;
  for (const cat of CATEGORIES) {
    for (const s of cat.scenes) {
      const score = (o: typeof s.optionA) =>
        (o.maps.clusters ?? []).reduce((t, c) => t + (theme.has(c.id) ? c.weight : 0), 0);
      const sa = score(s.optionA);
      const sb = score(s.optionB);
      if (sa === 0 && sb === 0) continue;
      a[s.id] = sa > sb ? "plutot_a" : sb > sa ? "plutot_b" : "les_deux";
    }
  }
  return a;
}

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
        if (weight <= 0) continue;
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

type Direction = {
  name: string;
  capacities: string[];
  roles: Role[];
  strength: number;
  answerShare: number;
  answers: { src: AnswerSource; skills: number }[];
  seedNiche: string | null;
  kind: "Révélée par vos réponses" | "Dans la continuité de votre parcours";
  incoherent: boolean;
  meanJaccard: number;
  /** Roles that joined through their SECOND driving capacity (step 3b). */
  attached: number;
  /** ROME grand domaines (first letter) of the member roles, with counts. */
  domains: Map<string, number>;
};

const NO_CAPACITY = "Sans capacité distinctive";

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const inter = b.filter((x) => A.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni ? inter / uni : 0;
}

async function analyse(p: Persona, rome: Rome) {
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

  const top = sortForDisplay(res.directions).slice(0, TOP_ROLES);
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

  // Group by primary driving capacity.
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
  // A role with no distinctive capacity is not a direction (it stays a role).
  const candidates = allGroups.filter((g) => g.cap !== NO_CAPACITY);
  const multi = candidates.filter((g) => g.rs.length >= 2).sort((a, b) => b.strength - a.strength);
  const single = candidates.filter((g) => g.rs.length === 1).sort((a, b) => b.strength - a.strength);
  let chosen = multi.slice(0, MAX_DIRECTIONS).map((g) => ({ ...g, rs: [...g.rs], attached: 0 }));
  if (chosen.length < MIN_DIRECTIONS)
    chosen = [...chosen, ...single.slice(0, MIN_DIRECTIONS - chosen.length).map((g) => ({ ...g, rs: [...g.rs], attached: 0 }))];
  // 3b. A role left out joins the strongest chosen direction whose capacity is
  // its second driver. Others stay outside (counted in the report).
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

  const directions: Direction[] = chosen.map((g) => {
    // Secondary capacity: the most common second driver among members.
    const second = new Map<string, number>();
    for (const r of g.rs) {
      const other = r.driving.find((c) => c !== g.cap);
      if (other) second.set(other, (second.get(other) ?? 0) + 1);
    }
    const sec = [...second.entries()].sort((a, b) => b[1] - a[1])[0];
    const capacities = sec && sec[1] * 2 >= g.rs.length ? [g.cap, sec[0]] : [g.cap];
    const capSet = new Set(capacities);

    // Provenance over the member roles' shared skills in the driving capacities.
    let aW = 0;
    let sW = 0;
    const answerHits = new Map<string, { src: AnswerSource; skills: Set<string> }>();
    let seedNiche: string | null = null;
    for (const r of g.rs) {
      for (const c of r.d.matchedCompetenceCodes) {
        if (!capSet.has(rome.capacityOf(c))) continue;
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
    const answerShare = aW + sW > 0 ? aW / (aW + sW) : 0;
    const pairs: number[] = [];
    for (let i = 0; i < g.rs.length; i++)
      for (let j = i + 1; j < g.rs.length; j++)
        pairs.push(jaccard(g.rs[i].d.matchedCompetenceCodes, g.rs[j].d.matchedCompetenceCodes));
    const meanJaccard = pairs.length ? pairs.reduce((s, v) => s + v, 0) / pairs.length : 1;
    const domains = new Map<string, number>();
    for (const r of g.rs) domains.set(r.d.romeCode[0], (domains.get(r.d.romeCode[0]) ?? 0) + 1);
    const majority = Math.max(...domains.values()) / g.rs.length;
    return {
      name: capacities.join(" et "),
      capacities,
      roles: g.rs,
      strength: g.strength,
      answerShare,
      answers: [...answerHits.values()]
        .map((h) => ({ src: h.src, skills: h.skills.size }))
        .sort((a, b) => b.skills - a.skills),
      seedNiche,
      kind: answerShare >= 0.5 ? "Révélée par vos réponses" : "Dans la continuité de votre parcours",
      // Incoherent = 3+ roles and no ROME grand domaine holds half of them.
      incoherent: g.rs.length >= 3 && majority < 0.5,
      meanJaccard,
      attached: g.attached,
      domains,
    };
  });

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
      if (!clusterCodes.some((c) => memberSkills.has(c))) violations.push(`"${a.src.option}" traces to no shared skill in ${dir.name}`);
    }
  }

  const mappedCounts = { competence: 0, savoir: 0, none: 0 };
  for (const r of roles) for (const c of r.d.matchedCompetenceCodes) mappedCounts[rome.mapped(c)]++;

  return { p, ans, inv, res, roles, allGroups, directions, violations, mappedCounts };
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
  const L: string[] = [];
  const out = (s = "") => L.push(s);
  const runs = [];
  for (const p of PERSONAS) runs.push(await analyse(p, rome));

  out("# Directions layer — prototype on data");
  out("");
  out(`Generated by \`scripts/directions-prototype.ts\` on live ROME graph + live offers (Paris). No UI, no weights changed.`);
  out("");
  out("## Method");
  out("");
  out(`Variant: capacity level **${LEVEL}**, weight **${WEIGHT}**${WEIGHT === "distinctive" ? ` (idf − ${GENERIC_FLOOR}, the engine's generic floor)` : ""}, savoirs ${SAVOIRS_DRIVE ? "drive" : "do not drive"} directions, membership ${MEMBERSHIP ? `moyen/fort roles whose main capacity holds ≥ ${MIN_PRIMARY_SHARE * 100} % of their distinctive weight` : "every top role"}.`);
  out("");
  out("1. **Capacity** of a shared skill = its ROME *enjeu* (the 32 named domains of the official competence tree). Savoirs, outside that tree, use their ROME savoir category.");
  out(`2. **Role profile** = rarity (idf) of its shared skills summed per capacity. **Driving capacities** = the top ones covering ≥ ${DRIVING_SHARE * 100} % of it, at most ${MAX_DRIVING}.`);
  out(`3. **Directions** = the top ${TOP_ROLES} roles in page order, grouped by primary driving capacity; the ${MIN_DIRECTIONS} to ${MAX_DIRECTIONS} strongest groups (sum of display rank), groups of 2+ first. Name = the capacity, plus the second capacity when half the members share it.`);
  out("4. **Révélée / continuité**: rarity-weighted share of the direction's shared skills (in its driving capacities) that came from quiz answers vs the seed; ≥ 50 % answers → *Révélée par vos réponses*. A skill from both counts half each.");
  out("5. **Why / trait lines** = the answer options the user chose, quoted, each traced to a skill a member role shares (checked below). Nothing is inferred about the person.");
  out("6. **Copyable titles** = ROME appellations (open data v462, Licence Ouverte 2.0), main title first, rarely-used titles dropped.");
  out("7. **Personas**: each answers every quiz scene with the option whose clusters overlap its theme most (both when tied, skipped when neither). Themes: " +
    Object.entries(THEMES).map(([k, v]) => `*${k}* (${v.join(", ")})`).join("; ") + ".");
  out("");

  // Summary table
  out("## Summary");
  out("");
  out("| Persona | Answers given | Directions | Révélée / continuité | Roles in directions / top " + TOP_ROLES + " | Groups before selection (singletons) | Largest group | Honesty |");
  out("|---|---|---|---|---|---|---|---|");
  for (const r of runs) {
    const answered = Object.keys(r.ans).filter((k) => k !== "c_departement" && k !== "c_diploma" && k !== SEED_ANSWER_KEY).length;
    const inDirs = r.directions.reduce((s, d) => s + d.roles.length, 0);
    const largest = Math.max(...r.allGroups.map((g) => g.rs.length));
    const singles = r.allGroups.filter((g) => g.rs.length === 1).length;
    const split = r.directions.map((d) => (d.kind.startsWith("Révélée") ? "R" : "C")).join("");
    out(`| ${r.p.id} ${r.p.label} | ${answered} | ${r.directions.length} | ${split} | ${inDirs} / ${r.roles.length} | ${r.allGroups.length} (${singles}) | ${largest} | ${r.violations.length ? `✗ ${r.violations.length}` : "✓"} |`);
  }
  out("");
  out("R = Révélée par vos réponses, C = Dans la continuité de votre parcours.");
  out("");

  for (const r of runs) {
    out(`## ${r.p.id} — ${r.p.label}`);
    out("");
    out(`Seed: ${r.p.seed ?? "aucun"} · diplôme ${r.p.diploma} · inventaire ${r.inv.competenceCodes.length} compétences (${r.inv.seededCodes?.length ?? 0} du seed) · ${r.res.directions.length} pistes surfacées`);
    out("");
    for (const [i, d] of r.directions.entries()) {
      out(`### ${i + 1}. ${d.name}`);
      out("");
      out(`*${d.kind}* — ${Math.round(d.answerShare * 100)} % de la rareté vient de vos réponses${d.seedNiche ? `, le reste de votre parcours (${d.seedNiche})` : ""}. ${d.roles.length} métier${d.roles.length > 1 ? "s" : ""}${d.attached ? ` (dont ${d.attached} par leur 2e capacité)` : ""}; domaines ROME ${[...d.domains].map(([k, v]) => `${k}×${v}`).join(" ")}; recoupement moyen des compétences ${d.meanJaccard.toFixed(2)}.${d.incoherent ? " **⚠ peu cohérent** : aucun domaine ROME ne réunit la moitié de ses métiers." : ""}`);
      out("");
      out(`Capacités motrices : ${d.capacities.join(" ; ")}`);
      out("");
      if (d.answers.length) {
        out("Vos réponses derrière cette direction :");
        for (const a of d.answers.slice(0, 4)) out(`- « ${a.src.option} » (${a.src.scene}, ${a.skills} compétence${a.skills > 1 ? "s" : ""} partagée${a.skills > 1 ? "s" : ""})`);
      } else {
        out("Aucune réponse du quiz derrière cette direction : elle vient de votre parcours.");
      }
      out("");
      out("| Métier | Signal | Groupe | Titres à copier (ROME) |");
      out("|---|---|---|---|");
      for (const role of d.roles) {
        const titles = rome.titles(role.d.romeCode).slice(0, 4).join(" ; ") || "—";
        out(`| ${role.d.title} | ${SIG[signalStrength(role.d.matchRaritySum)]} | ${BUCKET[role.d.bucketResult.category]} | ${titles} |`);
      }
      out("");
    }
    if (r.violations.length) {
      out("Honesty violations:");
      for (const v of r.violations) out(`- ${v}`);
      out("");
    }
  }

  // Contrast
  const [a, b] = CONTRAST.map((id) => runs.find((r) => r.p.id === id)!);
  out(`## Contrast — ${a.p.id} vs ${b.p.id}: same seed (${a.p.seed}), different answers`);
  out("");
  const diffScenes = Object.keys({ ...a.ans, ...b.ans }).filter((k) => a.ans[k] !== b.ans[k] && k !== "c_departement");
  out(`${diffScenes.length} answers differ.`);
  out("");
  out(`| | ${a.p.id} (${a.p.theme}) | ${b.p.id} (${b.p.theme}) |`);
  out("|---|---|---|");
  const rows = Math.max(a.directions.length, b.directions.length);
  for (let i = 0; i < rows; i++) {
    const cell = (d?: Direction) =>
      d
        ? `**${d.name}** (${d.kind.startsWith("Révélée") ? "révélée" : "continuité"})<br>${d.answers.slice(0, 2).map((x) => `« ${x.src.option} »`).join("<br>") || "(parcours)"}`
        : "";
    out(`| ${i + 1} | ${cell(a.directions[i])} | ${cell(b.directions[i])} |`);
  }
  out("");

  // Grouping failures
  out("## Where grouping fails");
  out("");
  for (const r of runs) {
    const largest = [...r.allGroups].sort((x, y) => y.rs.length - x.rs.length)[0];
    const singles = r.allGroups.filter((g) => g.rs.length === 1);
    const notes: string[] = [];
    if (largest.rs.length / r.roles.length >= 0.5) notes.push(`giant group: "${largest.cap}" holds ${largest.rs.length} of ${r.roles.length} roles`);
    if (singles.length >= 5) notes.push(`${singles.length} groups of one (${singles.slice(0, 4).map((g) => g.cap).join(", ")}${singles.length > 4 ? ", …" : ""})`);
    const inc = r.directions.filter((d) => d.incoherent);
    if (inc.length)
      notes.push(`incoherent (no ROME domain holds half the roles): ${inc.map((d) => `"${d.name}" (${[...d.domains].map(([k, v]) => `${k}×${v}`).join(" ")})`).join(", ")}`);
    const left = r.roles.length - r.directions.reduce((s, d) => s + d.roles.length, 0);
    if (left > r.roles.length / 2) notes.push(`${left} of ${r.roles.length} top roles fall outside the chosen directions`);
    out(`- **${r.p.id}**: ${notes.join("; ") || "no failure flagged"}`);
  }
  out("");
  out("Shared skills mapped to a capacity, all personas: " + (() => {
    const t = { competence: 0, savoir: 0, none: 0 };
    for (const r of runs) for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] += r.mappedCounts[k];
    const n = t.competence + t.savoir + t.none;
    return `${t.competence} via the competence tree, ${t.savoir} via savoir categories, ${t.none} unmapped (of ${n}).`;
  })());

  writeFileSync(outFile, L.join("\n") + "\n");
  console.log(`wrote ${outFile}`);
  for (const r of runs) {
    console.log(`${r.p.id.padEnd(4)} ${r.directions.map((d) => `${d.name} [${d.roles.length}${d.kind.startsWith("Révélée") ? " R" : " C"}]`).join(" | ")}  ${r.violations.length ? "✗" + r.violations.length : "✓"}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
