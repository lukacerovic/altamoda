"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mail,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
} from "lucide-react";

/* ───────────────── Types ───────────────── */

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: "novi" | "u_obradi" | "isporuceno" | "otkazano";
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
  createdAt: string;
  user: { id: string; name: string | null; email: string; role: string } | null;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingMethod: string | null;
  shippingAddress: { street?: string; city?: string; postalCode?: string; country?: string } | null;
  billingAddress: { street?: string; city?: string; postalCode?: string; country?: string } | null;
  notes: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; role: string } | null;
  items: {
    id: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    image: string;
  }[];
  statusHistory: {
    id: string;
    status: string;
    note: string | null;
    changedBy: string;
    createdAt: string;
  }[];
}

const statusColors: Record<string, string> = {
  novi: "bg-blue-100 text-blue-700",
  u_obradi: "bg-yellow-100 text-yellow-700",
  isporuceno: "bg-emerald-100 text-emerald-700",
  otkazano: "bg-red-100 text-red-700",
};

const paymentMethodLabels: Record<string, string> = {
  card: "Kartica",
  bank_transfer: "Virman",
  cash_on_delivery: "Pouzeće",
  invoice: "Faktura",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  novi: ["u_obradi", "otkazano"],
  u_obradi: ["isporuceno", "otkazano"],
  isporuceno: [],
  otkazano: [],
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

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const perPage = 10;

  /* ── Fetch orders list ── */
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(perPage),
      });
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
        setTotalOrders(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll for new orders every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  /* ── Fetch order detail ── */
  const fetchOrderDetail = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrderDetail(data.data);
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setOrderDetail(null);
    } else {
      setExpandedOrder(orderId);
      fetchOrderDetail(orderId);
    }
  };

  /* ── Update status ── */
  const changeStatus = async (orderId: string, newStatus: string) => {
    setStatusUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: newStatus as OrderListItem["status"] } : o
          )
        );
        // Refresh detail if expanded
        if (expandedOrder === orderId) {
          fetchOrderDetail(orderId);
        }
      }
    } catch {
      // ignore
    } finally {
      setStatusUpdating(null);
    }
  };

  /* ── Client-side filtering (search + status) ── */
  const filtered = orders.filter((o) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(searchLower) ||
      (o.user?.name || "").toLowerCase().includes(searchLower) ||
      (o.user?.email || "").toLowerCase().includes(searchLower);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sr-RS", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case "isporuceno":
        return <CheckCircle size={16} className="text-emerald-500" />;
      case "u_obradi":
        return <Package size={16} className="text-secondary" />;
      case "otkazano":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-[#999]" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "novi": return t("admin.newStatus");
      case "u_obradi": return t("admin.processing");
      case "isporuceno": return t("admin.delivered");
      case "otkazano": return t("admin.cancelled");
      default: return status;
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">{t("admin.orders")}</h1>
          <p className="text-sm text-[#666] mt-1">
            {totalOrders} {t("admin.totalOrders")}
          </p>
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-stone-100 rounded-sm text-sm text-[#666]"
          >
            <Filter size={16} /> {t("admin.filters")}
          </button>
        </div>

        {/* Status tabs */}
        <div className={`mt-3 pt-3 border-t border-[#f0f0f0] ${showFilters ? "block" : "hidden"} sm:block`}>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-[#ccc] mb-3" />
            <p className="text-sm text-[#999]">{t("admin.noProductsMatch")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                    {t("admin.orderNo")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                    {t("admin.customer")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                    {t("admin.date")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                    {t("admin.items")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                    {t("admin.total")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                    {t("admin.payment")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                    {t("admin.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {filtered.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      className="hover:bg-stone-100 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-secondary">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-black">
                          {order.user?.name || order.user?.email || "—"}
                        </p>
                        {order.user?.role === "b2b" && (
                          <span className="text-[10px] font-semibold bg-stone-200 text-[#666] px-1.5 py-0.5 rounded">
                            B2B
                          </span>
                        )}
                        <p className="text-xs text-[#999] md:hidden">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#666] ">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#666] ">
                        {order.itemCount} {t("admin.itemsCount")}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-black">
                        {order.total.toLocaleString()} RSD
                      </td>
                      <td className="px-6 py-4 text-sm text-[#666] ">
                        {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                      </td>
                      <td className="px-6 py-4">
                        {VALID_TRANSITIONS[order.status]?.length > 0 ? (
                          <select
                            value={order.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              changeStatus(order.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            disabled={statusUpdating === order.id}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[order.status]} ${statusUpdating === order.id ? "opacity-50" : ""}`}
                          >
                            <option value={order.status}>{statusLabel(order.status)}</option>
                            {VALID_TRANSITIONS[order.status].map((s) => (
                              <option key={s} value={s}>
                                {statusLabel(s)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                            {statusLabel(order.status)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-[#999] hover:text-black transition-colors">
                          {expandedOrder === order.id ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail */}
                    {expandedOrder === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={8} className="px-6 py-6 bg-stone-100">
                          {detailLoading || !orderDetail ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent" />
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Items */}
                              <div className="lg:col-span-2">
                                <h3 className="text-sm font-semibold text-black mb-3">
                                  {t("admin.orderItems")}
                                </h3>
                                <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-stone-100">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-[#666]">
                                          {t("admin.product")}
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-[#666]">
                                          {t("admin.qty")}
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-[#666]">
                                          {t("admin.price")}
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-[#666]">
                                          {t("admin.total")}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f0f0]">
                                      {orderDetail.items.map((item) => (
                                        <tr key={item.id}>
                                          <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-3">
                                              {item.image ? (
                                                <img
                                                  src={item.image}
                                                  alt={item.productName}
                                                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                                                />
                                              ) : (
                                                <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center flex-shrink-0">
                                                  <Package size={14} className="text-[#999]" />
                                                </div>
                                              )}
                                              <div>
                                                <p className="text-sm text-[#333]">{item.productName}</p>
                                                <p className="text-[10px] text-[#999]">{item.productSku}</p>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-2.5 text-sm text-[#666]">
                                            {item.quantity}
                                          </td>
                                          <td className="px-4 py-2.5 text-sm text-[#666]">
                                            {item.unitPrice.toLocaleString()} RSD
                                          </td>
                                          <td className="px-4 py-2.5 text-sm font-medium text-black">
                                            {item.totalPrice.toLocaleString()} RSD
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      {orderDetail.discountAmount > 0 && (
                                        <tr className="border-t border-stone-200">
                                          <td colSpan={3} className="px-4 py-2 text-sm text-[#666] text-right">
                                            Popust:
                                          </td>
                                          <td className="px-4 py-2 text-sm text-red-500">
                                            -{orderDetail.discountAmount.toLocaleString()} RSD
                                          </td>
                                        </tr>
                                      )}
                                      {orderDetail.shippingCost > 0 && (
                                        <tr>
                                          <td colSpan={3} className="px-4 py-2 text-sm text-[#666] text-right">
                                            Dostava:
                                          </td>
                                          <td className="px-4 py-2 text-sm text-[#666]">
                                            {orderDetail.shippingCost.toLocaleString()} RSD
                                          </td>
                                        </tr>
                                      )}
                                      <tr className="bg-stone-100">
                                        <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-black text-right">
                                          {t("admin.total")}:
                                        </td>
                                        <td className="px-4 py-2.5 text-sm font-bold text-secondary">
                                          {orderDetail.total.toLocaleString()} RSD
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                                {/* Customer Info */}
                                <h3 className="text-sm font-semibold text-black mt-4 mb-3">
                                  {t("admin.customerData")}
                                </h3>
                                <div className="bg-white rounded-sm border border-stone-200 p-4 space-y-2">
                                  {orderDetail.user && (
                                    <>
                                      <div className="flex items-center gap-2 text-sm text-[#333]">
                                        <Mail size={14} className="text-[#999]" />{" "}
                                        {orderDetail.user.email}
                                      </div>
                                      {orderDetail.user.name && (
                                        <div className="flex items-center gap-2 text-sm text-[#333]">
                                          <Package size={14} className="text-[#999]" />{" "}
                                          {orderDetail.user.name}
                                          {orderDetail.user.role === "b2b" && (
                                            <span className="text-[10px] font-semibold bg-stone-200 text-[#666] px-1.5 py-0.5 rounded ml-1">
                                              B2B
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {orderDetail.shippingAddress && (
                                    <div className="flex items-center gap-2 text-sm text-[#333]">
                                      <MapPin size={14} className="text-[#999]" />{" "}
                                      {orderDetail.shippingAddress.street}
                                      {orderDetail.shippingAddress.city &&
                                        `, ${orderDetail.shippingAddress.city}`}
                                      {orderDetail.shippingAddress.postalCode &&
                                        ` ${orderDetail.shippingAddress.postalCode}`}
                                    </div>
                                  )}
                                  {orderDetail.shippingMethod && (
                                    <div className="flex items-center gap-2 text-sm text-[#333]">
                                      <Truck size={14} className="text-[#999]" />{" "}
                                      {orderDetail.shippingMethod === "express"
                                        ? "Express dostava"
                                        : orderDetail.shippingMethod === "pickup"
                                          ? "Lično preuzimanje"
                                          : "Standardna dostava"}
                                    </div>
                                  )}
                                  {orderDetail.notes && (
                                    <div className="flex items-start gap-2 text-sm text-[#333] mt-2 pt-2 border-t border-stone-100">
                                      <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                      <span className="italic">{orderDetail.notes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Timeline */}
                              <div>
                                <h3 className="text-sm font-semibold text-black mb-3">
                                  {t("admin.orderTimeline")}
                                </h3>
                                <div className="bg-white rounded-sm border border-stone-200 p-4">
                                  {orderDetail.statusHistory.length === 0 ? (
                                    <p className="text-sm text-[#999] text-center py-4">
                                      Nema istorije statusa
                                    </p>
                                  ) : (
                                    <div className="space-y-4">
                                      {orderDetail.statusHistory.map((event, idx) => (
                                        <div key={event.id} className="flex gap-3">
                                          <div className="flex flex-col items-center">
                                            {getTimelineIcon(event.status)}
                                            {idx < orderDetail.statusHistory.length - 1 && (
                                              <div className="w-px h-full bg-[#c4c7c7] mt-1" />
                                            )}
                                          </div>
                                          <div className="pb-4">
                                            <p className="text-sm text-[#333] font-medium">
                                              {statusLabel(event.status)}
                                            </p>
                                            {event.note && (
                                              <p className="text-xs text-[#666] mt-0.5">{event.note}</p>
                                            )}
                                            <p className="text-xs text-[#999] mt-0.5">
                                              {formatDateTime(event.createdAt)} · {event.changedBy}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Payment info */}
                                <h3 className="text-sm font-semibold text-black mt-4 mb-3">
                                  Plaćanje
                                </h3>
                                <div className="bg-white rounded-sm border border-stone-200 p-4 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#666]">Metod:</span>
                                    <span className="text-black font-medium">
                                      {paymentMethodLabels[orderDetail.paymentMethod] || orderDetail.paymentMethod}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-[#666]">Status:</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        orderDetail.paymentStatus === "paid"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : orderDetail.paymentStatus === "failed"
                                            ? "bg-red-100 text-red-700"
                                            : orderDetail.paymentStatus === "refunded"
                                              ? "bg-purple-100 text-purple-700"
                                              : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {orderDetail.paymentStatus === "paid"
                                        ? "Plaćeno"
                                        : orderDetail.paymentStatus === "failed"
                                          ? "Neuspelo"
                                          : orderDetail.paymentStatus === "refunded"
                                            ? "Refundirano"
                                            : "Na čekanju"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-stone-200 flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-[#666] whitespace-nowrap">
              {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, totalOrders)} /{" "}
              {totalOrders}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-sm text-[#666] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-sm text-sm font-medium transition-colors ${
                    page === currentPage
                      ? "bg-black text-white"
                      : "text-[#666] hover:bg-stone-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-sm text-[#666] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
