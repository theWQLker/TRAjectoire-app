"use client";

import { useState } from "react";

/**
 * ROME titles to paste into a job search, and a Copier button that copies
 * them all, comma-separated. The titles are ROME open data (credited on the
 * page); never ad titles.
 */
export function CopyTitles({ titles, label, copiedLabel }: { titles: string[]; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(titles.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {titles.map((t) => (
        <span key={t} className="rounded-md bg-continuite-soft px-2 py-1 text-xs text-continuite">
          {t}
        </span>
      ))}
      <button
        type="button"
        onClick={copy}
        className="min-h-8 rounded-md border border-text/60 bg-surface px-2.5 text-xs text-navy hover:border-navy"
      >
        <span aria-live="polite">{copied ? copiedLabel : label}</span>
      </button>
    </div>
  );
}
