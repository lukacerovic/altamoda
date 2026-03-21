# Newsletter Feature — Technical Documentation

## Overview

The Newsletter feature allows visitors to subscribe to the Alta Moda newsletter from multiple entry points on the website, and provides admin tools for managing subscribers and campaigns. Subscribers are stored in the `newsletter_subscribers` PostgreSQL table via Prisma.

---

## Architecture

### Database Model

```
NewsletterSubscriber {
  id             String            @id (cuid)
  email          String            @unique
  segment        NewsletterSegment (b2b | b2c, default: b2c)
  isSubscribed   Boolean           (default: true)
  subscribedAt   DateTime          (default: now)
  unsubscribedAt DateTime?
}
```

### Files

| File | Purpose |
|------|---------|
| `src/lib/validations/newsletter.ts` | Zod validation schemas |
| `src/app/api/newsletter/route.ts` | Subscribe (POST), Unsubscribe (DELETE), List (GET) |
| `src/app/api/newsletter/stats/route.ts` | Subscriber statistics (GET) |
| `src/app/api/newsletter/[id]/route.ts` | Delete subscriber by ID (DELETE) |
| `src/app/admin/newsletter/page.tsx` | Admin panel — 3 tabs |
| `src/app/HomePageClient.tsx` | Homepage newsletter section + popup modal |
| `src/components/Footer.tsx` | Footer newsletter form |

---

## Public API (No Authentication Required)

### POST /api/newsletter — Subscribe

**Request body:**
```json
{
  "email": "user@example.com",
  "segment": "b2c"          // optional, defaults to "b2c"
}
```

**Behavior:**
1. Validates email format via Zod
2. If email already exists and is subscribed → returns `409` with "Već ste prijavljeni na newsletter"
3. If email exists but was unsubscribed → re-subscribes: sets `isSubscribed: true`, resets `subscribedAt`, clears `unsubscribedAt`
4. If email is new → creates a new subscriber record
5. Returns `201` on success

### DELETE /api/newsletter — Unsubscribe

**Request body:**
```json
{
  "email": "user@example.com"
}
```

**Behavior:**
1. Finds subscriber by email
2. If not found or already unsubscribed → returns `404`
3. Sets `isSubscribed: false` and `unsubscribedAt: now()`
4. Returns `200` on success

---

## Admin API (Requires Admin Authentication)

All admin endpoints call `requireAdmin()` which checks the session for `role: "admin"`.

### GET /api/newsletter — List Subscribers

**Query parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | `""` | Filters by email (case-insensitive contains) |
| `segment` | `all` / `b2b` / `b2c` | `all` | Filters by segment |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |

**Response:**
```json
{
  "success": true,
  "data": {
    "subscribers": [...],
    "total": 6,
    "page": 1,
    "limit": 20
  }
}
```

### GET /api/newsletter/stats — Subscriber Statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalActive": 5,
    "b2bCount": 2,
    "b2cCount": 3
  }
}
```

All three counts only include subscribers where `isSubscribed: true`.

### DELETE /api/newsletter/[id] — Delete Subscriber

Permanently removes a subscriber record from the database. Returns `404` if the ID doesn't exist.

---

## Frontend Entry Points

There are **3 places** where visitors can subscribe:

### 1. Homepage Newsletter Section

Located below the Instagram feed section. A centered form with email input and submit button. On successful subscription, a green success message appears below the form. On error (e.g., already subscribed), a red error message is shown.

### 2. Homepage Popup Modal

Triggered by clicking the floating mail button (bottom-right corner). Contains an email input and submit button inside a modal overlay. On successful subscription, the success message replaces the form, and the popup automatically closes after 1.5 seconds.

### 3. Footer Newsletter Form

Located in the site footer, between the 4-column link grid and the copyright bar. Dark-themed to match the footer (`bg-white/10` input, `bg-[#8c4a5a]` button). Shows inline success/error messages.

All three entry points call `POST /api/newsletter` with the entered email and `segment: "b2c"` (default).

---

## Admin Panel — /admin/newsletter

The admin newsletter page has 3 tabs:

### Subscribers Tab (Wired to Real Data)

- **Stats cards**: Shows total active, B2B count, and B2C count — fetched from `/api/newsletter/stats`
- **Search**: Debounced (300ms) text search filtering by email
- **Segment filter**: Dropdown with "Svi segmenti" (all), "B2B", "B2C"
- **Subscriber table**: Shows email, segment badge, subscription date, status, and a delete action button
- **Pagination**: Prev/Next buttons with page counter, 20 items per page
- **Export**: "Izvezi pretplatnike" button fetches all subscribers and generates a CSV file download (`pretplatnici.csv`) containing email, segment, status, subscription date, and unsubscription date

### Campaigns Tab (Local State — Mock Data)

Campaigns are managed in **client-side state only** (not persisted to a database). This is intentional — full campaign functionality requires Resend email integration planned for Phase 7.

Current capabilities:
- **Create**: "Nova kampanja" button opens a modal where you set title, segment, and content type. The new campaign is added to the list with "Nacrt" (draft) status
- **Edit**: Pencil icon opens the same modal pre-filled with the campaign's data. You can modify the title and segment
- **Delete**: Trash icon removes the campaign from the list
- Pre-populated with 4 sample campaigns (2 sent with open/click rates, 1 scheduled, 1 draft)

**Note**: Created/edited campaigns are lost on page refresh since there is no backend persistence yet.

### Automations Tab (Local State — Mock Data)

Shows 5 pre-configured automation rules with toggle switches to enable/disable them. Fully client-side. Toggle state is lost on refresh.

---

## Validation Schemas

Defined in `src/lib/validations/newsletter.ts` using Zod:

| Schema | Used By | Fields |
|--------|---------|--------|
| `subscribeSchema` | POST /api/newsletter | `email` (required, valid email), `segment` (optional, b2b/b2c, default b2c) |
| `unsubscribeSchema` | DELETE /api/newsletter | `email` (required, valid email) |
| `newsletterFilterSchema` | GET /api/newsletter | `search` (optional), `segment` (all/b2b/b2c, default all), merged with `paginationSchema` (page, limit) |

---

## Phase 7 Integration Notes

When Resend email service is integrated in Phase 7, the following will need to change:

1. **Campaigns table** added to Prisma schema with fields like title, segment, content, status, sentDate, openRate, clickRate
2. **Campaign API routes** created for CRUD + send operations
3. **Automations table** added for persistent toggle state and trigger configuration
4. **Send endpoint** that uses Resend API to actually deliver emails to subscribers matching the campaign's segment
5. **Webhook handler** from Resend for tracking opens/clicks and updating campaign stats
6. **Welcome email** automation for new subscribers
