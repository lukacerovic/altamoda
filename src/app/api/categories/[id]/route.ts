import { prisma } from '@/lib/db'
import { getRouteParams } from '@/lib/route-utils'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/categories/[id]
export const GET = withErrorHandler(async (_req: Request, context: unknown) => {
  const { id } = await getRouteParams<{ id: string }>(context)

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      parent: true,
    },
  })

  if (!category) return errorResponse('Kategorija nije pronađena', 404)
  return successResponse(category)
})

// PUT /api/categories/[id]
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const body = await req.json()

  const category = await prisma.category.update({
    where: { id },
    data: {
      nameLat: body.nameLat,
      nameCyr: body.nameCyr,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    },
  })

  return successResponse(category)
})

// DELETE /api/categories/[id] — soft delete
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  await prisma.category.update({
    where: { id },
    data: { isActive: false },
  })

  return successResponse({ deleted: true })
})
