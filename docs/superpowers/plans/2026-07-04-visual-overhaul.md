# Trajectoire Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the mockups' visual craft into all four app surfaces (landing, quiz, results) plus a new direction-detail route, in the display layer only, with a gloss-stripped editorial look and an honesty firewall on every element.

**Architecture:** Pure presentation change. Add three shared UI primitives (`SiteHeader`, `IconCircle`, `Chip`), adjust design tokens, then recompose each page against the REAL engine output (`buildResults`) and REAL offer data. No engine, config, ranking, bucketing, or coverage code changes. New detail route reads the same seams the results/offers pages already use.

**Tech Stack:** Next.js 16 (App Router, Server Components — pages stay server components, no `"use client"` added except the already-client QuizFlow), React 19, Tailwind CSS v4 (tokens via `@theme inline` in `globals.css`), `lucide-react@^1.21.0`, `tsx` for scripts, Playwright MCP for visual proof.

## Global Constraints

- **Engine locked:** never modify `src/lib/engine/*` or `config/*`. Verify with `git diff --name-only` before every commit — if an engine/config file appears, revert it.
- **No compatibility % or numeric score** rendered anywhere.
- **Signal badges only:** "Piste solide" (fort) / "Piste à explorer" (moyen); exploratory (faible) renders NO badge; `not_now` bucket suppresses ALL signal badges.
- **No invented stats:** no fabricated offer counts, trends, freshness %, or sectors. Any number shown must trace to `market.marketDemand`, `market.commonTitles`, or real offer fields.
- **No raw competence codes** in UI. Skill chips ONLY from `offer.competences[].libelle`.
- **Links only to routes that exist:** `/`, `/quiz`, `/results`, `/results/offers/[romeCode]`, `/results/direction/[romeCode]` (new). NO auth / export / compare / dual-front-door chrome.
- **Preserve honesty machinery:** held-back/suppressed drawer, coverage floor, thin-market amber label, `excludedButSurfaced` flag, `VISIBLE_CAP` pagination (counts reflect full bucket; pagination hides, never drops).
- **Tokens only:** style via Tailwind utilities that resolve to CSS vars (`bg-surface`, `text-navy`, `border-border`, …) — never a hardcoded hex. NO drop shadows.
- **Verification gate every task:** `npm run build` must pass (typecheck + compile) AND `npm run lint` must pass before commit. Show the passing output.
- **Icon safety:** every lucide icon imported must exist in `lucide-react@^1.21.0` — verify by import + build, swap to a confirmed-existing icon if the named one is absent.

---

## Task 0: Baseline — confirm build/lint are green before any change

**Files:** none (baseline capture)

**Interfaces:**
- Produces: a known-good build/lint baseline so later failures are attributable.

- [ ] **Step 1: Run the build**

Run: `npm run build`
Expected: completes with exit 0 (Next.js "Compiled successfully" / route list). If it fails on `main`/current HEAD, STOP and report — do not start the overhaul on a broken baseline.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: exit 0, no errors.

- [ ] **Step 3: Start the dev server and confirm the three current routes render**

Run: `npm run dev` (background), then load `/`, `/quiz`, `/results` in the Playwright MCP browser.
Expected: all three respond 200 and render without console errors. Capture a "before" screenshot of `/results` for later comparison. Leave the dev server running for subsequent tasks.

No commit (baseline only).

---

## Task 1: Design tokens — flatten radius, tighten type, confirm no shadow

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: token `--radius-card` = `10px`; a `--radius-lg` = `12px` for hero/feature panels; confirmed absence of any shadow token. Utilities `rounded-card` (10px) and `rounded-lg-panel` (12px) available.

- [ ] **Step 1: Reduce card radius and add a panel radius**

In `src/app/globals.css`, change `--radius: 12px;` to `--radius: 10px;` and add `--radius-lg: 12px;` in `:root`. In `@theme inline`, keep `--radius-card: var(--radius);` and add `--radius-lg: var(--radius-lg);`.

- [ ] **Step 2: Tighten dense-area line-height without touching body rhythm**

Leave `body { line-height: 1.6 }` as-is (spec keeps generous body rhythm). Do NOT add a global override. (Per-component tightening happens in card components via `leading-relaxed`→default utilities, not globally — no CSS change needed here beyond the radius. This step is a deliberate no-op confirmation to avoid over-reaching.)

- [ ] **Step 3: Confirm no shadow token exists**

Grep the file for `shadow`. Expected: no matches. The overhaul uses hairline borders + whitespace only. If a shadow token is ever added later, that violates the spec.

Run: `git grep -n "shadow" src/app/globals.css`
Expected: no output.

- [ ] **Step 4: Build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "tokens: flatten card radius to 10px, add panel radius, keep shadowless"
```

---

## Task 2: Shared primitives — IconCircle + Chip

**Files:**
- Create: `src/components/IconCircle.tsx`
- Create: `src/components/Chip.tsx`

**Interfaces:**
- Produces:
  - `IconCircle({ icon: LucideIcon, tint?: "blue"|"green"|"orange"|"amber"|"muted", size?: "sm"|"md" })` — renders a tinted circle with a centered lucide icon.
  - `Chip({ children, variant?: "neutral"|"skill"|"count" })` — small hairline/soft pill.

- [ ] **Step 1: Create IconCircle**

`src/components/IconCircle.tsx`:

```tsx
import { type LucideIcon } from "lucide-react";

/**
 * Quiet tinted-circle-with-icon primitive. Labels a section; does not decorate.
 * Low-contrast soft tint, thin stroke — the gloss-stripped variant.
 */
const TINT: Record<string, string> = {
  blue: "bg-blue-soft text-blue",
  green: "bg-green-soft text-green",
  orange: "bg-orange-soft text-orange",
  amber: "bg-amber-soft text-amber",
  muted: "bg-bg text-muted",
};

const DIM = { sm: "size-8", md: "size-9" } as const;
const ICON = { sm: 15, md: 17 } as const;

export function IconCircle({
  icon: Icon,
  tint = "blue",
  size = "md",
}: {
  icon: LucideIcon;
  tint?: keyof typeof TINT;
  size?: keyof typeof DIM;
}) {
  return (
    <span
      className={`inline-flex ${DIM[size]} shrink-0 items-center justify-center rounded-full ${TINT[tint]}`}
    >
      <Icon size={ICON[size]} strokeWidth={1.5} />
    </span>
  );
}
```

- [ ] **Step 2: Create Chip**

`src/components/Chip.tsx`:

```tsx
import { type ReactNode } from "react";

/**
 * Small pill. Consolidates the ad-hoc pills across AdCard / quiz.
 *  - neutral: hairline border (contract type, meta)
 *  - skill:   soft-blue (a labelled offer competence — never a raw code)
 *  - count:   muted count badge
 */
const VARIANT: Record<string, string> = {
  neutral: "border border-border text-muted",
  skill: "bg-blue-soft text-text",
  count: "bg-bg text-muted",
};

export function Chip({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANT;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT[variant]}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Verify lucide icon imports resolve (icon-safety gate)**

Create a throwaway check: in a scratch file or the Node REPL, confirm these named icons exist in `lucide-react@^1.21.0`: `Rocket`, `Milestone`, `Mountain`, `CircleSlash`, `Gem`, `Briefcase`, `UserCog`, `Lightbulb`, `FileText`, `ChevronRight`, `ArrowRight`, `ArrowLeft`, `ShieldCheck`, `MapPin`, `CalendarCheck`, `CheckCircle2`.

Run: `node -e "const L=require('lucide-react'); ['Rocket','Milestone','Mountain','CircleSlash','Gem','Briefcase','UserCog','Lightbulb','CheckCircle2'].forEach(n=>console.log(n, n in L ? 'OK' : 'MISSING'))"`
Expected: every line prints `OK`. For any `MISSING`, pick a confirmed-existing near-equivalent (e.g. `Milestone`→`Route`/`GitFork`, `CircleSlash`→`Ban`, `UserCog`→`UserCircle`, `Gem`→`Sparkles`) and record the substitution to use in Tasks 4–7. Do NOT proceed with a missing icon name.

- [ ] **Step 4: Build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0 (unused-import warnings acceptable only if lint passes; these components are consumed in later tasks).

- [ ] **Step 5: Commit**

```bash
git add src/components/IconCircle.tsx src/components/Chip.tsx
git commit -m "components: add IconCircle + Chip primitives (gloss-stripped)"
```

---

## Task 3: SiteHeader — shared branded chrome, real links only

**Files:**
- Create: `src/components/SiteHeader.tsx`

**Interfaces:**
- Consumes: nothing app-specific.
- Produces: `SiteHeader({ variant?: "landing"|"quiz"|"results", right?: ReactNode })` — logo mark + wordmark on the left; `right` slot for a contextual link/chip. NO auth links, NO marketing links that route nowhere.

- [ ] **Step 1: Create SiteHeader**

`src/components/SiteHeader.tsx`:

```tsx
import Link from "next/link";
import { type ReactNode } from "react";

/**
 * Shared branded header. Mockup styling, honest links only — no login/signup,
 * no marketing routes that don't exist. The `right` slot carries the one
 * contextual action a surface needs (e.g. "refaire le quiz", a status chip).
 */
export function SiteHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue font-serif text-sm font-medium text-white">
            T
          </span>
          <span className="font-serif text-lg text-navy">Trajectoire</span>
        </Link>
        {right ? <div className="flex items-center gap-4 text-sm">{right}</div> : (
          <span className="text-sm text-muted">France · données du marché</span>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/SiteHeader.tsx
git commit -m "components: add SiteHeader (branded chrome, honest links only)"
```

---

## Task 4: Landing recomposition (honest content)

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `SiteHeader`, `IconCircle` (Tasks 2–3), `NOT_A_VERDICT` from `@/lib/ui`.
- Produces: recomposed landing — hero + honest method card + 3-pillar band + footer, single real CTA.

- [ ] **Step 1: Rewrite the landing**

Replace the body of `src/app/page.tsx` with the composition below. Uses `SiteHeader`; hero left with the existing serif headline + `NOT_A_VERDICT`; an honest method card on the right (NO fabricated stats — it explains what Trajectoire crosses); a 3-pillar band ("Vos preuves / Le marché / Les issues") with quiet `IconCircle`s; existing footer disclaimer. Single CTA "Commencer l'analyse" → `/quiz`. NO dual front doors, NO auth.

```tsx
import Link from "next/link";
import { ArrowRight, ShieldCheck, ClipboardCheck, BarChart3, Signpost } from "lucide-react";
import { NOT_A_VERDICT } from "@/lib/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { IconCircle } from "@/components/IconCircle";

export default function Landing() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <div className="grid items-start gap-10 md:grid-cols-2">
          <div>
            <p className="mb-5 text-sm font-medium uppercase tracking-wide text-blue">
              Pas un test de personnalité
            </p>
            <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] leading-[1.15] text-navy">
              Un miroir de réalité pour choisir une direction professionnelle en
              France.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-text">
              Trajectoire part de ce que vous avez réellement fait, le croise avec
              les offres réelles du marché, et vous montre des directions — chacune
              appuyée sur des annonces que vous pouvez ouvrir.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 text-text">
              <ShieldCheck size={18} strokeWidth={1.5} className="text-green" />
              <span className="font-medium text-navy">{NOT_A_VERDICT}</span>
            </p>
            <div className="mt-10">
              <Link
                href="/quiz"
                className="group inline-flex items-center gap-2 rounded-card bg-blue px-6 py-3 font-medium text-white transition-colors hover:bg-[#1d4ed8]"
              >
                Commencer l&apos;analyse
                <ArrowRight size={18} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Honest method card — NO invented stats. Explains the crossing. */}
          <aside className="rounded-lg-panel border border-border bg-surface p-6">
            <h2 className="font-serif text-lg text-navy">Comment ça marche</h2>
            <p className="mt-1 text-sm text-muted">
              Un croisement, pas un score. Trois entrées, une lecture honnête.
            </p>
            <ul className="mt-5 space-y-4">
              {[
                { icon: ClipboardCheck, tint: "green" as const, t: "Vos preuves", d: "Ce que vous avez réellement fait — compétences et expériences concrètes." },
                { icon: BarChart3, tint: "blue" as const, t: "Le marché", d: "Les offres d'emploi réelles, croisées avec votre profil." },
                { icon: Signpost, tint: "orange" as const, t: "Les issues", d: "Des directions concrètes, chacune renvoyée à ses annonces." },
              ].map(({ icon, tint, t, d }) => (
                <li key={t} className="flex gap-3">
                  <IconCircle icon={icon} tint={tint} />
                  <div>
                    <p className="text-sm font-medium text-navy">{t}</p>
                    <p className="text-sm text-text">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted">
          Trajectoire ne produit aucun score de compatibilité. Chaque signal
          renvoie aux annonces réelles qui le justifient — vous décidez par
          vous-même.
        </div>
      </footer>
    </div>
  );
}
```

Note: `rounded-lg-panel` isn't a Tailwind class — use `rounded-[12px]` OR add a `--radius-lg-panel` utility. To stay token-driven, replace `rounded-lg-panel` with `rounded-[var(--radius-lg)]`. Confirm `ClipboardCheck`, `BarChart3`, `Signpost` exist per Task 2 Step 3 (substitute if MISSING: `Signpost`→`Milestone`/`Route`, `BarChart3`→`BarChart2`, `ClipboardCheck`→`ClipboardList`).

- [ ] **Step 2: Fix the radius utility**

Replace `rounded-lg-panel` with `rounded-[var(--radius-lg)]` in the file.

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Visual check**

Load `/` in Playwright at desktop (1280w) and mobile (390w). Confirm: two-column on desktop stacking to one on mobile; single CTA; NO stat numbers; header shows no auth links; no console errors. Screenshot both widths.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "landing: mockup composition with honest method card (no invented stats)"
```

---

## Task 5: Quiz stepper restyle (real flow, logic untouched)

**Files:**
- Modify: `src/app/quiz/QuizFlow.tsx`
- Modify: `src/app/quiz/page.tsx` (only to wrap with `SiteHeader` if not already; verify first)

**Interfaces:**
- Consumes: `SiteHeader`. All existing state, gating, config-driven rendering, seed/exclude behavior — UNCHANGED.
- Produces: a numbered-stepper progress header reflecting the REAL flow (Seed → 5 chapters), flat cards, quieter option rows. NO logic change.

- [ ] **Step 1: Read the current quiz page wrapper**

Read `src/app/quiz/page.tsx` to see the current chrome. Add `SiteHeader` with a `right` slot linking home ("Quitter et enregistrer" → `/`) ONLY in the page wrapper, not inside QuizFlow. If the page already has a header, restyle it to use `SiteHeader`.

- [ ] **Step 2: Restyle the progress block into a numbered stepper**

In `QuizFlow.tsx`, replace ONLY the progress `<div className="space-y-2">…</div>` block (currently the chapter position + bar) with a numbered-step header: a row of step dots/numbers (1 Seed complete → chapters 1..5), current chapter emphasized (`bg-blue text-white` circle), completed steps a quiet check, upcoming steps muted. Keep the existing `pct` bar below it. Do NOT touch `answers`, `phase`, `chapter`, gating, or any handler.

Replacement block:

```tsx
{/* Numbered stepper — reflects the REAL flow: Seed (done) → chapters 1..N. */}
<div className="space-y-3">
  <ol className="flex flex-wrap items-center gap-2 text-xs">
    <li className="inline-flex items-center gap-1.5 text-muted">
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-green-soft text-green">
        <CheckCircle2 size={13} strokeWidth={2} />
      </span>
      Départ
    </li>
    {CATEGORIES.map((c, i) => {
      const state = i < chapter ? "done" : i === chapter ? "current" : "todo";
      return (
        <li key={c.id} className="inline-flex items-center gap-1.5">
          <span
            className={[
              "inline-flex size-5 items-center justify-center rounded-full text-[11px] font-medium",
              state === "current"
                ? "bg-blue text-white"
                : state === "done"
                  ? "bg-green-soft text-green"
                  : "bg-bg text-muted",
            ].join(" ")}
          >
            {i + 1}
          </span>
          <span className={state === "current" ? "text-navy" : "text-muted"}>
            Chapitre {i + 1}
          </span>
        </li>
      );
    })}
  </ol>
  <div className="h-1.5 overflow-hidden rounded-full bg-border">
    <div
      className="h-full rounded-full bg-blue transition-all duration-300"
      style={{ width: `${pct}%` }}
    />
  </div>
</div>
```

- [ ] **Step 3: Add the CheckCircle2 import**

Add `CheckCircle2` to the existing lucide import line in `QuizFlow.tsx` (`import { ArrowRight, CheckCircle2 } from "lucide-react";`). Confirm it exists per Task 2 Step 3 (substitute `Check` if MISSING).

- [ ] **Step 4: Build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Visual + behavior check**

Load `/quiz` in Playwright. Confirm: seed step renders; stepper shows Départ + 5 chapters with chapter 1 emphasized after entering chapters; answering advances state; gating still blocks Continue until chapter 1 complete (pick nothing → Continue disabled). No console errors. Screenshot the chapters view.

- [ ] **Step 6: Commit**

```bash
git add src/app/quiz/QuizFlow.tsx src/app/quiz/page.tsx
git commit -m "quiz: numbered stepper reflecting real Seed→5-chapter flow (logic untouched)"
```

---

## Task 6: Results — extract a shared DirectionCard + restyle (no layout change yet)

**Files:**
- Modify: `src/app/results/page.tsx`
- Create: `src/components/DirectionCard.tsx`

**Interfaces:**
- Consumes: `ResultDirection` from `@/lib/engine/results`, `signalStrength` from `@/lib/engine/coverage`, `signalFromCoverage` + `SignalBadge`, `Chip`, `Card`, the existing `coverageFr`/`whyFr` helpers.
- Produces: `DirectionCard({ d, href? })` component exported for reuse by results (Task 7) and detail (Task 8 links back). Moves `coverageFr` and `whyFr` into this file (they are display helpers; keep them co-located with the card). `page.tsx` imports the card + helpers from the new module.

- [ ] **Step 1: Create DirectionCard**

Move `coverageFr`, `whyFr`, and the `DirectionCard` function from `src/app/results/page.tsx` into `src/components/DirectionCard.tsx`, exporting `DirectionCard`, `coverageFr`, `whyFr`. Keep the body IDENTICAL to the current implementation (badge gating on `not_now`, thin-market amber label, bridge gate box, excludedButSurfaced flag) — this task is extraction + restyle only, NOT a content change. Restyle: flat `Card`, tighter spacing (`space-y-3`), title becomes a link when `href` is provided.

Key change to the card header (make title a link when `href` set):

```tsx
{href ? (
  <Link href={href} className="text-lg text-navy hover:text-blue hover:underline">
    {d.title}
  </Link>
) : (
  <h3 className="text-lg text-navy">{d.title}</h3>
)}
```

Add `href?: string` to the props. Everything else (the market block, bridge box, coverage/why lines) is copied verbatim from the current `page.tsx`.

- [ ] **Step 2: Update page.tsx to import from the new module**

In `src/app/results/page.tsx`, remove the local `coverageFr`, `whyFr`, `DirectionCard` definitions and import them: `import { DirectionCard } from "@/components/DirectionCard";`. Pass `href={`/results/direction/${d.romeCode}`}` to each `<DirectionCard>` (the detail route lands in Task 8; the link will 404 until then — acceptable mid-plan, resolved by Task 8).

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Visual regression check**

Load `/results` in Playwright. Confirm the page renders identically in content to the Task 0 "before" screenshot (same buckets, same cards, same pagination) — only spacing/flatness changed. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/results/page.tsx src/components/DirectionCard.tsx
git commit -m "results: extract shared DirectionCard, flatten styling (no content change)"
```

---

## Task 7: Results — hero band + content-weighted bucket layout

**Files:**
- Modify: `src/app/results/page.tsx`

**Interfaces:**
- Consumes: `DirectionCard` (Task 6), `IconCircle` (Task 2), `SiteHeader` (Task 3), `results.byCategory`, `BUCKET_LABEL`, `BUCKET_HINT`, `VISIBLE_CAP` (existing constant), `market` fields.
- Produces: recomposed results layout — SiteHeader + status chip; `apply_now` as a prominent "intersections fortes" hero band (absent if empty); `bridge` full-width stacked; `long_term`+`not_now` as a bottom 2-col row. Pagination + counts preserved.

- [ ] **Step 1: Add SiteHeader + status chip to the header block**

Wrap the page top with `SiteHeader` (right slot: a quiet "Analyse terminée" status chip using `IconCircle`/`CheckCircle2` + `refaire le quiz` link). Change H1 to "Vos directions réalistes". Keep the honest source/dept meta line and `NOT_A_VERDICT`. Do NOT add export/generation-date.

- [ ] **Step 2: Build the hero band renderer for apply_now**

Add a section that renders `results.byCategory.apply_now` ONLY IF non-empty, as a prominent band: `Gem` IconCircle + serif "Vos intersections fortes" + hint "Des recoupements soutenus par des annonces réelles." Then the top `VISIBLE_CAP.apply_now` cards in a comfortable 2-col grid (`md:grid-cols-2`), each a `DirectionCard` with `href` to the detail route. Overflow beyond the cap stays in the existing `<details>` expander. If `apply_now` is empty, render nothing here (honesty guard — no fabrication).

- [ ] **Step 3: Render bridge full-width stacked**

Render `results.byCategory.bridge` as a full-width single-column section (IconCircle `Milestone` + `BUCKET_LABEL.bridge` + count + `BUCKET_HINT.bridge`), `VISIBLE_CAP.bridge` visible + `<details>` "Voir les autres pistes" for the rest. Cards single-column (they carry the bridge gate box — need width).

- [ ] **Step 4: Render long_term + not_now as a bottom 2-col row**

Render `long_term` and `not_now` in a `grid gap-6 md:grid-cols-2` row. Each column: IconCircle (`Mountain` / `CircleSlash`) + label + count + hint, then `VISIBLE_CAP` visible cards + `<details>` for overflow. `not_now` cards already suppress the badge via DirectionCard's existing gating. Collapse to 1 col on mobile.

- [ ] **Step 5: Remove the old uniform `CATEGORY_ORDER.map` loop**

Delete the previous single-loop bucket rendering (replaced by Steps 2–4). Keep the held-back/suppressed `<details>` drawer at the bottom EXACTLY as-is. Keep `VISIBLE_CAP`. `CATEGORY_ORDER` may now be unused — remove it if so (lint will flag).

- [ ] **Step 6: Build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 7: Visual proof across personas**

Seed personas: `npx tsx scripts/seed-persona-sessions.ts` (capture the printed session ids). In Playwright, load `/results?session=<id>` for each persona at desktop + mobile. For each confirm: hero band present iff `apply_now` non-empty (never fabricated); bridge stacked; long_term+not_now 2-col (1-col mobile); NO "Signal fort/moyen/faible" text anywhere; NO % score; not_now cards show no badge; pagination expander works; bucket counts reflect full bucket; held-back drawer intact. Screenshot above-the-fold for each persona/width.

- [ ] **Step 8: Commit**

```bash
git add src/app/results/page.tsx
git commit -m "results: intersections-fortes hero band + content-weighted bucket layout"
```

---

## Task 8: New direction-detail route

**Files:**
- Create: `src/app/results/direction/[romeCode]/page.tsx`

**Interfaces:**
- Consumes: `buildResults` + `P2_INVENTORY` from `@/lib/engine/results`, `getSessionStore` (to honor `?session=`), `getOfferSource` from `@/lib/offers`, `signalStrength`, `signalFromCoverage`, `SignalBadge`, `AdCard`, `Chip`, `IconCircle`, `SiteHeader`, `coverageFr`/`whyFr` (from `@/components/DirectionCard`).
- Produces: `/results/direction/[romeCode]` — mockup-3 structure from REAL fields only. No % score, no compare/export.

- [ ] **Step 1: Scaffold the route reading the same seams as results**

Create the page. Resolve inventory the SAME way `results/page.tsx` does (session → inventory, else `P2_INVENTORY`), call `buildResults(inventory)`, find the direction by `romeCode` across `results.directions`. If not found → `notFound()`. Fetch offers via `getOfferSource().fetchOffers(romeCode, dept)` for the first selected département.

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, UserCog } from "lucide-react";
import { buildResults, P2_INVENTORY } from "@/lib/engine/results";
import { signalStrength } from "@/lib/engine/coverage";
import { getSessionStore } from "@/lib/quiz/session-store";
import { getOfferSource } from "@/lib/offers";
import { signalFromCoverage } from "@/lib/ui";
import { SignalBadge } from "@/components/SignalBadge";
import { AdCard } from "@/components/AdCard";
import { Chip } from "@/components/Chip";
import { IconCircle } from "@/components/IconCircle";
import { SiteHeader } from "@/components/SiteHeader";
import { coverageFr, whyFr } from "@/components/DirectionCard";

export const dynamic = "force-dynamic";

export default async function DirectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ romeCode: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { romeCode } = await params;
  const { session: sessionId } = await searchParams;

  let inventory = P2_INVENTORY;
  if (sessionId) {
    const session = await getSessionStore().get(sessionId);
    if (session) inventory = session.inventory;
  }

  const results = await buildResults(inventory);
  const d = results.directions.find((x) => x.romeCode === romeCode);
  if (!d) notFound();

  const dept =
    (inventory.constraints.departements ?? [inventory.constraints.departement])[0];
  const offers = await getOfferSource().fetchOffers(romeCode, dept);

  const signal = signalFromCoverage(signalStrength(d.matchRaritySum));
  const showSignal = d.bucketResult.category !== "not_now";

  // Real, labelled requirements aggregated across cached offers (never codes).
  const skillLabels = Array.from(
    new Map(
      offers.flatMap((o) => o.competences).map((c) => [c.code, c.libelle]),
    ).values(),
  ).slice(0, 12);

  const backHref = sessionId ? `/results?session=${sessionId}` : "/results";
  const offersHref = `/results/offers/${romeCode}`;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-blue hover:underline">
            <ArrowLeft size={15} strokeWidth={1.5} />
            Retour aux directions
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-serif text-[32px] leading-tight text-navy">{d.title}</h1>
            <p className="text-sm text-muted">{d.romeCode}</p>
            <p className="mt-3 max-w-2xl text-text">{whyFr(d)}</p>
            <p className="text-sm text-muted">{coverageFr(d)}</p>
          </div>
          {showSignal && <SignalBadge signal={signal} />}
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Côté emploi salarié — real market only */}
          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <IconCircle icon={Briefcase} tint="blue" />
              <h2 className="font-serif text-xl text-navy">Côté emploi salarié</h2>
            </div>
            <div className="rounded-card border border-border bg-surface p-5">
              <p className="text-sm text-muted">Offres trouvées dans votre zone</p>
              <p className="mt-1 text-2xl text-navy tabular-nums">{d.market.marketDemand}</p>
            </div>
            {d.market.commonTitles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-navy">Intitulés fréquents</p>
                <p className="mt-1 text-sm text-text">
                  {d.market.commonTitles.slice(0, 4).map((t) => t.intitule).join(" · ")}
                </p>
              </div>
            )}
            {skillLabels.length > 0 && (
              <div>
                <p className="text-sm font-medium text-navy">Exigences détectées</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skillLabels.map((l) => (
                    <Chip key={l} variant="skill">{l}</Chip>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Annonces utilisées pour ce signal — real offers */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl text-navy">Annonces utilisées pour ce signal</h2>
            {offers.length === 0 ? (
              <p className="text-sm text-muted">
                Aucune annonce en cache pour ce métier dans votre département.
              </p>
            ) : (
              <>
                <ul className="space-y-4">
                  {offers.slice(0, 3).map((o) => (
                    <li key={o.id}>
                      <AdCard offer={o} verifieLe={new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} />
                    </li>
                  ))}
                </ul>
                {offers.length > 3 && (
                  <Link href={offersHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue hover:underline">
                    Voir toutes les {offers.length} annonces →
                  </Link>
                )}
              </>
            )}
          </section>
        </div>

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted">
          Prendre du recul : comparez cette direction à vos autres pistes et
          validez-la par des tests terrain. Vous gardez la décision.
        </footer>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify the "Côté autonomie" data source before adding it**

Grep the engine/config for any per-direction autonomy content (`git grep -il "autonomie" src config`). If a real data source exists on the direction/config, add a "Côté autonomie" section using `UserCog` IconCircle reading THAT data. If it is only static boilerplate with no per-direction source, OMIT the section (do not invent freelance advice). Record which path was taken in the commit message.

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Visual proof**

Seed personas (or reuse Task 7 ids). In Playwright, click a result card title on `/results?session=<id>` → confirm it navigates to `/results/direction/<rome>?session=<id>` and renders: title, signal badge (or none for not_now), real offer count, common titles, skill chips (only if labelled offers), 3 AdCards, "voir toutes" link when >3. Confirm NO % score, NO compare/export button. Screenshot.

- [ ] **Step 5: Commit**

```bash
git add "src/app/results/direction/[romeCode]/page.tsx"
git commit -m "detail: new direction route (mockup 3) from real fields; no score/compare/export"
```

---

## Task 9: Final cross-surface proof + engine-lock verification

**Files:** none (verification + proof capture)

- [ ] **Step 1: Confirm no engine/config file changed across the whole branch**

Run: `git diff --name-only c197a2c..HEAD`
Expected: only files under `src/app/`, `src/components/`, `src/lib/ui.ts`, `src/app/globals.css`, and `docs/`. If ANY `src/lib/engine/*` or `config/*` file appears, STOP and revert those changes.

- [ ] **Step 2: Full build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Grep for honesty-firewall violations in the rendered surfaces**

Run: `git grep -nE "Signal (fort|moyen|faible)|compatibilit|Comparer|Exporter|Se connecter|Créer mon compte|812|95 ?%" src/app src/components`
Expected: no matches in rendered JSX (matches only allowed in comments explaining what NOT to do; verify each hit is a comment, not rendered text).

- [ ] **Step 4: End-to-end Playwright pass, both widths**

Drive `/` → `/quiz` (answer chapter 1) → submit → `/results?session=<id>` → click a card → detail → back. At desktop (1280) and mobile (390). Confirm no console errors, no 404s (detail route now exists), honesty invariants hold on every surface. Capture the final screenshot set into the scratchpad proof folder.

- [ ] **Step 5: Commit any proof artifacts (if tracked) or note completion**

```bash
git add docs/
git commit -m "docs: visual overhaul plan + proof notes" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:**
- Honesty firewall (all 10 rows) → Global Constraints + enforced in Tasks 4/7/8 + audited in Task 9 Step 3. ✓
- Section 2 shared system (tokens, SiteHeader, IconCircle, Chip, flat Card) → Tasks 1–3. ✓
- Section 3 results (header, hero band, content-weighted layout, card links, pagination) → Tasks 6–7. ✓
- Section 4 detail route (real fields, autonomy gated, no compare/export) → Task 8. ✓
- Section 5 landing + quiz → Tasks 4–5. ✓
- Engine-lock invariant → Global Constraints + Task 9 Step 1. ✓

**Placeholder scan:** No "TBD/TODO/handle edge cases" — every code step shows full code; the two "verify during implementation" points (icon existence Task 2.3, autonomy source Task 8.2) are explicit checks with defined fallbacks, not vague deferrals. ✓

**Type consistency:** `DirectionCard`/`coverageFr`/`whyFr` defined in Task 6, consumed with matching names in Tasks 7–8. `IconCircle`/`Chip`/`SiteHeader` prop shapes defined in Tasks 2–3, used consistently. `signalFromCoverage`/`signalStrength`/`SignalBadge` used exactly as in current code. ✓

**Note on Card:** the spec mentions a flat `Card` variant; the current `Card` is already shadowless (border-only), so no variant is strictly required — Tasks use `Card` as-is or plain bordered divs. No separate task needed; folded into usage.
