import type { Offer } from "./offer";

/**
 * The seam (PRD §3). One interface, two implementations:
 *   - FixtureOfferSource — reads /fixtures/offers/*.json. Used now.
 *   - LiveOfferSource    — OAuth2 + real fetch. NOT BUILT YET (dormant).
 *
 * All scoring, UI, and DB logic reads through this interface, never the API
 * directly. Switch via env OFFER_SOURCE=fixture|live.
 */
export interface OfferSource {
  fetchOffers(romeCode: string, departement: string): Promise<Offer[]>;
  /**
   * What the offers actually cover: one entry per département that has any
   * offer, with the dates those offers were collected. Every on-screen claim
   * about the market reads its scope and date from here, never from a constant.
   */
  coverage(): Promise<OfferCoverage>;
}

/** fetchedFrom/To: ISO collection dates (null when the source has none, e.g. fixtures). */
export type OfferCoverage = {
  departement: string;
  offers: number;
  fetchedFrom: string | null;
  fetchedTo: string | null;
}[];
