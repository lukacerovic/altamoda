import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import ProductsPageClient from "./ProductsPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const total = await prisma.product.count({ where: { isActive: true } });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.altamoda.rs";
  return {
    title: `Svi Proizvodi (${total})`,
    description:
      "Pregledajte kompletnu ponudu profesionalnih proizvoda za kosu — boje, negu, styling i aparate. Brendovi: L'Oreal, Schwarzkopf, Kerastase, Olaplex i drugi.",
    alternates: {
      canonical: `${baseUrl}/products`,
    },
    openGraph: {
      title: "Svi Proizvodi | Alta Moda",
      description:
        "Profesionalni proizvodi za kosu — boje, nega, styling. Više od 300 artikala poznatih brendova.",
      type: "website",
      url: `${baseUrl}/products`,
    },
  };
}

// Helper to build a nested category tree
interface CategoryNode {
  id: string;
  nameLat: string;
  slug: string;
  parentId: string | null;
  children: CategoryNode[];
}

function buildCategoryTree(
  flatCategories: { id: string; nameLat: string; slug: string; parentId: string | null; sortOrder: number }[]
): CategoryNode[] {
  const map = new Map<string | null, CategoryNode[]>();

  for (const cat of flatCategories) {
    const node: CategoryNode = {
      id: cat.id,
      nameLat: cat.nameLat,
      slug: cat.slug,
      parentId: cat.parentId,
      children: [],
    };
    if (!map.has(cat.parentId)) {
      map.set(cat.parentId, []);
    }
    map.get(cat.parentId)!.push(node);
  }

  function attachChildren(parentId: string | null): CategoryNode[] {
    const nodes = map.get(parentId) || [];
    for (const node of nodes) {
      node.children = attachChildren(node.id);
    }
    return nodes;
  }

  return attachChildren(null);
}

export default async function ProductsPage() {
  // Get session / user role
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  const userRole = user?.role ?? null;

  // Determine visibility filter based on role
  const visibilityWhere =
    userRole === "b2c"
      ? { isProfessional: false }
      : userRole === "b2b"
        ? { isProfessional: true }
        : {};

  // Fetch initial products (page 1, limit 12)
  const limit = 12;
  const [rawProducts, total] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, ...visibilityWhere },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, nameLat: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        colorProduct: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.product.count({ where: { isActive: true, ...visibilityWhere } }),
  ]);

  // Get average ratings
  const productIds = rawProducts.map((p) => p.id);
  const ratings = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
  });
  const ratingMap = new Map(ratings.map((r) => [r.productId, r._avg.rating || 0]));

  // Format products
  const initialProducts = rawProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.nameLat,
    slug: p.slug,
    brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
    category: p.category ? { id: p.category.id, nameLat: p.category.nameLat, slug: p.category.slug } : null,
    price: userRole === "b2b" && p.priceB2b ? Number(p.priceB2b) : Number(p.priceB2c),
    priceB2c: Number(p.priceB2c),
    priceB2b: p.priceB2b ? Number(p.priceB2b) : null,
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    image: p.images[0]?.url || null,
    isProfessional: p.isProfessional,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    stockQuantity: p.stockQuantity,
    rating: ratingMap.get(p.id) || 0,
    reviewCount: p._count.reviews,
    colorProduct: p.colorProduct
      ? {
          id: p.colorProduct.id,
          colorLevel: p.colorProduct.colorLevel,
          undertoneCode: p.colorProduct.undertoneCode,
          undertoneName: p.colorProduct.undertoneName,
          hexValue: p.colorProduct.hexValue,
          shadeCode: p.colorProduct.shadeCode,
        }
      : null,
  }));

  const initialPagination = {
    page: 1,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  // Fetch brands
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  // Fetch categories and build tree
  const flatCategories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, nameLat: true, slug: true, parentId: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  const categories = buildCategoryTree(flatCategories);

  // Fetch dynamic attributes (for filter toggles)
  const attributes = await prisma.dynamicAttribute.findMany({
    where: { showInFilters: true },
    select: {
      id: true,
      nameLat: true,
      slug: true,
      type: true,
      options: { select: { id: true, value: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Fetch available color facets (only colors that exist on active products)
  const colorProducts = await prisma.colorProduct.findMany({
    where: { product: { isActive: true } },
    select: {
      colorLevel: true,
      undertoneCode: true,
      undertoneName: true,
      hexValue: true,
    },
  });

  const colorLevelMap = new Map<number, { count: number; hexSamples: string[] }>();
  const colorUndertoneMap = new Map<string, { name: string; count: number; hexSamples: string[] }>();

  for (const cp of colorProducts) {
    const lv = colorLevelMap.get(cp.colorLevel);
    if (lv) {
      lv.count++;
      if (lv.hexSamples.length < 3 && !lv.hexSamples.includes(cp.hexValue)) lv.hexSamples.push(cp.hexValue);
    } else {
      colorLevelMap.set(cp.colorLevel, { count: 1, hexSamples: [cp.hexValue] });
    }

    const ut = colorUndertoneMap.get(cp.undertoneCode);
    if (ut) {
      ut.count++;
      if (ut.hexSamples.length < 3 && !ut.hexSamples.includes(cp.hexValue)) ut.hexSamples.push(cp.hexValue);
    } else {
      colorUndertoneMap.set(cp.undertoneCode, { name: cp.undertoneName, count: 1, hexSamples: [cp.hexValue] });
    }
  }

  const availableColorLevels = Array.from(colorLevelMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, data]) => ({ level, count: data.count, hexSamples: data.hexSamples }));

  const availableColorUndertones = Array.from(colorUndertoneMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, data]) => ({ code, name: data.name, count: data.count, hexSamples: data.hexSamples }));

  // Fetch user's wishlisted product IDs
  let wishlistedIds: string[] = [];
  if (session?.user?.id) {
    const wishlisted = await prisma.wishlist.findMany({
      where: { userId: session.user.id as string },
      select: { productId: true },
    });
    wishlistedIds = wishlisted.map((w) => w.productId);
  }

  return (
    <ProductsPageClient
      initialProducts={initialProducts}
      initialPagination={initialPagination}
      brands={brands}
      categories={categories}
      attributes={attributes}
      userRole={userRole}
      wishlistedProductIds={wishlistedIds}
      availableColorLevels={availableColorLevels}
      availableColorUndertones={availableColorUndertones}
    />
  );
}
