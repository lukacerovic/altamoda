"use client";

import { useState } from "react";
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
} from "lucide-react";

type Tab = "subscribers" | "campaigns" | "automations";

interface Subscriber {
  id: number;
  email: string;
  name: string;
  type: "B2B" | "B2C";
  subscribedDate: string;
  status: "active" | "unsubscribed";
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

const subscribers: Subscriber[] = [
  { id: 1, email: "marija@gmail.com", name: "Marija Petrović", type: "B2C", subscribedDate: "2026-01-15", status: "active" },
  { id: 2, email: "salon.glamur@gmail.com", name: "Salon Glamur", type: "B2B", subscribedDate: "2026-01-10", status: "active" },
  { id: 3, email: "jelena.j@yahoo.com", name: "Jelena Jovanović", type: "B2C", subscribedDate: "2026-01-08", status: "active" },
  { id: 4, email: "studio.lepota@gmail.com", name: "Studio Lepota", type: "B2B", subscribedDate: "2025-12-20", status: "active" },
  { id: 5, email: "ana.m@gmail.com", name: "Ana Milić", type: "B2C", subscribedDate: "2025-12-15", status: "active" },
  { id: 6, email: "frizer.raj@outlook.com", name: "Frizerski Raj", type: "B2B", subscribedDate: "2025-12-10", status: "active" },
  { id: 7, email: "nina.s@gmail.com", name: "Nina Stojanović", type: "B2C", subscribedDate: "2025-11-28", status: "unsubscribed" },
  { id: 8, email: "salon.stil@gmail.com", name: "Salon Stil", type: "B2B", subscribedDate: "2025-11-20", status: "active" },
  { id: 9, email: "tamara.d@gmail.com", name: "Tamara Đorđević", type: "B2C", subscribedDate: "2025-11-15", status: "active" },
  { id: 10, email: "beauty.centar@gmail.com", name: "Beauty Centar", type: "B2B", subscribedDate: "2025-11-10", status: "active" },
  { id: 11, email: "ivana.k@yahoo.com", name: "Ivana Kostić", type: "B2C", subscribedDate: "2025-10-25", status: "active" },
  { id: 12, email: "hair.studio@gmail.com", name: "Hair Studio Pro", type: "B2B", subscribedDate: "2025-10-18", status: "active" },
  { id: 13, email: "milica.p@gmail.com", name: "Milica Pavlović", type: "B2C", subscribedDate: "2025-10-10", status: "unsubscribed" },
  { id: 14, email: "salon.lux@gmail.com", name: "Salon Lux", type: "B2B", subscribedDate: "2025-09-30", status: "active" },
  { id: 15, email: "sofija.n@gmail.com", name: "Sofija Nikolić", type: "B2C", subscribedDate: "2025-09-20", status: "active" },
];

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
  const [activeTab, setActiveTab] = useState<Tab>("subscribers");
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("Svi");
  const [automations, setAutomations] = useState(initialAutomations);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ subject: "", segment: "Svi", contentType: "Akcije" });

  const filteredSubscribers = subscribers.filter((s) => {
    if (search && !s.email.toLowerCase().includes(search.toLowerCase()) && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (segmentFilter === "B2B" && s.type !== "B2B") return false;
    if (segmentFilter === "B2C" && s.type !== "B2C") return false;
    return true;
  });

  const toggleAutomation = (id: number) => {
    setAutomations(automations.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "subscribers", label: "Pretplatnici" },
    { id: "campaigns", label: "Kampanje" },
    { id: "automations", label: "Automatizacije" },
  ];

  const b2bCount = subscribers.filter((s) => s.type === "B2B" && s.status === "active").length;
  const b2cCount = subscribers.filter((s) => s.type === "B2C" && s.status === "active").length;
  const totalActive = subscribers.filter((s) => s.status === "active").length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#1a1a1a]">Newsletter</h1>
          <p className="text-[#666] mt-1">Upravljajte pretplatnicima i kampanjama</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f5f5] rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#666] hover:text-[#333]"}`}
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
            <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#999] uppercase tracking-wider">Ukupno aktivnih</p>
                  <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{totalActive}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#c8a96e]/10 flex items-center justify-center">
                  <Users size={20} className="text-[#c8a96e]" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#999] uppercase tracking-wider">B2B pretplatnici</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{b2bCount}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">B2B</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#999] uppercase tracking-wider">B2C pretplatnici</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{b2cCount}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">B2C</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <input type="text" placeholder="Pretraži pretplatnike..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none" />
              </div>
              <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)} className="px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none">
                <option value="Svi">Svi segmenti</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
              <button className="inline-flex items-center gap-2 px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm font-medium hover:bg-[#f5f5f5] transition-colors">
                <Download size={16} />
                Izvezi pretplatnike
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#fafafa] border-b border-[#e5e5e5]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Ime</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Tip</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Datum prijave</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-[#c8a96e]" />
                          <span className="text-[#333]">{sub.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#333]">{sub.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.type === "B2B" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {sub.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#666]">{sub.subscribedDate}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {sub.status === "active" ? "Aktivan" : "Odjavljen"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div>
          <div className="flex justify-end mb-6">
            <button onClick={() => setShowCampaignModal(true)} className="inline-flex items-center gap-2 bg-[#c8a96e] text-white px-5 py-2.5 rounded-lg hover:bg-[#b8994e] transition-colors font-medium text-sm">
              <Plus size={18} />
              Nova kampanja
            </button>
          </div>
          <div className="space-y-4">
            {initialCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-xl border border-[#e5e5e5] p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#1a1a1a] mb-2">{campaign.title}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs bg-[#f5f5f5] text-[#666] px-2 py-1 rounded">{campaign.segment}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === "sent" ? "bg-green-100 text-green-700" :
                        campaign.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {campaign.status === "sent" ? "Poslato" : campaign.status === "scheduled" ? "Zakazano" : "Nacrt"}
                      </span>
                      {campaign.sentDate && <span className="text-xs text-[#999]">{campaign.sentDate}</span>}
                    </div>
                  </div>
                  {campaign.status === "sent" && (
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-[#c8a96e]">
                          <Eye size={14} />
                          <span className="text-lg font-bold">{campaign.openRate}%</span>
                        </div>
                        <p className="text-xs text-[#999]">Otvoreno</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-[#c8a96e]">
                          <MousePointer size={14} />
                          <span className="text-lg font-bold">{campaign.clickRate}%</span>
                        </div>
                        <p className="text-xs text-[#999]">Kliknuto</p>
                      </div>
                    </div>
                  )}
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
              <div key={automation.id} className="bg-white rounded-xl border border-[#e5e5e5] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${automation.enabled ? "bg-[#c8a96e]/10" : "bg-gray-100"}`}>
                      <Icon size={20} className={automation.enabled ? "text-[#c8a96e]" : "text-gray-400"} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a1a1a] mb-1">{automation.name}</h3>
                      <p className="text-sm text-[#666] mb-2">{automation.description}</p>
                      <div className="flex items-center gap-3 text-xs text-[#999]">
                        <span className="bg-[#f5f5f5] px-2 py-0.5 rounded">Cilj: {automation.target}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Poslednji put: {automation.lastTriggered}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggleAutomation(automation.id)} className="flex-shrink-0">
                    {automation.enabled ? (
                      <ToggleRight size={32} className="text-[#c8a96e]" />
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCampaignModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#e5e5e5]">
              <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">Nova kampanja</h2>
              <button onClick={() => setShowCampaignModal(false)} className="p-1 hover:bg-[#f5f5f5] rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Naslov</label>
                <input type="text" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none" placeholder="Naslov kampanje..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Segment</label>
                <select value={campaignForm.segment} onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none">
                  <option value="Svi">Svi</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Tip sadržaja</label>
                <select value={campaignForm.contentType} onChange={(e) => setCampaignForm({ ...campaignForm, contentType: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none">
                  <option value="Akcije">Akcije</option>
                  <option value="Noviteti">Noviteti</option>
                  <option value="Seminari">Seminari</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#e5e5e5]">
              <button onClick={() => setShowCampaignModal(false)} className="px-5 py-2.5 border border-[#e5e5e5] rounded-lg text-sm font-medium hover:bg-[#f5f5f5] transition-colors">Otkaži</button>
              <button onClick={() => setShowCampaignModal(false)} className="px-5 py-2.5 bg-[#c8a96e] text-white rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors">Kreiraj kampanju</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
