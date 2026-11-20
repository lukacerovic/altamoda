import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// Cap raw candidate set before downstream filters / pagination.
const CANDIDATE_LIMIT = 2000

// Character-level variants used by the search shortlist and scoring.
// Serbian diacritics (š/č/ž/đ) plus common Latin accents so "kerastase"
// matches "Kérastase" and "cetkica" matches "četkica". Apostrophes are
// treated as optional/interchangeable so "loreal", "L'Oreal" and "L'Oréal"
// all collapse to the same set of variants.
const charGroups: Record<string, string[]> = {}
for (const group of [
  ['s', 'š'],
  ['c', 'č', 'ć', 'ç'],
  ['z', 'ž'],
  ['d', 'đ'],
  ['e', 'é', 'è'],
  ['a', 'á'],
  ['i', 'í'],
  ['o', 'ó'],
  ['u', 'ú'],
  ['n', 'ñ'],
  ["'", '’', ''],
]) {
  for (const ch of group) charGroups[ch] = group
}

/**
 * Expand every diacritic/apostrophe character into its variants.
 * For example "kerastase" -> includes "kérastase"; "l'oreal" -> includes
 * "loreal", "l’oreal" and "l’oréal".
 */
export function expandDiacritics(term: string): string[] {
  const lower = term.toLowerCase()
  const positions: Array<{ index: number; alts: string[] }> = []
  for (let i = 0; i < lower.length; i++) {
    const alts = charGroups[lower[i]]
    if (alts && alts.length > 1) positions.push({ index: i, alts })
  }

  const results = new Set<string>([lower])
  // Cap the combinatorial explosion — queries are short; 6 positions is plenty
  // for brand/product terms while keeping the OR query against the DB sane.
  const capped = positions.slice(0, 6)
  const total = capped.reduce((acc, p) => acc * p.alts.length, 1)
  for (let mask = 0; mask < total; mask++) {
    let m = mask
    const chars = lower.split('')
    for (const { index, alts } of capped) {
      const pick = m % alts.length
      m = Math.floor(m / alts.length)
      chars[index] = alts[pick]
    }
    results.add(chars.join(''))
  }

  return Array.from(results)
}

/**
 * Build the full variant set for one search term: if the term has no
 * apostrophe, also try inserting a straight/curly apostrophe between every
 * character pair, then diacritic-expand everything. This makes "loreal"
 * match "L'Oreal" and "L'Oréal".
 */
export function buildSearchVariants(term: string): string[] {
  const lower = term.toLowerCase()
  const withApostrophes = new Set<string>([lower])

  if (!lower.includes("'") && !lower.includes('’')) {
    // Only between characters — a leading/trailing apostrophe is noise.
    for (let i = 1; i < lower.length; i++) {
      withApostrophes.add(`${lower.slice(0, i)}'${lower.slice(i)}`)
      withApostrophes.add(`${lower.slice(0, i)}’${lower.slice(i)}`)
    }
  }

  const results = new Set<string>()
  for (const v of withApostrophes) {
    for (const d of expandDiacritics(v)) results.add(d)
  }

  // Hard cap: keeps the Prisma OR query (one contains-per-variant-per-field)
  // from blowing up for pathological input.
  return Array.from(results).slice(0, 96)
}

function tokenize(query: string): string[] {
  return query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0)
}

/**
 * Per-word AND substring match across product name, sku, and brand name —
 * mirrors the admin grid's intuitive "all words must appear" behavior, with
 * Serbian + Latin diacritic tolerance and apostrophe-insensitive brand
 * matching ("loreal" == "L'Oreal" == "L'Oréal").
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
  // Variants are OR'd within each term so "loreal" hits "L'Oréal" brand rows.
  const termVariants = terms.map(t => buildSearchVariants(t))
  const where: Prisma.ProductWhereInput = {
    AND: terms.map((_term, i) => {
      const variants = termVariants[i]
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

  const phraseVariants = buildSearchVariants(trimmed)

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
