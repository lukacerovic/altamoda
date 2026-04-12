# Pantheon ERP Integration Guide

Step-by-step guide for connecting the Alta Moda Next.js app to the DataLab Pantheon ERP.
This is the **last phase** of the project — all other features should be complete before starting.

---

## What Is Pantheon?

Pantheon is a **DataLab ERP system** (SQL Server-based), not the Pantheon hosting platform.
It is a desktop ERP commonly used in Serbia/Balkans. Alta Moda uses it for:

- Product catalog (items, brands, categories)
- Pricing (retail, wholesale, VAT)
- Stock / inventory
- B2B customer management
- Order processing

Our app does **not** connect to Pantheon directly. There is a middleware layer called
**tkomserver** (Java, runs on Tomcat) that sits between us and Pantheon's database.

```
Our Next.js App  ──HTTP POST──►  tkomserver (middleware)  ──►  Pantheon SQL Server
```

---

## Prerequisites Before Starting

- [ ] All core features (shop, cart, checkout, admin, B2B) are done and working
- [ ] Database schema is finalized (ERP fields already exist in Prisma — see Section 3)
- [ ] Network access to `109.93.104.29:8080` is confirmed from wherever the app is hosted
- [ ] Credentials for the tkomserver API are still valid (test with curl first)
- [ ] Decide whether to keep HTTP or require HTTPS/tunnel for the API connection

**Quick connectivity test — run this before writing any code:**

```bash
curl -X POST http://109.93.104.29:8080/tkomserver/webshop/api \
  -d "userEmail=webshopapiuser" \
  -d "userPass=13q2ad23d43#$ads23123" \
  -d "action=stock"
```

If you get JSON back, the connection works. If it times out, fix network access first.

---

## How the Connection Works (from the old CodeIgniter site)

One endpoint. One set of credentials. The `action` field determines what happens.

### Endpoint

```
POST http://109.93.104.29:8080/tkomserver/webshop/api
Content-Type: application/x-www-form-urlencoded
```

### Authentication

No tokens, no OAuth. Username and password are sent as POST body fields every time:

```
userEmail = webshopapiuser
userPass  = 13q2ad23d43#$ads23123
```

### Available Actions

| Action | Direction | What It Does |
|--------|-----------|-------------|
| `products` | Pantheon → Us | Returns ALL products (name, price, stock, active status) |
| `stock` | Pantheon → Us | Returns stock quantities only |
| `altaorder` | Us → Pantheon | Pushes one order (add `data` field with JSON string) |

> The old site uses the `products` action for both product sync AND price sync.
> The difference is just which fields it writes to the DB.

### Response Format (products / stock)

```json
{
  "products": [
    {
      "a": "10002",       // product code (Pantheon acIdent)
      "b": "Product Name", // name in Serbian
      "c": 450.00,         // price without VAT
      "e": 540.00,         // retail price with VAT
      "f": 25,             // stock quantity
      "g": "T"             // active flag: "T" = yes, "F" = no
    }
  ]
}
```

### Order Push Format (altaorder)

Add a `data` field to the POST body containing a JSON string:

```json
{
  "order_id": 123,
  "first_name": "Marko",
  "last_name": "Petrovic",
  "email": "marko@example.com",
  "contact_phone": "+381641234567",
  "city": "Beograd",
  "address": "Knez Mihailova 10",
  "postal_no": "11000",
  "company_name": "Salon Lepota",
  "company_pib": "108157350",
  "company_reg_number": "12345678",
  "items_price": 5000,
  "shipping_price": 500,
  "total_price": 5500,
  "payment_type": "pouzecem",
  "ship_to_diff_address": 0,
  "shipping_first_name": "",
  "shipping_city": "",
  "shipping_address": "",
  "shipping_postal_no": "",
  "shipping_contact_phone": "",
  "shipping_last_name": "",
  "shipping_email": "",
  "additional_instructions": "Pozovite pre dostave",
  "order_date": "2026-04-12 10:30:00",
  "items": [
    { "product_code": "10002", "quantity": 2, "price": 540.00 }
  ]
}
```

---

## What We Already Have in Place

No schema changes needed. These were added in earlier phases:

### ERP Fields on Models

| Model | Field | Purpose |
|-------|-------|---------|
| Product | `erpId` | Pantheon product code (acIdent) |
| Product | `barcode` | EAN-13 from Pantheon |
| Product | `vatRate` | 20 or 10 |
| Product | `vatCode` | "R2" (20%) or "R1" (10%) |
| Order | `erpSynced` | false until pushed to Pantheon |
| Order | `erpId` | Pantheon order reference after push |
| B2bProfile | `erpSubjectId` | Pantheon customer ID (acSubject) |

### Sync Infrastructure Models

| Model | Table | Purpose |
|-------|-------|---------|
| ErpSyncLog | `erp_sync_logs` | Audit trail — every sync attempt logged |
| ErpSyncQueue | `erp_sync_queue` | Retry queue for failed outbound pushes |

### Constants (`src/lib/constants.ts`)

```typescript
ERP_DEFAULT_VAT_RATE = 20
ERP_VAT_CODES = { R2: 20, R1: 10 }
ERP_WEB_ORDER_SOURCE = 'W'
ERP_DOC_TYPE_SALES_ORDER = 100
ERP_SYNC_MAX_RETRIES = 5
ERP_SYNC_RETRY_DELAYS_MS = [60s, 5min, 15min, 1hr, 4hr]
```

---

## Implementation Steps

### Step 1: Environment Variables

Add to `.env` (and `.env.example`):

```env
PANTHEON_API_URL=http://109.93.104.29:8080/tkomserver/webshop/api
PANTHEON_API_USER=webshopapiuser
PANTHEON_API_PASS=<get current password, may have changed>
```

### Step 2: API Client

Create `src/lib/pantheon/client.ts`.

This is a single class that wraps the tkomserver endpoint. Every method does the same thing:
POST to the endpoint with credentials + action, parse JSON response.

**What to build:**

```
PantheonClient
  ├── fetchProducts()    → calls action=products, returns typed array
  ├── fetchStock()       → calls action=stock, returns typed array
  └── pushOrder(payload) → calls action=altaorder with data field
```

**Types to define** (based on the short-key response format):

```
PantheonRawProduct  { a: string, b: string, c: number, e: number, f: number, g: string }
PantheonStockItem   { a: string, f: number }
PantheonOrderPayload { order_id, first_name, last_name, ... }
```

**Error handling:**
- Wrap in try/catch, log failures
- Set a reasonable timeout (30s) — the old site had no timeout and could hang
- Return typed results, throw on HTTP errors or empty responses

### Step 3: Inbound Sync — Products, Prices, Stock

Create `src/lib/pantheon/sync-inbound.ts`.

Three functions, each following the same pattern:

```
1. Create ErpSyncLog (status: in_progress)
2. Call PantheonClient.fetchProducts() or fetchStock()
3. Process in batches of 50
4. For each item:
   - Find product by erpId (Product.erpId = item.a.trim())
   - If found → update relevant fields
   - If not found (products sync only) → create new product
5. Update ErpSyncLog (status: success, itemsSynced: count)
6. On error → Update ErpSyncLog (status: failed, message: error)
```

**Product sync** — upsert by erpId:
| API field | DB field | Notes |
|-----------|----------|-------|
| `a` (trimmed) | `erpId` | match key |
| `b` | `nameLat` | only on create, not update (admin may have edited) |
| `e` | `priceB2c` | always update |
| `c` | `costPrice` | always update |
| `f` | `stock` | always update |
| `g` | `isActive` | `"T"` → true, anything else → false |

**Price sync** — update only, same API call:
| API field | DB field |
|-----------|----------|
| `a` (trimmed) | match by `erpId` |
| `e` | `priceB2c` |
| `c` | `costPrice` |

**Stock sync** — update only:
| API field | DB field |
|-----------|----------|
| `a` (trimmed) | match by `erpId` |
| `f` | `stock` |

### Step 4: Outbound Sync — Order Push

Create `src/lib/pantheon/sync-outbound.ts`.

Two parts: **enqueue** and **process**.

**Enqueue** (called when an order is placed):
1. Build the order payload matching the `altaorder` format (see Section 2)
2. Map our fields to Pantheon's expected fields
3. Insert into `ErpSyncQueue` with `status: "pending"`
4. Order stays at `erpSynced: false`

**Field mapping for order payload:**

| Our field | Pantheon field |
|-----------|---------------|
| `order.id` | `order_id` |
| `user.name` (split) | `first_name`, `last_name` |
| `user.email` | `email` |
| `user.phone` | `contact_phone` |
| `shippingAddress.city` | `city` |
| `shippingAddress.street` | `address` |
| `shippingAddress.postalCode` | `postal_no` |
| `order.subtotal` | `items_price` |
| `order.shippingCost` | `shipping_price` |
| `order.total` | `total_price` |
| `order.paymentMethod` | `payment_type` (translate enum to Serbian label) |
| `b2bProfile.salonName` | `company_name` |
| `b2bProfile.pib` | `company_pib` |
| `b2bProfile.maticniBroj` | `company_reg_number` |
| `order.notes` | `additional_instructions` |
| `order.createdAt` | `order_date` (format: `YYYY-MM-DD HH:mm:ss`) |
| `order.items[]` | `items[]` (each with product code, qty, price) |

**Process queue** (runs on schedule):
1. Fetch all `ErpSyncQueue` items where `status = "pending"` or (`status = "retrying"` AND `nextRetryAt <= now`)
2. For each item:
   - Call `PantheonClient.pushOrder(payload)`
   - Success → set queue `status: "done"`, set `order.erpSynced: true`
   - Failure → increment `attempts`, calculate `nextRetryAt` using `ERP_SYNC_RETRY_DELAYS_MS[attempts]`
   - Max retries exceeded → set queue `status: "failed"`, log error
3. Log everything to `ErpSyncLog`

### Step 5: API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `POST /api/admin/erp/sync` | POST | Admin only | Trigger manual sync, body: `{ type: "products" \| "prices" \| "stock" }` |
| `GET /api/admin/erp/sync/logs` | GET | Admin only | Fetch sync history with pagination |
| `GET /api/admin/erp/sync/queue` | GET | Admin only | View pending/failed queue items |
| `POST /api/admin/erp/sync/queue/retry` | POST | Admin only | Retry a specific failed item, body: `{ id: "..." }` |

### Step 6: Admin UI — ERP Sync Dashboard

Add a page at `/admin/erp` (or a tab within existing admin settings).

**Components needed:**

1. **Manual sync buttons** — three buttons: "Sync Products", "Sync Prices", "Sync Stock"
   - Each triggers `POST /api/admin/erp/sync`
   - Show loading state while running
   - Show result (X items synced / error)

2. **Sync history table** — from `ErpSyncLog`
   - Columns: date, type, direction, items synced, status, message
   - Most recent first
   - Color-code: green for success, red for failed

3. **Failed queue panel** — from `ErpSyncQueue` where status = "failed"
   - Show entity type, last error, attempt count
   - "Retry" button per item

### Step 7: Scheduled Sync (Cron Jobs)

Set up recurring jobs. How depends on hosting:

| Job | Schedule | Calls |
|-----|----------|-------|
| Stock sync | Every 15 min | `POST /api/admin/erp/sync { type: "stock" }` |
| Price sync | Every 1 hour | `POST /api/admin/erp/sync { type: "prices" }` |
| Product sync | Every 6 hours | `POST /api/admin/erp/sync { type: "products" }` |
| Order queue processor | Every 5 min | Internal: process pending queue items |

**Options for scheduling:**
- External cron service (cron-job.org, Vercel Cron, Railway cron)
- OS-level crontab if self-hosted
- The API routes should accept a secret header/token for cron auth (not just admin session)

---

## Data Mapping Reference

### Products: Pantheon → Our DB

| Pantheon (the_setItem) | Our Model | Notes |
|------------------------|-----------|-------|
| `acIdent` | `Product.erpId` + `Product.sku` | Primary match key, trim whitespace |
| `acName` | `Product.nameLat` | Serbian product name |
| `acClassif` | `Brand.name` | Case-insensitive lookup/create |
| `acClassif2` | `ProductLine.name` | Product line within brand |
| `anSalePrice` | `Product.priceB2c` | Retail with VAT |
| `anBuyPrice` | `Product.costPrice` | Cost/purchase price |
| `anVAT` | `Product.vatRate` | 20 or 10 |
| `acVATCode` | `Product.vatCode` | "R2" = 20%, "R1" = 10% |
| `acActive` | `Product.isActive` | "T" → true |
| `acWebShopItem` | display filter | "T" → show on site |

### Categories: Pantheon → Our DB

| Pantheon (tHE_SetItemCateg) | Our Model | Notes |
|-----------------------------|-----------|-------|
| `acClassif` | identifier | Match key |
| `acName` | `Category.name` | Display name |
| `acType = "O"` | `Category` | Top-level parent, `parentId = null` |
| `acType = "S"` | `Category` | Child category, needs parent mapping |
| `acType = "P"` | `Brand` | Product-facing brand |

### Barcodes: Pantheon → Our DB

| Pantheon (tHE_SetItemExtItemSubj) | Our Model | Notes |
|-----------------------------------|-----------|-------|
| `acIdent` | match via `Product.erpId` | Find product first |
| `acCode` | `Product.barcode` | EAN-13 code |
| `acDefault = "T"` | preferred | Use this one if product has multiple |

### Customers: Pantheon → Our DB

| Pantheon (the_setSubj) | Our Model | Notes |
|------------------------|-----------|-------|
| `acSubject` | `B2bProfile.erpSubjectId` | Unique link to Pantheon |
| `acName2` | `User.name` + `B2bProfile.salonName` | Business name |
| `acCode` | `B2bProfile.pib` | PIB / VAT number, match existing by this |
| `acRegNo` | `B2bProfile.maticniBroj` | Company registration |
| `anRebate` | `B2bProfile.discountTier` | Discount percentage |
| `anDaysForPayment` | `B2bProfile.paymentTerms` | Payment terms in days |
| `anLimit` | `B2bProfile.creditLimit` | Credit limit |
| `acAddress` | `UserAddress.street` | Street address |
| `acPost` | `UserAddress.postalCode` | Strip "RS-" prefix |
| `acPhone` | `User.phone` | Phone number |
| `acActive` | `User.status` | "T" → active, "Z" → suspended, "F" → inactive |

---

## Gotchas and Edge Cases

1. **Network access** — The API is on an internal IP (`109.93.104.29:8080`). If the app is hosted externally (Vercel, etc.), you need a VPN, tunnel, or the tkomserver needs to be exposed publicly with HTTPS.

2. **HTTP, not HTTPS** — The legacy endpoint is plain HTTP. Credentials are sent in cleartext. For production, either add TLS termination or accept the risk on a trusted network.

3. **Brand casing** — Pantheon has `"Wella"` and `"WELLA"` as separate entries meaning the same brand. All brand lookups must be case-insensitive.

4. **Trim product codes** — The old PHP code does `trim($product['a'])` everywhere. Product codes may have trailing whitespace from Pantheon.

5. **Status values** — `"T"` = active, `"F"` = inactive, `"Z"` = zatvoren (closed/archived). Map Z to `suspended` in our system.

6. **Postal codes** — Pantheon stores with "RS-" prefix (e.g., `"RS-11000"`). Strip before saving.

7. **One barcode per product** — Our schema has a single `barcode` field. If multiple exist in Pantheon, prefer `acDefault = "T"`.

8. **VAT codes** — `R2` = 20% standard, `R1` = 10% reduced. Already in `ERP_VAT_CODES` constant.

9. **No passwords from Pantheon** — When creating B2B users from Pantheon customer data, generate a random password hash and trigger a password-reset email.

10. **Name splitting** — Our order push needs `first_name` and `last_name` as separate fields. Our `User.name` is a single field. Split on the first space, or send full name in `first_name` and leave `last_name` empty if unsplittable.

11. **Payment type translation** — The old site sends Serbian labels: `"pouzecem"` (COD), payment slip text, card text. Map our `PaymentMethod` enum values to these strings.

12. **The API returns ALL products** every time — there is no pagination or delta sync. For large catalogs this could be slow. Process in memory, batch DB writes.
