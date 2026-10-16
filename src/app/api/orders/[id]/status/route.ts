import { after } from 'next/server'
import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { updateStatusSchema } from '@/lib/validations/order'
import { sendTransactional } from '@/lib/email'
import { orderShippedTemplate, type EmailLang } from '@/lib/email-templates'

const ORDER_SHIPPED_SUBJECT: Record<EmailLang, (orderNumber: string) => string> = {
  sr: (n) => `Vaša porudžbina ${n} je poslata`,
  en: (n) => `Your order ${n} has shipped`,
  ru: (n) => `Ваш заказ ${n} отправлен`,
}

// Valid status transitions (state machine)
const VALID_TRANSITIONS: Record<string, string[]> = {
  novi: ['u_obradi', 'otkazano'],
  u_obradi: ['isporuceno', 'otkazano'],
  isporuceno: [],
  otkazano: [],
}

// PATCH /api/orders/[id]/status — admin: update order status
export const PATCH = withErrorHandler(async (req: Request, context: unknown) => {
  const user = await requireAdmin()
  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const body = await req.json()
  const { status, note } = updateStatusSchema.parse(body)

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  })
  if (!order) {
    throw new ApiError(404, 'Porudžbina nije pronađena')
  }

  // Validate state transition
  const allowedNext = VALID_TRANSITIONS[order.status] ?? []
  if (!allowedNext.includes(status)) {
    throw new ApiError(400, `Nije moguća promena statusa iz "${order.status}" u "${status}"`)
  }

  // "Uplatnicom" orders ship only once the payment is on the account.
  if (status === 'isporuceno' && order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Uplata još nije potvrđena — porudžbina plaćena uplatnicom ne može biti poslata pre potvrde uplate')
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        changedBy: user.id,
        note,
      },
    }),
  ])

  // "Isporučeno" means the parcel was handed to the courier — notify the
  // customer (best-effort; the status update must not fail on email errors).
  if (status === 'isporuceno') {
    const notifyEmail = order.user?.email ?? order.guestEmail
    if (notifyEmail) {
      const language = (order.language as EmailLang) ?? 'sr'
      after(() => sendTransactional({
        to: notifyEmail,
        subject: ORDER_SHIPPED_SUBJECT[language](order.orderNumber),
        html: orderShippedTemplate({
          orderNumber: order.orderNumber,
          shippedDate: new Date().toLocaleDateString('sr-RS', { timeZone: 'Europe/Belgrade' }),
          language,
        }),
      }).catch((err) => console.error('[email] order shipped notification failed:', err)))
    }
  }

  return successResponse({ message: 'Status ažuriran', status })
})
