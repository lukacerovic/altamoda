import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ==================== USERS ====================
  const adminPassword = await hash('admin123', 12)
  const userPassword = await hash('user123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@altamoda.rs' },
    update: {},
    create: {
      email: 'admin@altamoda.rs',
      passwordHash: adminPassword,
      name: 'Admin Korisnik',
      phone: '+381 11 000 0000',
      role: 'admin',
      status: 'active',
    },
  })

  const b2cUser = await prisma.user.upsert({
    where: { email: 'marija@gmail.com' },
    update: {},
    create: {
      email: 'marija@gmail.com',
      passwordHash: userPassword,
      name: 'Marija Petrović',
      phone: '+381 63 123 4567',
      role: 'b2c',
      status: 'active',
    },
  })

  const b2cUser2 = await prisma.user.upsert({
    where: { email: 'ana.jovanovic@gmail.com' },
    update: {},
    create: {
      email: 'ana.jovanovic@gmail.com',
      passwordHash: userPassword,
      name: 'Ana Jovanović',
      phone: '+381 64 234 5678',
      role: 'b2c',
      status: 'active',
    },
  })

  const b2bUser = await prisma.user.upsert({
    where: { email: 'salon.glamour@gmail.com' },
    update: {},
    create: {
      email: 'salon.glamour@gmail.com',
      passwordHash: userPassword,
      name: 'Salon Glamour',
      phone: '+381 11 234 5678',
      role: 'b2b',
      status: 'active',
      b2bProfile: {
        create: {
          salonName: 'Salon Glamour',
          pib: '123456789',
          maticniBroj: '12345678',
          address: 'Knez Mihailova 15, Beograd',
          discountTier: 12,
          approvedAt: new Date(),
        },
      },
    },
  })

  const b2bUser2 = await prisma.user.upsert({
    where: { email: 'beauty.studio.ns@gmail.com' },
    update: {},
    create: {
      email: 'beauty.studio.ns@gmail.com',
      passwordHash: userPassword,
      name: 'Beauty Studio NS',
      phone: '+381 21 456 7890',
      role: 'b2b',
      status: 'active',
      b2bProfile: {
        create: {
          salonName: 'Beauty Studio NS',
          pib: '987654321',
          maticniBroj: '87654321',
          address: 'Bulevar Oslobođenja 42, Novi Sad',
          discountTier: 8,
          approvedAt: new Date(),
        },
      },
    },
  })

  const b2bPending = await prisma.user.upsert({
    where: { email: 'studio.lepote.bg@gmail.com' },
    update: {},
    create: {
      email: 'studio.lepote.bg@gmail.com',
      passwordHash: userPassword,
      name: 'Studio Lepote BG',
      phone: '+381 11 987 6543',
      role: 'b2b',
      status: 'pending',
      b2bProfile: {
        create: {
          salonName: 'Studio Lepote BG',
          pib: '111222333',
          maticniBroj: '11122233',
          address: 'Terazije 8, Beograd',
          discountTier: 0,
        },
      },
    },
  })

  console.log('✅ Users seeded')

  // ==================== BRANDS ====================
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { slug: 'loreal' }, update: {}, create: { name: "L'Oréal Professionnel", slug: 'loreal', description: 'Profesionalna frizerska kozmetika' } }),
    prisma.brand.upsert({ where: { slug: 'schwarzkopf' }, update: {}, create: { name: 'Schwarzkopf Professional', slug: 'schwarzkopf', description: 'Profesionalna nega i boje za kosu' } }),
    prisma.brand.upsert({ where: { slug: 'wella' }, update: {}, create: { name: 'Wella Professionals', slug: 'wella', description: 'Profesionalna nega kose' } }),
    prisma.brand.upsert({ where: { slug: 'kerastase' }, update: {}, create: { name: 'Kérastase', slug: 'kerastase', description: 'Luksuzna nega kose' } }),
    prisma.brand.upsert({ where: { slug: 'olaplex' }, update: {}, create: { name: 'Olaplex', slug: 'olaplex', description: 'Sistem za obnovu kose' } }),
    prisma.brand.upsert({ where: { slug: 'moroccanoil' }, update: {}, create: { name: 'Moroccanoil', slug: 'moroccanoil', description: 'Nega na bazi arganovog ulja' } }),
    prisma.brand.upsert({ where: { slug: 'matrix' }, update: {}, create: { name: 'Matrix', slug: 'matrix', description: 'Profesionalna frizerska kozmetika' } }),
    prisma.brand.upsert({ where: { slug: 'revlon' }, update: {}, create: { name: 'Revlon Professional', slug: 'revlon', description: 'Profesionalna nega i styling' } }),
  ])

  const [loreal, schwarzkopf, wella, kerastase, olaplex, moroccanoil, matrix, revlon] = brands

  console.log('✅ Brands seeded')

  // ==================== PRODUCT LINES ====================
  const productLines = await Promise.all([
    prisma.productLine.upsert({ where: { slug: 'majirel' }, update: {}, create: { brandId: loreal.id, name: 'Majirel', slug: 'majirel', description: 'Permanentne boje za kosu' } }),
    prisma.productLine.upsert({ where: { slug: 'igora-royal' }, update: {}, create: { brandId: schwarzkopf.id, name: 'Igora Royal', slug: 'igora-royal', description: 'Profesionalne permanentne boje' } }),
    prisma.productLine.upsert({ where: { slug: 'koleston-perfect' }, update: {}, create: { brandId: wella.id, name: 'Koleston Perfect', slug: 'koleston-perfect', description: 'Permanentne boje za kosu' } }),
    prisma.productLine.upsert({ where: { slug: 'inoa' }, update: {}, create: { brandId: loreal.id, name: 'INOA', slug: 'inoa', description: 'Boje bez amonijaka' } }),
    prisma.productLine.upsert({ where: { slug: 'serie-expert' }, update: {}, create: { brandId: loreal.id, name: 'Serie Expert', slug: 'serie-expert', description: 'Profesionalna linija za negu kose' } }),
    prisma.productLine.upsert({ where: { slug: 'blondme' }, update: {}, create: { brandId: schwarzkopf.id, name: 'BlondMe', slug: 'blondme', description: 'Linija za plavu kosu' } }),
    prisma.productLine.upsert({ where: { slug: 'bc-bonacure' }, update: {}, create: { brandId: schwarzkopf.id, name: 'BC Bonacure', slug: 'bc-bonacure', description: 'Profesionalna nega kose' } }),
    prisma.productLine.upsert({ where: { slug: 'elixir-ultime' }, update: {}, create: { brandId: kerastase.id, name: 'Elixir Ultime', slug: 'elixir-ultime', description: 'Ulja za kosu' } }),
    prisma.productLine.upsert({ where: { slug: 'nutritive' }, update: {}, create: { brandId: kerastase.id, name: 'Nutritive', slug: 'nutritive', description: 'Nega za suvu kosu' } }),
    prisma.productLine.upsert({ where: { slug: 'genesis' }, update: {}, create: { brandId: kerastase.id, name: 'Genesis', slug: 'genesis', description: 'Nega protiv opadanja kose' } }),
    prisma.productLine.upsert({ where: { slug: 'total-results' }, update: {}, create: { brandId: matrix.id, name: 'Total Results', slug: 'total-results', description: 'Profesionalna nega kose' } }),
    prisma.productLine.upsert({ where: { slug: 'oil-reflections' }, update: {}, create: { brandId: wella.id, name: 'Oil Reflections', slug: 'oil-reflections', description: 'Ulja za sjaj kose' } }),
  ])

  console.log('✅ Product Lines seeded')

  // ==================== CATEGORIES ====================
  const kolor = await prisma.category.upsert({ where: { slug: 'kolor' }, update: {}, create: { nameLat: 'Kolor', slug: 'kolor', sortOrder: 1, depth: 0 } })
  const nega = await prisma.category.upsert({ where: { slug: 'nega' }, update: {}, create: { nameLat: 'Nega', slug: 'nega', sortOrder: 2, depth: 0 } })
  const styling = await prisma.category.upsert({ where: { slug: 'styling' }, update: {}, create: { nameLat: 'Styling', slug: 'styling', sortOrder: 3, depth: 0 } })
  const aparati = await prisma.category.upsert({ where: { slug: 'aparati' }, update: {}, create: { nameLat: 'Aparati', slug: 'aparati', sortOrder: 4, depth: 0 } })

  // Kolor subcategories
  const bojeZaKosu = await prisma.category.upsert({ where: { slug: 'boje-za-kosu' }, update: {}, create: { nameLat: 'Boje za kosu', slug: 'boje-za-kosu', parentId: kolor.id, sortOrder: 1, depth: 1 } })
  const oksidanti = await prisma.category.upsert({ where: { slug: 'oksidanti' }, update: {}, create: { nameLat: 'Oksidanti', slug: 'oksidanti', parentId: kolor.id, sortOrder: 2, depth: 1 } })
  const dekoloranti = await prisma.category.upsert({ where: { slug: 'dekoloranti' }, update: {}, create: { nameLat: 'Dekoloranti', slug: 'dekoloranti', parentId: kolor.id, sortOrder: 3, depth: 1 } })

  // Nega subcategories
  const samponi = await prisma.category.upsert({ where: { slug: 'samponi' }, update: {}, create: { nameLat: 'Šamponi', slug: 'samponi', parentId: nega.id, sortOrder: 1, depth: 1 } })
  const maske = await prisma.category.upsert({ where: { slug: 'maske' }, update: {}, create: { nameLat: 'Maske', slug: 'maske', parentId: nega.id, sortOrder: 2, depth: 1 } })
  const regeneratori = await prisma.category.upsert({ where: { slug: 'regeneratori' }, update: {}, create: { nameLat: 'Regeneratori', slug: 'regeneratori', parentId: nega.id, sortOrder: 3, depth: 1 } })
  const serumi = await prisma.category.upsert({ where: { slug: 'serumi' }, update: {}, create: { nameLat: 'Serumi', slug: 'serumi', parentId: nega.id, sortOrder: 4, depth: 1 } })
  const ulja = await prisma.category.upsert({ where: { slug: 'ulja' }, update: {}, create: { nameLat: 'Ulja', slug: 'ulja', parentId: nega.id, sortOrder: 5, depth: 1 } })

  console.log('✅ Categories seeded')

  // ==================== PRODUCTS ====================
  const products = await Promise.all([
    // Šamponi
    prisma.product.upsert({
      where: { sku: 'LOR-MD-300' },
      update: {},
      create: { sku: 'LOR-MD-300', nameLat: 'Metal Detox Šampon 300ml', slug: 'metal-detox-sampon-300ml', brandId: loreal.id, productLineId: productLines[4].id, categoryId: samponi.id, description: 'Profesionalni šampon za dubinsko čišćenje metala iz kose.', priceB2c: 2400, priceB2b: 1920, stockQuantity: 45, volumeMl: 300, isProfessional: false, isNew: false, isFeatured: true },
    }),
    prisma.product.upsert({
      where: { sku: 'LOR-AR-300' },
      update: {},
      create: { sku: 'LOR-AR-300', nameLat: 'Absolut Repair Šampon 300ml', slug: 'absolut-repair-sampon-300ml', brandId: loreal.id, productLineId: productLines[4].id, categoryId: samponi.id, description: 'Šampon za obnovu oštećene kose.', priceB2c: 2800, priceB2b: 2240, stockQuantity: 38, volumeMl: 300, isProfessional: false, isNew: true, isFeatured: true },
    }),
    prisma.product.upsert({
      where: { sku: 'OLA-NO4-250' },
      update: {},
      create: { sku: 'OLA-NO4-250', nameLat: 'No.4 Bond Maintenance Šampon 250ml', slug: 'no4-bond-maintenance-sampon', brandId: olaplex.id, categoryId: samponi.id, description: 'Šampon za održavanje veza u kosi.', priceB2c: 3600, priceB2b: 2880, oldPrice: 5200, stockQuantity: 22, volumeMl: 250, isProfessional: false, isFeatured: true },
    }),
    prisma.product.upsert({
      where: { sku: 'MAT-TR-300' },
      update: {},
      create: { sku: 'MAT-TR-300', nameLat: 'Total Results Šampon 300ml', slug: 'total-results-sampon-300ml', brandId: matrix.id, productLineId: productLines[10].id, categoryId: samponi.id, description: 'Profesionalni šampon za svakodnevnu upotrebu.', priceB2c: 1950, priceB2b: 1560, stockQuantity: 60, volumeMl: 300, isProfessional: false, isNew: true },
    }),
    prisma.product.upsert({
      where: { sku: 'KER-NB-250' },
      update: {},
      create: { sku: 'KER-NB-250', nameLat: 'Nutritive Bain Satin 250ml', slug: 'nutritive-bain-satin-250ml', brandId: kerastase.id, productLineId: productLines[8].id, categoryId: samponi.id, description: 'Nutritivni šampon za suvu kosu.', priceB2c: 3400, priceB2b: 2720, stockQuantity: 30, volumeMl: 250, isProfessional: false, isFeatured: true },
    }),
    prisma.product.upsert({
      where: { sku: 'MOR-HYD-250' },
      update: {},
      create: { sku: 'MOR-HYD-250', nameLat: 'Moroccanoil Hydrating Šampon 250ml', slug: 'moroccanoil-hydrating-sampon', brandId: moroccanoil.id, categoryId: samponi.id, description: 'Hidrirajući šampon sa arganovim uljem.', priceB2c: 2900, priceB2b: 2320, stockQuantity: 35, volumeMl: 250, isProfessional: false, isFeatured: true },
    }),

    // Maske
    prisma.product.upsert({
      where: { sku: 'SCH-BM-200' },
      update: {},
      create: { sku: 'SCH-BM-200', nameLat: 'BlondMe Bond Maska 200ml', slug: 'blondme-bond-maska-200ml', brandId: schwarzkopf.id, productLineId: productLines[5].id, categoryId: maske.id, description: 'Maska za obnovu plave kose.', priceB2c: 3100, priceB2b: 2480, oldPrice: 4350, stockQuantity: 18, volumeMl: 200, isProfessional: false },
    }),
    prisma.product.upsert({
      where: { sku: 'LOR-AR-250M' },
      update: {},
      create: { sku: 'LOR-AR-250M', nameLat: 'Absolut Repair Maska 250ml', slug: 'absolut-repair-maska-250ml', brandId: loreal.id, productLineId: productLines[4].id, categoryId: maske.id, description: 'Intenzivna maska za oštećenu kosu.', priceB2c: 2900, priceB2b: 2320, stockQuantity: 25, volumeMl: 250, isProfessional: false, isNew: true },
    }),

    // Serumi
    prisma.product.upsert({
      where: { sku: 'KER-GS-90' },
      update: {},
      create: { sku: 'KER-GS-90', nameLat: 'Genesis Serum 90ml', slug: 'genesis-serum-90ml', brandId: kerastase.id, productLineId: productLines[9].id, categoryId: serumi.id, description: 'Serum protiv opadanja kose.', priceB2c: 5200, priceB2b: 4160, stockQuantity: 15, volumeMl: 90, isProfessional: false },
    }),
    prisma.product.upsert({
      where: { sku: 'MOR-TO-100' },
      update: {},
      create: { sku: 'MOR-TO-100', nameLat: 'Moroccanoil Treatment Original 100ml', slug: 'moroccanoil-treatment-original-100ml', brandId: moroccanoil.id, categoryId: serumi.id, description: 'Originalni tretman sa arganovim uljem.', priceB2c: 4200, priceB2b: 3360, stockQuantity: 28, volumeMl: 100, isProfessional: false, isFeatured: true },
    }),
    prisma.product.upsert({
      where: { sku: 'OLA-NO3-100' },
      update: {},
      create: { sku: 'OLA-NO3-100', nameLat: 'No.3 Hair Perfector 100ml', slug: 'no3-hair-perfector-100ml', brandId: olaplex.id, categoryId: serumi.id, description: 'Kućni tretman za obnovu kose.', priceB2c: 2850, priceB2b: 2280, stockQuantity: 40, volumeMl: 100, isProfessional: false, isFeatured: true },
    }),

    // Ulja
    prisma.product.upsert({
      where: { sku: 'KER-EU-100' },
      update: {},
      create: { sku: 'KER-EU-100', nameLat: 'Elixir Ultime Ulje 100ml', slug: 'elixir-ultime-ulje-100ml', brandId: kerastase.id, productLineId: productLines[7].id, categoryId: ulja.id, description: 'Luksuzno ulje za sjaj kose.', priceB2c: 3200, priceB2b: 2560, stockQuantity: 20, volumeMl: 100, isProfessional: false },
    }),
    prisma.product.upsert({
      where: { sku: 'WEL-OR-100' },
      update: {},
      create: { sku: 'WEL-OR-100', nameLat: 'Oil Reflections Ulje 100ml', slug: 'oil-reflections-ulje-100ml', brandId: wella.id, productLineId: productLines[11].id, categoryId: ulja.id, description: 'Ulje za sjaj i glatkoću kose.', priceB2c: 3100, priceB2b: 2480, oldPrice: 3600, stockQuantity: 32, volumeMl: 100, isProfessional: false, isNew: true },
    }),
    prisma.product.upsert({
      where: { sku: 'MOR-TL-100' },
      update: {},
      create: { sku: 'MOR-TL-100', nameLat: 'Moroccanoil Treatment Light 100ml', slug: 'moroccanoil-treatment-light-100ml', brandId: moroccanoil.id, categoryId: ulja.id, description: 'Lagani tretman za finu i svetlu kosu.', priceB2c: 3600, priceB2b: 2880, stockQuantity: 25, volumeMl: 100, isProfessional: false, isNew: true },
    }),
    prisma.product.upsert({
      where: { sku: 'KER-EU-75S' },
      update: {},
      create: { sku: 'KER-EU-75S', nameLat: 'Elixir Ultime Serum 75ml', slug: 'elixir-ultime-serum-75ml', brandId: kerastase.id, productLineId: productLines[7].id, categoryId: ulja.id, description: 'Serum za sjaj na bazi ulja.', priceB2c: 4800, priceB2b: 3840, stockQuantity: 12, volumeMl: 75, isProfessional: false },
    }),
    prisma.product.upsert({
      where: { sku: 'SCH-MO-100' },
      update: {},
      create: { sku: 'SCH-MO-100', nameLat: 'Mythic Oil 100ml', slug: 'mythic-oil-100ml', brandId: schwarzkopf.id, categoryId: ulja.id, description: 'Mitsko ulje za sjaj i mekanu kosu.', priceB2c: 2700, priceB2b: 2160, stockQuantity: 42, volumeMl: 100, isProfessional: false },
    }),
    prisma.product.upsert({
      where: { sku: 'SCH-OUA-100' },
      update: {},
      create: { sku: 'SCH-OUA-100', nameLat: 'Oil Ultime Argan 100ml', slug: 'oil-ultime-argan-100ml', brandId: schwarzkopf.id, categoryId: ulja.id, description: 'Argano ulje za dubinsku negu.', priceB2c: 2200, priceB2b: 1760, stockQuantity: 50, volumeMl: 100, isProfessional: false },
    }),

    // Professional Boje za kosu (B2B only)
    // Majirel (L'Oréal)
    prisma.product.upsert({ where: { sku: 'LOR-MAJ-70' }, update: {}, create: { sku: 'LOR-MAJ-70', nameLat: 'Majirel 7.0 - Srednje Plava Boja za Kosu', slug: 'majirel-7-0-srednje-plava', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna profesionalna boja za kosu sa dubokim pokrivanjem sedih.', ingredients: 'Aqua, Cetearyl Alcohol, Propylene Glycol, Deceth-3, Laureth-12...', usageInstructions: 'Pomešajte 1:1 sa oksidantom. Nanesite i ostavite 35 minuta.', priceB2c: 890, priceB2b: 650, oldPrice: 1290, stockQuantity: 23, volumeMl: 60, isProfessional: true, isFeatured: true } }),
    prisma.product.upsert({ where: { sku: 'LOR-MAJ-57' }, update: {}, create: { sku: 'LOR-MAJ-57', nameLat: 'Majirel 5.7 Svetlo Braon', slug: 'majirel-5-7-svetlo-braon', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna boja sa toplim braon tonovima.', priceB2c: 890, priceB2b: 650, stockQuantity: 30, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'LOR-MAJ-63' }, update: {}, create: { sku: 'LOR-MAJ-63', nameLat: 'Majirel 6.3 Tamno Zlatna Plava', slug: 'majirel-6-3-tamno-zlatna-plava', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna boja sa zlatnim tonom.', priceB2c: 890, priceB2b: 650, stockQuantity: 25, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'LOR-MAJ-62' }, update: {}, create: { sku: 'LOR-MAJ-62', nameLat: 'Majirel 6.2 Tamno Ljubičasta Plava', slug: 'majirel-6-2-tamno-ljubicasta-plava', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna boja sa ljubičastim nijansama.', priceB2c: 890, priceB2b: 650, stockQuantity: 20, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'LOR-MAJ-66' }, update: {}, create: { sku: 'LOR-MAJ-66', nameLat: 'Majirel 6.6 Tamno Crvena Plava', slug: 'majirel-6-6-tamno-crvena-plava', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna boja sa intenzivnim crvenim tonovima.', priceB2c: 890, priceB2b: 650, stockQuantity: 18, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'LOR-MAJ-74' }, update: {}, create: { sku: 'LOR-MAJ-74', nameLat: 'Majirel 7.4 Srednje Bakarna Plava', slug: 'majirel-7-4-srednje-bakarna-plava', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna boja sa bakarnim tonovima.', priceB2c: 890, priceB2b: 650, stockQuantity: 22, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'LOR-MAJ-81' }, update: {}, create: { sku: 'LOR-MAJ-81', nameLat: 'Majirel 8.1 Svetlo Pepeljasta Plava', slug: 'majirel-8-1-svetlo-pepeljasta-plava', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna boja sa pepeljastim tonovima.', priceB2c: 890, priceB2b: 650, stockQuantity: 28, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'LOR-MAJ-88' }, update: {}, create: { sku: 'LOR-MAJ-88', nameLat: 'Majirel 8.8 Svetlo Mat Plava', slug: 'majirel-8-8-svetlo-mat-plava', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna boja sa mat zelenim tonovima.', priceB2c: 890, priceB2b: 650, stockQuantity: 15, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'LOR-MAJ-93' }, update: {}, create: { sku: 'LOR-MAJ-93', nameLat: 'Majirel 9.3 Vrlo Svetlo Zlatna Plava', slug: 'majirel-9-3-vrlo-svetlo-zlatna-plava', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna boja sa zlatnim nijansama.', priceB2c: 890, priceB2b: 650, stockQuantity: 20, volumeMl: 60, isProfessional: true } }),

    // Igora Royal (Schwarzkopf)
    prisma.product.upsert({ where: { sku: 'SCH-IR-71' }, update: {}, create: { sku: 'SCH-IR-71', nameLat: 'Igora Royal 7-1 Pepeljasto Plava 60ml', slug: 'igora-royal-7-1-pepeljasto-plava', brandId: schwarzkopf.id, productLineId: productLines[1].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 790, priceB2b: 580, stockQuantity: 30, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'SCH-IR-30' }, update: {}, create: { sku: 'SCH-IR-30', nameLat: 'Igora Royal 3-0 Tamno Braon', slug: 'igora-royal-3-0-tamno-braon', brandId: schwarzkopf.id, productLineId: productLines[1].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 790, priceB2b: 580, stockQuantity: 25, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'SCH-IR-54' }, update: {}, create: { sku: 'SCH-IR-54', nameLat: 'Igora Royal 5-4 Svetlo Braon Bež', slug: 'igora-royal-5-4-svetlo-braon-bez', brandId: schwarzkopf.id, productLineId: productLines[1].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 790, priceB2b: 580, stockQuantity: 22, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'SCH-IR-67' }, update: {}, create: { sku: 'SCH-IR-67', nameLat: 'Igora Royal 6-7 Tamno Plava Bakar', slug: 'igora-royal-6-7-tamno-plava-bakar', brandId: schwarzkopf.id, productLineId: productLines[1].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 790, priceB2b: 580, stockQuantity: 18, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'SCH-IR-73' }, update: {}, create: { sku: 'SCH-IR-73', nameLat: 'Igora Royal 7-3 Srednje Zlatna Plava', slug: 'igora-royal-7-3-srednje-zlatna-plava', brandId: schwarzkopf.id, productLineId: productLines[1].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 790, priceB2b: 580, stockQuantity: 28, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'SCH-IR-72' }, update: {}, create: { sku: 'SCH-IR-72', nameLat: 'Igora Royal 7-2 Srednje Ljubičasta Plava', slug: 'igora-royal-7-2-srednje-ljubicasta-plava', brandId: schwarzkopf.id, productLineId: productLines[1].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 790, priceB2b: 580, stockQuantity: 20, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'SCH-IR-76' }, update: {}, create: { sku: 'SCH-IR-76', nameLat: 'Igora Royal 7-6 Srednje Crvena Plava', slug: 'igora-royal-7-6-srednje-crvena-plava', brandId: schwarzkopf.id, productLineId: productLines[1].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 790, priceB2b: 580, stockQuantity: 15, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'SCH-IR-84' }, update: {}, create: { sku: 'SCH-IR-84', nameLat: 'Igora Royal 8-4 Svetlo Bakarna Plava', slug: 'igora-royal-8-4-svetlo-bakarna-plava', brandId: schwarzkopf.id, productLineId: productLines[1].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 790, priceB2b: 580, stockQuantity: 24, volumeMl: 60, isProfessional: true } }),

    // Koleston Perfect (Wella)
    prisma.product.upsert({ where: { sku: 'WEL-KP-47' }, update: {}, create: { sku: 'WEL-KP-47', nameLat: 'Koleston Perfect 4/7 Srednje Braon', slug: 'koleston-perfect-4-7-srednje-braon', brandId: wella.id, productLineId: productLines[2].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 850, priceB2b: 620, stockQuantity: 20, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'WEL-KP-50' }, update: {}, create: { sku: 'WEL-KP-50', nameLat: 'Koleston Perfect 5/0 Svetlo Braon', slug: 'koleston-perfect-5-0-svetlo-braon', brandId: wella.id, productLineId: productLines[2].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 850, priceB2b: 620, stockQuantity: 35, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'WEL-KP-52' }, update: {}, create: { sku: 'WEL-KP-52', nameLat: 'Koleston Perfect 5/2 Svetlo Braon Ljubičasta', slug: 'koleston-perfect-5-2-svetlo-braon-ljubicasta', brandId: wella.id, productLineId: productLines[2].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 850, priceB2b: 620, stockQuantity: 18, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'WEL-KP-56' }, update: {}, create: { sku: 'WEL-KP-56', nameLat: 'Koleston Perfect 5/6 Svetlo Braon Crvena', slug: 'koleston-perfect-5-6-svetlo-braon-crvena', brandId: wella.id, productLineId: productLines[2].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 850, priceB2b: 620, stockQuantity: 22, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'WEL-KP-61' }, update: {}, create: { sku: 'WEL-KP-61', nameLat: 'Koleston Perfect 6/1 Tamno Pepeljasta Plava', slug: 'koleston-perfect-6-1-tamno-pepeljasta-plava', brandId: wella.id, productLineId: productLines[2].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 850, priceB2b: 620, stockQuantity: 28, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'WEL-KP-64' }, update: {}, create: { sku: 'WEL-KP-64', nameLat: 'Koleston Perfect 6/4 Tamno Bakarna Plava', slug: 'koleston-perfect-6-4-tamno-bakarna-plava', brandId: wella.id, productLineId: productLines[2].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 850, priceB2b: 620, stockQuantity: 15, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'WEL-KP-78' }, update: {}, create: { sku: 'WEL-KP-78', nameLat: 'Koleston Perfect 7/8 Srednje Mat Plava', slug: 'koleston-perfect-7-8-srednje-mat-plava', brandId: wella.id, productLineId: productLines[2].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 850, priceB2b: 620, stockQuantity: 20, volumeMl: 60, isProfessional: true } }),
    prisma.product.upsert({ where: { sku: 'WEL-KP-83' }, update: {}, create: { sku: 'WEL-KP-83', nameLat: 'Koleston Perfect 8/3 Svetlo Zlatna Plava', slug: 'koleston-perfect-8-3-svetlo-zlatna-plava', brandId: wella.id, productLineId: productLines[2].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 850, priceB2b: 620, stockQuantity: 25, volumeMl: 60, isProfessional: true } }),

    // Oksidant
    prisma.product.upsert({
      where: { sku: 'LOR-OX-1000' },
      update: {},
      create: { sku: 'LOR-OX-1000', nameLat: 'Oxydant Creme 6% 1000ml', slug: 'oxydant-creme-6-1000ml', brandId: loreal.id, categoryId: oksidanti.id, description: 'Profesionalni oksidant za mešanje sa bojama za kosu.', priceB2c: 1200, priceB2b: 900, stockQuantity: 50, volumeMl: 1000, isProfessional: true },
    }),
  ])

  console.log('✅ Products seeded')

  // ==================== PRODUCT IMAGES ====================
  for (const product of products) {
    await prisma.productImage.upsert({
      where: { id: `img-${product.id}` },
      update: {},
      create: {
        id: `img-${product.id}`,
        productId: product.id,
        url: `https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400`,
        altText: product.nameLat,
        type: 'image',
        sortOrder: 0,
        isPrimary: true,
      },
    })
  }

  console.log('✅ Product Images seeded')

  // ==================== COLOR PRODUCTS ====================
  // Each entry: [sku, level, undertoneCode, undertoneName, hexValue, shadeCode]
  const colorData: [string, number, string, string, string, string][] = [
    // Majirel (L'Oréal)
    ['LOR-MAJ-57', 5, 'B', 'Braon',      '#604520', '5.7'],
    ['LOR-MAJ-63', 6, 'G', 'Zlatna',     '#96782a', '6.3'],
    ['LOR-MAJ-62', 6, 'V', 'Ljubičasta', '#653090', '6.2'],
    ['LOR-MAJ-66', 6, 'R', 'Crvena',     '#a02020', '6.6'],
    ['LOR-MAJ-70', 7, 'N', 'Prirodna',   '#8B6914', '7.0'],
    ['LOR-MAJ-74', 7, 'C', 'Bakarna',    '#c06a28', '7.4'],
    ['LOR-MAJ-81', 8, 'A', 'Pepeljasta', '#b0aab8', '8.1'],
    ['LOR-MAJ-88', 8, 'M', 'Mat',        '#829670', '8.8'],
    ['LOR-MAJ-93', 9, 'G', 'Zlatna',     '#dcc050', '9.3'],

    // Igora Royal (Schwarzkopf)
    ['SCH-IR-30', 3, 'N', 'Prirodna',    '#2d1f12', '3-0'],
    ['SCH-IR-54', 5, 'C', 'Bakarna',     '#8a4a1a', '5-4'],
    ['SCH-IR-67', 6, 'B', 'Braon',       '#785528', '6-7'],
    ['SCH-IR-71', 7, 'A', 'Pepeljasta',  '#7B7156', '7-1'],
    ['SCH-IR-73', 7, 'G', 'Zlatna',      '#b09035', '7-3'],
    ['SCH-IR-72', 7, 'V', 'Ljubičasta',  '#7a38a8', '7-2'],
    ['SCH-IR-76', 7, 'R', 'Crvena',      '#bb2828', '7-6'],
    ['SCH-IR-84', 8, 'C', 'Bakarna',     '#d88030', '8-4'],

    // Koleston Perfect (Wella)
    ['WEL-KP-47', 4, 'B', 'Braon',       '#4a3518', '4/7'],
    ['WEL-KP-50', 5, 'N', 'Prirodna',    '#5a3e25', '5/0'],
    ['WEL-KP-52', 5, 'V', 'Ljubičasta',  '#502878', '5/2'],
    ['WEL-KP-56', 5, 'R', 'Crvena',      '#851a1a', '5/6'],
    ['WEL-KP-61', 6, 'A', 'Pepeljasta',  '#7a7488', '6/1'],
    ['WEL-KP-64', 6, 'C', 'Bakarna',     '#a55a20', '6/4'],
    ['WEL-KP-78', 7, 'M', 'Mat',         '#6e8060', '7/8'],
    ['WEL-KP-83', 8, 'G', 'Zlatna',      '#c8a840', '8/3'],
  ]

  for (const [sku, level, code, name, hex, shade] of colorData) {
    const product = products.find(p => p.sku === sku)
    if (product) {
      await prisma.colorProduct.upsert({
        where: { productId: product.id },
        update: {},
        create: { productId: product.id, colorLevel: level, undertoneCode: code, undertoneName: name, hexValue: hex, shadeCode: shade },
      })
    }
  }

  console.log('✅ Color Products seeded (25 dyes across 3 brands)')

  // ==================== DYNAMIC ATTRIBUTES ====================
  const attrs = await Promise.all([
    prisma.dynamicAttribute.upsert({ where: { slug: 'bez-sulfata' }, update: {}, create: { nameLat: 'Bez sulfata', slug: 'bez-sulfata', type: 'boolean', filterable: true, showInFilters: true, sortOrder: 1 } }),
    prisma.dynamicAttribute.upsert({ where: { slug: 'bez-parabena' }, update: {}, create: { nameLat: 'Bez parabena', slug: 'bez-parabena', type: 'boolean', filterable: true, showInFilters: true, sortOrder: 2 } }),
    prisma.dynamicAttribute.upsert({ where: { slug: 'bez-amonijaka' }, update: {}, create: { nameLat: 'Bez amonijaka', slug: 'bez-amonijaka', type: 'boolean', filterable: true, showInFilters: true, sortOrder: 3 } }),
    prisma.dynamicAttribute.upsert({ where: { slug: 'vegan' }, update: {}, create: { nameLat: 'Vegan', slug: 'vegan', type: 'boolean', filterable: true, showInFilters: true, sortOrder: 4 } }),
    prisma.dynamicAttribute.upsert({ where: { slug: 'tip-kose' }, update: {}, create: { nameLat: 'Tip kose', slug: 'tip-kose', type: 'select', filterable: true, showInFilters: true, sortOrder: 5 } }),
  ])

  // Hair type options
  const hairTypes = ['Normalna', 'Suva', 'Masna', 'Farbana', 'Oštećena', 'Kovrdžava']
  for (let i = 0; i < hairTypes.length; i++) {
    await prisma.dynamicAttributeOption.create({
      data: { attributeId: attrs[4].id, value: hairTypes[i], sortOrder: i },
    })
  }

  console.log('✅ Dynamic Attributes seeded')

  // ==================== BANNERS ====================
  await Promise.all([
    prisma.banner.create({ data: { title: 'Prolećna Akcija', subtitle: 'Do -40% na odabrane proizvode', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200', position: 'home_hero', sortOrder: 1, isActive: true, startDate: new Date('2026-03-01'), endDate: new Date('2026-04-30') } }),
    prisma.banner.create({ data: { title: 'Kérastase Novo', subtitle: 'Otkrijte novu Genesis kolekciju', imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200', position: 'home_mid', sortOrder: 2, isActive: true, startDate: new Date('2026-02-15'), endDate: new Date('2026-05-15') } }),
    prisma.banner.create({ data: { title: 'B2B Specijalna Ponuda', subtitle: 'Ekskluzivni popusti za salone', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200', position: 'b2b_section', sortOrder: 3, isActive: true, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') } }),
    prisma.banner.create({ data: { title: 'Besplatna Dostava', subtitle: 'Za porudžbine preko 5.000 RSD', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200', position: 'home_hero', sortOrder: 4, isActive: true, startDate: new Date('2026-03-01'), endDate: new Date('2026-06-30') } }),
  ])

  console.log('✅ Banners seeded')

  // ==================== PROMO CODES ====================
  await Promise.all([
    prisma.promoCode.create({ data: { code: 'DOBRODOSLI10', type: 'percentage', value: 10, minOrderValue: 3000, maxUses: 500, currentUses: 127, audience: 'all', validFrom: new Date('2026-01-01'), validUntil: new Date('2026-12-31'), isActive: true } }),
    prisma.promoCode.create({ data: { code: 'B2B20', type: 'percentage', value: 20, minOrderValue: 15000, maxUses: 100, currentUses: 34, audience: 'b2b', validFrom: new Date('2026-01-01'), validUntil: new Date('2026-12-31'), isActive: true } }),
    prisma.promoCode.create({ data: { code: 'POPUST10', type: 'percentage', value: 10, minOrderValue: 2000, maxUses: 1000, currentUses: 245, audience: 'all', validFrom: new Date('2026-01-01'), validUntil: new Date('2026-12-31'), isActive: true } }),
    prisma.promoCode.create({ data: { code: 'KERASTASE15', type: 'percentage', value: 15, minOrderValue: 4000, maxUses: 200, currentUses: 67, audience: 'all', validFrom: new Date('2026-01-01'), validUntil: new Date('2026-06-30'), isActive: true } }),
    prisma.promoCode.create({ data: { code: 'SALON25', type: 'percentage', value: 25, minOrderValue: 20000, maxUses: 50, currentUses: 12, audience: 'b2b', validFrom: new Date('2026-01-01'), validUntil: new Date('2026-12-31'), isActive: true } }),
    prisma.promoCode.create({ data: { code: 'LETO500', type: 'fixed', value: 500, minOrderValue: 5000, maxUses: 300, currentUses: 300, audience: 'all', validFrom: new Date('2025-06-01'), validUntil: new Date('2025-09-30'), isActive: false } }),
  ])

  console.log('✅ Promo Codes seeded')

  // ==================== SHIPPING ZONES ====================
  const zone1 = await prisma.shippingZone.create({ data: { name: 'Beograd', cities: ['Beograd', 'Zemun', 'Novi Beograd'] } })
  const zone2 = await prisma.shippingZone.create({ data: { name: 'Vojvodina', cities: ['Novi Sad', 'Subotica', 'Zrenjanin', 'Sombor'] } })
  const zone3 = await prisma.shippingZone.create({ data: { name: 'Centralna Srbija', cities: ['Kragujevac', 'Niš', 'Čačak', 'Novi Pazar'] } })

  await Promise.all([
    prisma.shippingRate.create({ data: { zoneId: zone1.id, method: 'standard', price: 350, freeThreshold: 5000, estimatedDays: 2 } }),
    prisma.shippingRate.create({ data: { zoneId: zone1.id, method: 'express', price: 690, estimatedDays: 1 } }),
    prisma.shippingRate.create({ data: { zoneId: zone2.id, method: 'standard', price: 450, freeThreshold: 5000, estimatedDays: 3 } }),
    prisma.shippingRate.create({ data: { zoneId: zone2.id, method: 'express', price: 790, estimatedDays: 1 } }),
    prisma.shippingRate.create({ data: { zoneId: zone3.id, method: 'standard', price: 500, freeThreshold: 5000, estimatedDays: 4 } }),
    prisma.shippingRate.create({ data: { zoneId: zone3.id, method: 'express', price: 890, estimatedDays: 2 } }),
  ])

  console.log('✅ Shipping Zones seeded')

  // ==================== ORDERS ====================
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ALT-2026-0341',
      userId: b2bUser.id,
      status: 'isporuceno',
      subtotal: 28450,
      discountAmount: 2845,
      shippingCost: 0,
      total: 25605,
      paymentMethod: 'invoice',
      paymentStatus: 'paid',
      shippingMethod: 'standard',
      shippingAddress: { street: 'Knez Mihailova 15', city: 'Beograd', postalCode: '11000', country: 'Srbija' },
      items: {
        create: [
          { productId: products[0].id, productName: products[0].nameLat, productSku: products[0].sku, quantity: 5, unitPrice: 1920, totalPrice: 9600 },
          { productId: products[10].id, productName: products[10].nameLat, productSku: products[10].sku, quantity: 10, unitPrice: 2280, totalPrice: 22800 },
        ],
      },
      statusHistory: {
        create: [
          { status: 'novi', changedBy: admin.id, note: 'Porudžbina kreirana' },
          { status: 'u_obradi', changedBy: admin.id, note: 'Priprema za slanje' },
          { status: 'isporuceno', changedBy: admin.id, note: 'Isporučeno kuriru' },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      orderNumber: 'ALT-2026-0340',
      userId: b2cUser.id,
      status: 'u_obradi',
      subtotal: 8650,
      discountAmount: 0,
      shippingCost: 350,
      total: 9000,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      shippingMethod: 'standard',
      shippingAddress: { street: 'Bulevar Kralja Aleksandra 100', city: 'Beograd', postalCode: '11000', country: 'Srbija' },
      items: {
        create: [
          { productId: products[9].id, productName: products[9].nameLat, productSku: products[9].sku, quantity: 1, unitPrice: 4200, totalPrice: 4200 },
          { productId: products[4].id, productName: products[4].nameLat, productSku: products[4].sku, quantity: 1, unitPrice: 3400, totalPrice: 3400 },
        ],
      },
      statusHistory: {
        create: [
          { status: 'novi', note: 'Porudžbina kreirana' },
          { status: 'u_obradi', changedBy: admin.id, note: 'U pripremi' },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      orderNumber: 'ALT-2026-0339',
      userId: b2cUser2.id,
      status: 'novi',
      subtotal: 5950,
      discountAmount: 595,
      shippingCost: 0,
      total: 5355,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pending',
      shippingMethod: 'standard',
      promoCodeId: (await prisma.promoCode.findUnique({ where: { code: 'POPUST10' } }))!.id,
      shippingAddress: { street: 'Vojvode Stepe 50', city: 'Beograd', postalCode: '11000', country: 'Srbija' },
      items: {
        create: [
          { productId: products[10].id, productName: products[10].nameLat, productSku: products[10].sku, quantity: 1, unitPrice: 2850, totalPrice: 2850 },
          { productId: products[12].id, productName: products[12].nameLat, productSku: products[12].sku, quantity: 1, unitPrice: 3100, totalPrice: 3100 },
        ],
      },
      statusHistory: {
        create: [{ status: 'novi', note: 'Porudžbina kreirana' }],
      },
    },
  })

  console.log('✅ Orders seeded')

  // ==================== REVIEWS ====================
  const majirelForReview = products.find(p => p.sku === 'LOR-MAJ-70')!
  await Promise.all([
    prisma.review.create({ data: { productId: majirelForReview.id, userId: b2cUser.id, rating: 5 } }),
    prisma.review.create({ data: { productId: majirelForReview.id, userId: b2bUser.id, rating: 4 } }),
    prisma.review.create({ data: { productId: majirelForReview.id, userId: b2cUser2.id, rating: 5 } }),
    prisma.review.create({ data: { productId: products[9].id, userId: b2cUser.id, rating: 5 } }),
    prisma.review.create({ data: { productId: products[10].id, userId: b2cUser.id, rating: 4 } }),
  ])

  console.log('✅ Reviews seeded')

  // ==================== NEWSLETTER SUBSCRIBERS ====================
  await Promise.all([
    prisma.newsletterSubscriber.create({ data: { email: 'marija@gmail.com', segment: 'b2c' } }),
    prisma.newsletterSubscriber.create({ data: { email: 'salon.glamour@gmail.com', segment: 'b2b' } }),
    prisma.newsletterSubscriber.create({ data: { email: 'beauty.studio.ns@gmail.com', segment: 'b2b' } }),
    prisma.newsletterSubscriber.create({ data: { email: 'ana.jovanovic@gmail.com', segment: 'b2c' } }),
    prisma.newsletterSubscriber.create({ data: { email: 'petar.nikolic@gmail.com', segment: 'b2c' } }),
    prisma.newsletterSubscriber.create({ data: { email: 'hair.art.studio@gmail.com', segment: 'b2b' } }),
  ])

  console.log('✅ Newsletter Subscribers seeded')

  // ==================== FAQs ====================
  await Promise.all([
    prisma.faq.create({ data: { questionLat: 'Koliko traje dostava?', answerLat: 'Standardna dostava traje 2-4 radna dana. Express dostava je dostupna za 1 radni dan za porudžbine primljene do 14h.', category: 'Porudžbine i dostava', sortOrder: 1 } }),
    prisma.faq.create({ data: { questionLat: 'Koliko košta dostava?', answerLat: 'Standardna dostava košta 350 RSD. Za porudžbine preko 5.000 RSD dostava je besplatna. Express dostava košta 690 RSD.', category: 'Porudžbine i dostava', sortOrder: 2 } }),
    prisma.faq.create({ data: { questionLat: 'Mogu li da pratim svoju porudžbinu?', answerLat: 'Da! Nakon slanja porudžbine dobićete email sa brojem za praćenje pošiljke putem D Express kurirske službe.', category: 'Porudžbine i dostava', sortOrder: 3 } }),
    prisma.faq.create({ data: { questionLat: 'Koji načini plaćanja su dostupni?', answerLat: 'Prihvatamo plaćanje karticama (Visa, Mastercard), pouzeće, i bankovni transfer. B2B korisnici mogu da plate i fakturom.', category: 'Plaćanje', sortOrder: 4 } }),
    prisma.faq.create({ data: { questionLat: 'Da li je plaćanje karticom sigurno?', answerLat: 'Apsolutno. Koristimo 3D Secure autentifikaciju i SSL enkripciju za sve transakcije.', category: 'Plaćanje', sortOrder: 5 } }),
    prisma.faq.create({ data: { questionLat: 'Kako da se registrujem kao B2B korisnik?', answerLat: 'Registrujte se sa PIB-om i matičnim brojem vašeg salona. Vaš zahtev će biti pregledan u roku od 24h.', category: 'B2B Program', sortOrder: 6 } }),
    prisma.faq.create({ data: { questionLat: 'Koje su prednosti B2B programa?', answerLat: 'B2B korisnici dobijaju ekskluzivne cene, pristup profesionalnim proizvodima, mogućnost plaćanja fakturom i brzu porudžbinu.', category: 'B2B Program', sortOrder: 7 } }),
    prisma.faq.create({ data: { questionLat: 'Da li su svi proizvodi originalni?', answerLat: 'Da, svi naši proizvodi su 100% originalni i dolaze direktno od ovlašćenih distributera.', category: 'Proizvodi', sortOrder: 8 } }),
    prisma.faq.create({ data: { questionLat: 'Kako da vratim proizvod?', answerLat: 'Proizvod možete vratiti u roku od 14 dana od prijema. Proizvod mora biti neotvoren i u originalnom pakovanju.', category: 'Reklamacije i povrat', sortOrder: 9 } }),
  ])

  console.log('✅ FAQs seeded')

  // ==================== ERP SYNC LOGS ====================
  await Promise.all([
    prisma.erpSyncLog.create({ data: { syncType: 'products', direction: 'inbound', itemsSynced: 342, status: 'success', message: 'Uspešna sinhronizacija proizvoda', startedAt: new Date('2026-03-19T08:00:00'), completedAt: new Date('2026-03-19T08:02:30') } }),
    prisma.erpSyncLog.create({ data: { syncType: 'stock', direction: 'inbound', itemsSynced: 342, status: 'success', message: 'Uspešna sinhronizacija zaliha', startedAt: new Date('2026-03-19T09:00:00'), completedAt: new Date('2026-03-19T09:00:45') } }),
    prisma.erpSyncLog.create({ data: { syncType: 'orders', direction: 'outbound', itemsSynced: 3, status: 'success', message: 'Poslate 3 nove porudžbine', startedAt: new Date('2026-03-19T10:00:00'), completedAt: new Date('2026-03-19T10:00:15') } }),
  ])

  console.log('✅ ERP Sync Logs seeded')

  // ==================== SITE SETTINGS ====================
  const siteSettings: Record<string, string> = {
    storeName: 'Alta Moda',
    storeEmail: 'info@altamoda.rs',
    storePhone: '+381 11 123 4567',
    storeAddress: 'Knez Mihailova 22, 11000 Beograd',
    warehouseAddress: '',
    instagram: 'https://instagram.com/altamoda.rs',
    facebook: 'https://facebook.com/altamoda.rs',
    tiktok: '',
    hours_monday: '09:00 - 18:00',
    hours_tuesday: '09:00 - 18:00',
    hours_wednesday: '09:00 - 18:00',
    hours_thursday: '09:00 - 18:00',
    hours_friday: '09:00 - 18:00',
    hours_saturday: '10:00 - 15:00',
    hours_sunday: '',
  }

  for (const [key, value] of Object.entries(siteSettings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    })
  }

  console.log('✅ Site Settings seeded')

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
