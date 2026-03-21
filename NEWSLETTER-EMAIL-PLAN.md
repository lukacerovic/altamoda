# Newsletter & Email Notifications — Implementation Plan

## Overview

This document breaks down the full implementation of email sending, newsletter campaigns, automations, and transactional email notifications for Alta Moda.

### What Already Exists (Done)
- Newsletter subscriber database table (`newsletter_subscribers`)
- Public APIs: subscribe (POST), unsubscribe (DELETE)
- Admin APIs: list subscribers, stats, delete
- Admin panel with 3 tabs (Subscribers=real data, Campaigns/Automations=mock data)
- Homepage newsletter form + popup modal
- Zod validation schemas

### What Needs to Be Built
- Resend email service integration
- 4 email templates (React Email components)
- 4 transactional email triggers wired into existing API routes
- Campaign persistence (database) + actual sending
- Automation persistence (database) + trigger logic
- Newsletter campaign compose & send from admin

---

## Email Setup Strategy (Dev → Production)

### Development
- **Service:** Resend free tier (100 emails/day, 3,000/month)
- **From address:** `onboarding@resend.dev` (Resend's test sender) or your personal verified email
- **API key:** Test key from Resend dashboard

### Production
- **From address:** `narudzbine@altamoda.rs` (or `info@altamoda.rs`)
- **DNS setup required:** Add DKIM + SPF records to altamoda.rs domain
- **API key:** Live key from Resend dashboard

### Transition = 2 Environment Variables
```env
# .env.local (development)
RESEND_API_KEY=re_test_xxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev

# Production (Vercel/hosting env vars)
RESEND_API_KEY=re_live_xxxxxxxxxxxx
EMAIL_FROM=narudzbine@altamoda.rs
```

**Zero code changes needed.** All email functions read from `process.env`. Switch is instant.

---

## Phase Breakdown

### PHASE A: Email Infrastructure (Foundation)
> Estimated scope: Core setup that everything else depends on

#### A1. Install Dependencies
```bash
npm install resend @react-email/components
```

#### A2. Create Email Service Module
**New file:** `src/lib/email/send.ts`

```
Purpose: Resend client singleton + reusable send functions
- initResend() — creates client from RESEND_API_KEY
- sendEmail({ to, subject, template }) — generic send wrapper
- Graceful fallback: if RESEND_API_KEY missing, log to console instead of crashing
```

**Why this matters:** Every email feature depends on this module. The console fallback means the app won't break if email isn't configured yet.

#### A3. Create Base Email Layout
**New file:** `src/lib/email/templates/layout.tsx`

```
Purpose: Shared wrapper for all email templates
- Alta Moda logo header
- Brand colors (#735b28 accent, #2d2d2d text, #f3f3f3 background)
- Footer with unsubscribe link, company info, social links
- Responsive design (works in Gmail, Outlook, Apple Mail)
```

#### A4. Environment Variables
Add to `.env` and `.env.example`:
```env
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
SITE_URL=http://localhost:3000
```

---

### PHASE B: Transactional Emails (4 Templates + Triggers)
> Estimated scope: The core emails users receive when they interact with the app

#### B1. Welcome Email (on registration)
**New file:** `src/lib/email/templates/welcome.tsx`

| Field | Detail |
|-------|--------|
| **Trigger** | `POST /api/users` — after successful user creation |
| **To** | Newly registered user's email |
| **Subject** | "Dobrodošli u Alta Moda!" |
| **Content** | Welcome message, account type (B2C/B2B), link to products, CTA button |
| **B2B variant** | Additional note: "Vaš nalog je u procesu odobravanja" (pending approval) |

**File to modify:** `src/app/api/users/route.ts`
- Add `sendWelcomeEmail()` call after `prisma.user.create()`
- Must be non-blocking (don't await — use fire-and-forget so registration isn't slow)

#### B2. B2B Approval Email
**New file:** `src/lib/email/templates/b2b-approval.tsx`

| Field | Detail |
|-------|--------|
| **Trigger** | Admin approves B2B user (status: pending → active) |
| **To** | B2B user's email |
| **Subject** | "Vaš B2B nalog je odobren — Alta Moda" |
| **Content** | Approval confirmation, B2B pricing access, quick order link, discount tier info |

**File to create:** `src/app/api/users/[id]/approve/route.ts`
- New PATCH endpoint for admin to approve B2B users
- Updates user status from `pending` to `active`
- Sends approval email

**File to modify:** `src/app/admin/users/page.tsx`
- Wire "Approve" button to call the new endpoint

#### B3. Order Confirmation Email
**New file:** `src/lib/email/templates/order-confirmation.tsx`

| Field | Detail |
|-------|--------|
| **Trigger** | `POST /api/orders` — after successful order creation |
| **To** | User who placed the order |
| **Subject** | "Porudžbina #{orderNumber} je primljena" |
| **Content** | Order number, item list (name, qty, price), subtotal, shipping cost, total, shipping address, payment method, estimated delivery |

**File to modify:** `src/app/api/orders/route.ts`
- Add `sendOrderConfirmation()` after `prisma.$transaction()` succeeds
- Fire-and-forget (order creation must not fail if email fails)

#### B4. Shipping Notification Email
**New file:** `src/lib/email/templates/shipping-notification.tsx`

| Field | Detail |
|-------|--------|
| **Trigger** | `PATCH /api/orders/[id]/status` — when status changes to `isporuceno` |
| **To** | User who placed the order |
| **Subject** | "Vaša porudžbina #{orderNumber} je poslata!" |
| **Content** | Order number, tracking number (if available), shipping method, estimated delivery, tracking link |

**File to modify:** `src/app/api/orders/[id]/status/route.ts`
- Add `sendShippingNotification()` when new status is `isporuceno`

---

### PHASE C: Database Schema Updates (Campaigns + Automations)
> Estimated scope: Persist what's currently only in local state

#### C1. Add Campaign Model
**File to modify:** `prisma/schema.prisma`

```prisma
model Campaign {
  id          String    @id @default(cuid())
  title       String
  subject     String    // email subject line
  segment     NewsletterSegment @default(b2c)
  contentHtml String    @db.Text  // HTML email body
  status      CampaignStatus @default(draft)
  sentAt      DateTime?
  sentCount   Int       @default(0)
  openRate    Float?
  clickRate   Float?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("campaigns")
}

enum CampaignStatus {
  draft
  scheduled
  sending
  sent
  failed
}
```

#### C2. Add Automation Model
```prisma
model Automation {
  id            String    @id @default(cuid())
  name          String
  description   String?
  type          AutomationType
  segment       NewsletterSegment @default(b2c)
  enabled       Boolean   @default(false)
  templateHtml  String?   @db.Text
  lastTriggered DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("automations")
}

enum AutomationType {
  welcome          // new subscriber signup
  first_purchase   // first order placed
  order_shipped    // order shipped notification
  abandoned_cart   // cart inactive > 24h (future)
  birthday         // user birthday (future)
}
```

#### C3. Run Migration
```bash
npx prisma migrate dev --name add-campaigns-and-automations
```

#### C4. Seed Default Automations
Update `prisma/seed.ts` to create the 5 default automation records that currently exist as mock data in the admin panel.

---

### PHASE D: Campaign API Routes + Admin Wiring
> Estimated scope: Replace mock campaign data with real CRUD + send

#### D1. Campaign CRUD API
**New file:** `src/app/api/campaigns/route.ts`

| Method | Purpose |
|--------|---------|
| `GET` | List campaigns with pagination, filter by status |
| `POST` | Create new campaign (draft) |

**New file:** `src/app/api/campaigns/[id]/route.ts`

| Method | Purpose |
|--------|---------|
| `GET` | Get single campaign with full content |
| `PUT` | Update campaign (title, content, segment) |
| `DELETE` | Delete campaign (only if draft) |

#### D2. Campaign Send API
**New file:** `src/app/api/campaigns/[id]/send/route.ts`

| Method | Purpose |
|--------|---------|
| `POST` | Send campaign to all subscribers matching the segment |

Logic:
1. Fetch campaign by ID (must be `draft` or `scheduled` status)
2. Update status to `sending`
3. Fetch all active subscribers for the segment
4. Send emails in batches (Resend supports batch sending, max 100/call)
5. Update status to `sent`, set `sentAt` and `sentCount`
6. Return result

**Batch sending approach:**
```
- Fetch subscribers: SELECT * FROM newsletter_subscribers WHERE is_subscribed=true AND segment=?
- Chunk into groups of 50
- For each chunk: resend.batch.send(emails)
- Track success/failure count
```

#### D3. Campaign Validation Schema
**New file:** `src/lib/validations/campaign.ts`

```
- createCampaignSchema: title (min 1), subject (min 1), segment, contentHtml
- updateCampaignSchema: partial of create
```

#### D4. Wire Admin Panel
**File to modify:** `src/app/admin/newsletter/page.tsx`

- Replace hardcoded `campaigns` state with API calls to `/api/campaigns`
- "Nova kampanja" modal → POST /api/campaigns
- Edit → PUT /api/campaigns/[id]
- Delete → DELETE /api/campaigns/[id]
- Add "Pošalji" (Send) button → POST /api/campaigns/[id]/send
- Show real sentCount, openRate, clickRate from DB

---

### PHASE E: Automation API + Wiring
> Estimated scope: Persist automation toggles + implement welcome email automation

#### E1. Automation CRUD API
**New file:** `src/app/api/automations/route.ts`

| Method | Purpose |
|--------|---------|
| `GET` | List all automations |
| `PATCH` | Toggle automation on/off |

#### E2. Wire Admin Panel
**File to modify:** `src/app/admin/newsletter/page.tsx`

- Replace hardcoded `automations` state with API calls
- Toggle switches → PATCH /api/automations (update `enabled` field)
- Show `lastTriggered` from DB

#### E3. Implement Welcome Email Automation
**File to modify:** `src/app/api/newsletter/route.ts` (subscribe handler)

- After successful subscription, check if "welcome" automation is enabled
- If yes → send welcome newsletter email using the automation's template
- Update `lastTriggered` timestamp

#### E4. Implement First Purchase Automation (Optional)
**File to modify:** `src/app/api/orders/route.ts`

- After order creation, check if this is the user's first order
- If yes AND "first_purchase" automation is enabled → send promo code email
- This is lower priority and can be deferred

---

### PHASE F: Email Preview & Testing
> Estimated scope: Developer experience for building/testing templates

#### F1. Email Preview Route (Dev Only)
**New file:** `src/app/api/email-preview/[template]/route.ts`

- Renders email templates with sample data for visual testing
- Only available in `NODE_ENV=development`
- Accessible at: `http://localhost:3000/api/email-preview/order-confirmation`

#### F2. Test Coverage
**New file:** `tests/unit/lib/email-send.test.ts`
- Test email service initialization
- Test template rendering
- Test graceful fallback when RESEND_API_KEY is missing

**New file:** `tests/unit/validations/campaign.test.ts`
- Test campaign validation schemas

---

## File Summary

### New Files to Create (16 files)
```
src/lib/email/
├── send.ts                                    # Resend client + send functions
└── templates/
    ├── layout.tsx                             # Shared email layout
    ├── welcome.tsx                            # Welcome email
    ├── b2b-approval.tsx                       # B2B approval email
    ├── order-confirmation.tsx                 # Order confirmation
    └── shipping-notification.tsx              # Shipping notification

src/app/api/
├── campaigns/
│   ├── route.ts                              # GET list, POST create
│   └── [id]/
│       ├── route.ts                          # GET, PUT, DELETE
│       └── send/route.ts                     # POST send campaign
├── automations/route.ts                      # GET list, PATCH toggle
├── users/[id]/approve/route.ts               # PATCH approve B2B user
└── email-preview/[template]/route.ts         # Dev-only template preview

src/lib/validations/campaign.ts               # Campaign Zod schemas

tests/unit/lib/email-send.test.ts             # Email service tests
tests/unit/validations/campaign.test.ts       # Campaign validation tests
```

### Existing Files to Modify (7 files)
```
prisma/schema.prisma                          # Add Campaign, Automation models
prisma/seed.ts                                # Seed default automations
src/app/api/users/route.ts                    # Add welcome email trigger
src/app/api/orders/route.ts                   # Add order confirmation trigger
src/app/api/orders/[id]/status/route.ts       # Add shipping notification trigger
src/app/api/newsletter/route.ts               # Add welcome automation trigger
src/app/admin/newsletter/page.tsx             # Wire campaigns + automations to API
```

### Dependencies to Install
```bash
npm install resend @react-email/components
```

### Environment Variables to Add
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
SITE_URL=http://localhost:3000
```

---

## Implementation Order

```
Phase A: Email Infrastructure          ← START HERE (everything depends on this)
  ↓
Phase B: Transactional Emails          ← Highest user-facing value
  ↓
Phase C: Database Schema Updates       ← Needed before D and E
  ↓
Phase D: Campaign CRUD + Sending       ← Admin can send real newsletters
  ↓
Phase E: Automation Persistence        ← Admin toggles persist + welcome auto
  ↓
Phase F: Preview & Testing             ← Developer QoL
```

Each phase is independently deployable. You can ship Phase A+B and already have working transactional emails while building out campaigns later.

---

## Questions to Decide Before Starting

1. **Resend account setup** — Have you created a Resend account yet? (Free tier is fine for dev)
2. **Email "from" name** — What should appear as sender name? e.g., "Alta Moda" or "Alta Moda Narudžbine"
3. **Campaign editor** — Do you want a rich text editor (e.g., TipTap) for composing campaigns, or is a simple textarea with HTML fine for now?
4. **Email language** — All emails in Serbian (Latin script) only, or should they respect the user's language preference?
5. **Unsubscribe handling** — Should transactional emails (order confirmation, shipping) still be sent to unsubscribed users? (Standard practice: yes, because they're not marketing)
6. **Rate limiting** — Resend free tier allows 100 emails/day. Is this enough for your dev/testing phase, or do you expect to need more?
