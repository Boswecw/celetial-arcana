/**
 * In-memory sliding-window rate limiter.
 *
 * This is a single-process floor — it will not coordinate across multiple
 * Node instances and resets when the process restarts. For Render's single-
 * dyno deployment that's acceptable; if we ever horizontally scale, move
 * this behind Redis or a managed limiter.
 */

interface Bucket {
  // Unix-ms timestamps of recent hits within the window.
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Periodically evict stale buckets so memory doesn't grow unbounded for
// one-off visitors. Runs every minute in the background.
const SWEEP_INTERVAL_MS = 60_000;
let sweepTimer: NodeJS.Timeout | null = null;

function ensureSweeper(maxWindowMs: number) {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    const cutoff = Date.now() - maxWindowMs;
    for (const [key, bucket] of buckets) {
      while (bucket.hits.length && bucket.hits[0] < cutoff) {
        bucket.hits.shift();
      }
      if (bucket.hits.length === 0) buckets.delete(key);
    }
  }, SWEEP_INTERVAL_MS);
  // Allow the process to exit even with the timer scheduled.
  sweepTimer.unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  ensureSweeper(windowMs);
  const now = Date.now();
  const cutoff = now - windowMs;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }

  while (bucket.hits.length && bucket.hits[0] < cutoff) {
    bucket.hits.shift();
  }

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    return { allowed: false, remaining: 0, resetMs: Math.max(0, oldest + windowMs - now) };
  }

  bucket.hits.push(now);
  return { allowed: true, remaining: limit - bucket.hits.length, resetMs: windowMs };
}
