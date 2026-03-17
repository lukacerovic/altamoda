"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, Trash2, Minus, Plus, ChevronRight, Tag,
  Sparkles, Truck, Shield, Star,
  CheckCircle, XCircle, FileText, Save, MessageSquare, Store,
} from "lucide-react";

const initialItems = [
  { id: 1, brand: "L'Oreal", name: "Majirel 7.0 Srednje Plava", price: 890, quantity: 3, image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=200&h=200&fit=crop" },
  { id: 2, brand: "Kerastase", name: "Elixir Ultime Serum 100ml", price: 3200, quantity: 1, image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=200&h=200&fit=crop" },
  { id: 3, brand: "Olaplex", name: "No.3 Hair Perfector 100ml", price: 2850, quantity: 2, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=200&h=200&fit=crop" },
];

const recommended = [
  { id: 5, brand: "L'Oreal", name: "Oxydant Creme 6% 1000ml", price: 1200, rating: 5, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop" },
  { id: 6, brand: "Kerastase", name: "Nutritive Bain Satin", price: 3400, rating: 4, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop" },
  { id: 7, brand: "Olaplex", name: "No.4 Bond Šampon 250ml", price: 3600, rating: 5, image: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=500&h=500&fit=crop" },
  { id: 8, brand: "Moroccanoil", name: "Treatment Original 100ml", price: 4200, rating: 4, image: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&h=500&fit=crop" },
];

export default function CartPage() {
  const [items, setItems] = useState(initialItems);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [b2bNoOnlinePayment, setB2bNoOnlinePayment] = useState(false);
  const [b2bInvoice, setB2bInvoice] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  const updateQty = (id: number, delta: number) => {
    setItems(items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };
  const removeItem = (id: number) => setItems(items.filter((item) => item.id !== id));

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const promoDiscount = promoApplied ? Math.round(subtotal * 0.1) : 0;

  const deliveryOptions = [
    { key: "standard", label: "Standardna dostava (2-4 dana)", price: subtotal > 5000 ? 0 : 350, note: subtotal > 5000 ? "Besplatno za porudzbine preko 5.000 RSD" : "350 RSD" },
    { key: "express", label: "Ekspres dostava (1 dan)", price: 690, note: "690 RSD" },
    { key: "pickup", label: "Preuzimanje u prodavnici", price: 0, note: "Besplatno" },
  ];

  const selectedDelivery = deliveryOptions.find((d) => d.key === deliveryMethod)!;
  const shipping = selectedDelivery.price;
  const total = subtotal - promoDiscount + shipping;

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "POPUST10") {
      setPromoApplied(true);
      setPromoError(false);
    } else if (promoCode) {
      setPromoApplied(false);
      setPromoError(true);
    }
  };

  const handleSaveCart = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#c8a96e]">Pocetna</Link><ChevronRight className="w-3 h-3" /><span className="text-[#1a1a1a]">Korpa</span>
        </nav>

        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Vasa Korpa ({items.length})</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">Vasa korpa je prazna</h2>
            <p className="text-gray-500 mb-6">Dodajte proizvode u korpu i nastavite sa kupovinom.</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-[#c8a96e] hover:bg-[#a8894e] text-white px-6 py-3 rounded font-medium transition-colors">Nastavite Kupovinu</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* CART ITEMS */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6 flex gap-4">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-[#c8a96e] font-medium uppercase tracking-wider">{item.brand}</span>
                        <h3 className="text-sm md:text-base font-medium text-[#1a1a1a] mt-1">{item.name}</h3>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-[#c0392b] transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-200 rounded">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold text-[#1a1a1a]">{(item.price * item.quantity).toLocaleString("sr-RS")} RSD</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Delivery Options */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2"><Truck className="w-4 h-4 text-[#c8a96e]" /> Nacin dostave</h3>
                <div className="space-y-3">
                  {deliveryOptions.map((opt) => (
                    <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${deliveryMethod === opt.key ? "border-[#c8a96e] bg-[#faf7f2]" : "border-gray-100 hover:border-gray-200"}`}>
                      <input type="radio" name="delivery" checked={deliveryMethod === opt.key} onChange={() => setDeliveryMethod(opt.key)} className="w-4 h-4 text-[#c8a96e] focus:ring-[#c8a96e]" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-[#1a1a1a]">{opt.label}</span>
                      </div>
                      <span className={`text-sm font-semibold ${opt.price === 0 ? "text-green-600" : "text-[#1a1a1a]"}`}>
                        {opt.price === 0 ? "Besplatno" : `${opt.price} RSD`}
                      </span>
                    </label>
                  ))}
                  {deliveryMethod === "standard" && subtotal > 5000 && (
                    <p className="text-xs text-green-600 flex items-center gap-1 ml-7"><CheckCircle className="w-3 h-3" /> Besplatna dostava za porudzbine preko 5.000 RSD</p>
                  )}
                </div>
              </div>

              {/* B2B Options Box */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-[#c8a96e]">
                <h3 className="text-sm font-semibold text-[#c8a96e] mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> B2B Opcije</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={b2bNoOnlinePayment} onChange={(e) => setB2bNoOnlinePayment(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#c8a96e] focus:ring-[#c8a96e]" />
                    <span className="text-sm text-[#1a1a1a]">Naruci bez online placanja</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={b2bInvoice} onChange={(e) => setB2bInvoice(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#c8a96e] focus:ring-[#c8a96e]" />
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-[#1a1a1a]">Placanje po fakturi</span>
                    </div>
                  </label>
                  <div className="bg-[#faf7f2] rounded p-3 text-xs text-gray-600 flex items-start gap-2">
                    <Store className="w-4 h-4 text-[#c8a96e] flex-shrink-0 mt-0.5" />
                    <span>Minimalni iznos B2B porudzbine: <strong className="text-[#1a1a1a]">10.000 RSD</strong></span>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#c8a96e]" /> Napomena uz porudzbinu</h3>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  placeholder="Unesite dodatne napomene za vasu porudzbinu (opciono)..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:border-[#c8a96e] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <Link href="/products" className="inline-flex items-center gap-2 text-[#c8a96e] hover:text-[#a8894e] text-sm font-medium transition-colors">
                  &larr; Nastavite kupovinu
                </Link>
                <button onClick={handleSaveCart} className="inline-flex items-center gap-2 text-gray-500 hover:text-[#c8a96e] text-sm font-medium transition-colors border border-gray-200 hover:border-[#c8a96e] px-4 py-2 rounded">
                  <Save className="w-4 h-4" /> Sacuvaj korpu za kasnije
                </button>
              </div>

              {/* Save confirmation */}
              {savedNotice && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" /> Korpa je sacuvana! Mozete joj pristupiti sa bilo kog uredjaja.
                </div>
              )}
            </div>

            {/* ORDER SUMMARY */}
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Pregled porudzbine</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Medjuzbir</span><span className="font-medium">{subtotal.toLocaleString("sr-RS")} RSD</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Dostava ({selectedDelivery.label.split("(")[0].trim()})</span><span className="font-medium">{shipping === 0 ? "Besplatno" : `${shipping} RSD`}</span></div>
                  {promoApplied && <div className="flex justify-between text-green-600"><span>Popust (10%)</span><span>-{promoDiscount.toLocaleString("sr-RS")} RSD</span></div>}
                </div>

                {/* Promo code */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={promoCode} onChange={(e) => { setPromoCode(e.target.value); setPromoError(false); }} placeholder="Promo kod" className="w-full border border-gray-200 rounded pl-9 pr-3 py-2.5 text-sm" />
                    </div>
                    <button onClick={handleApplyPromo} className="px-4 py-2.5 border border-[#c8a96e] text-[#c8a96e] rounded text-sm font-medium hover:bg-[#c8a96e] hover:text-white transition-colors">Primeni</button>
                  </div>
                  {/* Promo validation states */}
                  {promoApplied && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 text-xs">
                      <CheckCircle className="w-4 h-4" />
                      <span>Kod POPUST10 primenjen! Usteda: {promoDiscount.toLocaleString("sr-RS")} RSD</span>
                    </div>
                  )}
                  {promoError && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-xs">
                      <XCircle className="w-4 h-4" />
                      <span>Kod nije validan ili je istekao</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-lg font-bold"><span>Ukupno</span><span>{total.toLocaleString("sr-RS")} RSD</span></div>
                </div>

                <button className="w-full bg-[#c8a96e] hover:bg-[#a8894e] text-white py-3.5 rounded font-medium mt-6 transition-all flex items-center justify-center gap-2">
                  Nastavi na placanje <ChevronRight className="w-4 h-4" />
                </button>

                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#c8a96e]" /> Besplatna dostava preko 5.000 RSD</div>
                  <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#c8a96e]" /> Sigurno online placanje</div>
                </div>

                {/* Payment badges */}
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
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Preporuceni proizvodi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recommended.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="product-card bg-white rounded-lg shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="aspect-square overflow-hidden"><img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
                <div className="p-4">
                  <span className="text-xs text-[#c8a96e] font-medium uppercase tracking-wider">{p.brand}</span>
                  <h3 className="text-sm font-medium text-[#1a1a1a] mt-1 line-clamp-2">{p.name}</h3>
                  <div className="flex items-center gap-0.5 mt-2">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < p.rating ? "fill-[#c8a96e] text-[#c8a96e]" : "text-gray-200"}`} />)}</div>
                  <span className="text-base font-bold text-[#1a1a1a] mt-2 block">{p.price.toLocaleString("sr-RS")} RSD</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
