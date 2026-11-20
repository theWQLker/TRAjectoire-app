import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { loadResults } from "../../display";

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
  const depts = selectedDepts.join(" · ");
  const plural = suppressed.length === 1 ? "" : "s";
  const backHref = sessionId ? `/results?session=${sessionId}` : "/results";

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        right={
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-blue hover:underline">
            <ArrowLeft size={15} strokeWidth={1.5} />
            Retour aux directions
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <header className="mb-8 space-y-2">
          <h1 className="font-serif text-[28px] leading-tight text-navy">
            {suppressed.length} piste{plural} plus large{plural}, sans compétence partagée
          </h1>
          <p className="max-w-2xl text-sm text-muted">
            Ces métiers partageaient un intérêt mais aucune annonce vivante dans
            le{selectedDepts.length > 1 ? "s" : ""} dépt {depts} — des coïncidences,
            pas des directions.
          </p>
        </header>

        {suppressed.length > 0 && (
          <ul className="space-y-1.5 text-sm text-text">
            {suppressed.map((s) => (
              <li key={s.romeCode}>
                {s.title} <span className="text-muted">({s.romeCode})</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
