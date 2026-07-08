import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  ClipboardCheck,
  BarChart3,
  Signpost,
} from "lucide-react";
import { NOT_A_VERDICT } from "@/lib/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { IconCircle } from "@/components/IconCircle";

/**
 * Landing — surface 1. Mockup composition (hero + method card + footer), honest
 * content only: NO invented market stats, NO auth, NO dual front doors (the
 * domain-exploration path doesn't exist). One real CTA into the quiz. The method
 * card explains the CROSSING, it makes no numeric claim.
 */
export default function Landing() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <div className="grid items-start gap-10 md:grid-cols-2">
          {/* Hero */}
          <div>
            <p className="mb-5 text-sm font-medium uppercase tracking-wide text-blue">
              Pas un test de personnalité
            </p>
            <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] leading-[1.15] text-navy">
              Un miroir de réalité pour choisir une direction professionnelle en
              France.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-text">
              Trajectoire part de ce que vous avez réellement fait, le croise
              avec les offres réelles du marché, et vous montre des directions —
              chacune appuyée sur des annonces que vous pouvez ouvrir.
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
                Commencer l&apos;analyse
                <ArrowRight
                  size={18}
                  strokeWidth={1.5}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>

          {/* Honest method card — explains the crossing, no numeric claim. */}
          <aside className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <h2 className="font-serif text-lg text-navy">Comment ça marche</h2>
            <p className="mt-1 text-sm text-muted">
              Un croisement, pas un score. Trois entrées, une lecture honnête.
            </p>
            <ul className="mt-5 space-y-4">
              {(
                [
                  {
                    icon: ClipboardCheck,
                    tint: "green",
                    t: "Vos preuves",
                    d: "Ce que vous avez réellement fait — compétences et expériences concrètes.",
                  },
                  {
                    icon: BarChart3,
                    tint: "blue",
                    t: "Le marché",
                    d: "Les offres d'emploi réelles, croisées avec votre profil.",
                  },
                  {
                    icon: Signpost,
                    tint: "orange",
                    t: "Les issues",
                    d: "Des directions concrètes, chacune renvoyée à ses annonces.",
                  },
                ] as const
              ).map(({ icon, tint, t, d }) => (
                <li key={t} className="flex gap-3">
                  <IconCircle icon={icon} tint={tint} />
                  <div>
                    <p className="text-sm font-medium text-navy">{t}</p>
                    <p className="text-sm text-text">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted">
          Trajectoire ne produit aucun score de compatibilité. Chaque signal
          renvoie aux annonces réelles qui le justifient — vous décidez par
          vous-même.
        </div>
      </footer>
    </div>
  );
}
