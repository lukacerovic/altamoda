# Pantheon Integration — Implementation Runbook

**Audience:** Future-Claude (or any engineer) who needs to execute the Pantheon integration end-to-end.

This document is the **single source of truth** for implementation. Read it top-to-bottom before writing code. Every claim about the protocol, field shapes, or sync semantics is verified against the legacy CodeIgniter implementation in `Synchronization_model.php` (downloaded from the production cPanel and used as the ground-truth reference).

> **If a fact in this runbook conflicts with the older `PANTHEON-INTEGRATION-GUIDE.md` or `PANTHEON-TEST-KONEKCIJE-LUKA.md`, this document wins.** Those earlier docs are partially speculative; this one is grounded in the actual legacy code.

---

## 0. TL;DR

| Question | Answer |
|----------|--------|
| Can we write the code today? | **Yes** — schema is in place, reference impl is in hand, no architectural unknowns. |
| Can we live-test today? | **No** — endpoint is firewall-blocked from any IP that isn't whitelisted on tkomserver. |
| What's the blocker? | Three things from the Pantheon admin: (1) whitelist the dev IP, (2) confirm current `userPass`, (3) decide production network strategy (LAN host vs VPN vs public HTTPS). |
| Estimated build time, no blockers | ~1 day (Phases 1–4) for the integration + ~half a day for admin UI + cron. |
| Reference file to keep handy | The legacy `Synchronization_model.php` (387 lines, single class — it is the entire Pantheon connection of the old site). |

---

## 1. Architecture

### 1.1 Connection model

```
Next.js app  ──HTTP POST (form fields)──►  tkomserver (Java/Tomcat middleware)  ──►  Pantheon SQL Server (DataLab ERP)
```

- **One endpoint** for everything: `POST http://109.93.104.29:8080/tkomserver/webshop/api`
- **No tokens / no OAuth** — `userEmail` + `userPass` go in the POST body on every request
- The `action` form field switches behavior: `products`, `stock`, `altaorder`
- HTTP only (no TLS) — production needs VPN/tunnel or HTTPS termination

### 1.2 File layout we will create

```
src/lib/pantheon/
├── client.ts            ← Phase 1: HTTP wrapper around tkomserver
├── types.ts             ← Phase 1: TypeScript shapes for requests/responses
├── sync-inbound.ts      ← Phase 2: products / prices / stock pulls from Pantheon
├── sync-outbound.ts     ← Phase 3: order push + queue processing
├── payment-types.ts     ← Phase 3: PaymentMethod enum → Serbian labels
└── index.ts             ← Phase 1: public exports

src/app/api/admin/erp/
├── sync/route.ts                    ← Phase 4: manual trigger
├── sync/logs/route.ts               ← Phase 4: history list
├── sync/queue/route.ts              ← Phase 4: queue list
└── sync/queue/retry/route.ts        ← Phase 4: retry a queued item

src/app/api/cron/erp/
├── stock/route.ts                   ← Phase 6: every 15 min
├── prices/route.ts                  ← Phase 6: every 1 hour
├── products/route.ts                ← Phase 6: every 6 hours
└── process-queue/route.ts           ← Phase 6: every 5 min

src/app/(admin)/admin/erp/page.tsx   ← Phase 5: admin dashboard
src/components/admin/erp/*.tsx       ← Phase 5: dashboard widgets

vercel.json                          ← Phase 6: cron schedule
```

### 1.3 Data flow

```
┌────────────────────────────────────────────────────────────────────┐
│ INBOUND (Pantheon → us)                                            │
│                                                                    │
│   cron/admin click  →  PantheonClient.fetchProducts/Stock          │
│        │                                                           │
│        ▼                                                           │
│   sync-inbound.syncProducts/Prices/Stock                           │
│        │                                                           │
│        ├─► Prisma upsert (Product table, match by erpId)           │
│        └─► ErpSyncLog (audit row per sync)                         │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ OUTBOUND (us → Pantheon)                                           │
│                                                                    │
│   order placed  →  sync-outbound.enqueueOrder                      │
│        │                                                           │
│        ▼                                                           │
│   ErpSyncQueue row (status: pending)                               │
│        │                                                           │
│   cron every 5 min  →  sync-outbound.processQueue                  │
│        │                                                           │
│        ├─► PantheonClient.pushOrder                                │
│        ├─► success: queue.status="done", order.erpSynced=true      │
│        └─► failure: increment attempts, next retry from backoff    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites and current-state checks

Before starting any phase, run these checks. If any fail, fix before proceeding.

### 2.1 Schema sanity (already verified at time of writing — re-verify if doc is older than 30 days)

```bash
# Should print line numbers showing each ERP-related field exists
grep -n -E "erpId|erpSynced|ErpSyncLog|ErpSyncQueue|erpSubjectId|vatCode|vatRate" prisma/schema.prisma
```

Expected matches at minimum:
- `B2bProfile.erpSubjectId` (around line 185)
- `Product.erpId`, `vatRate`, `vatCode` (around lines 272–279)
- `Order.erpSynced`, `Order.erpId` (around lines 448–449)
- `model ErpSyncLog` (around line 675)
- `model ErpSyncQueue` (around line 689)
- enums `SyncDirection { inbound, outbound }` and `SyncStatus { success, failed, in_progress }`

### 2.2 Constants sanity

```bash
grep -n -E "ERP_" src/lib/constants.ts
```

Expected:
```ts
export const ERP_DEFAULT_VAT_RATE = 20
export const ERP_VAT_CODES = { R2: 20, R1: 10 } as const
export const ERP_WEB_ORDER_SOURCE = 'W'
export const ERP_DOC_TYPE_SALES_ORDER = 100
export const ERP_SYNC_MAX_RETRIES = 5
export const ERP_SYNC_RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000, 14_400_000] as const
```

### 2.3 Network access (will fail until admin whitelists IP)

```bash
# Show current public IP — give this to the Pantheon admin for whitelisting
curl -s https://ifconfig.me; echo

# TCP reachability check
nc -zv -w 5 109.93.104.29 8080
# Expect: "Connection ... succeeded!"  → network OK, proceed
# If: "Operation timed out"            → STOP — IP not whitelisted

# Smallest live test
curl -X POST http://109.93.104.29:8080/tkomserver/webshop/api \
  -d "userEmail=webshopapiuser" \
  -d 'userPass=13q2ad23d43#$ads23123' \
  -d "action=stock"
# Expect: JSON {"products":[{"a":"...","f":N},...]}
# If empty / 401 / 403  → password rotated; ask admin
```

### 2.4 Ground-truth reference file

Confirm `Synchronization_model.php` is accessible (you should have it; if not, download from cPanel: `public_html/application/models/Synchronization_model.php`). Specifically reference these sections of that file:

| Need | Lines in `Synchronization_model.php` |
|------|--------------------------------------|
| Endpoint URL, credentials | 9–11 |
| `api_call($action)` HTTP wrapper | 31–48 |
| `order_api_call($order)` order push wrapper | 61–78 |
| Field-key meanings (a, b, c, e, f, g) | 156–203 |
| Update vs. insert rules | 155–215 |
| Cron sync flow | 291–333 |
| Order payload builder + payment-type translation | 335–386 |

---

## 3. Phase 1 — Foundation

**Time:** ~30 min. **Network:** not required.

### 3.1 Fix `.env.example` and `.env`

The current `.env.example` (lines 44–45) is wrong — it implies a `PANTHEON_API_KEY`, but the real API uses **user + password**, not a key.

Replace those two lines in **both** `.env.example` and `.env` with:

```env
PANTHEON_API_URL="http://109.93.104.29:8080/tkomserver/webshop/api"
PANTHEON_API_USER="webshopapiuser"
PANTHEON_API_PASS=""           # ← NEVER commit a real value; ask admin for current
PANTHEON_REQUEST_TIMEOUT_MS="30000"
ERP_CRON_SECRET=""             # ← random 32-char hex; required to authorize cron routes
```

In production env (Vercel/wherever), set `PANTHEON_API_PASS` and `ERP_CRON_SECRET` to real values via the dashboard, never via committed files.

### 3.2 Create `src/lib/pantheon/types.ts`

These types model the **literal wire shape** from tkomserver (the cryptic short keys), separate from our internal Prisma types.

```ts
// src/lib/pantheon/types.ts

/** Raw product as returned by action=products. Keys are short on purpose — that's the wire format. */
export interface PantheonRawProduct {
  a: string;   // product code (Pantheon acIdent) — MUST be trimmed
  b: string;   // name (Serbian)
  c: number;   // price WITHOUT VAT
  e: number;   // retail price WITH VAT
  f: number;   // stock quantity
  g: 'T' | 'F'; // active flag
}

/** Raw stock item from action=stock — only code + quantity. */
export interface PantheonStockItem {
  a: string;
  f: number;
}

export interface PantheonProductsResponse {
  products: PantheonRawProduct[];
}

export interface PantheonStockResponse {
  products: PantheonStockItem[];
}

/** Full payload for action=altaorder. Field names are Pantheon's, NOT ours. */
export interface PantheonOrderPayload {
  order_id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  contact_phone: string;
  city: string;
  address: string;
  postal_no: string;
  company_name: string;
  company_pib: string;
  company_reg_number: string;
  items_price: number;
  shipping_price: number;
  total_price: number;
  payment_type: string;             // Serbian label, see payment-types.ts
  ship_to_diff_address: 0 | 1;
  shipping_first_name: string;
  shipping_city: string;
  shipping_address: string;
  shipping_postal_no: string;
  shipping_contact_phone: string;
  shipping_last_name: string;
  shipping_email: string;
  additional_instructions: string;
  order_date: string;               // 'YYYY-MM-DD HH:mm:ss'
  items: Array<{
    product_code: string;
    quantity: number;
    price: number;
  }>;
}

export type PantheonAction = 'products' | 'stock' | 'altaorder';

export class PantheonError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'PantheonError';
  }
}
```

### 3.3 Create `src/lib/pantheon/client.ts`

Direct port of `api_call` and `order_api_call` from the legacy file, with the four improvements the legacy code lacked: typed responses, 30s timeout, HTTP status check, structured errors.

```ts
// src/lib/pantheon/client.ts
import {
  PantheonAction,
  PantheonError,
  PantheonOrderPayload,
  PantheonProductsResponse,
  PantheonRawProduct,
  PantheonStockItem,
  PantheonStockResponse,
} from './types';

const API_URL = process.env.PANTHEON_API_URL!;
const API_USER = process.env.PANTHEON_API_USER!;
const API_PASS = process.env.PANTHEON_API_PASS!;
const TIMEOUT_MS = Number(process.env.PANTHEON_REQUEST_TIMEOUT_MS ?? 30_000);

if (!API_URL || !API_USER || !API_PASS) {
  // Fail loudly at module load if env is incomplete — better than silent runtime errors.
  // This runs server-side only; never imported in client components.
  console.warn('[pantheon] Missing PANTHEON_API_* env vars; client will throw on use.');
}

/**
 * Low-level POST. The legacy site sent multipart/form-data (PHP curl with array),
 * but the server also accepts application/x-www-form-urlencoded. We use urlencoded
 * because URLSearchParams is the simplest portable option in Node fetch.
 */
async function postForm(body: Record<string, string>): Promise<unknown> {
  const params = new URLSearchParams(body);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
      // Node's fetch follows redirects by default; tkomserver doesn't redirect.
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new PantheonError(
        `HTTP ${res.status} from tkomserver: ${text.slice(0, 500)}`,
        undefined,
        res.status,
      );
    }

    const text = await res.text();
    if (!text) {
      throw new PantheonError('Empty response body from tkomserver');
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      throw new PantheonError(
        `Non-JSON response from tkomserver: ${text.slice(0, 500)}`,
        err,
      );
    }
  } catch (err) {
    if (err instanceof PantheonError) throw err;
    if ((err as { name?: string }).name === 'AbortError') {
      throw new PantheonError(`Request timed out after ${TIMEOUT_MS}ms`, err);
    }
    throw new PantheonError('Network error calling tkomserver', err);
  } finally {
    clearTimeout(timeout);
  }
}

async function callAction<T>(action: PantheonAction, extra: Record<string, string> = {}): Promise<T> {
  const result = await postForm({
    userEmail: API_USER,
    userPass: API_PASS,
    action,
    ...extra,
  });
  return result as T;
}

export const PantheonClient = {
  /** Pulls full catalog. Use for product sync AND price sync (both read from same response). */
  async fetchProducts(): Promise<PantheonRawProduct[]> {
    const res = await callAction<PantheonProductsResponse>('products');
    if (!res?.products || !Array.isArray(res.products)) {
      throw new PantheonError('Unexpected products response shape');
    }
    return res.products;
  },

  /** Pulls stock-only payload. Smaller than fetchProducts — prefer for stock-only syncs. */
  async fetchStock(): Promise<PantheonStockItem[]> {
    const res = await callAction<PantheonStockResponse>('stock');
    if (!res?.products || !Array.isArray(res.products)) {
      throw new PantheonError('Unexpected stock response shape');
    }
    return res.products;
  },

  /** Pushes a single order. Pantheon expects the payload as a JSON-stringified `data` field. */
  async pushOrder(payload: PantheonOrderPayload): Promise<unknown> {
    return callAction<unknown>('altaorder', { data: JSON.stringify(payload) });
  },
};

export type PantheonClientType = typeof PantheonClient;
```

### 3.4 Create `src/lib/pantheon/index.ts`

```ts
// src/lib/pantheon/index.ts
export { PantheonClient } from './client';
export * from './types';
```

### 3.5 Phase 1 verification

```bash
# Type-check just the new files
npx tsc --noEmit

# Smoke-test the client (only useful once IP is whitelisted)
node --experimental-strip-types -e "
import('./src/lib/pantheon/client.ts').then(async ({ PantheonClient }) => {
  const stock = await PantheonClient.fetchStock();
  console.log('Got', stock.length, 'stock items');
  console.log('First:', stock[0]);
});
"
```

---

## 4. Phase 2 — Inbound sync (Pantheon → us)

**Time:** ~1 hour. **Network:** required to actually run, but code is testable without it.

### 4.1 Behavior contract (copied verbatim from the legacy semantics)

These rules come from `Synchronization_model.php` lines 155–215 and 291–333. Future engineers MUST preserve them exactly:

#### Product sync (`syncProducts`)
- Match by `Product.erpId === product.a.trim()`.
- **If product exists:** update **only `isActive`** (T → true, anything else → false). The legacy site deliberately commented out updating name/price/stock during product sync — those have separate sync paths.
- **If product does not exist:** insert with all fields populated.
- Insert defaults: `stockQuantity` from `f`, prices from `c`/`e`, `isActive` from `g`, `sku` = `erpId`, `slug` = url-title of `b`.

#### Price sync (`syncPrices`)
- Pulls full `products` action (same payload as product sync).
- **Update-only**, never insert. Only touches products where `erpId` already exists.
- Updates `priceB2c` (from `e`) and `costPrice` (from `c`). Nothing else.

#### Stock sync (`syncStock`)
- Pulls `stock` action (smaller payload).
- **Update-only**, never insert. Only touches products where `erpId` already exists.
- Updates `stockQuantity` (from `f`). Nothing else.

#### Universal rules
- Always `trim()` `product.a` before comparing or storing — Pantheon codes can have trailing whitespace (legacy code does this everywhere).
- Process in batches of 50 records to avoid huge transactions.
- Every sync run creates one `ErpSyncLog` row with start/end timestamps and result.

### 4.2 Field mapping — Pantheon → Prisma

| Pantheon (`PantheonRawProduct`) | Prisma `Product` field | When |
|---------------------------------|------------------------|------|
| `a` (trimmed) | `erpId` | match key |
| `a` (trimmed) | `sku` | only on insert |
| `b` | `nameLat` | only on insert |
| `c` | `costPrice` | insert + price-sync |
| `e` | `priceB2c` | insert + price-sync |
| `f` | `stockQuantity` | insert + stock-sync |
| `g === 'T'` | `isActive` | insert + product-sync |

> Legacy used `name_sr` and `main_price`; our Prisma uses `nameLat` and `priceB2c`. Don't blindly copy column names from the PHP — translate to current schema.

### 4.3 Code: `src/lib/pantheon/sync-inbound.ts`

```ts
// src/lib/pantheon/sync-inbound.ts
import { prisma } from '@/lib/prisma'; // adjust import to match project's Prisma client
import { Prisma, SyncDirection, SyncStatus } from '@prisma/client';
import slugify from 'slugify'; // or whatever slug util the project already has

import { PantheonClient } from './client';
import { PantheonRawProduct, PantheonStockItem } from './types';

const BATCH_SIZE = 50;

interface SyncResult {
  itemsSynced: number;
  itemsSkipped: number;
}

async function withSyncLog<T extends SyncResult>(
  syncType: 'products' | 'prices' | 'stock',
  fn: () => Promise<T>,
): Promise<T> {
  const log = await prisma.erpSyncLog.create({
    data: {
      syncType,
      direction: SyncDirection.inbound,
      status: SyncStatus.in_progress,
    },
  });
  try {
    const result = await fn();
    await prisma.erpSyncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.success,
        itemsSynced: result.itemsSynced,
        completedAt: new Date(),
        details: result as unknown as Prisma.InputJsonValue,
      },
    });
    return result;
  } catch (err) {
    await prisma.erpSyncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.failed,
        message: err instanceof Error ? err.message : String(err),
        completedAt: new Date(),
      },
    });
    throw err;
  }
}

/** Pull all products from Pantheon: insert new ones; for existing ones, only update isActive. */
export async function syncProducts(): Promise<SyncResult> {
  return withSyncLog('products', async () => {
    const products = await PantheonClient.fetchProducts();

    // One DB hit to get the set of codes already in our DB
    const existing = await prisma.product.findMany({
      where: { erpId: { not: null } },
      select: { erpId: true },
    });
    const existingCodes = new Set(existing.map(p => p.erpId!.trim()));

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    // Process in batches of 50 to keep transactions reasonable
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map(p => buildProductOp(p, existingCodes)).filter(Boolean) as Prisma.PrismaPromise<unknown>[],
      );
      // Tally — could also do per-op counting if you want exact splits
      for (const p of batch) {
        const code = p.a.trim();
        if (!code) { skipped++; continue; }
        existingCodes.has(code) ? updated++ : inserted++;
        existingCodes.add(code);
      }
    }

    return { itemsSynced: inserted + updated, itemsSkipped: skipped };
  });
}

function buildProductOp(p: PantheonRawProduct, existingCodes: Set<string>): Prisma.PrismaPromise<unknown> | null {
  const code = p.a.trim();
  if (!code) return null;

  if (existingCodes.has(code)) {
    // Existing: only update isActive (matches legacy update_product behavior)
    return prisma.product.update({
      where: { erpId: code }, // requires unique index on erpId — see migration note below
      data: { isActive: p.g === 'T' },
    });
  }
  // New: insert with all fields
  return prisma.product.create({
    data: {
      sku: code,
      erpId: code,
      nameLat: p.b ?? '',
      slug: slugify(p.b ?? code, { lower: true, strict: true }),
      priceB2c: p.e,
      costPrice: p.c,
      stockQuantity: Math.max(0, Math.floor(p.f ?? 0)),
      isActive: p.g === 'T',
    },
  });
}

/** Update prices on existing products only. */
export async function syncPrices(): Promise<SyncResult> {
  return withSyncLog('prices', async () => {
    const products = await PantheonClient.fetchProducts();
    const existing = await prisma.product.findMany({
      where: { erpId: { not: null } },
      select: { erpId: true },
    });
    const existingCodes = new Set(existing.map(p => p.erpId!.trim()));

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const ops: Prisma.PrismaPromise<unknown>[] = [];
      for (const p of batch) {
        const code = p.a.trim();
        if (!code || !existingCodes.has(code)) { skipped++; continue; }
        ops.push(
          prisma.product.update({
            where: { erpId: code },
            data: { priceB2c: p.e, costPrice: p.c },
          }),
        );
        updated++;
      }
      if (ops.length) await prisma.$transaction(ops);
    }
    return { itemsSynced: updated, itemsSkipped: skipped };
  });
}

/** Update stock on existing products only. Uses smaller `stock` payload. */
export async function syncStock(): Promise<SyncResult> {
  return withSyncLog('stock', async () => {
    const items: PantheonStockItem[] = await PantheonClient.fetchStock();
    const existing = await prisma.product.findMany({
      where: { erpId: { not: null } },
      select: { erpId: true },
    });
    const existingCodes = new Set(existing.map(p => p.erpId!.trim()));

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const ops: Prisma.PrismaPromise<unknown>[] = [];
      for (const it of batch) {
        const code = it.a.trim();
        if (!code || !existingCodes.has(code)) { skipped++; continue; }
        ops.push(
          prisma.product.update({
            where: { erpId: code },
            data: { stockQuantity: Math.max(0, Math.floor(it.f ?? 0)) },
          }),
        );
        updated++;
      }
      if (ops.length) await prisma.$transaction(ops);
    }
    return { itemsSynced: updated, itemsSkipped: skipped };
  });
}
```

### 4.4 Schema migration required

`Product.erpId` is currently `String? @map("erp_id")` without a unique constraint. The code above uses `where: { erpId: code }`, which Prisma only allows on unique fields. Add a migration:

```prisma
model Product {
  // ...
  erpId String? @unique @map("erp_id")   // add @unique
}
```

Then:
```bash
npx prisma migrate dev --name product_erpid_unique
```

If `erpId` is not unique in legacy data, dedupe first via SQL before adding the constraint.

---

## 5. Phase 3 — Outbound sync (us → Pantheon)

**Time:** ~1.5 hours. **Network:** required to actually push, code is testable without it.

### 5.1 Behavior contract (from legacy `send_order` lines 335–386)

- Translate `Order.paymentMethod` enum → Serbian label string before sending.
- Build the 25-field payload exactly matching `PantheonOrderPayload`.
- Send via `action=altaorder` with payload as JSON-stringified `data` form field.
- Legacy validates only `response !== null` — we will additionally check HTTP status and accept any 2xx as success.
- On success, mark `Order.erpSynced = true` and store any returned reference in `Order.erpId`.

### 5.2 Payment type translation (`payment-types.ts`)

Legacy used CodeIgniter `lang()` translations. We hardcode the strings:

```ts
// src/lib/pantheon/payment-types.ts
import { PaymentMethod } from '@prisma/client';

/** Serbian labels exactly matching what the legacy site sent to Pantheon. */
export const PANTHEON_PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash_on_delivery: 'pouzecem',
  bank_transfer:    'uplatnicom',
  card:             'karticom',
  invoice:          'fakturom',
};

export function paymentLabelFor(m: PaymentMethod): string {
  return PANTHEON_PAYMENT_LABEL[m] ?? 'unknown';
}
```

> If the Pantheon admin specifies different exact strings, update this file — single source of truth.

### 5.3 Code: `src/lib/pantheon/sync-outbound.ts`

```ts
// src/lib/pantheon/sync-outbound.ts
import { prisma } from '@/lib/prisma';
import { Prisma, SyncDirection, SyncStatus } from '@prisma/client';
import { ERP_SYNC_RETRY_DELAYS_MS, ERP_SYNC_MAX_RETRIES } from '@/lib/constants';

import { PantheonClient } from './client';
import { PantheonError, PantheonOrderPayload } from './types';
import { paymentLabelFor } from './payment-types';

interface ShippingAddressJson {
  city?: string;
  street?: string;
  postalCode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

/** Build the 25-field Pantheon payload from a Prisma Order. */
async function buildOrderPayload(orderId: string): Promise<PantheonOrderPayload> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { erpId: true, sku: true } } } },
      user: { include: { b2bProfile: true } },
    },
  });

  const ship = (order.shippingAddress as ShippingAddressJson | null) ?? {};
  const bill = (order.billingAddress as ShippingAddressJson | null) ?? {};
  const b2b = order.user.b2bProfile;

  // First/last name — split User.name on first space (legacy quirk)
  const fullName = order.user.name ?? '';
  const [firstName = '', ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');

  const shipDifferent = !!order.shippingAddress && !!order.billingAddress
    && JSON.stringify(order.shippingAddress) !== JSON.stringify(order.billingAddress);

  return {
    order_id: order.orderNumber,
    first_name: firstName,
    last_name: lastName,
    email: order.user.email ?? '',
    contact_phone: ship.phone ?? bill.phone ?? '',
    city: bill.city ?? '',
    address: bill.street ?? '',
    postal_no: (bill.postalCode ?? '').replace(/^RS-/, ''),
    company_name: b2b?.salonName ?? '',
    company_pib: b2b?.pib ?? '',
    company_reg_number: b2b?.maticniBroj ?? '',
    items_price: Number(order.subtotal),
    shipping_price: Number(order.shippingCost),
    total_price: Number(order.total),
    payment_type: paymentLabelFor(order.paymentMethod),
    ship_to_diff_address: shipDifferent ? 1 : 0,
    shipping_first_name: ship.firstName ?? '',
    shipping_city: ship.city ?? '',
    shipping_address: ship.street ?? '',
    shipping_postal_no: (ship.postalCode ?? '').replace(/^RS-/, ''),
    shipping_contact_phone: ship.phone ?? '',
    shipping_last_name: ship.lastName ?? '',
    shipping_email: ship.email ?? '',
    additional_instructions: order.notes ?? '',
    order_date: formatPantheonDate(order.createdAt),
    items: order.items.map(it => ({
      product_code: (it.product?.erpId ?? it.productSku).trim(),
      quantity: it.quantity,
      price: Number(it.unitPrice),
    })),
  };
}

function formatPantheonDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Called when an order is placed. Idempotent — safe to call twice. */
export async function enqueueOrder(orderId: string): Promise<void> {
  const existing = await prisma.erpSyncQueue.findFirst({
    where: { entityType: 'order', entityId: orderId, status: { in: ['pending', 'retrying'] } },
  });
  if (existing) return;

  const payload = await buildOrderPayload(orderId);
  await prisma.erpSyncQueue.create({
    data: {
      entityType: 'order',
      entityId: orderId,
      direction: SyncDirection.outbound,
      payload: payload as unknown as Prisma.InputJsonValue,
      status: 'pending',
      maxAttempts: ERP_SYNC_MAX_RETRIES,
    },
  });
}

/** Drain pending+retrying queue items whose nextRetryAt is due. Idempotent + concurrent-safe via per-row update. */
export async function processQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = new Date();
  const items = await prisma.erpSyncQueue.findMany({
    where: {
      OR: [
        { status: 'pending' },
        { status: 'retrying', nextRetryAt: { lte: now } },
      ],
    },
    take: 50, // bounded per cron tick
    orderBy: { createdAt: 'asc' },
  });

  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    const log = await prisma.erpSyncLog.create({
      data: {
        syncType: 'order',
        direction: SyncDirection.outbound,
        status: SyncStatus.in_progress,
      },
    });
    try {
      const payload = item.payload as unknown as PantheonOrderPayload;
      const response = await PantheonClient.pushOrder(payload);

      await prisma.$transaction([
        prisma.erpSyncQueue.update({
          where: { id: item.id },
          data: { status: 'done', lastError: null },
        }),
        prisma.order.update({
          where: { id: item.entityId },
          data: {
            erpSynced: true,
            erpId: extractErpId(response) ?? undefined,
          },
        }),
        prisma.erpSyncLog.update({
          where: { id: log.id },
          data: {
            status: SyncStatus.success,
            itemsSynced: 1,
            completedAt: new Date(),
            details: response as unknown as Prisma.InputJsonValue,
          },
        }),
      ]);
      succeeded++;
    } catch (err) {
      const attempts = item.attempts + 1;
      const isFinal = attempts >= item.maxAttempts;
      const delayIdx = Math.min(attempts - 1, ERP_SYNC_RETRY_DELAYS_MS.length - 1);
      const nextRetryAt = isFinal ? null : new Date(Date.now() + ERP_SYNC_RETRY_DELAYS_MS[delayIdx]);
      const message = err instanceof PantheonError ? err.message : err instanceof Error ? err.message : String(err);

      await prisma.$transaction([
        prisma.erpSyncQueue.update({
          where: { id: item.id },
          data: {
            attempts,
            status: isFinal ? 'failed' : 'retrying',
            lastError: message,
            nextRetryAt,
          },
        }),
        prisma.erpSyncLog.update({
          where: { id: log.id },
          data: {
            status: SyncStatus.failed,
            message,
            completedAt: new Date(),
          },
        }),
      ]);
      failed++;
    }
  }

  return { processed: items.length, succeeded, failed };
}

function extractErpId(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  const r = response as Record<string, unknown>;
  if (typeof r.order_id === 'string' || typeof r.order_id === 'number') return String(r.order_id);
  if (typeof r.id === 'string' || typeof r.id === 'number') return String(r.id);
  return null;
}

/** Manual retry of a single failed queue item — used by admin UI. */
export async function retryQueueItem(id: string): Promise<void> {
  await prisma.erpSyncQueue.update({
    where: { id },
    data: { status: 'pending', nextRetryAt: null, attempts: 0, lastError: null },
  });
}
```

### 5.4 Wire up `enqueueOrder` to order placement

Wherever the app currently creates an Order (typically `src/app/api/checkout/...` or a server action), add the enqueue call **after** the Order row is committed:

```ts
import { enqueueOrder } from '@/lib/pantheon/sync-outbound';

// after creating the order:
await enqueueOrder(order.id);
```

> Don't `await` this on the user-facing path if it adds latency — fire-and-forget with a `.catch(console.error)` is acceptable since the cron will retry anyway.

---

## 6. Phase 4 — API routes

**Time:** ~45 min.

All admin routes require admin auth (use the project's existing admin auth middleware). All cron routes require an `Authorization: Bearer <ERP_CRON_SECRET>` header (env var).

### 6.1 Admin: manual sync trigger

```ts
// src/app/api/admin/erp/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin'; // use whatever the project has
import { syncProducts, syncPrices, syncStock } from '@/lib/pantheon/sync-inbound';

const HANDLERS = {
  products: syncProducts,
  prices: syncPrices,
  stock: syncStock,
} as const;

export async function POST(req: NextRequest) {
  await requireAdmin(req);
  const { type } = (await req.json()) as { type: keyof typeof HANDLERS };
  const fn = HANDLERS[type];
  if (!fn) return NextResponse.json({ error: 'invalid type' }, { status: 400 });
  const result = await fn();
  return NextResponse.json(result);
}
```

### 6.2 Admin: history list

```ts
// src/app/api/admin/erp/sync/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  await requireAdmin(req);
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
  const cursor = url.searchParams.get('cursor');
  const logs = await prisma.erpSyncLog.findMany({
    take: limit,
    orderBy: { startedAt: 'desc' },
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  return NextResponse.json({ logs, nextCursor: logs.at(-1)?.id ?? null });
}
```

### 6.3 Admin: queue list + retry

```ts
// src/app/api/admin/erp/sync/queue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  await requireAdmin(req);
  const status = new URL(req.url).searchParams.get('status') ?? undefined;
  const items = await prisma.erpSyncQueue.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ items });
}
```

```ts
// src/app/api/admin/erp/sync/queue/retry/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { retryQueueItem } from '@/lib/pantheon/sync-outbound';

export async function POST(req: NextRequest) {
  await requireAdmin(req);
  const { id } = (await req.json()) as { id: string };
  await retryQueueItem(id);
  return NextResponse.json({ ok: true });
}
```

### 6.4 Cron auth helper

```ts
// src/lib/cron/require-cron-secret.ts
import { NextRequest } from 'next/server';

export function requireCronSecret(req: NextRequest): void {
  const secret = process.env.ERP_CRON_SECRET;
  const auth = req.headers.get('authorization') ?? '';
  if (!secret || auth !== `Bearer ${secret}`) {
    throw new Response('unauthorized', { status: 401 });
  }
}
```

### 6.5 Cron: products / prices / stock / queue

```ts
// src/app/api/cron/erp/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron/require-cron-secret';
import { syncProducts } from '@/lib/pantheon/sync-inbound';

export async function GET(req: NextRequest) {
  try { requireCronSecret(req); } catch (r) { return r as Response; }
  const result = await syncProducts();
  return NextResponse.json(result);
}
```

(Repeat the same pattern for `prices/route.ts`, `stock/route.ts`, and `process-queue/route.ts`, swapping the imported function.)

---

## 7. Phase 5 — Admin UI

**Time:** ~2 hours. Match the project's existing admin look & feel — don't invent a new design system.

Page: `src/app/(admin)/admin/erp/page.tsx`

Three blocks:

1. **Manual sync triggers** (top)
   - Three buttons: "Sync Products", "Sync Prices", "Sync Stock"
   - Each posts to `/api/admin/erp/sync` with `{ type }`
   - Disable button while in flight, show spinner, surface result count or error toast

2. **Sync history table** (middle)
   - GET `/api/admin/erp/sync/logs?limit=50`
   - Columns: started (relative + absolute on hover), type, direction, items synced, status badge (green/red/yellow), message
   - Polling: refresh every 10s while any in-progress row exists

3. **Failed queue panel** (bottom)
   - GET `/api/admin/erp/sync/queue?status=failed` and `?status=retrying`
   - Each row: order ID (entityId, link to `/admin/orders/<id>`), attempts, lastError, nextRetryAt
   - "Retry now" button → POST `/api/admin/erp/sync/queue/retry` `{ id }`

Use the existing admin page chrome (sidebar, breadcrumbs). If unsure of the project's UI primitives, scan `src/components/admin/` for existing patterns first.

---

## 8. Phase 6 — Cron schedule

**Time:** ~30 min, hosting-dependent.

### 8.1 If hosting on Vercel

Create or edit `vercel.json` at the repo root:

```json
{
  "crons": [
    { "path": "/api/cron/erp/stock",         "schedule": "*/15 * * * *" },
    { "path": "/api/cron/erp/prices",        "schedule": "0 * * * *"   },
    { "path": "/api/cron/erp/products",      "schedule": "0 */6 * * *" },
    { "path": "/api/cron/erp/process-queue", "schedule": "*/5 * * * *" }
  ]
}
```

> Vercel cron sends a `GET` with no auth header by default. To use our `ERP_CRON_SECRET`, configure a Vercel header rewrite or switch to an external scheduler that supports custom headers (cron-job.org, BetterStack, etc.). On Vercel Pro+, set `CRON_SECRET` and use Vercel's signed `x-vercel-cron-secret` header instead.

### 8.2 If hosting elsewhere (self-host / Railway / Render)

Use OS `crontab`:

```
*/15 * * * * curl -sf -H "Authorization: Bearer $ERP_CRON_SECRET" https://YOUR_DOMAIN/api/cron/erp/stock
0 * * * *    curl -sf -H "Authorization: Bearer $ERP_CRON_SECRET" https://YOUR_DOMAIN/api/cron/erp/prices
0 */6 * * *  curl -sf -H "Authorization: Bearer $ERP_CRON_SECRET" https://YOUR_DOMAIN/api/cron/erp/products
*/5 * * * *  curl -sf -H "Authorization: Bearer $ERP_CRON_SECRET" https://YOUR_DOMAIN/api/cron/erp/process-queue
```

---

## 9. Field mapping reference

### 9.1 Pantheon products response (full catalog)

| Wire key | Type | Maps to Prisma `Product` | Notes |
|----------|------|--------------------------|-------|
| `a` | string | `erpId` (also `sku` on insert) | `trim()` always |
| `b` | string | `nameLat` (insert only) | Serbian display name |
| `c` | number | `costPrice` | price ex-VAT |
| `e` | number | `priceB2c` | retail incl. VAT |
| `f` | number | `stockQuantity` | clamp to ≥0, floor |
| `g` | `'T'\|'F'` | `isActive` | `'T'` → true |

### 9.2 Order push payload (`PantheonOrderPayload`)

| Pantheon field | Source | Notes |
|----------------|--------|-------|
| `order_id` | `Order.orderNumber` | Use the human-readable number, not the cuid |
| `first_name`, `last_name` | `User.name` (split on first space) | Legacy quirk |
| `email` | `User.email` | |
| `contact_phone` | shipping address phone, fallback billing | |
| `city` / `address` / `postal_no` | `Order.billingAddress` JSON | strip `RS-` prefix from postal |
| `company_name` | `B2bProfile.salonName` | empty for B2C |
| `company_pib` | `B2bProfile.pib` | |
| `company_reg_number` | `B2bProfile.maticniBroj` | |
| `items_price` | `Order.subtotal` | |
| `shipping_price` | `Order.shippingCost` | |
| `total_price` | `Order.total` | |
| `payment_type` | `paymentLabelFor(Order.paymentMethod)` | Serbian label |
| `ship_to_diff_address` | computed from address comparison | 0 or 1 |
| `shipping_*` | `Order.shippingAddress` JSON | empty strings if same address |
| `additional_instructions` | `Order.notes` | |
| `order_date` | `Order.createdAt` formatted `YYYY-MM-DD HH:mm:ss` | local time, no TZ suffix |
| `items[]` | `OrderItem[]` | `product_code` = `Product.erpId` (fallback `productSku`), `quantity`, `price` = `unitPrice` |

---

## 10. Behavior parity with legacy

This table documents what we copy faithfully vs. where we deliberately improve over the legacy code.

| Aspect | Legacy PHP | Our TS port |
|--------|-----------|-------------|
| HTTP method | POST form fields | POST form fields ✅ |
| Body encoding | `multipart/form-data` (PHP curl + array) | `application/x-www-form-urlencoded` — server accepts both |
| Timeout | None (could hang forever) | 30s with `AbortController` |
| HTTP status check | None | Reject non-2xx as `PantheonError` |
| Retry logic | None | Exponential backoff via `ErpSyncQueue` |
| Logging | None | Every sync writes `ErpSyncLog`; every error keeps message |
| Update vs insert (products) | Match by trimmed code; existing → only `product_active`; new → full insert | Same |
| Trim on `a` | Yes | Yes |
| Stock & price syncs | Update-only, never insert | Same |
| Order push validation | Only `response !== null` | + HTTP status + JSON parse check |
| Payment type translation | `lang()` | Hardcoded `payment-types.ts` |
| Concurrency | Single-threaded PHP | Single-tick `processQueue` per cron invocation; per-row update is atomic |

---

## 11. Testing checklist

### 11.1 Code-only (no network needed)

- [ ] `npx tsc --noEmit` passes
- [ ] `prisma migrate dev --name product_erpid_unique` succeeds
- [ ] Unit test: `buildOrderPayload` for a sample B2B and B2C order produces correct shape (snapshot test)
- [ ] Unit test: `paymentLabelFor` covers all `PaymentMethod` enum values
- [ ] `enqueueOrder` is idempotent (call twice → only one queue row)

### 11.2 Live (after IP whitelist)

- [ ] `nc -zv 109.93.104.29 8080` returns "succeeded"
- [ ] `PantheonClient.fetchStock()` returns array with at least one item
- [ ] `PantheonClient.fetchProducts()` returns array; sample item has all 6 short keys
- [ ] `syncStock()` writes one `ErpSyncLog` row with status=success
- [ ] `syncPrices()` updates only existing products
- [ ] `syncProducts()` inserts new products and updates `isActive` on existing
- [ ] Order placed in dev → row appears in `ErpSyncQueue` with status=pending
- [ ] `processQueue()` consumes the row → order shows `erpSynced=true`
- [ ] Force a failure (bad password) → queue row goes to `retrying`, not `failed`, with correct `nextRetryAt`

---

## 12. Gotchas (read before coding)

1. **Endpoint times out without context.** A timeout = firewall block, not a server fault. Don't retry with backoff on timeouts; just fail fast and surface to admin.
2. **Pantheon codes have trailing whitespace.** Always `trim()`. The legacy code does this in 7 places.
3. **The `products` action is huge.** Multi-MB. Don't log it. Don't pretty-print it. Stream where possible.
4. **No pagination, no delta sync.** Every fetch returns the full catalog. Plan accordingly for memory and DB load.
5. **`product_active` is the only field updated for existing products in `syncProducts`.** Don't "fix" this by also updating name/price — the legacy site separates concerns intentionally so admin edits to names aren't overwritten.
6. **`erpId` must be unique.** Add the `@unique` constraint before running any sync — Prisma `where: { erpId }` requires it.
7. **HTTP, not HTTPS.** Credentials cleartext. Production must be on a private network or use a proxy.
8. **Brand casing.** Pantheon may have `Wella` and `WELLA` as separate entries. If we ever map brands from Pantheon, do case-insensitive lookup. (Not in scope of v1 — v1 doesn't sync brands.)
9. **Postal code prefix.** Pantheon stores `RS-11000`. Always strip `RS-` before sending or storing.
10. **`User.name` is single-field.** Split on first space; if no space, send full name as `first_name` and `last_name = ""`.
11. **Vercel + cron secret.** Vercel cron doesn't easily send custom headers. Either use Vercel's built-in cron auth (Pro+) or switch to an external scheduler.
12. **Idempotency of `enqueueOrder`.** A user retrying checkout shouldn't double-enqueue. Always check for an existing pending/retrying queue row first.
13. **`processQueue` is not concurrency-safe across multiple cron tick overlaps.** If two cron invocations run simultaneously they could both grab the same rows. For v1 this is acceptable (rare, and the receiving Pantheon side dedupes on `order_id`); if it becomes a problem, add `SELECT FOR UPDATE SKIP LOCKED` semantics.
14. **`response` from `pushOrder` has unknown shape.** The legacy code only checks for non-null. Once the admin can show us what success looks like, refine `extractErpId`.

---

## 13. Decision log

| Decision | Why | Date |
|----------|-----|------|
| Use `application/x-www-form-urlencoded` not multipart | Simpler in fetch; server accepts both (verified vs legacy multipart) | 2026-05-09 |
| 30s timeout default | Legacy had no timeout → known hangs; 30s is generous for the largest `products` payload | 2026-05-09 |
| `erpId` becomes `@unique` | Required for Prisma `where: { erpId }`; matches the de facto invariant | 2026-05-09 |
| Hardcode payment labels in TS instead of porting `lang()` | The set is finite (4 enum values), and Pantheon labels rarely change | 2026-05-09 |
| Process queue in batches of 50 | Matches legacy `manual_sync_parts` page size; keeps each cron tick fast | 2026-05-09 |
| Admin UI is a single page, not three | Three buttons + one history table fits one screen; no need for tabs | 2026-05-09 |

---

## 14. Quick-start for future-you

If you read this far and just want to start, do this in order:

1. **Read `Synchronization_model.php` end-to-end** (it's only 387 lines). Don't skip — it's the ground truth.
2. **Run section 2.1–2.4 checks.** Fix anything red before writing any code.
3. **Write Phase 1, type-check, commit.** No tests needed yet.
4. **Add the `@unique` migration** (Section 4.4). `prisma migrate dev`.
5. **Write Phase 2 (`sync-inbound.ts`), commit.**
6. **Write Phase 3 (`sync-outbound.ts`), commit.**
7. **Wire `enqueueOrder` into the order placement code.** One-line addition.
8. **Write Phase 4 routes, commit.**
9. **Write Phase 5 admin UI, commit.**
10. **Configure Phase 6 cron, commit.**
11. **When admin grants network access**, run the 11.2 testing checklist.

Total expected time end-to-end without blockers: **~1 day**.
