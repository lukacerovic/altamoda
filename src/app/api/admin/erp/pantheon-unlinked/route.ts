import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { getPantheonClient, normalizeProduct } from '@/lib/pantheon/client'
import type { NormalizedPantheonProduct } from '@/lib/pantheon/types'

/**
 * GET /api/admin/erp/pantheon-unlinked — Pantheon products that have no
 * matching Product.erpId yet, for the "review before import" modal on
 * /admin/erp. Read-only: does not write anything, only surfaces the diff.
 *
 * Deliberately returns the full unlinked list in one shot (client filters by
 * search locally) rather than a paginated/searchable server endpoint — the
 * Pantheon API itself has no filtering, so we already have to fetch
 * everything; a few thousand small rows is trivial to hand to the browser.
 */
export const GET = withErrorHandler(async () => {
  await requireAdmin()

  const raw = await getPantheonClient().fetchProducts()
  const normalized = raw
    .map(normalizeProduct)
    .filter((p): p is NormalizedPantheonProduct => p !== null)

  const linked = await prisma.product.findMany({
    where: { erpId: { not: null } },
    select: { erpId: true },
  })
  const linkedCodes = new Set(linked.map((p) => p.erpId as string))

  const unlinked = normalized
    .filter((p) => !linkedCodes.has(p.code) && p.name)
    .map((p) => ({
      code: p.code,
      name: p.name,
      priceWithVat: p.priceWithVat,
      priceWithoutVat: p.priceWithoutVat,
      stock: p.stock,
      isActive: p.isActive,
    }))

  return successResponse({ products: unlinked, total: unlinked.length })
})
