# Phase Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract three separate, independently-deployable Next.js apps
(`phased/phase-0`, `phased/phase-1`, `phased/phase-2`) from the full Trajectoire
prototype, each matching its commercial phase definition.

**Architecture:** Copy-then-simplify. Each phase is a self-contained folder with
its own `package.json`/`node_modules`. The root prototype (branch
`trajectoire-ui`) is never modified — all work lands under `phased/`. Phase 2 is
a near-verbatim copy of HEAD; Phase 1 strips the cognitive quiz; Phase 0
additionally strips the engine down to skill-bridge-only scoring. Types stay
identical across all three phases so every display component copies AS-IS.

**Tech Stack:** Next.js 16.2.9 (App Router, this repo's vendored variant — read
`node_modules/next/dist/docs/` before any Next API change), React 19.2.4,
TypeScript 5, Tailwind v4, tsx for scripts, Supabase (dormant in fixture mode).

## Global Constraints

- The root prototype and its `config/`, `src/`, `scripts/` are NEVER modified.
  All edits happen inside `phased/phase-N/` copies.
- Verification per phase, in the phase folder: `npm install`, then
  `npx tsc --noEmit` MUST be clean (zero errors), then the phase honesty script
  MUST pass.
- `CandidateDirection` and `ResultDirection` types are IDENTICAL across all
  three phases. Fields a phase doesn't compute are set to `0` (never deleted).
  Consequence: every `src/components/*`, `src/app/results/page.tsx`, and
  `src/app/results/direction|offers/*` copies AS-IS in every phase.
- Do NOT copy build artifacts: `.next/`, `node_modules/`, `*.tsbuildinfo`,
  `.vercel/`, `.playwright-mcp/`, `out/`, `build/`.
- ROME_SOURCE defaults to "fixture"; each phase must run with zero external
  services (Supabase env absent → in-memory session store, fixture data).
- French UI copy is preserved verbatim where components copy AS-IS.
- Phase 0 signal is COVERAGE-based; Phase 1+ signal is RARITY-based. Achieved via
  the `signalStrength` rewrite + `matchRaritySum = coverage` proxy in Phase 0
  (see Task 8). Confirmed decision, see design doc D1/D2.
- Phase 1 KEEPS `config/clusters.ts` (compile dependency of the full engine);
  it is inert without quiz answers. Confirmed decision (overrides product spec's
  "DELETE" for Phase 1 only).

**Reference docs:**
- Product spec: `PHASE_EXTRACTION_SPEC(2).md`
- Execution design: `docs/superpowers/specs/2026-07-08-phase-extraction-execution-design.md`

---

## File Structure

```
phased/phase-0/          ← Tasks 1–14
  package.json, tsconfig.json, postcss.config.mjs, next.config.ts,
  eslint.config.mjs, .env.local.example, README.md
  config/  buckets.ts families.ts(7) quiz.ts(stub)          [clusters/quizold/rates removed]
  src/app/  layout.tsx page.tsx globals.css favicon.ico
            quiz/{page,QuizFlow,SeedStep,actions}.tsx
            results/{page,direction/[romeCode]/page,offers/[romeCode]/page}.tsx
  src/components/  (all 7, AS-IS)
  src/lib/engine/  graph-direction-proposer coverage bucketer results
                   inventory direction-proposer market-reality honest-fork
                   [level-demote and intersection removed]
  src/lib/quiz/  build-inventory session-store
  src/lib/{rome,offers,ingest}/  (AS-IS)   src/lib/{supabase,ui}.ts (AS-IS)
  scripts/  verify-phase0-honesty.ts   (only)
  fixtures/  supabase/  public/  (AS-IS data)
phased/phase-1/          ← Tasks 15–20   (full engine, seed-only flow)
phased/phase-2/          ← Tasks 21–22   (HEAD minus quizold.ts)
```

---

## PHASE 0

### Task 1: Scaffold phase-0 by copying shared infrastructure

**Files:**
- Create: `phased/phase-0/` (whole tree, from repo root, minus artifacts)

- [ ] **Step 1: Create the folder and copy the whole repo minus artifacts**

Run (Git Bash, from `d:/Dev/projects/scope`):
```bash
mkdir -p phased/phase-0
rsync -a --exclude '.git' --exclude 'node_modules' --exclude '.next' \
  --exclude 'phased' --exclude '.vercel' --exclude '.playwright-mcp' \
  --exclude 'out' --exclude 'build' --exclude '*.tsbuildinfo' \
  --exclude 'docs' \
  ./ phased/phase-0/
```
If `rsync` is unavailable, use:
```bash
cp -r config src public fixtures supabase scripts phased/phase-0/
cp package.json package-lock.json tsconfig.json postcss.config.mjs \
   next.config.ts eslint.config.mjs .env.local.example README.md \
   phased/phase-0/
```

- [ ] **Step 2: Verify the copy landed**

Run: `ls phased/phase-0 && ls phased/phase-0/src/lib/engine`
Expected: root config files present; engine dir lists all 10 engine files.

- [ ] **Step 3: Commit**

```bash
git add phased/phase-0
git commit -m "phase-0: scaffold from shared infrastructure copy"
```

---

### Task 2: Prune Phase-0 dead + excluded files

**Files:**
- Delete: `phased/phase-0/config/clusters.ts`
- Delete: `phased/phase-0/config/quizold.ts`
- Delete: `phased/phase-0/config/rates.ts`
- Delete: `phased/phase-0/src/lib/engine/level-demote.ts`
- Delete: `phased/phase-0/src/lib/engine/intersection.ts`
- Delete: every `phased/phase-0/scripts/*` EXCEPT (none yet — new one added Task 13)

- [ ] **Step 1: Remove the deleted config + engine files**

```bash
cd phased/phase-0
rm config/clusters.ts config/quizold.ts config/rates.ts
rm src/lib/engine/level-demote.ts src/lib/engine/intersection.ts
```

- [ ] **Step 2: Remove ALL scripts (Phase 0 keeps only the new honesty script)**

```bash
rm -f scripts/*.ts scripts/*.txt
```

- [ ] **Step 3: Remove the now-orphaned script npm entries from package.json**

Edit `phased/phase-0/package.json` — replace the `"scripts"` block with:
```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "verify:honesty": "tsx scripts/verify-phase0-honesty.ts"
  },
```

- [ ] **Step 4: Commit**

```bash
cd ../.. && git add phased/phase-0
git commit -m "phase-0: prune dead config, level-demote, intersection, all scripts"
```

Note: `tsc` will NOT be clean until the engine surgery (Tasks 3–12) removes the
imports of the deleted files. That is expected; do not run tsc yet.

---

### Task 3: Simplify config/families.ts to 7 flat families

**Files:**
- Modify: `phased/phase-0/config/families.ts`

**Interfaces:**
- Produces: `FAMILIES: Family[]` (7 entries), `seedCodesFor(picks: string[]): string[]`.
  `Family` becomes `{ id: string; label: string; domaines: string; seedCodes: string[] }`
  (no `depths`). `picks` are family ids (e.g. `"tech"`), NOT `family:depth` tokens.
- Removed: `excludedCodesFor`, `seedCodesWithExclusions`, `Depth`, `NicheMember`.

- [ ] **Step 1: Rewrite the type block and keep only 7 families**

The current file has 14 families each with `depths: Depth[]`. For Phase 0, keep
only these 7 ids: `tech, sante, btp, commerce, hotellerie, admin, services`.
For each kept family, collapse its depths into ONE `seedCodes` array = the union
(dedup) of every depth's `seedCodes`. Replace the header types with:

```ts
export type Family = {
  id: string;
  label: string;
  domaines: string;
  /** Union of the family's seed competence codes (depth sub-choices removed in Phase 0). */
  seedCodes: string[];
};
```

Delete `NicheMember` and `Depth`. For each of the 7 families, transform:
```ts
// before (HEAD): { id, label, domaines, depths: [{ id, label, seedCodes, members }, ...] }
// after (P0):    { id, label, domaines, seedCodes: [...union of all depth.seedCodes...] }
```
Keep the exact `id`, `label`, `domaines` strings from HEAD for the 7 kept
families. Compute each `seedCodes` as the sorted unique union of that family's
depths' `seedCodes`.

- [ ] **Step 2: Rewrite seedCodesFor; delete the exclusion exports**

```ts
/** Union (dedup) of the picked families' seed codes. Picks are family ids. */
export function seedCodesFor(picks: string[]): string[] {
  const out = new Set<string>();
  for (const pick of picks) {
    const fam = FAMILIES.find((f) => f.id === pick);
    if (fam) for (const c of fam.seedCodes) out.add(c);
  }
  return [...out].sort();
}
```
Delete `excludedCodesFor` and `seedCodesWithExclusions` entirely.

- [ ] **Step 3: Typecheck just this module's shape (best-effort)**

Run: `cd phased/phase-0 && npx tsc --noEmit config/families.ts --skipLibCheck --moduleResolution bundler --module esnext 2>&1 | head`
Expected: no errors originating in `families.ts` itself (cross-file errors are
fine at this stage).

- [ ] **Step 4: Commit**

```bash
cd ../.. && git add phased/phase-0/config/families.ts
git commit -m "phase-0: families.ts -> 7 flat families, seedCodesFor union, no exclusions"
```

---

### Task 4: Stub config/quiz.ts to Lean + c_departement only

**Files:**
- Modify: `phased/phase-0/config/quiz.ts`

**Interfaces:**
- Produces (kept, same signatures): `type Lean`, `LEAN_WEIGHTS`, `LEAN_OPTIONS`,
  `type Scene`, `type QuickPick`, `type SideMapping`, `type Category`,
  `CATEGORIES: Category[]`. `CATEGORIES` contains ONE category holding zero
  scenes and the single `c_departement` quick-pick.
- Removed: all 41 scenes, other quick-picks, `CLUSTER_CATALOG`,
  `CLUSTER_DEFINITIONS_BY_ID`, `TENSION_MAP`, `FINANCIAL_MAP`,
  `PROFILE_SIGNAL_LENSES`, and their types.

- [ ] **Step 1: Replace config/quiz.ts wholesale with the stub**

`build-inventory.ts` (Task 9) imports from this file:
`CATEGORIES, LEAN_WEIGHTS, type Lean, type Scene, type SideMapping, type QuickPick`
(TENSION_MAP/FINANCIAL_MAP imports are removed in Task 9). `QuizFlow.tsx`
(Task 11) imports `CATEGORIES, LEAN_OPTIONS, type Scene, type QuickPick,
type Lean`. Provide exactly those. Write the whole file as:

```ts
/**
 * Phase 0 quiz stub. No cognitive scenes — the seed front door is the only input
 * beyond département. Kept: the Lean vocabulary (build-inventory references the
 * types) and a single c_departement quick-pick. Everything cognitive (scenes,
 * clusters, tensions, financial) is removed for Phase 0.
 */

export type Lean =
  | "plutot_a"
  | "un_peu_a"
  | "les_deux"
  | "ni_l_un"
  | "un_peu_b"
  | "plutot_b";

export const LEAN_WEIGHTS: Record<Lean, { a: number; b: number }> = {
  plutot_a: { a: 1.0, b: 0 },
  un_peu_a: { a: 0.5, b: 0 },
  les_deux: { a: 0.5, b: 0.5 },
  ni_l_un: { a: 0, b: 0 },
  un_peu_b: { a: 0, b: 0.5 },
  plutot_b: { a: 0, b: 1.0 },
};

export const LEAN_OPTIONS: { id: Lean; label: string }[] = [
  { id: "plutot_a", label: "Plutôt A" },
  { id: "un_peu_a", label: "Un peu A" },
  { id: "un_peu_b", label: "Un peu B" },
  { id: "plutot_b", label: "Plutôt B" },
  { id: "les_deux", label: "Les deux" },
  { id: "ni_l_un", label: "Ni l'un ni l'autre" },
];

export type ClusterWeight = { id: string; weight: number };
export type SideMapping = { clusters?: ClusterWeight[]; riasec?: string[] };
export type SceneOption = { label: string; maps: SideMapping };
export type Scene = {
  id: string;
  prompt: string;
  optionA: SceneOption;
  optionB: SceneOption;
};

export type QuickPickTarget =
  | { kind: "constraint"; field: string }
  | { kind: "tension"; key: string }
  | { kind: "financial"; field: string };
export type QuickPickOption = { id: string; label: string; value: string };
export type QuickPick = {
  id: string;
  prompt: string;
  help?: string;
  multi?: boolean;
  target: QuickPickTarget;
  options: QuickPickOption[];
};

export type Category = {
  id: string;
  title: string;
  intro: string;
  financialOnly?: boolean;
  scenes: Scene[];
  quickPicks: QuickPick[];
};

/** The only captured input beyond the seed: département (multi-select). */
const C_DEPARTEMENT: QuickPick = {
  id: "c_departement",
  prompt: "Dans quel(s) département(s) cherchez-vous ?",
  help: "Sélectionnez un ou plusieurs départements.",
  multi: true,
  target: { kind: "constraint", field: "departement" },
  options: [
    { id: "d75", label: "Paris (75)", value: "75" },
    { id: "d92", label: "Hauts-de-Seine (92)", value: "92" },
    { id: "d93", label: "Seine-Saint-Denis (93)", value: "93" },
    { id: "d94", label: "Val-de-Marne (94)", value: "94" },
    { id: "d77", label: "Seine-et-Marne (77)", value: "77" },
    { id: "d78", label: "Yvelines (78)", value: "78" },
    { id: "d91", label: "Essonne (91)", value: "91" },
    { id: "d95", label: "Val-d'Oise (95)", value: "95" },
  ],
};

export const CATEGORIES: Category[] = [
  {
    id: "localisation",
    title: "Où cherchez-vous ?",
    intro: "Une dernière précision avant de voir vos directions.",
    scenes: [],
    quickPicks: [C_DEPARTEMENT],
  },
];
```

Note: the `C_DEPARTEMENT` options list mirrors HEAD's real départements — copy
the exact `options` array from HEAD's `c_departement` quick-pick if it differs
(search HEAD `config/quiz.ts` for `c_departement`); the above is the Île-de-France
default. Use HEAD's actual list when present.

- [ ] **Step 2: Commit**

```bash
cd ../.. && git add phased/phase-0/config/quiz.ts
git commit -m "phase-0: quiz.ts stub -> Lean + c_departement, no cognitive scenes"
```

---

### Task 5: Trim config/buckets.ts comments (values unchanged)

**Files:**
- Modify: `phased/phase-0/config/buckets.ts`

- [ ] **Step 1: Keep the file as-is functionally; adjust the STRONG_COVERAGE comment**

`buckets.ts` already exports `BUCKETS` (THIN_DEMAND_MAX 0, STRONG_COVERAGE 0.3,
GATE_FRACTION 0.6, BRIDGE_MAX_GATES 2), `Category`, `CATEGORY_LABEL`. Phase 0
keeps all of them. Only replace the `STRONG_COVERAGE` doc-comment (lines ~15-22)
to reflect it now compares against SIMPLE coverage, not the cognitive
denominator:

```ts
  /**
   * Phase 0: coverage at/above this → apply_now. Compared against the direction's
   * SIMPLE coverage (matched / inventory size) — Phase 0 has no cognitive
   * denominator. STRONG_COVERAGE env override is not used in Phase 0.
   */
  STRONG_COVERAGE: 0.3,
```

- [ ] **Step 2: Commit**

```bash
cd ../.. && git add phased/phase-0/config/buckets.ts
git commit -m "phase-0: buckets.ts STRONG_COVERAGE comment (simple coverage)"
```

---

### Task 6: Rewrite coverage.ts — signalStrength thresholds COVERAGE

**Files:**
- Modify: `phased/phase-0/src/lib/engine/coverage.ts`

**Interfaces:**
- Produces (kept names): `COVERAGE_TIERS`, `type CoverageStrength`,
  `coverageStrength(coverage)`, `signalStrength(coverage)` — NOW takes coverage,
  `coveragePhrase`, `isExploratory`.
- Removed: `SIGNAL_RARITY_TIERS`.

- [ ] **Step 1: Replace the signal-tier section**

Keep everything above line 39 (COVERAGE_TIERS, coverageStrength). Replace the
`SIGNAL_RARITY_TIERS` + rarity-based `signalStrength` block (lines ~39–72) with:

```ts
// ---------------------------------------------------------------------------
// Signal tier (the USER-FACING fort/moyen/faible) — Phase 0: COVERAGE-based.
// Phase 0 has no rarity computation, so the tier reads the direction's coverage
// directly (fraction of the inventory's competence codes the métier uses).
// The shared DirectionCard reads this via matchRaritySum, which the Phase-0
// engine sets equal to coverage (see graph-direction-proposer). So passing
// coverage here produces coverage-based fort/moyen/faible on the AS-IS card.
//   coverage ≥ COVERAGE_TIERS.STRONG (0.6) → strong (fort)
//   coverage ≥ COVERAGE_TIERS.PARTIAL (0.4) → partial (moyen)
//   else                                    → exploratory (faible)
// ---------------------------------------------------------------------------
export function signalStrength(coverage: number): CoverageStrength {
  if (coverage >= COVERAGE_TIERS.STRONG) return "strong";
  if (coverage >= COVERAGE_TIERS.PARTIAL) return "partial";
  return "exploratory";
}
```

Keep `coveragePhrase` and `isExploratory` unchanged below.

- [ ] **Step 2: Commit**

```bash
cd ../.. && git add phased/phase-0/src/lib/engine/coverage.ts
git commit -m "phase-0: coverage.ts signalStrength thresholds coverage, drop rarity tiers"
```

---

### Task 7: Rewrite graph-direction-proposer.ts — skill-bridge only

**Files:**
- Modify: `phased/phase-0/src/lib/engine/graph-direction-proposer.ts`

**Interfaces:**
- Consumes: `RomeSource.metiersWithCompetence`, `.allMetiers`; `Inventory`;
  `CandidateDirection`, `DirectionProposer`, `HeldBackDirection`, `LeapType`,
  `ProposalReach` from `direction-proposer`.
- Produces: `class GraphDirectionProposer` with `propose()` and `reach()`.
  Every `CandidateDirection` has `leanScore=interestScore=mobilityScore=
  rarityScore=0`, `matchRaritySum=coverage`, `primaryLeap="skill_bridge"`,
  `leapTypes=["skill_bridge"]`, `rankScore` per the two-term formula.
- Removed: `distinctivenessScore`, `MOBILITY_NUDGE`, `RIASEC_RANK_WEIGHT`,
  `CODE_TO_CLUSTERS`, `rankNormalisers`, `rankScore` export, `W_RARITY`,
  `W_LEAN`, `W_INTEREST`, `W_MOBILITY`, `DIRECT_COVERAGE_THRESHOLD`,
  the CLUSTERS import.

- [ ] **Step 1: Replace the whole file**

```ts
import type { RomeMetier, RomeSource } from "@/lib/rome";
import type { Inventory } from "./inventory";
import {
  type CandidateDirection,
  type DirectionProposer,
  type HeldBackDirection,
  type LeapType,
  type ProposalReach,
} from "./direction-proposer";

/**
 * Phase 0 GraphDirectionProposer — skill-bridge ONLY.
 *
 * Walks the ROME leap-graph via RomeSource and surfaces every métier that lists
 * an inventory competence (the reverse skill index). No direct/mobilité/interest
 * leaps, no rarity, no quiz lean. Coverage = fraction of the inventory's
 * competence codes the métier uses. Ranking is two terms: leap tier + coverage.
 */

// Coverage floor: a skill-bridge row needs ≥1 shared skill (guaranteed by the
// reverse index). Kept for parity with the honesty invariant.
export const MIN_LEAP_COVERAGE = 0;

const W_LEAP_TIER = 0.6;
const W_COVERAGE = 0.8;

// Only skill_bridge is active in Phase 0.
const LEAP_TIER_SCORE: Record<LeapType, number> = {
  direct: 1.0,
  skill_bridge: 0.75,
  mobilite: 0.45,
  interest: 0.25,
};

type Surface = {
  metier: RomeMetier;
  matchedCompetenceCodes: Set<string>;
};

export class GraphDirectionProposer implements DirectionProposer {
  constructor(private readonly rome: RomeSource) {}

  async propose(inventory: Inventory): Promise<CandidateDirection[]> {
    return (await this.reach(inventory)).surfaced;
  }

  async reach(inventory: Inventory): Promise<ProposalReach> {
    const invCodes = new Set(inventory.competenceCodes);
    const surfaced = new Map<string, Surface>();

    const ensure = (m: RomeMetier): Surface => {
      let s = surfaced.get(m.romeCode);
      if (!s) {
        s = { metier: m, matchedCompetenceCodes: new Set() };
        surfaced.set(m.romeCode, s);
      }
      return s;
    };

    const sharedCodes = (m: RomeMetier): string[] =>
      m.competences.map((c) => c.code).filter((code) => invCodes.has(code));

    // Skill-bridge: every métier that lists an inventory competence.
    const skillHit = new Map<string, RomeMetier>();
    for (const code of invCodes) {
      for (const m of await this.rome.metiersWithCompetence(code)) {
        skillHit.set(m.romeCode, m);
      }
    }
    for (const m of skillHit.values()) {
      const s = ensure(m);
      sharedCodes(m).forEach((c) => s.matchedCompetenceCodes.add(c));
    }

    // Every surfaced métier is skill-backed by construction → no held-back set.
    const heldBack: HeldBackDirection[] = [];

    const candidates = [...surfaced.values()].map((s) =>
      this.toCandidate(s, invCodes.size),
    );

    const maxCoverage = Math.max(
      ...candidates.map((c) => c.coverage),
      Number.MIN_VALUE,
    );
    for (const c of candidates) {
      c.rankScore =
        LEAP_TIER_SCORE.skill_bridge * W_LEAP_TIER +
        (c.coverage / maxCoverage) * W_COVERAGE;
    }

    const surfacedDirections = candidates.sort(
      (a, b) =>
        b.rankScore - a.rankScore || a.romeCode.localeCompare(b.romeCode),
    );
    return { surfaced: surfacedDirections, heldBack };
  }

  private toCandidate(s: Surface, invSize: number): CandidateDirection {
    const matchedCompetenceCodes = [...s.matchedCompetenceCodes].sort();
    const coverage = invSize > 0 ? matchedCompetenceCodes.length / invSize : 0;
    return {
      romeCode: s.metier.romeCode,
      title: s.metier.title,
      domain: s.metier.domain,
      leapTypes: ["skill_bridge"],
      primaryLeap: "skill_bridge",
      coverage,
      matchedCompetenceCodes,
      matchedRiasec: [],
      interestScore: 0,
      leanScore: 0,
      mobilityScore: 0,
      rarityScore: 0,
      // Phase 0: the signal tier reads matchRaritySum; feed it coverage so the
      // AS-IS DirectionCard renders coverage-based fort/moyen/faible.
      matchRaritySum: coverage,
      rankScore: 0, // stamped in reach() once maxCoverage exists
      why: buildWhy(s.metier, matchedCompetenceCodes),
    };
  }
}

function buildWhy(m: RomeMetier, codes: string[]): string {
  const skillLabels = m.competences
    .filter((c) => codes.includes(c.code))
    .map((c) => c.libelle);
  const n = codes.length;
  return `Skill-bridge — shares ${n} of your skills (${skillLabels.join(", ")}) in a field you wouldn't have searched.`;
}
```

- [ ] **Step 2: Commit**

```bash
cd ../.. && git add phased/phase-0/src/lib/engine/graph-direction-proposer.ts
git commit -m "phase-0: proposer -> skill-bridge only, two-term rankScore, matchRaritySum=coverage"
```

---

### Task 8: Simplify bucketer.ts — simple coverage denominator

**Files:**
- Modify: `phased/phase-0/src/lib/engine/bucketer.ts`

**Interfaces:**
- Produces: `bucket(direction, inventory): BucketResult` — unchanged signature.
- Changed: `bucketCoverage = direction.coverage` (no seeded/cognitive split).

- [ ] **Step 1: Replace the coverage-computation block**

Replace lines ~35–47 (the seeded/cognitiveCodes/cognitiveMatched block) with:

```ts
  // Phase 0: bucket coverage is the direction's SIMPLE coverage (no cognitive
  // denominator — there is no cognitive quiz).
  const bucketCoverage = direction.coverage;
```

Delete the `const seeded = ...`, `cognitiveCodes`, `cognitiveMatched` lines.
Keep everything else (unmetGates, thin-demand check, `direction.coverage <= 0`
check, strong check, bridge/long_term). The `strongThreshold` line stays but now
compares `bucketCoverage` (= coverage) — leave it:
```ts
  const strongThreshold = Number(process.env.STRONG_COVERAGE ?? BUCKETS.STRONG_COVERAGE);
  const strong = bucketCoverage >= strongThreshold;
```

- [ ] **Step 2: Commit**

```bash
cd ../.. && git add phased/phase-0/src/lib/engine/bucketer.ts
git commit -m "phase-0: bucketer.ts -> simple coverage denominator"
```

---

### Task 9: Simplify build-inventory.ts — seed injection only

**Files:**
- Modify: `phased/phase-0/src/lib/quiz/build-inventory.ts`

**Interfaces:**
- Produces: `buildInventory(answers): Inventory`, `type Answers`,
  `SEED_ANSWER_KEY`. Removed: `EXCLUDE_ANSWER_KEY`, exclusion parsing.
- Consumes: `seedCodesFor` (family-id picks), `CATEGORIES`, `LEAN_WEIGHTS`, Lean
  types from the stub quiz.ts; NO `CLUSTERS`, NO `TENSION_MAP`/`FINANCIAL_MAP`,
  NO `seedCodesWithExclusions`.

- [ ] **Step 1: Remove the clusters import + CLUSTER_CODES**

Delete `import { CLUSTERS } from "../../../config/clusters";` and
`const CLUSTER_CODES = new Map(...)`. Change the quiz import to drop
`TENSION_MAP, FINANCIAL_MAP`:
```ts
import {
  CATEGORIES,
  LEAN_WEIGHTS,
  type Lean,
  type Scene,
  type SideMapping,
  type QuickPick,
} from "../../../config/quiz";
import { seedCodesFor } from "../../../config/families";
```

- [ ] **Step 2: Remove EXCLUDE_ANSWER_KEY, parseExclusions, applySceneSignals**

Delete `EXCLUDE_ANSWER_KEY`, `parseExclusions`, and `applySceneSignals`
(TENSION_MAP/FINANCIAL_MAP consumers). In `buildInventory`, delete the cognitive
code-union loop (`for (const [id, score] of clusterScores) { ... competenceCodes.add }`)
and the `applySceneSignals` call inside the scene loop. The scene loop still
runs (over the stub's zero scenes → no-op) so `clusterScores` stays empty.

- [ ] **Step 3: Replace the seed block (remove exclusions)**

Replace the SEED+DEPTH block (lines ~137–151) with:
```ts
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
```
Remove `excludedJobs`/`seedCodesWithExclusions` usage and the
`...(excludedJobs.length ? { excludedJobs } : {})` spread in the return.

- [ ] **Step 4: Commit**

```bash
cd ../.. && git add phased/phase-0/src/lib/quiz/build-inventory.ts
git commit -m "phase-0: build-inventory -> seed injection only, no cognitive/exclusion"
```

---

### Task 10: Simplify results.ts — no level-demote, no surface-with-label

**Files:**
- Modify: `phased/phase-0/src/lib/engine/results.ts`

**Interfaces:**
- Produces: `buildResults(inventory)`, `type ResultDirection` (keeps
  `levelPenalty`, `displayRank`, optional `thinMarketSeeded`/`excludedButSurfaced`
  in the TYPE for AS-IS components, but never sets the latter two),
  `P2_INVENTORY`, `INVENTORY_LABELS`, `type Results`, `type SuppressedDirection`.
- Removed imports: `userLevel, levelPenalty, displayRank` from level-demote;
  `isSeededStrongThinMarket`, `DEEP_SEED_MATCH_FLOOR`.

- [ ] **Step 1: Drop the level-demote import**

Remove line 10 `import { userLevel, levelPenalty, displayRank } from "./level-demote";`.

- [ ] **Step 2: Remove DEEP_SEED_MATCH_FLOOR + isSeededStrongThinMarket**

Delete `DEEP_SEED_MATCH_FLOOR` and the whole `isSeededStrongThinMarket` function
(lines ~113–123).

- [ ] **Step 3: Simplify P2_INVENTORY to seed-only demo**

Replace `P2_INVENTORY` with a seed-only demo (a tech pick's codes). Keep the
export name so `results/page.tsx` copies AS-IS:
```ts
/** Phase 0 demo inventory (no-session fallback): a seeded tech profile in dépt 75. */
export const P2_INVENTORY: Inventory = {
  competenceCodes: seedCodesFor(["tech"]),
  seededCodes: seedCodesFor(["tech"]),
  riasec: [],
  clusterScores: {},
  riasecScores: {},
  constraints: { departement: "75", departements: ["75"] },
};
```
Add at the top: `import { seedCodesFor } from "../../../config/families";`.
Leave `INVENTORY_LABELS` as-is (harmless) or trim to `{}` — keep the export.

- [ ] **Step 4: Replace the surfacing + demote loop**

Replace the `for (const d of withMarket)` suppression loop AND the level-demote
map (lines ~161–201) with:
```ts
  const suppressed: SuppressedDirection[] = [];
  const surviving: DirectionWithMarket[] = [];
  for (const d of withMarket) {
    if (isDeadEndBridge(d)) {
      suppressed.push({
        romeCode: d.romeCode,
        title: d.title,
        reason: `${Math.round(d.coverage * 100)}% skill overlap and no live offers — a coincidence, not a direction.`,
      });
    } else {
      surviving.push(d);
    }
  }

  const directions: ResultDirection[] = surviving.map((d) => ({
    ...d,
    bucketResult: bucket(d, inventory),
    levelPenalty: 0,
    displayRank: d.rankScore, // no demote in Phase 0
  }));
```
Remove the `const seeded`, `const excluded`, `const user = userLevel(...)` lines.

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add phased/phase-0/src/lib/engine/results.ts
git commit -m "phase-0: results.ts -> no level-demote/surface-with-label, seed-only P2_INVENTORY"
```

---

### Task 11: Simplify QuizFlow.tsx — seed → submit

**Files:**
- Modify: `phased/phase-0/src/app/quiz/QuizFlow.tsx`

- [ ] **Step 1: Remove chapter phase; keep seed + hidden answers + submit**

Rewrite QuizFlow to a single-phase seed flow. Remove: the `chapters` phase, all
`CATEGORIES` iteration, `SceneBlock`, `QuickPickBlock` rendering of scenes, the
stepper, `EXCLUDE_ANSWER_KEY` usage. Keep the `<form action={submitQuiz}>`, the
hidden `answers` input, and render `SeedStep` then a submit button:

```tsx
"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { SEED_ANSWER_KEY } from "@/lib/quiz/build-inventory";
import { SeedStep } from "./SeedStep";
import { submitQuiz } from "./actions";

type Answers = Record<string, string>;

export function QuizFlow() {
  const [answers, setAnswers] = useState<Answers>({});
  const setValue = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const hasPick = Boolean(answers[SEED_ANSWER_KEY]);

  return (
    <form action={submitQuiz} className="space-y-8">
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />
      <SeedStep
        value={answers[SEED_ANSWER_KEY]}
        onChange={(tokens) => setValue(SEED_ANSWER_KEY, tokens)}
      />
      <div className="border-t border-border pt-6">
        <button
          type="submit"
          disabled={!hasPick}
          className="inline-flex items-center gap-2 rounded-card bg-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-40"
        >
          Voir mes directions
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ../.. && git add phased/phase-0/src/app/quiz/QuizFlow.tsx
git commit -m "phase-0: QuizFlow -> seed step then submit, no chapters"
```

---

### Task 12: Simplify SeedStep.tsx — 7 families, no depth/exclusion

**Files:**
- Modify: `phased/phase-0/src/app/quiz/SeedStep.tsx`

**Interfaces:**
- Produces: `SeedStep({ value, onChange })` — a family multi-select. Drops the
  `exclusionsValue`/`onExclusionsChange`/`onContinue`/`onSkip` props (QuizFlow no
  longer passes them). `value`/`onChange` carry a comma-joined list of family ids.

- [ ] **Step 1: Rewrite SeedStep to a flat family multi-select**

`FAMILIES` now has no `depths` (Task 3). Render one card per family; clicking
toggles the family id in a comma-joined token string:

```tsx
"use client";

import { FAMILIES } from "../../../config/families";

/** Phase 0 seed: pick 1+ job families. No depth sub-choices, no exclusions. */
function parsePicks(value: string | undefined): string[] {
  return (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export function SeedStep({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (tokens: string) => void;
}) {
  const picks = new Set(parsePicks(value));

  const toggle = (famId: string) => {
    const next = new Set(picks);
    if (next.has(famId)) next.delete(famId);
    else next.add(famId);
    // preserve FAMILIES order
    onChange(FAMILIES.filter((f) => next.has(f.id)).map((f) => f.id).join(","));
  };

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl text-navy">Par où commencer ?</h2>
        <p className="max-w-2xl text-text">
          Choisissez un ou plusieurs domaines qui vous parlent. On en déduit vos
          compétences de départ.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FAMILIES.map((fam) => {
          const isOn = picks.has(fam.id);
          return (
            <button
              key={fam.id}
              type="button"
              onClick={() => toggle(fam.id)}
              aria-pressed={isOn}
              className={[
                "rounded-card border p-4 text-left transition-colors",
                isOn
                  ? "border-blue bg-blue-soft"
                  : "border-border bg-surface hover:border-blue/40",
              ].join(" ")}
            >
              <span className="block text-base text-navy">{fam.label}</span>
              <span className="mt-1 block text-sm text-muted">{fam.domaines}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ../.. && git add phased/phase-0/src/app/quiz/SeedStep.tsx
git commit -m "phase-0: SeedStep -> 7 families flat multi-select, no depth/exclusion"
```

---

### Task 13: Write scripts/verify-phase0-honesty.ts

**Files:**
- Create: `phased/phase-0/scripts/verify-phase0-honesty.ts`

**Interfaces:**
- Consumes: `buildResults` from `../src/lib/engine/results`, `Inventory` type,
  `seedCodesFor` from `../config/families`.

- [ ] **Step 1: Write the Phase-0 honesty script**

```ts
/**
 * Phase 0 honesty invariants. Runs the full Phase-0 pipeline (skill-bridge
 * proposer → market → suppression → buckets) and asserts the Phase-0 honesty
 * contract ONLY (no rarity tiers, no surface-with-label).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/verify-phase0-honesty.ts
 */
import { buildResults } from "../src/lib/engine/results";
import { signalStrength } from "../src/lib/engine/coverage";
import type { Inventory } from "../src/lib/engine/inventory";
import { seedCodesFor } from "../config/families";

const INVENTORY: Inventory = {
  competenceCodes: seedCodesFor(["tech"]),
  seededCodes: seedCodesFor(["tech"]),
  riasec: [],
  clusterScores: {},
  riasecScores: {},
  constraints: { departement: "75", departements: ["75"] },
};

let failed = 0;
function check(cond: boolean, msg: string) {
  console.log(`  ${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failed++;
}

async function main() {
  const r = await buildResults(INVENTORY);
  console.log("=".repeat(72));
  console.log(`Phase 0 honesty — ROME_SOURCE=${process.env.ROME_SOURCE ?? "fixture"} OFFER_SOURCE=${process.env.OFFER_SOURCE ?? "fixture"}`);
  console.log("=".repeat(72));
  console.log(`directions surfaced: ${r.directions.length} · suppressed: ${r.suppressed.length}`);

  // 1. No verdict / disqualifier / final_score JSON key.
  const json = JSON.stringify(r);
  check(!/"(verdict|disqualifiers?|final_score)"\s*:/i.test(json),
    "no verdict / disqualifier / final_score field in output");

  // 2. Every surfaced direction has a non-empty 'why'.
  check(r.directions.every((d) => typeof d.why === "string" && d.why.length > 0),
    "every surfaced direction has a 'why surfaced' explanation");

  // 3. Coverage-based signal produces the three tiers across the set.
  const tiers = new Set(r.directions.map((d) => signalStrength(d.coverage)));
  check(tiers.size >= 1, `fort/moyen/faible tiers computed from coverage (${[...tiers].join(",")})`);

  // 4. Weak results are not final recommendations: suppressed counted, listed.
  check(Array.isArray(r.suppressed), `suppressed list present and counted (${r.suppressed.length}), never silent`);

  // 5. Market receipts attach where offers exist.
  const withOffers = r.directions.filter((d) => d.market.marketDemand > 0);
  check(withOffers.every((d) => Array.isArray(d.market.offers)),
    `market receipts present on directions with demand (${withOffers.length})`);

  // 6. Coverage floor: every surfaced direction is skill-backed (Phase 0: all
  //    are skill_bridge with ≥1 matched code).
  check(r.directions.every((d) => d.matchedCompetenceCodes.length > 0),
    "coverage floor enforced — every surfaced direction shares ≥1 skill");

  // 7. Phase-0 leap purity: only skill_bridge surfaced.
  check(r.directions.every((d) => d.primaryLeap === "skill_bridge"),
    "only skill_bridge leap active (no direct/mobilité/interest)");

  console.log("\n" + (failed ? `FAILED (${failed})` : "PHASE 0 HONESTY INTACT — all invariants hold"));
  if (failed) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Commit**

```bash
cd ../.. && git add phased/phase-0/scripts/verify-phase0-honesty.ts
git commit -m "phase-0: add verify-phase0-honesty.ts"
```

---

### Task 14: Verify phase-0 (install + tsc + honesty)

**Files:** none (verification only)

- [ ] **Step 1: Install deps in the phase folder**

```bash
cd phased/phase-0 && npm install
```
Expected: installs without peer-dep errors (same package.json as HEAD).

- [ ] **Step 2: Typecheck — MUST be clean**

Run: `npx tsc --noEmit`
Expected: no output, exit 0. If errors: they will name a leftover import of a
deleted file (clusters/level-demote/intersection/quizold/rates) or a removed
export (EXCLUDE_ANSWER_KEY, seedCodesWithExclusions, SIGNAL_RARITY_TIERS,
rankNormalisers). Fix the referencing file per its Task, re-run.

- [ ] **Step 3: Run the honesty script**

Run: `node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/verify-phase0-honesty.ts`
(If `.env.local` absent, copy `.env.local.example` → `.env.local` first, or run
without `--env-file` since fixture mode needs no env.)
Expected: `PHASE 0 HONESTY INTACT — all invariants hold`.

- [ ] **Step 4: Smoke the dev server (optional manual gate)**

Run: `npm run dev`, open `/quiz`, pick a family, submit, confirm `/results`
renders cards with fort/moyen/faible and a "why". Ctrl-C when done.

- [ ] **Step 5: Commit any fixes**

```bash
cd ../.. && git add phased/phase-0
git commit -m "phase-0: tsc clean + honesty passing (verification fixes)"
```

**CHECKPOINT: stop here for user review before Phase 1.**

---

## PHASE 1

### Task 15: Scaffold phase-1 from shared infrastructure

**Files:** Create `phased/phase-1/` (same copy procedure as Task 1).

- [ ] **Step 1: Copy the repo minus artifacts into phased/phase-1** (same
  rsync/cp command as Task 1, target `phased/phase-1/`).
- [ ] **Step 2: Verify copy** — `ls phased/phase-1/src/lib/engine` lists 10 files.
- [ ] **Step 3: Commit** — `git add phased/phase-1 && git commit -m "phase-1: scaffold from shared infrastructure copy"`

---

### Task 16: Prune Phase-1 (quizold, rates; keep clusters + full engine)

**Files:**
- Delete: `phased/phase-1/config/quizold.ts`, `phased/phase-1/config/rates.ts`,
  `phased/phase-1/src/lib/engine/intersection.ts`
- KEEP: `config/clusters.ts` (compile dependency — confirmed decision).
- Delete: scripts EXCEPT `verify-honesty-layer.ts`, `lean-bucket-fix-proof.ts`.

- [ ] **Step 1:** `cd phased/phase-1 && rm config/quizold.ts config/rates.ts src/lib/engine/intersection.ts`
- [ ] **Step 2: Remove scripts except the two kept**
```bash
cd scripts && ls | grep -vE '^(verify-honesty-layer|lean-bucket-fix-proof)\.ts$' | xargs -r rm -f && cd ..
```
Check `lean-bucket-fix-proof.ts` imports — if it imports a now-deleted script
helper, keep only what compiles; else keep both.
- [ ] **Step 3: Trim package.json scripts** to `dev/build/start/lint` +
  `"verify:honesty": "tsx scripts/verify-honesty-layer.ts"` +
  `"proof:lean": "tsx scripts/lean-bucket-fix-proof.ts"`.
- [ ] **Step 4: Commit** — `cd ../.. && git add phased/phase-1 && git commit -m "phase-1: prune quizold/rates/intersection, keep clusters + full engine"`

---

### Task 17: Stub config/quiz.ts (keep c_departement + c_diploma)

**Files:**
- Modify: `phased/phase-1/config/quiz.ts`

- [ ] **Step 1:** Same stub as Task 4, but the single stub category ALSO includes
  a `c_diploma` quick-pick (level-demote reads `constraints.diploma`). Add to the
  stub's `quickPicks`:
```ts
const C_DIPLOMA: QuickPick = {
  id: "c_diploma",
  prompt: "Votre niveau de diplôme le plus élevé ?",
  target: { kind: "constraint", field: "diploma" },
  options: [
    { id: "aucun", label: "Aucun / Brevet", value: "aucun" },
    { id: "cap", label: "CAP / BEP", value: "cap" },
    { id: "bac", label: "Bac", value: "bac" },
    { id: "bac2", label: "Bac+2", value: "bac+2" },
    { id: "bac3", label: "Bac+3", value: "bac+3" },
    { id: "bac5", label: "Bac+5 et plus", value: "bac+5" },
  ],
};
```
Copy `c_departement` options from HEAD as in Task 4. `CATEGORIES` = one category
with `scenes: []`, `quickPicks: [C_DEPARTEMENT, C_DIPLOMA]`. Keep the same
exported types as Task 4 PLUS whatever the FULL engine imports from quiz.ts —
verify none (the engine imports CLUSTERS from clusters.ts, not quiz.ts).
- [ ] **Step 2: Commit** — `git commit -m "phase-1: quiz.ts stub -> c_departement + c_diploma, no scenes"`

---

### Task 18: Simplify build-inventory.ts (keep cluster loop, it's inert)

**Files:**
- Modify: `phased/phase-1/src/lib/quiz/build-inventory.ts`

- [ ] **Step 1:** build-inventory imports `TENSION_MAP, FINANCIAL_MAP` from
  quiz.ts (removed in the Task 17 stub). Two options — pick the minimal:
  (a) keep those maps in the Phase-1 quiz stub as empty `{}` exports, OR
  (b) remove `applySceneSignals` + those imports from build-inventory.
  RECOMMENDED (a): add to Phase-1 quiz.ts stub:
```ts
export const TENSION_MAP: Record<string, { a?: { key: string; value: string }; b?: { key: string; value: string } }> = {};
export const FINANCIAL_MAP: Record<string, { a?: { field: string; value: string }; b?: { field: string; value: string } }> = {};
```
  Then build-inventory copies AS-IS (cluster loop stays, inert with empty
  clusterScores; CLUSTERS import resolves against the kept clusters.ts). Keep
  `seedCodesWithExclusions`/`seedCodesFor` (full families.ts is kept).
- [ ] **Step 2: Commit** — `git commit -m "phase-1: quiz.ts empty TENSION_MAP/FINANCIAL_MAP so build-inventory copies AS-IS"`

---

### Task 19: Simplify QuizFlow.tsx — seed → submit (full SeedStep)

**Files:**
- Modify: `phased/phase-1/src/app/quiz/QuizFlow.tsx`

- [ ] **Step 1:** Same as Task 11 (seed → submit, no chapters) BUT keep passing
  the exclusion props to SeedStep (Phase 1 keeps depth + exclusion UI). Render:
```tsx
<SeedStep
  value={answers[SEED_ANSWER_KEY]}
  onChange={(tokens) => setValue(SEED_ANSWER_KEY, tokens)}
  exclusionsValue={answers[EXCLUDE_ANSWER_KEY]}
  onExclusionsChange={(tokens) => setValue(EXCLUDE_ANSWER_KEY, tokens)}
/>
```
Import `SEED_ANSWER_KEY, EXCLUDE_ANSWER_KEY` from build-inventory. Keep
`SeedStep.tsx` AS-IS (do NOT simplify — Phase 1 keeps full families + depth +
exclusion). The submit button is enabled when a seed pick exists.
Note: HEAD's SeedStep expects `onContinue`/`onSkip` — adjust SeedStep's props to
make those optional, OR keep them and pass no-op `onContinue`/`onSkip` that just
scroll. Minimal: make `onContinue`/`onSkip` optional in SeedStep and drop the
internal continue/skip buttons (submit lives in QuizFlow now).
- [ ] **Step 2: Commit** — `git commit -m "phase-1: QuizFlow -> seed(full)+submit, no chapters"`

---

### Task 20: Verify phase-1 (install + tsc + honesty + lean proof)

**Files:** none.

- [ ] **Step 1:** `cd phased/phase-1 && npm install`
- [ ] **Step 2:** `npx tsc --noEmit` — MUST be clean.
- [ ] **Step 3:** `node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/verify-honesty-layer.ts` — expect "HONESTY LAYER INTACT".
- [ ] **Step 4:** `node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/lean-bucket-fix-proof.ts` — expect its pass line.
- [ ] **Step 5: Manual gate** — `/quiz` shows 14 families + depth + exclusion,
  submit → results with rarity-based signal.
- [ ] **Step 6: Commit** — `git commit -m "phase-1: tsc clean + honesty + lean proof passing"`

**CHECKPOINT: stop for user review before Phase 2.**

---

## PHASE 2

### Task 21: Copy HEAD into phase-2, delete quizold.ts

**Files:** Create `phased/phase-2/` (full copy), delete `config/quizold.ts`.

- [ ] **Step 1:** Copy the repo minus artifacts into `phased/phase-2/` (Task 1
  command, target phase-2). This includes ALL scripts (Phase 2 keeps ~40).
- [ ] **Step 2:** `cd phased/phase-2 && rm config/quizold.ts`
- [ ] **Step 3: Commit** — `cd ../.. && git add phased/phase-2 && git commit -m "phase-2: full HEAD copy minus quizold.ts"`

---

### Task 22: Verify phase-2 (install + tsc + honesty)

**Files:** none.

- [ ] **Step 1:** `cd phased/phase-2 && npm install`
- [ ] **Step 2:** `npx tsc --noEmit` — MUST be clean (it's HEAD minus dead code).
- [ ] **Step 3:** `node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/verify-honesty-layer.ts` — expect "HONESTY LAYER INTACT".
- [ ] **Step 4:** `node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/lean-bucket-fix-proof.ts` — expect pass.
- [ ] **Step 5: Manual gate** — full quiz flow (seed → 41 scenes → results).
- [ ] **Step 6: Commit** — `git commit -m "phase-2: tsc clean + honesty + lean proof passing"`

---

## Self-Review notes (author)

- **Spec coverage:** every "Phase 0 extraction" / "Phase 1 extraction" /
  "Phase 2 extraction" bullet in the product spec maps to a task above. The two
  spec ambiguities (signal-tier, clusters.ts) are resolved in Tasks 6/7 and
  16/18 per the confirmed design decisions.
- **Type consistency:** `signalStrength` takes `coverage` in Phase 0 (Task 6) and
  `matchRaritySum` in Phase 1/2 (AS-IS). The AS-IS DirectionCard call
  `signalStrength(d.matchRaritySum)` works in ALL phases because Phase 0 sets
  `matchRaritySum = coverage` (Task 7). `seedCodesFor` takes family-id picks in
  Phase 0 (Task 3) and `family:depth` tokens in Phase 1/2 (full families.ts) —
  each phase's build-inventory + SeedStep agree within the phase.
- **Verification shape:** extraction work is copy+simplify, so the test cycle is
  `tsc --noEmit` + honesty script (not unit TDD). This is the spec's stated
  verification requirement (§Verification requirements 1–2).
```
