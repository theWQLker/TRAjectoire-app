import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOfferSource, type Offer } from "@/lib/offers";
import { AdCard } from "@/components/AdCard";
import { SiteHeader } from "@/components/SiteHeader";
import { coverageDisclosure, marketScopeLine } from "@/lib/ui";
import { directionHref, findDirection, loadResults } from "../../display";

export const dynamic = "force-dynamic";

/**
 * Receipts — the real offers behind a direction's signal (LIGHT spec surface 3).
 * Reached from a direction's "voir les annonces". Same session computation as
 * /results, so the ads listed are exactly the ones the direction was counted on:
 * every département the user chose, newest first.
 *
 * Query params (kept from the engine's requirement-subset links):
 *   competence=<code>  filter to offers that DO list it
 *   exclude=<code>     filter to offers that do NOT list it (the escape hatch)
 *
 * On mobile this is the full-screen sheet the spec calls for — it's its own
 * route, so it already fills the viewport.
 */
export default async function ReceiptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ romeCode: string }>;
  searchParams: Promise<{ session?: string; competence?: string; exclude?: string; label?: string }>;
}) {
  const { romeCode } = await params;
  const { session: sessionId, competence, exclude, label } = await searchParams;

  const { results } = await loadResults(sessionId);
  const inv = results.inventory;
  const depts = inv.constraints.departements ?? [inv.constraints.departement];
  const d = findDirection(results, romeCode);

  const source = getOfferSource();
  // A direction held back from the list still has its ads one link away.
  let all: Offer[];
  if (d) {
    all = d.market.offers;
  } else {
    const seen = new Set<string>();
    all = (await Promise.all(depts.map((dep) => source.fetchOffers(romeCode, dep))))
      .flat()
      .filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)));
  }
  if (all.length === 0) notFound();
  const coverage = await source.coverage();
  const disclosure = coverageDisclosure(depts, coverage);

  const has = (codes: { code: string }[], c?: string) =>
    c ? codes.some((x) => x.code === c) : true;

  const filtered = all.filter((o) => {
    if (competence && !has(o.competences, competence)) return false;
    if (exclude && has(o.competences, exclude)) return false;
    return true;
  });

  const heading = competence
    ? `Annonces qui demandent « ${label ?? competence} »`
    : exclude
      ? `Exceptions — annonces qui ne demandent pas « ${label ?? exclude} »`
      : "Annonces utilisées pour ce signal";

  // Why a given ad counts toward the signal (LIGHT spec receipts).
  const pourquoi = competence
    ? `Liste « ${label ?? competence} » — l'exigence en question.`
    : exclude
      ? "Ne demande pas cette exigence — une porte d'entrée alternative."
      : undefined;

  const backHref = d ? directionHref(romeCode, sessionId) : sessionId ? `/results?session=${sessionId}` : "/results";

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <Link href={backHref} className="inline-flex min-h-11 items-center gap-1.5 text-blue hover:underline">
            <ArrowLeft size={15} strokeWidth={1.5} />
            {d ? "Retour à la direction" : "Retour aux directions"}
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <header className="mb-8 space-y-1">
          {d && <p className="text-sm text-muted">{d.title}</p>}
          <h1 className="font-serif text-[28px] leading-tight text-navy">{heading}</h1>
          <p className="text-sm text-muted">
            {filtered.length} sur {all.length} annonce{all.length === 1 ? "" : "s"}, les plus récentes d&apos;abord
          </p>
          <p className="text-xs text-muted">{marketScopeLine(coverage)}</p>
          {disclosure && <p className="text-xs text-muted">{disclosure}</p>}
        </header>

        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <AdCard offer={o} pourquoi={pourquoi} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
