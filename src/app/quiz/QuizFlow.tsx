"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  CATEGORIES,
  LEAN_OPTIONS,
  type Scene,
  type QuickPick,
  type Lean,
} from "../../../config/quiz";
import { submitQuiz } from "./actions";

/**
 * Config-driven quiz UI (PRD §5.4 constraint: no scenes/options hardcoded here).
 * Every intro, prompt, relief-option, and quick-pick is read from
 * /config/quiz.ts. This component only renders the structure, tracks one value
 * per scene/quick-pick, and posts answers.
 *
 * Visual layer: DESIGN_SPEC_LIGHT.md surface 2. Logic and questions unchanged —
 * calm option rows, serif chapter header, "category N of 5" progress, the
 * always-visible les-deux / ni-l'un answers, and the preserved skippable-
 * category gating surfaced as a quiet "passer cette section".
 */

type Answers = Record<string, string>;

// les_deux / ni_l_un are the two "neutral" answers — kept always visible but
// quietly set apart from the four directional leans.
const NEUTRAL_LEANS = new Set<Lean>(["les_deux", "ni_l_un"]);

function LeanRow({
  value,
  onPick,
}: {
  value: string | undefined;
  onPick: (lean: Lean) => void;
}) {
  const directional = LEAN_OPTIONS.filter((o) => !NEUTRAL_LEANS.has(o.id));
  const neutral = LEAN_OPTIONS.filter((o) => NEUTRAL_LEANS.has(o.id));

  const pill = (id: Lean, label: string, muted = false) => {
    const isOn = value === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => onPick(id)}
        aria-pressed={isOn}
        className={[
          "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
          isOn
            ? "border-blue bg-blue-soft text-navy"
            : muted
              ? "border-transparent text-muted hover:text-text"
              : "border-border text-text hover:border-blue/40",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {directional.map((o) => pill(o.id, o.label))}
      <span className="mx-1 hidden text-border sm:inline">·</span>
      {neutral.map((o) => pill(o.id, o.label, true))}
    </div>
  );
}

function SceneBlock({
  scene,
  value,
  onPick,
}: {
  scene: Scene;
  value: string | undefined;
  onPick: (lean: Lean) => void;
}) {
  return (
    <fieldset className="rounded-card border border-border bg-surface p-6">
      <legend className="float-none px-0 text-base text-navy">
        {scene.prompt}
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <p className="rounded-lg bg-bg px-3.5 py-2.5 text-sm text-text">
          <span className="mr-1.5 text-muted">A.</span>
          {scene.optionA.label}
        </p>
        <p className="rounded-lg bg-bg px-3.5 py-2.5 text-sm text-text">
          <span className="mr-1.5 text-muted">B.</span>
          {scene.optionB.label}
        </p>
      </div>
      <LeanRow value={value} onPick={onPick} />
    </fieldset>
  );
}

function QuickPickBlock({
  qp,
  value,
  onPick,
}: {
  qp: QuickPick;
  value: string | undefined;
  // For single-select: the chosen option id. For multi: comma-joined ids.
  onPick: (value: string) => void;
}) {
  // Multi stores ids comma-joined; parse to a set for toggling + highlighting.
  const selectedIds = new Set(
    qp.multi ? (value ? value.split(",").filter(Boolean) : []) : value ? [value] : [],
  );

  const toggle = (optId: string) => {
    if (!qp.multi) {
      onPick(optId);
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(optId)) next.delete(optId);
    else next.add(optId);
    // preserve config order so the primary département = first option chosen by order
    const ordered = qp.options.filter((o) => next.has(o.id)).map((o) => o.id);
    onPick(ordered.join(","));
  };

  return (
    <fieldset className="rounded-card border border-border bg-surface p-6">
      <legend className="float-none px-0 text-base text-navy">{qp.prompt}</legend>
      {qp.help && <p className="mt-1 text-xs text-muted">{qp.help}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {qp.options.map((opt) => {
          const isOn = selectedIds.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              aria-pressed={isOn}
              className={[
                "rounded-lg border px-3.5 py-1.5 text-sm transition-colors",
                isOn
                  ? "border-blue bg-blue-soft text-navy"
                  : "border-border text-text hover:border-blue/40",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {qp.multi && (
        <p className="mt-3 text-xs text-muted">
          Plusieurs choix possibles.
          {selectedIds.size > 0 && ` ${selectedIds.size} sélectionné${selectedIds.size > 1 ? "s" : ""}.`}
        </p>
      )}
    </fieldset>
  );
}

// Total answerable units across the whole quiz — for the overall progress line.
const TOTAL_UNITS = CATEGORIES.reduce(
  (n, c) => n + c.scenes.length + c.quickPicks.length,
  0,
);

export function QuizFlow() {
  const [answers, setAnswers] = useState<Answers>({});
  // The slide unit is the CHAPTER (5 slides total). One chapter on screen at a
  // time — all its scenes + quick-picks together — and the user slides between
  // chapters. No per-question stepping; no endless full-quiz scroll.
  const [chapter, setChapter] = useState(0);

  function setValue(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const total = CATEGORIES.length;
  const category = CATEGORIES[chapter];
  const isLastChapter = chapter === total - 1;
  const atVeryStart = chapter === 0;

  // Chapter 1 is the required minimum (gating): every Chapter-1 scene answered
  // before the user may finish. Later chapters stay optional → partial results.
  const firstChapter = CATEGORIES[0];
  const firstComplete = firstChapter.scenes.every((s) => answers[s.id]);

  // How many of THIS chapter's units are answered (a small per-chapter cue).
  const chapterUnits = category.scenes.length + category.quickPicks.length;
  const chapterAnswered =
    category.scenes.filter((s) => answers[s.id]).length +
    category.quickPicks.filter((q) => answers[q.id]).length;

  // Overall progress across the whole quiz.
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
  const pct = Math.round((answeredCount / TOTAL_UNITS) * 100);

  function goNext() {
    if (!isLastChapter) {
      setChapter((c) => c + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function goPrev() {
    if (chapter > 0) {
      setChapter((c) => c - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <form action={submitQuiz} className="space-y-8">
      {/* Progress: chapter position + a measured overall bar (not endless). */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs text-muted">
          <span className="font-medium uppercase tracking-wide">
            Chapitre {chapter + 1} / {total}
          </span>
          <span>
            {chapterAnswered} / {chapterUnits} dans ce chapitre ·{" "}
            {answeredCount} / {TOTAL_UNITS} au total
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-blue transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* One chapter on screen: its intro + all its scenes and quick-picks. */}
      <section key={category.id} className="space-y-5">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl text-navy">{category.title}</h2>
          <p className="max-w-2xl text-text">{category.intro}</p>
          {category.financialOnly && (
            <p className="text-xs italic text-muted">
              Réponses capturées pour le modèle financier (Phase 2).
              N&apos;influence pas tes résultats aujourd&apos;hui.
            </p>
          )}
        </div>

        {category.scenes.map((scene) => (
          <SceneBlock
            key={scene.id}
            scene={scene}
            value={answers[scene.id]}
            onPick={(lean) => setValue(scene.id, lean)}
          />
        ))}
        {category.quickPicks.map((qp) => (
          <QuickPickBlock
            key={qp.id}
            qp={qp}
            value={answers[qp.id]}
            onPick={(val) => setValue(qp.id, val)}
          />
        ))}
      </section>

      <input type="hidden" name="answers" value={JSON.stringify(answers)} />

      {/* Navigation — by CHAPTER. Back/Continue move whole chapters; the last
          chapter submits. Early finish stays a quiet link (gating preserved). */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={atVeryStart}
            className="rounded-card border border-border px-4 py-2.5 text-sm text-navy transition-colors hover:border-blue/40 disabled:opacity-30"
          >
            Retour
          </button>

          {isLastChapter ? (
            <button
              type="submit"
              disabled={!firstComplete}
              className="inline-flex items-center gap-2 rounded-card bg-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-40"
            >
              Voir mes directions
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!firstComplete}
              className="inline-flex items-center gap-2 rounded-card bg-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-40"
            >
              Chapitre suivant — {chapter + 2} / {total}
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Early finish — quiet, only once Chapter 1 is complete and there's
            more left (gating preserved, never the loud default). */}
        {firstComplete && !isLastChapter && (
          <p className="text-xs text-muted">
            Vous pouvez aussi{" "}
            <button type="submit" className="text-blue hover:underline">
              voir vos résultats maintenant
            </button>{" "}
            — ils s&apos;adaptent à ce que vous avez déjà rempli.
          </p>
        )}
      </div>
    </form>
  );
}
