import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Setup ───

vi.mock('@/lib/db', () => ({
  prisma: {
    cart: { findFirst: vi.fn(), create: vi.fn() },
    cartItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    wishlist: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    orderItem: { findFirst: vi.fn() },
    orderStatusHistory: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}))

import { prisma } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth-helpers'

const mockPrisma = vi.mocked(prisma)
const mockRequireAuth = vi.mocked(requireAuth)
const mockRequireAdmin = vi.mocked(requireAdmin)

const mockUser = { id: 'user-1', email: 'test@test.com', name: 'Test', role: 'b2c' }
const mockAdminUser = { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'admin' }

// ─── Cart API ───

describe('Cart API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser as any)
  })

  describe('POST /api/cart (add item)', () => {
    it('rejects unauthenticated users', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))
      const { POST } = await import('@/app/api/cart/route')
      const req = new Request('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1', quantity: 1 }),
      })
      const res = await POST(req)
      expect(res.status).not.toBe(201)
    })

    it('rejects non-existent product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null)
      const { POST } = await import('@/app/api/cart/route')
      const req = new Request('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'non-existent', quantity: 1 }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(404)
      expect(data.success).toBe(false)
    })

    it('rejects invalid quantity (0)', async () => {
      const { POST } = await import('@/app/api/cart/route')
      const req = new Request('http://localhost/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1', quantity: 0 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})

// ─── Wishlist API ───

describe('Wishlist API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser as any)
  })

  describe('POST /api/wishlist (toggle)', () => {
    it('adds product to wishlist when not present', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1', isActive: true } as any)
      mockPrisma.wishlist.findUnique.mockResolvedValue(null)
      mockPrisma.wishlist.create.mockResolvedValue({ id: 'wl-1', userId: 'user-1', productId: 'prod-1' } as any)

      const { POST } = await import('@/app/api/wishlist/route')
      const req = new Request('http://localhost/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1' }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.added).toBe(true)
    })

    it('removes product from wishlist when already present', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1', isActive: true } as any)
      mockPrisma.wishlist.findUnique.mockResolvedValue({ id: 'wl-1', userId: 'user-1', productId: 'prod-1' } as any)
      mockPrisma.wishlist.delete.mockResolvedValue({} as any)

      const { POST } = await import('@/app/api/wishlist/route')
      const req = new Request('http://localhost/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1' }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.added).toBe(false)
    })

    it('rejects non-existent product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null)

      const { POST } = await import('@/app/api/wishlist/route')
      const req = new Request('http://localhost/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId: 'non-existent' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/wishlist', () => {
    it('rejects missing productId parameter', async () => {
      const { DELETE } = await import('@/app/api/wishlist/route')
      const req = new Request('http://localhost/api/wishlist', { method: 'DELETE' })
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('returns 404 when item not in wishlist', async () => {
      mockPrisma.wishlist.findUnique.mockResolvedValue(null)
      const { DELETE } = await import('@/app/api/wishlist/route')
      const req = new Request('http://localhost/api/wishlist?productId=prod-1', { method: 'DELETE' })
      const res = await DELETE(req)
      expect(res.status).toBe(404)
    })
  })
})

// ─── Reviews API ───

describe('Reviews API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser as any)
  })

  describe('GET /api/reviews', () => {
    it('rejects missing productId', async () => {
      const { GET } = await import('@/app/api/reviews/route')
      const req = new Request('http://localhost/api/reviews')
      const res = await GET(req)
      expect(res.status).toBe(400)
    })

    it('returns reviews with DB-calculated average rating', async () => {
      mockPrisma.review.findMany.mockResolvedValue([
        { id: 'r1', rating: 5, createdAt: new Date(), user: { name: 'Test' } },
        { id: 'r2', rating: 3, createdAt: new Date(), user: { name: 'User2' } },
      ] as any)
      mockPrisma.review.count.mockResolvedValue(2)
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } } as any)

      const { GET } = await import('@/app/api/reviews/route')
      const req = new Request('http://localhost/api/reviews?productId=prod-1')
      const res = await GET(req)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.avgRating).toBe(4.0)
      expect(data.data.count).toBe(2)
      expect(data.data.reviews).toHaveLength(2)
    })
  })

  describe('POST /api/reviews', () => {
    it('rejects duplicate review (409)', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1' } as any)
      // Verified-purchase gate — return a matching order item so we get past
      // the gate and reach the duplicate-review check.
      mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 'oi-1' } as any)
      mockPrisma.review.findUnique.mockResolvedValue({ id: 'existing-review' } as any)

      const { POST } = await import('@/app/api/reviews/route')
      const req = new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1', rating: 4 }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(409)
      expect(data.success).toBe(false)
    })

    it('creates review for new user/product combination', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1', isActive: true } as any)
      mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 'oi-1' } as any)
      mockPrisma.review.findUnique.mockResolvedValue(null)
      mockPrisma.review.create.mockResolvedValue({ id: 'r-new', rating: 5 } as any)

      const { POST } = await import('@/app/api/reviews/route')
      const req = new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1', rating: 5 }),
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(201)
      expect(data.data.rating).toBe(5)
    })

    it('rejects review from user who never purchased the product (403)', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1', isActive: true } as any)
      mockPrisma.orderItem.findFirst.mockResolvedValue(null)

      const { POST } = await import('@/app/api/reviews/route')
      const req = new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1', rating: 5 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it('rejects invalid rating (0)', async () => {
      const { POST } = await import('@/app/api/reviews/route')
      const req = new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1', rating: 0 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('rejects invalid rating (6)', async () => {
      const { POST } = await import('@/app/api/reviews/route')
      const req = new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'prod-1', rating: 6 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('rejects review for non-existent product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null)

      const { POST } = await import('@/app/api/reviews/route')
      const req = new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId: 'non-existent', rating: 4 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(404)
    })
  })
})

// ─── Order Status API ───

describe('Order Status API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue(mockAdminUser as any)
  })

  describe('PATCH /api/orders/[id]/status — state machine', () => {
    it('allows novi → u_obradi', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'ord-1', status: 'novi' } as any)
      mockPrisma.$transaction.mockResolvedValue([{}, {}] as any)

      const { PATCH } = await import('@/app/api/orders/[id]/status/route')
      const req = new Request('http://localhost/api/orders/ord-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'u_obradi' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'ord-1' }) })
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('u_obradi')
    })

    it('allows novi → otkazano', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'ord-1', status: 'novi' } as any)
      mockPrisma.$transaction.mockResolvedValue([{}, {}] as any)

      const { PATCH } = await import('@/app/api/orders/[id]/status/route')
      const req = new Request('http://localhost/api/orders/ord-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'otkazano' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'ord-1' }) })
      expect(res.status).toBe(200)
    })

    it('rejects novi → isporuceno (invalid transition)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'ord-1', status: 'novi' } as any)

      const { PATCH } = await import('@/app/api/orders/[id]/status/route')
      const req = new Request('http://localhost/api/orders/ord-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'isporuceno' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'ord-1' }) })
      expect(res.status).toBe(400)
    })

    it('rejects isporuceno → any (terminal state)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'ord-1', status: 'isporuceno' } as any)

      const { PATCH } = await import('@/app/api/orders/[id]/status/route')
      const req = new Request('http://localhost/api/orders/ord-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'novi' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'ord-1' }) })
      expect(res.status).toBe(400)
    })

    it('rejects otkazano → any (terminal state)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'ord-1', status: 'otkazano' } as any)

      const { PATCH } = await import('@/app/api/orders/[id]/status/route')
      const req = new Request('http://localhost/api/orders/ord-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'u_obradi' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'ord-1' }) })
      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null)

      const { PATCH } = await import('@/app/api/orders/[id]/status/route')
      const req = new Request('http://localhost/api/orders/x/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'u_obradi' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'x' }) })
      expect(res.status).toBe(404)
    })
  })
})

// Quick Order API was removed — related tests removed.
