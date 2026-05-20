/**
 * Pantheon (tkomserver) HTTP client.
 *
 * Direct port of legacy CodeIgniter `Synchronization_model::api_call()` /
 * `order_api_call()`. One endpoint, credentials posted on every request,
 * action field selects the operation.
 */

import type {
  PantheonAction,
  PantheonOrderPayload,
  PantheonOrderResponse,
  PantheonProductsResponse,
  PantheonRawProduct,
  PantheonRawStock,
  PantheonStockResponse,
  NormalizedPantheonProduct,
  NormalizedPantheonStock,
} from './types'

export class PantheonError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    readonly httpStatus?: number,
  ) {
    super(message)
    this.name = 'PantheonError'
  }
}

interface PantheonClientConfig {
  apiUrl: string
  apiUser: string
  apiPass: string
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 30_000

export class PantheonClient {
  private readonly config: PantheonClientConfig

  constructor(config?: Partial<PantheonClientConfig>) {
    const apiUrl = config?.apiUrl ?? process.env.PANTHEON_API_URL
    const apiUser = config?.apiUser ?? process.env.PANTHEON_API_USER
    const apiPass = config?.apiPass ?? process.env.PANTHEON_API_PASS
    const timeoutMs =
      config?.timeoutMs ??
      (process.env.PANTHEON_API_TIMEOUT_MS
        ? Number(process.env.PANTHEON_API_TIMEOUT_MS)
        : DEFAULT_TIMEOUT_MS)

    if (!apiUrl || !apiUser || !apiPass) {
      throw new PantheonError(
        'Pantheon client not configured. Missing PANTHEON_API_URL, PANTHEON_API_USER, or PANTHEON_API_PASS.',
      )
    }

    this.config = { apiUrl, apiUser, apiPass, timeoutMs }
  }

  /** POST to tkomserver with credentials + action (and optional extra fields). */
  private async post<T>(
    action: PantheonAction,
    extra: Record<string, string> = {},
  ): Promise<T> {
    const body = new URLSearchParams({
      userEmail: this.config.apiUser,
      userPass: this.config.apiPass,
      action,
      ...extra,
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)

    let res: Response
    try {
      res = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: controller.signal,
        cache: 'no-store',
      })
    } catch (err) {
      const aborted = (err as Error)?.name === 'AbortError'
      throw new PantheonError(
        aborted
          ? `Pantheon request timed out after ${this.config.timeoutMs}ms (action=${action})`
          : `Pantheon request failed (action=${action}): ${(err as Error).message}`,
        err,
      )
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) {
      throw new PantheonError(
        `Pantheon HTTP ${res.status} (action=${action})`,
        undefined,
        res.status,
      )
    }

    const text = await res.text()
    if (!text || text.trim() === '') {
      throw new PantheonError(`Pantheon returned empty response (action=${action})`)
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      throw new PantheonError(
        `Pantheon returned non-JSON (action=${action}): ${text.slice(0, 200)}`,
        err,
      )
    }

    return parsed as T
  }

  // ─── Inbound: fetch products / prices / stock ────────────────────────────

  /** Fetch full product catalog (also used for price sync in the legacy site). */
  async fetchProducts(): Promise<PantheonRawProduct[]> {
    const res = await this.post<PantheonProductsResponse>('products')
    if (!Array.isArray(res?.products)) {
      throw new PantheonError(
        `Pantheon response missing "products" array (action=products)`,
      )
    }
    return res.products
  }

  /** Fetch stock-only payload. */
  async fetchStock(): Promise<PantheonRawStock[]> {
    const res = await this.post<PantheonStockResponse>('stock')
    if (!Array.isArray(res?.products)) {
      throw new PantheonError(
        `Pantheon response missing "products" array (action=stock)`,
      )
    }
    return res.products
  }

  // ─── Outbound: push order ────────────────────────────────────────────────

  /**
   * Push one order to Pantheon via action=altaorder.
   * Payload is JSON-stringified into the `data` POST field, matching the legacy
   * CodeIgniter `order_api_call()` exactly.
   */
  async pushOrder(payload: PantheonOrderPayload): Promise<PantheonOrderResponse> {
    return this.post<PantheonOrderResponse>('altaorder', {
      data: JSON.stringify(payload),
    })
  }
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

/**
 * Coerce + trim a raw product row.
 *
 * Field mapping verified against live Pantheon response (2026-05-16):
 *   c = price WITH VAT (retail) — what we sell at
 *   d = price WITHOUT VAT (cost) — pre-VAT amount
 *
 * The legacy PHP got this wrong and used `e` (always 0) as the main price.
 * We use `c`/`d` here, which matches reality.
 *
 * Per legacy PHP (`Synchronization_model::update_product`), the product code
 * may have trailing whitespace — `trim()` is mandatory.
 *
 * Returns null for bookkeeping entries (codes containing ":", e.g. "11:Avans"
 * which are VAT prepayment line items, not real products).
 */
export function normalizeProduct(
  raw: PantheonRawProduct,
): NormalizedPantheonProduct | null {
  const code = String(raw.a ?? '').trim()
  if (!code) return null
  if (code.includes(':')) return null // Avans / bookkeeping entries — skip

  return {
    code,
    name: String(raw.b ?? '').trim(),
    priceWithVat: toNumber(raw.c),
    priceWithoutVat: toNumber(raw.d),
    stock: Math.max(0, Math.floor(toNumber(raw.f))),
    isActive: String(raw.g ?? '').trim().toUpperCase() === 'T',
  }
}

export function normalizeStock(raw: PantheonRawStock): NormalizedPantheonStock | null {
  const code = String(raw.a ?? '').trim()
  if (!code) return null
  if (code.includes(':')) return null // Avans / bookkeeping entries — skip
  return {
    code,
    stock: Math.max(0, Math.floor(toNumber(raw.f))),
  }
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

// ─── Lazy singleton ──────────────────────────────────────────────────────────

let _client: PantheonClient | null = null

/** Get the process-wide Pantheon client. Throws if env vars are missing. */
export function getPantheonClient(): PantheonClient {
  if (!_client) _client = new PantheonClient()
  return _client
}
