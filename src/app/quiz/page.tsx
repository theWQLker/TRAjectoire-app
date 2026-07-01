import Link from "next/link";
import { QuizFlow } from "./QuizFlow";

export const metadata = { title: "Quiz — Trajectoire" };

export default function QuizPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-10 space-y-2">
        <Link href="/" className="font-serif text-base text-muted hover:text-navy">
          Trajectoire
        </Link>
        <h1 className="font-serif text-[32px] leading-tight text-navy">
          On part de vous, pas des métiers
        </h1>
        <p className="max-w-xl text-text">
          Quelques questions sur votre façon de fonctionner et ce que vous savez
          déjà faire. Pas de bonne réponse — c&apos;est ce qui rend les
          directions utiles.
        </p>
      </header>
      <QuizFlow />
    </main>
  );
}
