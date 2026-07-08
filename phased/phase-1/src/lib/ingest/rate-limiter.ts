/**
 * Per-API rate limiting (PRD §3 "Live API facts").
 *
 * Rate limits are PER-API, not global. A single global throttle is explicitly
 * wrong (PRD §3): it either wastes Offres headroom (10 req/s) or breaches the
 * ROME 1 req/s ceiling. So each API gets its OWN independent limiter instance.
 *
 *   Offres d'emploi v2 : 10 req/s
 *   ROME 4.0 (Fiches)  :  1 req/s
 *
 * Server/Node-only. No external deps.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Simple interval-spacing limiter: at most `ratePerSec` acquisitions per second,
 * enforced by spacing each acquire at least `1000/ratePerSec` ms after the last.
 * Serializes acquires through a promise chain so concurrent callers queue.
 */
export class RateLimiter {
  private readonly minIntervalMs: number;
  private nextSlot = 0;
  private chain: Promise<void> = Promise.resolve();

  constructor(
    readonly name: string,
    ratePerSec: number,
  ) {
    if (ratePerSec <= 0) throw new Error(`ratePerSec must be > 0 for ${name}`);
    this.minIntervalMs = Math.ceil(1000 / ratePerSec);
  }

  /** Wait until this limiter permits the next request. */
  async acquire(): Promise<void> {
    // Queue behind any in-flight acquire so spacing is honored under concurrency.
    const mine = this.chain.then(async () => {
      const now = Date.now();
      const wait = Math.max(0, this.nextSlot - now);
      if (wait > 0) await sleep(wait);
      this.nextSlot = Math.max(now, this.nextSlot) + this.minIntervalMs;
    });
    // Swallow rejection on the shared chain so one failure doesn't poison the queue.
    this.chain = mine.catch(() => {});
    return mine;
  }
}

/** The independent limiters, one per subscribed API (PRD §3). */
export const LIMITERS = {
  offres: new RateLimiter("offres", 10),
  rome: new RateLimiter("rome", 1),
} as const;

/**
 * fetch through a specific limiter, honoring 429 Retry-After per-API. Retries
 * up to `maxRetries` times, waiting the Retry-After (seconds) the API returns.
 * The limiter is the ONLY throttle point — callers never sleep themselves.
 */
export async function fetchWithLimit(
  limiter: RateLimiter,
  url: string,
  init: RequestInit = {},
  maxRetries = 4,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    await limiter.acquire();
    const res = await fetch(url, init);
    if (res.status !== 429) return res;

    if (attempt >= maxRetries) {
      throw new Error(
        `${limiter.name}: still 429 after ${maxRetries} retries (${url}).`,
      );
    }
    // Honor Retry-After (PRD §3). Header may be seconds or an HTTP-date.
    const ra = res.headers.get("Retry-After");
    const waitMs = retryAfterMs(ra);
    await sleep(waitMs);
  }
}

function retryAfterMs(retryAfter: string | null): number {
  if (!retryAfter) return 1000;
  const secs = Number(retryAfter);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const date = Date.parse(retryAfter);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return 1000;
}
