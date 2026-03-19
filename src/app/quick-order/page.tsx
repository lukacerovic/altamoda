import { getCurrentUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import QuickOrderPageClient from './QuickOrderPageClient'

export default async function QuickOrderPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== 'b2b' && user.role !== 'admin')) {
    redirect('/login?callbackUrl=/quick-order')
  }

  // Fetch recent orders for repeat functionality
  const recentOrders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const orders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    date: o.createdAt.toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric' }),
    items: o.items.length,
    total: Number(o.total),
  }))

  return <QuickOrderPageClient recentOrders={orders} />
}
