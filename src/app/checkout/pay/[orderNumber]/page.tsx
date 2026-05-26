import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import { VPOS_ENABLED, getVposConfig } from '@/lib/payments/vpos-config'
import { buildPaymentRequest } from '@/lib/payments/vpos'
import AutoSubmitForm from './AutoSubmitForm'

export const dynamic = 'force-dynamic'

function baseUrl(): string {
  const url = process.env.SITE_URL || process.env.AUTH_URL
  if (!url) throw new Error('SITE_URL is not configured')
  return url.replace(/\/$/, '')
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params

  const user = await getCurrentUser()
  if (!user) {
    redirect(`/account/login?callbackUrl=/checkout/pay/${orderNumber}`)
  }

  // Online card payment off → the order is already placed; show confirmation.
  if (!VPOS_ENABLED) {
    redirect(`/checkout/confirmation?orderNumber=${orderNumber}`)
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { user: { select: { email: true } } },
  })

  // Don't leak existence of other users' orders.
  if (!order || order.userId !== user.id) notFound()

  // Nothing to pay for non-card orders or already-settled ones.
  if (order.paymentMethod !== 'card' || order.paymentStatus === 'paid') {
    redirect(`/checkout/confirmation?orderNumber=${orderNumber}`)
  }

  const config = getVposConfig()
  const { actionUrl, fields } = buildPaymentRequest(
    {
      orderNumber: order.orderNumber,
      total: Number(order.total),
      urls: {
        urlMs: `${baseUrl()}/api/payments/vpos/notify`,
        urlDone: `${baseUrl()}/checkout/confirmation?orderNumber=${order.orderNumber}`,
        urlBack: `${baseUrl()}/checkout/cancelled?orderNumber=${order.orderNumber}`,
      },
      email: order.user.email ?? undefined,
      shopEmail: process.env.ADMIN_EMAIL,
    },
    config
  )

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-white rounded-sm shadow-sm p-8">
          <div className="w-12 h-12 border-4 border-[#c19742] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
            Preusmeravamo vas na sigurno plaćanje…
          </h1>
          <p className="text-sm text-[#1a1c1e] mb-6">
            Bićete prebačeni na zaštićenu stranicu banke za unos podataka o kartici.
            Ako se to ne dogodi automatski, kliknite na dugme ispod.
          </p>
          <AutoSubmitForm action={actionUrl} fields={fields} />
        </div>
      </div>
    </div>
  )
}
