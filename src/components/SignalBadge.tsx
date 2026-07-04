import { type Signal, SIGNAL_LABEL } from "@/lib/ui";

/**
 * The "strength" unit the UI shows: "Piste solide" (strong) / "Piste à explorer"
 * (partial). Never a percentage, never "compatibilité". Maps from the engine's
 * coverageStrength via signalFromCoverage().
 *
 * The exploratory tier (faible) renders NO badge — the element is removed
 * entirely, not merely hidden. Pill: soft bg + matching text color, small and
 * quiet — not a loud verdict. Solide=green, à explorer=amber.
 */
const STYLES: Record<Signal, string> = {
  fort: "bg-green-soft text-green",
  moyen: "bg-amber-soft text-orange",
  faible: "",
};

export function SignalBadge({ signal }: { signal: Signal }) {
  // Exploratory → no badge at all (drop the element, don't just hide it).
  if (signal === "faible") return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[signal]}`}
    >
      {SIGNAL_LABEL[signal]}
    </span>
  );
}
