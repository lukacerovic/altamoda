import { z } from 'zod'

import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { syncProducts, syncPrices, syncStock } from '@/lib/pantheon/sync-inbound'
import { processQueue } from '@/lib/pantheon/sync-outbound'

const triggerSchema = z.object({
  type: z.enum(['products', 'prices', 'stock', 'orders']),
})

/**
 * POST /api/admin/erp/sync — manually trigger a Pantheon sync.
 *
 * Body: { type: "products" | "prices" | "stock" | "orders" }
 *   - products/prices/stock: pull from Pantheon
 *   - orders: drain the outbound queue (push pending orders)
 */
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json().catch(() => ({}))
  const { type } = triggerSchema.parse(body)

  switch (type) {
    case 'products': {
      const r = await syncProducts()
      return successResponse({ type, ...r })
    }
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
