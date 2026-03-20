"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/stores/cart-store";
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
  const [items, setItems] = useState(initialItems);
  const { addItem } = useCartStore();

  const removeItem = async (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
    try {
      await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to remove wishlist item:", err);
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
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#999] mb-6">
          <Link href="/" className="hover:text-secondary">Početna</Link>
          <span>/</span>
          <span className="text-[#333]">Lista želja</span>
        </div>

        {items.length > 0 ? (
          <>
            {/* Title + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-secondary fill-[#735b28]" />
                <h1 className="text-3xl font-bold text-black" style={{ fontFamily: "'Noto Serif', serif" }}>Lista Želja</h1>
                <span className="text-sm text-[#999]">({items.length} proizvoda)</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 text-[#666] text-sm rounded-sm hover:bg-stone-100 transition-colors">
                  <Share2 className="w-4 h-4" /> Podeli listu
                </button>
                <button onClick={addAllToCart} className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-stone-800 text-white text-sm font-medium rounded-sm transition-colors">
                  <ShoppingCart className="w-4 h-4" /> Dodaj sve u korpu
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map((item) => {
                const badge = discountBadge(item);
                return (
                  <div key={item.productId} className="bg-white rounded-sm overflow-hidden shadow-sm border border-stone-200/50 group hover:shadow-md transition-all">
                    <div className="relative overflow-hidden aspect-square">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {badge && (
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white bg-[#c0392b]">{badge}</span>
                      )}
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="px-4 py-2 bg-[#333] text-white text-xs font-semibold rounded-full">Nema na lageru</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4 text-[#c0392b]" />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-secondary mb-1">{item.brand}</p>
                      <h3 className="text-sm font-medium text-black mb-2 line-clamp-2 leading-snug">{item.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.rating) ? "fill-[#735b28] text-secondary" : "text-[#c4c7c7]"}`} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {item.oldPrice && item.oldPrice > item.price ? (
                          <>
                            <span className="text-base font-bold text-[#c0392b]">{item.price.toLocaleString()} RSD</span>
                            <span className="text-xs text-[#999] line-through">{item.oldPrice.toLocaleString()} RSD</span>
                          </>
                        ) : (
                          <span className="text-base font-bold text-black">{item.price.toLocaleString()} RSD</span>
                        )}
                      </div>
                      <button
                        disabled={!item.inStock}
                        onClick={() => addToCart(item)}
                        className={`w-full py-2.5 text-sm font-medium rounded-sm transition-colors ${
                          item.inStock
                            ? "bg-black hover:bg-stone-800 text-white"
                            : "bg-[#c4c7c7] text-[#999] cursor-not-allowed"
                        }`}
                      >
                        {item.inStock ? "Dodaj u korpu" : "Nedostupno"}
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
            <Heart className="w-16 h-16 text-[#c4c7c7] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>Vaša lista želja je prazna</h2>
            <p className="text-[#666] mb-6">Dodajte proizvode koje želite da sačuvate za kasnije</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-stone-800 text-white font-medium rounded-sm transition-colors">
              Istraži proizvode
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
