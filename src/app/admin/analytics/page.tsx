"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
  MapPin,
} from "lucide-react";

const timeRanges = [
  { value: "7d", label: "7 dana" },
  { value: "30d", label: "30 dana" },
  { value: "90d", label: "90 dana" },
  { value: "1y", label: "1 godina" },
];

const revenueByMonth = [
  { month: "Sep", value: 72 },
  { month: "Okt", value: 85 },
  { month: "Nov", value: 65 },
  { month: "Dec", value: 95 },
  { month: "Jan", value: 58 },
  { month: "Feb", value: 78 },
  { month: "Mar", value: 88 },
];

const categoryData = [
  { name: "Nega kose", value: 35, color: "#c8a96e" },
  { name: "Boje za kosu", value: 28, color: "#1a1a1a" },
  { name: "Styling", value: 18, color: "#666666" },
  { name: "Ulja i serumi", value: 12, color: "#e8d5b0" },
  { name: "Oprema", value: 7, color: "#a8894e" },
];

const brandPerformance = [
  { brand: "L'Oréal", revenue: 1245000, orders: 342, growth: 15.2 },
  { brand: "Schwarzkopf", revenue: 980000, orders: 298, growth: 8.7 },
  { brand: "Kérastase", revenue: 856000, orders: 156, growth: 22.4 },
  { brand: "Wella", revenue: 654000, orders: 187, growth: -3.2 },
  { brand: "Moroccanoil", revenue: 523000, orders: 134, growth: 12.8 },
];

const acquisitionData = [
  { source: "Direktan pristup", value: 35 },
  { source: "Google pretraga", value: 28 },
  { source: "Društvene mreže", value: 20 },
  { source: "Email kampanje", value: 12 },
  { source: "Preporuke", value: 5 },
];

const b2bVsB2c = {
  b2b: { revenue: 3458000, orders: 245, avgOrder: 14114, percentage: 62 },
  b2c: { revenue: 2124000, orders: 872, avgOrder: 2436, percentage: 38 },
};

const cityData = [
  { city: "Beograd", orders: 456, revenue: 2845000, percentage: 42 },
  { city: "Novi Sad", orders: 234, revenue: 1234000, percentage: 22 },
  { city: "Niš", orders: 123, revenue: 654000, percentage: 12 },
  { city: "Kragujevac", orders: 89, revenue: 423000, percentage: 8 },
  { city: "Subotica", orders: 67, revenue: 312000, percentage: 6 },
  { city: "Novi Pazar", orders: 45, revenue: 198000, percentage: 4 },
  { city: "Čačak", orders: 34, revenue: 156000, percentage: 3 },
  { city: "Ostali", orders: 69, revenue: 178000, percentage: 3 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1a1a1a]">Analitika</h1>
          <p className="text-sm text-[#666] mt-1">Pregled performansi poslovanja</p>
        </div>
        <div className="flex bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
          {timeRanges.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setTimeRange(tr.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === tr.value
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666] hover:bg-[#f5f5f5]"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><DollarSign size={20} /></div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600"><TrendingUp size={14} /> +14.5%</div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">5.582.000 RSD</p>
          <p className="text-sm text-[#666] mt-1">Ukupan prihod</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><ShoppingCart size={20} /></div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600"><TrendingUp size={14} /> +8.3%</div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">1.117</p>
          <p className="text-sm text-[#666] mt-1">Ukupno porudžbina</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Users size={20} /></div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600"><TrendingUp size={14} /> +23.1%</div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">348</p>
          <p className="text-sm text-[#666] mt-1">Ukupno korisnika</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600"><BarChart3 size={20} /></div>
            <div className="flex items-center gap-1 text-xs font-medium text-red-500"><TrendingDown size={14} /> -2.1%</div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">4.997 RSD</p>
          <p className="text-sm text-[#666] mt-1">Prosečna porudžbina</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-6">
        <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Pregled Prihoda</h2>
        <div className="flex items-end gap-4 h-56">
          {revenueByMonth.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-[#1a1a1a]">{item.value}%</span>
              <div className="w-full relative" style={{ height: "180px" }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-[#c8a96e] to-[#e8d5b0] transition-all duration-700 hover:from-[#a8894e] hover:to-[#c8a96e]"
                  style={{ height: `${item.value}%` }}
                />
              </div>
              <span className="text-xs text-[#666] font-medium">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories + B2B vs B2C */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Top Kategorije</h2>
          <div className="space-y-4">
            {categoryData.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium text-[#333]">{cat.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1a1a1a]">{cat.value}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#f0f0f0] rounded-full">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.value}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* B2B vs B2C */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">B2B vs B2C Prodaja</h2>

          {/* Visual bar */}
          <div className="h-8 rounded-full overflow-hidden flex mb-6">
            <div className="bg-[#1a1a1a] h-full flex items-center justify-center text-white text-xs font-semibold" style={{ width: `${b2bVsB2c.b2b.percentage}%` }}>
              B2B {b2bVsB2c.b2b.percentage}%
            </div>
            <div className="bg-[#c8a96e] h-full flex items-center justify-center text-white text-xs font-semibold" style={{ width: `${b2bVsB2c.b2c.percentage}%` }}>
              B2C {b2bVsB2c.b2c.percentage}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#1a1a1a]">
              <p className="text-xs font-semibold text-[#c8a96e] uppercase tracking-wider mb-3">B2B</p>
              <div className="space-y-2">
                <div>
                  <p className="text-lg font-bold text-white">{(b2bVsB2c.b2b.revenue / 1000000).toFixed(1)}M RSD</p>
                  <p className="text-xs text-white/50">Prihod</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{b2bVsB2c.b2b.orders}</p>
                  <p className="text-xs text-white/50">Porudžbine</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#c8a96e]">{b2bVsB2c.b2b.avgOrder.toLocaleString()} RSD</p>
                  <p className="text-xs text-white/50">Prosečna korpa</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[#c8a96e]/10 border border-[#c8a96e]/20">
              <p className="text-xs font-semibold text-[#c8a96e] uppercase tracking-wider mb-3">B2C</p>
              <div className="space-y-2">
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a]">{(b2bVsB2c.b2c.revenue / 1000000).toFixed(1)}M RSD</p>
                  <p className="text-xs text-[#999]">Prihod</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1a1a1a]">{b2bVsB2c.b2c.orders}</p>
                  <p className="text-xs text-[#999]">Porudžbine</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#c8a96e]">{b2bVsB2c.b2c.avgOrder.toLocaleString()} RSD</p>
                  <p className="text-xs text-[#999]">Prosečna korpa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Performance + Customer Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Performance */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Performanse Brendova</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e5e5]">
                  <th className="pb-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Brend</th>
                  <th className="pb-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Prihod</th>
                  <th className="pb-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">Porudžbine</th>
                  <th className="pb-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Rast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {brandPerformance.map((brand) => (
                  <tr key={brand.brand}>
                    <td className="py-3 text-sm font-medium text-[#1a1a1a]">{brand.brand}</td>
                    <td className="py-3 text-sm text-[#333]">{(brand.revenue / 1000).toFixed(0)}k RSD</td>
                    <td className="py-3 text-sm text-[#666] hidden sm:table-cell">{brand.orders}</td>
                    <td className="py-3">
                      <div className={`flex items-center gap-1 text-sm font-medium ${brand.growth > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {brand.growth > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {brand.growth > 0 ? "+" : ""}{brand.growth}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Acquisition */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Akvizicija Korisnika</h2>
          <div className="space-y-4">
            {acquisitionData.map((source) => (
              <div key={source.source}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#333]">{source.source}</span>
                  <span className="text-sm font-semibold text-[#1a1a1a]">{source.value}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#f0f0f0] rounded-full">
                  <div className="h-full bg-[#c8a96e] rounded-full transition-all duration-700" style={{ width: `${source.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-[#f0f0f0]">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1a1a1a]">67%</p>
                <p className="text-xs text-[#999] mt-1">Stopa zadržavanja</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1a1a1a]">2.4</p>
                <p className="text-xs text-[#999] mt-1">Prosečne porudžbine po korisniku</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-6">
        <div className="flex items-center gap-2 mb-6">
          <MapPin size={20} className="text-[#c8a96e]" />
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Geografska Distribucija</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cityData.map((city) => (
            <div key={city.city} className="p-4 rounded-lg border border-[#e5e5e5] hover:border-[#c8a96e] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-[#1a1a1a]">{city.city}</h4>
                <span className="text-xs font-medium text-[#c8a96e]">{city.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full mb-3">
                <div className="h-full bg-[#c8a96e] rounded-full" style={{ width: `${city.percentage}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-[#999]">
                <span>{city.orders} porudžbina</span>
                <span>{(city.revenue / 1000).toFixed(0)}k RSD</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
