# Alta Moda — Production Readiness & Next Steps

> **Date:** 2026-04-18
> **Purpose:** Snapshot of what's done, what's left, and what to configure before going live.

---

## 1. What was completed in the last pass

### 1.1 Verified (no code changes needed)

| Feature | Verdict |
|---|---|
| Newsletter buttons: `seed`, `duplicate`, `preview`, `test` | All 4 API route handlers exist and work. Proper admin auth, Prisma queries, error handling. |
| Promotions (`/admin/actions`) | Backend solid: CRUD + audience filter (`all`/`b2c`/`b2b`) + product attachment + auto-delete when `endDate` passes. Active promos applied in product list & detail APIs with best-price selection. |

### 1.2 Implemented

**Brand-logo helper consolidation**
- New file: `src/lib/brand-logos.ts` — single source of truth for the fallback map + `resolveBrandLogo()` helper.
- Removed duplicates from `src/components/Header.tsx` and `src/app/admin/brands/page.tsx`.
- Adding a new brand logo = one line change in one place instead of two.

**Rate-limit Redis migration**
- `src/lib/rate-limit.ts` now uses Upstash Redis when credentials are present, falls back to in-memory `Map` otherwise.
- Sliding-window algorithm via Redis sorted sets (`ZADD` / `ZREMRANGEBYSCORE` / `ZCARD`), atomic via pipeline.
- Fail-open on Redis errors — logs the error and allows the request (better to let legit users through than to hard-block on a Redis outage).
- All 7 call sites in `src/app/api/**/route.ts` updated to `await applyRateLimit(...)`.
- **No behavioural change when Upstash is not configured** — development still works exactly as before.

**Orphan uploads cleanup script**
- New file: `scripts/cleanup-uploads.ts`
- Scans every DB column that can hold an upload URL (8 sources covered).
- **Dry-run by default** — prints orphans, doesn't touch anything.
- `--execute` moves to `/public/uploads/_trash/<date>/` (30-day safety net).
- `--execute --delete` permanently removes.

---

## 2. Production-readiness scorecard

| Layer | Status |
|---|---|
| Catalogue (products, brands, categories, colors) | ✅ Ready |
| User auth (B2C/B2B registration + approval flow) | ✅ Ready |
| Cart + wishlist | ✅ Ready |
| Guest checkout → order creation | ✅ Ready |
| Admin CMS (products, brands, orders, users, newsletter, promotions, settings) | ✅ Ready |
| Newsletter (templates, campaigns, send) | ✅ Ready |
| Rate limiting (multi-instance safe with Upstash) | ✅ Ready |
| Homepage + product detail + editorial pages | ✅ Ready |
| Prisma / Cloudinary / email infrastructure | ✅ Ready |
| **Card payments** | ❌ Not wired |
| **Shipping rate management** | ⚠️ Hardcoded |
| **Order shipment emails + tracking** | ⚠️ Missing |
| **ERP (Pantheon) sync worker** | ⚠️ Queue fills, no drain |

**Overall: ~85–90% production-ready.** Remaining gaps are concentrated in payments + ERP + shipping ops.

---

## 3. Still blocking a full launch

### 🔴 Hard blockers

**1. Card payments** — 1–2 weeks
- Currently `paymentMethod: "card"` is a stub. Cash-on-delivery, bank transfer, and B2B invoice work today.
- Need: provider integration (Stripe / NestPay / Monri), payment intent lifecycle, 3DS, webhook handler, refund flow.
- Suggestion: Serbian market → NestPay or Monri; international-ready → Stripe.

**2. Prisma migration for bundle-table removal** — 1 minute (your side)
```bash
npx prisma migrate dev --name remove_bundles
```
The schema was updated but the DB tables `bundles` and `bundle_items` still exist. Run this before deploying.

### 🟠 Strongly recommended before launch

**3. Shipping zones admin UI** — 2–3 days
- Schema has `ShippingZone` + `ShippingRate` but no admin screen.
- Checkout uses hardcoded rates. Changing rates today = code deploy.

**4. Order lifecycle polish** — 3–5 days
- Missing: shipment email, tracking number field on `Order`, auto-cancel for unpaid card orders, B2B PDF invoice.

**5. ERP Pantheon sync worker** — ~1 week
- Orders enqueue into `ErpSyncQueue` but no drain worker exists.
- Without this, no automatic flow to the back office.

### 🟢 Nice to have

- Manual click-through QA: `/admin/import`, `/admin/colors`, `/admin/actions`, `/admin/newsletter` — 1 day
- Remove remaining olive `#7A7F6A`/`#a5a995` in secondary admin screens — 1–2 hrs
- Lucide deprecation warnings suppression — 30 min
- i18n file trimming (~1,200 lines, some keys unused after recent cleanup) — 2–3 hrs

---

## 4. Leanest possible launch path

If the business wants to go live fast, launch with:

- **Payments** = only `cash_on_delivery`, `bank_transfer`, `invoice (B2B)` (hide the card option).
- **Shipping** = one hardcoded rate; edit the constant when it changes.
- **ERP** = admin copies orders manually into Pantheon for now.

Then add card payments, shipping UI, and ERP worker as v1.1 / v1.2 over the next 4–6 weeks.

**That path = launchable within a week, assuming the Prisma migration is run and the items in §5 are configured.**

---

## 5. Upstash Redis — the full story

### 5.1 Why you need it

You have a rate limiter in `src/lib/rate-limit.ts` that protects:
- Login attempts (prevents password brute-forcing)
- Registration form (prevents spam accounts)
- Newsletter signup (prevents email list abuse)
- Order creation (prevents bot floods)
- Stock-check API (prevents inventory scraping)
- "Am I approved?" status check (prevents email enumeration)

The limiter **must remember recent requests** to decide whether to block the next one. Right now, when Upstash is not configured, it remembers them in **local server memory** — a JavaScript `Map`.

That's fine for:
- Local development (one machine)
- Self-hosted on a single persistent server

That's **broken** for:
- **Vercel** — each request may hit a different serverless function instance. Each instance has its own memory. After 10 login attempts split across 5 instances, each instance has only seen 2 attempts → nobody exceeds the limit.
- **Cold starts** — serverless instances shut down after idle periods. When they restart, memory is wiped. A bot that had 9 failed attempts gets a clean slate.
- **Horizontal scaling** — even on traditional servers, if you run 2+ instances behind a load balancer, same problem.

Redis solves this because it's **one shared data store that every instance reads and writes to**. No matter which instance handles the request, they all see the same counter.

### 5.2 Why Upstash specifically

You want Redis, but you don't want to:
- Run your own Redis server (ops overhead)
- Keep a persistent TCP connection (serverless functions can't)

**Upstash** is Redis-as-a-service with an HTTP REST API. Every rate-limit check is a single HTTP POST to their endpoint. No connection pool, no long-lived sockets, perfect fit for Vercel / Lambda / Cloudflare Workers.

Alternatives if you prefer:
- **Redis Cloud** (by Redis Inc.) — if you already use traditional Redis
- **AWS ElastiCache** — if you're on AWS
- **Render Redis** — if deploying on Render
- **Self-hosted Redis** — if you have a VPS and want full control

For Alta Moda on Vercel, Upstash is the path of least resistance.

### 5.3 What "setting it up" actually looks like

**Step 1 — Create an Upstash account (5 min)**

1. Go to [upstash.com](https://upstash.com) → Sign up (GitHub / Google / email).
2. The free tier covers 10,000 commands/day and 256 MB storage. That's roughly ~100,000 rate-limit checks/day, which is far beyond Alta Moda's realistic traffic for the first year. **You'll pay $0 for a long time.**

**Step 2 — Create a database (2 min)**

1. Click "Create Database".
2. Name: `altamoda-ratelimit` (or whatever).
3. Region: choose one geographically close to your Vercel region. For the Serbian market on Vercel default, **eu-west-1 (Ireland)** or **eu-central-1 (Frankfurt)** are the best choices — lowest latency to Serbia.
4. Type: **Regional** (not Global — Global is overkill and more expensive).
5. TLS: **Enabled** (default).
6. Click "Create".

**Step 3 — Grab the credentials**

After creation you land on the database overview. Scroll to the **"REST API"** section. Copy two values:

```
UPSTASH_REDIS_REST_URL=https://eu1-wise-monkey-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX9vAAIncDE...longtokenhere...xYz
```

⚠️ Treat the token like a password. Anyone who has it can read/write your rate-limit data. Don't commit it to git.

**Step 4 — Set the env vars**

**For local development** (optional, you can leave it unset and dev will use in-memory):
- Add to `.env.local`:
  ```bash
  UPSTASH_REDIS_REST_URL=https://eu1-...
  UPSTASH_REDIS_REST_TOKEN=AX9v...
  ```

**For Vercel production:**
1. Open your Vercel project → Settings → Environment Variables.
2. Add `UPSTASH_REDIS_REST_URL` — paste URL, select **Production** (and Preview if you want).
3. Add `UPSTASH_REDIS_REST_TOKEN` — paste token, same scopes.
4. Click "Save".
5. Redeploy (or it'll pick up on the next push).

**For any other hosting** — set those two env vars however your platform handles secrets. That's it.

**Step 5 — Verify it's working**

You don't need to write any test code. The app auto-detects:
- If both env vars are set → uses Upstash.
- If either is missing → falls back to in-memory (silent).

To verify it's switched to Redis:
1. SSH into the prod instance (or check Vercel logs).
2. Hit the login endpoint 11 times in a minute with the same email. The 11th should return HTTP 429.
3. Open the Upstash dashboard → "Data Browser". You should see a key like `ratelimit:auth:::ffff:123.45.67.89` with 10 timestamp entries.

### 5.4 What the rate-limit code actually does with Redis

Redis has a data structure called a **sorted set** — a list where each entry has a score. We use timestamps as scores. For every rate-limit check, we do 5 operations in one atomic pipeline:

| Step | Redis command | What it does |
|---|---|---|
| 1 | `ZREMRANGEBYSCORE ratelimit:X 0 <cutoff>` | Drop any entries older than the window |
| 2 | `ZADD ratelimit:X <now> <unique-id>` | Add our attempt |
| 3 | `ZRANGE ratelimit:X 0 0 WITHSCORES` | Peek at the oldest remaining entry (for retry-after calculation) |
| 4 | `ZCARD ratelimit:X` | Count entries in the window |
| 5 | `PEXPIRE ratelimit:X <windowMs>` | Auto-delete the key when unused for the window (housekeeping) |

If the count exceeds `maxRequests`, we roll back step 2 (remove our own entry so we don't poison the next caller's window) and return `retry-after`.

**One HTTP round-trip per rate-limit check.** Typical Upstash latency from Frankfurt to Belgrade: 30–60 ms. That's the only cost.

### 5.5 Cost sanity check

Upstash pricing (as of 2026):
- Free: 10,000 commands/day, 256 MB.
- Pay-as-you-go: $0.20 per 100,000 commands after free tier.

Each rate-limit check = 1 pipeline = 5 commands, but Upstash bills pipelined commands as **1 unit** (check their current pricing to confirm).

Alta Moda's realistic traffic:
- 100 logins/day × 1 check = 100 commands
- 20 registrations/day = 20
- 200 newsletter signups/day = 200
- 500 orders/day = 500
- 5,000 stock checks/day = 5,000

**Total: ~6,000 commands/day.** You'll stay on the free tier for a very long time.

### 5.6 What happens if Upstash goes down?

The code is written to **fail open**: if the Redis request fails, the rate limiter logs the error and **allows the request through**. This is the correct trade-off for a rate limiter:
- Fail-closed = legit users can't log in during a Redis outage.
- Fail-open = bots can briefly abuse the system during a Redis outage (rare).

Users > bots, so we fail open.

In practice, Upstash uptime is excellent and this almost never triggers. But it's worth knowing.

### 5.7 Can I just skip Upstash if I'm self-hosting on one server?

Yes. The in-memory fallback is real code, not a placeholder. If you're on a single VPS or dedicated server with PM2/systemd keeping the Node process alive, rate limiting works fine without Redis.

You need Upstash (or equivalent Redis) **specifically for:**
- Vercel / Netlify / Cloudflare Workers (serverless)
- Multiple server instances behind a load balancer
- Auto-scaling setups

If none of those apply, you can launch without it. But if the plan is Vercel → set it up before going live.

---

## 6. Required actions before launch — checklist

```
Critical (hard blockers)
[ ] 1. Run migration:  npx prisma migrate dev --name remove_bundles
[ ] 2. Integrate payment gateway OR disable the card payment option

Before going live on serverless / multi-instance
[ ] 3. Create Upstash account + database (§5.2)
[ ] 4. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in prod env
[ ] 5. Verify rate limiting works (§5.3 step 5)

Strongly recommended
[ ] 6. Build shipping zones admin UI OR hardcode one flat rate
[ ] 7. Add shipment email template + tracking number field on Order
[ ] 8. Build ERP sync worker OR accept manual order entry into Pantheon

Ops / hygiene
[ ] 9. Run: npx tsx scripts/cleanup-uploads.ts                # dry run
[ ] 10. Run: npx tsx scripts/cleanup-uploads.ts --execute     # move to _trash
[ ] 11. Manual QA pass on /admin/import, /admin/colors, /admin/actions, /admin/newsletter
[ ] 12. Review TODO.md + plan.md — delete stale items

Nice to have (can be post-launch)
[ ] 13. Clean up remaining olive-color residue in admin screens
[ ] 14. Trim unused i18n keys
[ ] 15. Handle lucide deprecation warnings
```

---

## 7. Contact points for the remaining work

| Task | File to start reading |
|---|---|
| Card payments integration | `src/app/api/orders/route.ts` (order creation flow) |
| Shipping admin UI | `prisma/schema.prisma` → `ShippingZone`/`ShippingRate` models |
| Order emails | `src/lib/email-templates.ts` (add `orderShippedTemplate`) |
| ERP sync worker | `docs/pantheon-*.md` (integration spec) + `prisma/schema.prisma` → `ErpSyncQueue` |
| Rate limit tuning | `src/lib/rate-limit.ts` (adjust window / max per limiter) |

---

*This document is a snapshot. Re-generate if major work lands.*
