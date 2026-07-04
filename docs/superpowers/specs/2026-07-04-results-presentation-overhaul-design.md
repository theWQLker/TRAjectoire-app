# Results Page Presentation Overhaul — Design

**Date:** 2026-07-04
**Branch:** trajectoire-ui
**Scope:** Display / copy only. No engine, ranking, or tier-computation changes.

## Goal

Three presentation changes to `/results`, purely in the view layer:

1. Force semantic bucket render order (not displayRank-sorted) + new French headings.
2. Paginate cards per bucket (top-N visible, expander for the rest).
3. Rename signal badges, drop the exploratory badge entirely, and suppress all
   signal badges in the `not_now` bucket.

## Files touched (exactly these three)

- `src/app/results/page.tsx` — bucket iteration, pagination, per-card badge gating.
- `src/lib/ui.ts` — bucket labels/hints, signal label rename, mapping for the dropped tier.
- `src/components/SignalBadge.tsx` — render `null` for the dropped tier.

## Files that MUST NOT change (engine — locked)

`src/lib/engine/coverage.ts`, `src/lib/engine/graph-direction-proposer.ts`,
`src/lib/engine/results.ts`, and any other engine file. `signalStrength()`,
`displayRank`, `matchRaritySum`, coverage floor, suppression — all untouched.

---

## Change 1 — Bucket ordering (force semantic order)

**Current:** `page.tsx` sorts the four categories by `bucketStrength(group)` (max
`displayRank`), with `CATEGORY_RANK` only as a tiebreak. Result: a strong `bridge`
bucket can render above `apply_now`.

**Target:** fixed semantic order, always:

| order | category | heading | hint |
|-------|----------|---------|------|
| 1 | `apply_now` | Accessible maintenant | (keep existing) |
| 2 | `bridge`    | À portée — quelques mois | (keep existing) |
| 3 | `long_term` | Plus long terme | (keep existing) |
| 4 | `not_now`   | Pas maintenant | **rewrite** (see below) |

**Implementation:**
- Remove the `.slice().sort(...)` block; iterate `CATEGORY_ORDER` directly.
- Delete the now-unused `bucketStrength()` helper and `CATEGORY_RANK` (only used by
  the sort). Keep `CATEGORY_ORDER` as the render sequence.
- In `ui.ts`, update `BUCKET_LABEL`:
  - `apply_now`: "Accessible maintenant"
  - `bridge`: "À portée — quelques mois"
  - `long_term`: "Plus long terme"
  - `not_now`: "Pas maintenant" (unchanged text)
- In `ui.ts`, update `BUCKET_HINT.not_now`. Current text ends "un signal, jamais un
  verdict" — that framing no longer fits "Pas maintenant". New:
  > "Bloqué par une contrainte ou un marché trop fin."
  Other three hints kept, but re-read against new headings (they still fit).

## Change 2 — Card pagination (top-N + expander)

Visible caps per bucket:

| category | visible |
|----------|---------|
| apply_now | 6 |
| bridge | 5 |
| long_term | 4 |
| not_now | 3 |

- Cards remain sorted `displayRank desc` (tiebreak `coverage desc`) — unchanged.
- Take the first `cap` cards; render them. If `group.length > cap`, render a native
  `<details>` drawer below with summary text **"Voir les {remaining} autres pistes"**
  (`remaining = group.length - cap`), containing the rest of the cards.
- Native `<details>` (same pattern as the existing suppressed drawer) keeps the page a
  server component — no `useState`, no `"use client"`.
- New constant `VISIBLE_CAP: Record<Category, number>` in `page.tsx`.
- **Honesty:** nothing is filtered or removed — the hidden cards are still in the DOM,
  just behind the expander. Bucket count `({group.length})` in the heading is unchanged
  and still reflects the full bucket.

## Change 3 — Signal badge rename + exploratory drop

Backend `signalStrength()` returns `strong | partial | exploratory` — **untouched**.
Display mapping changes only:

| tier | badge text | styling | rendered? |
|------|-----------|---------|-----------|
| strong | "Piste solide" | keep green (`fort` styling) | yes |
| partial | "Piste à explorer" | keep amber (`moyen` styling) | yes |
| exploratory | — | — | **no element at all** |

Plus: **in the `not_now` bucket, no signal badge on any card, regardless of tier.**
The amber thin-market label and the "why" text carry the information there.

**Implementation:**
- `ui.ts`: rename `SIGNAL_LABEL` values — `fort`→"Piste solide", `moyen`→"Piste à
  explorer". `faible` maps to no badge, so its label is dropped.
- `SignalBadge.tsx`: return `null` when `signal === "faible"` (the exploratory tier),
  so the element is removed, not merely hidden. Keep existing pill styling for the
  other two.
- `page.tsx` `DirectionCard`: gate the badge on bucket. Pass whether the card is in
  `not_now` (or read `d.bucketResult.category`); when `not_now`, do not render
  `<SignalBadge>` at all.

## Honesty invariants (must still hold)

- Held-back / suppressed drawer ("+N pistes plus larges…") unchanged.
- Coverage floor untouched; no direction removed or filtered by these changes.
- Amber thin-market label (`d.thinMarketSeeded`) stays on ANY card with 0 cached
  offers, in every bucket and tier.
- Bucket counts in headings reflect the full bucket (pagination hides, never drops).

## Proof (Playwright, live browser — matches earlier audit)

Seed the 3 audit personas via the existing `scripts/seed-persona-sessions.ts`
(unchanged): Shape-B analytical, Shape-A santé:soin hands-on, Shape-B 3-family
commercial. Run the dev server, drive `/results?session=<id>` in Playwright.

For each persona report:
- Bucket render order (confirm semantic apply_now→bridge→long_term→not_now, not
  displayRank-sorted).
- Card count per bucket: visible + behind expander.
- First card in each bucket: title + badge text or "no badge".
- Confirm NO "Signal fort/moyen/faible" text anywhere in rendered output.
- Confirm `not_now` cards show no signal badge.
- Screenshot the above-the-fold viewport.

## Out of scope (YAGNI)

- No client-side pagination state / "show more" animation — native `<details>`.
- No change to card content, market lines, bridge gates, or offers page.
- No new bucket, no re-tiering, no copy changes beyond the three headings + one hint +
  two badge labels.
