import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getOfferSource } from "@/lib/offers";
import { romeTitles } from "@/lib/rome/appellations";
import { STARTER_ROLES, buildResultsView } from "./directions-view";
import { DirectionsResults } from "./DirectionsResults";
import { FeedbackForm } from "./FeedbackForm";
import { directionHref, loadResults, suppressedLabel } from "./display";
import { NOT_A_VERDICT, coverageDisclosure, marketScopeLine, romeCredit } from "@/lib/ui";

export const dynamic = "force-dynamic"; // reads seams at request time

/** The quiz again from its seed step, with this session's answers kept. */
function seedHref(sessionId: string | undefined): string {
  return sessionId ? `/quiz?reprendre=${encodeURIComponent(sessionId)}` : "/quiz";
}

/**
 * Everything that needs the engine. Streams in after the page shell.
 * Directions first (approved P5 mockup, 2026-11-22); roles are the second
 * layer, one tap away on each role's own page.
 */
async function ResultsBody({ sessionId }: { sessionId: string | undefined }) {
  const loaded = await loadResults(sessionId);
  const { results, fromQuiz } = loaded;
  const [directions, coverage] = await Promise.all([loaded.directions(), getOfferSource().coverage()]);
  const selected = results.inventory.constraints.departements ?? [results.inventory.constraints.departement];
  const starters = directions.directions.flatMap((d) => d.roles.slice(0, STARTER_ROLES).map((m) => m.role.romeCode));
  const titles = await romeTitles(starters, 2);
  const view = buildResultsView({
    directions,
    answers: loaded.answers,
    inventoryCodes: new Set(results.inventory.competenceCodes),
    selected,
    titles: titles.titles,
    roleHref: (code) => directionHref(code, sessionId),
    seedHref: seedHref(fromQuiz ? sessionId : undefined),
  });
  const disclosure = coverageDisclosure(selected, coverage);
  const feedback = fromQuiz && !!sessionId;

  return (
    <>
      <DirectionsResults view={view} feedback={feedback} />

      <div className="mx-auto mt-10 max-w-2xl space-y-4">
        {/* Held-back honesty line: counted, never silently dropped. Text only
            since the bucket pages went (decision 2026-11-22). */}
        {results.suppressed.length > 0 && (
          <p className="text-sm text-text">
            +{suppressedLabel(results.suppressed.length)}, non affichée
            {results.suppressed.length === 1 ? "" : "s"}.
          </p>
        )}

        <div className="space-y-1 text-xs text-muted">
          <p>
            {fromQuiz ? "D'après vos réponses." : "Profil de démonstration."} {marketScopeLine(coverage)}
          </p>
          {disclosure && <p>{disclosure}</p>}
          {titles.titles.size > 0 && <p>{romeCredit(titles.publishedOn)}</p>}
        </div>

        {/* Feedback capture (V1): real quiz sessions only, never the demo profile. */}
        {feedback && (
          <div id="avis" className="mt-12 scroll-mt-6">
            <FeedbackForm sessionId={sessionId!} />
          </div>
        )}
      </div>
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <header className="mx-auto mb-8 max-w-2xl space-y-2">
          <h1 className="font-serif text-[28px] leading-tight text-navy sm:text-[32px]">
            Vos directions réalistes
          </h1>
          <p className="text-sm text-text">
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
