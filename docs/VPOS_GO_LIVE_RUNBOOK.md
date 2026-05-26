# VPOS Card Payments — Go-Live Runbook (handoff for a future session)

**Purpose:** everything a future Claude/dev needs to take VPOS card payments from
"tested" to "live for real customers" once the bank replies. Written 2026-05-25.

Related docs: `docs/PAYMENT_VPOS.md` (full design), `docs/VPOS_TEST_RESULTS.md` (cert results).
Acquirer: **UniCredit Bank Srbija** (contact Nikola Štrbac), gateway **Nexi/SIA VPOS**.
Merchant case no. **30013183**, onboarding ref **IG000348**.

---

## 1. What is DONE (as of 2026-05-25)
- **Phase 1 Redirect integration is complete and certification-tested.** All 13 mandatory
  scenarios passed against the SIA **test** gateway via a cloudflared tunnel + Cubo portal
  (R.1/R.3/R.10/R.12/R.23 success; R.4/R.6/R.7/R.8/R.9 declines; R.5 duplicate; R.13 refund;
  R.24 accounting cancel). Evidence in `docs/VPOS_TEST_RESULTS.md` and the filled bank sheet
  on the user's Desktop (`UnicreditRS_TestScenario_Redirect_FILLED.xlsx`).
- Code: `src/lib/payments/vpos.ts` (sign/verify, `OPTIONS='GR'`), `vpos-config.ts`,
  `/checkout/pay/[orderNumber]`, `/api/payments/vpos/notify` (URLMS; declines→HTTP 200,
  MAC-fail→500, idempotent), `/checkout/confirmation` (status-aware), `/checkout/cancelled`.
- `next.config.ts` CSP `form-action` allows `virtualpos.sia.eu` + `virtualpostest.sia.eu`
  (without this the redirect form is silently blocked — critical for prod).
- DB migration `20260523174504_vpos_payment_fields` exists (Order vpos_* cols + `payment_attempts`).
- Email requesting production credentials sent to the bank (draft: Desktop `VPOS_MAIL_FINAL.txt`).

## 2. What we are WAITING for from the bank
1. Confirmation/sign-off that the test results are OK.
2. **Production credentials:** production **SHOPID**, **Start key**, **API-Result key**.
3. **Production CUBO** Merchant Back Office access (for real refunds/management).
4. Confirmation the production profile is provisioned in **RSD (941)**.

Note: the production gateway URL is already known (`virtualpos.sia.eu`) — not needed from bank.

## 3. Can be done NOW (before the bank replies)
Merge the code to `main` — it ships **dormant** (`VPOS_ENABLED=false` in prod), so it is safe
and changes nothing for customers until deliberately enabled.
1. On branch `feature/psp`, commit the uncommitted changes: `src/lib/payments/vpos.ts`,
   `tests/unit/lib/vpos.test.ts`, `next.config.ts`, `scripts/vpos-build-duplicate-form.ts`,
   `docs/VPOS_TEST_RESULTS.md`, `docs/VPOS_GO_LIVE_RUNBOOK.md`.
2. `npx vitest run tests/unit/lib/vpos.test.ts` (expect 15 pass) and a production build.
3. Open PR → `main`, merge. (`.env` is gitignored; no secrets are committed.)

## 4. Go-live steps (AFTER the bank sends production credentials)
> All secrets go in the **production hosting env**, NOT the repo `.env`.

1. Set production environment variables:
   - `VPOS_ENABLED=true`
   - `VPOS_BASE_URL=https://virtualpos.sia.eu/vpos/payments/main?PAGE=LAND`
   - `VPOS_SHOPID=<prod shopid>`
   - `VPOS_START_KEY=<prod start key>`
   - `VPOS_API_RESULT_KEY=<prod api-result key>`
   - `VPOS_CURRENCY=941`, `VPOS_EXPONENT=2`
   - `SITE_URL=https://www.altamoda.rs` (the real public domain; confirm exact host). This is
     what builds URLMS/URLDONE/URLBACK — must be public **HTTPS:443**.
2. Apply the migration on the production DB: **`npx prisma migrate deploy`** (NOT `migrate dev`).
   Verify `payment_attempts` table + Order `vpos_*` columns exist.
3. Deploy the app.
4. **Confirm the webhook is publicly reachable:** `https://www.altamoda.rs/api/payments/vpos/notify`
   must accept server-to-server POSTs from SIA over HTTPS:443 (no WAF/CDN/auth-middleware block;
   the route already bypasses auth and MAC is the trust boundary). A POST with a bad MAC should
   return `500 Wrong MAC` (proves reachability without changing data).
5. Confirm CSP (already in `next.config.ts`) allows `form-action ... https://virtualpos.sia.eu`.
6. **Pilot:** make ONE small REAL card payment on the live site end-to-end → order must settle
   to `paid` (via URLMS), confirmation page shows paid, transaction visible in **production** CUBO.
   Then **refund that pilot** in production CUBO to confirm refunds work on prod.
7. Watch the first real transactions / logs.

## 5. Ready-for-real-users checklist
- [ ] PR merged to `main` and deployed to production.
- [ ] All `VPOS_*` prod env vars set; `VPOS_ENABLED=true`.
- [ ] `SITE_URL` = real public HTTPS domain.
- [ ] `prisma migrate deploy` run on prod DB (vpos cols + payment_attempts present).
- [ ] `/api/payments/vpos/notify` reachable over public HTTPS:443 (bad-MAC POST → 500).
- [ ] CSP `form-action` includes `virtualpos.sia.eu`.
- [ ] Order-confirmation email sends on success (`src/lib/email.ts`).
- [ ] Pilot real payment → `paid`; pilot refund in prod CUBO → OK.

## 6. Gotchas / notes
- **Decline handling:** URLMS returns HTTP **200** for declines (bank-confirmed); 500 is reserved
  for MAC-verification failure only. Already implemented.
- **OPTIONS=GR:** G = skip SIA receipt → URLDONE; R = MAC sent on declines too. Already set.
- **AMOUNT:** minor units ×100 (RSD), EXPONENT 2. `generateOrderNumber()` already hardened
  (`ALT-YYYY-XXXXXXXX`, 8 hex) — unique enough for the 5-yr ORDERID requirement.
- **Stock on failed/cancelled payments:** currently the order is marked `failed` but the already
  decremented stock is NOT auto-restocked (admin can cancel to restock). Auto-restock is a
  Phase-2 follow-up.
- Keys are **server-only** — never import into a `'use client'` file or log them.

## 7. Phase 2 (later, optional — only if bank/biz wants API)
- API backoffice (`src/lib/payments/vpos-api.ts`): refunds/capture/order-status signed with the
  API-Result key; admin "Refund" action in `/admin/orders`; reconciliation cron for stuck-pending
  orders (fits `src/app/api/cron` + `ERP_CRON_SECRET`). Then run bank tests **A.21, A.22, A.23**.
- Cubo manual: API enabling lives at Shop Management → Management (Acquirer must enable it).
- Optional Redirect tests not done (Deferred accounting): R.2, R.11, R.14, R.15, R.16 — need
  `ACCOUNTINGMODE='D'` support (currently hardcoded `'I'`).

## 8. Local re-test recipe (if needed before prod)
cloudflared tunnel → `http://localhost:3000`; set `SITE_URL`+`AUTH_URL` to the tunnel URL +
`AUTH_TRUST_HOST=true` + `VPOS_ENABLED=true`; `npm run dev`; pre-create orders with
`scripts/vpos-create-test-order.ts`, drive via `/checkout/pay/<orderNumber>`; simulate URLMS
without the bank via `scripts/vpos-simulate-notify.ts`; R.5 duplicate via
`scripts/vpos-build-duplicate-form.ts`. Restore `.env` + stop tunnel/server afterward.
Test login `marija@gmail.com`/`user123`. Decrypt bank xlsx: `/tmp/vposvenv` (msoffcrypto-tool),
pwd `sia123`; PDFs via `pdftotext`.
