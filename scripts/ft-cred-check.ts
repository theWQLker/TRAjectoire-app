/**
 * FT credential check — proves FT_CLIENT_ID / FT_CLIENT_SECRET work AFTER a
 * rotation. Does one OAuth2 token grant + one offers fetch slice (1 ROME, dept
 * 75, 20 rows) via LiveOfferSource.fetchSlice. This is the ONLY path that
 * exercises the France Travail API (the results page reads the cache, not the
 * API), so it's the real post-rotation confirmation.
 *
 * READ-ONLY against the FT API: fetchSlice does NOT write offers_cache or
 * fixtures (that's ingest(), which we do NOT call). Prints NO secret values —
 * only whether the grant + fetch succeeded and the header total count.
 *
 * Run (after rotating + updating .env.local):
 *   OFFER_SOURCE=live npx tsx scripts/ft-cred-check.ts
 */
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}
import { LiveOfferSource } from "../src/lib/offers/live-offer-source";

const ROME = process.env.FT_CHECK_ROME ?? "M1810"; // "Production / support SI", dept-75
const DEPT = "75";

function present(name: string): boolean {
  const v = process.env[name];
  return typeof v === "string" && v.length > 0;
}

async function main() {
  console.log("FT credential check — no secret values are printed.\n");
  const haveId = present("FT_CLIENT_ID");
  const haveSecret = present("FT_CLIENT_SECRET");
  console.log(`  FT_CLIENT_ID present:     ${haveId ? "yes" : "NO — set it in .env.local"}`);
  console.log(`  FT_CLIENT_SECRET present: ${haveSecret ? "yes" : "NO — set it in .env.local"}`);
  if (!haveId || !haveSecret) {
    console.log("\nFAIL — credentials missing.");
    process.exit(1);
  }

  console.log(`\n  Requesting OAuth token + one fetch slice (${ROME}, dept ${DEPT})…`);
  try {
    const source = new LiveOfferSource();
    // fetchSlice performs: OAuth2 client-credentials grant, then the offers GET.
    const { offers, totalAvailable } = await source.fetchSlice(ROME, DEPT, "0-19");
    console.log(`  ✓ OAuth grant + offers fetch SUCCEEDED`);
    console.log(`  ✓ ${offers.length} offer(s) returned, ${totalAvailable} available (Content-Range total)`);
    console.log("\nPASS — the France Travail credentials are valid and the live API responds.");
    process.exit(0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // The error text may include the HTTP status/body from FT — surface it (it
    // does NOT contain our client_secret; that's only sent in the request body).
    console.log(`  ✗ FAILED: ${msg}`);
    console.log("\nFAIL — token grant or fetch rejected. If 400/401 invalid_client,");
    console.log("       the new client_id/secret aren't right in .env.local yet.");
    process.exit(1);
  }
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
