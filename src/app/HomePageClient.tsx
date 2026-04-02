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
import { useLanguage } from "@/lib/i18n/LanguageContext";


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
  stockQuantity: number;
  sku: string;
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

const trustBadgeIcons = [Leaf, ShieldCheck, Award, Truck];

/* ─── ProductCard ─── */
function ProductCard({ product, showOld = false, badge }: { product: ProductData; showOld?: boolean; badge?: string }) {
  const { t } = useLanguage();
  const [liked, setLiked] = useState(false);
  const newLabel = t("home.new");
  const discountBadge = product.oldPrice ? `-${Math.round((1 - product.price / product.oldPrice) * 100)}%` : null;
  const displayBadge = badge || (product.isNew ? newLabel : discountBadge);

  return (
    <Link href={`/products/${product.slug}`} className="product-card bg-white rounded-2xl border border-[#e0d8cc] hover:border-[#b07a87] transition-all group relative overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-white rounded-t-2xl">
        <img src={product.image || defaultImg} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
        {displayBadge && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded-full ${
            displayBadge === newLabel ? "bg-[#8c4a5a] text-white"
            : displayBadge.startsWith("#") ? "bg-[#c4883a] text-white"
            : "bg-[#b5453a] text-white"
          }`}>{displayBadge}</span>
        )}
        {product.isProfessional && (
          <span className="absolute top-3 left-3 mt-8 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#2d2d2d]/80 text-white backdrop-blur-sm">{t("products.professional")}</span>
        )}
        <button onClick={(e) => { e.preventDefault(); setLiked(!liked); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10">
          <Heart className={`w-4 h-4 ${liked ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-[#b07a87]"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="block w-full text-sm font-medium py-2.5 rounded-full transition-colors bg-[#8c4a5a] hover:bg-[#6e3848] text-white text-center">{t("nav.explore")}</span>
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

  const needsCarousel = totalSlides > 1;

  useEffect(() => {
    if (!needsCarousel) return;
    timerRef.current = setInterval(goNext, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [goNext, needsCarousel]);

  const slidePercent = 100 / itemsPerView;
  const translateX = -(currentIndex * slidePercent);

  if (!needsCarousel) {
    return (
      <div className="flex justify-center gap-4">
        {products.map((p) => (
          <div key={p.id} className="w-full px-2" style={{ maxWidth: `${slidePercent}%` }}>
            <ProductCard product={p} showOld={showOld} />
          </div>
        ))}
      </div>
    );
  }

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

const b2cShowcaseImages = [
  "/showcase/b2cProizvod1.webp",
  "/showcase/b2cProizvod2.webp",
  "/showcase/b2cProizvod3.webp",
];

const b2bShowcaseImages = [
  "/showcase/b2bProizvod1.webp",
  "/showcase/b2bproizvod2.webp",
  "/showcase/b2bproizvod3.webp",
];

/* ─── Main Page ─── */
export default function HomePageClient({ featuredProducts, bestsellers, newArrivals, saleProducts }: Props) {
  const { t } = useLanguage();

  const trustBadges = [
    { icon: trustBadgeIcons[0], title: t("home.naturalFormula"), desc: t("home.naturalFormulaDesc") },
    { icon: trustBadgeIcons[1], title: t("home.crueltyFree"), desc: t("home.crueltyFreeDesc") },
    { icon: trustBadgeIcons[2], title: t("home.expertApproved"), desc: t("home.expertApprovedDesc") },
    { icon: trustBadgeIcons[3], title: t("home.freeShipping"), desc: t("home.freeShippingDesc") },
  ];

  const [showNewsletter, setShowNewsletter] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [popupEmail, setPopupEmail] = useState("");
  const [popupStatus, setPopupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [popupMessage, setPopupMessage] = useState("");

  const handleNewsletterSubmit = async (email: string, setStatus: (s: "idle" | "loading" | "success" | "error") => void, setMessage: (m: string) => void, onSuccess?: () => void) => {
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(json.data?.message || "Uspešno ste se prijavili!");
        onSuccess?.();
      } else {
        setStatus("error");
        setMessage(json.error || "Došlo je do greške");
      }
    } catch {
      setStatus("error");
      setMessage("Došlo je do greške");
    }
  };

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
              {t("home.heroTitle1")}<br /><em className="italic text-[#b07a87]">{t("home.heroTitle2")}</em>
            </h1>
            <p className="text-white/60 text-base md:text-lg mb-8 max-w-lg animate-slideUp leading-relaxed" style={{ animationDelay: "0.1s" }}>
              {t("home.heroSubtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-6 animate-slideUp" style={{ animationDelay: "0.2s" }}>
              <Link href="/products" className="inline-flex items-center gap-2 bg-white text-[#2d2d2d] px-8 py-3.5 rounded-full font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm tracking-wide">{t("home.shopNow")}</Link>
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
          {t("home.editorialHeading")}
        </p>
      </section>

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white border-y border-[#e0d8cc]">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d] text-center mb-10" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.featuredProducts")}</h2>
            <ProductCarousel products={featuredProducts} showOld />
            <div className="text-center mt-10">
              <Link href="/products" className="inline-flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">{t("home.viewAllProducts")}</Link>
            </div>
          </div>
        </section>
      )}

      {/* B2C & B2B SHOWCASE */}
      <section className="relative overflow-hidden">
        <div className="bg-[#38202a] py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-14">
              <span className="text-[#b07a87] text-xs tracking-[0.2em] font-medium uppercase">{t("home.shopByType")}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mt-3 mb-5 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {t("home.forEveryone")},{" "}<em className="italic text-[#b07a87]">{t("home.forProfessionals")}</em>
              </h2>
              <p className="text-white/40 max-w-2xl mx-auto text-sm leading-relaxed">{t("home.shopByTypeDesc")}</p>
            </div>
            <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-between gap-10 lg:gap-20">
              {/* B2C Column */}
              <div className="flex-1 w-full max-w-lg lg:max-w-[45%]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-[#b07a87]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{t("home.b2cTitle")}</h3>
                    <p className="text-white/40 text-xs">{t("home.b2cDesc")}</p>
                  </div>
                </div>
                {/* Pinterest-style masonry grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Left: tall image */}
                  <Link href="/products" className="group/card relative row-span-2 rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#b07a87]/50 transition-all">
                    <img src={b2cShowcaseImages[0]} alt="B2C proizvod 1" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" style={{ minHeight: '320px' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </Link>
                  {/* Right top: short image */}
                  <Link href="/products" className="group/card relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#b07a87]/50 transition-all aspect-[4/3]">
                    <img src={b2cShowcaseImages[1]} alt="B2C proizvod 2" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </Link>
                  {/* Right bottom: short image */}
                  <Link href="/products" className="group/card relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#b07a87]/50 transition-all aspect-[4/3]">
                    <img src={b2cShowcaseImages[2]} alt="B2C proizvod 3" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </Link>
                </div>
                <Link href="/products" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mt-5 transition-colors">
                  {t("home.shopB2c")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* B2B Column */}
              <div className="flex-1 w-full max-w-lg lg:max-w-[45%]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 flex flex-col items-end">
                    <h3 className="text-lg font-medium text-white">{t("home.b2bShowcaseTitle")}</h3>
                    <p className="text-white/40 text-xs">{t("home.b2bShowcaseDesc")}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#b07a87]/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#b07a87]" />
                  </div>
                </div>
                {/* Pinterest-style masonry grid — mirrored layout */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Left top: short image */}
                  <Link href="/products?visibility=b2b" className="group/card relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#b07a87]/50 transition-all aspect-[4/3]">
                    <img src={b2bShowcaseImages[0]} alt="B2B proizvod 1" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </Link>
                  {/* Right: tall image */}
                  <Link href="/products?visibility=b2b" className="group/card relative row-span-2 rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#b07a87]/50 transition-all">
                    <img src={b2bShowcaseImages[1]} alt="B2B proizvod 2" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" style={{ minHeight: '320px' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </Link>
                  {/* Left bottom: short image */}
                  <Link href="/products?visibility=b2b" className="group/card relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#b07a87]/50 transition-all aspect-[4/3]">
                    <img src={b2bShowcaseImages[2]} alt="B2B proizvod 3" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </Link>
                </div>
                <Link href="/products?visibility=b2b" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mt-5 transition-colors">
                  {t("home.shopB2b")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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
                  <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.bestsellers")}</h2>
                  <p className="text-[#b07a87] mt-1 text-sm">{t("home.bestsellersDesc")}</p>
                </div>
              </div>
              <Link href="/products" className="hidden md:flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">{t("home.viewAll")}</Link>
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
                <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.newArrivals")}</h2>
                <p className="text-[#b07a87] mt-1 text-sm">{t("home.newArrivalsDesc")}</p>
              </div>
              <Link href="/products" className="hidden md:flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">{t("home.allProducts")}</Link>
            </div>
            <ProductCarousel products={newArrivals} />
          </div>
        </section>
      )}

      {/* SALE PRODUCTS */}
      {saleProducts.length > 0 && (
        <section className="py-16 bg-white border-y border-[#e0d8cc]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.saleProducts")}</h2>
                <p className="text-[#b07a87] mt-2 text-sm">{t("home.saleProductsDesc")}</p>
              </div>
              <Link href="/outlet" className="hidden md:flex items-center gap-1 text-sm text-[#2d2d2d] font-medium border-b border-[#2d2d2d] pb-0.5 hover:text-[#8c4a5a] hover:border-[#8c4a5a] transition-colors">{t("home.allSales")}</Link>
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
                <span className="text-[#b07a87] text-xs tracking-[0.2em] font-medium uppercase">{t("home.forSalons")}</span>
                <h2 className="text-3xl md:text-5xl font-light text-white mt-3 mb-5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.b2bTitle")} <em className="italic">{t("home.b2bProfessionals")}</em></h2>
                <p className="text-white/50 mb-8 max-w-md text-sm leading-relaxed">{t("home.b2bDescription")}</p>
                <Link href="/account/login" className="inline-flex items-center gap-2 bg-white text-[#2d2d2d] px-8 py-3.5 rounded-full font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">{t("home.registerSalon")} <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INSTAGRAM FEED */}
      <section className="py-16 bg-white border-y border-[#e0d8cc]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.instagramHandle")}</h2>
            <p className="text-[#b07a87] mt-2 text-sm">{t("home.instagramDesc")}</p>
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
          <h2 className="text-3xl md:text-4xl font-light text-[#2d2d2d] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.newsletterTitle")} <em className="italic">{t("home.newsletter")}</em></h2>
          <p className="text-[#b07a87] mb-8 max-w-md mx-auto text-sm">{t("home.newsletterDesc")}</p>
          <form onSubmit={(e) => { e.preventDefault(); handleNewsletterSubmit(newsletterEmail, setNewsletterStatus, setNewsletterMessage); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder={t("home.emailPlaceholder")} value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} className="flex-1 bg-white border border-[#e0d8cc] rounded-full px-5 py-3 text-[#2d2d2d] placeholder-[#b07a87] text-sm focus:border-[#8c4a5a] focus:ring-0" required />
            <button type="submit" disabled={newsletterStatus === "loading"} className="bg-[#8c4a5a] hover:bg-[#6e3848] text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60">
              {newsletterStatus === "loading" ? "..." : t("home.subscribe")} <Send className="w-4 h-4" />
            </button>
          </form>
          {newsletterStatus !== "idle" && newsletterStatus !== "loading" && (
            <p className={`mt-3 text-sm ${newsletterStatus === "success" ? "text-green-600" : "text-red-500"}`}>{newsletterMessage}</p>
          )}
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
              <h3 className="text-2xl font-light text-[#2d2d2d] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.popupTitle")}</h3>
              <p className="text-[#b07a87] text-sm mb-6">{t("home.popupDesc")}</p>
              {popupStatus === "success" ? (
                <p className="text-green-600 text-sm py-4">{popupMessage}</p>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleNewsletterSubmit(popupEmail, setPopupStatus, setPopupMessage, () => {
                    setTimeout(() => setShowNewsletter(false), 1500);
                  });
                }}>
                  <input type="email" placeholder={t("home.emailPlaceholder")} value={popupEmail} onChange={(e) => setPopupEmail(e.target.value)} className="w-full border border-[#e0d8cc] rounded-full px-4 py-3 text-sm mb-3 focus:border-[#8c4a5a]" required />
                  <button type="submit" disabled={popupStatus === "loading"} className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded-full font-medium transition-colors disabled:opacity-60">
                    {popupStatus === "loading" ? t("home.subscribing") : t("home.subscribe")}
                  </button>
                  {popupStatus === "error" && (
                    <p className="text-red-500 text-sm mt-2">{popupMessage}</p>
                  )}
                </form>
              )}
              <button onClick={() => setShowNewsletter(false)} className="text-xs text-[#b07a87] mt-3 hover:text-[#2d2d2d] block mx-auto">{t("home.noThanks")}</button>
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
