import Link from "next/link";
import { notFound } from "next/navigation";
import { getOfferSource } from "@/lib/offers";
import { P2_INVENTORY } from "@/lib/engine/results";

/**
 * Filtered offer subset (PRD §7: "every requirement count links to the
 * filtered offer subset that proves it"). Reached from a requirement count.
 *
 * Query params:
 *   competence=<code>  filter to offers that DO list it
 *   exclude=<code>     filter to offers that do NOT list it (the escape hatch)
 *
 * Reads via OfferSource only. Server component.
 */
export default async function OfferSubsetPage({
  params,
  searchParams,
}: {
  params: Promise<{ romeCode: string }>;
  searchParams: Promise<{ competence?: string; exclude?: string; label?: string }>;
}) {
  const { romeCode } = await params;
  const { competence, exclude, label } = await searchParams;

  const dept = P2_INVENTORY.constraints.departement;
  const all = await getOfferSource().fetchOffers(romeCode, dept);
  if (all.length === 0) notFound();

  const has = (codes: { code: string }[], c?: string) =>
    c ? codes.some((x) => x.code === c) : true;

  const filtered = all.filter((o) => {
    if (competence && !has(o.competences, competence)) return false;
    if (exclude && has(o.competences, exclude)) return false;
    return true;
  });

  const heading = competence
    ? `Offers that ask "${label ?? competence}"`
    : exclude
      ? `Exceptions — offers that do NOT ask "${label ?? exclude}"`
      : "All offers";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/results" className="text-sm text-blue-600 hover:underline">
        ← Back to directions
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{heading}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {romeCode} · dépt {dept} · {filtered.length} of {all.length} cached offers
      </p>

      <ul className="mt-6 space-y-3">
        {filtered.map((o) => (
          <li
            key={o.id}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{o.intitule}</span>
              <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                {o.typeContrat || "—"}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {o.lieuTravail.libelle}
              {o.experienceLibelle ? ` · exp: ${o.experienceLibelle}` : ""}
            </p>
            {o.competences.length > 0 && (
              <p className="mt-2 text-xs text-neutral-400">
                {o.competences.map((c) => c.libelle).join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
