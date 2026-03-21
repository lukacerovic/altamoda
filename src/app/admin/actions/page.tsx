"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Plus, X, Search, Edit3, Trash2, Zap, Tag, Calendar,
  ChevronDown, ChevronRight, Check, Package, Percent,
  Eye, EyeOff, Users, ShoppingBag,
} from "lucide-react";

// ─── Types ───

interface ActionProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  originalPrice: number;
  image: string;
}

interface SaleAction {
  id: number;
  name: string;
  type: "percentage" | "fixed" | "price";
  value: number;
  target: "product" | "category" | "brand" | "all";
  targetLabel: string;
  audience: "all" | "b2b" | "b2c";
  badge: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: ActionProduct[];
}

// ─── Mock Data ───

const allProducts: ActionProduct[] = [
  { id: 1, name: "Serie Expert Gold Quinoa 300ml", brand: "L'Oréal", category: "Nega kose", originalPrice: 2500, image: "" },
  { id: 2, name: "BC Bonacure Peptide Repair 250ml", brand: "Schwarzkopf", category: "Nega kose", originalPrice: 1800, image: "" },
  { id: 3, name: "Elixir Ultime Serum 100ml", brand: "Kérastase", category: "Ulja i serumi", originalPrice: 4200, image: "" },
  { id: 4, name: "Oil Reflections Šampon 250ml", brand: "Wella", category: "Nega kose", originalPrice: 1950, image: "" },
  { id: 5, name: "Moroccanoil Treatment 100ml", brand: "Moroccanoil", category: "Ulja i serumi", originalPrice: 3500, image: "" },
  { id: 6, name: "Igora Royal 60ml - 7.0", brand: "Schwarzkopf", category: "Boje za kosu", originalPrice: 850, image: "" },
  { id: 7, name: "Majirel 50ml - 6.0", brand: "L'Oréal", category: "Boje za kosu", originalPrice: 900, image: "" },
  { id: 8, name: "OSIS+ Dust It", brand: "Schwarzkopf", category: "Styling", originalPrice: 1200, image: "" },
  { id: 9, name: "No.3 Hair Perfector 100ml", brand: "Olaplex", category: "Ulja i serumi", originalPrice: 2850, image: "" },
  { id: 10, name: "Nutritive Bain Satin 250ml", brand: "Kérastase", category: "Nega kose", originalPrice: 3400, image: "" },
  { id: 11, name: "BlondMe Bond Maska 200ml", brand: "Schwarzkopf", category: "Nega kose", originalPrice: 3100, image: "" },
  { id: 12, name: "Mythic Oil Huile 100ml", brand: "L'Oréal", category: "Ulja i serumi", originalPrice: 2800, image: "" },
];

const initialActions: SaleAction[] = [
  {
    id: 1, name: "Prolećna Akcija -20%", type: "percentage", value: 20,
    target: "category", targetLabel: "Nega kose", audience: "all", badge: "AKCIJA -20%",
    startDate: "2026-03-01", endDate: "2026-04-30", isActive: true,
    products: allProducts.filter(p => p.category === "Nega kose"),
  },
  {
    id: 2, name: "Olaplex Vikend", type: "percentage", value: 15,
    target: "brand", targetLabel: "Olaplex", audience: "all", badge: "-15%",
    startDate: "2026-03-20", endDate: "2026-03-22", isActive: true,
    products: allProducts.filter(p => p.brand === "Olaplex"),
  },
  {
    id: 3, name: "B2B Specijal Boje", type: "fixed", value: 200,
    target: "category", targetLabel: "Boje za kosu", audience: "b2b", badge: "-200 RSD",
    startDate: "2026-03-01", endDate: "2026-06-30", isActive: true,
    products: allProducts.filter(p => p.category === "Boje za kosu"),
  },
  {
    id: 4, name: "Kérastase Serum Flash Sale", type: "price", value: 2990,
    target: "product", targetLabel: "Elixir Ultime Serum", audience: "all", badge: "AKCIJA",
    startDate: "2026-04-01", endDate: "2026-04-07", isActive: false,
    products: allProducts.filter(p => p.id === 3),
  },
];

// ─── Component ───

export default function ActionsPage() {
  const { t } = useLanguage();

  const brands = ["L'Oréal", "Schwarzkopf", "Kérastase", "Wella", "Moroccanoil", "Olaplex", "Matrix"];
  const categoriesList = ["Nega kose", "Boje za kosu", "Styling", "Ulja i serumi", "Aparati"];
  const badgeOptions = ["AKCIJA", "-10%", "-15%", "-20%", "-25%", "-30%", "NOVO", "RASPRODAJA", "SPECIJALNO"];

  const [actions, setActions] = useState<SaleAction[]>(initialActions);
  const [showPanel, setShowPanel] = useState(false);
  const [editingAction, setEditingAction] = useState<SaleAction | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "scheduled">("all");

  // Form state
  const [form, setForm] = useState({
    name: "",
    type: "percentage" as "percentage" | "fixed" | "price",
    value: "",
    target: "product" as "product" | "category" | "brand" | "all",
    targetValue: "",
    audience: "all" as "all" | "b2b" | "b2c",
    badge: "AKCIJA",
    startDate: "",
    endDate: "",
    selectedProductIds: [] as number[],
  });

  const [productSearch, setProductSearch] = useState("");

  // Stats
  const activeCount = actions.filter(a => a.isActive && new Date(a.endDate) >= new Date()).length;
  const scheduledCount = actions.filter(a => a.isActive && new Date(a.startDate) > new Date()).length;
  const totalProducts = actions.filter(a => a.isActive).reduce((sum, a) => sum + a.products.length, 0);

  // Filter actions
  const filtered = actions.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.targetLabel.toLowerCase().includes(search.toLowerCase());
    const now = new Date();
    const start = new Date(a.startDate);
    const end = new Date(a.endDate);
    if (statusFilter === "active") return matchSearch && a.isActive && start <= now && end >= now;
    if (statusFilter === "inactive") return matchSearch && (!a.isActive || end < now);
    if (statusFilter === "scheduled") return matchSearch && a.isActive && start > now;
    return matchSearch;
  });

  const getStatus = (a: SaleAction) => {
    const now = new Date();
    const start = new Date(a.startDate);
    const end = new Date(a.endDate);
    if (!a.isActive) return { label: t("admin.inactive"), color: "bg-gray-100 text-gray-500" };
    if (end < now) return { label: t("admin.expired"), color: "bg-red-100 text-red-600" };
    if (start > now) return { label: t("admin.scheduled"), color: "bg-blue-100 text-blue-600" };
    return { label: t("admin.active"), color: "bg-emerald-100 text-emerald-700" };
  };

  const calcDiscountedPrice = (original: number) => {
    if (form.type === "percentage") return Math.round(original * (1 - Number(form.value) / 100));
    if (form.type === "fixed") return Math.max(0, original - Number(form.value));
    if (form.type === "price") return Number(form.value);
    return original;
  };

  const openCreate = () => {
    setEditingAction(null);
    setForm({ name: "", type: "percentage", value: "", target: "product", targetValue: "", audience: "all", badge: "AKCIJA", startDate: "", endDate: "", selectedProductIds: [] });
    setProductSearch("");
    setShowPanel(true);
  };

  const openEdit = (action: SaleAction) => {
    setEditingAction(action);
    setForm({
      name: action.name,
      type: action.type,
      value: action.value.toString(),
      target: action.target,
      targetValue: action.targetLabel,
      audience: action.audience,
      badge: action.badge,
      startDate: action.startDate,
      endDate: action.endDate,
      selectedProductIds: action.products.map(p => p.id),
    });
    setProductSearch("");
    setShowPanel(true);
  };

  const handleSave = () => {
    const selectedProducts = allProducts.filter(p => form.selectedProductIds.includes(p.id));
    const newAction: SaleAction = {
      id: editingAction?.id || Math.max(0, ...actions.map(a => a.id)) + 1,
      name: form.name,
      type: form.type,
      value: Number(form.value),
      target: form.target,
      targetLabel: form.target === "all" ? t("admin.allProducts") : form.targetValue,
      audience: form.audience,
      badge: form.badge,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: true,
      products: selectedProducts,
    };
    if (editingAction) {
      setActions(actions.map(a => a.id === editingAction.id ? newAction : a));
    } else {
      setActions([newAction, ...actions]);
    }
    setShowPanel(false);
  };

  const toggleActive = (id: number) => {
    setActions(actions.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const deleteAction = (id: number) => {
    setActions(actions.filter(a => a.id !== id));
  };

  // Auto-select products based on target
  const handleTargetChange = (target: string, value: string) => {
    let ids: number[] = [];
    if (target === "all") {
      ids = allProducts.map(p => p.id);
    } else if (target === "brand") {
      ids = allProducts.filter(p => p.brand === value).map(p => p.id);
    } else if (target === "category") {
      ids = allProducts.filter(p => p.category === value).map(p => p.id);
    }
    setForm(f => ({ ...f, target: target as typeof f.target, targetValue: value, selectedProductIds: ids }));
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleProduct = (id: number) => {
    setForm(f => ({
      ...f,
      selectedProductIds: f.selectedProductIds.includes(id)
        ? f.selectedProductIds.filter(pid => pid !== id)
        : [...f.selectedProductIds, id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">{t("admin.actionsAndDiscounts")}</h1>
          <p className="text-sm text-[#666] mt-1">{t("admin.manageActionsDesc")}</p>
        </div>
        <button onClick={openCreate} className="btn-gold px-5 py-2.5 rounded-sm text-sm flex items-center gap-2 self-start">
          <Plus size={18} /> {t("admin.newAction")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-sm border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-stone-50 flex items-center justify-center"><Zap size={20} className="text-secondary" /></div>
            <div>
              <p className="text-xs text-[#999]">{t("admin.totalActions")}</p>
              <p className="text-xl font-bold text-black">{actions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-sm border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-emerald-50 flex items-center justify-center"><Check size={20} className="text-emerald-600" /></div>
            <div>
              <p className="text-xs text-[#999]">{t("admin.activeActions")}</p>
              <p className="text-xl font-bold text-black">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-sm border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-blue-50 flex items-center justify-center"><Calendar size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-xs text-[#999]">{t("admin.scheduledActions")}</p>
              <p className="text-xl font-bold text-black">{scheduledCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-sm border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-purple-50 flex items-center justify-center"><Package size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-xs text-[#999]">{t("admin.productsOnSale")}</p>
              <p className="text-xl font-bold text-black">{totalProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-sm border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t("admin.searchActions")} className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "active", "scheduled", "inactive"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 sm:px-4 py-2 rounded-sm text-sm font-medium transition-colors ${statusFilter === s ? "bg-black text-white" : "bg-stone-100 text-[#666] hover:bg-[#c4c7c7]"}`}>
                {s === "all" ? t("admin.all") : s === "active" ? t("admin.active") : s === "scheduled" ? t("admin.scheduled") : t("admin.inactive")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {filtered.map(action => {
          const status = getStatus(action);
          return (
            <div key={action.id} className="bg-white rounded-sm border border-stone-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-black truncate">{action.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    {action.badge && (
                      <span className="px-2 py-0.5 rounded bg-black text-white text-xs font-bold">{action.badge}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#666]">
                    <span className="flex items-center gap-1">
                      {action.type === "percentage" && <><Percent size={14} /> {action.value}% {t("admin.discount")}</>}
                      {action.type === "fixed" && <><Tag size={14} /> -{action.value} RSD</>}
                      {action.type === "price" && <><Tag size={14} /> {t("admin.fixedPrice")} {action.value} RSD</>}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag size={14} />
                      {action.target === "all" ? t("admin.allProducts") : action.target === "brand" ? `${t("admin.brandTarget")} ${action.targetLabel}` : action.target === "category" ? `${t("admin.categoryTarget")} ${action.targetLabel}` : action.targetLabel}
                    </span>
                    <span className="flex items-center gap-1"><Package size={14} /> {action.products.length} {t("admin.productsCount")}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> {action.startDate} → {action.endDate}</span>
                    {action.audience !== "all" && (
                      <span className="flex items-center gap-1"><Users size={14} /> {action.audience === "b2b" ? t("admin.b2bOnly") : t("admin.b2cOnly")}</span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(action.id)} className={`p-2 rounded-sm transition-colors ${action.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-50"}`} title={action.isActive ? t("admin.deactivate") : t("admin.activate")}>
                    {action.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button onClick={() => openEdit(action)} className="p-2 text-[#999] hover:text-secondary hover:bg-black/10 rounded-sm transition-colors">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => deleteAction(action.id)} className="p-2 text-[#999] hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Products preview */}
              {action.products.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
                  <div className="flex flex-wrap gap-2">
                    {action.products.slice(0, 5).map(p => {
                      const discounted = action.type === "percentage"
                        ? Math.round(p.originalPrice * (1 - action.value / 100))
                        : action.type === "fixed"
                          ? Math.max(0, p.originalPrice - action.value)
                          : action.value;
                      return (
                        <div key={p.id} className="flex items-center gap-2 bg-stone-100 rounded-sm px-3 py-2">
                          <div className="w-8 h-8 bg-white rounded flex items-center justify-center"><Package size={14} className="text-[#999]" /></div>
                          <div>
                            <p className="text-xs font-medium text-black truncate max-w-[150px]">{p.name}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-secondary">{discounted.toLocaleString()} RSD</span>
                              <span className="text-[10px] text-[#999] line-through">{p.originalPrice.toLocaleString()} RSD</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {action.products.length > 5 && (
                      <div className="flex items-center px-3 py-2 text-xs text-secondary font-medium">
                        +{action.products.length - 5} više
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-sm border border-stone-200 p-12 text-center">
            <Zap size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">{t("admin.noActions")}</h3>
            <p className="text-sm text-[#666] mb-4">{t("admin.createActionDesc")}</p>
            <button onClick={openCreate} className="btn-gold px-5 py-2.5 rounded-sm text-sm">{t("admin.newAction")}</button>
          </div>
        )}
      </div>

      {/* ═══════════ CREATE / EDIT PANEL ═══════════ */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPanel(false)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slideInRight">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-serif font-bold text-black">
                {editingAction ? t("admin.editAction") : t("admin.newAction")}
              </h2>
              <button onClick={() => setShowPanel(false)} className="p-1 text-[#999] hover:text-black"><X size={20} /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.actionName")}</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm" placeholder="npr. Prolećna Akcija -20%" />
              </div>

              {/* Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.discountType")}</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as typeof form.type })} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm">
                    <option value="percentage">{t("admin.percentage")}</option>
                    <option value="fixed">{t("admin.fixedAmount")}</option>
                    <option value="price">{t("admin.newFixedPrice")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    {form.type === "percentage" ? t("admin.percentDiscount") : form.type === "fixed" ? t("admin.amountDiscount") : t("admin.newPrice")}
                  </label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm" placeholder="0" />
                </div>
              </div>

              {/* Target & Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.applyTo")}</label>
                  <select value={form.target} onChange={e => handleTargetChange(e.target.value, "")} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm">
                    <option value="product">{t("admin.individualProducts")}</option>
                    <option value="category">{t("admin.entireCategory")}</option>
                    <option value="brand">{t("admin.entireBrand")}</option>
                    <option value="all">{t("admin.allProductsTarget")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.targetAudience")}</label>
                  <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value as typeof form.audience })} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm">
                    <option value="all">{t("admin.allUsers")}</option>
                    <option value="b2b">{t("admin.b2bOnlySalons")}</option>
                    <option value="b2c">{t("admin.b2cOnlyBuyers")}</option>
                  </select>
                </div>
              </div>

              {/* Target Value (brand or category select) */}
              {form.target === "brand" && (
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.selectBrand")}</label>
                  <select value={form.targetValue} onChange={e => handleTargetChange("brand", e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm">
                    <option value="">{t("admin.selectOption")}</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
              {form.target === "category" && (
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.selectCategory")}</label>
                  <select value={form.targetValue} onChange={e => handleTargetChange("category", e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm">
                    <option value="">{t("admin.selectOption")}</option>
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {/* Badge & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.badge")}</label>
                  <select value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm">
                    {badgeOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.startDate")}</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.endDate")}</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm" />
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-[#333]">
                    {`${t("admin.productsSelected")} (${form.selectedProductIds.length})`}
                  </label>
                  {form.target !== "product" && (
                    <span className="text-xs text-secondary">{t("admin.autoSelectedByScope")}</span>
                  )}
                </div>
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder={t("admin.searchProductsList")} className="w-full pl-9 pr-4 py-2 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black" />
                </div>
                <div className="max-h-64 overflow-y-auto border border-stone-200 rounded-sm divide-y divide-[#f0f0f0]">
                  {filteredProducts.map(p => {
                    const selected = form.selectedProductIds.includes(p.id);
                    const discounted = calcDiscountedPrice(p.originalPrice);
                    return (
                      <label key={p.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors ${selected ? "bg-stone-50" : ""}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-black border-black" : "border-gray-300"}`}>
                          {selected && <Check size={12} className="text-white" />}
                        </div>
                        <input type="checkbox" checked={selected} onChange={() => toggleProduct(p.id)} className="sr-only" />
                        <div className="w-8 h-8 bg-stone-100 rounded flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-[#999]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-black truncate">{p.name}</p>
                          <p className="text-xs text-[#999]">{p.brand} · {p.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {form.value && Number(form.value) > 0 ? (
                            <>
                              <p className="text-sm font-bold text-secondary">{discounted.toLocaleString()} RSD</p>
                              <p className="text-[10px] text-[#999] line-through">{p.originalPrice.toLocaleString()} RSD</p>
                            </>
                          ) : (
                            <p className="text-sm text-black">{p.originalPrice.toLocaleString()} RSD</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              {form.value && Number(form.value) > 0 && form.selectedProductIds.length > 0 && (
                <div className="bg-stone-50 rounded-sm p-4">
                  <h4 className="text-sm font-semibold text-black mb-3 flex items-center gap-2"><Eye size={16} /> {t("admin.actionPreview")}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allProducts.filter(p => form.selectedProductIds.includes(p.id)).slice(0, 4).map(p => {
                      const discounted = calcDiscountedPrice(p.originalPrice);
                      const pct = Math.round((1 - discounted / p.originalPrice) * 100);
                      return (
                        <div key={p.id} className="bg-white rounded-sm p-3 relative">
                          {pct > 0 && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black text-white text-[10px] font-bold rounded">-{pct}%</span>
                          )}
                          <div className="w-full h-16 bg-stone-100 rounded mb-2 flex items-center justify-center">
                            <Package size={20} className="text-[#ccc]" />
                          </div>
                          <p className="text-xs text-black truncate">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-bold text-secondary">{discounted.toLocaleString()} RSD</span>
                            <span className="text-[10px] text-[#999] line-through">{p.originalPrice.toLocaleString()} RSD</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowPanel(false)} className="px-5 py-2.5 rounded-sm text-sm font-medium text-[#666] hover:bg-stone-100 transition-colors">{t("admin.cancel")}</button>
              <button onClick={handleSave} disabled={!form.name || !form.value || form.selectedProductIds.length === 0} className="btn-gold px-5 py-2.5 rounded-sm text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                {editingAction ? t("admin.saveChanges") : t("admin.createAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
