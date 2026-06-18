"use client";

import Link from "next/link";
import { Star, ShoppingBag, ArrowRight } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop";

interface BrandProduct {
  id: string;
  name: string;
  slug: string;
  brand: { name: string; slug: string } | null;
  price: number;
  oldPrice: number | null;
  image: string | null;
  isNew: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
}

interface BrandPageClientProps {
  brand: {
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    content: string | null;
  };
  products: BrandProduct[];
  totalProducts: number;
}

export default function BrandPageClient({ brand, products, totalProducts }: BrandPageClientProps) {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-[#FFFFFF] border-b border-[#dddbd9]">
          <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 text-center">
            {brand.logoUrl ? (
              <div className="mb-4">
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-10 md:h-14 mx-auto object-contain"
                />
              </div>
            ) : (
              <h1
                className="text-2xl md:text-3xl font-bold text-[#1a1c1e] tracking-wide"
                style={{ fontFamily: "'Noto Serif', serif" }}
              >
                {brand.name}
              </h1>
            )}
            {brand.description && (
              <p className="mt-4 text-[#1a1c1e] text-lg max-w-2xl mx-auto leading-relaxed">
                {brand.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-center gap-6 text-sm text-[#1a1c1e]">
              <span>{totalProducts} {t("brand.productsAvailable")}</span>
            </div>
          </div>
        </section>

        {/* Content from TipTap editor */}
        {brand.content && (
          <section className="max-w-4xl mx-auto px-4 py-16">
            <div
              className="prose prose-stone prose-lg max-w-none
                [&_h1]:text-[#1a1c1e] [&_h1]:font-serif [&_h1]:text-3xl [&_h1]:tracking-wide
                [&_h2]:text-[#1a1c1e] [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:tracking-wide
                [&_h3]:text-[#1a1c1e] [&_h3]:font-serif
                [&_p]:text-[#1a1c1e] [&_p]:leading-relaxed
                [&_a]:text-[#1a1c1e] [&_a]:underline
                [&_hr]:border-[#dddbd9]
                [&_img]:rounded-[4px] [&_img]:mx-auto"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(brand.content) }}
            />
          </section>
        )}

        {/* Products Section */}
        {products.length > 0 && (
          <section className="bg-[#FFFFFF] border-t border-[#dddbd9]">
            <div className="max-w-7xl mx-auto px-4 py-16">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2
                    className="text-2xl md:text-3xl font-bold text-[#1a1c1e] tracking-wide"
                    style={{ fontFamily: "'Noto Serif', serif" }}
                  >
                    {t("brand.productsBy")} {brand.name}
                  </h2>
                  <p className="text-[#1a1c1e] text-sm mt-1">
                    {t("brand.showingProducts").replace("{count}", String(products.length)).replace("{total}", String(totalProducts))}
                  </p>
                </div>
                {totalProducts > 8 && (
                  <Link
                    href={`/products?brand=${brand.slug}`}
                    className="flex items-center gap-2 bg-[#edb4bd] text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-[#413d3a] transition-colors"
                  >
                    {t("brand.viewAll")}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => {
                  const imgSrc = product.image || PLACEHOLDER_IMG;
                  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
                  const discountPct = hasDiscount
                    ? Math.round((1 - product.price / product.oldPrice!) * 100)
                    : 0;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group bg-white rounded-[4px] overflow-hidden border border-transparent hover:border-[#dddbd9] hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-square bg-[#FFFFFF] overflow-hidden">
                        <img
                          src={imgSrc}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.isNew && (
                          <span className="absolute top-2 left-2 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] rounded-full bg-[rgba(26,28,30,0.5)] text-white backdrop-blur-sm">
                            NOVO
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="absolute top-2 right-2 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] rounded-full bg-[rgba(26,28,30,0.5)] text-white backdrop-blur-sm">
                            -{discountPct}%
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[11px] text-[#1a1c1e] uppercase tracking-wider mb-1">
                          {product.brand?.name}
                        </p>
                        <h3 className="text-sm font-medium text-[#1a1c1e] line-clamp-2 leading-snug mb-2">
                          {product.name}
                        </h3>
                        {product.rating > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-[#1a1c1e]">
                              {product.rating.toFixed(1)} ({product.reviewCount})
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1a1c1e]">
                            {product.price.toLocaleString("sr-RS")} <span className="text-[10px] font-semibold text-[#1a1c1e]">RSD</span>
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-[#1a1c1e] line-through">
                              {product.oldPrice!.toLocaleString("sr-RS")}
                            </span>
                          )}
                        </div>
                        {product.stockQuantity <= 0 && (
                          <p className="text-[11px] text-red-500 font-medium mt-1">{t("products.outOfStock")}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalProducts > 8 && (
                <div className="text-center mt-10">
                  <Link
                    href={`/products?brand=${brand.slug}`}
                    className="inline-flex items-center gap-2 border border-[#edb4bd] text-[#1a1c1e] px-8 py-3 rounded-sm text-sm font-medium hover:bg-[#edb4bd] hover:text-white transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {t("brand.viewAllProducts").replace("{brand}", brand.name)}
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
