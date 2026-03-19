import { NextResponse } from 'next/server'
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE, PAGINATION_MAX_LIMIT } from './constants'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(
    1,
    parseInt(searchParams.get('page') || String(PAGINATION_DEFAULT_PAGE))
  )
  const limit = Math.min(
    PAGINATION_MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULT_LIMIT)))
  )
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export function withErrorHandler(
  handler: (req: Request, context?: unknown) => Promise<NextResponse>
) {
  return async (req: Request, context?: unknown) => {
    try {
      return await handler(req, context)
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.message, error.statusCode)
      }
      console.error('API Error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
}
