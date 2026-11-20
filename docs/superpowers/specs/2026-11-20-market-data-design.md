# Market data: daily counts, live ads (design only)

Date: 2026-11-20. Status: **design, not built.** No bulk France Travail pull until
the credential rotation is confirmed and the open questions below are answered.

## Decisions this design implements (2026-11-20)

- Zones: the 9 the quiz offers, 75 77 78 91 92 93 94 95, plus "France entière".
- Refreshed **daily**. **Counts** are stored for ranking.
- **Ads are fetched live** when a direction opens and cached for 24 h at most. Ads the API
  no longer returns are purged.

## Today, measured

| | |
|---|---|
| Stored ads | 16,789, all from Paris (75), collected 2026-06-30 |
| Ads ≤ 7 days old | 0 |
| Jobs with no ads | 810 of 1,923 (Paris); 1,923 of 1,923 (every other zone) |
| Location stored | département only, no commune |

## 1. Daily counts (ranking input)

- **Call:** `GET /offresdemploi/v2/offres/search?codeROME={rome}&departement={zone}&range=0-0`,
  reading `Content-Range` for the true total. "France entière" omits `departement`.
- **Volume:** 1,923 jobs × 9 zones = **17,307 calls a day**. At the 10 req/s the
  limiter already enforces, that's about 29 minutes.
- **Runner:** a Vercel function stops at 300 s, so a single cron can't do 29 minutes.
  Options:
  - (a) a GitHub Actions scheduled job running a node script (simplest; FT and Supabase
    secrets go into GitHub secrets **after** rotation);
  - (b) a chunked cron with a stored cursor (6+ runs);
  - (c) a Supabase Edge Function on `pg_cron`.

  Recommend (a).
- **Storage**, drafted here and deliberately **not** placed in `supabase/migrations/`:
  ```sql
  create table market_counts (
    rome_code  text not null,
    zone       text not null,          -- '75' … '95', 'france'
    total      integer not null,       -- Content-Range total
    counted_at timestamptz not null,
    primary key (rome_code, zone)      -- one row per pair, overwritten daily
  );
  ```
- **Reads:** `marketDemand` comes from `market_counts`. `OfferSource.coverage()` reports a
  zone as covered when its last count is ≤ 24 h old, so the "pas de données" and
  "non vérifié" paths keep working when a run fails.

## 2. What ranking reads besides counts — needs a decision

Ranking today also reads ad **content** for every surfaced direction:
- the unmet skills ("gates") that split apply_now, bridge and long_term;
- the diploma and experience mix behind the level demote.

Counts alone don't carry either. Options:

- **(a) Aggregates, no ads stored.** Run the daily call with `range=0-149` instead of
  `0-0` (same number of calls). From the newest 150 ads compute, per (job, zone): skill
  frequencies, experience mix and diploma mix. Store only those numbers, then drop the
  ads. No offer is kept, so art. 7 is not engaged. **Open: does art. 1.1 or the
  licence allow derived statistics?** Rough payload: up to 150 × ~3 KB per call, most
  pairs far fewer, about 0.5–1 GB a day.
- **(b) Counts only.** Gates and the level demote lose their input. That means a bucket
  redesign and a large before/after.

Recommend (a) if the licence allows statistics. Otherwise (b), with the bucket logic
redesigned first.

## 3. Live ads when a direction opens

- **Call:** the same search per chosen zone, `range=0-149`, newest first.
- **Cache:** per (job, zone), at most 24 h, stored server-side (service role). Each refresh
  **replaces** the cached set for that key, so an ad the API stopped returning disappears
  at the next refresh. A cached set older than 24 h is never shown: refetch, or say the
  ads are unavailable.
- **Location:** the API's `lieuTravail.libelle` (commune) is shown on the card.
- **The level demote and requirement links** on the offers page use these live ads.

## 4. Licence check, article by article

From the old Pôle emploi offers licence. The current version is being read; re-check every
row against it.

| Art. | Requirement | Design | Today (shipped) |
|---|---|---|---|
| 1.1 | Don't alter content or meaning | Titles: only repeated « (H/F) » markers removed, the first kept as published; nothing else rewritten. Skill labels shown as returned. | Same (decision 1, this pass). |
| 4 | Source, update date, licence link, list of modifications | Every ad surface: « Annonces France Travail », count or fetch date, licence link, `OFFER_MODIFICATIONS`. | Source ✓, date ✓, modifications ✓. **Licence link missing: URL needed.** |
| 5.2 | Refresh at least every 24 h | Counts daily; displayed ads ≤ 24 h old. | **Not met:** ads shown are from 2026-06-30. |
| 5.3 | Full content per offer | Each ad shows its full API content (description, employer, salary, location) behind « Voir l'annonce complète », or links to the original on francetravail.fr. **Open: which one 5.3 requires.** | **Not met:** cards show title, contract, date and up to 6 skills, with no link. |
| 7 | Don't store deleted offers | No ad stored beyond the 24 h cache, which is replaced on refresh. Option (a) keeps numbers only. | **Not met:** 16,789 ads from June are stored and shown. Most are likely closed. |

The shipped site is out of line with 5.2, 5.3 and 7 today. Bringing it in line before
the live path exists means removing the stored ads from display and from ranking inputs.
That moves every bucket, so it's a product call, and deleting `offers_cache` rows is
irreversible.

## 5. Quotas and keys

- The FT daily quota for Offres v2 is unknown. The code assumes 10 req/s.
  **Confirm before the first daily run.**
- `.env.local` FT credentials date from 2026-06-18 and still authenticate. The rotation
  planned in August was not done. **Rotate before any bulk pull.**

## 6. Rollout, each step stopping for a decision

1. Rotate the FT secret (and the GitHub token if one is used). Confirm the quota and the
   licence answers (statistics; full content).
2. Probe: one job × 9 zones, counts only. Report the totals and timings.
3. One full daily count run. Report blind roles per zone, before and after.
4. Before/after per persona with `marketDemand` read from `market_counts`. **Stop and ask.**
5. Live ads path behind a flag. Then retire `offers_cache` from display and ranking
   (irreversible delete: ask).
