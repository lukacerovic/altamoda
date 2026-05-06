# Email Routing — Per-Channel Sender Plan

## Goal

Split outgoing/incoming email by purpose so each channel uses its own dedicated address:

| Purpose | Address | Direction |
|---|---|---|
| Newsletter (welcome + campaigns) | `newsletter@altamoda.rs` | **From** (sender) |
| B2B registration → admin alert | `shop@altamoda.rs` | **To** (recipient — admin inbox) |
| Google OAuth — Google Cloud project owner | `altamoda.bgd@gmail.com` | n/a (GCP console identity) |
| Everything else: footer, contact, transactional sender, FAQ, education | `kontakt@altamoda.rs` | **From + To + display** |

---

## TL;DR

**Code change scope: small.** Maybe 1–2 hours of work in the repo. Most of the moving parts are *outside* the codebase — DNS records for Resend, mailbox creation in cPanel, and a fresh Google Cloud project. Counting external setup + propagation waits, plan **half a day total**.

---

## Current state (audit)

The email system today is built around **one** sender (`info@altamoda.rs`) used for everything. See `EMAIL_HYBRID_SETUP.md` for the existing architecture (Resend transactional + cPanel SMTP bulk).

### What's hardcoded vs configurable today

| Where | Value | Type |
|---|---|---|
| `.env` → `EMAIL_FROM` | `"Altamoda <info@altamoda.rs>"` | env (sender for **all** outgoing) |
| `.env` → `ADMIN_EMAIL` | `info@altamoda.rs` | env (recipient for B2B alert) |
| `.env` → `SMTP_USER` / `SMTP_PASS` | `info@altamoda.rs` / … | env (SMTP auth for bulk) |
| `.env` → `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | … | env (OAuth client) |
| `src/components/Footer.tsx:90` | reads `t("footer.email")` | i18n |
| `src/lib/i18n/translations/sr.json:75` | `kontakt@altamoda.rs` | i18n string ✅ already correct |
| `src/lib/i18n/translations/en.json:75` | `kontakt@altamoda.rs` | i18n string ✅ already correct |
| `src/lib/i18n/translations/ru.json:75` | `kontakt@altamoda.rs` | i18n string ✅ already correct |
| `src/app/contact/page.tsx:71-73` | `atelier@altamoda.com` (hardcoded `mailto:` + display) | **needs fix** |
| `src/app/faq/page.tsx:346-347` | `kontakt@altamoda.rs` (hardcoded mailto) ✅ already correct |
| `src/lib/email-templates.ts:174` | "kontaktirajte nas na **info@altamoda.rs**" (inside email HTML body) | **needs fix** |
| `src/data/mocked_data.ts:878` | `reklamacije@altamoda.rs` (mock FAQ string) | optional, mocked data |

### How sending works today

`src/lib/email.ts` exposes:

- `sendTransactional({ to, subject, html })` → Resend, FROM = `EMAIL_FROM` env
- `sendBulk(emails, meta)` → nodemailer/cPanel SMTP, FROM = `EMAIL_FROM` env

Both share **one** `getEmailFrom()` helper. There is no per-channel sender. To support per-channel, we either:
- **Option A**: pass an optional `from` arg to `sendTransactional` / `sendBulk`, and have the newsletter routes pass the newsletter address.
- **Option B**: add `getNewsletterFrom()` and a thin `sendNewsletter()` wrapper. Slightly cleaner naming, slightly more code.

Option A is fewer lines. Recommended.

---

## Code changes (small)

### 1. `src/lib/email.ts` — accept optional `from` per call

Add `from?: string` to `SendEmailOptions` and `BulkEmail`. Default to `getEmailFrom()` when omitted.

```ts
export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string                              // NEW — overrides EMAIL_FROM
}

export async function sendTransactional({ to, subject, html, from }: SendEmailOptions) {
  const result = await getResend().emails.send({
    from: from || getEmailFrom(),            // CHANGED
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  })
  ...
}

export interface BulkEmail {
  to: string
  subject: string
  html: string
  from?: string                              // NEW
}

// inside sendBulk loop:
await transporter.sendMail({
  from: email.from || getEmailFrom(),        // CHANGED
  ...
})
```

Then add a single env-driven helper:

```ts
function getNewsletterFrom() {
  return process.env.NEWSLETTER_FROM
       || process.env.EMAIL_FROM
       || 'Altamoda Newsletter <newsletter@altamoda.rs>'
}
export { getNewsletterFrom }
```

### 2. Pass the newsletter sender on the 3 newsletter call sites

| File | Change |
|---|---|
| `src/app/api/newsletter/route.ts` (welcome on subscribe — both early-return and main path) | `sendTransactional({ from: getNewsletterFrom(), to, subject, html })` |
| `src/app/api/newsletter/test/route.ts` (admin test send) | `sendBulk([{ from: getNewsletterFrom(), to, subject, html }], …)` |
| `src/app/api/newsletter/campaigns/[id]/send/route.ts` (real campaign blast) | yield `{ from: getNewsletterFrom(), to, subject, html }` from the iterator |

Everything else in `email.ts` (`getEmailFrom`, `sendTransactional`, `sendBulk`, `rewriteAssetUrls`, `getUnsubscribeUrl`) keeps working unchanged — non-newsletter callers (B2B signup alert, B2B approval, password reset) automatically continue to use `EMAIL_FROM` (= `kontakt@altamoda.rs`).

### 3. Hardcoded address fixes

| File | Old | New |
|---|---|---|
| `src/app/contact/page.tsx:71` (`mailto:`) | `atelier@altamoda.com` | `kontakt@altamoda.rs` |
| `src/app/contact/page.tsx:73` (display) | `atelier@altamoda.com` | `kontakt@altamoda.rs` |
| `src/lib/email-templates.ts:174` | `info@altamoda.rs` | `kontakt@altamoda.rs` |
| `src/data/mocked_data.ts:878` (optional) | `reklamacije@altamoda.rs` | `kontakt@altamoda.rs` |

### 4. i18n footer / contact strings

Already correct — `footer.email` resolves to `kontakt@altamoda.rs` in all three locale files (`sr/en/ru`). Nothing to change here.

---

## Environment variable changes

Update `.env` (and `.env.example`) on every environment (local, staging, prod):

```diff
- EMAIL_FROM="Altamoda <info@altamoda.rs>"
+ EMAIL_FROM="Altamoda <kontakt@altamoda.rs>"

+ # Newsletter sender — used by /api/newsletter, /api/newsletter/test, and campaign send
+ NEWSLETTER_FROM="Altamoda Newsletter <newsletter@altamoda.rs>"

- ADMIN_EMAIL="info@altamoda.rs"
+ ADMIN_EMAIL="shop@altamoda.rs"

  SMTP_HOST="mail.altamoda.rs"
  SMTP_PORT="465"
  SMTP_SECURE="true"
- SMTP_USER="info@altamoda.rs"
- SMTP_PASS=""
+ SMTP_USER="newsletter@altamoda.rs"   # see §"SMTP authentication caveat" below
+ SMTP_PASS="<password for newsletter@altamoda.rs mailbox>"

  AUTH_GOOGLE_ID="<new — from new GCP project>"
  AUTH_GOOGLE_SECRET="<new — from new GCP project>"
```

---

## External / infrastructure work (the bigger part)

### A. cPanel — create the mailboxes

In Adriahost cPanel for `altamoda.rs`, create these mailboxes (or confirm they exist):

- `newsletter@altamoda.rs` — needs an SMTP password (used as `SMTP_USER` / `SMTP_PASS`)
- `shop@altamoda.rs` — used as recipient only; a forwarder to a real human inbox is fine
- `kontakt@altamoda.rs` — used as both FROM (Resend) and a real inbox for replies. Probably already exists since the footer/FAQ already point here.

Optional: also create `info@altamoda.rs` as a forwarder → `kontakt@altamoda.rs` so old footer/email signatures don't bounce.

### B. Resend — domain verification for `altamoda.rs`

Resend will refuse to send `From: anything@altamoda.rs` until the domain is verified in the Resend dashboard. Either it's already done (current setup uses `info@altamoda.rs` so probably yes) or it isn't.

If verified once for the domain, you can send from **any** mailbox at that domain — `kontakt@`, `newsletter@`, `noreply@` — without re-verifying. Just confirm the domain card in resend.com is green.

If not yet verified: add the SPF + DKIM + DMARC records Resend provides into the domain's DNS at the registrar. DNS propagation: 5 min – 24 hr.

### C. cPanel SMTP — authentication caveat

This is the one variable that may surprise you. Some shared hosts enforce `SMTP_AUTH user == From address`. If Adriahost does, then authenticating as `newsletter@altamoda.rs` and trying `From: kontakt@altamoda.rs` (or vice versa) will be rejected.

Two safe configurations:

1. **Option 1 (clean)**: Use `newsletter@altamoda.rs` for both auth **and** newsletter `From`. Transactional mail goes through Resend (not SMTP), so SMTP only ever needs to send newsletter. Then `SMTP_USER = newsletter@altamoda.rs` and `From = newsletter@altamoda.rs` always match. ✅ Recommended.

2. **Option 2**: Keep `info@altamoda.rs` as SMTP auth user, send newsletter `From` as a different address. Works on hosts that allow it; needs testing. If Adriahost rejects, fall back to Option 1.

Plan for Option 1 — that's what the env diff above assumes.

### D. Google Cloud Console — new project under `altamoda.bgd@gmail.com`

This is a GCP console action, not a code change. Existing code (`src/lib/auth.ts`) just reads `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — the values change, the code doesn't.

Steps:
1. Sign in to https://console.cloud.google.com with `altamoda.bgd@gmail.com`.
2. Create project "Altamoda Production" (or similar).
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name: Altamoda
   - User support email: `altamoda.bgd@gmail.com`
   - App logo, homepage (`https://altamoda.rs`), privacy policy (`/privacy`), TOS (`/terms`)
   - Authorized domains: `altamoda.rs`
   - Developer contact: `altamoda.bgd@gmail.com`
   - Scopes: `email`, `profile`, `openid`
   - Publishing status: start in **Testing** (add team Gmail accounts as test users), then **Publish** when ready. Publishing requires Google's verification only if you use sensitive scopes — for `email`/`profile`/`openid` you can self-publish in minutes.
4. **APIs & Services → Credentials → Create OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `https://altamoda.rs`, `http://localhost:3000` (for dev)
   - Authorized redirect URIs:
     - `https://altamoda.rs/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID / Client Secret into Vercel env vars (and local `.env`):
   - `AUTH_GOOGLE_ID=<new>`
   - `AUTH_GOOGLE_SECRET=<new>`

**Migration impact for existing users:** NextAuth keys identity by Google's stable user ID (`sub`), and that ID is **per-project**. Switching projects means existing Google-linked accounts will not match on the next sign-in — they'll create new account rows. If any users have already signed in via Google with the old project, they'll see a "looks like a new account" experience. Two ways to handle:

- **(a)** Accept it — only ~handful of users have used Google login so far (it was just added). Worth confirming with `prisma studio` or a quick `select count(*) from "Account" where provider='google'`.
- **(b)** Email those users and ask them to relink. Heavyweight; only worth it if there are many.

Recommended: pick (a) unless the count is non-trivial.

---

## Summary — what to do, in order

1. **DNS / mailboxes (no code, async)**
   - Confirm Resend has `altamoda.rs` verified (likely already).
   - Create `newsletter@altamoda.rs` and `shop@altamoda.rs` in cPanel.
   - Confirm `kontakt@altamoda.rs` exists.

2. **Google Cloud project (no code, ~30 min)**
   - Create the new project under `altamoda.bgd@gmail.com`, configure OAuth, get new client id/secret.

3. **Code changes (~1 hr)**
   - `src/lib/email.ts`: add `from?: string` option, add `getNewsletterFrom()` helper.
   - 3 newsletter route files: pass `from: getNewsletterFrom()`.
   - `src/app/contact/page.tsx`: replace `atelier@altamoda.com` with `kontakt@altamoda.rs`.
   - `src/lib/email-templates.ts:174`: replace `info@altamoda.rs` with `kontakt@altamoda.rs`.
   - (Optional) `src/data/mocked_data.ts:878`: replace `reklamacije@altamoda.rs`.

4. **Env vars (Vercel + local)**
   - Update `EMAIL_FROM`, `ADMIN_EMAIL`, `SMTP_USER`, `SMTP_PASS`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
   - Add new `NEWSLETTER_FROM`.

5. **Smoke tests**
   - Subscribe to newsletter on a dev URL → confirm welcome arrives `From: newsletter@…`.
   - Submit a B2B registration → confirm admin alert arrives at `shop@altamoda.rs`.
   - Send a test campaign → confirm `From: newsletter@…` and rate-limit still works.
   - Send a B2B approval → confirm `From: kontakt@altamoda.rs`.
   - Sign in with Google on dev → confirm new client_id flow works.
   - Visit `/contact`, `/faq`, footer mailto links → all point at `kontakt@altamoda.rs`.

---

## Effort estimate

| Step | Time |
|---|---|
| DNS + mailbox setup (cPanel + Resend) | 30 min + propagation wait |
| Google Cloud OAuth project | 30–45 min |
| Code changes | 60–90 min |
| Env var updates (local + Vercel) | 10 min |
| Smoke tests | 30 min |
| **Total active work** | **~2.5 hr** |
| **Total elapsed** | **half a day** with DNS / Google verification waits |

---

## Risks / things to watch

- **Adriahost SMTP auth-vs-from rule** — explained above. If they enforce it, Option 1 (`newsletter@` for both auth and From) sidesteps it. Only matters if you ever try to send SMTP `From: kontakt@…` while authenticated as `newsletter@…` — this plan never does, but worth knowing.
- **Resend domain not yet verified** — symptom: `sendTransactional` returns 403 with "domain not verified". Fix: add DNS records. 5 min – 24 hr until live.
- **Google OAuth project switch breaks existing sign-ins** — see migration impact in §D. Likely small blast radius.
- **HTML email body strings** — there's at least one inline mention of `info@altamoda.rs` inside `email-templates.ts`. Grep for any others before switching: `git grep -i "info@altamoda\|atelier@altamoda"`.
- **Reply-To** — if `kontakt@altamoda.rs` should receive replies to newsletter campaigns even though the From is `newsletter@…`, add a `replyTo` option in `sendBulk` set to `kontakt@altamoda.rs`. Resend's API and nodemailer both support it. Trivial to add later.

---

## Open questions for you

1. Should newsletter campaigns set **Reply-To: `kontakt@altamoda.rs`** so customer replies don't bounce around in the marketing inbox? (Recommended yes.)
2. Is `kontakt@altamoda.rs` already created in cPanel, or do we need it too?
3. Do you want a forwarder from old `info@altamoda.rs` → `kontakt@altamoda.rs` so legacy email signatures keep working?
4. How many existing Google-linked accounts are in the DB? Determines whether we accept the relink hit or migrate.
