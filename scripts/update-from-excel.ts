/**
 * One-shot backfill from "AMS sajt 2026. baza B2C i B2B, finalni uzorak.xlsx".
 *
 * Matches Excel rows to DB products by IDENT == sku. For each match, fills
 * BLANK fields only — never overwrites manual edits. Missing/ambiguous SKUs
 * are skipped and listed in the report.
 *
 * Usage (dry run):
 *   node --env-file=.env --import tsx scripts/update-from-excel.ts
 *
 * Apply changes:
 *   node --env-file=.env --import tsx scripts/update-from-excel.ts --apply
 *
 * Production:
 *   DATABASE_URL=postgres://... node --import tsx scripts/update-from-excel.ts --apply
 */

import * as XLSX from 'xlsx'
import { writeFileSync } from 'node:fs'
import { prisma } from '../src/lib/db'
import { resolveBrandId, resolveCategoryId, resolveProductLineId } from '../src/lib/taxonomy'

const EXCEL_PATH =
  process.env.EXCEL_PATH ||
  '/Users/lukacerovic/Downloads/AMS sajt 2026. baza B2C i B2B, finalni uzorak.xlsx'
const SHEET_NAME = 'ALTA MODA'

interface ExcelRow {
  ident: string
  ean: string | null
  name: string
  brand: string | null
  category: string | null
  subcategory: string | null
  productLine: string | null
  productType: string | null
  hairTypes: string | null
  tags: string | null
  description: string | null
  usageInstructions: string | null
  ingredients: string | null
  benefits: string | null
  declaration: string | null
}

function cell(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

function readRows(): ExcelRow[] {
  const wb = XLSX.readFile(EXCEL_PATH)
  const ws = wb.Sheets[SHEET_NAME]
  if (!ws) throw new Error(`Sheet "${SHEET_NAME}" not found in ${EXCEL_PATH}`)
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
  return json
    .map(r => ({
      ident: String(r['IDENT'] ?? '').trim(),
      ean: cell(r['EAN CODE']),
      name: String(r['NAZIV'] ?? '').trim(),
      brand: cell(r['BREND']),
      category: cell(r['KATEGORIJA']),
      subcategory: cell(r['POTKATEGORIJA']),
      productLine: cell(r['LINIJA']),
      productType: cell(r['TIP PROIZVODA']),
      hairTypes: cell(r['TIP KOSE']),
      tags: cell(r['FUNKCIJA/TAGOVI']),
      // Headers in the Excel have inconsistent trailing spaces — try both.
      description: cell(r['OPIS '] ?? r['OPIS']),
      usageInstructions: cell(r['UPOTREBA']),
      ingredients: cell(r['SASTAV']),
      benefits: cell(r['BENEFITI']),
      declaration: cell(r['DEKLARACIJA']),
    }))
    .filter(r => r.ident.length > 0)
}

interface UpdateAction {
  ident: string
  status: 'updated' | 'skipped-no-match' | 'no-changes'
  productId?: string
  productName?: string
  fieldsUpdated: string[]
  warnings: string[]
}

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(apply ? '== APPLY mode ==\n' : '== DRY RUN (use --apply to commit) ==\n')

  const rows = readRows()
  console.log(`Read ${rows.length} rows from ${EXCEL_PATH}\n`)

  const actions: UpdateAction[] = []

  for (const r of rows) {
    const product = await prisma.product.findUnique({
      where: { sku: r.ident },
      select: {
        id: true, nameLat: true,
        brandId: true, categoryId: true, productLineId: true,
        subcategory: true, productType: true, hairTypes: true, tags: true,
        description: true, benefits: true, ingredients: true, declaration: true,
        usageInstructions: true, barcode: true,
      },
    })

    if (!product) {
      actions.push({ ident: r.ident, status: 'skipped-no-match', fieldsUpdated: [], warnings: [`no product with sku=${r.ident}`] })
      continue
    }

    const data: Record<string, unknown> = {}
    const fieldsUpdated: string[] = []
    const warnings: string[] = []

    const fillBlank = (current: unknown, next: string | null, field: string) => {
      if (next == null) return
      if (current != null && String(current).trim() !== '') return
      data[field] = next
      fieldsUpdated.push(field)
    }

    fillBlank(product.barcode, r.ean, 'barcode')
    fillBlank(product.productType, r.productType, 'productType')
    fillBlank(product.hairTypes, r.hairTypes, 'hairTypes')
    fillBlank(product.tags, r.tags, 'tags')
    fillBlank(product.description, r.description, 'description')
    fillBlank(product.usageInstructions, r.usageInstructions, 'usageInstructions')
    fillBlank(product.ingredients, r.ingredients, 'ingredients')
    fillBlank(product.benefits, r.benefits, 'benefits')
    fillBlank(product.declaration, r.declaration, 'declaration')

    // Brand FK (only if blank)
    if (r.brand && product.brandId == null) {
      const brandId = await resolveBrandId(r.brand)
      if (brandId) {
        data.brandId = brandId
        fieldsUpdated.push('brandId')
      }
    }

    // Category FK — supports child via Excel POTKATEGORIJA, and absorbs
    // multi-value KATEGORIJA ("NEGA, STAJLING") into the free `subcategory` string.
    if (r.category && product.categoryId == null) {
      const parts = r.category.split(',').map(s => s.trim()).filter(Boolean)
      const primary = parts[0]
      const extras = parts.slice(1)
      const categoryId = await resolveCategoryId(primary, r.subcategory)
      if (categoryId) {
        data.categoryId = categoryId
        fieldsUpdated.push('categoryId')
      }
      if (extras.length > 0 && (product.subcategory == null || product.subcategory.trim() === '')) {
        data.subcategory = extras.join(', ')
        fieldsUpdated.push('subcategory')
      }
    } else if (r.category) {
      warnings.push(`category already set, leaving alone (existing categoryId=${product.categoryId})`)
    }

    // Product line FK — needs a brand to attach to (existing or just-resolved)
    if (r.productLine && product.productLineId == null) {
      const brandId = (data.brandId as string | undefined) ?? product.brandId
      if (brandId) {
        const lineId = await resolveProductLineId(brandId, r.productLine)
        if (lineId) {
          data.productLineId = lineId
          fieldsUpdated.push('productLineId')
        }
      } else {
        warnings.push('productLine present but no brand to attach it to — skipped')
      }
    }

    if (fieldsUpdated.length === 0) {
      actions.push({ ident: r.ident, status: 'no-changes', productId: product.id, productName: product.nameLat, fieldsUpdated: [], warnings })
      continue
    }

    if (apply) {
      await prisma.product.update({ where: { id: product.id }, data })
    }

    actions.push({ ident: r.ident, status: 'updated', productId: product.id, productName: product.nameLat, fieldsUpdated, warnings })
  }

  // Summary
  const counts = { updated: 0, 'no-changes': 0, 'skipped-no-match': 0 }
  for (const a of actions) counts[a.status]++
  console.log('=== Summary ===')
  console.log(`updated:           ${counts.updated}`)
  console.log(`no-changes:        ${counts['no-changes']}`)
  console.log(`skipped (no sku):  ${counts['skipped-no-match']}`)

  console.log('\n=== Per-row ===')
  for (const a of actions) {
    const tag = a.status === 'updated' ? '✓' : a.status === 'no-changes' ? '·' : '✗'
    console.log(`${tag} ${a.ident.padEnd(6)} ${a.status.padEnd(18)} ${a.productName ?? ''}`)
    if (a.fieldsUpdated.length > 0) console.log(`         fields: ${a.fieldsUpdated.join(', ')}`)
    for (const w of a.warnings) console.log(`         ⚠ ${w}`)
  }

  // CSV report
  const csvPath = 'scripts/excel-import-report.csv'
  const header = 'ident,status,product_name,fields_updated,warnings'
  const csvRows = actions.map(a => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
    return [
      esc(a.ident),
      esc(a.status),
      esc(a.productName ?? ''),
      esc(a.fieldsUpdated.join(';')),
      esc(a.warnings.join(';')),
    ].join(',')
  })
  writeFileSync(csvPath, [header, ...csvRows].join('\n'))
  console.log(`\nReport written: ${csvPath}`)

  if (!apply) {
    console.log('\n** DRY RUN — no DB writes. Re-run with --apply to commit. **')
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
