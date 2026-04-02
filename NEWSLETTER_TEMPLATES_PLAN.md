# Newsletter System — Current State & Next Steps

## Current Architecture (Implemented)

### Overview
The newsletter system is built around **3 editable email templates** that admins can customize and send directly to subscribers. There are no separate "campaigns" in the UI — the admin edits a template, picks an audience, and sends.

Behind the scenes, a campaign record is created in the DB for tracking (sent count, open/click rates).

### Flow
```
Admin opens template → Edits content in TipTap → Picks audience → Sends
                                                                    ↓
                                              Campaign record created + emails sent via Resend
```

---

## What's Built

### Templates
| Component | File | Status |
|-----------|------|--------|
| 3 default templates (Akcije, Novo, Info) | `src/lib/default-newsletter-templates.ts` | Done |
| Template DB model (NewsletterTemplate) | `prisma/schema.prisma` | Done |
| Template CRUD API | `src/app/api/newsletter/templates/` | Done |
| Template seed endpoint | `src/app/api/newsletter/templates/seed/route.ts` | Done |
| Template duplicate endpoint | `src/app/api/newsletter/templates/[id]/duplicate/route.ts` | Done |
| Auto-seed on first load | Newsletter page useEffect | Done |

### Editor
| Component | File | Status |
|-----------|------|--------|
| TipTap WYSIWYG editor | `src/components/admin/TiptapEditor.tsx` | Done |
| Image upload (drag & drop + button) | Uses existing `/api/upload` endpoint | Done |
| Resizable images with NodeView | TiptapEditor — corner handles + edge bar | Done |
| Image alignment (left/center/right) | TiptapEditor — floating toolbar | Done |
| Live email preview (responsive) | `src/lib/email-preview.ts` | Done |
| Header/footer customization | Newsletter page — collapsible settings | Done |
| Email body → inline styles conversion | `email-preview.ts` — `convertToEmailHtml()` | Done |
| Responsive email wrapper | `email-preview.ts` — `wrapInEmailTemplate()` | Done |
| CTA button rendering (bold links) | `email-preview.ts` — auto-converts `**[text](url)**` to buttons | Done |

### Sending
| Component | File | Status |
|-----------|------|--------|
| Send from template editor | Newsletter page — subject, segment picker, send button | Done |
| Audience selector (All/B2C/B2B) | Newsletter page — dropdown with subscriber count | Done |
| Send confirmation modal | Newsletter page | Done |
| Campaign creation on send | `handleSendFromTemplate()` — creates campaign + sends | Done |
| Batch email sending via Resend | `src/lib/email.ts` — `sendBatchEmails()` | Done |
| Campaign send API | `src/app/api/newsletter/campaigns/[id]/send/route.ts` | Done |

### Subscribers
| Component | File | Status |
|-----------|------|--------|
| Subscriber DB model | `prisma/schema.prisma` | Done |
| Subscriber CRUD API | `src/app/api/newsletter/` | Done |
| Admin subscriber list with search/filter | Newsletter page — Subscribers tab | Done |
| CSV export | Newsletter page — export button | Done |
| Segment stats (total, B2B, B2C counts) | `src/app/api/newsletter/stats/` | Done |
| Public subscribe/unsubscribe API | `src/app/api/newsletter/` | Done |
| Unsubscribe link in emails | `src/lib/email-templates.ts` | Done |

### Email Infrastructure
| Component | File | Status |
|-----------|------|--------|
| Resend integration | `src/lib/email.ts` | Done |
| Email service (send + batch send) | `src/lib/email.ts` | Done |
| Server-side email templates | `src/lib/email-templates.ts` — baseLayout, campaignTemplate, welcomeTemplate | Done |
| Client-side preview generator | `src/lib/email-preview.ts` | Done |
| Test email endpoint | `src/app/api/newsletter/test/route.ts` | Done |

---

## File Map

```
src/
├── app/admin/newsletter/page.tsx          # Main admin page (templates + subscribers)
├── app/api/newsletter/
│   ├── route.ts                           # Subscriber CRUD
│   ├── stats/route.ts                     # Subscriber stats
│   ├── test/route.ts                      # Send test email
│   ├── templates/
│   │   ├── route.ts                       # Template list + create
│   │   ├── seed/route.ts                  # Auto-seed defaults
│   │   └── [id]/
│   │       ├── route.ts                   # Template get/update/delete
│   │       └── duplicate/route.ts         # Duplicate template
│   └── campaigns/
│       ├── route.ts                       # Campaign list + create
│       └── [id]/
│           ├── route.ts                   # Campaign get/update/delete
│           ├── send/route.ts              # Send campaign
│           └── preview/route.ts           # Preview campaign HTML
├── components/admin/TiptapEditor.tsx       # WYSIWYG editor with image resize
├── lib/
│   ├── email.ts                           # Resend client, sendEmail, sendBatchEmails
│   ├── email-templates.ts                 # Server-side email wrappers
│   ├── email-preview.ts                   # Client-side preview generator
│   ├── default-newsletter-templates.ts    # 3 default template body content
│   └── upload.ts                          # File upload utility
```

---

## What Needs to Be Done Next

### Priority 1: Production Email Setup
**What:** Configure Resend with the real domain so emails actually deliver.

**Steps:**
1. Create Resend account at resend.com (free tier: 100 emails/day)
2. Add domain `altamoda.rs` in Resend dashboard
3. Add DNS records (DKIM + SPF) to the domain registrar
4. Set production environment variables:
   ```env
   RESEND_API_KEY=re_live_xxxxxxxxxxxx
   EMAIL_FROM=info@altamoda.rs
   ```
5. Send a test email from the admin panel to verify

**No code changes needed** — the system reads from env vars.

### Priority 2: Align Server-Side Email Template with Preview
**What:** The admin preview uses the new clean design (`email-preview.ts`), but actual sent emails use the older design in `email-templates.ts` (`campaignTemplate()`). These should match.

**Steps:**
1. Update `campaignTemplate()` in `src/lib/email-templates.ts` to match the design from `email-preview.ts` (warm neutrals, clean typography, responsive media queries)
2. Or refactor so both preview and send share the same wrapper function
3. Test by sending to yourself and comparing with the admin preview

### Priority 3: Transactional Emails
**What:** Automated emails triggered by user actions (not manually sent newsletters).

| Email | Trigger | Priority |
|-------|---------|----------|
| Welcome email | New subscriber signs up | High |
| Order confirmation | Order placed | High |
| B2B approval | Admin approves B2B account | Medium |
| Shipping notification | Order status → shipped | Medium |

**Steps for each:**
1. Create email template function in `src/lib/email-templates.ts`
2. Add `sendEmail()` call in the relevant API route (fire-and-forget, non-blocking)
3. Test with real email address

### Priority 4: Open/Click Tracking
**What:** Track how many recipients open the email and click links.

**Steps:**
1. Set up Resend webhooks for `email.opened` and `email.clicked` events
2. Create webhook endpoint: `src/app/api/webhooks/resend/route.ts`
3. On webhook receive, update the campaign's `openCount` / `clickCount` in DB
4. Display stats in the admin UI (add a "Poslato" section with metrics)

### Priority 5: Template Images
**What:** The current templates have placeholder text only. Add default images.

**Steps:**
1. Upload brand/product images to the public uploads folder or a CDN
2. Update default template content to include `<img>` tags with real product photos
3. The admin can replace these images in the TipTap editor

### Priority 6: Scheduled Sending
**What:** Allow admin to schedule newsletters for future delivery.

**Steps:**
1. Add a date/time picker in the send section of the template editor
2. Instead of sending immediately, create the campaign with `status: scheduled` and `scheduledAt` timestamp
3. Create a cron job or scheduled function that checks for due campaigns and sends them
4. Options: Vercel Cron, or a simple API route called by an external scheduler

---

## Environment Variables

```env
# Required for email sending
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev   # Dev: Resend test sender / Prod: info@altamoda.rs

# Required for unsubscribe links
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Prod: https://altamoda.rs

# Already configured
DATABASE_URL=postgresql://...
```

---

## Design Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| Editor | TipTap | Active maintenance, React native, extensible, free |
| Image upload | Existing `/api/upload` | Reuse infrastructure, saves to `public/uploads/` |
| Template storage | TipTap body HTML in DB | Editable, clean, wrapper added on demand |
| Email rendering | Inline styles + table layout | Only reliable cross-client approach |
| Preview | Client-side generation + iframe | Instant, no server round-trip |
| Color palette | Warm neutrals (#2d2926, #7c6f64) | Unisex beauty industry aesthetic |
| Campaign management | Hidden from admin | Campaigns created behind the scenes on send, for tracking only |
| Audience targeting | All / B2C / B2B segments | Simple dropdown, shows live subscriber count |
