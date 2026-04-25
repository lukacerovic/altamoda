import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findMany: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/db'
import { notifyAdmins, maybeNotifyLowStock } from '@/lib/notifications'

const mockPrisma = vi.mocked(prisma)

describe('notifyAdmins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes one notification row per admin', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'a1' }, { id: 'a2' }, { id: 'a3' },
    ] as any)
    mockPrisma.notification.createMany.mockResolvedValue({ count: 3 } as any)

    await notifyAdmins({ type: 'order_created', title: 'Test' })

    expect(mockPrisma.notification.createMany).toHaveBeenCalledTimes(1)
    const call = mockPrisma.notification.createMany.mock.calls[0][0]
    expect(call.data).toHaveLength(3)
    expect((call.data as any[])[0]).toMatchObject({ userId: 'a1', type: 'order_created', title: 'Test' })
  })

  it('no-ops when there are zero admins', async () => {
    mockPrisma.user.findMany.mockResolvedValue([] as any)
    await notifyAdmins({ type: 'order_created', title: 'Test' })
    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled()
  })

  it('only selects admin id field (perf — no SELECT *)', async () => {
    mockPrisma.user.findMany.mockResolvedValue([] as any)
    await notifyAdmins({ type: 'order_created', title: 'Test' })
    const call = mockPrisma.user.findMany.mock.calls[0][0]
    expect(call).toMatchObject({ where: { role: 'admin' }, select: { id: true } })
  })

  it('swallows errors so the triggering request never breaks', async () => {
    mockPrisma.user.findMany.mockRejectedValue(new Error('DB down'))
    await expect(notifyAdmins({ type: 'order_created', title: 'Test' })).resolves.toBeUndefined()
  })

  it('uses the provided transaction client when one is passed', async () => {
    const tx = {
      user: { findMany: vi.fn().mockResolvedValue([{ id: 'a1' }]) },
      notification: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
    }
    await notifyAdmins({ type: 'order_created', title: 'Test' }, tx as any)
    expect(tx.user.findMany).toHaveBeenCalled()
    expect(tx.notification.createMany).toHaveBeenCalled()
    expect(mockPrisma.user.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled()
  })
})

describe('maybeNotifyLowStock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseProduct = { id: 'p1', sku: 'SKU-1', nameLat: 'Test Product' }

  it('fires when stock crosses below the threshold', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'a1' }] as any)
    mockPrisma.notification.createMany.mockResolvedValue({ count: 1 } as any)

    await maybeNotifyLowStock(
      { ...baseProduct, stockQuantity: 12, lowStockThreshold: 10 },
      8,
    )

    expect(mockPrisma.notification.createMany).toHaveBeenCalledTimes(1)
    const data = (mockPrisma.notification.createMany.mock.calls[0][0] as any).data[0]
    expect(data.type).toBe('low_stock')
    expect(data.title).toContain('Test Product')
  })

  it('does not fire when stock was already below the threshold', async () => {
    await maybeNotifyLowStock(
      { ...baseProduct, stockQuantity: 8, lowStockThreshold: 10 },
      6,
    )
    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled()
  })

  it('does not fire when stock stays above the threshold', async () => {
    await maybeNotifyLowStock(
      { ...baseProduct, stockQuantity: 50, lowStockThreshold: 10 },
      30,
    )
    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled()
  })

  it('opts out when threshold is 0', async () => {
    await maybeNotifyLowStock(
      { ...baseProduct, stockQuantity: 5, lowStockThreshold: 0 },
      0,
    )
    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled()
  })

  it('fires on the boundary (after === threshold)', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'a1' }] as any)
    mockPrisma.notification.createMany.mockResolvedValue({ count: 1 } as any)

    await maybeNotifyLowStock(
      { ...baseProduct, stockQuantity: 11, lowStockThreshold: 10 },
      10,
    )
    expect(mockPrisma.notification.createMany).toHaveBeenCalledTimes(1)
  })
})
