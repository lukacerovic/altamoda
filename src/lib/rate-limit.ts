/**
 * In-memory sliding-window rate limiter.
 * For production with multiple server instances, replace with Redis-backed solution.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  const cutoff = now - windowMs
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}

interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum number of requests per window */
  maxRequests: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  retryAfterMs: number | null
}

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests } = config

  return function checkRateLimit(key: string): RateLimitResult {
    cleanup(windowMs)

    const now = Date.now()
    const cutoff = now - windowMs

    let entry = store.get(key)
    if (!entry) {
      entry = { timestamps: [] }
      store.set(key, entry)
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

    if (entry.timestamps.length >= maxRequests) {
      const oldestInWindow = entry.timestamps[0]
      const retryAfterMs = oldestInWindow + windowMs - now
      return { success: false, remaining: 0, retryAfterMs }
    }

    entry.timestamps.push(now)
    return {
      success: true,
      remaining: maxRequests - entry.timestamps.length,
      retryAfterMs: null,
    }
  }
}

// Pre-configured rate limiters for critical endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,           // 10 attempts per 15 min
})

export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,            // 5 registrations per hour per IP
})

export const orderRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 5,            // 5 orders per minute
})

export const checkStatusRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 15,           // 15 checks per 15 min
})

/**
 * Extract client IP from request headers.
 * In production behind a reverse proxy, use X-Forwarded-For.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Apply rate limiting and return a 429 Response if exceeded, or null if allowed.
 */
export function applyRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  key: string
): Response | null {
  const result = limiter(key)
  if (!result.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Previše zahteva. Pokušajte ponovo kasnije.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((result.retryAfterMs || 60000) / 1000)),
        },
      }
    )
  }
  return null
}
