import { prisma } from '@/lib/db'
import { getRouteParams } from '@/lib/route-utils'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// PUT /api/attributes/[id]
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const body = await req.json()

  const attribute = await prisma.dynamicAttribute.update({
    where: { id },
    data: {
      nameLat: body.nameLat,
      nameCyr: body.nameCyr,
      filterable: body.filterable,
      showInFilters: body.showInFilters,
      sortOrder: body.sortOrder,
    },
    include: { options: true },
  })

  return successResponse(attribute)
})

// DELETE /api/attributes/[id]
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  await prisma.dynamicAttribute.delete({ where: { id } })
  return successResponse({ deleted: true })
})
