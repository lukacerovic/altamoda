"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Heart,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Leaf,
  ShieldCheck,
  Award,
  Truck,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Instagram,
  Mail,
  Send,
  X,
  TrendingUp,
  Clock,
  MapPin,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import CookieConsent from "@/components/CookieConsent";

/* ─── Image URLs ─── */
const productImages: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop",
  2: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=500&h=500&fit=crop",
  3: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&h=500&fit=crop",
  4: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop",
  5: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop",
  6: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=500&fit=crop",
  7: "https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=500&h=500&fit=crop",
  8: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&h=500&fit=crop",
  9: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=500&h=500&fit=crop",
  10: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500&h=500&fit=crop",
  11: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=500&h=500&fit=crop",
  12: "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&h=500&fit=crop",
  13: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop",
  14: "https://images.unsplash.com/photo-1599849556829-6cef53ccb3d3?w=500&h=500&fit=crop",
  15: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop",
  16: "https://images.unsplash.com/photo-1570194065650-d99fb4ee8249?w=500&h=500&fit=crop",
  17: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&h=500&fit=crop",
  18: "https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=500&h=500&fit=crop",
  19: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&h=500&fit=crop",
  20: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500&h=500&fit=crop",
};

const instagramImages = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=300&h=300&fit=crop",
];

/* ─── Trust badges ─── */
const trustBadges = [
  { icon: Leaf, title: "Prirodna Formula", desc: "Nežna nega za vašu kosu sa premium sastojcima" },
  { icon: ShieldCheck, title: "Bez Okrutnosti", desc: "Naši proizvodi nisu testirani na životinjama" },
  { icon: Award, title: "Stručno Odobreno", desc: "Testirano za sigurnost i vidljive rezultate" },
  { icon: Truck, title: "Besplatna Dostava", desc: "Za porudžbine preko 5.000 RSD, bez dodatnih troškova" },
];

/* ─── Product type ─── */
type Product = { id: number; brand: string; name: string; price: number; oldPrice?: number; badge?: string; rating: number };

/* ─── Product tabs data ─── */
const productTabs = ["Šamponi", "Maske", "Serumi", "Ulja"];

const tabbedProducts: Record<string, Product[]> = {
  "Šamponi": [
    { id: 7, brand: "L'Oreal", name: "Metal Detox Šampon 300ml", price: 2400, rating: 5 },
    { id: 10, brand: "Wella", name: "Ultimate Repair Šampon 250ml", price: 2800, rating: 4 },
    { id: 11, brand: "Olaplex", name: "No.4 Bond Maintenance Šampon", price: 3600, badge: "HIT", rating: 5 },
    { id: 15, brand: "Matrix", name: "Total Results So Long Šampon 300ml", price: 1950, rating: 4 },
  ],
  "Maske": [
    { id: 8, brand: "Schwarzkopf", name: "BlondMe Bond Maska 200ml", price: 3100, badge: "NOVO", rating: 4 },
    { id: 14, brand: "Kerastase", name: "Nutritive Bain Satin 200ml", price: 3400, rating: 5 },
    { id: 3, brand: "Kerastase", name: "Elixir Ultime Maska 200ml", oldPrice: 4500, price: 3200, badge: "-29%", rating: 5 },
    { id: 16, brand: "L'Oreal", name: "Absolut Repair Gold Maska 250ml", price: 2900, rating: 5 },
  ],
  "Serumi": [
    { id: 9, brand: "Kerastase", name: "Genesis Serum Anti-Chute 90ml", price: 5200, badge: "NOVO", rating: 5 },
    { id: 5, brand: "Moroccanoil", name: "Treatment Original 100ml", price: 4200, rating: 4 },
    { id: 4, brand: "Olaplex", name: "No.3 Hair Perfector 100ml", oldPrice: 3800, price: 2850, badge: "-25%", rating: 5 },
    { id: 17, brand: "Wella", name: "Oil Reflections Luminous Serum 100ml", price: 3100, rating: 4 },
  ],
  "Ulja": [
    { id: 18, brand: "Moroccanoil", name: "Treatment Light 50ml", price: 3600, badge: "HIT", rating: 5 },
    { id: 19, brand: "Kerastase", name: "Elixir Ultime L'Huile 100ml", price: 4800, rating: 5 },
    { id: 20, brand: "L'Oreal", name: "Mythic Oil Original 100ml", price: 2700, rating: 4 },
    { id: 6, brand: "Schwarzkopf", name: "Oil Ultime Argan Finishing Oil 100ml", price: 2200, rating: 4 },
  ],
};

/* ─── Bestseller products ─── */
const bestsellers: Product[] = [
  { id: 4, brand: "Olaplex", name: "No.3 Hair Perfector 100ml", price: 2850, badge: "#1", rating: 5 },
  { id: 11, brand: "Olaplex", name: "No.4 Bond Maintenance Šampon 250ml", price: 3600, badge: "#2", rating: 5 },
  { id: 5, brand: "Moroccanoil", name: "Treatment Original 100ml", price: 4200, badge: "#3", rating: 5 },
  { id: 9, brand: "Kerastase", name: "Genesis Serum Anti-Chute 90ml", price: 5200, badge: "#4", rating: 5 },
  { id: 14, brand: "Kerastase", name: "Nutritive Bain Satin 200ml", price: 3400, badge: "#5", rating: 5 },
  { id: 12, brand: "Moroccanoil", name: "Hydrating Styling Cream 300ml", price: 3200, badge: "#6", rating: 5 },
  { id: 7, brand: "L'Oreal", name: "Metal Detox Šampon 300ml", price: 2400, badge: "#7", rating: 4 },
  { id: 8, brand: "Schwarzkopf", name: "BlondMe Bond Maska 200ml", price: 3100, badge: "#8", rating: 4 },
];

/* ─── New arrivals ─── */
const newArrivals: Product[] = [
  { id: 15, brand: "Matrix", name: "Total Results So Long Šampon 300ml", price: 1950, badge: "NOVO", rating: 4 },
  { id: 16, brand: "L'Oreal", name: "Absolut Repair Gold Maska 250ml", price: 2900, badge: "NOVO", rating: 5 },
  { id: 17, brand: "Wella", name: "Oil Reflections Luminous Serum 100ml", price: 3100, badge: "NOVO", rating: 4 },
  { id: 18, brand: "Moroccanoil", name: "Treatment Light 50ml", price: 3600, badge: "NOVO", rating: 5 },
];

/* ─── Sale products ─── */
const saleProducts: Product[] = [
  { id: 1, brand: "L'Oreal", name: "Majirel 7.0 Srednje Plava", oldPrice: 1290, price: 890, badge: "-31%", rating: 5 },
  { id: 2, brand: "Schwarzkopf", name: "Igora Royal 6.1 Tamno Pepeljasta", oldPrice: 1350, price: 950, badge: "-30%", rating: 4 },
  { id: 3, brand: "Kerastase", name: "Elixir Ultime Serum", oldPrice: 4500, price: 3200, badge: "-29%", rating: 5 },
  { id: 4, brand: "Olaplex", name: "No.3 Hair Perfector", oldPrice: 3800, price: 2850, badge: "-25%", rating: 5 },
  { id: 5, brand: "Moroccanoil", name: "Treatment Original 100ml", oldPrice: 4200, price: 3150, badge: "-25%", rating: 4 },
  { id: 6, brand: "Wella", name: "Koleston Perfect 8/0", oldPrice: 1100, price: 780, badge: "-29%", rating: 4 },
  { id: 13, brand: "L'Oreal", name: "Vitamino Color Šampon 500ml", oldPrice: 2800, price: 2100, badge: "-25%", rating: 4 },
  { id: 10, brand: "Wella", name: "Ultimate Repair Šampon 250ml", oldPrice: 3200, price: 2800, badge: "-13%", rating: 4 },
];

/* ─── ProductCard ─── */
function ProductCard({ product, showOld = false }: { product: Product; showOld?: boolean }) {
  const [liked, setLiked] = useState(false);
  return (
    <Link href={`/products/${product.id}`} className="product-card bg-white rounded-2xl border border-[#e0d8cc] hover:border-[#b07a87] transition-all group relative overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-[#f5f0e8] rounded-t-2xl">
        <img
          src={productImages[product.id] || "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.badge && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded-full ${
            product.badge === "NOVO" ? "bg-[#8c4a5a] text-white"
            : product.badge === "HIT" ? "bg-[#2d2d2d] text-white"
            : product.badge.startsWith("#") ? "bg-[#c4883a] text-white"
            : "bg-[#b5453a] text-white"
          }`}>
            {product.badge}
          </span>
        )}
        <button onClick={(e) => { e.preventDefault(); setLiked(!liked); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10">
          <Heart className={`w-4 h-4 ${liked ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-[#b07a87]"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => e.preventDefault()} className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white text-sm font-medium py-2.5 rounded-full transition-colors">
            Dodaj u korpu
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-[#8c4a5a] font-medium tracking-wider">{product.brand}</span>
        <h3 className="text-sm font-medium text-[#2d2d2d] mt-1 line-clamp-2 flex-1">{product.name}</h3>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < product.rating ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-[#e0d8cc]"}`} />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {showOld && product.oldPrice && <span className="text-sm text-[#b07a87] line-through">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
          <span className="text-base font-semibold text-[#2d2d2d]">{product.price.toLocaleString("sr-RS")} RSD</span>
        </div>
      </div>
    </Link>
  );
}

/* ─── ProductCarousel ─── */
function ProductCarousel({
  products,
  showOld = false,
  autoSlideInterval = 4000,
}: {
  products: Product[];
  showOld?: boolean;
  autoSlideInterval?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w < 640) setItemsPerView(1);
      else if (w < 1024) setItemsPerView(2);
      else setItemsPerView(4);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalSlides = Math.max(1, products.length - itemsPerView + 1);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, totalSlides - 1));
  }, [totalSlides]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
    },
    [totalSlides]
  );

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  useEffect(() => {
    timerRef.current = setInterval(goNext, autoSlideInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [goNext, autoSlideInterval]);

  const pauseAutoSlide = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const resumeAutoSlide = () => {
    timerRef.current = setInterval(goNext, autoSlideInterval);
  };

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const slidePercent = 100 / itemsPerView;
  const translateX = -(currentIndex * slidePercent);

  return (
    <div
      className="relative"
      onMouseEnter={pauseAutoSlide}
      onMouseLeave={resumeAutoSlide}
    >
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${translateX}%)` }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              className="flex-shrink-0 px-8 sm:px-2"
              style={{ width: `${slidePercent}%` }}
            >
              <ProductCard product={p} showOld={showOld} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={goPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-white border border-[#e0d8cc] flex items-center justify-center hover:border-[#8c4a5a] transition-all z-10 group"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 text-[#b07a87] group-hover:text-[#8c4a5a] transition-colors" />
      </button>

      <button
        onClick={goNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-white border border-[#e0d8cc] flex items-center justify-center hover:border-[#8c4a5a] transition-all z-10 group"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 text-[#b07a87] group-hover:text-[#8c4a5a] transition-colors" />
      </button>

      <div className="flex items-center justify-center gap-2 mt-6">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex ? "bg-[#8c4a5a]" : "bg-[#e0d8cc]"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function HomePage() {
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [activeTab, setActiveTab] = useState("Šamponi");

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Header />

      {/* HERO */}
      <section className="relative h-[600px] md:h-[750px] overflow-hidden">
        <img
          src="/hero.png"
          alt="Hero - Professional hair care products"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2d2d2d]/70 via-[#2d2d2d]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2d2d2d]/30 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] mb-6 text-white animate-slideUp" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Profesionalna{" "}
              <em className="italic text-[#b07a87]">Nega</em>
            </h1>
            <p className="text-white/60 text-base md:text-lg mb-8 max-w-lg animate-slideUp leading-relaxed" style={{ animationDelay: "0.1s" }}>
              Započnite dan sa nežnom negom i hranjivim sastojcima koji su dizajnirani da probudu prirodnu lepotu vaše kose.
            </p>
            <div className="flex flex-wrap items-center gap-6 animate-slideUp" style={{ animationDelay: "0.2s" }}>
              <Link href="/products" className="inline-flex items-center gap-2 bg-white text-[#2d2d2d] px-8 py-3.5 rounded-full font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm tracking-wide">
                Kupujte Sada
              </Link>
            </div>
            <div className="absolute bottom-8 right-8 text-white/40 text-xs tracking-widest hidden md:block animate-fadeIn" style={{ animationDelay: "0.8s", writingMode: "vertical-rl" }}>
              Scroll Down
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="py-10 bg-white border-b border-[#e0d8cc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.title} className="flex flex-col items-center text-center p-6 rounded-2xl border border-[#e0d8cc] bg-white hover:border-[#b07a87] transition-colors">
                  <Icon className="w-7 h-7 text-[#8c4a5a] mb-3" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold text-[#2d2d2d]">{badge.title}</h3>
                  <p className="text-xs text-[#b07a87] mt-1.5 leading-relaxed">{badge.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* EDITORIAL HEADING */}
      <section className="py-16 md:py-20 text-center bg-[#f5f0e8]">
        <p className="text-3xl md:text-4xl lg:text-5xl text-[#2d2d2d] font-light italic max-w-3xl mx-auto px-4 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Osvežite svoju kosu, negujte sebe, obnovite sjaj.
        </p>
      </section>

      {/* TABBED PRODUCTS (4 per tab, 4 tabs) */}
      <section className="py-16 bg-white border-y border-[#e0d8cc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-10">
            {productTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-[#2d2d2d] text-white"
                    : "bg-transparent text-[#6b6b6b] border border-[#e0d8cc] hover:border-[#b07a87] hover:text-[#2d2d2d]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {tabbedProducts[activeTab]?.map((p) => (
              <ProductCard key={p.id} product={p} showOld={!!p.oldPrice} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/products" className="inline-flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">
              Pogledajte Sve Proizvode
            </Link>
          </div>
        </div>
      </section>

      {/* ECO-FRIENDLY BANNER */}
      <section className="relative overflow-hidden">
        <div className="bg-[#38202a] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <span className="text-[#b07a87] text-xs tracking-[0.2em] font-medium uppercase">Za Profesionalce</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mt-3 mb-5 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Ekološki,{" "}
                <em className="italic text-[#b07a87]">Prijateljski</em>{" "}
                za Kosu
              </h2>
              <p className="text-white/50 mb-8 max-w-lg text-sm leading-relaxed">
                Naši proizvodi su napravljeni sa prirodnim sastojcima, bez štetnih hemikalija. Brinemo o vašoj kosi i o planeti.
              </p>
              <Link href="/products" className="inline-flex items-center gap-2 bg-white text-[#2d2d2d] px-8 py-3.5 rounded-full font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">
                Saznajte Više <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex-1 relative">
              <img
                src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=700&fit=crop"
                alt="Natural products"
                className="rounded-3xl w-full max-w-md mx-auto object-cover aspect-[4/5]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BESTSELLERS - Dedicated section */}
      <section className="py-16 bg-white border-y border-[#e0d8cc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-[#c4883a]" />
              <div>
                <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Najprodavaniji</h2>
                <p className="text-[#b07a87] mt-1 text-sm">Proizvodi koje naši kupci najviše vole</p>
              </div>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">
              Pogledaj sve
            </Link>
          </div>
          <ProductCarousel products={bestsellers} />
        </div>
      </section>

      {/* NEW ARRIVALS - Grid of 4 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Novo u Ponudi</h2>
              <p className="text-[#b07a87] mt-1 text-sm">Najnoviji proizvodi iz naše kolekcije</p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">
              Svi proizvodi
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* SALE PRODUCTS CAROUSEL */}
      <section className="py-16 bg-white border-y border-[#e0d8cc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Akcijske Ponude</h2>
              <p className="text-[#b07a87] mt-2 text-sm">Uštedite na omiljenim proizvodima</p>
            </div>
            <Link href="/outlet" className="hidden md:flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">
              Sve akcije
            </Link>
          </div>
          <ProductCarousel products={saleProducts} showOld />
        </div>
      </section>

      {/* B2B PROMO BANNER */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=500&fit=crop"
              alt="Professional salon"
              className="w-full h-[400px] md:h-[450px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2d2d2d]/85 via-[#2d2d2d]/60 to-[#2d2d2d]/30" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-8 md:px-12">
                <span className="text-[#b07a87] text-xs tracking-[0.2em] font-medium uppercase">Za Salone</span>
                <h2 className="text-3xl md:text-5xl font-light text-white mt-3 mb-5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>B2B Program za <em className="italic">Profesionalce</em></h2>
                <p className="text-white/50 mb-8 max-w-md text-sm leading-relaxed">Ekskluzivne cene, prioritetna dostava i podrška za vaš salon. Registrujte se kao B2B korisnik.</p>
                <Link href="/account/login" className="inline-flex items-center gap-2 bg-white text-[#2d2d2d] px-8 py-3.5 rounded-full font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">
                  Registrujte Salon <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOG BANNER — eco-banner style: text left, cards right */}
      <section className="bg-[#1e1a1b] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-stretch gap-10 md:gap-14">
            {/* Left: text */}
            <div className="flex-1 flex flex-col justify-center md:text-left text-center">
              <span className="text-[#b07a87] text-xs tracking-[0.2em] font-medium uppercase">Alta Moda Blog</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mt-3 mb-5 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Saveti, Trendovi &{" "}
                <em className="italic text-[#b07a87]">Inspiracija</em>
              </h2>
              <p className="text-white/45 mb-8 max-w-sm text-sm leading-relaxed">
                Najnoviji članci o nezi kose, trendovima farbanja i styling tehnikama od naših stručnjaka.
              </p>
              <div>
                <Link href="/blog" className="inline-flex items-center gap-2 bg-white text-[#2d2d2d] px-7 py-3 rounded-full font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">
                  Svi Članci <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: blog cards stacked */}
            <div className="flex-1 space-y-4 w-full">
              <Link href="/blog/trendovi-boja-prolece-2026" className="group relative rounded-2xl overflow-hidden block h-[220px]">
                <img src="https://images.unsplash.com/photo-1560869713-7d0a29430803?w=700&h=440&fit=crop" alt="Trendovi boja" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="inline-block px-2.5 py-1 bg-[#8c4a5a] text-white text-[10px] font-semibold rounded-lg tracking-wider uppercase mb-2.5">Trendovi</span>
                  <h3 className="text-lg font-medium text-white leading-snug transition-colors">Trendovi boja za kosu — Proleće 2026</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    <span>12. mar 2026</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 5 min</span>
                  </div>
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-4">
                <Link href="/blog/nega-farbane-kose" className="group relative rounded-2xl overflow-hidden block h-[180px]">
                  <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=360&fit=crop" alt="Nega kose" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="inline-block px-2 py-0.5 bg-white/15 backdrop-blur-sm text-white text-[10px] font-semibold rounded-md tracking-wider uppercase mb-2">Nega</span>
                    <h3 className="text-sm font-medium text-white leading-snug transition-colors">Kako negovati farbanu kosu</h3>
                  </div>
                </Link>

                <Link href="/blog/top-5-styling-volumen" className="group relative rounded-2xl overflow-hidden block h-[180px]">
                  <img src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=360&fit=crop" alt="Styling" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="inline-block px-2 py-0.5 bg-white/15 backdrop-blur-sm text-white text-[10px] font-semibold rounded-md tracking-wider uppercase mb-2">Styling</span>
                    <h3 className="text-sm font-medium text-white leading-snug transition-colors">Top 5 proizvoda za volumen</h3>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEMINARS — separate section, lighter tone */}
      <section className="py-16 bg-white border-y border-[#e0d8cc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-[#8c4a5a] text-xs tracking-[0.2em] font-medium uppercase">Edukacija</span>
              <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d] mt-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Predstojeći <em className="italic">Seminari</em>
              </h2>
            </div>
            <Link href="/seminars" className="hidden md:inline-flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">
              Svi seminari
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Seminar 1 */}
            <Link href="/seminars" className="group block rounded-2xl overflow-hidden border border-[#e0d8cc] hover:border-[#b07a87] transition-all hover:shadow-md">
              <div className="relative h-44 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1560869713-7d0a29430803?w=500&h=350&fit=crop" alt="Balayage" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-2 text-center shadow-sm">
                  <span className="text-lg font-bold text-[#8c4a5a] block leading-none">25</span>
                  <span className="text-[10px] text-[#6b6b6b] uppercase font-medium">mart</span>
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#8c4a5a] text-white text-[10px] font-semibold rounded-lg">8 mesta</div>
              </div>
              <div className="p-5">
                <span className="text-[10px] font-semibold text-[#8c4a5a] tracking-widest uppercase">Koloristika</span>
                <h4 className="text-base font-medium text-[#2d2d2d] mt-1.5 group-hover:text-[#8c4a5a] transition-colors">Balayage Masterclass</h4>
                <p className="text-sm text-[#6b6b6b] mt-1">Marco Rossi</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0ebe3]">
                  <div className="flex items-center gap-3 text-xs text-[#999]">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Beograd</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 10-16h</span>
                  </div>
                  <span className="text-sm font-bold text-[#2d2d2d]">15.000 <span className="text-[10px] text-[#999]">RSD</span></span>
                </div>
              </div>
            </Link>

            {/* Seminar 2 */}
            <Link href="/seminars" className="group block rounded-2xl overflow-hidden border border-[#e0d8cc] hover:border-[#b07a87] transition-all hover:shadow-md">
              <div className="relative h-44 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=350&fit=crop" alt="Šišanje" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-2 text-center shadow-sm">
                  <span className="text-lg font-bold text-[#8c4a5a] block leading-none">2</span>
                  <span className="text-[10px] text-[#6b6b6b] uppercase font-medium">april</span>
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#8c4a5a] text-white text-[10px] font-semibold rounded-lg">15 mesta</div>
              </div>
              <div className="p-5">
                <span className="text-[10px] font-semibold text-[#8c4a5a] tracking-widest uppercase">Šišanje</span>
                <h4 className="text-base font-medium text-[#2d2d2d] mt-1.5 group-hover:text-[#8c4a5a] transition-colors">Napredne Tehnike Šišanja</h4>
                <p className="text-sm text-[#6b6b6b] mt-1">Elena Vukčević</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0ebe3]">
                  <div className="flex items-center gap-3 text-xs text-[#999]">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Hotel Hyatt</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 09-15h</span>
                  </div>
                  <span className="text-sm font-bold text-[#2d2d2d]">12.000 <span className="text-[10px] text-[#999]">RSD</span></span>
                </div>
              </div>
            </Link>

            {/* Seminar 3 — urgent */}
            <Link href="/seminars" className="group block rounded-2xl overflow-hidden border border-[#e0d8cc] hover:border-[#b07a87] transition-all hover:shadow-md">
              <div className="relative h-44 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500&h=350&fit=crop" alt="Tretmani" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-2 text-center shadow-sm">
                  <span className="text-lg font-bold text-[#8c4a5a] block leading-none">10</span>
                  <span className="text-[10px] text-[#6b6b6b] uppercase font-medium">april</span>
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#b5453a] text-white text-[10px] font-semibold rounded-lg">Još 5!</div>
              </div>
              <div className="p-5">
                <span className="text-[10px] font-semibold text-[#8c4a5a] tracking-widest uppercase">Nega</span>
                <h4 className="text-base font-medium text-[#2d2d2d] mt-1.5 group-hover:text-[#8c4a5a] transition-colors">Kérastase Ritual Tretmani</h4>
                <p className="text-sm text-[#6b6b6b] mt-1">Sophie Laurent</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0ebe3]">
                  <div className="flex items-center gap-3 text-xs text-[#999]">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Beograd</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 11-17h</span>
                  </div>
                  <span className="text-sm font-bold text-[#2d2d2d]">8.000 <span className="text-[10px] text-[#999]">RSD</span></span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* INSTAGRAM FEED */}
      <section className="py-16 bg-white border-y border-[#e0d8cc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>@altamoda.rs</h2>
            <p className="text-[#b07a87] mt-2 text-sm">Pratite nas na Instagramu za inspiraciju</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {instagramImages.map((img, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden cursor-pointer group relative">
                <img src={img} alt={`Instagram ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-16 bg-[#f5f0e8]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Mail className="w-8 h-8 text-[#8c4a5a] mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Prijavite se na <em className="italic">Newsletter</em></h2>
          <p className="text-[#b07a87] mb-8 max-w-md mx-auto text-sm">Budite prvi koji saznaju za nove proizvode, akcije i ekskluzivne ponude.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Vaša email adresa" className="flex-1 bg-white border border-[#e0d8cc] rounded-full px-5 py-3 text-[#2d2d2d] placeholder-[#b07a87] text-sm focus:border-[#8c4a5a] focus:ring-0" />
            <button className="bg-[#8c4a5a] hover:bg-[#6e3848] text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 text-sm">
              Prijavite se <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {/* NEWSLETTER POPUP MODAL */}
      {showNewsletter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewsletter(false)} />
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative z-10 animate-scaleIn border border-[#e0d8cc]">
            <button onClick={() => setShowNewsletter(false)} className="absolute top-4 right-4"><X className="w-5 h-5 text-[#b07a87] hover:text-[#2d2d2d]" /></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f5f0e8] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-[#8c4a5a]" />
              </div>
              <h3 className="text-2xl font-light text-[#2d2d2d] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Ostvarite 10% Popusta</h3>
              <p className="text-[#b07a87] text-sm mb-6">Prijavite se na naš newsletter i dobijte 10% popusta na prvu kupovinu.</p>
              <input type="email" placeholder="Vaša email adresa" className="w-full border border-[#e0d8cc] rounded-full px-4 py-3 text-sm mb-3 focus:border-[#8c4a5a]" />
              <button className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded-full font-medium transition-colors">Prijavite se</button>
              <button onClick={() => setShowNewsletter(false)} className="text-xs text-[#b07a87] mt-3 hover:text-[#2d2d2d] block mx-auto">Ne hvala, možda drugi put</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating newsletter trigger */}
      {!showNewsletter && (
        <button onClick={() => setShowNewsletter(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-[#8c4a5a] hover:bg-[#6e3848] text-white rounded-full flex items-center justify-center z-40 transition-all hover:scale-110">
          <Mail className="w-6 h-6" />
        </button>
      )}

      <ChatWidget />
      <CookieConsent />
    </div>
  );
}
