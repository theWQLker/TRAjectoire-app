import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOfferSource } from "@/lib/offers";
import { P2_INVENTORY } from "@/lib/engine/results";
import { AdCard } from "@/components/AdCard";

/**
 * Receipts — the real offers behind a direction's signal (LIGHT spec surface 3).
 * Reached from a direction's "voir les annonces". Reads via OfferSource only.
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
  searchParams: Promise<{ competence?: string; exclude?: string; label?: string }>;
}) {
  const { romeCode } = await params;
  const { competence, exclude, label } = await searchParams;

  const dept = P2_INVENTORY.constraints.departement;
  const offerSource = getOfferSource();
  const all = await offerSource.fetchOffers(romeCode, dept);
  if (all.length === 0) notFound();

  const has = (codes: { code: string }[], c?: string) =>
    c ? codes.some((x) => x.code === c) : true;

  const filtered = all.filter((o) => {
    if (competence && !has(o.competences, competence)) return false;
    if (exclude && has(o.competences, exclude)) return false;
    return true;
  });

  // "Vérifiée le" — the ACTUAL date these offers were fetched from the source
  // (max fetched_at), read through the seam. NOT the render time: a freshness
  // claim must be backed by when the data was pulled (prime directive). null in
  // fixture mode (no fetch date) → the receipt omits the claim entirely.
  const snapshotIso = await offerSource.snapshotDate(romeCode, dept);
  const verifieLe = snapshotIso
    ? new Date(snapshotIso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/results"
        className="inline-flex items-center gap-1.5 text-sm text-blue hover:underline"
      >
        <ArrowLeft size={15} strokeWidth={1.5} />
        Retour aux directions
      </Link>

      <header className="mb-8 mt-4 space-y-1">
        <h1 className="font-serif text-[28px] leading-tight text-navy">
          {heading}
        </h1>
        <p className="text-sm text-muted">
          {romeCode} · dépt {dept} · {filtered.length} sur {all.length} annonces
          en cache
        </p>
      </header>

      <ul className="space-y-4">
        {filtered.map((o) => (
          <li key={o.id}>
            <AdCard offer={o} verifieLe={verifieLe} pourquoi={pourquoi} />
          </li>
        ))}
      </ul>
    </main>
  );
}
