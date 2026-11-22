"use server";

import { redirect } from "next/navigation";
import { buildInventory, type Answers } from "@/lib/quiz/build-inventory";
import { getSessionStore } from "@/lib/quiz/session-store";

/**
 * Quiz submit (quiz-full-spec → PRD §6.1 → §10). Wiring spine: answers →
 * inventory → persisted quiz_sessions row → redirect to /results?session=<id>.
 *
 * Answers arrive as a JSON-encoded `Record<questionId, value>` from the client
 * form (a single hidden field): scene ids map to a Lean, quick-pick ids to a
 * selected option id. The config is the single source of question structure —
 * the action knows nothing hardcoded about questions. Shape routing is retired
 * (quiz-full-spec): the five categories run linearly for everyone.
 *
 * Category gating: the user may submit after any category. buildInventory reads
 * only answered scenes/quick-picks → partial inventory → partial /results.
 */
export async function submitQuiz(formData: FormData): Promise<void> {
  const raw = formData.get("answers");
  if (typeof raw !== "string") throw new Error("Quiz answers missing.");

  let answers: Answers;
  try {
    answers = JSON.parse(raw) as Answers;
  } catch {
    throw new Error("Quiz answers were not valid JSON.");
  }

  // An unknown key (e.g. a retired scene still in an open tab) is logged by
  // name on the server and otherwise ignored, as before.
  const inventory = buildInventory(answers, { unknownKeys: "warn" });

  const session = await getSessionStore().create({
    answers,
    inventory,
    constraints: inventory.constraints,
  });

  redirect(`/results?session=${session.id}`);
}
