"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col bg-[#FFFBF4] text-[#11120D]">
        {/* Hero */}
        <section className="w-full h-[563px] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[#D8CFBC]">
            <img
              alt="Luxury atelier interior"
              className="w-full h-full object-cover grayscale-[0.2] opacity-90"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWLUQRi5KiF9GA_UedLyqeZeB9to4I3qzwbm8Ob-kMfA8J-IzZhiYmTlRB9yd9JFWoRbSbWe6iXnRlxWhUgiX_9ugGo6rZBc3BpUYJ3X0NRMZZ11Mio73NnjNU7OgyZoBmC55_teN-MNM8fxA3HvEkiYQZEDHdu2LZDc-NFL-tcygUOI-naBCQ2Q6wxM3YSJ8d2vnA9M9WGJkJAP452qWqUBBD9jUki9fNIVvSd6uryo46ck6BDbtVybnM4wS7E232n5UhlYORod6t"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FFFBF4]" />
          </div>
          <div className="relative z-10 text-center px-6">
            <h1 className="font-serif italic text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-4">
              {t("contact.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-[#11120D] max-w-2xl mx-auto font-light leading-relaxed">
              {t("contact.heroDescription")}
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="flex-grow bg-[#FFFBF4] py-24 md:py-32">
          <div className="max-w-screen-xl mx-auto px-8 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center items-start">
              {/* Connect */}
              <div className="flex flex-col items-center">
                <span className="text-xs tracking-[0.2em] text-[#5c6050] uppercase mb-10">
                  {t("contact.connect")}
                </span>
                <div className="space-y-6">
                  <a className="block font-serif text-2xl hover:text-[#5c6050] transition-colors duration-300 italic" href="#">
                    Instagram
                  </a>
                  <a className="block font-serif text-2xl hover:text-[#5c6050] transition-colors duration-300 italic" href="#">
                    Pinterest
                  </a>
                  <a className="block font-serif text-2xl hover:text-[#5c6050] transition-colors duration-300 italic" href="#">
                    LinkedIn
                  </a>
                  <a className="block font-serif text-2xl hover:text-[#5c6050] transition-colors duration-300 italic" href="#">
                    Vogue Archive
                  </a>
                </div>
              </div>

              {/* Inquire */}
              <div className="flex flex-col items-center">
                <span className="text-xs tracking-[0.2em] text-[#5c6050] uppercase mb-10">
                  {t("contact.inquire")}
                </span>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] tracking-widest text-[#7A7F6A] uppercase mb-2">
                      {t("contact.emailLabel")}
                    </p>
                    <a
                      className="block font-serif text-2xl hover:text-[#5c6050] transition-colors duration-300"
                      href="mailto:atelier@altamoda.com"
                    >
                      atelier@altamoda.com
                    </a>
                  </div>
                  <div className="pt-4 space-y-1">
                    <p className="text-[10px] tracking-widest text-[#7A7F6A] uppercase mb-2">
                      {t("contact.phoneLabel")}
                    </p>
                    <a
                      className="block font-serif text-2xl hover:text-[#5c6050] transition-colors duration-300"
                      href="tel:+39021234567"
                    >
                      +39 02 123 4567
                    </a>
                  </div>
                </div>
              </div>

              {/* Visit */}
              <div className="flex flex-col items-center">
                <span className="text-xs tracking-[0.2em] text-[#5c6050] uppercase mb-10">
                  {t("contact.visit")}
                </span>
                <div className="space-y-6">
                  <address className="not-italic space-y-4">
                    <p className="font-serif text-2xl leading-snug italic">
                      Via Montenapoleone, 27
                      <br />
                      20121 Milano MI
                      <br />
                      Italy
                    </p>
                  </address>
                  <div className="pt-2">
                    <a
                      className="inline-flex items-center gap-2 text-xs tracking-widest text-[#5c6050] uppercase hover:opacity-70 transition-opacity duration-300"
                      href="#"
                    >
                      {t("contact.viewOnMap")}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-[#FFFBF4] py-24 border-t border-[#D8CFBC]/10">
          <div className="max-w-2xl mx-auto px-8 text-center">
            <h3 className="font-serif text-3xl mb-8">{t("contact.newsletterTitle")}</h3>
            <p className="text-[#11120D] mb-10 font-light italic">
              {t("contact.newsletterDescription")}
            </p>
            <form className="flex flex-col md:flex-row gap-4">
              <input
                className="flex-grow bg-transparent border-0 border-b border-[#7A7F6A] focus:border-[#5c6050] focus:ring-0 py-3 text-[#11120D] placeholder:text-[#7A7F6A]/50 transition-colors duration-500"
                placeholder={t("contact.emailPlaceholder")}
                type="email"
              />
              <button
                className="bg-[#7A7F6A] text-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#5c6050] transition-colors duration-300"
                type="submit"
              >
                {t("contact.subscribe")}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
