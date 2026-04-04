"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, Upload, Loader2, Save } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
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

export default function AdminBrandsPage() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");

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

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Brand list view
  if (!selectedBrand) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black tracking-wide" style={{ fontFamily: "'Noto Serif', serif" }}>
            {t("admin.brands")}
          </h1>
          <p className="text-stone-500 text-sm mt-1">{t("admin.brandsDesc")}</p>
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
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain p-2" />
                  ) : (
                    <span className="text-2xl font-bold text-stone-300" style={{ fontFamily: "'Noto Serif', serif" }}>
                      {brand.name.charAt(0)}
                    </span>
                  )}
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

  // Brand editor view
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setSelectedBrand(null)}
          className="p-2 hover:bg-stone-100 rounded-sm transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-black tracking-wide" style={{ fontFamily: "'Noto Serif', serif" }}>
            {selectedBrand.name}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">{t("admin.editBrand")}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t("admin.save")}
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
                {editLogo ? (
                  <img src={editLogo} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                ) : (
                  <span className="text-3xl font-bold text-stone-300">{editName.charAt(0)}</span>
                )}
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
      </div>
    </div>
  );
}
