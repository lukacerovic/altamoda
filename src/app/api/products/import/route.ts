import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'

interface CsvRow {
  sku: string
  name: string
  brand?: string
  category?: string
  priceB2c: string
  priceB2b?: string
  oldPrice?: string
  stock?: string
  description?: string
  isProfessional?: string
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row as unknown as CsvRow)
  }

  return rows
}

// POST /api/products/import — CSV import
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return errorResponse('CSV fajl nije prosleđen', 400)

  const text = await file.text()
  const rows = parseCsv(text)

  if (rows.length === 0) return errorResponse('CSV fajl je prazan ili ima neispravan format', 400)

  let created = 0
  let updated = 0
  const errors: { row: number; sku: string; error: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (!row.sku || !row.name || !row.priceB2c) {
      errors.push({ row: i + 2, sku: row.sku || '', error: 'Nedostaju obavezna polja (sku, name, priceB2c)' })
      continue
    }

    const price = Number(row.priceB2c)
    if (isNaN(price) || price <= 0) {
      errors.push({ row: i + 2, sku: row.sku, error: 'Nevalidna cena' })
      continue
    }

    try {
      // Find brand by name
      let brandId: string | null = null
      if (row.brand) {
        const brand = await prisma.brand.findFirst({
          where: { name: { contains: row.brand, mode: 'insensitive' } },
        })
        brandId = brand?.id || null
      }

      // Find category by name
      let categoryId: string | null = null
      if (row.category) {
        const category = await prisma.category.findFirst({
          where: { nameLat: { contains: row.category, mode: 'insensitive' } },
        })
        categoryId = category?.id || null
      }

      const existing = await prisma.product.findUnique({ where: { sku: row.sku } })

      if (existing) {
        await prisma.product.update({
          where: { sku: row.sku },
          data: {
            nameLat: row.name,
            priceB2c: price,
            priceB2b: row.priceB2b ? Number(row.priceB2b) : undefined,
            oldPrice: row.oldPrice ? Number(row.oldPrice) : undefined,
            stockQuantity: row.stock ? Number(row.stock) : undefined,
            description: row.description || undefined,
            brandId: brandId || undefined,
            categoryId: categoryId || undefined,
            isProfessional: row.isProfessional === 'true' || row.isProfessional === '1',
          },
        })
        updated++
      } else {
        const slug = slugify(row.name)
        const existingSlug = await prisma.product.findUnique({ where: { slug } })
        const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug

        await prisma.product.create({
          data: {
            sku: row.sku,
            nameLat: row.name,
            slug: finalSlug,
            priceB2c: price,
            priceB2b: row.priceB2b ? Number(row.priceB2b) : null,
            oldPrice: row.oldPrice ? Number(row.oldPrice) : null,
            stockQuantity: row.stock ? Number(row.stock) : 0,
            description: row.description,
            brandId,
            categoryId,
            isProfessional: row.isProfessional === 'true' || row.isProfessional === '1',
          },
        })
        created++
      }
    } catch (err) {
      errors.push({ row: i + 2, sku: row.sku, error: (err as Error).message })
    }
  }

  return successResponse({ created, updated, errors, total: rows.length })
})
