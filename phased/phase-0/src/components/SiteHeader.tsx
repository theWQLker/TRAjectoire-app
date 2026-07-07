import Link from "next/link";
import { type ReactNode } from "react";

/**
 * Shared branded header. Mockup styling, honest links only — no login/signup,
 * no marketing routes that don't exist. The `right` slot carries the one
 * contextual action a surface needs (e.g. "refaire le quiz", a status chip,
 * "retour aux directions"). Falls back to a quiet provenance line.
 */
export function SiteHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue font-serif text-sm font-medium text-white">
            T
          </span>
          <span className="font-serif text-lg text-navy">Trajectoire</span>
        </Link>
        {right ? (
          <div className="flex items-center gap-4 text-sm">{right}</div>
        ) : (
          <span className="text-sm text-muted">France · données du marché</span>
        )}
      </div>
    </header>
  );
}
