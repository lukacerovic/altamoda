"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Star, Sparkles, ShoppingBag, Tag, Package } from "lucide-react";
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
    { key: "bestsellers", label: t("admin.bestsellersSection"), filterParam: "isBestseller=true", flagField: "isBestseller", icon: <Sparkles size={20} /> },
    { key: "newArrivals", label: t("admin.newArrivalsSection"), filterParam: "isNew=true", flagField: "isNew", icon: <ShoppingBag size={20} /> },
    { key: "sale", label: t("admin.saleSection"), filterParam: "onSale=true", flagField: "", icon: <Tag size={20} />, readOnly: true },
  ];

  const [sectionProducts, setSectionProducts] = useState<Record<string, SectionProduct[]>>({});
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, SectionProduct[]>>({});
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchTimers = useRef<Record<string, NodeJS.Timeout>>({});

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

  const handleSearch = (sectionKey: string, query: string) => {
    setSearchQueries((prev) => ({ ...prev, [sectionKey]: query }));
    setActiveSearch(sectionKey);

    if (searchTimers.current[sectionKey]) {
      clearTimeout(searchTimers.current[sectionKey]);
    }

    if (!query.trim()) {
      setSearchResults((prev) => ({ ...prev, [sectionKey]: [] }));
      return;
    }

    searchTimers.current[sectionKey] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`);
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
          setSearchResults((prev) => ({ ...prev, [sectionKey]: filtered }));
        }
      } catch {
        // ignore
      }
    }, 300);
  };

  const addProduct = async (sectionKey: string, product: SectionProduct, flagField: string) => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flagField]: true }),
      });
      setSectionProducts((prev) => ({
        ...prev,
        [sectionKey]: [...(prev[sectionKey] || []), product],
      }));
      setSearchQueries((prev) => ({ ...prev, [sectionKey]: "" }));
      setSearchResults((prev) => ({ ...prev, [sectionKey]: [] }));
      setActiveSearch(null);
    } catch {
      // ignore
    }
  };

  const removeProduct = async (sectionKey: string, productId: string, flagField: string) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flagField]: false }),
      });
      setSectionProducts((prev) => ({
        ...prev,
        [sectionKey]: (prev[sectionKey] || []).filter((p) => p.id !== productId),
      }));
    } catch {
      // ignore
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
          {sections.map((section) => {
            const products = sectionProducts[section.key] || [];
            const results = searchResults[section.key] || [];
            const query = searchQueries[section.key] || "";

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
                            <img
                              src={product.image}
                              alt={product.name}
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

                  {/* Search to Add */}
                  {!section.readOnly && (
                    <div className="mt-4 relative">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]"
                        />
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => handleSearch(section.key, e.target.value)}
                          onFocus={() => setActiveSearch(section.key)}
                          placeholder={t("admin.searchToAdd")}
                          className="w-full pl-9 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-black focus:outline-none"
                        />
                      </div>

                      {/* Search Results Dropdown */}
                      {activeSearch === section.key && results.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-stone-200 z-10 max-h-60 overflow-y-auto">
                          {results.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => addProduct(section.key, product, section.flagField)}
                              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-stone-100 transition-colors text-left border-b border-[#f0f0f0] last:border-b-0"
                            >
                              <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center flex-shrink-0">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                ) : (
                                  <Package size={14} className="text-[#999]" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-black truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-[#999]">
                                  {product.brand?.name || ""} · {product.sku}
                                </p>
                              </div>
                              <span className="text-xs text-secondary font-medium flex-shrink-0">
                                + {t("admin.addToSection")}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

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
    </div>
  );
}
