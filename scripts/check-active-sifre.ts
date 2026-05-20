/**
 * One-off: cross-reference "Stanje aktivnih sifara.xlsx" (1,064 active Pantheon SKUs)
 * against our DB to determine:
 *   - How many of these idents are already linked (erpId set) in our DB?
 *   - How many exist in our DB by SKU/barcode but are NOT linked (erpId still null)?
 *   - How many don't exist on the website at all?
 *   - Of the linked ones, how many are currently isActive=false on the website?
 */
import { prisma } from '../src/lib/db'
import fs from 'node:fs'

type XlsxItem = { ident: string; barcode: string; name: string; stock: number; price: number }

async function main() {
  const items: XlsxItem[] = JSON.parse(fs.readFileSync('/tmp/pantheon-active-sifre.json', 'utf-8'))
  console.log(`Loaded ${items.length} active Pantheon idents from xlsx\n`)

  const idents = items.map((i) => i.ident)
  const barcodes = items.map((i) => i.barcode).filter((b) => b && b.length > 0)

  // 1. Already linked by erpId
  const linkedByErpId = await prisma.product.findMany({
    where: { erpId: { in: idents } },
    select: { id: true, sku: true, nameLat: true, erpId: true, isActive: true, barcode: true },
  })
  const linkedErpIds = new Set(linkedByErpId.map((p) => p.erpId!))

  // 2. Not-yet-linked but findable by SKU == ident
  const unlinkedIdents = idents.filter((i) => !linkedErpIds.has(i))
  const foundBySku = await prisma.product.findMany({
    where: { erpId: null, sku: { in: unlinkedIdents } },
    select: { id: true, sku: true, nameLat: true, erpId: true, isActive: true, barcode: true },
  })

  // 3. Not-yet-linked but findable by barcode
  const foundByBarcode = await prisma.product.findMany({
    where: { erpId: null, barcode: { in: barcodes } },
    select: { id: true, sku: true, nameLat: true, erpId: true, isActive: true, barcode: true },
  })

  // 4. Truly missing (not linked, not findable by sku or barcode)
  const foundSkus = new Set(foundBySku.map((p) => p.sku))
  const foundBarcodes = new Set(foundByBarcode.map((p) => p.barcode).filter(Boolean) as string[])

  const trulyMissing = items.filter(
    (it) =>
      !linkedErpIds.has(it.ident) &&
      !foundSkus.has(it.ident) &&
      !(it.barcode && foundBarcodes.has(it.barcode)),
  )

  // 5. Linked but isActive=false on website
  const linkedInactive = linkedByErpId.filter((p) => !p.isActive)

  console.log('=== Summary ===')
  console.log(`Active Pantheon idents in xlsx       : ${items.length}`)
  console.log(`  → already linked via erpId         : ${linkedByErpId.length}`)
  console.log(`    of which isActive=false on site  : ${linkedInactive.length}`)
  console.log(`  → unlinked, findable by SKU        : ${foundBySku.length}`)
  console.log(`  → unlinked, findable by barcode    : ${foundByBarcode.length}`)
  console.log(`  → not present on website at all    : ${trulyMissing.length}`)
  console.log()

  if (foundBySku.length > 0) {
    console.log(`=== Sample: in DB by SKU but no erpId (max 10) ===`)
    foundBySku.slice(0, 10).forEach((p) => console.log(`  ${p.sku}  isActive=${p.isActive}  ${p.nameLat}`))
    console.log()
  }
  if (foundByBarcode.length > 0) {
    console.log(`=== Sample: in DB by barcode but no erpId (max 10) ===`)
    foundByBarcode.slice(0, 10).forEach((p) => console.log(`  sku=${p.sku} barcode=${p.barcode}  ${p.nameLat}`))
    console.log()
  }
  if (trulyMissing.length > 0) {
    console.log(`=== Sample: missing from website entirely (max 10) ===`)
    trulyMissing.slice(0, 10).forEach((it) => console.log(`  ident=${it.ident}  barcode=${it.barcode}  stock=${it.stock}  ${it.name}`))
    console.log()
  }
  if (linkedInactive.length > 0) {
    console.log(`=== Sample: linked but hidden on site (isActive=false) (max 10) ===`)
    linkedInactive.slice(0, 10).forEach((p) => console.log(`  sku=${p.sku} erpId=${p.erpId}  ${p.nameLat}`))
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
