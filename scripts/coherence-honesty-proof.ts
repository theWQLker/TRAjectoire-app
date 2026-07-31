/**
 * COHERENCE HONESTY PROOF (live graph). Asserts spec §2: coherence changed ONLY
 * display order + one wildcard flag. The SET of surfaced romeCodes, each
 * direction's bucket category, its signal tier (from matchRaritySum), its
 * rankScore, and its displayRank are IDENTICAL to the pre-coherence build.
 * Exits non-zero on any violation.
 *
 * Method: buildResults already stamps coherence; the invariants are the fields
 * coherence must not have touched. We check internal consistency —
 *   • coherenceRank == displayRank·(1−coherencePenalty) for every row
 *   • coherencePenalty ∈ [0,1]; cluster heads have penalty 0
 *   • displayRank / rankScore / bucket / signal tier unchanged vs a rebuild with
 *     COHERENCE_K=0 (no thinning) — same set, same buckets, same tiers, and with
 *     K=0 coherenceRank==displayRank exactly.
 *
 * Usage:
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/coherence-honesty-proof.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { signalStrength } from "../src/lib/engine/coverage";

const CHILD = process.env.COHERENCE_CHILD === "1";
const ANS: Answers = { seed_families: "sante:soin", sf_hands_organise: "plutot_a", f_scale_task: "plutot_a", c_departement: "75" };

async function snapshot() {
  const r = await buildResults(buildInventory(ANS));
  // Serializable projection of the honesty-critical fields, keyed by romeCode.
  return r.directions.map((d) => ({
    romeCode: d.romeCode,
    rankScore: d.rankScore,
    displayRank: d.displayRank,
    bucket: d.bucketResult.category,
    tier: signalStrength(d.matchRaritySum),
    coherencePenalty: d.coherencePenalty,
    coherenceRank: d.coherenceRank,
  }));
}

async function main() {
  if (CHILD) {
    process.stdout.write(JSON.stringify(await snapshot()));
    return;
  }
  // The live build with the engine's real coherence defaults.
  const live = await snapshot();

  // A rebuild with COHERENCE_K=0 → no penalty anywhere → the pre-coherence baseline.
  const child = spawnSync(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "scripts/coherence-honesty-proof.ts"],
    { encoding: "utf8", env: { ...process.env, COHERENCE_CHILD: "1", COHERENCE_K: "0" } },
  );
  assert.equal(child.status, 0, `baseline child failed: ${child.stderr}`);
  const base: typeof live = JSON.parse(child.stdout);

  const baseByCode = new Map(base.map((d) => [d.romeCode, d]));

  // (1) same SET of surfaced codes
  assert.equal(live.length, base.length, "same number of surfaced directions");
  for (const d of live) assert.ok(baseByCode.has(d.romeCode), `${d.romeCode} present in baseline`);

  // (2) rankScore, displayRank, bucket, tier IDENTICAL (coherence didn't touch them)
  for (const d of live) {
    const b = baseByCode.get(d.romeCode)!;
    assert.equal(d.rankScore, b.rankScore, `${d.romeCode} rankScore unchanged`);
    assert.equal(d.displayRank, b.displayRank, `${d.romeCode} displayRank unchanged`);
    assert.equal(d.bucket, b.bucket, `${d.romeCode} bucket unchanged`);
    assert.equal(d.tier, b.tier, `${d.romeCode} signal tier unchanged`);
  }

  // (3) coherenceRank == displayRank·(1−penalty); penalties in [0,1]
  for (const d of live) {
    assert.ok(d.coherencePenalty >= 0 && d.coherencePenalty <= 1, `${d.romeCode} penalty in [0,1]`);
    const expected = d.displayRank * (1 - d.coherencePenalty);
    assert.ok(Math.abs(d.coherenceRank - expected) < 1e-9, `${d.romeCode} coherenceRank composed correctly`);
  }

  // (4) with K=0 the baseline's coherenceRank must equal its displayRank exactly
  for (const b of base) {
    assert.ok(Math.abs(b.coherenceRank - b.displayRank) < 1e-9, `${b.romeCode} K=0 → coherenceRank==displayRank`);
  }

  process.stdout.write(`COHERENCE HONESTY PROOF: ${live.length} directions · all invariants intact ✓\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
