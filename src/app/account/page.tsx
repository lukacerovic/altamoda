"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Package, Heart, ChevronRight, RotateCcw, LogOut,
  CreditCard, TrendingUp, Award, Percent, CheckCircle,
  BarChart3, AlertTriangle,
} from "lucide-react";

// ─── Mock Data ───

const recentOrders = [
  { id: "ALT-2026-0341", date: "15. mar 2026", items: 5, total: "24.500 RSD", status: "Isporučeno", statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0328", date: "10. mar 2026", items: 3, total: "15.200 RSD", status: "U transportu", statusColor: "bg-blue-100 text-blue-700" },
  { id: "ALT-2026-0315", date: "5. mar 2026", items: 8, total: "42.100 RSD", status: "Isporučeno", statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0298", date: "28. feb 2026", items: 2, total: "8.400 RSD", status: "Isporučeno", statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0285", date: "22. feb 2026", items: 12, total: "56.800 RSD", status: "Isporučeno", statusColor: "bg-green-100 text-green-700" },
];

// wishlist items are now fetched from API dynamically

const loyaltyLevels = [
  { name: "Bronzani", min: 0, max: 1000, benefits: ["5% popust na sve proizvode", "Besplatna dostava preko 7.000 RSD", "Pristup newsletter promocijama"] },
  { name: "Srebrni", min: 1000, max: 2000, benefits: ["8% popust na sve proizvode", "Besplatna dostava preko 5.000 RSD", "Rani pristup akcijama", "Besplatni uzorci uz porudžbinu"] },
  { name: "Zlatni", min: 2000, max: 3500, benefits: ["12% popust na sve proizvode", "Besplatna dostava", "Prioritetna podrška", "Poklon za rođendan"] },
  { name: "Platinasti", min: 3500, max: 5000, benefits: ["15% popust na sve proizvode", "Besplatna ekspres dostava", "Lični konsultant", "VIP pristup događajima", "Mesečni poklon paket"] },
];

const paymentHistory = [
  { date: "12. mar 2026", amount: "24.500 RSD", method: "Kartica", status: "Plaćeno", statusColor: "text-green-600" },
  { date: "5. mar 2026", amount: "42.100 RSD", method: "Faktura", status: "Plaćeno", statusColor: "text-green-600" },
  { date: "28. feb 2026", amount: "8.400 RSD", method: "Kartica", status: "Plaćeno", statusColor: "text-green-600" },
  { date: "15. feb 2026", amount: "12.500 RSD", method: "Faktura", status: "Neplaćeno", statusColor: "text-red-600" },
  { date: "1. feb 2026", amount: "31.200 RSD", method: "Kartica", status: "Plaćeno", statusColor: "text-green-600" },
];

const rabatScale = [
  { range: "0 - 50.000 RSD", discount: "5%" },
  { range: "50.000 - 100.000 RSD", discount: "8%" },
  { range: "100.000 - 200.000 RSD", discount: "12%" },
  { range: "200.000+ RSD", discount: "15%" },
];

const monthlySpending = [
  { month: "Okt", amount: 45000 },
  { month: "Nov", amount: 62000 },
  { month: "Dec", amount: 78000 },
  { month: "Jan", amount: 34000 },
  { month: "Feb", amount: 56000 },
  { month: "Mar", amount: 42000 },
];

const currentDebt = 12500;
const currentPoints = 2340;
const currentLevelIndex = 2;
const nextLevelThreshold = 3500;

// ─── Sidebar configs per role ───

const b2cNav = [
  { key: "orders", label: "Porudžbine", icon: Package },
  { key: "wishlist", label: "Lista želja", icon: Heart },
];

const b2bNav = [
  { key: "orders", label: "Porudžbine", icon: Package },
  { key: "wishlist", label: "Lista želja", icon: Heart },
  { key: "prices", label: "B2B Cene / Rabati", icon: Percent },
  { key: "balance", label: "Stanje i dugovanja", icon: TrendingUp },
  { key: "loyalty", label: "Loyalty program", icon: Award },
];

// ─── Sub-components ───

function OrdersSection({ onRepeat }: { onRepeat: (id: string) => void }) {
  return (
    <>
      <h1 className="text-2xl font-bold text-[#2d2d2d] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Moje Porudžbine</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Broj</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Datum</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Stavke</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Ukupno</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-[#2d2d2d]">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.items} stavki</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#2d2d2d]">{order.total}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>{order.status}</span></td>
                  <td className="px-6 py-4">
                    <button onClick={() => onRepeat(order.id)} className="text-xs text-[#8c4a5a] hover:text-[#6e3848] font-medium flex items-center gap-1 px-3 py-1.5 border border-[#8c4a5a] rounded hover:bg-[#8c4a5a] hover:text-white transition-colors">
                      <RotateCcw className="w-3 h-3" /> Ponovi
                    </button>
                  </td>
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
  const [wishlistItems, setWishlistItems] = useState<{
    productId: string; name: string; brand: string; price: number; oldPrice: number | null; image: string; slug: string; inStock: boolean;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setWishlistItems(data.data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2d2d2d]" style={{ fontFamily: "'Playfair Display', serif" }}>Lista Želja</h1>
        <Link href="/wishlist" className="text-sm text-[#8c4a5a] hover:text-[#6e3848] font-medium flex items-center gap-1">
          Pogledaj sve <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-sm text-gray-500">Učitavanje...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">Lista želja je prazna</h3>
          <p className="text-sm text-gray-500 mb-4">Dodajte proizvode u listu želja klikom na srce.</p>
          <Link href="/products" className="inline-block px-6 py-2.5 bg-[#8c4a5a] hover:bg-[#6e3848] text-white rounded text-sm font-medium transition-colors">Pregledajte proizvode</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => (
            <Link key={item.productId} href={`/products/${item.slug}`} className="bg-white rounded-lg shadow-sm overflow-hidden group">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                </div>
                {!item.inStock && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="px-4 py-2 bg-[#333] text-white text-xs font-semibold rounded-full">Nema na lageru</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-gray-400">{item.brand}</span>
                <h4 className="text-sm font-medium text-[#2d2d2d] mt-1">{item.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-[#8c4a5a]">{item.price.toLocaleString("sr-RS")} RSD</span>
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
  return (
    <>
      <h1 className="text-2xl font-bold text-[#2d2d2d] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>B2B Cene i Rabati</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-[#2d2d2d] flex items-center gap-2 mb-4"><Percent className="w-5 h-5 text-[#8c4a5a]" /> Rabatna Skala</h3>
        <p className="text-sm text-gray-500 mb-4">Vaši popusti zavise od ukupnog mesečnog prometa. Trenutni mesečni promet: <strong className="text-[#2d2d2d]">142.500 RSD</strong></p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Mesečni promet</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Rabat</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rabatScale.map((r, i) => {
                const isActive = i === 2;
                return (
                  <tr key={r.range} className={`border-b border-gray-50 ${isActive ? "bg-[#faf7f2]" : "hover:bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.range}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#2d2d2d]">{r.discount}</td>
                    <td className="px-4 py-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#8c4a5a] text-white text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> Aktivan</span>
                      ) : i < 2 ? (
                        <span className="text-xs text-green-600">Ostvaren</span>
                      ) : (
                        <span className="text-xs text-gray-400">Još {i === 3 ? "57.500 RSD" : ""}</span>
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-[#2d2d2d] flex items-center gap-2 mb-6"><BarChart3 className="w-5 h-5 text-[#8c4a5a]" /> Mesečna potrošnja</h3>
        <div className="flex items-end gap-4 h-48">
          {monthlySpending.map((m) => {
            const maxSpending = Math.max(...monthlySpending.map((s) => s.amount));
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-[#2d2d2d]">{(m.amount / 1000).toFixed(0)}k</span>
                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: `${(m.amount / maxSpending) * 100}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#8c4a5a] to-[#b07a87] rounded-t" />
                </div>
                <span className="text-xs text-gray-500">{m.month}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500">Ukupno za period:</span>
          <span className="font-bold text-[#2d2d2d]">{monthlySpending.reduce((s, m) => s + m.amount, 0).toLocaleString("sr-RS")} RSD</span>
        </div>
      </div>
    </>
  );
}

function B2bBalanceSection() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[#2d2d2d] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Stanje i Dugovanja</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <span className="text-xs text-gray-500">Neizmireno dugovanje</span>
            <p className="text-xl font-bold text-red-600 mt-1">{currentDebt.toLocaleString("sr-RS")} RSD</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <span className="text-xs text-gray-500">Ukupno plaćeno (2026)</span>
            <p className="text-xl font-bold text-green-600 mt-1">317.200 RSD</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <span className="text-xs text-gray-500">Kreditni limit</span>
            <p className="text-xl font-bold text-blue-600 mt-1">500.000 RSD</p>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-[#2d2d2d] mb-3">Istorija plaćanja</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Datum</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Iznos</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Metod</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-600">{p.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#2d2d2d]">{p.amount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.method}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${p.statusColor}`}>{p.status}</td>
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
  return (
    <>
      <h1 className="text-2xl font-bold text-[#2d2d2d] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Loyalty Program</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#2d2d2d] flex items-center gap-2"><Award className="w-5 h-5 text-[#8c4a5a]" /> Vaš nivo</h3>
          <span className="text-sm text-[#8c4a5a] font-medium px-3 py-1 bg-[#faf7f2] rounded-full">{loyaltyLevels[currentLevelIndex].name}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
          <div className="bg-gradient-to-r from-[#8c4a5a] to-[#b07a87] h-3 rounded-full" style={{ width: `${(currentPoints / nextLevelThreshold) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{currentPoints.toLocaleString("sr-RS")} poena</span>
          <span>{nextLevelThreshold.toLocaleString("sr-RS")} za {loyaltyLevels[currentLevelIndex + 1]?.name || "max"} nivo</span>
        </div>
        <p className="text-sm text-gray-500 mt-3">Još {(nextLevelThreshold - currentPoints).toLocaleString("sr-RS")} poena do sledećeg nivoa. Svaka kupovina od 100 RSD donosi 1 poen.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {loyaltyLevels.map((level, idx) => (
            <div key={level.name} className={`rounded-lg p-4 border-2 transition-all ${idx === currentLevelIndex ? "border-[#8c4a5a] bg-[#faf7f2]" : idx < currentLevelIndex ? "border-green-200 bg-green-50/50" : "border-gray-100 bg-gray-50/50"}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-semibold text-sm ${idx === currentLevelIndex ? "text-[#8c4a5a]" : "text-[#2d2d2d]"}`}>{level.name}</h4>
                {idx === currentLevelIndex && <span className="text-[10px] bg-[#8c4a5a] text-white px-2 py-0.5 rounded-full">Trenutni</span>}
                {idx < currentLevelIndex && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
              <p className="text-[10px] text-gray-400 mb-2">{level.min.toLocaleString("sr-RS")} - {level.max.toLocaleString("sr-RS")} poena</p>
              <ul className="space-y-1">
                {level.benefits.map((b) => (
                  <li key={b} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-[#8c4a5a] mt-0.5">&#8226;</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Trenutni balans poena</span>
            <p className="text-2xl font-bold text-[#8c4a5a]">{currentPoints.toLocaleString("sr-RS")} <span className="text-sm font-normal text-gray-400">poena</span></p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">Vrednost u popustu</span>
            <p className="text-lg font-bold text-[#2d2d2d]">{(currentPoints * 10).toLocaleString("sr-RS")} RSD</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ───

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState("orders");
  const [repeatConfirm, setRepeatConfirm] = useState<string | null>(null);

  // Redirect admin to admin panel
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (status === "authenticated" && role === "admin") {
    redirect("/admin");
  }

  const isB2b = role === "b2b";
  const sidebarNav = isB2b ? b2bNav : b2cNav;

  const userName = session?.user?.name || "Korisnik";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const userLabel = isB2b ? "B2B Partner" : "Kupac";

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#8c4a5a]">Početna</Link><ChevronRight className="w-3 h-3" /><span className="text-[#2d2d2d]">Moj Nalog</span>
        </nav>

        {/* B2B Debt Warning */}
        {isB2b && currentDebt > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">Imate neizmireno dugovanje od {currentDebt.toLocaleString("sr-RS")} RSD.</p>
            </div>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors flex-shrink-0">Uplati online</button>
          </div>
        )}

        <div className="flex gap-8">
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8c4a5a] to-[#6e3848] flex items-center justify-center text-white font-bold text-lg">{userInitials}</div>
                <div>
                  <h3 className="font-semibold text-[#2d2d2d]">{userName}</h3>
                  <span className="text-xs text-[#8c4a5a]">{userLabel}</span>
                </div>
              </div>
              <nav className="space-y-1">
                {sidebarNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.key} onClick={() => setActiveSection(item.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${activeSection === item.key ? "bg-[#faf7f2] text-[#8c4a5a]" : "text-gray-600 hover:bg-gray-50 hover:text-[#2d2d2d]"}`}>
                      <Icon className="w-4 h-4" /> {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Order shortcut for B2B */}
            {isB2b && (
              <Link href="/quick-order" className="flex items-center gap-2 w-full px-4 py-3 mb-4 bg-[#faf7f2] rounded-lg text-sm font-medium text-[#8c4a5a] hover:bg-[#8c4a5a] hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" /> Brza narudžbina
              </Link>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/account/login" })}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[#c0392b] transition-colors py-2"
            >
              <LogOut className="w-4 h-4" /> Odjavite se
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1">
            {/* Mobile nav */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} onClick={() => setActiveSection(item.key)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeSection === item.key ? "bg-[#8c4a5a] text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                    <Icon className="w-3.5 h-3.5" /> {item.label}
                  </button>
                );
              })}
              <button
                onClick={() => signOut({ callbackUrl: "/account/login" })}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap bg-white text-red-500 border border-gray-200"
              >
                <LogOut className="w-3.5 h-3.5" /> Odjava
              </button>
            </div>

            {/* Sections */}
            {activeSection === "orders" && <OrdersSection onRepeat={setRepeatConfirm} />}
            {activeSection === "wishlist" && <WishlistSection />}
            {isB2b && activeSection === "prices" && <B2bPricesSection />}
            {isB2b && activeSection === "balance" && <B2bBalanceSection />}
            {isB2b && activeSection === "loyalty" && <B2bLoyaltySection />}
          </div>
        </div>
      </div>

      {/* Repeat Order Confirmation Modal */}
      {repeatConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRepeatConfirm(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#2d2d2d] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Ponovi porudžbinu</h3>
            <p className="text-sm text-gray-500 mb-4">Da li želite da kopirate sve stavke iz porudžbine <strong>{repeatConfirm}</strong> u korpu?</p>
            <div className="flex gap-3">
              <button onClick={() => setRepeatConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-50 transition-colors">Otkaži</button>
              <Link href="/cart" onClick={() => setRepeatConfirm(null)} className="flex-1 px-4 py-2.5 bg-[#8c4a5a] hover:bg-[#6e3848] text-white rounded text-sm font-medium transition-colors text-center">Dodaj u korpu</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
