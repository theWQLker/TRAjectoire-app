"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { CATEGORIES, SCENES_BY_ID, QUICK_PICKS_BY_ID, type Scene, type QuickPick, type Lean } from "../../../config/quiz";
import { SEED_ANSWER_KEY, EXCLUDE_ANSWER_KEY } from "@/lib/quiz/build-inventory";
import { SeedStep } from "./SeedStep";
import { submitQuiz } from "./actions";
import { CARD_LEVELS, NEUTRAL_LEVELS, QUIZ_PAGES, collapsedOf, missingOn, startOf } from "./pages";

/**
 * Config-driven quiz UI (PRD §5.4: no scene or option hardcoded here; every
 * prompt and statement comes from /config/quiz.ts).
 *
 * Layout: approved quiz-page mockup (docs/design/2026-11-22_quiz-page-mockup.html).
 * The seed step first, then pages of at most 5 questions that never cross a
 * chapter (./pages.ts). One scene open at a time; each statement is its own
 * card with its intensity buttons inside, so one tap gives side and intensity.
 * The buttons map 1:1 to the six values the engine already reads; nothing here
 * scores. Answered scenes collapse to one line; the next one opens.
 */

type Answers = Record<string, string>;

/**
 * Submit feedback (P0-A): the action saves the session, then /results streams.
 * Reads the form's pending state, so a second click can't post twice.
 */
function SubmitDirections() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-card bg-blue px-5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle size={16} strokeWidth={1.75} className="animate-spin motion-reduce:animate-none" />
          Analyse en cours…
        </>
      ) : (
        <>
          Voir mes directions
          <ArrowRight size={16} strokeWidth={1.5} />
        </>
      )}
    </button>
  );
}

function SubmitEarly() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="text-blue hover:underline disabled:no-underline disabled:opacity-60">
      {pending ? "analyse en cours…" : "voir vos résultats maintenant"}
    </button>
  );
}

/** Announces the pending submit to screen readers. */
function PendingNotice() {
  const { pending } = useFormStatus();
  return (
    <p role="status" aria-live="polite" className="text-xs text-muted">
      {pending ? "Analyse en cours…" : ""}
    </p>
  );
}

/** One statement, its own card, its intensity buttons inside it. */
function StatementCard({
  label,
  side,
  value,
  onPick,
}: {
  label: string;
  side: "a" | "b";
  value: string | undefined;
  onPick: (lean: Lean) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="mb-2.5 text-base leading-relaxed text-navy">{label}</p>
      <div className="flex gap-2">
        {CARD_LEVELS[side].map((l) => {
          const on = value === l.lean;
          return (
            <button
              key={l.lean}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(l.lean)}
              className={[
                "min-h-11 flex-1 rounded-lg border text-[15px] transition-colors",
                on ? "border-blue bg-blue-soft text-navy" : "border-muted/60 text-navy hover:border-blue/50",
              ].join(" ")}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpenScene({ scene, value, onPick }: { scene: Scene; value: string | undefined; onPick: (lean: Lean) => void }) {
  const ref = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  const [both, neither] = NEUTRAL_LEVELS;
  const neutral = (l: typeof both, align: string) => (
    <button
      type="button"
      aria-pressed={value === l.lean}
      onClick={() => onPick(l.lean)}
      className={[
        "inline-flex min-h-11 items-center rounded-lg px-2 text-sm transition-colors",
        align,
        value === l.lean ? "bg-blue-soft text-navy" : "text-muted hover:text-navy",
      ].join(" ")}
    >
      {l.label}
    </button>
  );
  return (
    <fieldset ref={ref} className="scroll-mt-4 space-y-2">
      <legend className="float-none mb-2.5 px-0 font-serif text-[19px] leading-snug text-navy">{scene.prompt}</legend>
      <StatementCard label={scene.optionA.label} side="a" value={value} onPick={onPick} />
      <StatementCard label={scene.optionB.label} side="b" value={value} onPick={onPick} />
      <div className="flex justify-between">
        {neutral(both, "-ml-2")}
        {neutral(neither, "-mr-2")}
      </div>
    </fieldset>
  );
}

/** An answered scene, folded to one line. Tap to change it. */
function CollapsedScene({ scene, value, onOpen }: { scene: Scene; value: string; onOpen: () => void }) {
  const c = collapsedOf(value, scene.optionA.label, scene.optionB.label);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${scene.prompt} Réponse : ${c.statement}${c.level ? `, ${c.level}` : ""}. Modifier`}
      className="flex min-h-11 w-full items-center gap-2 border-b border-border py-2.5 text-left text-sm text-text"
    >
      <Check size={15} strokeWidth={2.5} className="shrink-0 text-green" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{c.statement}</span>
      {c.level && <span className="shrink-0 text-[13px] text-muted">{c.level}</span>}
    </button>
  );
}

/** An upcoming scene: a dimmed placeholder (tap opens it). */
function UpcomingScene({ n, onOpen }: { n: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-11 w-full items-center rounded-xl border border-dashed border-border px-3 text-left text-sm text-muted/70"
    >
      Question {n}
    </button>
  );
}

function QuickPickBlock({
  qp,
  value,
  onPick,
}: {
  qp: QuickPick;
  value: string | undefined;
  // Single-select: the chosen option id. Multi: comma-joined ids.
  onPick: (value: string) => void;
}) {
  const selectedIds = new Set(qp.multi ? (value ? value.split(",").filter(Boolean) : []) : value ? [value] : []);
  const toggle = (optId: string) => {
    if (!qp.multi) {
      onPick(optId);
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(optId)) next.delete(optId);
    else next.add(optId);
    // config order, so the primary département is the first in config order
    onPick(qp.options.filter((o) => next.has(o.id)).map((o) => o.id).join(","));
  };
  return (
    <fieldset className="space-y-2.5">
      <legend className="float-none mb-1 px-0 font-serif text-[19px] leading-snug text-navy">{qp.prompt}</legend>
      {qp.help && <p className="text-sm text-muted">{qp.help}</p>}
      <div className="flex flex-wrap gap-2">
        {qp.options.map((opt) => {
          const on = selectedIds.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              aria-pressed={on}
              className={[
                "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3.5 text-[15px] transition-colors",
                on ? "border-blue bg-blue-soft text-navy" : "border-muted/60 text-navy hover:border-blue/50",
              ].join(" ")}
            >
              {on && <Check size={14} strokeWidth={2.5} className="text-blue" aria-hidden />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const TOTAL_PAGES = QUIZ_PAGES.length;
const FIRST_CHAPTER_SCENES = CATEGORIES[0].scenes.map((s) => s.id);

export function QuizFlow({ initialAnswers, intro }: { initialAnswers?: Answers; intro?: ReactNode } = {}) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const start = startOf(initialAnswers);
  const [phase, setPhase] = useState<"seed" | "pages">(start.phase);
  const [pageIndex, setPageIndex] = useState(start.phase === "pages" ? start.page : 0);
  const page = QUIZ_PAGES[pageIndex];
  // One scene open at a time: the first unanswered one on the page, or none.
  const firstOpen = (a: Answers, i: number) => QUIZ_PAGES[i].sceneIds.find((id) => !a[id]) ?? null;
  const [openId, setOpenId] = useState<string | null>(() => firstOpen(initialAnswers ?? {}, pageIndex));

  function setValue(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function answerScene(id: string, lean: Lean) {
    const next = { ...answers, [id]: lean };
    setAnswers(next);
    // The next unanswered scene opens: after this one first, then any earlier gap.
    const ids = page.sceneIds;
    const after = ids.slice(ids.indexOf(id) + 1).find((x) => !next[x]);
    setOpenId(after ?? ids.find((x) => !next[x]) ?? null);
  }

  function goTo(i: number) {
    setPageIndex(i);
    setOpenId(firstOpen(answers, i));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enterPages() {
    setPhase("pages");
    goTo(pageIndex);
  }

  const missing = missingOn(answers, page);
  const isLast = pageIndex === TOTAL_PAGES - 1;
  const firstComplete = FIRST_CHAPTER_SCENES.every((id) => answers[id]);

  /** "Encore N réponses": opens the first unanswered question and brings it into view. */
  function showMissing() {
    const id = missing[0];
    if (!id) return;
    if (SCENES_BY_ID[id]) setOpenId(id);
    document.getElementById(`q-${id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return (
    <form action={submitQuiz} className="space-y-6">
      {/* Every answer rides in this one hidden field (seed picks included). */}
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />

      {phase === "seed" && (
        <>
          {intro}
          <SeedStep
            value={answers[SEED_ANSWER_KEY]}
            onChange={(tokens) => setValue(SEED_ANSWER_KEY, tokens)}
            exclusionsValue={answers[EXCLUDE_ANSWER_KEY]}
            onExclusionsChange={(tokens) => setValue(EXCLUDE_ANSWER_KEY, tokens)}
            onContinue={enterPages}
            onSkip={() => {
              // skip = no seed pick → seed-less, identical to the pre-seed flow.
              setValue(SEED_ANSWER_KEY, "");
              setValue(EXCLUDE_ANSWER_KEY, "");
              enterPages();
            }}
          />
        </>
      )}

      {phase === "pages" && (
        <section key={page.index} className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px] text-muted">
              <h1 className="text-[13px] font-normal">
                <span className="text-muted">{page.chapter.title}</span>
              </h1>
              <span className="shrink-0">
                Page {page.index + 1} sur {TOTAL_PAGES}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-border" aria-hidden>
              <div
                className="h-full rounded-full bg-navy transition-all duration-300"
                style={{ width: `${Math.round(((page.index + 1) / TOTAL_PAGES) * 100)}%` }}
              />
            </div>
          </div>

          {page.firstOfChapter && (
            <div className="space-y-1">
              <p className="text-sm text-text">{page.chapter.intro}</p>
              {page.chapter.financialOnly && (
                <p className="text-xs text-muted">
                  Deux réponses comptent déjà : si vous indiquez un salaire minimum bas ou un effort de formation limité,
                  on ne repousse pas les métiers sous votre niveau de diplôme. Les autres ne changent pas vos résultats.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            {page.sceneIds.map((id, i) => {
              const scene = SCENES_BY_ID[id];
              const value = answers[id];
              return (
                <div key={id} id={`q-${id}`} className="scroll-mt-4">
                  {openId === id ? (
                    <OpenScene scene={scene} value={value} onPick={(lean) => answerScene(id, lean)} />
                  ) : value ? (
                    <CollapsedScene scene={scene} value={value} onOpen={() => setOpenId(id)} />
                  ) : (
                    <UpcomingScene n={i + 1} onOpen={() => setOpenId(id)} />
                  )}
                </div>
              );
            })}
          </div>

          {page.quickPickIds.map((id) => (
            <div key={id} id={`q-${id}`} className="scroll-mt-4 pt-2">
              <QuickPickBlock qp={QUICK_PICKS_BY_ID[id]} value={answers[id]} onPick={(v) => setValue(id, v)} />
            </div>
          ))}

          <div className="space-y-4 pt-2">
            <PendingNotice />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => (pageIndex === 0 ? setPhase("seed") : goTo(pageIndex - 1))}
                className="inline-flex min-h-11 items-center text-sm text-blue hover:underline"
              >
                Page précédente
              </button>
              {missing.length > 0 ? (
                <button
                  type="button"
                  onClick={showMissing}
                  className="inline-flex min-h-11 items-center text-sm text-muted hover:text-navy"
                >
                  Encore {missing.length} réponse{missing.length > 1 ? "s" : ""}
                </button>
              ) : isLast ? (
                <SubmitDirections />
              ) : (
                <button
                  type="button"
                  onClick={() => goTo(pageIndex + 1)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-card bg-blue px-5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
                >
                  Continuer
                  <ArrowRight size={16} strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Early finish: quiet, once the first chapter is complete (gating kept). */}
            {firstComplete && !isLast && (
              <p className="text-xs text-muted">
                Vous pouvez aussi <SubmitEarly />&nbsp;: ils s&apos;adaptent à ce que vous avez déjà rempli.
              </p>
            )}
            <p className="text-xs text-muted">
              Vos réponses sont enregistrées sans nom ni e-mail, pour que le lien vers vos résultats reste valable et pour
              améliorer les pistes proposées.
            </p>
          </div>
        </section>
      )}
    </form>
  );
}
