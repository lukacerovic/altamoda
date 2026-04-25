import { prisma } from './db'
import type { NotificationType, Prisma } from '@prisma/client'

interface NotifyAdminsArgs {
  type: NotificationType
  title: string
  body?: string
  link?: string
  payload?: Prisma.InputJsonValue
}

// Fan out a notification to every admin user. Safe to call from inside an
// existing transaction — pass `tx` to keep it atomic with the triggering write.
// Failures are swallowed and logged; a notification write must never break the
// request that triggered it.
export async function notifyAdmins(
  args: NotifyAdminsArgs,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<void> {
  try {
    const admins = await tx.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    })
    if (admins.length === 0) return
    await tx.notification.createMany({
      data: admins.map(a => ({
        userId: a.id,
        type: args.type,
        title: args.title,
        body: args.body,
        link: args.link,
        payload: args.payload,
      })),
    })
  } catch (err) {
    console.error('[notifications] notifyAdmins failed:', err)
  }
}

interface LowStockBefore {
  id: string
  sku: string
  nameLat: string
  stockQuantity: number
  lowStockThreshold: number
}

// Fires the low-stock notification only on the *threshold crossing*: when stock
// was above the threshold before and is at or below it after. Doesn't re-fire
// while still below — avoids notification spam on chronically low products.
// Skip entirely when threshold is 0 (opt-out).
export async function maybeNotifyLowStock(
  before: LowStockBefore,
  afterStockQty: number,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  if (before.lowStockThreshold <= 0) return
  if (before.stockQuantity > before.lowStockThreshold && afterStockQty <= before.lowStockThreshold) {
    await notifyAdmins(
      {
        type: 'low_stock',
        title: `Nizak nivo zaliha: ${before.nameLat}`,
        body: `Trenutno ${afterStockQty} kom (prag: ${before.lowStockThreshold})`,
        link: '/admin/products',
        payload: {
          productId: before.id,
          productSku: before.sku,
          productName: before.nameLat,
          stockQuantity: afterStockQty,
          lowStockThreshold: before.lowStockThreshold,
        },
      },
      tx,
    )
  }
}
