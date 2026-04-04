# Security Audit Report — Alta Moda E-Commerce

**Date:** April 4, 2026
**Scope:** Full application security review
**Stack:** Next.js 15, Prisma, PostgreSQL, NextAuth, TypeScript

---

## Executive Summary

The application has a solid security foundation with many best practices already in place (parameterized queries, proper auth checks, server-side price calculation, hashed passwords, rate limiting). However, there are several issues to address before production — most notably sensitive price data leakage, a user enumeration endpoint, and CSP weaknesses.

**Overall Rating:** Above average for this stage, but needs the critical/high items fixed before production.

---

## Findings by Severity

### CRITICAL

#### 1. B2B Wholesale Prices and Cost Prices Exposed to All Users

**Files:** `src/app/api/products/route.ts` (lines 194-195), `src/app/api/products/[id]/route.ts` (line 84)

**Issue:** The products API returns `priceB2b` and `costPrice` to every user, including unauthenticated guests and B2C customers. Competitors can see your wholesale pricing and cost basis.

```javascript
// Returned to ALL users:
priceB2c: Number(p.priceB2c),
priceB2b: p.priceB2b ? Number(p.priceB2b) : null,  // ← wholesale price visible to everyone
costPrice: product.costPrice ? Number(product.costPrice) : null,  // ← your cost visible to everyone
```

**Impact:** Commercial damage — competitors undercut B2B pricing, B2C customers see margins.

**Fix:** Only return `priceB2b` when `role === 'b2b' || role === 'admin'`. Never return `costPrice` to non-admin users.

---

#### 2. User Account Enumeration via check-status Endpoint

**File:** `src/app/api/users/check-status/route.ts` (lines 22-28)

**Issue:** Returns `'unknown'` for non-existent users and actual status (`'active'`, `'pending'`, etc.) plus role for existing users. An attacker can enumerate valid email addresses.

**Fix:** Return the same generic response regardless of whether the user exists, or merge this logic into the login flow.

---

### HIGH

#### 3. CSP Allows 'unsafe-eval' for Scripts

**File:** `next.config.ts` (line 32)

**Issue:** `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — the `'unsafe-eval'` directive is not needed in production and significantly weakens XSS protection.

**Fix:** Remove `'unsafe-eval'`. Consider nonce-based CSP for `'unsafe-inline'` as well.

---

#### 4. .env File Contains Real Credentials

**File:** `.env`

**Issue:** Contains real database password and `AUTH_SECRET`. If this was ever committed to git history, those secrets are permanently exposed.

**Fix:** Verify with `git log --all --follow -p -- .env` that it was never tracked. If it was, rotate all secrets immediately. Use `.env.example` with placeholders for the repo.

---

#### 5. File Upload — No Magic Byte Verification

**File:** `src/lib/upload.ts` (lines 18-19)

**Issue:** Upload validation relies on `file.type` (MIME type) and file extension, both of which are client-controlled and spoofable. A polyglot file (valid image header + embedded HTML/JS) could be uploaded and served, enabling stored XSS.

**Fix:** Add magic byte validation (check first bytes against known image signatures). Consider serving uploads from a separate domain or with `Content-Disposition: attachment`.

---

#### 6. Rate Limiter is In-Memory Only

**File:** `src/lib/rate-limit.ts` (line 4)

**Issue:** Uses an in-memory `Map`. If deployed with multiple server instances behind a load balancer, rate limiting is split across instances and effectively weakened.

**Fix:** Migrate to Redis-backed rate limiter (e.g., `@upstash/ratelimit`) before multi-instance deployment.

---

#### 7. X-Forwarded-For IP Spoofing in Rate Limiter

**File:** `src/lib/rate-limit.ts` (lines 101-107)

**Issue:** Trusts the first IP in the `X-Forwarded-For` header, which is client-controlled. An attacker can send any IP to bypass all rate limits (login brute-force, order spam, etc.).

**Fix:** Only trust `X-Forwarded-For` behind a known reverse proxy. Configure your proxy to set a trusted header, or use the rightmost (proxy-added) IP.

---

### MEDIUM

#### 8. No CSRF Protection on State-Changing API Routes

**Files:** All POST/PUT/DELETE API routes

**Issue:** NextAuth handles CSRF for its own routes, but all other mutations (add to cart, create order, update profile) lack CSRF tokens. Since the session uses httpOnly cookies, a malicious site could forge requests.

**Mitigation:** NextAuth's `SameSite=Lax` cookie setting provides partial protection. CSP `form-action 'self'` helps too.

**Fix:** Verify `SameSite=Lax` on session cookie. Consider adding CSRF tokens for critical mutations (orders, profile updates).

---

#### 9. Stock Validation Endpoint Has No Authentication

**File:** `src/app/api/cart/validate-stock/route.ts`

**Issue:** Accepts product IDs and returns exact stock quantities without authentication or rate limiting. Competitors can monitor your inventory in real-time.

**Fix:** Add rate limiting. Return boolean in-stock/out-of-stock instead of exact quantities for non-admin users.

---

#### 10. Brands ?all=true Bypasses Active Filter Without Auth

**File:** `src/app/api/brands/route.ts` (lines 8-10)

**Issue:** Anyone can add `?all=true` to the URL to see inactive/hidden brands. No authentication check.

**Fix:** Only apply `showAll` when the requesting user is an admin:
```javascript
const user = await getCurrentUser()
const showAll = searchParams.get('all') === 'true' && user?.role === 'admin'
```

---

#### 11. ERP Internal Data in API Responses

**Files:** Multiple product and order API routes

**Issue:** Fields like `erpId`, `erpSynced`, `barcode`, `vatRate`, `vatCode` are returned to all users. These expose internal operational details.

**Fix:** Exclude ERP fields from public responses; only include in admin responses.

---

#### 12. No Rate Limiting on Newsletter Subscribe

**File:** `src/app/api/newsletter/route.ts`

**Issue:** No rate limiting on the POST endpoint. An attacker could spam thousands of email addresses, triggering welcome emails and potentially getting your email domain flagged as spam.

**Fix:** Add rate limiting (e.g., 5 subscriptions per IP per hour).

---

### LOW

#### 13. Guest Users Default to Seeing All Products (Including Professional)

**File:** `src/app/api/products/route.ts` (lines 46-54)

**Issue:** Guests see all products by default (including professional/B2B items) with the visibility filter being client-controlled.

**Fix:** Consider defaulting guests to B2C visibility.

---

#### 14. Cart Quantity Has No Upper Bound

**File:** `src/app/api/cart/route.ts` (lines 77-79)

**Issue:** No maximum quantity check when adding to cart. Users could add extremely large quantities.

**Fix:** Add a reasonable max quantity limit in the cart schema validation.

---

## What's Already Done Well

These are security best practices that are properly implemented:

| Area | Status | Details |
|------|--------|---------|
| **SQL Injection** | **Protected** | Zero raw SQL queries. All DB access through Prisma's parameterized query builder. |
| **Authentication** | **Solid** | `requireAuth()` re-checks user status from DB on every call, catching suspended users mid-session. |
| **Admin Authorization** | **Complete** | Every admin API route uses `requireAdmin()`. Verified all routes. |
| **Resource Ownership** | **Verified** | Orders, cart items, and wishlists check `userId` before allowing access. User A cannot see User B's data. |
| **Password Security** | **Strong** | bcryptjs with cost factor 12. Password hashes never returned in API responses. Explicit `select` clauses exclude `passwordHash`. |
| **Server-Side Pricing** | **Correct** | Order creation looks up prices from the database, never trusting client-side values. Comment: "Calculate prices from DB (never trust client-side prices)". |
| **Atomic Stock Decrement** | **Race-safe** | Order creation uses `prisma.$transaction` with atomic `updateMany` + `gte` check to prevent negative inventory. |
| **XSS Protection** | **Good** | Only one `dangerouslySetInnerHTML` usage (brand page), which is sanitized with DOMPurify. |
| **HTTP Security Headers** | **Comprehensive** | X-Frame-Options DENY, HSTS with preload, X-Content-Type-Options nosniff, strict Referrer-Policy, Permissions-Policy, frame-ancestors 'none'. |
| **Rate Limiting** | **Present** | Login (10/15min), registration (5/hour), order creation (5/min), check-status (15/15min). |
| **Input Validation** | **Zod-based** | Registration, orders, cart, reviews, and quick orders use Zod schemas. |
| **Search Input** | **Truncated** | Product search limited to 255 characters (`.slice(0, 255)`). |
| **Pagination** | **Bounded** | `getPaginationParams` enforces `PAGINATION_MAX_LIMIT`. |
| **Upload Security** | **Admin-only** | File type allowlist, size limit (10MB), UUID filenames (no path traversal). |
| **Session Duration** | **24 hours** | Not the default 30 days. |
| **Soft Deletes** | **Yes** | Products use `isActive: false` rather than hard delete. |
| **Input Validation** | **Zod** | Registration, orders, cart operations all validated with Zod schemas. |

---

## Remediation Status

| Finding | Status | Details |
|---------|--------|---------|
| #1 — B2B/cost price leakage | **FIXED** | `priceB2b` only returned to B2B/admin. `costPrice` only to admin. ERP fields stripped for non-admin. |
| #2 — User enumeration | **FIXED** | Returns `'active'` for non-existent users. No longer returns `role`. |
| #3 — Remove unsafe-eval from CSP | **FIXED** | Removed `'unsafe-eval'` from script-src. |
| #4 — Verify .env never committed | **VERIFIED** | `.env` was never tracked in git history. |
| #5 — Magic byte upload validation | **FIXED** | Added magic byte signature verification for all allowed file types. |
| #7 — Fix X-Forwarded-For trust | **FIXED** | Now uses rightmost IP (proxy-added) instead of leftmost (client-controlled). |
| #9 — Stock validation endpoint | **FIXED** | Added rate limiting (30/min). Returns boolean in-stock (1/0) instead of exact quantities. |
| #10 — Auth check on brands ?all=true | **FIXED** | `?all=true` now requires admin auth. Non-admin falls back to active-only. |
| #11 — Strip ERP data from public responses | **FIXED** | `erpId`, `barcode`, `vatRate`, `vatCode` only returned to admin users. |
| #12 — Rate limit newsletter subscribe | **FIXED** | Added rate limit: 5 subscriptions per IP per hour. |
| #14 — Cart quantity upper bound | **ALREADY OK** | Zod schema already enforces `.max(999)`. |

### Remaining items (deferred)

| Finding | Status | Notes |
|---------|--------|-------|
| #6 — Redis-backed rate limiter | **Deferred** | Needed before multi-instance deployment. Current in-memory limiter works for single instance. |
| #8 — CSRF tokens for critical mutations | **Deferred** | Partially mitigated by SameSite=Lax cookies. Full CSRF tokens recommended before production. |
| #13 — Default guest visibility | **Deferred** | Business decision — currently guests see all products. |
| **When possible** | #13 — Default guest visibility | Small |
| **When possible** | #14 — Cart quantity upper bound | Trivial |
