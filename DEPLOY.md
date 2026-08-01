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

## Notes

- **Local env:** `cp .env.local.example .env.local` and fill secrets. The example
  is committed (`.gitignore` has a `!.env.local.example` exception) so the required
  vars — including the data-source flags — are always visible.
- **Proof/diagnostic scripts** under `scripts/**` are excluded from the build
  typecheck (`tsconfig.json` `exclude`), so a type error in a proof can't block a
  deploy. They still run via `tsx`.
