"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { Instagram, Facebook, Music2, AtSign } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();
  const settings = useSiteSettings(["instagram", "facebook", "tiktok", "storeEmail"]);
  const socialLinks = [
    settings.instagram && { href: settings.instagram, label: "Instagram", Icon: Instagram },
    settings.facebook && { href: settings.facebook, label: "Facebook", Icon: Facebook },
    settings.tiktok && { href: settings.tiktok, label: "TikTok", Icon: Music2 },
    settings.storeEmail && { href: `mailto:${settings.storeEmail}`, label: "Email", Icon: AtSign },
  ].filter(Boolean) as Array<{ href: string; label: string; Icon: typeof Instagram }>;

  return (
    <footer className="bg-[#2e2e2e] mt-auto grid grid-cols-1 md:grid-cols-4 gap-12 px-10 md:px-20 py-16 w-full text-[#FFFFFF]">
      {/* Column 1: Brand */}
      <div className="md:col-span-1">
        <div
          className="text-2xl text-[#FFFFFF] mb-6 tracking-[0.15em]"
          style={{ fontFamily: "'Noto Serif', serif" }}
        >
          ALTAMODA
        </div>
        <p className="text-xs tracking-wider uppercase leading-loose text-[#FFFFFF]/80">
          {t("footer.description")}
        </p>
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-3 mt-6">
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="w-8 h-8 rounded-full border border-[#a59d85]/30 flex items-center justify-center text-[#a59d85] hover:text-[#FFFFFF] hover:border-[#FFFFFF] transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        )}
        <p className="text-[10px] text-[#a59d85]/60 uppercase tracking-widest mt-8">
          © 2026 ALTAMODA. All rights reserved.
        </p>
      </div>

      {/* Column 2: Kupovina (Shopping) */}
      <div className="flex flex-col gap-4">
        <h5 className="font-bold text-xs uppercase tracking-[0.2em] mb-2 text-[#FFFFFF]">
          {t("footer.shopping")}
        </h5>
        <Link href="/products" className="text-xs uppercase tracking-wider text-[#FFFFFF] hover:text-[#FFFFFF] transition-colors">
          {t("footer.allProducts")}
        </Link>
        <Link href="/colors" className="text-xs uppercase tracking-wider text-[#FFFFFF] hover:text-[#FFFFFF] transition-colors">
          {t("footer.hairColors")}
        </Link>
        <Link href="/products" className="text-xs uppercase tracking-wider text-[#FFFFFF] hover:text-[#FFFFFF] transition-colors">
          {t("footer.brands")}
        </Link>
      </div>

      {/* Column 3: Podrska (Support) */}
      <div className="flex flex-col gap-4">
        <h5 className="font-bold text-xs uppercase tracking-[0.2em] mb-2 text-[#FFFFFF]">
          {t("footer.information")}
        </h5>
        <Link href="/faq" className="text-xs uppercase tracking-wider text-[#FFFFFF] hover:text-[#FFFFFF] transition-colors">
          {t("footer.faq")}
        </Link>
        <a href="#" className="text-xs uppercase tracking-wider text-[#FFFFFF] hover:text-[#FFFFFF] transition-colors">
          {t("footer.termsOfUse")}
        </a>
      </div>

      {/* Column 4: Kontakt */}
      <div className="flex flex-col gap-4">
        <h5 className="font-bold text-xs uppercase tracking-[0.2em] mb-2 text-[#FFFFFF]">
          {t("footer.contactTitle")}
        </h5>
        <p className="text-xs uppercase tracking-wider text-[#FFFFFF]">
          {t("footer.address")}
        </p>
        <p className="text-xs uppercase tracking-wider text-[#FFFFFF]">
          {t("footer.phone")}
        </p>
        <p className="text-xs uppercase tracking-wider text-[#FFFFFF]">
          {t("footer.email")}
        </p>
        <p className="text-xs uppercase tracking-wider text-[#FFFFFF]">
          {t("footer.workHours")}
        </p>
      </div>
    </footer>
  );
}
