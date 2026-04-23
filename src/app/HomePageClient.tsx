"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Heart, Star, ArrowRight, Music2, ChevronLeft, ChevronRight,
  Leaf, ShieldCheck, Award, Truck,
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

/* Social feed — mini editorial grid */
const socialImages = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1470259078422-826894b933aa?w=1200&h=600&fit=crop",
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
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-[#F2ECDE] mb-5 transition-all duration-300 ease-out group-hover:-translate-y-0.5 [box-shadow:0_0_0_1px_rgba(46,46,46,0.02),0_2px_6px_rgba(46,46,46,0.04),0_4px_8px_rgba(46,46,46,0.1)] group-hover:[box-shadow:0_0_0_1px_rgba(46,46,46,0.04),0_4px_12px_rgba(46,46,46,0.08),0_16px_32px_rgba(46,46,46,0.14)]"
      >
        <Image
          src={product.image || defaultImg}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
        />
        {displayBadge && (
          <span className="absolute top-4 left-4 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] backdrop-blur-sm rounded-full bg-[#837A64] text-[#FFFFFF]">
            {displayBadge}
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFFFFF]/70 backdrop-blur-sm flex items-center justify-center hover:bg-[#FFFFFF] transition-colors opacity-0 group-hover:opacity-100"
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-[#2e2e2e] text-[#2e2e2e]" : "text-[#2e2e2e]"}`} />
        </button>
      </div>
      <div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 font-medium block mb-1.5">{product.brand}</span>
        <h3 className="text-base text-[#2e2e2e] mb-1 font-normal" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-[#2e2e2e]">
          {product.oldPrice && <span className="text-[#2e2e2e]/60 line-through text-xs">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
          <span>{product.price.toLocaleString("sr-RS")} RSD</span>
        </div>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(product.rating) ? "fill-[#2e2e2e] text-[#2e2e2e]" : "fill-[#2e2e2e]/15 text-[#2e2e2e]/25"}`} />
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
        className="absolute -left-3 md:-left-5 top-[35%] w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FFFFFF] border border-[#D8CFBC] flex items-center justify-center hover:border-[#2e2e2e] hover:scale-[1.08] active:scale-[0.92] transition-all duration-200 z-10 shadow-sm hover:[box-shadow:0_4px_12px_rgba(46,46,46,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e2e2e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
      >
        <ChevronLeft className="w-4 h-4 text-[#2e2e2e]" />
      </button>
      <button
        onClick={goNext}
        aria-label="Next"
        className="absolute -right-3 md:-right-5 top-[35%] w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FFFFFF] border border-[#D8CFBC] flex items-center justify-center hover:border-[#2e2e2e] hover:scale-[1.08] active:scale-[0.92] transition-all duration-200 z-10 shadow-sm hover:[box-shadow:0_4px_12px_rgba(46,46,46,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e2e2e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
      >
        <ChevronRight className="w-4 h-4 text-[#2e2e2e]" />
      </button>
    </div>
  );
}

/* ─── Hero teaser card content ─── */
export interface HeroCard {
  image: string;
  kicker: string;
  title: string;
  paragraph: string;
  cta: string;
  href: string;
}

/* ─── Props ─── */
interface Props {
  featuredProducts: ProductData[];
  bestsellers: ProductData[];
  newArrivals: ProductData[];
  saleProducts: ProductData[];
  heroImages: string[];
  heroCards?: Partial<HeroCard>[];
  socialLinks?: { instagram?: string; facebook?: string; tiktok?: string };
}

/* ═══════════════════════════════════════════════════════════════════
   Main editorial home page — inspired by botanical-press aesthetic
═══════════════════════════════════════════════════════════════════ */
export default function HomePageClient({ featuredProducts, bestsellers, newArrivals, saleProducts, heroImages, heroCards, socialLinks }: Props) {
  const instagramUrl = socialLinks?.instagram || "https://instagram.com";
  const tiktokUrl = socialLinks?.tiktok || "https://tiktok.com";
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

  const heroImage1 = heroImages[0] || defaultImg;
  const heroImage2 = heroImages[1] || defaultImg;
  const heroImage3 = heroImages[2] || defaultImg;

  const bestsellerList = (bestsellers.length > 0 ? bestsellers : featuredProducts).slice(0, 9);
  const newList = newArrivals.slice(0, 8);
  const saleList = saleProducts.slice(0, 8);

  /* Tabbed products section */
  type ProductTab = "bestsellers" | "new" | "sale";
  const [activeTab, setActiveTab] = useState<ProductTab>("bestsellers");
  const tabs: { key: ProductTab; label: string; products: ProductData[]; badge?: string | ((i: number) => string | undefined); viewAll: string }[] = [
    { key: "bestsellers", label: "Bestseleri", products: bestsellerList, badge: (i: number) => (i === 2 ? "Novo" : "Bestseler"), viewAll: "/products" },
    { key: "sale", label: "Akcija", products: saleList, viewAll: "/products?onSale=true" },
    { key: "new", label: "Izdvojena ponuda", products: newList, badge: "Novo", viewAll: "/products?sort=new" },
  ];
  const activeTabData = tabs.find((t) => t.key === activeTab) || tabs[0];

  /* Hero teaser cards — shown below the headline; admin-editable via heroCards */
  const defaultHeroCards: HeroCard[] = [
    {
      kicker: "Novo u ponudi",
      title: "Nove linije i najave",
      paragraph: "Otkrijte najnovije kolekcije vodećih brendova za kosu koje smo ekskluzivno doneli u Srbiju.",
      image: heroImage1,
      href: "/products?sort=new",
      cta: "Istraži novo",
    },
    {
      kicker: "Bestseleri",
      title: "Ono što se vraća u korpu",
      paragraph: "Proverena kvalitetna nega koju hiljade kupaca već godinama smatra obaveznim delom rutine.",
      image: heroImage2,
      href: "/products",
      cta: "Pogledaj izbor",
    },
    {
      kicker: "Edukacija",
      title: "Id Hair Academy",
      paragraph: "Obuke, seminari i radionice za profesionalce — put ka usavršavanju u svetu profesionalne nege kose.",
      image: heroImage3,
      href: "/education",
      cta: "Saznaj više",
    },
  ];
  const heroTeaserCards: HeroCard[] = defaultHeroCards.map((def, i) => {
    const override = heroCards?.[i] || {};
    return {
      kicker: override.kicker ?? def.kicker,
      title: override.title ?? def.title,
      paragraph: override.paragraph ?? def.paragraph,
      cta: override.cta ?? def.cta,
      href: override.href ?? def.href,
      image: override.image || def.image,
    };
  });

  /* New feature cards — below B2B */
  const valueCards = [
    {
      icon: Leaf,
      title: "Prirodna formula",
      desc: "Nežna nega za vašu kosu sa premium sastojcima",
    },
    {
      icon: ShieldCheck,
      title: "Bez okrutnosti",
      desc: "Naši proizvodi nisu testirani na životinjama",
    },
    {
      icon: Award,
      title: "Stručno odobreno",
      desc: "Testirano za sigurnost i vidljive rezultate",
    },
    {
      icon: Truck,
      title: "Besplatna dostava",
      desc: "Za porudžbine preko 5.000 RSD, bez dodatnih troškova",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF]" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <Header />

      {/* ═══════════════════════════════════════════════════════════
          1. HERO — editorial headline + three teaser cards
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#FFFFFF] pt-10 md:pt-16 pb-14 md:pb-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          {/* Top row — headline left, intro copy right */}
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-10 md:gap-16 items-end pb-12 md:pb-16">
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-6">
                Od 1996. — Profesionalna kozmetika za kosu
              </span>
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-light text-[#2e2e2e] leading-[1.02]"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}
              >
                Profesionalna nega,
                <br />
                <em className="italic">sa poverenjem</em>.
              </h1>
            </div>
            <div className="md:pb-3">
              <p className="text-[14px] md:text-[15px] text-[#2e2e2e]/70 leading-[1.8] max-w-md">
                Generalni zastupnik vodećih svetskih brendova za kosu — Redken, Matrix, Biolage, Elchim, Mizutani, L&rsquo;image. Salonski kvalitet za profesionalce i ljubitelje lepe kose.
              </p>
            </div>
          </div>

          {/* Bottom row — three teaser cards (mobile: 1 big + 2 stacked; desktop: 3 equal) */}
          <div className="grid grid-cols-2 grid-rows-2 aspect-[5/4] gap-3 md:grid-cols-3 md:grid-rows-1 md:aspect-auto md:gap-6">
            {heroTeaserCards.map((card, i) => (
              <Link
                key={i}
                href={card.href}
                className={`group relative block overflow-hidden rounded-[4px] bg-[#F2ECDE] md:aspect-[4/5] ${
                  i === 0 ? "row-span-2 md:row-span-1" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
                {/* Gradient overlay for readability (stronger on mobile) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/95 via-[#2e2e2e]/55 to-[#2e2e2e]/10 md:from-[#1a1a1a]/85 md:via-[#2e2e2e]/25 md:to-transparent" />

                {/* Top kicker */}
                <div className="absolute top-2.5 left-2.5 right-2.5 md:top-5 md:left-5 md:right-5 flex items-center justify-between">
                  <span className={`uppercase tracking-[0.22em] md:tracking-[0.25em] text-[#FFFFFF]/90 font-medium ${
                    i === 0 ? "text-[8px] md:text-[9px]" : "text-[7px] md:text-[9px]"
                  }`}>
                    {card.kicker}
                  </span>
                </div>

                {/* Bottom title + paragraph + CTA */}
                <div className={`absolute inset-x-0 bottom-0 md:p-7 ${i === 0 ? "p-3.5" : "p-2.5"}`}>
                  <h3
                    className={`font-light text-[#FFFFFF] leading-[1.1] md:text-3xl md:mb-3 ${
                      i === 0 ? "text-[17px] mb-1.5" : "text-[13px] mb-1"
                    }`}
                    style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.01em" }}
                  >
                    {card.title}
                  </h3>
                  {card.paragraph && (
                    <p className={`text-[#FFFFFF]/85 leading-[1.5] md:leading-[1.6] md:text-[12.5px] md:mb-5 ${
                      i === 0 ? "text-[10px] mb-2 line-clamp-3" : "text-[9px] mb-1.5 line-clamp-2"
                    }`}>
                      {card.paragraph}
                    </p>
                  )}
                  <div className={`inline-flex items-center gap-1.5 md:gap-2 uppercase tracking-[0.2em] md:tracking-[0.22em] text-[#FFFFFF] font-medium border-b border-[#FFFFFF]/60 pb-0.5 md:pb-1 group-hover:border-[#FFFFFF] transition-colors md:text-[10px] ${
                    i === 0 ? "text-[8px]" : "text-[7px]"
                  }`}>
                    {card.cta}
                    <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. BRAND MARQUEE — partner logos (slower scroll)
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-[rgba(46,46,46,0.08)] py-8 md:py-10 overflow-hidden bg-[#FFFFFF]">
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
                      className="object-contain opacity-85 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. PRODUCTS — merged tabbed section (Bestsellers / Sale / New)
      ═══════════════════════════════════════════════════════════ */}
      {bestsellerList.length > 0 && (
        <section className="py-20 md:py-28 bg-[#FFFFFF]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-10 md:mb-14 gap-8 flex-wrap">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-5">
                  Omiljeni proizvodi
                </span>
                <h2
                  className="text-4xl md:text-5xl lg:text-6xl font-light text-[#2e2e2e] leading-[1.05]"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
                >
                  Izabrani, <em className="italic">za vas</em>
                  <br />
                  i profesionalce.
                </h2>
              </div>
              <Link
                href={activeTabData.viewAll}
                className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#2e2e2e] hover:opacity-60 transition-opacity flex items-center gap-1.5 pb-1 border-b border-[#2e2e2e]"
              >
                Pogledaj sve <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center gap-8 md:gap-10 mb-10 md:mb-14 border-b border-[rgba(46,46,46,0.08)]">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative pb-4 text-[11px] md:text-[12px] uppercase tracking-[0.22em] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e2e2e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF] ${
                    activeTab === tab.key ? "text-[#2e2e2e]" : "text-[#2e2e2e]/40 hover:text-[#2e2e2e]/70"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-[#2e2e2e]" />
                  )}
                </button>
              ))}
            </div>

            {activeTabData.products.length > 0 ? (
              <ProductCarousel products={activeTabData.products} badge={activeTabData.badge} />
            ) : (
              <p className="text-[13px] text-[#2e2e2e]/60 py-10 text-center">
                Uskoro nove ponude u ovoj kategoriji.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          4. B2B PARTNERS — salons & wholesale partners (unchanged)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#837A64]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Left — image (landscape) */}
            <div className="relative aspect-[4/3] md:aspect-[5/4] bg-[#6e6754] overflow-hidden rounded-[4px]">
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
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#FFFFFF]/70 font-medium block mb-6">
                Za salone
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-[#FFFFFF] leading-[1.05] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                Partneri koji
                <br />
                <em className="italic">grade</em> struku.
              </h2>
              <p className="text-[14px] text-[#FFFFFF]/80 leading-[1.8] mb-5 max-w-lg">
                Alta Moda je već tri decenije sinonim za pouzdanu saradnju sa frizerskim salonima. Naši partneri dobijaju veleprodajne uslove, direktan pristup proizvodima svetskih brendova i tehničku podršku kada im zatreba.
              </p>
              <p className="text-[14px] text-[#FFFFFF]/80 leading-[1.8] mb-10 max-w-lg">
                Od porodičnih salona do vodećih lanaca — gradimo zajednički uspeh, korak po korak.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 justify-items-center sm:justify-items-start border-t border-[#FFFFFF]/25 pt-8 mb-10 max-w-lg">
                {[
                  { v: "Veleprodaja", l: "Salonske cene" },
                  { v: "48h", l: "Isporuka" },
                  { v: "1:1", l: "Podrška" },
                  { v: "0 din", l: "Članarina" },
                ].map((s, i) => (
                  <div key={i} className={`text-center sm:text-left ${i < 3 ? "sm:border-r sm:border-[#FFFFFF]/25" : ""} sm:pr-2`}>
                    <div className="text-xl md:text-2xl font-light text-[#FFFFFF]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {s.v}
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFFFF]/70 mt-1.5">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Link
                  href="/account/login"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#2e2e2e] bg-[#FFFFFF] px-8 py-4 rounded-full hover:bg-[#F5F0E6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#837A64]"
                >
                  Prijavi se za veleprodaju <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. VALUE CARDS — four-card feature strip (below B2B)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-transparent">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-7">
            {valueCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="group bg-[#FFFFFF] border border-[#837A64]/30 rounded-[4px] p-5 md:p-10 text-center transition-all duration-300 hover:border-[#837A64] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(131,122,100,0.12)]"
                >
                  <div className="w-9 h-9 md:w-12 md:h-12 mx-auto mb-3 md:mb-5 flex items-center justify-center text-[#837A64]">
                    <Icon strokeWidth={1.5} className="w-full h-full" />
                  </div>
                  <h3
                    className="text-[14px] md:text-[18px] font-semibold text-[#2e2e2e] mb-2 md:mb-3"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-[11px] md:text-[13px] text-[#2e2e2e]/65 leading-[1.55] md:leading-[1.7]">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. EDUCATION CENTER — text left, image right, #2e2e2e bg
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-[#2e2e2e] text-[#FFFFFF]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-12 md:gap-20 items-center">
            {/* Left — text */}
            <div className="order-2 md:order-1">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#FFFFFF]/60 font-medium block mb-6">
                Edukacija
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                Id Hair Academy.
                <br />
                Put ka <em className="italic">uspešnim</em>
                <br />
                profesionalcima.
              </h2>
              <p className="text-[14px] text-[#FFFFFF]/60 leading-[1.8] mb-5 max-w-lg">
                Kroz Id Hair Academy — partnerski edukativni centar Alta Mode — nudimo obuke, seminare i radionice koje otvaraju vrata svetu profesionalne nege kose.
              </p>
              <p className="text-[14px] text-[#FFFFFF]/60 leading-[1.8] mb-10 max-w-lg">
                Od osnovnih tehnika šišanja i bojenja do naprednih salonskih veština — mentorstvo vrhunskih stručnjaka sa decenijama iskustva.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 border-t border-[#FFFFFF]/15 pt-8 mb-10 max-w-md">
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#FFFFFF]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    6
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFFFF]/60 mt-1.5 leading-tight">
                    Meseci<br />programa
                  </div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#FFFFFF]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    2008
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFFFF]/60 mt-1.5 leading-tight">
                    Godina<br />osnivanja
                  </div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#FFFFFF]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    500<span className="text-xl">+</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFFFF]/60 mt-1.5 leading-tight">
                    Polaznika<br />godišnje
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Link
                  href="/education"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#2e2e2e] bg-[#FFFFFF] px-8 py-4 rounded-full hover:bg-[#D8CFBC] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2e2e2e]"
                >
                  Istraži edukaciju <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right — image */}
            <div className="order-1 md:order-2 relative aspect-[5/6] md:aspect-[4/5] bg-[#1a1a1a] overflow-hidden rounded-[4px]">
              <Image
                src="/edukacija2.jpg"
                alt="ID Hair Academy edukacija"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. SOCIAL — bento-style instagram grid
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#FFFFFF] border-t border-[rgba(46,46,46,0.08)]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between mb-12 md:mb-16 gap-8 flex-wrap">
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-5">
                Prati nas
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-[#2e2e2e] leading-[1.05]"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                <em className="italic">@altamoda</em> na mreži.
              </h2>
              <p className="text-[14px] text-[#2e2e2e]/60 leading-relaxed mt-5 max-w-md">
                Najnoviji trendovi, saveti frizera i najave edukacija — pridruži se zajednici koja živi profesionalnu negu kose.
              </p>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-11 h-11 rounded-full border border-[#D8CFBC] flex items-center justify-center text-[#2e2e2e] hover:bg-[#2e2e2e] hover:text-[#FFFFFF] hover:border-[#2e2e2e] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-11 h-11 rounded-full border border-[#D8CFBC] flex items-center justify-center text-[#2e2e2e] hover:bg-[#2e2e2e] hover:text-[#FFFFFF] hover:border-[#2e2e2e] transition-colors"
              >
                <Music2 className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-11 h-11 rounded-full border border-[#D8CFBC] flex items-center justify-center text-[#2e2e2e] hover:bg-[#2e2e2e] hover:text-[#FFFFFF] hover:border-[#2e2e2e] transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Bento grid — 4-col × 3-row packed layout (8 images, no gaps) */}
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] md:auto-rows-[240px] gap-2 md:gap-3">
            {[
              { img: socialImages[0], cls: "col-span-2 row-span-1" },            // A — wide top-left
              { img: socialImages[1], cls: "col-span-1 row-span-1" },            // B — square top-center
              { img: socialImages[2], cls: "col-span-1 row-span-2" },            // C — tall right
              { img: socialImages[3], cls: "col-span-1 row-span-1" },            // D — square middle-left
              { img: socialImages[4], cls: "col-span-2 row-span-1" },            // E — wide middle
              { img: socialImages[5], cls: "col-span-2 row-span-1" },            // F — wide bottom-left
              { img: socialImages[6], cls: "col-span-1 row-span-1" },            // G — square bottom-center
              { img: socialImages[7], cls: "col-span-1 row-span-1" },            // H — square bottom-right
            ].map((cell, i) => (
              <a
                key={i}
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cell.cls} relative overflow-hidden bg-[#F2ECDE] group rounded-[4px]`}
              >
                <Image
                  src={cell.img}
                  alt={`altamoda instagram ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-[#2e2e2e]/0 group-hover:bg-[#2e2e2e]/30 transition-colors flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-[#FFFFFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8. NEWSLETTER — dark editorial subscribe
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#2e2e2e] text-[#FFFFFF]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#FFFFFF]/60 font-medium block mb-5">
                Newsletter
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05]"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                Novi proizvodi, akcije &amp; <em className="italic">saveti</em>.
              </h2>
            </div>
            <div>
              <p className="text-[14px] text-[#FFFFFF]/60 leading-relaxed mb-6 max-w-md">
                Pretplati se i prvi saznaj o novim linijama, akcijama i edukacijama Id Hair Academy.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); handleNewsletterSubmit(newsletterEmail, setNewsletterStatus, setNewsletterMessage); }}
                className="flex items-center border-b border-[#FFFFFF]/25 pb-4"
              >
                <input
                  type="email"
                  placeholder="Vaša email adresa"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-transparent text-[#FFFFFF] placeholder-[#FFFFFF]/40 text-sm focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === "loading"}
                  className="text-[10px] uppercase tracking-[0.28em] font-medium text-[#FFFFFF] hover:opacity-70 transition-opacity disabled:opacity-40"
                >
                  {newsletterStatus === "loading" ? "..." : "Prijavi se"}
                </button>
              </form>
              {newsletterStatus !== "idle" && newsletterStatus !== "loading" && (
                <p className={`mt-4 text-sm ${newsletterStatus === "success" ? "text-[#D8CFBC]" : "text-red-400"}`}>
                  {newsletterMessage}
                </p>
              )}
              <p className="text-[11px] text-[#FFFFFF]/40 mt-5 leading-relaxed">
                Prijavom se slažete sa našom{" "}
                <Link href="/privacy" className="underline hover:text-[#FFFFFF]/80">politikom privatnosti</Link>.
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
          <div className="bg-[#FFFFFF] max-w-md w-full p-10 relative z-10 animate-scaleIn">
            <button onClick={() => setShowNewsletter(false)} className="absolute top-5 right-5">
              <X className="w-4 h-4 text-[#2e2e2e]/60 hover:text-[#2e2e2e]" />
            </button>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-4">
                Pridruži se
              </span>
              <h3 className="text-3xl font-light text-[#2e2e2e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {t("home.popupTitle")}
              </h3>
              <p className="text-[#2e2e2e]/60 text-sm mb-8 leading-relaxed">{t("home.popupDesc")}</p>
              {popupStatus === "success" ? (
                <p className="text-[#837A64] text-sm py-4">{popupMessage}</p>
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
                    className="w-full border-b border-[#D8CFBC] bg-transparent px-0 py-3 text-sm mb-5 focus:border-[#2e2e2e] focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={popupStatus === "loading"}
                    className="w-full bg-[#2e2e2e] hover:bg-[#1f1f1f] text-[#FFFFFF] py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors disabled:opacity-60"
                  >
                    {popupStatus === "loading" ? t("home.subscribing") : t("home.subscribe")}
                  </button>
                  {popupStatus === "error" && (
                    <p className="text-red-500 text-sm mt-3">{popupMessage}</p>
                  )}
                </form>
              )}
              <button onClick={() => setShowNewsletter(false)} className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 mt-5 hover:text-[#2e2e2e] block mx-auto">
                {t("home.noThanks")}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showNewsletter && (
        <button
          onClick={() => setShowNewsletter(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#2e2e2e] hover:bg-[#1f1f1f] text-[#FFFFFF] rounded-full flex items-center justify-center z-40 transition-all hover:scale-105 shadow-lg"
        >
          <Mail className="w-5 h-5" />
        </button>
      )}

      <ChatWidget />
      <CookieConsent />
    </div>
  );
}
