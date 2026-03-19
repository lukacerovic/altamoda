import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'

// GET /api/brands — All active brands with product lines
export const GET = withErrorHandler(async () => {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    include: {
      productLines: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  return successResponse(brands)
})

// POST /api/brands — Create brand (admin)
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json()

  const { name, description, logoUrl } = body
  if (!name) return errorResponse('Naziv brenda je obavezan', 400)

  const slug = slugify(name)
  const existing = await prisma.brand.findUnique({ where: { slug } })
  if (existing) return errorResponse('Brend sa ovim nazivom već postoji', 409)

  const brand = await prisma.brand.create({
    data: { name, slug, description, logoUrl },
  })

  return successResponse(brand, 201)
})
