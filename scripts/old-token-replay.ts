/**
 * OLD SEED TOKENS (family split, 2026-11-23): a session or a device draft saved
 * before the split holds tokens like `services:securite` or `admin:juridique`.
 * currentAnswers rewrites them to the current tokens, so the quiz must show them
 * selected:
 *   - ?reprendre=<session> with old tokens (and an old-token exclusion): the
 *     posted answers carry the current tokens, and the seed step (« Page
 *     précédente » from page 1) shows the family and depth pressed.
 *   - A draft saved before the split: « Reprendre où vous en étiez », same checks.
 * Inventories are checked separately (byte-identical before/after).
 *
 * Usage (a running build, local only, dev database):
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/old-token-replay.ts
 *   (BASE=http://localhost:3101 to change port)
 */
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { FAMILIES } from "../config/families";
import { DRAFT_KEY } from "../src/app/quiz/draft";
import { resolveTarget } from "./target-guard";

const BASE = resolveTarget(process.env.BASE ?? "http://localhost:3101");
const PW = process.env.PLAYWRIGHT_CORE ?? "file:///D:/Dev/tools/shots/node_modules/playwright-core/index.mjs";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const RESUME_DRAFT = "Reprendre où vous en étiez";

let pass = 0;
const fails: string[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else fails.push(`${name}${detail ? `: ${detail}` : ""}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = any;

/** Labels of the family and depth a current token names. */
function labelsOf(token: string): { family: string; depth: string } {
  const [famId, depId] = token.split(":");
  const fam = FAMILIES.find((f) => f.id === famId)!;
  return { family: fam.label, depth: fam.depths.find((d) => d.id === depId)!.label };
}

const posted = async (page: Page): Promise<Answers> => JSON.parse(await page.locator('input[name="answers"]').inputValue());

/** From page 1, back to the seed step; every expected family and depth pressed. */
async function seedShowsSelected(page: Page, name: string, tokens: string[]) {
  await page.getByRole("button", { name: "Page précédente", exact: true }).click();
  for (const t of tokens) {
    const { family, depth } = labelsOf(t);
    // A family not taken as selected hides its depth chips: read "absent", not a timeout.
    const pressed = async (label: string) => {
      const b = page.getByRole("button", { name: label, exact: true });
      return (await b.count()) ? await b.first().getAttribute("aria-pressed") : "absent";
    };
    const fam = await pressed(family);
    const dep = await pressed(depth);
    check(`${name}: « ${family} » / « ${depth} » shown selected`, fam === "true" && dep === "true", `family ${fam}, depth ${dep}`);
  }
}

const CASES: { name: string; answers: Answers; seed: string[]; exclusions?: string }[] = [
  {
    name: "services:securite with an exclusion",
    answers: { c_departement: "75", seed_families: "services:securite", seed_exclusions: "services:securite=K2503" },
    seed: ["securite:securite"],
    exclusions: "securite:securite=K2503",
  },
  { name: "admin:juridique", answers: { c_departement: "75", seed_families: "admin:juridique" }, seed: ["droit:juridique"] },
  {
    name: "bare services",
    answers: { c_departement: "75", seed_families: "services" },
    seed: ["social:social", "social:enseignement", "social:domicile", "social:territoire", "securite:securite", "proprete:proprete"],
  },
];

async function main() {
  const { chromium } = await import(PW);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const db = getSupabaseServiceClient();
  const ids: string[] = [];
  try {
    // 1. ?reprendre=<session> saved with old tokens.
    for (const c of CASES) {
      const inventory = buildInventory(c.answers);
      const { data, error } = await db
        .from("quiz_sessions")
        .insert({ answers: c.answers, inventory, constraints: inventory.constraints, financial_inputs: {}, is_test: true })
        .select("id")
        .single();
      if (error) throw error;
      ids.push(data.id);
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/quiz?reprendre=${data.id}`, { waitUntil: "networkidle" });
      const got = await posted(page);
      check(`?reprendre ${c.name}: posts the current tokens`, got.seed_families === c.seed.join(","), got.seed_families);
      if (c.exclusions) check(`?reprendre ${c.name}: exclusion re-keyed`, got.seed_exclusions === c.exclusions, got.seed_exclusions);
      await seedShowsSelected(page, `?reprendre ${c.name}`, c.seed);
      await ctx.close();
    }

    // 2. A device draft saved before the split.
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/quiz`, { waitUntil: "networkidle" });
    await page.evaluate(
      ([k, a]: [string, Answers]) => localStorage.setItem(k, JSON.stringify({ answers: a, savedAt: new Date(Date.now() - 864e5).toISOString() })),
      [DRAFT_KEY, { seed_families: "services:securite,admin:juridique", seed_exclusions: "services:securite=K2503" }] as [string, Answers],
    );
    await page.goto(`${BASE}/quiz`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: RESUME_DRAFT }).click();
    const got = await posted(page);
    check("pre-split draft: posts the current tokens", got.seed_families === "securite:securite,droit:juridique", got.seed_families);
    check("pre-split draft: exclusion re-keyed", got.seed_exclusions === "securite:securite=K2503", got.seed_exclusions);
    await seedShowsSelected(page, "pre-split draft", ["securite:securite", "droit:juridique"]);
    await ctx.close();
  } finally {
    if (ids.length) await db.from("quiz_sessions").delete().in("id", ids);
    await browser.close();
  }

  console.log(`OLD-TOKEN REPLAY on ${BASE}: ${CASES.length} resumed sessions, 1 pre-split draft`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  console.log(`${pass} checks pass, ${fails.length} fail`);
  if (fails.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
