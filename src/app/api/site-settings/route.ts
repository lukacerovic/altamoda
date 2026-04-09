import { prisma } from '@/lib/db'
import { successResponse, withErrorHandler } from '@/lib/api-utils'

// GET /api/site-settings?keys=heroImage
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const keys = searchParams.get('keys')?.split(',').filter(Boolean)

  if (!keys?.length) return successResponse({})

  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  })

  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value

  return successResponse(map)
})
