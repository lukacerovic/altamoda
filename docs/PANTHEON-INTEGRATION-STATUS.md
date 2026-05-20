# Pantheon Integration — Status & Handoff

**Last updated:** 2026-05-20
**Status:** ✅ Option C chosen and executed — products imported, `erpIsActive` populated, admin UI surfaces ERP/site disagreements. Remaining work in [§6 Non-blocked follow-ups](#6-non-blocked-follow-ups).

> **Purpose of this file:** Continuity document for future Claude sessions. Read this first when picking up Pantheon integration work. It captures the full state of the integration, what's been verified, what's pending, and exactly what to do based on the owners' answer to the open decision.
>
> **How to use:** The Option-C decision and import are done. New work should focus on [§6 Non-blocked follow-ups](#6-non-blocked-follow-ups) — cron scheduling, admin dashboard at `/admin/erp`, outbound order testing, and reconciling the unmatched products. The [§5 decision tree](#5-decision-resolved--option-c-applied) is preserved for context.

---

## 1. TL;DR

The new Next.js site is connected to the legacy DataLab Pantheon ERP via the `tkomserver` middleware. Stock + price + product sync are live. **2,914 products are now linked** to Pantheon (1,733 originally + 446 via SKU backfill + 735 new imports). Owners chose **Option C (Hybrid)** — Pantheon's active flag is mirrored into a new `Product.erpIsActive` field for admin visibility, but never overrides the website's own `isActive`.

What's left:
1. Production cron scheduling (now safe to enable products sync — see §6.1)
2. Admin dashboard at `/admin/erp` (sync buttons + log table — see §6.2)
3. Live test of outbound order push — still untested in prod (see §6.3)
4. Reconciliation of 1,094 unmatched + 14 ambiguous products (see §6.4)
5. The 7 SKU-conflict skips from the products sync (see §6.6)

---

## 2. Architecture recap

```
                  ┌──────────────────────────────┐
                  │  Pantheon SQL Server (ERP)   │
                  │  - the_setItem (products)    │
                  │  - the_setSubj (customers)   │
                  │  - tHE_Order (orders)        │
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────┴───────────────┐
                  │  tkomserver (Java/Tomcat)    │
                  │  http://89.216.106.135:8080  │
                  │  /tkomserver/webshop/api     │
                  │  Actions: products, stock,   │
                  │           altaorder          │
                  └──────────────┬───────────────┘
                                 │ POST (form-encoded)
                                 │ userEmail + userPass + action
                  ┌──────────────┴───────────────┐
                  │   Next.js app (this repo)    │
                  │   src/lib/pantheon/*         │
                  └──────────────────────────────┘
```

**One endpoint, one credential set, three actions.** Field mapping (verified from live data, 2026-05-16):

| Pantheon field | Meaning |
|---|---|
| `a` | product code (acIdent), may have trailing whitespace |
| `b` | name (Serbian) |
| `c` | price **WITH** VAT (retail) ← legacy PHP had this WRONG |
| `d` | price **WITHOUT** VAT (cost) ← legacy PHP didn't use this |
| `e` | always 0.0 — legacy PHP misused this as the retail price (silent bug for years) |
| `f` | stock quantity (decimal string like `"4.00"`) |
| `g` | active flag (`"T"` / `"F"`) |
| `h` | always 0.0 |

**Source-of-truth rules:**
- Pantheon → wins for products, prices, stock, B2B customer terms
- Website → wins for orders (then pushed back to Pantheon)

---

## 3. What's built ✅

### 3.1 Code (`src/lib/pantheon/`)

| File | Purpose |
|---|---|
| `types.ts` | Pantheon request/response TypeScript types + field documentation |
| `client.ts` | `PantheonClient` class (`fetchProducts`, `fetchStock`, `pushOrder`), normalizers, lazy singleton via `getPantheonClient()` |
| `sync-inbound.ts` | `syncProducts()`, `syncPrices()`, `syncStock()` — batched (50), idempotent, logged to `ErpSyncLog`. **`syncProducts()` writes `erpIsActive` (not `isActive`) on existing rows per Option C; new rows get both fields seeded from Pantheon's flag.** |
| `sync-outbound.ts` | `enqueueOrderSync()`, `processQueue()`, `requeueFailed()`, `buildPantheonOrderPayload()` — queue + worker with retry/backoff |

### 3.2 API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/admin/erp/sync` | `POST` | Admin trigger by type: `{ type: "products" \| "prices" \| "stock" \| "orders" }` |
| `/api/admin/erp/sync/logs` | `GET` | Paginated `ErpSyncLog` with filters (status, syncType, direction) |
| `/api/admin/erp/sync/queue` | `GET` | Paginated `ErpSyncQueue` view |
| `/api/admin/erp/sync/queue/retry` | `POST` | Manual retry of a failed queue item: `{ id }` |
| `/api/cron/erp-sync` | `GET` | Cron entrypoint, requires `Authorization: Bearer <ERP_CRON_SECRET>` or `?secret=` |

### 3.3 Order creation hook

Modified `src/app/api/orders/route.ts` — `enqueueOrderSync(createdOrder.id, tx)` inserted inside the existing order-creation transaction (step 8). Order row and queue row commit atomically.

### 3.4 Env vars (in `.env`)

```
PANTHEON_API_URL=http://89.216.106.135:8080/tkomserver/webshop/api
PANTHEON_API_USER=webshopapiuser
PANTHEON_API_PASS='13q2ad23d43#$ads23123'   # MUST be single-quoted (# and $ are special)
PANTHEON_API_TIMEOUT_MS=30000               # optional, default 30s
ERP_CRON_SECRET=<random>                    # for /api/cron/erp-sync auth
```

⚠️ **Gotcha:** the password contains `#` and `$`. If not single-quoted, dotenv truncates at `#`. We hit this — symptom is "Pantheon response missing 'products' array".

### 3.5 Helper scripts (in `scripts/`)

| Script | Purpose |
|---|---|
| `test-pantheon-connection.ts` | Smoke test — fetch products + stock, normalize, cross-check our DB. Read-only. |
| `test-pantheon-one-product.ts` | End-to-end pipeline test on one product. Self-reverts. Use `--apply` to run. |
| `backfill-pantheon-erp-id.ts` | Match our DB against Pantheon, set `Product.erpId`. **Five tiers**: sku → barcode → exact-name → normalized-name → fuzzy ≥0.9. Use `--apply --barcodes-json=<path> --csv-unmatched`. Barcode tier requires an external JSON since the Pantheon products API doesn't return barcodes — extract from any Pantheon "active SKUs" Excel export. |

Run with: `node --env-file=.env --import tsx scripts/<name>.ts`

---

## 4. Live data snapshot (2026-05-20, post-import)

**Pantheon catalog (unchanged from 2026-05-16):**
- ~2,921 valid products after filtering bookkeeping entries (codes containing `:`)
- ~979 active (g="T") / ~1,942 inactive (g="F")

**Our DB (after backfill + products sync):**
- **4,022 products total** (was 3,287 — gained 735 from Pantheon import)
- **2,914 have `erpId` set** (was 1,733):
  - 1,733 from original name-match backfill
  - 446 from SKU-equality backfill pass (the SKU column on the website already equaled the Pantheon ident for these)
  - 735 newly created during products sync
- **`erpIsActive` populated**:
  - 979 = true (matches Pantheon's active flag)
  - 1,935 = false (Pantheon says inactive — still visible on site per Option C)
  - 1,108 = NULL (no Pantheon counterpart)
- **Group structure**: 583 products span 27 distinct color/variant groups
- 1,094 unmatched + 14 ambiguous → CSV `scripts/backfill-unmatched-1779301278888.csv`
- 7 products skipped during products sync due to SKU collision (manual reconciliation needed)

**Verified working (2026-05-20):**
- ✅ Backfill applied 446 SKU matches; products sync imported 735 new rows + populated `erpIsActive` on 2,179 existing rows in 1.6s
- ✅ Admin UI badge + filter + "needs review" banner ship at `/admin/products`
- ✅ Storefront vs admin count discrepancy explained and verified: admin sees 3,466 (post-dedup), storefront sees 873 as a guest (active + in-stock + B2C + dedup pipeline)

**Sanity flag worth checking:** a few SKU-tier matches had divergent names between site and Pantheon (e.g. our SKU 1316 = "Redken Shades EQ 08C Cayanne" but Pantheon SKU 1316 = "R SEQ 08C GOLDEN TOPAZ"). Same code, different shade name. The link by code is correct *if* the SKUs were intentionally shared; spot-check pricing/stock for a few of these before relying on prices flowing through.

---

## 5. Decision resolved — Option C applied

**Outcome (2026-05-20):** Owners chose **Option C — Hybrid**. Implementation is done.

> Website keeps its own `isActive` (Pantheon never overrides visibility); Pantheon's flag mirrors into a new `Product.erpIsActive` field so admin can spot ERP/site disagreements.

### What was actually changed

| # | Change | File |
|---|---|---|
| 1 | Added `erpIsActive Boolean? @map("erp_is_active")` to `Product` model | `prisma/schema.prisma` |
| 2 | Migration file created and marked applied | `prisma/migrations/20260520120000_add_erp_is_active/migration.sql` |
| 3 | `syncProducts()` rewritten: existing rows get `erpIsActive` updated (never `isActive`); new rows get both fields seeded from Pantheon | `src/lib/pantheon/sync-inbound.ts` |
| 4 | Backfill extended with `sku` and `barcode` tiers (5 total) + `--barcodes-json` flag | `scripts/backfill-pantheon-erp-id.ts` |
| 5 | Admin list API returns `erpIsActive` for admin viewers | `src/app/api/products/route.ts:446` |
| 6 | Admin products page: badges ("ERP neaktivno" amber, "Nije u ERP-u" gray), ERP Status filter, "needs review" banner | `src/app/admin/products/page.tsx` |

### Migration history side-quest

Pre-existing drift on the local DB (orphan `notifications` table from an abandoned `feature/admin-notifications-client-order-link` branch, plus older `db push` residue) prevented `prisma migrate dev` from running cleanly. We cleaned it up minimally:
- Dropped `notifications` table + `NotificationType` enum
- Deleted the orphan `_prisma_migrations` row
- Created the `erp_is_active` migration file manually and marked applied via `prisma migrate resolve`

Older drift (b2b nullable cols, removed indexes, NewsletterSegment enum value) was left alone — out of scope for this work. Future schema changes will need to address those before `prisma migrate dev` will work cleanly.

### Historical decision tree (preserved for context)

Options A and B were rejected. The original three-option proposal and the Serbian message sent to owners are preserved in [§7](#7-reference-the-message-sent-to-owners) for reference.

---

## 6. Non-blocked follow-ups (not waiting on owners)

These can be done any time, in any order. None depend on the isActive decision.

### 6.1 Schedule cron jobs

Pick one hosting approach:
- **Vercel Cron** (if deployed to Vercel) — `vercel.json`:
  ```json
  {
    "crons": [
      { "path": "/api/cron/erp-sync?type=stock&secret=<ERP_CRON_SECRET>", "schedule": "*/15 * * * *" },
      { "path": "/api/cron/erp-sync?type=prices&secret=<ERP_CRON_SECRET>", "schedule": "0 * * * *" },
      { "path": "/api/cron/erp-sync?type=orders&secret=<ERP_CRON_SECRET>", "schedule": "*/5 * * * *" }
    ]
  }
  ```
  Products sync is now safe to enable — add: `{ "path": "/api/cron/erp-sync?type=products&secret=<ERP_CRON_SECRET>", "schedule": "0 */6 * * *" }`
- **cron-job.org / external** — hit the same URLs with the bearer header.
- **cPanel cron** — `curl -H "Authorization: Bearer $ERP_CRON_SECRET" https://altamoda.rs/api/cron/erp-sync?type=stock`

Schedule recommendations: stock 15min, prices 1h, orders 5min, products 6h.

### 6.2 Admin dashboard UI at `/admin/erp`

Not built. Should have:
- 4 "Sync now" buttons (products/prices/stock/orders) calling `POST /api/admin/erp/sync`
- Recent sync logs table from `GET /api/admin/erp/sync/logs`
- Failed queue panel from `GET /api/admin/erp/sync/queue?status=failed` with retry buttons
- Last sync time per type (latest log entry with `status=success` per `syncType`)

Reference auth pattern: `src/app/admin/users/page.tsx`.

### 6.3 Test outbound order push (untested)

Method:
1. Place a real test order on the staging/dev site (small amount, COD, your own info)
2. Wait for `processQueue()` to run (or call manually)
3. Verify in Pantheon admin that the order appeared
4. Inspect `Order.erpId` — should be populated with whatever Pantheon returned
5. Inspect the response in `ErpSyncLog.details.response` — this tells us the actual `altaorder` response shape

This is also when we discover the real response format. Currently `extractErpRef()` in `sync-outbound.ts` guesses common keys (`acKey`, `order_id`, `ref`, `id`). May need adjustment.

### 6.4 Reconcile the 1,094 unmatched + 14 ambiguous products

Two paths:
- Admin reviews `scripts/backfill-unmatched-1779301278888.csv` and sets `erpId` manually via admin UI (needs a UI for this; the new ERP Status filter on `/admin/products` makes it easy to scope to "Nije u ERP-u")
- Try a more aggressive fuzzy threshold (lower than 0.9) and review the additional matches

Probably not urgent — the unmatched products still display on the site, they just won't get auto-updated stock/prices from Pantheon. That's the same state they were in before this integration.

### 6.6 Reconcile the 7 SKU-collision skips

During the 2026-05-20 products sync, 7 Pantheon products failed to insert because their `acIdent` clashed with an existing `Product.sku` that the backfill couldn't link (probably whitespace/case mismatch or because the existing SKU was already claimed by a different `erpId`). The skips were logged to console; the failed `erpId` values are findable in the sync run output. Manual reconciliation: find each existing DB row by SKU, decide if it's the same product as the Pantheon one, then either set its `erpId` manually or change its SKU and re-run products sync.

### 6.5 The "altaorder response shape" question to Pantheon

We've never seen a real response to `action=altaorder`. The legacy PHP discarded it. Worth asking the team:
> *"Šta vraća API kada uspešno primi `altaorder`? Da li dobijamo `acKey` ili neku referencu da bismo je sačuvali sa porudžbinom?"*

Until we know, `extractErpRef()` in `sync-outbound.ts` does best-effort key matching.

---

## 7. Reference: the message sent to owners

Copy of the Serbian message asking for the isActive decision:

> **Subject:** Pantheon integracija — update i jedno pitanje za odluku
>
> Poštovani,
>
> Šaljemo vam kratak izveštaj o stanju povezivanja nove web stranice sa Pantheon sistemom, kao i jedno važno pitanje na koje nam treba vaš odgovor pre nego što nastavimo dalje.
>
> **Gde smo trenutno:**
> - Veza sa Pantheon-om je uspostavljena i radi.
> - 1.733 proizvoda sa sajta je uspešno povezano sa odgovarajućim zapisima u Pantheon-u (po nazivu).
> - Automatska sinhronizacija lagera radi za svih 1.733 proizvoda, manje od 1 sekunde za sve odjednom.
> - Pripremljena je infrastruktura da se porudžbine sa sajta automatski šalju u Pantheon.
> - Ostaje 1.483 proizvoda za koje nije bilo moguće pronaći odgovarajući zapis (uglavnom zbog razlika u nazivima) — za njih ćemo pripremiti alat za ručno uparivanje.
>
> **Pitanje:**
>
> Od 1.733 uparenih proizvoda, **1.719 su u Pantheon-u označeni kao neaktivni** (arhivirani u ERP-u). Tri opcije:
>
> 🔴 **OPCIJA A — "Veruj Pantheon-u u potpunosti"** — Ako je proizvod neaktivan u Pantheon-u, automatski se sakriva sa sajta.
>   - ✅ Sajt uvek odražava tačno stanje iz ERP-a
>   - ⚠️ 1.719 proizvoda bi nestalo sa sajta odmah
>
> 🟡 **OPCIJA B — "Sajt odlučuje sam"** — Pantheon flag se ignoriše, sajt zadržava trenutnu listu.
>   - ✅ Ništa se ne menja na sajtu
>   - ⚠️ Morate ručno održavati katalog
>
> 🟢 **OPCIJA C — "Hibrid" (preporuka)** — Sajt zadržava trenutnu listu, ali u admin panelu se označava koji proizvodi su neaktivni u Pantheon-u.
>   - ✅ Nema iznenadnih promena, vi imate kontrolu
>   - ✅ Jasan pregled koje proizvode treba razmotriti
>   - ✅ Cene i lager se i dalje normalno ažuriraju
>
> Molimo vas da nam javite koju opciju (A, B ili C) biste izabrali.

---

## 8. Files touched in this work (full list)

Created (initial integration, pre-Option C):
- `src/lib/pantheon/types.ts`
- `src/lib/pantheon/client.ts`
- `src/lib/pantheon/sync-inbound.ts`
- `src/lib/pantheon/sync-outbound.ts`
- `src/app/api/admin/erp/sync/route.ts`
- `src/app/api/admin/erp/sync/logs/route.ts`
- `src/app/api/admin/erp/sync/queue/route.ts`
- `src/app/api/admin/erp/sync/queue/retry/route.ts`
- `src/app/api/cron/erp-sync/route.ts`
- `scripts/test-pantheon-connection.ts`
- `scripts/test-pantheon-one-product.ts`
- `scripts/backfill-pantheon-erp-id.ts`
- `docs/PANTHEON-INTEGRATION-STATUS.md` (this file)

Created (Option C execution, 2026-05-20):
- `prisma/migrations/20260520120000_add_erp_is_active/migration.sql` — adds `erp_is_active` column

Modified (initial integration):
- `.env.example` — replaced API_KEY pattern with USER/PASS, added CRON_SECRET, IP corrected to `89.216.106.135`, single-quote warning for password
- `src/app/api/orders/route.ts` — added `enqueueOrderSync(createdOrder.id, tx)` inside the order-creation transaction
- (User) `.env` — added real Pantheon credentials

Modified (Option C execution):
- `prisma/schema.prisma` — added `erpIsActive Boolean? @map("erp_is_active")` to `Product`
- `src/lib/pantheon/sync-inbound.ts` — `syncProducts()` writes `erpIsActive` on existing rows; new rows seed both `isActive` + `erpIsActive`; doc comment rewritten
- `scripts/backfill-pantheon-erp-id.ts` — added `sku` and `barcode` tiers (5 tiers total) + `--barcodes-json=<path>` flag
- `src/app/api/products/route.ts` — list response includes `erpIsActive` for admin viewers
- `src/app/admin/products/page.tsx` — `Product.erpIsActive?` field + `mapRaw()` extraction; `erpStatusFilter` state + dropdown; inline badges ("ERP neaktivno" amber, "Nije u ERP-u" gray); top-of-page "needs review" amber banner

Outputs generated:
- `scripts/backfill-unmatched-1779301278888.csv` — final unmatched/ambiguous list after the 5-tier backfill

---

## 9. Other Pantheon-related docs in this repo (for context)

These existed before this work and describe the broader plan:

- `docs/PANTHEON-INTEGRATION-GUIDE.md` — original step-by-step plan (some details outdated — e.g. wrong IP, wrong field `e`)
- `docs/pantheon-integration-analysis.md` — deep field-mapping reference, 6 Pantheon tables, design decisions
- `docs/pantheon-alignment-audit.md` — gap analysis as of 2026-03-28 (pre-integration)
- `docs/pantheon-data-relationships.md` — ER diagrams across the 4 Pantheon Excel files

When in doubt, **this file (`PANTHEON-INTEGRATION-STATUS.md`) supersedes the others** for current state — they were planning documents written before implementation.

---

## 10. Quick commands cheat sheet

```bash
# Connection smoke test (read-only)
node --env-file=.env --import tsx scripts/test-pantheon-connection.ts

# End-to-end pipeline test on one product (auto-reverts)
node --env-file=.env --import tsx scripts/test-pantheon-one-product.ts
node --env-file=.env --import tsx scripts/test-pantheon-one-product.ts --apply

# Backfill erpId across the catalog (5 tiers: sku → barcode → exact → normalized → fuzzy)
node --env-file=.env --import tsx scripts/backfill-pantheon-erp-id.ts
node --env-file=.env --import tsx scripts/backfill-pantheon-erp-id.ts --apply --csv-unmatched
# With barcodes (if you have a Pantheon Excel export):
python3 -c "
import openpyxl, json
wb = openpyxl.load_workbook('/path/to/Stanje aktivnih sifara.xlsx', data_only=True)
ws = wb['Sheet1']
rows = list(ws.iter_rows(values_only=True))[1:]
json.dump([{'ident': str(r[0]).strip(), 'barcode': str(r[1]).strip()} for r in rows if r[1]], open('/tmp/pantheon-barcodes.json','w'))
"
node --env-file=.env --import tsx scripts/backfill-pantheon-erp-id.ts --apply --barcodes-json=/tmp/pantheon-barcodes.json --csv-unmatched

# Run a sync manually (via admin endpoint, logged in as admin in browser)
fetch('/api/admin/erp/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'stock' })  // or prices / products / orders
}).then(r => r.json()).then(console.log)

# Type-check
npx tsc --noEmit

# Test the curl directly (network only)
curl -X POST http://89.216.106.135:8080/tkomserver/webshop/api \
  --data-urlencode "userEmail=webshopapiuser" \
  --data-urlencode 'userPass=13q2ad23d43#$ads23123' \
  --data-urlencode "action=stock"
```

---

**End of handoff document.** Future Claude: Option C is done. New Pantheon work most likely lives in §6 (cron scheduling, admin dashboard at `/admin/erp`, outbound order test, reconciling unmatched + SKU-conflict skips). If something seems contradictory between this doc and reality, trust the code/DB and update this file.
