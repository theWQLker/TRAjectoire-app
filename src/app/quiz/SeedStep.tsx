"use client";

import { Fragment, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  Factory,
  HardHat,
  HeartPulse,
  Landmark,
  Laptop,
  Megaphone,
  Palette,
  Scale,
  Shield,
  ShoppingBag,
  Sparkles,
  Sprout,
  Truck,
  Users,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FAMILIES, type Family } from "../../../config/families";

/**
 * Seed step-0 (BUILD_BRIEF §4 front door). Rendered FIRST, before the cognitive
 * chapters: "Qu'avez-vous concrètement fait ?" The user picks one or more job
 * FAMILIES, then one or more DEPTH niches per picked family. The selected
 * "familyId:depthId" tokens are written to answers[SEED_ANSWER_KEY] so
 * buildInventory seeds the niche's real distinctive competence codes — additive,
 * never a filter.
 *
 * Layout (redesign 2026-11-24, docs/design/2026-11-24_seed-step-mockup.html):
 * the question first, one short intro, a 2-column grid of the 17 families in
 * alphabetical order (display order only: tokens are still serialized in
 * FAMILIES order), and a sticky bar that carries « Facultatif » / the count and
 * the one action (« Passer cette étape » with nothing picked, else « Continuer »).
 * A picked family's depth chips open in a full-width panel under its tile's row
 * (George, 2026-11-24, overriding the mockup's separate depth step).
 *
 * OPTIONAL: a foggy user with no clear "what I've done" skips straight to the
 * cognitive quiz (no token → seed-less → identical to the pre-seed behaviour).
 *
 * State lives on the parent's `answers` object (same store the quiz uses), read
 * back from the token string so this component is stateless — matches the
 * config-driven, single-source-of-truth pattern of the rest of the flow.
 */

/** One icon per family (display only). */
const FAMILY_ICONS: Record<string, LucideIcon> = {
  admin: Briefcase,
  agriculture: Sprout,
  artisanat: Palette,
  banque: Landmark,
  commerce: ShoppingBag,
  communication: Megaphone,
  btp: HardHat,
  droit: Scale,
  hotellerie: Utensils,
  industrie: Factory,
  tech: Laptop,
  maintenance: Wrench,
  proprete: Sparkles,
  sante: HeartPulse,
  securite: Shield,
  social: Users,
  transport: Truck,
};

/** The grid's rows: families in alphabetical order (no implied priority), two per row. */
const ROWS: Family[][] = (() => {
  const sorted = [...FAMILIES].sort((a, b) => a.label.localeCompare(b.label, "fr"));
  const rows: Family[][] = [];
  for (let i = 0; i < sorted.length; i += 2) rows.push(sorted.slice(i, i + 2));
  return rows;
})();

/**
 * Parse the token string ("tech:code,tech:reseaux,sante:soin") into a
 * familyId→depthId[] map. A family can now carry MULTIPLE picked depths — the
 * engine's seedCodesFor unions per token, so this is a pure UI capability.
 */
function parsePicks(value: string | undefined): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const tok of (value ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const [fam, depth] = tok.split(":");
    if (fam && depth) (out[fam] ??= []).push(depth);
  }
  return out;
}

/**
 * Serialize the map back to the token string, in FAMILIES order then each
 * family's config depth order (deterministic — same shape the engine parses).
 */
function serialize(picks: Record<string, string[]>): string {
  const toks: string[] = [];
  for (const f of FAMILIES) {
    const chosen = picks[f.id];
    if (!chosen?.length) continue;
    for (const d of f.depths) if (chosen.includes(d.id)) toks.push(`${f.id}:${d.id}`);
  }
  return toks.join(",");
}

// --- exclusions: "pickToken=rome1,rome2;otherPick=rome3" ---------------------
function parseExclusions(value: string | undefined): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const e of (value ?? "").split(";").map((s) => s.trim()).filter(Boolean)) {
    const [pick, romes] = e.split("=");
    if (pick && romes) out[pick] = romes.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return out;
}
function serializeExclusions(ex: Record<string, string[]>): string {
  return Object.entries(ex)
    .filter(([, romes]) => romes.length > 0)
    .map(([pick, romes]) => `${pick}=${romes.join(",")}`)
    .join(";");
}

export function SeedStep({
  value,
  onChange,
  exclusionsValue,
  onExclusionsChange,
  onContinue,
  onSkip,
}: {
  value: string | undefined;
  onChange: (tokens: string) => void;
  exclusionsValue: string | undefined;
  onExclusionsChange: (tokens: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const picks = parsePicks(value);
  const exclusions = parseExclusions(exclusionsValue);
  // which depths have their "à écarter ?" panel open (opt-in; local UI state only)
  const [refineOpen, setRefineOpen] = useState<Record<string, boolean>>({});

  // Toggle a family tile on/off. On → select its FIRST depth (a pick is never
  // left half-made). Off → drop the family and all its depths' exclusions.
  function toggleFamily(famId: string) {
    const next = { ...picks };
    if (next[famId]?.length) {
      delete next[famId];
      dropFamilyExclusions(famId);
    } else {
      const fam = FAMILIES.find((f) => f.id === famId);
      const first = fam?.depths[0]?.id;
      if (first) next[famId] = [first];
    }
    onChange(serialize(next));
  }

  // Toggle one depth chip within a family (multi-select). Checking any depth
  // auto-selects the family; unchecking the LAST depth deselects the family.
  function toggleDepth(famId: string, depthId: string) {
    const cur = new Set(picks[famId] ?? []);
    if (cur.has(depthId)) {
      cur.delete(depthId);
      // this depth's niche is gone → drop its exclusions.
      dropExclusion(`${famId}:${depthId}`);
    } else {
      cur.add(depthId);
    }
    const next = { ...picks };
    if (cur.size === 0) delete next[famId];
    else next[famId] = [...cur];
    onChange(serialize(next));
  }

  // Drop the stored exclusions for one pick token (a deselected niche).
  function dropExclusion(pick: string) {
    if (!exclusions[pick]) return;
    const nextEx = { ...exclusions };
    delete nextEx[pick];
    onExclusionsChange(serializeExclusions(nextEx));
  }

  // Drop exclusions for every pick token under a family (a deselected family).
  function dropFamilyExclusions(famId: string) {
    const nextEx = { ...exclusions };
    let changed = false;
    for (const key of Object.keys(nextEx))
      if (key.startsWith(`${famId}:`)) {
        delete nextEx[key];
        changed = true;
      }
    if (changed) onExclusionsChange(serializeExclusions(nextEx));
  }

  // toggle a member job as "pas pour moi" within a picked niche.
  function toggleReject(pick: string, rome: string) {
    const cur = new Set(exclusions[pick] ?? []);
    if (cur.has(rome)) cur.delete(rome);
    else cur.add(rome);
    onExclusionsChange(serializeExclusions({ ...exclusions, [pick]: [...cur] }));
  }

  const pickedCount = Object.keys(picks).length;

  function tile(fam: Family) {
    const isOn = (picks[fam.id]?.length ?? 0) > 0;
    const Icon = FAMILY_ICONS[fam.id] ?? Briefcase;
    return (
      <button
        key={fam.id}
        type="button"
        onClick={() => toggleFamily(fam.id)}
        aria-pressed={isOn}
        className={[
          "relative flex min-h-[84px] flex-col items-start gap-2 rounded-lg text-left transition-colors",
          isOn
            ? "border-2 border-blue bg-blue-soft p-[11px]"
            : "border border-border bg-surface p-3 hover:border-blue/40",
        ].join(" ")}
      >
        {isOn && (
          <span
            className="absolute right-2 top-2 grid h-[18px] w-[18px] place-items-center rounded-full bg-blue text-white"
            aria-hidden
          >
            <Check size={11} strokeWidth={3.5} />
          </span>
        )}
        <Icon size={24} strokeWidth={1.8} aria-hidden className={isOn ? "text-blue" : "text-text"} />
        <span className="line-clamp-2 text-[15px] leading-[1.3] text-navy">{fam.label}</span>
      </button>
    );
  }

  // Full-width panel under the tile's row: the picked family's depth chips, then
  // the opt-in « à écarter ? » list per picked depth.
  function depthPanel(fam: Family) {
    const chosen = picks[fam.id] ?? [];
    const headingId = `seed-depths-${fam.id}`;
    return (
      <div
        key={`depths-${fam.id}`}
        role="group"
        aria-labelledby={headingId}
        className="col-span-2 space-y-3 rounded-lg border border-blue/40 bg-surface p-4"
      >
        <p id={headingId} className="text-sm font-medium text-navy">
          {fam.label}
        </p>
        <div className="flex flex-wrap gap-2">
          {fam.depths.map((d) => {
            const on = chosen.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDepth(fam.id, d.id)}
                aria-pressed={on}
                className={[
                  "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3.5 text-left text-sm transition-colors",
                  on ? "border-blue bg-blue-soft text-navy" : "border-border text-text hover:border-blue/40",
                ].join(" ")}
              >
                {on && <Check size={14} strokeWidth={2.5} className="shrink-0 text-blue" />}
                {d.label}
              </button>
            );
          })}
        </div>
        {fam.depths.length > 1 && <p className="text-xs text-muted">Plusieurs sous-domaines possibles.</p>}

        {/* OPT-IN job-level exclusion — one panel PER picked depth. Lists that
            niche's member jobs ONLY. Marking "pas pour moi" shapes the seed;
            it never hard-censors — a still-strong match resurfaces flagged. */}
        {fam.depths
          .filter((d) => chosen.includes(d.id) && d.members.length > 0)
          .map((depth) => {
            const pick = `${fam.id}:${depth.id}`;
            const open = refineOpen[pick];
            const rejected = new Set(exclusions[pick] ?? []);
            const multi = chosen.length > 1;
            return (
              <div key={pick}>
                <button
                  type="button"
                  onClick={() => setRefineOpen((r) => ({ ...r, [pick]: !r[pick] }))}
                  aria-expanded={open}
                  className={[
                    "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-left text-xs transition-colors",
                    rejected.size > 0
                      ? "border-orange/50 bg-orange-soft/50 text-orange hover:border-orange"
                      : "border-border text-text hover:border-blue/40",
                  ].join(" ")}
                >
                  {open ? (
                    <ChevronDown size={13} strokeWidth={2} className="shrink-0" />
                  ) : (
                    <ChevronRight size={13} strokeWidth={2} className="shrink-0" />
                  )}
                  {multi ? `« ${depth.label} » : des métiers à écarter ?` : "Des métiers de ce domaine à écarter ?"}
                  {rejected.size > 0 && ` (${rejected.size} écarté${rejected.size > 1 ? "s" : ""})`}
                </button>
                {open && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted">
                      Facultatif. Cochez ceux qui ne sont pas pour vous : on
                      s&apos;appuiera moins dessus. (Si votre profil y colle
                      fort, ils réapparaîtront, signalés.)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {depth.members.map((m) => {
                        const off = rejected.has(m.romeCode);
                        return (
                          <button
                            key={m.romeCode}
                            type="button"
                            onClick={() => toggleReject(pick, m.romeCode)}
                            aria-pressed={off}
                            className={[
                              "min-h-11 rounded-lg border px-3 text-left text-xs transition-colors",
                              off
                                ? "border-orange bg-orange-soft text-orange line-through"
                                : "border-border text-text hover:border-blue/40",
                            ].join(" ")}
                          >
                            {m.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h1 className="font-serif text-[26px] leading-tight text-navy sm:text-[32px]">
          Qu&apos;avez-vous concrètement fait ?
        </h1>
        <p className="max-w-xl text-text">
          Cochez les domaines où vous avez une vraie expérience : emploi, stage ou
          bénévolat. Le quiz qui suit affine.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {ROWS.map((row, i) => (
          <Fragment key={i}>
            {row.map(tile)}
            {row.filter((f) => (picks[f.id]?.length ?? 0) > 0).map(depthPanel)}
          </Fragment>
        ))}
      </div>

      {/* Sticky bar: always visible, it carries the step's one action. It sits in
          the flow (sticky, not fixed), so scrolling to the end always shows the
          last tile above it. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <span className="text-sm text-muted">
          {pickedCount === 0
            ? "Facultatif"
            : `${pickedCount} domaine${pickedCount > 1 ? "s" : ""} choisi${pickedCount > 1 ? "s" : ""}`}
        </span>
        {pickedCount === 0 ? (
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex min-h-11 items-center rounded-card border border-blue bg-surface px-4 text-base font-medium text-blue transition-colors hover:bg-blue-soft"
          >
            Passer cette étape
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-11 items-center gap-2 rounded-card bg-blue px-5 text-base font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Continuer
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
}
