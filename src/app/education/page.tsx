"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Clock,
  Users,
  Star,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  UserPlus,
  ArrowRight,
} from "lucide-react";

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

const INSTAGRAM_URL = "https://www.instagram.com/id_hairacademy";

export default function EducationPage() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="bg-[#FFFFFF] text-[#2e2e2e]">
        {/* ════════════════════════════════════════════════════════════
            1. HERO
        ════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden min-h-[70vh] flex items-center">
          <div className="absolute inset-0">
            <Image
              src="/edukacija2.jpg"
              alt="ID Hair Academy team"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2e2e2e]/90 via-[#2e2e2e]/70 to-[#2e2e2e]/40" />
          </div>
          <div className="relative max-w-screen-2xl mx-auto px-6 md:px-8 py-24 md:py-40 w-full">
            <div className="max-w-3xl">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D8CFBC] font-medium block mb-6">
                {t("education.heroTag")}
              </span>
              <h1
                className="text-5xl md:text-7xl lg:text-8xl leading-[1.05] mb-6 text-white font-light"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}
              >
                {t("education.heroTitle")}
              </h1>
              <p className="text-xl md:text-2xl text-[#D8CFBC] font-light leading-relaxed max-w-2xl">
                {t("education.heroSubtitle")}
              </p>
              <div className="flex items-center gap-4 mt-10">
                <a
                  href={`tel:${t("education.contactPhone1").replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 bg-white text-[#2e2e2e] px-6 py-3 text-sm font-medium tracking-wide hover:bg-[#D8CFBC] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {t("education.contactPhone1")}
                </a>
                <a
                  href={`mailto:${t("education.contactEmail")}`}
                  className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 text-sm font-medium tracking-wide hover:bg-white/10 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {t("education.contactEmail")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            2. STATS BAR
        ════════════════════════════════════════════════════════════ */}
        <section className="bg-[#2e2e2e] text-white">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/15">
              <div className="flex items-center gap-4 py-8 md:py-6 md:pr-8">
                <Clock className="w-8 h-8 opacity-70 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {t("education.programDuration")}
                  </p>
                  <p className="text-sm opacity-70">{t("education.programDurationLabel")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 py-8 md:py-6 md:px-8">
                <Star className="w-8 h-8 opacity-70 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {t("education.since")}
                  </p>
                  <p className="text-sm opacity-70">{t("education.sinceLabel")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 py-8 md:py-6 md:pl-8">
                <Users className="w-8 h-8 opacity-70 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {t("education.liveModels")}
                  </p>
                  <p className="text-sm opacity-70">{t("education.liveModelsLabel")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            3. SECTION 1 — EDUKATIVNI CENTAR
        ════════════════════════════════════════════════════════════ */}
        <section className="py-24 md:py-32 bg-[#FFFFFF]">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="max-w-3xl mb-16">
              <GraduationCap className="w-8 h-8 text-[#2e2e2e] mb-6" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-4">
                01
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-[#2e2e2e] leading-[1.05] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                {t("education.section1Title")}
              </h2>
              <div className="w-12 h-px bg-[#2e2e2e]/30 mb-8" />
              <p className="text-[15px] text-[#2e2e2e]/75 leading-[1.8] mb-6">
                {t("education.section1P1")}
              </p>
              <p className="text-[15px] text-[#2e2e2e]/75 leading-[1.8]">
                {t("education.section1P2")}
              </p>
            </div>

            {/* Four sub-pillar cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-12">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[#FFFFFF] border border-[#2e2e2e]/10 rounded-[4px] p-8 hover:border-[#2e2e2e]/40 transition-colors"
                >
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#2e2e2e]/50 font-medium block mb-3">
                    0{i}
                  </span>
                  <h3
                    className="text-2xl font-light text-[#2e2e2e] mb-3"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {t(`education.section1Bullet${i}Title`)}
                  </h3>
                  <p className="text-[13px] text-[#2e2e2e]/65 leading-[1.65]">
                    {t(`education.section1Bullet${i}Desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            4. SECTION 2 — PREMIUM SALON
        ════════════════════════════════════════════════════════════ */}
        <section className="py-24 md:py-32 bg-[#FFFFFF] border-t border-[#2e2e2e]/10">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="aspect-[4/5] relative overflow-hidden rounded-[4px] shadow-2xl">
                  <Image
                    src="/edukacijaImage.jpg"
                    alt="Premium salon"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-[#2e2e2e] text-white p-6 md:p-8 max-w-[280px] rounded-[4px] shadow-xl">
                  <MapPin className="w-5 h-5 mb-2 opacity-80" />
                  <p
                    className="text-lg font-light leading-snug"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    Kneza Miloša 23
                  </p>
                  <p className="text-xs opacity-80 mt-1">Beograd, Srbija</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <Sparkles className="w-8 h-8 text-[#2e2e2e] mb-6" strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-4">
                  02
                </span>
                <h2
                  className="text-4xl md:text-5xl lg:text-6xl font-light text-[#2e2e2e] leading-[1.05] mb-8"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
                >
                  {t("education.section2Title")}
                </h2>
                <div className="w-12 h-px bg-[#2e2e2e]/30 mb-8" />
                <p className="text-[15px] text-[#2e2e2e]/75 leading-[1.8] mb-6">
                  {t("education.section2P1")}
                </p>
                <p className="text-[15px] text-[#2e2e2e]/75 leading-[1.8]">
                  {t("education.section2P2")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            5. SECTION 3 — PRODAJNO MESTO
        ════════════════════════════════════════════════════════════ */}
        <section className="py-24 md:py-32 bg-[#D8CFBC]/30 border-t border-[#2e2e2e]/10">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <ShoppingBag className="w-8 h-8 text-[#2e2e2e] mx-auto mb-6" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-4">
                03
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-[#2e2e2e] leading-[1.05] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                {t("education.section3Title")}
              </h2>
              <div className="w-12 h-px bg-[#2e2e2e]/30 mx-auto mb-8" />
              <p className="text-[15px] md:text-base text-[#2e2e2e]/75 leading-[1.8]">
                {t("education.section3P")}
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            6. SECTION 4 — POSTANI MODEL  (dark CTA section)
        ════════════════════════════════════════════════════════════ */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-[#2e2e2e] text-white">
          <div className="absolute inset-0 opacity-15">
            <Image src="/edukacija2.jpg" alt="" fill className="object-cover" />
          </div>
          <div className="relative max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="max-w-3xl">
              <UserPlus className="w-8 h-8 text-[#D8CFBC] mb-6" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#D8CFBC]/80 font-medium block mb-4">
                04
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-[1.05] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                {t("education.section4Title")}
              </h2>
              <div className="w-12 h-px bg-[#D8CFBC]/40 mb-8" />
              <p className="text-[15px] md:text-base text-white/75 leading-[1.8] mb-10 max-w-2xl">
                {t("education.section4P")}
              </p>
              <a
                href={`mailto:${t("education.contactEmail")}`}
                className="inline-flex items-center gap-2 bg-white text-[#2e2e2e] px-8 py-4 text-[11px] uppercase tracking-[0.22em] font-medium hover:bg-[#D8CFBC] transition-colors rounded-full"
              >
                {t("education.section4Cta")} <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            7. CONTACT
        ════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-28 bg-[#FFFFFF] border-t border-[#2e2e2e]/10">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="max-w-2xl">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-5">
                {t("education.contactTitle")}
              </span>
              <h3
                className="text-3xl md:text-4xl font-light text-[#2e2e2e] leading-[1.1] mb-10"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
              >
                ID Hair Academy
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-[#2e2e2e]">
                  <MapPin className="w-4 h-4 text-[#2e2e2e]/60 flex-shrink-0" />
                  <span className="text-[14px]">{t("education.contactAddress")}</span>
                </li>
                <li>
                  <a
                    href={`tel:${t("education.contactPhone1").replace(/\s/g, "")}`}
                    className="flex items-center gap-4 text-[#2e2e2e] hover:opacity-60 transition-opacity"
                  >
                    <Phone className="w-4 h-4 text-[#2e2e2e]/60 flex-shrink-0" />
                    <span className="text-[14px]">{t("education.contactPhone1")}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${t("education.contactPhone2").replace(/\s/g, "")}`}
                    className="flex items-center gap-4 text-[#2e2e2e] hover:opacity-60 transition-opacity"
                  >
                    <Phone className="w-4 h-4 text-[#2e2e2e]/60 flex-shrink-0" />
                    <span className="text-[14px]">{t("education.contactPhone2")}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${t("education.contactEmail")}`}
                    className="flex items-center gap-4 text-[#2e2e2e] hover:opacity-60 transition-opacity"
                  >
                    <Mail className="w-4 h-4 text-[#2e2e2e]/60 flex-shrink-0" />
                    <span className="text-[14px]">{t("education.contactEmail")}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-[#2e2e2e] hover:opacity-60 transition-opacity"
                  >
                    <Instagram className="w-4 h-4 text-[#2e2e2e]/60 flex-shrink-0" />
                    <span className="text-[14px]">{t("education.contactInstagram")}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            8. INSTAGRAM BENTO
        ════════════════════════════════════════════════════════════ */}
        <section className="py-20 md:py-28 bg-[#FFFFFF] border-t border-[#2e2e2e]/10">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-12 md:mb-16 gap-8 flex-wrap">
              <div>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#2e2e2e]/60 font-medium block mb-5">
                  {t("education.socialKicker")}
                </span>
                <h2
                  className="text-4xl md:text-5xl lg:text-6xl font-light text-[#2e2e2e] leading-[1.05]"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.015em" }}
                >
                  <em className="italic">{t("education.contactInstagram")}</em> {t("education.socialTitle")}
                </h2>
                <p className="text-[14px] text-[#2e2e2e]/60 leading-relaxed mt-5 max-w-md">
                  {t("education.socialDesc")}
                </p>
              </div>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-11 h-11 rounded-full border border-[#D8CFBC] flex items-center justify-center text-[#2e2e2e] hover:bg-[#2e2e2e] hover:text-[#FFFFFF] hover:border-[#2e2e2e] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>

            {/* Same bento pattern as homepage block 8 */}
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
                  className={`${cell.cls} relative overflow-hidden bg-[#D8CFBC] group rounded-[4px]`}
                >
                  <Image
                    src={cell.img}
                    alt={`ID Hair Academy ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-[#2e2e2e]/0 group-hover:bg-[#2e2e2e]/30 transition-colors flex items-center justify-center">
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
