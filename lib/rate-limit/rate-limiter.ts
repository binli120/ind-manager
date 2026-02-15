// Copyright@ filynai.com

/**
 * In-memory fixed-window rate limiter.
 *
 * Each key (IP or user ID) gets a counter that resets after `windowMs`.
 * Module-level instances persist across warm invocations in the same
 * serverless function, but reset on cold start — acceptable for this
 * app's scale.  Future upgrade: swap the Map for a Redis-backed store.
 */

interface RateLimitEntry {
  count: number
  resetAt: number // Unix timestamp in ms
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: number // Unix timestamp in ms
  retryAfterSeconds: number // 0 when allowed
}

export interface RateLimiterOptions {
  /** Window size in milliseconds */
  windowMs: number
  /** Maximum requests per window */
  maxRequests: number
  /** How often to purge expired entries (ms). 0 disables cleanup. Default: 60_000 */
  cleanupIntervalMs?: number
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry>
  private windowMs: number
  private maxRequests: number
  private cleanupTimer: ReturnType<typeof setInterval> | null

  constructor(options: RateLimiterOptions) {
    this.store = new Map()
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    this.cleanupTimer = null

    const interval = options.cleanupIntervalMs ?? 60_000
    if (interval > 0) {
      this.cleanupTimer = setInterval(() => this.cleanup(), interval)
      // Allow Node.js process to exit even if this timer is active
      if (this.cleanupTimer && typeof this.cleanupTimer.unref === "function") {
        this.cleanupTimer.unref()
      }
    }
  }

  /**
   * Check whether a request identified by `key` is allowed.
   * Increments the counter as a side-effect.
   */
  check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(key)

    // No entry or window expired — start a new window
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + this.windowMs
      this.store.set(key, { count: 1, resetAt })
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        limit: this.maxRequests,
        resetAt,
        retryAfterSeconds: 0,
      }
    }

    // Within current window
    entry.count += 1
    const allowed = entry.count <= this.maxRequests
    const remaining = Math.max(0, this.maxRequests - entry.count)
    const retryAfterSeconds = allowed
      ? 0
      : Math.ceil((entry.resetAt - now) / 1000)

    return {
      allowed,
      remaining,
      limit: this.maxRequests,
      resetAt: entry.resetAt,
      retryAfterSeconds,
    }
  }

  /** Purge entries whose window has expired. */
  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) {
        this.store.delete(key)
      }
    }
  }

  /** Tear down the cleanup timer (call in tests). */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /** Current number of tracked keys (useful for tests / monitoring). */
  get size(): number {
    return this.store.size
  }
}
