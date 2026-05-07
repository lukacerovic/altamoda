/**
 * One-shot sweep that deletes categories with no products and no children
 * (cascading up to parents). Use after a bulk delete or to clean legacy
 * orphans.
 *
 * Usage (dry run by default):
 *   node --env-file=.env --import tsx scripts/cleanup-orphan-categories.ts
 *
 * Apply:
 *   node --env-file=.env --import tsx scripts/cleanup-orphan-categories.ts --apply
 *
 * Production:
 *   NODE_ENV=production DATABASE_URL=... node --import tsx \
 *     scripts/cleanup-orphan-categories.ts --apply
 */

import { prisma } from '../src/lib/db'
import { sweepOrphanCategories } from '../src/lib/taxonomy'

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(apply ? '== APPLY mode ==\n' : '== DRY RUN (use --apply to commit) ==\n')

  if (!apply) {
    const orphans = await prisma.category.findMany({
      where: { products: { none: {} }, children: { none: {} } },
      select: { id: true, nameLat: true, slug: true, parentId: true },
      orderBy: { nameLat: 'asc' },
    })
    console.log(`Currently orphan categories (leaves): ${orphans.length}`)
    for (const o of orphans) {
      console.log(`  ${o.nameLat.padEnd(30)} (slug=${o.slug}${o.parentId ? `, parent=${o.parentId}` : ''})`)
    }
    if (orphans.length > 0) {
      console.log('\nNote: removing the leaves above may make additional parents orphan in the same sweep.')
      console.log('** DRY RUN — no DB writes. Re-run with --apply to commit. **')
    }
    await prisma.$disconnect()
    return
  }

  const { deleted } = await sweepOrphanCategories()
  console.log(`Deleted ${deleted.length} orphan categories (cascade-included parents):`)
  for (const d of deleted) console.log(`  ${d}`)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
