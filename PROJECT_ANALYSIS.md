# ALTA MODA — Deep Project Analysis

> **Generated:** 2026-04-05  
> **Stack:** Next.js 16.1.7 · React 19 · Prisma 7.5 · PostgreSQL · Tailwind CSS 4 · Zustand · NextAuth

---

## Table of Contents

1. [Architecture Overview & Diagram](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Data Layer & ER Diagram](#3-data-layer)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [API Endpoints](#5-api-endpoints)
6. [State Management Deep Dive](#6-state-management-deep-dive)
7. [Performance Bottlenecks](#7-performance-bottlenecks)
8. [Recommendations & Action Plan](#8-recommendations--action-plan)
9. [Performant Target Architecture](#9-performant-target-architecture)

---

## 1. Architecture Overview

Alta Moda is a **B2B/B2C e-commerce platform** for professional hair/beauty products. It uses the Next.js App Router with a clear separation between:

- **Public storefront** — products, brands, cart, checkout
- **B2B features** — quick order, bulk pricing, credit terms
- **Admin dashboard** — product management, orders, newsletter, ERP sync

### Key Architectural Decisions

| Decision | Choice | Trade-off |
|----------|--------|-----------|
| Session strategy | JWT (24h expiry) | Fewer DB queries, but no server-side revocation |
| DB adapter | PrismaPg (native) | Direct PostgreSQL connection pooling |
| State management | Zustand | Lightweight, no boilerplate vs Redux |
| Rate limiting | In-memory | Works for single instance; needs Redis for scaling |
| Image storage | Cloudinary CDN | External dependency, but offloads optimization |
| i18n | Custom context | Serbian (lat/cyr), English, Russian |

### 1.1 High-Level System Architecture

```mermaid
graph TB
    subgraph Browser
        UI[React UI]
        ZS[Zustand Stores]
        LS[(localStorage)]
        SA[SessionProvider]
    end

    subgraph Vercel Edge
        MW[Middleware - auth.config.ts]
    end

    subgraph Next.js Server
        SC[Server Components]
        CC[Client Components]
        EH[withErrorHandler]
        RL[Rate Limiter]
        AH[Auth Helpers]
        ZV[Zod Validation]
        BL[Business Logic]
    end

    subgraph External Services
        DB[(PostgreSQL - Render)]
        CL[Cloudinary CDN]
        RS[Resend Email]
        GF[Google Fonts]
    end

    UI --> SA
    UI --> ZS
    ZS --> LS
    UI --> MW
    MW --> SC
    SC --> CC
    SC --> DB
    EH --> RL
    RL --> AH
    AH --> ZV
    ZV --> BL
    BL --> DB
    BL --> RS
    SC --> CL
    UI --> GF
```

---

## 2. Project Structure

```
src/
├── app/                          # App Router
│   ├── admin/                    # Admin dashboard (protected)
│   │   ├── actions/, blog/, brands/, bundles/, colors/
│   │   ├── homepage/, import/, newsletter/, orders/
│   │   ├── products/, seminars/, settings/, users/
│   │   └── layout.tsx            # Admin layout with sidebar (13.5KB)
│   ├── api/                      # RESTful API routes
│   │   ├── admin/                # Admin-only APIs (colors, users, sync-cloudinary)
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── products/             # Product CRUD + search, colors, import
│   │   ├── cart/, orders/, reviews/, wishlist/
│   │   ├── brands/, categories/, attributes/
│   │   ├── newsletter/           # Campaigns, templates, subscribers
│   │   └── upload/, users/
│   ├── products/                 # Product catalog & detail pages
│   ├── brands/, categories/, colors/
│   ├── cart/, checkout/, account/, wishlist/
│   ├── quick-order/              # B2B bulk ordering
│   ├── contact/, faq/, seminars/, salon-locator/, outlet/
│   ├── HomePageClient.tsx        # Homepage client component (858 lines)
│   └── layout.tsx                # Root layout
├── components/
│   ├── admin/                    # Admin UI components
│   ├── providers/
│   │   ├── AuthProvider.tsx      # NextAuth SessionProvider
│   │   └── CartProvider.tsx      # Cart/wishlist sync (guest -> DB on login)
│   ├── Header.tsx                # Main navigation (571 lines)
│   ├── Footer.tsx, ChatWidget.tsx, CookieConsent.tsx
│   └── LanguageToggle.tsx
├── lib/
│   ├── db.ts                     # Prisma singleton with PrismaPg adapter
│   ├── auth.ts, auth.config.ts, auth-helpers.ts
│   ├── api-utils.ts              # Error handling, pagination, response helpers
│   ├── cloudinary.ts             # Cloudinary SDK config + image listing
│   ├── upload.ts                 # File upload with magic byte verification
│   ├── rate-limit.ts             # In-memory sliding window rate limiter
│   ├── email.ts                  # Resend email service + batch support
│   ├── utils.ts, colors.ts, constants.ts
│   ├── i18n/                     # Language context + translation JSONs (sr, en, ru)
│   ├── validations/              # Zod schemas (cart, order, product, user, etc.)
│   └── stores/                   # Zustand stores (cart, wishlist, auth)
├── types/
│   └── next-auth.d.ts            # Type extensions for session
└── middleware.ts                  # Route protection (admin, account, checkout, quick-order)
```

---

## 3. Data Layer

**PostgreSQL** via Prisma 7.5 + PrismaPg adapter — **24 models** across 6 domains.

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ UserAddress : has
    User ||--o| B2bProfile : has
    User ||--o{ Cart : owns
    User ||--o{ Order : places
    User ||--o{ Wishlist : saves
    User ||--o{ Review : writes

    Brand ||--o{ ProductLine : has
    Brand ||--o{ Product : has
    Category ||--o{ Category : parent-child
    Category ||--o{ Product : contains

    Product ||--o{ ProductImage : has
    Product ||--o| ColorProduct : color-data
    Product ||--o{ ProductAttribute : attributes
    Product ||--o{ CartItem : in-carts
    Product ||--o{ OrderItem : ordered
    Product ||--o{ Review : reviewed

    Cart ||--o{ CartItem : contains
    Order ||--o{ OrderItem : contains
    Order ||--o{ OrderStatusHistory : tracked

    DynamicAttribute ||--o{ ProductAttribute : values

    User {
        string email
        string passwordHash
        enum role
        enum status
    }
    Product {
        string sku
        string nameLat
        string slug
        decimal priceB2c
        decimal priceB2b
        int stockQuantity
        bool isActive
        bool isProfessional
    }
    Order {
        string orderNumber
        enum status
        enum paymentMethod
        decimal total
    }
```

### 3.2 Model Domains

**Users & Auth:** `User`, `UserAddress`, `B2bProfile`  
**Catalog:** `Brand`, `ProductLine`, `Category`, `Product`, `ProductImage`, `ColorProduct`, `DynamicAttribute`, `ProductAttribute`  
**Commerce:** `Cart`, `CartItem`, `Wishlist`, `Order`, `OrderItem`, `OrderStatusHistory`, `Promotion`, `PromoCode`  
**Content:** `Banner`, `Faq`, `Bundle`, `BundleItem`  
**Newsletter:** `NewsletterTemplate`, `NewsletterSubscriber`, `NewsletterCampaign`, `NewsletterAutomation`  
**System:** `ShippingZone`, `ShippingRate`, `ErpSyncLog`, `ErpSyncQueue`, `SeoMetadata`

---

## 4. Authentication & Authorization

### 4.1 Auth Chain Flowchart

```mermaid
flowchart TD
    A[Browser Request] --> B{Path matches middleware?}
    B -->|No| F[Route Handler]
    B -->|Yes| C[NextAuth Middleware]

    C --> D{Has JWT session?}
    D -->|No| E[302 Redirect to Login]
    D -->|Yes| D2{authorized callback}

    D2 -->|/admin and role not admin| E
    D2 -->|/account and no user| E
    D2 -->|/quick-order and role not b2b| E
    D2 -->|Allowed| F

    F --> G{API needs auth?}
    G -->|No| H[Execute handler]
    G -->|Yes| I[requireAuth]

    I --> J[Get session from JWT]
    J --> K[Query DB for user.status]

    K --> L{Status OK?}
    L -->|suspended| M[403 Forbidden]
    L -->|pending| M
    L -->|active| N{Check role}

    N -->|requireAdmin and not admin| O[403 Forbidden]
    N -->|requireB2b and not b2b| O
    N -->|Pass| H

    H --> P[successResponse]
```

### 4.2 Security Layers

```mermaid
graph TD
    A[Incoming Request] --> B[1. Security Headers - CSP HSTS X-Frame-Options]
    B --> C[2. Middleware - Route-level auth check]
    C --> D[3. Rate Limiter - Per-endpoint sliding window]
    D --> E[4. Auth Verification - requireAuth re-checks DB status]
    E --> F[5. Input Validation - Zod schema parsing]
    F --> G[6. Business Logic - Prisma transactions]
    G --> H[7. Response - successResponse or errorResponse]
```

### 4.3 Role-Based Access

| Role | Access | Protected Routes |
|------|--------|-----------------|
| `b2c` | Browse, order, review, wishlist | `/products`, `/cart`, `/checkout`, `/account` |
| `b2b` | + Bulk ordering, volume discounts, credit | + `/quick-order` |
| `admin` | Full system control | + `/admin/*` |

---

## 5. API Endpoints

### 5.1 API Request Flow (Order Creation)

```mermaid
sequenceDiagram
    actor Client
    participant API as API Route
    participant RL as Rate Limiter
    participant Auth as requireAuth
    participant Zod as Zod Schema
    participant Logic as Business Logic
    participant DB as PostgreSQL

    Client->>API: POST /api/orders
    API->>RL: applyRateLimit orderLimiter IP
    RL-->>Client: 429 if rate exceeded
    RL->>Auth: requireAuth
    Auth->>DB: Re-check user status
    Auth-->>Client: 403 if suspended
    Auth->>Zod: createOrderSchema.parse body
    Zod-->>Client: 400 if invalid
    Zod->>Logic: Validated data
    Logic->>DB: prisma.$transaction
    Note over Logic,DB: Atomic: validate stock then create order then decrement stock then clear cart
    DB-->>Logic: Order created
    Logic-->>Client: 201 success with order data
```

### 5.2 Complete Endpoint Map

**Products:**

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/products` | Public | Paginated listing, filters, diacritics search, role-based pricing |
| GET | `/api/products/[id]` | Public | Full detail + related, color siblings, reviews |
| POST | `/api/products` | Admin | Create product with color data + images |
| PUT | `/api/products/[id]` | Admin | Update product |
| DELETE | `/api/products/[id]` | Admin | Soft delete (isActive: false) |
| GET | `/api/products/search` | Public | Autocomplete (top 5, diacritics-aware) |
| GET | `/api/products/colors` | Public | Color matrix grouped by level x undertone |
| POST | `/api/products/import` | Admin | CSV/XLSX import (10K row limit) |

**Cart:**

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/cart` | Auth | User's cart items with product details |
| POST | `/api/cart` | Auth | Add item (upserts quantity) |
| PUT | `/api/cart/[itemId]` | Auth | Update quantity (ownership validated) |
| DELETE | `/api/cart/[itemId]` | Auth | Remove item (ownership validated) |
| POST | `/api/cart/merge` | Auth | Merge guest cart into DB on login (transactional) |
| POST | `/api/cart/validate-stock` | Public | Batch stock check (rate-limited) |

**Orders:**

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/orders` | Auth | Paginated list (admin sees all, users see own) |
| POST | `/api/orders` | Auth | Create order — atomic transaction with stock validation |
| GET | `/api/orders/[id]` | Auth | Full detail with items, status history |
| PATCH | `/api/orders/[id]/status` | Admin | Status update with state machine validation |
| POST | `/api/orders/quick` | B2B | SKU lookup / CSV batch / order repeat |

**Users:**

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/users` | Public | Registration (B2C=active, B2B=pending). Rate-limited. |
| GET | `/api/users/me` | Auth | Current user with B2B profile and addresses |
| PUT | `/api/users/me` | Auth | Update name/phone |
| PATCH | `/api/users/[id]/approve` | Admin | Approve B2B user |
| PATCH | `/api/users/[id]/reject` | Admin | Reject user |
| GET | `/api/admin/users` | Admin | Paginated user list with search/filter |

**Other:**

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/POST | `/api/reviews` | Public/Auth | Product reviews (409 on duplicate) |
| GET/POST/DELETE | `/api/wishlist` | Auth | Wishlist toggle |
| POST/DELETE/GET | `/api/newsletter` | Mixed | Subscribe/unsubscribe + admin management |
| POST | `/api/upload` | Admin | File upload (10MB, magic byte validation) |
| POST | `/api/admin/sync-cloudinary` | Admin | Sync Cloudinary images to DB |

### 5.3 Order Status State Machine

```mermaid
stateDiagram-v2
    [*] --> novi
    novi --> u_obradi : Admin starts processing
    u_obradi --> isporuceno : Admin marks delivered
    u_obradi --> otkazano : Admin cancels
    isporuceno --> [*]
    otkazano --> [*]
```

---

## 6. State Management Deep Dive

### 6.1 Provider Hierarchy

The root layout nests providers in this exact order (outermost to innermost):

```mermaid
graph TD
    LP[LanguageProvider - React Context] --> AP[AuthProvider - NextAuth SessionProvider]
    AP --> CP[CartProvider - Session-aware sync]
    CP --> CH[children - All pages]

    CH -.-> CS[useCartStore - localStorage altamoda-cart]
    CH -.-> WS[useWishlistStore - localStorage altamoda-wishlist]
    CH -.-> AS[useAuthStore - no persistence]
    CH -.-> AP2[useSession - from AuthProvider]
    CH -.-> LP2[useLanguage - from LanguageProvider]
```

**Why this order matters:**
- `LanguageProvider` is outermost — language affects all rendering
- `AuthProvider` wraps `CartProvider` because `CartProvider` calls `useSession()`
- `CartProvider` syncs cart/wishlist on session changes

### 6.2 Zustand Store Architecture

**Cart Store** (`cart-store.ts`):
- **Persistence:** localStorage `altamoda-cart` — only persists `items[]`
- **State:** `items: CartItem[]`, `isLoading`, `isHydrated`
- **Actions:** `addItem`, `updateQuantity`, `removeItem`, `clearCart`, `setItems`, `setLoading`, `setHydrated`
- **Computed:** `getTotal()` = sum(price * qty), `getItemCount()` = sum(quantities)
- **CartItem:** `{id, productId, name, brand, price, quantity, image, sku, stockQuantity}`

**Wishlist Store** (`wishlist-store.ts`):
- **Persistence:** localStorage `altamoda-wishlist` — only persists `count`
- **State:** `count: number`
- **Actions:** `setCount(n)`, `increment()`, `decrement()`
- Only tracks count — full items fetched from API on demand

**Auth Store** (`auth-store.ts`):
- **Persistence:** None
- **State:** `isLoading: boolean`
- Minimal — real auth state lives in NextAuth session

### 6.3 Cart Sync Flow

```mermaid
flowchart TD
    A[User visits site] --> B{Logged in?}

    B -->|No - Guest| C[Cart in localStorage only]
    C --> D[addItem updates Zustand store]
    D --> E[Zustand persists to localStorage]
    E --> F{User logs in?}
    F -->|No| C

    F -->|Yes| G[CartProvider detects session change]
    G --> H{cartOwner matches userId?}
    H -->|No - different user| I[clearCart + clear wishlist]
    I --> J[Set cartOwner to new userId]
    H -->|Yes or no previous owner| J

    J --> K{Guest cart has items?}
    K -->|Yes| L[POST /api/cart/merge]
    K -->|No| M[Skip merge]
    L --> M

    M --> N[GET /api/cart - fetch DB cart]
    N --> O[setItems - replaces localStorage with DB data]
    O --> P[GET /api/wishlist]
    P --> Q[setWishlistCount]
    Q --> R[Authenticated - DB is authoritative]

    R --> S[addItem updates Zustand + POST /api/cart]

    R --> T{User logs out?}
    T -->|Yes| U[clearCart + setWishlistCount 0]
    U --> V[Remove cartOwner from localStorage]
    V --> C
```

### 6.4 Server to Client Data Flow

```mermaid
flowchart LR
    subgraph ServerComponent[Server Component page.tsx]
        DB[(PostgreSQL)]
        Q1[Products query]
        Q2[Brands query]
        Q3[Categories query]
        Q4[Ratings aggregation]
        Q5[Wishlist IDs]
        Q6[Session check]
    end

    subgraph PropsBridge[Serialized Props]
        P1[initialProducts]
        P2[brands]
        P3[categories]
        P4[userRole]
        P5[wishlistedIds]
    end

    subgraph ClientComponent[Client Component]
        UI[Interactive UI]
        Filters[Filter Controls]
        Cards[Product Cards]
        CartBtn[Add to Cart]
    end

    subgraph ClientState[Client State]
        ZC[useCartStore]
        ZW[useWishlistStore]
        Lang[useLanguage]
        Sess[useSession]
    end

    DB --> Q1
    DB --> Q2
    DB --> Q3
    DB --> Q4
    DB --> Q5
    Q6 --> Q1

    Q1 --> P1
    Q2 --> P2
    Q3 --> P3
    Q6 --> P4
    Q5 --> P5

    P1 --> UI
    P2 --> UI
    P3 --> UI
    P4 --> UI
    P5 --> UI

    UI --> Filters
    UI --> Cards
    UI --> CartBtn

    CartBtn --> ZC
    Cards --> ZW
    UI --> Lang
    UI --> Sess
```

### 6.5 Where Each Piece of State Lives

| State | Owner | Storage | Access Pattern |
|-------|-------|---------|---------------|
| User session | NextAuth | JWT cookie (24h) | `useSession()` hook |
| User role/status | DB → JWT | JWT token | `session.user.role` |
| Cart items (guest) | Zustand | localStorage | `useCartStore()` |
| Cart items (auth) | DB (authoritative) | DB + localStorage cache | DB via API, local for UI |
| Wishlist count | Zustand | localStorage | `useWishlistStore()` |
| Wishlist items | DB | Fetched on demand | `GET /api/wishlist` |
| Language | React Context | localStorage | `useLanguage()` / `t()` |
| Product data | Server component | Props | Server passes to Client |
| Brands (header) | Module-level cache | Client memory | `fetch('/api/brands')` once |
| Search results | Local state | Component state | Debounced API call |
| Filter selections | URL params | URL search params | Client component state |

---

## 7. Performance Bottlenecks

### 7.1 Severity Overview

| Issue | Severity | Impact |
|-------|----------|--------|
| `force-dynamic` on all pages | **CRITICAL** | No caching, full DB hit every request |
| No caching strategy at all | **CRITICAL** | Zero edge caching, no ISR |
| Plain `<img>` tags everywhere | **CRITICAL** | No lazy load, no WebP, bad LCP |
| No Suspense / loading states | **CRITICAL** | Blank screen until all queries finish |
| N+1 queries in product listing | **HIGH** | 24 extra queries per page load |
| 36+ unnecessary `"use client"` | **HIGH** | Over-hydration, large JS bundles |
| Sequential DB queries in detail | **HIGH** | Waterfall delays |
| ChatWidget on every page | **HIGH** | ~50KB unnecessary JS |
| Google Fonts not optimized | **HIGH** | Render blocking, layout shift |
| Large client components (1200+ lines) | **MEDIUM** | Hard to optimize/split |
| In-memory rate limiting | **MEDIUM** | Won't work in serverless at scale |

### 7.2 Current Request Flow (Why It's Slow)

```mermaid
graph LR
    R[Request] --> MW[Middleware]
    MW --> SSR[Server Render - force-dynamic]
    SSR --> DB[7+ DB Queries + 24 N+1]
    DB --> HTML[Generate Full HTML]
    HTML --> JS[Hydrate Entire Page - 400KB JS]
    JS --> Done[Page Interactive]
```

**What happens on every single page visit:**
1. No cache check — `force-dynamic` bypasses everything
2. Server runs 7+ database queries (some sequential, some N+1)
3. Full HTML generated from scratch
4. ~400KB of JavaScript shipped to hydrate the entire page
5. No skeletons — user sees blank screen during all of this

### 7.3 Bottleneck Details

**7.3.1 `force-dynamic` on ALL pages**  
Files: `page.tsx` in `/products`, `/products/[id]`, `/brands`, `/colors`, `/checkout`, home page  
Impact: Disables static generation, ISR, and edge caching. Every request hits DB.

**7.3.2 No caching strategy**  
- No `revalidate` exports on any page
- No React `cache()` usage
- No ISR (Incremental Static Regeneration)
- Header has fragile client-side cache: `let cachedBrands = []`

**7.3.3 Plain `<img>` tags**  
Files: `HomePageClient.tsx`, `ProductDetailClient.tsx`, `ProductsPageClient.tsx`  
Missing: lazy loading, responsive srcset, WebP/AVIF, blur placeholder

**7.3.4 No loading.tsx or Suspense**  
User sees blank screen until ALL database queries complete.

**7.3.5 N+1 queries in product listing**  
For each of 12 products: separate rating query + separate variant count query = 24 extra queries.

**7.3.6 Sequential queries in product detail**  
`findFirst` → then `aggregate` → then `findMany` → then `findMany` — all sequential when they could run in parallel.

---

## 8. Recommendations & Action Plan

### Phase 1: Quick Wins (High Impact, Low Effort)

**1. Replace `force-dynamic` with ISR:**
```typescript
// Before (every page):
export const dynamic = 'force-dynamic'

// After:
export const revalidate = 300  // Products: 5 min
export const revalidate = 600  // Product detail: 10 min
export const revalidate = 3600 // Homepage: 1 hour
```

**2. Replace `<img>` with Next.js `<Image>`:**
```typescript
import Image from 'next/image'
<Image src={product.image} alt={product.name}
  width={400} height={400} loading="lazy" />
```

**3. Add Suspense boundaries:**
```typescript
<Suspense fallback={<FiltersSkeleton />}>
  <Filters />
</Suspense>
<Suspense fallback={<ProductGridSkeleton />}>
  <ProductGrid />
</Suspense>
```

**4. Parallelize product detail queries:**
```typescript
const product = await prisma.product.findFirst({...})
const [avgRating, related, siblings, wishlist] = await Promise.all([
  prisma.review.aggregate({...}),
  prisma.product.findMany({...}),
  prisma.product.findMany({...}),
  session ? prisma.wishlist.findUnique({...}) : null,
])
```

**5. Use next/font for Google Fonts:**
```typescript
import { Inter, Noto_Serif } from 'next/font/google'
const inter = Inter({ subsets: ['latin', 'latin-ext'], weight: ['300','400','500','600','700'] })
```

### Phase 2: Medium Effort, High Impact

**6. Fix N+1 queries** — replace per-product rating queries with bulk `groupBy`  
**7. Convert static pages to server components** — remove `"use client"` from faq, about, contact, seminars  
**8. Lazy-load ChatWidget** — `dynamic(() => import(...), { ssr: false })`  
**9. Add React `cache()`** — deduplicate repeated queries within a request

### Phase 3: Architectural Improvements

**10. Add database indexes** on `isActive`, `slug`, `categoryId`, `productId`, `groupSlug`  
**11. Replace in-memory rate limiting with Upstash Redis**  
**12. Split large client components** into server components + small client islands  
**13. Add monitoring** — Vercel Analytics, Sentry, Web Vitals

### Performance Impact Estimates

| Fix | Estimated Impact |
|-----|-----------------|
| Remove force-dynamic + add ISR | **50-70% faster TTFB** for repeat visitors |
| Next.js Image component | **40-60% smaller** image payloads, better LCP |
| Suspense boundaries | **Perceived load time** drops significantly |
| Parallelize DB queries | **30-40% faster** product detail page |
| Fix N+1 in product listing | **60-80% fewer** DB queries per page |
| next/font self-hosting | **Eliminates FOUT/FOIT**, saves 2-3 DNS lookups |
| Lazy-load ChatWidget | **~50KB less** JS on initial load |

---

## 9. Performant Target Architecture

### 9.1 Target Request Flow (Fast)

```mermaid
graph LR
    R[Request] --> Cache{Edge Cache hit?}
    Cache -->|HIT| Fast[Cached HTML in 50ms]
    Cache -->|MISS| MW[Middleware]
    MW --> Stream[Streaming SSR]
    Stream --> Shell[Shell + Suspense Skeletons]
    Shell --> Visible[User sees layout instantly]
    Shell --> DBQ[DB queries stream in]
    DBQ --> Hydrate[Selective hydration - 150KB JS]
```

### 9.2 Target System Architecture

```mermaid
graph TB
    subgraph Edge Layer
        EC[Edge Cache - ISR pages]
        MW2[Middleware - Auth only]
        IMG[next/image - WebP/AVIF]
        FNT[next/font - Self-hosted]
    end

    subgraph Application Layer
        SC2[Server Components - zero JS to client]
        CI[Client Islands - minimal JS]
        RC[React cache - dedup queries]
        ISR[ISR Revalidation]
    end

    subgraph API Layer
        EH2[withErrorHandler]
        Redis[Upstash Redis - Rate limiting]
        ZOD[Zod validation]
        TX[Prisma transactions]
    end

    subgraph Data Layer
        DB2[(PostgreSQL with indexes)]
        CLD[Cloudinary - Optimized images]
        Resend[Resend - Batch emails]
    end

    EC --> MW2
    MW2 --> SC2
    SC2 --> CI
    SC2 --> RC
    RC --> ISR
    ISR --> DB2
    CI --> EH2
    EH2 --> Redis
    Redis --> ZOD
    ZOD --> TX
    TX --> DB2
    IMG --> CLD
    FNT --> SC2
```

### 9.3 What Must Change

```mermaid
graph LR
    subgraph Current
        A1[force-dynamic on all pages]
        B1[Plain img tags]
        C1[No Suspense]
        D1[1200-line client components]
        E1[In-memory rate limiter]
        F1[Google Fonts CDN]
        G1[No caching at all]
        H1[ChatWidget always loaded]
        I1[Sequential DB queries]
    end

    subgraph Target
        A2[ISR with revalidate]
        B2[next/image WebP + lazy]
        C2[Suspense + Streaming SSR]
        D2[Server components + client islands]
        E2[Upstash Redis]
        F2[next/font self-hosted]
        G2[React cache + ISR]
        H2[Lazy-loaded on demand]
        I2[Promise.all + DB indexes]
    end

    A1 --> A2
    B1 --> B2
    C1 --> C2
    D1 --> D2
    E1 --> E2
    F1 --> F2
    G1 --> G2
    H1 --> H2
    I1 --> I2
```

### 9.4 Target Products Page Component Split

Currently: 1 server component passes everything to 1 giant client component (1204 lines). The entire page is JavaScript-hydrated.

Target: Server components render layout, grid, and cards. Only interactive elements are client components.

```mermaid
graph TD
    subgraph Server Components - zero JS
        Page[ProductsPage - revalidate 300]
        Grid[ProductGrid]
        Card[ProductCard - image + name + price]
        Sidebar[FilterSidebar]
        Bread[Breadcrumbs]
    end

    subgraph Client Islands - minimal JS
        FilterCtrl[FilterControls - checkboxes sliders]
        SortDrop[SortDropdown]
        AddCart[AddToCartButton]
        WishHeart[WishlistHeart]
        LoadMore[LoadMoreButton]
        SearchBar[SearchBar - debounced]
    end

    Page --> Bread
    Page --> Sidebar
    Sidebar --> FilterCtrl
    Page --> Grid
    Grid --> Card
    Card --> AddCart
    Card --> WishHeart
    Page --> SortDrop
    Page --> SearchBar
    Grid --> LoadMore
```

### 9.5 4-Layer Caching Strategy

```mermaid
graph TD
    subgraph Layer 1 - Edge Cache
        HP[Home Page - 1 hour]
        PP[Products - 5 min]
        PD[Product Detail - 10 min]
        BP[Brand Pages - 1 hour]
        SP[Static Pages - 24 hours]
    end

    subgraph Layer 2 - Request Dedup
        GB[getBrands cached per request]
        GC[getCategories cached per request]
        GA[getAttributes cached per request]
    end

    subgraph Layer 3 - Client Cache
        ZP[Zustand persist - cart + wishlist]
        HC[Header brands - module cache]
        NF[next/font - browser cached]
        NI[next/image - CDN cached]
    end

    subgraph Layer 4 - Database
        IDX[Indexed queries]
        POOL[PrismaPg connection pool]
    end

    HP --> GB
    PP --> GB
    PP --> GC
    PD --> GA
    GB --> IDX
    GC --> IDX
    GA --> IDX
```

### 9.6 Performance Budget

| Metric | Current (Estimated) | Target | How to Achieve |
|--------|-------------------|--------|----------------|
| **TTFB** | 800-2000ms | <200ms | ISR + edge cache |
| **LCP** | 3-5s | <1.5s | next/image + Suspense streaming |
| **FCP** | 2-4s | <0.8s | Suspense shells + self-hosted fonts |
| **JS Bundle** | ~400KB | <150KB | Server components + code splitting |
| **DB queries (list)** | 7 + 24 N+1 | 7 bulk | groupBy aggregation |
| **DB queries (detail)** | 6 sequential | 1 + 5 parallel | Promise.all() |
| **Image payload** | Unoptimized | 40-60% smaller | next/image WebP/AVIF |

### 9.7 Priority Matrix

**Do first (high impact, low effort):**
- Remove `force-dynamic`, add `revalidate`
- Replace `<img>` with `next/image`
- Add Suspense boundaries
- Use `next/font`
- Lazy-load ChatWidget

**Do next (high impact, medium effort):**
- Parallelize DB queries with `Promise.all()`
- Fix N+1 with bulk `groupBy`
- Split large client components
- Convert static pages to server components

**Do later (medium impact, high effort):**
- Upstash Redis rate limiting
- Add database indexes
- Add monitoring (Vercel Analytics, Sentry)

---

## API Health Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Consistent response format | **Good** | `{success, data/error}` everywhere |
| Input validation | **Good** | Zod schemas on all mutations |
| Auth protection | **Good** | Middleware + API helpers, DB re-check |
| Rate limiting | **Partial** | In-memory only, won't work at scale |
| Error handling | **Good** | `withErrorHandler` wrapper on all routes |
| Pagination | **Good** | Consistent with max limits |
| SQL injection prevention | **Good** | Prisma parameterized queries |
| Price trust | **Good** | Never trusts client prices |
| Soft deletes | **Good** | Products/categories use isActive flag |
