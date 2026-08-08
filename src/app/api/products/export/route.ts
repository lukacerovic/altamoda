import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'
import { buildAmsExportBuffer, type AmsExportProduct } from '@/lib/ams-import'

// GET /api/products/export — download the full catalog as an AMS .xlsx backup,
// in the exact structure the import expects (so it can be re-imported to restore).
export const GET = async () => {
  try {
    await requireAdmin()
  } catch {
    return new Response('Neautorizovan pristup.', { status: 403 })
  }

  const products = await prisma.product.findMany({
    orderBy: { sku: 'asc' },
    include: {
      brand: { select: { name: true } },
      category: { select: { nameLat: true } },
      productLine: { select: { name: true } },
    },
  })

  const rows: AmsExportProduct[] = products.map((p) => ({
    sku: p.sku,
    barcode: p.barcode,
    nameLat: p.nameLat,
    isProfessional: p.isProfessional,
    brandName: p.brand?.name ?? null,
    categoryName: p.category?.nameLat ?? null,
    subcategory: p.subcategory,
    productLineName: p.productLine?.name ?? null,
    productType: p.productType,
    hairTypes: p.hairTypes,
    tags: p.tags,
    description: p.description,
    usageInstructions: p.usageInstructions,
    ingredients: p.ingredients,
    benefits: p.benefits,
    declaration: p.declaration,
    priceB2c: Number(p.priceB2c),
    priceB2b: p.priceB2b != null ? Number(p.priceB2b) : null,
    gender: p.gender,
    colorCode: p.colorCode,
    groupSlug: p.groupSlug,
  }))

  const buffer = await buildAmsExportBuffer(rows)
  const date = new Date().toISOString().slice(0, 10)
  const filename = `altamoda-katalog-backup-${date}.xlsx`

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
