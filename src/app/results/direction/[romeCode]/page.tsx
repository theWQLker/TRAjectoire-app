import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase } from "lucide-react";
import { buildResults, P2_INVENTORY } from "@/lib/engine/results";
import { signalStrength } from "@/lib/engine/coverage";
import { getSessionStore } from "@/lib/quiz/session-store";
import { getOfferSource } from "@/lib/offers";
import { signalFromCoverage } from "@/lib/ui";
import { SignalBadge } from "@/components/SignalBadge";
import { AdCard } from "@/components/AdCard";
import { Chip } from "@/components/Chip";
import { IconCircle } from "@/components/IconCircle";
import { SiteHeader } from "@/components/SiteHeader";
import { coverageFr, whyFr } from "@/components/DirectionCard";

export const dynamic = "force-dynamic";

/**
 * Direction detail (mockup 3), composed from REAL fields only. Reads the SAME
 * seams as /results (session → inventory → buildResults) + the offer source.
 *
 * Honesty firewall: NO compatibility % (signal badge only), NO compare/export,
 * skill chips ONLY from labelled offer competences (never raw codes). "Côté
 * autonomie" is intentionally omitted — the only autonomy copy in config is a
 * generic, non-per-direction cost note, so attaching it here would be invented.
 */
export default async function DirectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ romeCode: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { romeCode } = await params;
  const { session: sessionId } = await searchParams;

  let inventory = P2_INVENTORY;
  if (sessionId) {
    const session = await getSessionStore().get(sessionId);
    if (session) inventory = session.inventory;
  }

  const results = await buildResults(inventory);
  const d = results.directions.find((x) => x.romeCode === romeCode);
  if (!d) notFound();

  const dept = (
    inventory.constraints.departements ?? [inventory.constraints.departement]
  )[0];
  const offers = await getOfferSource().fetchOffers(romeCode, dept);

  const signal = signalFromCoverage(signalStrength(d.matchRaritySum));
  const showSignal = d.bucketResult.category !== "not_now";

  // Real, labelled requirements aggregated across cached offers (never codes).
  const skillLabels = Array.from(
    new Map(
      offers.flatMap((o) => o.competences).map((c) => [c.code, c.libelle]),
    ).values(),
  ).slice(0, 12);

  const verifieLe = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const backHref = sessionId ? `/results?session=${sessionId}` : "/results";
  const offersHref = `/results/offers/${romeCode}`;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-blue hover:underline"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            Retour aux directions
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-1">
            <h1 className="font-serif text-[32px] leading-tight text-navy">
              {d.title}
            </h1>
            <p className="text-sm text-muted">{d.romeCode}</p>
            <p className="mt-3 text-text">{whyFr(d)}</p>
            <p className="text-sm text-muted">{coverageFr(d)}</p>
            {d.excludedButSurfaced && (
              <p className="mt-2 text-sm text-orange">
                Vous avez écarté ce métier, mais votre profil y colle fort — on le
                montre quand même.
              </p>
            )}
          </div>
          {showSignal && <SignalBadge signal={signal} />}
        </header>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Côté emploi salarié — real market only, no invented totals. */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <IconCircle icon={Briefcase} tint="blue" size="sm" />
              <h2 className="font-serif text-xl text-navy">Côté emploi salarié</h2>
            </div>

            {d.thinMarketSeeded ? (
              <div className="rounded-card border border-amber-soft bg-amber-soft/40 px-4 py-3">
                <p className="text-sm text-orange">
                  Vous avez les compétences, mais peu ou pas d&apos;annonces sur
                  France Travail pour ce métier — le recrutement s&apos;y fait
                  souvent autrement.
                </p>
              </div>
            ) : (
              <div className="rounded-card border border-border bg-surface p-5">
                <p className="text-sm text-muted">
                  Offres trouvées dans votre zone
                </p>
                <p className="mt-1 text-2xl text-navy tabular-nums">
                  {d.market.marketDemand}
                </p>
              </div>
            )}

            {d.market.commonTitles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-navy">Intitulés fréquents</p>
                <p className="mt-1 text-sm text-text">
                  {d.market.commonTitles
                    .slice(0, 4)
                    .map((t) => t.intitule)
                    .join(" · ")}
                </p>
              </div>
            )}

            {skillLabels.length > 0 && (
              <div>
                <p className="text-sm font-medium text-navy">Exigences détectées</p>
                <p className="mt-0.5 text-xs text-muted">
                  Relevées dans les annonces réelles de ce métier.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skillLabels.map((l) => (
                    <Chip key={l} variant="skill">
                      {l}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Annonces utilisées pour ce signal — real offers via AdCard. */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl text-navy">
              Annonces utilisées pour ce signal
            </h2>
            {offers.length === 0 ? (
              <p className="text-sm text-muted">
                Aucune annonce en cache pour ce métier dans votre département.
              </p>
            ) : (
              <>
                <ul className="space-y-4">
                  {offers.slice(0, 3).map((o) => (
                    <li key={o.id}>
                      <AdCard offer={o} verifieLe={verifieLe} />
                    </li>
                  ))}
                </ul>
                {offers.length > 3 && (
                  <Link
                    href={offersHref}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue hover:underline"
                  >
                    Voir toutes les {offers.length} annonces →
                  </Link>
                )}
              </>
            )}
          </section>
        </div>

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted">
          Prendre du recul : comparez cette direction à vos autres pistes et
          validez-la par des tests terrain. Vous gardez la décision.
        </footer>
      </main>
    </div>
  );
}
