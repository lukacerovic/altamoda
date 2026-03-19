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
    prisma.product.upsert({
      where: { sku: 'LOR-MAJ-70' },
      update: {},
      create: { sku: 'LOR-MAJ-70', nameLat: 'Majirel 7.0 - Srednje Plava Boja za Kosu', slug: 'majirel-7-0-srednje-plava', brandId: loreal.id, productLineId: productLines[0].id, categoryId: bojeZaKosu.id, description: 'Permanentna profesionalna boja za kosu sa dubokim pokrivanjem sedih.', ingredients: 'Aqua, Cetearyl Alcohol, Propylene Glycol, Deceth-3, Laureth-12...', usageInstructions: 'Pomešajte 1:1 sa oksidantom. Nanesite i ostavite 35 minuta.', priceB2c: 890, priceB2b: 650, oldPrice: 1290, stockQuantity: 23, volumeMl: 60, isProfessional: true, isFeatured: true },
    }),
    prisma.product.upsert({
      where: { sku: 'SCH-IR-71' },
      update: {},
      create: { sku: 'SCH-IR-71', nameLat: 'Igora Royal 7-1 Pepeljasto Plava 60ml', slug: 'igora-royal-7-1-pepeljasto-plava', brandId: schwarzkopf.id, productLineId: productLines[1].id, categoryId: bojeZaKosu.id, description: 'Profesionalna permanentna boja za kosu.', priceB2c: 790, priceB2b: 580, stockQuantity: 0, volumeMl: 60, isProfessional: true },
    }),

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
  const majirelProduct = products.find(p => p.sku === 'LOR-MAJ-70')!
  const igoraProduct = products.find(p => p.sku === 'SCH-IR-71')!

  await prisma.colorProduct.upsert({
    where: { productId: majirelProduct.id },
    update: {},
    create: { productId: majirelProduct.id, colorLevel: 7, undertoneCode: 'N', undertoneName: 'Neutralni', hexValue: '#8B6914', shadeCode: '7.0' },
  })
  await prisma.colorProduct.upsert({
    where: { productId: igoraProduct.id },
    update: {},
    create: { productId: igoraProduct.id, colorLevel: 7, undertoneCode: 'A', undertoneName: 'Pepeljasti', hexValue: '#7B7156', shadeCode: '7-1' },
  })

  console.log('✅ Color Products seeded')

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
  await Promise.all([
    prisma.review.create({ data: { productId: majirelProduct.id, userId: b2cUser.id, rating: 5 } }),
    prisma.review.create({ data: { productId: majirelProduct.id, userId: b2bUser.id, rating: 4 } }),
    prisma.review.create({ data: { productId: majirelProduct.id, userId: b2cUser2.id, rating: 5 } }),
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
