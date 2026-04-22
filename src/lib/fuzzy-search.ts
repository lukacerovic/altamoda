import { prisma } from '@/lib/db'

// Similarity threshold (0..1) for pg_trgm. Lower = more typo-tolerant but noisier.
// 0.25 catches single-char typos on 5+ letter words ("shrit" → "shirt") without flooding results.
const SIMILARITY_THRESHOLD = 0.25

// Cap raw candidate set before it meets other filters (category/price/etc.) and pagination.
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

/**
 * Return product IDs matching a free-text query, ranked by similarity.
 *
 * Matching strategy (OR'd together):
 *   1. ILIKE '%variant%' over every diacritic expansion — exact substring hits (old behavior).
 *   2. pg_trgm similarity() > threshold — typo-tolerant fuzzy match (new behavior).
 *
 * Searches product name_lat, product sku, and brand name.
 * Returns up to CANDIDATE_LIMIT IDs so downstream filters (category/price/pagination) still apply.
 */
export async function findFuzzyProductIds(query: string, limit = CANDIDATE_LIMIT): Promise<string[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const variants = expandDiacritics(trimmed)
  const ilikePatterns = variants.map(v => `%${v}%`)

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE
      p.name_lat ILIKE ANY(${ilikePatterns}::text[])
      OR p.sku ILIKE ANY(${ilikePatterns}::text[])
      OR b.name ILIKE ANY(${ilikePatterns}::text[])
      OR similarity(p.name_lat, ${trimmed}) > ${SIMILARITY_THRESHOLD}
      OR similarity(p.sku, ${trimmed}) > ${SIMILARITY_THRESHOLD}
      OR (b.name IS NOT NULL AND similarity(b.name, ${trimmed}) > ${SIMILARITY_THRESHOLD})
    ORDER BY
      GREATEST(
        similarity(p.name_lat, ${trimmed}),
        similarity(p.sku, ${trimmed}),
        COALESCE(similarity(b.name, ${trimmed}), 0)
      ) DESC
    LIMIT ${limit}
  `
  return rows.map(r => r.id)
}
