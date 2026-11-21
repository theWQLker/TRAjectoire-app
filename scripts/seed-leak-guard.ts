/**
 * SEED LEAK GUARD (decision 2026-11-20). Exits 1 if a guarded seed niche carries
 * a skill its leak target's fiche carries on the live graph. Keep the list in
 * step with LEAK_GUARD in scripts/build-families.ts.
 *
 *   ROME_SOURCE=live node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/seed-leak-guard.ts
 */
import { getRomeSource } from "../src/lib/rome";
import { seedCodesFor } from "../config/families";

const GUARD: Record<string, string[]> = {
  "admin:rh": ["D1408"],
  "admin:secretariat": ["D1408"],
  "commerce:alimentaire": ["D1408"],
  "services:proprete": ["D1408"],
  "industrie:etudes": ["D1408"],
  "admin:juridique": ["D1408"],
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
  process.exit(bad ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
