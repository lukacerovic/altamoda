"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Package, Star, CreditCard,
  RotateCcw, Award, ChevronRight, TrendingUp, AlertTriangle,
  CheckCircle, BarChart3, Percent, Heart,
} from "lucide-react";

const sidebarNav = [
  { key: "dashboard", label: "Kontrolna tabla", icon: LayoutDashboard },
  { key: "orders", label: "Porudzbine", icon: Package },
  { key: "wishlist", label: "Lista zelja", icon: Heart },
  { key: "prices", label: "B2B Cene", icon: CreditCard },
  { key: "repeat", label: "Repeat Order", icon: RotateCcw },
  { key: "balance", label: "Dugovanja", icon: TrendingUp },
  { key: "loyalty", label: "Loyalty", icon: Award },
  { key: "rabati", label: "Rabati", icon: Percent },
];

const stats = [
  { label: "Ukupno porudzbina", value: "47", icon: Package, color: "bg-blue-50 text-blue-600" },
  { label: "Loyalty poeni", value: "2.340", icon: Star, color: "bg-amber-50 text-amber-600" },
  { label: "B2B Status", value: "Gold", icon: Award, color: "bg-[#faf7f2] text-[#c8a96e]" },
  { label: "Stanje dugovanja", value: "12.500 RSD", icon: CreditCard, color: "bg-green-50 text-green-600" },
];

const recentOrders = [
  { id: "ALT-2026-0341", date: "15. mar 2026", items: 5, total: "24.500 RSD", status: "Isporuceno", statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0328", date: "10. mar 2026", items: 3, total: "15.200 RSD", status: "U transportu", statusColor: "bg-blue-100 text-blue-700" },
  { id: "ALT-2026-0315", date: "5. mar 2026", items: 8, total: "42.100 RSD", status: "Isporuceno", statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0298", date: "28. feb 2026", items: 2, total: "8.400 RSD", status: "Isporuceno", statusColor: "bg-green-100 text-green-700" },
  { id: "ALT-2026-0285", date: "22. feb 2026", items: 12, total: "56.800 RSD", status: "Isporuceno", statusColor: "bg-green-100 text-green-700" },
];

const loyaltyLevels = [
  { name: "Bronzani", min: 0, max: 1000, benefits: ["5% popust na sve proizvode", "Besplatna dostava preko 7.000 RSD", "Pristup newsletter promocijama"] },
  { name: "Srebrni", min: 1000, max: 2000, benefits: ["8% popust na sve proizvode", "Besplatna dostava preko 5.000 RSD", "Rani pristup akcijama", "Besplatni uzorci uz porudzbinu"] },
  { name: "Zlatni", min: 2000, max: 3500, benefits: ["12% popust na sve proizvode", "Besplatna dostava", "Prioritetna podrska", "Ekskluzivni seminari", "Poklon za rodjendan"] },
  { name: "Platinasti", min: 3500, max: 5000, benefits: ["15% popust na sve proizvode", "Besplatna ekspres dostava", "Licni konsultant", "VIP pristup dogadjajima", "Besplatni seminari", "Mesecni poklon paket"] },
];

const paymentHistory = [
  { date: "12. mar 2026", amount: "24.500 RSD", method: "Kartica", status: "Placeno", statusColor: "text-green-600" },
  { date: "5. mar 2026", amount: "42.100 RSD", method: "Faktura", status: "Placeno", statusColor: "text-green-600" },
  { date: "28. feb 2026", amount: "8.400 RSD", method: "Kartica", status: "Placeno", statusColor: "text-green-600" },
  { date: "15. feb 2026", amount: "12.500 RSD", method: "Faktura", status: "Neplaceno", statusColor: "text-red-600" },
  { date: "1. feb 2026", amount: "31.200 RSD", method: "Kartica", status: "Placeno", statusColor: "text-green-600" },
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
const currentLevelIndex = 2; // Zlatni
const nextLevelThreshold = 3500;

export default function AccountPage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [repeatConfirm, setRepeatConfirm] = useState<string | null>(null);

  const maxSpending = Math.max(...monthlySpending.map((m) => m.amount));

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#c8a96e]">Pocetna</Link><ChevronRight className="w-3 h-3" /><span className="text-[#1a1a1a]">Moj Nalog</span>
        </nav>

        {/* Debt Warning Banner */}
        {currentDebt > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">Imate neizmireno dugovanje od {currentDebt.toLocaleString("sr-RS")} RSD. Molimo izvršite uplatu da biste nastavili sa naručivanjem.</p>
            </div>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors flex-shrink-0">Uplati online</button>
          </div>
        )}

        <div className="flex gap-8">
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c8a96e] to-[#a8894e] flex items-center justify-center text-white font-bold text-lg">JM</div>
                <div>
                  <h3 className="font-semibold text-[#1a1a1a]">Jelena Markovic</h3>
                  <span className="text-xs text-[#c8a96e]">B2B Gold Partner</span>
                </div>
              </div>
              <nav className="space-y-1">
                {sidebarNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.key} onClick={() => setActiveSection(item.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${activeSection === item.key ? "bg-[#faf7f2] text-[#c8a96e]" : "text-gray-600 hover:bg-gray-50 hover:text-[#1a1a1a]"}`}>
                      <Icon className="w-4 h-4" /> {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <button className="w-full text-sm text-gray-400 hover:text-[#c0392b] transition-colors py-2">Odjavite se</button>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1">
            {/* Mobile nav */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} onClick={() => setActiveSection(item.key)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeSection === item.key ? "bg-[#c8a96e] text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                    <Icon className="w-3.5 h-3.5" /> {item.label}
                  </button>
                );
              })}
            </div>

            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Kontrolna Tabla</h1>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white rounded-lg shadow-sm p-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}><Icon className="w-5 h-5" /></div>
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <p className="text-xl font-bold text-[#1a1a1a] mt-1">{s.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Loyalty System Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1a1a1a] flex items-center gap-2"><Award className="w-5 h-5 text-[#c8a96e]" /> Loyalty Program</h3>
                <span className="text-sm text-[#c8a96e] font-medium px-3 py-1 bg-[#faf7f2] rounded-full">{loyaltyLevels[currentLevelIndex].name} Nivo</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                <div className="bg-gradient-to-r from-[#c8a96e] to-[#e8d5b0] h-3 rounded-full" style={{ width: `${(currentPoints / nextLevelThreshold) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{currentPoints.toLocaleString("sr-RS")} poena</span>
                <span>{nextLevelThreshold.toLocaleString("sr-RS")} za {loyaltyLevels[currentLevelIndex + 1]?.name || "max"} nivo</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">Jos {(nextLevelThreshold - currentPoints).toLocaleString("sr-RS")} poena do sledeceg nivoa. Svaka kupovina od 100 RSD donosi 1 poen.</p>

              {/* Level Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {loyaltyLevels.map((level, idx) => (
                  <div key={level.name} className={`rounded-lg p-4 border-2 transition-all ${idx === currentLevelIndex ? "border-[#c8a96e] bg-[#faf7f2]" : idx < currentLevelIndex ? "border-green-200 bg-green-50/50" : "border-gray-100 bg-gray-50/50"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold text-sm ${idx === currentLevelIndex ? "text-[#c8a96e]" : "text-[#1a1a1a]"}`}>{level.name}</h4>
                      {idx === currentLevelIndex && <span className="text-[10px] bg-[#c8a96e] text-white px-2 py-0.5 rounded-full">Trenutni</span>}
                      {idx < currentLevelIndex && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2">{level.min.toLocaleString("sr-RS")} - {level.max.toLocaleString("sr-RS")} poena</p>
                    <ul className="space-y-1">
                      {level.benefits.map((b) => (
                        <li key={b} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-[#c8a96e] mt-0.5">&#8226;</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Points Balance */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500">Trenutni balans poena</span>
                  <p className="text-2xl font-bold text-[#c8a96e]">{currentPoints.toLocaleString("sr-RS")} <span className="text-sm font-normal text-gray-400">poena</span></p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Vrednost u popustu</span>
                  <p className="text-lg font-bold text-[#1a1a1a]">{(currentPoints * 10).toLocaleString("sr-RS")} RSD</p>
                </div>
              </div>
            </div>

            {/* Debt/Balance Section (B2B) */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1a1a1a] flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#c8a96e]" /> Stanje i Dugovanja (B2B)</h3>
                <button className="px-4 py-2 bg-[#c8a96e] hover:bg-[#a8894e] text-white text-sm font-medium rounded transition-colors">Uplati online</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <span className="text-xs text-gray-500">Neizmireno dugovanje</span>
                  <p className="text-xl font-bold text-red-600 mt-1">{currentDebt.toLocaleString("sr-RS")} RSD</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="text-xs text-gray-500">Ukupno placeno (2026)</span>
                  <p className="text-xl font-bold text-green-600 mt-1">317.200 RSD</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <span className="text-xs text-gray-500">Kreditni limit</span>
                  <p className="text-xl font-bold text-blue-600 mt-1">500.000 RSD</p>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3">Istorija placanja</h4>
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
                        <td className="px-4 py-3 text-sm font-medium text-[#1a1a1a]">{p.amount}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.method}</td>
                        <td className={`px-4 py-3 text-sm font-medium ${p.statusColor}`}>{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Purchase History Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="font-semibold text-[#1a1a1a] flex items-center gap-2 mb-6"><BarChart3 className="w-5 h-5 text-[#c8a96e]" /> Mesecna potrosnja (poslednjih 6 meseci)</h3>
              <div className="flex items-end gap-4 h-48">
                {monthlySpending.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-[#1a1a1a]">{(m.amount / 1000).toFixed(0)}k</span>
                    <div className="w-full bg-gray-100 rounded-t relative" style={{ height: `${(m.amount / maxSpending) * 100}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#c8a96e] to-[#e8d5b0] rounded-t" />
                    </div>
                    <span className="text-xs text-gray-500">{m.month}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Ukupno za period:</span>
                <span className="font-bold text-[#1a1a1a]">{monthlySpending.reduce((s, m) => s + m.amount, 0).toLocaleString("sr-RS")} RSD</span>
              </div>
            </div>

            {/* Rabati (Discounts) Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="font-semibold text-[#1a1a1a] flex items-center gap-2 mb-4"><Percent className="w-5 h-5 text-[#c8a96e]" /> B2B Rabatna Skala</h3>
              <p className="text-sm text-gray-500 mb-4">Vasi popusti zavise od ukupnog mesecnog prometa. Trenutni mesecni promet: <strong className="text-[#1a1a1a]">142.500 RSD</strong></p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Mesecni promet</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Rabat</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rabatScale.map((r, i) => {
                      const isActive = i === 2; // 100-200k range active
                      return (
                        <tr key={r.range} className={`border-b border-gray-50 ${isActive ? "bg-[#faf7f2]" : "hover:bg-gray-50/50"}`}>
                          <td className="px-4 py-3 text-sm text-gray-600">{r.range}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[#1a1a1a]">{r.discount}</td>
                          <td className="px-4 py-3">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#c8a96e] text-white text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> Aktivan</span>
                            ) : i < 2 ? (
                              <span className="text-xs text-gray-400">Ostvaren</span>
                            ) : (
                              <span className="text-xs text-gray-400">Jos {i === 3 ? "57.500" : ""} RSD</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Orders with Repeat Order button */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="flex items-center justify-between p-6 pb-4">
                <h3 className="font-semibold text-[#1a1a1a]">Poslednje Porudzbine</h3>
                <button className="text-sm text-[#c8a96e] hover:text-[#a8894e] font-medium">Pogledaj sve</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-t border-gray-100">
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
                        <td className="px-6 py-4 text-sm font-medium text-[#1a1a1a]">{order.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{order.items} stavki</td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#1a1a1a]">{order.total}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>{order.status}</span></td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setRepeatConfirm(order.id)}
                            className="text-xs text-[#c8a96e] hover:text-[#a8894e] font-medium flex items-center gap-1 px-3 py-1.5 border border-[#c8a96e] rounded hover:bg-[#c8a96e] hover:text-white transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" /> Ponovi porudzbinu
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Repeat Order Confirmation */}
            {repeatConfirm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRepeatConfirm(null)}>
                <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Ponovi porudzbinu</h3>
                  <p className="text-sm text-gray-500 mb-4">Da li zelite da kopirate sve stavke iz porudzbine <strong>{repeatConfirm}</strong> u korpu?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setRepeatConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-50 transition-colors">Otkazi</button>
                    <Link href="/cart" onClick={() => setRepeatConfirm(null)} className="flex-1 px-4 py-2.5 bg-[#c8a96e] hover:bg-[#a8894e] text-white rounded text-sm font-medium transition-colors text-center">Dodaj u korpu</Link>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Reorder */}
            <div className="bg-[#faf7f2] rounded-lg p-6 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-[#1a1a1a] mb-1">Brza Ponovljena Narudzbina</h3>
                <p className="text-sm text-gray-500">Ponovite poslednju porudzbinu jednim klikom ili koristite brzu narudzbinu po sifri proizvoda.</p>
              </div>
              <div className="flex gap-3">
                <Link href="/quick-order" className="px-4 py-2.5 bg-[#c8a96e] hover:bg-[#a8894e] text-white rounded text-sm font-medium transition-colors">Brza Narudzbina</Link>
                <button className="px-4 py-2.5 border border-[#c8a96e] text-[#c8a96e] hover:bg-[#c8a96e] hover:text-white rounded text-sm font-medium transition-colors flex items-center gap-1">
                  <RotateCcw className="w-4 h-4" /> Ponovi Poslednju
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
