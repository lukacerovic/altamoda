"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Award, Users, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="bg-[#FFFBF4] text-[#11120D]">
        {/* Hero Section */}
        <header className="relative px-8 pt-20 pb-32 max-w-screen-2xl mx-auto overflow-hidden">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-7 lg:col-span-6 flex flex-col justify-center">
              <span className="text-xs tracking-widest uppercase text-[#7A7F6A] mb-6">
                {t("about.heroTag")}
              </span>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] mb-8 tracking-tight">
                {t("about.heroTitle1")} <br />
                <i className="font-normal">{t("about.heroTitle2")}</i>
              </h1>
              <p className="text-lg md:text-xl text-[#11120D] max-w-lg leading-relaxed mb-10">
                {t("about.heroDescription")}
              </p>
            </div>
            <div className="col-span-12 md:col-span-5 lg:col-span-6 relative">
              <div className="aspect-[4/5] bg-[#FFFBF4] overflow-hidden rounded-lg shadow-2xl">
                <img
                  alt="Heritage"
                  className="w-full h-full object-cover mix-blend-multiply opacity-90"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXLvFysGyn1dS6cIm_EqFkS-guVBUCqtjAs_jiyslRMX-VNxRUAewIcNRMBxXzbXxBrrIEf2LxLuWHeBZFeH0PzIvsFCWt9NnhH_MTK2Ub991-rpDt4mIXadDYVVvFPDQZPqDnVEErUGfpCB8cClWBxKPfw9ISolRC1soFo4630OBQMSQ6ZvkclBSb4rZo79WLSrI1L29BilonLaq5xqAUHiqyKisCjIxELupcu2UnqbxDi8x5pj4s_X2yAd0YxFvIDeFz291-alr2"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 md:-left-16 bg-[#7A7F6A] p-8 md:p-12 text-white max-w-xs rounded-sm">
                <p className="font-serif text-2xl italic mb-2">
                  {t("about.heroQuote")}
                </p>
                <p className="text-xs uppercase tracking-widest opacity-80">
                  {t("about.heroQuoteAttribution")}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* A Family Journey */}
        <section className="bg-[#FFFBF4] py-32">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="flex flex-col md:flex-row gap-16 items-start">
              <div className="w-full md:w-1/3 sticky top-32">
                <h2 className="font-serif text-4xl mb-6">
                  {t("about.familyJourneyTitle1")} <br />
                  {t("about.familyJourneyTitle2")}
                </h2>
                <div className="w-12 h-px bg-[#5c6050] mb-6" />
                <p className="text-[#11120D] leading-relaxed">
                  {t("about.familyJourneyDescription")}
                </p>
              </div>
              <div className="w-full md:w-2/3 space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl">{t("about.genesisTitle")}</h3>
                    <p className="text-[#11120D] font-light leading-relaxed">
                      {t("about.genesisDescription")}
                    </p>
                  </div>
                  <div className="aspect-square bg-white p-2 shadow-sm rounded-sm">
                    <img
                      alt="Archival photo"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkGHuNlnQGle2w7EqvNx6LYWdFAUHk4gQJFF500Yb5UXfpb8Utrb4_Mo6nGcX6AmXnbtEHod-VrIWkcIAHrffyESPuuPnaNJik7pJQjUBue74V3ucww-TOxAv9G83-WNtcoY9cZbsujEFztnUEvIc9ct_yjIr2Z-rZEP4-QMqnXsSyMXg2t00GoHiKcoc94PbyQuVLhImZTq5K0wbhIjcdSYech04i-xK06aV-l1a7XNjCkfMeBYuL6R8DQxe9OoLMBPRp1EpYySoS"
                    />
                  </div>
                </div>
                <div className="bg-white p-12 rounded-sm shadow-sm border-l-4 border-[#5c6050]">
                  <h3 className="font-serif text-2xl mb-6">{t("about.reliabilityTitle")}</h3>
                  <p className="text-lg text-[#11120D] font-light italic leading-relaxed">
                    {t("about.reliabilityQuote")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section className="py-32 bg-[#FFFBF4]">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="text-center mb-24">
              <span className="text-xs tracking-[0.2em] uppercase text-[#5c6050] mb-4 block">
                {t("about.milestonesTag")}
              </span>
              <h2 className="font-serif text-5xl">{t("about.milestonesTitle")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
              <div className="md:col-span-2 md:row-span-2 bg-[#D8CFBC] p-10 flex flex-col justify-end group cursor-default">
                <span className="text-6xl font-serif text-[#5c6050] opacity-20 mb-4 group-hover:opacity-100 transition-opacity">
                  2005
                </span>
                <h4 className="font-serif text-2xl mb-2">{t("about.milestone2005Title")}</h4>
                <p className="text-[#11120D] text-sm max-w-xs">
                  {t("about.milestone2005Description")}
                </p>
              </div>
              <div className="md:col-span-2 bg-[#FFFBF4] p-10 flex flex-col justify-center">
                <span className="text-4xl font-serif text-[#5c6050] mb-2">2012</span>
                <h4 className="font-serif text-xl">{t("about.milestone2012Title")}</h4>
                <p className="text-[#11120D] text-sm">
                  {t("about.milestone2012Description")}
                </p>
              </div>
              <div className="bg-[#7A7F6A] text-white p-8 flex flex-col justify-between">
                <span className="text-3xl font-serif italic">2018</span>
                <div>
                  <h4 className="font-serif text-lg">{t("about.milestone2018Title")}</h4>
                  <p className="text-xs opacity-80">
                    {t("about.milestone2018Description")}
                  </p>
                </div>
              </div>
              <div className="bg-[#D8CFBC] p-8 flex flex-col justify-between border border-[#D8CFBC]/10">
                <span className="text-3xl font-serif text-[#5c6050]">2024</span>
                <div>
                  <h4 className="font-serif text-lg">{t("about.milestone2024Title")}</h4>
                  <p className="text-xs text-[#11120D]">
                    {t("about.milestone2024Description")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values / Pillars */}
        <section className="py-32 bg-[#D8CFBC]">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="space-y-6">
                <Award className="w-8 h-8 text-[#5c6050]" strokeWidth={1.5} />
                <h3 className="font-serif text-2xl">{t("about.valueHeritageTitle")}</h3>
                <p className="text-[#11120D] font-light leading-relaxed">
                  {t("about.valueHeritageDescription")}
                </p>
              </div>
              <div className="space-y-6">
                <Users className="w-8 h-8 text-[#5c6050]" strokeWidth={1.5} />
                <h3 className="font-serif text-2xl">{t("about.valueReliabilityTitle")}</h3>
                <p className="text-[#11120D] font-light leading-relaxed">
                  {t("about.valueReliabilityDescription")}
                </p>
              </div>
              <div className="space-y-6">
                <Sparkles className="w-8 h-8 text-[#5c6050]" strokeWidth={1.5} />
                <h3 className="font-serif text-2xl">{t("about.valueCurationTitle")}</h3>
                <p className="text-[#11120D] font-light leading-relaxed">
                  {t("about.valueCurationDescription")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
