/**
 * Directions gate: honesty invariants per direction and per role, on the 66
 * personas (10 report personas, one quiz-only persona per theme, every seed
 * depth alone), plus the naming config against the naming draft.
 *
 * Each invariant is recomputed from the engine's raw output (results, answers,
 * ROME capacities), not read back from the directions layer's own counters.
 *
 * Directions-first page (2026-11-22): the answered personas also run in
 * Seine-Saint-Denis (93, no offer data) and in 75 + 93, and the page's view
 * model (src/app/results/directions-view.ts) is checked for: roles without ad
 * data kept in their direction; the À portée skill line obeying the 60 % /
 * 10-ad rule (recounted from the ads themselves); the 0-direction fallback; no
 * %, no score in any visible string; quotes verbatim.
 *
 * Round 2 (2026-11-22): no cached ad count and no "pas de données" tag anywhere;
 * one live France Travail link per listed role and chosen zone; a skill that
 * can't be named is one line per card, never a row line; directions with no
 * answer behind them say so, never silently. The révélée count per answered
 * persona in 75 is printed first (north-star number).
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
import { getOfferSource, type OfferCoverage } from "../src/lib/offers";
import { buildResultsView, viewStrings, skillsToAdd, COPY, SKILL_MIN_ADS, STARTER_ROLES, type RoleRow } from "../src/app/results/directions-view";
import { BUCKETS } from "../config/buckets";
import type { ResultDirection, Results } from "../src/lib/engine/results";
import {
  computeDirections,
  rolePool,
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

/** Recount, from the ads themselves, which skills the line may name (decision 2026-11-22). */
function expectedSkills(d: ResultDirection, invCodes: ReadonlySet<string>): string[] | null {
  if (d.bucketResult.category !== "bridge" || d.marketUnverified) return null;
  const ads = d.market.offers;
  if (ads.length < SKILL_MIN_ADS) return [];
  const listing = new Map<string, { libelle: string; n: number }>();
  for (const o of ads) {
    for (const c of new Set(o.competences.map((x) => x.code))) {
      const e = listing.get(c) ?? { libelle: o.competences.find((x) => x.code === c)!.libelle, n: 0 };
      e.n++;
      listing.set(c, e);
    }
  }
  return [...listing.entries()]
    .filter(([c, e]) => e.n / ads.length >= BUCKETS.GATE_FRACTION && !invCodes.has(c))
    .map(([, e]) => e.libelle);
}

/** The page's view model for this persona: the strings a user sees. */
function checkView(
  id: string,
  answers: Answers,
  results: Results,
  dirs: Awaited<ReturnType<typeof computeDirections>>,
  invCodes: ReadonlySet<string>,
  coverage: OfferCoverage,
) {
  const selected = results.inventory.constraints.departements ?? [results.inventory.constraints.departement];
  const view = buildResultsView({
    directions: dirs,
    answers,
    inventoryCodes: invCodes,
    selected,
    titles: new Map(),
    roleHref: (c) => `/results/direction/${c}`,
    seedHref: "/quiz?reprendre=x",
  });
  const byCode = new Map(rolePool(results).map((d) => [d.romeCode, d]));
  const covered = new Set(coverage.map((c) => c.departement));
  const zoneWithoutData = selected.some((d) => !covered.has(d));

  // 0-direction fallback (decision 2026-11-22).
  const n = dirs.directions.length;
  if (n === 0) {
    check(
      "0 directions: the fallback line, Autres pistes open, the seed link only without a seed",
      view.heading === null &&
        view.fallback?.text === COPY.noDirection &&
        (view.others === null || view.others.open) &&
        (view.fallback.seedHref !== null) === !dirs.seeded,
      `${id}: heading ${view.heading}, fallback ${view.fallback?.text}, others open ${view.others?.open}, seed link ${view.fallback?.seedHref}`,
    );
  } else {
    check(
      "1 or more directions: all shown, counted, first open, Autres pistes closed, no fallback",
      view.heading === `${n} direction${n === 1 ? "" : "s"} pour vous` &&
        view.fallback === null &&
        view.directions.length === n &&
        view.directions.every((c, i) => c.open === (i === 0)) &&
        (view.others === null || !view.others.open),
      `${id}: ${view.heading}`,
    );
  }

  // Autres pistes (decision 2026-11-23): the link only when it has roles, counting
  // them; never « (0) ». The faible count line stays whenever there are faible roles.
  const nOthers = dirs.others.length;
  const nFaible = dirs.othersFaible.length;
  check(
    "Autres pistes: a link with its count only when it holds roles, never (0); the faible line whenever faible roles exist",
    (view.others?.label ?? null) === (nOthers > 0 ? `Autres pistes à explorer (${nOthers})` : null) &&
      (view.others?.rows.length ?? 0) === nOthers &&
      (view.others?.faible ?? null) === (nFaible > 0 ? COPY.faibleCount(nFaible) : null) &&
      !viewStrings(view).some((t) => t != null && /\(0\)/.test(t)),
    `${id}: label ${view.others?.label}, rows ${nOthers}, faible ${nFaible}`,
  );

  const rows: RoleRow[] = [...view.directions.flatMap((c) => [...c.roles, ...c.moreRoles]), ...(view.others?.rows ?? [])];
  const unknown = (rs: RoleRow[]) => rs.some((r) => expectedSkills(byCode.get(r.romeCode)!, invCodes)?.length === 0);
  for (const r of rows) {
    const d = byCode.get(r.romeCode)!;
    const rw = `${id} / ${r.romeCode}`;
    // Skill line: named only when the recount allows it; nothing on the row otherwise.
    const exp = expectedSkills(d, invCodes);
    const shown = skillsToAdd(d, invCodes) ?? [];
    const ok =
      exp === null || exp.length === 0
        ? r.skillLine === null && r.skillUnknown === (exp !== null)
        : shown.length >= 1 &&
          shown.length <= 2 &&
          shown.every((l) => exp.includes(l)) &&
          r.skillLine === `${COPY.skillNamed}${shown.join(shown.length === 2 ? " et " : "")}`;
    check(
      "À portée skill line: named only from ≥ 60 % of ≥ 10 ads and missing from the profile; else no row line",
      ok,
      `${rw}: "${r.skillLine}" unknown ${r.skillUnknown}, expected ${JSON.stringify(exp)}`,
    );
  }
  // The unknown-skill line: once per card (or list) holding such a role, and only there.
  for (const [where, note, rs] of [
    ...view.directions.map((c): [string, string | null, RoleRow[]] => [c.name, c.skillNote, [...c.roles, ...c.moreRoles]]),
    ...(view.others ? [["Autres pistes", view.others.skillNote, view.others.rows] as [string, string | null, RoleRow[]]] : []),
  ]) {
    check(
      "the unknown-skill line is one line per card, shown iff a listed À portée role has no nameable skill",
      (note === COPY.skillUnknownCard) === unknown(rs) && (note === null || note === COPY.skillUnknownCard),
      `${id} / ${where}: note ${note}, expected ${unknown(rs)}`,
    );
  }
  // Market: one live France Travail search per listed role and chosen zone, nothing cached.
  for (const c of view.directions) {
    const want = c.roles.flatMap((r) =>
      selected.map((dep) => `motsCles=${r.romeCode}&offresPartenaires=true&lieux=${dep}D`),
    );
    const got = c.ftLinks.map((l) => l.href.split("?")[1] ?? "");
    check(
      "one live France Travail link per listed role and chosen zone",
      c.roles.length === Math.min(STARTER_ROLES, c.roles.length + c.moreRoles.length) &&
        JSON.stringify(got) === JSON.stringify(want) &&
        c.ftLinks.every((l) => l.href.startsWith("https://candidat.francetravail.fr/offres/recherche?")),
      `${id} / ${c.name}: ${got.join(" | ")} vs ${want.join(" | ")}`,
    );
  }
  for (const t of viewStrings(view)) {
    check(
      'no cached ad count and no "pas de données" tag in the page\'s strings',
      !/\d[\d\s\u202f]*annonces?\b|relevées? le|pas de données/i.test(t),
      `${id}: "${t}"`,
    );
  }

  // Never silent: directions shown with no answer behind them say where they come from.
  if (n > 0 && view.quotes.length === 0) {
    check(
      "directions with no answer behind them carry the parcours line (never silent)",
      dirs.seeded && view.answersNote === COPY.noAnswerDirection,
      `${id}: seeded ${dirs.seeded}, note ${view.answersNote}`,
    );
  } else {
    check("the parcours line only when no shown direction rests on an answer", view.answersNote === null, `${id}: ${view.answersNote}`);
  }
  // Why lines: "Vos N réponses ci-dessus" only when N is every quote shown; révélée names the seed-only counterfactual.
  for (const c of view.directions) {
    const d = dirs.directions.find((x) => x.capacity === c.capacity)!;
    const all = /\b[Vv]os (\d+) réponses ci-dessus/.exec(c.why ?? "");
    const one = /\b[Vv]otre réponse ci-dessus/.test(c.why ?? "");
    check(
      'why line: "Vos N réponses ci-dessus" only when the direction rests on all N quotes',
      (!all || (Number(all[1]) === view.quotes.length && d.answers.length === view.quotes.length)) &&
        (!one || (view.quotes.length === 1 && d.answers.length === 1)),
      `${id} / ${c.name}: "${c.why}" (${d.answers.length} of ${view.quotes.length})`,
    );
    if (d.kind === "revelee" && dirs.seeded) {
      check('a révélée why line ends "… seul ne mène pas ici."', !!c.why?.endsWith("seul ne mène pas ici."), `${id} / ${c.name}: "${c.why}"`);
    }
  }

  // Quotes: verbatim options the user leaned to, never a paraphrase.
  const leaned = leanedOptions(answers);
  const given = new Set([...leaned.values()].flatMap((m) => [...m.keys()]).map((o) => `« ${o} »`));
  for (const q of view.quotes) check("every quote at the top is an option the user chose, verbatim", given.has(q), `${id}: ${q}`);

  // No %, no score, no long dash, no middle dot in anything the page shows.
  for (const t of viewStrings(view)) {
    check("no % and no score in the page's strings", !/%|\bscore\b|\d+\s*\/\s*\d+/i.test(t), `${id}: "${t}"`);
    check("no long dash and no middle dot in the page's strings", !/—| · /.test(t), `${id}: "${t}"`);
  }
}

async function checkPersona(p: ThemePersona, idf: (c: string) => number, coverage: OfferCoverage, departement = "75") {
  const id = departement === "75" ? p.id : `${p.id} @${departement}`;
  const answers = themeAnswers(p, departement);
  const inv = buildInventory(answers);
  const results = await buildResults(inv);
  const dirs = await computeDirections(results, answers);
  const surfaced = new Map(rolePool(results).map((d) => [d.romeCode, d]));
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
  const top = rolePool(results)
    .sort((a, b) => Number(b.isWildcard ?? false) - Number(a.isWildcard ?? false) || b.coherenceRank - a.coherenceRank || b.coverage - a.coverage)
    .slice(0, R.TOP_ROLES)
    .map((d) => d.romeCode);
  const accounted = new Set([...placed.keys(), ...dirs.othersFaible.map((r) => r.romeCode)]);
  check("every top role is accounted for (direction, Autres pistes, or faible count)", top.every((c) => accounted.has(c)) && accounted.size === top.length, `${id}: ${top.filter((c) => !accounted.has(c)).join(",")}`);
  // Every group the bar removed is reported, never silent.
  for (const g of dirs.dropped) check("a removed group is counted with its reason", !!g.reason && g.roles >= 2, `${id} / ${g.name}`);

  checkView(id, answers, results, dirs, invCodes, coverage);

  // Ad data never decides membership (decision 2026-11-22): the same roles, in
  // the same order, stripped of their ads and marked unverified, must give the
  // same directions with the same members.
  if (departement === "75") {
    const strip = (d: ResultDirection): ResultDirection => ({
      ...d,
      market: { ...d.market, marketDemand: 0, offers: [], requirementProfile: [], commonTitles: [] },
      marketUnverified: true,
    });
    const blind = await computeDirections({ ...results, directions: [], unverified: rolePool(results).map(strip) }, answers);
    const shape = (x: typeof dirs) => JSON.stringify(x.directions.map((d) => [d.capacity, d.kind, d.roles.map((m) => m.role.romeCode)]));
    check(
      "ad data never decides membership: the same roles without ads give the same directions",
      shape(blind) === shape(dirs),
      `${id}: ${shape(dirs).slice(0, 200)} vs ${shape(blind).slice(0, 200)}`,
    );
  }
  return {
    directions: dirs.directions.length,
    revelee: dirs.directions.filter((d) => d.kind === "revelee").length,
    kinds: dirs.directions.map((d) => (d.kind === "revelee" ? "R" : d.kind === "continuite" ? "C" : "-")).join(""),
    unverifiedInDirections: dirs.directions.flatMap((d) => d.roles).filter((m) => m.role.marketUnverified).length,
  };
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
  const coverage = await getOfferSource().coverage();
  let directions = 0;
  let runs = 0;
  let kept = 0;
  const northStar: string[] = [];
  const answered = new Set([...PERSONAS, ...QUIZ_ONLY].map((p) => p.id));
  const elsewhere: [ThemePersona, string][] = [...PERSONAS, ...QUIZ_ONLY].flatMap((p): [ThemePersona, string][] => [
    [p, "93"],
    [p, "75,93"],
  ]);
  for (const [p, dep] of [...personas.map((p): [ThemePersona, string] => [p, "75"]), ...elsewhere]) {
    const r = await checkPersona(p, idf, coverage, dep);
    directions += r.directions;
    kept += r.unverifiedInDirections;
    runs++;
    if (dep === "75" && answered.has(p.id)) northStar.push(`${p.id.padEnd(16)} révélée ${r.revelee}   (${r.directions} directions: ${r.kinds || "none"})`);
  }
  // The no-data case must actually be exercised, not pass vacuously.
  check("roles without ad data in the zone are kept in directions (exercised)", kept > 0, `${kept} such roles across the 93 and 75+93 runs`);

  const names = [...new Set([...passes.keys(), ...failures.keys()])];
  const totalRev = northStar.reduce((s, l) => s + Number(/révélée (\d+)/.exec(l)![1]), 0);
  const withRev = northStar.filter((l) => !/révélée 0/.test(l)).length;
  console.log(`North star, révélée per answered persona in 75: ${totalRev} révélée across ${northStar.length} personas, ${withRev} with at least one`);
  for (const l of northStar) console.log(`  ${l}`);
  console.log(
    `Directions gate: ${personas.length} personas in 75, ${elsewhere.length} runs in 93 or 75+93 (${runs} runs), ` +
      `${directions} directions, ${kept} no-data roles kept in directions`,
  );
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
