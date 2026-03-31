import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import * as XLSX from 'xlsx'
import { randomUUID } from 'crypto'

/* ═══════════════════════════════════════════════════════════════
   FILE TYPE DETECTION
   ═══════════════════════════════════════════════════════════════ */

type OrderFileType = 'pantheon_customers' | 'pantheon_orders' | 'pantheon_order_items' | 'unknown'

function detectOrderFileType(headers: string[]): OrderFileType {
  const lower = new Set(headers.map(h => h.toLowerCase().trim()))

  // Customers: acSubject + acName2 + acAddress
  if (lower.has('acsubject') && lower.has('acname2') && lower.has('acaddress')) {
    return 'pantheon_customers'
  }

  // Orders: acKey + adDate + anForPay
  if (lower.has('ackey') && lower.has('addate') && lower.has('anforpay')) {
    return 'pantheon_orders'
  }

  // Order items: acKey + acIdent + anQty
  if (lower.has('ackey') && lower.has('acident') && lower.has('anqty')) {
    return 'pantheon_order_items'
  }

  return 'unknown'
}

const FILE_TYPE_LABELS: Record<OrderFileType, string> = {
  pantheon_customers: 'Pantheon Kupci (the_setSubj)',
  pantheon_orders: 'Pantheon Porudzbine (tHE_Order)',
  pantheon_order_items: 'Pantheon Stavke (tHE_Orderitem)',
  unknown: 'Nepoznat format',
}

/* ═══════════════════════════════════════════════════════════════
   FILE PARSING (mirrors products import)
   ═══════════════════════════════════════════════════════════════ */

function parseFile(buffer: ArrayBuffer, fileName: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const ext = fileName.toLowerCase().split('.').pop()

  if (ext === 'csv' || ext === 'txt') {
    const text = new TextDecoder('utf-8').decode(buffer)
    return parseCsvText(text)
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('Excel fajl nema nijedan sheet')
    const sheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    if (json.length === 0) throw new Error('Excel sheet je prazan')
    return { headers: Object.keys(json[0]), rows: json }
  }

  throw new Error(`Nepodržan format: .${ext}. Koristite .csv, .xlsx ili .xls`)
}

function parseCsvText(text: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const lines = text.trim().replace(/\r\n/g, '\n').split('\n')
  if (lines.length < 2) throw new Error('CSV mora imati zaglavlje i bar jedan red podataka')
  const headers = parseCsvLine(lines[0])
  const rows: Record<string, unknown>[] = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCsvLine(lines[i])
    const row: Record<string, unknown> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })
    rows.push(row)
  }
  return { headers, rows }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { current += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { fields.push(current.trim()); current = '' }
      else { current += ch }
    }
  }
  fields.push(current.trim())
  return fields
}

/** Case-insensitive column value getter — strips null bytes for PostgreSQL safety */
function col(row: Record<string, unknown>, name: string): string {
  let val: string
  if (row[name] != null) val = String(row[name]).trim()
  else {
    const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase())
    if (key && row[key] != null) val = String(row[key]).trim()
    else return ''
  }
  // Remove null bytes (0x00) that PostgreSQL UTF8 encoding rejects
  return val.replace(/\0/g, '')
}

/** Convert Pantheon float ID to clean string */
function cleanId(val: string): string {
  if (!val) return ''
  const num = Number(val)
  return isNaN(num) ? val : String(Math.floor(num))
}

/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

/** Convert Excel serial date number to JS Date */
function excelDateToJS(serial: number): Date | null {
  if (!serial || isNaN(serial)) return null
  // Excel epoch: Jan 1, 1900 (with the "1900 leap year bug")
  const dayPart = Math.floor(serial)
  const timePart = serial - dayPart
  const epoch = new Date(1900, 0, 1)
  const date = new Date(epoch.getTime() + (dayPart - 2) * 86400000)
  // Add time part if present
  if (timePart > 0) {
    date.setTime(date.getTime() + Math.round(timePart * 86400000))
  }
  return date
}

/** Strip RTF formatting tags and null bytes, return plain text safe for PostgreSQL */
function stripRtf(text: string): string {
  if (!text) return ''
  // Remove null bytes (0x00) — PostgreSQL UTF8 rejects them
  let clean = text.replace(/\0/g, '')
  // Quick check if it's actually RTF
  if (!clean.startsWith('{\\rtf')) return clean
  return clean
    .replace(/\{\\[^{}]*\}/g, '') // Remove groups like {\fonttbl...}
    .replace(/\\[a-z]+\d*\s?/gi, '') // Remove control words like \par \b etc
    .replace(/[{}]/g, '') // Remove remaining braces
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
}

/** Map Pantheon status to OrderStatus enum */
function mapOrderStatus(acStatus: string, acFinished: string): 'novi' | 'u_obradi' | 'isporuceno' | 'otkazano' {
  const status = acStatus.trim()
  const finished = acFinished.trim().toUpperCase()

  if (status === '0') return 'otkazano'
  if (status === '1' && finished === 'T') return 'isporuceno'
  if (status === '1') return 'u_obradi' // F or empty = still processing
  return 'novi'
}

/** Map Pantheon payment method */
function mapPaymentMethod(acPayMethod: string): 'card' | 'bank_transfer' | 'cash_on_delivery' | 'invoice' {
  const m = acPayMethod.trim().toUpperCase()
  if (m === 'V') return 'bank_transfer'
  if (m === 'K') return 'card'
  return 'cash_on_delivery'
}

/** Map payment status from order state */
function mapPaymentStatus(acFinished: string): 'pending' | 'paid' | 'failed' | 'refunded' {
  const finished = acFinished.trim().toUpperCase()
  if (finished === 'T') return 'paid'
  return 'pending' // F or empty = not yet paid
}

/** Generate a dummy password hash for imported users */
async function generateDummyHash(): Promise<string> {
  // We use a simple hash since these users can't log in anyway (placeholder email)
  // This avoids adding bcrypt as a dependency just for imports
  const { createHash } = await import('crypto')
  return createHash('sha256').update(`import-${randomUUID()}-${Date.now()}`).digest('hex')
}

/* ═══════════════════════════════════════════════════════════════
   STEP 1: PROCESS CUSTOMERS (the_setSubj)
   ═══════════════════════════════════════════════════════════════ */

interface ImportResult {
  created: number
  updated: number
  skipped: number
  errors: { row: number; name?: string; error: string }[]
}

async function processCustomers(rows: Record<string, unknown>[]): Promise<ImportResult> {
  let created = 0, updated = 0, skipped = 0
  const errors: { row: number; name?: string; error: string }[] = []

  // Pre-load existing users by erpSubjectId and erpId for batch checking
  const allSubjectIds = rows.map(r => cleanId(col(r, 'acSubject'))).filter(Boolean)

  const existingB2b = allSubjectIds.length > 0
    ? await prisma.b2bProfile.findMany({
        where: { erpSubjectId: { in: allSubjectIds } },
        select: { erpSubjectId: true, userId: true },
      })
    : []
  const existingUsers = allSubjectIds.length > 0
    ? await prisma.user.findMany({
        where: { erpId: { in: allSubjectIds } },
        select: { id: true, erpId: true },
      })
    : []

  const b2bSubjectToUser = new Map(existingB2b.filter(b => b.erpSubjectId).map(b => [b.erpSubjectId!, b.userId]))
  const erpIdToUser = new Map(existingUsers.filter(u => u.erpId).map(u => [u.erpId!, u.id]))

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const acSubject = cleanId(col(r, 'acSubject'))
    const name = col(r, 'acName2') || col(r, 'acName3') || `Kupac ${acSubject}`
    const isBuyer = col(r, 'acBuyer').toUpperCase() !== 'F'

    if (!acSubject) { skipped++; continue }
    if (!isBuyer) { skipped++; continue }

    const isB2b = col(r, 'acNaturalPerson').toUpperCase() !== 'T'
    const phone = col(r, 'acPhone') || null
    const street = col(r, 'acAddress') || 'N/A'
    const postalCode = col(r, 'acPost') || 'N/A'
    const country = col(r, 'acCountry') || 'Srbija'
    // Try to extract city from postal code (e.g., RS-21000 -> Novi Sad)
    const city = 'N/A'
    const pib = col(r, 'acCode') || null
    const maticniBroj = col(r, 'acRegNo') || null
    const salonName = col(r, 'acName3') || col(r, 'acName2') || name

    try {
      // Check if user already exists
      const existingUserId = b2bSubjectToUser.get(acSubject) || erpIdToUser.get(acSubject)

      if (existingUserId) {
        // Update existing user
        await prisma.user.update({
          where: { id: existingUserId },
          data: {
            name,
            phone,
          },
        })

        // Update B2bProfile if B2B
        if (isB2b) {
          const existingProfile = await prisma.b2bProfile.findUnique({ where: { userId: existingUserId } })
          if (existingProfile) {
            await prisma.b2bProfile.update({
              where: { userId: existingUserId },
              data: { salonName, pib, maticniBroj },
            })
          }
        }

        updated++
      } else {
        // Create new user
        const email = `pantheon_${acSubject}@altamoda.import`
        const passwordHash = await generateDummyHash()

        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            name,
            phone,
            role: isB2b ? 'b2b' : 'b2c',
            status: 'active',
            erpId: acSubject,
          },
        })

        // Create B2bProfile for B2B customers
        if (isB2b) {
          await prisma.b2bProfile.create({
            data: {
              userId: user.id,
              salonName,
              pib,
              maticniBroj,
              erpSubjectId: acSubject,
            },
          })
        }

        // Create UserAddress
        await prisma.userAddress.create({
          data: {
            userId: user.id,
            label: isB2b ? 'Poslovna adresa' : 'Adresa',
            street,
            city,
            postalCode,
            country,
            isDefault: true,
          },
        })

        // Update lookup maps for subsequent rows
        if (isB2b) b2bSubjectToUser.set(acSubject, user.id)
        erpIdToUser.set(acSubject, user.id)

        created++
      }
    } catch (err) {
      let msg = (err as Error).message
      if (msg.includes('Unique constraint')) msg = 'Duplikat korisnika (email ili erpId)'
      else if (msg.length > 150) msg = msg.slice(0, 150) + '...'
      errors.push({ row: rowNum, name, error: msg })
    }
  }

  return { created, updated, skipped, errors }
}

/* ═══════════════════════════════════════════════════════════════
   STEP 2: PROCESS ORDERS (tHE_Order)
   ═══════════════════════════════════════════════════════════════ */

async function processOrders(rows: Record<string, unknown>[]): Promise<ImportResult> {
  let created = 0, updated = 0, skipped = 0
  const errors: { row: number; name?: string; error: string }[] = []

  // Collect all consignee IDs from the import file to scope the lookups
  const allConsigneeIds = [...new Set(rows.map(r => cleanId(col(r, 'acConsignee'))).filter(Boolean))]

  // Pre-load user lookups scoped to relevant consignee IDs only
  const relevantB2b = allConsigneeIds.length > 0
    ? await prisma.b2bProfile.findMany({
        where: { erpSubjectId: { in: allConsigneeIds } },
        select: { erpSubjectId: true, userId: true },
      })
    : []
  const relevantErpUsers = allConsigneeIds.length > 0
    ? await prisma.user.findMany({
        where: { erpId: { in: allConsigneeIds } },
        select: { id: true, erpId: true },
      })
    : []

  const b2bLookup = new Map(relevantB2b.filter(b => b.erpSubjectId).map(b => [b.erpSubjectId!, b.userId]))
  const erpUserLookup = new Map(relevantErpUsers.filter(u => u.erpId).map(u => [u.erpId!, u.id]))

  // Pre-load user addresses scoped to matched users only
  const matchedUserIds = [...new Set([...b2bLookup.values(), ...erpUserLookup.values()])]
  const userAddresses = matchedUserIds.length > 0
    ? await prisma.userAddress.findMany({
        where: { userId: { in: matchedUserIds }, isDefault: true },
        select: { userId: true, street: true, city: true, postalCode: true, country: true },
      })
    : []
  const addressByUser = new Map(userAddresses.map(a => [a.userId, a]))

  // Pre-load existing orders by erpId
  const allOrderErpIds = rows.map(r => cleanId(col(r, 'acKey'))).filter(Boolean)
  const existingOrders = allOrderErpIds.length > 0
    ? await prisma.order.findMany({
        where: { erpId: { in: allOrderErpIds } },
        select: { id: true, erpId: true },
      })
    : []
  const orderErpToId = new Map(existingOrders.filter(o => o.erpId).map(o => [o.erpId!, o.id]))

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const acKey = cleanId(col(r, 'acKey'))
    const acKeyView = col(r, 'acKeyView') || acKey
    const acConsignee = cleanId(col(r, 'acConsignee'))

    if (!acKey) { skipped++; continue }

    try {
      // Date conversion
      const adDate = Number(col(r, 'adDate'))
      const orderDate = excelDateToJS(adDate) || new Date()

      // Find user
      let userId = b2bLookup.get(acConsignee) || erpUserLookup.get(acConsignee)

      // Create placeholder user if not found
      if (!userId && acConsignee) {
        const placeholderEmail = `pantheon_${acConsignee}@altamoda.import`
        const existingPlaceholder = await prisma.user.findUnique({ where: { email: placeholderEmail } })
        if (existingPlaceholder) {
          userId = existingPlaceholder.id
        } else {
          const contactPerson = col(r, 'acContactPrsn') || `Kupac ${acConsignee}`
          const placeholder = await prisma.user.create({
            data: {
              email: placeholderEmail,
              passwordHash: await generateDummyHash(),
              name: contactPerson,
              role: 'b2b',
              status: 'active',
              erpId: acConsignee,
            },
          })
          userId = placeholder.id
          erpUserLookup.set(acConsignee, placeholder.id)
        }
      }

      if (!userId) {
        errors.push({ row: rowNum, name: acKeyView, error: 'Nije moguće povezati ili kreirati korisnika' })
        continue
      }

      // Map fields
      const subtotal = Number(col(r, 'anValue')) || 0
      const discountAmount = Number(col(r, 'anDiscount')) || 0
      const total = Number(col(r, 'anForPay')) || 0
      const currency = col(r, 'acCurrency') || 'RSD'
      const acStatus = col(r, 'acStatus')
      const acFinished = col(r, 'acFinished')
      const status = mapOrderStatus(acStatus, acFinished)
      const paymentMethod = mapPaymentMethod(col(r, 'acPayMethod'))
      const paymentStatus = mapPaymentStatus(acFinished)

      // Notes from acNote (strip RTF)
      const rawNote = col(r, 'acNote')
      const notes = rawNote ? stripRtf(rawNote) : null

      // Address from user
      const addr = addressByUser.get(userId)
      const addressJson = addr
        ? { street: addr.street, city: addr.city, postalCode: addr.postalCode, country: addr.country }
        : null

      const existingOrderId = orderErpToId.get(acKey)

      if (existingOrderId) {
        // Update existing order + delete old items (will be re-created in step 3)
        await prisma.$transaction([
          prisma.orderItem.deleteMany({ where: { orderId: existingOrderId } }),
          prisma.order.update({
            where: { id: existingOrderId },
            data: {
              userId,
              status,
              subtotal,
              discountAmount,
              shippingCost: 0,
              total,
              currency,
              paymentMethod,
              paymentStatus,
              shippingAddress: addressJson ?? undefined,
              billingAddress: addressJson ?? undefined,
              notes,
              erpId: acKey,
              erpSynced: true,
              createdAt: orderDate,
            },
          }),
        ])
        updated++
      } else {
        // Create new order + status history
        const order = await prisma.order.create({
          data: {
            orderNumber: acKeyView,
            userId,
            status,
            subtotal,
            discountAmount,
            shippingCost: 0,
            total,
            currency,
            paymentMethod,
            paymentStatus,
            shippingAddress: addressJson ?? undefined,
            billingAddress: addressJson ?? undefined,
            notes,
            erpId: acKey,
            erpSynced: true,
            createdAt: orderDate,
          },
        })
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status,
            note: 'Uvezeno iz Pantheon ERP-a',
          },
        })
        orderErpToId.set(acKey, order.id)
        created++
      }
    } catch (err) {
      let msg = (err as Error).message
      if (msg.includes('Unique constraint') && msg.includes('order_number')) {
        msg = `Broj porudzbine "${acKeyView}" vec postoji`
      } else if (msg.length > 150) {
        msg = msg.slice(0, 150) + '...'
      }
      errors.push({ row: rowNum, name: acKeyView, error: msg })
    }
  }

  return { created, updated, skipped, errors }
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3: PROCESS ORDER ITEMS (tHE_Orderitem)
   ═══════════════════════════════════════════════════════════════ */

async function processOrderItems(rows: Record<string, unknown>[]): Promise<ImportResult> {
  let created = 0, skipped = 0
  const errors: { row: number; name?: string; error: string }[] = []

  // Pre-load: Order.erpId -> Order.id
  const allOrderErpIds = [...new Set(rows.map(r => cleanId(col(r, 'acKey'))).filter(Boolean))]
  const orders = allOrderErpIds.length > 0
    ? await prisma.order.findMany({
        where: { erpId: { in: allOrderErpIds } },
        select: { id: true, erpId: true },
      })
    : []
  const orderLookup = new Map(orders.filter(o => o.erpId).map(o => [o.erpId!, o.id]))

  // Pre-load: Product.erpId -> { id, sku }
  const allProductErpIds = [...new Set(rows.map(r => cleanId(col(r, 'acIdent'))).filter(Boolean))]
  const products = allProductErpIds.length > 0
    ? await prisma.product.findMany({
        where: { erpId: { in: allProductErpIds } },
        select: { id: true, sku: true, erpId: true },
      })
    : []
  const productLookup = new Map(products.filter(p => p.erpId).map(p => [p.erpId!, { id: p.id, sku: p.sku }]))

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const acKey = cleanId(col(r, 'acKey'))
    const acIdent = cleanId(col(r, 'acIdent'))
    const productName = col(r, 'acName') || `Proizvod ${acIdent}`

    if (!acKey || !acIdent) { skipped++; continue }

    const orderId = orderLookup.get(acKey)
    if (!orderId) {
      errors.push({ row: rowNum, name: productName, error: `Porudzbina sa erpId "${acKey}" nije pronadjena u bazi` })
      continue
    }

    const product = productLookup.get(acIdent)
    if (!product) {
      errors.push({ row: rowNum, name: productName, error: `Proizvod sa erpId "${acIdent}" nije pronadjen u bazi. Uvezite proizvode prvo.` })
      continue
    }

    try {
      const rawQty = Number(col(r, 'anQty'))
      const quantity = isNaN(rawQty) || rawQty <= 0 ? 1 : Math.round(rawQty)
      const unitPrice = Number(col(r, 'anPrice')) || 0
      const totalPrice = Number(col(r, 'anPVForPay')) || (unitPrice * quantity)

      await prisma.orderItem.create({
        data: {
          orderId,
          productId: product.id,
          productName,
          productSku: product.sku,
          quantity,
          unitPrice,
          totalPrice,
        },
      })
      created++
    } catch (err) {
      let msg = (err as Error).message
      if (msg.length > 150) msg = msg.slice(0, 150) + '...'
      errors.push({ row: rowNum, name: productName, error: msg })
    }
  }

  return { created, updated: 0, skipped, errors }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HANDLER — Multi-file import
   ═══════════════════════════════════════════════════════════════ */

interface FileInfo {
  name: string
  type: OrderFileType
  label: string
  rows: number
}

export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  if (files.length === 0) {
    const single = formData.get('file') as File | null
    if (single) files.push(single)
  }

  if (files.length === 0) {
    return errorResponse('Nijedan fajl nije prosledjen. Izaberite jedan ili vise fajlova.', 400)
  }

  if (files.length > 5) {
    return errorResponse('Maksimalno 5 fajlova odjednom.', 400)
  }

  // Validate all files first
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      return errorResponse(`Fajl "${file.name}" je prevelik. Maksimalno 10MB po fajlu.`, 400)
    }
    const ext = file.name.toLowerCase().split('.').pop()
    if (!['csv', 'xlsx', 'xls', 'txt'].includes(ext || '')) {
      return errorResponse(`Fajl "${file.name}" ima nepodrzani format (.${ext}). Koristite .csv, .xlsx ili .xls`, 400)
    }
  }

  // Parse all files and detect types
  const parsedFiles: { file: File; type: OrderFileType; headers: string[]; rows: Record<string, unknown>[] }[] = []

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer()
      const { headers, rows } = parseFile(buffer, file.name)
      if (rows.length === 0) {
        return errorResponse(`Fajl "${file.name}" ne sadrzi podatke.`, 400)
      }
      if (rows.length > 10000) {
        return errorResponse(`Fajl "${file.name}" ima ${rows.length} redova. Maksimalno 10.000.`, 400)
      }
      const type = detectOrderFileType(headers)
      if (type === 'unknown') {
        return errorResponse(
          `Fajl "${file.name}" — nije prepoznat format.\n\n` +
          `Pronadjene kolone: ${headers.slice(0, 15).join(', ')}${headers.length > 15 ? '...' : ''}\n\n` +
          `Podrzani formati:\n` +
          `• Kupci (the_setSubj): acSubject, acName2, acAddress\n` +
          `• Porudzbine (tHE_Order): acKey, adDate, anForPay\n` +
          `• Stavke (tHE_Orderitem): acKey, acIdent, anQty`,
          400
        )
      }
      parsedFiles.push({ file, type, headers, rows })
    } catch (err) {
      return errorResponse(`Greska pri citanju "${file.name}": ${(err as Error).message}`, 400)
    }
  }

  // Sort by processing order: customers -> orders -> items
  const ORDER: Record<OrderFileType, number> = {
    pantheon_customers: 1,
    pantheon_orders: 2,
    pantheon_order_items: 3,
    unknown: 9,
  }
  parsedFiles.sort((a, b) => ORDER[a.type] - ORDER[b.type])

  // Process each file in order
  const fileResults: {
    fileName: string
    fileType: string
    fileLabel: string
    rows: number
    created: number
    updated: number
    skipped: number
    errors: { row: number; name?: string; error: string }[]
  }[] = []

  const detectedFiles: FileInfo[] = parsedFiles.map(f => ({
    name: f.file.name,
    type: f.type,
    label: FILE_TYPE_LABELS[f.type],
    rows: f.rows.length,
  }))

  for (const pf of parsedFiles) {
    let result: ImportResult

    if (pf.type === 'pantheon_customers') {
      result = await processCustomers(pf.rows)
    } else if (pf.type === 'pantheon_orders') {
      result = await processOrders(pf.rows)
    } else {
      result = await processOrderItems(pf.rows)
    }

    fileResults.push({
      fileName: pf.file.name,
      fileType: pf.type,
      fileLabel: FILE_TYPE_LABELS[pf.type],
      rows: pf.rows.length,
      ...result,
    })
  }

  // Aggregate totals
  const totals = {
    created: fileResults.reduce((s, r) => s + r.created, 0),
    updated: fileResults.reduce((s, r) => s + r.updated, 0),
    skipped: fileResults.reduce((s, r) => s + r.skipped, 0),
    errors: fileResults.reduce((s, r) => s + r.errors.length, 0),
  }

  return successResponse({
    files: detectedFiles,
    results: fileResults,
    totals,
  })
})
