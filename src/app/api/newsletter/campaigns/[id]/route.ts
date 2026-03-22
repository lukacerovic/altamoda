import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { updateCampaignSchema } from '@/lib/validations/newsletter'

// GET /api/newsletter/campaigns/[id] — get single campaign (admin only)
export const GET = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } })

  if (!campaign) {
    throw new ApiError(404, 'Kampanja nije pronađena')
  }

  return successResponse(campaign)
})

// PUT /api/newsletter/campaigns/[id] — update campaign (admin only, draft only)
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } })

  if (!campaign) {
    throw new ApiError(404, 'Kampanja nije pronađena')
  }

  if (campaign.status !== 'draft') {
    throw new ApiError(400, 'Samo kampanje u statusu "draft" mogu biti izmenjene')
  }

  const body = await req.json()
  const data = updateCampaignSchema.parse(body)

  const updated = await prisma.newsletterCampaign.update({
    where: { id },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : data.scheduledAt === null ? null : undefined,
    },
  })

  return successResponse(updated)
})

// DELETE /api/newsletter/campaigns/[id] — delete campaign (admin only, not sent)
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } })

  if (!campaign) {
    throw new ApiError(404, 'Kampanja nije pronađena')
  }

  if (campaign.status === 'sent') {
    throw new ApiError(400, 'Poslate kampanje ne mogu biti obrisane')
  }

  await prisma.newsletterCampaign.delete({ where: { id } })

  return successResponse({ message: 'Kampanja je obrisana' })
})
