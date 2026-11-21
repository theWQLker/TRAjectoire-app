/**
 * PERSONA SWEEP — every persona the repo has, before/after a quiz or vocabulary
 * change. In-process only, nothing written to the database.
 *
 * Personas:
 *   - niche:<pick>       one per family depth: the reach-map answerer for the
 *                        niche's jobs (honestAnswers) + the seed. It answers every
 *                        scored scene, the HR scene included, by the same lift rule.
 *   - answers:<pick>     the same answers without the seed.
 *   - cognitive / hand   COGNITIVE, HR_ASSISTANT, SECRETARY, MASTERS_HR(_OLD) from
 *                        honest-personas.ts.
 *
 *   ... persona-sweep.ts snap <out.json>
 *   ... persona-sweep.ts diff <before.json> <after.json>
 *
 * The diff runs two checks:
 *   1. a persona that did not pick the HR side (A) of sf_people_accounts gains no
 *      M15 job in its top 10; one that did not pick the accounts side (B) gains no
 *      M12 job. « les deux » counts as picking both.
 *   2. commercial personas (commerce niches + the commercial cognitive ones) keep
 *      their best D12/D14 rank.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { getRomeSource } from "../src/lib/rome";
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { sortForDisplay } from "../src/app/results/display";
import { FAMILIES } from "../config/families";
import { honestAnswers, NICHE_PREFIX } from "./reach-map";
import { COGNITIVE, HR_ASSISTANT, MASTERS_HR, MASTERS_HR_OLD, SECRETARY } from "./honest-personas";

const HR_SCENE = "sf_people_accounts";
type P = { name: string; answers: Answers; home: string[] };
type Row = { name: string; hr: string; old: string; top10: string[]; best: Record<string, number | null> };
const WATCH = ["M15", "M12", "M16", "D12", "D14"];

async function personas(): Promise<P[]> {
  const all = await getRomeSource().allMetiers();
  const out: P[] = [];
  for (const f of FAMILIES) for (const d of f.depths) {
    const pick = `${f.id}:${d.id}`;
    const pre = NICHE_PREFIX[pick];
    const ans = honestAnswers(all.filter((m) => pre.some((p) => m.romeCode.startsWith(p))), all);
    out.push({ name: `niche:${pick}`, answers: { ...ans, [SEED_ANSWER_KEY]: pick }, home: pre });
    out.push({ name: `answers:${pick}`, answers: ans, home: pre });
  }
  const hand: Record<string, Answers> = {
    ...COGNITIVE, hr_assistant: HR_ASSISTANT, secretary: SECRETARY,
    masters_hr: MASTERS_HR, masters_hr_old: MASTERS_HR_OLD,
    masters_hr_rh_seed: { ...MASTERS_HR, [SEED_ANSWER_KEY]: "admin:rh" },
    masters_hr_old_rh_seed: { ...MASTERS_HR_OLD, [SEED_ANSWER_KEY]: "admin:rh" },
  };
  for (const [name, answers] of Object.entries(hand)) out.push({ name, answers, home: [] });
  return out;
}

async function snap(path: string) {
  const rows: Row[] = [];
  for (const p of await personas()) {
    const r = await buildResults(buildInventory(p.answers));
    const shown = [...sortForDisplay(r.directions), ...sortForDisplay(r.unverified)];
    const best: Row["best"] = {};
    for (const w of [...WATCH, ...p.home.map((h) => `home:${h}`)]) {
      const pre = w.startsWith("home:") ? w.slice(5) : w;
      const i = shown.findIndex((d) => d.romeCode.startsWith(pre));
      best[w] = i < 0 ? null : i + 1;
    }
    rows.push({ name: p.name, hr: p.answers[HR_SCENE] ?? "—", old: p.answers.sf_commercial_signal ?? "—", top10: shown.slice(0, 10).map((d) => d.romeCode), best });
  }
  writeFileSync(path, JSON.stringify(rows, null, 1));
  console.log(`${rows.length} personas → ${path}`);
}

const picksA = (v: string) => ["plutot_a", "un_peu_a", "les_deux"].includes(v);
const picksB = (v: string) => ["plutot_b", "un_peu_b", "les_deux"].includes(v);
const f = (n: number | null | undefined) => (n == null ? "—" : String(n));

function diff(a: string, b: string) {
  const A = new Map((JSON.parse(readFileSync(a, "utf8")) as Row[]).map((r) => [r.name, r]));
  const B = JSON.parse(readFileSync(b, "utf8")) as Row[];
  let bad = 0;
  console.log("persona | HR scene | top 10 before → after (changed only) | M15 | M12 | M16 | home");
  for (const r of B) {
    const p = A.get(r.name);
    if (!p) { console.log(`${r.name}: new persona, top 10 ${r.top10.join(" ")}`); continue; }
    const homeK = Object.keys(r.best).find((k) => k.startsWith("home:"));
    const homeTxt = homeK ? ` home ${f(p.best[homeK])}→${f(r.best[homeK])}` : "";
    const same = p.top10.join() === r.top10.join();
    console.log(`${r.name.padEnd(34)} ${r.hr.padEnd(9)} ${same ? "top10 =" : `${p.top10.join(" ")} → ${r.top10.join(" ")}`} | M15 ${f(p.best.M15)}→${f(r.best.M15)} M12 ${f(p.best.M12)}→${f(r.best.M12)} M16 ${f(p.best.M16)}→${f(r.best.M16)}${homeTxt}`);
    const gained = (pre: string) => r.top10.filter((c) => c.startsWith(pre) && !p.top10.includes(c));
    const isAdminNiche = r.name.endsWith("admin:rh") || r.name.endsWith("admin:compta");
    if (!picksA(r.hr) && gained("M15").length && !isAdminNiche) { bad++; console.log(`   ✗ gained HR ${gained("M15").join(" ")} without picking the HR side`); }
    if (!picksB(r.hr) && gained("M12").length && !isAdminNiche) { bad++; console.log(`   ✗ gained accounting ${gained("M12").join(" ")} without picking the accounts side`); }
  }
  console.log(`\nCHECK 1 (no HR/accounting job gained in a top 10 without picking that side; admin:rh/compta niches exempt): ${bad ? `✗ ${bad}` : "✓"}`);
  console.log("\nCHECK 2 — commercial personas, best D12 / D14 rank:");
  for (const r of B.filter((x) => /commerce:|commercial/.test(x.name))) {
    const p = A.get(r.name); if (!p) continue;
    console.log(`  ${r.name.padEnd(34)} old scene ${p.old.padEnd(9)} D12 ${f(p.best.D12)}→${f(r.best.D12)}  D14 ${f(p.best.D14)}→${f(r.best.D14)}`);
  }
  const pickers = B.filter((x) => picksA(x.hr) || picksB(x.hr)).map((x) => `${x.name}=${x.hr}`);
  console.log(`\npersonas that picked a side of the HR scene: ${pickers.join(", ") || "none"}`);
}

const [mode, x, y] = process.argv.slice(2);
if (mode === "snap" && x) snap(x).catch((e) => { console.error(e); process.exit(1); });
else if (mode === "diff" && x && y) diff(x, y);
else { console.error("usage: persona-sweep.ts snap <out.json> | diff <before> <after>"); process.exit(1); }
