import type { Metadata } from "next";
import PaymentLogos from "@/components/PaymentLogos";
import { Shield, CreditCard, RefreshCcw, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Uslovi korišćenja i plaćanja | Alta Moda",
  description:
    "Uslovi korišćenja sajta i plaćanja platnim karticama na altamoda.rs — prihvaćene kartice, sigurnost (3-D Secure), valuta, izjava o konverziji, povraćaj sredstava i zaštita podataka.",
};

/**
 * "Uslovi korišćenja i plaćanja" — required by the acquirer (UniCredit Bank
 * Srbija / Nexi-SIA VPOS) before go-live. Contains the merchant identification,
 * accepted card branding, the standard NBS conversion statement, the 3-D Secure
 * data-protection statement, refund policy, and the payment logos. Content is in
 * Serbian to match the rest of the storefront (see /faq).
 */

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield;
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

export default function UsloviPlacanjaPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <CreditCard className="w-12 h-12 text-[#edb4bd] mx-auto mb-4" />
          <h1
            className="text-3xl md:text-4xl font-bold text-[#1a1c1e] mb-3"
            style={{ fontFamily: "'Noto Serif', serif" }}
          >
            Uslovi korišćenja i plaćanja
          </h1>
          <p className="text-[#1a1c1e]">
            Molimo Vas da pažljivo pročitate uslove korišćenja sajta i plaćanja pre
            kupovine.
          </p>
        </div>

        <Section icon={Shield} title="Podaci o prodavcu">
          <p>
            Prodavac i vlasnik internet prodavnice <strong>altamoda.rs</strong> je:
          </p>
          <ul className="list-none space-y-1">
            <li><strong>Alta Moda d.o.o.</strong></li>
            <li>Mihizova 9/L3, 11000 Beograd, Republika Srbija</li>
            <li>PIB: 101773967</li>
            <li>
              Email:{" "}
              <a href="mailto:kontakt@altamoda.rs" className="text-[#edb4bd] hover:underline">
                kontakt@altamoda.rs
              </a>
            </li>
            <li>
              Telefon:{" "}
              <a href="tel:+381113088388" className="text-[#edb4bd] hover:underline">
                +381 (0)11 3088388
              </a>
            </li>
          </ul>
        </Section>

        <Section icon={CreditCard} title="Načini plaćanja">
          <p>
            Kupovinu na sajtu možete platiti platnim karticama{" "}
            <strong>Visa, Mastercard i DinaCard</strong>. Plaćanje karticom je
            dostupno svim korisnicima, bez obzira na banku koja je karticu izdala.
          </p>
          <p>
            Cene svih proizvoda iskazane su u dinarima (RSD) sa uračunatim PDV-om.
            Naplata sa kartice vrši se u trenutku potvrde porudžbine.
          </p>
        </Section>

        <Section icon={Lock} title="Sigurnost plaćanja (3-D Secure)">
          <p>
            Plaćanje karticama obavlja se preko sigurne stranice banke. Prilikom
            plaćanja bićete preusmereni na zaštićenu stranicu platnog procesora{" "}
            <strong>UniCredit Bank Srbija a.d. / Nexi (SIA)</strong>, gde unosite
            podatke o kartici.
          </p>
          <p>
            Podaci o Vašoj kartici <strong>nikada ne prolaze kroz naš server</strong> i
            nisu dostupni prodavcu. Prenos podataka zaštićen je SSL enkripcijom, a
            transakcije su dodatno osigurane <strong>3-D Secure</strong> standardom
            (Visa Secure i Mastercard Identity Check), koji potvrđuje identitet
            kupca i sprečava zloupotrebu kartica.
          </p>
        </Section>

        <Section icon={CreditCard} title="Izjava o konverziji">
          <p>
            Sva plaćanja biće izvršena u lokalnoj valuti Republike Srbije — dinar
            (RSD). Za informativni prikaz cena u drugim valutama koristi se srednji
            kurs Narodne banke Srbije.
          </p>
          <p>
            Iznos za koji će biti zadužena Vaša platna kartica biće izražen u Vašoj
            lokalnoj valuti kroz konverziju u istu, po kursu koji koriste
            kartičarske organizacije, a koji nama u trenutku transakcije ne može biti
            poznat. Kao rezultat ove konverzije postoji mogućnost neznatne razlike od
            originalne cene navedene na našem sajtu.
          </p>
        </Section>

        <Section icon={RefreshCcw} title="Povraćaj sredstava">
          <p>
            U slučaju vraćanja robe i povraćaja sredstava kupcu koji je prethodno
            platio nekom od platnih kartica, delimično ili u celosti, a bez obzira na
            razlog vraćanja, <strong>Alta Moda d.o.o.</strong> je u obavezi da
            povraćaj vrši isključivo preko VISA, Mastercard i DinaCard metoda plaćanja.
            To znači da će banka, na zahtev prodavca, izvršiti povraćaj sredstava na
            račun korisnika kartice.
          </p>
          <p>
            Detaljnije uslove povraćaja robe i reklamacija možete pronaći u sekciji{" "}
            <a href="/faq#reklamacije" className="text-[#edb4bd] hover:underline">
              Reklamacije i povraćaj
            </a>
            .
          </p>
        </Section>

        <Section icon={Shield} title="Zaštita podataka o ličnosti">
          <p>
            Alta Moda d.o.o. se obavezuje da prikupljene podatke o kupcima koristi
            isključivo u svrhu realizacije porudžbine i da ih ne čini dostupnim
            trećim licima, osim kada je to neophodno za isporuku (kurirska služba).
            Više informacija dostupno je u našoj{" "}
            <a href="/faq#privatnost" className="text-[#edb4bd] hover:underline">
              Politici privatnosti
            </a>
            .
          </p>
        </Section>

        <Section icon={CreditCard} title="Prihvaćene kartice i sertifikati">
          <p className="mb-2">Na ovom sajtu prihvatamo:</p>
          <PaymentLogos size="md" />
        </Section>

        <p className="text-xs text-[#1a1c1e]/60 mt-12">
          Alta Moda d.o.o. zadržava pravo izmene ovih uslova u bilo kom trenutku.
          Korišćenjem sajta prihvatate navedene uslove korišćenja i plaćanja.
        </p>
      </div>
    </div>
  );
}
