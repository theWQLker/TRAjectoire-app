/**
 * Zone independence (decision 2026-11-22): the zone the user chose changes no
 * role, no direction and no order; only what the page says about ads there (the
 * dated ad line, the France Travail links, the skill line).
 *
 * `zoneSignature` is everything a zone must NOT change, in page order. Two zones
 * pass when their signatures are identical. `ftLinkProblems` checks that every
 * surfaced role carries a France Travail search for each chosen zone.
 *
 * Shared by the honesty layer (one inventory) and the persona sweep
 * (scripts/zone-sweep.ts, 116 personas × 3 zones).
 */
import type { Results } from "../src/lib/engine/results";
import { BUCKET_ORDER, orderBucket, firstViewCodes } from "../src/app/results/display";
import { ftSearchLinks } from "../src/lib/ui";

export const PARITY_ZONES = ["75", "93", "69"] as const;

export function zoneSignature(r: Results): string[] {
  const order = BUCKET_ORDER.flatMap((cat) =>
    orderBucket(cat, r.byCategory[cat]).map(
      (d) => `${cat}:${d.romeCode}${d.isWildcard ? "*" : ""}:tier=${d.matchRaritySum.toFixed(3)}`,
    ),
  );
  return [
    ...order,
    `firstView=${[...firstViewCodes(r.directions, r.unverified)].join(",")}`,
    `unverified=${r.unverified.map((d) => d.romeCode).join(",")}`,
    `suppressed=${r.suppressed.map((d) => d.romeCode).join(",")}`,
    `heldBack=${r.heldBack.map((d) => d.romeCode).sort().join(",")}`,
    `fork=${r.honestFork.triggered}:${r.honestFork.forks.map((f) => f.direction.romeCode).join(",")}`,
  ];
}

/** First differing line between two signatures, or null when identical. */
export function firstDiff(a: string[], b: string[]): string | null {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return `#${i}: ${a[i] ?? "(none)"} ≠ ${b[i] ?? "(none)"}`;
  }
  return null;
}

/** Surfaced roles without a valid France Travail search for every chosen zone. */
export function ftLinkProblems(r: Results): string[] {
  const zones = r.inventory.constraints.departements ?? [r.inventory.constraints.departement];
  const bad: string[] = [];
  for (const d of r.directions) {
    const links = ftSearchLinks(d.romeCode, zones);
    const ok =
      links.length === Math.max(1, zones.length) &&
      links.every((l, i) => {
        const u = new URL(l.href);
        return (
          u.protocol === "https:" &&
          u.hostname === "candidat.francetravail.fr" &&
          u.searchParams.get("motsCles") === d.romeCode &&
          (zones.length === 0 || u.searchParams.get("lieux") === `${zones[i]}D`)
        );
      });
    if (!ok) bad.push(d.romeCode);
  }
  return bad;
}
