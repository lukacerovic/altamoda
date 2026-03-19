# Alta Moda — TODO / Progress Tracker

## PHASE 1: Foundation ✅ COMPLETE
**Covers:** REQ 1 (user types + auth) | **Branch:** `phase-1-foundation`

### Step 1.1 — Install Dependencies & Configure ✅
- [x] Install: prisma, @prisma/client, @prisma/adapter-pg, next-auth, zod, bcryptjs, zustand, tsx, dotenv
- [x] Install dev: @types/bcryptjs
- [x] Create `.env` with real DATABASE_URL, AUTH_SECRET, AUTH_URL
- [x] `.env.example` already existed
- [x] `.gitignore` includes `.env`
- [x] `prisma.config.ts` created for Prisma 7

### Step 1.2 — Extract Mock Data ✅
- [x] Created `src/data/mocked_data.ts` (1,457 lines)
- [x] Extracted ALL hardcoded data from 20 page files
- [x] 60+ TypeScript interfaces defined
- [x] Blog/seminar data excluded

### Step 1.3 — Prisma Schema & Migration ✅
- [x] `prisma/schema.prisma` — 26 tables with all enums, relations, indexes
- [x] Migration applied (`20260319145436_init`)

### Step 1.4 — Seed Database ✅
- [x] `prisma/seed.ts` — seeds users, brands, product lines, categories, products, images, colors, attributes, banners, promo codes, shipping zones, orders, reviews, newsletter, FAQs, ERP logs
- [x] 3 user types seeded: admin, B2B (approved), B2C
- [x] Passwords hashed with bcryptjs

### Step 1.5 — Shared Utilities ✅
- [x] `src/lib/db.ts` — Prisma client singleton (with PrismaPg adapter)
- [x] `src/lib/constants.ts` — Currency, thresholds, pagination defaults
- [x] `src/lib/utils.ts` — formatPrice, slugify, generateOrderNumber
- [x] `src/lib/api-utils.ts` — successResponse, errorResponse, ApiError, withErrorHandler, getPaginationParams
- [x] `src/lib/validations/user.ts` — login, registerB2c, registerB2b schemas
- [x] `src/lib/validations/product.ts` — createProduct, productFilter schemas
- [x] `src/lib/validations/order.ts` — createOrder, updateStatus schemas
- [x] `src/lib/validations/common.ts` — pagination, id schemas

### Step 1.6 — Authentication ✅
- [x] `src/lib/auth.config.ts` — Edge-compatible NextAuth config (callbacks, authorized)
- [x] `src/lib/auth.ts` — Credentials provider with bcrypt validation
- [x] `src/lib/auth-helpers.ts` — requireAuth, requireAdmin, requireB2b, getCurrentUser
- [x] `src/app/api/auth/[...nextauth]/route.ts` — GET/POST handlers
- [x] `src/app/api/users/route.ts` — POST register (B2C instant, B2B pending)
- [x] `src/app/api/users/me/route.ts` — GET/PUT current user
- [x] `src/types/next-auth.d.ts` — Session type augmentation

### Step 1.7 — Route Protection Middleware ✅
- [x] `src/middleware.ts` — Protects /admin, /account, /quick-order, /checkout
- [x] Edge-compatible (uses auth.config.ts, no Node.js crypto)

### Step 1.8 — Wire Login/Register Page ✅
- [x] Login form → signIn("credentials", {...})
- [x] B2C register → POST /api/users → auto-login
- [x] B2B register → POST /api/users with salon data → "zahtev primljen" message
- [x] OAuth buttons → alert("Uskoro dostupno")
- [x] Error/success messages displayed

### Step 1.9 — Wire Admin Layout ✅
- [x] Session-based user name/email display
- [x] Logout button works (signOut)
- [x] Blog/seminar nav items removed

### Step 1.10 — Auth Provider ✅
- [x] `src/components/providers/AuthProvider.tsx` — SessionProvider wrapper
- [x] `src/app/layout.tsx` — wrapped with AuthProvider
- [x] `src/lib/stores/auth-store.ts` — Zustand store

### Additional work done (beyond original plan):
- [x] **Account page differentiated by role:** B2C (orders + wishlist), B2B (orders + wishlist + prices/rabat + balance + loyalty), Admin (redirects to /admin)
- [x] **Header User icon** — links to /account (logged in) or /account/login (not logged in)
- [x] **Admin Products page** — completely rewritten with 8-tab slide-over panel (basic, pricing, content, media, stock, color, SEO, attributes)
- [x] **Admin Actions page** — new page for creating sales/promotions with product assignment, discount types, scheduling, audience targeting
- [x] **Removed unused admin pages:** analytics, promo-codes, banners, erp, seo, import
- [x] **Admin nav restructured:** Main (Dashboard, Proizvodi, Porudžbine, Korisnici), Prodaja (Akcije, Paketi), Sistem (Newsletter, Podešavanja)
- [x] **plan.md updated** — all blog/seminar references removed

---

## PHASE 2: Product Catalog ✅ COMPLETE
**Covers:** REQ 2 (products), REQ 4 (categories/filters/search), REQ 5 (colors)

**Goal:** Products served from database. Filters, search, categories, and color chart all work with real data.

### Step 2.1 — Product APIs ✅
- [x] `GET /api/products` — List with filters (category, brand[], priceMin/Max, search, sort, pagination, dynamic attributes). B2B visibility + guest visibility tabs (all/b2c/b2b).
- [x] `POST /api/products` (admin) — Create product with auto-slug, auto-SKU, color data, images
- [x] `GET /api/products/[id]` — Full detail with images, brand, product_line, category, color_data, attributes, avg rating, review count, related products
- [x] `PUT /api/products/[id]` (admin), `DELETE /api/products/[id]` (admin, soft delete)
- [x] `GET /api/products/search?q=` — Autocomplete by name, SKU, brand (top 5)

### Step 2.2 — Category, Brand, Attribute APIs ✅
- [x] `GET /api/categories` — Full tree (recursive). `POST` (admin)
- [x] `GET/PUT/DELETE /api/categories/[id]`
- [x] `GET /api/brands` — All active brands with product lines. `POST` (admin)
- [x] `GET /api/attributes` — All with `show_in_filters=true` + options. `POST` (admin)
- [x] `PUT/DELETE /api/attributes/[id]`

### Step 2.3 — Color Chart API ✅
- [x] `GET /api/products/colors?brandLine=majirel` — Colors grouped by level × undertone, brand line tabs

### Step 2.4 — File Upload ✅
- [x] `POST /api/upload` — Image/video/gif upload to local /public/uploads, type+size validation

### Step 2.5 — CSV Import ✅
- [x] `POST /api/products/import` — Parse CSV, validate, create/update by SKU, return {created, updated, errors[]}

### Step 2.6 — Connect Product Listing Page ✅
- [x] Split products/page.tsx → server page.tsx + ProductsPageClient.tsx
- [x] Server fetches initial products, brands, categories, attributes from DB
- [x] Client fetches via /api/products on filter/search/sort/page changes
- [x] Guest visibility tabs: "Svi proizvodi", "Maloprodaja", "Profesionalno"

### Step 2.7 — Connect Product Detail Page ✅
- [x] Split products/[id]/page.tsx → server page.tsx + ProductDetailClient.tsx
- [x] Fetch product by id or slug with all relations, reviews, related items
- [x] generateMetadata() for SEO (title, description, OG image)
- [x] B2B price display for B2B users, B2B hint for guests

### Step 2.8 — Connect Color Chart Page ✅
- [x] Split colors/page.tsx → server page.tsx + ColorsPageClient.tsx
- [x] Server fetches brand line tabs + initial colors
- [x] Client fetches from /api/products/colors on brand/filter changes

### Step 2.9 — Connect Homepage ✅
- [x] Split page.tsx → server page.tsx + HomePageClient.tsx
- [x] Server fetches: featured (isFeatured), bestsellers, new arrivals (isNew), sale products (oldPrice), with avg ratings
- [x] Blog and seminar sections removed

### Step 2.10 — Wire Admin Products to API ✅
- [x] Admin loads products from GET /api/products on mount
- [x] Create product → POST /api/products
- [x] Edit product → PUT /api/products/[id]
- [x] Delete product → DELETE /api/products/[id] (soft delete)
- [x] Bulk actions (activate/deactivate/delete) → API calls per product
- [x] Loading/saving states

### PHASE 2 — DONE:
- [x] Products page loads real products with working filters
- [x] Dynamic attributes from DB power filter sidebar
- [x] Search "majirel" → shows matching products via API
- [x] Color chart with brand line tabs, level/undertone filters
- [x] Guest sees all products with visibility tabs
- [x] B2C logged in → hides professional products
- [x] B2B logged in → sees B2B prices
- [x] Homepage shows real data from database
- [x] Admin CRUD wired to API
- [ ] Homepage shows real data in all sections

---

## PHASE 3: Cart, Wishlist, Orders & Quick Order ⬜
**Covers:** REQ 3 (promo codes), REQ 6 (wishlist/reviews), REQ 14 (quick order), REQ 15 (orders) partial

### Step 3.1 — Zustand Cart Store
- [ ] `src/lib/stores/cart-store.ts` — items, add, remove, updateQty, clearCart
- [ ] Guest: localStorage. Logged-in: sync to DB
- [ ] `src/components/providers/CartProvider.tsx` — load cart on mount, merge on login

### Step 3.2 — Cart & Wishlist APIs
- [ ] GET/POST /api/cart, PUT/DELETE /api/cart/[itemId], POST /api/cart/merge
- [ ] GET/POST/DELETE /api/wishlist

### Step 3.3 — Promo Code Validation
- [ ] POST /api/promo-codes/validate — check code, dates, limits, audience, min order

### Step 3.4 — Order APIs
- [ ] GET /api/orders (user list or admin list)
- [ ] POST /api/orders — validate stock, snapshot prices, calc totals, decrement stock, generate order number
- [ ] GET /api/orders/[id] — detail with items + status history
- [ ] PATCH /api/orders/[id]/status (admin) — change status, log history

### Step 3.5 — Reviews API
- [ ] GET /api/reviews?productId=X, POST /api/reviews (rate 1-5, one per user)

### Step 3.6 — B2B Quick Order API
- [ ] SKU lookup, CSV upload parse, repeat previous order

### Step 3.7 — Checkout Page (NEW)
- [ ] src/app/checkout/page.tsx — address, shipping, promo, payment, review
- [ ] src/app/checkout/confirmation/page.tsx — order summary

### Step 3.8 — Wire Existing Pages
- [ ] cart/page.tsx → Zustand cart, real promo, delivery options
- [ ] wishlist/page.tsx → API toggle/remove, add to cart
- [ ] quick-order/page.tsx → SKU search, CSV upload, repeat order

### PHASE 3 — DONE WHEN:
- [ ] Guest → login → cart preserved
- [ ] Promo code works at checkout
- [ ] Order placed → stock decremented → order number shown
- [ ] B2B invoice order works
- [ ] Quick order all 3 tabs work
- [ ] Wishlist + star ratings work

---

## PHASE 4: Payment & Shipping ⬜
**Covers:** REQ 12 (card payment), REQ 15 (delivery + emails)

- [ ] Serbian PSP integration (Allpay.rs or PaySpot)
- [ ] D Express shipping integration (shipment creation, tracking, rate calculation)
- [ ] Email notifications via Resend (order confirmation, shipping, welcome, B2B approval)
- [ ] B2B invoice PDF generation

---

## PHASE 5: Admin Backend ⬜
**Covers:** REQ 7 (admin), REQ 3 (promotions admin)

- [ ] Dashboard with real stats (revenue, orders, users, top products, low stock)
- [ ] Admin products wired to CRUD API
- [ ] Admin orders wired to real data + status changes
- [ ] Admin users — B2B approval workflow, role management
- [ ] Admin actions (sales) wired to promotions API
- [ ] Admin bundles wired to API
- [ ] Admin newsletter wired to API
- [ ] Admin settings wired to API

---

## PHASE 6: ERP Integration (Pantheon) ⬜
**Covers:** REQ 8

- [ ] Pantheon API client
- [ ] Inbound sync: products (daily), stock (5 min), prices (hourly)
- [ ] Outbound sync: orders (real-time), new customers
- [ ] Admin ERP page with sync controls and logs
- [ ] Scheduled jobs (Inngest or cron)

---

## PHASE 7: i18n, SEO & Newsletter ⬜
**Covers:** REQ 13 (multilingual), REQ 10 (SEO), REQ 9 (newsletter automations)

- [ ] next-intl setup (sr-Latn / sr-Cyrl)
- [ ] Translation files, locale routing, LanguageToggle upgrade
- [ ] generateMetadata() on all server pages
- [ ] sitemap.ts, robots.ts, JSON-LD structured data
- [ ] Newsletter first-purchase popup, campaign sending, automations

---

## PHASE 8: Polish & Production ⬜
**Covers:** REQ 11 (technical), REQ 16 (FAQ)

- [ ] Rate limiting on login, register, orders
- [ ] Input validation (Zod) on ALL API routes
- [ ] GDPR: cookie consent backend, data export, account deletion
- [ ] Performance: Next.js Image everywhere, Suspense, error boundaries
- [ ] Testing: API unit tests, E2E full purchase flow
- [ ] FAQ page wired to real data
- [ ] outlet/page.tsx → products with active promotions
- [ ] account/page.tsx → real orders, loyalty, B2B balance
- [ ] Lighthouse: performance > 90, SEO > 95

---

## Notes
- **Removed features:** Blog, Seminars (removed from plan and codebase)
- **Removed admin pages:** Analytics (merged into Dashboard), Promo Codes, Banners, ERP, SEO, Import/Export
- **Added:** Admin Actions page (sales/promotions management)
- **Test accounts:** admin@altamoda.rs / admin123, salon.glamour@gmail.com / user123, marija@gmail.com / user123
- **Database:** PostgreSQL 17 at localhost:5432/altamoda (user: postgres)
