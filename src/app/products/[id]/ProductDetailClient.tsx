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
  Play, CheckCircle, X, Camera, Link2, AlertCircle,
} from "lucide-react";
import DOMPurify from "dompurify";
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
  ingredients: string | null;
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
  const [activeTab, setActiveTab] = useState("opis");
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

  const { addItem } = useCartStore();
  const { increment: incWishlist, decrement: decWishlist } = useWishlistStore();

  // Fetch user-specific data client-side (wishlist + existing review)
  useEffect(() => {
    if (!session?.user?.id) return;
    // Check wishlist status
    fetch('/api/wishlist')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data?.items)) {
          setLiked(data.data.items.some((w: { productId: string }) => w.productId === product.id));
        }
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

  const tabs = [
    { key: "opis", label: t("productDetail.description") },
    { key: "sastojci", label: t("productDetail.ingredients") },
    { key: "upotreba", label: t("productDetail.howToUse") },
    { key: "deklaracija", label: "Deklaracija" },
  ];

  // Helper to render HTML content safely
  const renderHtml = (html: string | null, fallback: string) => {
    if (!html) return <p className="text-[#a5a995] italic">{fallback}</p>;
    return (
      <div
        className="text-[#a5a995] leading-relaxed [&_p]:mb-3 [&_strong]:text-[#11120D] [&_strong]:font-semibold [&_div]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
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
    <div className="min-h-screen bg-[#FFFBF4]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#a5a995] mb-8">
          <Link href="/" className="hover:text-secondary">{t("productDetail.home")}</Link><ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-secondary">{t("productDetail.products")}</Link><ChevronRight className="w-3 h-3" />
          {product.category && (
            <>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-secondary">{product.category.nameLat}</Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-[#11120D]">{displayName}</span>
        </nav>

        {/* 2-Column layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* IMAGE GALLERY */}
          <div>
            <div className="aspect-square rounded-sm overflow-hidden mb-4 relative bg-white">
              <Image src={images[activeThumb]} alt={product.nameLat} width={600} height={600} className="w-full h-full object-cover" />
              {product.images[activeThumb]?.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <Play className="w-7 h-7 text-[#11120D] ml-1" />
                  </div>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, t) => (
                  <button key={t} onClick={() => setActiveThumb(t)} className={`aspect-square rounded overflow-hidden border-2 transition-colors relative ${activeThumb === t ? "border-black" : "border-transparent hover:border-[#D8CFBC]"}`}>
                    <Image src={img} alt={`View ${t + 1}`} width={80} height={80} className="w-full h-full object-cover" />
                    {product.images[t]?.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Play className="w-5 h-5 text-white" /></div>
                    )}
                    {product.images[t]?.type === 'gif' && (
                      <span className="absolute top-1 right-1 bg-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded">GIF</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div>
            {product.brand && <span className="text-sm text-secondary font-medium uppercase tracking-wider">{product.brand.name}</span>}
            {product.productLine && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#a5a995]">{t("productDetail.productLine")}</span>
                <Link href={`/products?line=${product.productLine.slug}`} className="text-xs text-secondary hover:text-[#11120D] font-medium underline">{product.productLine.name}</Link>
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-[#11120D] mt-2 mb-3" style={{ fontFamily: "'Noto Serif', serif" }}>{displayName}</h1>

            {product.isProfessional && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-medium rounded mb-4">
                <AlertCircle className="w-3.5 h-3.5" /> {t("productDetail.professionalOnly")}
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-[#7A7F6A] text-secondary" : "text-[#D8CFBC]"}`} />)}
              </div>
              <span className="text-sm text-[#a5a995]">{avgRating.toFixed(1)} ({reviewCount} {t("productDetail.reviews")})</span>
            </div>

            {/* Stock */}
            <div className="mb-4">
              {product.stockQuantity > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> {t("productDetail.inStock")} ({product.stockQuantity} {t("productDetail.pcs")})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-600 font-medium">
                  <X className="w-4 h-4" /> {t("productDetail.outOfStock")}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              {product.oldPrice && (
                <span className="text-[#a5a995] line-through text-lg">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>
              )}
              <span className="text-3xl font-bold text-[#11120D]">{product.price.toLocaleString("sr-RS")} RSD</span>
              {discountPct > 0 && (
                <span className="bg-[#b5453a] text-white text-xs px-2 py-1 rounded font-semibold">-{discountPct}%</span>
              )}
            </div>

            {/* B2B Price hint (for guests and B2C) */}
            {role !== 'b2b' && product.isProfessional && (
              <div className="border-2 border-black rounded-sm p-4 mb-6 bg-[#FFFBF4]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  <div>
                    <span className="text-sm font-semibold text-secondary">{t("productDetail.b2bPrice")}</span>
                    <p className="text-xs text-[#a5a995]">{t("productDetail.b2bPriceHint")}</p>
                  </div>
                </div>
              </div>
            )}

            {/* B2B user sees both prices */}
            {role === 'b2b' && product.priceB2b && (
              <div className="border-2 border-green-300 rounded-sm p-4 mb-6 bg-green-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-700">{t("productDetail.yourB2bPrice")}</span>
                  <span className="text-lg font-bold text-green-700">{product.priceB2b.toLocaleString("sr-RS")} RSD</span>
                </div>
              </div>
            )}

            {/* Color Variants */}
            {colorSiblings.length > 1 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[#11120D] mb-3">
                  Boje ({colorSiblings.length} nijanse)
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
                      className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-all ${
                        sibling.isActive
                          ? "bg-black text-white border-black"
                          : sibling.inStock
                            ? "bg-white text-[#11120D] border-[#D8CFBC] hover:border-black"
                            : "bg-[#FFFBF4] text-[#a5a995] border-[#D8CFBC] hover:border-[#D8CFBC]"
                      }`}
                    >
                      {sibling.colorCode || sibling.name}
                      {!sibling.inStock && <span className="ml-1 text-[10px]">(nema)</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-[#D8CFBC] rounded">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-[#FFFBF4] transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-[#FFFBF4] transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={`flex-1 py-3 rounded font-medium transition-all flex items-center justify-center gap-2 ${outOfStock ? "bg-[#a5a995] text-white cursor-not-allowed" : "bg-black hover:bg-[#11120D] text-white"}`}
              >
                {outOfStock ? (
                  <>{t("products.outOfStock")}</>
                ) : addedToCart ? (
                  <><CheckCircle className="w-5 h-5" /> {t("productDetail.addedToCart")}</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" /> {t("productDetail.addToCart")}</>
                )}
              </button>
              <button onClick={handleToggleWishlist} className={`w-12 h-12 border rounded flex items-center justify-center transition-colors ${liked ? "border-[#b5453a] bg-red-50" : "border-[#D8CFBC] hover:border-black"}`}>
                <Heart className={`w-5 h-5 ${liked ? "fill-[#b5453a] text-[#b5453a]" : "text-[#a5a995]"}`} />
              </button>
            </div>

            {/* Wishlist message */}
            {wishlistMessage && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-sm text-sm text-orange-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {wishlistMessage}
                <Link href="/account/login" className="ml-auto text-secondary font-medium hover:underline whitespace-nowrap">{t("productDetail.loginLink")}</Link>
              </div>
            )}

            {/* Share */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs text-[#a5a995]">{t("productDetail.share")}</span>
              <button onClick={handleCopyLink} className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all ${linkCopied ? "bg-green-100 text-green-700" : "bg-[#FFFBF4] text-[#a5a995] hover:bg-[#D8CFBC]"}`}>
                {linkCopied ? <><CheckCircle className="w-3.5 h-3.5" /> {t("productDetail.linkCopied")}</> : <><Link2 className="w-3.5 h-3.5" /> {t("productDetail.copyLink")}</>}
              </button>
            </div>

            {/* Delivery info */}
            <div className="bg-[#FFFBF4] rounded-sm p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm"><Truck className="w-5 h-5 text-secondary" /><span><strong>{t("productDetail.freeShipping")}</strong> {t("productDetail.freeShippingNote")}</span></div>
              <div className="flex items-center gap-3 text-sm"><RotateCcw className="w-5 h-5 text-secondary" /><span><strong>{t("productDetail.returnPolicy")}</strong> {t("productDetail.returnPolicyNote")}</span></div>
              <div className="flex items-center gap-3 text-sm"><Shield className="w-5 h-5 text-secondary" /><span><strong>{t("productDetail.originalProducts")}</strong> {t("productDetail.originalProductsNote")}</span></div>
            </div>

            {/* Color Section */}
            {product.colorProduct && (
              <div className="mt-6 bg-white border border-[#D8CFBC] rounded-sm p-5">
                <h3 className="text-sm font-semibold text-[#11120D] mb-3">{t("productDetail.colorInfo")}</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#FFFBF4] rounded p-3">
                    <span className="text-xs text-[#a5a995]">{t("productDetail.colorLevel")}</span>
                    <p className="text-sm font-semibold text-[#11120D]">{product.colorProduct.colorLevel}</p>
                  </div>
                  <div className="bg-[#FFFBF4] rounded p-3">
                    <span className="text-xs text-[#a5a995]">{t("productDetail.colorUndertone")}</span>
                    <p className="text-sm font-semibold text-[#11120D]">{product.colorProduct.undertoneName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow" style={{ backgroundColor: product.colorProduct.hexValue }} />
                  <div>
                    <span className="text-sm font-medium text-[#11120D]">{product.colorProduct.shadeCode}</span>
                    <p className="text-xs text-[#a5a995]">{product.colorProduct.undertoneName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="mt-16">
          <div className="flex border-b border-[#D8CFBC] gap-0">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.key ? "text-secondary border-b-2 border-black" : "text-[#a5a995] hover:text-[#11120D]"}`}>{tab.label}</button>
            ))}
          </div>
          <div className="py-8">
            {activeTab === "opis" && <div className="prose max-w-none">
              {renderHtml(product.description, t("productDetail.noDescription"))}
              {product.purpose && (
                <div className="mt-4 pt-4 border-t border-[#D8CFBC]">
                  <h4 className="text-sm font-semibold text-[#11120D] mb-2">Namena</h4>
                  {renderHtml(product.purpose, "")}
                </div>
              )}
            </div>}
            {activeTab === "sastojci" && <div className="prose max-w-none">{renderHtml(product.ingredients, t("productDetail.noIngredients"))}</div>}
            {activeTab === "upotreba" && <div className="prose max-w-none">
              {renderHtml(product.usageInstructions, t("productDetail.noUsageInstructions"))}
              {product.warnings && (
                <div className="mt-4 pt-4 border-t border-[#D8CFBC]">
                  <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Upozorenja</h4>
                  {renderHtml(product.warnings, "")}
                </div>
              )}
            </div>}
            {activeTab === "deklaracija" && <div className="prose max-w-none space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-[#FFFBF4] rounded-sm p-4">
                  <h4 className="font-semibold text-[#11120D] mb-1">Naziv proizvoda</h4>
                  <p className="text-[#a5a995]">{product.nameLat}</p>
                </div>
                {product.brand && (
                  <div className="bg-[#FFFBF4] rounded-sm p-4">
                    <h4 className="font-semibold text-[#11120D] mb-1">Proizvođač / Brend</h4>
                    <p className="text-[#a5a995]">{product.brand.name}</p>
                  </div>
                )}
                {product.shelfLife && (
                  <div className="bg-[#FFFBF4] rounded-sm p-4">
                    <h4 className="font-semibold text-[#11120D] mb-1">Rok trajanja / PAO</h4>
                    <p className="text-[#a5a995]">{product.shelfLife}</p>
                  </div>
                )}
                {product.importerInfo && (
                  <div className="bg-[#FFFBF4] rounded-sm p-4">
                    <h4 className="font-semibold text-[#11120D] mb-1">Uvoznik / Odgovorno lice</h4>
                    {renderHtml(product.importerInfo, "")}
                  </div>
                )}
              </div>
            </div>}
          </div>
        </div>

        {/* REVIEWS SECTION — always visible */}
        <div className="mt-8 mb-8">
          <div className="bg-white rounded-sm border border-[#D8CFBC] overflow-hidden">
            {/* Review header with rating summary */}
            <div className="p-6 sm:p-8 border-b border-[#D8CFBC] bg-[#FFFBF4]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-[#11120D] leading-none">{avgRating.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.round(avgRating) ? "fill-[#7A7F6A] text-secondary" : "text-[#D8CFBC]"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-[#a5a995] mt-1">{reviewCount} {t("productDetail.reviews")}</p>
                  </div>
                  <div className="hidden sm:block w-px h-16 bg-[#D8CFBC]" />
                  <div>
                    <h2 className="text-lg font-bold text-[#11120D]" style={{ fontFamily: "'Noto Serif', serif" }}>{t("productDetail.customerReviews")}</h2>
                    <p className="text-sm text-[#a5a995] mt-0.5">
                      {reviewCount === 0 ? t("productDetail.beFirstToReview") : t("productDetail.seeWhatOthersSay")}
                    </p>
                  </div>
                </div>
                {hasAlreadyReviewed ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white text-sm text-[#11120D] rounded-sm border border-[#D8CFBC]">
                    <span className="text-[#a5a995]">{t("productDetail.yourRating")}</span>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= currentUserRating! ? "fill-[#7A7F6A] text-secondary" : "text-[#D8CFBC]"}`} />)}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-6 py-3 bg-black hover:bg-[#11120D] text-white text-sm font-medium rounded-sm transition-colors flex items-center gap-2 self-start"
                  >
                    <Star className="w-4 h-4" /> {t("productDetail.rateProduct")}
                  </button>
                )}
              </div>
            </div>

            {/* Review list */}
            <div className="p-6 sm:p-8">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-10 h-10 text-[#D8CFBC] mx-auto mb-3" />
                  <p className="text-[#a5a995] text-sm">{t("productDetail.noReviews")}</p>
                  {!hasAlreadyReviewed && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="mt-4 px-5 py-2.5 bg-black hover:bg-[#11120D] text-white text-sm font-medium rounded-sm transition-colors inline-flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" /> {t("productDetail.addFirstReview")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="flex items-start gap-4 p-4 rounded-sm bg-[#FFFBF4]">
                      <div className="w-10 h-10 rounded-full bg-[#D8CFBC] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#a5a995]">{r.user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-[#11120D]">{r.user.name}</span>
                          <span className="text-xs text-[#a5a995]">{new Date(r.createdAt).toLocaleDateString("sr-RS")}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-[#7A7F6A] text-secondary" : "text-[#D8CFBC]"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="mt-12 mb-16">
            <h2 className="text-2xl font-bold text-[#11120D] mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("productDetail.relatedProducts")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="bg-white rounded-sm shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className="aspect-square overflow-hidden bg-[#FFFBF4]">
                    <Image src={p.image || defaultImage} alt={p.name} width={400} height={400} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-secondary font-medium uppercase tracking-wider">{p.brand?.name}</span>
                    <h3 className="text-sm font-medium text-[#11120D] mt-1 line-clamp-2">{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      {p.oldPrice && <span className="text-xs text-[#a5a995] line-through">{p.oldPrice.toLocaleString("sr-RS")} RSD</span>}
                      <span className="text-base font-bold text-[#11120D]">{p.price.toLocaleString("sr-RS")} RSD</span>
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
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowReviewForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowReviewForm(false)} className="absolute top-4 right-4"><X className="w-5 h-5 text-[#a5a995] hover:text-[#a5a995]" /></button>
              <h3 className="text-xl font-bold text-[#11120D] mb-1" style={{ fontFamily: "'Noto Serif', serif" }}>{t("productDetail.rateThisProduct")}</h3>
              <p className="text-sm text-[#a5a995] mb-6">{product.nameLat}</p>

              {reviewSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-[#11120D]">{t("productDetail.reviewSuccess")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#11120D] mb-2">{t("productDetail.tapToRate")}</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                          <Star className={`w-7 h-7 transition-colors ${star <= reviewRating ? "fill-[#7A7F6A] text-secondary" : "text-[#D8CFBC] hover:text-secondary"}`} />
                        </button>
                      ))}
                      {reviewRating > 0 && <span className="text-sm text-[#a5a995] ml-2">{reviewRating}/5</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#11120D] mb-1">{t("productDetail.photoOptional")}</label>
                    <div className="border-2 border-dashed border-[#D8CFBC] rounded-sm p-6 text-center hover:border-black transition-colors cursor-pointer">
                      <Camera className="w-8 h-8 text-[#D8CFBC] mx-auto mb-2" />
                      <p className="text-sm text-[#a5a995]">{t("productDetail.clickToAddPhoto")}</p>
                    </div>
                  </div>
                  {reviewError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
                      {reviewError}
                    </div>
                  )}
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewRating === 0 || reviewSubmitting}
                    className="w-full bg-black hover:bg-[#11120D] text-white py-3 rounded font-medium transition-colors disabled:opacity-50"
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
