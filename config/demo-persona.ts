/**
 * The example shown on /results without a session (decision 2026-11-23),
 * labelled « Exemple de résultats ». It is the answered persona with the most
 * révélée directions among the 15 answered personas of the directions layer
 * (scripts/directions-prototype.ts), measured with the earned floor at 2 on
 * vocab-reach + directions (c6b0097): P9, « Seed commerce:vente + réponses
 * vente », bac+2, 2 révélée out of 5 directions, 501 roles. These are its
 * answers as scripts/theme-personas.ts builds them; the inventory comes from
 * buildInventory, like any quiz session.
 */
import type { Answers } from "@/lib/quiz/build-inventory";

export const DEMO_ANSWERS: Answers = {
  c_departement: "75",
  c_diploma: "bac2",
  seed_families: "commerce:vente",
  f_energy_context: "plutot_b",
  sf_numbers_people: "plutot_b",
  sf_sell_fix: "plutot_a",
  sf_write_explain: "plutot_b",
  sf_client_issue: "plutot_b",
  g_conflict: "plutot_a",
  g_group_energy: "plutot_a",
  g_status_authority: "plutot_a",
};
