import { type LucideIcon } from "lucide-react";

/**
 * Quiet tinted-circle-with-icon primitive. Labels a section; does not decorate.
 * Low-contrast soft tint, thin stroke — the gloss-stripped variant used across
 * the overhauled surfaces (no shadow, no heavy fill).
 */
const TINT = {
  blue: "bg-blue-soft text-blue",
  green: "bg-green-soft text-green",
  orange: "bg-orange-soft text-orange",
  amber: "bg-amber-soft text-amber",
  muted: "bg-bg text-muted",
} as const;

const DIM = { sm: "size-8", md: "size-9" } as const;
const ICON = { sm: 15, md: 17 } as const;

export function IconCircle({
  icon: Icon,
  tint = "blue",
  size = "md",
}: {
  icon: LucideIcon;
  tint?: keyof typeof TINT;
  size?: keyof typeof DIM;
}) {
  return (
    <span
      className={`inline-flex ${DIM[size]} shrink-0 items-center justify-center rounded-full ${TINT[tint]}`}
    >
      <Icon size={ICON[size]} strokeWidth={1.5} />
    </span>
  );
}
