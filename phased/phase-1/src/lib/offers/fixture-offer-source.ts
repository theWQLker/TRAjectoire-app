import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Offer } from "./offer";
import type { OfferSource } from "./offer-source";

/**
 * FixtureOfferSource (PRD §3). Reads JSON files from /fixtures/offers/*.json,
 * each file an array of Offer shaped exactly like the API response.
 *
 * Server/Node-only (uses fs). The engine treats this identically to the future
 * LiveOfferSource — same interface, same return shape.
 */
export class FixtureOfferSource implements OfferSource {
  private readonly fixturesDir: string;
  private cache: Offer[] | null = null;

  constructor(fixturesDir?: string) {
    // Default to <repo>/fixtures/offers. process.cwd() is the repo root under
    // both `next` and direct node/tsx execution.
    this.fixturesDir =
      fixturesDir ?? path.join(process.cwd(), "fixtures", "offers");
  }

  /** Load + flatten every fixture file once, then cache in memory. */
  private async loadAll(): Promise<Offer[]> {
    if (this.cache) return this.cache;

    const entries = await readdir(this.fixturesDir);
    const jsonFiles = entries.filter((f) => f.endsWith(".json"));

    const all: Offer[] = [];
    for (const file of jsonFiles) {
      const raw = await readFile(path.join(this.fixturesDir, file), "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error(
          `Fixture ${file} must be a JSON array of Offer, got ${typeof parsed}.`,
        );
      }
      all.push(...(parsed as Offer[]));
    }

    this.cache = all;
    return all;
  }

  async fetchOffers(romeCode: string, departement: string): Promise<Offer[]> {
    const all = await this.loadAll();
    return all.filter(
      (o) =>
        o.romeCode === romeCode &&
        o.lieuTravail.departement === departement,
    );
  }

  /** Not part of the seam — fixture-only helper used by the smoke test. */
  async loadAllOffers(): Promise<Offer[]> {
    return this.loadAll();
  }
}
