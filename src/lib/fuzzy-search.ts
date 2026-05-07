import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// Cap raw candidate set before downstream filters / pagination.
const CANDIDATE_LIMIT = 2000

// Serbian diacritics: build all character-level variants so cetkica matches četkica.
// pg_trgm treats š / s as different trigrams, so expansion is still necessary for diacritic hits.
export function expandDiacritics(term: string): string[] {
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
      const alts = chars[pos] !== undefined ? charGroups[chars[pos]] : undefined
      if (alts) chars[pos] = (mask >> b) & 1 ? alts[1] : alts[0]
    }
    results.add(chars.join(''))
  }
  return Array.from(results)
}

function tokenize(query: string): string[] {
  return query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0)
}

/**
 * Per-word AND substring match across product name, sku, and brand name —
 * mirrors the admin grid's intuitive "all words must appear" behavior, with
 * Serbian diacritic tolerance.
 *
 * Example: "Matrix Miracle" matches "Matrix Total Results Miracle Creator"
 * (both terms present), but does NOT match "Matrix Color Sync" (no "miracle").
 *
 * Ranking (computed in JS after the DB shortlist):
 *   +10  full phrase appears in name
 *   + 3  each term appears in name
 *   + 1  each term appears in brand
 *   ↑    shorter names break ties (more specific match)
 */
export async function findFuzzyProductIds(query: string, limit = CANDIDATE_LIMIT): Promise<string[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const terms = tokenize(trimmed)
  if (terms.length === 0) return []

  // Each term must match in at least one of name / sku / brand-name.
  // Diacritic variants are OR'd within each term so cetkica == četkica.
  const where: Prisma.ProductWhereInput = {
    AND: terms.map(term => {
      const variants = expandDiacritics(term)
      return {
        OR: variants.flatMap(v => [
          { nameLat: { contains: v, mode: 'insensitive' as const } },
          { sku: { contains: v, mode: 'insensitive' as const } },
          { brand: { name: { contains: v, mode: 'insensitive' as const } } },
        ]),
      }
    }),
  }

  const candidates = await prisma.product.findMany({
    where,
    select: {
      id: true,
      nameLat: true,
      brand: { select: { name: true } },
    },
    take: limit,
  })

  const phraseVariants = expandDiacritics(trimmed.toLowerCase())
  const termVariants = terms.map(t => expandDiacritics(t))

  const scored = candidates.map(p => {
    const name = p.nameLat.toLowerCase()
    const brand = (p.brand?.name || '').toLowerCase()
    let score = 0

    if (phraseVariants.some(v => name.includes(v))) score += 10

    for (const variants of termVariants) {
      if (variants.some(v => name.includes(v))) score += 3
      if (variants.some(v => brand.includes(v))) score += 1
    }

    // Tiebreaker: shorter names tend to be more specific matches.
    score -= name.length * 0.001

    return { id: p.id, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.map(s => s.id)
}
