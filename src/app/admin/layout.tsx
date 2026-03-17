"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  GraduationCap,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Ticket,
  PackageOpen,
  Image,
  Mail,
  Database,
  Upload,
  Globe,
} from "lucide-react";

interface NavSection {
  title?: string;
  items: { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];
}

const navSections: NavSection[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/products", label: "Proizvodi", icon: Package },
      { href: "/admin/orders", label: "Porudžbine", icon: ShoppingCart },
      { href: "/admin/users", label: "Korisnici", icon: Users },
      { href: "/admin/blog", label: "Blog", icon: FileText },
      { href: "/admin/seminars", label: "Seminari", icon: GraduationCap },
      { href: "/admin/analytics", label: "Analitika", icon: BarChart3 },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/promo-codes", label: "Promo Kodovi", icon: Ticket },
      { href: "/admin/bundles", label: "Paketi", icon: PackageOpen },
      { href: "/admin/banners", label: "Baneri", icon: Image },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/erp", label: "ERP Integracija", icon: Database },
      { href: "/admin/import", label: "Import/Export", icon: Upload },
      { href: "/admin/seo", label: "SEO", icon: Globe },
      { href: "/admin/settings", label: "Podešavanja", icon: Settings },
    ],
  },
];

// Flat list for compatibility
const navItems = navSections.flatMap((s) => s.items);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
    <div className="min-h-screen bg-[#fafafa] flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-[#1a1a1a] text-white z-40 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Alta Moda" className="h-6 brightness-0 invert" />
              <span className="text-[10px] font-semibold bg-[#c8a96e] text-[#1a1a1a] px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                        ? "bg-[#c8a96e]/15 text-[#c8a96e]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={20} className={active ? "text-[#c8a96e]" : "text-white/60 group-hover:text-white"} />
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                    {active && sidebarOpen && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c8a96e]" />
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
            <div className="w-9 h-9 rounded-full bg-[#c8a96e] flex items-center justify-center text-[#1a1a1a] font-semibold text-sm flex-shrink-0">
              AM
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin Korisnik</p>
                <p className="text-xs text-white/40">Super Admin</p>
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
        className={`fixed top-0 left-0 h-full w-72 bg-[#1a1a1a] text-white z-50 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Alta Moda" className="h-6 brightness-0 invert" />
            <span className="text-[10px] font-semibold bg-[#c8a96e] text-[#1a1a1a] px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                        ? "bg-[#c8a96e]/15 text-[#c8a96e]"
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
            <div className="w-9 h-9 rounded-full bg-[#c8a96e] flex items-center justify-center text-[#1a1a1a] font-semibold text-sm">
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
        <header className="sticky top-0 z-30 bg-white border-b border-[#e5e5e5] px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-[#1a1a1a] hover:text-[#c8a96e] transition-colors"
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
                placeholder="Pretraži..."
                className="w-full pl-10 pr-4 py-2 bg-[#f5f5f5] border border-transparent rounded-lg text-sm focus:border-[#c8a96e] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdownOpen(false);
                }}
                className="relative p-2 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] rounded-lg transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#e5e5e5] overflow-hidden animate-slideDown">
                  <div className="p-4 border-b border-[#e5e5e5]">
                    <h3 className="font-semibold text-sm text-[#1a1a1a]">Obaveštenja</h3>
                  </div>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 border-b border-[#f5f5f5] hover:bg-[#fafafa] cursor-pointer transition-colors ${
                        n.unread ? "bg-[#c8a96e]/5" : ""
                      }`}
                    >
                      <p className="text-sm text-[#333]">{n.text}</p>
                      <p className="text-xs text-[#999] mt-1">{n.time}</p>
                    </div>
                  ))}
                  <div className="p-3 text-center">
                    <button className="text-sm text-[#c8a96e] hover:text-[#a8894e] font-medium">
                      Prikaži sva obaveštenja
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
                className="flex items-center gap-2 p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#c8a96e] flex items-center justify-center text-white font-semibold text-xs">
                  AM
                </div>
                <span className="hidden sm:block text-sm font-medium text-[#333]">
                  Admin
                </span>
                <ChevronDown size={14} className="text-[#999]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#e5e5e5] overflow-hidden animate-slideDown">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-[#333] hover:bg-[#f5f5f5] transition-colors"
                  >
                    <User size={16} />
                    Moj Profil
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-[#333] hover:bg-[#f5f5f5] transition-colors"
                  >
                    <Settings size={16} />
                    Podešavanja
                  </Link>
                  <div className="border-t border-[#e5e5e5]">
                    <button className="flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full transition-colors">
                      <LogOut size={16} />
                      Odjavi se
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
