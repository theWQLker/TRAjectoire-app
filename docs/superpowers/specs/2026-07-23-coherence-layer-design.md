# Coherence layer — design

**Date:** 2026-07-23
**Status:** Approved (brainstorm), pending spec review
**Supersedes/implements:** `2026-07-04-coherence-diversity-ranking-design.md` (spec'd, not built)
**Roadmap item:** #1 — the last engine piece before honesty-scoping and the UI pass.

---

## 1. Problem

The ranked, surfaced direction set has two coherence failures against the north star (*a
clarity-giving RANGE, not a résumé dump*):

1. **The santé wall.** A seed concentrated in one domain produces a wall of same-sub-domain
   directions that dominate the visible band — e.g. a santé profile shows ~6 `J`/industrial
   rows where 2–3 would give a truer, calmer range.
2. **The volume dump.** Roughly a thousand directions can surface; the visible band should
   lead with a coherent range, not depth.

The fix is a **coherence layer** that reshapes *display order only*, thinning
over-represented clusters with a gentle diminishing-returns curve (never a hard cap, so a
genuinely concentrated range like single-family tech survives) and protecting exactly **one**
cross-domain wildcard, pinned visible and labelled honestly.

## 2. Boundary — what coherence may and may not touch

Coherence lives **purely in display ordering**. It runs in `buildResults()` after the
level-demote loop has stamped `displayRank`, as the last reshaping step before `byCategory`
is built.

**Untouched (honesty-critical invariants), preserved by construction:**

- `rankScore` — the engine composite (`graph-direction-proposer.ts`). Never modified.
- The surfacing gate / `heldBack` / `suppressed` — what surfaces is decided upstream.
- `signalStrength` tiers (`coverage.ts`, read `matchRaritySum`) — fort/moyen/faible labels.
- `bucketResult` / bucketing (`bucketer.ts`) — a direction's category.
- `displayRank` (`level-demote.ts`) — carries the level-demote; coherence is a *separate*
  field layered on top, so each demote is applied exactly once and stays traceable.

**Written by coherence** (new fields on `ResultDirection`):

- `coherenceCluster: string` — the 3-char ROME sub-domain key.
- `coherencePenalty: number` — ∈ [0,1], the diminishing-returns down-weight.
- `coherenceRank: number` — `displayRank × (1 − coherencePenalty)`; the value the page
  sorts the visible order by.
- `isWildcard?: true` — set on at most one direction.

Because nothing that *surfaces*, gets *labelled*, or gets *bucketed* changes, the honesty
layer is provably intact: only the order the visible cap slices from moves, plus one pinned
row.

## 3. Cluster key and domain

Derived on the fly from the ROME code (letter + 2 digits + 2 digits, e.g. `M1203`). No new
data structure, no config:

- **Sub-domain cluster key** = `romeCode.slice(0, 3)` → **3 characters** (`M12`, `J14`,
  `J15`). This is the coherence cluster.
- **Domain** = `romeCode.slice(0, 1)` → **1 character** (`M`, `J`) → the 14 ROME domains
  (A–N) already mapped in `coherence-audit.ts`.

> Naming note: the roadmap said "2-char sub-domain"; the ROME code makes the sub-domain
> **3 chars** (`slice(0,3)`). This spec uses 3-char throughout.

`config/clusters.ts` is the **quiz-answer** clusters (answer → competence vocabulary) and is
**unrelated** to coherence clusters, which are purely ROME-code-derived.

## 4. Diminishing-returns penalty (rank-within-cluster decay)

Over the full surfaced set, inside `buildResults`:

1. Group surfaced directions by 3-char cluster key.
2. Within each cluster, sort by `rankScore` descending; assign intra-cluster index
   `i` (0 = the cluster's best row).
3. The penalty grows gently with `i`. **Two candidate formulas are implemented; the sweep
   (§7) picks the winner on evidence — neither is asserted:**

   - **Plain index decay:**
     `coherencePenalty = 1 − 1 / (1 + K · i)`
   - **Strength-attenuated decay** (guards against burying an excellent-but-deep row):
     ```
     strengthKeep      = rankScore_i / rankScore_clusterHead   // 1.0 if as strong as the head
     coherencePenalty  = (1 − 1/(1 + K · i)) × (1 − strengthKeep)
     ```

`K` is a single small tuning constant (starting ~0.15), env-overridable
(`COHERENCE_K`), **locked after the before/after evidence** — the same human-gated pattern
as `RARITY_GENERIC_FLOOR` and `W_RARITY`. `i = 0` always yields penalty 0 (a cluster's best
row is never touched).

### Why this preserves a genuine range

The penalty depends on **position within the cluster**, not cluster size. A real
single-family tech range of ~8 directions all at high `rankScore` sits near the front of its
cluster **and** scores high, so even the tail penalty leaves them above weaker other-cluster
rows. A santé wall of ~30 mediocre `J`-rows: the top 2–3 survive; the long tail sinks below
industrial/care/other clusters.

The strength-attenuated variant sharpens this: it punishes **low-quality density**
specifically — a deep row nearly as strong as its cluster head (`strengthKeep ≈ 1`) keeps a
~0 penalty and survives; a deep row much weaker than its head takes the full index penalty.
This is the direct guard for the inversion risk (a strong `i=6` row should not sink below a
mediocre `i=0` row of another cluster).

## 4a. Two-level thinning — sub-domain AND domain (REVISION, 2026-07-24)

**Finding from the first live sweep:** at every K and both formulas, the santé wall did
**not** thin (`H(industrie) 6→6`). Root cause is a granularity gap, not a K value: the santé
wall's 6 industrie rows sit in **6 different 3-char sub-domain clusters** (H29, H25, H14, …),
one row each. Rank-within-3-char-cluster therefore sees every wall row as `i = 0` → penalty 0
→ nothing thins. The wall is a **domain-level** (1-char `H`) phenomenon; §4's sub-domain
decay is blind to it.

**Revision:** compute the diminishing-returns penalty at **both** levels and combine:

- `p_sub` — rank-within-3-char-sub-domain, strength-attenuated (the existing §4 penalty).
- `p_dom` — rank-within-1-char-domain, strength-attenuated (identical formula, domain key).
- `coherencePenalty = max(p_sub, p_dom)`.

`max` is chosen deliberately (not product/sum): it is bounded in [0,1] by construction, needs
**no new tuning constant** (same single `K`), keeps each level's meaning clean, and lets the
strength-attenuation guard operate **independently at each level**. A row is thinned by
whichever level legitimately sees it as weak dense-tail.

**Why this thins santé but spares tech (the guard):** In the tech persona the `M18` domain
holds ~7 rows all near their head in `rankScore` → `strengthKeep ≈ 1` at the domain level →
`p_dom ≈ 0` → `max` stays ~0 → the genuine range survives. In the santé persona the `H`
domain holds 6 rows that are progressively *weaker* than the seed's strongest (a wall of
industrie bridges, not a concentrated range) → their domain-level `strengthKeep` falls with
depth → `p_dom` grows → the tail thins. Domain-level **strength** decay is exactly what
separates "genuine concentrated domain" (spare) from "weak wall" (thin) — which is why the
formula stays `strength`, never `plain` (plain would erode both equally). **This guard is a
claim to be proven by the re-sweep (§7), not assumed** — if domain-thinning fixes santé but
erodes tech's `M18` below ~7, that is a FAIL to report, not a trade to accept.

## 5. The wildcard

Exactly **one** cross-domain wildcard, chosen from the surfaced set:

- **Dominant domain** = the first ROME char (`slice(0,1)`) of the most-represented cluster
  among surfaced directions.
- **Candidate wildcards** = surfaced directions whose domain differs from the dominant
  domain (a genuinely cross-*domain* surprise, so the label's "hors de votre domaine
  principal" is true even when a seed spans several sub-domains of one domain, e.g.
  J14 + J15).
- **Pick** = the highest-`rankScore` candidate (NOT highest rarity), provided it clears an
  **honesty floor**: it is already surfaced + skill-backed (shares ≥1 real competence — true
  of every surfaced direction) AND its `rankScore` is at least a fraction `WILDCARD_FLOOR_FRAC`
  of the top visible direction's `rankScore` (starting ~0.5) — so it is a credible pick, not
  the least-bad cross-domain scrap. `WILDCARD_FLOOR_FRAC` is env-overridable and locked by the
  sweep evidence (§7), the same human-gated pattern as `K`; the sweep reports, per persona,
  whether a wildcard clears it so the fraction is chosen against real data, not guessed.
- **If nothing clears the floor → NO wildcard.** Honesty over always-filling the slot; a
  laser-focused profile with no genuine outside match honestly shows none. Matches the
  engine's existing never-fabricate stance.

### Pin mechanics — pin-in-place within its own bucket

The layout is four bucketed sections (`apply_now` hero, `bridge`, `long_term`, `not_now`),
each with its own `VISIBLE_CAP` and overflow expander. The wildcard's bucket is set by its
own market reality (`bucketResult.category`), independent of coherence.

- The wildcard **stays in whatever bucket its market earns** and is guaranteed the **first
  visible slot in that bucket** (sorted ahead of its bucket-mates, always above that
  bucket's cap), carrying the label.
- Bucket integrity — and therefore market-honesty — is preserved: a thin-market surprise
  stays truthfully under `bridge` / `long terme` and is **never** promoted into
  `intersections fortes`, where a "soutenu par des annonces" claim would be false.

### No-market-claim rule (honesty)

The wildcard label reads **"une piste inattendue — hors de votre domaine principal"** and
makes **no market claim of its own**. Its market truth comes entirely from the bucket it sits
in and its existing signal tier. (The label copy itself is applied in the UI pass, roadmap
#4; this spec guarantees the *flag* and the *placement rule*.)

## 6. Composition

```
displayRank   = rankScore × (1 − W_LEVEL_DEMOTE · levelPenalty)   // existing, unchanged
coherenceRank = displayRank × (1 − coherencePenalty)              // new, this layer
```

- Each demote (level, then coherence) is applied **exactly once** and is independently
  traceable — `displayRank` still means "rank × level-demote"; `coherenceRank` adds the
  coherence thinning on top.
- The page sorts each bucket's visible order by `coherenceRank`; the wildcard is pinned
  first in its bucket regardless of `coherenceRank`.
- Diagnostics and merge scripts that read `rankScore` / `displayRank` are unaffected.

## 7. Proof — the K-sweep report (core deliverable)

A script `scripts/coherence-sweep.ts`, built on the existing `merge-coherence-sante.ts` +
`coherence-audit.ts` harness (live graph, deterministic), that for
`K ∈ {0.10, 0.15, 0.20, 0.30, …}` and **both penalty formulas** reports **per persona** (the
5 cognitive personas + the santé-seed merge persona):

- **Santé wall count** — number of `H`-cluster (industrie) rows in santé's visible top-8,
  plus the wall's own `J`-cluster count. **Target 2–3, not 6.**
- **Single-family tech survival** — for a concentrated tech profile, how many of the genuine
  range remain in the visible band. **Guard: must stay high**; if a K/formula buries them,
  it is rejected.
- **Dominant-cluster share** in each persona's visible band, before vs after.
- **Inversion check** — any row with `rankScore` in the top quartile pushed *below* the
  visible cap by coherence. Flags the "buried something excellent" case for review.
- **Wildcard** per persona — present / absent / which domain — confirming "exactly one
  genuine cross-domain surprise, or honestly none."

### Sweep-1 result (2026-07-24, sub-domain-only) — evidence log

- **Formula: `strength` wins decisively on inversions** — near-zero and flat across all K
  (`1,1,1,1,0,0` per persona) vs `plain`'s `3,4,5…` that *worsens* as K rises. `strength`
  also preserved tech `M18 ×7` where `plain` eroded it to ×3–5. **`strength` is kept, not
  deleted** (the plan's "delete strength if plain wins" branch does not fire — plain lost).
- **Santé wall did NOT thin (`H 6→6`) at any K/formula** → the §4a granularity gap. Drives
  the two-level revision. **No K locked from sweep-1**; K is locked from sweep-2 (post-§4a).

### Sweep-2 (post-§4a two-level) — the locking run

Re-run with the `max(p_sub, p_dom)` model. Lock K on these targets:

- **Santé `H` count → 2–3** (the headline fix; sweep-1 was stuck at 6).
- **Tech `M18` survival → stays ~7** (the guard; must NOT erode to 3–4).
- **Inversion → stays near-zero** (strength's win must survive the domain level).
- **Wildcard → exactly one per persona (or honest none).**

If domain-thinning fixes santé but erodes tech, that is a FAIL to report — not a trade.

**Success conditions (from the roadmap):**

- Santé wall thins to 2–3 industrial + care + 1 surprise.
- Single-family tech range survives.
- Every persona shows exactly one genuine cross-domain surprise (or honestly none).
- Honesty invariants (§2) intact — verified by re-running the existing honesty scripts
  unchanged.

`K` and the penalty formula are **locked by this evidence** (human-gated), not by assertion.

## 8. Files

- **New:** `src/lib/engine/coherence.ts` — `applyCoherence(directions) → { ranked, wildcard }`,
  the cluster key, both penalty formulas, the wildcard selector. Pure, unit-testable.
- **New:** `scripts/coherence-sweep.ts` — the K-sweep / per-persona proof report.
- **Edit:** `src/lib/engine/results.ts` — call `applyCoherence` after the level-demote loop;
  add the new fields to `ResultDirection`.
- **Edit:** `src/app/results/page.tsx` — sort visible order by `coherenceRank`; pin the
  wildcard first in its bucket. (Label *copy* is roadmap #4; this edit wires the flag +
  placement.)

## 9. Out of scope

- Wildcard label copy / north-star copy (roadmap #4, the UI pass).
- Any change to what surfaces, what's bucketed, or any signal tier.
- Life-constraints wiring, data-reach honesty, the human test (roadmap #2/#3/#5).
