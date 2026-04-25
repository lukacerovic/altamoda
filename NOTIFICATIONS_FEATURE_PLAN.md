# Admin Notifications — Implementation Plan

> Self-contained spec for the admin notifications feature. Read this top-to-bottom and follow the implementation order. Every file path, schema field, and API contract is concrete.

## 1. Goal & scope

A **bell icon** in the admin header that surfaces important events to admins, with persistent storage so admins can mark items read and revisit history.

### IN scope (v1)
- Persistent `Notification` table with read state per admin
- 4 trigger types: **new order**, **order cancelled by customer**, **low stock crossed**, **new B2B registration**
- Bell icon dropdown in admin header showing latest 10 + unread badge
- `/admin/notifications` full list page with mark-all-read / mark-one-read
- Polling-based unread count (~30s) — no real-time push
- Admin-only — no per-user preferences in v1

### OUT of scope (followups, see §13)
- Real-time push (SSE / WebSockets)
- Email digest of unread notifications
- Per-admin or per-type subscription preferences
- Toast notifications for live events
- Mobile push notifications
- Archive / search / filter on the notifications page beyond read/unread
- Notifications for non-admin roles (B2B/B2C customers)

### Architectural decisions (already made — don't relitigate)
| Decision | Choice | Why |
|---|---|---|
| Storage | Persistent DB table | Need read state + history. Aligns with existing schema patterns. |
| Trigger pattern | Inline in existing API handlers (e.g. `POST /api/orders` writes a notification) | Explicit, easier to reason about than Prisma middleware. Discoverable by reading the route. |
| Real-time | Polling every 30s | Simpler than SSE/WS. Keeps existing tech stack. Bell-icon poll cost is tiny vs the previous full-product-list poll we removed. |
| Per-admin read state | Yes — `userId` FK on Notification | Multiple admins may exist; each tracks their own. |
| Recipient model | One row per (notification, admin) pair via fan-out at write time | Simple to query "my unread", and lets us mark individual reads cleanly. See §3 alternatives. |

### Performance principles (read first, applies to every section below)

These come from real lessons in this codebase — most notably the polling fan-out we just removed from the admin product grid. Don't repeat them.

1. **Notification writes are side-effects of real domain events. They must never block, slow, or break the triggering request.** Fan-out into the same transaction so it's atomic; swallow + log failures; never throw from `notifyAdmins`.
2. **Every server query gets an explicit `select`.** No `SELECT *`. Smaller payload = smaller JSON serialization cost = smaller DB → app transfer = smaller browser parse cost.
3. **Every API response gets `Cache-Control: no-store`.** Browser HTTP cache otherwise serves stale lists after writes (we hit this twice this week). The bell-poll endpoint especially.
4. **Polling pauses when the tab is hidden.** Page Visibility API. An admin leaving 5 tabs open all night should not generate 14,400 requests. Resume on `visibilitychange` → `visible`.
5. **Each polling timer is owned by one component, cleaned up via `AbortController` + `clearInterval` in the effect cleanup.** No orphaned intervals on unmount/route-change.
6. **List endpoint returns list + count + unreadCount in one round trip.** The dropdown should never need to call list + count separately.
7. **Indexes are designed around the actual queries, not "in case".** See §2 for the one composite index that covers every query in the system.
8. **No N+1.** No nested `findMany`. No iterating + awaiting a per-row `findUnique`. If you need related data, `include` it once or batch it.
9. **The admin-id list (`SELECT id FROM users WHERE role='admin'`) is fast (small table, hot in PG cache) — don't bother memoizing it in v1.** If admin count ever grows past ~100, revisit.
10. **Notification rows are short-lived domain events, not a system of record.** Cron-cleanup at 90 days is non-optional once the table starts growing — see §13.

If a code change you're considering would violate any of these, stop and revisit the design. The whole feature must run comfortably on the same Render free-tier Postgres + Vercel hobby plan we have today.

---

## 2. Database schema

Add to `prisma/schema.prisma`. Single new model + a status enum.

```prisma
enum NotificationType {
  order_created
  order_cancelled_by_customer
  low_stock
  b2b_registration_pending
}

model Notification {
  id        String           @id @default(cuid())
  userId    String           @map("user_id")
  type      NotificationType
  title     String           // short headline shown in dropdown row
  body      String?          // optional longer text shown on the page
  link      String?          // deep link, e.g. "/admin/orders/abc123"
  payload   Json?            // structured data for renderers (orderNumber, productSku, ...)
  readAt    DateTime?        @map("read_at")
  createdAt DateTime         @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt, createdAt(sort: Desc)])
  @@map("notifications")
}
```

Add the back-relation on `User`:
```prisma
notifications Notification[]
```

### Why fan-out (one row per admin) instead of broadcast + read-junction
- Simpler queries: `WHERE userId = me AND readAt IS NULL` covers the bell badge.
- Negligible storage with a small admin team (likely <10 admins). If admin count grows past ~50, revisit.
- Read-state per user is trivial: `UPDATE notifications SET readAt = now() WHERE id = X AND userId = me`.

### Index choice — `(userId, readAt, createdAt DESC)`

This single composite index covers every query the system performs. **Don't add more.** Each extra index slows writes and the write path is the hot path (every order, every stock change).

| Query | Plan with this index |
|---|---|
| `WHERE userId = me AND readAt IS NULL` (unread-count poll, every 30s × N admins) | Index range scan on the `(userId, readAt)` prefix. <1 ms even at 100k rows. |
| `WHERE userId = me ORDER BY createdAt DESC LIMIT 10` (dropdown list) | Index scan on `(userId)` prefix, sorted by the trailing `createdAt DESC` column. Top-N retrieval, no sort step. |
| `WHERE userId = me AND id = X` (mark-one-read) | Cheap — small filtered set. Adding a separate index on `id` is unnecessary; the PK already covers `id` lookups. |
| `WHERE userId = me AND readAt IS NULL` (mark-all-read) | Same as the count query, then UPDATE on the matching rows. |

**Anti-pattern to avoid:** Adding `@@index([type])` "in case we want to filter by type later". The list endpoint will only ever filter by user; type filtering happens client-side in the page UI from a small page of rows. Revisit only if v2 introduces a real type-filtered query at scale.

### Storage forecast and cleanup posture

Order placement frequency is the dominant write driver. Worst-case rough math for storage planning:

| Orders / day | Admins | Stock-low events / day | Notifications / day | After 90 days |
|---|---|---|---|---|
| 50 | 3 | 5 | (50 + 5) × 3 = 165 | ~15k rows |
| 200 | 5 | 10 | 1,050 | ~95k rows |
| 1000 | 10 | 30 | 10,300 | ~927k rows |

Each row is roughly 200–500 bytes (depending on `payload` size). At 1M rows the table is well under 500 MB — fine for Postgres, but query latency starts to matter without the cleanup cron. **Schedule a daily cron to delete `WHERE readAt IS NOT NULL AND readAt < now() - interval '90 days'`** as soon as the table reaches ~50k rows. See §13 followups.

**Anti-pattern to avoid:** Storing large blobs in `payload`. Cap it to scalars + small string fields. No nested order-line-items, no full product objects. The link + ID is enough; the renderer can fetch detail on demand.

### Migration name
`add_admin_notifications`

```bash
npx prisma migrate dev --name add_admin_notifications
```

---

## 3. Notification types — exact contracts

For each type, define the trigger location, what `payload` carries, and what `title` / `body` / `link` look like.

### 3.1 `order_created`
- **Trigger**: `POST /api/orders` after `tx.order.create(...)` succeeds, before returning. Look at `src/app/api/orders/route.ts:144` (`createdOrder` variable).
- **Payload**: `{ orderId, orderNumber, customerName, total }`
- **Title**: `Nova porudžbina #${orderNumber}`
- **Body**: `${customerName} — ${formatPrice(total)}`
- **Link**: `/admin/orders/${orderId}`

### 3.2 `order_cancelled_by_customer`
- **Trigger**: `POST /api/orders/[id]/cancel` after status update succeeds.
- **Payload**: `{ orderId, orderNumber, customerName, reason? }`
- **Title**: `Otkazana porudžbina #${orderNumber}`
- **Body**: `${customerName}${reason ? ' — ' + reason : ''}`
- **Link**: `/admin/orders/${orderId}`

### 3.3 `low_stock`
- **Trigger**: Run after every product `update` that touches `stockQuantity`. Two locations to wire:
  1. `PUT /api/products/[id]` in `src/app/api/products/[id]/route.ts`
  2. Anywhere stock is decremented from order placement (`POST /api/orders` already decrements stock — check the same transaction).
- **Threshold logic**: Fire ONLY when `stockQuantity` was `> lowStockThreshold` before the update and becomes `<= lowStockThreshold` after. Avoids re-firing on every subsequent stock change while it's still low.
  - To detect "before/after" cleanly: read the previous `stockQuantity` inside the same transaction before updating, compare.
  - Skip entirely if `lowStockThreshold == 0` (some products may opt out).
- **Payload**: `{ productId, productSku, productName, stockQuantity, lowStockThreshold }`
- **Title**: `Nizak nivo zaliha: ${productName}`
- **Body**: `Trenutno ${stockQuantity} kom (prag: ${lowStockThreshold})`
- **Link**: `/admin/products` (open product edit panel — admin grid will scroll to it via query param if we want, but v1 just lands on the page)

### 3.4 `b2b_registration_pending`
- **Trigger**: Wherever B2B accounts are created with a "pending" state. Search the codebase — likely `POST /api/auth/register` or a dedicated B2B registration route. If B2B accounts auto-activate today, this notification only matters when we later add an approval gate; in that case **skip wiring this trigger now and ship v1 with 3 types** rather than build the gate.
- **Payload**: `{ userId, companyName, email, taxId? }`
- **Title**: `Novi B2B korisnik čeka odobrenje`
- **Body**: `${companyName} (${email})`
- **Link**: `/admin/users?filter=pending_b2b`

> If 3.4 turns out to need approval-gate work that doesn't exist yet, ship the first three types and put 3.4 in §13 followups.

---

## 4. Helper for writing notifications

Create `src/lib/notifications.ts`:

```ts
import { prisma } from './db'
import type { NotificationType, Prisma } from '@prisma/client'

interface NotifyAdminsArgs {
  type: NotificationType
  title: string
  body?: string
  link?: string
  payload?: Prisma.InputJsonValue
}

/**
 * Fan out a notification to every admin user. Safe to call from inside an
 * existing transaction — pass `tx` to keep it atomic with the triggering
 * write. Failures are swallowed and logged; a notification write should
 * never break the request that triggered it.
 *
 * Cost: 2 queries (admin id list + createMany). Both fast — admin table is
 * tiny and hot in PG cache, createMany is a single bulk INSERT.
 */
export async function notifyAdmins(
  args: NotifyAdminsArgs,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<void> {
  try {
    const admins = await tx.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    })
    if (admins.length === 0) return
    await tx.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: args.type,
        title: args.title,
        body: args.body,
        link: args.link,
        payload: args.payload,
      })),
    })
  } catch (err) {
    console.error('[notifications] notifyAdmins failed:', err)
  }
}
```

**Why try/catch silently:** A notification is a side-effect of a real domain event (order placed). A bug in notifications must not roll back the order. Errors go to logs.

### Performance notes for the helper

- **Always `select: { id: true }` on the admin lookup.** Don't pull the full user row when only the FK is needed.
- **`createMany` is the right primitive for fan-out.** Single SQL `INSERT ... VALUES (..),(..),(..)`. Avoid the anti-pattern of looping `prisma.notification.create()` per admin — that opens N connections sequentially and N times slower at any reasonable admin count.
- **Don't do the admin lookup inside a tight loop.** If you ever need to fan out N notifications in one request (e.g. a future bulk-import event), call `findMany` once outside the loop and pass `adminIds` into a wrapper.
- **Don't memoize the admin list across requests in v1.** Stale-cache risk (newly promoted admin gets nothing) outweighs the cost of one tiny SELECT per write. Revisit only if write throughput proves it.

### Bulk read for low-stock checks (avoid N round trips on order placement)

`POST /api/orders` decrements stock for **every line item** in an order. Naively wrapping each decrement with a "read product → decrement → maybe-notify" cycle is N+1.

**Right pattern:** read all referenced products in **one** `findMany` before the transaction starts, decrement each in the transaction, then check thresholds against the in-memory `before` snapshot.

```ts
// ✅ Right — one read for all line items
const productIds = orderItems.map(i => i.productId)
const productsBefore = await prisma.product.findMany({
  where: { id: { in: productIds } },
  select: { id: true, sku: true, nameLat: true, stockQuantity: true, lowStockThreshold: true },
})
const beforeById = new Map(productsBefore.map(p => [p.id, p]))

await prisma.$transaction(async (tx) => {
  // ... existing order/items writes ...
  for (const item of orderItems) {
    const updated = await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { decrement: item.quantity } },
      select: { stockQuantity: true },
    })
    const before = beforeById.get(item.productId)
    if (before) await maybeNotifyLowStock(before, updated.stockQuantity, tx)
  }
  await notifyAdmins({ type: 'order_created', /* ... */ }, tx)
})
```

**Anti-pattern to avoid:** Reading the product inside the transaction with `findUnique` per line item. That doubles round-trips inside an already-hot transaction. The `productsBefore` fetch can happen outside the transaction since stock-availability validation already runs before opening it.

For `PUT /api/products/[id]` the cost is one extra `findUnique` per update — acceptable, single-product hot path.

---

## 5. API endpoints

All routes live under `src/app/api/notifications/`. All require `requireAdmin()`.

### `GET /api/notifications`
List the current admin's notifications, newest first, paginated.

- **Query params**: `?page=1&limit=20&unreadOnly=true|false`
- **Cap `limit` at 50.** Reuse `PAGINATION_MAX_LIMIT` from `src/lib/constants.ts` if appropriate, or hard-cap inline. A bug or attacker could otherwise request `?limit=10000` and pull the whole table.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "notifications": [
        { "id": "...", "type": "order_created", "title": "Nova porudžbina #1048", "body": "...", "link": "/admin/orders/abc", "readAt": null, "createdAt": "...", "payload": { ... } }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 },
      "unreadCount": 7
    }
  }
  ```
- **Cache**: `Cache-Control: no-store` (we learned this lesson; admin lists must always be fresh).
- **Implementation pattern — one round trip:**
  ```ts
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id, ...(unreadOnly ? { readAt: null } : {}) },
      select: { id: true, type: true, title: true, body: true, link: true, readAt: true, createdAt: true, payload: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: user.id, ...(unreadOnly ? { readAt: null } : {}) },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ])
  ```
  Three `Promise.all`'d queries, each backed by the composite index. ~5–10 ms total at expected sizes.
- **Anti-pattern to avoid:** Calling `count()` after `findMany()` sequentially. Always parallelize independent reads.
- **Anti-pattern to avoid:** Returning the full `User` relation (`include: { user: true }`). The current admin already knows who they are.
- File: `src/app/api/notifications/route.ts`

### `GET /api/notifications/unread-count`
Lightweight endpoint used by the bell-icon poll. Returns just `{ count: N }`.

- **Why a separate endpoint:** the poll fires every 30s on every open admin tab. Keeping its payload to a single integer + envelope (~50 bytes) keeps the per-poll cost negligible regardless of how many notifications the user has accumulated.
- **Cost:** single indexed `COUNT(*)` against `(userId, readAt IS NULL)`. <1 ms.
- **Capacity math:** 30s interval × 5 admins × 8h workday × 2 tabs each = ~9,600 requests/day. Trivial. With the visibility-pause from §6.1, real-world load is a fraction of that.
- **Cache**: `no-store`
- File: `src/app/api/notifications/unread-count/route.ts`

### `PATCH /api/notifications/[id]/read`
Mark a single notification as read. No-op if already read.

- **Body**: empty
- **Response**: `{ success: true, data: { id, readAt } }`
- File: `src/app/api/notifications/[id]/read/route.ts`

### `POST /api/notifications/mark-all-read`
Mark all of the current admin's unread notifications as read.

- **Response**: `{ success: true, data: { updated: N } }`
- File: `src/app/api/notifications/mark-all-read/route.ts`

### `DELETE /api/notifications/[id]` (optional, v1.5)
Skip in v1 — nothing in the UI deletes individual rows. Cron-cleanup older than 90 days can be a followup.

---

## 6. Frontend wiring

### 6.1 Replace the hardcoded notifications array in admin layout

`src/app/admin/layout.tsx` — replace the hardcoded array at line 73 with real fetches. The polling has more rules than it looks.

**State:**
```ts
const [notifications, setNotifications] = useState<Notification[]>([])
const [unreadCount, setUnreadCount] = useState(0)
```

**Initial dropdown fetch (mount only):**
- `fetch('/api/notifications?limit=10', { cache: 'no-store' })`
- Hydrate `notifications` and `unreadCount` from the same response (the list endpoint returns both — no second request).

**Polling pattern — every 30s, paused when tab hidden, cancellable on unmount:**
```ts
useEffect(() => {
  let cancelled = false
  const controller = new AbortController()

  const tick = async () => {
    if (document.hidden) return // skip while tab is in background
    try {
      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store', signal: controller.signal })
      if (!res.ok || cancelled) return
      const data = await res.json()
      if (data?.success) setUnreadCount(data.data.count)
    } catch {
      // network error or aborted — silently skip; the next tick retries
    }
  }

  // run once on focus/mount, then on a 30s interval
  tick()
  const interval = setInterval(tick, 30_000)
  // also re-tick immediately when the user comes back to the tab
  const onVisible = () => { if (!document.hidden) tick() }
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    cancelled = true
    controller.abort()
    clearInterval(interval)
    document.removeEventListener('visibilitychange', onVisible)
  }
}, [])
```

**Why this shape, not just `setInterval(...)`:**
- `document.hidden` check skips polls while the tab is in another window. An admin with the tab open all day shouldn't generate polls when not looking.
- `visibilitychange` listener fires an immediate tick when the user comes back, so the badge is fresh on focus.
- `AbortController` + `cancelled` flag prevents two pitfalls: (a) a slow poll completing after unmount and trying to call `setUnreadCount` on a stale component, and (b) polls stacking up if the network is slow.
- 30s is a deliberate choice: under 60s keeps within the Anthropic prompt cache TTL pattern (irrelevant here but the same principle — frequent enough to feel live, infrequent enough to not burn capacity).

**Dropdown open behavior:**
- When `notificationsOpen` flips to `true`, refetch the list once (`/api/notifications?limit=10`). One fetch, not on every render. Use a separate effect with `notificationsOpen` in the dep array.
- Don't auto-mark-as-read on open. The user might just be peeking. Marking happens on click or via "Mark all as read" button.

**Click behavior:**
- Optimistic update: set the row's `readAt` locally and decrement `unreadCount` *before* the network call. `PATCH /api/notifications/[id]/read` runs in the background. Roll back on failure (rare).
- Navigate to `notification.link` via `<Link>` (allows prefetch).

**Mark-all-read button:**
- Optimistic: set every loaded row's `readAt` to now, set `unreadCount = 0`, then `POST /api/notifications/mark-all-read`. Roll back on failure.

**Anti-patterns to avoid:**
- ❌ Re-fetching the full list inside the 30s poll. The poll is for the count only — that's the whole point of the separate `/unread-count` endpoint.
- ❌ Calling `setUnreadCount(prev => prev + 1)` from any other code path. The bell is a read-only mirror of server state. Server is the source of truth; the next tick will reconcile.
- ❌ Using `useSWR` / `react-query` just for this. The codebase doesn't use those. Don't add a dep for one feature.
- ❌ Bell badge re-rendering the entire admin layout on each poll tick. Memoize the dropdown content via `React.memo` and pass primitives (count, list) — see §6.3.
- ❌ Forgetting the cleanup return. Without it, route changes within the admin leave intervals running.

### 6.2 Bell badge

Bell icon already exists at line 283. Add a small numeric badge overlay when `unreadCount > 0`:
- Red dot with the number (max display "9+" if > 9)
- Position: top-right corner of the bell

### 6.3 Notification row rendering

Use the existing dropdown markup, but make rows real:
- `text` → `notification.title`
- `time` → relative time (`Pre 5 min`) — use a tiny formatter or `dayjs.from`. There's already i18n setup in `src/lib/i18n` — reuse if a relative time helper exists.
- `unread` → `notification.readAt === null`
- Make each row a `<Link>` to `notification.link` (with the read-mark side-effect on click).
- Add a "Vidi sve" link at the bottom going to `/admin/notifications`.

### 6.4 Full list page

New file: `src/app/admin/notifications/page.tsx`
- Client component, similar pattern to `src/app/admin/products/page.tsx` (lighter — no edit panel).
- Fetch `/api/notifications?page=N&limit=20`.
- Show all fields: type badge (color-coded by type), title, body, relative time, link.
- Toolbar: "Mark all as read", filter toggle "Show unread only".
- Pagination (8–20 per page).
- Empty state: "Nema obaveštenja".

### 6.5 Sidebar nav entry (optional)

Add `/admin/notifications` to the admin sidebar so it's discoverable beyond the bell dropdown. Add to one of the nav sections in `src/app/admin/layout.tsx:65` area.

---

## 7. Wiring the triggers

### 7.1 `POST /api/orders` → order_created
File: `src/app/api/orders/route.ts`

Inside the transaction at line 144 (where `tx.order.create` runs), right after order + items are written and stock is decremented:

```ts
await notifyAdmins({
  type: 'order_created',
  title: `Nova porudžbina #${createdOrder.orderNumber}`,
  body: `${customerName} — ${formatPrice(Number(createdOrder.totalAmount))}`,
  link: `/admin/orders/${createdOrder.id}`,
  payload: {
    orderId: createdOrder.id,
    orderNumber: createdOrder.orderNumber,
    customerName,
    total: Number(createdOrder.totalAmount),
  },
}, tx)
```

`customerName` comes from the order body (or the linked user). Use whichever shape the existing handler already reads.

### 7.2 `POST /api/orders/[id]/cancel` → order_cancelled_by_customer
File: `src/app/api/orders/[id]/cancel/route.ts`

After the status update succeeds:
```ts
await notifyAdmins({
  type: 'order_cancelled_by_customer',
  title: `Otkazana porudžbina #${order.orderNumber}`,
  body: customerName,
  link: `/admin/orders/${order.id}`,
  payload: { orderId: order.id, orderNumber: order.orderNumber, customerName },
})
```

### 7.3 Low stock — two trigger sites
Add a small helper in `src/lib/notifications.ts`:
```ts
export async function maybeNotifyLowStock(
  before: { stockQuantity: number; lowStockThreshold: number; sku: string; nameLat: string; id: string },
  afterStockQty: number,
  tx?: Prisma.TransactionClient,
) {
  if (before.lowStockThreshold <= 0) return
  if (before.stockQuantity > before.lowStockThreshold && afterStockQty <= before.lowStockThreshold) {
    await notifyAdmins({
      type: 'low_stock',
      title: `Nizak nivo zaliha: ${before.nameLat}`,
      body: `Trenutno ${afterStockQty} kom (prag: ${before.lowStockThreshold})`,
      link: '/admin/products',
      payload: { productId: before.id, productSku: before.sku, productName: before.nameLat, stockQuantity: afterStockQty, lowStockThreshold: before.lowStockThreshold },
    }, tx)
  }
}
```

Wire in:
- `PUT /api/products/[id]` — read product before update, call `maybeNotifyLowStock` after.
- `POST /api/orders` order placement — for each line item that decrements stock, call `maybeNotifyLowStock` after the decrement.

### 7.4 B2B registration — skip if no approval gate exists
Search for existing B2B registration flow first. If accounts auto-activate today, defer this trigger to followups (§13). Don't build the approval gate as part of the notifications PR — that's its own scope.

---

## 8. Implementation order (do in this order)

1. **Schema** — add `NotificationType` enum + `Notification` model + back-relation on `User`. Run `prisma migrate dev --name add_admin_notifications`. Verify migration file shape.
2. **Helper** — write `src/lib/notifications.ts` with `notifyAdmins` and `maybeNotifyLowStock`.
3. **API routes** — implement GET list, GET unread-count, PATCH read, POST mark-all-read. Use existing `withErrorHandler` + `requireAdmin` patterns. Set `Cache-Control: no-store` on responses.
4. **Trigger wiring** — order_created → order POST, order_cancelled → cancel route, low_stock → product PUT + order POST line-item decrement.
5. **Bell icon wire-up** — replace hardcoded array in `src/app/admin/layout.tsx` with real fetch + 30s poll for unread count + read-on-click.
6. **Notifications page** — `src/app/admin/notifications/page.tsx` with list, mark-all-read, unread filter, pagination.
7. **Sidebar nav entry** — optional: add link to the page in admin nav.
8. **Tests** — see §9.
9. **Manual smoke test** — see §10.

Each step is a logical commit boundary. Aim for ~7–9 commits total in a single PR.

---

## 9. Tests

Pattern: follow existing tests in `tests/unit/api/`. Use the mocks-based style from `phase3-api.test.ts`.

### Required unit tests
- `notifyAdmins` writes one row per admin user. Test with 0, 1, 3 admins.
- `notifyAdmins` swallows errors and logs (no throw).
- `maybeNotifyLowStock` fires only on the threshold crossing (not when already below; not when threshold is 0).
- `GET /api/notifications` returns only the current admin's rows.
- `GET /api/notifications/unread-count` returns the right count.
- `PATCH /api/notifications/[id]/read` is a no-op when already read; returns 404 for not-mine.
- `POST /api/notifications/mark-all-read` updates only unread, only mine.

### Skip in v1
- Component tests for the bell dropdown — manual smoke test is enough; no React Testing Library in this project today.

---

## 10. Manual smoke test (run before merging)

1. Log in as admin → bell shows 0 badge.
2. Open a second browser as a customer, place an order → admin bell shows "1" within 30s.
3. Click the bell → dropdown shows "Nova porudžbina #..." → click row → navigates to that order page; badge drops to 0.
4. Customer cancels their order → bell shows "1".
5. Decrement a product's stock below `lowStockThreshold` via the admin product edit form → bell shows "1" with low-stock entry.
6. Visit `/admin/notifications` → see paginated history; "Mark all as read" works; "Unread only" filter works.
7. Refresh the admin page on a tab that already had unread items → unread count is correct (no double-count, no zero).

---

## 11. Performance & capacity — consolidated

This section ties together the inline performance notes scattered through §1–§7. Use it as the final pre-merge sanity check.

### Per-request cost budget (steady state, expected sizes)

| Operation | Queries | Approx latency | Notes |
|---|---|---|---|
| `notifyAdmins` write (3 admins) | 2 | <5 ms | `findMany(role='admin')` + `createMany` |
| `notifyAdmins` write (10 admins) | 2 | <8 ms | Same shape, slightly larger bulk insert |
| `maybeNotifyLowStock` (no fire) | 0 | <1 ms | Just a numeric comparison; no DB hit |
| `maybeNotifyLowStock` (fires) | 2 | <8 ms | Delegates to `notifyAdmins` |
| `GET /api/notifications` (limit=20) | 3 (parallelized) | 5–15 ms | findMany + count + unreadCount |
| `GET /api/notifications/unread-count` | 1 | <1 ms | Indexed COUNT(*) |
| `PATCH /api/notifications/[id]/read` | 1 | <2 ms | Single UPDATE with composite WHERE |
| `POST /api/notifications/mark-all-read` | 1 | <5 ms | Single UPDATE on indexed range |

The notifications feature should not measurably move the latency profile of any existing endpoint.

### Polling load — capacity ceiling

| Scenario | Poll requests / day | Realistic with visibility-pause | Comment |
|---|---|---|---|
| 1 admin, 1 tab, 8h workday | 960 | ~700 | Pause during lunch / meetings |
| 5 admins, 2 tabs each, 8h workday | 9,600 | ~6,500 | Most tabs hidden most of the time |
| 5 admins, all-day open (worst case) | 14,400 | ~9,000 | Background tabs throttled by browser anyway |

Each poll is a single indexed `COUNT(*)` returning ~50 bytes. Even the worst-case row consumes a tiny fraction of any tier's capacity. **No real risk to the Render free DB or Vercel hobby function quota.**

### What would actually break this feature

| Failure mode | Cause | Mitigation in this design |
|---|---|---|
| Notification table grows unbounded → slow queries | No cleanup cron | Documented in §13 followups; non-optional past ~50k rows. |
| Order placement gets slow under load | Notification fan-out inside transaction is doing N reads | Bulk-read pattern in §4 collapses N reads to 1 outside the txn. |
| Admin grid stalls on layout because notifications fail | Synchronous notification fetch blocks the render | Bell-icon fetch is in `useEffect` (post-mount). Layout always renders even if API is down. |
| Poll fires after admin signs out | `useEffect` cleanup not wired | `AbortController` + `clearInterval` in §6.1's effect cleanup. |
| Admin sees stale unread count after creating a notification themselves | Unrealistic — admins don't create notifications, they receive them. Triggers fire from customer-facing actions. | N/A |
| Two admin tabs in one browser race on mark-all-read | One wins, the other's optimistic update reconciles to 0 within 30s | Acceptable. |

### Anti-patterns checklist (do not commit if any of these are true)

- [ ] Any `prisma.user.findMany()` without `select`
- [ ] Any sequential `await prisma.x.create()` in a `for` loop where `createMany` would do
- [ ] Any `setInterval` without a `clearInterval` in the matching cleanup
- [ ] Any `fetch` to a notifications endpoint without `cache: 'no-store'`
- [ ] Any API response without `Cache-Control: no-store` set explicitly
- [ ] Any `findMany` followed sequentially by `count` instead of `Promise.all`'d
- [ ] `payload` carrying anything beyond scalars + IDs + short strings
- [ ] `include: { user: true }` on a notification list endpoint
- [ ] Re-fetching the full notification list inside the poll (it's count-only by design)
- [ ] An `@@index` on a column that no query in §2's table actually uses
- [ ] Bell dropdown component re-rendering on every parent state change (use `React.memo`)
- [ ] Using a heavy date library (dayjs, moment) just for relative time — `Intl.RelativeTimeFormat` is built into the browser

### Recommended tools while implementing

- **Prisma query logging** in dev: set `log: ['query']` on the Prisma client temporarily to confirm the actual SQL matches expectation. Especially useful to verify the index is being used (look for `Using index ...`).
- **Browser DevTools Network tab** with throttling to "Slow 3G" while testing the bell — confirms the optimistic UI feels right and AbortController handles slow polls correctly.
- **`EXPLAIN ANALYZE`** on the unread-count query against a seeded local table of 100k rows to confirm index usage before deploying. One-time check.

---

## 12. Edge cases & gotchas

| Case | Handling |
|---|---|
| Admin deletes their own user account | `onDelete: Cascade` on the FK removes their notification rows. |
| Low stock crossed multiple times (10 → 4 → 6 → 3) | Fires on the first crossing (10 → 4). Doesn't re-fire on 4 → 6 (still <= threshold). Doesn't re-fire on 6 → 3 (still <= threshold). Re-fires only if stock goes back above threshold and crosses again. **This is desired** — avoids notification spam on a chronically low product. |
| Notification fan-out runs inside an existing transaction | Pass the `tx` argument to keep it atomic. If write fails, the order also rolls back — acceptable because the customer would see an error and retry. |
| Admin is logged out when poll fires | Poll request returns 401; the bell badge silently stops updating. No error toast. Consider clearing the interval when `useSession()` shows unauthenticated. |
| Two admins look at the same notification | Each has their own row; each marks read independently. Correct. |
| Same admin in two tabs | Both tabs poll independently. Marking read in tab A → tab B updates within 30s. Acceptable. |
| Notification table grows unbounded | Acceptable for v1. Add a cron in followups to delete `readAt < now() - 90 days`. |
| Order POST writes notification but admin user table is empty | `notifyAdmins` early-returns when no admins. No-op. |
| `payload` JSON shape changes over time | Keep payload optional and never assume specific keys in the renderer. Use `title` / `body` / `link` for display; payload is for future deep-linking and analytics. |

---

## 13. Out of scope — followups worth tracking

- **B2B registration approval gate + notification trigger** (if not already in place)
- **SSE real-time push** instead of polling — replace `/api/notifications/unread-count` poll with an EventSource subscription
- **Daily digest email** for unread notifications
- **Per-admin preferences** (mute certain types, receive only via email, etc.)
- **More notification types**: failed payment, ERP sync error (`ErpSyncQueue` already exists), low-rating review, return request
- **Cleanup cron**: delete read notifications older than 90 days
- **Group notifications**: collapse "5 new orders in the last hour" into one row
- **Sound / browser notification** API for high-priority types

---

## 14. File checklist (use as PR checklist)

**New files**
- [ ] `src/lib/notifications.ts`
- [ ] `src/app/api/notifications/route.ts`
- [ ] `src/app/api/notifications/unread-count/route.ts`
- [ ] `src/app/api/notifications/[id]/read/route.ts`
- [ ] `src/app/api/notifications/mark-all-read/route.ts`
- [ ] `src/app/admin/notifications/page.tsx`
- [ ] `tests/unit/lib/notifications.test.ts`
- [ ] `tests/unit/api/notifications.test.ts`
- [ ] `prisma/migrations/<timestamp>_add_admin_notifications/migration.sql`

**Modified files**
- [ ] `prisma/schema.prisma` — add enum + model + User back-relation
- [ ] `src/app/admin/layout.tsx` — replace hardcoded notifications, wire bell + dropdown to API, add poll, add badge
- [ ] `src/app/api/orders/route.ts` — call `notifyAdmins` for `order_created` + `maybeNotifyLowStock` for line-item decrements
- [ ] `src/app/api/orders/[id]/cancel/route.ts` — call `notifyAdmins` for `order_cancelled_by_customer`
- [ ] `src/app/api/products/[id]/route.ts` — call `maybeNotifyLowStock` after stock-touching updates

**No-touch zones**
- Don't change the existing order/product/cancel response shapes — notification writes are pure side-effects.
- Don't touch storefront pages or non-admin layouts.
