import { prisma } from './db'

// Maximum time a campaign is allowed to stay in `sending` before we consider
// it orphaned. The throttle is 200/hr so a 1000-recipient campaign takes ~5h.
// Anything over 8h must have died (server restart, fatal SMTP error, OOM).
const STUCK_AFTER_MS = 8 * 60 * 60 * 1000

// Flip orphaned `sending` rows to `failed` so admin can see what happened and
// re-send if needed. Called opportunistically from campaign list/send routes —
// no separate cron is required, the worst case is a few hours of stale state
// until the next admin visit.
export async function reconcileStuckCampaigns(): Promise<number> {
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS)
  const result = await prisma.newsletterCampaign.updateMany({
    where: { status: 'sending', updatedAt: { lt: cutoff } },
    data: { status: 'failed' },
  })
  if (result.count > 0) {
    console.warn(`[newsletter] Reconciled ${result.count} stuck "sending" campaigns to "failed"`)
  }
  return result.count
}
