/**
 * R.5 — duplicate-order test helper.
 *
 * Builds a standalone, auto-submitting HTML form that re-initiates a payment
 * reusing an ALREADY-USED ORDERID (e.g. R.1's). SIA must reject it with
 * RESULT=07 (duplicated order). This does NOT touch our DB row — it's a raw
 * signed POST straight to the gateway, exactly like our pay page would build.
 *
 *   npx tsx scripts/vpos-build-duplicate-form.ts <ORDERID> <TUNNEL_URL> <OUT_HTML>
 */
import 'dotenv/config'
import { writeFileSync } from 'fs'
import { prisma } from '../src/lib/db'
import { getVposConfig } from '../src/lib/payments/vpos-config'
import { buildPaymentRequest } from '../src/lib/payments/vpos'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function main() {
  const orderNumber = process.argv[2]
  const base = (process.argv[3] || '').replace(/\/$/, '')
  const out = process.argv[4] || '/tmp/vpos_r5_duplicate.html'
  if (!orderNumber || !base) {
    console.error('Usage: npx tsx scripts/vpos-build-duplicate-form.ts <ORDERID> <TUNNEL_URL> <OUT_HTML>')
    process.exit(1)
  }

  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { total: true } })
  if (!order) throw new Error(`Order ${orderNumber} not found`)

  const config = getVposConfig()
  const { actionUrl, fields } = buildPaymentRequest(
    {
      orderNumber, // intentionally reuse the existing (already-paid) ORDERID
      total: Number(order.total),
      urls: {
        urlMs: `${base}/api/payments/vpos/notify`,
        urlDone: `${base}/checkout/confirmation?orderNumber=${orderNumber}`,
        urlBack: `${base}/checkout/cancelled?orderNumber=${orderNumber}`,
      },
    },
    config
  )

  const inputs = Object.entries(fields)
    .map(([k, v]) => `    <input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join('\n')

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>R.5 duplicate test</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
  <h2>R.5 — duplicate order test</h2>
  <p>Reusing ORDERID <b>${esc(orderNumber)}</b>. Submitting to the bank…<br>
     Expected: <b>declined as a duplicate (code 07)</b>.</p>
  <form id="f" method="POST" action="${esc(actionUrl)}">
${inputs}
    <button type="submit">Continue to bank</button>
  </form>
  <script>document.getElementById('f').submit()</script>
</body></html>`

  writeFileSync(out, html)
  console.log(`wrote ${out}\nORDERID=${orderNumber} total=${String(order.total)} action=${actionUrl}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
