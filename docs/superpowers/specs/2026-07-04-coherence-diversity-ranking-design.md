# Coherence + Diversity Ranking Layer — Design

**Date:** 2026-07-04
**Branch:** trajectoire-ui
**Scope:** New engine ordering layer + one honest UI label. Orders only — never
gates, re-surfaces, or introduces a verdict.

## Problem

The engine ranks directions **atomically**: `rankScore` scores each direction in
isolation (leap-tier + coverage + rarity + lean + interest + mobility), with no
picture of the person's dominant match-clusters. Three symptoms, one root cause:

- **Brocanteur outlier** (analytical profile) — a lone high-rarity D-domain job
  stacks near the top with no cluster support behind it.
- **Santé industrial-wall** (santé:soin hands-on) — 6 near-identical metalworking
  (H-domain) jobs fill the top because each scores similarly in isolation, burying
  the care cluster.
- **Single-family arbitrary-rarity** — with no cognitive lean (lean 0), order
  collapses to raw rarity, which is arbitrary among same-seed matches.

This is a **missing layer, not a wrong weight** — weight-tuning cannot express
"belongs to the person's dominant cluster" or "diminishing returns per cluster".

## Non-goals / honesty invariants (locked)

- Coherence **orders only**. It never moves a direction across the shown/heldBack
  partition, never changes what surfaces, never becomes a verdict or a number shown
  to the user. The honesty harness's "weight never gates" invariant holds by
  construction — coherence runs on the already-surfaced, already-sorted set.
- `rankScore` and its weights are **untouched**. Coherence is a labelled second
  stage. Every existing `rankScore` / level-demote / lean proof stays valid.
- The one visible intervention — the pinned wildcard — is **disclosed** in the UI.
  A pin without disclosure is a silent re-rank; we never ship the pin without the
  label.

## Architecture

New module `src/lib/engine/coherence.ts` exporting a pure function:

```
coherenceReorder(sorted: CandidateDirection[], opts): CandidateDirection[]
```

`GraphDirectionProposer.reach()` calls it AFTER computing `rankScore` and doing the
initial sort, and returns its result as `surfaced`. The initial rankScore sort is
unchanged; coherence consumes that order and produces a reordered list plus one
`isWildcard` flag.

Cluster key: `clusterKey(d) = d.romeCode.slice(0, 2)` — the 2-char ROME sub-domain
(J15 care-management, H29 metalworking). Fine enough to separate "industrial" from
"care", coarse enough that near-identical jobs share a cluster.

## Mechanics

### 1. Dominant-cluster detection
Take the top-N by `rankScore` (default `COH_TOP_N = 20`). Tally `clusterKey`
frequency. A cluster is **dominant** iff it holds ≥ `DOMINANT_MIN` (default 2) of
that top-N. A lone outlier (single D12 Brocanteur) forms no cluster → never
dominant → gets no coherence lift.

### 2. Coherence bonus with diminishing returns
Walk the sorted list keeping a per-cluster `seen` counter. A direction whose cluster
is dominant gets:

```
bonus = COH_BONUS / (1 + seenInCluster) ** COH_DECAY
```

added to a working score (`cohScore = rankScore + bonus - cap`). Defaults
`COH_BONUS = 0.6`, `COH_DECAY = 1.0`. First member of a dominant cluster gets the
full bonus; the 6th gets a sliver. Non-dominant clusters get **0** bonus — the
effect is relative (coherent jobs rise; scattered ones stay), not a penalty.

### 3. Diversity cap (santé-wall hard cap)
Belt-and-suspenders on the wall, separate from the decaying bonus: beyond
`CLUSTER_SOFT_CAP = 3` members of ANY single cluster, subtract a growing penalty
`CAP_PENALTY * (seenInCluster - CLUSTER_SOFT_CAP)` (default `CAP_PENALTY = 0.5`).
So no cluster occupies more than ~3 of the visible top before other clusters and the
surprise get in. The wildcard (below) is exempt from this cap.

### 4. North-star wildcard (range guard)
Among directions whose cluster is **not** dominant, pick the one with the highest
**`rankScore`** — the best real cross-domain match, NOT the rarest (build rule #1:
never re-pin Brocanteur-by-exotic). That direction:
- is exempt from the diversity cap,
- is flagged `isWildcard = true`,
- is **pinned** into the visible top band: if after reweighting it sits below
  `WILDCARD_PIN_RANK` (default 8, = apply_now visible cap), it is spliced up to that
  position.

Exactly **one** pin per profile (build rule #2 — per-cluster protection re-scatters,
so it is explicitly not done). If there is no non-dominant direction (everything is
one cluster), there is no wildcard — nothing is invented.

### 5. No-cognitive fallback
When lean is flat (`leanIsFlat`: every surfaced direction's `leanScore` is 0, i.e.
`maxLean === 1` sentinel), coherence replaces the missing lean lever: `COH_BONUS` is
scaled by `FLAT_LEAN_BOOST` (default 1.5) so tightness-of-cluster-with-the-seed
becomes the primary order signal instead of arbitrary rarity ties. Detection and the
flag are passed from `reach()`.

### Constants
All eight (`COH_TOP_N`, `DOMINANT_MIN`, `COH_BONUS`, `COH_DECAY`, `CLUSTER_SOFT_CAP`,
`CAP_PENALTY`, `WILDCARD_PIN_RANK`, `FLAT_LEAN_BOOST`) are `process.env`-overridable
with locked defaults (same human-gate pattern as `RARITY_GENERIC_FLOOR`). Tunable on
before/after evidence, never silently drifted.

Note on "visible band": `coherenceReorder` operates on the full flat surfaced list
BEFORE bucketing, so `WILDCARD_PIN_RANK = 8` means "within the first 8 of the flat
rankScore-ordered surfaced set". Bucketing (apply_now/bridge/…) happens downstream in
`results.ts` and splits that list; the proof reads the flat top-8 (the audit's unit),
not a single bucket's visible cap. The pin guarantees the wildcard is in that flat
top-8 so it lands in an early, visible bucket rather than behind an expander.

## Data-flow / type changes

- `CandidateDirection` gains `isWildcard?: boolean` — ordering metadata, never a
  verdict, never a number. Set only by `coherenceReorder` (exactly one true per
  profile, or none). `ResultDirection` inherits it via the existing spread in
  `results.ts` (no change needed there beyond the type flowing through).
- `reach()`: replace `return { surfaced: surfacedDirections, heldBack }` with a call
  through `coherenceReorder(surfacedDirections, { leanIsFlat })` first. `leanIsFlat`
  computed from the normalisers already in scope.

## UI change (honesty half — display only)

`src/app/results/page.tsx` `DirectionCard`: when `d.isWildcard`, render an honest
marker on the card:

> **Une piste inattendue — hors de votre domaine principal.**

Styled as a quiet distinct note (not a signal badge, not a market claim). This is the
disclosure that makes the pin honest — it reads as a deliberate surprise, not a
mis-rank. Ships in the same change as the engine flag; never the pin without it.

No other UI change. Bucket order, caps, signal badges, thin-market label, held-back
drawer — all untouched.

## Files

- **new** `src/lib/engine/coherence.ts` — `coherenceReorder` + `clusterKey` + constants.
- `src/lib/engine/graph-direction-proposer.ts` — call `coherenceReorder` in `reach()`.
- `src/lib/engine/direction-proposer.ts` — add `isWildcard?: boolean` to `CandidateDirection`.
- `src/app/results/page.tsx` — render the wildcard marker.
- **new** `scripts/coherence-proof.ts` — the 4-persona live proof.
- `scripts/seed-persona-sessions.ts` — add the 4th persona (deep single-family, lean 0).

## Proof (live, 4 personas)

Drive `buildResults` on the live graph (`ROME_SOURCE=live OFFER_SOURCE=live`). Assert
per persona:

1. **Shape-B analytical** — top-8 has NO lone-commerce stacking (Brocanteur sinks or
   occupies at most the 1 wildcard slot); the `isWildcard` direction is a genuine
   strong non-M/non-D match with high `rankScore` (NOT Brocanteur-by-rarity).
2. **Shape-A santé hands-on** — top-8 shows ≤3 industrial (H-cluster) + the care
   cluster + exactly one pinned surprise, NOT 6 metalworking jobs.
3. **Shape-B 3-family commercial** — coherent clusters lead; exactly one wildcard.
4. **Deep single-family (lean 0)** — order tracks coherence-with-seed not raw rarity;
   the wildcard is still **visible in top-8**, not buried.
5. **All 4** — exactly one `isWildcard` in the visible band (range preserved); every
   persona shows at least one genuine cross-domain surprise.

Regression gate (must still pass, unchanged):
- `verify-honesty-layer.ts` — 7/7 invariants.
- `level-demote-proof.ts`, `lean-order-proof.ts`, `lean-bucket-fix-proof.ts`.
- `tsc --noEmit` clean.

Screenshot the above-the-fold viewport for each of the 4 personas showing the
wildcard marker where present.

## Out of scope (YAGNI)

- No change to `rankScore` weights or the surfacing gate.
- No LLM, no per-cluster multiple wildcards, no learned/tuned coefficients — fixed
  human-gated defaults only.
- No new bucket, no re-tiering, no signal-badge change.
