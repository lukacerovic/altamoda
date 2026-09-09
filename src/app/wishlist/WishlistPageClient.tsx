"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Heart,
  Star,
  Share2,
  ShoppingCart,
  X,
  CheckCircle,
  ImageOff,
} from "lucide-react";

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  // null = price hidden from this viewer (professional product, non-B2B account)
  price: number | null;
  oldPrice: number | null;
  image: string;
  rating: number;
  inStock: boolean;
  slug: string;
}

interface Props {
  items: WishlistItem[];
  isGuest?: boolean;
}

export default function WishlistPageClient({ items: initialItems, isGuest = false }: Props) {
  const { t } = useLanguage();
  const [items, setItems] = useState(initialItems);
  // Guests resolve their locally-persisted product ids client-side; keep the
  // empty state hidden until that resolve finishes so it doesn't flash.
  const [guestLoading, setGuestLoading] = useState(isGuest);
  const { addItem } = useCartStore();

  const [removeError, setRemoveError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Toast headline; defaults to the add-to-cart wording, overridden by share.
  const [toastTitle, setToastTitle] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // Guest wishlist: resolve the persisted product ids into displayable items
  // via the public resolve endpoint (B2C prices, input order preserved,
  // inactive/missing products dropped).
  useEffect(() => {
    if (!isGuest) return;
    const ids = useWishlistStore.getState().guestItems;
    if (ids.length === 0) {
      setGuestLoading(false);
      return;
    }
    fetch("/api/wishlist/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: ids }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data?.items)) {
          setItems(d.data.items);
        }
      })
      .catch(() => {})
      .finally(() => setGuestLoading(false));
  }, [isGuest]);

  /** Share the list as plain text (name + product link per item). Uses the
   *  native share sheet where the browser has one (mobile), otherwise copies to
   *  the clipboard. The /wishlist URL itself is per-account, so it is not what
   *  gets shared. */
  const shareList = async () => {
    if (items.length === 0) return;
    const origin = window.location.origin;
    const body = items
      .map((i) => `\u2022 ${i.brand ? `${i.brand} ` : ""}${i.name} - ${origin}/products/${i.slug}`)
      .join("\n");
    const text = `${t("wishlist.heading")}\n\n${body}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: t("wishlist.heading"), text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast(`${items.length} \u00d7 ${t("wishlist.itemCount")}`, t("wishlist.shareCopied"));
    } catch {
      // The user dismissed the share sheet, or the clipboard is unavailable
      // (insecure context / permission denied) — nothing to report either way.
    }
  };

  const showToast = (message: string, title?: string) => {
    setToastTitle(title ?? null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const removeItem = async (productId: string) => {
    setRemoveError("");
    // Guests: remove from the persisted guest store (toggleGuest also keeps
    // the header badge count in sync) — no API call.
    if (isGuest) {
      useWishlistStore.getState().toggleGuest(productId);
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Server error");
      }
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      // Keep the header badge in sync with the server-side removal
      useWishlistStore.getState().decrement();
    } catch (err) {
      console.error("Failed to remove wishlist item:", err);
      setRemoveError("Greška pri uklanjanju proizvoda. Pokušajte ponovo.");
    }
  };

  const addToCart = (item: WishlistItem) => {
    if (item.price == null) return; // price hidden → not purchasable by this viewer
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
    showToast(item.name);
  };

  const addAllToCart = () => {
    const eligible = items.filter((i) => i.inStock && i.price != null);
    eligible.forEach((item) => {
      addItem({
        productId: item.productId,
        name: item.name,
        brand: item.brand,
        price: item.price!,
        quantity: 1,
        image: item.image,
        sku: "",
        stockQuantity: 1,
      });
    });
    if (eligible.length > 0) {
      showToast(`${eligible.length} × ${t("wishlist.addedToast")}`);
    }
  };

  const discountBadge = (item: WishlistItem) => {
    if (item.price == null || !item.oldPrice || item.oldPrice <= item.price) return null;
    const pct = Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100);
    return `-${pct}%`;
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#1a1c1e] mb-6">
          <Link href="/" className="hover:text-[#edb4bd]">{t("wishlist.home")}</Link>
          <span>/</span>
          <span className="text-[#1a1c1e]">{t("wishlist.title")}</span>
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
                <Heart className="w-6 h-6 text-[#edb4bd] fill-[#dddbd9]" />
                <h1 className="text-3xl font-bold text-[#1a1c1e]" style={{ fontFamily: "'Noto Serif', serif" }}>{t("wishlist.heading")}</h1>
                <span className="text-sm text-[#1a1c1e]">({items.length} {t("wishlist.itemCount")})</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={shareList}
                  className="flex items-center gap-2 px-4 py-2 border border-[#dddbd9] text-[#1a1c1e] text-sm rounded-sm hover:bg-[#FFFFFF] hover:border-black transition-colors"
                >
                  <Share2 className="w-4 h-4" /> {t("wishlist.shareList")}
                </button>
                <button onClick={addAllToCart} className="flex items-center gap-2 px-5 py-2 bg-[#1a1c1e] hover:bg-[#413d3a] active:bg-[#edb4bd] active:text-[#1a1c1e] text-white text-sm font-medium rounded-sm transition-colors">
                  <ShoppingCart className="w-4 h-4" /> {t("wishlist.addAllToCart")}
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map((item) => {
                const badge = discountBadge(item);
                return (
                  <div key={item.productId} className="bg-white rounded-[4px] overflow-hidden shadow-sm border border-[#dddbd9]/50 group hover:shadow-md transition-all">
                    <div className="relative overflow-hidden aspect-square bg-[#f5f4f2]">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#a8a39d]">
                          <ImageOff className="w-8 h-8 mb-1" />
                          <span className="text-[10px] uppercase tracking-wider">{t("wishlist.noImage")}</span>
                        </div>
                      )}
                      {badge && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] font-medium text-white bg-[rgba(26,28,30,0.5)] backdrop-blur-sm">{badge}</span>
                      )}
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="px-4 py-2 bg-[#1a1c1e] text-white text-xs font-semibold rounded-full">{t("wishlist.unavailable")}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(item.productId)}
                        title={t("wishlist.removeItem")}
                        aria-label={t("wishlist.removeItem")}
                        className="absolute top-3 right-3 w-9 h-9 bg-[rgba(26,28,30,0.75)] backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-[#edb4bd] mb-1">{item.brand}</p>
                      <h3 className="text-sm font-medium text-[#1a1c1e] mb-2 line-clamp-2 leading-snug">{item.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.rating) ? "fill-[#dddbd9] text-[#edb4bd]" : "text-[#dddbd9]"}`} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {item.price == null ? (
                          <span className="text-xs text-[#1a1c1e]/60">{t("productDetail.b2bPriceHint")}</span>
                        ) : item.oldPrice && item.oldPrice > item.price ? (
                          <>
                            <span className="text-base font-bold text-[#edb4bd]">{item.price.toLocaleString()} RSD</span>
                            <span className="text-xs text-[#1a1c1e] line-through">{item.oldPrice.toLocaleString()} RSD</span>
                          </>
                        ) : (
                          <span className="text-base font-bold text-[#1a1c1e]">{item.price.toLocaleString()} RSD</span>
                        )}
                      </div>
                      <button
                        disabled={!item.inStock || item.price == null}
                        onClick={() => addToCart(item)}
                        className={`w-full py-2.5 text-sm font-medium rounded-sm transition-colors ${
                          item.inStock
                            ? "bg-[#1a1c1e] hover:bg-[#413d3a] active:bg-[#edb4bd] active:text-[#1a1c1e] text-[#ffffff]"
                            : "bg-[#dddbd9] text-[#1a1c1e] cursor-not-allowed"
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
        ) : guestLoading ? null : (
          /* Empty State */
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-[#dddbd9] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>{t("wishlist.emptyTitle")}</h2>
            <p className="text-[#1a1c1e] mb-6">{t("wishlist.emptyDesc")}</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[#edb4bd] hover:bg-[#413d3a] text-white font-medium rounded-sm transition-colors">
              {t("productDetail.products")}
            </Link>
          </div>
        )}
      </div>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#1a1c1e] text-white rounded-md shadow-xl px-4 py-3 flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 text-[#edb4bd] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{toastTitle ?? t("wishlist.addedToast")}</p>
            <p className="text-xs text-white/70 truncate mt-0.5">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            aria-label={t("common.close")}
            className="text-white/50 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
