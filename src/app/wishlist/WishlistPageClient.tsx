"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/stores/cart-store";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Heart,
  Star,
  Share2,
  ShoppingCart,
  X,
} from "lucide-react";

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  image: string;
  rating: number;
  inStock: boolean;
  slug: string;
}

interface Props {
  items: WishlistItem[];
}

export default function WishlistPageClient({ items: initialItems }: Props) {
  const { t } = useLanguage();
  const [items, setItems] = useState(initialItems);
  const { addItem } = useCartStore();

  const [removeError, setRemoveError] = useState("");

  const removeItem = async (productId: string) => {
    setRemoveError("");
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Server error");
      }
      setItems(items.filter((item) => item.productId !== productId));
    } catch (err) {
      console.error("Failed to remove wishlist item:", err);
      setRemoveError("Greška pri uklanjanju proizvoda. Pokušajte ponovo.");
    }
  };

  const addToCart = (item: WishlistItem) => {
    addItem({
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: 1,
      image: item.image,
      sku: "",
      stockQuantity: item.inStock ? 1 : 0,
    });
  };

  const addAllToCart = () => {
    items.filter((i) => i.inStock).forEach((item) => addToCart(item));
  };

  const discountBadge = (item: WishlistItem) => {
    if (!item.oldPrice || item.oldPrice <= item.price) return null;
    const pct = Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100);
    return `-${pct}%`;
  };

  return (
    <div className="min-h-screen bg-[#FFFBF4]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#a5a995] mb-6">
          <Link href="/" className="hover:text-secondary">{t("wishlist.home")}</Link>
          <span>/</span>
          <span className="text-[#11120D]">{t("wishlist.title")}</span>
        </div>

        {removeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
            {removeError}
          </div>
        )}

        {items.length > 0 ? (
          <>
            {/* Title + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-secondary fill-[#7A7F6A]" />
                <h1 className="text-3xl font-bold text-[#11120D]" style={{ fontFamily: "'Noto Serif', serif" }}>{t("wishlist.heading")}</h1>
                <span className="text-sm text-[#a5a995]">({items.length} {t("wishlist.itemCount")})</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-[#D8CFBC] text-[#7A7F6A] text-sm rounded-sm hover:bg-[#FFFBF4] transition-colors">
                  <Share2 className="w-4 h-4" /> {t("wishlist.shareList")}
                </button>
                <button onClick={addAllToCart} className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-[#11120D] text-white text-sm font-medium rounded-sm transition-colors">
                  <ShoppingCart className="w-4 h-4" /> {t("wishlist.addAllToCart")}
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map((item) => {
                const badge = discountBadge(item);
                return (
                  <div key={item.productId} className="bg-white rounded-sm overflow-hidden shadow-sm border border-[#D8CFBC]/50 group hover:shadow-md transition-all">
                    <div className="relative overflow-hidden aspect-square">
                      <Image src={item.image} alt={item.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {badge && (
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white bg-[#b5453a]">{badge}</span>
                      )}
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="px-4 py-2 bg-[#11120D] text-white text-xs font-semibold rounded-full">{t("wishlist.unavailable")}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4 text-[#b5453a]" />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-secondary mb-1">{item.brand}</p>
                      <h3 className="text-sm font-medium text-[#11120D] mb-2 line-clamp-2 leading-snug">{item.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.rating) ? "fill-[#7A7F6A] text-secondary" : "text-[#D8CFBC]"}`} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {item.oldPrice && item.oldPrice > item.price ? (
                          <>
                            <span className="text-base font-bold text-[#b5453a]">{item.price.toLocaleString()} RSD</span>
                            <span className="text-xs text-[#a5a995] line-through">{item.oldPrice.toLocaleString()} RSD</span>
                          </>
                        ) : (
                          <span className="text-base font-bold text-[#11120D]">{item.price.toLocaleString()} RSD</span>
                        )}
                      </div>
                      <button
                        disabled={!item.inStock}
                        onClick={() => addToCart(item)}
                        className={`w-full py-2.5 text-sm font-medium rounded-sm transition-colors ${
                          item.inStock
                            ? "bg-black hover:bg-[#11120D] text-white"
                            : "bg-[#D8CFBC] text-[#a5a995] cursor-not-allowed"
                        }`}
                      >
                        {item.inStock ? t("wishlist.addToCart") : t("wishlist.unavailable")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-[#D8CFBC] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#11120D] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>{t("wishlist.emptyTitle")}</h2>
            <p className="text-[#7A7F6A] mb-6">{t("wishlist.emptyDesc")}</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-[#11120D] text-white font-medium rounded-sm transition-colors">
              {t("productDetail.products")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
