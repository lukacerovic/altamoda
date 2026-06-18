"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Heart, Star, ArrowRight, Music2, ChevronLeft, ChevronRight,
  ShoppingBag, CheckCircle, Palette,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Mail, X, Instagram, Youtube,
} from "lucide-react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCartStore } from "@/lib/stores/cart-store";

/* ─── Types ─── */
export interface ColorSiblingData {
  id: string;
  slug: string;
  name: string;
  sku: string;
  brand: string;
  price: number;
  image: string | null;
  colorCode: string | null;
  colorName: string | null;
  hex: string | null;
  stockQuantity: number;
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number | null;
  oldPrice: number | null;
  rating: number;
  image: string | null;
  isNew: boolean;
  isFeatured: boolean;
  isProfessional: boolean;
  stockQuantity: number;
  sku: string;
  promoBadge?: string | null;
  groupSlug?: string | null;
  colorSiblings?: ColorSiblingData[];
}

const defaultImg = "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&h=800&fit=crop";

/* Brand marquee — partner logos displayed on the home page */
const brandLogos = [
  { name: "Redken", logo: "/brands/redken.webp", slug: "redken" },
  { name: "Matrix", logo: "/brands/matrix.png", slug: "matrix" },
  { name: "L'Oréal Professionnel", logo: "/brands/loreal.svg", slug: "loreal" },
  { name: "Kérastase", logo: "/brands/kerastase.png", slug: "kerastase" },
  { name: "Biolage", logo: "/brands/biolage.webp", slug: "biolage" },
  { name: "Olaplex", logo: "/brands/olaplex.svg", slug: "olaplex" },
  { name: "Framesi", logo: "/brands/framesi.webp", slug: "framesi" },
  { name: "Elchim", logo: "/brands/elchim.png", slug: "elchim" },
  { name: "L'image", logo: "/brands/limage.png", slug: "limage" },
  { name: "Mizutani", logo: "/brands/mizutani.png", slug: "mizutani" },
  { name: "Olivia Garden", logo: "/brands/olivia-garden.png", slug: "olivia-garden" },
  { name: "Redken Brews", logo: "/brands/redken-brews.png", slug: "redken-brews" },
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
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();
  const newLabel = t("home.new");
  const discountBadge = product.price != null && product.oldPrice ? `-${Math.round((1 - product.price / product.oldPrice) * 100)}%` : null;
  const displayBadge = product.promoBadge || badge || (product.isNew ? newLabel : discountBadge);
  const outOfStock = product.stockQuantity <= 0;
  const b2bOnly = product.price == null;
  const hasColors = (product.colorSiblings?.length ?? 0) > 1;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || b2bOnly || product.price == null) return;
    addItem({
      productId: product.id,
      name: product.name,
      brand: product.brand ?? "",
      price: product.price,
      quantity: 1,
      image: product.image ?? "",
      sku: product.sku,
      stockQuantity: product.stockQuantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col h-full">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-[#dddbd9] mb-5 transition-all duration-300 ease-out group-hover:-translate-y-0.5 [box-shadow:0_0_0_1px_rgba(26,28,30,0.02),0_2px_6px_rgba(26,28,30,0.04),0_4px_8px_rgba(26,28,30,0.1)] group-hover:[box-shadow:0_0_0_1px_rgba(26,28,30,0.04),0_4px_12px_rgba(26,28,30,0.08),0_16px_32px_rgba(26,28,30,0.14)]"
      >
        <Image
          src={product.image || defaultImg}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out"
        />
        {displayBadge && (
          <span className="absolute top-4 left-4 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] backdrop-blur-sm rounded-full bg-[rgba(26,28,30,0.5)] text-[#FFFFFF]">
            {displayBadge}
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFFFFF]/70 backdrop-blur-sm flex items-center justify-center hover:bg-[#FFFFFF] transition-colors opacity-0 group-hover:opacity-100"
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-[#1a1c1e] text-[#1a1c1e]" : "text-[#1a1c1e]"}`} />
        </button>
        {!b2bOnly && (
          <div className="hidden md:block absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={hasColors ? undefined : handleAddToCart}
              disabled={!hasColors && outOfStock}
              className={`w-full text-[10px] uppercase tracking-[0.22em] font-medium py-3 transition-colors flex items-center justify-center gap-2 ${
                !hasColors && outOfStock
                  ? "bg-[#dddbd9] text-[#1a1c1e]/60 cursor-not-allowed"
                  : addedToCart
                  ? "bg-[#413d3a] text-[#ffffff]"
                  : "bg-[#c19742] text-[#ffffff] hover:bg-[#413d3a]"
              }`}
            >
              {hasColors ? (
                <>
                  <Palette className="w-3.5 h-3.5" /> Izaberi boju
                </>
              ) : outOfStock ? (
                <>{t("products.outOfStock")}</>
              ) : addedToCart ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" /> {t("products.addedToCart")}
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" /> {t("products.addToCart")}
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e]/60 font-medium block mb-1.5">{product.brand}</span>
        <h3 className="text-base text-[#1a1c1e] mb-1 font-normal line-clamp-2 leading-tight min-h-[2.6em]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-[#1a1c1e]">
          {product.price == null ? (
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e] font-medium">B2B samo</span>
          ) : (
            <>
              {product.oldPrice && <span className="text-[#1a1c1e]/60 line-through text-xs">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>}
              <span>{product.price.toLocaleString("sr-RS")} RSD</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(product.rating) ? "fill-[#1a1c1e] text-[#1a1c1e]" : "fill-[#1a1c1e]/15 text-[#1a1c1e]/25"}`} />
          ))}
        </div>

        {/* Mobile-only persistent action area — pinned to bottom for cross-card alignment */}
        {!b2bOnly && (
          <div className="md:hidden mt-auto pt-3">
            <button
              onClick={hasColors ? undefined : handleAddToCart}
              disabled={!hasColors && outOfStock}
              className={`w-full text-[10px] uppercase tracking-[0.22em] font-medium py-2.5 transition-colors flex items-center justify-center gap-1.5 rounded-[2px] ${
                !hasColors && outOfStock
                  ? "bg-[#dddbd9] text-[#1a1c1e]/60 cursor-not-allowed"
                  : addedToCart
                  ? "bg-[#413d3a] text-[#ffffff]"
                  : "bg-[#c19742] text-[#ffffff] active:bg-[#413d3a]"
              }`}
            >
              {hasColors ? (
                <>
                  <Palette className="w-3 h-3" /> Izaberi boju
                </>
              ) : outOfStock ? (
                <>{t("products.outOfStock")}</>
              ) : addedToCart ? (
                <>
                  <CheckCircle className="w-3 h-3" /> {t("products.addedToCart")}
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3 h-3" /> {t("products.addToCart")}
                </>
              )}
            </button>
          </div>
        )}
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
        className="absolute -left-3 md:-left-5 top-[35%] w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FFFFFF] border border-[#dddbd9] flex items-center justify-center hover:border-[#1a1c1e] hover:scale-[1.08] active:scale-[0.92] transition-all duration-200 z-10 shadow-sm hover:[box-shadow:0_4px_12px_rgba(26,28,30,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1c1e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
      >
        <ChevronLeft className="w-4 h-4 text-[#1a1c1e]" />
      </button>
      <button
        onClick={goNext}
        aria-label="Next"
        className="absolute -right-3 md:-right-5 top-[35%] w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FFFFFF] border border-[#dddbd9] flex items-center justify-center hover:border-[#1a1c1e] hover:scale-[1.08] active:scale-[0.92] transition-all duration-200 z-10 shadow-sm hover:[box-shadow:0_4px_12px_rgba(26,28,30,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1c1e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
      >
        <ChevronRight className="w-4 h-4 text-[#1a1c1e]" />
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
  instagramImages?: string[];
}

/* ═══════════════════════════════════════════════════════════════════
   Main editorial home page — inspired by botanical-press aesthetic
═══════════════════════════════════════════════════════════════════ */
export default function HomePageClient({ featuredProducts, bestsellers, newArrivals, saleProducts, heroImages, heroCards, socialLinks, instagramImages }: Props) {
  // Admin-managed Instagram grid images; fall back per-slot to the editorial
  // defaults so the bento grid is never broken if a slot is left empty.
  const gridImages = Array.from({ length: 8 }, (_, i) => instagramImages?.[i] || socialImages[i]);
  const instagramUrl = socialLinks?.instagram || "https://www.instagram.com/altamoda_srbija";
  const tiktokUrl = socialLinks?.tiktok || "https://www.tiktok.com/@idhairacademy?lang=de-DE";
  const youtubeUrl = "https://www.youtube.com/@altamodabg";
  const { t } = useLanguage();

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [popupEmail, setPopupEmail] = useState("");
  const [popupStatus, setPopupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [popupMessage, setPopupMessage] = useState("");

  // Auto-open the newsletter popup on the user's first visit. Once shown,
  // we mark localStorage so it never auto-opens again on this device — the
  // floating Mail button remains the way to reopen it manually.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("altamoda-newsletter-seen")) return;
    const timer = setTimeout(() => {
      setShowNewsletter(true);
      localStorage.setItem("altamoda-newsletter-seen", "1");
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

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

  /* Tabbed products section — each tab is only shown if it has products. */
  type ProductTab = "bestsellers" | "new" | "sale";
  const allTabs: { key: ProductTab; label: string; products: ProductData[]; badge?: string | ((i: number) => string | undefined); viewAll: string }[] = [
    { key: "bestsellers", label: "Najprodavanije", products: bestsellerList, badge: (i: number) => (i === 2 ? "Novo" : "Bestseler"), viewAll: "/products" },
    { key: "sale", label: "Akcija", products: saleList, viewAll: "/products?onSale=true" },
    { key: "new", label: "Novo", products: newList, badge: "Novo", viewAll: "/products?sort=new" },
  ];
  const visibleTabs = allTabs.filter((t) => t.products.length > 0);
  const [activeTab, setActiveTab] = useState<ProductTab>("bestsellers");
  const activeTabData = visibleTabs.find((t) => t.key === activeTab) ?? visibleTabs[0];

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

  /* Hair concern cards — below B2B.
     Each href deep-links into /products with hairType/tag filters that match
     the imported product attributes. Uses ILIKE-based contains semantics on
     the API side, so substrings (e.g. "Frizz" with/without trailing space)
     resolve consistently. */
  function buildFilterHref(params: Record<string, string[]>): string {
    const sp = new URLSearchParams();
    for (const [key, values] of Object.entries(params)) {
      for (const v of values) sp.append(key, v);
    }
    return `/products?${sp.toString()}`;
  }

  const valueCards = [
    {
      icon: "/altamoda_svg_icons/suva_i_ostecena.svg",
      title: "Suva i oštećena",
      desc: "Kosa bez sjaja, sklona lomljenju i ispucalim krajevima.",
      href: buildFilterHref({ hairType: ["Suva kosa", "Oštećena kosa"], tag: ["hidratacija", "obnova"] }),
    },
    {
      icon: "/altamoda_svg_icons/tanka_kosa.svg",
      title: "Tanka bez volumena",
      desc: "Kosa koja brzo gubi oblik i nema punoću.",
      href: buildFilterHref({ hairType: ["Tanka kosa"], tag: ["volumen"] }),
    },
    {
      icon: "/altamoda_svg_icons/obojena_kosa.svg",
      title: "Obojena koja bledi",
      desc: "Boja gubi intenzitet i sjaj već nakon nekoliko pranja.",
      href: buildFilterHref({ hairType: ["Hemijski tretirana kosa"] }),
    },
    {
      icon: "/altamoda_svg_icons/frizzy_kosa.svg",
      title: "Frizz i neposlušna",
      desc: "Kosa koja reaguje na vlagu i teško se oblikuje.",
      href: buildFilterHref({ hairType: ["Frizz", "Neposlušna kosa"], tag: ["anti-frizz"] }),
    },
    {
      icon: "/altamoda_svg_icons/hemijski_ostecena.svg",
      title: "Hemijski tretirana",
      desc: "Slaba, lomljiva i bez elastičnosti.",
      href: buildFilterHref({
        hairType: ["Oštećena kosa", "Hemijski tretirana kosa", "Zaštita od toplote"],
        tag: ["zaštita od toplote", "obnova"],
      }),
    },
    {
      icon: "/altamoda_svg_icons/masna_kosa_skalp.svg",
      title: "Masna i osetljivo teme",
      desc: "Brzo mašćenje i disbalans vlasišta.",
      href: buildFilterHref({ hairType: ["Masna kosa", "Osetljivo teme"], tag: ["balans vlasišta"] }),
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
          {/* Top row — headline only */}
          <div className="pb-12 md:pb-16">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#1a1c1e]/60 font-medium block mb-6">
              Od 1999. godine
            </span>
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-light text-[#1a1c1e] leading-[1.02]"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}
            >
              Profesionalna nega,
              <br />
              <em className="italic">sa poverenjem</em>.
            </h1>
          </div>

          {/* Bottom row — three teaser cards (mobile: 1 big + 2 stacked; desktop: 3 equal) */}
          <div className="grid grid-cols-2 grid-rows-2 aspect-[6/8] gap-3 md:grid-cols-3 md:grid-rows-1 md:aspect-auto md:gap-6">
            {heroTeaserCards.map((card, i) => (
              <Link
                key={i}
                href={card.href}
                className={`group relative block overflow-hidden rounded-[4px] bg-[#dddbd9] md:aspect-[4/5] ${
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c1e]/95 via-[#1a1c1e]/55 to-[#1a1c1e]/10 md:from-[#1a1c1e]/85 md:via-[#1a1c1e]/25 md:to-transparent" />

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
      <section className="border-y border-[rgba(26,28,30,0.08)] py-8 md:py-10 overflow-hidden bg-[#FFFFFF]">
        <div className="relative flex">
          {[0, 1].map((setIndex) => (
            <div key={setIndex} className="flex animate-marquee flex-shrink-0">
              {brandLogos.map((brand) => (
                <Link
                  key={`${brand.name}-${setIndex}`}
                  href={`/brands/${brand.slug}`}
                  aria-label={brand.name}
                  className="flex-shrink-0 mx-8 md:mx-14 flex items-center group"
                >
                  <div className="relative h-10 md:h-12 w-32 md:w-44">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      sizes="176px"
                      className="object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. PRODUCTS — merged tabbed section (Bestsellers / Sale / New)
          Each tab is only rendered when its source has products; the whole
          section is hidden if all three are empty.
      ═══════════════════════════════════════════════════════════ */}
      {visibleTabs.length > 0 && activeTabData && (
        <section className="py-20 md:py-28 bg-[#FFFFFF]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-10 md:mb-14 gap-8 flex-wrap">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#1a1c1e]/60 font-medium block mb-5">
                  Odabrani proizvodi
                </span>
                <h2
                  className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1a1c1e] leading-[1.05]"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
                >
                  Za kućnu,
                  <br />
                  i <em className="italic">salonsku</em> upotrebu.
                </h2>
              </div>
              <Link
                href={activeTabData.viewAll}
                className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#1a1c1e] hover:opacity-60 transition-opacity flex items-center gap-1.5 pb-1 border-b border-[#1a1c1e]"
              >
                Pogledaj sve <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Tab switcher — only tabs with products */}
            {visibleTabs.length > 1 && (
              <div className="flex items-center gap-8 md:gap-10 mb-10 md:mb-14 border-b border-[rgba(26,28,30,0.08)]">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative pb-4 text-[11px] md:text-[12px] uppercase tracking-[0.22em] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1c1e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF] ${
                      activeTabData.key === tab.key ? "text-[#1a1c1e]" : "text-[#1a1c1e]/40 hover:text-[#1a1c1e]/70"
                    }`}
                  >
                    {tab.label}
                    {activeTabData.key === tab.key && (
                      <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-[#1a1c1e]" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <ProductCarousel products={activeTabData.products} badge={activeTabData.badge} />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          4. B2B PARTNERS — salons & wholesale partners (unchanged)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-[#dddbd9]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-stretch">
            {/* Left — image (portrait, matches right column height on desktop) */}
            <div className="relative aspect-[3/4] md:aspect-auto md:h-full bg-[#413d3a] overflow-hidden rounded-[4px]">
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
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#1a1c1e]/70 font-medium block mb-6">
                Za salone
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1a1c1e] leading-[1.05] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                Partnerstvo koje
                <br />
                gradi <em className="italic">uspeh</em>.
              </h2>
              <p className="text-[14px] text-[#1a1c1e]/80 leading-[1.8] mb-5 max-w-lg">
                Više od tri decenije gradimo mrežu partnera među frizerskim salonima, profesionalnim web shopovima i distributerima širom regiona.
              </p>
              <p className="text-[14px] text-[#1a1c1e]/80 leading-[1.8] mb-5 max-w-lg">
                Alta Moda povezuje brendove i profesionalce kroz pouzdanu distribuciju, veleprodajne uslove, kao i tehničku i edukativnu podršku.
              </p>
              <p className="text-[14px] text-[#1a1c1e]/80 leading-[1.8] mb-10 max-w-lg">
                Od lokalnih salona i online shopova do velikih distributivnih sistema — naš cilj je isti: dugoročna saradnja i zajednički rast.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 justify-items-center border-t border-[#1a1c1e]/25 pt-8 mb-10 max-w-lg">
                {[
                  { v: "30+", l: "Godina" },
                  { v: "1000+", l: "Partnera" },
                  { v: "Usluge", l: "Veleprodaja" },
                  { v: "1:1", l: "Podrška" },
                ].map((s, i) => (
                  <div key={i} className={`text-center ${i < 3 ? "sm:border-r sm:border-[#1a1c1e]/25" : ""} sm:px-2`}>
                    <div className="text-xl md:text-2xl font-light text-[#1a1c1e]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {s.v}
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.22em] text-[#1a1c1e]/70 mt-1.5">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Link
                  href="/account/login"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#ffffff] bg-[#c19742] px-8 py-4 rounded-full hover:bg-[#1a1c1e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c19742] focus-visible:ring-offset-2 focus-visible:ring-offset-[#dddbd9]"
                >
                  Postani naš partner <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. HAIR CONCERN CARDS — six-card solutions strip (below B2B)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-transparent">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          {/* Header — kicker / title / subtitle */}
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#1a1c1e]/60 font-medium block mb-5">
              Rešenja za vašu kosu
            </span>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-light text-[#1a1c1e] leading-[1.05] mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
            >
              Pronađite rutinu za <em className="italic">vidljive rezultate</em>.
            </h2>
            <p className="text-[13px] md:text-[15px] text-[#1a1c1e]/70 leading-[1.7] max-w-2xl mx-auto">
              Od svakodnevne nege do savršenog stilizovanja — izaberite proizvode koji odgovaraju vašem tipu kose i njenim potrebama, kao i željenom izgledu. Hidratacija, obnova, volumen i zaštita boje — sve na jednom mestu.
            </p>
          </div>

          {/* Six-card grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
            {valueCards.map((card, i) => {
              return (
                <Link
                  key={i}
                  href={card.href}
                  className="group flex flex-col items-center text-center bg-[#dddbd9] border border-[#dddbd9]/30 rounded-[4px] p-5 md:p-6 transition-all duration-300 hover:border-[#dddbd9] hover:-translate-y-0.5 shadow-[0_12px_28px_rgba(65,61,58,0.12)]"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                    <Image src={card.icon} alt={card.title} width={56} height={56} className="w-full h-full object-contain" />
                  </div>
                  <h3
                    className="text-[15px] md:text-[18px] font-semibold text-[#1a1c1e] mb-2 leading-[1.25]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-[12px] md:text-[13px] text-[#1a1c1e]/65 leading-[1.55] mb-4">
                    {card.desc}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-medium text-[#1a1c1e] border-b border-[#FFFFFF]/30 pb-0.5 group-hover:border-[#FFFFFF] group-hover:gap-2.5 transition-all">
                    Otkrij proizvode
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. EDUCATION CENTER — text left, image right, #1a1c1e bg
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-[#1a1c1e] text-[#FFFFFF]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-12 md:gap-20 items-center">
            {/* Left — text */}
            <div className="order-2 md:order-1">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#FFFFFF]/60 font-medium block mb-6">
                Edukativni centar
              </span>
              <Image
                src="/altamoda-logoes/ID HAIR ACADEMY WHITE.png"
                alt="ID Hair Academy"
                width={626}
                height={201}
                className="h-12 md:h-14 w-auto mb-6"
              />
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                Put ka <em className="italic">uspešnim</em> profesionalcima.
              </h2>
              <p className="text-[14px] text-[#FFFFFF]/60 leading-[1.8] mb-10 max-w-lg">
                Mesto gde se frizersko znanje pretvara u vrhunski profesionalni rezultat.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 border-t border-[#FFFFFF]/15 pt-8 mb-10 max-w-md">
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#FFFFFF]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    25<span className="text-xl">+</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFFFF]/60 mt-1.5 leading-tight">
                    Godina<br />iskustva
                  </div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#FFFFFF]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    350<span className="text-xl">+</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFFFF]/60 mt-1.5 leading-tight">
                    Stručnih seminara<br />i edukacija
                  </div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-light text-[#FFFFFF]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    1500<span className="text-xl">+</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-[#FFFFFF]/60 mt-1.5 leading-tight">
                    Edukovanih<br />frizera
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Link
                  href="/education"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#ffffff] bg-[#c19742] px-8 py-4 rounded-full hover:bg-[#ffffff] hover:text-[#1a1c1e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c19742] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1c1e]"
                >
                  Upoznaj akademiju <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right — image */}
            <div className="order-1 md:order-2 relative aspect-[5/6] md:aspect-[4/5] bg-[#1a1c1e] overflow-hidden rounded-[4px]">
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
      <section className="py-20 md:py-28 bg-[#FFFFFF] border-t border-[rgba(26,28,30,0.08)]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between mb-12 md:mb-16 gap-8 flex-wrap">
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#1a1c1e]/60 font-medium block mb-5">
                Prati nas
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1a1c1e] leading-[1.05]"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                <em className="italic">@altamoda_srbija</em> na mreži.
              </h2>
              <p className="text-[14px] text-[#1a1c1e]/60 leading-relaxed mt-5 max-w-md">
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
                className="w-11 h-11 rounded-full border border-[#dddbd9] flex items-center justify-center text-[#1a1c1e] hover:bg-[#1a1c1e] hover:text-[#FFFFFF] hover:border-[#1a1c1e] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-11 h-11 rounded-full border border-[#dddbd9] flex items-center justify-center text-[#1a1c1e] hover:bg-[#1a1c1e] hover:text-[#FFFFFF] hover:border-[#1a1c1e] transition-colors"
              >
                <Music2 className="w-4 h-4" />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-11 h-11 rounded-full border border-[#dddbd9] flex items-center justify-center text-[#1a1c1e] hover:bg-[#1a1c1e] hover:text-[#FFFFFF] hover:border-[#1a1c1e] transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Bento grid — 4-col × 3-row packed layout (8 images, no gaps) */}
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] md:auto-rows-[240px] gap-2 md:gap-3">
            {[
              { img: gridImages[0], cls: "col-span-2 row-span-1" },            // A — wide top-left
              { img: gridImages[1], cls: "col-span-1 row-span-1" },            // B — square top-center
              { img: gridImages[2], cls: "col-span-1 row-span-2" },            // C — tall right
              { img: gridImages[3], cls: "col-span-1 row-span-1" },            // D — square middle-left
              { img: gridImages[4], cls: "col-span-2 row-span-1" },            // E — wide middle
              { img: gridImages[5], cls: "col-span-2 row-span-1" },            // F — wide bottom-left
              { img: gridImages[6], cls: "col-span-1 row-span-1" },            // G — square bottom-center
              { img: gridImages[7], cls: "col-span-1 row-span-1" },            // H — square bottom-right
            ].map((cell, i) => (
              <a
                key={i}
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cell.cls} relative overflow-hidden bg-[#dddbd9] group rounded-[4px]`}
              >
                <Image
                  src={cell.img}
                  alt={`altamoda instagram ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-[#1a1c1e]/0 group-hover:bg-[#1a1c1e]/30 transition-colors flex items-center justify-center">
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
      <section className="py-20 md:py-28 bg-[#1a1c1e] text-[#FFFFFF]">
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
                Budi u toku sa novim proizvodima, edukacijama i ekskluzivnim ponudama iz sveta profesionalne frizerske industrije.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); handleNewsletterSubmit(newsletterEmail, setNewsletterStatus, setNewsletterMessage); }}
                className="flex items-center border-b border-[#FFFFFF]/25 pb-4"
              >
                <input
                  type="email"
                  placeholder="Email adresa"
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
                <p className={`mt-4 text-sm ${newsletterStatus === "success" ? "text-[#dddbd9]" : "text-red-400"}`}>
                  {newsletterMessage}
                </p>
              )}
              <p className="text-[11px] text-[#FFFFFF]/40 mt-5 leading-relaxed">
                Prijavom prihvatate{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="underline hover:text-[#FFFFFF]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] rounded"
                >
                  politiku privatnosti
                </button>.
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
              <X className="w-4 h-4 text-[#1a1c1e]/60 hover:text-[#1a1c1e]" />
            </button>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#1a1c1e]/60 font-medium block mb-4">
                Pridruži se
              </span>
              <h3 className="text-3xl font-light text-[#1a1c1e] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {t("home.popupTitle")}
              </h3>
              <p className="text-[#1a1c1e]/60 text-sm mb-8 leading-relaxed">{t("home.popupDesc")}</p>
              {popupStatus === "success" ? (
                <p className="text-[#1a1c1e] text-sm py-4">{popupMessage}</p>
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
                    className="w-full border-b border-[#dddbd9] bg-transparent px-0 py-3 text-sm mb-5 focus:border-[#1a1c1e] focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={popupStatus === "loading"}
                    className="w-full bg-[#c19742] hover:bg-[#413d3a] text-[#ffffff] py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors disabled:opacity-60"
                  >
                    {popupStatus === "loading" ? t("home.subscribing") : t("home.subscribe")}
                  </button>
                  {popupStatus === "error" && (
                    <p className="text-red-500 text-sm mt-3">{popupMessage}</p>
                  )}
                </form>
              )}
              <button onClick={() => setShowNewsletter(false)} className="text-[10px] uppercase tracking-[0.22em] text-[#1a1c1e]/60 mt-5 hover:text-[#1a1c1e] block mx-auto">
                {t("home.noThanks")}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showNewsletter && (
        <button
          onClick={() => setShowNewsletter(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#c19742] hover:bg-[#413d3a] text-[#ffffff] rounded-full flex items-center justify-center z-40 transition-all hover:scale-105 shadow-lg"
        >
          <Mail className="w-5 h-5" />
        </button>
      )}

      {/* PRIVACY POLICY MODAL — newsletter consent text */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPrivacyModal(false)} />
          <div className="bg-[#FFFFFF] max-w-xl w-full p-8 md:p-10 relative z-10 animate-scaleIn rounded-[4px] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPrivacyModal(false)}
              aria-label="Zatvori"
              className="absolute top-5 right-5 p-1"
            >
              <X className="w-4 h-4 text-[#1a1c1e]/60 hover:text-[#1a1c1e]" />
            </button>
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#1a1c1e]/60 font-medium block mb-4">
              Newsletter
            </span>
            <h3
              className="text-3xl md:text-4xl font-light text-[#1a1c1e] mb-6 leading-[1.1]"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
            >
              Politika privatnosti
            </h3>
            <div className="space-y-4 text-[14px] text-[#1a1c1e]/75 leading-[1.75]">
              <p>
                Prijavom na newsletter saglasni ste da Alta Moda doo koristi vašu email adresu za slanje informacija o novim proizvodima, edukacijama, akcijama i drugim sadržajima iz oblasti profesionalne frizerske industrije u okviru našeg poslovanja.
              </p>
              <p>
                Vaši podaci se koriste isključivo za slanje newsletter komunikacije i neće biti korišćeni u druge svrhe niti prosleđeni trećim licima.
              </p>
              <p>
                U svakom trenutku možete se odjaviti sa liste primalaca klikom na link za odjavu koji se nalazi u svakom emailu ili kontaktiranjem nas direktno.
              </p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="mt-8 w-full bg-[#c19742] hover:bg-[#413d3a] text-[#ffffff] py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors rounded-full"
            >
              Razumem
            </button>
          </div>
        </div>
      )}

      <CookieConsent />
    </div>
  );
}
