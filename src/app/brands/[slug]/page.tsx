import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import BrandPageClient from "./BrandPageClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug }, select: { name: true, description: true } });
  if (!brand) return { title: "Brand Not Found" };
  return {
    title: `${brand.name} | Alta Moda`,
    description: brand.description || `Discover ${brand.name} professional hair care products at Alta Moda.`,
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;

  const brand = await prisma.brand.findUnique({
    where: { slug },
  });

  if (!brand || !brand.isActive) notFound();

  const products = await prisma.product.findMany({
    where: { brandId: brand.id, isActive: true },
    include: {
      brand: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, nameLat: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { reviews: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  const productIds = products.map((p) => p.id);
  const ratings = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
  });
  const ratingMap = new Map(ratings.map((r) => [r.productId, r._avg.rating || 0]));

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.nameLat,
    slug: p.slug,
    brand: p.brand ? { name: p.brand.name, slug: p.brand.slug } : null,
    price: Number(p.priceB2c),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    image: p.images[0]?.url || null,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    stockQuantity: p.stockQuantity,
    rating: ratingMap.get(p.id) || 0,
    reviewCount: p._count.reviews,
  }));

  const totalProducts = await prisma.product.count({
    where: { brandId: brand.id, isActive: true },
  });

  return (
    <BrandPageClient
      brand={{
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
        description: brand.description,
        content: brand.content,
      }}
      products={formattedProducts}
      totalProducts={totalProducts}
    />
  );
}
