"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Search,
  Download,
  Mail,
  Plus,
  X,
  Users,
  Send,
  Clock,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  MousePointer,
  Eye,
  ShoppingCart,
  Gift,
  Sparkles,
  GraduationCap,
  UserPlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Loader2,
} from "lucide-react";

type Tab = "subscribers" | "campaigns" | "automations";

interface Subscriber {
  id: string;
  email: string;
  segment: "b2b" | "b2c";
  isSubscribed: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

interface Stats {
  totalActive: number;
  b2bCount: number;
  b2cCount: number;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  segment: "b2b" | "b2c";
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  sentAt: string | null;
  sentCount: number;
  openCount: number;
  clickCount: number;
  scheduledAt: string | null;
  createdAt: string;
}

interface Automation {
  id: number;
  name: string;
  description: string;
  target: string;
  enabled: boolean;
  lastTriggered: string;
  icon: "Gift" | "Sparkles" | "GraduationCap" | "UserPlus" | "ShoppingCart";
}

const initialAutomations: Automation[] = [
  { id: 1, name: "Nove akcije → B2C pretplatnici", description: "Automatski šalje obaveštenje o novim akcijama svim B2C pretplatnicima", target: "B2C", enabled: true, lastTriggered: "2026-03-05 10:30", icon: "Gift" },
  { id: 2, name: "Noviteti → Svi pretplatnici", description: "Obaveštava sve pretplatnike o novim proizvodima u ponudi", target: "Svi", enabled: true, lastTriggered: "2026-02-20 14:00", icon: "Sparkles" },
  { id: 3, name: "Seminari → B2B pretplatnici", description: "Šalje pozivnice za seminare registrovanim salonima", target: "B2B", enabled: true, lastTriggered: "2026-02-15 09:00", icon: "GraduationCap" },
  { id: 4, name: "Dobrodošlica + promo kod → Novi pretplatnici", description: "Automatski šalje email dobrodošlice sa promo kodom od 10% novim pretplatnicima", target: "Novi", enabled: true, lastTriggered: "2026-03-10 16:45", icon: "UserPlus" },
  { id: 5, name: "Podsećanje na korpu → Svi", description: "Šalje podsećanje korisnicima koji su napustili korpu bez kupovine", target: "Svi", enabled: false, lastTriggered: "2026-03-01 08:00", icon: "ShoppingCart" },
];

const iconMap = {
  Gift,
  Sparkles,
  GraduationCap,
  UserPlus,
  ShoppingCart,
};

export default function NewsletterPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("subscribers");
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [automations, setAutomations] = useState(initialAutomations);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({ title: "", subject: "", segment: "b2c", content: "" });
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [showSendConfirm, setShowSendConfirm] = useState<Campaign | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<Stats>({ totalActive: 0, b2bCount: 0, b2cCount: 0 });
  const [loading, setLoading] = useState(false);
  const limit = 20;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSubscribers = useCallback(async (searchVal: string, segmentVal: string, pageVal: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchVal,
        segment: segmentVal,
        page: String(pageVal),
        limit: String(limit),
      });
      const res = await fetch(`/api/newsletter?${params}`);
      const json = await res.json();
      if (json.success) {
        setSubscribers(json.data.subscribers);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error("Failed to fetch subscribers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/newsletter/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch("/api/newsletter/campaigns");
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data.campaigns || json.data);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers(search, segmentFilter, page);
    fetchStats();
  }, [page, segmentFilter, fetchSubscribers, fetchStats]);

  useEffect(() => {
    if (activeTab === "campaigns") {
      fetchCampaigns();
    }
  }, [activeTab, fetchCampaigns]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      fetchSubscribers(value, segmentFilter, 1);
    }, 300);
  };

  const handleSegmentChange = (value: string) => {
    setSegmentFilter(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/newsletter/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSubscribers(search, segmentFilter, page);
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to delete subscriber:", err);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        search: "",
        segment: "all",
        page: "1",
        limit: "10000",
      });
      const res = await fetch(`/api/newsletter?${params}`);
      const json = await res.json();
      if (!json.success) return;

      const rows = [[t("newsletter.email"), t("newsletter.segment"), t("newsletter.status"), t("newsletter.subscribeDate"), t("newsletter.unsubscribed")]];
      for (const sub of json.data.subscribers) {
        rows.push([
          sub.email,
          sub.segment.toUpperCase(),
          sub.isSubscribed ? t("newsletter.active") : t("newsletter.unsubscribed"),
          new Date(sub.subscribedAt).toLocaleDateString("sr-RS"),
          sub.unsubscribedAt ? new Date(sub.unsubscribedAt).toLocaleDateString("sr-RS") : "",
        ]);
      }
      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pretplatnici.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export:", err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const openNewCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({ title: "", subject: "", segment: "b2c", content: "" });
    setShowCampaignModal(true);
  };

  const openEditCampaign = (campaign: Campaign) => {
    if (campaign.status !== "draft") return;
    setEditingCampaign(campaign);
    setCampaignForm({
      title: campaign.title,
      subject: campaign.subject,
      segment: campaign.segment,
      content: campaign.content,
    });
    setShowCampaignModal(true);
  };

  const handleSaveCampaign = async () => {
    if (!campaignForm.title.trim() || !campaignForm.subject.trim()) return;
    setCampaignSaving(true);
    try {
      if (editingCampaign) {
        const res = await fetch(`/api/newsletter/campaigns/${editingCampaign.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaignForm),
        });
        if (!res.ok) throw new Error("Failed to update campaign");
      } else {
        const res = await fetch("/api/newsletter/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaignForm),
        });
        if (!res.ok) throw new Error("Failed to create campaign");
      }
      setShowCampaignModal(false);
      setEditingCampaign(null);
      setCampaignForm({ title: "", subject: "", segment: "b2c", content: "" });
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to save campaign:", err);
    } finally {
      setCampaignSaving(false);
    }
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    if (campaign.status === "sent" || campaign.status === "sending") return;
    try {
      const res = await fetch(`/api/newsletter/campaigns/${campaign.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Failed to delete campaign:", err);
    }
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    setSendingCampaignId(campaign.id);
    setShowSendConfirm(null);
    try {
      const res = await fetch(`/api/newsletter/campaigns/${campaign.id}/send`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to send campaign");
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to send campaign:", err);
    } finally {
      setSendingCampaignId(null);
    }
  };

  const handlePreviewCampaign = async (campaign: Campaign) => {
    setPreviewLoading(true);
    setShowPreviewModal(true);
    setPreviewHtml("");
    try {
      const res = await fetch(`/api/newsletter/campaigns/${campaign.id}/preview`);
      const json = await res.json();
      if (json.success) {
        setPreviewHtml(json.data.html);
      }
    } catch (err) {
      console.error("Failed to load preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getStatusLabel = (status: Campaign["status"]) => {
    switch (status) {
      case "draft": return "Nacrt";
      case "scheduled": return "Zakazano";
      case "sending": return "Slanje";
      case "sent": return "Poslato";
      case "failed": return "Neuspelo";
    }
  };

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-500";
      case "scheduled": return "bg-blue-100 text-blue-700";
      case "sending": return "bg-yellow-100 text-yellow-700";
      case "sent": return "bg-green-100 text-green-700";
      case "failed": return "bg-red-100 text-red-700";
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/newsletter/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setTestResult({ ok: true, msg: `Test email poslat na ${testEmail}` });
      } else {
        setTestResult({ ok: false, msg: json.error || "Greška pri slanju" });
      }
    } catch {
      setTestResult({ ok: false, msg: "Greška pri povezivanju sa serverom" });
    } finally {
      setTestSending(false);
    }
  };

  const toggleAutomation = (id: number) => {
    setAutomations(automations.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "subscribers", label: t("newsletter.subscribers") },
    { id: "campaigns", label: t("newsletter.campaigns") },
    { id: "automations", label: t("newsletter.automations") },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-black">{t("newsletter.title")}</h1>
          <p className="text-[#666] mt-1">{t("newsletter.subtitle")}</p>
        </div>
        <button
          onClick={() => { setShowTestModal(true); setTestResult(null); setTestEmail(""); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8c4a5a] hover:bg-[#703343] text-white text-sm font-medium rounded-sm transition-colors"
        >
          <Send className="w-4 h-4" /> Pošalji test email
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-sm p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white text-black shadow-sm" : "text-[#666] hover:text-[#333]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscribers Tab */}
      {activeTab === "subscribers" && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-sm border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#999] uppercase tracking-wider">{t("newsletter.totalActive")}</p>
                  <p className="text-2xl font-bold text-black mt-1">{stats.totalActive}</p>
                </div>
                <div className="w-10 h-10 rounded-sm bg-black/10 flex items-center justify-center">
                  <Users size={20} className="text-secondary" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-sm border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#999] uppercase tracking-wider">{t("newsletter.b2bSubscribers")}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.b2bCount}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">B2B</span>
              </div>
            </div>
            <div className="bg-white rounded-sm border border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#999] uppercase tracking-wider">{t("newsletter.b2cSubscribers")}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.b2cCount}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">B2C</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-sm border border-stone-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <input type="text" placeholder={t("newsletter.searchPlaceholder")} value={search} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none" />
              </div>
              <select value={segmentFilter} onChange={(e) => handleSegmentChange(e.target.value)} className="px-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none">
                <option value="all">{t("newsletter.allSegments")}</option>
                <option value="b2b">B2B</option>
                <option value="b2c">B2C</option>
              </select>
              <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-sm text-sm font-medium hover:bg-stone-100 transition-colors">
                <Download size={16} />
                {t("newsletter.exportSubscribers")}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-100 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">{t("newsletter.email")}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">{t("newsletter.segment")}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">{t("newsletter.subscribeDate")}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">{t("newsletter.status")}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">{t("newsletter.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#999]">{t("newsletter.loading")}</td>
                    </tr>
                  ) : subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#999]">{t("newsletter.noSubscribers")}</td>
                    </tr>
                  ) : (
                    subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-stone-100 hover:bg-stone-100 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-secondary" />
                            <span className="text-[#333]">{sub.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.segment === "b2b" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {sub.segment.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#666]">{new Date(sub.subscribedAt).toLocaleDateString("sr-RS")}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.isSubscribed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {sub.isSubscribed ? t("newsletter.active") : t("newsletter.unsubscribed")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors" title={t("newsletter.delete")}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200">
                <span className="text-sm text-[#666]">
                  {t("newsletter.pageOf")} {page} {t("newsletter.of")} {totalPages} ({total} {t("newsletter.totalLabel")})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 border border-stone-200 rounded-sm hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 border border-stone-200 rounded-sm hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div>
          <div className="flex justify-end mb-6">
            <button onClick={openNewCampaign} className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-sm hover:bg-[#b8994e] transition-colors font-medium text-sm">
              <Plus size={18} />
              {t("newsletter.newCampaign")}
            </button>
          </div>
          <div className="space-y-4">
            {campaignsLoading ? (
              <div className="bg-white rounded-sm border border-stone-200 p-8 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#999]" />
                <span className="ml-2 text-[#999]">{t("newsletter.loading")}</span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white rounded-sm border border-stone-200 p-8 text-center text-[#999]">{t("newsletter.noCampaigns")}</div>
            ) : (
              campaigns.map((campaign) => {
                const openRate = campaign.sentCount > 0 ? Math.round((campaign.openCount / campaign.sentCount) * 100) : 0;
                const clickRate = campaign.sentCount > 0 ? Math.round((campaign.clickCount / campaign.sentCount) * 100) : 0;
                const isSending = sendingCampaignId === campaign.id;

                return (
                  <div key={campaign.id} className="bg-white rounded-sm border border-stone-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-black mb-1">{campaign.title}</h3>
                        <p className="text-sm text-[#666] mb-2">{campaign.subject}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${campaign.segment === "b2b" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {campaign.segment.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {getStatusLabel(campaign.status)}
                          </span>
                          {campaign.sentAt && (
                            <span className="text-xs text-[#999]">
                              {new Date(campaign.sentAt).toLocaleDateString("sr-RS")}
                            </span>
                          )}
                          {campaign.status === "sent" && (
                            <span className="text-xs text-[#999]">
                              {campaign.sentCount} poslato
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        {campaign.status === "sent" && (
                          <div className="flex items-center gap-3 sm:gap-6">
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-secondary">
                                <BarChart3 size={14} />
                                <span className="text-base sm:text-lg font-bold">{openRate}%</span>
                              </div>
                              <p className="text-xs text-[#999]">{t("newsletter.opened")}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-secondary">
                                <MousePointer size={14} />
                                <span className="text-base sm:text-lg font-bold">{clickRate}%</span>
                              </div>
                              <p className="text-xs text-[#999]">{t("newsletter.clicked")}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <button onClick={() => handlePreviewCampaign(campaign)} className="p-1.5 text-[#666] hover:text-secondary hover:bg-stone-100 rounded-sm transition-colors" title="Pregled">
                            <Eye size={16} />
                          </button>
                          {campaign.status === "draft" && (
                            <button onClick={() => openEditCampaign(campaign)} className="p-1.5 text-[#666] hover:text-secondary hover:bg-stone-100 rounded-sm transition-colors" title={t("admin.edit")}>
                              <Pencil size={16} />
                            </button>
                          )}
                          {campaign.status === "draft" && (
                            <button
                              onClick={() => setShowSendConfirm(campaign)}
                              disabled={isSending}
                              className="p-1.5 text-[#666] hover:text-green-600 hover:bg-green-50 rounded-sm transition-colors disabled:opacity-40"
                              title="Pošalji"
                            >
                              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                          )}
                          {campaign.status !== "sent" && campaign.status !== "sending" && (
                            <button onClick={() => handleDeleteCampaign(campaign)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors" title={t("admin.delete")}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Automations Tab */}
      {activeTab === "automations" && (
        <div className="space-y-4">
          {automations.map((automation) => {
            const Icon = iconMap[automation.icon];
            return (
              <div key={automation.id} className="bg-white rounded-sm border border-stone-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 ${automation.enabled ? "bg-black/10" : "bg-gray-100"}`}>
                      <Icon size={20} className={automation.enabled ? "text-secondary" : "text-gray-400"} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-black mb-1">{automation.name}</h3>
                      <p className="text-sm text-[#666] mb-2">{automation.description}</p>
                      <div className="flex items-center gap-3 text-xs text-[#999]">
                        <span className="bg-stone-100 px-2 py-0.5 rounded">{t("newsletter.target")}: {automation.target}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {t("newsletter.lastTriggered")}: {automation.lastTriggered}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggleAutomation(automation.id)} className="flex-shrink-0">
                    {automation.enabled ? (
                      <ToggleRight size={32} className="text-secondary" />
                    ) : (
                      <ToggleLeft size={32} className="text-[#999]" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowCampaignModal(false); setEditingCampaign(null); }}>
          <div className="bg-white rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="font-serif text-xl font-bold text-black">{editingCampaign ? t("newsletter.editCampaign") : t("newsletter.newCampaign")}</h2>
              <button onClick={() => { setShowCampaignModal(false); setEditingCampaign(null); }} className="p-1 hover:bg-stone-100 rounded-sm"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">{t("newsletter.campaignTitle")}</label>
                <input type="text" value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} className="w-full px-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none" placeholder={t("newsletter.campaignTitlePlaceholder")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Subject</label>
                <input type="text" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} className="w-full px-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none" placeholder="Subject line za email..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">{t("newsletter.campaignSegment")}</label>
                <select value={campaignForm.segment} onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value })} className="w-full px-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none">
                  <option value="b2b">B2B</option>
                  <option value="b2c">B2C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Sadržaj</label>
                <textarea
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-200 rounded-sm text-sm focus:border-black focus:outline-none min-h-[200px] resize-y"
                  placeholder="Sadržaj email kampanje..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-200">
              <button onClick={() => { setShowCampaignModal(false); setEditingCampaign(null); }} className="px-5 py-2.5 border border-stone-200 rounded-sm text-sm font-medium hover:bg-stone-100 transition-colors">{t("newsletter.cancel")}</button>
              <button onClick={handleSaveCampaign} disabled={!campaignForm.title.trim() || !campaignForm.subject.trim() || campaignSaving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-sm text-sm font-medium hover:bg-[#b8994e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {campaignSaving && <Loader2 size={16} className="animate-spin" />}
                {editingCampaign ? t("newsletter.saveChanges") : t("newsletter.createCampaign")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Modal */}
      {showSendConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSendConfirm(null)}>
          <div className="bg-white rounded-sm w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="font-serif text-xl font-bold text-black">Potvrda slanja</h2>
              <button onClick={() => setShowSendConfirm(null)} className="p-1 hover:bg-stone-100 rounded-sm"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#333]">
                Da li ste sigurni da želite da pošaljete ovu kampanju? Biće poslata svim {showSendConfirm.segment.toUpperCase()} pretplatnicima.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-200">
              <button onClick={() => setShowSendConfirm(null)} className="px-5 py-2.5 border border-stone-200 rounded-sm text-sm font-medium hover:bg-stone-100 transition-colors">{t("newsletter.cancel")}</button>
              <button onClick={() => handleSendCampaign(showSendConfirm)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-sm text-sm font-medium hover:bg-[#b8994e] transition-colors">
                <Send size={16} />
                Pošalji
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="font-serif text-xl font-bold text-black">Pregled kampanje</h2>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 hover:bg-stone-100 rounded-sm"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[#999]" />
                  <span className="ml-2 text-[#999]">Učitavanje pregleda...</span>
                </div>
              ) : (
                <div className="border border-stone-200 rounded-sm overflow-hidden">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full min-h-[500px] border-0"
                    title="Campaign Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTestModal(false)}>
          <div className="bg-white rounded-sm max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Pošalji test email</h3>
              <button onClick={() => setShowTestModal(false)} className="text-[#999] hover:text-black"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-[#666] mb-4">Unesite email adresu na koju želite da pošaljete probni newsletter email.</p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="vasa@email.com"
              className="w-full border border-stone-200 rounded-sm px-4 py-2.5 text-sm focus:border-black focus:outline-none mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
            />
            {testResult && (
              <div className={`p-3 rounded-sm text-sm mb-4 ${testResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {testResult.msg}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowTestModal(false)} className="flex-1 px-4 py-2.5 border border-stone-200 text-[#666] rounded-sm text-sm font-medium hover:bg-stone-50 transition-colors">Otkaži</button>
              <button
                onClick={handleSendTest}
                disabled={testSending || !testEmail.trim()}
                className="flex-1 px-4 py-2.5 bg-[#8c4a5a] hover:bg-[#703343] text-white rounded-sm text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Slanje...</> : <><Send className="w-4 h-4" /> Pošalji</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
