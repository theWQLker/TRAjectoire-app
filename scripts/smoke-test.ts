/**
 * Smoke test (PRD build step 11.1 stop condition):
 * "Stop after fixtures load + a smoke test prints offer counts per ROME."
 *
 * Reads ONLY through the OfferSource seam (PRD §3) — never the API, never fs
 * directly. Proves the fixtures load and the seam returns the §4 Offer shape.
 *
 * Run: OFFER_SOURCE=fixture npx tsx scripts/smoke-test.ts
 */
import { getOfferSource } from "../src/lib/offers";
import { FixtureOfferSource } from "../src/lib/offers/fixture-offer-source";

const IDF_DEPTS = ["75", "77", "78", "91", "92", "93", "94", "95"];

async function main() {
  const source = getOfferSource();
  console.log(`OFFER_SOURCE=${process.env.OFFER_SOURCE ?? "fixture"} → ${source.constructor.name}\n`);

  // Discover which ROME codes exist in the fixtures (fixture-only helper;
  // the live source would derive scope from the candidate ROME list instead).
  const all =
    source instanceof FixtureOfferSource
      ? await source.loadAllOffers()
      : [];
  const romeCodes = [...new Set(all.map((o) => o.romeCode))].sort();

  console.log(`Total offers loaded: ${all.length}`);
  console.log(`Distinct ROME codes: ${romeCodes.length} (${romeCodes.join(", ")})\n`);

  console.log("Offer counts per ROME (via OfferSource.fetchOffers):");
  let grandTotal = 0;
  for (const rome of romeCodes) {
    // Sum across all Île-de-France départements, going through the seam.
    const perDept = await Promise.all(
      IDF_DEPTS.map(async (dept) => ({
        dept,
        n: (await source.fetchOffers(rome, dept)).length,
      })),
    );
    const total = perDept.reduce((s, d) => s + d.n, 0);
    grandTotal += total;
    const breakdown = perDept
      .filter((d) => d.n > 0)
      .map((d) => `${d.dept}:${d.n}`)
      .join("  ");
    console.log(`  ${rome.padEnd(7)} total=${String(total).padStart(3)}   ${breakdown}`);
  }
  console.log(`\n  TOTAL via seam = ${grandTotal}`);

  // Assertions — fail loudly if the seam path is broken.
  if (grandTotal !== all.length) {
    throw new Error(
      `Seam mismatch: fetchOffers summed to ${grandTotal} but ${all.length} fixtures exist. ` +
        `A fixture has a département outside Île-de-France, or a filter bug.`,
    );
  }
  if (romeCodes.length < 6) {
    throw new Error(`Expected >=6 ROME codes across 3 sectors, got ${romeCodes.length}.`);
  }
  console.log("\nOK — fixtures load and OfferSource returns expected counts.");
}

main().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
