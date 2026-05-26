# Card Payments — Nexi/SIA VPOS Redirect Integration

> Implementation plan for accepting card payments on altamoda via **OTP banka Srbija**,
> whose payment gateway is **Nexi/SIA VPOS**. Path chosen: **own development on the VPOS
> Redirect interface** ("Redirect (custom)"). No plugin is usable — the bank's plugins are
> PHP packages for WooCommerce/Magento/PrestaShop/OpenCart; this is a custom Next.js app.
>
> The **WooCommerce plugin source** (`vpossia`) is used purely as the reference implementation
> for the two error-prone parts: the MAC signing strings and the outcome verification. All
> formulas below are taken verbatim from `includes/class-wc-gateway-vpossia.php`.

---

## 0. Status & prerequisites

| Item | Status |
|---|---|
| Integration model decided | ✅ Redirect (custom), API backoffice requested for Phase 2 |
| Onboarding form (`Prijava_IG000348`) | ✅ Filled, ready to send |
| Test SHOPID / Start key / API-Result key | ⏳ Issued by bank **after** form submission |
| Currency = RSD `941` confirmed | ⚠️ Confirm with bank |
| AMOUNT = minor units (×100), EXPONENT = 2 | ⚠️ Confirm with bank (plugin logic implies this) |
| Public HTTPS URL for URLMS | ⚠️ Needs prod deploy reachable on 443 |

**Nothing here can be tested until the bank issues the test keys.** Build behind a feature
flag (`VPOS_ENABLED`) so the code can ship dormant.

### Implementation status (2026-05-23) — Phase 1 code complete, dormant behind `VPOS_ENABLED=false`
- ✅ `generateOrderNumber()` hardened (`src/lib/utils.ts`) — `ALT-YYYY-XXXXXXXX` (8 hex CSPRNG).
- ✅ `src/lib/payments/vpos-config.ts` (env + flag), `src/lib/payments/vpos.ts` (sign/verify).
- ✅ Unit tests `tests/unit/lib/vpos.test.ts` — incl. assertion against SIA's published sample hash. All green.
- ✅ Prisma schema: `Order` VPOS fields + `PaymentAttempt` model. **⏳ migration not yet run against the DB.**
- ✅ `/checkout/pay/[orderNumber]` (auto-submit POST form), `/api/payments/vpos/notify` (URLMS), `/checkout/cancelled` (URLBACK), status-aware `/checkout/confirmation`, `/api/orders` returns the pay redirect, CheckoutClient defers cart-clear for card.
- ⏳ **TODO before enabling:** run `npx prisma migrate dev --name vpos_payment_fields`; fill `VPOS_*` env from bank; set `VPOS_ENABLED=true`. Auto-restock on failed/cancelled payments is a Phase-2 follow-up.

---

## 1. How the flow works

Card data **never touches our server** → we stay in the lightest PCI scope (SAQ-A). 3DS is
mandatory and handled entirely by SIA's hosted page.

```
Checkout review → POST /api/orders            [EXISTS] creates Order, paymentStatus='pending'
   │                                                    (only paymentMethod='card' continues here)
   ▼
/checkout/pay/[orderNumber]                    [NEW] server page: builds + HMAC-signs fields,
   │                                                  renders auto-submitting POST form
   ▼
SIA hosted payment page (virtualpos*.sia.eu)   customer types card + passes 3DS
   │
   ├─ URLMS  → POST /api/payments/vpos/notify  [NEW] server→server, AUTHORITATIVE.
   │                                                  Verify MAC → set paymentStatus paid/failed.
   ├─ URLDONE→ GET  /checkout/confirmation      [EXISTS] browser lands, shows status from DB.
   └─ URLBACK→ GET  /checkout/cancelled         [NEW] customer cancelled; cart still intact.
```

**Golden rule:** URLMS (server-to-server) is the source of truth. The browser may close before
URLDONE fires, so order status is decided by URLMS, never by URLDONE query params.

Endpoints (PDF §4.1):
- **Test:** `https://virtualpostest.sia.eu/vpos/payments/main?PAGE=LAND`
- **Production:** `https://virtualpos.sia.eu/vpos/payments/main?PAGE=LAND`

---

## 2. The MAC formulas (ground truth from the plugin)

HMAC-SHA256, hex output, **case-insensitive** comparison. The field order is fixed and
mandatory. Two different secret keys are used.

### 2.1 Request MAC — signed with the **Start key**
`generateMAC_request()` (plugin line 2364):

```
URLMS=<urlms>&URLDONE=<urldone>&ORDERID=<orderid>&SHOPID=<shopid>&AMOUNT=<amount>&CURRENCY=<currency>&EXPONENT=<exponent>&ACCOUNTINGMODE=<accountingmode>&AUTHORMODE=<authormode>
  [ &OPTIONS=<options> ]      // only if non-empty
  [ &LOCKCARD=<lockcard> ]    // only if non-empty
  &3DSDATA=<dsdata>           // ALWAYS appended — even when empty it is "&3DSDATA="
  [ &URLMSHEADER=<header> ]   // only if non-empty
```
- `URLMS`/`URLDONE`/`URLMSHEADER` go into the hash **un-encoded** (raw), even if they contain
  query params (PDF §5.2.1).
- With our default `OPTIONS=G` (and no LOCKCARD, empty 3DSDATA) the string is:
  `URLMS=…&URLDONE=…&ORDERID=…&SHOPID=…&AMOUNT=…&CURRENCY=…&EXPONENT=…&ACCOUNTINGMODE=…&AUTHORMODE=…&OPTIONS=G&3DSDATA=`
- `NAME`/`SURNAME`/`ORDDESCR` are **not** in the hash unless OPTIONS B/O/V are used.

### 2.2 Outcome MAC — signed with the **API-Result key**
`generateMAC_outcome()` (plugin lines 2478+). Verify the `MAC` SIA sends against this:

```
ORDERID=<orderid>&SHOPID=<shopid>&AUTHNUMBER=<authnumber>&AMOUNT=<amount>&CURRENCY=<currency>
  [ &EXPONENT=<exponent> ]    // if present
&TRANSACTIONID=<transactionid>&ACCOUNTINGMODE=<accountingmode>&AUTHORMODE=<authormode>&RESULT=<result>&TRANSACTIONTYPE=<transactiontype>
  [ &ISSUERCOUNTRY=… ]        // each of the rest appended ONLY if present, in THIS order:
  [ &AUTHCODE=… ] [ &PAYERID=… ] [ &PAYER=… ] [ &PAYERSTATUS=… ] [ &HASHPAN=… ]
  [ &PANALIASREV=… ] [ &PANALIAS=… ] [ &PANALIASEXPDATE=… ] [ &PANALIASTAIL=… ] [ &MASKEDPAN=… ]
  [ &TRECURR=… ] [ &CRECURR=… ] [ &PANTAIL=… ] [ &PANEXPIRYDATE=… ] [ &ACCOUNTHOLDER=… ]
  [ &IBAN=… ] [ &ALIASSTR=… ] [ &AHEMAIL=… ] [ &AHTAXID=… ] [ &ACQUIRERBIN=… ] [ &MERCHANTID=… ]
  [ &CARDTYPE=… ] [ &AMAZONAUTHID=… ] [ &AMAZONCAPTUREID=… ] [ &CHINFO=… ] [ &PANCODE=… ]
```
- `AUTHNUMBER` = `"NULL"` (literal string) when the authorization was not granted.
- `RESULT=00` → success. Any other code → declined (codes in PDF §4.2.3, p.26–27).

### 2.3 Operational rules (from the plugin, per SIA Oct-2021)
- **Bad outcome MAC** → log the anomaly, **do NOT change the order**, return `HTTP 500 Wrong MAC`.
- **`RESULT != 00`** → plugin marks order failed and returns `HTTP 500 Wrong RESULT Code <x>`.
  ⚠️ Returning 500 makes SIA retry the notification. **Decision point:** for cleanly-processed
  declines we likely want `HTTP 200` (we handled it) to avoid retry storms — confirm preferred
  behaviour with the bank. Reserve 500 strictly for MAC-verification failures.
- Always **re-verify `AMOUNT` and `CURRENCY`** against the stored order before marking paid.

---

## 3. Data mapping & constraints (against our actual code)

### 3.1 ORDERID — ⚠️ requires a fix first
- SIA constraint: `^[a-zA-Z0-9\-_]{1,50}$`, **unique for 5+ years**.
- Current `generateOrderNumber()` → `ALT-2025-1234` (prefix-year + `random(0..9999)`).
  - Regex: ✅ fine (letters, digits, hyphen — no slashes/spaces).
  - Uniqueness: ❌ **only 10 000 values per year** → real collision risk, and `orderNumber` is
    `@unique` so a clash throws on insert. Unacceptable as a payment identifier.
- **Action:** harden `generateOrderNumber()` before go-live, e.g.
  `ALT-${year}-${crypto.randomBytes(4).toString('hex')}` (8 hex chars) or a DB sequence.
  Keep it regex-safe.

### 3.2 AMOUNT + EXPONENT
- Plugin (line 1577): `amount = total` with `.` and `,` stripped, then leading zeros removed →
  for a 2-decimal currency this is **minor units** (e.g. `5000.00 RSD` → `"500000"`).
- `EXPONENT = wc_get_price_decimals()` → **2** for RSD.
- Our `Order.total` is `Decimal(10,2)`, so: `AMOUNT = String(Math.round(total * 100))` (no
  separators, no leading zeros), `EXPONENT = "2"`.
- ⚠️ Confirm with bank that the RSD profile expects minor units + exponent 2.

### 3.3 CURRENCY
- `CURRENCY = "941"` (ISO 4217 numeric for RSD). Our `constants.ts` `CURRENCY = 'RSD'` → map to `941`.
- ⚠️ Confirm the profile is provisioned in **RSD**, not EUR.

### 3.4 Fixed fields
- `ACCOUNTINGMODE = "I"` (immediate booking), `AUTHORMODE = "I"` (immediate auth) — PDF §5.3 default.
- `OPTIONS = "G"` — on success, SIA skips its receipt and bounces the customer straight to
  URLDONE so they see *our* confirmation page. (Plugin default.)
- `LANG = "SR"` (Serbian) or `"SC"` (Cyrillic).
- `EMAIL` = customer email (guest email or account email); `SHOPEMAIL` = `ADMIN_EMAIL`.

---

## 4. Configuration (env)

Replace the stub `PSP_*` block in `.env` / `.env.example` with:

```bash
# Payment — Nexi/SIA VPOS (OTP banka Srbija)
VPOS_ENABLED="false"                       # feature flag; flip to true once test keys arrive
VPOS_BASE_URL="https://virtualpostest.sia.eu/vpos/payments/main?PAGE=LAND"  # prod: virtualpos.sia.eu
VPOS_SHOPID=""                             # from bank
VPOS_START_KEY=""                          # secret — request signing (server only)
VPOS_API_RESULT_KEY=""                     # secret — outcome verification + API (server only)
VPOS_CURRENCY="941"                        # RSD
VPOS_EXPONENT="2"
# URLBACK/URLDONE/URLMS are built from SITE_URL at request time.
```
Keys are **server-only**; never expose to the client or import into any `'use client'` file.

---

## 5. File-by-file plan — Phase 1 (go-live: pay + verify)

### 5.1 `prisma/schema.prisma` — extend `Order`, add audit table
`PaymentStatus` (`pending|paid|failed|refunded`) and `PaymentMethod.card` already exist. Add:
```prisma
model Order {
  // …existing…
  vposTransactionId String?   @map("vpos_transaction_id")
  vposAuthNumber    String?   @map("vpos_auth_number")
  vposResultCode    String?   @map("vpos_result_code")
  paidAt            DateTime? @map("paid_at")
}

model PaymentAttempt {            // optional but recommended for audit/idempotency
  id            String   @id @default(cuid())
  orderId       String   @map("order_id")
  resultCode    String?  @map("result_code")
  transactionId String?  @map("transaction_id")
  authNumber    String?  @map("auth_number")
  rawPayload    Json?    @map("raw_payload")   // never store PAN/CVV — SIA never sends them
  createdAt     DateTime @default(now()) @map("created_at")
  order         Order    @relation(fields: [orderId], references: [id])
  @@map("payment_attempts")
}
```
Then `prisma migrate dev --name vpos_payment_fields`.

### 5.2 `src/lib/payments/vpos.ts` — signing & verification (NEW)
Pure functions using Node `crypto` (no new dependency). Port §2.1/§2.2 verbatim.
```ts
import { createHmac } from 'crypto'

export function signRequest(fields: VposRequestFields, startKey: string): string {
  let s = `URLMS=${fields.URLMS}&URLDONE=${fields.URLDONE}&ORDERID=${fields.ORDERID}` +
          `&SHOPID=${fields.SHOPID}&AMOUNT=${fields.AMOUNT}&CURRENCY=${fields.CURRENCY}` +
          `&EXPONENT=${fields.EXPONENT}&ACCOUNTINGMODE=${fields.ACCOUNTINGMODE}` +
          `&AUTHORMODE=${fields.AUTHORMODE}`
  if (fields.OPTIONS)  s += `&OPTIONS=${fields.OPTIONS}`
  if (fields.LOCKCARD) s += `&LOCKCARD=${fields.LOCKCARD}`
  s += `&3DSDATA=${fields['3DSDATA'] ?? ''}`          // ALWAYS appended
  if (fields.URLMSHEADER) s += `&URLMSHEADER=${fields.URLMSHEADER}`
  return createHmac('sha256', startKey).update(s, 'utf8').digest('hex')
}

export function verifyOutcome(params: URLSearchParams, apiResultKey: string): boolean {
  // Build the §2.2 string in the EXACT documented order, appending optionals only when present.
  // Compare case-insensitively against params.get('MAC').
}
```
- Keep an exact-order list of the optional outcome fields (§2.2) in one array so the order is
  never accidentally changed.
- `3DSDATA` generation (PDF §5.4): AES/CBC/PKCS5Padding, key = first 16 bytes of the API-Result
  key, IV = 16 zero bytes, base64 of the encrypted JSON. **Optional for go-live** — sending it
  empty is valid (just keep `&3DSDATA=` in the MAC). Add it later to improve 3DS2 approval rates.

### 5.3 Checkout flow change — `CheckoutClient.tsx` + `/api/orders`
- `/api/orders` already creates the order `pending` and returns `orderNumber`. Keep it.
- In `handlePlaceOrder()` (CheckoutClient.tsx ~line 190): if `paymentMethod === 'card'` **and**
  `VPOS_ENABLED`, redirect to `/checkout/pay/${orderNumber}` instead of straight to
  `/checkout/confirmation`. Other methods (bank_transfer, cash_on_delivery, invoice) keep today's
  behaviour.

### 5.4 `/checkout/pay/[orderNumber]/page.tsx` (NEW, server component)
1. `requireAuth()`; load the order; guard it belongs to the user and is `pending`.
2. Build the field set (§3), `signRequest(...)` with the Start key (server-side only).
3. Return an HTML `<form method="POST" action={VPOS_BASE_URL}>` of hidden inputs that
   **auto-submits** (`<script>document.forms[0].submit()</script>` + a no-JS fallback button).
   POST, not GET — the spec discourages GET and 3DSDATA can be large.

### 5.5 `/api/payments/vpos/notify/route.ts` (NEW — URLMS webhook, authoritative)
- Accept POST (and GET as fallback). Read all params.
- `verifyOutcome(params, VPOS_API_RESULT_KEY)`; on failure → log, return `500 Wrong MAC`, no DB change.
- Look up order by `ORDERID`; re-check `AMOUNT`/`CURRENCY` match the stored order.
- **Idempotent:** if already `paid`/`failed`, return 200 without re-processing (handles retries +
  `RESULT=07` duplicate).
- `RESULT=00` → `paymentStatus='paid'`, store `vposTransactionId`/`vposAuthNumber`/`paidAt`,
  write a `PaymentAttempt`, trigger the order-confirmation email (`src/lib/email.ts`). Return 200.
- `RESULT!=00` → `paymentStatus='failed'`, store `vposResultCode`. Return 200 (see §2.3 decision).
- Uses `withErrorHandler` from `src/lib/api-utils.ts` for consistency. Bypass auth (it's a
  server-to-server call) but rely on MAC as the auth boundary. Exclude this route from any
  global auth middleware.

### 5.6 `/checkout/confirmation/page.tsx` (EXISTS — adapt) = URLDONE landing
- Read order by `orderNumber` from the DB and show paid / pending / failed.
- Do **not** trust URLDONE query params for status — only display. If status is still `pending`
  (URLMS not yet arrived), show "payment is being confirmed" and let the webhook settle it.

### 5.7 `/checkout/cancelled/page.tsx` (NEW) = URLBACK
- "Plaćanje je otkazano — vaši artikli su i dalje u korpi." Link back to `/cart`. Do not clear cart.

### 5.8 Cart clearing
- Today the client clears the cart right after `/api/orders`. For card, **defer clearing** until
  payment succeeds (move it to the confirmation page when status is `paid`), so a cancelled/failed
  payment leaves the cart intact.

---

## 6. Security checklist
- [ ] `VPOS_START_KEY` / `VPOS_API_RESULT_KEY` server-only; never in client bundles or logs.
- [ ] Every URLMS/URLDONE callback MAC-verified before any DB write.
- [ ] Re-verify `AMOUNT` + `CURRENCY` against the stored order (don't trust returned amount).
- [ ] URLMS idempotent; safe under retries and `RESULT=07`.
- [ ] `/api/payments/vpos/notify` excluded from auth middleware; MAC is the trust boundary.
- [ ] Never persist anything resembling card data (SIA never sends PAN/CVV anyway).
- [ ] Rate-limit `/checkout/pay` order lookups; orders scoped to the owning user.

---

## 7. Test plan (after bank issues test keys)
- Point `VPOS_BASE_URL` at `virtualpostest.sia.eu`; set test SHOPID + keys; `VPOS_ENABLED=true`.
- Run the bank's scenario file: **R.1–R.16, R.23–R.24** (watch ACCOUNTINGMODE per the model sheet).
- Verify: success (`RESULT=00`) → order `paid` + email; decline → `failed`; cancel → URLBACK +
  cart intact; tampered MAC → rejected, order untouched; duplicate URLMS → no double-processing.
- Confirm the request MAC string matches the plugin's by diffing logged MAC strings.

## 8. Go-live checklist
- [ ] Pass all required test scenarios; bank approves.
- [ ] Bank issues **production** SHOPID + Start key + API-Result key.
- [ ] Swap `VPOS_BASE_URL` to `virtualpos.sia.eu`; load prod keys.
- [ ] URLMS reachable over public **HTTPS:443** (standard port only, PDF §4.2.4).
- [ ] Run a small real "pilot" payment + a refund in CUBO before announcing.
- [ ] `generateOrderNumber()` hardened (§3.1).

---

## 9. Phase 2 — API backoffice (refunds / capture / status) — later
Fashion retail has frequent returns, so manual refunds in the CUBO portal won't scale. Once the
bank provides the **VPOS API integration guide** and enables API access on the profile:
- Add `src/lib/payments/vpos-api.ts` for refund / capture / order-status calls (signed with the
  API-Result key).
- Add a "Refund" action to `/admin/orders` → sets `paymentStatus='refunded'`.
- Add a reconciliation cron: for orders stuck `pending` past N minutes, query SIA order-status and
  settle them (covers missed URLMS / customer closed the tab). Fits the existing
  `src/app/api/cron` + `ERP_CRON_SECRET` pattern.

---

## 10. Open questions for the bank
1. Currency: is our profile **RSD (941)**?
2. AMOUNT format for RSD — minor units (×100) with EXPONENT 2? (Plugin logic implies yes.)
3. For a cleanly-processed **declined** payment on URLMS, do you want HTTP **200** or **500**?
4. Please enable **API backoffice** access and send the **VPOS API integration guide** (Phase 2).
5. Send the **test scenario file** (R.1–R.16, R.23–R.24) with test card numbers.

---

### Reference
- Spec: `Merchant Integration VPOS REDIRECT_2.6.0._Nexi.pdf` (Redirect §4, MAC §5.2, AES/3DSDATA §5.4).
- Reference impl: WooCommerce plugin `vpossia/includes/class-wc-gateway-vpossia.php`
  (`generateMAC_request` ~L2362, `generateMAC_outcome` ~L2408, field build ~L1577–1665,
  `processGatewayResponse` ~L1777).
