"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Phone,
  Globe,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";

/* ─── Mega Menu Data ─── */
interface MegaMenuColumn {
  title: string;
  links: { name: string; href: string }[];
}

interface MegaMenuData {
  columns: MegaMenuColumn[];
  featured?: {
    image: string;
    title: string;
    cta: string;
    href: string;
  };
}

const megaMenus: Record<string, MegaMenuData> = {
  Boje: {
    columns: [
      {
        title: "Boje za kosu",
        links: [
          { name: "Permanentne", href: "/colors?type=permanentne" },
          { name: "Bez amonijaka", href: "/colors?type=bez-amonijaka" },
          { name: "Demi-permanentne", href: "/colors?type=demi-permanentne" },
        ],
      },
      {
        title: "Oksidanti",
        links: [
          { name: "3%", href: "/colors?type=oksidanti-3" },
          { name: "6%", href: "/colors?type=oksidanti-6" },
          { name: "9%", href: "/colors?type=oksidanti-9" },
          { name: "12%", href: "/colors?type=oksidanti-12" },
        ],
      },
      {
        title: "Dekoloranti",
        links: [
          { name: "Puderi", href: "/colors?type=dekoloranti-puderi" },
          { name: "Kreme", href: "/colors?type=dekoloranti-kreme" },
        ],
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=300&fit=crop",
      title: "Nova kolekcija boja",
      cta: "Pogledajte",
      href: "/colors",
    },
  },
  Nega: {
    columns: [
      {
        title: "Proizvodi za negu",
        links: [
          { name: "Šamponi", href: "/products?category=samponi" },
          { name: "Maske", href: "/products?category=maske" },
          { name: "Regeneratori", href: "/products?category=regeneratori" },
          { name: "Serumi", href: "/products?category=serumi" },
          { name: "Ulja", href: "/products?category=ulja" },
        ],
      },
      {
        title: "Po tipu kose",
        links: [
          { name: "Suva kosa", href: "/products?hair=suva" },
          { name: "Oštećena kosa", href: "/products?hair=ostecena" },
          { name: "Farbana kosa", href: "/products?hair=farbana" },
          { name: "Kovrdžava kosa", href: "/products?hair=kovrdzava" },
        ],
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=400&h=300&fit=crop",
      title: "Premium nega kose",
      cta: "Istražite",
      href: "/products?category=nega",
    },
  },
  Styling: {
    columns: [
      {
        title: "Styling proizvodi",
        links: [
          { name: "Gelovi", href: "/products?category=gelovi" },
          { name: "Lakovi", href: "/products?category=lakovi" },
          { name: "Voskovi", href: "/products?category=voskovi" },
          { name: "Kreme", href: "/products?category=styling-kreme" },
          { name: "Pene", href: "/products?category=pene" },
          { name: "Sprejevi", href: "/products?category=sprejevi" },
        ],
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
      title: "Profesionalni styling",
      cta: "Pogledajte",
      href: "/products?category=styling",
    },
  },
  Aparati: {
    columns: [
      {
        title: "Aparati",
        links: [
          { name: "Fen", href: "/products?category=fen" },
          { name: "Pegle", href: "/products?category=pegle" },
          { name: "Figaro", href: "/products?category=figaro" },
          { name: "Trimeri", href: "/products?category=trimeri" },
        ],
      },
    ],
  },
};

const navLinks = [
  // { name: "Boje", href: "/colors" },
  { name: "Nega", href: "/products" },
  { name: "Styling", href: "/products" },
  { name: "Aparati", href: "/products" },
  { name: "Brendovi", href: "/products" },
  // { name: "Akcije", href: "/outlet" },
  // { name: "Blog", href: "/blog" },
  // { name: "Seminari", href: "/seminars" },
];

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenu(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMenuEnter = (name: string) => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setActiveMenu(name);
  };

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const toggleMobileSubmenu = (name: string) => {
    setExpandedMobile(expandedMobile === name ? null : name);
  };

  return (
    <>
      {/* TOP BAR */}
      <div className="bg-[#1a1a1a] text-white/80 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <LanguageToggle />
            {/* <Link href="/account/login" className="hover:text-[#c8a96e] transition-colors">
              B2B Prijava
            </Link> */}
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>+381 11 123 4567</span>
          </div>
          <span className="hidden md:block">Besplatna dostava za porudžbine preko 5.000 RSD</span>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="block">
            <img src="/logo.png" alt="Alta Moda" className="h-8" />
          </Link>
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Pretražite proizvode..."
                className="w-full border border-gray-200 rounded-full pl-4 pr-10 py-2 text-sm focus:border-[#c8a96e] focus:ring-0 transition-colors"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(!searchOpen)} className="md:hidden">
              <Search className="w-5 h-5 text-[#1a1a1a]" />
            </button>
            <span className="relative hidden sm:block cursor-default">
              <Heart className="w-5 h-5 text-[#1a1a1a]" />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#c8a96e] text-white text-[10px] rounded-full flex items-center justify-center">
                3
              </span>
            </span>
            <span className="hidden sm:block cursor-default">
              <User className="w-5 h-5 text-[#1a1a1a]" />
            </span>
            <span className="relative cursor-default">
              <ShoppingBag className="w-5 h-5 text-[#1a1a1a]" />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#c8a96e] text-white text-[10px] rounded-full flex items-center justify-center">
                2
              </span>
            </span>
            <button onClick={() => setMobileMenu(true)} className="md:hidden">
              <Menu className="w-6 h-6 text-[#1a1a1a]" />
            </button>
          </div>
        </div>

        {/* DESKTOP NAV WITH MEGA MENU */}
        <nav className="hidden md:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 h-11 text-sm font-medium">
            {navLinks.map((l) => {
              const hasMega = megaMenus[l.name] !== undefined;
              return (
                <div
                  key={l.name}
                  className="nav-item relative h-full flex items-center"
                  onMouseEnter={() => hasMega && handleMenuEnter(l.name)}
                  onMouseLeave={handleMenuLeave}
                >
                  <Link
                    href={l.href}
                    className="text-[#1a1a1a] hover:text-[#c8a96e] transition-colors tracking-wide uppercase text-xs flex items-center gap-1"
                  >
                    {l.name}
                    {hasMega && <ChevronDown className="w-3 h-3" />}
                  </Link>

                  {/* Mega Menu Dropdown */}
                  {hasMega && (
                    <div
                      className={`mega-menu absolute top-full left-1/2 -translate-x-1/2 pt-2 ${
                        activeMenu === l.name ? "!opacity-100 !visible !translate-y-0" : ""
                      }`}
                      style={{ minWidth: megaMenus[l.name].columns.length > 1 ? "600px" : "400px" }}
                      onMouseEnter={() => handleMenuEnter(l.name)}
                      onMouseLeave={handleMenuLeave}
                    >
                      <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                        {/* Gold accent top border */}
                        <div className="h-0.5 bg-gradient-to-r from-[#c8a96e] via-[#e8d5b0] to-[#c8a96e]" />
                        <div className="p-6 flex gap-8">
                          {/* Columns */}
                          <div className="flex-1 flex gap-8">
                            {megaMenus[l.name].columns.map((col) => (
                              <div key={col.title} className="min-w-[140px]">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#c8a96e] mb-3">
                                  {col.title}
                                </h4>
                                <ul className="space-y-2">
                                  {col.links.map((link) => (
                                    <li key={link.name}>
                                      <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 hover:text-[#c8a96e] transition-colors flex items-center gap-1 group"
                                      >
                                        <span className="w-0 group-hover:w-2 h-px bg-[#c8a96e] transition-all duration-200" />
                                        {link.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                          {/* Featured Image */}
                          {megaMenus[l.name].featured && (
                            <div className="w-[200px] flex-shrink-0">
                              <Link href={megaMenus[l.name].featured!.href} className="block group">
                                <div className="relative rounded-lg overflow-hidden aspect-[4/3]">
                                  <img
                                    src={megaMenus[l.name].featured!.image}
                                    alt={megaMenus[l.name].featured!.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-white text-sm font-semibold">
                                      {megaMenus[l.name].featured!.title}
                                    </p>
                                    <span className="text-[#c8a96e] text-xs font-medium flex items-center gap-1 mt-1">
                                      {megaMenus[l.name].featured!.cta}
                                      <ChevronRight className="w-3 h-3" />
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3">
            <input
              type="text"
              placeholder="Pretražite proizvode..."
              className="w-full border border-gray-200 rounded-full pl-4 pr-10 py-2 text-sm"
            />
          </div>
        )}
      </header>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenu(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto animate-slideInRight">
            <div className="flex items-center justify-between p-4 border-b">
              <span
                className="font-bold text-lg"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Meni
              </span>
              <button onClick={() => setMobileMenu(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {navLinks.map((l) => {
                const hasMega = megaMenus[l.name] !== undefined;
                const isExpanded = expandedMobile === l.name;
                return (
                  <div key={l.name}>
                    <div className="flex items-center justify-between border-b border-gray-50">
                      <Link
                        href={l.href}
                        onClick={() => setMobileMenu(false)}
                        className="flex-1 py-3 px-2 text-[#1a1a1a] hover:text-[#c8a96e] text-sm uppercase tracking-wider font-medium"
                      >
                        {l.name}
                      </Link>
                      {hasMega && (
                        <button
                          onClick={() => toggleMobileSubmenu(l.name)}
                          className="p-2 hover:text-[#c8a96e] transition-colors"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    {/* Mobile sub-items */}
                    {hasMega && isExpanded && (
                      <div className="pl-4 pb-2 animate-slideDown">
                        {megaMenus[l.name].columns.map((col) => (
                          <div key={col.title} className="mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#c8a96e] block py-1 px-2">
                              {col.title}
                            </span>
                            {col.links.map((link) => (
                              <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setMobileMenu(false)}
                                className="block py-2 px-2 text-sm text-gray-600 hover:text-[#c8a96e] transition-colors"
                              >
                                {link.name}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="pt-4 space-y-2">
                {/* <Link
                  href="/account/login"
                  onClick={() => setMobileMenu(false)}
                  className="block w-full text-center py-2.5 bg-[#c8a96e] hover:bg-[#a8894e] text-white rounded text-sm font-medium"
                >
                  Prijava
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenu(false)}
                  className="block w-full text-center py-2.5 border border-[#c8a96e] text-[#c8a96e] rounded text-sm font-medium"
                >
                  Lista želja
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
