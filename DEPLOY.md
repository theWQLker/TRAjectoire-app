# Deploy checklist

Short, mandatory pre-/post-deploy steps. The first section exists because a
missing data-source flag silently ran **production on the `fixture` dataset** —
tech-seed profiles returned thin generic-admin matches with no real market. The
engine defaults `ROME_SOURCE`/`OFFER_SOURCE` to `fixture` when unset OR empty
(`src/lib/rome/index.ts`, `src/lib/offers/index.ts`), so absence fails silently.

## 1. Data-source flags — REQUIRED (do this every deploy)

`ROME_SOURCE` and `OFFER_SOURCE` must be **`live`** in Production **and** Preview.

Verify (values are readable only if added `--no-sensitive`):

```bash
vercel env ls                                  # both present in Production + Preview?
vercel env pull /tmp/prod.env --environment=production
grep -E 'ROME_SOURCE|OFFER_SOURCE' /tmp/prod.env   # expect ="live" (NOT "" or missing)
```

If missing or empty, set them (use `--no-sensitive` so they stay verifiable):

```bash
vercel env add ROME_SOURCE  production --value live --no-sensitive --yes
vercel env add OFFER_SOURCE production --value live --no-sensitive --yes
vercel env add ROME_SOURCE  preview    --value live --no-sensitive --yes
vercel env add OFFER_SOURCE preview    --value live --no-sensitive --yes
```

Env changes only take effect on the **next** deploy — redeploy after editing.

## 2. Deploy

```bash
git push origin <branch>     # keep GitHub in sync; a git-integration deploy must build the same SHA
vercel --prod --yes
```

`vercel --prod` uploads the local working tree (respecting .gitignore) — push
first so a later git-triggered deploy can't build a different (older) commit.

## 3. Post-deploy verification (proves live data, not fixture)

```bash
# Confirm the deployed commit matches local HEAD:
git rev-parse HEAD
vercel inspect trajectoire-ui.vercel.app        # 'Source' commit should match

# Smoke a real session end-to-end (replays the exact page code path on live data):
ROME_SOURCE=live OFFER_SOURCE=live \
  node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
  scripts/replay-stored-session.ts <a-real-session-id>
```

On live data a tech-seed profile surfaces tech directions (M18xx) near the top.
If you see thin generic matches (D1408 Téléconseil, M1607 Secrétariat) topping a
tech seed, production is on **fixture** — recheck section 1.

## 4. One-off: ROME appellations (migration 0010)

Replaces the 34 legacy rows of `rome_appellations` with the 14,330 ROME 4.0
appellations from France Travail open data (Licence Ouverte 2.0). Nothing in the
app reads the table yet, so the order relative to a deploy does not matter.

1. Apply `supabase/migrations/0010_rome_appellations_opendata.sql` (additive: six
   columns and a unique index on `code_ogr`).
2. Download and extract the open-data bundle
   (`https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/csv`).
3. Dry run, then write (writes production; backs up the current rows first):

```bash
node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
  scripts/import-rome-appellations.ts <extracted-dir>
node --env-file=.env.local node_modules/tsx/dist/cli.mjs \
  scripts/import-rome-appellations.ts <extracted-dir> --write <backup.json>
```

Each ROME release (about twice a year): rerun step 3 on the new bundle; rows of
the previous version are removed. Any screen showing these titles carries
`romeCredit()` ("Source : France Travail, ROME", with the version's date).

## Notes

- **Local runs write to the production database.** `.env.local` points at the same
  Supabase project as production. A local quiz submission, `live-smoke`,
  `results-load`, `seed-persona-sessions` or an ingest script writes real rows
  (`quiz_sessions`, `feedback`, `offers_cache`) that production reads. The
  smoke and load scripts delete the sessions they create; others don't.
- **Scripts that hit a site** (`live-smoke`, `results-load`) default to the local
  build and refuse any non-local URL without `--allow-production`
  (`scripts/target-guard.ts`). To smoke production after a deploy:
  `BASE=https://trajectoire-ui.vercel.app npx tsx scripts/live-smoke.ts --allow-production`.

- **Local env:** `cp .env.local.example .env.local` and fill secrets. The example
  is committed (`.gitignore` has a `!.env.local.example` exception) so the required
  vars — including the data-source flags — are always visible.
- **Proof/diagnostic scripts** under `scripts/**` are excluded from the build
  typecheck (`tsconfig.json` `exclude`), so a type error in a proof can't block a
  deploy. They still run via `tsx`.
