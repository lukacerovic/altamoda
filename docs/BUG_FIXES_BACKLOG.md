# Bug Fixes Backlog

Collected from production QA review. Ordered by priority:
**P0** — data integrity / security / revenue; **P1** — functional bugs with
customer-visible impact; **P2** — UX / polish; **P3** — requires tradeoff
decisions.

Each item is self-contained so fixes can be shipped individually. File
references are starting points, not exhaustive.

---

## P0 — Data integrity, security, revenue

### 1. B2C user can order B2B-only (professional) products via direct link
**Original:** *"b2c kad udje preko linka za proizvod iz b2b i doda u korpu i poruci ga uspe da izvrsi sve. To ne bi smelo."*

A B2C (or guest) user who opens the direct product URL of a professional-only
(`isProfessional: true`) product can currently view it, add it to cart, and
check out successfully. Professional products must be gated.

**Where to look**
- `src/app/products/[id]/page.tsx` + `src/app/products/[id]/ProductDetailClient.tsx` — detail page has no role gate.
- `src/app/api/cart/**` — cart add endpoint must reject professional SKUs for non-B2B roles.
- `src/app/api/orders/**` — checkout must reject orders containing professional SKUs if the purchaser isn't B2B.
- List filter already hides these (see `src/app/api/products/route.ts` lines around the `isProfessional` where-clause) — only the direct-URL path is unguarded.

**Fix**
- Server-side: in the product detail API and cart-add handler, return 403 when product `isProfessional === true` and `role !== 'b2b' && role !== 'admin'`.
- Client-side: redirect `/products/[id]` to `/account/login?redirect=...&b2b=required` if the product is professional and the viewer isn't B2B. The server guard is the real fix; the redirect is UX.
- Add an e2e test that asserts a guest/B2C user gets 403 on `GET /api/products/[id]` and `POST /api/cart` for a professional product.

**Acceptance**
- Hitting `/products/{professional-sku}` as guest or B2C → redirected / 404.
- Add-to-cart endpoint returns 403 for professional products unless role is `b2b` or `admin`.
- Checkout of an order containing any professional product is rejected for non-B2B roles.

---

### 2. B2B-only product shows a B2C price that was never entered
**Original:** *"za dodat b2b proizvod stoji i cena za b2c koja nije ni dodata u admin panelu."*

When creating a B2B-only product in admin, the admin doesn't enter a B2C
price, but the storefront / API still shows one. Current workaround in
`src/app/admin/products/page.tsx` (around lines 527–529) mirrors `priceB2b →
priceB2c` so the DB NOT NULL constraint on `priceB2c` is satisfied — that
fallback is leaking to the public.

**Fix options**
- **(preferred)** Make `priceB2c` nullable in Prisma (`Decimal?`) + migration; remove the mirroring hack in admin save; update public APIs so when `priceB2c === null` the product is effectively hidden/unpurchaseable for B2C roles.
- Or: keep the mirror but on public reads, when the product is professional, return `priceB2c: null` and block B2C add-to-cart (overlaps with item #1).

**Acceptance**
- New B2B-only product with only a B2B price shows no B2C price on public listings.
- `GET /api/products` as guest/B2C never returns a nonzero `priceB2c` for a product that has `isProfessional: true`.
- DB column either nullable or explicit sentinel; no silent mirroring.

---

### 3. Promotions not reflected for items already in cart / on product list
**Original:** *"ako se doda akcija na proizvod kome je nekom u korpi treba da bude prikazana i racunata nova cena. Takodje nakon dodavanja akcije na klijentskoj strani nije prikazana manja vrednost za proizvod koji je selektovan za tu akciju."*

Two related bugs:
1. A cart line's price is frozen at add-time. If an active promotion is later attached to the product, the cart still shows the old price, and checkout charges the old price.
2. After an admin activates a promotion, the client-side product listing/detail doesn't immediately show the discounted price (stale cache / no revalidation).

**Where to look**
- `src/app/api/cart/**` — cart line-item read probably joins `Product.priceB2c` without re-computing promotion.
- `src/app/api/products/route.ts` already has the promotion join (`promotion_products` + `promotions`) — that same logic must be called from cart reads and `GET /api/products/[id]`.
- Promo mutation endpoint should call `revalidatePath('/')`, `revalidatePath('/products')`, `revalidatePath('/products/[id]', 'page')` and `revalidateTag` if any are in use.

**Fix**
- Extract the "apply best active promotion for role" logic from `src/app/api/products/route.ts:240–302` into a helper (`src/lib/pricing.ts`), then reuse it in:
  - `GET /api/cart` (all line items),
  - `POST /api/cart` (compute price at add-time OR recompute on read — picking read-time is safer),
  - `GET /api/products/[id]`,
  - checkout total calculation, so promo discounts aren't bypassed.
- On promo activate/deactivate, `revalidatePath` the product pages and homepage.

**Acceptance**
- Add product A to cart at full price. Admin adds a 20% promo to A. Refresh cart → shows 20% off price, total recalculated.
- Admin activates a new promo → storefront shows the discount within one refresh (no stale ISR page).

---

### 4. Reviews can be submitted by users who never ordered the product
**Original:** *"Recenzije ne smeju da budu omogucene da se dodaju u koliko korisnik nije porucio proizvod."*

Reviews are currently open to any logged-in user, enabling fake/spam reviews.

**Fix**
- Server-side gate on `POST /api/reviews` (or wherever reviews are created): verify the user has at least one `orders` row containing this `productId`, and optionally `status IN ('delivered', 'completed')` if you want to require delivery.
- Client: hide the "write a review" button on the product page unless the user's orders include this product.

**Acceptance**
- User with no matching order → 403 on review POST, CTA hidden on UI.
- User with a delivered order → review form available.

---

### 5. Remove image upload from review form
**Original:** *"Treba da se izbaci i dodavanje slike na recenziji."*

Product decision — drop image uploads from reviews to simplify moderation and reduce Cloudinary cost.

**Fix**
- Remove the file input from the review form (in whichever component — likely `src/app/products/[id]/ProductDetailClient.tsx` or a `ReviewForm` component).
- Remove image fields from review API body and Zod schema.
- Stop rendering review images (legacy rows can keep their URLs in DB; render nothing). Optionally add a migration to null them out.

**Acceptance**
- No file input on the review form.
- `POST /api/reviews` ignores any `images` field.
- Review list UI doesn't render images.

---

## P1 — Functional bugs, customer-visible

### 6. Email links point to `localhost` instead of production URL
**Original:** *"linkovi sa mejla je localhost, treba da bude home page."*

Emails sent from production contain links like `http://localhost:3000/...` — customers can't click through.

**Root cause (suspected)**
`src/lib/email.ts` has `getSiteUrl()` which reads `SITE_URL` and falls back to `http://localhost:3000` in non-prod. If `SITE_URL` isn't set in Vercel production env OR the email template hardcodes a fallback, the localhost value leaks.

**Fix**
- Verify `SITE_URL=https://altamoda.rs` (or `https://altamoda.vercel.app`) is set in Vercel Production env vars.
- Audit every email template in `src/lib/email-templates.ts` for any hardcoded `localhost`, `process.env.NEXTAUTH_URL` fallbacks, or missing base-URL prefixes. All links should be absolute using `getSiteUrl()`.
- Add a unit test that renders each template with `SITE_URL=https://example.com` and asserts no output string contains `localhost`.

**Acceptance**
- Triggered transactional email (test send, welcome, B2B admin alert, order confirmation) has every link pointing to the production origin.

---

### 7. Newly created category doesn't appear in product filter / admin dropdown
**Original:** *"categorija kad se dodala nije se uvrstila u filtere za dodati proizvod."*

After an admin creates a new category, the category dropdown on the product create/edit form still doesn't include it until the session is refreshed.

**Where to look**
- `src/app/admin/products/page.tsx` — category list is likely fetched once on mount and cached in state; not refetched after a category mutation.
- Category POST (`/api/categories`) should return a fresh list, or the product form should invalidate its category query.

**Fix**
- After a successful category create/edit, invalidate/refetch the categories list used by the product form. Either:
  - Lift category state into a shared store / context and mutate there, or
  - Refetch `/api/categories` in the product-form dialog's `useEffect` on open, or
  - Use SWR/React Query `mutate`/`invalidateQueries` if that's in the stack.
- Same treatment needed for brands and product lines if they have the same pattern.

**Acceptance**
- Create a new category → immediately open the "Add product" dialog → the new category is in the dropdown without a page reload.

---

### 8. Client's order status doesn't update without manual refresh
**Original:** *"nakon updata stanja treba active pulling da bude i na klijentskoj strani porudzbina."*

When admin (or the client themselves via cancel — see item #9) changes an
order's status, the client's "My orders" page keeps showing the stale status
until they manually refresh.

**Fix**
- Add lightweight polling to the client order list / detail page: `setInterval` or SWR `refreshInterval` at ~15–30s while the tab is visible. Stop when tab hidden (use `visibilitychange`).
- Alternative (nicer): server-sent events or a WebSocket, but polling is sufficient for this scale.
- The poll endpoint should be cheap — return only `{ orderId, status, updatedAt }[]` per user, no joins.

**Acceptance**
- Admin changes an order status from "pending" to "shipped" → within ~30s the client's open order page reflects "shipped" without manual reload.

---

### 9. Clients cannot cancel their own orders
**Original:** *"dodati da klijent moze da otkaze porudzbinu."*

Currently only the admin can change order status. Add self-service cancellation for orders that haven't progressed too far.

**Fix**
- New endpoint `POST /api/orders/[id]/cancel` — gated by ownership (`order.userId === currentUser.id`) and by status (only cancellable while `status IN ('pending', 'awaiting_payment')`; reject if already shipped/delivered).
- On success: update `status='cancelled'`, write to `OrderStatusHistory` with `changedBy=user`, restock the products (increment `Product.stockQuantity` for each line item inside a transaction with the status change).
- Add "Otkaži porudžbinu" button on the client order page, visible only when status is cancellable.
- Email admin + client on cancellation.

**Acceptance**
- Client with a `pending` order can click "Cancel" → status becomes `cancelled`, stock is returned, both parties notified.
- Cancel button hidden / API returns 409 once the order is past the cancellable window.

---

### 10. Duplicate delivery-method selector at start of cart
**Original:** *"korpa izbaciti opciju za seletovanje dostave na pocetku kada vec ima korak u narednim koracima da selektuje."*

The cart page asks the user to pick a delivery method up front, but the
multi-step checkout then asks again. Remove the cart-page selector; keep only
the checkout step.

**Fix**
- Remove the delivery-method picker from `src/app/cart/page.tsx`.
- Ensure the checkout step's default selection is the previously expected default (free shipping over threshold, otherwise paid standard).
- Double-check that no later code reads delivery method from cart state before the checkout step.

**Acceptance**
- Cart page no longer shows the delivery picker. Totals in cart are computed assuming default delivery (or "to be selected").
- Checkout still asks for delivery method at the right step, and the final price matches.

---

### 11. Pagination counts empty pages
**Original:** *"ako stranica nema proizvode ne treba da bude broj u paginaciji proizvoda, dakle poslednja je ona koja ima barem jedan proizvod."*

Paginator shows page numbers for pages that return zero products. The last
real page should be `ceil(totalWithContent / limit)`.

**Likely root cause**
In `src/app/api/products/route.ts`, the total count query uses `where` (line ~210) but the list query uses `finalWhere` which excludes grouped-product duplicates (`excludeIds`). `total = totalRaw - duplicateCount` attempts to fix this but may still drift if filters remove visible products on specific pages.

**Fix**
- Compute `total` against `finalWhere` (the same filter used for the list query) to guarantee `totalPages` matches reality.
- Add a unit test that seeds N products, requests page `ceil(N/limit)+1`, asserts it isn't listed by the paginator.

**Acceptance**
- No paginator button ever loads an empty results page.
- `totalPages === ceil(actualMatchingCount / limit)`.

---

### 12. B2B profile shows static/mock data
**Original:** *"b2b profile bez statickih podataka."*

B2B user profile page still contains placeholder/mock values instead of data
from the user's `B2bProfile` record.

**Fix**
- Find the B2B profile page (likely `src/app/account/**` with a B2B branch, or `src/app/b2b/**`).
- Wire fields to `user.b2bProfile.{salonName, pib, maticniBroj, address}` and `user.{name, email, phone}`.
- Remove any seeded/demo values.
- Add a "Pending approval" notice if `user.status === 'pending'`.

**Acceptance**
- Newly registered B2B user sees their real data, not mock.
- Approved B2B user sees name, email, phone, salon name, PIB, matični broj, address — no literal "Lorem…" / hardcoded company names.

---

## P2 — UX and polish

### 13. Client profile page scrolls horizontally as a whole
**Original:** *"cela stranica je scrollable po horizontali kod profila klijenta umesto da samo grid bude scrollable a stranica fiksna."*

On the client profile page, horizontal overflow affects the entire page
(outer `<body>` gets a scrollbar) instead of being contained to the inner
grid/table.

**Fix**
- Add `overflow-x-hidden` on the page wrapper.
- Wrap the grid/table in a scoped scroll container: `<div className="overflow-x-auto">`.
- Check for stray `min-width`, wide tables without `w-max`/`table-fixed`, or hero images with explicit pixel widths that force outer overflow.

**Acceptance**
- Profile page: body never has a horizontal scrollbar at any viewport width ≥ 320px.
- Inner grid scrolls horizontally only when its content requires it.

---

### 14. Filter toggles: brand color + knob visibility
**Original:** *"toogle u filterima nije dobra boja, kad se aktivira ne vidi se kuglica. I boja treba da bude nova zelena."*

The toggle switches in product filters (e.g. "On sale", "New") have a color
issue: when turned on, the moving knob/circle is barely visible (low
contrast), and the track color should use the site's new olive-green palette
(established in commit `f8ed7a6` — "unified olive palette").

**Fix**
- Locate the toggle component (`src/components/` — shared Toggle/Switch).
- Active-state track: use the olive green brand color (same token used by buttons / pill bar).
- Knob: ensure it's pure white (`bg-white`) with enough shadow/border to be visible on the active track.
- Verify both `checked` and `unchecked` states have at least 3:1 contrast for the knob.

**Acceptance**
- Toggle knob clearly visible in both states.
- Active track color matches the olive-green used elsewhere in the site (e.g. category pills, CTA buttons).

---

## P3 — Requires tradeoff decision

### 15. Disable pinch-zoom on the app
**Original:** *"ugasiti zoom in i out na celoj aplikaciji."*

Request is to globally disable zoom on the app (both desktop Ctrl+scroll and
mobile pinch).

> **⚠ Accessibility note** — disabling zoom removes a critical accessibility
> feature for low-vision users. Many jurisdictions' accessibility guidelines
> (WCAG 2.1 SC 1.4.4 "Resize text" and mobile equivalents) consider
> `user-scalable=no` a failure. Confirm this is really wanted before shipping.
> Alternative: leave zoom enabled but fix the specific layout issue that
> prompted the request (often it's a layout-shift bug on zoom, not zoom
> itself).

**If still proceeding**
- In `src/app/layout.tsx`, set the viewport meta:
  ```tsx
  export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
  ```
- Desktop Ctrl+scroll zoom is a browser-level action and **cannot** be disabled reliably; only mobile pinch is affected by the viewport meta. Document that limitation in the PR.

**Acceptance**
- Mobile pinch-to-zoom is disabled.
- The original layout issue (if any) that motivated this is verified as resolved — not just masked by removing zoom.

---

## Suggested order of work

1. **Ship P0 in one PR per item** (#1–#5) — these are security/revenue/integrity. Each gets its own PR + test.
2. **Ship P1 in focused PRs** (#6–#12) — grouped naturally: #6 alone, #7 alone, #8+#9 together (both touch order status), #10 alone, #11 alone, #12 alone.
3. **Ship P2** (#13, #14) in a single "UI polish" PR.
4. **Decide on P3** (#15) — bring the a11y concern to product before writing code.

For each PR: unit test or e2e test the acceptance criteria above. Where a DB migration is involved (#2 nullable `priceB2c`, potentially #5 nulling legacy review images), run `prisma migrate deploy` against the Render prod DB as part of deploy.
