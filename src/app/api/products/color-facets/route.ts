import { prisma } from '@/lib/db'
import { successResponse, withErrorHandler } from '@/lib/api-utils'

// GET /api/products/color-facets
// Returns only colors that are actually assigned to active products.
// Used by the public product filter sidebar to show available color options.
export const GET = withErrorHandler(async () => {
  // Get all color products that belong to active products
  const colorProducts = await prisma.colorProduct.findMany({
    where: {
      product: { isActive: true },
    },
    select: {
      colorLevel: true,
      undertoneCode: true,
      undertoneName: true,
      hexValue: true,
    },
  })

  // Build unique levels with their representative hex colors
  const levelMap = new Map<number, { count: number; hexSamples: string[] }>()
  const undertoneMap = new Map<string, { name: string; count: number; hexSamples: string[] }>()

  for (const cp of colorProducts) {
    // Levels
    const existing = levelMap.get(cp.colorLevel)
    if (existing) {
      existing.count++
      if (existing.hexSamples.length < 3 && !existing.hexSamples.includes(cp.hexValue)) {
        existing.hexSamples.push(cp.hexValue)
      }
    } else {
      levelMap.set(cp.colorLevel, { count: 1, hexSamples: [cp.hexValue] })
    }

    // Undertones
    const utExisting = undertoneMap.get(cp.undertoneCode)
    if (utExisting) {
      utExisting.count++
      if (utExisting.hexSamples.length < 3 && !utExisting.hexSamples.includes(cp.hexValue)) {
        utExisting.hexSamples.push(cp.hexValue)
      }
    } else {
      undertoneMap.set(cp.undertoneCode, {
        name: cp.undertoneName,
        count: 1,
        hexSamples: [cp.hexValue],
      })
    }
  }

  // Format as sorted arrays
  const levels = Array.from(levelMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, data]) => ({
      level,
      count: data.count,
      hexSamples: data.hexSamples,
    }))

  const undertones = Array.from(undertoneMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, data]) => ({
      code,
      name: data.name,
      count: data.count,
      hexSamples: data.hexSamples,
    }))

  return successResponse({
    levels,
    undertones,
    totalColorProducts: colorProducts.length,
  })
})
