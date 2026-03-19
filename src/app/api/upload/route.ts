import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { saveUploadedFile } from '@/lib/upload'

// POST /api/upload — File upload (admin)
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return errorResponse('Fajl nije prosleđen', 400)
  }

  try {
    const url = await saveUploadedFile(file)
    return successResponse({ url }, 201)
  } catch (err) {
    return errorResponse((err as Error).message, 400)
  }
})
