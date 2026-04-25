"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Package, Heart, ChevronRight, LogOut,
  CreditCard, TrendingUp, Award, Percent, CheckCircle,
  BarChart3, AlertTriangle, Globe,
} from "lucide-react";
import { useLanguage, languageLabels, languageFlags, type Language } from "@/lib/i18n/LanguageContext";

// wishlist items are now fetched from API dynamically

// Real-data placeholders. Demo numbers were removed so the B2B sections render
// empty states instead of misleading balances/rabats to a user with no orders.
// Replace these with live endpoints (per-user debt, rabat tier, points, etc.)
// when the backing data model exists.

// ─── Sidebar configs per role ───

const b2cNavKeys = [
  { key: "orders", labelKey: "account.orders", icon: Package },
  { key: "wishlist", labelKey: "account.wishlistNav", icon: Heart },
];

const b2bNavKeys = [
  { key: "orders", labelKey: "account.orders", icon: Package },
  { key: "wishlist", labelKey: "account.wishlistNav", icon: Heart },
  { key: "prices", labelKey: "account.b2bPricesNav", icon: Percent },
  { key: "balance", labelKey: "account.balanceDebtsNav", icon: TrendingUp },
  { key: "loyalty", labelKey: "account.loyaltyNav", icon: Award },
];

// ─── Sub-components ───

const statusColorMap: Record<string, string> = {
  novi: "bg-blue-100 text-blue-700",
  u_obradi: "bg-yellow-100 text-yellow-700",
  isporuceno: "bg-green-100 text-green-700",
  otkazano: "bg-red-100 text-red-700",
};

const statusLabelMap: Record<string, string> = {
  novi: "account.newOrder",
  u_obradi: "account.inTransit",
  isporuceno: "account.delivered",
  otkazano: "account.cancelled",
};

interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  slug: string | null;
}

function OrdersSection() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<{
    id: string;
    orderNumber: string;
    createdAt: string;
    itemCount: number;
    items: OrderItem[];
    total: number;
    status: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Initial load.
  useEffect(() => {
    fetch("/api/orders?limit=20")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.data.orders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Poll for status changes so the client sees admin-driven updates (shipped,
  // delivered, etc.) without manually refreshing. Only runs while the tab is
  // visible — background tabs skip the poll to avoid burning cycles on pages
  // no one is looking at.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/orders/statuses");
        const data = await res.json();
        if (!data.success) return;
        const byId = new Map<string, string>(
          (data.data.orders as { id: string; status: string }[]).map((o) => [o.id, o.status]),
        );
        setOrders((prev) => prev.map((o) => {
          const fresh = byId.get(o.id);
          return fresh && fresh !== o.status ? { ...o, status: fresh } : o;
        }));
      } catch {
        // swallow — next tick will retry
      }
    };
    timer = setInterval(poll, 30_000);
    return () => { if (timer) clearInterval(timer); };
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Da li ste sigurni da želite da otkažete ovu porudžbinu?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Nije moguće otkazati porudžbinu");
        return;
      }
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "otkazano" } : o));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-[#2e2e2e] mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("account.myOrders")}</h1>
      {loading ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <Package className="w-12 h-12 text-[#D8CFBC] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#2e2e2e] mb-2">{t("account.noOrders")}</h3>
          <p className="text-sm text-[#837A64] mb-4">{t("account.noOrdersDesc")}</p>
          <Link href="/products" className="inline-block px-6 py-2.5 bg-black hover:bg-[#2e2e2e] text-white rounded text-sm font-medium transition-colors">{t("accountPage.browseProducts")}</Link>
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D8CFBC]">
                  <th className="text-left text-xs font-medium text-[#837A64] uppercase tracking-wider px-6 py-3">{t("account.orderNumber")}</th>
                  <th className="text-left text-xs font-medium text-[#837A64] uppercase tracking-wider px-6 py-3">{t("account.date")}</th>
                  <th className="text-left text-xs font-medium text-[#837A64] uppercase tracking-wider px-6 py-3">{t("account.items")}</th>
                  <th className="text-left text-xs font-medium text-[#837A64] uppercase tracking-wider px-6 py-3">{t("account.total")}</th>
                  <th className="text-left text-xs font-medium text-[#837A64] uppercase tracking-wider px-6 py-3">{t("account.status")}</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  // Reviews are gated server-side to non-cancelled orders, so the
                  // UI mirrors that here — hiding the link on cancelled orders
                  // avoids a 403 click for the user.
                  const canReview = order.status !== "otkazano";
                  return (
                  <tr key={order.orderNumber} className="border-t border-[#D8CFBC] hover:bg-[#FFFFFF]/50 align-top">
                    <td className="px-6 py-4 text-sm font-medium text-[#2e2e2e]">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-[#837A64]">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-[#837A64]">
                      {order.items.length === 0 ? (
                        <>{order.itemCount} {t("account.itemsCount")}</>
                      ) : (
                        <ul className="space-y-1.5 max-w-[260px]">
                          {order.items.map((it) => (
                            <li key={it.productId} className="flex items-start justify-between gap-2">
                              <span className="text-[#2e2e2e]">
                                {it.productName}
                                {it.quantity > 1 && <span className="text-[#837A64]"> × {it.quantity}</span>}
                              </span>
                              {canReview && it.slug && (
                                <Link
                                  href={`/products/${it.slug}#reviews`}
                                  className="inline-flex items-center px-2.5 py-1 rounded-sm bg-black text-white text-xs font-medium hover:bg-[#2e2e2e] transition-colors whitespace-nowrap"
                                >
                                  {t("account.reviewProduct")}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#2e2e2e]">{order.total.toLocaleString("sr-RS")} RSD</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColorMap[order.status] || "bg-[#FFFFFF] text-[#2e2e2e]"}`}>
                        {t(statusLabelMap[order.status] || order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === "novi" && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          disabled={cancellingId === order.id}
                          className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-40"
                        >
                          {cancellingId === order.id ? "…" : "Otkaži"}
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function WishlistSection() {
  const { t } = useLanguage();
  const [wishlistItems, setWishlistItems] = useState<{
    productId: string; name: string; brand: string; price: number; oldPrice: number | null; image: string; slug: string; inStock: boolean;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistError, setWishlistError] = useState("");

  useEffect(() => {
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setWishlistItems(data.data.items);
      })
      .catch((err) => {
        console.error("Failed to fetch wishlist:", err);
        setWishlistError(t("accountPage.wishlistError"));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2e2e2e]" style={{ fontFamily: "'Noto Serif', serif" }}>{t("account.wishlist")}</h1>
        <Link href="/wishlist" className="text-sm text-secondary hover:text-[#2e2e2e] font-medium flex items-center gap-1">
          {t("accountPage.viewAll")} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      {wishlistError ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <p className="text-sm text-red-500">{wishlistError}</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <p className="text-sm text-[#837A64]">{t("accountPage.loading")}</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <Heart className="w-12 h-12 text-[#D8CFBC] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#2e2e2e] mb-2">{t("accountPage.emptyWishlist")}</h3>
          <p className="text-sm text-[#837A64] mb-4">{t("accountPage.emptyWishlistDesc")}</p>
          <Link href="/products" className="inline-block px-6 py-2.5 bg-black hover:bg-[#2e2e2e] text-white rounded text-sm font-medium transition-colors">{t("accountPage.browseProducts")}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => (
            <Link key={item.productId} href={`/products/${item.slug}`} className="bg-white rounded-[4px] shadow-sm overflow-hidden group">
              <div className="aspect-square bg-[#FFFFFF] relative overflow-hidden">
                {item.image && <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                </div>
                {!item.inStock && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="px-4 py-2 bg-[#2e2e2e] text-white text-xs font-semibold rounded-full">{t("accountPage.outOfStock")}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-[#837A64]">{item.brand}</span>
                <h4 className="text-sm font-medium text-[#2e2e2e] mt-1">{item.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-secondary">{item.price.toLocaleString("sr-RS")} RSD</span>
                  {item.oldPrice && item.oldPrice > item.price && <span className="text-xs text-[#837A64] line-through">{item.oldPrice.toLocaleString("sr-RS")} RSD</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function B2bPricesSection() {
  const { t } = useLanguage();
  return (
    <>
      <h1 className="text-2xl font-bold text-[#2e2e2e] mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("accountPage.b2bPricesTitle")}</h1>

      <div className="bg-white rounded-sm shadow-sm p-10 text-center">
        <Percent className="w-8 h-8 text-[#837A64]/50 mx-auto mb-3" />
        <p className="text-sm text-[#837A64]">
          Podaci o rabatima i mesečnoj potrošnji biće dostupni nakon obavljenih porudžbina.
        </p>
      </div>
    </>
  );
}

function B2bBalanceSection() {
  const { t } = useLanguage();
  return (
    <>
      <h1 className="text-2xl font-bold text-[#2e2e2e] mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("account.balanceDebts")}</h1>

      <div className="bg-white rounded-sm shadow-sm p-10 text-center">
        <AlertTriangle className="w-8 h-8 text-[#837A64]/50 mx-auto mb-3" />
        <p className="text-sm text-[#837A64]">
          Pregled zaduženja i uplata biće prikazan nakon prvih faktura.
        </p>
      </div>
    </>
  );
}

function B2bLoyaltySection() {
  const { t } = useLanguage();
  return (
    <>
      <h1 className="text-2xl font-bold text-[#2e2e2e] mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("account.loyaltyProgram")}</h1>

      <div className="bg-white rounded-sm shadow-sm p-10 text-center">
        <Award className="w-8 h-8 text-[#837A64]/50 mx-auto mb-3" />
        <p className="text-sm text-[#837A64]">
          Program lojalnosti uskoro. Poeni se skupljaju po završenoj porudžbini.
        </p>
      </div>
    </>
  );
}

// ─── Main Page ───

export default function AccountPage() {
  const { data: session, status } = useSession();
  const { t, language, setLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState("orders");


  // Redirect admin to admin panel
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (status === "authenticated" && role === "admin") {
    redirect("/admin");
  }

  const isB2b = role === "b2b";
  const sidebarNavKeys = isB2b ? b2bNavKeys : b2cNavKeys;

  const userName = session?.user?.name || t("accountPage.user");
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const userLabel = isB2b ? t("accountPage.b2bPartner") : t("accountPage.buyer");

  return (
    // overflow-x-hidden: keep the page itself fixed width. Inner sections (tables,
    // mobile nav pill row) already have their own overflow-x-auto wrappers, so
    // the body can safely clip anything that overflows horizontally.
    <div className="min-h-screen bg-[#FFFFFF] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-[#837A64] mb-6">
          <Link href="/" className="hover:text-secondary">{t("accountPage.breadcrumbHome")}</Link><ChevronRight className="w-3 h-3" /><span className="text-[#2e2e2e]">{t("accountPage.breadcrumbAccount")}</span>
        </nav>

        {/* B2B Debt Warning — suppressed until wired to real balance data. */}

        <div className="flex gap-8 min-w-0">
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-sm shadow-sm p-4 mb-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#D8CFBC]">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#837A64] to-[#6a624f] flex items-center justify-center text-white font-bold text-lg">{userInitials}</div>
                <div>
                  <h3 className="font-semibold text-[#2e2e2e]">{userName}</h3>
                  <span className="text-xs text-secondary">{userLabel}</span>
                </div>
              </div>
              <nav className="space-y-1">
                {sidebarNavKeys.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.key} onClick={() => setActiveSection(item.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${activeSection === item.key ? "bg-[#FFFFFF] text-secondary" : "text-[#837A64] hover:bg-[#FFFFFF] hover:text-[#2e2e2e]"}`}>
                      <Icon className="w-4 h-4" /> {t(item.labelKey)}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Language selector */}
            <div className="bg-white rounded-sm shadow-sm p-4 mb-4">
              <h4 className="text-xs font-medium text-[#837A64] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> {t("common.language")}
              </h4>
              <div className="space-y-1">
                {(["sr", "en", "ru"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors ${
                      language === lang
                        ? "bg-[#FFFFFF] text-secondary font-medium"
                        : "text-[#837A64] hover:bg-[#FFFFFF]"
                    }`}
                  >
                    <span>{languageFlags[lang]}</span>
                    <span>{languageLabels[lang]}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/account/login" })}
              className="w-full flex items-center justify-center gap-2 text-sm text-[#837A64] hover:text-[#b5453a] transition-colors py-2"
            >
              <LogOut className="w-4 h-4" /> {t("account.logout")}
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1 min-w-0">
            {/* Mobile nav */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6">
              {sidebarNavKeys.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} onClick={() => setActiveSection(item.key)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeSection === item.key ? "bg-black text-white" : "bg-white text-[#837A64] border border-[#D8CFBC]"}`}>
                    <Icon className="w-3.5 h-3.5" /> {t(item.labelKey)}
                  </button>
                );
              })}
              <button
                onClick={() => signOut({ callbackUrl: "/account/login" })}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap bg-white text-red-500 border border-[#D8CFBC]"
              >
                <LogOut className="w-3.5 h-3.5" /> {t("account.logout")}
              </button>
            </div>

            {/* Sections */}
            {activeSection === "orders" && <OrdersSection />}
            {activeSection === "wishlist" && <WishlistSection />}
            {isB2b && activeSection === "prices" && <B2bPricesSection />}
            {isB2b && activeSection === "balance" && <B2bBalanceSection />}
            {isB2b && activeSection === "loyalty" && <B2bLoyaltySection />}
          </div>
        </div>
      </div>

    </div>
  );
}
