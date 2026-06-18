import { ExternalLink, MapPin, CalendarCheck } from "lucide-react";
import { type ReceiptAd } from "@/lib/mock";
import { Card } from "./Card";

/**
 * One receipt: a real, dated job ad backing a signal (DESIGN_SPEC screen 11).
 * Always shows "date publiée" + "vérifiée le" and a reason it counts. The
 * link is dead-link safe — points at the cached snapshot, not a rotting URL.
 */
export function AdCard({ ad }: { ad: ReceiptAd }) {
  return (
    <Card as="article" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-base text-navy">{ad.intitule}</h4>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
          {ad.typeContrat}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin size={14} strokeWidth={1.5} />
          {ad.lieu}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarCheck size={14} strokeWidth={1.5} />
          Publiée le {ad.datePubliee} · vérifiée le {ad.verifieLe}
        </span>
      </div>

      {ad.competences.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ad.competences.map((c) => (
            <span
              key={c}
              className="rounded-full bg-blue-soft px-2 py-0.5 text-xs text-text"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-text">
        <span className="text-muted">Pourquoi elle compte — </span>
        {ad.pourquoi}
      </p>

      <a
        href={ad.cachedUrl}
        className="inline-flex items-center gap-1 text-sm font-medium text-blue hover:underline"
      >
        Voir l&apos;annonce
        <ExternalLink size={14} strokeWidth={1.5} />
      </a>
    </Card>
  );
}
