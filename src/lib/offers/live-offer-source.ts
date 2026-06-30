import type { Offer } from "./offer";
import type { OfferSource } from "./offer-source";
import { LIMITERS, fetchWithLimit } from "@/lib/ingest/rate-limiter";
import { startIngestRun } from "@/lib/ingest/ingest-run";
import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * LiveOfferSource (PRD §3 "Live API facts"). OAuth2 + real fetch against the
 * France Travail Offres v2 API. DORMANT behind OFFER_SOURCE=live; fixture stays
 * the default.
 *
 * Returns the SAME Offer shape (PRD §4) as FixtureOfferSource, so the engine
 * cannot tell which source is active (the seam, PRD §3).
 *
 * Throttling: routed through the OFFRES limiter (10 req/s) — its OWN limiter,
 * independent of the ROME 1 req/s limiter (PRD §3). 429 Retry-After is honored
 * inside fetchWithLimit. Server/Node-only. Creds from env, never source.
 */

const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token";
const OFFERS_URL =
  "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";
const SCOPE = "api_offresdemploiv2 o2dsoffre";

// API result cap (PRD §3): max 1,150 offers, range 0-0 .. 1000-1149.
const RESULT_CAP = 1150;
const SLICE_SPAN = 150; // API max span per request

type TokenResponse = { access_token: string; expires_in: number };

/** Raw API offer — only the fields we map. The API returns much more. */
type ApiOffer = {
  id: string;
  intitule?: string;
  romeCode?: string;
  typeContrat?: string;
  lieuTravail?: { libelle?: string; codePostal?: string; commune?: string };
  competences?: { code?: string; libelle?: string; exigence?: string }[];
  formations?: { niveau?: string; exigence?: string }[];
  qualitesProfessionnelles?: { libelle?: string }[];
  experienceLibelle?: string;
  experienceExige?: string;
  permis?: { libelle?: string; exigence?: string }[];
  dateCreation?: string;
};

export type FetchResult = {
  offers: Offer[];
  /** total available per Content-Range header (PRD §3 marketDemand source) */
  totalAvailable: number;
};

export class LiveOfferSource implements OfferSource {
  private token: { value: string; expiresAt: number } | null = null;

  private requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var ${name} (needed for LiveOfferSource).`);
    return v;
  }

  /** OAuth2 client-credentials. Cached in-memory for the process lifetime. */
  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 30_000) {
      return this.token.value;
    }
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.requireEnv("FT_CLIENT_ID"),
      client_secret: this.requireEnv("FT_CLIENT_SECRET"),
      scope: SCOPE,
    });
    // Token endpoint counts against the offres budget — go through its limiter.
    const res = await fetchWithLimit(LIMITERS.offres, `${TOKEN_URL}?realm=%2Fpartenaire`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OAuth token failed: ${res.status} ${res.statusText} — ${text}`);
    }
    const json = (await res.json()) as TokenResponse;
    this.token = {
      value: json.access_token,
      expiresAt: now + json.expires_in * 1000,
    };
    return json.access_token;
  }

  private mapOffer(a: ApiOffer): Offer {
    const libelle = a.lieuTravail?.libelle ?? "";
    const cp = a.lieuTravail?.codePostal ?? "";
    const departement =
      cp.slice(0, 2) || (libelle.match(/\b(\d{2})\b/)?.[1] ?? "");
    return {
      id: a.id,
      intitule: a.intitule ?? "",
      romeCode: a.romeCode ?? "",
      typeContrat: a.typeContrat ?? "",
      lieuTravail: { libelle, departement },
      competences: (a.competences ?? [])
        .filter((c) => c.code && c.libelle)
        .map((c) => ({
          code: c.code as string,
          libelle: c.libelle as string,
          ...(c.exigence ? { exigence: c.exigence } : {}),
        })),
      formations: a.formations,
      qualitesProfessionnelles: a.qualitesProfessionnelles?.filter(
        (q) => q.libelle,
      ) as { libelle: string }[] | undefined,
      experienceLibelle: a.experienceLibelle,
      experienceExige: a.experienceExige,
      permis: a.permis?.filter((p) => p.libelle) as
        | { libelle: string; exigence?: string }[]
        | undefined,
      dateCreation: a.dateCreation ?? "",
    };
  }

  /**
   * Fetch one slice. `range` is "start-end" (max span 150 per the API).
   * Returns mapped offers + the Content-Range total (PRD §3). Routed through
   * the offres limiter; 429 Retry-After handled there.
   */
  async fetchSlice(
    romeCode: string,
    departement: string,
    range = "0-149",
  ): Promise<FetchResult> {
    const token = await this.getToken();
    const params = new URLSearchParams({ codeROME: romeCode, departement, range });
    const res = await fetchWithLimit(LIMITERS.offres, `${OFFERS_URL}?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    if (res.status === 204) return { offers: [], totalAvailable: 0 };
    if (!res.ok && res.status !== 206) {
      const text = await res.text();
      throw new Error(`Offers fetch failed: ${res.status} ${res.statusText} — ${text}`);
    }

    // Content-Range: "offres 0-49/287543" → total is after the slash (PRD §3).
    const contentRange = res.headers.get("Content-Range") ?? "";
    const totalAvailable = Number(contentRange.split("/")[1] ?? 0) || 0;

    const json = (await res.json()) as { resultats?: ApiOffer[] };
    const offers = (json.resultats ?? []).map((a) => this.mapOffer(a));
    return { offers, totalAvailable };
  }

  /**
   * Fetch ALL offers for a ROME + département, slicing under the 1,150 cap
   * (PRD §3). Bodies are sliced; the true total comes from Content-Range.
   */
  async fetchAll(
    romeCode: string,
    departement: string,
  ): Promise<FetchResult> {
    const first = await this.fetchSlice(romeCode, departement, `0-${SLICE_SPAN - 1}`);
    const total = first.totalAvailable;
    const reachable = Math.min(total, RESULT_CAP);
    const offers = [...first.offers];

    for (let start = SLICE_SPAN; start < reachable; start += SLICE_SPAN) {
      const end = Math.min(start + SLICE_SPAN - 1, RESULT_CAP - 1);
      const slice = await this.fetchSlice(romeCode, departement, `${start}-${end}`);
      offers.push(...slice.offers);
      if (slice.offers.length === 0) break;
    }
    return { offers, totalAvailable: total };
  }

  /**
   * OfferSource seam method (READ path, issue ④). The engine reads CACHED offers
   * from Postgres — NEVER the API per request. We query `current_offers` (the
   * latest-batch-per-(rome,dept) view) so a render is a single fast DB read with
   * no rate-limit exposure. Offers are ingested out-of-band (see `ingest`).
   *
   * Returns [] when nothing is cached for (rome, dept) — an honest "no offers"
   * signal the market layer treats as thin demand, never an error.
   */
  async fetchOffers(romeCode: string, departement: string): Promise<Offer[]> {
    const db = getSupabaseServiceClient();
    const { data, error } = await db
      .from("current_offers")
      .select(
        "offer_id, rome_code, departement, intitule, type_contrat, competences, experience_exige, formations, qualites, permis, date_creation",
      )
      .eq("rome_code", romeCode)
      .eq("departement", departement);
    if (error) throw new Error(`current_offers read failed (${romeCode}/${departement}): ${error.message}`);

    return (data ?? []).map((r): Offer => ({
      id: r.offer_id as string,
      intitule: (r.intitule as string) ?? "",
      romeCode: (r.rome_code as string) ?? romeCode,
      typeContrat: (r.type_contrat as string) ?? "",
      lieuTravail: { libelle: "", departement: (r.departement as string) ?? departement },
      competences: (r.competences as Offer["competences"]) ?? [],
      formations: (r.formations as Offer["formations"]) ?? [],
      qualitesProfessionnelles: (r.qualites as Offer["qualitesProfessionnelles"]) ?? [],
      experienceExige: (r.experience_exige as string) ?? undefined,
      permis: (r.permis as Offer["permis"]) ?? [],
      dateCreation: (r.date_creation as string) ?? "",
    }));
  }

  /**
   * Ingest: fetch all offers for (ROME, département) and APPEND into offers_cache
   * + insert a fresh offer_counts snapshot (SCHEMA.md Zone 3, PRD §6.4 / §10).
   *
   * Append-only (SCHEMA.md): offer rows are INSERTED with a `batch_id` and a
   * surrogate pk_id — never updated — so the same offer_id can recur across
   * batches and the `current_offers` view always reads the latest pull. The
   * count is INSERTED as a new snapshot (PK includes snapshot_at), giving a
   * demand time-series rather than a single overwritten value.
   *
   * marketDemand = Content-Range total. Dormant — invoked by the scheduled
   * ingestion job / the per-département ingest script, not per request.
   */
  async ingest(
    romeCode: string,
    departement: string,
  ): Promise<{ batchId: string; cached: number; total: number }> {
    const db = getSupabaseServiceClient();
    // Open the audit row first; its id is the batch_id stamped on every row.
    const run = await startIngestRun("offres", { romeCode, departement });

    try {
      const { offers, totalAvailable } = await this.fetchAll(romeCode, departement);
      const fetchedAt = new Date().toISOString();

      if (offers.length > 0) {
        // Append-only INSERT (no onConflict): pk_id is a surrogate identity, so
        // re-pulls add fresh rows; current_offers picks the newest fetched_at.
        const rows = offers.map((o) => ({
          offer_id: o.id,
          batch_id: run.id,
          rome_code: o.romeCode || romeCode,
          departement: o.lieuTravail.departement || departement,
          intitule: o.intitule,
          type_contrat: o.typeContrat,
          competences: o.competences,
          experience_exige: o.experienceExige ?? null,
          formations: o.formations ?? [],
          qualites: o.qualitesProfessionnelles ?? [],
          permis: o.permis ?? [],
          date_creation: o.dateCreation || null,
          fetched_at: fetchedAt,
        }));
        const { error } = await db.from("offers_cache").insert(rows);
        if (error) throw new Error(`offers_cache insert failed: ${error.message}`);
      }

      // Insert a new demand snapshot (PK = rome_code, departement, snapshot_at).
      const { error: countErr } = await db.from("offer_counts").insert({
        rome_code: romeCode,
        departement,
        total_count: totalAvailable,
        batch_id: run.id,
        snapshot_at: fetchedAt,
      });
      if (countErr) throw new Error(`offer_counts insert failed: ${countErr.message}`);

      await run.finish({ ok: true, rowsWritten: offers.length });
      return { batchId: run.id, cached: offers.length, total: totalAvailable };
    } catch (err) {
      await run.finish({ ok: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }
}
