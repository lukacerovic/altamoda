import { prisma } from '@/lib/db'
import { getRouteParams } from '@/lib/route-utils'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'

// GET /api/brands/[id] — Get single brand with content
export const GET = withErrorHandler(async (_req: Request, context: unknown) => {
  const { id } = await getRouteParams<{ id: string }>(context)

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      productLines: { orderBy: { name: 'asc' } },
      _count: { select: { products: true } },
    },
  })

  if (!brand) return errorResponse('Brend nije pronađen', 404)

  return successResponse(brand)
})

// PUT /api/brands/[id] — Update brand (admin)
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)
  const body = await req.json()

  const existing = await prisma.brand.findUnique({ where: { id } })
  if (!existing) return errorResponse('Brend nije pronađen', 404)

  const updateData: Record<string, unknown> = {}
  if ('name' in body) {
    updateData.name = body.name
    if (body.name !== existing.name) {
      updateData.slug = slugify(body.name)
    }
  }
  if ('logoUrl' in body) updateData.logoUrl = body.logoUrl
  if ('description' in body) updateData.description = body.description
  if ('content' in body) updateData.content = body.content

  const brand = await prisma.brand.update({
    where: { id },
    data: updateData,
  })

  return successResponse(brand)
})
