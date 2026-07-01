import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { NOT_A_VERDICT } from "@/lib/ui";

/**
 * Landing — surface 1 (DESIGN_SPEC_LIGHT.md). One calm screen: serif hero, the
 * not-a-verdict line, a single CTA into the real quiz, one disclaimer footer.
 * No invented stats, no marketing sections, no app nav.
 */
export default function Landing() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <span className="font-serif text-lg text-navy">Trajectoire</span>
        <span className="text-sm text-muted">France · données du marché</span>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <p className="mb-5 text-sm font-medium uppercase tracking-wide text-blue">
          Pas un test de personnalité
        </p>
        <h1 className="font-serif text-[clamp(2rem,6vw,2.75rem)] leading-[1.15] text-navy">
          Un miroir de réalité pour choisir une direction professionnelle en
          France.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-text">
          Trajectoire part de ce que vous avez réellement fait, le croise avec
          les offres réelles du marché, et vous montre des directions — chacune
          appuyée sur des annonces que vous pouvez ouvrir.
        </p>

        <p className="mt-6 inline-flex items-center gap-2 text-text">
          <ShieldCheck size={18} strokeWidth={1.5} className="text-green" />
          <span className="font-medium text-navy">{NOT_A_VERDICT}</span>
        </p>

        <div className="mt-10">
          <Link
            href="/quiz"
            className="group inline-flex items-center gap-2 rounded-card bg-blue px-6 py-3 font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Commencer
            <ArrowRight
              size={18}
              strokeWidth={1.5}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted">
          Trajectoire ne produit aucun score de compatibilité. Chaque signal
          renvoie aux annonces réelles qui le justifient — vous décidez par
          vous-même.
        </div>
      </footer>
    </div>
  );
}
