// Copyright@ filynai.com

import { RateLimiter } from "./rate-limiter"

export type RateLimitTier = "auth" | "sensitive" | "write" | "read"

interface TierConfig {
  windowMs: number
  maxRequests: number
}

/**
 * Rate-limit tiers — stricter for auth, progressively looser for
 * less sensitive operations.
 *
 * | Tier      | Window | Max | Use-case                              |
 * |-----------|--------|-----|---------------------------------------|
 * | auth      | 15 min |  10 | sign-in / sign-up  (per IP)           |
 * | sensitive | 15 min |  20 | invite, delete user (per user)        |
 * | write     |  1 min |  30 | create / update    (per user or IP)   |
 * | read      |  1 min |  60 | list / get         (per user or IP)   |
 */
const TIER_CONFIGS: Record<RateLimitTier, TierConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  sensitive: { windowMs: 15 * 60 * 1000, maxRequests: 20 },
  write: { windowMs: 1 * 60 * 1000, maxRequests: 30 },
  read: { windowMs: 1 * 60 * 1000, maxRequests: 60 },
}

// Module-level singletons — one per tier.  They persist across warm
// invocations within the same serverless instance and reset on cold start.
const limiters: Partial<Record<RateLimitTier, RateLimiter>> = {}

export function getLimiter(tier: RateLimitTier): RateLimiter {
  if (!limiters[tier]) {
    const config = TIER_CONFIGS[tier]
    limiters[tier] = new RateLimiter(config)
  }
  return limiters[tier]!
}

/**
 * Reset all singleton limiters.  Only useful in tests to avoid
 * cross-test state leakage.
 */
export function resetAllLimiters(): void {
  for (const tier of Object.keys(limiters) as RateLimitTier[]) {
    limiters[tier]?.destroy()
    delete limiters[tier]
  }
}
