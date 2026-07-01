/**
 * P5.C tuning harness — weighted scoring on the full four-leap live graph.
 *
 * Runs GraphDirectionProposer on a FIXED inventory (with clusterScores +
 * ranked RIASEC) against ROME_SOURCE=live, and prints the ranked candidates so
 * the before/after of weighted scoring + threshold changes is reviewable.
 *
 * Deterministic, no LLM. Read-only against the DB (proposer only reads).
 *
 * Usage (live graph):
 *   ROME_SOURCE=live node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
 *     scripts/tune-ranking.ts
 */
import { getRomeSource } from "../src/lib/rome";
import { GraphDirectionProposer } from "../src/lib/engine/graph-direction-proposer";
import {
  DIRECT_COVERAGE_THRESHOLD,
} from "../src/lib/engine/graph-direction-proposer";
import { COVERAGE_TIERS, coverageStrength } from "../src/lib/engine/coverage";
import type { Inventory } from "../src/lib/engine/inventory";

// Fixed test inventory: a paie-leaning + relation_client profile (matches the
// established P2 demo), now WITH clusterScores so the lean signal is exercised.
// paie strongly led, relation_client a lighter lean — so paie-cluster directions
// should rank above relation_client ones when coverage/leap tie.
const INVENTORY: Inventory = {
  competenceCodes: ["300306", "100343", "124607", "300361"],
  riasec: ["E", "C", "S"],
  clusterScores: { paie: 3, relation_client: 1 },
  riasecScores: { C: 3, E: 2, S: 1 },
  constraints: { departement: "75", departements: ["75"] },
};

const LABELS: Record<string, string> = {
  "300306": "Gérer la paie",
  "100343": "Législation sociale",
  "124607": "Réaliser des déclarations réglementaires",
  "300361": "Accueillir, orienter, renseigner un public",
};

async function main() {
  console.log("=".repeat(78));
  console.log(`P5.C ranking — ROME_SOURCE=${process.env.ROME_SOURCE ?? "fixture"}`);
  console.log(
    `thresholds: DIRECT_COVERAGE=${DIRECT_COVERAGE_THRESHOLD} · ` +
      `tiers STRONG=${COVERAGE_TIERS.STRONG} PARTIAL=${COVERAGE_TIERS.PARTIAL}`,
  );
  console.log(
    "inventory:",
    INVENTORY.competenceCodes.map((c) => LABELS[c] ?? c).join(", "),
    "| clusterScores",
    JSON.stringify(INVENTORY.clusterScores),
    "| riasec",
    INVENTORY.riasec.join("/"),
  );
  console.log("=".repeat(78));

  const rome = getRomeSource();
  const proposed = await new GraphDirectionProposer(rome).propose(INVENTORY);

  console.log(`\n${proposed.length} directions surfaced. Ranked order:\n`);
  console.log(
    "  #  ROME    leap         cov   tier         lean   int   title",
  );
  proposed.slice(0, 30).forEach((d, i) => {
    const tier = coverageStrength(d.coverage).padEnd(11);
    const lean = d.leanScore.toFixed(1).padStart(4);
    const int = d.interestScore.toFixed(1).padStart(4);
    console.log(
      `  ${String(i + 1).padStart(2)} ${d.romeCode.padEnd(7)} ${d.primaryLeap.padEnd(12)} ` +
        `${(d.coverage * 100).toFixed(0).padStart(3)}%  ${tier} ${lean}  ${int}  ${d.title.slice(0, 34)}`,
    );
  });

  // Honesty-layer sanity: counts by leap + how many are exploratory.
  const byLeap: Record<string, number> = {};
  let exploratory = 0;
  for (const d of proposed) {
    byLeap[d.primaryLeap] = (byLeap[d.primaryLeap] ?? 0) + 1;
    if (coverageStrength(d.coverage) === "exploratory") exploratory++;
  }
  console.log(`\nby primary leap: ${JSON.stringify(byLeap)}`);
  console.log(`exploratory (cov < ${COVERAGE_TIERS.PARTIAL}): ${exploratory}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
