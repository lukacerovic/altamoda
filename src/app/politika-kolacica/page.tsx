import type { Metadata } from "next";
import { Cookie, ListChecks, Settings2, Clock, Globe, Info, RefreshCcw, Mail } from "lucide-react";
import CookieSettingsLink from "@/components/CookieSettingsLink";

export const metadata: Metadata = {
  title: "Politika kolačića | Alta Moda",
  description:
    "Kako altamoda.rs koristi kolačiće i lokalno skladište pregledača, koje kategorije postoje i kako možete da upravljate svojim izborom.",
};

/**
 * "Politika kolačića" — text supplied by the client (Oct 2026). The cookie
 * list reflects what the site actually sets today: NextAuth session cookies
 * plus localStorage keys. No analytics or marketing tools are active yet; when
 * GA / Meta Pixel are added, add their cookies to COOKIES and gate them behind
 * the matching consent category in CookieConsent.
 */

const LAST_UPDATED = "22. oktobar 2026.";

const COOKIES: Array<{ name: string; type: string; purpose: string; duration: string }> = [
  {
    name: "authjs.session-token",
    type: "Kolačić (altamoda.rs)",
    purpose: "Održava prijavu na korisnički nalog.",
    duration: "24 sata",
  },
  {
    name: "authjs.csrf-token",
    type: "Kolačić (altamoda.rs)",
    purpose: "Bezbednosna zaštita formulara za prijavu (CSRF).",
    duration: "Sesija",
  },
  {
    name: "authjs.callback-url",
    type: "Kolačić (altamoda.rs)",
    purpose: "Pamti stranicu na koju se vraćate posle prijave.",
    duration: "Sesija",
  },
  {
    name: "altamoda-cart, altamoda-cart-owner",
    type: "Lokalno skladište",
    purpose: "Čuva sadržaj korpe i vezuje je za prijavljeni nalog.",
    duration: "Dok ga ne obrišete",
  },
  {
    name: "altamoda-checkout-draft",
    type: "Lokalno skladište",
    purpose: "Čuva unete podatke za poručivanje dok ne završite porudžbinu.",
    duration: "Do završetka porudžbine ili odjave",
  },
  {
    name: "altamoda-wishlist",
    type: "Lokalno skladište",
    purpose: "Čuva listu želja.",
    duration: "Dok ga ne obrišete",
  },
  {
    name: "altamoda_language",
    type: "Lokalno skladište",
    purpose: "Pamti izabrani jezik sajta.",
    duration: "Dok ga ne obrišete",
  },
  {
    name: "altamoda_cookie_consent",
    type: "Lokalno skladište",
    purpose: "Pamti vaš izbor u vezi sa kolačićima.",
    duration: "Dok ga ne obrišete",
  },
  {
    name: "altamoda-newsletter-seen",
    type: "Lokalno skladište",
    purpose: "Pamti da ste zatvorili prozor za prijavu na newsletter, da se ne bi ponovo prikazivao.",
    duration: "Dok ga ne obrišete",
  },
  {
    name: "recentColors",
    type: "Lokalno skladište",
    purpose: "Pamti nijanse koje ste nedavno pregledali na stranici boja.",
    duration: "Dok ga ne obrišete",
  },
];

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Cookie;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-[#1a1c1e] mb-3 flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#edb4bd]" />
        {title}
      </h2>
      <div className="space-y-3 text-sm text-[#1a1c1e] leading-relaxed">{children}</div>
    </section>
  );
}

export default function PolitikaKolacicaPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Cookie className="w-12 h-12 text-[#edb4bd] mx-auto mb-4" />
          <h1
            className="text-3xl md:text-4xl font-bold text-[#1a1c1e] mb-3"
            style={{ fontFamily: "'Noto Serif', serif" }}
          >
            Politika kolačića
          </h1>
          <p className="text-xs text-[#1a1c1e]/60">Poslednje ažuriranje: {LAST_UPDATED}</p>
        </div>

        <Section icon={Info} title="O ovoj politici">
          <p>
            Ova politika objašnjava kako Alta Moda d.o.o., Cara Dušana 45, lokal J, 36000 Kraljevo,
            Srbija (ogranak Beograd: Mihizova 9/L3, 11000 Beograd), koristi kolačiće i slične
            tehnologije na internet stranici <strong>www.altamoda.rs</strong> i kako možete upravljati
            svojim izborima.
          </p>
        </Section>

        <Section icon={Cookie} title="Šta su kolačići?">
          <p>
            Kolačići su male tekstualne datoteke koje se čuvaju na vašem računaru, mobilnom telefonu
            ili drugom uređaju prilikom posete internet stranici. Omogućavaju funkcionisanje sajta,
            pamćenje određenih izbora i, uz odgovarajući pristanak, analizu posećenosti i oglašavanje.
          </p>
          <p>
            Slična tehnologija je lokalno skladište pregledača (localStorage), u kome sajt na vašem
            uređaju čuva podatke kao što su sadržaj korpe ili izabrani jezik. Ti podaci se ne šalju
            automatski uz svaki zahtev ka serveru.
          </p>
        </Section>

        <Section icon={ListChecks} title="Koje kolačiće koristimo?">
          <h3 className="font-semibold">Neophodni kolačići</h3>
          <p>
            Ovi kolačići omogućavaju osnovne funkcije internet prodavnice, poput održavanja korisničke
            sesije, pamćenja sadržaja korpe i bezbednog korišćenja sajta. Za kolačiće koji su strogo
            neophodni za pružanje usluge koju ste zatražili ne tražimo pristanak.
          </p>
          <h3 className="font-semibold pt-2">Opcioni kolačići</h3>
          <p>
            Opcioni kolačići mogu obuhvatati analitičke kolačiće, koji nam pomažu da razumemo
            posećenost i način korišćenja sajta, i marketinške kolačiće, koji služe za merenje
            uspešnosti oglašavanja i prikazivanje oglasa prilagođenih vašim interesovanjima.
          </p>
          <p>
            <strong>Sajt trenutno ne koristi opcione kolačiće.</strong> Ako ih uvedemo, dopunićemo
            spisak ispod i koristićemo ih samo uz vaš prethodni pristanak.
          </p>
        </Section>

        <Section icon={ListChecks} title="Spisak kolačića">
          <p>Svi kolačići i podaci navedeni ispod su neophodni i postavlja ih sam sajt altamoda.rs.</p>
          <div className="overflow-x-auto border border-[#dddbd9] rounded-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f6f5f4]">
                <tr>
                  <th className="p-3 font-semibold">Naziv</th>
                  <th className="p-3 font-semibold">Vrsta</th>
                  <th className="p-3 font-semibold">Svrha</th>
                  <th className="p-3 font-semibold">Trajanje</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c) => (
                  <tr key={c.name} className="border-t border-[#dddbd9] align-top">
                    <td className="p-3 font-mono break-all">{c.name}</td>
                    <td className="p-3">{c.type}</td>
                    <td className="p-3">{c.purpose}</td>
                    <td className="p-3">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#1a1c1e]/60">
            Na produkcionom sajtu nazivi kolačića za prijavu imaju bezbednosni prefiks (__Secure- ili
            __Host-).
          </p>
        </Section>

        <Section icon={Settings2} title="Kako da upravljate kolačićima?">
          <p>Prilikom prve posete sajtu, putem obaveštenja o kolačićima možete:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>prihvatiti sve kolačiće;</li>
            <li>odbiti sve opcione kolačiće;</li>
            <li>izabrati kategorije kolačića koje želite da dozvolite.</li>
          </ul>
          <p>
            Opcioni kolačići ostaju isključeni dok ih ne odobrite. Nastavak pregledanja sajta,
            zatvaranje obaveštenja ili nepreduzimanje radnje ne smatraju se pristankom.
          </p>
          <p>
            Svoj izbor možete u svakom trenutku promeniti ili povući pristanak putem opcije{" "}
            <CookieSettingsLink className="text-[#edb4bd] hover:underline">
              „Podešavanja kolačića“
            </CookieSettingsLink>{" "}
            u podnožju sajta. Povlačenje pristanka ne utiče na zakonitost obrade izvršene pre
            povlačenja.
          </p>
          <p>
            Ako odbijete opcione kolačiće, i dalje možete koristiti osnovne funkcije internet
            prodavnice. Pojedini dodatni sadržaji i mogućnosti mogu biti nedostupni dok ne odobrite
            odgovarajuću kategoriju.
          </p>
        </Section>

        <Section icon={Clock} title="Koliko dugo se kolačići čuvaju?">
          <p>
            Sesijski kolačići čuvaju se tokom korisničke sesije i po pravilu se brišu nakon njenog
            završetka. Trajni kolačići ostaju na uređaju do isteka roka trajanja ili dok ih ne
            obrišete.
          </p>
          <p>
            Tačni rokovi trajanja navedeni su u spisku kolačića. Rok čuvanja podataka prikupljenih
            putem kolačića može se razlikovati od trajanja samog kolačića.
          </p>
        </Section>

        <Section icon={Globe} title="Kolačići i usluge trećih lica">
          <p>
            Sajt trenutno ne koristi spoljne usluge za analitiku, oglašavanje ili prikazivanje
            dodatnih sadržaja koje bi postavljale kolačiće na altamoda.rs. Ako takve usluge uvedemo,
            ovde ćemo navesti njihove pružaoce, svrhe korišćenja i linkove ka njihovim politikama
            privatnosti.
          </p>
          <p>
            Plaćanje platnim karticama obavlja se na zaštićenoj stranici banke (UniCredit Bank Srbija
            a.d., uz procesora Nexi). Ta stranica može postavljati sopstvene kolačiće neophodne za
            bezbedno izvršenje plaćanja, u skladu sa politikama banke.
          </p>
          <p>
            Više informacija o obradi podataka o ličnosti i vašim pravima dostupno je u{" "}
            <a href="/faq#privatnost" className="text-[#edb4bd] hover:underline">
              Politici privatnosti
            </a>
            .
          </p>
        </Section>

        <Section icon={Settings2} title="Podešavanja internet pregledača">
          <p>
            Kolačiće možete obrisati ili blokirati i putem podešavanja internet pregledača. Uputstva su
            dostupna u odeljku za pomoć pregledača koji koristite.
          </p>
          <p>
            Blokiranje neophodnih kolačića može otežati prijavljivanje na nalog, korišćenje korpe ili
            druge osnovne funkcije sajta. Brisanje kolačića može ukloniti i sačuvana podešavanja, pa
            ćete pri sledećoj poseti možda ponovo birati koje kolačiće dozvoljavate.
          </p>
        </Section>

        <Section icon={RefreshCcw} title="Izmene politike">
          <p>
            Ovu politiku ažuriramo kada se promeni način korišćenja kolačića na sajtu. Važeća verzija
            biće dostupna na ovoj stranici, uz datum poslednjeg ažuriranja.
          </p>
          <p>
            Ako uvedemo nove svrhe korišćenja za koje je potreban pristanak, zatražićemo ga pre njihove
            aktivacije.
          </p>
        </Section>

        <Section icon={Mail} title="Kontakt">
          <p>Za pitanja o ovoj politici i korišćenju kolačića možete nam se obratiti:</p>
          <ul className="list-none space-y-1">
            <li><strong>Alta Moda d.o.o.</strong></li>
            <li>Mihizova 9/L3, 11000 Beograd, Srbija</li>
            <li>
              E-mail:{" "}
              <a href="mailto:kontakt@altamoda.rs" className="text-[#edb4bd] hover:underline">
                kontakt@altamoda.rs
              </a>
            </li>
            <li>Internet stranica: www.altamoda.rs</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
