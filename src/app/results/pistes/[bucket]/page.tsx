import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { strengthBand, type StrengthBand } from "@/lib/engine/coverage";
import type { ResultDirection } from "@/lib/engine/results";
import { SiteHeader } from "@/components/SiteHeader";
import { DirectionCard } from "@/components/DirectionCard";
import { BUCKET_LABEL, BUCKET_HINT, STRENGTH_BAND_LABEL } from "@/lib/ui";
import {
  PAGE_SIZE,
  bandCounts,
  bucketHref,
  directionHref,
  isCategory,
  loadResults,
  orderBucket,
} from "../../display";

export const dynamic = "force-dynamic";

/**
 * Every direction of one bucket, on demand and paginated (P0-A). The first view
 * of /results shows only the strongest few; this is where the rest lives, in
 * the same order the page has always used, nothing filtered out.
 */
export default async function BucketListPage({
  params,
  searchParams,
}: {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<{ session?: string; page?: string }>;
}) {
  const { bucket } = await params;
  const { session: sessionId, page: pageParam } = await searchParams;
  if (!isCategory(bucket)) notFound();

  const { results } = await loadResults(sessionId);
  const group = results.byCategory[bucket];
  const ordered = orderBucket(bucket, group);
  const pages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1), pages);
  const start = (page - 1) * PAGE_SIZE;
  const rows = ordered.slice(start, start + PAGE_SIZE);
  const backHref = sessionId ? `/results?session=${sessionId}` : "/results";

  // Bridge rows carry a tier sub-heading whenever the tier changes on this page.
  const bandOf = (d: ResultDirection): StrengthBand | null =>
    bucket === "bridge" ? strengthBand(d.matchRaritySum) : null;
  const items = rows.map((d, i) => {
    const band = bandOf(d);
    const heading = band && (i === 0 || band !== bandOf(rows[i - 1])) ? band : null;
    return { d, heading };
  });

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
            {BUCKET_LABEL[bucket]}{" "}
            <span className="font-sans text-base text-muted">({group.length})</span>
          </h1>
          <p className="text-sm text-muted">{BUCKET_HINT[bucket]}</p>
          {bucket === "bridge" && (
            <p className="text-xs text-muted">
              {bandCounts(group)
                .map(({ band, count }) => `${STRENGTH_BAND_LABEL[band]} (${count})`)
                .join(" · ")}
            </p>
          )}
          {ordered.length > 0 && (
            <p className="text-sm text-text">
              Pistes {start + 1} à {start + rows.length} sur {ordered.length}
            </p>
          )}
        </header>

        <div className="space-y-4">
          {items.map(({ d, heading }) => (
            <div key={d.romeCode} className="space-y-3">
              {heading && (
                <h2 className="pt-2 text-sm font-semibold text-navy">{STRENGTH_BAND_LABEL[heading]}</h2>
              )}
              <DirectionCard d={d} href={directionHref(d.romeCode, sessionId)} />
            </div>
          ))}
        </div>

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6 text-sm" aria-label="Pages">
            {page > 1 ? (
              <Link href={bucketHref(bucket, sessionId, page - 1)} className="inline-flex min-h-11 items-center gap-1 text-blue hover:underline">
                <ChevronLeft size={16} strokeWidth={1.5} />
                Précédent
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted">
              Page {page} sur {pages}
            </span>
            {page < pages ? (
              <Link href={bucketHref(bucket, sessionId, page + 1)} className="inline-flex min-h-11 items-center gap-1 text-blue hover:underline">
                Suivant
                <ChevronRight size={16} strokeWidth={1.5} />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
