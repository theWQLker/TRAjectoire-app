/**
 * Results fingerprint per persona run: sha256 of what the engine returns
 * (buildInventory → buildResults → computeDirections) for the 96 runs of
 * quiz-inventory-fingerprint (15 answered personas in 75, 93 and 75+93; every
 * seed depth alone), plus each answered persona with each of the five old
 * salary bands (round 4, 2026-11-23: ar_salaire_min became « accepteriez-vous
 * un métier qui demande moins que votre diplôme ? »; old values must give the
 * same results through the mapping). Run on the tree before and after a change
 * and diff: no output = the same results for every run. Live sources only make
 * it evidence. (results-fingerprint.ts is the older 10-persona field dump.)
 *
 * The hash leaves out `results.inventory`, the input echoed back: removing a
 * field nothing reads changes the echo, not the results. --inventories <file>
 * writes each run's inventory (JSON lines) so that difference can be checked
 * field by field.
 *
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/persona-results-fingerprint.ts [--inventories inv.jsonl] > after.txt
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { buildInventory } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { computeDirections } from "../src/lib/engine/directions";
import { allPersonaAnswers } from "./quiz-inventory-fingerprint";
import { QUIZ_ONLY, themeAnswers } from "./theme-personas";
import { PERSONAS } from "./directions-prototype";

/** The five option ids ar_salaire_min had until 2026-11-23. */
const OLD_SALARY_BANDS = ["lt1500", "1500_1800", "1800_2200", "2200_2700", "gt2700"];

async function main() {
  const invOut = process.argv.indexOf("--inventories");
  const rows: [string, Record<string, string>][] = [
    ...allPersonaAnswers(),
    ...[...PERSONAS, ...QUIZ_ONLY].flatMap((p) =>
      OLD_SALARY_BANDS.map((band): [string, Record<string, string>] => [`${p.id} salaire ${band}`, { ...themeAnswers(p), ar_salaire_min: band }]),
    ),
  ];
  const inventories: string[] = [];
  for (const [id, answers] of rows) {
    const inventory = buildInventory(answers);
    const results = await buildResults(inventory);
    const directions = await computeDirections(results, answers);
    const { inventory: _echo, ...engine } = results;
    const json = JSON.stringify({ results: engine, directions });
    console.log(`${createHash("sha256").update(json).digest("hex").slice(0, 16)}  ${json.length}  ${id}`);
    inventories.push(JSON.stringify({ id, inventory }));
  }
  if (invOut > 0) writeFileSync(process.argv[invOut + 1], inventories.join("\n") + "\n");
  console.error(`${rows.length} runs (ROME_SOURCE=${process.env.ROME_SOURCE}, OFFER_SOURCE=${process.env.OFFER_SOURCE})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
