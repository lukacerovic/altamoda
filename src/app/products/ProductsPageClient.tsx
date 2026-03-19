"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, Heart, Star, SlidersHorizontal,
  ChevronDown, ChevronRight, Grid3X3, LayoutList,
  X, ArrowUpDown, ShoppingBag, CheckCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";

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

interface ProductsPageClientProps {
  initialProducts: Product[];
  initialPagination: Pagination;
  brands: BrandFilter[];
  categories: CategoryNode[];
  attributes: AttributeFilter[];
  userRole: string | null;
  wishlistedProductIds?: string[];
}

/* ─── Helpers ─── */
const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop";

function getBadge(product: Product): string | null {
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <Link href={`/products/${product.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-transparent hover:border-[#e0d8cc] hover:shadow-sm transition-all flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-[#faf7f3]">
        <img src={imgSrc} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {badge && (
            <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
              badge === "NOVO" ? "bg-[#8c4a5a] text-white"
              : badge === "HIT" ? "bg-[#2d2d2d] text-white"
              : "bg-[#b5453a] text-white"
            }`}>{badge}</span>
          )}
          {product.isProfessional && (
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#2d2d2d]/80 text-white backdrop-blur-sm">PRO</span>
          )}
        </div>
        <button onClick={handleToggleWishlist} className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all z-10 shadow-sm">
          <Heart className={`w-4 h-4 ${liked ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-[#999]"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button onClick={handleAddToCart} className={`w-full text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${addedToCart ? "bg-green-600" : "bg-[#2d2d2d] hover:bg-[#1a1a1a]"}`}>
            {addedToCart ? <><CheckCircle className="w-4 h-4" /> Dodato!</> : <><ShoppingBag className="w-4 h-4" /> Dodaj u korpu</>}
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[11px] text-[#8c4a5a] font-semibold tracking-widest uppercase">{product.brand?.name ?? ""}</span>
        <h3 className="text-sm font-medium text-[#2d2d2d] mt-1.5 line-clamp-2 flex-1 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-0.5 mt-2.5">
          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(product.rating) ? "fill-[#c4883a] text-[#c4883a]" : "text-[#e0d8cc]"}`} />)}
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          {product.oldPrice && <span className="text-xs text-[#999] line-through">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
          <span className="text-[15px] font-bold text-[#2d2d2d]">{product.price.toLocaleString("sr-RS")} <span className="text-xs font-semibold">RSD</span></span>
        </div>
      </div>
    </Link>
  );
}

/* ─── FilterSection ─── */
function FilterSection({ title, children, defaultOpen = true, count }: { title: string; children: React.ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-5 border-b border-[#f0ebe3]">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full group">
        <span className="text-[13px] font-semibold text-[#2d2d2d] uppercase tracking-wider">{title}</span>
        <div className="flex items-center gap-2">
          {count !== undefined && count > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#8c4a5a] text-white text-[10px] font-bold flex items-center justify-center">{count}</span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#999] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
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
        className={`flex items-center gap-2.5 w-full text-[13px] py-2 rounded-lg hover:bg-[#f5f0e8] px-2 -mx-2 transition-colors ${
          isSelected ? "font-semibold text-[#8c4a5a] bg-[#fdf5f7]" : depth === 0 ? "font-medium text-[#2d2d2d]" : "text-[#6b6b6b]"
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren && (
          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 text-[#999] ${expanded ? "rotate-90" : ""}`} />
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = [
    { value: "popular", label: "Najpopularnije" },
    { value: "price_asc", label: "Cena: Najniža" },
    { value: "price_desc", label: "Cena: Najviša" },
    { value: "newest", label: "Najnovije" },
    { value: "name_asc", label: "Ime: A-Ž" },
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
        className="flex items-center gap-2 bg-white border border-[#e8e2d9] rounded-xl px-4 py-2.5 text-sm text-[#2d2d2d] hover:border-[#ccc] transition-colors min-w-[180px] justify-between"
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#999]" />
          <span>{current?.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#999] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-[#e8e2d9] shadow-lg z-40 min-w-[200px] overflow-hidden animate-slideDown">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === opt.value
                  ? "bg-[#faf7f3] text-[#8c4a5a] font-medium"
                  : "text-[#6b6b6b] hover:bg-[#faf7f3] hover:text-[#2d2d2d]"
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
  userRole,
  wishlistedProductIds = [],
}: ProductsPageClientProps) {
  const wishlistedSet = new Set(wishlistedProductIds);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [loading, setLoading] = useState(false);

  const [gridView, setGridView] = useState(true);
  const [mobileFilter, setMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [activeToggles, setActiveToggles] = useState<string[]>([]);

  // Visibility tab for guests
  const [visibility, setVisibility] = useState<"all" | "b2c" | "b2b">("all");

  const searchRef = useRef<HTMLDivElement>(null);

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

    return params.toString();
  }, [sortBy, visibility, userRole, selectedCategory, selectedBrands, priceMin, priceMax, activeToggles, searchQuery]);

  // Fetch products from API
  const fetchProducts = useCallback(async (page: number) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  // Re-fetch when filters/sort/visibility change (reset to page 1)
  useEffect(() => {
    // Skip initial render — we already have initialProducts
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts(1);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, visibility, selectedCategory, selectedBrands, activeToggles]);

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
    } else if (tagKey.startsWith("cat:")) {
      setSelectedCategory(null);
    }
  };

  const clearAllTags = () => {
    setSelectedBrands([]);
    setActiveToggles([]);
    setSelectedCategory(null);
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
  const filterSidebar = (
    <div>
      {/* Category Tree */}
      <FilterSection title="Kategorije">
        <div className="space-y-0">
          {categories.map((cat) => (
            <CategoryTreeItem key={cat.id} item={cat} onSelect={handleCategorySelect} selectedSlug={selectedCategory} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brend" count={selectedBrands.length}>
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          {brands.map((b) => (
            <label key={b.slug} className="flex items-center gap-3 text-[13px] text-[#6b6b6b] cursor-pointer hover:text-[#2d2d2d] py-1.5 px-2 -mx-2 rounded-lg hover:bg-[#f5f0e8] transition-colors">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={selectedBrands.includes(b.slug)}
                  onChange={() => toggleBrand(b.slug)}
                />
                <div className="w-[18px] h-[18px] rounded-md border-2 border-[#d5cfc5] peer-checked:border-[#8c4a5a] peer-checked:bg-[#8c4a5a] transition-all flex items-center justify-center">
                  <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              {b.name}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Cena (RSD)" defaultOpen={false}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Od"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full border border-[#e8e2d9] rounded-xl px-3.5 py-2.5 text-sm bg-[#faf7f3] focus:bg-white focus:border-[#8c4a5a] focus:outline-none transition-all placeholder-[#bbb]"
            />
          </div>
          <span className="text-[#ccc] text-sm">—</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Do"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full border border-[#e8e2d9] rounded-xl px-3.5 py-2.5 text-sm bg-[#faf7f3] focus:bg-white focus:border-[#8c4a5a] focus:outline-none transition-all placeholder-[#bbb]"
            />
          </div>
        </div>
        <button
          onClick={handlePriceApply}
          className="mt-3 w-full bg-[#2d2d2d] hover:bg-[#2d2d2d] text-white text-sm py-2.5 rounded-xl font-medium transition-colors"
        >
          Primeni
        </button>
      </FilterSection>

      <FilterSection title="Osobine">
        <div className="space-y-3">
          {toggleFilters.map((f) => (
            <label key={f.key} className="flex items-center justify-between cursor-pointer group py-0.5">
              <span className="text-[13px] text-[#6b6b6b] group-hover:text-[#2d2d2d] transition-colors">{f.label}</span>
              <button
                onClick={(e) => { e.preventDefault(); toggleFilter(f.key); }}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${activeToggles.includes(f.key) ? "bg-[#8c4a5a]" : "bg-[#e0d8cc]"}`}
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
    <div className="flex items-center gap-1 bg-white border border-[#e8e2d9] rounded-xl p-1 shadow-sm">
      {([
        { key: "all" as const, label: "Svi proizvodi" },
        { key: "b2c" as const, label: "Maloprodaja" },
        { key: "b2b" as const, label: "Profesionalno" },
      ]).map((tab) => (
        <button
          key={tab.key}
          onClick={() => setVisibility(tab.key)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            visibility === tab.key
              ? "bg-[#2d2d2d] text-white shadow-sm"
              : "text-[#6b6b6b] hover:text-[#2d2d2d] hover:bg-[#faf7f3]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-[#e8e2d9]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#999] mb-4">
            <Link href="/" className="hover:text-[#2d2d2d] transition-colors">Početna</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#2d2d2d] font-medium">Svi Proizvodi</span>
          </nav>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Svi Proizvodi
              </h1>
              <p className="text-sm text-[#999] mt-2">{pagination.total} proizvoda</p>
            </div>

            {/* Visibility tabs */}
            <div className="hidden md:block">
              {visibilityTabs}
            </div>

            {/* Search */}
            <div className="hidden md:block flex-1 max-w-md ml-8" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); }}
                  placeholder="Pretražite proizvode..."
                  className="w-full border border-[#e8e2d9] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#8c4a5a] focus:outline-none bg-[#faf7f3] focus:bg-white transition-all placeholder-[#bbb]"
                />
              </div>

              {/* Autocomplete */}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute mt-1.5 bg-white rounded-xl border border-[#e8e2d9] shadow-xl z-40 w-full max-w-md overflow-hidden animate-slideDown">
                  <div className="p-3">
                    <span className="text-[11px] text-[#999] font-semibold tracking-widest uppercase">Proizvodi</span>
                    <div className="mt-2 space-y-1">
                      {searchResults.map((p) => (
                        <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#faf7f3] transition-colors" onClick={() => setShowSearch(false)}>
                          <img src={p.image || PLACEHOLDER_IMG} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2d2d2d] truncate">{p.name}</p>
                            <p className="text-[11px] text-[#8c4a5a] font-medium">{p.brand}</p>
                          </div>
                          <span className="text-sm font-bold text-[#2d2d2d]">{p.price.toLocaleString("sr-RS")} <span className="text-[10px] font-semibold text-[#999]">RSD</span></span>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-10">
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-2xl border border-[#e8e2d9] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[13px] font-bold text-[#2d2d2d] uppercase tracking-widest">Filteri</h2>
                <button onClick={clearAllTags} className="text-[12px] text-[#8c4a5a] hover:underline font-medium">Resetuj</button>
              </div>
              {filterSidebar}
            </div>
          </aside>

          {/* MAIN */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileFilter(true)} className="lg:hidden flex items-center gap-2 bg-white border border-[#e8e2d9] px-4 py-2.5 rounded-xl text-sm font-medium hover:border-[#ccc] transition-colors shadow-sm">
                  <SlidersHorizontal className="w-4 h-4 text-[#999]" /> Filteri
                </button>

                {/* Grid / List toggle */}
                <div className="hidden sm:flex items-center bg-white border border-[#e8e2d9] rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setGridView(true)}
                    className={`p-2.5 transition-all ${gridView ? "bg-[#2d2d2d] text-white" : "text-[#999] hover:text-[#2d2d2d] hover:bg-[#faf7f3]"}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGridView(false)}
                    className={`p-2.5 transition-all ${!gridView ? "bg-[#2d2d2d] text-white" : "text-[#999] hover:text-[#2d2d2d] hover:bg-[#faf7f3]"}`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <SortSelect value={sortBy} onChange={setSortBy} />
            </div>

            {/* Active filter tags */}
            {activeTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {activeTags.map((tag) => (
                  <button
                    key={tag.key}
                    onClick={() => removeTag(tag.key)}
                    className="group flex items-center gap-1.5 bg-white text-[#2d2d2d] pl-3.5 pr-2.5 py-2 rounded-xl text-[12px] font-medium border border-[#e8e2d9] hover:border-[#8c4a5a] hover:text-[#8c4a5a] transition-all shadow-sm"
                  >
                    {tag.label}
                    <X className="w-3.5 h-3.5 text-[#ccc] group-hover:text-[#8c4a5a] transition-colors" />
                  </button>
                ))}
                <button onClick={clearAllTags} className="text-[12px] text-[#999] hover:text-[#8c4a5a] font-medium ml-1 transition-colors">
                  Obriši sve
                </button>
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#e0d8cc] border-t-[#8c4a5a] rounded-full animate-spin" />
              </div>
            )}

            {/* Product grid */}
            {!loading && (
              <div className={gridView ? "grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5" : "space-y-3"}>
                {products.map((p) => gridView ? (
                  <ProductCard key={p.id} product={p} isWishlisted={wishlistedSet.has(p.id)} />
                ) : (
                  <Link key={p.id} href={`/products/${p.slug}`} className="flex bg-white rounded-2xl border border-transparent hover:border-[#e8e2d9] hover:shadow-sm transition-all overflow-hidden group">
                    <div className="w-36 h-36 bg-[#faf7f3] flex-shrink-0 relative overflow-hidden">
                      <img src={p.image || PLACEHOLDER_IMG} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {p.isProfessional && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-[#2d2d2d]/80 text-white backdrop-blur-sm">PRO</span>
                      )}
                      {getBadge(p) && (
                        <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded-lg ${
                          getBadge(p) === "NOVO" ? "bg-[#8c4a5a]" : getBadge(p) === "HIT" ? "bg-[#2d2d2d]" : "bg-[#b5453a]"
                        } text-white`}>{getBadge(p)}</span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <span className="text-[11px] text-[#8c4a5a] font-semibold tracking-widest uppercase">{p.brand?.name ?? ""}</span>
                      <h3 className="text-sm font-medium text-[#2d2d2d] mt-1">{p.name}</h3>
                      <div className="flex items-center gap-0.5 mt-2">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(p.rating) ? "fill-[#c4883a] text-[#c4883a]" : "text-[#e0d8cc]"}`} />)}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        {p.oldPrice && <span className="text-xs text-[#999] line-through">{p.oldPrice.toLocaleString("sr-RS")} RSD</span>}
                        <span className="text-[15px] font-bold text-[#2d2d2d]">{p.price.toLocaleString("sr-RS")} <span className="text-xs font-semibold text-[#999]">RSD</span></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg text-[#999]">Nema pronađenih proizvoda</p>
                <p className="text-sm text-[#bbb] mt-2">Pokušajte da promenite filtere ili pretražite ponovo.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-14">
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                      currentPage === p
                        ? "bg-[#2d2d2d] text-white shadow-sm"
                        : "bg-white text-[#6b6b6b] hover:bg-[#faf7f3] border border-[#e8e2d9]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {currentPage < totalPages && (
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-[#e8e2d9] hover:bg-[#faf7f3] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-[#999]" />
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setMobileFilter(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-[320px] bg-white z-50 overflow-y-auto animate-slideInLeft flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#f0ebe3] flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#8c4a5a]" />
                <h3 className="text-[13px] font-bold uppercase tracking-widest text-[#2d2d2d]">Filteri</h3>
              </div>
              <button onClick={() => setMobileFilter(false)} className="w-8 h-8 rounded-lg hover:bg-[#f5f0e8] flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-[#999]" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">{filterSidebar}</div>
            <div className="p-5 border-t border-[#f0ebe3] flex-shrink-0 flex gap-3">
              <button onClick={() => { clearAllTags(); setMobileFilter(false); }} className="flex-1 border border-[#e8e2d9] text-[#2d2d2d] py-3 rounded-xl font-medium text-sm transition-colors hover:bg-[#faf7f3]">
                Resetuj
              </button>
              <button onClick={() => setMobileFilter(false)} className="flex-1 bg-[#2d2d2d] hover:bg-[#2d2d2d] text-white py-3 rounded-xl font-medium text-sm transition-colors">
                Primeni
              </button>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
