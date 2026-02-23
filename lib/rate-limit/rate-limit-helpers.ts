
import { NextRequest, NextResponse } from "next/server"
import { getLimiter, type RateLimitTier } from "./rate-limit-config"

/**
 * Extract the client IP from request headers.
 *
 * Vercel always sets `x-forwarded-for`.  We take the first (leftmost)
 * value which is the original client IP per RFC 7239.  Falls back to
 * `x-real-ip`, then `"unknown"`.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    return xff.split(",")[0].trim()
  }
  return request.headers.get("x-real-ip") ?? "unknown"
}

/**
 * Build a composite rate-limit key.
 *
 * - `auth` tier: always uses IP (requests are unauthenticated).
 * - Other tiers: prefer `userId` when available, fall back to IP.
 */
export function buildRateLimitKey(
  tier: RateLimitTier,
  request: NextRequest,
  userId?: string | null,
): string {
  const identifier =
    tier === "auth" ? getClientIp(request) : (userId ?? getClientIp(request))
  return `${tier}:${identifier}`
}

export interface RateLimitCheckOptions {
  tier: RateLimitTier
  request: NextRequest
  /** Supabase user ID — pass after auth check on authenticated routes. */
  userId?: string | null
}

/**
 * Check the rate limit for an incoming request.
 *
 * @returns `NextResponse` with status 429 if the limit is exceeded,
 *          or `null` if the request is allowed.
 *
 * Usage in a route handler:
 * ```ts
 * const blocked = checkRateLimit({ tier: "auth", request })
 * if (blocked) return blocked
 * ```
 */
export function checkRateLimit(
  options: RateLimitCheckOptions,
): NextResponse | null {
  const { tier, request, userId } = options
  const limiter = getLimiter(tier)

  const key = buildRateLimitKey(tier, request, userId)
  const result = limiter.check(key)

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfterSeconds),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      },
    )
  }

  return null
}
