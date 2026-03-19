# Alta Moda — Full-Stack Implementation Plan

## What We Have

A complete UI/UX prototype built with Next.js 16, React 19, TailwindCSS 4:
- **12 client pages** (homepage, products, product detail, colors, cart, wishlist, quick order, outlet, salon locator, FAQ, account/login)
- **13 admin pages** (dashboard, products, orders, users, analytics, banners, promo codes, bundles, newsletter, ERP, import, SEO, settings)
- **All hardcoded mock data** — zero backend exists

## What We're Building

A production B2B + B2C e-commerce platform for hairdressing products, based on the 16 requirements below.

## Architecture Principle

**Server wrapper → Client component.** Every existing `"use client"` page stays untouched. We add a thin server `page.tsx` wrapper that fetches real data and passes it as props to the renamed `*Client.tsx` component. This means zero UI rewrite.

---

## The 16 Requirements — Mapped to Implementation

### REQ 1: B2B + B2C Web Shop (User Types & Access Levels)

**What it means:**
- Two types of customers: B2C (retail) and B2B (salons/hairdressers)
- B2B users register with PIB (tax ID) and matični broj (business reg number), need admin approval
- Different prices per user type
- Some products visible only to B2B (e.g. professional litre-size shampoos, hair dyes)
- B2C users don't see B2B-only products at all (no clutter)

**What we build:**
- `users` table with role ENUM (b2c, b2b, admin)
- `b2b_profiles` table with salon_name, pib, maticni_broj, discount_tier, approved_at
- Registration flow: B2C → instant active; B2B → pending until admin approves
- Login with email+password (NextAuth.js)
- Middleware protecting admin routes, B2B-only routes
- Product visibility filter: `is_professional=true` products hidden from B2C users entirely
- Price display: B2C sees `price_b2c`, B2B sees `price_b2b` (or tiered discount)

**Affected pages:**
- CLIENT: `account/login/page.tsx` (register/login), `account/page.tsx` (dashboard)
- ADMIN: `admin/users/page.tsx` (B2B approval workflow)

---

### REQ 2: Products (Product Page)

**What it means:**
- Rich product pages: multiple images, video, GIF
- Content: description, ingredients, usage instructions, brand, product line, category
- Pricing: regular price + sale price
- Stock status: in stock / out of stock
- Actions: add to cart, add to wishlist, rate product (stars 1-5)
- Related products: same line, recommended
- For hair dyes: level, undertone, shade chart

**What we build:**
- `products` table with all fields (sku, name, brand, category, prices, stock, etc.)
- `product_images` table (multiple per product, type: image/video/gif, sort order, primary flag)
- `color_products` extension table (level, undertone_code, hex_value, shade_code)
- `reviews` table (product_id, user_id, rating 1-5, UNIQUE per user per product)
- Product detail API returning full product with images, brand, category, color data, reviews, related products
- Related products logic: same category or same product line

**Affected pages:**
- CLIENT: `products/[id]/page.tsx` (product detail)
- ADMIN: `admin/products/page.tsx` (product CRUD with image upload)

---

### REQ 3: Sales, Discounts, Promo Codes

**What it means:**
- Discounts by category, brand, or individual product
- Clearly visible: old price / new price, % discount, badge (AKCIJA, -20%, NOVO)
- Admin can enter either the discount % (system calculates new price) OR the new price (system calculates %)
- Promo codes: code, type (% or fixed), value, min order, max uses, audience (B2B/B2C/all), date range
- "Akcije" (Sales) page on the site where users see all active promotions

**What we build:**
- `promotions` table: name, type, value, target (product/category/brand/all), audience, dates, active
- `promo_codes` table: code, type, value, limits, audience, dates
- Product query: when promotion is active for a product, return calculated `old_price` and `sale_price`
- Outlet/Akcije page: query all products with active promotions
- Promo code validation API: check code, dates, limits, audience, min order
- Admin: create/edit promotions and promo codes, enter % or price (other is calculated)

**Affected pages:**
- CLIENT: `outlet/page.tsx` (Akcije page), `cart/page.tsx` (promo code input)
- ADMIN: `admin/promo-codes/page.tsx`, product edit modal

---

### REQ 4: Categories, Filtering & Search

**What it means:**
- Multi-level category tree: Kolor > Boje za kosu > Permanentne / Bez amonijaka
- Multi-select filters: brand, hair type, product type, sulfate-free, professional, price range, new/sale
- **Dynamic filters**: if admin adds a new attribute (e.g. "Veganski"), it auto-appears in filters
- Smart search: by name, SKU, brand with autocomplete
- Deleting a brand/category/line doesn't break other items — they stay where they were

**What we build:**
- `categories` table (self-referential tree with parent_id, depth, sort_order)
- `brands` table, `product_lines` table
- `dynamic_attributes` table with `show_in_filters` flag
- `dynamic_attribute_options` for select-type attributes
- `product_attributes` linking products to attribute values
- Product list API: accepts category, brand[], hairType[], priceMin/Max, attribute filters, sort, pagination
- Filter API: returns all active filter options (brands, attributes with show_in_filters=true)
- Search API: autocomplete by name, SKU, brand — returns top 5 matches
- Safe deletion: deleting a brand sets is_active=false, products remain in their categories

**Affected pages:**
- CLIENT: `products/page.tsx` (filter sidebar + search + product grid)
- ADMIN: `admin/products/page.tsx` (category/brand management), `admin/settings/page.tsx` (attribute management)

---

### REQ 5: Hair Color Management

**What it means:**
- Special structure for hair dyes: level (1-10), undertone (ash, gold, copper, etc.)
- Filter by level (e.g. all level 10 colors)
- Visual color grid display
- Structured in admin, easy to expand for new color lines
- Ability to create bundles mixing products from different categories (e.g. 10 permanent + 10 demi + oxidant + shampoo)
- Easy navigation for registered users browsing shades

**What we build:**
- `color_products` table linked to products (level, undertone, hex, shade code)
- Color chart API: GET by brand line, filter by level/undertone
- `bundles` table + `bundle_items` for cross-category product packages
- Color page: brand tabs, level × undertone grid, click → product detail or add to cart

**Affected pages:**
- CLIENT: `colors/page.tsx` (color grid)
- ADMIN: `admin/bundles/page.tsx` (bundle creation), product edit modal (color fields)

---

### REQ 6: Frontend

**What it means:**
- Modern, clean design (already done in prototype)
- Mobile first (hairdressers order from phones)
- Clear CTAs: add to cart, quick buy
- Sticky filters on category pages
- Wishlist (especially important for B2B)
- Reviews: stars 1-5 only, no comments

**What we build:**
- All existing UI stays — it already meets these requirements
- Wire wishlist to real API (toggle add/remove, persist per user)
- Wire reviews to real API (star rating, one per user per product)
- Ensure all existing mobile responsiveness is preserved

**Affected pages:**
- CLIENT: `wishlist/page.tsx`, all product cards (wishlist + review stars)

---

### REQ 7: Backend / Admin

**What it means:**
- Easy product management
- Bulk import (CSV, Excel)
- Manage: prices, promotions, bundles, user groups
- Order management: statuses, repeat orders (critical for B2B)

**What we build:**
- Product CRUD API + admin page wiring
- CSV/Excel import API (parse, validate, create/update by SKU)
- Price management: individual + bulk update
- Order management: status transitions, order history, repeat order API
- B2B user group management: approval, discount tiers

**Affected pages:**
- ADMIN: `admin/products/page.tsx`, `admin/orders/page.tsx`, `admin/import/page.tsx`, `admin/users/page.tsx`, `admin/bundles/page.tsx`, `admin/promo-codes/page.tsx`

---

### REQ 8: ERP Integration (Pantheon)

**What it means:**
- Full integration with Pantheon ERP
- Sync: products, SKUs, prices, stock, customers, orders
- Pantheon → Web: products, stock, prices (stock must always match real Pantheon stock)
- Web → Pantheon: orders, new customers
- Real-time stock sync is critical (this is how they track inventory)

**What we build:**
- `src/lib/erp/pantheon-client.ts`: HTTP client for Pantheon API
- Inbound sync: products (daily), stock (every 5 min), prices (hourly)
- Outbound sync: orders (real-time on creation), new customers (on registration)
- `erp_sync_logs` table for audit trail
- Conflict resolution: Pantheon is source of truth for stock/prices
- Admin ERP page: connection status, sync controls, sync logs

**Affected pages:**
- ADMIN: `admin/erp/page.tsx`

---

### REQ 9: Newsletter

**What it means:**
- Segmentation: B2B vs B2C subscribers
- Automations: new promotions, new products
- Pop-up with promo code for first purchase

**What we build:**
- `newsletter_subscribers` table with email, segment (B2B/B2C), subscribed status
- Subscribe API (from footer, homepage popup, checkout)
- Unsubscribe API
- First-purchase popup: generate unique promo code on signup
- Newsletter sending via Resend (segment filtering)
- Admin: subscriber list, segment filter

**Affected pages:**
- CLIENT: Homepage newsletter popup, Footer newsletter form
- ADMIN: `admin/newsletter/page.tsx`

---

### REQ 10: SEO

**What it means:**
- Per product: SEO title, meta description, SEO-friendly URL, image alt tags
- Per category: same
- Developers must not forget this!

**What we build:**
- `seo_metadata` table (entity_type, entity_id, meta_title, meta_description, canonical_url)
- `generateMetadata()` on every server component page (products, categories)
- Product images: `alt_text` field on `product_images` table
- SEO-friendly slugs on products, categories
- `sitemap.ts` for dynamic XML sitemap
- `robots.ts`
- JSON-LD structured data for products
- Admin SEO page: edit SEO fields per product/category

**Affected pages:**
- ADMIN: `admin/seo/page.tsx`
- All server component pages (metadata generation)

---

### REQ 11: Technical Notes

**What it means:**
- Fast site
- SEO optimized
- Scalable
- Secure (especially B2B data)
- GDPR / cookies

**What we build:**
- Next.js server components for fast initial loads
- Image optimization with Next.js `<Image>` component
- Rate limiting on sensitive endpoints (login, register, orders)
- Input validation with Zod on all API routes
- GDPR: cookie consent backend (wire existing CookieConsent component), data export, account deletion
- Prisma handles SQL injection prevention
- HTTPS, secure session cookies

---

### REQ 12: Card Payment

**What it means:**
- Accept card payments online

**What we build:**
- Serbian PSP integration (Allpay.rs or PaySpot — Stripe doesn't support Serbian merchants)
- Payment initiation API: create payment, redirect to 3DS
- Payment callback API: receive webhook, update order payment status
- Payment status tracking on orders

**Affected pages:**
- CLIENT: Checkout page (new), `cart/page.tsx` (proceed to checkout)
- ADMIN: `admin/orders/page.tsx` (payment status column)

---

### REQ 13: Multilingual (Cyrillic/Latin + Future Languages)

**What it means:**
- Support Latin and Cyrillic Serbian scripts
- Ability to add other languages later

**What we build:**
- `next-intl` for locale management
- URL structure: `/sr-Latn/...` and `/sr-Cyrl/...`
- Translation files: `sr-Latn.json`, `sr-Cyrl.json`
- DB content: dual columns `name_lat` / `name_cyr` on products, categories
- `LanguageToggle.tsx` upgraded to real locale switcher
- Middleware: locale detection + URL rewriting

**Affected pages:**
- ALL pages (hardcoded text → translation keys)
- `LanguageToggle.tsx` component

---

### REQ 14: Quick Order (B2B)

**What it means:**
- Hairdressers know exactly what they want — need fast ordering
- Quick order by SKU code
- Product list with quantities
- CSV upload for bulk orders

**What we build:**
- SKU lookup API: search product by code, return name + price
- CSV upload parser: columns (sku, quantity), validate SKUs, return preview
- Repeat previous order: fetch old order items, create new order with current prices
- Quick order page: all three tabs wired to real APIs

**Affected pages:**
- CLIENT: `quick-order/page.tsx`

---

### REQ 15: Orders & Delivery

**What it means:**
- Delivery: courier service (D Express), delivery method selection, configurable pricing (fixed / by amount / free above threshold)
- Order statuses: received → processing → shipped → delivered → canceled
- Email notifications: order confirmation, shipped notification with tracking link
- B2B options: order without online payment, invoice payment, minimum order amount

**What we build:**
- `orders` table with full order data (items, prices, address, status, payment, shipping)
- `order_items` with price snapshots
- `order_status_history` for audit trail
- D Express API integration: shipment creation, tracking
- `shipping_zones` + `shipping_rates` (configurable in admin)
- Email system (Resend): order confirmation, shipping notification, delivery confirmation
- B2B: payment_method='invoice', minimum order validation
- Order creation: stock check, price snapshot, order number generation (ALT-YYYY-NNNN)

**Affected pages:**
- CLIENT: `cart/page.tsx`, new `checkout/page.tsx`, `account/page.tsx` (order history)
- ADMIN: `admin/orders/page.tsx`, `admin/settings/page.tsx` (shipping config)

---

### REQ 16: FAQ

**What it means:**
- FAQ page with questions and answers

**What we build:**
- `faqs` table (question, answer, sort_order, is_active) — or simpler: manage via admin settings
- FAQ API: GET all active FAQs
- Wire existing `faq/page.tsx` to real data

**Affected pages:**
- CLIENT: `faq/page.tsx`

---

---

## Mock Data File (`src/data/mocked_data.ts`)

Before touching any pages, we extract ALL hardcoded data from the 30+ page files into one centralized file. This serves as:
1. Single source of truth during development
2. Reference for database seed script

**Data to extract:**

| Data | Source Pages | Fields |
|------|-------------|--------|
| Products (~20 unique) | homepage, products, product detail, cart, wishlist, outlet, quick-order | id, sku, name, brand, category, price, oldPrice, rating, badge, image, description, ingredients, usage, professional, stock |
| Color chart items (80 per brand) | colors page | code, hex, name, level, undertone, price, brandLine |
| Brands (8) | products page filter | name, slug |
| Category tree | products page filter | name, children (nested) |
| Hair types | products page filter | label |
| Toggle filters (7) | products page | key, label |
| Outlet products (8) | outlet page | name, brand, regularPrice, salePrice, discount, rating, image |
| Quick order products (10) | quick-order page | code (SKU), name, brand, price, category |
| Orders (5+) | admin orders, account page | orderNumber, customer, items, total, status, paymentMethod, address, timeline |
| Cart items (3) + recommended (4) | cart page | name, brand, price, quantity, image |
| Wishlist items (6) | wishlist page | name, brand, price, salePrice, badge, rating, inStock, image |
| Loyalty levels (4) | account page | name, min, max, benefits[] |
| Rabat scale (4) | account page | range, discount |
| Delivery options (3) | cart page | key, label, price, freeThreshold |
| Trust badges (4) | homepage | icon, title, desc |
| FAQ items | FAQ page | question, answer, category |
| Shipping zones (5) | admin settings | name, rate, enabled |
| Payment methods (5) | admin settings | name, description, enabled |
| Newsletter subscribers (15) | admin newsletter | email, name, type, date, status |
| ERP sync logs (10) | admin ERP | timestamp, type, direction, items, status, message |

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| Email | Resend + React Email |
| Payment | Allpay.rs or PaySpot (Serbian PSP) |
| File Storage | Cloudinary or local dev uploads |
| Search | Meilisearch (later) — start with Prisma full-text search |
| i18n | next-intl |
| Validation | Zod |
| State Management | Zustand (cart) |

---

## Database Schema (26 tables)

```
USERS & AUTH
  users                    — id, email, password_hash, name, phone, role(b2c/b2b/admin), status, avatar_url
  user_addresses           — id, user_id FK, label, street, city, postal_code, country, is_default
  b2b_profiles             — id, user_id FK UNIQUE, salon_name, pib, maticni_broj, approved_at, approved_by FK, discount_tier, credit_limit, payment_terms

CATALOG
  brands                   — id, name, slug UNIQUE, logo_url, description, is_active
  product_lines            — id, brand_id FK, name, slug UNIQUE, description
  categories               — id, parent_id FK SELF, name_lat, name_cyr, slug UNIQUE, sort_order, is_active, depth
  products                 — id, sku UNIQUE, name_lat, name_cyr, slug, brand_id FK, product_line_id FK, category_id FK, description, ingredients, usage_instructions, price_b2c, price_b2b, old_price, cost_price, stock_quantity, low_stock_threshold, weight_grams, volume_ml, is_professional, is_active, is_new, is_featured, erp_id, seo_title, seo_description
  product_images           — id, product_id FK, url, alt_text, type(image/video/gif), sort_order, is_primary
  color_products           — id, product_id FK UNIQUE, color_level(1-10), undertone_code, undertone_name, hex_value, shade_code

DYNAMIC ATTRIBUTES (REQ 4 — admin-expandable filters)
  dynamic_attributes       — id, name_lat, name_cyr, slug, type(boolean/text/number/select), filterable, show_in_filters, sort_order
  dynamic_attribute_options — id, attribute_id FK, value, sort_order
  product_attributes       — id, product_id FK, attribute_id FK, value, UNIQUE(product_id, attribute_id)

CART & WISHLIST
  carts                    — id, user_id FK nullable, session_id, created_at, updated_at
  cart_items               — id, cart_id FK, product_id FK, quantity, UNIQUE(cart_id, product_id)
  wishlists                — id, user_id FK, product_id FK, UNIQUE(user_id, product_id)

ORDERS (REQ 15)
  orders                   — id, order_number UNIQUE (ALT-YYYY-NNNN), user_id FK, status, subtotal, discount_amount, shipping_cost, total, currency(RSD), payment_method, payment_status, shipping_method, tracking_number, shipping_address JSONB, billing_address JSONB, notes, promo_code_id FK, erp_synced, erp_id
  order_items              — id, order_id FK, product_id FK, product_name, product_sku (snapshots), quantity, unit_price, total_price
  order_status_history     — id, order_id FK, status, changed_by FK, note, created_at

REVIEWS (REQ 6 — stars only)
  reviews                  — id, product_id FK, user_id FK, rating(1-5), created_at, UNIQUE(product_id, user_id)

PROMOTIONS (REQ 3)
  promotions               — id, name, type(percentage/fixed), value, target_type(product/category/brand/all), target_id, audience(b2b/b2c/all), start_date, end_date, is_active
  promo_codes              — id, code UNIQUE, type, value, min_order_value, max_uses, current_uses, per_user_limit, audience, valid_from, valid_until, is_active

BUNDLES (REQ 5)
  bundles                  — id, name_lat, name_cyr, slug, description, bundle_price, original_price, image_url, is_active
  bundle_items             — id, bundle_id FK, product_id FK, quantity

CONTENT
  banners                  — id, title, subtitle, image_url, mobile_image_url, link_url, position, sort_order, is_active

NEWSLETTER (REQ 9)
  newsletter_subscribers   — id, email UNIQUE, segment(b2b/b2c), is_subscribed, subscribed_at, unsubscribed_at

SHIPPING (REQ 15)
  shipping_zones           — id, name, cities[]
  shipping_rates           — id, zone_id FK, method(standard/express), price, free_threshold, estimated_days

SYSTEM
  erp_sync_logs            — id, sync_type, direction, items_synced, status, message, details JSONB, started_at, completed_at
  seo_metadata             — id, entity_type, entity_id, locale, meta_title, meta_description, og_title, og_description, og_image, canonical_url, UNIQUE(entity_type, entity_id, locale)
  faqs                     — id, question_lat, question_cyr, answer_lat, answer_cyr, category, sort_order, is_active
```

---

## Implementation Phases

---

### PHASE 1: Foundation
**Duration:** 3 weeks | **Covers:** REQ 1 (user types + auth)

**Goal:** Database running, users can register/login, admin panel protected, mock data seeded.

#### Step 1.1 — Install Dependencies & Configure
- [ ] Install: `prisma @prisma/client next-auth@beta @auth/prisma-adapter zod bcryptjs zustand tsx`
- [ ] Install dev: `@types/bcryptjs`
- [ ] Init Prisma: `npx prisma init --datasource-provider postgresql`
- [ ] Create `.env` (DATABASE_URL, AUTH_SECRET, AUTH_URL)
- [ ] Create `.env.example`
- [ ] Verify `.gitignore` includes `.env`

**Files:** `.env`, `.env.example`

---

#### Step 1.2 — Extract Mock Data
- [ ] Create `src/data/mocked_data.ts`
- [ ] Extract ALL hardcoded data from every page (see Mock Data table above)
- [ ] Define TypeScript interfaces for every type
- [ ] **Do NOT modify any page files yet**

**Files:** `src/data/mocked_data.ts`

**Done when:** Single file compiles, contains all data from all pages

---

#### Step 1.3 — Prisma Schema & Migration
- [ ] Write complete `prisma/schema.prisma` (all 26 tables as documented above)
- [ ] All enums, relations, indexes, unique constraints
- [ ] `@map("snake_case")` for fields, `@@map("table_name")` for models
- [ ] Run `npx prisma migrate dev --name init`

**Files:** `prisma/schema.prisma`

**Done when:** `npx prisma studio` shows all 26 tables

---

#### Step 1.4 — Seed Database
- [ ] Create `prisma/seed.ts`
- [ ] Import from `src/data/mocked_data.ts`
- [ ] Seed order: users → brands → product_lines → categories → products → product_images → color_products → dynamic_attributes → banners → promo_codes → shipping_zones → orders → newsletter_subscribers → faqs
- [ ] Hash passwords with bcryptjs
- [ ] Add seed config to `package.json`
- [ ] Run `npx prisma db seed`

**Files:** `prisma/seed.ts`, modify `package.json`

**Done when:** All tables populated, admin user can be found in Prisma Studio

---

#### Step 1.5 — Shared Utilities
- [ ] `src/lib/db.ts` — Prisma client singleton
- [ ] `src/lib/constants.ts` — Currency (RSD), free shipping threshold (5000), order prefix (ALT), pagination defaults
- [ ] `src/lib/utils.ts` — `formatPrice()`, `slugify()`, `generateOrderNumber()`
- [ ] `src/lib/api-utils.ts` — `successResponse()`, `errorResponse()`, `ApiError`, `withErrorHandler()`, `getPaginationParams()`
- [ ] `src/lib/validations/user.ts` — Zod: loginSchema, registerB2cSchema, registerB2bSchema
- [ ] `src/lib/validations/product.ts` — Zod: createProductSchema, productFilterSchema
- [ ] `src/lib/validations/order.ts` — Zod: createOrderSchema, updateStatusSchema
- [ ] `src/lib/validations/common.ts` — Zod: paginationSchema, idSchema

**Files:** `src/lib/db.ts`, `src/lib/constants.ts`, `src/lib/utils.ts`, `src/lib/api-utils.ts`, `src/lib/validations/*.ts`

---

#### Step 1.6 — Authentication (REQ 1)
- [ ] `src/lib/auth.ts` — NextAuth config:
  - Credentials provider (email + password → validate against DB)
  - JWT strategy with role, id, status in token
  - Session callback exposing role, id
  - Sign-in page: `/account/login`
- [ ] `src/lib/auth-helpers.ts` — `requireAuth()`, `requireAdmin()`, `requireB2b()`, `getCurrentUser()`
- [ ] `src/app/api/auth/[...nextauth]/route.ts` — export GET/POST
- [ ] `src/app/api/users/route.ts` — POST register (B2C instant, B2B pending)
- [ ] `src/app/api/users/me/route.ts` — GET/PUT current user

**Files:** `src/lib/auth.ts`, `src/lib/auth-helpers.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/users/route.ts`, `src/app/api/users/me/route.ts`

**Done when:** Can register B2C (instant login), register B2B (pending status), login, get user data from API

---

#### Step 1.7 — Route Protection Middleware
- [ ] `src/middleware.ts`:
  - `/admin/*` → require admin role
  - `/account` (not `/account/login`) → require authenticated
  - `/quick-order` → require B2B role
  - `/checkout` → require authenticated

**Files:** `src/middleware.ts`

**Done when:** Unauthorized access redirects to login

---

#### Step 1.8 — Wire Login/Register Page
- [ ] Modify `src/app/account/login/page.tsx`:
  - Login form → `signIn("credentials", {...})`
  - B2C register → POST `/api/users` → auto-login
  - B2B register → POST `/api/users` with salon data → show "zahtev primljen" message
  - OAuth buttons → show "uskoro dostupno"

**Modify:** `src/app/account/login/page.tsx`

---

#### Step 1.9 — Wire Admin Layout
- [ ] Modify `src/app/admin/layout.tsx`:
  - Check session server-side
  - Display real user name/email
  - Logout button works

**Modify:** `src/app/admin/layout.tsx`

---

#### Step 1.10 — Auth Provider
- [ ] `src/components/providers/AuthProvider.tsx` — SessionProvider wrapper
- [ ] Modify `src/app/layout.tsx` — wrap with AuthProvider
- [ ] `src/lib/stores/auth-store.ts` — Zustand store for client-side auth state

**Files:** `src/components/providers/AuthProvider.tsx`, `src/lib/stores/auth-store.ts`
**Modify:** `src/app/layout.tsx`

---

#### PHASE 1 — DONE WHEN:
- [ ] B2C user registers → instant login → sees account dashboard
- [ ] B2B user registers with PIB → sees "pending approval" message
- [ ] Admin logs in → sees admin panel
- [ ] Non-admin visiting `/admin` → redirected to login
- [ ] Database has all seeded data in Prisma Studio

---

---

### PHASE 2: Product Catalog
**Duration:** 2 weeks | **Covers:** REQ 2 (products), REQ 4 (categories/filters/search), REQ 5 (colors)

**Goal:** Products served from database. Filters, search, categories, and color chart all work with real data.

#### Step 2.1 — Product APIs
- [ ] `GET /api/products` — List with filters: category, brand[], priceMin, priceMax, search, sort, page, limit. Dynamic attribute filters: `attr_[slug]=value`. B2B visibility: hide `is_professional` from B2C. B2B pricing: show `price_b2b` to B2B users.
- [ ] `POST /api/products` (admin) — Create product with Zod validation, auto-slug, auto-SKU
- [ ] `GET /api/products/[id]` — Full detail: images, brand, product_line, category, color_data, attributes, avg rating, review count, related products
- [ ] `PUT /api/products/[id]` (admin), `DELETE /api/products/[id]` (admin, soft delete)
- [ ] `GET /api/products/search?q=` — Autocomplete: match name, SKU, brand, return top 5

**Files:** `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts`, `src/app/api/products/search/route.ts`

---

#### Step 2.2 — Category, Brand, Attribute APIs
- [ ] `GET /api/categories` — Full tree (recursive). `POST` (admin)
- [ ] `GET/PUT/DELETE /api/categories/[id]`
- [ ] `GET /api/brands` — All active brands. `POST` (admin)
- [ ] `GET /api/attributes` — All with `show_in_filters=true` + their options. `POST` (admin) — create new attribute → auto-appears in filters
- [ ] `PUT/DELETE /api/attributes/[id]`

**Files:** `src/app/api/categories/route.ts`, `src/app/api/categories/[id]/route.ts`, `src/app/api/brands/route.ts`, `src/app/api/attributes/route.ts`, `src/app/api/attributes/[id]/route.ts`

---

#### Step 2.3 — Color Chart API (REQ 5)
- [ ] `GET /api/products/colors?brand=majirel` — All colors for a brand line, grouped by level × undertone. Filter: level, undertone.

**Files:** `src/app/api/products/colors/route.ts`

---

#### Step 2.4 — File Upload
- [ ] `POST /api/upload` — Accept image/video/gif, validate type+size, upload to Cloudinary (or local /public/uploads for dev), return URL

**Files:** `src/app/api/upload/route.ts`, `src/lib/upload.ts`

---

#### Step 2.5 — CSV Import (REQ 7)
- [ ] `POST /api/products/import` — Parse CSV, validate rows, create/update by SKU, return {created, updated, errors[]}

**Files:** `src/app/api/products/import/route.ts`

---

#### Step 2.6 — Connect Product Listing Page
- [ ] Rename `products/page.tsx` → `products/ProductsPageClient.tsx`
- [ ] Create server `products/page.tsx`: fetch products, brands, categories, attributes from DB → pass as props
- [ ] Client: remove hardcoded data, accept props, fetch via API on filter changes

---

#### Step 2.7 — Connect Product Detail Page
- [ ] Rename `products/[id]/page.tsx` → `ProductDetailClient.tsx`
- [ ] Create server `products/[id]/page.tsx`: fetch product with all relations, reviews, related items
- [ ] Add `generateMetadata()` for SEO (REQ 10)

---

#### Step 2.8 — Connect Color Chart Page
- [ ] Rename `colors/page.tsx` → `ColorsPageClient.tsx`
- [ ] Create server wrapper, fetch brand tabs + initial colors
- [ ] Client: fetch colors from API when switching brand tab

---

#### Step 2.9 — Connect Homepage Product Sections
- [ ] Split `page.tsx` → `HomePageClient.tsx` + server `page.tsx`
- [ ] Server fetches: featured products (by category tab), bestsellers (is_featured), new arrivals (is_new), sale products (has old_price), active banners

---

#### PHASE 2 — DONE WHEN:
- [ ] Products page loads real products with working filters
- [ ] Dynamic attribute added in admin → auto-appears in filter sidebar
- [ ] Search "majirel" → shows matching products
- [ ] Color chart: 80 colors per brand, filterable by level
- [ ] B2C user doesn't see professional products
- [ ] B2B user sees B2B prices
- [ ] Homepage shows real data in all sections

---

---

### PHASE 3: Cart, Wishlist, Orders & Quick Order
**Duration:** 2 weeks | **Covers:** REQ 3 (promo codes), REQ 6 (wishlist/reviews), REQ 14 (quick order), REQ 15 (orders) partial

**Goal:** Full purchase flow. Cart, wishlist, checkout, orders, B2B quick order all functional.

#### Step 3.1 — Zustand Cart Store
- [ ] `src/lib/stores/cart-store.ts`: items, addItem, removeItem, updateQty, clearCart
- [ ] Guest: localStorage. Logged-in: sync to DB
- [ ] `src/components/providers/CartProvider.tsx`: load cart on mount, merge on login

---

#### Step 3.2 — Cart & Wishlist APIs
- [ ] `GET/POST /api/cart` — Get current cart, add item
- [ ] `PUT/DELETE /api/cart/[itemId]` — Update qty, remove
- [ ] `POST /api/cart/merge` — Merge guest cart on login
- [ ] `GET/POST/DELETE /api/wishlist` — Get wishlist, toggle item, remove

**Files:** `src/app/api/cart/...`, `src/app/api/wishlist/route.ts`

---

#### Step 3.3 — Promo Code Validation (REQ 3)
- [ ] `POST /api/promo-codes/validate` — Check code, dates, limits, audience, min order → return discount or error

---

#### Step 3.4 — Order APIs (REQ 15)
- [ ] `GET /api/orders` — List for user (or all for admin), filter by status/date
- [ ] `POST /api/orders` — Create order:
  1. Validate stock availability
  2. Snapshot prices into order_items
  3. Calculate subtotal, apply promo discount, add shipping
  4. Decrement stock
  5. Generate order number (ALT-YYYY-NNNN)
  6. Clear cart
  7. B2B with invoice: no payment required
- [ ] `GET /api/orders/[id]` — Detail with items + status history
- [ ] `PATCH /api/orders/[id]/status` (admin) — Change status, log in history

---

#### Step 3.5 — Reviews API (REQ 6)
- [ ] `GET /api/reviews?productId=X` — Ratings + average
- [ ] `POST /api/reviews` — Rate 1-5, one per user per product (upsert)

---

#### Step 3.6 — B2B Quick Order API (REQ 14)
- [ ] `POST /api/orders/quick` with type=sku → lookup product by SKU code
- [ ] `POST /api/orders/quick` with type=csv → parse CSV (sku, quantity), validate, return preview
- [ ] `POST /api/orders/quick` with type=repeat → copy items from old order at current prices

---

#### Step 3.7 — Checkout Page (NEW)
- [ ] `src/app/checkout/page.tsx`:
  - Shipping address (saved or new)
  - Shipping method with calculated cost
  - Promo code input
  - Payment method (B2C: card/bank/COD; B2B: invoice/card)
  - B2B: minimum order amount check (if configured)
  - Order review → place order
- [ ] `src/app/checkout/confirmation/page.tsx` — Order number, summary, "continue shopping"

---

#### Step 3.8 — Wire Existing Pages
- [ ] `cart/page.tsx` → use Zustand cart, real promo validation, real delivery options, proceed to checkout
- [ ] `wishlist/page.tsx` → fetch from API, toggle/remove, add to cart
- [ ] `quick-order/page.tsx` → SKU search API, CSV upload API, repeat order API

---

#### PHASE 3 — DONE WHEN:
- [ ] Guest adds to cart → login → cart preserved
- [ ] Promo code "POPUST10" works at checkout
- [ ] Order placed → stock decremented → order number shown
- [ ] B2B places order with invoice → no payment required
- [ ] Quick order: SKU search, CSV upload, repeat order all work
- [ ] Wishlist toggle works
- [ ] Star rating on product detail page works

---

---

### PHASE 4: Payment & Shipping
**Duration:** 2 weeks | **Covers:** REQ 12 (card payment), REQ 15 (delivery + emails)

**Goal:** Real card payments, delivery integration, email notifications.

#### Step 4.1 — Serbian PSP Integration (REQ 12)
- [ ] `src/lib/payment/psp-client.ts` — Allpay.rs or PaySpot client
- [ ] `POST /api/payment/initiate` — Create payment, return 3DS redirect URL
- [ ] `POST /api/payment/callback` — Webhook: update payment status

---

#### Step 4.2 — D Express Shipping (REQ 15)
- [ ] `src/lib/shipping/dexpress-client.ts` — Shipment creation, tracking
- [ ] `src/lib/shipping/rate-calculator.ts` — Calculate by zone, weight, method
- [ ] `GET /api/shipping/rates?city=X&weight=Y` — Calculate shipping cost
- [ ] `GET /api/shipping/track?trackingNumber=X` — Tracking proxy

---

#### Step 4.3 — Email Notifications (REQ 15)
- [ ] Install `resend @react-email/components`
- [ ] `src/lib/email/send.ts` — sendOrderConfirmation, sendShippingNotification, sendWelcomeEmail, sendB2bApproval
- [ ] Templates: `src/lib/email/templates/order-confirmation.tsx`, `shipping-notification.tsx`, `welcome.tsx`, `b2b-approval.tsx`
- [ ] Wire triggers: order created → email, status=shipped → email with tracking, B2B approved → email

---

#### Step 4.4 — B2B Invoice
- [ ] `src/lib/invoice/generate.ts` — PDF invoice (company info, PIB, items, totals, bank details)
- [ ] `GET /api/orders/[id]/invoice` — Download PDF

---

#### PHASE 4 — DONE WHEN:
- [ ] Card payment completes (test mode) → order confirmed
- [ ] B2B invoice downloadable as PDF
- [ ] Shipping rate calculated by city
- [ ] Order confirmation email arrives
- [ ] Shipping email arrives with tracking link

---

---

### PHASE 5: Admin CRM Backend
**Duration:** 3 weeks | **Covers:** REQ 7 (admin), REQ 3 (promotions admin)

**Goal:** All admin pages connected to real APIs. Full store management capability.

#### Step 5.1 — Dashboard (real stats)
- [ ] `GET /api/analytics/dashboard` — revenue, orders today, new users, avg cart, top products, low stock, recent orders
- [ ] Wire `admin/page.tsx`

#### Step 5.2 — Products admin
- [ ] Wire `admin/products/page.tsx` → real CRUD via `/api/products`, image upload via `/api/upload`, bulk actions

#### Step 5.3 — Orders admin
- [ ] Wire `admin/orders/page.tsx` → real data, status changes, order detail, export CSV

#### Step 5.4 — Users & B2B approval (REQ 1)
- [ ] `GET /api/users` (admin) — list with role filter
- [ ] `GET/PUT/DELETE /api/users/[id]`
- [ ] `POST /api/users/[id]/approve` — approve B2B, trigger email
- [ ] Wire `admin/users/page.tsx`

#### Step 5.5 — Promo Codes, Bundles, Banners (REQ 3, REQ 5)
- [ ] `CRUD /api/promo-codes`
- [ ] `CRUD /api/bundles` (with nested items)
- [ ] `CRUD /api/banners`
- [ ] Wire respective admin pages

#### Step 5.6 — Newsletter admin (REQ 9)
- [ ] `GET/POST /api/newsletter`, `POST /api/newsletter/unsubscribe`
- [ ] Wire `admin/newsletter/page.tsx`
- [ ] Wire footer + homepage popup newsletter forms

#### Step 5.7 — Analytics admin
- [ ] Extended dashboard endpoint: revenue over time, by category, B2B vs B2C
- [ ] Wire `admin/analytics/page.tsx`

#### Step 5.8 — SEO, Import, Settings (REQ 10, REQ 7)
- [ ] `GET/PUT /api/seo` — per entity
- [ ] Wire `admin/seo/page.tsx`
- [ ] Wire `admin/import/page.tsx` → `/api/products/import`
- [ ] `GET/PUT /api/settings` — store config
- [ ] Wire `admin/settings/page.tsx`

---

#### PHASE 5 — DONE WHEN:
- [ ] Admin creates product → visible on storefront
- [ ] Admin approves B2B user → user gets approval email
- [ ] Admin changes order status → history logged
- [ ] Admin creates promo code → usable at checkout
- [ ] All 15 admin pages show real data from database

---

---

### PHASE 6: ERP Integration — Pantheon
**Duration:** 2 weeks | **Covers:** REQ 8

**Goal:** Bidirectional sync with Pantheon ERP. Stock always matches reality.

#### Step 6.1 — Pantheon API Client
- [ ] `src/lib/erp/pantheon-client.ts` — auth, getProducts, getStock, getPrices, pushOrder, pushCustomer

#### Step 6.2 — Inbound Sync (Pantheon → Web)
- [ ] `src/lib/erp/sync-products.ts` — full product sync (daily)
- [ ] `src/lib/erp/sync-stock.ts` — stock levels (every 5 min) — **Pantheon is source of truth**
- [ ] `src/lib/erp/sync-prices.ts` — prices (hourly)

#### Step 6.3 — Outbound Sync (Web → Pantheon)
- [ ] `src/lib/erp/sync-orders.ts` — push orders on creation (real-time)
- [ ] Push new B2B customers on registration

#### Step 6.4 — Admin & Logging
- [ ] `POST /api/erp/sync` — trigger manual sync
- [ ] `GET /api/erp/logs` — sync history
- [ ] `POST /api/erp/webhook` — Pantheon callback
- [ ] Wire `admin/erp/page.tsx`

#### Step 6.5 — Scheduled Jobs
- [ ] Job scheduler (Inngest or cron): stock every 5 min, prices hourly, products daily

---

#### PHASE 6 — DONE WHEN:
- [ ] Manual sync → products updated from Pantheon
- [ ] Stock on website matches Pantheon within 5 minutes
- [ ] New order → pushed to Pantheon
- [ ] Sync logs visible in admin

---

---

### PHASE 7: i18n, SEO & Newsletter
**Duration:** 2 weeks | **Covers:** REQ 13 (multilingual), REQ 10 (SEO), REQ 9 (newsletter automations)

**Goal:** Latin/Cyrillic toggle works, SEO metadata on all pages, newsletter automations running.

#### Step 7.1 — i18n (REQ 13)
- [ ] Install `next-intl`
- [ ] `src/messages/sr-Latn.json` + `sr-Cyrl.json`
- [ ] Update middleware for locale routing
- [ ] Convert hardcoded text in all pages to translation keys
- [ ] Upgrade `LanguageToggle.tsx` to real switcher
- [ ] API returns `name_lat` or `name_cyr` based on locale

#### Step 7.2 — SEO (REQ 10)
- [ ] `generateMetadata()` on all server pages (products, categories)
- [ ] `src/app/sitemap.ts` — dynamic XML sitemap
- [ ] `src/app/robots.ts`
- [ ] JSON-LD structured data for products
- [ ] Image alt tags from DB

#### Step 7.3 — Newsletter Automations (REQ 9)
- [ ] First-purchase popup → auto-generated promo code
- [ ] Campaign sending (segment: B2B or B2C)
- [ ] Triggers: new promotions, new products

---

#### PHASE 7 — DONE WHEN:
- [ ] Cyrillic toggle → all text switches, URLs update
- [ ] Page source has correct meta tags + OG data
- [ ] `/sitemap.xml` valid
- [ ] Newsletter signup → subscriber in DB → receives campaign

---

---

### PHASE 8: Polish & Production
**Duration:** 2 weeks | **Covers:** REQ 11 (technical), REQ 16 (FAQ)

**Goal:** Security, performance, GDPR, testing, remaining pages.

#### Step 8.1 — Security (REQ 11)
- [ ] Rate limiting on login, register, orders
- [ ] Input validation (Zod) on ALL API routes
- [ ] CSRF protection
- [ ] B2B data security audit

#### Step 8.2 — GDPR (REQ 11)
- [ ] Cookie consent backend (wire CookieConsent.tsx)
- [ ] Data export endpoint (user downloads their data)
- [ ] Account deletion endpoint

#### Step 8.3 — Performance (REQ 11)
- [ ] Next.js `<Image>` everywhere (replace `<img>`)
- [ ] Suspense boundaries + loading states
- [ ] Error boundaries

#### Step 8.4 — Testing
- [ ] API unit tests (product CRUD, order flow, promo validation)
- [ ] E2E test: register → cart → checkout → order confirmed

#### Step 8.5 — FAQ (REQ 16)
- [ ] `GET /api/faqs` — active FAQs sorted
- [ ] Wire `faq/page.tsx` to real data

#### Step 8.6 — Remaining Pages
- [ ] `outlet/page.tsx` → query products with active promotions
- [ ] `account/page.tsx` → real orders, real loyalty, real B2B balance
- [ ] `salon-locator/page.tsx` → connect to real data (if needed)

---

#### PHASE 8 — DONE WHEN:
- [ ] Lighthouse: performance > 90, SEO > 95
- [ ] Rate limiting blocks abuse
- [ ] Cookie consent saves preferences
- [ ] E2E test passes: full purchase flow
- [ ] FAQ shows real data from admin

---

## Requirements → Phases Mapping

| REQ | Description | Phase |
|-----|-------------|-------|
| 1 | B2B + B2C user types & access | Phase 1 + 5.4 |
| 2 | Product pages | Phase 2 |
| 3 | Sales, discounts, promo codes | Phase 3.3 + 5.7 |
| 4 | Categories, filters, search | Phase 2 |
| 5 | Hair color management | Phase 2.3 + 5.7 (bundles) |
| 6 | Frontend (wishlist, reviews) | Phase 3 |
| 7 | Backend/Admin | Phase 5 |
| 8 | ERP Pantheon | Phase 6 |
| 9 | Newsletter | Phase 5.8 + 7.3 |
| 10 | SEO | Phase 7.2 |
| 11 | Technical (speed, security, GDPR) | Phase 8 |
| 12 | Card payment | Phase 4.1 |
| 13 | Multilingual | Phase 7.1 |
| 14 | Quick order B2B | Phase 3.6 |
| 15 | Orders & delivery | Phase 3.4 + 4 |
| 16 | FAQ | Phase 8.5 |
