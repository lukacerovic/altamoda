"use client";

import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Instagram,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Facebook,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Youtube,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2d2d2d] text-white/60">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          <div>
            <img src="/logo.png" alt="Alta Moda" className="h-6 brightness-0 invert mb-5" />
            <p className="text-sm leading-relaxed text-white/50">
              Vaš pouzdani partner za profesionalnu frizersku opremu i kozmetiku od 2005. godine.
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
              Kupovina
            </h4>
            <div className="space-y-2.5 text-sm">
              <Link href="/products" className="block hover:text-[#b07a87] transition-colors">
                Svi Proizvodi
              </Link>
              <Link href="/colors" className="block hover:text-[#b07a87] transition-colors">
                Boje za Kosu
              </Link>
              <Link href="/outlet" className="block hover:text-[#b07a87] transition-colors">
                Akcije
              </Link>
              <Link href="/products" className="block hover:text-[#b07a87] transition-colors">
                Brendovi
              </Link>
              <Link href="/quick-order" className="block hover:text-[#b07a87] transition-colors">
                Brza Narudžbina
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-white/90 font-medium text-sm tracking-wider mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px' }}>
              Informacije
            </h4>
            <div className="space-y-2.5 text-sm">
              <Link href="/faq" className="block hover:text-[#b07a87] transition-colors">
                Česta Pitanja
              </Link>
              <Link href="/blog" className="block hover:text-[#b07a87] transition-colors">
                Blog
              </Link>
              <Link href="/seminars" className="block hover:text-[#b07a87] transition-colors">
                Seminari
              </Link>
              <Link href="/salon-locator" className="block hover:text-[#b07a87] transition-colors">
                Pronađi Salon
              </Link>
              <a href="#" className="block hover:text-[#b07a87] transition-colors">
                Uslovi Korišćenja
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white/90 font-medium text-sm tracking-wider mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px' }}>
              Kontakt
            </h4>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-[#b07a87]" />
                <span>
                  Knez Mihailova 22,
                  <br />
                  11000 Beograd
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#b07a87]" />
                <span>+381 11 123 4567</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#b07a87]" />
                <span>info@altamoda.rs</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#b07a87]" />
                <span>Pon-Pet: 09-18h</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-white/40">&copy; 2026 Alta Moda. Sva prava zadržana.</span>
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
