import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { RomeMetier } from "./rome-metier";
import type { MobiliteEdge, RomeSource } from "./rome-source";
import { buildCompetenceRarity, type CompetenceRarity } from "./competence-rarity";

/**
 * FixtureRomeSource (PRD §3b). Reads JSON files from /fixtures/rome/*.json,
 * each an array of RomeMetier shaped exactly like the loaded referential.
 *
 * Server/Node-only (uses fs). The engine treats this identically to the future
 * LiveRomeSource — same interface, same return shape. Builds in-memory indexes
 * once (by code, by competence) so traversal lookups are O(1).
 */
export class FixtureRomeSource implements RomeSource {
  private readonly fixturesDir: string;
  private metiers: RomeMetier[] | null = null;
  private byCode: Map<string, RomeMetier> | null = null;
  private byCompetence: Map<string, RomeMetier[]> | null = null;
  private rarity: CompetenceRarity | null = null;

  constructor(fixturesDir?: string) {
    this.fixturesDir =
      fixturesDir ?? path.join(process.cwd(), "fixtures", "rome");
  }

  private async load(): Promise<void> {
    if (this.metiers) return;

    const entries = await readdir(this.fixturesDir);
    const jsonFiles = entries.filter((f) => f.endsWith(".json"));

    const all: RomeMetier[] = [];
    for (const file of jsonFiles) {
      const raw = await readFile(path.join(this.fixturesDir, file), "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error(
          `ROME fixture ${file} must be a JSON array of RomeMetier, got ${typeof parsed}.`,
        );
      }
      all.push(...(parsed as RomeMetier[]));
    }

    const byCode = new Map<string, RomeMetier>();
    const byCompetence = new Map<string, RomeMetier[]>();
    for (const m of all) {
      byCode.set(m.romeCode, m);
      for (const c of m.competences) {
        const list = byCompetence.get(c.code) ?? [];
        list.push(m);
        byCompetence.set(c.code, list);
      }
    }

    this.metiers = all;
    this.byCode = byCode;
    this.byCompetence = byCompetence;
    this.rarity = buildCompetenceRarity(all);
  }

  async allMetiers(): Promise<RomeMetier[]> {
    await this.load();
    return this.metiers!;
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
    const m = this.byCode!.get(romeCode);
    if (!m) return [];
    // Fixtures don't label edge types → mobilityType null (the proposer then
    // treats the edge as a neutral mobilité, no Proche/Evolution weighting).
    return m.metiersProches
      .map((code) => this.byCode!.get(code))
      .filter((x): x is RomeMetier => x != null)
      .map((metier) => ({ metier, mobilityType: null }));
  }

  async competenceRarity(): Promise<CompetenceRarity> {
    await this.load();
    return this.rarity!;
  }
}
