/**
 * The quiz draft kept on this device (round 3, 2026-11-23): « Quitter et
 * enregistrer » has to be true. Every answer is saved to localStorage as it is
 * given; returning to /quiz offers to continue; submitting clears it. Nothing
 * leaves the device until the user submits.
 *
 * When storage is unavailable (private mode, blocked site data, quota) the quit
 * link reads « Quitter » and warns before answers are lost. Every access is
 * wrapped: a failing storage never breaks the quiz.
 *
 * A small store tells the quit link (in the page header, outside QuizFlow)
 * whether storage works and whether anything has been answered.
 */
import { currentAnswers, type Answers } from "@/lib/quiz/build-inventory";

export const DRAFT_KEY = "trajectoire.quiz-draft.v1";

export const QUIT_SAVE = "Quitter et enregistrer";
export const QUIT_ONLY = "Quitter";
export const QUIT_WARNING =
  "Vos réponses ne peuvent pas être enregistrées sur cet appareil. Si vous quittez, elles seront perdues.";

/** True when this browser lets the page write to localStorage. */
export function storageWorks(): boolean {
  try {
    const probe = `${DRAFT_KEY}.probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** The saved draft's answers, or null (none, unreadable, or storage blocked). */
export function loadDraft(): Answers | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { answers?: unknown };
    if (!parsed || typeof parsed.answers !== "object" || parsed.answers === null) return null;
    const answers = currentAnswers(
      Object.fromEntries(Object.entries(parsed.answers).filter(([, v]) => typeof v === "string")) as Answers,
    );
    return Object.keys(answers).length ? answers : null;
  } catch {
    return null;
  }
}

/** Save the answers as the draft. False when storage refused the write. */
export function saveDraft(answers: Answers): boolean {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, savedAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // nothing to clear when storage is blocked
  }
}

// --- what the quit link needs to know ----------------------------------------
export type DraftState = { storage: boolean | null; answered: number };
const SERVER_STATE: DraftState = { storage: null, answered: 0 };
let state: DraftState = SERVER_STATE;
const listeners = new Set<() => void>();

export function setDraftState(patch: Partial<DraftState>): void {
  const next = { ...state, ...patch };
  if (next.storage === state.storage && next.answered === state.answered) return;
  state = next;
  for (const l of listeners) l();
}
export function subscribeDraftState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const getDraftState = (): DraftState => state;
export const getServerDraftState = (): DraftState => SERVER_STATE;
