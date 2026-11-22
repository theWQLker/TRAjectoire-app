/**
 * SEED LEAK GUARD. Exits 1 on any violation of either rule, on the live graph:
 *   1. (2026-11-20) a guarded niche carries a skill its leak target's fiche
 *      carries. Keep GUARD in step with LEAK_GUARD in scripts/build-families.ts.
 *   2. (2026-11-22) ANY seed depth carries a code listed in more than
 *      MAX_CODE_DOMAINES ROME domaines (config/genericity.ts): a macro-competence.
 *      Same bound for every depth; never raise it to get a pass.
 * It also prints, without failing, the answer-linked skills (config/clusters.ts)
 * above the same bound: the audit list awaiting a decision.
 *
 *   ROME_SOURCE=live node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/seed-leak-guard.ts
 */
import { getRomeSource } from "../src/lib/rome";
import { FAMILIES, seedCodesFor } from "../config/families";
import { CLUSTERS } from "../config/clusters";
import { MAX_CODE_DOMAINES } from "../config/genericity";

const GUARD: Record<string, string[]> = {
  "admin:rh": ["D1408"],
  "admin:secretariat": ["D1408"],
  "commerce:alimentaire": ["D1408"],
  "services:proprete": ["D1408"],
  "industrie:etudes": ["D1408"],
  "admin:juridique": ["D1408"],
  "commerce:magasin": ["D1408"],
  "hotellerie:direction": ["D1408"],
  "services:territoire": ["D1408"],
};

async function main() {
  const all = await getRomeSource().allMetiers();
  let bad = 0;
  for (const [pick, targets] of Object.entries(GUARD)) {
    const seed = new Set(seedCodesFor([pick]));
    for (const t of targets) {
      const fiche = all.find((m) => m.romeCode === t);
      if (!fiche) { console.log(`✗ ${t} not in the graph`); bad++; continue; }
      const shared = fiche.competences.filter((c) => seed.has(c.code));
      console.log(`${shared.length ? "✗" : "✓"} ${pick} (${seed.size} codes) shares ${shared.length} with ${t}${shared.length ? ": " + shared.map((c) => `${c.code} ${c.libelle}`).join("; ") : ""}`);
      bad += shared.length;
    }
  }

  // Rule 2: every depth, one bound.
  const domaines = new Map<string, Set<string>>();
  const libelle = new Map<string, string>();
  for (const m of all) for (const c of m.competences) {
    const d = domaines.get(c.code) ?? new Set<string>(); d.add(m.romeCode.slice(0, 3)); domaines.set(c.code, d);
    libelle.set(c.code, c.libelle);
  }
  const spread = (c: string) => domaines.get(c)?.size ?? 0;
  let depths = 0, generic = 0;
  for (const f of FAMILIES) for (const d of f.depths) {
    depths++;
    const over = d.seedCodes.filter((c) => spread(c) > MAX_CODE_DOMAINES);
    if (over.length) {
      generic += over.length;
      console.log(`✗ ${f.id}:${d.id} carries ${over.length} code(s) listed in more than ${MAX_CODE_DOMAINES} domaines: ${over.slice(0, 5).map((c) => `${c} (${spread(c)}) ${libelle.get(c)}`).join("; ")}${over.length > 5 ? "; …" : ""}`);
    }
  }
  console.log(`${generic ? "✗" : "✓"} genericity: ${depths} seed depths, ${generic} code(s) above ${MAX_CODE_DOMAINES} domaines`);
  bad += generic;
  // Non-empty (2026-11-23): the rules above must have run on real seeds.
  const emptySeeds = FAMILIES.flatMap((f) => f.depths.filter((d) => d.seedCodes.length === 0).map((d) => `${f.id}:${d.id}`));
  const nonEmpty = depths > 0 && emptySeeds.length === 0 && Object.keys(GUARD).every((p) => seedCodesFor([p]).length > 0);
  console.log(`${nonEmpty ? "✓" : "✗"} non-empty: ${depths} depths, ${emptySeeds.length} with no seed code${emptySeeds.length ? ": " + emptySeeds.join(", ") : ""}, every guarded niche has a seed`);
  if (!nonEmpty) bad++;

  // Audit only (not enforced until decided): answer-linked skills above the bound.
  const audit: string[] = [];
  for (const c of CLUSTERS) for (const code of c.competenceCodes) {
    if (spread(code) > MAX_CODE_DOMAINES) audit.push(`${c.id} ${code} (${spread(code)}) ${libelle.get(code) ?? "?"}`);
  }
  console.log(`audit (not enforced): ${audit.length} answer-linked skill(s) above ${MAX_CODE_DOMAINES} domaines`);
  for (const a of audit) console.log(`   ${a}`);

  process.exit(bad ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
