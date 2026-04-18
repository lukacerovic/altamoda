"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, Upload, Loader2, Save, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { resolveBrandLogo } from "@/lib/brand-logos";
import dynamic from "next/dynamic";

const TiptapEditor = dynamic(() => import("@/components/admin/TiptapEditor"), { ssr: false });

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  content: string | null;
  isActive: boolean;
  _count?: { products: number };
}

interface BrandProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  isActive: boolean;
  image: string | null;
}

interface SearchProduct {
  id: string;
  name: string;
  sku: string;
  brand: string | null;
  price: number;
  image: string | null;
}

export default function AdminBrandsPage() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Brand products management
  const [brandProducts, setBrandProducts] = useState<BrandProduct[]>([]);
  const [loadingBrandProducts, setLoadingBrandProducts] = useState(false);

  // Product picker modal
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerResults, setPickerResults] = useState<SearchProduct[]>([]);
  const [pickerSelection, setPickerSelection] = useState<Set<string>>(new Set());
  const [pickerLoading, setPickerLoading] = useState(false);
  const [attaching, setAttaching] = useState(false);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brands?all=true");
      const json = await res.json();
      if (json.success) setBrands(json.data);
    } catch (err) {
      console.error("Failed to fetch brands:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const selectBrand = async (brand: Brand) => {
    // Fetch full brand data with content
    try {
      const res = await fetch(`/api/brands/${brand.id}`);
      const json = await res.json();
      if (json.success) {
        const full = json.data;
        setSelectedBrand(full);
        setEditName(full.name);
        setEditLogo(full.logoUrl);
        setEditDescription(full.description || "");
        setEditContent(full.content || "");
      }
    } catch (err) {
      console.error("Failed to fetch brand:", err);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      const url = json.data?.url || json.url;
      if (url) setEditLogo(url);
    } catch (err) {
      console.error("Logo upload failed:", err);
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const startCreateBrand = () => {
    setSelectedBrand(null);
    setIsCreating(true);
    setEditName("");
    setEditLogo(null);
    setEditDescription("");
    setEditContent("");
  };

  const handleCreate = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          logoUrl: editLogo,
          description: editDescription,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchBrands();
        setIsCreating(false);
      }
    } catch (err) {
      console.error("Create failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBrand) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          logoUrl: editLogo,
          description: editDescription,
          content: editContent,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Update list
        setBrands((prev) =>
          prev.map((b) => (b.id === selectedBrand.id ? { ...b, name: editName, logoUrl: editLogo } : b))
        );
        setSelectedBrand({ ...selectedBrand, name: editName, logoUrl: editLogo, description: editDescription, content: editContent });
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Load products assigned to a brand
  const fetchBrandProducts = useCallback(async (brandId: string) => {
    setLoadingBrandProducts(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/products`);
      const json = await res.json();
      if (json.success) setBrandProducts(json.data);
    } catch (err) {
      console.error("Failed to fetch brand products:", err);
    } finally {
      setLoadingBrandProducts(false);
    }
  }, []);

  // Load brand products when a brand is selected (not while creating)
  useEffect(() => {
    if (selectedBrand && !isCreating) {
      fetchBrandProducts(selectedBrand.id);
    } else {
      setBrandProducts([]);
    }
  }, [selectedBrand, isCreating, fetchBrandProducts]);

  // Delete brand
  const handleDelete = async () => {
    if (!selectedBrand) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await fetchBrands();
        setSelectedBrand(null);
        setShowDeleteConfirm(false);
      } else {
        console.error("Delete failed:", json.error);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Detach a single product from the brand
  const detachProduct = async (productId: string) => {
    if (!selectedBrand) return;
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [productId] }),
      });
      const json = await res.json();
      if (json.success) {
        setBrandProducts((prev) => prev.filter((p) => p.id !== productId));
        // Update counts in the brand list
        setBrands((prev) =>
          prev.map((b) =>
            b.id === selectedBrand.id
              ? { ...b, _count: { products: (b._count?.products ?? 1) - 1 } }
              : b,
          ),
        );
      }
    } catch (err) {
      console.error("Detach failed:", err);
    }
  };

  // Search products (for picker)
  const runPickerSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setPickerResults([]);
      return;
    }
    setPickerLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(term)}&limit=25`);
      const json = await res.json();
      if (json.success) setPickerResults(json.data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setPickerLoading(false);
    }
  }, []);

  // Debounce picker search
  useEffect(() => {
    if (!showPicker) return;
    const t = setTimeout(() => runPickerSearch(pickerSearch), 250);
    return () => clearTimeout(t);
  }, [pickerSearch, showPicker, runPickerSearch]);

  const togglePickerSelection = (id: string) => {
    setPickerSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openPicker = () => {
    setPickerSearch("");
    setPickerResults([]);
    setPickerSelection(new Set());
    setShowPicker(true);
  };

  // Attach selected products
  const attachSelected = async () => {
    if (!selectedBrand || pickerSelection.size === 0) return;
    setAttaching(true);
    try {
      const productIds = Array.from(pickerSelection);
      const res = await fetch(`/api/brands/${selectedBrand.id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchBrandProducts(selectedBrand.id);
        // Update counts
        setBrands((prev) =>
          prev.map((b) =>
            b.id === selectedBrand.id
              ? { ...b, _count: { products: (b._count?.products ?? 0) + productIds.length } }
              : b,
          ),
        );
        setShowPicker(false);
      }
    } catch (err) {
      console.error("Attach failed:", err);
    } finally {
      setAttaching(false);
    }
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Brand list view
  if (!selectedBrand && !isCreating) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-wide" style={{ fontFamily: "'Noto Serif', serif" }}>
              {t("admin.brands")}
            </h1>
            <p className="text-stone-500 text-sm mt-1">{t("admin.brandsDesc")}</p>
          </div>
          <button
            onClick={startCreateBrand}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj brend
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder={t("admin.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none bg-white"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBrands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => selectBrand(brand)}
                className="bg-white border border-stone-200 rounded-sm p-5 text-left hover:border-black hover:shadow-sm transition-all group"
              >
                <div className="w-full h-20 bg-stone-50 rounded-sm flex items-center justify-center mb-4 overflow-hidden">
                  {(() => { const logo = resolveBrandLogo(brand.slug, brand.logoUrl); return logo ? (
                    <Image src={logo} alt={brand.name} width={80} height={40} className="max-h-full max-w-full object-contain p-2" />
                  ) : (
                    <span className="text-2xl font-bold text-stone-300" style={{ fontFamily: "'Noto Serif', serif" }}>
                      {brand.name.charAt(0)}
                    </span>
                  ); })()}
                </div>
                <h3 className="text-sm font-semibold text-black group-hover:text-secondary transition-colors">
                  {brand.name}
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  {brand._count?.products ?? 0} {t("admin.productsCount")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Brand editor view (edit or create)
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => { setSelectedBrand(null); setIsCreating(false); }}
          className="p-2 hover:bg-stone-100 rounded-sm transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-black tracking-wide" style={{ fontFamily: "'Noto Serif', serif" }}>
            {isCreating ? "Novi brend" : selectedBrand?.name}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">{isCreating ? "Dodaj novi brend" : t("admin.editBrand")}</p>
        </div>
        {!isCreating && selectedBrand && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 border border-red-600 text-red-600 px-4 py-2.5 rounded-sm text-sm font-medium hover:bg-red-600 hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Obriši
          </button>
        )}
        <button
          onClick={isCreating ? handleCreate : handleSave}
          disabled={saving || (isCreating && !editName.trim())}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isCreating ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isCreating ? "Kreiraj brend" : t("admin.save")}
        </button>
      </div>

      <div className="space-y-6">
        {/* Name & Logo */}
        <div className="bg-white border border-stone-200 rounded-sm p-6">
          <h2 className="text-sm font-bold text-black uppercase tracking-widest mb-5">{t("admin.basicInfo")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("admin.brandName")}</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-stone-200 rounded-sm px-4 py-2.5 text-sm focus:border-black focus:outline-none"
              />
            </div>

            {/* Short description */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("admin.shortDescription")}</label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full border border-stone-200 rounded-sm px-4 py-2.5 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">{t("admin.brandLogo")}</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-stone-50 border border-stone-200 rounded-sm flex items-center justify-center overflow-hidden">
                {(() => { const previewLogo = selectedBrand ? resolveBrandLogo(selectedBrand.slug, editLogo) : editLogo; return previewLogo ? (
                  <Image src={previewLogo} alt="Logo" width={80} height={40} className="max-h-full max-w-full object-contain p-2" />
                ) : (
                  <span className="text-3xl font-bold text-stone-300">{editName.charAt(0)}</span>
                ); })()}
              </div>
              <div>
                <label className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-sm text-sm font-medium cursor-pointer hover:border-black transition-colors">
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {t("admin.uploadLogo")}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {editLogo && (
                  <button onClick={() => setEditLogo(null)} className="text-xs text-red-500 hover:underline mt-2">
                    {t("admin.removeLogo")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white border border-stone-200 rounded-sm p-6">
          <h2 className="text-sm font-bold text-black uppercase tracking-widest mb-5">{t("admin.brandContent")}</h2>
          <TiptapEditor content={editContent} onChange={setEditContent} />
        </div>

        {/* Products assignment (only when editing an existing brand) */}
        {!isCreating && selectedBrand && (
          <div className="bg-white border border-stone-200 rounded-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-black uppercase tracking-widest">Proizvodi</h2>
                <p className="text-xs text-stone-500 mt-1">
                  {brandProducts.length} {brandProducts.length === 1 ? "proizvod je" : "proizvoda je"} dodeljen ovom brendu
                </p>
              </div>
              <button
                onClick={openPicker}
                className="flex items-center gap-2 border border-black text-black px-4 py-2 rounded-sm text-sm font-medium hover:bg-black hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj proizvode
              </button>
            </div>

            {loadingBrandProducts ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
              </div>
            ) : brandProducts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-stone-200 rounded-sm">
                <p className="text-sm text-stone-400">Još uvek nema proizvoda u ovom brendu.</p>
                <p className="text-xs text-stone-400 mt-1">Kliknite &quot;Dodaj proizvode&quot; da im dodelite proizvode.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 max-h-[480px] overflow-y-auto">
                {brandProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 py-3">
                    <div className="w-12 h-12 bg-stone-50 rounded-sm flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} width={48} height={48} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-stone-300">—</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black truncate">{p.name}</p>
                      <p className="text-[11px] uppercase tracking-wider text-stone-400 mt-0.5">
                        {p.sku} · {p.price.toLocaleString("sr-RS")} RSD
                        {!p.isActive && <span className="ml-2 text-red-500">neaktivan</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => detachProduct(p.id)}
                      aria-label="Ukloni iz brenda"
                      className="w-8 h-8 rounded-sm flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-sm max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-black mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
              Obriši brend &quot;{selectedBrand.name}&quot;?
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-2">
              Ova akcija se ne može poništiti.
            </p>
            <p className="text-sm text-stone-600 leading-relaxed mb-6">
              {brandProducts.length > 0 ? (
                <>
                  <strong>{brandProducts.length}</strong> {brandProducts.length === 1 ? "proizvod će ostati" : "proizvoda će ostati"}
                  {" "}u katalogu ali bez brenda. Kasnije ih možete dodeliti nekom drugom brendu.
                </>
              ) : (
                "Ovaj brend nema dodeljenih proizvoda."
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-sm transition-colors disabled:opacity-50"
              >
                Otkaži
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-sm text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Brisanje..." : "Obriši brend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product picker modal */}
      {showPicker && selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !attaching && setShowPicker(false)} />
          <div className="relative bg-white rounded-sm max-w-2xl w-full shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-stone-200 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-black" style={{ fontFamily: "'Noto Serif', serif" }}>
                  Dodaj proizvode u &quot;{selectedBrand.name}&quot;
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Pretraži po nazivu ili SKU. Ako proizvod već pripada drugom brendu, biće premešten ovde.
                </p>
              </div>
              <button
                onClick={() => setShowPicker(false)}
                disabled={attaching}
                className="w-8 h-8 rounded-sm hover:bg-stone-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <div className="p-5 border-b border-stone-200 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Pretraži proizvode (min. 2 znaka)…"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {pickerLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                </div>
              ) : pickerSearch.length < 2 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-stone-400">Počni kucati da pretražiš proizvode.</p>
                </div>
              ) : pickerResults.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-stone-400">Nema rezultata za &quot;{pickerSearch}&quot;.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {pickerResults.map((p) => {
                    const checked = pickerSelection.has(p.id);
                    const alreadyInThisBrand = brandProducts.some((bp) => bp.id === p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-4 py-3 cursor-pointer ${alreadyInThisBrand ? "opacity-50" : "hover:bg-stone-50"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={alreadyInThisBrand}
                          onChange={() => togglePickerSelection(p.id)}
                          className="w-4 h-4 accent-black"
                        />
                        <div className="w-12 h-12 bg-stone-50 rounded-sm flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} width={48} height={48} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-xs text-stone-300">—</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-black truncate">{p.name}</p>
                          <p className="text-[11px] uppercase tracking-wider text-stone-400 mt-0.5">
                            {p.sku} · {p.price.toLocaleString("sr-RS")} RSD
                            {p.brand && <span className="ml-2">· trenutno: {p.brand}</span>}
                            {alreadyInThisBrand && <span className="ml-2 text-green-600">· već u ovom brendu</span>}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 p-5 border-t border-stone-200 flex-shrink-0">
              <p className="text-xs text-stone-500">
                {pickerSelection.size > 0 ? `${pickerSelection.size} izabrano` : "Izaberi proizvode"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPicker(false)}
                  disabled={attaching}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-sm transition-colors disabled:opacity-50"
                >
                  Otkaži
                </button>
                <button
                  onClick={attachSelected}
                  disabled={attaching || pickerSelection.size === 0}
                  className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-sm text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {attaching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {attaching ? "Dodavanje..." : `Dodaj ${pickerSelection.size > 0 ? `(${pickerSelection.size})` : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
