/**
 * RESULTS TIMING — where does a /results render spend its time? Mirrors the page's
 * data path stage by stage (session-free: builds the inventory the smoke test
 * uses) and times each one against the live seams. No writes.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/results-timing.ts [seed=tech:code] [depts=75]
 */
import { getRomeSource } from "../src/lib/rome";
import { getOfferSource } from "../src/lib/offers";
import { GraphDirectionProposer } from "../src/lib/engine/graph-direction-proposer";
import { checkMarketAll } from "../src/lib/engine/market-reality";
import { buildResults } from "../src/lib/engine/results";
import { buildInventory, SEED_ANSWER_KEY } from "../src/lib/quiz/build-inventory";
import type { OfferSource } from "../src/lib/offers/offer-source";

const seed = process.argv[2] ?? "tech:code";
const depts = process.argv[3] ?? "75";
const ms = (t: number) => `${Math.round(performance.now() - t)} ms`;

async function main() {
  const inventory = buildInventory({ [SEED_ANSWER_KEY]: seed, c_departement: depts });
  const rome = getRomeSource();
  const offers = getOfferSource();

  let t = performance.now();
  await rome.allMetiers();
  console.log(`graph load (cold)          ${ms(t)}`);

  t = performance.now();
  const { surfaced, heldBack } = await new GraphDirectionProposer(rome).reach(inventory);
  console.log(`proposer.reach             ${ms(t)}  surfaced=${surfaced.length} heldBack=${heldBack.length}`);

  // Instrumented offer source: count queries, rows, payload, latency.
  const lat: number[] = [];
  let rows = 0, bytes = 0;
  const counted: OfferSource = {
    async fetchOffers(r, d) {
      const s = performance.now();
      const o = await offers.fetchOffers(r, d);
      lat.push(performance.now() - s);
      rows += o.length;
      bytes += JSON.stringify(o).length;
      return o;
    },
  };
  t = performance.now();
  await checkMarketAll(counted, surfaced, inventory.constraints.departements ?? [inventory.constraints.departement]);
  const sorted = [...lat].sort((a, b) => a - b);
  const p = (q: number) => Math.round(sorted[Math.floor(q * (sorted.length - 1))]);
  console.log(`checkMarketAll             ${ms(t)}  fetchOffers calls=${lat.length} rows=${rows} payload=${(bytes / 1e6).toFixed(1)} MB  latency p50=${p(0.5)} p90=${p(0.9)} max=${p(1)} ms`);

  // Full page data path, twice: the second call shows the per-process reuse.
  for (const label of ["buildResults (1st)", "buildResults (2nd)"]) {
    t = performance.now();
    const res = await buildResults(inventory);
    console.log(`${label.padEnd(26)} ${ms(t)}  directions=${res.directions.length} suppressed=${res.suppressed.length}`);
  }

}

main().catch((e) => { console.error(e); process.exit(1); });
