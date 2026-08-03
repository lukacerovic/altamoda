/**
 * One-time cleanup: remove EAN codes embedded in product names, e.g.
 * "Šampon XYZ (8606012345678)" → name "Šampon XYZ", barcode "8606012345678".
 *
 * The extracted code fills the `barcode` column when it's empty; an existing
 * barcode is never overwritten. Slugs are left untouched (stable URLs).
 *
 * Usage:
 *   npx tsx scripts/strip-ean-from-names.ts --dry-run   # report only
 *   npx tsx scripts/strip-ean-from-names.ts             # apply
 */
import 'dotenv/config'
import { prisma } from '../src/lib/db'
import { extractEanFromName } from '../src/lib/ams-import'

const dryRun = process.argv.includes('--dry-run')

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, nameLat: true, nameCyr: true, barcode: true },
  })

  let changed = 0
  for (const p of products) {
    const lat = extractEanFromName(p.nameLat, p.sku)
    const cyr = p.nameCyr ? extractEanFromName(p.nameCyr, p.sku) : null
    const ean = lat.ean ?? cyr?.ean ?? null

    const latChanged = lat.name !== p.nameLat
    const cyrChanged = cyr !== null && cyr.name !== p.nameCyr
    if (!latChanged && !cyrChanged) continue

    changed++
    console.log(
      `${dryRun ? '[dry] ' : ''}${p.sku}: "${p.nameLat}" -> "${lat.name}"` +
        (ean && !p.barcode ? ` (barcode: ${ean})` : '')
    )

    if (!dryRun) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          ...(latChanged ? { nameLat: lat.name } : {}),
          ...(cyrChanged && cyr ? { nameCyr: cyr.name } : {}),
          ...(ean && !p.barcode ? { barcode: ean } : {}),
        },
      })
    }
  }

  console.log(`\n${changed} product name(s) ${dryRun ? 'would be' : ''} cleaned of EAN codes.`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
