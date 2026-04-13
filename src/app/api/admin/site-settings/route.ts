import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/admin/site-settings?keys=heroImage,other
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const keys = searchParams.get('keys')?.split(',').filter(Boolean)

  const settings = await prisma.siteSetting.findMany({
    where: keys?.length ? { key: { in: keys } } : undefined,
  })

  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value

  return successResponse(map)
})

// PUT /api/admin/site-settings
export const PUT = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body: Record<string, string> = await req.json()

  if (!body || typeof body !== 'object') {
    return errorResponse('Nevalidan zahtev', 400)
  }

  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  )

  // Bust the ISR cache so the homepage picks up new hero images immediately
  revalidatePath('/')

  return successResponse({ updated: Object.keys(body) })
})
