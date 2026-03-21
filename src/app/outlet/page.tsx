"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Star,
  Flame,
  Clock,
  Filter,
} from "lucide-react";

const outletProducts = [
  { id: 1, name: "Vitamino Color Šampon 300ml", brand: "L'Oréal Professionnel", regularPrice: 3290, salePrice: 1290, discount: 61, rating: 4.5, image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop" },
  { id: 2, name: "Moisture Recovery Maska 250ml", brand: "TIGI", regularPrice: 2490, salePrice: 990, discount: 60, rating: 4.3, image: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=500&h=500&fit=crop" },
  { id: 3, name: "Session Label Gel 300ml", brand: "Wella Professionals", regularPrice: 1890, salePrice: 690, discount: 63, rating: 4.1, image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&h=500&fit=crop" },
  { id: 4, name: "Bed Head Masterpiece Lak 340ml", brand: "TIGI", regularPrice: 1690, salePrice: 590, discount: 65, rating: 4.2, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop" },
  { id: 5, name: "Curl Contour Šampon 250ml", brand: "L'Oréal Professionnel", regularPrice: 2890, salePrice: 1190, discount: 59, rating: 4.4, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop" },
  { id: 6, name: "Color Freeze Regenerator 200ml", brand: "Schwarzkopf", regularPrice: 1990, salePrice: 790, discount: 60, rating: 4.6, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=500&fit=crop" },
  { id: 7, name: "Osis+ Dust It Puder 10g", brand: "Schwarzkopf", regularPrice: 1290, salePrice: 490, discount: 62, rating: 4.0, image: "https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=500&h=500&fit=crop" },
  { id: 8, name: "Aura Botanica Maska 200ml", brand: "Kérastase", regularPrice: 4290, salePrice: 1690, discount: 61, rating: 4.7, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&h=500&fit=crop" },
];

export default function OutletPage() {
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [discountFilter, setDiscountFilter] = useState<string>("all");
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 27, seconds: 42 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleLike = (id: number) => {
    const next = new Set(liked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLiked(next);
  };

  const filtered = discountFilter === "all" ? outletProducts
    : discountFilter === "50+" ? outletProducts.filter((p) => p.discount >= 50 && p.discount < 60)
    : outletProducts.filter((p) => p.discount >= 60);

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#c0392b] to-[#e74c3c] overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-6 h-6 text-secondary" />
            <span className="text-white/80 text-sm font-semibold tracking-widest uppercase">Posebna Ponuda</span>
            <Flame className="w-6 h-6 text-secondary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: "'Noto Serif', serif" }}>
            OUTLET — Do <span className="text-secondary">70%</span> Popusta
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">Iskoristite neponovljive cene na premium proizvode za negu i styling kose</p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Clock className="w-5 h-5 text-secondary" />
            <span className="text-white/80 text-sm font-medium">Ponuda ističe za:</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            {[
              { value: timeLeft.days, label: "Dana" },
              { value: timeLeft.hours, label: "Sati" },
              { value: timeLeft.minutes, label: "Min" },
              { value: timeLeft.seconds, label: "Sek" },
            ].map((t) => (
              <div key={t.label} className="bg-white/10 backdrop-blur-sm rounded-sm px-4 py-3 min-w-[70px]">
                <p className="text-2xl md:text-3xl font-bold text-white">{String(t.value).padStart(2, "0")}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <p className="text-sm text-stone-500">{filtered.length} proizvoda</p>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            {[
              { key: "all", label: "Svi" },
              { key: "50+", label: "50-59%" },
              { key: "60+", label: "60%+" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setDiscountFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  discountFilter === f.key ? "bg-[#c0392b] text-white" : "bg-white border border-stone-200 text-stone-500 hover:border-[#c0392b] hover:text-[#c0392b]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-sm overflow-hidden shadow-sm border border-stone-200/50 group hover:shadow-md transition-all">
              <div className="relative overflow-hidden aspect-square">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-[#c0392b]">
                  -{product.discount}%
                </span>
                <button
                  onClick={() => toggleLike(product.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <Heart className={`w-4 h-4 ${liked.has(product.id) ? "fill-[#c0392b] text-[#c0392b]" : "text-stone-500"}`} />
                </button>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-secondary mb-1">{product.brand}</p>
                <h3 className="text-sm font-medium text-black mb-2 line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? "fill-[#735b28] text-secondary" : "text-[#c4c7c7]"}`} />
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base font-bold text-[#c0392b]">{product.salePrice.toLocaleString()} RSD</span>
                  <span className="text-xs text-stone-400 line-through">{product.regularPrice.toLocaleString()} RSD</span>
                </div>
                <button className="w-full py-2.5 bg-[#c0392b] hover:bg-[#a93226] text-white text-sm font-medium rounded-sm transition-colors">
                  Dodaj u korpu
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
