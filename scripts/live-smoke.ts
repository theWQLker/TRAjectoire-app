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
import { ADS_LISTED } from "@/lib/ui";

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

  // #3 directions first (approved P5 mockup, 2026-11-22; the strength-tier
  // buckets this used to check are no longer on the page): the counted
  // directions heading or the 0-direction fallback, and the rest counted, never
  // silent. React splits text nodes with <!-- --> markers: strip them first.
  const text = textOnlyFull(html);
  const heading = /(\d+) directions? pour vous/.exec(text);
  const fallback = text.includes("ne dessinent pas encore une direction nette");
  check("#3 directions first: counted heading or the 0-direction fallback", Boolean(heading) || fallback,
    heading ? `"${heading[0]}"` : fallback ? "fallback line" : "neither found");
  const others = /Autres pistes à explorer\s*\(\s*(\d+)\s*\)/.exec(text);
  check("#3b the roles outside directions are counted", Boolean(others),
    others ? `"Autres pistes à explorer (${others[1]})"` : "Autres pistes count not found");
  const res = await fetch(`${BASE}/results/pistes/bridge?session=${techSession}`, { redirect: "manual" });
  const loc = res.headers.get("location") ?? "";
  check("#3c an old bucket link redirects to /results with the session",
    (res.status === 307 || res.status === 308) && new URL(loc, BASE).pathname === "/results" && loc.includes(techSession),
    `status ${res.status} → ${loc}`);

  // #2 ads. While the cached ads are stale (ui.ADS_LISTED false, decision
  // 2026-11-21) the page lists no individual ad: each direction carries its
  // dated count and a live France Travail search for that job in the user's
  // zone, and the old receipts route redirects. With ads listed again, the
  // receipts page must make NO freshness claim (offers are refreshed by hand).
  if (!ADS_LISTED) {
    const receiptLinks = html.match(/href="\/results\/offers\//g)?.length ?? 0;
    check("#2 no individual ad list linked while ads are stale", receiptLinks === 0, `${receiptLinks} receipt link(s)`);
    const code = shownCodes.find((c) => /^M18\d\d$/.test(c)) ?? shownCodes[0];
    const search = html.includes(
      `href="https://candidat.francetravail.fr/offres/recherche?motsCles=${code}&amp;offresPartenaires=true&amp;lieux=75D"`,
    );
    check("#2b live France Travail search for the shown job in Paris (75)", Boolean(code) && search, code ? `${code}` : "no card");
    const r = code ? await fetchHtml(`/results/offers/${code}?session=${techSession}`) : { status: 0, html: "" };
    check("#2c old receipts route redirects to the direction", r.status === 307 || r.status === 308, `status ${r.status}`);
  } else {
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
