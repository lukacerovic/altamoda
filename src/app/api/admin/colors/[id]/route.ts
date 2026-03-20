import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// PUT /api/admin/colors/[id] - Update color product
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : { id: '' }

  const body = await req.json()
  const { colorLevel, undertoneCode, undertoneName, hexValue, shadeCode } = body

  const existing = await prisma.colorProduct.findUnique({ where: { id } })
  if (!existing) return errorResponse('Boja nije pronađena', 404)

  const updated = await prisma.colorProduct.update({
    where: { id },
    data: {
      ...(colorLevel !== undefined && { colorLevel: Number(colorLevel) }),
      ...(undertoneCode !== undefined && { undertoneCode }),
      ...(undertoneName !== undefined && { undertoneName }),
      ...(hexValue !== undefined && { hexValue }),
      ...(shadeCode !== undefined && { shadeCode }),
    },
    include: {
      product: {
        include: {
          brand: { select: { name: true, slug: true } },
          productLine: { select: { name: true, slug: true } },
        },
      },
    },
  })

  return successResponse(updated)
})

// DELETE /api/admin/colors/[id] - Remove color data from product
export const DELETE = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : { id: '' }

  const existing = await prisma.colorProduct.findUnique({ where: { id } })
  if (!existing) return errorResponse('Boja nije pronađena', 404)

  await prisma.colorProduct.delete({ where: { id } })

  return successResponse({ deleted: true })
})
