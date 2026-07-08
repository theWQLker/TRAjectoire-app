/**
 * Cost-layer rates for the autonomy side (PRD §7, §12).
 *
 * ⚠️ VERIFY (PRD §12): the auto-entrepreneur cotisation rate MUST be verified
 * live against URSSAF before being shown to a user. The `verified: false` flag
 * is rendered in the UI as a visible "VERIFY" badge — never present these as
 * settled fact. Rates change by activity type and by year.
 */
export type Rate = {
  id: string;
  label: string;
  /** cotisation rate as a fraction of revenue (e.g. 0.221 = 22.1%) */
  rate: number;
  /** unverified until checked against URSSAF (PRD §12) */
  verified: false;
  note: string;
};

export const AUTO_ENTREPRENEUR_RATES: Rate[] = [
  {
    id: "ae_bnc_prestations",
    label: "Auto-entrepreneur — prestations de services (BNC)",
    rate: 0.221,
    verified: false,
    note: "Cotisations sociales sur prestations de services libérales (BNC). VERIFY against URSSAF — varies by year/activity.",
  },
  {
    id: "ae_bic_services",
    label: "Auto-entrepreneur — services commerciaux/artisanaux (BIC)",
    rate: 0.212,
    verified: false,
    note: "Cotisations sociales sur prestations de services BIC. VERIFY against URSSAF — varies by year/activity.",
  },
];

/** The autonomy/gérant honest-cost copy (PRD §7 — never "be your own boss"). */
export const AUTONOMY_HONEST_COST = {
  headline: "Going independent in this field",
  costs: [
    "Cotisations come off the top of every euro you invoice (see rate below).",
    "No clients are waiting — you build the book yourself.",
    "Income varies month to month; there is no payslip.",
  ],
  rates: AUTO_ENTREPRENEUR_RATES,
} as const;
