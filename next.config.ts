import type { NextConfig } from "next";
import { dataSourceMode } from "./src/lib/data-source";

// A Vercel build (any environment: production, preview, development) with
// ROME_SOURCE or OFFER_SOURCE unset fails here, before anything deploys
// (decision 2026-11-21). The runtime also throws (src/lib/data-source.ts).
if (process.env.VERCEL) {
  for (const flag of ["ROME_SOURCE", "OFFER_SOURCE"] as const) {
    const mode = dataSourceMode(flag);
    console.log(`[data-source] ${flag}=${mode} (${process.env.VERCEL_ENV ?? "unknown env"})`);
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
