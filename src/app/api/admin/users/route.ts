import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, getPaginationParams } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/admin/users — List all users with filters (admin only)
export const GET = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = getPaginationParams(searchParams)

  const search = searchParams.get('search')?.trim()
  const role = searchParams.get('role') // b2b, b2c, or null for all
  const status = searchParams.get('status') // active, pending, suspended, or null for all

  // Build where clause
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { b2bProfile: { salonName: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (role && role !== 'all') {
    where.role = role
  }

  if (status && status !== 'all') {
    where.status = status
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        b2bProfile: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  // Get total spent per user
  const userIds = users.map(u => u.id)
  const orderTotals = await prisma.order.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _sum: { total: true },
  })
  const spentMap = new Map(orderTotals.map(o => [o.userId, Number(o._sum.total) || 0]))

  const formatted = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    ordersCount: u._count.orders,
    totalSpent: spentMap.get(u.id) || 0,
    b2bProfile: u.b2bProfile ? {
      salonName: u.b2bProfile.salonName,
      pib: u.b2bProfile.pib,
      maticniBroj: u.b2bProfile.maticniBroj,
      address: u.b2bProfile.address,
      discountTier: u.b2bProfile.discountTier,
      creditLimit: u.b2bProfile.creditLimit ? Number(u.b2bProfile.creditLimit) : null,
      paymentTerms: u.b2bProfile.paymentTerms,
      erpSubjectId: u.b2bProfile.erpSubjectId,
      approvedAt: u.b2bProfile.approvedAt,
    } : null,
  }))

  return successResponse({
    users: formatted,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})
