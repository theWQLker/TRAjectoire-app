# Trajectoire — Light Design Spec

A visual layer for the app that ALREADY EXISTS. Dresses the real flow (`/quiz` → `/results`)
and the real engine output. NOT a 12-screen rebuild. NOT mock data. Good-looking, calm,
with flair — but it styles what's there, it doesn't invent new screens or routes.

## Scope — only what exists
Three surfaces, matching the current codebase:
1. **Landing** (`/`) — short, sets tone, one CTA into the quiz.
2. **Quiz** (`/quiz`) — the existing 5-category soft-lean flow, restyled.
3. **Results** (`/results`) — the REAL engine output: Signal tiers, 4 buckets, held-back line, receipts.

No `/domaines`, `/comparer`, `/profil`, no analysis animation, no 12-screen tree. If a screen
isn't in the current app, it's not in this spec.

## Locked product ethic (these are non-negotiable, they ARE the product)
- Output unit: **Signal fort / Signal moyen / Signal faible**. NO percentages, NO match %, NO compatibility score. (Maps from engine `coverageStrength`: strong→fort, partial→moyen, exploratory→faible.)
- **Receipts visible**: each direction shows the real offers behind it. Never hidden.
- **"Ce n'est pas un verdict. Vous gardez la décision."** on landing + results.
- Held-back matches shown as an honest collapsed line, never silently dropped.
- Tone: calm, serious, a little editorial. No gamification, confetti, mascots, "dream job" language.

## Visual system — light, with flair
Reuse whatever tokens the codebase already has; add these as CSS vars only if missing.
```
--bg:        #fbfbfc   --surface:   #ffffff   --border: #e9ebef
--navy:      #1a2b4a   (headings/primary text)
--text:      #475068   --muted: #8a93a6
--blue:      #2563eb   --blue-soft: #eff4ff
--green:     #16a34a   --green-soft: #ecfdf3   (signal fort)
--amber-soft:#fff8eb                            (signal moyen)
--orange:    #ea7317   --orange-soft:#fff4e8   (signal faible / constraints)
```
- Whitespace over borders. Card padding 24px, radius 12px, thin 1px borders only where needed.
- Headings weight 500 max (no 700/bold-heavy). Body line-height 1.6, 15-16px.
- One serif accent (Source Serif 4 or Georgia) for the hero headline + page titles ONLY. Everything else Inter/system sans. This is where the "flair" lives — restrained, editorial, not decorative.
- Signal badges: small soft pills. fort=green-soft bg/green text, moyen=amber-soft/orange text, faible=orange-soft/orange text. Quiet, not loud.
- Icons: lucide line icons, 1.5 stroke, never filled. Sparingly.
- Flair = confident typography + generous space + the serif accent + the signal color system. NOT animation, gradients, or motion. When unsure: lighter and quieter.

## Surface 1 — Landing (`/`)
- Serif hero: "Pas un test de personnalité. Un miroir de réalité pour choisir une direction professionnelle en France."
- The not-a-verdict line beneath it, muted.
- Optional: a small live-data trust line (real numbers if available, else omit — do NOT invent stats).
- One primary CTA → the quiz. One short disclaimer footer.
- Keep it to one screen. No multi-section marketing page.

## Surface 2 — Quiz (`/quiz`)
- Restyle the EXISTING 5-category flow. Don't change its logic or questions.
- Category chapter header (serif, small), progress indicator (which category of 5).
- Soft-lean answers as calm option rows, not loud buttons. Selected = blue-soft bg, thin blue border.
- "les deux / ni l'un ni l'autre" always visible, quietly.
- Skippable categories preserved (the partial-completion feature). A quiet "passer cette section" affordance.
- Generous whitespace; one question-group visible at a time, uncramped.

## Surface 3 — Results (`/results`) — wires to REAL engine output
- Top: "Vos directions" + the not-a-verdict line.
- Four buckets in order: **À tester maintenant** (apply_now) / **Pont court** (bridge) / **Long terme** (long_term) / **Pas maintenant** (not_now). Render only non-empty buckets.
- Each direction card:
  - title + ROME code (muted)
  - Signal badge (fort/moyen/faible from coverageStrength)
  - "Pourquoi" line (the engine's plain "why surfaced")
  - coverage honesty label as words: "appuyé sur N de vos compétences" — never a %
  - offres trouvées (real count) + a "voir les annonces" affordance → receipts
  - for bridge: "ce qui manque souvent" (the requirement gap) + "premier geste"
- **Held-back line** at the bottom: "+N pistes plus larges, sans compétence partagée — non affichées" with a quiet expand. Honesty layer, must be present.
- Receipts: a panel/drawer per direction — real ad cards (titre, contrat, lieu, date publiée + vérifiée le, "voir l'annonce"). Receipts are the proof; keep them one tap away, not buried.

## Mobile
Cards stack vertical. Receipts = full-screen sheet. Same calm system, less density. Simple top-or-bottom nav between landing/quiz/results only — no 4-tab app nav.

## Build constraints
- Style the existing components/routes; do NOT create the 12-screen tree or invent routes.
- Results read the REAL engine output, not mock data. (coverageStrength→signal, buckets→sections, real offers→receipts.)
- Reuse existing tokens; add vars only if absent; components reference vars, never hardcode hex.
- No new engine logic, no #2 rarity-weighting, no #3 reach. Presentation only.
- Match the existing codebase's patterns (its Tailwind setup, its component conventions) rather than importing a foreign structure.
