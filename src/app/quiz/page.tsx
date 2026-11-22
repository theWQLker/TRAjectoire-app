import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuizFlow } from "./QuizFlow";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionStore } from "@/lib/quiz/session-store";
import type { Answers } from "@/lib/quiz/build-inventory";

export const metadata = { title: "Quiz | Trajectoire" };

/**
 * `?reprendre=<session>`: the quiz again from its seed step with that
 * session's answers kept (the results page's "Ajouter ce que vous avez déjà
 * fait" link, decision 2026-11-22). Submitting makes a new session; the old
 * one is not changed. An unknown id is a fresh quiz.
 */
async function resumeAnswers(id: string | undefined): Promise<Answers | undefined> {
  if (!id) return undefined;
  try {
    return (await getSessionStore().get(id))?.answers;
  } catch {
    return undefined;
  }
}

export default async function QuizPage({ searchParams }: { searchParams: Promise<{ reprendre?: string }> }) {
  const initialAnswers = await resumeAnswers((await searchParams).reprendre);
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-muted hover:text-navy"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            Quitter et enregistrer
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-2xl px-6 py-12">
        <header className="mb-10 space-y-2">
          <h1 className="font-serif text-[32px] leading-tight text-navy">
            On part de vous, pas des métiers
          </h1>
          <p className="max-w-xl text-text">
            Quelques questions sur votre façon de fonctionner et ce que vous
            savez déjà faire. Pas de bonne réponse : c&apos;est ce qui rend les
            directions utiles.
          </p>
        </header>
        <QuizFlow initialAnswers={initialAnswers} />
      </main>
    </div>
  );
}
