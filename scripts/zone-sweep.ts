/**
 * Zone sweep (decision 2026-11-22): the 116 sweep personas in 75, 93 and 69.
 *   (a) same answers → same roles, buckets, order, first view, held-back and
 *       fork in every zone (zoneSignature, scripts/zone-parity.ts);
 *   (b) every surfaced role has a France Travail search link for its zone.
 * Also lists the roles the old dead-end filter removed in 75 that now show:
 * exploratory, non-direct, 0 ads in 75, and not a deep seeded match (those were
 * kept before, with the "vous avez les compétences" line).
 *
 * Usage (live data, dev database):
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/zone-sweep.ts [out.json]
 * Exit 1 when (a) or (b) fails for any persona.
 */
import { writeFileSync } from "node:fs";
import { getRomeSource } from "../src/lib/rome";
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type Results } from "../src/lib/engine/results";
import { isExploratory } from "../src/lib/engine/coverage";
import { FAMILIES } from "../config/families";
import { honestAnswers, NICHE_MEMBERS } from "./reach-map";
import { COGNITIVE, HR_ASSISTANT, MASTERS_HR, MASTERS_HR_OLD, SECRETARY } from "./honest-personas";
import { PARITY_ZONES, zoneSignature, directionsSignature, firstDiff, ftLinkProblems } from "./zone-parity";
import { computeDirections } from "../src/lib/engine/directions";

async function personas(): Promise<{ name: string; answers: Answers }[]> {
  const all = await getRomeSource().allMetiers();
  const out: { name: string; answers: Answers }[] = [];
  for (const f of FAMILIES) for (const d of f.depths) {
    const pick = `${f.id}:${d.id}`;
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
  for (const [name, answers] of Object.entries(hand)) out.push({ name, answers });
  return out;
}

/** Roles the pre-2026-11-22 dead-end filter would have removed in this result (75). */
function formerlySuppressed(r: Results): { romeCode: string; title: string }[] {
  return r.directions
    .filter(
      (d) =>
        d.primaryLeap !== "direct" &&
        isExploratory(d.coverage) &&
        d.market.marketDemand === 0 &&
        !d.thinMarketSeeded,
    )
    .map((d) => ({ romeCode: d.romeCode, title: d.title }));
}

async function main() {
  const rows: {
    name: string;
    surfaced: number;
    parity: string | null;
    noLink: Record<string, string[]>;
    nowShown: string[];
  }[] = [];
  const shownTally = new Map<string, { title: string; personas: number }>();
  const reach = new Map<string, { title: string; personas: number }>();

  for (const p of await personas()) {
    const sigs: Record<string, string[]> = {};
    const noLink: Record<string, string[]> = {};
    let r75: Results | null = null;
    for (const z of PARITY_ZONES) {
      const a = { ...p.answers, c_departement: z };
      const inv = buildInventory(a);
      inv.constraints = { ...inv.constraints, departement: z, departements: [z] };
      const r = await buildResults(inv);
      if (z === "75") r75 = r;
      sigs[z] = [...zoneSignature(r), ...directionsSignature(await computeDirections(r, a))];
      const bad = ftLinkProblems(r);
      if (bad.length) noLink[z] = bad;
    }
    const parity =
      PARITY_ZONES.slice(1)
        .map((z) => {
          const d = firstDiff(sigs["75"], sigs[z]);
          return d ? `75 vs ${z} ${d}` : null;
        })
        .find((x) => x) ?? null;
    for (const d of r75!.directions) {
      const t = reach.get(d.romeCode) ?? { title: d.title, personas: 0 };
      t.personas++;
      reach.set(d.romeCode, t);
    }
    const now = formerlySuppressed(r75!);
    for (const s of now) {
      const t = shownTally.get(s.romeCode) ?? { title: s.title, personas: 0 };
      t.personas++;
      shownTally.set(s.romeCode, t);
    }
    rows.push({ name: p.name, surfaced: r75!.directions.length, parity, noLink, nowShown: now.map((s) => s.romeCode) });
    console.log(
      `${parity ? "✗" : "✓"} ${p.name.padEnd(30)} roles ${String(r75!.directions.length).padStart(4)}` +
        ` · formerly suppressed, now shown ${String(now.length).padStart(3)}` +
        (Object.keys(noLink).length ? ` · NO FT LINK ${JSON.stringify(noLink)}` : "") +
        (parity ? `\n    ${parity}` : ""),
    );
  }

  const parityFail = rows.filter((r) => r.parity).length;
  const linkFail = rows.filter((r) => Object.keys(r.noLink).length).length;
  const distinct = [...shownTally.entries()].sort((a, b) => b[1].personas - a[1].personas || a[0].localeCompare(b[0]));
  const totalNow = rows.reduce((s, r) => s + r.nowShown.length, 0);

  console.log("\n" + "=".repeat(78));
  console.log(`(a) zone parity 75/93/69: ${rows.length - parityFail}/${rows.length} personas identical`);
  console.log(`(b) France Travail link on every role: ${rows.length - linkFail}/${rows.length} personas`);
  console.log(`formerly removed by the dead-end filter in 75, now shown: ${totalNow} appearances, ${distinct.length} distinct roles`);
  const wide = [...reach.entries()].filter(([, t]) => t.personas * 2 > rows.length).sort((a, b) => b[1].personas - a[1].personas);
  console.log(`roles surfaced for more than half the personas (75): ${wide.length}`);
  for (const [code, t] of wide) console.log(`  WIDE ${code} ${t.title} (${t.personas}/${rows.length})`);
  for (const [code, t] of distinct) console.log(`  ${code} ${t.title} (${t.personas} personas)`);

  if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({ rows, distinct, wide }, null, 1));
  if (parityFail || linkFail) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
