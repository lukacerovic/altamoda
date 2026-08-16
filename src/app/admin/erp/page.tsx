"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package, Tag, Boxes, ShoppingCart, Loader2, CheckCircle2, XCircle,
  Clock, RotateCw, AlertTriangle, ChevronLeft, ChevronRight, Search,
  X, PackagePlus, Info,
} from "lucide-react";

type SyncType = "prices" | "stock" | "orders";

interface SyncLog {
  id: string;
  syncType: string;
  direction: "inbound" | "outbound";
  itemsSynced: number;
  status: "success" | "failed" | "in_progress";
  message: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface QueueItem {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  nextRetryAt: string | null;
  createdAt: string;
}

// "Proizvodi" (products) sync is deliberately NOT offered here: it creates a
// new Product for every Pantheon code with no matching erpId, using
// Pantheon's raw abbreviated names ("RK CG 7RO MARIGOLD") and no brand or
// category — it flooded the curated AMS catalog with ~1,950 junk rows the
// one time it was run (see scripts/cleanup-erroneous-pantheon-products.ts).
// The AMS Excel import at /admin/import is this catalog's only source of
// truth for which products exist; Pantheon is only trusted for prices/stock
// on products we've explicitly linked.
const SYNC_TYPES: { type: SyncType; label: string; hint: string; icon: typeof Package }[] = [
  { type: "prices", label: "Cene", hint: "Nabavna i prodajna cena iz Pantheon-a", icon: Tag },
  { type: "stock", label: "Lager", hint: "Stanje zaliha iz Pantheon-a", icon: Boxes },
  { type: "orders", label: "Porudžbine", hint: "Šalje porudžbine ka Pantheon-u (red čekanja)", icon: ShoppingCart },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "upravo sad";
  if (min < 60) return `pre ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `pre ${h}h`;
  return `pre ${Math.floor(h / 24)}d`;
}

interface PantheonUnlinkedProduct {
  code: string;
  name: string;
  priceWithVat: number;
  priceWithoutVat: number;
  stock: number;
  isActive: boolean;
}

function StatusBadge({ status }: { status: SyncLog["status"] }) {
  if (status === "success") {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><CheckCircle2 size={13} /> Uspešno</span>;
  }
  if (status === "failed") {
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><XCircle size={13} /> Neuspešno</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><Clock size={13} /> U toku</span>;
}

/**
 * "Review before import" modal — browse Pantheon products with no matching
 * Product.erpId, search/select a subset, and create bare-bones Product rows
 * (sku/name/price/stock/erpId only, per the disclaimer below). This is the
 * safe alternative to the old one-click "sync all products" flow that
 * flooded the catalog with ~1,950 unreviewed, brand-less rows in one run.
 */
function PantheonImportModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<PantheonUnlinkedProduct[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: { code: string; reason: string }[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/erp/pantheon-unlinked")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) setProducts(json.data.products);
        else setError(json.error || "Greška pri učitavanju");
      })
      .catch(() => { if (!cancelled) setError("Greška u konekciji sa serverom"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }, [products, search]);

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelected((prev) => {
      const allSelected = filtered.length > 0 && filtered.every((p) => prev.has(p.code));
      const next = new Set(prev);
      for (const p of filtered) {
        if (allSelected) next.delete(p.code);
        else next.add(p.code);
      }
      return next;
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const items = products.filter((p) => selected.has(p.code));
      const res = await fetch("/api/admin/erp/pantheon-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (json.success) {
        setResult({ created: json.data.created, skipped: json.data.skipped });
        // Drop successfully-imported rows from the list; keep the modal open
        // so the admin can see the result and keep going if they want.
        const skippedCodes = new Set((json.data.skipped as { code: string }[]).map((s) => s.code));
        setProducts((prev) => prev.filter((p) => !selected.has(p.code) || skippedCodes.has(p.code)));
        setSelected(new Set());
      } else {
        setError(json.error || "Uvoz nije uspeo");
      }
    } catch {
      setError("Greška u konekciji sa serverom");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-sm max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-black">Proizvodi u Pantheon-u kojih nema na sajtu</h2>
            <p className="text-xs text-[#1a1c1e]/60 mt-0.5">{loading ? "Učitavanje..." : `${products.length} proizvoda`}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-sm">
            <X size={18} className="text-[#1a1c1e]" />
          </button>
        </div>

        <div className="px-6 pt-4 flex-shrink-0">
          <div className="bg-blue-50 border border-blue-200 rounded-sm p-3 flex gap-2.5">
            <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Uvoz upisuje samo <strong>naziv, cenu i lager</strong> iz Pantheon-a — Pantheon ne šalje brend, kategoriju ni slike.
              Uvezeni proizvod je <strong>odmah vidljiv i na sajtu</strong>, iako je nedovršen; dopunite ga kroz izmenu proizvoda.
              Nedovršeni proizvodi se prikazuju u panelu &bdquo;Proizvodi sa nedostacima&ldquo; na stranici Proizvodi.
            </p>
          </div>
        </div>

        {result && (
          <div className="mx-6 mt-3 flex-shrink-0 bg-green-50 border border-green-200 rounded-sm p-3">
            <p className="text-sm text-green-800">
              <CheckCircle2 size={14} className="inline mr-1" />
              Uvezeno {result.created} proizvoda.
              {result.skipped.length > 0 && ` ${result.skipped.length} preskočeno.`}
            </p>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-3 flex-shrink-0 bg-red-50 border border-red-200 rounded-sm p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="px-6 py-3 flex-shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1c1e]/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži po nazivu ili šifri..."
              className="w-full pl-9 pr-3 py-2 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#1a1c1e]/50">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-16 text-sm text-[#1a1c1e]/50">
              {products.length === 0 ? "Svi Pantheon proizvodi su već povezani." : "Nema rezultata za tu pretragu."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wider text-[#1a1c1e]/60">
                  <th className="py-2 pr-2 w-8">
                    <button onClick={toggleAllFiltered} className="text-[#1a1c1e]/60 hover:text-black text-[10px] normal-case font-normal underline">
                      sve
                    </button>
                  </th>
                  <th className="py-2 pr-2 font-medium">Naziv</th>
                  <th className="py-2 pr-2 font-medium">Šifra</th>
                  <th className="py-2 pr-2 font-medium text-right">Cena</th>
                  <th className="py-2 pr-2 font-medium text-right">Lager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((p) => (
                  <tr
                    key={p.code}
                    className="cursor-pointer hover:bg-stone-50"
                    onClick={() => toggle(p.code)}
                  >
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.has(p.code)}
                        onChange={() => toggle(p.code)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-[#edb4bd]"
                      />
                    </td>
                    <td className="py-2 pr-2 text-[#1a1c1e] max-w-xs truncate">{p.name}</td>
                    <td className="py-2 pr-2 font-mono text-xs text-[#1a1c1e]/70">{p.code}</td>
                    <td className="py-2 pr-2 text-right text-[#1a1c1e] whitespace-nowrap">{p.priceWithVat.toLocaleString("sr-RS")} RSD</td>
                    <td className="py-2 pr-2 text-right text-[#1a1c1e]/70">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-[#1a1c1e]">{selected.size} izabrano</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-stone-200 text-black rounded-sm text-sm font-medium hover:bg-stone-50 transition-colors">
              Zatvori
            </button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="px-4 py-2 bg-[#edb4bd] text-white rounded-sm text-sm font-medium hover:bg-[#413d3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? <><Loader2 size={14} className="animate-spin" /> Uvoz...</> : `Uvezi izabrane (${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErpSyncPage() {
  const [syncing, setSyncing] = useState<SyncType | null>(null);
  const [lastResults, setLastResults] = useState<Partial<Record<SyncType, { ok: boolean; message: string }>>>({});
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [showPantheonModal, setShowPantheonModal] = useState(false);

  const loadLogs = useCallback(async (page: number) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/erp/sync/logs?page=${page}&limit=15`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs);
        setLogsTotalPages(json.data.pagination.totalPages || 1);
      }
    } catch {
      // best-effort — the page still works without history
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const res = await fetch(`/api/admin/erp/sync/queue?status=failed&limit=25`);
      const json = await res.json();
      if (json.success) setQueue(json.data.items);
    } catch {
      // best-effort
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(logsPage); }, [logsPage, loadLogs]);
  useEffect(() => { loadQueue(); }, [loadQueue]);

  // Most recent successful sync per type — computed from the currently loaded
  // page of logs (page 1 covers "just happened" reliably; older history lives
  // in the table below).
  const lastSuccessByType = new Map<string, SyncLog>();
  if (logsPage === 1) {
    for (const log of logs) {
      if (log.status === "success" && !lastSuccessByType.has(log.syncType)) {
        lastSuccessByType.set(log.syncType, log);
      }
    }
  }

  const triggerSync = async (type: SyncType) => {
    setSyncing(type);
    setLastResults((prev) => ({ ...prev, [type]: undefined }));
    try {
      const res = await fetch("/api/admin/erp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        const message =
          type === "orders"
            ? `Poslato ${d.succeeded ?? 0} / obrađeno ${d.processed ?? 0}${d.failed ? `, ${d.failed} neuspešno` : ""}`
            : `Sinhronizovano ${d.itemsSynced ?? 0}${typeof d.itemsCreated === "number" ? ` (novo: ${d.itemsCreated}, ažurirano: ${d.itemsUpdated ?? 0})` : ""}`;
        setLastResults((prev) => ({ ...prev, [type]: { ok: true, message } }));
      } else {
        setLastResults((prev) => ({ ...prev, [type]: { ok: false, message: json.error || "Greška" } }));
      }
    } catch {
      setLastResults((prev) => ({ ...prev, [type]: { ok: false, message: "Greška u konekciji sa serverom" } }));
    } finally {
      setSyncing(null);
      setLogsPage(1);
      loadLogs(1);
      if (type === "orders") loadQueue();
    }
  };

  const retryQueueItem = async (id: string) => {
    setRetryingId(id);
    try {
      await fetch("/api/admin/erp/sync/queue/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await loadQueue();
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-black">Pantheon sinhronizacija</h1>
            <p className="text-sm text-[#1a1c1e]">Ručno pokretanje i istorija sinhronizacije sa Pantheon ERP-om</p>
          </div>
          <button
            onClick={() => setShowPantheonModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-300 text-[#1a1c1e] rounded-sm text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            <PackagePlus size={16} /> Novi proizvodi iz Pantheon-a
          </button>
        </div>
      </div>

      {showPantheonModal && <PantheonImportModal onClose={() => setShowPantheonModal(false)} />}

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Sync trigger cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SYNC_TYPES.map(({ type, label, hint, icon: Icon }) => {
            const lastLog = lastSuccessByType.get(type);
            const result = lastResults[type];
            const isSyncing = syncing === type;
            return (
              <div key={type} className="bg-white border border-stone-200 rounded-sm p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#1a1c1e]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black">{label}</p>
                    <p className="text-[11px] text-[#1a1c1e]/70 leading-tight">{hint}</p>
                  </div>
                </div>

                <p className="text-[11px] text-[#1a1c1e]/60">
                  {lastLog ? `Poslednja: ${timeAgo(lastLog.startedAt)} · ${lastLog.itemsSynced}` : "Još nije pokretano"}
                </p>

                <button
                  onClick={() => triggerSync(type)}
                  disabled={syncing !== null}
                  className="w-full py-2 bg-[#edb4bd] text-white rounded-sm text-sm font-medium hover:bg-[#413d3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSyncing ? <><Loader2 size={14} className="animate-spin" /> U toku...</> : "Sinhronizuj sada"}
                </button>

                {result && (
                  <p className={`text-[11px] ${result.ok ? "text-green-700" : "text-red-600"}`}>
                    {result.ok ? <CheckCircle2 size={12} className="inline mr-1" /> : <XCircle size={12} className="inline mr-1" />}
                    {result.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Failed outbound queue */}
        {!queueLoading && queue.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 border-b border-amber-200">
              <AlertTriangle size={16} className="text-amber-600" />
              <p className="text-sm font-medium text-amber-800">{queue.length} porudžbina nije uspešno poslato u Pantheon</p>
            </div>
            <div className="divide-y divide-amber-100">
              {queue.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-900">
                      Porudžbina <span className="font-mono">{item.entityId}</span> · pokušaj {item.attempts}/{item.maxAttempts}
                    </p>
                    {item.lastError && <p className="text-[11px] text-amber-700 truncate">{item.lastError}</p>}
                  </div>
                  <button
                    onClick={() => retryQueueItem(item.id)}
                    disabled={retryingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-sm text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    {retryingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCw size={12} />}
                    Pokušaj ponovo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync history */}
        <div>
          <h2 className="text-sm font-semibold text-black mb-3">Istorija sinhronizacije</h2>
          <div className="bg-white border border-stone-200 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wider text-[#1a1c1e]/60">
                    <th className="px-4 py-2.5 font-medium">Tip</th>
                    <th className="px-4 py-2.5 font-medium">Smer</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Stavki</th>
                    <th className="px-4 py-2.5 font-medium">Poruka</th>
                    <th className="px-4 py-2.5 font-medium">Kada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {logsLoading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[#1a1c1e]/50"><Loader2 size={18} className="animate-spin inline" /></td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[#1a1c1e]/50 text-sm">Nema zabeleženih sinhronizacija još</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-2.5 capitalize">{log.syncType}</td>
                        <td className="px-4 py-2.5 text-[#1a1c1e]/70">{log.direction === "inbound" ? "Pantheon → sajt" : "Sajt → Pantheon"}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={log.status} /></td>
                        <td className="px-4 py-2.5">{log.itemsSynced}</td>
                        <td className="px-4 py-2.5 text-[#1a1c1e]/70 max-w-xs truncate">{log.message || "—"}</td>
                        <td className="px-4 py-2.5 text-[#1a1c1e]/60 whitespace-nowrap">{timeAgo(log.startedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {logsTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-stone-200">
                <button
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={logsPage <= 1}
                  className="p-1.5 rounded-sm hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-[#1a1c1e]/60">Strana {logsPage} / {logsTotalPages}</span>
                <button
                  onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
                  disabled={logsPage >= logsTotalPages}
                  className="p-1.5 rounded-sm hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
