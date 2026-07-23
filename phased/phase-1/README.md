# Trajectoire — Phase 1 (Engine quality upgrade)

The full recommendation engine — rarity-weighting, all four leaps, the complete
taxonomy, and the honesty layer — **minus the cognitive quiz**. This is the
"technical innovation milestone": the same engine that ships in the full product,
demonstrated on the seed front door alone.

## What this phase is

Everything Phase 0 has, plus the real engine underneath it. The user picks
families **and depth niches** (and can exclude specific jobs); the engine unions
four leap mechanics, weights directions by rarity/coverage, applies level-demote,
and surfaces a rarity-aware signal tier.

**Flow:** seed (families + depth + exclusions) → results. Still no cognitive quiz.

### Added on top of Phase 0
- **All 4 leaps**: direct, skill_bridge, mobilité, interest.
- **Rarity-weighting** (distinctive shared skills rank above generic ones).
- Full ranking weights (current production values).
- **14 families + 44 niches + depth sub-choices**, plus per-niche exclusion
  ("métiers à écarter").
- **Rarity-aware signal tiers** (fort/moyen/faible from `matchRaritySum`).
- Surface-with-label honesty (amber "vous avez les compétences, peu d'annonces").
- **Level-demote** (senior profiles stop seeing entry-level roles at the top;
  reads `c_diploma`).
- Cognitive denominator in the bucketer.

### Still excluded
- **No cognitive quiz** (no scenes, no clusters). The lean signal is structurally
  present but inactive (W_LEAN contributes 0 with no quiz answers).

### Expected behaviour worth knowing
Without quiz answers, **`apply_now` is empty and the "Vos intersections fortes"
hero band does not render** — the cognitive-denominator bucketer has no cognitive
codes to score, so nothing reaches the apply_now threshold. **This is honest and
by design.** Phase-1 success is measured by quality, explanation, and visible
improvement over Phase 0 — *not* by the apply_now count. Directions land in
"À portée — quelques mois" (bridge) with real market receipts.

Because the signal is **rarity-based** here (not count-based like Phase 0), a
match sharing several skills may read faible / show no badge when its rarity sum
is low — expected without a quiz to lift distinctive clusters.

## Run it

```bash
npm install
cp .env.local.example .env.local   # optional — fixture mode is the default
npm run dev                        # http://localhost:3000
```

Fixture mode (the defaults) needs **zero external services**.

## Verify

```bash
npm run build              # production build, all routes
npx tsc --noEmit           # type check — must be clean
npm run verify:honesty     # honesty-layer invariants (dead-end suppression,
                           # exploratory subordination, no verdict, coverage floor)
npm run proof:lean         # lean/bucket ordering + answer-divergence proof
```

## Layout

```
config/            families.ts (full 14) · clusters.ts (kept — engine needs it,
                   inert without a quiz) · quiz.ts (stub: département + diplôme) · buckets.ts
src/lib/engine/    full engine — graph-direction-proposer (4 leaps + rarity) ·
                   coverage · bucketer · level-demote · results · market-reality · honest-fork
src/app/           page (landing) · quiz (full SeedStep → submit) · results (+ detail, offers)
scripts/           verify-honesty-layer.ts · lean-bucket-fix-proof.ts
```

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. Deploys standalone on
Vercel with no config (fixture mode). Supabase optional; absent → in-memory
session store.

---

*One of three phase extracts. Phase 0 is the skill-bridge-only POC; Phase 2 adds
the 41-scene cognitive quiz that activates the lean signal and populates
apply_now.*
