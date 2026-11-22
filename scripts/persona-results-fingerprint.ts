/**
 * Results fingerprint per persona run: sha256 of the engine's Results and the
 * directions built from them (buildInventory → buildResults → computeDirections),
 * for the 96 runs of quiz-inventory-fingerprint (15 answered personas in 75, 93
 * and 75+93; every seed depth alone). Run on the tree before and after a change
 * and diff: no output = the same results for every run (round 3 brief,
 * 2026-11-23). Live sources only make it evidence. (results-fingerprint.ts is
 * the older 10-persona field dump.)
 *
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/persona-results-fingerprint.ts > after.txt
 */
import { createHash } from "node:crypto";
import { buildInventory } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { computeDirections } from "../src/lib/engine/directions";
import { allPersonaAnswers } from "./quiz-inventory-fingerprint";

async function main() {
  const rows = allPersonaAnswers();
  for (const [id, answers] of rows) {
    const results = await buildResults(buildInventory(answers));
    const directions = await computeDirections(results, answers);
    const json = JSON.stringify({ results, directions });
    console.log(`${createHash("sha256").update(json).digest("hex").slice(0, 16)}  ${json.length}  ${id}`);
  }
  console.error(`${rows.length} runs (ROME_SOURCE=${process.env.ROME_SOURCE}, OFFER_SOURCE=${process.env.OFFER_SOURCE})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
