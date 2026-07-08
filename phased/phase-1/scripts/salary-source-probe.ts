/**
 * SALARY SOURCE PROBE (SUB-TASK 1 preflight).
 *
 * Confirms — against the LIVE France Travail APIs, with our real creds — which
 * salary endpoint is reachable and WHAT it returns (field, key granularity: FAP
 * vs métier vs ROME, unit). Report only; ingests nothing. Run this the moment the
 * FT app is subscribed to the salary APIs; pick the ingestion source from its
 * real output.
 *
 * Two candidate APIs (user is subscribing to both):
 *   - "API Marché du travail"          → salaire proposé (offer aggregate)
 *   - "API Statistiques marché travail" → INSEE DSN median per FAP (task-faithful)
 *
 * Scope/endpoint strings are the documented candidates; the probe reports which
 * scope is GRANTED and what each endpoint returns, so we don't guess blind.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/salary-source-probe.ts
 */
const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const CLIENT_ID = process.env.FT_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.FT_CLIENT_SECRET ?? "";

// Candidate (scope, label) pairs. Extend once the portal shows the exact scope.
const SCOPES: { scope: string; label: string }[] = [
  { scope: "api_marche-du-travailv1 pemt", label: "Marché du travail (salaire proposé)" },
  { scope: "api_marche-du-travailv1", label: "Marché du travail (no extra)" },
  { scope: "api_stats-sur-le-marche-du-travailv1 pemt", label: "Statistiques MT (INSEE median)" },
  { scope: "api_statistiques-marche-travailv1 pemt", label: "Statistiques MT (alt)" },
  { scope: "api_offresdemploiv2 o2dsoffre", label: "CONTROL (offers — known good)" },
];

// Candidate salary endpoints per API. GET-probed with any granted stats token.
// Reported verbatim so we see the real shape (field names, key, unit).
const ENDPOINTS: string[] = [
  "https://api.francetravail.io/partenaire/marche-du-travail/v1/salaires",
  "https://api.francetravail.io/partenaire/stats-sur-le-marche-du-travail/v1/salaires",
  "https://api.francetravail.io/partenaire/statistiques/v1/salaires",
];

async function getToken(scope: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope,
    }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false as const, detail: `${res.status} ${text.slice(0, 160)}` };
  const j = JSON.parse(text) as { access_token: string; expires_in: number };
  return { ok: true as const, token: j.access_token, detail: `granted (${j.expires_in}s)` };
}

async function probe(token: string, url: string) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const text = await res.text();
    return `${res.status} ${res.statusText} — ${text.slice(0, 400)}`;
  } catch (e) {
    return `network error: ${(e as Error).message}`;
  }
}

async function main() {
  console.log("=== SALARY SOURCE PROBE (live FT) ===");
  console.log(`creds present: id=${Boolean(CLIENT_ID)} secret=${Boolean(CLIENT_SECRET)}\n`);
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log("Missing FT creds — run with node --env-file=.env.local");
    process.exit(1);
  }

  const grantedStatsTokens: string[] = [];
  for (const { scope, label } of SCOPES) {
    const r = await getToken(scope);
    console.log(`SCOPE ${label}`);
    console.log(`  "${scope}"`);
    console.log(`  → ${r.ok ? "GRANTED" : "DENIED"}: ${r.detail}\n`);
    if (r.ok && !scope.startsWith("api_offresdemploi")) grantedStatsTokens.push(r.token);
  }

  if (grantedStatsTokens.length === 0) {
    console.log("No salary-API scope granted yet.");
    console.log("→ Subscribe the app to the salary API(s) on francetravail.io, then re-run.");
    console.log("→ If a scope IS subscribed but still denied, the exact scope string differs;");
    console.log("   copy it from the portal's API page and add it to SCOPES above.");
    return;
  }

  console.log("--- endpoint probes (first granted salary token) ---");
  const token = grantedStatsTokens[0];
  for (const url of ENDPOINTS) {
    console.log(`GET ${url}`);
    console.log(`  → ${await probe(token, url)}\n`);
  }
  console.log("Read the JSON above: confirm the salary FIELD, the KEY (fapCode vs");
  console.log("romeCode vs metier), and the UNIT (gross monthly €). That decides the join.");
}

main().catch((e) => { console.error(e); process.exit(1); });
