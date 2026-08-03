
# Feature Collection — Fixes & Improvements

Status: **ALL 16 FEATURES IMPLEMENTED** (2026-08-03)
Stack context: Next.js 16 (App Router), next-auth v5, Prisma + PostgreSQL, Zustand (`src/lib/stores`), i18n via `src/lib/i18n/translations/{sr,en,ru}.json`, Swiper already installed.

## Implementation status & deployment notes

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Guest favorites + merge on login | ✅ | Guest wishlist in localStorage (`altamoda-wishlist`), union-merged via `POST /api/wishlist/merge` on login/registration; checkout draft persisted (`altamoda-checkout-draft`) survives the login redirect and restores the exact step; registration pre-filled from checkout data. |
| 2 | Guest checkout | ↩️ REVERTED by decision (2026-08-03) | Guests can NOT place orders — the viewer's role decides what they may order and at which price, so an account is required. Guests still walk ALL checkout steps (gate: Login / Register / Nastavi kao gost); the final button reads "Prijavi se i poruči" and sends them to login; after login they return to the SAME step with cart, address, and note intact (verified e2e). `/api/orders` requires auth again. The `20260803120000_guest_orders` migration (nullable `Order.userId` + guest columns) stays in place — harmless, and downstream code remains null-safe. |
| 3 | Contact page i18n | ✅ | Was already ~95% translated; last hardcoded string (hero image alt) moved to `contact.heroImageAlt`. |
| 4 | B2B/B2C visibility | ✅ | Enforced server-side in list/search/detail APIs and SSR payloads; B2C gets 404 on professional product URLs (API + client screen); B2B prices never serialized into cached HTML — B2B users fetch live prices client-side. |
| 5 | Proizvodi dropdown | ✅ | Panels now centered under the full-width nav bar (can't overflow viewport); Oksidanti & Dekoloranti merged under Kolor; all column headers are category-filter links (`nega`, `stajling`, `pribor`, `kolor`). |
| 6 | Clickable Tip kose / Tip proizvoda | ✅ | Values link to `/products?hairType=…` / `?productType=…` with the filter applied. |
| 7 | Filter typography | ✅ | Section/sub-section headers CAPS; values sentence-cased (sr locale); brand/product-line names keep official casing. |
| 8 | Admin default image | ✅ | Star toggle on each image in the admin form; deleting the primary promotes the next; product cards and gallery use the primary first. |
| 9 | Search-aware brand facet | ✅ | `/api/products` returns `facets.brandIds` for the current result set; brand pills hide brands with no matches (selected brands always stay visible). |
| 10 | Code out of product name | ✅ | The bracketed codes turned out to be **SKUs** (e.g. "(1140)"), not EANs — extraction handles both. 334 names cleaned in the dev DB. PDP shows "Šifra proizvoda" (translatable) with the SKU. **Deploy: run `npx tsx scripts/strip-ean-from-names.ts` once against production (use `--dry-run` first).** |
| 11 | Tab order + default | ✅ | Maloprodaja → Business → Svi proizvodi; Maloprodaja is default; SSR pre-renders the retail view to match. |
| 12 | Cart items link to product | ✅ | Image + name link to `/products/[id]`; quantity/remove controls unaffected. |
| 13 | Bold brand name | ✅ | `font-bold` on the brand link above the product name. |
| 14 | Gallery slider + swipe | ✅ | Swiper: single-row thumbnails (4 visible, arrows when more), main image touch-swipeable and synced with thumbnails on all viewports. |
| 15 | Flexible price requirement | ✅ | At least one price required (form + API); only-B2B price ⇒ professional product, only-B2C ⇒ retail, both ⇒ both audiences. B2B-only products still mirror the B2B price into the NOT-NULL `priceB2c` column — the storefront masks it everywhere for non-B2B viewers. |
| 16 | Complete review step | ✅ | Review now shows the order note (with edit link), totals block, and country in the address; guest contact was already shown. |

Known pre-existing issues (not part of this work): 6 failing unit tests asserting old branding/colors; `npm run build` static prerender needs a DB connection that accepts the configured SSL mode (fails on local Postgres without SSL); 3 pre-existing ESLint errors (Header hydration/search effects, `ams-import` prefer-const).

---

## 1. Guest favorites + session persistence + merge on login/registration

### Is it possible?
**Yes.** This is a standard "anonymous session merge" pattern and our stack supports it fully. Zustand with the `persist` middleware stores guest state in `localStorage` (survives page refresh and even browser restart, which is better than a pure server session). On login/registration we merge that local state into the user's DB records.

### How to implement

1. **Guest favorites (wishlist)**
   - Allow the "add to favorites" (heart) action for non-authenticated users everywhere it exists (product cards, product details).
   - Store guest favorites in a Zustand store persisted to `localStorage` under a key like `guest-wishlist` (same pattern as the cart in `CartProvider` / `src/lib/stores`).
   - The wishlist page (`src/app/wishlist`) reads from the guest store when there is no session, and from the DB when the user is logged in.

2. **Merge on login / registration**
   - Create an API endpoint, e.g. `POST /api/wishlist/merge`, that accepts a list of product IDs.
   - After a successful sign-in or registration (client-side, right after `signIn()` resolves), if `guest-wishlist` is non-empty:
     - call the merge endpoint,
     - the server inserts the items into the user's wishlist using **union semantics** (skip duplicates, never overwrite what the user already had),
     - on success, clear the `localStorage` guest store.
   - Same mechanism applies to the guest **cart** (merge quantities: if the same product exists in both, keep the larger quantity or sum — decision: **keep guest quantity**, since it reflects the user's latest intent).

3. **Order requires authentication → return to checkout step**
   - Guest can browse, favorite, and fill the cart freely.
   - When the guest clicks "Order" / proceeds past the cart, show a gate screen with three options: **Login**, **Register**, **Continue as guest** (see Feature 2).
   - For Login/Register, redirect with `callbackUrl=/checkout` (next-auth v5 supports this natively) so the user lands back exactly where they left off.

4. **Preserving filled form data (address, contact info, note…)**
   - Persist the checkout form state (shipping address, phone, note, chosen delivery/payment method, current step index) to `localStorage` on every change (debounced), key e.g. `checkout-draft`.
   - When the checkout page mounts, rehydrate the form from `checkout-draft` if present.
   - If the user registers at the payment step, pre-fill the registration form with the data they already typed (name, email, phone, address) — no retyping.
   - After auth completes, the user returns to the **same step** with cart, favorites, and all form fields intact. Clear `checkout-draft` only after the order is successfully placed.

### Behavior cases

| # | Scenario | Expected behavior |
|---|----------|-------------------|
| 1.1 | Guest adds products to favorites | Heart icon toggles, items visible on wishlist page, stored locally. No login prompt. |
| 1.2 | Guest adds favorites, then **registers** in the same browser | After registration completes, all guest favorites are saved to the new account. Guest store is cleared. |
| 1.3 | Guest adds favorites, then **logs into an existing account** that already has favorites | Union merge: account keeps its old favorites + gains the guest ones. No duplicates. |
| 1.4 | Guest has items in cart + favorites, clicks "Order" | Gate screen appears: Login / Register / Continue as guest. Cart is untouched. |
| 1.5 | Guest chooses Login at the order gate | After login: cart merged, favorites merged, user is redirected back to checkout at the step they left. |
| 1.6 | Guest fills address + note in checkout, then is asked to register at the payment step | Registration form is pre-filled from the checkout data. After registering, user is returned to the payment step with products, address, and note all still filled. |
| 1.7 | Guest closes the browser and comes back later (same browser, no auth) | Favorites, cart, and checkout draft are still there (localStorage). |
| 1.8 | Guest clears browser data / uses another device | Guest state is gone — expected and acceptable; show nothing special. |
| 1.9 | Logged-in user logs out | Their favorites/cart stay in their account (DB). The local guest store starts empty again. |
| 1.10 | Order successfully placed | `checkout-draft` and guest cart are cleared; favorites remain. |

---

## 2. Guest checkout (order without registration)

Allow completing an order as a guest ("Nastavi kao gost").

- The order gate (case 1.4) gets a third option: **Continue as guest**.
- Guest checkout collects: full name, email, phone, shipping address — same form as registered checkout, just not tied to an account.
- The `Order` record stores these fields directly with `userId = null` (add nullable guest fields to the Prisma `Order` model if not already present: `guestEmail`, `guestName`, `guestPhone`).
- Order confirmation + status emails go to the guest email.
- **Restriction:** guest checkout is **B2C only** — B2B prices/products require a verified B2B account, so guests always order at B2C prices.
- After a guest order, offer a one-click "Create an account" prompt on the confirmation page, pre-filled with their data; if they accept, attach the just-placed order to the new account.
- If a guest enters an email that already belongs to an account, allow the order anyway but show a hint: "An account with this email exists — log in to track your order."

---

## 3. Contact page — full translatability

Every visible string on the contact page (`src/app/contact`) must come from the language files.

- Audit the page for hardcoded text (headings, labels, placeholders, button text, success/error messages, working hours, address labels).
- Move all of them into `src/lib/i18n/translations/sr.json`, `en.json`, `ru.json` under a `contact.*` namespace.
- Verify by switching language via `LanguageToggle` — no string on the page may remain in a single language.

---

## 4. B2B / B2C product & price visibility rules

Visibility matrix:

| Viewer | B2C products | B2C prices | B2B products | B2B prices |
|--------|:---:|:---:|:---:|:---:|
| Guest (not logged in) | ✅ visible | ✅ visible | ✅ visible | ❌ hidden |
| Registered **B2C** user | ✅ visible | ✅ visible | ❌ **completely hidden** | ❌ hidden |
| Registered **B2B** user | ✅ visible | ✅ visible | ✅ visible | ✅ visible |

Key rules:

- **Guests** see the full catalog but B2B prices are never rendered (show "Price available for business accounts" / translatable label, or hide the price block).
- **B2C users must not be able to reach B2B products by any path**: regular listing, search, filters, brand pages, category pages, direct URL to product details, sitemap, or API responses. This must be enforced **server-side** in every product query (`src/lib/cached-queries.ts`, product API routes, search endpoint) — not just hidden in the UI. A B2C user opening a B2B product URL directly gets a 404.
- **B2B users** see everything, with B2B prices displayed.
- The audience filter tabs (see Feature 11) for a B2C user should not even show the BUSINESS option.

---

## 5. "Proizvodi" navbar dropdown — positioning + structure + clickable headers

Three fixes in the mega-dropdown in `src/components/Header.tsx`:

1. **Overflow fix:** the dropdown currently extends past the right edge of the screen. Reposition it (shift left / align to viewport, e.g. `right: 0` relative to the container or recompute position with a max-width clamp) so it **always fits within the screen width**, at every viewport size where it renders.
2. **Restructure columns:** "Oksidanti i dekoloransi" is **not** a top-level category — it is a subcategory of **Kolor**. Move its entries below/under the Kolor column and remove the standalone column.
3. **Clickable headers as filters:** every column header (Kolor, Pribor, Stajling, Nega kose, …) must be a link that navigates to the products page with that category filter applied, e.g. `/products?category=kolor`. Clicking a header lists all products of that category; clicking a sub-item applies the subcategory filter as it does now.

---

## 6. Clickable attribute tags on product details

On the product details page (`src/app/products/[id]`), the values shown for **Tip kose** and **Tip proizvoda** become links.

- Clicking a value navigates to the products page with that filter pre-applied.
- Example: product has `Tip kose: Suva kosa` → clicking "Suva kosa" navigates to `/products?tipKose=suva-kosa` and the list shows only products with that hair type, with the filter visibly checked in the sidebar.
- Same behavior for `Tip proizvoda`, and for `Šifra proizvoda`'s neighbors if more tag rows are added later (brand is already/should be clickable the same way).

---

## 7. Filter sidebar — consistent typography

Unify the text casing pattern in the products-page filter sidebar:

- **Section headers** (e.g. BREND, KATEGORIJA, TIP KOSE): ALL CAPS.
- **Subcategory headers** inside a section: also ALL CAPS.
- **All filter values** (checkbox/option labels) inside sections and subsections: **Sentence case** — first letter capital, the rest lowercase (e.g. "Suva kosa", not "SUVA KOSA" or "suva kosa").
- Apply via CSS (`text-transform`) where possible so the rule holds for data-driven values regardless of how they are stored in the DB.

---

## 8. Admin: default (primary) product image

- In the admin product edit form, when a product has multiple images, the admin can mark **one image as default** (e.g. star/radio toggle on each thumbnail).
- Persist it in Prisma (either `isDefault` boolean on the product-image relation or `defaultImageId` on `Product`); exactly one default per product, with a sensible fallback (first image) when none is chosen.
- The default image is:
  - the image shown on **product cards** in all listings, and
  - the **first/main image** on the product details page (gallery starts from it).

---

## 9. Search-aware brand facet (no empty brand filters)

- Current behavior: searching e.g. "šampon" filters products, but the brand filter still lists **all** brands.
- New behavior: the brand facet (and ideally all facets) must be computed **from the current result set** — after searching "šampon", only brands that actually have at least one matching product are listed.
- Implementation: the products/search query returns facet counts (`GROUP BY brand` over the filtered set) and the sidebar renders only brands with `count > 0` (optionally showing the count).
- The same principle applies when any other filter is active: facets always reflect what is reachable from the current selection.

---

## 10. EAN code out of product name → "Šifra proizvoda" attribute

- Some product names contain the EAN code in brackets, e.g. `Šampon XYZ (8606012345678)`.
- **Rule: the EAN code must never appear in the product name** — not in listings, search results, cart, or details.
- Instead, show it on the product details page as a new attribute row in the same design/place as *Tip kose* / *Tip proizvoda* below the product name:
  - Label: **Šifra proizvoda** — translatable via the language files (`sr`: "Šifra proizvoda", `en`: "Product code", `ru`: "Артикул").
  - Value: the EAN code.
- Implementation: store EAN in its own DB field. Run a one-time cleanup/migration script that extracts `(\d{8,14})`-style codes from existing names into the EAN field and strips them from the name. Apply the same extraction in the import pipeline (`src/lib/ams-import.ts`) so future imports never reintroduce codes into names.

---

## 11. Product list audience tabs — order and default

On the products page the tabs currently read: SVI PROIZVODI, MALOPRODAJA, BUSINESS.

- **New order:** `MALOPRODAJA · BUSINESS · SVI PROIZVODI`.
- **Default selection: MALOPRODAJA** (when the user lands on the products page with no explicit choice).
- Interaction with Feature 4: for guests, BUSINESS products are listed but without B2B prices; for **B2C users the BUSINESS tab (and SVI PROIZVODI's B2B portion) must not be available at all**; B2B users see all three tabs.

---

## 12. Cart items link to product details

- In the cart (page and/or mini-cart), the product **image and product name** are links to that product's details page.
- Clicking either navigates to `/products/[id]`; quantity controls and the remove button keep their current behavior (clicks on them must not trigger navigation).

---

## 13. Brand name bold on product details

- On the product details page, the brand name displayed above the product name gets **bold** font weight. (It should also remain/become a clickable link to that brand's product list — consistent with Feature 6.)

---

## 14. Product details gallery — thumbnail slider + mobile swipe

- **Desktop:** thumbnails must not wrap into multiple rows. Show **one row of ~4 thumbnails as a slider** (prev/next arrows or drag) when there are more images. Clicking a thumbnail sets the main image; the default image (Feature 8) is first.
- **Mobile:** the main image becomes **swipeable** — swiping left/right with a finger changes the displayed image (like sliding the current image away), with the usual dots/thumbnail sync.
- Use **Swiper** (already in `package.json`) for both: a thumbs-synced Swiper pair on desktop, touch-enabled main Swiper on mobile.

---

## 15. Admin product creation — flexible price requirement

Change the price validation when creating/editing a product manually in the admin panel:

- Neither **B2C price** nor **B2B price** is individually mandatory.
- Validation rule: **at least one of the two prices must be entered**; zero prices entered → validation error ("Enter at least one price").
- The entered prices determine the product's audience type automatically:
  - only B2C price → product is **B2C**,
  - only B2B price → product is **B2B**,
  - both → product is available to both audiences (B2C sees B2C price, B2B sees both per Feature 4).
- Apply the rule in both the form UI and the server-side zod validation (`src/lib/validations`).

---

## 16. Checkout review step — show everything the user entered

The final review step (before payment) in `src/app/checkout` must display **all** information collected during checkout:

- products with quantities and prices + totals (subtotal, shipping, discount, grand total),
- shipping address and contact details,
- selected delivery method and payment method,
- **the order note** — currently missing; must be shown,
- for guest checkout (Feature 2): the guest's contact data.

Each section on the review step should have an "Edit" action that jumps back to the relevant step without losing any other data (consistent with the draft persistence from Feature 1).

---

## Suggested implementation order

1. **Feature 4** (B2B/B2C visibility) — security/business-critical, server-side.
2. **Feature 1 + 2** (guest favorites/cart merge + guest checkout) — biggest UX/conversion win, one connected work stream.
3. **Feature 16** (review step completeness) — small, finishes the checkout stream.
4. **Features 10, 15, 8** (EAN field, price rules, default image) — data model + admin changes, related to each other.
5. **Features 5, 6, 7, 9, 11, 12, 13, 14** — UI/UX fixes, can be done in parallel.
6. **Feature 3** (contact page i18n) — independent, anytime.
