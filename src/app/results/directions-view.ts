import type { Directions, Direction } from "@/lib/engine/directions";
import { sectorLabel } from "@/lib/engine/directions";
import type { ResultDirection } from "@/lib/engine/results";
import { signalStrength } from "@/lib/engine/coverage";
import type { OfferCoverage } from "@/lib/offers";
import { SEED_ANSWER_KEY, type Answers } from "@/lib/quiz/build-inventory";
import { FAMILIES } from "../../../config/families";
import { BUCKETS } from "../../../config/buckets";
import {
  adsCountLabel,
  deptName,
  ftSearchLinks,
  joinFr,
  signalFromCoverage,
  uncoveredDepts,
  type Signal,
} from "@/lib/ui";

/**
 * DIRECTIONS-FIRST RESULTS: the view model of /results (approved P5 mockup,
 * docs/design/2026-11-22_directions-p5-mockup.html, and the 2026-11-22
 * decisions). Pure: the page renders what this returns and nothing else, so
 * scripts/directions-gate.ts checks exactly the text a user sees.
 *
 * Wording comes from three places only: the mockup (COPY), the decisions
 * (COPY), and DRAFT_COPY below, which is ours and waits for George's OK.
 * No %, no score anywhere: signal is the three-dot tier, counts are ad counts.
 */

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

/** Wording from the approved mockup and the 2026-11-22 decisions. */
export const COPY = {
  quotesTitle: "Ce que vos réponses ont fait ressortir",
  tagRevelee: "Révélée par vos réponses",
  tagContinuite: "Dans la continuité de votre parcours",
  rolesTitle: "Métiers pour commencer",
  copyTitle: "Intitulés à copier pour votre recherche",
  copyButton: "Copier",
  ftLink: "Voir les offres actuelles sur francetravail.fr",
  noZoneData: "Pas de données pour votre zone",
  skillNamed: "À ajouter, souvent demandé dans les annonces : ",
  skillUnknown: "Compétences à ajouter : pas encore identifiables pour ce métier",
  noDirection: "Vos réponses ne dessinent pas encore une direction nette. Voici les métiers les plus proches.",
  addSeed: "Ajouter ce que vous avez déjà fait",
  feedbackPrompt: "Ces directions vous parlent ? Dites-le-nous en 2 minutes.",
  feedbackButton: "Donner mon avis",
} as const;

/** Ours, not in the mockup or the decisions: listed in the report for George. */
export const DRAFT_COPY = {
  /** Why line, part about the answers (mockup: "Vos 3 réponses ci-dessus mènent ici."). */
  answersAll: (n: number) => (n === 1 ? "Votre réponse ci-dessus mène ici." : `Vos ${n} réponses ci-dessus mènent ici.`),
  answersSome: (n: number) => (n === 1 ? "Une de vos réponses ci-dessus mène ici." : `${n} de vos réponses ci-dessus mènent ici.`),
  /** Mockup: "Votre parcours en développement n'y pointe pas." with the pick's own label. */
  seedNotHere: (seed: string) => `Votre parcours ${seed} n'y pointe pas.`,
  seedHere: (seed: string | null) => (seed ? `Votre parcours ${seed} mène ici.` : "Votre parcours mène ici."),
  seedHereAndAnswers: (seed: string | null, n: number, all: boolean) =>
    `${seed ? `Votre parcours ${seed} mène ici` : "Votre parcours mène ici"}, et ${
      all ? (n === 1 ? "votre réponse ci-dessus" : `vos ${n} réponses ci-dessus`) : n === 1 ? "une de vos réponses ci-dessus" : `${n} de vos réponses ci-dessus`
    } aussi.`,
  moreRoles: (n: number) => (n === 1 ? "Voir l'autre métier" : `Voir les ${n} autres métiers`),
  faibleCount: (n: number) => `${n} autre${n === 1 ? " piste" : "s pistes"} au signal faible, non affichée${n === 1 ? "" : "s"}.`,
  copied: "Copié",
} as const;

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
export type RoleRow = {
  romeCode: string;
  title: string;
  href: string;
  sector: string;
  signal: Signal;
  /** "Pas de données pour votre zone" when the role can't be checked in a chosen zone. */
  zoneTag: string | null;
  /** À portée roles only: the named skill(s), or the honest "not identifiable" line. */
  skillLine: string | null;
  /** The existing honesty flag: excluded at seed time, surfaced anyway. */
  excludedButSurfaced: boolean;
};

export type DirectionCardView = {
  capacity: string;
  tag: { kind: "revelee" | "continuite"; text: string } | null;
  name: string;
  why: string | null;
  /** The closed card's line: "20 métiers, dont …". */
  summary: string;
  open: boolean;
  roles: RoleRow[];
  moreRoles: RoleRow[];
  moreLabel: string | null;
  copyTitles: string[];
  market: string;
  ftLinks: { label: string; href: string }[];
};

export type ResultsView = {
  /** Verbatim options behind the shown directions; empty → the section is not shown. */
  quotes: string[];
  heading: string | null;
  fallback: { text: string; seedHref: string | null } | null;
  directions: DirectionCardView[];
  others: { label: string; rows: RoleRow[]; faible: string | null; open: boolean } | null;
};

export const STARTER_ROLES = 3;
const COPY_TITLES_MAX = 4;
/** Decision 2026-11-22: a skill is named only from ≥ this many ads in the zone. */
export const SKILL_MIN_ADS = 10;

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/**
 * Decision 2026-11-22, À portée skill line: name skill X only if ≥ 60 % of the
 * role's ads in the 30 June relevé list it, the role has ≥ 10 ads in the zone,
 * and the user lacks X. At most two (À portée = 1 or 2 gates). Else the honest
 * "pas encore identifiables" line. Not an À portée role → no line.
 */
export function skillsToAdd(d: ResultDirection, inventoryCodes: ReadonlySet<string>): string[] | null {
  if (d.bucketResult.category !== "bridge" || d.marketUnverified) return null;
  const ads = d.market.offers.length;
  if (ads < SKILL_MIN_ADS) return [];
  return d.market.requirementProfile
    .filter((r) => r.total === ads && r.listing / r.total >= BUCKETS.GATE_FRACTION && !inventoryCodes.has(r.code))
    .sort((a, b) => b.listing - a.listing || a.libelle.localeCompare(b.libelle, "fr"))
    .slice(0, BUCKETS.BRIDGE_MAX_GATES)
    .map((r) => r.libelle);
}

export function skillLine(d: ResultDirection, inventoryCodes: ReadonlySet<string>): string | null {
  const skills = skillsToAdd(d, inventoryCodes);
  if (skills === null) return null;
  return skills.length ? `${COPY.skillNamed}${joinFr(skills)}` : COPY.skillUnknown;
}

/** No ads for this role AND a chosen zone without offer data: we can't tell, we say so. */
export function zoneTag(d: ResultDirection, selected: string[], coverage: OfferCoverage): string | null {
  if (d.marketUnverified) return COPY.noZoneData;
  return d.market.marketDemand === 0 && uncoveredDepts(selected, coverage).length > 0 ? COPY.noZoneData : null;
}

/** « Développer / coder », or « a » et « b »: the seed picks in the user's own words. */
export function seedPicks(answers: Answers): string | null {
  const labels: string[] = [];
  for (const pick of (answers[SEED_ANSWER_KEY] ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const [fam, dep] = pick.split(":");
    const d = FAMILIES.find((f) => f.id === fam)?.depths.find((x) => x.id === dep);
    if (d) labels.push(`« ${d.label} »`);
  }
  return labels.length ? joinFr(labels) : null;
}

function nicheLabel(d: Direction): string | null {
  const depth = d.seedNiche?.split(" : ").slice(1).join(" : ");
  return depth ? `« ${depth} »` : null;
}

function whyLine(d: Direction, totalQuotes: number, seed: string | null): string | null {
  const n = d.answers.length;
  const all = n === totalQuotes;
  if (d.kind === "continuite") {
    const niche = nicheLabel(d) ?? seed;
    return n > 0 ? DRAFT_COPY.seedHereAndAnswers(niche, n, all) : DRAFT_COPY.seedHere(niche);
  }
  if (n === 0) return null;
  const answers = all ? DRAFT_COPY.answersAll(n) : DRAFT_COPY.answersSome(n);
  return d.kind === "revelee" && seed ? `${answers} ${DRAFT_COPY.seedNotHere(seed)}` : answers;
}

/** The dated count for the listed roles, with the zone: "12 annonces relevées le 30 juin 2026, Paris (75)". */
export function marketLine(roles: ResultDirection[], selected: string[], coverage: OfferCoverage): string {
  const n = roles.filter((d) => !d.marketUnverified).reduce((s, d) => s + d.market.marketDemand, 0);
  const label = adsCountLabel(n, selected, coverage);
  const missing = uncoveredDepts(selected, coverage);
  if (missing.length > 0) return label; // already names the zones it covers and the ones it can't
  return `${label}, ${joinFr(selected.map(deptName))}`;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------
export type ViewInput = {
  directions: Directions;
  answers: Answers;
  inventoryCodes: ReadonlySet<string>;
  selected: string[];
  coverage: OfferCoverage;
  /** ROME code → ROME titles, best first (romeTitles). */
  titles: Map<string, string[]>;
  roleHref: (romeCode: string) => string;
  /** Where "Ajouter ce que vous avez déjà fait" goes (the quiz's seed step). */
  seedHref: string;
};

export function buildResultsView(v: ViewInput): ResultsView {
  const row = (d: ResultDirection): RoleRow => ({
    romeCode: d.romeCode,
    title: d.title,
    href: v.roleHref(d.romeCode),
    sector: sectorLabel(d.romeCode).label,
    signal: signalFromCoverage(signalStrength(d.matchRaritySum)),
    zoneTag: zoneTag(d, v.selected, v.coverage),
    skillLine: skillLine(d, v.inventoryCodes),
    excludedButSurfaced: !!d.excludedButSurfaced,
  });

  const seen = new Set<string>();
  const quotes: string[] = [];
  for (const d of v.directions.directions) {
    for (const a of d.answers) {
      const k = `${a.sceneId}|${a.option}`;
      if (seen.has(k)) continue;
      seen.add(k);
      quotes.push(`« ${a.option} »`);
    }
  }
  const seed = seedPicks(v.answers);

  const cards: DirectionCardView[] = v.directions.directions.map((d, i) => {
    const members = d.roles.map((m) => m.role);
    const starters = members.slice(0, STARTER_ROLES);
    const rest = members.slice(STARTER_ROLES);
    const copyTitles: string[] = [];
    for (let rank = 0; rank < 2 && copyTitles.length < COPY_TITLES_MAX; rank++) {
      for (const r of starters) {
        const t = v.titles.get(r.romeCode)?.[rank];
        if (t && !copyTitles.includes(t) && copyTitles.length < COPY_TITLES_MAX) copyTitles.push(t);
      }
    }
    const ftLinks = starters.flatMap((r) =>
      ftSearchLinks(r.romeCode, v.selected).map((l) => ({
        label: v.selected.length > 1 ? `${r.title}, ${l.zone}` : r.title,
        href: l.href,
      })),
    );
    return {
      capacity: d.capacity,
      tag:
        d.kind === "revelee"
          ? { kind: "revelee", text: COPY.tagRevelee }
          : d.kind === "continuite"
            ? { kind: "continuite", text: COPY.tagContinuite }
            : null,
      name: d.name,
      why: whyLine(d, quotes.length, seed),
      summary: `${members.length} métier${members.length === 1 ? "" : "s"}, dont ${members[0].title}`,
      open: i === 0,
      roles: starters.map(row),
      moreRoles: rest.map(row),
      moreLabel: rest.length ? DRAFT_COPY.moreRoles(rest.length) : null,
      copyTitles,
      market: marketLine(starters, v.selected, v.coverage),
      ftLinks,
    };
  });

  const n = cards.length;
  const others = v.directions.others;
  const faible = v.directions.othersFaible.length;
  return {
    quotes,
    heading: n > 0 ? `${n} direction${n === 1 ? "" : "s"} pour vous` : null,
    fallback: n === 0 ? { text: COPY.noDirection, seedHref: v.directions.seeded ? null : v.seedHref } : null,
    directions: cards,
    others:
      others.length > 0 || faible > 0
        ? {
            label: `Autres pistes à explorer (${others.length})`,
            rows: others.map(row),
            faible: faible > 0 ? DRAFT_COPY.faibleCount(faible) : null,
            open: n === 0,
          }
        : null,
  };
}

/** Every visible string of a view, for the copy and honesty scans. */
export function viewStrings(view: ResultsView): string[] {
  const rows = (rs: RoleRow[]) => rs.flatMap((r) => [r.title, r.sector, r.zoneTag, r.skillLine]);
  return [
    ...(view.quotes.length ? [COPY.quotesTitle, ...view.quotes] : []),
    view.heading,
    view.fallback?.text,
    view.fallback?.seedHref ? COPY.addSeed : null,
    ...view.directions.flatMap((c) => [
      c.tag?.text,
      c.name,
      c.why,
      c.summary,
      ...rows(c.roles),
      ...rows(c.moreRoles),
      c.moreLabel,
      ...c.copyTitles,
      c.market,
      ...c.ftLinks.map((l) => l.label),
    ]),
    view.others?.label,
    ...(view.others ? rows(view.others.rows) : []),
    view.others?.faible,
  ].filter((s): s is string => !!s);
}
