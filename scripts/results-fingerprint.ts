/**
 * RESULTS FINGERPRINT — writes the full engine output for a fixed set of personas
 * to JSON, so a change that must NOT alter results (I/O, caching, paging) can be
 * proven byte-identical: run before, run after, diff the two folders.
 *
 * Covers every field the page and the gates read: bucket, strength inputs, all
 * rank stages, wildcard, market aggregates, offer ids in served order, the
 * suppressed and held-back lists, and the honest fork.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/results-fingerprint.ts <outDir>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildResults, P2_INVENTORY } from "../src/lib/engine/results";
import { buildInventory, SEED_ANSWER_KEY } from "../src/lib/quiz/build-inventory";
import type { Inventory } from "../src/lib/engine/inventory";

const PERSONAS: Record<string, Inventory> = {
  demo_profile: P2_INVENTORY,
  no_seed: buildInventory({}),
  tech_code: buildInventory({ [SEED_ANSWER_KEY]: "tech:code" }),
  tech_code_75_93: buildInventory({ [SEED_ANSWER_KEY]: "tech:code", c_departement: "75,93" }),
  sante_soin: buildInventory({ [SEED_ANSWER_KEY]: "sante:soin" }),
  admin_compta: buildInventory({ [SEED_ANSWER_KEY]: "admin:compta" }),
  btp_second: buildInventory({ [SEED_ANSWER_KEY]: "btp:second" }),
  hotellerie_cuisine: buildInventory({ [SEED_ANSWER_KEY]: "hotellerie:cuisine" }),
  commerce_vente: buildInventory({ [SEED_ANSWER_KEY]: "commerce:vente" }),
  transport_entrepot: buildInventory({ [SEED_ANSWER_KEY]: "transport:entrepot" }),
};

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error("usage: results-fingerprint.ts <outDir>");
  mkdirSync(out, { recursive: true });

  for (const [name, inv] of Object.entries(PERSONAS)) {
    const t = performance.now();
    const r = await buildResults(inv);
    const fp = {
      directions: r.directions.map((d) => ({
        rome: d.romeCode,
        category: d.bucketResult.category,
        coverage: d.coverage,
        matchRaritySum: d.matchRaritySum,
        rankScore: d.rankScore,
        displayRank: d.displayRank,
        coherenceRank: d.coherenceRank,
        coherencePenalty: d.coherencePenalty,
        levelPenalty: d.levelPenalty,
        wildcard: d.isWildcard ?? false,
        thinMarketSeeded: d.thinMarketSeeded ?? false,
        marketDemand: d.market.marketDemand,
        commonTitles: d.market.commonTitles,
        contractMix: d.market.contractMix,
        experienceMix: d.market.experienceMix,
        requirementProfile: d.market.requirementProfile,
        offerIds: d.market.offers.map((o) => o.id),
      })),
      suppressed: r.suppressed,
      heldBack: r.heldBack,
      honestFork: r.honestFork,
    };
    const json = JSON.stringify(fp, null, 1);
    writeFileSync(`${out}/${name}.json`, json);
    const hash = createHash("sha256").update(json).digest("hex").slice(0, 16);
    console.log(
      `${name.padEnd(20)} ${hash}  directions=${r.directions.length} suppressed=${r.suppressed.length}  ${Math.round(performance.now() - t)} ms`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
