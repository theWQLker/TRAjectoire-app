import { type ReactNode } from "react";

/**
 * Base surface. The spec leans on whitespace over borders: 24px padding,
 * 12px radius, a single thin 1px border. Optional accents stay subtle.
 */
export function Card({
  children,
  as: Tag = "div",
  interactive = false,
  className = "",
}: {
  children: ReactNode;
  as?: "div" | "article" | "section" | "li";
  /** adds hover affordance for clickable cards (door cards, direction cards) */
  interactive?: boolean;
  className?: string;
}) {
  return (
    <Tag
      className={[
        "rounded-card border border-border bg-surface p-6",
        interactive
          ? "transition-colors hover:border-blue/40 hover:bg-blue-soft/40"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
