export const revalidate = 60

import { Metadata } from "next";
import { prisma } from "@/lib/db";
import ProductsPageClient from "./ProductsPageClient";
import { applyBestPromo, fetchActivePromosByProduct } from "@/lib/promotions";

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

  // ?page is the single source of truth for pagination — bookmarkable + SEO.
  // Clamp to ≥1; invalid values fall back to page 1.
  const rawPage = typeof resolvedParams.page === "string" ? resolvedParams.page : null;
  const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  // No auth() call — page is fully cacheable. Role-based filtering happens client-side via API.
  const limit = 20;
  const skip = (page - 1) * limit;
  // Storefront shows out-of-stock products too (they render a "Nema na stanju" button).
  // SSR is cached role-blind, so it pre-renders the public retail (B2C) view — the
  // default tab. Professional products and B2B prices only ever come from the
  // role-aware client refetch via /api/products.
  const baseWhere = { isActive: true, isProfessional: false };

  // Collapse color-variant groups to one representative per group_slug, mirroring
  // /api/products so the SSR landing matches the client-fetched (filtered) view.
  // Without this the initial render shows every shade of a color line as its own card.
  const groupedDups = await prisma.product.groupBy({
    by: ['groupSlug'],
    where: { ...baseWhere, groupSlug: { not: null } },
    _count: true,
  });
  const groupSlugsAll = groupedDups.map((g) => g.groupSlug).filter(Boolean) as string[];
  const excludeIds = new Set<string>();
  if (groupSlugsAll.length > 0) {
    const [reps, allInGroups] = await Promise.all([
      prisma.product.findMany({
        where: { groupSlug: { in: groupSlugsAll }, ...baseWhere },
        select: { id: true },
        orderBy: [{ stockQuantity: 'desc' }, { nameLat: 'asc' }],
        distinct: ['groupSlug'],
      }),
      prisma.product.findMany({
        where: { groupSlug: { in: groupSlugsAll }, ...baseWhere },
        select: { id: true },
      }),
    ]);
    const repIds = new Set(reps.map((r) => r.id));
    for (const p of allInGroups) if (!repIds.has(p.id)) excludeIds.add(p.id);
  }
  const productWhere = excludeIds.size > 0
    ? { ...baseWhere, NOT: { id: { in: Array.from(excludeIds) } } }
    : baseWhere;

  const [
    [rawProducts, rawTotal],
    brandsData,
    flatCategories,
    productLinesData,
    productTypeRows,
    hairTypeRows,
    tagRows,
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
        skip,
        take: limit,
      }),
      prisma.product.count({ where: productWhere }),
    ]),
    // Brands
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    // Categories — count active products (in- and out-of-stock) to mirror the storefront list.
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, nameLat: true, slug: true, parentId: true, sortOrder: true, _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { sortOrder: "asc" },
    }),
    // Product lines — only those with at least one active product.
    prisma.productLine.findMany({
      where: {
        products: { some: { isActive: true } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { name: "asc" },
    }),
    // Distinct product types (single value per row)
    prisma.$queryRaw<Array<{ value: string }>>`
      SELECT DISTINCT TRIM(product_type) AS value FROM products
      WHERE is_active = true
        AND product_type IS NOT NULL AND TRIM(product_type) != ''
      ORDER BY value
    `,
    // Distinct hair types — comma-split, unnested, then re-filtered to drop
    // empty fragments produced by trailing/double commas (e.g. "hidratacija,").
    prisma.$queryRaw<Array<{ value: string }>>`
      SELECT DISTINCT v AS value FROM (
        SELECT TRIM(unnest(string_to_array(hair_types, ','))) AS v FROM products
        WHERE is_active = true
          AND hair_types IS NOT NULL AND TRIM(hair_types) != ''
      ) sub
      WHERE v <> ''
      ORDER BY v
    `,
    // Distinct tags — same anti-empty-fragment guard as hair_types above.
    prisma.$queryRaw<Array<{ value: string }>>`
      SELECT DISTINCT v AS value FROM (
        SELECT TRIM(unnest(string_to_array(tags, ','))) AS v FROM products
        WHERE is_active = true
          AND tags IS NOT NULL AND TRIM(tags) != ''
      ) sub
      WHERE v <> ''
      ORDER BY v
    `,
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

  // productWhere already excludes non-representative group members, so the row
  // count is the deduplicated total directly.
  const total = rawTotal;

  // Get average ratings + active promotions in parallel (one query each)
  const productIds = rawProducts.map((p) => p.id);
  const [ratings, promosByProduct] = await Promise.all([
    prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
    }),
    fetchActivePromosByProduct(productIds),
  ]);
  const ratingMap = new Map(ratings.map((r) => [r.productId, r._avg.rating || 0]));

  // Color siblings + variant counts for the grouped representatives, so the card
  // shows the "N colors" badge and swatch row (same shape as /api/products).
  const groupSlugsPresent = [...new Set(rawProducts.map((p) => p.groupSlug).filter(Boolean))] as string[];
  const [variantCounts, siblingRows] = await Promise.all([
    groupSlugsPresent.length
      ? prisma.product.groupBy({ by: ["groupSlug"], where: { groupSlug: { in: groupSlugsPresent }, isActive: true }, _count: true })
      : Promise.resolve([] as Array<{ groupSlug: string | null; _count: number }>),
    groupSlugsPresent.length
      ? prisma.product.findMany({
          where: { groupSlug: { in: groupSlugsPresent }, isActive: true },
          select: {
            id: true, slug: true, nameLat: true, sku: true, priceB2c: true,
            colorCode: true, colorName: true, groupSlug: true, stockQuantity: true,
            brand: { select: { name: true } },
            images: { where: { isPrimary: true }, take: 1 },
            colorProduct: { select: { hexValue: true } },
          },
        })
      : Promise.resolve([]),
  ]);
  const variantCountMap = new Map(variantCounts.map((v) => [v.groupSlug!, v._count]));
  const siblingsByGroup = new Map<string, Array<{
    id: string; slug: string; name: string; sku: string; brand: string; price: number;
    image: string | null; colorCode: string | null; colorName: string | null; hex: string | null; stockQuantity: number;
  }>>();
  for (const s of siblingRows) {
    if (!s.groupSlug) continue;
    const arr = siblingsByGroup.get(s.groupSlug) || [];
    arr.push({
      id: s.id, slug: s.slug, name: s.nameLat, sku: s.sku, brand: s.brand?.name || "",
      price: Number(s.priceB2c), image: s.images[0]?.url || null,
      colorCode: s.colorCode, colorName: s.colorName, hex: s.colorProduct?.hexValue || null, stockQuantity: s.stockQuantity,
    });
    siblingsByGroup.set(s.groupSlug, arr);
  }

  // Format products. SSR is cached without auth so apply public ('all'/'b2c')
  // promo audience here — the client refetches via /api/products with the real
  // role for B2B viewers.
  const initialProducts = rawProducts.map((p) => {
    const basePrice = Number(p.priceB2c);
    const staticOld = p.oldPrice ? Number(p.oldPrice) : null;
    const { price, oldPrice } = applyBestPromo(promosByProduct.get(p.id) || [], basePrice, staticOld, "b2c");
    // Strip the color code from the name for grouped products -> clean group label.
    const displayName = p.groupSlug && p.colorCode
      ? p.nameLat.replace(p.colorCode, "").replace(/\/+/g, " ").replace(/\s{2,}/g, " ").trim()
      : p.nameLat;
    return {
    id: p.id,
    sku: p.sku,
    name: displayName,
    slug: p.slug,
    brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
    category: p.category ? { id: p.category.id, nameLat: p.category.nameLat, slug: p.category.slug } : null,
    price,
    priceB2c: Number(p.priceB2c),
    // Never serialize B2B prices into the cached public HTML — B2B viewers get
    // them from the role-aware client refetch.
    priceB2b: null,
    oldPrice,
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
    groupSlug: p.groupSlug,
    variantCount: p.groupSlug ? variantCountMap.get(p.groupSlug) || 0 : 0,
    colorSiblings: p.groupSlug ? (siblingsByGroup.get(p.groupSlug) || undefined) : undefined,
    };
  });

  const initialPagination = {
    page,
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
      productLines={productLinesData}
      productTypes={productTypeRows.map(r => r.value).filter(Boolean)}
      hairTypes={hairTypeRows.map(r => r.value).filter(Boolean)}
      tags={tagRows.map(r => r.value).filter(Boolean)}
      attributes={attributes}
      userRole={null}
      wishlistedProductIds={[]}
      availableColorLevels={availableColorLevels}
      availableColorUndertones={availableColorUndertones}
      activeBrand={activeBrand}
    />
  );
}
