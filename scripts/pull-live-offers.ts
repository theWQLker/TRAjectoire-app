/**
 * Pull real France Travail offers into /fixtures/offers (PRD §3, build redirect).
 *
 * Thin: OAuth2 + one fetch slice per ROME in dept 75, throttled <4 req/s.
 * NO cron, NO Supabase cache. Maps to the Offer shape (§4) and REPLACES the
 * synthetic fixtures, grouped into the 3 sector files. Records per-ROME total
 * from the Content-Range header (PRD §3 marketDemand source).
 *
 * Requires FT_CLIENT_ID / FT_CLIENT_SECRET in .env.local.
 * Run: OFFER_SOURCE=live npx tsx scripts/pull-live-offers.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LiveOfferSource } from "../src/lib/offers/live-offer-source";
import type { Offer } from "../src/lib/offers/offer";

const DEPT = "75";
const SLICE = "0-19"; // ~20 offers/ROME → ~200 across 10 ROMEs

// 10 ROME codes across the three sectors + client-facing bridges (dept 75).
const ROME_TO_FILE: { rome: string; label: string; file: string }[] = [
  { rome: "M1203", label: "Comptabilité / gestion paie", file: "paie.json" },
  { rome: "M1501", label: "Assistanat RH", file: "paie.json" },
  { rome: "M1602", label: "Opérations administratives", file: "paie.json" },
  { rome: "M1607", label: "Secrétariat", file: "paie.json" },
  { rome: "M1810", label: "Production / support SI", file: "support-applicatif.json" },
  { rome: "M1801", label: "Administration SI", file: "support-applicatif.json" },
  { rome: "D1408", label: "Téléconseil / relation client", file: "support-applicatif.json" },
  { rome: "M1704", label: "Management relation clientèle", file: "support-applicatif.json" },
  { rome: "G1602", label: "Personnel de cuisine", file: "food-restauration.json" },
  { rome: "G1803", label: "Service en restauration", file: "food-restauration.json" },
];

// space requests to respect 4 req/s (PRD §3); we go slower to be safe
const REQUEST_GAP_MS = 350;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const source = new LiveOfferSource();
  const outDir = path.join(process.cwd(), "fixtures", "offers");
  mkdirSync(outDir, { recursive: true });

  const byFile = new Map<string, Offer[]>();
  const counts: { rome: string; pulled: number; total: number }[] = [];

  for (const { rome, label, file } of ROME_TO_FILE) {
    process.stdout.write(`Fetching ${rome} (${label}) dept ${DEPT}... `);
    const { offers, totalAvailable } = await source.fetchSlice(rome, DEPT, SLICE);
    // keep only dept-75 offers (defensive — API filters, but verify the mapped field)
    const dept75 = offers.filter((o) => o.lieuTravail.departement === DEPT);
    const arr = byFile.get(file) ?? [];
    arr.push(...dept75);
    byFile.set(file, arr);
    counts.push({ rome, pulled: dept75.length, total: totalAvailable });
    console.log(`got ${dept75.length} (of ${totalAvailable} available)`);
    await sleep(REQUEST_GAP_MS);
  }

  let grand = 0;
  for (const [file, offers] of byFile) {
    writeFileSync(
      path.join(outDir, file),
      JSON.stringify(offers, null, 2) + "\n",
      "utf8",
    );
    grand += offers.length;
    console.log(`wrote ${offers.length} offers → fixtures/offers/${file}`);
  }

  console.log(`\nPulled ${grand} real offers across ${ROME_TO_FILE.length} ROME codes (dept ${DEPT}).`);
  console.log("Per-ROME availability (Content-Range total):");
  for (const c of counts) {
    console.log(`  ${c.rome.padEnd(7)} pulled=${String(c.pulled).padStart(3)}  available=${c.total}`);
  }
}

main().catch((err) => {
  console.error("PULL FAILED:", err);
  process.exit(1);
});
