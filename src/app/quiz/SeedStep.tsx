"use client";

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

export function SeedStep({
  value,
  onChange,
  onContinue,
  onSkip,
}: {
  value: string | undefined;
  onChange: (tokens: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const picks = parsePicks(value);

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
