"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Mail,
  Phone,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Each top-level section has a stable `slug` used as the in-page anchor id.
 * Footer links such as `/faq#dostava` rely on these slugs being unique and
 * URL-safe; do not rename them without updating the Footer too.
 *
 * `q` is the visible heading on the collapsed row, `a` is the body. `a`
 * supports multi-paragraph content via `\n\n` separators and bullet lists
 * via lines starting with `• `.
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

const faqItemsData: FaqSection[] = [
  {
    slug: "porudzbine",
    titleKey: "faq.catOrders",
    items: [
      { q: "Koliko traje dostava?", a: "Standardna dostava traje 1-3 radna dana za teritoriju Srbije. Za Beograd je moguća dostava narednog radnog dana za porudžbine primljene do 14h." },
      { q: "Koliko košta dostava?", a: "Dostava je besplatna za sve porudžbine iznad 5.000 RSD. Za porudžbine manje vrednosti, cena dostave iznosi 350 RSD." },
      { q: "Kako mogu pratiti svoju porudžbinu?", a: "Nakon slanja porudžbine, dobićete email sa tracking brojem i linkom za praćenje. Status porudžbine možete pratiti i na svom nalogu u sekciji 'Porudžbine'." },
      { q: "Mogu li promeniti adresu dostave nakon naručivanja?", a: "Da, ukoliko porudžbina još nije poslata, kontaktirajte nas putem telefona ili emaila i promenićemo adresu dostave." },
      { q: "Da li vršite dostavu van Srbije?", a: "Trenutno vršimo dostavu samo na teritoriji Republike Srbije. Za porudžbine iz inostranstva, kontaktirajte nas direktno." },
    ],
  },
  {
    slug: "placanje",
    titleKey: "faq.catPayment",
    items: [
      { q: "Koji načini plaćanja su dostupni?", a: "Prihvatamo platne kartice (Visa, Mastercard, Maestro, Dina), plaćanje pouzećem, kao i plaćanje putem fakture za B2B korisnike." },
      { q: "Da li je online plaćanje sigurno?", a: "Apsolutno. Koristimo SSL enkripciju i sertifikovane payment gateway sisteme. Vaši podaci o kartici nikada ne prolaze kroz naš server." },
      { q: "Mogu li platiti na rate?", a: "Da, za porudžbine iznad 10.000 RSD nudimo mogućnost plaćanja na 2-6 rata bez kamate za odabrane kartice." },
      { q: "Kada se vrši naplata sa kartice?", a: "Naplata se vrši u momentu potvrde porudžbine. U slučaju otkazivanja, refundacija se vrši u roku od 3-5 radnih dana." },
    ],
  },
  {
    slug: "b2b",
    titleKey: "faq.catB2B",
    items: [
      { q: "Kako se registrovati kao B2B korisnik?", a: "Kliknite na 'B2B Registracija' i popunite formular sa podacima o vašem salonu (PIB, matični broj, adresa). Naš tim će pregledati i odobriti vaš nalog u roku od 24h." },
      { q: "Koje su prednosti B2B programa?", a: "B2B korisnici imaju pristup posebnim cenama, rabatnim skalama, ekskluzivnim profesionalnim proizvodima, mogućnosti naručivanja po fakturi i loyalty programu." },
      { q: "Da li postoji minimalan iznos porudžbine za B2B?", a: "Da, minimalan iznos B2B porudžbine je 10.000 RSD. Ovo omogućava optimizaciju logistike i održavanje posebnih cena." },
      { q: "Kako funkcioniše plaćanje po fakturi?", a: "B2B korisnici sa odobrenim kreditnim limitom mogu naručivati sa odloženim plaćanjem. Rok plaćanja je 15-30 dana u zavisnosti od ugovora." },
    ],
  },
  {
    slug: "proizvodi",
    titleKey: "faq.catProducts",
    items: [
      { q: "Da li su svi proizvodi originalni?", a: "Da, svi naši proizvodi su 100% originalni i nabavljeni direktno od ovlašćenih distributera. Garantujemo autentičnost svakog proizvoda." },
      { q: "Koji je rok trajanja proizvoda?", a: "Svi proizvodi imaju minimalno 12 meseci do isteka roka trajanja u momentu isporuke. Rok trajanja je jasno naznačen na pakovanju." },
      { q: "Kako da odaberem pravi proizvod za svoj tip kose?", a: "Koristite naše filtere za tip kose pri pretrazi proizvoda. Takođe, naš blog sadrži vodiče za odabir proizvoda. Za personalizovane preporuke, kontaktirajte nas." },
    ],
  },
  // ── Policy sections (footer deep-links) ──────────────────────────────
  {
    slug: "dostava",
    titleKey: "faq.catShipping",
    items: [
      {
        q: "Dostava i isporuka",
        a: "Porudžbine se obrađuju u najkraćem mogućem roku nakon potvrde kupovine. Isporuka se vrši putem kurirske službe na adresu koju ste naveli prilikom poručivanja.",
      },
      {
        q: "Rok isporuke",
        a: "Rok isporuke je obično od 1 do 3 radna dana, u zavisnosti od lokacije i trenutnog opterećenja kurirske službe.",
      },
      {
        q: "Troškovi dostave",
        a: "Troškovi dostave prikazani su prilikom završetka kupovine.\n\nZa porudžbine iznad određenog iznosa, dostava može biti besplatna u skladu sa aktuelnim uslovima na sajtu.",
      },
      {
        q: "Napomena",
        a: "Alta Moda ulaže maksimalan napor da sve porudžbine budu isporučene u predviđenim rokovima.\n\nRokovi isporuke su okvirni i mogu varirati u zavisnosti od rada kurirske službe i okolnosti na koje ne možemo direktno uticati.\n\nU slučaju eventualnih kašnjenja, kupac će biti obavešten u najkraćem mogućem roku.",
      },
    ],
  },
  {
    slug: "reklamacije",
    titleKey: "faq.catComplaints",
    items: [
      {
        q: "Pravo na reklamaciju",
        a: "Kupac ima pravo na reklamaciju u skladu sa važećim zakonima Republike Srbije.\n\nU slučaju da proizvod ima nedostatak ili ne odgovara opisu, kupac ima pravo da podnese reklamaciju.",
      },
      {
        q: "Način podnošenja reklamacije",
        a: "Reklamacija se podnosi putem email adrese ili telefona uz dostavljanje:\n• broja porudžbine\n• opisa problema\n• fotografije proizvoda (po potrebi)",
      },
      {
        q: "Rok za odgovor",
        a: "Na reklamaciju odgovaramo u najkraćem mogućem roku, a najkasnije u zakonskom roku.",
      },
      {
        q: "Povraćaj robe",
        a: "Kupac ima pravo na odustanak od kupovine u roku od 14 dana od prijema proizvoda, bez navođenja razloga.\n\nProizvod mora biti:\n• nekorišćen\n• neoštećen\n• u originalnom pakovanju\n\nTroškove povraćaja snosi kupac, osim u slučaju opravdane reklamacije.",
      },
      {
        q: "Povraćaj sredstava",
        a: "U slučaju prihvaćenog povraćaja, sredstva se vraćaju kupcu u zakonskom roku, na isti način na koji je izvršeno plaćanje, osim ako nije drugačije dogovoreno.",
      },
    ],
  },
  {
    slug: "privatnost",
    titleKey: "faq.catPrivacy",
    items: [
      {
        q: "Prikupljanje podataka",
        a: "Alta Moda doo se obavezuje da štiti privatnost svih korisnika sajta.\n\nPrikupljamo samo neophodne podatke za obradu porudžbine i komunikaciju sa korisnicima, kao što su:\n• ime i prezime\n• email adresa\n• broj telefona\n• adresa za isporuku",
      },
      {
        q: "Svrha obrade",
        a: "Podaci se koriste isključivo za:\n• realizaciju porudžbine\n• komunikaciju sa korisnicima\n• slanje newsletter komunikacije (uz saglasnost)",
      },
      {
        q: "Zaštita podataka",
        a: "Vaši podaci su zaštićeni i čuvaju se u skladu sa važećim propisima.",
      },
      {
        q: "Deljenje podataka",
        a: "Podaci se ne prosleđuju trećim licima, osim u slučaju kada je to neophodno za realizaciju isporuke (kurirske službe).",
      },
      {
        q: "Prava korisnika",
        a: "Korisnik ima pravo da:\n• zatraži uvid u svoje podatke\n• zatraži ispravku ili brisanje podataka\n• povuče saglasnost za obradu podataka\n\nZa sva pitanja u vezi sa privatnošću, korisnik nas može kontaktirati putem dostupnih kontakt podataka.",
      },
    ],
  },
  {
    slug: "uslovi",
    titleKey: "faq.catTerms",
    items: [
      {
        q: "Opšte odredbe",
        a: "Korišćenjem ovog sajta prihvatate navedene uslove korišćenja.\n\nSajt altamoda.rs namenjen je kupovini proizvoda i informisanju o uslugama i edukacijama.",
      },
      {
        q: "Tačnost informacija",
        a: "Alta Moda nastoji da sve informacije na sajtu budu tačne i ažurne, ali ne može garantovati potpunu bezgrešnost sadržaja.",
      },
      {
        q: "Cene i dostupnost",
        a: "Sve cene prikazane su u dinarima i mogu biti podložne promenama bez prethodne najave.\n\nDostupnost proizvoda može varirati.",
      },
      {
        q: "Odgovornost",
        a: "Alta Moda ne snosi odgovornost za eventualne tehničke greške, prekide u radu sajta ili druge okolnosti van svoje kontrole.",
      },
      {
        q: "Izmene uslova",
        a: "Zadržavamo pravo izmene uslova korišćenja u bilo kom trenutku.",
      },
    ],
  },
];

/** Render a single answer block, splitting on `\n\n` for paragraphs and on
 *  `\n• ` for bullet items. Keeps the structure simple so the answer string
 *  remains a plain literal that translators can edit. */
function renderAnswer(text: string) {
  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm text-[#837A64] leading-relaxed">
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
    items: section.items,
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
      setOpenItems(new Set(section.items.map((_, idx) => `${section.titleKey}-${idx}`)));
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
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <HelpCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-[#2e2e2e] mb-3" style={{ fontFamily: "'Noto Serif', serif" }}>
            {t("faq.title")}
          </h1>
          <p className="text-[#837A64]">{t("faq.subtitle")}</p>
        </div>

        {/* Search */}
        <div className="relative mb-10">
          <input
            type="text"
            placeholder={t("faq.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-[#D8CFBC] rounded-sm text-sm shadow-sm focus:border-black focus:shadow-md transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#837A64]" />
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
              <h2 className="text-lg font-semibold text-[#2e2e2e] mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-black rounded-full" />
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.items.map((item, idx) => {
                  const key = `${section.title}-${idx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key} className="bg-white rounded-sm border border-[#D8CFBC]/50 overflow-hidden">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#FFFFFF] transition-colors"
                      >
                        <span className="text-sm font-medium text-[#2e2e2e] pr-4">{item.q}</span>
                        <ChevronDown className={`w-5 h-5 text-secondary flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
        <div className="mt-16 bg-white rounded-sm border border-[#D8CFBC] p-8 text-center">
          <h3 className="text-xl font-bold text-[#2e2e2e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>{t("faq.notFoundTitle")}</h3>
          <p className="text-[#837A64] mb-6">{t("faq.notFoundDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+381113088388" className="flex items-center justify-center gap-2 px-6 py-3 border border-[#D8CFBC] rounded-sm text-sm font-medium text-[#2e2e2e] hover:border-black hover:text-secondary transition-colors">
              <Phone className="w-4 h-4" /> +381 (0)11 3088388
            </a>
            <a href="mailto:kontakt@altamoda.rs" className="flex items-center justify-center gap-2 px-6 py-3 border border-[#D8CFBC] rounded-sm text-sm font-medium text-[#2e2e2e] hover:border-black hover:text-secondary transition-colors">
              <Mail className="w-4 h-4" /> kontakt@altamoda.rs
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
