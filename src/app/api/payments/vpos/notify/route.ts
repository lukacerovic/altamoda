/**
 * URLMS — Nexi/SIA VPOS server-to-server payment outcome notification.
 *
 * This is the AUTHORITATIVE channel for settling an order's payment status (the
 * browser-side URLDONE may never fire if the customer closes the tab). It is a
 * public endpoint; the MAC (verified with the API-Result key) is the trust
 * boundary. See docs/PAYMENT_VPOS.md.
 */
import { prisma } from '@/lib/db'
import { VPOS_ENABLED, getVposConfig } from '@/lib/payments/vpos-config'
import { verifyOutcome, toMinorUnits, VPOS_RESULT_SUCCESS } from '@/lib/payments/vpos'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/** SIA may send the notification as a GET (query) or POST (form-urlencoded). */
async function extractParams(req: Request): Promise<URLSearchParams> {
  const params = new URLSearchParams(new URL(req.url).search)
  if (req.method === 'POST') {
    const ct = req.headers.get('content-type') ?? ''
    try {
      if (ct.includes('application/json')) {
        const j = (await req.json()) as Record<string, unknown>
        for (const [k, v] of Object.entries(j)) params.set(k, String(v))
      } else {
        const body = await req.text()
        if (body) for (const [k, v] of new URLSearchParams(body)) params.set(k, v)
      }
    } catch {
      // Malformed body — fall back to query-string params.
    }
  }
  return params
}

function text(body: string, status: number) {
  return new Response(body, { status, headers: { 'content-type': 'text/plain' } })
}

async function handle(req: Request): Promise<Response> {
  if (!VPOS_ENABLED) return text('Not found', 404)

  let config
  try {
    config = getVposConfig()
  } catch (e) {
    console.error('[vpos] config error:', e)
    return text('Misconfigured', 500)
  }

  const params = await extractParams(req)
  const orderId = params.get('ORDERID') ?? ''

  // 1. Verify the MAC FIRST — the trust boundary. On failure, per SIA guidance,
  //    do NOT touch the order; just log and signal an error.
  const { valid, result } = verifyOutcome(params, config.apiResultKey)
  if (!valid) {
    console.error(`[vpos] OUTCOME MAC INVALID for ORDERID=${orderId} — order left unchanged`)
    return text('Wrong MAC', 500)
  }

  // 2. Locate the order.
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderId },
    include: { user: { select: { email: true } } },
  })
  if (!order) {
    console.error(`[vpos] verified notification for unknown ORDERID=${orderId}`)
    return text('OK', 200) // ack — nothing to update
  }

  // 3. Re-verify amount + currency against the stored order (never trust the wire).
  const expectedAmount = toMinorUnits(Number(order.total), Number(config.exponent))
  const gotAmount = params.get('AMOUNT') ?? ''
  const gotCurrency = params.get('CURRENCY') ?? ''
  if (gotAmount !== expectedAmount || gotCurrency !== config.currency) {
    console.error(
      `[vpos] amount/currency mismatch for ORDERID=${orderId}: got ${gotAmount}/${gotCurrency}, expected ${expectedAmount}/${config.currency}`
    )
    return text('Amount mismatch', 500)
  }

  // 4. Idempotency: settle each order at most once (handles retries + RESULT=07).
  if (order.paymentStatus === 'paid') return text('OK', 200)

  const transactionId = params.get('TRANSACTIONID') || null
  const authNumber = params.get('AUTHNUMBER') || null
  const resultCode = result ?? null
  const isSuccess = result === VPOS_RESULT_SUCCESS

  // 5. Persist outcome + audit row atomically.
  // NOTE: on failure we mark paymentStatus='failed' but leave order.status and the
  // already-decremented stock as-is; auto-restocking on failed/cancelled payments
  // is a Phase-2 follow-up (admin can cancel to restock for now).
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: isSuccess ? 'paid' : 'failed',
        vposTransactionId: transactionId,
        vposAuthNumber: authNumber,
        vposResultCode: resultCode,
        ...(isSuccess ? { paidAt: new Date() } : {}),
      },
    })
    await tx.paymentAttempt.create({
      data: {
        orderId: order.id,
        resultCode,
        transactionId,
        authNumber,
        source: 'urlms',
        rawPayload: Object.fromEntries(params),
      },
    })
  })

  // 6. Best-effort confirmation email on success — never fail the webhook on email.
  if (isSuccess && order.user.email) {
    try {
      await sendEmail({
        to: order.user.email,
        subject: `Potvrda plaćanja — porudžbina ${order.orderNumber}`,
        html: `<p>Poštovani,</p><p>Vaše plaćanje za porudžbinu <strong>${order.orderNumber}</strong> je uspešno primljeno.</p><p>Hvala na kupovini!</p>`,
      })
    } catch (e) {
      console.error(`[vpos] confirmation email failed for ${order.orderNumber}:`, e)
    }
  }

  return text('OK', 200)
}

export async function POST(req: Request) {
  return handle(req)
}

export async function GET(req: Request) {
  return handle(req)
}
