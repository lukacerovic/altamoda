/**
 * One-time cleanup (already run 2026-08-08): remove products erroneously
 * created by testing the "Proizvodi" (products) inbound sync — that sync
 * creates a new Product for every Pantheon code without a matching erpId,
 * which flooded the curated AMS catalog with raw, abbreviated Pantheon
 * names ("RK CG 7RO MARIGOLD") and no brand/category. See
 * docs referenced from src/lib/pantheon/sync-inbound.ts — the AMS Excel
 * import is this catalog's sole source of truth for products; Pantheon
 * "Proizvodi" sync is deliberately not wired into any button or cron.
 *
 * Identifying filter: every erroneously-created row has brandId = null,
 * confirmed to not overlap with the curated catalog (which all have
 * brandId set) before this script was run. Kept as an audit trail / in
 * case the same class of mistake ever recurs (e.g. someone calls
 * syncProducts() directly via the API).
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

async function main() {
  const targets = await prisma.product.findMany({ where: { brandId: null }, select: { id: true } })
  const ids = targets.map((p) => p.id)
  console.log(`Found ${ids.length} products with no brand (erroneously created by Pantheon products sync).`)
  if (ids.length === 0) return

  const cart = await prisma.cartItem.deleteMany({ where: { productId: { in: ids } } })
  const wish = await prisma.wishlist.deleteMany({ where: { productId: { in: ids } } })
  const deleted = await prisma.product.deleteMany({ where: { id: { in: ids } } })

  console.log(`Deleted: ${deleted.count} products, ${cart.count} cart items, ${wish.count} wishlist entries.`)
  const remaining = await prisma.product.count()
  console.log(`Products remaining: ${remaining}`)
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
