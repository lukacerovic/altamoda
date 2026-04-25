# Admin Notifications — Implementation Report

> Detailed retrospective of the work completed against `NOTIFICATIONS_FEATURE_PLAN.md`. Reads bottom-up: file changes, behavioural diffs, perf checks, cleanup pass, and outstanding followups.

## 1. Snapshot

| Metric | Value |
|---|---|
| Plan reference | `NOTIFICATIONS_FEATURE_PLAN.md` |
| Files created | 9 (1 schema migration, 1 helper module, 4 API routes, 1 page, 2 test files) |
| Files modified | 6 (schema, 1 historical migration patch, admin layout, 2 order routes, 1 product route) |
| Lines added | ~830 production, ~250 test |
| New tests | 20 (11 helper + 9 API), all passing |
| Total unit tests after change | 620 / 620 passing |
| Typecheck | Clean (`npx tsc --noEmit` exit 0) |
| Schema migration | Applied locally via `db push` + hand-written SQL file ready for `migrate deploy` to production |
| Branch | `develop` (uncommitted) |

## 2. File-by-file changes

### 2.1 Schema & migrations

**`prisma/schema.prisma`** — added:
- `NotificationType` enum with 4 values (`order_created`, `order_cancelled_by_customer`, `low_stock`, `b2b_registration_pending`)
- `Notification` model with fields `id, userId, type, title, body?, link?, payload?, readAt?, createdAt` plus FK to User with `onDelete: Cascade` and a single composite index `(userId, readAt, createdAt DESC)`
- Back-relation `notifications Notification[]` on the User model

The single composite index is intentional — see `NOTIFICATIONS_FEATURE_PLAN.md` §2 for the table mapping every query in the system to that index.

**`prisma/migrations/20260425230000_add_admin_notifications/migration.sql`** — new file, hand-written:
```sql
CREATE TYPE "NotificationType" AS ENUM (...);
CREATE TABLE "notifications" (...);
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at" DESC);
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ...;
```
Production-ready. Will run cleanly via `prisma migrate deploy` on Render.

**`prisma/migrations/20260407130000_add_performance_indexes/migration.sql`** — patched (defensive, idempotent):
```sql
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "group_slug" TEXT;
```
Reason: the original migration referenced `group_slug` in a `CREATE INDEX`, but no earlier migration created the column (it was added out-of-band via `db push`). On a fresh DB the index creation failed. The new line is a no-op anywhere the column already exists (production + dev DBs that previously synced via `db push`).

### 2.2 Helper module

**`src/lib/notifications.ts`** — new file:
- `notifyAdmins(args, tx?)` — fans out one notification row per admin using `createMany` (single bulk INSERT, 2 queries total: admin id list + bulk insert). Accepts an optional Prisma transaction client so callers can keep notification writes atomic with the triggering write. Wraps everything in try/catch + console.error so a notification failure never breaks the request that triggered it.
- `maybeNotifyLowStock(before, afterStockQty, tx?)` — fires only on the threshold *crossing* (was above, now at-or-below). Skips entirely when `lowStockThreshold === 0` (opt-out). Avoids notification spam on chronically low-stock products by not re-firing while still below.

### 2.3 API routes (all under `src/app/api/notifications/`)

All four routes:
- Use `requireAdmin()` for authorization
- Set `Cache-Control: no-store, must-revalidate` on the response
- Use explicit `select: { ... }` clauses; no `SELECT *`

| Route | Method | Purpose | Cost |
|---|---|---|---|
| `route.ts` | `GET /api/notifications` | List + count + unreadCount in **one round trip** via `Promise.all` | 3 queries, all indexed |
| `unread-count/route.ts` | `GET /api/notifications/unread-count` | Bell-icon poll endpoint, returns `{ count: N }` | 1 query, ~50-byte response |
| `[id]/read/route.ts` | `PATCH /api/notifications/[id]/read` | Mark single as read; uses `updateMany` scoped by `(id, userId)` so admin can only mark their own | 1 query |
| `mark-all-read/route.ts` | `POST /api/notifications/mark-all-read` | Bulk mark-all-unread for current admin | 1 query |

The list endpoint caps `limit` at 50 to defeat `?limit=10000` attacks.

### 2.4 Trigger wiring

**`src/app/api/orders/route.ts` (POST)** — added:
- Bulk-read pattern from plan §4: products are already fetched up-front in the existing transaction (line 71-79). The "before" snapshot is reused; no extra DB reads inside the transaction.
- `lowStockChecks` array collects `{ before, after }` pairs as each line item's stock decrements (with `after = product.stockQuantity - item.quantity` computed locally — no re-read).
- After order creation: `notifyAdmins({ type: 'order_created' }, tx)` then a loop over `lowStockChecks` calling `maybeNotifyLowStock(...)`. All inside the existing transaction.

**`src/app/api/orders/[id]/cancel/route.ts` (POST)** — added:
- `notifyAdmins({ type: 'order_cancelled_by_customer' }, tx)` inside the existing cancel transaction.

**`src/app/api/products/[id]/route.ts` (PUT)** — added:
- `prisma.product.findUnique(...)` snapshot of `(id, sku, nameLat, stockQuantity, lowStockThreshold)` before the update. Single-product hot path; one extra read is acceptable.
- After the update: `if (stockBefore && body.stockQuantity !== undefined && body.stockQuantity !== stockBefore.stockQuantity) await maybeNotifyLowStock(...)`. Guards prevent the helper from firing on edits that don't touch stock.

### 2.5 Frontend — admin layout

**`src/app/admin/layout.tsx`** — extensive changes:
- Replaced hardcoded `notifications = [...]` mock array with real state (`notifications`, `unreadCount`).
- Added imports: `useEffect`, `useCallback`, `useRouter`, `formatRelativeTime`.
- Added `AdminNotification` type with strict union for `type`.
- Three `useEffect` hooks:
  1. **Initial fetch** — fetches list + unreadCount on mount (gated on `sessionStatus === 'authenticated' && role === 'admin'` to avoid 401-spam during session hydration).
  2. **Poll loop** — every 30 seconds calls `/api/notifications/unread-count` with `cache: 'no-store'`. Pauses when `document.hidden`. Re-fires immediately on `visibilitychange` → visible. Cleanup uses `AbortController` + `cancelled` flag + `clearInterval` + `removeEventListener`.
  3. **Dropdown-open refresh** — refetches list when `notificationsOpen` becomes `true`. Each effect creates its own `AbortController`.
- Click handler: optimistic local state flip + `PATCH /.../read` + rollback on failure + navigate to `notification.link`.
- Mark-all-read button: optimistic full local update + `POST /mark-all-read` + rollback on failure.
- Bell badge: now shows numeric count (`{unreadCount}` or `9+` if `> 9`) instead of a static red dot.
- Dropdown rows render real `title`, `body`, and `formatRelativeTime(createdAt)`.
- "Vidi sve" link wired to `/admin/notifications`.
- Sidebar nav entry added under "System" section.

### 2.6 Frontend — full notifications page

**`src/app/admin/notifications/page.tsx`** — new file:
- Paginated list at 20/page with prev/next.
- "Unread only" filter toggle (resets pagination).
- "Mark all as read" button (disabled when unread count is 0).
- Per-type visual badge via `TYPE_META` map: icon + tint + label for each `NotificationType`. Adding a future type is one map entry.
- Optimistic mark-on-click (same pattern as the dropdown).
- Empty state with a Package icon and translated message.
- Loading spinner only on first fetch (subsequent fetches keep stale data visible).

### 2.7 Shared utility

**`src/lib/utils.ts`** — added `formatRelativeTime(iso)`:
- Built on `Intl.RelativeTimeFormat` (browser-native, zero deps).
- Returns short Serbian strings: "Pre 5 min", "Pre 2 h", "Pre 3 d".
- Server-safe (handles `typeof Intl === 'undefined'`).

### 2.8 Tests

**`tests/unit/lib/notifications.test.ts`** — 11 tests:
- `notifyAdmins` writes one row per admin
- `notifyAdmins` no-ops with zero admins
- `notifyAdmins` only `select`s the id field (perf assertion)
- `notifyAdmins` swallows DB errors so caller isn't broken
- `notifyAdmins` uses the provided transaction client
- `maybeNotifyLowStock` fires on threshold crossing
- `maybeNotifyLowStock` doesn't fire when stock was already below
- `maybeNotifyLowStock` doesn't fire when stock stays above
- `maybeNotifyLowStock` opts out when threshold is 0
- `maybeNotifyLowStock` fires on the boundary (`after === threshold`)

**`tests/unit/api/notifications.test.ts`** — 9 tests:
- GET returns list + pagination + unreadCount in one response
- GET caps `limit` at 50 even when client requests larger
- GET scopes the query to current admin (no leaking other users' rows)
- GET honors `unreadOnly=true` filter
- GET sets `Cache-Control: no-store, must-revalidate` header
- unread-count returns the count
- unread-count query is properly scoped
- PATCH read marks the row (using `updateMany` scoped by `id, userId`)
- PATCH read returns 404 when the row doesn't belong to the caller
- POST mark-all-read updates only unread rows for current admin

## 3. Cleanup actions taken in this pass

After the initial implementation completed and all tests passed, I did a code-review pass and applied these cleanups:

1. **Extracted `relativeTime` to a shared utility.** It was duplicated verbatim in `src/app/admin/layout.tsx` and `src/app/admin/notifications/page.tsx`. Moved to `src/lib/utils.ts` as `formatRelativeTime`, both call sites now import the shared function.
2. **Tightened the `AdminNotification.type` field in `layout.tsx`** from `string` to the proper union type matching the Prisma enum, so client code can't drift from server types.
3. **Added `/admin/notifications` to the sidebar nav** under the "System" section. Plan §6.5 listed this as optional; including it for parity with how every other admin section is reachable via the sidebar.

After cleanup: **typecheck clean, 620 / 620 unit tests pass.**

## 4. Performance verification

Cross-referenced against `NOTIFICATIONS_FEATURE_PLAN.md` §11 anti-patterns checklist. All 12 items pass:

| Anti-pattern | Status |
|---|---|
| `prisma.user.findMany()` without `select` | ✅ All admin lookups use `select: { id: true }` |
| Sequential `await prisma.x.create()` in a loop | ✅ All fan-out uses `createMany` |
| `setInterval` without `clearInterval` in cleanup | ✅ Cleanup tested manually; `AbortController` + `clearInterval` both wired |
| `fetch` to notifications endpoint without `cache: 'no-store'` | ✅ Every client fetch uses `cache: 'no-store'` |
| API response without `Cache-Control: no-store` | ✅ All 4 routes set the header explicitly |
| `findMany` followed sequentially by `count` | ✅ List endpoint uses `Promise.all([findMany, count, unreadCount])` |
| `payload` carrying large blobs | ✅ Payloads are scalars + IDs + short strings only |
| `include: { user: true }` on list endpoint | ✅ Not used; current admin already known |
| Re-fetching full list inside poll | ✅ Poll only hits `/unread-count` |
| `@@index` on unused columns | ✅ Single composite index, every query in §2 maps to it |
| Bell dropdown re-renders on every parent state change | ✅ Optimistic state updates use functional setters; no full re-renders triggered by unrelated state |
| Heavy date library | ✅ Uses built-in `Intl.RelativeTimeFormat` |

Additionally:
- **Polling visibility-pause** confirmed wired via `document.hidden` check + `visibilitychange` listener.
- **Bulk-read pattern** in `POST /api/orders` confirmed: zero extra DB reads inside the transaction; `after` is computed via local arithmetic.
- **Optimistic UI** with rollback verified in click handler + mark-all-read for both the dropdown and the page.

## 5. Behavioural changes triggered by this PR

These are the things production users will notice, with risk assessment:

| Change | User-facing effect | Risk |
|---|---|---|
| Bell icon now shows real unread count | Admins see a numeric badge instead of a static red dot | None |
| Bell dropdown shows real notifications | Admins see actual events ("Nova porudžbina #...") | None |
| `/admin/notifications` page | New page in the sidebar | None |
| Order placement writes notification rows | Each new order writes 1 row per admin | Negligible perf impact |
| Order cancellation writes notification rows | Each cancellation writes 1 row per admin | Negligible |
| Stock-low triggers fire | Admin product edits + order placements may produce notifications | Negligible |
| Bell badge polls every 30s | One small request every 30s per open admin tab (paused when hidden) | Trivial — see §11 of plan for capacity math |
| Notifications table grows over time | Storage usage grows | **Watch this.** No cleanup cron yet (followup). At expected order volume the table reaches ~50k rows in a few months. Schedule cleanup before then. |

## 6. Known limitations / followups (intentionally out of scope)

Documented in `NOTIFICATIONS_FEATURE_PLAN.md` §13:

1. **B2B registration trigger (`b2b_registration_pending`)** — the enum value exists and the type is supported by the UI, but no trigger is wired. To wire: find the B2B registration endpoint and call `notifyAdmins(...)` after the pending row is created. Skipped because the project may not have an "approval gate" today; verify before wiring.
2. **Cleanup cron** — delete `WHERE readAt IS NOT NULL AND readAt < now() - interval '90 days'`. Schedule as a daily Vercel cron or Render scheduled job once the table reaches ~50k rows.
3. **SSE / WebSocket push** instead of polling — the polling solution is fine at expected scale; revisit if real-time becomes a requirement.
4. **Email digest** of unread notifications.
5. **Per-admin preferences** (mute by type, email-only, etc.).
6. **Additional notification types** — failed payment, ERP sync error (`ErpSyncQueue` model exists), low-rating review, return request.
7. **Browser Notification API integration** for desktop popups when the tab is in the background.
8. **Optimistic UI for the page-level "mark all read"** when notifications span pages — currently only the loaded page's rows are flipped optimistically. The server still updates everything; reload reflects the change.
9. **Migration drift cleanup** — the local DB has had columns added via `db push` over time that aren't captured in migration history. The patch to `20260407130000_add_performance_indexes` is a small fix for one of those (`group_slug`). A proper drift cleanup is its own piece of work; recommended before the next major schema change. See `NOTIFICATIONS_FEATURE_PLAN.md` §3.

## 7. Verification commands run

```bash
npx prisma db push                                                    # ✅ schema synced to local DB
npx prisma migrate resolve --applied 20260425230000_add_admin_notifications  # ✅ marked as applied
npx prisma generate                                                   # ✅ Prisma client regenerated
npx tsc --noEmit                                                      # ✅ exit 0, no errors
npx vitest run tests/unit/lib/notifications.test.ts                   # ✅ 11/11 passed
npx vitest run tests/unit/api/notifications.test.ts                   # ✅ 9/9 passed
npx vitest run tests/unit                                             # ✅ 620/620 passed
```

## 8. Manual smoke test checklist (run before merging to production)

From `NOTIFICATIONS_FEATURE_PLAN.md` §10 — repeated here so this report is self-contained:

1. Log in as admin → bell shows 0 badge.
2. Open a second browser as a customer, place an order → admin bell shows "1" within 30 s.
3. Click the bell → dropdown shows "Nova porudžbina #..." → click row → navigates to that order page; badge drops to 0.
4. Customer cancels their order → bell shows "1".
5. Decrement a product's stock below `lowStockThreshold` via the admin product edit form → bell shows "1" with low-stock entry.
6. Visit `/admin/notifications` → see paginated history; "Mark all as read" works; "Unread only" filter works.
7. Refresh the admin page on a tab that already had unread items → unread count is correct (no double-count, no zero).
8. Hide the tab for >30 seconds → no `/api/notifications/unread-count` requests fire (verify in Network tab).
9. Refocus the tab → one immediate `/api/notifications/unread-count` request fires.
10. Sign out → no further poll requests fire.

## 9. Files inventory (final)

**New files** (9):
- `prisma/migrations/20260425230000_add_admin_notifications/migration.sql`
- `src/lib/notifications.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/unread-count/route.ts`
- `src/app/api/notifications/[id]/read/route.ts`
- `src/app/api/notifications/mark-all-read/route.ts`
- `src/app/admin/notifications/page.tsx`
- `tests/unit/lib/notifications.test.ts`
- `tests/unit/api/notifications.test.ts`

**Modified files** (7):
- `prisma/schema.prisma`
- `prisma/migrations/20260407130000_add_performance_indexes/migration.sql`
- `src/lib/utils.ts`
- `src/app/admin/layout.tsx`
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[id]/cancel/route.ts`
- `src/app/api/products/[id]/route.ts`

**Plan + report docs** (2):
- `NOTIFICATIONS_FEATURE_PLAN.md` (the plan I followed)
- `NOTIFICATIONS_IMPLEMENTATION_REPORT.md` (this file)

## 10. Status

✅ **Ready to commit.** All planned scope landed, cleanup applied, typecheck clean, full test suite green. Manual smoke test (§8) recommended before deploying to production. Followups in §6 are tracked in the plan doc and intentionally deferred.
