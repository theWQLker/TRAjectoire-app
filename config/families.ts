/**
 * Front-door FAMILIES + DEPTH sub-choices (BUILD_BRIEF §4 front-door design).
 *
 * The cognitive quiz captures HOW someone works, but maps a person's answers
 * onto generic transversal competence codes — so a developer's inventory holds
 * "concevoir des tableaux de bord", never "déployer le code", and the engine
 * funnels them to office jobs (the dev landed at #82, see the dev-persona test).
 *
 * A FAMILY is a broad ROME job-family ("Informatique & numérique"); a DEPTH is a
 * specific niche inside it ("Développer / coder"). When a user picks a depth at
 * quiz start, we SEED that niche's REAL distinctive competence codes into the
 * inventory — additively, never as a gate. Seed ≠ filter: cross-domain bridges
 * and the firehose guard stay intact (a seeded dev still surfaces the analyst
 * bridges they share skills with). Phase-1 rarity-weighting then lifts the
 * seeded job, because these codes are maximally rare (idf ≈ 6.8).
 *
 * EVERY code below is a REAL France Travail competence code, mined from the live
 * rome_job_competences graph (the union of the niche's member jobs, distinctive
 * codes only) and verified present in rome_competences — ZERO fabricated (the
 * prime directive). Re-mine with the seed-design miner if the graph is re-ingested.
 *
 * STATUS: tech→code is the first proven family (the §4 front-door proof). The
 * remaining families follow the identical niche-union pattern; they are added
 * one at a time, each proven with the dev-persona test, before rollout.
 */

export type Depth = {
  /** stable id used as the quiz answer key suffix (e.g. seed_tech_code) */
  id: string;
  label: string;
  /** REAL distinctive ROME competence codes this niche seeds (verified, never fabricated) */
  seedCodes: string[];
};

export type Family = {
  id: string;
  label: string;
  /** ROME grands domaines this family draws from (documentation/coverage) */
  domaines: string;
  depths: Depth[];
};

// ---------------------------------------------------------------------------
// tech → code: union of the M18xx "développement / études & applications"
// niche (M1805 Développeur, M1855 Développeur web, M1806 Consultant fonctionnel
// SI, M1821 Analyste d'application, M1844 Responsable études & applications),
// distinctive codes only (idf above the generic cutoff). 198 codes, 0 fabricated.
// ---------------------------------------------------------------------------
const TECH_CODE_SEED: string[] = [
  "486516","486521","486523","486526","481376","491491","501944","403029","480180","503744","120347","496416","493976","481370","478766","486520","522155","113298","481375","484120","478799","478798","482267","520340","511054","480181","503735","507960","405431","503742","502632","400454","484119","484914","484405","484038","113281","122793","486524","511842","124835","480869","486880","505243","491555","484402","486495","486517","113850","484482","120712","479254","521177","400285","300187","102789","113815","484481","404223","486791","495011","491513","478664","479231","491537","482808","120451","480213","478667","486790","485330","491556","403361","113312","400184","109979","477439","106845","478624","490266","503739","494049","404167","119711","491246","491512","481378","400165","402002","494626","109797","505217","479269","485223","486412","478631","109845","300641","491029","121054","121262","109531","104582","113330","109846","403905","300688","119712","491536","400478","477660","300246","300083","514503","485121","300393","404081","113317","402277","491244","300204","300203","506486","404136","126535","300586","109862","491028","102788","120803","300199","400796","300082","403448","491241","400775","300202","400145","300196","400192","491033","300679","400199","118238","113277","400176","300406","300200","491032","113798","400759","300615","300353","106861","400367","109854","300587","404053","481371","113255","109794","102732","300398","109779","491243","491245","491242","121126","121931","300150","300001","300019","300183","483667","119308","300472","300080","106844","491247","110150","300242","300322","300185","300458","300126","300411","300081","300067","404783","300450","300188","300339","300469","300022","300488","300021","300497","300461",
];

export const FAMILIES: Family[] = [
  {
    id: "tech",
    label: "Informatique & numérique",
    domaines: "M (informatique) / I (maintenance informatique)",
    depths: [
      { id: "code", label: "Développer / coder", seedCodes: TECH_CODE_SEED },
      // sysadmin / support / data depths follow once tech→code is judged.
    ],
  },
  // Other families (trades, health, logistics, …) added one at a time, each
  // proven with the dev-persona test before rollout.
];

/** Resolve the seed codes for a list of picked "familyId:depthId" tokens. */
export function seedCodesFor(picks: string[]): string[] {
  const out = new Set<string>();
  for (const pick of picks) {
    const [familyId, depthId] = pick.split(":");
    const fam = FAMILIES.find((f) => f.id === familyId);
    const depth = fam?.depths.find((d) => d.id === depthId);
    if (depth) for (const code of depth.seedCodes) out.add(code);
  }
  return [...out];
}
