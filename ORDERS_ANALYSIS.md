# Orders / Porudžbine — Feature Analysis

## Overview

The Orders feature covers: checkout flow, order creation, admin order management, status tracking, and payment handling. The system uses a **state machine** for order statuses: `novi → u_obradi → isporuceno` (with `otkazano` possible from any non-final state).

**Verdict: Solid foundation, but several critical gaps before production.**

---

## What Works Well

- **Stock management** — Transaction-based with row-level checks to prevent overselling
- **Price security** — Prices always recalculated from DB (never trusts client)
- **Admin UI** — Functional order list with search, status filtering, expandable details, timeline, 30s polling
- **Status transitions** — Valid state machine enforced on both frontend and backend
- **Audit trail** — `OrderStatusHistory` tracks every change with admin name and timestamp
- **Role-based access** — Admin sees all orders, users see only their own
- **Rate limiting** — 5 orders per minute per IP
- **B2B support** — Invoice payment, minimum order validation, quick order/CSV import, order repeat
- **Order numbering** — Unique format: `ALT-2026-XXXX`

---

## Critical Issues

### 1. No Order Confirmation Email
**Location:** `POST /api/orders` in `src/app/api/orders/route.ts`

Email infrastructure exists (`sendTransactional()` in `src/lib/email.ts`) but NO email is triggered after order creation. The confirmation page at `/checkout/confirmation` falsely displays "Poslali smo vam email sa potvrdom" (We sent you a confirmation email).

**Fix:** Call `sendTransactional()` after successful order creation with order details.

---

### 2. Guest Checkout is Broken
**Location:** `src/app/checkout/CheckoutClient.tsx` → `POST /api/orders`

The checkout UI collects guest info (name, email, phone) and has a full guest flow (5 steps vs 4 for logged-in). However, the API requires `requireAuth()` — guest users get a 401 and cannot place orders.

Additionally, `Order.userId` is required (non-nullable) in the Prisma schema, so guest orders can't be stored without a temporary user record.

**Fix:** Either implement guest order support (make userId nullable, add guest fields) or remove the guest checkout UI entirely.

---

### 3. No Payment Processing
**Location:** `src/app/api/orders/route.ts`

All orders are created with `paymentStatus: 'pending'`. There is no integration with any payment gateway (Stripe, PayPal, etc.). Card payments are accepted in the UI but never actually charged.

**Fix:** Integrate a payment processor. No `paymentGatewayId` field exists in the schema to store transaction references — this needs to be added.

---

### 4. Promo Codes Not Processed
**Location:** `src/app/api/orders/route.ts`, `src/lib/validations/order.ts`

The checkout accepts a promo code input, the validation schema allows it, and `promoCodeId` exists on the Order model. However, the code **never validates or applies** the promo code — `discountAmount` is always 0.

**Fix:** Add promo code lookup, validate it (active, not expired, usage limits), and calculate discount.

---

### 5. Export Button Non-Functional
**Location:** `src/app/admin/orders/page.tsx` — "Izvezi" button

The button is visible in the admin UI but has **no onClick handler** and **no backend endpoint**. It does nothing when clicked.

**Fix:** Implement `GET /api/orders/export` endpoint with CSV generation.

---

## Missing Features

| Feature | Status | Priority |
|---------|--------|----------|
| Order confirmation email | Not implemented | Critical |
| Payment gateway integration | Not implemented | Critical |
| Promo code processing | Schema exists, no logic | Critical |
| Order export (CSV) | Button exists, no backend | High |
| Email on status change | Not implemented | High |
| Admin notification on new order | Not implemented | High |
| Stock restoration on cancel | Status changes, stock unchanged | High |
| Refund processing | Can mark "refunded", no logic | Medium |
| Tracking number integration | Field exists, unused | Medium |
| Shipping rate lookup | ShippingRate table exists, unused | Medium |
| Duplicate order detection | Not implemented | Medium |
| Date range filter in admin | Not implemented | Low |
| Bulk status changes | Not implemented | Low |
| Order printing | Not implemented | Low |

---

## Bugs & Edge Cases

### Hardcoded Serbian in Admin
Several labels in the expanded order detail are hardcoded in Serbian instead of using the `t()` translation function:
- "Promeni status"
- "Plaćanje"
- "Metod:"
- "Status:"
- "Nema istorije statusa"

**Location:** `src/app/admin/orders/page.tsx`, lines ~640-690

### Status Dropdown Event Propagation
The status dropdown in the table row can conflict with the row's click-to-expand behavior. While `stopPropagation()` is used, the custom dropdown may not close consistently.

### Missing Quantity Upper Bounds
No maximum quantity validation — a user could order 999,999 of an item. Only stock check prevents this, but if stock is high, the order would succeed.

**Location:** `src/lib/validations/order.ts`

### Weak Address Validation
Postal code only checks `min(1)` — no format validation for Serbian postal codes (should be 5 digits like "11000").

### Shipping Method Not Validated
Shipping method is an optional string with no enum validation — could receive arbitrary values.

### No Order Cancellation by Customer
Customers have no way to cancel their own orders. Only admins can change status.

---

## Security Assessment

**Strong points:**
- Prisma ORM prevents SQL injection
- Server-side price recalculation prevents price manipulation
- Transaction-based stock management prevents overselling
- Admin-only status update endpoints
- Rate limiting on order creation

**Concerns:**
- Shipping/billing addresses stored as unencrypted JSON (PII exposure risk)
- Rate limiting uses in-memory store (bypassed in multi-server deployment)
- No CSRF tokens (partial mitigation via Next.js App Router)
- `OrderStatusHistory.changedBy` can be null — no distinction between admin and system actions
- No webhook signature verification for future payment processor integration

---

## Data Model Notes

The Order schema is well-structured with proper relations:

```
Order → OrderItem[] (immutable product snapshots)
Order → OrderStatusHistory[] (full audit trail)
Order → User (required — blocks guest orders)
Order → PromoCode? (optional, but never populated)
```

**Missing fields for production:**
- `paymentGatewayTransactionId` — to link to Stripe/PayPal transaction
- `guestEmail` / `guestName` / `guestPhone` — if guest checkout is needed
- `cancelledReason` — to store why an order was cancelled
- `estimatedDeliveryDate` — for customer communication

---

## Admin Page Feature Completeness

| Feature | Status |
|---------|--------|
| View all orders | ✅ Working |
| Search by order #, name, email | ✅ Working |
| Filter by status | ✅ Working |
| Filter by date range | ❌ Missing |
| Filter by payment status | ❌ Missing |
| Expand order details | ✅ Working |
| View items, customer, timeline | ✅ Working |
| Change order status | ✅ Working |
| Status action buttons in detail | ✅ Working |
| Export orders | ❌ Button exists, not functional |
| Bulk actions | ❌ Missing |
| Refund management | ❌ Missing |
| Print order | ❌ Missing |
| Add notes to status change | ❌ UI missing (API supports it) |

---

## Recommendations

### Must Fix Before Launch
1. **Send order confirmation email** after order creation
2. **Decide on guest checkout** — implement properly or remove the UI
3. **Integrate payment processor** for card payments
4. **Implement promo code logic** or remove the input field
5. **Wire up or remove the export button**

### Should Fix Soon After Launch
1. Add email notification to customer when status changes
2. Add admin notification (email or in-app) for new orders
3. Restore stock when order is cancelled
4. Add note input when admin changes status (API already supports `note` field)
5. Use translation system for hardcoded Serbian strings in admin

### Nice to Have
1. Date range and payment status filters
2. CSV export with date filtering
3. Customer self-service cancellation (for "novi" status only)
4. Order tracking page accessible by order number + email
5. Duplicate submission prevention (idempotency key)
