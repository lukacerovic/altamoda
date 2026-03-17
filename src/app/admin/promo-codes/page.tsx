"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Copy,
  ToggleLeft,
  ToggleRight,
  Filter,
  X,
  RefreshCw,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PromoCode {
  id: number;
  code: string;
  type: "procentualni" | "fiksni";
  value: number;
  minOrder: number;
  usageCount: number;
  maxUses: number;
  maxUsesPerUser: number;
  validFrom: string;
  validTo: string;
  status: "active" | "expired" | "scheduled";
  target: "Svi" | "B2B" | "B2C";
  combinable: boolean;
  appliesTo: "Sve" | "Kategorija" | "Brend" | "Proizvod";
  appliesToValue: string;
}

const initialCodes: PromoCode[] = [
  { id: 1, code: "DOBRODOSLI10", type: "procentualni", value: 10, minOrder: 3000, usageCount: 245, maxUses: 500, maxUsesPerUser: 1, validFrom: "2026-01-01", validTo: "2026-06-30", status: "active", target: "Svi", combinable: false, appliesTo: "Sve", appliesToValue: "" },
  { id: 2, code: "B2B20", type: "procentualni", value: 20, minOrder: 15000, usageCount: 32, maxUses: 100, maxUsesPerUser: 3, validFrom: "2026-01-15", validTo: "2026-04-15", status: "active", target: "B2B", combinable: true, appliesTo: "Sve", appliesToValue: "" },
  { id: 3, code: "LETO500", type: "fiksni", value: 500, minOrder: 5000, usageCount: 150, maxUses: 150, maxUsesPerUser: 1, validFrom: "2025-06-01", validTo: "2025-09-01", status: "expired", target: "B2C", combinable: false, appliesTo: "Kategorija", appliesToValue: "Nega kose" },
  { id: 4, code: "KERASTASE15", type: "procentualni", value: 15, minOrder: 4000, usageCount: 78, maxUses: 200, maxUsesPerUser: 2, validFrom: "2026-02-01", validTo: "2026-05-01", status: "active", target: "Svi", combinable: false, appliesTo: "Brend", appliesToValue: "Kerastase" },
  { id: 5, code: "PROMO1000", type: "fiksni", value: 1000, minOrder: 8000, usageCount: 0, maxUses: 50, maxUsesPerUser: 1, validFrom: "2026-04-01", validTo: "2026-04-30", status: "scheduled", target: "B2C", combinable: true, appliesTo: "Sve", appliesToValue: "" },
  { id: 6, code: "SALON25", type: "procentualni", value: 25, minOrder: 20000, usageCount: 12, maxUses: 50, maxUsesPerUser: 5, validFrom: "2026-01-01", validTo: "2026-12-31", status: "active", target: "B2B", combinable: false, appliesTo: "Kategorija", appliesToValue: "Boje za kosu" },
  { id: 7, code: "BLACKFRIDAY30", type: "procentualni", value: 30, minOrder: 5000, usageCount: 500, maxUses: 500, maxUsesPerUser: 1, validFrom: "2025-11-25", validTo: "2025-11-29", status: "expired", target: "Svi", combinable: false, appliesTo: "Sve", appliesToValue: "" },
  { id: 8, code: "APRIL750", type: "fiksni", value: 750, minOrder: 6000, usageCount: 0, maxUses: 100, maxUsesPerUser: 1, validFrom: "2026-04-01", validTo: "2026-04-30", status: "scheduled", target: "Svi", combinable: true, appliesTo: "Proizvod", appliesToValue: "Moroccanoil Treatment" },
];

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "AM";
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>(initialCodes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Svi");
  const [typeFilter, setTypeFilter] = useState("Svi");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  const [form, setForm] = useState({
    code: "",
    type: "procentualni" as "procentualni" | "fiksni",
    value: "",
    minOrder: "",
    maxUses: "",
    maxUsesPerUser: "",
    validFrom: "",
    validTo: "",
    target: "Svi" as "Svi" | "B2B" | "B2C",
    combinable: false,
    appliesTo: "Sve" as "Sve" | "Kategorija" | "Brend" | "Proizvod",
    appliesToValue: "",
  });

  const filtered = codes.filter((c) => {
    if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "Svi" && c.status !== statusFilter) return false;
    if (typeFilter !== "Svi" && c.type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleStatus = (id: number) => {
    setCodes(codes.map((c) => c.id === id ? { ...c, status: c.status === "active" ? "expired" : "active" as PromoCode["status"] } : c));
  };

  const duplicateCode = (code: PromoCode) => {
    const newCode: PromoCode = {
      ...code,
      id: Math.max(...codes.map((c) => c.id)) + 1,
      code: code.code + "_COPY",
      usageCount: 0,
      status: "scheduled",
    };
    setCodes([...codes, newCode]);
  };

  const handleCreate = () => {
    const newCode: PromoCode = {
      id: Math.max(...codes.map((c) => c.id)) + 1,
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minOrder: Number(form.minOrder),
      usageCount: 0,
      maxUses: Number(form.maxUses),
      maxUsesPerUser: Number(form.maxUsesPerUser),
      validFrom: form.validFrom,
      validTo: form.validTo,
      status: "scheduled",
      target: form.target,
      combinable: form.combinable,
      appliesTo: form.appliesTo,
      appliesToValue: form.appliesToValue,
    };
    setCodes([...codes, newCode]);
    setShowModal(false);
    setForm({ code: "", type: "procentualni", value: "", minOrder: "", maxUses: "", maxUsesPerUser: "", validFrom: "", validTo: "", target: "Svi", combinable: false, appliesTo: "Sve", appliesToValue: "" });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      scheduled: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = { active: "Aktivan", expired: "Istekao", scheduled: "Zakazan" };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#1a1a1a]">Promo Kodovi</h1>
          <p className="text-[#666] mt-1">Upravljajte promotivnim kodovima i popustima</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#c8a96e] text-white px-5 py-2.5 rounded-lg hover:bg-[#b8994e] transition-colors font-medium text-sm"
        >
          <Plus size={18} />
          Novi promo kod
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Ukupno kodova", value: codes.length, color: "text-[#1a1a1a]" },
          { label: "Aktivni", value: codes.filter((c) => c.status === "active").length, color: "text-green-600" },
          { label: "Zakazani", value: codes.filter((c) => c.status === "scheduled").length, color: "text-blue-600" },
          { label: "Istekli", value: codes.filter((c) => c.status === "expired").length, color: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#e5e5e5] p-4">
            <p className="text-xs text-[#999] uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              type="text"
              placeholder="Pretraži kodove..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none"
          >
            <option value="Svi">Svi statusi</option>
            <option value="active">Aktivni</option>
            <option value="expired">Istekli</option>
            <option value="scheduled">Zakazani</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none"
          >
            <option value="Svi">Svi tipovi</option>
            <option value="procentualni">Procentualni</option>
            <option value="fiksni">Fiksni</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fafafa] border-b border-[#e5e5e5]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Kod</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Tip</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Vrednost</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Min. iznos</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Korišćenje</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Važi od/do</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Ciljna grupa</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[#666]">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((code) => (
                <tr key={code.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Ticket size={16} className="text-[#c8a96e]" />
                      <span className="font-mono font-semibold text-[#1a1a1a]">{code.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#666] capitalize">{code.type}</td>
                  <td className="px-4 py-3 font-semibold text-[#1a1a1a]">
                    {code.type === "procentualni" ? `${code.value}%` : `${code.value.toLocaleString()} RSD`}
                  </td>
                  <td className="px-4 py-3 text-[#666]">{code.minOrder.toLocaleString()} RSD</td>
                  <td className="px-4 py-3 text-[#666]">{code.usageCount}/{code.maxUses}</td>
                  <td className="px-4 py-3 text-[#666] text-xs">
                    <div>{code.validFrom}</div>
                    <div>{code.validTo}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#f5f5f5] text-[#666]">{code.target}</span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(code.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleStatus(code.id)}
                        className="p-1.5 hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        title={code.status === "active" ? "Deaktiviraj" : "Aktiviraj"}
                      >
                        {code.status === "active" ? (
                          <ToggleRight size={18} className="text-green-600" />
                        ) : (
                          <ToggleLeft size={18} className="text-[#999]" />
                        )}
                      </button>
                      <button
                        onClick={() => duplicateCode(code)}
                        className="p-1.5 hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        title="Dupliraj"
                      >
                        <Copy size={16} className="text-[#666]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e5e5]">
            <p className="text-sm text-[#666]">Prikazano {paginated.length} od {filtered.length} kodova</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] disabled:opacity-30">
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === i + 1 ? "bg-[#c8a96e] text-white" : "hover:bg-[#f5f5f5] text-[#666]"}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#e5e5e5]">
              <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">Novi promo kod</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#f5f5f5] rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Kod</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none font-mono"
                    placeholder="PROMO2026"
                  />
                  <button
                    onClick={() => setForm({ ...form, code: generateCode() })}
                    className="px-3 py-2 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg hover:bg-[#eee] transition-colors"
                  >
                    <RefreshCw size={16} className="text-[#666]" />
                  </button>
                </div>
              </div>
              {/* Type + Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Tip popusta</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "procentualni" | "fiksni" })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none">
                    <option value="procentualni">Procentualni (%)</option>
                    <option value="fiksni">Fiksni iznos (RSD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Vrednost {form.type === "procentualni" ? "(%)" : "(RSD)"}</label>
                  <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none" />
                </div>
              </div>
              {/* Min order */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Minimalni iznos porudzbine (RSD)</label>
                <input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none" />
              </div>
              {/* Max uses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Maks. koriscenja ukupno</label>
                  <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Maks. po korisniku</label>
                  <input type="number" value={form.maxUsesPerUser} onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none" />
                </div>
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Vazi od</label>
                  <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Vazi do</label>
                  <input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none" />
                </div>
              </div>
              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Ciljna grupa</label>
                <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value as "Svi" | "B2B" | "B2C" })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none">
                  <option value="Svi">Svi</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </div>
              {/* Combinable */}
              <div className="flex items-center justify-between bg-[#fafafa] rounded-lg p-3">
                <span className="text-sm text-[#333]">Kombinovati sa drugim kodovima?</span>
                <button
                  onClick={() => setForm({ ...form, combinable: !form.combinable })}
                  className="transition-colors"
                >
                  {form.combinable ? <ToggleRight size={28} className="text-[#c8a96e]" /> : <ToggleLeft size={28} className="text-[#999]" />}
                </button>
              </div>
              {/* Applies to */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Primenjuje se na</label>
                  <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value as "Sve" | "Kategorija" | "Brend" | "Proizvod" })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none">
                    <option value="Sve">Sve</option>
                    <option value="Kategorija">Kategorija</option>
                    <option value="Brend">Brend</option>
                    <option value="Proizvod">Proizvod</option>
                  </select>
                </div>
                {form.appliesTo !== "Sve" && (
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1">Izaberite {form.appliesTo.toLowerCase()}</label>
                    <select value={form.appliesToValue} onChange={(e) => setForm({ ...form, appliesToValue: e.target.value })} className="w-full px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:border-[#c8a96e] focus:outline-none">
                      <option value="">Izaberite...</option>
                      {form.appliesTo === "Kategorija" && ["Nega kose", "Boje za kosu", "Styling", "Ulja i serumi"].map((c) => <option key={c} value={c}>{c}</option>)}
                      {form.appliesTo === "Brend" && ["L'Oreal", "Schwarzkopf", "Kerastase", "Wella", "Moroccanoil"].map((b) => <option key={b} value={b}>{b}</option>)}
                      {form.appliesTo === "Proizvod" && ["Moroccanoil Treatment", "Elixir Ultime Serum", "BC Peptide Repair"].map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#e5e5e5]">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-[#e5e5e5] rounded-lg text-sm font-medium hover:bg-[#f5f5f5] transition-colors">Otkaži</button>
              <button onClick={handleCreate} className="px-5 py-2.5 bg-[#c8a96e] text-white rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors">Kreiraj kod</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
