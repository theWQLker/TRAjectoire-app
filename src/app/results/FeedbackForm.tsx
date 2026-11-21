"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { submitFeedback } from "./feedback-actions";

/**
 * Feedback form (V1: capture + store). Client component: tracks one value per
 * question, posts { session, answers } to the submitFeedback server action,
 * which writes server-side with the service-role key.
 *
 * RGPD: anonymous, no PII. The notice sits directly above the submit button
 * (submit = consent, so the notice must be seen at the point of consent).
 *
 * The questions are the instrument — held in one config array so the
 * questionnaire can change without touching the store (jsonb answers). Three
 * types: `scale` (4-point), `choice` (custom options), `text` (OPTIONAL
 * free-text — never gates submission; a foggy person taps and skips essays).
 * Section A = le questionnaire, Section B = les résultats.
 */

type Choice = { value: string; label: string };
type Question =
  | { id: string; kind: "scale" | "choice"; label: string; options: Choice[] }
  | { id: string; kind: "text"; label: string; placeholder?: string };

const SCALE: Choice[] = [
  { value: "pas_du_tout", label: "Pas du tout" },
  { value: "un_peu", label: "Un peu" },
  { value: "oui", label: "Oui" },
  { value: "tout_a_fait", label: "Tout à fait" },
];

const LENGTH: Choice[] = [
  { value: "trop_court", label: "Trop court" },
  { value: "bien", label: "Bien" },
  { value: "un_peu_long", label: "Un peu long" },
  { value: "trop_long", label: "Trop long" },
];

const OUI_NON: Choice[] = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
];

// Section A — le questionnaire. Section B — les résultats.
const SECTIONS: { title: string; questions: Question[] }[] = [
  {
    title: "Le questionnaire",
    questions: [
      { id: "A1", kind: "scale", label: "Le questionnaire vous a-t-il permis de bien vous décrire ?", options: SCALE },
      { id: "A2", kind: "choice", label: "Le questionnaire était…", options: LENGTH },
      { id: "A3", kind: "text", label: "Des questions inutiles ou déroutantes ?", placeholder: "Facultatif" },
      { id: "A4", kind: "text", label: "Quelque chose que vous auriez voulu exprimer, mais qu'on ne vous a pas demandé ?", placeholder: "Facultatif" },
    ],
  },
  {
    title: "Vos résultats",
    questions: [
      { id: "B1", kind: "scale", label: "Est-ce que ces directions vous ressemblent ?", options: SCALE },
      { id: "B2", kind: "text", label: "Qu'est-ce qui vous a surpris, en bien ou en mal ?", placeholder: "Facultatif" },
      { id: "B3", kind: "text", label: "Qu'est-ce qui manquait ou semblait à côté ?", placeholder: "Facultatif" },
      { id: "B4", kind: "choice", label: "Une direction vous a-t-elle donné envie d'explorer ?", options: OUI_NON },
    ],
  },
];

// Submission requires at least one non-empty answer, but NEVER a free-text one —
// so a person who only taps the scales/choices can still submit.
const ALL_QUESTIONS = SECTIONS.flatMap((s) => s.questions);

export function FeedbackForm({ sessionId }: { sessionId: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (status === "done") {
    return (
      <section className="rounded-card border border-border bg-surface p-6">
        <div className="flex items-center gap-2.5 text-green">
          <CheckCircle2 size={18} strokeWidth={2} />
          <p className="text-sm font-medium">Merci, votre retour a bien été enregistré.</p>
        </div>
      </section>
    );
  }

  async function onSubmit(formData: FormData) {
    setStatus("sending");
    setError(null);
    // Drop empty free-text so blank essays aren't stored as "".
    const clean = Object.fromEntries(
      Object.entries(answers).filter(([, v]) => v !== ""),
    );
    formData.set("session", sessionId);
    formData.set("answers", JSON.stringify(clean));
    const res = await submitFeedback(formData);
    if (res.ok) {
      setStatus("done");
    } else {
      setStatus("error");
      setError(res.error);
    }
  }

  const set = (id: string, value: string) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  // A tap-answer (scale/choice) present — free text alone doesn't count, but also
  // doesn't block: this just guards against an all-empty submit.
  const hasAnswer = Object.entries(answers).some(([, v]) => v !== "");

  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2.5">
          <MessageSquare size={18} strokeWidth={1.75} className="text-blue" />
          <h2 className="font-serif text-xl text-navy">Votre avis</h2>
        </div>
        <p className="text-sm text-muted">
          Quelques questions rapides pour améliorer l&apos;outil. Anonyme, et les
          champs libres sont facultatifs.
        </p>
      </div>

      <form action={onSubmit} className="space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {section.title}
            </h3>
            {section.questions.map((q) => (
              <fieldset key={q.id} className="space-y-2">
                <legend className="text-sm text-text">{q.label}</legend>
                {q.kind === "text" ? (
                  <textarea
                    rows={2}
                    placeholder={q.placeholder}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => set(q.id, e.target.value)}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:border-blue focus:outline-none"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set(q.id, opt.value)}
                          aria-pressed={selected}
                          className={
                            "min-h-11 rounded-full border px-4 text-sm transition-colors " +
                            (selected
                              ? "border-blue bg-blue text-white"
                              : "border-border text-text hover:border-blue")
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            ))}
          </div>
        ))}

        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* RGPD notice — placed at the point of consent, right above the button,
            because submit IS the consent and the notice must be seen there. */}
        <div className="space-y-3 border-t border-border pt-5">
          <p className="text-xs text-muted">
            Anonyme : aucune donnée personnelle n&apos;est collectée. En envoyant, vous
            partagez vos réponses pour améliorer l&apos;outil.
          </p>
          <button
            type="submit"
            disabled={status === "sending" || !hasAnswer}
            className="min-h-11 rounded-full bg-navy px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {status === "sending" ? "Envoi…" : "Envoyer mon avis"}
          </button>
        </div>
      </form>
    </section>
  );
}

// Referenced for tests / future analytics — the canonical question ids.
export const FEEDBACK_QUESTION_IDS = ALL_QUESTIONS.map((q) => q.id);
