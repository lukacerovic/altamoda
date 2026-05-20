# Pantheon Integration — Status & Handoff

**Last updated:** 2026-05-16
**Status:** ✅ Connected and live for stock sync · ⏳ Waiting on business decision from website owners

> **Purpose of this file:** Continuity document for future Claude sessions. Read this first when picking up Pantheon integration work. It captures the full state of the integration, what's been verified, what's pending, and exactly what to do based on the owners' answer to the open decision.
>
> **How to use:** When the user says "owners answered X" or "let's continue Pantheon work", read this file end-to-end first, then act based on the decision tree in [§5 Decision-pending actions](#5-decision-pending-actions).

---

## 1. TL;DR

The new Next.js site is connected to the legacy DataLab Pantheon ERP via the `tkomserver` middleware. Code is written, deployed locally, and stock data flows for **1,733 products** that have been linked by name match.

The integration is functionally complete except for:
1. A **business decision** sent to website owners (active flag policy — see §4)
2. Production cron scheduling
3. Admin dashboard UI
4. Live test of outbound order push (untested in production)
5. Manual reconciliation of 1,483 unmatched products + 71 ambiguous ones

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
| `sync-inbound.ts` | `syncProducts()`, `syncPrices()`, `syncStock()` — batched (50), idempotent, logged to `ErpSyncLog` |
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
| `backfill-pantheon-erp-id.ts` | Name-match our DB against Pantheon, set `Product.erpId`. Three tiers (exact / normalized / fuzzy ≥0.9). Use `--apply --csv-unmatched`. |

Run with: `node --env-file=.env --import tsx scripts/<name>.ts`

---

## 4. Live data snapshot (2026-05-16)

**Pantheon catalog:**
- 2,926 raw products → 2,922 valid after filtering bookkeeping entries (codes containing `:`, e.g. `"11:Avans"`)
- 980 active (g="T") / 1,942 inactive (g="F")
- 1,783 have price > 0

**Our DB:**
- 3,287 products total
- 913 active / 2,374 inactive
- **1,733 now have `erpId` set** (from backfill — exact name match for 1,726, fuzzy for 7)
- 1,483 unmatched (no Pantheon counterpart by name)
- 71 ambiguous (multiple candidates) → exported to `scripts/backfill-unmatched-*.csv`

**Verified working:**
- ✅ Stock sync ran live: 1,733 products updated in 734ms, no errors
- ✅ ErpSyncLog audit trail writing correctly
- ✅ Pipeline tested end-to-end with one-product script (Pantheon stock → DB update)

---

## 5. Decision-pending actions

**This is the most important section for future-Claude.**

We sent the website owners a Serbian message asking them to choose how Pantheon's `isActive` flag should affect the website. The exact message is preserved in §7 below.

**Why this matters:** 1,719 of the 1,733 matched products link to Pantheon entries marked inactive (`g="F"`). The current `syncProducts()` code overwrites `Product.isActive` based on the Pantheon flag. If we ran a products sync right now without changing anything, 1,719 products would disappear from the website overnight.

### Decision tree — what to do based on owners' answer

#### 🔴 If they choose **OPTION A** ("Veruj Pantheon-u u potpunosti")

> Trust Pantheon: archived in ERP → hidden on website automatically.

**Actions:**
1. No code change needed — `syncProducts()` already does this. Confirm by checking `src/lib/pantheon/sync-inbound.ts:113-122`.
2. Warn the user this will hide ~1,719 products. Get explicit "yes proceed" before running.
3. Run products sync once manually:
   ```bash
   node --env-file=.env --import tsx -e "import('./src/lib/pantheon/sync-inbound').then(m => m.syncProducts()).then(console.log)"
   ```
   Or use the admin endpoint: `POST /api/admin/erp/sync` with `{"type":"products"}`.
4. Add the products sync to the cron schedule (every 6 hours).
5. Proceed to §6 (non-blocked follow-ups).

#### 🟡 If they choose **OPTION B** ("Sajt odlučuje sam")

> Ignore Pantheon's active flag entirely; website manages visibility independently.

**Actions:**
1. **Modify `src/lib/pantheon/sync-inbound.ts`** in `syncProducts()` — remove the `isActive` update on the existing-product branch (around line 113-122). The block to remove/modify:
   ```ts
   if (found.isActive !== item.isActive) {
     await prisma.product.update({
       where: { id: found.id },
       data: { isActive: item.isActive },
     })
     updated++
   } else {
     skipped++
   }
   ```
   Should become:
   ```ts
   // Option B: never overwrite isActive on existing products.
   skipped++
   ```
   For NEW products created by Pantheon sync, decide separately — probably default `isActive: false` so admin must manually publish.
2. Update doc comment at top of file to note the policy.
3. Add tests if applicable.
4. Cron schedule for products sync is now safe to enable (6h).
5. Proceed to §6.

#### 🟢 If they choose **OPTION C** ("Hibrid") — recommended

> Website keeps current `isActive`; Pantheon's flag stored separately for admin visibility.

**Actions:**
1. **Add a new field to Product schema** (`prisma/schema.prisma`):
   ```prisma
   model Product {
     // ... existing fields
     erpIsActive Boolean? @map("erp_is_active") // Pantheon's g flag; informational only
   }
   ```
2. Run `npx prisma migrate dev --name add_erp_is_active`.
3. **Modify `src/lib/pantheon/sync-inbound.ts`** in `syncProducts()` — change the existing-product update to write `erpIsActive` instead of `isActive`:
   ```ts
   if (found.erpIsActive !== item.isActive) {
     await prisma.product.update({
       where: { id: found.id },
       data: { erpIsActive: item.isActive },
     })
     updated++
   } else {
     skipped++
   }
   ```
   Note: need to load `erpIsActive` in the initial `findMany` select.
4. For NEW products created by sync, set both `isActive: item.isActive` AND `erpIsActive: item.isActive` (first import — they match).
5. **Admin UI** — add a column/badge to `/admin/products` showing "Inactive in ERP" when `erpIsActive === false`. So admin can spot the 1,719 cases and decide per-product. (Locate the products admin page first via Explore agent.)
6. Cron schedule for products sync is now safe to enable.
7. Proceed to §6.

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
  Don't add `products` until the isActive decision is made.
- **cron-job.org / external** — hit the same URLs with the bearer header.
- **cPanel cron** — `curl -H "Authorization: Bearer $ERP_CRON_SECRET" https://altamoda.rs/api/cron/erp-sync?type=stock`

Schedule recommendations: stock 15min, prices 1h, orders 5min, products 6h (once unblocked).

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

### 6.4 Reconcile the 1,483 unmatched + 71 ambiguous products

Two paths:
- Admin reviews `scripts/backfill-unmatched-*.csv` and sets `erpId` manually via admin UI (needs a UI for this)
- Try a more aggressive fuzzy threshold (lower than 0.9) and review the additional matches

Probably not urgent — the unmatched products still display on the site, they just won't get auto-updated stock/prices from Pantheon. That's the same state they were in before this integration.

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

Created:
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

Modified:
- `.env.example` — replaced API_KEY pattern with USER/PASS, added CRON_SECRET, IP corrected to `89.216.106.135`, single-quote warning for password
- `src/app/api/orders/route.ts` — added `enqueueOrderSync(createdOrder.id, tx)` inside the order-creation transaction
- (User) `.env` — added real Pantheon credentials

Outputs generated:
- `scripts/backfill-unmatched-*.csv` — list of unmatched/ambiguous products from the backfill run

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

# Backfill erpId across the catalog
node --env-file=.env --import tsx scripts/backfill-pantheon-erp-id.ts
node --env-file=.env --import tsx scripts/backfill-pantheon-erp-id.ts --apply --csv-unmatched

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

**End of handoff document.** Future Claude: when the user provides the owners' answer, jump to §5 and execute the matching option's actions. If they ask about something else Pantheon-related, the answer is probably in §3 (what exists), §4 (live data state), or §6 (non-blocked follow-ups).
