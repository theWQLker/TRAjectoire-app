import { type Signal, SIGNAL_LABEL } from "@/lib/ui";

/**
 * The signal gauge (P0-B): three dots in brand navy and the word beside them,
 * ●●● fort, ●●○ moyen, ●○○ faible. No colour carries the signal (colour is
 * reserved for buckets), and never a percentage, a score or "correspondance".
 * The tier comes from the rarity-weighted thresholds (engine/coverage.ts).
 */
const FILLED: Record<Signal, number> = { fort: 3, moyen: 2, faible: 1 };

export function SignalBadge({ signal }: { signal: Signal }) {
  const filled = FILLED[signal];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-navy">
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`size-2 rounded-full border border-navy ${i < filled ? "bg-navy" : "bg-transparent"}`}
          />
        ))}
      </span>
      <span>
        <span className="sr-only">Signal </span>
        {SIGNAL_LABEL[signal]}
      </span>
    </span>
  );
}
