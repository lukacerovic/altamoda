import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as fs from 'fs'
import * as path from 'path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// ==================== CSV PARSER ====================

interface CsvProduct {
  id: string
  name: string
  brand: string
  category: string
  volume_size: string
  current_price_rsd: string
  original_price_rsd: string
  url_slug: string
  image_url: string
}

function parseCsv(filePath: string): CsvProduct[] {
  const text = fs.readFileSync(filePath, 'utf-8')
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = parseRow(lines[0])
  const rows: CsvProduct[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row as unknown as CsvProduct)
  }

  return rows
}

function parseRow(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// ==================== VOLUME PARSER ====================

function parseVolume(volumeStr: string): { volumeMl: number | null; weightGrams: number | null } {
  if (!volumeStr) return { volumeMl: null, weightGrams: null }

  const str = volumeStr.toLowerCase().trim()

  // Handle sets like "300ml + 300ml + 150ml"
  if (str.includes('+')) {
    const parts = str.split('+')
    let totalMl = 0
    for (const part of parts) {
      const match = part.trim().match(/(\d+)\s*ml/)
      if (match) totalMl += parseInt(match[1])
    }
    return { volumeMl: totalMl > 0 ? totalMl : null, weightGrams: null }
  }

  // Handle multi-unit like "10x6ml" or "12x7ml" or "6x15ml"
  const multiMatch = str.match(/(\d+)\s*x\s*(\d+)\s*ml/)
  if (multiMatch) {
    return { volumeMl: parseInt(multiMatch[1]) * parseInt(multiMatch[2]), weightGrams: null }
  }

  // Handle simple ml
  const mlMatch = str.match(/(\d+)\s*ml/)
  if (mlMatch) {
    return { volumeMl: parseInt(mlMatch[1]), weightGrams: null }
  }

  // Handle grams
  const gMatch = str.match(/(\d+)\s*g/)
  if (gMatch) {
    return { volumeMl: null, weightGrams: parseInt(gMatch[1]) }
  }

  // Handle sizes like "55mm", "5.75''", "Large" etc - tools/brushes
  return { volumeMl: null, weightGrams: null }
}

// ==================== CATEGORY MAPPING ====================

const categoryMap: Record<string, { name: string; parent: string }> = {
  'Shampoo':          { name: 'Šamponi',               parent: 'nega' },
  'Conditioner':      { name: 'Regeneratori',           parent: 'nega' },
  'Masks':            { name: 'Maske',                  parent: 'nega' },
  'Oils':             { name: 'Ulja',                   parent: 'nega' },
  'Oils/Serums':      { name: 'Ulja i serumi',          parent: 'nega' },
  'Serum':            { name: 'Serumi',                  parent: 'nega' },
  'Treatment':        { name: 'Tretmani',               parent: 'nega' },
  'Leave-in':         { name: 'Leave-in',               parent: 'nega' },
  'Spray':            { name: 'Sprejevi',               parent: 'nega' },
  'Hair Care':        { name: 'Nega kose',              parent: 'nega' },
  'Color Care':       { name: 'Nega boje',              parent: 'nega' },
  'Care':             { name: 'Nega kose',              parent: 'nega' },
  'Styling':          { name: 'Stajling',               parent: 'styling' },
  'Styling (Men)':    { name: 'Muški stajling',         parent: 'styling' },
  "Men's Care":       { name: 'Muška nega',             parent: 'nega' },
  'Hair Care (Men)':  { name: 'Muška nega kose',        parent: 'nega' },
  'Color':            { name: 'Boje za kosu',           parent: 'kolor' },
  'Brushes':          { name: 'Četke',                  parent: 'pribor' },
  'Scissors':         { name: 'Makaze',                 parent: 'pribor' },
  'Combs':            { name: 'Češljevi',               parent: 'pribor' },
  'Tools':            { name: 'Alat i pribor',          parent: 'pribor' },
  'Accessories':      { name: 'Dodaci',                 parent: 'pribor' },
  'Hair Tools':       { name: 'Aparati za kosu',        parent: 'aparati' },
  'Training Tools':   { name: 'Trening oprema',         parent: 'pribor' },
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/[š]/g, 's')
    .replace(/[ž]/g, 'z')
    .replace(/[đ]/g, 'dj')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ==================== MAIN ====================

async function main() {
  console.log('🚀 Starting Alta Moda product migration...\n')

  const csvPath = path.resolve(__dirname, '../altamoda_products.csv')
  const products = parseCsv(csvPath)
  console.log(`📄 Loaded ${products.length} products from CSV\n`)

  // ==================== STEP 1: BRANDS ====================
  console.log('📦 Step 1: Seeding brands...')

  const brandData: Record<string, { name: string; description: string }> = {
    'Redken':        { name: 'Redken',        description: 'Profesionalna nega i stajling za kosu' },
    'Matrix':        { name: 'Matrix',        description: 'Profesionalna frizerska kozmetika' },
    'Framesi':       { name: 'Framesi',       description: 'Italijanska profesionalna kozmetika za kosu' },
    'Biolage':       { name: 'Biolage',       description: 'Prirodna nega kose inspirisana prirodom' },
    'Olivia Garden': { name: 'Olivia Garden', description: 'Profesionalni alat i četke za frizere' },
    'Elchim':        { name: 'Elchim',        description: 'Italijanski profesionalni fenovi i aparati' },
    "L'image":       { name: "L'image",       description: 'Trening oprema za frizere' },
  }

  const brandIdMap = new Map<string, string>()

  for (const [key, data] of Object.entries(brandData)) {
    const brandSlug = slugify(data.name)
    const brand = await prisma.brand.upsert({
      where: { slug: brandSlug },
      update: { name: data.name, description: data.description },
      create: {
        name: data.name,
        slug: brandSlug,
        description: data.description,
        isActive: true,
      },
    })
    brandIdMap.set(key, brand.id)
  }

  console.log(`   ✅ ${brandIdMap.size} brands ready\n`)

  // ==================== STEP 2: CATEGORIES ====================
  console.log('📂 Step 2: Seeding categories...')

  // Root categories
  const rootCategories: Record<string, { name: string; sortOrder: number }> = {
    'nega':    { name: 'Nega',    sortOrder: 1 },
    'styling': { name: 'Styling', sortOrder: 2 },
    'kolor':   { name: 'Kolor',   sortOrder: 3 },
    'pribor':  { name: 'Pribor',  sortOrder: 4 },
    'aparati': { name: 'Aparati', sortOrder: 5 },
  }

  const rootCatIds = new Map<string, string>()

  for (const [key, data] of Object.entries(rootCategories)) {
    const cat = await prisma.category.upsert({
      where: { slug: key },
      update: {},
      create: {
        nameLat: data.name,
        slug: key,
        sortOrder: data.sortOrder,
        depth: 0,
        isActive: true,
      },
    })
    rootCatIds.set(key, cat.id)
  }

  // Sub categories from the mapping
  const categoryIdMap = new Map<string, string>()
  const seenSubSlugs = new Set<string>()
  let subSort = 1

  for (const [csvCat, mapping] of Object.entries(categoryMap)) {
    const subSlug = slugify(mapping.name)
    if (seenSubSlugs.has(subSlug)) {
      // Already created, just map the CSV category name
      const existing = await prisma.category.findUnique({ where: { slug: subSlug } })
      if (existing) categoryIdMap.set(csvCat, existing.id)
      continue
    }
    seenSubSlugs.add(subSlug)

    const parentId = rootCatIds.get(mapping.parent)
    const cat = await prisma.category.upsert({
      where: { slug: subSlug },
      update: {},
      create: {
        nameLat: mapping.name,
        slug: subSlug,
        parentId: parentId || null,
        sortOrder: subSort++,
        depth: 1,
        isActive: true,
      },
    })
    categoryIdMap.set(csvCat, cat.id)
  }

  // Ensure all CSV categories that share the same sub-slug point to the right ID
  for (const [csvCat, mapping] of Object.entries(categoryMap)) {
    if (!categoryIdMap.has(csvCat)) {
      const subSlug = slugify(mapping.name)
      const existing = await prisma.category.findUnique({ where: { slug: subSlug } })
      if (existing) categoryIdMap.set(csvCat, existing.id)
    }
  }

  console.log(`   ✅ ${rootCatIds.size} root + ${seenSubSlugs.size} sub categories ready\n`)

  // ==================== STEP 3: PRODUCTS + IMAGES ====================
  console.log('🛍️  Step 3: Importing products...')

  let created = 0
  let updated = 0
  let imageCount = 0
  const errors: { row: number; name: string; error: string }[] = []

  for (let i = 0; i < products.length; i++) {
    const row = products[i]

    try {
      const price = Number(row.current_price_rsd)
      if (!price || isNaN(price)) {
        // Color products with no price - set to 0 and mark professional
        if (!row.current_price_rsd) {
          // skip price validation for color products
        } else {
          errors.push({ row: i + 2, name: row.name, error: 'Invalid price' })
          continue
        }
      }

      const brandId = brandIdMap.get(row.brand) || null
      const categoryId = categoryIdMap.get(row.category) || null
      const sku = row.url_slug // Use slug as SKU (unique per product)
      const slug = row.url_slug
      const { volumeMl, weightGrams } = parseVolume(row.volume_size)
      const oldPrice = row.original_price_rsd ? Number(row.original_price_rsd) : null
      const finalPrice = price || 0

      // Determine flags
      const isProfessional = row.category === 'Color' || row.category === 'Hair Tools'
      const isNew = i < 14 // First 14 products are from newest additions on the site

      // Check if product exists by SKU
      const existing = await prisma.product.findUnique({ where: { sku } })

      if (existing) {
        await prisma.product.update({
          where: { sku },
          data: {
            nameLat: row.name,
            priceB2c: finalPrice,
            oldPrice,
            brandId,
            categoryId,
            volumeMl,
            weightGrams,
            isProfessional,
            isActive: true,
          },
        })
        updated++

        // Update primary image
        if (row.image_url) {
          const existingImage = await prisma.productImage.findFirst({
            where: { productId: existing.id, isPrimary: true },
          })
          if (existingImage) {
            await prisma.productImage.update({
              where: { id: existingImage.id },
              data: { url: row.image_url, altText: row.name },
            })
          } else {
            await prisma.productImage.create({
              data: {
                productId: existing.id,
                url: row.image_url,
                altText: row.name,
                type: 'image',
                sortOrder: 0,
                isPrimary: true,
              },
            })
          }
          imageCount++
        }
      } else {
        // Check slug uniqueness
        const existingSlug = await prisma.product.findUnique({ where: { slug } })
        const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug

        const product = await prisma.product.create({
          data: {
            sku,
            nameLat: row.name,
            slug: finalSlug,
            brandId,
            categoryId,
            priceB2c: finalPrice,
            oldPrice,
            volumeMl,
            weightGrams,
            stockQuantity: 50, // Default stock
            lowStockThreshold: 5,
            isProfessional,
            isActive: true,
            isNew,
            isFeatured: false,
            isBestseller: false,
          },
        })
        created++

        // Create primary image
        if (row.image_url) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              url: row.image_url,
              altText: row.name,
              type: 'image',
              sortOrder: 0,
              isPrimary: true,
            },
          })
          imageCount++
        }
      }

      // Progress logging every 50 products
      if ((i + 1) % 50 === 0) {
        console.log(`   ... processed ${i + 1}/${products.length}`)
      }
    } catch (err) {
      errors.push({ row: i + 2, name: row.name, error: (err as Error).message })
    }
  }

  // ==================== RESULTS ====================
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Results')
  console.log('='.repeat(50))
  console.log(`   Total CSV rows:     ${products.length}`)
  console.log(`   Products created:   ${created}`)
  console.log(`   Products updated:   ${updated}`)
  console.log(`   Images created:     ${imageCount}`)
  console.log(`   Errors:             ${errors.length}`)

  if (errors.length > 0) {
    console.log('\n⚠️  Errors:')
    for (const err of errors) {
      console.log(`   Row ${err.row}: ${err.name} — ${err.error}`)
    }
  }

  console.log('\n✅ Migration complete!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
