/**
 * SCALE-BIAS DIAGNOSIS (decision 2026-11-21, item 2). Read-only: nothing in the
 * engine changes.
 *
 * Claim under test: rarity sums grow with inventory size, so a seeded user
 * (≈ 200 niche codes) outscores a quiz-only user (a few dozen cluster codes),
 * and seeded directions read "continuité" by volume alone.
 *
 * Per persona, over every ROME métier in the live graph:
 *   A = answer codes (inventory built WITHOUT the seed), S = seed codes.
 *   mass_X = Σ idf(X): the most rarity source X could ever contribute.
 *   m_X(r) = Σ idf(r ∩ X): what métier r actually shares with source X.
 *   best raw = max_r m(r)            — what the FORT cut is compared with today
 *   reach_X  = max_r m_X(r) / mass_X — the best any métier does with source X,
 *                                      as a share of what X offered
 * Then, on the engine's own surfaced roles:
 *   fit_X(r) = m_X(r) / max_r' m_X(r'), each source judged against its own best
 *   métier in the whole graph (the proposed normaliser), and
 *   - the révélée/continuité answer share on the top 40, three ways: raw
 *     (today), divided by source mass, divided by source best (fit);
 *   - the fort count per persona if Signal were a cut on max_X fit_X, with the
 *     MOYEN evidence floor (matchRaritySum ≥ 15) kept, vs FORT 350 today.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/scale-bias-diagnosis.ts
 */
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { getRomeSource, rarityOf } from "../src/lib/rome";
import { sortForDisplay } from "../src/app/results/display";
import { FAMILIES } from "../config/families";
import { QUIZ_ONLY, themeAnswers, type ThemePersona } from "./theme-personas";

const HR: Answers = {
  c_diploma: "bac5", sf_numbers_people: "plutot_b", sf_client_issue: "plutot_b",
  g_conflict: "plutot_a", g_teach_do: "plutot_a", sf_training_peer: "plutot_a",
  g_hidden_need: "plutot_a", ar_learning_investment: "plutot_b", c_departement: "75",
};

const MIXED: ThemePersona[] = [
  { id: "P4", label: "tech:code + analyse", theme: "analyse", seed: "tech:code", diploma: "bac5" },
  { id: "P5", label: "tech:code + relation", theme: "relation", seed: "tech:code", diploma: "bac5" },
  { id: "P6", label: "sante:soin + relation", theme: "relation", seed: "sante:soin", diploma: "bac3" },
  { id: "P7", label: "admin:rh + relation", theme: "relation", seed: "admin:rh", diploma: "bac5" },
  { id: "P8", label: "hotellerie:cuisine + terrain", theme: "terrain", seed: "hotellerie:cuisine", diploma: "cap" },
  { id: "P9", label: "commerce:vente + vente", theme: "vente", seed: "commerce:vente", diploma: "bac2" },
  { id: "P10", label: "btp:second + organisation", theme: "organisation", seed: "btp:second", diploma: "bac2" },
];

type P = { name: string; kind: "quiz" | "mixed" | "seed"; answers: Answers };
const PERSONAS: P[] = [
  { name: "masters_hr_75", kind: "quiz", answers: HR },
  ...QUIZ_ONLY.map((p): P => ({ name: p.id, kind: "quiz", answers: themeAnswers(p) })),
  ...MIXED.map((p): P => ({ name: `${p.id} ${p.label}`, kind: "mixed", answers: themeAnswers(p) })),
  ...FAMILIES.flatMap((f) =>
    f.depths.map((d): P => ({ name: `seed ${f.id}:${d.id}`, kind: "seed", answers: { [SEED_ANSWER_KEY]: `${f.id}:${d.id}`, c_departement: "75" } })),
  ),
];

const f1 = (n: number) => n.toFixed(1);
const pct = (n: number) => `${Math.round(n * 100)} %`;

async function main() {
  const rome = getRomeSource();
  const metiers = await rome.allMetiers();
  const rarity = await rome.competenceRarity();
  const N = metiers.length;
  const idf = (c: string) => rarityOf(rarity, c, N);
  const sum = (codes: Iterable<string>) => { let s = 0; for (const c of codes) s += idf(c); return s; };
  const roleCodes = new Map(metiers.map((m) => [m.romeCode, new Set(m.competences.map((c) => c.code))]));

  type Row = { name: string; kind: P["kind"]; nA: number; nS: number; massA: number; massS: number; bestRaw: number; bestRawA: number; bestRawS: number; reachA: number; reachS: number };
  const rows: Row[] = [];
  const splits: string[] = [];
  const FITS = [0.5, 0.6, 0.7, 0.8, 0.9];
  const sig: { name: string; kind: P["kind"]; today: number; fit: number[]; surfaced: number }[] = [];

  for (const p of PERSONAS) {
    const { [SEED_ANSWER_KEY]: _seed, ...noSeed } = p.answers;
    void _seed;
    const A = new Set(p.kind === "seed" ? [] : buildInventory(noSeed).competenceCodes);
    const inv = buildInventory(p.answers);
    const S = new Set(inv.seededCodes ?? []);
    const massA = sum(A);
    const massS = sum(S);
    let bestRaw = 0, bestRawA = 0, bestRawS = 0, maxA = 0, maxS = 0;
    for (const codes of roleCodes.values()) {
      let mA = 0, mS = 0, m = 0;
      for (const c of codes) {
        const inA = A.has(c), inS = S.has(c);
        if (inA) mA += idf(c);
        if (inS) mS += idf(c);
        if (inA || inS) m += idf(c);
      }
      if (m > bestRaw) { bestRaw = m; bestRawA = mA; bestRawS = mS; }
      maxA = Math.max(maxA, mA);
      maxS = Math.max(maxS, mS);
    }
    rows.push({ name: p.name, kind: p.kind, nA: A.size, nS: S.size, massA, massS, bestRaw, bestRawA, bestRawS, reachA: massA ? maxA / massA : 0, reachS: massS ? maxS / massS : 0 });

    const res = await buildResults(inv);
    {
      const fitOf = (codes: string[]) => {
        let mA = 0, mS = 0;
        for (const c of codes) { if (A.has(c)) mA += idf(c); if (S.has(c)) mS += idf(c); }
        return Math.max(maxA ? mA / maxA : 0, maxS ? mS / maxS : 0);
      };
      const ds = res.directions;
      sig.push({
        name: p.name,
        kind: p.kind,
        today: ds.filter((d) => d.matchRaritySum >= 350).length,
        fit: FITS.map((f) => ds.filter((d) => d.matchRaritySum >= 15 && fitOf(d.matchedCompetenceCodes) >= f).length),
        surfaced: ds.length,
      });
    }
    if (p.kind === "mixed") {
      // Answer share over the engine's own top-40 roles: raw, by mass, by best.
      const top = sortForDisplay(res.directions).slice(0, 40);
      let aW = 0, sW = 0;
      for (const d of top)
        for (const c of d.matchedCompetenceCodes) {
          const inA = A.has(c), inS = S.has(c);
          if (inA && inS) { aW += idf(c) / 2; sW += idf(c) / 2; } else if (inA) aW += idf(c); else if (inS) sW += idf(c);
        }
      const raw = aW / (aW + sW);
      const nA = aW / massA, nS = sW / massS;
      const norm = nA / (nA + nS);
      // Per role: how many of the top 40 would read "révélée" (≥ 50 %) each way.
      let rRaw = 0, rNorm = 0, rBest = 0, aB = 0, sB = 0;
      for (const d of top) {
        let a = 0, s = 0;
        for (const c of d.matchedCompetenceCodes) {
          const inA = A.has(c), inS = S.has(c);
          if (inA && inS) { a += idf(c) / 2; s += idf(c) / 2; } else if (inA) a += idf(c); else if (inS) s += idf(c);
        }
        if (a + s === 0) continue;
        if (a / (a + s) >= 0.5) rRaw++;
        if ((a / massA) / (a / massA + s / massS) >= 0.5) rNorm++;
        if ((a / maxA) / (a / maxA + s / maxS) >= 0.5) rBest++;
        aB += a / maxA;
        sB += s / maxS;
      }
      splits.push(`| ${p.name} | ${f1(massS / massA)}× | ${f1(maxA)} / ${f1(maxS)} | ${pct(raw)} · ${rRaw} | ${pct(norm)} · ${rNorm} | ${pct(aB / (aB + sB))} · ${rBest} |`);
    }
  }

  console.log("## Per-source mass and best match over the whole ROME graph\n");
  console.log("| Persona | answer codes | seed codes | mass answers | mass seed | best raw (answers + seed) | reach answers | reach seed |");
  console.log("|---|---|---|---|---|---|---|---|");
  for (const r of rows)
    console.log(`| ${r.name} | ${r.nA} | ${r.nS} | ${f1(r.massA)} | ${f1(r.massS)} | ${f1(r.bestRaw)} (${f1(r.bestRawA)} + ${f1(r.bestRawS)}) | ${r.massA ? pct(r.reachA) : "—"} | ${r.massS ? pct(r.reachS) : "—"} |`);

  const stat = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return `min ${f1(s[0])} · median ${f1(s[Math.floor(s.length / 2)])} · max ${f1(s[s.length - 1])}`;
  };
  const by = (k: P["kind"]) => rows.filter((r) => r.kind === k);
  console.log("\n## Summary by population\n");
  for (const k of ["quiz", "mixed", "seed"] as const) {
    const g = by(k);
    console.log(`- **${k}** (${g.length}): best raw ${stat(g.map((r) => r.bestRaw))}`);
    if (k !== "seed") console.log(`  - mass answers ${stat(g.map((r) => r.massA))}; reach answers ${stat(g.map((r) => r.reachA * 100))} %`);
    if (k !== "quiz") console.log(`  - mass seed ${stat(g.map((r) => r.massS))}; reach seed ${stat(g.map((r) => r.reachS * 100))} %`);
  }

  console.log("\n## Révélée / continuité on the engine's top 40, seed + answers personas\n");
  console.log("Each cell: answer share of the top-40 roles' shared rarity · roles (of 40) that would read révélée.\n");
  console.log("| Persona | seed mass / answer mass | best answer / best seed métier | raw (today) | ÷ source mass | ÷ source best (proposed) |");
  console.log("|---|---|---|---|---|---|");
  for (const s of splits) console.log(s);

  console.log("\n## Signal: fort per persona, FORT 350 today vs a cut on max fit (floor 15 kept)\n");
  console.log(`| Persona | surfaced | fort today (≥ 350) | ${FITS.map((f) => `fit ≥ ${f}`).join(" | ")} |`);
  console.log(`|---|---|---|${FITS.map(() => "---").join("|")}|`);
  for (const s of sig) console.log(`| ${s.name} | ${s.surfaced} | ${s.today} | ${s.fit.join(" | ")} |`);
  const col = (xs: number[]) => `max ${Math.max(...xs)}, >10: ${xs.filter((n) => n > 10).length}, zero: ${xs.filter((n) => n === 0).length}`;
  console.log("");
  for (const k of ["quiz", "mixed", "seed"] as const) {
    const g = sig.filter((s) => s.kind === k);
    console.log(`- **${k}** (${g.length}): today ${col(g.map((s) => s.today))}; ${FITS.map((f, i) => `fit ${f} → ${col(g.map((s) => s.fit[i]))}`).join("; ")}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
