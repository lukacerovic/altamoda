"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, Heart, Star, ChevronRight, Minus, Plus, Truck,
  RotateCcw, Shield, Sparkles,
  Play, CheckCircle, X, Camera, Link2, AlertCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  ingredients: string | null;
  usageInstructions: string | null;
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
  userRole: string | null;
}

const defaultImage = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=800&fit=crop";

export default function ProductDetailClient({ product, related, userRole }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("opis");
  const [liked, setLiked] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  const images = product.images.length > 0
    ? product.images.map(img => img.url)
    : [defaultImage];

  const discountPct = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const tabs = [
    { key: "opis", label: "Opis" },
    { key: "sastojci", label: "Sastojci" },
    { key: "upotreba", label: "Način upotrebe" },
    { key: "recenzije", label: `Recenzije (${product.reviewCount})` },
  ];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-[#8c4a5a]">Početna</Link><ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-[#8c4a5a]">Proizvodi</Link><ChevronRight className="w-3 h-3" />
          {product.category && (
            <>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-[#8c4a5a]">{product.category.nameLat}</Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-[#2d2d2d]">{product.nameLat}</span>
        </nav>

        {/* 2-Column layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* IMAGE GALLERY */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden mb-4 relative bg-white">
              <img src={images[activeThumb]} alt={product.nameLat} className="w-full h-full object-cover" />
              {product.images[activeThumb]?.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <Play className="w-7 h-7 text-[#2d2d2d] ml-1" />
                  </div>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, t) => (
                  <button key={t} onClick={() => setActiveThumb(t)} className={`aspect-square rounded overflow-hidden border-2 transition-colors relative ${activeThumb === t ? "border-[#8c4a5a]" : "border-transparent hover:border-gray-200"}`}>
                    <img src={img} alt={`View ${t + 1}`} className="w-full h-full object-cover" />
                    {product.images[t]?.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Play className="w-5 h-5 text-white" /></div>
                    )}
                    {product.images[t]?.type === 'gif' && (
                      <span className="absolute top-1 right-1 bg-[#8c4a5a] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">GIF</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div>
            {product.brand && <span className="text-sm text-[#8c4a5a] font-medium uppercase tracking-wider">{product.brand.name}</span>}
            {product.productLine && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Linija proizvoda:</span>
                <Link href={`/products?line=${product.productLine.slug}`} className="text-xs text-[#8c4a5a] hover:text-[#6e3848] font-medium underline">{product.productLine.name}</Link>
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-[#2d2d2d] mt-2 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{product.nameLat}</h1>

            {product.isProfessional && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2d2d] text-white text-xs font-medium rounded mb-4">
                <AlertCircle className="w-3.5 h-3.5" /> Samo za profesionalnu upotrebu
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-gray-200"}`} />)}
              </div>
              <span className="text-sm text-gray-500">{product.rating.toFixed(1)} ({product.reviewCount} recenzija)</span>
            </div>

            {/* Stock */}
            <div className="mb-4">
              {product.stockQuantity > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> Na stanju ({product.stockQuantity} kom)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-600 font-medium">
                  <X className="w-4 h-4" /> Nema na stanju
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              {product.oldPrice && (
                <span className="text-gray-400 line-through text-lg">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>
              )}
              <span className="text-3xl font-bold text-[#2d2d2d]">{product.price.toLocaleString("sr-RS")} RSD</span>
              {discountPct > 0 && (
                <span className="bg-[#c0392b] text-white text-xs px-2 py-1 rounded font-semibold">-{discountPct}%</span>
              )}
            </div>

            {/* B2B Price hint (for guests and B2C) */}
            {userRole !== 'b2b' && product.isProfessional && (
              <div className="border-2 border-[#8c4a5a] rounded-lg p-4 mb-6 bg-[#faf7f2]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#8c4a5a]" />
                  <div>
                    <span className="text-sm font-semibold text-[#8c4a5a]">B2B Cena</span>
                    <p className="text-xs text-gray-500">Prijavite se za posebne cene za profesionalce i salone</p>
                  </div>
                </div>
              </div>
            )}

            {/* B2B user sees both prices */}
            {userRole === 'b2b' && product.priceB2b && (
              <div className="border-2 border-green-300 rounded-lg p-4 mb-6 bg-green-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-700">Vaša B2B cena</span>
                  <span className="text-lg font-bold text-green-700">{product.priceB2b.toLocaleString("sr-RS")} RSD</span>
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-gray-200 rounded">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <button disabled={product.stockQuantity === 0} className="flex-1 bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <ShoppingBag className="w-5 h-5" /> Dodaj u Korpu
              </button>
              <button onClick={() => setLiked(!liked)} className={`w-12 h-12 border rounded flex items-center justify-center transition-colors ${liked ? "border-[#c0392b] bg-red-50" : "border-gray-200 hover:border-[#8c4a5a]"}`}>
                <Heart className={`w-5 h-5 ${liked ? "fill-[#c0392b] text-[#c0392b]" : "text-gray-400"}`} />
              </button>
            </div>

            {/* Share */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs text-gray-500">Podeli:</span>
              <button onClick={handleCopyLink} className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all ${linkCopied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {linkCopied ? <><CheckCircle className="w-3.5 h-3.5" /> Kopirano!</> : <><Link2 className="w-3.5 h-3.5" /> Kopiraj link</>}
              </button>
            </div>

            {/* Delivery info */}
            <div className="bg-[#faf7f2] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm"><Truck className="w-5 h-5 text-[#8c4a5a]" /><span><strong>Besplatna dostava</strong> za porudžbine preko 5.000 RSD</span></div>
              <div className="flex items-center gap-3 text-sm"><RotateCcw className="w-5 h-5 text-[#8c4a5a]" /><span><strong>Povrat u roku od 14 dana</strong> bez pitanja</span></div>
              <div className="flex items-center gap-3 text-sm"><Shield className="w-5 h-5 text-[#8c4a5a]" /><span><strong>Originalni proizvodi</strong> sa garancijom autentičnosti</span></div>
            </div>

            {/* Color Section */}
            {product.colorProduct && (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[#2d2d2d] mb-3">Informacije o boji</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded p-3">
                    <span className="text-xs text-gray-500">Nivo (Level)</span>
                    <p className="text-sm font-semibold text-[#2d2d2d]">{product.colorProduct.colorLevel}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <span className="text-xs text-gray-500">Podton (Undertone)</span>
                    <p className="text-sm font-semibold text-[#2d2d2d]">{product.colorProduct.undertoneName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow" style={{ backgroundColor: product.colorProduct.hexValue }} />
                  <div>
                    <span className="text-sm font-medium text-[#2d2d2d]">{product.colorProduct.shadeCode}</span>
                    <p className="text-xs text-gray-500">{product.colorProduct.undertoneName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="mt-16">
          <div className="flex border-b border-gray-200 gap-0">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.key ? "text-[#8c4a5a] border-b-2 border-[#8c4a5a]" : "text-gray-500 hover:text-[#2d2d2d]"}`}>{tab.label}</button>
            ))}
          </div>
          <div className="py-8">
            {activeTab === "opis" && <div className="prose max-w-none"><p className="text-gray-600 leading-relaxed">{product.description || "Nema opisa."}</p></div>}
            {activeTab === "sastojci" && <div className="prose max-w-none"><p className="text-gray-600 leading-relaxed">{product.ingredients || "Sastojci nisu navedeni."}</p></div>}
            {activeTab === "upotreba" && <div className="prose max-w-none"><p className="text-gray-600 leading-relaxed">{product.usageInstructions || "Uputstvo za upotrebu nije navedeno."}</p></div>}
            {activeTab === "recenzije" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-lg font-bold text-[#2d2d2d]">{product.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500"> / 5 ({product.reviewCount} recenzija)</span>
                  </div>
                  <button onClick={() => setShowReviewForm(true)} className="px-4 py-2 bg-[#8c4a5a] hover:bg-[#6e3848] text-white text-sm font-medium rounded transition-colors flex items-center gap-2">
                    <Star className="w-4 h-4" /> Oceni proizvod
                  </button>
                </div>
                {product.reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nema recenzija za ovaj proizvod. Budite prvi!</p>
                ) : (
                  <div className="space-y-6">
                    {product.reviews.map((r) => (
                      <div key={r.id} className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold text-[#2d2d2d]">{r.user.name}</span>
                            <div className="flex items-center gap-0.5 mt-1">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-gray-200"}`} />)}</div>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("sr-RS")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="mt-12 mb-16">
            <h2 className="text-2xl font-bold text-[#2d2d2d] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Povezani proizvodi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className="aspect-square overflow-hidden bg-[#faf7f3]">
                    <img src={p.image || defaultImage} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-[#8c4a5a] font-medium uppercase tracking-wider">{p.brand?.name}</span>
                    <h3 className="text-sm font-medium text-[#2d2d2d] mt-1 line-clamp-2">{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      {p.oldPrice && <span className="text-xs text-gray-400 line-through">{p.oldPrice.toLocaleString("sr-RS")} RSD</span>}
                      <span className="text-base font-bold text-[#2d2d2d]">{p.price.toLocaleString("sr-RS")} RSD</span>
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
            <div className="bg-white rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowReviewForm(false)} className="absolute top-4 right-4"><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
              <h3 className="text-xl font-bold text-[#2d2d2d] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Oceni proizvod</h3>
              <p className="text-sm text-gray-500 mb-6">{product.nameLat}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vaša ocena</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                        <Star className={`w-7 h-7 transition-colors ${star <= reviewRating ? "fill-[#8c4a5a] text-[#8c4a5a]" : "text-gray-200 hover:text-[#8c4a5a]"}`} />
                      </button>
                    ))}
                    {reviewRating > 0 && <span className="text-sm text-gray-500 ml-2">{reviewRating}/5</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fotografija (opciono)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#8c4a5a] transition-colors cursor-pointer">
                    <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Kliknite da dodate fotografiju</p>
                  </div>
                </div>
                <button className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded font-medium transition-colors">Pošalji recenziju</button>
              </div>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
