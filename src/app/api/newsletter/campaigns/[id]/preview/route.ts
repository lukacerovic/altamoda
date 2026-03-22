import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { campaignTemplate } from '@/lib/email-templates'

// GET /api/newsletter/campaigns/[id]/preview — preview campaign email (admin only)
export const GET = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } })

  if (!campaign) {
    throw new ApiError(404, 'Kampanja nije pronađena')
  }

  const html = campaignTemplate(campaign.subject, campaign.content, 'preview@example.com')

  return successResponse({ html })
})
