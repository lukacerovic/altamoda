"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  XCircle, ArrowLeft, Loader2, Info, ChevronDown, ChevronUp,
  Package, Layers, BarChart3, X,
} from "lucide-react";

interface FileInfo {
  name: string;
  type: string;
  label: string;
  rows: number;
}

interface FileResult {
  fileName: string;
  fileType: string;
  fileLabel: string;
  rows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; name?: string; error: string }[];
  newBrands?: string[];
  newCategories?: string[];
}

interface ImportResponse {
  files: FileInfo[];
  results: FileResult[];
  totals: { created: number; updated: number; skipped: number; errors: number };
}

const FILE_TYPE_ICONS: Record<string, typeof Package> = {
  products: Package,
  categories: Layers,
  barcodes: BarChart3,
  altamoda_csv: FileSpreadsheet,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  products: "text-green-600 bg-green-50",
  categories: "text-blue-600 bg-blue-50",
  barcodes: "text-amber-600 bg-amber-50",
  altamoda_csv: "text-purple-600 bg-purple-50",
};

export default function ImportPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFile, setExpandedFile] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !existing.has(f.name))];
    });
    setResult(null);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));

      const res = await fetch("/api/products/import", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Greška pri importu");
      } else {
        setResult(json.data);
      }
    } catch {
      setError("Greška u konekciji sa serverom");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin/products" className="p-2 hover:bg-stone-100 rounded-sm transition-colors">
            <ArrowLeft size={18} className="text-[#666]" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-black">Uvoz proizvoda</h1>
            <p className="text-sm text-[#999]">Uvezite proizvode, kategorije i barkodove iz jednog ili više fajlova</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 flex gap-3">
          <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1.5">Podržani fajlovi</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-blue-700">
              <div className="flex items-center gap-2"><Package size={14} /> <span><strong>the_setItem</strong> — Proizvodi (cene, nazivi, brendovi)</span></div>
              <div className="flex items-center gap-2"><Layers size={14} /> <span><strong>tHE_SetItemCateg</strong> — Kategorije i brendovi</span></div>
              <div className="flex items-center gap-2"><BarChart3 size={14} /> <span><strong>tHE_SetItemExtItemSubj</strong> — Barkodovi</span></div>
              <div className="flex items-center gap-2"><FileSpreadsheet size={14} /> <span><strong>Alta Moda CSV</strong> — Naš format sa slikama</span></div>
            </div>
            <p className="mt-2 text-blue-600">Izaberite jedan ili više fajlova — sistem automatski prepoznaje tip i obrađuje ih pravilnim redosledom (kategorije → proizvodi → barkodovi).</p>
          </div>
        </div>

        {/* Upload area */}
        {!result && (
          <>
            <div
              className="border-2 border-dashed border-stone-300 rounded-sm p-8 text-center bg-stone-50 hover:border-stone-400 cursor-pointer transition-colors"
              onClick={() => inputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                multiple
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
                className="hidden"
              />
              <Upload size={40} className="mx-auto text-[#ccc] mb-3" />
              <p className="text-sm text-[#666]">Prevucite fajlove ovde ili <span className="text-black font-medium underline">izaberite fajlove</span></p>
              <p className="text-xs text-[#999] mt-1">CSV, XLSX ili XLS • Više fajlova odjednom • Maksimalno 10MB po fajlu</p>
            </div>

            {/* Selected files list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#999] font-medium uppercase tracking-wider">{files.length} {files.length === 1 ? 'fajl izabran' : 'fajlova izabrano'}</p>
                {files.map((f, i) => (
                  <div key={f.name} className="flex items-center gap-3 bg-white border border-stone-200 rounded-sm px-4 py-2.5">
                    <FileSpreadsheet size={20} className="text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{f.name}</p>
                      <p className="text-xs text-[#999]">{formatSize(f.size)}</p>
                    </div>
                    <button onClick={() => removeFile(i)} className="p-1 hover:bg-stone-100 rounded-sm">
                      <X size={16} className="text-[#999]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Import button */}
            {files.length > 0 && (
              <button
                onClick={handleImport}
                disabled={uploading}
                className="w-full py-3 bg-black text-white rounded-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 size={18} className="animate-spin" /> Uvoz u toku — obrađujem {files.length} {files.length === 1 ? 'fajl' : 'fajlova'}...</>
                ) : (
                  <><Upload size={18} /> Započni uvoz ({files.length} {files.length === 1 ? 'fajl' : 'fajlova'})</>
                )}
              </button>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-sm p-4">
            <div className="flex gap-3">
              <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Greška pri importu</p>
                <pre className="text-sm text-red-700 whitespace-pre-wrap font-sans">{error}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Summary banner */}
            <div className="bg-green-50 border border-green-200 rounded-sm p-4">
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Uvoz završen — {result.files.length} {result.files.length === 1 ? 'fajl obrađen' : 'fajlova obrađeno'}</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Redosled obrade: {result.files.map(f => f.label).join(' → ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Totals grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-stone-200 rounded-sm p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.totals.created}</p>
                <p className="text-xs text-[#999] mt-1">Kreirano</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-sm p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{result.totals.updated}</p>
                <p className="text-xs text-[#999] mt-1">Ažurirano</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-sm p-4 text-center">
                <p className="text-2xl font-bold text-[#999]">{result.totals.skipped}</p>
                <p className="text-xs text-[#999] mt-1">Preskočeno</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-sm p-4 text-center">
                <p className={`text-2xl font-bold ${result.totals.errors > 0 ? "text-red-500" : "text-[#999]"}`}>{result.totals.errors}</p>
                <p className="text-xs text-[#999] mt-1">Grešaka</p>
              </div>
            </div>

            {/* Per-file results */}
            {result.results.map((fr, idx) => {
              const Icon = FILE_TYPE_ICONS[fr.fileType] || FileSpreadsheet;
              const colors = FILE_TYPE_COLORS[fr.fileType] || "text-gray-600 bg-gray-50";
              const isExpanded = expandedFile === idx;

              return (
                <div key={idx} className="bg-white border border-stone-200 rounded-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedFile(isExpanded ? null : idx)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-50 text-left"
                  >
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${colors}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{fr.fileName}</p>
                      <p className="text-xs text-[#999]">{fr.fileLabel} • {fr.rows} redova</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {fr.created > 0 && <span className="text-green-600 font-medium">+{fr.created}</span>}
                      {fr.updated > 0 && <span className="text-blue-600 font-medium">~{fr.updated}</span>}
                      {fr.skipped > 0 && <span className="text-[#999]">-{fr.skipped}</span>}
                      {fr.errors.length > 0 && <span className="text-red-500 font-medium">{fr.errors.length} gr.</span>}
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-[#999]" /> : <ChevronDown size={16} className="text-[#999]" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-stone-200 px-4 py-3 space-y-3">
                      {/* New brands/categories */}
                      {((fr.newBrands && fr.newBrands.length > 0) || (fr.newCategories && fr.newCategories.length > 0)) && (
                        <div className="bg-amber-50 border border-amber-100 rounded-sm p-3 text-xs">
                          {fr.newBrands && fr.newBrands.length > 0 && (
                            <p className="text-amber-800">Novi brendovi: <strong>{fr.newBrands.join(", ")}</strong></p>
                          )}
                          {fr.newCategories && fr.newCategories.length > 0 && (
                            <p className="text-amber-800 mt-1">Nove kategorije: <strong>{fr.newCategories.join(", ")}</strong></p>
                          )}
                        </div>
                      )}

                      {/* Errors */}
                      {fr.errors.length > 0 && (
                        <div className="max-h-48 overflow-y-auto">
                          {fr.errors.map((err, i) => (
                            <div key={i} className="py-1.5 border-b border-stone-100 last:border-0 text-xs">
                              <span className="text-[#999] mr-1">Red {err.row}</span>
                              {err.name && <span className="text-black font-medium mr-1">{err.name}</span>}
                              <span className="text-red-600">{err.error}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {fr.errors.length === 0 && (
                        <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> Bez grešaka</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setFiles([]); setResult(null); setError(null); }}
                className="flex-1 py-2.5 bg-black text-white rounded-sm font-medium hover:bg-black/90 transition-colors text-sm"
              >
                Uvezi još fajlova
              </button>
              <Link
                href="/admin/products"
                className="flex-1 py-2.5 border border-stone-200 text-black rounded-sm font-medium hover:bg-stone-50 transition-colors text-sm text-center"
              >
                Nazad na proizvode
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
