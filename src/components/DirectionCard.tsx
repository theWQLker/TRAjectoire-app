import Link from "next/link";
import { FileText } from "lucide-react";
import { signalStrength } from "@/lib/engine/coverage";
import type { ResultDirection } from "@/lib/engine/results";
import type { OfferCoverage } from "@/lib/offers";
import { ADS_LISTED, adsCountLabel, signalFromCoverage } from "@/lib/ui";
import { FtSearchLinks } from "./FtSearchLinks";
import { Card } from "./Card";
import { SignalBadge } from "./SignalBadge";

/**
 * The card's one "why" line: the shared-competence COUNT (it differs card to
 * card), and for a direction that surfaced for another reason than shared
 * skills, that reason. States the COUNT, never the skill NAMES: the matched-code
 * list is internal state (unlabelled codes once leaked as "300361, ...").
 *
 * Results noise cleanup (decision 2026-11-21): the templated qualifier line
 * ("Un vrai ajustement sur vos compétences distinctives", "Une passerelle par
 * vos compétences.") printed the same sentence on every card of a tier and is
 * gone. A why line comes back only when it says something about this user.
 */
export function sharedCountFr(d: ResultDirection): string {
  const n = d.matchedCompetenceCodes.length;
  const comp = `${n} compétence${n === 1 ? "" : "s"} partagée${n === 1 ? "" : "s"} avec votre profil.`;
  switch (d.primaryLeap) {
    case "direct":
    case "skill_bridge":
      return comp;
    case "mobilite":
      return n
        ? `${comp} Mouvement adjacent listé par le référentiel ROME.`
        : "Mouvement adjacent listé par le référentiel ROME.";
    case "interest":
      return n
        ? `${comp} Affinité d'intérêt.`
        : "Affinité d'intérêt, sans compétence technique partagée.";
  }
}

/**
 * One direction row. Shared by /results (buckets + hero band) and linked from the
 * detail route. Honesty machinery is preserved verbatim: rarity-weighted signal
 * tier, badge suppression in not_now, thin-market amber label, excludedButSurfaced
 * flag, and the bridge gate box. When `href` is set the title links to the detail.
 */
export function DirectionCard({
  d,
  href,
  offersHref,
  selected,
  coverage,
}: {
  d: ResultDirection;
  href?: string;
  /** Link to the ads behind this direction (keeps the session); used only when ADS_LISTED. */
  offersHref: string;
  /** The user's chosen zones and what the offer data covers: the dated count. */
  selected: string[];
  coverage: OfferCoverage;
}) {
  const m = d.market;
  // Signal tier is RARITY-weighted (§4 fix): reads matchRaritySum, not
  // matched/inventory.size, so the seed inflating inventory doesn't under-read.
  const signal = signalFromCoverage(signalStrength(d.matchRaritySum));
  // The skill line counts ads in the user's own zones (display only; the bucket
  // comes from the snapshot reference). Older cached results lack skillGates.
  const gate = (d.skillGates ?? d.bucketResult.unmetGates)[0];
  const isBridge = d.bucketResult.category === "bridge";
  // In "Pas maintenant" we suppress ALL signal badges regardless of tier.
  const showSignal = d.bucketResult.category !== "not_now";

  return (
    <Card as="article" className="space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {href ? (
            <Link
              href={href}
              className="inline-flex min-h-11 items-center text-lg text-navy hover:text-blue hover:underline"
            >
              {d.title}
            </Link>
          ) : (
            <h3 className="text-lg text-navy">{d.title}</h3>
          )}
          {showSignal && <SignalBadge signal={signal} />}
        </div>
        <p className="text-sm text-text">{sharedCountFr(d)}</p>
        {/* Honesty break-through: an excluded job that still colle fort surfaces
            flagged, never hidden. */}
        {d.excludedButSurfaced && (
          <p className="text-xs text-orange">
            Vous avez écarté ce métier, mais votre profil y colle fort : on le
            montre quand même.
          </p>
        )}
      </div>

      {/* Real market: the dated count, then a live France Travail search.
          Thin/zero demand is an honest line. */}
      <div className="space-y-1 border-t border-border pt-4">
        {d.marketUnverified ? (
          <p className="text-sm text-muted">{adsCountLabel(0, selected, coverage)}. Non vérifié sur le marché.</p>
        ) : d.thinMarketSeeded ? (
          <div className="rounded-md border border-amber-soft bg-amber-soft/40 px-3 py-2.5">
            <p className="text-sm text-orange">
              Vous avez les compétences. {adsCountLabel(0, selected, coverage)} : ce métier peut recruter
              ailleurs, ou par d&apos;autres canaux.
            </p>
          </div>
        ) : ADS_LISTED && m.marketDemand > 0 ? (
          <Link
            href={offersHref}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-blue hover:underline"
          >
            <FileText size={15} strokeWidth={1.5} />
            {m.marketDemand === 1 ? "Voir l'annonce trouvée" : `Voir les ${m.marketDemand} annonces trouvées`}
          </Link>
        ) : (
          <p className="text-sm text-text">{adsCountLabel(m.marketDemand, selected, coverage)}.</p>
        )}
        <FtSearchLinks romeCode={d.romeCode} selected={selected} />
      </div>

      {/* Bridge: the skill most often missing, with its count in the ads. */}
      {isBridge && gate && (
        <div className="rounded-lg bg-amber-soft p-4 text-sm">
          <p className="text-navy">
            <span className="text-orange">Ce qui manque souvent : </span>
            {gate.libelle}{" "}
            <span className="text-muted">
              (demandé dans {gate.listing}/{gate.total} annonces)
            </span>
          </p>
        </div>
      )}
    </Card>
  );
}
