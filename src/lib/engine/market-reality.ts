import type { Offer, OfferSource } from "@/lib/offers";
import type { CandidateDirection } from "./direction-proposer";

/**
 * Market reality check (PRD §6.4). For each surfaced direction, pull cached
 * offers for that ROME + département via OfferSource and aggregate a
 * requirementProfile. Where demand is thin or zero, that is an HONEST SIGNAL,
 * surfaced — never a hidden filter (PRD §6.4 / §6.7 / constraints).
 *
 * Reads offers only through the seam. No verdicts, no feasibility score.
 */

export type RequirementStat = {
  code: string;
  libelle: string;
  /** offers that list this requirement (PRD §7 "24/42 ask…") */
  listing: number;
  /** offers that do NOT — the escape hatch (PRD §6.4 / §7 "→ 18/42 do not") */
  notListing: number;
  total: number;
  /** offer ids that list it — link target for the filtered subset (PRD §7) */
  listingOfferIds: string[];
  /** offer ids that do NOT list it — link target for "the exceptions" */
  notListingOfferIds: string[];
};

export type ContractMix = { typeContrat: string; count: number }[];

export type MarketReality = {
  /** PRD §6.4 marketDemand. Fixture: offer count. Live: Content-Range header. */
  marketDemand: number;
  /** common titles from the offer set (PRD §7 job side) */
  commonTitles: { intitule: string; count: number }[];
  contractMix: ContractMix;
  requirementProfile: RequirementStat[];
  /** experienceExige distribution (D/E/S) for the gate signals (§8) */
  experienceMix: { code: string; count: number }[];
  offers: Offer[];
};

export type DirectionWithMarket = CandidateDirection & { market: MarketReality };

function tally<T>(items: T[], key: (t: T) => string): { code: string; count: number }[] {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

function buildRequirementProfile(offers: Offer[]): RequirementStat[] {
  const total = offers.length;
  const acc = new Map<
    string,
    { libelle: string; listing: string[] }
  >();
  for (const o of offers) {
    const seen = new Set<string>();
    for (const c of o.competences) {
      if (seen.has(c.code)) continue;
      seen.add(c.code);
      const e = acc.get(c.code) ?? { libelle: c.libelle, listing: [] };
      e.listing.push(o.id);
      acc.set(c.code, e);
    }
  }
  return [...acc.entries()]
    .map(([code, { libelle, listing }]) => {
      const listingSet = new Set(listing);
      const notListingOfferIds = offers
        .filter((o) => !listingSet.has(o.id))
        .map((o) => o.id);
      return {
        code,
        libelle,
        listing: listing.length,
        notListing: total - listing.length,
        total,
        listingOfferIds: listing,
        notListingOfferIds,
      };
    })
    .sort((a, b) => b.listing - a.listing || a.code.localeCompare(b.code));
}

/** Attach §6.4 market reality to one direction, unioning across départements. */
export async function checkMarket(
  source: OfferSource,
  direction: CandidateDirection,
  departements: string[],
): Promise<DirectionWithMarket> {
  // Query every selected département and union the offers, so market demand and
  // the requirement profile reflect ALL chosen locations, not just the primary.
  const perDept = await Promise.all(
    departements.map((d) => source.fetchOffers(direction.romeCode, d)),
  );
  // Dedupe by offer id — the same offer can't be double-counted across depts.
  const seen = new Set<string>();
  const offers = perDept.flat().filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
  return {
    ...direction,
    market: {
      marketDemand: offers.length,
      commonTitles: tally(offers, (o) => o.intitule).map((t) => ({
        intitule: t.code,
        count: t.count,
      })),
      contractMix: tally(offers, (o) => o.typeContrat).map((t) => ({
        typeContrat: t.code,
        count: t.count,
      })),
      requirementProfile: buildRequirementProfile(offers),
      experienceMix: tally(offers, (o) => o.experienceExige ?? ""),
      offers,
    },
  };
}

export async function checkMarketAll(
  source: OfferSource,
  directions: CandidateDirection[],
  departements: string[],
): Promise<DirectionWithMarket[]> {
  return Promise.all(directions.map((d) => checkMarket(source, d, departements)));
}
