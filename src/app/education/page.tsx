"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Phone, Mail, MapPin, Scissors, GraduationCap, Clock, Users, Star, ChevronRight } from "lucide-react";

export default function EducationPage() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="bg-[#fef9f1] text-[#1d1c17]">
        {/* Hero Section */}
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#1d1c17]/90 via-[#1d1c17]/70 to-[#1d1c17]/40" />
          </div>
          <div className="relative max-w-screen-2xl mx-auto px-6 md:px-8 py-24 md:py-40 w-full">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.05] mb-6 text-white tracking-tight">
                {t("education.heroTitle")}
              </h1>
              <p className="text-xl md:text-2xl text-stone-300 font-light leading-relaxed max-w-xl">
                {t("education.heroSubtitle")}
              </p>
              <div className="flex items-center gap-4 mt-10">
                <a
                  href="tel:+381113066333"
                  className="inline-flex items-center gap-2 bg-white text-[#1d1c17] px-6 py-3 text-sm font-medium tracking-wide hover:bg-stone-100 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +381 11 306 6333
                </a>
                <a
                  href="mailto:info@id-academy.com"
                  className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 text-sm font-medium tracking-wide hover:bg-white/10 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  info@id-academy.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-[#8c4a5a] text-white">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/20">
              <div className="flex items-center gap-4 py-8 md:py-6 md:pr-8">
                <Clock className="w-8 h-8 opacity-80 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-serif">{t("education.programDuration")}</p>
                  <p className="text-sm opacity-70">{t("education.programDurationLabel")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 py-8 md:py-6 md:px-8">
                <Star className="w-8 h-8 opacity-80 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-serif">{t("education.since")}</p>
                  <p className="text-sm opacity-70">{t("education.sinceLabel")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 py-8 md:py-6 md:pl-8">
                <Users className="w-8 h-8 opacity-80 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-serif">{t("education.liveModels")}</p>
                  <p className="text-sm opacity-70">{t("education.liveModelsLabel")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intro Section with Image */}
        <section className="py-24 md:py-32">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <div className="aspect-[3/4] relative overflow-hidden rounded-sm shadow-2xl bg-white flex items-center justify-center">
                    <Image
                      src="/edukacijaImage.jpg"
                      alt="ID Hair Academy"
                      width={500}
                      height={140}
                      className="w-[80%] h-auto object-contain"
                    />
                  </div>
                  <div className="absolute -bottom-6 -right-6 bg-[#8c4a5a] p-6 md:p-8 text-white max-w-[280px] rounded-sm shadow-xl">
                    <MapPin className="w-5 h-5 mb-2 opacity-80" />
                    <p className="font-serif text-lg leading-snug">Kneza Miloša 23</p>
                    <p className="text-sm opacity-80 mt-1">Beograd, Srbija</p>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="font-serif text-4xl md:text-5xl mb-8 leading-tight">
                  {t("education.heroTitle")}
                </h2>
                <div className="w-12 h-px bg-[#703343] mb-8" />
                <p className="text-lg text-[#524345] leading-relaxed mb-8">
                  {t("education.introText")}
                </p>
                <div className="flex items-center gap-3 text-[#8c4a5a]">
                  <Scissors className="w-5 h-5" />
                  <span className="text-sm font-medium tracking-wide uppercase">Kneza Miloša 23, Beograd</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Education Key to Success */}
        <section className="py-24 md:py-32 bg-[#f8f3eb]">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <GraduationCap className="w-10 h-10 text-[#8c4a5a] mx-auto mb-6" />
              <h2 className="font-serif text-4xl md:text-5xl mb-6">
                {t("education.educationTitle")}
              </h2>
              <div className="w-12 h-px bg-[#703343] mx-auto mb-8" />
              <p className="text-lg text-[#524345] leading-relaxed">
                {t("education.educationText")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
              <div className="bg-white p-10 md:p-12 rounded-sm shadow-sm border-l-4 border-[#703343]">
                <h3 className="font-serif text-2xl mb-6">{t("education.approachTitle")}</h3>
                <p className="text-[#524345] font-light leading-relaxed text-lg">
                  {t("education.approachText")}
                </p>
              </div>
              <div className="bg-white p-10 md:p-12 rounded-sm shadow-sm border-l-4 border-[#d4a574]">
                <h3 className="font-serif text-2xl mb-6">{t("education.founderTitle")}</h3>
                <p className="text-[#524345] font-light leading-relaxed text-lg">
                  {t("education.founderText")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories & Second Image */}
        <section className="py-24 md:py-32">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <h2 className="font-serif text-4xl md:text-5xl mb-8 leading-tight">
                  {t("education.successTitle")}
                </h2>
                <div className="w-12 h-px bg-[#703343] mb-8" />
                <p className="text-lg text-[#524345] leading-relaxed mb-10">
                  {t("education.successText")}
                </p>

                {/* Contact Info */}
                <div className="bg-[#f8f3eb] p-8 rounded-sm">
                  <h3 className="font-serif text-xl mb-4">{t("education.contactTitle")}</h3>
                  <p className="text-[#524345] text-sm mb-4">{t("education.contactText")}</p>
                  <div className="space-y-3">
                    <a href="tel:+381113066333" className="flex items-center gap-3 text-[#1d1c17] hover:text-[#8c4a5a] transition-colors">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">+381 11 306 6333</span>
                    </a>
                    <a href="tel:+381646473142" className="flex items-center gap-3 text-[#1d1c17] hover:text-[#8c4a5a] transition-colors">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">+381 64 647 3142</span>
                    </a>
                    <a href="mailto:info@id-academy.com" className="flex items-center gap-3 text-[#1d1c17] hover:text-[#8c4a5a] transition-colors">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">info@id-academy.com</span>
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <div className="aspect-[3/4] overflow-hidden rounded-sm shadow-2xl">
                  <Image
                    src="/edukacija2.jpg"
                    alt="ID Hair Academy education"
                    width={800}
                    height={1067}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Welcome / CTA Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1d1c17] via-[#2a2520] to-[#3d2f2f]" />
          <div className="absolute inset-0 opacity-10">
            <Image
              src="/edukacija2.jpg"
              alt=""
              fill
              className="object-cover"
            />
          </div>
          <div className="relative max-w-screen-2xl mx-auto px-6 md:px-8 text-center">
            <h2 className="font-serif text-5xl md:text-7xl text-white mb-6">
              {t("education.welcomeText")}
            </h2>
            <div className="w-16 h-px bg-[#d4a574] mx-auto mb-10" />
            <div className="max-w-xl mx-auto">
              <h3 className="font-serif text-2xl text-[#d4a574] mb-4">
                {t("education.modelCallTitle")}
              </h3>
              <p className="text-stone-300 leading-relaxed mb-8">
                {t("education.modelCallText")}
              </p>
              <p className="font-serif text-3xl text-white italic mb-10">
                {t("education.seeYou")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:info@id-academy.com"
                  className="inline-flex items-center gap-2 bg-[#8c4a5a] text-white px-8 py-4 text-sm font-medium tracking-wide hover:bg-[#703343] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  info@id-academy.com
                  <ChevronRight className="w-4 h-4" />
                </a>
                <a
                  href="tel:+381113066333"
                  className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 text-sm font-medium tracking-wide hover:bg-white/10 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +381 11 306 6333
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
