"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Package,
  ShoppingCart,
  Users,
  Settings,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Mail,
  Zap,
  Home,
  Tags,
} from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatRelativeTime } from "@/lib/utils";

interface NavSection {
  title?: string;
  items: { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];
}

type NotificationType = "order_created" | "order_cancelled_by_customer" | "low_stock" | "b2b_registration_pending";

interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userName = session?.user?.name || "Admin";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const navSections: NavSection[] = [
    {
      items: [
        { href: "/admin/homepage", label: t("admin.homepage"), icon: Home },
        { href: "/admin/products", label: t("admin.products"), icon: Package },
        { href: "/admin/brands", label: t("admin.brands"), icon: Tags },
        { href: "/admin/orders", label: t("admin.orders"), icon: ShoppingCart },
        { href: "/admin/users", label: t("admin.users"), icon: Users },
      ],
    },
    {
      title: t("admin.sales"),
      items: [
        { href: "/admin/actions", label: t("admin.promotions"), icon: Zap },
      ],
    },
    {
      title: t("admin.system"),
      items: [
        { href: "/admin/notifications", label: t("admin.notifications"), icon: Bell },
        { href: "/admin/newsletter", label: t("admin.newsletter"), icon: Mail },
        { href: "/admin/settings", label: t("admin.settings"), icon: Settings },
      ],
    },
  ];

  // ─── Notifications ───
  // List + count are fetched once on mount in a single round trip; the unread
  // count is then refreshed by a 30s poll. The list itself is only refetched
  // when the dropdown opens — no point shipping rows nobody is looking at.
  const fetchList = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store", signal });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch {
      // network error or aborted — silently skip; the next interaction retries
    }
  }, []);

  // Initial fetch — only when the user is an authenticated admin. Skipping
  // when unauthenticated avoids 401-spam from the layout mounting before
  // session hydration completes.
  useEffect(() => {
    if (sessionStatus !== "authenticated" || session?.user?.role !== "admin") return;
    const controller = new AbortController();
    fetchList(controller.signal);
    return () => controller.abort();
  }, [sessionStatus, session?.user?.role, fetchList]);

  // Poll unread count every 30s. Pauses when the tab is hidden so an admin
  // leaving the tab open all night doesn't generate thousands of requests.
  // Re-ticks immediately on tab focus so the badge feels live.
  useEffect(() => {
    if (sessionStatus !== "authenticated" || session?.user?.role !== "admin") return;
    let cancelled = false;
    const controller = new AbortController();
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/notifications/unread-count", { cache: "no-store", signal: controller.signal });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data?.success) setUnreadCount(data.data.count);
      } catch {
        // network error or aborted — silently skip
      }
    };
    const interval = setInterval(tick, 30_000);
    const onVisible = () => { if (typeof document !== "undefined" && !document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sessionStatus, session?.user?.role]);

  // Refetch the list when the dropdown opens so it's fresh on each peek.
  useEffect(() => {
    if (!notificationsOpen) return;
    if (sessionStatus !== "authenticated" || session?.user?.role !== "admin") return;
    const controller = new AbortController();
    fetchList(controller.signal);
    return () => controller.abort();
  }, [notificationsOpen, sessionStatus, session?.user?.role, fetchList]);

  // Notifications are read-only info cards — clicking marks as read but does
  // NOT navigate anywhere. Optimistic local update first, then PATCH; roll back
  // on failure (rare). The next 30s tick reconciles regardless. The `link`
  // field on the model is ignored here by design.
  const handleNotificationClick = (n: AdminNotification) => {
    if (n.readAt) return;
    setNotifications((prev) =>
      prev.map((p) => (p.id === n.id ? { ...p, readAt: new Date().toISOString() } : p)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    fetch(`/api/notifications/${n.id}/read`, { method: "PATCH", cache: "no-store" }).catch(() => {
      // Roll back local state on failure
      setNotifications((prev) =>
        prev.map((p) => (p.id === n.id ? { ...p, readAt: null } : p)),
      );
      setUnreadCount((c) => c + 1);
    });
  };

  const handleMarkAllRead = () => {
    const previousUnread = unreadCount;
    const previousList = notifications;
    setNotifications((prev) => prev.map((p) => (p.readAt ? p : { ...p, readAt: new Date().toISOString() })));
    setUnreadCount(0);
    fetch("/api/notifications/mark-all-read", { method: "POST", cache: "no-store" }).catch(() => {
      setNotifications(previousList);
      setUnreadCount(previousUnread);
    });
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-stone-100 flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-stone-50 text-stone-900 z-40 transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="p-8 border-b border-stone-200 flex items-center justify-between">
          {sidebarOpen ? (
            <Link href="/" aria-label="Altamoda početna" className="block">
              <Image
                src="/logo-transparent.png"
                alt="Altamoda"
                width={742}
                height={134}
                priority
                className="h-8 w-auto"
              />
              <p className="text-stone-500 text-xs tracking-widest mt-2 uppercase">Admin Panel</p>
            </Link>
          ) : (
            <Link href="/" aria-label="Altamoda početna" className="mx-auto block">
              <Image
                src="/logo-transparent.png"
                alt="Altamoda"
                width={742}
                height={134}
                priority
                className="h-6 w-auto"
              />
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-stone-500 hover:text-black hidden lg:block"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && sidebarOpen && (
                <p className="px-6 pt-6 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  {section.title}
                </p>
              )}
              {section.title && !sidebarOpen && <div className="mx-4 my-2 border-t border-stone-200" />}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-2 py-3 mx-2 rounded-sm transition-all duration-200 group ${
                      active
                        ? "font-bold text-black"
                        : "text-stone-500 hover:text-black hover:bg-stone-200 p-2 -ml-0"
                    }`}
                  >
                    <Icon size={20} className={active ? "text-black" : "text-stone-400 group-hover:text-black"} />
                    {sidebarOpen && (
                      <span className="text-base" style={{ fontFamily: "'Noto Serif', serif" }}>{item.label}</span>
                    )}
                    {active && sidebarOpen && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t border-stone-200">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {userInitials}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-black truncate">{userName}</p>
                <p className="text-xs text-stone-400">Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-stone-50 text-stone-900 z-50 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 border-b border-stone-200 flex items-center justify-between">
          <Link href="/" aria-label="Altamoda početna" className="block" onClick={() => setMobileMenuOpen(false)}>
            <Image
              src="/logo-transparent.png"
              alt="Altamoda"
              width={742}
              height={134}
              priority
              className="h-8 w-auto"
            />
            <p className="text-stone-500 text-xs tracking-widest mt-2 uppercase">Admin Panel</p>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-stone-400 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="py-4 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <p className="px-6 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-sm transition-all duration-200 ${
                      active
                        ? "bg-stone-200 text-black font-bold"
                        : "text-stone-500 hover:text-black hover:bg-stone-200"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-semibold text-sm">
              AM
            </div>
            <div>
              <p className="text-sm font-medium text-black">Admin Korisnik</p>
              <p className="text-xs text-stone-400">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "lg:ml-80" : "lg:ml-20"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-200 px-4 lg:px-12 h-16 flex items-center justify-between gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-black hover:text-secondary transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Language */}
            <LanguageToggle />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdownOpen(false);
                }}
                className="relative p-2 text-stone-500 hover:text-black hover:bg-stone-100 rounded-sm transition-colors"
                aria-label={t("admin.notifications")}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-sm shadow-xl border border-stone-200 overflow-hidden animate-slideDown">
                  <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-black">{t("admin.notifications")}</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-secondary hover:text-black font-medium"
                      >
                        {t("admin.markAllRead")}
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-stone-400">
                        {t("admin.noNotifications")}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left p-4 border-b border-stone-100 hover:bg-stone-100 cursor-pointer transition-colors ${
                            !n.readAt ? "bg-black/5" : ""
                          }`}
                        >
                          <p className="text-sm text-stone-800 font-medium">{n.title}</p>
                          {n.body && <p className="text-xs text-stone-500 mt-0.5">{n.body}</p>}
                          <p className="text-xs text-stone-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-stone-100">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-sm text-secondary hover:text-black font-medium"
                    >
                      {t("admin.showAllNotifications")}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-2 hover:bg-stone-100 rounded-sm transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-semibold text-xs">
                  {userInitials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-stone-800">
                  {userName}
                </span>
                <ChevronDown size={14} className="text-stone-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-sm shadow-xl border border-stone-200 overflow-hidden animate-slideDown">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-stone-800 hover:bg-stone-100 transition-colors"
                  >
                    <User size={16} />
                    {t("admin.myProfile")}
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-stone-800 hover:bg-stone-100 transition-colors"
                  >
                    <Settings size={16} />
                    {t("admin.settings")}
                  </Link>
                  <div className="border-t border-stone-200">
                    <button onClick={() => signOut({ callbackUrl: "/account/login" })} className="flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full transition-colors">
                      <LogOut size={16} />
                      {t("admin.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
