import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'
import * as XLSX from 'xlsx'

/* ─── Column mapping profiles ─── */

/** Our standard CSV format (altamoda_products.csv) */
const ALTAMODA_CSV_COLUMNS = {
  name: ['name', 'naziv'],
  sku: ['sku', 'sifra', 'šifra', 'id'],
  brand: ['brand', 'brend'],
  category: ['category', 'kategorija'],
  priceB2c: ['priceb2c', 'price', 'cena', 'current_price_rsd', 'maloprodajna_cena'],
  priceB2b: ['priceb2b', 'veleprodajna_cena'],
  oldPrice: ['oldprice', 'old_price', 'original_price_rsd', 'stara_cena'],
  costPrice: ['costprice', 'cost_price', 'nabavna_cena'],
  stock: ['stock', 'zalihe', 'kolicina', 'količina'],
  description: ['description', 'opis', 'volume_size'],
  isProfessional: ['isprofessional', 'profesionalni', 'pro'],
  barcode: ['barcode', 'barkod', 'ean'],
  vatRate: ['vatrate', 'vat_rate', 'pdv', 'pdv_stopa'],
  imageUrl: ['image_url', 'slika', 'image'],
  slug: ['url_slug', 'slug'],
  erpId: ['erpid', 'erp_id', 'pantheon_id', 'acident'],
}

/** Pantheon the_setItem export format */
const PANTHEON_COLUMNS = {
  name: ['acname'],
  sku: ['acident'],
  brand: ['acclassif', 'acfieldsc'],
  category: ['acclassif2'],
  priceB2c: ['ansaleprice'],
  costPrice: ['anbuyprice'],
  vatRate: ['anvat'],
  vatCode: ['acvatcode'],
  barcode: ['accode'],
  isActive: ['acactive'],
  webshopVisible: ['acwebshopitem'],
  description: ['acfieldse', 'acfieldsb'],
  erpId: ['acident'],
}

type ColumnProfile = 'altamoda' | 'pantheon' | 'unknown'

interface ParsedRow {
  name: string
  sku: string
  brand: string
  category: string
  priceB2c: number
  priceB2b: number | null
  oldPrice: number | null
  costPrice: number | null
  stock: number
  description: string
  isProfessional: boolean
  barcode: string
  vatRate: number
  vatCode: string
  imageUrl: string
  slug: string
  erpId: string
  isActive: boolean
}

/** Detect which column profile the file uses */
function detectProfile(headers: string[]): { profile: ColumnProfile; mapped: Record<string, string> } {
  const lower = headers.map(h => h.toLowerCase().trim())

  // Check for Pantheon-specific columns
  const pantheonHits = lower.filter(h => ['acname', 'acident', 'ansaleprice', 'acclassif', 'acactive'].includes(h))
  if (pantheonHits.length >= 3) {
    const mapped = mapColumns(lower, headers, PANTHEON_COLUMNS)
    return { profile: 'pantheon', mapped }
  }

  // Check for our CSV format
  const altamodaHits = lower.filter(h =>
    ['name', 'brand', 'category', 'current_price_rsd', 'url_slug', 'image_url', 'sku', 'priceb2c', 'price'].includes(h)
  )
  if (altamodaHits.length >= 2) {
    const mapped = mapColumns(lower, headers, ALTAMODA_CSV_COLUMNS)
    return { profile: 'altamoda', mapped }
  }

  return { profile: 'unknown', mapped: {} }
}

/** Map actual column headers to our field names */
function mapColumns(
  lowerHeaders: string[],
  originalHeaders: string[],
  profile: Record<string, string[]>
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [field, aliases] of Object.entries(profile)) {
    const idx = lowerHeaders.findIndex(h => aliases.includes(h))
    if (idx !== -1) {
      result[field] = originalHeaders[idx]
    }
  }
  return result
}

/** Get value from a raw row using the column mapping */
function getVal(row: Record<string, unknown>, mapped: Record<string, string>, field: string): string {
  const col = mapped[field]
  if (!col) return ''
  const val = row[col]
  if (val == null) return ''
  return String(val).trim()
}

/** Parse a file (CSV or Excel) into raw rows */
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
    const headers = Object.keys(json[0])
    return { headers, rows: json }
  }

  throw new Error(`Nepodržan format fajla: .${ext}. Koristite .csv, .xlsx ili .xls`)
}

function parseCsvText(text: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const lines = text.trim().replace(/\r\n/g, '\n').split('\n')
  if (lines.length < 2) throw new Error('CSV fajl mora imati zaglavlje i bar jedan red podataka')

  const headers = parseCsvLine(lines[0])
  const rows: Record<string, unknown>[] = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCsvLine(lines[i])
    const row: Record<string, unknown> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
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
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current.trim())
  return fields
}

/** Transform a raw row into our standardized ParsedRow */
function transformRow(
  raw: Record<string, unknown>,
  mapped: Record<string, string>,
  profile: ColumnProfile,
  rowNum: number,
): { row: ParsedRow | null; error: string | null } {
  const name = getVal(raw, mapped, 'name')
  if (!name) {
    // Silently skip rows with no name (metadata/empty rows in Pantheon exports)
    return { row: null, error: null }
  }

  const priceStr = getVal(raw, mapped, 'priceB2c')
  const price = Number(priceStr)
  if (isNaN(price) || price < 0) {
    return { row: null, error: `Red ${rowNum}: Nevalidna cena "${priceStr}" za "${name}". Cena mora biti broj >= 0.` }
  }
  // Price 0 is allowed — Pantheon B2B items, unpriced products, items priced via rebates

  // SKU: use provided or generate from name
  let sku = getVal(raw, mapped, 'sku')
  if (profile === 'pantheon' && sku) {
    // Pantheon acIdent is a float — convert to clean string
    sku = String(Math.floor(Number(sku) || 0))
  }
  if (!sku) {
    sku = `IMP-${slugify(name).slice(0, 20)}-${rowNum}`
  }

  // Slug
  let slug = getVal(raw, mapped, 'slug')
  if (!slug) slug = slugify(name)

  // VAT
  const vatRateStr = getVal(raw, mapped, 'vatRate')
  const vatRate = vatRateStr ? Number(vatRateStr) : 20
  const vatCodeRaw = getVal(raw, mapped, 'vatCode')
  const vatCode = vatCodeRaw || (vatRate === 10 ? 'R1' : 'R2')

  // All imported products are active by default — admin can deactivate individually later
  const isActive = true

  // ERP ID
  let erpId = getVal(raw, mapped, 'erpId')
  if (erpId && profile === 'pantheon') {
    erpId = String(Math.floor(Number(erpId) || 0))
  }

  return {
    row: {
      name,
      sku,
      brand: getVal(raw, mapped, 'brand'),
      category: getVal(raw, mapped, 'category'),
      priceB2c: price,
      priceB2b: getVal(raw, mapped, 'priceB2b') ? Number(getVal(raw, mapped, 'priceB2b')) : null,
      oldPrice: getVal(raw, mapped, 'oldPrice') ? Number(getVal(raw, mapped, 'oldPrice')) : null,
      costPrice: getVal(raw, mapped, 'costPrice') ? Number(getVal(raw, mapped, 'costPrice')) : null,
      stock: Number(getVal(raw, mapped, 'stock')) || 0,
      description: getVal(raw, mapped, 'description'),
      isProfessional: ['true', '1', 'da'].includes(getVal(raw, mapped, 'isProfessional').toLowerCase()),
      barcode: getVal(raw, mapped, 'barcode'),
      vatRate: isNaN(vatRate) ? 20 : vatRate,
      vatCode,
      imageUrl: getVal(raw, mapped, 'imageUrl'),
      slug,
      erpId,
      isActive,
    },
    error: null,
  }
}

// ─── POST /api/products/import ───

export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return errorResponse('Fajl nije prosleđen. Izaberite CSV ili Excel fajl.', 400)
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return errorResponse('Fajl je prevelik. Maksimalna veličina je 10MB.', 400)
  }

  // Validate file extension
  const ext = file.name.toLowerCase().split('.').pop()
  if (!['csv', 'xlsx', 'xls', 'txt'].includes(ext || '')) {
    return errorResponse(
      `Nepodržan format fajla: .${ext}. Dozvoljeni formati su: .csv, .xlsx, .xls`,
      400
    )
  }

  // Parse file
  let headers: string[]
  let rawRows: Record<string, unknown>[]
  try {
    const buffer = await file.arrayBuffer()
    const result = parseFile(buffer, file.name)
    headers = result.headers
    rawRows = result.rows
  } catch (err) {
    return errorResponse(`Greška pri čitanju fajla: ${(err as Error).message}`, 400)
  }

  if (rawRows.length === 0) {
    return errorResponse('Fajl ne sadrži podatke. Proverite da li ima zaglavlje i bar jedan red.', 400)
  }

  if (rawRows.length > 10000) {
    return errorResponse(`Fajl sadrži ${rawRows.length} redova. Maksimalno je 10.000 po importu.`, 400)
  }

  // Detect column profile
  const { profile, mapped } = detectProfile(headers)

  if (profile === 'unknown') {
    return errorResponse(
      `Nije prepoznat format kolona u fajlu.\n\n` +
      `Pronađene kolone: ${headers.join(', ')}\n\n` +
      `Očekivane kolone za Alta Moda format: name, brand, category, current_price_rsd (ili priceB2c), url_slug, image_url\n\n` +
      `Očekivane kolone za Pantheon format: acName, acIdent, anSalePrice, acClassif, acActive`,
      400
    )
  }

  // Check required columns are mapped
  if (!mapped['name']) {
    return errorResponse(
      `Kolona za naziv proizvoda nije pronađena.\n` +
      `Pronađene kolone: ${headers.join(', ')}\n` +
      `Očekivana kolona: "name", "naziv" ili "acName"`,
      400
    )
  }
  if (!mapped['priceB2c']) {
    return errorResponse(
      `Kolona za cenu nije pronađena.\n` +
      `Pronađene kolone: ${headers.join(', ')}\n` +
      `Očekivana kolona: "priceB2c", "current_price_rsd", "cena" ili "anSalePrice"`,
      400
    )
  }

  // Batch load brands and categories
  const allBrands = await prisma.brand.findMany({ select: { id: true, name: true, slug: true } })
  const allCategories = await prisma.category.findMany({ select: { id: true, nameLat: true, slug: true } })
  const brandMap = new Map(allBrands.map(b => [b.name.toLowerCase(), b.id]))
  const categoryMap = new Map(allCategories.map(c => [c.nameLat.toLowerCase(), c.id]))

  // Track new brands/categories to create
  const newBrands = new Map<string, string>()
  const newCategories = new Map<string, string>()

  let created = 0
  let updated = 0
  let skipped = 0
  const errors: { row: number; name: string; error: string }[] = []

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2 // +2 for 1-indexed + header row
    const { row, error } = transformRow(rawRows[i], mapped, profile, rowNum)

    if (!row && !error) {
      // Silently skipped row (e.g. empty name)
      skipped++
      continue
    }
    if (error || !row) {
      errors.push({ row: rowNum, name: '', error: error || 'Nepoznata greška' })
      continue
    }

    // Skip products without a name (empty/metadata rows)
    if (!row.name.trim()) {
      skipped++
      continue
    }

    try {
      // Resolve brand — create if new
      let brandId: string | null = null
      if (row.brand) {
        const key = row.brand.toLowerCase()
        brandId = brandMap.get(key) || null
        if (!brandId) {
          // Fuzzy match
          brandId = [...brandMap.entries()].find(([k]) => k.includes(key) || key.includes(k))?.[1] || null
        }
        if (!brandId) {
          // Create new brand
          if (newBrands.has(key)) {
            brandId = newBrands.get(key)!
          } else {
            const brand = await prisma.brand.create({
              data: { name: row.brand, slug: slugify(row.brand) },
            })
            brandId = brand.id
            brandMap.set(key, brandId)
            newBrands.set(key, brandId)
          }
        }
      }

      // Resolve category — create if new
      let categoryId: string | null = null
      if (row.category) {
        const key = row.category.toLowerCase()
        categoryId = categoryMap.get(key) || null
        if (!categoryId) {
          categoryId = [...categoryMap.entries()].find(([k]) => k.includes(key) || key.includes(k))?.[1] || null
        }
        if (!categoryId) {
          if (newCategories.has(key)) {
            categoryId = newCategories.get(key)!
          } else {
            const cat = await prisma.category.create({
              data: { nameLat: row.category, slug: slugify(row.category) },
            })
            categoryId = cat.id
            categoryMap.set(key, categoryId)
            newCategories.set(key, categoryId)
          }
        }
      }

      // Check for existing product by SKU or erpId
      let existing = await prisma.product.findUnique({ where: { sku: row.sku } })
      if (!existing && row.erpId) {
        existing = await prisma.product.findFirst({ where: { erpId: row.erpId } })
      }

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            nameLat: row.name,
            priceB2c: row.priceB2c,
            priceB2b: row.priceB2b ?? undefined,
            oldPrice: row.oldPrice ?? undefined,
            costPrice: row.costPrice ?? undefined,
            stockQuantity: row.stock || undefined,
            description: row.description || undefined,
            brandId: brandId || undefined,
            categoryId: categoryId || undefined,
            isProfessional: row.isProfessional,
            barcode: row.barcode || undefined,
            vatRate: row.vatRate,
            vatCode: row.vatCode || undefined,
            erpId: row.erpId || undefined,
            isActive: row.isActive,
          },
        })

        // Update image if provided and product has none
        if (row.imageUrl) {
          const hasImage = await prisma.productImage.findFirst({ where: { productId: existing.id } })
          if (!hasImage) {
            await prisma.productImage.create({
              data: {
                productId: existing.id,
                url: row.imageUrl,
                altText: row.name,
                isPrimary: true,
                sortOrder: 0,
              },
            })
          }
        }

        updated++
      } else {
        // Ensure unique slug
        const existingSlug = await prisma.product.findUnique({ where: { slug: row.slug } })
        const finalSlug = existingSlug ? `${row.slug}-${Date.now().toString(36)}` : row.slug

        // Ensure unique SKU
        const existingSku = await prisma.product.findUnique({ where: { sku: row.sku } })
        const finalSku = existingSku ? `${row.sku}-${Date.now().toString(36)}` : row.sku

        const product = await prisma.product.create({
          data: {
            sku: finalSku,
            nameLat: row.name,
            slug: finalSlug,
            priceB2c: row.priceB2c,
            priceB2b: row.priceB2b,
            oldPrice: row.oldPrice,
            costPrice: row.costPrice,
            stockQuantity: row.stock,
            description: row.description || null,
            brandId,
            categoryId,
            isProfessional: row.isProfessional,
            barcode: row.barcode || null,
            vatRate: row.vatRate,
            vatCode: row.vatCode || null,
            erpId: row.erpId || null,
            isActive: row.isActive,
          },
        })

        // Create image if provided
        if (row.imageUrl) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              url: row.imageUrl,
              altText: row.name,
              isPrimary: true,
              sortOrder: 0,
            },
          })
        }

        created++
      }
    } catch (err) {
      const msg = (err as Error).message
      // Make Prisma errors human-readable
      let humanError = msg
      if (msg.includes('Unique constraint')) {
        humanError = `Proizvod sa ovom šifrom ili slug-om već postoji`
      } else if (msg.includes('Foreign key constraint')) {
        humanError = `Referenca na nepostojeći brend ili kategoriju`
      } else if (msg.length > 200) {
        humanError = msg.slice(0, 200) + '...'
      }
      errors.push({ row: rowNum, name: row.name, error: humanError })
    }
  }

  return successResponse({
    profile,
    mappedColumns: mapped,
    created,
    updated,
    skipped,
    errors,
    total: rawRows.length,
    newBrands: [...newBrands.keys()],
    newCategories: [...newCategories.keys()],
  })
})
