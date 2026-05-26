/**
 * Create (or refresh) a 1 RSD test product so the acquirer can run a live
 * production card payment. Idempotent — safe to run more than once; it upserts
 * by SKU and only adds a placeholder image the first time.
 *
 * Run against whichever database you want the product to exist in. For the
 * bank's production test, point DATABASE_URL at PRODUCTION:
 *
 *   DATABASE_URL="<prod connection string>" npx tsx scripts/create-test-product.ts
 *
 * When testing is done, deactivate it from the admin panel (set "active" off) or
 * re-run with PRICE/STOCK changed.
 */
import 'dotenv/config'
import { prisma } from '../src/lib/db'

const SKU = 'VPOS-TEST-1RSD'
const SLUG = 'vpos-test-1-rsd'

async function main() {
  const product = await prisma.product.upsert({
    where: { sku: SKU },
    update: { priceB2c: 1, stockQuantity: 100, isActive: true },
    create: {
      sku: SKU,
      slug: SLUG,
      nameLat: 'VPOS test proizvod (1 RSD)',
      nameCyr: 'ВПОС тест производ (1 РСД)',
      description:
        'Test proizvod za proveru online plaćanja platnom karticom. Cena 1 RSD.',
      priceB2c: 1,
      stockQuantity: 100,
      isActive: true,
      isProfessional: false,
      vatRate: 20,
    },
  })

  // Ensure at least one image so the product detail page renders cleanly.
  const imgCount = await prisma.productImage.count({ where: { productId: product.id } })
  if (imgCount === 0) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: '/hero.png',
        altText: 'VPOS test proizvod',
        isPrimary: true,
        sortOrder: 0,
      },
    })
  }

  console.log('✓ Test product ready')
  console.log(`  Name:  ${product.nameLat}`)
  console.log(`  SKU:   ${product.sku}`)
  console.log(`  Price: ${Number(product.priceB2c)} RSD · stock ${product.stockQuantity} · active ${product.isActive}`)
  console.log(`  URL:   /products/${product.slug}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
