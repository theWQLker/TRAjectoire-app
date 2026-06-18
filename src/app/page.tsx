import Link from "next/link";
import {
  FileText,
  TrendingUp,
  DoorOpen,
  ArrowRight,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { BottomNav } from "@/components/BottomNav";
import {
  LIVE_STATS,
  LIVE_DATA_REFRESHED,
  TRUST_CARDS,
  ENTRY_DOORS,
  NOT_A_VERDICT,
} from "@/lib/mock";

const TRUST_ICONS: Record<string, LucideIcon> = {
  FileText,
  TrendingUp,
  DoorOpen,
};

export default function Landing() {
  return (
    <div className="min-h-full pb-20 md:pb-0">
      {/* Quiet wordmark — no chrome, lets the hero breathe */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-serif text-lg text-navy">Trajectoire</span>
        <span className="text-sm text-muted">France · données du marché</span>
      </header>

      <main className="mx-auto max-w-5xl space-y-20 px-6 pb-24 pt-8 md:pt-16">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="max-w-3xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-wide text-blue">
            Pas un test de personnalité
          </p>
          <h1 className="font-serif text-[clamp(2rem,6vw,2.75rem)] leading-[1.15] text-navy">
            Un miroir de réalité pour choisir une direction professionnelle en
            France.
          </h1>
          <p className="max-w-2xl text-lg text-text">
            Trajectoire croise vos preuves et vos contraintes avec les offres
            réelles du marché de l&apos;emploi — pour révéler des directions
            réalistes, datées et vérifiables.
          </p>
          <p className="inline-flex items-center gap-2 text-text">
            <ShieldCheck size={18} strokeWidth={1.5} className="text-green" />
            <span className="font-medium text-navy">{NOT_A_VERDICT}</span>
          </p>
        </section>

        {/* ── Live-data stat panel ─────────────────────────────────────── */}
        <section>
          <Card className="md:p-8">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base text-navy">Ce que Trajectoire observe</h2>
              <span className="text-xs text-muted">
                Données vérifiées le {LIVE_DATA_REFRESHED}
              </span>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {LIVE_STATS.map((s) => (
                <StatTile key={s.id} value={s.value} label={s.label} />
              ))}
            </div>
          </Card>
        </section>

        {/* ── 3 trust cards ────────────────────────────────────────────── */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl text-navy">
            Trois choses, croisées honnêtement
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {TRUST_CARDS.map((c) => {
              const Icon = TRUST_ICONS[c.icon];
              return (
                <Card key={c.id} className="space-y-3">
                  <Icon size={22} strokeWidth={1.5} className="text-blue" />
                  <h3 className="text-base text-navy">{c.title}</h3>
                  <p className="text-sm text-text">{c.body}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── Two doors ────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl text-navy">
            Vous partez plutôt de quoi&nbsp;?
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ENTRY_DOORS.map((door) => (
              <Link key={door.id} href={door.href} className="group block">
                <Card interactive className="flex h-full flex-col gap-3">
                  <h3 className="text-lg text-navy">{door.title}</h3>
                  <p className="flex-1 text-sm text-text">{door.body}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted">{door.microcopy}</span>
                    <ArrowRight
                      size={18}
                      strokeWidth={1.5}
                      className="text-blue transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* ── Disclaimer footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl space-y-2 px-6 py-10 text-sm text-muted">
          <p className="text-text">{NOT_A_VERDICT}</p>
          <p>
            Trajectoire ne produit aucun score de compatibilité. Chaque signal
            renvoie aux annonces réelles qui le justifient — vous pouvez les
            ouvrir, les dater, et décider par vous-même.
          </p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
