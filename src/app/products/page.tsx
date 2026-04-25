export const revalidate = 60

import { Metadata } from "next";
import { prisma } from "@/lib/db";
import ProductsPageClient from "./ProductsPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const [rawTotal, groupedDups] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.groupBy({
      by: ['groupSlug'],
      where: { isActive: true, groupSlug: { not: null } },
      _count: true,
    }),
  ]);
  const duplicateCount = groupedDups.reduce((sum, g) => sum + g._count - 1, 0);
  const total = rawTotal - duplicateCount;
  return {
    title: `Svi Proizvodi (${total}) | Alta Moda`,
    description:
      "Pregledajte kompletnu ponudu profesionalnih proizvoda za kosu — boje, negu, styling i aparate. Brendovi: L'Oreal, Schwarzkopf, Kerastase, Olaplex i drugi.",
    openGraph: {
      title: "Svi Proizvodi | Alta Moda",
      description:
        "Profesionalni proizvodi za kosu — boje, nega, styling. Više od 300 artikala poznatih brendova.",
      type: "website",
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

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const brandSlug = typeof resolvedParams.brand === "string" ? resolvedParams.brand : null;

  // No auth() call — page is fully cacheable. Role-based filtering happens client-side via API.
  const limit = 12;
  // Storefront hides stock=0 entirely (admin grid shows everything via the API).
  const productWhere = { isActive: true, stockQuantity: { gt: 0 } };

  const [
    [rawProducts, rawTotal, groupedDups],
    brandsData,
    flatCategories,
    attributes,
    colorProducts,
    activeBrand,
  ] = await Promise.all([
    // Products + count (with color group deduplication)
    Promise.all([
      prisma.product.findMany({
        where: productWhere,
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
      prisma.product.count({ where: productWhere }),
      prisma.product.groupBy({
        by: ['groupSlug'],
        where: { ...productWhere, groupSlug: { not: null } },
        _count: true,
      }),
    ]),
    // Brands
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    // Categories — count only in-stock products to mirror what the storefront list returns.
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, nameLat: true, slug: true, parentId: true, sortOrder: true, _count: { select: { products: { where: { isActive: true, stockQuantity: { gt: 0 } } } } } },
      orderBy: { sortOrder: "asc" },
    }),
    // Dynamic attributes
    prisma.dynamicAttribute.findMany({
      where: { showInFilters: true },
      select: {
        id: true,
        nameLat: true,
        slug: true,
        type: true,
        options: { select: { id: true, value: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    // Color facets
    prisma.colorProduct.findMany({
      where: { product: { isActive: true } },
      select: { colorLevel: true, undertoneCode: true, undertoneName: true, hexValue: true },
    }),
    // Active brand (conditional)
    brandSlug
      ? prisma.brand.findUnique({
          where: { slug: brandSlug },
          select: { name: true, slug: true, logoUrl: true, description: true, content: true },
        })
      : Promise.resolve(null),
  ]);

  // Deduplicate color groups from total count
  const duplicateCount = groupedDups.reduce((sum: number, g: { _count: number }) => sum + g._count - 1, 0);
  const total = rawTotal - duplicateCount;

  // Get average ratings (needs product IDs from above)
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
    price: Number(p.priceB2c),
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

  const brands = brandsData;

  // Keep categories that have products directly OR have children with products
  const catProductCount = new Map(flatCategories.map(c => [c.id, c._count.products]));
  const hasChildrenWithProducts = (catId: string): boolean => {
    return flatCategories.some(c => c.parentId === catId && (catProductCount.get(c.id)! > 0 || hasChildrenWithProducts(c.id)));
  };
  const nonEmptyCategories = flatCategories
    .filter(c => catProductCount.get(c.id)! > 0 || hasChildrenWithProducts(c.id))
    .map(({ _count, ...rest }) => rest);

  const categories = buildCategoryTree(nonEmptyCategories);

  // Build color facet maps
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

  // Wishlist IDs and user role resolved client-side via useSession()
  return (
    <ProductsPageClient
      initialProducts={initialProducts}
      initialPagination={initialPagination}
      brands={brands}
      categories={categories}
      attributes={attributes}
      userRole={null}
      wishlistedProductIds={[]}
      availableColorLevels={availableColorLevels}
      availableColorUndertones={availableColorUndertones}
      activeBrand={activeBrand}
    />
  );
}
