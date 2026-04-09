import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Temporary endpoint to export production data for local DB sync
// DELETE THIS FILE after use
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'altamoda-sync-2026') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const table = req.nextUrl.searchParams.get('table')
  if (!table) {
    // Return list of tables with counts
    const [brands, categories, products, productImages, productLines, colorProducts,
      users, orders, orderItems, reviews, b2bProfiles, attributes, productAttributes,
      wishlistItems, cartItems, newsletterSubscribers, newsletterCampaigns, promotions
    ] = await Promise.all([
      prisma.brand.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.productImage.count(),
      prisma.productLine.count(),
      prisma.colorProduct.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.review.count(),
      prisma.b2bProfile.count(),
      prisma.attribute.count(),
      prisma.productAttribute.count(),
      prisma.wishlistItem.count(),
      prisma.cartItem.count(),
      prisma.newsletterSubscriber.count(),
      prisma.newsletterCampaign.count(),
      prisma.promotion.count(),
    ])
    return NextResponse.json({
      brands, categories, products, productImages, productLines, colorProducts,
      users, orders, orderItems, reviews, b2bProfiles, attributes, productAttributes,
      wishlistItems, cartItems, newsletterSubscribers, newsletterCampaigns, promotions
    })
  }

  const page = parseInt(req.nextUrl.searchParams.get('page') || '0')
  const limit = 200

  let data: unknown[] = []
  const opts = { skip: page * limit, take: limit }

  switch (table) {
    case 'brands': data = await prisma.brand.findMany(opts); break
    case 'categories': data = await prisma.category.findMany(opts); break
    case 'products': data = await prisma.product.findMany(opts); break
    case 'productImages': data = await prisma.productImage.findMany(opts); break
    case 'productLines': data = await prisma.productLine.findMany(opts); break
    case 'colorProducts': data = await prisma.colorProduct.findMany(opts); break
    case 'users': data = await prisma.user.findMany({ ...opts, select: { id: true, name: true, email: true, role: true, status: true, phone: true, address: true, city: true, postalCode: true, createdAt: true, emailVerified: true } }); break
    case 'orders': data = await prisma.order.findMany(opts); break
    case 'orderItems': data = await prisma.orderItem.findMany(opts); break
    case 'reviews': data = await prisma.review.findMany(opts); break
    case 'b2bProfiles': data = await prisma.b2bProfile.findMany(opts); break
    case 'attributes': data = await prisma.attribute.findMany(opts); break
    case 'productAttributes': data = await prisma.productAttribute.findMany(opts); break
    case 'wishlistItems': data = await prisma.wishlistItem.findMany(opts); break
    case 'cartItems': data = await prisma.cartItem.findMany(opts); break
    case 'newsletterSubscribers': data = await prisma.newsletterSubscriber.findMany(opts); break
    case 'newsletterCampaigns': data = await prisma.newsletterCampaign.findMany(opts); break
    case 'promotions': data = await prisma.promotion.findMany({ ...opts, include: { products: true } }); break
    default: return NextResponse.json({ error: 'unknown table' }, { status: 400 })
  }

  return NextResponse.json({ table, page, count: data.length, data }, {
    headers: { 'Content-Type': 'application/json' }
  })
}
