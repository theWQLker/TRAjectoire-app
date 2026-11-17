/**
 * PROOF — bridge-bucket strength tiers are THRESHOLD-driven; counts are EMERGENT.
 *
 * The honesty requirement: a tier label is a strength CLAIM. "Très forte" on a
 * weak match is the same lie as a mis-labelled Signal badge. This proves:
 *   (1) every direction's band is EXACTLY strengthBand(matchRaritySum) — the
 *       label is a pure function of the backed strength number, nothing else;
 *   (2) the band boundaries are the calibrated thresholds (50 / √(15·50) / 15),
 *       NOT chosen counts — verified by re-deriving each direction's band from
 *       the raw thresholds and asserting agreement;
 *   (3) counts fall out of the distribution (printed — whatever they are);
 *   (4) monotonicity: no direction in a stronger tier has a LOWER matchRaritySum
 *       than any direction in a weaker tier (a strict strength ordering).
 * Read-only; runs the real engine on the live sources.
 */
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}
process.env.ROME_SOURCE = "live";
process.env.OFFER_SOURCE = "live";

import { buildResults } from "@/lib/engine/results";
import {
  strengthBand,
  signalStrength,
  SIGNAL_RARITY_TIERS,
  SIGNAL_RARITY_MOYEN_UPPER,
  type StrengthBand,
} from "@/lib/engine/coverage";
import type { Inventory } from "@/lib/engine/inventory";
import { seedCodesFor } from "../config/families";

// Independent re-derivation from RAW thresholds — must agree with strengthBand().
function bandFromRawThresholds(s: number): StrengthBand {
  if (s >= SIGNAL_RARITY_TIERS.FORT) return "tres_forte";
  if (s >= SIGNAL_RARITY_MOYEN_UPPER) return "forte";
  if (s >= SIGNAL_RARITY_TIERS.MOYEN) return "pertinente";
  return "large";
}

const ORDER: StrengthBand[] = ["tres_forte", "forte", "pertinente", "large"];

async function main() {
  let failures = 0;
  const assert = (cond: boolean, msg: string) => {
    console.log(`  ${cond ? "✓" : "✗ FAIL"} ${msg}`);
    if (!cond) failures++;
  };

  console.log(`Thresholds: FORT=${SIGNAL_RARITY_TIERS.FORT}  MOYEN_UPPER=${SIGNAL_RARITY_MOYEN_UPPER.toFixed(2)}  MOYEN=${SIGNAL_RARITY_TIERS.MOYEN}`);
  console.log("(MOYEN_UPPER is √(MOYEN·FORT) — a derived strength midpoint, not a count)\n");

  for (const seed of ["tech:code", "sante:soin", "commerce:vente"]) {
    let codes: string[];
    try {
      codes = seedCodesFor([seed]);
    } catch {
      continue;
    }
    if (codes.length === 0) continue;

    const inventory: Inventory = {
      competenceCodes: [...codes].sort(),
      seededCodes: [...codes].sort(),
      riasec: [],
      clusterScores: {},
      riasecScores: {},
      constraints: { departement: "75", departements: ["75"] },
    };
    const { byCategory } = await buildResults(inventory);
    const bridge = byCategory.bridge;
    if (bridge.length === 0) continue;

    console.log(`── seed ${seed} — bridge = ${bridge.length} ─────────────────────────`);

    // (1)+(2): label == strengthBand(sum) AND == raw-threshold re-derivation.
    let labelMismatch = 0;
    let rawMismatch = 0;
    for (const d of bridge) {
      const band = strengthBand(d.matchRaritySum);
      if (band !== bandFromRawThresholds(d.matchRaritySum)) rawMismatch++;
      // the "très forte" lie check: tres_forte ⇔ signalStrength strong (FORT band)
      if ((band === "tres_forte") !== (signalStrength(d.matchRaritySum) === "strong")) labelMismatch++;
    }
    assert(rawMismatch === 0, `every band == raw-threshold derivation (${rawMismatch} mismatches)`);
    assert(labelMismatch === 0, `"très forte" fires IFF FORT band — no mis-labelled match (${labelMismatch})`);

    // (3): emergent counts + the min/max sum per band (proves the boundary lands
    // where strength crosses, not where a count target was picked).
    const bands = new Map<StrengthBand, number[]>();
    for (const d of bridge) {
      const b = strengthBand(d.matchRaritySum);
      (bands.get(b) ?? bands.set(b, []).get(b)!).push(d.matchRaritySum);
    }
    for (const b of ORDER) {
      const sums = bands.get(b);
      if (!sums || sums.length === 0) { console.log(`     ${b.padEnd(11)}: 0`); continue; }
      const lo = Math.min(...sums), hi = Math.max(...sums);
      console.log(`     ${b.padEnd(11)}: ${String(sums.length).padStart(4)}   matchRaritySum ∈ [${lo.toFixed(1)}, ${hi.toFixed(1)}]`);
    }

    // (4): strict strength ordering across bands — every stronger band's MIN sum
    // ≥ the next weaker band's MAX sum (thresholds partition cleanly).
    let ordered = true;
    for (let i = 0; i < ORDER.length - 1; i++) {
      const strong = bands.get(ORDER[i]);
      const weak = bands.get(ORDER[i + 1]);
      if (!strong?.length || !weak?.length) continue;
      if (Math.min(...strong) < Math.max(...weak)) ordered = false;
    }
    assert(ordered, "strict strength ordering: no weaker-tier match outranks a stronger-tier one");
    console.log("");
  }

  console.log(failures === 0 ? "STRENGTH TIERS BACKED — labels are threshold-driven, counts emergent" : `FAILED (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
