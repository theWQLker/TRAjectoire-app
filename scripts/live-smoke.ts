/**
 * LIVE smoke test against a running site (default: the local build on :3100).
 * Creates two real Supabase
 * sessions (tech seed; tech seed + multi-dept), then fetches the deployed
 * /results pages and asserts the four post-deploy checks on the RENDERED HTML —
 * the exact production code path on live data. Read-only except the two session
 * rows it inserts (throwaway). Cleans them up at the end.
 *
 * Usage: npx tsx scripts/live-smoke.ts                          (local build)
 *        BASE=https://trajectoire-ui.vercel.app npx tsx scripts/live-smoke.ts --allow-production
 * Any non-local BASE is refused without --allow-production (target-guard.ts).
 */
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

import { getSupabaseServiceClient } from "@/lib/supabase";
import { buildInventory } from "@/lib/quiz/build-inventory";
import { SEED_ANSWER_KEY } from "@/lib/quiz/build-inventory";
import { resolveTarget } from "./target-guard";

const BASE = resolveTarget(process.env.BASE);

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
  // (D1408 Téléconseil / M1607 Secrétariat) TOPPING a tech seed. Since P0-A the
  // first HTML holds only the strongest directions; the broad tail lives on
  // /results/pistes and is not in this page. So the check reads the direction
  // cards actually rendered (their detail links): tech must be among them, and
  // no admin code may be. (The old split at "Autres passerelles à explorer" went
  // vacuous once that label also appears in the tier-count line.)
  const firstView = [...html.matchAll(/href="\/results\/direction\/([A-Z]\d{4})/g)].map((m) => m[1]);
  const shownCodes = [...new Set(firstView)];
  const hasTechCode = shownCodes.some((c) => /^M18\d\d$/.test(c));
  const adminShown = shownCodes.filter((c) => c === "D1408" || c === "M1607");
  check("#1 tech (M18xx) among the first-view directions", hasTechCode,
    `${shownCodes.length} cards: ${shownCodes.join(" ") || "none"}`);
  check("#1b no admin code (D1408/M1607) in the first view", shownCodes.length > 0 && adminShown.length === 0,
    adminShown.length ? `admin code in first view: ${adminShown.join(", ")} — possible fixture fallback` : "admin codes absent from the first view");

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

  // #2 receipts make NO freshness claim (removed: offers are a supporting signal,
  // refreshed by hand, so a "checked on" date would go stale).
  // Find a direction with offers → its receipts page. Pull the first M18xx or any
  // ROME code linked to /results/offers/.
  const offerLink = /\/results\/offers\/([A-Z0-9]+)/.exec(html);
  if (offerLink) {
    const r = await fetchHtml(`/results/offers/${offerLink[1]}?session=${techSession}`);
    const claim = /instantané du\s+\d|vérifiée le/i.exec(r.html);
    check("#2 receipt makes no freshness claim", r.status === 200 && !claim,
      claim ? `found "${claim[0]}"` : `status ${r.status}`);
  } else {
    check("#2 receipt reachable (a direction with offers)", false,
      "no /results/offers/ link on the page — tech seed had no offer-backed direction to open");
  }

  // ── Session B: tech seed + multi-dept (75 + 93) for the coverage disclosure ─
  const multiSession = await makeSession({ [SEED_ANSWER_KEY]: "tech:code", c_departement: "75,93" });
  console.log(`\nmulti-dept session: ${multiSession}`);
  const b = await fetchHtml(`/results?session=${multiSession}`);
  // P0-C: the page names the zone it has no offers for AND states what the
  // offer figures do cover, with their collection date.
  const APOS = "(?:'|&#x27;|&apos;|’)";
  const namesGap = new RegExp(`pas encore d${APOS}annonces pour Seine-Saint-Denis \\(93\\)`).test(b.html);
  const statesScope = /Annonces France Travail : Paris \(75\), relevées (?:le|entre le) \d{1,2} \S+ \d{4}/.test(b.html);
  // Only meaningful if the selection actually carried >1 dept through.
  check("#4 multi-dept: names the uncovered zone and states the dated scope", namesGap && statesScope,
    namesGap && statesScope
      ? "93 gap named · scope line dated"
      : `${namesGap ? "" : "93 gap line absent (selection may not have carried 93 through) "}${statesScope ? "" : "dated scope line absent"}`);

  // cleanup throwaway sessions
  const db = getSupabaseServiceClient();
  await db.from("quiz_sessions").delete().in("id", [techSession, multiSession]);
  console.log("\n(cleaned up throwaway sessions)");

  console.log(`\n${fail === 0 ? "ALL LIVE CHECKS PASS" : `LIVE SMOKE FAILED — ${fail} failing, ${pass} passing`}`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
