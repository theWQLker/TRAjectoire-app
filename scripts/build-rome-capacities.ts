/**
 * Build config/rome-capacities.json from the ROME open-data CSV bundle
 * (France Travail, Licence Ouverte 2.0):
 * https://api.francetravail.fr/api-nomenclatureemploi/v1/open-data/csv
 *
 * The directions layer (src/lib/engine/directions.ts) groups roles by ROME
 * "objectif", the capacity level above the macro-competences. The live graph
 * (rome_job_competences) holds competence codes only, so this file maps each
 * competence and macro-competence code to its objectif, and each domaine
 * professionnel (3-char ROME prefix) to its label (sector rows).
 *
 * Deterministic: same bundle → byte-identical file. Re-run when the ROME
 * version changes, alongside scripts/import-rome-appellations.ts.
 *
 * Usage:
 *   node node_modules/tsx/dist/cli.mjs scripts/build-rome-capacities.ts <romeCsvDir>
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function readCsv(file: string): string[][] {
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((l) => l.slice(1, -1).split('","'));
}

function romeFile(dir: string, prefix: string): string {
  const f = readdirSync(dir).find((x) => x.startsWith(prefix));
  if (!f) throw new Error(`ROME open data: no ${prefix}* in ${dir}`);
  return path.join(dir, f);
}

// "Mettre en oeuvre…" → "Mettre en œuvre…", the spelling the naming draft uses.
const objectifLabel = (s: string) => s.replace(/\s+/g, " ").replace(/\boeuvre/g, "œuvre").trim();

function main() {
  const [dir] = process.argv.slice(2);
  if (!dir) throw new Error("usage: build-rome-capacities.ts <romeCsvDir>");

  const version = /Numero de version\s*:\s*(\d+)/.exec(readFileSync(path.join(dir, "version.txt"), "utf8"))?.[1];
  const published = /Date de publication\s*:\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(
    readFileSync(path.join(dir, "version.txt"), "utf8"),
  );
  if (!version || !published) throw new Error("version.txt: no version number or publication date");

  const objectifs: Record<string, string> = {};
  const capacity: Record<string, string> = {};
  for (const r of readCsv(romeFile(dir, "unix_arborescence_competences_"))) {
    // [.., code_objectif 4, objectif 5, .., code_ogr_macro 7, .., code_ogr_competence 9, ..]
    const [obj, label, macro, comp] = [r[4], r[5], r[7], r[9]];
    if (!obj || !label) throw new Error(`arborescence row without objectif: ${r.join("|").slice(0, 80)}`);
    const clean = objectifLabel(label);
    if (objectifs[obj] && objectifs[obj] !== clean) throw new Error(`objectif ${obj} has two labels`);
    objectifs[obj] = clean;
    for (const code of [macro, comp]) {
      if (!code) continue;
      if (capacity[code] && capacity[code] !== obj) throw new Error(`code ${code} sits under two objectifs`);
      capacity[code] = obj;
    }
  }

  const domaines: Record<string, string> = {};
  for (const r of readCsv(romeFile(dir, "unix_domaine_professionnel_"))) domaines[r[0]] = r[1];

  const sorted = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  const out = {
    source: "ROME open data, France Travail, Licence Ouverte 2.0",
    romeVersion: Number(version),
    publishedOn: `${published[3]}-${published[2]}-${published[1]}`,
    objectifs: sorted(objectifs),
    domaines: sorted(domaines),
    capacity: sorted(capacity),
  };
  const file = path.join(process.cwd(), "config", "rome-capacities.json");
  writeFileSync(file, JSON.stringify(out) + "\n");
  console.log(
    `wrote ${file}: ROME v${out.romeVersion} (${out.publishedOn}), ${Object.keys(objectifs).length} objectifs, ` +
      `${Object.keys(capacity).length} codes, ${Object.keys(domaines).length} domaines professionnels`,
  );
}

main();
