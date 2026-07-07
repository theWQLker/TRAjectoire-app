"use client";

import { FAMILIES } from "../../../config/families";

/** Phase 0 seed: pick 1+ job families. No depth sub-choices, no exclusions. */
function parsePicks(value: string | undefined): string[] {
  return (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export function SeedStep({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (tokens: string) => void;
}) {
  const picks = new Set(parsePicks(value));

  const toggle = (famId: string) => {
    const next = new Set(picks);
    if (next.has(famId)) next.delete(famId);
    else next.add(famId);
    // preserve FAMILIES order
    onChange(FAMILIES.filter((f) => next.has(f.id)).map((f) => f.id).join(","));
  };

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl text-navy">Par où commencer ?</h2>
        <p className="max-w-2xl text-text">
          Choisissez un ou plusieurs domaines qui vous parlent. On en déduit vos
          compétences de départ.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FAMILIES.map((fam) => {
          const isOn = picks.has(fam.id);
          return (
            <button
              key={fam.id}
              type="button"
              onClick={() => toggle(fam.id)}
              aria-pressed={isOn}
              className={[
                "rounded-card border p-4 text-left transition-colors",
                isOn
                  ? "border-blue bg-blue-soft"
                  : "border-border bg-surface hover:border-blue/40",
              ].join(" ")}
            >
              <span className="block text-base text-navy">{fam.label}</span>
              <span className="mt-1 block text-sm text-muted">{fam.domaines}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
