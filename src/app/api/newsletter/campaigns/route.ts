import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, getPaginationParams } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { createCampaignSchema } from '@/lib/validations/newsletter'
import { reconcileStuckCampaigns } from '@/lib/newsletter-reconcile'

// GET /api/newsletter/campaigns — list campaigns (admin only)
export const GET = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  await reconcileStuckCampaigns()

  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = getPaginationParams(searchParams)
  const status = searchParams.get('status') || 'all'

  const where: Record<string, unknown> = {}

  if (status !== 'all') {
    where.status = status
  }

  const [campaigns, total] = await Promise.all([
    prisma.newsletterCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.newsletterCampaign.count({ where }),
  ])

  return successResponse({ campaigns, total, page, limit })
})

// POST /api/newsletter/campaigns — create campaign (admin only)
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const body = await req.json()
  const data = createCampaignSchema.parse(body)

  const campaign = await prisma.newsletterCampaign.create({
    data: {
      title: data.title,
      subject: data.subject,
      content: data.content,
      segment: data.segment,
      status: 'draft',
      emailOptions: data.emailOptions ?? undefined,
    },
  })

  return successResponse(campaign, 201)
})
