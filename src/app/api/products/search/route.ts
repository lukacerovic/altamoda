import { prisma } from '@/lib/db'
import { successResponse, withErrorHandler } from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth-helpers'

// Serbian diacritics: build all character-level variants so cetkica matches četkica
function expandDiacritics(term: string): string[] {
  const charGroups: Record<string, string[]> = {
    s: ['s', 'š'], š: ['s', 'š'],
    c: ['c', 'č', 'ć'], č: ['c', 'č', 'ć'], ć: ['c', 'č', 'ć'],
    z: ['z', 'ž'], ž: ['z', 'ž'],
    d: ['d', 'đ'], đ: ['d', 'đ'],
  }
  const results = new Set<string>([term])
  const lower = term.toLowerCase()
  const positions: number[] = []
  for (let i = 0; i < lower.length; i++) {
    if (charGroups[lower[i]]) positions.push(i)
  }
  const maxPositions = Math.min(positions.length, 8)
  const count = 1 << maxPositions
  for (let mask = 0; mask < count; mask++) {
    const chars = lower.split('')
    for (let b = 0; b < maxPositions; b++) {
      const pos = positions[b]
      const alts = charGroups[chars[pos]]
      if (alts) chars[pos] = (mask >> b) & 1 ? alts[1] : alts[0]
    }
    results.add(chars.join(''))
  }
  return Array.from(results)
}

// GET /api/products/search?q=majirel — Autocomplete (top 5)
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return successResponse([])
  }

  const user = await getCurrentUser()
  const role = user?.role
  const terms = expandDiacritics(q)

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(role === 'b2c' ? { isProfessional: false } : {}),
      OR: terms.flatMap(term => [
        { nameLat: { contains: term, mode: 'insensitive' as const } },
        { sku: { contains: term, mode: 'insensitive' as const } },
        { brand: { name: { contains: term, mode: 'insensitive' as const } } },
      ]),
    },
    include: {
      brand: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 5,
    orderBy: { nameLat: 'asc' },
  })

  const results = products.map(p => ({
    id: p.id,
    name: p.nameLat,
    slug: p.slug,
    sku: p.sku,
    brand: p.brand?.name,
    price: role === 'b2b' && p.priceB2b ? Number(p.priceB2b) : Number(p.priceB2c),
    image: p.images[0]?.url || null,
    isProfessional: p.isProfessional,
  }))

  return successResponse(results)
})
