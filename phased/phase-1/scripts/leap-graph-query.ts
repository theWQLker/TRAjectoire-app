/**
 * Leap-graph traversal over fixtures (PRD build step 11.2 — the go/no-go GATE).
 *
 * "Given a hardcoded inventory, surface directions via direct + skill-bridge +
 *  mobilité + RIASEC, each tagged with why surfaced. Gate: confirm skill-bridge
 *  and mobilité actually surface non-obvious directions the user wouldn't have
 *  named. If only direct matches appear, stop and report."
 *
 * Deterministic, no LLM. Reads ROME only through the RomeSource seam (§3b/§6).
 * Run: ROME_SOURCE=fixture npx tsx scripts/leap-graph-query.ts
 */
import { getRomeSource } from "../src/lib/rome";
import { GraphDirectionProposer } from "../src/lib/engine/graph-direction-proposer";
import type { Inventory } from "../src/lib/engine/inventory";
import type { LeapType } from "../src/lib/engine/direction-proposer";

// Hardcoded inventory: paie skills + a client/usager skill + an Enterprising interest.
const INVENTORY: Inventory = {
  competenceCodes: [
    "300306", // Gérer la paie
    "100343", // Législation sociale
    "124607", // Réaliser des déclarations réglementaires
    "300361", // Accueillir, orienter, renseigner un public (client/usager)
  ],
  riasec: ["E"], // Enterprising
  clusterScores: { paie: 3, relation_client: 1 },
  riasecScores: { E: 2 },
  constraints: { departement: "75", departements: ["75"] },
};

const INVENTORY_LABELS: Record<string, string> = {
  "300306": "Gérer la paie",
  "100343": "Législation sociale",
  "124607": "Réaliser des déclarations réglementaires",
  "300361": "Accueillir, orienter, renseigner un public",
};

const LEAP_LABEL: Record<LeapType, string> = {
  direct: "DIRECT",
  skill_bridge: "SKILL-BRIDGE",
  mobilite: "MOBILITÉ",
  interest: "INTEREST(RIASEC)",
};

async function main() {
  const rome = getRomeSource();
  const proposer = new GraphDirectionProposer(rome);

  console.log("=".repeat(74));
  console.log("LEAP-GRAPH TRAVERSAL (PRD §6.2) — go/no-go gate");
  console.log("=".repeat(74));
  console.log("Inventory:");
  for (const c of INVENTORY.competenceCodes) {
    console.log(`  • ${c}  ${INVENTORY_LABELS[c] ?? ""}`);
  }
  console.log(`  • interest: ${INVENTORY.riasec.join("/")} (Enterprising)`);
  console.log(`  • département: ${INVENTORY.constraints.departement}`);
  console.log("");

  const directions = await proposer.propose(INVENTORY);

  // Group by primary leap, in precedence order.
  const order: LeapType[] = ["direct", "skill_bridge", "mobilite", "interest"];
  for (const leap of order) {
    const group = directions.filter((d) => d.primaryLeap === leap);
    if (group.length === 0) continue;
    console.log(`── ${LEAP_LABEL[leap]} (${group.length}) ${"─".repeat(40)}`);
    for (const d of group) {
      const cov = `${Math.round(d.coverage * 100)}%`;
      const allLeaps = d.leapTypes.map((l) => LEAP_LABEL[l]).join("+");
      console.log(`  ${d.romeCode}  ${d.title}`);
      console.log(`     domain: ${d.domain}`);
      console.log(`     coverage: ${cov} (${d.matchedCompetenceCodes.length}/${INVENTORY.competenceCodes.length})   surfaced by: ${allLeaps}`);
      console.log(`     why: ${d.why}`);
    }
    console.log("");
  }

  // --- GATE evaluation ----------------------------------------------------
  const nonObvious = directions.filter(
    (d) => d.primaryLeap === "skill_bridge" || d.primaryLeap === "mobilite",
  );
  const directHomeCodes = new Set(["M1203", "M1501"]); // the obvious paie homes
  const trulyUnexpected = nonObvious.filter((d) => !directHomeCodes.has(d.romeCode));

  console.log("=".repeat(74));
  console.log("GO / NO-GO SIGNAL (PRD build step 11.2 gate)");
  console.log("=".repeat(74));
  console.log(`Total directions surfaced : ${directions.length}`);
  console.log(`  direct                  : ${directions.filter((d) => d.primaryLeap === "direct").length}`);
  console.log(`  skill-bridge (primary)  : ${directions.filter((d) => d.primaryLeap === "skill_bridge").length}`);
  console.log(`  mobilité (primary)      : ${directions.filter((d) => d.primaryLeap === "mobilite").length}`);
  console.log(`  interest (primary)      : ${directions.filter((d) => d.primaryLeap === "interest").length}`);
  console.log("");
  console.log("Non-obvious directions (skill-bridge / mobilité primary), i.e. ones");
  console.log("the user with paie+client skills would NOT have named themselves:");
  for (const d of trulyUnexpected) {
    console.log(`  → ${d.romeCode} ${d.title}  [${LEAP_LABEL[d.primaryLeap]}]  — ${d.why}`);
  }
  console.log("");

  if (trulyUnexpected.length === 0) {
    console.log(">>> NO-GO: only direct matches surfaced. The leap mechanic is NOT working.");
    console.log(">>> Per PRD §11 step 2, stop and report.");
  } else {
    console.log(`>>> GO: ${trulyUnexpected.length} non-obvious direction(s) surfaced via skill-bridge / mobilité.`);
    console.log(">>> Skill-bridge + mobilité are surfacing directions the user would not have named.");
  }
}

main().catch((err) => {
  console.error("LEAP-GRAPH QUERY FAILED:", err);
  process.exit(1);
});
