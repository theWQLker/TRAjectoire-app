/**
 * RomeMetier (PRD §3b / §6). A node in the ROME leap-graph.
 *
 * Mirrors the shape the ROME 4.0 Fiches Métiers API + RIASEC CSV deliver
 * (PRD §3b table), so the FixtureRomeSource → LiveRomeSource swap is
 * zero-change. The ROME referential is separate from offers: it is the graph
 * the engine TRAVERSES (§6.2), not fetched per request.
 */
export type RiasecCode = "R" | "I" | "A" | "S" | "E" | "C";

/** RIASEC rank from the codification CSV: a métier's MAJOR vs MINOR interest. */
export type RiasecRank = "major" | "minor";

/** One ranked RIASEC entry — the major/minor distinction the interest leap weights (§6.2.D). */
export type RankedRiasec = { code: RiasecCode; rank: RiasecRank };

export type RomeCompetence = {
  code: string;
  libelle: string;
  /** savoir-faire / savoirs / savoir-être (PRD §3b) */
  type?: string;
};

export type RomeMetier = {
  romeCode: string;
  title: string;
  domain: string;
  /** savoir-faire / savoirs / savoir-être codes — the skill-bridge edges (§6.2.B) */
  competences: RomeCompetence[];
  /** curated adjacency: ROME `metiersProches` / mobilités neighbours (§6.2.C) */
  metiersProches: string[];
  /** Holland interest profile, CSV-seeded (§3b, §6.2.D). Flat letters, rank-agnostic. */
  riasec: RiasecCode[];
  /**
   * Same profile WITH the major/minor rank when available (LiveRomeSource).
   * Optional so fixtures (flat `riasec` only) keep working. The interest leap
   * uses this to weight a major match above a minor one (§6.2.D).
   */
  riasecRanked?: RankedRiasec[];
  definition?: string;
};
