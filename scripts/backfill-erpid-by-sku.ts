/**
 * One-time backfill: Product.erpId = Product.sku wherever Pantheon has that
 * exact code in its live catalog (action=products).
 *
 * Verified 2026-08-08 (local DB, post-AMS-import): 994/998 (99.6%) of SKUs
 * already equal a Pantheon `acIdent` code — the client's own AMS "IDENT"
 * column already IS the Pantheon code, so no EAN/barcode matching is
 * needed. This just confirms the match against the live API and writes it.
 * Safe to re-run: only touches products with `erpId: null`, matched ones
 * already erpId-set are left alone.
 *
 * Usage:
 *   DATABASE_URL="..." node --env-file=.env --import tsx scripts/backfill-erpid-by-sku.ts            # dry run
 *   DATABASE_URL="..." node --env-file=.env --import tsx scripts/backfill-erpid-by-sku.ts --apply    # write
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { getPantheonClient, normalizeProduct } from '../src/lib/pantheon/client'
import type { NormalizedPantheonProduct } from '../src/lib/pantheon/types'

dotenv.config({ path: '.env.local' })
dotenv.config()

const APPLY = process.argv.includes('--apply')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

async function main() {
  const raw = await getPantheonClient().fetchProducts()
  const normalized = raw
    .map(normalizeProduct)
    .filter((p): p is NormalizedPantheonProduct => p !== null)
  const pantheonCodes = new Set(normalized.map((p) => p.code))

  const products = await prisma.product.findMany({
    where: { erpId: null },
    select: { id: true, sku: true, nameLat: true },
  })

  const matched = products.filter((p) => pantheonCodes.has(p.sku))
  const unmatched = products.filter((p) => !pantheonCodes.has(p.sku))

  console.log(`Pantheon live catalog: ${normalized.length} codes`)
  console.log(`Our products without erpId: ${products.length}`)
  console.log(`Matched by sku === Pantheon code: ${matched.length}`)
  console.log(`Unmatched (left for manual review): ${unmatched.length}`)
  if (unmatched.length) {
    console.log(unmatched.map((p) => `  ${p.sku}  ${p.nameLat}`).join('\n'))
  }

  if (!APPLY) {
    console.log('\nDRY RUN — no writes. Re-run with --apply to write.')
    return
  }

  console.log('\nApplying...')
  let done = 0
  for (const p of matched) {
    await prisma.product.update({ where: { id: p.id }, data: { erpId: p.sku } })
    done++
    if (done % 200 === 0) console.log(`  ${done}/${matched.length}`)
  }
  console.log(`\nDone! Linked ${done} products.`)
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
