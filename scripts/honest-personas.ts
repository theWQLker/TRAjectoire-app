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
  sf_commercial_signal: "un_peu_b", // old scene, replaced 2026-11-21
  sf_people_accounts: "plutot_a", // le personnel : embauches, contrats, absences, paie
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
  sf_commercial_signal: "plutot_b", // old scene, replaced 2026-11-21
  sf_people_accounts: "les_deux", // an assistant handles absences and invoices alike
  g_conflict: "un_peu_b", // réponse écrite
  g_lead_support: "plutot_b",
  g_teach_do: "un_peu_a",
  g_group_energy: "un_peu_a",
  g_boundaries: "un_peu_b",
  g_status_authority: "un_peu_b",
  g_hidden_need: "un_peu_a",
};

/**
 * The original Master's-HR profile of scripts/level-demote-proof.ts: eight
 * people-side answers and bac+5. Kept as is (the level-demote gate uses it, and
 * its D1408 lead was accepted on 2026-11-21).
 */
export const MASTERS_HR_OLD: Answers = {
  c_departement: "75",
  c_diploma: "bac5",
  sf_numbers_people: "plutot_b",
  sf_client_issue: "plutot_b",
  g_conflict: "plutot_a",
  g_teach_do: "plutot_a",
  sf_training_peer: "plutot_a",
  g_hidden_need: "plutot_a",
  ar_learning_investment: "plutot_b",
};

/**
 * Master's-HR rebuilt (decision 2026-11-21): a chargé·e RH généraliste with a
 * bac+5 answering every scored scene, the HR scene included.
 */
export const MASTERS_HR: Answers = {
  c_departement: "75",
  c_diploma: "bac5",
  ar_learning_investment: "plutot_b",
  f_order_improv: "plutot_a",
  f_surface_depth: "un_peu_b",
  f_leverage_completeness: "un_peu_a",
  f_decide_wait: "un_peu_b",
  f_scale_task: "un_peu_a",
  f_ambiguous_instruction: "plutot_a",
  f_repeat_problem: "plutot_a", // chercher pourquoi un problème revient
  f_new_domain: "un_peu_a",
  f_detail_big_picture: "les_deux",
  f_energy_context: "les_deux",
  sf_numbers_people: "les_deux", // règles (droit social) ET personnes
  sf_hands_organise: "plutot_b",
  sf_sell_fix: "ni_l_un",
  sf_write_explain: "les_deux",
  sf_create_express: "un_peu_b",
  sf_data_files: "un_peu_a",
  sf_digital_tools: "un_peu_a", // SIRH : statuts, accès, champs
  sf_client_issue: "un_peu_b",
  sf_project_followup: "plutot_a",
  sf_training_peer: "plutot_a", // intégrer un nouvel arrivant
  sf_commercial_signal: "un_peu_a", // old scene, replaced 2026-11-21
  sf_people_accounts: "plutot_a", // le personnel
  g_conflict: "plutot_a",
  g_lead_support: "un_peu_a",
  g_teach_do: "un_peu_a",
  g_group_energy: "plutot_a",
  g_boundaries: "plutot_a",
  g_status_authority: "plutot_a",
  g_hidden_need: "plutot_a",
};

/**
 * Cognitive-only personas already used across the repo (coherence-audit.ts,
 * coherence-sweep.ts, c1201-fix-proof.ts, seed-persona-sessions.ts). Copied
 * verbatim. None answers the HR scene (rule: a non-admin persona answers it
 * « ni l'un ni l'autre », which weighs nothing, same as leaving it out).
 */
export const COGNITIVE: Record<string, Answers> = {
  hands_on: { sf_hands_organise: "plutot_a", sf_sell_fix: "plutot_b", sf_digital_tools: "plutot_b", f_order_improv: "plutot_b", g_teach_do: "plutot_b", f_energy_context: "plutot_b", sf_client_issue: "plutot_a", c_departement: "75" },
  people: { sf_numbers_people: "plutot_b", g_conflict: "plutot_a", g_teach_do: "plutot_a", sf_client_issue: "plutot_b", g_boundaries: "plutot_b", sf_write_explain: "plutot_b", g_hidden_need: "plutot_a", c_departement: "75" },
  analytical: { f_surface_depth: "plutot_b", sf_data_files: "plutot_b", f_order_improv: "plutot_a", f_scale_task: "plutot_a", sf_digital_tools: "plutot_a", f_repeat_problem: "plutot_a", sf_numbers_people: "plutot_a", c_departement: "75" },
  creative: { sf_write_explain: "plutot_a", f_new_domain: "plutot_a", f_detail_big_picture: "plutot_b", f_leverage_completeness: "plutot_a", g_group_energy: "plutot_a", c_departement: "75" },
  commercial: { sf_sell_fix: "plutot_a", g_lead_support: "plutot_a", g_status_authority: "plutot_a", sf_commercial_signal: "plutot_a", f_decide_wait: "plutot_a", g_group_energy: "plutot_a", c_departement: "75" },
  sante_seed_hands_on: { seed_families: "sante:soin", sf_hands_organise: "plutot_a", f_scale_task: "plutot_a", c_departement: "75" },
  shape_b_analytical: { seed_families: "tech:code,commerce:vente", f_surface_depth: "plutot_b", sf_data_files: "plutot_b", sf_numbers_people: "plutot_a", c_departement: "75" },
  shape_b_commercial: { seed_families: "tech:code,commerce:vente,cuisine:cuisine" /* sic: "cuisine:cuisine" is no niche, ignored */, sf_sell_fix: "plutot_a", g_lead_support: "plutot_a", sf_commercial_signal: "plutot_a", c_departement: "75" },
};
