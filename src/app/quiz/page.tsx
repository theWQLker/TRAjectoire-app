import { QuizFlow } from "./QuizFlow";
import { QuitLink } from "./QuitLink";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionStore } from "@/lib/quiz/session-store";
import { withoutRetired, type Answers } from "@/lib/quiz/build-inventory";

export const metadata = { title: "Quiz | Trajectoire" };

/**
 * `?reprendre=<session>`: the quiz again with that session's answers kept,
 * opened where it stopped (./pages.ts startOf): the seed step when no seed was
 * picked (the results page's "Ajouter ce que vous avez déjà fait" link), else
 * the first page with an unanswered question. Submitting makes a new session;
 * the old one is not changed. An unknown id is a fresh quiz. Without it, a
 * draft saved on this device is offered (./draft.ts, client side).
 */
async function resumeAnswers(id: string | undefined): Promise<Answers | undefined> {
  if (!id) return undefined;
  try {
    const answers = (await getSessionStore().get(id))?.answers;
    return answers && withoutRetired(answers);
  } catch {
    return undefined;
  }
}

export default async function QuizPage({ searchParams }: { searchParams: Promise<{ reprendre?: string }> }) {
  const initialAnswers = await resumeAnswers((await searchParams).reprendre);
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader right={<QuitLink />} />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <QuizFlow
          initialAnswers={initialAnswers}
          intro={
            <header className="mb-4 space-y-2">
              <h1 className="font-serif text-[32px] leading-tight text-navy">
                On part de vous, pas des métiers
              </h1>
              <p className="max-w-xl text-text">
                Quelques questions sur votre façon de fonctionner et ce que vous
                savez déjà faire. Pas de bonne réponse : c&apos;est ce qui rend les
                directions utiles.
              </p>
            </header>
          }
        />
      </main>
    </div>
  );
}
