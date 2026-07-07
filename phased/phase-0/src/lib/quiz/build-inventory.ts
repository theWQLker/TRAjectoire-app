import type { Inventory } from "@/lib/engine/inventory";
import type { RiasecCode } from "@/lib/rome";
import {
  CATEGORIES,
  LEAN_WEIGHTS,
  type Lean,
  type SideMapping,
  type QuickPick,
} from "../../../config/quiz";
import { seedCodesFor } from "../../../config/families";

/**
 * Reserved answer key carrying the front-door SEED+DEPTH picks: a comma-joined
 * list of "familyId:depthId" tokens (e.g. "tech:code"). Set at quiz start, before
 * the cognitive scenes. Empty / absent → no seeding (the quiz behaves exactly as
 * before), so the seam is opt-in and back-compatible.
 */
export const SEED_ANSWER_KEY = "seed_families";

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

/** Apply one side's mapping at the given weight into the score accumulators. */
function applySide(
  side: SideMapping,
  weight: number,
  clusterScores: Map<string, number>,
  riasecScores: Map<RiasecCode, number>,
): void {
  if (weight <= 0) return;
  for (const cw of side.clusters ?? []) {
    clusterScores.set(cw.id, (clusterScores.get(cw.id) ?? 0) + cw.weight * weight);
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
export function buildInventory(answers: Answers): Inventory {
  const clusterScores = new Map<string, number>();
  const riasecScores = new Map<RiasecCode, number>();
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
      applySide(scene.optionA.maps, w.a, clusterScores, riasecScores);
      applySide(scene.optionB.maps, w.b, clusterScores, riasecScores);
    }

    for (const qp of category.quickPicks) {
      applyQuickPick(qp, answers[qp.id], constraints, financial);
    }
  }

  const competenceCodes = new Set<string>();

  // SEED front door: picked families inject their real competence codes.
  const seedPicks = (answers[SEED_ANSWER_KEY] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seededCodes = new Set<string>();
  for (const code of seedCodesFor(seedPicks)) {
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
    riasec,
    clusterScores: Object.fromEntries(
      [...clusterScores.entries()].filter(([, s]) => s > 0).sort(),
    ),
    riasecScores: Object.fromEntries(
      [...riasecScores.entries()].filter(([, s]) => s > 0),
    ) as Inventory["riasecScores"],
    constraints,
    ...(Object.keys(financial).length ? { financial_inputs: financial } : {}),
  };
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
    case "financial":
      (financial as Record<string, string>)[qp.target.field] = values[0];
      break;
  }
}
