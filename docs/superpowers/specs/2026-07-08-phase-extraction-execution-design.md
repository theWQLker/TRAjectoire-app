# Phase Extraction — Execution Design

Companion to `PHASE_EXTRACTION_SPEC(2).md`. That document is the locked
*product* spec (what each phase includes/excludes). This document is the
*execution* design: the concrete folder layout, the resolutions to ambiguities
the product spec left implicit, and the build/verify order. Written after
reading every Phase-0 surgery target at HEAD.

## Locked decisions (from the user)

1. **Faithful strip, unused fields at 0.** `CandidateDirection` and
   `ResultDirection` keep every field across all three phases. Fields Phase 0
   doesn't compute (`leanScore`, `interestScore`, `mobilityScore`, `rarityScore`,
   `matchRaritySum`) stay in the type, set to `0` (or a coverage-derived proxy —
   see Decision D2). Consequence: **every `src/components/*` file, the results
   page, and the detail page copy AS-IS across all phases.** Surgery is confined
   to `src/lib/engine/*`, `src/lib/quiz/build-inventory.ts`, `config/*`, and the
   two client quiz components.
2. **Full verify per phase.** Each folder gets its own `npm install`, then
   `npx tsc --noEmit` must be clean, then the phase's honesty script must pass
   (`verify-phase0-honesty.ts` for Phase 0; `verify-honesty-layer.ts` for
   Phase 1+).
3. **Build order: Phase 0 → Phase 1 → Phase 2.** Phase 0 is the hardest surgery
   and the highest-value deliverable (the one a BPI evaluator clicks).

## Folder layout

Self-contained copies. Each phase is a full, independently deployable Next.js
app.

```
phased/
  phase-0/    full app — simplified engine, seed-only flow, 7 families
  phase-1/    full app — full engine, seed-only flow, 14 families + depth
  phase-2/    full app — current HEAD, minus config/quizold.ts
```

Each folder contains its own `package.json`, `tsconfig.json`,
`postcss.config.mjs`, `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts`,
`src/`, `config/`, `fixtures/`, `public/`, `scripts/` (phase-appropriate
subset), `supabase/`, `.env.local.example`, and `README.md`. Build artifacts
(`.next/`, `node_modules/`, `tsconfig.tsbuildinfo`, `.vercel/`,
`.playwright-mcp/`) are NOT copied.

The root prototype (branch `trajectoire-ui`) is never modified. All work lands
under `phased/`.

## Resolutions to spec ambiguities (discovered by reading HEAD)

### D1 — Shared display components read `matchRaritySum`, not coverage
`DirectionCard.tsx:61` and `direction/[romeCode]/page.tsx:52` both compute the
user-facing signal with `signalFromCoverage(signalStrength(d.matchRaritySum))`.
The product spec says Phase 0's signal must be **coverage-based** AND that
DirectionCard copies AS-IS. Those conflict unless we bridge them.

**Resolution:** In Phase 0, keep the shared components AS-IS. Make the engine
feed them coverage-derived signal by BOTH:
  - Rewriting `coverage.ts::signalStrength` to accept and threshold **coverage**
    against `COVERAGE_TIERS` (STRONG 0.6 → strong, PARTIAL 0.4 → partial, else
    exploratory), and
  - Setting each candidate's `matchRaritySum = coverage` in the Phase-0
    proposer, so the AS-IS call `signalStrength(d.matchRaritySum)` reads the
    coverage value and produces coverage-based fort/moyen/faible.

This satisfies "coverage-based signal" and "components AS-IS" simultaneously.
`SIGNAL_RARITY_TIERS` is removed; `signalStrength`'s parameter is renamed in
spirit (it now receives coverage) but keeps the exported name so no caller
changes. The rarity-based variant does not exist in Phase 0.

### D2 — `matchRaritySum` as a coverage proxy
Because DirectionCard's `coverageFr()` also branches on
`signalStrength(d.matchRaritySum)` for its wording, setting
`matchRaritySum = coverage` keeps that wording coherent (strong wording for
high coverage, thin-link wording for low). This is the "0 may be safer than
removing" principle applied: rather than a bare 0 that would force every card to
"exploratory", we feed the one field the AS-IS UI reads with the coverage
signal it needs. All OTHER unused fields (`leanScore`, `interestScore`,
`mobilityScore`, `rarityScore`) are literal `0`.

### D3 — `build-inventory.ts` and the proposer both import `config/clusters.ts`
Phase 0 deletes `config/clusters.ts` (no cognitive quiz). Two files import it:
  - `graph-direction-proposer.ts` (builds `CODE_TO_CLUSTERS` for `leanScore`) —
    removed entirely in the skill-bridge-only rewrite.
  - `build-inventory.ts` (`CLUSTER_CODES`, the cognitive-code injection loop) —
    removed per spec. The remaining seed injection does not need clusters.
`config/quiz.ts` itself does NOT import clusters (its `clusters?` fields are
inline type members), so the stubbed quiz.ts is clean.

### D4 — Script deletion is safe because imports go with them
Most `scripts/*` import the very engine files Phase 0 simplifies (coverage,
level-demote, clusters). Phase 0 keeps ONLY `verify-phase0-honesty.ts` (new) and
whatever it imports (`results.ts`, `inventory.ts`). Every other script is simply
not copied — no dangling imports because the scripts themselves are gone.
Fixture generation is not needed at runtime (fixtures are copied as data).

### D5 — `results.ts` `P2_INVENTORY` and the level-demote import
`results.ts` imports `userLevel, levelPenalty, displayRank` from `level-demote`
(deleted in Phase 0) and defines `P2_INVENTORY` (the demo fallback the results
page uses when there's no session). Phase 0:
  - Removes the level-demote import + call; `levelPenalty` always 0,
    `displayRank = d.rankScore`.
  - Removes `isSeededStrongThinMarket` / `thinMarketSeeded` / exclusion flagging.
  - Keeps `P2_INVENTORY` but simplifies it to a seed-only demo inventory (the
    results page still needs a no-session fallback; `results/page.tsx` imports
    `P2_INVENTORY` at line 11 and uses it at line 123). Keeping the export name
    means `results/page.tsx` copies AS-IS.

### D6 — `bucketer.ts` keeps `matchedCompetenceCodes`; only the denominator changes
Phase 0 `bucketCoverage = direction.coverage` (no seeded/cognitive split).
`strong = direction.coverage >= STRONG_COVERAGE`. The gate logic (unmetGates from
`requirementProfile`) is UNCHANGED — it reads `market`, not the cognitive split.
`inventory.seededCodes` may be absent; the code must not depend on it.

## Phase 0 file-by-file (engine surgery)

| File | Action |
|------|--------|
| `config/families.ts` | Simplify: 7 families (tech, sante, btp, commerce, hotellerie, admin, services); drop depth sub-arrays to family-level union; `seedCodesFor` reads family-level union; remove `excludedCodesFor`, `seedCodesWithExclusions`. |
| `config/clusters.ts` | DELETE |
| `config/quiz.ts` | Stub: keep `Lean` + `LEAN_WEIGHTS` (+ `Lean`-adjacent types build-inventory imports), keep `c_departement` quick-pick only; remove scenes, other quick-picks, `CLUSTER_CATALOG`, `TENSION_MAP`, `FINANCIAL_MAP`, `CATEGORIES` scene content. `CATEGORIES` becomes an empty (or departement-only) list so build-inventory's loop compiles and yields no cognitive codes. |
| `config/quizold.ts` | DELETE |
| `config/rates.ts` | DELETE |
| `config/buckets.ts` | Keep THIN_DEMAND_MAX, GATE_FRACTION, BRIDGE_MAX_GATES, Category, labels; STRONG_COVERAGE value retained but now compared against simple coverage. |
| `graph-direction-proposer.ts` | Big surgery. Remove direct/mobilite/interest leaps, rarity, all normalisers, all weights except W_LEAP_TIER (0.6) and W_COVERAGE (0.8). Keep skill-bridge loop + coverage. `rankScore = LEAP_TIER["skill_bridge"]*0.6 + (coverage/maxCoverage)*0.8`. Set unused candidate fields to 0; `matchRaritySum = coverage` (D2). |
| `bucketer.ts` | `bucketCoverage = direction.coverage`; drop seeded/cognitive split. Gate logic unchanged. |
| `level-demote.ts` | DELETE |
| `coverage.ts` | `signalStrength` thresholds coverage (D1); remove `SIGNAL_RARITY_TIERS`. Keep `coverageStrength`, `COVERAGE_TIERS`, `isExploratory`, `coveragePhrase`. |
| `results.ts` | Remove level-demote + surface-with-label; `displayRank = rankScore`, `levelPenalty = 0`, no `thinMarketSeeded`/`excludedButSurfaced`. Keep buildResults orchestration, `isDeadEndBridge`, honestFork, suppressed, byCategory. Simplify `P2_INVENTORY` to seed-only (D5). |
| `build-inventory.ts` | Remove cognitive cluster injection (`CLUSTER_CODES` loop) and exclusion parsing. Keep seed injection (`seedCodesFor`) + departement capture. `seededCodes` still populated. |
| `QuizFlow.tsx` | Remove chapter phase. Flow = seed → submit. Keep form + hidden answers + server action. |
| `SeedStep.tsx` | 7 families, no depth/exclusion UI. Pick 1+ families → continue. |
| `results/page.tsx` | COPY AS-IS (reads `P2_INVENTORY`, `displayRank`, DirectionCard). |
| `DirectionCard.tsx`, `SignalBadge.tsx`, `AdCard.tsx`, all components | COPY AS-IS. |
| `direction/[romeCode]/page.tsx`, `offers/[romeCode]/page.tsx` | COPY AS-IS. |
| Data layer (`src/lib/rome`, `src/lib/offers`, `src/lib/ingest`, `supabase.ts`, `ui.ts`, `inventory.ts`, `direction-proposer.ts`, `market-reality.ts`, `honest-fork.ts`) | COPY AS-IS. `intersection.ts` may be dropped (dormant, imports clusters). |
| Scripts | Only `verify-phase0-honesty.ts` (new). |

### `verify-phase0-honesty.ts` invariants (Phase 0 only)
1. No `verdict` / `disqualifier` / `final_score` JSON key in output.
2. Every surfaced direction has a non-empty `why`.
3. `signalStrength(coverage)` yields fort/moyen/faible across a seeded profile
   (all three tiers reachable).
4. Weak results are not presented as final recommendations (suppressed counted).
5. Market receipts attach when offers exist.
6. `suppressed` is an array, counted, never silent.
7. Coverage floor holds (every surfaced direction skill-backed: skill_bridge or
   ≥1 matched code).

## Phase 1 (after Phase 0 approved)

Near-copy of HEAD. `config/clusters.ts` DELETE; `config/quiz.ts` stub (keep
`c_departement` + `c_diploma` for level-demote); everything else COPY AS-IS
including full `graph-direction-proposer.ts`, `bucketer.ts`, `level-demote.ts`,
`coverage.ts` (rarity-based `signalStrength`), full `families.ts`, full
`SeedStep.tsx`. `QuizFlow.tsx` simplified to seed → submit (no scenes). Scripts:
`verify-honesty-layer.ts` + `lean-bucket-fix-proof.ts`.

**Caveat to verify:** `build-inventory.ts` imports `CLUSTERS` from
`config/clusters.ts`. Phase 1 deletes clusters.ts but keeps the full engine.
`graph-direction-proposer.ts` ALSO imports CLUSTERS. So Phase 1 canNOT delete
clusters.ts without either (a) keeping it, or (b) stubbing CLUSTERS to `[]`.
Resolution: **keep `config/clusters.ts` in Phase 1** (the engine needs the
CODE_TO_CLUSTERS map even though no quiz populates clusterScores — with empty
clusterScores, leanScore is 0, which is the intended "structurally present,
inactive" behavior). This overrides the product spec's "clusters.ts DELETE" for
Phase 1 on a hard compile dependency. Flag for user. (Phase 0 CAN delete it
because Phase 0 rewrites both importers.)

## Phase 2 (last)

Copy the whole repo into `phased/phase-2/`, delete `config/quizold.ts`, exclude
git-ignored temp files. `tsc --noEmit` + full flow.

## Verify per phase

```
cd phased/phase-N
npm install
npx tsc --noEmit          # must be clean
# honesty script:
node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/verify-phase0-honesty.ts   # P0
# (P1: verify-honesty-layer.ts; P2: + lean-bucket-fix-proof.ts)
```

Manual click-through (seed → results, cards render, fort/moyen/faible present,
why on every card, offers on detail) is the human gate George runs; noted, not
automated here.

## Open item flagged to user
The Phase 1 `clusters.ts` compile dependency (see Phase 1 caveat) contradicts
the product spec's "DELETE". Recommend keeping clusters.ts in Phase 1. Confirm
before Phase 1 build.
