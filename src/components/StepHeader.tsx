import { type ReactNode } from "react";

/**
 * Page header for the guided flow (screens 2–8). Page title in serif (the only
 * place serif appears besides the hero), an optional subtitle, and a quiet
 * "étape n / total" marker — progress without gamification.
 */
export function StepHeader({
  title,
  subtitle,
  step,
  total,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  step?: number;
  total?: number;
}) {
  return (
    <header className="mb-8 space-y-2">
      {step != null && total != null && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Étape {step} / {total}
        </p>
      )}
      <h1 className="font-serif text-[32px] leading-tight text-navy">{title}</h1>
      {subtitle && <p className="max-w-2xl text-text">{subtitle}</p>}
    </header>
  );
}
