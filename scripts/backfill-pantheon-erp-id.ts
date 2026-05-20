/**
 * Backfill Product.erpId by matching our DB against Pantheon.
 *
 * Five matching tiers, applied in order. Each our-product takes the first
 * tier that finds a match. Conflicts (1 Pantheon code claimed by multiple of
 * our products at the same tier) are dropped — we never link if there's
 * ambiguity, since wrong-linking a price/stock destination is hard to undo.
 *
 *   tier 1 = exact match on Product.sku == Pantheon ident (highest confidence)
 *   tier 2 = exact match on Product.barcode == Pantheon barcode (requires
 *            --barcodes-json since the products API doesn't return barcodes)
 *   tier 3 = exact match on raw name
 *   tier 4 = exact match on normalized name (diacritics removed, lowercased,
 *            whitespace collapsed)
 *   tier 5 = fuzzy: Jaccard token similarity ≥ 0.90, top-1 only
 *
 * Skips products that already have erpId set (never overwrites).
 * Skips Pantheon codes already claimed by another of our products.
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/backfill-pantheon-erp-id.ts
 *   node --env-file=.env --import tsx scripts/backfill-pantheon-erp-id.ts --apply
 *   node --env-file=.env --import tsx scripts/backfill-pantheon-erp-id.ts --apply --tiers=sku
 *   node --env-file=.env --import tsx scripts/backfill-pantheon-erp-id.ts --apply --barcodes-json=/tmp/pantheon-active-sifre.json
 *
 * Flags:
 *   --apply                   Write changes (default: dry-run)
 *   --tiers=t1,t2,...         Restrict tiers (sku|barcode|exact|normalized|fuzzy)
 *   --threshold=0.90          Fuzzy threshold (default 0.90)
 *   --csv-unmatched           Write unmatched/ambiguous rows to a CSV for review
 *   --barcodes-json=<path>    JSON array of { ident, barcode } from an external
 *                             Pantheon export (the products API does not return
 *                             barcodes). Enables the barcode tier.
 */

import { readFileSync, writeFileSync } from 'node:fs'

import { prisma } from '../src/lib/db'
import { getPantheonClient, normalizeProduct } from '../src/lib/pantheon/client'
import type { NormalizedPantheonProduct } from '../src/lib/pantheon/types'

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const WRITE_CSV = args.includes('--csv-unmatched')
const BARCODES_JSON_PATH = (() => {
  const flag = args.find((a) => a.startsWith('--barcodes-json='))
  return flag ? flag.slice('--barcodes-json='.length) : null
})()
const ENABLED_TIERS = (() => {
  const flag = args.find((a) => a.startsWith('--tiers='))
  if (!flag) {
    const base = new Set(['sku', 'exact', 'normalized', 'fuzzy'])
    if (BARCODES_JSON_PATH) base.add('barcode')
    return base
  }
  return new Set(flag.slice('--tiers='.length).split(',').map((s) => s.trim()))
})()
const FUZZY_THRESHOLD = (() => {
  const flag = args.find((a) => a.startsWith('--threshold='))
  if (!flag) return 0.9
  const v = parseFloat(flag.slice('--threshold='.length))
  return Number.isFinite(v) && v > 0 && v <= 1 ? v : 0.9
})()

// ─── Colors ──────────────────────────────────────────────────────────────────

const G = '\x1b[32m'
const R = '\x1b[31m'
const Y = '\x1b[33m'
const C = '\x1b[36m'
const D = '\x1b[2m'
const X = '\x1b[0m'

// ─── Normalization ───────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/[š]/g, 's')
    .replace(/[ž]/g, 'z')
    .replace(/[đ]/g, 'dj')
    .replace(/[^a-z0-9./\- ]/g, ' ') // keep alphanum and a few useful punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(/[\s\-/]+/)
      .filter((t) => t.length >= 2),
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const t of a) if (b.has(t)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

// ─── Main ────────────────────────────────────────────────────────────────────

type Tier = 'sku' | 'barcode' | 'exact' | 'normalized' | 'fuzzy'

interface Match {
  ourId: string
  ourName: string
  ourSku: string
  pantheonCode: string
  pantheonName: string
  pantheonActive: boolean
  tier: Tier
  score: number
}

async function main() {
  console.log(`\n${APPLY ? 'APPLY' : 'DRY-RUN'} — Pantheon erpId backfill`)
  console.log(`Tiers enabled: ${[...ENABLED_TIERS].join(', ')}`)
  console.log(`Fuzzy threshold: ${FUZZY_THRESHOLD}\n`)

  // 1. Fetch + normalize Pantheon products
  console.log('Fetching Pantheon products...')
  const client = getPantheonClient()
  const raw = await client.fetchProducts()
  const pantheon = raw
    .map(normalizeProduct)
    .filter((p): p is NormalizedPantheonProduct => p !== null)
  console.log(`${G}✓${X} ${pantheon.length} Pantheon products (after filtering bookkeeping)`)

  // Build lookup maps
  const exactByName = new Map<string, NormalizedPantheonProduct[]>()
  const exactByNorm = new Map<string, NormalizedPantheonProduct[]>()
  const pantheonByCode = new Map<string, NormalizedPantheonProduct>()
  const tokenized = pantheon.map((p) => ({ p, tokens: tokenize(p.name) }))

  for (const p of pantheon) {
    const exact = p.name
    const norm = normalize(p.name)
    if (!exactByName.has(exact)) exactByName.set(exact, [])
    if (!exactByNorm.has(norm)) exactByNorm.set(norm, [])
    exactByName.get(exact)!.push(p)
    exactByNorm.get(norm)!.push(p)
    pantheonByCode.set(p.code, p)
  }

  // Optional: barcode lookup from external source (Pantheon products API does
  // not expose barcodes; we accept a JSON file shaped [{ ident, barcode }, ...]).
  const byBarcode = new Map<string, NormalizedPantheonProduct[]>()
  if (BARCODES_JSON_PATH) {
    type BarcodeRow = { ident: string | number; barcode: string }
    const rows: BarcodeRow[] = JSON.parse(readFileSync(BARCODES_JSON_PATH, 'utf-8'))
    let attached = 0
    for (const row of rows) {
      const bc = String(row.barcode).trim()
      if (!bc) continue
      const ident = String(row.ident).trim()
      const p = pantheonByCode.get(ident)
      if (!p) continue
      if (!byBarcode.has(bc)) byBarcode.set(bc, [])
      byBarcode.get(bc)!.push(p)
      attached++
    }
    console.log(`${G}✓${X} ${attached} barcodes loaded from ${BARCODES_JSON_PATH}`)
  }

  // 2. Load our DB products without erpId
  console.log('Loading our DB products without erpId...')
  const ours = await prisma.product.findMany({
    where: { erpId: null },
    select: { id: true, sku: true, nameLat: true, barcode: true, isActive: true },
  })
  console.log(`${G}✓${X} ${ours.length} of our products have erpId = null`)

  // Also load already-claimed codes so we don't double-link
  const alreadyLinked = await prisma.product.findMany({
    where: { erpId: { not: null } },
    select: { erpId: true },
  })
  const claimedCodes = new Set(
    alreadyLinked.map((p) => p.erpId).filter((id): id is string => !!id),
  )
  if (claimedCodes.size > 0) {
    console.log(`${D}  ${claimedCodes.size} Pantheon codes already claimed — excluded from candidates${X}`)
  }

  // 3. Match
  console.log(`\nMatching ${ours.length} of our products against ${pantheon.length} Pantheon products...`)
  const matches: Match[] = []
  const ambiguous: Array<{ ourId: string; ourName: string; reason: string }> = []
  const noMatch: Array<{ ourId: string; ourName: string; bestFuzzy?: number }> = []

  let i = 0
  for (const o of ours) {
    i++
    if (i % 500 === 0) process.stdout.write(`${D}  ...${i}/${ours.length}\r${X}`)

    // Tier: sku == Pantheon ident (most reliable — exact code match)
    if (ENABLED_TIERS.has('sku')) {
      const sku = o.sku?.trim()
      if (sku && !claimedCodes.has(sku)) {
        const p = pantheonByCode.get(sku)
        if (p) {
          matches.push({
            ourId: o.id,
            ourName: o.nameLat,
            ourSku: o.sku,
            pantheonCode: p.code,
            pantheonName: p.name,
            pantheonActive: p.isActive,
            tier: 'sku',
            score: 1,
          })
          continue
        }
      }
    }

    // Tier: barcode == Pantheon barcode (requires --barcodes-json)
    if (ENABLED_TIERS.has('barcode') && o.barcode) {
      const bc = o.barcode.trim()
      const hit = (byBarcode.get(bc) ?? []).filter((p) => !claimedCodes.has(p.code))
      if (hit.length === 1) {
        matches.push({
          ourId: o.id,
          ourName: o.nameLat,
          ourSku: o.sku,
          pantheonCode: hit[0].code,
          pantheonName: hit[0].name,
          pantheonActive: hit[0].isActive,
          tier: 'barcode',
          score: 1,
        })
        continue
      }
      if (hit.length > 1) {
        ambiguous.push({
          ourId: o.id,
          ourName: o.nameLat,
          reason: `${hit.length} barcode matches in Pantheon`,
        })
        continue
      }
    }

    // Tier 1: exact
    if (ENABLED_TIERS.has('exact')) {
      const hit = (exactByName.get(o.nameLat) ?? []).filter((p) => !claimedCodes.has(p.code))
      if (hit.length === 1) {
        matches.push({
          ourId: o.id,
          ourName: o.nameLat,
          ourSku: o.sku,
          pantheonCode: hit[0].code,
          pantheonName: hit[0].name,
          pantheonActive: hit[0].isActive,
          tier: 'exact',
          score: 1,
        })
        continue
      }
      if (hit.length > 1) {
        ambiguous.push({
          ourId: o.id,
          ourName: o.nameLat,
          reason: `${hit.length} exact name matches in Pantheon`,
        })
        continue
      }
    }

    // Tier 2: normalized
    if (ENABLED_TIERS.has('normalized')) {
      const hit = (exactByNorm.get(normalize(o.nameLat)) ?? []).filter((p) => !claimedCodes.has(p.code))
      if (hit.length === 1) {
        matches.push({
          ourId: o.id,
          ourName: o.nameLat,
          ourSku: o.sku,
          pantheonCode: hit[0].code,
          pantheonName: hit[0].name,
          pantheonActive: hit[0].isActive,
          tier: 'normalized',
          score: 1,
        })
        continue
      }
      if (hit.length > 1) {
        ambiguous.push({
          ourId: o.id,
          ourName: o.nameLat,
          reason: `${hit.length} normalized-name matches in Pantheon`,
        })
        continue
      }
    }

    // Tier 3: fuzzy
    if (ENABLED_TIERS.has('fuzzy')) {
      const oTokens = tokenize(o.nameLat)
      if (oTokens.size === 0) {
        noMatch.push({ ourId: o.id, ourName: o.nameLat })
        continue
      }
      let bestScore = 0
      let secondBestScore = 0
      let bestProd: NormalizedPantheonProduct | null = null
      for (const { p, tokens } of tokenized) {
        if (claimedCodes.has(p.code)) continue
        const score = jaccard(oTokens, tokens)
        if (score > bestScore) {
          secondBestScore = bestScore
          bestScore = score
          bestProd = p
        } else if (score > secondBestScore) {
          secondBestScore = score
        }
      }
      // Require clear winner: top score above threshold AND meaningfully better than #2
      if (bestProd && bestScore >= FUZZY_THRESHOLD && bestScore - secondBestScore >= 0.05) {
        matches.push({
          ourId: o.id,
          ourName: o.nameLat,
          ourSku: o.sku,
          pantheonCode: bestProd.code,
          pantheonName: bestProd.name,
          pantheonActive: bestProd.isActive,
          tier: 'fuzzy',
          score: bestScore,
        })
        continue
      }
      if (bestProd && bestScore >= FUZZY_THRESHOLD) {
        ambiguous.push({
          ourId: o.id,
          ourName: o.nameLat,
          reason: `fuzzy tie: best=${bestScore.toFixed(2)}, second=${secondBestScore.toFixed(2)}`,
        })
        continue
      }
      noMatch.push({ ourId: o.id, ourName: o.nameLat, bestFuzzy: bestScore })
      continue
    }

    noMatch.push({ ourId: o.id, ourName: o.nameLat })
  }
  process.stdout.write(`${' '.repeat(40)}\r`) // clear progress line

  // 4. Within-tier conflict resolution: same code claimed by multiple of ours
  const byCode = new Map<string, Match[]>()
  for (const m of matches) {
    if (!byCode.has(m.pantheonCode)) byCode.set(m.pantheonCode, [])
    byCode.get(m.pantheonCode)!.push(m)
  }
  const finalMatches: Match[] = []
  for (const [code, group] of byCode) {
    if (group.length === 1) {
      finalMatches.push(group[0])
    } else {
      for (const m of group) {
        ambiguous.push({
          ourId: m.ourId,
          ourName: m.ourName,
          reason: `Pantheon code ${code} claimed by ${group.length} of our products at tier=${m.tier}`,
        })
      }
    }
  }

  // 5. Report
  const byTier = {
    sku: finalMatches.filter((m) => m.tier === 'sku').length,
    barcode: finalMatches.filter((m) => m.tier === 'barcode').length,
    exact: finalMatches.filter((m) => m.tier === 'exact').length,
    normalized: finalMatches.filter((m) => m.tier === 'normalized').length,
    fuzzy: finalMatches.filter((m) => m.tier === 'fuzzy').length,
  }
  const inactiveTargets = finalMatches.filter((m) => !m.pantheonActive).length

  console.log(`\n${C}═══ Results ═══${X}`)
  console.log(`${G}Matched:${X} ${finalMatches.length}`)
  console.log(`${D}    sku:        ${byTier.sku}${X}`)
  console.log(`${D}    barcode:    ${byTier.barcode}${X}`)
  console.log(`${D}    exact:      ${byTier.exact}${X}`)
  console.log(`${D}    normalized: ${byTier.normalized}${X}`)
  console.log(`${D}    fuzzy:      ${byTier.fuzzy}${X}`)
  console.log(`${Y}Ambiguous:${X} ${ambiguous.length} (skipped — see CSV with --csv-unmatched)`)
  console.log(`${R}Unmatched:${X} ${noMatch.length}`)
  if (inactiveTargets > 0) {
    console.log(
      `${Y}!${X} ${inactiveTargets} matched products link to Pantheon entries marked inactive — next product sync would set them isActive=false on our side.`,
    )
  }

  // Sample
  if (finalMatches.length > 0) {
    console.log(`\n${C}Sample matches (3 per tier):${X}`)
    for (const tier of ['sku', 'barcode', 'exact', 'normalized', 'fuzzy'] as Tier[]) {
      const samples = finalMatches.filter((m) => m.tier === tier).slice(0, 3)
      if (samples.length === 0) continue
      console.log(`  ${tier}:`)
      for (const m of samples) {
        const scoreStr = tier === 'fuzzy' ? ` [score=${m.score.toFixed(2)}]` : ''
        console.log(`${D}    "${truncate(m.ourName, 50)}"  ↔  "${truncate(m.pantheonName, 50)}" (${m.pantheonCode})${scoreStr}${X}`)
      }
    }
  }

  // Optional CSV
  if (WRITE_CSV && (ambiguous.length > 0 || noMatch.length > 0)) {
    const csv = [
      'category,ourId,ourName,reason_or_bestScore',
      ...ambiguous.map((a) => `ambiguous,${a.ourId},"${escapeCsv(a.ourName)}","${escapeCsv(a.reason)}"`),
      ...noMatch.map(
        (n) =>
          `unmatched,${n.ourId},"${escapeCsv(n.ourName)}",${n.bestFuzzy !== undefined ? n.bestFuzzy.toFixed(2) : ''}`,
      ),
    ].join('\n')
    const file = `scripts/backfill-unmatched-${Date.now()}.csv`
    writeFileSync(file, csv)
    console.log(`\n${G}✓${X} Wrote ${file}`)
  }

  // 6. Apply or stop
  if (!APPLY) {
    console.log(`\n${Y}DRY-RUN${X} — re-run with --apply to write ${finalMatches.length} erpId assignments.`)
    await prisma.$disconnect()
    return
  }

  if (finalMatches.length === 0) {
    console.log(`\n${Y}Nothing to apply.${X}`)
    await prisma.$disconnect()
    return
  }

  console.log(`\nApplying ${finalMatches.length} updates in batches of 100...`)
  let applied = 0
  for (let i = 0; i < finalMatches.length; i += 100) {
    const batch = finalMatches.slice(i, i + 100)
    await prisma.$transaction(
      batch.map((m) =>
        prisma.product.update({
          where: { id: m.ourId },
          data: { erpId: m.pantheonCode },
        }),
      ),
    )
    applied += batch.length
    process.stdout.write(`${D}  ${applied}/${finalMatches.length}\r${X}`)
  }
  process.stdout.write(`${' '.repeat(40)}\r`)

  console.log(`${G}✓${X} ${applied} products now have erpId set\n`)

  await prisma.$disconnect()
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function escapeCsv(s: string) {
  return s.replace(/"/g, '""')
}

main().catch(async (err) => {
  console.error(`${R}Error:${X}`, err)
  await prisma.$disconnect()
  process.exit(1)
})
