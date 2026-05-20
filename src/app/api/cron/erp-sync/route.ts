import { NextResponse } from 'next/server'

import { syncProducts, syncPrices, syncStock } from '@/lib/pantheon/sync-inbound'
import { processQueue } from '@/lib/pantheon/sync-outbound'

/**
 * Cron-triggered Pantheon sync.
 *
 *   GET /api/cron/erp-sync?type=stock|prices|products|orders
 *   Authorization: Bearer <ERP_CRON_SECRET>
 *     (or  ?secret=<ERP_CRON_SECRET>  for schedulers that can't set headers)
 *
 * Suggested schedule (configure externally — Vercel Cron, cron-job.org, etc.):
 *   - stock     : every 15 min
 *   - prices    : every 1 hour
 *   - products  : every 6 hours
 *   - orders    : every 5 min (drains the outbound queue)
 */
export async function GET(req: Request) {
  const secret = process.env.ERP_CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'ERP_CRON_SECRET not configured' },
      { status: 500 },
    )
  }

  const url = new URL(req.url)
  const auth = req.headers.get('authorization') ?? ''
  const presented =
    auth.toLowerCase().startsWith('bearer ')
      ? auth.slice(7).trim()
      : (url.searchParams.get('secret') ?? '')

  if (presented !== secret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const type = url.searchParams.get('type')

  try {
    switch (type) {
      case 'products': {
        const r = await syncProducts()
        return NextResponse.json({ success: true, type, ...r })
      }
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
          { success: false, error: 'Missing or invalid ?type= (products|prices|stock|orders)' },
          { status: 400 },
        )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
