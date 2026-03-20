"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Filter,
  Palette,
  Eye,
  Package,
  ChevronDown,
  AlertTriangle,
  Copy,
  Grid3X3,
  List,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/* ───────────────────────── Types ───────────────────────── */

interface ColorItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  slug: string;
  shadeCode: string;
  hexValue: string;
  level: number;
  undertoneCode: string;
  undertoneName: string;
  priceB2c: number;
  priceB2b: number | null;
  stock: number;
  isActive: boolean;
  brand: { id: string; name: string; slug: string } | null;
  productLine: { id: string; name: string; slug: string } | null;
  category: { id: string; nameLat: string; slug: string } | null;
  image: string | null;
}

interface BrandLine {
  id: string;
  slug: string;
  name: string;
  brand: string;
  count: number;
}

type ViewMode = "matrix" | "list";

/* ───────────────────────── Constants ───────────────────────── */

const ALL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const UNDERTONE_MAP: Record<string, { label: string; labelEn: string }> = {
  N: { label: "Prirodna", labelEn: "Natural" },
  A: { label: "Pepeljasta", labelEn: "Ash" },
  G: { label: "Zlatna", labelEn: "Gold" },
  C: { label: "Bakar", labelEn: "Copper" },
  R: { label: "Crvena", labelEn: "Red" },
  V: { label: "Ljubičasta", labelEn: "Violet" },
  M: { label: "Mat", labelEn: "Matte" },
  B: { label: "Braon", labelEn: "Brown" },
  I: { label: "Intenzivna", labelEn: "Intense" },
  W: { label: "Topla", labelEn: "Warm" },
};

/* ───────────────────────── Component ───────────────────────── */

export default function AdminColorsPage() {
  const { t } = useLanguage();

  const [allColors, setAllColors] = useState<ColorItem[]>([]);
  const [brandLines, setBrandLines] = useState<BrandLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBrandLine, setActiveBrandLine] = useState<string | null>(null);

  // Fetch real color data from API
  const fetchColors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeBrandLine) params.set("brandLine", activeBrandLine);

      const res = await fetch(`/api/admin/colors?${params}`);
      const json = await res.json();
      if (json.success) {
        // Flatten the matrix into a flat array
        const flat: ColorItem[] = [];
        const matrix = json.data.matrix;
        for (const level of Object.keys(matrix)) {
          for (const ut of Object.keys(matrix[level])) {
            for (const c of matrix[level][ut]) {
              flat.push(c);
            }
          }
        }
        setAllColors(flat);
        setBrandLines(json.data.brandLines || []);
      }
    } catch (err) {
      console.error("Failed to fetch colors:", err);
    }
    setLoading(false);
  }, [activeBrandLine]);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterUndertone, setFilterUndertone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [, setEditingColor] = useState<ColorItem | null>(null);

  // Form state for add/edit
  const [formLevel, setFormLevel] = useState(1);
  const [formUndertoneCode, setFormUndertoneCode] = useState("N");
  const [, setFormUndertoneName] = useState("Prirodna");
  const [formHex, setFormHex] = useState("#888888");
  const [formShadeCode, setFormShadeCode] = useState("");

  // Filtered colors
  const filteredColors = useMemo(() => {
    return allColors.filter((c) => {
      if (activeBrandLine && c.productLine?.slug !== activeBrandLine) return false;
      if (filterLevel && c.level !== filterLevel) return false;
      if (filterUndertone && c.undertoneCode !== filterUndertone) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.shadeCode.toLowerCase().includes(q) &&
          !c.sku.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [allColors, activeBrandLine, filterLevel, filterUndertone, searchQuery]);

  // Build matrix from filtered
  const matrixData = useMemo(() => {
    const levels = new Set<number>();
    const undertones = new Set<string>();
    const map: Record<string, ColorItem[]> = {};

    for (const c of filteredColors) {
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
  }, [filteredColors]);

  // Stats
  const totalColors = allColors.length;
  const activeBrands = new Set(allColors.map((c) => c.brand?.name)).size;
  const lowStockColors = allColors.filter((c) => c.stock < 10).length;

  function openEditModal(color: ColorItem) {
    setEditingColor(color);
    setFormLevel(color.level);
    setFormUndertoneCode(color.undertoneCode);
    setFormUndertoneName(color.undertoneName);
    setFormHex(color.hexValue);
    setFormShadeCode(color.shadeCode);
    setShowEditModal(true);
  }

  function resetForm() {
    setFormLevel(1);
    setFormUndertoneCode("N");
    setFormUndertoneName("Prirodna");
    setFormHex("#888888");
    setFormShadeCode("");
  }

  const clearFilters = () => {
    setActiveBrandLine(null);
    setFilterLevel(null);
    setFilterUndertone(null);
    setSearchQuery("");
  };

  const hasActiveFilters = activeBrandLine || filterLevel || filterUndertone || searchQuery;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">{t("admin.colorManagement")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("admin.colorManagementDesc")}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 bg-black hover:bg-stone-800 text-white px-5 py-2.5 rounded-sm text-sm font-medium transition-colors"
        >
          <Plus size={18} /> {t("admin.addColor")}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: t("admin.totalColors"), value: totalColors, icon: Palette, color: "text-secondary" },
          { label: t("admin.brandLines"), value: brandLines.length, icon: Package, color: "text-blue-600" },
          { label: t("admin.activeBrands"), value: activeBrands, icon: Grid3X3, color: "text-green-600" },
          { label: t("admin.lowStockColors"), value: lowStockColors, icon: AlertTriangle, color: "text-orange-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-sm p-4 border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-black">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
              <stat.icon className={`${stat.color} opacity-40`} size={28} />
            </div>
          </div>
        ))}
      </div>

      {/* Brand line tabs */}
      <div className="bg-white rounded-sm border border-stone-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.colorLine")}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveBrandLine(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeBrandLine ? "bg-black text-white" : "bg-stone-100 text-gray-600 hover:bg-stone-200"
            }`}
          >
            {t("admin.all")} ({totalColors})
          </button>
          {brandLines.map((bl) => (
            <button
              key={bl.slug}
              onClick={() => setActiveBrandLine(activeBrandLine === bl.slug ? null : bl.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeBrandLine === bl.slug ? "bg-black text-white" : "bg-stone-100 text-gray-600 hover:bg-stone-200"
              }`}
            >
              {bl.name} <span className="text-xs opacity-70">({bl.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters & controls */}
      <div className="bg-white rounded-sm border border-stone-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("admin.searchColors")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-100 border border-transparent rounded-sm text-sm focus:border-black focus:bg-white transition-all"
            />
          </div>

          {/* Level filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">{t("admin.colorLevel")}</span>
            <div className="flex gap-1">
              {ALL_LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setFilterLevel(filterLevel === l ? null : l)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    filterLevel === l ? "bg-black text-white" : "bg-stone-100 text-gray-600 hover:bg-stone-200"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Undertone filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">{t("admin.undertone")}</span>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(UNDERTONE_MAP).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFilterUndertone(filterUndertone === key ? null : key)}
                  className={`px-2 h-7 rounded text-xs font-medium transition-colors ${
                    filterUndertone === key ? "bg-black text-white" : "bg-stone-100 text-gray-600 hover:bg-stone-200"
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* View toggle */}
          <div className="flex border border-stone-200 rounded-sm overflow-hidden">
            <button
              onClick={() => setViewMode("matrix")}
              className={`p-2 ${viewMode === "matrix" ? "bg-black text-white" : "bg-white text-gray-500 hover:bg-stone-100"}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-black text-white" : "bg-white text-gray-500 hover:bg-stone-100"}`}
            >
              <List size={16} />
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-secondary hover:text-black font-medium flex items-center gap-1"
            >
              <X size={14} /> {t("admin.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? "Učitavanje..." : `${filteredColors.length} ${t("admin.colorsShown")}`}
          {hasActiveFilters && ` (${t("admin.filtered")})`}
        </p>
      </div>

      {/* Matrix View */}
      {viewMode === "matrix" && (
        <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-100">
                  <th className="sticky left-0 z-10 bg-stone-100 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">
                    {t("admin.level")}
                  </th>
                  {matrixData.undertones.map((ut) => (
                    <th key={ut} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase min-w-[80px]">
                      {UNDERTONE_MAP[ut]?.label || ut}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.levels.map((level) => (
                  <tr key={level} className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-black text-center">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm font-bold mx-auto">
                        {level}
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
                                  onClick={() => setSelectedColor(selectedColor?.id === c.id ? null : c)}
                                  className="group relative"
                                  title={`${c.shadeCode} - ${c.name}`}
                                >
                                  <div
                                    className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 cursor-pointer ${
                                      selectedColor?.id === c.id
                                        ? "border-black ring-2 ring-black/30 scale-110"
                                        : "border-white shadow-sm hover:border-black"
                                    } ${!c.isActive ? "opacity-40" : ""}`}
                                    style={{ backgroundColor: c.hexValue }}
                                  />
                                  <span className="text-[9px] text-gray-400 block mt-0.5">{c.shadeCode}</span>
                                  {c.stock < 10 && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border border-white" />
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t("admin.color")}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t("admin.shadeCode")}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t("admin.level")}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t("admin.undertone")}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t("admin.colorLine")}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">{t("admin.priceB2c")}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">{t("admin.stock")}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">{t("admin.status")}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredColors.map((c) => (
                <tr key={c.id} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: c.hexValue }}
                      />
                      <span className="text-sm font-medium text-black">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{c.shadeCode}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-stone-100 text-xs font-bold">{c.level}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.undertoneName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.productLine?.name || "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{c.sku}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{c.priceB2c.toLocaleString("sr-RS")} RSD</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={c.stock < 10 ? "text-orange-500 font-medium" : "text-gray-600"}>{c.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        c.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {c.isActive ? t("admin.active") : t("admin.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-gray-400 hover:text-secondary hover:bg-stone-100 rounded transition-colors"
                        title={t("admin.edit")}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title={t("admin.delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredColors.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <Palette size={40} className="mx-auto mb-3 opacity-30" />
              <p>{t("admin.noColorsFound")}</p>
            </div>
          )}
        </div>
      )}

      {/* Selected Color Detail Panel */}
      {selectedColor && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto border-l border-stone-200 animate-slideIn">
          <div className="sticky top-0 bg-white border-b border-stone-200 p-4 flex items-center justify-between">
            <h3 className="font-semibold text-black">{t("admin.colorDetails")}</h3>
            <button onClick={() => setSelectedColor(null)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {/* Color swatch */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg flex-shrink-0"
                style={{ backgroundColor: selectedColor.hexValue }}
              />
              <div>
                <p className="text-xs text-secondary font-semibold uppercase tracking-wider">
                  {selectedColor.productLine?.name}
                </p>
                <h4 className="text-lg font-bold text-black">{selectedColor.shadeCode}</h4>
                <p className="text-sm text-gray-500">{selectedColor.name}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-500">{t("admin.level")}</span>
                <span className="font-medium">{selectedColor.level}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-500">{t("admin.undertone")}</span>
                <span className="font-medium">{selectedColor.undertoneName} ({selectedColor.undertoneCode})</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-500">{t("admin.hexColor")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: selectedColor.hexValue }} />
                  <span className="font-mono text-xs">{selectedColor.hexValue}</span>
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-500">SKU</span>
                <span className="font-mono text-xs">{selectedColor.sku}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-500">{t("admin.brand")}</span>
                <span className="font-medium">{selectedColor.brand?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-500">{t("admin.priceB2c")}</span>
                <span className="font-bold">{selectedColor.priceB2c.toLocaleString("sr-RS")} RSD</span>
              </div>
              {selectedColor.priceB2b && (
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-gray-500">{t("admin.priceB2b")}</span>
                  <span className="font-bold">{selectedColor.priceB2b.toLocaleString("sr-RS")} RSD</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-500">{t("admin.stock")}</span>
                <span className={`font-medium ${selectedColor.stock < 10 ? "text-orange-500" : ""}`}>
                  {selectedColor.stock} {t("admin.items")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-500">{t("admin.status")}</span>
                <span className={`text-xs font-semibold uppercase ${selectedColor.isActive ? "text-green-600" : "text-gray-400"}`}>
                  {selectedColor.isActive ? t("admin.active") : t("admin.inactive")}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => openEditModal(selectedColor)}
                className="w-full flex items-center justify-center gap-2 bg-black hover:bg-stone-800 text-white py-2.5 rounded-sm text-sm font-medium transition-colors"
              >
                <Edit3 size={16} /> {t("admin.editColor")}
              </button>
              <button className="w-full flex items-center justify-center gap-2 border border-stone-200 text-gray-600 hover:bg-stone-100 py-2.5 rounded-sm text-sm font-medium transition-colors">
                <Eye size={16} /> {t("admin.viewProduct")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Color Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-200 p-5 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-black">
                {showEditModal ? t("admin.editColor") : t("admin.addColor")}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingColor(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Color preview */}
              <div className="flex items-center justify-center">
                <div
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                  style={{ backgroundColor: formHex }}
                />
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.colorLevel")}</label>
                <div className="flex gap-1.5">
                  {ALL_LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => setFormLevel(l)}
                      className={`w-9 h-9 rounded-sm text-sm font-medium transition-colors ${
                        formLevel === l ? "bg-black text-white" : "bg-stone-100 text-gray-600 hover:bg-stone-200"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Undertone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.undertone")}</label>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(UNDERTONE_MAP).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => { setFormUndertoneCode(key); setFormUndertoneName(val.label); }}
                      className={`px-3 h-9 rounded-sm text-sm font-medium transition-colors ${
                        formUndertoneCode === key ? "bg-black text-white" : "bg-stone-100 text-gray-600 hover:bg-stone-200"
                      }`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hex color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.hexColor")}</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={formHex}
                    onChange={(e) => setFormHex(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-stone-200"
                  />
                  <input
                    type="text"
                    value={formHex}
                    onChange={(e) => setFormHex(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-stone-200 rounded-sm text-sm font-mono focus:ring-1 focus:ring-black focus:border-black"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Shade code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.shadeCode")}</label>
                <input
                  type="text"
                  value={formShadeCode}
                  onChange={(e) => setFormShadeCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm focus:ring-1 focus:ring-black focus:border-black"
                  placeholder="7.0, 8/1, 6-44..."
                />
                <p className="text-xs text-gray-400 mt-1">{t("admin.shadeCodeHint")}</p>
              </div>

              {/* Product link (for add only) */}
              {showAddModal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.linkToProduct")}</label>
                  <select className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm focus:ring-1 focus:ring-black focus:border-black bg-white">
                    <option value="">{t("admin.selectProduct")}</option>
                    <option value="1">Igora Royal 60ml - 7.0 (SCH-IR-700)</option>
                    <option value="2">Majirel 50ml - 6.0 (LOR-MJ-600)</option>
                    <option value="3">Koleston Perfect 60ml - 8/0 (WEL-KP-800)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-stone-200 p-5 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingColor(null); }}
                className="flex-1 py-2.5 border border-stone-200 rounded-sm text-sm font-medium text-gray-600 hover:bg-stone-100 transition-colors"
              >
                {t("admin.cancel")}
              </button>
              <button className="flex-1 py-2.5 bg-black hover:bg-stone-800 text-white rounded-sm text-sm font-medium transition-colors">
                {showEditModal ? t("admin.saveChanges") : t("admin.addColor")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
