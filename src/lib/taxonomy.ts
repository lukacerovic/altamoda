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
