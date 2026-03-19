"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  PackageOpen,
  Mail,
  Zap,
} from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface NavSection {
  title?: string;
  items: { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userName = session?.user?.name || "Admin";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const navSections: NavSection[] = [
    {
      items: [
        { href: "/admin", label: t("admin.dashboard"), icon: LayoutDashboard },
        { href: "/admin/products", label: t("admin.products"), icon: Package },
        { href: "/admin/orders", label: t("admin.orders"), icon: ShoppingCart },
        { href: "/admin/users", label: t("admin.users"), icon: Users },
      ],
    },
    {
      title: t("admin.sales"),
      items: [
        { href: "/admin/actions", label: t("admin.promotions"), icon: Zap },
        { href: "/admin/bundles", label: t("admin.bundles"), icon: PackageOpen },
      ],
    },
    {
      title: t("admin.system"),
      items: [
        { href: "/admin/newsletter", label: t("admin.newsletter"), icon: Mail },
        { href: "/admin/settings", label: t("admin.settings"), icon: Settings },
      ],
    },
  ];

  const notifications = [
    { id: 1, text: "Nova porudžbina #1048", time: "Pre 5 min", unread: true },
    { id: 2, text: "Nizak nivo zaliha: Kerastase Elixir", time: "Pre 1h", unread: true },
    { id: 3, text: "Novi B2B korisnik čeka odobrenje", time: "Pre 3h", unread: false },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-[#2d2d2d] text-white z-40 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Alta Moda" className="h-6 brightness-0 invert" />
              <span className="text-[10px] font-semibold bg-[#8c4a5a] text-[#2d2d2d] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Admin
              </span>
            </div>
          ) : (
            <img src="/logo.png" alt="Alta Moda" className="h-5 brightness-0 invert mx-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/60 hover:text-white hidden lg:block"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && sidebarOpen && (
                <p className="px-6 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  {section.title}
                </p>
              )}
              {section.title && !sidebarOpen && <div className="mx-4 my-2 border-t border-white/10" />}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-lg transition-all duration-200 group ${
                      active
                        ? "bg-[#8c4a5a]/15 text-[#8c4a5a]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={20} className={active ? "text-[#8c4a5a]" : "text-white/60 group-hover:text-white"} />
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                    {active && sidebarOpen && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8c4a5a]" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
            <div className="w-9 h-9 rounded-full bg-[#8c4a5a] flex items-center justify-center text-[#2d2d2d] font-semibold text-sm flex-shrink-0">
              {userInitials}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-white/40">Admin</p>
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
        className={`fixed top-0 left-0 h-full w-72 bg-[#2d2d2d] text-white z-50 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Alta Moda" className="h-6 brightness-0 invert" />
            <span className="text-[10px] font-semibold bg-[#8c4a5a] text-[#2d2d2d] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="py-4 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <p className="px-6 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
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
                    className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-[#8c4a5a]/15 text-[#8c4a5a]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#8c4a5a] flex items-center justify-center text-[#2d2d2d] font-semibold text-sm">
              AM
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin Korisnik</p>
              <p className="text-xs text-white/40">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#e0d8cc] px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-[#2d2d2d] hover:text-[#8c4a5a] transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]"
              />
              <input
                type="text"
                placeholder={t("admin.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2 bg-[#f5f0e8] border border-transparent rounded-lg text-sm focus:border-[#8c4a5a] focus:bg-white transition-all"
              />
            </div>
          </div>

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
                className="relative p-2 text-[#666] hover:text-[#2d2d2d] hover:bg-[#f5f0e8] rounded-lg transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#e0d8cc] overflow-hidden animate-slideDown">
                  <div className="p-4 border-b border-[#e0d8cc]">
                    <h3 className="font-semibold text-sm text-[#2d2d2d]">{t("admin.notifications")}</h3>
                  </div>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 border-b border-[#f5f0e8] hover:bg-[#f5f0e8] cursor-pointer transition-colors ${
                        n.unread ? "bg-[#8c4a5a]/5" : ""
                      }`}
                    >
                      <p className="text-sm text-[#333]">{n.text}</p>
                      <p className="text-xs text-[#999] mt-1">{n.time}</p>
                    </div>
                  ))}
                  <div className="p-3 text-center">
                    <button className="text-sm text-[#8c4a5a] hover:text-[#6e3848] font-medium">
                      {t("admin.showAllNotifications")}
                    </button>
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
                className="flex items-center gap-2 p-2 hover:bg-[#f5f0e8] rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#8c4a5a] flex items-center justify-center text-white font-semibold text-xs">
                  {userInitials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-[#333]">
                  {userName}
                </span>
                <ChevronDown size={14} className="text-[#999]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#e0d8cc] overflow-hidden animate-slideDown">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-[#333] hover:bg-[#f5f0e8] transition-colors"
                  >
                    <User size={16} />
                    {t("admin.myProfile")}
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-[#333] hover:bg-[#f5f0e8] transition-colors"
                  >
                    <Settings size={16} />
                    {t("admin.settings")}
                  </Link>
                  <div className="border-t border-[#e0d8cc]">
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
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
