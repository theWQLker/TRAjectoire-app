/**
 * Inventory fingerprint per persona: sha256 of JSON.stringify(buildInventory(answers)),
 * for the 66 personas (10 report personas, 5 quiz-only, every seed depth alone)
 * plus the answered ones in 93 and 75+93. Run before and after a quiz change:
 * same answers must give byte-identical inventories (quiz page brief, 2026-11-22).
 *
 *   node node_modules/tsx/dist/cli.mjs scripts/quiz-inventory-fingerprint.ts > before.txt
 *   ... change ...
 *   node node_modules/tsx/dist/cli.mjs scripts/quiz-inventory-fingerprint.ts > after.txt
 *   diff before.txt after.txt     (no output = identical)
 */
import { createHash } from "node:crypto";
import { buildInventory } from "../src/lib/quiz/build-inventory";
import { FAMILIES } from "../config/families";
import { QUIZ_ONLY, themeAnswers, type ThemePersona } from "./theme-personas";
import { PERSONAS } from "./directions-prototype";

export function allPersonaAnswers(): [string, Record<string, string>][] {
  const seedOnly: ThemePersona[] = FAMILIES.flatMap((f) =>
    f.depths.map((d) => ({ id: `seed ${f.id}:${d.id}`, label: "seed seul", theme: "none", seed: `${f.id}:${d.id}`, diploma: "bac2" })),
  );
  const answered = [...PERSONAS, ...QUIZ_ONLY];
  return [
    ...answered.map((p): [string, Record<string, string>] => [p.id, themeAnswers(p)]),
    ...seedOnly.map((p): [string, Record<string, string>] => [p.id, { seed_families: p.seed!, c_departement: "75", c_diploma: p.diploma }]),
    ...answered.flatMap((p) =>
      ["93", "75,93"].map((dep): [string, Record<string, string>] => [`${p.id} @${dep}`, themeAnswers(p, dep)]),
    ),
  ];
}

if (process.argv[1]?.endsWith("quiz-inventory-fingerprint.ts")) {
  const rows = allPersonaAnswers();
  for (const [id, answers] of rows) {
    const inv = JSON.stringify(buildInventory(answers));
    console.log(`${createHash("sha256").update(inv).digest("hex").slice(0, 16)}  ${inv.length}  ${id}`);
  }
  console.error(`${rows.length} personas`);
}
