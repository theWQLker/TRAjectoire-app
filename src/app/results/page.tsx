import Link from "next/link";
import {
  ChevronRight,
  CheckCircle2,
  Gem,
  Milestone,
  Mountain,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";
import { buildResults, P2_INVENTORY, type ResultDirection } from "@/lib/engine/results";
import { getSessionStore } from "@/lib/quiz/session-store";
import { type Category } from "../../../config/buckets";
import { strengthBand, type StrengthBand } from "@/lib/engine/coverage";
import { SiteHeader } from "@/components/SiteHeader";
import { IconCircle } from "@/components/IconCircle";
import { DirectionCard } from "@/components/DirectionCard";
import {
  BUCKET_LABEL,
  BUCKET_HINT,
  NOT_A_VERDICT,
  coverageDisclosure,
  STRENGTH_BAND_LABEL,
  STRENGTH_BAND_HINT,
} from "@/lib/ui";

export const dynamic = "force-dynamic"; // reads seams at request time

// Cards shown before the "Voir les autres pistes" expander, per bucket. The rest
// stay in the DOM behind a native <details> — nothing is filtered.
const VISIBLE_CAP: Record<Category, number> = {
  apply_now: 6,
  bridge: 5,
  long_term: 4,
  not_now: 3,
};

const BUCKET_ICON: Record<Category, LucideIcon> = {
  apply_now: Gem,
  bridge: Milestone,
  long_term: Mountain,
  not_now: CircleSlash,
};

const BUCKET_TINT: Record<Category, "green" | "blue" | "orange" | "muted"> = {
  apply_now: "green",
  bridge: "blue",
  long_term: "orange",
  not_now: "muted",
};

/**
 * Visible-order sort (spec 2026-07-23): the wildcard (if this group holds it) is
 * pinned FIRST so it's always above the bucket's cap; everything else by
 * coherenceRank desc, coverage tiebreak. Engine order (rankScore) is untouched;
 * this reshapes only what the visible cap slices from.
 */
function sortForDisplay(group: ResultDirection[]): ResultDirection[] {
  return [...group].sort(
    (a, b) =>
      Number(b.isWildcard ?? false) - Number(a.isWildcard ?? false) ||
      b.coherenceRank - a.coherenceRank ||
      b.coverage - a.coverage,
  );
}

/** Native expander for the cards beyond a bucket's visible cap. */
function Overflow({
  hidden,
  hrefFor,
}: {
  hidden: ResultDirection[];
  hrefFor: (d: ResultDirection) => string;
}) {
  if (hidden.length === 0) return null;
  return (
    <details className="group space-y-4">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-blue hover:underline">
        <ChevronRight
          size={15}
          strokeWidth={1.5}
          className="transition-transform group-open:rotate-90"
        />
        Voir les autres pistes
      </summary>
      <div className="mt-4 space-y-4">
        {hidden.map((d) => (
          <DirectionCard key={d.romeCode} d={d} href={hrefFor(d)} />
        ))}
      </div>
    </details>
  );
}

/** A standard bucket section: header + capped cards + overflow expander. */
function BucketSection({
  cat,
  group,
  hrefFor,
}: {
  cat: Category;
  group: ResultDirection[];
  hrefFor: (d: ResultDirection) => string;
}) {
  if (group.length === 0) return null;
  const sorted = sortForDisplay(group);
  const cap = VISIBLE_CAP[cat];
  const visible = sorted.slice(0, cap);
  const hidden = sorted.slice(cap);
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <IconCircle icon={BUCKET_ICON[cat]} tint={BUCKET_TINT[cat]} size="sm" />
          <h2 className="font-serif text-2xl text-navy">
            {BUCKET_LABEL[cat]}{" "}
            <span className="font-sans text-sm text-muted">({group.length})</span>
          </h2>
        </div>
        <p className="text-sm text-muted">{BUCKET_HINT[cat]}</p>
      </div>
      <div className="space-y-4">
        {visible.map((d) => (
          <DirectionCard key={d.romeCode} d={d} href={hrefFor(d)} />
        ))}
      </div>
      <Overflow hidden={hidden} hrefFor={hrefFor} />
    </section>
  );
}

// The three LED tiers (strong→weak) shown open; `large` (faible tail) goes behind
// the "explorer tout" expander. Order is fixed strongest-first.
const LED_BANDS: StrengthBand[] = ["tres_forte", "forte", "pertinente"];

/**
 * The bridge bucket, reframed as STRENGTH TIERS (editor-not-censor). Every
 * direction is grouped by strengthBand(matchRaritySum) — a backed strength claim,
 * NOT a count. The three strong tiers lead (each internally sorted by
 * coherenceRank, wildcard pinned); the broad faible tail is one expand away,
 * labelled by its true honest breadth. Nothing trimmed, nothing hidden — the
 * per-tier counts are emergent from where the real strength boundaries land.
 */
function BridgeTiers({
  group,
  hrefFor,
}: {
  group: ResultDirection[];
  hrefFor: (d: ResultDirection) => string;
}) {
  if (group.length === 0) return null;

  const byBand = new Map<StrengthBand, ResultDirection[]>();
  for (const d of group) {
    const band = strengthBand(d.matchRaritySum);
    let rows = byBand.get(band);
    if (!rows) {
      rows = [];
      byBand.set(band, rows);
    }
    rows.push(d);
  }

  const tail = sortForDisplay(byBand.get("large") ?? []);

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <IconCircle icon={BUCKET_ICON.bridge} tint={BUCKET_TINT.bridge} size="sm" />
          <h2 className="font-serif text-2xl text-navy">
            {BUCKET_LABEL.bridge}{" "}
            <span className="font-sans text-sm text-muted">({group.length})</span>
          </h2>
        </div>
        <p className="text-sm text-muted">{BUCKET_HINT.bridge}</p>
      </div>

      {/* Strong tiers, strongest-first — what deserves attention now. */}
      {LED_BANDS.map((band) => {
        const rows = sortForDisplay(byBand.get(band) ?? []);
        if (rows.length === 0) return null;
        return (
          <div key={band} className="space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-navy">
                {STRENGTH_BAND_LABEL[band]}{" "}
                <span className="font-normal text-muted">({rows.length})</span>
              </h3>
              <p className="text-xs text-muted">{STRENGTH_BAND_HINT[band]}</p>
            </div>
            <div className="space-y-4">
              {rows.map((d) => (
                <DirectionCard key={d.romeCode} d={d} href={hrefFor(d)} />
              ))}
            </div>
          </div>
        );
      })}

      {/* The honest broad tail — reframed as exhaustiveness, one expand away. */}
      {tail.length > 0 && (
        <details className="group space-y-4">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-blue hover:underline">
            <ChevronRight
              size={15}
              strokeWidth={1.5}
              className="transition-transform group-open:rotate-90"
            />
            {STRENGTH_BAND_LABEL.large} ({tail.length})
          </summary>
          <p className="mt-2 text-xs text-muted">{STRENGTH_BAND_HINT.large}</p>
          <div className="mt-4 space-y-4">
            {tail.map((d) => (
              <DirectionCard key={d.romeCode} d={d} href={hrefFor(d)} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;

  let inventory = P2_INVENTORY;
  let fromQuiz = false;
  if (sessionId) {
    const session = await getSessionStore().get(sessionId);
    if (session) {
      inventory = session.inventory;
      fromQuiz = true;
    }
  }

  const results = await buildResults(inventory);
  const selectedDepts = results.inventory.constraints.departements ?? [
    results.inventory.constraints.departement,
  ];
  const depts = selectedDepts.join(" · ");
  // Honest coverage line when the user picked zones the offer snapshot lacks.
  const deptDisclosure = coverageDisclosure(selectedDepts);

  // Detail-route href, preserving the session so the detail page re-derives the
  // same inventory.
  const hrefFor = (d: ResultDirection) =>
    sessionId
      ? `/results/direction/${d.romeCode}?session=${sessionId}`
      : `/results/direction/${d.romeCode}`;

  const applyNow = sortForDisplay(results.byCategory.apply_now);
  const heroVisible = applyNow.slice(0, VISIBLE_CAP.apply_now);
  const heroHidden = applyNow.slice(VISIBLE_CAP.apply_now);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-green">
              <CheckCircle2 size={13} strokeWidth={2} />
              Analyse terminée
            </span>
            <Link href="/quiz" className="text-blue hover:underline">
              {fromQuiz ? "refaire le quiz" : "faire le quiz"}
            </Link>
          </>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <header className="mb-10 space-y-3">
          <h1 className="font-serif text-[32px] leading-tight text-navy">
            Vos directions réalistes
          </h1>
          <p className="max-w-2xl text-text">
            Croisement de vos preuves et des offres réelles du marché pour
            identifier des directions crédibles. {NOT_A_VERDICT}
          </p>
          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-card border border-border bg-surface p-4">
            <div className="space-y-1">
              <p className="text-sm text-text">
                <span className="text-muted">
                  {fromQuiz ? "D'après vos réponses" : "Profil de démonstration"}
                </span>{" "}
                · dépt {depts}
              </p>
              {deptDisclosure && (
                <p className="text-xs text-muted">{deptDisclosure}</p>
              )}
            </div>
          </div>
        </header>

        {/* ── Vos intersections fortes (apply_now) — the hero band. Rendered ONLY
            if apply_now is non-empty; never fabricated to fill slots. ─────────── */}
        {applyNow.length > 0 && (
          <section className="mb-12 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <IconCircle icon={Gem} tint="green" size="sm" />
                <h2 className="font-serif text-2xl text-navy">
                  Vos intersections fortes{" "}
                  <span className="font-sans text-sm text-muted">
                    ({results.byCategory.apply_now.length})
                  </span>
                </h2>
              </div>
              <p className="text-sm text-muted">
                Des recoupements soutenus par des annonces réelles.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {heroVisible.map((d) => (
                <DirectionCard key={d.romeCode} d={d} href={hrefFor(d)} />
              ))}
            </div>
            <Overflow hidden={heroHidden} hrefFor={hrefFor} />
          </section>
        )}

        {/* ── Bridge — the workhorse, reframed as STRENGTH TIERS (editor, not
            censor): strong tiers lead, the broad honest tail is one expand away.
            Full-width stacked (bridge gate box needs the width). ─────────────── */}
        <div className="mb-12">
          <BridgeTiers group={results.byCategory.bridge} hrefFor={hrefFor} />
        </div>

        {/* ── Long terme + Pas maintenant — lighter buckets, bottom 2-col row.
            Smaller + lower placement truthfully encodes lower importance. ─────── */}
        {(results.byCategory.long_term.length > 0 ||
          results.byCategory.not_now.length > 0) && (
          <div className="mb-10 grid gap-8 md:grid-cols-2">
            <BucketSection cat="long_term" group={results.byCategory.long_term} hrefFor={hrefFor} />
            <BucketSection cat="not_now" group={results.byCategory.not_now} hrefFor={hrefFor} />
          </div>
        )}

        {/* Held-back honesty line — collapsed, never silently dropped (LIGHT spec) */}
        {results.suppressed.length > 0 && (
          <details className="group rounded-card border border-border bg-bg p-4">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-text">
              <ChevronRight
                size={15}
                strokeWidth={1.5}
                className="text-muted transition-transform group-open:rotate-90"
              />
              +{results.suppressed.length} piste
              {results.suppressed.length === 1 ? "" : "s"} plus large
              {results.suppressed.length === 1 ? "" : "s"}, sans compétence partagée
              — non affichée{results.suppressed.length === 1 ? "" : "s"}
            </summary>
            <p className="mt-3 text-xs text-muted">
              Ces métiers partageaient un intérêt mais aucune annonce vivante dans
              le{(results.inventory.constraints.departements?.length ?? 1) > 1 ? "s" : ""} dépt{" "}
              {depts} — des coïncidences, pas des directions :{" "}
              {results.suppressed
                .map((s) => `${s.title} (${s.romeCode})`)
                .join(" · ")}
            </p>
          </details>
        )}
      </main>
    </div>
  );
}
