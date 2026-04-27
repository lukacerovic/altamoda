"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  _count: { products: number };
}

export default function BrandsListClient({ brands }: { brands: BrandItem[] }) {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-[#FFFFFF] border-b border-[#D8CFBC]">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-20 text-center">
            <h1
              className="text-3xl md:text-4xl font-bold text-[#2e2e2e] tracking-wide"
              style={{ fontFamily: "'Noto Serif', serif" }}
            >
              {t("nav.ourBrands")}
            </h1>
            <p className="mt-3 text-[#293133]/65 text-lg max-w-xl mx-auto">
              {t("brand.browseDescription")}
            </p>
          </div>
        </section>

        {/* Brands Grid */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="group bg-white border border-[#D8CFBC] rounded-sm p-8 hover:border-black hover:shadow-lg transition-all"
              >
                <div className="h-16 flex items-center justify-center mb-6">
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="max-h-full max-w-[180px] object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <span
                      className="text-3xl font-bold text-[#D8CFBC] group-hover:text-[#2e2e2e] transition-colors"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {brand.name}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-[#2e2e2e] text-center">{brand.name}</h3>
                {brand.description && (
                  <p className="text-sm text-[#293133]/65 text-center mt-2 line-clamp-2">{brand.description}</p>
                )}
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[#293133]/65 group-hover:text-[#2e2e2e] transition-colors">
                  <span>{brand._count.products} {t("admin.productsCount")}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
