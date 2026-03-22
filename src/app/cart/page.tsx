"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCartStore } from "@/lib/stores/cart-store";
import { FREE_SHIPPING_THRESHOLD, MIN_B2B_ORDER } from "@/lib/constants";
import {
  ShoppingBag, Trash2, Minus, Plus, ChevronRight,
  Truck, Shield, Star, AlertCircle,
  CheckCircle, FileText, Save, MessageSquare, Store, Sparkles,
} from "lucide-react";

const recommended = [
  { id: "5", brand: "L'Oreal", name: "Oxydant Creme 6% 1000ml", price: 1200, rating: 5, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop" },
  { id: "6", brand: "Kerastase", name: "Nutritive Bain Satin", price: 3400, rating: 4, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop" },
  { id: "7", brand: "Olaplex", name: "No.4 Bond Šampon 250ml", price: 3600, rating: 5, image: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=500&h=500&fit=crop" },
  { id: "8", brand: "Moroccanoil", name: "Treatment Original 100ml", price: 4200, rating: 4, image: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&h=500&fit=crop" },
];

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { items, updateQuantity, removeItem, getTotal, setItems } = useCartStore();
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [b2bNoOnlinePayment, setB2bNoOnlinePayment] = useState(false);
  const [b2bInvoice, setB2bInvoice] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [stockChecked, setStockChecked] = useState(false);

  // Layer 2: Validate stock from DB on cart page load
  const [stockMap, setStockMap] = useState<Record<string, number> | null>(null);

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

  const deliveryOptions = [
    { key: "standard", label: t("cart.standardDelivery"), price: subtotal > FREE_SHIPPING_THRESHOLD ? 0 : 350, note: subtotal > FREE_SHIPPING_THRESHOLD ? t("cart.freeDeliveryForOrders") : "350 RSD" },
    { key: "express", label: t("cart.expressDelivery"), price: 690, note: "690 RSD" },
    { key: "pickup", label: t("cart.storePickup"), price: 0, note: t("cart.free") },
  ];

  const selectedDelivery = deliveryOptions.find((d) => d.key === deliveryMethod)!;
  const shipping = selectedDelivery.price;
  const total = subtotal + shipping;

  const handleSaveCart = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-secondary">{t("cart.home")}</Link><ChevronRight className="w-3 h-3" /><span className="text-black">{t("cart.cart")}</span>
        </nav>

        <h1 className="text-3xl font-bold text-black mb-8" style={{ fontFamily: "'Noto Serif', serif" }}>{t("cart.title")} ({items.length})</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">{t("cart.empty")}</h2>
            <p className="text-gray-500 mb-6">{t("cart.emptyDesc")}</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-black hover:bg-stone-800 text-white px-6 py-3 rounded font-medium transition-colors">{t("cart.continueShopping")}</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* CART ITEMS */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const outOfStock = item.stockQuantity <= 0;
                return (
                <div key={item.productId} className={`bg-white rounded-sm shadow-sm p-4 md:p-6 flex gap-4 ${outOfStock ? "opacity-60" : ""}`}>
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded overflow-hidden flex-shrink-0 relative">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-red-600 px-2 py-1 rounded-sm">{t("cart.outOfStock")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-secondary font-medium uppercase tracking-wider">{item.brand}</span>
                        <h3 className="text-sm md:text-base font-medium text-black mt-1">{item.name}</h3>
                        {outOfStock && <p className="text-xs text-red-600 font-medium mt-1">{t("cart.outOfStockNotice")}</p>}
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="text-gray-400 hover:text-[#c0392b] transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      {outOfStock ? (
                        <span className="text-xs text-gray-400 italic">{t("cart.unavailable")}</span>
                      ) : (
                        <div className="flex items-center border border-gray-200 rounded">
                          <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
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
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                        </div>
                      )}
                      <span className={`font-bold ${outOfStock ? "text-gray-400 line-through" : "text-black"}`}>{(item.price * item.quantity).toLocaleString("sr-RS")} RSD</span>
                    </div>
                  </div>
                </div>
                );
              })}

              {/* Delivery Options */}
              <div className="bg-white rounded-sm shadow-sm p-6">
                <h3 className="text-sm font-semibold text-black mb-4 flex items-center gap-2"><Truck className="w-4 h-4 text-secondary" /> {t("cart.deliveryMethod")}</h3>
                <div className="space-y-3">
                  {deliveryOptions.map((opt) => (
                    <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-sm border-2 cursor-pointer transition-colors ${deliveryMethod === opt.key ? "border-black bg-stone-50" : "border-gray-100 hover:border-gray-200"}`}>
                      <input type="radio" name="delivery" checked={deliveryMethod === opt.key} onChange={() => setDeliveryMethod(opt.key)} className="w-4 h-4 text-secondary focus:ring-black" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-black">{opt.label}</span>
                      </div>
                      <span className={`text-sm font-semibold ${opt.price === 0 ? "text-green-600" : "text-black"}`}>
                        {opt.price === 0 ? t("cart.free") : `${opt.price} RSD`}
                      </span>
                    </label>
                  ))}
                  {deliveryMethod === "standard" && subtotal > FREE_SHIPPING_THRESHOLD && (
                    <p className="text-xs text-green-600 flex items-center gap-1 ml-7"><CheckCircle className="w-3 h-3" /> {t("cart.freeDeliveryForOrders")}</p>
                  )}
                </div>
              </div>

              {/* B2B Options Box — only for B2B users */}
              {isB2b && (
                <div className="bg-white rounded-sm shadow-sm p-6 border-2 border-black">
                  <h3 className="text-sm font-semibold text-secondary mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> {t("cart.b2bOptions")}</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={b2bNoOnlinePayment} onChange={(e) => setB2bNoOnlinePayment(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-black" />
                      <span className="text-sm text-black">{t("cart.orderWithoutOnlinePayment")}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={b2bInvoice} onChange={(e) => setB2bInvoice(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-black" />
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-black">{t("cart.invoicePayment")}</span>
                      </div>
                    </label>
                    <div className="bg-stone-50 rounded p-3 text-xs text-gray-600 flex items-start gap-2">
                      <Store className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      <span>{t("cart.minB2bOrder")}: <strong className="text-black">{MIN_B2B_ORDER.toLocaleString("sr-RS")} RSD</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div className="bg-white rounded-sm shadow-sm p-6">
                <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-secondary" /> {t("cart.orderNotes")}</h3>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  placeholder={t("cart.orderNotesPlaceholder")}
                  className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm resize-none focus:border-black focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <Link href="/products" className="inline-flex items-center gap-2 text-secondary hover:text-black text-sm font-medium transition-colors">
                  &larr; {t("cart.continueShoppingLink")}
                </Link>
                <button onClick={handleSaveCart} className="inline-flex items-center gap-2 text-gray-500 hover:text-secondary text-sm font-medium transition-colors border border-gray-200 hover:border-black px-4 py-2 rounded">
                  <Save className="w-4 h-4" /> {t("cart.saveCart")}
                </button>
              </div>

              {savedNotice && (
                <div className="bg-green-50 border border-green-200 rounded-sm p-3 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" /> {t("cart.cartSaved")}
                </div>
              )}
            </div>

            {/* ORDER SUMMARY */}
            <div>
              <div className="bg-white rounded-sm shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-bold text-black mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("cart.orderSummary")}</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">{t("cart.subtotal")}</span><span className="font-medium">{subtotal.toLocaleString("sr-RS")} RSD</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t("cart.delivery")} ({selectedDelivery.label.split("(")[0].trim()})</span><span className="font-medium">{shipping === 0 ? t("cart.free") : `${shipping} RSD`}</span></div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-lg font-bold"><span>{t("cart.total")}</span><span>{total.toLocaleString("sr-RS")} RSD</span></div>
                </div>

                {hasOutOfStock && (
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-sm p-3 flex items-start gap-2 text-sm text-orange-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{t("cart.outOfStockWarning")}</span>
                  </div>
                )}

                <button onClick={handleCheckout} disabled={inStockItems.length === 0} className="w-full bg-black hover:bg-stone-800 text-white py-3.5 rounded font-medium mt-6 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {t("cart.proceedToCheckout")} <ChevronRight className="w-4 h-4" />
                </button>

                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-secondary" /> {t("cart.freeShippingOver")}</div>
                  <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-secondary" /> {t("cart.securePayment")}</div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  {["Visa", "Mastercard", "PayPal", "Pouzece"].map((p) => (
                    <span key={p} className="px-2 py-1 bg-gray-50 rounded text-[10px] text-gray-400 font-medium">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECOMMENDED */}
        <section className="mt-16 mb-16">
          <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("cart.recommended")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recommended.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="product-card bg-white rounded-sm shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="aspect-square overflow-hidden"><img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
                <div className="p-4">
                  <span className="text-xs text-secondary font-medium uppercase tracking-wider">{p.brand}</span>
                  <h3 className="text-sm font-medium text-black mt-1 line-clamp-2">{p.name}</h3>
                  <div className="flex items-center gap-0.5 mt-2">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < p.rating ? "fill-[#735b28] text-secondary" : "text-gray-200"}`} />)}</div>
                  <span className="text-base font-bold text-black mt-2 block">{p.price.toLocaleString("sr-RS")} RSD</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
