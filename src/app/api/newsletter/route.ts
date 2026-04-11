import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError, getPaginationParams } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { subscribeSchema, unsubscribeSchema, newsletterFilterSchema } from '@/lib/validations/newsletter'
import { newsletterRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'

// POST /api/newsletter — subscribe (public)
export const POST = withErrorHandler(async (req: Request) => {
  const rateLimitResponse = applyRateLimit(newsletterRateLimiter, `newsletter:${getClientIp(req)}`)
  if (rateLimitResponse) return rateLimitResponse as never

  const body = await req.json()
  const { email, segment } = subscribeSchema.parse(body)

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })

  if (existing && existing.isSubscribed) {
    throw new ApiError(409, 'Već ste prijavljeni na newsletter')
  }

  if (existing && !existing.isSubscribed) {
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        isSubscribed: true,
        segment,
        subscribedAt: new Date(),
        unsubscribedAt: null,
      },
    })

    void (async () => {
      const { sendTransactional } = await import('@/lib/email')
      const { welcomeTemplate } = await import('@/lib/email-templates')
      return sendTransactional({
        to: email,
        subject: 'Dobrodošli u Altamoda porodicu! 🎉',
        html: welcomeTemplate(email),
      })
    })().catch((err) => console.error('[newsletter] welcome email failed:', err))

    return successResponse({ message: 'Uspešno ste se ponovo prijavili na newsletter' }, 201)
  }

  await prisma.newsletterSubscriber.create({
    data: { email, segment },
  })

  // Send welcome email (non-blocking)
  try {
    const { sendTransactional } = await import('@/lib/email')
    const { welcomeTemplate } = await import('@/lib/email-templates')
    await sendTransactional({
      to: email,
      subject: 'Dobrodošli u Altamoda porodicu! 🎉',
      html: welcomeTemplate(email),
    })
  } catch (err) {
    console.error('Failed to send welcome email:', err)
    // Don't fail the subscription if email fails
  }

  return successResponse({ message: 'Uspešno ste se prijavili na newsletter' }, 201)
})

// DELETE /api/newsletter — unsubscribe (public)
export const DELETE = withErrorHandler(async (req: Request) => {
  const body = await req.json()
  const { email } = unsubscribeSchema.parse(body)

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { email } })

  if (!subscriber || !subscriber.isSubscribed) {
    throw new ApiError(404, 'Email adresa nije pronađena među pretplatnicima')
  }

  await prisma.newsletterSubscriber.update({
    where: { email },
    data: {
      isSubscribed: false,
      unsubscribedAt: new Date(),
    },
  })

  return successResponse({ message: 'Uspešno ste se odjavili sa newslettera' })
})

// GET /api/newsletter — list subscribers (admin only)
export const GET = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const { searchParams } = new URL(req.url)
  const { search, segment } = newsletterFilterSchema.parse({
    search: searchParams.get('search') || '',
    segment: searchParams.get('segment') || 'all',
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
  })
  const { page, limit, skip } = getPaginationParams(searchParams)

  const where: Record<string, unknown> = {}

  if (search) {
    where.email = { contains: search, mode: 'insensitive' }
  }

  if (segment !== 'all') {
    where.segment = segment
  }

  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.newsletterSubscriber.count({ where }),
  ])

  return successResponse({ subscribers, total, page, limit })
})
