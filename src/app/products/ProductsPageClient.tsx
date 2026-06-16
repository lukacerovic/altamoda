"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Heart, Star, SlidersHorizontal,
  ChevronDown, ChevronRight, Grid3X3, LayoutList,
  X, ArrowUpDown, ShoppingBag, CheckCircle, Palette,
} from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/* ─── Types ─── */
interface ProductBrand {
  id?: string;
  name: string;
  slug: string;
}

interface ProductCategory {
  id?: string;
  nameLat: string;
  slug: string;
}

interface ColorProduct {
  id: string;
  colorLevel: number;
  undertoneCode: string;
  undertoneName: string;
  hexValue: string;
  shadeCode: string;
}

interface ColorSibling {
  id: string;
  slug: string;
  name: string;
  sku: string;
  brand: string;
  price: number;
  image: string | null;
  colorCode: string | null;
  colorName: string | null;
  hex: string | null;
  stockQuantity: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: ProductBrand | null;
  category: ProductCategory | null;
  price: number | null;
  priceB2c: number | null;
  priceB2b: number | null;
  oldPrice: number | null;
  image: string | null;
  isProfessional: boolean;
  isNew: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  colorProduct: ColorProduct | null;
  variantCount?: number;
  groupSlug?: string | null;
  promoBadge?: string | null;
  colorSiblings?: ColorSibling[];
}

interface BrandFilter {
  id: string;
  name: string;
  slug: string;
}

interface CategoryNode {
  id: string;
  nameLat: string;
  slug: string;
  children: CategoryNode[];
}

interface AttributeFilter {
  id: string;
  nameLat: string;
  slug: string;
  type: string;
  options: { id: string; value: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price: number | null;
  oldPrice: number | null;
  image: string | null;
  isProfessional: boolean;
}

interface ColorLevelFacet {
  level: number;
  count: number;
  hexSamples: string[];
}

interface ColorUndertoneFacet {
  code: string;
  name: string;
  count: number;
  hexSamples: string[];
}

interface ProductLineFilter {
  id: string;
  name: string;
  slug: string;
  brand: { id: string; name: string; slug: string };
}

interface ProductsPageClientProps {
  initialProducts: Product[];
  initialPagination: Pagination;
  brands: BrandFilter[];
  categories: CategoryNode[];
  productLines: ProductLineFilter[];
  productTypes: string[];
  hairTypes: string[];
  tags: string[];
  attributes: AttributeFilter[];
  userRole: string | null;
  wishlistedProductIds?: string[];
  availableColorLevels?: ColorLevelFacet[];
  availableColorUndertones?: ColorUndertoneFacet[];
  activeBrand?: {
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    content: string | null;
  } | null;
}

/* ─── Helpers ─── */
const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop";

/* sessionStorage keys — preserve the accumulated list + scroll position so that
 * returning from a product detail page restores the exact state the user left,
 * instead of re-fetching page 1, reshuffling, and jumping to the top. */
const LIST_SNAPSHOT_KEY = "productsListSnapshot";
const LIST_RETURN_KEY = "productsListReturn";

/* Restore scroll to `y`, retrying every frame until the (async-rendered) list
 * is tall enough to actually reach it, then holding briefly to defeat any
 * competing scroll-to-top from the router. Gives up after ~2.5s. */
function restoreScrollTo(y: number) {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  let start = 0;
  let reachedAt = 0;
  const step = (now: number) => {
    // Bail if the user navigated away (e.g. into another product) so we never
    // hijack the scroll position of a different page.
    if (window.location.pathname !== path) return;
    if (!start) start = now;
    // `behavior: "instant"` overrides the global `html { scroll-behavior: smooth }`
    // so we snap straight to `y` instead of animating up from the top.
    window.scrollTo({ top: y, left: 0, behavior: "instant" });
    const reached = Math.abs(window.scrollY - y) <= 2;
    if (reached && !reachedAt) reachedAt = now;
    const heldLongEnough = reachedAt && now - reachedAt > 250;
    const timedOut = now - start > 2500;
    if (!heldLongEnough && !timedOut) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ─── Seeded shuffle ───
 * Per-visit randomization for the default "popular" sort. Featured items
 * stay anchored at the top in their original order; the rest is shuffled with
 * a fresh seed generated on every page mount — so each refresh / navigation
 * to /products yields a new order, while pagination clicks and filter changes
 * within a single visit stay stable (same mount = same seed). SSR is
 * unaffected — shuffle runs client-side only, preserving ISR cache.
 */
function getFreshSeed(): number {
  if (typeof window === "undefined") return 0;
  // +1 keeps the seed non-zero (0 is the "no shuffle" sentinel)
  return Math.floor(Math.random() * 0xfffffffe) + 1;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function applyDefaultShuffle<T>(products: T[], sort: string, seed: number): T[] {
  if (sort !== "popular" || seed === 0 || products.length < 2) return products;
  return seededShuffle(products, seed);
}

/* ─── BrandHeader ─── */
function BrandHeader({ brand }: { brand: { name: string; slug: string; logoUrl: string | null; description: string | null; content: string | null } }) {
  const [expanded, setExpanded] = useState(false);
  // Strip old altamoda.rs images but keep the rest of HTML
  const cleanHtml = brand.content
    ? DOMPurify.sanitize(
        brand.content.replace(/<p[^>]*>\s*<img[^>]*altamoda\.rs[^>]*\/>\s*<\/p>/gi, "").replace(/<p>\s*<\/p>/g, ""),
        { ALLOWED_TAGS: ["p", "strong", "em", "br", "a", "ul", "ol", "li", "h2", "h3"], ALLOWED_ATTR: ["href"] }
      )
    : null;
  const hasLongContent = cleanHtml ? cleanHtml.length > 300 : false;

  return (
    <section className="bg-[#FFFFFF] border-b border-[#dddbd9]">
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        {brand.logoUrl ? (
          <Image src={brand.logoUrl} alt={brand.name} width={80} height={40} className="h-10 mx-auto object-contain mb-3" />
        ) : (
          <h2 className="text-xl font-bold text-[#1a1c1e] mb-3" style={{ fontFamily: "'Noto Serif', serif" }}>{brand.name}</h2>
        )}
        {cleanHtml && (
          <>
            <div
              className={`text-[#1a1c1e]/60 text-[13px] leading-relaxed [&_p]:mb-2 [&_strong]:text-[#1a1c1e] [&_strong]:font-semibold ${expanded ? "" : "max-h-[4.5em] overflow-hidden"}`}
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />
            {hasLongContent && (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-2 text-xs font-medium text-[#1a1c1e]/60 hover:text-[#1a1c1e] transition-colors"
              >
                {expanded ? "▲ Sakrij" : "▼ Prikaži više"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function getBadge(product: Product): string | null {
  if (product.promoBadge) return product.promoBadge;
  if (product.isNew) return "NOVO";
  if (product.isFeatured) return "HIT";
  if (product.price != null && product.oldPrice && product.oldPrice > product.price) {
    const pct = Math.round((1 - product.price / product.oldPrice) * 100);
    return `-${pct}%`;
  }
  return null;
}

/* ─── ProductCard ─── */
function ProductCard({ product, isWishlisted, onNavigate }: { product: Product; isWishlisted?: boolean; onNavigate?: () => void }) {
  const { t } = useLanguage();
  const [liked, setLiked] = useState(isWishlisted ?? false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();
  const { increment: incWishlist, decrement: decWishlist } = useWishlistStore();
  const badge = getBadge(product);
  const imgSrc = product.image || PLACEHOLDER_IMG;
  const hasColors = (product.colorSiblings?.length ?? 0) > 1;
  const b2bOnly = product.price == null;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = liked;
    setLiked(!liked);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) {
        setLiked(prev);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setLiked(data.data.added);
        if (data.data.added) incWishlist();
        else decWishlist();
      }
    } catch {
      setLiked(prev);
    }
  };

  const outOfStock = product.stockQuantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || product.price == null) return;
    addItem({
      productId: product.id,
      name: product.name,
      brand: product.brand?.name ?? "",
      price: product.price,
      quantity: 1,
      image: product.image ?? "",
      sku: product.sku,
      stockQuantity: product.stockQuantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  return (
    <Link href={`/products/${product.slug}`} onClick={onNavigate} className="group flex flex-col h-full">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#dddbd9] mb-4 rounded-[4px]">
        <Image src={imgSrc} alt={product.name} width={500} height={625} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {badge && (
            <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] backdrop-blur-sm rounded-full bg-[rgba(26,28,30,0.5)] text-[#FFFFFF]">{badge}</span>
          )}
          {product.isProfessional && (
            <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] bg-[rgba(26,28,30,0.5)] text-[#FFFFFF] backdrop-blur-sm rounded-full">{t("products.professional")}</span>
          )}
          {product.variantCount != null && product.variantCount > 1 && (
            <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] bg-[rgba(26,28,30,0.5)] text-[#FFFFFF] backdrop-blur-sm rounded-full">
              {product.variantCount} boja
            </span>
          )}
        </div>
        <button onClick={handleToggleWishlist} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FFFFFF]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[#FFFFFF] transition-colors z-10 opacity-0 group-hover:opacity-100">
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-[#1a1c1e] text-[#1a1c1e]" : "text-[#1a1c1e]"}`} />
        </button>
        {!b2bOnly && (
          <div className="hidden md:block absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={hasColors ? undefined : handleAddToCart}
              disabled={!hasColors && outOfStock}
              className={`w-full text-[10px] uppercase tracking-[0.22em] font-medium py-3 transition-colors flex items-center justify-center gap-2 ${!hasColors && outOfStock ? "bg-[#dddbd9] text-[#1a1c1e]/60 cursor-not-allowed" : addedToCart ? "bg-[#413d3a] text-[#ffffff]" : "bg-[#c19742] text-[#ffffff] hover:bg-[#413d3a]"}`}
            >
              {hasColors ? <><Palette className="w-3.5 h-3.5" /> Izaberi boju</>
                : outOfStock ? <>{t("products.outOfStock")}</>
                : addedToCart ? <><CheckCircle className="w-3.5 h-3.5" /> {t("products.addedToCart")}</>
                : <><ShoppingBag className="w-3.5 h-3.5" /> {t("products.addToCart")}</>}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e]/60 font-medium block mb-1.5">{product.brand?.name ?? ""}</span>
        <h3 className="text-base text-[#1a1c1e] mb-1 font-normal line-clamp-2 leading-tight min-h-[2.6em]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.name}</h3>
        <div className="flex items-center gap-2 text-sm text-[#1a1c1e] mt-1">
          {product.price == null ? (
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e] font-medium">B2B samo · prijavi se za cenu</span>
          ) : (
            <>
              {product.oldPrice && <span className="text-[#1a1c1e]/60 line-through text-xs">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
              <span>{product.price.toLocaleString("sr-RS")} RSD</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(product.rating) ? "fill-[#1a1c1e] text-[#1a1c1e]" : "fill-[#1a1c1e]/15 text-[#1a1c1e]/25"}`} />)}
        </div>

        {/* Mobile-only persistent action area — pinned to bottom for cross-card alignment */}
        {!b2bOnly && (
          <div className="md:hidden mt-auto pt-3">
            <button
              onClick={hasColors ? undefined : handleAddToCart}
              disabled={!hasColors && outOfStock}
              className={`w-full text-[10px] uppercase tracking-[0.22em] font-medium py-2.5 transition-colors flex items-center justify-center gap-1.5 rounded-[2px] ${!hasColors && outOfStock ? "bg-[#dddbd9] text-[#1a1c1e]/60 cursor-not-allowed" : addedToCart ? "bg-[#413d3a] text-[#ffffff]" : "bg-[#c19742] text-[#ffffff] active:bg-[#413d3a]"}`}
            >
              {hasColors ? <><Palette className="w-3 h-3" /> Izaberi boju</>
                : outOfStock ? <>{t("products.outOfStock")}</>
                : addedToCart ? <><CheckCircle className="w-3 h-3" /> {t("products.addedToCart")}</>
                : <><ShoppingBag className="w-3 h-3" /> {t("products.addToCart")}</>}
            </button>
          </div>
        )}

      </div>
    </Link>
  );
}

/* ─── FilterSection ─── */
function FilterSection({ title, children, defaultOpen = true, count }: { title: string; children: React.ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-5 border-b border-[#dddbd9]/60">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full group">
        <span className="text-[10px] font-medium text-[#1a1c1e] uppercase tracking-[0.22em]">{title}</span>
        <div className="flex items-center gap-2">
          {count !== undefined && count > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#1a1c1e] text-[#FFFFFF] text-[9px] font-medium flex items-center justify-center">{count}</span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-[#1a1c1e] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"}`}>
        {children}
      </div>
    </div>
  );
}

/* ─── CategoryTreeItem ─── */
function CategoryTreeItem({ item, depth = 0, onSelect, selectedSlug }: { item: CategoryNode; depth?: number; onSelect: (slug: string) => void; selectedSlug: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedSlug === item.slug;
  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(item.slug);
        }}
        className={`flex items-center gap-2.5 w-full text-[12px] py-2 hover:bg-[#dddbd9]/40 px-2 -mx-2 transition-colors ${
          isSelected ? "font-medium text-[#1a1c1e] bg-[#dddbd9]/60" : depth === 0 ? "text-[#1a1c1e]" : "text-[#1a1c1e]/60"
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren && (
          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 text-[#1a1c1e]/60 ${expanded ? "rotate-90" : ""}`} />
        )}
        {!hasChildren && <span className="w-3.5 flex-shrink-0" />}
        {item.nameLat}
      </button>
      {expanded && hasChildren && (
        <div className="animate-slideDown">
          {item.children.map((child) => (
            <CategoryTreeItem key={child.id} item={child} depth={depth + 1} onSelect={onSelect} selectedSlug={selectedSlug} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Custom Select ─── */
function SortSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = [
    { value: "popular", label: t("products.sortPopular") },
    { value: "price_asc", label: t("products.sortPriceLow") },
    { value: "price_desc", label: t("products.sortPriceHigh") },
    { value: "newest", label: t("products.sortNewest") },
    { value: "name_asc", label: t("products.sortRating") },
  ];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-[#dddbd9] px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] font-medium text-[#1a1c1e] hover:border-[#1a1c1e] transition-colors min-w-[180px] justify-between"
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#1a1c1e]/60" />
          <span>{current?.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#1a1c1e]/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-[#FFFFFF] border border-[#dddbd9] shadow-lg z-40 min-w-[200px] overflow-hidden animate-slideDown">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                value === opt.value
                  ? "bg-[#dddbd9]/60 text-[#1a1c1e] font-medium"
                  : "text-[#1a1c1e]/60 hover:bg-[#dddbd9]/40 hover:text-[#1a1c1e]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Client Component ─── */
export default function ProductsPageClient({
  initialProducts,
  initialPagination,
  brands,
  categories,
  productLines,
  productTypes,
  hairTypes,
  tags,
  attributes,
  userRole: _serverRole,
  wishlistedProductIds: _serverWishlist = [],
  availableColorLevels = [],
  availableColorUndertones = [],
  activeBrand = null,
}: ProductsPageClientProps) {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role || _serverRole;
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");
  const genderParam = searchParams.get("gender");
  const brandParam = searchParams.get("brand");
  const productLineParams = searchParams.getAll("productLine");
  const productTypeParams = searchParams.getAll("productType");
  const hairTypeParams = searchParams.getAll("hairType");
  const tagParams = searchParams.getAll("tag");

  const [wishlistedProductIds, setWishlistedProductIds] = useState<string[]>(_serverWishlist);
  const wishlistedSet = new Set(wishlistedProductIds);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  // Seed is 0 during SSR / first render → no shuffle. Set on mount so the
  // initial ISR-cached HTML hydrates byte-for-byte before we re-order.
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [loading, setLoading] = useState(false);
  // Separate flag for the "load more" append fetch so the existing grid stays
  // visible (only the button shows a spinner) instead of being replaced by the
  // full-page loading state used for filter/sort changes.
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [gridView, setGridView] = useState(true);
  const [mobileFilter, setMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  // Highest page currently loaded into the accumulated `products` list. The
  // "load more" button advances this; filter/sort changes reset it to 1.
  const [currentPage, setCurrentPage] = useState(initialPagination.page || 1);
  const [searchQuery, setSearchQuery] = useState(searchParam || "");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedGender, setSelectedGender] = useState<string | null>(genderParam);
  const [selectedProductLines, setSelectedProductLines] = useState<string[]>(productLineParams);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(productTypeParams);
  const [selectedHairTypes, setSelectedHairTypes] = useState<string[]>(hairTypeParams);
  const [selectedTags, setSelectedTags] = useState<string[]>(tagParams);

  // Sync category, gender, brand, lines, attribute filters from URL when navigating between menu links.
  // The state above is already seeded from the URL, so we record the mount-time
  // URL signature and only re-sync when it actually changes. Running it on mount
  // would create new array refs (triggering a redundant refetch) and reset the
  // page counter, breaking snapshot restore. Comparing signatures (rather than a
  // boolean flag) is also robust to React Strict Mode's double-invoke in dev.
  const lastUrlSig = useRef<string | null>(null);
  useEffect(() => {
    const urlSig = [categoryParam, genderParam, brandParam, productLineParams.join(","), productTypeParams.join(","), hairTypeParams.join(","), tagParams.join(",")].join("|");
    if (lastUrlSig.current === urlSig) return; // mount (first record) or no real change
    const isFirst = lastUrlSig.current === null;
    lastUrlSig.current = urlSig;
    if (isFirst) return;
    setSelectedCategory(categoryParam);
    setSelectedGender(genderParam);
    setSelectedBrands(brandParam ? [brandParam] : []);
    setSelectedProductLines(productLineParams);
    setSelectedProductTypes(productTypeParams);
    setSelectedHairTypes(hairTypeParams);
    setSelectedTags(tagParams);
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam, genderParam, brandParam, productLineParams.join(","), productTypeParams.join(","), hairTypeParams.join(","), tagParams.join(",")]);

  // Sync search from URL (e.g. from header search) and auto-submit
  useEffect(() => {
    if (searchParam !== null) {
      setSearchQuery(searchParam);
      setShowSearch(false);
      setCurrentPage(1);
    }
  }, [searchParam]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [activeToggles, setActiveToggles] = useState<string[]>([]);

  // Color filters
  const [filterColorLevel, setFilterColorLevel] = useState<number | null>(null);
  const [filterUndertone, setFilterUndertone] = useState<string | null>(null);
  const [filterHasColor, setFilterHasColor] = useState(false);

  // Visibility tab for guests
  const [visibility, setVisibility] = useState<"all" | "b2c" | "b2b">("all");

  const searchRef = useRef<HTMLDivElement>(null);

  // Signature of the current filter / sort / search set. A saved list snapshot
  // is only restored when its signature still matches what's being viewed.
  const listSignature = [
    sortBy, visibility, searchQuery.trim(), selectedCategory ?? "", selectedGender ?? "",
    selectedBrands.join(","), selectedProductLines.join(","), selectedProductTypes.join(","),
    selectedHairTypes.join(","), selectedTags.join(","), priceMin, priceMax,
    activeToggles.join(","), filterColorLevel ?? "", filterUndertone ?? "", filterHasColor ? "1" : "",
  ].join("|");

  // Guards the mount init effect so it runs exactly once, even under React
  // Strict Mode's double-invoke (which would otherwise consume the return
  // marker and reshuffle the restored list).
  const didInitRef = useRef(false);
  // Holds the filter signature whose data we just restored from a snapshot.
  // While the live signature equals this, the on-mount/filter refetch effect
  // skips fetching so it can't clobber the restored list with page 1. It clears
  // automatically the moment the user changes a filter (signature differs).
  const restoredSignatureRef = useRef<string | null>(null);

  // Persist the current list (accumulated products, page, pagination, scroll)
  // right before navigating into a product detail, so going back restores the
  // exact spot instead of resetting to page 1 at the top.
  const handleProductNavigate = useCallback(() => {
    try {
      sessionStorage.setItem(
        LIST_SNAPSHOT_KEY,
        JSON.stringify({
          signature: listSignature,
          products,
          currentPage,
          pagination,
          shuffleSeed,
          scrollY: window.scrollY,
        })
      );
      sessionStorage.setItem(LIST_RETURN_KEY, "1");
    } catch {
      // sessionStorage unavailable (private mode / quota) — degrade gracefully.
    }
  }, [listSignature, products, currentPage, pagination, shuffleSeed]);

  // Generate a fresh shuffle seed once per mount (post-hydration to keep SSR
  // markup stable). Each refresh / fresh navigation to /products gets a new
  // order; within the same mount the seed is stable so pagination & filter
  // changes don't re-shuffle items the user just looked at.
  useEffect(() => {
    // Run exactly once per real mount (Strict Mode double-invokes effects).
    if (didInitRef.current) return;
    didInitRef.current = true;

    // Returning from a product detail page: restore the saved list + scroll
    // position instead of reshuffling and resetting to page 1.
    try {
      if (sessionStorage.getItem(LIST_RETURN_KEY)) {
        sessionStorage.removeItem(LIST_RETURN_KEY);
        const raw = sessionStorage.getItem(LIST_SNAPSHOT_KEY);
        if (raw) {
          const snap = JSON.parse(raw);
          const valid =
            snap &&
            snap.signature === listSignature &&
            Array.isArray(snap.products) && snap.products.length > 0 &&
            typeof snap.currentPage === "number" &&
            snap.pagination && typeof snap.pagination.totalPages === "number";
          if (valid) {
            // Mark this signature as restored so the refetch effect leaves the
            // accumulated list intact until the user changes a filter.
            restoredSignatureRef.current = listSignature;
            setProducts(snap.products);
            setCurrentPage(snap.currentPage);
            setPagination(snap.pagination);
            if (typeof snap.shuffleSeed === "number") setShuffleSeed(snap.shuffleSeed);
            // Restore scroll once the restored grid has rendered tall enough.
            restoreScrollTo(typeof snap.scrollY === "number" ? snap.scrollY : 0);
            return;
          }
        }
      }
    } catch {
      // ignore and fall through to a fresh shuffle
    }

    const seed = getFreshSeed();
    setShuffleSeed(seed);
    // Shuffle the server-rendered first chunk once, post-hydration. Subsequent
    // chunks are shuffled at fetch time before being appended, so the displayed
    // order is stable across "load more" clicks (no re-ordering of seen items).
    setProducts((prev) => applyDefaultShuffle(prev, sortBy, seed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `products` is already in display order (each chunk shuffled as it arrived),
  // so no further re-ordering here — that would reshuffle already-shown items.
  const displayProducts = products;

  // Fetch wishlist IDs client-side when user is authenticated
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/wishlist')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data?.items)) {
          setWishlistedProductIds(data.data.items.map((w: { productId: string }) => w.productId));
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  // Build query string from current filters
  const buildQueryString = useCallback((page: number) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    params.set("sort", sortBy);

    if (!userRole) {
      params.set("visibility", visibility);
    }

    // Storefront only ever shows in-stock products; admin uses a separate flow.
    params.set("inStockOnly", "true");

    if (selectedCategory) {
      params.set("category", selectedCategory);
    }

    if (selectedGender) {
      params.set("gender", selectedGender);
    }

    selectedBrands.forEach((b) => params.append("brand", b));
    selectedProductLines.forEach((l) => params.append("productLine", l));
    selectedProductTypes.forEach((t) => params.append("productType", t));
    selectedHairTypes.forEach((t) => params.append("hairType", t));
    selectedTags.forEach((t) => params.append("tag", t));

    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);

    // Map toggle keys to API params
    activeToggles.forEach((key) => {
      if (key === "new") params.set("isNew", "true");
      else if (key === "on_sale") params.set("onSale", "true");
      else if (key === "featured") params.set("isFeatured", "true");
      else params.set(`attr_${key}`, "true");
    });

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    // Color filters
    if (filterHasColor) params.set("hasColor", "true");
    if (filterColorLevel) params.set("colorLevel", String(filterColorLevel));
    if (filterUndertone) params.set("colorUndertone", filterUndertone);

    return params.toString();
  }, [sortBy, visibility, userRole, selectedCategory, selectedGender, selectedBrands, selectedProductLines, selectedProductTypes, selectedHairTypes, selectedTags, priceMin, priceMax, activeToggles, searchQuery, filterHasColor, filterColorLevel, filterUndertone]);

  // Fetch products from API. `append` accumulates the next chunk (load more);
  // otherwise the list is replaced (initial load / filter / sort change).
  const fetchProducts = useCallback(async (page: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setFetchError("");
    try {
      const qs = buildQueryString(page);
      const res = await fetch(`/api/products?${qs}`);
      const json = await res.json();
      if (json.success) {
        // Shuffle each chunk as it arrives so "popular" stays randomized without
        // re-ordering chunks already on screen.
        const chunk = applyDefaultShuffle(json.data.products as Product[], sortBy, shuffleSeed);
        setProducts((prev) => (append ? [...prev, ...chunk] : chunk));
        setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setFetchError("Greška pri učitavanju proizvoda. Pokušajte ponovo.");
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, [buildQueryString, sortBy, shuffleSeed]);

  // Load the next page and append it to the current list.
  const loadMore = useCallback(() => {
    if (loading || loadingMore) return;
    if (currentPage >= pagination.totalPages) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    fetchProducts(next, true);
  }, [loading, loadingMore, currentPage, pagination.totalPages, fetchProducts]);

  // Re-fetch (replacing the list and resetting to page 1) when filters / sort /
  // visibility change. With the load-more model there is no ?page in the URL.
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (restoredSignatureRef.current === listSignature) {
      // The displayed list was restored from a snapshot for exactly these
      // filters — don't refetch (that would drop the accumulated pages back to
      // page 1). The moment the user changes any filter the signature differs
      // and this guard stops applying.
      return;
    }
    restoredSignatureRef.current = null;
    setCurrentPage(1);
    fetchProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, sortBy, visibility, selectedCategory, selectedGender, selectedBrands, selectedProductLines, selectedProductTypes, selectedHairTypes, selectedTags, activeToggles, searchParam, filterColorLevel, filterUndertone, filterHasColor]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}&limit=10`);
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.data);
          setShowSearch(true);
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = () => {
    setShowSearch(false);
    setCurrentPage(1);
    fetchProducts(1);
  };

  const handlePriceApply = () => {
    setCurrentPage(1);
    fetchProducts(1);
  };

  const toggleBrand = (slug: string) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleProductLine = (slug: string) => {
    setSelectedProductLines((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleInList = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };
  const toggleProductType = toggleInList(setSelectedProductTypes);
  const toggleHairType = toggleInList(setSelectedHairTypes);
  const toggleTag = toggleInList(setSelectedTags);

  const toggleFilter = (key: string) => {
    setActiveToggles((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory((prev) => (prev === slug ? null : slug));
  };

  // Compute active tag labels
  const activeTags: { key: string; label: string }[] = [];
  selectedBrands.forEach((slug) => {
    const b = brands.find((br) => br.slug === slug);
    if (b) activeTags.push({ key: `brand:${slug}`, label: b.name });
  });
  selectedProductLines.forEach((slug) => {
    const l = productLines.find((pl) => pl.slug === slug);
    if (l) activeTags.push({ key: `productLine:${slug}`, label: l.name });
  });
  selectedProductTypes.forEach((v) => activeTags.push({ key: `productType:${v}`, label: v }));
  selectedHairTypes.forEach((v) => activeTags.push({ key: `hairType:${v}`, label: v }));
  selectedTags.forEach((v) => activeTags.push({ key: `tag:${v}`, label: v }));
  activeToggles.forEach((key) => {
    const attr = attributes.find((a) => a.slug === key);
    if (attr) activeTags.push({ key: `attr:${key}`, label: attr.nameLat });
    else if (key === "new") activeTags.push({ key: `toggle:new`, label: "Noviteti" });
    else if (key === "on_sale") activeTags.push({ key: `toggle:on_sale`, label: "Na akciji" });
    else if (key === "featured") activeTags.push({ key: `toggle:featured`, label: "Izdvojeno" });
  });
  if (selectedGender) {
    const genderLabels: Record<string, string> = { man: t("nav.manCollection"), woman: t("products.womanCollection") || "Ženska kolekcija" };
    activeTags.push({ key: `gender:${selectedGender}`, label: genderLabels[selectedGender] || selectedGender });
  }
  if (selectedCategory) {
    const findCat = (nodes: CategoryNode[]): string | null => {
      for (const n of nodes) {
        if (n.slug === selectedCategory) return n.nameLat;
        const found = findCat(n.children);
        if (found) return found;
      }
      return null;
    };
    const catName = findCat(categories);
    if (catName) activeTags.push({ key: `cat:${selectedCategory}`, label: catName });
  }
  if (priceMin || priceMax) {
    const priceLabel = priceMin && priceMax
      ? `${priceMin} – ${priceMax} RSD`
      : priceMin
        ? `Od ${priceMin} RSD`
        : `Do ${priceMax} RSD`;
    activeTags.push({ key: "price", label: priceLabel });
  }

  const removeTag = (tagKey: string) => {
    if (tagKey === "price") {
      setPriceMin("");
      setPriceMax("");
      return;
    }
    if (tagKey.startsWith("brand:")) {
      const slug = tagKey.replace("brand:", "");
      setSelectedBrands((prev) => prev.filter((s) => s !== slug));
    } else if (tagKey.startsWith("productLine:")) {
      const slug = tagKey.replace("productLine:", "");
      setSelectedProductLines((prev) => prev.filter((s) => s !== slug));
    } else if (tagKey.startsWith("productType:")) {
      const v = tagKey.replace("productType:", "");
      setSelectedProductTypes((prev) => prev.filter((s) => s !== v));
    } else if (tagKey.startsWith("hairType:")) {
      const v = tagKey.replace("hairType:", "");
      setSelectedHairTypes((prev) => prev.filter((s) => s !== v));
    } else if (tagKey.startsWith("tag:")) {
      const v = tagKey.replace("tag:", "");
      setSelectedTags((prev) => prev.filter((s) => s !== v));
    } else if (tagKey.startsWith("attr:")) {
      const key = tagKey.replace("attr:", "");
      setActiveToggles((prev) => prev.filter((k) => k !== key));
    } else if (tagKey.startsWith("toggle:")) {
      const key = tagKey.replace("toggle:", "");
      setActiveToggles((prev) => prev.filter((k) => k !== key));
    } else if (tagKey.startsWith("gender:")) {
      setSelectedGender(null);
    } else if (tagKey.startsWith("cat:")) {
      setSelectedCategory(null);
    }
  };

  const clearAllTags = () => {
    setSelectedBrands([]);
    setSelectedProductLines([]);
    setSelectedProductTypes([]);
    setSelectedHairTypes([]);
    setSelectedTags([]);
    setActiveToggles([]);
    setSelectedCategory(null);
    setSelectedGender(null);
    setFilterColorLevel(null);
    setFilterUndertone(null);
    setFilterHasColor(false);
    setPriceMin("");
    setPriceMax("");
  };

  // Build toggle filters from attributes + built-in toggles
  const toggleFilters: { key: string; label: string }[] = [
    { key: "new", label: "Noviteti" },
    { key: "on_sale", label: "Na akciji" },
    ...attributes
      .filter((a) => a.type === "boolean" && a.slug)
      .map((a) => ({ key: a.slug, label: a.nameLat })),
  ];

  // More products remain to load when we haven't reached the last page yet.
  const hasMore = currentPage < pagination.totalPages;

  /* ─── Filter Sidebar ─── */
  const genderOptions = [
    { value: "man", label: t("products.forMen") },
    { value: "woman", label: t("products.forWomen") },
  ];

  const filterSidebar = (
    <div>
      {/* Gender / Collection filter */}
      <FilterSection title={t("products.collection")}>
        <div className="space-y-1">
          {genderOptions.map((g) => (
            <button
              key={g.value}
              onClick={() => setSelectedGender(selectedGender === g.value ? null : g.value)}
              className={`w-full text-left py-2 px-3 rounded-sm text-[13px] transition-colors ${
                selectedGender === g.value
                  ? "bg-[#1a1c1e] text-white"
                  : "text-[#1a1c1e]/60 hover:text-[#1a1c1e] hover:bg-[#FFFFFF]"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Category Tree */}
      <FilterSection title={t("products.category")}>
        <div className="space-y-0">
          {categories.map((cat) => (
            <CategoryTreeItem key={cat.id} item={cat} onSelect={handleCategorySelect} selectedSlug={selectedCategory} />
          ))}
        </div>
      </FilterSection>

      {/* Product Lines — narrows to selected brand(s) when any are active */}
      {(() => {
        const visibleLines = selectedBrands.length > 0
          ? productLines.filter((l) => selectedBrands.includes(l.brand.slug))
          : productLines;
        if (visibleLines.length === 0) return null;
        return (
          <FilterSection
            title={t("products.productLines") || "Linije proizvoda"}
            defaultOpen={false}
            count={selectedProductLines.length}
          >
            <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
              {visibleLines.map((l) => {
                const isActive = selectedProductLines.includes(l.slug);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleProductLine(l.slug)}
                    className={`w-full text-left py-2 px-3 rounded-sm text-[13px] transition-colors flex items-baseline justify-between gap-2 ${
                      isActive
                        ? "bg-[#1a1c1e] text-white"
                        : "text-[#1a1c1e]/70 hover:text-[#1a1c1e] hover:bg-[#FFFFFF]"
                    }`}
                  >
                    <span className="truncate">{l.name}</span>
                    {selectedBrands.length === 0 && (
                      <span className={`text-[10px] uppercase tracking-[0.18em] flex-shrink-0 ${isActive ? "text-white/60" : "text-[#1a1c1e]/40"}`}>
                        {l.brand.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        );
      })()}

      {/* Tip proizvoda */}
      {productTypes.length > 0 && (
        <FilterSection title="Tip proizvoda" defaultOpen={selectedProductTypes.length > 0} count={selectedProductTypes.length}>
          <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
            {productTypes.map((v) => {
              const isActive = selectedProductTypes.includes(v);
              return (
                <button
                  key={v}
                  onClick={() => toggleProductType(v)}
                  className={`w-full text-left py-2 px-3 rounded-sm text-[13px] transition-colors ${
                    isActive ? "bg-[#1a1c1e] text-white" : "text-[#1a1c1e]/70 hover:text-[#1a1c1e] hover:bg-[#FFFFFF]"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Tip kose */}
      {hairTypes.length > 0 && (
        <FilterSection title="Tip kose" defaultOpen={selectedHairTypes.length > 0} count={selectedHairTypes.length}>
          <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
            {hairTypes.map((v) => {
              const isActive = selectedHairTypes.includes(v);
              return (
                <button
                  key={v}
                  onClick={() => toggleHairType(v)}
                  className={`w-full text-left py-2 px-3 rounded-sm text-[13px] transition-colors ${
                    isActive ? "bg-[#1a1c1e] text-white" : "text-[#1a1c1e]/70 hover:text-[#1a1c1e] hover:bg-[#FFFFFF]"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Funkcija / Tagovi */}
      {tags.length > 0 && (
        <FilterSection title="Funkcija" defaultOpen={selectedTags.length > 0} count={selectedTags.length}>
          <div className="flex flex-wrap gap-1.5 max-h-[260px] overflow-y-auto pr-1">
            {tags.map((v) => {
              const isActive = selectedTags.includes(v);
              return (
                <button
                  key={v}
                  onClick={() => toggleTag(v)}
                  className={`px-3 py-1.5 rounded-full text-[11px] transition-colors ${
                    isActive
                      ? "bg-[#1a1c1e] text-white"
                      : "bg-[#dddbd9]/60 text-[#1a1c1e]/70 hover:bg-[#dddbd9] hover:text-[#1a1c1e]"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title={`${t("products.price")} (RSD)`} defaultOpen={false}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Od"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full border border-[#dddbd9] rounded-sm px-3.5 py-2.5 text-sm bg-[#FFFFFF] focus:bg-white focus:border-black focus:outline-none transition-all placeholder-[#dddbd9]"
            />
          </div>
          <span className="text-[#dddbd9] text-sm">—</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Do"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full border border-[#dddbd9] rounded-sm px-3.5 py-2.5 text-sm bg-[#FFFFFF] focus:bg-white focus:border-black focus:outline-none transition-all placeholder-[#dddbd9]"
            />
          </div>
        </div>
        <button
          onClick={handlePriceApply}
          className="mt-3 w-full bg-[#c19742] hover:bg-[#413d3a] text-white text-sm py-2.5 rounded-sm font-medium transition-colors"
        >
          Primeni
        </button>
      </FilterSection>

      {/* Color filter — only show if there are color products in the DB */}
      {(availableColorLevels.length > 0 || availableColorUndertones.length > 0) && (
        <FilterSection title={`Nijansa boje (${availableColorLevels.reduce((s, l) => s + l.count, 0)})`} defaultOpen={false}>
          <div className="space-y-5">

            {/* ── Depth / Level ── only levels that exist */}
            {availableColorLevels.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1a1c1e]/60 mb-3">{t("colorPage.lightnessLevel")}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {availableColorLevels.map(({ level, count, hexSamples }) => {
                    const labelMap: Record<number, string> = {
                      1: "Crna", 2: "Najt. braon", 3: "Tamno braon", 4: "Sred. braon", 5: "Svet. braon",
                      6: "Tamno plava", 7: "Sred. plava", 8: "Svet. plava", 9: "V. sv. plava", 10: "Ekstra sv.",
                    };
                    const displayHex = hexSamples[0] || "#413d3a";
                    return (
                      <button
                        key={level}
                        onClick={() => setFilterColorLevel(filterColorLevel === level ? null : level)}
                        className={`flex flex-col items-center gap-1 py-1.5 rounded-sm transition-all ${
                          filterColorLevel === level ? "bg-[#FFFFFF] ring-1 ring-[#1a1c1e]" : "hover:bg-[#FFFFFF]"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border transition-transform ${
                            filterColorLevel === level ? "border-black scale-110 shadow-md" : "border-[#dddbd9]"
                          }`}
                          style={{ backgroundColor: displayHex }}
                        />
                        <span className="text-[8px] text-[#1a1c1e]/60 leading-tight text-center font-medium">{labelMap[level] || `Nivo ${level}`}</span>
                        <span className="text-[8px] text-[#dddbd9]">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Color Family (Undertone) ── only undertones that exist */}
            {availableColorUndertones.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1a1c1e]/60 mb-3">Porodica boja</p>
                <div className="space-y-1">
                  {availableColorUndertones.map((ut) => (
                    <button
                      key={ut.code}
                      onClick={() => setFilterUndertone(filterUndertone === ut.code ? null : ut.code)}
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-sm transition-all text-left ${
                        filterUndertone === ut.code ? "bg-[#FFFFFF] ring-1 ring-[#1a1c1e]" : "hover:bg-[#FFFFFF]"
                      }`}
                    >
                      {/* Show up to 3 sample hex dots */}
                      <div className="flex -space-x-1 flex-shrink-0">
                        {ut.hexSamples.slice(0, 3).map((hex, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full border transition-all ${
                              filterUndertone === ut.code ? "border-black" : "border-white"
                            }`}
                            style={{ backgroundColor: hex, zIndex: 3 - i }}
                          />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-[12px] font-medium block leading-tight ${
                          filterUndertone === ut.code ? "text-[#1a1c1e]" : "text-[#1a1c1e]/60"
                        }`}>{ut.name}</span>
                      </div>
                      <span className="text-[10px] text-[#dddbd9] font-medium">{ut.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Active color filter tags ── */}
            {(filterColorLevel || filterUndertone || filterHasColor) && (
              <div className="pt-3 border-t border-[#dddbd9] space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {filterColorLevel && (
                    <span className="inline-flex items-center gap-1 bg-[#FFFFFF] text-[#1a1c1e] text-[10px] font-medium px-2 py-1 rounded-sm">
                      Nivo {filterColorLevel}
                      <button onClick={() => setFilterColorLevel(null)} className="text-[#1a1c1e]/60 hover:text-[#1a1c1e] ml-0.5">&times;</button>
                    </span>
                  )}
                  {filterUndertone && (
                    <span className="inline-flex items-center gap-1 bg-[#FFFFFF] text-[#1a1c1e] text-[10px] font-medium px-2 py-1 rounded-sm">
                      {availableColorUndertones.find(u => u.code === filterUndertone)?.name || filterUndertone}
                      <button onClick={() => setFilterUndertone(null)} className="text-[#1a1c1e]/60 hover:text-[#1a1c1e] ml-0.5">&times;</button>
                    </span>
                  )}
                  {filterHasColor && (
                    <span className="inline-flex items-center gap-1 bg-[#FFFFFF] text-[#1a1c1e] text-[10px] font-medium px-2 py-1 rounded-sm">
                      Samo boje
                      <button onClick={() => setFilterHasColor(false)} className="text-[#1a1c1e]/60 hover:text-[#1a1c1e] ml-0.5">&times;</button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setFilterColorLevel(null); setFilterUndertone(null); setFilterHasColor(false); }}
                  className="text-[10px] text-[#1a1c1e]/60 hover:text-[#1a1c1e] transition-colors uppercase tracking-wider font-medium"
                >
                  Resetuj filtere boja
                </button>
              </div>
            )}

            {/* ── Only color products toggle ── */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setFilterHasColor(!filterHasColor);
              }}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                filterHasColor ? "bg-[#1a1c1e]" : "bg-[#dddbd9]"
              }`}
            >
              <span
                className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-all duration-300 ${
                  filterHasColor ? "left-[23px]" : "left-[3px]"
                }`}
              />
            </button>
          </div>
        </FilterSection>
      )}

      <FilterSection title="Osobine">
        <div className="space-y-3">
          {toggleFilters.map((f) => (
            <label
              key={f.key}
              className="flex items-center justify-between cursor-pointer group py-0.5"
            >
              <span className="text-[13px] text-[#1a1c1e]/60 group-hover:text-[#1a1c1e] transition-colors">
                {f.label}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFilter(f.key);
                }}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                  activeToggles.includes(f.key)
                    ? "bg-[#1a1c1e]"
                    : "bg-[#dddbd9]"
                }`}
              >
                <span
                  className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-[0_1px_3px_rgba(26,28,30,0.18)] ring-1 ring-black/5 transition-transform duration-300 ${
                    activeToggles.includes(f.key)
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  /* ─── Visibility Tabs (guest only) ─── */
  const visibilityTabs = !userRole ? (
    <div className="flex items-center gap-6">
      {([
        { key: "all" as const, label: t("products.allProducts") },
        { key: "b2c" as const, label: t("products.retail") },
        { key: "b2b" as const, label: t("products.professional") },
      ]).map((tab) => (
        <button
          key={tab.key}
          onClick={() => setVisibility(tab.key)}
          className={`text-[10px] uppercase tracking-[0.22em] font-medium pb-1 transition-colors ${
            visibility === tab.key
              ? "text-[#1a1c1e] border-b border-[#1a1c1e]"
              : "text-[#1a1c1e]/60 hover:text-[#1a1c1e]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#FFFFFF]" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <Header />

      {/* Brand Header (when filtering by brand) */}
      {activeBrand && (
        <BrandHeader brand={activeBrand} />
      )}

      {/* Editorial Page Header */}
      <div className="bg-[#FFFFFF] border-b border-[#dddbd9]/60">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-14 md:pt-20 pb-10 md:pb-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#1a1c1e]/60 mb-8">
            <Link href="/" className="hover:text-[#1a1c1e] transition-colors">{t("productDetail.home")}</Link>
            <ChevronRight className="w-3 h-3" />
            {activeBrand ? (
              <>
                <Link href="/products" className="hover:text-[#1a1c1e] transition-colors">{t("products.allProducts")}</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#1a1c1e]">{activeBrand.name}</span>
              </>
            ) : (
              <span className="text-[#1a1c1e]">{t("products.allProducts")}</span>
            )}
          </nav>

          {/* Editorial heading */}
          <div className="max-w-3xl mb-10 md:mb-14">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#1a1c1e]/60 font-medium block mb-5">
              Kolekcija
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1a1c1e] leading-[1.05] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {activeBrand ? (
                <>{activeBrand.name}, <em className="italic">svi proizvodi</em>.</>
              ) : (
                <>Svaki ritual, <em className="italic">svi proizvodi</em>.</>
              )}
            </h1>
            <p className="text-[14px] text-[#1a1c1e]/60 leading-relaxed mt-5 max-w-lg">
              Pregledaj punu paletu altamoda — šamponi, regeneratori, maske, ulja i alati — ručno biran, kliničko-testiran i slavljen u našim neobeleženim doznačima.
            </p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#1a1c1e]/60 mt-6">
              {pagination.total} {t("products.productsLabel")}
            </p>
          </div>

          {/* Search + visibility row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="hidden md:block">
              {visibilityTabs}
            </div>

            {/* Search */}
            <div className="hidden md:block flex-1 max-w-sm" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); }}
                  placeholder={t("nav.searchPlaceholder")}
                  className="w-full border-b border-[#dddbd9] pl-0 pr-10 py-2.5 text-sm text-[#1a1c1e] placeholder-[#1a1c1e]/40 focus:border-[#1a1c1e] focus:ring-0 focus:outline-none transition-colors bg-transparent"
                />
                <Search className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1c1e]/60" />
              </div>

              {/* Autocomplete */}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute mt-1.5 bg-[#FFFFFF] border border-[#dddbd9] shadow-xl z-40 w-full max-w-sm overflow-hidden animate-slideDown">
                  <div className="p-3">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e]/60 font-medium">{t("nav.products")}</span>
                    <div className="mt-2 space-y-1">
                      {searchResults.map((p) => (
                        <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-3 p-2.5 hover:bg-[#dddbd9]/60 transition-colors" onClick={() => setShowSearch(false)}>
                          <Image src={p.image || PLACEHOLDER_IMG} alt={p.name} width={48} height={48} className="w-10 h-10 object-cover bg-[#dddbd9]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#1a1c1e] truncate" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{p.name}</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[#1a1c1e]/60">{p.brand}</p>
                          </div>
                          {p.price == null ? (
                            <span className="text-[10px] uppercase tracking-[0.18em] text-[#1a1c1e]">B2B</span>
                          ) : (
                            <span className="flex items-baseline gap-2 text-sm text-[#1a1c1e] whitespace-nowrap">
                              {p.oldPrice && p.oldPrice > p.price && (
                                <span className="text-[11px] text-[#1a1c1e]/50 line-through">{p.oldPrice.toLocaleString("sr-RS")}</span>
                              )}
                              <span>{p.price.toLocaleString("sr-RS")} <span className="text-[10px] text-[#1a1c1e]/60">RSD</span></span>
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile visibility tabs */}
          {!userRole && (
            <div className="md:hidden mt-4">
              {visibilityTabs}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-14">
        <div className="flex gap-10">
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <div className="sticky top-20">
              <h2 className="text-[10px] uppercase tracking-[0.28em] text-[#1a1c1e] font-medium mb-4 pb-4 border-b border-[#dddbd9]/60">{t("products.filters")}</h2>
              {filterSidebar}
              <button
                onClick={clearAllTags}
                className="w-full mt-6 border border-[#1a1c1e] text-[#1a1c1e] py-3 text-[10px] uppercase tracking-[0.22em] font-medium hover:bg-[#1a1c1e] hover:text-[#FFFFFF] transition-colors"
              >
                {t("products.resetFilters")}
              </button>
            </div>
          </aside>

          {/* MAIN */}
          <div className="flex-1 min-w-0">
            {/* Brand filter pills — multi-select; click twice toggles off */}
            {!activeBrand && brands.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-8 md:mb-10 pb-6 border-b border-[#dddbd9]/60">
                <button
                  onClick={() => setSelectedBrands([])}
                  className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                    selectedBrands.length === 0
                      ? "bg-[#c19742] text-white shadow-sm"
                      : "bg-[#dddbd9]/50 text-[#1a1c1e]/70 hover:bg-[#dddbd9] hover:text-[#1a1c1e]"
                  }`}
                >
                  {t("products.allBrands")}
                </button>
                {brands.map((b) => {
                  const isActive = selectedBrands.includes(b.slug);
                  return (
                    <button
                      key={b.slug}
                      onClick={() => toggleBrand(b.slug)}
                      className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-[#c19742] text-white shadow-sm"
                          : "bg-[#dddbd9]/50 text-[#1a1c1e]/70 hover:bg-[#dddbd9] hover:text-[#1a1c1e]"
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Product line pills — visible whenever ≥1 brand is selected (or activeBrand from URL).
                Multi-brand selection just merges all those brands' lines into one row. */}
            {(() => {
              const focusedBrandSlugs: string[] = activeBrand ? [activeBrand.slug] : selectedBrands;
              if (focusedBrandSlugs.length === 0) return null;
              const linesForBrands = productLines.filter((l) => focusedBrandSlugs.includes(l.brand.slug));
              if (linesForBrands.length === 0) return null;
              const showBrandSuffix = focusedBrandSlugs.length > 1;
              return (
                <div className="flex flex-wrap items-center gap-2 mb-8 md:mb-10 pb-6 border-b border-[#dddbd9]/60">
                  <button
                    onClick={() => setSelectedProductLines([])}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                      selectedProductLines.length === 0
                        ? "bg-[#c19742] text-white shadow-sm"
                        : "bg-[#dddbd9]/50 text-[#1a1c1e]/70 hover:bg-[#dddbd9] hover:text-[#1a1c1e]"
                    }`}
                  >
                    {t("products.allLines")}
                  </button>
                  {linesForBrands.map((l) => {
                    const isActive = selectedProductLines.includes(l.slug);
                    return (
                      <button
                        key={l.slug}
                        onClick={() => toggleProductLine(l.slug)}
                        className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-[#c19742] text-white shadow-sm"
                            : "bg-[#dddbd9]/50 text-[#1a1c1e]/70 hover:bg-[#dddbd9] hover:text-[#1a1c1e]"
                        }`}
                      >
                        {l.name}
                        {showBrandSuffix && (
                          <span className={`ml-1.5 text-[10px] uppercase tracking-[0.18em] ${isActive ? "text-white/70" : "text-[#1a1c1e]/40"}`}>
                            {l.brand.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileFilter(true)} className="lg:hidden flex items-center gap-2 border border-[#dddbd9] px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] font-medium hover:border-[#1a1c1e] transition-colors">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#1a1c1e]" /> {t("products.filters")}
                </button>

                {/* Grid / List toggle */}
                <div className="hidden sm:flex items-center border border-[#dddbd9] overflow-hidden">
                  <button
                    onClick={() => setGridView(true)}
                    className={`p-2.5 transition-all ${gridView ? "bg-[#1a1c1e] text-[#FFFFFF]" : "text-[#1a1c1e]/60 hover:text-[#1a1c1e] hover:bg-[#dddbd9]/40"}`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGridView(false)}
                    className={`p-2.5 transition-all ${!gridView ? "bg-[#1a1c1e] text-[#FFFFFF]" : "text-[#1a1c1e]/60 hover:text-[#1a1c1e] hover:bg-[#dddbd9]/40"}`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <SortSelect value={sortBy} onChange={setSortBy} />
            </div>

            {/* Active filter tags */}
            {activeTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {activeTags.map((tag) => (
                  <button
                    key={tag.key}
                    onClick={() => removeTag(tag.key)}
                    className="group flex items-center gap-1.5 bg-[#dddbd9] text-[#1a1c1e] pl-3 pr-2 py-1.5 text-[10px] uppercase tracking-[0.18em] font-medium border border-[#dddbd9] hover:bg-[#413d3a] hover:text-white hover:border-[#413d3a] transition-colors"
                  >
                    {tag.label}
                    <X className="w-3 h-3 text-[#FFFFFF]/70 group-hover:text-[#FFFFFF] transition-colors" />
                  </button>
                ))}
                <button onClick={clearAllTags} className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e]/60 hover:text-[#1a1c1e] underline-offset-4 hover:underline font-medium ml-1 transition-colors">
                  {t("products.clearFilters")}
                </button>
              </div>
            )}

            {/* Fetch error */}
            {fetchError && !loading && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm text-center">
                {fetchError}
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#dddbd9] border-t-[#1a1c1e] rounded-full animate-spin" />
              </div>
            )}

            {/* Product grid */}
            {!loading && (
              <div className={gridView ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8" : "space-y-4"}>
                {displayProducts.map((p) => gridView ? (
                  <ProductCard key={p.id} product={p} isWishlisted={wishlistedSet.has(p.id)} onNavigate={handleProductNavigate} />
                ) : (
                  <Link key={p.id} href={`/products/${p.slug}`} onClick={handleProductNavigate} className="flex bg-[#FFFFFF] hover:bg-[#dddbd9]/40 transition-colors overflow-hidden group">
                    <div className="w-36 h-36 bg-[#dddbd9] flex-shrink-0 relative overflow-hidden">
                      <Image src={p.image || PLACEHOLDER_IMG} alt={p.name} width={400} height={400} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                      {p.isProfessional && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] font-medium bg-[#1a1c1e]/90 text-[#FFFFFF] backdrop-blur-sm">{t("products.professional")}</span>
                      )}
                      {getBadge(p) && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] font-medium bg-[rgba(26,28,30,0.5)] text-[#FFFFFF] backdrop-blur-sm rounded-full">{getBadge(p)}</span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e]/60 font-medium">{p.brand?.name ?? ""}</span>
                      <h3 className="text-base text-[#1a1c1e] mt-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{p.name}</h3>
                      <div className="flex items-center gap-0.5 mt-2">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(p.rating) ? "fill-[#1a1c1e] text-[#1a1c1e]" : "fill-[#1a1c1e]/15 text-[#1a1c1e]/25"}`} />)}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2 text-[#1a1c1e]">
                        {p.price == null ? (
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e] font-medium">B2B samo</span>
                        ) : (
                          <>
                            {p.oldPrice && <span className="text-xs text-[#1a1c1e]/60 line-through">{p.oldPrice.toLocaleString("sr-RS")} RSD</span>}
                            <span className="text-sm">{p.price.toLocaleString("sr-RS")} <span className="text-xs text-[#1a1c1e]/60">RSD</span></span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg text-[#1a1c1e]/60" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("products.noProducts")}</p>
              </div>
            )}

            {/* Load progress + Load more */}
            {!loading && products.length > 0 && pagination.total > 0 && (
              <div className="flex flex-col items-center mt-16">
                {/* Progress bar — how many of the total are currently loaded */}
                <div className="w-full max-w-[420px] h-1 bg-[#dddbd9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1a1c1e] rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.round((displayProducts.length / pagination.total) * 100))}%` }}
                  />
                </div>
                <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-[#1a1c1e]/60 font-medium">
                  Prikazujem {displayProducts.length} od {pagination.total}
                </p>

                {hasMore && (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="mt-6 inline-flex items-center justify-center gap-2 px-10 py-4 border border-[#1a1c1e] text-[#1a1c1e] text-[10px] uppercase tracking-[0.28em] font-medium transition-colors hover:bg-[#1a1c1e] hover:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1a1c1e]"
                  >
                    {loadingMore && (
                      <span className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                    )}
                    {t("products.loadMore")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilter && (
        <>
          <div className="fixed inset-0 bg-[#1a1c1e]/40 backdrop-blur-sm z-50" onClick={() => setMobileFilter(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-[320px] bg-[#FFFFFF] z-50 overflow-y-auto animate-slideInLeft flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#dddbd9]/60 flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#1a1c1e]" />
                <h3 className="text-[10px] uppercase tracking-[0.28em] font-medium text-[#1a1c1e]">{t("products.filters")}</h3>
              </div>
              <button onClick={() => setMobileFilter(false)} className="w-8 h-8 hover:bg-[#dddbd9]/60 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-[#1a1c1e]" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">{filterSidebar}</div>
            <div className="p-5 border-t border-[#dddbd9]/60 flex-shrink-0 flex gap-3">
              <button onClick={() => { clearAllTags(); setMobileFilter(false); }} className="flex-1 border border-[#1a1c1e] text-[#1a1c1e] py-3 text-[10px] uppercase tracking-[0.22em] font-medium transition-colors hover:bg-[#1a1c1e] hover:text-[#FFFFFF]">
                {t("products.resetFilters")}
              </button>
              <button onClick={() => setMobileFilter(false)} className="flex-1 bg-[#c19742] hover:bg-[#413d3a] text-[#ffffff] py-3 text-[10px] uppercase tracking-[0.22em] font-medium transition-colors">
                {t("products.applyFilters")}
              </button>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
