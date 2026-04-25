import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}))

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'

const mockPrisma = vi.mocked(prisma)
const mockRequireAdmin = vi.mocked(requireAdmin)

const adminUser = { id: 'admin-1', email: 'a@a.com', name: 'A', role: 'admin' as const }

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue(adminUser as any)
  })

  it('returns list + pagination + unreadCount in one response', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: 'n1', type: 'order_created', title: 'T', body: null, link: null, readAt: null, createdAt: new Date(), payload: null },
    ] as any)
    mockPrisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1)

    const { GET } = await import('@/app/api/notifications/route')
    const res = await GET(new Request('http://localhost/api/notifications?limit=20'))
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.data.notifications).toHaveLength(1)
    expect(data.data.pagination).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 })
    expect(data.data.unreadCount).toBe(1)
  })

  it('caps limit at 50 even when a larger value is requested', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([] as any)
    mockPrisma.notification.count.mockResolvedValue(0)

    const { GET } = await import('@/app/api/notifications/route')
    await GET(new Request('http://localhost/api/notifications?limit=10000'))

    const call = mockPrisma.notification.findMany.mock.calls[0][0] as any
    expect(call.take).toBe(50)
  })

  it('scopes the query to the current admin (no leaking other users\' rows)', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([] as any)
    mockPrisma.notification.count.mockResolvedValue(0)

    const { GET } = await import('@/app/api/notifications/route')
    await GET(new Request('http://localhost/api/notifications'))

    const call = mockPrisma.notification.findMany.mock.calls[0][0] as any
    expect(call.where).toMatchObject({ userId: 'admin-1' })
  })

  it('honors unreadOnly filter', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([] as any)
    mockPrisma.notification.count.mockResolvedValue(0)

    const { GET } = await import('@/app/api/notifications/route')
    await GET(new Request('http://localhost/api/notifications?unreadOnly=true'))

    const call = mockPrisma.notification.findMany.mock.calls[0][0] as any
    expect(call.where).toMatchObject({ userId: 'admin-1', readAt: null })
  })

  it('sets Cache-Control: no-store on the response', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([] as any)
    mockPrisma.notification.count.mockResolvedValue(0)

    const { GET } = await import('@/app/api/notifications/route')
    const res = await GET(new Request('http://localhost/api/notifications'))
    expect(res.headers.get('Cache-Control')).toBe('no-store, must-revalidate')
  })
})

describe('GET /api/notifications/unread-count', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue(adminUser as any)
  })

  it('returns the unread count', async () => {
    mockPrisma.notification.count.mockResolvedValue(7)

    const { GET } = await import('@/app/api/notifications/unread-count/route')
    const res = await GET(new Request('http://localhost/api/notifications/unread-count'))
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.data.count).toBe(7)
  })

  it('queries scoped to current admin and unread only', async () => {
    mockPrisma.notification.count.mockResolvedValue(0)
    const { GET } = await import('@/app/api/notifications/unread-count/route')
    await GET(new Request('http://localhost/api/notifications/unread-count'))

    expect(mockPrisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'admin-1', readAt: null },
    })
  })
})

describe('PATCH /api/notifications/[id]/read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue(adminUser as any)
  })

  it('marks the notification as read and returns success', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 } as any)

    const { PATCH } = await import('@/app/api/notifications/[id]/read/route')
    const res = await PATCH(
      new Request('http://localhost/api/notifications/n1/read', { method: 'PATCH' }),
      { params: Promise.resolve({ id: 'n1' }) },
    )
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('n1')
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'n1', userId: 'admin-1' },
      data: { readAt: expect.any(Date) },
    })
  })

  it('returns 404 when the notification does not belong to the caller', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 } as any)

    const { PATCH } = await import('@/app/api/notifications/[id]/read/route')
    const res = await PATCH(
      new Request('http://localhost/api/notifications/nope/read', { method: 'PATCH' }),
      { params: Promise.resolve({ id: 'nope' }) },
    )
    expect(res.status).toBe(404)
  })
})

describe('POST /api/notifications/mark-all-read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue(adminUser as any)
  })

  it('updates only unread rows for the current admin', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 } as any)

    const { POST } = await import('@/app/api/notifications/mark-all-read/route')
    const res = await POST(new Request('http://localhost/api/notifications/mark-all-read', { method: 'POST' }))
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.data.updated).toBe(5)
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'admin-1', readAt: null },
      data: { readAt: expect.any(Date) },
    })
  })
})
