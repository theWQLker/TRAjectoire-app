import { Suspense } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CheckCircle2,
  Gem,
  Milestone,
  Mountain,
  CircleSlash,
  CircleDashed,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import type { ResultDirection } from "@/lib/engine/results";
import { type Category } from "../../../config/buckets";
import { strengthBand } from "@/lib/engine/coverage";
import { SiteHeader } from "@/components/SiteHeader";
import { IconCircle } from "@/components/IconCircle";
import { DirectionCard } from "@/components/DirectionCard";
import { getOfferSource } from "@/lib/offers";
import { FeedbackForm } from "./FeedbackForm";
import {
  BAND_ORDER,
  BUCKET_ORDER,
  bandCounts,
  bucketHref,
  directionHref,
  offersHref,
  firstViewCodes,
  loadResults,
  orderBucket,
  suppressedHref,
  suppressedLabel,
  sortForDisplay,
  UNVERIFIED,
  UNVERIFIED_HINT,
  UNVERIFIED_LABEL,
  type Group,
} from "./display";
import {
  BUCKET_LABEL,
  BUCKET_HINT,
  NOT_A_VERDICT,
  coverageDisclosure,
  marketScopeLine,
  zeroAdsLabel,
  STRENGTH_BAND_LABEL,
  STRENGTH_BAND_HINT,
  deptName,
} from "@/lib/ui";

export const dynamic = "force-dynamic"; // reads seams at request time

const BUCKET_ICON: Record<Group, LucideIcon> = {
  [UNVERIFIED]: CircleDashed,
  apply_now: Gem,
  bridge: Milestone,
  long_term: Mountain,
  not_now: CircleSlash,
};

const BUCKET_TINT: Record<Group, "green" | "blue" | "orange" | "muted"> = {
  [UNVERIFIED]: "muted",
  apply_now: "green",
  bridge: "blue",
  long_term: "orange",
  not_now: "muted",
};

// apply_now keeps its hero wording; the other buckets use the shared labels.
const BUCKET_TITLE: Record<Group, string> = {
  ...BUCKET_LABEL,
  [UNVERIFIED]: UNVERIFIED_LABEL,
  apply_now: "Vos intersections fortes",
};
const BUCKET_SUBTITLE: Record<Group, string> = {
  ...BUCKET_HINT,
  [UNVERIFIED]: UNVERIFIED_HINT,
  apply_now: "Des recoupements soutenus par des annonces réelles.",
};

function moreLabel(hidden: number, shown: number): string {
  if (shown === 0) return hidden === 1 ? "Voir la piste" : `Voir les ${hidden} pistes`;
  return hidden === 1 ? "Voir 1 autre piste" : `Voir les ${hidden} autres pistes`;
}

/**
 * One group (a bucket, or "non vérifié"): header with its full count, the
 * first-view directions that fall in it (bridge: grouped by strength tier), and
 * a counted link to the rest. The rest is not in this HTML: it renders on
 * /results/pistes/[bucket].
 */
function BucketBlock({
  cat,
  group,
  shown,
  sessionId,
  zeroLabel,
}: {
  cat: Group;
  group: ResultDirection[];
  shown: Set<string>;
  sessionId: string | undefined;
  zeroLabel: string;
}) {
  if (group.length === 0) return null;
  const ordered = cat === UNVERIFIED ? sortForDisplay(group) : orderBucket(cat, group);
  const visible = ordered.filter((d) => shown.has(d.romeCode));
  const hidden = group.length - visible.length;
  const card = (d: ResultDirection) => (
    <DirectionCard
      key={d.romeCode}
      d={d}
      href={directionHref(d.romeCode, sessionId)}
      offersHref={offersHref(d.romeCode, sessionId)}
      zeroLabel={zeroLabel}
    />
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
  const depts = selectedDepts.map(deptName).join(" · ");
  // What the offer figures cover, read from the offers themselves (P0-C), and
  // a plain line when the user picked zones we have no offers for.
  const coverage = await getOfferSource().coverage();
  const scope = marketScopeLine(coverage);
  const deptDisclosure = coverageDisclosure(selectedDepts, coverage);
  const zeroLabel = zeroAdsLabel(selectedDepts, coverage);
  const shown = firstViewCodes(results.directions, results.unverified);
  const { byCategory } = results;
  const block = (cat: Category) => (
    <BucketBlock cat={cat} group={byCategory[cat]} shown={shown} sessionId={sessionId} zeroLabel={zeroLabel} />
  );

  return (
    <>
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-2 rounded-card border border-border bg-surface p-4">
        <div className="space-y-1">
          <p className="text-sm text-text">
            <span className="text-muted">
              {fromQuiz ? "D'après vos réponses" : "Profil de démonstration"}
            </span>{" "}
            · {depts}
          </p>
          <p className="text-xs text-muted">{scope}</p>
          {deptDisclosure && <p className="text-xs text-muted">{deptDisclosure}</p>}
        </div>
      </div>

      {/* Nothing to show at all: say why. */}
      {results.directions.length === 0 && results.unverified.length === 0 && (
        <p className="mb-10 max-w-2xl text-text">
          {results.suppressed.length > 0
            ? "Aucune piste n'a d'annonce dans notre relevé pour votre zone. Les métiers repérés depuis vos réponses restent consultables ci-dessous."
            : "Aucune piste à afficher : vos réponses ne partagent encore aucune compétence avec un métier."}
        </p>
      )}

      {/* Hero and workhorse buckets, full width, in semantic order. */}
      {BUCKET_ORDER.filter((c) => c === "apply_now" || c === "bridge").map((cat) =>
        byCategory[cat].length > 0 ? (
          <div key={cat} className="mb-12">
            {block(cat)}
          </div>
        ) : null,
      )}

      {/* Long terme + Pas maintenant: lighter buckets, bottom 2-col row. */}
      {(byCategory.long_term.length > 0 || byCategory.not_now.length > 0) && (
        <div className="mb-10 grid gap-8 md:grid-cols-2">
          {block("long_term")}
          {block("not_now")}
        </div>
      )}

      {/* Non vérifié (decision 2026-11-20): never hidden for lack of data in a
          chosen zone; one group, by skill fit, after the evidence-backed buckets. */}
      {results.unverified.length > 0 && (
        <div className="mb-10">
          <BucketBlock cat={UNVERIFIED} group={results.unverified} shown={shown} sessionId={sessionId} zeroLabel={zeroLabel} />
        </div>
      )}

      {/* P0-B: the way to the feedback form, after every first-view card (all groups). */}
      {fromQuiz && sessionId && (
        <div className="mb-12 flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-4">
          <p className="text-sm text-text">Ces pistes vous parlent ? Dites-le-nous en 2 minutes.</p>
          <a
            href="#avis"
            className="inline-flex min-h-11 items-center rounded-card bg-blue px-4 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            Donner mon avis
          </a>
        </div>
      )}

      {/* Held-back honesty line — counted here, never silently dropped (LIGHT
          spec). The titles live on /results/pistes/ecartees, not in this payload. */}
      {results.suppressed.length > 0 && (
        <Link
          href={suppressedHref(sessionId)}
          className="flex min-h-11 items-center gap-1.5 rounded-card border border-border bg-bg p-4 text-sm text-text hover:border-blue/40"
        >
          <ChevronRight size={15} strokeWidth={1.5} className="text-muted" />
          +{suppressedLabel(results.suppressed.length)} — non affichée
          {results.suppressed.length === 1 ? "" : "s"}
        </Link>
      )}

      {/* Feedback capture (V1) — only when this is a real quiz session (we need
          a real session_id to tie feedback to). Never on the demo profile. */}
      {fromQuiz && sessionId && (
        <div id="avis" className="mt-12 scroll-mt-6">
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
      <Link href="/quiz" className="inline-flex min-h-11 items-center text-blue hover:underline">
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
