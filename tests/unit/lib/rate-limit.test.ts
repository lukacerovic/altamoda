import { describe, it, expect, beforeEach, vi } from 'vitest'

// Force in-memory backend for deterministic tests — clear env vars
beforeEach(() => {
  vi.resetModules()
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
})

describe('rate-limit — sliding-window limiter', () => {
  describe('createRateLimiter (in-memory backend)', () => {
    it('allows the first N requests', async () => {
      const { createRateLimiter } = await import('@/lib/rate-limit')
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 })

      const r1 = await limiter('user:1')
      const r2 = await limiter('user:1')
      const r3 = await limiter('user:1')

      expect(r1.success).toBe(true)
      expect(r2.success).toBe(true)
      expect(r3.success).toBe(true)
      expect(r3.remaining).toBe(0)
    })

    it('blocks the N+1th request and reports retryAfter', async () => {
      const { createRateLimiter } = await import('@/lib/rate-limit')
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 })

      await limiter('user:2')
      await limiter('user:2')
      const blocked = await limiter('user:2')

      expect(blocked.success).toBe(false)
      expect(blocked.remaining).toBe(0)
      expect(blocked.retryAfterMs).not.toBeNull()
      expect(blocked.retryAfterMs).toBeGreaterThan(0)
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(60_000)
    })

    it('isolates limits per key', async () => {
      const { createRateLimiter } = await import('@/lib/rate-limit')
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 })

      const a = await limiter('ip:A')
      const b = await limiter('ip:B')
      const aAgain = await limiter('ip:A')

      expect(a.success).toBe(true)
      expect(b.success).toBe(true)      // different key → fresh counter
      expect(aAgain.success).toBe(false) // same key as first → blocked
    })

    it('decrements remaining count correctly', async () => {
      const { createRateLimiter } = await import('@/lib/rate-limit')
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 })

      const r1 = await limiter('k')
      const r2 = await limiter('k')
      const r3 = await limiter('k')

      expect(r1.remaining).toBe(4)
      expect(r2.remaining).toBe(3)
      expect(r3.remaining).toBe(2)
    })

    it('releases slots after window elapses', async () => {
      const { createRateLimiter } = await import('@/lib/rate-limit')
      const limiter = createRateLimiter({ windowMs: 50, maxRequests: 1 })

      const r1 = await limiter('short-key')
      expect(r1.success).toBe(true)

      const r2 = await limiter('short-key')
      expect(r2.success).toBe(false)

      // Wait just past the window
      await new Promise((resolve) => setTimeout(resolve, 80))

      const r3 = await limiter('short-key')
      expect(r3.success).toBe(true)
    })
  })

  describe('pre-configured limiters', () => {
    it('exports all expected limiters', async () => {
      const mod = await import('@/lib/rate-limit')
      expect(typeof mod.authRateLimiter).toBe('function')
      expect(typeof mod.registrationRateLimiter).toBe('function')
      expect(typeof mod.orderRateLimiter).toBe('function')
      expect(typeof mod.checkStatusRateLimiter).toBe('function')
      expect(typeof mod.newsletterRateLimiter).toBe('function')
    })
  })

  describe('getClientIp()', () => {
    it('returns rightmost IP from X-Forwarded-For (proxy-added, not spoofable)', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      // Client could spoof the leftmost IP; the rightmost is appended by our trusted proxy.
      const req = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' },
      })
      expect(getClientIp(req)).toBe('9.10.11.12')
    })

    it('returns x-real-ip when x-forwarded-for is absent', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      const req = new Request('http://example.com', { headers: { 'x-real-ip': '203.0.113.9' } })
      expect(getClientIp(req)).toBe('203.0.113.9')
    })

    it('returns "unknown" when no IP headers are present', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      const req = new Request('http://example.com')
      expect(getClientIp(req)).toBe('unknown')
    })

    it('trims whitespace around X-Forwarded-For entries', async () => {
      const { getClientIp } = await import('@/lib/rate-limit')
      const req = new Request('http://example.com', { headers: { 'x-forwarded-for': '  1.2.3.4  ,   5.6.7.8  ' } })
      expect(getClientIp(req)).toBe('5.6.7.8')
    })
  })

  describe('applyRateLimit()', () => {
    it('returns null when request is under the limit', async () => {
      const { createRateLimiter, applyRateLimit } = await import('@/lib/rate-limit')
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 })

      const response = await applyRateLimit(limiter, 'apply-test-1')
      expect(response).toBeNull()
    })

    it('returns HTTP 429 Response when the limit is exceeded', async () => {
      const { createRateLimiter, applyRateLimit } = await import('@/lib/rate-limit')
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 })

      await applyRateLimit(limiter, 'apply-test-2') // consume first slot
      const response = await applyRateLimit(limiter, 'apply-test-2')

      expect(response).not.toBeNull()
      expect(response!.status).toBe(429)
      expect(response!.headers.get('content-type')).toContain('application/json')
      expect(response!.headers.get('Retry-After')).toBeTruthy()

      const body = await response!.json()
      expect(body.success).toBe(false)
      expect(body.error).toBeTruthy()
    })

    it('Retry-After header is a positive integer string (seconds)', async () => {
      const { createRateLimiter, applyRateLimit } = await import('@/lib/rate-limit')
      const limiter = createRateLimiter({ windowMs: 30_000, maxRequests: 1 })

      await applyRateLimit(limiter, 'retry-after-test')
      const response = await applyRateLimit(limiter, 'retry-after-test')

      const retryAfter = Number(response!.headers.get('Retry-After'))
      expect(Number.isFinite(retryAfter)).toBe(true)
      expect(retryAfter).toBeGreaterThan(0)
      expect(retryAfter).toBeLessThanOrEqual(30) // window is 30s so retry ≤ 30
    })
  })

  describe('Redis backend selection', () => {
    it('uses in-memory when Upstash credentials are missing', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
      vi.resetModules()

      const { createRateLimiter } = await import('@/lib/rate-limit')
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 })
      // If this worked without network calls, we're on in-memory backend
      const result = await limiter('redis-check')
      expect(result.success).toBe(true)
    })
  })
})
