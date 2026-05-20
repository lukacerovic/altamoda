/**
 * Pantheon connectivity smoke test.
 *
 * Runs the same three operations the integration uses (fetchStock,
 * fetchProducts, normalize) and prints a human-readable report. Read-only —
 * does NOT push anything to Pantheon and does NOT write to our DB.
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/test-pantheon-connection.ts
 */

import {
  getPantheonClient,
  normalizeProduct,
  normalizeStock,
  PantheonError,
} from '../src/lib/pantheon/client'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

function ok(msg: string) { console.log(`${GREEN}✓${RESET} ${msg}`) }
function bad(msg: string) { console.log(`${RED}✗${RESET} ${msg}`) }
function info(msg: string) { console.log(`${DIM}  ${msg}${RESET}`) }
function warn(msg: string) { console.log(`${YELLOW}!${RESET} ${msg}`) }

async function main() {
  console.log('\nPantheon connection test\n')

  // ─── Step 1: env vars ──────────────────────────────────────────────────
  const url = process.env.PANTHEON_API_URL
  const user = process.env.PANTHEON_API_USER
  const pass = process.env.PANTHEON_API_PASS

  if (!url || !user || !pass) {
    bad('Environment variables missing')
    info(`PANTHEON_API_URL  = ${url ? 'set' : 'MISSING'}`)
    info(`PANTHEON_API_USER = ${user ? 'set' : 'MISSING'}`)
    info(`PANTHEON_API_PASS = ${pass ? 'set' : 'MISSING'}`)
    process.exit(1)
  }
  ok('Environment variables present')
  info(`URL:  ${url}`)
  info(`User: ${user}`)
  info(`Pass: ${'*'.repeat(Math.min(pass.length, 8))}...`)

  let client
  try {
    client = getPantheonClient()
  } catch (err) {
    bad(`Client init failed: ${(err as Error).message}`)
    process.exit(1)
  }

  // ─── Step 2: fetchStock ────────────────────────────────────────────────
  console.log('\n─ Test: action=stock ─')
  const stockStart = Date.now()
  try {
    const raw = await client.fetchStock()
    const elapsed = Date.now() - stockStart
    ok(`Got ${raw.length} stock rows in ${elapsed}ms`)
    const normalized = raw.map(normalizeStock).filter((s) => s !== null)
    const skipped = raw.length - normalized.length
    info(`After normalize: ${normalized.length} valid rows, ${skipped} skipped (empty / bookkeeping)`)
    if (normalized.length > 0) {
      info(`Sample: ${JSON.stringify(normalized.slice(0, 3))}`)
    }
  } catch (err) {
    bad(`Stock fetch failed: ${err instanceof PantheonError ? err.message : (err as Error).message}`)
    process.exit(1)
  }

  // ─── Step 3: fetchProducts ─────────────────────────────────────────────
  console.log('\n─ Test: action=products ─')
  const prodStart = Date.now()
  try {
    const raw = await client.fetchProducts()
    const elapsed = Date.now() - prodStart
    ok(`Got ${raw.length} product rows in ${elapsed}ms`)

    const normalized = raw.map(normalizeProduct).filter((p) => p !== null)
    const skipped = raw.length - normalized.length
    info(`After normalize: ${normalized.length} valid products, ${skipped} skipped`)

    const active = normalized.filter((p) => p!.isActive).length
    const inactive = normalized.length - active
    info(`Active: ${active}, Inactive: ${inactive}`)

    const withPrice = normalized.filter((p) => p!.priceWithVat > 0).length
    info(`With price > 0: ${withPrice}`)

    if (normalized.length > 0) {
      const sample = normalized.find((p) => p!.isActive && p!.priceWithVat > 0 && p!.stock > 0) ?? normalized[0]
      console.log('\n  Sample product:')
      info(`  code:  ${sample!.code}`)
      info(`  name:  ${sample!.name}`)
      info(`  c (with VAT):    ${sample!.priceWithVat}`)
      info(`  d (without VAT): ${sample!.priceWithoutVat}`)
      info(`  ratio c/d:       ${(sample!.priceWithVat / (sample!.priceWithoutVat || 1)).toFixed(4)} (1.20 = 20% VAT)`)
      info(`  stock:           ${sample!.stock}`)
      info(`  active:          ${sample!.isActive}`)
    }
  } catch (err) {
    bad(`Products fetch failed: ${err instanceof PantheonError ? err.message : (err as Error).message}`)
    process.exit(1)
  }

  // ─── Step 4: cross-check against our DB (optional) ─────────────────────
  console.log('\n─ DB cross-check ─')
  try {
    const { prisma } = await import('../src/lib/db')
    const ourTotal = await prisma.product.count()
    const withErpId = await prisma.product.count({ where: { erpId: { not: null } } })
    ok(`Our DB has ${ourTotal} products total, ${withErpId} have erpId set`)
    if (withErpId === 0) {
      warn(`No products in our DB have erpId set yet — first product sync will create them all`)
    }
    await prisma.$disconnect()
  } catch (err) {
    warn(`DB check skipped: ${(err as Error).message}`)
  }

  console.log(`\n${GREEN}All checks passed.${RESET} Pantheon is reachable and responses parse correctly.\n`)
}

main().catch((err) => {
  console.error(`\n${RED}Unexpected error:${RESET}`, err)
  process.exit(1)
})
