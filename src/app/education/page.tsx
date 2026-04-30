"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowRight, Instagram } from "lucide-react";
import type { ReactNode } from "react";

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

const INSTAGRAM_URL = "https://www.instagram.com/id_hairacademy";

/* Bento-grid placeholder shots — swap with real ID Hair Academy imagery
   when CMS-editable image fields land. */
const academyShots = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1580618864180-f6d7d39b8ff6?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1470259078422-826894b933aa?w=1200&h=600&fit=crop",
];

/* Vertical card for the 3-up "spaces" grid (Nº 01 / 02 / 03) */
function SpaceCard({
  num,
  title,
  kicker,
  img,
  credit,
  children,
}: {
  num: string;
  title: string;
  kicker: string;
  img: string;
  credit: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="aspect-[4/5] bg-[#1a1a1a] overflow-hidden relative mb-5">
        <Image
          src={img}
          alt=""
          fill
          className="object-cover"
          style={{ filter: "grayscale(1) contrast(1.05)" }}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span
          className="absolute bottom-3 left-3.5 text-[11px] italic text-white/60"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {credit}
        </span>
      </div>
      <div
        className="italic text-[12px] mb-2 text-[#8C8769]"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {num}
      </div>
      <h3
        className="font-light text-[24px] leading-[1.1] mb-2.5 tracking-[-0.005em] text-[#1A1A1A]"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {withEm(title)}
      </h3>
      <div className="w-8 h-px mb-2.5 bg-[#1A1A1A]/40" />
      <div className="text-[9.5px] uppercase tracking-[0.18em] leading-[1.6] text-[#6B6B6B] mb-4">
        {kicker}
      </div>
      <div className="text-[13px] leading-[1.7] text-[#262521]">
        {children}
      </div>
    </div>
  );
}

export default function EducationPage() {
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
                  {t("education.heroTag")}
                </span>
                <h1
                  className="font-light leading-[1.02] mb-7 tracking-[-0.01em]"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(48px, 7vw, 96px)",
                  }}
                >
                  {withEm(t("education.heroTitle"))}
                </h1>
                <p className="text-[16px] text-[#6B6B6B] leading-[1.7] max-w-[480px] mb-8">
                  {t("education.heroSubtitle")}
                </p>
                <div className="flex items-center gap-3.5 flex-wrap">
                  <a
                    href="#kontakt"
                    className="inline-flex items-center gap-2.5 bg-[#1A1A1A] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium rounded-full hover:bg-black hover:-translate-y-px transition-all"
                  >
                    {t("education.heroCtaPrimary")} <ArrowRight className="w-3 h-3" />
                  </a>
                  <a
                    href="#kontakt"
                    className="inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.22em] font-medium border-b border-current pb-1 hover:text-[#8C8769] transition-colors"
                  >
                    {t("education.heroCtaSecondary")} <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="aspect-[5/6] bg-[#1a1a1a] relative overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1400&q=80"
                  alt="ID Hair Academy"
                  fill
                  className="object-cover"
                  style={{ filter: "grayscale(1) contrast(1.05)" }}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  priority
                />
                <span
                  className="absolute bottom-3.5 left-4 text-[12px] italic text-white/55"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {t("education.heroImageCredit")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            2. ACADEMY INTRO — ink editorial
        ════════════════════════════════════════════════════════════ */}
        <section className="bg-[#1A1A1A] text-white">
          <div className="max-w-[1240px] mx-auto px-6 md:px-14" style={{ paddingTop: "140px", paddingBottom: "140px" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-white/55 font-medium block mb-5">
                  {t("education.academyEyebrow")}
                </span>
                <h2
                  className="font-light leading-[1.05] mb-7 tracking-[-0.005em]"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(40px, 5vw, 64px)",
                  }}
                >
                  {withEm(t("education.academyTitle"), "gold")}
                </h2>
                <div className="text-[16px] leading-[1.85] max-w-[520px] text-white/78">
                  <p className="mb-4">{t("education.academyP1")}</p>
                  <p>{t("education.academyP2")}</p>
                </div>
              </div>
              <div className="aspect-[4/5] bg-[#0e0e0e] relative overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80"
                  alt="Edukacija"
                  fill
                  className="object-cover"
                  style={{ filter: "grayscale(1) brightness(0.85)" }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            3. SECTIONS — Nº 01 / Nº 02 / Nº 03 / Nº 04
        ════════════════════════════════════════════════════════════ */}
        <section className="border-b border-[#E8E5DE] py-20 md:py-24">
          <div className="max-w-[1240px] mx-auto px-6 md:px-14 mb-12">
            <div className="max-w-[720px]">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#6B6B6B] font-medium block mb-3.5">
                {t("education.sectionsEyebrow")}
              </span>
              <h2
                className="font-light leading-[1.08] tracking-[-0.005em]"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(28px, 3.4vw, 40px)",
                }}
              >
                {withEm(t("education.sectionsTitle"))}
              </h2>
            </div>
          </div>

          <div className="max-w-[1240px] mx-auto px-6 md:px-14">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              <SpaceCard
                num="Nº 01"
                title={t("education.section1Title")}
                kicker={t("education.section1Kicker")}
                img="https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=900&q=80"
                credit={t("education.section1ImgCredit")}
              >
                <p className="mb-3 font-light text-[15px] leading-[1.5] text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {withEm(t("education.section1P1"))}
                </p>
                <p>{t("education.section1P2")}</p>
              </SpaceCard>

              <SpaceCard
                num="Nº 02"
                title={t("education.section2Title")}
                kicker={t("education.section2Kicker")}
                img="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80"
                credit={t("education.section2ImgCredit")}
              >
                <p className="mb-3 font-light text-[15px] leading-[1.5] text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {withEm(t("education.section2P1"))}
                </p>
                <p className="mb-3">{t("education.section2P2")}</p>
                <p>{t("education.section2P3")}</p>
              </SpaceCard>

              <SpaceCard
                num="Nº 03"
                title={t("education.section3Title")}
                kicker={t("education.section3Kicker")}
                img="https://images.unsplash.com/photo-1522335789203-aaa7d7c0fbb1?w=900&q=80"
                credit={t("education.section3ImgCredit")}
              >
                <p className="mb-3 font-light text-[15px] leading-[1.5] text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {withEm(t("education.section3P1"))}
                </p>
                <p>{t("education.section3P2")}</p>
              </SpaceCard>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            4. COMBINED Nº 04 model + Nº 05 kontakt — single ink panel
        ════════════════════════════════════════════════════════════ */}
        <section id="kontakt" className="bg-[#1A1A1A] text-white mt-12">
          {/* Top — Nº 04 model row */}
          <div className="max-w-[1240px] mx-auto px-6 md:px-14 pt-14 md:pt-20 pb-12 md:pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_0.85fr] gap-8 lg:gap-12 items-start">
              <div>
                <div
                  className="italic text-[13px] text-[#B8975B] mb-2.5"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Nº 04
                </div>
                <h3
                  className="font-light text-[30px] leading-[1.1] mb-3.5 tracking-[-0.005em] text-white"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {withEm(t("education.section4Title"), "gold")}
                </h3>
                <div className="w-10 h-px mb-3.5 bg-white/50" />
                <div className="text-[10px] uppercase tracking-[0.18em] leading-[1.6] max-w-[220px] text-white/55">
                  {t("education.section4Kicker")}
                </div>
              </div>
              <div className="text-[14px] leading-[1.75] max-w-[520px] text-white/78">
                <p
                  className="mb-4 text-white"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", lineHeight: 1.5, fontWeight: 300 }}
                >
                  {withEm(t("education.section4P1"), "gold")}
                </p>
                <p className="mb-3">{t("education.section4P2")}</p>
                <div className="mt-6 flex gap-3.5 flex-wrap">
                  <a
                    href={`mailto:${t("education.contactEmail")}`}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium rounded-full border border-white/40 hover:bg-white hover:text-[#1A1A1A] transition-colors"
                  >
                    {t("education.section4Cta")} <ArrowRight className="w-3 h-3" />
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium rounded-full border border-white/40 hover:bg-white hover:text-[#1A1A1A] transition-colors"
                  >
                    {t("education.contactInstagram")} <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="pt-1">
                <div className="aspect-[4/5] bg-[#0e0e0e] overflow-hidden relative">
                  <Image
                    src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80"
                    alt=""
                    fill
                    className="object-cover"
                    style={{ filter: "grayscale(1) contrast(1.05)" }}
                    sizes="(max-width: 1024px) 100vw, 30vw"
                  />
                  <span
                    className="absolute bottom-3.5 left-4 text-[12px] italic text-white/70"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {t("education.section4ImgCredit")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hairline separator */}
          <div className="max-w-[1240px] mx-auto px-6 md:px-14">
            <div className="h-px bg-white/15" />
          </div>

          {/* Bottom — Nº 05 Kontakt hairline list (dark variant, compact) */}
          <div className="max-w-[1240px] mx-auto px-6 md:px-14 pt-8 md:pt-10 pb-12 md:pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-14 items-start">
              <div>
                <div
                  className="italic text-[12px] text-[#B8975B] mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Nº 05
                </div>
                <h3
                  className="font-light text-[22px] leading-[1.1] mb-2.5 text-white"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {t("education.contactTitle")}
                </h3>
                <div className="w-8 h-px bg-white/40 mb-3" />
                <p className="text-[11.5px] text-white/55 leading-[1.6] max-w-[220px]">
                  {t("education.contactKicker")}
                </p>
              </div>
              <div className="border-t border-white/15">
                {[
                  { k: t("education.contactRowAddress"), v: t("education.contactStreet"), href: undefined, mono: false, external: false },
                  { k: t("education.contactRowCity"), v: t("education.contactCity"), href: undefined, mono: false, external: false },
                  { k: t("education.contactRowPhone"), v: t("education.contactPhone1"), href: `tel:${t("education.contactPhone1").replace(/\s/g, "")}`, mono: true, external: false },
                  { k: t("education.contactRowMobile"), v: t("education.contactPhone2"), href: `tel:${t("education.contactPhone2").replace(/\s/g, "")}`, mono: true, external: false },
                  { k: t("education.contactRowEmail"), v: t("education.contactEmail"), href: `mailto:${t("education.contactEmail")}`, mono: true, external: false },
                  { k: t("education.contactRowInstagram"), v: t("education.contactInstagram"), href: INSTAGRAM_URL, mono: false, external: true },
                ].map((row, i) => {
                  const Comp: "a" | "div" = row.href ? "a" : "div";
                  return (
                    <Comp
                      key={i}
                      {...(row.href
                        ? {
                            href: row.href,
                            ...(row.external ? { target: "_blank", rel: "noopener noreferrer" as const } : {}),
                          }
                        : {})}
                      className="grid grid-cols-[90px_1fr_auto] md:grid-cols-[120px_1fr_auto] items-baseline py-2.5 border-b border-white/15 gap-3 md:gap-5 group transition-[padding] duration-200 hover:pl-1"
                    >
                      <span className="text-[9px] uppercase tracking-[0.22em] text-white/55">{row.k}</span>
                      <span
                        className={
                          row.mono
                            ? "text-[12.5px] tracking-[0.02em] text-white"
                            : "italic text-[15px] text-white"
                        }
                        style={
                          row.mono
                            ? { fontFamily: "ui-monospace, Menlo, monospace" }
                            : { fontFamily: "'Cormorant Garamond', serif" }
                        }
                      >
                        {row.v}
                      </span>
                      <span className="text-[10px] text-white/50 group-hover:text-white group-hover:translate-x-[3px] transition-all">→</span>
                    </Comp>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            5. INSTAGRAM BENTO — kept from previous design (per user request)
        ════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-28 bg-[#FAFAFA]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-12 md:mb-16 gap-8 flex-wrap">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#1A1A1A]/60 font-medium block mb-5">
                  {t("education.socialKicker")}
                </span>
                <h2
                  className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1A1A1A] leading-[1.05]"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
                >
                  <em className="italic">{t("education.contactInstagram")}</em> {t("education.socialTitle")}
                </h2>
                <p className="text-[14px] text-[#1A1A1A]/60 leading-relaxed mt-5 max-w-md">
                  {t("education.socialDesc")}
                </p>
              </div>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-11 h-11 rounded-full border border-[#E8E5DE] flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>

            {/* Same bento pattern as before */}
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] md:auto-rows-[240px] gap-2 md:gap-3">
              {[
                { img: academyShots[0], cls: "col-span-2 row-span-1" },
                { img: academyShots[1], cls: "col-span-1 row-span-1" },
                { img: academyShots[2], cls: "col-span-1 row-span-2" },
                { img: academyShots[3], cls: "col-span-1 row-span-1" },
                { img: academyShots[4], cls: "col-span-2 row-span-1" },
                { img: academyShots[5], cls: "col-span-2 row-span-1" },
                { img: academyShots[6], cls: "col-span-1 row-span-1" },
                { img: academyShots[7], cls: "col-span-1 row-span-1" },
              ].map((cell, i) => (
                <a
                  key={i}
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cell.cls} relative overflow-hidden bg-[#EAE5DA] group`}
                >
                  <Image
                    src={cell.img}
                    alt={`ID Hair Academy ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-[#1A1A1A]/0 group-hover:bg-[#1A1A1A]/30 transition-colors flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
