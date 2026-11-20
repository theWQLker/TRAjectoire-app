/**
 * SIGNAL THRESHOLD SWEEP (P0-B). How many directions would read "fort" per
 * persona at each candidate FORT cut. matchRaritySum does not depend on the cut,
 * so one engine run per persona serves every candidate. Personas: the 13 of
 * persona-before-after plus every seed depth (44), Paris.
 *
 * Counts every surfaced direction (verified buckets), and separately the first
 * view (the 10 cards /results opens on). MOYEN (15) is unchanged throughout; the
 * display band "forte" sits at √(15 × FORT) and moves with it.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/signal-sweep.ts
 */
import { buildResults, P2_INVENTORY } from "../src/lib/engine/results";
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import type { Inventory } from "../src/lib/engine/inventory";
import { FAMILIES } from "../config/families";
import { firstViewCodes } from "../src/app/results/display";

const CUTS = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 750];

const HR: Answers = {
  c_diploma: "bac5", sf_numbers_people: "plutot_b", sf_client_issue: "plutot_b",
  g_conflict: "plutot_a", g_teach_do: "plutot_a", sf_training_peer: "plutot_a",
  g_hidden_need: "plutot_a", ar_learning_investment: "plutot_b",
};

const PERSONAS: [string, Inventory][] = [
  ["demo_profile", P2_INVENTORY],
  ["no_seed", buildInventory({})],
  ["masters_hr_75", buildInventory({ ...HR, c_departement: "75" })],
  ["masters_hr_rh_seed_75", buildInventory({ ...HR, c_departement: "75", [SEED_ANSWER_KEY]: "admin:rh" })],
  ...FAMILIES.flatMap((f) =>
    f.depths.map((d): [string, Inventory] => [
      `seed ${f.id}:${d.id}`,
      buildInventory({ [SEED_ANSWER_KEY]: `${f.id}:${d.id}`, c_departement: "75" }),
    ]),
  ),
];

async function main() {
  const rows: { name: string; all: number[]; fv: number[]; top: number }[] = [];
  for (const [name, inv] of PERSONAS) {
    const r = await buildResults(inv);
    const sums = r.directions.map((d) => d.matchRaritySum);
    const fvCodes = firstViewCodes(r.directions, r.unverified);
    const fvSums = r.directions.filter((d) => fvCodes.has(d.romeCode)).map((d) => d.matchRaritySum);
    rows.push({
      name,
      all: CUTS.map((c) => sums.filter((s) => s >= c).length),
      fv: CUTS.map((c) => fvSums.filter((s) => s >= c).length),
      top: Math.max(0, ...sums),
    });
  }

  const head = CUTS.map((c) => String(c).padStart(5)).join("");
  console.log(`FORT count per persona (all surfaced directions) at each FORT cut; MOYEN stays 15`);
  console.log(`${"persona".padEnd(30)}${head}   max matchRaritySum`);
  for (const r of rows) {
    console.log(`${r.name.padEnd(30)}${r.all.map((n) => String(n).padStart(5)).join("")}   ${r.top.toFixed(0)}`);
  }
  console.log("");
  console.log(`${"summary".padEnd(30)}${head}`);
  const col = (f: (r: (typeof rows)[number], i: number) => number) => CUTS.map((_, i) => rows.map((r) => f(r, i)));
  const fmt = (xs: number[]) => xs.map((n) => String(n).padStart(5)).join("");
  console.log(`${"max FORT (any persona)".padEnd(30)}${fmt(col((r, i) => r.all[i]).map((c) => Math.max(...c)))}`);
  console.log(`${"personas over 10 FORT".padEnd(30)}${fmt(col((r, i) => r.all[i]).map((c) => c.filter((n) => n > 10).length))}`);
  console.log(`${"personas with 0 FORT".padEnd(30)}${fmt(col((r, i) => r.all[i]).map((c) => c.filter((n) => n === 0).length))}`);
  console.log(`${"max FORT in first view".padEnd(30)}${fmt(col((r, i) => r.fv[i]).map((c) => Math.max(...c)))}`);
  console.log(`${"band 'forte' starts at".padEnd(30)}${fmt(CUTS.map((c) => Math.round(Math.sqrt(15 * c))))}`);
  const ok = CUTS.filter((_, i) => rows.every((r) => r.all[i] <= 10));
  console.log(`\nlowest cut with FORT ≤ 10 for all ${rows.length} personas: ${ok[0] ?? "none in range"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
