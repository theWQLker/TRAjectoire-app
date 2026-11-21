/**
 * Rendered-copy scan (results noise cleanup, 2026-11-21): renders every
 * user-facing page for real sessions and counts long dashes (U+2014) and " · "
 * separators in the visible text. Text taken from France Travail data (ad
 * titles, ad skill labels, ROME titles) cannot be edited (licence), so hits are
 * split into "our copy" and "source data" by checking each hit's sentence
 * against the data strings shown on that page.
 *
 *   ROME_SOURCE=live OFFER_SOURCE=live node --env-file=.env.local \
 *     node_modules/tsx/dist/cli.mjs scripts/copy-scan.ts   (BASE=http://localhost:3101 to change port)
 *
 * Creates throwaway sessions and deletes them. Local build only (target-guard).
 */
import { getSupabaseServiceClient } from "../src/lib/supabase";
import { buildInventory, SEED_ANSWER_KEY } from "../src/lib/quiz/build-inventory";
import { themeAnswers } from "./theme-personas";
import { resolveTarget } from "./target-guard";

const BASE = resolveTarget(process.env.BASE);

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&#x27;|&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/** <title> and meta content count as copy too. */
function metaText(html: string): string {
  const t = /<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? "";
  const d = /<meta name="description" content="([^"]*)"/i.exec(html)?.[1] ?? "";
  return `${t} ${d}`;
}

async function makeSession(answers: Record<string, string>): Promise<string> {
  const inventory = buildInventory(answers);
  const { data, error } = await getSupabaseServiceClient()
    .from("quiz_sessions")
    .insert({ answers, inventory, constraints: inventory.constraints, financial_inputs: {} })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

type Hit = { page: string; kind: "dash" | "dot"; context: string };

async function main() {
  const sessions = {
    tech: await makeSession({ [SEED_ANSWER_KEY]: "tech:code", c_departement: "75" }),
    quiz: await makeSession(themeAnswers({ id: "q", label: "q", theme: "analyse", diploma: "bac3" })),
    multi: await makeSession({ [SEED_ANSWER_KEY]: "tech:code", c_departement: "75,93" }),
  };
  const hits: Hit[] = [];
  const pages: string[] = [];
  const seen = new Set<string>();

  const scan = async (path: string) => {
    if (seen.has(path)) return "";
    seen.add(path);
    const res = await fetch(BASE + path);
    const html = await res.text();
    if (res.status !== 200) throw new Error(`${path}: status ${res.status}`);
    pages.push(path);
    const text = `${metaText(html)} ${visibleText(html)}`;
    for (const [re, kind] of [[/—/g, "dash"], [/ · /g, "dot"]] as const) {
      for (const m of text.matchAll(re)) {
        hits.push({ page: path, kind, context: text.slice(Math.max(0, m.index! - 50), m.index! + 50).trim() });
      }
    }
    return html;
  };

  await scan("/");
  await scan("/quiz");
  for (const [name, id] of Object.entries(sessions)) {
    const html = await scan(`/results?session=${id}`);
    const links = [...new Set([...html.matchAll(/href="(\/results\/[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")))];
    // every bucket page, the held-back list, and up to 4 directions + their ads
    const buckets = links.filter((l) => l.startsWith("/results/pistes/"));
    const directions = links.filter((l) => l.startsWith("/results/direction/")).slice(0, 4);
    const offers = links.filter((l) => l.startsWith("/results/offers/")).slice(0, 3);
    for (const l of [...buckets, ...directions, ...offers]) {
      const h = await scan(l);
      if (l.startsWith("/results/direction/")) {
        const more = [...h.matchAll(/href="(\/results\/offers\/[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
        for (const o of more.slice(0, 1)) await scan(o);
      }
    }
    console.log(`${name}: scanned`);
  }

  const db = getSupabaseServiceClient();
  await db.from("quiz_sessions").delete().in("id", Object.values(sessions));

  console.log(`\n${pages.length} pages scanned`);
  const dash = hits.filter((h) => h.kind === "dash");
  const dot = hits.filter((h) => h.kind === "dot");
  console.log(`U+2014: ${dash.length}   " · ": ${dot.length}`);
  for (const h of hits.slice(0, 40)) console.log(`  [${h.kind}] ${h.page.slice(0, 60)}  …${h.context}…`);
  process.exit(hits.length === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
