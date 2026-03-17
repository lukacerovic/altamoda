"use client";

import { useState } from "react";
import {
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  ArrowRightLeft,
  ArrowRight,
  ArrowLeft,
  Package,
  Warehouse,
  DollarSign,
  ShoppingCart,
  Users,
  ToggleLeft,
  ToggleRight,
  Play,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";

interface SyncSetting {
  id: string;
  name: string;
  nameEn: string;
  direction: "in" | "out";
  enabled: boolean;
  lastSync: string;
  icon: "Package" | "Warehouse" | "DollarSign" | "ShoppingCart" | "Users";
  realtime?: boolean;
}

interface SyncLog {
  id: number;
  timestamp: string;
  type: string;
  direction: "Pantheon → Web" | "Web → Pantheon";
  itemsSynced: number;
  status: "success" | "error" | "warning";
  message: string;
}

const iconMap = { Package, Warehouse, DollarSign, ShoppingCart, Users };

const initialSettings: SyncSetting[] = [
  { id: "products", name: "Proizvodi", nameEn: "Products", direction: "in", enabled: true, lastSync: "2026-03-17 08:30", icon: "Package" },
  { id: "stock", name: "Lager", nameEn: "Stock", direction: "in", enabled: true, lastSync: "2026-03-17 09:15", icon: "Warehouse", realtime: true },
  { id: "prices", name: "Cene", nameEn: "Prices", direction: "in", enabled: true, lastSync: "2026-03-17 08:30", icon: "DollarSign" },
  { id: "orders", name: "Porudžbine", nameEn: "Orders", direction: "out", enabled: true, lastSync: "2026-03-17 09:10", icon: "ShoppingCart" },
  { id: "customers", name: "Novi kupci", nameEn: "New Customers", direction: "out", enabled: false, lastSync: "2026-03-16 22:00", icon: "Users" },
];

const initialLogs: SyncLog[] = [
  { id: 1, timestamp: "2026-03-17 09:15", type: "Lager", direction: "Pantheon → Web", itemsSynced: 342, status: "success", message: "Uspešno ažurirano stanje zaliha" },
  { id: 2, timestamp: "2026-03-17 09:10", type: "Porudžbine", direction: "Web → Pantheon", itemsSynced: 5, status: "success", message: "5 novih porudžbina poslato" },
  { id: 3, timestamp: "2026-03-17 08:30", type: "Proizvodi", direction: "Pantheon → Web", itemsSynced: 12, status: "success", message: "12 proizvoda ažurirano" },
  { id: 4, timestamp: "2026-03-17 08:30", type: "Cene", direction: "Pantheon → Web", itemsSynced: 45, status: "warning", message: "45 cena ažurirano, 3 proizvoda bez cene" },
  { id: 5, timestamp: "2026-03-16 22:00", type: "Kupci", direction: "Web → Pantheon", itemsSynced: 2, status: "success", message: "2 nova kupca registrovana" },
  { id: 6, timestamp: "2026-03-16 18:00", type: "Lager", direction: "Pantheon → Web", itemsSynced: 342, status: "success", message: "Redovno ažuriranje zaliha" },
  { id: 7, timestamp: "2026-03-16 15:30", type: "Porudžbine", direction: "Web → Pantheon", itemsSynced: 0, status: "error", message: "Greška pri slanju - timeout" },
  { id: 8, timestamp: "2026-03-16 12:00", type: "Proizvodi", direction: "Pantheon → Web", itemsSynced: 3, status: "success", message: "3 nova proizvoda dodata" },
  { id: 9, timestamp: "2026-03-16 08:30", type: "Cene", direction: "Pantheon → Web", itemsSynced: 120, status: "success", message: "Masovno ažuriranje cena" },
  { id: 10, timestamp: "2026-03-15 22:00", type: "Lager", direction: "Pantheon → Web", itemsSynced: 342, status: "success", message: "Redovno ažuriranje zaliha" },
];

export default function ErpPage() {
  const [connected] = useState(true);
  const [settings, setSettings] = useState(initialSettings);
  const [syncFrequency, setSyncFrequency] = useState("every15min");
  const [apiUrl, setApiUrl] = useState("https://pantheon.altamoda.rs/api/v1");
  const [apiKey, setApiKey] = useState("ak_live_xxxxxxxxxxxxxxxxxxxx");
  const [showApiKey, setShowApiKey] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const toggleSetting = (id: string) => {
    setSettings(settings.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const syncNow = (id: string) => {
    setSyncing(id);
    setTimeout(() => {
      setSettings(settings.map((s) => s.id === id ? { ...s, lastSync: new Date().toLocaleString("sr-RS") } : s));
      setSyncing(null);
    }, 1500);
  };

  const inbound = settings.filter((s) => s.direction === "in");
  const outbound = settings.filter((s) => s.direction === "out");

  const statusIcon = (status: string) => {
    if (status === "success") return <Check size={14} className="text-green-600" />;
    if (status === "error") return <X size={14} className="text-red-600" />;
    return <AlertTriangle size={14} className="text-yellow-600" />;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: "bg-green-100 text-green-700",
      error: "bg-red-100 text-red-700",
      warning: "bg-yellow-100 text-yellow-700",
    };
    const labels: Record<string, string> = { success: "Uspešno", error: "Greška", warning: "Upozorenje" };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{statusIcon(status)} {labels[status]}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#1a1a1a]">ERP Integracija</h1>
          <p className="text-[#666] mt-1">Pantheon ERP sinhronizacija i podešavanja</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`rounded-xl border-2 p-5 mb-6 ${connected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${connected ? "bg-green-100" : "bg-red-100"}`}>
              {connected ? <Wifi size={24} className="text-green-600" /> : <WifiOff size={24} className="text-red-600" />}
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a1a]">Pantheon ERP</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <span className={`text-sm font-medium ${connected ? "text-green-700" : "text-red-700"}`}>
                  {connected ? "Povezano" : "Nije povezano"}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#999]">Poslednja sinhronizacija</p>
            <p className="text-sm font-medium text-[#333] flex items-center gap-1"><Clock size={14} /> 2026-03-17 09:15</p>
          </div>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Inbound */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
          <div className="p-4 border-b border-[#e5e5e5] bg-[#fafafa]">
            <div className="flex items-center gap-2">
              <ArrowLeft size={16} className="text-blue-600" />
              <h3 className="font-semibold text-[#1a1a1a]">Pantheon → Webshop</h3>
            </div>
          </div>
          <div className="divide-y divide-[#f5f5f5]">
            {inbound.map((setting) => {
              const Icon = iconMap[setting.icon];
              return (
                <div key={setting.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#c8a96e]/10 flex items-center justify-center">
                        <Icon size={18} className="text-[#c8a96e]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-[#1a1a1a]">{setting.name}</span>
                          {setting.realtime && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full flex items-center gap-0.5">
                              <Zap size={10} /> Real-time
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#999]">Poslednje: {setting.lastSync}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => syncNow(setting.id)}
                        disabled={syncing === setting.id}
                        className="px-3 py-1.5 text-xs font-medium bg-[#f5f5f5] hover:bg-[#eee] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <RefreshCw size={12} className={syncing === setting.id ? "animate-spin" : ""} />
                        Sinhronizuj
                      </button>
                      <button onClick={() => toggleSetting(setting.id)}>
                        {setting.enabled ? <ToggleRight size={28} className="text-[#c8a96e]" /> : <ToggleLeft size={28} className="text-[#999]" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outbound */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
          <div className="p-4 border-b border-[#e5e5e5] bg-[#fafafa]">
            <div className="flex items-center gap-2">
              <ArrowRight size={16} className="text-green-600" />
              <h3 className="font-semibold text-[#1a1a1a]">Webshop → Pantheon</h3>
            </div>
          </div>
          <div className="divide-y divide-[#f5f5f5]">
            {outbound.map((setting) => {
              const Icon = iconMap[setting.icon];
              return (
                <div key={setting.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#c8a96e]/10 flex items-center justify-center">
                        <Icon size={18} className="text-[#c8a96e]" />
                      </div>
                      <div>
                        <span className="font-medium text-sm text-[#1a1a1a]">{setting.name}</span>
                        <p className="text-xs text-[#999]">Poslednje: {setting.lastSync}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => syncNow(setting.id)}
                        disabled={syncing === setting.id}
                        className="px-3 py-1.5 text-xs font-medium bg-[#f5f5f5] hover:bg-[#eee] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <RefreshCw size={12} className={syncing === setting.id ? "animate-spin" : ""} />
                        Sinhronizuj
                      </button>
                      <button onClick={() => toggleSetting(setting.id)}>
                        {setting.enabled ? <ToggleRight size={28} className="text-[#c8a96e]" /> : <ToggleLeft size={28} className="text-[#999]" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sync Frequency */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-6">
        <h3 className="font-semibold text-[#1a1a1a] mb-3">Učestalost sinhronizacije</h3>
        <select
          value={syncFrequency}
          onChange={(e) => setSyncFrequency(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none"
        >
          <option value="realtime">Real-time</option>
          <option value="every5min">Svakih 5 minuta</option>
          <option value="every15min">Svakih 15 minuta</option>
          <option value="everyhour">Svakih sat vremena</option>
          <option value="manual">Ručno</option>
        </select>
      </div>

      {/* Sync Log */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden mb-6">
        <div className="p-4 border-b border-[#e5e5e5]">
          <h3 className="font-semibold text-[#1a1a1a]">Sync Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fafafa] border-b border-[#e5e5e5]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Vreme</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Tip</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Smer</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Stavke</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Poruka</th>
              </tr>
            </thead>
            <tbody>
              {initialLogs.map((log) => (
                <tr key={log.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-3 text-[#666] text-xs whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3 font-medium text-[#333]">{log.type}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-[#666]">
                      <ArrowRightLeft size={12} />
                      {log.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#333] font-medium">{log.itemsSynced}</td>
                  <td className="px-4 py-3">{statusBadge(log.status)}</td>
                  <td className="px-4 py-3 text-[#666] text-xs">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
        <h3 className="font-semibold text-[#1a1a1a] mb-4">API Konfiguracija</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#333] mb-1">API URL</label>
            <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#333] mb-1">API Ključ</label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none font-mono"
              />
              <button onClick={() => setShowApiKey(!showApiKey)} className="px-3 py-2 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg hover:bg-[#eee] transition-colors">
                {showApiKey ? <EyeOff size={16} className="text-[#666]" /> : <Eye size={16} className="text-[#666]" />}
              </button>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c8a96e] text-white rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors">
            <Play size={16} />
            Testiraj konekciju
          </button>
        </div>
      </div>
    </div>
  );
}
