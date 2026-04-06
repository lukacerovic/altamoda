"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Plus, X, Search, Edit3, Trash2, Zap, Tag, Calendar,
  Check, Package, Percent,
  Eye, EyeOff, Users, ShoppingBag, Filter,
} from "lucide-react";

// ─── Types ───

interface ActionProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  originalPrice: number;
  image: string;
}

interface SaleAction {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "price";
  value: number;
  targetType: "product" | "category" | "brand" | "all";
  targetId: string | null;
  audience: "all" | "b2b" | "b2c";
  badge: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  products: ActionProduct[];
}

interface DBProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; nameLat: string; slug: string } | null;
  priceB2c: number;
  image: string | null;
}

interface BrandOption {
  id: string;
  name: string;
  slug: string;
}

interface CategoryOption {
  id: string;
  nameLat: string;
  slug: string;
}

// ─── Component ───

export default function ActionsPage() {
  const { t } = useLanguage();

  const badgeOptions = ["AKCIJA", "-10%", "-15%", "-20%", "-25%", "-30%", "NOVO", "RASPRODAJA", "SPECIJALNO"];

  const [actions, setActions] = useState<SaleAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editingAction, setEditingAction] = useState<SaleAction | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "scheduled">("all");
  const [saving, setSaving] = useState(false);

  // Products from DB
  const [allProducts, setAllProducts] = useState<DBProduct[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

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
    selectedProductIds: [] as string[],
  });

  const [productSearch, setProductSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Fetch promotions
  const fetchPromotions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promotions");
      const json = await res.json();
      if (json.success) setActions(json.data);
    } catch (err) {
      console.error("Failed to fetch promotions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products, brands, categories
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      // Fetch first page + brands + categories in parallel
      const [firstPageRes, brandsRes, categoriesRes] = await Promise.all([
        fetch("/api/products?limit=100&page=1"),
        fetch("/api/brands"),
        fetch("/api/categories"),
      ]);
      const [firstPageJson, brandsJson, categoriesJson] = await Promise.all([
        firstPageRes.json(),
        brandsRes.json(),
        categoriesRes.json(),
      ]);

      const allProds: DBProduct[] = [];
      const mapProduct = (p: Record<string, unknown>) => ({
        id: p.id as string,
        sku: p.sku as string,
        name: p.name as string,
        slug: p.slug as string,
        brand: p.brand as DBProduct["brand"],
        category: p.category as DBProduct["category"],
        priceB2c: (p.priceB2c ?? p.price) as number,
        image: p.image as string | null,
      });

      if (firstPageJson.success) {
        for (const p of firstPageJson.data.products) allProds.push(mapProduct(p));
        const totalPages = firstPageJson.data.pagination.totalPages;

        // Fetch remaining pages in parallel
        if (totalPages > 1) {
          const pagePromises = [];
          for (let pg = 2; pg <= totalPages; pg++) {
            pagePromises.push(fetch(`/api/products?limit=100&page=${pg}`).then(r => r.json()));
          }
          const results = await Promise.all(pagePromises);
          for (const json of results) {
            if (json.success) {
              for (const p of json.data.products) allProds.push(mapProduct(p));
            }
          }
        }
      }
      setAllProducts(allProds);
      if (brandsJson.success) {
        setBrands(
          (brandsJson.data as BrandOption[]).map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
          }))
        );
      }
      if (categoriesJson.success) {
        const cats: CategoryOption[] = [];
        const extractCats = (items: Record<string, unknown>[]) => {
          for (const item of items) {
            cats.push({ id: item.id as string, nameLat: item.nameLat as string || item.name as string, slug: item.slug as string });
            if (Array.isArray(item.children)) extractCats(item.children as Record<string, unknown>[]);
          }
        };
        extractCats(Array.isArray(categoriesJson.data) ? categoriesJson.data : []);
        setCategories(cats);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, [fetchPromotions, fetchProducts]);

  // Stats helpers — compare as YYYY-MM-DD strings to avoid timezone issues
  const todayStr = new Date().toLocaleDateString("sv-SE"); // "YYYY-MM-DD" format
  const isActiveNow = (a: SaleAction) => {
    if (!a.isActive) return false;
    if (a.endDate && a.endDate < todayStr) return false;
    if (a.startDate && a.startDate > todayStr) return false;
    return true;
  };
  const isScheduled = (a: SaleAction) => a.isActive && !!a.startDate && a.startDate > todayStr;

  const activeCount = actions.filter(isActiveNow).length;
  const scheduledCount = actions.filter(a => isScheduled(a)).length;
  const totalProducts = actions.filter(a => a.isActive).reduce((sum, a) => sum + a.products.length, 0);

  // Filter actions
  const filtered = actions.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "active") return matchSearch && isActiveNow(a);
    if (statusFilter === "inactive") return matchSearch && (!a.isActive || (a.endDate && a.endDate < todayStr));
    if (statusFilter === "scheduled") return matchSearch && isScheduled(a);
    return matchSearch;
  });

  const getStatus = (a: SaleAction) => {
    if (!a.isActive) return { label: t("admin.inactive"), color: "bg-gray-100 text-gray-500" };
    if (a.endDate && a.endDate < todayStr) return { label: t("admin.expired"), color: "bg-red-100 text-red-600" };
    if (a.startDate && a.startDate > todayStr) return { label: t("admin.scheduled"), color: "bg-blue-100 text-blue-600" };
    return { label: t("admin.active"), color: "bg-emerald-100 text-emerald-700" };
  };

  const calcDiscountedPrice = (original: number) => {
    if (form.type === "percentage") return Math.round(original * (1 - Number(form.value) / 100));
    if (form.type === "fixed") return Math.max(0, original - Number(form.value));
    if (form.type === "price") return Number(form.value);
    return original;
  };

  const calcActionPrice = (original: number, action: SaleAction) => {
    if (action.type === "percentage") return Math.round(original * (1 - action.value / 100));
    if (action.type === "fixed") return Math.max(0, original - action.value);
    if (action.type === "price") return action.value;
    return original;
  };

  const openCreate = () => {
    setEditingAction(null);
    setForm({ name: "", type: "percentage", value: "", target: "product", targetValue: "", audience: "all", badge: "AKCIJA", startDate: "", endDate: "", selectedProductIds: [] });
    setProductSearch("");
    setFilterBrand("");
    setFilterCategory("");
    setShowPanel(true);
  };

  const openEdit = (action: SaleAction) => {
    setEditingAction(action);
    setForm({
      name: action.name,
      type: action.type,
      value: action.value.toString(),
      target: action.targetType,
      targetValue: action.targetId || "",
      audience: action.audience,
      badge: action.badge || "AKCIJA",
      startDate: action.startDate || "",
      endDate: action.endDate || "",
      selectedProductIds: action.products.map(p => p.id),
    });
    setProductSearch("");
    setFilterBrand("");
    setFilterCategory("");
    setShowPanel(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        value: Number(form.value),
        targetType: form.target,
        targetId: form.target === "product" || form.target === "all" ? null : form.targetValue,
        audience: form.audience,
        badge: form.badge,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isActive: true,
        productIds: form.selectedProductIds,
      };

      const url = editingAction
        ? `/api/admin/promotions/${editingAction.id}`
        : "/api/admin/promotions";
      const method = editingAction ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        await fetchPromotions();
        setShowPanel(false);
      }
    } catch (err) {
      console.error("Failed to save promotion:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: "PATCH" });
      const json = await res.json();
      if (json.success) {
        setActions(actions.map(a => a.id === id ? { ...a, isActive: json.data.isActive } : a));
      }
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const deleteAction = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setActions(actions.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // Auto-select products based on target
  const handleTargetChange = (target: string, value: string) => {
    let ids: string[] = [];
    if (target === "all") {
      ids = allProducts.map(p => p.id);
    } else if (target === "brand" && value) {
      ids = allProducts.filter(p => p.brand?.id === value).map(p => p.id);
    } else if (target === "category" && value) {
      ids = allProducts.filter(p => p.category?.id === value).map(p => p.id);
    }
    setForm(f => ({ ...f, target: target as typeof f.target, targetValue: value, selectedProductIds: ids }));
  };

  // Filter products by search (name, brand, SKU) + brand/category dropdowns
  const filteredProducts = allProducts.filter(p => {
    const searchLower = productSearch.toLowerCase();
    const matchSearch = !productSearch ||
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      (p.brand?.name || "").toLowerCase().includes(searchLower);
    const matchBrand = !filterBrand || p.brand?.id === filterBrand;
    const matchCategory = !filterCategory || p.category?.id === filterCategory;
    return matchSearch && matchBrand && matchCategory;
  });

  const toggleProduct = (id: string) => {
    setForm(f => ({
      ...f,
      selectedProductIds: f.selectedProductIds.includes(id)
        ? f.selectedProductIds.filter(pid => pid !== id)
        : [...f.selectedProductIds, id],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">{t("admin.actionsAndDiscounts")}</h1>
          <p className="text-sm text-[#666] mt-1">{t("admin.manageActionsDesc")}</p>
        </div>
        <button onClick={openCreate} className="bg-black text-white hover:bg-stone-800 transition-colors px-5 py-2.5 rounded-sm text-sm flex items-center gap-2 self-start">
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
                      {action.targetType === "all" ? t("admin.allProducts") : action.targetType === "brand" ? `${t("admin.brandTarget")} ${action.targetId}` : action.targetType === "category" ? `${t("admin.categoryTarget")} ${action.targetId}` : t("admin.individualProducts")}
                    </span>
                    <span className="flex items-center gap-1"><Package size={14} /> {action.products.length} {t("admin.productsCount")}</span>
                    {(action.startDate || action.endDate) && (
                      <span className="flex items-center gap-1"><Calendar size={14} /> {action.startDate || "∞"} → {action.endDate || "∞"}</span>
                    )}
                    {!action.startDate && !action.endDate && (
                      <span className="flex items-center gap-1"><Calendar size={14} /> Neograničeno</span>
                    )}
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
                      const discounted = calcActionPrice(p.originalPrice, action);
                      return (
                        <div key={p.id} className="flex items-center gap-2 bg-stone-100 rounded-sm px-3 py-2">
                          <div className="w-8 h-8 bg-white rounded flex items-center justify-center overflow-hidden">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={14} className="text-[#999]" />
                            )}
                          </div>
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
            <button onClick={openCreate} className="bg-black text-white hover:bg-stone-800 transition-colors px-5 py-2.5 rounded-sm text-sm">{t("admin.newAction")}</button>
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
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              {form.target === "category" && (
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.selectCategory")}</label>
                  <select value={form.targetValue} onChange={e => handleTargetChange("category", e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm">
                    <option value="">{t("admin.selectOption")}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nameLat}</option>)}
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

                {/* Search + Filters */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder={t("admin.searchProductsList") + " (ime, šifra, brend...)"}
                      className="w-full pl-9 pr-4 py-2 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                      <select
                        value={filterBrand}
                        onChange={e => setFilterBrand(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black appearance-none"
                      >
                        <option value="">Svi brendovi</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                      <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black appearance-none"
                      >
                        <option value="">Sve kategorije</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nameLat}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {productsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-stone-200 rounded-sm divide-y divide-[#f0f0f0]">
                    {filteredProducts.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-[#999]">Nema proizvoda</div>
                    )}
                    {filteredProducts.map(p => {
                      const selected = form.selectedProductIds.includes(p.id);
                      const discounted = calcDiscountedPrice(p.priceB2c);
                      return (
                        <label key={p.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors ${selected ? "bg-stone-50" : ""}`}>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-black border-black" : "border-gray-300"}`}>
                            {selected && <Check size={12} className="text-white" />}
                          </div>
                          <input type="checkbox" checked={selected} onChange={() => toggleProduct(p.id)} className="sr-only" />
                          <div className="w-8 h-8 bg-stone-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={14} className="text-[#999]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-black truncate">{p.name}</p>
                            <p className="text-xs text-[#999]">{p.brand?.name || "—"} · {p.category?.nameLat || "—"} · {p.sku}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {form.value && Number(form.value) > 0 ? (
                              <>
                                <p className="text-sm font-bold text-secondary">{discounted.toLocaleString()} RSD</p>
                                <p className="text-[10px] text-[#999] line-through">{p.priceB2c.toLocaleString()} RSD</p>
                              </>
                            ) : (
                              <p className="text-sm text-black">{p.priceB2c.toLocaleString()} RSD</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Preview */}
              {form.value && Number(form.value) > 0 && form.selectedProductIds.length > 0 && (
                <div className="bg-stone-50 rounded-sm p-4">
                  <h4 className="text-sm font-semibold text-black mb-3 flex items-center gap-2"><Eye size={16} /> {t("admin.actionPreview")}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allProducts.filter(p => form.selectedProductIds.includes(p.id)).slice(0, 4).map(p => {
                      const discounted = calcDiscountedPrice(p.priceB2c);
                      const pct = Math.round((1 - discounted / p.priceB2c) * 100);
                      return (
                        <div key={p.id} className="bg-white rounded-sm p-3 relative">
                          {pct > 0 && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black text-white text-[10px] font-bold rounded">-{pct}%</span>
                          )}
                          <div className="w-full h-16 bg-stone-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={20} className="text-[#ccc]" />
                            )}
                          </div>
                          <p className="text-xs text-black truncate">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-bold text-secondary">{discounted.toLocaleString()} RSD</span>
                            <span className="text-[10px] text-[#999] line-through">{p.priceB2c.toLocaleString()} RSD</span>
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
              <button onClick={handleSave} disabled={saving || !form.name || !form.value || form.selectedProductIds.length === 0} className="bg-black text-white hover:bg-stone-800 transition-colors px-5 py-2.5 rounded-sm text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? "..." : editingAction ? t("admin.saveChanges") : t("admin.createAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
