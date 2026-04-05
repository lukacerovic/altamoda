export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import ColorsPageClient from './ColorsPageClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Boje za Kosu | Alta Moda',
  description: 'Profesionalna paleta boja za kosu. Odaberite savršen ton iz naše kolekcije Majirel, Igora Royal, Koleston i INOA nijansi.',
}

export default async function ColorsPage() {
  // Fetch brand lines that have color products
  const brandLines = await prisma.productLine.findMany({
    where: {
      products: {
        some: {
          isActive: true,
          colorProduct: { isNot: null },
        },
      },
    },
    include: {
      brand: { select: { name: true } },
      _count: {
        select: {
          products: {
            where: { isActive: true, colorProduct: { isNot: null } },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const formattedBrandLines = brandLines.map(bl => ({
    slug: bl.slug,
    name: bl.name,
    brand: bl.brand.name,
    count: bl._count.products,
  }))

  // Fetch initial colors for first brand line
  const firstBrandLine = brandLines[0]
  let initialColors: {
    id: string; productId: string; name: string; slug: string;
    shadeCode: string; hexValue: string; level: number;
    undertoneCode: string; undertoneName: string; price: number;
    brand: { name: string; slug: string } | null;
    productLine: { name: string; slug: string } | null;
    image: string | null;
  }[] = []

  if (firstBrandLine) {
    const colors = await prisma.colorProduct.findMany({
      where: {
        product: {
          isActive: true,
          productLineId: firstBrandLine.id,
        },
      },
      include: {
        product: {
          include: {
            brand: { select: { name: true, slug: true } },
            productLine: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: [{ colorLevel: 'asc' }, { undertoneCode: 'asc' }],
    })

    initialColors = colors.map(c => ({
      id: c.id,
      productId: c.product.id,
      name: c.product.nameLat,
      slug: c.product.slug,
      shadeCode: c.shadeCode,
      hexValue: c.hexValue,
      level: c.colorLevel,
      undertoneCode: c.undertoneCode,
      undertoneName: c.undertoneName,
      price: Number(c.product.priceB2c),
      brand: c.product.brand,
      productLine: c.product.productLine,
      image: c.product.images[0]?.url || null,
    }))
  }

  return (
    <ColorsPageClient
      initialBrandLines={formattedBrandLines}
      initialColors={initialColors}
      initialTotal={initialColors.length}
    />
  )
}
