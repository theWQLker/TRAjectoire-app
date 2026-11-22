/**
 * Sessions for the quiz-page proof screenshots (2026-11-22 brief): P4's answers
 * (blanks as « Ni l'un ni l'autre »; on page 4, a blank scene gets « Un peu »
 * on statement A so the collapsed lines show both intensities: screenshot data,
 * not a persona run), cut so that /quiz?reprendre=<id> opens on the state:
 *   page4-full       pages 1-3 complete → page 4 as it opens (first scene open, the rest upcoming)
 *   page4-collapsed  plus page 4's first two scenes → two collapsed lines, the third open (the mockup's state)
 *   last-page        pages 1-10 complete → page 11, its scenes and quick-picks
 * Dev database only, flagged is_test. Prints `name id` per line.
 *
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/quiz-screens.ts
 *   ... scripts/quiz-screens.ts --delete <id> [<id> ...]
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { QUIZ_PAGES } from "../src/app/quiz/pages";
import { PERSONAS } from "./directions-prototype";
import { themeAnswers } from "./theme-personas";

const p4 = themeAnswers(PERSONAS.find((p) => p.id === "P4")!);
const upTo = (pages: number, extraScenes = 0): Answers => {
  const a: Answers = { seed_families: p4.seed_families, c_departement: p4.c_departement, c_diploma: p4.c_diploma };
  for (const pg of QUIZ_PAGES.slice(0, pages)) for (const id of pg.sceneIds) a[id] = p4[id] ?? (pg.index === 3 ? "un_peu_a" : "ni_l_un");
  for (const id of QUIZ_PAGES[pages]?.sceneIds.slice(0, extraScenes) ?? []) a[id] = p4[id] ?? "un_peu_a";
  return a;
};

const SCREENS: [string, Answers][] = [
  ["page4-full", upTo(3)],
  ["page4-collapsed", upTo(3, 2)],
  ["last-page", upTo(QUIZ_PAGES.length - 1)],
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
  for (const [name, answers] of SCREENS) {
    const inventory = buildInventory(answers);
    const { data, error } = await db
      .from("quiz_sessions")
      .insert({ answers, inventory, constraints: inventory.constraints, financial_inputs: {}, is_test: true })
      .select("id")
      .single();
    if (error) throw error;
    console.log(`${name} ${data.id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
