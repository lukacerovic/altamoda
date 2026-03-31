"use client";

import { useState, useEffect, useCallback } from "react";
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
  Building,
  Shield,
  ShieldCheck,
  ShieldX,
  Eye,
  Loader2,
  Hash,
} from "lucide-react";

interface B2bProfile {
  salonName: string;
  pib: string | null;
  maticniBroj: string | null;
  address: string | null;
  discountTier: number;
  erpSubjectId: string | null;
  approvedAt: string | null;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "b2b" | "b2c" | "admin";
  status: "active" | "pending" | "suspended";
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  b2bProfile: B2bProfile | null;
}

export default function UsersPage() {
  const { t } = useLanguage();

  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const perPage = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(perPage),
      });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setTotal(json.data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, roleFilter, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);


  const totalPages = Math.ceil(total / perPage);
  const pendingCount = users.filter((u) => u.status === "pending").length;

  const approveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}/approve`, { method: "PATCH" });
      if (res.ok) {
        // Update local state immediately
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: "active" as const } : u));
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: "active" });
        }
      }
    } catch (err) {
      console.error("Failed to approve user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}/reject`, { method: "PATCH" });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: "suspended" as const } : u));
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: "suspended" });
        }
      }
    } catch (err) {
      console.error("Failed to reject user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("sr-Latn-RS", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{t("admin.active")}</span>;
      case "suspended": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">{t("admin.blocked")}</span>;
      case "pending": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{t("admin.pending")}</span>;
      default: return null;
    }
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case "b2b": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-stone-900 text-white">B2B</span>;
      case "b2c": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-[#666]">B2C</span>;
      case "admin": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Admin</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-black">{t("admin.users")}</h1>
        <p className="text-sm text-[#666] mt-1">{total} {t("admin.registeredUsers")}</p>
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
              {[
                { value: "all", label: t("admin.all") },
                { value: "b2b", label: "B2B" },
                { value: "b2c", label: "B2C" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setRoleFilter(opt.value); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                    roleFilter === opt.value ? "bg-stone-900 text-white" : "bg-stone-100 text-[#666] hover:bg-[#c4c7c7]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm cursor-pointer focus:border-black"
            >
              <option value="all">{t("admin.allStatuses")}</option>
              <option value="active">{t("admin.active")}</option>
              <option value="pending">{t("admin.pending")}</option>
              <option value="suspended">{t("admin.blocked")}</option>
            </select>
          </div>
        </div>

        {/* B2B Pending count */}
        {pendingCount > 0 && (
          <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center gap-2">
            <Shield size={16} className="text-secondary" />
            <span className="text-sm text-[#666]">
              <span className="font-semibold text-secondary">{pendingCount}</span> {t("admin.b2bPendingApproval")}
            </span>
            <button
              onClick={() => { setRoleFilter("b2b"); setStatusFilter("pending"); setCurrentPage(1); }}
              className="ml-2 text-xs text-secondary underline hover:text-black"
            >
              {t("admin.showPending")}
            </button>
          </div>
        )}
      </div>

      {/* Table + Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Users Table */}
        <div className={`bg-white rounded-sm border border-stone-200 overflow-hidden ${selectedUser ? "lg:flex-1" : "w-full"}`}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-[#999]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.user")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">{t("admin.type")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden lg:table-cell">Salon</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">Telefon</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden xl:table-cell">{t("admin.registration")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">{t("admin.orders")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">{t("admin.spent")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.status")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-sm text-[#999]">
                        {t("admin.noUsersFound")}
                      </td>
                    </tr>
                  ) : users.map((user) => (
                    <tr key={user.id} className={`hover:bg-stone-100 transition-colors cursor-pointer ${selectedUser?.id === user.id ? "bg-black/5" : ""}`} onClick={() => setSelectedUser(user)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${user.status === "pending" ? "bg-yellow-50 text-yellow-600" : "bg-stone-100 text-[#999]"}`}>
                            <User size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-black truncate">{user.name}</p>
                            <p className="text-xs text-[#999] truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">{roleBadge(user.role)}</td>
                      <td className="px-6 py-4 text-sm text-[#333] hidden lg:table-cell truncate max-w-[160px]">{user.b2bProfile?.salonName || "—"}</td>
                      <td className="px-6 py-4 text-sm text-[#666] hidden sm:table-cell">{user.phone || "—"}</td>
                      <td className="px-6 py-4 text-sm text-[#666] hidden xl:table-cell">{formatDate(user.createdAt)}</td>
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between">
              <span className="text-sm text-[#666]">
                {t("admin.showing")} {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, total)} {t("admin.of")} {total}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-sm text-[#666] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 5) {
                    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    page = start + i;
                  }
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-sm text-sm font-medium transition-colors ${page === currentPage ? "bg-black text-white" : "text-[#666] hover:bg-stone-100"}`}>
                      {page}
                    </button>
                  );
                })}
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
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${selectedUser.status === "pending" ? "bg-yellow-50 text-yellow-600" : "bg-black/10 text-secondary"}`}>
                  <User size={28} />
                </div>
                <h4 className="font-semibold text-black">{selectedUser.name}</h4>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {roleBadge(selectedUser.role)}
                  {statusBadge(selectedUser.status)}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-[#999]" />
                  <span className="text-[#333]">{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-[#999]" />
                    <span className="text-[#333]">{selectedUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-[#999]" />
                  <span className="text-[#333]">{t("admin.registration")}: {formatDate(selectedUser.createdAt)}</span>
                </div>
              </div>

              {/* B2B Details */}
              {selectedUser.b2bProfile && (
                <div className="p-4 rounded-sm bg-stone-100 border border-stone-200">
                  <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">{t("admin.b2bData")}</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building size={14} className="text-[#999]" />
                      <span className="text-[#333]">{selectedUser.b2bProfile.salonName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs font-medium text-[#999] w-[14px] text-center">PIB</span>
                      <span className="text-[#333]">{selectedUser.b2bProfile.pib}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Hash size={14} className="text-[#999]" />
                      <span className="text-[#333]">{t("admin.maticniBroj")}: {selectedUser.b2bProfile.maticniBroj}</span>
                    </div>
                    {selectedUser.b2bProfile.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-[#999]" />
                        <span className="text-[#333]">{selectedUser.b2bProfile.address}</span>
                      </div>
                    )}
                    {selectedUser.b2bProfile.erpSubjectId && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-xs font-medium text-[#999] w-[14px] text-center">ID</span>
                        <span className="text-[#333] font-mono text-xs">Pantheon: {selectedUser.b2bProfile.erpSubjectId}</span>
                      </div>
                    )}
                    {selectedUser.b2bProfile.approvedAt && (
                      <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-stone-200">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span className="text-emerald-700 text-xs">
                          {t("admin.approvedOn")} {formatDate(selectedUser.b2bProfile.approvedAt)}
                        </span>
                      </div>
                    )}
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
                  <p className="text-xl font-bold text-black">{selectedUser.totalSpent > 1000 ? `${(selectedUser.totalSpent / 1000).toFixed(0)}k` : selectedUser.totalSpent}</p>
                  <p className="text-xs text-[#999]">{t("admin.rsdSpent")}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-stone-200">
                {selectedUser.status === "pending" && (
                  <>
                    <button
                      onClick={() => approveUser(selectedUser.id)}
                      disabled={actionLoading === selectedUser.id}
                      className="w-full px-4 py-3 rounded-sm text-sm font-semibold flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selectedUser.id ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                      {t("admin.approveB2b")}
                    </button>
                    <button
                      onClick={() => rejectUser(selectedUser.id)}
                      disabled={actionLoading === selectedUser.id}
                      className="w-full px-4 py-2.5 rounded-sm text-sm flex items-center justify-center gap-2 font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selectedUser.id ? <Loader2 size={16} className="animate-spin" /> : <ShieldX size={16} />}
                      {t("admin.rejectB2b")}
                    </button>
                  </>
                )}
                {selectedUser.status === "active" && selectedUser.role !== "admin" && (
                  <button
                    onClick={() => rejectUser(selectedUser.id)}
                    disabled={actionLoading === selectedUser.id}
                    className="w-full px-4 py-2.5 rounded-sm text-sm flex items-center justify-center gap-2 font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <ShieldX size={16} />
                    {t("admin.blockUser")}
                  </button>
                )}
                {selectedUser.status === "suspended" && (
                  <button
                    onClick={() => approveUser(selectedUser.id)}
                    disabled={actionLoading === selectedUser.id}
                    className="w-full px-4 py-2.5 rounded-sm text-sm flex items-center justify-center gap-2 font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck size={16} />
                    {t("admin.activateUser")}
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
