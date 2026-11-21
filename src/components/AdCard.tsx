import { MapPin, CalendarCheck, ExternalLink } from "lucide-react";
import type { Offer } from "@/lib/offers";
import { cleanOfferTitle, offerUrl } from "@/lib/offers/offer";
import { deptName } from "@/lib/ui";
import { Card } from "./Card";

/** Format an ISO/date string to a calm French date ("12 juin 2026"). */
function frDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * One receipt: a REAL, dated job ad backing a signal (LIGHT spec surface 3).
 * Reads the live Offer shape directly. Shows "publiée le" (dateCreation, from
 * France Travail). No freshness / "checked on" claim: offers are a supporting
 * signal behind the career directions, refreshed by hand, not a live feed.
 * Optionally why it counts. Links to the original ad on francetravail.fr.
 */
export function AdCard({
  offer,
  pourquoi,
}: {
  offer: Offer;
  pourquoi?: string;
}) {
  return (
    <Card as="article" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-base text-navy">{cleanOfferTitle(offer.intitule)}</h4>
        {offer.typeContrat && (
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {offer.typeContrat}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        {/* The cache keeps the département, not the commune: say only that. */}
        {(offer.lieuTravail.libelle || offer.lieuTravail.departement) && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} strokeWidth={1.5} />
            {offer.lieuTravail.libelle || deptName(offer.lieuTravail.departement)}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <CalendarCheck size={14} strokeWidth={1.5} />
          Publiée le {frDate(offer.dateCreation)}
        </span>
      </div>

      {offer.competences.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {offer.competences.slice(0, 6).map((c) => (
            <span
              key={c.code}
              className="rounded-full bg-blue-soft px-2 py-0.5 text-xs text-text"
            >
              {c.libelle}
            </span>
          ))}
        </div>
      )}

      {pourquoi && (
        <p className="text-sm text-text">
          <span className="text-muted">Pourquoi elle compte : </span>
          {pourquoi}
        </p>
      )}

      <a
        href={offerUrl(offer.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-blue hover:underline"
      >
        Voir l&apos;offre sur francetravail.fr
        <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
        <span className="sr-only">(nouvel onglet)</span>
      </a>
    </Card>
  );
}
