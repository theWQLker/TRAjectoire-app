import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { SignalBadge } from "@/components/SignalBadge";
import { CopyTitles } from "./CopyTitles";
import { COPY, type DirectionCardView, type ResultsView, type RoleRow } from "./directions-view";

/**
 * /results, directions first (approved P5 mockup, 2026-11-22). Renders the
 * view model and nothing else: every string comes from directions-view.ts.
 * Order (FIXED): quoted answers, "N directions pour vous", Autres pistes,
 * feedback prompt. First direction open, the others closed.
 */

function Role({ r, last }: { r: RoleRow; last?: boolean }) {
  return (
    <li className={`border-t border-border py-2.5 ${last ? "pb-1" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <Link href={r.href} className="text-sm text-navy hover:text-blue hover:underline">
          {r.title}
        </Link>
        <span className="shrink-0 pt-0.5">
          <SignalBadge signal={r.signal} />
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted">{r.sector}</p>
      {r.skillLine && <p className="mt-0.5 text-xs text-text">{r.skillLine}</p>}
      {r.excludedButSurfaced && (
        <p className="mt-0.5 text-xs text-orange">
          Vous avez écarté ce métier, mais votre profil y colle fort : on le montre quand même.
        </p>
      )}
    </li>
  );
}

function Tag({ tag }: { tag: NonNullable<DirectionCardView["tag"]> }) {
  const cls = tag.kind === "revelee" ? "bg-revelee-soft text-revelee" : "bg-continuite-soft text-continuite";
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs ${cls}`}>{tag.text}</span>;
}

function DirectionCard({ c }: { c: DirectionCardView }) {
  return (
    <details open={c.open} className="group rounded-lg border border-border bg-surface px-4 py-3">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {c.tag && <Tag tag={c.tag} />}
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg leading-snug text-navy">{c.name}</h3>
          <ChevronDown
            size={18}
            strokeWidth={1.5}
            aria-hidden
            className="mt-1 shrink-0 text-muted transition-transform group-open:rotate-180"
          />
        </div>
        <p className="mt-1 text-sm text-muted group-open:hidden">{c.summary}</p>
      </summary>

      <div className="mt-1 space-y-3">
        {c.why && <p className="text-sm leading-relaxed text-text">{c.why}</p>}

        <div>
          <p className="mb-1 text-xs text-muted">{COPY.rolesTitle}</p>
          <ul>
            {c.roles.map((r, i) => (
              <Role key={r.romeCode} r={r} last={i === c.roles.length - 1 && !c.moreLabel} />
            ))}
          </ul>
          {c.moreLabel && (
            <details className="group/more">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 border-t border-border text-sm text-blue [&::-webkit-details-marker]:hidden">
                <ChevronDown size={15} strokeWidth={1.5} aria-hidden className="transition-transform group-open/more:rotate-180" />
                {c.moreLabel}
              </summary>
              <ul>
                {c.moreRoles.map((r) => (
                  <Role key={r.romeCode} r={r} />
                ))}
              </ul>
            </details>
          )}
          {c.skillNote && <p className="mt-2 text-xs text-text">{c.skillNote}</p>}
        </div>

        {c.copyTitles.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-muted">{COPY.copyTitle}</p>
            <CopyTitles titles={c.copyTitles} label={COPY.copyButton} copiedLabel={COPY.copied} />
          </div>
        )}

        <div>
          <p className="text-sm text-text">{COPY.ftLink} :</p>
          <ul>
            {c.ftLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 text-sm text-blue hover:underline"
                >
                  {l.label}
                  <ExternalLink size={13} strokeWidth={1.5} aria-hidden />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

export function DirectionsResults({ view, feedback }: { view: ResultsView; feedback: boolean }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {view.quotes.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-serif text-xl text-navy">{COPY.quotesTitle}</h2>
          {view.quotes.map((q) => (
            <blockquote key={q} className="border-l-2 border-quote py-0.5 pl-2.5 text-sm leading-relaxed text-navy">
              {q}
            </blockquote>
          ))}
        </section>
      )}
      {view.answersNote && <p className="text-sm leading-relaxed text-text">{view.answersNote}</p>}

      {view.heading && (
        <section className="space-y-2.5">
          <h2 className="text-base font-medium text-navy">{view.heading}</h2>
          {view.directions.map((c) => (
            <DirectionCard key={c.capacity} c={c} />
          ))}
        </section>
      )}

      {view.fallback && (
        <section className="space-y-2">
          <p className="text-text">{view.fallback.text}</p>
          {view.fallback.seedHref && (
            <Link href={view.fallback.seedHref} className="inline-flex min-h-11 items-center text-sm font-medium text-blue hover:underline">
              {COPY.addSeed}
            </Link>
          )}
        </section>
      )}

      {view.others && (
        <details open={view.others.open} className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-medium text-blue [&::-webkit-details-marker]:hidden">
            <ChevronDown size={15} strokeWidth={1.5} aria-hidden className="transition-transform group-open:rotate-180" />
            {view.others.label}
          </summary>
          <ul className="rounded-lg border border-border bg-surface px-4">
            {view.others.rows.map((r, i) => (
              <Role key={r.romeCode} r={r} last={i === view.others!.rows.length - 1} />
            ))}
          </ul>
          {view.others.skillNote && <p className="mt-2 text-xs text-text">{view.others.skillNote}</p>}
          {view.others.faible &&<p className="mt-2 text-xs text-muted">{view.others.faible}</p>}
        </details>
      )}

      {feedback && (
        <div className="rounded-lg bg-continuite-soft p-4">
          <p className="mb-2.5 text-sm leading-relaxed text-navy">{COPY.feedbackPrompt}</p>
          <a
            href="#avis"
            className="inline-flex min-h-11 items-center rounded-lg border border-text/60 bg-surface px-4 text-sm text-navy hover:border-navy"
          >
            {COPY.feedbackButton}
          </a>
        </div>
      )}
    </div>
  );
}
