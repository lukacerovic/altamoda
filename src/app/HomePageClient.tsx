"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Heart, Star, ArrowRight, ChevronLeft, ChevronRight,
  Leaf, ShieldCheck, Award, Truck,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Instagram, Mail, Send, X, TrendingUp,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import CookieConsent from "@/components/CookieConsent";

/* ─── Types ─── */
export interface ProductData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  image: string | null;
  isNew: boolean;
  isFeatured: boolean;
  isProfessional: boolean;
}

const defaultImg = "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop";

const instagramImages = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=300&h=300&fit=crop",
];

const trustBadges = [
  { icon: Leaf, title: "Prirodna Formula", desc: "Nežna nega za vašu kosu sa premium sastojcima" },
  { icon: ShieldCheck, title: "Bez Okrutnosti", desc: "Naši proizvodi nisu testirani na životinjama" },
  { icon: Award, title: "Stručno Odobreno", desc: "Testirano za sigurnost i vidljive rezultate" },
  { icon: Truck, title: "Besplatna Dostava", desc: "Za porudžbine preko 5.000 RSD, bez dodatnih troškova" },
];

/* ─── ProductCard ─── */
function ProductCard({ product, showOld = false, badge }: { product: ProductData; showOld?: boolean; badge?: string }) {
  const [liked, setLiked] = useState(false);
  const discountBadge = product.oldPrice ? `-${Math.round((1 - product.price / product.oldPrice) * 100)}%` : null;
  const displayBadge = badge || (product.isNew ? "NOVO" : discountBadge);

  return (
    <Link href={`/products/${product.slug}`} className="product-card bg-white rounded-2xl border border-[#e0d8cc] hover:border-[#b07a87] transition-all group relative overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-[#f5f0e8] rounded-t-2xl">
        <img src={product.image || defaultImg} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {displayBadge && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded-full ${
            displayBadge === "NOVO" ? "bg-[#8c4a5a] text-white"
            : displayBadge.startsWith("#") ? "bg-[#c4883a] text-white"
            : "bg-[#b5453a] text-white"
          }`}>{displayBadge}</span>
        )}
        {product.isProfessional && (
          <span className="absolute top-3 left-3 mt-8 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#2d2d2d]/80 text-white backdrop-blur-sm">PRO</span>
        )}
        <button onClick={(e) => { e.preventDefault(); setLiked(!liked); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10">
          <Heart className={`w-4 h-4 ${liked ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-[#b07a87]"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => e.preventDefault()} className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white text-sm font-medium py-2.5 rounded-full transition-colors">Dodaj u korpu</button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-[#8c4a5a] font-medium tracking-wider">{product.brand}</span>
        <h3 className="text-sm font-medium text-[#2d2d2d] mt-1 line-clamp-2 flex-1">{product.name}</h3>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(product.rating) ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-[#e0d8cc]"}`} />)}
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
function ProductCarousel({ products, showOld = false }: { products: ProductData[]; showOld?: boolean }) {
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

  useEffect(() => { setCurrentIndex((prev) => Math.min(prev, totalSlides - 1)); }, [totalSlides]);

  const goNext = useCallback(() => { setCurrentIndex((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1)); }, [totalSlides]);
  const goPrev = useCallback(() => { setCurrentIndex((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1)); }, [totalSlides]);

  useEffect(() => { timerRef.current = setInterval(goNext, 4000); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [goNext]);

  const slidePercent = 100 / itemsPerView;
  const translateX = -(currentIndex * slidePercent);

  return (
    <div className="relative" onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current); }} onMouseLeave={() => { timerRef.current = setInterval(goNext, 4000); }}>
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(${translateX}%)` }}>
          {products.map((p) => (
            <div key={p.id} className="flex-shrink-0 px-8 sm:px-2" style={{ width: `${slidePercent}%` }}>
              <ProductCard product={p} showOld={showOld} />
            </div>
          ))}
        </div>
      </div>
      <button onClick={goPrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-white border border-[#e0d8cc] flex items-center justify-center hover:border-[#8c4a5a] transition-all z-10"><ChevronLeft className="w-5 h-5 text-[#b07a87]" /></button>
      <button onClick={goNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-white border border-[#e0d8cc] flex items-center justify-center hover:border-[#8c4a5a] transition-all z-10"><ChevronRight className="w-5 h-5 text-[#b07a87]" /></button>
      <div className="flex items-center justify-center gap-2 mt-6">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button key={i} onClick={() => setCurrentIndex(i)} className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-[#8c4a5a]" : "bg-[#e0d8cc]"}`} />
        ))}
      </div>
    </div>
  );
}

/* ─── Props ─── */
interface Props {
  featuredProducts: ProductData[];
  bestsellers: ProductData[];
  newArrivals: ProductData[];
  saleProducts: ProductData[];
}

/* ─── Main Page ─── */
export default function HomePageClient({ featuredProducts, bestsellers, newArrivals, saleProducts }: Props) {
  const [showNewsletter, setShowNewsletter] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Header />

      {/* HERO */}
      <section className="relative h-[600px] md:h-[750px] overflow-hidden">
        <img src="/hero.png" alt="Hero - Professional hair care products" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2d2d2d]/70 via-[#2d2d2d]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2d2d2d]/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] mb-6 text-white animate-slideUp" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Profesionalna{" "}<em className="italic text-[#b07a87]">Nega</em>
            </h1>
            <p className="text-white/60 text-base md:text-lg mb-8 max-w-lg animate-slideUp leading-relaxed" style={{ animationDelay: "0.1s" }}>
              Započnite dan sa nežnom negom i hranjivim sastojcima koji su dizajnirani da probudu prirodnu lepotu vaše kose.
            </p>
            <div className="flex flex-wrap items-center gap-6 animate-slideUp" style={{ animationDelay: "0.2s" }}>
              <Link href="/products" className="inline-flex items-center gap-2 bg-white text-[#2d2d2d] px-8 py-3.5 rounded-full font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm tracking-wide">Kupujte Sada</Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="py-10 bg-white border-b border-[#e0d8cc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge) => { const Icon = badge.icon; return (
              <div key={badge.title} className="flex flex-col items-center text-center p-6 rounded-2xl border border-[#e0d8cc] bg-white hover:border-[#b07a87] transition-colors">
                <Icon className="w-7 h-7 text-[#8c4a5a] mb-3" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-[#2d2d2d]">{badge.title}</h3>
                <p className="text-xs text-[#b07a87] mt-1.5 leading-relaxed">{badge.desc}</p>
              </div>
            ); })}
          </div>
        </div>
      </section>

      {/* EDITORIAL HEADING */}
      <section className="py-16 md:py-20 text-center bg-[#f5f0e8]">
        <p className="text-3xl md:text-4xl lg:text-5xl text-[#2d2d2d] font-light italic max-w-3xl mx-auto px-4 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Osvežite svoju kosu, negujte sebe, obnovite sjaj.
        </p>
      </section>

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white border-y border-[#e0d8cc]">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d] text-center mb-10" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Izdvojeni Proizvodi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} showOld={!!p.oldPrice} />)}
            </div>
            <div className="text-center mt-10">
              <Link href="/products" className="inline-flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">Pogledajte Sve Proizvode</Link>
            </div>
          </div>
        </section>
      )}

      {/* ECO-FRIENDLY BANNER */}
      <section className="relative overflow-hidden">
        <div className="bg-[#38202a] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <span className="text-[#b07a87] text-xs tracking-[0.2em] font-medium uppercase">Za Profesionalce</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mt-3 mb-5 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Ekološki,{" "}<em className="italic text-[#b07a87]">Prijateljski</em>{" "}za Kosu</h2>
              <p className="text-white/50 mb-8 max-w-lg text-sm leading-relaxed">Naši proizvodi su napravljeni sa prirodnim sastojcima, bez štetnih hemikalija.</p>
              <Link href="/products" className="inline-flex items-center gap-2 bg-white text-[#2d2d2d] px-8 py-3.5 rounded-full font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">Saznajte Više <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="flex-1 relative">
              <img src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=700&fit=crop" alt="Natural products" className="rounded-3xl w-full max-w-md mx-auto object-cover aspect-[4/5]" />
            </div>
          </div>
        </div>
      </section>

      {/* BESTSELLERS */}
      {bestsellers.length > 0 && (
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
              <Link href="/products" className="hidden md:flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">Pogledaj sve</Link>
            </div>
            <ProductCarousel products={bestsellers.map((p, i) => ({ ...p, _rank: i + 1 }))} />
          </div>
        </section>
      )}

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Novo u Ponudi</h2>
                <p className="text-[#b07a87] mt-1 text-sm">Najnoviji proizvodi iz naše kolekcije</p>
              </div>
              <Link href="/products" className="hidden md:flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">Svi proizvodi</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map((p) => <ProductCard key={p.id} product={p} badge="NOVO" />)}
            </div>
          </div>
        </section>
      )}

      {/* SALE PRODUCTS */}
      {saleProducts.length > 0 && (
        <section className="py-16 bg-white border-y border-[#e0d8cc]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Akcijske Ponude</h2>
                <p className="text-[#b07a87] mt-2 text-sm">Uštedite na omiljenim proizvodima</p>
              </div>
              <Link href="/outlet" className="hidden md:flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">Sve akcije</Link>
            </div>
            <ProductCarousel products={saleProducts} showOld />
          </div>
        </section>
      )}

      {/* B2B PROMO BANNER */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=500&fit=crop" alt="Professional salon" className="w-full h-[400px] md:h-[450px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2d2d2d]/85 via-[#2d2d2d]/60 to-[#2d2d2d]/30" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-8 md:px-12">
                <span className="text-[#b07a87] text-xs tracking-[0.2em] font-medium uppercase">Za Salone</span>
                <h2 className="text-3xl md:text-5xl font-light text-white mt-3 mb-5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>B2B Program za <em className="italic">Profesionalce</em></h2>
                <p className="text-white/50 mb-8 max-w-md text-sm leading-relaxed">Ekskluzivne cene, prioritetna dostava i podrška za vaš salon.</p>
                <Link href="/account/login" className="inline-flex items-center gap-2 bg-white text-[#2d2d2d] px-8 py-3.5 rounded-full font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">Registrujte Salon <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
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
            <button className="bg-[#8c4a5a] hover:bg-[#6e3848] text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 text-sm">Prijavite se <Send className="w-4 h-4" /></button>
          </div>
        </div>
      </section>

      <Footer />

      {/* NEWSLETTER POPUP */}
      {showNewsletter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewsletter(false)} />
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative z-10 animate-scaleIn border border-[#e0d8cc]">
            <button onClick={() => setShowNewsletter(false)} className="absolute top-4 right-4"><X className="w-5 h-5 text-[#b07a87] hover:text-[#2d2d2d]" /></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f5f0e8] rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-[#8c4a5a]" /></div>
              <h3 className="text-2xl font-light text-[#2d2d2d] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Ostvarite 10% Popusta</h3>
              <p className="text-[#b07a87] text-sm mb-6">Prijavite se na naš newsletter i dobijte 10% popusta na prvu kupovinu.</p>
              <input type="email" placeholder="Vaša email adresa" className="w-full border border-[#e0d8cc] rounded-full px-4 py-3 text-sm mb-3 focus:border-[#8c4a5a]" />
              <button className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded-full font-medium transition-colors">Prijavite se</button>
              <button onClick={() => setShowNewsletter(false)} className="text-xs text-[#b07a87] mt-3 hover:text-[#2d2d2d] block mx-auto">Ne hvala, možda drugi put</button>
            </div>
          </div>
        </div>
      )}

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
