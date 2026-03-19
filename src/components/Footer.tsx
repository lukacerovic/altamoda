"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Instagram,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Facebook,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Youtube,
} from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();
  const [footerEmail, setFooterEmail] = useState("");
  const [footerStatus, setFooterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [footerMessage, setFooterMessage] = useState("");

  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerEmail) return;
    setFooterStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: footerEmail }),
      });
      const json = await res.json();
      if (res.ok) {
        setFooterStatus("success");
        setFooterMessage(json.data?.message || "Uspešno ste se prijavili!");
        setFooterEmail("");
      } else {
        setFooterStatus("error");
        setFooterMessage(json.error || "Došlo je do greške");
      }
    } catch {
      setFooterStatus("error");
      setFooterMessage("Došlo je do greške");
    }
  };
  return (
    <footer className="bg-[#2d2d2d] text-white/60">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          <div>
            <img src="/logo.png" alt="Alta Moda" className="h-6 brightness-0 invert mb-5" />
            <p className="text-sm leading-relaxed text-white/50">
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#8c4a5a] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#8c4a5a] transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#8c4a5a] transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white/90 font-medium text-sm tracking-wider mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px' }}>
              {t("footer.shopping")}
            </h4>
            <div className="space-y-2.5 text-sm">
              <Link href="/products" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.allProducts")}
              </Link>
              <Link href="/colors" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.hairColors")}
              </Link>
              <Link href="/outlet" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.sales")}
              </Link>
              <Link href="/products" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.brands")}
              </Link>
              <Link href="/quick-order" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.quickOrder")}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-white/90 font-medium text-sm tracking-wider mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px' }}>
              {t("footer.information")}
            </h4>
            <div className="space-y-2.5 text-sm">
              <Link href="/faq" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.faq")}
              </Link>
              <Link href="/blog" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.blog")}
              </Link>
              <Link href="/seminars" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.seminars")}
              </Link>
              <Link href="/salon-locator" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.findSalon")}
              </Link>
              <a href="#" className="block hover:text-[#b07a87] transition-colors">
                {t("footer.termsOfUse")}
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white/90 font-medium text-sm tracking-wider mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px' }}>
              {t("footer.contactTitle")}
            </h4>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-[#b07a87]" />
                <span>
                  {t("footer.address")}
                  <br />
                  {t("footer.city")}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#b07a87]" />
                <span>{t("footer.phone")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#b07a87]" />
                <span>{t("footer.email")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#b07a87]" />
                <span>{t("footer.workHours")}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Newsletter */}
        <div className="border-t border-white/10 pt-10 pb-10">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="text-white/90 font-medium text-lg mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("footer.newsletter")}</h4>
            <p className="text-white/40 text-sm mb-4">{t("footer.newsletterText")}</p>
            <form onSubmit={handleFooterSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                className="flex-1 bg-white/10 border border-white/10 rounded-full px-5 py-2.5 text-white placeholder-white/40 text-sm focus:border-[#8c4a5a] focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={footerStatus === "loading"}
                className="bg-[#8c4a5a] hover:bg-[#6e3848] text-white px-5 py-2.5 rounded-full font-medium transition-colors flex items-center gap-2 text-sm disabled:opacity-60"
              >
                {footerStatus === "loading" ? "..." : t("footer.subscribe")}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            {footerStatus !== "idle" && footerStatus !== "loading" && (
              <p className={`mt-2 text-sm ${footerStatus === "success" ? "text-green-400" : "text-red-400"}`}>{footerMessage}</p>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-white/40">{t("footer.copyright")}</span>
          <div className="flex items-center gap-4 text-xs">
            <span className="px-3 py-1 bg-white/5 rounded border border-white/10">Visa</span>
            <span className="px-3 py-1 bg-white/5 rounded border border-white/10">Mastercard</span>
            <span className="px-3 py-1 bg-white/5 rounded border border-white/10">PayPal</span>
            <span className="px-3 py-1 bg-white/5 rounded border border-white/10">Pouzeće</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
