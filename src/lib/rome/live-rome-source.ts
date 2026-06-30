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

export class LiveRomeSource implements RomeSource {
  private token: { value: string; expiresAt: number } | null = null;
  private cache: RomeMetier[] | null = null;
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
   */
  private async fetchAll<T>(
    table: string,
    columns: string,
  ): Promise<T[]> {
    const db = getSupabaseServiceClient();
    const PAGE = 1000;
    const out: T[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await db
        .from(table)
        .select(columns)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`LiveRomeSource read failed (${table}): ${error.message}`);
      if (!data || data.length === 0) break;
      out.push(...(data as T[]));
      if (data.length < PAGE) break; // last (short) page
    }
    return out;
  }

  private async load(): Promise<void> {
    if (this.cache) return;

    const [jobs, links, comps, mobs, riasec] = await Promise.all([
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
