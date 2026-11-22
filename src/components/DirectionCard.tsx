import type { ResultDirection } from "@/lib/engine/results";

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
