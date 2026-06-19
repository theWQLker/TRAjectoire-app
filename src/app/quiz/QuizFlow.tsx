"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  CATEGORIES,
  LEAN_OPTIONS,
  type Category,
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
  onPick: (optId: string) => void;
}) {
  return (
    <fieldset className="rounded-card border border-border bg-surface p-6">
      <legend className="float-none px-0 text-base text-navy">{qp.prompt}</legend>
      {qp.help && <p className="mt-1 text-xs text-muted">{qp.help}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {qp.options.map((opt) => {
          const isOn = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPick(opt.id)}
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
    </fieldset>
  );
}

function CategoryBlock({
  category,
  index,
  total,
  answers,
  setValue,
}: {
  category: Category;
  index: number;
  total: number;
  answers: Answers;
  setValue: (id: string, value: string) => void;
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Chapitre {index + 1} / {total}
        </p>
        <h2 className="font-serif text-2xl text-navy">{category.title}</h2>
        <p className="max-w-2xl text-text">{category.intro}</p>
        {category.financialOnly && (
          <p className="text-xs italic text-muted">
            Réponses capturées pour le modèle financier (Phase 2). N&apos;influence
            pas tes résultats aujourd&apos;hui.
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
          onPick={(optId) => setValue(qp.id, optId)}
        />
      ))}
    </section>
  );
}

export function QuizFlow() {
  const [answers, setAnswers] = useState<Answers>({});
  // How many categories are revealed. Category 1 always shown; "continue"
  // reveals the next; the user can submit at any revealed point (gating).
  const [revealed, setRevealed] = useState(1);

  function setValue(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const total = CATEGORIES.length;
  const visible = CATEGORIES.slice(0, revealed);
  const firstCategory = CATEGORIES[0];
  // Category 1 is the required minimum: every scene answered before we let the
  // user move on or submit (gating still produces a partial inventory after).
  const firstComplete = firstCategory.scenes.every((s) => answers[s.id]);
  const hasMore = revealed < total;

  const reveal = () => setRevealed((n) => Math.min(n + 1, total));

  return (
    <form action={submitQuiz} className="space-y-12">
      {visible.map((category, i) => (
        <CategoryBlock
          key={category.id}
          category={category}
          index={i}
          total={total}
          answers={answers}
          setValue={setValue}
        />
      ))}

      <input type="hidden" name="answers" value={JSON.stringify(answers)} />

      <div className="space-y-4 border-t border-border pt-6">
        {hasMore ? (
          // Mid-quiz: advancing is the default. "Continuer" is the primary
          // action; finishing early is a quiet link (gating preserved, but not
          // invited — so the quiz reads as 5 chapters, not 5 questions).
          <>
            <button
              type="button"
              disabled={!firstComplete}
              onClick={reveal}
              className="inline-flex items-center gap-2 rounded-card bg-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-40"
            >
              Continuer — chapitre {revealed + 1} / {total}
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
            {firstComplete && (
              <p className="text-xs text-muted">
                Vous pouvez aussi{" "}
                <button
                  type="submit"
                  className="text-blue hover:underline"
                >
                  voir vos résultats maintenant
                </button>{" "}
                — ils s&apos;adaptent à ce que vous avez déjà rempli.
              </p>
            )}
          </>
        ) : (
          // Last chapter: submitting is the primary action.
          <button
            type="submit"
            disabled={!firstComplete}
            className="inline-flex items-center gap-2 rounded-card bg-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-40"
          >
            Voir mes directions
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </form>
  );
}
