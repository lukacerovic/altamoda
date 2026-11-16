import { legacyRedirect } from '@/lib/legacy-redirects'

// Old-site URLs (Google still lists them) → 301 to the new pages.
export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  return legacyRedirect(request, (await params).path)
}

export const HEAD = GET
