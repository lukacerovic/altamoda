# Phase 4: Payment, Shipping & Email — Implementation Plan

## What Phase 4 Covers

From `TODO.md` (REQ 12: card payment, REQ 15: delivery + emails):
- Serbian PSP integration for card payments
- D Express shipping integration (shipment creation, tracking, rate calculation)
- Email notifications via Resend (order confirmation, shipping, welcome, B2B approval)
- B2B invoice PDF generation

---

## 1. Payment Service Provider (PSP) — Recommendation

### Options Evaluated

| Provider | DinaCard | Visa/MC | Apple Pay | Google Pay | API Quality | Serbian Market |
|----------|----------|---------|-----------|------------|-------------|----------------|
| **Monri** | ✅ | ✅ | ✅ | ✅ | Excellent (REST + Components SDK) | ✅ Active in Serbia (monri.rs) |
| PaySpot | ❓ | ✅ | ✅ | ✅ | Undocumented publicly | ✅ Licensed in Serbia |
| ChipCard | ✅ | ✅ | ❓ (referenced in images) | ✅ | Undocumented publicly | ✅ Largest processor in Serbia |
| AllPay | ❓ | ❓ | ❓ | ❓ | Website unreachable | ❓ |

### Recommendation: **Monri (monri.rs)**

**Why Monri:**

1. **All required card brands**: Visa, Mastercard, DinaCard (through Serbian acquiring banks), American Express
2. **Apple Pay + Google Pay**: Built-in support through their Components SDK — no separate integration needed
3. **Best developer experience**: Full REST API documentation, JavaScript SDK ("Monri Components"), code examples, test environment
4. **3D Secure 2.0**: Handled automatically by the SDK — no manual 3DS implementation
5. **Lowest integration effort**: Drop-in UI components (similar to Stripe Elements), or redirect/lightbox options
6. **Serbian localization**: SDK supports `locale: 'sr'`
7. **PCI DSS compliant**: Monri handles all card data — we never touch raw card numbers
8. **Regional presence**: Serves Serbia, Croatia, Bosnia, Slovenia, North Macedonia, Romania — proven at scale with 25+ banking partners

**Fee structure**: Monri's fees are negotiated per merchant (typical range for Serbian e-commerce: 1.5–2.5% per transaction for domestic cards, higher for international). Exact rates require a merchant agreement. DinaCard typically has lower interchange fees (~1.0–1.5%) compared to Visa/MC.

### How Monri Works (Integration Flow)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Our Server  │────▶│  Monri API   │────▶│  Bank / 3DS  │
│  (Next.js)   │◀────│  /v2/payment │◀────│  Processing  │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│  Our Client  │  ← Monri Components JS SDK
│  (React)     │    (renders card form, handles 3DS)
└──────────────┘
```

**Step-by-step:**

1. **Server** creates a payment session: `POST /v2/payment/new` with amount (in minor units, e.g., 102400 = 1,024.00 RSD), order_number, currency ("RSD")
2. **Server** receives `client_secret` from Monri
3. **Client** initializes Monri Components with the `client_secret`
4. **Client** renders secure card input form (Monri iframe — we never see card data)
5. **User** fills in card details, clicks "Pay"
6. **Monri SDK** handles 3D Secure authentication automatically (redirect + return)
7. **Client** calls `monri.confirmPayment()` → receives approved/declined result
8. **Server** receives webhook callback confirming the payment → updates order `paymentStatus`

**Test environment**: `https://ipgtest.monri.com` (full sandbox for development)
**Production**: `https://ipg.monri.com`

### What We Need From Monri

To start integration, we need to register as a merchant at monri.rs and receive:
- `merchant_key` (server-side secret for signing requests)
- `authenticity_token` (public token for client-side SDK)
- Test credentials for the sandbox environment

---

## 2. D Express Shipping Integration

### How D Express Works

D Express is Serbia's leading courier service with:
- **26 distribution centers** across Serbia
- **65,000+ parcels/day** capacity
- **800 transport vehicles**, 1,300 employees
- **300+ paketomat** (parcel lockers) in 80 cities

**Service types:**
- **Danas za danas** (Same day) — pickup and delivery within the same day
- **Danas za sutra** (Next day) — standard delivery, 1 business day
- **Paketomat** — self-service parcel lockers, 24/7 pickup
- **International** — cross-border delivery
- **COD (Pouzeće)** — cash on delivery, D Express collects payment from recipient and transfers to merchant

### D Express API Integration

D Express does **not** publish a public API documentation portal. Integration works through a **business contract** process:

1. **Sign a business contract** with D Express (contact: 011.331.33.33)
2. They provide access to their **web service (SOAP/REST API)** and credentials
3. The API typically supports:
   - **Shipment creation** — register a new shipment with sender/recipient data, dimensions, weight, COD amount
   - **Label generation** — get PDF shipping label for printing
   - **Tracking** — query shipment status by tracking number
   - **Price calculation** — calculate delivery cost by destination city and weight
   - **Delivery confirmation** — webhooks or polling for delivery status updates

### Implementation Approach

Since D Express's API requires a business contract, we'll build our shipping module with an **abstraction layer** that:

1. **Phase 4a (immediate)**: Uses our existing `shipping_zones` and `shipping_rates` database tables for rate calculation — these already exist in the schema
2. **Phase 4b (after D Express contract)**: Plugs in the real D Express API client behind the same interface

```
┌──────────────────┐
│  Shipping Service │  ← Abstract interface
├──────────────────┤
│  calculateRate()  │  → Uses DB shipping_zones/rates (immediate)
│  createShipment() │  → Calls D Express API (after contract)
│  getTracking()    │  → Calls D Express API (after contract)
│  getLabel()       │  → Calls D Express API (after contract)
└──────────────────┘
```

### Rate Calculation (Database-driven, works immediately)

We already have `ShippingZone` and `ShippingRate` tables in Prisma:

```
ShippingZone: id, name, cities[]
ShippingRate: id, zoneId, method (standard/express), price, freeThreshold, estimatedDays
```

The API endpoint `GET /api/shipping/rates?city=X&weight=Y` will:
1. Find which zone the city belongs to
2. Return available methods with prices
3. Apply free shipping threshold (5,000 RSD from constants)

### D Express Client (prepared for when contract is signed)

```typescript
// src/lib/shipping/dexpress-client.ts
interface DExpressConfig {
  apiUrl: string
  username: string
  password: string
  clientId: string
}

interface ShipmentRequest {
  senderName: string
  senderAddress: string
  senderCity: string
  senderPhone: string
  recipientName: string
  recipientAddress: string
  recipientCity: string
  recipientPostalCode: string
  recipientPhone: string
  weight: number        // grams
  packages: number
  codAmount?: number    // COD amount in RSD (0 if prepaid)
  description: string
  orderNumber: string
}

interface ShipmentResponse {
  trackingNumber: string
  labelUrl: string      // PDF label URL
  estimatedDelivery: string
}
```

---

## 3. Email Notifications (Resend + React Email)

### Why Resend

- **Developer-first**: Simple REST API, official Next.js SDK
- **React Email**: Build email templates as React components (same tech stack)
- **Free tier**: 100 emails/day, 3,000/month — sufficient for development and early production
- **Deliverability**: Built-in DKIM, SPF, bounce handling
- **Webhooks**: Track delivery, opens, bounces

### Email Templates We'll Build

| Email | Trigger | Content |
|-------|---------|---------|
| **Order Confirmation** | Order created (POST /api/orders) | Order number, items, prices, shipping address, payment method |
| **Shipping Notification** | Order status → "isporuceno" (shipped) | Tracking number, D Express tracking link, estimated delivery |
| **Welcome Email** | User registration | Welcome message, account details, how to get started |
| **B2B Approval** | Admin approves B2B user | Approval confirmation, B2B pricing info, quick order link |

### Implementation

```
src/lib/email/
├── send.ts                          ← Resend client + send functions
└── templates/
    ├── order-confirmation.tsx       ← React Email component
    ├── shipping-notification.tsx
    ├── welcome.tsx
    └── b2b-approval.tsx
```

Each template is a React component using `@react-email/components`:

```tsx
// Example: order-confirmation.tsx
import { Html, Head, Body, Container, Text, Section, Row, Column } from '@react-email/components'

export function OrderConfirmationEmail({ orderNumber, items, total, shippingAddress }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <Container>
          <Text>Porudžbina #{orderNumber} je primljena!</Text>
          {/* ... items table, totals, address ... */}
        </Container>
      </Body>
    </Html>
  )
}
```

### Email Triggers (wired into existing API routes)

- `POST /api/orders` → after successful order creation → `sendOrderConfirmation()`
- `PATCH /api/orders/[id]/status` → when status changes to shipped → `sendShippingNotification()`
- `POST /api/users` → after successful registration → `sendWelcomeEmail()`
- `POST /api/users/[id]/approve` → after admin approves B2B → `sendB2bApprovalEmail()`

---

## 4. B2B Invoice PDF Generation

### Approach

Use **`@react-pdf/renderer`** to generate PDF invoices as React components (consistent with our React Email approach).

An invoice contains:
- Company header (Alta Moda d.o.o., PIB, matični broj, address)
- Invoice number (matches order number)
- Date of issue
- B2B customer details (salon name, PIB, matični broj, address)
- Items table (product name, SKU, quantity, unit price, total)
- Subtotal, discount, shipping, total
- Payment instructions (bank account, reference number)
- Payment terms (from B2B profile: e.g., 15/30/45 days)

### API Endpoint

`GET /api/orders/[id]/invoice` — generates and returns PDF (admin or order owner only)

---

## 5. Implementation Steps (Execution Order)

### Step 4.1 — Email System (no external dependencies)
**Files to create:**
- `src/lib/email/send.ts` — Resend client wrapper
- `src/lib/email/templates/order-confirmation.tsx`
- `src/lib/email/templates/shipping-notification.tsx`
- `src/lib/email/templates/welcome.tsx`
- `src/lib/email/templates/b2b-approval.tsx`

**Modify:**
- `src/app/api/orders/route.ts` — trigger order confirmation email after order creation
- `src/app/api/orders/[id]/status/route.ts` — trigger shipping email when status → shipped
- `src/app/api/users/route.ts` — trigger welcome email after registration

**Dependencies:** `npm install resend @react-email/components`

### Step 4.2 — Shipping Rate API (uses existing DB tables)
**Files to create:**
- `src/lib/shipping/rate-calculator.ts` — calculate rates from DB zones/rates
- `src/app/api/shipping/rates/route.ts` — GET endpoint
- `src/app/api/shipping/track/route.ts` — tracking proxy (stub for now)
- `src/lib/shipping/dexpress-client.ts` — D Express API client (stub, ready for contract)

**Modify:**
- `src/app/checkout/CheckoutClient.tsx` — fetch real shipping rates from API instead of hardcoded values

### Step 4.3 — Payment Integration (Monri)
**Files to create:**
- `src/lib/payment/monri-client.ts` — server-side Monri API client
- `src/app/api/payment/initiate/route.ts` — create payment session
- `src/app/api/payment/callback/route.ts` — webhook handler
- `src/lib/validations/payment.ts` — payment schemas

**Modify:**
- `src/app/checkout/CheckoutClient.tsx` — integrate Monri Components SDK for card payment step
- `src/app/api/orders/route.ts` — link payment to order

**Dependencies:** Monri Components JS SDK (loaded via script tag)

**Environment variables needed:**
```
MONRI_MERCHANT_KEY=xxx          # Server-side secret
MONRI_AUTHENTICITY_TOKEN=xxx    # Client-side public token
MONRI_API_URL=https://ipgtest.monri.com  # Test env (switch to ipg.monri.com for prod)
```

### Step 4.4 — B2B Invoice PDF
**Files to create:**
- `src/lib/invoice/generate.ts` — PDF generation using @react-pdf/renderer
- `src/app/api/orders/[id]/invoice/route.ts` — GET endpoint returns PDF

**Dependencies:** `npm install @react-pdf/renderer`

### Step 4.5 — Wire & Test
- Update checkout flow to use real shipping rates
- Test full payment flow in Monri sandbox
- Test email delivery
- Test invoice PDF generation
- Write tests for payment initiation, shipping calculation, email sending

---

## 6. Environment Variables Required

```env
# Resend (Email)
RESEND_API_KEY=re_xxxx
EMAIL_FROM=narudzbine@altamoda.rs

# Monri (Payment)
MONRI_MERCHANT_KEY=xxxxx
MONRI_AUTHENTICITY_TOKEN=xxxxx
MONRI_API_URL=https://ipgtest.monri.com

# D Express (Shipping) — after business contract
DEXPRESS_API_URL=https://api.dexpress.rs
DEXPRESS_USERNAME=xxx
DEXPRESS_PASSWORD=xxx
DEXPRESS_CLIENT_ID=xxx
```

---

## 7. Database Changes

**No new tables needed.** We use existing fields:
- `Order.paymentStatus` — updated by Monri webhook (pending → paid / failed)
- `Order.trackingNumber` — set when D Express shipment is created
- `Order.shippingMethod` — already stored
- `ShippingZone` + `ShippingRate` — already in schema, need seed data

**Seed data needed:**
- Shipping zones for Serbian cities (Belgrade, Novi Sad, Niš, Kragujevac, etc.)
- Shipping rates per zone (standard: 350 RSD, express: 690 RSD, free threshold: 5000 RSD)

---

## 8. Verification Plan

1. **Payment**: Initiate card payment in Monri sandbox → 3DS flow completes → order.paymentStatus = 'paid'
2. **Shipping rates**: `GET /api/shipping/rates?city=Beograd&weight=500` returns correct rates
3. **Order confirmation email**: Place order → email arrives with order number and items
4. **Shipping email**: Admin changes status to shipped → email arrives with tracking number
5. **B2B invoice**: `GET /api/orders/[id]/invoice` returns valid PDF with company details
6. **Welcome email**: Register new user → welcome email arrives
7. **Apple Pay**: Test on Safari/iOS with Monri Components (requires HTTPS)

---

## 9. What Requires External Setup (Before We Code)

| Item | Action | Who |
|------|--------|-----|
| **Monri merchant account** | Register at monri.rs, get test credentials | Business owner |
| **Resend account** | Sign up at resend.com, verify domain altamoda.rs | Developer |
| **D Express contract** | Call 011.331.33.33, sign business agreement | Business owner |
| **Domain DNS** | Add DKIM/SPF records for altamoda.rs (for Resend) | Developer |

**We can start coding immediately** with:
- Resend (free signup, instant API key)
- Monri test environment (after merchant registration)
- Shipping rates from database (no D Express contract needed yet)
- Invoice PDF (no external dependency)

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Monri registration takes time | Build payment UI with mock/test mode, swap credentials when ready |
| D Express API not available yet | Abstract shipping behind interface, use DB rates immediately |
| Email deliverability issues | Use Resend's built-in DKIM/SPF, monitor bounce rates |
| Apple Pay requires HTTPS | Use Monri's test environment which handles this; production already on HTTPS |
| DinaCard not supported by Monri | Verify during merchant registration; DinaCard is supported through Serbian acquiring banks partnered with Monri |
