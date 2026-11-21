# Dev database

Local runs and tests use a **local Supabase stack**, never the production
project. `.env.local` points at it. Production keys don't belong in any local
env file, and `src/lib/supabase.ts` refuses a hosted Supabase URL from any
process that isn't a Vercel deployment, so pasting them back fails loudly
instead of writing test sessions into production.

| | |
|---|---|
| API (PostgREST) | `http://127.0.0.1:54421` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54422/postgres` |
| Studio | `http://127.0.0.1:54423` |

Ports are 544xx so the stack runs beside other projects' stacks on the default
543xx. Config: `supabase/config.toml` (project id `trajectoire`). The CLI is a
pinned dev dependency (`supabase@2.122.1`), so `npx supabase` is the same
version in every worktree.

## What's in it

- **Schema:** every migration in `supabase/migrations/`, applied by the CLI.
  That is production's schema plus the migrations this tree has that
  production hasn't applied yet (`dev-db-sync.ts` lists them on every run).
- **Data:** the ROME graph, the cluster mirror, the offer cache, offer counts
  and ingest runs, copied from production by `scripts/dev-db-sync.ts`.
- **Not copied:** `quiz_sessions`, `session_evidence`, `recommendations`,
  `feedback`. That's user data. Dev sessions are the ones you create locally.

## Daily use

Docker Desktop must be running.

```bash
npm run db:start          # start the stack (first run pulls images)
npm run db:stop           # stop it; data is kept in a Docker volume
```

`.env.local` takes the values from `npx supabase status -o env`:
`NEXT_PUBLIC_SUPABASE_URL` = `API_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` =
`ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` = `SERVICE_ROLE_KEY`. These are the
CLI's fixed local demo keys, not secrets.

## Refresh the data / start over

```bash
npm run db:reset          # wipe, reapply every migration (data gone)
npm run db:sync -- --from=<prod env file>          # copy + verify
npm run db:sync -- --from=<prod env file> --check  # verify only, writes nothing
```

`--from` is an env file holding production's `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. Keep it **outside the repo** and delete it after
use. The values are in the Supabase dashboard (Project Settings → API) or in
Vercel's production env. The sync reads production with GET requests only and
writes only to a localhost target. It then checks the result: schema (every
production table and column present in dev with the same type), row counts,
and a content fingerprint per table. Any difference fails the run.

A new migration: add the file, then `npx supabase migration up --include-all`
(or `db:reset` + `db:sync`). Production still gets it by hand (DEPLOY.md).

## Deliberate production operations

Ingests into production, the post-deploy smoke on a real session and the
appellations import run against production on purpose. Opt in explicitly:

```bash
TRAJECTOIRE_REMOTE_DB=allow ROME_SOURCE=live OFFER_SOURCE=live \
  node --env-file=<prod env file> node_modules/tsx/dist/cli.mjs scripts/<script>.ts ...
```

Without `TRAJECTOIRE_REMOTE_DB=allow` the client throws before sending a
request. A Vercel deployment (`VERCEL` set and `VERCEL_ENV` not `development`)
needs no opt-in.

## Test sessions in production

Sessions that tests wrote to production before this change are flagged
`quiz_sessions.is_test` (migration 0009). Usage numbers read the
`real_quiz_sessions` / `real_feedback` views, never the base tables:
`scripts/usage-metrics.ts`.
