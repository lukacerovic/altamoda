import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'altamoda',
  user: 'postgres',
  password: 'klmncar23',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Color palette — realistic professional hair color data
const COLOR_PALETTE = [
  // Naturals (N)
  { level: 1, code: "N", name: "Prirodna", hex: "#0a0a0a", shade: "1.0" },
  { level: 2, code: "N", name: "Prirodna", hex: "#1a1209", shade: "2.0" },
  { level: 3, code: "N", name: "Prirodna", hex: "#2d1f12", shade: "3.0" },
  { level: 4, code: "N", name: "Prirodna", hex: "#45301d", shade: "4.0" },
  { level: 5, code: "N", name: "Prirodna", hex: "#5a3e25", shade: "5.0" },
  { level: 6, code: "N", name: "Prirodna", hex: "#6b4e2e", shade: "6.0" },
  { level: 7, code: "N", name: "Prirodna", hex: "#8a6b34", shade: "7.0" },
  { level: 8, code: "N", name: "Prirodna", hex: "#a8883e", shade: "8.0" },
  { level: 9, code: "N", name: "Prirodna", hex: "#c8ab5c", shade: "9.0" },
  { level: 10, code: "N", name: "Prirodna", hex: "#e8d9a0", shade: "10.0" },
  // Ash (A)
  { level: 4, code: "A", name: "Pepeljasta", hex: "#4a4550", shade: "4.1" },
  { level: 5, code: "A", name: "Pepeljasta", hex: "#5e5868", shade: "5.1" },
  { level: 6, code: "A", name: "Pepeljasta", hex: "#7a7488", shade: "6.1" },
  { level: 7, code: "A", name: "Pepeljasta", hex: "#9690a0", shade: "7.1" },
  { level: 8, code: "A", name: "Pepeljasta", hex: "#b0aab8", shade: "8.1" },
  { level: 9, code: "A", name: "Pepeljasta", hex: "#ccc6d0", shade: "9.1" },
  // Gold (G)
  { level: 5, code: "G", name: "Zlatna", hex: "#7a6020", shade: "5.3" },
  { level: 6, code: "G", name: "Zlatna", hex: "#96782a", shade: "6.3" },
  { level: 7, code: "G", name: "Zlatna", hex: "#b09035", shade: "7.3" },
  { level: 8, code: "G", name: "Zlatna", hex: "#c8a840", shade: "8.3" },
  { level: 9, code: "G", name: "Zlatna", hex: "#dcc050", shade: "9.3" },
  { level: 10, code: "G", name: "Zlatna", hex: "#f0d860", shade: "10.3" },
  // Copper (C)
  { level: 4, code: "C", name: "Bakarna", hex: "#6e3a15", shade: "4.4" },
  { level: 5, code: "C", name: "Bakarna", hex: "#8a4a1a", shade: "5.4" },
  { level: 6, code: "C", name: "Bakarna", hex: "#a55a20", shade: "6.4" },
  { level: 7, code: "C", name: "Bakarna", hex: "#c06a28", shade: "7.4" },
  { level: 8, code: "C", name: "Bakarna", hex: "#d88030", shade: "8.4" },
  // Red (R)
  { level: 4, code: "R", name: "Crvena", hex: "#6a1515", shade: "4.6" },
  { level: 5, code: "R", name: "Crvena", hex: "#851a1a", shade: "5.6" },
  { level: 6, code: "R", name: "Crvena", hex: "#a02020", shade: "6.6" },
  { level: 7, code: "R", name: "Crvena", hex: "#bb2828", shade: "7.6" },
  // Violet (V)
  { level: 4, code: "V", name: "Ljubičasta", hex: "#3d2060", shade: "4.2" },
  { level: 5, code: "V", name: "Ljubičasta", hex: "#502878", shade: "5.2" },
  { level: 6, code: "V", name: "Ljubičasta", hex: "#653090", shade: "6.2" },
  { level: 7, code: "V", name: "Ljubičasta", hex: "#7a38a8", shade: "7.2" },
  // Brown (B)
  { level: 3, code: "B", name: "Braon", hex: "#30200e", shade: "3.7" },
  { level: 4, code: "B", name: "Braon", hex: "#4a3518", shade: "4.7" },
  { level: 5, code: "B", name: "Braon", hex: "#604520", shade: "5.7" },
  { level: 6, code: "B", name: "Braon", hex: "#785528", shade: "6.7" },
  // Matte (M)
  { level: 6, code: "M", name: "Mat", hex: "#5a6a50", shade: "6.8" },
  { level: 7, code: "M", name: "Mat", hex: "#6e8060", shade: "7.8" },
  { level: 8, code: "M", name: "Mat", hex: "#829670", shade: "8.8" },
]

async function main() {
  console.log('Checking existing products...')

  const products = await prisma.product.findMany({
    select: { id: true, nameLat: true, sku: true },
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Found ${products.length} active products`)

  if (products.length === 0) {
    console.log('No products in the database. Creating sample products with colors...')

    // First ensure we have a brand and category
    let brand = await prisma.brand.findFirst({ where: { isActive: true } })
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: "L'Oréal Professionnel", slug: "loreal-professionnel", isActive: true },
      })
      console.log('Created brand:', brand.name)
    }

    let brandSK = await prisma.brand.findFirst({ where: { slug: 'schwarzkopf' } })
    if (!brandSK) {
      brandSK = await prisma.brand.create({
        data: { name: "Schwarzkopf", slug: "schwarzkopf", isActive: true },
      })
      console.log('Created brand:', brandSK.name)
    }

    let brandWella = await prisma.brand.findFirst({ where: { slug: 'wella' } })
    if (!brandWella) {
      brandWella = await prisma.brand.create({
        data: { name: "Wella", slug: "wella", isActive: true },
      })
      console.log('Created brand:', brandWella.name)
    }

    // Create product line
    let lineMajirel = await prisma.productLine.findFirst({ where: { slug: 'majirel' } })
    if (!lineMajirel) {
      lineMajirel = await prisma.productLine.create({
        data: { name: "Majirel", slug: "majirel", brandId: brand.id },
      })
    }

    let lineIgora = await prisma.productLine.findFirst({ where: { slug: 'igora-royal' } })
    if (!lineIgora) {
      lineIgora = await prisma.productLine.create({
        data: { name: "Igora Royal", slug: "igora-royal", brandId: brandSK.id },
      })
    }

    let lineKoleston = await prisma.productLine.findFirst({ where: { slug: 'koleston-perfect' } })
    if (!lineKoleston) {
      lineKoleston = await prisma.productLine.create({
        data: { name: "Koleston Perfect", slug: "koleston-perfect", brandId: brandWella.id },
      })
    }

    // Create category
    let category = await prisma.category.findFirst({ where: { slug: 'boje-za-kosu' } })
    if (!category) {
      category = await prisma.category.create({
        data: { nameLat: "Boje za kosu", slug: "boje-za-kosu", isActive: true },
      })
    }

    // Create products with colors
    const lines = [
      { line: lineMajirel, brand: brand, prefix: "LOR-MJ", sep: "." },
      { line: lineIgora, brand: brandSK, prefix: "SCH-IR", sep: "-" },
      { line: lineKoleston, brand: brandWella, prefix: "WEL-KP", sep: "/" },
    ]

    let created = 0
    for (const colorDef of COLOR_PALETTE) {
      // Assign to a brand line based on round-robin
      const lineInfo = lines[created % lines.length]
      const shadeCode = colorDef.shade.replace(".", lineInfo.sep)
      const sku = `${lineInfo.prefix}-${shadeCode.replace(/[/.-]/g, "")}`
      const slug = `${lineInfo.line.slug}-${shadeCode.replace(/[/.]/g, "-")}`
      const name = `${lineInfo.line.name} ${shadeCode}`

      try {
        const product = await prisma.product.create({
          data: {
            sku,
            nameLat: name,
            slug,
            brandId: lineInfo.brand.id,
            productLineId: lineInfo.line.id,
            categoryId: category.id,
            priceB2c: 750 + Math.floor(Math.random() * 400),
            priceB2b: 450 + Math.floor(Math.random() * 300),
            stockQuantity: 10 + Math.floor(Math.random() * 100),
            lowStockThreshold: 5,
            isProfessional: true,
            isActive: true,
            isNew: Math.random() > 0.8,
            weightGrams: 80,
            volumeMl: 60,
            description: `Profesionalna permanentna boja za kosu. Nivo ${colorDef.level}, ${colorDef.name.toLowerCase()} podton.`,
            usageInstructions: "Pomešajte 1:1 sa razvijačem. Nanesite i ostavite 30-45 min.",
          },
        })

        await prisma.colorProduct.create({
          data: {
            productId: product.id,
            colorLevel: colorDef.level,
            undertoneCode: colorDef.code,
            undertoneName: colorDef.name,
            hexValue: colorDef.hex,
            shadeCode,
          },
        })

        created++
        console.log(`  Created: ${name} (${shadeCode}) — Level ${colorDef.level} / ${colorDef.name}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('Unique constraint')) {
          console.log(`  Skipped (already exists): ${name}`)
        } else {
          console.error(`  Error creating ${name}:`, msg)
        }
      }
    }

    console.log(`\nCreated ${created} color products`)

  } else {
    // Products exist — add colors to products that don't have them
    console.log('Adding colors to existing products that lack color data...')

    const productsWithoutColor = await prisma.product.findMany({
      where: {
        isActive: true,
        colorProduct: null,
      },
      select: { id: true, nameLat: true, sku: true },
    })

    console.log(`${productsWithoutColor.length} products without color data`)

    let assigned = 0
    for (const product of productsWithoutColor) {
      const colorDef = COLOR_PALETTE[assigned % COLOR_PALETTE.length]

      try {
        await prisma.colorProduct.create({
          data: {
            productId: product.id,
            colorLevel: colorDef.level,
            undertoneCode: colorDef.code,
            undertoneName: colorDef.name,
            hexValue: colorDef.hex,
            shadeCode: colorDef.shade,
          },
        })
        assigned++
        console.log(`  Assigned: ${product.nameLat} → Level ${colorDef.level} / ${colorDef.name} (${colorDef.shade})`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  Error assigning color to ${product.nameLat}:`, msg)
      }
    }

    console.log(`\nAssigned colors to ${assigned} products`)
  }

  // Summary
  const totalColors = await prisma.colorProduct.count()
  const totalProducts = await prisma.product.count({ where: { isActive: true } })
  console.log(`\n=== Summary ===`)
  console.log(`Total active products: ${totalProducts}`)
  console.log(`Total color products: ${totalColors}`)
}

main()
  .then(() => {
    console.log('\nDone!')
    return prisma.$disconnect()
  })
  .catch((err) => {
    console.error('Fatal error:', err)
    prisma.$disconnect()
    process.exit(1)
  })
