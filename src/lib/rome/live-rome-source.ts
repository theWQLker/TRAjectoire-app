import type { RiasecCode, RankedRiasec, RiasecRank, RomeMetier } from "./rome-metier";
import type { MobiliteEdge, MobilityType, RomeSource } from "./rome-source";
import { buildCompetenceRarity, type CompetenceRarity } from "./competence-rarity";
import { LIMITERS, fetchWithLimit } from "@/lib/ingest/rate-limiter";
import { startIngestRun } from "@/lib/ingest/ingest-run";
import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * LiveRomeSource (PRD §3b). The ROME 4.0 referential loaded ONCE into Postgres,
 * then read from there — NOT fetched per user request (PRD §3b). DORMANT behind
 * ROME_SOURCE=live; fixture stays the default.
 *
 * Two sides:
 *   - Ingest (one-time / ~twice a year): pull ~532 métiers from the Fiches
 *     Métiers API at 1 req/s (the ROME limiter — its OWN, independent of the
 *     Offres 10/s limiter, PRD §3) into rome_jobs + rome_job_competences +
 *     rome_mobilites; load RIASEC from the open-data CSV into rome_riasec
 *     (CSV ONLY — NOT in the API, PRD §3b).
 *   - Read (RomeSource interface): query Postgres, assemble RomeMetier so the
 *     engine cannot tell live from fixture.
 *
 * Server/Node-only. OAuth2 creds from env, never source.
 */

const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token";
// ROME 4.0 *Fiches* Métiers API. Endpoint paths + scope verified empirically
// against the live API (scripts/probe-rome-api.ts), NOT from stale docs:
//   list   : GET  /fiches-rome/fiche-metier        → [{ code, metier:{code,libelle} }]
//   detail : GET  /fiches-rome/fiche-metier/{code}  → full fiche (below)
// The bare `rome-metiers/v1/metiers` path the PRD implied 404s; competences
// live ONLY on the Fiches API.
const ROME_BASE =
  "https://api.francetravail.io/partenaire/rome-fiches-metiers/v1/fiches-rome";
const ROME_SCOPE = "api_rome-fiches-metiersv1 nomenclatureRome";

type TokenResponse = { access_token: string; expires_in: number };

/**
 * Raw Fiches API shapes — only the fields we map (verified live, see probes).
 * The fiche has NO definition / domaineProfessionnel / appellations /
 * metiersProches. Competences come from two groups:
 *   groupesCompetencesMobilisees[].competences[]  (savoir-faire)
 *   groupesSavoirs[].savoirs[]                     (savoirs)
 * each item: { type, code, libelle }. Mobilités are NOT in this API (open-data
 * CSV only, PRD §3b/§12) — deferred.
 */
type ApiCompetenceItem = { type?: string; code?: string; libelle?: string };
type ApiMetierListItem = { code: string; metier?: { code?: string; libelle?: string } };
type ApiMetierDetail = {
  code: string;
  obsolete?: boolean;
  metier?: { code?: string; libelle?: string };
  groupesCompetencesMobilisees?: { competences?: ApiCompetenceItem[] }[];
  groupesSavoirs?: { savoirs?: ApiCompetenceItem[] }[];
};

// How long a process keeps its in-memory graph before re-reading it.
const GRAPH_TTL_MS = 30 * 60_000;

export class LiveRomeSource implements RomeSource {
  private token: { value: string; expiresAt: number } | null = null;
  private cache: RomeMetier[] | null = null;
  // Shared per process (see getRomeSource): refresh the graph after GRAPH_TTL_MS
  // so the daily ROME check reaches long-lived instances; dedupe cold loads.
  private loadedAt = 0;
  private loading: Promise<void> | null = null;
  private byCode: Map<string, RomeMetier> | null = null;
  private byCompetence: Map<string, RomeMetier[]> | null = null;
  // source code → its outgoing mobilité edges with type (the node only keeps
  // target codes; the edge type lives here so getMobilites can return it).
  private mobilityEdges: Map<string, { to: string; type: MobilityType }[]> | null = null;
  // idf per competence code over the full graph (§4.1). Built once in load().
  private rarity: CompetenceRarity | null = null;

  private requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var ${name} (needed for LiveRomeSource).`);
    return v;
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 30_000) return this.token.value;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.requireEnv("FT_CLIENT_ID"),
      client_secret: this.requireEnv("FT_CLIENT_SECRET"),
      scope: ROME_SCOPE,
    });
    const res = await fetchWithLimit(LIMITERS.rome, `${TOKEN_URL}?realm=%2Fpartenaire`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ROME OAuth token failed: ${res.status} ${res.statusText} — ${text}`);
    }
    const json = (await res.json()) as TokenResponse;
    this.token = { value: json.access_token, expiresAt: now + json.expires_in * 1000 };
    return json.access_token;
  }

  private async romeGet<T>(path: string): Promise<T> {
    const token = await this.getToken();
    const res = await fetchWithLimit(LIMITERS.rome, `${ROME_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ROME GET ${path} failed: ${res.status} ${res.statusText} — ${text}`);
    }
    return (await res.json()) as T;
  }

  // -------------------------------------------------------------------------
  // Ingest (PRD §3b — ~532 métiers, 1 req/s)
  // -------------------------------------------------------------------------

  private mapDetail(d: ApiMetierDetail): {
    title: string;
    competences: RomeMetier["competences"];
    domainCode: string | null;
  } {
    // Both groups carry {type, code, libelle}: savoir-faire + savoirs together
    // form the métier's competence set (the skill-bridge vocabulary, §6.2.B).
    const fromGroups: ApiCompetenceItem[] = [
      ...(d.groupesCompetencesMobilisees ?? []).flatMap((g) => g.competences ?? []),
      ...(d.groupesSavoirs ?? []).flatMap((g) => g.savoirs ?? []),
    ];
    const seen = new Set<string>();
    const competences = fromGroups
      .filter((c) => c.code && c.libelle && !seen.has(c.code) && seen.add(c.code))
      .map((c) => ({ code: c.code as string, libelle: c.libelle as string, type: c.type }));
    const title = d.metier?.libelle ?? d.code;
    const domainCode = d.code?.[0] ?? null; // ROME grand-domaine letter
    return { title, competences, domainCode };
  }

  /**
   * Fetch the set of rome_codes already fully ingested — i.e. that have at least
   * one rome_job_competences link. A bare rome_jobs row is NOT enough: a fiche
   * interrupted between the job upsert and its competence write would leave a
   * job with no links, so requiring a link guarantees the fiche completed.
   * Used by ingestAll({ resume: true }) to skip the API call for done fiches.
   */
  private async ingestedCodes(): Promise<Set<string>> {
    const db = getSupabaseServiceClient();
    const done = new Set<string>();
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await db
        .from("rome_job_competences")
        .select("rome_code")
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`resume scan failed: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const r of data) done.add(r.rome_code as string);
      if (data.length < pageSize) break;
    }
    return done;
  }

  /**
   * Ingest the ROME referential into Postgres. The live Fiches API lists 1911
   * fiches; at 1 req/s that's ~32 min. Idempotent: upserts. Call once / on ROME
   * refresh, not per request.
   *
   * `resume` (default true): skip fiches already fully ingested (have a
   * competence link), so a re-run after an interrupted ingest only fetches what's
   * missing — no wasted API calls. Pass { resume: false } to force a full refetch
   * (e.g. on a ROME release where existing fiches changed).
   *
   * One pass (no mobilité second pass): the Fiches API does NOT expose
   * metiersProches — mobilités come from the open-data CSV (PRD §3b/§12), loaded
   * separately, so this ingest writes rome_jobs + rome_competences +
   * rome_job_competences only. Appellations are also absent from this endpoint.
   */
  async ingestAll(opts: { resume?: boolean } = {}): Promise<{
    batchId: string;
    metiers: number;
    fetched: number;
    skipped: number;
    competences: number;
    competenceLinks: number;
  }> {
    const resume = opts.resume ?? true;
    const db = getSupabaseServiceClient();
    const list = await this.romeGet<ApiMetierListItem[]>("/fiche-metier");

    const alreadyDone = resume ? await this.ingestedCodes() : new Set<string>();
    const pending = list.filter((i) => !alreadyDone.has(i.code));

    // Open the audit row; its id is the batch_id (SCHEMA.md Zone 3).
    const run = await startIngestRun("rome", {
      metiers: list.length,
      source: "fiches-metiers",
      resume,
      skipped: list.length - pending.length,
    });

    try {
      let competenceLinks = 0;
      let fetched = 0;
      const competenceCodes = new Set<string>();

      for (const item of pending) {
        const detail = await this.romeGet<ApiMetierDetail>(
          `/fiche-metier/${encodeURIComponent(item.code)}`,
        );
        fetched++;
        const { title, competences: comps, domainCode } = this.mapDetail(detail);

        const { error: jobErr } = await db.from("rome_jobs").upsert(
          {
            rome_code: detail.code,
            title,
            domain_code: domainCode,
          },
          { onConflict: "rome_code" },
        );
        if (jobErr) throw new Error(`rome_jobs upsert failed (${detail.code}): ${jobErr.message}`);

        if (comps.length) {
          const compRows = comps.map((c) => ({ code: c.code, libelle: c.libelle, type: c.type ?? null }));
          const { error: cErr } = await db
            .from("rome_competences")
            .upsert(compRows, { onConflict: "code" });
          if (cErr) throw new Error(`rome_competences upsert failed (${detail.code}): ${cErr.message}`);

          const linkRows = comps.map((c) => ({ rome_code: detail.code, competence_code: c.code }));
          const { error: lErr } = await db
            .from("rome_job_competences")
            .upsert(linkRows, { onConflict: "rome_code,competence_code" });
          if (lErr) throw new Error(`rome_job_competences upsert failed (${detail.code}): ${lErr.message}`);
          competenceLinks += comps.length;
          for (const c of comps) competenceCodes.add(c.code);
        }
      }

      this.cache = null; // invalidate read cache
      const rowsWritten = fetched + competenceCodes.size + competenceLinks;
      await run.finish({ ok: true, rowsWritten });
      return {
        batchId: run.id,
        metiers: list.length,
        fetched,
        skipped: list.length - pending.length,
        competences: competenceCodes.size,
        competenceLinks,
      };
    } catch (err) {
      await run.finish({ ok: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  /**
   * Rolling ROME check (daily cron /api/cron/rome-check, migration 0007).
   *
   * Every run: 1 list call → codes that left the list are marked retired
   * (obsolete_at), codes new to the list are fetched first. Then re-fetches the
   * `batch` least-recently-checked fiches (1 req/s), updating title and the
   * competence links (adds new links AND deletes dropped ones, which ingestAll
   * never did). 1911 fiches / 64 per day ≈ a full pass every 30 days.
   *
   * Never deletes a job: retired codes keep their rows, the engine skips them.
   * Mobilités + RIASEC come from open-data CSVs, not this API — not covered here.
   *
   * The audit row is opened FIRST, so even a failed check writes to the DB (this
   * job is also what keeps the free Supabase project from pausing).
   */
  async checkSlice(opts: { batch?: number; deadlineMs?: number } = {}): Promise<{
    batchId: string;
    listed: number;
    checked: number;
    added: string[];
    retired: string[];
    revived: string[];
    changed: { code: string; title?: string; linksAdded: number; linksRemoved: number }[];
    failures: string[];
  }> {
    const batch = opts.batch ?? 64;
    const deadline = Date.now() + (opts.deadlineMs ?? 240_000);
    const db = getSupabaseServiceClient();
    const run = await startIngestRun("rome", { kind: "rolling-check", batch });

    try {
      const list = await this.romeGet<ApiMetierListItem[]>("/fiche-metier");
      const known = await this.fetchAll<{
        rome_code: string;
        title: string;
        checked_at: string | null;
        obsolete_at: string | null;
      }>("rome_jobs", "rome_code, title, checked_at, obsolete_at");
      const knownBy = new Map(known.map((k) => [k.rome_code, k]));
      const listed = new Set(list.map((i) => i.code));
      const activeKnown = known.filter((k) => !k.obsolete_at);

      // Guard: a short or empty list (API glitch) must never retire the referential.
      if (listed.size < activeKnown.length * 0.9) {
        throw new Error(
          `ROME list returned ${listed.size} codes vs ${activeKnown.length} active — refusing to retire on a short list`,
        );
      }

      const now = new Date().toISOString();
      const retired = activeKnown.filter((k) => !listed.has(k.rome_code)).map((k) => k.rome_code);
      if (retired.length) {
        const { error } = await db.from("rome_jobs").update({ obsolete_at: now }).in("rome_code", retired);
        if (error) throw new Error(`rome_jobs retire failed: ${error.message}`);
      }

      const newCodes = list.filter((i) => !knownBy.has(i.code)).map((i) => i.code);
      const due = known
        .filter((k) => listed.has(k.rome_code))
        .sort((a, b) => (a.checked_at ?? "").localeCompare(b.checked_at ?? ""))
        .map((k) => k.rome_code);
      const queue = [...newCodes, ...due].slice(0, batch);

      const added: string[] = [];
      const revived: string[] = [];
      const changed: { code: string; title?: string; linksAdded: number; linksRemoved: number }[] = [];
      const failures: string[] = [];
      let checked = 0;

      for (const code of queue) {
        if (Date.now() > deadline) break;
        try {
          const detail = await this.romeGet<ApiMetierDetail>(
            `/fiche-metier/${encodeURIComponent(code)}`,
          );
          const prev = knownBy.get(code);

          if (detail.obsolete) {
            // Retired by France Travail. Unknown + obsolete → never added.
            if (prev) {
              const { error } = await db
                .from("rome_jobs")
                .update({ checked_at: now, obsolete_at: prev.obsolete_at ?? now })
                .eq("rome_code", code);
              if (error) throw new Error(`rome_jobs update: ${error.message}`);
              if (!prev.obsolete_at) retired.push(code);
            }
            checked++;
            continue;
          }

          const { title, competences: comps, domainCode } = this.mapDetail(detail);
          const { error: jobErr } = await db.from("rome_jobs").upsert(
            { rome_code: code, title, domain_code: domainCode, checked_at: now, obsolete_at: null },
            { onConflict: "rome_code" },
          );
          if (jobErr) throw new Error(`rome_jobs upsert: ${jobErr.message}`);
          if (!prev) added.push(code);
          if (prev?.obsolete_at) revived.push(code);

          if (comps.length) {
            const { error } = await db
              .from("rome_competences")
              .upsert(
                comps.map((c) => ({ code: c.code, libelle: c.libelle, type: c.type ?? null })),
                { onConflict: "code" },
              );
            if (error) throw new Error(`rome_competences upsert: ${error.message}`);
          }

          const { data: linkRows, error: linkErr } = await db
            .from("rome_job_competences")
            .select("competence_code")
            .eq("rome_code", code);
          if (linkErr) throw new Error(`rome_job_competences read: ${linkErr.message}`);
          const before = new Set((linkRows ?? []).map((r) => r.competence_code as string));
          const after = new Set(comps.map((c) => c.code));
          const toAdd = [...after].filter((c) => !before.has(c));
          const toRemove = [...before].filter((c) => !after.has(c));

          if (toAdd.length) {
            const { error } = await db
              .from("rome_job_competences")
              .upsert(
                toAdd.map((c) => ({ rome_code: code, competence_code: c })),
                { onConflict: "rome_code,competence_code" },
              );
            if (error) throw new Error(`rome_job_competences add: ${error.message}`);
          }
          if (toRemove.length) {
            const { error } = await db
              .from("rome_job_competences")
              .delete()
              .eq("rome_code", code)
              .in("competence_code", toRemove);
            if (error) throw new Error(`rome_job_competences remove: ${error.message}`);
          }

          const titleChanged = prev && prev.title !== title;
          if (prev && (titleChanged || toAdd.length || toRemove.length)) {
            changed.push({
              code,
              ...(titleChanged ? { title: `${prev.title} → ${title}` } : {}),
              linksAdded: toAdd.length,
              linksRemoved: toRemove.length,
            });
          }
          checked++;
        } catch (err) {
          failures.push(`${code}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      if (added.length || retired.length || revived.length || changed.length) this.cache = null;

      // Record what changed on the audit row (scope was written before the run).
      await db
        .from("ingest_runs")
        .update({
          scope: {
            kind: "rolling-check",
            batch,
            listed: listed.size,
            checked,
            added,
            retired,
            revived,
            changed,
            failures: failures.length,
          },
        })
        .eq("id", run.id);
      await run.finish({
        ok: failures.length === 0,
        rowsWritten: checked + retired.length,
        error: failures.length ? failures.slice(0, 5).join(" | ") : undefined,
      });

      return { batchId: run.id, listed: listed.size, checked, added, retired, revived, changed, failures };
    } catch (err) {
      await run.finish({ ok: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  /**
   * Load RIASEC from the open-data CSV into rome_riasec. CSV ONLY — NOT an API
   * call (the Fiches API carries no RIASEC, confirmed by probing; PRD §3b/§12).
   *
   * File shape (confirmed by inspection of codification-riasec-des-metiers-rome.csv,
   * NOT the spec PDF, which was wrong): comma-delimited, double-quoted values,
   * UTF-8/ASCII, header EXACTLY:
   *   ROME_PROFESSION_CARD_CODE,MAJOR_RIASEC_CODE,MINOR_RIASEC_CODE
   * One row per métier: a major letter (always present) + a minor letter
   * (sometimes empty). We insert up to TWO rome_riasec rows per métier so the
   * major/minor distinction survives for the weighted interest leap (§6.2.D):
   *   (code, MAJOR, 'major')  and  (code, MINOR, 'minor')  [minor skipped if empty]
   *
   * Skips:
   *   - rome_code not present in rome_jobs (FK-safe; reported)
   *   - empty minor letters (reported as a count)
   *   - any letter not in {R,I,A,S,E,C} (reported)
   */
  async loadRiasecCsv(csvText: string): Promise<{
    inserted: number;
    metiers: number;
    skippedUnknownRome: string[];
    emptyMinor: number;
    skippedInvalidLetter: { code: string; value: string }[];
  }> {
    const db = getSupabaseServiceClient();
    const valid = new Set<RiasecCode>(["R", "I", "A", "S", "E", "C"]);

    // Known job nodes for the FK-safe skip (paged; the table is ~1911 rows).
    const known = new Set<string>();
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db
        .from("rome_jobs")
        .select("rome_code")
        .range(from, from + 999);
      if (error) throw new Error(`rome_jobs scan failed: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const r of data) known.add(r.rome_code as string);
      if (data.length < 1000) break;
    }

    const unquote = (s: string): string => s.trim().replace(/^"(.*)"$/, "$1").trim();

    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { inserted: 0, metiers: 0, skippedUnknownRome: [], emptyMinor: 0, skippedInvalidLetter: [] };
    }

    // Validate the header is the shape we built against (fail loud on drift).
    const header = lines[0].split(",").map(unquote).map((h) => h.toUpperCase());
    const expected = ["ROME_PROFESSION_CARD_CODE", "MAJOR_RIASEC_CODE", "MINOR_RIASEC_CODE"];
    if (header.length < 3 || expected.some((e, i) => header[i] !== e)) {
      throw new Error(
        `RIASEC CSV header mismatch. Expected "${expected.join(",")}", got "${header.join(",")}". ` +
          `The loader is written against that exact shape — re-inspect the file.`,
      );
    }

    const rows: { rome_code: string; riasec_code: string; rank: "major" | "minor" }[] = [];
    const skippedUnknownRome = new Set<string>();
    const skippedInvalidLetter: { code: string; value: string }[] = [];
    const metiers = new Set<string>();
    let emptyMinor = 0;

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map(unquote);
      const code = cells[0];
      if (!code) continue;
      if (!known.has(code)) {
        skippedUnknownRome.add(code);
        continue;
      }
      metiers.add(code);

      const major = (cells[1] ?? "").toUpperCase();
      const minor = (cells[2] ?? "").toUpperCase();

      if (valid.has(major as RiasecCode)) {
        rows.push({ rome_code: code, riasec_code: major, rank: "major" });
      } else {
        skippedInvalidLetter.push({ code, value: cells[1] ?? "" });
      }

      if (minor === "") {
        emptyMinor++;
      } else if (valid.has(minor as RiasecCode)) {
        rows.push({ rome_code: code, riasec_code: minor, rank: "minor" });
      } else {
        skippedInvalidLetter.push({ code, value: cells[2] ?? "" });
      }
    }

    if (rows.length) {
      const { error } = await db
        .from("rome_riasec")
        .upsert(rows, { onConflict: "rome_code,riasec_code,rank" });
      if (error) throw new Error(`rome_riasec upsert failed: ${error.message}`);
    }

    this.cache = null; // invalidate read cache
    return {
      inserted: rows.length,
      metiers: metiers.size,
      skippedUnknownRome: [...skippedUnknownRome].sort(),
      emptyMinor,
      skippedInvalidLetter,
    };
  }

  /**
   * Load curated mobilité edges from the open-data CSV into rome_mobilites. CSV
   * ONLY — the Fiches API exposes no metiersProches (confirmed by probing;
   * PRD §3b/§12). The dataset is the complete directed edge-list.
   *
   * File shape (confirmed by inspection of
   * mobilites-possibles-entre-deux-metiers-rome.csv): comma-delimited,
   * double-quoted, UTF-8/ASCII, header EXACTLY:
   *   ROME_PROFESSION_CARD_CODE,ROME_PROF_CARD_CODE_DEST,
   *   ROME_PROFESSION_NAME_SRC,ROME_PROFESSION_NAME_DEST,
   *   CHANGE_TYPE_CODE,CHANGE_TYPE_NAME
   * Mapping: col0 → from_rome_code, col1 → to_rome_code, col5 (CHANGE_TYPE_NAME,
   * 'Proche'|'Evolution') → mobility_type. The NAME_SRC/NAME_DEST columns are
   * empty in the file and ignored.
   *
   * Two passes so a rome_mobilites FK (both ends → rome_jobs) never fails: pass
   * 1 reads + filters every edge (both codes must be known job nodes; self-edges
   * dropped), pass 2 upserts the survivors. Skips reported.
   */
  async loadMobilitesCsv(csvText: string): Promise<{
    inserted: number;
    skippedSelfEdge: number;
    skippedUnknownCode: number;
    byType: Record<string, number>;
  }> {
    const db = getSupabaseServiceClient();

    // Known job nodes for the FK-safe skip (both ends must exist).
    const known = new Set<string>();
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db
        .from("rome_jobs")
        .select("rome_code")
        .range(from, from + 999);
      if (error) throw new Error(`rome_jobs scan failed: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const r of data) known.add(r.rome_code as string);
      if (data.length < 1000) break;
    }

    const unquote = (s: string): string => s.trim().replace(/^"(.*)"$/, "$1").trim();
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { inserted: 0, skippedSelfEdge: 0, skippedUnknownCode: 0, byType: {} };
    }

    // Validate header is the shape we built against (fail loud on drift).
    const header = lines[0].split(",").map(unquote).map((h) => h.toUpperCase());
    const expected = ["ROME_PROFESSION_CARD_CODE", "ROME_PROF_CARD_CODE_DEST"];
    if (header.length < 6 || expected.some((e, i) => header[i] !== e)) {
      throw new Error(
        `Mobilités CSV header mismatch. Expected to start "${expected.join(",")}", ` +
          `got "${header.slice(0, 2).join(",")}". Re-inspect the file.`,
      );
    }

    // --- pass 1: parse + filter (FK-safe, dedupe, drop self-edges) ----------
    const edges = new Map<string, { from_rome_code: string; to_rome_code: string; mobility_type: string | null }>();
    const byType: Record<string, number> = {};
    let skippedSelfEdge = 0;
    let skippedUnknownCode = 0;

    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(",").map(unquote);
      const from = c[0];
      const to = c[1];
      const typeName = c[5] || null; // CHANGE_TYPE_NAME ('Proche' | 'Evolution')
      if (!from || !to) continue;
      if (from === to) {
        skippedSelfEdge++;
        continue;
      }
      if (!known.has(from) || !known.has(to)) {
        skippedUnknownCode++;
        continue;
      }
      const type = typeName === "Proche" || typeName === "Evolution" ? typeName : null;
      // dedupe on the PK (from,to); if dupes disagree on type, first wins.
      const key = `${from}|${to}`;
      if (!edges.has(key)) {
        edges.set(key, { from_rome_code: from, to_rome_code: to, mobility_type: type });
        byType[type ?? "unknown"] = (byType[type ?? "unknown"] ?? 0) + 1;
      }
    }

    // --- pass 2: upsert all survivors (all job nodes already exist) ---------
    const rows = [...edges.values()];
    if (rows.length) {
      const { error } = await db
        .from("rome_mobilites")
        .upsert(rows, { onConflict: "from_rome_code,to_rome_code" });
      if (error) throw new Error(`rome_mobilites upsert failed: ${error.message}`);
    }

    this.cache = null; // invalidate read cache
    return { inserted: rows.length, skippedSelfEdge, skippedUnknownCode, byType };
  }

  // -------------------------------------------------------------------------
  // Read side (RomeSource) — from Postgres, indexed in memory once
  // -------------------------------------------------------------------------

  /**
   * Read an entire table through PostgREST, which caps each response at 1000 rows
   * (issue ⑤). An unpaginated select silently truncates — e.g. 1000 of 1911
   * métiers, 1000 of 105,940 skill-bridge edges — so the leap graph loads a
   * fraction of itself. We page with .range() until a short page is returned.
   *
   * Each page is retried with backoff on a TRANSIENT failure (Supabase/Cloudflare
   * 522 "connection timed out", network blips). rome_competences alone is ~32
   * pages; without a retry, ONE flaky page rejected the whole Promise.all load,
   * which sank competenceRarity()/reach()/buildResults — leaving /results stuck on
   * "Rendering…" forever. The graph is the same every read, so a retried page is
   * safe and idempotent. A page that still fails after the retries is a real
   * outage — we throw (the load genuinely can't proceed), not silently truncate.
   */
  private async fetchAll<T>(
    table: string,
    columns: string,
  ): Promise<T[]> {
    const db = getSupabaseServiceClient();
    const PAGE = 1000;
    const MAX_ATTEMPTS = 4;
    const CONCURRENCY = 6;

    const readPage = async (from: number): Promise<T[]> => {
      let lastErr = "";
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const { data, error } = await db
          .from(table)
          .select(columns)
          .range(from, from + PAGE - 1);
        if (!error) return (data ?? []) as T[];
        lastErr = error.message;
        if (attempt < MAX_ATTEMPTS) {
          // 0.5s, 1s, 2s backoff — rides out a transient gateway timeout.
          await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
        }
      }
      throw new Error(
        `LiveRomeSource read failed (${table}) after ${MAX_ATTEMPTS} attempts: ${lastErr}`,
      );
    };

    // Same independent range reads as before, issued in parallel: the 108 pages
    // of rome_job_competences were 108 sequential round trips on a cold load.
    const { count, error: countErr } = await db
      .from(table)
      .select("*", { count: "exact", head: true });
    if (countErr) throw new Error(`LiveRomeSource count failed (${table}): ${countErr.message}`);
    const starts: number[] = [];
    for (let from = 0; from < (count ?? 0); from += PAGE) starts.push(from);
    const pages: T[][] = new Array(starts.length);
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, starts.length) }, async () => {
        while (next < starts.length) {
          const i = next++;
          pages[i] = await readPage(starts[i]);
        }
      }),
    );
    // Rows added between the count and the reads: keep reading to the short page.
    for (let from = starts.length * PAGE; ; from += PAGE) {
      if (pages.length && pages[pages.length - 1].length < PAGE) break;
      const more = await readPage(from);
      pages.push(more);
      if (more.length < PAGE) break;
    }

    const out: T[] = [];
    for (const page of pages) for (const row of page) out.push(row);
    return out;
  }

  /**
   * Codes France Travail has retired (rome_jobs.obsolete_at set by the rolling
   * check). Tolerates the column not existing yet (migration 0007 not applied):
   * then nothing is retired, so a deploy before the migration never breaks reads.
   */
  private async retiredCodes(): Promise<Set<string>> {
    const { data, error } = await getSupabaseServiceClient()
      .from("rome_jobs")
      .select("rome_code")
      .not("obsolete_at", "is", null);
    if (error) {
      if (/obsolete_at/.test(error.message)) return new Set();
      throw new Error(`LiveRomeSource read failed (retired codes): ${error.message}`);
    }
    return new Set((data ?? []).map((r) => r.rome_code as string));
  }

  private async load(): Promise<void> {
    if (this.cache && Date.now() - this.loadedAt < GRAPH_TTL_MS) return;
    if (!this.loading) {
      this.loading = this.reload()
        .then(() => {
          this.loadedAt = Date.now();
        })
        .finally(() => {
          this.loading = null;
        });
    }
    // A stale graph keeps serving while the refresh runs; only a cold start waits.
    if (this.cache) {
      this.loading.catch(() => {}); // failed refresh: keep the stale graph, retry next call
      return;
    }
    return this.loading;
  }

  private async reload(): Promise<void> {
    const [allJobs, allLinks, comps, allMobs, riasec] = await Promise.all([
      this.fetchAll<{ rome_code: string; title: string; definition: string | null; domain: string | null }>(
        "rome_jobs",
        "rome_code, title, definition, domain",
      ),
      this.fetchAll<{ rome_code: string; competence_code: string }>(
        "rome_job_competences",
        "rome_code, competence_code",
      ),
      this.fetchAll<{ code: string; libelle: string; type: string | null }>(
        "rome_competences",
        "code, libelle, type",
      ),
      this.fetchAll<{ from_rome_code: string; to_rome_code: string; mobility_type: string | null }>(
        "rome_mobilites",
        "from_rome_code, to_rome_code, mobility_type",
      ),
      this.fetchAll<{ rome_code: string; riasec_code: string; rank: string }>(
        "rome_riasec",
        "rome_code, riasec_code, rank",
      ),
    ]);

    // Retired codes (0007 obsolete_at) never surface: drop the job, its links,
    // and every mobilité edge touching it. Kept in the DB, only skipped here.
    const retired = await this.retiredCodes();
    const active = (code: string) => !retired.has(code);
    const jobs = allJobs.filter((j) => active(j.rome_code));
    const links = allLinks.filter((l) => active(l.rome_code));
    const mobs = allMobs.filter((m) => active(m.from_rome_code) && active(m.to_rome_code));

    const compLabel = new Map((comps ?? []).map((c) => [c.code as string, c]));
    const compsByJob = new Map<string, RomeMetier["competences"]>();
    for (const l of links ?? []) {
      const meta = compLabel.get(l.competence_code as string);
      const arr = compsByJob.get(l.rome_code as string) ?? [];
      arr.push({
        code: l.competence_code as string,
        libelle: (meta?.libelle as string) ?? (l.competence_code as string),
        type: (meta?.type as string) ?? undefined,
      });
      compsByJob.set(l.rome_code as string, arr);
    }
    const mobByJob = new Map<string, string[]>();
    const mobEdges = new Map<string, { to: string; type: MobilityType }[]>();
    for (const m of mobs ?? []) {
      const from = m.from_rome_code as string;
      const to = m.to_rome_code as string;
      const t = m.mobility_type as string | null;
      const type: MobilityType = t === "Proche" || t === "Evolution" ? t : null;
      (mobByJob.get(from) ?? mobByJob.set(from, []).get(from)!).push(to);
      (mobEdges.get(from) ?? mobEdges.set(from, []).get(from)!).push({ to, type });
    }
    const rankedByJob = new Map<string, RankedRiasec[]>();
    for (const r of riasec ?? []) {
      const arr = rankedByJob.get(r.rome_code as string) ?? [];
      arr.push({
        code: r.riasec_code as RiasecCode,
        rank: ((r.rank as string) === "minor" ? "minor" : "major") as RiasecRank,
      });
      rankedByJob.set(r.rome_code as string, arr);
    }

    const metiers: RomeMetier[] = (jobs ?? []).map((j) => {
      const ranked = rankedByJob.get(j.rome_code as string) ?? [];
      return {
        romeCode: j.rome_code as string,
        title: j.title as string,
        domain: (j.domain as string) ?? "",
        definition: (j.definition as string) ?? undefined,
        competences: compsByJob.get(j.rome_code as string) ?? [],
        metiersProches: mobByJob.get(j.rome_code as string) ?? [],
        // flat letters (rank-agnostic) for back-compat + ranked for the weighted leap
        riasec: [...new Set(ranked.map((x) => x.code))],
        riasecRanked: ranked,
      };
    });

    const byCode = new Map<string, RomeMetier>();
    const byCompetence = new Map<string, RomeMetier[]>();
    for (const m of metiers) {
      byCode.set(m.romeCode, m);
      for (const c of m.competences) {
        const arr = byCompetence.get(c.code) ?? [];
        arr.push(m);
        byCompetence.set(c.code, arr);
      }
    }
    this.cache = metiers;
    this.byCode = byCode;
    this.byCompetence = byCompetence;
    this.mobilityEdges = mobEdges;
    this.rarity = buildCompetenceRarity(metiers);
  }

  async allMetiers(): Promise<RomeMetier[]> {
    await this.load();
    return this.cache!;
  }

  async getMetier(romeCode: string): Promise<RomeMetier | null> {
    await this.load();
    return this.byCode!.get(romeCode) ?? null;
  }

  async metiersWithCompetence(competenceCode: string): Promise<RomeMetier[]> {
    await this.load();
    return this.byCompetence!.get(competenceCode) ?? [];
  }

  async getMobilites(romeCode: string): Promise<MobiliteEdge[]> {
    await this.load();
    const edges = this.mobilityEdges!.get(romeCode) ?? [];
    const out: MobiliteEdge[] = [];
    for (const e of edges) {
      const metier = this.byCode!.get(e.to);
      if (metier) out.push({ metier, mobilityType: e.type });
    }
    return out;
  }

  async competenceRarity(): Promise<CompetenceRarity> {
    await this.load();
    return this.rarity!;
  }
}
