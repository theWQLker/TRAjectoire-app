/**
 * Directions gate: honesty invariants per direction and per role, on the 66
 * personas (10 report personas, one quiz-only persona per theme, every seed
 * depth alone), plus the naming config against the naming draft.
 *
 * Each invariant is recomputed from the engine's raw output (results, answers,
 * ROME capacities), not read back from the directions layer's own counters.
 *
 * Usage (live sources only):
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/directions-gate.ts
 * Exit 1 on any violation.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { signalStrength } from "../src/lib/engine/coverage";
import { getRomeSource, rarityOf } from "../src/lib/rome";
import {
  computeDirections,
  capacityOf,
  capacityName,
  sectorLabel,
  hasSeed,
  DIRECTION_RULES as R,
} from "../src/lib/engine/directions";
import { CAPACITY_NAMES, SECTOR_BY_GRAND_DOMAINE, SECTOR_K, SECTOR_M } from "../config/naming";
import { CLUSTERS } from "../config/clusters";
import { CATEGORIES, LEAN_WEIGHTS, type Lean } from "../config/quiz";
import { FAMILIES } from "../config/families";
import { QUIZ_ONLY, themeAnswers, type ThemePersona } from "./theme-personas";
import { PERSONAS } from "./directions-prototype";

const GENERIC_FLOOR = Number(process.env.RARITY_GENERIC_FLOOR ?? "3");
const failures = new Map<string, string[]>();
const passes = new Map<string, number>();
function check(name: string, ok: boolean, detail: string) {
  if (ok) passes.set(name, (passes.get(name) ?? 0) + 1);
  else failures.set(name, [...(failures.get(name) ?? []), detail]);
}

// ---------------------------------------------------------------------------
// Naming config = naming draft
// ---------------------------------------------------------------------------
function draftTables(): Map<string, Map<string, string>> {
  const md = readFileSync(path.join(process.cwd(), "docs/rome/naming-draft-2026-11-21.md"), "utf8");
  const sections = new Map<string, Map<string, string>>();
  let current = "";
  for (const line of md.split(/\r?\n/)) {
    const h = /^#{2,3}\s+(.*)$/.exec(line);
    if (h) current = h[1];
    const row = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/.exec(line);
    if (!row || /^-+$/.test(row[1]) || /^(ROME objectif|Grand domaine|Domaine professionnel|any other)/.test(row[1])) continue;
    const m = sections.get(current) ?? new Map<string, string>();
    m.set(row[1], row[2].replace(/\s*\(.*\)\s*$/, ""));
    sections.set(current, m);
  }
  return sections;
}

function sameMap(a: Map<string, string>, b: Record<string, string>): string[] {
  const out: string[] = [];
  for (const [k, v] of a) if (b[k] !== v) out.push(`draft "${k}" → "${v}", config → "${b[k] ?? "(missing)"}"`);
  for (const k of Object.keys(b)) if (!a.has(k)) out.push(`config "${k}" not in the draft`);
  return out;
}

function checkNaming() {
  const t = draftTables();
  const pick = (prefix: string) => [...t].find(([k]) => k.startsWith(prefix))?.[1] ?? new Map<string, string>();
  for (const [label, draft, config] of [
    ["direction names", pick("1."), CAPACITY_NAMES],
    ["sectors by grand domaine", pick("By grand domaine"), SECTOR_BY_GRAND_DOMAINE],
    ["K sectors", pick("K,"), SECTOR_K],
    ["M sectors", pick("M,"), SECTOR_M],
  ] as const) {
    const diff = sameMap(draft, config);
    check("naming config matches the draft", diff.length === 0 && draft.size > 0, `${label}: ${diff.join("; ") || "empty table"}`);
  }
}

// ---------------------------------------------------------------------------
// Per direction and per role
// ---------------------------------------------------------------------------
const CLUSTER_CODES = new Map(CLUSTERS.map((c) => [c.id, new Set(c.competenceCodes)]));

/** Options the user actually leaned to, by scene: label → clusters (context-only sides excluded). */
function leanedOptions(answers: Answers): Map<string, Map<string, string[]>> {
  const out = new Map<string, Map<string, string[]>>();
  for (const cat of CATEGORIES)
    for (const s of cat.scenes) {
      const raw = answers[s.id];
      if (!raw || !(raw in LEAN_WEIGHTS)) continue;
      const w = LEAN_WEIGHTS[raw as Lean];
      const m = new Map<string, string[]>();
      for (const [o, weight] of [[s.optionA, w.a], [s.optionB, w.b]] as const)
        if (weight > 0 && !o.maps.contextOnly) m.set(o.label, (o.maps.clusters ?? []).map((c) => c.id));
      out.set(s.id, m);
    }
  return out;
}

async function checkPersona(p: ThemePersona, idf: (c: string) => number) {
  const id = p.id;
  const answers = themeAnswers(p);
  const inv = buildInventory(answers);
  const results = await buildResults(inv);
  const dirs = await computeDirections(results, answers);
  const surfaced = new Map(results.directions.map((d) => [d.romeCode, d]));
  const notShown = new Set([...results.suppressed.map((s) => s.romeCode), ...results.heldBack.map((h) => h.romeCode)]);
  const invCodes = new Set(inv.competenceCodes);
  const leaned = leanedOptions(answers);
  const seeded = hasSeed(answers);

  check("at most 5 directions", dirs.directions.length <= R.MAX_DIRECTIONS, `${id}: ${dirs.directions.length}`);
  const kinds = dirs.directions.map((d) => d.kind);
  const firstContinuite = kinds.indexOf("continuite");
  check(
    "révélée directions come first",
    firstContinuite === -1 || !kinds.slice(firstContinuite).includes("revelee"),
    `${id}: ${kinds.join(",")}`,
  );

  const placed = new Map<string, string>();
  for (const d of dirs.directions) {
    const where = `${id} / ${d.name}`;
    const caps = new Set([d.capacity, ...(d.second ? [d.second.capacity] : [])]);
    // Evidence bar, recounted from the member roles' shared skills.
    const ev = new Set(
      d.roles.flatMap((m) => m.role.matchedCompetenceCodes.filter((c) => capacityOf(c) === d.capacity && idf(c) > GENERIC_FLOOR)),
    );
    check("evidence bar: ≥ 3 shared distinctive skills in the main capacity", ev.size >= R.MIN_EVIDENCE && ev.size === d.evidence, `${where}: ${ev.size} (reported ${d.evidence})`);
    check("no tag without a seed", seeded || d.kind === null, `${where}: ${d.kind}`);
    check("a seeded direction is révélée or continuité", !seeded || d.kind !== null, `${where}: null`);
    const scenes = new Set(d.answers.map((a) => a.sceneId));
    check("révélée has ≥ 2 different answers behind it", d.kind !== "revelee" || scenes.size >= R.MIN_ANSWERS_REVEALED, `${where}: ${scenes.size}`);
    check(
      "révélée means most roles were brought by the answers",
      d.kind !== "revelee" || d.roles.filter((m) => m.broughtByAnswers).length * 2 > d.roles.length,
      `${where}: ${d.roles.filter((m) => m.broughtByAnswers).length}/${d.roles.length}`,
    );
    check("a direction has ≥ 2 roles", d.roles.length >= 2, `${where}: ${d.roles.length}`);
    // Name: the draft's name of the main capacity, or the ROME wording itself.
    const nm = capacityName(d.capacity);
    check("the name is the draft's or the ROME wording", d.name === nm.name && (nm.flag !== "absent" || d.name === d.capacity), `${where}: "${d.name}" for "${d.capacity}"`);
    // Every quoted answer: answered, the side leaned to, and it gave a shared skill in this direction.
    const shared = new Set(d.roles.flatMap((m) => m.role.matchedCompetenceCodes.filter((c) => caps.has(capacityOf(c) ?? ""))));
    for (const a of d.answers) {
      const clusters = leaned.get(a.sceneId)?.get(a.option);
      const traced = (clusters ?? []).some((cl) => [...(CLUSTER_CODES.get(cl) ?? [])].some((c) => shared.has(c)));
      check("every quoted answer is one the user gave and traces to a shared skill here", !!clusters && traced, `${where}: "${a.option}" (${a.sceneId})`);
    }
    for (const m of d.roles) {
      const r = m.role;
      const rw = `${where} / ${r.romeCode}`;
      check("a role in a direction is a surfaced role", surfaced.has(r.romeCode) && !notShown.has(r.romeCode), rw);
      check("a role claims no skill outside the inventory", r.matchedCompetenceCodes.every((c) => invCodes.has(c)), rw);
      check("a role shares ≥ 1 skill", r.matchedCompetenceCodes.length > 0, rw);
      check("no faible role inside a direction", signalStrength(r.matchRaritySum) !== "exploratory", rw);
      check(
        "a role is driven by the direction's capacity (founding: main; attached: second)",
        m.attached ? m.driving[1] === d.capacity : m.driving[0] === d.capacity,
        `${rw}: driving ${m.driving.join(" / ")}`,
      );
      check("a role sits in one place only", !placed.has(r.romeCode), `${rw}: also in ${placed.get(r.romeCode)}`);
      placed.set(r.romeCode, d.name);
      const s = sectorLabel(r.romeCode);
      check("every role has a sector label", s.label.length > 0, rw);
    }
  }
  for (const r of dirs.others) {
    check("Autres pistes holds no faible role", signalStrength(r.matchRaritySum) !== "exploratory", `${id} / ${r.romeCode}`);
    check("a role sits in one place only", !placed.has(r.romeCode), `${id} / ${r.romeCode}: also in ${placed.get(r.romeCode)}`);
    placed.set(r.romeCode, "Autres pistes");
    check("an Autres pistes role is surfaced", surfaced.has(r.romeCode), `${id} / ${r.romeCode}`);
  }
  for (const r of dirs.othersFaible) {
    check("faible roles are counted, never listed", signalStrength(r.matchRaritySum) === "exploratory" && !placed.has(r.romeCode), `${id} / ${r.romeCode}`);
  }
  // Nothing lost: every top role is in a direction, in Autres pistes, or counted as faible.
  const top = [...results.directions]
    .sort((a, b) => Number(b.isWildcard ?? false) - Number(a.isWildcard ?? false) || b.coherenceRank - a.coherenceRank || b.coverage - a.coverage)
    .slice(0, R.TOP_ROLES)
    .map((d) => d.romeCode);
  const accounted = new Set([...placed.keys(), ...dirs.othersFaible.map((r) => r.romeCode)]);
  check("every top role is accounted for (direction, Autres pistes, or faible count)", top.every((c) => accounted.has(c)) && accounted.size === top.length, `${id}: ${top.filter((c) => !accounted.has(c)).join(",")}`);
  // Every group the bar removed is reported, never silent.
  for (const g of dirs.dropped) check("a removed group is counted with its reason", !!g.reason && g.roles >= 2, `${id} / ${g.name}`);
  return dirs.directions.length;
}

async function main() {
  if (process.env.ROME_SOURCE !== "live" || process.env.OFFER_SOURCE !== "live")
    throw new Error("the directions gate runs on ROME_SOURCE=live OFFER_SOURCE=live only");
  checkNaming();
  const source = getRomeSource();
  const [rarity, metiers] = await Promise.all([source.competenceRarity(), source.allMetiers()]);
  const idf = (c: string) => rarityOf(rarity, c, metiers.length);
  const personas: ThemePersona[] = [
    ...PERSONAS,
    ...QUIZ_ONLY,
    ...FAMILIES.flatMap((f) =>
      f.depths.map((d) => ({ id: `seed ${f.id}:${d.id}`, label: "seed seul", theme: "none", seed: `${f.id}:${d.id}`, diploma: "bac2" })),
    ),
  ];
  let directions = 0;
  for (const p of personas) directions += await checkPersona(p, idf);

  const names = [...new Set([...passes.keys(), ...failures.keys()])];
  console.log(`Directions gate — ${personas.length} personas, ${directions} directions`);
  for (const n of names) {
    const f = failures.get(n) ?? [];
    console.log(`  ${f.length ? "✗" : "✓"} ${n} (${passes.get(n) ?? 0} ok${f.length ? `, ${f.length} failed` : ""})`);
    for (const d of f.slice(0, 5)) console.log(`      ${d}`);
  }
  const failed = names.filter((n) => failures.has(n)).length;
  console.log(failed ? `DIRECTIONS GATE: ${failed}/${names.length} invariants FAIL` : `DIRECTIONS GATE: ${names.length}/${names.length} invariants hold`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
