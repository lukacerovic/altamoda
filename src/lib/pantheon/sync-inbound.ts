/**
 * Inbound Pantheon syncs: products, prices, stock.
 *
 * Behavior:
 *   - products sync: INSERTS new products (isActive + erpIsActive both seeded
 *     from Pantheon's active flag). For existing products, only mirrors the
 *     Pantheon flag into `erpIsActive` — NEVER touches the website's own
 *     `isActive`. Policy chosen by the owners (Option C / Hybrid): the website
 *     decides its own visibility; `erpIsActive` is informational for admin.
 *   - prices sync:   updates priceB2c + costPrice for existing products.
 *   - stock sync:    updates stockQuantity for existing products.
 *
 * Match key is always `Product.erpId` (= Pantheon acIdent), trimmed.
 */

import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { ERP_DEFAULT_VAT_RATE } from '@/lib/constants'
import { slugify } from '@/lib/utils'

import {
  getPantheonClient,
  normalizeProduct,
  normalizeStock,
  PantheonError,
} from './client'
import type {
  NormalizedPantheonProduct,
  NormalizedPantheonStock,
} from './types'

const BATCH_SIZE = 50

export interface SyncResult {
  logId: string
  itemsSynced: number
  itemsCreated?: number
  itemsUpdated?: number
  itemsSkipped?: number
  durationMs: number
}

// ─── Log helpers ─────────────────────────────────────────────────────────────

async function startLog(syncType: 'products' | 'prices' | 'stock') {
  return prisma.erpSyncLog.create({
    data: {
      syncType,
      direction: 'inbound',
      status: 'in_progress',
      itemsSynced: 0,
    },
    select: { id: true },
  })
}

async function finishLog(
  logId: string,
  data: {
    status: 'success' | 'failed'
    itemsSynced: number
    message?: string
    details?: Prisma.InputJsonValue
  },
) {
  await prisma.erpSyncLog.update({
    where: { id: logId },
    data: {
      status: data.status,
      itemsSynced: data.itemsSynced,
      message: data.message,
      details: data.details,
      completedAt: new Date(),
    },
  })
}

// ─── Slug generation for newly-created products ──────────────────────────────

async function ensureUniqueSlug(base: string, erpId: string): Promise<string> {
  const candidate = base ? `${base}-${erpId}` : `product-${erpId}`
  const taken = await prisma.product.findUnique({
    where: { slug: candidate },
    select: { id: true },
  })
  if (!taken) return candidate
  // Extremely unlikely collision; suffix a short random tail.
  return `${candidate}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── Product sync (creates new, updates only isActive on existing) ───────────

export async function syncProducts(): Promise<SyncResult> {
  const startedAt = Date.now()
  const log = await startLog('products')

  try {
    const client = getPantheonClient()
    const raw = await client.fetchProducts()
    const normalized = raw
      .map(normalizeProduct)
      .filter((p): p is NormalizedPantheonProduct => p !== null)

    const codes = normalized.map((p) => p.code)
    const existing = await prisma.product.findMany({
      where: { erpId: { in: codes } },
      select: { id: true, erpId: true, erpIsActive: true },
    })
    const existingByErpId = new Map(
      existing.filter((p): p is typeof p & { erpId: string } => !!p.erpId).map((p) => [p.erpId, p]),
    )

    let created = 0
    let updated = 0
    let skipped = 0

    for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
      const batch = normalized.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (item) => {
          const found = existingByErpId.get(item.code)
          if (found) {
            if (found.erpIsActive !== item.isActive) {
              await prisma.product.update({
                where: { id: found.id },
                data: { erpIsActive: item.isActive },
              })
              updated++
            } else {
              skipped++
            }
            return
          }

          if (!item.name) {
            skipped++
            return
          }
          const slug = await ensureUniqueSlug(slugify(item.name), item.code)
          try {
            await prisma.product.create({
              data: {
                sku: item.code,
                nameLat: item.name,
                slug,
                priceB2c: new Prisma.Decimal(item.priceWithVat),
                costPrice: new Prisma.Decimal(item.priceWithoutVat),
                stockQuantity: item.stock,
                isActive: item.isActive,
                erpIsActive: item.isActive,
                erpId: item.code,
                vatRate: ERP_DEFAULT_VAT_RATE,
              },
            })
            created++
          } catch (err) {
            // SKU/slug collision — skip rather than abort the whole batch.
            skipped++
            console.warn(
              `[pantheon] product create failed for erpId=${item.code}: ${(err as Error).message}`,
            )
          }
        }),
      )
    }

    await finishLog(log.id, {
      status: 'success',
      itemsSynced: created + updated,
      details: { created, updated, skipped, total: normalized.length },
    })

    return {
      logId: log.id,
      itemsSynced: created + updated,
      itemsCreated: created,
      itemsUpdated: updated,
      itemsSkipped: skipped,
      durationMs: Date.now() - startedAt,
    }
  } catch (err) {
    await finishLog(log.id, {
      status: 'failed',
      itemsSynced: 0,
      message: err instanceof PantheonError ? err.message : (err as Error).message,
    })
    throw err
  }
}

// ─── Price sync (existing products only) ─────────────────────────────────────

export async function syncPrices(): Promise<SyncResult> {
  const startedAt = Date.now()
  const log = await startLog('prices')

  try {
    const client = getPantheonClient()
    const raw = await client.fetchProducts()
    const normalized = raw
      .map(normalizeProduct)
      .filter((p): p is NormalizedPantheonProduct => p !== null)

    const codes = normalized.map((p) => p.code)
    const existing = await prisma.product.findMany({
      where: { erpId: { in: codes } },
      select: { id: true, erpId: true },
    })
    const idByErpId = new Map(
      existing.filter((p): p is typeof p & { erpId: string } => !!p.erpId).map((p) => [p.erpId, p.id]),
    )

    let updated = 0
    let skipped = 0

    for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
      const batch = normalized.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (item) => {
          const id = idByErpId.get(item.code)
          if (!id) {
            skipped++
            return
          }
          await prisma.product.update({
            where: { id },
            data: {
              priceB2c: new Prisma.Decimal(item.priceWithVat),
              costPrice: new Prisma.Decimal(item.priceWithoutVat),
            },
          })
          updated++
        }),
      )
    }

    await finishLog(log.id, {
      status: 'success',
      itemsSynced: updated,
      details: { updated, skipped, total: normalized.length },
    })

    return {
      logId: log.id,
      itemsSynced: updated,
      itemsUpdated: updated,
      itemsSkipped: skipped,
      durationMs: Date.now() - startedAt,
    }
  } catch (err) {
    await finishLog(log.id, {
      status: 'failed',
      itemsSynced: 0,
      message: err instanceof PantheonError ? err.message : (err as Error).message,
    })
    throw err
  }
}

// ─── Stock sync (existing products only) ─────────────────────────────────────

export async function syncStock(): Promise<SyncResult> {
  const startedAt = Date.now()
  const log = await startLog('stock')

  try {
    const client = getPantheonClient()
    const raw = await client.fetchStock()
    const normalized = raw
      .map(normalizeStock)
      .filter((s): s is NormalizedPantheonStock => s !== null)

    const codes = normalized.map((s) => s.code)
    const existing = await prisma.product.findMany({
      where: { erpId: { in: codes } },
      select: { id: true, erpId: true },
    })
    const idByErpId = new Map(
      existing.filter((p): p is typeof p & { erpId: string } => !!p.erpId).map((p) => [p.erpId, p.id]),
    )

    // Subtract pending unsynced web orders from Pantheon stock so we don't
    // double-count orders that haven't reached Pantheon yet.
    const pendingByProductId = await getPendingUnsyncedQuantitiesByProductId(
      Array.from(idByErpId.values()),
    )

    let updated = 0
    let skipped = 0

    for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
      const batch = normalized.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (item) => {
          const id = idByErpId.get(item.code)
          if (!id) {
            skipped++
            return
          }
          const pending = pendingByProductId.get(id) ?? 0
          const adjusted = Math.max(0, item.stock - pending)
          await prisma.product.update({
            where: { id },
            data: { stockQuantity: adjusted },
          })
          updated++
        }),
      )
    }

    await finishLog(log.id, {
      status: 'success',
      itemsSynced: updated,
      details: { updated, skipped, total: normalized.length },
    })

    return {
      logId: log.id,
      itemsSynced: updated,
      itemsUpdated: updated,
      itemsSkipped: skipped,
      durationMs: Date.now() - startedAt,
    }
  } catch (err) {
    await finishLog(log.id, {
      status: 'failed',
      itemsSynced: 0,
      message: err instanceof PantheonError ? err.message : (err as Error).message,
    })
    throw err
  }
}

/**
 * Sum the quantities of order items for orders that haven't been pushed to
 * Pantheon yet. Pantheon's stock figure doesn't account for these, so we
 * subtract them to prevent oversell.
 */
async function getPendingUnsyncedQuantitiesByProductId(
  productIds: string[],
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map()

  const rows = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
      order: { erpSynced: false, status: { not: 'otkazano' } },
    },
    _sum: { quantity: true },
  })

  return new Map(rows.map((r) => [r.productId, r._sum.quantity ?? 0]))
}
