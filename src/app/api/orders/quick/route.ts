import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireB2b } from '@/lib/auth-helpers'
import { z } from 'zod'

const quickOrderSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('sku'),
    sku: z.string().min(1),
  }),
  z.object({
    type: z.literal('csv'),
    rows: z.array(
      z.object({
        sku: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
      })
    ).min(1),
  }),
  z.object({
    type: z.literal('repeat'),
    orderId: z.string().min(1),
  }),
])

// POST /api/orders/quick — B2B quick order operations
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireB2b()
  const body = await req.json()
  const input = quickOrderSchema.parse(body)

  if (input.type === 'sku') {
    // Look up product by SKU
    const product = await prisma.product.findFirst({
      where: { sku: { equals: input.sku, mode: 'insensitive' }, isActive: true },
      include: {
        brand: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    })

    if (!product) {
      throw new ApiError(404, 'Proizvod sa tom šifrom nije pronađen')
    }

    return successResponse({
      id: product.id,
      sku: product.sku,
      name: product.nameLat,
      brand: product.brand?.name ?? '',
      price: Number(product.priceB2b ?? product.priceB2c),
      stockQuantity: product.stockQuantity,
      image: product.images[0]?.url ?? '',
    })
  }

  if (input.type === 'csv') {
    // Parse CSV rows, validate SKUs, return preview
    const skus = input.rows.map((r) => r.sku)
    const products = await prisma.product.findMany({
      where: { sku: { in: skus, mode: 'insensitive' }, isActive: true },
      include: {
        brand: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    })

    const productMap = new Map(products.map((p) => [p.sku.toLowerCase(), p]))

    const items = input.rows.map((row) => {
      const product = productMap.get(row.sku.toLowerCase())
      if (!product) {
        return {
          sku: row.sku,
          quantity: row.quantity,
          found: false,
          name: null,
          price: null,
          totalPrice: null,
          inStock: false,
        }
      }
      const price = Number(product.priceB2b ?? product.priceB2c)
      return {
        sku: product.sku,
        quantity: row.quantity,
        found: true,
        productId: product.id,
        name: product.nameLat,
        brand: product.brand?.name ?? '',
        price,
        totalPrice: price * row.quantity,
        inStock: product.stockQuantity >= row.quantity,
        image: product.images[0]?.url ?? '',
      }
    })

    const foundItems = items.filter((i) => i.found)
    const totalValue = foundItems.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0)

    return successResponse({
      items,
      summary: {
        total: items.length,
        found: foundItems.length,
        notFound: items.length - foundItems.length,
        outOfStock: foundItems.filter((i) => !i.inStock).length,
        totalValue,
      },
    })
  }

  // type === 'repeat'
  // Copy items from a previous order at current prices
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  })

  if (!order || order.userId !== user.id) {
    throw new ApiError(404, 'Porudžbina nije pronađena')
  }

  const items = order.items.map((item) => {
    const currentPrice = Number(item.product.priceB2b ?? item.product.priceB2c)
    return {
      productId: item.productId,
      sku: item.productSku,
      name: item.productName,
      brand: item.product.brand?.name ?? '',
      quantity: item.quantity,
      price: currentPrice,
      totalPrice: currentPrice * item.quantity,
      inStock: item.product.stockQuantity >= item.quantity,
      image: item.product.images[0]?.url ?? '',
    }
  })

  return successResponse({ items })
})
