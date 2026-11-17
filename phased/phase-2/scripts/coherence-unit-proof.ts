/**
 * COHERENCE UNIT PROOF (no live graph). Asserts the pure coherence math:
 * cluster key, domain, both penalty formulas, i=0 invariant, monotonicity,
 * and the strength-attenuation guard. Exits non-zero on any failure.
 *
 * Usage: node node_modules/tsx/dist/cli.mjs scripts/coherence-unit-proof.ts
 */
import assert from "node:assert/strict";
import {
  clusterKey,
  domainOf,
  coherencePenalties,
  COHERENCE_K,
} from "../src/lib/engine/coherence";

type Row = { romeCode: string; rankScore: number };
const r = (romeCode: string, rankScore: number): Row => ({ romeCode, rankScore });

let passed = 0;
const ok = (name: string) => { passed++; process.stdout.write(`  ✓ ${name}\n`); };

// --- cluster key + domain ---
assert.equal(clusterKey("M1203"), "M12", "clusterKey slices 3 chars");
assert.equal(clusterKey("J1502"), "J15", "clusterKey J15");
assert.equal(domainOf("M1203"), "M", "domainOf slices 1 char");
ok("clusterKey / domainOf slice correctly");

// --- i=0 invariant: the best row of every cluster is untouched (penalty 0) ---
// One cluster J15 with three rows of descending rankScore.
const cluster = [r("J1501", 10), r("J1502", 8), r("J1503", 6)];
for (const formula of ["plain", "strength"] as const) {
  const p = coherencePenalties(cluster, formula);
  assert.equal(p.get(cluster[0]), 0, `${formula}: cluster head penalty is 0`);
}
ok("i=0 (cluster head) penalty is 0 for both formulas");

// --- plain: penalty is monotonic non-decreasing with intra-cluster index ---
{
  const p = coherencePenalties(cluster, "plain");
  assert.ok(p.get(cluster[1])! > 0, "plain: 2nd row penalised");
  assert.ok(p.get(cluster[2])! > p.get(cluster[1])!, "plain: deeper = larger penalty");
}
ok("plain penalty grows with intra-cluster index");

// --- strength: a deep row AS STRONG as its head keeps ~0 penalty ---
{
  // J-cluster where all three tie on rankScore (single-family survival case).
  const tied = [r("J1501", 10), r("J1502", 10), r("J1503", 10)];
  const p = coherencePenalties(tied, "strength");
  assert.equal(p.get(tied[1]), 0, "strength: deep row equal to head → penalty 0");
  assert.equal(p.get(tied[2]), 0, "strength: deep row equal to head → penalty 0");
  // plain would penalise them (proves the two formulas differ):
  const pp = coherencePenalties(tied, "plain");
  assert.ok(pp.get(tied[1])! > 0, "plain: same tied deep row IS penalised (formulas differ)");
}
ok("strength attenuation spares strong-but-deep rows; plain does not");

// --- separate clusters do not interfere; each has its own i=0 ---
{
  const mixed = [r("J1501", 9), r("J1502", 3), r("M1201", 8), r("M1202", 2)];
  const p = coherencePenalties(mixed, "plain");
  assert.equal(p.get(mixed[0]), 0, "J head untouched");
  assert.equal(p.get(mixed[2]), 0, "M head untouched");
  assert.ok(p.get(mixed[1])! > 0 && p.get(mixed[3])! > 0, "both cluster tails penalised");
}
ok("clusters are independent; each keeps its own head");

// --- penalties stay in [0,1] ---
{
  const big = Array.from({ length: 40 }, (_, i) => r(`J15${String(i).padStart(2, "0")}`, 100 - i));
  for (const formula of ["plain", "strength"] as const) {
    for (const [, v] of coherencePenalties(big, formula)) {
      assert.ok(v >= 0 && v <= 1, `${formula}: penalty in [0,1]`);
    }
  }
}
ok("penalties bounded in [0,1]");

// --- wildcard: dominant domain is the most-represented CLUSTER's domain ---
import { selectWildcard, WILDCARD_FLOOR_FRAC } from "../src/lib/engine/coherence";
{
  // J dominates (cluster J15 has 3 rows, the largest cluster). Top overall = J1501 (10).
  // Cross-domain candidates: M1805 (7), H2905 (2). Floor = 0.5·10 = 5 → M1805 qualifies.
  const dirs = [
    r("J1501", 10), r("J1502", 9), r("J1503", 8), // J15 cluster, size 3 → dominant
    r("M1805", 7),  // cross-domain, above floor
    r("H2905", 2),  // cross-domain, below floor
  ];
  const w = selectWildcard(dirs);
  assert.ok(w && w.romeCode === "M1805", "wildcard = highest-rankScore cross-domain above floor");
  ok("wildcard picks highest cross-domain above floor");
}

// --- wildcard: none when no cross-domain row clears the floor ---
{
  const dirs = [
    r("J1501", 10), r("J1502", 9), r("J1503", 8),
    r("H2905", 2), // cross-domain but 2 < 0.5·10 = 5
  ];
  assert.equal(selectWildcard(dirs), null, "no wildcard when nothing clears the floor");
  ok("no wildcard rather than a weak one");
}

// --- wildcard: none when everything is in the dominant domain ---
{
  const dirs = [r("J1501", 10), r("J1502", 9), r("J1403", 8)];
  assert.equal(selectWildcard(dirs), null, "no cross-domain candidate → null");
  ok("no wildcard when profile is single-domain");
}

// --- applyCoherence: composes penalty into coherenceRank and picks a wildcard ---
import { applyCoherence } from "../src/lib/engine/coherence";
{
  type D = { romeCode: string; rankScore: number; displayRank: number };
  const d = (romeCode: string, rankScore: number): D => ({ romeCode, rankScore, displayRank: rankScore });
  const dirs: D[] = [
    d("J1501", 10), d("J1502", 9), d("J1503", 8),
    d("M1805", 7),
  ];
  const { penalties, wildcard } = applyCoherence(dirs);
  // head untouched → coherenceRank == displayRank for J1501
  assert.equal(penalties.get(dirs[0]), 0, "applyCoherence: cluster head penalty 0");
  // wildcard is the cross-domain M1805
  assert.ok(wildcard && wildcard.romeCode === "M1805", "applyCoherence: wildcard = M1805");
  // coherenceRank = displayRank·(1−penalty) ≤ displayRank for every row
  for (const row of dirs) {
    const cr = row.displayRank * (1 - penalties.get(row)!);
    assert.ok(cr <= row.displayRank + 1e-9, "coherenceRank never exceeds displayRank");
  }
  ok("applyCoherence composes penalty + selects wildcard");
}

process.stdout.write(`\nCOHERENCE UNIT PROOF: ${passed} checks passed · COHERENCE_K=${COHERENCE_K}\n`);
