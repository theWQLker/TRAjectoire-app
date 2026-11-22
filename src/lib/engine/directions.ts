import { getRomeSource, rarityOf } from "@/lib/rome";
import { SEED_ANSWER_KEY, EXCLUDE_ANSWER_KEY, buildInventory, type Answers } from "@/lib/quiz/build-inventory";
import { CLUSTERS } from "../../../config/clusters";
import { CATEGORIES, LEAN_WEIGHTS, type Lean } from "../../../config/quiz";
import { FAMILIES } from "../../../config/families";
import ROME_CAPACITIES from "../../../config/rome-capacities.json";
import {
  CAPACITY_NAMES,
  VAGUE_CAPACITIES,
  SECTOR_BY_GRAND_DOMAINE,
  SECTOR_K,
  SECTOR_K_OTHER,
  SECTOR_M,
} from "../../../config/naming";
import { signalStrength } from "./coverage";
import { buildResults, type ResultDirection, type Results } from "./results";

/**
 * DIRECTIONS LAYER (v7, decisions 2026-11-21 items 1-7; ported from
 * scripts/directions-prototype.ts with the rules unchanged).
 *
 * The engine's top roles are grouped by the ROME objectif that drives them
 * (their "main capacity"). A group becomes a direction only when it clears the
 * evidence bar; everything else stays a role ("Autres pistes"). Display layer
 * only: no rank, bucket, tier or market signal is changed here.
 *
 *   1. Révélée = counterfactual: most member roles entered the top roles, or
 *      rank higher, because of the answers (same user, seed only) AND share, in
 *      the direction's capacity, a skill only the answers gave. No seed → no tag.
 *   2. Evidence bar: ≥ 3 distinct shared distinctive skills (idf above the
 *      generic floor) in the main capacity; a révélée direction also needs ≥ 2
 *      different quiz scenes behind it. Applied before the 5 slots are filled.
 *   4. Named by the main capacity only (naming draft); a second capacity is a
 *      subline. 6. Révélée first. 7. Autres pistes: role, sector, signal; the
 *      "faible" ones are counted, not listed.
 */

// ---------------------------------------------------------------------------
// Rules (values from the 2026-11-21 decisions; changing one changes results)
// ---------------------------------------------------------------------------
export const DIRECTION_RULES = {
  /** Roles considered, in display order. */
  TOP_ROLES: 40,
  /** A role's driving capacities cover this share of its distinctive weight… */
  DRIVING_SHARE: 0.6,
  /** …with at most this many capacities. */
  MAX_DRIVING: 2,
  MAX_DIRECTIONS: 5,
  /** Decision item 2: distinct shared distinctive skills in the main capacity. */
  MIN_EVIDENCE: 3,
  /** Decision item 2: different quiz scenes behind a révélée direction. */
  MIN_ANSWERS_REVEALED: 2,
} as const;

/** The engine's generic floor: an idf at or below it is a generic skill. */
const GENERIC_FLOOR = Number(process.env.RARITY_GENERIC_FLOOR ?? "3");

// ---------------------------------------------------------------------------
// ROME capacities and names
// ---------------------------------------------------------------------------
const CAP = ROME_CAPACITIES as {
  romeVersion: number;
  publishedOn: string;
  objectifs: Record<string, string>;
  domaines: Record<string, string>;
  capacity: Record<string, string>;
};

/** ROME objectif of a competence or macro-competence code; null for savoirs and unknown codes. */
export function capacityOf(code: string): string | null {
  const obj = CAP.capacity[code];
  return obj ? CAP.objectifs[obj] ?? null : null;
}

/** ROME domaine professionnel of a role ("Force de vente"), or null. */
export function domaineOf(romeCode: string): string | null {
  return CAP.domaines[romeCode.slice(0, 3)] ?? null;
}

export const ROME_CAPACITIES_VERSION = { romeVersion: CAP.romeVersion, publishedOn: CAP.publishedOn };

const loose = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/[’']/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
const NAMES_LOOSE = new Map(Object.entries(CAPACITY_NAMES).map(([k, v]) => [loose(k), v]));

export type NameFlag = "absent" | "vague" | "loose" | null;

/** Direction name of a ROME objectif (naming draft), and why it is flagged. */
export function capacityName(objectif: string): { name: string; flag: NameFlag } {
  const exact = CAPACITY_NAMES[objectif];
  const name = exact ?? NAMES_LOOSE.get(loose(objectif));
  if (!name) return { name: objectif, flag: "absent" };
  if (VAGUE_CAPACITIES.has(name)) return { name, flag: "vague" };
  return { name, flag: exact ? null : "loose" };
}

/** Sector label of a role (naming draft): by grand domaine, K and M by domaine professionnel. */
export function sectorLabel(romeCode: string): { label: string; flag: boolean } {
  const letter = romeCode[0];
  const dp = domaineOf(romeCode) ?? "";
  if (letter === "K") {
    const v = SECTOR_K[dp];
    return v ? { label: v, flag: false } : { label: SECTOR_K_OTHER, flag: true };
  }
  if (letter === "M") {
    const v = SECTOR_M[dp];
    return v ? { label: v, flag: false } : { label: dp, flag: true };
  }
  const v = SECTOR_BY_GRAND_DOMAINE[letter];
  return v ? { label: v, flag: false } : { label: dp, flag: true };
}

// ---------------------------------------------------------------------------
// Provenance: which answer, and which seed niche, brought each code
// ---------------------------------------------------------------------------
export type AnswerSource = { sceneId: string; prompt: string; option: string; cluster: string };

const CLUSTER_CODES = new Map(CLUSTERS.map((c) => [c.id, c.competenceCodes]));
const CLUSTER_SCENES = new Set(
  CATEGORIES.flatMap((cat) =>
    cat.scenes
      .filter((s) => [s.optionA, s.optionB].some((o) => (o.maps.clusters?.length ?? 0) > 0 || (o.maps.riasec?.length ?? 0) > 0))
      .map((s) => s.id),
  ),
);

/**
 * Code → the answered options that put it in the inventory. A side the user
 * gave no weight, or a context-only side (decision 2026-11-22: it feeds the
 * lean, never codes), is never a source.
 */
export function answerSources(answers: Answers): Map<string, AnswerSource[]> {
  const byCode = new Map<string, AnswerSource[]>();
  for (const cat of CATEGORIES) {
    for (const s of cat.scenes) {
      const raw = answers[s.id];
      if (!raw || !(raw in LEAN_WEIGHTS)) continue;
      const w = LEAN_WEIGHTS[raw as Lean];
      for (const [opt, weight] of [[s.optionA, w.a], [s.optionB, w.b]] as const) {
        if (weight <= 0 || opt.maps.contextOnly) continue;
        for (const c of opt.maps.clusters ?? []) {
          for (const code of CLUSTER_CODES.get(c.id) ?? []) {
            const list = byCode.get(code) ?? [];
            list.push({ sceneId: s.id, prompt: s.prompt, option: opt.label, cluster: c.id });
            byCode.set(code, list);
          }
        }
      }
    }
  }
  return byCode;
}

/** Seed code → the label of the picked niche it came from ("Tech : Développement"). */
function seedSources(answers: Answers, seeded: ReadonlySet<string>): Map<string, string> {
  const byCode = new Map<string, string>();
  for (const pick of (answers[SEED_ANSWER_KEY] ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const [fam, dep] = pick.split(":");
    const f = FAMILIES.find((x) => x.id === fam);
    const d = f?.depths.find((x) => x.id === dep);
    if (!f || !d) continue;
    for (const c of d.seedCodes) if (seeded.has(c) && !byCode.has(c)) byCode.set(c, `${f.label} : ${d.label}`);
  }
  return byCode;
}

/**
 * The same user without the answers (decision item 1): the seed, its
 * exclusions and every non-scoring answer (zones, diploma, level and
 * constraint scenes) are kept; every scene that feeds skills or interests is
 * dropped.
 */
export function seedOnlyAnswers(answers: Answers): Answers {
  return Object.fromEntries(Object.entries(answers).filter(([k]) => !CLUSTER_SCENES.has(k)));
}

export function hasSeed(answers: Answers): boolean {
  return (answers[SEED_ANSWER_KEY] ?? "").split(",").some((s) => s.trim());
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
export type DirectionKind = "revelee" | "continuite" | null;

export type DirectionRole = {
  role: ResultDirection;
  /** ROME objectifs driving this role (1 or 2). */
  driving: string[];
  /** Joined through its second capacity (not founding). */
  attached: boolean;
  /** Entered the top roles, or rose, with the answers AND shares an answer-only skill here. */
  broughtByAnswers: boolean;
};

export type QuotedAnswer = {
  sceneId: string;
  /** The scene's prompt and the option the user leaned to, verbatim. */
  prompt: string;
  option: string;
  /** Distinct skills of this direction's roles that this answer gave. */
  skills: number;
};

export type Direction = {
  /** ROME objectif wording of the main capacity, and its draft name. */
  capacity: string;
  name: string;
  nameFlag: NameFlag;
  /** Second capacity (ROME wording and name), shown as a subline; null when none. */
  second: { capacity: string; name: string } | null;
  kind: DirectionKind;
  /** Distinct shared distinctive skills in the main capacity (≥ MIN_EVIDENCE). */
  evidence: number;
  /** Distinct quiz scenes behind the direction. */
  answerScenes: number;
  answers: QuotedAnswer[];
  /** The seed niche behind it, when a seed code sits in its capacities. */
  seedNiche: string | null;
  roles: DirectionRole[];
  /** Sum of member coherenceRank: the order among directions of the same kind. */
  strength: number;
};

export type DroppedGroup = {
  capacity: string;
  name: string;
  roles: number;
  reason: { kind: "evidence"; evidence: number } | { kind: "revealed-scenes"; scenes: number };
};

export type Directions = {
  directions: Direction[];
  /** Top roles in no direction, signal moyen or fort, in display order. */
  others: ResultDirection[];
  /** Top roles in no direction at signal faible: counted, not listed. */
  othersFaible: ResultDirection[];
  /** Groups the evidence bar removed (counted for the honesty gate). */
  dropped: DroppedGroup[];
  seeded: boolean;
  answered: boolean;
};

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------
type Role = { d: ResultDirection; profile: Map<string, number>; driving: string[] };
type Group = { cap: string; rs: Role[]; strength: number; attached: Set<string> };

/** Display order of the surfaced roles (wildcard pinned, coherenceRank, coverage). */
function displayOrder(roles: ResultDirection[]): ResultDirection[] {
  return [...roles].sort(
    (a, b) =>
      Number(b.isWildcard ?? false) - Number(a.isWildcard ?? false) ||
      b.coherenceRank - a.coherenceRank ||
      b.coverage - a.coverage,
  );
}

export type DirectionsInput = {
  results: Results;
  answers: Answers;
  /** idf of a code (the engine's rarity). */
  idf: (code: string) => number;
  /** Display order of role codes for the same user with the seed only; null without seed or answers. */
  seedOnlyOrder: string[] | null;
};

export function buildDirections({ results, answers, idf, seedOnlyOrder }: DirectionsInput): Directions {
  const R = DIRECTION_RULES;
  const drive = (c: string) => Math.max(0, idf(c) - GENERIC_FLOOR);
  const fromAnswers = answerSources(answers);
  const seededCodes = new Set(results.inventory.seededCodes ?? []);
  const fromSeed = seedSources(answers, seededCodes);
  const seeded = hasSeed(answers);
  const answered = fromAnswers.size > 0;

  const ordered = displayOrder(results.directions);
  const roles: Role[] = ordered.slice(0, R.TOP_ROLES).map((d) => {
    const profile = new Map<string, number>();
    for (const c of d.matchedCompetenceCodes) {
      const cap = capacityOf(c);
      if (!cap) continue;
      profile.set(cap, (profile.get(cap) ?? 0) + drive(c));
    }
    const total = [...profile.values()].reduce((s, v) => s + v, 0);
    const driving: string[] = [];
    let cum = 0;
    for (const [cap, v] of [...profile.entries()].sort((a, b) => b[1] - a[1])) {
      if (driving.length >= R.MAX_DRIVING || v <= 0) break;
      driving.push(cap);
      cum += v;
      if (cum >= R.DRIVING_SHARE * total) break;
    }
    return { d, profile, driving };
  });

  // Counterfactual (item 1): moved = entered the top roles or ranks higher with the answers.
  const moved = new Set<string>();
  if (seeded) {
    const order = answered && seedOnlyOrder ? seedOnlyOrder : ordered.map((d) => d.romeCode);
    const seedRank = new Map(order.map((c, i) => [c, i]));
    for (const [i, r] of roles.entries()) {
      const sr = seedRank.get(r.d.romeCode);
      if (sr === undefined || sr >= R.TOP_ROLES || sr > i) moved.add(r.d.romeCode);
    }
  }

  const eligible = (r: Role) => signalStrength(r.d.matchRaritySum) !== "exploratory" && r.driving.length > 0;
  const byCap = new Map<string, Role[]>();
  for (const r of roles.filter(eligible)) byCap.set(r.driving[0], [...(byCap.get(r.driving[0]) ?? []), r]);
  const multi: Group[] = [...byCap.entries()]
    .filter(([, rs]) => rs.length >= 2)
    .map(([cap, rs]) => ({ cap, rs, strength: rs.reduce((s, r) => s + r.d.coherenceRank, 0), attached: new Set<string>() }))
    .sort((a, b) => b.strength - a.strength);

  type Built = Direction & { thin: DroppedGroup["reason"] | null };
  const build = (g: Group): Built => {
    const second = new Map<string, number>();
    for (const r of g.rs) {
      const other = r.driving.find((c) => c !== g.cap);
      if (other) second.set(other, (second.get(other) ?? 0) + 1);
    }
    const sec = [...second.entries()].sort((a, b) => b[1] - a[1])[0];
    const capacities = sec && sec[1] * 2 >= g.rs.length ? [g.cap, sec[0]] : [g.cap];
    const capSet = new Set(capacities);

    const hits = new Map<string, { src: AnswerSource; skills: Set<string> }>();
    const evidence = new Set<string>();
    let seedNiche: string | null = null;
    for (const r of g.rs) {
      for (const c of r.d.matchedCompetenceCodes) {
        const capOf = capacityOf(c);
        if (capOf === g.cap && idf(c) > GENERIC_FLOOR) evidence.add(c);
        if (!capOf || !capSet.has(capOf)) continue;
        const S = fromSeed.get(c);
        if (S) seedNiche = S;
        for (const src of fromAnswers.get(c) ?? []) {
          const k = `${src.sceneId}|${src.option}`;
          const hit = hits.get(k) ?? { src, skills: new Set<string>() };
          hit.skills.add(c);
          hits.set(k, hit);
        }
      }
    }
    const answers = [...hits.values()]
      .map((h) => ({ sceneId: h.src.sceneId, prompt: h.src.prompt, option: h.src.option, skills: h.skills.size }))
      .sort((a, b) => b.skills - a.skills);
    const answerScenes = new Set(answers.map((a) => a.sceneId)).size;
    const broughtBy = (r: Role) =>
      moved.has(r.d.romeCode) &&
      r.d.matchedCompetenceCodes.some((c) => {
        const capOf = capacityOf(c);
        return !!capOf && capSet.has(capOf) && fromAnswers.has(c) && !fromSeed.has(c);
      });
    const members: DirectionRole[] = g.rs.map((r) => ({
      role: r.d,
      driving: r.driving,
      attached: g.attached.has(r.d.romeCode),
      broughtByAnswers: broughtBy(r),
    }));
    const byAnswers = members.filter((m) => m.broughtByAnswers).length;
    const kind: DirectionKind = seeded ? (byAnswers * 2 > members.length ? "revelee" : "continuite") : null;
    const thin: Built["thin"] =
      evidence.size < R.MIN_EVIDENCE
        ? { kind: "evidence", evidence: evidence.size }
        : kind === "revelee" && answerScenes < R.MIN_ANSWERS_REVEALED
          ? { kind: "revealed-scenes", scenes: answerScenes }
          : null;
    const main = capacityName(g.cap);
    return {
      capacity: g.cap,
      name: main.name,
      nameFlag: main.flag,
      second: capacities[1] ? { capacity: capacities[1], name: capacityName(capacities[1]).name } : null,
      kind,
      evidence: evidence.size,
      answerScenes,
      answers,
      seedNiche,
      roles: members,
      strength: g.strength,
      thin,
    };
  };

  // A left-out role joins the strongest chosen direction whose capacity is its second driver.
  const attach = (chosen: Group[]) => {
    const placed = new Set(chosen.flatMap((g) => g.rs.map((r) => r.d.romeCode)));
    for (const r of roles) {
      if (placed.has(r.d.romeCode) || r.driving.length < 2) continue;
      if (signalStrength(r.d.matchRaritySum) === "exploratory") continue;
      const home = chosen.find((g) => g.cap === r.driving[1]);
      if (!home) continue;
      home.rs.push(r);
      home.attached.add(r.d.romeCode);
      placed.add(r.d.romeCode);
    }
    return chosen;
  };

  const toDropped = (b: Built): DroppedGroup => ({ capacity: b.capacity, name: b.name, roles: b.roles.length, reason: b.thin! });
  // The evidence bar first, so a thin group never takes a slot.
  const candidates = multi.map(build);
  const dropped = candidates.filter((b) => b.thin).map(toDropped);
  const keptCaps = new Set(candidates.filter((b) => !b.thin).slice(0, R.MAX_DIRECTIONS).map((b) => b.capacity));
  const chosen = attach(multi.filter((g) => keptCaps.has(g.cap)).map((g) => ({ ...g, rs: [...g.rs], attached: new Set<string>() }))).map(build);
  // Attachment can flip a direction to révélée; re-check the bar.
  for (const b of chosen.filter((x) => x.thin)) dropped.push(toDropped(b));
  const directions: Direction[] = chosen
    .filter((b) => !b.thin)
    .sort((a, b) => Number(b.kind === "revelee") - Number(a.kind === "revelee") || b.strength - a.strength)
    .map(({ thin: _thin, ...d }) => d);

  const inDirection = new Set(directions.flatMap((d) => d.roles.map((m) => m.role.romeCode)));
  const rest = roles.filter((r) => !inDirection.has(r.d.romeCode)).map((r) => r.d);
  return {
    directions,
    others: rest.filter((d) => signalStrength(d.matchRaritySum) !== "exploratory"),
    othersFaible: rest.filter((d) => signalStrength(d.matchRaritySum) === "exploratory"),
    dropped,
    seeded,
    answered,
  };
}

// ---------------------------------------------------------------------------
// Async entry: rarity + the seed-only counterfactual
// ---------------------------------------------------------------------------

/** Seed-only display orders, shared across sessions with the same seed-only answers. */
const SEED_ONLY_TTL_MS = 10 * 60_000;
const SEED_ONLY_MAX = 50;
const seedOnlyCache = new Map<string, { at: number; value: Promise<string[]> }>();

function seedOnlyOrderFor(answers: Answers): Promise<string[]> {
  const only = seedOnlyAnswers(answers);
  const key = JSON.stringify(Object.entries(only).sort(([a], [b]) => a.localeCompare(b)));
  const hit = seedOnlyCache.get(key);
  if (hit && Date.now() - hit.at < SEED_ONLY_TTL_MS) return hit.value;
  const value = buildResults(buildInventory(only, { unknownKeys: "warn" })).then((r) =>
    displayOrder(r.directions).map((d) => d.romeCode),
  );
  seedOnlyCache.set(key, { at: Date.now(), value });
  value.catch(() => {
    if (seedOnlyCache.get(key)?.value === value) seedOnlyCache.delete(key);
  });
  while (seedOnlyCache.size > SEED_ONLY_MAX) seedOnlyCache.delete(seedOnlyCache.keys().next().value as string);
  return value;
}

/** Directions for a result set and the answers behind it. */
export async function computeDirections(results: Results, answers: Answers): Promise<Directions> {
  const source = getRomeSource();
  const [rarity, metiers] = await Promise.all([source.competenceRarity(), source.allMetiers()]);
  const N = metiers.length;
  const idf = (c: string) => rarityOf(rarity, c, N);
  const answered = answerSources(answers).size > 0;
  const seedOnlyOrder = hasSeed(answers) && answered ? await seedOnlyOrderFor(answers) : null;
  return buildDirections({ results, answers, idf, seedOnlyOrder });
}

/** Kept for callers that need the reserved key names next to the directions. */
export { SEED_ANSWER_KEY, EXCLUDE_ANSWER_KEY };
