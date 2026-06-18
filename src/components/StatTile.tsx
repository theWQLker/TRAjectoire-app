import { type ReactNode } from "react";

/**
 * A single figure + its label. Used in the landing live-data panel and the
 * direction-detail job side. Plain numbers only — these count things (offres,
 * métiers), they are never a match score.
 */
export function StatTile({
  value,
  label,
  hint,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-serif text-3xl text-navy">{value}</span>
      <span className="text-sm text-text">{label}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}
