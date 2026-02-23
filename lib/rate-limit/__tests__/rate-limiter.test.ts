
import { RateLimiter } from "../rate-limiter"

describe("RateLimiter", () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it("allows requests within the limit", () => {
    const limiter = new RateLimiter({
      windowMs: 60_000,
      maxRequests: 3,
      cleanupIntervalMs: 0,
    })
    expect(limiter.check("user-1").allowed).toBe(true) // 1/3
    expect(limiter.check("user-1").allowed).toBe(true) // 2/3
    expect(limiter.check("user-1").allowed).toBe(true) // 3/3
    limiter.destroy()
  })

  it("blocks requests exceeding the limit", () => {
    const limiter = new RateLimiter({
      windowMs: 60_000,
      maxRequests: 2,
      cleanupIntervalMs: 0,
    })
    limiter.check("user-1") // 1/2
    limiter.check("user-1") // 2/2

    const result = limiter.check("user-1") // 3/2 -> blocked
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
    limiter.destroy()
  })

  it("resets after window expires", () => {
    jest.useFakeTimers()
    const limiter = new RateLimiter({
      windowMs: 1000,
      maxRequests: 1,
      cleanupIntervalMs: 0,
    })
    limiter.check("user-1") // 1/1
    expect(limiter.check("user-1").allowed).toBe(false) // blocked

    jest.advanceTimersByTime(1001)
    expect(limiter.check("user-1").allowed).toBe(true) // new window
    limiter.destroy()
  })

  it("tracks separate keys independently", () => {
    const limiter = new RateLimiter({
      windowMs: 60_000,
      maxRequests: 1,
      cleanupIntervalMs: 0,
    })
    expect(limiter.check("user-1").allowed).toBe(true)
    expect(limiter.check("user-2").allowed).toBe(true)
    expect(limiter.check("user-1").allowed).toBe(false)
    limiter.destroy()
  })

  it("returns correct remaining count", () => {
    const limiter = new RateLimiter({
      windowMs: 60_000,
      maxRequests: 5,
      cleanupIntervalMs: 0,
    })
    expect(limiter.check("k").remaining).toBe(4)
    expect(limiter.check("k").remaining).toBe(3)
    expect(limiter.check("k").remaining).toBe(2)
    expect(limiter.check("k").remaining).toBe(1)
    expect(limiter.check("k").remaining).toBe(0)
    // After exceeding, remaining stays at 0
    expect(limiter.check("k").remaining).toBe(0)
    limiter.destroy()
  })

  it("cleans up expired entries", () => {
    jest.useFakeTimers()
    const limiter = new RateLimiter({
      windowMs: 1000,
      maxRequests: 5,
      cleanupIntervalMs: 500,
    })
    limiter.check("user-1")
    expect(limiter.size).toBe(1)

    jest.advanceTimersByTime(1500)
    expect(limiter.size).toBe(0)
    limiter.destroy()
  })

  it("returns correct retryAfterSeconds", () => {
    jest.useFakeTimers()
    const limiter = new RateLimiter({
      windowMs: 10_000,
      maxRequests: 1,
      cleanupIntervalMs: 0,
    })
    limiter.check("user-1") // 1/1

    jest.advanceTimersByTime(3000) // 3s into 10s window
    const result = limiter.check("user-1") // blocked
    expect(result.allowed).toBe(false)
    // ~7 seconds remaining, ceil'd
    expect(result.retryAfterSeconds).toBe(7)
    limiter.destroy()
  })

  it("returns limit in every result", () => {
    const limiter = new RateLimiter({
      windowMs: 60_000,
      maxRequests: 42,
      cleanupIntervalMs: 0,
    })
    const r1 = limiter.check("k")
    expect(r1.limit).toBe(42)

    // Fill up to exceed
    for (let i = 1; i < 43; i++) limiter.check("k")
    const r2 = limiter.check("k")
    expect(r2.limit).toBe(42)
    limiter.destroy()
  })

  it("destroy stops cleanup timer", () => {
    jest.useFakeTimers()
    const limiter = new RateLimiter({
      windowMs: 1000,
      maxRequests: 1,
      cleanupIntervalMs: 100,
    })
    limiter.check("user-1")
    limiter.destroy()

    // Even after advancing timers past the window, the entry remains
    // because cleanup timer was stopped
    jest.advanceTimersByTime(2000)
    expect(limiter.size).toBe(1)
  })
})
