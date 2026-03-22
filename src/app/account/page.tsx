"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Package, Heart, ChevronRight, RotateCcw, LogOut,
  CreditCard, TrendingUp, Award, Percent, CheckCircle,
  BarChart3, AlertTriangle, Globe,
} from "lucide-react";
import { useLanguage, languageLabels, languageFlags, type Language } from "@/lib/i18n/LanguageContext";

// ─── Mock Data ───

const recentOrders = [
  { id: "ALT-2026-0341", date: "15. mar 2026", items: 5, total: "24.500 RSD", statusKey: "delivered" as const, statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0328", date: "10. mar 2026", items: 3, total: "15.200 RSD", statusKey: "inTransit" as const, statusColor: "bg-blue-100 text-blue-700" },
  { id: "ALT-2026-0315", date: "5. mar 2026", items: 8, total: "42.100 RSD", statusKey: "delivered" as const, statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0298", date: "28. feb 2026", items: 2, total: "8.400 RSD", statusKey: "delivered" as const, statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0285", date: "22. feb 2026", items: 12, total: "56.800 RSD", statusKey: "delivered" as const, statusColor: "bg-green-100 text-green-700" },
];

// wishlist items are now fetched from API dynamically

const loyaltyBenefitKeys = [
  ["account.discount5", "account.freeShipping7k", "account.newsletterAccess"],
  ["account.discount8", "account.freeShipping5k", "account.earlySaleAccess", "account.freeSamples"],
  ["account.discount12", "account.freeShippingAll", "account.prioritySupport", "account.birthdayGift"],
  ["account.discount15", "account.freeExpressShipping", "account.personalConsultant", "account.vipAccess", "account.monthlyGiftPack"],
];

const loyaltyLevelKeys = ["account.bronze", "account.silver", "account.gold", "account.platinum"];

const loyaltyLevelMeta = [
  { min: 0, max: 1000 },
  { min: 1000, max: 2000 },
  { min: 2000, max: 3500 },
  { min: 3500, max: 5000 },
];

const paymentHistoryData = [
  { date: "12. mar 2026", amount: "24.500 RSD", methodKey: "card" as const, statusKey: "paid" as const, statusColor: "text-green-600" },
  { date: "5. mar 2026", amount: "42.100 RSD", methodKey: "invoice" as const, statusKey: "paid" as const, statusColor: "text-green-600" },
  { date: "28. feb 2026", amount: "8.400 RSD", methodKey: "card" as const, statusKey: "paid" as const, statusColor: "text-green-600" },
  { date: "15. feb 2026", amount: "12.500 RSD", methodKey: "invoice" as const, statusKey: "unpaid" as const, statusColor: "text-red-600" },
  { date: "1. feb 2026", amount: "31.200 RSD", methodKey: "card" as const, statusKey: "paid" as const, statusColor: "text-green-600" },
];

const rabatScale = [
  { range: "0 - 50.000 RSD", discount: "5%" },
  { range: "50.000 - 100.000 RSD", discount: "8%" },
  { range: "100.000 - 200.000 RSD", discount: "12%" },
  { range: "200.000+ RSD", discount: "15%" },
];

const monthlySpending = [
  { monthKey: "accountPage.monthOct", amount: 45000 },
  { monthKey: "accountPage.monthNov", amount: 62000 },
  { monthKey: "accountPage.monthDec", amount: 78000 },
  { monthKey: "accountPage.monthJan", amount: 34000 },
  { monthKey: "accountPage.monthFeb", amount: 56000 },
  { monthKey: "accountPage.monthMar", amount: 42000 },
];

const currentDebt = 12500;
const currentPoints = 2340;
const currentLevelIndex = 2;
const nextLevelThreshold = 3500;

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

function OrdersSection() {
  const { t } = useLanguage();
  return (
    <>
      <h1 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("account.myOrders")}</h1>
      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">{t("account.orderNumber")}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">{t("account.date")}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">{t("account.items")}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">{t("account.total")}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">{t("account.status")}</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-black">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.items} {t("account.itemsCount")}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-black">{order.total}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>{t(`account.${order.statusKey}`)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
        <h1 className="text-2xl font-bold text-black" style={{ fontFamily: "'Noto Serif', serif" }}>{t("account.wishlist")}</h1>
        <Link href="/wishlist" className="text-sm text-secondary hover:text-black font-medium flex items-center gap-1">
          {t("accountPage.viewAll")} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      {wishlistError ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <p className="text-sm text-red-500">{wishlistError}</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <p className="text-sm text-gray-500">{t("accountPage.loading")}</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-black mb-2">{t("accountPage.emptyWishlist")}</h3>
          <p className="text-sm text-gray-500 mb-4">{t("accountPage.emptyWishlistDesc")}</p>
          <Link href="/products" className="inline-block px-6 py-2.5 bg-black hover:bg-stone-800 text-white rounded text-sm font-medium transition-colors">{t("accountPage.browseProducts")}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => (
            <Link key={item.productId} href={`/products/${item.slug}`} className="bg-white rounded-sm shadow-sm overflow-hidden group">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                </div>
                {!item.inStock && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="px-4 py-2 bg-[#333] text-white text-xs font-semibold rounded-full">{t("accountPage.outOfStock")}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-gray-400">{item.brand}</span>
                <h4 className="text-sm font-medium text-black mt-1">{item.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-secondary">{item.price.toLocaleString("sr-RS")} RSD</span>
                  {item.oldPrice && item.oldPrice > item.price && <span className="text-xs text-gray-400 line-through">{item.oldPrice.toLocaleString("sr-RS")} RSD</span>}
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
      <h1 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("accountPage.b2bPricesTitle")}</h1>

      <div className="bg-white rounded-sm shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-black flex items-center gap-2 mb-4"><Percent className="w-5 h-5 text-secondary" /> {t("accountPage.rabatScale")}</h3>
        <p className="text-sm text-gray-500 mb-4">{t("accountPage.rabatDesc")} <strong className="text-black">142.500 RSD</strong></p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">{t("accountPage.monthlyTurnover")}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">{t("accountPage.rabat")}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">{t("account.status")}</th>
              </tr>
            </thead>
            <tbody>
              {rabatScale.map((r, i) => {
                const isActive = i === 2;
                return (
                  <tr key={r.range} className={`border-b border-gray-50 ${isActive ? "bg-stone-50" : "hover:bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.range}</td>
                    <td className="px-4 py-3 text-sm font-bold text-black">{r.discount}</td>
                    <td className="px-4 py-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> {t("accountPage.active")}</span>
                      ) : i < 2 ? (
                        <span className="text-xs text-green-600">{t("accountPage.achieved")}</span>
                      ) : (
                        <span className="text-xs text-gray-400">{t("accountPage.remaining")} {i === 3 ? "57.500 RSD" : ""}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Spending Chart */}
      <div className="bg-white rounded-sm shadow-sm p-6">
        <h3 className="font-semibold text-black flex items-center gap-2 mb-6"><BarChart3 className="w-5 h-5 text-secondary" /> {t("accountPage.monthlySpending")}</h3>
        <div className="flex items-end gap-4 h-48">
          {monthlySpending.map((m) => {
            const maxSpending = Math.max(...monthlySpending.map((s) => s.amount));
            return (
              <div key={m.monthKey} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-black">{(m.amount / 1000).toFixed(0)}k</span>
                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: `${(m.amount / maxSpending) * 100}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#735b28] to-[#b07a87] rounded-t" />
                </div>
                <span className="text-xs text-gray-500">{t(m.monthKey)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500">{t("accountPage.totalForPeriod")}:</span>
          <span className="font-bold text-black">{monthlySpending.reduce((s, m) => s + m.amount, 0).toLocaleString("sr-RS")} RSD</span>
        </div>
      </div>
    </>
  );
}

function B2bBalanceSection() {
  const { t } = useLanguage();
  return (
    <>
      <h1 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("account.balanceDebts")}</h1>

      <div className="bg-white rounded-sm shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 rounded-sm p-4 text-center">
            <span className="text-xs text-gray-500">{t("accountPage.outstandingDebt")}</span>
            <p className="text-xl font-bold text-red-600 mt-1">{currentDebt.toLocaleString("sr-RS")} RSD</p>
          </div>
          <div className="bg-green-50 rounded-sm p-4 text-center">
            <span className="text-xs text-gray-500">{t("accountPage.totalPaid")} (2026)</span>
            <p className="text-xl font-bold text-green-600 mt-1">317.200 RSD</p>
          </div>
          <div className="bg-blue-50 rounded-sm p-4 text-center">
            <span className="text-xs text-gray-500">{t("accountPage.creditLimit")}</span>
            <p className="text-xl font-bold text-blue-600 mt-1">500.000 RSD</p>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-black mb-3">{t("account.paymentHistory")}</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">{t("account.paymentDate")}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">{t("account.paymentAmount")}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">{t("account.paymentMethod")}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">{t("account.paymentStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistoryData.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-600">{p.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-black">{p.amount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t(`accountPage.method_${p.methodKey}`)}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${p.statusColor}`}>{t(`account.${p.statusKey}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function B2bLoyaltySection() {
  const { t } = useLanguage();
  return (
    <>
      <h1 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("account.loyaltyProgram")}</h1>

      <div className="bg-white rounded-sm shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-black flex items-center gap-2"><Award className="w-5 h-5 text-secondary" /> {t("accountPage.yourLevel")}</h3>
          <span className="text-sm text-secondary font-medium px-3 py-1 bg-stone-50 rounded-full">{t(loyaltyLevelKeys[currentLevelIndex])}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
          <div className="bg-gradient-to-r from-[#735b28] to-[#b07a87] h-3 rounded-full" style={{ width: `${(currentPoints / nextLevelThreshold) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{currentPoints.toLocaleString("sr-RS")} {t("account.points")}</span>
          <span>{nextLevelThreshold.toLocaleString("sr-RS")} {t("accountPage.forLevel")} {t(loyaltyLevelKeys[currentLevelIndex + 1]) || "max"} {t("accountPage.level")}</span>
        </div>
        <p className="text-sm text-gray-500 mt-3">{t("accountPage.pointsRemaining").replace("{points}", (nextLevelThreshold - currentPoints).toLocaleString("sr-RS"))}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {loyaltyLevelKeys.map((levelKey, idx) => (
            <div key={levelKey} className={`rounded-sm p-4 border-2 transition-all ${idx === currentLevelIndex ? "border-black bg-stone-50" : idx < currentLevelIndex ? "border-green-200 bg-green-50/50" : "border-gray-100 bg-gray-50/50"}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-semibold text-sm ${idx === currentLevelIndex ? "text-secondary" : "text-black"}`}>{t(levelKey)}</h4>
                {idx === currentLevelIndex && <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">{t("accountPage.current")}</span>}
                {idx < currentLevelIndex && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
              <p className="text-[10px] text-gray-400 mb-2">{loyaltyLevelMeta[idx].min.toLocaleString("sr-RS")} - {loyaltyLevelMeta[idx].max.toLocaleString("sr-RS")} {t("account.points")}</p>
              <ul className="space-y-1">
                {loyaltyBenefitKeys[idx].map((bKey) => (
                  <li key={bKey} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-secondary mt-0.5">&#8226;</span> {t(bKey)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">{t("accountPage.currentPointBalance")}</span>
            <p className="text-2xl font-bold text-secondary">{currentPoints.toLocaleString("sr-RS")} <span className="text-sm font-normal text-gray-400">{t("account.points")}</span></p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">{t("accountPage.discountValue")}</span>
            <p className="text-lg font-bold text-black">{(currentPoints * 10).toLocaleString("sr-RS")} RSD</p>
          </div>
        </div>
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
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-secondary">{t("accountPage.breadcrumbHome")}</Link><ChevronRight className="w-3 h-3" /><span className="text-black">{t("accountPage.breadcrumbAccount")}</span>
        </nav>

        {/* B2B Debt Warning */}
        {isB2b && currentDebt > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">{t("accountPage.debtWarning").replace("{amount}", currentDebt.toLocaleString("sr-RS"))}</p>
            </div>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors flex-shrink-0">{t("accountPage.payOnline")}</button>
          </div>
        )}

        <div className="flex gap-8">
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-sm shadow-sm p-4 mb-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#735b28] to-[#594312] flex items-center justify-center text-white font-bold text-lg">{userInitials}</div>
                <div>
                  <h3 className="font-semibold text-black">{userName}</h3>
                  <span className="text-xs text-secondary">{userLabel}</span>
                </div>
              </div>
              <nav className="space-y-1">
                {sidebarNavKeys.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.key} onClick={() => setActiveSection(item.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${activeSection === item.key ? "bg-stone-50 text-secondary" : "text-gray-600 hover:bg-gray-50 hover:text-black"}`}>
                      <Icon className="w-4 h-4" /> {t(item.labelKey)}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Order shortcut for B2B */}
            {isB2b && (
              <Link href="/quick-order" className="flex items-center gap-2 w-full px-4 py-3 mb-4 bg-stone-50 rounded-sm text-sm font-medium text-secondary hover:bg-black hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" /> {t("accountPage.quickOrder")}
              </Link>
            )}

            {/* Language selector */}
            <div className="bg-white rounded-sm shadow-sm p-4 mb-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> {t("common.language")}
              </h4>
              <div className="space-y-1">
                {(["sr", "en", "ru"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors ${
                      language === lang
                        ? "bg-stone-50 text-secondary font-medium"
                        : "text-gray-600 hover:bg-gray-50"
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
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[#c0392b] transition-colors py-2"
            >
              <LogOut className="w-4 h-4" /> {t("account.logout")}
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1">
            {/* Mobile nav */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6">
              {sidebarNavKeys.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} onClick={() => setActiveSection(item.key)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeSection === item.key ? "bg-black text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                    <Icon className="w-3.5 h-3.5" /> {t(item.labelKey)}
                  </button>
                );
              })}
              <button
                onClick={() => signOut({ callbackUrl: "/account/login" })}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap bg-white text-red-500 border border-gray-200"
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
