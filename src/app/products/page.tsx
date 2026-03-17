"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search, ShoppingBag, Heart, User, Menu, X, Star, SlidersHorizontal,
  ChevronDown, ChevronRight, Grid3X3, LayoutList, Sparkles,
  Instagram, Facebook, Youtube, Mail, MapPin, Phone, Clock, Shield,
} from "lucide-react";

const navLinks = [
  { name: "Boje", href: "/colors" }, { name: "Nega", href: "/products" },
  { name: "Styling", href: "/products" }, { name: "Aparati", href: "/products" },
  { name: "Brendovi", href: "/products" }, { name: "Akcije", href: "/outlet" },
  { name: "Blog", href: "/blog" }, { name: "Seminari", href: "/seminars" },
];

const brandsFilter = ["L'Oreal", "Schwarzkopf", "Wella", "Kerastase", "Olaplex", "Moroccanoil", "Matrix", "Revlon"];
const hairTypes = ["Normalna", "Suva", "Masna", "Farbana", "Ostecena", "Kovrdžava"];

const categoryTree = [
  {
    name: "Kolor", children: [
      { name: "Boje za kosu", children: [{ name: "Permanentne" }, { name: "Bez amonijaka" }] },
      { name: "Oksidanti", children: [] },
      { name: "Dekoloranti", children: [] },
    ],
  },
  {
    name: "Nega", children: [
      { name: "Samponi", children: [] },
      { name: "Maske", children: [] },
      { name: "Regeneratori", children: [] },
    ],
  },
  { name: "Styling", children: [] },
  { name: "Aparati", children: [] },
];

const toggleFilters = [
  { key: "sulfate_free", label: "Bez sulfata" },
  { key: "paraben_free", label: "Bez parabena" },
  { key: "ammonia_free", label: "Bez amonijaka" },
  { key: "professional", label: "Profesionalna upotreba" },
  { key: "vegan", label: "Veganski proizvod" },
  { key: "new", label: "Noviteti" },
  { key: "on_sale", label: "Na akciji" },
];

const productImgs = [
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

const products = [
  { id: 1, brand: "L'Oreal", name: "Majirel 7.0 Srednje Plava", oldPrice: 1290, price: 890, badge: "-31%", rating: 5, image: productImgs[0], professional: true },
  { id: 2, brand: "Schwarzkopf", name: "Igora Royal 6.1 Pepeljasta", oldPrice: 1350, price: 950, badge: "-30%", rating: 4, image: productImgs[1], professional: true },
  { id: 3, brand: "Kerastase", name: "Elixir Ultime Serum 100ml", oldPrice: 4500, price: 3200, badge: "-29%", rating: 5, image: productImgs[2], professional: false },
  { id: 4, brand: "Olaplex", name: "No.3 Hair Perfector 100ml", oldPrice: 3800, price: 2850, badge: "-25%", rating: 5, image: productImgs[3], professional: true },
  { id: 5, brand: "Moroccanoil", name: "Treatment Original 100ml", price: 4200, rating: 4, image: productImgs[4], professional: false },
  { id: 6, brand: "Wella", name: "Koleston Perfect 8/0", oldPrice: 1100, price: 780, badge: "-29%", rating: 4, image: productImgs[5], professional: true },
  { id: 7, brand: "L'Oreal", name: "Metal Detox Šampon 300ml", price: 2400, badge: "NOVO", rating: 5, image: productImgs[6], professional: false },
  { id: 8, brand: "Schwarzkopf", name: "BlondMe Bond Maska 200ml", price: 3100, badge: "NOVO", rating: 4, image: productImgs[7], professional: true },
  { id: 9, brand: "Kerastase", name: "Genesis Serum Anti-Chute", price: 5200, rating: 5, image: productImgs[8], professional: false },
  { id: 10, brand: "Wella", name: "Ultimate Repair Šampon 250ml", price: 2800, rating: 4, image: productImgs[9], professional: false },
  { id: 11, brand: "Olaplex", name: "No.4 Bond Šampon 250ml", price: 3600, badge: "HIT", rating: 5, image: productImgs[10], professional: true },
  { id: 12, brand: "Matrix", name: "Total Results Šampon 300ml", price: 1800, rating: 4, image: productImgs[11], professional: false },
];

const searchSuggestions = {
  products: [
    { name: "Majirel 7.0 Srednje Plava", brand: "L'Oreal", image: productImgs[0], price: 890 },
    { name: "Igora Royal 6.1 Pepeljasta", brand: "Schwarzkopf", image: productImgs[1], price: 950 },
    { name: "Elixir Ultime Serum 100ml", brand: "Kerastase", image: productImgs[2], price: 3200 },
  ],
  categories: ["Boje za kosu", "Samponi za farbanu kosu"],
  brands: ["L'Oreal Professionnel"],
};

function ProductCard({ product }: { product: typeof products[0] }) {
  const [liked, setLiked] = useState(false);
  return (
    <Link href={`/products/${product.id}`} className="product-card bg-white rounded-lg shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-[#f5f0e8]">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.badge && (
            <span className={`px-2 py-1 text-xs font-semibold rounded ${product.badge === "NOVO" ? "bg-[#c8a96e] text-white" : product.badge === "HIT" ? "bg-[#1a1a1a] text-[#c8a96e]" : "bg-[#c0392b] text-white"}`}>{product.badge}</span>
          )}
          {product.professional && (
            <span className="px-2 py-1 text-xs font-semibold rounded bg-[#1a1a1a] text-white">B2B</span>
          )}
        </div>
        <button onClick={(e) => { e.preventDefault(); setLiked(!liked); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors z-10">
          <Heart className={`w-4 h-4 ${liked ? "fill-[#c0392b] text-[#c0392b]" : "text-gray-400"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => e.preventDefault()} className="w-full bg-[#c8a96e] hover:bg-[#a8894e] text-white text-sm font-medium py-2 rounded transition-colors">Dodaj u korpu</button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-[#c8a96e] font-medium uppercase tracking-wider">{product.brand}</span>
        <h3 className="text-sm font-medium text-[#1a1a1a] mt-1 line-clamp-2 flex-1">{product.name}</h3>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < product.rating ? "fill-[#c8a96e] text-[#c8a96e]" : "text-gray-200"}`} />)}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {product.oldPrice && <span className="text-sm text-gray-400 line-through">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
          <span className="text-base font-bold text-[#1a1a1a]">{product.price.toLocaleString("sr-RS")} RSD</span>
        </div>
      </div>
    </Link>
  );
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-semibold text-[#1a1a1a]">
        {title} <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function CategoryTreeItem({ item, depth = 0 }: { item: typeof categoryTree[0]; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full text-sm py-1.5 hover:text-[#c8a96e] transition-colors ${depth === 0 ? "font-medium text-[#1a1a1a]" : "text-gray-600"}`}
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {hasChildren && (
          <ChevronRight className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`} />
        )}
        {!hasChildren && <span className="w-3.5" />}
        {item.name}
      </button>
      {expanded && hasChildren && (
        <div>
          {item.children!.map((child) => (
            <CategoryTreeItem key={child.name} item={child as typeof categoryTree[0]} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [gridView, setGridView] = useState(true);
  const [mobileFilter, setMobileFilter] = useState(false);
  const [activeTags, setActiveTags] = useState(["L'Oreal", "Bez sulfata"]);
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeToggles, setActiveToggles] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFilter = (key: string) => {
    setActiveToggles((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const filterSidebar = (
    <div className="space-y-0">
      {/* Category Tree */}
      <FilterSection title="Kategorije">
        <div className="space-y-0.5">
          {categoryTree.map((cat) => (
            <CategoryTreeItem key={cat.name} item={cat} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brend">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brandsFilter.map((b) => (
            <label key={b} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#1a1a1a]">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#c8a96e] focus:ring-[#c8a96e]" defaultChecked={activeTags.includes(b)} />
              {b}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Cena (RSD)" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Od" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
          <span className="text-gray-400">-</span>
          <input type="number" placeholder="Do" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
        </div>
        <button className="mt-2 w-full bg-[#c8a96e] hover:bg-[#a8894e] text-white text-sm py-2 rounded transition-colors">Primeni</button>
      </FilterSection>

      <FilterSection title="Tip kose" defaultOpen={false}>
        <div className="space-y-2">
          {hairTypes.map((h) => (
            <label key={h} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#1a1a1a]">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#c8a96e] focus:ring-[#c8a96e]" /> {h}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Osobine">
        <div className="space-y-2">
          {toggleFilters.map((f) => (
            <label key={f.key} className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-gray-600 group-hover:text-[#1a1a1a]">{f.label}</span>
              <button
                onClick={(e) => { e.preventDefault(); toggleFilter(f.key); }}
                className={`relative w-10 h-5 rounded-full transition-colors ${activeToggles.includes(f.key) ? "bg-[#c8a96e]" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${activeToggles.includes(f.key) ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* HEADER */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="block"><img src="/logo.png" alt="Alta Moda" className="h-8" /></Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => <Link key={l.name} href={l.href} className="text-xs uppercase tracking-wide text-[#1a1a1a] hover:text-[#c8a96e] transition-colors font-medium">{l.name}</Link>)}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/wishlist" className="hidden sm:block"><Heart className="w-5 h-5 text-[#1a1a1a]" /></Link>
            <Link href="/account" className="hidden sm:block"><User className="w-5 h-5 text-[#1a1a1a]" /></Link>
            <Link href="/cart" className="relative"><ShoppingBag className="w-5 h-5 text-[#1a1a1a]" /><span className="absolute -top-2 -right-2 w-4 h-4 bg-[#c8a96e] text-white text-[10px] rounded-full flex items-center justify-center">2</span></Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#c8a96e]">Pocetna</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1a1a1a]">Svi Proizvodi</span>
        </nav>

        {/* Smart Search */}
        <div className="mb-6 relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(e.target.value.length > 0); }}
              onFocus={() => searchQuery.length > 0 && setShowSearch(true)}
              placeholder="Pretrazite po sifri proizvoda, nazivu ili brendu..."
              className="w-full border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-sm focus:border-[#c8a96e] focus:outline-none"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showSearch && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-100 mt-1 z-40 overflow-hidden">
              {/* Product suggestions */}
              <div className="p-3">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Proizvodi</span>
                <div className="mt-2 space-y-2">
                  {searchSuggestions.products.map((p) => (
                    <Link key={p.name} href="/products/1" className="flex items-center gap-3 p-2 rounded hover:bg-[#faf7f2] transition-colors">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">{p.name}</p>
                        <p className="text-xs text-[#c8a96e]">{p.brand}</p>
                      </div>
                      <span className="text-sm font-bold text-[#1a1a1a]">{p.price.toLocaleString("sr-RS")} RSD</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 p-3">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Kategorije</span>
                <div className="mt-2 space-y-1">
                  {searchSuggestions.categories.map((c) => (
                    <Link key={c} href="/products" className="block text-sm text-gray-600 hover:text-[#c8a96e] p-1.5 rounded hover:bg-[#faf7f2] transition-colors">
                      {c}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 p-3">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Brendovi</span>
                <div className="mt-2 space-y-1">
                  {searchSuggestions.brands.map((b) => (
                    <Link key={b} href="/products" className="block text-sm text-gray-600 hover:text-[#c8a96e] p-1.5 rounded hover:bg-[#faf7f2] transition-colors">
                      {b}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 p-3 text-center">
                <span className="text-xs text-gray-400">Pretrazite po sifri proizvoda</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* SIDEBAR - Desktop (sticky) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Filteri</h2>
              {filterSidebar}
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <button onClick={() => setMobileFilter(true)} className="lg:hidden flex items-center gap-2 border border-gray-200 px-4 py-2 rounded text-sm font-medium hover:border-[#c8a96e] transition-colors">
                <SlidersHorizontal className="w-4 h-4" /> Filteri
              </button>
              <span className="text-sm text-gray-500 hidden sm:block">Prikazano 12 od 342 proizvoda</span>
              <div className="flex items-center gap-3">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-200 rounded px-3 py-2 text-sm focus:border-[#c8a96e]">
                  <option value="popular">Najpopularnije</option>
                  <option value="price-asc">Cena: Najniza</option>
                  <option value="price-desc">Cena: Najvisa</option>
                  <option value="newest">Najnovije</option>
                  <option value="rating">Najbolje ocenjeno</option>
                </select>
                <div className="hidden sm:flex items-center border border-gray-200 rounded overflow-hidden">
                  <button onClick={() => setGridView(true)} className={`p-2 ${gridView ? "bg-[#c8a96e] text-white" : "text-gray-400 hover:text-[#1a1a1a]"}`}><Grid3X3 className="w-4 h-4" /></button>
                  <button onClick={() => setGridView(false)} className={`p-2 ${!gridView ? "bg-[#c8a96e] text-white" : "text-gray-400 hover:text-[#1a1a1a]"}`}><LayoutList className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {/* Active filter tags */}
            {activeTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs text-gray-500">Aktivni filteri:</span>
                {activeTags.map((tag) => (
                  <button key={tag} onClick={() => setActiveTags(activeTags.filter((t) => t !== tag))} className="flex items-center gap-1 bg-[#faf7f2] text-[#c8a96e] px-3 py-1 rounded-full text-xs font-medium hover:bg-[#c8a96e] hover:text-white transition-colors">
                    {tag} <X className="w-3 h-3" />
                  </button>
                ))}
                <button onClick={() => setActiveTags([])} className="text-xs text-gray-400 hover:text-[#c0392b] underline">Obrisi sve</button>
              </div>
            )}

            {/* Product grid */}
            <div className={gridView ? "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" : "space-y-4"}>
              {products.map((p) => gridView ? (
                <ProductCard key={p.id} product={p} />
              ) : (
                <Link key={p.id} href={`/products/${p.id}`} className="flex bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#f5f0e8] to-[#e8e0d0] flex items-center justify-center flex-shrink-0 relative">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    {p.professional && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#1a1a1a] text-white">B2B</span>
                    )}
                  </div>
                  <div className="p-4 flex-1">
                    <span className="text-xs text-[#c8a96e] font-medium uppercase tracking-wider">{p.brand}</span>
                    <h3 className="text-sm font-medium text-[#1a1a1a] mt-1">{p.name}</h3>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < p.rating ? "fill-[#c8a96e] text-[#c8a96e]" : "text-gray-200"}`} />)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {p.oldPrice && <span className="text-sm text-gray-400 line-through">{p.oldPrice.toLocaleString("sr-RS")} RSD</span>}
                      <span className="font-bold text-[#1a1a1a]">{p.price.toLocaleString("sr-RS")} RSD</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-12">
              {[1, 2, 3, 4, 5].map((p) => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`w-10 h-10 rounded flex items-center justify-center text-sm font-medium transition-colors ${currentPage === p ? "bg-[#c8a96e] text-white" : "bg-white text-[#1a1a1a] hover:bg-[#faf7f2] border border-gray-200"}`}>{p}</button>
              ))}
              <button className="w-10 h-10 rounded flex items-center justify-center bg-white border border-gray-200 hover:bg-[#faf7f2] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilter && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMobileFilter(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-xl overflow-y-auto animate-slideInLeft">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Filteri</h3>
              <button onClick={() => setMobileFilter(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">{filterSidebar}</div>
            <div className="p-4 border-t">
              <button onClick={() => setMobileFilter(false)} className="w-full bg-[#c8a96e] hover:bg-[#a8894e] text-white py-3 rounded font-medium transition-colors">Primeni Filtere</button>
            </div>
          </div>
        </>
      )}

      {/* FOOTER */}
      <footer className="bg-[#111] text-white/70 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <img src="/logo.png" alt="Alta Moda" className="h-6 brightness-0 invert mb-4" />
              <p className="text-sm leading-relaxed">Vas pouzdani partner za profesionalnu frizersku opremu i kozmetiku.</p>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c8a96e] transition-colors"><Instagram className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c8a96e] transition-colors"><Facebook className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c8a96e] transition-colors"><Youtube className="w-4 h-4" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Kupovina</h4>
              <div className="space-y-2 text-sm">
                <Link href="/products" className="block hover:text-[#c8a96e]">Svi Proizvodi</Link>
                <Link href="/colors" className="block hover:text-[#c8a96e]">Boje za Kosu</Link>
                <Link href="/outlet" className="block hover:text-[#c8a96e]">Akcije</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Informacije</h4>
              <div className="space-y-2 text-sm">
                <Link href="/faq" className="block hover:text-[#c8a96e]">Cesta Pitanja</Link>
                <Link href="/blog" className="block hover:text-[#c8a96e]">Blog</Link>
                <Link href="/seminars" className="block hover:text-[#c8a96e]">Seminari</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Kontakt</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#c8a96e]" /><span>Knez Mihailova 22, Beograd</span></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#c8a96e]" /><span>+381 11 123 4567</span></div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#c8a96e]" /><span>info@altamoda.rs</span></div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs">&copy; 2026 Alta Moda. Sva prava zadrzana.</span>
            <div className="flex items-center gap-4 text-xs">
              <span className="px-3 py-1 bg-white/10 rounded">Visa</span>
              <span className="px-3 py-1 bg-white/10 rounded">Mastercard</span>
              <span className="px-3 py-1 bg-white/10 rounded">PayPal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
