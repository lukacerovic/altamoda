/**
 * End-to-end Pantheon pipeline test using ONE product.
 *
 * 1. Picks a candidate product from our DB (first product with no erpId)
 * 2. Picks a real Pantheon code that has stock > 0 (so we'll see a change)
 * 3. Links them: sets Product.erpId
 * 4. Records the before-state
 * 5. Runs syncStock()
 * 6. Reads the after-state and reports
 *
 * Pass --apply to actually make the change; default is dry-run.
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/test-pantheon-one-product.ts
 *   node --env-file=.env --import tsx scripts/test-pantheon-one-product.ts --apply
 */

import { prisma } from '../src/lib/db'
import {
  getPantheonClient,
  normalizeStock,
} from '../src/lib/pantheon/client'
import { syncStock } from '../src/lib/pantheon/sync-inbound'

const APPLY = process.argv.includes('--apply')

const G = '\x1b[32m'
const R = '\x1b[31m'
const Y = '\x1b[33m'
const D = '\x1b[2m'
const X = '\x1b[0m'

async function main() {
  console.log(`\n${APPLY ? 'APPLY' : 'DRY-RUN'} — one-product Pantheon pipeline test\n`)

  // 1. Find a Pantheon code we want to use (must have stock > 0 so we'll see a change)
  const client = getPantheonClient()
  const stockRows = await client.fetchStock()
  const normalized = stockRows
    .map(normalizeStock)
    .filter((s): s is NonNullable<ReturnType<typeof normalizeStock>> => s !== null && s.stock > 0)

  if (normalized.length === 0) {
    console.log(`${R}✗${X} No Pantheon products with stock > 0`)
    process.exit(1)
  }
  const target = normalized[0] // first product with stock
  console.log(`${G}✓${X} Picked Pantheon target:`)
  console.log(`${D}    code:  ${target.code}${X}`)
  console.log(`${D}    stock: ${target.stock}${X}`)

  // 2. Find a candidate product in our DB to link
  const candidate = await prisma.product.findFirst({
    where: { erpId: null, isActive: true },
    select: {
      id: true,
      sku: true,
      nameLat: true,
      stockQuantity: true,
      erpId: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!candidate) {
    console.log(`${R}✗${X} No candidate product in DB (need: erpId=null AND isActive=true)`)
    process.exit(1)
  }
  console.log(`\n${G}✓${X} Picked DB candidate:`)
  console.log(`${D}    id:           ${candidate.id}${X}`)
  console.log(`${D}    sku:          ${candidate.sku}${X}`)
  console.log(`${D}    name:         ${candidate.nameLat}${X}`)
  console.log(`${D}    stock before: ${candidate.stockQuantity}${X}`)
  console.log(`${D}    erpId before: ${candidate.erpId ?? '(null)'}${X}`)

  if (!APPLY) {
    console.log(`\n${Y}DRY-RUN${X} — re-run with --apply to actually link + sync.`)
    console.log(`\nWhat would happen:`)
    console.log(`  1. Set Product[${candidate.id}].erpId = "${target.code}"`)
    console.log(`  2. Run syncStock() across all products with erpId`)
    console.log(`  3. Verify Product[${candidate.id}].stockQuantity changes to ${target.stock}`)
    await prisma.$disconnect()
    return
  }

  // 3. Link
  console.log(`\nLinking...`)
  await prisma.product.update({
    where: { id: candidate.id },
    data: { erpId: target.code },
  })
  console.log(`${G}✓${X} Set erpId = "${target.code}"`)

  // 4. Run stock sync
  console.log(`\nRunning syncStock()...`)
  const result = await syncStock()
  console.log(`${G}✓${X} Sync result:`)
  console.log(`${D}    logId:       ${result.logId}${X}`)
  console.log(`${D}    itemsSynced: ${result.itemsSynced}${X}`)
  console.log(`${D}    updated:     ${result.itemsUpdated}${X}`)
  console.log(`${D}    skipped:     ${result.itemsSkipped}${X}`)
  console.log(`${D}    duration:    ${result.durationMs}ms${X}`)

  // 5. Verify
  const after = await prisma.product.findUnique({
    where: { id: candidate.id },
    select: { stockQuantity: true, erpId: true },
  })

  console.log(`\nVerification:`)
  console.log(`${D}    Pantheon stock for code ${target.code}: ${target.stock}${X}`)
  console.log(`${D}    Our DB stock before:                   ${candidate.stockQuantity}${X}`)
  console.log(`${D}    Our DB stock after:                    ${after?.stockQuantity}${X}`)

  if (after?.stockQuantity === target.stock) {
    console.log(`\n${G}✓ PIPELINE VERIFIED${X} — stock value flowed from Pantheon → our DB.\n`)
  } else if (after && after.stockQuantity < target.stock) {
    console.log(
      `\n${Y}!${X} Stock is below Pantheon's value — this is expected if there are pending unsynced orders for this product.\n`,
    )
  } else {
    console.log(`\n${R}✗${X} Stock did not change as expected. Investigate.\n`)
  }

  // 6. Show the audit log row
  const log = await prisma.erpSyncLog.findUnique({ where: { id: result.logId } })
  console.log(`ErpSyncLog row created:`)
  console.log(JSON.stringify(log, null, 2))

  // 7. Revert so the DB is left exactly as we found it.
  console.log(`\nReverting test changes...`)
  await prisma.product.update({
    where: { id: candidate.id },
    data: { erpId: null, stockQuantity: candidate.stockQuantity },
  })
  console.log(`${G}✓${X} Product ${candidate.id} restored: erpId=null, stock=${candidate.stockQuantity}`)

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(`${R}Error:${X}`, err)
  await prisma.$disconnect()
  process.exit(1)
})
