import { NextRequest } from 'next/server'
import { handlers } from '@/lib/auth'
import { authRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'

export const { GET } = handlers

// Wrap POST with rate limiting to protect login from brute-force
export const POST = async (req: NextRequest) => {
  const rateLimitResponse = applyRateLimit(authRateLimiter, `auth:${getClientIp(req)}`)
  if (rateLimitResponse) return rateLimitResponse

  return handlers.POST(req)
}
