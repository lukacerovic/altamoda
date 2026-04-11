import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { sendBulk, rewriteAssetUrls, getUnsubscribeUrl, type BulkEmail } from '@/lib/email'
import { generateEmailPreview, type EmailTemplateOptions } from '@/lib/email-preview'
import { reconcileStuckCampaigns } from '@/lib/newsletter-reconcile'

// POST /api/newsletter/campaigns/[id]/send — send campaign (admin only).
//
// The actual SMTP delivery runs in the background; the request returns
// immediately after the campaign row flips to `sending`. The DB row's `status`
// field is the source of truth for completion — admin polls the campaign list.
//
// IMPORTANT: This endpoint relies on the Node process staying alive for the
// full drain (~5 hours for 1000 recipients at 200/hr). Safe on a long-running
// VPS like Adriahost / `next start`. UNSAFE on Vercel and other serverless
// platforms which kill the function instance after the response is sent — a
// queue worker (Inngest, BullMQ, cron) would be required there.
export const POST = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()
  await reconcileStuckCampaigns()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  // Atomic status flip — only one click can win. Prevents the double-send
  // race where two admins (or a double-click) both pass the status check
  // and both fire background sends to every subscriber.
  const claimed = await prisma.newsletterCampaign.updateMany({
    where: { id, status: { in: ['draft', 'scheduled'] } },
    data: { status: 'sending' },
  })

  if (claimed.count === 0) {
    const existing = await prisma.newsletterCampaign.findUnique({ where: { id } })
    if (!existing) throw new ApiError(404, 'Kampanja nije pronađena')
    throw new ApiError(
      409,
      `Kampanja je u statusu "${existing.status}" — slanje nije moguće`
    )
  }

  const campaign = await prisma.newsletterCampaign.findUniqueOrThrow({ where: { id } })

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { isSubscribed: true, segment: campaign.segment },
    select: { email: true },
  })

  if (subscribers.length === 0) {
    await prisma.newsletterCampaign.update({
      where: { id },
      data: { status: 'failed' },
    })
    throw new ApiError(400, 'Nema aktivnih pretplatnika za ovaj segment')
  }

  const options = (campaign.emailOptions ?? undefined) as EmailTemplateOptions | undefined
  const subject = campaign.subject
  const content = campaign.content
  const recipientList = subscribers.map((s) => s.email)

  // Lazy generator — yields one fully-rendered email at a time so we don't
  // hold the full N-recipient HTML payload in RAM during the 5-hour drain.
  const emailIterator: Iterable<BulkEmail> = {
    [Symbol.iterator]() {
      let i = 0
      return {
        next() {
          if (i >= recipientList.length) return { done: true, value: undefined as never }
          const recipient = recipientList[i++]
          const html = rewriteAssetUrls(
            generateEmailPreview(content, options, getUnsubscribeUrl(recipient))
          )
          return { done: false, value: { to: recipient, subject, html } }
        },
      }
    },
  }

  ;(async () => {
    try {
      const result = await sendBulk(emailIterator, { total: recipientList.length })
      await prisma.newsletterCampaign.update({
        where: { id },
        data: {
          status: result.sent === 0 ? 'failed' : 'sent',
          sentAt: new Date(),
          sentCount: result.sent,
        },
      })
      if (result.failed > 0) {
        console.warn(`[campaign ${id}] sent=${result.sent} failed=${result.failed}`)
      }
    } catch (err) {
      console.error(`[campaign ${id}] background send error:`, err)
      await prisma.newsletterCampaign
        .update({ where: { id }, data: { status: 'failed' } })
        .catch(() => {})
    }
  })()

  return successResponse({
    message: 'Kampanja je pokrenuta. Slanje se odvija u pozadini.',
    recipientCount: recipientList.length,
    status: 'sending',
  })
})
