/**
 * /results timing on an emulated phone (375x812, touch, mobile UA, no network
 * throttling): TTFB and the moment the first direction card is in the DOM.
 *
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/results-mobile-timing.ts [--runs 5] [--allow-production]
 *   BASE=https://trajectoire-ui.vercel.app ... --allow-production
 *
 * Run order: 1 "first" request (a new session; cold if the server has been
 * idle or just started), then N warm requests each on a NEW session (engine
 * runs), then N repeats of one session (per-session result reused).
 * Sessions are created with the service role and deleted at the end.
 * Uses playwright-core from the proof tool (PLAYWRIGHT_CORE overrides the path).
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { buildInventory, SEED_ANSWER_KEY } from "../src/lib/quiz/build-inventory";
import { resolveTarget } from "./target-guard";

const BASE = resolveTarget(process.env.BASE);
const RUNS = Number(process.argv[process.argv.indexOf("--runs") + 1]) || 5;
const PW = process.env.PLAYWRIGHT_CORE ?? "file:///D:/Dev/tools/shots/node_modules/playwright-core/index.mjs";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const created: string[] = [];
async function makeSession(): Promise<string> {
  const answers = { [SEED_ANSWER_KEY]: "tech:code", c_departement: "75" };
  const inventory = buildInventory(answers);
  const { data, error } = await getSupabaseServiceClient()
    .from("quiz_sessions")
    .insert({ answers, inventory, constraints: inventory.constraints, financial_inputs: {} })
    .select("id")
    .single();
  if (error) throw error;
  created.push(data.id);
  return data.id as string;
}

type Sample = { ttfb: number; firstCard: number | null; vercelId: string | null };

async function main() {
  const { chromium } = await import(PW);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  const measure = async (sessionId: string): Promise<Sample> => {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const page = await ctx.newPage();
    // Record when the first direction card enters the DOM (streamed in after the shell).
    // A string, not a function: tsx wraps named inner functions in a __name()
    // helper that does not exist in the page.
    await page.addInitScript(`
      new MutationObserver(function (_, obs) {
        if (window.__firstCard === undefined && document.querySelector("main details")) {
          window.__firstCard = performance.now();
          obs.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    `);
    const res = await page.goto(`${BASE}/results?session=${sessionId}`, { waitUntil: "commit", timeout: 120_000 });
    await page.waitForSelector("main details", { timeout: 120_000 }).catch(() => {});
    const t = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return { ttfb: nav.responseStart, firstCard: (window as unknown as { __firstCard?: number }).__firstCard ?? null };
    });
    const vercelId = (await res?.allHeaders())?.["x-vercel-id"] ?? null;
    await ctx.close();
    return { ttfb: Math.round(t.ttfb), firstCard: t.firstCard === null ? null : Math.round(t.firstCard), vercelId };
  };

  const fmt = (s: Sample) => `TTFB ${s.ttfb} ms, first card ${s.firstCard ?? "none"} ms${s.vercelId ? `  [${s.vercelId}]` : ""}`;
  const median = (xs: number[]) => {
    const a = [...xs].sort((x, y) => x - y);
    return a.length ? a[Math.floor(a.length / 2)] : NaN;
  };
  const summary = (label: string, xs: Sample[]) => {
    const cards = xs.map((s) => s.firstCard).filter((x): x is number => x !== null);
    console.log(
      `${label}: median TTFB ${median(xs.map((s) => s.ttfb))} ms (${Math.min(...xs.map((s) => s.ttfb))}-${Math.max(...xs.map((s) => s.ttfb))}), ` +
        `median first card ${median(cards)} ms (${Math.min(...cards)}-${Math.max(...cards)})`,
    );
  };

  console.log(`target ${BASE}, emulated 375x812 phone, no throttling`);
  const first = await measure(await makeSession());
  console.log(`first request (new session): ${fmt(first)}`);

  const warmNew: Sample[] = [];
  for (let i = 0; i < RUNS; i++) {
    const s = await measure(await makeSession());
    warmNew.push(s);
    console.log(`  warm, new session ${i + 1}: ${fmt(s)}`);
  }
  const repeatId = await makeSession();
  await measure(repeatId); // prime this session
  const warmRepeat: Sample[] = [];
  for (let i = 0; i < RUNS; i++) {
    const s = await measure(repeatId);
    warmRepeat.push(s);
    console.log(`  warm, same session ${i + 1}: ${fmt(s)}`);
  }
  summary("warm, new session", warmNew);
  summary("warm, same session", warmRepeat);

  await browser.close();
  await getSupabaseServiceClient().from("quiz_sessions").delete().in("id", created);
  console.log(`(deleted ${created.length} sessions)`);
}

main().catch(async (e) => {
  console.error("FAILED:", e.message);
  if (created.length) await getSupabaseServiceClient().from("quiz_sessions").delete().in("id", created);
  process.exit(1);
});
