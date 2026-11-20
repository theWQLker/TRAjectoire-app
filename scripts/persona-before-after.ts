/**
 * PERSONA BEFORE/AFTER — what each persona SEES, for changes that move ranking
 * or buckets (the "bring before/after per persona" rule). Writes one JSON per
 * persona: bucket counts, held-back and unverified counts, the first view (the
 * 10 cards /results shows), the top 10 by display order, and a few tracked
 * jobs' positions. Run before and after a change, then diff:
 *
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/persona-before-after.ts snap <outDir>
 *   node_modules/.bin/tsx scripts/persona-before-after.ts diff <beforeDir> <afterDir>
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { buildResults, P2_INVENTORY, type ResultDirection } from "../src/lib/engine/results";
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import type { Inventory } from "../src/lib/engine/inventory";
import { firstViewCodes, sortForDisplay } from "../src/app/results/display";
import { HR_ASSISTANT, SECRETARY } from "./honest-personas";

// The Master's-HR answers of scripts/level-demote-proof.ts.
const HR: Answers = {
  c_diploma: "bac5",
  sf_numbers_people: "plutot_b",
  sf_client_issue: "plutot_b",
  g_conflict: "plutot_a",
  g_teach_do: "plutot_a",
  sf_training_peer: "plutot_a",
  g_hidden_need: "plutot_a",
  ar_learning_investment: "plutot_b",
};

const PERSONAS: Record<string, Inventory> = {
  demo_profile: P2_INVENTORY,
  no_seed: buildInventory({}),
  tech_code: buildInventory({ [SEED_ANSWER_KEY]: "tech:code" }),
  sante_soin: buildInventory({ [SEED_ANSWER_KEY]: "sante:soin" }),
  admin_compta: buildInventory({ [SEED_ANSWER_KEY]: "admin:compta" }),
  hotellerie_cuisine: buildInventory({ [SEED_ANSWER_KEY]: "hotellerie:cuisine" }),
  commerce_vente: buildInventory({ [SEED_ANSWER_KEY]: "commerce:vente" }),
  masters_hr_75: buildInventory({ ...HR, c_departement: "75" }),
  masters_hr_rh_seed_75: buildInventory({ ...HR, c_departement: "75", [SEED_ANSWER_KEY]: "admin:rh" }),
  masters_hr_93: buildInventory({ ...HR, c_departement: "93" }),
  masters_hr_75_93: buildInventory({ ...HR, c_departement: "75,93" }),
  tech_code_93: buildInventory({ [SEED_ANSWER_KEY]: "tech:code", c_departement: "93" }),
  tech_code_france: buildInventory({ [SEED_ANSWER_KEY]: "tech:code", c_departement: "france" }),
  hr_assistant: buildInventory(HR_ASSISTANT),
  hr_assistant_rh_seed: buildInventory({ ...HR_ASSISTANT, [SEED_ANSWER_KEY]: "admin:rh" }),
  secretary: buildInventory(SECRETARY),
  secretary_seed: buildInventory({ ...SECRETARY, [SEED_ANSWER_KEY]: "admin:secretariat" }),
};

const TRACKED = ["D1408", "C1201", "G1803", "M1501", "M1502", "M1507", "M1509", "M1704", "M1607", "M1604", "M1609"];

type Snap = {
  counts: Record<string, number>;
  firstView: string[];
  top10: string[];
  tracked: Record<string, string>;
};

async function snap(outDir: string) {
  mkdirSync(outDir, { recursive: true });
  for (const [name, inv] of Object.entries(PERSONAS)) {
    const r = await buildResults(inv);
    const unverified: ResultDirection[] = (r as { unverified?: ResultDirection[] }).unverified ?? [];
    const all = [...r.directions, ...unverified];
    const shown = sortForDisplay(r.directions);
    const fv = firstViewCodes(all);
    const where = (code: string): string => {
      const i = shown.findIndex((d) => d.romeCode === code);
      if (i >= 0) return `#${i + 1} ${shown[i].bucketResult.category}`;
      const u = sortForDisplay(unverified).findIndex((d) => d.romeCode === code);
      if (u >= 0) return `#${u + 1} non vérifié`;
      if (r.suppressed.some((s) => s.romeCode === code)) return "held back";
      return "—";
    };
    const s: Snap = {
      counts: {
        apply_now: r.byCategory.apply_now.length,
        bridge: r.byCategory.bridge.length,
        long_term: r.byCategory.long_term.length,
        not_now: r.byCategory.not_now.length,
        unverified: unverified.length,
        held_back: r.suppressed.length,
      },
      firstView: [...fv],
      top10: [...shown, ...sortForDisplay(unverified)].slice(0, 10).map((d) => d.romeCode),
      tracked: Object.fromEntries(TRACKED.map((c) => [c, where(c)])),
    };
    writeFileSync(`${outDir}/${name}.json`, JSON.stringify(s, null, 1));
    console.log(`${name.padEnd(22)} ${JSON.stringify(s.counts)}`);
  }
}

function diff(a: string, b: string) {
  for (const f of readdirSync(b).filter((x) => x.endsWith(".json"))) {
    const name = f.replace(/\.json$/, "");
    const A: Snap = JSON.parse(readFileSync(`${a}/${f}`, "utf8"));
    const B: Snap = JSON.parse(readFileSync(`${b}/${f}`, "utf8"));
    const same = JSON.stringify(A) === JSON.stringify(B);
    console.log(`\n### ${name}${same ? " — identical" : ""}`);
    if (same) continue;
    const c = (s: Snap) => Object.entries(s.counts).map(([k, v]) => `${k} ${v}`).join(" · ");
    console.log(`  counts  before: ${c(A)}`);
    console.log(`          after:  ${c(B)}`);
    console.log(`  top 10  before: ${A.top10.join(" ")}`);
    console.log(`          after:  ${B.top10.join(" ")}`);
    const fvIn = B.firstView.filter((x) => !A.firstView.includes(x));
    const fvOut = A.firstView.filter((x) => !B.firstView.includes(x));
    if (fvIn.length || fvOut.length) console.log(`  first view  in: ${fvIn.join(" ") || "—"} · out: ${fvOut.join(" ") || "—"}`);
    for (const k of Object.keys(B.tracked)) {
      if (A.tracked[k] !== B.tracked[k]) console.log(`  ${k}: ${A.tracked[k]} → ${B.tracked[k]}`);
    }
  }
}

const [mode, x, y] = process.argv.slice(2);
if (mode === "snap" && x) snap(x).catch((e) => { console.error(e); process.exit(1); });
else if (mode === "diff" && x && y) diff(x, y);
else { console.error("usage: persona-before-after.ts snap <outDir> | diff <before> <after>"); process.exit(1); }
