# Trajectoire Visual Overhaul — Design

**Date:** 2026-07-04
**Branch:** trajectoire-ui
**Scope:** Display / presentation layer across all four surfaces (landing, quiz,
results, direction detail). NO engine, ranking, bucketing, coverage, or
signal-computation changes.

## Goal

Bring the visual craft of the provided high-fidelity mockups (composition,
hierarchy, iconography, sectioning, richer detail views) into the live app —
while routing every element through an **honesty firewall** that rejects any
claim the engine cannot back. The result reads as a considered analytical
instrument (editorial / tech), NOT a glossy SaaS product.

**Aesthetic direction (decided):** keep the mockups' *structure and layout*, but
strip the product gloss — hairline rules + whitespace instead of drop shadows,
flatter radii, quieter icon circles, tighter type. "Less SaaS, more instrument."

## The Honesty Firewall (non-negotiable)

The mockups contain several elements that directly contradict the product's
locked invariants and the current data reality (fixture offers: ~190 ads,
dept-75 only, stale — no live feed; no auth; no compatibility score anywhere).
Each is replaced, never reproduced:

| Mockup element | Reality | Honest replacement |
|---|---|---|
| "Compatibilité 82%" score | No % anywhere in product | Signal badge only: **Piste solide / à explorer** |
| "Signal fort / moyen / faible" | Renamed in committed spec | **Piste solide / Piste à explorer**; exploratory = no badge |
| "812 000+ offres · 95% récentes · +18%" | Fixture = 190, dept-75 | Real cache count + method framing; NO invented trend/percentage |
| "Secteurs porteurs: Services, Éditeurs" | No sector data field | Drop, or use real `market.commonTitles` (intitulés fréquents) |
| "Se connecter / Créer mon compte" | No auth system | Omit — header links only to routes that exist |
| Skill chips (SQL, ITIL, ITSM) | Only offers carry labels | Chips ONLY from `offer.competences[].libelle`; never raw codes |
| "Télécharger / Exporter le rapport" | No export feature | Omit |
| "Comparer 3 directions" | No compare feature | Omit |
| "Généré le 14 mai 2024" | No generation timestamp | Omit (or cache verified-date if honest) |
| Dual front doors (domaine / parcours) | Only the quiz exists | Single real CTA into the quiz |

**Rule:** if a field has no honest data source, the element is omitted, not
fabricated. Where a bucket/band would be empty (e.g. `apply_now` often empty per
audit), it is honestly absent — never padded.

## Files

### New files
- `src/components/SiteHeader.tsx` — shared branded header (logo mark + wordmark),
  real links only, no auth.
- `src/components/IconCircle.tsx` — quiet tinted-circle-with-icon primitive.
- `src/components/Chip.tsx` — consolidated small pill (contract type, skill
  libellé, count badge).
- `src/app/results/direction/[romeCode]/page.tsx` — new per-direction detail
  route (mockup 3), composed from real fields only.

### Modified files
- `src/app/globals.css` — token tweaks (flatter radius, NO shadow token, type).
- `src/components/Card.tsx` — flat variant; remains shadowless.
- `src/app/results/page.tsx` — hero band + content-weighted bucket layout.
- `src/app/page.tsx` — landing composition (hero + honest insight card + pillars).
- `src/app/quiz/QuizFlow.tsx` — stepper look applied to the REAL flow.
- `src/lib/ui.ts` — any label/hint copy touched (existing committed labels kept).

### MUST NOT change (engine — locked)
`src/lib/engine/*` (coverage.ts, graph-direction-proposer.ts, results.ts,
bucketer.ts, level-demote.ts, market-reality.ts, …), `config/*`. `signalStrength`,
`displayRank`, `matchRaritySum`, coverage floor, suppression, `VISIBLE_CAP`
pagination semantics — all untouched.

---

## Section 2 — Shared visual system (gloss stripped)

**Tokens (`globals.css`):**
- **No shadow token.** Depth = hairline 1px `--border` on `bg-surface` against
  warm `--bg`, plus whitespace and background-tint contrast. This is the primary
  "less SaaS" lever.
- Flatter radius: `--radius-card: 10px`; hero/feature panels 12px max.
- Tighter type: dense card areas drop to `line-height: 1.5` (body stays 1.6);
  slight heading tracking tightening; numbers rendered tabular where prominent.
- Icon-circle tints reuse existing soft colors (`blue-soft`, `green-soft`,
  `orange-soft`, `amber-soft`) — no new hues.

**`SiteHeader`:** logo = "T" in a rounded blue tile + "Trajectoire" wordmark
(serif). Links: only real destinations. On landing, optional in-page anchors
(`Comment ça marche`, `Méthodologie`) OR omitted; NO login/signup. On quiz:
logo + `Quitter et enregistrer` → home. On results: logo + a quiet `Analyse
terminée` status chip + `refaire le quiz`.

**`IconCircle`:** `size-9 rounded-full bg-{tint}-soft`, centered lucide icon at
`strokeWidth={1.5}`. Quiet, low-contrast — labels sections, does not decorate.

**`Chip`:** hairline/soft pill; variants for neutral (border), soft-blue (skill),
count. Replaces the 3 ad-hoc pill styles in AdCard/SignalBadge/quiz.

**Icon vocabulary (lucide, already installed):**
- Buckets: `Rocket` (apply_now) · `Milestone` (bridge) · `Mountain` (long_term) ·
  `CircleSlash` (not_now).
- Sections: `Gem` (intersections fortes) · `Briefcase` (côté emploi) ·
  `UserCog` (côté autonomie) · `Lightbulb` (comment choisir).

**`Card`:** gains an explicit flat/quiet variant (border + optional tint), never
elevated. `SiteFrame` (rounded outer page frame) is NOT built — reads product-y.

---

## Section 3 — Results page (`/results`)

Engine output, ranking, `VISIBLE_CAP` pagination, and all honest content
(whyFr, coverageFr, thin-market amber label, excludedButSurfaced flag, bridge
gate box, per-card badge gating, held-back drawer) are preserved. Only layout and
styling change.

### 3a. Header block
- `SiteHeader` above; quiet `Analyse terminée` status chip.
- Serif H1 **"Vos directions réalistes"**; one-line method subtitle.
- Keep honest source/dept meta line + `refaire le quiz` link. Keep `NOT_A_VERDICT`.
- OMIT "Télécharger le rapport" and "Généré le …" (no data source).

### 3b. `apply_now` as the "Vos intersections fortes" hero band
The `apply_now` bucket renders full-width and prominent, as the mockup's featured
band. Derived, not new data — the top 1–2 `apply_now` directions by `displayRank`.
- Section header: `Gem` IconCircle + serif "Vos intersections fortes" + honest
  hint "Des recoupements soutenus par des annonces réelles."
- Each highlight card (flat, hairline, roomy): title, **Piste solide/à explorer
  badge (NO % score)**, `whyFr` line, then a footer row of REAL fields only:
  - `Offres trouvées` → `market.marketDemand`
  - `Intitulés fréquents` → `market.commonTitles` (replaces fabricated sectors)
  - `Premier geste` → bridge gate first-move if present, else omitted
  - CTA "Voir les annonces →" → `/results/offers/[rome]`.
  - Title/card also links to the new detail route (3.d / Section 4).
- **Honesty guard:** if `apply_now` is empty, the band is absent entirely — no
  fabrication, no borrowing from other buckets to fill slots.

### 3c. Content-weighted bucket layout (NOT a uniform grid)
Rationale: buckets are not equal in importance or size (audit: `bridge` ~90% of
results, `apply_now` often small/empty). A symmetric 4-column grid would
visually equalize them, cramp dense cards, and leave empty lanes. Layout follows
content weight instead — more editorial than a rigid grid, and honest about
hierarchy:
- **`apply_now`** → the full-width hero band (3b).
- **`bridge`** → full-width stacked section (the workhorse; bridge gate box needs
  width). `VISIBLE_CAP` + native `<details>` "Voir les autres pistes" handles its
  large size.
- **`long_term` + `not_now`** → a bottom 2-column row (lighter buckets pair
  side-by-side without cramping; smaller + lower placement truthfully encodes
  lower importance). Each still uses `VISIBLE_CAP` + `<details>`.
- Every bucket header: quiet IconCircle + `BUCKET_LABEL` + full count +
  `BUCKET_HINT` (existing committed copy).
- Responsive: the bottom 2-col row collapses to 1 col on mobile; `bridge` cards
  are single-column throughout.

### 3d. Card links
Result cards (hero + bucket cards) link their title to the new
`/results/direction/[romeCode]` detail route; the market line keeps its direct
"voir les annonces" link to the offers route.

---

## Section 4 — Direction detail page (new route)

`src/app/results/direction/[romeCode]/page.tsx`. Composes mockup 3 from REAL
fields only. Reads through the same `buildResults` output (find the direction by
romeCode) + `getOfferSource` for the ads. No % score anywhere.

- **Header:** `SiteHeader` + back-to-results link; serif title; ROME code; honest
  intro line. **Signal badge (Piste solide/à explorer)** in place of the
  "Compatibilité 82%" card.
- **"Côté emploi salarié" (left column):**
  - Real `market.marketDemand` ("N offres trouvées dans votre zone"), framed
    honestly against the cache (no "sur 250+ analysées" unless real).
  - "Intitulés fréquents" from `market.commonTitles` (real).
  - "Exigences détectées" — aggregated `offer.competences[].libelle` across the
    direction's cached offers (real, labelled chips via `Chip`). Skip the block
    entirely if no labelled competences.
  - Mockup's "Les ouvertures" (openings analysis) — rendered ONLY if derivable
    honestly from offer fields; otherwise omitted.
- **"Annonces utilisées pour ce signal" (right column):** first 3 real offers via
  existing `AdCard`; "Voir toutes les N annonces" → existing offers route.
- **"Côté autonomie":** rendered ONLY if the engine/config supplies autonomy
  content for this direction. If it is static boilerplate with no data source,
  it is omitted (verify during implementation against the build brief / config).
- **Footer:** honest "prendre du recul" line. OMIT "Comparer 3 directions" and
  "Exporter mon rapport".
- **Not-found / empty:** if the romeCode isn't in results or has no offers, fall
  back gracefully (link back to results); never fabricate.

---

## Section 5 — Landing + quiz

### Landing (`src/app/page.tsx`)
Adopt the mockup's composition; honest content only.
- `SiteHeader`.
- Hero (left): keep serif headline + `NOT_A_VERDICT` framing; single real CTA
  "Commencer l'analyse" → `/quiz`.
- Insight card (right): honest method framing (what Trajectoire crosses:
  preuves × contraintes × marché). **NO fabricated stats** (812k / 95% / +18%).
  If any number appears it must be real and labelled as a snapshot.
- 3-pillar band: "Vos preuves / Le marché / Les issues" with honest copy +
  quiet IconCircles.
- Footer: existing honest disclaimer.
- **Dual front doors DROPPED** (domain-exploration path doesn't exist; routing
  both to the same quiz would be dishonest chrome).

### Quiz (`src/app/quiz/QuizFlow.tsx`)
Apply the mockup's numbered-stepper *look* to the REAL flow — NOT the fabricated
"Entrée / Preuves / Contraintes / Résultats" 4-step. The real flow is:
Seed (skippable) → 5 cognitive chapters.
- Restyle the existing progress into a numbered-step header aesthetic (current
  chapter emphasized, others quiet), flat cards, quieter option rows.
- All quiz logic, gating, config-driven questions, seed/exclude behavior —
  UNCHANGED. Presentation only.

---

## Honesty invariants (must still hold)

- No compatibility % or numeric score anywhere.
- Signal badges: "Piste solide" / "Piste à explorer"; exploratory renders no
  badge; `not_now` suppresses all signal badges.
- No invented market stats, trends, sectors, or freshness numbers. Any number
  shown traces to real cache/offer data.
- No raw competence codes shown; skill chips only from labelled offer data.
- Held-back / suppressed drawer, coverage floor, thin-market amber label,
  excludedButSurfaced flag — all preserved.
- Bucket counts reflect the full bucket; pagination hides, never drops.
- Links point only to routes that exist; no auth/export/compare chrome.

## Proof (Playwright, live browser)

Seed the audit personas via existing `scripts/seed-persona-sessions.ts`. Run dev
server; drive each surface in Playwright at desktop + mobile widths.
- Landing: no fabricated stats; single CTA; header has no auth links.
- Quiz: stepper reflects Seed → 5 chapters; logic intact.
- Results: hero band present iff `apply_now` non-empty; bridge stacked; long_term
  + not_now 2-col; no "Signal fort/moyen/faible" text; no % score; pagination
  intact; not_now cards show no badge.
- Detail route: renders from real fields; no % score; no compare/export; chips
  only where labelled offers exist.
- Screenshots above-the-fold for each surface, both widths.

## Out of scope (YAGNI)

- No auth, export, compare, or domain-exploration features.
- No engine/ranking/bucketing/coverage changes.
- No live-data or refresh work (data layer honesty is a separate concern).
- No new bucket, re-tiering, or copy changes beyond the noted headings/labels.
