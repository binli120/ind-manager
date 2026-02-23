/**
 * @jest-environment node
 */

import { NextRequest } from "next/server"
import {
  getClientIp,
  buildRateLimitKey,
  checkRateLimit,
} from "../rate-limit-helpers"
import { resetAllLimiters } from "../rate-limit-config"

/** Helper to create a minimal NextRequest with custom headers. */
function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("https://example.com/api/test", { headers })
}

describe("getClientIp", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("handles single IP in x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "10.0.0.1" })
    expect(getClientIp(req)).toBe("10.0.0.1")
  })

  it("falls back to x-real-ip", () => {
    const req = makeRequest({ "x-real-ip": "9.8.7.6" })
    expect(getClientIp(req)).toBe("9.8.7.6")
  })

  it("returns 'unknown' when no IP headers present", () => {
    const req = makeRequest()
    expect(getClientIp(req)).toBe("unknown")
  })

  it("prefers x-forwarded-for over x-real-ip", () => {
    const req = makeRequest({
      "x-forwarded-for": "1.1.1.1",
      "x-real-ip": "2.2.2.2",
    })
    expect(getClientIp(req)).toBe("1.1.1.1")
  })
})

describe("buildRateLimitKey", () => {
  it("uses IP for auth tier regardless of userId", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" })
    const key = buildRateLimitKey("auth", req, "user-123")
    expect(key).toBe("auth:1.2.3.4")
  })

  it("uses userId for non-auth tier when provided", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" })
    const key = buildRateLimitKey("write", req, "user-abc")
    expect(key).toBe("write:user-abc")
  })

  it("falls back to IP for non-auth tier when userId is null", () => {
    const req = makeRequest({ "x-forwarded-for": "5.6.7.8" })
    const key = buildRateLimitKey("read", req, null)
    expect(key).toBe("read:5.6.7.8")
  })

  it("falls back to IP for non-auth tier when userId is undefined", () => {
    const req = makeRequest({ "x-forwarded-for": "5.6.7.8" })
    const key = buildRateLimitKey("sensitive", req)
    expect(key).toBe("sensitive:5.6.7.8")
  })
})

describe("checkRateLimit", () => {
  afterEach(() => {
    resetAllLimiters()
  })

  it("returns null when request is allowed", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" })
    const result = checkRateLimit({ tier: "read", request: req })
    expect(result).toBeNull()
  })

  it("returns 429 response when limit is exceeded", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" })

    // auth tier: 10 requests per 15 minutes
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit({ tier: "auth", request: req })).toBeNull()
    }

    const blocked = checkRateLimit({ tier: "auth", request: req })
    expect(blocked).not.toBeNull()
    expect(blocked!.status).toBe(429)
  })

  it("includes rate limit headers on 429 response", async () => {
    const req = makeRequest({ "x-forwarded-for": "10.0.0.1" })

    // Exhaust auth tier
    for (let i = 0; i < 10; i++) {
      checkRateLimit({ tier: "auth", request: req })
    }

    const blocked = checkRateLimit({ tier: "auth", request: req })
    expect(blocked).not.toBeNull()
    expect(blocked!.headers.get("Retry-After")).toBeTruthy()
    expect(blocked!.headers.get("X-RateLimit-Limit")).toBe("10")
    expect(blocked!.headers.get("X-RateLimit-Remaining")).toBe("0")
    expect(blocked!.headers.get("X-RateLimit-Reset")).toBeTruthy()

    const body = await blocked!.json()
    expect(body.error).toContain("Too many requests")
  })

  it("uses userId for authenticated tiers", () => {
    const req1 = makeRequest({ "x-forwarded-for": "1.2.3.4" })

    // Exhaust write tier for user-A (30 requests)
    for (let i = 0; i < 30; i++) {
      checkRateLimit({ tier: "write", request: req1, userId: "user-A" })
    }

    // user-A is blocked
    const blockedA = checkRateLimit({
      tier: "write",
      request: req1,
      userId: "user-A",
    })
    expect(blockedA).not.toBeNull()
    expect(blockedA!.status).toBe(429)

    // user-B from the same IP is NOT blocked
    const allowedB = checkRateLimit({
      tier: "write",
      request: req1,
      userId: "user-B",
    })
    expect(allowedB).toBeNull()
  })

  it("different tiers are independent", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" })

    // Exhaust auth tier (10 requests)
    for (let i = 0; i < 10; i++) {
      checkRateLimit({ tier: "auth", request: req })
    }
    expect(checkRateLimit({ tier: "auth", request: req })).not.toBeNull()

    // read tier should still be available
    expect(checkRateLimit({ tier: "read", request: req })).toBeNull()
  })
})
