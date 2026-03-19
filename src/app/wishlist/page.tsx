import { getCurrentUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import WishlistPageClient from './WishlistPageClient'

export default async function WishlistPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <WishlistPageClient items={[]} />
  }

  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          brand: true,
          images: { where: { isPrimary: true }, take: 1 },
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const items = wishlistItems.map((w) => {
    const avgRating =
      w.product.reviews.length > 0
        ? w.product.reviews.reduce((sum, r) => sum + r.rating, 0) / w.product.reviews.length
        : 0

    return {
      id: w.id,
      productId: w.productId,
      name: w.product.nameLat,
      brand: w.product.brand?.name ?? '',
      price: Number(user.role === 'b2b' && w.product.priceB2b
        ? w.product.priceB2b
        : w.product.priceB2c),
      oldPrice: w.product.oldPrice ? Number(w.product.oldPrice) : null,
      image: w.product.images[0]?.url ?? '',
      rating: Math.round(avgRating * 10) / 10,
      inStock: w.product.stockQuantity > 0,
      slug: w.product.slug,
    }
  })

  return <WishlistPageClient items={items} />
}
