"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Star, ShoppingBag, Tag, Package, Plus, Check, Upload, ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SectionProduct {
  id: string;
  name: string;
  brand: { name: string } | null;
  price: number;
  oldPrice: number | null;
  image: string | null;
  sku: string;
}

interface SectionConfig {
  key: string;
  label: string;
  filterParam: string;
  flagField: string;
  icon: React.ReactNode;
  readOnly?: boolean;
}

export default function HomepagePage() {
  const { t } = useLanguage();

  const sections: SectionConfig[] = [
    { key: "featured", label: t("admin.featuredSection"), filterParam: "isFeatured=true", flagField: "isFeatured", icon: <Star size={20} /> },
    { key: "newArrivals", label: t("admin.newArrivalsSection"), filterParam: "isNew=true", flagField: "isNew", icon: <ShoppingBag size={20} /> },
    { key: "sale", label: t("admin.saleSection"), filterParam: "onSale=true", flagField: "onSale", icon: <Tag size={20} /> },
  ];

  const [sectionProducts, setSectionProducts] = useState<Record<string, SectionProduct[]>>({});
  const [loading, setLoading] = useState(true);

  // Hero images state (3 fixed positions: left, top-right, bottom-right)
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroUploading, setHeroUploading] = useState<number | null>(null);
  const heroInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    fetch("/api/admin/site-settings?keys=heroImages")
      .then(r => r.json())
      .then(json => {
        if (json.data?.heroImages) {
          try { setHeroImages(JSON.parse(json.data.heroImages)); } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  }, []);

  const saveHeroImages = async (images: string[]) => {
    setHeroImages(images);
    await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroImages: JSON.stringify(images) }),
    });
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(slotIndex);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error);

      // Delete old image if it was an upload
      const oldUrl = heroImages[slotIndex];
      if (oldUrl?.startsWith("/uploads/")) {
        fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: oldUrl }),
        }).catch(() => {});
      }

      const updated = [...heroImages];
      // Ensure array has 3 slots
      while (updated.length < 3) updated.push("");
      updated[slotIndex] = uploadJson.data.url;
      await saveHeroImages(updated);
    } catch (err) {
      alert("Greška pri uploadu: " + (err instanceof Error ? err.message : "Nepoznata greška"));
    } finally {
      setHeroUploading(null);
      const ref = heroInputRefs[slotIndex];
      if (ref.current) ref.current.value = "";
    }
  };

  const removeHeroImage = async (index: number) => {
    const removedUrl = heroImages[index];
    const updated = [...heroImages];
    while (updated.length < 3) updated.push("");
    updated[index] = "";
    await saveHeroImages(updated);

    if (removedUrl?.startsWith("/uploads/")) {
      fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: removedUrl }),
      }).catch(() => {});
    }
  };

  // Add-products modal state
  const [addModal, setAddModal] = useState<{ sectionKey: string; flagField: string } | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalResults, setModalResults] = useState<SectionProduct[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [addingProducts, setAddingProducts] = useState(false);
  const modalSearchTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchSectionProducts = useCallback(async () => {
    setLoading(true);
    const results: Record<string, SectionProduct[]> = {};

    await Promise.all(
      sections.map(async (section) => {
        try {
          const res = await fetch(`/api/products?${section.filterParam}&limit=50`);
          const data = await res.json();
          if (data.success) {
            results[section.key] = data.data.products.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: (p.name || "") as string,
              brand: p.brand as { name: string } | null,
              price: (p.priceB2c || p.price || 0) as number,
              oldPrice: (p.oldPrice || null) as number | null,
              image: (p.image || null) as string | null,
              sku: (p.sku || "") as string,
            }));
          }
        } catch {
          results[section.key] = [];
        }
      })
    );

    setSectionProducts(results);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSectionProducts();
  }, [fetchSectionProducts]);

  const openAddModal = (sectionKey: string, flagField: string) => {
    setAddModal({ sectionKey, flagField });
    setModalSearch("");
    setModalResults([]);
    setSelectedToAdd(new Set());
    // Load initial results
    fetchModalResults("", sectionKey);
  };

  const fetchModalResults = async (query: string, sectionKey: string) => {
    setModalLoading(true);
    try {
      const url = query.trim()
        ? `/api/products?search=${encodeURIComponent(query)}&limit=30`
        : `/api/products?limit=30`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const currentIds = new Set((sectionProducts[sectionKey] || []).map((p) => p.id));
        const filtered = data.data.products
          .filter((p: Record<string, unknown>) => !currentIds.has(p.id as string))
          .map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: (p.name || "") as string,
            brand: p.brand as { name: string } | null,
            price: (p.priceB2c || p.price || 0) as number,
            oldPrice: (p.oldPrice || null) as number | null,
            image: (p.image || null) as string | null,
            sku: (p.sku || "") as string,
          }));
        setModalResults(filtered);
      }
    } catch {
      // ignore
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalSearch = (query: string) => {
    setModalSearch(query);
    if (modalSearchTimer.current) clearTimeout(modalSearchTimer.current);
    modalSearchTimer.current = setTimeout(() => {
      if (addModal) fetchModalResults(query, addModal.sectionKey);
    }, 300);
  };

  const toggleSelect = (productId: string) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const addSelectedProducts = async () => {
    if (!addModal || selectedToAdd.size === 0) return;
    setAddingProducts(true);
    const { sectionKey, flagField } = addModal;
    const productsToAdd = modalResults.filter((p) => selectedToAdd.has(p.id));

    await Promise.all(
      productsToAdd.map((product) => {
        const updateBody = flagField === "onSale"
          ? { oldPrice: product.price > 0 ? Math.round(product.price * 1.2) : 100 }
          : { [flagField]: true };
        return fetch(`/api/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateBody),
        });
      })
    );

    setSectionProducts((prev) => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] || []), ...productsToAdd],
    }));
    setAddingProducts(false);
    setAddModal(null);
  };

  const removeProduct = async (sectionKey: string, productId: string, flagField: string) => {
    try {
      const updateBody = flagField === "onSale"
        ? { oldPrice: null }
        : { [flagField]: false };
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Failed to remove product:", data);
        alert(`Greška: ${data.error || "Neuspešno uklanjanje proizvoda"}`);
        return;
      }
      setSectionProducts((prev) => ({
        ...prev,
        [sectionKey]: (prev[sectionKey] || []).filter((p) => p.id !== productId),
      }));
    } catch (err) {
      console.error("Remove product error:", err);
      alert("Greška pri uklanjanju proizvoda");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-black">
          {t("admin.homepageManagement")}
        </h1>
        <p className="text-sm text-[#666] mt-1">{t("admin.homepageDesc")}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Banners Section */}
          <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-[#faf8f4]">
              <div className="flex items-center gap-3">
                <div className="text-secondary"><ImageIcon size={20} /></div>
                <h2 className="text-lg font-serif font-bold text-black">Hero Baneri</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-black/10 text-secondary text-xs font-semibold">
                  {heroImages.filter(Boolean).length} / 3
                </span>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#666] mb-4">
                Postavite 3 banera za početnu stranicu. Raspored je identičan onome što kupci vide.
              </p>

              {/* Template preview – mirrors the frontend layout (2fr / 1fr, no gaps) */}
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]">
                {/* Left large banner (slot 0) */}
                {(() => {
                  const slotIndex = 0;
                  const url = heroImages[slotIndex];
                  const label = "Levi baner (veliki)";
                  return (
                    <div className="relative group overflow-hidden border-2 border-dashed border-stone-300 hover:border-black transition-colors">
                      {url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={label} className="w-full h-auto block" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">{label}</div>
                          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => heroInputRefs[slotIndex].current?.click()} className="p-1.5 bg-white rounded shadow text-black hover:bg-stone-100 transition-colors" title="Zameni">
                              <Upload size={14} />
                            </button>
                            <button onClick={() => removeHeroImage(slotIndex)} className="p-1.5 bg-red-500 rounded shadow text-white hover:bg-red-600 transition-colors" title="Ukloni">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => heroInputRefs[slotIndex].current?.click()}
                          disabled={heroUploading === slotIndex}
                          className="w-full h-full min-h-[280px] flex flex-col items-center justify-center gap-2 cursor-pointer"
                        >
                          {heroUploading === slotIndex ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
                          ) : (
                            <>
                              <Upload size={28} className="text-stone-400" />
                              <span className="text-sm text-[#666]">{label}</span>
                              <span className="text-xs text-[#999]">Preporučeno: 960x400px</span>
                            </>
                          )}
                        </button>
                      )}
                      <input ref={heroInputRefs[slotIndex]} type="file" accept="image/*" onChange={(e) => handleHeroUpload(e, slotIndex)} className="hidden" />
                    </div>
                  );
                })()}

                {/* Right column – two stacked slots */}
                <div className="grid grid-rows-2">
                  {[
                    { slotIndex: 1, label: "Gornji desni baner" },
                    { slotIndex: 2, label: "Donji desni baner" },
                  ].map(({ slotIndex, label }) => {
                    const url = heroImages[slotIndex];
                    return (
                      <div key={slotIndex} className="relative group overflow-hidden border-2 border-dashed border-stone-300 hover:border-black transition-colors">
                        {url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">{label}</div>
                            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => heroInputRefs[slotIndex].current?.click()} className="p-1.5 bg-white rounded shadow text-black hover:bg-stone-100 transition-colors" title="Zameni">
                                <Upload size={14} />
                              </button>
                              <button onClick={() => removeHeroImage(slotIndex)} className="p-1.5 bg-red-500 rounded shadow text-white hover:bg-red-600 transition-colors" title="Ukloni">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => heroInputRefs[slotIndex].current?.click()}
                            disabled={heroUploading === slotIndex}
                            className="w-full h-full min-h-[136px] flex flex-col items-center justify-center gap-2 cursor-pointer"
                          >
                            {heroUploading === slotIndex ? (
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
                            ) : (
                              <>
                                <Upload size={24} className="text-stone-400" />
                                <span className="text-sm text-[#666]">{label}</span>
                                <span className="text-xs text-[#999]">Preporučeno: 960x196px</span>
                              </>
                            )}
                          </button>
                        )}
                        <input ref={heroInputRefs[slotIndex]} type="file" accept="image/*" onChange={(e) => handleHeroUpload(e, slotIndex)} className="hidden" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {sections.map((section) => {
            const products = sectionProducts[section.key] || [];

            return (
              <div
                key={section.key}
                className="bg-white rounded-sm border border-stone-200 overflow-hidden"
              >
                {/* Section Header */}
                <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-[#faf8f4]">
                  <div className="flex items-center gap-3">
                    <div className="text-secondary">{section.icon}</div>
                    <h2 className="text-lg font-serif font-bold text-black">
                      {section.label}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/10 text-secondary text-xs font-semibold">
                      {products.length}
                    </span>
                  </div>
                  {!section.readOnly && (
                    <button
                      onClick={() => openAddModal(section.key, section.flagField)}
                      className="bg-black text-white hover:bg-stone-800 transition-colors px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2"
                    >
                      <Plus size={16} />
                      {t("admin.addToSection")}
                    </button>
                  )}
                </div>

                {/* Products Grid */}
                <div className="p-6">
                  {products.length === 0 && (
                    <p className="text-sm text-[#999] text-center py-4">
                      {section.readOnly ? t("admin.saleNote") : t("admin.noProductsMatch")}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-[#faf8f4] group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <Package size={18} className="text-[#999]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-black truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-[#999]">
                            {product.brand?.name || ""}{" "}
                            {product.price > 0 && `· ${product.price.toLocaleString()} RSD`}
                          </p>
                        </div>
                        {!section.readOnly && (
                          <button
                            onClick={() => removeProduct(section.key, product.id, section.flagField)}
                            className="p-1 text-[#999] hover:text-red-500 hover:bg-red-50 rounded sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
                            title={t("admin.removeFromSection")}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sale section note */}
                  {section.readOnly && products.length > 0 && (
                    <p className="mt-4 text-xs text-[#999] italic">{t("admin.saleNote")}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Products Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-2xl mx-4 flex flex-col" style={{ maxHeight: "80vh" }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-bold text-black">{t("admin.addToSection")}</h3>
                <p className="text-xs text-[#999] mt-0.5">
                  {selectedToAdd.size > 0
                    ? `${selectedToAdd.size} ${selectedToAdd.size === 1 ? "proizvod izabran" : "proizvoda izabrano"}`
                    : t("admin.searchToAdd")}
                </p>
              </div>
              <button onClick={() => setAddModal(null)} className="p-2 text-[#999] hover:text-black hover:bg-stone-100 rounded transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-stone-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => handleModalSearch(e.target.value)}
                  placeholder={t("admin.searchByNameOrCode")}
                  className="w-full pl-9 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-black focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent" />
                </div>
              ) : modalResults.length === 0 ? (
                <p className="text-sm text-[#999] text-center py-12">{t("admin.noProductsMatch")}</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {modalResults.map((product) => {
                    const isSelected = selectedToAdd.has(product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggleSelect(product.id)}
                        className={`flex items-center gap-3 w-full px-6 py-3 text-left transition-colors ${
                          isSelected ? "bg-stone-100" : "hover:bg-stone-50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? "bg-black border-black" : "border-stone-300"
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} width={64} height={64} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <Package size={16} className="text-[#999]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-black truncate">{product.name}</p>
                          <p className="text-xs text-[#999]">
                            {product.brand?.name || ""} · {product.sku}
                            {product.price > 0 && ` · ${product.price.toLocaleString()} RSD`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-white">
              <button
                onClick={() => setAddModal(null)}
                className="px-5 py-2.5 rounded-sm text-sm font-medium text-[#666] hover:bg-stone-100 transition-colors"
              >
                {t("admin.cancel")}
              </button>
              <button
                onClick={addSelectedProducts}
                disabled={selectedToAdd.size === 0 || addingProducts}
                className="bg-black text-white hover:bg-stone-800 transition-colors px-6 py-2.5 rounded-sm text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {addingProducts ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {t("admin.addToSection")} {selectedToAdd.size > 0 && `(${selectedToAdd.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
