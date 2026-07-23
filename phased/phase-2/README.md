# Trajectoire — Phase 2 (Full engine)

Everything. The complete prototype: the full engine **plus** the cognitive quiz
that personalises the results. This is the R&D build made into its own standalone
app.

## What this phase is

Phase 1's full engine, now driven by a **41-scene cognitive quiz** on top of the
seed. The quiz answers produce a lean signal that reorders directions and
activates the "ready now" bucket — so different answer profiles get genuinely
different top results.

**Flow:** seed (families + depth + exclusions) → **cognitive chapters (41 scenes,
5 quick-picks, 5 categories)** → results.

### Added on top of Phase 1
- **Cognitive quiz**: 47 clusters, 41 scenes, 5 quick-picks.
- **Lean signal active** (W_LEAN driven by quiz answers) — the quiz reaches the
  displayed order, not just what surfaces.
- **Answer-sensitivity**: different profiles get divergent top-10 directions.
- Full `build-inventory` with cognitive cluster-code injection.

With quiz answers present, the cognitive denominator has codes to score, so
**`apply_now` populates** and the "intersections fortes" hero band renders when a
profile genuinely already has most of what a direction needs.

## Run it

```bash
npm install
cp .env.local.example .env.local   # optional — fixture mode is the default
npm run dev                        # http://localhost:3000
```

Fixture mode (`ROME_SOURCE=fixture`, `OFFER_SOURCE=fixture`, the defaults) needs
**zero external services**.

## Verify

```bash
npm run build              # production build, all routes
npx tsc --noEmit           # type check — must be clean
npm run verify:honesty     # honesty-layer invariants
npm run proof:lean         # answer-sensitivity: two profiles → divergent top-5
```

Other diagnostic scripts (~35) live under `scripts/` — the full R&D harness set,
kept intact for this phase (persona rollouts, tuning sweeps, ingest, audits).

## Layout

```
config/            families.ts (full 14) · clusters.ts · quiz.ts (full, 41 scenes) ·
                   buckets.ts · rates.ts
src/lib/engine/    full engine (10 modules) incl. intersection.ts + level-demote.ts
src/lib/quiz/      build-inventory (seed + cognitive injection) · session-store
src/app/           page (landing) · quiz (SeedStep → chapters → submit) · results (+ detail, offers)
scripts/           full diagnostic / proof / ingest harness set
```

Only difference from the R&D `trajectoire-ui` branch: the dead `config/quizold.ts`
is removed.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. Deploys standalone on
Vercel with no config (fixture mode). Supabase optional (session persistence +
live ROME/offers seams); absent → in-memory + fixtures.

---

*One of three phase extracts. Phase 0 is the skill-bridge-only POC; Phase 1 is
the full engine without the quiz; Phase 2 (this one) is the complete personalised
product.*
