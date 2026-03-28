import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'
import * as XLSX from 'xlsx'

/* ═══════════════════════════════════════════════════════════════
   FILE TYPE DETECTION
   ═══════════════════════════════════════════════════════════════ */

type PantheonFileType = 'products' | 'categories' | 'barcodes' | 'altamoda_csv' | 'unknown'

function detectFileType(headers: string[]): PantheonFileType {
  const lower = new Set(headers.map(h => h.toLowerCase().trim()))

  // Pantheon products: has acIdent + acName + anSalePrice
  if (lower.has('acident') && lower.has('acname') && lower.has('ansaleprice')) {
    return 'products'
  }

  // Pantheon categories: has acClassif + acName + acType (but NOT anSalePrice)
  if (lower.has('acclassif') && lower.has('acname') && lower.has('actype') && !lower.has('ansaleprice')) {
    return 'categories'
  }

  // Pantheon barcodes: has acIdent + acCode + acType (small table, ~14 cols)
  if (lower.has('acident') && lower.has('accode') && lower.has('actype') && !lower.has('acname')) {
    return 'barcodes'
  }
  // Also detect barcodes if it has acIdent + acCode but only few columns (< 20)
  if (lower.has('acident') && lower.has('accode') && headers.length < 20) {
    return 'barcodes'
  }

  // Alta Moda CSV format
  const altamodaHits = [...lower].filter(h =>
    ['name', 'brand', 'category', 'current_price_rsd', 'url_slug', 'image_url', 'sku', 'priceb2c', 'price'].includes(h)
  )
  if (altamodaHits.length >= 2) {
    return 'altamoda_csv'
  }

  return 'unknown'
}

const FILE_TYPE_LABELS: Record<PantheonFileType, string> = {
  products: 'Pantheon Proizvodi (the_setItem)',
  categories: 'Pantheon Kategorije (tHE_SetItemCateg)',
  barcodes: 'Pantheon Barkodovi (tHE_SetItemExtItemSubj)',
  altamoda_csv: 'Alta Moda CSV',
  unknown: 'Nepoznat format',
}

/* ═══════════════════════════════════════════════════════════════
   FILE PARSING
   ═══════════════════════════════════════════════════════════════ */

function parseFile(buffer: ArrayBuffer, fileName: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const ext = fileName.toLowerCase().split('.').pop()

  if (ext === 'csv' || ext === 'txt') {
    const text = new TextDecoder('utf-8').decode(buffer)
    return parseCsvText(text)
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('Excel fajl nema nijedan sheet')
    const sheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    if (json.length === 0) throw new Error('Excel sheet je prazan')
    return { headers: Object.keys(json[0]), rows: json }
  }

  throw new Error(`Nepodržan format: .${ext}. Koristite .csv, .xlsx ili .xls`)
}

function parseCsvText(text: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const lines = text.trim().replace(/\r\n/g, '\n').split('\n')
  if (lines.length < 2) throw new Error('CSV mora imati zaglavlje i bar jedan red podataka')
  const headers = parseCsvLine(lines[0])
  const rows: Record<string, unknown>[] = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCsvLine(lines[i])
    const row: Record<string, unknown> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })
    rows.push(row)
  }
  return { headers, rows }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { current += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { fields.push(current.trim()); current = '' }
      else { current += ch }
    }
  }
  fields.push(current.trim())
  return fields
}

/** Case-insensitive column value getter */
function col(row: Record<string, unknown>, name: string): string {
  // Try exact match first, then case-insensitive
  if (row[name] != null) return String(row[name]).trim()
  const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase())
  if (key && row[key] != null) return String(row[key]).trim()
  return ''
}

/** Convert Pantheon float ID to clean string */
function cleanId(val: string): string {
  if (!val) return ''
  const num = Number(val)
  return isNaN(num) ? val : String(Math.floor(num))
}

/* ═══════════════════════════════════════════════════════════════
   STEP 1: IMPORT CATEGORIES (tHE_SetItemCateg)
   ═══════════════════════════════════════════════════════════════ */

interface CategoryResult {
  created: number
  updated: number
  skipped: number
  errors: { row: number; error: string }[]
}

async function importCategories(
  rows: Record<string, unknown>[],
  brandMap: Map<string, string>,
  categoryMap: Map<string, string>,
): Promise<CategoryResult> {
  let created = 0, updated = 0, skipped = 0
  const errors: { row: number; error: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const classif = col(r, 'acClassif')
    const name = col(r, 'acName') || classif
    const type = col(r, 'acType').toUpperCase()
    const active = col(r, 'acActive').toUpperCase() !== 'F'

    if (!classif || !name) { skipped++; continue }

    const slug = slugify(name)
    if (!slug) { skipped++; continue }

    try {
      if (type === 'P') {
        // Product-level classification → Brand
        const key = name.toLowerCase()
        if (brandMap.has(key)) {
          updated++
        } else {
          const existing = await prisma.brand.findUnique({ where: { slug } })
          if (existing) {
            brandMap.set(key, existing.id)
            updated++
          } else {
            const brand = await prisma.brand.create({
              data: { name, slug, isActive: active },
            })
            brandMap.set(key, brand.id)
            created++
          }
        }
      } else {
        // O = parent category, S = sub-category
        const key = name.toLowerCase()
        if (categoryMap.has(key)) {
          updated++
        } else {
          const existing = await prisma.category.findUnique({ where: { slug } })
          if (existing) {
            categoryMap.set(key, existing.id)
            updated++
          } else {
            // For sub-categories (S), try to find parent by matching prefix
            let parentId: string | null = null
            if (type === 'S') {
              // Try to match parent category — look for O-type entries already imported
              for (const [catName, catId] of categoryMap.entries()) {
                if (name.toLowerCase().includes(catName) || catName.includes(name.toLowerCase())) {
                  parentId = catId
                  break
                }
              }
            }

            const cat = await prisma.category.create({
              data: {
                nameLat: name,
                slug,
                isActive: active,
                parentId,
                depth: parentId ? 1 : 0,
              },
            })
            categoryMap.set(key, cat.id)
            created++
          }
        }
      }
    } catch (err) {
      errors.push({ row: i + 2, error: `"${name}": ${(err as Error).message.slice(0, 150)}` })
    }
  }

  return { created, updated, skipped, errors }
}

/* ═══════════════════════════════════════════════════════════════
   STEP 2: IMPORT PRODUCTS (the_setItem or altamoda CSV)
   ═══════════════════════════════════════════════════════════════ */

interface ProductResult {
  created: number
  updated: number
  skipped: number
  errors: { row: number; name: string; error: string }[]
  newBrands: string[]
  newCategories: string[]
}

async function importProducts(
  rows: Record<string, unknown>[],
  fileType: 'products' | 'altamoda_csv',
  brandMap: Map<string, string>,
  categoryMap: Map<string, string>,
): Promise<ProductResult> {
  const newBrands = new Map<string, string>()
  const newCategories = new Map<string, string>()

  // Column accessor based on file type
  const isPantheon = fileType === 'products'
  const getName = (r: Record<string, unknown>) => isPantheon ? col(r, 'acName') : (col(r, 'name') || col(r, 'naziv'))
  const getSku = (r: Record<string, unknown>) => {
    const raw = isPantheon ? col(r, 'acIdent') : (col(r, 'sku') || col(r, 'id'))
    return isPantheon ? cleanId(raw) : raw
  }
  const getBrand = (r: Record<string, unknown>) => isPantheon ? (col(r, 'acClassif') || col(r, 'acFieldSC')) : col(r, 'brand')
  const getCategory = (r: Record<string, unknown>) => isPantheon ? col(r, 'acClassif2') : col(r, 'category')
  const getPrice = (r: Record<string, unknown>) => isPantheon ? col(r, 'anSalePrice') : (col(r, 'priceB2c') || col(r, 'current_price_rsd') || col(r, 'price'))
  const getCostPrice = (r: Record<string, unknown>) => isPantheon ? col(r, 'anBuyPrice') : (col(r, 'costPrice') || col(r, 'cost_price'))
  const getOldPrice = (r: Record<string, unknown>) => isPantheon ? '' : (col(r, 'oldPrice') || col(r, 'original_price_rsd'))
  const getVatRate = (r: Record<string, unknown>) => isPantheon ? col(r, 'anVAT') : col(r, 'vatRate')
  const getVatCode = (r: Record<string, unknown>) => isPantheon ? col(r, 'acVATCode') : col(r, 'vatCode')
  const getDescription = (r: Record<string, unknown>) => isPantheon ? (col(r, 'acFieldSE') || col(r, 'acFieldSB')) : (col(r, 'description') || col(r, 'volume_size'))
  const getSlug = (r: Record<string, unknown>) => isPantheon ? '' : (col(r, 'url_slug') || col(r, 'slug'))
  const getImageUrl = (r: Record<string, unknown>) => isPantheon ? '' : col(r, 'image_url')
  const getBarcode = (r: Record<string, unknown>) => isPantheon ? '' : col(r, 'barcode')
  const getErpId = (r: Record<string, unknown>) => isPantheon ? cleanId(col(r, 'acIdent')) : (col(r, 'erpId') || col(r, 'erp_id'))

  // Pre-transform to collect SKUs for batch lookup
  interface TransformedProduct {
    rowNum: number
    name: string
    sku: string
    brand: string
    category: string
    priceB2c: number
    costPrice: number | null
    oldPrice: number | null
    vatRate: number
    vatCode: string
    description: string
    slug: string
    imageUrl: string
    barcode: string
    erpId: string
  }

  const transformed: TransformedProduct[] = []
  const parseErrors: { row: number; name: string; error: string }[] = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const name = getName(r)
    if (!name) { skipped++; continue }

    const priceStr = getPrice(r)
    const price = Number(priceStr)
    if (isNaN(price) || price < 0) {
      parseErrors.push({ row: rowNum, name, error: `Nevalidna cena "${priceStr}". Mora biti broj >= 0.` })
      continue
    }

    let sku = getSku(r)
    if (!sku) sku = `IMP-${slugify(name).slice(0, 20)}-${rowNum}`

    let slug = getSlug(r)
    if (!slug) slug = slugify(name)

    const vatRateNum = Number(getVatRate(r)) || 20
    const vatCodeRaw = getVatCode(r)

    const costStr = getCostPrice(r)
    const oldStr = getOldPrice(r)

    transformed.push({
      rowNum, name, sku, slug, erpId: getErpId(r),
      brand: getBrand(r), category: getCategory(r),
      priceB2c: price,
      costPrice: costStr ? Number(costStr) || null : null,
      oldPrice: oldStr ? Number(oldStr) || null : null,
      vatRate: isNaN(vatRateNum) ? 20 : vatRateNum,
      vatCode: vatCodeRaw || (vatRateNum === 10 ? 'R1' : 'R2'),
      description: getDescription(r),
      imageUrl: getImageUrl(r),
      barcode: getBarcode(r),
    })
  }

  // Batch lookup existing products
  const allSkus = transformed.map(t => t.sku)
  const allErpIds = transformed.filter(t => t.erpId).map(t => t.erpId)
  const allSlugs = transformed.map(t => t.slug)

  const [existBySku, existByErp, existSlugs] = await Promise.all([
    allSkus.length > 0 ? prisma.product.findMany({ where: { sku: { in: allSkus } }, select: { id: true, sku: true } }) : [],
    allErpIds.length > 0 ? prisma.product.findMany({ where: { erpId: { in: allErpIds } }, select: { id: true, erpId: true } }) : [],
    allSlugs.length > 0 ? prisma.product.findMany({ where: { slug: { in: allSlugs } }, select: { id: true, slug: true } }) : [],
  ])

  const skuToId = new Map(existBySku.map(p => [p.sku, p.id]))
  const erpToId = new Map(existByErp.filter(p => p.erpId).map(p => [p.erpId!, p.id]))
  const usedSlugs = new Set(existSlugs.map(p => p.slug))
  const usedSkus = new Set(existBySku.map(p => p.sku))

  // Batch check images
  const allExistIds = [...new Set([...skuToId.values(), ...erpToId.values()])]
  const existImgs = allExistIds.length > 0
    ? await prisma.productImage.findMany({ where: { productId: { in: allExistIds } }, select: { productId: true } })
    : []
  const hasImage = new Set(existImgs.map(i => i.productId))

  let created = 0, updated = 0

  for (const t of transformed) {
    try {
      // Resolve brand
      let brandId: string | null = null
      if (t.brand) {
        const key = t.brand.toLowerCase()
        brandId = brandMap.get(key) || null
        // Case-insensitive search
        if (!brandId) {
          for (const [k, v] of brandMap) {
            if (k === key || k.includes(key) || key.includes(k)) { brandId = v; break }
          }
        }
        if (!brandId) {
          if (newBrands.has(key)) {
            brandId = newBrands.get(key)!
          } else {
            const brand = await prisma.brand.create({ data: { name: t.brand, slug: slugify(t.brand) || `brand-${Date.now().toString(36)}` } })
            brandId = brand.id
            brandMap.set(key, brandId)
            newBrands.set(key, brandId)
          }
        }
      }

      // Resolve category
      let categoryId: string | null = null
      if (t.category) {
        const key = t.category.toLowerCase()
        categoryId = categoryMap.get(key) || null
        if (!categoryId) {
          for (const [k, v] of categoryMap) {
            if (k === key || k.includes(key) || key.includes(k)) { categoryId = v; break }
          }
        }
        if (!categoryId) {
          if (newCategories.has(key)) {
            categoryId = newCategories.get(key)!
          } else {
            const cat = await prisma.category.create({ data: { nameLat: t.category, slug: slugify(t.category) || `cat-${Date.now().toString(36)}` } })
            categoryId = cat.id
            categoryMap.set(key, categoryId)
            newCategories.set(key, categoryId)
          }
        }
      }

      // Find existing
      const existingId = skuToId.get(t.sku) || (t.erpId ? erpToId.get(t.erpId) : undefined)

      if (existingId) {
        await prisma.product.update({
          where: { id: existingId },
          data: {
            nameLat: t.name, priceB2c: t.priceB2c, costPrice: t.costPrice ?? undefined,
            oldPrice: t.oldPrice ?? undefined, description: t.description || undefined,
            brandId: brandId || undefined, categoryId: categoryId || undefined,
            barcode: t.barcode || undefined, vatRate: t.vatRate,
            vatCode: t.vatCode || undefined, erpId: t.erpId || undefined, isActive: true,
          },
        })
        if (t.imageUrl && !hasImage.has(existingId)) {
          await prisma.productImage.create({ data: { productId: existingId, url: t.imageUrl, altText: t.name, isPrimary: true, sortOrder: 0 } })
          hasImage.add(existingId)
        }
        updated++
      } else {
        // Unique slug & sku
        let finalSlug = t.slug
        while (usedSlugs.has(finalSlug)) { finalSlug = `${t.slug}-${Math.random().toString(36).slice(2, 7)}` }
        usedSlugs.add(finalSlug)

        let finalSku = t.sku
        while (usedSkus.has(finalSku)) { finalSku = `${t.sku}-${Math.random().toString(36).slice(2, 7)}` }
        usedSkus.add(finalSku)

        const product = await prisma.product.create({
          data: {
            sku: finalSku, nameLat: t.name, slug: finalSlug, priceB2c: t.priceB2c,
            costPrice: t.costPrice, oldPrice: t.oldPrice, description: t.description || null,
            brandId, categoryId, barcode: t.barcode || null, vatRate: t.vatRate,
            vatCode: t.vatCode || null, erpId: t.erpId || null, isActive: true,
          },
        })
        skuToId.set(finalSku, product.id)
        if (t.erpId) erpToId.set(t.erpId, product.id)

        if (t.imageUrl) {
          await prisma.productImage.create({ data: { productId: product.id, url: t.imageUrl, altText: t.name, isPrimary: true, sortOrder: 0 } })
        }
        created++
      }
    } catch (err) {
      let msg = (err as Error).message
      if (msg.includes('Unique constraint')) msg = 'Duplikat šifre ili slug-a'
      else if (msg.length > 150) msg = msg.slice(0, 150) + '...'
      parseErrors.push({ row: t.rowNum, name: t.name, error: msg })
    }
  }

  return { created, updated, skipped, errors: parseErrors, newBrands: [...newBrands.keys()], newCategories: [...newCategories.keys()] }
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3: IMPORT BARCODES (tHE_SetItemExtItemSubj)
   ═══════════════════════════════════════════════════════════════ */

interface BarcodeResult {
  updated: number
  skipped: number
  errors: { row: number; error: string }[]
}

async function importBarcodes(rows: Record<string, unknown>[]): Promise<BarcodeResult> {
  let updated = 0, skipped = 0
  const errors: { row: number; error: string }[] = []

  // Collect all product erpIds from barcodes for batch lookup
  const erpIds = rows.map(r => cleanId(col(r, 'acIdent'))).filter(Boolean)
  const products = erpIds.length > 0
    ? await prisma.product.findMany({ where: { erpId: { in: erpIds } }, select: { id: true, erpId: true } })
    : []
  const erpToId = new Map(products.filter(p => p.erpId).map(p => [p.erpId!, p.id]))

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const erpId = cleanId(col(r, 'acIdent'))
    const barcode = cleanId(col(r, 'acCode'))
    const type = col(r, 'acType').toUpperCase()

    if (!erpId || !barcode) { skipped++; continue }
    if (type && type !== 'P') { skipped++; continue } // Only product barcodes

    const productId = erpToId.get(erpId)
    if (!productId) { skipped++; continue } // Product not in our DB

    try {
      await prisma.product.update({
        where: { id: productId },
        data: { barcode },
      })
      updated++
    } catch (err) {
      errors.push({ row: i + 2, error: `erpId ${erpId}: ${(err as Error).message.slice(0, 100)}` })
    }
  }

  return { updated, skipped, errors }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HANDLER — Multi-file import
   ═══════════════════════════════════════════════════════════════ */

interface FileInfo {
  name: string
  type: PantheonFileType
  label: string
  rows: number
}

export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  // Fallback: also check single-file field for backward compatibility
  if (files.length === 0) {
    const single = formData.get('file') as File | null
    if (single) files.push(single)
  }

  if (files.length === 0) {
    return errorResponse('Nijedan fajl nije prosleđen. Izaberite jedan ili više fajlova.', 400)
  }

  // Validate all files first
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      return errorResponse(`Fajl "${file.name}" je prevelik. Maksimalno 10MB po fajlu.`, 400)
    }
    const ext = file.name.toLowerCase().split('.').pop()
    if (!['csv', 'xlsx', 'xls', 'txt'].includes(ext || '')) {
      return errorResponse(`Fajl "${file.name}" ima nepodržan format (.${ext}). Koristite .csv, .xlsx ili .xls`, 400)
    }
  }

  // Parse all files and detect types
  const parsedFiles: { file: File; type: PantheonFileType; headers: string[]; rows: Record<string, unknown>[] }[] = []

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer()
      const { headers, rows } = parseFile(buffer, file.name)
      if (rows.length === 0) {
        return errorResponse(`Fajl "${file.name}" ne sadrži podatke.`, 400)
      }
      if (rows.length > 10000) {
        return errorResponse(`Fajl "${file.name}" ima ${rows.length} redova. Maksimalno 10.000.`, 400)
      }
      const type = detectFileType(headers)
      if (type === 'unknown') {
        return errorResponse(
          `Fajl "${file.name}" — nije prepoznat format.\n\n` +
          `Pronađene kolone: ${headers.slice(0, 15).join(', ')}${headers.length > 15 ? '...' : ''}\n\n` +
          `Podržani formati:\n` +
          `• Proizvodi: acIdent, acName, anSalePrice\n` +
          `• Kategorije: acClassif, acName, acType\n` +
          `• Barkodovi: acIdent, acCode\n` +
          `• Alta Moda CSV: name, brand, category, current_price_rsd`,
          400
        )
      }
      parsedFiles.push({ file, type, headers, rows })
    } catch (err) {
      return errorResponse(`Greška pri čitanju "${file.name}": ${(err as Error).message}`, 400)
    }
  }

  // Sort by processing order: categories → products → barcodes
  const ORDER: Record<PantheonFileType, number> = { categories: 1, products: 2, altamoda_csv: 2, barcodes: 3, unknown: 9 }
  parsedFiles.sort((a, b) => ORDER[a.type] - ORDER[b.type])

  // Pre-load brands and categories (shared across all file imports)
  const allBrands = await prisma.brand.findMany({ select: { id: true, name: true } })
  const allCats = await prisma.category.findMany({ select: { id: true, nameLat: true } })
  const brandMap = new Map(allBrands.map(b => [b.name.toLowerCase(), b.id]))
  const categoryMap = new Map(allCats.map(c => [c.nameLat.toLowerCase(), c.id]))

  // Process each file in order
  const fileResults: {
    fileName: string
    fileType: string
    fileLabel: string
    rows: number
    created: number
    updated: number
    skipped: number
    errors: { row: number; name?: string; error: string }[]
    newBrands?: string[]
    newCategories?: string[]
  }[] = []

  const detectedFiles: FileInfo[] = parsedFiles.map(f => ({
    name: f.file.name,
    type: f.type,
    label: FILE_TYPE_LABELS[f.type],
    rows: f.rows.length,
  }))

  for (const pf of parsedFiles) {
    if (pf.type === 'categories') {
      const result = await importCategories(pf.rows, brandMap, categoryMap)
      fileResults.push({
        fileName: pf.file.name, fileType: pf.type, fileLabel: FILE_TYPE_LABELS[pf.type],
        rows: pf.rows.length, ...result, newBrands: [], newCategories: [],
      })
    } else if (pf.type === 'products' || pf.type === 'altamoda_csv') {
      const result = await importProducts(pf.rows, pf.type, brandMap, categoryMap)
      fileResults.push({
        fileName: pf.file.name, fileType: pf.type, fileLabel: FILE_TYPE_LABELS[pf.type],
        rows: pf.rows.length, ...result,
      })
    } else if (pf.type === 'barcodes') {
      const result = await importBarcodes(pf.rows)
      fileResults.push({
        fileName: pf.file.name, fileType: pf.type, fileLabel: FILE_TYPE_LABELS[pf.type],
        rows: pf.rows.length, created: 0, ...result,
      })
    }
  }

  // Aggregate totals
  const totals = {
    created: fileResults.reduce((s, r) => s + r.created, 0),
    updated: fileResults.reduce((s, r) => s + r.updated, 0),
    skipped: fileResults.reduce((s, r) => s + r.skipped, 0),
    errors: fileResults.reduce((s, r) => s + r.errors.length, 0),
  }

  return successResponse({
    files: detectedFiles,
    results: fileResults,
    totals,
  })
})
