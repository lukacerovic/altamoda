"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

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

function useMegaMenus() {
  const { t } = useLanguage();

  const megaMenus: Record<string, MegaMenuData> = {
    products: {
      columns: [
        {
          title: t("nav.hairCare"),
          links: [
            { name: t("nav.shampoos"), href: "/products?category=samponi" },
            { name: t("nav.masks"), href: "/products?category=maske" },
            { name: t("nav.conditioners"), href: "/products?category=regeneratori" },
            { name: t("nav.serums"), href: "/products?category=serumi" },
            { name: t("nav.oils"), href: "/products?category=ulja" },
          ],
        },
        {
          title: t("nav.styling"),
          links: [
            { name: t("nav.gels"), href: "/products?category=gelovi" },
            { name: t("nav.sprays_styling"), href: "/products?category=lakovi" },
            { name: t("nav.waxes"), href: "/products?category=voskovi" },
            { name: t("nav.creams"), href: "/products?category=styling-kreme" },
            { name: t("nav.sprays"), href: "/products?category=sprejevi" },
          ],
        },
        {
          title: t("nav.appliances"),
          links: [
            { name: t("nav.dryer"), href: "/products?category=fen" },
            { name: t("nav.straighteners"), href: "/products?category=pegle" },
            { name: t("nav.curlers"), href: "/products?category=figaro" },
            { name: t("nav.trimmers"), href: "/products?category=trimeri" },
          ],
        },
      ],
      featured: {
        image: "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=400&h=300&fit=crop",
        title: t("nav.premiumHairCare"),
        cta: t("nav.explore"),
        href: "/products",
      },
    },
    collections: {
      columns: [
        {
          title: t("nav.hairColors"),
          links: [
            { name: t("nav.permanent"), href: "/colors?type=permanentne" },
            { name: t("nav.ammoniaFree"), href: "/colors?type=bez-amonijaka" },
            { name: t("nav.demiPermanent"), href: "/colors?type=demi-permanentne" },
          ],
        },
        {
          title: t("nav.oxidantsDecolorants"),
          links: [
            { name: t("nav.oxidant3"), href: "/colors?type=oksidanti-3" },
            { name: t("nav.oxidant6"), href: "/colors?type=oksidanti-6" },
            { name: t("nav.oxidant9"), href: "/colors?type=oksidanti-9" },
            { name: t("nav.decolorantPowders"), href: "/colors?type=dekoloranti-puderi" },
          ],
        },
      ],
      featured: {
        image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=300&fit=crop",
        title: t("nav.newColorCollection"),
        cta: t("nav.view"),
        href: "/colors",
      },
    },
  };

  const navLinks = [
    { name: t("nav.products"), href: "/products", hasMega: true, menuKey: "products" },
    { name: t("nav.collections"), href: "/colors", hasMega: true, menuKey: "collections" },
    { name: t("nav.about"), href: "/about", hasMega: false, menuKey: "" },
    { name: t("nav.blog"), href: "/blog", hasMega: false, menuKey: "" },
    { name: t("nav.contact"), href: "/contact", hasMega: false, menuKey: "" },
  ];

  return { megaMenus, navLinks };
}

export default function Header() {
  const { t } = useLanguage();
  const { megaMenus, navLinks } = useMegaMenus();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: session } = useSession();
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.count);

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
      {/* MAIN HEADER - Clean Kanva style */}
      <header className="bg-white sticky top-0 z-50 border-b border-[#e0d8cc]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Nav links - left (Kanva style: Shop v, Collections v, About, Blog, Contact) */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => {
              const hasMega = l.hasMega && megaMenus[l.menuKey] !== undefined;
              const menuData = hasMega ? megaMenus[l.menuKey] : null;
              return (
                <div
                  key={l.menuKey || l.name}
                  className="nav-item relative h-16 flex items-center"
                  onMouseEnter={() => hasMega && handleMenuEnter(l.menuKey)}
                  onMouseLeave={handleMenuLeave}
                >
                  <Link
                    href={l.href}
                    className="text-sm text-[#2d2d2d] hover:text-[#8c4a5a] transition-colors tracking-normal font-normal flex items-center gap-1"
                  >
                    {l.name}
                    {hasMega && <ChevronDown className="w-3 h-3" />}
                  </Link>

                  {/* Mega Menu Dropdown */}
                  {hasMega && menuData && (
                    <div
                      className={`mega-menu absolute top-full left-1/2 -translate-x-1/2 pt-2 ${
                        activeMenu === l.menuKey ? "!opacity-100 !visible !translate-y-0" : ""
                      }`}
                      style={{ minWidth: menuData.columns.length > 1 ? "600px" : "400px" }}
                      onMouseEnter={() => handleMenuEnter(l.menuKey)}
                      onMouseLeave={handleMenuLeave}
                    >
                      <div className="bg-white rounded-2xl border border-[#e0d8cc] overflow-hidden shadow-lg">
                        <div className="h-0.5 bg-gradient-to-r from-[#8c4a5a] via-[#b07a87] to-[#8c4a5a]" />
                        <div className="p-6 flex gap-8">
                          <div className="flex-1 flex gap-8">
                            {menuData.columns.map((col) => (
                              <div key={col.title} className="min-w-[140px]">
                                <h4 className="text-xs font-medium uppercase tracking-wider text-[#8c4a5a] mb-3">
                                  {col.title}
                                </h4>
                                <ul className="space-y-2">
                                  {col.links.map((link) => (
                                    <li key={link.name}>
                                      <Link
                                        href={link.href}
                                        className="text-sm text-[#6b6b6b] hover:text-[#8c4a5a] transition-colors flex items-center gap-1 group"
                                      >
                                        <span className="w-0 group-hover:w-2 h-px bg-[#8c4a5a] transition-all duration-200" />
                                        {link.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                          {menuData.featured && (
                            <div className="w-[200px] flex-shrink-0">
                              <Link href={menuData.featured.href} className="block group">
                                <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                                  <img
                                    src={menuData.featured.image}
                                    alt={menuData.featured.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                  <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-white text-sm font-medium">
                                      {menuData.featured.title}
                                    </p>
                                    <span className="text-[#b07a87] text-xs font-medium flex items-center gap-1 mt-1">
                                      {menuData.featured.cta}
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
          </nav>

          {/* Logo - center (Kanva style: parenthesized brand name) */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 block">
            <img src="/logo.png" alt="Alta Moda" className="h-6 md:h-7" />
          </Link>

          {/* Icons - right */}
          <div className="flex items-center gap-5">
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
            <Link href={session ? "/account" : "/account/login"} className="hidden sm:block hover:text-[#8c4a5a] transition-colors">
              <User className="w-5 h-5 text-[#2d2d2d]" />
            </Link>
            <button onClick={() => setSearchOpen(!searchOpen)} className="hover:text-[#8c4a5a] transition-colors">
              <Search className="w-5 h-5 text-[#2d2d2d]" />
            </button>
            <Link href="/wishlist" className="relative hidden sm:block hover:text-[#8c4a5a] transition-colors">
              <Heart className="w-5 h-5 text-[#2d2d2d]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#8c4a5a] text-white text-[10px] rounded-full flex items-center justify-center">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative hover:text-[#8c4a5a] transition-colors">
              <ShoppingBag className="w-5 h-5 text-[#2d2d2d]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#8c4a5a] text-white text-[10px] rounded-full flex items-center justify-center">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileMenu(true)} className="md:hidden">
              <Menu className="w-6 h-6 text-[#2d2d2d]" />
            </button>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-[#e0d8cc] animate-slideDown">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder={t("nav.searchPlaceholder")}
                  autoFocus
                  className="w-full border border-[#e0d8cc] rounded-full pl-5 pr-12 py-3 text-sm focus:border-[#8c4a5a] focus:ring-0 transition-colors bg-transparent"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b07a87]" />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenu(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto animate-slideInRight">
            <div className="flex items-center justify-between p-4 border-b border-[#e0d8cc]">
              <img src="/logo.png" alt="Alta Moda" className="h-5" />
              <button onClick={() => setMobileMenu(false)}>
                <X className="w-5 h-5 text-[#2d2d2d]" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {navLinks.map((l) => {
                const hasMega = l.hasMega && megaMenus[l.menuKey] !== undefined;
                const menuData = hasMega ? megaMenus[l.menuKey] : null;
                const isExpanded = expandedMobile === l.menuKey;
                return (
                  <div key={l.menuKey || l.name}>
                    <div className="flex items-center justify-between border-b border-[#f5f0e8]">
                      <Link
                        href={l.href}
                        onClick={() => setMobileMenu(false)}
                        className="flex-1 py-3 px-2 text-[#2d2d2d] hover:text-[#8c4a5a] text-sm font-normal tracking-normal"
                      >
                        {l.name}
                      </Link>
                      {hasMega && (
                        <button
                          onClick={() => toggleMobileSubmenu(l.menuKey)}
                          className="p-2 hover:text-[#8c4a5a] transition-colors"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    {hasMega && isExpanded && menuData && (
                      <div className="pl-4 pb-2 animate-slideDown">
                        {menuData.columns.map((col) => (
                          <div key={col.title} className="mb-3">
                            <span className="text-xs font-medium uppercase tracking-wider text-[#8c4a5a] block py-1 px-2">
                              {col.title}
                            </span>
                            {col.links.map((link) => (
                              <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setMobileMenu(false)}
                                className="block py-2 px-2 text-sm text-[#6b6b6b] hover:text-[#8c4a5a] transition-colors"
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

              {/* Language selector in mobile menu */}
              <div className="pt-4 border-t border-[#e0d8cc] mt-2">
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
