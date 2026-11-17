# Trajectoire -- Phase Extraction Spec

## What this document is

This is the single source of truth for extracting separate, deployable
phase-specific applications from the full Trajectoire R&D prototype.
It merges three inputs:

1. The commercial phase plan (what each phase includes/excludes and why)
2. The codebase state report (exact files, constants, dependencies)
3. The surgical extraction map (what to copy, simplify, or delete)

The full prototype stays untouched in its repo (branch trajectoire-ui).
Each phase extract is a separate folder that deploys independently.


## Codebase ground truth (verified from HEAD, branch trajectoire-ui)

### Repository state
Branch: trajectoire-ui. Working tree: clean.
HEAD: 2cf349d (quiz copy rewrite).
Lean-order + apply_now bucket fixes committed at d7df830.
ROME_SOURCE defaults to "fixture". OFFER_SOURCE in .env.local.
No vercel.json. No middleware. No API routes. No route.ts anywhere.

### Source tree (files that matter for extraction)

```
src/app/
  layout.tsx              Root layout (Inter + Source Serif 4, globals.css)
  page.tsx                Landing page (server)
  globals.css             Tailwind v4 theme tokens (78 lines)
  quiz/
    page.tsx              Quiz shell (server, renders QuizFlow)
    QuizFlow.tsx          CLIENT: seed phase + chapter phase (41 scenes)
    SeedStep.tsx          CLIENT: 14 families + depth multi-select + exclusion
    actions.ts            Server action: submitQuiz -> buildInventory -> session -> redirect
  results/
    page.tsx              SERVER (force-dynamic): buildResults -> render buckets
    direction/[romeCode]/
      page.tsx            Direction detail (server)
    offers/[romeCode]/
      page.tsx            Offer receipts list (server)

src/components/
  AdCard.tsx              One job receipt card
  Card.tsx                Base surface primitive
  Chip.tsx                Small pill (neutral/skill/count)
  DirectionCard.tsx       Main results card (signal, badges, why, honesty)
  IconCircle.tsx          Tinted circle + Lucide icon
  SignalBadge.tsx         "Piste solide" / "Piste a explorer" / null
  SiteHeader.tsx          Branded header

src/lib/engine/
  graph-direction-proposer.ts   THE engine: 4 leaps, rarity, rankScore composite
  direction-proposer.ts         Types: LeapType, CandidateDirection, DirectionProposer
  bucketer.ts                   4-bucket assignment (cognitive denominator)
  level-demote.ts               Overqualified direction demotion
  coverage.ts                   Coverage tiers + signal strength helpers
  results.ts                    Orchestrator: buildResults() entry point
  honest-fork.ts                "No single path uses most of you" detection
  intersection.ts               Intersection engine (dormant, not in main pipeline)
  inventory.ts                  Inventory type definition
  market-reality.ts             Market check against cached offers

src/lib/quiz/
  build-inventory.ts            Answers -> Inventory (seed + cognitive)
  session-store.ts              Memory/Supabase session persistence

src/lib/rome/
  rome-source.ts                RomeSource interface (the ROME seam)
  fixture-rome-source.ts        Fixture impl (reads JSON)
  live-rome-source.ts           Live impl (Supabase, dormant)
  index.ts                      Source switch (env ROME_SOURCE)
  competence-rarity.ts          IDF computation
  rome-metier.ts                RomeMetier type

src/lib/offers/
  offer-source.ts               OfferSource interface (the offers seam)
  fixture-offer-source.ts       Fixture impl
  live-offer-source.ts          Live impl (dormant)
  index.ts                      Source switch (env OFFER_SOURCE)
  offer.ts                      Offer type (mirrors FT Offres v2)

src/lib/ingest/
  ingest-run.ts                 Audit row for batch ingest
  rate-limiter.ts               Per-API rate limiter

src/lib/supabase.ts             Lazy Supabase clients (anon + service)
src/lib/ui.ts                   UI helpers

config/
  families.ts       14 families, 44 depths, 1025 member jobs, seed code arrays
  clusters.ts       47 clusters (11 hard-skill + 36 transversal), 5 empty
  buckets.ts        STRONG_COVERAGE 0.3, GATE_FRACTION 0.6, etc.
  quiz.ts           41 scenes, 5 quick-picks, 5 categories (2147 lines)
  quizold.ts        DEAD (imported nowhere)
  rates.ts          Auto-entrepreneur rates (Phase 2+ only)

scripts/                        ~40 diagnostic/proof/ingest harnesses
fixtures/                       Bundled JSON for offline dev
supabase/migrations/            DB schema (0001-0005 + seed)
```

### Exact engine constants (HEAD)

| Constant | Value | File |
|----------|-------|------|
| W_LEAP_TIER | 0.6 | graph-direction-proposer.ts |
| W_COVERAGE | 0.8 | graph-direction-proposer.ts |
| W_RARITY | 0.4 | graph-direction-proposer.ts |
| W_LEAN | 1.1 | graph-direction-proposer.ts |
| W_INTEREST | 0.25 | graph-direction-proposer.ts |
| W_MOBILITY | 0.08 | graph-direction-proposer.ts |
| DIRECT_COVERAGE_THRESHOLD | 0.4 | graph-direction-proposer.ts |
| MIN_LEAP_COVERAGE | 0 | graph-direction-proposer.ts |
| RARITY_GENERIC_FLOOR | 3 (env) | graph-direction-proposer.ts |
| STRONG_COVERAGE | 0.3 (env) | buckets.ts / bucketer.ts |
| GATE_FRACTION | 0.6 | buckets.ts |
| BRIDGE_MAX_GATES | 2 | buckets.ts |
| THIN_DEMAND_MAX | 0 | buckets.ts |
| W_LEVEL_DEMOTE | 0.35 | level-demote.ts |
| DEEP_SEED_MATCH_FLOOR | 200 | results.ts |
| COVERAGE_TIERS.STRONG | 0.6 | coverage.ts |
| COVERAGE_TIERS.PARTIAL | 0.4 | coverage.ts |
| SIGNAL_RARITY_TIERS.FORT | 50 | coverage.ts |
| SIGNAL_RARITY_TIERS.MOYEN | 15 | coverage.ts |
| MOST_OF_INVENTORY | 0.6 | honest-fork.ts |

Leap-tier factors: direct 1.0, skill_bridge 0.75, mobilite 0.45, interest 0.25.

rankScore = LEAP_TIER[primary]*0.6 + (coverage/maxCov)*0.8 +
            (rarity/maxRar)*0.4 + (lean/maxLean)*1.1 +
            (interest/maxInt)*0.25 + mobility*0.08

### Key architectural facts

- Only 2 client components in the entire app: QuizFlow.tsx, SeedStep.tsx
- Everything else is server components (results, detail, landing)
- No API routes, no middleware, no route.ts
- Engine is fully self-contained under src/lib/engine/
- Engine depends only on seams (RomeSource, OfferSource) + config/
- Fixture mode makes it deployable with zero external services
- Session store falls back to in-memory when Supabase env vars absent
- config/quizold.ts is dead code (imported nowhere)


## Phase definitions (commercial plan, locked)

### Phase 0: Deployed POC
The simplest version that is genuinely functional. Proves graph
traversal works. The funder sees a working base; the impressive
quality jumps are ahead (and fundable).

Includes:
- Seed front door with 5-7 families (no depth sub-choices)
- Skill-bridge leap ONLY
- Coverage floor (prevents weak results)
- Fort / moyen / faible labels (coverage-based calculation)
- Paris market check with real job offers as receipts
- 8-12 ranked directions with "why this surfaced"
- Basic consent and session logging
- Disclaimer: exploration aid, not career verdict

Phase 0 logging constraint: no direct identity fields. No name,
email, phone, free-text notes, CV upload, or client identifier.
Store only: session ID, timestamp, selected families, department
constraint, surfaced directions, and anonymized usage events.
CNIL defines personal data broadly (including indirect identification
through identifiers or data combination), so Phase 0 logging must
stay pseudonymous and minimal.

Excludes:
- No rarity-weighting (rarity computation removed entirely)
- No mobilite leap
- No RIASEC/interest leap
- No direct-match refinement (just skill_bridge)
- No cognitive quiz (no scenes, no clusters, no lean signal)
- No level-demote
- No surface-with-label (amber thin-market labels)
- No cognitive denominator in bucketer
- No depth/niche sub-choices in seed
- No consultant dashboard or B2B features

### Phase 1: Engine quality upgrade (BFT-funded)
Adds rarity-weighting, all leaps, full taxonomy, honesty layer.
The "technical innovation milestone" for the BPI dossier.

Adds on top of Phase 0:
- All 4 leaps (direct, skill_bridge, mobilite, interest)
- Rarity-weighting (W_RARITY 0.4)
- Full ranking weights (current HEAD values)
- 14 families + 44 niches + depth sub-choices
- Rarity-aware signal tiers (matchRaritySum-based)
- Surface-with-label honesty (amber labels, DEEP_SEED_MATCH_FLOOR 200)
- Level-demote (W_LEVEL_DEMOTE 0.35)
- Cognitive denominator in bucketer (STRONG_COVERAGE 0.30)
- Exclusion API in seed

Still excludes:
- No cognitive quiz (no scenes, no clusters)
- No lean signal (W_LEAN contributes 0 because no quiz answers)
- No consultant dashboard or B2B features

### Phase 2: Full engine (current HEAD)
Everything. The cognitive quiz adds personalization. This is
Phase 2b in the commercial plan (2a is the consultant workflow,
which is a product layer, not an engine extraction).

Adds on top of Phase 1:
- Cognitive quiz (47 clusters, 41 scenes, 5 quick-picks)
- Lean signal active (W_LEAN 1.1, driven by quiz answers)
- Answer-sensitivity (different profiles get different ranges)
- Full build-inventory with cognitive cluster code injection


## Surgical extraction map

Each phase is a separate folder. The full prototype (trajectoire-ui)
is NEVER modified. Extraction = copy + simplify.

### Shared infrastructure (identical across all phases)

These files copy AS-IS to every phase extract:

```
src/lib/rome/                   Entire directory (seam + impls + types)
src/lib/offers/                 Entire directory (seam + impls + types)
src/lib/ingest/                 Entire directory (audit + rate limiter)
src/lib/supabase.ts             Supabase clients
src/lib/engine/inventory.ts     Inventory type
src/lib/engine/direction-proposer.ts   Types (LeapType, CandidateDirection, etc.)
src/lib/engine/market-reality.ts       Market check
src/lib/engine/honest-fork.ts   Honest fork detection
src/components/                 All components (Card, Chip, AdCard, SiteHeader, etc.)
src/app/layout.tsx              Root layout
src/app/globals.css             Theme tokens
src/app/page.tsx                Landing page
fixtures/                       Bundled JSON
config/buckets.ts               Bucket thresholds (constants may differ per phase)
package.json                    Dependencies (same across phases)
tsconfig.json                   Compiler config
postcss.config.mjs              Tailwind config
```

### Phase 0 extraction

#### config/families.ts -> SIMPLIFY
Keep only 7 families: tech, sante, btp, commerce, hotellerie, admin,
services. Remove the other 7 (maintenance, industrie, agriculture,
artisanat, banque, communication, transport). Remove all Depth
sub-arrays (keep only family-level id + label + domaines). Remove
seedCodesWithExclusions / excludedCodesFor exports.
seedCodesFor(picks) reads only the family-level codes (union of all
that family's depth seedCodes).

#### config/clusters.ts -> DELETE
Not used. No cognitive quiz.

#### config/quiz.ts -> SIMPLIFY HEAVILY
Keep only: Lean type + LEAN_WEIGHTS (build-inventory still references
these types even though no scenes are answered). Keep quick-pick
definitions for c_departement only (the only input Phase 0 captures
beyond seed). Remove all 41 scenes, all other quick-picks, all
categories, CLUSTER_CATALOG, TENSION_MAP, FINANCIAL_MAP.

#### config/quizold.ts -> DELETE
Dead code.

#### config/rates.ts -> DELETE
Not used until Phase 2+.

#### config/buckets.ts -> SIMPLIFY
Remove STRONG_COVERAGE env override (no cognitive denominator).
STRONG_COVERAGE value is irrelevant (apply_now uses simple coverage).
Keep THIN_DEMAND_MAX, GATE_FRACTION, BRIDGE_MAX_GATES, categories.

#### src/lib/engine/graph-direction-proposer.ts -> SIMPLIFY (the big surgery)
REMOVE:
- Direct match leap function/logic
- Mobilite leap function/logic
- Interest/RIASEC leap function/logic
- Rarity computation (distinctivenessScore, rarityScore, matchRaritySum)
- W_RARITY, W_LEAN, W_INTEREST, W_MOBILITY constants
- MOBILITY_NUDGE, RIASEC_RANK_WEIGHT
- rankNormalisers function (not needed with flat scoring)
- The normalization logic (maxLean, maxInterest, maxRarity, maxCoverage)

KEEP:
- Skill-bridge traversal (metiersWithCompetence loop)
- Coverage floor (MIN_LEAP_COVERAGE = 0)
- Coverage computation (matched / invSize)
- LEAP_TIER_SCORE (only skill_bridge entry needed)

SIMPLIFY rankScore to:
  rankScore = LEAP_TIER_SCORE["skill_bridge"] * W_LEAP_TIER
            + (coverage / maxCoverage) * W_COVERAGE
  (two terms only: leap tier + coverage)

W_LEAP_TIER stays 0.6. W_COVERAGE stays 0.8.
maxCoverage = max coverage across all surfaced (same normalization
principle, just fewer terms).

CandidateDirection type: keep all fields but leanScore, interestScore,
mobilityScore, rarityScore, matchRaritySum will be 0 (or remove them
from the type if cleaner; but the display layer reads some of them,
so 0 may be safer than removing).

#### src/lib/engine/bucketer.ts -> SIMPLIFY
REMOVE: cognitive denominator logic (seededCodes filtering,
cognitiveCodes, cognitiveMatched). bucketCoverage = direction.coverage
(the simple formula). strong = direction.coverage >= STRONG_COVERAGE.
Keep the bucket decision order (not_now / apply_now / bridge /
long_term) and gate logic unchanged.

#### src/lib/engine/level-demote.ts -> DELETE
Not used in Phase 0.

#### src/lib/engine/coverage.ts -> SIMPLIFY
signalStrength: change to coverage-based, NOT matchRaritySum-based.
Phase 0 signal tiers:
  coverage >= COVERAGE_TIERS.STRONG (0.6) -> "strong" (fort)
  coverage >= COVERAGE_TIERS.PARTIAL (0.4) -> "partial" (moyen)
  else -> "exploratory" (faible)
Remove signalStrength(matchRaritySum) variant.
Remove SIGNAL_RARITY_TIERS (not used).

#### src/lib/engine/results.ts -> SIMPLIFY
REMOVE: level-demote import and call (levelPenalty always 0).
REMOVE: surface-with-label logic (isSeededStrongThinMarket,
thinMarketSeeded flag, DEEP_SEED_MATCH_FLOOR).
displayRank = d.rankScore (no penalty, no demote).
ResultDirection: levelPenalty always 0, displayRank = rankScore,
thinMarketSeeded always false.
Keep: buildResults orchestration, surfacing gate (isDeadEndBridge),
honestFork, suppressed/heldBack, byCategory.
P2_INVENTORY: remove or replace with a simple seed-only fallback.

#### src/lib/quiz/build-inventory.ts -> SIMPLIFY
REMOVE: cognitive cluster code injection (the loop over clusterScores
that adds CLUSTER_CODES). clusterScores still captured from any
answered scenes (there won't be any), but no codes injected.
KEEP: seed code injection (seedCodesFor). KEEP: basic constraint
capture (departement). REMOVE: financial_inputs, tensions, exclusion
parsing (excludedJobs, seedCodesWithExclusions).
Inventory.seededCodes: still populated (same as competenceCodes for
Phase 0 since there are no cognitive codes).

#### src/app/quiz/QuizFlow.tsx -> SIMPLIFY
REMOVE: chapter phase entirely. Flow = seed step -> submit.
No scene rendering, no category iteration, no chapter navigation.
One phase: seed selection, then "Voir mes directions" button.
Keep the form + hidden answers + server action submit.

#### src/app/quiz/SeedStep.tsx -> SIMPLIFY
Show only the 7 Phase-0 families.
REMOVE: depth/niche sub-selection (no refineOpen state, no member
list, no exclusion panel). User picks 1+ families, that's it.
Clean card-per-family layout.

#### src/app/results/page.tsx -> ADJUST
signalStrength: call the coverage-based version (from simplified
coverage.ts). Everything else (bucket render order, VISIBLE_CAP,
DirectionCard, badge logic) stays the same.
Remove any reference to matchRaritySum in signal computation.

#### src/components/DirectionCard.tsx -> SIMPLIFY
REMOVE: thinMarketSeeded / excludedButSurfaced conditional rendering
(those flags are always false in Phase 0).
KEEP: fort/moyen/faible signal, badge rendering, "why surfaced" text,
bridge-gate box, offer count.

#### src/components/SignalBadge.tsx -> KEEP AS-IS
Already handles fort/moyen/faible correctly.

#### Scripts -> Phase 0 specific
Do NOT copy verify-honesty-layer.ts as-is. It expects full Phase 1
behavior (surface-with-label, rarity-aware tiers) and will produce
false failures against the deliberately stripped Phase 0 engine.

Create verify-phase0-honesty.ts checking Phase 0 invariants ONLY:
1. No verdict / disqualifier / final_score language in output
2. Every surfaced direction has a "why surfaced" explanation
3. Fort / moyen / faible labels render on results cards
4. Weak results are not presented as final recommendations
5. Market receipts attached when offers are available
6. Suppressed/held-back directions counted, never silent
7. Coverage floor enforced (no zero-skill-overlap directions surface
   through interest/mobilite -- irrelevant for Phase 0 since only
   skill_bridge is active, but the invariant holds)

Remove all other proof/diagnostic scripts.


### Phase 1 extraction

Phase 1 is the full engine MINUS the cognitive quiz. This is closer
to the current HEAD -- most files copy with minor simplification.

#### config/families.ts -> COPY AS-IS
All 14 families, 44 depths, 1025 members. Exclusion API included.

#### config/clusters.ts -> DELETE
Still no cognitive quiz in Phase 1.

#### config/quiz.ts -> SIMPLIFY
Same as Phase 0: keep Lean types, keep c_departement quick-pick,
keep c_diploma quick-pick (level-demote needs it). Remove scenes.

#### config/buckets.ts -> COPY AS-IS
STRONG_COVERAGE 0.3, cognitive denominator active.

#### src/lib/engine/graph-direction-proposer.ts -> COPY AS-IS
All 4 leaps, all weights (including W_LEAN 1.1 and W_RARITY 0.4),
rarity computation, full rankScore. W_LEAN will produce 0 contribution
because leanScore is 0 for all directions (no quiz answers), which is
correct: it's structurally present but inactive until Phase 2 adds
the quiz.

#### src/lib/engine/bucketer.ts -> COPY AS-IS
Cognitive denominator included. With no cognitive quiz answers,
seededCodes and competenceCodes will be identical for most profiles,
so cognitiveMatched will be ~0 and apply_now will be sparse.
This is honest behavior (no quiz answers = no "ready now" signal).

#### src/lib/engine/level-demote.ts -> COPY AS-IS
Active. Reads c_diploma from inventory.constraints.diploma.

#### src/lib/engine/coverage.ts -> COPY AS-IS
signalStrength uses matchRaritySum (rarity-aware tiers). Both
coverage-based and rarity-based functions present.

#### src/lib/engine/results.ts -> COPY AS-IS
Full pipeline including surface-with-label, level-demote.

#### src/lib/quiz/build-inventory.ts -> SIMPLIFY SLIGHTLY
Keep seed code injection. Keep constraint capture including diploma.
The cognitive cluster loop stays but produces nothing (no quiz answers
= clusterScores all 0 = no cognitive codes injected). Can keep as-is
for code simplicity, or remove the loop to be explicit.

#### src/app/quiz/QuizFlow.tsx -> SIMPLIFY
Same as Phase 0: seed step -> submit. No scene rendering.
But SeedStep.tsx shows full 14 families + depth sub-choices.

#### src/app/quiz/SeedStep.tsx -> COPY AS-IS
Full families + depth + exclusion.

#### src/app/results/page.tsx -> COPY AS-IS
Uses rarity-aware signalStrength(matchRaritySum).

#### All components -> COPY AS-IS
DirectionCard includes thinMarketSeeded handling (active).

#### Scripts -> KEEP
verify-honesty-layer.ts + lean-bucket-fix-proof.ts.


### Phase 2 extraction

Phase 2 = the current full prototype. Copy the entire repo as-is.
This is the "R&D branch" made into its own standalone folder.

Only cleanup: delete config/quizold.ts (dead code) and any
git-ignored temp files.


## Verification requirements (per phase)

Every phase extract must pass before it ships:

1. `npx tsc --noEmit` clean (zero errors)
2. Honesty verification passes (Phase 0: verify-phase0-honesty.ts;
   Phase 1+: verify-honesty-layer.ts)
3. Manual click-through: seed -> results, cards render correctly
4. Seed selection produces different results for different families
5. Fort/moyen/faible labels appear on cards (coverage-based for
   Phase 0, rarity-based for Phase 1+)
6. "Why surfaced" text appears on every card
7. Offer receipts load on direction detail page
8. SignalBadge shows "Piste solide" for fort, "Piste a explorer"
   for moyen, nothing for faible
9. Badges suppressed on "Pas maintenant" cards

Phase 0 additional:
- No quiz scenes appear (seed -> results directly)
- Only 7 families shown in seed
- No depth sub-choices visible
- No amber thin-market labels

Phase 1 additional:
- 14 families + depth sub-choices work
- Exclusion API works in seed
- Level-demote proof passes (diploma-gated demotion)
- Rarity-aware signal tiers produce different badge distributions
  than coverage-based tiers
- Demo acceptance: for each major seed family tested, the product
  must surface at least 8 credible ranked directions, with visible
  fort/moyen/faible distribution and market receipts. Success is
  NOT measured by the number of apply_now results (the cognitive
  denominator may make apply_now sparse without a quiz, and that
  is honest). Success is measured by quality, explanation, and
  visible improvement over Phase 0.

Phase 2 additional:
- Full quiz flow (seed -> 41 scenes -> results)
- Two different quiz answer profiles produce divergent top-10
  (answer-sensitivity proof)
- lean-bucket-fix-proof.ts passes


## File count estimate per phase

| Category | Phase 0 | Phase 1 | Phase 2 |
|----------|---------|---------|---------|
| Engine files | 7 (simplified) | 10 (full) | 10 (full) |
| Config files | 2 (families, buckets) | 3 (+quiz stub) | 5 (all) |
| App routes | 4 pages | 4 pages | 4 pages |
| Components | 7 | 7 | 7 |
| Data layer | 12 (seams, impls) | 12 | 12 |
| Scripts | 1 (honesty) | 2 | ~40 |
| Total source | ~33 | ~38 | ~80+ |


## What this document does NOT cover

- The consultant workspace (Phase 2a in the commercial plan). That is
  a product layer built on top of Phase 1 or Phase 2 engine, not an
  engine extraction.
- Deployment config (Vercel project setup per phase). George handles
  this after local folders work.
- Git branching strategy. Folders first, branches after.
- The ~1000 surfaced directions breadth investigation. Flagged as the
  next engine diagnostic, separate from extraction.
