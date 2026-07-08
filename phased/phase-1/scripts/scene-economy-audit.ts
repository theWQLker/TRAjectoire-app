/**
 * QUIZ SCENE-ECONOMY diagnostic (Step 6 family — measure, build nothing).
 *
 * Context: the coherence diagnostic proved there is NO generic bucket — broadening
 * is personal and coherent (0 universal directions). Two issues remain: (a) C1201
 * accueil/services clientèle leaks into 4/5 profiles; (b) the creative profile lacks
 * a coherent range. This diagnostic is about quiz ECONOMY: which of the 27 cognitive
 * scenes are redundant or noisy, ranked by UNIQUE discrimination — AND tracing the
 * two known issues to their scene/cluster source.
 *
 * Method (live graph, deterministic, cognitive-only — no seed):
 *   For each of the 5 profiles we build a BASE answer set, then perturb ONE scene
 *   at a time (drop it, and flip A<->B) and measure how the ranked top-K result
 *   set moves. A scene's "movement vector" is the set of result codes it adds/
 *   removes when toggled. From those vectors we derive:
 *
 *   1. REDUNDANCY — Jaccard correlation of scene movement vectors across profiles.
 *      Scene PAIRS whose drop/flip move the SAME result codes the SAME way always
 *      co-fire → one is cuttable dead weight.
 *   2. NOISE vs SIGNAL — per scene, do its A and B answers map to DISTINGUISHABLE
 *      result populations (low A∩B overlap = discriminating) or does it swing the
 *      set loudly without a recognizable A-vs-B difference (high churn, low
 *      separation = loud-but-not-discriminating = noise)?
 *   3. DISCRIMINATION VALUE — rank all 27 scenes by UNIQUE movement: the result
 *      codes a scene moves that NO other scene in that profile moves. Low unique =
 *      cut/merge candidate.
 *   4. TRACE — (a) which scenes/clusters inject C1201's accueil/service codes that
 *      leak into analytical/creative; (b) which scenes the creative profile relies
 *      on, and whether their clusters carry creative-distinctive codes or only
 *      generic-service ones (the vocab gap).
 *
 * Cut criteria = redundancy or noise ONLY, never adjacency. Length is a byproduct.
 *
 * Usage: ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *   node_modules/tsx/dist/cli.mjs scripts/scene-economy-audit.ts
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { buildInventory, type Answers } from "../src/lib/quiz/build-inventory";
import { buildResults, type ResultDirection } from "../src/lib/engine/results";
import { rankScore, rankNormalisers } from "../src/lib/engine/graph-direction-proposer";
import { CATEGORIES, type Lean } from "../config/quiz";
import { CLUSTERS } from "../config/clusters";

// ---------------------------------------------------------------------------
// PERF (read-only, semantics-preserving): buildResults() builds a FRESH
// LiveRomeSource/LiveOfferSource each call, so 400+ builds would each re-page
// the whole ROME graph from Postgres AND re-query offers per direction. The
// graph and the cached offers are IDENTICAL across reads within a run, so we
// memoise them at the PROTOTYPE level — every instance shares one primed graph
// snapshot and one (rome|dept)→offers cache. Engine code, classes, and the
// env-selected live sources are untouched; only the redundant I/O is shared.
// Determinism is preserved (same inputs → same reads → same outputs).
// ---------------------------------------------------------------------------
import { LiveRomeSource } from "../src/lib/rome";
import { LiveOfferSource } from "../src/lib/offers";

{
  // Graph snapshot: first real load fills SNAP; later instances copy it.
  let SNAP: Record<string, unknown> | null = null;
  const rproto = LiveRomeSource.prototype as unknown as { load: () => Promise<void> };
  const origLoad = rproto.load;
  rproto.load = async function (this: Record<string, unknown>) {
    if (this.cache) return;
    if (SNAP) { Object.assign(this, SNAP); return; }
    await origLoad.call(this);
    SNAP = {
      cache: this.cache, byCode: this.byCode, byCompetence: this.byCompetence,
      mobilityEdges: this.mobilityEdges, rarity: this.rarity,
    };
  };
  // Offer read memo: (rome|dept) → cached offers from current_offers.
  const oproto = LiveOfferSource.prototype as unknown as {
    fetchOffers: (rome: string, dept: string) => Promise<unknown>;
  };
  const origFetch = oproto.fetchOffers;
  const memo = new Map<string, Promise<unknown>>();
  oproto.fetchOffers = function (this: unknown, rome: string, dept: string) {
    const key = `${rome}|${dept}`;
    let p = memo.get(key);
    if (!p) { p = origFetch.call(this, rome, dept); memo.set(key, p); }
    return p;
  };
}

const OUT = "scripts/_scene-economy-out.txt";
writeFileSync(OUT, "");
const out = (l: string) => { process.stdout.write(l + "\n"); appendFileSync(OUT, l + "\n"); };

const TOPK = 20; // result window we watch move

const DOM: Record<string, string> = {
  A: "agriculture", B: "artisanat", C: "banque", D: "commerce", E: "communication",
  F: "BTP", G: "hôtellerie", H: "industrie", I: "maintenance", J: "santé",
  K: "services-personne", L: "spectacle", M: "support/admin/IT", N: "transport",
};

// The 27 cognitive scenes (those whose sides carry cluster maps). Cat 4/5 are
// constraint/financial only — excluded, they inject no cognitive signal.
const COGNITIVE_SCENES = CATEGORIES.flatMap((c) => c.scenes).filter(
  (s) => (s.optionA.maps.clusters?.length ?? 0) > 0 || (s.optionB.maps.clusters?.length ?? 0) > 0,
);

// code -> cluster ids (for trace)
const CODE_TO_CLUSTERS = new Map<string, string[]>();
for (const cl of CLUSTERS) for (const code of cl.competenceCodes) {
  CODE_TO_CLUSTERS.set(code, [...(CODE_TO_CLUSTERS.get(code) ?? []), cl.id]);
}

// 5 profiles — SAME shapes as the coherence diagnostic, so findings line up.
// Each profile leans hard one way; c_departement is the only non-cognitive key.
const PROFILES: { name: string; ans: Answers }[] = [
  { name: "hands-on/technical", ans: {
    sf_hands_organise: "plutot_a", sf_sell_fix: "plutot_b", sf_digital_tools: "plutot_b",
    f_order_improv: "plutot_b", g_teach_do: "plutot_b", f_energy_context: "plutot_b",
    sf_client_issue: "plutot_a", c_departement: "75",
  }},
  { name: "people/care", ans: {
    sf_numbers_people: "plutot_b", g_conflict: "plutot_a", g_teach_do: "plutot_a",
    sf_client_issue: "plutot_b", g_boundaries: "plutot_b", sf_write_explain: "plutot_b",
    g_hidden_need: "plutot_a", c_departement: "75",
  }},
  { name: "analytical/systems", ans: {
    f_surface_depth: "plutot_b", sf_data_files: "plutot_b", f_order_improv: "plutot_a",
    f_scale_task: "plutot_a", sf_digital_tools: "plutot_a", f_repeat_problem: "plutot_a",
    sf_numbers_people: "plutot_a", c_departement: "75",
  }},
  { name: "creative/expressive", ans: {
    sf_write_explain: "plutot_a", f_new_domain: "plutot_a", f_detail_big_picture: "plutot_b",
    f_leverage_completeness: "plutot_a", g_group_energy: "plutot_a", c_departement: "75",
  }},
  { name: "commercial/leadership", ans: {
    sf_sell_fix: "plutot_a", g_lead_support: "plutot_a", g_status_authority: "plutot_a",
    sf_commercial_signal: "plutot_a", f_decide_wait: "plutot_a", g_group_energy: "plutot_a",
    c_departement: "75",
  }},
];

const OPP: Record<Lean, Lean> = {
  plutot_a: "plutot_b", plutot_b: "plutot_a", un_peu_a: "un_peu_b",
  un_peu_b: "un_peu_a", les_deux: "les_deux", ni_l_un: "ni_l_un",
};

async function topCodes(ans: Answers, k = TOPK): Promise<string[]> {
  const r = await buildResults(buildInventory(ans));
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(r.directions as any);
  return [...r.directions]
    .map((d) => ({ d, s: rankScore(d as any, maxLean, maxInterest, maxRarity) }))
    .sort((a, b) => b.s - a.s).slice(0, k).map((x) => x.d.romeCode);
}
async function topDirs(ans: Answers, k = TOPK): Promise<ResultDirection[]> {
  const r = await buildResults(buildInventory(ans));
  const { maxLean, maxInterest, maxRarity } = rankNormalisers(r.directions as any);
  return [...r.directions]
    .map((d) => ({ d, s: rankScore(d as any, maxLean, maxInterest, maxRarity) }))
    .sort((a, b) => b.s - a.s).slice(0, k).map((x) => x.d);
}

const setOf = (a: string[]) => new Set(a);
const symDiff = (a: Set<string>, b: Set<string>) =>
  new Set([...a].filter((x) => !b.has(x)).concat([...b].filter((x) => !a.has(x))));
const jaccard = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 && b.size === 0) return 1;
  const inter = [...a].filter((x) => b.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni === 0 ? 0 : inter / uni;
};

type SceneMeasure = {
  scene: string;
  // movement when scene DROPPED, vs base, per profile (only profiles that answered it)
  dropMove: Map<string, Set<string>>;   // profile -> symdiff(base, base-without-scene)
  // result set under A vs B answer (held-out perturbation), per profile
  aSet: Map<string, Set<string>>;
  bSet: Map<string, Set<string>>;
};

async function main() {
  out("=".repeat(100));
  out(`QUIZ SCENE-ECONOMY DIAGNOSTIC — live graph, ${COGNITIVE_SCENES.length} cognitive scenes, top-${TOPK} window`);
  out("=".repeat(100));

  // base result codes per profile
  const base = new Map<string, Set<string>>();
  for (const p of PROFILES) base.set(p.name, setOf(await topCodes(p.ans)));

  // ---- measure each scene across the profiles that ANSWERED it --------------
  const measures: SceneMeasure[] = [];
  for (const scene of COGNITIVE_SCENES) {
    const m: SceneMeasure = { scene: scene.id, dropMove: new Map(), aSet: new Map(), bSet: new Map() };
    for (const p of PROFILES) {
      // A vs B separation: force this scene to A, then to B, holding all else of
      // the profile fixed. This isolates the scene's OWN A/B discrimination,
      // independent of whether the profile happened to answer it.
      const aAns = { ...p.ans, [scene.id]: "plutot_a" as string };
      const bAns = { ...p.ans, [scene.id]: "plutot_b" as string };
      m.aSet.set(p.name, setOf(await topCodes(aAns)));
      m.bSet.set(p.name, setOf(await topCodes(bAns)));

      // DROP movement only meaningful where the profile actually answered it.
      if (p.ans[scene.id]) {
        const dropped = { ...p.ans };
        delete dropped[scene.id];
        m.dropMove.set(p.name, symDiff(base.get(p.name)!, setOf(await topCodes(dropped))));
      }
    }
    measures.push(m);
  }

  // ===========================================================================
  // 2. NOISE vs SIGNAL — per scene, A-vs-B separation (averaged over profiles)
  //    churn = avg |symdiff(A,B)| (how loud), sep = avg (1 - jaccard(A,B))
  //    (how distinguishable). Loud-but-not-discriminating = high churn yet the
  //    A and B populations heavily overlap is impossible by construction; the
  //    real noise signal is: churn high but the SAME codes return for both
  //    extremes across profiles (low cross-profile consistency of direction).
  // ===========================================================================
  out("\n" + "=".repeat(100));
  out("2. NOISE vs SIGNAL — per scene A↔B answer separation (avg over 5 profiles)");
  out("   churn = avg # result codes that differ between A and B  (loudness)");
  out("   sep   = avg (1 − Jaccard(A,B))  in 0..1  (distinguishability; 1 = totally different people)");
  out("   FLAG noise = loud (churn ≥ 6) but low separation (sep < 0.45): swings the set without a clear A/B kind-of-person");
  out("=".repeat(100));
  type NS = { scene: string; churn: number; sep: number; noise: boolean };
  const ns: NS[] = measures.map((m) => {
    let churn = 0, sep = 0, n = 0;
    for (const p of PROFILES) {
      const a = m.aSet.get(p.name)!, b = m.bSet.get(p.name)!;
      churn += symDiff(a, b).size; sep += 1 - jaccard(a, b); n++;
    }
    churn /= n; sep /= n;
    return { scene: m.scene, churn, sep, noise: churn >= 6 && sep < 0.45 };
  });
  out("\n  scene                       churn    sep   flag");
  for (const x of [...ns].sort((a, b) => b.churn - a.churn)) {
    out(`  ${x.scene.padEnd(26)} ${x.churn.toFixed(1).padStart(5)}  ${x.sep.toFixed(2).padStart(5)}   ${x.noise ? "⚠ NOISE (loud, low-sep)" : ""}`);
  }
  const noisy = ns.filter((x) => x.noise);
  out(`\n  → ${noisy.length} noisy scene(s): ${noisy.map((x) => x.scene).join(", ") || "none"}`);
  const inert = ns.filter((x) => x.churn < 1.5);
  out(`  → ${inert.length} near-inert scene(s) (churn<1.5, barely move anything): ${inert.map((x) => x.scene).join(", ") || "none"}`);

  // ===========================================================================
  // 1. REDUNDANCY — scene PAIRS whose A↔B movement vector is the same lean.
  //    For each scene build a profile-averaged "lean vector" = codes that LEAVE
  //    on A→B (b-side gainers) vs codes that ARRIVE. Two scenes co-fire if their
  //    A↔B symdiff sets are highly similar (they move the same results together).
  // ===========================================================================
  out("\n" + "=".repeat(100));
  out("1. REDUNDANCY — scene PAIRS whose A↔B movement always moves the SAME results (co-firing)");
  out("   similarity = avg Jaccard of the two scenes' A↔B symdiff sets across profiles");
  out("   PAIR flagged when similarity ≥ 0.50 — one of the pair is cuttable dead weight");
  out("=".repeat(100));
  const moveVec = new Map<string, Map<string, Set<string>>>(); // scene -> profile -> symdiff(A,B)
  for (const m of measures) {
    const pm = new Map<string, Set<string>>();
    for (const p of PROFILES) pm.set(p.name, symDiff(m.aSet.get(p.name)!, m.bSet.get(p.name)!));
    moveVec.set(m.scene, pm);
  }
  type Pair = { a: string; b: string; sim: number };
  const pairs: Pair[] = [];
  for (let i = 0; i < measures.length; i++) for (let j = i + 1; j < measures.length; j++) {
    const sa = measures[i].scene, sb = measures[j].scene;
    let sim = 0, n = 0;
    for (const p of PROFILES) {
      const va = moveVec.get(sa)!.get(p.name)!, vb = moveVec.get(sb)!.get(p.name)!;
      if (va.size === 0 && vb.size === 0) continue; // both inert here — skip, no info
      sim += jaccard(va, vb); n++;
    }
    if (n > 0) pairs.push({ a: sa, b: sb, sim: sim / n });
  }
  const coFiring = pairs.filter((x) => x.sim >= 0.5).sort((a, b) => b.sim - a.sim);
  if (coFiring.length === 0) out("\n  NONE — no scene pair moves the same results together at ≥0.50. No redundant dead weight.");
  else {
    out(`\n  ${coFiring.length} co-firing pair(s):`);
    out("  sim    sceneA                      sceneB");
    for (const x of coFiring.slice(0, 25))
      out(`  ${x.sim.toFixed(2)}   ${x.a.padEnd(26)} ${x.b}`);
  }
  out("\n  (top non-flagged similarities, for context)");
  for (const x of pairs.sort((a, b) => b.sim - a.sim).slice(0, 8))
    out(`  ${x.sim.toFixed(2)}   ${x.a.padEnd(26)} ${x.b}`);

  // ===========================================================================
  // 3. DISCRIMINATION VALUE — rank scenes by UNIQUE movement. A scene's unique
  //    contribution = result codes its A↔B toggle moves that NO OTHER scene's
  //    A↔B toggle moves (in the same profile), averaged across profiles. High =
  //    irreplaceable; low = its movement is fully covered by other scenes (merge/cut).
  // ===========================================================================
  out("\n" + "=".repeat(100));
  out("3. DISCRIMINATION VALUE — scenes ranked by UNIQUE signal (movement no other scene explains)");
  out("   unique = avg # of A↔B-moved codes exclusive to this scene across profiles");
  out("   total  = avg # of A↔B-moved codes (its raw loudness, = churn)");
  out("   LOW unique with nonzero total ⇒ its movement is duplicated elsewhere → cut/merge candidate");
  out("=".repeat(100));
  type Disc = { scene: string; unique: number; total: number; ratio: number };
  const disc: Disc[] = measures.map((m) => {
    let uniq = 0, tot = 0;
    for (const p of PROFILES) {
      const mine = moveVec.get(m.scene)!.get(p.name)!;
      if (mine.size === 0) continue;
      const others = new Set<string>();
      for (const other of measures) if (other.scene !== m.scene)
        for (const c of moveVec.get(other.scene)!.get(p.name)!) others.add(c);
      const onlyMine = [...mine].filter((c) => !others.has(c)).length;
      uniq += onlyMine; tot += mine.size;
    }
    uniq /= PROFILES.length; tot /= PROFILES.length;
    return { scene: m.scene, unique: uniq, total: tot, ratio: tot === 0 ? 0 : uniq / tot };
  });
  out("\n  rank  scene                       unique  total  uniq/total");
  disc.sort((a, b) => b.unique - a.unique);
  disc.forEach((x, i) =>
    out(`  ${String(i + 1).padStart(2)}.   ${x.scene.padEnd(26)} ${x.unique.toFixed(2).padStart(6)} ${x.total.toFixed(1).padStart(6)}  ${x.ratio.toFixed(2).padStart(6)}`));
  const cutCandidates = disc.filter((x) => x.unique < 0.5 && x.total >= 1.5);
  out(`\n  → cut/merge candidates (unique<0.5 but total≥1.5 — loud yet duplicated): ${cutCandidates.map((x) => x.scene).join(", ") || "none"}`);
  const deadWeight = disc.filter((x) => x.total < 1.0);
  out(`  → dead-weight (total<1.0 — barely moves anything in any profile): ${deadWeight.map((x) => x.scene).join(", ") || "none"}`);

  // ===========================================================================
  // 4a. TRACE C1201 LEAK — which scenes/clusters inject the codes that pull
  //     C1201 (banking accueil/services clientèle) into analytical & creative.
  // ===========================================================================
  out("\n" + "=".repeat(100));
  out("4a. C1201 LEAK TRACE — the over-connection source");
  out("=".repeat(100));
  // C1201's matched codes in the analytical & creative result builds, and which
  // clusters + which answered scenes inject them.
  for (const pName of ["analytical/systems", "creative/expressive"]) {
    const p = PROFILES.find((x) => x.name === pName)!;
    const dirs = await topDirs(p.ans, 30);
    const c1201 = dirs.find((d) => d.romeCode === "C1201");
    out(`\n  [${pName}]`);
    if (!c1201) { out(`     C1201 not in top-30 here.`); continue; }
    out(`     C1201 present — matched ${c1201.matchedCompetenceCodes.length} of the user's codes:`);
    // For each matched code, which cluster owns it AND which answered scene-side
    // activated that cluster.
    const inv = buildInventory(p.ans);
    const activeClusters = new Set(Object.keys(inv.clusterScores));
    for (const code of c1201.matchedCompetenceCodes) {
      const owners = (CODE_TO_CLUSTERS.get(code) ?? []).filter((c) => activeClusters.has(c));
      if (owners.length === 0) continue; // matched via seed/other path
      // which answered scene side carries each owning cluster?
      const carriers: string[] = [];
      for (const sceneId of Object.keys(p.ans)) {
        const sc = COGNITIVE_SCENES.find((s) => s.id === sceneId);
        if (!sc) continue;
        const lean = p.ans[sceneId] as Lean;
        const sides: Array<["A" | "B", typeof sc.optionA]> = [];
        if (lean === "plutot_a" || lean === "un_peu_a" || lean === "les_deux") sides.push(["A", sc.optionA]);
        if (lean === "plutot_b" || lean === "un_peu_b" || lean === "les_deux") sides.push(["B", sc.optionB]);
        for (const [tag, side] of sides)
          for (const cw of side.maps.clusters ?? [])
            if (owners.includes(cw.id)) carriers.push(`${sceneId}/${tag}→${cw.id}`);
      }
      out(`       code ${code}  via cluster[${owners.join(",")}]  ← ${carriers.join("  ") || "(no answered scene — check)"}`);
    }
  }
  // Summary: the universal carrier codes/clusters
  out(`\n  KEY: code 300361 "Accueillir, orienter, renseigner un public" sits in BOTH`);
  out(`       'contact' and 'relation_client'. Any scene-side activating either cluster`);
  out(`       injects it. Scenes that carry those clusters:`);
  for (const clusterId of ["contact", "relation_client"]) {
    const carriers = COGNITIVE_SCENES.flatMap((s) => {
      const hits: string[] = [];
      for (const [tag, side] of [["A", s.optionA], ["B", s.optionB]] as const)
        if ((side.maps.clusters ?? []).some((cw) => cw.id === clusterId)) hits.push(`${s.id}/${tag}`);
      return hits;
    });
    out(`       ${clusterId}: ${carriers.join(", ")}`);
  }

  // ===========================================================================
  // 4b. CREATIVE GAP — which scenes the creative profile relies on, and whether
  //     their clusters carry creative-distinctive codes or only generic-service.
  // ===========================================================================
  out("\n" + "=".repeat(100));
  out("4b. CREATIVE GAP TRACE — the vocab-gap source");
  out("=".repeat(100));
  const creative = PROFILES.find((x) => x.name === "creative/expressive")!;
  const inv = buildInventory(creative.ans);
  out(`\n  creative answered ${Object.keys(creative.ans).filter((k) => k !== "c_departement").length} cognitive scenes.`);
  out(`  active clusters (lean>0): ${Object.entries(inv.clusterScores).sort((a,b)=>b[1]-a[1]).map(([c,s])=>`${c}:${s}`).join("  ")}`);
  out(`  competence codes injected: ${inv.competenceCodes.length}`);
  out(`\n  Per answered scene → clusters → codes, and a read on creative-distinctiveness:`);
  for (const sceneId of Object.keys(creative.ans)) {
    const sc = COGNITIVE_SCENES.find((s) => s.id === sceneId);
    if (!sc) continue;
    const lean = creative.ans[sceneId] as Lean;
    const side = lean.includes("_a") ? sc.optionA : lean.includes("_b") ? sc.optionB : null;
    if (!side) continue;
    const cls = (side.maps.clusters ?? []).map((c) => c.id);
    const codes = cls.flatMap((id) => CLUSTERS.find((c) => c.id === id)?.competenceCodes ?? []);
    out(`     ${sceneId} (${lean})  clusters=[${cls.join(",")}]  → ${codes.length} codes ${codes.length === 0 ? "‹EMPTY: RIASEC-only, no vocabulary›" : ""}`);
  }
  // Show creative's actual top-15 with domaines so the drift is visible.
  out(`\n  creative top-15 result (what it actually surfaces):`);
  const cdirs = await topDirs(creative.ans, 15);
  const byDom: Record<string, number> = {};
  for (const d of cdirs) byDom[d.romeCode[0]] = (byDom[d.romeCode[0]] ?? 0) + 1;
  out(`     domaine spread: ${Object.entries(byDom).sort((a,b)=>b[1]-a[1]).map(([L,n])=>`${DOM[L]??L}:${n}`).join("  ")}`);
  for (const d of cdirs) out(`     ${d.romeCode} ${DOM[d.romeCode[0]]?.padEnd(18)} ${d.title.slice(0, 46)}`);
  // How many of creative's injected codes are "creative-distinctive" vs generic?
  // Heuristic: ecriture/synthese/apprentissage/presentation/pedagogie vocab vs
  // contact/service/execution. Report cluster provenance of injected codes.
  out(`\n  injected-code provenance (which clusters supplied creative's vocabulary):`);
  const prov: Record<string, number> = {};
  for (const code of inv.competenceCodes)
    for (const cl of CODE_TO_CLUSTERS.get(code) ?? [])
      if (Object.keys(inv.clusterScores).includes(cl)) prov[cl] = (prov[cl] ?? 0) + 1;
  out(`     ${Object.entries(prov).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`${c}:${n}`).join("  ") || "(none — RIASEC-only)"}`);

  out("\n" + "=".repeat(100));
  out("DONE — see analysis. Build nothing.");
  out("=".repeat(100));
}

main().catch((e) => { console.error(e); process.exit(1); });
