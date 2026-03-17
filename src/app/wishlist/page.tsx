"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Star,
  Share2,
  ShoppingCart,
  X,
} from "lucide-react";

const wishlistItems = [
  { id: 1, name: "Absolut Repair Šampon 300ml", brand: "L'Oréal Professionnel", price: 3490, salePrice: 2790, badge: "-20%", rating: 4.8, inStock: true, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop" },
  { id: 2, name: "No.3 Hair Perfector 100ml", brand: "Olaplex", price: 3290, salePrice: null, badge: null, rating: 4.9, inStock: true, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop" },
  { id: 3, name: "Elixir Ultime Ulje 100ml", brand: "Kérastase", price: 4590, salePrice: 3490, badge: "-24%", rating: 4.7, inStock: true, image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&h=500&fit=crop" },
  { id: 4, name: "Igora Royal 7-1 60ml", brand: "Schwarzkopf", price: 790, salePrice: null, badge: null, rating: 4.6, inStock: false, image: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=500&h=500&fit=crop" },
  { id: 5, name: "Oil Reflections Ulje 100ml", brand: "Wella Professionals", price: 2990, salePrice: 2290, badge: "AKCIJA", rating: 4.9, inStock: true, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=500&fit=crop" },
  { id: 6, name: "Nutritive Bain Satin 250ml", brand: "Kérastase", price: 3290, salePrice: null, badge: null, rating: 4.8, inStock: true, image: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&h=500&fit=crop" },
];

export default function WishlistPage() {
  const [items, setItems] = useState(wishlistItems);

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#999] mb-6">
          <Link href="/" className="hover:text-[#c8a96e]">Početna</Link>
          <span>/</span>
          <span className="text-[#333]">Lista želja</span>
        </div>

        {items.length > 0 ? (
          <>
            {/* Title + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-[#c8a96e] fill-[#c8a96e]" />
                <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>Lista Želja</h1>
                <span className="text-sm text-[#999]">({items.length} proizvoda)</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-[#e5e5e5] text-[#666] text-sm rounded-lg hover:bg-[#f5f5f5] transition-colors">
                  <Share2 className="w-4 h-4" /> Podeli listu
                </button>
                <button className="flex items-center gap-2 px-5 py-2 bg-[#c8a96e] hover:bg-[#a8894e] text-white text-sm font-medium rounded-lg transition-colors">
                  <ShoppingCart className="w-4 h-4" /> Dodaj sve u korpu
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e5e5e5]/50 group hover:shadow-md transition-all">
                  <div className="relative overflow-hidden aspect-square">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {item.badge && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white bg-[#c0392b]">{item.badge}</span>
                    )}
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="px-4 py-2 bg-[#333] text-white text-xs font-semibold rounded-full">Nema na lageru</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-[#c0392b]" />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8a96e] mb-1">{item.brand}</p>
                    <h3 className="text-sm font-medium text-[#1a1a1a] mb-2 line-clamp-2 leading-snug">{item.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.rating) ? "fill-[#c8a96e] text-[#c8a96e]" : "text-[#e5e5e5]"}`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {item.salePrice ? (
                        <>
                          <span className="text-base font-bold text-[#c0392b]">{item.salePrice.toLocaleString()} RSD</span>
                          <span className="text-xs text-[#999] line-through">{item.price.toLocaleString()} RSD</span>
                        </>
                      ) : (
                        <span className="text-base font-bold text-[#1a1a1a]">{item.price.toLocaleString()} RSD</span>
                      )}
                    </div>
                    <button
                      disabled={!item.inStock}
                      className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        item.inStock
                          ? "bg-[#c8a96e] hover:bg-[#a8894e] text-white"
                          : "bg-[#e5e5e5] text-[#999] cursor-not-allowed"
                      }`}
                    >
                      {item.inStock ? "Dodaj u korpu" : "Nedostupno"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-[#e5e5e5] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Vaša lista želja je prazna</h2>
            <p className="text-[#666] mb-6">Dodajte proizvode koje želite da sačuvate za kasnije</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[#c8a96e] hover:bg-[#a8894e] text-white font-medium rounded-lg transition-colors">
              Istraži proizvode
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
