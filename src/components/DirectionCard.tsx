import Link from "next/link";
import { FileText } from "lucide-react";
import { signalStrength } from "@/lib/engine/coverage";
import type { ResultDirection } from "@/lib/engine/results";
import { signalFromCoverage } from "@/lib/ui";
import { Card } from "./Card";
import { SignalBadge } from "./SignalBadge";

/**
 * Coverage honesty as WORDS, never a percentage (LIGHT spec, locked). Built in
 * the UI layer from the engine's matched-code count + strength — engine untouched.
 */
export function coverageFr(d: ResultDirection): string {
  const n = d.matchedCompetenceCodes.length;
  switch (signalStrength(d.matchRaritySum)) {
    case "strong":
      return n > 0
        ? `Appuyé sur ${n} de vos compétences distinctives — un vrai ajustement`
        : "Appuyé sur l'essentiel de votre profil";
    case "partial":
      return `Appuyé sur ${n} de vos compétences — une vraie partie de votre profil`;
    case "exploratory":
      return n === 0
        ? "Aucun recouvrement direct — un lien de côté, pas un ajustement"
        : `Appuyé sur ${n} de vos compétence${n === 1 ? "" : "s"} — un lien fin`;
  }
}

/**
 * The HEADLINE signal line — the shared-competence COUNT, the real
 * differentiator between cards (promoted from a muted sub-line: a bucket of
 * bridges was repeating an identical templated sentence while THIS number, the
 * thing that actually distinguishes them, sat buried). States the COUNT, never
 * the skill NAMES — the matched-code list is internal state (unlabelled codes
 * once leaked as "300361 · …").
 */
export function sharedCountFr(d: ResultDirection): string {
  const n = d.matchedCompetenceCodes.length;
  const comp = `${n} compétence${n === 1 ? "" : "s"} partagée${n === 1 ? "" : "s"}`;
  switch (d.primaryLeap) {
    case "direct":
      return `${comp} avec votre profil — ajustement direct.`;
    case "skill_bridge":
      return `${comp} avec votre profil.`;
    case "mobilite":
      return n
        ? `${comp} avec votre profil — mouvement adjacent (ROME).`
        : `Mouvement adjacent listé par le référentiel ROME.`;
    case "interest":
      return n
        ? `${comp} avec votre profil — affinité d'intérêt.`
        : `Affinité d'intérêt, sans compétence technique partagée.`;
  }
}

/**
 * The SECONDARY qualifier — the leap "flavour", demoted below the count. The
 * skill-bridge "champ que vous n'auriez pas cherché" phrasing is VARIED by the
 * count so a bucket of bridges doesn't repeat one identical sentence: it only
 * carries the discovery framing when the match is thin enough to genuinely be a
 * sideways leap, and stays terse otherwise. null → no secondary line.
 */
export function leapQualifierFr(d: ResultDirection): string | null {
  const n = d.matchedCompetenceCodes.length;
  switch (d.primaryLeap) {
    case "skill_bridge":
      // Thin overlap = a real cross-field leap → keep the discovery framing.
      // Substantial overlap = an obvious neighbour → drop the boilerplate.
      return n <= 2
        ? "Un champ que vous n'auriez pas cherché."
        : "Une passerelle par vos compétences.";
    case "mobilite":
      return "Le référentiel ROME la liste comme une évolution possible.";
    case "interest":
      return d.matchedCompetenceCodes.length === 0
        ? "Vos compétences techniques ne pointent pas (encore) ici."
        : null;
    case "direct":
      return null;
  }
}

/**
 * Full "why surfaced" sentence for the DETAIL page (one card, no repetition
 * problem): the promoted shared-count headline + the leap qualifier composed
 * into a single natural line. The results-list cards use the two split lines
 * (sharedCountFr / leapQualifierFr) instead, so a bucket doesn't repeat one
 * templated sentence. Same underlying facts, never a percentage or code name.
 */
export function whyFr(d: ResultDirection): string {
  const qualifier = leapQualifierFr(d);
  return qualifier ? `${sharedCountFr(d)} ${qualifier}` : sharedCountFr(d);
}

/**
 * One direction row. Shared by /results (buckets + hero band) and linked from the
 * detail route. Honesty machinery is preserved verbatim: rarity-weighted signal
 * tier, badge suppression in not_now, thin-market amber label, excludedButSurfaced
 * flag, and the bridge gate box. When `href` is set the title links to the detail.
 */
export function DirectionCard({ d, href }: { d: ResultDirection; href?: string }) {
  const m = d.market;
  // Signal tier is RARITY-weighted (§4 fix): reads matchRaritySum, not
  // matched/inventory.size — so the seed inflating inventory doesn't under-read.
  const signal = signalFromCoverage(signalStrength(d.matchRaritySum));
  const gate = d.bucketResult.unmetGates[0];
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
              className="text-lg text-navy hover:text-blue hover:underline"
            >
              {d.title}
            </Link>
          ) : (
            <h3 className="text-lg text-navy">{d.title}</h3>
          )}
          <span className="text-xs text-muted">{d.romeCode}</span>
          {showSignal && <SignalBadge signal={signal} />}
        </div>
        {/* Headline: the shared-competence COUNT — the real differentiator. */}
        <p className="text-sm text-text">{sharedCountFr(d)}</p>
        {/* Secondary: the qualitative strength + varied leap flavour, demoted. */}
        <p className="text-xs text-muted">
          {coverageFr(d)}
          {leapQualifierFr(d) ? ` · ${leapQualifierFr(d)}` : ""}
        </p>
        {/* Honesty break-through: an excluded job that still colle fort surfaces
            flagged, never hidden. */}
        {d.excludedButSurfaced && (
          <p className="text-xs text-orange">
            Vous avez écarté ce métier, mais votre profil y colle fort — on le
            montre quand même.
          </p>
        )}
      </div>

      {/* Real market: offre count → receipts. Thin/zero demand is an honest line. */}
      <div className="border-t border-border pt-4">
        {d.thinMarketSeeded ? (
          <div className="rounded-md border border-amber-soft bg-amber-soft/40 px-3 py-2.5">
            <p className="text-sm text-orange">
              Vous avez les compétences, mais peu ou pas d&apos;annonces sur
              France Travail pour ce métier — le recrutement s&apos;y fait souvent
              autrement.
            </p>
          </div>
        ) : m.marketDemand === 0 ? (
          <p className="text-sm text-muted">
            Aucune annonce en cache pour ce métier dans votre département —
            demande fine ou nulle. Un signal, pas un filtre caché.
          </p>
        ) : (
          <div className="space-y-3">
            <Link
              href={`/results/offers/${d.romeCode}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue hover:underline"
            >
              <FileText size={15} strokeWidth={1.5} />
              {m.marketDemand} annonce{m.marketDemand === 1 ? "" : "s"} trouvée
              {m.marketDemand === 1 ? "" : "s"} — voir les annonces
            </Link>
            {m.commonTitles.length > 0 && (
              <p className="text-xs text-muted">
                Intitulés fréquents :{" "}
                {m.commonTitles.slice(0, 3).map((t) => t.intitule).join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bridge: what's missing + first move (LIGHT spec) */}
      {isBridge && gate && (
        <div className="rounded-lg bg-amber-soft p-4 text-sm">
          <p className="text-navy">
            <span className="text-orange">Ce qui manque souvent — </span>
            {gate.libelle}{" "}
            <span className="text-muted">
              (demandé dans {gate.listing}/{gate.total} annonces)
            </span>
          </p>
          <p className="mt-1 text-text">
            <span className="text-muted">Premier geste — </span>
            ajouter cette compétence sur 3 à 6 mois, puis re-tester ce signal.
          </p>
        </div>
      )}
    </Card>
  );
}
