"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Bell, Check, ChevronLeft, ChevronRight, Package, ShoppingCart, AlertTriangle, UserPlus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatRelativeTime } from "@/lib/utils";

interface AdminNotification {
  id: string;
  type: "order_created" | "order_cancelled_by_customer" | "low_stock" | "b2b_registration_pending";
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  payload: Record<string, unknown> | null;
}

interface PageData {
  notifications: AdminNotification[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  unreadCount: number;
}

// Per-type visual hint — tiny icon + colour. Centralised so the page stays
// consistent and a future type just adds one row here.
const TYPE_META: Record<AdminNotification["type"], { icon: React.ReactNode; tint: string; label: string }> = {
  order_created: { icon: <ShoppingCart size={14} />, tint: "bg-emerald-50 text-emerald-700", label: "Porudžbina" },
  order_cancelled_by_customer: { icon: <ShoppingCart size={14} />, tint: "bg-orange-50 text-orange-700", label: "Otkazana porudžbina" },
  low_stock: { icon: <AlertTriangle size={14} />, tint: "bg-red-50 text-red-700", label: "Niske zalihe" },
  b2b_registration_pending: { icon: <UserPlus size={14} />, tint: "bg-blue-50 text-blue-700", label: "B2B registracija" },
};

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const limit = 20;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (unreadOnly) params.set("unreadOnly", "true");
    return params.toString();
  }, [page, unreadOnly]);

  const fetchPage = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?${queryString}`, { cache: "no-store", signal });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.success) setData(json.data);
    } catch {
      // network error or aborted — leave previous data in place
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPage(controller.signal);
    return () => controller.abort();
  }, [fetchPage]);

  // Optimistic mark-one-read. Failure rolls back local state.
  const markRead = (n: AdminNotification) => {
    if (n.readAt) return;
    setData((prev) =>
      prev
        ? {
            ...prev,
            notifications: prev.notifications.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          }
        : prev,
    );
    fetch(`/api/notifications/${n.id}/read`, { method: "PATCH", cache: "no-store" }).catch(() => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((x) => (x.id === n.id ? { ...x, readAt: null } : x)),
              unreadCount: prev.unreadCount + 1,
            }
          : prev,
      );
    });
  };

  const markAllRead = () => {
    if (!data || data.unreadCount === 0) return;
    const previous = data;
    setData({
      ...data,
      notifications: data.notifications.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })),
      unreadCount: 0,
    });
    fetch("/api/notifications/mark-all-read", { method: "POST", cache: "no-store" }).catch(() => setData(previous));
  };

  const togglePage = (next: number) => {
    if (!data) return;
    if (next < 1 || next > data.pagination.totalPages) return;
    setPage(next);
  };

  const toggleUnreadOnly = () => {
    setUnreadOnly((v) => !v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black flex items-center gap-2">
            <Bell size={22} /> {t("admin.notifications")}
          </h1>
          {data && (
            <p className="text-sm text-[#837A64] mt-1">
              {data.pagination.total} {t("admin.total")} · {data.unreadCount} {t("admin.unread")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleUnreadOnly}
            className={`px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
              unreadOnly ? "bg-black text-white" : "bg-stone-100 text-[#837A64] hover:bg-[#D8CFBC]"
            }`}
          >
            {unreadOnly ? t("admin.showAll") : t("admin.unreadOnly")}
          </button>
          <button
            onClick={markAllRead}
            disabled={!data || data.unreadCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-medium bg-stone-100 text-[#837A64] hover:bg-[#D8CFBC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={14} /> {t("admin.markAllRead")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
        {loading && !data ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
          </div>
        ) : !data || data.notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={36} className="text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-[#837A64]">{t("admin.noNotifications")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {data.notifications.map((n) => {
              const meta = TYPE_META[n.type];
              // Read-only info card. Click marks as read but does not navigate.
              // Unread rows render as buttons so the click target is obvious;
              // already-read rows render as plain divs (nothing to do on click).
              const RowInner = (
                <div className={`p-4 transition-colors ${!n.readAt ? "bg-black/5 hover:bg-black/10 cursor-pointer" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${meta.tint}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-stone-500 mt-0.5">{n.body}</p>}
                      <p className="text-xs text-stone-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                    {!n.readAt && <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2" />}
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {!n.readAt ? (
                    <button onClick={() => markRead(n)} className="w-full text-left">
                      {RowInner}
                    </button>
                  ) : (
                    RowInner
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#837A64]">
            {t("admin.page")} {data.pagination.page} / {data.pagination.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => togglePage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-sm bg-stone-100 hover:bg-stone-200 text-[#837A64] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t("admin.previousPage")}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => togglePage(page + 1)}
              disabled={page >= data.pagination.totalPages}
              className="p-2 rounded-sm bg-stone-100 hover:bg-stone-200 text-[#837A64] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t("admin.nextPage")}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
