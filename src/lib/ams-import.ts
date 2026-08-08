/**
 * AMS ("AMS final baza") Excel product import — REPLACE mode.
 *
 * The uploaded Excel becomes the definitive product list:
 *   - rows whose IDENT (sku) already exists  -> updated in place (images kept),
 *   - rows with a new IDENT                   -> created,
 *   - existing products NOT in the Excel      -> deleted (or archived if they
 *                                                have order history, since
 *                                                OrderItem.product is Restrict).
 *
 * The header schema is strict: every expected column must be present (matched
 * case-insensitively, whitespace-collapsed). Mismatches are reported so the
 * admin sees exactly what is wrong.
 */
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import type { PrismaClient, Prisma } from '@prisma/client'
import { slugify } from '@/lib/utils'
import { sanitizeRichText } from '@/lib/sanitize-rich-text'

export const AMS_SHEET = 'AMS final baza'

// Expected columns = the client's Excel structure + GENDER.
export const AMS_COLUMNS = [
  'IDENT', 'EAN CODE', 'NAZIV', 'PRIMENA', 'BREND', 'KATEGORIJA', 'POTKATEGORIJA',
  'LINIJA', 'TIP PROIZVODA', 'TIP KOSE', 'FUNKCIJA/TAGOVI', 'OPIS', 'UPOTREBA',
  'SASTAV', 'BENEFITI', 'DEKLARACIJA', 'VP CENA bez PDV', 'VP CENA sa PDV',
  'MP CENA bez PDV', 'MP CENA sa PDV', 'GENDER',
] as const

const norm = (s: string) => String(s).replace(/\s+/g, ' ').trim().toUpperCase()

// ── header validation ──────────────────────────────────────────
export interface HeaderCheck {
  ok: boolean
  missing: string[]      // expected columns not found
  unexpected: string[]   // columns present that aren't part of the schema
}

// The 2026/08 catalog renamed GENDER -> POL; both spellings satisfy the schema.
const headerAlias = (h: string) => (norm(h) === 'POL' ? 'GENDER' : norm(h))

export function validateAmsHeaders(headers: string[]): HeaderCheck {
  const present = new Set(headers.map(headerAlias).filter(Boolean))
  const expectedNorm = new Set(AMS_COLUMNS.map(norm))
  const missing = AMS_COLUMNS.filter((c) => !present.has(norm(c)))
  const unexpected = headers.filter((h) => h.trim() && !expectedNorm.has(headerAlias(h)))
  return { ok: missing.length === 0, missing, unexpected }
}

/** A file "looks like" an AMS catalog if it has the two signature columns. */
export function isAmsFile(headers: string[]): boolean {
  const present = new Set(headers.map(norm))
  return present.has('IDENT') && present.has('NAZIV')
}

// ── workbook parsing (rich-text aware) ─────────────────────────
interface AmsSheet {
  ws: XLSX.WorkSheet
  ref: XLSX.Range
  headers: string[]
  colOf: Record<string, number>   // normalized header -> column index
}

function openAmsSheet(buffer: ArrayBuffer): AmsSheet {
  const wb = XLSX.read(buffer, { type: 'array', cellHTML: true })
  const sheetName = wb.SheetNames.includes(AMS_SHEET) ? AMS_SHEET : wb.SheetNames[0]
  if (!sheetName) throw new Error('Excel fajl nema nijedan sheet.')
  const ws = wb.Sheets[sheetName]
  if (!ws || !ws['!ref']) throw new Error('Excel sheet je prazan.')
  const ref = XLSX.utils.decode_range(ws['!ref'])
  const headers: string[] = []
  const colOf: Record<string, number> = {}
  for (let c = ref.s.c; c <= ref.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })]
    const v = cell ? String(cell.v).trim() : ''
    if (v) { headers.push(v); colOf[headerAlias(v)] = c }
  }
  return { ws, ref, headers, colOf }
}

export function readAmsHeaders(buffer: ArrayBuffer): string[] {
  return openAmsSheet(buffer).headers
}

// rich text (cell.h) -> semantic HTML (allowlist: p, br, strong, ul, li)
function cellToHtml(h: unknown): string | null {
  if (h == null || h === '') return null
  let s = String(h)
  s = s.replace(/&#x0*0?d;/gi, '').replace(/&#x0*0?a;/gi, '')
  s = s.replace(/<\/?span[^>]*>/gi, '')
  s = s.replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<(?!\/?strong\b)[^>]+>/gi, '')
  const lines = s.split('\n').map((ln) => ln.trim())
  const blocks: string[] = []; let para: string[] = []; let list: string[] = []
  const fp = () => { if (para.length) blocks.push('<p>' + para.join('<br/>') + '</p>'); para = [] }
  const fl = () => { if (list.length) blocks.push('<ul>' + list.map((li) => '<li>' + li + '</li>').join('') + '</ul>'); list = [] }
  for (const raw of lines) {
    const ln = raw.trim()
    if (!ln) { fp(); fl(); continue }
    const b = ln.match(/^[•·]\s*(.*)$/)
    if (b) { fp(); if (b[1].trim()) list.push(b[1].trim()) }
    else { fl(); para.push(ln) }
  }
  fp(); fl()
  return blocks.join('') || null
}

function parsePrice(v: string): number | null {
  const s = String(v).replace(/\s+/g, '').replace(/,/g, '')
  if (!s || s === '-') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())

// Normalize the Excel GENDER cell to the storefront's canonical collection
// values ('man' / 'woman'); anything else (blank, unisex, unknown) -> null.
function normalizeGender(v: string): string | null {
  const s = v.toLowerCase().replace(/[\s.]/g, '')
  if (['muški', 'muski', 'm', 'man', 'muškarci', 'muskarci', 'male', 'muško', 'musko', 'him'].includes(s)) return 'man'
  if (['ženski', 'zenski', 'ž', 'z', 'w', 'woman', 'žene', 'zene', 'female', 'žensko', 'zensko', 'her'].includes(s)) return 'woman'
  return null
}

// Product codes ride inside names as a bracketed number: a true 8–14 digit EAN
// ("Šampon XYZ (8606012345678)") or the product's own SKU/ident
// ("Redken Color Gels Oils 60ml (1140)"). Neither belongs in the display name —
// the PDP shows the code as "Šifra proizvoda" instead.
const EAN_IN_NAME_RE = /\s*\(\s*(\d{8,14})\s*\)/

/**
 * Split a raw product name into a clean display name + the code found in it.
 * Strips 8–14 digit EANs anywhere in the name, and (when `sku` is given) a
 * bracketed code equal to the product's SKU. Short numeric brackets that don't
 * match the SKU (e.g. sizes) are left alone.
 */
export function extractEanFromName(raw: string, sku?: string): { name: string; ean: string | null } {
  let name = raw.trim()
  let ean: string | null = null

  const m = name.match(EAN_IN_NAME_RE)
  if (m) {
    ean = m[1]
    name = name.replace(EAN_IN_NAME_RE, ' ').replace(/\s{2,}/g, ' ').trim()
  }

  if (sku) {
    const skuRe = new RegExp(`\\s*\\(\\s*${sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\)`, 'g')
    name = name.replace(skuRe, ' ').replace(/\s{2,}/g, ' ').trim()
  }

  // Never return an empty name — fall back to the original if it was only a code.
  return { name: name || raw.trim(), ean }
}

export interface AmsRow {
  rowNum: number
  sku: string
  name: string
  barcode: string | null
  gender: string | null
  brand: string
  category: string
  subcategory: string | null
  productLine: string
  productType: string | null
  hairTypes: string | null
  tags: string | null
  description: string | null
  usage: string | null
  ingredients: string | null
  benefits: string | null
  declaration: string | null
  priceB2c: number
  priceB2b: number | null
  isProfessional: boolean
  /** Color-variant grouping (2026/08 catalog): shade rows sit under a base
   *  header row (no IDENT) and carry only the shade code as NAZIV. */
  colorCode: string | null
  colorName: string | null
  groupSlug: string | null
}

// "500ml" / "1000 ml" / lowercase "500g" — a volume token inside a shade name
// means the row is its own product (different size), not a swatch of the base.
// Grams must stay lowercase-only: uppercase "6G"/"505G" are gold shade codes.
const isVolumeName = (s: string) => /\d+\s*ml\b/i.test(s) || /\d+\s*(g|gr|kg)\b/.test(s)

/** Prefix the (title-cased) brand unless the base name already contains it. */
function brandedName(brand: string, base: string): string {
  const b = titleCase(brand.trim())
  if (!b || base.toLowerCase().includes(brand.trim().toLowerCase())) return base
  return `${b} ${base}`
}

/** Extract product rows from the AMS sheet (rich text preserved + sanitized). */
export function extractAmsRows(buffer: ArrayBuffer): AmsRow[] {
  const { ws, ref, colOf } = openAmsSheet(buffer)
  const idc = colOf['IDENT']
  if (idc == null) throw new Error('Kolona IDENT nije pronađena.')
  const w = (r: number, name: string) => {
    const c = colOf[norm(name)]
    if (c == null) return ''
    const x = ws[XLSX.utils.encode_cell({ r, c })]
    return x ? String(x.w ?? x.v ?? '').trim() : ''
  }
  const html = (r: number, name: string) => {
    const c = colOf[norm(name)]
    if (c == null) return null
    const x = ws[XLSX.utils.encode_cell({ r, c })]
    return x ? sanitizeRichText(cellToHtml(x.h ?? x.w ?? x.v ?? '')) : null
  }

  const rows: AmsRow[] = []
  const seen = new Set<string>()
  // Open shade block: set by a base header row (NAZIV without IDENT), closed
  // when a following row's LINIJA no longer matches the block's LINIJA.
  let block: { base: string; line: string | null } | null = null
  for (let r = 1; r <= ref.e.r; r++) {
    const idCell = ws[XLSX.utils.encode_cell({ r, c: idc })]
    const sku = idCell ? String(idCell.v).trim() : ''
    const rawName = w(r, 'NAZIV')
    if (!sku) {
      // A NAZIV-only row (no IDENT, no LINIJA) is a color-block header like
      // "SoColor" or "Shades EQ 60ml"; anything else without IDENT is noise.
      block = rawName && !w(r, 'LINIJA') ? { base: rawName, line: null } : null
      continue
    }
    if (!rawName) continue
    const rowLine = w(r, 'LINIJA')
    // First row after a header pins the block's LINIJA; a different LINIJA ends it.
    if (block) {
      if (block.line === null) block.line = rowLine || null
      if (!block.line || rowLine !== block.line) block = null
    }
    // EAN codes must never live in the product name — strip "(8606...)" style
    // codes and keep them as a barcode fallback (the PDP shows them as
    // "Šifra proizvoda").
    const extracted = extractEanFromName(rawName, sku)
    const eanFromName = extracted.ean
    let name = extracted.name.replace(/\s+/g, ' ').trim()
    const brand = w(r, 'BREND')
    let colorCode: string | null = null
    let groupSlug: string | null = null
    if (block) {
      // "4V/4.6 ML.60" — a shade with the base's own volume restated; drop it.
      name = name.replace(/\s*ML\.?\s*\d+\s*$/i, '').trim() || name
      if (!isVolumeName(name)) {
        colorCode = name
        const grouped = brandedName(brand, block.base)
        groupSlug = slugify(grouped) || null
        name = `${grouped} ${colorCode}`.trim()
      } else if (/^\d/.test(name)) {
        // Shade code with its own size (e.g. "000 Crystal Clear 500ml") —
        // standalone product named after the base line without its volume.
        const baseNoVol = block.base.replace(/\s*\d+\s*(ml|l|g|gr|kg)\b\.?\s*$/i, '').trim()
        name = `${brandedName(brand, baseNoVol)} ${name}`.trim()
      } else {
        // Full product name that merely sits inside the block (e.g. an
        // activator) — treated like any regular row.
        name = brandedName(brand, name)
      }
    } else {
      // The 2026/08 catalog dropped brand prefixes from NAZIV; the storefront
      // has always displayed them, so restore the prefix on every product.
      name = brandedName(brand, name)
    }
    if (seen.has(sku)) continue // first occurrence wins
    seen.add(sku)

    const mp = parsePrice(w(r, 'MP CENA sa PDV')) ?? parsePrice(w(r, 'MP CENA bez PDV'))
    const vp = parsePrice(w(r, 'VP CENA sa PDV')) ?? parsePrice(w(r, 'VP CENA bez PDV'))
    const primena = w(r, 'PRIMENA')
    // B2B-only (professional) when the audience excludes B2C or there is no retail price.
    const isProfessional = primena ? !/b2c/i.test(primena) : mp == null

    rows.push({
      rowNum: r + 1,
      sku,
      name,
      barcode: w(r, 'EAN CODE') || eanFromName,
      gender: normalizeGender(w(r, 'GENDER')),
      brand: w(r, 'BREND'),
      category: (w(r, 'KATEGORIJA').split(',')[0] || '').trim(),
      subcategory: w(r, 'POTKATEGORIJA') || null,
      productLine: w(r, 'LINIJA'),
      productType: w(r, 'TIP PROIZVODA') || null,
      hairTypes: w(r, 'TIP KOSE') || null,
      tags: w(r, 'FUNKCIJA/TAGOVI') || null,
      description: html(r, 'OPIS'),
      usage: html(r, 'UPOTREBA'),
      ingredients: html(r, 'SASTAV'),
      benefits: html(r, 'BENEFITI'),
      declaration: html(r, 'DEKLARACIJA'),
      priceB2c: mp ?? vp ?? 0,   // NOT NULL; B2B-only mirrors the wholesale price
      priceB2b: vp,
      isProfessional,
      colorCode,
      colorName: colorCode,
      groupSlug,
    })
  }
  return rows
}

// ── export (inverse of import — produces a re-importable backup) ──
// HTML -> the "• bullet / newline" plain text that cellToHtml round-trips back
// into the same <ul>/<p> structure on re-import (bold emphasis is dropped).
function htmlToText(html: string | null | undefined): string {
  if (!html) return ''
  let s = String(html)
  s = s.replace(/<li[^>]*>/gi, '• ').replace(/<\/li>/gi, '\n')
  s = s.replace(/<\/(p|div|ul|ol|h[1-6])>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<[^>]+>/g, '')
  s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
       .replace(/&gt;/gi, '>').replace(/&#0*39;|&apos;/gi, "'").replace(/&quot;/gi, '"')
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

export interface AmsExportProduct {
  sku: string
  barcode: string | null
  nameLat: string
  isProfessional: boolean
  brandName: string | null
  categoryName: string | null
  subcategory: string | null
  productLineName: string | null
  productType: string | null
  hairTypes: string | null
  tags: string | null
  description: string | null
  usageInstructions: string | null
  ingredients: string | null
  benefits: string | null
  declaration: string | null
  priceB2c: number
  priceB2b: number | null
  gender: string | null
  /** Color-variant grouping — round-tripped through the block format (see extractAmsRows) so a backup export can be re-imported without losing shade grouping. */
  colorCode: string | null
  groupSlug: string | null
}

// Column display config for the styled export: width + which columns wrap long
// text and which hold right-aligned numbers.
const AMS_COL_CONFIG: Record<string, { width: number; wrap?: boolean; numeric?: boolean }> = {
  'IDENT': { width: 10 },
  'EAN CODE': { width: 16 },
  'NAZIV': { width: 46, wrap: true },
  'PRIMENA': { width: 12 },
  'BREND': { width: 18, wrap: true },
  'KATEGORIJA': { width: 20, wrap: true },
  'POTKATEGORIJA': { width: 20, wrap: true },
  'LINIJA': { width: 26, wrap: true },
  'TIP PROIZVODA': { width: 22, wrap: true },
  'TIP KOSE': { width: 20, wrap: true },
  'FUNKCIJA/TAGOVI': { width: 26, wrap: true },
  'OPIS': { width: 55, wrap: true },
  'UPOTREBA': { width: 42, wrap: true },
  'SASTAV': { width: 42, wrap: true },
  'BENEFITI': { width: 42, wrap: true },
  'DEKLARACIJA': { width: 40, wrap: true },
  'VP CENA bez PDV': { width: 15, numeric: true },
  'VP CENA sa PDV': { width: 15, numeric: true },
  'MP CENA bez PDV': { width: 15, numeric: true },
  'MP CENA sa PDV': { width: 15, numeric: true },
  'GENDER': { width: 11 },
}

/** Map one product to its AMS row values (keyed by column). */
function amsExportRecord(p: AmsExportProduct): Record<string, string | number> {
  return {
    IDENT: p.sku,
    'EAN CODE': p.barcode ?? '',
    NAZIV: p.nameLat,
    // Round-trips isProfessional: no "B2C" => the import marks it professional.
    PRIMENA: p.isProfessional ? 'B2B' : 'B2B, B2C',
    BREND: p.brandName ?? '',
    KATEGORIJA: p.categoryName ?? '',
    POTKATEGORIJA: p.subcategory ?? '',
    LINIJA: p.productLineName ?? '',
    'TIP PROIZVODA': p.productType ?? '',
    'TIP KOSE': p.hairTypes ?? '',
    'FUNKCIJA/TAGOVI': p.tags ?? '',
    OPIS: htmlToText(p.description),
    UPOTREBA: htmlToText(p.usageInstructions),
    SASTAV: htmlToText(p.ingredients),
    BENEFITI: htmlToText(p.benefits),
    DEKLARACIJA: htmlToText(p.declaration),
    'VP CENA bez PDV': '',
    'VP CENA sa PDV': p.priceB2b ?? '',
    'MP CENA bez PDV': '',
    // Always export the real priceB2c so it round-trips exactly; PRIMENA (not
    // the presence of MP) is what carries the professional/B2B-only flag.
    'MP CENA sa PDV': p.priceB2c,
    GENDER: p.gender ?? '',
  }
}

// Order rows for export: color-grouped products are moved so every member of
// a group sits contiguously (preceded by a synthetic block-header row), since
// extractAmsRows() only recognizes a block as an unbroken run — the natural
// sku-ascending order doesn't guarantee that. Ungrouped rows keep their
// original relative order.
function orderForExport(products: AmsExportProduct[]): AmsExportProduct[] {
  const grouped = new Map<string, AmsExportProduct[]>()
  const ordered: AmsExportProduct[] = []
  for (const p of products) {
    if (!p.groupSlug || !p.colorCode) { ordered.push(p); continue }
    if (!grouped.has(p.groupSlug)) { grouped.set(p.groupSlug, []); ordered.push(p) } // placeholder marks first-seen position
    grouped.get(p.groupSlug)!.push(p)
  }
  const result: AmsExportProduct[] = []
  const emitted = new Set<string>()
  for (const p of ordered) {
    if (!p.groupSlug || !p.colorCode) { result.push(p); continue }
    if (emitted.has(p.groupSlug)) continue // already flushed as part of its group
    emitted.add(p.groupSlug)
    result.push(...grouped.get(p.groupSlug)!)
  }
  return result
}

/** Strip a trailing " <colorCode>" from the display name to recover the block's base name. */
function stripColorSuffix(nameLat: string, colorCode: string): string {
  return nameLat.endsWith(` ${colorCode}`) ? nameLat.slice(0, -(colorCode.length + 1)) : nameLat
}

/**
 * Build a re-importable AND presentable AMS .xlsx (same schema the import
 * validates) — sized columns, wrapped rich-text cells, a styled + frozen
 * header row, and an auto-filter, mirroring the client's original file.
 *
 * Color-grouped products are re-emitted in the vendor's block format (a
 * NAZIV-only header row, then shade rows whose NAZIV is just the color code)
 * so that exporting and re-importing this file preserves colorCode/groupSlug
 * instead of flattening every shade back into a standalone product.
 */
export async function buildAmsExportBuffer(products: AmsExportProduct[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(AMS_SHEET, { views: [{ state: 'frozen', ySplit: 1 }] })

  ws.columns = AMS_COLUMNS.map((c) => ({ header: c, key: c, width: AMS_COL_CONFIG[c]?.width ?? 16 }))

  let openGroup: string | null = null
  for (const p of orderForExport(products)) {
    const isShade = Boolean(p.groupSlug && p.colorCode)
    if (isShade && p.groupSlug !== openGroup) {
      ws.addRow({ NAZIV: stripColorSuffix(p.nameLat, p.colorCode!) })
      openGroup = p.groupSlug
    } else if (!isShade) {
      openGroup = null
    }
    const record = amsExportRecord(p)
    if (isShade) record.NAZIV = p.colorCode!
    ws.addRow(record)
  }

  // Per-column body alignment (top-align, wrap long text, right-align numbers).
  AMS_COLUMNS.forEach((c, i) => {
    const cfg = AMS_COL_CONFIG[c]
    const col = ws.getColumn(i + 1)
    col.alignment = { vertical: 'top', horizontal: cfg?.numeric ? 'right' : 'left', wrapText: !!cfg?.wrap }
    if (cfg?.numeric) col.numFmt = '#,##0.00'
  })

  // Style the header row last so it wins over the column defaults.
  const header = ws.getRow(1)
  header.height = 24
  header.font = { bold: true, color: { argb: 'FF1A1C1E' } }
  header.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3D9DE' } }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0C4CB' } } }
  })

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: AMS_COLUMNS.length } }

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf as ArrayBuffer)
}

// ── the replace import ─────────────────────────────────────────
export interface AmsImportResult {
  created: number
  updated: number
  deleted: number
  archived: number
  skipped: number
  total: number
  newBrands: string[]
  newCategories: string[]
  errors: { row: number; name: string; error: string }[]
}

export async function importAmsProducts(prisma: PrismaClient, buffer: ArrayBuffer): Promise<AmsImportResult> {
  const rows = extractAmsRows(buffer)
  if (rows.length === 0) throw new Error('Excel ne sadrži nijedan proizvod sa IDENT i NAZIV vrednostima.')

  const newBrands = new Set<string>()
  const newCategories = new Set<string>()
  const errors: AmsImportResult['errors'] = []
  let created = 0, updated = 0, deleted = 0, archived = 0

  // Preload taxonomy + existing products + slug set (outside the tx; reads only).
  const [brands, categories, lines, existing] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.productLine.findMany({ select: { id: true, name: true, brandId: true } }),
    prisma.product.findMany({ select: { id: true, sku: true, slug: true } }),
  ])
  const brandMap = new Map(brands.map((b) => [b.name.toLowerCase().trim(), b.id]))
  const catMap = new Map(categories.map((c) => [c.slug, c.id]))
  const lineMap = new Map(lines.map((l) => [`${l.brandId ?? ''}::${l.name.toLowerCase().trim()}`, l.id]))
  const skuToId = new Map(existing.map((p) => [String(p.sku).trim(), p.id]))
  const slugSet = new Set(existing.map((p) => p.slug))

  const excelSkus = new Set(rows.map((r) => r.sku))
  const toRemove = existing.filter((p) => !excelSkus.has(String(p.sku).trim())).map((p) => p.id)

  // Products with order history can't be hard-deleted (OrderItem.product is Restrict) — archive them.
  const withOrders = toRemove.length
    ? new Set((await prisma.orderItem.findMany({
        where: { productId: { in: toRemove } }, select: { productId: true }, distinct: ['productId'],
      })).map((o) => o.productId))
    : new Set<string>()
  const deleteIds = toRemove.filter((id) => !withOrders.has(id))
  const archiveIds = toRemove.filter((id) => withOrders.has(id))

  const uniqueSlug = (base: string) => {
    const s = slugify(base) || 'proizvod'
    if (!slugSet.has(s)) { slugSet.add(s); return s }
    for (let n = 2; n < 100000; n++) { const c = `${s}-${n}`; if (!slugSet.has(c)) { slugSet.add(c); return c } }
    return `${s}-${Date.now().toString(36)}`
  }

  await prisma.$transaction(async (tx) => {
    // 1) Remove products not in the Excel. Images/color/attributes/reviews/promo
    // links cascade; cart items and wishlists have a restricting FK, so clear
    // those transient rows first (order items are protected via archiving above).
    if (deleteIds.length) {
      await tx.cartItem.deleteMany({ where: { productId: { in: deleteIds } } })
      await tx.wishlist.deleteMany({ where: { productId: { in: deleteIds } } })
      await tx.product.deleteMany({ where: { id: { in: deleteIds } } })
    }
    if (archiveIds.length) { await tx.product.updateMany({ where: { id: { in: archiveIds } }, data: { isActive: false } }); archived = archiveIds.length }
    deleted = deleteIds.length

    // 2) Resolve-or-create taxonomy, then upsert each Excel row.
    for (const row of rows) {
      try {
        let brandId: string | null = null
        if (row.brand) {
          const key = row.brand.toLowerCase().trim()
          brandId = brandMap.get(key) ?? null
          if (!brandId) {
            const b = await tx.brand.create({ data: { name: row.brand, slug: slugify(row.brand) || `brand-${row.sku}` } })
            brandId = b.id; brandMap.set(key, brandId); newBrands.add(row.brand)
          }
        }

        let categoryId: string | null = null
        if (row.category) {
          const name = titleCase(row.category)
          const slug = slugify(name)
          categoryId = catMap.get(slug) ?? null
          if (!categoryId && slug) {
            const c = await tx.category.create({ data: { nameLat: name, slug, isActive: true, depth: 0 } })
            categoryId = c.id; catMap.set(slug, categoryId); newCategories.add(name)
          }
        }

        // A product line belongs to a brand, so it can only be created when the
        // row resolved to one; otherwise the line is left unset.
        let productLineId: string | null = null
        if (row.productLine && brandId) {
          const key = `${brandId}::${row.productLine.toLowerCase().trim()}`
          productLineId = lineMap.get(key) ?? null
          if (!productLineId) {
            const l = await tx.productLine.create({ data: { name: row.productLine, slug: slugify(row.productLine) || `linija-${row.sku}`, brandId } })
            productLineId = l.id; lineMap.set(key, productLineId)
          }
        }

        const data: Prisma.ProductUncheckedUpdateInput = {
          nameLat: row.name,
          barcode: row.barcode,
          gender: row.gender,
          brandId,
          categoryId,
          productLineId,
          subcategory: row.subcategory,
          productType: row.productType,
          hairTypes: row.hairTypes,
          tags: row.tags,
          description: row.description,
          usageInstructions: row.usage,
          ingredients: row.ingredients,
          benefits: row.benefits,
          declaration: row.declaration,
          priceB2c: row.priceB2c,
          priceB2b: row.priceB2b,
          isProfessional: row.isProfessional,
          // Color grouping is normalized on every import: shade rows get their
          // block's group + shade code, everything else is explicitly cleared
          // so stale groups from older imports can't linger.
          colorCode: row.colorCode,
          colorName: row.colorName,
          groupSlug: row.groupSlug,
          isActive: true,
        }

        const existingId = skuToId.get(row.sku)
        if (existingId) {
          await tx.product.update({ where: { id: existingId }, data })
          updated++
        } else {
          await tx.product.create({
            data: { ...(data as Prisma.ProductUncheckedCreateInput), sku: row.sku, slug: uniqueSlug(row.name), vatRate: 20 },
          })
          created++
        }
      } catch (err) {
        const msg = (err as Error).message
        errors.push({ row: row.rowNum, name: row.name, error: msg.length > 180 ? msg.slice(0, 180) + '…' : msg })
      }
    }
  }, { maxWait: 20000, timeout: 300000 })

  return {
    created, updated, deleted, archived,
    skipped: 0,
    total: rows.length,
    newBrands: [...newBrands],
    newCategories: [...newCategories],
    errors,
  }
}
