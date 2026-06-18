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
}
