"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Heart, Star, ArrowRight, Music2, ChevronLeft, ChevronRight,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Mail, X, Instagram, Youtube,
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

const defaultImg = "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&h=800&fit=crop";

/* Brand marquee — partner logos displayed on the home page */
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

/* Feature grid — six Alta Moda values */
const features = [
  {
    title: "Autorizovani distributer",
    desc: "Radimo direktno sa vodećim svetskim brendovima profesionalne kozmetike za kosu.",
  },
  {
    title: "Tradicija od 1996.",
    desc: "Tri decenije iskustva i poverenja generacija frizera i ljubitelja lepe kose.",
  },
  {
    title: "Salonski kvalitet",
    desc: "Profesionalni proizvodi za salonsku i kućnu upotrebu — bez kompromisa.",
  },
  {
    title: "Stručni saveti",
    desc: "Pouzdane informacije i preporuke od vrhunskih frizera i naših saradnika.",
  },
  {
    title: "Brza isporuka",
    desc: "Besplatna dostava preko 5.000 RSD. Pouzdana logistika na teritoriji Srbije.",
  },
  {
    title: "Id Hair Academy",
    desc: "Edukacije, obuke i seminari — put ka svetu uspešnih profesionalaca.",
  },
];

/* Social feed — mini editorial grid */
const socialImages = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=600&h=600&fit=crop",
];

/* Testimonials — "In good company" */
const testimonials = [
  { quote: "Moja kosa nikada nije bila mekša. Uljem se mažem svake večeri kao ritualom.", author: "Sofia R.", city: "Milano" },
  { quote: "Šampon sam je bio dovoljan da me ubedi. Maska je transcendentna.", author: "Eleanor T.", city: "London" },
  { quote: "Konačno, brend koji miriše kao bašta, ne kao laboratorija.", author: "Anaïs M.", city: "Pariz" },
];

/* ─── Editorial ProductCard — minimalist reference-aligned ─── */
function ProductCard({ product, badge }: { product: ProductData; badge?: string }) {
  const { t } = useLanguage();
  const [liked, setLiked] = useState(false);
  const newLabel = t("home.new");
  const discountBadge = product.oldPrice ? `-${Math.round((1 - product.price / product.oldPrice) * 100)}%` : null;
  const displayBadge = product.promoBadge || badge || (product.isNew ? newLabel : discountBadge);

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F2ECDE] mb-5">
        <Image
          src={product.image || defaultImg}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
        />
        {displayBadge && (
          <span className="absolute top-4 left-4 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] bg-[#FFFBF4]/90 text-[#11120D] backdrop-blur-sm">
            {displayBadge}
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFFBF4]/70 backdrop-blur-sm flex items-center justify-center hover:bg-[#FFFBF4] transition-colors opacity-0 group-hover:opacity-100"
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-[#11120D] text-[#11120D]" : "text-[#11120D]"}`} />
        </button>
      </div>
      <div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#11120D]/60 font-medium block mb-1.5">{product.brand}</span>
        <h3 className="text-base text-[#11120D] mb-1 font-normal" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-[#11120D]">
          {product.oldPrice && <span className="text-[#11120D]/60 line-through text-xs">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
          <span>{product.price.toLocaleString("sr-RS")} RSD</span>
        </div>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(product.rating) ? "fill-[#11120D] text-[#11120D]" : "fill-[#11120D]/15 text-[#11120D]/25"}`} />
          ))}
        </div>
      </div>
    </Link>
  );
}

/* ─── ProductCarousel — auto-advancing editorial slider ─── */
function ProductCarousel({
  products,
  badge,
  desktopPerView = 4,
}: {
  products: ProductData[];
  badge?: string | ((i: number) => string | undefined);
  desktopPerView?: 3 | 4;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState<number>(desktopPerView);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w < 768) setItemsPerView(2);
      else if (w < 1024 && desktopPerView === 4) setItemsPerView(3);
      else setItemsPerView(desktopPerView);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [desktopPerView]);

  const totalSlides = Math.max(1, products.length - itemsPerView + 1);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, totalSlides - 1));
  }, [totalSlides]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const needsCarousel = totalSlides > 1;

  useEffect(() => {
    if (!needsCarousel) return;
    timerRef.current = setInterval(goNext, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [goNext, needsCarousel]);

  const resolveBadge = (i: number): string | undefined => {
    if (typeof badge === "function") return badge(i);
    return badge;
  };

  const slidePercent = 100 / itemsPerView;
  const translateX = -(currentIndex * slidePercent);

  if (!needsCarousel) {
    return (
      <div className={`grid ${desktopPerView === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"} gap-5 md:gap-8`}>
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} badge={resolveBadge(i)} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        if (timerRef.current) clearInterval(timerRef.current);
      }}
      onMouseLeave={() => {
        timerRef.current = setInterval(goNext, 4000);
      }}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${translateX}%)` }}
        >
          {products.map((p, i) => (
            <div
              key={p.id}
              className="flex-shrink-0 px-2 md:px-3"
              style={{ width: `${slidePercent}%` }}
            >
              <ProductCard product={p} badge={resolveBadge(i)} />
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={goPrev}
        aria-label="Previous"
        className="absolute -left-3 md:-left-5 top-[35%] w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FFFBF4] border border-[#D8CFBC] flex items-center justify-center hover:border-[#11120D] transition-colors z-10 shadow-sm"
      >
        <ChevronLeft className="w-4 h-4 text-[#11120D]" />
      </button>
      <button
        onClick={goNext}
        aria-label="Next"
        className="absolute -right-3 md:-right-5 top-[35%] w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FFFBF4] border border-[#D8CFBC] flex items-center justify-center hover:border-[#11120D] transition-colors z-10 shadow-sm"
      >
        <ChevronRight className="w-4 h-4 text-[#11120D]" />
      </button>
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

/* ═══════════════════════════════════════════════════════════════════
   Main editorial home page — inspired by botanical-press aesthetic
═══════════════════════════════════════════════════════════════════ */
export default function HomePageClient({ featuredProducts, bestsellers, newArrivals, saleProducts, heroImages }: Props) {
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

  const heroImage = heroImages[0] || null;
  const philosophyImage = heroImages[1] || null;
  const pressImage = heroImages[2] || null;

  const bestsellerList = (bestsellers.length > 0 ? bestsellers : featuredProducts).slice(0, 9);
  const newList = newArrivals.slice(0, 8);
  const saleList = saleProducts.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#FFFBF4]" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <Header />

      {/* ═══════════════════════════════════════════════════════════
          1. HERO — editorial split with product hero
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#FFFBF4] pt-6 md:pt-10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr] gap-10 md:gap-14 items-center min-h-[78vh]">
            {/* LEFT — editorial copy */}
            <div className="pt-6 md:pt-0">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#11120D]/60 font-medium block mb-8">
                Od 1996.
              </span>
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-light text-[#11120D] leading-[1.02] mb-10 tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Profesionalna nega,
                <br />
                <em className="italic">sa poverenjem</em>.
              </h1>
              <p className="text-[15px] text-[#11120D]/70 leading-relaxed max-w-md mb-12">
                Alta Moda je generalni zastupnik i distributer vodećih svetskih brendova za kosu — Redken, Matrix, Biolage, Elchim, Mizutani, L&rsquo;image. Salonski kvalitet za profesionalce i ljubitelje lepe kose.
              </p>

              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#11120D] border-b border-[#11120D] pb-1 hover:opacity-70 transition-opacity"
              >
                Istraži kolekciju <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Stats row — Alta Moda heritage */}
              <div className="grid grid-cols-3 gap-6 md:gap-10 mt-16 md:mt-20 pt-10 border-t border-[#D8CFBC]/60 max-w-md">
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    30
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-[#11120D]/60 mt-1.5 leading-tight">
                    Godina<br />iskustva
                  </div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    8<span className="text-xl">+</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-[#11120D]/60 mt-1.5 leading-tight">
                    Ekskluzivnih<br />brendova
                  </div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    100<span className="text-xl">%</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-[#11120D]/60 mt-1.5 leading-tight">
                    Originalni<br />proizvodi
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — three stacked banners */}
            <div className="flex flex-col gap-2 md:gap-3 md:h-[78vh]">
              {[heroImage, philosophyImage, pressImage].map((img, i) => (
                <div
                  key={i}
                  className="relative flex-1 min-h-[180px] bg-[#F2ECDE] overflow-hidden"
                >
                  {img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={img}
                      alt={`altamoda banner ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                    />
                  ) : (
                    <Image
                      src={defaultImg}
                      alt="altamoda"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      priority={i === 0}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. BRAND MARQUEE — partner logos scrolling
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-[#D8CFBC]/70 py-8 md:py-10 mt-16 md:mt-24 overflow-hidden bg-[#FFFBF4]">
        <div className="relative flex">
          {[0, 1].map((setIndex) => (
            <div key={setIndex} className="flex animate-marquee flex-shrink-0">
              {brandLogos.map((brand) => (
                <div key={`${brand.name}-${setIndex}`} className="flex-shrink-0 mx-8 md:mx-14 flex items-center">
                  <div className="relative h-10 md:h-12 w-32 md:w-44">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      sizes="176px"
                      className="object-contain brightness-0 opacity-60 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. BESTSELLERS — three large editorial cards
      ═══════════════════════════════════════════════════════════ */}
      {bestsellerList.length > 0 && (
        <section className="py-20 md:py-28 bg-[#FFFBF4]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-14 md:mb-20 gap-8 flex-wrap">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#11120D]/60 font-medium block mb-5">
                  Omiljeni proizvodi
                </span>
                <h2
                  className="text-4xl md:text-5xl lg:text-6xl font-light text-[#11120D] leading-[1.05] tracking-tight"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Bestseleri, <em className="italic">izabrani</em>
                  <br />
                  od profesionalaca.
                </h2>
              </div>
              <Link
                href="/products"
                className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#11120D] hover:opacity-60 transition-opacity flex items-center gap-1.5 pb-1 border-b border-[#11120D]"
              >
                Pogledaj sve <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ProductCarousel
              products={bestsellerList}
              badge={(i) => (i === 2 ? "Novo" : "Bestseler")}
            />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          4. B2B PARTNERS — salons & wholesale partners
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#EFE7D5]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Left — image (landscape) */}
            <div className="relative aspect-[4/3] md:aspect-[5/4] bg-[#D8CFBC] overflow-hidden">
              <Image
                src="/b2bhero.png"
                alt="altamoda saloni partneri"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Right — text */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#11120D]/60 font-medium block mb-6">
                Za salone
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-[#11120D] leading-[1.05] mb-8 tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Partneri koji
                <br />
                <em className="italic">grade</em> struku.
              </h2>
              <p className="text-[14px] text-[#11120D]/70 leading-[1.8] mb-5 max-w-lg">
                Alta Moda je već tri decenije sinonim za pouzdanu saradnju sa frizerskim salonima. Naši partneri dobijaju veleprodajne uslove, direktan pristup proizvodima svetskih brendova i tehničku podršku kada im zatreba.
              </p>
              <p className="text-[14px] text-[#11120D]/70 leading-[1.8] mb-10 max-w-lg">
                Od porodičnih salona do vodećih lanaca — gradimo zajednički uspeh, korak po korak.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 justify-items-center sm:justify-items-start border-t border-[#D8CFBC] pt-8 mb-10 max-w-lg">
                {[
                  { v: "Veleprodaja", l: "Salonske cene" },
                  { v: "48h", l: "Isporuka" },
                  { v: "1:1", l: "Podrška" },
                  { v: "0 din", l: "Članarina" },
                ].map((s, i) => (
                  <div key={i} className={`text-center sm:text-left ${i < 3 ? "sm:border-r sm:border-[#D8CFBC]" : ""} sm:pr-2`}>
                    <div className="text-xl md:text-2xl font-light text-[#11120D]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {s.v}
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.22em] text-[#11120D]/60 mt-1.5">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Link
                  href="/account/login"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#FFFBF4] bg-[#11120D] px-7 py-3.5 hover:bg-[#2b2c24] transition-colors"
                >
                  Prijavi se za veleprodaju <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {/* <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#11120D] border-b border-[#11120D] pb-1 hover:opacity-60 transition-opacity sm:self-center"
                >
                  Kontaktiraj nas <ArrowRight className="w-3.5 h-3.5" />
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. FEATURES — "Everything your hair needs" six-point grid
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-14 md:py-32 bg-[#FFFBF4]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          <div className="text-center mb-10 md:mb-24">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#11120D]/60 font-medium block mb-4 md:mb-5">
              Šta nas izdvaja
            </span>
            <h2
              className="text-3xl md:text-5xl lg:text-6xl font-light text-[#11120D] leading-[1.05] tracking-tight mb-4 md:mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Tri decenije
              <br />
              <em className="italic">posvećenosti</em> zanatu.
            </h2>
            <p className="text-[13px] md:text-[14px] text-[#11120D]/65 leading-relaxed max-w-xl mx-auto">
              Od 1996. godine gradimo Alta Moda — okružene brendovima kojima se veruje, frizerima koji nam veruju i kupcima koji znaju šta traže.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 md:gap-y-16 gap-x-5 md:gap-x-14 border-t border-[#D8CFBC]/60">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`pt-6 md:pt-12 ${i < 3 ? "md:border-b md:pb-12" : ""} ${i !== 2 && i !== 5 ? "md:border-r md:pr-10" : ""} md:border-[#D8CFBC]/60`}
              >
                <div className="w-7 h-7 md:w-9 md:h-9 rounded-full border border-[#D8CFBC] bg-[#F2ECDE] mb-3 md:mb-5" />
                <h3 className="text-[15px] md:text-[22px] font-light text-[#11120D] mb-1.5 md:mb-3 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {f.title}
                </h3>
                <p className="text-[11px] md:text-[13px] text-[#11120D]/60 leading-[1.55] md:leading-[1.7]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. NEW ARRIVALS — editorial grid
      ═══════════════════════════════════════════════════════════ */}
      {newList.length > 0 && (
        <section className="py-20 md:py-28 bg-[#FFFBF4]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-14 md:mb-20 gap-8 flex-wrap">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#11120D]/60 font-medium block mb-5">
                  Upravo stiglo
                </span>
                <h2
                  className="text-4xl md:text-5xl font-light text-[#11120D] leading-[1.05] tracking-tight"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Nove <em className="italic">linije</em> i najave.
                </h2>
              </div>
              <Link
                href="/products?sort=new"
                className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#11120D] hover:opacity-60 transition-opacity flex items-center gap-1.5 pb-1 border-b border-[#11120D]"
              >
                {t("home.allProducts")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ProductCarousel products={newList} badge="Novo" />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          8. EDUCATION CENTER — dark editorial split
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-[#11120D] text-[#FFFBF4]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-12 md:gap-20 items-center">
            {/* Left — image */}
            <div className="relative aspect-[5/6] md:aspect-[4/5] bg-[#1a1b15] overflow-hidden">
              <Image
                src="/edukacija2.jpg"
                alt="ID Hair Academy edukacija"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Right — text */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#FFFBF4]/60 font-medium block mb-6">
                Edukacija
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05] mb-8 tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Id Hair Academy.
                <br />
                Put ka <em className="italic">uspešnim</em>
                <br />
                profesionalcima.
              </h2>
              <p className="text-[14px] text-[#FFFBF4]/60 leading-[1.8] mb-5 max-w-lg">
                Kroz Id Hair Academy — partnerski edukativni centar Alta Mode — nudimo obuke, seminare i radionice koje otvaraju vrata svetu profesionalne nege kose.
              </p>
              <p className="text-[14px] text-[#FFFBF4]/60 leading-[1.8] mb-10 max-w-lg">
                Od osnovnih tehnika šišanja i bojenja do naprednih salonskih veština — mentorstvo vrhunskih stručnjaka sa decenijama iskustva.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 border-t border-[#FFFBF4]/15 pt-8 mb-10 max-w-md">
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#FFFBF4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    6
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFBF4]/60 mt-1.5 leading-tight">
                    Meseci<br />programa
                  </div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#FFFBF4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    2008
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFBF4]/60 mt-1.5 leading-tight">
                    Godina<br />osnivanja
                  </div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#FFFBF4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    500<span className="text-xl">+</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFBF4]/60 mt-1.5 leading-tight">
                    Polaznika<br />godišnje
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Link
                  href="/education"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#11120D] bg-[#FFFBF4] px-7 py-3.5 hover:bg-[#D8CFBC] transition-colors"
                >
                  Istraži edukaciju <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          9. SALE — editorial card grid
      ═══════════════════════════════════════════════════════════ */}
      {saleList.length > 0 && (
        <section className="py-20 md:py-28 bg-[#FFFBF4] border-t border-[#D8CFBC]/60">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-14 md:mb-20 gap-8 flex-wrap">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#11120D]/60 font-medium block mb-5">
                  Posebne ponude
                </span>
                <h2
                  className="text-4xl md:text-5xl font-light text-[#11120D] leading-[1.05] tracking-tight"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Akcije i <em className="italic">sniženja</em>.
                </h2>
              </div>
              <Link
                href="/outlet"
                className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#11120D] hover:opacity-60 transition-opacity flex items-center gap-1.5 pb-1 border-b border-[#11120D]"
              >
                {t("home.allSales")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ProductCarousel products={saleList} />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          10.5 SOCIAL — Instagram feed & social links
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#FFFBF4] border-t border-[#D8CFBC]/60">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between mb-12 md:mb-16 gap-8 flex-wrap">
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#11120D]/60 font-medium block mb-5">
                Prati nas
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-[#11120D] leading-[1.05] tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                <em className="italic">@altamoda</em> na mreži.
              </h2>
              <p className="text-[14px] text-[#11120D]/60 leading-relaxed mt-5 max-w-md">
                Najnoviji trendovi, saveti frizera i najave edukacija — pridruži se zajednici koja živi profesionalnu negu kose.
              </p>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-11 h-11 rounded-full border border-[#D8CFBC] flex items-center justify-center text-[#11120D] hover:bg-[#11120D] hover:text-[#FFFBF4] hover:border-[#11120D] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-11 h-11 rounded-full border border-[#D8CFBC] flex items-center justify-center text-[#11120D] hover:bg-[#11120D] hover:text-[#FFFBF4] hover:border-[#11120D] transition-colors"
              >
                <Music2 className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-11 h-11 rounded-full border border-[#D8CFBC] flex items-center justify-center text-[#11120D] hover:bg-[#11120D] hover:text-[#FFFBF4] hover:border-[#11120D] transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {socialImages.map((img, i) => (
              <a
                key={i}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square overflow-hidden bg-[#F2ECDE] group relative"
              >
                <Image
                  src={img}
                  alt={`altamoda instagram ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 33vw, 16vw"
                  className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-[#11120D]/0 group-hover:bg-[#11120D]/30 transition-colors flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-[#FFFBF4] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          11. NEWSLETTER — dark editorial subscribe
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#11120D] text-[#FFFBF4]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#FFFBF4]/60 font-medium block mb-5">
                Newsletter
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05] tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Novi proizvodi, akcije &amp; <em className="italic">saveti</em>.
              </h2>
            </div>
            <div>
              <p className="text-[14px] text-[#FFFBF4]/60 leading-relaxed mb-6 max-w-md">
                Pretplati se i prvi saznaj o novim linijama, akcijama i edukacijama Id Hair Academy.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); handleNewsletterSubmit(newsletterEmail, setNewsletterStatus, setNewsletterMessage); }}
                className="flex items-center border-b border-[#FFFBF4]/25 pb-4"
              >
                <input
                  type="email"
                  placeholder="Vaša email adresa"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-transparent text-[#FFFBF4] placeholder-[#FFFBF4]/40 text-sm focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === "loading"}
                  className="text-[10px] uppercase tracking-[0.28em] font-medium text-[#FFFBF4] hover:opacity-70 transition-opacity disabled:opacity-40"
                >
                  {newsletterStatus === "loading" ? "..." : "Prijavi se"}
                </button>
              </form>
              {newsletterStatus !== "idle" && newsletterStatus !== "loading" && (
                <p className={`mt-4 text-sm ${newsletterStatus === "success" ? "text-[#D8CFBC]" : "text-red-400"}`}>
                  {newsletterMessage}
                </p>
              )}
              <p className="text-[11px] text-[#FFFBF4]/40 mt-5 leading-relaxed">
                Prijavom se slažete sa našom{" "}
                <Link href="/privacy" className="underline hover:text-[#FFFBF4]/80">politikom privatnosti</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* NEWSLETTER POPUP */}
      {showNewsletter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNewsletter(false)} />
          <div className="bg-[#FFFBF4] max-w-md w-full p-10 relative z-10 animate-scaleIn">
            <button onClick={() => setShowNewsletter(false)} className="absolute top-5 right-5">
              <X className="w-4 h-4 text-[#11120D]/60 hover:text-[#11120D]" />
            </button>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#11120D]/60 font-medium block mb-4">
                Pridruži se
              </span>
              <h3 className="text-3xl font-light text-[#11120D] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {t("home.popupTitle")}
              </h3>
              <p className="text-[#11120D]/60 text-sm mb-8 leading-relaxed">{t("home.popupDesc")}</p>
              {popupStatus === "success" ? (
                <p className="text-[#7A7F6A] text-sm py-4">{popupMessage}</p>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleNewsletterSubmit(popupEmail, setPopupStatus, setPopupMessage, () => {
                    setTimeout(() => setShowNewsletter(false), 1500);
                  });
                }}>
                  <input
                    type="email"
                    placeholder={t("home.emailPlaceholder")}
                    value={popupEmail}
                    onChange={(e) => setPopupEmail(e.target.value)}
                    className="w-full border-b border-[#D8CFBC] bg-transparent px-0 py-3 text-sm mb-5 focus:border-[#11120D] focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={popupStatus === "loading"}
                    className="w-full bg-[#11120D] hover:bg-[#2b2c24] text-[#FFFBF4] py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors disabled:opacity-60"
                  >
                    {popupStatus === "loading" ? t("home.subscribing") : t("home.subscribe")}
                  </button>
                  {popupStatus === "error" && (
                    <p className="text-red-500 text-sm mt-3">{popupMessage}</p>
                  )}
                </form>
              )}
              <button onClick={() => setShowNewsletter(false)} className="text-[10px] uppercase tracking-[0.22em] text-[#11120D]/60 mt-5 hover:text-[#11120D] block mx-auto">
                {t("home.noThanks")}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showNewsletter && (
        <button
          onClick={() => setShowNewsletter(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#11120D] hover:bg-[#2b2c24] text-[#FFFBF4] rounded-full flex items-center justify-center z-40 transition-all hover:scale-105 shadow-lg"
        >
          <Mail className="w-5 h-5" />
        </button>
      )}

      <ChatWidget />
      <CookieConsent />
    </div>
  );
}
