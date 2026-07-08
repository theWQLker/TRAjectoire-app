/**
 * Intersection engine over cached offers (PRD §6.2 / §6.3).
 *
 * Deterministic. No AI (PRD §6.5). Reads offers ONLY through the OfferSource
 * seam (PRD §3) — never the API, never fs directly.
 *
 *   §6.2 Matching: per candidate ROME, pull offers for ROME + département;
 *        marketDemand = offer count; requirementProfile = per-competence
 *        fraction of offers that list it AND the fraction that do NOT (the
 *        escape hatch).
 *   §6.3 Intersection: an *intersection role* is a ROME whose offers'
 *        `competences` arrays draw from 2+ of the user's clusters
 *        (offer-level overlap, not taxonomy-level). Intersection roles rank
 *        ABOVE single-cluster roles.
 */
import type { Offer, OfferSource } from "@/lib/offers";
import { getCluster, type Cluster } from "../../../config/clusters";

export type ProofProfile = {
  /** cluster ids the user has proven (PRD §5.3 — 2+ proof clusters) */
  clusterIds: string[];
  departement: string;
};

export type RequirementStat = {
  code: string;
  libelle: string;
  /** offers (of this ROME set) that list this competence */
  listing: number;
  /** offers that do NOT list it — the escape hatch (PRD §6.2 / §7) */
  notListing: number;
  total: number;
};

export type RankedRole = {
  romeCode: string;
  /** distinct user-clusters this ROME's offers touch, at offer level */
  matchedClusterIds: string[];
  /** true when offers overlap 2+ of the user's clusters (PRD §6.3) */
  isIntersection: boolean;
  /** PRD §6.2 marketDemand = cached offer count for ROME + département */
  marketDemand: number;
  /**
   * # offers that individually overlap 2+ user clusters (offer-level, PRD §6.3).
   * Strongest evidence: a single ad wanting skills from both proofs.
   */
  offersWithMultiClusterOverlap: number;
  requirementProfile: RequirementStat[];
  rank: number; // 1-based, assigned after sort
};

/** Map a competence code -> the set of user-cluster ids that contain it. */
function buildCodeToClusters(clusters: Cluster[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const cluster of clusters) {
    for (const code of cluster.competenceCodes) {
      if (!m.has(code)) m.set(code, new Set());
      m.get(code)!.add(cluster.id);
    }
  }
  return m;
}

/** Which user-clusters does a single offer's competences touch? */
function offerClusterHits(
  offer: Offer,
  codeToClusters: Map<string, Set<string>>,
): Set<string> {
  const hits = new Set<string>();
  for (const c of offer.competences) {
    const clustersForCode = codeToClusters.get(c.code);
    if (clustersForCode) for (const id of clustersForCode) hits.add(id);
  }
  return hits;
}

function buildRequirementProfile(offers: Offer[]): RequirementStat[] {
  const total = offers.length;
  const counts = new Map<string, { libelle: string; n: number }>();
  for (const o of offers) {
    // count each competence once per offer
    const seen = new Set<string>();
    for (const c of o.competences) {
      if (seen.has(c.code)) continue;
      seen.add(c.code);
      const prev = counts.get(c.code);
      if (prev) prev.n += 1;
      else counts.set(c.code, { libelle: c.libelle, n: 1 });
    }
  }
  return [...counts.entries()]
    .map(([code, { libelle, n }]) => ({
      code,
      libelle,
      listing: n,
      notListing: total - n,
      total,
    }))
    .sort((a, b) => b.listing - a.listing || a.code.localeCompare(b.code));
}

/**
 * Rank candidate ROMEs for a proof profile (PRD §6.3/§6.4 — ranking, not
 * verdicts). Deterministic ordering:
 *   1. intersection roles (2+ clusters) before single-cluster roles
 *   2. then by # clusters matched (desc)
 *   3. then by offer-level multi-cluster overlap count (desc)
 *   4. then by market demand (desc)
 *   5. then by ROME code (asc) — stable tie-break
 */
export async function rankRoles(
  source: OfferSource,
  candidateRomeCodes: string[],
  profile: ProofProfile,
): Promise<RankedRole[]> {
  const clusters = profile.clusterIds.map(getCluster);
  const codeToClusters = buildCodeToClusters(clusters);

  const roles: RankedRole[] = [];

  for (const rome of candidateRomeCodes) {
    const offers = await source.fetchOffers(rome, profile.departement);
    if (offers.length === 0) continue;

    const matchedClusters = new Set<string>();
    let offersWithMultiClusterOverlap = 0;

    for (const offer of offers) {
      const hits = offerClusterHits(offer, codeToClusters);
      for (const id of hits) matchedClusters.add(id);
      if (hits.size >= 2) offersWithMultiClusterOverlap += 1;
    }

    if (matchedClusters.size === 0) continue; // ROME touches none of the proofs

    roles.push({
      romeCode: rome,
      matchedClusterIds: [...matchedClusters].sort(),
      isIntersection: matchedClusters.size >= 2,
      marketDemand: offers.length,
      offersWithMultiClusterOverlap,
      requirementProfile: buildRequirementProfile(offers),
      rank: 0,
    });
  }

  roles.sort(
    (a, b) =>
      Number(b.isIntersection) - Number(a.isIntersection) ||
      b.matchedClusterIds.length - a.matchedClusterIds.length ||
      b.offersWithMultiClusterOverlap - a.offersWithMultiClusterOverlap ||
      b.marketDemand - a.marketDemand ||
      a.romeCode.localeCompare(b.romeCode),
  );
  roles.forEach((r, i) => (r.rank = i + 1));
  return roles;
}
