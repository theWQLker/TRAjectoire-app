/**
 * Hand-written answer sheets for people who do the work, used as a check on the
 * reach map's automatic answerer (scripts/reach-map.ts). Each answer is what an
 * ordinary person in that job would pick on the scene's own wording; nothing is
 * chosen to move a rank. Contraintes and argent are left unanswered (they carry
 * no skill vocabulary) except the zone.
 */
import type { Answers } from "../src/lib/quiz/build-inventory";

/** Assistant·e RH / gestionnaire paie (M1501, M1507). */
export const HR_ASSISTANT: Answers = {
  c_departement: "75",
  f_order_improv: "plutot_a", // remettre de l'ordre
  f_surface_depth: "un_peu_b", // comprendre ce qui se passe
  f_leverage_completeness: "un_peu_b", // tout traiter dans l'ordre
  f_decide_wait: "un_peu_b", // attendre d'avoir les éléments
  f_scale_task: "un_peu_a", // solution réutilisable
  f_ambiguous_instruction: "plutot_a", // poser des questions avant
  f_repeat_problem: "un_peu_a", // chercher pourquoi
  f_new_domain: "un_peu_a", // bases, mots, règles
  f_detail_big_picture: "plutot_a", // détails qui bloquent
  f_energy_context: "les_deux",
  sf_numbers_people: "les_deux", // règles précises ET demandes des personnes
  sf_hands_organise: "plutot_b", // organiser les étapes
  sf_sell_fix: "ni_l_un",
  sf_write_explain: "un_peu_a", // écrire clairement
  sf_create_express: "un_peu_b",
  sf_data_files: "plutot_a", // nettoyer, rendre fiable
  sf_digital_tools: "un_peu_a", // statuts, accès, champs
  sf_client_issue: "un_peu_b", // rassurer puis faire avancer
  sf_project_followup: "plutot_a", // statuts, relances, blocages
  sf_training_peer: "les_deux",
  sf_commercial_signal: "un_peu_b",
  g_conflict: "les_deux",
  g_lead_support: "un_peu_b",
  g_teach_do: "un_peu_a",
  g_group_energy: "un_peu_a",
  g_boundaries: "un_peu_a",
  g_status_authority: "un_peu_a",
  g_hidden_need: "plutot_a", // reformuler le vrai besoin
};

/** Secrétaire / assistant·e administratif·ve (M1607, M1604, M1609). */
export const SECRETARY: Answers = {
  c_departement: "75",
  f_order_improv: "plutot_a",
  f_surface_depth: "un_peu_a",
  f_leverage_completeness: "un_peu_b",
  f_decide_wait: "un_peu_b",
  f_scale_task: "un_peu_a",
  f_ambiguous_instruction: "plutot_a",
  f_repeat_problem: "un_peu_b",
  f_new_domain: "un_peu_b",
  f_detail_big_picture: "plutot_a",
  f_energy_context: "les_deux",
  sf_numbers_people: "un_peu_a", // vérifier, classer, appliquer des règles
  sf_hands_organise: "plutot_b", // organiser, coordonner
  sf_sell_fix: "ni_l_un",
  sf_write_explain: "plutot_a", // écrire clairement
  sf_create_express: "un_peu_b",
  sf_data_files: "plutot_a",
  sf_digital_tools: "un_peu_b",
  sf_client_issue: "plutot_b", // rassurer, faire avancer
  sf_project_followup: "plutot_a", // statuts, relances
  sf_training_peer: "un_peu_b", // procédure claire
  sf_commercial_signal: "plutot_b",
  g_conflict: "un_peu_b", // réponse écrite
  g_lead_support: "plutot_b",
  g_teach_do: "un_peu_a",
  g_group_energy: "un_peu_a",
  g_boundaries: "un_peu_b",
  g_status_authority: "un_peu_b",
  g_hidden_need: "un_peu_a",
};
