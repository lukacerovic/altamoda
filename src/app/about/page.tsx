"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="bg-[#FFFFFF] text-[#2e2e2e]">
        {/* ════════════════════════════════════════════════════════════
            1. HERO
        ════════════════════════════════════════════════════════════ */}
        <section className="bg-[#FFFFFF] pt-20 md:pt-28 pb-16 md:pb-20">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#837A64] font-medium block mb-6">
              {t("about.heroTag")}
            </span>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-light text-[#2e2e2e] leading-[1.05] mb-8 max-w-4xl"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}
            >
              {t("about.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-[#2e2e2e]/75 leading-[1.6] max-w-3xl">
              {t("about.heroLead")}
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            2. MAIN CONTENT — long-form intro paragraphs
        ════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 bg-[#FFFFFF] border-t border-[rgba(46,46,46,0.08)]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
              <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-4">
                  01
                </span>
                <h2
                  className="text-3xl md:text-4xl font-light text-[#2e2e2e] leading-[1.1] mb-4"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
                >
                  Alta Moda
                </h2>
                <div className="w-12 h-px bg-[#837A64] mb-6" />
                <p className="text-sm text-[#2e2e2e]/60 leading-relaxed max-w-xs">
                  {t("about.heroLead")}
                </p>
              </div>
              <div className="lg:col-span-8 space-y-6">
                <p className="text-[15px] md:text-base text-[#2e2e2e]/80 leading-[1.85]">
                  {t("about.introParagraph")}
                </p>
                <p className="text-[15px] md:text-base text-[#2e2e2e]/80 leading-[1.85]">
                  {t("about.foundedParagraph")}
                </p>
                <p className="text-[15px] md:text-base text-[#2e2e2e]/80 leading-[1.85]">
                  {t("about.distributionParagraph")}
                </p>
                <p className="text-[15px] md:text-base text-[#2e2e2e]/80 leading-[1.85]">
                  {t("about.portfolioParagraph")}
                </p>
                <p className="text-[15px] md:text-base text-[#2e2e2e]/80 leading-[1.85]">
                  {t("about.salonsParagraph")}
                </p>
                <p className="text-[15px] md:text-base text-[#2e2e2e]/80 leading-[1.85]">
                  {t("about.networkParagraph")}
                </p>
                {/* Academy paragraph with inline link to /education */}
                <p className="text-[15px] md:text-base text-[#2e2e2e]/80 leading-[1.85]">
                  {t("about.academyBefore")}{" "}
                  <Link
                    href="/education"
                    className="text-[#2e2e2e] underline decoration-[#837A64] decoration-1 underline-offset-4 hover:decoration-[#2e2e2e] transition-colors font-medium"
                  >
                    {t("about.academyName")}
                  </Link>
                  {t("about.academyAfter")}
                </p>
                <p className="text-[15px] md:text-base text-[#2e2e2e]/80 leading-[1.85]">
                  {t("about.systemParagraph")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            3. STATS STRIP
        ════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-20 bg-[#D8CFBC]/40 border-y border-[rgba(46,46,46,0.08)]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[rgba(46,46,46,0.12)]">
              <div className="py-8 md:py-4 md:pr-12">
                <div
                  className="text-5xl md:text-6xl font-light text-[#2e2e2e] mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}
                >
                  {t("about.statYearsNumber")}
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 font-medium">
                  {t("about.statYearsLabel")}
                </div>
              </div>
              <div className="py-8 md:py-4 md:px-12">
                <div
                  className="text-5xl md:text-6xl font-light text-[#2e2e2e] mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}
                >
                  {t("about.statSalonsNumber")}
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 font-medium">
                  {t("about.statSalonsLabel")}
                </div>
              </div>
              <div className="py-8 md:py-4 md:pl-12">
                <div
                  className="text-5xl md:text-6xl font-light text-[#2e2e2e] mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}
                >
                  {t("about.statMarketsNumber")}
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#2e2e2e]/60 font-medium">
                  {t("about.statMarketsLabel")}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            4. MISSION
        ════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-28 bg-[#FFFFFF]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="max-w-3xl">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-4">
                02
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-[#2e2e2e] leading-[1.05] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                {t("about.missionTitle")}
              </h2>
              <div className="w-12 h-px bg-[#837A64] mb-8" />
              <p
                className="text-2xl md:text-3xl font-light text-[#2e2e2e] leading-[1.4] italic"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {t("about.missionParagraph")}
              </p>
              <p
                className="text-3xl md:text-4xl font-light text-[#837A64] leading-[1.2] mt-10"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                {t("about.welcome")}
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            5. CTA — become a partner (dark)
        ════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-28 bg-[#2e2e2e] text-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="max-w-3xl">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#D8CFBC] font-medium block mb-5">
                {t("about.ctaTag")}
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                {t("about.ctaTitle")}
              </h2>
              <p className="text-[15px] md:text-base text-white/70 leading-[1.8] mb-10 max-w-2xl">
                {t("about.ctaDescription")}
              </p>
              <Link
                href="/account/login"
                className="inline-flex items-center gap-2 bg-white text-[#2e2e2e] px-8 py-4 text-[11px] uppercase tracking-[0.22em] font-medium hover:bg-[#D8CFBC] transition-colors rounded-full"
              >
                {t("about.ctaButton")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
