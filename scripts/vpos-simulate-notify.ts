/**
 * Simulate a Nexi/SIA VPOS URLMS notification against the LOCAL webhook.
 *
 * Because the merchant and the gateway share the API-Result key, and we hold it
 * in .env, we can forge a perfectly-signed outcome message and POST it to our own
 * /api/payments/vpos/notify — exercising the full settlement path (MAC verify →
 * amount/currency re-check → order update → audit row → email) WITHOUT the bank.
 *
 * Prerequisites:
 *   - DB migration applied:  npx prisma migrate dev --name vpos_payment_fields
 *   - .env has VPOS_ENABLED=true and VPOS_* set (dummy values are fine locally;
 *     the script and the server just need to share the same VPOS_API_RESULT_KEY).
 *   - Dev server running:    npm run dev
 *   - An existing card order whose orderNumber you pass in.
 *
 * Usage:
 *   npx tsx scripts/vpos-simulate-notify.ts <ORDER_NUMBER> [RESULT]
 *     RESULT defaults to "00" (success). Try "05" to simulate a decline.
 *   VPOS_SIM_URL overrides the target (default http://localhost:3000/...).
 */
import 'dotenv/config'
import { prisma } from '../src/lib/db'
import { getVposConfig } from '../src/lib/payments/vpos-config'
import { computeOutcomeMac, toMinorUnits, VPOS_RESULT_SUCCESS } from '../src/lib/payments/vpos'

async function main() {
  const orderNumber = process.argv[2]
  const result = process.argv[3] ?? VPOS_RESULT_SUCCESS
  if (!orderNumber) {
    console.error('Usage: npx tsx scripts/vpos-simulate-notify.ts <ORDER_NUMBER> [RESULT]')
    process.exit(1)
  }

  const target = process.env.VPOS_SIM_URL ?? 'http://localhost:3000/api/payments/vpos/notify'
  const config = getVposConfig()

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { total: true, paymentStatus: true, paymentMethod: true },
  })
  if (!order) {
    console.error(`Order ${orderNumber} not found.`)
    process.exit(1)
  }
  console.log(`Order ${orderNumber}: method=${order.paymentMethod}, status BEFORE=${order.paymentStatus}, total=${order.total}`)

  const isSuccess = result === VPOS_RESULT_SUCCESS
  const params = new URLSearchParams({
    ORDERID: orderNumber,
    SHOPID: config.shopId,
    AUTHNUMBER: isSuccess ? 'TEST01' : 'NULL',
    AMOUNT: toMinorUnits(Number(order.total), Number(config.exponent)),
    CURRENCY: config.currency,
    TRANSACTIONID: 'SIMTRANSACTIONID0000000001',
    ACCOUNTINGMODE: 'I',
    AUTHORMODE: 'I',
    RESULT: result,
    TRANSACTIONTYPE: 'TT06',
  })
  // Sign exactly as SIA would, with the shared API-Result key.
  params.set('MAC', computeOutcomeMac(params, config.apiResultKey))

  console.log(`\nPOST ${target}\n  ${params.toString()}\n`)
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  console.log(`Response: ${res.status} ${await res.text()}`)

  const after = await prisma.order.findUnique({
    where: { orderNumber },
    select: { paymentStatus: true, vposResultCode: true, vposTransactionId: true, paidAt: true },
  })
  console.log('\nOrder AFTER:', after)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
