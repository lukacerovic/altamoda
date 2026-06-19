"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { FREE_SHIPPING_THRESHOLD, MIN_B2B_ORDER } from "@/lib/constants";
import {
  ShoppingBag, Trash2, Minus, Plus, ChevronRight,
  Truck, Shield, Star, AlertCircle,
  FileText, Store, Sparkles, ImageOff,
  Heart, CheckCircle, Palette,
} from "lucide-react";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop";

interface RecommendedProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: { name: string; slug: string } | null;
  price: number | null;
  oldPrice: number | null;
  image: string | null;
  isProfessional: boolean;
  isNew: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  rating: number;
  variantCount?: number;
  promoBadge?: string | null;
  colorSiblings?: { id: string }[];
}

function getBadge(p: RecommendedProduct): string | null {
  if (p.promoBadge) return p.promoBadge;
  if (p.isNew) return "NOVO";
  if (p.isFeatured) return "HIT";
  if (p.price != null && p.oldPrice && p.oldPrice > p.price) {
    const pct = Math.round((1 - p.price / p.oldPrice) * 100);
    return `-${pct}%`;
  }
  return null;
}

function RecommendedCard({ product, isWishlisted }: { product: RecommendedProduct; isWishlisted: boolean }) {
  const { t } = useLanguage();
  const [liked, setLiked] = useState(isWishlisted);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();
  const { increment: incWishlist, decrement: decWishlist } = useWishlistStore();
  const badge = getBadge(product);
  const imgSrc = product.image || PLACEHOLDER_IMG;
  const hasColors = (product.colorSiblings?.length ?? 0) > 1;
  const outOfStock = product.stockQuantity <= 0;
  const b2bOnly = product.price == null;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = liked;
    setLiked(!liked);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) { setLiked(prev); return; }
      const data = await res.json();
      if (data.success) {
        setLiked(data.data.added);
        if (data.data.added) incWishlist(); else decWishlist();
      }
    } catch {
      setLiked(prev);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || product.price == null) return;
    addItem({
      productId: product.id,
      name: product.name,
      brand: product.brand?.name ?? "",
      price: product.price,
      quantity: 1,
      image: product.image ?? "",
      sku: product.sku,
      stockQuantity: product.stockQuantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col h-full">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#dddbd9] mb-4 rounded-[4px]">
        <Image src={imgSrc} alt={product.name} width={500} height={625} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {badge && (
            <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] backdrop-blur-sm rounded-full bg-[rgba(26,28,30,0.5)] text-[#FFFFFF]">{badge}</span>
          )}
          {product.isProfessional && (
            <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] bg-[rgba(26,28,30,0.5)] text-[#FFFFFF] backdrop-blur-sm rounded-full">{t("products.professional")}</span>
          )}
          {product.variantCount != null && product.variantCount > 1 && (
            <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] bg-[rgba(26,28,30,0.5)] text-[#FFFFFF] backdrop-blur-sm rounded-full">
              {product.variantCount} boja
            </span>
          )}
        </div>
        <button onClick={handleToggleWishlist} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FFFFFF]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[#FFFFFF] transition-colors z-10 opacity-0 group-hover:opacity-100">
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-[#1a1c1e] text-[#1a1c1e]" : "text-[#1a1c1e]"}`} />
        </button>
        {!b2bOnly && (
          <div className="hidden md:block absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={hasColors ? undefined : handleAddToCart}
              disabled={!hasColors && outOfStock}
              className={`w-full text-[10px] uppercase tracking-[0.22em] font-medium py-3 transition-colors flex items-center justify-center gap-2 ${!hasColors && outOfStock ? "bg-[#dddbd9] text-[#1a1c1e]/60 cursor-not-allowed" : addedToCart ? "bg-[#d98fa0] text-[#ffffff]" : "bg-[#edb4bd] text-[#ffffff] hover:bg-[#413d3a]"}`}
            >
              {hasColors ? <><Palette className="w-3.5 h-3.5" /> Izaberi boju</>
                : outOfStock ? <>{t("products.outOfStock")}</>
                : addedToCart ? <><CheckCircle className="w-3.5 h-3.5" /> {t("products.addedToCart")}</>
                : <><ShoppingBag className="w-3.5 h-3.5" /> {t("products.addToCart")}</>}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e]/60 font-medium block mb-1.5">{product.brand?.name ?? ""}</span>
        <h3 className="text-base text-[#1a1c1e] mb-1 font-normal line-clamp-2 leading-tight min-h-[2.6em]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.name}</h3>
        <div className="flex items-center gap-2 text-sm text-[#1a1c1e] mt-1">
          {product.price == null ? (
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e] font-medium">B2B samo · prijavi se za cenu</span>
          ) : (
            <>
              {product.oldPrice && <span className="text-[#1a1c1e]/60 line-through text-xs">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
              <span>{product.price.toLocaleString("sr-RS")} RSD</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(product.rating) ? "fill-[#1a1c1e] text-[#1a1c1e]" : "fill-[#1a1c1e]/15 text-[#1a1c1e]/25"}`} />)}
        </div>
        {!b2bOnly && (
          <div className="md:hidden mt-auto pt-3">
            <button
              onClick={hasColors ? undefined : handleAddToCart}
              disabled={!hasColors && outOfStock}
              className={`w-full text-[10px] uppercase tracking-[0.22em] font-medium py-2.5 transition-colors flex items-center justify-center gap-1.5 rounded-[2px] ${!hasColors && outOfStock ? "bg-[#dddbd9] text-[#1a1c1e]/60 cursor-not-allowed" : addedToCart ? "bg-[#d98fa0] text-[#ffffff]" : "bg-[#edb4bd] text-[#ffffff] active:bg-[#d98fa0]"}`}
            >
              {hasColors ? <><Palette className="w-3 h-3" /> Izaberi boju</>
                : outOfStock ? <>{t("products.outOfStock")}</>
                : addedToCart ? <><CheckCircle className="w-3 h-3" /> {t("products.addedToCart")}</>
                : <><ShoppingBag className="w-3 h-3" /> {t("products.addToCart")}</>}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { items, updateQuantity, removeItem, getTotal, setItems } = useCartStore();
  const [b2bNoOnlinePayment, setB2bNoOnlinePayment] = useState(false);
  const [b2bInvoice, setB2bInvoice] = useState(false);

  const [stockChecked, setStockChecked] = useState(false);

  // Layer 2: Validate stock from DB on cart page load
  const [stockMap, setStockMap] = useState<Record<string, number> | null>(null);

  // Cart-based recommendations: pulled from /api/products, scored by brand match
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<string[]>([]);
  const wishlistedSet = useMemo(() => new Set(wishlistedIds), [wishlistedIds]);

  // Refetch only when the *set* of cart products changes, not on quantity edits
  const cartProductIdsKey = items.map((i) => i.productId).sort().join("|");

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data?.items)) {
          setWishlistedIds(d.data.items.map((w: { productId: string }) => w.productId));
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  useEffect(() => {
    const currentItems = useCartStore.getState().items;
    if (currentItems.length === 0) { setRecommended([]); return; }
    const cartIds = new Set(currentItems.map((i) => i.productId));
    const cartBrands = new Set(
      currentItems.map((i) => i.brand?.trim().toLowerCase()).filter(Boolean) as string[]
    );
    const ac = new AbortController();
    fetch("/api/products?inStockOnly=true&sort=popular&limit=24", { signal: ac.signal })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        const pool: RecommendedProduct[] = json.data?.products ?? [];
        const available = pool.filter((p) => !cartIds.has(p.id));
        const brandMatches = available.filter(
          (p) => p.brand?.name && cartBrands.has(p.brand.name.toLowerCase())
        );
        let picks: RecommendedProduct[];
        if (brandMatches.length >= 4) {
          picks = brandMatches.slice(0, 4);
        } else {
          const matchIds = new Set(brandMatches.map((p) => p.id));
          const fillers = available.filter((p) => !matchIds.has(p.id)).slice(0, 4 - brandMatches.length);
          picks = [...brandMatches, ...fillers];
        }
        setRecommended(picks);
      })
      .catch(() => {});
    return () => ac.abort();
  }, [cartProductIdsKey]);

  useEffect(() => {
    const productIds = useCartStore.getState().items.map((i) => i.productId);
    if (productIds.length === 0) { setStockChecked(true); return; }
    const validateStock = async () => {
      try {
        const res = await fetch("/api/cart/validate-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds }),
        });
        const json = await res.json();
        if (json.success) {
          setStockMap(json.data);
          // Update stockQuantity on items using latest store state
          const currentItems = useCartStore.getState().items;
          const updated = currentItems.map((item) => ({
            ...item,
            stockQuantity: json.data[item.productId] ?? item.stockQuantity,
          }));
          const changed = updated.some((u, i) => u.stockQuantity !== currentItems[i].stockQuantity);
          if (changed) setItems(updated);
        }
      } catch {
        // Silently fail — use cached stockQuantity
      } finally {
        setStockChecked(true);
      }
    };
    validateStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isB2b = session?.user?.role === "b2b";
  const inStockItems = items.filter((i) => i.stockQuantity > 0);
  const hasOutOfStock = items.some((i) => i.stockQuantity <= 0);
  const subtotal = inStockItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Delivery method is chosen in the checkout step, not in cart — keeping only
  // a subtotal view here avoids duplicate UI and ambiguous totals.
  const total = subtotal


  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-[#1a1c1e] mb-6">
          <Link href="/" className="hover:text-[#edb4bd]">{t("cart.home")}</Link><ChevronRight className="w-3 h-3" /><span className="text-[#1a1c1e]">{t("cart.cart")}</span>
        </nav>

        <h1 className="text-3xl font-bold text-[#1a1c1e] mb-8" style={{ fontFamily: "'Noto Serif', serif" }}>{t("cart.title")} ({items.length})</h1>
        <div>
          <Link href="/products" className="inline-flex items-center gap-2 text-[#edb4bd] hover:text-[#1a1c1e] text-sm font-medium transition-colors mb-3">
            &larr; {t("cart.continueShoppingLink")}
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-[#dddbd9] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#1a1c1e] mb-2">{t("cart.empty")}</h2>
            <p className="text-[#1a1c1e] mb-6">{t("cart.emptyDesc")}</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-[#edb4bd] hover:bg-[#413d3a] text-white px-6 py-3 rounded font-medium transition-colors">{t("cart.continueShopping")}</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            {/* CART ITEMS */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const outOfStock = item.stockQuantity <= 0;
                return (
                <div key={item.productId} className={`bg-white rounded-sm shadow-sm p-4 md:p-6 flex gap-4 ${outOfStock ? "opacity-60" : ""}`}>
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded overflow-hidden flex-shrink-0 relative bg-[#f5f4f2]">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#a8a39d]">
                        <ImageOff className="w-6 h-6" />
                      </div>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-red-600 px-2 py-1 rounded-sm">{t("cart.outOfStock")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-[#edb4bd] font-medium uppercase tracking-wider">{item.brand}</span>
                        <h3 className="text-sm md:text-base font-medium text-[#1a1c1e] mt-1">{item.name}</h3>
                        {outOfStock && <p className="text-xs text-red-600 font-medium mt-1">{t("cart.outOfStockNotice")}</p>}
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="text-[#1a1c1e] hover:text-[#edb4bd] transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      {outOfStock ? (
                        <span className="text-xs text-[#1a1c1e] italic">{t("cart.unavailable")}</span>
                      ) : (
                        <div className="flex items-center border border-[#dddbd9] rounded">
                          <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-[#FFFFFF]"><Minus className="w-3 h-3" /></button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1) updateQuantity(item.productId, val);
                            }}
                            className="w-12 text-center text-sm font-medium border-0 focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-[#FFFFFF]"><Plus className="w-3 h-3" /></button>
                        </div>
                      )}
                      <span className={`font-bold ${outOfStock ? "text-[#1a1c1e] line-through" : "text-[#1a1c1e]"}`}>{(item.price * item.quantity).toLocaleString("sr-RS")} RSD</span>
                    </div>
                  </div>
                </div>
                );
              })}

              {/* B2B Options Box — only for B2B users */}
              {isB2b && (
                <div className="bg-white rounded-sm shadow-sm p-6 border-2 border-black">
                  <h3 className="text-sm font-semibold text-[#edb4bd] mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> {t("cart.b2bOptions")}</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={b2bNoOnlinePayment} onChange={(e) => setB2bNoOnlinePayment(e.target.checked)} className="w-4 h-4 rounded border-[#dddbd9] text-[#edb4bd] focus:ring-[#1a1c1e]" />
                      <span className="text-sm text-[#1a1c1e]">{t("cart.orderWithoutOnlinePayment")}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={b2bInvoice} onChange={(e) => setB2bInvoice(e.target.checked)} className="w-4 h-4 rounded border-[#dddbd9] text-[#edb4bd] focus:ring-[#1a1c1e]" />
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1a1c1e]" />
                        <span className="text-sm text-[#1a1c1e]">{t("cart.invoicePayment")}</span>
                      </div>
                    </label>
                    <div className="bg-[#FFFFFF] rounded p-3 text-xs text-[#1a1c1e] flex items-start gap-2">
                      <Store className="w-4 h-4 text-[#edb4bd] flex-shrink-0 mt-0.5" />
                      <span>{t("cart.minB2bOrder")}: <strong className="text-[#1a1c1e]">{MIN_B2B_ORDER.toLocaleString("sr-RS")} RSD</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ORDER SUMMARY */}
            <div className="flex flex-col">
              <div className="bg-white rounded-sm shadow-sm p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-[#1a1c1e] mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("cart.orderSummary")}</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-[#1a1c1e]">{t("cart.subtotal")}</span><span className="font-medium">{subtotal.toLocaleString("sr-RS")} RSD</span></div>
                  <div className="flex justify-between"><span className="text-[#1a1c1e]">{t("cart.delivery")}</span><span className="text-xs text-[#1a1c1e]">{t("cart.selectAtCheckout") ?? "U sledećem koraku"}</span></div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#dddbd9]">
                  <div className="flex justify-between text-lg font-bold"><span>{t("cart.total")}</span><span>{total.toLocaleString("sr-RS")} RSD</span></div>
                </div>

                {hasOutOfStock && (
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-sm p-3 flex items-start gap-2 text-sm text-orange-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{t("cart.outOfStockWarning")}</span>
                  </div>
                )}

                <div className="flex-1" />

                <button onClick={handleCheckout} disabled={inStockItems.length === 0} className="w-full bg-[#edb4bd] hover:bg-[#413d3a] text-white py-3.5 rounded font-medium mt-6 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {t("cart.proceedToCheckout")} <ChevronRight className="w-4 h-4" />
                </button>

                <div className="mt-4 space-y-2 text-xs text-[#1a1c1e]">
                  <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#edb4bd]" /> {t("cart.freeShippingOver")}</div>
                  <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#edb4bd]" /> {t("cart.securePayment")}</div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#dddbd9]">
                  {["Visa", "Mastercard", "PayPal", "Pouzece"].map((p) => (
                    <span key={p} className="px-2 py-1 bg-[#FFFFFF] rounded text-[10px] text-[#1a1c1e] font-medium">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECOMMENDED — derived from cart contents (same brand fallback to bestsellers) */}
        {recommended.length > 0 && (
          <section className="mt-16 mb-16">
            <h2 className="text-2xl font-bold text-[#1a1c1e] mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("cart.recommended")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {recommended.map((p) => (
                <RecommendedCard key={p.id} product={p} isWishlisted={wishlistedSet.has(p.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
