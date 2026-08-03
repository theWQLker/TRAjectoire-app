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
   * The date the cached offers for (romeCode, departement) were last fetched from
   * the source — the HONEST "vérifiée le" for a dated snapshot. Returns an ISO
   * string, or null when the source carries no fetch date (fixtures) so the UI
   * omits the claim rather than inventing one. Never the render time (PRD prime
   * directive: a freshness claim must be backed by when the data was actually
   * pulled, not when the page rendered).
   */
  snapshotDate(romeCode: string, departement: string): Promise<string | null>;
}
