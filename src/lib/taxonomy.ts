import { prisma } from './db'
import { slugify } from './utils'

// Resolve a category by name, creating the row if it doesn't exist. When
// `subName` is provided, the parent is resolved/created first and the sub is
// returned as a child — so the most specific level is what gets attached to
// the product. Returning that ID means the product appears under both parent
// and sub when the storefront walks the tree.
export async function resolveCategoryId(
  name: string | null | undefined,
  subName?: string | null | undefined,
): Promise<string | null> {
  const parentName = name?.trim()
  if (!parentName) return null

  const parentSlug = slugify(parentName)
  const parent = await prisma.category.upsert({
    where: { slug: parentSlug },
    update: {},
    create: { nameLat: parentName, slug: parentSlug, depth: 0, parentId: null },
  })

  const childName = subName?.trim()
  if (!childName) return parent.id

  // Sub slugs need to be unique under their parent; prefix with the parent
  // slug so two parents can both have a "Sprejevi" subcategory without slug
  // collision (Category.slug is globally unique in the schema).
  const childSlug = slugify(`${parentName}-${childName}`)
  const child = await prisma.category.upsert({
    where: { slug: childSlug },
    update: {},
    create: {
      nameLat: childName,
      slug: childSlug,
      parentId: parent.id,
      depth: parent.depth + 1,
    },
  })
  return child.id
}

export async function resolveBrandId(
  name: string | null | undefined,
): Promise<string | null> {
  const trimmed = name?.trim()
  if (!trimmed) return null

  const slug = slugify(trimmed)
  const brand = await prisma.brand.upsert({
    where: { slug },
    update: {},
    create: { name: trimmed, slug },
  })
  return brand.id
}

export async function resolveProductLineId(
  brandId: string | null,
  name: string | null | undefined,
): Promise<string | null> {
  const trimmed = name?.trim()
  if (!brandId || !trimmed) return null

  const slug = slugify(`${brandId}-${trimmed}`)
  const line = await prisma.productLine.upsert({
    where: { slug },
    update: {},
    create: { name: trimmed, slug, brandId },
  })
  return line.id
}

// Delete a brand if it no longer has any products linked to it. Brand-scoped
// product lines cascade with it (a line under a brand with zero products is
// also orphan by definition). Use this after a product is moved to another
// brand or hard-deleted, so dead "Patka"-style entries don't linger in the
// brand filter / nav.
export async function cleanupOrphanBrand(
  brandId: string | null | undefined,
): Promise<void> {
  if (!brandId) return
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, _count: { select: { products: true } } },
  })
  if (!brand) return
  if (brand._count.products > 0) return

  // Brand has no products → its product lines (if any) are necessarily empty
  // too. The schema doesn't cascade so we delete them explicitly first.
  await prisma.productLine.deleteMany({ where: { brandId: brand.id } })
  await prisma.brand.delete({ where: { id: brand.id } })
}

// Bulk variant: scan the brands table once and remove every brand without
// products. Safe for use after bulk imports or as a one-off cleanup.
export async function sweepOrphanBrands(): Promise<{ deleted: string[] }> {
  const orphans = await prisma.brand.findMany({
    where: { products: { none: {} } },
    select: { id: true, name: true },
  })
  for (const o of orphans) {
    await prisma.productLine.deleteMany({ where: { brandId: o.id } })
    await prisma.brand.delete({ where: { id: o.id } })
  }
  return { deleted: orphans.map(o => `${o.id} ${o.name}`) }
}

// Delete a category if it no longer has any products or child categories
// linked to it, then walk up to its parent and try the same. Soft-deleted
// products still pin their category — only true zero-link categories go.
export async function cleanupOrphanCategory(
  categoryId: string | null | undefined,
): Promise<void> {
  if (!categoryId) return
  const cat = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      parentId: true,
      _count: { select: { products: true, children: true } },
    },
  })
  if (!cat) return
  if (cat._count.products > 0 || cat._count.children > 0) return

  await prisma.category.delete({ where: { id: cat.id } })

  if (cat.parentId) {
    await cleanupOrphanCategory(cat.parentId)
  }
}

// Bulk variant: scan the categories table for rows with neither products
// nor children and remove them in passes (deepest first so parents that
// lose their last child this pass also get removed).
export async function sweepOrphanCategories(): Promise<{ deleted: string[] }> {
  const deleted: string[] = []
  for (let i = 0; i < 20; i++) {
    const orphans = await prisma.category.findMany({
      where: { products: { none: {} }, children: { none: {} } },
      select: { id: true, nameLat: true },
    })
    if (orphans.length === 0) break
    for (const o of orphans) {
      await prisma.category.delete({ where: { id: o.id } })
      deleted.push(`${o.id} ${o.nameLat}`)
    }
  }
  return { deleted }
}
