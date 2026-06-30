import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import {
  buildResults,
  P2_INVENTORY,
  type ResultDirection,
} from "@/lib/engine/results";
import { signalStrength } from "@/lib/engine/coverage";
import { getSessionStore } from "@/lib/quiz/session-store";
import { type Category } from "../../../config/buckets";
import { Card } from "@/components/Card";
import { SignalBadge } from "@/components/SignalBadge";
import {
  signalFromCoverage,
  BUCKET_LABEL,
  BUCKET_HINT,
  NOT_A_VERDICT,
} from "@/lib/ui";

export const dynamic = "force-dynamic"; // reads seams at request time

const CATEGORY_ORDER: Category[] = ["apply_now", "bridge", "long_term", "not_now"];

/**
 * Coverage honesty as WORDS, never a percentage (LIGHT spec, locked). Built in
 * the UI layer from the engine's matched-code count + strength — the engine is
 * untouched. The English coveragePhrase() stays for engine-internal use.
 */
function coverageFr(d: ResultDirection): string {
  const n = d.matchedCompetenceCodes.length;
  // Same rarity-weighted strength as the badge (§4 fix), so the phrase and the
  // Signal agree. The COUNT `n` stays literal — we state how many skills are
  // shared, never a percentage.
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
 * Plain-French "why surfaced", from the engine's structured fields. We state the
 * COUNT of shared skills, never the skill NAMES — the matched-code list is
 * internal state (and unlabelled codes leaked as "300361 · …"). The count
 * conveys the fit honestly without dumping the vocabulary.
 */
function whyFr(d: ResultDirection): string {
  const n = d.matchedCompetenceCodes.length;
  const comp = `${n} de vos compétence${n === 1 ? "" : "s"}`;
  switch (d.primaryLeap) {
    case "direct":
      return `Ajustement direct — réutilise ${comp}.`;
    case "skill_bridge":
      return `Passerelle de compétences — partage ${comp}, dans un champ que vous n'auriez pas cherché.`;
    case "mobilite":
      return `Mobilité — le référentiel ROME la liste comme un mouvement adjacent${n ? `, et elle réutilise ${comp}` : ""}.`;
    case "interest":
      return n
        ? `Affinité d'intérêt — correspond à votre profil et réutilise ${comp}.`
        : `Affinité d'intérêt — correspond à votre profil, même si vos compétences techniques ne pointent pas ici.`;
  }
}

function DirectionCard({ d }: { d: ResultDirection }) {
  const m = d.market;
  // Signal tier is RARITY-weighted (§4 fix): it reads the total distinctive skill
  // shared (matchRaritySum), not matched/inventory.size — so the front-door seed
  // inflating inventory size no longer under-reads a genuine fit. The coverage
  // PHRASE below still states the literal matched-skill COUNT (always honest).
  const signal = signalFromCoverage(signalStrength(d.matchRaritySum));
  const gate = d.bucketResult.unmetGates[0];
  const isBridge = d.bucketResult.category === "bridge";

  return (
    <Card as="article" className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-lg text-navy">{d.title}</h3>
          <span className="text-xs text-muted">{d.romeCode}</span>
          <SignalBadge signal={signal} />
        </div>
        <p className="text-sm text-text">{whyFr(d)}</p>
        <p className="text-xs text-muted">{coverageFr(d)}</p>
      </div>

      {/* Real market: offre count → receipts. Thin/zero demand is an honest line. */}
      <div className="border-t border-border pt-4">
        {d.thinMarketSeeded ? (
          /* Authorized §3 honesty state: a strong SEEDED skill match with 0 cached
             ads. France Travail under-represents some sectors, so we surface the
             fit with an explicit label that makes NO market claim — visually
             distinct (amber, bordered) so it's never read as market-validated. */
          <div className="rounded-md border border-amber-soft bg-amber-soft/40 px-3 py-2.5">
            <p className="text-sm text-orange">
              Vous avez les compétences, mais peu ou pas d'annonces sur France
              Travail pour ce métier — le recrutement s'y fait souvent autrement.
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

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;

  // Inventory comes from the quiz session when present; otherwise the P2 demo.
  let inventory = P2_INVENTORY;
  let fromQuiz = false;
  if (sessionId) {
    const session = await getSessionStore().get(sessionId);
    if (session) {
      inventory = session.inventory;
      fromQuiz = true;
    }
  }

  const results = await buildResults(inventory);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 space-y-3">
        <Link href="/" className="font-serif text-base text-muted hover:text-navy">
          Trajectoire
        </Link>
        <h1 className="font-serif text-[32px] leading-tight text-navy">
          Vos directions
        </h1>
        <p className="text-text">{NOT_A_VERDICT}</p>
        {/*
          No inventory dump. The raw competence codes / skill list are internal
          engine state — never shown to the user (they leaked as "100381 · …").
          We keep only the human-meaningful context: source + département.
        */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-card border border-border bg-surface p-4">
          <p className="text-sm text-text">
            <span className="text-muted">
              {fromQuiz ? "D'après vos réponses" : "Profil de démonstration"}
            </span>{" "}
            · dépt{" "}
            {(
              results.inventory.constraints.departements ?? [
                results.inventory.constraints.departement,
              ]
            ).join(" · ")}
          </p>
          <Link href="/quiz" className="text-xs text-blue hover:underline">
            {fromQuiz ? "refaire le quiz" : "faire le quiz"}
          </Link>
        </div>
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const group = results.byCategory[cat];
        if (group.length === 0) return null;
        return (
          <section key={cat} className="mb-10 space-y-4">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl text-navy">
                {BUCKET_LABEL[cat]}{" "}
                <span className="font-sans text-sm text-muted">
                  ({group.length})
                </span>
              </h2>
              <p className="text-sm text-muted">{BUCKET_HINT[cat]}</p>
            </div>
            <div className="space-y-4">
              {[...group]
                // order within a bucket by the SAME rarity-weighted strength the
                // Signal badge shows (§4 fix), so a high-Signal card never sits
                // below a lower-Signal one. Tie-break on raw coverage.
                .sort((a, b) => b.matchRaritySum - a.matchRaritySum || b.coverage - a.coverage)
                .map((d) => (
                  <DirectionCard key={d.romeCode} d={d} />
                ))}
            </div>
          </section>
        );
      })}

      {/* Held-back honesty line — collapsed, never silently dropped (LIGHT spec) */}
      {results.suppressed.length > 0 && (
        <details className="group rounded-card border border-border bg-bg p-4">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-text">
            <ChevronRight
              size={15}
              strokeWidth={1.5}
              className="text-muted transition-transform group-open:rotate-90"
            />
            +{results.suppressed.length} piste
            {results.suppressed.length === 1 ? "" : "s"} plus large
            {results.suppressed.length === 1 ? "" : "s"}, sans compétence partagée
            — non affichée{results.suppressed.length === 1 ? "" : "s"}
          </summary>
          <p className="mt-3 text-xs text-muted">
            Ces métiers partageaient un intérêt mais aucune annonce vivante dans
            le{(results.inventory.constraints.departements?.length ?? 1) > 1 ? "s" : ""} dépt{" "}
            {(
              results.inventory.constraints.departements ?? [
                results.inventory.constraints.departement,
              ]
            ).join(" · ")}{" "}
            — des coïncidences, pas des directions :{" "}
            {results.suppressed
              .map((s) => `${s.title} (${s.romeCode})`)
              .join(" · ")}
          </p>
        </details>
      )}
    </main>
  );
}
