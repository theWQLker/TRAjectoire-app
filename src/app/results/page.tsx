import { Suspense } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CheckCircle2,
  Gem,
  Milestone,
  Mountain,
  CircleSlash,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import type { ResultDirection } from "@/lib/engine/results";
import { type Category } from "../../../config/buckets";
import { strengthBand } from "@/lib/engine/coverage";
import { SiteHeader } from "@/components/SiteHeader";
import { IconCircle } from "@/components/IconCircle";
import { DirectionCard } from "@/components/DirectionCard";
import { FeedbackForm } from "./FeedbackForm";
import {
  BAND_ORDER,
  BUCKET_ORDER,
  bandCounts,
  bucketHref,
  directionHref,
  firstViewCodes,
  loadResults,
  orderBucket,
} from "./display";
import {
  BUCKET_LABEL,
  BUCKET_HINT,
  NOT_A_VERDICT,
  coverageDisclosure,
  STRENGTH_BAND_LABEL,
  STRENGTH_BAND_HINT,
} from "@/lib/ui";

export const dynamic = "force-dynamic"; // reads seams at request time

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

// apply_now keeps its hero wording; the other buckets use the shared labels.
const BUCKET_TITLE: Record<Category, string> = {
  ...BUCKET_LABEL,
  apply_now: "Vos intersections fortes",
};
const BUCKET_SUBTITLE: Record<Category, string> = {
  ...BUCKET_HINT,
  apply_now: "Des recoupements soutenus par des annonces réelles.",
};

function moreLabel(hidden: number, shown: number): string {
  if (shown === 0) return hidden === 1 ? "Voir la piste" : `Voir les ${hidden} pistes`;
  return hidden === 1 ? "Voir 1 autre piste" : `Voir les ${hidden} autres pistes`;
}

/**
 * One bucket: header with its full count, the first-view directions that fall
 * in it (bridge: grouped by strength tier), and a counted link to the rest.
 * The rest is not in this HTML: it renders on /results/pistes/[bucket].
 */
function BucketBlock({
  cat,
  group,
  shown,
  sessionId,
}: {
  cat: Category;
  group: ResultDirection[];
  shown: Set<string>;
  sessionId: string | undefined;
}) {
  if (group.length === 0) return null;
  const visible = orderBucket(cat, group).filter((d) => shown.has(d.romeCode));
  const hidden = group.length - visible.length;
  const card = (d: ResultDirection) => (
    <DirectionCard key={d.romeCode} d={d} href={directionHref(d.romeCode, sessionId)} />
  );

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <IconCircle icon={BUCKET_ICON[cat]} tint={BUCKET_TINT[cat]} size="sm" />
          <h2 className="font-serif text-2xl text-navy">
            {BUCKET_TITLE[cat]}{" "}
            <span className="font-sans text-sm text-muted">({group.length})</span>
          </h2>
        </div>
        <p className="text-sm text-muted">{BUCKET_SUBTITLE[cat]}</p>
        {cat === "bridge" && (
          <p className="text-xs text-muted">
            {bandCounts(group)
              .map(({ band, count }) => `${STRENGTH_BAND_LABEL[band]} (${count})`)
              .join(" · ")}
          </p>
        )}
      </div>

      {cat === "bridge" ? (
        BAND_ORDER.map((band) => {
          const rows = visible.filter((d) => strengthBand(d.matchRaritySum) === band);
          if (rows.length === 0) return null;
          return (
            <div key={band} className="space-y-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-navy">{STRENGTH_BAND_LABEL[band]}</h3>
                <p className="text-xs text-muted">{STRENGTH_BAND_HINT[band]}</p>
              </div>
              <div className="space-y-4">{rows.map(card)}</div>
            </div>
          );
        })
      ) : (
        <div className={cat === "apply_now" ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
          {visible.map(card)}
        </div>
      )}

      {hidden > 0 && (
        <Link
          href={bucketHref(cat, sessionId)}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-blue hover:underline"
        >
          <ChevronRight size={15} strokeWidth={1.5} />
          {moreLabel(hidden, visible.length)}
        </Link>
      )}
    </section>
  );
}

/** Everything that needs the engine. Streams in after the page shell. */
async function ResultsBody({ sessionId }: { sessionId: string | undefined }) {
  const { results, fromQuiz } = await loadResults(sessionId);
  const selectedDepts = results.inventory.constraints.departements ?? [
    results.inventory.constraints.departement,
  ];
  const depts = selectedDepts.join(" · ");
  // Honest coverage line when the user picked zones the offer snapshot lacks.
  const deptDisclosure = coverageDisclosure(selectedDepts);
  const shown = firstViewCodes(results.directions);
  const { byCategory } = results;

  return (
    <>
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-2 rounded-card border border-border bg-surface p-4">
        <div className="space-y-1">
          <p className="text-sm text-text">
            <span className="text-muted">
              {fromQuiz ? "D'après vos réponses" : "Profil de démonstration"}
            </span>{" "}
            · dépt {depts}
          </p>
          {deptDisclosure && <p className="text-xs text-muted">{deptDisclosure}</p>}
        </div>
      </div>

      {/* Hero and workhorse buckets, full width, in semantic order. */}
      {BUCKET_ORDER.filter((c) => c === "apply_now" || c === "bridge").map((cat) =>
        byCategory[cat].length > 0 ? (
          <div key={cat} className="mb-12">
            <BucketBlock cat={cat} group={byCategory[cat]} shown={shown} sessionId={sessionId} />
          </div>
        ) : null,
      )}

      {/* Long terme + Pas maintenant: lighter buckets, bottom 2-col row. */}
      {(byCategory.long_term.length > 0 || byCategory.not_now.length > 0) && (
        <div className="mb-10 grid gap-8 md:grid-cols-2">
          <BucketBlock cat="long_term" group={byCategory.long_term} shown={shown} sessionId={sessionId} />
          <BucketBlock cat="not_now" group={byCategory.not_now} shown={shown} sessionId={sessionId} />
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
            {results.suppressed.map((s) => `${s.title} (${s.romeCode})`).join(" · ")}
          </p>
        </details>
      )}

      {/* Feedback capture (V1) — only when this is a real quiz session (we need
          a real session_id to tie feedback to). Never on the demo profile. */}
      {fromQuiz && sessionId && (
        <div className="mt-12">
          <FeedbackForm sessionId={sessionId} />
        </div>
      )}
    </>
  );
}

/** Shown while the engine runs. States what is happening, promises no time. */
function ResultsPending() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <p className="inline-flex items-center gap-2 text-sm text-text">
        <LoaderCircle size={16} strokeWidth={1.75} className="animate-spin text-blue motion-reduce:animate-none" />
        Analyse en cours…
      </p>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 rounded-card border border-border bg-surface" aria-hidden />
      ))}
    </div>
  );
}

async function HeaderStatus({ sessionId }: { sessionId: string | undefined }) {
  const { fromQuiz } = await loadResults(sessionId);
  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-green">
        <CheckCircle2 size={13} strokeWidth={2} />
        Analyse terminée
      </span>
      <Link href="/quiz" className="text-blue hover:underline">
        {fromQuiz ? "refaire le quiz" : "faire le quiz"}
      </Link>
    </>
  );
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <Suspense fallback={<span className="text-xs text-muted">Analyse en cours…</span>}>
            <HeaderStatus sessionId={sessionId} />
          </Suspense>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <header className="mb-6 space-y-3">
          <h1 className="font-serif text-[32px] leading-tight text-navy">
            Vos directions réalistes
          </h1>
          <p className="max-w-2xl text-text">
            Croisement de vos preuves et des offres réelles du marché pour
            identifier des directions crédibles. {NOT_A_VERDICT}
          </p>
        </header>

        <Suspense fallback={<ResultsPending />}>
          <ResultsBody sessionId={sessionId} />
        </Suspense>
      </main>
    </div>
  );
}
