import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { saveImageFromUrl } from '@/lib/upload'

// POST /api/admin/import-image — import a remote image URL into Cloudinary (admin).
// Body: { url: string }. Returns the re-hosted Cloudinary URL.
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const { url } = await req.json()
  if (!url || typeof url !== 'string') {
    return errorResponse('URL slike nije prosleđen', 400)
  }

  try {
    const hostedUrl = await saveImageFromUrl(url)
    return successResponse({ url: hostedUrl }, 201)
  } catch (err) {
    return errorResponse((err as Error).message, 400)
  }
})
