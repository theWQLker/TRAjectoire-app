"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { FAMILIES } from "../../../config/families";

/**
 * Seed step-0 (BUILD_BRIEF §4 front door). Rendered FIRST, before the cognitive
 * chapters: "Qu'est-ce que tu as concrètement fait ?" The user picks one or more
 * job FAMILIES, then one DEPTH niche per picked family. The selected
 * "familyId:depthId" tokens are written to answers[SEED_ANSWER_KEY] so
 * buildInventory seeds the niche's real distinctive competence codes — additive,
 * never a filter.
 *
 * OPTIONAL: a foggy user with no clear "what I've done" skips straight to the
 * cognitive quiz (no token → seed-less → identical to the pre-seed behaviour).
 *
 * State lives on the parent's `answers` object (same store the quiz uses), read
 * back from the token string so this component is stateless — matches the
 * config-driven, single-source-of-truth pattern of the rest of the flow.
 */

/** Parse the token string ("tech:code,sante:soin") into a familyId→depthId map. */
function parsePicks(value: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tok of (value ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const [fam, depth] = tok.split(":");
    if (fam && depth) out[fam] = depth;
  }
  return out;
}

/** Serialize the map back to the token string, in FAMILIES order (deterministic). */
function serialize(picks: Record<string, string>): string {
  return FAMILIES.filter((f) => picks[f.id])
    .map((f) => `${f.id}:${picks[f.id]}`)
    .join(",");
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

  // toggle a family on/off. Turning it on selects its FIRST depth by default so a
  // pick is never left half-made; turning it off drops its token.
  function toggleFamily(famId: string) {
    const next = { ...picks };
    if (next[famId]) {
      delete next[famId];
    } else {
      const fam = FAMILIES.find((f) => f.id === famId);
      next[famId] = fam?.depths[0]?.id ?? "";
    }
    onChange(serialize(next));
  }

  function setDepth(famId: string, depthId: string) {
    onChange(serialize({ ...picks, [famId]: depthId }));
    // a depth change invalidates that family's prior exclusions (different niche).
    const pick = `${famId}:${depthId}`;
    const nextEx = { ...exclusions };
    for (const key of Object.keys(nextEx)) if (key.startsWith(`${famId}:`) && key !== pick) delete nextEx[key];
    onExclusionsChange(serializeExclusions(nextEx));
  }

  // toggle a member job as "pas pour moi" within a picked niche.
  function toggleReject(pick: string, rome: string) {
    const cur = new Set(exclusions[pick] ?? []);
    if (cur.has(rome)) cur.delete(rome);
    else cur.add(rome);
    onExclusionsChange(serializeExclusions({ ...exclusions, [pick]: [...cur] }));
  }

  const pickedCount = Object.keys(picks).length;

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl text-navy">
          Qu&apos;est-ce que tu as concrètement fait ?
        </h2>
        <p className="max-w-2xl text-text">
          Choisis le ou les domaines où tu as une vraie expérience — on part de là
          pour te montrer des directions réelles, y compris inattendues. Le quiz
          qui suit affine.
        </p>
        <p className="text-xs italic text-muted">
          Facultatif. Pas d&apos;expérience claire à cocher ? Passe directement au
          quiz — il fonctionne sans.
        </p>
      </div>

      <div className="space-y-3">
        {FAMILIES.map((fam) => {
          const isOn = Boolean(picks[fam.id]);
          return (
            <fieldset
              key={fam.id}
              className={[
                "rounded-card border bg-surface p-5 transition-colors",
                isOn ? "border-blue" : "border-border",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <legend className="float-none px-0">
                  <button
                    type="button"
                    onClick={() => toggleFamily(fam.id)}
                    aria-pressed={isOn}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <span
                      className={[
                        "grid h-5 w-5 place-items-center rounded border transition-colors",
                        isOn ? "border-blue bg-blue text-white" : "border-border text-transparent",
                      ].join(" ")}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span className="text-base text-navy">{fam.label}</span>
                  </button>
                </legend>
              </div>

              {/* Depth sub-choice — only once the family is picked. */}
              {isOn && fam.depths.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 pl-7">
                  {fam.depths.map((d) => {
                    const on = picks[fam.id] === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDepth(fam.id, d.id)}
                        aria-pressed={on}
                        className={[
                          "rounded-lg border px-3.5 py-1.5 text-sm transition-colors",
                          on
                            ? "border-blue bg-blue-soft text-navy"
                            : "border-border text-text hover:border-blue/40",
                        ].join(" ")}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* OPT-IN job-level exclusion — only for the picked niche, only if
                  tapped. Lists that niche's member jobs ONLY (never the full
                  annuaire). Marking "pas pour moi" shapes the seed; it never
                  hard-censors — a still-strong match resurfaces flagged. */}
              {isOn && picks[fam.id] && (() => {
                const pick = `${fam.id}:${picks[fam.id]}`;
                const depth = fam.depths.find((x) => x.id === picks[fam.id]);
                if (!depth || depth.members.length === 0) return null;
                const open = refineOpen[pick];
                const rejected = new Set(exclusions[pick] ?? []);
                return (
                  <div className="mt-4 pl-7">
                    <button
                      type="button"
                      onClick={() => setRefineOpen((r) => ({ ...r, [pick]: !r[pick] }))}
                      aria-expanded={open}
                      className="text-xs text-muted hover:text-text"
                    >
                      {open ? "▾" : "▸"} Affiner — des métiers de ce domaine à écarter ?
                      {rejected.size > 0 && ` (${rejected.size} écarté${rejected.size > 1 ? "s" : ""})`}
                    </button>
                    {open && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-muted">
                          Facultatif. Coche ceux qui ne sont pas pour toi — on
                          s&apos;appuiera moins dessus. (Si ton profil y colle
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
                                  "rounded-lg border px-3 py-1.5 text-xs transition-colors",
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
              })()}
            </fieldset>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-card bg-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
        >
          {pickedCount > 0
            ? `Continuer — ${pickedCount} domaine${pickedCount > 1 ? "s" : ""}`
            : "Continuer"}
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted hover:text-text"
        >
          Passer — je n&apos;ai pas d&apos;expérience claire à cocher
        </button>
      </div>
    </section>
  );
}
