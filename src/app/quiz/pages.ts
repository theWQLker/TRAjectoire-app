import { CATEGORIES, type Category, type Lean } from "../../../config/quiz";
import { SEED_ANSWER_KEY } from "@/lib/quiz/build-inventory";

/**
 * Quiz pages (approved quiz-page mockup, docs/design/2026-11-22_quiz-page-mockup.html).
 * Pure: the page layout, what counts as answered, and where a resumed quiz
 * opens. No scoring here: answers keep the six values the engine reads.
 *
 * At most 5 questions per page and a page never crosses a chapter. A chapter's
 * questions (scenes, then its quick-picks) are split into the fewest pages that
 * hold 5, as evenly as they go: 10 → 5 + 5, 11 → 4 + 4 + 3, 8 → 4 + 4.
 */
export const QUESTIONS_PER_PAGE = 5;

export type QuizPage = {
  /** 0-based, across the whole quiz. */
  index: number;
  chapterIndex: number;
  chapter: Category;
  /** First page of its chapter: the chapter intro shows there. */
  firstOfChapter: boolean;
  sceneIds: string[];
  quickPickIds: string[];
};

export function buildPages(categories: Category[] = CATEGORIES): QuizPage[] {
  const pages: QuizPage[] = [];
  categories.forEach((chapter, chapterIndex) => {
    const units = [
      ...chapter.scenes.map((s) => ({ kind: "scene" as const, id: s.id })),
      ...chapter.quickPicks.map((q) => ({ kind: "quickPick" as const, id: q.id })),
    ];
    const count = Math.ceil(units.length / QUESTIONS_PER_PAGE);
    const base = Math.floor(units.length / count);
    const extra = units.length % count;
    let at = 0;
    for (let i = 0; i < count; i++) {
      const slice = units.slice(at, at + base + (i < extra ? 1 : 0));
      at += slice.length;
      pages.push({
        index: pages.length,
        chapterIndex,
        chapter,
        firstOfChapter: i === 0,
        sceneIds: slice.filter((u) => u.kind === "scene").map((u) => u.id),
        quickPickIds: slice.filter((u) => u.kind === "quickPick").map((u) => u.id),
      });
    }
  });
  return pages;
}

export const QUIZ_PAGES = buildPages();

type Answers = Record<string, string>;

export const isAnswered = (answers: Answers, id: string) => !!answers[id];

/**
 * The page's unanswered scenes, in page order: what « Encore N réponses »
 * counts. Quick-picks stay optional, as before: unlike a scene they have no
 * neutral answer (« Ni l'un ni l'autre » posts a value the engine reads as a
 * blank), so requiring them would force a salary floor or a situation.
 */
export function missingOn(answers: Answers, page: QuizPage): string[] {
  return page.sceneIds.filter((id) => !isAnswered(answers, id));
}

/**
 * Where the quiz opens. A fresh quiz, or a resumed one without a seed pick,
 * opens on the seed step (the results page's « Ajouter ce que vous avez déjà
 * fait » link lands there). Otherwise the first page with an unanswered
 * question; the last page when every page is complete.
 */
export function startOf(answers: Answers | undefined): { phase: "seed" } | { phase: "pages"; page: number } {
  if (!answers || !answers[SEED_ANSWER_KEY]) return { phase: "seed" };
  const first = QUIZ_PAGES.find((p) => missingOn(answers, p).length > 0);
  return { phase: "pages", page: first ? first.index : QUIZ_PAGES.length - 1 };
}

/** The intensity buttons on each statement card, mapped 1:1 to the engine's values. */
export const CARD_LEVELS: Record<"a" | "b", { lean: Lean; label: string }[]> = {
  a: [
    { lean: "un_peu_a", label: "Un peu" },
    { lean: "plutot_a", label: "Plutôt" },
  ],
  b: [
    { lean: "un_peu_b", label: "Un peu" },
    { lean: "plutot_b", label: "Plutôt" },
  ],
};

/** The two answers outside the cards, with their existing labels and values. */
export const NEUTRAL_LEVELS: { lean: Lean; label: string }[] = [
  { lean: "les_deux", label: "Les deux" },
  { lean: "ni_l_un", label: "Ni l'un ni l'autre" },
];

/** What a collapsed (answered) scene shows: the chosen statement and its intensity. */
export function collapsedOf(
  lean: string,
  optionA: string,
  optionB: string,
): { statement: string; level: string | null } {
  for (const side of ["a", "b"] as const) {
    const hit = CARD_LEVELS[side].find((l) => l.lean === lean);
    if (hit) return { statement: side === "a" ? optionA : optionB, level: hit.label };
  }
  const neutral = NEUTRAL_LEVELS.find((l) => l.lean === lean);
  return { statement: neutral?.label ?? lean, level: null };
}
