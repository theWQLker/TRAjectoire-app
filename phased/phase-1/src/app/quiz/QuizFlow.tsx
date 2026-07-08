"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { SEED_ANSWER_KEY, EXCLUDE_ANSWER_KEY } from "@/lib/quiz/build-inventory";
import { SeedStep } from "./SeedStep";
import { submitQuiz } from "./actions";

/**
 * Phase 1 quiz UI: seed front door → submit. No cognitive chapters (Phase 1 is
 * the full engine MINUS the quiz). SeedStep keeps the full 14 families + depth
 * sub-choices + exclusion controls; this shell only carries the picks/exclusions
 * in the hidden answers field and submits.
 */

type Answers = Record<string, string>;

export function QuizFlow() {
  const [answers, setAnswers] = useState<Answers>({});
  const setValue = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const hasPick = Boolean(answers[SEED_ANSWER_KEY]);

  return (
    <form action={submitQuiz} className="space-y-8">
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />
      <SeedStep
        value={answers[SEED_ANSWER_KEY]}
        onChange={(tokens) => setValue(SEED_ANSWER_KEY, tokens)}
        exclusionsValue={answers[EXCLUDE_ANSWER_KEY]}
        onExclusionsChange={(tokens) => setValue(EXCLUDE_ANSWER_KEY, tokens)}
      />
      <div className="border-t border-border pt-6">
        <button
          type="submit"
          disabled={!hasPick}
          className="inline-flex items-center gap-2 rounded-card bg-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-40"
        >
          Voir mes directions
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </form>
  );
}
