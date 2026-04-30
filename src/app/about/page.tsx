"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowRight } from "lucide-react";

/* Splits text on *…* markers and wraps the marked spans in italic accent colour. */
function withEm(text: string, accent: "olive" | "gold" = "olive") {
  const accentClass = accent === "gold" ? "text-[#B8975B]" : "text-[#8C8769]";
  return text.split(/(\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className={`italic font-light ${accentClass}`}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main
        className="bg-[#FAFAFA] text-[#1A1A1A]"
        style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14.5px", lineHeight: 1.65 }}
      >
        {/* ════════════════════════════════════════════════════════════
            1. HERO
        ════════════════════════════════════════════════════════════ */}
        <section className="border-b border-[#E8E5DE]">
          <div className="max-w-[1240px] mx-auto px-6 md:px-14 py-20 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-end">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#6B6B6B] font-medium block mb-6">
                  {t("about.heroTag")}
                </span>
                <h1
                  className="font-light leading-[1.02] mb-7 tracking-[-0.01em]"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(48px, 7vw, 96px)",
                  }}
                >
                  {withEm(t("about.heroTitle"))}
                </h1>
                <p className="text-[16px] text-[#6B6B6B] leading-[1.7] max-w-[480px] mb-8">
                  {t("about.heroLead")}
                </p>
                <div className="flex items-center gap-3.5 flex-wrap">
                  <a
                    href="#partner"
                    className="inline-flex items-center gap-2.5 bg-[#1A1A1A] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium rounded-full hover:bg-black hover:-translate-y-px transition-all"
                  >
                    {t("about.ctaButton")} <ArrowRight className="w-3 h-3" />
                  </a>
                  <Link
                    href="/education"
                    className="inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.22em] font-medium border-b border-current pb-1 hover:text-[#8C8769] transition-colors"
                  >
                    Edukativni centar <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <div className="aspect-[5/6] bg-[#1a1a1a] relative overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1400&q=80"
                  alt="Alta Moda"
                  fill
                  className="object-cover"
                  style={{ filter: "grayscale(1) contrast(1.05)" }}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
                <span
                  className="absolute bottom-3.5 left-4 text-[12px] italic text-white/55"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  AltaModa · centrala · Beograd
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            2. STORY — Nº 01 sticky-side, long-form body
        ════════════════════════════════════════════════════════════ */}
        <section className="border-b border-[#E8E5DE]">
          <div className="max-w-[1240px] mx-auto px-6 md:px-14 py-24 md:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
              <div className="lg:sticky lg:top-32 lg:self-start">
                <div
                  className="italic text-[14px] text-[#8C8769] mb-3.5"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Nº 01
                </div>
                <h2
                  className="font-light text-[42px] leading-[1.05] mb-4"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Alta Moda
                </h2>
                <div className="w-12 h-px bg-[#1A1A1A]/40 mb-5" />
                <p className="text-[13px] text-[#6B6B6B] leading-[1.7] max-w-[240px]">
                  {t("about.heroLead")}
                </p>
              </div>
              <div>
                {/* First paragraph — bigger Cormorant lead with italic accent */}
                <p
                  className="text-[22px] md:text-[24px] leading-[1.45] font-light mb-8 max-w-[720px] text-[#1A1A1A]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {withEm(t("about.introParagraph"))}
                </p>
                <p className="text-[15px] text-[#262521] leading-[1.85] mb-5 max-w-[680px]">
                  {t("about.foundedParagraph")}
                </p>
                <p className="text-[15px] text-[#262521] leading-[1.85] mb-5 max-w-[680px]">
                  {t("about.distributionParagraph")}
                </p>
                <p className="text-[15px] text-[#262521] leading-[1.85] mb-5 max-w-[680px]">
                  {t("about.portfolioParagraph")}
                </p>
                <p className="text-[15px] text-[#262521] leading-[1.85] mb-5 max-w-[680px]">
                  {t("about.salonsParagraph")}
                </p>
                <p className="text-[15px] text-[#262521] leading-[1.85] mb-5 max-w-[680px]">
                  {t("about.networkParagraph")}
                </p>
                <p className="text-[15px] text-[#262521] leading-[1.85] mb-5 max-w-[680px]">
                  {t("about.academyBefore")}{" "}
                  <Link
                    href="/education"
                    className="italic text-[#1A1A1A] border-b border-[#1A1A1A] pb-px hover:text-[#8C8769] hover:border-[#8C8769] transition-colors"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px" }}
                  >
                    {t("about.academyName")}
                  </Link>
                  {t("about.academyAfter")}
                </p>
                <p className="text-[15px] text-[#262521] leading-[1.85] max-w-[680px]">
                  {t("about.systemParagraph")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            3. MISSION — bone band, large italic Cormorant
        ════════════════════════════════════════════════════════════ */}
        <section className="bg-[#EAE5DA]">
          <div className="max-w-[1240px] mx-auto px-6 md:px-14 py-24 md:py-30" style={{ paddingTop: "120px", paddingBottom: "120px" }}>
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 items-start">
              <div>
                <div
                  className="italic text-[14px] text-[#8C8769] mb-3.5"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Nº 02
                </div>
                <h2
                  className="font-light text-[42px] leading-[1.05] mb-4"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {t("about.missionTitle")}
                </h2>
                <div className="w-12 h-px bg-[#1A1A1A]/40" />
              </div>
              <div>
                <div
                  className="italic font-light leading-[1.4] tracking-[-0.005em] max-w-[820px] text-[#1A1A1A]"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(24px, 3vw, 34px)",
                  }}
                >
                  {withEm(t("about.missionParagraph"))}
                </div>
                <span
                  className="italic block mt-8 text-[#8C8769] text-[26px]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {t("about.welcome")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            4. PARTNER CTA — ink black, gold italic accent
        ════════════════════════════════════════════════════════════ */}
        <section id="partner" className="bg-[#1A1A1A] text-white">
          <div className="max-w-[1240px] mx-auto px-6 md:px-14" style={{ paddingTop: "120px", paddingBottom: "120px" }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-white/55 font-medium block mb-5">
                  {t("about.ctaTag")}
                </span>
                <h2
                  className="font-light leading-[1.02] mb-6 tracking-[-0.01em]"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(40px, 5.5vw, 72px)",
                  }}
                >
                  {withEm(t("about.ctaTitle"), "gold")}
                </h2>
                <p className="text-[15px] text-white/70 leading-[1.75] max-w-[520px] mb-8">
                  {t("about.ctaDescription")}
                </p>
                <div className="flex items-center gap-3.5 flex-wrap">
                  <Link
                    href="/account/login"
                    className="inline-flex items-center gap-2.5 bg-white text-[#1A1A1A] px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium rounded-full border border-white hover:bg-[#1A1A1A] hover:text-white hover:border-white transition-colors"
                  >
                    {t("about.ctaButton")} <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/faq#kontakt"
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium rounded-full border border-white/40 hover:bg-white hover:text-[#1A1A1A] transition-colors"
                  >
                    Kontakt <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <div className="aspect-[4/5] bg-[#0e0e0e] relative overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80"
                  alt="Partner"
                  fill
                  className="object-cover"
                  style={{ filter: "grayscale(1) brightness(0.85)" }}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
