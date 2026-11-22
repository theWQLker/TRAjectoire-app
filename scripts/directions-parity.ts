/**
 * Port proof: the engine's directions layer (src/lib/engine/directions.ts)
 * gives exactly what the v7 prototype (scripts/directions-prototype.ts) gives,
 * on the same 66 personas (10 report personas, one quiz-only persona per
 * theme, every seed depth alone).
 *
 * Compared per persona: each direction's capacity, second capacity, kind,
 * evidence, answer scenes, member roles (attached or not) and quoted answers,
 * in order; the dropped groups and why; Autres pistes and the faible count.
 *
 * Usage (live sources only; fixtures never count as evidence):
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/directions-parity.ts <romeCsvDir>
 */
import { buildInventory } from "../src/lib/quiz/build-inventory";
import { buildResults } from "../src/lib/engine/results";
import { computeDirections, type Directions } from "../src/lib/engine/directions";
import { FAMILIES } from "../config/families";
import { analyse, loadRome, PERSONAS } from "./directions-prototype";
import { QUIZ_ONLY, themeAnswers, type ThemePersona } from "./theme-personas";

type Proto = Awaited<ReturnType<typeof analyse>>;

const protoKind = (k: string | null) => (k === "révélée" ? "revelee" : k === "continuité" ? "continuite" : null);

function fromProto(r: Proto) {
  return {
    directions: r.directions.map((d) => ({
      capacity: d.capacities[0],
      second: d.capacities[1] ?? null,
      kind: protoKind(d.kind),
      evidence: d.evidence,
      scenes: d.answerScenes,
      roles: d.roles.map((x) => x.d.romeCode),
      attached: d.attached,
      answers: d.answers.map((a) => `${a.src.scene}|${a.src.option}|${a.skills}`),
    })),
    dropped: r.dropped.map((d) => `${d.capacities[0]}:${d.thin?.startsWith("révélée") ? "revealed-scenes" : "evidence"}`),
    others: r.othersShown.map((x) => x.d.romeCode),
    faible: r.othersFaible,
  };
}

function fromEngine(r: Directions) {
  return {
    directions: r.directions.map((d) => ({
      capacity: d.capacity,
      second: d.second?.capacity ?? null,
      kind: d.kind,
      evidence: d.evidence,
      scenes: d.answerScenes,
      roles: d.roles.map((m) => m.role.romeCode),
      attached: d.roles.filter((m) => m.attached).length,
      answers: d.answers.map((a) => `${a.sceneId}|${a.option}|${a.skills}`),
    })),
    dropped: r.dropped.map((d) => `${d.capacity}:${d.reason.kind}`),
    others: r.others.map((x) => x.romeCode),
    faible: r.othersFaible.length,
  };
}

async function main() {
  const [dir] = process.argv.slice(2);
  if (!dir) throw new Error("usage: directions-parity.ts <romeCsvDir>");
  if (process.env.ROME_SOURCE !== "live" || process.env.OFFER_SOURCE !== "live")
    throw new Error("parity runs on ROME_SOURCE=live OFFER_SOURCE=live only");
  const rome = loadRome(dir);
  const personas: ThemePersona[] = [
    ...PERSONAS,
    ...QUIZ_ONLY,
    ...FAMILIES.flatMap((f) =>
      f.depths.map((d) => ({ id: `seed ${f.id}:${d.id}`, label: "seed seul", theme: "none", seed: `${f.id}:${d.id}`, diploma: "bac2" })),
    ),
  ];
  let same = 0;
  const diffs: string[] = [];
  let dirs = 0;
  for (const p of personas) {
    const proto = fromProto(await analyse(p, rome));
    const answers = themeAnswers(p);
    const results = await buildResults(buildInventory(answers));
    const engine = fromEngine(await computeDirections(results, answers));
    dirs += engine.directions.length;
    const a = JSON.stringify(proto);
    const b = JSON.stringify(engine);
    if (a === b) same++;
    else diffs.push(`${p.id}\n  prototype: ${a.slice(0, 600)}\n  engine:    ${b.slice(0, 600)}`);
  }
  console.log(`DIRECTIONS PARITY: ${same}/${personas.length} personas identical (${dirs} directions)`);
  for (const d of diffs) console.log(d);
  process.exit(same === personas.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
