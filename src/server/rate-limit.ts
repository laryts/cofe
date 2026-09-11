import "server-only";

import { createHash } from "node:crypto";

/**
 * In-process rate limiting for public write endpoints.
 *
 * ⚠️ Deliberately simple, and deliberately documented as insufficient on its
 * own. It is per-process, so a multi-instance deployment gets N times the
 * limit, and it resets on restart. It stops casual flooding and accidental
 * double-submits; it is not a defence against a determined attacker.
 *
 * The moderation queue is the real protection: nothing a submitter sends
 * reaches a visitor or moves a score until a person approves it. This just
 * keeps the queue from filling faster than a human can empty it.
 *
 * A shared limiter (Redis, or the platform's own) belongs here before this is
 * exposed to serious traffic. See docs/PLAN.md and SECURITY.md.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

/**
 * Read the current state without spending anything.
 *
 * Split from `consume` on purpose: charging a validation error against someone's
 * quota means three typos lock an honest contributor out for an hour. Only work
 * we actually store should cost them.
 */
export function checkRateLimit(key: string, limit: number, _windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }

  const allowed = existing.count < limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Record one use. Call this only once the request has actually done something. */
export function consumeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    // Bound memory: an unbounded map keyed by client is itself a DoS vector.
    if (buckets.size >= MAX_TRACKED_KEYS) {
      const oldest = buckets.keys().next();
      if (!oldest.done) buckets.delete(oldest.value);
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * A stable, non-reversible identifier for a client.
 *
 * The raw IP is never stored. Hashing keeps the ability to spot one source
 * flooding the queue without keeping a log of who submitted what from where —
 * the minimum needed to moderate, and nothing more.
 */
export function fingerprint(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const realIp = request.headers.get("x-real-ip") ?? "";
  const source = (forwarded.split(",")[0] ?? "").trim() || realIp || "unknown";

  return createHash("sha256").update(source).digest("hex").slice(0, 32);
}
