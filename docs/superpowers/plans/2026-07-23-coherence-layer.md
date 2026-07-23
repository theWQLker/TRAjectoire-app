# Coherence Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape the results *display order only* — thin over-represented ROME sub-domain clusters with a gentle diminishing-returns curve, and pin exactly one honest cross-domain wildcard — without touching what surfaces, what's bucketed, or any signal tier.

**Architecture:** A new pure module `src/lib/engine/coherence.ts` computes a per-direction cluster key (`romeCode.slice(0,3)`), a diminishing-returns `coherencePenalty`, a composed `coherenceRank = displayRank × (1 − coherencePenalty)`, and selects at most one wildcard. `buildResults()` calls it after the level-demote loop; the results page sorts each bucket's visible order by `coherenceRank` and pins the wildcard first in its own bucket. A live-graph sweep script proves the K/formula choice per persona.

**Tech Stack:** TypeScript, Next.js 16 (App Router), `tsx` for scripts. **No test framework exists** — this repo proves logic with standalone `tsx` scripts that `assert` and `process.exit(1)` on failure (see `scripts/level-demote-proof.ts`, `scripts/signal-tier-proof.ts`). Follow that pattern; do NOT add vitest/jest.

## Global Constraints

- **Honesty invariants — NEVER modify:** `rankScore`, the surfacing gate / `heldBack` / `suppressed`, `signalStrength` tiers (`matchRaritySum`), `bucketResult` / bucketing, and `displayRank`. Coherence is display-order only. (Spec §2.)
- **Cluster key** = `romeCode.slice(0, 3)` (3 chars, e.g. `M12`, `J14`). **Domain** = `romeCode.slice(0, 1)` (1 char). (Spec §3.)
- **Composition:** `coherenceRank = displayRank × (1 − coherencePenalty)`. Each demote applied exactly once. `i = 0` (a cluster's best row) always → penalty 0. (Spec §4, §6.)
- **Wildcard:** exactly one, cross-*domain* (differs from the dominant domain), highest `rankScore` among candidates (NOT rarity), must clear a relative floor (`WILDCARD_FLOOR_FRAC` × top-visible rankScore); **if none clears it → no wildcard**. Never fabricated. (Spec §5.)
- **Tuning constants** (`COHERENCE_K`, `WILDCARD_FLOOR_FRAC`) are env-overridable and **locked by sweep evidence**, human-gated — same pattern as `RARITY_GENERIC_FLOOR` / `W_RARITY`. Do not silently tune past the starting value; the sweep informs the lock.
- **Script run command:** `node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/<name>.ts`; prefix `ROME_SOURCE=live OFFER_SOURCE=live` for live-graph scripts.
- **Commit message trailer:** end every commit with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Pure coherence module — cluster key + both penalty formulas

**Files:**
- Create: `src/lib/engine/coherence.ts`
- Test: `scripts/coherence-unit-proof.ts` (standalone assert script — no live graph)

**Interfaces:**
- Consumes: nothing from other tasks. Reads only fields already on `CandidateDirection` (`src/lib/engine/direction-proposer.ts`): `romeCode: string`, `rankScore: number`.
- Produces (relied on by Tasks 2–4):
  - `type CoherenceFormula = "plain" | "strength"`
  - `clusterKey(romeCode: string): string` → 3-char key
  - `domainOf(romeCode: string): string` → 1-char domain
  - `COHERENCE_K: number` (env `COHERENCE_K`, default `0.15`)
  - `coherencePenalties<T extends { romeCode: string; rankScore: number }>(dirs: T[], formula: CoherenceFormula, k?: number): Map<T, number>` → penalty ∈ [0,1] per direction, keyed by object identity.

- [ ] **Step 1: Write the failing test**

Create `scripts/coherence-unit-proof.ts`:

```ts
/**
 * COHERENCE UNIT PROOF (no live graph). Asserts the pure coherence math:
 * cluster key, domain, both penalty formulas, i=0 invariant, monotonicity,
 * and the strength-attenuation guard. Exits non-zero on any failure.
 *
 * Usage: node node_modules/tsx/dist/cli.mjs scripts/coherence-unit-proof.ts
 */
import assert from "node:assert/strict";
import {
  clusterKey,
  domainOf,
  coherencePenalties,
  COHERENCE_K,
} from "../src/lib/engine/coherence";

type Row = { romeCode: string; rankScore: number };
const r = (romeCode: string, rankScore: number): Row => ({ romeCode, rankScore });

let passed = 0;
const ok = (name: string) => { passed++; process.stdout.write(`  ✓ ${name}\n`); };

// --- cluster key + domain ---
assert.equal(clusterKey("M1203"), "M12", "clusterKey slices 3 chars");
assert.equal(clusterKey("J1502"), "J15", "clusterKey J15");
assert.equal(domainOf("M1203"), "M", "domainOf slices 1 char");
ok("clusterKey / domainOf slice correctly");

// --- i=0 invariant: the best row of every cluster is untouched (penalty 0) ---
// One cluster J15 with three rows of descending rankScore.
const cluster = [r("J1501", 10), r("J1502", 8), r("J1503", 6)];
for (const formula of ["plain", "strength"] as const) {
  const p = coherencePenalties(cluster, formula);
  assert.equal(p.get(cluster[0]), 0, `${formula}: cluster head penalty is 0`);
}
ok("i=0 (cluster head) penalty is 0 for both formulas");

// --- plain: penalty is monotonic non-decreasing with intra-cluster index ---
{
  const p = coherencePenalties(cluster, "plain");
  assert.ok(p.get(cluster[1])! > 0, "plain: 2nd row penalised");
  assert.ok(p.get(cluster[2])! > p.get(cluster[1])!, "plain: deeper = larger penalty");
}
ok("plain penalty grows with intra-cluster index");

// --- strength: a deep row AS STRONG as its head keeps ~0 penalty ---
{
  // J-cluster where all three tie on rankScore (single-family survival case).
  const tied = [r("J1501", 10), r("J1502", 10), r("J1503", 10)];
  const p = coherencePenalties(tied, "strength");
  assert.equal(p.get(tied[1]), 0, "strength: deep row equal to head → penalty 0");
  assert.equal(p.get(tied[2]), 0, "strength: deep row equal to head → penalty 0");
  // plain would penalise them (proves the two formulas differ):
  const pp = coherencePenalties(tied, "plain");
  assert.ok(pp.get(tied[1])! > 0, "plain: same tied deep row IS penalised (formulas differ)");
}
ok("strength attenuation spares strong-but-deep rows; plain does not");

// --- separate clusters do not interfere; each has its own i=0 ---
{
  const mixed = [r("J1501", 9), r("J1502", 3), r("M1201", 8), r("M1202", 2)];
  const p = coherencePenalties(mixed, "plain");
  assert.equal(p.get(mixed[0]), 0, "J head untouched");
  assert.equal(p.get(mixed[2]), 0, "M head untouched");
  assert.ok(p.get(mixed[1])! > 0 && p.get(mixed[3])! > 0, "both cluster tails penalised");
}
ok("clusters are independent; each keeps its own head");

// --- penalties stay in [0,1] ---
{
  const big = Array.from({ length: 40 }, (_, i) => r(`J15${String(i).padStart(2, "0")}`, 100 - i));
  for (const formula of ["plain", "strength"] as const) {
    for (const [, v] of coherencePenalties(big, formula)) {
      assert.ok(v >= 0 && v <= 1, `${formula}: penalty in [0,1]`);
    }
  }
}
ok("penalties bounded in [0,1]");

process.stdout.write(`\nCOHERENCE UNIT PROOF: ${passed} checks passed · COHERENCE_K=${COHERENCE_K}\n`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node node_modules/tsx/dist/cli.mjs scripts/coherence-unit-proof.ts`
Expected: FAIL — cannot resolve `../src/lib/engine/coherence` (module does not exist).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/engine/coherence.ts`:

```ts
/**
 * Coherence layer (spec 2026-07-23) — DISPLAY-ORDER ONLY. Thins over-represented
 * ROME sub-domain clusters with a gentle diminishing-returns curve and selects
 * one honest cross-domain wildcard. Touches nothing that surfaces, is bucketed,
 * or is tier-labelled (see spec §2). This file is the pure math; results.ts wires
 * it in and the page renders the reshaped order.
 */

/** 3-char ROME sub-domain (e.g. "M1203" → "M12"). The coherence cluster key. */
export function clusterKey(romeCode: string): string {
  return romeCode.slice(0, 3);
}

/** 1-char ROME domain (e.g. "M1203" → "M"). One of the 14 domains A–N. */
export function domainOf(romeCode: string): string {
  return romeCode.slice(0, 1);
}

/** Which diminishing-returns formula (chosen by the sweep, spec §7). */
export type CoherenceFormula = "plain" | "strength";

/**
 * Diminishing-returns curve constant. Larger K = steeper thinning of a cluster's
 * tail. Env-overridable; locked by the per-persona sweep (spec §7), NOT silently
 * tuned — same human-gate as RARITY_GENERIC_FLOOR / W_RARITY.
 */
export const COHERENCE_K = Number(process.env.COHERENCE_K ?? "0.15");

/**
 * Per-direction coherence penalty ∈ [0,1], keyed by object identity.
 *
 * Within each 3-char cluster, rows are sorted by rankScore desc; the intra-cluster
 * index i (0 = the cluster's best) drives the penalty. i=0 is ALWAYS 0 — a
 * cluster's best row is never touched. Two formulas (spec §4):
 *   plain:    1 − 1/(1 + K·i)
 *   strength: (1 − 1/(1 + K·i)) × (1 − rankScore_i/rankScore_head)
 * The strength variant spares a deep row that is nearly as strong as its head
 * (punishes low-QUALITY density, not density per se).
 */
export function coherencePenalties<T extends { romeCode: string; rankScore: number }>(
  dirs: T[],
  formula: CoherenceFormula,
  k: number = COHERENCE_K,
): Map<T, number> {
  const byCluster = new Map<string, T[]>();
  for (const d of dirs) {
    const key = clusterKey(d.romeCode);
    let group = byCluster.get(key);
    if (!group) { group = []; byCluster.set(key, group); }
    group.push(d);
  }
  const out = new Map<T, number>();
  for (const group of byCluster.values()) {
    // rankScore desc; deterministic tiebreak so index assignment is stable.
    const sorted = [...group].sort(
      (a, b) => b.rankScore - a.rankScore || a.romeCode.localeCompare(b.romeCode),
    );
    const head = sorted[0].rankScore;
    sorted.forEach((d, i) => {
      const index = 1 - 1 / (1 + k * i); // 0 at i=0, →1 as i grows
      let penalty = index;
      if (formula === "strength") {
        const strengthKeep = head > 0 ? d.rankScore / head : 1;
        penalty = index * (1 - strengthKeep);
      }
      // clamp for safety (rankScore is non-negative in practice; guard anyway)
      out.set(d, Math.min(1, Math.max(0, penalty)));
    });
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node node_modules/tsx/dist/cli.mjs scripts/coherence-unit-proof.ts`
Expected: PASS — `COHERENCE UNIT PROOF: 7 checks passed · COHERENCE_K=0.15`

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine/coherence.ts scripts/coherence-unit-proof.ts
git commit -m "$(cat <<'EOF'
feat(coherence): pure cluster key + diminishing-returns penalties

Cluster key (3-char ROME sub-domain), domain (1-char), and both
penalty formulas (plain + strength-attenuated). i=0 invariant, [0,1]
bound, and formula divergence proved by scripts/coherence-unit-proof.ts.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Wildcard selection — cross-domain, floored, or none

**Files:**
- Modify: `src/lib/engine/coherence.ts`
- Test: `scripts/coherence-unit-proof.ts` (extend)

**Interfaces:**
- Consumes: `clusterKey`, `domainOf` from Task 1.
- Produces (relied on by Tasks 3–4):
  - `WILDCARD_FLOOR_FRAC: number` (env `WILDCARD_FLOOR_FRAC`, default `0.5`)
  - `selectWildcard<T extends { romeCode: string; rankScore: number }>(dirs: T[], floorFrac?: number): T | null` — highest-rankScore direction whose domain differs from the dominant domain, provided its rankScore ≥ floorFrac × (top overall rankScore); else `null`.

- [ ] **Step 1: Write the failing test**

Append to `scripts/coherence-unit-proof.ts` (before the final summary line):

```ts
// --- wildcard: dominant domain is the most-represented CLUSTER's domain ---
import { selectWildcard, WILDCARD_FLOOR_FRAC } from "../src/lib/engine/coherence";
{
  // J dominates (cluster J15 has 3 rows, the largest cluster). Top overall = J1501 (10).
  // Cross-domain candidates: M1805 (7), H2905 (2). Floor = 0.5·10 = 5 → M1805 qualifies.
  const dirs = [
    r("J1501", 10), r("J1502", 9), r("J1503", 8), // J15 cluster, size 3 → dominant
    r("M1805", 7),  // cross-domain, above floor
    r("H2905", 2),  // cross-domain, below floor
  ];
  const w = selectWildcard(dirs);
  assert.ok(w && w.romeCode === "M1805", "wildcard = highest-rankScore cross-domain above floor");
  ok("wildcard picks highest cross-domain above floor");
}

// --- wildcard: none when no cross-domain row clears the floor ---
{
  const dirs = [
    r("J1501", 10), r("J1502", 9), r("J1503", 8),
    r("H2905", 2), // cross-domain but 2 < 0.5·10 = 5
  ];
  assert.equal(selectWildcard(dirs), null, "no wildcard when nothing clears the floor");
  ok("no wildcard rather than a weak one");
}

// --- wildcard: none when everything is in the dominant domain ---
{
  const dirs = [r("J1501", 10), r("J1502", 9), r("J1403", 8)];
  assert.equal(selectWildcard(dirs), null, "no cross-domain candidate → null");
  ok("no wildcard when profile is single-domain");
}
```

Change the final summary line's expected count to `10`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node node_modules/tsx/dist/cli.mjs scripts/coherence-unit-proof.ts`
Expected: FAIL — `selectWildcard` / `WILDCARD_FLOOR_FRAC` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/engine/coherence.ts`:

```ts
/**
 * Wildcard credibility floor: the pick's rankScore must be ≥ this fraction of the
 * top overall rankScore, else no wildcard. rankScore is not normalised across
 * profiles, so a RELATIVE bar ("at least half as strong as your best match") is a
 * consistent, explainable honesty threshold. Env-overridable; locked by the sweep.
 */
export const WILDCARD_FLOOR_FRAC = Number(process.env.WILDCARD_FLOOR_FRAC ?? "0.5");

/**
 * The dominant domain = the 1-char domain of the cluster with the most surfaced
 * rows (tiebreak: the cluster whose head has the higher rankScore). null for an
 * empty set.
 */
function dominantDomain<T extends { romeCode: string; rankScore: number }>(
  dirs: T[],
): string | null {
  if (dirs.length === 0) return null;
  const byCluster = new Map<string, T[]>();
  for (const d of dirs) {
    const key = clusterKey(d.romeCode);
    let group = byCluster.get(key);
    if (!group) { group = []; byCluster.set(key, group); }
    group.push(d);
  }
  let best: { key: string; size: number; headScore: number } | null = null;
  for (const [key, group] of byCluster) {
    const headScore = Math.max(...group.map((g) => g.rankScore));
    if (
      !best ||
      group.length > best.size ||
      (group.length === best.size && headScore > best.headScore)
    ) {
      best = { key, size: group.length, headScore };
    }
  }
  return best ? domainOf(best.key + "0000") : null; // key is already a domain-leading string
}

/**
 * At most ONE cross-domain wildcard (spec §5). Highest-rankScore direction whose
 * domain differs from the dominant domain, provided its rankScore ≥ floorFrac ×
 * (top overall rankScore). Returns null when nothing qualifies — honesty over
 * always-filling the slot. NOT rarity-based; rankScore is the credibility axis.
 */
export function selectWildcard<T extends { romeCode: string; rankScore: number }>(
  dirs: T[],
  floorFrac: number = WILDCARD_FLOOR_FRAC,
): T | null {
  if (dirs.length === 0) return null;
  const dom = dominantDomain(dirs);
  if (dom == null) return null;
  const topOverall = Math.max(...dirs.map((d) => d.rankScore));
  const floor = floorFrac * topOverall;
  const candidates = dirs
    .filter((d) => domainOf(d.romeCode) !== dom && d.rankScore >= floor)
    .sort((a, b) => b.rankScore - a.rankScore || a.romeCode.localeCompare(b.romeCode));
  return candidates[0] ?? null;
}
```

> Note: `domainOf(best.key + "0000")` just takes the first char of the 3-char cluster key; `domainOf` slices index 0 so the padding is inert. Equivalent to `best.key[0]`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node node_modules/tsx/dist/cli.mjs scripts/coherence-unit-proof.ts`
Expected: PASS — `COHERENCE UNIT PROOF: 10 checks passed · COHERENCE_K=0.15`

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine/coherence.ts scripts/coherence-unit-proof.ts
git commit -m "$(cat <<'EOF'
feat(coherence): cross-domain wildcard selection with honesty floor

selectWildcard picks the highest-rankScore direction outside the
dominant domain, gated by a relative rankScore floor; returns null
(no wildcard) when nothing credible qualifies. Proved for pick /
below-floor / single-domain cases.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire coherence into results.ts

**Files:**
- Modify: `src/lib/engine/results.ts` (add fields to `ResultDirection`; call coherence after the level-demote loop)
- Modify: `src/lib/engine/coherence.ts` (add the orchestrator `applyCoherence`)
- Test: `scripts/coherence-unit-proof.ts` (extend with an `applyCoherence` composition check)

**Interfaces:**
- Consumes: `coherencePenalties`, `selectWildcard`, `CoherenceFormula` from Tasks 1–2. `ResultDirection` from `results.ts` (has `displayRank: number`, `rankScore: number`, `romeCode: string`).
- Produces:
  - In `coherence.ts`: `COHERENCE_FORMULA: CoherenceFormula` (env `COHERENCE_FORMULA`, default `"strength"`) and
    `applyCoherence<T extends { romeCode: string; rankScore: number; displayRank: number }>(dirs: T[]): { penalties: Map<T, number>; wildcard: T | null }`
  - In `results.ts`: `ResultDirection` gains `coherenceCluster: string`, `coherencePenalty: number`, `coherenceRank: number`, `isWildcard?: boolean`.

- [ ] **Step 1: Write the failing test**

Append to `scripts/coherence-unit-proof.ts` (before the summary):

```ts
// --- applyCoherence: composes penalty into coherenceRank and picks a wildcard ---
import { applyCoherence } from "../src/lib/engine/coherence";
{
  type D = { romeCode: string; rankScore: number; displayRank: number };
  const d = (romeCode: string, rankScore: number): D => ({ romeCode, rankScore, displayRank: rankScore });
  const dirs: D[] = [
    d("J1501", 10), d("J1502", 9), d("J1503", 8),
    d("M1805", 7),
  ];
  const { penalties, wildcard } = applyCoherence(dirs);
  // head untouched → coherenceRank == displayRank for J1501
  assert.equal(penalties.get(dirs[0]), 0, "applyCoherence: cluster head penalty 0");
  // wildcard is the cross-domain M1805
  assert.ok(wildcard && wildcard.romeCode === "M1805", "applyCoherence: wildcard = M1805");
  // coherenceRank = displayRank·(1−penalty) ≤ displayRank for every row
  for (const row of dirs) {
    const cr = row.displayRank * (1 - penalties.get(row)!);
    assert.ok(cr <= row.displayRank + 1e-9, "coherenceRank never exceeds displayRank");
  }
  ok("applyCoherence composes penalty + selects wildcard");
}
```

Change the final summary expected count to `11`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node node_modules/tsx/dist/cli.mjs scripts/coherence-unit-proof.ts`
Expected: FAIL — `applyCoherence` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/engine/coherence.ts`:

```ts
/**
 * Which formula the engine uses. Default "plain" (the SIMPLER incumbent) — the
 * sweep (spec §7) must show that "strength" earns its added complexity on
 * inversion evidence before it is promoted to the default. Overridable via env so
 * the sweep can drive both. If plain wins, delete the strength branch entirely
 * rather than keep dead complexity in the engine.
 */
export const COHERENCE_FORMULA: CoherenceFormula =
  (process.env.COHERENCE_FORMULA as CoherenceFormula) === "strength" ? "strength" : "plain";

/**
 * Orchestrator: compute per-direction coherence penalties (COHERENCE_FORMULA) and
 * select the one cross-domain wildcard. Pure — the caller composes coherenceRank
 * and stamps fields. Kept separate from stamping so it stays unit-testable.
 */
export function applyCoherence<
  T extends { romeCode: string; rankScore: number; displayRank: number },
>(dirs: T[]): { penalties: Map<T, number>; wildcard: T | null } {
  return {
    penalties: coherencePenalties(dirs, COHERENCE_FORMULA),
    wildcard: selectWildcard(dirs),
  };
}
```

Now wire it into `src/lib/engine/results.ts`. First extend the `ResultDirection` type — add these fields after `displayRank: number;` (around line 53):

```ts
  /**
   * COHERENCE layer (spec 2026-07-23, display-order only). The 3-char ROME
   * sub-domain cluster this direction belongs to.
   */
  coherenceCluster: string;
  /** Diminishing-returns down-weight ∈ [0,1] for over-represented cluster tails. */
  coherencePenalty: number;
  /**
   * displayRank × (1 − coherencePenalty) — the value the page sorts the VISIBLE
   * order by. Layered on top of displayRank (which keeps the level-demote); each
   * demote applied exactly once. Never gates, never a verdict, never shown.
   */
  coherenceRank: number;
  /**
   * True for the single cross-domain wildcard (spec §5), pinned first in its own
   * bucket and labelled honestly by the UI. Absent when no credible wildcard.
   */
  isWildcard?: boolean;
```

Then, in `buildResults`, add the import at the top with the other engine imports:

```ts
import { applyCoherence, clusterKey } from "./coherence";
```

Replace the `directions` construction + `byCategory` fill (currently lines ~186–209). The existing map builds `ResultDirection`s with `displayRank`. Insert the coherence pass AFTER that map and BEFORE the `byCategory` loop:

```ts
  const directions: ResultDirection[] = surviving.map(({ d, thinMarketSeeded }) => {
    const penalty = levelPenalty(d, user);
    return {
      ...d,
      bucketResult: bucket(d, inventory),
      levelPenalty: penalty,
      displayRank: displayRank(d.rankScore, penalty),
      // coherence fields stamped in the pass below; placeholders keep the type total
      coherenceCluster: clusterKey(d.romeCode),
      coherencePenalty: 0,
      coherenceRank: displayRank(d.rankScore, penalty),
      ...(thinMarketSeeded ? { thinMarketSeeded: true } : {}),
      ...(excluded.has(d.romeCode) ? { excludedButSurfaced: true } : {}),
    };
  });

  // COHERENCE pass (spec 2026-07-23) — display-order only. Runs over the full
  // surfaced+demoted set, stamps coherencePenalty / coherenceRank, flags the one
  // wildcard. rankScore, displayRank, buckets and tiers are all untouched.
  const { penalties, wildcard } = applyCoherence(directions);
  for (const dir of directions) {
    const p = penalties.get(dir) ?? 0;
    dir.coherencePenalty = p;
    dir.coherenceRank = dir.displayRank * (1 - p);
  }
  if (wildcard) wildcard.isWildcard = true;
```

(The `byCategory` loop below stays exactly as-is.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node node_modules/tsx/dist/cli.mjs scripts/coherence-unit-proof.ts`
Expected: PASS — `COHERENCE UNIT PROOF: 11 checks passed`

Then typecheck the wiring: `node node_modules/tsx/dist/cli.mjs -e "import('./src/lib/engine/results.ts').then(()=>console.log('results.ts imports OK'))"`
Expected: `results.ts imports OK` (no type/resolve errors).

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine/coherence.ts src/lib/engine/results.ts scripts/coherence-unit-proof.ts
git commit -m "$(cat <<'EOF'
feat(coherence): wire coherenceRank + wildcard into buildResults

applyCoherence orchestrates penalty + wildcard; results.ts stamps
coherenceCluster / coherencePenalty / coherenceRank / isWildcard after
the level-demote loop. displayRank, rankScore, buckets, tiers untouched.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Results page — sort visible order by coherenceRank, pin wildcard in-place

**Files:**
- Modify: `src/app/results/page.tsx`

**Interfaces:**
- Consumes: `ResultDirection.coherenceRank`, `ResultDirection.isWildcard` from Task 3.
- Produces: no new exports — presentation only.

- [ ] **Step 1: Change the display sort to coherenceRank + wildcard pin**

In `src/app/results/page.tsx`, replace `sortForDisplay` (lines 44–49) with a coherence-aware sort that pins any wildcard first, then orders by `coherenceRank`:

```ts
/**
 * Visible-order sort (spec 2026-07-23): the wildcard (if this group holds it) is
 * pinned FIRST so it's always above the bucket's cap; everything else by
 * coherenceRank desc, coverage tiebreak. Engine order (rankScore) is untouched;
 * this reshapes only what the visible cap slices from.
 */
function sortForDisplay(group: ResultDirection[]): ResultDirection[] {
  return [...group].sort(
    (a, b) =>
      Number(b.isWildcard ?? false) - Number(a.isWildcard ?? false) ||
      b.coherenceRank - a.coherenceRank ||
      b.coverage - a.coverage,
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `node node_modules/tsx/dist/cli.mjs -e "import('./src/app/results/page.tsx').then(()=>console.log('page imports OK')).catch(e=>{console.error(e);process.exit(1)})"`
Expected: `page imports OK`.

> Note: the wildcard's honest *label copy* ("une piste inattendue — hors de votre domaine principal") is roadmap #4 (the UI pass). This task wires the flag + placement only; `DirectionCard` reading `d.isWildcard` for the label is deferred to #4 per spec §9. Do not add label copy here.

- [ ] **Step 3: Commit**

```bash
git add src/app/results/page.tsx
git commit -m "$(cat <<'EOF'
feat(coherence): results page sorts visible order by coherenceRank

Wildcard pinned first in its own bucket; remaining rows ordered by
coherenceRank (coverage tiebreak). Bucket integrity preserved — a
thin-market wildcard stays in its market-earned bucket. Label copy
deferred to the UI pass (#4).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: The K-sweep proof + honesty regression

**Files:**
- Create: `scripts/coherence-sweep.ts`
- Add: `package.json` script `"coherence:sweep"`

**Interfaces:**
- Consumes: `buildResults` (`results.ts`), `buildInventory` (`quiz/build-inventory.ts`), `clusterKey` / `domainOf` (`coherence.ts`). Reuses persona `Answers` shapes from `coherence-audit.ts` + `merge-coherence-sante.ts`.
- Produces: a per-persona report file `scripts/_coherence-sweep-out.txt`. No code exports.

- [ ] **Step 1: Write the sweep script**

Create `scripts/coherence-sweep.ts`. It drives the live flow per persona, per `K`, per formula by re-importing `buildResults` with env overrides applied per run (spawn a child per (K, formula) so `COHERENCE_K` / `COHERENCE_FORMULA` are read fresh), and reports the spec §7 metrics.

```ts
/**
 * COHERENCE SWEEP (live graph) — the spec §7 proof. For each (K, formula), runs
 * the SAME flow the UI uses (buildInventory → buildResults) per persona and
 * reports, in the VISIBLE band (top-8 by coherenceRank, wildcard pinned):
 *   • santé wall count  — H-cluster rows + the wall's own J-cluster count (target 2–3)
 *   • dominant-cluster share (before = displayRank order, after = coherenceRank order)
 *   • single-family tech survival — genuine-range rows kept in the visible band
 *   • inversion check — top-quartile rankScore rows pushed BELOW the visible cap
 *   • wildcard — present/absent + which domain
 *
 * Because COHERENCE_K / COHERENCE_FORMULA are read at import time, each (K,
 * formula) runs in a CHILD process with those env vars set, and prints one block.
 * The parent loops the grid and concatenates.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/coherence-sweep.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { clusterKey, domainOf } from "../src/lib/engine/coherence";

const OUT = "scripts/_coherence-sweep-out.txt";
const CHILD = process.env.COHERENCE_CHILD === "1";

const DOM: Record<string, string> = {
  A: "agriculture", B: "artisanat", C: "banque", D: "commerce", E: "communication",
  F: "BTP", G: "hôtellerie", H: "industrie", I: "maintenance", J: "santé",
  K: "services-personne", L: "spectacle", M: "support/admin/IT", N: "transport",
};

// Personas: the 5 cognitive (coherence-audit.ts) + santé-seed merge (merge-coherence-sante.ts)
// + a concentrated single-family tech profile for the survival guard.
const PERSONAS: { name: string; ans: Answers; wall?: boolean; tech?: boolean }[] = [
  { name: "santé-seed + hands-on", wall: true, ans: {
    seed_families: "sante:soin", sf_hands_organise: "plutot_a", f_scale_task: "plutot_a", c_departement: "75",
  } },
  { name: "single-family tech (seed)", tech: true, ans: {
    seed_families: "tech:code", c_departement: "75",
  } },
  { name: "hands-on/technical", ans: {
    sf_hands_organise: "plutot_a", sf_sell_fix: "plutot_b", sf_digital_tools: "plutot_b",
    f_order_improv: "plutot_b", g_teach_do: "plutot_b", f_energy_context: "plutot_b",
    sf_client_issue: "plutot_a", c_departement: "75",
  } },
  { name: "people/care", ans: {
    sf_numbers_people: "plutot_b", g_conflict: "plutot_a", g_teach_do: "plutot_a",
    sf_client_issue: "plutot_b", g_boundaries: "plutot_b", sf_write_explain: "plutot_b",
    g_hidden_need: "plutot_a", c_departement: "75",
  } },
  { name: "analytical/systems", ans: {
    f_surface_depth: "plutot_b", sf_data_files: "plutot_b", f_order_improv: "plutot_a",
    f_scale_task: "plutot_a", sf_digital_tools: "plutot_a", f_repeat_problem: "plutot_a",
    sf_numbers_people: "plutot_a", c_departement: "75",
  } },
  { name: "commercial/leadership", ans: {
    sf_sell_fix: "plutot_a", g_lead_support: "plutot_a", g_status_authority: "plutot_a",
    sf_commercial_signal: "plutot_a", f_decide_wait: "plutot_a", g_group_energy: "plutot_a",
    c_departement: "75",
  } },
];

const VISIBLE = 8; // the visible band we measure (matches the hero/bridge caps' scale)

function visibleBand(dirs: ResultDirection[]): ResultDirection[] {
  return [...dirs]
    .sort(
      (a, b) =>
        Number(b.isWildcard ?? false) - Number(a.isWildcard ?? false) ||
        b.coherenceRank - a.coherenceRank ||
        b.coverage - a.coverage,
    )
    .slice(0, VISIBLE);
}

function domSpread(band: ResultDirection[]): string {
  const by: Record<string, number> = {};
  for (const d of band) by[domainOf(d.romeCode)] = (by[domainOf(d.romeCode)] ?? 0) + 1;
  return Object.entries(by).sort((a, b) => b[1] - a[1])
    .map(([L, n]) => `${DOM[L] ?? L}:${n}`).join("  ");
}

async function runChild(out: (l?: string) => void) {
  const K = process.env.COHERENCE_K ?? "0.15";
  const F = process.env.COHERENCE_FORMULA ?? "plain";
  out("#".repeat(100));
  out(`# K=${K}  FORMULA=${F}`);
  out("#".repeat(100));
  for (const p of PERSONAS) {
    const r = await buildResults(buildInventory(p.ans));
    const dirs = r.directions;
    // BEFORE band = displayRank order (pre-coherence). AFTER = coherenceRank order.
    const before = [...dirs].sort((a, b) => b.displayRank - a.displayRank || b.coverage - a.coverage).slice(0, VISIBLE);
    const after = visibleBand(dirs);

    out("");
    out(`── ${p.name} ─ surfaced=${dirs.length}`);
    out(`   BEFORE domains: ${domSpread(before)}`);
    out(`   AFTER  domains: ${domSpread(after)}`);

    if (p.wall) {
      const hBefore = before.filter((d) => domainOf(d.romeCode) === "H").length;
      const hAfter = after.filter((d) => domainOf(d.romeCode) === "H").length;
      const jAfter = after.filter((d) => domainOf(d.romeCode) === "J").length;
      out(`   WALL: H(industrie) ${hBefore}→${hAfter}  ·  J(santé) after=${jAfter}   [target H≤3]`);
    }
    if (p.tech) {
      // survival: how many of the dominant tech cluster remain in the visible band.
      const domClusterAfter = new Map<string, number>();
      for (const d of after) domClusterAfter.set(clusterKey(d.romeCode), (domClusterAfter.get(clusterKey(d.romeCode)) ?? 0) + 1);
      const topCluster = [...domClusterAfter.entries()].sort((a, b) => b[1] - a[1])[0];
      out(`   TECH SURVIVAL: largest cluster in visible band = ${topCluster?.[0]} ×${topCluster?.[1]}   [guard: stays high]`);
    }

    // inversion: top-quartile rankScore rows pushed below the visible cap.
    const byRank = [...dirs].sort((a, b) => b.rankScore - a.rankScore);
    const q = Math.max(1, Math.floor(byRank.length / 4));
    const topQuartile = new Set(byRank.slice(0, q).map((d) => d.romeCode));
    const visibleCodes = new Set(after.map((d) => d.romeCode));
    const buried = [...topQuartile].filter((c) => !visibleCodes.has(c) &&
      before.some((d) => d.romeCode === c)); // was visible before, now below cap
    out(`   INVERSION: ${buried.length} top-quartile row(s) dropped from visible band${buried.length ? " → " + buried.slice(0, 5).join(",") : ""}`);

    const w = dirs.find((d) => d.isWildcard);
    out(`   WILDCARD: ${w ? `${w.romeCode} (${DOM[domainOf(w.romeCode)]})` : "none"}`);
  }
}

async function main() {
  if (CHILD) {
    const out = (l = "") => { process.stdout.write(l + "\n"); };
    await runChild(out);
    return;
  }
  writeFileSync(OUT, "");
  const out = (l = "") => { process.stdout.write(l + "\n"); appendFileSync(OUT, l + "\n"); };
  out("COHERENCE SWEEP — live graph · spec §7 proof");
  out(`ROME_SOURCE=${process.env.ROME_SOURCE} OFFER_SOURCE=${process.env.OFFER_SOURCE}`);

  const KS = ["0.10", "0.15", "0.20", "0.30"];
  const FORMULAS = ["plain", "strength"];
  for (const F of FORMULAS) {
    for (const K of KS) {
      const res = spawnSync(
        process.execPath,
        ["node_modules/tsx/dist/cli.mjs", "scripts/coherence-sweep.ts"],
        {
          encoding: "utf8",
          env: { ...process.env, COHERENCE_CHILD: "1", COHERENCE_K: K, COHERENCE_FORMULA: F },
        },
      );
      if (res.status !== 0) { out(res.stderr); process.exit(1); }
      out(res.stdout.trimEnd());
    }
  }
  out(`\n(full output → ${OUT})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

Add to `package.json` scripts:

```json
    "coherence:sweep": "tsx scripts/coherence-sweep.ts",
```

- [ ] **Step 2: Run the sweep on the live graph**

Run: `ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/coherence-sweep.ts`
Expected: a per-(formula, K) block for all 6 personas, each printing BEFORE/AFTER domain spreads, WALL line for santé, TECH SURVIVAL for tech, INVERSION count, and WILDCARD. No crash; exit 0.

> Seed values verified against `config/families.ts` + `build-inventory.ts` (format `"familyId:depthId"`, e.g. `"tech:code"`): `sante:soin` and `tech:code` are both real. If a future run needs a different niche, pick another real `family:subfamily` pair from `config/families.ts`; the metric logic is unchanged.

- [ ] **Step 3: Read the evidence and LOCK K + formula (human gate)**

Inspect `scripts/_coherence-sweep-out.txt`. Choose the (formula, K) that:
- brings santé's **H count to 2–3** (not 6),
- keeps **tech survival high** (largest tech cluster still dominates its visible band),
- has the **fewest inversions** (ideally 0 top-quartile rows buried),
- yields **exactly one wildcard** per persona (or an honest none).

**Read inversion count FIRST.** If `plain` shows ~0 inversions at a K that thins the santé wall to 2–3 without hurting tech survival, take **plain** and **delete the `strength` branch entirely** from `coherence.ts` (the `if (formula === "strength")` block and the `CoherenceFormula` "strength" arm) — do not keep dead complexity in the engine just because it's written. Only keep `strength` if plain's inversions at the wall-thinning K are materially worse and strength fixes them.

Set the chosen defaults in `coherence.ts` (`COHERENCE_K`, and `COHERENCE_FORMULA` only if strength survives) and record the decision + the numbers in a one-paragraph comment above `COHERENCE_K`, mirroring the `W_RARITY` / `RARITY_GENERIC_FLOOR` precedent. **This is a human-gated lock — surface the table to George; do not silently pick.**

- [ ] **Step 4: Commit the sweep + the locked constants**

```bash
git add scripts/coherence-sweep.ts package.json src/lib/engine/coherence.ts
git commit -m "$(cat <<'EOF'
feat(coherence): per-persona K-sweep proof + lock K/formula on evidence

scripts/coherence-sweep.ts reports santé wall count, tech survival,
inversion count, dominant-cluster share and wildcard per persona for
each (K, formula). K and formula locked to the values that thin the
santé wall to 2-3 without burying tech, documented inline.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Honesty regression — prove the invariants are intact

**Files:**
- Create: `scripts/coherence-honesty-proof.ts`

**Interfaces:**
- Consumes: `buildResults`, `buildInventory`, existing personas. No new exports.

- [ ] **Step 1: Write the invariant proof**

Create `scripts/coherence-honesty-proof.ts` — it asserts that turning coherence "off" (via a neutral K that yields no penalty, i.e. compare the SET of surfaced codes, buckets, and tiers with vs without coherence) leaves every honesty-critical output identical, and that coherence only reordered.

```ts
/**
 * COHERENCE HONESTY PROOF (live graph). Asserts spec §2: coherence changed ONLY
 * display order + one wildcard flag. The SET of surfaced romeCodes, each
 * direction's bucket category, its signal tier (from matchRaritySum), its
 * rankScore, and its displayRank are IDENTICAL to the pre-coherence build.
 * Exits non-zero on any violation.
 *
 * Method: buildResults already stamps coherence; the invariants are the fields
 * coherence must not have touched. We check internal consistency —
 *   • coherenceRank == displayRank·(1−coherencePenalty) for every row
 *   • coherencePenalty ∈ [0,1]; cluster heads have penalty 0
 *   • displayRank / rankScore / bucket / signal tier unchanged vs a rebuild with
 *     COHERENCE_K=0 (no thinning) — same set, same buckets, same tiers, and with
 *     K=0 coherenceRank==displayRank exactly.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/coherence-honesty-proof.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { signalStrength } from "../src/lib/engine/coverage";

const CHILD = process.env.COHERENCE_CHILD === "1";
const ANS: Answers = { seed_families: "sante:soin", sf_hands_organise: "plutot_a", f_scale_task: "plutot_a", c_departement: "75" };

async function snapshot() {
  const r = await buildResults(buildInventory(ANS));
  // Serializable projection of the honesty-critical fields, keyed by romeCode.
  return r.directions.map((d) => ({
    romeCode: d.romeCode,
    rankScore: d.rankScore,
    displayRank: d.displayRank,
    bucket: d.bucketResult.category,
    tier: signalStrength(d.matchRaritySum),
    coherencePenalty: d.coherencePenalty,
    coherenceRank: d.coherenceRank,
  }));
}

async function main() {
  if (CHILD) {
    process.stdout.write(JSON.stringify(await snapshot()));
    return;
  }
  // The live build with the engine's real coherence defaults.
  const live = await snapshot();

  // A rebuild with COHERENCE_K=0 → no penalty anywhere → the pre-coherence baseline.
  const child = spawnSync(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "scripts/coherence-honesty-proof.ts"],
    { encoding: "utf8", env: { ...process.env, COHERENCE_CHILD: "1", COHERENCE_K: "0" } },
  );
  assert.equal(child.status, 0, `baseline child failed: ${child.stderr}`);
  const base: typeof live = JSON.parse(child.stdout);

  const baseByCode = new Map(base.map((d) => [d.romeCode, d]));

  // (1) same SET of surfaced codes
  assert.equal(live.length, base.length, "same number of surfaced directions");
  for (const d of live) assert.ok(baseByCode.has(d.romeCode), `${d.romeCode} present in baseline`);

  // (2) rankScore, displayRank, bucket, tier IDENTICAL (coherence didn't touch them)
  for (const d of live) {
    const b = baseByCode.get(d.romeCode)!;
    assert.equal(d.rankScore, b.rankScore, `${d.romeCode} rankScore unchanged`);
    assert.equal(d.displayRank, b.displayRank, `${d.romeCode} displayRank unchanged`);
    assert.equal(d.bucket, b.bucket, `${d.romeCode} bucket unchanged`);
    assert.equal(d.tier, b.tier, `${d.romeCode} signal tier unchanged`);
  }

  // (3) coherenceRank == displayRank·(1−penalty); penalties in [0,1]
  for (const d of live) {
    assert.ok(d.coherencePenalty >= 0 && d.coherencePenalty <= 1, `${d.romeCode} penalty in [0,1]`);
    const expected = d.displayRank * (1 - d.coherencePenalty);
    assert.ok(Math.abs(d.coherenceRank - expected) < 1e-9, `${d.romeCode} coherenceRank composed correctly`);
  }

  // (4) with K=0 the baseline's coherenceRank must equal its displayRank exactly
  for (const b of base) {
    assert.ok(Math.abs(b.coherenceRank - b.displayRank) < 1e-9, `${b.romeCode} K=0 → coherenceRank==displayRank`);
  }

  process.stdout.write(`COHERENCE HONESTY PROOF: ${live.length} directions · all invariants intact ✓\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run it**

Run: `ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/coherence-honesty-proof.ts`
Expected: `COHERENCE HONESTY PROOF: <N> directions · all invariants intact ✓` and exit 0.

- [ ] **Step 3: Run the existing honesty scripts unchanged (no regression)**

Run: `ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/verify-honesty-layer.ts`
Expected: the existing honesty checks still pass (unchanged from before this feature). If it prints a pass/summary, confirm it matches the pre-feature run.

- [ ] **Step 4: Commit**

```bash
git add scripts/coherence-honesty-proof.ts
git commit -m "$(cat <<'EOF'
test(coherence): honesty regression — invariants intact

Proves coherence changed ONLY order + the wildcard flag: same surfaced
set, identical rankScore/displayRank/bucket/signal-tier vs a K=0
rebuild, and coherenceRank == displayRank·(1−penalty) everywhere.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**1. Spec coverage:**
- §2 boundary / invariants → Task 3 (fields, wiring after level-demote) + Task 6 (proof). ✓
- §3 cluster key + domain → Task 1. ✓
- §4 both penalty formulas + i=0 invariant + strength guard → Task 1. ✓
- §5 wildcard (cross-domain, floor, none-if-weak, pin-in-place, no market claim) → Task 2 (selection) + Task 4 (pin). Label copy correctly deferred to #4 per §9. ✓
- §6 composition (coherenceRank = displayRank·(1−penalty), applied once) → Task 3 + Task 6 check (3). ✓
- §7 K-sweep report with exact metrics + human-gated lock → Task 5. ✓
- §8 files (coherence.ts, coherence-sweep.ts, results.ts, page.tsx) → Tasks 1–5. ✓
- §9 out of scope (label copy) → explicitly excluded in Task 4 note. ✓

**2. Placeholder scan:** No TBD/TODO. Every code step shows full code. The one conditional ("if `sante:soin`/`tech:dev` aren't valid seed keys, substitute") is a real guard with a concrete resolution (check `config/families.ts`), not a placeholder — the metric logic is fully specified either way.

**3. Type consistency:** `clusterKey`, `domainOf`, `coherencePenalties`, `selectWildcard`, `applyCoherence`, `COHERENCE_K`, `WILDCARD_FLOOR_FRAC`, `COHERENCE_FORMULA` are named identically across Tasks 1→3 and the scripts. `ResultDirection` new fields (`coherenceCluster`, `coherencePenalty`, `coherenceRank`, `isWildcard`) match between Task 3's type edit and their reads in Tasks 4–6. `signalStrength(matchRaritySum)` and `bucketResult.category` match the real signatures in `coverage.ts` / `results.ts`.

## Notes carried from the spec
- Constants are **human-gated**: Task 5 Step 3 explicitly surfaces the sweep table to George before locking. Do not auto-pick.
- The two seeded personas' `seed_families` values must be verified real before the sweep runs (Task 5 Step 2 note).
