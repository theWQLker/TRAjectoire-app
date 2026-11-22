import type { Directions, Direction } from "@/lib/engine/directions";
import { sectorLabel } from "@/lib/engine/directions";
import type { ResultDirection } from "@/lib/engine/results";
import { signalStrength } from "@/lib/engine/coverage";
import { SEED_ANSWER_KEY, type Answers } from "@/lib/quiz/build-inventory";
import { FAMILIES } from "../../../config/families";
import { BUCKETS } from "../../../config/buckets";
import { ftSearchLinks, joinFr, signalFromCoverage, type Signal } from "@/lib/ui";

/**
 * DIRECTIONS-FIRST RESULTS: the view model of /results (approved P5 mockup,
 * docs/design/2026-11-22_directions-p5-mockup.html, and the 2026-11-22
 * decisions). Pure: the page renders what this returns and nothing else, so
 * scripts/directions-gate.ts checks exactly the text a user sees.
 *
 * Wording comes from the mockup and the decisions only (COPY). No %, no score,
 * no ad count anywhere (decision 3, round 2: the cached count read as current
 * demand): signal is the three-dot tier, demand is a live France Travail link.
 */

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

/**
 * Wording from the approved mockup and the 2026-11-22 decisions (round 2: the
 * former draft lines were accepted, two of them reworded; no cached count, no
 * "pas de données" tag; the unknown-skill line moved to the card).
 */
export const COPY = {
  quotesTitle: "Ce que vos réponses ont fait ressortir",
  /** Seeded, directions shown, none rests on an answer: never silent (decision 1). */
  noAnswerDirection:
    "Vos réponses ne font pas ressortir de direction nouvelle. Les directions ci-dessous viennent de votre parcours.",
  tagRevelee: "Révélée par vos réponses",
  tagContinuite: "Dans la continuité de votre parcours",
  rolesTitle: "Métiers pour commencer",
  copyTitle: "Intitulés à copier pour votre recherche",
  copyButton: "Copier",
  copied: "Copié",
  ftLink: "Voir les offres actuelles sur francetravail.fr",
  skillNamed: "À ajouter, souvent demandé dans les annonces : ",
  /** One line per card (or list) holding an À portée role with no nameable skill (decision 4). */
  skillUnknownCard: "Certains de ces métiers demandent des compétences en plus, pas encore identifiables.",
  noDirection: "Vos réponses ne dessinent pas encore une direction nette. Voici les métiers les plus proches.",
  addSeed: "Ajouter ce que vous avez déjà fait",
  feedbackPrompt: "Ces directions vous parlent ? Dites-le-nous en 2 minutes.",
  feedbackButton: "Donner mon avis",
  /** Why line: the direction rests on every quote shown above. */
  answersAll: (n: number) => (n === 1 ? "Votre réponse ci-dessus mène ici." : `Vos ${n} réponses ci-dessus mènent ici.`),
  /** Why line: on some of the quotes only (several directions share the section). */
  answersSome: (n: number) => (n === 1 ? "Une de vos réponses ci-dessus mène ici." : `${n} de vos réponses ci-dessus mènent ici.`),
  /** Révélée = not in the seed-only run: the seed alone does not lead here. */
  seedNotHere: (seed: string) => `Votre parcours ${seed} seul ne mène pas ici.`,
  seedHere: (seed: string | null) => (seed ? `Votre parcours ${seed} mène ici.` : "Votre parcours mène ici."),
  seedHereAndAnswers: (seed: string | null, n: number, all: boolean) =>
    `${seed ? `Votre parcours ${seed} mène ici` : "Votre parcours mène ici"}, et ${
      all ? (n === 1 ? "votre réponse ci-dessus" : `vos ${n} réponses ci-dessus`) : n === 1 ? "une de vos réponses ci-dessus" : `${n} de vos réponses ci-dessus`
    } aussi.`,
  moreRoles: (n: number) => (n === 1 ? "Voir l'autre métier" : `Voir les ${n} autres métiers`),
  faibleCount: (n: number) => `${n} autre${n === 1 ? " piste" : "s pistes"} au signal faible, non affichée${n === 1 ? "" : "s"}.`,
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
  /** À portée roles only, and only when a skill can be named (decision 4). */
  skillLine: string | null;
  /** À portée with no nameable skill: counted into the card's one line, never a row line. */
  skillUnknown: boolean;
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
  /** COPY.skillUnknownCard when any listed role is À portée with no nameable skill. */
  skillNote: string | null;
  copyTitles: string[];
  ftLinks: { label: string; href: string }[];
};

export type ResultsView = {
  /** Verbatim options behind the shown directions; empty → the section is not shown. */
  quotes: string[];
  /** In the quotes' place when directions are shown and none rests on an answer. */
  answersNote: string | null;
  heading: string | null;
  fallback: { text: string; seedHref: string | null } | null;
  directions: DirectionCardView[];
  others: { label: string; rows: RoleRow[]; skillNote: string | null; faible: string | null; open: boolean } | null;
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
  return skills?.length ? `${COPY.skillNamed}${joinFr(skills)}` : null;
}

/** The one card-level line: some listed À portée role has no skill we can name. */
export function skillNote(rows: RoleRow[]): string | null {
  return rows.some((r) => r.skillUnknown) ? COPY.skillUnknownCard : null;
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
    return n > 0 ? COPY.seedHereAndAnswers(niche, n, all) : COPY.seedHere(niche);
  }
  if (n === 0) return null;
  const answers = all ? COPY.answersAll(n) : COPY.answersSome(n);
  return d.kind === "revelee" && seed ? `${answers} ${COPY.seedNotHere(seed)}` : answers;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------
export type ViewInput = {
  directions: Directions;
  answers: Answers;
  inventoryCodes: ReadonlySet<string>;
  selected: string[];
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
    skillLine: skillLine(d, v.inventoryCodes),
    skillUnknown: skillsToAdd(d, v.inventoryCodes)?.length === 0,
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
    const roles = starters.map(row);
    const moreRoles = rest.map(row);
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
      roles,
      moreRoles,
      moreLabel: rest.length ? COPY.moreRoles(rest.length) : null,
      skillNote: skillNote([...roles, ...moreRoles]),
      copyTitles,
      ftLinks,
    };
  });

  const n = cards.length;
  const others = v.directions.others.map(row);
  const faible = v.directions.othersFaible.length;
  return {
    quotes,
    answersNote: n > 0 && quotes.length === 0 && v.directions.seeded ? COPY.noAnswerDirection : null,
    heading: n > 0 ? `${n} direction${n === 1 ? "" : "s"} pour vous` : null,
    fallback: n === 0 ? { text: COPY.noDirection, seedHref: v.directions.seeded ? null : v.seedHref } : null,
    directions: cards,
    others:
      others.length > 0 || faible > 0
        ? {
            label: `Autres pistes à explorer (${others.length})`,
            rows: others,
            skillNote: skillNote(others),
            faible: faible > 0 ? COPY.faibleCount(faible) : null,
            open: n === 0,
          }
        : null,
  };
}

/** Every visible string of a view, for the copy and honesty scans. */
export function viewStrings(view: ResultsView): string[] {
  const rows = (rs: RoleRow[]) => rs.flatMap((r) => [r.title, r.sector, r.skillLine]);
  return [
    ...(view.quotes.length ? [COPY.quotesTitle, ...view.quotes] : []),
    view.answersNote,
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
      c.skillNote,
      ...c.copyTitles,
      COPY.ftLink,
      ...c.ftLinks.map((l) => l.label),
    ]),
    view.others?.label,
    ...(view.others ? rows(view.others.rows) : []),
    view.others?.skillNote,
    view.others?.faible,
  ].filter((s): s is string => !!s);
}
