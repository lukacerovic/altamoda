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
  id: number;
  title: string;
  segment: "Svi" | "B2B" | "B2C";
  sentDate: string;
  openRate: number;
  clickRate: number;
  status: "draft" | "sent" | "scheduled";
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

const initialCampaigns: Campaign[] = [
  { id: 1, title: "Prolećna akcija - do 30% popusta", segment: "Svi", sentDate: "2026-03-05", openRate: 42, clickRate: 12, status: "sent" },
  { id: 2, title: "Novi Kérastase proizvodi stigli!", segment: "B2C", sentDate: "2026-02-20", openRate: 38, clickRate: 8, status: "sent" },
  { id: 3, title: "B2B posebna ponuda - April", segment: "B2B", sentDate: "", openRate: 0, clickRate: 0, status: "scheduled" },
  { id: 4, title: "Letnji vodič za negu kose", segment: "Svi", sentDate: "", openRate: 0, clickRate: 0, status: "draft" },
];

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
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({ subject: "", segment: "Svi", contentType: "Akcije" });

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

  useEffect(() => {
    fetchSubscribers(search, segmentFilter, page);
    fetchStats();
  }, [page, segmentFilter, fetchSubscribers, fetchStats]);

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
    setCampaignForm({ subject: "", segment: "Svi", contentType: "Akcije" });
    setShowCampaignModal(true);
  };

  const openEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({ subject: campaign.title, segment: campaign.segment, contentType: "Akcije" });
    setShowCampaignModal(true);
  };

  const handleSaveCampaign = () => {
    if (!campaignForm.subject.trim()) return;
    if (editingCampaign) {
      setCampaigns(campaigns.map((c) =>
        c.id === editingCampaign.id
          ? { ...c, title: campaignForm.subject, segment: campaignForm.segment as Campaign["segment"] }
          : c
      ));
    } else {
      const newCampaign: Campaign = {
        id: Date.now(),
        title: campaignForm.subject,
        segment: campaignForm.segment as Campaign["segment"],
        sentDate: "",
        openRate: 0,
        clickRate: 0,
        status: "draft",
      };
      setCampaigns([newCampaign, ...campaigns]);
    }
    setShowCampaignModal(false);
    setEditingCampaign(null);
    setCampaignForm({ subject: "", segment: "Svi", contentType: "Akcije" });
  };

  const handleDeleteCampaign = (id: number) => {
    setCampaigns(campaigns.filter((c) => c.id !== id));
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
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#2d2d2d]">{t("newsletter.title")}</h1>
          <p className="text-[#666] mt-1">{t("newsletter.subtitle")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f0e8] rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#666] hover:text-[#333]"}`}
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
            <div className="bg-white rounded-xl border border-[#e0d8cc] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#999] uppercase tracking-wider">{t("newsletter.totalActive")}</p>
                  <p className="text-2xl font-bold text-[#2d2d2d] mt-1">{stats.totalActive}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#8c4a5a]/10 flex items-center justify-center">
                  <Users size={20} className="text-[#8c4a5a]" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#e0d8cc] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#999] uppercase tracking-wider">{t("newsletter.b2bSubscribers")}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.b2bCount}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">B2B</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#e0d8cc] p-4">
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
          <div className="bg-white rounded-xl border border-[#e0d8cc] p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <input type="text" placeholder={t("newsletter.searchPlaceholder")} value={search} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
              </div>
              <select value={segmentFilter} onChange={(e) => handleSegmentChange(e.target.value)} className="px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                <option value="all">{t("newsletter.allSegments")}</option>
                <option value="b2b">B2B</option>
                <option value="b2c">B2C</option>
              </select>
              <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm font-medium hover:bg-[#f5f0e8] transition-colors">
                <Download size={16} />
                {t("newsletter.exportSubscribers")}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f5f0e8] border-b border-[#e0d8cc]">
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
                      <tr key={sub.id} className="border-b border-[#f5f0e8] hover:bg-[#f5f0e8] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-[#8c4a5a]" />
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
                          <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t("newsletter.delete")}>
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#e0d8cc]">
                <span className="text-sm text-[#666]">
                  {t("newsletter.pageOf")} {page} {t("newsletter.of")} {totalPages} ({total} {t("newsletter.totalLabel")})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 border border-[#e0d8cc] rounded-lg hover:bg-[#f5f0e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 border border-[#e0d8cc] rounded-lg hover:bg-[#f5f0e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            <button onClick={openNewCampaign} className="inline-flex items-center gap-2 bg-[#8c4a5a] text-white px-5 py-2.5 rounded-lg hover:bg-[#b8994e] transition-colors font-medium text-sm">
              <Plus size={18} />
              {t("newsletter.newCampaign")}
            </button>
          </div>
          <div className="space-y-4">
            {campaigns.length === 0 && (
              <div className="bg-white rounded-xl border border-[#e0d8cc] p-8 text-center text-[#999]">{t("newsletter.noCampaigns")}</div>
            )}
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-xl border border-[#e0d8cc] p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2d2d2d] mb-2">{campaign.title}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs bg-[#f5f0e8] text-[#666] px-2 py-1 rounded">{campaign.segment}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === "sent" ? "bg-green-100 text-green-700" :
                        campaign.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {campaign.status === "sent" ? t("newsletter.sent") : campaign.status === "scheduled" ? t("newsletter.scheduled") : t("newsletter.draft")}
                      </span>
                      {campaign.sentDate && <span className="text-xs text-[#999]">{campaign.sentDate}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {campaign.status === "sent" && (
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-[#8c4a5a]">
                            <Eye size={14} />
                            <span className="text-lg font-bold">{campaign.openRate}%</span>
                          </div>
                          <p className="text-xs text-[#999]">{t("newsletter.opened")}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-[#8c4a5a]">
                            <MousePointer size={14} />
                            <span className="text-lg font-bold">{campaign.clickRate}%</span>
                          </div>
                          <p className="text-xs text-[#999]">{t("newsletter.clicked")}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditCampaign(campaign)} className="p-1.5 text-[#666] hover:text-[#8c4a5a] hover:bg-[#f5f0e8] rounded-lg transition-colors" title={t("admin.edit")}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteCampaign(campaign.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t("admin.delete")}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automations Tab */}
      {activeTab === "automations" && (
        <div className="space-y-4">
          {automations.map((automation) => {
            const Icon = iconMap[automation.icon];
            return (
              <div key={automation.id} className="bg-white rounded-xl border border-[#e0d8cc] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${automation.enabled ? "bg-[#8c4a5a]/10" : "bg-gray-100"}`}>
                      <Icon size={20} className={automation.enabled ? "text-[#8c4a5a]" : "text-gray-400"} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2d2d2d] mb-1">{automation.name}</h3>
                      <p className="text-sm text-[#666] mb-2">{automation.description}</p>
                      <div className="flex items-center gap-3 text-xs text-[#999]">
                        <span className="bg-[#f5f0e8] px-2 py-0.5 rounded">{t("newsletter.target")}: {automation.target}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {t("newsletter.lastTriggered")}: {automation.lastTriggered}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggleAutomation(automation.id)} className="flex-shrink-0">
                    {automation.enabled ? (
                      <ToggleRight size={32} className="text-[#8c4a5a]" />
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
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#e0d8cc]">
              <h2 className="font-serif text-xl font-bold text-[#2d2d2d]">{editingCampaign ? t("newsletter.editCampaign") : t("newsletter.newCampaign")}</h2>
              <button onClick={() => { setShowCampaignModal(false); setEditingCampaign(null); }} className="p-1 hover:bg-[#f5f0e8] rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">{t("newsletter.campaignTitle")}</label>
                <input type="text" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" placeholder={t("newsletter.campaignTitlePlaceholder")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">{t("newsletter.campaignSegment")}</label>
                <select value={campaignForm.segment} onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                  <option value="Svi">Svi</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">{t("newsletter.contentType")}</label>
                <select value={campaignForm.contentType} onChange={(e) => setCampaignForm({ ...campaignForm, contentType: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                  <option value="Akcije">Akcije</option>
                  <option value="Noviteti">Noviteti</option>
                  <option value="Seminari">Seminari</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#e0d8cc]">
              <button onClick={() => { setShowCampaignModal(false); setEditingCampaign(null); }} className="px-5 py-2.5 border border-[#e0d8cc] rounded-lg text-sm font-medium hover:bg-[#f5f0e8] transition-colors">{t("newsletter.cancel")}</button>
              <button onClick={handleSaveCampaign} disabled={!campaignForm.subject.trim()} className="px-5 py-2.5 bg-[#8c4a5a] text-white rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {editingCampaign ? t("newsletter.saveChanges") : t("newsletter.createCampaign")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
