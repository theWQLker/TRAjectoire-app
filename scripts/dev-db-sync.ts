/**
 * DEV DATABASE SYNC — copy the ROME graph, the quiz cluster mirror and the
 * offer cache from a source project (production) into the local dev database,
 * then prove the copy: same schema, same row count, same content fingerprint.
 *
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/dev-db-sync.ts --from=<prod.env> [--check]
 *
 *   --from=<file>  env file holding the SOURCE project's NEXT_PUBLIC_SUPABASE_URL
 *                  and SUPABASE_SERVICE_ROLE_KEY. Keep it outside the repo; it is
 *                  read by this script only, never loaded into the process env.
 *   --check        compare only (schema + every table's fingerprint), write nothing.
 *
 * Target = the process env (.env.local), and it must be a local stack
 * (127.0.0.1 / localhost) or the script refuses to run.
 *
 * Safety:
 *   - the source is read with GET only: srcGet() is the one function that talks
 *     to it, and it can't send anything else.
 *   - user data is never copied: quiz_sessions, session_evidence,
 *     recommendations and feedback stay where they are. Dev sessions are dev's own.
 *
 * Identity columns (rome_appellations.id, offers_cache.pk_id) are regenerated in
 * dev and left out of the fingerprint; nothing reads them.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

type Table = { name: string; order: string; identity?: string[] };

// FK order: parents first. Wipe runs in reverse.
const TABLES: Table[] = [
  { name: "rome_jobs", order: "rome_code" },
  { name: "rome_competences", order: "code" },
  { name: "rome_job_competences", order: "rome_code,competence_code" },
  { name: "rome_mobilites", order: "from_rome_code,to_rome_code" },
  { name: "rome_riasec", order: "rome_code,riasec_code,rank" },
  { name: "rome_appellations", order: "id", identity: ["id"] },
  { name: "clusters", order: "id" },
  { name: "cluster_competences", order: "cluster_id,competence_code" },
  { name: "ingest_runs", order: "id" },
  { name: "offers_cache", order: "pk_id", identity: ["pk_id"] },
  { name: "offer_counts", order: "rome_code,departement,snapshot_at" },
];

/** Tables that exist in both but are never copied (user data). Schema-checked only. */
const SCHEMA_ONLY = ["quiz_sessions", "session_evidence", "recommendations", "feedback"];

const PAGE = 1000;
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const fromFile = args.find((a) => a.startsWith("--from="))?.slice("--from=".length);

type Conn = { url: string; key: string };

function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

function isLocal(url: string): boolean {
  const h = new URL(url).hostname;
  return h === "127.0.0.1" || h === "localhost" || h === "::1";
}

function headers(c: Conn): Record<string, string> {
  return { apikey: c.key, Authorization: `Bearer ${c.key}` };
}

/** The ONLY function that talks to the source. GET, nothing else. */
async function srcGet(src: Conn, path: string): Promise<unknown> {
  const r = await fetch(`${src.url}/rest/v1/${path}`, { method: "GET", headers: headers(src) });
  if (!r.ok) throw new Error(`source GET ${path.split("?")[0]}: HTTP ${r.status} ${await r.text()}`);
  return r.json();
}

async function dstReq(dst: Conn, method: string, path: string, body?: unknown): Promise<unknown> {
  if (!isLocal(dst.url)) throw new Error("target is not local"); // belt and braces
  const r = await fetch(`${dst.url}/rest/v1/${path}`, {
    method,
    headers: { ...headers(dst), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`target ${method} ${path.split("?")[0]}: HTTP ${r.status} ${await r.text()}`);
  return method === "GET" ? r.json() : null;
}

type Spec = Record<string, Record<string, string>>; // table -> column -> format

/** Newer PostgREST names integer formats int32/int64; older ones use the Postgres names. */
const FORMAT_ALIAS: Record<string, string> = { int32: "integer", int64: "bigint", int16: "smallint" };

function specOf(openapi: unknown): Spec {
  const defs = (openapi as { definitions?: Record<string, { properties?: Record<string, { format?: string }> }> })
    .definitions ?? {};
  const out: Spec = {};
  for (const [t, d] of Object.entries(defs)) {
    out[t] = {};
    for (const [c, p] of Object.entries(d.properties ?? {})) out[t][c] = FORMAT_ALIAS[p.format ?? ""] ?? p.format ?? "?";
  }
  return out;
}

async function readAll(get: (path: string) => Promise<unknown>, t: Table, cols: string[]): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = (await get(`${t.name}?select=${cols.join(",")}&order=${t.order}&limit=${PAGE}&offset=${offset}`)) as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])]));
  }
  return v;
}

function fingerprint(rows: Record<string, unknown>[], cols: string[]): string {
  const lines = rows.map((r) => JSON.stringify(cols.map((c) => canon(r[c])))).sort();
  return createHash("sha256").update(lines.join("\n")).digest("hex").slice(0, 16);
}

async function main() {
  if (!fromFile) throw new Error("--from=<env file with the source project's URL and service-role key> is required");
  const srcEnv = parseEnvFile(fromFile);
  const src: Conn = { url: srcEnv.NEXT_PUBLIC_SUPABASE_URL ?? "", key: srcEnv.SUPABASE_SERVICE_ROLE_KEY ?? "" };
  const dst: Conn = { url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "" };
  if (!src.url || !src.key) throw new Error(`${fromFile}: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing`);
  if (!dst.url || !dst.key) throw new Error("target env missing (run with --env-file=.env.local)");
  if (!isLocal(dst.url)) {
    throw new Error(`Refusing: the target (${new URL(dst.url).host}) is not a local stack. This script only writes to the dev database.`);
  }
  if (new URL(src.url).host === new URL(dst.url).host) throw new Error("source and target are the same project");

  console.log(`source  ${new URL(src.url).host.replace(/^(\w{4})\w+/, "$1…")} (read-only)`);
  console.log(`target  ${new URL(dst.url).host} (dev)${checkOnly ? "  [--check: no writes]" : ""}\n`);

  // --- schema: every source table/column must exist in dev with the same type
  const srcSpec = specOf(await srcGet(src, ""));
  const dstSpec = specOf(await dstReq(dst, "GET", ""));
  const problems: string[] = [];
  const extras: string[] = [];
  for (const [t, cols] of Object.entries(srcSpec)) {
    if (!dstSpec[t]) { problems.push(`table ${t} missing in dev`); continue; }
    for (const [c, f] of Object.entries(cols)) {
      if (!(c in dstSpec[t])) problems.push(`${t}.${c} missing in dev`);
      else if (dstSpec[t][c] !== f) problems.push(`${t}.${c}: ${f} in source, ${dstSpec[t][c]} in dev`);
    }
    for (const c of Object.keys(dstSpec[t])) if (!(c in cols)) extras.push(`${t}.${c}`);
  }
  for (const t of Object.keys(dstSpec)) if (!srcSpec[t]) extras.push(`table ${t}`);
  console.log(`schema: ${Object.keys(srcSpec).length} source tables/views, ${problems.length} mismatches`);
  for (const p of problems) console.log(`  MISMATCH ${p}`);
  if (extras.length) console.log(`  dev-only (migrations in this tree the source hasn't applied): ${extras.join(", ")}`);
  if (problems.length) throw new Error("schema mismatch: dev does not have the source schema; fix migrations before syncing");
  for (const t of SCHEMA_ONLY) if (!srcSpec[t]) throw new Error(`source has no ${t}`);

  // --- data
  if (!checkOnly) {
    for (const t of [...TABLES].reverse()) {
      const first = t.order.split(",")[0];
      await dstReq(dst, "DELETE", `${t.name}?${first}=not.is.null`);
    }
  }

  let bad = 0;
  console.log(`\n${"table".padEnd(22)} ${"source".padStart(7)} ${"dev".padStart(7)}  fingerprint`);
  for (const t of TABLES) {
    const cols = Object.keys(srcSpec[t.name]).filter((c) => !(t.identity ?? []).includes(c));
    const t0 = Date.now();
    const rows = await readAll((p) => srcGet(src, p), t, cols);
    const fpSrc = fingerprint(rows, cols);
    if (!checkOnly) {
      for (let i = 0; i < rows.length; i += PAGE) await dstReq(dst, "POST", t.name, rows.slice(i, i + PAGE));
    }
    const back = await readAll((p) => dstReq(dst, "GET", p), t, cols);
    const fpDst = fingerprint(back, cols);
    const ok = back.length === rows.length && fpDst === fpSrc;
    if (!ok) bad++;
    console.log(
      `${t.name.padEnd(22)} ${String(rows.length).padStart(7)} ${String(back.length).padStart(7)}  ${fpSrc} ${ok ? "==" : "!="} ${fpDst}  ${ok ? "ok" : "DIFFERENT"}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
    );
  }
  console.log(bad ? `\n${bad} table(s) differ.` : `\nall ${TABLES.length} tables identical (user-data tables not copied: ${SCHEMA_ONLY.join(", ")}).`);
  if (bad) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
