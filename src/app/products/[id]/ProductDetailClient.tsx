"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import {
  ShoppingBag, Heart, Star, ChevronRight, Minus, Plus, Truck,
  RotateCcw, Shield, Sparkles,
  Play, CheckCircle, X, Link2, AlertCircle,
} from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  type: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface Review {
  id: string;
  rating: number;
  createdAt: string;
  user: { name: string };
}

interface ColorProduct {
  colorLevel: number;
  undertoneCode: string;
  undertoneName: string;
  hexValue: string;
  shadeCode: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  brand: { name: string; slug: string } | null;
  price: number;
  oldPrice: number | null;
  image: string | null;
  isProfessional: boolean;
}

interface Product {
  id: string;
  sku: string;
  nameLat: string;
  slug: string;
  brand: { name: string; slug: string } | null;
  productLine: { name: string; slug: string } | null;
  category: { nameLat: string; slug: string; parent?: { nameLat: string; slug: string } | null } | null;
  description: string | null;
  purpose: string | null;
  benefits: string | null;
  ingredients: string | null;
  declaration: string | null;
  usageInstructions: string | null;
  warnings: string | null;
  shelfLife: string | null;
  importerInfo: string | null;
  priceB2c: number;
  priceB2b: number | null;
  oldPrice: number | null;
  price: number;
  stockQuantity: number;
  isProfessional: boolean;
  isNew: boolean;
  images: ProductImage[];
  colorProduct: ColorProduct | null;
  reviews: Review[];
  rating: number;
  reviewCount: number;
}

interface Props {
  product: Product;
  related: RelatedProduct[];
  colorSiblings?: ColorSibling[];
  userRole: string | null;
  initialLiked?: boolean;
  userExistingRating?: number | null;
}

interface ColorSibling {
  id: string;
  slug: string;
  name: string;
  colorCode: string | null;
  colorName: string | null;
  images: { url: string; altText: string | null }[];
  inStock: boolean;
  isActive: boolean;
}

const defaultImage = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=800&fit=crop";

export default function ProductDetailClient({ product, related, colorSiblings = [], userRole: _serverRole, initialLiked = false, userExistingRating = null }: Props) {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role || _serverRole;
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(userExistingRating !== null);
  const [currentUserRating, setCurrentUserRating] = useState(userExistingRating);
  const [reviews, setReviews] = useState<Review[]>(product.reviews);
  const [reviewCount, setReviewCount] = useState(product.reviewCount);
  const [avgRating, setAvgRating] = useState(product.rating);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [liked, setLiked] = useState(initialLiked);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [activeThumb, setActiveThumb] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [selectedSibling, setSelectedSibling] = useState<ColorSibling | null>(
    colorSiblings.find(s => s.isActive) || null
  );
  const [reviewError, setReviewError] = useState("");
  const [canReview, setCanReview] = useState(false);

  const { addItem } = useCartStore();
  const { increment: incWishlist, decrement: decWishlist } = useWishlistStore();

  // Fetch user-specific data client-side (wishlist + review eligibility)
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/wishlist')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data?.items)) {
          setLiked(data.data.items.some((w: { productId: string }) => w.productId === product.id));
        }
      })
      .catch(() => {});

    // Only users who ordered the product can leave a review. The server enforces this;
    // this fetch just drives the CTA visibility so unbuyers don't see a dead button.
    fetch(`/api/reviews/eligibility?productId=${product.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setCanReview(!!data.data?.canReview);
      })
      .catch(() => {});
  }, [session?.user?.id, product.id]);

  // Show sibling images when a color variant is selected, otherwise show product's own images
  const displayImages = selectedSibling && !selectedSibling.isActive && selectedSibling.images.length > 0
    ? selectedSibling.images.map(img => img.url)
    : product.images.length > 0
      ? product.images.map(img => img.url)
      : [defaultImage];
  const images = displayImages;

  // Strip color code from name for grouped products
  const activeColor = colorSiblings.find(s => s.isActive);
  const displayName = colorSiblings.length > 1 && activeColor?.colorCode
    ? product.nameLat.replace(activeColor.colorCode, '').replace(/\/+/g, ' ').replace(/\s{2,}/g, ' ').trim()
    : product.nameLat;

  const discountPct = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const hasText = (v: string | null | undefined) => !!(v && v.trim());

  const tabs = [
    { key: "opis", label: t("productDetail.description"), content: product.description },
    { key: "benefiti", label: t("productDetail.benefits"), content: product.benefits },
    { key: "sastojci", label: t("productDetail.ingredients"), content: product.ingredients },
    { key: "deklaracija", label: t("productDetail.declaration"), content: product.declaration },
    { key: "upotreba", label: t("productDetail.howToUse"), content: product.usageInstructions },
  ].filter(tab => hasText(tab.content));

  useEffect(() => {
    if (tabs.length === 0) {
      if (activeTab !== null) setActiveTab(null);
      return;
    }
    if (!activeTab || !tabs.some(t => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  // Helper to render HTML content safely
  const renderHtml = (html: string | null, fallback: string) => {
    if (!html) return <p className="text-[#2e2e2e]/60 italic">{fallback}</p>;
    return (
      <div
        className="text-[#2e2e2e]/60 leading-relaxed [&_p]:mb-3 [&_strong]:text-[#2e2e2e] [&_strong]:font-semibold [&_div]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const outOfStock = product.stockQuantity <= 0;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem({
      productId: product.id,
      name: product.nameLat,
      brand: product.brand?.name ?? "",
      price: product.price,
      quantity,
      image: images[0] ?? "",
      sku: product.sku,
      stockQuantity: product.stockQuantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleToggleWishlist = async () => {
    const previousState = liked;
    setLiked(!liked);
    setWishlistMessage("");
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) {
        setLiked(previousState);
        if (res.status === 401) {
          setWishlistMessage(t("productDetail.loginToWishlist"));
          setTimeout(() => setWishlistMessage(""), 4000);
        }
        return;
      }
      const data = await res.json();
      if (data.success) {
        setLiked(data.data.added);
        if (data.data.added) incWishlist();
        else decWishlist();
      }
    } catch (err) {
      console.error("Wishlist toggle failed:", err);
      setLiked(previousState);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${product.id}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          rating: r.rating as number,
          createdAt: r.createdAt as string,
          user: r.user as { name: string },
        })));
        setReviewCount(data.data.count as number);
        setAvgRating((data.data.avgRating ?? 0) as number);
      }
    } catch {
      // ignore
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, rating: reviewRating }),
      });
      if (res.status === 401) {
        setReviewError("Morate biti prijavljeni da biste ostavili recenziju.");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setReviewSuccess(true);
        setHasAlreadyReviewed(true);
        setCurrentUserRating(reviewRating);
        // Fetch updated reviews from API
        await fetchReviews();
        setTimeout(() => {
          setShowReviewForm(false);
          setReviewSuccess(false);
          setReviewRating(0);
        }, 1500);
      } else {
        setReviewError(data.error || "Greška pri slanju recenzije.");
      }
    } catch (err) {
      console.error("Review submission failed:", err);
      setReviewError("Greška pri slanju recenzije. Pokušajte ponovo.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <Header />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 md:pt-14 pb-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#2e2e2e]/60 mb-10">
          <Link href="/" className="hover:text-[#2e2e2e] transition-colors">{t("productDetail.home")}</Link><ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-[#2e2e2e] transition-colors">{t("productDetail.products")}</Link><ChevronRight className="w-3 h-3" />
          {product.category && (
            <>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-[#2e2e2e] transition-colors">{product.category.nameLat}</Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-[#2e2e2e]">{displayName}</span>
        </nav>

        {/* 2-Column layout */}
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16">
          {/* IMAGE GALLERY */}
          <div>
            <div className="aspect-square overflow-hidden mb-4 relative bg-[#F2ECDE] rounded-[4px]">
              <Image src={images[activeThumb]} alt={product.nameLat} width={900} height={900} className="w-full h-full object-cover" />
              {product.images[activeThumb]?.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#2e2e2e]/30">
                  <div className="w-16 h-16 rounded-full bg-[#FFFFFF]/90 flex items-center justify-center cursor-pointer hover:bg-[#FFFFFF] transition-colors">
                    <Play className="w-7 h-7 text-[#2e2e2e] ml-1" />
                  </div>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, t) => (
                  <button key={t} onClick={() => setActiveThumb(t)} className={`aspect-square overflow-hidden transition-all relative bg-[#F2ECDE] rounded-[4px] ${activeThumb === t ? "ring-1 ring-[#2e2e2e]" : "opacity-70 hover:opacity-100"}`}>
                    <Image src={img} alt={`View ${t + 1}`} width={120} height={120} className="w-full h-full object-cover" />
                    {product.images[t]?.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#2e2e2e]/40"><Play className="w-5 h-5 text-[#FFFFFF]" /></div>
                    )}
                    {product.images[t]?.type === 'gif' && (
                      <span className="absolute top-1 right-1 bg-[#2e2e2e] text-[#FFFFFF] text-[8px] font-medium px-1.5 py-0.5 uppercase tracking-wider">GIF</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div className="lg:pt-4">
            {product.brand && (
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-3">{product.brand.name}</span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#2e2e2e] leading-[1.05] tracking-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {displayName}
            </h1>

            {product.productLine && (
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60">{t("productDetail.productLine")}</span>
                <Link href={`/products?line=${product.productLine.slug}`} className="text-[11px] uppercase tracking-[0.22em] text-[#2e2e2e] hover:opacity-60 transition-opacity border-b border-[#2e2e2e] pb-0.5">{product.productLine.name}</Link>
              </div>
            )}

            {product.isProfessional && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2e2e2e] text-[#FFFFFF] text-[10px] uppercase tracking-[0.22em] font-medium mb-5">
                <AlertCircle className="w-3.5 h-3.5" /> {t("productDetail.professionalOnly")}
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? "fill-[#2e2e2e] text-[#2e2e2e]" : "fill-[#2e2e2e]/15 text-[#2e2e2e]/25"}`} />)}
              </div>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#2e2e2e]/60">{avgRating.toFixed(1)} · {reviewCount} {t("productDetail.reviews")}</span>
            </div>

            {/* Stock */}
            <div className="mb-6">
              {product.stockQuantity > 0 ? (
                <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#2e2e2e]/70 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> {t("productDetail.inStock")} · {product.stockQuantity} {t("productDetail.pcs")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#b5453a] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b5453a]" /> {t("productDetail.outOfStock")}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-6 pb-6 border-b border-[#D8CFBC]/60">
              {product.oldPrice && (
                <span className="text-[#2e2e2e]/50 line-through text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.oldPrice.toLocaleString("sr-RS")} RSD</span>
              )}
              <span className="text-4xl md:text-5xl font-light text-[#2e2e2e]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.price.toLocaleString("sr-RS")} <span className="text-xl">RSD</span></span>
              {discountPct > 0 && (
                <span className="bg-[#b5453a] text-[#FFFFFF] text-[10px] uppercase tracking-[0.22em] px-2 py-1 font-medium">-{discountPct}%</span>
              )}
            </div>

            {/* B2B Price hint (for guests and B2C) */}
            {role !== 'b2b' && product.isProfessional && (
              <div className="border border-[#2e2e2e] p-4 mb-6 bg-[#EFE7D5]/40">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#2e2e2e]" />
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-[#2e2e2e] font-medium">{t("productDetail.b2bPrice")}</span>
                    <p className="text-[11px] text-[#2e2e2e]/60 mt-0.5">{t("productDetail.b2bPriceHint")}</p>
                  </div>
                </div>
              </div>
            )}

            {/* B2B user sees both prices */}
            {role === 'b2b' && product.priceB2b && (
              <div className="border border-green-700 p-4 mb-6 bg-green-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-green-800 font-medium">{t("productDetail.yourB2bPrice")}</span>
                  <span className="text-xl font-light text-green-800" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.priceB2b.toLocaleString("sr-RS")} RSD</span>
                </div>
              </div>
            )}

            {/* Color Variants */}
            {colorSiblings.length > 1 && (
              <div className="mb-6">
                <h4 className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e] font-medium mb-3">
                  Boje · {colorSiblings.length} nijanse
                </h4>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {colorSiblings.map((sibling) => (
                    <Link
                      key={sibling.id}
                      href={`/products/${sibling.slug}`}
                      onMouseEnter={() => {
                        setSelectedSibling(sibling);
                        setActiveThumb(0);
                      }}
                      className={`px-3 py-2 text-[10px] uppercase tracking-[0.18em] font-medium border transition-all ${
                        sibling.isActive
                          ? "bg-[#2e2e2e] text-[#FFFFFF] border-[#2e2e2e]"
                          : sibling.inStock
                            ? "text-[#2e2e2e] border-[#D8CFBC] hover:border-[#2e2e2e]"
                            : "text-[#2e2e2e]/40 border-[#D8CFBC]"
                      }`}
                    >
                      {sibling.colorCode || sibling.name}
                      {!sibling.inStock && <span className="ml-1 text-[9px]">(nema)</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            {(() => {
              const professionalBlocked = product.isProfessional && role !== 'b2b' && role !== 'admin'
              const disabled = outOfStock || professionalBlocked
              return (
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center border border-[#D8CFBC]">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-12 flex items-center justify-center hover:bg-[#EFE7D5]/40 transition-colors"><Minus className="w-3.5 h-3.5 text-[#2e2e2e]" /></button>
                    <span className="w-10 text-center text-sm text-[#2e2e2e]">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-11 h-12 flex items-center justify-center hover:bg-[#EFE7D5]/40 transition-colors"><Plus className="w-3.5 h-3.5 text-[#2e2e2e]" /></button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={disabled}
                    className={`flex-1 py-[14px] text-[10px] uppercase tracking-[0.22em] font-medium transition-all flex items-center justify-center gap-2 ${disabled ? "bg-[#D8CFBC] text-[#2e2e2e]/60 cursor-not-allowed" : addedToCart ? "bg-[#6a624f] text-[#FFFFFF]" : "bg-[#837A64] hover:bg-[#6a624f] text-[#FFFFFF]"}`}
                  >
                    {professionalBlocked ? (
                      <>B2B - samo za salone</>
                    ) : outOfStock ? (
                      <>{t("products.outOfStock")}</>
                    ) : addedToCart ? (
                      <><CheckCircle className="w-4 h-4" /> {t("productDetail.addedToCart")}</>
                    ) : (
                      <><ShoppingBag className="w-4 h-4" /> {t("productDetail.addToCart")}</>
                    )}
                  </button>
                  <button onClick={handleToggleWishlist} className={`w-12 h-12 border flex items-center justify-center transition-colors ${liked ? "border-[#b5453a] bg-[#b5453a]/5" : "border-[#D8CFBC] hover:border-[#2e2e2e]"}`}>
                    <Heart className={`w-4 h-4 ${liked ? "fill-[#b5453a] text-[#b5453a]" : "text-[#2e2e2e]"}`} />
                  </button>
                </div>
              )
            })()}

            {/* Wishlist message */}
            {wishlistMessage && (
              <div className="mb-4 p-3 bg-[#EFE7D5]/40 border border-[#D8CFBC] text-sm text-[#2e2e2e] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {wishlistMessage}
                <Link href="/account/login" className="ml-auto text-[11px] uppercase tracking-[0.22em] font-medium hover:opacity-60 border-b border-[#2e2e2e] pb-0.5 whitespace-nowrap">{t("productDetail.loginLink")}</Link>
              </div>
            )}

            {/* Share */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium">{t("productDetail.share")}</span>
              <button onClick={handleCopyLink} className={`h-7 px-3 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-medium transition-colors ${linkCopied ? "text-green-700" : "text-[#2e2e2e]/60 hover:text-[#2e2e2e]"}`}>
                {linkCopied ? <><CheckCircle className="w-3 h-3" /> {t("productDetail.linkCopied")}</> : <><Link2 className="w-3 h-3" /> {t("productDetail.copyLink")}</>}
              </button>
            </div>

            {/* Delivery info */}
            <div className="border-t border-[#D8CFBC]/60 pt-6 space-y-4">
              <div className="flex items-start gap-3 text-[12px] text-[#2e2e2e]/80"><Truck className="w-4 h-4 text-[#2e2e2e] flex-shrink-0 mt-0.5" /><span><strong className="text-[#2e2e2e] font-medium">{t("productDetail.freeShipping")}</strong> — {t("productDetail.freeShippingNote")}</span></div>
              <div className="flex items-start gap-3 text-[12px] text-[#2e2e2e]/80"><RotateCcw className="w-4 h-4 text-[#2e2e2e] flex-shrink-0 mt-0.5" /><span><strong className="text-[#2e2e2e] font-medium">{t("productDetail.returnPolicy")}</strong> — {t("productDetail.returnPolicyNote")}</span></div>
              <div className="flex items-start gap-3 text-[12px] text-[#2e2e2e]/80"><Shield className="w-4 h-4 text-[#2e2e2e] flex-shrink-0 mt-0.5" /><span><strong className="text-[#2e2e2e] font-medium">{t("productDetail.originalProducts")}</strong> — {t("productDetail.originalProductsNote")}</span></div>
            </div>

            {/* Color Section */}
            {product.colorProduct && (
              <div className="mt-8 border border-[#D8CFBC] p-6 bg-[#EFE7D5]/30">
                <h3 className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e] font-medium mb-5">{t("productDetail.colorInfo")}</h3>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60">{t("productDetail.colorLevel")}</span>
                    <p className="text-xl font-light text-[#2e2e2e] mt-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.colorProduct.colorLevel}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60">{t("productDetail.colorUndertone")}</span>
                    <p className="text-xl font-light text-[#2e2e2e] mt-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.colorProduct.undertoneName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-[#D8CFBC]/60">
                  <div className="w-10 h-10 rounded-full border border-[#D8CFBC]" style={{ backgroundColor: product.colorProduct.hexValue }} />
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-[#2e2e2e] font-medium">{product.colorProduct.shadeCode}</span>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 mt-0.5">{product.colorProduct.undertoneName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        {tabs.length > 0 && (
          <div className="mt-20 md:mt-28">
            <div className="flex items-end border-b border-[#D8CFBC]/60 gap-8 md:gap-10 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-4 text-[10px] uppercase tracking-[0.28em] font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.key ? "text-[#2e2e2e]" : "text-[#2e2e2e]/60 hover:text-[#2e2e2e]"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#2e2e2e]" />}
                </button>
              ))}
            </div>
            <div className="py-10 md:py-14 max-w-4xl">
              {tabs.map((tab) => activeTab === tab.key && (
                <div key={tab.key} className="prose max-w-none text-[14px] text-[#2e2e2e]/80 leading-[1.8]">
                  {renderHtml(tab.content, "")}
                  {tab.key === "upotreba" && product.warnings && (
                    <div className="mt-8 pt-8 border-t border-[#D8CFBC]/60">
                      <h4 className="text-[10px] uppercase tracking-[0.28em] text-red-700 font-medium mb-3 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> {t("productDetail.warnings")}
                      </h4>
                      {renderHtml(product.warnings, "")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS SECTION */}
        <div className="mt-16 md:mt-24 pt-12 border-t border-[#D8CFBC]/60">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
            <div>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-4">
                Recenzije
              </span>
              <h2 className="text-3xl md:text-4xl font-light text-[#2e2e2e] leading-[1.05] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {t("productDetail.customerReviews")}
              </h2>
              <p className="text-[13px] text-[#2e2e2e]/60 leading-relaxed mt-3 max-w-md">
                {reviewCount === 0 ? t("productDetail.beFirstToReview") : t("productDetail.seeWhatOthersSay")}
              </p>
            </div>

            <div className="flex items-center justify-between md:justify-start gap-6 md:gap-8 w-full md:w-auto">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-light text-[#2e2e2e]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{avgRating.toFixed(1)}</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60">/ 5</span>
                </div>
                <div className="flex items-center gap-0.5 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? "fill-[#2e2e2e] text-[#2e2e2e]" : "fill-[#2e2e2e]/15 text-[#2e2e2e]/25"}`} />
                  ))}
                </div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 mt-2">{reviewCount} {t("productDetail.reviews")}</p>
              </div>

              {hasAlreadyReviewed ? (
                <div className="text-right md:text-left">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 block mb-1">{t("productDetail.yourRating")}</span>
                  <div className="flex items-center gap-0.5 justify-end md:justify-start">
                    {[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= currentUserRating! ? "fill-[#2e2e2e] text-[#2e2e2e]" : "fill-[#2e2e2e]/15 text-[#2e2e2e]/25"}`} />)}
                  </div>
                </div>
              ) : canReview ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-5 md:px-6 py-3 bg-[#2e2e2e] hover:bg-[#2b2c24] text-[#FFFFFF] text-[10px] uppercase tracking-[0.22em] font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Star className="w-3.5 h-3.5" /> {t("productDetail.rateProduct")}
                </button>
              ) : null}
            </div>
          </div>

          {/* Review list */}
          {reviews.length === 0 ? (
            <div className="text-center py-14 border-t border-[#D8CFBC]/60">
              <Star className="w-8 h-8 text-[#2e2e2e]/20 mx-auto mb-4" />
              <p className="text-[#2e2e2e]/60 text-[14px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("productDetail.noReviews")}</p>
              {!hasAlreadyReviewed && canReview && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="mt-6 px-6 py-3 bg-[#2e2e2e] hover:bg-[#2b2c24] text-[#FFFFFF] text-[10px] uppercase tracking-[0.22em] font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Star className="w-3.5 h-3.5" /> {t("productDetail.addFirstReview")}
                </button>
              )}
            </div>
          ) : (
            <div className="border-t border-[#D8CFBC]/60">
              {reviews.map((r) => (
                <div key={r.id} className="flex items-start gap-4 py-6 border-b border-[#D8CFBC]/60">
                  <div className="w-10 h-10 rounded-full bg-[#EFE7D5] flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#2e2e2e]">{r.user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#2e2e2e]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{r.user.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60">{new Date(r.createdAt).toLocaleDateString("sr-RS")}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-[#2e2e2e] text-[#2e2e2e]" : "fill-[#2e2e2e]/15 text-[#2e2e2e]/25"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="mt-20 md:mt-28 mb-16 pt-12 border-t border-[#D8CFBC]/60">
            <div className="flex items-end justify-between gap-4 mb-10 md:mb-14">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-4">
                  Takođe
                </span>
                <h2 className="text-3xl md:text-4xl font-light text-[#2e2e2e] leading-[1.05] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Srodni <em className="italic">rituali</em>.
                </h2>
              </div>
              <Link href="/products" className="text-[10px] uppercase tracking-[0.22em] font-medium text-[#2e2e2e] border-b border-[#2e2e2e] pb-0.5 hover:opacity-60 transition-opacity">Pogledaj sve</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
              {related.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden bg-[#F2ECDE] mb-4 rounded-[4px]">
                    <Image src={p.image || defaultImage} alt={p.name} width={500} height={625} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-out" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 font-medium block mb-1.5">{p.brand?.name}</span>
                    <h3 className="text-base text-[#2e2e2e] line-clamp-2 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-2 text-sm text-[#2e2e2e]">
                      {p.oldPrice && <span className="text-[#2e2e2e]/60 line-through text-xs">{p.oldPrice.toLocaleString("sr-RS")} RSD</span>}
                      <span>{p.price.toLocaleString("sr-RS")} RSD</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <>
          <div className="fixed inset-0 bg-[#2e2e2e]/50 z-50" onClick={() => setShowReviewForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] max-w-md w-full p-8 md:p-10 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowReviewForm(false)} className="absolute top-5 right-5"><X className="w-4 h-4 text-[#2e2e2e]/60 hover:text-[#2e2e2e]" /></button>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-3">Ocena</span>
              <h3 className="text-2xl font-light text-[#2e2e2e] leading-tight mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("productDetail.rateThisProduct")}</h3>
              <p className="text-[12px] text-[#2e2e2e]/60 mb-8">{product.nameLat}</p>

              {reviewSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <p className="text-[#2e2e2e]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("productDetail.reviewSuccess")}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.22em] font-medium text-[#2e2e2e] mb-3">{t("productDetail.tapToRate")}</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                          <Star className={`w-7 h-7 transition-colors ${star <= reviewRating ? "fill-[#2e2e2e] text-[#2e2e2e]" : "fill-[#2e2e2e]/15 text-[#2e2e2e]/25 hover:text-[#2e2e2e]"}`} />
                        </button>
                      ))}
                      {reviewRating > 0 && <span className="text-[11px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 ml-2">{reviewRating}/5</span>}
                    </div>
                  </div>
                  {reviewError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                      {reviewError}
                    </div>
                  )}
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewRating === 0 || reviewSubmitting}
                    className="w-full bg-[#2e2e2e] hover:bg-[#2b2c24] text-[#FFFFFF] py-3.5 text-[10px] uppercase tracking-[0.22em] font-medium transition-colors disabled:opacity-40"
                  >
                    {reviewSubmitting ? t("productDetail.submitting") : t("productDetail.submitReview")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
