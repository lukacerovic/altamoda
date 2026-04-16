"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, ShoppingCart, X, Search, Grid3X3, LayoutGrid,
  Clock, Filter,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BrandLine {
  slug: string;
  name: string;
  brand: string;
  count: number;
}

interface ColorItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  shadeCode: string;
  hexValue: string;
  level: number;
  undertoneCode: string;
  undertoneName: string;
  price: number;
  brand: { name: string; slug: string } | null;
  productLine: { name: string; slug: string } | null;
  image: string | null;
}

const ALL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const UNDERTONES = [
  { key: "N", label: "Natural", labelSr: "Prirodna" },
  { key: "A", label: "Ash", labelSr: "Pepeljasta" },
  { key: "G", label: "Gold", labelSr: "Zlatna" },
  { key: "C", label: "Copper", labelSr: "Bakar" },
  { key: "R", label: "Red", labelSr: "Crvena" },
  { key: "V", label: "Violet", labelSr: "Ljubičasta" },
  { key: "M", label: "Matte", labelSr: "Mat" },
  { key: "B", label: "Brown", labelSr: "Braon" },
];

const LEVEL_NAMES: Record<number, { sr: string; en: string }> = {
  1: { sr: "Crna", en: "Black" },
  2: { sr: "Veoma tamno braon", en: "Very Dark Brown" },
  3: { sr: "Tamno braon", en: "Dark Brown" },
  4: { sr: "Srednje braon", en: "Medium Brown" },
  5: { sr: "Svetlo braon", en: "Light Brown" },
  6: { sr: "Tamno plava", en: "Dark Blonde" },
  7: { sr: "Srednje plava", en: "Medium Blonde" },
  8: { sr: "Svetlo plava", en: "Light Blonde" },
  9: { sr: "Veoma svetlo plava", en: "Very Light Blonde" },
  10: { sr: "Ekstra svetla plava", en: "Extra Light Blonde" },
};

type ViewMode = "grid" | "matrix";

interface Props {
  initialBrandLines: BrandLine[];
  initialColors: ColorItem[];
  initialTotal: number;
}

export default function ColorsPageClient({ initialBrandLines, initialColors, initialTotal }: Props) {
  const { t, language } = useLanguage();

  const [brandLines] = useState<BrandLine[]>(initialBrandLines);
  const [activeBrand, setActiveBrand] = useState(initialBrandLines[0]?.slug || "");
  const [colors, setColors] = useState<ColorItem[]>(initialColors);
  const [, setTotal] = useState(initialTotal);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterUndertone, setFilterUndertone] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<ColorItem[]>([]);

  // Load recently viewed from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentColors");
      if (stored) setRecentlyViewed(JSON.parse(stored));
    } catch {}
  }, []);

  // Save to recently viewed
  function addToRecentlyViewed(color: ColorItem) {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((c) => c.id !== color.id);
      const updated = [color, ...filtered].slice(0, 10);
      try { localStorage.setItem("recentColors", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  // Fetch colors when brand tab or filters change
  useEffect(() => {
    async function fetchColors() {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeBrand) params.set("brandLine", activeBrand);
      if (filterLevel) params.set("level", String(filterLevel));
      if (filterUndertone) params.set("undertone", filterUndertone);

      try {
        const res = await fetch(`/api/products/colors?${params}`);
        const data = await res.json();
        if (data.success) {
          const flat: ColorItem[] = [];
          for (const level of Object.keys(data.data.colors)) {
            for (const ut of Object.keys(data.data.colors[level])) {
              flat.push(...data.data.colors[level][ut]);
            }
          }
          setColors(flat);
          setTotal(data.data.total);
        }
      } catch (err) {
        console.error("Failed to fetch colors:", err);
      }
      setLoading(false);
    }

    fetchColors();
  }, [activeBrand, filterLevel, filterUndertone]);

  // Client-side search filtering
  const displayColors = useMemo(() => {
    if (!searchQuery) return colors;
    const q = searchQuery.toLowerCase();
    return colors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shadeCode.toLowerCase().includes(q) ||
        c.undertoneName.toLowerCase().includes(q)
    );
  }, [colors, searchQuery]);

  // Build matrix from displayed colors
  const matrixData = useMemo(() => {
    const levels = new Set<number>();
    const undertones = new Set<string>();
    const map: Record<string, ColorItem[]> = {};

    for (const c of displayColors) {
      levels.add(c.level);
      undertones.add(c.undertoneCode);
      const key = `${c.level}-${c.undertoneCode}`;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }

    return {
      levels: Array.from(levels).sort((a, b) => a - b),
      undertones: Array.from(undertones).sort(),
      map,
    };
  }, [displayColors]);

  const getLevelName = (level: number) => {
    const names = LEVEL_NAMES[level];
    if (!names) return `${t("colors.level")} ${level}`;
    return language === "en" ? names.en : names.sr;
  };

  const getUndertoneName = (key: string) => {
    const ut = UNDERTONES.find((u) => u.key === key);
    if (!ut) return key;
    return language === "en" ? ut.label : ut.labelSr;
  };

  const hasActiveFilters = filterLevel || filterUndertone || searchQuery;

  function handleSelectColor(color: ColorItem) {
    setSelectedColor(color);
    addToRecentlyViewed(color);
  }

  return (
    <div className="min-h-screen bg-[#FFFBF4]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#a5a995] mb-6">
          <Link href="/" className="hover:text-secondary">{t("nav.home") || "Početna"}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#11120D]">{t("colors.title")}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#11120D] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
            {t("colors.title")}
          </h1>
          <p className="text-[#a5a995]">{t("colors.subtitle")}</p>
        </div>

        {/* Brand line tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {brandLines.map((b) => (
            <button
              key={b.slug}
              onClick={() => { setActiveBrand(b.slug); setSelectedColor(null); }}
              className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeBrand === b.slug
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-[#a5a995] border border-[#D8CFBC] hover:border-black"
              }`}
            >
              {b.name} <span className="text-xs opacity-70">({b.count})</span>
            </button>
          ))}
        </div>

        {/* Search + Filters bar */}
        <div className="bg-white rounded-sm shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a5a995]" />
              <input
                type="text"
                placeholder={t("colors.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FFFBF4] border border-transparent rounded-sm text-sm focus:border-black focus:bg-white transition-all"
              />
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-2 bg-[#FFFBF4] rounded-sm text-sm text-[#a5a995]"
            >
              <Filter size={16} /> {t("colors.filters")}
            </button>

            {/* Desktop filters */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Level filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#a5a995] uppercase">{t("colors.lightLevel")}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setFilterLevel(null)}
                    className={`px-2 h-7 rounded text-xs font-medium transition-colors ${
                      !filterLevel ? "bg-black text-white" : "bg-[#FFFBF4] text-[#a5a995] hover:bg-[#D8CFBC]"
                    }`}
                  >
                    {t("colors.all")}
                  </button>
                  {ALL_LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => setFilterLevel(filterLevel === l ? null : l)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                        filterLevel === l ? "bg-black text-white" : "bg-[#FFFBF4] text-[#a5a995] hover:bg-[#D8CFBC]"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Undertone filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#a5a995] uppercase">{t("colors.undertone")}</span>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setFilterUndertone(null)}
                    className={`px-2 h-7 rounded text-xs font-medium transition-colors ${
                      !filterUndertone ? "bg-black text-white" : "bg-[#FFFBF4] text-[#a5a995] hover:bg-[#D8CFBC]"
                    }`}
                  >
                    {t("colors.all")}
                  </button>
                  {UNDERTONES.map((ut) => (
                    <button
                      key={ut.key}
                      onClick={() => setFilterUndertone(filterUndertone === ut.key ? null : ut.key)}
                      className={`px-2 h-7 rounded text-xs font-medium transition-colors ${
                        filterUndertone === ut.key ? "bg-black text-white" : "bg-[#FFFBF4] text-[#a5a995] hover:bg-[#D8CFBC]"
                      }`}
                    >
                      {language === "en" ? ut.label : ut.labelSr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* View mode toggle */}
            <div className="flex border border-[#D8CFBC] rounded-sm overflow-hidden">
              <button
                onClick={() => setViewMode("matrix")}
                className={`p-2 ${viewMode === "matrix" ? "bg-black text-white" : "bg-white text-[#a5a995] hover:bg-[#FFFBF4]"}`}
                title={t("colors.matrixView")}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-black text-white" : "bg-white text-[#a5a995] hover:bg-[#FFFBF4]"}`}
                title={t("colors.gridView")}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setFilterLevel(null); setFilterUndertone(null); setSearchQuery(""); }}
                className="text-xs text-secondary hover:text-[#11120D] font-medium flex items-center gap-1"
              >
                <X size={14} /> {t("colors.clearFilters")}
              </button>
            )}
          </div>

          {/* Mobile filters expanded */}
          {showMobileFilters && (
            <div className="sm:hidden mt-4 pt-4 border-t border-[#D8CFBC] space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#a5a995] uppercase mb-2 block">{t("colors.lightLevel")}</span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setFilterLevel(null)}
                    className={`w-8 h-8 rounded text-xs font-medium ${!filterLevel ? "bg-black text-white" : "bg-[#FFFBF4] text-[#a5a995]"}`}
                  >
                    {t("colors.all")}
                  </button>
                  {ALL_LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => setFilterLevel(filterLevel === l ? null : l)}
                      className={`w-8 h-8 rounded text-xs font-medium ${filterLevel === l ? "bg-black text-white" : "bg-[#FFFBF4] text-[#a5a995]"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#a5a995] uppercase mb-2 block">{t("colors.undertone")}</span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setFilterUndertone(null)}
                    className={`px-3 h-8 rounded text-xs font-medium ${!filterUndertone ? "bg-black text-white" : "bg-[#FFFBF4] text-[#a5a995]"}`}
                  >
                    {t("colors.all")}
                  </button>
                  {UNDERTONES.map((ut) => (
                    <button
                      key={ut.key}
                      onClick={() => setFilterUndertone(filterUndertone === ut.key ? null : ut.key)}
                      className={`px-3 h-8 rounded text-xs font-medium ${filterUndertone === ut.key ? "bg-black text-white" : "bg-[#FFFBF4] text-[#a5a995]"}`}
                    >
                      {language === "en" ? ut.label : ut.labelSr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#a5a995]">
            {loading ? t("colors.loading") : `${displayColors.length} ${t("colors.shades")}`}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && !hasActiveFilters && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-[#a5a995]" />
                  <span className="text-xs font-semibold text-[#a5a995] uppercase tracking-wider">{t("colors.recentlyViewed")}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {recentlyViewed.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectColor(c)}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-sm border border-[#D8CFBC] hover:border-black transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      <div className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.hexValue }} />
                      <span className="text-xs font-medium text-[#a5a995]">{c.shadeCode}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matrix View */}
            {viewMode === "matrix" && (
              <div className="bg-white rounded-sm shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#FFFBF4]/50">
                        <th className="sticky left-0 z-10 bg-[#FFFBF4]/80 backdrop-blur-sm px-4 py-3 text-left text-xs font-semibold text-[#a5a995] uppercase w-44">
                          {t("colors.lightLevel")}
                        </th>
                        {matrixData.undertones.map((ut) => (
                          <th key={ut} className="px-3 py-3 text-center text-xs font-semibold text-[#a5a995] uppercase min-w-[72px]">
                            {getUndertoneName(ut)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.levels.map((level) => (
                        <tr key={level} className="border-t border-[#D8CFBC] hover:bg-[#FFFBF4]/50 transition-colors">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FFFBF4] flex items-center justify-center text-sm font-bold text-[#11120D]">
                                {level}
                              </div>
                              <span className="text-xs text-[#a5a995] hidden sm:block">{getLevelName(level)}</span>
                            </div>
                          </td>
                          {matrixData.undertones.map((ut) => {
                            const cellColors = matrixData.map[`${level}-${ut}`] || [];
                            return (
                              <td key={ut} className="px-3 py-3 text-center">
                                {cellColors.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 justify-center">
                                    {cellColors.map((c) => (
                                      <button
                                        key={c.id}
                                        onClick={() => handleSelectColor(c)}
                                        className="group relative"
                                      >
                                        <div
                                          className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 cursor-pointer ${
                                            selectedColor?.id === c.id
                                              ? "border-black ring-2 ring-[#11120D]/30 scale-110"
                                              : "border-white shadow-sm hover:border-black"
                                          }`}
                                          style={{ backgroundColor: c.hexValue }}
                                        />
                                        <span className="text-[9px] text-[#a5a995] block mt-0.5 font-medium">{c.shadeCode}</span>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                          {c.name}
                                          <br />
                                          <span className="text-secondary">{c.price.toLocaleString("sr-RS")} RSD</span>
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45 -mt-1" />
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[#D8CFBC] text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {displayColors.length === 0 && !loading && (
                  <div className="p-12 text-center">
                    <p className="text-[#a5a995]">{t("colors.noColors")}</p>
                  </div>
                )}
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <>
                {displayColors.length === 0 && !loading ? (
                  <div className="bg-white rounded-sm p-12 text-center">
                    <p className="text-[#a5a995]">{t("colors.noColors")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                    {displayColors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleSelectColor(color)}
                        className={`group relative flex flex-col items-center gap-1 ${
                          selectedColor?.id === color.id ? "scale-110" : ""
                        } transition-transform`}
                      >
                        <div
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all hover:scale-110 ${
                            selectedColor?.id === color.id
                              ? "border-black ring-2 ring-[#11120D]/30"
                              : "border-white shadow-sm hover:border-black"
                          }`}
                          style={{ backgroundColor: color.hexValue }}
                        />
                        <span className="text-[10px] text-[#a5a995] font-medium">{color.shadeCode}</span>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {color.name}
                          <br />
                          <span className="text-secondary">{color.price.toLocaleString("sr-RS")} RSD</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45 -mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Selected color detail panel */}
          {selectedColor && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-sm shadow-sm p-6 sticky top-24">
                <button
                  onClick={() => setSelectedColor(null)}
                  className="absolute top-3 right-3 text-[#a5a995] hover:text-[#a5a995]"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-20 h-20 rounded-full mx-auto mb-4 shadow-lg border-4 border-white" style={{ backgroundColor: selectedColor.hexValue }} />

                <div className="text-center mb-4">
                  <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                    {selectedColor.productLine?.name || selectedColor.brand?.name}
                  </span>
                  <h3 className="text-lg font-bold text-[#11120D] mt-1">{selectedColor.shadeCode}</h3>
                  <p className="text-sm text-[#a5a995]">{selectedColor.name}</p>
                </div>

                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between py-1.5 border-b border-[#D8CFBC]">
                    <span className="text-[#a5a995]">{t("colors.level")}</span>
                    <span className="font-medium">{selectedColor.level} — {getLevelName(selectedColor.level)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#D8CFBC]">
                    <span className="text-[#a5a995]">{t("colors.undertone")}</span>
                    <span className="font-medium">{selectedColor.undertoneName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#D8CFBC]">
                    <span className="text-[#a5a995]">{t("colors.price")}</span>
                    <span className="font-bold text-[#11120D]">{selectedColor.price.toLocaleString("sr-RS")} RSD</span>
                  </div>
                </div>

                <Link
                  href={`/products/${selectedColor.slug}`}
                  className="block w-full bg-black hover:bg-[#11120D] text-white py-3 rounded-sm font-medium transition-colors text-center mb-2"
                >
                  {t("colors.viewProduct")}
                </Link>
                <button className="w-full border border-black text-secondary hover:bg-black hover:text-white py-3 rounded-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> {t("colors.addToCart")}
                </button>

                {/* Quick navigation: adjacent shades */}
                <div className="mt-6 pt-4 border-t border-[#D8CFBC]">
                  <p className="text-xs font-semibold text-[#a5a995] uppercase tracking-wider mb-3">{t("colors.similarShades")}</p>
                  <div className="flex flex-wrap gap-2">
                    {displayColors
                      .filter(
                        (c) =>
                          c.id !== selectedColor.id &&
                          (c.level === selectedColor.level || c.undertoneCode === selectedColor.undertoneCode) &&
                          Math.abs(c.level - selectedColor.level) <= 2
                      )
                      .slice(0, 8)
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectColor(c)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-[#FFFBF4] rounded-full hover:bg-[#D8CFBC] transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.hexValue }} />
                          <span className="text-[10px] font-medium text-[#a5a995]">{c.shadeCode}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile selected color bottom sheet */}
        {selectedColor && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50 p-6 border-t border-[#D8CFBC]">
            <button
              onClick={() => setSelectedColor(null)}
              className="absolute top-3 right-3 text-[#a5a995] hover:text-[#a5a995]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full shadow-lg border-4 border-white flex-shrink-0" style={{ backgroundColor: selectedColor.hexValue }} />
              <div>
                <span className="text-xs text-secondary font-medium uppercase">{selectedColor.productLine?.name}</span>
                <h3 className="text-lg font-bold text-[#11120D]">{selectedColor.shadeCode}</h3>
                <p className="text-sm text-[#a5a995]">{selectedColor.name}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-[#a5a995]">{t("colors.level")} {selectedColor.level} · {selectedColor.undertoneName}</p>
                <p className="text-lg font-bold text-[#11120D]">{selectedColor.price.toLocaleString("sr-RS")} RSD</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/products/${selectedColor.slug}`}
                className="flex-1 bg-black hover:bg-[#11120D] text-white py-3 rounded-sm font-medium text-center transition-colors"
              >
                {t("colors.viewProduct")}
              </Link>
              <button className="flex-1 border border-black text-secondary py-3 rounded-sm font-medium flex items-center justify-center gap-2 transition-colors">
                <ShoppingCart className="w-4 h-4" /> {t("colors.addToCart")}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
