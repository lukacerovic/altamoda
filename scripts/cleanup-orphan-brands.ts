/**
 * One-shot sweep that deletes brands with no products. Their product lines
 * are removed first since the schema doesn't cascade. Use after a bulk
 * delete or to clean legacy orphan brands like the "Patka" rows.
 *
 * Usage (dry run by default):
 *   node --env-file=.env --import tsx scripts/cleanup-orphan-brands.ts
 *
 * Apply:
 *   node --env-file=.env --import tsx scripts/cleanup-orphan-brands.ts --apply
 *
 * Production:
 *   NODE_ENV=production DATABASE_URL=... node --import tsx \
 *     scripts/cleanup-orphan-brands.ts --apply
 */

import { prisma } from '../src/lib/db'
import { sweepOrphanBrands } from '../src/lib/taxonomy'

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(apply ? '== APPLY mode ==\n' : '== DRY RUN (use --apply to commit) ==\n')

  if (!apply) {
    const orphans = await prisma.brand.findMany({
      where: { products: { none: {} } },
      select: {
        id: true, name: true, slug: true,
        _count: { select: { productLines: true } },
      },
      orderBy: { name: 'asc' },
    })
    console.log(`Currently orphan brands: ${orphans.length}`)
    for (const o of orphans) {
      const lines = o._count.productLines
      console.log(`  ${o.name.padEnd(28)} (slug=${o.slug}${lines > 0 ? `, ${lines} empty product line(s) will also be removed` : ''})`)
    }
    if (orphans.length > 0) {
      console.log('\n** DRY RUN — no DB writes. Re-run with --apply to commit. **')
    }
    await prisma.$disconnect()
    return
  }

  const { deleted } = await sweepOrphanBrands()
  console.log(`Deleted ${deleted.length} orphan brands:`)
  for (const d of deleted) console.log(`  ${d}`)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
