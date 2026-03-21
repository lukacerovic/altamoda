"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  Building,
  Shield,
  ShieldCheck,
  ShieldX,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: "B2B" | "B2C";
  registrationDate: string;
  ordersCount: number;
  totalSpent: number;
  status: "active" | "blocked" | "pending";
  salonName?: string;
  pib?: string;
  address?: string;
  city?: string;
  orders?: { id: string; date: string; total: number; status: string }[];
}

const mockUsers: UserData[] = [
  {
    id: 1, name: "Salon Glamour", email: "info@salonglamour.rs", phone: "+381 11 234 5678",
    type: "B2B", registrationDate: "15.01.2026", ordersCount: 24, totalSpent: 458000, status: "active",
    salonName: "Salon Glamour", pib: "108234567", address: "Knez Mihailova 22", city: "Beograd",
    orders: [
      { id: "#1048", date: "17.03.2026", total: 26300, status: "Isporučeno" },
      { id: "#1032", date: "10.03.2026", total: 18500, status: "Isporučeno" },
      { id: "#1020", date: "28.02.2026", total: 34200, status: "Isporučeno" },
    ],
  },
  {
    id: 2, name: "Marija Petrović", email: "marija.p@gmail.com", phone: "+381 63 123 4567",
    type: "B2C", registrationDate: "22.02.2026", ordersCount: 3, totalSpent: 12800, status: "active",
    address: "Bulevar Oslobođenja 88", city: "Novi Sad",
    orders: [
      { id: "#1047", date: "17.03.2026", total: 5450, status: "U Obradi" },
      { id: "#1025", date: "05.03.2026", total: 3500, status: "Isporučeno" },
    ],
  },
  {
    id: 3, name: "Beauty Studio NS", email: "beauty.studio@gmail.com", phone: "+381 21 456 7890",
    type: "B2B", registrationDate: "03.12.2025", ordersCount: 38, totalSpent: 892000, status: "active",
    salonName: "Beauty Studio", pib: "109876543", address: "Jevrejska 10", city: "Novi Sad",
    orders: [
      { id: "#1046", date: "16.03.2026", total: 36000, status: "Isporučeno" },
      { id: "#1030", date: "08.03.2026", total: 42500, status: "Isporučeno" },
    ],
  },
  {
    id: 4, name: "Ana Jovanović", email: "ana.j@yahoo.com", phone: "+381 64 987 6543",
    type: "B2C", registrationDate: "10.03.2026", ordersCount: 1, totalSpent: 0, status: "active",
    address: "Cara Dušana 15", city: "Niš",
    orders: [{ id: "#1045", date: "16.03.2026", total: 1200, status: "Otkazano" }],
  },
  {
    id: 5, name: "Salon Prestige", email: "prestige@salon.rs", phone: "+381 11 333 4444",
    type: "B2B", registrationDate: "20.09.2025", ordersCount: 52, totalSpent: 1245000, status: "active",
    salonName: "Salon Prestige", pib: "107654321", address: "Terazije 5", city: "Beograd",
    orders: [
      { id: "#1044", date: "15.03.2026", total: 73100, status: "U Obradi" },
      { id: "#1028", date: "06.03.2026", total: 55800, status: "Isporučeno" },
    ],
  },
  {
    id: 6, name: "Hair Art Studio", email: "contact@hairart.rs", phone: "+381 34 555 6666",
    type: "B2B", registrationDate: "15.11.2025", ordersCount: 18, totalSpent: 324000, status: "active",
    salonName: "Hair Art Studio", pib: "110234567", address: "Kneza Miloša 33", city: "Kragujevac",
    orders: [{ id: "#1042", date: "14.03.2026", total: 51000, status: "Isporučeno" }],
  },
  {
    id: 7, name: "Ivana Marković", email: "ivana.m@hotmail.com", phone: "+381 66 222 3333",
    type: "B2C", registrationDate: "01.03.2026", ordersCount: 2, totalSpent: 7200, status: "blocked",
    address: "Gospodar Jevremova 40", city: "Beograd",
    orders: [],
  },
  {
    id: 8, name: "Studio Lepote BG", email: "studio.lepote.bg@gmail.com", phone: "+381 11 777 8888",
    type: "B2B", registrationDate: "16.03.2026", ordersCount: 0, totalSpent: 0, status: "pending",
    salonName: "Studio Lepote", pib: "111234567", address: "Makedonska 12", city: "Beograd",
    orders: [],
  },
  {
    id: 9, name: "Petar Đorđević", email: "petar.dj@gmail.com", phone: "+381 63 444 5555",
    type: "B2C", registrationDate: "28.02.2026", ordersCount: 5, totalSpent: 18500, status: "active",
    address: "Bulevar Cara Lazara 80", city: "Novi Sad",
    orders: [],
  },
  {
    id: 10, name: "Salon Elegance", email: "elegance.nis@gmail.com", phone: "+381 18 999 0000",
    type: "B2B", registrationDate: "17.03.2026", ordersCount: 0, totalSpent: 0, status: "pending",
    salonName: "Salon Elegance", pib: "112345678", address: "Obrenovićeva 22", city: "Niš",
    orders: [],
  },
];

export default function UsersPage() {
  const { t } = useLanguage();

  const typeFilters = [t("admin.all"), "B2B", "B2C"];
  const statusFilterOptions = [t("admin.allStatuses"), t("admin.active"), t("admin.blocked"), t("admin.pending")];

  const [users, setUsers] = useState<UserData[]>(mockUsers);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(t("admin.all"));
  const [statusFilter, setStatusFilter] = useState(t("admin.allStatuses"));
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 8;

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === t("admin.all") || u.type === typeFilter;
    const matchStatus =
      statusFilter === t("admin.allStatuses") ||
      (statusFilter === t("admin.active") && u.status === "active") ||
      (statusFilter === t("admin.blocked") && u.status === "blocked") ||
      (statusFilter === t("admin.pending") && u.status === "pending");
    return matchSearch && matchType && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleUserStatus = (userId: number) => {
    setUsers(users.map((u) => {
      if (u.id === userId) {
        return { ...u, status: u.status === "active" ? "blocked" : "active" };
      }
      return u;
    }));
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, status: selectedUser.status === "active" ? "blocked" : "active" });
    }
  };

  const approveUser = (userId: number) => {
    setUsers(users.map((u) => u.id === userId ? { ...u, status: "active" } : u));
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, status: "active" });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{t("admin.active")}</span>;
      case "blocked": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">{t("admin.blocked")}</span>;
      case "pending": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{t("admin.pending")}</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-black">{t("admin.users")}</h1>
        <p className="text-sm text-[#666] mt-1">{users.length} {t("admin.registeredUsers")}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-sm border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              type="text"
              placeholder={t("admin.searchUsers")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-stone-100 rounded-sm text-sm text-[#666]">
            <Filter size={16} /> {t("admin.filters")}
          </button>
          <div className={`${showFilters ? "flex" : "hidden"} sm:flex flex-col sm:flex-row gap-3`}>
            <div className="flex gap-2">
              {typeFilters.map((tf) => (
                <button
                  key={tf}
                  onClick={() => { setTypeFilter(tf); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                    typeFilter === tf ? "bg-stone-900 text-white" : "bg-stone-100 text-[#666] hover:bg-[#c4c7c7]"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm cursor-pointer focus:border-black"
            >
              {statusFilterOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* B2B Pending count */}
        {users.filter((u) => u.status === "pending").length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center gap-2">
            <Shield size={16} className="text-secondary" />
            <span className="text-sm text-[#666]">
              <span className="font-semibold text-secondary">{users.filter((u) => u.status === "pending").length}</span> {t("admin.b2bPendingApproval")}
            </span>
          </div>
        )}
      </div>

      {/* Table + Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Users Table */}
        <div className={`bg-white rounded-sm border border-stone-200 overflow-hidden ${selectedUser ? "lg:flex-1" : "w-full"}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.user")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">{t("admin.type")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden lg:table-cell">{t("admin.registration")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">{t("admin.orders")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">{t("admin.spent")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.status")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {paginated.map((user) => (
                  <tr key={user.id} className={`hover:bg-stone-100 transition-colors cursor-pointer ${selectedUser?.id === user.id ? "bg-black/5" : ""}`} onClick={() => setSelectedUser(user)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-[#999] flex-shrink-0">
                          <User size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-black truncate">{user.name}</p>
                          <p className="text-xs text-[#999] truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${user.type === "B2B" ? "bg-stone-900 text-secondary" : "bg-stone-100 text-[#666]"}`}>
                        {user.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#666] hidden lg:table-cell">{user.registrationDate}</td>
                    <td className="px-6 py-4 text-sm text-[#333] hidden sm:table-cell">{user.ordersCount}</td>
                    <td className="px-6 py-4 text-sm font-medium text-black hidden md:table-cell">{user.totalSpent.toLocaleString()} RSD</td>
                    <td className="px-6 py-4">{statusBadge(user.status)}</td>
                    <td className="px-6 py-4">
                      <button className="p-1.5 text-[#999] hover:text-secondary rounded-sm transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
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

        {/* User Detail Panel */}
        {selectedUser && (
          <div className="w-full lg:w-96 bg-white rounded-sm border border-stone-200 overflow-hidden flex-shrink-0">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-semibold text-black">{t("admin.userDetails")}</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 text-[#999] hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center text-secondary mx-auto mb-3">
                  <User size={28} />
                </div>
                <h4 className="font-semibold text-black">{selectedUser.name}</h4>
                <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${selectedUser.type === "B2B" ? "bg-stone-900 text-secondary" : "bg-stone-100 text-[#666]"}`}>
                  {selectedUser.type}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-[#999]" />
                  <span className="text-[#333]">{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-[#999]" />
                  <span className="text-[#333]">{selectedUser.phone}</span>
                </div>
                {selectedUser.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-[#999]" />
                    <span className="text-[#333]">{selectedUser.address}, {selectedUser.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-[#999]" />
                  <span className="text-[#333]">{t("admin.registration")}: {selectedUser.registrationDate}</span>
                </div>
              </div>

              {/* B2B Details */}
              {selectedUser.type === "B2B" && (
                <div className="p-4 rounded-sm bg-stone-100 border border-stone-200">
                  <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">{t("admin.b2bData")}</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building size={14} className="text-[#999]" />
                      <span className="text-[#333]">{selectedUser.salonName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs font-medium text-[#999] w-[14px] text-center">PIB</span>
                      <span className="text-[#333]">{selectedUser.pib}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-sm bg-stone-100 text-center">
                  <p className="text-xl font-bold text-black">{selectedUser.ordersCount}</p>
                  <p className="text-xs text-[#999]">{t("admin.orders")}</p>
                </div>
                <div className="p-3 rounded-sm bg-stone-100 text-center">
                  <p className="text-xl font-bold text-black">{(selectedUser.totalSpent / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-[#999]">{t("admin.rsdSpent")}</p>
                </div>
              </div>

              {/* Recent Orders */}
              {selectedUser.orders && selectedUser.orders.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">{t("admin.lastOrders")}</h5>
                  <div className="space-y-2">
                    {selectedUser.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-sm bg-stone-100">
                        <div>
                          <p className="text-sm font-medium text-secondary">{order.id}</p>
                          <p className="text-xs text-[#999]">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-black">{order.total.toLocaleString()} RSD</p>
                          <p className="text-xs text-[#999]">{order.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-stone-200">
                {selectedUser.status === "pending" ? (
                  <button
                    onClick={() => approveUser(selectedUser.id)}
                    className="w-full btn-gold px-4 py-2.5 rounded-sm text-sm flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={16} />
                    {t("admin.approveB2b")}
                  </button>
                ) : (
                  <button
                    onClick={() => toggleUserStatus(selectedUser.id)}
                    className={`w-full px-4 py-2.5 rounded-sm text-sm flex items-center justify-center gap-2 font-medium transition-colors ${
                      selectedUser.status === "active"
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                  >
                    {selectedUser.status === "active" ? (
                      <><ShieldX size={16} /> {t("admin.blockUser")}</>
                    ) : (
                      <><ShieldCheck size={16} /> {t("admin.activateUser")}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
