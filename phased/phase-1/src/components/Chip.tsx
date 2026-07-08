import { type ReactNode } from "react";

/**
 * Small pill. Consolidates the ad-hoc pills scattered across AdCard / quiz.
 *  - neutral: hairline border (contract type, meta)
 *  - skill:   soft-blue (a labelled offer competence — NEVER a raw code)
 *  - count:   muted count badge
 */
const VARIANT = {
  neutral: "border border-border text-muted",
  skill: "bg-blue-soft text-text",
  count: "bg-bg text-muted",
} as const;

export function Chip({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANT;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT[variant]}`}
    >
      {children}
    </span>
  );
}
