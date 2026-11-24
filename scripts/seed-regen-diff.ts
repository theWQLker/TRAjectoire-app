/**
 * SEED REGENERATION DIFF (2026-11-24). Before/after a config/families.ts rebuild.
 *
 *   snap <out.json>                 every persona's inventory (exact JSON) and its
 *                                   surfaced roles in display order, FORT at the
 *                                   current cut; plus every depth's seed and members.
 *   diff <before.json> <after.json> per depth: codes added/removed, seed size,
 *                                   member titles that changed; per seeded persona:
 *                                   roles gained/lost, top-10 changes, FORT count;
 *                                   unseeded personas: inventories byte-identical.
 *
 * Personas: 51 seed-only (seed alone, Paris), the 51 niche:* (reach-map answers +
 * seed) and 51 answers:* (same answers, no seed) of persona-sweep, its 14 hand ones.
 *
 * Usage (live data, dev database):
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/seed-regen-diff.ts snap <out.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { getRomeSource } from "../src/lib/rome";
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { signalStrength } from "../src/lib/engine/coverage";
import { sortForDisplay } from "../src/app/results/display";
import { FAMILIES } from "../config/families";
import { honestAnswers, NICHE_MEMBERS } from "./reach-map";
import { COGNITIVE, HR_ASSISTANT, MASTERS_HR, MASTERS_HR_OLD, SECRETARY } from "./honest-personas";

type Row = { name: string; seeded: boolean; inventory: string; roles: string[]; fort: number };
type Depth = { pick: string; seed: string[]; members: Record<string, string> };
type Snap = { depths: Depth[]; rows: Row[] };

async function personas(): Promise<{ name: string; answers: Answers }[]> {
  const all = await getRomeSource().allMetiers();
  const out: { name: string; answers: Answers }[] = [];
  for (const f of FAMILIES) for (const d of f.depths) {
    const pick = `${f.id}:${d.id}`;
    out.push({ name: `seed-only:${pick}`, answers: { [SEED_ANSWER_KEY]: pick, c_departement: "75" } });
    const ans = honestAnswers(all.filter((m) => NICHE_MEMBERS[pick].has(m.romeCode)), all);
    out.push({ name: `niche:${pick}`, answers: { ...ans, [SEED_ANSWER_KEY]: pick } });
    out.push({ name: `answers:${pick}`, answers: ans });
  }
  const hand: Record<string, Answers> = {
    ...COGNITIVE, hr_assistant: HR_ASSISTANT, secretary: SECRETARY,
    masters_hr: MASTERS_HR, masters_hr_old: MASTERS_HR_OLD,
    masters_hr_rh_seed: { ...MASTERS_HR, [SEED_ANSWER_KEY]: "admin:rh" },
    masters_hr_old_rh_seed: { ...MASTERS_HR_OLD, [SEED_ANSWER_KEY]: "admin:rh" },
  };
  for (const [name, answers] of Object.entries(hand)) out.push({ name: `hand:${name}`, answers });
  return out;
}

async function snap(path: string) {
  const depths: Depth[] = FAMILIES.flatMap((f) => f.depths.map((d) => ({
    pick: `${f.id}:${d.id}`, seed: [...d.seedCodes], members: Object.fromEntries(d.members.map((m) => [m.romeCode, m.title])),
  })));
  const rows: Row[] = [];
  for (const p of await personas()) {
    const inv = buildInventory(p.answers);
    const r = await buildResults(inv);
    const shown = [...sortForDisplay(r.directions), ...sortForDisplay(r.unverified)];
    rows.push({
      name: p.name, seeded: SEED_ANSWER_KEY in p.answers, inventory: JSON.stringify(inv),
      roles: shown.map((d) => d.romeCode), fort: shown.filter((d) => signalStrength(d.matchRaritySum) === "strong").length,
    });
  }
  writeFileSync(path, JSON.stringify({ depths, rows } satisfies Snap));
  console.log(`${depths.length} depths, ${rows.length} personas → ${path}`);
}

function diff(a: string, b: string) {
  const A: Snap = JSON.parse(readFileSync(a, "utf8"));
  const B: Snap = JSON.parse(readFileSync(b, "utf8"));
  console.log("## Seeds per depth\n");
  console.log("| depth | seed before | seed after | added | removed |");
  console.log("|---|---|---|---|---|");
  const titles: string[] = [];
  for (const d of A.depths) {
    const e = B.depths.find((x) => x.pick === d.pick);
    if (!e) { console.log(`| ${d.pick} | ${d.seed.length} | MISSING | | |`); continue; }
    const s0 = new Set(d.seed), s1 = new Set(e.seed);
    const add = e.seed.filter((c) => !s0.has(c)).length, rem = d.seed.filter((c) => !s1.has(c)).length;
    const mark = add || rem ? "" : " (same)";
    console.log(`| ${d.pick}${mark} | ${d.seed.length} | ${e.seed.length} | ${add} | ${rem} |`);
    const k0 = Object.keys(d.members).sort().join(), k1 = Object.keys(e.members).sort().join();
    if (k0 !== k1) titles.push(`| ${d.pick} | member list changed: ${k0} → ${k1} | |`);
    for (const [code, t] of Object.entries(d.members)) if (e.members[code] !== undefined && e.members[code] !== t) titles.push(`| ${d.pick} | ${code} | ${t} → ${e.members[code]} |`);
  }
  console.log(`\n## Member titles that changed (${titles.length})\n`);
  console.log("| depth | job | title before → after |");
  console.log("|---|---|---|");
  for (const t of titles) console.log(t);

  console.log("\n## Seeded personas\n");
  console.log("| persona | roles before → after | gained | lost | top-10 changes | FORT@cut before → after |");
  console.log("|---|---|---|---|---|---|");
  let same = 0, unseeded = 0, identical = 0;
  const notIdentical: string[] = [];
  for (const r of A.rows) {
    const s = B.rows.find((x) => x.name === r.name)!;
    if (!r.seeded) {
      unseeded++;
      if (r.inventory === s.inventory && r.roles.join() === s.roles.join()) identical++;
      else notIdentical.push(r.name);
      continue;
    }
    const r0 = new Set(r.roles), r1 = new Set(s.roles);
    const gained = s.roles.filter((c) => !r0.has(c)), lost = r.roles.filter((c) => !r1.has(c));
    const t0 = r.roles.slice(0, 10), t1 = s.roles.slice(0, 10);
    const tin = t1.filter((c) => !t0.includes(c)), tout = t0.filter((c) => !t1.includes(c));
    const reordered = !tin.length && t0.join() !== t1.join();
    const top = tin.length || tout.length ? `in ${tin.join(" ")} / out ${tout.join(" ")}` : reordered ? "reordered" : "–";
    if (!gained.length && !lost.length && top === "–" && r.fort === s.fort) same++;
    console.log(`| ${r.name} | ${r.roles.length} → ${s.roles.length} | ${gained.length} | ${lost.length} | ${top} | ${r.fort} → ${s.fort} |`);
  }
  console.log(`\nseeded personas with no change at all: ${same}`);
  console.log(`unseeded personas: ${identical}/${unseeded} byte-identical inventories and identical role lists${notIdentical.length ? ` — DIFFER: ${notIdentical.join(", ")}` : ""}`);
  if (notIdentical.length) process.exitCode = 1;
}

const [mode, x, y] = process.argv.slice(2);
(mode === "snap" ? snap(x) : mode === "diff" ? Promise.resolve(diff(x, y)) : Promise.reject(new Error("mode: snap <out> | diff <before> <after>")))
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => { console.error(e); process.exit(1); });
