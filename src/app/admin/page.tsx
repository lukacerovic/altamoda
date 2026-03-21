"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Eye,
  ArrowRight,
  Package,
  Plus,
  FileText,
  RefreshCw,
} from "lucide-react";

const topProducts = [
  { name: "L'Oréal Professionnel Serie Expert", brand: "L'Oréal", sold: 142, revenue: "354.800 RSD" },
  { name: "Schwarzkopf BC Bonacure", brand: "Schwarzkopf", sold: 98, revenue: "245.000 RSD" },
  { name: "Kérastase Elixir Ultime", brand: "Kérastase", sold: 87, revenue: "348.000 RSD" },
  { name: "Wella Professionals Oil Reflections", brand: "Wella", sold: 76, revenue: "152.000 RSD" },
  { name: "Moroccanoil Treatment", brand: "Moroccanoil", sold: 65, revenue: "227.500 RSD" },
];

const lowStock = [
  { name: "Kérastase Elixir Ultime 100ml", stock: 3, threshold: 10 },
  { name: "L'Oréal Majirel 50ml - 7.0", stock: 5, threshold: 15 },
  { name: "Schwarzkopf Igora Royal 60ml - 6.1", stock: 2, threshold: 10 },
  { name: "Wella Koleston Perfect 60ml - 8/0", stock: 4, threshold: 12 },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState("7dana");
  const { t } = useLanguage();

  const statCards = [
    {
      label: t("admin.totalSales"),
      value: "2.847.350 RSD",
      change: "+12.5%",
      up: true,
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: t("admin.ordersToday"),
      value: "34",
      change: "+8.2%",
      up: true,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: t("admin.newUsers"),
      value: "156",
      change: "+23.1%",
      up: true,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: t("admin.avgCart"),
      value: "8.420 RSD",
      change: "-2.4%",
      up: false,
      icon: ShoppingBag,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  const revenueData = [
    { day: t("admin.mon"), value: 65 },
    { day: t("admin.tue"), value: 45 },
    { day: t("admin.wed"), value: 78 },
    { day: t("admin.thu"), value: 52 },
    { day: t("admin.fri"), value: 90 },
    { day: t("admin.sat"), value: 70 },
    { day: t("admin.sun"), value: 35 },
  ];

  const recentOrdersData = [
    { id: "#1048", customer: "Salon Glamour", date: "17.03.2026", items: 4, total: "15.200 RSD", status: t("admin.delivered"), statusColor: "bg-emerald-100 text-emerald-700" },
    { id: "#1047", customer: "Marija Petrović", date: "17.03.2026", items: 2, total: "4.800 RSD", status: t("admin.processing"), statusColor: "bg-yellow-100 text-yellow-700" },
    { id: "#1046", customer: "Beauty Studio NS", date: "16.03.2026", items: 8, total: "32.500 RSD", status: t("admin.delivered"), statusColor: "bg-emerald-100 text-emerald-700" },
    { id: "#1045", customer: "Ana Jovanović", date: "16.03.2026", items: 1, total: "2.100 RSD", status: t("admin.cancelled"), statusColor: "bg-red-100 text-red-700" },
    { id: "#1044", customer: "Salon Prestige", date: "15.03.2026", items: 12, total: "48.900 RSD", status: t("admin.processing"), statusColor: "bg-yellow-100 text-yellow-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">Dashboard</h1>
          <p className="text-sm text-stone-500 mt-1">{t("admin.welcomeBack")}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-sm text-sm text-stone-800 cursor-pointer"
          >
            <option value="danas">{t("admin.today")}</option>
            <option value="7dana">{t("admin.last7days")}</option>
            <option value="30dana">{t("admin.last30days")}</option>
            <option value="90dana">{t("admin.last90days")}</option>
          </select>
          <button className="p-2 bg-white border border-stone-200 rounded-sm text-stone-500 hover:text-black hover:border-black transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-sm border border-stone-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-sm ${card.color}`}>
                  <Icon size={20} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    card.up ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {card.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {card.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-black">{card.value}</p>
                <p className="text-sm text-stone-500 mt-1">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-sm border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-black">{t("admin.revenueOverview")}</h2>
            <span className="text-sm text-stone-500">{t("admin.thisWeek")}</span>
          </div>
          <div className="flex items-end gap-3 h-48">
            {revenueData.map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative" style={{ height: "160px" }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-[#735b28] to-[#b07a87] transition-all duration-500 hover:from-[#594312] hover:to-[#735b28]"
                    style={{ height: `${item.value}%` }}
                  />
                </div>
                <span className="text-xs text-stone-500 font-medium">{item.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#f0f0f0] flex items-center justify-between">
            <div>
              <span className="text-sm text-stone-500">{t("admin.totalThisWeek")}</span>
              <p className="text-lg font-bold text-black">1.245.800 RSD</p>
            </div>
            <Link href="/admin/analytics" className="text-sm text-secondary hover:text-black font-medium flex items-center gap-1">
              {t("admin.detailedAnalytics")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-sm border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-black mb-4">{t("admin.quickActions")}</h2>
          <div className="space-y-3">
            <Link
              href="/admin/products"
              className="flex items-center gap-3 p-3 rounded-sm hover:bg-stone-100 transition-colors group"
            >
              <div className="p-2 rounded-sm bg-black/10 text-secondary group-hover:bg-black group-hover:text-white transition-colors">
                <Plus size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-black">{t("admin.addProduct")}</p>
                <p className="text-xs text-stone-400">{t("admin.createNewProduct")}</p>
              </div>
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-3 p-3 rounded-sm hover:bg-stone-100 transition-colors group"
            >
              <div className="p-2 rounded-sm bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Package size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-black">{t("admin.processOrders")}</p>
                <p className="text-xs text-stone-400">{t("admin.pendingProcessing")}</p>
              </div>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-3 rounded-sm hover:bg-stone-100 transition-colors group"
            >
              <div className="p-2 rounded-sm bg-purple-50 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Users size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-black">{t("admin.b2bApprovals")}</p>
                <p className="text-xs text-stone-400">{t("admin.pendingRequests")}</p>
              </div>
            </Link>
            <Link
              href="/admin/blog"
              className="flex items-center gap-3 p-3 rounded-sm hover:bg-stone-100 transition-colors group"
            >
              <div className="p-2 rounded-sm bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-black">{t("admin.newBlogPost")}</p>
                <p className="text-xs text-stone-400">{t("admin.publishContent")}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">{t("admin.recentOrders")}</h2>
            <Link href="/admin/orders" className="text-sm text-secondary hover:text-black font-medium flex items-center gap-1">
              {t("admin.allOrders")} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">{t("admin.orderNo")}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">{t("admin.customer")}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">{t("admin.date")}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">{t("admin.total")}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">{t("admin.status")}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {recentOrdersData.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-100 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-black">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-stone-800">{order.customer}</td>
                    <td className="px-6 py-4 text-sm text-stone-500 hidden sm:table-cell">{order.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-black">{order.total}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-stone-400 hover:text-secondary transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-sm border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">{t("admin.topProducts")}</h2>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-stone-100 flex items-center justify-center text-xs font-bold text-secondary">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{product.name}</p>
                  <p className="text-xs text-stone-400">{product.brand} · {product.sold} {t("admin.sold")}</p>
                </div>
                <span className="text-xs font-semibold text-stone-800 whitespace-nowrap">{product.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white rounded-sm border border-stone-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-orange-500" />
          <h2 className="text-lg font-semibold text-black">{t("admin.stockAlerts")}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lowStock.map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-sm border border-orange-200 bg-orange-50"
            >
              <p className="text-sm font-medium text-black mb-2">{item.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">{item.stock}</span>
                <span className="text-xs text-stone-400">{t("admin.min")}: {item.threshold}</span>
              </div>
              <div className="mt-2 w-full h-1.5 bg-orange-200 rounded-full">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${(item.stock / item.threshold) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
