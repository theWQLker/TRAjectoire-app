/**
 * LEVEL-DEMOTE PROOF (live). Report only — proves the level-mismatch demote on the
 * real graph. Runs the SAME flow the UI uses (buildInventory → buildResults), then
 * shows the top-N ordered by matchRaritySum (BEFORE = pre-demote) vs displayRank
 * (AFTER = what the page now renders), per profile.
 *
 * Acceptance:
 *   - Master's-HR + 5yr-SaaS → Serveur (G1803) / téléconseil (D1408) leave top-5.
 *   - "will accept lower" → no demote (BEFORE == AFTER).
 *   - no-level-data directions → displayRank == matchRaritySum (unchanged).
 *   - a genuine strong fit is never dislodged.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/level-demote-proof.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import {
  directionLevelOrdinal,
  userLevel,
  niveauLibelleOrdinal,
} from "../src/lib/engine/level-demote";

const OUT = "scripts/_level-demote-out.txt";
writeFileSync(OUT, "");
const out = (l = "") => { process.stdout.write(l + "\n"); appendFileSync(OUT, l + "\n"); };

const DEPT = { c_departement: "75" };

// Master's-HR: HR/people cognitive + bac+5. High demonstrated level, no opt-out.
const MASTERS_HR: Answers = {
  ...DEPT,
  c_diploma: "bac5",
  sf_numbers_people: "plutot_b",
  sf_client_issue: "plutot_b",
  g_conflict: "plutot_a",
  g_teach_do: "plutot_a",
  sf_training_peer: "plutot_a",
  g_hidden_need: "plutot_a",
  // no training_investment:limited → no opt-out
  ar_learning_investment: "plutot_b", // open_if_return_clear
};

// 5yr-SaaS: tech/systems cognitive + bac+5 + open to invest (senior, no opt-out).
const SAAS_5YR: Answers = {
  ...DEPT,
  c_diploma: "bac5",
  f_surface_depth: "plutot_b",
  f_scale_task: "plutot_a",
  f_repeat_problem: "plutot_a",
  sf_digital_tools: "plutot_a",
  sf_data_files: "plutot_b",
  sf_sell_fix: "plutot_b",
  ar_learning_investment: "plutot_b",
};

// "Will accept lower": SAME master's-HR profile but signals limited training appetite.
const ACCEPT_LOWER: Answers = {
  ...MASTERS_HR,
  ar_learning_investment: "plutot_a", // training_investment = limited → opt-out
};

type Profile = { name: string; ans: Answers };
const PROFILES: Profile[] = [
  { name: "Master's-HR (bac+5)", ans: MASTERS_HR },
  { name: "5yr-SaaS (bac+5, tech)", ans: SAAS_5YR },
  { name: "Accept-lower (bac+5 + limited)", ans: ACCEPT_LOWER },
];

const LVL = ["aucun", "cap", "bac", "bac+2", "bac+3", "bac+5"];
const lvlName = (o: number | null) => (o == null ? "—" : LVL[o] ?? String(o));

function debShare(d: ResultDirection): string {
  const mix = d.market.experienceMix;
  const t = mix.reduce((s, m) => s + m.count, 0);
  if (t === 0) return "—";
  const dc = mix.find((m) => m.code === "D")?.count ?? 0;
  return `${Math.round((dc / t) * 100)}%D`;
}

function topN(dirs: ResultDirection[], key: (d: ResultDirection) => number, n: number) {
  return [...dirs].sort((a, b) => key(b) - key(a) || b.coverage - a.coverage).slice(0, n);
}

function row(d: ResultDirection, i: number): string {
  const dirOrd = directionLevelOrdinal(d);
  return (
    `  ${String(i + 1).padStart(2)}. ${d.romeCode.padEnd(6)} ` +
    `${d.title.slice(0, 40).padEnd(40)} ` +
    `dirLvl=${lvlName(dirOrd).padEnd(6)} ${debShare(d).padEnd(5)} ` +
    `pen=${d.levelPenalty.toFixed(2)} base=${d.rankScore.toFixed(2)} disp=${d.displayRank.toFixed(2)}`
  );
}

async function proveProfile(p: Profile) {
  const inv = buildInventory(p.ans);
  const u = userLevel(inv);
  const r = await buildResults(inv);
  const dirs = r.directions;

  out("=".repeat(100));
  out(`PROFILE: ${p.name}`);
  out(`  user level: ${lvlName(u.ordinal)} · acceptsLower: ${u.acceptsLower} · surfaced: ${dirs.length}`);
  out("=".repeat(100));

  // BEFORE = the pre-demote base order (the proposer's composite rankScore — the
  // SAME base displayRank scales). AFTER = displayRank (what the page renders).
  // Comparing like-for-like isolates the demote's effect from the rankScore base.
  const before = topN(dirs, (d) => d.rankScore, 8);
  const after = topN(dirs, (d) => d.displayRank, 8);

  out("\nBEFORE (pre-demote, by rankScore base):");
  before.forEach((d, i) => out(row(d, i)));
  out("\nAFTER (rendered, by displayRank):");
  after.forEach((d, i) => out(row(d, i)));

  // Acceptance checks
  const TARGETS = ["G1803", "D1408"]; // Serveur, téléconseil
  const beforeTop5 = new Set(before.slice(0, 5).map((d) => d.romeCode));
  const afterTop5 = new Set(after.slice(0, 5).map((d) => d.romeCode));
  const droppedOut = TARGETS.filter((t) => beforeTop5.has(t) && !afterTop5.has(t));
  const stillIn = TARGETS.filter((t) => afterTop5.has(t));

  // Presence-gating: a direction with no level penalty must keep displayRank ==
  // its rankScore base (the demote left it untouched). Checked over ALL zero-
  // penalty directions (covers the no-level-data case and every other neutral one).
  const noDataUnchanged = dirs
    .filter((d) => d.levelPenalty === 0)
    .every((d) => d.displayRank === d.rankScore);

  const orderIdentical =
    before.map((d) => d.romeCode).join(",") === after.map((d) => d.romeCode).join(",");

  out("\nCHECKS:");
  if (u.acceptsLower) {
    out(`  • accept-lower → NO demote expected: order identical? ${orderIdentical ? "YES ✓" : "NO ✗"}`);
    out(`  • all penalties zero? ${dirs.every((d) => d.levelPenalty === 0) ? "YES ✓" : "NO ✗"}`);
  } else {
    out(`  • Serveur/téléconseil in BEFORE top-5: ${TARGETS.filter((t) => beforeTop5.has(t)).join(", ") || "(none present)"}`);
    out(`  • dropped OUT of top-5 by demote: ${droppedOut.join(", ") || "(none dropped)"}`);
    if (stillIn.length) out(`  • ⚠ still in top-5 after demote: ${stillIn.join(", ")}`);
  }
  out(`  • zero-penalty directions unchanged (displayRank==rankScore base): ${noDataUnchanged ? "YES ✓" : "NO ✗"}`);
  out("");
}

async function main() {
  out("LEVEL-DEMOTE PROOF — live graph");
  out(`ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE}`);
  out(`niveauLibelle sanity: "Bac+5 et plus"→${niveauLibelleOrdinal("Bac+5 et plus ou équivalents")} · "CAP, BEP"→${niveauLibelleOrdinal("CAP, BEP et équivalents")}`);
  out("");
  for (const p of PROFILES) await proveProfile(p);
  out(`(full output → ${OUT})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
