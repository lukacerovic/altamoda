"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { resolveBrandLogo } from "@/lib/brand-logos";
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

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price: number;
  image: string | null;
}

const PLACEHOLDER_IMG = "https://placehold.co/80x80/faf7f3/ccc?text=No+img";

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
            { name: t("nav.shampoos"), href: "/products?category=sampon" },
            { name: t("nav.masks"), href: "/products?category=maska" },
            { name: t("nav.conditioners"), href: "/products?category=regenerator" },
            { name: t("nav.serums"), href: "/products?category=ulja-serumi-i-kreme" },
            { name: t("nav.oils"), href: "/products?category=ulja-serumi-i-kreme" },
          ],
        },
        {
          title: t("nav.styling"),
          links: [
            { name: t("nav.styling"), href: "/products?category=stajling" },
            { name: t("nav.leaveIn"), href: "/products?category=tretman" },
          ],
        },
        {
          title: t("nav.appliances"),
          links: [
            { name: t("nav.tools"), href: "/products?category=frizerski-pribor" },
            { name: t("nav.brushes"), href: "/products?category=cetkice" },
            { name: t("nav.scissors"), href: "/products?category=makaze-1" },
          ],
        },
        {
          title: t("nav.hairColors"),
          links: [
            { name: t("nav.permanent"), href: "/products?category=permanentne-boje" },
            { name: t("nav.demiPermanent"), href: "/products?category=demi-permanentne-boje" },
            { name: t("nav.semiPermanent"), href: "/products?category=semi-permanentne-boje" },
          ],
        },
        {
          title: t("nav.oxidantsDecolorants"),
          links: [
            { name: t("nav.oxidants"), href: "/products?category=oksidanti" },
            { name: t("nav.decolorantPowders"), href: "/products?category=dekoloranti" },
          ],
        },
        {
          title: t("nav.manCollection"),
          links: [
            { name: "Redken Brews", href: "/products?search=Brews" },
            { name: t("nav.menColors"), href: "/products?category=color-camo" },
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
  };

  const navLinks = [
    { name: t("nav.products"), href: "/products", hasMega: true, menuKey: "products" },
    { name: t("nav.exploreBrands"), href: "/brands", hasMega: true, menuKey: "brands" },
    { name: t("nav.about"), href: "/about", hasMega: false, menuKey: "" },
    { name: t("nav.contact"), href: "/contact", hasMega: false, menuKey: "" },
    { name: t("nav.educationCenter"), href: "/education", hasMega: false, menuKey: "" },
  ];

  return { megaMenus, navLinks };
}

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

let cachedBrands: BrandItem[] = [];

export default function Header() {
  const { t } = useLanguage();
  const { megaMenus, navLinks } = useMegaMenus();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [brands, setBrands] = useState<BrandItem[]>(cachedBrands);

  // Fetch brands for the nav dropdown (cached across mounts)
  useEffect(() => {
    if (cachedBrands.length > 0) return;
    fetch("/api/brands")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          cachedBrands = json.data;
          setBrands(json.data);
        }
      })
      .catch(() => {});
  }, []);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: session } = useSession();
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.count);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) setMobileMenu(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const json = await res.json();
        if (json.success) setSearchResults(json.data);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

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
      <header className="bg-white sticky top-0 z-50 border-b border-[#D8CFBC]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Mobile hamburger - left */}
          <button onClick={() => setMobileMenu(true)} className="xl:hidden text-[#11120D] hover:text-secondary transition-colors">
            <Menu className="w-6 h-6" />
          </button>

          {/* Nav links - left (Kanva style: Shop v, Collections v, About, Blog, Contact) */}
          <nav className="hidden xl:flex items-center gap-6">
            {navLinks.map((l) => {
              const hasMega = l.hasMega && (megaMenus[l.menuKey] !== undefined || l.menuKey === "brands");
              const menuData = megaMenus[l.menuKey] || null;
              const isBrandsMenu = l.menuKey === "brands";
              return (
                <div
                  key={l.menuKey || l.name}
                  className="nav-item relative h-16 flex items-center"
                  onMouseEnter={() => hasMega && handleMenuEnter(l.menuKey)}
                  onMouseLeave={handleMenuLeave}
                >
                  <Link
                    href={l.href}
                    className="text-sm text-[#11120D] hover:text-secondary transition-colors tracking-normal font-normal flex items-center gap-1"
                  >
                    {l.name}
                    {hasMega && <ChevronDown className="w-3 h-3" />}
                  </Link>

                  {/* Brands Dropdown */}
                  {isBrandsMenu && brands.length > 0 && (
                    <div
                      className={`mega-menu absolute top-full left-0 pt-2 ${
                        activeMenu === "brands" ? "!opacity-100 !visible !translate-y-0" : ""
                      }`}
                      style={{ minWidth: "480px" }}
                      onMouseEnter={() => handleMenuEnter("brands")}
                      onMouseLeave={handleMenuLeave}
                    >
                      <div className="bg-white rounded-sm border border-[#D8CFBC] overflow-hidden shadow-lg">
                        <div className="h-0.5 bg-gradient-to-r from-[#11120D] via-[#a5a995] to-[#11120D]" />
                        <div className="p-5">
                          <h4 className="text-xs font-medium uppercase tracking-wider text-secondary mb-4">
                            {t("nav.ourBrands")}
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {brands.map((brand) => (
                              <Link
                                key={brand.id}
                                href={`/brands/${brand.slug}`}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-[#FFFBF4] transition-colors group"
                              >
                                {(() => { const logo = resolveBrandLogo(brand.slug, brand.logoUrl); return logo ? (
                                  <Image src={logo} alt={brand.name} width={200} height={200} className="w-8 h-8 object-contain flex-shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 bg-[#FFFBF4] rounded-sm flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-[#a5a995]">{brand.name.charAt(0)}</span>
                                  </div>
                                ); })()}
                                <span className="text-sm text-[#7A7F6A] group-hover:text-[#11120D] transition-colors truncate">
                                  {brand.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mega Menu Dropdown (products etc.) */}
                  {!isBrandsMenu && hasMega && menuData && (
                    <div
                      className={`mega-menu absolute top-full left-0 pt-2 ${
                        activeMenu === l.menuKey ? "!opacity-100 !visible !translate-y-0" : ""
                      }`}
                      style={{ minWidth: menuData.columns.length > 1 ? "600px" : "400px" }}
                      onMouseEnter={() => handleMenuEnter(l.menuKey)}
                      onMouseLeave={handleMenuLeave}
                    >
                      <div className="bg-white rounded-sm border border-[#D8CFBC] overflow-hidden shadow-lg">
                        <div className="h-0.5 bg-gradient-to-r from-[#11120D] via-[#a5a995] to-[#11120D]" />
                        <div className="p-6 flex gap-8">
                          <div className="flex-1 flex gap-8">
                            {menuData.columns.map((col) => (
                              <div key={col.title} className="min-w-[140px]">
                                <h4 className="text-xs font-medium uppercase tracking-wider text-secondary mb-3 min-h-[2.5rem] flex items-start">
                                  {col.title}
                                </h4>
                                <ul className="space-y-2">
                                  {col.links.map((link) => (
                                    <li key={link.name}>
                                      <Link
                                        href={link.href}
                                        className="text-sm text-[#7A7F6A] hover:text-secondary transition-colors flex items-center gap-1 group"
                                      >
                                        <span className="w-0 group-hover:w-2 h-px bg-black transition-all duration-200" />
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
                                <div className="relative rounded-sm overflow-hidden aspect-[4/3]">
                                  <Image
                                    src={menuData.featured.image}
                                    alt={menuData.featured.title}
                                    width={200}
                                    height={200}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                  <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-white text-sm font-medium">
                                      {menuData.featured.title}
                                    </p>
                                    <span className="text-[#a5a995] text-xs font-medium flex items-center gap-1 mt-1">
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
            <Image src="/logo.png" alt="Alta Moda" width={140} height={40} className="h-6 xl:h-7" />
          </Link>

          {/* Icons - right */}
          <div className="flex items-center gap-5">
            <div className="hidden xl:block">
              <LanguageToggle />
            </div>
            <Link href={session ? "/account" : "/account/login"} className="hidden xl:block hover:text-secondary transition-colors">
              <User className="w-5 h-5 text-[#11120D]" />
            </Link>
            <button onClick={() => setSearchOpen(!searchOpen)} className="hover:text-secondary transition-colors">
              <Search className="w-5 h-5 text-[#11120D]" />
            </button>
            <Link href="/wishlist" className="relative hidden xl:block hover:text-secondary transition-colors">
              <Heart className="w-5 h-5 text-[#11120D]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative hover:text-secondary transition-colors">
              <ShoppingBag className="w-5 h-5 text-[#11120D]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div ref={searchRef} className="absolute top-full left-0 right-0 bg-white border-b border-[#D8CFBC] animate-slideDown z-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder={t("nav.searchPlaceholder")}
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); }}
                  className="w-full border border-[#D8CFBC] rounded-full pl-5 pr-12 py-3 text-sm focus:border-black focus:ring-0 transition-colors bg-transparent"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a5a995]" />
              </div>
              {searchResults.length > 0 && (
                <div className="max-w-xl mx-auto mt-3 bg-white rounded-lg border border-[#D8CFBC] shadow-xl overflow-hidden">
                  <div className="p-3">
                    <span className="text-[11px] text-[#a5a995] font-semibold tracking-widest uppercase">Proizvodi</span>
                    <div className="mt-2 space-y-1">
                      {searchResults.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#FFFBF4] transition-colors"
                          onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                        >
                          <Image src={p.image || PLACEHOLDER_IMG} alt={p.name} width={200} height={200} className="w-10 h-10 rounded-sm object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#11120D] truncate">{p.name}</p>
                            <p className="text-[11px] text-[#7A7F6A] font-medium">{p.brand}</p>
                          </div>
                          <span className="text-sm font-bold text-[#11120D]">
                            {p.price.toLocaleString("sr-RS")} <span className="text-[10px] font-semibold text-[#a5a995]">RSD</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenu(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto animate-slideInRight">
            <div className="flex items-center justify-between p-4 border-b border-[#D8CFBC]">
              <Image src="/logo.png" alt="Alta Moda" width={140} height={40} className="h-5" />
              <button onClick={() => setMobileMenu(false)}>
                <X className="w-5 h-5 text-[#11120D]" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {navLinks.map((l) => {
                const isBrandsMenu = l.menuKey === "brands";
                const hasMega = l.hasMega && (megaMenus[l.menuKey] !== undefined || isBrandsMenu);
                const menuData = megaMenus[l.menuKey] || null;
                const isExpanded = expandedMobile === l.menuKey;
                return (
                  <div key={l.menuKey || l.name}>
                    <div className="flex items-center justify-between border-b border-[#D8CFBC]">
                      <Link
                        href={l.href}
                        onClick={() => setMobileMenu(false)}
                        className="flex-1 py-3 px-2 text-[#11120D] hover:text-secondary text-sm font-normal tracking-normal"
                      >
                        {l.name}
                      </Link>
                      {hasMega && (
                        <button
                          onClick={() => toggleMobileSubmenu(l.menuKey)}
                          className="p-2 hover:text-secondary transition-colors"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    {/* Brands mobile submenu */}
                    {isBrandsMenu && isExpanded && brands.length > 0 && (
                      <div className="pl-4 pb-2 animate-slideDown">
                        {brands.map((brand) => (
                          <Link
                            key={brand.id}
                            href={`/brands/${brand.slug}`}
                            onClick={() => setMobileMenu(false)}
                            className="flex items-center gap-3 py-2 px-2 text-sm text-[#7A7F6A] hover:text-secondary transition-colors"
                          >
                            {(() => { const logo = resolveBrandLogo(brand.slug, brand.logoUrl); return logo ? (
                              <Image src={logo} alt={brand.name} width={200} height={200} className="w-6 h-6 object-contain" />
                            ) : (
                              <div className="w-6 h-6 bg-[#FFFBF4] rounded-sm flex items-center justify-center">
                                <span className="text-[10px] font-bold text-[#a5a995]">{brand.name.charAt(0)}</span>
                              </div>
                            ); })()}
                            {brand.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {/* Products mega menu mobile submenu */}
                    {!isBrandsMenu && hasMega && isExpanded && menuData && (
                      <div className="pl-4 pb-2 animate-slideDown">
                        {menuData.columns.map((col) => (
                          <div key={col.title} className="mb-3">
                            <span className="text-xs font-medium uppercase tracking-wider text-secondary block py-1 px-2">
                              {col.title}
                            </span>
                            {col.links.map((link) => (
                              <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setMobileMenu(false)}
                                className="block py-2 px-2 text-sm text-[#7A7F6A] hover:text-secondary transition-colors"
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

              {/* Account & Wishlist in mobile menu */}
              <div className="pt-4 border-t border-[#D8CFBC] mt-2 space-y-1">
                <Link
                  href={session ? "/account" : "/account/login"}
                  onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-3 py-3 px-2 text-[#11120D] hover:text-secondary text-sm"
                >
                  <User className="w-5 h-5" />
                  {session ? t("nav.account") || "Account" : t("nav.login") || "Login"}
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-3 py-3 px-2 text-[#11120D] hover:text-secondary text-sm"
                >
                  <Heart className="w-5 h-5" />
                  {t("nav.wishlist") || "Wishlist"}
                  {wishlistCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-black text-white text-[10px]">{wishlistCount}</span>
                  )}
                </Link>
              </div>

              {/* Language selector in mobile menu */}
              <div className="pt-4 border-t border-[#D8CFBC] mt-2">
                <LanguageToggle alignLeft />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
