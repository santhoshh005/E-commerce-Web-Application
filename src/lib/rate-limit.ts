import { NextResponse } from "next/server";

/**
 * Fixed-window, in-memory rate limiter for auth endpoints.
 *
 * State is per server instance, so on serverless hosts this is a
 * best-effort brake on brute force rather than a global guarantee.
 * Use a shared store (e.g. Redis) if strict limits are required.
 */

type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as { rateLimitBuckets?: Map<string, Bucket> };
const buckets = (globalForRateLimit.rateLimitBuckets ??= new Map<string, Bucket>());

const MAX_TRACKED_KEYS = 10_000;

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Returns true when the call is allowed, false when the limit is exceeded. */
export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      for (const [storedKey, stored] of buckets) {
        if (stored.resetAt <= now) buckets.delete(storedKey);
      }
      if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Applies a limit and returns a 429 response when it is exceeded, otherwise null. */
export function rateLimitResponse(key: string, limit: number, windowMs: number) {
  const { allowed, retryAfterSeconds } = consumeRateLimit(key, limit, windowMs);
  if (allowed) return null;

  return NextResponse.json(
    { error: "Too many attempts. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
