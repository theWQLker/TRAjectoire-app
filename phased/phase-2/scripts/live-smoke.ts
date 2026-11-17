/**
 * LIVE smoke test against the deployed production site. Creates two real Supabase
 * sessions (tech seed; tech seed + multi-dept), then fetches the deployed
 * /results pages and asserts the four post-deploy checks on the RENDERED HTML —
 * the exact production code path on live data. Read-only except the two session
 * rows it inserts (throwaway). Cleans them up at the end.
 *
 * Usage: BASE=https://trajectoire-ui.vercel.app npx tsx scripts/live-smoke.ts
 */
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

import { getSupabaseServiceClient } from "@/lib/supabase";
import { buildInventory } from "@/lib/quiz/build-inventory";
import { SEED_ANSWER_KEY } from "@/lib/quiz/build-inventory";

const BASE = (process.env.BASE ?? "https://trajectoire-ui.vercel.app").replace(/\/$/, "");

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`  ${ok ? "✓ PASS" : "✗ FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  ok ? pass++ : fail++;
};

async function makeSession(answers: Record<string, string>): Promise<string> {
  const inventory = buildInventory(answers);
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("quiz_sessions")
    .insert({ answers, inventory, constraints: inventory.constraints, financial_inputs: {} })
    .select("id")
    .single();
  if (error) throw new Error(`session insert: ${error.message}`);
  return data.id as string;
}

async function fetchHtml(path: string): Promise<{ status: number; html: string }> {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  const html = res.status < 400 ? await res.text() : "";
  return { status: res.status, html };
}

// Strip React's <!-- --> comment markers so text nodes read contiguously.
function textOnlyFull(html: string): string {
  return html.replace(/<!--.*?-->/g, "");
}

async function main() {
  console.log(`LIVE SMOKE — ${BASE}\n`);

  // ── Session A: tech seed (single dept 75, the default in buildInventory) ────
  const techSession = await makeSession({ [SEED_ANSWER_KEY]: "tech:code" });
  console.log(`tech-seed session: ${techSession}`);
  const a = await fetchHtml(`/results?session=${techSession}`);
  check("results page returns 200", a.status === 200, `status ${a.status}`);

  const html = a.html;

  // #1 tech surfaces at the TOP. The fixture-fallback signature is admin codes
  // (D1408 Téléconseil / M1607 Secrétariat) TOPPING a tech seed. On live data an
  // admin code may still surface (it shares a generic skill) but must sink to the
  // faible tail — the honesty layer demotes, never hides. So the real check is
  // POSITION, not presence: the STRONG tiers must be tech, and no admin code may
  // appear ABOVE the "Autres passerelles à explorer" tail expander. We split the
  // page at the tail summary and assert admin codes only appear after it.
  const hasTechCode = /\bM18\d\d\b/.test(html);
  const tailSplit = textOnlyFull(html).split("Autres passerelles à explorer");
  const aboveTail = tailSplit[0]; // everything the user sees before the collapsed tail
  const adminAboveTail = /\bD1408\b/.test(aboveTail) || /\bM1607\b/.test(aboveTail);
  check("#1 tech (M18xx) surfaces on a tech seed", hasTechCode,
    hasTechCode ? "M18xx present" : "no M18xx code found in HTML");
  check("#1b no admin code (D1408/M1607) above the faible tail", !adminAboveTail,
    adminAboveTail ? "admin code appears in a strong tier — possible fixture fallback" : "admin codes only in the collapsed tail (correctly demoted)");

  // #3 strength tiers render (the new labels) + honest tail count
  const tiers = ["Très forte correspondance", "Correspondance forte", "Correspondance pertinente"];
  const tiersFound = tiers.filter((t) => html.includes(t));
  check("#3 strength tiers render", tiersFound.length >= 2,
    `${tiersFound.length}/3 tier labels: ${tiersFound.join(", ") || "none"}`);
  // React injects <!-- --> comment markers between text nodes, so the label,
  // "(", count and ")" are split by them in the server HTML. Strip HTML comments
  // before matching so the assertion sees the rendered text, not the marker noise.
  const tail = /Autres passerelles à explorer\s*\(\s*(\d+)\s*\)/.exec(textOnlyFull(html));
  check("#3b honest tail with a count", Boolean(tail),
    tail ? `"Autres passerelles à explorer (${tail[1]})"` : "tail label/count not found");

  // #2 a receipt shows the REAL snapshot date, not render-time "today".
  // Find a direction with offers → its receipts page. Pull the first M18xx or any
  // ROME code linked to /results/offers/.
  const offerLink = /\/results\/offers\/([A-Z0-9]+)/.exec(html);
  if (offerLink) {
    const r = await fetchHtml(`/results/offers/${offerLink[1]}?session=${techSession}`);
    const hasSnapshot = /instantané du\s+\d/i.test(r.html);
    const hasRenderTimeClaim = /vérifiée le/i.test(r.html);
    const todayLeak = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    check("#2 receipt shows real snapshot date ('instantané du …')", hasSnapshot && !hasRenderTimeClaim,
      hasSnapshot ? "instantané present" : (hasRenderTimeClaim ? "still says 'vérifiée le'" : "no date label"));
    check("#2b snapshot is NOT today's render date", !r.html.includes(`instantané du ${todayLeak}`),
      `today=${todayLeak}`);
  } else {
    check("#2 receipt reachable (a direction with offers)", false,
      "no /results/offers/ link on the page — tech seed had no offer-backed direction to open");
  }

  // ── Session B: tech seed + multi-dept (75 + 93) for the coverage disclosure ─
  const multiSession = await makeSession({ [SEED_ANSWER_KEY]: "tech:code", c_departement: "75,93" });
  console.log(`\nmulti-dept session: ${multiSession}`);
  const b = await fetchHtml(`/results?session=${multiSession}`);
  const hasDisclosure = /Couverture annonces\s*:\s*dépt/i.test(b.html);
  // Only meaningful if the selection actually carried >1 dept through.
  check("#4 coverage disclosure line renders for multi-dept", hasDisclosure,
    hasDisclosure ? "disclosure present" : "line absent (selection may not have carried 93 through)");

  // cleanup throwaway sessions
  const db = getSupabaseServiceClient();
  await db.from("quiz_sessions").delete().in("id", [techSession, multiSession]);
  console.log("\n(cleaned up throwaway sessions)");

  console.log(`\n${fail === 0 ? "ALL LIVE CHECKS PASS" : `LIVE SMOKE FAILED — ${fail} failing, ${pass} passing`}`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
