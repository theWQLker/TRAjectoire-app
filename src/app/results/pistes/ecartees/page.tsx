import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getOfferSource } from "@/lib/offers";
import { deptName, marketScopeLine } from "@/lib/ui";
import { loadResults, suppressedLabel } from "../../display";

export const dynamic = "force-dynamic";

/**
 * The held-back list (P0-A follow-up): every direction the surfacing gate set
 * aside, by name. /results keeps the counted line and links here, so the 700+
 * titles are no longer shipped twice (HTML + RSC payload) in the first view.
 * Same session computation as /results (display.ts loadResults).
 */
export default async function SuppressedListPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;
  const { results } = await loadResults(sessionId);
  const { suppressed } = results;
  const selectedDepts = results.inventory.constraints.departements ?? [
    results.inventory.constraints.departement,
  ];
  const coverage = await getOfferSource().coverage();
  const zone = selectedDepts.map(deptName).join(", ");
  const backHref = sessionId ? `/results?session=${sessionId}` : "/results";

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <Link href={backHref} className="inline-flex min-h-11 items-center gap-1.5 text-blue hover:underline">
            <ArrowLeft size={15} strokeWidth={1.5} />
            Retour aux directions
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <header className="mb-8 space-y-2">
          <h1 className="font-serif text-[28px] leading-tight text-navy">
            {suppressedLabel(suppressed.length)}
          </h1>
          <p className="max-w-2xl text-sm text-muted">
            {`Ces métiers partagent moins de 40 % de vos compétences et n'ont aucune annonce dans notre relevé pour ${zone} : des coïncidences plus que des directions.`}
          </p>
          <p className="max-w-2xl text-xs text-muted">{marketScopeLine(coverage)}</p>
        </header>

        {suppressed.length > 0 && (
          <ul className="space-y-1.5 text-sm text-text">
            {suppressed.map((s) => (
              <li key={s.romeCode}>
                {s.title}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
