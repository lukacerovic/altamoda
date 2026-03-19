// =============================================================================
// CENTRALIZED MOCK DATA — Alta Moda
// =============================================================================
// This file contains ALL hardcoded data extracted from page components.
// Blog posts and seminar data have been intentionally excluded.
// =============================================================================

// =============================================================================
// INTERFACES
// =============================================================================

export interface HomepageProduct {
  id: number;
  brand: string;
  name: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  rating: number;
}

export interface ProductsPageProduct {
  id: number;
  brand: string;
  name: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  rating: number;
  image: string;
  professional: boolean;
}

export interface SearchSuggestions {
  products: { name: string; brand: string; image: string; price: number }[];
  categories: string[];
  brands: string[];
}

export interface CategoryTreeNode {
  name: string;
  children?: CategoryTreeNode[];
}

export interface ToggleFilter {
  key: string;
  label: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface TrustBadge {
  title: string;
  desc: string;
}

export interface ProductDetail {
  id: number;
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  oldPrice: number;
  price: number;
  productLine: string;
  professionalOnly: boolean;
  isColor: boolean;
  colorLevel: string;
  colorUndertone: string;
  stock: number;
  stockStatus: "in_stock" | "out_of_stock";
  expectedDate: string;
  description: string;
  ingredients: string;
  usage: string;
}

export interface Review {
  id: number;
  name: string;
  rating: number;
  date: string;
  text: string;
}

export interface RelatedProduct {
  id: number;
  brand: string;
  name: string;
  price: number;
  rating: number;
  image: string;
}

export interface ColorShade {
  shade: string;
  name: string;
  color: string;
  active?: boolean;
}

export interface BrandTab {
  key: string;
  label: string;
}

export interface Undertone {
  key: string;
  label: string;
}

export interface ColorItem {
  code: string;
  hex: string;
  name: string;
  level: string;
  undertone: string;
  price: number;
}

export interface CartItem {
  id: number;
  brand: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface RecommendedProduct {
  id: number;
  brand: string;
  name: string;
  price: number;
  rating: number;
  image: string;
}

export interface DeliveryOption {
  key: string;
  label: string;
  price: number;
  note: string;
}

export interface WishlistItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  salePrice: number | null;
  badge: string | null;
  rating: number;
  inStock: boolean;
  image: string;
}

export interface QuickOrderProduct {
  code: string;
  name: string;
  brand: string;
  price: number;
  category: string;
}

export interface RecentB2BOrder {
  id: string;
  date: string;
  items: number;
  total: number;
}

export interface OutletProduct {
  id: number;
  name: string;
  brand: string;
  regularPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  image: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

export interface AccountStat {
  label: string;
  value: string;
  color: string;
}

export interface AccountOrder {
  id: string;
  date: string;
  items: number;
  total: string;
  status: string;
  statusColor: string;
}

export interface LoyaltyLevel {
  name: string;
  min: number;
  max: number;
  benefits: string[];
}

export interface PaymentHistoryEntry {
  date: string;
  amount: string;
  method: string;
  status: string;
  statusColor: string;
}

export interface RabatScaleEntry {
  range: string;
  discount: string;
}

export interface MonthlySpendingEntry {
  month: string;
  amount: number;
}

export interface Salon {
  id: number;
  name: string;
  address: string;
  phone: string;
  rating: number;
  reviews: number;
  partner: boolean;
  hours: string;
  city: string;
  x: number;
  y: number;
}

export interface AdminStatCard {
  label: string;
  value: string;
  change: string;
  up: boolean;
  color: string;
}

export interface AdminRevenueData {
  day: string;
  value: number;
}

export interface AdminRecentOrder {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: string;
  status: string;
  statusColor: string;
}

export interface AdminTopProduct {
  name: string;
  brand: string;
  sold: number;
  revenue: string;
}

export interface AdminLowStock {
  name: string;
  stock: number;
  threshold: number;
}

export interface AdminOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface AdminOrderTimeline {
  date: string;
  event: string;
  icon: string;
}

export interface AdminOrder {
  id: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  items: AdminOrderItem[];
  total: number;
  status: "novi" | "u_obradi" | "isporuceno" | "otkazano";
  paymentMethod: string;
  address: string;
  city: string;
  timeline: AdminOrderTimeline[];
}

export interface AdminUserOrder {
  id: string;
  date: string;
  total: number;
  status: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: "B2B" | "B2C";
  registrationDate: string;
  ordersCount: number;
  totalSpent: number;
  status: "active" | "blocked" | "pending";
  salonName?: string;
  pib?: string;
  address?: string;
  city?: string;
  orders?: AdminUserOrder[];
}

export interface AdminBanner {
  id: number;
  title: string;
  type: "Banner" | "Pop-up" | "Landing page hero";
  position: "Home page hero" | "Home page mid" | "Category page" | "B2B section";
  desktopImage: string;
  mobileImage: string;
  linkType: "Kategorija" | "Brend" | "Proizvod" | "Spoljašnji link";
  linkUrl: string;
  ctaText: string;
  target: "Svi" | "B2B" | "B2C";
  activeFrom: string;
  activeTo: string;
  displayOrder: number;
  status: "active" | "inactive";
}

export interface AdminPromoCode {
  id: number;
  code: string;
  type: "procentualni" | "fiksni";
  value: number;
  minOrder: number;
  usageCount: number;
  maxUses: number;
  maxUsesPerUser: number;
  validFrom: string;
  validTo: string;
  status: "active" | "expired" | "scheduled";
  target: "Svi" | "B2B" | "B2C";
  combinable: boolean;
  appliesTo: "Sve" | "Kategorija" | "Brend" | "Proizvod";
  appliesToValue: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  name: string;
  type: "B2B" | "B2C";
  subscribedDate: string;
  status: "active" | "unsubscribed";
}

export interface NewsletterCampaign {
  id: number;
  title: string;
  segment: "Svi" | "B2B" | "B2C";
  sentDate: string;
  openRate: number;
  clickRate: number;
  status: "draft" | "sent" | "scheduled";
}

export interface NewsletterAutomation {
  id: number;
  name: string;
  description: string;
  target: string;
  enabled: boolean;
  lastTriggered: string;
  icon: "Gift" | "Sparkles" | "GraduationCap" | "UserPlus" | "ShoppingCart";
}

export interface ShippingZone {
  name: string;
  rate: string;
  enabled: boolean;
}

export interface PaymentMethodSetting {
  name: string;
  description: string;
  enabled: boolean;
}

export interface NotificationSetting {
  name: string;
  description: string;
  email: boolean;
  push: boolean;
}

export interface AdminProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  status: "active" | "inactive";
  image: string;
  description: string;
}

export interface AnalyticsRevenueByMonth {
  month: string;
  value: number;
}

export interface AnalyticsCategoryData {
  name: string;
  value: number;
  color: string;
}

export interface AnalyticsBrandPerformance {
  brand: string;
  revenue: number;
  orders: number;
  growth: number;
}

export interface AnalyticsAcquisitionData {
  source: string;
  value: number;
}

export interface AnalyticsB2BvsB2C {
  b2b: { revenue: number; orders: number; avgOrder: number; percentage: number };
  b2c: { revenue: number; orders: number; avgOrder: number; percentage: number };
}

export interface AnalyticsCityData {
  city: string;
  orders: number;
  revenue: number;
  percentage: number;
}

export interface AnalyticsTimeRange {
  value: string;
  label: string;
}


// =============================================================================
// HOMEPAGE — Product Images
// =============================================================================

export const productImages: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop",
  2: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=500&h=500&fit=crop",
  3: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&h=500&fit=crop",
  4: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop",
  5: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop",
  6: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=500&fit=crop",
  7: "https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=500&h=500&fit=crop",
  8: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&h=500&fit=crop",
  9: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=500&h=500&fit=crop",
  10: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500&h=500&fit=crop",
  11: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=500&h=500&fit=crop",
  12: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&h=500&fit=crop",
  13: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop",
  14: "https://images.unsplash.com/photo-1599849556829-6cef53ccb3d3?w=500&h=500&fit=crop",
  15: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop",
  16: "https://images.unsplash.com/photo-1570194065650-d99fb4ee8249?w=500&h=500&fit=crop",
  17: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&h=500&fit=crop",
  18: "https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=500&h=500&fit=crop",
  19: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&h=500&fit=crop",
  20: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500&h=500&fit=crop",
};

export const instagramImages: string[] = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=300&h=300&fit=crop",
];


// =============================================================================
// HOMEPAGE — Trust Badges (icon refs removed, only text data)
// =============================================================================

export const trustBadges: TrustBadge[] = [
  { title: "Prirodna Formula", desc: "Nežna nega za vašu kosu sa premium sastojcima" },
  { title: "Bez Okrutnosti", desc: "Naši proizvodi nisu testirani na životinjama" },
  { title: "Stručno Odobreno", desc: "Testirano za sigurnost i vidljive rezultate" },
  { title: "Besplatna Dostava", desc: "Za porudžbine preko 5.000 RSD, bez dodatnih troškova" },
];


// =============================================================================
// HOMEPAGE — Product Tabs & Tabbed Products
// =============================================================================

export const productTabs: string[] = ["Šamponi", "Maske", "Serumi", "Ulja"];

export const tabbedProducts: Record<string, HomepageProduct[]> = {
  "Šamponi": [
    { id: 7, brand: "L'Oreal", name: "Metal Detox Šampon 300ml", price: 2400, rating: 5 },
    { id: 10, brand: "Wella", name: "Ultimate Repair Šampon 250ml", price: 2800, rating: 4 },
    { id: 11, brand: "Olaplex", name: "No.4 Bond Maintenance Šampon", price: 3600, badge: "HIT", rating: 5 },
    { id: 15, brand: "Matrix", name: "Total Results So Long Šampon 300ml", price: 1950, rating: 4 },
  ],
  "Maske": [
    { id: 8, brand: "Schwarzkopf", name: "BlondMe Bond Maska 200ml", price: 3100, badge: "NOVO", rating: 4 },
    { id: 14, brand: "Kerastase", name: "Nutritive Bain Satin 200ml", price: 3400, rating: 5 },
    { id: 3, brand: "Kerastase", name: "Elixir Ultime Maska 200ml", oldPrice: 4500, price: 3200, badge: "-29%", rating: 5 },
    { id: 16, brand: "L'Oreal", name: "Absolut Repair Gold Maska 250ml", price: 2900, rating: 5 },
  ],
  "Serumi": [
    { id: 9, brand: "Kerastase", name: "Genesis Serum Anti-Chute 90ml", price: 5200, badge: "NOVO", rating: 5 },
    { id: 5, brand: "Moroccanoil", name: "Treatment Original 100ml", price: 4200, rating: 4 },
    { id: 4, brand: "Olaplex", name: "No.3 Hair Perfector 100ml", oldPrice: 3800, price: 2850, badge: "-25%", rating: 5 },
    { id: 17, brand: "Wella", name: "Oil Reflections Luminous Serum 100ml", price: 3100, rating: 4 },
  ],
  "Ulja": [
    { id: 18, brand: "Moroccanoil", name: "Treatment Light 50ml", price: 3600, badge: "HIT", rating: 5 },
    { id: 19, brand: "Kerastase", name: "Elixir Ultime L'Huile 100ml", price: 4800, rating: 5 },
    { id: 20, brand: "L'Oreal", name: "Mythic Oil Original 100ml", price: 2700, rating: 4 },
    { id: 6, brand: "Schwarzkopf", name: "Oil Ultime Argan Finishing Oil 100ml", price: 2200, rating: 4 },
  ],
};


// =============================================================================
// HOMEPAGE — Bestsellers, New Arrivals, Sale Products
// =============================================================================

export const bestsellers: HomepageProduct[] = [
  { id: 4, brand: "Olaplex", name: "No.3 Hair Perfector 100ml", price: 2850, badge: "#1", rating: 5 },
  { id: 11, brand: "Olaplex", name: "No.4 Bond Maintenance Šampon 250ml", price: 3600, badge: "#2", rating: 5 },
  { id: 5, brand: "Moroccanoil", name: "Treatment Original 100ml", price: 4200, badge: "#3", rating: 5 },
  { id: 9, brand: "Kerastase", name: "Genesis Serum Anti-Chute 90ml", price: 5200, badge: "#4", rating: 5 },
  { id: 14, brand: "Kerastase", name: "Nutritive Bain Satin 200ml", price: 3400, badge: "#5", rating: 5 },
  { id: 12, brand: "Moroccanoil", name: "Hydrating Styling Cream 300ml", price: 3200, badge: "#6", rating: 5 },
  { id: 7, brand: "L'Oreal", name: "Metal Detox Šampon 300ml", price: 2400, badge: "#7", rating: 4 },
  { id: 8, brand: "Schwarzkopf", name: "BlondMe Bond Maska 200ml", price: 3100, badge: "#8", rating: 4 },
];

export const newArrivals: HomepageProduct[] = [
  { id: 15, brand: "Matrix", name: "Total Results So Long Šampon 300ml", price: 1950, badge: "NOVO", rating: 4 },
  { id: 16, brand: "L'Oreal", name: "Absolut Repair Gold Maska 250ml", price: 2900, badge: "NOVO", rating: 5 },
  { id: 17, brand: "Wella", name: "Oil Reflections Luminous Serum 100ml", price: 3100, badge: "NOVO", rating: 4 },
  { id: 18, brand: "Moroccanoil", name: "Treatment Light 50ml", price: 3600, badge: "NOVO", rating: 5 },
];

export const saleProducts: HomepageProduct[] = [
  { id: 1, brand: "L'Oreal", name: "Majirel 7.0 Srednje Plava", oldPrice: 1290, price: 890, badge: "-31%", rating: 5 },
  { id: 2, brand: "Schwarzkopf", name: "Igora Royal 6.1 Tamno Pepeljasta", oldPrice: 1350, price: 950, badge: "-30%", rating: 4 },
  { id: 3, brand: "Kerastase", name: "Elixir Ultime Serum", oldPrice: 4500, price: 3200, badge: "-29%", rating: 5 },
  { id: 4, brand: "Olaplex", name: "No.3 Hair Perfector", oldPrice: 3800, price: 2850, badge: "-25%", rating: 5 },
  { id: 5, brand: "Moroccanoil", name: "Treatment Original 100ml", oldPrice: 4200, price: 3150, badge: "-25%", rating: 4 },
  { id: 6, brand: "Wella", name: "Koleston Perfect 8/0", oldPrice: 1100, price: 780, badge: "-29%", rating: 4 },
  { id: 13, brand: "L'Oreal", name: "Vitamino Color Šampon 500ml", oldPrice: 2800, price: 2100, badge: "-25%", rating: 4 },
  { id: 10, brand: "Wella", name: "Ultimate Repair Šampon 250ml", oldPrice: 3200, price: 2800, badge: "-13%", rating: 4 },
];


// =============================================================================
// PRODUCTS PAGE — Brands, Hair Types, Category Tree, Filters, Sort Options
// =============================================================================

export const brandsFilter: string[] = ["L'Oreal", "Schwarzkopf", "Wella", "Kerastase", "Olaplex", "Moroccanoil", "Matrix", "Revlon"];

export const hairTypes: string[] = ["Normalna", "Suva", "Masna", "Farbana", "Oštećena", "Kovrdžava"];

export const categoryTree: CategoryTreeNode[] = [
  {
    name: "Kolor", children: [
      { name: "Boje za kosu", children: [{ name: "Permanentne" }, { name: "Bez amonijaka" }] },
      { name: "Oksidanti", children: [] },
      { name: "Dekoloranti", children: [] },
    ],
  },
  {
    name: "Nega", children: [
      { name: "Šamponi", children: [] },
      { name: "Maske", children: [] },
      { name: "Regeneratori", children: [] },
    ],
  },
  { name: "Styling", children: [] },
  { name: "Aparati", children: [] },
];

export const toggleFilters: ToggleFilter[] = [
  { key: "sulfate_free", label: "Bez sulfata" },
  { key: "paraben_free", label: "Bez parabena" },
  { key: "ammonia_free", label: "Bez amonijaka" },
  { key: "professional", label: "Profesionalna upotreba" },
  { key: "vegan", label: "Veganski proizvod" },
  { key: "new", label: "Noviteti" },
  { key: "on_sale", label: "Na akciji" },
];

export const sortOptions: SortOption[] = [
  { value: "popular", label: "Najpopularnije" },
  { value: "price-asc", label: "Cena: Najniža" },
  { value: "price-desc", label: "Cena: Najviša" },
  { value: "newest", label: "Najnovije" },
  { value: "rating", label: "Najbolje ocenjeno" },
];


// =============================================================================
// PRODUCTS PAGE — Product Listing
// =============================================================================

export const productsPageImages: string[] = [
  "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1574169208507-84376144848b?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&h=500&fit=crop",
];

export const productsPageProducts: ProductsPageProduct[] = [
  { id: 1, brand: "L'Oreal", name: "Majirel 7.0 Srednje Plava", oldPrice: 1290, price: 890, badge: "-31%", rating: 5, image: productsPageImages[0], professional: true },
  { id: 2, brand: "Schwarzkopf", name: "Igora Royal 6.1 Pepeljasta", oldPrice: 1350, price: 950, badge: "-30%", rating: 4, image: productsPageImages[1], professional: true },
  { id: 3, brand: "Kerastase", name: "Elixir Ultime Serum 100ml", oldPrice: 4500, price: 3200, badge: "-29%", rating: 5, image: productsPageImages[2], professional: false },
  { id: 4, brand: "Olaplex", name: "No.3 Hair Perfector 100ml", oldPrice: 3800, price: 2850, badge: "-25%", rating: 5, image: productsPageImages[3], professional: true },
  { id: 5, brand: "Moroccanoil", name: "Treatment Original 100ml", price: 4200, rating: 4, image: productsPageImages[4], professional: false },
  { id: 6, brand: "Wella", name: "Koleston Perfect 8/0", oldPrice: 1100, price: 780, badge: "-29%", rating: 4, image: productsPageImages[5], professional: true },
  { id: 7, brand: "L'Oreal", name: "Metal Detox Šampon 300ml", price: 2400, badge: "NOVO", rating: 5, image: productsPageImages[6], professional: false },
  { id: 8, brand: "Schwarzkopf", name: "BlondMe Bond Maska 200ml", price: 3100, badge: "NOVO", rating: 4, image: productsPageImages[7], professional: true },
  { id: 9, brand: "Kerastase", name: "Genesis Serum Anti-Chute", price: 5200, rating: 5, image: productsPageImages[8], professional: false },
  { id: 10, brand: "Wella", name: "Ultimate Repair Šampon 250ml", price: 2800, rating: 4, image: productsPageImages[9], professional: false },
  { id: 11, brand: "Olaplex", name: "No.4 Bond Šampon 250ml", price: 3600, badge: "HIT", rating: 5, image: productsPageImages[10], professional: true },
  { id: 12, brand: "Matrix", name: "Total Results Šampon 300ml", price: 1800, rating: 4, image: productsPageImages[11], professional: false },
];

export const searchSuggestions: SearchSuggestions = {
  products: [
    { name: "Majirel 7.0 Srednje Plava", brand: "L'Oreal", image: productsPageImages[0], price: 890 },
    { name: "Igora Royal 6.1 Pepeljasta", brand: "Schwarzkopf", image: productsPageImages[1], price: 950 },
    { name: "Elixir Ultime Serum 100ml", brand: "Kerastase", image: productsPageImages[2], price: 3200 },
  ],
  categories: ["Boje za kosu", "Šamponi za farbanu kosu"],
  brands: ["L'Oreal Professionnel"],
};


// =============================================================================
// PRODUCT DETAIL — Main Product, Reviews, Related Products, Color Shades
// =============================================================================

export const productDetail: ProductDetail = {
  id: 1,
  brand: "L'Oreal Professionnel",
  name: "Majirel 7.0 - Srednje Plava Boja za Kosu",
  rating: 4.8,
  reviewCount: 124,
  oldPrice: 1290,
  price: 890,
  productLine: "Majirel",
  professionalOnly: true,
  isColor: true,
  colorLevel: "7",
  colorUndertone: "Neutralni (Prirodni)",
  stock: 23,
  stockStatus: "in_stock",
  expectedDate: "",
  description: "Majirel je permanentna boja za kosu koja pruza savrseno pokrivanje sedih i dugotrajnu postojanost boje. Ionene G i Incell tehnologija stite kosu tokom procesa farbanja, ostavljajuci je mekom, sjajnom i punom zivota. Idealna za profesionalnu upotrebu u salonu.",
  ingredients: "Aqua, Cetearyl Alcohol, Propylene Glycol, Deceth-3, Laureth-12, Oleth-30, Hexadimethrine Chloride, Ammonium Hydroxide, Oleyl Alcohol, Glycol Distearate, Sodium Metabisulfite, Parfum.",
  usage: "Pomesajte boju sa L'Oreal Oxydant kremom u odnosu 1:1.5. Nanesite na suvu kosu. Vreme delovanja: 35 minuta za potpuno pokrivanje, 20 minuta za osvezavanje boje. Isperite temeljno i nanesite odgovarajuci sampon i balzam.",
};

export const productDetailReviews: Review[] = [
  { id: 1, name: "Jelena M.", rating: 5, date: "10. mar 2026", text: "Odlicna boja! Pokrivanje sedih je savrseno, a kosa je meka i sjajna nakon tretmana. Preporucujem svim kolegama frizerima." },
  { id: 2, name: "Marko S.", rating: 4, date: "5. mar 2026", text: "Kvalitetna boja sa dobrim pokrivanjem. Jedina zamerka je sto bi mogla biti malo postojanija na pranje. Inace odlican proizvod." },
  { id: 3, name: "Ana P.", rating: 5, date: "28. feb 2026", text: "Koristim Majirel vec godinama i uvek sam zadovoljna rezultatom. Nijansa je tacna, a kosa ostaje u odlicnom stanju." },
];

export const productDetailMainImages: string[] = [
  "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=800&fit=crop",
];

export const productDetailRelated: RelatedProduct[] = [
  { id: 2, brand: "L'Oreal", name: "Majirel 6.0 Tamno Plava", price: 890, rating: 5, image: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=500&h=500&fit=crop" },
  { id: 3, brand: "L'Oreal", name: "Majirel 8.0 Svetlo Plava", price: 890, rating: 4, image: "https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=500&h=500&fit=crop" },
  { id: 4, brand: "L'Oreal", name: "Oxydant Creme 6% 1000ml", price: 1200, rating: 5, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop" },
  { id: 5, brand: "L'Oreal", name: "Vitamino Color Šampon 300ml", price: 2100, rating: 4, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop" },
];

export const relatedShades: ColorShade[] = [
  { shade: "5.0", name: "Svetlo Smedja", color: "#6B4226" },
  { shade: "6.0", name: "Tamno Plava", color: "#8B6914" },
  { shade: "7.0", name: "Srednje Plava", color: "#A0824A", active: true },
  { shade: "7.1", name: "Pepeljasto Plava", color: "#9E8B6E" },
  { shade: "7.3", name: "Zlatno Plava", color: "#C4A265" },
  { shade: "7.4", name: "Bakarno Plava", color: "#B5651D" },
  { shade: "8.0", name: "Svetlo Plava", color: "#C4A97D" },
  { shade: "8.1", name: "Svetlo Pepeljasta", color: "#BEB09A" },
  { shade: "9.0", name: "Veoma Svetla Plava", color: "#D4C5A9" },
  { shade: "10.0", name: "Najsvetlija Plava", color: "#E8DCC8" },
];


// =============================================================================
// COLOR CHART — Brand Tabs, Levels, Undertones, Hex Mappings
// =============================================================================

export const colorBrandTabs: BrandTab[] = [
  { key: "majirel", label: "Majirel" },
  { key: "igora", label: "Igora Royal" },
  { key: "koleston", label: "Koleston" },
  { key: "inoa", label: "INOA" },
];

export const colorLevels: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

export const colorUndertones: Undertone[] = [
  { key: "N", label: "Natural" },
  { key: "A", label: "Pepeljasta" },
  { key: "G", label: "Zlatna" },
  { key: "C", label: "Bakar" },
  { key: "R", label: "Crvena" },
  { key: "V", label: "Ljubicasta" },
  { key: "M", label: "Mat" },
  { key: "B", label: "Braon" },
];

export const colorHexMap: Record<string, Record<string, string>> = {
  "1": { N: "#0a0a0a", A: "#1a1520", G: "#1a1510", C: "#1a1008", R: "#1a0808", V: "#150a1a", M: "#0f100a", B: "#1a1510" },
  "2": { N: "#1a1510", A: "#201a25", G: "#201a10", C: "#201008", R: "#200808", V: "#1a0a20", M: "#15160a", B: "#201a10" },
  "3": { N: "#3a2a1a", A: "#352a35", G: "#3a3018", C: "#3a2010", R: "#3a1510", V: "#2a1535", M: "#302a18", B: "#3a2a18" },
  "4": { N: "#4a3a2a", A: "#453545", G: "#504020", C: "#4a2a15", R: "#4a1a15", V: "#3a1a45", M: "#403a20", B: "#4a3520" },
  "5": { N: "#5a4a3a", A: "#554555", G: "#605028", C: "#5a3520", R: "#5a2520", V: "#4a2555", M: "#504a28", B: "#5a4528" },
  "6": { N: "#6a5a4a", A: "#655565", G: "#706030", C: "#6a4525", R: "#6a3025", V: "#5a3065", M: "#605a30", B: "#6a5530" },
  "7": { N: "#8a7a6a", A: "#857585", G: "#907838", C: "#8a5a30", R: "#8a4030", V: "#7a4085", M: "#7a7a38", B: "#8a7038" },
  "8": { N: "#a89878", A: "#a59598", G: "#b09548", C: "#a86a38", R: "#a85038", V: "#985098", M: "#989848", B: "#a88848" },
  "9": { N: "#c8b898", A: "#c0b0b8", G: "#d0b558", C: "#c88048", R: "#c86048", V: "#b868b0", M: "#b8b858", B: "#c8a058" },
  "10": { N: "#e8d8b8", A: "#d8c8d8", G: "#e8d068", C: "#e89858", R: "#e87858", V: "#d080c8", M: "#d0d068", B: "#e0b868" },
};

export function generateColors(): ColorItem[] {
  const colors: ColorItem[] = [];
  colorLevels.forEach((level) => {
    colorUndertones.forEach((ut) => {
      const hex = colorHexMap[level]?.[ut.key] || "#888888";
      colors.push({
        code: `${level}.${ut.key === "N" ? "0" : ut.key === "A" ? "1" : ut.key === "G" ? "3" : ut.key === "C" ? "4" : ut.key === "R" ? "6" : ut.key === "V" ? "2" : ut.key === "M" ? "7" : "8"}`,
        hex,
        name: `Nivo ${level} ${ut.label}`,
        level,
        undertone: ut.key,
        price: 890,
      });
    });
  });
  return colors;
}


// =============================================================================
// CART — Items, Recommended, Delivery Options, Payment Methods
// =============================================================================

export const cartItems: CartItem[] = [
  { id: 1, brand: "L'Oreal", name: "Majirel 7.0 Srednje Plava", price: 890, quantity: 3, image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=200&h=200&fit=crop" },
  { id: 2, brand: "Kerastase", name: "Elixir Ultime Serum 100ml", price: 3200, quantity: 1, image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=200&h=200&fit=crop" },
  { id: 3, brand: "Olaplex", name: "No.3 Hair Perfector 100ml", price: 2850, quantity: 2, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=200&h=200&fit=crop" },
];

export const cartRecommended: RecommendedProduct[] = [
  { id: 5, brand: "L'Oreal", name: "Oxydant Creme 6% 1000ml", price: 1200, rating: 5, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop" },
  { id: 6, brand: "Kerastase", name: "Nutritive Bain Satin", price: 3400, rating: 4, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop" },
  { id: 7, brand: "Olaplex", name: "No.4 Bond Šampon 250ml", price: 3600, rating: 5, image: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=500&h=500&fit=crop" },
  { id: 8, brand: "Moroccanoil", name: "Treatment Original 100ml", price: 4200, rating: 4, image: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&h=500&fit=crop" },
];

export const cartPaymentBadges: string[] = ["Visa", "Mastercard", "PayPal", "Pouzece"];


// =============================================================================
// WISHLIST — Items
// =============================================================================

export const wishlistItems: WishlistItem[] = [
  { id: 1, name: "Absolut Repair Šampon 300ml", brand: "L'Oréal Professionnel", price: 3490, salePrice: 2790, badge: "-20%", rating: 4.8, inStock: true, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop" },
  { id: 2, name: "No.3 Hair Perfector 100ml", brand: "Olaplex", price: 3290, salePrice: null, badge: null, rating: 4.9, inStock: true, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop" },
  { id: 3, name: "Elixir Ultime Ulje 100ml", brand: "Kérastase", price: 4590, salePrice: 3490, badge: "-24%", rating: 4.7, inStock: true, image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&h=500&fit=crop" },
  { id: 4, name: "Igora Royal 7-1 60ml", brand: "Schwarzkopf", price: 790, salePrice: null, badge: null, rating: 4.6, inStock: false, image: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=500&h=500&fit=crop" },
  { id: 5, name: "Oil Reflections Ulje 100ml", brand: "Wella Professionals", price: 2990, salePrice: 2290, badge: "AKCIJA", rating: 4.9, inStock: true, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=500&fit=crop" },
  { id: 6, name: "Nutritive Bain Satin 250ml", brand: "Kérastase", price: 3290, salePrice: null, badge: null, rating: 4.8, inStock: true, image: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&h=500&fit=crop" },
];


// =============================================================================
// QUICK ORDER — Products, Recent B2B Orders
// =============================================================================

export const quickOrderProducts: QuickOrderProduct[] = [
  { code: "MAJ-7.1", name: "Majirel 7.1 Pepeljasto Plava 50ml", brand: "L'Oréal", price: 890, category: "Boja" },
  { code: "MAJ-6.0", name: "Majirel 6.0 Tamno Plava 50ml", brand: "L'Oréal", price: 890, category: "Boja" },
  { code: "IGO-6-0", name: "Igora Royal 6-0 60ml", brand: "Schwarzkopf", price: 790, category: "Boja" },
  { code: "IGO-7-1", name: "Igora Royal 7-1 60ml", brand: "Schwarzkopf", price: 790, category: "Boja" },
  { code: "OXI-6", name: "Oxydant Creme 6% 1000ml", brand: "L'Oréal", price: 690, category: "Oksidant" },
  { code: "OXI-9", name: "Oxydant Creme 9% 1000ml", brand: "L'Oréal", price: 690, category: "Oksidant" },
  { code: "ABS-SH", name: "Absolut Repair Šampon 1500ml", brand: "L'Oréal", price: 5490, category: "Šampon" },
  { code: "ABS-MS", name: "Absolut Repair Maska 500ml", brand: "L'Oréal", price: 4890, category: "Maska" },
  { code: "BC-REP", name: "BC Repair Rescue Šampon 1000ml", brand: "Schwarzkopf", price: 3290, category: "Šampon" },
  { code: "KER-BN", name: "Bain Satin 1 Šampon 1000ml", brand: "Kérastase", price: 5890, category: "Šampon" },
];

export const quickOrderRecentOrders: RecentB2BOrder[] = [
  { id: "ORD-2847", date: "10. Mar 2025", items: 12, total: 28450 },
  { id: "ORD-2831", date: "25. Feb 2025", items: 8, total: 19200 },
  { id: "ORD-2815", date: "12. Feb 2025", items: 15, total: 34600 },
];


// =============================================================================
// OUTLET — Products
// =============================================================================

export const outletProducts: OutletProduct[] = [
  { id: 1, name: "Vitamino Color Šampon 300ml", brand: "L'Oréal Professionnel", regularPrice: 3290, salePrice: 1290, discount: 61, rating: 4.5, image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop" },
  { id: 2, name: "Moisture Recovery Maska 250ml", brand: "TIGI", regularPrice: 2490, salePrice: 990, discount: 60, rating: 4.3, image: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=500&h=500&fit=crop" },
  { id: 3, name: "Session Label Gel 300ml", brand: "Wella Professionals", regularPrice: 1890, salePrice: 690, discount: 63, rating: 4.1, image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&h=500&fit=crop" },
  { id: 4, name: "Bed Head Masterpiece Lak 340ml", brand: "TIGI", regularPrice: 1690, salePrice: 590, discount: 65, rating: 4.2, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop" },
  { id: 5, name: "Curl Contour Šampon 250ml", brand: "L'Oréal Professionnel", regularPrice: 2890, salePrice: 1190, discount: 59, rating: 4.4, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop" },
  { id: 6, name: "Color Freeze Regenerator 200ml", brand: "Schwarzkopf", regularPrice: 1990, salePrice: 790, discount: 60, rating: 4.6, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=500&fit=crop" },
  { id: 7, name: "Osis+ Dust It Puder 10g", brand: "Schwarzkopf", regularPrice: 1290, salePrice: 490, discount: 62, rating: 4.0, image: "https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=500&h=500&fit=crop" },
  { id: 8, name: "Aura Botanica Maska 200ml", brand: "Kérastase", regularPrice: 4290, salePrice: 1690, discount: 61, rating: 4.7, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&h=500&fit=crop" },
];


// =============================================================================
// FAQ — Sections & Items
// =============================================================================

export const faqSections: FaqSection[] = [
  {
    title: "Narudžbine i Dostava",
    items: [
      { q: "Koliko traje dostava?", a: "Standardna dostava traje 1-3 radna dana za teritoriju Srbije. Za Beograd je moguća dostava narednog radnog dana za porudžbine primljene do 14h." },
      { q: "Koliko košta dostava?", a: "Dostava je besplatna za sve porudžbine iznad 5.000 RSD. Za porudžbine manje vrednosti, cena dostave iznosi 350 RSD." },
      { q: "Kako mogu pratiti svoju porudžbinu?", a: "Nakon slanja porudžbine, dobićete email sa tracking brojem i linkom za praćenje. Status porudžbine možete pratiti i na svom nalogu u sekciji 'Porudžbine'." },
      { q: "Mogu li promeniti adresu dostave nakon naručivanja?", a: "Da, ukoliko porudžbina još nije poslata, kontaktirajte nas putem telefona ili emaila i promenićemo adresu dostave." },
      { q: "Da li vršite dostavu van Srbije?", a: "Trenutno vršimo dostavu samo na teritoriji Republike Srbije. Za porudžbine iz inostranstva, kontaktirajte nas direktno." },
    ],
  },
  {
    title: "Plaćanje",
    items: [
      { q: "Koji načini plaćanja su dostupni?", a: "Prihvatamo platne kartice (Visa, Mastercard, Maestro, Dina), plaćanje pouzećem, kao i plaćanje putem fakture za B2B korisnike." },
      { q: "Da li je online plaćanje sigurno?", a: "Apsolutno. Koristimo SSL enkripciju i sertifikovane payment gateway sisteme. Vaši podaci o kartici nikada ne prolaze kroz naš server." },
      { q: "Mogu li platiti na rate?", a: "Da, za porudžbine iznad 10.000 RSD nudimo mogućnost plaćanja na 2-6 rata bez kamate za odabrane kartice." },
      { q: "Kada se vrši naplata sa kartice?", a: "Naplata se vrši u momentu potvrde porudžbine. U slučaju otkazivanja, refundacija se vrši u roku od 3-5 radnih dana." },
    ],
  },
  {
    title: "B2B Program",
    items: [
      { q: "Kako se registrovati kao B2B korisnik?", a: "Kliknite na 'B2B Registracija' i popunite formular sa podacima o vašem salonu (PIB, matični broj, adresa). Naš tim će pregledati i odobriti vaš nalog u roku od 24h." },
      { q: "Koje su prednosti B2B programa?", a: "B2B korisnici imaju pristup posebnim cenama, rabatnim skalama, ekskluzivnim profesionalnim proizvodima, mogućnosti naručivanja po fakturi i loyalty programu." },
      { q: "Da li postoji minimalan iznos porudžbine za B2B?", a: "Da, minimalan iznos B2B porudžbine je 10.000 RSD. Ovo omogućava optimizaciju logistike i održavanje posebnih cena." },
      { q: "Kako funkcioniše plaćanje po fakturi?", a: "B2B korisnici sa odobrenim kreditnim limitom mogu naručivati sa odloženim plaćanjem. Rok plaćanja je 15-30 dana u zavisnosti od ugovora." },
    ],
  },
  {
    title: "Proizvodi",
    items: [
      { q: "Da li su svi proizvodi originalni?", a: "Da, svi naši proizvodi su 100% originalni i nabavljeni direktno od ovlašćenih distributera. Garantujemo autentičnost svakog proizvoda." },
      { q: "Koji je rok trajanja proizvoda?", a: "Svi proizvodi imaju minimalno 12 meseci do isteka roka trajanja u momentu isporuke. Rok trajanja je jasno naznačen na pakovanju." },
      { q: "Kako da odaberem pravi proizvod za svoj tip kose?", a: "Koristite naše filtere za tip kose pri pretrazi proizvoda. Takođe, naš blog sadrži vodiče za odabir proizvoda. Za personalizovane preporuke, kontaktirajte nas." },
    ],
  },
  {
    title: "Povrat i Reklamacije",
    items: [
      { q: "Kakva je politika povrata?", a: "Imate pravo na povrat neotvorenog proizvoda u roku od 14 dana od prijema. Proizvod mora biti u originalnom pakovanju, neoštećen i nekorišćen." },
      { q: "Kako pokrenuti povrat?", a: "Kontaktirajte nas putem emaila na reklamacije@altamoda.rs ili pozovite +381 11 123 4567. Naš tim će vam dati instrukcije za povrat." },
      { q: "Koliko traje refundacija?", a: "Nakon prijema vraćenog proizvoda, refundacija se procesira u roku od 5-7 radnih dana na isti način plaćanja koji ste koristili pri kupovini." },
    ],
  },
];


// =============================================================================
// ACCOUNT — Stats, Orders, Loyalty, Rabat, Payment History, Monthly Spending
// =============================================================================

export const accountStats: AccountStat[] = [
  { label: "Ukupno porudzbina", value: "47", color: "bg-blue-50 text-blue-600" },
  { label: "Loyalty poeni", value: "2.340", color: "bg-amber-50 text-amber-600" },
  { label: "B2B Status", value: "Gold", color: "bg-[#faf7f2] text-[#8c4a5a]" },
  { label: "Stanje dugovanja", value: "12.500 RSD", color: "bg-green-50 text-green-600" },
];

export const accountRecentOrders: AccountOrder[] = [
  { id: "ALT-2026-0341", date: "15. mar 2026", items: 5, total: "24.500 RSD", status: "Isporuceno", statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0328", date: "10. mar 2026", items: 3, total: "15.200 RSD", status: "U transportu", statusColor: "bg-blue-100 text-blue-700" },
  { id: "ALT-2026-0315", date: "5. mar 2026", items: 8, total: "42.100 RSD", status: "Isporuceno", statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0298", date: "28. feb 2026", items: 2, total: "8.400 RSD", status: "Isporuceno", statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0285", date: "22. feb 2026", items: 12, total: "56.800 RSD", status: "Isporuceno", statusColor: "bg-green-100 text-green-700" },
];

export const loyaltyLevels: LoyaltyLevel[] = [
  { name: "Bronzani", min: 0, max: 1000, benefits: ["5% popust na sve proizvode", "Besplatna dostava preko 7.000 RSD", "Pristup newsletter promocijama"] },
  { name: "Srebrni", min: 1000, max: 2000, benefits: ["8% popust na sve proizvode", "Besplatna dostava preko 5.000 RSD", "Rani pristup akcijama", "Besplatni uzorci uz porudzbinu"] },
  { name: "Zlatni", min: 2000, max: 3500, benefits: ["12% popust na sve proizvode", "Besplatna dostava", "Prioritetna podrska", "Ekskluzivni seminari", "Poklon za rodjendan"] },
  { name: "Platinasti", min: 3500, max: 5000, benefits: ["15% popust na sve proizvode", "Besplatna ekspres dostava", "Licni konsultant", "VIP pristup dogadjajima", "Besplatni seminari", "Mesecni poklon paket"] },
];

export const rabatScale: RabatScaleEntry[] = [
  { range: "0 - 50.000 RSD", discount: "5%" },
  { range: "50.000 - 100.000 RSD", discount: "8%" },
  { range: "100.000 - 200.000 RSD", discount: "12%" },
  { range: "200.000+ RSD", discount: "15%" },
];

export const paymentHistory: PaymentHistoryEntry[] = [
  { date: "12. mar 2026", amount: "24.500 RSD", method: "Kartica", status: "Placeno", statusColor: "text-green-600" },
  { date: "5. mar 2026", amount: "42.100 RSD", method: "Faktura", status: "Placeno", statusColor: "text-green-600" },
  { date: "28. feb 2026", amount: "8.400 RSD", method: "Kartica", status: "Placeno", statusColor: "text-green-600" },
  { date: "15. feb 2026", amount: "12.500 RSD", method: "Faktura", status: "Neplaceno", statusColor: "text-red-600" },
  { date: "1. feb 2026", amount: "31.200 RSD", method: "Kartica", status: "Placeno", statusColor: "text-green-600" },
];

export const monthlySpending: MonthlySpendingEntry[] = [
  { month: "Okt", amount: 45000 },
  { month: "Nov", amount: 62000 },
  { month: "Dec", amount: 78000 },
  { month: "Jan", amount: 34000 },
  { month: "Feb", amount: 56000 },
  { month: "Mar", amount: 42000 },
];

export const accountCurrentDebt = 12500;
export const accountCurrentPoints = 2340;
export const accountCurrentLevelIndex = 2; // Zlatni
export const accountNextLevelThreshold = 3500;


// =============================================================================
// SALON LOCATOR — Salons & Cities
// =============================================================================

export const salons: Salon[] = [
  { id: 1, name: "Salon Glamour", address: "Knez Mihailova 24, Beograd", phone: "+381 11 234 5678", rating: 4.9, reviews: 128, partner: true, hours: "Pon-Sub: 09:00-20:00", city: "Beograd", x: 45, y: 35 },
  { id: 2, name: "Studio Belle", address: "Bulevar Oslobođenja 112, Novi Sad", phone: "+381 21 456 7890", rating: 4.7, reviews: 89, partner: true, hours: "Pon-Pet: 09:00-19:00, Sub: 09:00-15:00", city: "Novi Sad", x: 30, y: 25 },
  { id: 3, name: "Hair Atelier", address: "Nikole Pašića 18, Niš", phone: "+381 18 345 6789", rating: 4.8, reviews: 67, partner: true, hours: "Pon-Sub: 08:00-20:00", city: "Niš", x: 65, y: 65 },
  { id: 4, name: "Chic & Style", address: "Kralja Petra I 45, Kragujevac", phone: "+381 34 567 8901", rating: 4.6, reviews: 45, partner: false, hours: "Pon-Pet: 09:00-19:00", city: "Kragujevac", x: 48, y: 50 },
  { id: 5, name: "Prestige Hair Studio", address: "Korzo 15, Subotica", phone: "+381 24 678 9012", rating: 4.8, reviews: 92, partner: true, hours: "Pon-Sub: 09:00-21:00", city: "Subotica", x: 28, y: 10 },
];

export const salonCities: string[] = ["Svi gradovi", "Beograd", "Novi Sad", "Niš", "Kragujevac", "Subotica"];


// =============================================================================
// ADMIN DASHBOARD — Stat Cards, Revenue, Recent Orders, Top Products, Low Stock
// =============================================================================

export const adminStatCards: AdminStatCard[] = [
  { label: "Ukupna Prodaja", value: "2.847.350 RSD", change: "+12.5%", up: true, color: "bg-emerald-50 text-emerald-600" },
  { label: "Porudžbine Danas", value: "34", change: "+8.2%", up: true, color: "bg-blue-50 text-blue-600" },
  { label: "Novi Korisnici", value: "156", change: "+23.1%", up: true, color: "bg-purple-50 text-purple-600" },
  { label: "Prosečna Korpa", value: "8.420 RSD", change: "-2.4%", up: false, color: "bg-orange-50 text-orange-600" },
];

export const adminRevenueData: AdminRevenueData[] = [
  { day: "Pon", value: 65 },
  { day: "Uto", value: 45 },
  { day: "Sre", value: 78 },
  { day: "Čet", value: 52 },
  { day: "Pet", value: 90 },
  { day: "Sub", value: 70 },
  { day: "Ned", value: 35 },
];

export const adminRecentOrders: AdminRecentOrder[] = [
  { id: "#1048", customer: "Salon Glamour", date: "17.03.2026", items: 4, total: "15.200 RSD", status: "Isporučeno", statusColor: "bg-emerald-100 text-emerald-700" },
  { id: "#1047", customer: "Marija Petrović", date: "17.03.2026", items: 2, total: "4.800 RSD", status: "U Obradi", statusColor: "bg-yellow-100 text-yellow-700" },
  { id: "#1046", customer: "Beauty Studio NS", date: "16.03.2026", items: 8, total: "32.500 RSD", status: "Isporučeno", statusColor: "bg-emerald-100 text-emerald-700" },
  { id: "#1045", customer: "Ana Jovanović", date: "16.03.2026", items: 1, total: "2.100 RSD", status: "Otkazano", statusColor: "bg-red-100 text-red-700" },
  { id: "#1044", customer: "Salon Prestige", date: "15.03.2026", items: 12, total: "48.900 RSD", status: "U Obradi", statusColor: "bg-yellow-100 text-yellow-700" },
];

export const adminTopProducts: AdminTopProduct[] = [
  { name: "L'Oréal Professionnel Serie Expert", brand: "L'Oréal", sold: 142, revenue: "354.800 RSD" },
  { name: "Schwarzkopf BC Bonacure", brand: "Schwarzkopf", sold: 98, revenue: "245.000 RSD" },
  { name: "Kérastase Elixir Ultime", brand: "Kérastase", sold: 87, revenue: "348.000 RSD" },
  { name: "Wella Professionals Oil Reflections", brand: "Wella", sold: 76, revenue: "152.000 RSD" },
  { name: "Moroccanoil Treatment", brand: "Moroccanoil", sold: 65, revenue: "227.500 RSD" },
];

export const adminLowStock: AdminLowStock[] = [
  { name: "Kérastase Elixir Ultime 100ml", stock: 3, threshold: 10 },
  { name: "L'Oréal Majirel 50ml - 7.0", stock: 5, threshold: 15 },
  { name: "Schwarzkopf Igora Royal 60ml - 6.1", stock: 2, threshold: 10 },
  { name: "Wella Koleston Perfect 60ml - 8/0", stock: 4, threshold: 12 },
];


// =============================================================================
// ADMIN ORDERS — Full Order Details with Timelines
// =============================================================================

export const adminOrderStatusLabels: Record<string, string> = {
  novi: "Novi",
  u_obradi: "U Obradi",
  isporuceno: "Isporučeno",
  otkazano: "Otkazano",
};

export const adminOrderStatusColors: Record<string, string> = {
  novi: "bg-blue-100 text-blue-700",
  u_obradi: "bg-yellow-100 text-yellow-700",
  isporuceno: "bg-emerald-100 text-emerald-700",
  otkazano: "bg-red-100 text-red-700",
};

export const adminOrderStatusFilters: string[] = ["Svi", "Novi", "U Obradi", "Isporučeno", "Otkazano"];

export const adminAllOrders: AdminOrder[] = [
  {
    id: "#1048", customer: "Salon Glamour", email: "info@salonglamour.rs", phone: "+381 11 234 5678",
    date: "17.03.2026",
    items: [
      { name: "L'Oréal Serie Expert Gold Quinoa", quantity: 5, price: 2500 },
      { name: "Kérastase Elixir Ultime", quantity: 2, price: 4200 },
      { name: "Schwarzkopf BC Bonacure", quantity: 3, price: 1800 },
    ],
    total: 26300, status: "isporuceno", paymentMethod: "Virman", address: "Knez Mihailova 22", city: "Beograd",
    timeline: [
      { date: "17.03. 14:30", event: "Porudžbina isporučena", icon: "check" },
      { date: "16.03. 09:00", event: "Poslato kurirskom službom", icon: "truck" },
      { date: "15.03. 16:45", event: "Porudžbina obrađena", icon: "package" },
      { date: "15.03. 14:20", event: "Porudžbina primljena", icon: "clock" },
    ],
  },
  {
    id: "#1047", customer: "Marija Petrović", email: "marija.p@gmail.com", phone: "+381 63 123 4567",
    date: "17.03.2026",
    items: [
      { name: "Moroccanoil Treatment 100ml", quantity: 1, price: 3500 },
      { name: "Wella Oil Reflections Šampon", quantity: 1, price: 1950 },
    ],
    total: 5450, status: "u_obradi", paymentMethod: "Kartica", address: "Bulevar Oslobođenja 88", city: "Novi Sad",
    timeline: [
      { date: "17.03. 10:15", event: "Porudžbina u obradi", icon: "package" },
      { date: "17.03. 09:30", event: "Plaćanje potvrđeno", icon: "check" },
      { date: "17.03. 09:28", event: "Porudžbina primljena", icon: "clock" },
    ],
  },
  {
    id: "#1046", customer: "Beauty Studio NS", email: "beauty.studio@gmail.com", phone: "+381 21 456 7890",
    date: "16.03.2026",
    items: [
      { name: "Schwarzkopf Igora Royal 60ml", quantity: 20, price: 850 },
      { name: "L'Oréal Majirel 50ml", quantity: 15, price: 900 },
      { name: "Blondme Premium Lift", quantity: 5, price: 1100 },
    ],
    total: 36000, status: "isporuceno", paymentMethod: "Virman", address: "Jevrejska 10", city: "Novi Sad",
    timeline: [
      { date: "16.03. 15:00", event: "Porudžbina isporučena", icon: "check" },
      { date: "15.03. 08:30", event: "Poslato kurirskom službom", icon: "truck" },
      { date: "14.03. 14:00", event: "Porudžbina obrađena", icon: "package" },
      { date: "14.03. 11:45", event: "Porudžbina primljena", icon: "clock" },
    ],
  },
  {
    id: "#1045", customer: "Ana Jovanović", email: "ana.j@yahoo.com", phone: "+381 64 987 6543",
    date: "16.03.2026",
    items: [{ name: "OSIS+ Dust It", quantity: 1, price: 1200 }],
    total: 1200, status: "otkazano", paymentMethod: "Pouzeće", address: "Cara Dušana 15", city: "Niš",
    timeline: [
      { date: "16.03. 18:00", event: "Porudžbina otkazana - na zahtev kupca", icon: "x" },
      { date: "16.03. 12:00", event: "Porudžbina primljena", icon: "clock" },
    ],
  },
  {
    id: "#1044", customer: "Salon Prestige", email: "prestige@salon.rs", phone: "+381 11 333 4444",
    date: "15.03.2026",
    items: [
      { name: "Kérastase Elixir Ultime", quantity: 10, price: 4200 },
      { name: "L'Oréal Mythic Oil Huile", quantity: 8, price: 2800 },
      { name: "Tecni Art Pli Shaper", quantity: 6, price: 1450 },
    ],
    total: 73100, status: "u_obradi", paymentMethod: "Virman", address: "Terazije 5", city: "Beograd",
    timeline: [
      { date: "15.03. 16:00", event: "Porudžbina u obradi", icon: "package" },
      { date: "15.03. 14:30", event: "Plaćanje potvrđeno (virman)", icon: "check" },
      { date: "15.03. 10:00", event: "Porudžbina primljena", icon: "clock" },
    ],
  },
  {
    id: "#1043", customer: "Jelena Nikolić", email: "jelena.n@gmail.com", phone: "+381 65 111 2222",
    date: "15.03.2026",
    items: [
      { name: "Wella Koleston Perfect 60ml", quantity: 3, price: 950 },
      { name: "Schwarzkopf BC Bonacure", quantity: 2, price: 1800 },
    ],
    total: 6450, status: "novi", paymentMethod: "Kartica", address: "Vojvode Stepe 120", city: "Beograd",
    timeline: [
      { date: "15.03. 08:45", event: "Porudžbina primljena", icon: "clock" },
    ],
  },
  {
    id: "#1042", customer: "Hair Art Studio", email: "contact@hairart.rs", phone: "+381 34 555 6666",
    date: "14.03.2026",
    items: [
      { name: "L'Oréal Serie Expert Gold Quinoa", quantity: 12, price: 2500 },
      { name: "Moroccanoil Treatment 100ml", quantity: 6, price: 3500 },
    ],
    total: 51000, status: "isporuceno", paymentMethod: "Virman", address: "Kneza Miloša 33", city: "Kragujevac",
    timeline: [
      { date: "14.03. 16:00", event: "Porudžbina isporučena", icon: "check" },
      { date: "13.03. 10:00", event: "Poslato kurirskom službom", icon: "truck" },
      { date: "12.03. 15:00", event: "Porudžbina obrađena", icon: "package" },
      { date: "12.03. 09:30", event: "Porudžbina primljena", icon: "clock" },
    ],
  },
];


// =============================================================================
// ADMIN USERS
// =============================================================================

export const adminUsers: AdminUser[] = [
  {
    id: 1, name: "Salon Glamour", email: "info@salonglamour.rs", phone: "+381 11 234 5678",
    type: "B2B", registrationDate: "15.01.2026", ordersCount: 24, totalSpent: 458000, status: "active",
    salonName: "Salon Glamour", pib: "108234567", address: "Knez Mihailova 22", city: "Beograd",
    orders: [
      { id: "#1048", date: "17.03.2026", total: 26300, status: "Isporučeno" },
      { id: "#1032", date: "10.03.2026", total: 18500, status: "Isporučeno" },
      { id: "#1020", date: "28.02.2026", total: 34200, status: "Isporučeno" },
    ],
  },
  {
    id: 2, name: "Marija Petrović", email: "marija.p@gmail.com", phone: "+381 63 123 4567",
    type: "B2C", registrationDate: "22.02.2026", ordersCount: 3, totalSpent: 12800, status: "active",
    address: "Bulevar Oslobođenja 88", city: "Novi Sad",
    orders: [
      { id: "#1047", date: "17.03.2026", total: 5450, status: "U Obradi" },
      { id: "#1025", date: "05.03.2026", total: 3500, status: "Isporučeno" },
    ],
  },
  {
    id: 3, name: "Beauty Studio NS", email: "beauty.studio@gmail.com", phone: "+381 21 456 7890",
    type: "B2B", registrationDate: "03.12.2025", ordersCount: 38, totalSpent: 892000, status: "active",
    salonName: "Beauty Studio", pib: "109876543", address: "Jevrejska 10", city: "Novi Sad",
    orders: [
      { id: "#1046", date: "16.03.2026", total: 36000, status: "Isporučeno" },
      { id: "#1030", date: "08.03.2026", total: 42500, status: "Isporučeno" },
    ],
  },
  {
    id: 4, name: "Ana Jovanović", email: "ana.j@yahoo.com", phone: "+381 64 987 6543",
    type: "B2C", registrationDate: "10.03.2026", ordersCount: 1, totalSpent: 0, status: "active",
    address: "Cara Dušana 15", city: "Niš",
    orders: [{ id: "#1045", date: "16.03.2026", total: 1200, status: "Otkazano" }],
  },
  {
    id: 5, name: "Salon Prestige", email: "prestige@salon.rs", phone: "+381 11 333 4444",
    type: "B2B", registrationDate: "20.09.2025", ordersCount: 52, totalSpent: 1245000, status: "active",
    salonName: "Salon Prestige", pib: "107654321", address: "Terazije 5", city: "Beograd",
    orders: [
      { id: "#1044", date: "15.03.2026", total: 73100, status: "U Obradi" },
      { id: "#1028", date: "06.03.2026", total: 55800, status: "Isporučeno" },
    ],
  },
  {
    id: 6, name: "Hair Art Studio", email: "contact@hairart.rs", phone: "+381 34 555 6666",
    type: "B2B", registrationDate: "15.11.2025", ordersCount: 18, totalSpent: 324000, status: "active",
    salonName: "Hair Art Studio", pib: "110234567", address: "Kneza Miloša 33", city: "Kragujevac",
    orders: [{ id: "#1042", date: "14.03.2026", total: 51000, status: "Isporučeno" }],
  },
  {
    id: 7, name: "Ivana Marković", email: "ivana.m@hotmail.com", phone: "+381 66 222 3333",
    type: "B2C", registrationDate: "01.03.2026", ordersCount: 2, totalSpent: 7200, status: "blocked",
    address: "Gospodar Jevremova 40", city: "Beograd",
    orders: [],
  },
  {
    id: 8, name: "Studio Lepote BG", email: "studio.lepote.bg@gmail.com", phone: "+381 11 777 8888",
    type: "B2B", registrationDate: "16.03.2026", ordersCount: 0, totalSpent: 0, status: "pending",
    salonName: "Studio Lepote", pib: "111234567", address: "Makedonska 12", city: "Beograd",
    orders: [],
  },
  {
    id: 9, name: "Petar Đorđević", email: "petar.dj@gmail.com", phone: "+381 63 444 5555",
    type: "B2C", registrationDate: "28.02.2026", ordersCount: 5, totalSpent: 18500, status: "active",
    address: "Bulevar Cara Lazara 80", city: "Novi Sad",
    orders: [],
  },
  {
    id: 10, name: "Salon Elegance", email: "elegance.nis@gmail.com", phone: "+381 18 999 0000",
    type: "B2B", registrationDate: "17.03.2026", ordersCount: 0, totalSpent: 0, status: "pending",
    salonName: "Salon Elegance", pib: "112345678", address: "Obrenovićeva 22", city: "Niš",
    orders: [],
  },
];

export const adminUserTypeFilters: string[] = ["Svi", "B2B", "B2C"];
export const adminUserStatusFilterOptions: string[] = ["Svi statusi", "Aktivan", "Blokiran", "Na čekanju"];


// =============================================================================
// ADMIN BANNERS
// =============================================================================

export const adminBanners: AdminBanner[] = [
  {
    id: 1, title: "Prolećna akcija - do 30% popusta", type: "Banner", position: "Home page hero",
    desktopImage: "/banners/spring-desktop.jpg", mobileImage: "/banners/spring-mobile.jpg",
    linkType: "Kategorija", linkUrl: "/products?category=nega-kose", ctaText: "Pogledaj ponudu",
    target: "Svi", activeFrom: "2026-03-01", activeTo: "2026-04-30", displayOrder: 1, status: "active",
  },
  {
    id: 2, title: "Novi Kérastase proizvodi", type: "Banner", position: "Home page mid",
    desktopImage: "/banners/kerastase-desktop.jpg", mobileImage: "/banners/kerastase-mobile.jpg",
    linkType: "Brend", linkUrl: "/products?brand=kerastase", ctaText: "Otkrijte novitete",
    target: "Svi", activeFrom: "2026-02-15", activeTo: "2026-05-15", displayOrder: 2, status: "active",
  },
  {
    id: 3, title: "B2B - Posebne cene za salone", type: "Banner", position: "B2B section",
    desktopImage: "/banners/b2b-desktop.jpg", mobileImage: "/banners/b2b-mobile.jpg",
    linkType: "Kategorija", linkUrl: "/products?segment=b2b", ctaText: "Registrujte salon",
    target: "B2B", activeFrom: "2026-01-01", activeTo: "2026-12-31", displayOrder: 1, status: "active",
  },
  {
    id: 4, title: "Besplatna dostava preko 5000 RSD", type: "Pop-up", position: "Home page hero",
    desktopImage: "/banners/shipping-desktop.jpg", mobileImage: "/banners/shipping-mobile.jpg",
    linkType: "Spoljašnji link", linkUrl: "/faq#dostava", ctaText: "Saznaj više",
    target: "B2C", activeFrom: "2026-03-01", activeTo: "2026-06-30", displayOrder: 3, status: "active",
  },
  {
    id: 5, title: "Seminar - Balayage tehnike", type: "Landing page hero", position: "Category page",
    desktopImage: "/banners/seminar-desktop.jpg", mobileImage: "/banners/seminar-mobile.jpg",
    linkType: "Spoljašnji link", linkUrl: "/seminars/1", ctaText: "Prijavite se",
    target: "B2B", activeFrom: "2026-04-01", activeTo: "2026-04-15", displayOrder: 4, status: "inactive",
  },
  {
    id: 6, title: "Moroccanoil - Letnja kolekcija", type: "Banner", position: "Category page",
    desktopImage: "/banners/moroccanoil-desktop.jpg", mobileImage: "/banners/moroccanoil-mobile.jpg",
    linkType: "Proizvod", linkUrl: "/products/moroccanoil-treatment", ctaText: "Kupite sada",
    target: "Svi", activeFrom: "2026-06-01", activeTo: "2026-09-01", displayOrder: 5, status: "inactive",
  },
];


// =============================================================================
// ADMIN PROMO CODES
// =============================================================================

export const adminPromoCodes: AdminPromoCode[] = [
  { id: 1, code: "DOBRODOSLI10", type: "procentualni", value: 10, minOrder: 3000, usageCount: 245, maxUses: 500, maxUsesPerUser: 1, validFrom: "2026-01-01", validTo: "2026-06-30", status: "active", target: "Svi", combinable: false, appliesTo: "Sve", appliesToValue: "" },
  { id: 2, code: "B2B20", type: "procentualni", value: 20, minOrder: 15000, usageCount: 32, maxUses: 100, maxUsesPerUser: 3, validFrom: "2026-01-15", validTo: "2026-04-15", status: "active", target: "B2B", combinable: true, appliesTo: "Sve", appliesToValue: "" },
  { id: 3, code: "LETO500", type: "fiksni", value: 500, minOrder: 5000, usageCount: 150, maxUses: 150, maxUsesPerUser: 1, validFrom: "2025-06-01", validTo: "2025-09-01", status: "expired", target: "B2C", combinable: false, appliesTo: "Kategorija", appliesToValue: "Nega kose" },
  { id: 4, code: "KERASTASE15", type: "procentualni", value: 15, minOrder: 4000, usageCount: 78, maxUses: 200, maxUsesPerUser: 2, validFrom: "2026-02-01", validTo: "2026-05-01", status: "active", target: "Svi", combinable: false, appliesTo: "Brend", appliesToValue: "Kerastase" },
  { id: 5, code: "PROMO1000", type: "fiksni", value: 1000, minOrder: 8000, usageCount: 0, maxUses: 50, maxUsesPerUser: 1, validFrom: "2026-04-01", validTo: "2026-04-30", status: "scheduled", target: "B2C", combinable: true, appliesTo: "Sve", appliesToValue: "" },
  { id: 6, code: "SALON25", type: "procentualni", value: 25, minOrder: 20000, usageCount: 12, maxUses: 50, maxUsesPerUser: 5, validFrom: "2026-01-01", validTo: "2026-12-31", status: "active", target: "B2B", combinable: false, appliesTo: "Kategorija", appliesToValue: "Boje za kosu" },
  { id: 7, code: "BLACKFRIDAY30", type: "procentualni", value: 30, minOrder: 5000, usageCount: 500, maxUses: 500, maxUsesPerUser: 1, validFrom: "2025-11-25", validTo: "2025-11-29", status: "expired", target: "Svi", combinable: false, appliesTo: "Sve", appliesToValue: "" },
  { id: 8, code: "APRIL750", type: "fiksni", value: 750, minOrder: 6000, usageCount: 0, maxUses: 100, maxUsesPerUser: 1, validFrom: "2026-04-01", validTo: "2026-04-30", status: "scheduled", target: "Svi", combinable: true, appliesTo: "Proizvod", appliesToValue: "Moroccanoil Treatment" },
];


// =============================================================================
// ADMIN NEWSLETTER — Subscribers, Campaigns, Automations
// =============================================================================

export const newsletterSubscribers: NewsletterSubscriber[] = [
  { id: 1, email: "marija@gmail.com", name: "Marija Petrović", type: "B2C", subscribedDate: "2026-01-15", status: "active" },
  { id: 2, email: "salon.glamur@gmail.com", name: "Salon Glamur", type: "B2B", subscribedDate: "2026-01-10", status: "active" },
  { id: 3, email: "jelena.j@yahoo.com", name: "Jelena Jovanović", type: "B2C", subscribedDate: "2026-01-08", status: "active" },
  { id: 4, email: "studio.lepota@gmail.com", name: "Studio Lepota", type: "B2B", subscribedDate: "2025-12-20", status: "active" },
  { id: 5, email: "ana.m@gmail.com", name: "Ana Milić", type: "B2C", subscribedDate: "2025-12-15", status: "active" },
  { id: 6, email: "frizer.raj@outlook.com", name: "Frizerski Raj", type: "B2B", subscribedDate: "2025-12-10", status: "active" },
  { id: 7, email: "nina.s@gmail.com", name: "Nina Stojanović", type: "B2C", subscribedDate: "2025-11-28", status: "unsubscribed" },
  { id: 8, email: "salon.stil@gmail.com", name: "Salon Stil", type: "B2B", subscribedDate: "2025-11-20", status: "active" },
  { id: 9, email: "tamara.d@gmail.com", name: "Tamara Đorđević", type: "B2C", subscribedDate: "2025-11-15", status: "active" },
  { id: 10, email: "beauty.centar@gmail.com", name: "Beauty Centar", type: "B2B", subscribedDate: "2025-11-10", status: "active" },
  { id: 11, email: "ivana.k@yahoo.com", name: "Ivana Kostić", type: "B2C", subscribedDate: "2025-10-25", status: "active" },
  { id: 12, email: "hair.studio@gmail.com", name: "Hair Studio Pro", type: "B2B", subscribedDate: "2025-10-18", status: "active" },
  { id: 13, email: "milica.p@gmail.com", name: "Milica Pavlović", type: "B2C", subscribedDate: "2025-10-10", status: "unsubscribed" },
  { id: 14, email: "salon.lux@gmail.com", name: "Salon Lux", type: "B2B", subscribedDate: "2025-09-30", status: "active" },
  { id: 15, email: "sofija.n@gmail.com", name: "Sofija Nikolić", type: "B2C", subscribedDate: "2025-09-20", status: "active" },
];

export const newsletterCampaigns: NewsletterCampaign[] = [
  { id: 1, title: "Prolećna akcija - do 30% popusta", segment: "Svi", sentDate: "2026-03-05", openRate: 42, clickRate: 12, status: "sent" },
  { id: 2, title: "Novi Kérastase proizvodi stigli!", segment: "B2C", sentDate: "2026-02-20", openRate: 38, clickRate: 8, status: "sent" },
  { id: 3, title: "B2B posebna ponuda - April", segment: "B2B", sentDate: "", openRate: 0, clickRate: 0, status: "scheduled" },
  { id: 4, title: "Letnji vodič za negu kose", segment: "Svi", sentDate: "", openRate: 0, clickRate: 0, status: "draft" },
];

export const newsletterAutomations: NewsletterAutomation[] = [
  { id: 1, name: "Nove akcije → B2C pretplatnici", description: "Automatski šalje obaveštenje o novim akcijama svim B2C pretplatnicima", target: "B2C", enabled: true, lastTriggered: "2026-03-05 10:30", icon: "Gift" },
  { id: 2, name: "Noviteti → Svi pretplatnici", description: "Obaveštava sve pretplatnike o novim proizvodima u ponudi", target: "Svi", enabled: true, lastTriggered: "2026-02-20 14:00", icon: "Sparkles" },
  { id: 3, name: "Seminari → B2B pretplatnici", description: "Šalje pozivnice za seminare registrovanim salonima", target: "B2B", enabled: true, lastTriggered: "2026-02-15 09:00", icon: "GraduationCap" },
  { id: 4, name: "Dobrodošlica + promo kod → Novi pretplatnici", description: "Automatski šalje email dobrodošlice sa promo kodom od 10% novim pretplatnicima", target: "Novi", enabled: true, lastTriggered: "2026-03-10 16:45", icon: "UserPlus" },
  { id: 5, name: "Podsećanje na korpu → Svi", description: "Šalje podsećanje korisnicima koji su napustili korpu bez kupovine", target: "Svi", enabled: false, lastTriggered: "2026-03-01 08:00", icon: "ShoppingCart" },
];


// =============================================================================
// ADMIN SETTINGS — Shipping Zones, Payment Methods, Notifications
// =============================================================================

export const settingsShippingZones: ShippingZone[] = [
  { name: "Beograd", rate: "350", enabled: true },
  { name: "Vojvodina", rate: "450", enabled: true },
  { name: "Centralna Srbija", rate: "500", enabled: true },
  { name: "Južna Srbija", rate: "550", enabled: true },
  { name: "Kosovo i Metohija", rate: "650", enabled: false },
];

export const settingsPaymentMethods: PaymentMethodSetting[] = [
  { name: "Kreditna/Debitna kartica", description: "Visa, Mastercard, Dina", enabled: true },
  { name: "Pouzeće", description: "Plaćanje pri preuzimanju", enabled: true },
  { name: "Virman", description: "Bankarski transfer za B2B", enabled: true },
  { name: "PayPal", description: "Online plaćanje", enabled: false },
  { name: "Čekovi građana", description: "Na rate", enabled: false },
];

export const settingsNotifications: NotificationSetting[] = [
  { name: "Nova porudžbina", description: "Obaveštenje o novoj porudžbini", email: true, push: true },
  { name: "Porudžbina otkazana", description: "Obaveštenje o otkazanoj porudžbini", email: true, push: false },
  { name: "Nizak nivo zaliha", description: "Kada proizvod padne ispod minimuma", email: true, push: true },
  { name: "Novi korisnik", description: "Registracija novog korisnika", email: false, push: true },
  { name: "B2B zahtev", description: "Novi B2B zahtev za odobrenje", email: true, push: true },
  { name: "Recenzija proizvoda", description: "Nova recenzija na proizvodu", email: false, push: false },
];


// =============================================================================
// ADMIN PRODUCTS
// =============================================================================

export const adminProducts: AdminProduct[] = [
  { id: 1, name: "Serie Expert Gold Quinoa", brand: "L'Oréal", category: "Nega kose", price: 2500, oldPrice: 3200, stock: 45, status: "active", image: "/products/loreal1.jpg", description: "Profesionalni šampon za oštećenu kosu" },
  { id: 2, name: "BC Bonacure Peptide Repair", brand: "Schwarzkopf", category: "Nega kose", price: 1800, stock: 32, status: "active", image: "/products/schwarzkopf1.jpg", description: "Rescue šampon za finu kosu" },
  { id: 3, name: "Elixir Ultime Serum", brand: "Kérastase", category: "Ulja i serumi", price: 4200, oldPrice: 4800, stock: 3, status: "active", image: "/products/kerastase1.jpg", description: "Luksuzno ulje za sjaj kose" },
  { id: 4, name: "Oil Reflections Šampon", brand: "Wella", category: "Nega kose", price: 1950, stock: 28, status: "active", image: "/products/wella1.jpg", description: "Šampon za blistavu kosu" },
  { id: 5, name: "Moroccanoil Treatment 100ml", brand: "Moroccanoil", category: "Ulja i serumi", price: 3500, stock: 15, status: "active", image: "/products/moroccanoil1.jpg", description: "Originalni tretman za kosu" },
  { id: 6, name: "Igora Royal 60ml - 7.0", brand: "Schwarzkopf", category: "Boje za kosu", price: 850, stock: 120, status: "active", image: "/products/igora1.jpg", description: "Permanentna boja za kosu" },
  { id: 7, name: "Majirel 50ml - 6.0", brand: "L'Oréal", category: "Boje za kosu", price: 900, stock: 5, status: "active", image: "/products/majirel1.jpg", description: "Profesionalna boja za kosu" },
  { id: 8, name: "OSIS+ Dust It", brand: "Schwarzkopf", category: "Styling", price: 1200, stock: 42, status: "inactive", image: "/products/osis1.jpg", description: "Matirajući puder za volumen" },
  { id: 9, name: "Tecni Art Pli Shaper", brand: "L'Oréal", category: "Styling", price: 1450, stock: 18, status: "active", image: "/products/tecniart1.jpg", description: "Termo-aktivni gel za oblikovanje" },
  { id: 10, name: "Koleston Perfect 60ml - 8/0", brand: "Wella", category: "Boje za kosu", price: 950, stock: 4, status: "active", image: "/products/koleston1.jpg", description: "Profesionalna boja za kosu" },
  { id: 11, name: "Blondme Premium Lift", brand: "Schwarzkopf", category: "Boje za kosu", price: 1100, stock: 55, status: "active", image: "/products/blondme1.jpg", description: "Premium puder za posvetljivanje" },
  { id: 12, name: "Mythic Oil Huile", brand: "L'Oréal", category: "Ulja i serumi", price: 2800, stock: 22, status: "active", image: "/products/mythic1.jpg", description: "Hranljivo ulje za kosu" },
];

export const adminProductBrands: string[] = ["Svi brendovi", "L'Oréal", "Schwarzkopf", "Kérastase", "Wella", "Moroccanoil"];
export const adminProductCategories: string[] = ["Sve kategorije", "Nega kose", "Boje za kosu", "Styling", "Ulja i serumi"];
export const adminProductStatuses: string[] = ["Svi statusi", "Aktivan", "Neaktivan"];


// =============================================================================
// ADMIN ANALYTICS
// =============================================================================

export const analyticsTimeRanges: AnalyticsTimeRange[] = [
  { value: "7d", label: "7 dana" },
  { value: "30d", label: "30 dana" },
  { value: "90d", label: "90 dana" },
  { value: "1y", label: "1 godina" },
];

export const analyticsRevenueByMonth: AnalyticsRevenueByMonth[] = [
  { month: "Sep", value: 72 },
  { month: "Okt", value: 85 },
  { month: "Nov", value: 65 },
  { month: "Dec", value: 95 },
  { month: "Jan", value: 58 },
  { month: "Feb", value: 78 },
  { month: "Mar", value: 88 },
];

export const analyticsCategoryData: AnalyticsCategoryData[] = [
  { name: "Nega kose", value: 35, color: "#8c4a5a" },
  { name: "Boje za kosu", value: 28, color: "#2d2d2d" },
  { name: "Styling", value: 18, color: "#6b6b6b" },
  { name: "Ulja i serumi", value: 12, color: "#b07a87" },
  { name: "Oprema", value: 7, color: "#6e3848" },
];

export const analyticsBrandPerformance: AnalyticsBrandPerformance[] = [
  { brand: "L'Oréal", revenue: 1245000, orders: 342, growth: 15.2 },
  { brand: "Schwarzkopf", revenue: 980000, orders: 298, growth: 8.7 },
  { brand: "Kérastase", revenue: 856000, orders: 156, growth: 22.4 },
  { brand: "Wella", revenue: 654000, orders: 187, growth: -3.2 },
  { brand: "Moroccanoil", revenue: 523000, orders: 134, growth: 12.8 },
];

export const analyticsAcquisitionData: AnalyticsAcquisitionData[] = [
  { source: "Direktan pristup", value: 35 },
  { source: "Google pretraga", value: 28 },
  { source: "Društvene mreže", value: 20 },
  { source: "Email kampanje", value: 12 },
  { source: "Preporuke", value: 5 },
];

export const analyticsB2BvsB2C: AnalyticsB2BvsB2C = {
  b2b: { revenue: 3458000, orders: 245, avgOrder: 14114, percentage: 62 },
  b2c: { revenue: 2124000, orders: 872, avgOrder: 2436, percentage: 38 },
};

export const analyticsCityData: AnalyticsCityData[] = [
  { city: "Beograd", orders: 456, revenue: 2845000, percentage: 42 },
  { city: "Novi Sad", orders: 234, revenue: 1234000, percentage: 22 },
  { city: "Niš", orders: 123, revenue: 654000, percentage: 12 },
  { city: "Kragujevac", orders: 89, revenue: 423000, percentage: 8 },
  { city: "Subotica", orders: 67, revenue: 312000, percentage: 6 },
  { city: "Novi Pazar", orders: 45, revenue: 198000, percentage: 4 },
  { city: "Čačak", orders: 34, revenue: 156000, percentage: 3 },
  { city: "Ostali", orders: 69, revenue: 178000, percentage: 3 },
];
