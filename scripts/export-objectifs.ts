/**
 * Export the 84 ROME competence "objectifs" (the capacity level the directions
 * prototype names directions with) to one CSV, current wording untouched, with
 * an empty short_name column to draft plain names in.
 *
 * Data: ROME open data CSV bundle (Licence Ouverte 2.0), extracted to a folder.
 * Usage:
 *   node node_modules/tsx/dist/cli.mjs scripts/export-objectifs.ts <romeCsvDir> <out.csv>
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function readCsv(file: string): Record<string, string>[] {
  const lines = readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const head = lines[0].slice(1, -1).split('","');
  return lines.slice(1).map((l) => {
    const cells = l.slice(1, -1).split('","');
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""]));
  });
}
const find = (dir: string, prefix: string) => {
  const f = readdirSync(dir).find((x) => x.startsWith(prefix));
  if (!f) throw new Error(`no ${prefix}* in ${dir}`);
  return path.join(dir, f);
};
const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;

const [dir, out] = process.argv.slice(2);
if (!dir || !out) throw new Error("usage: export-objectifs.ts <romeCsvDir> <out.csv>");

const version = readFileSync(path.join(dir, "version.txt"), "utf8");
const num = version.match(/Numero de version : (\d+)/)?.[1] ?? "?";
const pub = version.match(/Date de publication : ([\d/]+)/)?.[1] ?? "?";
const source = `France Travail, ROME 4.0 version ${num}, publiée le ${pub} (Licence Ouverte 2.0)`;

type Obj = { objectif: string; enjeu: string; domaine: string; macros: Map<string, { label: string; n: number }>; comps: Set<string> };
const objs = new Map<string, Obj>();
for (const r of readCsv(find(dir, "unix_arborescence_competences_"))) {
  const o = objs.get(r.code_objectif) ?? {
    objectif: r.objectif.trim(),
    enjeu: r.enjeu.trim(),
    domaine: r.domaine_competence.trim(),
    macros: new Map(),
    comps: new Set<string>(),
  };
  const m = o.macros.get(r.code_macro_competence) ?? { label: r.libelle_macro_competence.trim(), n: 0 };
  m.n++;
  o.macros.set(r.code_macro_competence, m);
  o.comps.add(r.code_ogr_competence);
  objs.set(r.code_objectif, o);
}

const rows = [
  ["code_objectif", "objectif", "enjeu", "domaine_competence", "macro_competences", "competences", "exemple_macro_competence", "short_name", "source"].map(q).join(","),
  ...[...objs.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr", { numeric: true }))
    .map(([code, o]) => {
      const biggest = [...o.macros.values()].sort((a, b) => b.n - a.n)[0];
      return [code, o.objectif, o.enjeu, o.domaine, o.macros.size, o.comps.size, biggest?.label ?? "", "", source].map(q).join(",");
    }),
];
// BOM so Excel opens the accents correctly.
writeFileSync(out, "﻿" + rows.join("\r\n") + "\r\n");
console.log(`wrote ${objs.size} objectifs to ${out}`);
