# Deploy checklist

This app has two honest deploy modes. Decide which one you are shipping **before**
you deploy, because the engine cannot tell you afterwards:

| Mode | Flags | Shows |
|---|---|---|
| **Demo** (zero config) | `ROME_SOURCE` / `OFFER_SOURCE` unset or `fixture` | the tiny bundled fixture dataset |
| **Real data** | both `live` + Supabase env set | the real ROME graph + cached offers |

The danger is a **real-data deploy with a missing flag**: an unset flag silently
falls back to `fixture` (`src/lib/rome/index.ts`, `src/lib/offers/index.ts`), and the
page looks normal. This already happened in production on the prototype.

## 1. Real-data deploy — set and verify the flags

`ROME_SOURCE` and `OFFER_SOURCE` must be **`live`** in Production **and** Preview.

```bash
vercel env ls                                   # both present in Production + Preview?
vercel env pull /tmp/prod.env --environment=production
grep -E 'ROME_SOURCE|OFFER_SOURCE' /tmp/prod.env # expect ="live"
```

If missing, set them (`--no-sensitive` keeps them verifiable):

```bash
vercel env add ROME_SOURCE  production --value live --no-sensitive --yes
vercel env add OFFER_SOURCE production --value live --no-sensitive --yes
vercel env add ROME_SOURCE  preview    --value live --no-sensitive --yes
vercel env add OFFER_SOURCE preview    --value live --no-sensitive --yes
```

Env changes only take effect on the **next** deploy — redeploy after editing.

## 2. Post-deploy check (real-data mode)

Run the flow with a **tech** family seed. On live data, tech directions (ROME
M18xx) sit near the top. If thin generic matches (D1408 Téléconseil, M1607
Secrétariat) top a tech seed, the deploy is on **fixture** — recheck section 1.

## Notes

- Proof/diagnostic scripts under `scripts/**` are excluded from the build
  typecheck (`tsconfig.json` `exclude`), so a type error in a script can't block a
  deploy. They still run via `tsx`.
