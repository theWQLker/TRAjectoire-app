# Occupation-level salary + level as ranking fuel (demote-by-mismatch)

**Date:** 2026-07-02
**Type:** feature (engine ranking) + data ingestion. Two sub-tasks, sequential.
**Scope:** engine-only ordering signal. NOT shown to users. No new surfacing, no filter.

## North star

Honoring a stated life-constraint (level / pay expectation) is not job-board narrowing.
A high-level / high-expectation profile (master's, senior, high `salaire_min`) should stop
getting Serveur / téléconseil in the top 5 — those directions demote because their typical
pay/level clusters **below the user's stated expectation**. Mismatch, never status.

## Data-access findings (SUB-TASK 1 preflight — confirmed by live probing)

- Salary is published **per FAP (225 familles professionnelles)**, INSEE/DSN-sourced — NOT per ROME.
- **FT stats APIs are not subscribed** to our current `client_id`: live token probe returned
  `invalid_scope` for all stats scopes; the control scope `api_offresdemploiv2` granted. → user
  is subscribing our app to **both** FT salary APIs; we probe each live before ingesting.
- Two candidate FT APIs:
  - **API Marché du travail** → `salaire proposé` (offer aggregate, per métier). Off-spec
    (advertised, not payroll) but per-métier.
  - **API Statistiques / Data Emploi** → INSEE DSN **median gross monthly per FAP**. Task-faithful
    source; needs a FAP→ROME join.
- **FAP→ROME crosswalk:** the data.gouv "nomenclature FAP 2021" CSV is FAP↔**PCS** (no ROME column).
  The ROME↔FAP link must come from France Travail's own passage table or the ROME referential the
  app already ingests. To be resolved during SUB-TASK 1 once the API granularity is known.
- **Hard rule:** real sourced data only. A ROME with no salary/level datum → **no signal → neutral**.
  Never inferred, never scraped from a rendered dashboard.

## SUB-TASK 1 — ingest salary reference (after subscriptions live)

1. **Probe** (re-runnable script): authenticate with FT creds, call both APIs, report the exact
   salary field, key (FAP vs métier vs ROME), and unit. User picks the source from real output.
2. **Ingest** into a new reference table `salary_per_rome` (Supabase migration):
   `rome_code (pk) · median_gross_monthly int · source text · fap_code text null · ingested_at`.
   - If the chosen API is per-FAP: join FAP→ROME, assign the **family median to each child ROME**
     (presence-gated; ROME with no FAP match → absent row → neutral).
   - If per-métier/ROME: direct load.
3. Expose via the ROME seam (a `getSalary(romeCode): number | null` on `RomeSource`, live reads the
   table, fixture returns null) so the engine reads salary the same way it reads everything else —
   through the seam, env-switched, no direct DB coupling in the ranker.

## SUB-TASK 2 — the demote (after data lands)

### Expectation profile (already captured, verified inert today)

From `inventory.financial_inputs` + `inventory.constraints`:
- `salaire_min` (banded: `<1500 … >2700`) → a € floor.
- `constraints.diploma` (`aucun … bac+5`) → a level band.
- `situation_actuelle` / experience appetite → seniority expectation.
- `training_investment: limited` + `urgency: now` → "can't invest / accept lower" nuance.

### Per-direction data to weight against (measured on live cache)

- **salary**: from `salary_per_rome` (SUB-TASK 1). Presence TBD by source.
- **level**: `formations[].niveauLibelle` — **33% of directions** have ≥1 (maps to `c_diploma` bands).
- **seniority**: `experience_exige` — **100% of offers** (E/D/S). Dense.

### SALARY DROPPED (confirmed unbuildable now)

Live probe verdict: FT self-service exposes only "Salaire proposé" (advertised, ruled out by the
"real DSN payroll, not per-ad" rule) and even that is `403 insufficient_scope` for our app; the real
DSN median is dashboard-only. **Salary is removed from this build entirely.** The demote is
LEVEL-ONLY. Salary can slot in later as an extra presence-gated sub-signal when a real file lands —
the design leaves room but does not depend on it.

### User level signal (captured today, verified inert)

From the inventory the quiz already produces:
- `constraints.diploma` — `aucun | cap | bac | bac+2 | bac+3 | bac+5` → an ordinal level 0..5.
- `financial_inputs`: `training_investment` (`limited | open_if_return_clear`), `pull_autonomie`,
  `salaire_min` band → the "will accept lower / can't invest" nuance.
The user's **demonstrated level** = the diploma ordinal, optionally lifted by a senior situation
signal. The **"accept lower" opt-out**: if the user signalled `training_investment: limited` (or a low
`salaire_min` band), they've said they'll take a step down → **demote suppressed entirely**.

### Direction level signal (measured on live cache)

- **seniority** — `market.experienceMix` (D/E/S), already computed per direction, **100% coverage**.
  A direction whose offers are overwhelmingly `D` (débutant accepté) reads as an entry-level floor.
- **diploma band** — `formations[].niveauLibelle` on offers, **33% of directions**. NOT extracted
  today → add a `market.levelMix` (modal niveauLibelle → ordinal band), parallel to `experienceMix`.

### The mechanism — a presence-gated `levelPenalty`, applied at DISPLAY sort

The rendered order (bucket order + within-bucket card order) is driven by `matchRaritySum`
([results/page.tsx](../../../src/app/results/page.tsx) `bucketStrength` + the within-bucket sort), NOT
by the proposer's `rankScore`. To move what the USER SEES without corrupting the Signal tier
(`matchRaritySum` also feeds the FORT/MOYEN/FAIBLE badge — it must stay honest), the demote is a
**separate field**, never a mutation of `matchRaritySum`:

- Engine computes, per direction, `levelPenalty ∈ [0,1]` and a derived `displayRank = matchRaritySum
  − W_LEVEL_DEMOTE · levelPenalty · matchRaritySum` (penalty scales the strength, so it reorders
  proportionally and can never turn a strong fit negative).
- `W_LEVEL_DEMOTE ≈ 0.35` (tuned on the proof profiles): enough to drop a FAIBLE entry-level
  direction below the MOYEN/FORT level-appropriate ones, but — because it scales `matchRaritySum` and
  is bounded — it **cannot lift a weak direction over a genuinely stronger (higher-rarity) fit**.
  Coverage/rarity dominance is preserved.
- `levelPenalty` from whichever signals are **present** (max, not sum):
  - seniority gap: user demonstrated level ≥ `bac+3`-ish OR senior → direction offers ≥~70% `D`
    (débutant) → penalty rises. Present for every direction (experienceMix 100%).
  - diploma gap: user diploma ordinal − direction modal band ordinal > 1 → penalty rises; **0 when
    the direction has no `niveauLibelle`** (the 67% no-data case).
- **MISMATCH not status:** penalty is a function of *distance below the user's own demonstrated
  level*, never an absolute "this job is low." A `cap`-level user gets no penalty on a `cap` direction.
- **Presence-gated:** no seniority AND no diploma signal → penalty 0 → `displayRank = matchRaritySum`
  → order unchanged. (Seniority is always present, so pure-no-data is rare, but diploma-absent
  directions lean entirely on the seniority sub-signal and never on a fabricated band.)
- **Opt-out honoured:** `training_investment: limited` or low `salaire_min` → `levelPenalty = 0` for
  ALL directions (the user said they'll accept lower).
- **Demote, not remove:** surfacing, coverage floor, held-back, suppressed all upstream and untouched.
  The direction still appears, still counted — only its display position moves.
- **Engine-only:** `levelPenalty`/`displayRank` are never rendered. The page swaps its sort key from
  `matchRaritySum` to `displayRank`; the Signal badge keeps reading `matchRaritySum`.

## Proof (acceptance — a re-runnable live script, `scripts/level-demote-proof.ts`)

Reports before/after top-5 for each profile:
- **Master's-HR** (diploma `bac+5`, HR cognitive): Serveur (`G1803`) + téléconseil (`D1408`) drop
  **out of the top 5**; level-appropriate directions rise.
- **5yr-SaaS** (senior tech, `bac+5`, `training_investment: open_if_return_clear`): same — entry-level
  directions leave the top 5.
- **"will accept lower"** (`training_investment: limited`): **no demote fires** — top-5 identical to
  pre-demote.
- **no-level-data directions**: `displayRank == matchRaritySum` → **unchanged** relative order.
- **strong fit never dislodged:** the top FORT direct-fit keeps its position.
- **honesty 6/6 + A/B intact:** `verify-honesty-layer` still passes all invariants; a seed-less A/B
  run is unchanged where no level mismatch applies.

The proof prints each profile's top-10 before vs after, with each direction's experienceMix, modal
niveauLibelle, and computed `levelPenalty`, so the reorder is auditable.

The proof script prints, per profile, the top-10 before vs after the demote, with each direction's
salary/level datum and its `mismatchPenalty`, so the reorder is auditable — not a black box.

## Non-goals

- No display of salary anywhere. No prestige hierarchy. No filter/removal. No inferred salary.
- No change to surfacing, coverage floor, or the honesty layer. Ordering only.
- SUB-TASK 2 does not start until real salary data lands in `salary_per_rome`.
