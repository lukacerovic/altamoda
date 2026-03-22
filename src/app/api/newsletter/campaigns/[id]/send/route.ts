import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { sendBatchEmails } from '@/lib/email'
import { campaignTemplate } from '@/lib/email-templates'

// POST /api/newsletter/campaigns/[id]/send — send campaign (admin only)
export const POST = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } })

  if (!campaign) {
    throw new ApiError(404, 'Kampanja nije pronađena')
  }

  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    throw new ApiError(400, 'Samo kampanje u statusu "draft" ili "scheduled" mogu biti poslate')
  }

  // Get all active subscribers matching the campaign's segment
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      isSubscribed: true,
      segment: campaign.segment,
    },
  })

  if (subscribers.length === 0) {
    throw new ApiError(400, 'Nema aktivnih pretplatnika za ovaj segment')
  }

  // Update campaign status to "sending"
  await prisma.newsletterCampaign.update({
    where: { id },
    data: { status: 'sending' },
  })

  try {
    // Build email list
    const emails = subscribers.map((subscriber) => ({
      to: subscriber.email,
      subject: campaign.subject,
      html: campaignTemplate(campaign.subject, campaign.content, subscriber.email),
    }))

    // Send batch emails
    await sendBatchEmails(emails)

    // Update campaign: status "sent", sentAt, sentCount
    const updated = await prisma.newsletterCampaign.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        sentCount: subscribers.length,
      },
    })

    return successResponse(updated)
  } catch (error) {
    // If send fails, set status to "failed"
    await prisma.newsletterCampaign.update({
      where: { id },
      data: { status: 'failed' },
    })

    console.error('Campaign send error:', error)
    throw new ApiError(500, 'Slanje kampanje nije uspelo')
  }
})
