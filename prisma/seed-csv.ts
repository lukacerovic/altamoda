import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { readFileSync } from 'fs'
import { join } from 'path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',')
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx] || ''
    })
    rows.push(row)
  }
  return rows
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['é]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  console.log('🌱 Importing products from CSV...')

  const csv = readFileSync(join(__dirname, '..', 'altamoda_products.csv'), 'utf-8')
  const rows = parseCSV(csv)

  // Collect unique brands and categories
  const brandNames = [...new Set(rows.map(r => r.brand).filter(Boolean))]
  const categoryNames = [...new Set(rows.map(r => r.category).filter(Boolean))]

  // Upsert brands
  const brandMap: Record<string, string> = {}
  for (const name of brandNames) {
    const slug = slugify(name)
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })
    brandMap[name] = brand.id
  }
  console.log(`✅ ${brandNames.length} brands upserted`)

  // Upsert categories
  const categoryMap: Record<string, string> = {}
  for (const name of categoryNames) {
    const slug = slugify(name)
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { nameLat: name, slug },
    })
    categoryMap[name] = category.id
  }
  console.log(`✅ ${categoryNames.length} categories upserted`)

  // Upsert products
  let created = 0
  let skipped = 0
  for (const row of rows) {
    const slug = row.url_slug
    if (!slug) {
      skipped++
      continue
    }

    const priceB2c = row.current_price_rsd ? parseFloat(row.current_price_rsd) : 0
    const oldPrice = row.original_price_rsd ? parseFloat(row.original_price_rsd) : null
    const sku = slug // use slug as SKU since CSV doesn't have one

    try {
      const product = await prisma.product.upsert({
        where: { slug },
        update: {
          nameLat: row.name,
          priceB2c,
          oldPrice,
          brandId: row.brand ? brandMap[row.brand] : null,
          categoryId: row.category ? categoryMap[row.category] : null,
          volumeMl: parseVolume(row.volume_size),
          isActive: true,
        },
        create: {
          sku,
          nameLat: row.name,
          slug,
          priceB2c: priceB2c || 0,
          oldPrice,
          brandId: row.brand ? brandMap[row.brand] : null,
          categoryId: row.category ? categoryMap[row.category] : null,
          volumeMl: parseVolume(row.volume_size),
          description: row.volume_size || null,
          isActive: true,
        },
      })

      // Ensure product has an image — create one if missing
      if (row.image_url) {
        const existingImage = await prisma.productImage.findFirst({
          where: { productId: product.id },
        })
        if (!existingImage) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              url: row.image_url,
              altText: row.name,
              isPrimary: true,
              sortOrder: 0,
            },
          })
        }
      }

      created++
    } catch (e: any) {
      console.error(`⚠ Failed to upsert "${row.name}" (${slug}): ${e.message}`)
      skipped++
    }
  }

  console.log(`✅ ${created} products imported, ${skipped} skipped`)
}

function parseVolume(vol: string): number | null {
  if (!vol) return null
  // Extract first number followed by ml
  const match = vol.match(/(\d+)\s*ml/i)
  return match ? parseInt(match[1]) : null
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
