/**
 * Outbound Pantheon sync: web orders → Pantheon via action=altaorder.
 *
 * Replaces the legacy synchronous `Synchronization_model::send_order()` with
 * an async outbox pattern:
 *
 *   1. On order creation, we insert an ErpSyncQueue row (status=pending).
 *   2. A worker (`processQueue`) polls the queue and pushes orders to
 *      Pantheon with retry/backoff per ERP_SYNC_RETRY_DELAYS_MS.
 *   3. On success: queue row goes to "done", Order.erpSynced=true,
 *      Order.erpId set to whatever Pantheon returned (if anything).
 *   4. On failure: attempts++, nextRetryAt scheduled, queue row goes to
 *      "retrying"; after max attempts → "failed", logged for admin review.
 */

import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import {
  ERP_SYNC_MAX_RETRIES,
  ERP_SYNC_RETRY_DELAYS_MS,
} from '@/lib/constants'

import {
  getPantheonClient,
  PantheonError,
} from './client'
import type { PantheonOrderItem, PantheonOrderPayload } from './types'

type Tx = Prisma.TransactionClient | typeof prisma

const QUEUE_BATCH_SIZE = 20

// ─── Payload building ────────────────────────────────────────────────────────

/**
 * Build the JSON payload for action=altaorder from our Order + related data.
 * Pure function (does not write to DB). Caller is expected to pre-load the
 * Order with its items, the user, and the B2B profile if present.
 */
export function buildPantheonOrderPayload(args: {
  orderId: string
  orderNumber: string
  createdAt: Date
  subtotal: number
  shippingCost: number
  total: number
  paymentMethod: 'card' | 'bank_transfer' | 'cash_on_delivery' | 'invoice'
  shippingAddress: ShippingAddress | null
  billingAddress: ShippingAddress | null
  notes: string | null
  userName: string
  userEmail: string
  userPhone: string | null
  b2b: { salonName: string; pib: string | null; maticniBroj: string | null } | null
  items: Array<{ productCode: string | null; quantity: number; unitPrice: number }>
}): PantheonOrderPayload {
  const { firstName, lastName } = splitName(args.userName)
  const ship = args.shippingAddress
  const bill = args.billingAddress ?? ship
  const shipToDiff = areAddressesDifferent(ship, bill) ? 1 : 0

  const items: PantheonOrderItem[] = args.items
    .filter((i) => !!i.productCode)
    .map((i) => ({
      product_code: i.productCode as string,
      quantity: i.quantity,
      price: i.unitPrice,
    }))

  return {
    order_id: args.orderId,
    first_name: firstName,
    last_name: lastName,
    email: args.userEmail,
    contact_phone: args.userPhone ?? '',
    city: bill?.city ?? '',
    address: bill?.street ?? '',
    postal_no: bill?.postalCode ?? '',
    company_name: args.b2b?.salonName ?? '',
    company_pib: args.b2b?.pib ?? '',
    company_reg_number: args.b2b?.maticniBroj ?? '',
    items_price: args.subtotal,
    shipping_price: args.shippingCost,
    total_price: args.total,
    payment_type: translatePaymentMethod(args.paymentMethod),
    ship_to_diff_address: shipToDiff,
    shipping_first_name: shipToDiff ? firstName : '',
    shipping_last_name: shipToDiff ? lastName : '',
    shipping_email: shipToDiff ? args.userEmail : '',
    shipping_city: shipToDiff ? (ship?.city ?? '') : '',
    shipping_address: shipToDiff ? (ship?.street ?? '') : '',
    shipping_postal_no: shipToDiff ? (ship?.postalCode ?? '') : '',
    shipping_contact_phone: shipToDiff ? (args.userPhone ?? '') : '',
    additional_instructions: args.notes ?? '',
    order_date: formatPantheonDate(args.createdAt),
    items,
  }
}

interface ShippingAddress {
  street?: string
  city?: string
  postalCode?: string
  country?: string
}

function splitName(full: string): { firstName: string; lastName: string } {
  const trimmed = (full ?? '').trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const idx = trimmed.indexOf(' ')
  if (idx === -1) return { firstName: trimmed, lastName: '' }
  return {
    firstName: trimmed.slice(0, idx),
    lastName: trimmed.slice(idx + 1).trim(),
  }
}

function areAddressesDifferent(a: ShippingAddress | null, b: ShippingAddress | null): boolean {
  if (!a || !b) return false
  return (
    (a.street ?? '') !== (b.street ?? '') ||
    (a.city ?? '') !== (b.city ?? '') ||
    (a.postalCode ?? '') !== (b.postalCode ?? '')
  )
}

/**
 * Match the legacy CodeIgniter send_order() payment_type mapping exactly.
 * tkomserver likely string-matches on these on its side.
 */
function translatePaymentMethod(m: 'card' | 'bank_transfer' | 'cash_on_delivery' | 'invoice'): string {
  switch (m) {
    case 'cash_on_delivery':
      return 'Pouzećem'
    case 'bank_transfer':
      return 'Uplatnicom'
    case 'card':
      return 'Karticom'
    case 'invoice':
      return 'Faktura'
  }
}

function formatPantheonDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

// ─── Enqueue ────────────────────────────────────────────────────────────────

/**
 * Insert an outbound sync queue entry for an order. Safe to call from inside
 * a Prisma transaction (`tx.erpSyncQueue.create(...)`). If `tx` is omitted the
 * default prisma client is used.
 *
 * Idempotent: if a non-terminal (pending/retrying) queue row already exists
 * for this order, this is a no-op.
 */
export async function enqueueOrderSync(orderId: string, tx: Tx = prisma): Promise<void> {
  const existing = await tx.erpSyncQueue.findFirst({
    where: {
      entityType: 'order',
      entityId: orderId,
      status: { in: ['pending', 'retrying'] },
    },
    select: { id: true },
  })
  if (existing) return

  // Payload is built lazily at processing time so it reflects the freshest
  // order state (e.g., notes added later). Store a marker only.
  await tx.erpSyncQueue.create({
    data: {
      entityType: 'order',
      entityId: orderId,
      direction: 'outbound',
      payload: {}, // built at processing time
      status: 'pending',
    },
  })
}

// ─── Queue processing ───────────────────────────────────────────────────────

export interface QueueProcessResult {
  processed: number
  succeeded: number
  failed: number
  exhausted: number
}

/**
 * Process up to `limit` queue items. Picks pending + retrying-due rows in FIFO
 * order. Should be called from a cron route every ~1-5 min.
 */
export async function processQueue(limit = QUEUE_BATCH_SIZE): Promise<QueueProcessResult> {
  const now = new Date()
  const items = await prisma.erpSyncQueue.findMany({
    where: {
      direction: 'outbound',
      entityType: 'order',
      OR: [
        { status: 'pending' },
        { status: 'retrying', nextRetryAt: { lte: now } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  const result: QueueProcessResult = { processed: 0, succeeded: 0, failed: 0, exhausted: 0 }

  for (const item of items) {
    result.processed++
    try {
      await processOrderQueueItem(item.id, item.entityId)
      result.succeeded++
    } catch (err) {
      const exhausted = await handleQueueFailure(item.id, item.attempts, err)
      if (exhausted) result.exhausted++
      else result.failed++
    }
  }

  return result
}

/** Process one queue row by ID. Returns the order's Pantheon response, if any. */
export async function processOrderQueueItem(
  queueItemId: string,
  orderId: string,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { erpId: true } } } },
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          b2bProfile: {
            select: { salonName: true, pib: true, maticniBroj: true },
          },
        },
      },
    },
  })

  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }
  if (order.erpSynced) {
    // Already synced — mark queue row done.
    await prisma.erpSyncQueue.update({
      where: { id: queueItemId },
      data: { status: 'done', lastError: null },
    })
    return
  }

  const payload = buildPantheonOrderPayload({
    orderId: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress as ShippingAddress | null,
    billingAddress: order.billingAddress as ShippingAddress | null,
    notes: order.notes,
    userName: order.user.name,
    userEmail: order.user.email,
    userPhone: order.user.phone,
    b2b: order.user.b2bProfile
      ? {
          salonName: order.user.b2bProfile.salonName,
          pib: order.user.b2bProfile.pib,
          maticniBroj: order.user.b2bProfile.maticniBroj,
        }
      : null,
    items: order.items.map((i) => ({
      productCode: i.product?.erpId ?? null,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
  })

  // Log start
  const log = await prisma.erpSyncLog.create({
    data: {
      syncType: 'orders',
      direction: 'outbound',
      status: 'in_progress',
      details: { orderId, queueItemId },
    },
    select: { id: true },
  })

  let response: unknown = null
  try {
    response = await getPantheonClient().pushOrder(payload)
  } catch (err) {
    await prisma.erpSyncLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        message: err instanceof PantheonError ? err.message : (err as Error).message,
        details: { orderId, queueItemId },
      },
    })
    throw err
  }

  // Try to extract a Pantheon order reference from the response (acKey,
  // order_id, ref, etc.). Until we observe a real response we accept any
  // string-y top-level field.
  const erpRef = extractErpRef(response)

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        erpSynced: true,
        erpId: erpRef,
      },
    }),
    prisma.erpSyncQueue.update({
      where: { id: queueItemId },
      data: { status: 'done', lastError: null, nextRetryAt: null },
    }),
    prisma.erpSyncLog.update({
      where: { id: log.id },
      data: {
        status: 'success',
        itemsSynced: 1,
        completedAt: new Date(),
        details: { orderId, queueItemId, response: response as Prisma.InputJsonValue },
      },
    }),
  ])
}

/**
 * Update a queue row after a failed push. Returns true if max retries exhausted.
 */
async function handleQueueFailure(
  queueItemId: string,
  prevAttempts: number,
  err: unknown,
): Promise<boolean> {
  const attempts = prevAttempts + 1
  const message = err instanceof PantheonError ? err.message : (err as Error).message
  const exhausted = attempts >= ERP_SYNC_MAX_RETRIES

  if (exhausted) {
    await prisma.erpSyncQueue.update({
      where: { id: queueItemId },
      data: {
        status: 'failed',
        attempts,
        lastError: message,
        nextRetryAt: null,
      },
    })
    return true
  }

  const delay =
    ERP_SYNC_RETRY_DELAYS_MS[Math.min(attempts - 1, ERP_SYNC_RETRY_DELAYS_MS.length - 1)]
  await prisma.erpSyncQueue.update({
    where: { id: queueItemId },
    data: {
      status: 'retrying',
      attempts,
      lastError: message,
      nextRetryAt: new Date(Date.now() + delay),
    },
  })
  return false
}

function extractErpRef(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null
  const obj = response as Record<string, unknown>
  for (const key of ['acKey', 'ackey', 'order_id', 'orderId', 'ref', 'reference', 'id']) {
    const v = obj[key]
    if (typeof v === 'string' && v.length > 0) return v
    if (typeof v === 'number') return String(v)
  }
  return null
}

// ─── Manual retry (called from admin route) ─────────────────────────────────

/** Reset a failed/retrying queue row to pending so the next worker pass picks it up. */
export async function requeueFailed(queueItemId: string): Promise<void> {
  await prisma.erpSyncQueue.update({
    where: { id: queueItemId },
    data: {
      status: 'pending',
      attempts: 0,
      nextRetryAt: null,
      lastError: null,
    },
  })
}
