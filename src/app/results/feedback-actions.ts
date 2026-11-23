"use server";

import { getFeedbackStore, type FeedbackAnswers } from "@/lib/quiz/feedback-store";
import { getSessionStore } from "@/lib/quiz/session-store";

/**
 * Feedback submit (V1: capture + store). Server-side, service-role write —
 * same pattern as submitQuiz → quiz_sessions. The form posts the session id
 * (already in the /results URL) plus the A1-A4/B1-B6 answers (B5/B6 with their « Lequel ? » text) as a JSON string.
 *
 * RGPD: anonymous, no PII. A visible notice next to the form states that
 * submitting shares the answers to improve the tool — the act of submitting is
 * the consent (no separate checkbox for anonymous, non-PII feedback).
 */
export type FeedbackResult = { ok: true } | { ok: false; error: string };

export async function submitFeedback(formData: FormData): Promise<FeedbackResult> {
  const sessionId = formData.get("session");
  const raw = formData.get("answers");

  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return { ok: false, error: "Session manquante." };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "Réponses manquantes." };
  }

  let answers: FeedbackAnswers;
  try {
    answers = JSON.parse(raw) as FeedbackAnswers;
  } catch {
    return { ok: false, error: "Réponses invalides." };
  }

  // Tie feedback to a real session (integrity + interpretability). The FK would
  // reject a bogus id anyway; checking here gives a clean user-facing error.
  const session = await getSessionStore().get(sessionId);
  if (!session) {
    return { ok: false, error: "Session introuvable." };
  }

  await getFeedbackStore().create({ sessionId, answers });
  return { ok: true };
}
