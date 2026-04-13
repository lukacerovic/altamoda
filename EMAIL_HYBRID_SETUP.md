# Email System — Hybrid Setup (Resend + cPanel SMTP)

## Goal

Wire `info@altamoda.com` (Adriahost cPanel mailbox) into the project as the sender for **all** outgoing email, while keeping the system **free**, reliable for critical messages, and capable of sending the monthly newsletter to ~1000 subscribers.

---

## Architecture

We use **two providers** depending on the email's importance:

| Channel | Provider | Used for | Why |
|---|---|---|---|
| **Transactional** | Resend (free tier: 100/day, 3 000/mo) | B2B signup → admin alert, B2B approval → user, welcome on newsletter subscribe, password reset (future) | Low volume, critical, **must arrive in inbox**. Resend gives reliable deliverability + delivery logs. |
| **Bulk** | cPanel SMTP via nodemailer | Monthly newsletter campaigns | High volume, less critical. Free, no quota. Mediocre deliverability is acceptable for marketing. |

Both providers send **as** `info@altamoda.com`. Replies always land in the cPanel mailbox — no change to where customers reach the business.

### Tradeoffs we accept

- Some % of newsletter mail will land in spam folders. Acceptable for monthly marketing.
- Newsletter sending is rate-limited (~200/hour) to stay under Adriahost's shared-host cap. A 1 000-subscriber blast will take ~5 hours to drain. The admin clicks "Send" and walks away — the campaign trickles out in the background.
- We do **not** get bounce/open/click tracking on the newsletter side. We do get it for transactional via Resend's dashboard.

---

## Email flows in scope

| # | Flow | Trigger | Recipient | Channel | Status |
|---|---|---|---|---|---|
| 1 | Newsletter welcome | User subscribes via `/api/newsletter` POST | Subscriber | Transactional (Resend) | Already exists, will keep |
| 2 | Newsletter campaign send | Admin clicks Send on a campaign | All segment subscribers | Bulk (cPanel SMTP) | Already exists, will swap provider |
| 3 | **B2B signup → admin alert** | New B2B account created via `/api/users` POST | `ADMIN_EMAIL` (info@altamoda.com) | Transactional (Resend) | **MISSING — to add** |
| 4 | **B2B approved → user notified** | Admin approves via `/api/users/[id]/approve` PATCH | The B2B user | Transactional (Resend) | **MISSING — to add** |

---

## Files that change

### New / modified

| File | Change |
|---|---|
| `src/lib/email.ts` | Refactor: export two functions — `sendTransactional()` (Resend) and `sendBulk()` (nodemailer + cPanel SMTP, throttled). Keep `getUnsubscribeUrl`, `EMAIL_FROM`, `SITE_URL` exports. |
| `src/lib/email-templates.ts` | Add two new templates: `b2bSignupAdminTemplate(user)` and `b2bApprovedUserTemplate(user)`. |
| `src/app/api/users/route.ts` | After `prisma.user.create` for a B2B user, fire `sendTransactional()` to `ADMIN_EMAIL` (non-blocking — wrap in try/catch like the newsletter flow). |
| `src/app/api/users/[id]/approve/route.ts` | After successful approval transaction, fire `sendTransactional()` to the user (non-blocking). |
| `src/app/api/newsletter/campaigns/[id]/send/route.ts` | Replace `sendBatchEmails` import with `sendBulk`. The bulk function handles throttling internally. |
| `src/app/api/newsletter/route.ts` | Replace dynamic `sendEmail` import with `sendTransactional`. |
| `.env.example` | Add: `EMAIL_FROM`, `SITE_URL`, `ADMIN_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`. |
| `package.json` | Install `nodemailer` + `@types/nodemailer`. |

### Untouched

- Templates `welcomeTemplate`, `campaignTemplate`, `promoTemplate` — unchanged.
- Newsletter subscriber DB schema — unchanged.
- Resend domain verification is done **outside** the codebase (in resend.com dashboard + Adriahost DNS).

---

## How `sendBulk` will work (rate limiting)

cPanel shared hosts cap outgoing mail per hour. To stay safely under Adriahost's limit:

- nodemailer transporter configured with `pool: true`, `maxConnections: 3`, `maxMessages: 100`, `rateDelta: 1000`, `rateLimit: 1` (≈ 1 message/sec → ~3 600/hour theoretical, but we'll cap lower).
- Wrapper enforces a hard ceiling of **200 messages/hour** by sleeping between batches.
- Newsletter campaign route returns immediately after marking the campaign as `sending` and **fires the bulk send in the background** (no `await` blocking the HTTP response — we use a non-awaited async IIFE). The DB row's `status` field is the source of truth for "still sending" / "sent" / "failed".
- A 1 000-recipient campaign at 200/hour = 5 hours. Admin sees the status update in the campaign list when polling.

---

## Environment variables (final list)

```env
# Resend (transactional)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="Altamoda <info@altamoda.com>"
SITE_URL=https://altamoda.com
ADMIN_EMAIL=info@altamoda.com

# cPanel SMTP — Adriahost (bulk newsletter)
SMTP_HOST=mail.altamoda.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@altamoda.com
SMTP_PASS=<the mailbox password from cPanel>
```

---

## What we need from you (step by step)

I need **three things** from you before I can finish wiring this up. None of them require code.

### 1. Verify the domain in Resend (so Resend can send as `info@altamoda.com`)

Without this, Resend will only let you send from `onboarding@resend.dev` (the default test address), which looks unprofessional.

**Steps:**
1. Go to https://resend.com and sign up / log in (free).
2. In the dashboard, click **Domains** → **Add Domain**.
3. Enter `altamoda.com` (the apex domain — not `info.altamoda.com`).
4. Resend will show you a list of DNS records to add. There will be ~3–4 of them: an `MX`, a `TXT` for SPF, and a `TXT` for DKIM. **Copy them.**
5. Open Adriahost cPanel → search for **Zone Editor** (or **DNS Zone Manager**).
6. For the `altamoda.com` zone, click **Manage** and add each record exactly as Resend provided. Match record type, name/host, and value precisely.
7. Back in Resend, click **Verify**. It may take 5 min – 2 hours for DNS to propagate.
8. Once the domain shows **Verified**, go to **API Keys** → **Create API Key** → give it a name (e.g. "altamoda-prod") → copy the key starting with `re_...`. **Save this — you only see it once.**

**What to send me:** Just confirm "domain verified" — I don't need the API key itself. You'll paste it into your `.env.local` yourself in step 3.

### 2. Get the cPanel SMTP credentials for `info@altamoda.com`

**Steps:**
1. Open Adriahost cPanel.
2. Click **Email Accounts** (top-left of the Email section in your screenshot).
3. If `info@altamoda.com` doesn't exist yet, click **Create** and make it. Set a strong password — **save this password somewhere safe**, you'll need it for `SMTP_PASS`.
4. If it already exists, find the row for `info@altamoda.com`, click the **⋮** menu (or **Manage**) → **Connect Devices**.
5. cPanel will display **Mail Client Manual Settings** with sections for **Secure SSL/TLS Settings** (use these, not "Non-SSL"). Note down:
   - **Outgoing Server (SMTP)** — e.g. `mail.altamoda.com` or `altamoda.com`
   - **SMTP Port** — usually `465`
   - **Username** — full email, `info@altamoda.com`
6. The password is the mailbox password from step 3 (or whatever it's currently set to — if you don't remember, click **Manage** → **Change Password**).

**What to send me:** Paste the **SMTP host** and **port** values here in the chat (these are not secrets — they're public mail server addresses). **Do NOT paste the password.** You'll put the password into `.env.local` yourself.

### 3. Confirm the admin email address

The B2B signup notification will go to `ADMIN_EMAIL`. Default would be `info@altamoda.com`. If you want signup alerts to go to a different inbox (e.g. your personal email or `admin@altamoda.com`), tell me which.

**What to send me:** "Use info@altamoda.com" or "Use admin@altamoda.com" or whatever you prefer.

---

## Implementation order (what I'll do once I have the info above)

1. Install `nodemailer` + types.
2. Refactor `src/lib/email.ts` with `sendTransactional` + `sendBulk` (with throttling and pooled connections).
3. Add the two new templates in `src/lib/email-templates.ts`.
4. Wire B2B signup → admin alert in `src/app/api/users/route.ts`.
5. Wire B2B approval → user notification in `src/app/api/users/[id]/approve/route.ts`.
6. Switch newsletter campaign send route to `sendBulk` + background fire-and-forget.
7. Switch newsletter welcome flow to `sendTransactional`.
8. Update `.env.example`.
9. Hand you back a checklist for filling in `.env.local`.

I will **not** push or commit anything — you review the diff first.

---

## How you test it after I'm done

Once code is in and you've filled in `.env.local` with real values:

1. **Transactional smoke test (Resend):**
   - Subscribe a test address to the newsletter from the public form.
   - Check that test inbox for the welcome email.
   - Check Resend dashboard → **Logs** to see the delivery event.

2. **B2B signup → admin alert:**
   - Register a fake B2B account from the signup form.
   - Check `ADMIN_EMAIL` inbox for the "new B2B pending" alert.

3. **B2B approval → user notification:**
   - Log in as admin, approve the test B2B account.
   - Check the test B2B email for the approval notice.

4. **Bulk newsletter (cPanel) — small test first:**
   - Create a test newsletter campaign targeting a segment with **only 2–3 test addresses** (use a dummy segment).
   - Click Send. Verify both addresses receive it. Check spam folders too.
   - Only after this works, run a real campaign.

5. **Real campaign:**
   - Create the real monthly newsletter, send it, monitor the campaign row's `status` field. Expect it to stay `sending` for several hours, then flip to `sent`.

---

## Things this doc deliberately does NOT include

- Open/click tracking — out of scope.
- A queue/worker system (BullMQ, etc.) — overkill for monthly campaigns. The fire-and-forget background send is sufficient.
- Bounce handling for cPanel — would require parsing bounce emails from the inbox. Not worth it at current scale; manually prune obviously dead addresses if you notice them.
- Switching newsletter sending to Resend later — easy migration if/when you outgrow free tier; the `sendBulk` interface stays the same, only the implementation swaps.



