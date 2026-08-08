"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Mail,
  Phone,
  Home,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Each top-level section has a stable `slug` used as the in-page anchor id.
 * Footer links such as `/faq#dostava` rely on these slugs being unique and
 * URL-safe; do not rename them without updating the Footer too.
 *
 * All copy lives in the i18n JSONs (`faq.*`) so the Help Centre is fully
 * translatable. Answers support multi-paragraph content via `\n\n`
 * separators and bullet lists via lines starting with `• `.
 */
interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  slug: string;
  titleKey: string;
  items: FaqItem[];
}

/** Build `{q: "<prefix>.qN", a: "<prefix>.aN"}` key pairs for a section. */
function qa(prefix: string, count: number): FaqItem[] {
  return Array.from({ length: count }, (_, i) => ({
    q: `${prefix}.q${i + 1}`,
    a: `${prefix}.a${i + 1}`,
  }));
}

const faqItemsData: FaqSection[] = [
  { slug: "porudzbine", titleKey: "faq.catOrders", items: qa("faq.orders", 5) },
  { slug: "placanje", titleKey: "faq.catPayment", items: qa("faq.payment", 3) },
  { slug: "dostava", titleKey: "faq.catShipping", items: qa("faq.shipping", 7) },
  { slug: "reklamacije", titleKey: "faq.catComplaints", items: qa("faq.returns", 5) },
  { slug: "proizvodi", titleKey: "faq.catProducts", items: qa("faq.productsFaq", 5) },
  { slug: "garancija", titleKey: "faq.catGuarantee", items: qa("faq.guarantee", 1) },
  { slug: "b2b", titleKey: "faq.catB2B", items: qa("faq.b2bFaq", 5) },
  { slug: "kupovina", titleKey: "faq.catShopping", items: qa("faq.shopInfo", 4) },
  { slug: "privatnost", titleKey: "faq.catPrivacy", items: qa("faq.privacy", 5) },
  { slug: "uslovi", titleKey: "faq.catTerms", items: qa("faq.terms", 5) },
];

/** Render a single answer block, splitting on `\n\n` for paragraphs and on
 *  `\n• ` for bullet items. Keeps the structure simple so the answer string
 *  remains a plain literal that translators can edit. */
function renderAnswer(text: string) {
  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm text-[#1a1c1e] leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const bulletLines = lines.filter((l) => l.trim().startsWith("• "));
        if (bulletLines.length > 0 && bulletLines.length === lines.filter((l) => l.trim()).length) {
          // pure bullet list
          return (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {bulletLines.map((l, j) => (
                <li key={j}>{l.replace(/^•\s*/, "")}</li>
              ))}
            </ul>
          );
        }
        if (bulletLines.length > 0) {
          // mixed: prose lines until first bullet, then list
          const firstBulletIdx = lines.findIndex((l) => l.trim().startsWith("• "));
          const intro = lines.slice(0, firstBulletIdx).join(" ").trim();
          const bullets = lines.slice(firstBulletIdx).filter((l) => l.trim().startsWith("• "));
          return (
            <div key={i}>
              {intro && <p className="mb-2">{intro}</p>}
              <ul className="list-disc pl-5 space-y-1">
                {bullets.map((l, j) => (
                  <li key={j}>{l.replace(/^•\s*/, "")}</li>
                ))}
              </ul>
            </div>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}

export default function FAQPage() {
  const { t } = useLanguage();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const faqSections = faqItemsData.map((section) => ({
    slug: section.slug,
    title: t(section.titleKey),
    items: section.items.map((item) => ({ q: t(item.q), a: t(item.a) })),
  }));

  const toggleItem = (key: string) => {
    const next = new Set(openItems);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpenItems(next);
  };

  // Honour `#slug` deep-links from the footer: scroll into view, expand all
  // items in that section, and clear the search.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const section = faqItemsData.find((s) => s.slug === hash);
      if (!section) return;
      setSearchQuery("");
      setOpenItems(new Set(section.items.map((_, idx) => `${section.slug}-${idx}`)));
      // Defer scroll until after expansion paints.
      requestAnimationFrame(() => {
        const el = sectionRefs.current[hash];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const filteredSections = searchQuery
    ? faqSections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.a.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : faqSections;

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#1a1c1e] mb-8">
          <Link href="/" className="hover:text-[#edb4bd]">{t("faq.home")}</Link>
          <span>/</span>
          <span>{t("faq.title")}</span>
        </nav>

        {/* Title */}
        <div className="text-center mb-10">
          <HelpCircle className="w-12 h-12 text-[#edb4bd] mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1c1e] mb-3" style={{ fontFamily: "'Noto Serif', serif" }}>
            {t("faq.title")}
          </h1>
          <p className="text-[#1a1c1e]">{t("faq.subtitle")}</p>
        </div>

        {/* Search */}
        <div className="relative mb-10">
          <input
            type="text"
            placeholder={t("faq.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-[#dddbd9] rounded-sm text-sm shadow-sm focus:border-black focus:shadow-md transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1c1e]" />
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {filteredSections.map((section) => (
            <div
              key={section.title}
              id={section.slug}
              ref={(el) => {
                sectionRefs.current[section.slug] = el;
              }}
              className="scroll-mt-24"
            >
              <h2 className="text-lg font-semibold text-[#1a1c1e] mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-black rounded-full" />
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.items.map((item, idx) => {
                  const key = `${section.slug}-${idx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key} className="bg-white rounded-sm border border-[#dddbd9]/50 overflow-hidden">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#FFFFFF] transition-colors"
                      >
                        <span className="text-sm font-medium text-[#1a1c1e] pr-4">{item.q}</span>
                        <ChevronDown className={`w-5 h-5 text-[#edb4bd] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 animate-slideDown">
                          {renderAnswer(item.a)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-white rounded-sm border border-[#dddbd9] p-8 text-center">
          <h3 className="text-xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>{t("faq.notFoundTitle")}</h3>
          <p className="text-[#1a1c1e] mb-6">{t("faq.notFoundDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+381113088388" className="flex items-center justify-center gap-2 px-6 py-3 border border-[#dddbd9] rounded-sm text-sm font-medium text-[#1a1c1e] hover:border-black hover:text-[#edb4bd] transition-colors">
              <Phone className="w-4 h-4" /> +381 (0)11 3088388
            </a>
            <a href="mailto:kontakt@altamoda.rs" className="flex items-center justify-center gap-2 px-6 py-3 border border-[#dddbd9] rounded-sm text-sm font-medium text-[#1a1c1e] hover:border-black hover:text-[#edb4bd] transition-colors">
              <Mail className="w-4 h-4" /> kontakt@altamoda.rs
            </a>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#edb4bd] hover:bg-[#413d3a] text-white text-sm font-medium rounded-sm transition-colors"
          >
            <Home className="w-4 h-4" /> {t("faq.backToHome")}
          </Link>
        </div>
      </div>

    </div>
  );
}
