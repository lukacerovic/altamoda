import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import { VPOS_ENABLED } from '@/lib/payments/vpos-config'
import { BANK_TRANSFER_PAYEE, formatSlipAmount } from '@/lib/payments/bank-transfer'
import ConfirmationClient, { type ConfirmationState, type BankTransferInfo } from './ConfirmationClient'

export const dynamic = 'force-dynamic'

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>
}) {
  const { orderNumber = '' } = await searchParams

  // Default to the generic "order received" view (covers non-card orders and any
  // case where we can't resolve the order — without leaking other users' orders).
  let state: ConfirmationState = 'success'
  let bankTransfer: BankTransferInfo | null = null

  if (orderNumber) {
    const user = await getCurrentUser()
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { userId: true, paymentMethod: true, paymentStatus: true, total: true },
    })
    // Resolve payment state for the owning user, or for guest orders (userId null,
    // reachable only via the unguessable order number).
    const canView = order && (order.userId === null || (user && order.userId === user.id))
    if (order && canView && VPOS_ENABLED && order.paymentMethod === 'card') {
      state =
        order.paymentStatus === 'paid'
          ? 'success'
          : order.paymentStatus === 'failed'
            ? 'failed'
            : 'pending'
    }
    if (order && canView && order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending') {
      const P = BANK_TRANSFER_PAYEE
      bankTransfer = {
        payee: `${P.name}, ${P.street}, ${P.city}`,
        account: `${P.account} (${P.bank})`,
        amount: `${formatSlipAmount(Number(order.total))} RSD`,
      }
    }
  }

  return (
    <ConfirmationClient
      orderNumber={orderNumber}
      state={state}
      bankTransfer={bankTransfer}
      payUrl={`/checkout/pay/${orderNumber}`}
    />
  )
}
