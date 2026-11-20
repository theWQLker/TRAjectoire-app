/**
 * RESULTS LOAD TEST — N simultaneous users against a running server (P0-A).
 *
 * Creates N real quiz_sessions (spread across the seed families, a few with two
 * départements), then starts N virtual users at once. Each user loads
 * /results?session=…, opens its first direction, then the bridge list page.
 * Every response must be 200, a complete document, carry real direction cards
 * and no error page. Runs a cold wave (as started) then a warm wave, prints
 * per-step timings, and deletes the sessions it created.
 *
 * Usage (server must run with ROME_SOURCE=live OFFER_SOURCE=live):
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/results-load.ts [baseUrl=http://localhost:3100] [users=40]
 * A non-local baseUrl is refused without --allow-production (target-guard.ts).
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { buildInventory, SEED_ANSWER_KEY } from "../src/lib/quiz/build-inventory";
import { resolveTarget } from "./target-guard";

const ARGS = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const BASE = resolveTarget(ARGS[0]);
const USERS = Number(ARGS[1] ?? 40);

const SEEDS = [
  "tech:code", "tech:sysadmin", "tech:support", "tech:data", "sante:soin", "sante:medico",
  "sante:reeduc", "btp:gros", "btp:second", "btp:conduite", "maintenance:indus",
  "maintenance:vehicule", "commerce:vente", "commerce:caisse", "commerce:commercial",
  "industrie:production", "industrie:qualite", "hotellerie:cuisine", "hotellerie:salle",
  "admin:secretariat", "admin:compta", "admin:rh", "agriculture:culture", "artisanat:art",
  "banque:banque", "communication:comm", "services:social", "services:domicile",
  "transport:conduite", "transport:entrepot",
];

type Step = { name: string; ms: number; ok: boolean; why?: string; bytes: number };

async function get(path: string, mustHave: RegExp): Promise<Step & { body: string }> {
  const t = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`);
    const body = await res.text();
    const ms = performance.now() - t;
    const why =
      res.status !== 200 ? `status ${res.status}`
      : !/<\/html>\s*$/.test(body.trim()) && !body.includes("</html>") ? "incomplete document"
      : /Application error|Internal Server Error|NEXT_HTTP_ERROR|digest/.test(body) && !mustHave.test(body) ? "error page"
      : !mustHave.test(body) ? `missing ${mustHave}`
      : undefined;
    return { name: path.split("?")[0], ms, ok: !why, why, bytes: body.length, body };
  } catch (e) {
    return { name: path.split("?")[0], ms: performance.now() - t, ok: false, why: String(e), bytes: 0, body: "" };
  }
}

async function user(sessionId: string): Promise<Step[]> {
  const steps: Step[] = [];
  const r = await get(`/results?session=${sessionId}`, /<article/);
  steps.push({ ...r, name: "results" });
  const dir = /href="(\/results\/direction\/[A-Z0-9]+\?session=[^"]+)"/.exec(r.body)?.[1]?.replace(/&amp;/g, "&");
  if (dir) {
    const d = await get(dir, /Annonces utilisées pour ce signal|Aucune annonce/);
    steps.push({ ...d, name: "direction" });
  } else steps.push({ name: "direction", ms: 0, ok: false, why: "no direction link", bytes: 0 });
  const p = await get(`/results/pistes/bridge?session=${sessionId}&page=2`, /<article/);
  steps.push({ ...p, name: "pistes" });
  return steps;
}

function stats(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]);
  return `p50=${q(0.5)} p90=${q(0.9)} max=${q(1)} ms`;
}

async function wave(label: string, ids: string[]) {
  const t = performance.now();
  const all = await Promise.all(ids.map((id) => user(id)));
  const wall = Math.round(performance.now() - t);
  const flat = all.flat();
  const failed = flat.filter((s) => !s.ok);
  console.log(`\n${label}: ${ids.length} users, ${flat.length} requests, wall ${wall} ms, errors ${failed.length}`);
  for (const name of ["results", "direction", "pistes"]) {
    const xs = flat.filter((s) => s.name === name);
    const kb = Math.round(xs.reduce((a, s) => a + s.bytes, 0) / xs.length / 1024);
    console.log(`  ${name.padEnd(10)} ${stats(xs.map((s) => s.ms))}  avg ${kb} KB  ok ${xs.filter((s) => s.ok).length}/${xs.length}`);
  }
  for (const f of failed.slice(0, 5)) console.log(`  FAIL ${f.name}: ${f.why}`);
  return failed.length;
}

async function main() {
  const db = getSupabaseServiceClient();
  const rows = Array.from({ length: USERS }, (_, i) => {
    const answers: Record<string, string> = { [SEED_ANSWER_KEY]: SEEDS[i % SEEDS.length] };
    if (i % 10 === 9) answers.c_departement = "75,93";
    const inventory = buildInventory(answers);
    return { answers, inventory, constraints: inventory.constraints, financial_inputs: {} };
  });
  const { data, error } = await db.from("quiz_sessions").insert(rows).select("id");
  if (error) throw new Error(`session insert: ${error.message}`);
  const ids = (data ?? []).map((r) => r.id as string);
  console.log(`created ${ids.length} sessions against ${BASE}`);

  let errors = 0;
  try {
    errors += await wave("cold wave", ids);
    errors += await wave("warm wave", ids);
  } finally {
    const { error: delErr } = await db.from("quiz_sessions").delete().in("id", ids);
    console.log(delErr ? `cleanup FAILED: ${delErr.message}` : `\ndeleted ${ids.length} sessions`);
  }
  console.log(errors === 0 ? "LOAD OK — no errors" : `LOAD FAILED — ${errors} errors`);
  if (errors) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
