import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'

// GET /api/categories — Full tree (recursive)
export const GET = withErrorHandler(async () => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }],
  })

  // Build tree structure
  const map = new Map<string, typeof categories[0] & { children: typeof categories }>()
  const roots: (typeof categories[0] & { children: typeof categories })[] = []

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] })
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!
    if (cat.parentId) {
      const parent = map.get(cat.parentId)
      if (parent) parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return successResponse(roots)
})

// POST /api/categories — Create category (admin)
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json()

  const { nameLat, nameCyr, parentId, sortOrder } = body

  if (!nameLat) return errorResponse('Naziv kategorije je obavezan', 400)

  const slug = slugify(nameLat)
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) return errorResponse('Kategorija sa ovim nazivom već postoji', 409)

  let depth = 0
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } })
    if (!parent) return errorResponse('Roditeljska kategorija nije pronađena', 404)
    depth = parent.depth + 1
  }

  const category = await prisma.category.create({
    data: {
      nameLat,
      nameCyr,
      slug,
      parentId: parentId || null,
      sortOrder: sortOrder || 0,
      depth,
    },
  })

  return successResponse(category, 201)
})
