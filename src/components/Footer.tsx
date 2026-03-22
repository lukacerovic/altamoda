"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Globe, AtSign, Play } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-stone-100 mt-auto grid grid-cols-1 md:grid-cols-4 gap-12 px-10 md:px-20 py-16 w-full text-stone-900">
      {/* Column 1: Brand */}
      <div className="md:col-span-1">
        <div
          className="text-2xl text-black mb-6 tracking-[0.15em]"
          style={{ fontFamily: "'Noto Serif', serif" }}
        >
          ALTAMODA
        </div>
        <p className="text-xs tracking-wider uppercase leading-loose text-stone-600">
          {t("footer.description")}
        </p>
        <div className="flex items-center gap-3 mt-6">
          <a
            href="#"
            aria-label="Instagram"
            className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:text-amber-700 hover:border-amber-700 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
          </a>
          <a
            href="#"
            aria-label="Email"
            className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:text-amber-700 hover:border-amber-700 transition-colors"
          >
            <AtSign className="w-3.5 h-3.5" />
          </a>
          <a
            href="#"
            aria-label="YouTube"
            className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:text-amber-700 hover:border-amber-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
          </a>
        </div>
        <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-8">
          © 2024 ALTAMODA Luxury Hair Care.
        </p>
      </div>

      {/* Column 2: Kupovina (Shopping) */}
      <div className="flex flex-col gap-4">
        <h5 className="font-bold text-xs uppercase tracking-[0.2em] mb-2">
          {t("footer.shopping")}
        </h5>
        <Link href="/products" className="text-xs uppercase tracking-wider text-stone-600 hover:text-amber-700 transition-colors">
          {t("footer.allProducts")}
        </Link>
        <Link href="/colors" className="text-xs uppercase tracking-wider text-stone-600 hover:text-amber-700 transition-colors">
          {t("footer.hairColors")}
        </Link>
        <Link href="/outlet" className="text-xs uppercase tracking-wider text-stone-600 hover:text-amber-700 transition-colors">
          {t("footer.sales")}
        </Link>
        <Link href="/products" className="text-xs uppercase tracking-wider text-stone-600 hover:text-amber-700 transition-colors">
          {t("footer.brands")}
        </Link>
        <Link href="/quick-order" className="text-xs uppercase tracking-wider text-stone-600 hover:text-amber-700 transition-colors">
          {t("footer.quickOrder")}
        </Link>
      </div>

      {/* Column 3: Podrska (Support) */}
      <div className="flex flex-col gap-4">
        <h5 className="font-bold text-xs uppercase tracking-[0.2em] mb-2">
          {t("footer.information")}
        </h5>
        <Link href="/faq" className="text-xs uppercase tracking-wider text-stone-600 hover:text-amber-700 transition-colors">
          {t("footer.faq")}
        </Link>
<Link href="/seminars" className="text-xs uppercase tracking-wider text-stone-600 hover:text-amber-700 transition-colors">
          {t("footer.seminars")}
        </Link>
        <a href="#" className="text-xs uppercase tracking-wider text-stone-600 hover:text-amber-700 transition-colors">
          {t("footer.termsOfUse")}
        </a>
      </div>

      {/* Column 4: Kontakt */}
      <div className="flex flex-col gap-4">
        <h5 className="font-bold text-xs uppercase tracking-[0.2em] mb-2">
          {t("footer.contactTitle")}
        </h5>
        <p className="text-xs uppercase tracking-wider text-stone-600">
          {t("footer.address")}
        </p>
        <p className="text-xs uppercase tracking-wider text-stone-600">
          {t("footer.phone")}
        </p>
        <p className="text-xs uppercase tracking-wider text-stone-600">
          {t("footer.email")}
        </p>
        <p className="text-xs uppercase tracking-wider text-stone-600">
          {t("footer.workHours")}
        </p>
      </div>
    </footer>
  );
}
