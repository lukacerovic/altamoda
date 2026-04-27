"use client";

import { useState } from "react";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Mail,
  Phone,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const faqItemsData = [
  {
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
    titleKey: "faq.catPayment",
    items: [
      { q: "Koji načini plaćanja su dostupni?", a: "Prihvatamo platne kartice (Visa, Mastercard, Maestro, Dina), plaćanje pouzećem, kao i plaćanje putem fakture za B2B korisnike." },
      { q: "Da li je online plaćanje sigurno?", a: "Apsolutno. Koristimo SSL enkripciju i sertifikovane payment gateway sisteme. Vaši podaci o kartici nikada ne prolaze kroz naš server." },
      { q: "Mogu li platiti na rate?", a: "Da, za porudžbine iznad 10.000 RSD nudimo mogućnost plaćanja na 2-6 rata bez kamate za odabrane kartice." },
      { q: "Kada se vrši naplata sa kartice?", a: "Naplata se vrši u momentu potvrde porudžbine. U slučaju otkazivanja, refundacija se vrši u roku od 3-5 radnih dana." },
    ],
  },
  {
    titleKey: "faq.catB2B",
    items: [
      { q: "Kako se registrovati kao B2B korisnik?", a: "Kliknite na 'B2B Registracija' i popunite formular sa podacima o vašem salonu (PIB, matični broj, adresa). Naš tim će pregledati i odobriti vaš nalog u roku od 24h." },
      { q: "Koje su prednosti B2B programa?", a: "B2B korisnici imaju pristup posebnim cenama, rabatnim skalama, ekskluzivnim profesionalnim proizvodima, mogućnosti naručivanja po fakturi i loyalty programu." },
      { q: "Da li postoji minimalan iznos porudžbine za B2B?", a: "Da, minimalan iznos B2B porudžbine je 10.000 RSD. Ovo omogućava optimizaciju logistike i održavanje posebnih cena." },
      { q: "Kako funkcioniše plaćanje po fakturi?", a: "B2B korisnici sa odobrenim kreditnim limitom mogu naručivati sa odloženim plaćanjem. Rok plaćanja je 15-30 dana u zavisnosti od ugovora." },
    ],
  },
  {
    titleKey: "faq.catProducts",
    items: [
      { q: "Da li su svi proizvodi originalni?", a: "Da, svi naši proizvodi su 100% originalni i nabavljeni direktno od ovlašćenih distributera. Garantujemo autentičnost svakog proizvoda." },
      { q: "Koji je rok trajanja proizvoda?", a: "Svi proizvodi imaju minimalno 12 meseci do isteka roka trajanja u momentu isporuke. Rok trajanja je jasno naznačen na pakovanju." },
      { q: "Kako da odaberem pravi proizvod za svoj tip kose?", a: "Koristite naše filtere za tip kose pri pretrazi proizvoda. Takođe, naš blog sadrži vodiče za odabir proizvoda. Za personalizovane preporuke, kontaktirajte nas." },
    ],
  },
  {
    titleKey: "faq.catReturns",
    items: [
      { q: "Kakva je politika povrata?", a: "Imate pravo na povrat neotvorenog proizvoda u roku od 14 dana od prijema. Proizvod mora biti u originalnom pakovanju, neoštećen i nekorišćen." },
      { q: "Kako pokrenuti povrat?", a: "Kontaktirajte nas putem emaila na reklamacije@altamoda.rs ili pozovite +381 11 123 4567. Naš tim će vam dati instrukcije za povrat." },
      { q: "Koliko traje refundacija?", a: "Nakon prijema vraćenog proizvoda, refundacija se procesira u roku od 5-7 radnih dana na isti način plaćanja koji ste koristili pri kupovini." },
    ],
  },
];

export default function FAQPage() {
  const { t } = useLanguage();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const faqSections = faqItemsData.map((section) => ({
    title: t(section.titleKey),
    items: section.items,
  }));

  const toggleItem = (key: string) => {
    const next = new Set(openItems);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpenItems(next);
  };

  const filteredSections = searchQuery
    ? faqSections.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((section) => section.items.length > 0)
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
          <p className="text-[#293133]/65">{t("faq.subtitle")}</p>
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#293133]/65" />
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {filteredSections.map((section) => (
            <div key={section.title}>
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
                          <p className="text-sm text-[#293133]/65 leading-relaxed">{item.a}</p>
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
          <p className="text-[#293133]/65 mb-6">{t("faq.notFoundDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+381111234567" className="flex items-center justify-center gap-2 px-6 py-3 border border-[#D8CFBC] rounded-sm text-sm font-medium text-[#2e2e2e] hover:border-black hover:text-secondary transition-colors">
              <Phone className="w-4 h-4" /> +381 11 123 4567
            </a>
            <a href="mailto:info@altamoda.rs" className="flex items-center justify-center gap-2 px-6 py-3 border border-[#D8CFBC] rounded-sm text-sm font-medium text-[#2e2e2e] hover:border-black hover:text-secondary transition-colors">
              <Mail className="w-4 h-4" /> info@altamoda.rs
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
