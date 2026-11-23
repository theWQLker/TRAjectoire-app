import type { Inventory } from "@/lib/engine/inventory";
import type { RiasecCode } from "@/lib/rome";
import { CLUSTERS } from "../../../config/clusters";
import {
  CATEGORIES,
  LEAN_WEIGHTS,
  TENSION_MAP,
  FINANCIAL_MAP,
  type Lean,
  type Scene,
  type SideMapping,
  type QuickPick,
} from "../../../config/quiz";
import { resolvePicks, seedCodesFor, seedCodesWithExclusions } from "../../../config/families";

/**
 * Reserved answer key carrying the front-door SEED+DEPTH picks: a comma-joined
 * list of "familyId:depthId" tokens (e.g. "tech:code"). Set at quiz start, before
 * the cognitive scenes. Empty / absent → no seeding (the quiz behaves exactly as
 * before), so the seam is opt-in and back-compatible.
 */
export const SEED_ANSWER_KEY = "seed_families";

/**
 * Reserved answer key carrying OPT-IN job-level exclusions within picked niches.
 * Format: ";"-separated "pickToken=rome1,rome2" entries — e.g.
 * "commerce:caisse=D1507,D1510". Absent/empty → no exclusion (identical to today).
 * A rejected job's codes are dropped from the seed ONLY where no other kept member
 * of the same niche carries them (see seedCodesWithExclusions); it never censors
 * the engine — a rejected job that's still a strong match surfaces flagged.
 */
export const EXCLUDE_ANSWER_KEY = "seed_exclusions";

/** Parse the exclusions answer into { pickToken: [rejectedRome, …] }. */
function parseExclusions(raw: string | undefined): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const entry of (raw ?? "").split(";").map((s) => s.trim()).filter(Boolean)) {
    const [pick, romes] = entry.split("=");
    if (!pick || !romes) continue;
    out[pick] = romes.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return out;
}

/**
 * Answers → Inventory (quiz-full-spec → PRD §6.1). Deterministic, no LLM.
 *
 * The answer payload has two shapes, both produced by the quiz UI:
 *   - scenes:     sceneId    → Lean   (one of the six lean values)
 *   - quick-picks quickPickId → optionId (a single selected option)
 *
 * Weighted accumulation (quiz-full-spec answer model):
 *   plutôt   → 1.0 to that side
 *   un peu   → 0.5 to that side
 *   les deux → 0.5 to BOTH sides
 *   ni l'un  → 0 (no weight; mild low-fit signal, tie-break only)
 * A side's weight multiplies each `cluster +N` to give the cluster contribution,
 * and adds the side weight to each RIASEC letter that side leans toward.
 *
 * Category gating: only categories the user answered contribute. A partial set
 * of answers yields a partial Inventory → partial /results.
 */

/** Scene answers (sceneId → Lean) and quick-pick answers (id → optionId). */
export type Answers = Record<string, string>;

/**
 * Questions removed because nothing read their value (data minimisation).
 * Sessions stored before then still carry them: they load without an
 * unknown-key error, count for nothing, and are not stored again
 * (currentAnswers).
 * - Round 3 (2026-11-23), quick-picks: c_urgency (constraints.urgency) and
 *   ar_situation (financial_inputs.situation_actuelle).
 * - Round 4 (2026-11-23), scenes: the seven constraint scenes (tensions and
 *   urgency) and five money scenes (financial inputs); text parked in
 *   docs/parked/2026-11-23_cut-quiz-scenes.md. And ar_salaire_min, replaced by
 *   c_accept_lower: its old value is carried over first (LEGACY_SALARY).
 */
export const RETIRED_ANSWER_KEYS: ReadonlySet<string> = new Set([
  "c_urgency",
  "ar_situation",
  "c_hours",
  "c_mobility",
  "c_timeline",
  "c_remote_presence",
  "c_physical",
  "c_social_energy",
  "c_training_length",
  "ar_security_upside",
  "ar_employee_own",
  "ar_income_floor_growth",
  "ar_commission_fixed",
  "ar_side_project",
  "ar_salaire_min",
]);

/**
 * Old salary floor → « Accepteriez-vous un métier qui demande moins que votre
 * diplôme ? ». The floor only ever did one thing: under 1 800 € it switched the
 * level demote off. So under 1 800 € → oui, the other bands → non; unanswered
 * stays unanswered, and an answer to the new question wins.
 */
const LEGACY_SALARY: Record<string, "oui" | "non"> = {
  lt1500: "oui",
  "1500_1800": "oui",
  "1800_2200": "non",
  "2200_2700": "non",
  gt2700: "non",
};

/**
 * Stored seed tokens → current tokens (family split, 2026-11-23). A session or a
 * draft saved before the split holds tokens like `services:securite` or
 * `admin:juridique`; the seed step only recognises current tokens, so answers
 * are rewritten through config/family-aliases.ts before any screen sees them.
 * The seed codes are the same either way (the loaders resolve aliases too). The
 * bare `services` value becomes the six depths that family held.
 */
function currentSeedTokens(raw: string): string {
  const picks = raw.split(",").map((t) => t.trim()).filter(Boolean);
  return [...new Set(resolvePicks(picks))].join(",");
}

/** Exclusions (`token=ROME,ROME;…`) re-keyed to current tokens, same jobs. */
function currentExclusionTokens(raw: string): string {
  const byPick = new Map<string, string[]>();
  for (const entry of raw.split(";").map((e) => e.trim()).filter(Boolean)) {
    const [pick, romes] = entry.split("=");
    if (!pick || !romes) continue;
    const list = romes.split(",").map((r) => r.trim()).filter(Boolean);
    for (const p of resolvePicks([pick])) byPick.set(p, [...new Set([...(byPick.get(p) ?? []), ...list])]);
  }
  return [...byPick].map(([p, list]) => `${p}=${list.join(",")}`).join(";");
}

/**
 * The answers as the current quiz asks them: old salary carried over, old seed
 * tokens rewritten to current ones, retired keys dropped.
 */
export function currentAnswers(answers: Answers): Answers {
  const carried = answers.ar_salaire_min ? LEGACY_SALARY[answers.ar_salaire_min] : undefined;
  const out: Answers = Object.fromEntries(Object.entries(answers).filter(([k]) => !RETIRED_ANSWER_KEYS.has(k)));
  if (carried && !out.c_accept_lower) out.c_accept_lower = carried;
  if (out[SEED_ANSWER_KEY]) out[SEED_ANSWER_KEY] = currentSeedTokens(out[SEED_ANSWER_KEY]);
  if (out[EXCLUDE_ANSWER_KEY]) out[EXCLUDE_ANSWER_KEY] = currentExclusionTokens(out[EXCLUDE_ANSWER_KEY]);
  return out;
}

/**
 * Every answer key the inventory reads: scene ids, quick-pick ids, and the two
 * reserved seed keys. Anything else is ignored by scoring; a retired quick-pick
 * is ignored without being reported as unknown.
 */
const KNOWN_ANSWER_KEYS: ReadonlySet<string> = new Set([
  ...CATEGORIES.flatMap((c) => [...c.scenes.map((s) => s.id), ...c.quickPicks.map((q) => q.id)]),
  SEED_ANSWER_KEY,
  EXCLUDE_ANSWER_KEY,
  ...RETIRED_ANSWER_KEYS,
]);

/** Answer keys no scene, quick-pick or seed field reads (e.g. a retired scene id). */
export function unknownAnswerKeys(answers: Answers): string[] {
  return Object.keys(answers).filter((k) => !KNOWN_ANSWER_KEYS.has(k));
}

/**
 * What to do with unknown answer keys (decision 2026-11-21). "throw" (the
 * default, used by every script) fails loudly so a stale persona sheet can't
 * silently score as if the answer were never given. "warn" (the quiz submit
 * action) logs the key names server-side and scores exactly as before. Only key
 * names are logged, never values, capped in count and length.
 */
export type BuildInventoryOptions = { unknownKeys?: "throw" | "warn" };

function reportUnknownKeys(answers: Answers, mode: "throw" | "warn"): void {
  const unknown = unknownAnswerKeys(answers);
  if (!unknown.length) return;
  const shown = unknown.slice(0, 10).map((k) => JSON.stringify(k.slice(0, 64)));
  const msg = `buildInventory: ${unknown.length} unknown answer key(s): ${shown.join(", ")}${unknown.length > 10 ? ", …" : ""}`;
  if (mode === "throw") throw new Error(msg);
  console.warn(`${msg} (ignored)`);
}

const CLUSTER_CODES = new Map(CLUSTERS.map((c) => [c.id, c.competenceCodes]));

/** Apply one side's mapping at the given weight into the score accumulators. */
function applySide(
  side: SideMapping,
  weight: number,
  clusterScores: Map<string, number>,
  riasecScores: Map<RiasecCode, number>,
  evidence: Map<string, number>,
): void {
  if (weight <= 0) return;
  for (const cw of side.clusters ?? []) {
    clusterScores.set(cw.id, (clusterScores.get(cw.id) ?? 0) + cw.weight * weight);
    // A context/preference option, or a lean-only link, feeds the lean only,
    // never the codes.
    if (!side.contextOnly && !cw.leanOnly) evidence.set(cw.id, (evidence.get(cw.id) ?? 0) + cw.weight * weight);
  }
  for (const r of side.riasec ?? []) {
    riasecScores.set(r, (riasecScores.get(r) ?? 0) + weight);
  }
}

function isLean(v: string): v is Lean {
  return v in LEAN_WEIGHTS;
}

/**
 * Build the Inventory from quiz answers. Partial-tolerant: walks every category
 * but skips scenes/quick-picks the user didn't answer.
 */
export function buildInventory(input: Answers, options: BuildInventoryOptions = {}): Inventory {
  reportUnknownKeys(input, options.unknownKeys ?? "throw");
  const answers = currentAnswers(input);
  const clusterScores = new Map<string, number>();
  const riasecScores = new Map<RiasecCode, number>();
  // Cluster weight from options that evidence a skill (not contextOnly): only
  // these clusters put competence codes into the inventory.
  const evidence = new Map<string, number>();
  const tensions: Record<string, string> = {};
  const constraints: Inventory["constraints"] = {
    departement: "75",
    departements: ["75"],
  };
  const financial: NonNullable<Inventory["financial_inputs"]> = {};

  for (const category of CATEGORIES) {
    for (const scene of category.scenes) {
      const raw = answers[scene.id];
      if (!raw || !isLean(raw)) continue;
      const lean: Lean = raw;
      const w = LEAN_WEIGHTS[lean];

      // Cluster / RIASEC accumulation (Cat 1-3; Cat 4/5 scenes carry no clusters).
      applySide(scene.optionA.maps, w.a, clusterScores, riasecScores, evidence);
      applySide(scene.optionB.maps, w.b, clusterScores, riasecScores, evidence);

      // Cat-4 tension/constraint signals: the dominant side claims the signal.
      // les_deux/ni_l_un have no dominant side → no signal recorded.
      const dominant = dominantSide(lean);
      if (dominant) applySceneSignals(scene, dominant, tensions, constraints, financial);
    }

    for (const qp of category.quickPicks) {
      applyQuickPick(qp, answers[qp.id], constraints, financial);
    }
  }

  // Codes: union over clusters an evidencing option fed (score > 0; empty-code
  // clusters add nothing; contextOnly options don't count here).
  const competenceCodes = new Set<string>();
  for (const [id, score] of evidence) {
    if (score <= 0) continue;
    for (const code of CLUSTER_CODES.get(id) ?? []) competenceCodes.add(code);
  }

  // SEED+DEPTH front-door (BUILD_BRIEF §4): a user's picked job niches inject
  // their REAL distinctive competence codes ADDITIVELY. Union, never filter — the
  // cognitive codes above remain, so cross-domain bridges + the firehose guard
  // are untouched (a seeded dev still surfaces the analyst bridges they share).
  // Rarity-weighting (idf ≈ 6.8 on these codes) lifts the seeded niche's jobs.
  const seedPicks = (answers[SEED_ANSWER_KEY] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Opt-in job-level exclusions within picked niches (empty → full seed as before).
  const exclusions = parseExclusions(answers[EXCLUDE_ANSWER_KEY]);
  const excludedJobs = Object.values(exclusions).flat();
  const codes = excludedJobs.length
    ? seedCodesWithExclusions(seedPicks, exclusions)
    : seedCodesFor(seedPicks);
  const seededCodes = new Set<string>();
  for (const code of codes) {
    competenceCodes.add(code);
    seededCodes.add(code);
  }

  const riasec = [...riasecScores.entries()]
    .filter(([, score]) => score > 0)
    .map(([letter]) => letter)
    .sort();

  return {
    competenceCodes: [...competenceCodes].sort(),
    seededCodes: [...seededCodes].sort(),
    ...(excludedJobs.length ? { excludedJobs: [...new Set(excludedJobs)].sort() } : {}),
    riasec,
    clusterScores: Object.fromEntries(
      [...clusterScores.entries()].filter(([, s]) => s > 0).sort(),
    ),
    riasecScores: Object.fromEntries(
      [...riasecScores.entries()].filter(([, s]) => s > 0),
    ) as Inventory["riasecScores"],
    constraints: {
      ...constraints,
      ...(Object.keys(tensions).length ? { tensions } : {}),
    },
    ...(Object.keys(financial).length ? { financial_inputs: financial } : {}),
  };
}

/** Which single side a lean points at, or null for les_deux / ni_l_un. */
function dominantSide(lean: Lean): "a" | "b" | null {
  if (lean === "plutot_a" || lean === "un_peu_a") return "a";
  if (lean === "plutot_b" || lean === "un_peu_b") return "b";
  return null; // les_deux / ni_l_un → ambiguous, no constraint/financial signal
}

/** Land Cat-4 tension/constraint + Cat-5 financial signals for a scene side. */
function applySceneSignals(
  scene: Scene,
  side: "a" | "b",
  tensions: Record<string, string>,
  constraints: Inventory["constraints"],
  financial: NonNullable<Inventory["financial_inputs"]>,
): void {
  const tension = TENSION_MAP[scene.id]?.[side];
  if (tension) {
    if (tension.key === "urgency") constraints.urgency = tension.value;
    else if (tension.key.startsWith("tension:")) {
      tensions[tension.key.slice("tension:".length)] = tension.value;
    }
  }

  const fin = FINANCIAL_MAP[scene.id]?.[side];
  if (fin) {
    // financial inputs are stored, consumed by nothing in the MVP (Phase 2 hook)
    (financial as Record<string, string>)[fin.field] = fin.value;
  }
}

/**
 * Land a quick-pick's selected value(s) on constraints or financial_inputs.
 * `selected` is one option id, or — for a multi quick-pick — several option ids
 * comma-joined by the UI. Multi only changes behaviour for the département field
 * (the one multi-select today), which fills the `departements` list.
 */
function applyQuickPick(
  qp: QuickPick,
  selected: string | undefined,
  constraints: Inventory["constraints"],
  financial: NonNullable<Inventory["financial_inputs"]>,
): void {
  if (!selected) return;

  // Resolve selected option id(s) → their stored values, preserving order.
  const ids = qp.multi ? selected.split(",").map((s) => s.trim()).filter(Boolean) : [selected];
  const values = ids
    .map((id) => qp.options.find((o) => o.id === id)?.value)
    .filter((v): v is string => Boolean(v));
  if (values.length === 0) return;

  switch (qp.target.kind) {
    case "constraint":
      if (qp.target.field === "departement") {
        // Multi-select département: store the full list + a primary (first).
        constraints.departements = values;
        constraints.departement = values[0];
      } else {
        constraints[qp.target.field] = values[0];
      }
      break;
    case "tension":
      (constraints.tensions ??= {})[qp.target.key] = values[0];
      break;
  }
}
