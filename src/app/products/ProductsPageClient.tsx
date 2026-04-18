"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Heart, Star, SlidersHorizontal,
  ChevronDown, ChevronRight, Grid3X3, LayoutList,
  X, ArrowUpDown, ShoppingBag, CheckCircle,
} from "lucide-react";
import DOMPurify from "dompurify";
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

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: ProductBrand | null;
  category: ProductCategory | null;
  price: number;
  priceB2c: number;
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
  price: number;
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

interface ProductsPageClientProps {
  initialProducts: Product[];
  initialPagination: Pagination;
  brands: BrandFilter[];
  categories: CategoryNode[];
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
    <section className="bg-[#FFFBF4] border-b border-[#D8CFBC]">
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        {brand.logoUrl ? (
          <Image src={brand.logoUrl} alt={brand.name} width={80} height={40} className="h-10 mx-auto object-contain mb-3" />
        ) : (
          <h2 className="text-xl font-bold text-[#11120D] mb-3" style={{ fontFamily: "'Noto Serif', serif" }}>{brand.name}</h2>
        )}
        {cleanHtml && (
          <>
            <div
              className={`text-[#11120D]/60 text-[13px] leading-relaxed [&_p]:mb-2 [&_strong]:text-[#11120D] [&_strong]:font-semibold ${expanded ? "" : "max-h-[4.5em] overflow-hidden"}`}
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />
            {hasLongContent && (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-2 text-xs font-medium text-[#11120D]/60 hover:text-[#11120D] transition-colors"
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
  if (product.oldPrice && product.oldPrice > product.price) {
    const pct = Math.round((1 - product.price / product.oldPrice) * 100);
    return `-${pct}%`;
  }
  return null;
}

/* ─── ProductCard ─── */
function ProductCard({ product, isWishlisted }: { product: Product; isWishlisted?: boolean }) {
  const { t } = useLanguage();
  const [liked, setLiked] = useState(isWishlisted ?? false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();
  const { increment: incWishlist, decrement: decWishlist } = useWishlistStore();
  const badge = getBadge(product);
  const imgSrc = product.image || PLACEHOLDER_IMG;

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
    if (outOfStock) return;
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
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F2ECDE] mb-4">
        <Image src={imgSrc} alt={product.name} width={500} height={625} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {badge && (
            <span className={`px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] backdrop-blur-sm ${
              badge === "NOVO" ? "bg-[#FFFBF4]/90 text-[#11120D]"
              : badge === "HIT" ? "bg-[#FFFBF4]/90 text-[#11120D]"
              : "bg-[#11120D]/90 text-[#FFFBF4]"
            }`}>{badge}</span>
          )}
          {product.isProfessional && (
            <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] bg-[#11120D]/90 text-[#FFFBF4] backdrop-blur-sm">{t("products.professional")}</span>
          )}
          {product.variantCount != null && product.variantCount > 1 && (
            <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] bg-[#FFFBF4]/90 text-[#11120D] backdrop-blur-sm">
              {product.variantCount} boja
            </span>
          )}
        </div>
        <button onClick={handleToggleWishlist} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FFFBF4]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[#FFFBF4] transition-colors z-10 opacity-0 group-hover:opacity-100">
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-[#11120D] text-[#11120D]" : "text-[#11120D]"}`} />
        </button>
        <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button onClick={handleAddToCart} disabled={outOfStock} className={`w-full text-[10px] uppercase tracking-[0.22em] font-medium py-3 transition-colors flex items-center justify-center gap-2 ${outOfStock ? "bg-[#D8CFBC] text-[#11120D]/60 cursor-not-allowed" : addedToCart ? "bg-[#5c6050] text-[#FFFBF4]" : "bg-[#7A7F6A] text-[#FFFBF4] hover:bg-[#5c6050]"}`}>
            {outOfStock ? <>{t("products.outOfStock")}</> : addedToCart ? <><CheckCircle className="w-3.5 h-3.5" /> {t("products.addedToCart")}</> : <><ShoppingBag className="w-3.5 h-3.5" /> {t("products.addToCart")}</>}
          </button>
        </div>
      </div>
      <div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#11120D]/60 font-medium block mb-1.5">{product.brand?.name ?? ""}</span>
        <h3 className="text-base text-[#11120D] mb-1 font-normal line-clamp-2 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.name}</h3>
        <div className="flex items-center gap-2 text-sm text-[#11120D] mt-1">
          {product.oldPrice && <span className="text-[#11120D]/60 line-through text-xs">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
          <span>{product.price.toLocaleString("sr-RS")} RSD</span>
        </div>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(product.rating) ? "fill-[#11120D] text-[#11120D]" : "fill-[#11120D]/15 text-[#11120D]/25"}`} />)}
        </div>
      </div>
    </Link>
  );
}

/* ─── FilterSection ─── */
function FilterSection({ title, children, defaultOpen = true, count }: { title: string; children: React.ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-5 border-b border-[#D8CFBC]/60">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full group">
        <span className="text-[10px] font-medium text-[#11120D] uppercase tracking-[0.22em]">{title}</span>
        <div className="flex items-center gap-2">
          {count !== undefined && count > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#11120D] text-[#FFFBF4] text-[9px] font-medium flex items-center justify-center">{count}</span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-[#11120D] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
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
        className={`flex items-center gap-2.5 w-full text-[12px] py-2 hover:bg-[#EFE7D5]/40 px-2 -mx-2 transition-colors ${
          isSelected ? "font-medium text-[#11120D] bg-[#EFE7D5]/60" : depth === 0 ? "text-[#11120D]" : "text-[#11120D]/60"
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren && (
          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 text-[#11120D]/60 ${expanded ? "rotate-90" : ""}`} />
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
        className="flex items-center gap-2 border border-[#D8CFBC] px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] font-medium text-[#11120D] hover:border-[#11120D] transition-colors min-w-[180px] justify-between"
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#11120D]/60" />
          <span>{current?.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#11120D]/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-[#FFFBF4] border border-[#D8CFBC] shadow-lg z-40 min-w-[200px] overflow-hidden animate-slideDown">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                value === opt.value
                  ? "bg-[#EFE7D5]/60 text-[#11120D] font-medium"
                  : "text-[#11120D]/60 hover:bg-[#EFE7D5]/40 hover:text-[#11120D]"
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

  const [wishlistedProductIds, setWishlistedProductIds] = useState<string[]>(_serverWishlist);
  const wishlistedSet = new Set(wishlistedProductIds);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [gridView, setGridView] = useState(true);
  const [mobileFilter, setMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParam || "");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedGender, setSelectedGender] = useState<string | null>(genderParam);

  // Sync category, gender, and brand from URL when navigating between menu links
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSelectedGender(genderParam);
    setSelectedBrands(brandParam ? [brandParam] : []);
    setCurrentPage(1);
  }, [categoryParam, genderParam, brandParam]);

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
    params.set("limit", "12");
    params.set("sort", sortBy);

    if (!userRole) {
      params.set("visibility", visibility);
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    }

    if (selectedGender) {
      params.set("gender", selectedGender);
    }

    selectedBrands.forEach((b) => params.append("brand", b));

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
  }, [sortBy, visibility, userRole, selectedCategory, selectedGender, selectedBrands, priceMin, priceMax, activeToggles, searchQuery, filterHasColor, filterColorLevel, filterUndertone]);

  // Fetch products from API
  const fetchProducts = useCallback(async (page: number) => {
    setLoading(true);
    setFetchError("");
    try {
      const qs = buildQueryString(page);
      const res = await fetch(`/api/products?${qs}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products);
        setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setFetchError("Greška pri učitavanju proizvoda. Pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  // Re-fetch when filters/sort/visibility change (reset to page 1)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, visibility, selectedCategory, selectedGender, selectedBrands, activeToggles, searchParam, filterColorLevel, filterUndertone, filterHasColor]);

  // Re-fetch when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchProducts(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}`);
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

  const removeTag = (tagKey: string) => {
    if (tagKey.startsWith("brand:")) {
      const slug = tagKey.replace("brand:", "");
      setSelectedBrands((prev) => prev.filter((s) => s !== slug));
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
    setActiveToggles([]);
    setSelectedCategory(null);
    setSelectedGender(null);
    setFilterColorLevel(null);
    setFilterUndertone(null);
    setFilterHasColor(false);
  };

  // Build toggle filters from attributes + built-in toggles
  const toggleFilters: { key: string; label: string }[] = [
    { key: "new", label: "Noviteti" },
    { key: "on_sale", label: "Na akciji" },
    ...attributes
      .filter((a) => a.type === "boolean" && a.slug)
      .map((a) => ({ key: a.slug, label: a.nameLat })),
  ];

  const totalPages = pagination.totalPages;
  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return start + i;
  });

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
                  ? "bg-[#11120D] text-white"
                  : "text-[#11120D]/60 hover:text-[#11120D] hover:bg-[#FFFBF4]"
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

      <FilterSection title={`${t("products.price")} (RSD)`} defaultOpen={false}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Od"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full border border-[#D8CFBC] rounded-sm px-3.5 py-2.5 text-sm bg-[#FFFBF4] focus:bg-white focus:border-black focus:outline-none transition-all placeholder-[#D8CFBC]"
            />
          </div>
          <span className="text-[#D8CFBC] text-sm">—</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Do"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full border border-[#D8CFBC] rounded-sm px-3.5 py-2.5 text-sm bg-[#FFFBF4] focus:bg-white focus:border-black focus:outline-none transition-all placeholder-[#D8CFBC]"
            />
          </div>
        </div>
        <button
          onClick={handlePriceApply}
          className="mt-3 w-full bg-[#11120D] hover:bg-[#2b2c24] text-white text-sm py-2.5 rounded-sm font-medium transition-colors"
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
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#11120D]/60 mb-3">{t("colorPage.lightnessLevel")}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {availableColorLevels.map(({ level, count, hexSamples }) => {
                    const labelMap: Record<number, string> = {
                      1: "Crna", 2: "Najt. braon", 3: "Tamno braon", 4: "Sred. braon", 5: "Svet. braon",
                      6: "Tamno plava", 7: "Sred. plava", 8: "Svet. plava", 9: "V. sv. plava", 10: "Ekstra sv.",
                    };
                    const displayHex = hexSamples[0] || "#888";
                    return (
                      <button
                        key={level}
                        onClick={() => setFilterColorLevel(filterColorLevel === level ? null : level)}
                        className={`flex flex-col items-center gap-1 py-1.5 rounded-sm transition-all ${
                          filterColorLevel === level ? "bg-[#FFFBF4] ring-1 ring-[#11120D]" : "hover:bg-[#FFFBF4]"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border transition-transform ${
                            filterColorLevel === level ? "border-black scale-110 shadow-md" : "border-[#D8CFBC]"
                          }`}
                          style={{ backgroundColor: displayHex }}
                        />
                        <span className="text-[8px] text-[#11120D]/60 leading-tight text-center font-medium">{labelMap[level] || `Nivo ${level}`}</span>
                        <span className="text-[8px] text-[#D8CFBC]">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Color Family (Undertone) ── only undertones that exist */}
            {availableColorUndertones.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#11120D]/60 mb-3">Porodica boja</p>
                <div className="space-y-1">
                  {availableColorUndertones.map((ut) => (
                    <button
                      key={ut.code}
                      onClick={() => setFilterUndertone(filterUndertone === ut.code ? null : ut.code)}
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-sm transition-all text-left ${
                        filterUndertone === ut.code ? "bg-[#FFFBF4] ring-1 ring-[#11120D]" : "hover:bg-[#FFFBF4]"
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
                          filterUndertone === ut.code ? "text-[#11120D]" : "text-[#11120D]/60"
                        }`}>{ut.name}</span>
                      </div>
                      <span className="text-[10px] text-[#D8CFBC] font-medium">{ut.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Active color filter tags ── */}
            {(filterColorLevel || filterUndertone || filterHasColor) && (
              <div className="pt-3 border-t border-[#D8CFBC] space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {filterColorLevel && (
                    <span className="inline-flex items-center gap-1 bg-[#FFFBF4] text-[#11120D] text-[10px] font-medium px-2 py-1 rounded-sm">
                      Nivo {filterColorLevel}
                      <button onClick={() => setFilterColorLevel(null)} className="text-[#11120D]/60 hover:text-[#11120D] ml-0.5">&times;</button>
                    </span>
                  )}
                  {filterUndertone && (
                    <span className="inline-flex items-center gap-1 bg-[#FFFBF4] text-[#11120D] text-[10px] font-medium px-2 py-1 rounded-sm">
                      {availableColorUndertones.find(u => u.code === filterUndertone)?.name || filterUndertone}
                      <button onClick={() => setFilterUndertone(null)} className="text-[#11120D]/60 hover:text-[#11120D] ml-0.5">&times;</button>
                    </span>
                  )}
                  {filterHasColor && (
                    <span className="inline-flex items-center gap-1 bg-[#FFFBF4] text-[#11120D] text-[10px] font-medium px-2 py-1 rounded-sm">
                      Samo boje
                      <button onClick={() => setFilterHasColor(false)} className="text-[#11120D]/60 hover:text-[#11120D] ml-0.5">&times;</button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setFilterColorLevel(null); setFilterUndertone(null); setFilterHasColor(false); }}
                  className="text-[10px] text-[#11120D]/60 hover:text-[#11120D] transition-colors uppercase tracking-wider font-medium"
                >
                  Resetuj filtere boja
                </button>
              </div>
            )}

            {/* ── Only color products toggle ── */}
            <label className="flex items-center justify-between cursor-pointer group py-0.5 border-t border-[#D8CFBC] pt-3">
              <span className="text-[12px] text-[#11120D]/60 group-hover:text-[#11120D] transition-colors">Prikaži samo proizvode sa bojom</span>
              <button
                onClick={(e) => { e.preventDefault(); setFilterHasColor(!filterHasColor); }}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${filterHasColor ? "bg-[#11120D]" : "bg-[#D8CFBC]"}`}
              >
                <span className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-300 ${filterHasColor ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
              </button>
            </label>
          </div>
        </FilterSection>
      )}

      <FilterSection title="Osobine">
        <div className="space-y-3">
          {toggleFilters.map((f) => (
            <label key={f.key} className="flex items-center justify-between cursor-pointer group py-0.5">
              <span className="text-[13px] text-[#11120D]/60 group-hover:text-[#11120D] transition-colors">{f.label}</span>
              <button
                onClick={(e) => { e.preventDefault(); toggleFilter(f.key); }}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${activeToggles.includes(f.key) ? "bg-[#11120D]" : "bg-[#D8CFBC]"}`}
              >
                <span className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-300 ${activeToggles.includes(f.key) ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
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
              ? "text-[#11120D] border-b border-[#11120D]"
              : "text-[#11120D]/60 hover:text-[#11120D]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#FFFBF4]" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <Header />

      {/* Brand Header (when filtering by brand) */}
      {activeBrand && (
        <BrandHeader brand={activeBrand} />
      )}

      {/* Editorial Page Header */}
      <div className="bg-[#FFFBF4] border-b border-[#D8CFBC]/60">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-14 md:pt-20 pb-10 md:pb-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#11120D]/60 mb-8">
            <Link href="/" className="hover:text-[#11120D] transition-colors">{t("productDetail.home")}</Link>
            <ChevronRight className="w-3 h-3" />
            {activeBrand ? (
              <>
                <Link href="/products" className="hover:text-[#11120D] transition-colors">{t("products.allProducts")}</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#11120D]">{activeBrand.name}</span>
              </>
            ) : (
              <span className="text-[#11120D]">{t("products.allProducts")}</span>
            )}
          </nav>

          {/* Editorial heading */}
          <div className="max-w-3xl mb-10 md:mb-14">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#11120D]/60 font-medium block mb-5">
              Kolekcija
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-light text-[#11120D] leading-[1.05] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {activeBrand ? (
                <>{activeBrand.name}, <em className="italic">okupljeno</em>.</>
              ) : (
                <>Svaki ritual, <em className="italic">okupljen</em>.</>
              )}
            </h1>
            <p className="text-[14px] text-[#11120D]/60 leading-relaxed mt-5 max-w-lg">
              Pregledaj punu paletu altamoda — šamponi, regeneratori, maske, ulja i alati — ručno biran, kliničko-testiran i slavljen u našim neobeleženim doznačima.
            </p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#11120D]/60 mt-6">
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
                  className="w-full border-b border-[#D8CFBC] pl-0 pr-10 py-2.5 text-sm text-[#11120D] placeholder-[#11120D]/40 focus:border-[#11120D] focus:ring-0 focus:outline-none transition-colors bg-transparent"
                />
                <Search className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-[#11120D]/60" />
              </div>

              {/* Autocomplete */}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute mt-1.5 bg-[#FFFBF4] border border-[#D8CFBC] shadow-xl z-40 w-full max-w-sm overflow-hidden animate-slideDown">
                  <div className="p-3">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#11120D]/60 font-medium">{t("nav.products")}</span>
                    <div className="mt-2 space-y-1">
                      {searchResults.map((p) => (
                        <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-3 p-2.5 hover:bg-[#EFE7D5]/60 transition-colors" onClick={() => setShowSearch(false)}>
                          <Image src={p.image || PLACEHOLDER_IMG} alt={p.name} width={48} height={48} className="w-10 h-10 object-cover bg-[#F2ECDE]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#11120D] truncate" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{p.name}</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[#11120D]/60">{p.brand}</p>
                          </div>
                          <span className="text-sm text-[#11120D]">{p.price.toLocaleString("sr-RS")} <span className="text-[10px] text-[#11120D]/60">RSD</span></span>
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
              <h2 className="text-[10px] uppercase tracking-[0.28em] text-[#11120D] font-medium mb-4 pb-4 border-b border-[#D8CFBC]/60">{t("products.filters")}</h2>
              {filterSidebar}
              <button
                onClick={clearAllTags}
                className="w-full mt-6 border border-[#11120D] text-[#11120D] py-3 text-[10px] uppercase tracking-[0.22em] font-medium hover:bg-[#11120D] hover:text-[#FFFBF4] transition-colors"
              >
                {t("products.resetFilters")}
              </button>
            </div>
          </aside>

          {/* MAIN */}
          <div className="flex-1 min-w-0">
            {/* Brand filter pills — editorial minimalist */}
            {!activeBrand && brands.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8 md:mb-10 pb-6 border-b border-[#D8CFBC]/60">
                <button
                  onClick={() => setSelectedBrands([])}
                  className={`text-[10px] uppercase tracking-[0.22em] font-medium transition-colors pb-0.5 ${
                    selectedBrands.length === 0
                      ? "text-[#11120D] border-b border-[#11120D]"
                      : "text-[#11120D]/60 hover:text-[#11120D]"
                  }`}
                >
                  {t("products.allBrands")}
                </button>
                {brands.map((b) => (
                  <button
                    key={b.slug}
                    onClick={() => toggleBrand(b.slug)}
                    className={`text-[10px] uppercase tracking-[0.22em] font-medium transition-colors pb-0.5 ${
                      selectedBrands.includes(b.slug)
                        ? "text-[#11120D] border-b border-[#11120D]"
                        : "text-[#11120D]/60 hover:text-[#11120D]"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileFilter(true)} className="lg:hidden flex items-center gap-2 border border-[#D8CFBC] px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] font-medium hover:border-[#11120D] transition-colors">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#11120D]" /> {t("products.filters")}
                </button>

                {/* Grid / List toggle */}
                <div className="hidden sm:flex items-center border border-[#D8CFBC] overflow-hidden">
                  <button
                    onClick={() => setGridView(true)}
                    className={`p-2.5 transition-all ${gridView ? "bg-[#11120D] text-[#FFFBF4]" : "text-[#11120D]/60 hover:text-[#11120D] hover:bg-[#EFE7D5]/40"}`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGridView(false)}
                    className={`p-2.5 transition-all ${!gridView ? "bg-[#11120D] text-[#FFFBF4]" : "text-[#11120D]/60 hover:text-[#11120D] hover:bg-[#EFE7D5]/40"}`}
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
                    className="group flex items-center gap-1.5 bg-[#7A7F6A] text-[#FFFBF4] pl-3 pr-2 py-1.5 text-[10px] uppercase tracking-[0.18em] font-medium border border-[#7A7F6A] hover:bg-[#5c6050] hover:border-[#5c6050] transition-colors"
                  >
                    {tag.label}
                    <X className="w-3 h-3 text-[#FFFBF4]/70 group-hover:text-[#FFFBF4] transition-colors" />
                  </button>
                ))}
                <button onClick={clearAllTags} className="text-[10px] uppercase tracking-[0.22em] text-[#11120D]/60 hover:text-[#11120D] underline-offset-4 hover:underline font-medium ml-1 transition-colors">
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
                <div className="w-8 h-8 border-2 border-[#D8CFBC] border-t-[#11120D] rounded-full animate-spin" />
              </div>
            )}

            {/* Product grid */}
            {!loading && (
              <div className={gridView ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8" : "space-y-4"}>
                {products.map((p) => gridView ? (
                  <ProductCard key={p.id} product={p} isWishlisted={wishlistedSet.has(p.id)} />
                ) : (
                  <Link key={p.id} href={`/products/${p.slug}`} className="flex bg-[#FFFBF4] hover:bg-[#EFE7D5]/40 transition-colors overflow-hidden group">
                    <div className="w-36 h-36 bg-[#F2ECDE] flex-shrink-0 relative overflow-hidden">
                      <Image src={p.image || PLACEHOLDER_IMG} alt={p.name} width={400} height={400} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                      {p.isProfessional && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] font-medium bg-[#11120D]/90 text-[#FFFBF4] backdrop-blur-sm">{t("products.professional")}</span>
                      )}
                      {getBadge(p) && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] font-medium bg-[#FFFBF4]/90 text-[#11120D] backdrop-blur-sm">{getBadge(p)}</span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#11120D]/60 font-medium">{p.brand?.name ?? ""}</span>
                      <h3 className="text-base text-[#11120D] mt-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{p.name}</h3>
                      <div className="flex items-center gap-0.5 mt-2">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(p.rating) ? "fill-[#11120D] text-[#11120D]" : "fill-[#11120D]/15 text-[#11120D]/25"}`} />)}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2 text-[#11120D]">
                        {p.oldPrice && <span className="text-xs text-[#11120D]/60 line-through">{p.oldPrice.toLocaleString("sr-RS")} RSD</span>}
                        <span className="text-sm">{p.price.toLocaleString("sr-RS")} <span className="text-xs text-[#11120D]/60">RSD</span></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg text-[#11120D]/60" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("products.noProducts")}</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-16">
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-10 h-10 flex items-center justify-center text-[11px] font-medium transition-all ${
                      currentPage === p
                        ? "bg-[#11120D] text-[#FFFBF4]"
                        : "text-[#11120D]/60 hover:text-[#11120D] border border-[#D8CFBC] hover:border-[#11120D]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {currentPage < totalPages && (
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="w-10 h-10 flex items-center justify-center border border-[#D8CFBC] hover:border-[#11120D] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-[#11120D]" />
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
          <div className="fixed inset-0 bg-[#11120D]/40 backdrop-blur-sm z-50" onClick={() => setMobileFilter(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-[320px] bg-[#FFFBF4] z-50 overflow-y-auto animate-slideInLeft flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#D8CFBC]/60 flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#11120D]" />
                <h3 className="text-[10px] uppercase tracking-[0.28em] font-medium text-[#11120D]">{t("products.filters")}</h3>
              </div>
              <button onClick={() => setMobileFilter(false)} className="w-8 h-8 hover:bg-[#EFE7D5]/60 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-[#11120D]" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">{filterSidebar}</div>
            <div className="p-5 border-t border-[#D8CFBC]/60 flex-shrink-0 flex gap-3">
              <button onClick={() => { clearAllTags(); setMobileFilter(false); }} className="flex-1 border border-[#11120D] text-[#11120D] py-3 text-[10px] uppercase tracking-[0.22em] font-medium transition-colors hover:bg-[#11120D] hover:text-[#FFFBF4]">
                {t("products.resetFilters")}
              </button>
              <button onClick={() => setMobileFilter(false)} className="flex-1 bg-[#11120D] hover:bg-[#2b2c24] text-[#FFFBF4] py-3 text-[10px] uppercase tracking-[0.22em] font-medium transition-colors">
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
