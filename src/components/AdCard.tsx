import { MapPin, CalendarCheck } from "lucide-react";
import type { Offer } from "@/lib/offers";
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
 * Reads the live Offer shape directly. Always shows "publiée le" (dateCreation);
 * "vérifiée le" (the real snapshot fetch date) only when the source provides one
 * — null (fixture mode) omits the claim rather than inventing a freshness date.
 * Optionally why it counts.
 */
export function AdCard({
  offer,
  verifieLe,
  pourquoi,
}: {
  offer: Offer;
  verifieLe?: string | null;
  pourquoi?: string;
}) {
  return (
    <Card as="article" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-base text-navy">{offer.intitule}</h4>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
          {offer.typeContrat || "—"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin size={14} strokeWidth={1.5} />
          {offer.lieuTravail.libelle}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarCheck size={14} strokeWidth={1.5} />
          Publiée le {frDate(offer.dateCreation)}
          {verifieLe ? ` · instantané du ${verifieLe}` : ""}
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
          <span className="text-muted">Pourquoi elle compte — </span>
          {pourquoi}
        </p>
      )}
    </Card>
  );
}
