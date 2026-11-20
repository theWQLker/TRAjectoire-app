/**
 * REACH MAP — for every ROME domaine professionnel (3-char code: M15, M16, …),
 * the best display rank any of its jobs reaches for a person who honestly does
 * that work, (a) from quiz answers alone and (b) with the matching seed niche.
 * Unreachable = outside the top 20. In-process only: no session, no DB write.
 *
 * WHO "honestly does that work" (the automatic answerer). For each scored scene
 * (the ones whose sides map to clusters or RIASEC), each side gets a score from
 * two independent readings of the domain's own jobs, each as a LIFT over the
 * whole referential (1 = as typical of this domain as of any job):
 *   - skills: how often the domain's fiches list the codes of the side's
 *     clusters (Σ weight × share of the cluster's codes the fiche lists, over
 *     clusters that carry codes), divided by the same over all jobs;
 *   - interests: share of the domain's jobs whose major RIASEC letters include a
 *     letter of the side, divided by the same over all jobs.
 * A side's score is the mean of the readings it has. Then:
 *   both scores < 1                 → ni l'un ni l'autre (neither describes the work)
 *   ratio ≥ 1.5                     → plutôt <stronger side>
 *   1.15 ≤ ratio < 1.5              → un peu <stronger side>
 *   otherwise                       → les deux
 * Contraintes / argent scenes carry no vocabulary and are left unanswered; the
 * zone is Paris (75), the zone with the most ads. No diploma → no level demote.
 * The answerer reads the fiches, never the ranking, so it cannot game the rank.
 *
 * RANK = position in the /results display order over every shown direction
 * (sortForDisplay over directions + "non vérifié"), the order
 * persona-before-after.ts calls top 10. Seed niche for a domain = the depth whose
 * prefixes cover the most of its jobs (none for some domains).
 *
 * Measured on today's offers: offer counts move ranks, so re-run after any offer
 * refresh or merge that changes offer sources.
 *
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/reach-map.ts snap <out.json>
 *   node_modules/.bin/tsx scripts/reach-map.ts diff <before.json> <after.json>
 *   ... scripts/reach-map.ts sheet <domain>       # print the answer sheet used
 */
import { readFileSync, writeFileSync } from "node:fs";
import { getRomeSource, type RomeMetier } from "../src/lib/rome";
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { sortForDisplay } from "../src/app/results/display";
import { CLUSTERS } from "../config/clusters";
import { CATEGORIES, type Scene, type SideMapping } from "../config/quiz";
import { FAMILIES } from "../config/families";
import { HR_ASSISTANT, SECRETARY } from "./honest-personas";

const TOP = 20;
const ZONE = "75";
const CLUSTER_CODES = new Map(CLUSTERS.map((c) => [c.id, c.competenceCodes]));

// Same niche prefixes as build-families.ts / family-presence.ts.
const NICHE_PREFIX: Record<string, string[]> = {
  "tech:code":["M180","M182","M184","M185"],"tech:sysadmin":["M181"],"tech:support":["I140"],"tech:data":["M183","M140"],
  "sante:soin":["J150","J151"],"sante:medico":["J130"],"sante:reeduc":["J140","J141"],
  "btp:gros":["F170"],"btp:second":["F160"],"btp:conduite":["F110","F120"],
  "maintenance:indus":["I130"],"maintenance:vehicule":["I160"],"maintenance:batiment":["I120"],
  "commerce:vente":["D12"],"commerce:caisse":["D15"],"commerce:commercial":["D14"],
  "industrie:production":["H28","H33"],"industrie:qualite":["H15"],"industrie:montage":["H29"],
  "hotellerie:cuisine":["G16"],"hotellerie:salle":["G18"],"hotellerie:accueil":["G12"],
  "admin:secretariat":["M160"],"admin:compta":["M120"],"admin:rh":["M150"],
  "agriculture:culture":["A14"],"agriculture:paysage":["A13"],"agriculture:foret":["A12"],
  "artisanat:art":["B16","B18"],"artisanat:spectacle":["L15"],"artisanat:creation":["L12","L13"],
  "banque:banque":["C11"],"banque:assurance":["C12"],"banque:immo":["C15"],
  "communication:comm":["E11"],"communication:design":["E12"],"communication:audiovisuel":["E13","E14"],
  "services:social":["K12"],"services:domicile":["K13"],"services:securite":["K17","K25"],"services:enseignement":["K21"],
  "transport:conduite":["N41","N44"],"transport:entrepot":["N11"],"transport:exploitation":["N13","N12"],
};
for (const f of FAMILIES) for (const d of f.depths) {
  if (!NICHE_PREFIX[`${f.id}:${d.id}`]) throw new Error(`reach-map: no prefix for ${f.id}:${d.id}`);
}

const majors = (m: RomeMetier): string[] =>
  m.riasecRanked?.length ? m.riasecRanked.filter((r) => r.rank === "major").map((r) => r.code) : m.riasec;

/** Skill reading of one side over a job set (undefined when no cluster carries codes). */
function skillEvidence(side: SideMapping, jobs: RomeMetier[]): number | undefined {
  let num = 0, den = 0;
  for (const cw of side.clusters ?? []) {
    const codes = CLUSTER_CODES.get(cw.id) ?? [];
    if (!codes.length) continue;
    let hit = 0;
    for (const j of jobs) {
      const fiche = new Set(j.competences.map((c) => c.code));
      hit += codes.filter((c) => fiche.has(c)).length / codes.length;
    }
    num += cw.weight * (hit / jobs.length);
    den += cw.weight;
  }
  return den ? num / den : undefined;
}

/** Interest reading of one side over a job set (undefined when the side has no letters or no job has RIASEC). */
function riasecEvidence(side: SideMapping, jobs: RomeMetier[]): number | undefined {
  const letters = side.riasec ?? [];
  const withR = jobs.filter((j) => majors(j).length);
  if (!letters.length || !withR.length) return undefined;
  return withR.filter((j) => majors(j).some((l) => letters.includes(l as never))).length / withR.length;
}

function sideScore(side: SideMapping, dom: RomeMetier[], all: RomeMetier[]): number | undefined {
  const lifts: number[] = [];
  const s = skillEvidence(side, dom), sAll = skillEvidence(side, all);
  if (s !== undefined && sAll) lifts.push(s / sAll);
  const r = riasecEvidence(side, dom), rAll = riasecEvidence(side, all);
  if (r !== undefined && rAll) lifts.push(r / rAll);
  return lifts.length ? lifts.reduce((a, b) => a + b, 0) / lifts.length : undefined;
}

function answerScene(scene: Scene, dom: RomeMetier[], all: RomeMetier[]): string | undefined {
  const a = sideScore(scene.optionA.maps, dom, all);
  const b = sideScore(scene.optionB.maps, dom, all);
  if (a === undefined && b === undefined) return undefined;
  const sa = a ?? 0, sb = b ?? 0;
  if (sa < 1 && sb < 1) return "ni_l_un";
  const hi = Math.max(sa, sb), lo = Math.min(sa, sb);
  const ratio = lo > 0 ? hi / lo : Infinity;
  const side = sa >= sb ? "a" : "b";
  if (ratio >= 1.5) return `plutot_${side}`;
  if (ratio >= 1.15) return `un_peu_${side}`;
  return "les_deux";
}

export function honestAnswers(dom: RomeMetier[], all: RomeMetier[]): Answers {
  const ans: Answers = { c_departement: ZONE };
  for (const cat of CATEGORIES) for (const scene of cat.scenes) {
    const v = answerScene(scene, dom, all);
    if (v) ans[scene.id] = v;
  }
  return ans;
}

function nicheFor(domain: string, jobs: RomeMetier[]): string | undefined {
  let best: string | undefined, bestN = 0;
  for (const [pick, prefixes] of Object.entries(NICHE_PREFIX)) {
    const n = jobs.filter((j) => prefixes.some((p) => j.romeCode.startsWith(p))).length;
    if (n > bestN) { best = pick; bestN = n; }
  }
  return best;
}

type Hit = { rank: number | null; code: string | null; title: string | null };
async function bestRank(answers: Answers, domain: string): Promise<Hit> {
  const r = await buildResults(buildInventory(answers));
  const shown = [...sortForDisplay(r.directions), ...sortForDisplay(r.unverified)];
  const i = shown.findIndex((d) => d.romeCode.startsWith(domain));
  return i < 0 ? { rank: null, code: null, title: null } : { rank: i + 1, code: shown[i].romeCode, title: shown[i].title };
}

type Row = { domain: string; jobs: number; niche: string | null; a: Hit; b: Hit | null; seedOnly: Hit | null };
type Snap = { at: string; rows: Row[]; personas: Record<string, Record<string, Hit>> };

async function snap(outPath: string) {
  const rome = getRomeSource();
  const all = await rome.allMetiers();
  const byDomain = new Map<string, RomeMetier[]>();
  for (const m of all) byDomain.set(m.romeCode.slice(0, 3), [...(byDomain.get(m.romeCode.slice(0, 3)) ?? []), m]);
  const rows: Row[] = [];
  for (const domain of [...byDomain.keys()].sort()) {
    const jobs = byDomain.get(domain)!;
    const ans = honestAnswers(jobs, all);
    const niche = nicheFor(domain, jobs) ?? null;
    const a = await bestRank(ans, domain);
    const b = niche ? await bestRank({ ...ans, [SEED_ANSWER_KEY]: niche }, domain) : null;
    const seedOnly = niche ? await bestRank({ c_departement: ZONE, [SEED_ANSWER_KEY]: niche }, domain) : null;
    rows.push({ domain, jobs: jobs.length, niche, a, b, seedOnly });
    process.stderr.write(`${domain} a=${a.rank ?? "—"} b=${b?.rank ?? "n/a"}\n`);
  }
  // Hand-written personas, checked against the two target domains.
  const personas: Snap["personas"] = {};
  const hand: Record<string, Answers> = {
    hr_assistant: HR_ASSISTANT,
    hr_assistant_rh_seed: { ...HR_ASSISTANT, [SEED_ANSWER_KEY]: "admin:rh" },
    secretary: SECRETARY,
    secretary_seed: { ...SECRETARY, [SEED_ANSWER_KEY]: "admin:secretariat" },
  };
  for (const [name, ans] of Object.entries(hand)) {
    personas[name] = { M15: await bestRank(ans, "M15"), M16: await bestRank(ans, "M16") };
  }
  const s: Snap = { at: new Date().toISOString(), rows, personas };
  writeFileSync(outPath, JSON.stringify(s, null, 1));
  print(s);
}

const fmt = (h: Hit | null) => (h === null ? "n/a" : h.rank === null ? "—" : h.rank > TOP ? `${h.rank}✗` : `${h.rank}`);

function print(s: Snap) {
  console.log(`REACH MAP (${s.at}) — best display rank of a domain's jobs; ✗ = outside top ${TOP}, — = not shown`);
  console.log("domain jobs niche                      (a)answers (b)+seed seed-only  best job (a)");
  for (const r of s.rows) {
    console.log(`${r.domain.padEnd(6)} ${String(r.jobs).padStart(4)} ${(r.niche ?? "—").padEnd(26)} ${fmt(r.a).padStart(9)} ${fmt(r.b).padStart(8)} ${fmt(r.seedOnly).padStart(9)}  ${r.a.code ?? ""} ${(r.a.title ?? "").slice(0, 40)}`);
  }
  const reachA = s.rows.filter((r) => r.a.rank !== null && r.a.rank <= TOP).length;
  const withNiche = s.rows.filter((r) => r.niche);
  const reachB = withNiche.filter((r) => r.b?.rank != null && r.b.rank <= TOP).length;
  console.log(`\nreachable by answers alone: ${reachA}/${s.rows.length} domains · with seed: ${reachB}/${withNiche.length} domains that have a niche`);
  console.log("\nhand-written personas:");
  for (const [n, h] of Object.entries(s.personas)) console.log(`  ${n.padEnd(22)} M15 ${fmt(h.M15).padStart(4)} ${h.M15.code ?? ""}   M16 ${fmt(h.M16).padStart(4)} ${h.M16.code ?? ""}`);
}

function diff(aPath: string, bPath: string) {
  const A: Snap = JSON.parse(readFileSync(aPath, "utf8"));
  const B: Snap = JSON.parse(readFileSync(bPath, "utf8"));
  const before = new Map(A.rows.map((r) => [r.domain, r]));
  console.log("domain  (a) before → after   (b) before → after");
  for (const r of B.rows) {
    const p = before.get(r.domain);
    if (!p) continue;
    if (fmt(p.a) === fmt(r.a) && fmt(p.b) === fmt(r.b)) continue;
    console.log(`${r.domain.padEnd(6)}  ${fmt(p.a).padStart(5)} → ${fmt(r.a).padEnd(6)}     ${fmt(p.b).padStart(5)} → ${fmt(r.b)}`);
  }
  const reach = (s: Snap, k: "a" | "b") => s.rows.filter((r) => { const h = r[k]; return h?.rank != null && h.rank <= TOP; }).length;
  console.log(`\nreachable (a): ${reach(A, "a")} → ${reach(B, "a")} · (b): ${reach(A, "b")} → ${reach(B, "b")}`);
  for (const n of Object.keys(B.personas)) {
    const x = A.personas[n], y = B.personas[n];
    if (x) console.log(`  ${n.padEnd(22)} M15 ${fmt(x.M15)} → ${fmt(y.M15)}   M16 ${fmt(x.M16)} → ${fmt(y.M16)}`);
  }
}

async function sheet(domain: string) {
  const all = await getRomeSource().allMetiers();
  const dom = all.filter((m) => m.romeCode.startsWith(domain));
  const ans = honestAnswers(dom, all);
  for (const cat of CATEGORIES) for (const scene of cat.scenes) {
    if (!ans[scene.id]) continue;
    const a = sideScore(scene.optionA.maps, dom, all), b = sideScore(scene.optionB.maps, dom, all);
    console.log(`${scene.id.padEnd(26)} ${ans[scene.id].padEnd(9)} A=${a?.toFixed(2) ?? "—"} B=${b?.toFixed(2) ?? "—"}  A«${scene.optionA.label.slice(0, 45)}» B«${scene.optionB.label.slice(0, 45)}»`);
  }
}

// Run only as a script, so other scripts can import honestAnswers.
const [mode, x, y] = process.argv.slice(2);
const isMain = process.argv[1]?.includes("reach-map") ?? false;
if (!isMain) {
  // imported
} else if (mode === "snap" && x) snap(x).catch((e) => { console.error(e); process.exit(1); });
else if (mode === "diff" && x && y) diff(x, y);
else if (mode === "sheet" && x) sheet(x).catch((e) => { console.error(e); process.exit(1); });
else { console.error("usage: reach-map.ts snap <out.json> | diff <before> <after> | sheet <domain>"); process.exit(1); }
