# Merge-Scenarios Harness — design

**Date:** 2026-07-02
**Deliverable:** one committed, re-runnable diagnostic script, `scripts/merge-scenarios.ts`. Report only — builds no engine code.

## Goal

Run 5 fixed answer-sets through the *real* pipeline the UI uses — `buildInventory(answers) → buildResults(inventory)` on the live graph — and print one comparison table. For scenarios #3 and #4 (mixed seed + cross-lean cognitive), classify whether the engine MERGES both dimensions into a coherent range, read through the north star (a clarity-giving range that honours BOTH inputs), NOT "who wins".

## Why a script, not Playwright

`buildInventory` + `buildResults` **are** the full real flow: the quiz server action (`submitQuiz`) calls `buildInventory(answers)`, and the results page calls `buildResults(inventory)` — nothing else sits between seed/cognitive answers and the rendered tiers. A script driving those two functions reproduces the real flow deterministically and re-runnably. This matches every existing harness in `scripts/` (`persona-rollout.ts`, `coherence-audit.ts`, `rollout-full-report.ts`).

## The seam (verified in code)

- **Seed** enters as `answers.seed_families = "family:depth,..."` (comma-joined) → `seedCodesFor()` → `inventory.seededCodes` (`src/lib/quiz/build-inventory.ts`, `SEED_ANSWER_KEY`).
- **Cognitive** enters as scene leans, e.g. `sf_data_files: "plutot_b"`, mapped to cluster competence codes (`config/quiz.ts`).
- **Tier FORT/MOYEN/FAIBLE** = `signalStrength(d.matchRaritySum)` — thresholds 50 / 15 (`src/lib/engine/coverage.ts`). NOT coverage %.
- **Ranking** = `rankScore` + `rankNormalisers` (`src/lib/engine/graph-direction-proposer.ts`) — same strongest-first order the page renders.
- **Domain** = `DOM[romeCode[0]]` (ROME letter → domain label), reused from `coherence-audit.ts`.
- Every direction carries `matchedCompetenceCodes: string[]` (`direction-proposer.ts`), enabling exact provenance split.

## The 5 scenarios

| # | Name | seed_families | cognitive lean-set (authored) |
|---|------|---------------|-------------------------------|
| 1 | BASELINE | *(none — seed skipped)* | coherent tech/systems |
| 2 | ALIGNED | `tech:code` | tech/systems (same direction as seed) |
| 3 | MERGE-A | `tech:code` | HR/people (cross-lean) |
| 4 | MERGE-B | `admin:rh` | tech/systems (mirror cross-lean) |
| 5 | SHAPE-B | `commerce,admin,communication,transport` | consistent commercial/admin |

Cognitive lean-sets are authored fresh per scenario, each lean drawn from the verified scene→cluster mappings in `config/quiz.ts` so the set is coherent. Departement fixed at 75 (`c_departement: "75"`).

## Per-scenario report (identical shape)

- **Tier distribution**: FORT / MOYEN / FAIBLE counts over all surfaced directions.
- **Top-15**: rank · tier · romeCode · title · domain.
- **Domain spread**: count of directions per domain across the top-15.
- **Inventory size**: `seededCodes.length` + total `competenceCodes.length`.

## MERGE classification (#3 & #4) — domain-bridge inference, no allow-list

Provenance of each surfaced direction is computed mechanically from `matchedCompetenceCodes`:

- **seedHits** = `matchedCompetenceCodes ∩ inventory.seededCodes`
- **cogHits**  = `matchedCompetenceCodes ∩ (competenceCodes \ seededCodes)`
- A direction is an **intersection role** iff `seedHits.length > 0 AND cogHits.length > 0` — it surfaced *because* the person is both.

Classify the top-15:

- **MERGED (good)** — both the seed-domain and the cognitive-domain are present in the top-15 **and** ≥1 intersection role appears. Both dimensions visibly present and connected.
- **ONE-DIMENSION-ERASED (fail)** — top-15 is ≥80% a single domain; the other input's domain is absent/negligible.
- **INCOHERENT-MUSH (fail)** — both domains present but zero intersection roles (scattered, no connecting logic).

The label is printed **beside its evidence**: the full top-15, each row tagged with its provenance (SEED / COG / BOTH), and the list of intersection roles with their seed/cog code split — so the classification is auditable, not a black box.

## Output

Streams to stdout **and** appends to `scripts/_merge-scenarios-out.txt` (matches the `_*-out.txt` convention). Ends with the single cross-scenario comparison table: one row per scenario with tier distribution, domain count, inventory size, intersection-role count, and (for #3/#4) the MERGE verdict.

## Run command (one line)

```
ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/merge-scenarios.ts
```

## Non-goals

No engine changes. No new features. No rarity-weighting or second-degree reach work. Diagnostic measurement only.
