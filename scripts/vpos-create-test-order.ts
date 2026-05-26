/**
 * Create a throwaway pending card order for local payment testing, then print
 * its orderNumber. Pair with scripts/vpos-simulate-notify.ts.
 *
 *   npx tsx scripts/vpos-create-test-order.ts
 */
import 'dotenv/config'
import { prisma } from '../src/lib/db'
import { generateOrderNumber } from '../src/lib/utils'

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'marija@gmail.com' } })
  if (!user) throw new Error('seed user marija@gmail.com not found — run: npx prisma db seed')
  const product = await prisma.product.findFirst({ where: { isActive: true } })
  if (!product) throw new Error('no active product found')

  const unit = Number(product.priceB2c)
  const orderNumber = generateOrderNumber()

  await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      status: 'novi',
      subtotal: unit,
      total: unit,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      shippingAddress: { street: 'Test 1', city: 'Beograd', postalCode: '11000', country: 'Srbija' },
      items: {
        create: [
          {
            productId: product.id,
            productName: product.nameLat,
            productSku: product.sku,
            quantity: 1,
            unitPrice: unit,
            totalPrice: unit,
          },
        ],
      },
    },
  })

  console.log(orderNumber)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
