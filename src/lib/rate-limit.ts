/**
 * Sliding-window rate limiter.
 *
 * Uses Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 * are present (multi-instance / serverless safe), otherwise falls back to an
 * in-memory Map (single-instance dev only).
 *
 * The exported API is unchanged — call sites keep using `authRateLimiter(key)`
 * or `applyRateLimit(limiter, key)` the same way.
 */

/* ---------- Types ---------- */

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

type RateLimiter = (key: string) => Promise<RateLimitResult> | RateLimitResult

/* ---------- Backend selection ---------- */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const USE_REDIS = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

/* ---------- In-memory backend (fallback) ---------- */

interface RateLimitEntry { timestamps: number[] }
const memStore = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function memoryCleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  const cutoff = now - windowMs
  for (const [key, entry] of memStore) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) memStore.delete(key)
  }
}

function memoryLimit(config: RateLimitConfig, key: string): RateLimitResult {
  const { windowMs, maxRequests } = config
  memoryCleanup(windowMs)

  const now = Date.now()
  const cutoff = now - windowMs

  let entry = memStore.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    memStore.set(key, entry)
  }
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    return { success: false, remaining: 0, retryAfterMs: oldestInWindow + windowMs - now }
  }

  entry.timestamps.push(now)
  return { success: true, remaining: maxRequests - entry.timestamps.length, retryAfterMs: null }
}

/* ---------- Redis backend (Upstash REST) ---------- */

/**
 * Upstash's REST API is stateless HTTP — no TCP client needed.
 * We implement a sliding window with sorted sets (ZADD/ZREMRANGEBYSCORE/ZCARD).
 */
async function redisPipeline(commands: unknown[][]): Promise<unknown[]> {
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upstash pipeline failed: ${res.status} ${text}`)
  }
  const json = (await res.json()) as Array<{ result?: unknown; error?: string }>
  return json.map((r) => r.result)
}

async function redisLimit(config: RateLimitConfig, key: string): Promise<RateLimitResult> {
  const { windowMs, maxRequests } = config
  const now = Date.now()
  const cutoff = now - windowMs
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`
  const redisKey = `ratelimit:${key}`

  // Atomic sliding window: drop old entries → add current → count → set TTL
  const results = await redisPipeline([
    ['ZREMRANGEBYSCORE', redisKey, 0, cutoff],
    ['ZADD', redisKey, now, member],
    ['ZRANGE', redisKey, 0, 0, 'WITHSCORES'],
    ['ZCARD', redisKey],
    ['PEXPIRE', redisKey, windowMs],
  ])

  const oldestRange = results[2] as string[] | null
  const count = Number(results[3] ?? 0)

  if (count > maxRequests) {
    // Too many — roll back our own entry so we don't poison the window
    await redisPipeline([['ZREM', redisKey, member]])
    const oldestScore = oldestRange && oldestRange.length >= 2 ? Number(oldestRange[1]) : now
    return { success: false, remaining: 0, retryAfterMs: oldestScore + windowMs - now }
  }

  return { success: true, remaining: Math.max(0, maxRequests - count), retryAfterMs: null }
}

/* ---------- Public factory ---------- */

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  if (USE_REDIS) {
    return async (key: string) => {
      try {
        return await redisLimit(config, key)
      } catch (err) {
        // On Redis outage, fail-open but log — better than blocking legit users
        console.error('[rate-limit] Redis error, allowing request:', err)
        return { success: true, remaining: config.maxRequests, retryAfterMs: null }
      }
    }
  }
  return (key: string) => memoryLimit(config, key)
}

/* ---------- Pre-configured limiters ---------- */

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
})

export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
})

export const orderRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
})

export const checkStatusRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
})

export const newsletterRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
})

/* ---------- Utilities ---------- */

/**
 * Extract client IP from request headers.
 * Uses the rightmost IP in X-Forwarded-For (the one added by the trusted proxy),
 * not the leftmost (which is client-controlled and spoofable).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim())
    return ips[ips.length - 1]
  }
  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Apply rate limiting and return a 429 Response if exceeded, or null if allowed.
 * Handles both sync (memory) and async (Redis) limiters transparently.
 */
export async function applyRateLimit(
  limiter: RateLimiter,
  key: string,
): Promise<Response | null> {
  const result = await limiter(key)
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
      },
    )
  }
  return null
}
