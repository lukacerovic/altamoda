"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Phone,
  Globe,
  ChevronLeft,
  ChevronRight,
  Star,
  ArrowRight,
  Scissors,
  Palette,
  Sparkles,
  Wind,
  Zap,
  Award,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Instagram,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Facebook,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Youtube,
  Mail,
  MapPin,
  Clock,
  Send,
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
};

const categoryImages: Record<string, string> = {
  "Boje za kosu": "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=400&fit=crop",
  "Nega kose": "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=400&h=400&fit=crop",
  "Styling": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
  "Aparati": "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop",
  "Alati & Pribor": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop",
  "Brendovi": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=400&fit=crop",
};

const blogImages = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&h=400&fit=crop",
];

const instagramImages = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=300&h=300&fit=crop",
];

/* ─── mock data ─── */
const brands = ["L'Oreal", "Schwarzkopf", "Wella", "Kerastase", "Olaplex", "Moroccanoil"];

const categories = [
  { name: "Boje za kosu", icon: Palette, count: 520 },
  { name: "Nega kose", icon: Sparkles, count: 340 },
  { name: "Styling", icon: Wind, count: 210 },
  { name: "Aparati", icon: Zap, count: 95 },
  { name: "Alati & Pribor", icon: Scissors, count: 180 },
  { name: "Brendovi", icon: Award, count: 45 },
];

const saleProducts = [
  { id: 1, brand: "L'Oreal", name: "Majirel 7.0 Srednje Plava", oldPrice: 1290, price: 890, badge: "-31%", rating: 5 },
  { id: 2, brand: "Schwarzkopf", name: "Igora Royal 6.1 Tamno Pepeljasta", oldPrice: 1350, price: 950, badge: "-30%", rating: 4 },
  { id: 3, brand: "Kerastase", name: "Elixir Ultime Serum", oldPrice: 4500, price: 3200, badge: "-29%", rating: 5 },
  { id: 4, brand: "Olaplex", name: "No.3 Hair Perfector", oldPrice: 3800, price: 2850, badge: "-25%", rating: 5 },
  { id: 5, brand: "Moroccanoil", name: "Treatment Original 100ml", oldPrice: 4200, price: 3150, badge: "-25%", rating: 4 },
  { id: 6, brand: "Wella", name: "Koleston Perfect 8/0", oldPrice: 1100, price: 780, badge: "-29%", rating: 4 },
];

const newArrivals = [
  { id: 7, brand: "L'Oreal", name: "Metal Detox Sampon 300ml", price: 2400, badge: "NOVO", rating: 5 },
  { id: 8, brand: "Schwarzkopf", name: "BlondMe Bond Maska", price: 3100, badge: "NOVO", rating: 4 },
  { id: 9, brand: "Kerastase", name: "Genesis Serum Anti-Chute", price: 5200, badge: "NOVO", rating: 5 },
  { id: 10, brand: "Wella", name: "Ultimate Repair Sampon", price: 2800, badge: "NOVO", rating: 4 },
];

const bestsellers = [
  { id: 11, brand: "Olaplex", name: "No.4 Bond Maintenance Sampon", price: 3600, badge: "HIT", rating: 5 },
  { id: 12, brand: "Moroccanoil", name: "Hydrating Styling Cream", price: 3200, badge: "HIT", rating: 5 },
  { id: 13, brand: "L'Oreal", name: "Vitamino Color Sampon 500ml", price: 2100, badge: "HIT", rating: 4 },
  { id: 14, brand: "Kerastase", name: "Nutritive Bain Satin", price: 3400, badge: "HIT", rating: 5 },
];

const blogPosts = [
  { id: 1, title: "Trendovi boja za kosu - Proleće 2026", category: "Trendovi", date: "12. mar 2026" },
  { id: 2, title: "Kako pravilno negovati farbanu kosu", category: "Nega", date: "8. mar 2026" },
  { id: 3, title: "Top 5 styling proizvoda za volumen", category: "Styling", date: "3. mar 2026" },
];

/* ─── ProductCard ─── */
function ProductCard({ product, showOld = false }: { product: { id: number; brand: string; name: string; price: number; oldPrice?: number; badge?: string; rating: number }; showOld?: boolean }) {
  const [liked, setLiked] = useState(false);
  return (
    <Link href={`/products/${product.id}`} className="product-card bg-white rounded-lg shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-[#f5f0e8]">
        <img
          src={productImages[product.id] || "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {product.badge && (
          <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded ${product.badge === "NOVO" ? "bg-[#c8a96e] text-white" : product.badge === "HIT" ? "bg-[#1a1a1a] text-[#c8a96e]" : "bg-[#c0392b] text-white"}`}>
            {product.badge}
          </span>
        )}
        <button onClick={(e) => { e.preventDefault(); setLiked(!liked); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10">
          <Heart className={`w-4 h-4 ${liked ? "fill-[#c0392b] text-[#c0392b]" : "text-gray-400"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/30 to-transparent">
          <button onClick={(e) => e.preventDefault()} className="w-full bg-[#c8a96e] hover:bg-[#a8894e] text-white text-sm font-medium py-2.5 rounded transition-colors">
            Dodaj u korpu
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-[#c8a96e] font-medium uppercase tracking-wider">{product.brand}</span>
        <h3 className="text-sm font-medium text-[#1a1a1a] mt-1 line-clamp-2 flex-1">{product.name}</h3>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < product.rating ? "fill-[#c8a96e] text-[#c8a96e]" : "text-gray-200"}`} />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {showOld && product.oldPrice && <span className="text-sm text-gray-400 line-through">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
          <span className="text-base font-bold text-[#1a1a1a]">{product.price.toLocaleString("sr-RS")} RSD</span>
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
  products: { id: number; brand: string; name: string; price: number; oldPrice?: number; badge?: string; rating: number }[];
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
              className="flex-shrink-0 px-2"
              style={{ width: `${slidePercent}%` }}
            >
              <ProductCard product={p} showOld={showOld} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={goPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-all z-10 group"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-[#c8a96e] transition-colors" />
      </button>

      <button
        onClick={goNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-all z-10 group"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#c8a96e] transition-colors" />
      </button>

      <div className="flex items-center justify-center gap-2 mt-6">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === currentIndex ? "bg-[#c8a96e]" : "bg-gray-300"
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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />

      {/* HERO */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1562940215-4314619607a2?w=1600&h=900&fit=crop&q=80"
          alt="Hero - Professional hair care"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/90 via-[#1a1a1a]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <span className="inline-block text-[#c8a96e] uppercase tracking-[0.25em] text-xs font-medium mb-4 animate-fadeIn">Premium Frizerska Kozmetika</span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-white animate-slideUp" style={{ fontFamily: "'Playfair Display', serif" }}>
              Profesionalna nega za <span className="text-[#c8a96e]">savršenu</span> kosu
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-lg animate-slideUp" style={{ animationDelay: "0.1s" }}>
              Otkrijte premium proizvode vodećih svetskih brendova za profesionalnu negu, farbanje i styling kose.
            </p>
            <div className="flex flex-wrap gap-4 animate-slideUp" style={{ animationDelay: "0.2s" }}>
              <Link href="/products" className="inline-flex items-center gap-2 bg-[#c8a96e] hover:bg-[#a8894e] text-white px-8 py-3.5 rounded font-medium tracking-wide transition-all hover:-translate-y-0.5 hover:shadow-lg">
                Kupujte Sada <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/account/login" className="inline-flex items-center gap-2 border border-white/30 hover:border-[#c8a96e] text-white px-8 py-3.5 rounded font-medium tracking-wide transition-all hover:text-[#c8a96e]">
                B2B Pristup
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND LOGOS */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-8 overflow-x-auto">
            {brands.map((b) => (
              <span key={b} className="text-gray-400 font-semibold text-sm md:text-base whitespace-nowrap tracking-wider uppercase cursor-pointer hover:text-[#c8a96e] transition-colors">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Kategorije Proizvoda</h2>
            <p className="text-gray-500">Pronađite sve što vam je potrebno za savršen rezultat</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.name} href="/products" className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 relative">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={categoryImages[cat.name]}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/80 via-[#1a1a1a]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                      <span className="text-xs text-white/60">{cat.count} proizvoda</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SALE PRODUCTS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>Akcijske Ponude</h2>
              <p className="text-gray-500 mt-1">Uštedite na omiljenim proizvodima</p>
            </div>
            <Link href="/outlet" className="hidden md:flex items-center gap-1 text-[#c8a96e] hover:text-[#a8894e] font-medium text-sm transition-colors">
              Sve akcije <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductCarousel products={saleProducts} showOld />
        </div>
      </section>

      {/* B2B PROMO BANNER */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=500&fit=crop"
              alt="Professional salon"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/95 via-[#1a1a1a]/80 to-[#1a1a1a]/40" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-8 md:px-12">
                <span className="text-[#c8a96e] text-xs uppercase tracking-[0.2em] font-medium">Za Profesionalce</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>B2B Program za Salone</h2>
                <p className="text-white/60 mb-6 max-w-md">Ekskluzivne cene, prioritetna dostava i podrška za vaš salon. Registrujte se kao B2B korisnik i uživajte u posebnim pogodnostima.</p>
                <Link href="/account/login" className="inline-flex items-center gap-2 bg-[#c8a96e] hover:bg-[#a8894e] text-white px-6 py-3 rounded font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  Registrujte Salon <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>Novo u Ponudi</h2>
              <p className="text-gray-500 mt-1">Najnoviji proizvodi iz naše kolekcije</p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-1 text-[#c8a96e] hover:text-[#a8894e] font-medium text-sm transition-colors">
              Svi proizvodi <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>Najprodavaniji</h2>
              <p className="text-gray-500 mt-1">Proizvodi koje naši kupci najviše vole</p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-1 text-[#c8a96e] hover:text-[#a8894e] font-medium text-sm transition-colors">
              Pogledaj sve <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ProductCarousel products={bestsellers} />
        </div>
      </section>

      {/* BLOG PREVIEW */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>Blog & Saveti</h2>
            <p className="text-gray-500 mt-2">Najnoviji trendovi, saveti i inspiracija</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {blogPosts.map((post, idx) => (
              <div key={post.id} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="aspect-video overflow-hidden">
                  <img
                    src={blogImages[idx]}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs text-[#c8a96e] font-medium uppercase tracking-wider">{post.category}</span>
                  <h3 className="text-lg font-semibold text-[#1a1a1a] mt-1 group-hover:text-[#c8a96e] transition-colors">{post.title}</h3>
                  <span className="text-xs text-gray-400 mt-2 block">{post.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEMINAR PREVIEW */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&h=500&fit=crop"
              alt="Hair seminar"
              className="w-full h-[350px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/90 to-[#1a1a1a]/40" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-8 md:px-12">
                <span className="text-[#c8a96e] text-xs uppercase tracking-[0.2em] font-medium">Edukacija</span>
                <h2 className="text-3xl font-bold text-white mt-2 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Seminari i Radionice</h2>
                <p className="text-white/60 mb-6 max-w-md">Unapredite svoje veštine uz naše profesionalne seminare sa vrhunskim edukatorima iz celog sveta.</p>
                <Link href="/seminars" className="inline-flex items-center gap-2 bg-[#c8a96e] hover:bg-[#a8894e] text-white px-6 py-3 rounded font-medium transition-all hover:-translate-y-0.5">
                  Pogledaj Raspored <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INSTAGRAM FEED */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>@altamoda.rs</h2>
            <p className="text-gray-500 mt-2">Pratite nas na Instagramu za inspiraciju</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {instagramImages.map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative">
                <img src={img} alt={`Instagram ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-16 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Mail className="w-10 h-10 text-[#c8a96e] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Prijavite se na Newsletter</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">Budite prvi koji saznaju za nove proizvode, akcije i ekskluzivne ponude.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Vaša email adresa" className="flex-1 bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 text-sm focus:border-[#c8a96e] focus:ring-0" />
            <button className="bg-[#c8a96e] hover:bg-[#a8894e] text-white px-6 py-3 rounded font-medium transition-colors flex items-center justify-center gap-2">
              Prijavite se <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {/* NEWSLETTER POPUP MODAL */}
      {showNewsletter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNewsletter(false)} />
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative z-10 animate-scaleIn">
            <button onClick={() => setShowNewsletter(false)} className="absolute top-4 right-4"><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#faf7f2] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-[#c8a96e]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Ostvarite 10% Popusta</h3>
              <p className="text-gray-500 text-sm mb-6">Prijavite se na naš newsletter i dobijte 10% popusta na prvu kupovinu.</p>
              <input type="email" placeholder="Vaša email adresa" className="w-full border border-gray-200 rounded px-4 py-3 text-sm mb-3" />
              <button className="w-full bg-[#c8a96e] hover:bg-[#a8894e] text-white py-3 rounded font-medium transition-colors">Prijavite se</button>
              <button onClick={() => setShowNewsletter(false)} className="text-xs text-gray-400 mt-3 hover:text-gray-600 block mx-auto">Ne hvala, možda drugi put</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating newsletter trigger - bottom right */}
      {!showNewsletter && (
        <button onClick={() => setShowNewsletter(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-[#c8a96e] hover:bg-[#a8894e] text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110">
          <Mail className="w-6 h-6" />
        </button>
      )}

      {/* Chat Widget - bottom left */}
      <ChatWidget />

      {/* Cookie Consent */}
      <CookieConsent />
    </div>
  );
}
