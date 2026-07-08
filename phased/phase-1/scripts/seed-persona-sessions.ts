/**
 * SEED PERSONA SESSIONS (diagnostic only — persists 3 quiz sessions).
 *
 * Builds the 3 audit profiles through the SAME path the quiz UI uses
 * (answers → buildInventory → session-store.create), so the results page can be
 * rendered for a real ?session=<id>. Prints the 3 session IDs.
 *
 * Persistence: getSessionStore() picks Supabase when NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY are set (they are), so the row is visible to the
 * dev-server process. (MemorySessionStore would NOT cross the process boundary.)
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/seed-persona-sessions.ts
 */
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { getSessionStore } from "../src/lib/quiz/session-store";

const DEPT: Answers = { c_departement: "75" };

type Profile = { key: string; label: string; answers: Answers };

const PROFILES: Profile[] = [
  {
    key: "shape-b-analytical",
    label:
      "Shape-B: seed tech:code + commerce:vente, cognitive analytical",
    answers: {
      seed_families: "tech:code,commerce:vente",
      f_surface_depth: "plutot_b", // f_surface_depth = b
      sf_data_files: "plutot_b", // sf_data_files = b
      sf_numbers_people: "plutot_a", // sf_numbers_people = a
      ...DEPT,
    },
  },
  {
    key: "shape-a-handson",
    label: "Shape-A: seed sante:soin only, cognitive hands-on",
    answers: {
      seed_families: "sante:soin",
      sf_hands_organise: "plutot_a", // sf_hands_organise = a
      f_scale_task: "plutot_a", // f_scale_task = a
      ...DEPT,
    },
  },
  {
    key: "shape-b-commercial",
    label:
      "Shape-B: seed tech:code + commerce:vente + cuisine:cuisine, cognitive commercial",
    answers: {
      seed_families: "tech:code,commerce:vente,cuisine:cuisine",
      sf_sell_fix: "plutot_a", // sf_sell_fix = a
      g_lead_support: "plutot_a", // g_lead_support = a
      sf_commercial_signal: "plutot_a", // sf_commercial_signal = a
      ...DEPT,
    },
  },
];

async function main() {
  console.log(
    `SEED PERSONA SESSIONS — ROME_SOURCE=${process.env.ROME_SOURCE ?? "fixture"} OFFER_SOURCE=${process.env.OFFER_SOURCE ?? "fixture"}`,
  );
  console.log(`store=${getSessionStore().constructor.name}\n`);

  for (const p of PROFILES) {
    const inventory = buildInventory(p.answers);
    const session = await getSessionStore().create({
      answers: p.answers,
      inventory,
      constraints: inventory.constraints,
    });
    console.log(`PROFILE ${p.key}`);
    console.log(`  ${p.label}`);
    console.log(
      `  seededCodes=${(inventory.seededCodes ?? []).length} · total competenceCodes=${(inventory.competenceCodes ?? []).length} · riasec=[${inventory.riasec.join(",")}]`,
    );
    console.log(`  SESSION_ID=${session.id}`);
    console.log(`  URL=/results?session=${session.id}\n`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
