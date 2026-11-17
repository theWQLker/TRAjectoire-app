# Trajectoire — Phase 0 (Deployed POC)

The simplest genuinely-functional version. Proves the leap-graph traversal works
end-to-end: pick a domain → get ranked career directions backed by real job
offers. This is the deliverable a funder clicks.

## What this phase is

A **skill-bridge-only** engine. The user picks one or more job families; the app
seeds their competences, finds every métier that shares those skills (the
"bridge"), ranks them, and checks each against real cached job offers.

**Flow:** seed (pick families) → results. No cognitive quiz.

### Included
- Seed front door: **7 families** (tech, santé, btp, commerce, hôtellerie,
  admin, services) — no depth sub-choices.
- **Skill-bridge leap only** (no direct / mobilité / interest leaps).
- Coverage floor: every surfaced direction shares ≥1 of your skills.
- **fort / moyen / faible** signal by **matched-skill COUNT** (FORT ≥ 4,
  MOYEN ≥ 2, else faible) — count, not coverage ratio, because the ratio
  collapses against the large front-door seed.
- **apply_now** ("Vos intersections fortes" hero band) = matched count ≥ 4 AND
  no unmet market gate.
- Paris / Île-de-France market check with real offers as receipts.
- Ranked directions with a plain "why this surfaced".
- Suppressed / held-back directions counted, never silently dropped.
- Pseudonymous session logging only (no name/email/CV/free-text).

### Excluded (these arrive in later phases)
- No rarity-weighting; no mobilité / interest / direct leaps.
- No cognitive quiz (no scenes, no clusters, no lean signal).
- No level-demote; no surface-with-label amber labels.
- No depth/niche sub-choices; no exclusion controls.

## Run it

```bash
npm install
cp .env.local.example .env.local   # optional — fixture mode is the default
npm run dev                        # http://localhost:3000
```

Fixture mode (`ROME_SOURCE=fixture`, `OFFER_SOURCE=fixture`, the defaults) needs
**zero external services** — it reads bundled JSON from `fixtures/` and uses an
in-memory session store.

## Verify

```bash
npm run build              # production build, all routes
npx tsc --noEmit           # type check — must be clean
npm run verify:honesty     # Phase-0 honesty invariants: skill-bridge only,
                           # count-based signal, coverage floor, no verdict,
                           # suppressed counted
```

Deploying with real data? Read [DEPLOY.md](DEPLOY.md) first — an unset data-source
flag silently falls back to the fixture dataset.

## Layout

```
config/            families.ts (7 flat) · quiz.ts (stub) · buckets.ts
src/lib/engine/    graph-direction-proposer (skill-bridge) · coverage · bucketer ·
                   results · direction-proposer · inventory · market-reality · honest-fork
src/lib/rome|offers/  data seams (fixture + dormant live impls)
src/app/           page (landing) · quiz (SeedStep → submit) · results (+ detail, offers)
scripts/           verify-phase0-honesty.ts
```

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. Deploys standalone on
Vercel with no config (fixture mode). Supabase is optional (session persistence);
absent → in-memory fallback.

---

*One of three phase extracts. Phase 1 adds the full engine (all leaps, rarity,
honesty layer); Phase 2 adds the cognitive quiz. Signal note: Phase 0 uses a
count-based tier, so a match sharing several skills reads "Piste solide"; Phase 1
uses a rarity-based tier and reads more conservatively without a quiz.*
