/**
 * Sessions for the directions-first proof screenshots (2026-11-22 brief):
 * P5 (seed tech:code + relation answers, Paris), P1 (quiz only, Paris), one
 * seed-only persona (tech:code, Paris) and one non-Paris persona (P5 in
 * Seine-Saint-Denis, a zone with no offer data). Same path as the quiz:
 * answers → buildInventory → quiz_sessions, flagged is_test.
 *
 * Dev database only (target-guard refuses a remote one without opt-in).
 * Prints `name id` per line.
 *
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/directions-screens.ts
 *   ... scripts/directions-screens.ts --delete <id> [<id> ...]
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { PERSONAS } from "./directions-prototype";
import { themeAnswers } from "./theme-personas";

const p = (id: string) => {
  const found = PERSONAS.find((x) => x.id === id);
  if (!found) throw new Error(`no persona ${id}`);
  return found;
};

export const SCREEN_PERSONAS: { name: string; answers: Answers }[] = [
  { name: "p5", answers: themeAnswers(p("P5")) },
  { name: "p1-quiz-only", answers: themeAnswers(p("P1")) },
  { name: "seed-only-tech", answers: { [SEED_ANSWER_KEY]: "tech:code", c_departement: "75", c_diploma: "bac2" } },
  { name: "p5-seine-saint-denis", answers: themeAnswers(p("P5"), "93") },
];

async function main() {
  const db = getSupabaseServiceClient();
  const args = process.argv.slice(2);
  if (args[0] === "--delete") {
    const { error } = await db.from("quiz_sessions").delete().in("id", args.slice(1));
    if (error) throw error;
    console.log(`deleted ${args.length - 1}`);
    return;
  }
  for (const s of SCREEN_PERSONAS) {
    const inventory = buildInventory(s.answers);
    const { data, error } = await db
      .from("quiz_sessions")
      .insert({ answers: s.answers, inventory, constraints: inventory.constraints, financial_inputs: {}, is_test: true })
      .select("id")
      .single();
    if (error) throw error;
    console.log(`${s.name} ${data.id}`);
  }
}

if (process.argv[1]?.endsWith("directions-screens.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
