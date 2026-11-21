/**
 * Theme personas, shared by the directions prototype, the signal sweep and the
 * scale-bias diagnosis. A theme is a set of clusters; a persona answers every
 * quiz scene with the option whose clusters overlap the theme most (both when
 * tied, skipped when neither does). Same rule, different themes → different
 * answers. Department 75 unless the caller overrides it.
 */
import { SEED_ANSWER_KEY, type Answers } from "../src/lib/quiz/build-inventory";
import { CATEGORIES } from "../config/quiz";

export const THEMES: Record<string, string[]> = {
  relation: ["relation_client", "contact", "empathie", "pedagogie", "transmission", "gestion_conflit", "besoin_harmonie"],
  analyse: ["analyse", "systemes", "investigation", "diagnostic", "rigueur", "detection_incoherence", "synthese", "reporting", "gestion_donnees"],
  terrain: ["manuel", "technique", "terrain", "resolution", "execution", "pragmatisme", "fiabilite"],
  vente: ["vente", "persuasion", "relation_client", "contact", "assurance", "presentation"],
  organisation: ["organisation", "planification", "leadership", "priorisation", "decision_incertitude", "fiabilite", "terrain"],
};

export type ThemePersona = { id: string; label: string; theme: keyof typeof THEMES; seed?: string; diploma: string };

export function themeAnswers(p: ThemePersona, departement = "75"): Answers {
  const theme = new Set(THEMES[p.theme]);
  const a: Answers = { c_departement: departement, c_diploma: p.diploma };
  if (p.seed) a[SEED_ANSWER_KEY] = p.seed;
  for (const cat of CATEGORIES) {
    for (const s of cat.scenes) {
      const score = (o: typeof s.optionA) =>
        (o.maps.clusters ?? []).reduce((t, c) => t + (theme.has(c.id) ? c.weight : 0), 0);
      const sa = score(s.optionA);
      const sb = score(s.optionB);
      if (sa === 0 && sb === 0) continue;
      a[s.id] = sa > sb ? "plutot_a" : sb > sa ? "plutot_b" : "les_deux";
    }
  }
  return a;
}

/** One quiz-only persona per theme: the population the scale bias hurts. */
export const QUIZ_ONLY: ThemePersona[] = Object.keys(THEMES).map((theme) => ({
  id: `quiz ${theme}`,
  label: `Réponses ${theme}, sans seed`,
  theme,
  diploma: "bac3",
}));
