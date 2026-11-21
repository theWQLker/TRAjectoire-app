import { dataSourceMode } from "../data-source";
import type { OfferSource } from "./offer-source";
import { FixtureOfferSource } from "./fixture-offer-source";
import { LiveOfferSource } from "./live-offer-source";

export type { Offer } from "./offer";
export type { OfferSource, OfferCoverage } from "./offer-source";
export { FixtureOfferSource } from "./fixture-offer-source";
export { LiveOfferSource } from "./live-offer-source";

/**
 * Resolve the active OfferSource from env (PRD §3). No default: OFFER_SOURCE must be set.
 * The seam is the single switch point — nothing else in the app knows which
 * implementation is active. LiveOfferSource throttles via the offres limiter
 * (10 req/s) and can ingest into offers_cache + offer_counts. Fixture only when set.
 */
export function getOfferSource(): OfferSource {
  const mode = dataSourceMode("OFFER_SOURCE"); // throws when unset: no silent fixture fallback
  switch (mode) {
    case "fixture":
      return new FixtureOfferSource();
    case "live":
      return new LiveOfferSource();
    default:
      throw new Error(
        `Unknown OFFER_SOURCE=${mode}. Expected "fixture" or "live".`,
      );
  }
}
