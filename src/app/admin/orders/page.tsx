"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: "novi" | "u_obradi" | "isporuceno" | "otkazano";
  paymentMethod: string;
  address: string;
  city: string;
  timeline: { date: string; event: string; icon: string }[];
}

const statusColors: Record<string, string> = {
  novi: "bg-blue-100 text-blue-700",
  u_obradi: "bg-yellow-100 text-yellow-700",
  isporuceno: "bg-emerald-100 text-emerald-700",
  otkazano: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const { t } = useLanguage();

  const statusFilters = [
    { key: "all", label: t("admin.all") },
    { key: "novi", label: t("admin.newStatus") },
    { key: "u_obradi", label: t("admin.processing") },
    { key: "isporuceno", label: t("admin.delivered") },
    { key: "otkazano", label: t("admin.cancelled") },
  ];

  const allOrders: Order[] = [
    {
      id: "#1048",
      customer: "Salon Glamour",
      email: "info@salonglamour.rs",
      phone: "+381 11 234 5678",
      date: "17.03.2026",
      items: [
        { name: "L'Oréal Serie Expert Gold Quinoa", quantity: 5, price: 2500 },
        { name: "Kérastase Elixir Ultime", quantity: 2, price: 4200 },
        { name: "Schwarzkopf BC Bonacure", quantity: 3, price: 1800 },
      ],
      total: 26300,
      status: "isporuceno",
      paymentMethod: "Virman",
      address: "Knez Mihailova 22",
      city: "Beograd",
      timeline: [
        { date: "17.03. 14:30", event: t("admin.orderDelivered"), icon: "check" },
        { date: "16.03. 09:00", event: t("admin.sentByCourier"), icon: "truck" },
        { date: "15.03. 16:45", event: t("admin.orderProcessing"), icon: "package" },
        { date: "15.03. 14:20", event: t("admin.orderReceived"), icon: "clock" },
      ],
    },
    {
      id: "#1047",
      customer: "Marija Petrović",
      email: "marija.p@gmail.com",
      phone: "+381 63 123 4567",
      date: "17.03.2026",
      items: [
        { name: "Moroccanoil Treatment 100ml", quantity: 1, price: 3500 },
        { name: "Wella Oil Reflections Šampon", quantity: 1, price: 1950 },
      ],
      total: 5450,
      status: "u_obradi",
      paymentMethod: "Kartica",
      address: "Bulevar Oslobođenja 88",
      city: "Novi Sad",
      timeline: [
        { date: "17.03. 10:15", event: t("admin.orderProcessing"), icon: "package" },
        { date: "17.03. 09:30", event: t("admin.paymentConfirmed"), icon: "check" },
        { date: "17.03. 09:28", event: t("admin.orderReceived"), icon: "clock" },
      ],
    },
    {
      id: "#1046",
      customer: "Beauty Studio NS",
      email: "beauty.studio@gmail.com",
      phone: "+381 21 456 7890",
      date: "16.03.2026",
      items: [
        { name: "Schwarzkopf Igora Royal 60ml", quantity: 20, price: 850 },
        { name: "L'Oréal Majirel 50ml", quantity: 15, price: 900 },
        { name: "Blondme Premium Lift", quantity: 5, price: 1100 },
      ],
      total: 36000,
      status: "isporuceno",
      paymentMethod: "Virman",
      address: "Jevrejska 10",
      city: "Novi Sad",
      timeline: [
        { date: "16.03. 15:00", event: t("admin.orderDelivered"), icon: "check" },
        { date: "15.03. 08:30", event: t("admin.sentByCourier"), icon: "truck" },
        { date: "14.03. 14:00", event: t("admin.orderProcessing"), icon: "package" },
        { date: "14.03. 11:45", event: t("admin.orderReceived"), icon: "clock" },
      ],
    },
    {
      id: "#1045",
      customer: "Ana Jovanović",
      email: "ana.j@yahoo.com",
      phone: "+381 64 987 6543",
      date: "16.03.2026",
      items: [{ name: "OSIS+ Dust It", quantity: 1, price: 1200 }],
      total: 1200,
      status: "otkazano",
      paymentMethod: "Pouzeće",
      address: "Cara Dušana 15",
      city: "Niš",
      timeline: [
        { date: "16.03. 18:00", event: t("admin.orderCancelledByCustomer"), icon: "x" },
        { date: "16.03. 12:00", event: t("admin.orderReceived"), icon: "clock" },
      ],
    },
    {
      id: "#1044",
      customer: "Salon Prestige",
      email: "prestige@salon.rs",
      phone: "+381 11 333 4444",
      date: "15.03.2026",
      items: [
        { name: "Kérastase Elixir Ultime", quantity: 10, price: 4200 },
        { name: "L'Oréal Mythic Oil Huile", quantity: 8, price: 2800 },
        { name: "Tecni Art Pli Shaper", quantity: 6, price: 1450 },
      ],
      total: 73100,
      status: "u_obradi",
      paymentMethod: "Virman",
      address: "Terazije 5",
      city: "Beograd",
      timeline: [
        { date: "15.03. 16:00", event: t("admin.orderProcessing"), icon: "package" },
        { date: "15.03. 14:30", event: t("admin.paymentConfirmed"), icon: "check" },
        { date: "15.03. 10:00", event: t("admin.orderReceived"), icon: "clock" },
      ],
    },
    {
      id: "#1043",
      customer: "Jelena Nikolić",
      email: "jelena.n@gmail.com",
      phone: "+381 65 111 2222",
      date: "15.03.2026",
      items: [
        { name: "Wella Koleston Perfect 60ml", quantity: 3, price: 950 },
        { name: "Schwarzkopf BC Bonacure", quantity: 2, price: 1800 },
      ],
      total: 6450,
      status: "novi",
      paymentMethod: "Kartica",
      address: "Vojvode Stepe 120",
      city: "Beograd",
      timeline: [
        { date: "15.03. 08:45", event: t("admin.orderReceived"), icon: "clock" },
      ],
    },
    {
      id: "#1042",
      customer: "Hair Art Studio",
      email: "contact@hairart.rs",
      phone: "+381 34 555 6666",
      date: "14.03.2026",
      items: [
        { name: "L'Oréal Serie Expert Gold Quinoa", quantity: 12, price: 2500 },
        { name: "Moroccanoil Treatment 100ml", quantity: 6, price: 3500 },
      ],
      total: 51000,
      status: "isporuceno",
      paymentMethod: "Virman",
      address: "Kneza Miloša 33",
      city: "Kragujevac",
      timeline: [
        { date: "14.03. 16:00", event: t("admin.orderDelivered"), icon: "check" },
        { date: "13.03. 10:00", event: t("admin.sentByCourier"), icon: "truck" },
        { date: "12.03. 15:00", event: t("admin.orderProcessing"), icon: "package" },
        { date: "12.03. 09:30", event: t("admin.orderReceived"), icon: "clock" },
      ],
    },
  ];

  const [orders, setOrders] = useState<Order[]>(allOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 5;

  const filtered = orders.filter((o) => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const changeStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const getTimelineIcon = (icon: string) => {
    switch (icon) {
      case "check": return <CheckCircle size={16} className="text-emerald-500" />;
      case "truck": return <Truck size={16} className="text-blue-500" />;
      case "package": return <Package size={16} className="text-secondary" />;
      case "x": return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-[#999]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">{t("admin.orders")}</h1>
          <p className="text-sm text-[#666] mt-1">{orders.length} {t("admin.totalOrders")}</p>
        </div>
        <button className="btn-outline-gold px-5 py-2.5 rounded-sm text-sm flex items-center gap-2 self-start">
          <Download size={18} />
          {t("admin.export")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-sm border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              type="text"
              placeholder={t("admin.searchOrders")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-stone-100 rounded-sm text-sm text-[#666]">
            <Filter size={16} /> {t("admin.filters")}
          </button>
        </div>

        {/* Status tabs */}
        <div className={`mt-3 pt-3 border-t border-[#f0f0f0] ${showFilters ? "block" : "hidden"} sm:block`}>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((s) => (
              <button
                key={s.key}
                onClick={() => { setStatusFilter(s.key); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  statusFilter === s.key
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-[#666] hover:bg-[#c4c7c7]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.orderNo")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.customer")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">{t("admin.date")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden lg:table-cell">{t("admin.items")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.total")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">{t("admin.payment")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.status")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {paginated.map((order) => (
                <>
                  <tr key={order.id} className="hover:bg-stone-100 transition-colors cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <td className="px-6 py-4 text-sm font-medium text-secondary">{order.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-black">{order.customer}</p>
                      <p className="text-xs text-[#999] md:hidden">{order.date}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#666] hidden md:table-cell">{order.date}</td>
                    <td className="px-6 py-4 text-sm text-[#666] hidden lg:table-cell">{order.items.length} {t("admin.itemsCount")}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-black">{order.total.toLocaleString()} RSD</td>
                    <td className="px-6 py-4 text-sm text-[#666] hidden sm:table-cell">{order.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => { e.stopPropagation(); changeStatus(order.id, e.target.value as Order["status"]); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[order.status]}`}
                      >
                        <option value="novi">{t("admin.newStatus")}</option>
                        <option value="u_obradi">{t("admin.processing")}</option>
                        <option value="isporuceno">{t("admin.delivered")}</option>
                        <option value="otkazano">{t("admin.cancelled")}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-[#999] hover:text-black transition-colors">
                        {expandedOrder === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Detail */}
                  {expandedOrder === order.id && (
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={8} className="px-6 py-6 bg-stone-100">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Items */}
                          <div className="lg:col-span-2">
                            <h3 className="text-sm font-semibold text-black mb-3">{t("admin.orderItems")}</h3>
                            <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-stone-100">
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#666]">{t("admin.product")}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#666]">{t("admin.qty")}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#666]">{t("admin.price")}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#666]">{t("admin.total")}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0f0f0]">
                                  {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="px-4 py-2.5 text-sm text-[#333]">{item.name}</td>
                                      <td className="px-4 py-2.5 text-sm text-[#666]">{item.quantity}</td>
                                      <td className="px-4 py-2.5 text-sm text-[#666]">{item.price.toLocaleString()} RSD</td>
                                      <td className="px-4 py-2.5 text-sm font-medium text-black">{(item.quantity * item.price).toLocaleString()} RSD</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-stone-100">
                                    <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-black text-right">{t("admin.total")}:</td>
                                    <td className="px-4 py-2.5 text-sm font-bold text-secondary">{order.total.toLocaleString()} RSD</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                            {/* Customer Info */}
                            <h3 className="text-sm font-semibold text-black mt-4 mb-3">{t("admin.customerData")}</h3>
                            <div className="bg-white rounded-sm border border-stone-200 p-4 space-y-2">
                              <div className="flex items-center gap-2 text-sm text-[#333]">
                                <Mail size={14} className="text-[#999]" /> {order.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#333]">
                                <Phone size={14} className="text-[#999]" /> {order.phone}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#333]">
                                <MapPin size={14} className="text-[#999]" /> {order.address}, {order.city}
                              </div>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div>
                            <h3 className="text-sm font-semibold text-black mb-3">{t("admin.orderTimeline")}</h3>
                            <div className="bg-white rounded-sm border border-stone-200 p-4">
                              <div className="space-y-4">
                                {order.timeline.map((event, idx) => (
                                  <div key={idx} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                      {getTimelineIcon(event.icon)}
                                      {idx < order.timeline.length - 1 && (
                                        <div className="w-px h-full bg-[#c4c7c7] mt-1" />
                                      )}
                                    </div>
                                    <div className="pb-4">
                                      <p className="text-sm text-[#333]">{event.event}</p>
                                      <p className="text-xs text-[#999] mt-0.5">{event.date}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between">
            <span className="text-sm text-[#666]">
              {t("admin.showing")} {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} {t("admin.of")} {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-sm text-[#666] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-sm text-sm font-medium transition-colors ${page === currentPage ? "bg-black text-white" : "text-[#666] hover:bg-stone-100"}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 rounded-sm text-[#666] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
