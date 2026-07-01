/**
 * Intersection query over fixtures (PRD build step 11.2 — the go/no-go GATE).
 *
 * "Prove a 2-proof profile (paie + relation client) returns ranked intersection
 *  roles. Gate: if this is thin, stop and report before building UI."
 *
 * Deterministic, no AI. Reads only through the OfferSource seam (PRD §3).
 * Run: OFFER_SOURCE=fixture npx tsx scripts/intersection-query.ts
 */
import { getOfferSource } from "../src/lib/offers";
import { FixtureOfferSource } from "../src/lib/offers/fixture-offer-source";
import { rankRoles, type ProofProfile } from "../src/lib/engine/intersection";
import { getCluster } from "../config/clusters";

const PROFILE: ProofProfile = {
  clusterIds: ["paie", "relation_client"], // hardcoded 2-proof profile
  departement: "75",
};

async function main() {
  const source = getOfferSource();

  // Candidate ROME scope (MVP). Derived from the fixtures via the fixture-only
  // helper; the live source would take the configured candidate ROME list.
  const candidateRomeCodes =
    source instanceof FixtureOfferSource
      ? [...new Set((await source.loadAllOffers()).map((o) => o.romeCode))].sort()
      : [];

  const proofLabels = PROFILE.clusterIds
    .map((id) => `${id} (${getCluster(id).label})`)
    .join("  +  ");

  console.log("=".repeat(72));
  console.log("INTERSECTION QUERY (PRD §6.2-6.3) — go/no-go gate");
  console.log("=".repeat(72));
  console.log(`Proof profile : ${proofLabels}`);
  console.log(`Département    : ${PROFILE.departement}`);
  console.log(`Candidate ROME : ${candidateRomeCodes.join(", ")}`);
  console.log("");

  const ranked = await rankRoles(source, candidateRomeCodes, PROFILE);

  const intersectionRoles = ranked.filter((r) => r.isIntersection);

  console.log("RANKED ROLES (intersection roles first):");
  console.log("-".repeat(72));
  for (const r of ranked) {
    const tag = r.isIntersection ? "★ INTERSECTION" : "  single-cluster";
    console.log(
      `#${r.rank}  ${r.romeCode}   ${tag}   offers=${r.marketDemand}`,
    );
    console.log(
      `      clusters matched: ${r.matchedClusterIds
        .map((id) => getCluster(id).label)
        .join(", ")}`,
    );
    if (r.isIntersection) {
      console.log(
        `      why: offers want skills from ${r.matchedClusterIds.length} of your proofs; ` +
          `${r.offersWithMultiClusterOverlap}/${r.marketDemand} single ads want both`,
      );
    }
    // top requirements with the inverse (escape hatch), PRD §6.2/§7
    const top = r.requirementProfile.slice(0, 3);
    for (const req of top) {
      console.log(
        `        - ${req.listing}/${req.total} ask "${req.libelle}"  →  ${req.notListing}/${req.total} do NOT`,
      );
    }
  }

  console.log("");
  console.log("=".repeat(72));
  console.log("GO / NO-GO SIGNAL (PRD build step 11.2 gate)");
  console.log("=".repeat(72));
  console.log(
    `Intersection roles surfaced: ${intersectionRoles.length}` +
      (intersectionRoles.length
        ? ` (${intersectionRoles.map((r) => r.romeCode).join(", ")})`
        : ""),
  );

  if (intersectionRoles.length < 3) {
    console.log("");
    console.log(
      `>>> NO-GO SIGNAL: fewer than 3 intersection roles surfaced ` +
        `(${intersectionRoles.length} found).`,
    );
    console.log(
      ">>> Per PRD §11 step 2, this is THIN. Stop and report before building UI.",
    );
  } else {
    console.log("");
    console.log(">>> GO: 3+ intersection roles surfaced. Engine is not thin.");
  }
}

main().catch((err) => {
  console.error("INTERSECTION QUERY FAILED:", err);
  process.exit(1);
});
