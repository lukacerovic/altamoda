"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Heart, Star, ArrowRight, ChevronLeft, ChevronRight,
  Check,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Instagram, Mail, X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

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
  promoBadge?: string | null;
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

/* ─── Categories — dark/bone/white card pattern (6 main nav categories) ─── */
const categoryCards = [
  { title: "Nega Kose", slug: "sampon", desc: "Šamponi, maske, regeneratori, ulja i serumi", variant: "dark" as const },
  { title: "Styling", slug: "stajling", desc: "Lakovi, gelovi, voskovi i sprejevi za frizuru", variant: "bone" as const },
  { title: "Alati i Pribor", slug: "frizerski-pribor", desc: "Fenovi, četke, makaze i salonska oprema", variant: "white" as const },
  { title: "Boje za Kosu", slug: "permanentne-boje", desc: "Permanentne, demi i semi-permanentne boje", variant: "dark" as const },
  { title: "Oksidanti & Dekoloranti", slug: "oksidanti", desc: "Oksidanti i dekolorantni puder za posveltljivanje", variant: "bone" as const },
  { title: "Muška Kolekcija", slug: "color-camo", desc: "Boje i nega specijalno za muškarce", variant: "white" as const },
];

const brandLogos = [
  { name: "Redken", logo: "/brands/redken.webp" },
  { name: "Matrix", logo: "/brands/matrix.png" },
  { name: "L'Oréal Professionnel", logo: "/brands/loreal.svg" },
  { name: "Kérastase", logo: "/brands/kerastase.png" },
  { name: "Biolage", logo: "/brands/biolage.webp" },
  { name: "Olaplex", logo: "/brands/olaplex.svg" },
  { name: "Framesi", logo: "/brands/framesi.webp" },
  { name: "Elchim", logo: "/brands/elchim.png" },
  { name: "L'image", logo: "/brands/limage.png" },
  { name: "Mizutani", logo: "/brands/mizutani.png" },
  { name: "Olivia Garden", logo: "/brands/olivia-garden.png" },
  { name: "Redken Brews", logo: "/brands/redken-brews.png" },
];

/* ─── ProductCard ─── */
function ProductCard({ product, showOld = false, badge, dark = false }: { product: ProductData; showOld?: boolean; badge?: string; dark?: boolean }) {
  const { t } = useLanguage();
  const [liked, setLiked] = useState(false);
  const newLabel = t("home.new");
  const discountBadge = product.oldPrice ? `-${Math.round((1 - product.price / product.oldPrice) * 100)}%` : null;
  const displayBadge = product.promoBadge || badge || (product.isNew ? newLabel : discountBadge);
  const textColor = dark ? "text-[#FFFBF4]" : "text-[#11120D]";
  const starFill = dark ? "fill-[#FFFBF4] text-[#FFFBF4]" : "fill-[#11120D] text-[#11120D]";

  return (
    <Link href={`/products/${product.slug}`} className="product-card group flex flex-col bg-white rounded-2xl overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <Image src={product.image || defaultImg} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
        {displayBadge && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm ${
            displayBadge === newLabel ? "bg-[#7A7F6A] text-white"
            : displayBadge.startsWith("-") ? "bg-[#b5453a] text-white"
            : "bg-[#11120D] text-white"
          }`}>{displayBadge}</span>
        )}
        <button onClick={(e) => { e.preventDefault(); setLiked(!liked); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10">
          <Heart className={`w-4 h-4 ${liked ? "fill-[#7A7F6A] text-[#7A7F6A]" : "text-[#a5a995]"}`} />
        </button>
      </div>
      <div className="px-3 pb-3 pt-2">
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#a5a995] font-medium">{product.brand}</span>
        <h3 className={`text-sm font-medium ${textColor} mt-0.5 line-clamp-1`}>{product.name}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          {(showOld || product.promoBadge) && product.oldPrice && <span className="text-sm text-[#a5a995] line-through">{product.oldPrice.toLocaleString("sr-RS")}</span>}
          <span className={`text-sm font-semibold ${textColor}`}>{product.price.toLocaleString("sr-RS")} RSD</span>
        </div>
        <div className="flex items-center gap-0.5 mt-1.5">
          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(product.rating) ? starFill : "text-[#D8CFBC]"}`} />)}
        </div>
      </div>
    </Link>
  );
}

/* ─── ProductCarousel ─── */
function ProductCarousel({ products, showOld = false, dark = false }: { products: ProductData[]; showOld?: boolean; dark?: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w < 640) setItemsPerView(2);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {products.map((p) => <ProductCard key={p.id} product={p} showOld={showOld} dark={dark} />)}
      </div>
    );
  }

  return (
    <div className="relative" onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current); }} onMouseLeave={() => { timerRef.current = setInterval(goNext, 4000); }}>
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(${translateX}%)` }}>
          {products.map((p) => (
            <div key={p.id} className="flex-shrink-0 px-2.5" style={{ width: `${slidePercent}%` }}>
              <ProductCard product={p} showOld={showOld} dark={dark} />
            </div>
          ))}
        </div>
      </div>
      <button onClick={goPrev} className="absolute -left-4 top-[30%] w-10 h-10 rounded-full bg-white border border-[#D8CFBC] flex items-center justify-center hover:border-[#7A7F6A] transition-all z-10 shadow-sm"><ChevronLeft className="w-5 h-5 text-[#11120D]" /></button>
      <button onClick={goNext} className="absolute -right-4 top-[30%] w-10 h-10 rounded-full bg-white border border-[#D8CFBC] flex items-center justify-center hover:border-[#7A7F6A] transition-all z-10 shadow-sm"><ChevronRight className="w-5 h-5 text-[#11120D]" /></button>
    </div>
  );
}

/* ─── Props ─── */
interface Props {
  featuredProducts: ProductData[];
  bestsellers: ProductData[];
  newArrivals: ProductData[];
  saleProducts: ProductData[];
  heroImages: string[];
}

/* ─── Main Page ─── */
export default function HomePageClient({ featuredProducts, newArrivals, saleProducts, heroImages }: Props) {
  const { t } = useLanguage();

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [showNewsletter, setShowNewsletter] = useState(false);
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

  const heroLeft = heroImages[0] || null;
  const heroTopRight = heroImages[1] || null;
  const heroBottomRight = heroImages[2] || null;

  return (
    <div className="min-h-screen bg-[#FFFBF4]">
      <Header />

      {/* ═══════════════════════════════════════════════════════════
          1. HERO — 3-panel grid with gaps & rounded corners
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#FFFBF4] pt-6 pb-6 md:pt-10 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 md:gap-5 md:max-h-[75vh]">
            {/* Left large banner */}
            <Link href="/products" className="relative block overflow-hidden rounded-2xl md:rounded-3xl bg-[#D8CFBC] group">
              {heroLeft ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroLeft} alt="Banner 1" className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500" loading="eager" fetchPriority="high" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-8 md:p-12">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#11120D]/50 font-medium">Ekskluzivna ponuda</span>
                  <div>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-light text-[#11120D] leading-[0.95] mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      -15%<br />na ceo<br />brend
                    </h2>
                    <p className="text-2xl md:text-3xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      Besplatna<br /><em className="italic">dostava</em>
                    </p>
                    <span className="inline-flex items-center gap-2 mt-6 text-xs uppercase tracking-[0.15em] font-medium text-[#11120D] border-b border-[#11120D] pb-0.5">
                      Istražite kolekciju <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* Right column — two stacked banners */}
            <div className="grid grid-rows-2 gap-4 md:gap-5">
              {/* Top right */}
              <Link href="/products" className="relative block overflow-hidden rounded-2xl md:rounded-3xl bg-[#11120D] group">
                {heroTopRight ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroTopRight} alt="Banner 2" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" loading="eager" />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col justify-end p-6 md:p-8">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#a5a995] font-medium mb-2">Premium linija</span>
                    <h3 className="text-xl md:text-2xl font-light text-[#FFFBF4] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      Otkrijte <em className="italic">premium</em><br />nege za kosu
                    </h3>
                  </div>
                )}
              </Link>

              {/* Bottom right */}
              <Link href="/products" className="relative block overflow-hidden rounded-2xl md:rounded-3xl bg-[#7A7F6A] group">
                {heroBottomRight ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroBottomRight} alt="Banner 3" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" loading="lazy" />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col justify-end p-6 md:p-8 relative">
                    <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider font-medium border border-[#FFFBF4]/40 text-[#FFFBF4] px-3 py-1 rounded-full">Novo</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#FFFBF4]/70 font-medium mb-2">U salonu</span>
                    <h3 className="text-xl md:text-2xl font-light text-[#FFFBF4] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      Premium hair<br /><em className="italic">simbol.</em>
                    </h3>
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. BRAND LOGO MARQUEE — infinite scroll
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-[#D8CFBC] py-8 md:py-10 bg-white overflow-hidden">
        <div className="relative flex">
          {/* Two identical strips side by side — when the first scrolls fully left, the second takes over seamlessly */}
          {[0, 1].map((setIndex) => (
            <div key={setIndex} className="flex animate-marquee flex-shrink-0">
              {brandLogos.map((brand) => (
                <div key={`${brand.name}-${setIndex}`} className="flex-shrink-0 mx-8 md:mx-12">
                  <div className="relative h-8 md:h-10 w-28 md:w-36">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      sizes="144px"
                      className="object-contain brightness-0 opacity-40 hover:opacity-70 transition-opacity"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. CATEGORIES — card grid (dark/bone/white)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-[#FFFBF4]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-14 items-end">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#a5a995] font-medium block mb-3">Kategorije</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#11120D] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Pronađi svoj <em className="italic">ritual</em> nege kose.
              </h2>
            </div>
            <p className="text-sm text-[#a5a995] leading-relaxed md:text-right">
              Od svakodnevne nege do profesionalnog tretmana — sve što vam je potrebno za savršenu kosu, na jednom mestu.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {categoryCards.map((cat, i) => {
              const isDark = cat.variant === "dark";
              const isBone = cat.variant === "bone";
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className={`group rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[180px] md:min-h-[220px] transition-all hover:-translate-y-1 ${
                    isDark
                      ? "bg-[#11120D] text-[#FFFBF4]"
                      : isBone
                        ? "bg-[#D8CFBC] text-[#11120D]"
                        : "bg-white border border-[#D8CFBC] text-[#11120D]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-[10px] tracking-wider ${isDark ? "text-[#a5a995]" : "text-[#a5a995]"}`}>
                      {String(i + 1).padStart(2, "0")} / {String(categoryCards.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-light mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{cat.title}</h3>
                    <p className={`text-[11px] italic mb-4 ${isDark ? "text-[#a5a995]" : "text-[#11120D]/50"}`}>{cat.desc}</p>
                    <span className={`text-[10px] uppercase tracking-[0.15em] font-medium flex items-center gap-1 ${
                      isDark ? "text-[#a5a995] group-hover:text-[#FFFBF4]" : "text-[#a5a995] group-hover:text-[#11120D]"
                    } transition-colors`}>
                      Istraži <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. BEST SELLERS / FEATURED
      ═══════════════════════════════════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-24 bg-[#11120D]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#a5a995] font-medium block mb-2">Omiljeni proizvodi</span>
                <h2 className="text-3xl md:text-4xl font-light text-[#FFFBF4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {t("home.featuredProducts")}
                </h2>
              </div>
              <Link href="/products" className="text-xs uppercase tracking-[0.15em] font-medium text-[#FFFBF4] hover:text-[#D8CFBC] transition-colors flex items-center gap-1">
                {t("home.viewAllProducts")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ProductCarousel products={featuredProducts} showOld />
          </div>
        </section>
      )}

  

      {/* ═══════════════════════════════════════════════════════════
          6. NEW ARRIVALS — bone background
      ═══════════════════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="py-16 md:py-24 bg-[#D8CFBC]">
          <div className="max-w-7xl mx-auto px-4">
          {/* Merged B2B/B2C card — white bg, olive accents */}
          <div className="bg-white border border-[#D8CFBC] rounded-3xl p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#a5a995] font-medium block mb-3">Za profesionalce i sve kupce</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Napravljeno za <em className="italic font-medium">profesionalce</em>.<br />
                Voljeno od <em className="italic">svih</em>.
              </h2>
              <p className="text-sm text-[#a5a995] leading-relaxed mt-4 max-w-xl mx-auto">
                Salonski partneri dobijaju ekskluzivne veleprodajne cene, rani pristup novim proizvodima i posvećenog menadžera. Svi kupci uživaju u salonskom kvalitetu kod kuće.
              </p>
            </div>

            {/* Stats grid with olive dividers */}
            <div className="grid grid-cols-2 md:grid-cols-4 mb-10">
              <div className="p-5 md:p-6 border-r border-b border-[#7A7F6A]/20">
                <span className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>30%</span>
                <p className="text-[10px] uppercase tracking-wider text-[#a5a995] mt-1">Veleprodajni popust</p>
              </div>
              <div className="p-5 md:p-6 md:border-r border-b border-[#7A7F6A]/20">
                <span className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>48h</span>
                <p className="text-[10px] uppercase tracking-wider text-[#a5a995] mt-1">Prioritetna isporuka</p>
              </div>
              <div className="p-5 md:p-6 border-r md:border-b border-[#7A7F6A]/20">
                <span className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>1:1</span>
                <p className="text-[10px] uppercase tracking-wider text-[#a5a995] mt-1">Lični menadžer</p>
              </div>
              <div className="p-5 md:p-6 border-b md:border-b border-[#7A7F6A]/20">
                <span className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>0 din</span>
                <p className="text-[10px] uppercase tracking-wider text-[#a5a995] mt-1">Članarina</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-10">
              {["Besplatna dostava preko 5.000 RSD", "30 dana garancija povrata", "Stručne preporuke"].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-[#11120D]/70">
                  <Check className="w-4 h-4 text-[#7A7F6A] flex-shrink-0" /> {item}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/account/login" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#11120D] text-[#11120D] text-xs uppercase tracking-wider font-medium hover:bg-[#11120D] hover:text-[#FFFBF4] transition-all">
                Prijavi se za veleprodaju <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/products" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#7A7F6A] text-[#FFFBF4] text-xs uppercase tracking-wider font-medium hover:bg-[#5c6050] transition-all">
                Istraži ponudu <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          7. B2B SPLIT — "Built for professionals"
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-[#FFFBF4]">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#7A7F6A] font-medium block mb-2">Upravo stiglo</span>
                <h2 className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {t("home.newArrivals")}
                </h2>
              </div>
              <Link href="/products" className="text-xs uppercase tracking-[0.15em] font-medium text-[#11120D] hover:text-[#7A7F6A] transition-colors flex items-center gap-1">
                {t("home.allProducts")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ProductCarousel products={newArrivals} />
          </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8. SALE PRODUCTS
      ═══════════════════════════════════════════════════════════ */}
      {saleProducts.length > 0 && (
        <section className="py-16 md:py-24 bg-white border-t border-[#D8CFBC]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#a5a995] font-medium block mb-2">Posebne ponude</span>
                <h2 className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {t("home.saleProducts")}
                </h2>
              </div>
              <Link href="/outlet" className="text-xs uppercase tracking-[0.15em] font-medium text-[#11120D] hover:text-[#7A7F6A] transition-colors flex items-center gap-1">
                {t("home.allSales")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ProductCarousel products={saleProducts} showOld />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          10. INSTAGRAM FEED
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-white border-t border-[#D8CFBC]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.instagramHandle")}</h2>
            <p className="text-[#a5a995] mt-2 text-sm">{t("home.instagramDesc")}</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {instagramImages.map((img, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden cursor-pointer group relative">
                <Image src={img} alt={`Instagram ${i + 1}`} fill sizes="(max-width: 768px) 33vw, 16vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          11. NEWSLETTER — split layout
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-[#FFFBF4] border-t border-[#D8CFBC]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#a5a995] font-medium block mb-3">Pridruži se listi</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#11120D] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Prvi pristup.<br /><em className="italic">Ekskluzivne pogodnosti.</em>
              </h2>
            </div>
            <div>
              <p className="text-sm text-[#a5a995] leading-relaxed mb-5">
                Prijavi se za ekskluzivne ponude, nove proizvode i profesionalne savete — bez spama, obećavamo.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); handleNewsletterSubmit(newsletterEmail, setNewsletterStatus, setNewsletterMessage); }} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Vaša email adresa"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-white border border-[#D8CFBC] rounded-lg px-4 py-3 text-[#11120D] placeholder-[#a5a995] text-sm focus:border-[#7A7F6A] focus:ring-0 focus:outline-none"
                  required
                />
                <button type="submit" disabled={newsletterStatus === "loading"} className="bg-[#7A7F6A] text-[#FFFBF4] px-6 py-3 rounded-lg font-medium transition-colors text-sm disabled:opacity-60 hover:bg-[#5c6050] uppercase tracking-wider text-xs">
                  {newsletterStatus === "loading" ? "..." : "Prijavi se"}
                </button>
              </form>
              {newsletterStatus !== "idle" && newsletterStatus !== "loading" && (
                <p className={`mt-3 text-sm ${newsletterStatus === "success" ? "text-green-600" : "text-red-500"}`}>{newsletterMessage}</p>
              )}
              <p className="text-[11px] text-[#a5a995] mt-3">
                Prijavom se slažete sa našom <Link href="/privacy" className="underline hover:text-[#11120D]">politikom privatnosti</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* NEWSLETTER POPUP */}
      {showNewsletter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewsletter(false)} />
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative z-10 animate-scaleIn border border-[#D8CFBC]">
            <button onClick={() => setShowNewsletter(false)} className="absolute top-4 right-4"><X className="w-5 h-5 text-[#a5a995] hover:text-[#11120D]" /></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFFBF4] rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-[#7A7F6A]" /></div>
              <h3 className="text-2xl font-light text-[#11120D] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("home.popupTitle")}</h3>
              <p className="text-[#a5a995] text-sm mb-6">{t("home.popupDesc")}</p>
              {popupStatus === "success" ? (
                <p className="text-green-600 text-sm py-4">{popupMessage}</p>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleNewsletterSubmit(popupEmail, setPopupStatus, setPopupMessage, () => {
                    setTimeout(() => setShowNewsletter(false), 1500);
                  });
                }}>
                  <input type="email" placeholder={t("home.emailPlaceholder")} value={popupEmail} onChange={(e) => setPopupEmail(e.target.value)} className="w-full border border-[#D8CFBC] rounded-lg px-4 py-3 text-sm mb-3 focus:border-[#7A7F6A] focus:outline-none" required />
                  <button type="submit" disabled={popupStatus === "loading"} className="w-full bg-[#7A7F6A] hover:bg-[#5c6050] text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-60">
                    {popupStatus === "loading" ? t("home.subscribing") : t("home.subscribe")}
                  </button>
                  {popupStatus === "error" && (
                    <p className="text-red-500 text-sm mt-2">{popupMessage}</p>
                  )}
                </form>
              )}
              <button onClick={() => setShowNewsletter(false)} className="text-xs text-[#a5a995] mt-3 hover:text-[#11120D] block mx-auto">{t("home.noThanks")}</button>
            </div>
          </div>
        </div>
      )}

      {!showNewsletter && (
        <button onClick={() => setShowNewsletter(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-[#7A7F6A] hover:bg-[#5c6050] text-white rounded-full flex items-center justify-center z-40 transition-all hover:scale-110 shadow-lg">
          <Mail className="w-6 h-6" />
        </button>
      )}

      <ChatWidget />
      <CookieConsent />
    </div>
  );
}
