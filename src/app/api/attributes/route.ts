import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'

// GET /api/attributes — All filterable attributes with options
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const filtersOnly = searchParams.get('filters') === 'true'

  const attributes = await prisma.dynamicAttribute.findMany({
    where: filtersOnly ? { showInFilters: true } : {},
    include: {
      options: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return successResponse(attributes)
})

// POST /api/attributes — Create attribute (admin)
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json()

  const { nameLat, nameCyr, type, filterable, showInFilters, options } = body
  if (!nameLat) return errorResponse('Naziv atributa je obavezan', 400)

  const slug = slugify(nameLat)
  const existing = await prisma.dynamicAttribute.findUnique({ where: { slug } })
  if (existing) return errorResponse('Atribut sa ovim nazivom već postoji', 409)

  const attribute = await prisma.dynamicAttribute.create({
    data: {
      nameLat,
      nameCyr,
      slug,
      type: type || 'boolean',
      filterable: filterable ?? true,
      showInFilters: showInFilters ?? true,
      options: options?.length
        ? {
            create: options.map((opt: string, i: number) => ({
              value: opt,
              sortOrder: i,
            })),
          }
        : undefined,
    },
    include: { options: true },
  })

  return successResponse(attribute, 201)
})
