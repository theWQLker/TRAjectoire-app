import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuizFlow } from "./QuizFlow";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Quiz — Trajectoire" };

export default function QuizPage() {
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
            Choisissez les domaines où vous avez déjà de l&apos;expérience,
            affinez par sous-domaine. On en déduit vos compétences, puis on les
            croise avec les offres réelles du marché pour ouvrir des directions
            crédibles.
          </p>
        </header>
        <QuizFlow />
      </main>
    </div>
  );
}
