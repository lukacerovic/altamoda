import { z } from 'zod'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { ERP_DEFAULT_VAT_RATE } from '@/lib/constants'
import { slugify } from '@/lib/utils'
import { ensureUniqueSlug } from '@/lib/pantheon/sync-inbound'

const itemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  priceWithVat: z.number(),
  priceWithoutVat: z.number(),
  stock: z.number(),
  isActive: z.boolean(),
})

const bodySchema = z.object({ items: z.array(itemSchema).min(1).max(500) })

/**
 * POST /api/admin/erp/pantheon-import — create products from a hand-picked
 * subset of the /admin/erp "review before import" modal. Intentionally
 * minimal: sku/name/price/stock/erpId only — no brand or category, because
 * Pantheon's API doesn't return either (see the disclaimer shown in the
 * modal). The admin is expected to complete each one via the normal product
 * edit screen afterward; /admin/products' "nedostaci" panel surfaces them.
 */
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json().catch(() => ({}))
  const { items } = bodySchema.parse(body)

  const codes = items.map((i) => i.code)
  const existing = await prisma.product.findMany({
    where: { OR: [{ erpId: { in: codes } }, { sku: { in: codes } }] },
    select: { erpId: true, sku: true },
  })
  const alreadyLinked = new Set(existing.map((p) => p.erpId).filter(Boolean) as string[])
  const skuTaken = new Set(existing.map((p) => p.sku))

  let created = 0
  const skipped: { code: string; reason: string }[] = []

  for (const item of items) {
    if (alreadyLinked.has(item.code)) {
      skipped.push({ code: item.code, reason: 'Već povezan sa Pantheon-om' })
      continue
    }
    if (skuTaken.has(item.code)) {
      skipped.push({ code: item.code, reason: 'Šifra već postoji na sajtu' })
      continue
    }
    try {
      const slug = await ensureUniqueSlug(slugify(item.name), item.code)
      await prisma.product.create({
        data: {
          sku: item.code,
          erpId: item.code,
          nameLat: item.name,
          slug,
          priceB2c: new Prisma.Decimal(item.priceWithVat),
          costPrice: new Prisma.Decimal(item.priceWithoutVat),
          stockQuantity: Math.max(0, Math.floor(item.stock)),
          isActive: item.isActive,
          erpIsActive: item.isActive,
          vatRate: ERP_DEFAULT_VAT_RATE,
        },
      })
      created++
    } catch (err) {
      skipped.push({ code: item.code, reason: (err as Error).message.slice(0, 120) })
    }
  }

  return successResponse({ created, skipped, total: items.length })
})
