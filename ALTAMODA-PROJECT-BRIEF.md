# ALTA MODA - Complete Project Brief for UI/UX Design

> **Purpose**: This document provides a comprehensive specification of the Alta Moda e-commerce platform so that an AI UI/UX designer can fully understand the project and create pixel-perfect designs for every page, flow, and interaction.

---

## 1. PROJECT OVERVIEW

**Alta Moda** is a professional hairdressing and beauty products B2B + B2C e-commerce platform based in Serbia. It sells hair care products, styling tools, professional hair colors, oxidants, and salon equipment to two distinct audiences:

- **B2C (Retail buyers)**: Regular customers purchasing hair care products for personal use
- **B2B (Salon professionals)**: Licensed hairdressers and salon owners purchasing professional products at wholesale prices

### Tech Stack
- **Frontend**: Next.js 16, React 19, TailwindCSS 4, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth**: NextAuth.js v5 (JWT sessions)
- **State**: Zustand (cart, wishlist)
- **Icons**: Lucide React
- **Carousels**: Swiper.js
- **Validation**: Zod
- **Languages**: Serbian (Latin), English, Russian

### Design Language
- **Primary Brand Color**: `#8c4a5a` (mauve/wine rose)
- **Dark Text**: `#2d2d2d`
- **Light Background**: `#f5f0e8` (warm beige)
- **Borders**: `#e0d8cc`
- **Accent Hover**: `#6e3848` (darker wine)
- **Headline Font**: Playfair Display (serif) or Cormorant Garamond
- **Body Font**: System sans-serif stack
- **Code/SKU Font**: Monospace
- **Aesthetic**: Luxury, warm, professional, clean, minimalist with elegant typography

---

## 2. USER ROLES & ACCESS MODEL

### 2.1 Guest (Unauthenticated)
- Can browse all public pages (home, products, colors, outlet/sales)
- Can see both B2C and B2B products (with a visibility toggle)
- Can add items to guest cart (localStorage-based)
- Cannot complete checkout (prompted to login)
- Cannot access wishlist, account, quick order, or admin

### 2.2 B2C User (Retail Buyer)
- Standard registration (name, email, password, phone)
- Instantly active after registration
- Sees **only consumer (non-professional) products**
- Sees **B2C pricing** (priceB2c)
- Payment methods: Card, Bank Transfer, Cash on Delivery
- Has: Orders, Wishlist, Profile
- Cannot access: Quick Order, B2B pricing, admin

### 2.3 B2B User (Salon Professional)
- Registration requires: salon name, PIB (9-digit tax ID), matični broj (8-digit business registry)
- Status is **pending** after registration until admin approves
- Sees **only professional products** (isProfessional=true)
- Sees **B2B pricing** (priceB2b, with fallback to priceB2c)
- Additional payment method: Invoice
- Has: Orders, Wishlist, Quick Order (SKU/CSV/Repeat), B2B Pricing Dashboard, Balance & Debts, Loyalty Program
- Volume-based discount tiers
- Credit limits and payment terms

### 2.4 Admin
- Full access to admin panel
- Manages: products, orders, users, promotions, bundles, colors, newsletter, settings, blog, seminars
- Approves B2B registrations
- Can see all products and pricing

---

## 3. INFORMATION ARCHITECTURE (SITEMAP)

```
/ ............................ Homepage
/products .................... Product Catalog (with filters)
/products/[id] ............... Product Detail Page
/colors ...................... Hair Color Palette (level x undertone matrix)
/outlet ...................... Sales/Promotions Page
/cart ........................ Shopping Cart
/checkout .................... Multi-step Checkout
/checkout/confirmation ....... Order Confirmation
/wishlist .................... Wishlist
/quick-order ................. B2B Quick Order (SKU/CSV/Repeat)
/account/login ............... Login & Registration
/account ..................... User Dashboard (Orders, Wishlist, B2B sections)

/admin ....................... Admin Dashboard
/admin/homepage .............. Homepage Section Management
/admin/products .............. Product CRUD (tabbed editor)
/admin/colors ................ Color Management (matrix + list)
/admin/orders ................ Order Management
/admin/users ................. User Management & B2B Approvals
/admin/actions ............... Promotions & Discounts
/admin/bundles ............... Product Bundles (cross-category packages)
/admin/newsletter ............ Subscribers, Campaigns, Automations
/admin/settings .............. Store Config (general, delivery, payment, B2B)
/admin/blog .................. Blog Management
/admin/seminars .............. Seminar/Event Management
```

---

## 4. PUBLIC PAGES - DETAILED SPECIFICATIONS

### 4.1 HEADER (Global Component)

**Desktop Layout** (sticky, z-50):
- Left: 5 main navigation links (Products, Collections, About, Blog, Contact)
- Center: Logo
- Right: Language toggle, Search icon, Wishlist (with count badge), Cart (with count badge), User account icon

**Mega Menus** (hover-activated):
- **Products Menu**: 3 columns — Hair Care (Shampoos, Masks, Conditioners, Serums, Oils), Styling (Gels, Sprays, Waxes, Creams), Appliances (Dryers, Straighteners, Curlers, Trimmers) + featured promo image
- **Collections Menu**: 2 columns — Hair Colors (Permanent, Ammonia-Free, Demi-Permanent), Oxidants & Decolorants (3%, 6%, 9%, Decolorant Powders) + featured promo image

**Mobile Layout** (hamburger menu):
- Full-screen slide-in menu with expandable submenus
- Same navigation structure, touch-friendly
- Search input at top

**Search**: Opens search input with real-time autocomplete suggestions (product name, SKU, brand). Results show in dropdown with product image, name, price.

---

### 4.2 HOME PAGE

**Section 1 — Hero Banner**
- Full-width background image with gradient overlay
- Large serif headline with brand-color accent word
- Subtitle text
- "Shop Now" CTA button
- Height: 600px mobile / 750px desktop

**Section 2 — Trust Badges** (4-column grid)
- Natural Formula (Leaf icon)
- Cruelty Free (Heart icon)
- Expert Approved (Award icon)
- Free Shipping (Truck icon)
- Each: icon + title + short description

**Section 3 — Editorial Heading**
- Large serif italic centered text — inspirational brand message

**Section 4 — Featured Products**
- Section title + "View All" link
- 2-4 column responsive grid
- ProductCard components (see Section 4.12 for card spec)

**Section 5 — Eco-Friendly Banner**
- Dark background (#38202a)
- Split layout: content left + product image right
- Headline with colored accent + description + "Learn More" button

**Section 6 — Bestsellers Carousel**
- Auto-rotating (4s interval), pauses on hover
- 1-4 items visible depending on screen size
- Left/right navigation arrows + dot indicators
- "Trending" badge

**Section 7 — New Arrivals Grid**
- Static 2-4 column grid
- "NEW" badge on each product card

**Section 8 — Sale Products Carousel**
- Auto-rotating carousel
- Shows old/new price comparison with discount %
- Link to /outlet page

**Section 9 — B2B Promotional Banner**
- Full-width with dark overlay
- "For Professionals" messaging
- "Register as Salon" CTA button linking to login page

**Section 10 — Instagram Feed**
- 6-image grid (3 columns mobile, 6 desktop)
- Hover shows Instagram icon overlay
- Links to Instagram

**Section 11 — Newsletter Signup**
- Email input + Subscribe button
- Success/error feedback messages

**Floating Elements (persistent)**:
- Chat Widget (bottom-left, collapsible)
- Cookie Consent banner (bottom, dismissible)
- Newsletter popup trigger (bottom-right)

---

### 4.3 PRODUCTS CATALOG PAGE

**Layout**: Sticky left sidebar (filters) + main content area

#### Left Sidebar — Filters:

1. **Search Bar**: Real-time autocomplete with product suggestions
2. **View Mode Toggle**: Grid (2-4 col) / List (single column detailed)
3. **Sort Dropdown**: Popular, Price Low→High, Price High→Low, Newest, Name A→Z
4. **Brand Filter**: Checkbox list with search within brands, count badges, multi-select
5. **Category Tree**: Hierarchical expandable tree (parent → children), indented levels
6. **Price Range**: Min/Max input fields with "Apply" button
7. **Dynamic Attribute Toggles**: New Products, On Sale, Featured, custom admin-defined attributes (checkboxes with counts)
8. **Active Filter Tags**: Horizontal list of applied filters with X remove and "Clear All"

#### Main Content:

**Top Bar**: Breadcrumb, results count, sort dropdown, mobile filter toggle button

**Product Grid** (responsive 2-4 columns):
- ProductCard components (see spec below)
- Infinite scroll or numbered pagination
- Previous/Next + page numbers

**Mobile**: Filters collapse into drawer overlay, grid becomes 1-2 columns, sticky sort/filter bar

**Role-Based Visibility**:
- B2C users: only consumer products, B2C prices
- B2B users: only professional products, B2B prices
- Guests: toggle between all/B2C/B2B view

---

### 4.4 PRODUCT DETAIL PAGE

**Two-Column Layout** (desktop):

#### Left Column — Image Gallery:
- Large primary product image (square)
- Thumbnail grid (4 cols) below — click to change main image
- Video/GIF badge indicators on thumbnails
- Zoom on hover for main image

#### Right Column — Product Info:

**Header**:
- Brand name (small caps, accent color, clickable)
- Product line link
- Large serif product name
- "Professional Use Only" badge (if applicable)
- Star rating + review count
- Stock status (green "In Stock" / red "Out of Stock")

**Pricing**:
- Current price (large, bold)
- Old price struck through (if on sale)
- Discount % badge
- B2B price shown only to B2B users (green highlight box)
- Hint box for non-B2B users: "Register as salon for professional prices"

**Actions**:
- Quantity selector (- / number / +)
- "Add to Cart" button (full width, disabled if out of stock)
- Wishlist heart toggle button
- Copy link button (with clipboard feedback)

**Delivery Info Box**:
- Free shipping over 5,000 RSD
- 14-day return policy
- Authenticity guarantee

**Color Information** (if color product):
- Color level (1-10) with name
- Undertone name
- Hex color circle preview
- Shade code

#### Tabs Section:
- Description | Ingredients | Usage Instructions | Reviews
- Active tab underlined with brand color

**Reviews Tab**:
- Average rating display with star visualization
- Review list: user name, stars, date
- "Rate Product" button (shows star selector modal, 1-5)
- One review per user per product

#### Related Products:
- 2-4 column grid of same-category products
- Same ProductCard styling

---

### 4.5 HAIR COLOR PALETTE PAGE (/colors)

**Purpose**: Visual shade selection for professional hair colors, organized by brand line → level → undertone

**Brand Line Tabs** (horizontal scrollable):
- Each brand line: Majirel, Igora Royal, Koleston Perfect, INOA, BlondMe, etc.
- Shows count per line
- Active tab highlighted

**Search + Filter Bar**:
- Search input (by shade code or name)
- Color Level filter (1-10 buttons + "All")
- Undertone filter (Natural, Ash, Gold, Copper, Red, Violet, Matte, Brown + "All")
- View mode toggle: Matrix / Grid
- Clear filters button

**Level Names Reference** (for UI labels):
| Level | Serbian | English |
|-------|---------|---------|
| 1 | Crna | Black |
| 2 | Veoma tamno braon | Very Dark Brown |
| 3 | Tamno braon | Dark Brown |
| 4 | Srednje braon | Medium Brown |
| 5 | Svetlo braon | Light Brown |
| 6 | Tamno plava | Dark Blonde |
| 7 | Srednje plava | Medium Blonde |
| 8 | Svetlo plava | Light Blonde |
| 9 | Veoma svetlo plava | Very Light Blonde |
| 10 | Ekstra svetla plava | Extra Light Blonde |

**Undertone Codes**:
| Code | Serbian | English |
|------|---------|---------|
| N | Prirodna | Natural |
| A | Pepeljasta | Ash |
| G | Zlatna | Gold |
| C | Bakar | Copper |
| R | Crvena | Red |
| V | Ljubičasta | Violet |
| M | Mat | Matte |
| B | Braon | Brown |

**Matrix View** (default — recommended for professionals):
- Table with rows = levels (1-10), columns = undertones
- Each cell shows circular color swatches with hex background color
- Shade code label below each swatch
- Hover shows tooltip: product name + price
- Click selects color for detail panel
- Empty cells show dash

**Grid View** (alternative):
- Compact grid of all color swatches (5-10 columns)
- Same circular swatches with shade code labels

**Recently Viewed** (above grid, when no filters active):
- Horizontal scrollable chips showing last 10 viewed colors
- Stored in localStorage
- Click to reselect

**Selected Color Detail Panel** (right sidebar, desktop):
- Large color circle preview
- Brand line label (accent color)
- Shade code (large heading)
- Product name
- Details: Level + name, Undertone name, Price
- "View Product" button → product detail page
- "Add to Cart" button
- **Similar Shades**: Shows nearby colors (same level or adjacent levels, same undertone) for easy exploration

**Mobile Bottom Sheet** (mobile):
- Slide-up panel when color selected
- Compact: color circle + name + level/undertone + price
- "View Product" + "Add to Cart" buttons

---

### 4.6 SHOPPING CART PAGE

**Layout**: Main content (left) + Order Summary sidebar (right)

#### Cart Items:
- **Empty State**: Shopping bag icon + "Cart is empty" + "Continue Shopping" button
- **Item List**: Product image, brand, name, quantity selector (- / n / +), subtotal, delete (trash) icon
- Hover effects on items

#### Delivery Options (radio buttons):
- Standard (2-4 business days) — 350 RSD, free if over 5,000 RSD
- Express (1 day) — 690 RSD
- Store Pickup — Free
- Free delivery threshold message

#### B2B Options (B2B users only):
- Highlighted box with B2B color
- Checkbox: "Order without online payment"
- Checkbox: "Invoice payment"
- Minimum order info

#### Order Notes:
- Textarea for special instructions

#### Order Summary Sidebar (sticky):
- Subtotal
- Delivery cost (with method name)
- **Total** (large, bold)
- "Proceed to Checkout" button
- Trust badges: Free shipping threshold, secure payment
- Payment method logos (Visa, Mastercard, PayPal, COD)

#### Recommended Products (bottom):
- 4-product grid of related/popular items

---

### 4.7 CHECKOUT FLOW (Multi-Step)

**Step Indicator**: Horizontal progress bar with numbered steps (1-5 for guests, 1-4 for registered users), current step highlighted, completed steps show checkmark

**Steps**:

#### Step 1 — Contact Info (guests only):
- Name, Email, Phone inputs (all required)
- Info box: "Have an account? Sign in for faster checkout"

#### Step 2 — Delivery Address:
- For registered users with saved addresses: radio buttons for each saved address
- "Add new address" option
- New address form: Street, City, Postal Code

#### Step 3 — Shipping Method:
- Radio options: Standard, Express, Store Pickup (same as cart)
- Selected option highlighted with brand color

#### Step 4 — Payment Method:
- **B2C**: Card (Visa, Mastercard), Bank Transfer, Cash on Delivery
- **B2B**: Invoice, Card
- Optional notes textarea

#### Step 5 — Review & Confirm:
- Summary sections (each with "Edit" link):
  - Contact info (guest)
  - Delivery address
  - Shipping method + cost
  - Payment method
- Items list: thumbnail, name, qty, subtotal (scrollable)
- Error messages: Auth required (red), B2B minimum order warning (orange)
- "Place Order" button (disabled if validation fails)

#### Order Summary Sidebar (all steps, sticky):
- Item count, Subtotal, Shipping, **Total**
- Security badge

---

### 4.8 ORDER CONFIRMATION PAGE

- Centered card layout
- Large green checkmark icon in circle
- "Order Received!" heading
- Thank you message
- Order number in highlighted box
- "Confirmation email sent" message
- "Continue Shopping" CTA button

---

### 4.9 WISHLIST PAGE

- Header: Heart icon + "My Wishlist" + item count
- Actions: "Share List", "Add All to Cart"
- Product grid (2-4 columns): ProductCard with remove button (X) on image corner, stock overlay if out of stock
- **Empty State**: Heart icon + "Wishlist is empty" + "Browse Products" button

---

### 4.10 QUICK ORDER PAGE (B2B Only)

**Layout**: Main + right sidebar summary

**3 Tabs**:

#### Tab 1 — By SKU Code:
- SKU/Product name search input with autocomplete
- Quantity selector
- Autocomplete shows: product code (monospace), name, price
- Click to add to order list

#### Tab 2 — Product List:
- Browsable product list with add functionality

#### Tab 3 — CSV Upload:
- Drag & drop zone + file input
- Format instructions (CSV with SKU, quantity columns)
- After upload: success message, products found count, total value, unavailable count
- "Add All to Cart" and "Cancel" buttons

**Recent Orders Section**:
- Last 5 orders: order number, date, item count, total, "Repeat" button

**Right Sidebar — Order Summary (sticky)**:
- Item list: SKU, name, qty, subtotal, delete button
- Subtotal
- B2B Bulk Discount (15%)
- **Final Total** (bold)
- "Place Order" button

---

### 4.11 OUTLET / SALES PAGE

**Hero Section**:
- Gradient background (red #c0392b → #e74c3c)
- "Special Offer" badge with flame icons
- "OUTLET — Up to 70% Off" headline
- **Live Countdown Timer**: Days, Hours, Minutes, Seconds (updates every second)

**Filters**:
- Product count
- Discount range buttons: "All", "50-59%", "60%+"

**Product Grid** (2-4 columns):
- ProductCards with prominent discount badge (red, large %)
- Sale price (bold, red) + old price (strikethrough)
- Wishlist heart, "Add to Cart" button

---

### 4.12 PRODUCT CARD COMPONENT (Shared)

Used across: Homepage, Products, Wishlist, Cart recommendations, Colors, Outlet

**Structure**:
- Product image (aspect-ratio square) with hover zoom effect
- **Badges** (positioned on image): "NOVO" (new), "HIT" (featured), discount %, "PRO" (professional)
- **Wishlist heart** (top-right corner, toggleable, fills on active)
- **Brand name** (small caps, muted color)
- **Product name** (2-line clamp, medium weight)
- **Star rating** (1-5 yellow stars + count)
- **Price line**: Current price (bold) + old price (strikethrough, muted) if on sale
- **"Add to Cart" button** (appears on hover or always on mobile)

---

### 4.13 LOGIN & REGISTRATION PAGE

**Centered card with tab navigation**: Login | Register

#### Login Form:
- Email input with icon
- Password input with show/hide toggle
- "Remember me" checkbox
- "Forgot password?" link
- "Login" button
- Divider: "or login with"
- Social buttons: Google, Facebook

#### Registration Form:

**User Type Toggle** (top):
- "Buyer (B2C)" button
- "Salon (B2B)" button

**Personal Fields**:
- First name + Last name (2-column)
- Email
- Phone

**B2B-Only Fields** (shown when B2B selected):
- Section header with building icon
- Salon name
- PIB (tax ID, 9 digits)
- Matični broj (business registry, 8 digits)
- Salon address

**Password Fields**:
- Password
- Confirm password

**Terms**: Checkbox for Terms of Use and Privacy Policy

**Submit**:
- B2C: "Register" button (account immediately active)
- B2B: "Submit Request" button + notice: "Your request will be reviewed within 24 hours"

---

### 4.14 USER ACCOUNT DASHBOARD

**Layout**: Left sidebar navigation + main content area

#### Sidebar:
- User avatar (initials circle) + name + role badge ("Buyer" or "B2B Partner")
- Navigation links: Orders, Wishlist
- B2B-only links: B2B Prices & Discounts, Balance & Debts, Loyalty Program
- Quick action: "Fast Order" button (B2B)
- Language selector with flags
- Logout button

#### Section: My Orders
- Table: Order Number, Date, Items, Total, Status badge, "Repeat" button
- Status badges: New (blue), Processing (yellow), Delivered (green), Cancelled (red)
- Repeat order modal confirmation

#### Section: Wishlist
- Product grid with ProductCards
- Empty state with "Browse Products" CTA

#### Section: B2B Prices & Discounts (B2B only)
- **Discount Scale Table**: Monthly spending ranges → discount percentage, current tier highlighted
- **Monthly Spending Bar Chart**: 6-month history, gradient bars

#### Section: Balance & Debts (B2B only)
- **3 Status Cards**: Outstanding Debt (red), Total Paid (green), Credit Limit (blue)
- **Payment History Table**: Date, Amount, Method, Status (paid/unpaid)
- **Debt Warning Banner** (if debt exists): Red alert with amount + "Pay Online" button

#### Section: Loyalty Program (B2B only)
- **Current Level**: Level name badge + progress bar + points display
- **4 Level Cards**: Bronze → Silver → Gold → Platinum, each with point range, status (current/achieved/locked), benefits
- **Points Summary**: Current balance + redemption value

---

### 4.15 FOOTER (Global Component)

**4-Column Grid**:
1. Logo (inverted for dark bg) + description + social icons (Instagram, Facebook, YouTube)
2. Shopping: All Products, Hair Colors, Sales, Brands, Quick Order
3. Information: FAQ, Blog, Seminars, Salon Locator, Terms of Use
4. Contact: Address, Phone, Email, Business Hours (all with icons)

**Newsletter Section** (full width): Heading + description + email input + subscribe

**Bottom Bar**: Copyright (left) + Payment method badges (right): Visa, Mastercard, PayPal, Cash on Delivery

---

### 4.16 CHAT WIDGET (Floating)

**Closed**: Round button (bottom-left) with chat icon, pulsing animation

**Open Window** (350px × 500px):
- Header: AI icon + "Alta Moda Assistant" + "Online" indicator + minimize/close buttons
- Messages: User (right, dark bg) and Bot (left, light bg with border)
- Typing indicator: 3 bouncing dots
- Quick reply buttons (shown initially): "Recommend product", "Order status", "Shipping info", "Talk to agent"
- Input: text field + send button

---

### 4.17 COOKIE CONSENT BANNER

**Bottom banner** (slides up after 1.5s delay):
- Cookie icon + description + "Cookie Policy" link
- "Settings" button + "Accept All" button

**Settings expanded**:
- Necessary cookies (always on, disabled toggle)
- Analytics cookies (toggleable)
- Marketing cookies (toggleable)
- "Save Settings" button

---

## 5. ADMIN PANEL - DETAILED SPECIFICATIONS

### 5.1 ADMIN LAYOUT

**Desktop Sidebar** (collapsible 64px ↔ 256px):
- Logo with "Admin" badge
- Navigation organized in 3 sections:
  - **Main**: Dashboard, Homepage, Products, Colors, Orders, Users
  - **Sales**: Promotions, Bundles
  - **System**: Newsletter, Settings
- Active page highlighted with `#8c4a5a` accent
- User profile card at bottom (initials + name + role)

**Top Header Bar**:
- Search input (desktop)
- Language toggle
- Notifications bell (with red dot + dropdown showing 3 notification items)
- User dropdown: Profile, Settings, Logout

**Color Scheme**: Same brand palette — dark sidebar (#2d2d2d), beige content area (#f5f0e8), accent (#8c4a5a)

---

### 5.2 ADMIN DASHBOARD

**Period Selector**: Today, 7 days, 30 days, 90 days + refresh button

**4 KPI Cards** (1-row grid):
| Metric | Example Value | Trend |
|--------|---------------|-------|
| Total Sales | 2,847,350 RSD | +12.5% ↑ |
| Orders Today | 34 | +8.2% ↑ |
| New Users | 156 | +23.1% ↑ |
| Avg Cart Value | 8,420 RSD | -2.4% ↓ |

**Revenue Chart**: 7-day bar chart with gradient bars, daily labels, total for period

**Quick Actions** (4 buttons): Add Product, Process Orders, B2B Approvals, New Blog Post

**Recent Orders Table**: Order #, Customer, Date, Total, Status badge, View icon (expandable rows)

**Top Products Sidebar**: Ranked 1-5 with name, brand, units sold, revenue

**Low Stock Alerts**: 4-column grid of alert cards with product name, stock count, threshold, progress bar

---

### 5.3 HOMEPAGE MANAGEMENT

**4 Managed Sections**:
1. **Featured Products** (Star icon) — Admin selects which products appear
2. **Bestsellers** (Sparkle icon) — Admin selects bestseller products
3. **New Arrivals** (Shopping bag icon) — Admin selects new products
4. **Sale** (Tag icon) — Read-only, auto-populated from products with oldPrice

Each section shows:
- Header with icon, title, product count badge
- 4-column product grid (image, name, brand, price)
- Remove button (X) on hover per product
- Search input + dropdown to add products (except Sale)

---

### 5.4 PRODUCT MANAGEMENT

**Header**: "Products" title + "Create New Product" button

**Filters**: Search (name/SKU/brand), Brand dropdown, Category dropdown, Status dropdown (Active/Inactive), View toggle (list/grid)

**Product Table**: Checkbox, Image+Name, SKU, Brand, Category, B2C Price, Stock, Status badge, Edit/Delete actions. Bulk select + bulk actions menu.

**Product Editor (Side panel or full page)** — 8 Tabs:

| Tab | Fields |
|-----|--------|
| **Osnovno** (Basic) | Name, SKU (auto-generate), Brand dropdown, Product Line dropdown, Category dropdown, Sub-category dropdown, Status toggle, Badges: isNew, isFeatured, isBestseller, isProfessional |
| **Cene** (Prices) | Price B2C, Price B2B, Old Price, Purchase Price, Auto-calculated margin |
| **Sadrzaj** (Content) | Description textarea, Ingredients textarea, Usage instructions textarea, Character counters |
| **Mediji** (Media) | Primary image upload, Gallery images with drag-drop reorder, Video URL, GIF URL, Alt text fields per image |
| **Zalihe** (Stock) | Stock quantity, Low stock threshold, Weight (g), Volume (ml), Stock warning indicator |
| **Boja** (Color) | Color level (1-10), Undertone dropdown, Hex color picker with preview circle, Shade code |
| **SEO** | SEO title, Meta description, URL slug (auto-generate from name), Search engine preview |
| **Atributi** (Attributes) | Sulfate-free (checkbox), Paraben-free, Ammonia-free, Vegan, Hair type multi-select (Normal, Dry, Oily, Damaged, Colored, Curly) |

---

### 5.5 COLOR MANAGEMENT

**Purpose**: Visual management of hair color products in a level × undertone matrix

**Header**: "Color Management" title + "Add Color" button

**4 Stat Cards**: Total Colors, Brand Lines, Active Brands, Low Stock Colors (orange alert)

**Brand Line Tabs**: "All" + each brand line (Majirel, Igora Royal, Koleston Perfect, INOA) with counts

**Filters**: Search (code/name/SKU), Level buttons (1-10), Undertone buttons (N, A, G, C, R, V, M, B, I, W), View toggle (Matrix/List), Clear filters

**Matrix View**:
- Table: Rows = Levels (1-10 with circle badges), Columns = Undertones
- Each cell: circular color swatches with hex fill, shade code label below
- Click swatch to open detail panel
- Orange dot indicator for low stock
- Empty cells show dash
- Inactive colors shown at 40% opacity

**List View**:
- Table: Color swatch + Name, Shade Code, Level, Undertone, Color Line, SKU, Price B2C, Stock, Status, Actions (Edit/Delete)

**Selected Color Detail Panel** (right slide-out):
- Large color circle + brand line + shade code + name
- Details grid: Level, Undertone + code, Hex value + swatch, SKU, Brand, Price B2C, Price B2B, Stock, Status
- Actions: "Edit Color", "View Product"

**Add/Edit Color Modal**:
- Color preview circle (large, updates live)
- Level selector (1-10 buttons)
- Undertone selector (labeled buttons)
- Hex color picker + text input
- Shade code text input with format hint
- Product link dropdown (for Add only)
- Save/Cancel buttons

---

### 5.6 ORDER MANAGEMENT

**Header**: "Orders" + total count + Export button

**Filters**: Search (order # / customer), Status tabs: All, New, Processing, Delivered, Cancelled

**Orders Table**: Order #, Customer, Date, Items count, Total, Payment Method, Status (editable dropdown), Expand icon

**Expanded Order Detail** (below row):
- **Items Table**: Product, Qty, Price, Total + order total footer
- **Customer Data Card**: Email, Phone, Address (with icons)
- **Order Timeline** (vertical): Events with icons (Check=delivered, Truck=shipped, Package=processing, Clock=received, X=cancelled) + timestamps, connected with vertical lines

**Pagination**: "Showing X-Y of Z" + Previous/Next + page numbers

**Order Status State Machine**:
```
novi (New) → u_obradi (Processing) → isporuceno (Delivered)
         ↘ otkazano (Cancelled)    ↗
u_obradi → otkazano
```

---

### 5.7 USER MANAGEMENT

**Header**: "Users" + total registered count

**Filters**: Search (name/email), Type buttons (All, B2B, B2C), Status dropdown (All, Active, Blocked, Pending), Pending B2B count badge

**Two-Column Layout**: Users table (left) + Detail panel (right)

**Users Table**: Avatar+Name, Type badge, Registration date, Orders count, Spent total, Status badge, View icon

**User Detail Panel**:
- Profile: Avatar circle, name, type badge
- Contact: Email, Phone, Address, Registration date (with icons)
- B2B Data (if B2B): Company name, PIB
- Stats: Total Orders, Total Spent
- Recent Orders: Last 3 orders (number, date, total, status)
- Actions: Approve B2B (if pending), Block User (if active, red), Activate User (if blocked, green)

---

### 5.8 PROMOTIONS & DISCOUNTS

**Header**: "Actions and Discounts" + description + "New Promotion" button

**4 Stat Cards**: Total Promotions, Active, Scheduled, Products on Sale

**Search + Filter**: Search input + Status tabs (All, Active, Scheduled, Inactive)

**Promotion Cards** (list):
- Name, Type badge (Percentage/Fixed/Price), Target label, Audience badge, Date range
- Badge preview text ("AKCIJA -20%"), Status badge, Product count, Edit/Delete buttons

**Create/Edit Panel**:
- Name input
- Type: Percentage / Fixed / Price (radio)
- Value input (% or RSD)
- Target: Product / Category / Brand / All (with sub-selector)
- Audience: All / B2B / B2C
- Badge text dropdown
- Date range (start/end)
- Product selection: search + scrollable checklist
- Save/Cancel

---

### 5.9 BUNDLES MANAGEMENT

**Purpose**: Create cross-category product packages (e.g., 10 permanent colors + 10 demi-permanent + 1 oxidant + 1 shampoo + 1 conditioner)

**Header**: "Bundles" + description + "New Bundle" button

**Bundle Cards** (3-column grid):
- Image/placeholder, Status badge, Savings % badge
- Title (serif), Description (truncated), Tags (product count, target group)
- Price: bundle price (bold) vs original price (strikethrough)
- Date range, Edit/Duplicate/Delete buttons

**Create/Edit Modal**:
- Bundle name
- Description
- **Product Selection**: Search + scrollable product list with checkboxes (name + price per item)
- Selected count + total original value
- Bundle price input (RSD)
- Auto-calculated savings %
- Toggles: "Can Buy Individually", "Mix Salon & Retail"
- Date range (valid from/to)
- Target group: All / B2B / B2C
- Save/Cancel

---

### 5.10 NEWSLETTER MANAGEMENT

**3 Tabs**: Subscribers | Campaigns | Automations

#### Subscribers Tab:
- **3 Stat Cards**: Total Active, B2B count, B2C count
- Search input, Segment filter, Export CSV button
- **Table**: Email (with icon), Segment badge (B2B/B2C), Subscribe date, Status badge (Active/Unsubscribed), Delete button

#### Campaigns Tab:
- Create Campaign button
- **Campaign Cards**: Title, Segment badge, Status (Sent/Scheduled/Draft), Send date
  - Sent campaigns show: Open rate %, Click rate %
  - Edit/Delete buttons
- **Create Modal**: Title, Segment dropdown, Content type dropdown (Sales, New Products, Seminars, Custom), Save/Cancel

#### Automations Tab:
- **Automation Cards** (list):
  - Icon (varies by type), Name, Description
  - Tags: Target segment, Last triggered
  - Toggle on/off
  - Examples: Welcome email, First purchase promo, Abandoned cart, Birthday discount

---

### 5.11 SETTINGS

**Sidebar Tabs**: General, Delivery, Payment, Notifications, B2B

#### General: Store name, Email, Phone, Address, Currency (RSD/EUR), Language (Serbian/English)

#### Delivery:
- Free shipping threshold input (RSD)
- Shipping zones table: Zone name (Beograd, Vojvodina, etc.), Toggle, Rate input (RSD)

#### Payment:
- Payment methods list: Card (Visa/MC), COD, Bank Transfer, PayPal, Installments
- Each: icon, name, description, toggle

#### Notifications:
- Table: Notification type × Email toggle × Push toggle
- Types: New Order, Order Cancelled, Low Stock, New User, B2B Request, Product Review

#### B2B:
- Default B2B discount (%)
- Minimum order amount (RSD)
- Payment terms (days)
- Auto-approve toggle, Require PIB toggle
- Stats card: Active Salons, Pending Approvals, Avg Discount

---

### 5.12 BLOG MANAGEMENT

**Header**: "Blog" + total posts + "New Post" button
**Search**: By title
**Table**: Title (with icon), Author, Category, Date, Status (Published/Draft), Views count, Edit/Delete

---

### 5.13 SEMINAR MANAGEMENT

**Header**: "Seminars" + total count + "New Seminar" button
**Search**: By title
**Grid** (3 columns):
- Icon circle + Status badge (Active/Full/Completed)
- Title + Instructor
- Details: Date, Time, Location, Registered/Capacity (with icons)
- Capacity progress bar (red when full)
- Price or "Free"
- Edit/Delete buttons

---

## 6. DATA MODEL

### 6.1 Core Entities

#### User
- id, email (unique), password (hashed), name, phone, role (b2c/b2b/admin), status (active/pending/suspended), avatar
- Relations: addresses[], b2bProfile?, reviews[], orders[], wishlists[], carts[]

#### B2bProfile
- salonName, pib, maticniBroj, discountTier (0-4), creditLimit, paymentTerms, approvedAt, approvedBy

#### Product
- id, sku (unique), nameLat, nameCyr, slug (unique)
- brandId, productLineId, categoryId
- description, ingredients, usageInstructions
- priceB2c (required), priceB2b (optional), oldPrice, costPrice
- stockQuantity, lowStockThreshold
- weightGrams, volumeMl
- Flags: isProfessional, isActive, isNew, isFeatured, isBestseller
- seoTitle, seoDescription
- Relations: images[], colorProduct?, reviews[], cartItems[], wishlists[], orderItems[], bundleItems[], attributes[]

#### ColorProduct (1:1 with Product)
- colorLevel (1-10), undertoneCode (N/A/G/C/R/V/M/B), undertoneName, hexValue, shadeCode

#### Category (Hierarchical)
- parentId (self-ref), nameLat, nameCyr, slug, sortOrder, depth, isActive
- Supports unlimited nesting

#### Brand → ProductLine → Product (hierarchy)

#### Bundle
- nameLat, nameCyr, slug, description, bundlePrice, originalPrice, imageUrl, isActive
- items[]: { productId, quantity }

### 6.2 Shopping

#### Cart: userId or sessionId (guest), items[]: { productId, quantity }
#### Wishlist: userId + productId (unique pair)
#### Order: orderNumber (unique), userId, status, paymentMethod, paymentStatus, subtotal, discountAmount, shippingCost, total, addresses (JSON), notes, promoCodeId
#### OrderItem: denormalized product snapshot (name, sku, unitPrice, totalPrice)
#### OrderStatusHistory: audit trail per status change

### 6.3 Marketing

#### Promotion: name, type (percentage/fixed), value, targetType (product/category/brand/all), targetId, audience (b2b/b2c/all), dateRange, isActive
#### PromoCode: code (unique), type, value, minOrderValue, maxUses, currentUses, perUserLimit, dateRange
#### Review: productId + userId (unique), rating 1-5

### 6.4 Content

- Banner, NewsletterSubscriber (b2b/b2c segment), Faq (bilingual), SeoMetadata (per entity + locale)

### 6.5 System

- ShippingZone + ShippingRate (standard/express, freeThreshold)
- ErpSyncLog (Pantheon ERP integration tracking)

---

## 7. BUSINESS LOGIC RULES

### Pricing
- All products must have priceB2c
- priceB2b is optional (B2B users fall back to priceB2c if null)
- oldPrice shows strikethrough pricing with discount calculation

### Shipping
- Standard: 350 RSD (free if subtotal >= 5,000 RSD)
- Express: 690 RSD
- Store Pickup: Free
- FREE_SHIPPING_THRESHOLD = 5,000 RSD

### Orders
- B2B minimum order: 10,000 RSD
- B2B bulk discount: 15%
- Order number format: ALT-YYYY-NNNN
- Stock decremented atomically at order creation
- Cart cleared on successful order

### B2B
- Registration requires PIB (9 digits) + matični broj (8 digits)
- Admin must approve before access granted
- Discount tiers based on monthly spending
- Credit limits and payment terms configurable per salon
- Loyalty program: Bronze → Silver → Gold → Platinum

### Reviews
- Rating only (1-5 stars), no text comments
- One review per user per product
- Average rating displayed on product cards and detail pages

---

## 8. MULTILINGUAL SUPPORT

### Languages
| Code | Name | Script | Flag |
|------|------|--------|------|
| sr | Srpski | Latin | 🇷🇸 |
| en | English | Latin | 🇬🇧 |
| ru | Русский | Cyrillic | 🇷🇺 |

### Implementation
- Custom React Context (LanguageProvider) wrapping entire app
- `useLanguage()` hook returns: `language`, `setLanguage()`, `t()` function
- Language persisted in localStorage (`altamoda_language`)
- Fallback to Serbian if key missing in current language
- Database content: dual columns (`name_lat`, `name_cyr`) for Products, Categories, Bundles, FAQs, Attributes
- URL structure ready for future expansion: `/sr-Latn/...`, `/sr-Cyrl/...`

### Translation Key Categories
nav, footer, home, products, cart, checkout, auth, account, cookie, chat, newsletter, admin, colors, common

---

## 9. RESPONSIVE DESIGN REQUIREMENTS

### Breakpoints
- **Mobile** (<640px): 1-2 columns, hamburger menu, bottom sheets, collapsible filters
- **Tablet** (640-1024px): 2-3 columns, simplified navigation
- **Desktop** (>1024px): 3-4 columns, full mega menus, sidebars, detail panels

### Mobile-Specific Patterns
- Filters collapse into drawer overlay
- Product grids become 1-2 columns
- Color detail shows as bottom sheet instead of sidebar
- Checkout steps stack vertically
- Admin sidebar becomes slide-in overlay
- Tables hide non-essential columns

---

## 10. INTERACTION PATTERNS

### Animations
- Page load: slide-up animations
- Carousels: auto-rotate (4s), pause on hover
- Transitions: 300-500ms duration
- Icons: scale on hover (1.05-1.1x)
- Modals: scale-in animation
- Banners: slide-up from bottom
- Chat: bounce animation on typing indicator

### States
- **Hover**: Color transition, scale, shadow elevation
- **Active**: Brand color (#8c4a5a), bold weight
- **Disabled**: 50% opacity, cursor not-allowed
- **Loading**: Spinner or "Učitavanje..." text
- **Success**: Green (#10b981) with checkmark
- **Error**: Red (#dc2626) with alert icon
- **Warning**: Orange (#f97316) with warning icon

### Status Badge Colors
| Status | Background | Text |
|--------|-----------|------|
| Active / Delivered | bg-emerald-100 | text-emerald-700 |
| New / Scheduled | bg-blue-100 | text-blue-700 |
| Processing / Pending | bg-yellow-100 | text-yellow-700 |
| Cancelled / Blocked | bg-red-100 | text-red-700 |
| Inactive / Draft | bg-gray-100 | text-gray-400 |
| Expired | bg-gray-100 | text-gray-400 |

---

## 11. KEY CONSTANTS

| Constant | Value | Usage |
|----------|-------|-------|
| CURRENCY | RSD | Displayed everywhere |
| FREE_SHIPPING_THRESHOLD | 5,000 RSD | Cart/Checkout |
| MIN_B2B_ORDER | 10,000 RSD | B2B checkout |
| B2B_BULK_DISCOUNT | 15% | Quick order |
| PAGINATION_DEFAULT_LIMIT | 12 | Product listings |
| PAGINATION_MAX_LIMIT | 100 | API hard cap |
| ORDER_PREFIX | ALT | Order number |
| PASSWORD_MIN_LENGTH | 6 | Registration |
| PIB_LENGTH | 9 digits | B2B registration |
| MATICNI_BROJ_LENGTH | 8 digits | B2B registration |

---

## 12. DEPENDENCIES & LIBRARIES USED

| Library | Purpose |
|---------|---------|
| Next.js 16 | Framework (SSR, API routes, routing) |
| React 19 | UI rendering |
| TailwindCSS 4 | Utility-first CSS |
| Framer Motion | Animations & transitions |
| Swiper | Carousel/slider components |
| Lucide React | Icon library |
| NextAuth.js v5 | Authentication |
| Prisma | Database ORM |
| Zustand | Client state (cart, wishlist, auth) |
| Zod | Schema validation |
| bcryptjs | Password hashing |

---

## 13. SUMMARY OF ALL PAGES (QUICK REFERENCE)

### Public (17 views)
1. Homepage (hero + 10 sections + floating widgets)
2. Products catalog (filters + grid/list + pagination)
3. Product detail (gallery + info + tabs + reviews + related)
4. Color palette (brand tabs + matrix/grid + detail panel)
5. Cart (items + delivery + summary)
6. Checkout step 1-5 (multi-step wizard)
7. Order confirmation
8. Wishlist (grid + share/add-all)
9. Quick order (SKU + CSV + repeat + summary)
10. Outlet/Sales (countdown + discount grid)
11. Login/Register (B2C + B2B forms)
12. Account dashboard (orders + wishlist + B2B sections)
13. Header (mega menus + search + icons)
14. Footer (4 columns + newsletter + copyright)
15. Chat widget (floating AI assistant)
16. Cookie consent (banner + settings)
17. Newsletter popup (modal)

### Admin (13 views)
1. Dashboard (KPIs + chart + orders + alerts)
2. Homepage management (4 product sections)
3. Products (table + 8-tab editor)
4. Colors (matrix/list + detail panel + add/edit modal)
5. Orders (table + expanded detail + timeline)
6. Users (table + detail panel + B2B approval)
7. Promotions (cards + create/edit panel)
8. Bundles (cards + create modal)
9. Newsletter (subscribers + campaigns + automations)
10. Settings (5 tabs: general, delivery, payment, notifications, B2B)
11. Blog (table + CRUD)
12. Seminars (grid + CRUD)
13. Admin layout (sidebar + header + notifications)
