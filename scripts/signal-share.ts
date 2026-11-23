/**
 * SIGNAL TIER MEASURE (Task 4, 2026-11-23). Two questions about the FORT cut.
 *
 *   1. ceiling  — for every job, the most matchRaritySum it can reach at 100 %
 *                 coverage of its own codes under the genericity bound (listed
 *                 in ≤ MAX_CODE_DOMAINES domaines). How many can never reach the
 *                 absolute FORT cut, and the distribution.
 *   2. snap     — every persona (the 116 of persona-sweep plus one seed-only
 *                 persona per niche), every surfaced role: the raw sum the tier
 *                 reads today, and the share of the job's own ceiling the person
 *                 covers (Σ idf of shared codes under the bound / ceiling).
 *                 Written to a JSON file; one engine run per persona serves every
 *                 candidate cut.
 *   3. sweep    — from a snap file: FORT counts per persona at each candidate
 *                 cut, for (a) the absolute cut and (b) the share, under the
 *                 criterion that set 350 (coverage.ts: at most 20 FORT per
 *                 persona, few personas over 10 — 4 of 48 then, so ≤ 1 in 12),
 *                 and the niche check for (b).
 *
 * Usage (live data, dev database):
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/signal-share.ts ceiling
 *   ... signal-share.ts snap <out.json>
 *   ... signal-share.ts sweep <snap.json>
 *   ... signal-share.ts report <snap.json> <A raw cut> <B share cut>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { getRomeSource, rarityOf } from "../src/lib/rome";
import type { RomeMetier } from "../src/lib/rome";
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { FAMILIES } from "../config/families";
import { MAX_CODE_DOMAINES } from "../config/genericity";
import { honestAnswers, NICHE_MEMBERS } from "./reach-map";
import { COGNITIVE, HR_ASSISTANT, MASTERS_HR, MASTERS_HR_OLD, SECRETARY } from "./honest-personas";

const FORT_TODAY = 350;
const MAX_FORT = 20;
const OVER10_SHARE = 4 / 48;

type Graph = { all: RomeMetier[]; idf: (c: string) => number; domaines: Map<string, number>; ceiling: Map<string, number> };

async function graph(): Promise<Graph> {
  const rome = getRomeSource();
  const all = await rome.allMetiers();
  const rarity = await rome.competenceRarity();
  const idf = (c: string) => rarityOf(rarity, c, all.length);
  const sets = new Map<string, Set<string>>();
  for (const j of all) for (const c of j.competences) {
    const s = sets.get(c.code) ?? new Set<string>();
    s.add(j.romeCode.slice(0, 3));
    sets.set(c.code, s);
  }
  const domaines = new Map([...sets].map(([c, s]) => [c, s.size]));
  const ceiling = new Map<string, number>();
  for (const j of all) {
    const codes = new Set(j.competences.map((c) => c.code).filter((c) => (domaines.get(c) ?? 0) <= MAX_CODE_DOMAINES));
    ceiling.set(j.romeCode, [...codes].reduce((s, c) => s + idf(c), 0));
  }
  return { all, idf, domaines, ceiling };
}

const q = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))];
};

async function ceilingReport() {
  const g = await graph();
  const rows = g.all.map((j) => {
    const all = new Set(j.competences.map((c) => c.code));
    const under = [...all].filter((c) => (g.domaines.get(c) ?? 0) <= MAX_CODE_DOMAINES);
    return { code: j.romeCode, title: j.title, codes: all.size, under: under.length, max: g.ceiling.get(j.romeCode)!, maxAll: [...all].reduce((s, c) => s + g.idf(c), 0) };
  });
  const maxes = rows.map((r) => r.max);
  console.log(`jobs: ${rows.length}; idf scale 0..${Math.log(rows.length + 1).toFixed(2)}; bound ≤ ${MAX_CODE_DOMAINES} domaines`);
  console.log(`ceiling (Σ idf of the job's codes under the bound) quantiles:`);
  for (const p of [0, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 1]) console.log(`  p${String(Math.round(p * 100)).padStart(3)}  ${q(maxes, p).toFixed(0)}`);
  const never = rows.filter((r) => r.max < FORT_TODAY);
  console.log(`\njobs that can NEVER reach FORT ${FORT_TODAY} (ceiling < ${FORT_TODAY}): ${never.length} of ${rows.length} (${((100 * never.length) / rows.length).toFixed(0)} %)`);
  console.log(`  same count with every code (no bound): ${rows.filter((r) => r.maxAll < FORT_TODAY).length}`);
  const edges = [0, 50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 800, 1000, Infinity];
  console.log(`\nhistogram of ceilings:`);
  for (let i = 0; i < edges.length - 1; i++) {
    const n = rows.filter((r) => r.max >= edges[i] && r.max < edges[i + 1]).length;
    console.log(`  ${String(edges[i]).padStart(4)}–${edges[i + 1] === Infinity ? "    " : String(edges[i + 1]).padStart(4)}  ${String(n).padStart(4)}  ${"#".repeat(Math.round(n / 10))}`);
  }
  console.log(`\nby ROME letter: jobs / ceiling < ${FORT_TODAY} / median ceiling`);
  for (const L of [...new Set(rows.map((r) => r.code[0]))].sort()) {
    const rs = rows.filter((r) => r.code[0] === L);
    console.log(`  ${L}  ${String(rs.length).padStart(4)}  ${String(rs.filter((r) => r.max < FORT_TODAY).length).padStart(4)}  ${q(rs.map((r) => r.max), 0.5).toFixed(0).padStart(5)}`);
  }
  const named = ["A1416", "M1805", "M1855", "M1607", "M1602", "M1501", "M1503", "K2503"];
  console.log(`\nnamed jobs: code ceiling (codes under bound / all)`);
  for (const c of named) {
    const r = rows.find((x) => x.code === c);
    if (r) console.log(`  ${c} ${r.title.slice(0, 44).padEnd(44)} ${r.max.toFixed(0).padStart(5)}  (${r.under}/${r.codes})`);
  }
}

type P = { name: string; kind: "niche" | "answers" | "hand" | "seed-only"; pick?: string; answers: Answers };
type Dir = { code: string; raw: number; under: number; share: number; ceiling: number; n: number };
type SnapRow = { name: string; kind: P["kind"]; pick?: string; seeded: boolean; dirs: Dir[] };

async function personas(all: RomeMetier[]): Promise<P[]> {
  const out: P[] = [];
  for (const f of FAMILIES) for (const d of f.depths) {
    const pick = `${f.id}:${d.id}`;
    const members = NICHE_MEMBERS[pick];
    const ans = honestAnswers(all.filter((m) => members.has(m.romeCode)), all);
    out.push({ name: `niche:${pick}`, kind: "niche", pick, answers: { ...ans, [SEED_ANSWER_KEY]: pick } });
    out.push({ name: `answers:${pick}`, kind: "answers", pick, answers: ans });
  }
  const hand: Record<string, Answers> = {
    ...COGNITIVE, hr_assistant: HR_ASSISTANT, secretary: SECRETARY,
    masters_hr: MASTERS_HR, masters_hr_old: MASTERS_HR_OLD,
    masters_hr_rh_seed: { ...MASTERS_HR, [SEED_ANSWER_KEY]: "admin:rh" },
    masters_hr_old_rh_seed: { ...MASTERS_HR_OLD, [SEED_ANSWER_KEY]: "admin:rh" },
  };
  for (const [name, answers] of Object.entries(hand)) out.push({ name, kind: "hand", answers });
  for (const f of FAMILIES) for (const d of f.depths) {
    const pick = `${f.id}:${d.id}`;
    out.push({ name: `seed-only:${pick}`, kind: "seed-only", pick, answers: { [SEED_ANSWER_KEY]: pick, c_departement: "75" } });
  }
  return out;
}

async function snap(path: string) {
  const g = await graph();
  const ps = await personas(g.all);
  const rows: SnapRow[] = [];
  for (const p of ps) {
    const r = await buildResults(buildInventory(p.answers));
    const dirs = [...r.directions, ...r.unverified].map((d): Dir => {
      const under = d.matchedCompetenceCodes.filter((c) => (g.domaines.get(c) ?? 0) <= MAX_CODE_DOMAINES).reduce((s, c) => s + g.idf(c), 0);
      const ceiling = g.ceiling.get(d.romeCode) ?? 0;
      return { code: d.romeCode, raw: d.matchRaritySum, under, share: ceiling > 0 ? under / ceiling : 0, ceiling, n: d.matchedCompetenceCodes.length };
    });
    rows.push({ name: p.name, kind: p.kind, pick: p.pick, seeded: SEED_ANSWER_KEY in p.answers, dirs });
  }
  writeFileSync(path, JSON.stringify(rows));
  console.log(`${rows.length} personas, ${rows.reduce((s, r) => s + r.dirs.length, 0)} surfaced roles → ${path}`);
}

function sweep(path: string) {
  const rows: SnapRow[] = JSON.parse(readFileSync(path, "utf8"));
  const N = rows.length;
  const over10Max = Math.floor(OVER10_SHARE * N);
  console.log(`${N} personas (${rows.filter((r) => r.kind !== "seed-only").length} sweep + ${rows.filter((r) => r.kind === "seed-only").length} seed-only); criterion: max FORT ≤ ${MAX_FORT} and personas over 10 FORT ≤ ${over10Max} (4/48 of ${N})`);

  const table = (label: string, cuts: number[], fmt: (c: number) => string, val: (d: Dir) => number) => {
    console.log(`\n${label}`);
    console.log(`  cut      maxFORT  >10  >20  zeroFORT  quizOnly≥1FORT  medianFORT`);
    let chosen: number | null = null;
    for (const c of cuts) {
      const counts = rows.map((r) => r.dirs.filter((d) => val(d) >= c).length);
      const max = Math.max(...counts);
      const o10 = counts.filter((n) => n > 10).length;
      const o20 = counts.filter((n) => n > 20).length;
      const zero = counts.filter((n) => n === 0).length;
      const quizOnly = rows.filter((r) => !r.seeded).map((r) => r.dirs.filter((d) => val(d) >= c).length).filter((n) => n > 0).length;
      const ok = max <= MAX_FORT && o10 <= over10Max;
      if (ok && chosen === null) chosen = c;
      console.log(`  ${fmt(c).padEnd(8)} ${String(max).padStart(7)} ${String(o10).padStart(4)} ${String(o20).padStart(4)} ${String(zero).padStart(9)} ${String(quizOnly).padStart(15)} ${String(q(counts, 0.5)).padStart(11)}${ok ? "   ok" : ""}`);
    }
    console.log(`  → lowest cut meeting the criterion: ${chosen === null ? "none in range" : fmt(chosen)}`);
    return chosen;
  };

  const rawCuts = [100, 150, 200, 250, 300, 325, 350, 375, 400, 450, 500, 600, 750, 1000];
  const shareCuts = [0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.99, 1.0];
  const a = table("(a) absolute cut on matchRaritySum", rawCuts, (c) => String(c), (d) => d.raw);
  const b = table("(b) share of the job's own ceiling", shareCuts, (c) => `${Math.round(c * 100)} %`, (d) => d.share);

  // (b) with the MOYEN evidence floor kept (FORT implies the raw sum ≥ 15).
  const bFloor = table("(b') share, and raw sum ≥ 15 (FORT never below the MOYEN evidence floor)", shareCuts, (c) => `${Math.round(c * 100)} %`, (d) => (d.raw >= 15 ? d.share : 0));

  // Niche check: every member job of a niche reads FORT for its own seed (seed-only persona).
  const nicheCheck = (label: string, val: (d: Dir) => number, cut: number) => {
    console.log(`\nniche check, ${label}: seed-only persona per niche`);
    console.log(`  niche                       members surfaced FORT-members  min-share  FORT-total`);
    let pass = 0;
    const seedOnly = rows.filter((r) => r.kind === "seed-only");
    for (const r of seedOnly) {
      const members = NICHE_MEMBERS[r.pick!];
      const surfaced = r.dirs.filter((d) => members.has(d.code));
      const fort = surfaced.filter((d) => val(d) >= cut);
      const minShare = surfaced.length ? Math.min(...surfaced.map((d) => d.share)) : 0;
      const total = r.dirs.filter((d) => val(d) >= cut).length;
      const ok = fort.length === members.size;
      if (ok) pass++;
      console.log(`  ${ok ? "✓" : "✗"} ${r.pick!.padEnd(25)} ${String(members.size).padStart(7)} ${String(surfaced.length).padStart(8)} ${String(fort.length).padStart(12)} ${(100 * minShare).toFixed(0).padStart(9)} % ${String(total).padStart(10)}`);
    }
    console.log(`  → ${pass}/${seedOnly.length} niches: every member job FORT for its own seed`);
  };
  if (b !== null) nicheCheck(`(b) at ${Math.round(b * 100)} %`, (d) => d.share, b);
  else nicheCheck("(b) at 100 % (no cut met the criterion)", (d) => d.share, 1.0);
  if (a !== null) nicheCheck(`(a) at ${a}`, (d) => d.raw, a);
  nicheCheck(`today (a) at ${FORT_TODAY}`, (d) => d.raw, FORT_TODAY);

  // The ≤ 20 bar against niche size: a niche with more than 20 member jobs cannot
  // have every member FORT and stay at ≤ 20 FORT.
  const big = Object.entries(NICHE_MEMBERS).filter(([, m]) => m.size > MAX_FORT);
  console.log(`\nniches with more than ${MAX_FORT} member jobs: ${big.length} — ${big.map(([k, m]) => `${k} (${m.size})`).join(", ")}`);
}

/**
 * Per-persona tier counts under three readings: today (raw ≥ 350), (a) raw ≥ A,
 * (b) share ≥ B. MOYEN stays raw ≥ 15 throughout (the evidence floor), so only
 * FORT moves. Also: FORT outside the persona's own niche under (b), the quiz-only
 * personas' best match on both scales, and the display bands that move under (a).
 */
function report(path: string, A: number, B: number) {
  const rows: SnapRow[] = JSON.parse(readFileSync(path, "utf8"));
  const MOYEN = 15;
  type Reading = (d: Dir) => "F" | "M" | "f";
  const today: Reading = (d) => (d.raw >= FORT_TODAY ? "F" : d.raw >= MOYEN ? "M" : "f");
  const ra: Reading = (d) => (d.raw >= A ? "F" : d.raw >= MOYEN ? "M" : "f");
  const rb: Reading = (d) => (d.raw >= MOYEN && d.share >= B ? "F" : d.raw >= MOYEN ? "M" : "f");
  const tally = (r: SnapRow, t: Reading) => {
    const c = { F: 0, M: 0, f: 0 };
    for (const d of r.dirs) c[t(d)]++;
    return `${String(c.F).padStart(3)}/${String(c.M).padStart(3)}/${String(c.f).padStart(4)}`;
  };
  const own = (r: SnapRow): Set<string> => {
    const picks = r.kind === "niche" || r.kind === "seed-only" ? [r.pick!] : [];
    return new Set(picks.flatMap((p) => [...(NICHE_MEMBERS[p] ?? [])]));
  };
  console.log(`tier counts FORT/MOYEN/faible per persona — today raw ≥ ${FORT_TODAY} | (a) raw ≥ ${A} | (b) share ≥ ${Math.round(B * 100)} % (raw ≥ ${MOYEN}); off-niche = (b) FORT outside the persona's own niche`);
  console.log(`${"persona".padEnd(36)} ${"today".padEnd(12)} ${"(a)".padEnd(12)} ${"(b)".padEnd(12)} off-niche(b)`);
  for (const r of rows) {
    const o = own(r);
    const off = r.dirs.filter((d) => rb(d) === "F" && !o.has(d.code)).length;
    console.log(`${r.name.padEnd(36)} ${tally(r, today).padEnd(12)} ${tally(r, ra).padEnd(12)} ${tally(r, rb).padEnd(12)} ${String(off).padStart(4)}`);
  }
  const offs = rows.map((r) => { const o = own(r); return r.dirs.filter((d) => rb(d) === "F" && !o.has(d.code)).length; });
  console.log(`\n(b) off-niche FORT: max ${Math.max(...offs)}, personas over 10: ${offs.filter((n) => n > 10).length}, over 20: ${offs.filter((n) => n > 20).length}`);

  console.log(`\nquiz-only personas (no seed): best raw sum and best share among surfaced roles`);
  console.log(`${"persona".padEnd(36)} roles  best-raw  best-share  FORT today/(a)/(b)`);
  for (const r of rows.filter((x) => !x.seeded)) {
    const bestRaw = Math.max(0, ...r.dirs.map((d) => d.raw));
    const bestShare = Math.max(0, ...r.dirs.map((d) => d.share));
    const f = (t: Reading) => r.dirs.filter((d) => t(d) === "F").length;
    console.log(`${r.name.padEnd(36)} ${String(r.dirs.length).padStart(5)} ${bestRaw.toFixed(0).padStart(9)} ${(100 * bestShare).toFixed(0).padStart(10)} %  ${f(today)}/${f(ra)}/${f(rb)}`);
  }

  const band = (raw: number, fort: number) => (raw >= fort ? "tres_forte" : raw >= Math.sqrt(MOYEN * fort) ? "forte" : raw >= MOYEN ? "pertinente" : "large");
  let moved = 0, total = 0;
  const moves = new Map<string, number>();
  for (const r of rows) for (const d of r.dirs) {
    total++;
    const x = band(d.raw, FORT_TODAY), y = band(d.raw, A);
    if (x !== y) { moved++; moves.set(`${x} → ${y}`, (moves.get(`${x} → ${y}`) ?? 0) + 1); }
  }
  console.log(`\n(a) display bands: FORT ${FORT_TODAY} → ${A}, forte split ${Math.sqrt(MOYEN * FORT_TODAY).toFixed(1)} → ${Math.sqrt(MOYEN * A).toFixed(1)}: ${moved} of ${total} role rows change band`);
  for (const [k, n] of moves) console.log(`  ${k}: ${n}`);
}

const [mode, x, y, z] = process.argv.slice(2);
(mode === "ceiling" ? ceilingReport() : mode === "snap" ? snap(x) : mode === "sweep" ? Promise.resolve(sweep(x)) : mode === "report" ? Promise.resolve(report(x, Number(y), Number(z))) : Promise.reject(new Error("mode: ceiling | snap <out> | sweep <snap> | report <snap> <A> <B>")))
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
