"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search, Heart, Star, SlidersHorizontal,
  ChevronDown, ChevronRight, Grid3X3, LayoutList,
  X, ArrowUpDown,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ─── Data ─── */
const brandsFilter = ["L'Oreal", "Schwarzkopf", "Wella", "Kerastase", "Olaplex", "Moroccanoil", "Matrix", "Revlon"];
const hairTypes = ["Normalna", "Suva", "Masna", "Farbana", "Oštećena", "Kovrdžava"];

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
      { name: "Šamponi", children: [] },
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
  categories: ["Boje za kosu", "Šamponi za farbanu kosu"],
  brands: ["L'Oreal Professionnel"],
};

/* ─── ProductCard ─── */
function ProductCard({ product }: { product: typeof products[0] }) {
  const [liked, setLiked] = useState(false);
  return (
    <Link href={`/products/${product.id}`} className="group bg-white rounded-2xl overflow-hidden border border-transparent hover:border-[#e0d8cc] hover:shadow-sm transition-all flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-[#faf7f3]">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && (
            <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
              product.badge === "NOVO" ? "bg-[#8c4a5a] text-white"
              : product.badge === "HIT" ? "bg-[#2d2d2d] text-white"
              : "bg-[#b5453a] text-white"
            }`}>{product.badge}</span>
          )}
          {product.professional && (
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#2d2d2d]/80 text-white backdrop-blur-sm">PRO</span>
          )}
        </div>
        <button onClick={(e) => { e.preventDefault(); setLiked(!liked); }} className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all z-10 shadow-sm">
          <Heart className={`w-4 h-4 ${liked ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-[#999]"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button onClick={(e) => e.preventDefault()} className="w-full bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
            Dodaj u korpu
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[11px] text-[#8c4a5a] font-semibold tracking-widest uppercase">{product.brand}</span>
        <h3 className="text-sm font-medium text-[#2d2d2d] mt-1.5 line-clamp-2 flex-1 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-0.5 mt-2.5">
          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < product.rating ? "fill-[#c4883a] text-[#c4883a]" : "text-[#e0d8cc]"}`} />)}
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
function CategoryTreeItem({ item, depth = 0 }: { item: typeof categoryTree[0]; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`flex items-center gap-2.5 w-full text-[13px] py-2 rounded-lg hover:bg-[#f5f0e8] px-2 -mx-2 transition-colors ${
          depth === 0 ? "font-medium text-[#2d2d2d]" : "text-[#6b6b6b]"
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren && (
          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 text-[#999] ${expanded ? "rotate-90" : ""}`} />
        )}
        {!hasChildren && <span className="w-3.5 flex-shrink-0" />}
        {item.name}
      </button>
      {expanded && hasChildren && (
        <div className="animate-slideDown">
          {item.children!.map((child) => (
            <CategoryTreeItem key={child.name} item={child as typeof categoryTree[0]} depth={depth + 1} />
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
    { value: "price-asc", label: "Cena: Najniža" },
    { value: "price-desc", label: "Cena: Najviša" },
    { value: "newest", label: "Najnovije" },
    { value: "rating", label: "Najbolje ocenjeno" },
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

/* ─── Main Page ─── */
export default function ProductsPage() {
  const [gridView, setGridView] = useState(true);
  const [mobileFilter, setMobileFilter] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>(["L'Oreal", "Bez sulfata"]);
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
    <div>
      {/* Category Tree */}
      <FilterSection title="Kategorije">
        <div className="space-y-0">
          {categoryTree.map((cat) => (
            <CategoryTreeItem key={cat.name} item={cat} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brend" count={activeTags.filter((t) => brandsFilter.includes(t)).length}>
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          {brandsFilter.map((b) => (
            <label key={b} className="flex items-center gap-3 text-[13px] text-[#6b6b6b] cursor-pointer hover:text-[#2d2d2d] py-1.5 px-2 -mx-2 rounded-lg hover:bg-[#f5f0e8] transition-colors">
              <div className="relative flex items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked={activeTags.includes(b)} />
                <div className="w-[18px] h-[18px] rounded-md border-2 border-[#d5cfc5] peer-checked:border-[#8c4a5a] peer-checked:bg-[#8c4a5a] transition-all flex items-center justify-center">
                  <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              {b}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Cena (RSD)" defaultOpen={false}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input type="number" placeholder="Od" className="w-full border border-[#e8e2d9] rounded-xl px-3.5 py-2.5 text-sm bg-[#faf7f3] focus:bg-white focus:border-[#8c4a5a] focus:outline-none transition-all placeholder-[#bbb]" />
          </div>
          <span className="text-[#ccc] text-sm">—</span>
          <div className="flex-1">
            <input type="number" placeholder="Do" className="w-full border border-[#e8e2d9] rounded-xl px-3.5 py-2.5 text-sm bg-[#faf7f3] focus:bg-white focus:border-[#8c4a5a] focus:outline-none transition-all placeholder-[#bbb]" />
          </div>
        </div>
        <button className="mt-3 w-full bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white text-sm py-2.5 rounded-xl font-medium transition-colors">
          Primeni
        </button>
      </FilterSection>

      <FilterSection title="Tip kose" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {hairTypes.map((h) => (
            <button key={h} className="px-3.5 py-2 text-[12px] font-medium border border-[#e8e2d9] rounded-xl text-[#6b6b6b] hover:border-[#8c4a5a] hover:text-[#8c4a5a] hover:bg-[#fdf5f7] transition-all">
              {h}
            </button>
          ))}
        </div>
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

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Svi Proizvodi
              </h1>
              <p className="text-sm text-[#999] mt-2">342 proizvoda</p>
            </div>

            {/* Search */}
            <div className="hidden md:block flex-1 max-w-md ml-8" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(e.target.value.length > 0); }}
                  onFocus={() => searchQuery.length > 0 && setShowSearch(true)}
                  placeholder="Pretražite proizvode..."
                  className="w-full border border-[#e8e2d9] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#8c4a5a] focus:outline-none bg-[#faf7f3] focus:bg-white transition-all placeholder-[#bbb]"
                />
              </div>

              {/* Autocomplete */}
              {showSearch && (
                <div className="absolute mt-1.5 bg-white rounded-xl border border-[#e8e2d9] shadow-xl z-40 w-full max-w-md overflow-hidden animate-slideDown">
                  <div className="p-3">
                    <span className="text-[11px] text-[#999] font-semibold tracking-widest uppercase">Proizvodi</span>
                    <div className="mt-2 space-y-1">
                      {searchSuggestions.products.map((p) => (
                        <Link key={p.name} href="/products/1" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#faf7f3] transition-colors">
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2d2d2d] truncate">{p.name}</p>
                            <p className="text-[11px] text-[#8c4a5a] font-medium">{p.brand}</p>
                          </div>
                          <span className="text-sm font-bold text-[#2d2d2d]">{p.price.toLocaleString("sr-RS")} <span className="text-[10px] font-semibold text-[#999]">RSD</span></span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-[#f0ebe3] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#999] font-semibold tracking-widest uppercase">Kategorije:</span>
                      {searchSuggestions.categories.map((c) => (
                        <Link key={c} href="/products" className="text-[12px] text-[#6b6b6b] hover:text-[#8c4a5a] transition-colors px-2 py-1 rounded-lg hover:bg-[#faf7f3]">
                          {c}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-10">
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-2xl border border-[#e8e2d9] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[13px] font-bold text-[#2d2d2d] uppercase tracking-widest">Filteri</h2>
                <button className="text-[12px] text-[#8c4a5a] hover:underline font-medium">Resetuj</button>
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
                    key={tag}
                    onClick={() => setActiveTags(activeTags.filter((t) => t !== tag))}
                    className="group flex items-center gap-1.5 bg-white text-[#2d2d2d] pl-3.5 pr-2.5 py-2 rounded-xl text-[12px] font-medium border border-[#e8e2d9] hover:border-[#8c4a5a] hover:text-[#8c4a5a] transition-all shadow-sm"
                  >
                    {tag}
                    <X className="w-3.5 h-3.5 text-[#ccc] group-hover:text-[#8c4a5a] transition-colors" />
                  </button>
                ))}
                <button onClick={() => setActiveTags([])} className="text-[12px] text-[#999] hover:text-[#8c4a5a] font-medium ml-1 transition-colors">
                  Obriši sve
                </button>
              </div>
            )}

            {/* Product grid */}
            <div className={gridView ? "grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5" : "space-y-3"}>
              {products.map((p) => gridView ? (
                <ProductCard key={p.id} product={p} />
              ) : (
                <Link key={p.id} href={`/products/${p.id}`} className="flex bg-white rounded-2xl border border-transparent hover:border-[#e8e2d9] hover:shadow-sm transition-all overflow-hidden group">
                  <div className="w-36 h-36 bg-[#faf7f3] flex-shrink-0 relative overflow-hidden">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {p.professional && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-[#2d2d2d]/80 text-white backdrop-blur-sm">PRO</span>
                    )}
                    {p.badge && (
                      <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded-lg ${
                        p.badge === "NOVO" ? "bg-[#8c4a5a]" : p.badge === "HIT" ? "bg-[#2d2d2d]" : "bg-[#b5453a]"
                      } text-white`}>{p.badge}</span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-center">
                    <span className="text-[11px] text-[#8c4a5a] font-semibold tracking-widest uppercase">{p.brand}</span>
                    <h3 className="text-sm font-medium text-[#2d2d2d] mt-1">{p.name}</h3>
                    <div className="flex items-center gap-0.5 mt-2">
                      {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < p.rating ? "fill-[#c4883a] text-[#c4883a]" : "text-[#e0d8cc]"}`} />)}
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      {p.oldPrice && <span className="text-xs text-[#999] line-through">{p.oldPrice.toLocaleString("sr-RS")} RSD</span>}
                      <span className="text-[15px] font-bold text-[#2d2d2d]">{p.price.toLocaleString("sr-RS")} <span className="text-xs font-semibold text-[#999]">RSD</span></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-1.5 mt-14">
              {[1, 2, 3, 4, 5].map((p) => (
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
              <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-[#e8e2d9] hover:bg-[#faf7f3] transition-colors">
                <ChevronRight className="w-4 h-4 text-[#999]" />
              </button>
            </div>
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
              <button onClick={() => setMobileFilter(false)} className="flex-1 border border-[#e8e2d9] text-[#2d2d2d] py-3 rounded-xl font-medium text-sm transition-colors hover:bg-[#faf7f3]">
                Resetuj
              </button>
              <button onClick={() => setMobileFilter(false)} className="flex-1 bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white py-3 rounded-xl font-medium text-sm transition-colors">
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
