import { z } from 'zod'

import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { syncPrices, syncStock } from '@/lib/pantheon/sync-inbound'
import { processQueue } from '@/lib/pantheon/sync-outbound'

const triggerSchema = z.object({
  type: z.enum(['prices', 'stock', 'orders']),
})

/**
 * POST /api/admin/erp/sync — manually trigger a Pantheon sync.
 *
 * Body: { type: "prices" | "stock" | "orders" }
 *   - prices/stock: pull from Pantheon
 *   - orders: drain the outbound queue (push pending orders)
 *
 * No `products` type here on purpose — see the matching comment in
 * src/app/api/cron/erp-sync/route.ts. New products come in only through the
 * curated "review before import" modal (POST /api/admin/erp/pantheon-import).
 */
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json().catch(() => ({}))
  const { type } = triggerSchema.parse(body)

  switch (type) {
    case 'prices': {
      const r = await syncPrices()
      return successResponse({ type, ...r })
    }
    case 'stock': {
      const r = await syncStock()
      return successResponse({ type, ...r })
    }
    case 'orders': {
      const r = await processQueue()
      return successResponse({ type, ...r })
    }
    default:
      throw new ApiError(400, 'Nepoznat tip sinhronizacije')
  }
})
