import { type Signal, SIGNAL_LABEL } from "@/lib/mock";

/**
 * The only "strength" unit the UI shows (DESIGN_SPEC locked decision):
 * Signal fort / moyen / faible. Never a percentage, never "compatibilité".
 *
 * Pill: soft bg + matching text color, small and quiet — not a loud verdict.
 * Fort=green, Moyen=amber, Faible=orange.
 */
const STYLES: Record<Signal, string> = {
  fort: "bg-green-soft text-green",
  moyen: "bg-amber-soft text-amber",
  faible: "bg-orange-soft text-orange",
};

export function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[signal]}`}
    >
      {SIGNAL_LABEL[signal]}
    </span>
  );
}
