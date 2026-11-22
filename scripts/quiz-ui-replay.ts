/**
 * QUIZ UI REPLAY: drives the real /quiz page (approved quiz-page mockup,
 * 2026-11-22) in a browser with each persona's answers, reads the answers the
 * form would post, and checks that they build a byte-identical inventory.
 *
 * - The 15 answered personas, in 75 and in 75 + 93: seed step, then all 11
 *   pages, one tap per scene. A scene the persona left blank gets « Ni l'un ni
 *   l'autre » (each page needs every answer; the engine reads ni_l_un as a
 *   blank). Quick-picks stay optional and are answered only where the persona
 *   answered them. The posted answers must give the same inventory.
 * - The 51 seed-only personas: the seed step only (their two quick-picks sit
 *   on page 9, behind the first chapter, as before). The posted seed token
 *   must be the persona's.
 * - One-open-at-a-time, collapse on answer, "Encore N réponses" opening the
 *   first gap, and ?reprendre=<session> opening the first unanswered page.
 *
 * Usage (a running build, local only):
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/quiz-ui-replay.ts
 *   (BASE=http://localhost:3101 to change port)
 */
import { buildInventory, SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { CATEGORIES, LEAN_OPTIONS, LEAN_WEIGHTS, SCENES_BY_ID, QUICK_PICKS_BY_ID } from "../config/quiz";
import { FAMILIES } from "../config/families";
import { CARD_LEVELS, NEUTRAL_LEVELS, QUIZ_PAGES } from "../src/app/quiz/pages";
import { QUIZ_ONLY, themeAnswers } from "./theme-personas";
import { PERSONAS } from "./directions-prototype";
import { resolveTarget } from "./target-guard";

const BASE = resolveTarget(process.env.BASE);
const PW = process.env.PLAYWRIGHT_CORE ?? "file:///D:/Dev/tools/shots/node_modules/playwright-core/index.mjs";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

let pass = 0;
const fails: string[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else fails.push(`${name}${detail ? `: ${detail}` : ""}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = any;

async function seedStep(page: Page, seed: string | undefined) {
  if (!seed) {
    await page.getByRole("button", { name: "Passer : je n'ai pas d'expérience claire à cocher" }).click();
    return;
  }
  for (const tok of seed.split(",")) {
    const [famId, depId] = tok.split(":");
    const fam = FAMILIES.find((f) => f.id === famId)!;
    const dep = fam.depths.find((d) => d.id === depId)!;
    await page.getByRole("button", { name: fam.label, exact: true }).click(); // selects the first depth
    if (fam.depths[0].id !== depId) {
      await page.getByRole("button", { name: dep.label, exact: true }).click();
      await page.getByRole("button", { name: fam.depths[0].label, exact: true }).click();
    }
  }
  await page.getByRole("button", { name: /^Continuer/ }).click();
}

const LEVELS = [...CARD_LEVELS.a.map((l) => ({ ...l, card: 0 })), ...CARD_LEVELS.b.map((l) => ({ ...l, card: 1 }))];

async function answerScene(page: Page, id: string, lean: string) {
  const scene = SCENES_BY_ID[id];
  const group = page.getByRole("group", { name: scene.prompt, exact: true });
  const card = LEVELS.find((l) => l.lean === lean);
  if (card) await group.locator(":scope > div").nth(card.card).getByRole("button", { name: card.label, exact: true }).click();
  else await group.getByRole("button", { name: NEUTRAL_LEVELS.find((l) => l.lean === lean)!.label, exact: true }).click();
}

async function quickPick(page: Page, id: string, value: string) {
  const qp = QUICK_PICKS_BY_ID[id];
  const group = page.getByRole("group", { name: qp.prompt, exact: true });
  for (const optId of value.split(",")) {
    const opt = qp.options.find((o) => o.id === optId)!;
    await group.getByRole("button", { name: opt.label, exact: true }).click();
  }
}

const posted = async (page: Page): Promise<Answers> => JSON.parse(await page.locator('input[name="answers"]').inputValue());
const pageLabel = (i: number) => `Page ${i + 1} sur ${QUIZ_PAGES.length}`;

/** Full run: seed step, every page, the posted answers on the last page. */
async function fullRun(page: Page, id: string, answers: Answers) {
  await page.goto(`${BASE}/quiz`);
  await seedStep(page, answers[SEED_ANSWER_KEY]);
  for (const p of QUIZ_PAGES) {
    await page.getByText(pageLabel(p.index), { exact: true }).waitFor();
    for (const sid of p.sceneIds) {
      // One open at a time: this scene is the open one when its turn comes.
      const open = await page.getByRole("group", { name: SCENES_BY_ID[sid].prompt, exact: true }).isVisible();
      check("the next scene is open when its turn comes", open, `${id} ${sid}`);
      await answerScene(page, sid, answers[sid] ?? "ni_l_un");
    }
    for (const q of p.quickPickIds) if (answers[q]) await quickPick(page, q, answers[q]);
    // Quick-picks stay optional: the page is complete once its scenes are.
    const encore = await page.getByRole("button", { name: /^Encore \d+ réponses?$/ }).count();
    check("« Encore N réponses » gone once every scene is answered", encore === 0, `${id} page ${p.index + 1}`);
    if (p.index < QUIZ_PAGES.length - 1) await page.getByRole("button", { name: "Continuer", exact: true }).click();
  }
  check("the last page offers « Voir mes directions »", await page.getByRole("button", { name: /Voir mes directions/ }).isVisible(), id);
  return posted(page);
}

async function main() {
  const { chromium } = await import(PW);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);

  // 0. The buttons map 1:1 to the engine's six values, with the engine's own labels
  //    ("Plutôt A" → the « Plutôt » button on card A), and nothing else.
  const shown = [...CARD_LEVELS.a.map((l) => [l.lean, `${l.label} A`]), ...CARD_LEVELS.b.map((l) => [l.lean, `${l.label} B`]), ...NEUTRAL_LEVELS.map((l) => [l.lean, l.label])];
  check(
    "the buttons are the engine's six values with their labels, 1:1",
    shown.length === Object.keys(LEAN_WEIGHTS).length &&
      LEAN_OPTIONS.every((o) => shown.some(([lean, label]) => lean === o.id && label === o.label)),
    JSON.stringify(shown),
  );

  // 1. Answered personas, full runs.
  const answered = [...PERSONAS, ...QUIZ_ONLY];
  let full = 0;
  for (const p of answered) {
    for (const dep of ["75", "75,93"]) {
      const want = themeAnswers(p, dep);
      const id = `${p.id} @${dep}`;
      const got = await fullRun(page, id, want);
      const same = JSON.stringify(buildInventory(got)) === JSON.stringify(buildInventory(want));
      check("same answers through the UI → byte-identical inventory", same, id);
      const values = Object.keys(want).every((k) => got[k] === want[k]);
      check("every answer the persona gave is posted with the same value", values, id);
      full++;
    }
  }

  // 2. Seed-only personas, seed step.
  let seeds = 0;
  for (const f of FAMILIES)
    for (const d of f.depths) {
      await page.goto(`${BASE}/quiz`);
      await seedStep(page, `${f.id}:${d.id}`);
      await page.getByText(pageLabel(0), { exact: true }).waitFor();
      const got = await posted(page);
      check("seed step posts the persona's seed token", got[SEED_ANSWER_KEY] === `${f.id}:${d.id}`, `${f.id}:${d.id} → ${got[SEED_ANSWER_KEY]}`);
      seeds++;
    }

  // 3. Behaviour on one page: collapse, reopen, « Encore N » opens the first gap.
  await page.goto(`${BASE}/quiz`);
  await seedStep(page, undefined);
  const [s1, s2] = QUIZ_PAGES[0].sceneIds;
  await answerScene(page, s1, "plutot_a");
  const collapsed = page.getByRole("button", { name: new RegExp(`Réponse : ${SCENES_BY_ID[s1].optionA.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}, Plutôt`) });
  check("an answered scene collapses to its statement and intensity", await collapsed.isVisible());
  check("the next scene opens on answer", await page.getByRole("group", { name: SCENES_BY_ID[s2].prompt, exact: true }).isVisible());
  await collapsed.click();
  check("tapping the line reopens it, one open at a time",
    (await page.getByRole("group", { name: SCENES_BY_ID[s1].prompt, exact: true }).isVisible()) &&
      !(await page.getByRole("group", { name: SCENES_BY_ID[s2].prompt, exact: true }).isVisible()));
  await page.getByRole("button", { name: "Encore 4 réponses", exact: true }).click();
  check("« Encore N réponses » opens the first unanswered scene", await page.getByRole("group", { name: SCENES_BY_ID[s2].prompt, exact: true }).isVisible());
  check("no disabled button on the page", (await page.locator("button[disabled]").count()) === 0);

  // 4. ?reprendre=<session>: the first unanswered page.
  const db = getSupabaseServiceClient();
  const p5 = themeAnswers(PERSONAS.find((p) => p.id === "P5")!);
  const allFilled: Answers = { ...p5 };
  for (const c of CATEGORIES) {
    for (const s of c.scenes) allFilled[s.id] ??= "ni_l_un";
  }
  const firstThree: Answers = { [SEED_ANSWER_KEY]: p5[SEED_ANSWER_KEY] };
  for (const pg of QUIZ_PAGES.slice(0, 3)) for (const id of [...pg.sceneIds, ...pg.quickPickIds]) firstThree[id] = allFilled[id];
  const cases: [string, Answers, string][] = [
    ["seeded, pages 1-3 complete → page 4", firstThree, pageLabel(3)],
    ["seeded, every page complete → the last page", allFilled, pageLabel(QUIZ_PAGES.length - 1)],
    ["no seed → the seed step", { ...allFilled, [SEED_ANSWER_KEY]: "" }, "Qu'est-ce que vous avez concrètement fait ?"],
    ["P5 as answered (gaps on page 1) → page 1", p5, pageLabel(0)],
  ];
  const ids: string[] = [];
  for (const [name, answers, expect] of cases) {
    const inventory = buildInventory(answers);
    const { data, error } = await db
      .from("quiz_sessions")
      .insert({ answers, inventory, constraints: inventory.constraints, financial_inputs: {}, is_test: true })
      .select("id")
      .single();
    if (error) throw error;
    ids.push(data.id);
    await page.goto(`${BASE}/quiz?reprendre=${data.id}`);
    const ok = await page.getByText(expect, { exact: true }).isVisible().catch(() => false);
    check(`?reprendre opens the first unanswered page: ${name}`, ok);
    if (name.startsWith("seeded, pages")) {
      // jsonb stores keys in its own order: compare per key.
      const got = await posted(page);
      const keys = new Set([...Object.keys(got), ...Object.keys(answers)]);
      check("the resumed answers are kept", [...keys].every((k) => got[k] === answers[k]), JSON.stringify(got));
    }
  }
  await db.from("quiz_sessions").delete().in("id", ids);
  await browser.close();

  console.log(`QUIZ UI REPLAY on ${BASE}: ${full} full runs (15 answered personas × 75 and 75+93), ${seeds} seed-only seed steps, 4 resume cases`);
  console.log(`${pass} checks pass, ${fails.length} fail`);
  for (const f of fails.slice(0, 20)) console.log(`  ✗ ${f}`);
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
