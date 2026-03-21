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

// Additional color products to create a rich, diverse palette
const EXTRA_COLORS = [
  // Gold family
  { level: 6, code: "G", name: "Zlatna", hex: "#96782a", shade: "6.3", lineName: "Majirel" },
  { level: 7, code: "G", name: "Zlatna", hex: "#b09035", shade: "7.3", lineName: "Igora Royal" },
  { level: 8, code: "G", name: "Zlatna", hex: "#c8a840", shade: "8.3", lineName: "Koleston Perfect" },
  { level: 9, code: "G", name: "Zlatna", hex: "#dcc050", shade: "9.3", lineName: "Majirel" },
  // Copper family
  { level: 5, code: "C", name: "Bakarna", hex: "#8a4a1a", shade: "5.4", lineName: "Igora Royal" },
  { level: 6, code: "C", name: "Bakarna", hex: "#a55a20", shade: "6.4", lineName: "Koleston Perfect" },
  { level: 7, code: "C", name: "Bakarna", hex: "#c06a28", shade: "7.4", lineName: "Majirel" },
  { level: 8, code: "C", name: "Bakarna", hex: "#d88030", shade: "8.4", lineName: "Igora Royal" },
  // Red family
  { level: 5, code: "R", name: "Crvena", hex: "#851a1a", shade: "5.6", lineName: "Koleston Perfect" },
  { level: 6, code: "R", name: "Crvena", hex: "#a02020", shade: "6.6", lineName: "Majirel" },
  { level: 7, code: "R", name: "Crvena", hex: "#bb2828", shade: "7.6", lineName: "Igora Royal" },
  // Violet family
  { level: 5, code: "V", name: "Ljubičasta", hex: "#502878", shade: "5.2", lineName: "Koleston Perfect" },
  { level: 6, code: "V", name: "Ljubičasta", hex: "#653090", shade: "6.2", lineName: "Majirel" },
  { level: 7, code: "V", name: "Ljubičasta", hex: "#7a38a8", shade: "7.2", lineName: "Igora Royal" },
  // Brown family
  { level: 4, code: "B", name: "Braon", hex: "#4a3518", shade: "4.7", lineName: "Koleston Perfect" },
  { level: 5, code: "B", name: "Braon", hex: "#604520", shade: "5.7", lineName: "Majirel" },
  { level: 6, code: "B", name: "Braon", hex: "#785528", shade: "6.7", lineName: "Igora Royal" },
  // Matte family
  { level: 7, code: "M", name: "Mat", hex: "#6e8060", shade: "7.8", lineName: "Koleston Perfect" },
  { level: 8, code: "M", name: "Mat", hex: "#829670", shade: "8.8", lineName: "Majirel" },
  // More naturals for depth
  { level: 3, code: "N", name: "Prirodna", hex: "#2d1f12", shade: "3.0", lineName: "Igora Royal" },
  { level: 5, code: "N", name: "Prirodna", hex: "#5a3e25", shade: "5.0", lineName: "Koleston Perfect" },
  { level: 7, code: "N", name: "Prirodna", hex: "#8a6b34", shade: "7.0", lineName: "Majirel" },
  // More ash for variety
  { level: 6, code: "A", name: "Pepeljasta", hex: "#7a7488", shade: "6.1", lineName: "Koleston Perfect" },
  { level: 8, code: "A", name: "Pepeljasta", hex: "#b0aab8", shade: "8.1", lineName: "Majirel" },
]

async function main() {
  console.log('Creating additional color products for a rich palette...\n')

  // Get brand lines
  const lines = await prisma.productLine.findMany({
    include: { brand: true },
  })
  const lineMap = new Map(lines.map(l => [l.name, l]))

  // Get or create brands/lines if needed
  if (lines.length === 0) {
    console.log('No product lines found. Run seed-colors.ts first.')
    return
  }

  // Get color category
  let category = await prisma.category.findFirst({ where: { slug: 'boje-za-kosu' } })
  if (!category) {
    category = await prisma.category.create({
      data: { nameLat: "Boje za kosu", slug: "boje-za-kosu", isActive: true },
    })
  }

  let created = 0
  for (const c of EXTRA_COLORS) {
    const line = lineMap.get(c.lineName)
    if (!line) {
      console.log(`  Skipped: line "${c.lineName}" not found`)
      continue
    }

    const sep = line.name === "Koleston Perfect" ? "/" : line.name === "Igora Royal" ? "-" : "."
    const shadeCode = `${c.level}${sep}${c.shade.split(".")[1]}`
    const sku = `${line.brand.slug.substring(0, 3).toUpperCase()}-${line.slug.substring(0, 2).toUpperCase()}-${shadeCode.replace(/[/.-]/g, "")}${Date.now().toString(36).slice(-3)}`
    const slug = `${line.slug}-${shadeCode.replace(/[/.]/g, "-")}-${Date.now().toString(36).slice(-4)}`
    const name = `${line.name} ${shadeCode}`

    try {
      const product = await prisma.product.create({
        data: {
          sku,
          nameLat: name,
          slug,
          brandId: line.brand.id,
          productLineId: line.id,
          categoryId: category.id,
          priceB2c: 700 + Math.floor(Math.random() * 500),
          priceB2b: 400 + Math.floor(Math.random() * 350),
          stockQuantity: 5 + Math.floor(Math.random() * 80),
          lowStockThreshold: 5,
          isProfessional: true,
          isActive: true,
          isNew: Math.random() > 0.85,
          weightGrams: 80,
          volumeMl: 60,
          description: `${line.name} ${shadeCode} — Nivo ${c.level}, ${c.name.toLowerCase()} podton. Profesionalna permanentna boja.`,
        },
      })

      await prisma.colorProduct.create({
        data: {
          productId: product.id,
          colorLevel: c.level,
          undertoneCode: c.code,
          undertoneName: c.name,
          hexValue: c.hex,
          shadeCode,
        },
      })

      created++
      console.log(`  ✓ ${name} — Level ${c.level} / ${c.name} (${c.hex})`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Unique constraint')) {
        console.log(`  ~ Skipped (exists): ${name}`)
      } else {
        console.error(`  ✗ Error: ${name} —`, msg)
      }
    }
  }

  // Final summary
  const totalColors = await prisma.colorProduct.count()
  const totalProducts = await prisma.product.count({ where: { isActive: true } })

  const levelCounts = await prisma.colorProduct.groupBy({
    by: ['colorLevel'],
    _count: true,
    orderBy: { colorLevel: 'asc' },
  })

  const undertoneCounts = await prisma.colorProduct.groupBy({
    by: ['undertoneCode'],
    _count: true,
    orderBy: { undertoneCode: 'asc' },
  })

  console.log(`\n=== Summary ===`)
  console.log(`Created ${created} new color products`)
  console.log(`Total active products: ${totalProducts}`)
  console.log(`Total color products: ${totalColors}`)
  console.log(`\nBy level:`)
  levelCounts.forEach(l => console.log(`  Level ${l.colorLevel}: ${l._count} products`))
  console.log(`\nBy undertone:`)
  undertoneCounts.forEach(u => console.log(`  ${u.undertoneCode}: ${u._count} products`))
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
