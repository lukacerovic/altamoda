import { NextResponse } from 'next/server'

import { syncPrices, syncStock } from '@/lib/pantheon/sync-inbound'
import { processQueue } from '@/lib/pantheon/sync-outbound'

/**
 * Cron-triggered Pantheon sync.
 *
 *   GET /api/cron/erp-sync?type=stock|prices|orders
 *   Authorization: Bearer <ERP_CRON_SECRET>
 *     (or  ?secret=<ERP_CRON_SECRET>  for schedulers that can't set headers)
 *
 * Suggested schedule (configure externally — Vercel Cron, cron-job.org, etc.):
 *   - stock     : every 15 min
 *   - prices    : every 1 hour
 *   - orders    : every 5 min (drains the outbound queue)
 *
 * No `products` type here on purpose — bulk-creating every unlinked Pantheon
 * product once flooded the catalog with ~1,950 junk rows (raw abbreviated
 * names, no brand/category). The curated alternative is the "review before
 * import" modal on /admin/erp (POST /api/admin/erp/pantheon-import), where an
 * admin hand-picks exactly which Pantheon products to bring in. Don't add a
 * `products` case back here — see the warning comment on `syncProducts()` in
 * src/lib/pantheon/sync-inbound.ts.
 */
export async function GET(req: Request) {
  // Accept either our own secret (cPanel/external cron — passed as ?secret= or
  // a manually-set Bearer header) or Vercel's own `CRON_SECRET` convention
  // (Vercel Cron auto-attaches `Authorization: Bearer $CRON_SECRET` to every
  // cron-triggered request when a project env var of that exact name exists —
  // so a Vercel deployment needs no secret embedded in vercel.json at all).
  const secrets = [process.env.ERP_CRON_SECRET, process.env.CRON_SECRET].filter(Boolean) as string[]
  if (secrets.length === 0) {
    return NextResponse.json(
      { success: false, error: 'ERP_CRON_SECRET (or CRON_SECRET) not configured' },
      { status: 500 },
    )
  }

  const url = new URL(req.url)
  const auth = req.headers.get('authorization') ?? ''
  const presented =
    auth.toLowerCase().startsWith('bearer ')
      ? auth.slice(7).trim()
      : (url.searchParams.get('secret') ?? '')

  if (!secrets.includes(presented)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const type = url.searchParams.get('type')

  try {
    switch (type) {
      case 'prices': {
        const r = await syncPrices()
        return NextResponse.json({ success: true, type, ...r })
      }
      case 'stock': {
        const r = await syncStock()
        return NextResponse.json({ success: true, type, ...r })
      }
      case 'orders': {
        const r = await processQueue()
        return NextResponse.json({ success: true, type, ...r })
      }
      default:
        return NextResponse.json(
          { success: false, error: 'Missing or invalid ?type= (prices|stock|orders)' },
          { status: 400 },
        )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
