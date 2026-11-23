/**
 * LEVEL-DEMOTE PROOF (live). A GATE: exits 1 when the demote mechanism breaks.
 * Runs the SAME flow the UI uses (buildInventory → buildResults) on three
 * profiles, then checks the mechanism, not any one job's rank (decision
 * 2026-11-20: a job's rank moves with every offer refresh; the mechanism must not).
 *
 * Fails when:
 *   1. a direction's levelPenalty differs from the penalty recomputed from its
 *      own ads by the independent oracle below (exact band table, own counting);
 *   2. displayRank ≠ rankScore × (1 − W_LEVEL_DEMOTE × levelPenalty);
 *   3. a zero-penalty direction moves (displayRank ≠ rankScore, or the relative
 *      order of zero-penalty directions changes);
 *   4. the demote stops applying: a bac+5 profile with no penalised direction,
 *      a penalised direction not scaled down, or the G1803 (Serveur) case —
 *      synthetic always, live whenever its ads carry a level signal;
 *   5. "will accept lower" gets any penalty or any reorder;
 *   6. an ad carries a diploma band the oracle doesn't know (update the table).
 *
 * D1408 (téléconseil) staying in the Master's-HR top 5 is printed as a KNOWN
 * QUALITY ISSUE, never as a pass: its lead comes from the base score, not from
 * the demote (see scripts/d1408-diagnosis.ts).
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
  levelPenalty,
  displayRank,
  niveauLibelleOrdinal,
  W_LEVEL_DEMOTE,
} from "../src/lib/engine/level-demote";
import type { DirectionWithMarket } from "../src/lib/engine/market-reality";
import type { Offer } from "../src/lib/offers";

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

// ---------------------------------------------------------------------------
// Oracle: the penalty recomputed from the ads, without calling the engine's
// level-demote code. Exact table of the France Travail niveauLibelle bands seen
// in current_offers (2026-11-20: 8 strings over 1,275 formation entries).
// ---------------------------------------------------------------------------
const BAND_ORDINAL: Record<string, number> = {
  "Aucune formation scolaire": 0,
  "3ème achevée ou Brevet": 0,
  "CAP, BEP et équivalents": 1,
  "Bac ou équivalent": 2,
  "Niveau Bac": 2,
  "Bac+2 ou équivalents": 3,
  "Bac+3, Bac+4 ou équivalents": 4,
  "Bac+5 et plus ou équivalents": 5,
};
const USER_ORDINAL: Record<string, number> = {
  aucun: 0, cap: 1, bac: 2, "bac+2": 3, "bac+3": 4, "bac+5": 5,
};
const unknownBands = new Set<string>();

type OracleUser = { ordinal: number | null; acceptsLower: boolean };
function oracleUser(ans: Answers): OracleUser {
  const inv = buildInventory(ans);
  const fin = (inv.financial_inputs ?? {}) as Record<string, string>;
  const acceptsLower =
    fin.training_investment === "limited" ||
    inv.constraints.accept_lower === "yes" ||
    fin.salaire_min === "<1500" ||
    fin.salaire_min === "1500-1800";
  const dip = inv.constraints.diploma;
  return { ordinal: dip != null ? USER_ORDINAL[dip] ?? null : null, acceptsLower };
}

function oraclePenalty(offers: Offer[], u: OracleUser): number {
  if (u.acceptsLower || u.ordinal == null) return 0;
  // (a) diploma band: modal band over every formation entry, ties → lower band.
  const counts = new Map<number, number>();
  for (const o of offers) {
    for (const f of o.formations ?? []) {
      const label = f.niveauLibelle ?? f.niveau;
      if (!label) continue;
      const ord = BAND_ORDINAL[label];
      if (ord == null) { unknownBands.add(label); continue; }
      counts.set(ord, (counts.get(ord) ?? 0) + 1);
    }
  }
  let band: number | null = null;
  let best = -1;
  for (const [ord, c] of counts) {
    if (c > best || (c === best && band != null && ord < band)) { band = ord; best = c; }
  }
  let p = 0;
  if (band != null && u.ordinal - band >= 2) p = Math.max(p, Math.min(1, (u.ordinal - band - 1) / 3));
  // (b) seniority: share of ads accepting beginners, for users at bac+3 or above.
  if (u.ordinal >= 4) {
    const withExp = offers.filter((o) => o.experienceExige);
    if (withExp.length) {
      const share = withExp.filter((o) => o.experienceExige === "D").length / withExp.length;
      if (share >= 0.7) p = Math.max(p, Math.min(0.5, (share - 0.7) / 0.6));
    }
  }
  return p;
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

// ---------------------------------------------------------------------------
// Check bookkeeping
// ---------------------------------------------------------------------------
let passed = 0;
const failures: string[] = [];
const skipped: string[] = [];
function check(name: string, ok: boolean, detail = "") {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  out(`  ${ok ? "✓" : "✗"} ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}
function skip(name: string, why: string) {
  skipped.push(`${name} — ${why}`);
  out(`  · SKIPPED ${name} — ${why}`);
}
const fmtList = (xs: string[]) => (xs.length > 5 ? `${xs.slice(0, 5).join("; ")}; … (${xs.length})` : xs.join("; "));

async function proveProfile(p: Profile) {
  const inv = buildInventory(p.ans);
  const u = userLevel(inv);
  const ou = oracleUser(p.ans);
  const r = await buildResults(inv);
  const dirs = r.directions;

  out("=".repeat(100));
  out(`PROFILE: ${p.name}`);
  out(`  user level: ${lvlName(u.ordinal)} · acceptsLower: ${u.acceptsLower} · surfaced: ${dirs.length}`);
  out("=".repeat(100));

  const before = topN(dirs, (d) => d.rankScore, 8);
  const after = topN(dirs, (d) => d.displayRank, 8);
  out("\nBEFORE (pre-demote, by rankScore base):");
  before.forEach((d, i) => out(row(d, i)));
  out("\nAFTER (rendered, by displayRank):");
  after.forEach((d, i) => out(row(d, i)));

  out("\nCHECKS:");
  // Non-empty (2026-11-23): the checks below must run on real directions.
  check(`profile surfaces directions (${dirs.length}, need ≥ 1)`, dirs.length > 0);
  check(
    "user level read the same by engine and oracle",
    u.ordinal === ou.ordinal && u.acceptsLower === ou.acceptsLower,
    `engine ${u.ordinal}/${u.acceptsLower} vs oracle ${ou.ordinal}/${ou.acceptsLower}`,
  );

  // 1. penalty from the ads
  const wrongPenalty = dirs
    .map((d) => ({ d, o: oraclePenalty(d.market.offers, ou) }))
    .filter(({ d, o }) => !close(d.levelPenalty, o))
    .map(({ d, o }) => `${d.romeCode} engine=${d.levelPenalty.toFixed(3)} ads=${o.toFixed(3)}`);
  check(`penalty matches the ads for all ${dirs.length} directions`, wrongPenalty.length === 0, fmtList(wrongPenalty));

  // 2. the formula
  const wrongRank = dirs
    .filter((d) => !close(d.displayRank, d.rankScore * (1 - W_LEVEL_DEMOTE * d.levelPenalty)))
    .map((d) => `${d.romeCode} disp=${d.displayRank} base=${d.rankScore} pen=${d.levelPenalty}`);
  check(`displayRank = base × (1 − ${W_LEVEL_DEMOTE} × penalty) for all directions`, wrongRank.length === 0, fmtList(wrongRank));

  // 3. zero-penalty directions don't move
  const zero = dirs.filter((d) => d.levelPenalty === 0);
  const zeroMoved = zero.filter((d) => d.displayRank !== d.rankScore).map((d) => d.romeCode);
  const zeroByBase = [...zero].sort((a, b) => b.rankScore - a.rankScore || a.romeCode.localeCompare(b.romeCode)).map((d) => d.romeCode);
  const zeroByDisp = [...zero].sort((a, b) => b.displayRank - a.displayRank || a.romeCode.localeCompare(b.romeCode)).map((d) => d.romeCode);
  check(
    `${zero.length} zero-penalty directions unchanged (score and relative order)`,
    zeroMoved.length === 0 && zeroByBase.join() === zeroByDisp.join(),
    zeroMoved.length ? `moved: ${fmtList(zeroMoved)}` : "relative order changed",
  );

  if (u.acceptsLower) {
    // 5. opt-out
    check("accept-lower: every penalty is 0", dirs.every((d) => d.levelPenalty === 0));
    const fullBase = topN(dirs, (d) => d.rankScore, dirs.length).map((d) => d.romeCode).join();
    const fullDisp = topN(dirs, (d) => d.displayRank, dirs.length).map((d) => d.romeCode).join();
    check("accept-lower: full order identical to pre-demote", fullBase === fullDisp);
  } else {
    // 4. the demote applies
    const penalised = dirs.filter((d) => d.levelPenalty > 0);
    check(`demote applies: ${penalised.length} penalised directions (need ≥ 1)`, penalised.length > 0);
    const notScaled = penalised.filter((d) => d.rankScore > 0 && !(d.displayRank < d.rankScore)).map((d) => d.romeCode);
    check("every penalised direction is scaled down", notScaled.length === 0, fmtList(notScaled));
  }

  if (p.ans === MASTERS_HR) {
    // 4b. live G1803 case
    const g = dirs.find((d) => d.romeCode === "G1803");
    const gOracle = g ? oraclePenalty(g.market.offers, ou) : 0;
    if (!g) skip("live G1803 demoted", "G1803 not surfaced for this profile this week; the synthetic case covers the mechanism");
    else if (gOracle === 0) skip("live G1803 demoted", "G1803's current ads carry no level signal; the synthetic case covers the mechanism");
    else {
      const beforeTop5 = new Set(topN(dirs, (d) => d.rankScore, 5).map((d) => d.romeCode));
      const afterTop5 = new Set(topN(dirs, (d) => d.displayRank, 5).map((d) => d.romeCode));
      check(
        `live G1803 demoted (penalty ${g.levelPenalty.toFixed(2)}, ${g.rankScore.toFixed(2)} → ${g.displayRank.toFixed(2)})`,
        g.levelPenalty > 0 && g.displayRank < g.rankScore,
      );
      out(`    G1803 top 5: before ${beforeTop5.has("G1803") ? "in" : "out"}, after ${afterTop5.has("G1803") ? "in" : "out"} (information, not a check)`);
    }

    // Known quality issue — reported, never a pass.
    const dAfter = topN(dirs, (d) => d.displayRank, dirs.length);
    const pos = dAfter.findIndex((d) => d.romeCode === "D1408");
    if (pos >= 0 && pos < 5) {
      const d = dAfter[pos];
      const fifthOther = dAfter.filter((x) => x.romeCode !== "D1408")[4].displayRank;
      const needed = (1 - fifthOther / d.rankScore) / W_LEVEL_DEMOTE;
      out(
        `  ⚠ KNOWN QUALITY ISSUE (not a pass): D1408 téléconseil is #${pos + 1} after the demote ` +
          `(base ${d.rankScore.toFixed(2)}, penalty ${d.levelPenalty.toFixed(2)} → ${d.displayRank.toFixed(2)}). ` +
          `Leaving the top 5 needs a penalty > ${needed.toFixed(2)}${needed > 1 ? ", beyond the cap at any penalty" : ""}. ` +
          `Cause is the base score: see scripts/d1408-diagnosis.ts.`,
      );
    } else if (pos >= 0) {
      out(`  · D1408 is #${pos + 1} after the demote (outside the top 5 this run).`);
    }
  }
  out("");
}

/** Data-independent G1803-shaped case: the mechanism must fire on known ads. */
function syntheticG1803() {
  out("=".repeat(100));
  out("SYNTHETIC: G1803-shaped direction (3 ads, 'Aucune formation scolaire', 2 of 3 débutant)");
  out("=".repeat(100));
  const ad = (i: number, exp: string): Offer => ({
    id: `syn-${i}`, intitule: "Serveur", romeCode: "G1803", typeContrat: "CDI",
    lieuTravail: { libelle: "75", departement: "75" }, competences: [],
    formations: [{ niveauLibelle: "Aucune formation scolaire" }], experienceExige: exp, dateCreation: "2026-11-01",
  });
  const offers = [ad(1, "D"), ad(2, "D"), ad(3, "E")];
  const d = {
    market: { offers, experienceMix: [{ code: "D", count: 2 }, { code: "E", count: 1 }] },
  } as unknown as DirectionWithMarket;
  const base = 2;
  const cases: { label: string; u: OracleUser; want: number }[] = [
    { label: "bac+5 user → full penalty", u: { ordinal: 5, acceptsLower: false }, want: 1 },
    { label: "bac+2 user → gap 3, penalty 0.67", u: { ordinal: 3, acceptsLower: false }, want: 2 / 3 },
    { label: "cap user → gap 1, no penalty (mismatch, not status)", u: { ordinal: 1, acceptsLower: false }, want: 0 },
    { label: "bac+5 user who accepts lower → no penalty", u: { ordinal: 5, acceptsLower: true }, want: 0 },
    { label: "no diploma answered → no penalty", u: { ordinal: null, acceptsLower: false }, want: 0 },
  ];
  out("\nCHECKS:");
  for (const c of cases) {
    const pen = levelPenalty(d, c.u);
    const disp = displayRank(base, pen);
    check(
      `${c.label}: penalty ${pen.toFixed(2)}, ${base} → ${disp.toFixed(2)}`,
      close(pen, c.want) && close(pen, oraclePenalty(offers, c.u)) && close(disp, base * (1 - W_LEVEL_DEMOTE * c.want)),
      `want ${c.want.toFixed(2)}`,
    );
  }
  out("");
}

async function main() {
  out("LEVEL-DEMOTE PROOF — live graph");
  out(`ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE} · W_LEVEL_DEMOTE=${W_LEVEL_DEMOTE}`);
  out(`niveauLibelle sanity: "Bac+5 et plus"→${niveauLibelleOrdinal("Bac+5 et plus ou équivalents")} · "CAP, BEP"→${niveauLibelleOrdinal("CAP, BEP et équivalents")}`);
  out("");
  syntheticG1803();
  for (const p of PROFILES) await proveProfile(p);

  out("=".repeat(100));
  check(
    "every diploma band in the ads is known to the oracle",
    unknownBands.size === 0,
    `unknown: ${[...unknownBands].join(" | ")}`,
  );
  const total = passed + failures.length;
  out(`\nLEVEL-DEMOTE: ${passed}/${total} checks pass${skipped.length ? ` · ${skipped.length} skipped` : ""}`);
  for (const f of failures) out(`  FAIL ${f}`);
  out(`(full output → ${OUT})`);
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
