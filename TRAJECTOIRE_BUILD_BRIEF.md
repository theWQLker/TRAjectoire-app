# Trajectoire — Master Build Brief (CLAUDE.md)

This is the authoritative document. Read it once, fully, before acting. It tells you
what Trajectoire is, what already works, what is open, how to plan and build, how to
test and self-correct, and — critically — **where you must STOP and report to a human
instead of proceeding.** Honor that last part above all: some judgments are not yours
to make.

---

## 0. How to use this document (autonomy contract)

You have authority to **plan, build, test, refactor, and scrap code** within the rules
below. Two kinds of checkpoint govern you:

- **AUTO-GATE** — a check you run yourself. If it fails, self-correct and re-run until it
  passes or you've tried 3 distinct approaches. If still failing after 3, STOP and report.
- **HUMAN-GATE** — a judgment you CANNOT make. Build to it, run it, then STOP and report
  evidence to George. Never self-proceed past a HUMAN-GATE. Examples: "does this output
  feel like discovery vs a generic list", "is this direction worth pursuing", "scrap a
  validated component". These are his calls, on evidence you surface.

**Scrap authority:** you may delete/replace code ONLY in the "OPEN / scrap-eligible" set
(§4). Code in the "VALIDATED / do not touch without a HUMAN-GATE" set (§3) is load-bearing
and earned its place through evidence — do not refactor or remove it on a hunch. If you
believe a validated component is wrong, that is a HUMAN-GATE: stop and argue the case with
evidence, don't act.

**The prime directive:** every claim the product makes to a user must be backed by a real
job ad. No verdicts, no fake percentages, no gatekeeping. If a change would violate this,
do not make it — it is the one inviolable rule.

---

## 1. The idea (what you are serving)

Trajectoire is a French career-direction web app. A person answers a structured quiz; the
app surfaces realistic professional directions — including non-obvious ones they would
never have searched — by crossing their skill inventory with the official ROME job/skill
graph and live France Travail job-market data.

**Positioning (non-negotiable):** "Pas un test de personnalité. Pas un annuaire de métiers.
Un miroir de réalité pour choisir une direction professionnelle en France." It is a
decision tool, not a verdict. The user keeps the decision: "Ce n'est pas un verdict. Vous
gardez la décision."

**What makes it different from MétierScope (the thing it must beat):** MétierScope dumps an
unranked list of job titles from interests. Trajectoire surfaces *skill-backed, market-
validated, honestly-ranked* directions with the real job ads as receipts, and tells the
user *why* each surfaced and what it would cost to reach.

**Two user shapes the product serves:**
- **Shape A — anchored, wrong position:** one strong domain pull blocked by a constraint
  (e.g. a trained cook who loves the kitchen but not the 50h weeks). The engine moves them
  *within* the domain (commis → chef → gérant), surfacing the autonomy position alongside
  the employee one.
- **Shape B — scattered proof, no anchor:** multiple disconnected proofs, no clear field
  (e.g. payroll + CAP bakery + téléconseil). The engine finds the directions their
  *combined* skills unlock — the non-obvious bridges.

**The honesty layer is the product, not a feature.** Output unit is **Signal fort / moyen /
faible** (never percentages). Receipts (real ads) are always available, never hidden.
Directions the user has skills for but the market is quiet on are shown honestly, not
filtered out. Directions with no skill overlap are NOT surfaced (they're held back and
counted, never silently dropped) — that's the firehose guard.

---

## 2. Architecture (current truth — what exists and works)

Stack: Next.js 15 (App Router, TS strict), Supabase Postgres, Tailwind v4, Vercel.

**The engine — leap-graph traversal (validated on live data):**
A quiz builds an **Inventory** (competence codes + RIASEC + constraints + cluster scores).
Four leap mechanics surface directions from the ROME graph:
- **A. Direct match** — métiers whose competencies the inventory directly covers.
- **B. Skill-bridge** — other métiers sharing the inventory's competence codes (the core
  discovery mechanic; reaches jobs the user wouldn't search).
- **C. Mobilité leap** — ROME's curated "métiers proches" adjacency, weighted Proche/Evolution.
- **D. Interest leap (RIASEC)** — demoted to a RANKING signal only; may not surface a
  direction on its own (see §3, the coverage floor).

Each surfaced direction is market-checked against cached live offers, bucketed (À tester
maintenant / Pont court / Long terme / Pas maintenant), and labeled with a Signal tier and
a plain "why surfaced". An LLM discovery seam (`DirectionProposer`) exists but is NOT
implemented — it's the documented Phase-2 boundary for what the graph can't reach.

**The seam pattern (keep it):** `RomeSource` and `OfferSource` interfaces, each with a
Fixture and a Live implementation, switched by `ROME_SOURCE` / `OFFER_SOURCE` env vars.
The engine reads the interfaces, never the API or DB directly. This is how the app runs on
fixtures in dev and live data in prod with zero engine changes. Do not break this.

**Data (live, in Supabase):** rome_jobs (1,911), rome_competences (31,890), rome_job_
competences (105,940 skill-bridge edges), rome_mobilites (4,008), rome_riasec (1,053),
offers_cache (~11,253 bounded snapshot: dept-75, top-150 ROME codes by volume), plus
quiz_sessions and recommendations. clusters.ts maps quiz answers → competence codes; 22
clusters filled with real ROME codes, 6 deliberately empty (the LLM boundary — cognitive
styles/preferences with no competence-code carrier: leverage, execution, pragmatisme,
besoin_clarte, besoin_calme, and the design-paired besoin_calme).

---

## 3. VALIDATED — do not touch without a HUMAN-GATE

These earned their place through live-data evidence across the build. Removing or
refactoring any of them on your own judgment is forbidden. If you think one is wrong,
STOP and make the case.

1. **The leap-graph engine (A/B/C/D mechanics).** Replaced two failed architectures
   (intersection-overlap, RIASEC-as-surfacer) that died on live data. Proven: different
   answers surface economy-wide divergent directions (people-profile vs systems-profile →
   974 vs 1,602 pre-gate candidates, <5% overlap in top results).
2. **The coverage floor (`MIN_LEAP_COVERAGE`).** Interest/mobilité may surface a direction
   only if it shares ≥1 real skill (coverage > 0) OR direct/skill-bridge already surfaced
   it. Below floor → ordering weight only, never a new row. This kills the firehose
   (interest leap was surfacing 154 zero-overlap economy-wide junk métiers). Held-back
   directions are COUNTED and shown, never silently dropped.
3. **The six honesty invariants** (verify-honesty-layer.ts). All must hold after any change:
   no dead-end bridge leaks into surfaced; suppressed list counted & shown; exploratory
   subordinate to solid; NO verdict/disqualifier/final_score field; plain "why" on every
   direction; zero-lean directions still surface (weight orders, never gates).
4. **Signal tiers, not percentages.** coverageStrength strong/partial/exploratory →
   fort/moyen/faible. Never render a raw % or a "match score" to the user. Never render a
   raw competence code to the user (past bug: inventory dump leaked codes — fixed by
   stating counts, not naming skills).
5. **The seam pattern** (§2). The fixture/live swap must stay clean.
6. **The ranking weights as tuned** (W_LEAP_TIER 0.6, W_COVERAGE 0.8, W_LEAN 0.5,
   W_INTEREST 0.25, mobility 0.08). A strong genuine fit pins at #1; answers reorder #2+.
   Do not crank weights to make #1 dislodgeable — that trades honesty for responsiveness.
   Changing these is a HUMAN-GATE.

---

## 4. OPEN — scrap-eligible, build-eligible (your working set)

These are unresolved. You may build, refactor, or scrap within them, subject to the gates.

### 4.1 Rarity-weighting (the live "feels generic" problem) — HIGHEST PRIORITY
**Symptom (human verdict):** the live app "feels generic, like MétierScope." **Hypothesis:**
low-coverage generic-skill bridges dominate. A generic shared skill ("accueillir un public",
"respecter les procédures") appears in hundreds of métiers, so it surfaces hundreds of weak
bridges — a list, not discovery. A rare shared skill ("législation sociale") is real signal.
**Build:** weight each shared competence by inverse frequency across the 1,911-métier graph
(TF-IDF style; rome_job_competences gives rarity for free). Reward rare shared skills,
near-zero for generic. Re-rank what already surfaces; do NOT change what surfaces.
- INPUT: an Inventory + the live graph.
- OUTPUT: the same surfaced set, re-ordered so directions sharing the user's *distinctive*
  skills rank above those sharing generic ones.
- TEST: run A/B profiles (§6). Print top-10 each, with the shared skills that drove each
  direction AND those skills' rarity score.
- EXPECTED / AUTO-GATE: top directions become more specific (driven by rare skills); the
  generic spread (coiffeur/vendeur for a payroll person) falls down the list.
- HUMAN-GATE after: does the output now feel sharp/non-generic? Only George can answer.
  STOP and report the before/after top-10.

### 4.2 The "feels generic" question may be the deterministic ceiling — HUMAN-GATE
If rarity-weighting (4.1) does NOT make it feel non-generic, that is evidence the
deterministic skill-graph can only ever produce "adjacent jobs," not "reasoned discovery."
That points to the LLM seam (§4.4). Do NOT build the LLM preemptively. Build 4.1 first,
surface the result, let George judge. This is the central open question of the project.

### 4.3 Offer data is a bounded snapshot — scrap-eligible scope
offers_cache is dept-75, top-150 codes, one-time. Directions outside those codes/depts read
"no offers" and get held back. OPEN: whether to broaden coverage (more depts/codes) and/or
add a freshness pipeline (cron re-ingest). The per-request API path was replaced by a
cache-read (current_offers view) + per-direction error handling — keep that. Do NOT build a
freshness cron until the product-vs-portfolio decision (§7) is made — it's maintenance
commitment, not capability.

### 4.4 LLM discovery seam — DO NOT BUILD until a HUMAN-GATE opens it
`DirectionProposer` interface exists with the graph implementation. The LLM implementation
(reasoning over an inventory to propose directions the graph can't reach, e.g. cross-domain
leaps with no shared ROME code) is the Phase-2 boundary. It needs a separate Anthropic
Console API key + spend cap, ~1¢/user. Build ONLY if George decides 4.2 requires it.

### 4.5 The exclusion toggle ("ce dont je ne veux plus") — design-eligible
Attribute-based demotion (NOT job-title exclusion — that reintroduces the MétierScope list
problem). Toggles map to clusters/domains and DEMOTE matching directions (push down, never
hard-filter — preserves "signals not verdicts"). Status: design agreed, integration
unconfirmed. If building: demote-not-exclude, attribute-not-title, skippable, with
before/after evidence and the §3.3 honesty re-check.

---

## 5. Build plan (sequence + dependencies)

Work top-down. Each phase has a gate; do not start a phase until the prior phase's gate
clears (AUTO self-clears; HUMAN must be reported and answered).

**Phase 1 — Rarity-weighting (4.1).** AUTO-GATE: top-10 shifts toward rare-skill directions,
honesty invariants hold, tsc clean, A/B still divergent. → HUMAN-GATE: feels non-generic?
STOP, report before/after.

**Phase 2 — branches on George's Phase-1 answer:**
- If "now it's sharp" → Phase 3 (polish + the exclusion toggle 4.5 if wanted).
- If "still generic" → that's the §4.2 ceiling finding. STOP. Recommend the LLM seam (4.4)
  and wait for George's go. Do not build it unprompted.

**Phase 3 — Offer coverage (4.3), ONLY if §7 says "product".** Broaden the ingest; consider
freshness. If §7 says "portfolio", skip — the bounded snapshot is enough, document it.

**Phase 4 — Exclusion toggle (4.5), if wanted.** Attribute-demotion, evidence + honesty re-check.

**Phase 5 — LLM seam (4.4), ONLY if a HUMAN-GATE opened it.**

Always: after ANY phase, run the full AUTO-GATE battery (§6) before reporting.

---

## 6. Test & validation battery (run after every change)

These are the AUTO-GATEs. All must pass before you report a phase complete.

1. **Build:** `tsc --noEmit` clean; `next build` clean; /quiz and /results compile.
2. **Honesty invariants:** verify-honesty-layer.ts — all six hold (§3.3). If any fail, the
   change broke the product ethic; revert and rethink. This is the most important gate.
3. **Fixture smoke:** with defaults (fixture), the existing smoke/leap-graph/quiz-flow
   scripts pass — nothing regressed for dev mode.
4. **A/B answer-sensitivity (the core capability test):** two opposite profiles —
   - A (people-leaning): sf_numbers_people:plutot_b, sf_sell_fix:plutot_a, g_conflict:plutot_a, g_teach_do:plutot_a, sf_write_explain:plutot_b
   - B (systems-leaning): f_order_improv:plutot_a, sf_numbers_people:plutot_a, sf_data_files:plutot_a, f_scale_task:plutot_a, g_lead_support:plutot_b
   Run both through buildResults on ROME_SOURCE=live + OFFER_SOURCE=live.
   EXPECTED: each surfaces substantially different métiers across the economy (current
   baseline: A≈92, B≈125 distinct; overlap≈77 is the broad shared-demand middle; A-only≈15,
   B-only≈48). A regression to ~6 paie/client métiers means something broke the graph or the
   gate — investigate before proceeding.
5. **No leak:** grep rendered HTML for 6-digit codes → zero. No raw competence codes, no
   percentages, no "score" reach the user.
6. **Data integrity (if you touched ingestion):** rome_jobs 1,911 · rome_job_competences
   105,940 · rome_mobilites 4,008 · rome_riasec 1,053 loaded fully (no 1,000-row cap).

Self-correction loop: a failed AUTO-GATE → diagnose with evidence (don't guess), fix, re-run
the FULL battery (a fix can break another gate). 3 failed distinct approaches → STOP, report.

---

## 7. The one decision you cannot make (HUMAN-GATE, governs everything)

**Is Trajectoire a portfolio/demo piece, or a product George will maintain?** This decides
whether you do offer-coverage/freshness (§4.3), whether the bounded snapshot is "done" or "a
gap", and how far to push. You do NOT decide this. If George hasn't stated it, ask once and
wait. Until answered, treat it as **portfolio** (bounded snapshot is acceptable, no freshness
pipeline, no maintenance commitments) — the lower-scope default — and flag anything that would
only matter for a maintained product.

---

## 8. Operating rules (always)

- **Diagnose before building.** This project's biggest wins came from running real data
  through a hypothesis and reading the evidence, not from theorizing. Two engines were
  scrapped because live data killed them — caught by testing, not by argument. When unsure,
  build the diagnostic, not the feature.
- **One scope per change.** Don't mix a fix, a feature, and a refactor.
- **Secrets:** never commit .env.local; never render or log secret values; service-role key
  is server-only, never NEXT_PUBLIC.
- **Report honestly.** When you STOP at a gate, surface the evidence (numbers, before/after,
  what passed, what didn't) — not a conclusion dressed as fact. George decides on evidence.
- **Don't expand scope to feel productive.** A working bounded thing beats a half-built broad
  thing. If a phase isn't needed for the current §7 answer, skip it and say so.
